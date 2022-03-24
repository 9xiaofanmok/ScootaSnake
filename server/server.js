const { Server } = require("socket.io");
const { initGame, gameLoop, getUpdatedVelocity } = require("./game");
const { FRAME_RATE } = require("./constants");
const { makeId } = require("./utils");

const state = {};
const clientRooms = {};

const io = new Server(3000, {
    cors: {
        origin: "http://localhost:8080",
    },
});

io.on("connection", (client) => {
    client.on("newGame", handleNewGame);
    client.on("joinGame", handleJoinGame);
    client.on("keydown", handleKeydown);

    function handleNewGame() {
        let roomName = makeId(5);
        clientRooms[client.id] = roomName;
        client.emit("gameCode", roomName);

        state[roomName] = initGame();

        client.join(roomName);
        client.number = 1;
        client.emit("init", 1);
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
        } else if (numClients > 1) {
            // too many players in the room
            client.emit("tooManyPlayers");
            return;
        }

        clientRooms[client.id] = gameCode; // add game code to current player's room
        client.join(gameCode); // add player to room
        client.number = 2;
        client.emit("init", 2);

        startGameInterval(gameCode);
    }

    function handleKeydown(keyCode) {
        const roomName = clientRooms[client.id];
        const player = state[roomName].players[client.number - 1];

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

    // startGameInterval(client, state);
});

function startGameInterval(roomName) {
    const intervalId = setInterval(() => {
        // winner is a number, represents player if player wins
        const winner = gameLoop(state[roomName]);
        // console.log(state);
        // console.log(`WINNER: ${winner}`);

        if (!winner) {
            emitGameState(roomName, state[roomName]);
            // client.emit("gameState", JSON.stringify(state));
        } else {
            emitGameOver(roomName, winner);
            state[roomName] = null;
            // client.emit("gameOver");
            clearInterval(intervalId);
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
