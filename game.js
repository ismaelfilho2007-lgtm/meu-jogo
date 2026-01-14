const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreSpan = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

// Variáveis do jogo
let mario;
let pipes = [];
let score;
let gameRunning = false;
let gameOver = false;
let pipeGenerationInterval;
let gameLoopInterval;

// Dimensões
const MARIO_WIDTH = 40;
const MARIO_HEIGHT = 40;
const GRAVITY = 0.3;
const JUMP_STRENGTH = -6;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150; // Espaço entre o cano de cima e o de baixo
const PIPE_SPEED = 2;
const PIPE_INTERVAL = 2000; // Tempo em ms para gerar um novo cano

// Imagens (substitua por caminhos reais ou carregue-as dinamicamente)
const marioImg = new Image();
marioImg.src = 'https://i.imgur.com/kS9eYtV.png'; // Exemplo de imagem do Mario
const pipeImg = new Image();
pipeImg.src = 'https://i.imgur.com/5D631iR.png'; // Exemplo de imagem de cano (verde)
const pipeTopImg = new Image(); // Para cano de cima invertido
pipeTopImg.src = 'https://i.imgur.com/5D631iR.png'; 

// Objeto Mario
function Mario() {
    this.x = 50;
    this.y = canvas.height / 2 - MARIO_HEIGHT / 2;
    this.velocityY = 0;

    this.draw = function() {
        ctx.drawImage(marioImg, this.x, this.y, MARIO_WIDTH, MARIO_HEIGHT);
    };

    this.update = function() {
        this.velocityY += GRAVITY;
        this.y += this.velocityY;

        // Limita o Mario ao topo da tela
        if (this.y < 0) {
            this.y = 0;
            this.velocityY = 0;
        }

        // Se o Mario cair no chão, Game Over
        if (this.y + MARIO_HEIGHT > canvas.height) {
            this.y = canvas.height - MARIO_HEIGHT;
            endGame();
        }
    };

    this.jump = function() {
        if (!gameOver) {
            this.velocityY = JUMP_STRENGTH;
        }
    };
}

// Objeto Cano
function Pipe(x, height) {
    this.x = x;
    this.height = height; // Altura do cano de cima
    this.bottomY = this.height + PIPE_GAP; // Posição Y do início do cano de baixo

    this.draw = function() {
        // Cano de cima (pode ser invertido para melhor visual)
        ctx.save();
        ctx.translate(this.x + PIPE_WIDTH / 2, this.height);
        ctx.rotate(Math.PI); // Inverte a imagem
        ctx.drawImage(pipeTopImg, -PIPE_WIDTH / 2, 0, PIPE_WIDTH, this.height);
        ctx.restore();
        
        // Cano de baixo
        ctx.drawImage(pipeImg, this.x, this.bottomY, PIPE_WIDTH, canvas.height - this.bottomY);
    };

    this.update = function() {
        this.x -= PIPE_SPEED;
    };
}

// Inicializa o jogo
function initGame() {
    mario = new Mario();
    pipes = [];
    score = 0;
    gameOver = false;
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa o canvas
    mario.draw(); // Desenha Mario na posição inicial
    drawScore();
}

// Inicia o ciclo do jogo
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gameOver = false;
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        
        mario = new Mario(); // Reinicia Mario
        pipes = []; // Limpa os canos
        score = 0;

        gameLoopInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS
        pipeGenerationInterval = setInterval(generatePipe, PIPE_INTERVAL);
    }
}

// Loop principal do jogo
function gameLoop() {
    if (gameOver) {
        clearInterval(gameLoopInterval);
        clearInterval(pipeGenerationInterval);
        gameRunning = false;
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa a tela

    mario.update();
    mario.draw();

    // Atualiza e desenha canos
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.update();
        pipe.draw();

        // Verifica colisão
        if (
            mario.x < pipe.x + PIPE_WIDTH &&
            mario.x + MARIO_WIDTH > pipe.x &&
            (mario.y < pipe.height || mario.y + MARIO_HEIGHT > pipe.bottomY)
        ) {
            endGame(); // Colisão com cano
            return;
        }

        // Passou pelo cano?
        if (pipe.x + PIPE_WIDTH < mario.x && !pipe.passed) {
            score++;
            pipe.passed = true; // Marca o cano como passado para não pontuar de novo
        }

        // Remove canos fora da tela
        if (pipe.x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
        }
    }

    drawScore();
}

// Gera um novo cano
function generatePipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - PIPE_GAP - minHeight;
    const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    pipes.push(new Pipe(canvas.width, height));
}

// Desenha a pontuação
function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Pontos: ' + score, 10, 30);
}

// Fim de jogo
function endGame() {
    gameOver = true;
    gameRunning = false;
    clearInterval(gameLoopInterval);
    clearInterval(pipeGenerationInterval);
    finalScoreSpan.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Eventos de input
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!gameRunning && !gameOver) { // Inicia o jogo se não estiver rodando
            startGame();
        }
        if (gameRunning && !gameOver) { // Pula se o jogo estiver rodando
            mario.jump();
        }
    }
});

restartButton.addEventListener('click', () => {
    initGame();
    startGame();
});

// Garante que as imagens estejam carregadas antes de iniciar
Promise.all([
    new Promise(resolve => marioImg.onload = resolve),
    new Promise(resolve => pipeImg.onload = resolve),
    new Promise(resolve => pipeTopImg.onload = resolve)
]).then(() => {
    initGame(); // Inicia o jogo na tela inicial após carregar imagens
}).catch(error => {
    console.error("Erro ao carregar imagens:", error);
    // Mesmo com erro, tenta iniciar o jogo sem imagens
    initGame(); 
});
