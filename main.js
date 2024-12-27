import * as THREE from 'https://esm.sh/three@0.159.0';
import { EffectComposer } from 'https://esm.sh/three@0.159.0/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'https://esm.sh/three@0.159.0/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'https://esm.sh/three@0.159.0/examples/jsm/postprocessing/UnrealBloomPass';
import { FontLoader } from 'https://esm.sh/three@0.159.0/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'https://esm.sh/three@0.159.0/examples/jsm/geometries/TextGeometry';
import { gsap } from 'https://esm.sh/gsap@3.12.2';

// 在文件开头声明全局变量
const container = document.getElementById('scene-container');
const scrollContainer = document.querySelector('.container');

// 创建场景
const scene = new THREE.Scene();

// 创建相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 15);
camera.lookAt(0, 4, 0);

// 声明全局变量
let composer;
let bloomPass;
let isTreeComplete = false;  // 移到顶部，作为全局变量
let treeRotation = 0;       // 添加树的旋转角度

// 树的参数
const treeHeight = 15;
const maxParticles = 2000;
let currentParticle = 0;
let currentHeight = 0;
const growthSpeed = 0.1;
const rotationSpeed = 0.05;
let currentRotation = 0;

// 创建渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
container.appendChild(renderer.domElement);

// 优化性能
renderer.shadowMap.enabled = false;

// 添加灯光
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

try {
    // 添加后期处理
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // 添加发光效果（在移动设备上降低质量）
    bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2),
        0.8,
        0.3,
        0.75
    );
    composer.addPass(bloomPass);
} catch (error) {
    console.error('后期处理初始化失败:', error);
}

// 处理���大小变化
let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(async () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        
        composer.setSize(width, height);
        bloomPass.setSize(width / 2, height / 2);

        // 如果树已经完成，重新创建文字以适应新的屏幕大小
        if (isTreeComplete) {
            // 移除旧的文字
            const oldText = scene.children.find(child => child.geometry instanceof TextGeometry);
            if (oldText) {
                scene.remove(oldText);
                oldText.geometry.dispose();
                oldText.material.dispose();
            }
            // 创建新的文字
            try {
                const newText = await createText();
                // 保持文字可见
                newText.material.opacity = 1;
                // 添加浮动动画
                gsap.to(newText.position, {
                    y: newText.position.y + 0.5,
                    duration: 2,
                    ease: "power1.inOut",
                    yoyo: true,
                    repeat: -1,
                });
            } catch (error) {
                console.error('重新创建文字失败:', error);
            }
        }
    }, 250);
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 100);
});

// 颜色组 - 使用彩虹色渐变
const colors = [
    new THREE.Color(0xff0000), // 红色
    new THREE.Color(0xff4500), // 橙红
    new THREE.Color(0xff8c00), // 深橙
    new THREE.Color(0xffd700), // 金色
    new THREE.Color(0x9ef01a), // 黄绿
    new THREE.Color(0x32cd32), // 酸橙绿
    new THREE.Color(0x00ff7f), // 春绿
    new THREE.Color(0x40e0d0), // 绿松石
    new THREE.Color(0x1e90ff), // 道奇蓝
    new THREE.Color(0x9370db), // 中紫
    new THREE.Color(0xff69b4), // 粉红
    new THREE.Color(0xff1493)  // 深粉红
];

// 创建粒子系统
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(maxParticles * 3);
const particleColors = new Float32Array(maxParticles * 3);
const sizes = new Float32Array(maxParticles);

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const material = new THREE.PointsMaterial({
    size: 0.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

// 创建五角星
function createStar() {
    const starShape = new THREE.Shape();
    const spikes = 5;
    const outerRadius = 0.8;
    const innerRadius = 0.4;

    for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / spikes) * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        if (i === 0) starShape.moveTo(x, y);
        else starShape.lineTo(x, y);
    }

    const extrudeSettings = {
        depth: 0.2,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 3
    };

    const geometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.8,
        shininess: 100,
        specular: 0xffd700
    });

    const star = new THREE.Mesh(geometry, material);
    star.position.y = treeHeight;
    star.rotation.z = Math.PI / 2;
    // 初始缩放设置为0
    star.scale.set(0, 0, 0);
    scene.add(star);
    return star;
}

const star = createStar();

// 创建雪花
function createSnow() {
    const snowGeometry = new THREE.BufferGeometry();
    const snowCount = 2000; // 减少雪花数量
    const snowPositions = new Float32Array(snowCount * 3);
    const snowSpeeds = new Float32Array(snowCount);
    const snowSizes = new Float32Array(snowCount);
    const snowSwayFactors = new Float32Array(snowCount);
    const snowRotations = new Float32Array(snowCount);
    
    // 计算视锥体范围
    const fov = camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * camera.position.z;
    const width = height * camera.aspect;
    
    // 调整分布范围
    const areaWidth = width * 2;
    const areaHeight = height * 2;
    const areaDepth = 60;
    
    for (let i = 0; i < snowCount; i++) {
        const i3 = i * 3;
        snowPositions[i3] = (Math.random() - 0.5) * areaWidth;
        snowPositions[i3 + 1] = (Math.random() - 0.5) * areaHeight + camera.position.y;
        snowPositions[i3 + 2] = (Math.random() - 0.5) * areaDepth - camera.position.z;
        
        // 调整雪花大小和速度
        snowSizes[i] = Math.random() * 0.1 + 0.05; // 更小的雪花
        snowSpeeds[i] = (0.015 + Math.random() * 0.01) * (1 - snowSizes[i] * 2); // 降低落速度
        
        snowSwayFactors[i] = Math.random() * 0.3 + 0.1; // 小摆动幅度
        snowRotations[i] = Math.random() * Math.PI * 2;
    }
    
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    snowGeometry.setAttribute('size', new THREE.BufferAttribute(snowSizes, 1));
    
    // 创建雪花纹理
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();
    
    const snowTexture = new THREE.CanvasTexture(canvas);
    
    const snowMaterial = new THREE.PointsMaterial({
        size: 0.4,
        map: snowTexture,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: false,
        fog: true
    });
    
    const snow = new THREE.Points(snowGeometry, snowMaterial);
    scene.add(snow);
    return { 
        mesh: snow, 
        speeds: snowSpeeds, 
        swayFactors: snowSwayFactors,
        rotations: snowRotations,
        time: 0,
        width: areaWidth,
        height: areaHeight,
        depth: areaDepth
    };
}

const snow = createSnow();

// 更新雪花动画
function updateSnow() {
    snow.time += 0.001;
    const positions = snow.mesh.geometry.attributes.position.array;
    const sizes = snow.mesh.geometry.attributes.size.array;
    
    for (let i = 0; i < positions.length; i += 3) {
        const index = i / 3;
        
        // 基于大小的下落速度
        const fallSpeed = snow.speeds[index] * (1 + Math.sin(snow.time + index) * 0.2);
        positions[i + 1] -= fallSpeed;
        
        // 更自然的摆动（考虑风的影响）
        const swayAmount = snow.swayFactors[index];
        const windStrength = Math.sin(snow.time * 0.5) * 0.5 + 0.5; // 风力变化
        const windDirection = Math.sin(snow.time * 0.2); // 风向变化
        const windEffect = Math.sin(snow.time + positions[i] * 0.1) * 0.05 * windStrength;
        
        // 水平运动（考虑风向）
        positions[i] += (Math.sin(snow.time + snow.rotations[index]) * 0.01 * swayAmount + windEffect) * windDirection;
        positions[i + 2] += Math.cos(snow.time + snow.rotations[index]) * 0.01 * swayAmount;
        
        // 当雪花超出视野范围时置位置
        if (positions[i + 1] < camera.position.y - snow.height/2) {
            positions[i + 1] = camera.position.y + snow.height/2;
            positions[i] = (Math.random() - 0.5) * snow.width;
            positions[i + 2] = (Math.random() - 0.5) * snow.depth - camera.position.z;
            // 重置旋转角度
            snow.rotations[index] = Math.random() * Math.PI * 2;
        }
        
        // 边界检查
        if (Math.abs(positions[i]) > snow.width/2) {
            positions[i] = Math.sign(positions[i]) * snow.width/2;
        }
        if (Math.abs(positions[i + 2] + camera.position.z) > snow.depth/2) {
            positions[i + 2] = Math.sign(positions[i + 2]) * snow.depth/2 - camera.position.z;
        }
    }
    
    snow.mesh.geometry.attributes.position.needsUpdate = true;
}

// 创建文字
async function createText() {
    try {
        const loader = new FontLoader();
        const font = await new Promise((resolve, reject) => {
            loader.load(
                'https://cdn.jsdelivr.net/npm/three@0.159.0/examples/fonts/optimer_bold.typeface.json',
                resolve,
                undefined,
                reject
            );
        });

        // 根据屏幕宽度计算字体大小
        const screenWidth = window.innerWidth;
        let fontSize, textZ, textY;
        
        if (screenWidth <= 480) { // 手机屏幕
            fontSize = 1.5;
            textZ = -3;
            textY = treeHeight * 0.3;
        } else if (screenWidth <= 768) { // 平板屏幕
            fontSize = 2;
            textZ = -4;
            textY = treeHeight * 0.35;
        } else if (screenWidth <= 1024) { // 小型笔记本
            fontSize = 2.5;
            textZ = -4.5;
            textY = treeHeight * 0.4;
        } else { // 大屏幕
            fontSize = 3;
            textZ = -5;
            textY = treeHeight * 0.4;
        }
        
        const text = 'Merry Christmas';
        const textGeometry = new TextGeometry(text, {
            font: font,
            size: fontSize,
            height: fontSize * 0.067,  // 保持厚度比例
            curveSegments: 24,
            bevelEnabled: true,
            bevelThickness: fontSize * 0.0003,
            bevelSize: fontSize * 0.0003,
            bevelSegments: 10
        });

        // 计算文字宽度并居中
        textGeometry.computeBoundingBox();
        const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;

        const material = new THREE.MeshPhongMaterial({
            color: 0xfff4b8,
            emissive: 0xfff4b8,
            emissiveIntensity: 0.8,
            specular: 0xffffff,
            shininess: 100,
            transparent: true,
            opacity: 0,
            depthTest: false,
            depthWrite: false
        });

        const textMesh = new THREE.Mesh(textGeometry, material);
        textMesh.position.x = -textWidth / 2;
        textMesh.position.z = textZ;
        textMesh.position.y = textY;
        textMesh.rotation.x = 0;
        textMesh.renderOrder = 999;

        scene.add(textMesh);
        return textMesh;
    } catch (error) {
        console.error('创建文字失败:', error);
        throw error;
    }
}

// 添加一个变量来跟踪动画帧
let requestAnimationFrameId;

// 在文件开头添加时间相关变量
let lastTime = Date.now();
const ROTATION_SPEED = 0.1; // 降低旋转速度，每秒旋转0.05弧度（约2.86度）

// 修改动画函数
function animate() {
    requestAnimationFrameId = requestAnimationFrame(animate);
    
    // 计算时间增量
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000; // 转换为秒
    lastTime = currentTime;
    
    // 添加新粒子（树的生长阶段）
    if (!isTreeComplete && currentHeight < treeHeight && currentParticle < maxParticles) {
        // 树正在生长时，相机缓慢上移和后移
        const progress = currentHeight / treeHeight;
        camera.position.z = 15 + progress * 5; // 从15到20
        camera.position.y = 8 + progress * 2;  // 从8到10
        camera.lookAt(0, currentHeight * 0.5, 0);

        // 五角星随树的生长逐渐变大并跟随树顶
        const starScale = progress * 1.0;
        star.scale.set(starScale, starScale, starScale);
        star.position.y = currentHeight + 1;
        star.position.x = 0;
        star.position.z = 0;
        star.rotation.y += 0.01;

        const particlesPerLayer = 6; // 增加每层的粒子数
        for (let i = 0; i < particlesPerLayer && currentParticle < maxParticles; i++) {
            const heightRatio = currentHeight / treeHeight;
            const radius = 6 * (1 - Math.pow(heightRatio, 1.5)); // 增大基础半径
            
            const angle = currentRotation + (i / particlesPerLayer) * Math.PI * 2;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            
            const index = currentParticle * 3;
            positions[index] = x;
            positions[index + 1] = currentHeight;
            positions[index + 2] = z;
            
            // 设置颜色
            const colorIndex = Math.floor(heightRatio * colors.length);
            const nextColorIndex = Math.min(colorIndex + 1, colors.length - 1);
            const mixRatio = (heightRatio * colors.length) % 1;
            
            const color = new THREE.Color().copy(colors[colorIndex]);
            if (colorIndex < colors.length - 1) {
                color.lerp(colors[nextColorIndex], mixRatio);
            }
            
            particleColors[index] = color.r;
            particleColors[index + 1] = color.g;
            particleColors[index + 2] = color.b;
            
            sizes[currentParticle] = Math.random() * 0.3 + 0.1; // 增大粒子尺寸
            currentParticle++;
        }
        
        currentRotation += rotationSpeed;
        currentHeight += growthSpeed;
        
        geometry.setDrawRange(0, currentParticle);
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
        geometry.attributes.size.needsUpdate = true;

        // 检查树是否完成生成
        if (currentHeight >= treeHeight || currentParticle >= maxParticles) {
            isTreeComplete = true;
            onTreeComplete();
        }
    }

    // 树完成后的持续动画
    if (isTreeComplete) {
        // 使用时间增量更新旋转角度，保持匀速旋转
        treeRotation = ROTATION_SPEED * deltaTime;
        
        // 更新所有粒子的位置
        for (let i = 0; i < currentParticle * 3; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            
            // 应用旋转变换
            positions[i] = x * Math.cos(treeRotation) - z * Math.sin(treeRotation);
            positions[i + 2] = x * Math.sin(treeRotation) + z * Math.cos(treeRotation);
        }
        geometry.attributes.position.needsUpdate = true;
        
        // 五角星动画 - 同步旋转速度
        star.rotation.y += ROTATION_SPEED * deltaTime;
        // 保持轻微的浮动效果
        star.rotation.x = Math.sin(currentTime * 0.0005) * 0.1; // 降低浮动频率
        star.position.y = treeHeight + 1.5 + Math.sin(currentTime * 0.0005) * 0.1;
    }

    // 始终更新雪花
    updateSnow();
    
    // 渲染场景
    composer.render();
}

animate();

// 添加动处理
let lastScrollY = window.scrollY;
let ticking = false;
let scrollTimeout;

function handleScroll() {
    lastScrollY = window.scrollY;
    if (!ticking) {
        window.requestAnimationFrame(() => {
            // 根据滚动位置调整场景
            const scrollProgress = lastScrollY / window.innerHeight;
            
            // 使用 transform3d 触发 GPU 加速
            container.style.transform = `translate3d(0, ${scrollProgress * 30}px, 0)`;
            container.style.opacity = 1 - (scrollProgress * 0.8);
            
            // 更新按钮状态和isAtTop变量
            if (scrollProgress >= 0.5 && isAtTop) {
                scrollButton.classList.remove('up');
                scrollButton.classList.add('down');
                isAtTop = false;
            } else if (scrollProgress < 0.5 && !isAtTop) {
                scrollButton.classList.remove('down');
                scrollButton.classList.add('up');
                isAtTop = true;
            }
            
            // 只在完全滚动到音乐页面时禁用渲染
            if (scrollProgress >= 1) {
                composer.enabled = false;
            } else {
                composer.enabled = true;
            }
            
            ticking = false;
        });
        ticking = true;
    }
}

// 使用 passive 选项优化滚动事件监听
window.addEventListener('scroll', handleScroll, { passive: true });

// 添加滚动提示的显示/隐藏逻辑
const scrollHint = document.querySelector('.scroll-hint');
let hintTimeout;

function showScrollHint() {
    if (isTreeComplete) {
        // 清除之前的定时器
        clearTimeout(hintTimeout);
        
        // 显示滚动提示
        scrollHint.style.display = 'block';
        requestAnimationFrame(() => {
            scrollHint.classList.add('visible');
        });
        
        // 10秒后隐藏提示
        hintTimeout = setTimeout(() => {
            scrollHint.classList.remove('visible');
            setTimeout(() => {
                scrollHint.style.display = 'none';
            }, 500);
        }, 10000);
    }
}

// 添加滚动按钮相关变量和函数
const scrollButton = document.querySelector('.scroll-button');
let isAtTop = true;

// 滚动到音乐播放器页面的函数
function scrollToMusicSection() {
    const musicSection = document.getElementById('music-section');
    if (isAtTop) {
        // 滚动到音乐页面
        musicSection.scrollIntoView({ behavior: 'smooth' });
        scrollButton.classList.remove('up');
        scrollButton.classList.add('down');
        isAtTop = false;
    } else {
        // 滚动回动画页面
        scrollContainer.scrollTo({ 
            top: 0, 
            behavior: 'smooth' 
        });
        scrollButton.classList.remove('down');
        scrollButton.classList.add('up');
        isAtTop = true;
    }
}

// 为滚动按钮添加点击事件
scrollButton.addEventListener('click', scrollToMusicSection);

// 修改树生成完成的处理逻辑
function onTreeComplete() {
    // 树生成完成后，相机缓动移动到最终位置
    gsap.to(camera.position, {
        z: 20,
        y: 10,
        duration: 2,
        ease: "power2.inOut"
    });

    // 调整五角星到最终位置
    gsap.to(star.position, {
        y: treeHeight + 1.5,
        x: 0,
        z: 0,
        duration: 1,
        ease: "power2.out"
    });
    
    // 延迟1秒后创建并动画文字
    setTimeout(() => {
        createText().then(textMesh => {
            // 从左到右显示文字
            gsap.fromTo(textMesh.material,
                { opacity: 0 },
                { 
                    opacity: 1,
                    duration: 2,
                    ease: "power1.inOut"
                }
            );

            // 添加上升动画
            textMesh.position.y -= 2;
            gsap.to(textMesh.position, {
                y: textMesh.position.y + 2,
                duration: 1.5,
                ease: "back.out(1.7)",
                onComplete: () => {
                    // 添加持续的上下浮动动画
                    gsap.to(textMesh.position, {
                        y: textMesh.position.y + 0.5,
                        duration: 2,
                        ease: "power1.inOut",
                        yoyo: true,
                        repeat: -1
                    });
                    
                    // 在文字动画完成后启用滚动和显示按钮
                    setTimeout(() => {
                        scrollContainer.classList.add('scrollable');
                        scrollButton.classList.add('visible', 'up', 'pulse');
                        // 2秒后移除脉冲动画
                        setTimeout(() => {
                            scrollButton.classList.remove('pulse');
                        }, 2000);
                    }, 500);
                }
            });
        }).catch(error => {
            console.error('创建文字失败:', error);
        });
    }, 1000);
}
