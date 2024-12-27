// 音乐播放列表
const playlist = [
    {
        title: 'Jingle Bells',
        artist: 'Traditional',
        url: 'https://music.163.com/song/media/outer/url?id=1892513652.mp3'
    },
    {
        title: 'Silent Night',
        artist: 'Traditional',
        url: 'https://music.163.com/song/media/outer/url?id=1892513653.mp3'
    },
    {
        title: 'Last Christmas',
        artist: 'Wham!',
        url: 'https://music.163.com/song/media/outer/url?id=1892513654.mp3'
    }
];

class MusicPlayer {
    constructor() {
        this.currentTrack = 0;
        this.isPlaying = false;
        this.audio = new Audio();
        
        // 获取DOM元素
        this.playBtn = document.getElementById('play');
        this.prevBtn = document.getElementById('prev');
        this.nextBtn = document.getElementById('next');
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
        
        // 音频事件
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextTrack());
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
        this.currentTrack--;
        if (this.currentTrack < 0) {
            this.currentTrack = playlist.length - 1;
        }
        this.loadTrack(this.currentTrack);
        this.playTrack();
    }
    
    nextTrack() {
        this.currentTrack++;
        if (this.currentTrack >= playlist.length) {
            this.currentTrack = 0;
        }
        this.loadTrack(this.currentTrack);
        this.playTrack();
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
}

// 等待DOM加载完成后初始化音乐播放器
document.addEventListener('DOMContentLoaded', () => {
    const musicPlayer = new MusicPlayer();
}); 