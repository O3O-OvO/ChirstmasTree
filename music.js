// 音乐播放列表
const playlist = [
    {
        title: 'Jingle Bells',
        artist: 'Traditional',
        url: 'https://music.163.com/song/media/outer/url?id=22509038.mp3'
    },
    {
        title: '圣诞结',
        artist: 'Traditional',
        url: 'https://music.163.com/song/media/outer/url?id=2658185677.mp3'
    },
    {
        title: 'Last Christmas',
        artist: 'Wham!',
        url: 'https://music.163.com/song/media/outer/url?id=1892513654.mp3'
    },
    {
        title: 'Merry Christmas Mr. Lawrence',
        artist: '坂本龍一',
        url: 'https://music.163.com/song/media/outer/url?id=4899152.mp3'
    }
];

class MusicPlayer {
    constructor() {
        this.currentTrack = 0;
        this.isPlaying = false;
        this.audio = new Audio();
        this.playMode = 'list'; // 'list', 'random', 'single'
        this.volume = 1.0; // 默认音量
        this.isMuted = false; // 是否静音
        
        // 获取DOM元素
        this.playBtn = document.getElementById('play');
        this.prevBtn = document.getElementById('prev');
        this.nextBtn = document.getElementById('next');
        this.playModeBtn = document.getElementById('playMode');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.progressContainer = document.querySelector('.progress-container');
        this.progressBar = document.querySelector('.progress-bar');
        this.currentTimeSpan = document.querySelector('.current-time');
        this.durationSpan = document.querySelector('.duration');
        this.playlistItems = document.querySelectorAll('.playlist-item');
        
        this.initializeEvents();
        this.loadTrack(this.currentTrack);
    }
    
    initializeEvents() {
        // 播放/暂停按钮事件
        this.playBtn.addEventListener('click', () => this.togglePlay());
        
        // 上一首/下一首按钮事件
        this.prevBtn.addEventListener('click', () => this.prevTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        
        // 播放模式按钮事件
        this.playModeBtn.addEventListener('click', () => this.togglePlayMode());
        
        // 音频事件
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.onTrackEnd());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        
        // 进度条点击事件
        this.progressContainer.addEventListener('click', (e) => this.setProgress(e));
        
        // 播放列表点击事件
        this.playlistItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                this.currentTrack = index;
                this.loadTrack(this.currentTrack);
                this.playTrack();
            });
        });
        
        // 音量控制事件
        this.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
        
        // 设置初始音量
        this.audio.volume = this.volume;
    }
    
    loadTrack(index) {
        this.audio.src = playlist[index].url;
        this.updatePlaylistUI();
    }
    
    updatePlaylistUI() {
        this.playlistItems.forEach((item, index) => {
            item.classList.remove('playing');
            if (index === this.currentTrack) {
                item.classList.add('playing');
            }
        });
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.pauseTrack();
        } else {
            this.playTrack();
        }
    }
    
    playTrack() {
        this.isPlaying = true;
        this.playBtn.textContent = '⏸';
        this.audio.play();
    }
    
    pauseTrack() {
        this.isPlaying = false;
        this.playBtn.textContent = '▶';
        this.audio.pause();
    }
    
    prevTrack() {
        if (this.playMode === 'random') {
            this.playRandomTrack();
        } else {
            this.currentTrack = (this.currentTrack - 1 + playlist.length) % playlist.length;
            this.loadTrack(this.currentTrack);
            this.playTrack();
        }
    }
    
    nextTrack() {
        if (this.playMode === 'random') {
            this.playRandomTrack();
        } else {
            this.currentTrack = (this.currentTrack + 1) % playlist.length;
            this.loadTrack(this.currentTrack);
            this.playTrack();
        }
    }
    
    updateProgress() {
        const { currentTime, duration } = this.audio;
        const progressPercent = (currentTime / duration) * 100;
        this.progressBar.style.width = `${progressPercent}%`;
        this.currentTimeSpan.textContent = this.formatTime(currentTime);
    }
    
    setProgress(e) {
        const width = this.progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = this.audio.duration;
        this.audio.currentTime = (clickX / width) * duration;
    }
    
    updateDuration() {
        this.durationSpan.textContent = this.formatTime(this.audio.duration);
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    togglePlayMode() {
        switch (this.playMode) {
            case 'list':
                this.playMode = 'random';
                this.playModeBtn.textContent = '🔀';
                this.playModeBtn.title = '随机播放';
                break;
            case 'random':
                this.playMode = 'single';
                this.playModeBtn.textContent = '🔂';
                this.playModeBtn.title = '单曲循环';
                break;
            case 'single':
                this.playMode = 'list';
                this.playModeBtn.textContent = '🔁';
                this.playModeBtn.title = '列表循环';
                break;
        }
    }
    
    onTrackEnd() {
        switch (this.playMode) {
            case 'list':
                this.nextTrack();
                break;
            case 'random':
                this.playRandomTrack();
                break;
            case 'single':
                this.audio.currentTime = 0;
                this.playTrack();
                break;
        }
    }
    
    playRandomTrack() {
        const oldTrack = this.currentTrack;
        do {
            this.currentTrack = Math.floor(Math.random() * playlist.length);
        } while (playlist.length > 1 && this.currentTrack === oldTrack);
        
        this.loadTrack(this.currentTrack);
        this.playTrack();
    }
    
    toggleMute() {
        if (this.isMuted) {
            this.audio.volume = this.volume;
            this.volumeBtn.textContent = '🔊';
            this.volumeSlider.value = this.volume * 100;
            this.isMuted = false;
        } else {
            this.audio.volume = 0;
            this.volumeBtn.textContent = '🔈';
            this.volumeSlider.value = 0;
            this.isMuted = true;
        }
    }
    
    setVolume(value) {
        this.volume = value;
        this.audio.volume = value;
        this.isMuted = value === 0;
        
        // 更新音量图标
        if (value === 0) {
            this.volumeBtn.textContent = '🔈';
        } else if (value < 0.5) {
            this.volumeBtn.textContent = '🔉';
        } else {
            this.volumeBtn.textContent = '🔊';
        }
    }
}

// 等待DOM加载完成后初始化音乐播放器
document.addEventListener('DOMContentLoaded', () => {
    const musicPlayer = new MusicPlayer();
}); 