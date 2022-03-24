const { GRID_SIZE } = require("./constants");

function initGame() {
    const state = createGameState();
    randomFood(state);
    return state;
}

function createGameState() {
    return {
        players: [
            {
                position: {
                    x: 3,
                    y: 10,
                },
                velocity: {
                    x: 1,
                    y: 0,
                },
                snake: [
                    { x: 1, y: 10 },
                    { x: 2, y: 10 },
                    { x: 3, y: 10 },
                ],
                direction: "right",
            },
            {
                position: {
                    x: 10,
                    y: 17,
                },
                velocity: {
                    x: 0,
                    y: 0,
                },
                snake: [
                    { x: 10, y: 17 },
                    { x: 10, y: 18 },
                    { x: 10, y: 19 },
                ],
                direction: "up",
            },
        ],
        food: {},
        gridsize: GRID_SIZE,
    };
}

function gameLoop(state) {
    // if given empty state, return nth
    if (!state) {
        return;
    }

    const playerOne = state.players[0];
    const playerTwo = state.players[1];

    // mover player based on velocity --> 1 x means right, -1 x means left
    playerOne.position.x += playerOne.velocity.x;
    playerOne.position.y += playerOne.velocity.y;

    playerTwo.position.x += playerTwo.velocity.x;
    playerTwo.position.y += playerTwo.velocity.y;

    // ensure player does not go out of screen
    if (
        playerOne.position.x < 0 ||
        playerOne.position.x > GRID_SIZE ||
        playerOne.position.y < 0 ||
        playerOne.position.y > GRID_SIZE
    ) {
        // TODO: change to return loser?
        console.log("GAMEOVER: player 1 out of screen");
        return 2;
    }
    if (
        playerTwo.position.x < 0 ||
        playerTwo.position.x > GRID_SIZE ||
        playerTwo.position.y < 0 ||
        playerTwo.position.y > GRID_SIZE
    ) {
        // TODO: change to return loser?
        console.log("GAMEOVER: player 2 out of screen");
        return 1;
    }

    // player eats food
    if (
        state.food.x === playerOne.position.x &&
        state.food.y === playerOne.position.y
    ) {
        playerOne.snake.push({ ...playerOne.position });
        playerOne.position.x += playerOne.velocity.x;
        playerOne.position.y += playerOne.velocity.y;
        randomFood(state);
    }
    if (
        state.food.x === playerTwo.position.x &&
        state.food.y === playerTwo.position.y
    ) {
        playerTwo.snake.push({ ...playerTwo.position });
        playerTwo.position.x += playerTwo.velocity.x;
        playerTwo.position.y += playerTwo.velocity.y;
        randomFood(state);
    }

    if (playerOne.velocity.x || playerOne.velocity.y) {
        for (let cell of playerOne.snake) {
            // check if player eats itself
            if (
                cell.x === playerOne.position.x &&
                cell.y === playerOne.position.y
            ) {
                console.log("GAMEOVER: player 1 eats ownself");
                return 2;
            }
        }

        // move snake forward
        playerOne.snake.push({ ...playerOne.position });
        playerOne.snake.shift();
    }

    if (playerTwo.velocity.x || playerTwo.velocity.y) {
        for (let cell of playerTwo.snake) {
            // check if player eats itself
            if (
                cell.x === playerTwo.position.x &&
                cell.y === playerTwo.position.y
            ) {
                console.log("GAMEOVER: player 2 eats ownself");
                return 1;
            }
        }

        // move snake forward
        playerTwo.snake.push({ ...playerTwo.position });
        playerTwo.snake.shift();
    }

    // no winner yet
    return false;
}

function randomFood(state) {
    food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
    };

    // make sure food is not position on a snake
    for (let cell of state.players[0].snake) {
        if (cell.x === food.x && cell.y === food.y) {
            return randomFood(state);
        }
    }
    for (let cell of state.players[1].snake) {
        if (cell.x === food.x && cell.y === food.y) {
            return randomFood(state);
        }
    }

    state.food = food;
}

function getUpdatedVelocity(keyCode) {
    switch (keyCode) {
        case 37: {
            // left
            return { vel: { x: -1, y: 0 }, direction: "left" };
        }
        case 38: {
            // down
            return { vel: { x: 0, y: -1 }, direction: "down" };
        }
        case 39: {
            // right
            return { vel: { x: 1, y: 0 }, direction: "right" };
        }
        case 40: {
            // up
            return { vel: { x: 0, y: 1 }, direction: "up" };
        }
        default: {
            return { vel: { x: 0, y: 0 }, direction: "" };
        }
    }
}

module.exports = {
    initGame,
    gameLoop,
    getUpdatedVelocity,
};
