// ==========================================
// PETULAP - Estado Global y App Principal
// ==========================================

// Estado global de la aplicación
const AppState = {
    currentUser: null,
    pollingInterval: null
};

// Exponer globalmente
window.AppState = AppState;

// ==========================================
// APP PRINCIPAL
// ==========================================

const App = {
    // Inicializar aplicación
    init: function() {
        // Inicializar Database
        if (!Database.init()) {
            console.error('No se pudo inicializar la base de datos');
            return;
        }
        
        // Inicializar Login
        LoginView.init();
        
        // Eventos globales de UI
        this.bindGlobalEvents();
    },
    
    bindGlobalEvents: function() {
        // Click sound en botones
        document.addEventListener('mousedown', (e) => {
            const tag = e.target.tagName.toLowerCase();
            const isBtn = e.target.closest('button');
            
            if (tag === 'button' || tag === 'select' || tag === 'input' || isBtn) {
                SoundFx.init();
                SoundFx.tick();
                
                const el = isBtn || e.target;
                if (el.classList && el.tagName.toLowerCase() === 'button') {
                    el.classList.remove('gamer-click');
                    void el.offsetWidth;
                    el.classList.add('gamer-click');
                }
            }
        });
        
        // Keyboard sounds
        document.addEventListener('keydown', (e) => {
            const tag = e.target.tagName.toLowerCase();
            if (tag === 'input' || tag === 'textarea') {
                SoundFx.init();
                SoundFx.type();
            }
        });
        
        // Online/Offline detection
        window.addEventListener('online', () => {
            UI.toast('Conexión restaurada', 'success');
        });
        
        window.addEventListener('offline', () => {
            UI.toast('Sin conexión a internet', 'warning');
        });
    },
    
    // Logout global
    logout: function() {
        try {
            SoundFx.pause();
            AppState.currentUser = null;
            Helpers.eliminarStorage(CONFIG.STORAGE.USER);
            
            // Detener polling
            if (typeof TecnicoView !== 'undefined' && TecnicoView.detenerPolling) {
                TecnicoView.detenerPolling();
            }
            if (typeof VentasView !== 'undefined' && VentasView.detenerPolling) {
                VentasView.detenerPolling();
            }
            
            // Detener timer
            if (typeof Timer !== 'undefined' && Timer.stop) {
                Timer.stop();
            }
            
            // Ocultar navbar
            UI.hideNavbar();
            
            // Reset form
            const form = document.getElementById('form-login');
            if (form) form.reset();
            
            // Mostrar login
            UI.showView('view-login');
            
            // Limpiar cualquier estado residual
            const views = ['view-tecnico', 'view-admin', 'view-ventas'];
            views.forEach(viewId => {
                const view = document.getElementById(viewId);
                if (view) view.classList.add('hidden-view');
            });
            
            console.log('Sesión cerrada correctamente');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Asegurarse de mostrar la vista de login incluso si hay errores
            UI.showView('view-login');
        }
    }
};

// Exponer App globalmente
window.App = App;
window.app = App; // Compatibilidad con código antiguo

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
