import * as THREE from 'https://esm.sh/three@0.159.0';
import { EffectComposer } from 'https://esm.sh/three@0.159.0/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'https://esm.sh/three@0.159.0/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'https://esm.sh/three@0.159.0/examples/jsm/postprocessing/UnrealBloomPass';
import { FontLoader } from 'https://esm.sh/three@0.159.0/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'https://esm.sh/three@0.159.0/examples/jsm/geometries/TextGeometry';
import { gsap } from 'https://esm.sh/gsap@3.12.2';

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
    antialias: false,
    powerPreference: "high-performance",
    alpha: true,
    stencil: false,
    depth: true,
    precision: "lowp"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('container').appendChild(renderer.domElement);

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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        
        composer.setSize(width, height);
        bloomPass.setSize(width / 2, height / 2);
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
let isTreeComplete = false;  // 添加标志来判断树否创建完成
let treeRotation = 0;       // 添加树的整旋转角度

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
    // 初始缩放设为0
    star.scale.set(0, 0, 0);
    scene.add(star);
    return star;
}

const star = createStar();

// 创建雪花
function createSnow() {
    const snowGeometry = new THREE.BufferGeometry();
    const snowCount = 3000; // 增加雪花数量
    const snowPositions = new Float32Array(snowCount * 3);
    const snowSpeeds = new Float32Array(snowCount);
    const snowSizes = new Float32Array(snowCount);
    const snowSwayFactors = new Float32Array(snowCount);
    const snowOpacities = new Float32Array(snowCount); // 添加透明度变化
    
    // 创建更大的范围
    const areaWidth = 80;
    const areaHeight = treeHeight * 4;
    const areaDepth = 80;
    
    for (let i = 0; i < snowCount; i++) {
        const i3 = i * 3;
        // 随机分布在更大的空间内
        snowPositions[i3] = (Math.random() - 0.5) * areaWidth;
        snowPositions[i3 + 1] = Math.random() * areaHeight;
        snowPositions[i3 + 2] = (Math.random() - 0.5) * areaDepth;
        
        // 更自然的下落速度
        snowSpeeds[i] = Math.random() * 0.02 + 0.01;
        // 更多样的雪花大小
        snowSizes[i] = Math.random() * 0.15 + 0.05;
        // 不同的摆动幅度
        snowSwayFactors[i] = Math.random() * 1.5 + 0.5;
        // 随机透明度
        snowOpacities[i] = Math.random() * 0.5 + 0.3;
    }
    
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    snowGeometry.setAttribute('size', new THREE.BufferAttribute(snowSizes, 1));
    snowGeometry.setAttribute('opacity', new THREE.BufferAttribute(snowOpacities, 1));
    
    // 创建更自然的雪花纹理
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // 创建柔和的径向渐变
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // 绘制更柔和的雪花
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();
    
    const snowTexture = new THREE.CanvasTexture(canvas);
    
    // 创建自定义着色器材质
    const snowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            texture: { value: snowTexture },
            time: { value: 0 }
        },
        vertexShader: `
            attribute float size;
            attribute float opacity;
            varying float vOpacity;
            void main() {
                vOpacity = opacity;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform sampler2D texture;
            varying float vOpacity;
            void main() {
                vec4 texColor = texture2D(texture, gl_PointCoord);
                gl_FragColor = vec4(texColor.rgb, texColor.a * vOpacity);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    
    const snow = new THREE.Points(snowGeometry, snowMaterial);
    scene.add(snow);
    return { 
        mesh: snow, 
        speeds: snowSpeeds, 
        swayFactors: snowSwayFactors,
        time: 0,
        opacities: snowOpacities
    };
}

const snow = createSnow();

// 更新雪花动画
function updateSnow() {
    snow.time += 0.001;
    const positions = snow.mesh.geometry.attributes.position.array;
    const opacities = snow.mesh.geometry.attributes.opacity.array;
    
    for (let i = 0; i < positions.length; i += 3) {
        const index = i / 3;
        
        // 更自然的下落运动
        positions[i + 1] -= snow.speeds[index];
        
        // 更自然的摆动
        const swayAmount = snow.swayFactors[index];
        const windEffect = Math.sin(snow.time * 2 + positions[i] * 0.1) * 0.1;
        positions[i] += Math.sin(snow.time + snow.swayFactors[index]) * 0.01 * swayAmount + windEffect;
        positions[i + 2] += Math.cos(snow.time + snow.swayFactors[index]) * 0.01 * swayAmount;
        
        // 透明度随高度渐变
        const heightRatio = positions[i + 1] / (treeHeight * 4);
        opacities[index] = snow.opacities[index] * (1 - Math.pow(heightRatio - 0.5, 2));
        
        // 当雪花落到地面以下时，重置到顶部
        if (positions[i + 1] < -5) {
            positions[i + 1] = treeHeight * 4;
            positions[i] = (Math.random() - 0.5) * 80;
            positions[i + 2] = (Math.random() - 0.5) * 80;
            opacities[index] = snow.opacities[index];
        }
    }
    
    snow.mesh.geometry.attributes.position.needsUpdate = true;
    snow.mesh.geometry.attributes.opacity.needsUpdate = true;
    snow.mesh.material.uniforms.time.value = snow.time;
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
        
        const text = 'Merry Christmas';
        const textGeometry = new TextGeometry(text, {
            font: font,
            size: 3,               // 增大字体大小
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
            shininess: 100,         // 增加光泽
            transparent: true,
            opacity: 0,
            depthTest: false,       // 禁用深度测试，确保文字始终在最前面
            depthWrite: false       // 禁用深度写入
        });

        const textMesh = new THREE.Mesh(textGeometry, material);
        textMesh.position.x = -textWidth / 2;  // 平居中
        textMesh.position.z = -5;              // 将文字移到前面
        textMesh.position.y = treeHeight * 0.4;  // 垂直位置调整的中部偏下
        textMesh.rotation.x = 0;               // 移除倾斜角度
        textMesh.renderOrder = 999;            // 设置最高渲染优先级

        scene.add(textMesh);
        return textMesh;
    } catch (error) {
        console.error('创建文字失败:', error);
        throw error;
    }
}

// 动画函数
function animate() {
    requestAnimationFrame(animate);

    // 添加新粒子
    if (currentHeight < treeHeight && currentParticle < maxParticles) {
        // 树正在生长时，相机逐渐后移
        const progress = currentHeight / treeHeight;
        camera.position.z = 10 + progress * 10; // 从10到20
        camera.position.y = 5 + progress * 5;   // 从5到10
        camera.lookAt(0, currentHeight * 0.5, 0);

        // 五角星随树的生长逐渐变大
        const starScale = progress * 1.0; // 最终大小为1
        star.scale.set(starScale, starScale, starScale);
        star.position.y = currentHeight + 1;
        star.rotation.y += 0.01;

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
        
        // 树生成完成后，相机缓动移到最终位置
        gsap.to(camera.position, {
            z: 20,
            y: 10,
            duration: 2,
            ease: "power2.inOut"
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
                            y: textMesh.position.y + 0.5, // 上下浮动0.5个单位
                            duration: 2,
                            ease: "power1.inOut",
                            yoyo: true, // 来回浮动
                            repeat: -1, // 无限重复
                        });
                    }
                });
            }).catch(error => {
            });
        }, 1000);
    }

    // 如果树已经创建完成，进行整体旋转
    if (isTreeComplete) {
        treeRotation = 0.002;
        
        // 更新所有粒子的位置
        for (let i = 0; i < currentParticle * 3; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            
            // 应用纯转变换
            positions[i] = x * Math.cos(treeRotation) - z * Math.sin(treeRotation);
            positions[i + 2] = x * Math.sin(treeRotation) + z * Math.cos(treeRotation);
        }
        geometry.attributes.position.needsUpdate = true;
        
        // 五角星跟随树的旋转
        const starX = star.position.x;
        const starZ = star.position.z;
        star.position.x = starX * Math.cos(treeRotation) - starZ * Math.sin(treeRotation);
        star.position.z = starX * Math.sin(treeRotation) + starZ * Math.cos(treeRotation);
        
        // 五角星自身的旋转和浮动
        star.rotation.y += 0.01; // 加快自转速度
        star.rotation.x = Math.sin(treeRotation * 0.5) * 0.1;
        star.position.y = treeHeight + 0.5 + Math.sin(treeRotation) * 0.1;
    }

    // 更新雪花
    updateSnow();

    // 使用composer而不是renderer来渲染
    composer.render();
}

animate();
