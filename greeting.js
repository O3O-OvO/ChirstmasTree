// 圣诞祝福语列表
const greetings = [
    "愿圣诞的喜悦与祝福，如雪花般轻轻飘落在你的心间，带来温暖与幸福。🎄✨",
    "在这个充满奇迹的季节，愿你的每一个愿望都能成真，每一天都充满欢笑。🎅🎁",
    "圣诞快乐！愿平安夜的烛光照亮你的前路，新的一年充满希望与美好。⭐️🕯️",
    "愿圣诞老人带给你最美好的礼物，让你的生活充满欢乐与惊喜。🎄🎁",
    "圣诞节快乐！愿你的生活像圣诞树一样绚丽多彩，永远闪耀着幸福的光芒。✨🎄",
    "愿这个圣诞节带给你温暖的祝福，甜蜜的问候，还有永恒的快乐。❄️🎅",
    "圣诞快乐！愿你的生活如圣诞歌曲般欢快，如姜饼屋般温馨甜蜜。🎵🏠",
    "在这个特别的日子里，愿你收获满满的祝福，度过一个难忘的圣诞节。🎁✨",
    "愿圣诞的魔法为你带来无尽的欢乐，让每一刻都充满温暖与爱。🌟💝",
    "圣诞快乐！愿你的生活像圣诞彩灯一样绚丽多彩，永远闪耀着希望的光芒。🎄✨"
];

class GreetingCard {
    constructor() {
        this.greetingSection = document.getElementById('greeting-section');
        this.greetingText = document.querySelector('.greeting-text');
        this.refreshBtn = document.querySelector('.refresh-btn');
        this.decorations = document.querySelectorAll('.greeting-decorations div');
        this.greetingCard = document.querySelector('.greeting-card');
        this.switchBtns = document.querySelectorAll('.switch-greeting-btn');
        
        this.currentIndex = -1;
        this.isVisible = false;
        
        // 触摸事件相关变量
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.minSwipeDistance = 50; // 最小滑动距离
        
        this.initializeEvents();
        this.showRandomGreeting();
    }
    
    initializeEvents() {
        // 刷新按钮点击事件
        this.refreshBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            this.showRandomGreeting();
        });
        
        // 装饰元素的悬停效果
        this.decorations.forEach(decoration => {
            decoration.addEventListener('mouseover', () => {
                decoration.style.transform = 'scale(1.2)';
            });
            
            decoration.addEventListener('mouseout', () => {
                decoration.style.transform = '';
            });
        });

        // 阻止卡片内部点击事件冒泡
        this.greetingCard.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // 点击空白区域返回
        this.greetingSection.addEventListener('click', () => {
            this.hide();
        });

        // 切换按钮点击事件
        this.switchBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.isVisible) {
                    this.show();
                } else {
                    this.hide();
                }
            });
        });

        // 添加触摸事件监听
        document.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
        });

        document.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e);
        });
    }

    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
    }

    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].clientX;
        this.handleSwipe();
    }

    handleSwipe() {
        const swipeDistance = this.touchEndX - this.touchStartX;
        const musicSection = document.getElementById('music-section');
        const isInMusicSection = window.scrollY >= musicSection.offsetTop;

        // 只在音乐播放器页面处理滑动
        if (!isInMusicSection) return;

        if (Math.abs(swipeDistance) >= this.minSwipeDistance) {
            if (swipeDistance < 0 && !this.isVisible) {
                // 向左滑动，显示祝福卡片
                this.show();
            } else if (swipeDistance > 0 && this.isVisible) {
                // 向右滑动，隐藏祝福卡片
                this.hide();
            }
        }
    }
    
    showRandomGreeting() {
        // 确保不会连续显示相同的祝福语
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * greetings.length);
        } while (newIndex === this.currentIndex && greetings.length > 1);
        
        this.currentIndex = newIndex;
        
        // 添加淡出效果
        this.greetingText.style.opacity = '0';
        
        setTimeout(() => {
            this.greetingText.textContent = greetings[this.currentIndex];
            // 添加淡入效果
            this.greetingText.style.opacity = '1';
        }, 300);
    }
    
    show() {
        if (!this.isVisible) {
            this.greetingSection.classList.add('active');
            this.isVisible = true;
            // 更新按钮状态
            this.switchBtns.forEach(btn => {
                btn.innerHTML = '🎄';
            });
        }
    }
    
    hide() {
        if (this.isVisible) {
            this.greetingSection.classList.remove('active');
            this.isVisible = false;
            // 更新按钮状态
            this.switchBtns.forEach(btn => {
                btn.innerHTML = '🎅';
            });
        }
    }
}

// 等待DOM加载完成后初始化祝福卡片
document.addEventListener('DOMContentLoaded', () => {
    const greetingCard = new GreetingCard();
    
    // 修改滚动按钮的行为
    const scrollButton = document.querySelector('.scroll-button');
    let isAtTop = true;
    
    scrollButton.addEventListener('click', () => {
        const musicSection = document.getElementById('music-section');
        if (isAtTop) {
            // 滚动到音乐页面
            musicSection.scrollIntoView({ behavior: 'smooth' });
            scrollButton.classList.remove('up');
            scrollButton.classList.add('down');
            isAtTop = false;
            greetingCard.hide(); // 确保祝福卡片是隐藏的
        } else {
            // 返回树的页面
            scrollContainer.scrollTo({ 
                top: 0, 
                behavior: 'smooth' 
            });
            scrollButton.classList.remove('down');
            scrollButton.classList.add('up');
            isAtTop = true;
            greetingCard.hide(); // 返回时隐藏祝福卡片
        }
    });
}); 