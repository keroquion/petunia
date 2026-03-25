// ==========================================
// PETULAP - Timer/Cronómetro
// ==========================================

const Timer = {
    interval: null,
    startTime: null,
    callback: null,
    
    // Iniciar timer
    start: function(startTime, onTick) {
        this.stop();
        this.startTime = startTime;
        this.callback = onTick;
        
        // Ejecutar inmediatamente
        this.tick();
        
        // Configurar intervalo
        this.interval = setInterval(() => this.tick(), 60000);
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
    
    // Obtener tiempo actual sin callback
    getCurrentMinutes: function() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 60000);
    },
    
    // Verificar si está corriendo
    isRunning: function() {
        return this.interval !== null;
    }
};

// Exponer globalmente
window.Timer = Timer;
