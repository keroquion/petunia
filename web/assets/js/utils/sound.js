// ==========================================
// PETULAP - Motor de Audio 8-Bits
// ==========================================

const SoundFx = {
    ctx: null,
    
    init: function() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    
    playTone: function(freq, type, duration, startTime = 0, vol = 0.05) {
        if (!this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    },
    
    // Efectos individuales
    tick: function() {
        this.playTone(800, 'square', 0.03, 0, 0.01);
    },
    
    click: function() {
        this.tick();
    },
    
    type: function() {
        this.playTone(500, 'square', 0.015, 0, 0.005);
    },
    
    // Secuencias musicales
    start: function() {
        this.playTone(440, 'square', 0.1, 0, 0.05);
        this.playTone(554, 'square', 0.1, 0.1, 0.05);
        this.playTone(659, 'square', 0.2, 0.2, 0.05);
        this.playTone(880, 'square', 0.3, 0.3, 0.05);
    },
    
    pause: function() {
        this.playTone(440, 'triangle', 0.1, 0, 0.1);
        this.playTone(349, 'triangle', 0.1, 0.1, 0.1);
        this.playTone(293, 'triangle', 0.3, 0.2, 0.1);
    },
    
    finish: function() {
        this.playTone(523, 'square', 0.1, 0, 0.05);
        this.playTone(659, 'square', 0.1, 0.1, 0.05);
        this.playTone(783, 'square', 0.1, 0.2, 0.05);
        this.playTone(1046, 'square', 0.4, 0.3, 0.05);
    },
    
    error: function() {
        this.playTone(150, 'sawtooth', 0.2, 0, 0.1);
        this.playTone(100, 'sawtooth', 0.3, 0.1, 0.1);
    },
    
    alert: function() {
        for (let i = 0; i < 10; i++) {
            this.playTone(800, 'square', 0.2, i * 0.4, 0.15);
            this.playTone(1200, 'square', 0.2, (i * 0.4) + 0.2, 0.15);
        }
    },
    
    message: function() {
        this.playTone(900, 'sine', 0.1, 0, 0.1);
        this.playTone(1200, 'sine', 0.2, 0.1, 0.1);
    },
    
    // Vibración para dispositivos móviles
    vibrate: function(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }
};

// Exponer globalmente
window.SoundFx = SoundFx;
