// TODO: ADD INITIAL VELOCITY AND DIRECTION TO PLAYERS
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
                    x: 1,
                    y: 0,
                },
                snake: [
                    { x: 1, y: 10 },
                    { x: 2, y: 10 },
                    { x: 3, y: 10 },
                ],
                direction: "right",
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
                    y: -1,
                },
                snake: [
                    { x: 10, y: 16 },
                    { x: 10, y: 17 },
                    { x: 10, y: 18 },
                ],
                direction: "up",
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
                    y: 1,
                },
                snake: [
                    { x: 15, y: 1 },
                    { x: 15, y: 2 },
                    { x: 15, y: 3 },
                ],
                direction: "down",
                score: 0,
            },
            {
                id: 4,
                position: {
                    x: 16,
                    y: 18,
                },
                velocity: {
                    x: -1,
                    y: 0,
                },
                snake: [
                    { x: 16, y: 18 },
                    { x: 17, y: 18 },
                    { x: 18, y: 18 },
                ],
                direction: "left",
                score: 0,
            },
            {
                id: 5,
                position: {
                    x: 3,
                    y: 5,
                },
                velocity: {
                    x: 0,
                    y: 1,
                },
                snake: [
                    { x: 3, y: 3 },
                    { x: 3, y: 4 },
                    { x: 3, y: 5 },
                ],
                direction: "down",
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

    // loop through all active players to update state's position
    for (let id of state.activePlayers) {
        let result = updatePlayer(state.players[id - 1], state);
        if (result) {
            return result;
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
        return {
            score: player.score,
            id: player.id,
            end: true,
            reason: "YOU WENT OUT OF SCREEN",
        };
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
        return { score: player.score, id: player.id, end: false, reason: "" };
    }

    if (player.velocity.x || player.velocity.y) {
        for (let cell of player.snake) {
            // check if player eats itself
            if (cell.x === player.position.x && cell.y === player.position.y) {
                console.log(`GAMEOVER: ${player.id} eats ownself`);
                return {
                    score: player.score,
                    id: player.id,
                    end: true,
                    reason: "YOU ATE YOURSELF!",
                };
            }
        }

        // move snake forward
        player.snake.push({ ...player.position });
        player.snake.shift();
    }

    return false;
}

// spawn food
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

// update player's velocity and direction based on arrow keys they pressed
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
            return;
        }
    }
}

module.exports = {
    initGame,
    randomFood,
    gameLoop,
    getUpdatedVelocity,
};
