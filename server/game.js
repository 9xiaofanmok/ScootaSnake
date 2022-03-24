const { GRID_SIZE } = require("./constants");

function initGame() {
    const state = createGameState();
    randomFood(state);
    return state;
}

function createGameState() {
    return {
        player: {
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
        food: {
            x: 7,
            y: 7,
        },
        gridsize: GRID_SIZE,
    };
}

function gameLoop(state) {
    // if given empty state, return nth
    if (!state) {
        return;
    }

    const playerOne = state.player;

    // mover player based on velocity --> 1 x means right, -1 x means left
    playerOne.position.x += playerOne.velocity.x;
    playerOne.position.y += playerOne.velocity.y;

    // ensure player does not go out of screen
    if (
        playerOne.position.x < 0 ||
        playerOne.position.x > GRID_SIZE ||
        playerOne.position.y < 0 ||
        playerOne.position.y > GRID_SIZE
    ) {
        // change to return loser?
        console.log("GAMEOVER: player out of screen");
        return 2;
    }

    if (
        state.food.x === playerOne.position.x &&
        state.food.y === playerOne.position.y
    ) {
        playerOne.snake.push({ ...playerOne.position });
        playerOne.position.x += playerOne.velocity.x;
        playerOne.position.y += playerOne.velocity.y;
        randomFood(state);
    }

    if (playerOne.velocity.x || playerOne.velocity.y) {
        for (let i = 0; i < playerOne.snake.length; i++) {
            // check if player eats itself
            // if player goes back to itself it's okay but
            // if too long also will die
            if (
                playerOne.snake[i].x === playerOne.position.x &&
                playerOne.snake[i].y === playerOne.position.y
            ) {
            }

            if (
                playerOne.snake[i].x === playerOne.position.x &&
                playerOne.snake[i].y === playerOne.position.y
            ) {
                console.log("GAMEOVER: player eats ownself");
                return 2;
            }
        }

        // move snake forward
        playerOne.snake.push({ ...playerOne.position });
        playerOne.snake.shift();
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
    for (let cell of state.player.snake) {
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
    }
}

module.exports = {
    initGame,
    gameLoop,
    getUpdatedVelocity,
};
