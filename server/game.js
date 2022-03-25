function initGame() {
    return {
        players: [
            {
                id: 1,
                position: {
                    x: 3,
                    y: 10,
                },
                velocity: {
                    x: 0,
                    y: 0,
                },
                snake: [
                    { x: 1, y: 10 },
                    { x: 2, y: 10 },
                    { x: 3, y: 10 },
                ],
                direction: "",
                score: 0,
            },
            {
                id: 2,
                position: {
                    x: 10,
                    y: 16,
                },
                velocity: {
                    x: 0,
                    y: 0,
                },
                snake: [
                    { x: 10, y: 16 },
                    { x: 10, y: 17 },
                    { x: 10, y: 18 },
                ],
                direction: "",
                score: 0,
            },
            {
                id: 3,
                position: {
                    x: 15,
                    y: 3,
                },
                velocity: {
                    x: 0,
                    y: 0,
                },
                snake: [
                    { x: 15, y: 1 },
                    { x: 15, y: 2 },
                    { x: 15, y: 3 },
                ],
                direction: "",
                score: 0,
            },
            {
                id: 4,
                position: {
                    x: 25,
                    y: 28,
                },
                velocity: {
                    x: 0,
                    y: 0,
                },
                snake: [
                    { x: 25, y: 28 },
                    { x: 26, y: 28 },
                    { x: 27, y: 28 },
                ],
                direction: "",
                score: 0,
            },
            {
                id: 5,
                position: {
                    x: 30,
                    y: 20,
                },
                velocity: {
                    x: 0,
                    y: 0,
                },
                snake: [
                    { x: 30, y: 20 },
                    { x: 30, y: 21 },
                    { x: 30, y: 22 },
                ],
                direction: "",
                score: 0,
            },
        ],
        food: {},
        gridsize: 0,
        activePlayers: [],
    };
}

function gameLoop(state) {
    // if given empty state, return nth
    if (!state) {
        return;
    }

    for (let id of state.activePlayers) {
        loser = updatePlayer(state.players[id - 1], state);
        if (loser) {
            return loser;
        }
    }

    // no winner yet
    return false;
}

function updatePlayer(player, state) {
    player.position.x += player.velocity.x;
    player.position.y += player.velocity.y;

    // ensure player does not go out of screen
    if (
        player.position.x < 0 ||
        player.position.x > state.gridsize ||
        player.position.y < 0 ||
        player.position.y > state.gridsize
    ) {
        // TODO: change to return loser?
        console.log(`GAMEOVER: player ${player.id} out of screen`);
        return player.id;
    }

    // player eats food
    if (
        state.food.x === player.position.x &&
        state.food.y === player.position.y
    ) {
        player.snake.push({ ...player.position });
        player.position.x += player.velocity.x;
        player.position.y += player.velocity.y;
        player.score += 10;
        randomFood(state);
        return { score: player.score, id: player.id };
    }

    if (player.velocity.x || player.velocity.y) {
        for (let cell of player.snake) {
            // check if player eats itself
            if (cell.x === player.position.x && cell.y === player.position.y) {
                console.log(`GAMEOVER: ${player.id} eats ownself`);
                return player.id;
            }
        }

        // move snake forward
        player.snake.push({ ...player.position });
        player.snake.shift();
    }

    return false;
}

function randomFood(state) {
    food = {
        x: Math.floor(Math.random() * state.gridsize),
        y: Math.floor(Math.random() * state.gridsize),
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
            return { vel: { x: 0, y: -1 }, direction: "up" };
        }
        case 39: {
            // right
            return { vel: { x: 1, y: 0 }, direction: "right" };
        }
        case 40: {
            // up
            return { vel: { x: 0, y: 1 }, direction: "down" };
        }
        default: {
            return { vel: { x: 0, y: 0 }, direction: "" };
        }
    }
}

module.exports = {
    initGame,
    randomFood,
    gameLoop,
    getUpdatedVelocity,
};
