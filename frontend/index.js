const BG_COLOUR = "#231f20";
const SNAKE_COLOUR = ["#FFE900", "#FB5012", "#01FDF6", "#CBBAED", "#03FCBA"];
const FOOD_COLOUR = "#fff";
const localhost = "http://localhost:3000";
const heroku = "https://limitless-hollows-28517.herokuapp.com";

const socket = io(heroku);

socket.on("init", handleInit);
socket.on("gameState", handleGameState);
socket.on("gameCode", handleGameCode);
socket.on("startGame", handleStartGame);
socket.on("addScore", handleNewScore);

socket.on("timerEnd", handleTimerEnd);
socket.on("gameOver", handleGameOver);

socket.on("unknownGame", handleUnknownGame);
socket.on("tooManyPlayers", handleTooManyPlayers);

let canvas, ctx, playerNumber, players;
let gameActive = false;
const startingMinutes = 1;
let time = startingMinutes * 59;
let intervalId, timeoutId;

const initialScreen = document.getElementById("initialScreen");
const noOfPlayers = document.getElementById("noOfPlayers");
const newGameBtn = document.getElementById("newGameButton");
const joinGameBtn = document.getElementById("joinGameButton");
const gameCodeInput = document.getElementById("gameCodeInput");
const gameCodeDisplay = document.getElementById("gameCodeDisplay");
const colorDisplay = document.getElementById("colorDisplay");

const gameScreen = document.getElementById("gameScreen");
const backBtn = document.getElementById("backButton");
const timer = document.getElementById("timer");
const score = document.getElementById("score");

const resultsScreen = document.getElementById("resultsScreen");
const result = document.getElementById("result");
const promoCode = document.getElementById("promoCode");
const finalScore = document.getElementById("finalScore");
const playAgainBtn = document.getElementById("playAgainButton");

players = parseInt(noOfPlayers.value);

noOfPlayers.addEventListener("change", (e) => {
    players = parseInt(e.target.value);
});
newGameBtn.addEventListener("click", newGame);
joinGameBtn.addEventListener("click", joinGame);

backBtn.addEventListener("click", () => {
    socket.emit("backBtn");
    clearTimeout(timeoutId);
    clearInterval(intervalId);
    reset();
});

playAgainBtn.addEventListener("click", () => {
    reset();
    socket.emit("resetGame");
});

function newGame() {
    socket.emit("newGame", players);
    init();
}

function joinGame() {
    const gameCode = gameCodeInput.value;
    socket.emit("joinGame", gameCode);
    gameCodeDisplay.innerText = gameCode;
}

function init() {
    initialScreen.style.display = "none";
    gameScreen.style.display = "block";

    // initialise canvas
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    // change canvas size based on no of players
    switch (players) {
        case 2:
        case 3:
            canvas.width = canvas.height = 500;
            break;
        case 4:
        case 5:
            canvas.width = canvas.height = 600;
            break;
        default:
            canvas.width = canvas.height = 500;
    }

    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "12px 'Press Start 2P'";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(
        "Waiting for other players...",
        canvas.width / 2,
        canvas.height / 2
    );

    document.addEventListener("keydown", keydown);
    gameActive = true;
}

function handleInit(number, noOfPlayers) {
    playerNumber = number;
    players = noOfPlayers;
    colorDisplay.style.backgroundColor = SNAKE_COLOUR[playerNumber - 1];
    init();
}

function handleStartGame(state) {
    handleStartCountdown(state);
    // delay by 4 seconds before starting game timer
    timeoutId = setTimeout(handleStartTimer, 4000);
}

// countdown 3 seconds before game starts
function handleStartCountdown(state) {
    let countdownTime = 3;

    const countdownId = setInterval(() => {
        if (countdownTime === 0) {
            clearInterval(countdownId);
        } else {
            ctx.fillStyle = BG_COLOUR;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = "20px 'Press Start 2P'";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";

            ctx.fillText(
                "GAME IS STARTING IN",
                canvas.width / 2,
                canvas.height / 2 - 40
            );

            ctx.fillText(countdownTime, canvas.width / 2, canvas.height / 2);
            ctx.fillText(
                "YOUR COLOR:  ",
                canvas.width / 2,
                canvas.height / 2 + 45
            );

            let x = 14;
            let y = 11;
            const gridsize = state.gridsize;
            const size = canvas.width / gridsize;

            if (canvas.width > 500) {
                x += 2;
                y += 2;
            }

            ctx.fillStyle = SNAKE_COLOUR[playerNumber - 1];
            ctx.fillRect(x * size, y * size, size, size);

            countdownTime--;
        }
    }, 1000);
    return;
}

function handleStartTimer() {
    intervalId = setInterval(() => {
        let minutes = Math.floor(time / 60);
        minutes = minutes < 10 ? "0" + minutes : minutes;
        let seconds = time % 60;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        timer.innerText = `${minutes}:${seconds}`;
        time--;

        if (time < 0) {
            clearInterval(intervalId);
            socket.emit("timerEnd");
        }
    }, 1000);
}

function keydown(e) {
    socket.emit("keydown", e.keyCode);
}

// paint game at each frame based on frame rate to update player and food position
function paintGame(state) {
    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const food = state.food;
    const gridsize = state.gridsize;
    const size = canvas.width / gridsize;

    ctx.fillStyle = FOOD_COLOUR;
    ctx.fillRect(food.x * size, food.y * size, size, size);

    for (let id of state.activePlayers) {
        paintPlayer(state.players[id - 1], size, SNAKE_COLOUR[id - 1]);
    }
}

function paintPlayer(playerState, size, colour) {
    const snake = playerState.snake;

    ctx.fillStyle = colour;
    for (let cell of snake) {
        ctx.fillRect(cell.x * size, cell.y * size, size, size);
    }
}

// paint game based on game state
function handleGameState(gameState) {
    if (!gameActive) {
        return;
    }
    gameState = JSON.parse(gameState);
    requestAnimationFrame(() => paintGame(gameState));
}

// handle player lose
function handleGameOver(score, reason) {
    if (!gameActive) {
        return;
    }

    gameScreen.style.display = "none";
    resultsScreen.style.display = "block";

    result.innerHTML = `YOU LOST!<br/>${reason}`;

    finalScore.innerHTML = score;
    clearInterval(intervalId);
    gameActive = false;
}

// end game once timer ends
function handleTimerEnd(score, playerId) {
    if (!gameActive) {
        return;
    }

    gameScreen.style.display = "none";
    resultsScreen.style.display = "block";

    if (playerId && playerId === playerNumber) {
        result.innerHTML = "&#127881; YOU WON! &#127881;";
        promoCode.innerHTML = "PROMO CODE: ABC123";
    } else if (score > 0) {
        result.innerHTML = "YOU LOST!<br/>YOUR FRIEND GOT A HIGHER SCORE";
    } else {
        result.innerHTML = "YOU LOST!<br/>YOU DIDN'T EAT ANY FOOD :(";
    }

    finalScore.innerHTML = score;
    clearInterval(intervalId);
    gameActive = false;
}

// update player's game code
function handleGameCode(gameCode) {
    gameCodeDisplay.innerText = gameCode;
}

function handleUnknownGame() {
    reset();
    socket.emit("resetGame");
    alert("Unknown game code"); // TODO: change to show on UI
}

function handleTooManyPlayers() {
    reset();
    socket.emit("resetGame");
    alert("This game is already in progress"); // TODO: change to show on UI
}

// update score whenever user eats food
function handleNewScore(newScore) {
    score.innerText = newScore;
}

// reset UI
function reset() {
    gameActive = false;
    playerNumber = null;
    noOfPlayers.value = 2;
    gameCodeInput.value = "";
    gameCodeDisplay.innerText = "";
    initialScreen.style.display = "grid";
    gameScreen.style.display = "none";
    resultsScreen.style.display = "none";
    clearInterval(intervalId);
    time = startingMinutes * 59;
    timer.innerText = `01:00`;
    score.innerText = 0;
    promoCode.innerText = "";
    finalScore.innerText = "";
    result.innerText = "";
}
