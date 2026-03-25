// ==========================================
// PETULAP - Vista de Ventas
// ==========================================

const VentasView = {
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
        
        // Cargar datos iniciales
        await this.cargarDatos();
        
        // Iniciar polling
        this.iniciarPolling();
    },
    
    // Cargar datos de ventas
    cargarDatos: async function() {
        try {
            const f48h = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
            const registros = await Database.obtenerRegistrosDesde(f48h);
            
            this.renderRadarLogistico(registros);
            this.renderEstadoPlanta(registros);
        } catch (error) {
            console.error('Error cargando datos de ventas:', error);
            UI.toast('Error cargando datos', 'error');
        }
    },
    
    // Renderizar radar logístico
    renderRadarLogistico: function(registros) {
        const container = document.getElementById('ventas-radar-lista');
        if (!container) return;
        
        const pedidos = registros.filter(r => 
            r.tipo_actividad === CONFIG.TIPOS_ACTIVIDAD.PEDIDO_VENTAS ||
            r.tipo_actividad === CONFIG.TIPOS_ACTIVIDAD.EMERGENCIA
        );
        
        if (pedidos.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i class="fa-solid fa-satellite-dish text-4xl mb-3"></i>
                    <p class="font-bold uppercase text-sm">Sin actividad reciente</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        // Agrupar por actividad
        const agrupado = {};
        pedidos.forEach(r => {
            if (!agrupado[r.actividad]) {
                agrupado[r.actividad] = {
                    actividad: r.actividad,
                    tipo: r.tipo_actividad,
                    registros: []
                };
            }
            agrupado[r.actividad].registros.push(r);
        });
        
        // Ordenar por fecha más reciente
        const actividades = Object.values(agrupado).sort((a, b) => {
            const fechaA = new Date(a.registros[0].fecha_hora);
            const fechaB = new Date(b.registros[0].fecha_hora);
            return fechaB - fechaA;
        });
        
        actividades.forEach(item => {
            const ultimo = item.registros[0];
            const estado = this.calcularEstadoPedido(item.registros);
            
            const bgColor = item.tipo === CONFIG.TIPOS_ACTIVIDAD.EMERGENCIA 
                ? 'border-red-500 bg-red-50' 
                : 'border-blue-500 bg-blue-50';
            
            const icono = item.tipo === CONFIG.TIPOS_ACTIVIDAD.EMERGENCIA 
                ? 'fa-triangle-exclamation text-red-500' 
                : 'fa-truck-fast text-blue-500';
            
            const badge = estado === 'Completado' 
                ? 'bg-green-100 text-green-800' 
                : estado === 'En Proceso' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800';
            
            container.innerHTML += `
                <div class="bg-white rounded-xl p-4 border-l-4 ${bgColor} shadow-sm mb-3 fade-in">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <i class="fa-solid ${icono} text-xl"></i>
                            <div>
                                <p class="font-black text-gray-800 uppercase text-sm">${item.actividad}</p>
                                <p class="text-xs text-gray-500">${Helpers.formatearFecha(ultimo.fecha_hora)}</p>
                            </div>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-bold ${badge}">${estado}</span>
                    </div>
                    ${ultimo.motivo ? `<p class="text-sm text-gray-600 mt-2 italic">"${ultimo.motivo}"</p>` : ''}
                </div>
            `;
        });
    },
    
    // Calcular estado de un pedido
    calcularEstadoPedido: function(registros) {
        const tieneInicio = registros.some(r => r.evento === 'Inicio');
        const tieneFin = registros.some(r => r.evento === 'Fin');
        
        if (tieneFin) return 'Completado';
        if (tieneInicio) return 'En Proceso';
        return 'Pendiente';
    },
    
    // Renderizar estado de planta (técnicos)
    renderEstadoPlanta: function(registros) {
        const container = document.getElementById('ventas-grid-tecnicos');
        if (!container) return;
        
        const hoy = Helpers.obtenerFechaLocalISO();
        
        // Calcular estado por técnico
        const estadoTecnicos = {};
        
        AppState.tecnicos.forEach(t => {
            const regTecnico = registros.filter(r => 
                r.tecnico === t.username &&
                new Date(new Date(r.fecha_hora).getTime() - new Date().getTimezoneOffset() * 60000)
                    .toISOString().split('T')[0] === hoy
            );
            
            const ultimo = regTecnico[0];
            let estado = 'Libre';
            let color = 'bg-green-500';
            let actividad = '';
            
            if (ultimo) {
                if (ultimo.evento === 'Inicio' || ultimo.evento === 'Reinicio') {
                    estado = 'Trabajando';
                    color = 'bg-blue-500';
                    actividad = ultimo.actividad;
                } else if (ultimo.evento === 'Interrupción') {
                    estado = 'Pausado';
                    color = 'bg-yellow-500';
                    actividad = ultimo.actividad;
                } else if (ultimo.evento === 'Fin') {
                    estado = 'Libre';
                }
            }
            
            estadoTecnicos[t.username] = { estado, color, actividad };
        });
        
        container.innerHTML = '';
        Object.entries(estadoTecnicos).forEach(([nombre, info]) => {
            container.innerHTML += `
                <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center fade-in">
                    <div class="w-4 h-4 rounded-full ${info.color} mx-auto mb-2"></div>
                    <p class="font-bold text-gray-800 text-sm">${nombre}</p>
                    <p class="text-xs text-gray-500 uppercase">${info.estado}</p>
                    ${info.actividad ? `<p class="text-[10px] text-gray-400 mt-1 truncate">${info.actividad}</p>` : ''}
                </div>
            `;
        });
    },
    
    // Cambiar tipo de asignación
    cambiarTipo: function() {
        const select = document.getElementById('ventas-tipo');
        const tipo = select?.value;
        const txtDetalle = document.getElementById('ventas-detalle');
        const lblTitulo = document.getElementById('lbl-ventas-titulo');
        
        if (!tipo || !txtDetalle || !lblTitulo) return;
        
        if (tipo === 'MENSAJE') {
            lblTitulo.innerText = 'TÍTULO DEL MENSAJE:';
            txtDetalle.placeholder = 'Ej: La reunión general será a las 7:00 PM...';
        } else if (tipo === 'PEDIDO_VENTAS') {
            lblTitulo.innerText = 'TÍTULO DE LA MISIÓN:';
            txtDetalle.placeholder = 'Ej:\n3 laptops L490\n2 monitores 24\n15 mouse';
        } else {
            lblTitulo.innerText = 'EMERGENCIA CRÍTICA:';
            txtDetalle.placeholder = 'Instrucciones de la emergencia...';
        }
    },
    
    // Asignar misión
    asignarMision: async function() {
        const tipoInput = document.getElementById('ventas-tipo');
        const destinoInput = document.getElementById('ventas-destino');
        const tituloInput = document.getElementById('ventas-titulo');
        const detalleInput = document.getElementById('ventas-detalle');
        
        const tipo = tipoInput?.value;
        const destino = destinoInput?.value;
        const titulo = tituloInput?.value.trim().toUpperCase();
        const detalle = detalleInput?.value.trim();
        
        if (!titulo) {
            UI.toast('Ingresa un título', 'warning');
            return;
        }
        
        UI.setLoading('btn-despachar', true);
        
        try {
            await Database.insertarRegistro({
                tecnico: destino,
                actividad: titulo,
                tipo_actividad: tipo,
                evento: 'Asignacion',
                motivo: detalle,
                total_lote: detalle ? detalle.split(/\n|\|/).filter(l => l.trim()).length : 1
            });
            
            SoundFx.start();
            UI.toast('Misión despachada', 'success');
            
            // Limpiar formulario
            tituloInput.value = '';
            detalleInput.value = '';
            
            // Recargar datos
            await this.cargarDatos();
        } catch (e) {
            UI.toast('Error al despachar', 'error');
        } finally {
            UI.setLoading('btn-despachar', false, `
                <i class="fa-solid fa-paper-plane"></i> Despachar
            `);
        }
    },
    
    // Polling
    iniciarPolling: function() {
        this.cargarDatos();
        this.pollingInterval = setInterval(() => {
            this.cargarDatos();
        }, CONFIG.POLLING_INTERVAL);
    },
    
    detenerPolling: function() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
};

// Exponer globalmente
window.VentasView = VentasView;

// Inicializar si estamos en la página de ventas
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('view-ventas')) {
        VentasView.init();
    }
});
