const game = document.getElementById('game');
const player = document.getElementById('player');
const enemy = document.getElementById('enemy');
const comboDisplay = document.getElementById('combo');
const ratingDisplay = document.getElementById('rating');
const scoreDisplay = document.getElementById('score');
const ratingCenterDisplay = document.getElementById('rating-center');
const comboCenterDisplay = document.getElementById('combo-center');
const bgMusic = document.getElementById('bg-music');
const hitSound = document.getElementById('hit-sound');
const missSound = document.getElementById('miss-sound');
const playerHitSounds = [
    new Audio('Sound/hit1.ogg'),
    new Audio('Sound/hit2.ogg'),
    new Audio('Sound/hit3.ogg')
];

let idleFrames = ['idle1.gif']; // 空闲动画帧
let shakeLeftFrames = ['shake_left0000.png', 'shake_left0001.png', 'shake_left0002.png', 'shake_left0003.png']; // 向左抖动动画帧
let shakeRightFrames = ['shake_right0000.png', 'shake_right0001.png', 'shake_right0002.png', 'shake_right0003.png']; // 向右抖动动画帧
let shakeBothFrames = ['idle1.gif']; // 摇动两个动画帧

let currentFrame = 0;
let animationInterval;

function preloadImages(frames) {
    frames.forEach(frame => {
        const img = new Image();
        img.src = `img/${frame}`;
    });
}

function playAnimation(frames, callback) {
    currentFrame = 0;
    clearInterval(animationInterval);
    animationInterval = setInterval(() => {
        player.style.backgroundImage = `url(img/${frames[currentFrame]})`;
        currentFrame++;
        if (currentFrame >= frames.length) {
            clearInterval(animationInterval);
            if (callback) callback();
        }
    }, 50); // Change frame every 100ms
}

function playIdleAnimation() {
    playAnimation(idleFrames, playIdleAnimation);
}

function playShakeLeftAnimation() {
    playAnimation(shakeLeftFrames, playIdleAnimation);
}

function playShakeRightAnimation() {
    playAnimation(shakeRightFrames, playIdleAnimation);
}

function playShakeBothAnimation() {
    playAnimation(shakeBothFrames, playIdleAnimation);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        playShakeLeftAnimation();
    } else if (e.key === 'ArrowRight') {
        playShakeRightAnimation();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        playShakeBothAnimation();
    }
});

// Preload all frames to prevent flicker
preloadImages(idleFrames);
preloadImages(shakeLeftFrames);
preloadImages(shakeRightFrames);
preloadImages(shakeBothFrames);

// Start idle animation initially
playIdleAnimation();

let score = 0;
let combo = 0;
let perfectCombo = 0;
let activeBasketballs = [];
let keysPressed = {};
let reboundTriggered = {}; // 添加一个标志对象来记录按键是否已经触发过反弹

const config = {
    basketballSpeed: 2,
    spawnInterval: 2000,
    perfectThreshold: 25,
    goodThreshold: 50,
    comboThreshold: 80,
    missThreshold: 300,
    scoreIncrement: 100,
    comboIncrement: 10,
    perfectMultiplier: 2.5,
    musicDelay: 2500,
    bounceSpeedFactor: 1.5
};

bgMusic.addEventListener('canplaythrough', () => {
    setTimeout(() => bgMusic.play(), config.musicDelay);
});

document.addEventListener('keydown', (e) => {
    // 阻止箭头键的默认行为
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }

    if (!keysPressed[e.key]) {
        keysPressed[e.key] = true;
        handleKeyPress();
    }
});

document.addEventListener('keyup', (e) => {
    // 阻止箭头键的默认行为
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }

    keysPressed[e.key] = false;
    reboundTriggered[e.key] = false; // 重置标志，允许再次触发反弹
    handleKeyPress();
});

function handleKeyPress() {
    if (keysPressed['ArrowLeft'] && keysPressed['ArrowRight']) {
        player.classList.remove('left', 'right');
        player.classList.add('both');
        checkCollision('both');
    } else if (keysPressed['ArrowLeft'] && !reboundTriggered['ArrowLeft']) {
        player.classList.remove('both', 'right');
        player.classList.add('left');
        checkCollision('ArrowLeft');
        reboundTriggered['ArrowLeft'] = true; // 设置标志，表示已触发反弹
    } else if (keysPressed['ArrowRight'] && !reboundTriggered['ArrowRight']) {
        player.classList.remove('both', 'left');
        player.classList.add('right');
        checkCollision('ArrowRight');
        reboundTriggered['ArrowRight'] = true; // 设置标志，表示已触发反弹
    } else {
        player.classList.remove('left', 'right', 'both');
    }
}

function spawnBasketball() {
    const basketball = document.createElement('div');
    basketball.classList.add('basketball');
    const direction = Math.random() > 0.5 ? 'left' : 'right';
    basketball.dataset.direction = direction;
    if (direction === 'left') {
        basketball.style.left = '-30px';
    } else {
        basketball.style.left = `${game.clientWidth}px`;
    }
    basketball.style.top = `${game.clientHeight - 300}px`; // Shoulder height
    basketball.spawnTime = new Date().getTime();
    game.appendChild(basketball);
    activeBasketballs.push(basketball);
}

function updateBasketballs() {
    activeBasketballs.forEach((basketball, index) => {
        const direction = basketball.dataset.direction;
        if (direction === 'left') {
            basketball.style.left = `${basketball.offsetLeft + config.basketballSpeed}px`;
        } else {
            basketball.style.left = `${basketball.offsetLeft - config.basketballSpeed}px`;
        }

        if (basketball.offsetLeft > game.clientWidth || basketball.offsetLeft < -30) {
            basketball.remove();
            activeBasketballs.splice(index, 1);
        } else {
            const playerBounds = player.getBoundingClientRect();
            const basketballBounds = basketball.getBoundingClientRect();
            if (isColliding(playerBounds, basketballBounds)) {
                handlePlayerCollision(index);
            }
        }
    });
}

function checkCollision(direction) {
    const playerBounds = getModifiedBounds(player.getBoundingClientRect());
    activeBasketballs.forEach((basketball, index) => {
        const basketballBounds = basketball.getBoundingClientRect();
        if (isInReboundRange(playerBounds, basketballBounds, direction)) {
            handleCollision(index, direction);
        }
    });
}

function getModifiedBounds(rect) {
    const shrinkOffsetX = 50; // X轴缩减量
    const shrinkOffsetY = 0; // Y轴缩减量

    return {
        left: rect.left + shrinkOffsetX,
        right: rect.right - shrinkOffsetX,
        top: rect.top + shrinkOffsetY,
        bottom: rect.bottom - shrinkOffsetY
    };
}

function isColliding(rect1, rect2) {
    const rect1Modified = getModifiedBounds(rect1);

    return !(rect2.left > rect1Modified.right || rect2.right < rect1Modified.left || rect2.top > rect1Modified.bottom || rect2.bottom < rect1Modified.top);
}

function isInReboundRange(playerBounds, basketballBounds, direction) {
    const distance = direction === 'ArrowLeft' ? (playerBounds.left - basketballBounds.right) : (basketballBounds.left - playerBounds.right);
    return distance > 20 && distance < 80;
}

function handlePlayerCollision(index) {
    const basketball = activeBasketballs[index];
    const direction = basketball.dataset.direction;

    combo = 0;
    perfectCombo = 0;
    const randomHitSound = playerHitSounds[Math.floor(Math.random() * playerHitSounds.length)];
    randomHitSound.play();
    if (ratingCenterDisplay) {
        ratingCenterDisplay.textContent = 'MISS';
    }
    if (comboCenterDisplay) {
        comboCenterDisplay.textContent = `Combo: ${combo}`;
    }

    // Player shake animation
    if (direction === 'left') {
        player.classList.add('shake-right'); // Player moves right when hit from left

    } else {
        player.classList.add('shake-left'); // Player moves left when hit from right
    }
    setTimeout(() => {
        player.classList.remove('shake-left');
        player.classList.remove('shake-right');
    }, 500);

    bounceBasketball(basketball, direction, false);
    activeBasketballs.splice(index, 1);
}

function handleCollision(index, direction) {
    const basketball = activeBasketballs[index];
    const playerBounds = getModifiedBounds(player.getBoundingClientRect());
    const basketballBounds = basketball.getBoundingClientRect();
    let rating = 'MISS';
    
    const distance = direction === 'ArrowLeft' ? (playerBounds.left - basketballBounds.right) : (basketballBounds.left - playerBounds.right);

    if (distance > 20 && distance < 50) {
        rating = 'Perfect';
        score += (config.scoreIncrement + (combo * config.comboIncrement)) * config.perfectMultiplier;
        combo++;
        perfectCombo++;
        hitSound.play();
    } else if (distance < 20 || (distance > 50 && distance < 80)) {
        rating = 'MISS';
        combo = 0;
        perfectCombo = 0;
        missSound.play();
    } else if (distance >= 20 && distance <= 50) {
        rating = 'GOOD';
        score += config.scoreIncrement + (combo * config.comboIncrement);
        combo++;
        perfectCombo = 0;
        hitSound.play();
    } else {
        rating = 'PASS';
        combo = 0;
        perfectCombo = 0;
        missSound.play();
    }

    ratingDisplay.textContent = `Rating: ${rating}`;
    comboDisplay.textContent = `Combo: ${combo}`;
    scoreDisplay.textContent = `Score: ${score}`;
    if (ratingCenterDisplay) {
        ratingCenterDisplay.textContent = rating;
    }
    if (comboCenterDisplay) {
        comboCenterDisplay.textContent = `Combo: ${combo}`;
    }

    bounceBasketball(basketball, direction, rating === 'Perfect', distance);

    activeBasketballs.splice(index, 1);
}

function bounceBasketball(basketball, direction, isPerfect, distance) {
    console.log(basketball, direction, isPerfect, distance);
    
    const baseSpeed = config.basketballSpeed * (isPerfect ? config.bounceSpeedFactor : 1);
    const speedFactor = 1 + (25 - Math.abs(25 - distance)) / 25;
    const speed = baseSpeed * speedFactor * 2; // 增加初始速度，使弹飞力道更大
    
    // 设置初始速度
    let vx, vy;
    if (direction === 'ArrowLeft') {
        vx = -speed; // 向左上角
        vy = -speed;  // 向上
    } else {
        vx = speed;  // 向右上角
        vy = -speed;  // 向上
    }
    
    if (isPerfect === false && (direction === 'left' || direction === 'right')) {
        const missSpeed = 4;
        if (direction === 'left') {
            vx = -missSpeed; // 向左上角
            vy = -missSpeed;  // 向上
        } else {
            vx = missSpeed;  // 向右上角
            vy = -missSpeed;  // 向上
        }
    }
    console.log(speed, vx, vy);

    // 设置篮球的初始生成时间
    basketball.spawnTime = Date.now();

    const bounceInterval = setInterval(() => {
        basketball.style.left = `${basketball.offsetLeft + vx}px`;
        basketball.style.top = `${basketball.offsetTop + vy}px`;
        vy += 0.5; // 模拟重力

        if (Date.now() - basketball.spawnTime >= 2500) {
            clearInterval(bounceInterval);
            const removeInterval = setInterval(() => {
                basketball.style.left = `${basketball.offsetLeft + vx}px`;
                basketball.style.top = `${basketball.offsetTop + vy}px`;
                vy += 0.5; // 模拟重力

                if (
                    basketball.offsetLeft < -basketball.clientWidth || 
                    basketball.offsetLeft > game.clientWidth || 
                    basketball.offsetTop < -basketball.clientHeight || 
                    basketball.offsetTop > game.clientHeight
                ) {
                    clearInterval(removeInterval);
                    basketball.remove();
                }
            }, 20);
        }
    }, 20);
}

function gameLoop() {
    updateBasketballs();
    requestAnimationFrame(gameLoop);
}

setInterval(spawnBasketball, config.spawnInterval);
gameLoop();
