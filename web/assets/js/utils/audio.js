// Motor de Audio 8-Bits
console.log('Cargando motor de audio...');

const SoundFx = {
    ctx: null,
    
    init: function() {
        try {
            if (!this.ctx) { 
                this.ctx = new (window.AudioContext || window.webkitAudioContext)(); 
                console.log('Contexto de audio inicializado');
            }
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
                console.log('Contexto de audio reanudado');
            }
        } catch (error) {
            console.error('Error al inicializar audio:', error);
        }
    },
    
    playTone: function(freq, type, duration, startTime = 0, vol = 0.05) {
        try {
            if (!this.ctx) {
                console.warn('Contexto de audio no disponible');
                return;
            }
            
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
        } catch (error) {
            console.error('Error al reproducir tono:', error);
        }
    },
    
    tick: function() { 
        try {
            this.playTone(800, 'square', 0.03, 0, 0.01); 
        } catch (error) {
            console.error('Error en sonido tick:', error);
        }
    }, 
    
    click: function() { 
        try {
            this.tick(); 
        } catch (error) {
            console.error('Error en sonido click:', error);
        }
    },
    
    type: function() { 
        try {
            this.playTone(500, 'square', 0.015, 0, 0.005); 
        } catch (error) {
            console.error('Error en sonido type:', error);
        }
    },
    
    start: function() { 
        try {
            this.playTone(440, 'square', 0.1, 0, 0.05); 
            this.playTone(554, 'square', 0.1, 0.1, 0.05); 
            this.playTone(659, 'square', 0.2, 0.2, 0.05); 
            this.playTone(880, 'square', 0.3, 0.3, 0.05); 
        } catch (error) {
            console.error('Error en sonido start:', error);
        }
    },
    
    pause: function() { 
        try {
            this.playTone(440, 'triangle', 0.1, 0, 0.1); 
            this.playTone(349, 'triangle', 0.1, 0.1, 0.1); 
            this.playTone(293, 'triangle', 0.3, 0.2, 0.1); 
        } catch (error) {
            console.error('Error en sonido pause:', error);
        }
    },
    
    finish: function() { 
        try {
            this.playTone(523, 'square', 0.1, 0, 0.05); 
            this.playTone(659, 'square', 0.1, 0.1, 0.05); 
            this.playTone(783, 'square', 0.1, 0.2, 0.05); 
            this.playTone(1046, 'square', 0.4, 0.3, 0.05); 
        } catch (error) {
            console.error('Error en sonido finish:', error);
        }
    },
    
    error: function() { 
        try {
            this.playTone(150, 'sawtooth', 0.2, 0, 0.1); 
            this.playTone(100, 'sawtooth', 0.3, 0.1, 0.1); 
        } catch (error) {
            console.error('Error en sonido error:', error);
        }
    },
    
    alert: function() { 
        try {
            for(let i=0; i<10; i++) { 
                this.playTone(800, 'square', 0.2, i*0.4, 0.15); 
                this.playTone(1200, 'square', 0.2, (i*0.4)+0.2, 0.15); 
            } 
        } catch (error) {
            console.error('Error en sonido alert:', error);
        }
    },
    
    message: function() { 
        try {
            this.playTone(900, 'sine', 0.1, 0, 0.1); 
            this.playTone(1200, 'sine', 0.2, 0.1, 0.1); 
        } catch (error) {
            console.error('Error en sonido message:', error);
        }
    }
};

console.log('Motor de audio cargado correctamente');

// Exportar módulo
window.SoundFx = SoundFx;