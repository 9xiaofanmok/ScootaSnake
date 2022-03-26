// TODO: ADD END SCREEN (SCORE + RESULTS + PLAY AGAIN BUTTON)
// TODO: IF PLAYER LEAVE HALFWAY, END GAME
// TODO: WAITING AND COUNTDOWN SCREEN

const { Server } = require("socket.io");
const {
    initGame,
    randomFood,
    gameLoop,
    getUpdatedVelocity,
} = require("./game");
const { FRAME_RATE } = require("./constants");
const { makeId } = require("./utils");

const state = {};
const clientRooms = {};
let intervalId;

const io = new Server(process.env.port || 3000, {
    cors: {
        origin: "https://scootasnake.netlify.app/",
    },
});

io.on("connection", (client) => {
    client.on("newGame", handleNewGame);
    client.on("joinGame", handleJoinGame);
    client.on("keydown", handleKeydown);
    client.on("timerEnd", handleGameOver);
    client.on("resetGame", handleResetGame);

    function handleNewGame(noOfPlayers) {
        let roomName = makeId(5);
        clientRooms[client.id] = roomName;
        client.emit("gameCode", roomName);

        state[roomName] = initGame();

        state[roomName].activePlayers.push(1);

        switch (noOfPlayers) {
            case 2:
                state[roomName].gridsize = 20;
                break;
            case 3:
                state[roomName].gridsize = 25;
                break;
            case 4:
                state[roomName].gridsize = 30;
                break;
            case 5:
                state[roomName].gridsize = 35;
                break;
            default:
                state[roomName].gridsize = 15;
                break;
        }

        randomFood(state[roomName]);

        client.number = 1;
        client.join(roomName);

        const room = io.sockets.adapter.rooms.get(roomName);
        room.noOfPlayers = noOfPlayers;

        client.emit("init", 1, noOfPlayers);
    }

    function handleJoinGame(gameCode) {
        // get socket.io room by game code
        const room = io.sockets.adapter.rooms.get(gameCode);

        let numClients = 0;
        if (room) {
            numClients = room.size;
        }

        if (numClients === 0) {
            // if no players in the room
            client.emit("unknownGame");
            return;
        } else if (numClients > 5) {
            // too many players in the room
            client.emit("tooManyPlayers");
            return;
        }

        clientRooms[client.id] = gameCode; // add game code to current player's room
        client.join(gameCode); // add player to room

        const playerNo = numClients + 1;
        state[gameCode].activePlayers.push(playerNo);

        client.number = playerNo;
        client.emit("init", playerNo, room.noOfPlayers);

        if (playerNo === room.noOfPlayers) {
            console.log(state[gameCode]);
            startGameInterval(gameCode);
        }
    }

    function handleKeydown(keyCode) {
        const roomName = clientRooms[client.id];

        if (!roomName) {
            return;
        }

        try {
            keyCode = parseInt(keyCode);
        } catch (e) {
            console.error(e);
            return;
        }

        let vel = getUpdatedVelocity(keyCode).vel;
        const dir = getUpdatedVelocity(keyCode).direction;
        if (state[roomName]) {
            const player = state[roomName].players[client.number - 1];

            if (
                (player.direction === "left" && dir === "right") ||
                (player.direction === "right" && dir === "left") ||
                (player.direction === "up" && dir === "down") ||
                (player.direction === "down" && dir === "up")
            ) {
                vel = player.velocity;
            } else {
                player.direction = dir;
            }

            if (vel) {
                player.velocity = vel;
            }
        }
    }

    function handleGameOver() {
        const roomName = clientRooms[client.id];
        Math.max.apply(
            null,
            state[roomName].players.map((player) => player.score)
        );

        endGame(state, roomName);
    }

    function handleResetGame() {
        const roomName = clientRooms[client.id];
        resetGame(state[roomName]);
    }

    // startGameInterval(client, state);
});

function startGameInterval(roomName) {
    io.sockets.in(roomName).emit("startCountdown");

    intervalId = setInterval(() => {
        const room = io.sockets.adapter.rooms.get(roomName);

        // loser is a number, represents player if player loses
        const loser = gameLoop(state[roomName]);

        if (!loser) {
            emitGameState(roomName, state[roomName]);
        } else if (loser.score && loser.id) {
            console.log(`ADD SCORE TO: ${loser}`);
            const clients = io.sockets.adapter.rooms.get(roomName);
            for (let clientId of clients) {
                const client = io.sockets.sockets.get(clientId);
                if (client.number === loser.id) {
                    client.emit("addScore", loser.score);
                    break;
                }
            }
        } else {
            console.log(`LOSER: ${loser}`);
            const index = state[roomName].activePlayers.indexOf(loser);
            state[roomName].activePlayers.splice(index, 1);
            console.log(state[roomName]);
            room.noOfPlayers--;
        }

        if (state[roomName].activePlayers.length === 1) {
            const winner = state[roomName].activePlayers[0];
            endGame(state[roomName], roomName, winner);
        }
    }, 1000 / FRAME_RATE);
}

function emitGameState(roomName, state) {
    // emit the state to all the sockets in the room
    io.sockets.in(roomName).emit("gameState", JSON.stringify(state));
}

function emitGameOver(roomName, winner) {
    io.sockets.in(roomName).emit("gameOver", JSON.stringify({ winner }));
}

function endGame(roomState, roomName, winner) {
    emitGameOver(roomName, winner);
    resetGame(roomState);
}

function resetGame(roomState, roomName) {
    roomState = null;
    clearInterval(intervalId);
}
