// ==========================================
// PETULAP - Vista de Ventas
// ==========================================

const VentasView = {
    pollingInterval: null,
    
    init: function() {
        UI.showView('view-ventas');
        this.bindEvents();
        this.cargarDatos();
        this.iniciarPolling();
    },
    
    bindEvents: function() {
        const tipoSelect = document.getElementById('ventas-tipo');
        if (tipoSelect) {
            tipoSelect.addEventListener('change', () => this.cambioTipo());
        }
    },
    
    cambioTipo: function() {
        const tipo = document.getElementById('ventas-tipo')?.value;
        const txtDetalle = document.getElementById('ventas-detalle');
        const lblTitulo = document.getElementById('lbl-ventas-titulo');
        
        if (!lblTitulo || !txtDetalle) return;
        
        if (tipo === 'MENSAJE') {
            lblTitulo.innerText = 'TÍTULO DEL MENSAJE:';
            txtDetalle.placeholder = 'Ej: La reunión general será a las 7:00 PM...';
        } else if (tipo === 'PEDIDO_VENTAS') {
            lblTitulo.innerText = 'TÍTULO DE LA MISIÓN:';
            txtDetalle.placeholder = 'Ej:\\n3 laptops L490\\n2 monitores 24';
        } else {
            lblTitulo.innerText = 'EMERGENCIA CRÍTICA:';
            txtDetalle.placeholder = 'Instrucciones de la emergencia...';
        }
    },
    
    asignarMision: async function() {
        const tipo = document.getElementById('ventas-tipo')?.value;
        const tec = document.getElementById('ventas-destino')?.value;
        const titulo = document.getElementById('ventas-titulo')?.value.trim().toUpperCase();
        const detalle = document.getElementById('ventas-detalle')?.value.trim().replace(/\\n/g, '|');
        
        if (!titulo) {
            UI.toast('Escribe el título', 'warning');
            return;
        }
        
        if ((tipo === 'PEDIDO_VENTAS' || tipo === 'MENSAJE') && !detalle) {
            UI.toast('El detalle es obligatorio', 'warning');
            return;
        }
        
        SoundFx.start();
        UI.setLoading('btn-despachar', true);
        
        try {
            await Database.insertarRegistro({
                tecnico: tec,
                actividad: titulo,
                tipo_actividad: tipo,
                evento: 'Asignacion',
                motivo: detalle,
                total_lote: 1,
                creado_por: AppState.currentUser.username
            });
            
            UI.toast(`Asignado a ${tec} exitosamente`, 'success');
            document.getElementById('ventas-titulo').value = '';
            document.getElementById('ventas-detalle').value = '';
            await this.cargarDatos();
        } catch (e) {
            UI.toast('Error al enviar', 'error');
        } finally {
            UI.setLoading('btn-despachar', false, '<i class="fa-solid fa-paper-plane"></i> Despachar');
        }
    },
    
    cargarDatos: async function() {
        const f48h = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
        
        try {
            const data = await Database.obtenerRegistrosDesde(f48h);
            this.renderRadar(data);
            this.renderGridTecnicos(data);
        } catch (e) {
            UI.toast('Error en Radar', 'error');
        }
    },
    
    renderRadar: function(data) {
        const lista = document.getElementById('ventas-radar-lista');
        if (!lista) return;
        
        const misAsignaciones = data.filter(r => 
            r.evento === 'Asignacion' && 
            (r.tipo_actividad === 'PEDIDO_VENTAS' || 
             r.tipo_actividad === 'EMERGENCIA' || 
             r.tipo_actividad === 'MENSAJE')
        );
        
        const nombresMisiones = [...new Set(misAsignaciones.map(r => r.actividad))];
        const historiaMisiones = data.filter(r => nombresMisiones.includes(r.actividad));
        
        const agrupado = {};
        historiaMisiones.forEach(r => {
            if (!agrupado[r.actividad]) agrupado[r.actividad] = [];
            agrupado[r.actividad].push(r);
        });
        
        if (Object.keys(agrupado).length === 0) {
            lista.innerHTML = '<p class="text-center text-gray-500 font-bold py-8">Radar despejado. No hay operaciones activas.</p>';
            return;
        }
        
        lista.innerHTML = Object.entries(agrupado).map(([act, history]) => {
            const original = history.find(r => r.evento === 'Asignacion') || history[history.length - 1];
            const tipo = original.tipo_actividad;
            
            let estado = 'EN ESPERA', color = 'bg-gray-200 text-gray-700', icon = 'fa-clock';
            let quien = original.tecnico, obs = '';
            
            const eventInicio = history.find(r => r.evento === 'Inicio');
            const eventFin = history.find(r => r.evento === 'Fin' && r.tipo_actividad !== 'MENSAJE');
            
            if (eventFin) {
                estado = 'COMPLETADO'; color = 'bg-green-500 text-white'; icon = 'fa-check';
                quien = eventFin.tecnico;
                if (eventFin.motivo && eventFin.motivo !== 'Misión Completada') {
                    obs = `<div class="mt-2 text-xs bg-red-50 text-red-700 p-2 rounded border border-red-200 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> OBS: ${eventFin.motivo}</div>`;
                }
            } else if (eventInicio) {
                estado = 'TRABAJANDO'; color = 'bg-blue-500 text-white'; icon = 'fa-cog fa-spin';
                quien = eventInicio.tecnico;
            }
            
            if (tipo === 'MENSAJE') {
                const leidos = history.filter(r => r.evento === 'Leido').length;
                estado = original.tecnico === 'TODOS' ? `Leído por ${leidos}` : (leidos > 0 ? 'LEÍDO' : 'NO LEÍDO');
                color = leidos > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-700';
                icon = leidos > 0 ? 'fa-check-double' : 'fa-envelope';
            }
            
            const idsBlock = history.map(r => r.id).join(',');
            const btnDel = tipo === 'MENSAJE' ? `<button onclick="VentasView.eliminarRegistro('${idsBlock}')" title="Borrar Mensaje" class="absolute bottom-4 right-4 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white w-8 h-8 rounded-lg flex items-center justify-center transition border border-red-200 opacity-50 hover:opacity-100"><i class="fa-solid fa-trash-can"></i></button>` : '';
            
            return `
                <div class="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 shadow flex flex-col gap-2 relative group fade-in">
                    <div class="flex justify-between items-start">
                        <div class="pr-8">
                            <span class="text-[9px] font-black bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded border border-indigo-300">${tipo}</span>
                            <p class="font-black text-slate-800 text-base uppercase mt-1 leading-tight">${act}</p>
                            <p class="text-xs font-bold text-slate-500 mt-1"><i class="fa-solid fa-user-tag text-indigo-400"></i> Asignado: <span class="uppercase text-indigo-700">${quien}</span></p>
                        </div>
                        <span class="${color} text-[10px] font-black px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase tracking-widest text-outline whitespace-nowrap"><i class="fa-solid ${icon}"></i> ${estado}</span>
                    </div>
                    ${obs}
                    ${btnDel}
                </div>
            `;
        }).join('');
    },
    
    renderGridTecnicos: function(data) {
        const grid = document.getElementById('ventas-grid-tecnicos');
        if (!grid) return;
        
        grid.innerHTML = (window.TECNICOS || []).map(tecnico => {
            const trueHistory = data.filter(r => 
                r.tecnico === tecnico && 
                r.evento !== 'Asignacion' && 
                r.evento !== 'Leido'
            );
            
            const ultimo = trueHistory.length > 0 ? trueHistory[0] : null;
            let status = 'LIBRE', bg = 'bg-slate-50', text = 'text-slate-600', border = 'border-slate-200', icon = 'fa-mug-hot', act = 'Disponible';
            
            if (ultimo) {
                if (ultimo.evento === 'Inicio' || ultimo.evento === 'Reinicio') {
                    status = 'TRABAJANDO'; bg = 'bg-blue-50'; text = 'text-blue-700'; border = 'border-blue-300'; icon = 'fa-cog fa-spin'; act = ultimo.actividad;
                } else if (ultimo.evento === 'Interrupción') {
                    status = 'PAUSADO'; bg = 'bg-amber-50'; text = 'text-amber-700'; border = 'border-amber-300'; icon = 'fa-pause'; act = ultimo.actividad;
                } else if (ultimo.evento === 'Fin') {
                    status = 'LIBRE'; bg = 'bg-green-50'; text = 'text-green-700'; border = 'border-green-300'; icon = 'fa-check';
                }
            }
            
            return `
                <div class="border-2 ${border} ${bg} rounded-xl p-3 shadow-sm flex flex-col items-center justify-between text-center transition hover:-translate-y-1 h-28 fade-in">
                    <h4 class="font-black text-slate-800 uppercase tracking-widest text-xs mb-1"><i class="fa-solid fa-user-astronaut text-slate-400 mr-1"></i>${tecnico}</h4>
                    <span class="${text} border ${border} bg-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-widest mb-2 w-full truncate"><i class="fa-solid ${icon} mr-1"></i>${status}</span>
                    <p class="text-[10px] font-bold text-slate-600 line-clamp-2 leading-tight w-full">${act}</p>
                </div>
            `;
        }).join('');
    },
    
    eliminarRegistro: async function(ids) {
        SoundFx.error();
        if (!confirm('¿Borrar definitivamente de la base de datos?')) return;
        
        try {
            await Database.eliminarRegistros(ids);
            UI.toast('Borrado', 'success');
            await this.cargarDatos();
        } catch (e) {
            UI.toast('Error', 'error');
        }
    },
    
    iniciarPolling: function() {
        this.pollingInterval = setInterval(() => this.cargarDatos(), CONFIG.POLLING_INTERVAL);
    },
    
    detenerPolling: function() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
};

window.VentasView = VentasView;
