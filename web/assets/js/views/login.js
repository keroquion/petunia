// Vista de Login
console.log('Cargando módulo de login...');

const LoginView = {
    // Mostrar vista de login
    mostrar: function() {
        try {
            console.log('Mostrando vista de login');
            
            // Ocultar todas las vistas
            ['view-login', 'view-tecnico', 'view-admin', 'view-ventas'].forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.classList.add('hidden-view');
                }
            });
            
            // Mostrar vista de login
            const loginView = document.getElementById('view-login');
            if (loginView) {
                loginView.classList.remove('hidden-view');
                console.log('Vista de login mostrada');
            } else {
                console.error('No se encontró el elemento view-login');
            }
        } catch (error) {
            console.error('Error al mostrar vista de login:', error);
        }
    },

    // Procesar login
    procesar: async function() {
        try {
            console.log('Procesando login...');
            
            // Obtener valores del formulario
            const userInput = document.getElementById('login-user');
            const passInput = document.getElementById('login-pass');
            
            if (!userInput || !passInput) {
                console.error('No se encontraron los campos de login');
                Helpers.showToast('Error en el formulario de login', 'error');
                return;
            }
            
            const username = userInput.value.trim();
            const password = passInput.value.trim();
            
            // Validar campos con mejores mensajes
            if (!username) {
                Helpers.showToast('El nombre de usuario es obligatorio', 'warning');
                userInput.focus();
                return;
            }
            
            if (!password) {
                Helpers.showToast('La contraseña es obligatoria', 'warning');
                passInput.focus();
                return;
            }
            
            // Validar longitud mínima
            if (username.length < 3) {
                Helpers.showToast('El nombre de usuario debe tener al menos 3 caracteres', 'warning');
                userInput.focus();
                return;
            }
            
            if (password.length < 4) {
                Helpers.showToast('La contraseña debe tener al menos 4 caracteres', 'warning');
                passInput.focus();
                return;
            }
            
            // Mostrar estado de carga
            Helpers.setLoadingButton('btn-login', true, '');
            
            try {
                // Autenticar usuario
                const userData = await Database.autenticarUsuario(username, password);
                
                // Reproducir sonido de inicio
                if (window.SoundFx) SoundFx.start();
                
                // Guardar usuario actual
                window.app.currentUser = { 
                    username: userData.username, 
                    rol: userData.rol 
                };
                localStorage.setItem('petulap_user', JSON.stringify(window.app.currentUser));
                
                // Actualizar UI
                const navUserInfo = document.getElementById('nav-user-info');
                const userDisplay = document.getElementById('user-display');
                
                if (navUserInfo) navUserInfo.classList.remove('hidden-view');
                if (userDisplay) {
                    userDisplay.innerHTML = `<i class="fa-solid fa-user-circle mr-1"></i> ${userData.username}`;
                }
                
                // Cargar técnicos
                await window.app.cargarTecnicosDB();
                
                // Redirigir según rol
                if (userData.rol === 'tecnico') {
                    window.app.showView('view-tecnico');
                    await window.app.initTecnico();
                    window.app.startPolling();
                } else if (userData.rol === 'ventas') {
                    window.app.showView('view-ventas');
                    window.app.cargarVentas();
                    window.app.startPolling();
                } else {
                    window.app.showView('view-admin');
                    const fechaInput = document.getElementById('admin-fecha');
                    if (fechaInput) {
                        fechaInput.value = Helpers.obtenerFechaLocalISO();
                    }
                    window.app.cargarDashboardAdmin();
                }
                
                Helpers.showToast('Bienvenido', 'success');
                console.log('Login exitoso para usuario:', username);
            } catch (error) {
                console.error('Error en autenticación:', error);
                Helpers.showToast(error.message || 'Error de autenticación', 'error');
            } finally {
                Helpers.setLoadingButton('btn-login', false, 'INGRESAR <i class="fa-solid fa-arrow-right"></i>');
            }
        } catch (error) {
            console.error('Error general en proceso de login:', error);
            Helpers.showToast('Error inesperado', 'error');
        }
    },

    // Cerrar sesión
    cerrarSesion: function() {
        try {
            console.log('Cerrando sesión...');
            
            // Reproducir sonido de cierre
            if (window.SoundFx) SoundFx.pause();
            
            // Limpiar usuario actual
            window.app.currentUser = null;
            localStorage.removeItem('petulap_user');
            
            // Detener polling
            window.app.stopPolling();
            
            // Actualizar UI
            const navUserInfo = document.getElementById('nav-user-info');
            if (navUserInfo) navUserInfo.classList.add('hidden-view');
            
            const formLogin = document.getElementById('form-login');
            if (formLogin) formLogin.reset();
            
            // Mostrar vista de login
            this.mostrar();
            
            Helpers.showToast('Sesión cerrada', 'info');
            console.log('Sesión cerrada correctamente');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            Helpers.showToast('Error al cerrar sesión', 'error');
        }
    }
};

console.log('Módulo de login cargado correctamente');

// Exportar módulo
window.LoginView = LoginView;