// 游戏状态
let gameState = {
    score: 0,
    highScore: parseInt(localStorage.getItem('highScore')) || 0,
    reactionTime: 0,
    gameTime: 0,
    round: 1,
    maxRounds: 10,
    state: 'start', // start, playing, end
    targetAppearTime: 0,
    isTargetActive: false
};

// 音效对象
const sounds = {
    click: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3'),
    miss: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-over-213.mp3'),
    start: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-video-game-boop-2049.mp3'),
    end: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-level-complete-2063.mp3')
};

// 预加载音效
Object.values(sounds).forEach(sound => {
    sound.preload = 'auto';
});

// Three.js 变量
let scene, camera, renderer, raycaster, mouse;
let target, particles = [];
let animationId;

// DOM 元素
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');
const roundElement = document.getElementById('round');
const scoreValueElement = document.getElementById('score-value');
const highScoreValueElement = document.getElementById('high-score-value');

// 初始化游戏
function init() {
    // 初始化Three.js场景
    initThreeJS();
    
    // 更新最高分显示
    highScoreValueElement.textContent = gameState.highScore;
    
    // 绑定事件
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('touchstart', onTouchStart);
}

// 初始化Three.js
function initThreeJS() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF8FAFC);
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // 创建射线投射器
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // 开始渲染循环
    animate();
}

// 动画循环
function animate() {
    animationId = requestAnimationFrame(animate);
    
    // 更新目标动画
    if (target) {
        updateTargetAnimation();
    }
    
    // 更新粒子
    updateParticles();
    
    // 渲染场景
    renderer.render(scene, camera);
}

// 更新目标动画
function updateTargetAnimation() {
    if (target.type === 'cube') {
        target.rotation.x += 0.01;
        target.rotation.y += 0.01;
    } else if (target.type === 'sphere') {
        target.position.y = Math.sin(Date.now() * 0.001) * 0.5;
    } else if (target.type === 'cylinder') {
        target.rotation.z += 0.01;
    } else if (target.type === 'tetrahedron') {
        target.rotation.x += 0.015;
        target.rotation.y += 0.01;
    } else if (target.type === 'octahedron') {
        target.rotation.z += 0.015;
        target.position.y = Math.sin(Date.now() * 0.0015) * 0.4;
    } else if (target.type === 'dodecahedron') {
        target.rotation.x += 0.008;
        target.rotation.y += 0.012;
        target.rotation.z += 0.005;
    }
}

// 更新粒子
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.position.x += particle.velocity.x;
        particle.position.y += particle.velocity.y;
        particle.position.z += particle.velocity.z;
        particle.scale.x *= 0.98;
        particle.scale.y *= 0.98;
        particle.scale.z *= 0.98;
        
        if (particle.scale.x < 0.1) {
            scene.remove(particle);
            particles.splice(i, 1);
        }
    }
}

// 开始游戏
function startGame() {
    // 播放开始音效
    sounds.start.play();
    
    // 重置游戏状态
    gameState.score = 0;
    gameState.gameTime = 0;
    gameState.round = 1;
    gameState.state = 'playing';
    
    // 更新UI
    scoreElement.textContent = gameState.score;
    timeElement.textContent = gameState.gameTime;
    roundElement.textContent = gameState.round;
    
    // 切换屏幕
    startScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    // 开始游戏循环
    gameLoop();
    // 生成第一个目标
    generateTarget();
}

// 游戏循环
function gameLoop() {
    if (gameState.state !== 'playing') return;
    
    // 更新游戏时间
    gameState.gameTime += 0.1;
    timeElement.textContent = gameState.gameTime.toFixed(1);
    
    // 检查游戏是否结束
    if (gameState.round > gameState.maxRounds) {
        endGame();
        return;
    }
    
    // 继续游戏循环
    setTimeout(gameLoop, 100);
}

// 生成目标
function generateTarget() {
    // 移除旧目标
    if (target) {
        scene.remove(target);
    }
    
    // 随机生成目标类型（添加更多几何体类型）
    const types = ['cube', 'sphere', 'cylinder', 'tetrahedron', 'octahedron', 'dodecahedron'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // 随机生成大小（确保大小适中）
    const size = 0.3 + Math.random() * 0.4;
    
    // 随机生成位置（确保分散）
    const x = (Math.random() - 0.5) * 5;
    const y = (Math.random() - 0.5) * 5;
    const z = 0;
    
    // 创建几何体
    let geometry;
    if (type === 'cube') {
        geometry = new THREE.BoxGeometry(size, size, size);
    } else if (type === 'sphere') {
        geometry = new THREE.SphereGeometry(size, 32, 32);
    } else if (type === 'cylinder') {
        geometry = new THREE.CylinderGeometry(size / 2, size / 2, size, 32);
    } else if (type === 'tetrahedron') {
        geometry = new THREE.TetrahedronGeometry(size);
    } else if (type === 'octahedron') {
        geometry = new THREE.OctahedronGeometry(size);
    } else if (type === 'dodecahedron') {
        geometry = new THREE.DodecahedronGeometry(size);
    }
    
    // 随机生成颜色（使用指定的颜色方案）
    const colors = [0xFF6B6B, 0x4ECDC4, 0xA78BFA];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // 创建材质
    const material = new THREE.MeshStandardMaterial({ 
        color: color,
        emissive: color,
        emissiveIntensity: 0.3
    });
    
    // 创建目标
    target = new THREE.Mesh(geometry, material);
    target.position.set(x, y, z);
    target.type = type;
    scene.add(target);
    
    // 记录目标出现时间
    gameState.targetAppearTime = Date.now();
    gameState.isTargetActive = true;
}

// 处理鼠标点击
function onMouseDown(event) {
    if (gameState.state !== 'playing') return;
    
    // 计算鼠标位置
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // 检测点击
    detectClick();
}

// 处理触摸
function onTouchStart(event) {
    if (gameState.state !== 'playing') return;
    
    // 计算触摸位置
    const touch = event.touches[0];
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    
    // 检测点击
    detectClick();
}

// 检测点击
function detectClick() {
    // 更新射线
    raycaster.setFromCamera(mouse, camera);
    
    // 检测碰撞
    const intersects = raycaster.intersectObjects(scene.children);
    
    if (intersects.length > 0 && gameState.isTargetActive) {
        // 点击到目标
        const intersect = intersects[0];
        if (intersect.object === target) {
            handleTargetClick();
        }
    } else {
        // 点击到空白区域
        handleMissClick();
    }
}

// 处理点击目标
function handleTargetClick() {
    // 播放点击音效
    sounds.click.play();
    
    // 计算反应时间
    const reactionTime = Date.now() - gameState.targetAppearTime;
    gameState.reactionTime = reactionTime;
    
    // 计算分数（反应时间越短，分数越高）
    const points = Math.max(0, 1000 - reactionTime);
    gameState.score += Math.round(points);
    
    // 更新UI
    scoreElement.textContent = gameState.score;
    
    // 生成成功粒子效果
    createParticles(target.position, 0x10B981);
    
    // 移除目标
    scene.remove(target);
    gameState.isTargetActive = false;
    
    // 进入下一回合
    gameState.round++;
    roundElement.textContent = gameState.round;
    
    // 检查游戏是否结束
    if (gameState.round <= gameState.maxRounds) {
        // 生成新目标
        setTimeout(generateTarget, 500);
    }
}

// 处理点击空白
function handleMissClick() {
    // 播放错过音效
    sounds.miss.play();
    
    // 扣分
    gameState.score = Math.max(0, gameState.score - 50);
    
    // 更新UI
    scoreElement.textContent = gameState.score;
    
    // 生成失败粒子效果
    createParticles(new THREE.Vector3(0, 0, 0), 0xEF4444);
}

// 创建粒子效果
function createParticles(position, color) {
    for (let i = 0; i < 50; i++) {
        const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: color });
        const particle = new THREE.Mesh(geometry, material);
        
        // 设置位置
        particle.position.copy(position);
        
        // 设置速度
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        
        // 添加到场景
        scene.add(particle);
        particles.push(particle);
    }
}

// 结束游戏
function endGame() {
    // 播放结束音效
    sounds.end.play();
    
    gameState.state = 'end';
    
    // 更新最高分
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('highScore', gameState.highScore);
    }
    
    // 更新UI
    scoreValueElement.textContent = gameState.score;
    highScoreValueElement.textContent = gameState.highScore;
    
    // 切换屏幕
    gameScreen.classList.remove('active');
    endScreen.classList.add('active');
    
    // 移除目标
    if (target) {
        scene.remove(target);
        target = null;
    }
}

// 重新开始游戏
function restartGame() {
    // 清空粒子
    particles.forEach(particle => scene.remove(particle));
    particles = [];
    
    // 切换屏幕
    endScreen.classList.remove('active');
    startScreen.classList.add('active');
}

// 窗口大小变化
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 启动游戏
init();