const { Server } = require("socket.io");
const { initGame, gameLoop, getUpdatedVelocity } = require("./game");
const { FRAME_RATE } = require("./constants");

const state = {};
const clientRooms = {};

const io = new Server(3000, {
    cors: {
        origin: "http://localhost:8080",
    },
});

io.on("connection", (client) => {
    client.on("newGame", handleNewGame);
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

    function handleKeydown(keyCode) {
        try {
            keyCode = parseInt(keyCode);
        } catch (e) {
            console.error(e);
            return;
        }

        let vel = getUpdatedVelocity(keyCode).vel;
        const dir = getUpdatedVelocity(keyCode).direction;

        if (
            (gameState.player.direction === "left" && dir === "right") ||
            (gameState.player.direction === "right" && dir === "left") ||
            (gameState.player.direction === "up" && dir === "down") ||
            (gameState.player.direction === "down" && dir === "up")
        ) {
            vel = gameState.player.velocity;
        } else {
            gameState.player.direction = dir;
        }

        if (vel) {
            gameState.player.velocity = vel;
        }
    }

    startGameInterval(client, gameState);
});

function startGameInterval(client, state) {
    const intervalId = setInterval(() => {
        // winner is a number, represents player if player wins
        const winner = gameLoop(state);
        console.log(state);
        console.log(`WINNER: ${winner}`);

        if (!winner) {
            client.emit("gameState", JSON.stringify(state));
        } else {
            client.emit("gameOver");
            clearInterval(intervalId);
        }
    }, 1000 / FRAME_RATE);
}
