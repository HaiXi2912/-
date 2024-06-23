const { createApp } = Vue;

createApp({
    data() {
        return {
            enemies: [],
            songFiles: [
                { audio: 'Sound/1.只因你太美.ogg', js: 'Sound/1_只因你太美.js' },
                // 更多的歌曲文件
            ],
            currentIndex: 0,
            scriptLoaded: false,
            gameInterval: null,
            gameTime: 0,
            stepPerSecond: 60, // 每秒60帧
            enemySpeed: 2000 // 2秒内到角色前方
        };
    },
    methods: {
        loadSong() {
            const song = this.songFiles[this.currentIndex];
            const script = document.createElement('script');
            script.src = song.js;
            script.onload = () => {
                this.scriptLoaded = true;
                const songKey = song.js.replace(/Sound\/|\.js/g, '');
                const songData = window.Songs[songKey];
                console.log("Song Key:", songKey); // 调试信息
                console.log("Loaded JS data:", songData); // 调试信息
                if (songData && songData.notes) {
                    this.enemies = songData.notes.map((note, index) => ({
                        id: index,
                        time: note[0],
                        type: note[1] === 0 ? 'fly' : 'walk',
                        position: window.innerWidth,
                        bottom: note[1] === 0 ? 300 : 200, // 设置飞行敌人和地面敌人的初始位置
                        image: note[1] === 0 ? 'img/fly.gif' : 'img/walk.gif',
                        transition: 'none' // 初始无过渡效果
                    }));
                    console.log("Generated Enemies:", this.enemies); // 调试信息
                } else {
                    console.error("Invalid JS format: 'notes' not found");
                }
            };
            document.head.appendChild(script);
        },
        startGame() {
            if (this.scriptLoaded) {
                this.gameTime = 0;
                this.enemies.forEach(enemy => {
                    enemy.transition = `left ${this.enemySpeed / 1000}s linear`; // 设置平滑移动效果
                    enemy.position = -50; // 移动到屏幕外左侧
                });
                this.gameInterval = setInterval(this.updateGame, 1000 / this.stepPerSecond);
            }
        },
        updateGame() {
            this.gameTime += 1 / this.stepPerSecond;
            const characterPosition = 50; // 角色前方位置

            this.enemies.forEach(enemy => {
                if (this.gameTime >= enemy.time) {
                    const elapsedTime = this.gameTime - enemy.time;
                    const totalTime = this.enemySpeed / 1000; // 2秒时间内移动
                    if (elapsedTime <= totalTime) {
                        const progress = elapsedTime / totalTime;
                        enemy.position = window.innerWidth - (window.innerWidth + 50) * progress; // 更新敌人位置
                    }
                }
            });

            this.enemies = this.enemies.filter(enemy => enemy.position > -100); // 移除离开屏幕的敌人
        },
        destroyEnemy(index) {
            let enemy = this.enemies[index];
            if (enemy.type === 'fly') {
                // 敌人飞走逻辑
                const angle = Math.random() * 30 - 15; // 随机角度偏移 -15 到 15 度
                const distance = 300; // 飞行距离
                const radians = angle * (Math.PI / 180);
                enemy.position += distance * Math.cos(radians);
                enemy.bottom += distance * Math.sin(radians);
                enemy.transition = 'left 1s ease-out, bottom 1s ease-out';
            } else {
                // 地面敌人被消灭逻辑
                enemy.image = 'img/walk2.gif';
            }
            enemy.destroyed = true;
        }
    }
}).mount('#app');
