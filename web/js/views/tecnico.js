// ==========================================
// PETULAP - Vista de Técnico
// ==========================================

const TecnicoView = {
    state: {
        actividad: '',
        tipo_actividad: CONFIG.TIPOS_ACTIVIDAD.PRODUCCION,
        status: 'libre',
        startTime: null,
        motivo: null,
        total_lote: 0,
        motivo_inicio: ''
    },
    
    pollingInterval: null,
    misionPendiente: null,
    
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
        
        // Configurar eventos específicos
        this.bindEvents();
        
        // Cargar datos iniciales
        await this.cargarDatos();
        
        // Iniciar polling
        this.iniciarPolling();
    },
    
    bindEvents: function() {
        // Inputs con sonido de teclado
        document.querySelectorAll('input, textarea').forEach(el => {
            el.addEventListener('keydown', () => {
                SoundFx.init();
                SoundFx.type();
            });
        });
        
        // Input OK/Fallo conectados
        const okInput = document.getElementById('tec-ok');
        if (okInput) {
            okInput.addEventListener('input', () => {
                const okVal = parseInt(okInput.value) || 0;
                const total = this.state.total_lote || 0;
                const falloInput = document.getElementById('tec-fallo');
                if (falloInput) falloInput.value = Math.max(0, total - okVal);
            });
        }
    },
    
    // Cargar datos del técnico
    cargarDatos: async function() {
        try {
            const f48h = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
            const globalData = await Database.obtenerRegistrosDesde(f48h);
            
            const myHistory = globalData.filter(r => 
                r.tecnico === AppState.currentUser.username
            );
            
            // Auto-cierre preventivo
            await this.verificarAutoCierre(myHistory);
            
            // Renderizar historial
            const hoy = Helpers.obtenerFechaLocalISO();
            const regHoy = myHistory.filter(r => {
                const fechaReg = new Date(new Date(r.fecha_hora).getTime() - 
                    new Date().getTimezoneOffset() * 60000)
                    .toISOString().split('T')[0];
                return fechaReg === hoy;
            });
            
            UI.renderHistorial(regHoy, 'tec-lista-historial');
            
            // Aplicar estado actual
            const trueLast = myHistory.find(r => 
                r.evento !== 'Asignacion' && r.evento !== 'Leido'
            );
            
            if (trueLast) {
                this.aplicarEstado(trueLast, myHistory);
            } else {
                this.aplicarEstado({ evento: 'Fin' }, myHistory);
            }
            
            // Procesar asignaciones
            this.procesarAsignaciones(globalData);
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            UI.setTecnicoState('libre');
        }
    },
    
    // Verificar y ejecutar auto-cierre
    verificarAutoCierre: async function(history) {
        if (history.length === 0) return;
        
        const ultimo = history[0];
        const eventosActivos = ['Inicio', 'Reinicio', 'Interrupción'];
        
        if (!eventosActivos.includes(ultimo.evento)) return;
        
        const tzOffset = new Date().getTimezoneOffset() * 60000;
        const fUltimo = new Date(new Date(ultimo.fecha_hora).getTime() - tzOffset)
            .toISOString().split('T')[0];
        
        if (fUltimo !== Helpers.obtenerFechaLocalISO()) {
            UI.toast('⚠️ Auto-cierre preventivo ejecutado.', 'warning');
            await Database.insertarRegistro({
                tecnico: AppState.currentUser.username,
                actividad: ultimo.actividad,
                tipo_actividad: ultimo.tipo_actividad,
                evento: 'Fin',
                motivo: 'Auto-Cierre Medianoche',
                total_lote: 0,
                ok: 0,
                fallo: 0
            });
            return this.cargarDatos();
        }
    },
    
    // Aplicar estado desde registro
    aplicarEstado: function(ultimo, history) {
        const eventosActivos = ['Inicio', 'Reinicio'];
        
        if (eventosActivos.includes(ultimo.evento)) {
            const initRec = history.find(r => 
                r.actividad === ultimo.actividad && r.evento === 'Inicio'
            );
            
            this.state = {
                actividad: ultimo.actividad,
                tipo_actividad: ultimo.tipo_actividad,
                status: 'trabajando',
                startTime: new Date(ultimo.fecha_hora).getTime(),
                total_lote: initRec ? initRec.total_lote : 0,
                motivo_inicio: initRec ? initRec.motivo : ''
            };
        } else if (ultimo.evento === 'Interrupción') {
            const initRec = history.find(r => 
                r.actividad === ultimo.actividad && r.evento === 'Inicio'
            );
            
            this.state = {
                actividad: ultimo.actividad,
                tipo_actividad: ultimo.tipo_actividad,
                status: 'pausado',
                startTime: new Date(ultimo.fecha_hora).getTime(),
                motivo: ultimo.motivo,
                total_lote: initRec ? initRec.total_lote : 0,
                motivo_inicio: initRec ? initRec.motivo : ''
            };
        } else {
            this.state = {
                actividad: '',
                tipo_actividad: CONFIG.TIPOS_ACTIVIDAD.PRODUCCION,
                status: 'libre',
                startTime: null,
                motivo: null,
                total_lote: 0,
                motivo_inicio: ''
            };
        }
        
        this.actualizarUI();
    },
    
    // Actualizar UI según estado
    actualizarUI: function() {
        UI.setTecnicoState(this.state.status);
        Timer.stop();
        
        const banner = document.getElementById('tec-banner-activo');
        const lblActividad = document.getElementById('tec-banner-actividad');
        const lblEstado = document.getElementById('tec-banner-estado');
        
        if (this.state.status === 'libre') {
            document.getElementById('state-inicio')?.classList.remove('hidden-view');
            const actInput = document.getElementById('tec-actividad');
            const totalInput = document.getElementById('tec-total-lote');
            if (actInput) actInput.value = '';
            if (totalInput) totalInput.value = '';
        } else if (this.state.status === 'trabajando') {
            if (banner) {
                banner.classList.remove('hidden-view');
                banner.className = "bg-blue-600 text-white rounded-3xl shadow-xl p-6 mb-6 text-center border-b-8 border-blue-800";
            }
            if (lblEstado) lblEstado.innerText = "ACTIVIDAD ACTUAL";
            if (lblActividad) lblActividad.innerText = this.state.actividad;
            
            // Vista aislada para logística
            const esLogistica = [
                CONFIG.TIPOS_ACTIVIDAD.PEDIDO_VENTAS,
                CONFIG.TIPOS_ACTIVIDAD.TAREA_ADMIN,
                CONFIG.TIPOS_ACTIVIDAD.EMERGENCIA
            ].includes(this.state.tipo_actividad);
            
            if (esLogistica) {
                document.getElementById('state-pedido-proceso')?.classList.remove('hidden-view');
                this.renderChecklist();
            } else {
                document.getElementById('state-proceso')?.classList.remove('hidden-view');
            }
            
            Timer.start(this.state.startTime, (min) => {
                UI.updateBanner(this.state.actividad, `${min} min`);
            });
        } else if (this.state.status === 'pausado') {
            if (banner) {
                banner.classList.remove('hidden-view');
                banner.className = "bg-amber-500 text-white rounded-3xl shadow-xl p-6 mb-6 text-center border-b-8 border-amber-700";
            }
            if (lblEstado) lblEstado.innerText = `PAUSA POR: ${this.state.motivo || 'NO ESPECIFICADO'}`;
            if (lblActividad) lblActividad.innerText = this.state.actividad;
            document.getElementById('state-pausado')?.classList.remove('hidden-view');
            
            Timer.start(this.state.startTime, (min) => {
                UI.updateBanner(this.state.actividad, `${min} min`);
            });
        }
    },
    
    // Renderizar checklist para pedidos
    renderChecklist: function() {
        let itemsStr = this.state.motivo_inicio || '';
        let items = Helpers.parsearLista(itemsStr);
        
        UI.renderChecklist(items);
        
        const okTotal = document.getElementById('pedido-ok-total');
        if (okTotal) okTotal.value = this.state.total_lote;
        
        UI.evaluarChecklist();
    },
    
    // Procesar asignaciones de Admin/Ventas
    procesarAsignaciones: function(globalData) {
        const listaAdmin = document.getElementById('tec-lista-admin-tasks');
        const badgeAdmin = document.getElementById('badge-admin-tasks');
        const pendList = document.getElementById('tec-lista-pendientes');
        const msgContainer = document.getElementById('tec-mensajes-container');
        
        if (!listaAdmin || !badgeAdmin || !pendList || !msgContainer) return;
        
        listaAdmin.innerHTML = '';
        pendList.innerHTML = '';
        msgContainer.innerHTML = '';
        
        let contAdmin = 0;
        let hayPendientesVentas = false;
        
        const asignaciones = globalData.filter(r => 
            r.evento === 'Asignacion' && 
            (r.tecnico === 'TODOS' || r.tecnico === AppState.currentUser.username)
        );
        
        // Agrupar por actividad
        const agrupado = {};
        asignaciones.forEach(r => {
            if (!agrupado[r.actividad]) agrupado[r.actividad] = r;
        });
        
        for (const [actividad, origin] of Object.entries(agrupado)) {
            const tipo = origin.tipo_actividad;
            
            // Mensajes
            if (tipo === CONFIG.TIPOS_ACTIVIDAD.MENSAJE) {
                const yaLei = globalData.some(r => 
                    r.actividad === actividad && 
                    r.evento === 'Leido' && 
                    r.tecnico === AppState.currentUser.username
                );
                
                if (!yaLei) {
                    this.renderMensaje(actividad, origin, msgContainer);
                }
                continue;
            }
            
            // Verificar si alguien ya tomó la tarea
            const alguienTomo = globalData.some(r => 
                r.actividad === actividad && r.evento === 'Inicio'
            );
            
            if (alguienTomo) continue;
            
            // Tarea disponible
            if (tipo === CONFIG.TIPOS_ACTIVIDAD.TAREA_ADMIN) {
                contAdmin++;
                this.renderTareaAdmin(actividad, origin, listaAdmin);
            } else if (tipo === CONFIG.TIPOS_ACTIVIDAD.PEDIDO_VENTAS || 
                       tipo === CONFIG.TIPOS_ACTIVIDAD.EMERGENCIA) {
                hayPendientesVentas = true;
                this.renderPedidoPendiente(actividad, tipo, origin, pendList);
            }
        }
        
        badgeAdmin.innerText = contAdmin;
        if (contAdmin === 0) {
            listaAdmin.innerHTML = '<p class="text-xs font-bold text-slate-400 italic">No hay actividades generales.</p>';
        }
        
        const divPendVentas = document.getElementById('tec-pendientes-ventas');
        if (divPendVentas) {
            if (hayPendientesVentas && this.state.status === 'libre') {
                divPendVentas.classList.remove('hidden-view');
            } else {
                divPendVentas.classList.add('hidden-view');
            }
        }
    },
    
    renderMensaje: function(actividad, origin, container) {
        container.innerHTML += `
            <div class="bg-emerald-100 border-b-4 border-emerald-500 rounded-2xl p-4 shadow-lg flex justify-between items-center gap-4 fade-in">
                <div class="flex items-center gap-3">
                    <div class="bg-emerald-500 text-white p-3 rounded-full shadow-inner">
                        <i class="fa-solid fa-bullhorn fa-shake"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Aviso General</p>
                        <p class="font-black text-emerald-900 text-sm uppercase">${actividad}</p>
                        <p class="text-xs font-bold text-emerald-700 mt-1 italic">"${origin.motivo}"</p>
                    </div>
                </div>
                <button onclick="TecnicoView.marcarLeido('${actividad}'); SoundFx.finish();" 
                    class="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl transition shadow border-b-2 border-emerald-800 active:border-b-0 active:translate-y-1 uppercase text-xs tracking-widest whitespace-nowrap">
                    Leído <i class="fa-solid fa-check"></i>
                </button>
            </div>
        `;
    },
    
    renderTareaAdmin: function(actividad, origin, container) {
        container.innerHTML += `
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                <div>
                    <span class="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase border border-blue-200">
                        <i class="fa-solid fa-clipboard-list mr-1"></i> General
                    </span>
                    <p class="font-black text-slate-800 text-sm mt-1 uppercase">${actividad}</p>
                    ${origin.motivo ? `<p class="text-[10px] text-slate-500 font-bold mt-1 line-clamp-1 italic">${origin.motivo}</p>` : ''}
                </div>
                <button onclick="TecnicoView.tomarMision('${actividad}', '${CONFIG.TIPOS_ACTIVIDAD.TAREA_ADMIN}', '${origin.motivo}', ${origin.total_lote || 1}); SoundFx.start();" 
                    class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2 rounded-lg shadow-md border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition whitespace-nowrap uppercase">
                    Tomar <i class="fa-solid fa-arrow-right ml-1"></i>
                </button>
            </div>
        `;
    },
    
    renderPedidoPendiente: function(actividad, tipo, origin, container) {
        const bgClass = tipo === CONFIG.TIPOS_ACTIVIDAD.EMERGENCIA ? 
            'bg-red-500 border-red-700' : 'bg-indigo-500 border-indigo-700';
        const badgeClass = tipo === CONFIG.TIPOS_ACTIVIDAD.EMERGENCIA ? 
            'bg-red-200 text-red-900 border-red-300' : 'bg-indigo-100 text-indigo-800 border-indigo-300';
        const titleStr = tipo === CONFIG.TIPOS_ACTIVIDAD.EMERGENCIA ? 'EMERGENCIA' : 'PEDIDO';
        
        container.innerHTML += `
            <div class="bg-white p-4 rounded-xl border-2 border-indigo-100 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm fade-in">
                <div class="w-full">
                    <span class="text-[10px] font-black ${badgeClass} px-2 py-0.5 rounded uppercase border">
                        <i class="fa-solid fa-truck-fast mr-1"></i> ${titleStr}
                    </span>
                    <p class="font-black text-gray-800 text-sm mt-1 uppercase">${actividad}</p>
                    ${tipo === CONFIG.TIPOS_ACTIVIDAD.PEDIDO_VENTAS ? 
                        `<p class="text-xs text-gray-500 font-bold mt-1 line-clamp-1">
                            <i class="fa-solid fa-list-check"></i> Contiene lista de empaque
                        </p>` : ''}
                </div>
                <button onclick="TecnicoView.tomarMision('${actividad}', '${tipo}', '${origin.motivo}', ${origin.total_lote || 1}); SoundFx.start();" 
                    class="${bgClass} w-full sm:w-auto hover:brightness-110 text-white text-xs font-black px-6 py-3 rounded-xl shadow-md border-b-4 active:border-b-0 active:translate-y-1 transition whitespace-nowrap uppercase text-outline">
                    Aceptar <i class="fa-solid fa-play ml-1"></i>
                </button>
            </div>
        `;
    },
    
    // Acciones
    registrarEvento: async function(evento) {
        const handlers = {
            'Inicio': () => this.iniciarActividad(),
            'Interrupción': () => this.pausarActividad(),
            'Reinicio': () => this.reanudarActividad(),
            'Fin': () => this.finalizarActividad()
        };
        
        if (handlers[evento]) await handlers[evento]();
    },
    
    iniciarActividad: async function() {
        const actInput = document.getElementById('tec-actividad');
        const tipoInput = document.getElementById('tec-tipo-equipo');
        const totalInput = document.getElementById('tec-total-lote');
        
        const actividad = actInput?.value.trim().toUpperCase();
        const tipoEquipo = tipoInput?.value;
        const total = parseInt(totalInput?.value) || 0;
        
        if (!actividad || total <= 0) {
            UI.toast('Ingresa actividad y cantidad.', 'warning');
            return;
        }
        
        Helpers.guardarStorage(CONFIG.STORAGE.TIPO_EQUIPO, tipoEquipo);
        
        UI.setLoading('btn-iniciar', true);
        
        try {
            await Database.insertarRegistro({
                tecnico: AppState.currentUser.username,
                actividad: actividad,
                tipo_actividad: CONFIG.TIPOS_ACTIVIDAD.PRODUCCION,
                evento: 'Inicio',
                motivo: tipoEquipo,
                total_lote: total
            });
            
            UI.toast('Actividad iniciada', 'success');
            await this.cargarDatos();
        } catch (e) {
            UI.toast('Error de red', 'error');
        } finally {
            UI.setLoading('btn-iniciar', false, '<i class="fa-solid fa-play"></i> INICIAR JORNADA');
        }
    },
    
    pausarActividad: async function() {
        const motivoInput = document.getElementById('tec-motivo');
        const motivo = motivoInput?.value.trim();
        
        if (!motivo) {
            UI.toast('Escribe el motivo.', 'warning');
            return;
        }
        
        UI.setLoading('btn-pausa', true);
        
        try {
            await Database.insertarRegistro({
                tecnico: AppState.currentUser.username,
                actividad: this.state.actividad,
                tipo_actividad: this.state.tipo_actividad,
                evento: 'Interrupción',
                motivo: motivo
            });
            
            SoundFx.pause();
            UI.toast('Actividad pausada', 'info');
            await this.cargarDatos();
        } catch (e) {
            UI.toast('Error de red', 'error');
        } finally {
            UI.setLoading('btn-pausa', false, '<i class="fa-solid fa-pause"></i> PAUSAR ACTIVIDAD');
        }
    },
    
    reanudarActividad: async function() {
        UI.setLoading('btn-reiniciar', true);
        
        try {
            await Database.insertarRegistro({
                tecnico: AppState.currentUser.username,
                actividad: this.state.actividad,
                tipo_actividad: this.state.tipo_actividad,
                evento: 'Reinicio'
            });
            
            SoundFx.start();
            UI.toast('Actividad reanudada', 'success');
            await this.cargarDatos();
        } catch (e) {
            UI.toast('Error de red', 'error');
        } finally {
            UI.setLoading('btn-reiniciar', false, '<i class="fa-solid fa-play"></i> REANUDAR TRABAJO');
        }
    },
    
    finalizarActividad: async function() {
        const okInput = document.getElementById('tec-ok');
        const falloInput = document.getElementById('tec-fallo');
        
        const ok = parseInt(okInput?.value) || 0;
        const fallo = parseInt(falloInput?.value) || 0;
        
        if (ok === 0 && fallo === 0) {
            UI.toast('Ingresa OK o Fallos.', 'warning');
            return;
        }
        
        UI.setLoading('btn-fin', true);
        
        try {
            await Database.insertarRegistro({
                tecnico: AppState.currentUser.username,
                actividad: this.state.actividad,
                tipo_actividad: this.state.tipo_actividad,
                evento: 'Fin',
                total_lote: this.state.total_lote,
                ok: ok,
                fallo: fallo
            });
            
            SoundFx.finish();
            UI.toast('Tarea finalizada', 'success');
            
            okInput.value = '';
            falloInput.value = '';
            await this.cargarDatos();
        } catch (e) {
            UI.toast('Error de red', 'error');
        } finally {
            UI.setLoading('btn-fin', false, '<i class="fa-solid fa-flag-checkered"></i> FINALIZAR TAREA');
        }
    },
    
    finalizarPedido: async function() {
        const checks = document.querySelectorAll('.checklist-item input[type="checkbox"]');
        const faltan = Array.from(checks).some(c => !c.checked);
        const obsInput = document.getElementById('pedido-observaciones');
        const okTotalInput = document.getElementById('pedido-ok-total');
        
        const obs = obsInput?.value.trim();
        const totalEnviado = parseInt(okTotalInput?.value) || 0;
        
        if (faltan && !obs) {
            SoundFx.error();
            UI.toast('Faltan ítems. Escribe el motivo en Observaciones.', 'error');
            return;
        }
        
        SoundFx.finish();
        UI.setLoading('btn-completar-pedido', true);
        
        try {
            await Database.insertarRegistro({
                tecnico: AppState.currentUser.username,
                actividad: this.state.actividad,
                tipo_actividad: this.state.tipo_actividad,
                evento: 'Fin',
                motivo: faltan ? `[INCOMPLETO] ${obs}` : 'Misión Completada',
                total_lote: this.state.total_lote,
                ok: totalEnviado,
                fallo: 0
            });
            
            UI.toast('Misión Completada', 'success');
            await this.cargarDatos();
        } catch (e) {
            UI.toast('Error de red', 'error');
        } finally {
            UI.setLoading('btn-completar-pedido', false, '<i class="fa-solid fa-paper-plane"></i> COMPLETAR MISIÓN');
        }
    },
    
    tomarMision: async function(actividad, tipo, motivo, cantidad) {
        SoundFx.start();
        
        try {
            if (this.state.status === 'trabajando') {
                await Database.insertarRegistro({
                    tecnico: AppState.currentUser.username,
                    actividad: this.state.actividad,
                    tipo_actividad: this.state.tipo_actividad,
                    evento: 'Interrupción',
                    motivo: `Pausado por: ${actividad}`
                });
            }
            
            await Database.insertarRegistro({
                tecnico: AppState.currentUser.username,
                actividad: actividad,
                tipo_actividad: tipo,
                evento: 'Inicio',
                motivo: motivo,
                total_lote: cantidad
            });
            
            UI.toast('Misión Aceptada. Empieza ahora.', 'success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            await this.cargarDatos();
        } catch (e) {
            UI.toast('Error de red', 'error');
        }
    },
    
    marcarLeido: async function(actividad) {
        try {
            await Database.insertarRegistro({
                tecnico: AppState.currentUser.username,
                actividad: actividad,
                tipo_actividad: CONFIG.TIPOS_ACTIVIDAD.MENSAJE,
                evento: 'Leido'
            });
            await this.cargarDatos();
        } catch (e) {
            UI.toast('Error al marcar leído', 'error');
        }
    },
    
    cambiarSubEstado: function(vista) {
        SoundFx.click();
        document.getElementById('state-proceso')?.classList.add('hidden-view');
        document.getElementById('state-finalizacion')?.classList.add('hidden-view');
        document.getElementById(`state-${vista}`)?.classList.remove('hidden-view');
    },
    
    // Polling
    iniciarPolling: function() {
        this.verificarAsignacionesNuevas();
        this.pollingInterval = setInterval(() => {
            this.verificarAsignacionesNuevas();
        }, CONFIG.POLLING_INTERVAL);
    },
    
    detenerPolling: function() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    },
    
    verificarAsignacionesNuevas: async function() {
        if (!AppState.currentUser || AppState.currentUser.rol !== CONFIG.ROLES.TECNICO) return;
        
        const asignaciones = await Database.obtenerAsignaciones(
            AppState.currentUser.username, 
            50
        );
        
        if (!asignaciones || asignaciones.length === 0) return;
        
        for (const r of asignaciones) {
            if (r.tipo_actividad !== CONFIG.TIPOS_ACTIVIDAD.EMERGENCIA && 
                r.tipo_actividad !== CONFIG.TIPOS_ACTIVIDAD.PEDIDO_VENTAS) continue;
            
            const seen = Helpers.leerStorage(CONFIG.STORAGE.POPUP_PREFIX + r.id);
            const tomoData = await Database.actividadTomada(r.actividad);
            
            if (!seen && !tomoData) {
                this.mostrarAlertaPopup(r);
                Helpers.guardarStorage(CONFIG.STORAGE.POPUP_PREFIX + r.id, true);
                break;
            }
        }
        
        this.cargarDatos();
    },
    
    mostrarAlertaPopup: function(asignacion) {
        if (!document.getElementById('modal-emergencia')?.classList.contains('hidden-view') ||
            !document.getElementById('modal-pedido-ventas')?.classList.contains('hidden-view')) {
            return;
        }
        
        SoundFx.init();
        this.misionPendiente = asignacion;
        
        if (asignacion.tipo_actividad === CONFIG.TIPOS_ACTIVIDAD.EMERGENCIA) {
            UI.showEmergencia(asignacion.actividad);
        } else if (asignacion.tipo_actividad === CONFIG.TIPOS_ACTIVIDAD.PEDIDO_VENTAS) {
            UI.showPedido(asignacion.actividad);
        }
    },
    
    aceptarMisionPopup: async function(hacerAhora) {
        UI.hideEmergencia();
        UI.hidePedido();
        
        if (!this.misionPendiente) return;
        
        const obj = this.misionPendiente;
        this.misionPendiente = null;
        
        if (hacerAhora) {
            await this.tomarMision(obj.actividad, obj.tipo_actividad, obj.motivo, obj.total_lote);
        } else {
            SoundFx.pause();
            UI.toast('Enviado a Tareas Pendientes', 'info');
            await this.cargarDatos();
        }
    },
    
    cerrarPopupPedido: function() {
        SoundFx.click();
        UI.hidePedido();
        UI.toast('Añadido a Tareas Pendientes', 'info');
        this.cargarDatos();
    }
};

// Exponer globalmente
window.TecnicoView = TecnicoView;

// Inicializar si estamos en la página de técnico
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('view-tecnico')) {
        TecnicoView.init();
    }
});
