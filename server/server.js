// TODO: LEGEND PLAYER COLOR
// TODO: CHANGE TIME TO 60S, CHANGE VELOCITY BACK

const { Server } = require("socket.io");
const {
    initGame,
    randomFood,
    gameLoop,
    getUpdatedVelocity,
} = require("./game");
const { FRAME_RATE } = require("./constants");
const { makeId } = require("./utils");

const netlify = "https://scootasnake.netlify.app";
const localhost = "http://localhost:8080";

const state = {};
const clientRooms = {};
let intervalId;

// change origin between localhost and server url
const io = new Server(process.env.PORT || 3000, {
    cors: {
        origin: netlify,
    },
});

// connecting to frontend client
io.on("connection", (client) => {
    client.on("newGame", handleNewGame);
    client.on("joinGame", handleJoinGame);
    client.on("keydown", handleKeydown);
    client.on("timerEnd", handleTimerEnd);
    client.on("resetGame", handleResetGame);
    client.on("disconnect", (reason) => {
        console.log("DISCONNECTED: " + reason);
        if (reason === "transport close") {
            handlePlayerLeave();
        }
    });
    client.on("backBtn", handlePlayerLeave);

    function handleNewGame(noOfPlayers) {
        // create new room id
        let roomName = makeId(5);
        clientRooms[client.id] = roomName;
        client.emit("gameCode", roomName);

        // create new game state
        state[roomName] = initGame();

        // add first player to activePlayers array
        state[roomName].activePlayers.push(1);

        // change grid size based on no of players
        switch (noOfPlayers) {
            case 2:
            case 3:
                state[roomName].gridsize = 20;
                break;
            case 4:
            case 5:
                state[roomName].gridsize = 24;
                break;
            default:
                state[roomName].gridsize = 20;
        }

        // assign food position
        randomFood(state[roomName]);

        // assign player's number to socket client
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

        // if no players in the room
        if (numClients === 0) {
            client.emit("unknownGame");
            return;
        }
        // too many players in the room
        if (numClients >= room.noOfPlayers) {
            client.emit("tooManyPlayers");
            return;
        }

        // add game code to current player's room
        clientRooms[client.id] = gameCode;
        // add player to room
        client.join(gameCode);

        // add player number to activePlayers state
        const playerNo = numClients + 1;
        state[gameCode].activePlayers.push(playerNo);

        // assign player number to socket client state
        client.number = playerNo;

        // initiales game on client's side
        client.emit("init", playerNo, room.noOfPlayers);

        // start game if there are enough players
        if (playerNo === room.noOfPlayers) {
            io.sockets.in(gameCode).emit("startGame", state[gameCode]);
            // start game interval after the 3s countdown + 1s for delay
            setTimeout(startGameInterval, 4000, gameCode);
        }
    }

    function handleKeydown(keyCode) {
        // get room name
        const roomName = clientRooms[client.id];

        // if not in room, escape
        if (!roomName) {
            return;
        }

        // check if keycode is a number
        try {
            keyCode = parseInt(keyCode);
        } catch (e) {
            console.error(e);
            return;
        }

        if (
            keyCode === 37 ||
            keyCode === 38 ||
            keyCode === 39 ||
            keyCode === 40
        ) {
            // update velocity and direction
            let newVel = getUpdatedVelocity(keyCode).vel;
            const newDir = getUpdatedVelocity(keyCode).direction;

            if (state[roomName]) {
                // get player's state
                const playerState = state[roomName].players[client.number - 1];

                if (
                    (playerState.direction === "left" && newDir === "right") ||
                    (playerState.direction === "right" && newDir === "left") ||
                    (playerState.direction === "up" && newDir === "down") ||
                    (playerState.direction === "down" && newDir === "up")
                ) {
                    // if going in same orientation, don't change direction
                    newVel = playerState.velocity;
                } else {
                    playerState.direction = newDir;
                }

                if (newVel) {
                    playerState.velocity = newVel;
                }
            }
        }
    }

    function handleTimerEnd() {
        const roomName = clientRooms[client.id];

        // getting active players' states
        const activePlayers = state[roomName].players.filter((player) => {
            const tmp = state[roomName].activePlayers;
            for (let i = 0; i < tmp.length; i++) {
                if (player.id === tmp[i]) {
                    return true;
                }
            }
            state[roomName].activePlayers.forEach((activePlayer) => {});
            return false;
        });

        // get highest score of active players
        const highestScore = Math.max.apply(
            null,
            activePlayers.map((player) => player.score)
        );

        // get all the clients in the room
        const clients = io.sockets.adapter.rooms.get(roomName);

        for (let player of activePlayers) {
            for (let clientId of clients) {
                const client = io.sockets.sockets.get(clientId);
                if (client.number === player.id) {
                    // make sure highest score must be > 0
                    if (highestScore > 0 && player.score === highestScore) {
                        console.log(`WINNER: ${player.id}`);
                        client.emit("timerEnd", player.score, player.id);
                    } else {
                        console.log(`LOSER: ${player.id}`);
                        client.emit("timerEnd", player.score);
                    }
                    break;
                }
            }
        }
        resetGame(state);
    }

    function handleResetGame() {
        const roomName = clientRooms[client.id];
        resetGame(state[roomName]);
    }

    function handlePlayerLeave() {
        const roomName = clientRooms[client.id];
        const room = io.sockets.adapter.rooms.get(roomName);
        if (client.number && room) {
            console.log("PLAYER LEAVE: " + client.number);

            const index = state[roomName].activePlayers.indexOf(client.number);
            state[roomName].activePlayers.splice(index, 1);
            room.noOfPlayers--;

            // if left one player, reset game state
            if (state[roomName].activePlayers.length === 0) {
                handleResetGame();
            }
        }
    }
});

function startGameInterval(roomName) {
    intervalId = setInterval(() => {
        const room = io.sockets.adapter.rooms.get(roomName);

        const player = gameLoop(state[roomName]);

        if (!player) {
            emitGameState(roomName, state[roomName]);
        } else if (!player.end) {
            console.log(`ADD SCORE TO: ${player.id}`);
            const clients = io.sockets.adapter.rooms.get(roomName);
            for (let clientId of clients) {
                const client = io.sockets.sockets.get(clientId);
                if (client.number === player.id) {
                    client.emit("addScore", player.score);
                    break;
                }
            }
        } else {
            console.log(`LOSER: ${player.id}`);

            // remove loser from activePlayers array
            const index = state[roomName].activePlayers.indexOf(player.id);
            state[roomName].activePlayers.splice(index, 1);
            room.noOfPlayers--;

            const clients = io.sockets.adapter.rooms.get(roomName);
            for (let clientId of clients) {
                const client = io.sockets.sockets.get(clientId);
                if (client.number === player.id) {
                    client.emit("gameOver", player.score, player.reason);
                    break;
                }
            }

            // if left one player, the player is automatically the winner
            // if (state[roomName].activePlayers.length === 1) {
            //     const winnerIndex = state[roomName].activePlayers[0] - 1;
            //     const winner = state[roomName].players[winnerIndex];

            //     const clients = io.sockets.adapter.rooms.get(roomName);
            //     for (let clientId of clients) {
            //         const client = io.sockets.sockets.get(clientId);
            //         if (client.number === winner.id) {
            //             console.log(`WINNER: ${winner.id}`);
            //             client.emit("gameOver", winner.score, true);
            //             break;
            //         }
            //     }
            //     resetGame(state[roomName]);
            // }
        }
    }, 1000 / FRAME_RATE);
}

function emitGameState(roomName, state) {
    // emit the state to all the sockets in the room
    io.sockets.in(roomName).emit("gameState", JSON.stringify(state));
}

// reset game state
function resetGame(roomState) {
    roomState = null;
    clearInterval(intervalId);
}
