// ==========================================
// PETULAP - Utilidades y Helpers
// ==========================================

const Helpers = {
    // Guardar en localStorage
    guardarStorage: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error guardando en storage:', e);
        }
    },
    
    // Leer de localStorage
    leerStorage: function(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Error leyendo storage:', e);
            return null;
        }
    },
    
    // Eliminar de localStorage
    eliminarStorage: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error eliminando de storage:', e);
        }
    },
    
    // Obtener fecha local en formato ISO (YYYY-MM-DD)
    obtenerFechaLocalISO: function() {
        return new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)
            .toISOString().split('T')[0];
    },
    
    // Parsear lista de items (separada por \n o |)
    parsearLista: function(str) {
        if (!str) return [];
        return str.split(/\||\n/).filter(i => i.trim() !== '');
    },
    
    // Formatear fecha para display
    formatearFecha: function(fechaStr) {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Calcular tiempo transcurrido en minutos
    calcularMinutos: function(startTime) {
        if (!startTime) return 0;
        return Math.floor((Date.now() - startTime) / 60000);
    },
    
    // Debounce para eventos frecuentes
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Validar email
    esEmailValido: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    // Escape HTML para evitar XSS
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // Generar ID único
    generarId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Formatear hora desde timestamp (ISO -> HH:MM)
    formatearHora: function(timestamp) {
        if (!timestamp) return '-';
        const fecha = new Date(timestamp);
        return fecha.toLocaleString('es-PE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Formatear tiempo en minutos a formato legible (90 -> "1h 30m")
    formatearTiempo: function(minutos) {
        if (!minutos || minutos <= 0) return '0m';
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        if (horas === 0) return `${mins}m`;
        if (mins === 0) return `${horas}h`;
        return `${horas}h ${mins}m`;
    }
};

// Exponer globalmente
window.Helpers = Helpers;
