import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// 调试函数
function debug(message) {
    let debugElement = document.getElementById('debug-info');
    if (!debugElement) {
        debugElement = document.createElement('div');
        debugElement.id = 'debug-info';
        debugElement.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            max-width: 80%;
            max-height: 50%;
            overflow: auto;
        `;
        document.body.appendChild(debugElement);
    }
    debugElement.innerHTML = message + '<br>' + debugElement.innerHTML;
}

window.onerror = function(msg, url, line, col, error) {
    debug(`Error: ${msg}<br>Line: ${line}<br>Column: ${col}`);
    return false;
};

// 创建场景
const scene = new THREE.Scene();

// 创建相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// 声明全局变量
let composer;
let bloomPass;

// 创建渲染器
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "default",
    alpha: true,
    stencil: false,
    precision: "mediump"
});
debug('渲染器创建成功');

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('container').appendChild(renderer.domElement);
debug('渲染器初始化完成');

// 优化性能
renderer.shadowMap.enabled = false;

// 添加灯光
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);
debug('灯光添加完成');

try {
    debug('开始初始化后期处理...');
    // 添加后期处理
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    debug('后期处理初始化成功');

    // 添加发光效果
    bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.8,
        0.3,
        0.75
    );
    composer.addPass(bloomPass);
    debug('发光效果添加成功');
} catch (error) {
    debug('后期处理初始化失败: ' + error.message);
}

// 处理窗口大小变化
let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        composer.setSize(width, height);
        bloomPass.setSize(width, height);
    }, 250);
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 100);
});

// 树的参数
const treeHeight = 15;
const maxParticles = 2000;
let currentParticle = 0;
let currentHeight = 0;
const growthSpeed = 0.05;
const rotationSpeed = 0.05;
let currentRotation = 0;
let isTreeComplete = false;  // 添加标志来判断树是否创建完成
let treeRotation = 0;       // 添加树的整旋转角度

// 颜色组
const colors = [
    new THREE.Color(0x1a472a), // 深绿
    new THREE.Color(0x2d5a27), // 中深绿
    new THREE.Color(0x3d6b33), // 中绿偏深
    new THREE.Color(0x5c8a57), // 中绿
    new THREE.Color(0x7ab556), // 浅绿
    new THREE.Color(0x98c379), // 浅绿
    new THREE.Color(0xb8d957), // 黄绿
    new THREE.Color(0xd4e157)  // 亮黄
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
        emissiveIntensity: 0.8,  // 调整发光强度
        shininess: 100,
        specular: 0xffd700       // 添加高光颜色
    });

    const star = new THREE.Mesh(geometry, material);
    star.position.y = treeHeight;
    star.rotation.z = Math.PI / 2;
    scene.add(star);
    return star;
}

const star = createStar();

// 创建雪花
function createSnow() {
    const snowGeometry = new THREE.BufferGeometry();
    const snowCount = 2000;
    const snowPositions = new Float32Array(snowCount * 3);
    const snowSpeeds = new Float32Array(snowCount);
    const snowSizes = new Float32Array(snowCount);
    const snowSwayFactors = new Float32Array(snowCount);
    
    for (let i = 0; i < snowCount; i++) {
        const i3 = i * 3;
        snowPositions[i3] = (Math.random() - 0.5) * 60;
        snowPositions[i3 + 1] = Math.random() * treeHeight * 3;
        snowPositions[i3 + 2] = (Math.random() - 0.5) * 60;
        
        snowSpeeds[i] = Math.random() * 0.03 + 0.02;
        snowSizes[i] = Math.random() * 0.2 + 0.1;
        snowSwayFactors[i] = Math.random() * 2 + 1;
    }
    
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    snowGeometry.setAttribute('size', new THREE.BufferAttribute(snowSizes, 1));
    
    // 创建圆形雪花纹理
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // 创建径向渐变
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // 绘制圆形
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();
    
    const snowTexture = new THREE.CanvasTexture(canvas);
    
    const snowMaterial = new THREE.PointsMaterial({
        size: 0.3,
        map: snowTexture,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    
    const snow = new THREE.Points(snowGeometry, snowMaterial);
    scene.add(snow);
    return { 
        mesh: snow, 
        speeds: snowSpeeds, 
        swayFactors: snowSwayFactors,
        time: 0 
    };
}

const snow = createSnow();

// 动画函数中更新雪花
function updateSnow() {
    snow.time += 0.002;
    const positions = snow.mesh.geometry.attributes.position.array;
    
    for (let i = 0; i < positions.length; i += 3) {
        const index = i / 3;
        
        // 更新垂直位置
        positions[i + 1] -= snow.speeds[index];
        
        // 添加水平摆动
        positions[i] += Math.sin(snow.time + snow.swayFactors[index]) * 0.02;
        positions[i + 2] += Math.cos(snow.time + snow.swayFactors[index]) * 0.02;
        
        // 当雪花落到地面以下时，重置到顶部
        if (positions[i + 1] < -5) {
            positions[i + 1] = treeHeight * 3;
            positions[i] = (Math.random() - 0.5) * 60;
            positions[i + 2] = (Math.random() - 0.5) * 60;
        }
    }
    
    snow.mesh.geometry.attributes.position.needsUpdate = true;
}

// 创建文字
async function createText() {
    const loader = new FontLoader();
    try {
        const font = await new Promise((resolve, reject) => {
            loader.load(
                'https://threejs.org/examples/fonts/optimer_bold.typeface.json',
                (font) => {
                    resolve(font);
                },
                (progress) => {
                },
                (error) => {
                    reject(error);
                }
            );
        });

        const text = 'Merry Christmas';
        const textGeometry = new TextGeometry(text, {
            font: font,
            size: 1,               // 增大字体大小
            height: 0.2,           // 增加厚度
            curveSegments: 24,     // 增加曲线细分以获得更平滑的效果
            bevelEnabled: true,
            bevelThickness: 0.001,   // 增加斜角厚度
            bevelSize: 0.001,        // 增加斜角大小
            bevelSegments: 10
        });

        // 计算文字宽度并居中
        textGeometry.computeBoundingBox();
        const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;

        const material = new THREE.MeshPhongMaterial({
            color: 0xfff4b8,        // 淡黄色
            emissive: 0xfff4b8,     // 发光效果也为淡黄色
            emissiveIntensity: 0.8,  // 增强发光强度
            specular: 0xffffff,     // 保持白色高光
            shininess: 100,         // 增加光泽度
            transparent: true,
            opacity: 0
        });

        const textMesh = new THREE.Mesh(textGeometry, material);
        textMesh.position.x = -textWidth / 2;  // 平居中
        textMesh.position.z = 0;               // 放在中间
        textMesh.position.y = treeHeight * 0.4;  // 垂直位置调整到树的中部偏下
        textMesh.rotation.x = 0;               // 移除倾斜角度

        scene.add(textMesh);
        return textMesh;
    } catch (error) {
        throw error;
    }
}

// 动画函数
function animate() {
    requestAnimationFrame(animate);

    // 添加新粒子
    if (currentHeight < treeHeight && currentParticle < maxParticles) {
        debug(`树生长进度: ${Math.round((currentHeight / treeHeight) * 100)}%`);
        // 树正在生长时，相机逐渐后移
        const progress = currentHeight / treeHeight;
        camera.position.z = 10 + progress * 10; // 从10到20
        camera.position.y = 5 + progress * 5;   // 从5到10
        camera.lookAt(0, currentHeight * 0.5, 0);

        const particlesPerLayer = 4;
        for (let i = 0; i < particlesPerLayer && currentParticle < maxParticles; i++) {
            const heightRatio = currentHeight / treeHeight;
            const radius = 5 * (1 - Math.pow(heightRatio, 1.5));
            
            const angle = currentRotation + (i / particlesPerLayer) * Math.PI * 2;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            
            const index = currentParticle * 3;
            positions[index] = x;
            positions[index + 1] = currentHeight;
            positions[index + 2] = z;
            
            // 设颜色
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
            
            sizes[currentParticle] = Math.random() * 0.2 + 0.1;
            currentParticle++;
        }
        
        currentRotation += rotationSpeed;
        currentHeight += growthSpeed;
        
        geometry.setDrawRange(0, currentParticle);
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
        geometry.attributes.size.needsUpdate = true;
    } else if (!isTreeComplete) {
        isTreeComplete = true;
        debug('树生成完成，开始相机动画');
        
        // 树生成完成后，相机缓慢移动到最终位置
        gsap.to(camera.position, {
            z: 20,
            y: 10,
            duration: 2,
            ease: "power2.inOut",
            onComplete: () => debug('相机动画完成')
        });
        
        // 延迟1秒后创建并动画文字
        setTimeout(() => {
            debug('开始创建文字');
            createText().then(textMesh => {
                debug('文字创建成功，开始动画');
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
                    ease: "back.out(1.7)"
                });
            }).catch(error => {
                debug('创建文字失败: ' + error.message);
            });
        }, 1000);
    }

    // 如果树已经创建完成，进行整体旋转
    if (isTreeComplete) {
        treeRotation = 0.002; // 保持树的恒定旋转速度
        
        // 更新所有粒子的位置
        for (let i = 0; i < currentParticle * 3; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            
            // 应用纯转变换
            positions[i] = x * Math.cos(treeRotation) - z * Math.sin(treeRotation);
            positions[i + 2] = x * Math.sin(treeRotation) + z * Math.cos(treeRotation);
        }
        geometry.attributes.position.needsUpdate = true;
        
        // 五角星独立缓慢旋转
        star.rotation.y += 0.0005; // 减慢自转速
        star.rotation.x = Math.sin(treeRotation * 0.5) * 0.1; // 添加轻微的摆动
        star.position.y = treeHeight + 0.5 + Math.sin(treeRotation) * 0.1; // 添加上下浮动
    } else {
        // 树还在生长时的效果保持不变
        for (let i = 0; i < currentParticle * 3; i += 3) {
            positions[i] += (Math.random() - 0.5) * 0.005;
            positions[i + 2] += (Math.random() - 0.5) * 0.005;
        }
        geometry.attributes.position.needsUpdate = true;
    }

    // 更新雪花
    updateSnow();

    // 更新五角星位置和旋转
    star.rotation.y += 0.01;
    star.position.y = currentHeight + 1;

    // 使用composer而不是renderer来渲染
    composer.render();
}

animate();
