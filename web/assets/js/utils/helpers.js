// Funciones auxiliares generales
console.log('Cargando módulo de utilidades...');

const Helpers = {
    // Obtener fecha local en formato ISO
    obtenerFechaLocalISO: function() {
        try {
            const date = new Date();
            const tzOffset = date.getTimezoneOffset() * 60000;
            return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
        } catch (error) {
            console.error('Error al obtener fecha local:', error);
            return new Date().toISOString().split('T')[0]; // Fallback
        }
    },

    // Mostrar mensajes toast
    showToast: function(message, type = 'info') {
        try {
            const container = document.getElementById('toast-container');
            if (!container) {
                console.warn('No se encontró el contenedor de toasts');
                return;
            }

            const toast = document.createElement('div');
            const colors = { 
                success: 'bg-green-500 border-b-4 border-green-700', 
                error: 'bg-red-500 border-b-4 border-red-700', 
                warning: 'bg-amber-500 border-b-4 border-amber-700', 
                info: 'bg-blue-500 border-b-4 border-blue-700' 
            };

            toast.className = `${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl font-black uppercase tracking-wider flex items-center justify-between transition-all duration-300 translate-y-[-20px] opacity-0 text-sm text-outline z-[1000]`;
            toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()" class="ml-4 hover:text-gray-200"><i class="fa-solid fa-times"></i></button>`;
            
            container.appendChild(toast);
            
            // Reproducir sonido según tipo
            if (window.SoundFx) {
                if(type === 'error') SoundFx.error(); 
                else if(type === 'warning') SoundFx.tick(); 
            }

            // Animación de entrada
            setTimeout(() => toast.classList.remove('translate-y-[-20px]', 'opacity-0'), 10);
            
            // Eliminar automáticamente después de 4 segundos
            setTimeout(() => { 
                toast.classList.add('opacity-0'); 
                setTimeout(() => {
                    if (toast.parentElement) toast.remove();
                }, 300); 
            }, 4000);
        } catch (error) {
            console.error('Error al mostrar toast:', error);
        }
    },

    // Manejar estado de botones de carga
    setLoadingButton: function(btnId, isLoading, html) {
        try {
            const btn = document.getElementById(btnId);
            if (!btn) {
                console.warn('Botón no encontrado:', btnId);
                return;
            }

            if (isLoading) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
            } else {
                btn.disabled = false;
                btn.innerHTML = html;
            }
        } catch (error) {
            console.error('Error al cambiar estado del botón:', error);
        }
    },

    // Validar formulario
    validateForm: function(fields) {
        try {
            for (let field of fields) {
                if (!field.value || field.value.trim() === '') {
                    this.showToast(`Campo ${field.name || 'requerido'} vacío`, 'warning');
                    field.focus();
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.error('Error en validación de formulario:', error);
            return false;
        }
    }
};

console.log('Módulo de utilidades cargado correctamente');

// Exportar módulo
window.Helpers = Helpers;