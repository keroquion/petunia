// ==========================================
// PETULAP - Vista de Admin
// ==========================================

const AdminView = {
    pollingInterval: null,
    
    // Inicializar vista
    init: async function() {
        if (!AppState.currentUser) {
            window.location.href = 'index.html';
            return;
        }
        
        // Mostrar navbar
        UI.showNavbar(AppState.currentUser);
        
        // Cargar técnicos si no están cargados
        if (AppState.tecnicos.length === 0) {
            AppState.tecnicos = await Database.cargarTecnicos();
        }
        UI.actualizarSelectsTecnicos(AppState.tecnicos);
        
        // Configurar fecha por defecto
        const fechaInput = document.getElementById('admin-fecha');
        if (fechaInput) {
            fechaInput.value = Helpers.obtenerFechaLocalISO();
        }
        
        // Cargar datos iniciales
        await this.cargarDatos();
        
        // Iniciar polling automático
        this.startPolling();
        
        // Detener polling cuando se cierre sesión
        window.addEventListener('beforeunload', () => this.stopPolling());
    },
    
    // Iniciar polling automático cada 15 segundos
    startPolling: function() {
        this.stopPolling(); // Limpiar cualquier polling anterior
        
        this.pollingInterval = setInterval(async () => {
            const fechaInput = document.getElementById('admin-fecha');
            const fechaActual = Helpers.obtenerFechaLocalISO();
            
            // Solo actualizar si estamos viendo la fecha actual
            if (fechaInput?.value === fechaActual) {
                await this.cargarDatos();
            }
        }, CONFIG.POLLING_INTERVAL);
    },
    
    // Detener polling
    stopPolling: function() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    },
    
    // Cargar datos del dashboard
    cargarDatos: async function() {
        const fechaInput = document.getElementById('admin-fecha');
        const fecha = fechaInput?.value || Helpers.obtenerFechaLocalISO();
        
        try {
            const registros = await Database.obtenerDashboardAdmin(fecha);
            this.renderGridTecnicos(registros);
            this.renderDetalles(registros);
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            UI.toast('Error cargando datos', 'error');
        }
    },
    
    // Renderizar grid de técnicos (mejorado)
    renderGridTecnicos: function(registros) {
        const container = document.getElementById('admin-grid-tecnicos');
        if (!container) return;
        
        const resumen = {};
        
        AppState.tecnicos.forEach(t => {
            const regTecnico = registros.filter(r => r.tecnico === t.username);
            
            let totalOK = 0;
            let totalFallo = 0;
            let tiempoTrabajado = 0;
            let estado = 'Libre';
            let ultimaActividad = '-';
            let ultimaHora = '-';
            
            regTecnico.forEach(r => {
                if (r.evento === 'Fin') {
                    totalOK += r.ok || 0;
                    totalFallo += r.fallo || 0;
                }
            });
            
            // Calcular estado actual y última actividad
            const ultimo = regTecnico[0];
            if (ultimo) {
                if (ultimo.evento === 'Inicio' || ultimo.evento === 'Reinicio') {
                    estado = 'Trabajando';
                } else if (ultimo.evento === 'Interrupción') {
                    estado = 'Pausado';
                } else if (ultimo.evento === 'Fin') {
                    estado = 'Libre';
                }
                ultimaActividad = ultimo.actividad || '-';
                ultimaHora = Helpers.formatearHora(ultimo.fecha_hora);
            }
            
            resumen[t.username] = {
                totalOK,
                totalFallo,
                estado,
                ultimaActividad,
                ultimaHora
            };
        });
        
        container.innerHTML = '';
        Object.entries(resumen).forEach(([nombre, data]) => {
            const colorEstado = data.estado === 'Trabajando' 
                ? 'bg-blue-600 text-white' 
                : data.estado === 'Pausado' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-green-600 text-white';
            
            const iconoEstado = data.estado === 'Trabajando' 
                ? 'fa-circle-notch fa-spin' 
                : data.estado === 'Pausado' 
                    ? 'fa-pause' 
                    : 'fa-circle-check';
            
            container.innerHTML += `
                <div class="bg-white rounded-2xl p-5 shadow-md border-l-4 border-blue-500 hover:shadow-lg transition fade-in">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-grow">
                            <h4 class="font-black text-lg text-gray-800 uppercase tracking-wide">${nombre}</h4>
                            <p class="text-xs text-gray-400 font-bold uppercase">Técnico</p>
                        </div>
                        <div class="flex items-center gap-2 px-3 py-2 rounded-lg ${colorEstado}">
                            <i class="fa-solid ${iconoEstado} text-sm"></i>
                            <span class="text-xs font-black uppercase">${data.estado}</span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div class="bg-green-50 rounded-lg p-3 border border-green-200">
                            <p class="text-3xl font-black text-green-600">${data.totalOK}</p>
                            <p class="text-xs text-green-700 font-bold uppercase mt-1">Completadas</p>
                        </div>
                        <div class="bg-red-50 rounded-lg p-3 border border-red-200">
                            <p class="text-3xl font-black text-red-600">${data.totalFallo}</p>
                            <p class="text-xs text-red-700 font-bold uppercase mt-1">Soporte</p>
                        </div>
                    </div>
                    
                    <div class="pt-3 border-t-2 border-gray-100">
                        <p class="text-xs text-gray-500 font-bold uppercase mb-1">Última Actividad:</p>
                        <p class="text-sm font-bold text-gray-700 truncate">${data.ultimaActividad}</p>
                        <p class="text-xs text-gray-400 mt-1">📍 ${data.ultimaHora}</p>
                    </div>
                </div>
            `;
        });
    },
    
    // Renderizar detalles de registros
    renderDetalles: function(registros) {
        const container = document.getElementById('admin-detalles-container');
        if (!container) return;
        
        if (registros.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i class="fa-solid fa-clipboard text-4xl mb-3"></i>
                    <p class="font-bold uppercase text-sm">Sin registros para esta fecha</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        // Agrupar por técnico
        const porTecnico = {};
        registros.forEach(r => {
            if (!porTecnico[r.tecnico]) porTecnico[r.tecnico] = [];
            porTecnico[r.tecnico].push(r);
        });
        
        Object.entries(porTecnico).forEach(([tecnico, regs]) => {
            const actividades = {};
            regs.forEach(r => {
                if (!actividades[r.actividad]) actividades[r.actividad] = [];
                actividades[r.actividad].push(r);
            });
            
            let htmlActividades = '';
            Object.entries(actividades).forEach(([act, eventos]) => {
                const ultimo = eventos[0];
                const icono = this.getIconoEvento(ultimo.evento);
                const color = this.getColorEvento(ultimo.evento);
                
                htmlActividades += `
                    <div class="flex items-center gap-2 py-1 border-b border-gray-100 last:border-0">
                        <i class="fa-solid ${icono} ${color}"></i>
                        <span class="text-sm font-medium flex-grow">${act}</span>
                        <span class="text-xs text-gray-400">${Helpers.formatearFecha(ultimo.fecha_hora)}</span>
                    </div>
                `;
            });
            
            container.innerHTML += `
                <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-3">
                    <h4 class="font-bold text-gray-800 mb-2 border-b pb-2">${tecnico}</h4>
                    <div class="space-y-1">
                        ${htmlActividades}
                    </div>
                </div>
            `;
        });
    },
    
    // Icono según evento
    getIconoEvento: function(evento) {
        const iconos = {
            'Inicio': 'fa-play',
            'Fin': 'fa-flag-checkered',
            'Interrupción': 'fa-pause',
            'Reinicio': 'fa-rotate-right',
            'Asignacion': 'fa-clipboard-list',
            'Leido': 'fa-check'
        };
        return iconos[evento] || 'fa-circle';
    },
    
    // Color según evento
    getColorEvento: function(evento) {
        const colores = {
            'Inicio': 'text-green-500',
            'Fin': 'text-blue-500',
            'Interrupción': 'text-yellow-500',
            'Reinicio': 'text-green-500',
            'Asignacion': 'text-purple-500',
            'Leido': 'text-gray-400'
        };
        return colores[evento] || 'text-gray-400';
    },
    
    // Mostrar modal de asignación
    mostrarModalAsignar: function() {
        const modal = document.getElementById('modal-asignar-admin');
        if (modal) {
            modal.classList.remove('hidden-view');
            SoundFx.click();
        }
    },
    
    // Ocultar modal de asignación
    ocultarModalAsignar: function() {
        const modal = document.getElementById('modal-asignar-admin');
        if (modal) {
            modal.classList.add('hidden-view');
            SoundFx.click();
        }
    },
    
    // Asignar misión (admin)
    asignarMision: async function() {
        const destinoInput = document.getElementById('admin-destino');
        const tituloInput = document.getElementById('admin-titulo');
        const detalleInput = document.getElementById('admin-detalle');
        
        const destino = destinoInput?.value;
        const titulo = tituloInput?.value.trim().toUpperCase();
        const detalle = detalleInput?.value.trim();
        
        if (!titulo) {
            UI.toast('Ingresa un título', 'warning');
            return;
        }
        
        UI.setLoading('btn-asignar-admin', true);
        
        try {
            await Database.insertarRegistro({
                tecnico: destino,
                actividad: titulo,
                tipo_actividad: CONFIG.TIPOS_ACTIVIDAD.TAREA_ADMIN,
                evento: 'Asignacion',
                motivo: detalle,
                total_lote: 1
            });
            
            SoundFx.start();
            UI.toast('Tarea asignada', 'success');
            
            // Limpiar y cerrar
            tituloInput.value = '';
            detalleInput.value = '';
            this.ocultarModalAsignar();
            
            // Recargar datos
            await this.cargarDatos();
        } catch (e) {
            UI.toast('Error al asignar', 'error');
        } finally {
            UI.setLoading('btn-asignar-admin', false, 'Asignar');
        }
    },
    
    // Botón de emergencia rojo
    activarEmergencia: async function() {
        // Confirmación rápida
        const confirmed = confirm('⚠️ ACTIVAR EMERGENCIA - AUDIO Y ALERTA SONORA\n\n¿Confirmas?');
        if (!confirmed) return;
        
        try {
            // Registrar emergencia en base de datos
            await Database.insertarRegistro({
                tecnico: 'SISTEMA',
                actividad: 'EMERGENCIA ACTIVADA',
                tipo_actividad: 'EMERGENCIA',
                evento: 'Emergencia',
                motivo: 'Botón de emergencia presionado por admin',
                total_lote: 0
            });
            
            // Sonido de alerta largo (8-bit)
            SoundFx.alert();
            
            // Vibración prolongada
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }
            
            // Mostrar alerta visual
            this.mostrarEmergencia();
            
            UI.toast('⚠️ EMERGENCIA REGISTRADA', 'error');
        } catch (e) {
            console.error('Error activando emergencia:', e);
            UI.toast('Error registrando emergencia', 'error');
        }
    },
    
    // Mostrar modal de emergencia
    mostrarEmergencia: function() {
        const html = `
            <div class="fixed inset-0 bg-red-900/80 z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border-8 border-red-600 animate-pulse">
                    <div class="text-center">
                        <i class="fa-solid fa-triangle-exclamation text-6xl text-red-600 mb-4 animate-bounce"></i>
                        <h2 class="text-4xl font-black text-red-600 mb-2 uppercase tracking-widest">EMERGENCIA</h2>
                        <p class="text-lg text-gray-700 font-bold mb-6">Sistema en modo alerta</p>
                        <button onclick="AdminView.ocultarEmergencia()" class="bg-red-600 hover:bg-red-700 text-white font-black py-4 px-8 rounded-xl text-lg uppercase tracking-widest border-b-4 border-red-800 active:border-b-0">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const container = document.createElement('div');
        container.id = 'modal-emergencia';
        container.innerHTML = html;
        document.body.appendChild(container);
    },
    
    // Ocultar modal de emergencia
    ocultarEmergencia: function() {
        const modal = document.getElementById('modal-emergencia');
        if (modal) modal.remove();
    }
};

// Exponer globalmente
window.AdminView = AdminView;

// Inicializar si estamos en la página de admin
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('view-admin')) {
        AdminView.init();
    }
});
