const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreSpan = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

// --- CONFIGURAÇÃO DAS IMAGENS ---
const marioImg = new Image();
marioImg.src = 'mario.png'; // Procura o arquivo na mesma pasta

const pipeImg = new Image();
pipeImg.src = 'cano.png'; // Procura o arquivo na mesma pasta

// Variáveis do jogo
let mario;
let pipes = [];
let score;
let gameRunning = false;
let gameOver = false;
let pipeGenerationInterval;
let gameLoopInterval;

// Ajustes de tamanho e física
const MARIO_WIDTH = 50; 
const MARIO_HEIGHT = 50;
const GRAVITY = 0.25;
const JUMP_STRENGTH = -5.5;
const PIPE_WIDTH = 70;
const PIPE_GAP = 170; 
const PIPE_SPEED = 2.5;
const PIPE_INTERVAL = 1500;

function Mario() {
    this.x = 50;
    this.y = canvas.height / 2;
    this.velocityY = 0;

    this.draw = function() {
        // Verifica se a imagem do Mario carregou com sucesso
        if (marioImg.complete && marioImg.naturalWidth !== 0) {
            ctx.drawImage(marioImg, this.x, this.y, MARIO_WIDTH, MARIO_HEIGHT);
        } else {
            // Se a imagem falhar, desenha um quadrado vermelho (Plano B)
            ctx.fillStyle = "red";
            ctx.fillRect(this.x, this.y, MARIO_WIDTH, MARIO_HEIGHT);
        }
    };

    this.update = function() {
        this.velocityY += GRAVITY;
        this.y += this.velocityY;
        if (this.y < 0) this.y = 0;
        if (this.y + MARIO_HEIGHT > canvas.height) {
            this.y = canvas.height - MARIO_HEIGHT;
            endGame();
        }
    };

    this.jump = function() {
        this.velocityY = JUMP_STRENGTH;
    };
}

function Pipe(x, height) {
    this.x = x;
    this.height = height;
    this.bottomY = this.height + PIPE_GAP;
    this.passed = false;

    this.draw = function() {
        if (pipeImg.complete && pipeImg.naturalWidth !== 0) {
            // Desenha cano de cima (invertido)
            ctx.save();
            ctx.translate(this.x + PIPE_WIDTH / 2, this.height);
            ctx.rotate(Math.PI);
            ctx.drawImage(pipeImg, -PIPE_WIDTH / 2, 0, PIPE_WIDTH, this.height);
            ctx.restore();
            // Desenha cano de baixo
            ctx.drawImage(pipeImg, this.x, this.bottomY, PIPE_WIDTH, canvas.height - this.bottomY);
        } else {
            // Se a imagem falhar, desenha retângulos verdes (Plano B)
            ctx.fillStyle = "green";
            ctx.fillRect(this.x, 0, PIPE_WIDTH, this.height);
            ctx.fillRect(this.x, this.bottomY, PIPE_WIDTH, canvas.height - this.bottomY);
        }
    };

    this.update = function() {
        this.x -= PIPE_SPEED;
    };
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    mario.update();
    mario.draw();

    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].update();
        pipes[i].draw();

        // Lógica de colisão
        if (mario.x < pipes[i].x + PIPE_WIDTH &&
            mario.x + MARIO_WIDTH > pipes[i].x &&
            (mario.y < pipes[i].height || mario.y + MARIO_HEIGHT > pipes[i].bottomY)) {
            endGame();
        }

        if (pipes[i].x + PIPE_WIDTH < mario.x && !pipes[i].passed) {
            score++;
            pipes[i].passed = true;
        }
        if (pipes[i].x + PIPE_WIDTH < 0) pipes.splice(i, 1);
    }
    drawScore();
}

function generatePipe() {
    const height = Math.floor(Math.random() * (canvas.height - PIPE_GAP - 120)) + 60;
    pipes.push(new Pipe(canvas.width, height));
}

function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "bold 30px Arial";
    ctx.fillText("Pontos: " + score, 15, 45);
}

function endGame() {
    gameOver = true;
    gameRunning = false;
    clearInterval(gameLoopInterval);
    clearInterval(pipeGenerationInterval);
    finalScoreSpan.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gameOver = false;
        pipes = [];
        score = 0;
        mario = new Mario();
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        gameLoopInterval = setInterval(gameLoop, 1000 / 60);
        pipeGenerationInterval = setInterval(generatePipe, PIPE_INTERVAL);
    }
}

// Controles
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!gameRunning && !gameOver) startGame();
        else if (gameRunning) mario.jump();
    }
});

restartButton.addEventListener('click', () => {
    startGame();
});

// Mensagem inicial no canvas
ctx.fillStyle = "white";
ctx.font = "20px Arial";
ctx.fillText("Aperte ESPAÇO para começar", 50, canvas.height / 2);
