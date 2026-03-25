// ==========================================
// PETULAP - Timer Module
// ==========================================

const Timer = {
    interval: null,
    startTime: null,
    callback: null,
    
    // Iniciar timer
    start: function(timestamp, onTick) {
        this.stop();
        this.startTime = timestamp;
        this.callback = onTick;
        
        // Render inicial
        this.tick();
        
        // Intervalo cada minuto
        this.interval = setInterval(() => this.tick(), CONFIG.TIMER_INTERVAL);
    },
    
    // Detener timer
    stop: function() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.startTime = null;
        this.callback = null;
    },
    
    // Tick del timer
    tick: function() {
        if (!this.startTime || !this.callback) return;
        
        const minutos = Math.floor((Date.now() - this.startTime) / 60000);
        this.callback(minutos);
    },
    
    // Obtener tiempo actual en minutos
    getCurrentMinutes: function() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 60000);
    },
    
    // Formatear tiempo (minutos a string)
    format: function(minutos) {
        if (minutos < 60) return `${minutos} min`;
        const hrs = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return `${hrs}h ${mins}m`;
    },
    
    // Calcular duración entre dos timestamps
    calculateDuration: function(start, end) {
        const startMs = new Date(start).getTime();
        const endMs = end ? new Date(end).getTime() : Date.now();
        return Math.floor((endMs - startMs) / 60000);
    }
};

// Exponer globalmente
window.Timer = Timer;
