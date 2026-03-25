// ==========================================
// PETULAP - Aplicación Principal (Multi-página)
// ==========================================

// Estado global
const AppState = {
    currentUser: null,
    pollingInterval: null,
    tecnicoState: {
        actividad: '',
        tipo_actividad: CONFIG.TIPOS_ACTIVIDAD.PRODUCCION,
        status: 'libre',
        startTime: null,
        motivo: null,
        total_lote: 0,
        motivo_inicio: ''
    },
    misionPendiente: null,
    tecnicos: []
};

// Exponer globalmente
window.AppState = AppState;

// ==========================================
// APP PRINCIPAL
// ==========================================

const App = {
    // Inicializar aplicación
    init: async function() {
        // Inicializar Database
        if (!Database.init()) {
            console.error('No se pudo inicializar la base de datos');
            UI.toast('Error de conexión', 'error');
            return;
        }
        
        // Eventos globales de UI
        this.bindGlobalEvents();
        
        // Verificar sesión guardada
        await this.checkSession();
    },
    
    // Eventos globales
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
    
    // Verificar sesión guardada
    checkSession: async function() {
        const saved = Helpers.leerStorage(CONFIG.STORAGE.USER);
        if (!saved) return false;
        
        AppState.currentUser = saved;
        return true;
    },
    
    // Login
    login: async function() {
        const userInput = document.getElementById('login-user');
        const passInput = document.getElementById('login-pass');
        
        if (!userInput || !passInput) return;
        
        const username = userInput.value.trim();
        const password = passInput.value.trim();
        
        if (!username || !password) {
            UI.toast('Completa los campos', 'warning');
            return;
        }
        
        UI.setLoading('btn-login', true);
        
        try {
            const user = await Database.login(username, password);
            
            SoundFx.start();
            
            // Guardar sesión
            AppState.currentUser = { username: user.username, rol: user.rol };
            Helpers.guardarStorage(CONFIG.STORAGE.USER, AppState.currentUser);
            
            // Cargar técnicos
            AppState.tecnicos = await Database.cargarTecnicos();
            
            // Redirigir según rol
            this.redirectByRole(user.rol);
            
        } catch (error) {
            UI.toast(error.message, 'error');
        } finally {
            UI.setLoading('btn-login', false, 'INGRESAR <i class="fa-solid fa-arrow-right"></i>');
        }
    },
    
    // Redirigir según rol
    redirectByRole: function(rol) {
        switch (rol) {
            case CONFIG.ROLES.TECNICO:
                window.location.href = 'tecnico.html';
                break;
            case CONFIG.ROLES.VENTAS:
                window.location.href = 'ventas.html';
                break;
            default:
                window.location.href = 'admin.html';
        }
    },
    
    // Logout global
    logout: function() {
        SoundFx.pause();
        AppState.currentUser = null;
        Helpers.eliminarStorage(CONFIG.STORAGE.USER);
        
        // Detener polling
        this.detenerPolling();
        
        // Detener timer
        Timer.stop();
        
        // Redirigir a login
        window.location.href = 'index.html';
    },
    
    // Iniciar polling
    iniciarPolling: function(callback) {
        this.detenerPolling();
        if (callback) {
            callback(); // Ejecutar inmediatamente
            AppState.pollingInterval = setInterval(callback, CONFIG.POLLING_INTERVAL);
        }
    },
    
    // Detener polling
    detenerPolling: function() {
        if (AppState.pollingInterval) {
            clearInterval(AppState.pollingInterval);
            AppState.pollingInterval = null;
        }
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
    }
};

// Exponer globalmente
window.App = App;

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
