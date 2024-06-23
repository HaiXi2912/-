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
    new Audio('Sound/hit1.mp3')
];



let Gameset = {
    LoadOver: false,
    StartPage: true,
    Start: false,
    Pause: false,
    Over: false,
    MusicDelay: false
}
let MusicDelay1
function GameStart() {
    Gameset.MusicDelay = true;
    MusicDelay1 = setTimeout(() => {Gameset.MusicDelay = false;},config.musicDelay)
    bgMusic.addEventListener('canplaythrough', () => {
        setTimeout(() => bgMusic.play(), config.musicDelay);
    });
    StartSpawn();
    Gameset.Start = true;
    let home = document.getElementById('home');
    let gametime = document.getElementById('gametime');
    home.style.top = '-150%';
    gametime.style.height = '10px';
    player.style.left = '50%';

}


let idleFrames = ['idle_0000_idle.png', 'idle_0001_idle.png', 'idle_0002_idle.png', 'idle_0003_idle.png', 'idle_0004_idle.png', 'idle_0005_idle.png', 'idle_0006_idle.png', 'idle_0007_idle.png', 'idle_0008_idle.png', 'idle_0009_idle.png', 'idle_0010_idle.png', 'idle_0011_idle.png', 'idle_0012_idle.png', 'idle_0013_idle.png', 'idle_0014_idle.png', 'idle_0015_idle.png', 'idle_0016_idle.png', 'idle_0017_idle.png', 'idle_0018_idle.png', 'idle_0019_idle.png']; // 空闲动画帧
let shakeLeftFrames = ['shake_left0000.png', 'shake_left0001.png', 'shake_left0002.png', 'shake_left0003.png']; // 向左抖动动画帧
let shakeRightFrames = ['shake_right0000.png', 'shake_right0001.png', 'shake_right0002.png', 'shake_right0003.png']; // 向右抖动动画帧
let shakeBothFrames = ['_0000_11.png','_0001_10.png','_0002_9.png','_0003_8.png','_0004_7.png','_0005_6.png','_0006_5.png','_0007_4.png','_0008_3.png','_0009_2.png','_0010_1.png']; // 摇动两个动画帧

let currentFrame = 0;
let animationInterval;
let preloadedImages = {};

function preloadImages(frames, callback) {
    let loaded = 0;
    frames.forEach(frame => {
        const img = new Image();
        img.src = `img/${frame}`;
        img.onload = () => {
            loaded++;
            preloadedImages[frame] = img;
            if (loaded === frames.length) {
                callback();
            }
        };
    });
}

function playAnimation(frames, callback) {
    currentFrame = 0;
    clearInterval(animationInterval);
    animationInterval = setInterval(() => {
        // 直接使用已加载的图片对象
        player.style.backgroundImage = `url(${preloadedImages[frames[currentFrame]].src})`;
        currentFrame++;
        if (currentFrame >= frames.length) {
            clearInterval(animationInterval);
            if (callback) callback();
        }
    }, 40); // Change frame every 40ms
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

let keysPressed1 = {};

document.addEventListener('keydown', (e) => {
    keysPressed1[e.key] = true;

    if (keysPressed1['ArrowLeft'] && keysPressed1['ArrowRight']) {
        playShakeBothAnimation();
    } else if (e.key === 'ArrowLeft') {
        playShakeLeftAnimation();
    } else if (e.key === 'ArrowRight') {
        playShakeRightAnimation();
    }
});

document.addEventListener('keyup', (e) => {
    delete keysPressed1[e.key];
});



// Preload all frames and start idle animation initially
preloadImages(idleFrames, () => {
    preloadImages(shakeLeftFrames, () => {
        preloadImages(shakeRightFrames, () => {
            preloadImages(shakeBothFrames, playIdleAnimation);
        });
    });
});

let score = 0;
let combo = 0;
let perfectCombo = 0;
let activeBasketballs = [];
let keysPressed = {};
let reboundTriggered = {}; // 添加一个标志对象来记录按键是否已经触发过反弹

const config = {
    basketballSpeed: 1,
    basketballMoveSpeed: 1000,
    spawnInterval: 800,
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
    if (Gameset.Pause || Gameset.Start == false) {return};
    // 如果同时按下左键和右键
    if (keysPressed['ArrowLeft'] && keysPressed['ArrowRight']) {
        // 移除可能存在的 'both' 类，并分别处理每个方向
        player.classList.remove('both');
        player.classList.add('left', 'right');

        // 独立检查每个方向的碰撞
        if (!reboundTriggered['ArrowLeft']) {
            checkCollision('ArrowLeft');
            reboundTriggered['ArrowLeft'] = true; // 设置标志，表示左键已触发反弹
        }
        if (!reboundTriggered['ArrowRight']) {
            checkCollision('ArrowRight');
            reboundTriggered['ArrowRight'] = true; // 设置标志，表示右键已触发反弹
        }
    } 
    // 仅按下左键且未触发反弹
    else if (keysPressed['ArrowLeft'] && !reboundTriggered['ArrowLeft']) {
        player.classList.remove('both', 'right');
        player.classList.add('left');
        checkCollision('ArrowLeft');
        reboundTriggered['ArrowLeft'] = true; // 设置标志，表示左键已触发反弹
    } 
    // 仅按下右键且未触发反弹
    else if (keysPressed['ArrowRight'] && !reboundTriggered['ArrowRight']) {
        player.classList.remove('both', 'left');
        player.classList.add('right');
        checkCollision('ArrowRight');
        reboundTriggered['ArrowRight'] = true; // 设置标志，表示右键已触发反弹
    } 
    // 没有按键或其他情况
    else {
        player.classList.remove('left', 'right', 'both');
    }
}




function StartSpawn() {
    if (!animationFrameId) {
        lastTime = performance.now(); // 重置时间戳
        Gameset.Pause = false;
        animationFrameId = requestAnimationFrame(update);
    }
}

function PauseSpawn() {
    Gameset.Pause = true;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function resetSpawn() {
    pause(); // 停止动画循环
    nowtime = 0;
    nowbpm = 0;
    Gameset.Pause = false;
    clearBasketballs();
    start(); // 重新开始动画循环
}

function spawnBasketball(item) {
    if (item == 0) return;

    // 功能：创建篮球并设置方向和初始位置
    function createBasketball(direction) {
        const basketball = document.createElement('div');
        if(item == 2){
            basketball.classList.add('basketball-both');
        }
        else{
        basketball.classList.add('basketball');
        }
        basketball.dataset.direction = direction;

        if (direction === 'left') {
            basketball.style.left = '-55px';  // 左侧位置
        } else {
            basketball.style.left = `${game.clientWidth}px`;  // 右侧位置
        }

        basketball.style.top = `${game.clientHeight - 380}px`;  // 出现的高度
        basketball.spawnTime = new Date().getTime();  // 记录生成时间
        game.appendChild(basketball);  // 将篮球添加到游戏中
        activeBasketballs.push(basketball);  // 加入活跃篮球列表
    }

    if (item == 1 || item == 2) {
        createBasketball('right');  // 生成右边的篮球
    }
    if (item == -1 || item == 2) {
        createBasketball('left');  // 生成左边的篮球
    }
}




function clearBasketballs() {
    activeBasketballs.forEach(basketball => game.removeChild(basketball));
    activeBasketballs = [];
}




function updateBasketballs() {
    if (Gameset.Pause == false) {
        let WindowsWidth = document.body.clientWidth;
        activeBasketballs.forEach((basketball, index) => {
            const direction = basketball.dataset.direction;
            if (direction === 'left') {
                basketball.style.left = `${basketball.offsetLeft + WindowsWidth / config.basketballMoveSpeed}px`;
            } else {
                basketball.style.left = `${basketball.offsetLeft - WindowsWidth / config.basketballMoveSpeed}px`;
            }

            if (basketball.offsetLeft > game.clientWidth || basketball.offsetLeft < -55) {
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
}

function checkCollision(direction) {
    const playerBounds = getModifiedBounds(player.getBoundingClientRect());
    let closestBasketball = null;
    let minDistance = Infinity;
    let closestIndex = -1;

    activeBasketballs.forEach((basketball, index) => {
        const basketballBounds = basketball.getBoundingClientRect();
        const distance = direction === 'ArrowLeft' ? (playerBounds.left - basketballBounds.right) : (basketballBounds.left - playerBounds.right);
        if (isInReboundRange(playerBounds, basketballBounds, direction) && distance < minDistance) {
            minDistance = distance;
            closestBasketball = basketball;
            closestIndex = index;
        }
    });

    if (closestBasketball !== null) {
        handleCollision(closestIndex, direction);
    }
}


function getModifiedBounds(rect) {
    const shrinkOffsetX = 200; // X轴缩减量
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
    return distance > 0 && distance < 120;
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
        comboCenterDisplay.textContent = ``;
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
    if (distance > 80 && distance <= 120) {

        rating = 'GOOD';
        score += config.scoreIncrement + (combo * config.comboIncrement);
        combo++;
        perfectCombo++;
        hitSound.play();
    }
    else if (distance <= 80 && distance > 50) {
        rating = 'Perfect';
        score += (config.scoreIncrement + (combo * config.comboIncrement)) * config.perfectMultiplier;
        combo++;
        perfectCombo++;
        hitSound.play();
    } else if (distance > 20 && distance <= 50) {

        rating = 'GOOD';
        score += config.scoreIncrement + (combo * config.comboIncrement);
        combo++;
        perfectCombo++;
        hitSound.play();
    }


    else {
        rating = 'PASS';
        combo = 0;
        perfectCombo = 0;
        missSound.play();
    }

    scoreDisplay.textContent = `得分: ${score}`;

    if (ratingCenterDisplay) {
        ratingCenterDisplay.textContent = rating;
    }
    if (comboCenterDisplay) {
        comboCenterDisplay.textContent = `Combo: ${combo}`;
    }

    bounceBasketball(basketball, direction, rating === 'Perfect', distance);
    activeBasketballs.splice(index, 1);  // 移除已处理的篮球


}

function bounceBasketball(basketball, direction, isPerfect, distance) {

    const baseSpeed = config.basketballSpeed * (isPerfect ? config.bounceSpeedFactor : 1);
    const speedFactor = 1 + (65 - Math.abs(25 - distance)) / 25;
    const speed = baseSpeed * speedFactor * 3; // 增加初始速度，使弹飞力道更大

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

gameLoop();



let currentIndex = 0;
const contents = document.getElementById('contents');
const dotsContainer = document.querySelector('.dots');
const audioPlayer = document.getElementById('audioPlayer');
audioPlayer.volume = 0.3;

function createSlides() {
    Sound.forEach((Sound, index) => {
        const slide = document.createElement('div');
        slide.classList.add('slide');
        if (index === 0) {
            slide.classList.add('active');
        }
        const img = document.createElement('img');
        img.src = "Sound/" + Sound.name + ".jpeg";
        slide.appendChild(img);
        contents.appendChild(slide);

        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (index === 0) {
            dot.classList.add('active');
        }
        dot.addEventListener('click', () => setSlide(index));
        dotsContainer.appendChild(dot);
    });
}

function setSlide(index) {
    MusicName = document.getElementById('MusicName');
    MusicInfo = document.getElementById('MusicInfo');
    MusicName.innerHTML = Sound[index].name;

    MusicInfo.innerHTML = `难度: ${Sound[index].difficulty} &nbsp;&nbsp; 时长: ${Sound[index].time}秒 &nbsp;&nbsp; 最高分: ${getHighScore(index)}`;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');

    slides[currentIndex].classList.remove('active');
    dots[currentIndex].classList.remove('active');

    currentIndex = index;

    slides[currentIndex].classList.add('active');
    dots[currentIndex].classList.add('active');

    // 播放选中的音频

    audioPlayer.src = "Sound/" + Sound[currentIndex].name + '.mp3';

    audioPlayer.play();
}

function nextSlide() {
    setSlide((currentIndex + 1) % Sound.length);
}

function prevSlide() {
    setSlide((currentIndex - 1 + Sound.length) % Sound.length);
}
let countIntervalTime
document.addEventListener('keydown', (event) => {
    if (Gameset.Start == false && Gameset.StartPage == false && Gameset.Over == false) {
        if (event.key === 'ArrowLeft') {
            prevSlide();
        } else if (event.key === 'ArrowRight') {
            nextSlide();
        } else if (event.key === ' ' && Gameset.Over == false) {
            startGame();
        }
    }
    if (Gameset.StartPage == true && event.key === ' ' && Gameset.LoadOver == true && Gameset.Over == false) {
        audioPlayer.src = "Sound/" + Sound[currentIndex].name + '.mp3';;
        audioPlayer.play();
        StartPage.classList.add('StartPageOut');
        Gameset.StartPage = false;
        return
    }
    if (event.key === ' ' && Gameset.StartPage == false && Gameset.Start == false && Gameset.Over == false) {
        GameStart();
        scoreDisplay.textContent = `得分: 0`;
        Gameset.Pause = false;
        audioPlayer.src = "Sound/" + Sound[currentIndex].name + '.mp3';;
        audioPlayer.pause()
        PlayMusicDelay = setTimeout(() => {
            audioPlayer.load();
            audioPlayer.play();
            audioPlayer.loop = false;
        }, config.musicDelay);
        return
    }
    CountNum = document.getElementById("CountDownNum");
    if (event.key === ' ' && Gameset.Pause == true && CountNum.innerHTML == "0" && Gameset.Over == false) {
        PausePage.classList.add('PausePageOut');
        let countdown = 3;
        countIntervalTime = setInterval(() => {
            CountNum.innerText = countdown;
            CountDown.style.opacity = 1;  // 渐变透明度
        
            if (countdown === 0) {
                clearInterval(countIntervalTime); // 停止计时器
                StartSpawn();
                audioPlayer.play();
                console.log("继续游戏");
                CountDown.style.opacity = 0;
                CountNum.innerHTML = 0
            }
            if(countdown > 0){
                countdown--;
            }
            
        }, 1000);
        
        // 终止计时器的函数



        return
    } else if (event.key === ' ' && Gameset.Pause == false && audioPlayer.paused == false && Gameset.Over == false) {
        audioPlayer.pause()
        PauseSpawn();
        console.log("暂停游戏");
        PausePage.classList.remove('PausePageOut');
        return


    }
    if(Gameset.Over == true && event.key === ' '){
        console.log('结束游戏');
        Gameset.Over = false;
        Gameset.Start = false;

        home.style.top = '0%';
        gametime.style.height = '0px';
        player.style.left = '85%';
        document.querySelector('#GameOverPage').style.opacity = 0;
        audioPlayer.loop = true;
        audioPlayer.load();
        audioPlayer.play();
        Gametime = 0;
        score = 0;
        combo = 0;
        perfectCombo = 0;
        nowbpm = 0
        scoreDisplay.textContent = ``;
        comboCenterDisplay.textContent = ``;
        ratingCenterDisplay.textContent = ``;
        return
    }

});



let bpm 
let name 
let time 
let arranger 
function startGame() {
    console.log(`开始游戏，当前曲子：${Sound[currentIndex].name}`);
    // 这里添加开始游戏的逻辑
bpm = Sound[currentIndex].bpm;
name = Sound[currentIndex].name;
time = Sound[currentIndex].time;
arranger = Sound[currentIndex].arranger;
}

createSlides();



let nowtime = 0;
let nowbpm = 0;

let lastTime = performance.now();
let animationFrameId;
let Gametime = 0

function update(timestamp) {

    if (Gameset.Pause || Gameset.Over == true || Gameset.Start == false) {
        lastTime = timestamp; // 记录暂停时的时间戳
        animationFrameId = requestAnimationFrame(update);
        return;
    }

    const elapsedTime = timestamp - lastTime;
    lastTime = timestamp;
    const Gametimebar = document.getElementById('gametime-center');
    const bmptime = 1000 / bpm;
    nowtime += elapsedTime;

    if (nowtime >= bmptime && Gameset.Over == false) {

        nowtime -= bmptime;
        if (nowbpm < arranger.length && (Gametime / bpm) <= time) {
            spawnBasketball(arranger[nowbpm]);
            nowbpm++;

        }
        Gametime++;
        Gametimebar.style.width = ((Gametime / bpm) / time ) * 100 + '%';
        if (Gametime / bpm >= time && Gameset.Over == false) {

            if (activeBasketballs.length == 0 && Gameset.Over == false ||Gameset.Start == true) {
                
                Gameset.Over = true;
                setTimeout(() => {
                    console.log('结束游戏');
                    let scoreNum = document.querySelector('#score-num');
                    let GameOverPage = document.querySelector('#GameOverPage');
                    GameOverPage.style.opacity = 1;
                    audioPlayer.pause()
                    scoreNum.textContent = score;
                    audioPlayer.loop = true
                    Gameset.Start = false;
                    submitScore(score)
                    let MusicInfo = document.getElementById('MusicInfo');
                    MusicInfo.innerHTML = `难度: ${Sound[index].difficulty} &nbsp;&nbsp; 时长: ${Sound[index].time}秒 &nbsp;&nbsp; 最高分: ${getHighScore(index)}`;
                }, 3000)
            }
        }
    }


    animationFrameId = requestAnimationFrame(update);
}
document.addEventListener('DOMContentLoaded', () => {
    const tipsbar = document.getElementById('tipsbar');
    const tipsbarIn = document.getElementById('tipsbar-in');
    const resources = document.querySelectorAll('.resource');
    let resourcesLoaded = 0;
    const totalResources = resources.length + 1; // Including the HTML document

    const updateProgressBar = () => {
        let loadtips = document.getElementById('loadtips');
        const progress = (resourcesLoaded / totalResources) * 100;
        tipsbarIn.style.width = progress + '%';
        loadtips.innerHTML = `正在下载资源... ${progress.toFixed(2)}%`;
        if (resourcesLoaded === totalResources) {
            Gameset.LoadOver = true;
            loadtips.innerHTML = '<span class="keybox anm-onclicktips">空格键</span> &nbsp;进入选曲';

            // Preload all frames and start idle animation initially
            preloadImages(idleFrames, () => {
                preloadImages(shakeLeftFrames, () => {
                    preloadImages(shakeRightFrames, () => {
                        preloadImages(shakeBothFrames, playIdleAnimation);

                    });
                });
            });
        }
    };

    tipsbar.style.display = 'block';

    // Listen for window load event
    window.addEventListener('load', () => {
        resourcesLoaded++;
        updateProgressBar();
    });

    // Add load event listeners to all resources
    resources.forEach(resource => {
        const handleResourceLoad = () => {
            resourcesLoaded++;
            updateProgressBar();
        };

        if (resource.tagName === 'AUDIO') {
            if (resource.readyState >= 2) {
                // Already loaded
                handleResourceLoad();
            } else {
                resource.addEventListener('loadeddata', handleResourceLoad);
                resource.addEventListener('error', handleResourceLoad); // Also handle errors
            }
        } else if (resource.tagName === 'IMG') {
            if (resource.complete) {
                // Already loaded
                handleResourceLoad();
            } else {
                resource.addEventListener('load', handleResourceLoad);
                resource.addEventListener('error', handleResourceLoad); // Also handle errors
            }
        } else if (resource.tagName === 'LINK') {
            if (resource.sheet) {
                // Already loaded
                handleResourceLoad();
            } else {
                resource.onload = handleResourceLoad;
                resource.onerror = handleResourceLoad; // Also handle errors
            }
        } else if (resource.tagName === 'SCRIPT') {
            if (resource.readyState === 'complete') {
                // Already loaded
                handleResourceLoad();
            } else {
                resource.onload = handleResourceLoad;
                resource.onerror = handleResourceLoad; // Also handle errors
            }
        }
    });
});


window.addEventListener('blur', function() {
    if(Gameset.MusicDelay == true && Gameset.Start == true && Gameset.Over == false){
        clearInterval(MusicDelay1);
        console.log('结束游戏');
        Gameset.Over = false;
        Gameset.Start = false;

        home.style.top = '0%';
        gametime.style.height = '0px';
        player.style.left = '85%';
        document.querySelector('#GameOverPage').style.opacity = 0;
        audioPlayer.loop = true;
        Gametime = 0;
        score = 0;
        combo = 0;
        perfectCombo = 0;
        nowbpm = 0
        scoreDisplay.textContent = ``;
        comboCenterDisplay.textContent = ``;
        ratingCenterDisplay.textContent = ``;
        basketballs = [];
        clearBasketballs();
        return
    }
    if(Gameset.Start == true && Gameset.Over == false){
            clearInterval(countIntervalTime);
            countIntervalTime = null
            CountDown.style.opacity = 0;
            CountNum.innerHTML = 0
        audioPlayer.pause()
        PauseSpawn();
        console.log("暂停游戏");
        PausePage.classList.remove('PausePageOut');
        Gameset.Pause = true;


    }

});


function submitScore(score) {
    const songName = Sound[currentIndex].name; // 根据索引获取歌曲名称
    const highScoreKey = 'highScore_' + songName;
    const existingHighScore = parseInt(localStorage.getItem(highScoreKey) || '0');
    
    if (score > existingHighScore) {
        localStorage.setItem(highScoreKey, score.toString());
        console.log('新高分记录:', score, '对于歌曲:', songName);
    } else {
        console.log('未超过高分，高分保持:', existingHighScore, '对于歌曲:', songName);
    }
}


function getHighScore(Index) {
    const songName = Sound[Index].name; // 假设 Sound[0] 存储了歌曲名称
    const highScoreKey = 'highScore_' + songName;
    const highScore = localStorage.getItem(highScoreKey) || '0'; // 默认分数为0
    console.log('当前高分:', highScore);
    
    return parseInt(highScore);

}
index = 0
let MusicInfo = document.getElementById('MusicInfo');
MusicInfo.innerHTML = `难度: ${Sound[index].difficulty} &nbsp;&nbsp; 时长: ${Sound[index].time}秒 &nbsp;&nbsp; 最高分: ${getHighScore(index)}`;

// 定义处理窗口大小改变的函数
function handleResize() {
    if(Gameset.Start == true && Gameset.Over == false){
    clearInterval(MusicDelay1);
    console.log('结束游戏');
    Gameset.Over = false;
    Gameset.Start = false;

    home.style.top = '0%';
    gametime.style.height = '0px';
    player.style.left = '85%';
    document.querySelector('#GameOverPage').style.opacity = 0;
    audioPlayer.loop = true;
    Gametime = 0;
    score = 0;
    combo = 0;
    perfectCombo = 0;
    nowbpm = 0
    scoreDisplay.textContent = ``;
    comboCenterDisplay.textContent = ``;
    ratingCenterDisplay.textContent = ``;
    basketballs = [];
    clearBasketballs();
    alert('游戏中请不要调整窗口大小，否则游戏将会结束');
    PausePage.style.opacity = 0;
    return
    }
}

// 在window对象上添加resize事件监听器
window.addEventListener('resize', handleResize);

