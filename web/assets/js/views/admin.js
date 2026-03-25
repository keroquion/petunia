// ==========================================
// PETULAP - Vista de Admin/Owner
// ==========================================

const AdminView = {
    init: function() {
        UI.showView('view-admin');
        this.bindEvents();
        document.getElementById('admin-fecha').value = Helpers.obtenerFechaLocalISO();
        this.cargarDatos();
    },
    
    bindEvents: function() {
        // Eventos ya están en los HTML onclick
    },
    
    asignarMision: async function() {
        const tec = document.getElementById('admin-destino')?.value;
        const titulo = document.getElementById('admin-titulo')?.value.trim().toUpperCase();
        const detalle = document.getElementById('admin-detalle')?.value.trim();
        
        if (!titulo) {
            UI.toast('Escribe el título', 'warning');
            return;
        }
        
        SoundFx.start();
        UI.setLoading('btn-asignar-admin', true);
        
        try {
            await Database.insertarRegistro({
                tecnico: tec,
                actividad: titulo,
                tipo_actividad: CONFIG.TIPOS_ACTIVIDAD.TAREA_ADMIN,
                evento: 'Asignacion',
                motivo: detalle,
                total_lote: 1,
                creado_por: AppState.currentUser.username
            });
            
            UI.toast(`Asignado a ${tec} exitosamente`, 'success');
            document.getElementById('admin-titulo').value = '';
            document.getElementById('admin-detalle').value = '';
            UI.hideModal('modal-asignar-admin');
        } catch (e) {
            UI.toast('Error al enviar', 'error');
        } finally {
            UI.setLoading('btn-asignar-admin', false, 'Asignar');
        }
    },
    
    cargarDatos: async function() {
        const fechaElegida = document.getElementById('admin-fecha')?.value;
        if (!fechaElegida) return;
        
        const [year, month, day] = fechaElegida.split('-');
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
        
        const grid = document.getElementById('admin-grid-tecnicos');
        const detalles = document.getElementById('admin-detalles-container');
        
        if (!grid) return;
        
        grid.innerHTML = '<div class="col-span-full text-center py-8"><i class="fa-solid fa-circle-notch fa-spin text-blue-500 text-4xl"></i></div>';
        if (detalles) detalles.innerHTML = '';
        
        try {
            const { data } = await supabaseClient
                .from('registros_petulap')
                .select('*')
                .gte('fecha_hora', startOfDay)
                .lte('fecha_hora', endOfDay)
                .order('fecha_hora', { ascending: false });
            
            grid.innerHTML = '';
            
            (window.TECNICOS || []).forEach(tecnico => {
                const registrosTec = data?.filter(r => r.tecnico === tecnico) || [];
                const trueHistory = registrosTec.filter(r => r.evento !== 'Asignacion' && r.evento !== 'Leido');
                const ultimo = trueHistory.length > 0 ? trueHistory[0] : null;
                
                this.renderCardTecnico(tecnico, ultimo, trueHistory, grid);
                this.construirTablaDetalles(tecnico, trueHistory, detalles);
            });
        } catch (e) {
            grid.innerHTML = '<div class="col-span-full text-center text-red-500 py-8 font-bold"><i class="fa-solid fa-bug text-3xl mb-2"></i><br>Error de Servidor</div>';
        }
    },
    
    renderCardTecnico: function(tecnico, ultimo, history, container) {
        let config = {
            color: 'bg-slate-100 border-b-4 border-slate-300',
            text: 'text-slate-500 bg-white border border-slate-300',
            icon: 'fa-power-off',
            label: 'OFFLINE',
            act: 'Ninguna',
            titulo: 'ESTADO:',
            actClass: 'text-gray-500 font-bold text-sm',
            loteInfo: '',
            forzarCierre: ''
        };
        
        if (ultimo) {
            const initRecord = history.find(r => r.actividad === ultimo.actividad && r.evento === 'Inicio');
            const totalLote = initRecord ? initRecord.total_lote : 0;
            const escActividad = ultimo.actividad.replace(/'/g, "\\'").replace(/"/g, "\u0026quot;");
            
            if (ultimo.evento === 'Inicio' || ultimo.evento === 'Reinicio') {
                config = {
                    color: 'bg-blue-100 border-b-4 border-blue-400',
                    text: 'text-white bg-blue-600 shadow-inner',
                    icon: 'fa-cog fa-spin',
                    label: 'TRABAJANDO',
                    act: ultimo.actividad,
                    titulo: 'ACTIVIDAD ACTUAL:',
                    actClass: 'text-xl sm:text-2xl font-black text-blue-900 leading-tight uppercase',
                    loteInfo: totalLote ? `<span class="inline-block mt-3 px-3 py-1 bg-blue-500 text-white text-xs sm:text-sm rounded font-black border-b-2 border-blue-700 shadow-sm uppercase text-outline">Meta: ${totalLote}</span>` : '',
                    forzarCierre: this.renderForzarCierre(tecnico, escActividad, ultimo.tipo_actividad, totalLote)
                };
            } else if (ultimo.evento === 'Interrupción') {
                config = {
                    color: 'bg-amber-100 border-b-4 border-amber-400',
                    text: 'text-amber-900 bg-amber-400 shadow-inner',
                    icon: 'fa-pause',
                    label: 'PAUSADO',
                    act: ultimo.actividad,
                    titulo: `PAUSA POR: ${ultimo.motivo}`,
                    actClass: 'text-lg sm:text-xl font-black text-amber-900 leading-tight uppercase',
                    loteInfo: totalLote ? `<span class="inline-block mt-3 px-3 py-1 bg-amber-500 text-white text-xs sm:text-sm rounded font-black border-b-2 border-amber-700 shadow-sm uppercase text-outline">Meta: ${totalLote}</span>` : '',
                    forzarCierre: this.renderForzarCierre(tecnico, escActividad, ultimo.tipo_actividad, totalLote)
                };
            } else if (ultimo.evento === 'Fin') {
                config = {
                    color: 'bg-green-100 border-b-4 border-green-400',
                    text: 'text-white bg-green-500 shadow-inner',
                    icon: 'fa-check-double',
                    label: 'LIBRE',
                    act: ultimo.actividad,
                    titulo: 'ÚLTIMA TAREA:',
                    actClass: 'text-base font-black text-green-900 leading-tight uppercase opacity-80',
                    loteInfo: `<div class="mt-3 flex gap-2 text-xs sm:text-sm font-black uppercase">
                        <span class="px-3 py-1 bg-green-500 text-white rounded border-b-2 border-green-700 shadow-sm text-outline">OK: ${ultimo.ok}</span>
                        <span class="px-3 py-1 bg-red-500 text-white rounded border-b-2 border-red-700 shadow-sm text-outline">SOP: ${ultimo.fallo}</span>
                    </div>`,
                    forzarCierre: ''
                };
            }
        }
        
        container.innerHTML += `
            <div class="border-2 rounded-3xl p-5 shadow-lg transition transform hover:-translate-y-1 ${config.color} flex flex-col">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-black text-lg text-gray-800 uppercase tracking-widest"><i class="fa-solid fa-user-circle mr-1 text-blue-600"></i>${tecnico}</h3>
                    <span class="px-2 py-1 rounded text-[10px] font-black uppercase ${config.text} tracking-widest shadow-sm"><i class="fa-solid ${config.icon} mr-1"></i> ${config.label}</span>
                </div>
                <div class="mb-4 bg-white/40 p-4 rounded-2xl shadow-inner border border-white/50 flex-grow">
                    <p class="text-[10px] sm:text-xs text-gray-600 uppercase font-black tracking-widest mb-1">${config.titulo}</p>
                    <p class="${config.actClass}" style="word-break: break-word;">${config.act}</p>
                    ${config.loteInfo}
                </div>
                <div class="mt-auto">
                    <button onclick="AdminView.toggleDetalles('${tecnico}')" class="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-black py-3 rounded-xl border-b-4 border-black active:border-b-0 active:translate-y-1 transition shadow-lg uppercase tracking-widest">
                        Registros <i class="fa-solid fa-caret-down"></i>
                    </button>
                    ${config.forzarCierre}
                </div>
            </div>
        `;
    },
    
    renderForzarCierre: function(tecnico, actividad, tipo, total) {
        return `
            <button onclick="document.getElementById('forzar-cierre-panel-${tecnico}').classList.toggle('hidden-view'); SoundFx.click();" 
                class="w-full mt-3 text-red-600 bg-white hover:bg-red-50 text-xs font-black py-2 rounded-xl transition border-2 border-red-200 uppercase tracking-widest">
                <i class="fa-solid fa-skull"></i> Forzar Cierre
            </button>
            <div id="forzar-cierre-panel-${tecnico}" class="hidden-view mt-2 p-3 bg-red-100 border-2 border-red-300 rounded-xl shadow-inner">
                <div class="flex gap-2 mb-2">
                    <input type="number" id="forzar-ok-${tecnico}" placeholder="OK" class="w-1/2 p-2 text-xs font-bold border-2 border-red-300 rounded-lg outline-none focus:border-red-600 text-center" min="0">
                    <input type="number" id="forzar-sop-${tecnico}" placeholder="SOP" class="w-1/2 p-2 text-xs font-bold border-2 border-red-300 rounded-lg outline-none focus:border-red-600 text-center" min="0">
                </div>
                <button onclick="AdminView.forzarCierre('${tecnico}', '${actividad}', '${tipo}', ${total})" 
                    class="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-black py-2 rounded-lg transition uppercase border-b-4 border-red-800 active:border-b-0 active:translate-y-1">
                    Ejecutar
                </button>
            </div>
        `;
    },
    
    construirTablaDetalles: function(tecnico, registros, container) {
        if (!container) return;
        
        const wrapper = document.createElement('div');
        wrapper.id = `admin-tabla-${tecnico}`;
        wrapper.className = 'hidden-view bg-white rounded-3xl shadow-xl p-6 border-l-8 border-blue-600 mb-4';
        
        const chron = [...registros].reverse();
        const sesiones = [];
        let sesionActual = null;
        
        chron.forEach(r => {
            if (r.evento === 'Inicio') {
                if (sesionActual) sesiones.push(sesionActual);
                sesionActual = {
                    ids: [r.id],
                    actividad: r.actividad,
                    tipo: r.tipo_actividad,
                    inicio: r.fecha_hora,
                    fin: null,
                    total_lote: r.total_lote,
                    ok: 0,
                    soporte: 0,
                    pausas: [],
                    estado: 'En curso'
                };
            } else if (sesionActual && r.actividad === sesionActual.actividad) {
                sesionActual.ids.push(r.id);
                if (r.evento === 'Interrupción') {
                    sesionActual.pausas.push(r.motivo);
                    sesionActual.estado = 'Pausado';
                } else if (r.evento === 'Reinicio') {
                    sesionActual.estado = 'En curso';
                } else if (r.evento === 'Fin') {
                    sesionActual.fin = r.fecha_hora;
                    sesionActual.ok = r.ok;
                    sesionActual.soporte = r.fallo;
                    sesionActual.estado = 'Finalizado';
                    sesiones.push(sesionActual);
                    sesionActual = null;
                }
            }
        });
        
        if (sesionActual) sesiones.push(sesionActual);
        sesiones.reverse();
        
        let tbody = sesiones.length === 0 
            ? `<tr><td colspan="5" class="p-6 text-center text-gray-500 font-bold uppercase">Sin registros este día.</td></tr>`
            : sesiones.map(s => {
                const tInicio = s.inicio ? Helpers.formatearHora(s.inicio) : '---';
                const tFin = s.fin ? Helpers.formatearHora(s.fin) : 'En Curso';
                const duracion = s.inicio 
                    ? `<br><span class="text-blue-100 font-black text-[10px] bg-blue-600 px-2 py-0.5 rounded shadow-sm my-1 inline-block text-outline"><i class="fa-solid fa-stopwatch"></i> ${Helpers.formatearTiempo(Timer.calculateDuration(s.inicio, s.fin))}</span><br>`
                    : '<br><i class="fa-solid fa-arrow-down text-gray-300 text-[10px]"></i><br>';
                
                const pausas = s.pausas.length > 0 
                    ? `<span class="text-amber-600 font-bold block mt-1"><i class="fa-solid fa-pause text-xs"></i> ${s.pausas.join(', ')}</span>`
                    : '<span class="text-gray-400 italic font-medium">Ninguna</span>';
                
                const resultados = s.estado === 'Finalizado'
                    ? `<div class="flex flex-col gap-1 items-center">
                        <span class="px-2 py-0.5 bg-green-500 text-white rounded border-b-2 border-green-700 font-black text-xs text-outline w-24">OK: ${s.ok}</span>
                        <span class="px-2 py-0.5 bg-red-500 text-white rounded border-b-2 border-red-700 font-black text-xs text-outline w-24">SOP: ${s.soporte}</span>
                    </div>`
                    : `<span class="px-3 py-1 bg-blue-500 text-white rounded border-b-2 border-blue-700 font-black text-xs text-outline">${s.estado}</span>`;
                
                const tipo = s.tipo !== 'PRODUCCION' 
                    ? `<span class="block text-[10px] text-blue-500 font-black mb-1 uppercase tracking-widest bg-blue-50 px-1 rounded inline-block border border-blue-200">${s.tipo}</span>`
                    : '';
                
                const btnDel = AppState.currentUser?.rol === 'admin' || AppState.currentUser?.rol === 'owner'
                    ? `<button onclick="AdminView.eliminarRegistro('${s.ids.join(',')}')" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition border border-red-200"><i class="fa-solid fa-trash"></i></button>`
                    : '';
                
                return `
                    <tr class="hover:bg-blue-50 border-b-2 border-gray-100 last:border-0 transition">
                        <td class="p-4 text-gray-600 font-mono font-bold whitespace-nowrap text-center align-middle">
                            <span class="text-green-600">${tInicio}</span>${duracion}<span class="text-red-500">${tFin}</span>
                        </td>
                        <td class="p-4 font-black text-gray-800 uppercase text-base align-middle">${tipo}${s.actividad}</td>
                        <td class="p-4 text-xs align-middle">${pausas}</td>
                        <td class="p-4 text-center whitespace-nowrap align-middle">${resultados}</td>
                        <td class="p-4 text-right align-middle">${btnDel}</td>
                    </tr>
                `;
            }).join('');
        
        wrapper.innerHTML = `
            <div class="flex justify-between items-center mb-4 border-b-2 border-gray-100 pb-3">
                <h3 class="font-black text-xl text-slate-800 uppercase tracking-widest"><i class="fa-solid fa-book-open text-blue-600 mr-2"></i> Bitácora de ${tecnico}</h3>
                <button onclick="AdminView.toggleDetalles('${tecnico}'); SoundFx.click();" 
                    class="text-slate-500 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-xl w-10 h-10 flex items-center justify-center transition border-b-4 border-slate-400 active:border-b-0 active:translate-y-1"
                >
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            <div class="overflow-x-auto rounded-xl border-2 border-gray-200">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-800 text-white text-[10px] sm:text-xs uppercase tracking-widest">
                            <th class="p-4 rounded-tl-lg text-center">Horario</th>
                            <th class="p-4">Actividad</th>
                            <th class="p-4">Eventos</th>
                            <th class="p-4 text-center">Resultados</th>
                            <th class="p-4 rounded-tr-lg text-right"><i class="fa-solid fa-gear"></i></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 bg-white">${tbody}</tbody>
                </table>
            </div>
        `;
        
        container.appendChild(wrapper);
    },
    
    toggleDetalles: function(tecnico) {
        (window.TECNICOS || []).forEach(t => {
            if (t !== tecnico) {
                const el = document.getElementById(`admin-tabla-${t}`);
                if (el) el.classList.add('hidden-view');
            }
        });
        
        const tabla = document.getElementById(`admin-tabla-${tecnico}`);
        if (!tabla) return;
        
        if (tabla.classList.contains('hidden-view')) {
            tabla.classList.remove('hidden-view');
            tabla.classList.add('slide-down');
            setTimeout(() => tabla.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        } else {
            tabla.classList.add('hidden-view');
            tabla.classList.remove('slide-down');
        }
    },
    
    forzarCierre: async function(tecnico, actividad, tipo, total) {
        const okInput = document.getElementById(`forzar-ok-${tecnico}`);
        const sopInput = document.getElementById(`forzar-sop-${tecnico}`);
        
        const ok = parseInt(okInput?.value) || 0;
        const sop = parseInt(sopInput?.value) || 0;
        
        SoundFx.finish();
        
        try {
            await Database.insertarRegistro({
                tecnico: tecnico,
                actividad: actividad,
                tipo_actividad: tipo,
                evento: 'Fin',
                motivo: 'Cerrado por Admin',
                total_lote: total,
                ok: ok,
                fallo: sop
            });
            UI.toast('Cerrado con éxito', 'success');
            this.cargarDatos();
        } catch (e) {
            UI.toast('Error', 'error');
        }
    },
    
    eliminarRegistro: async function(ids) {
        SoundFx.error();
        if (!confirm('¿Borrar definitivamente?')) return;
        
        try {
            await Database.eliminarRegistros(ids);
            UI.toast('Borrado', 'success');
            this.cargarDatos();
        } catch (e) {
            UI.toast('Error', 'error');
        }
    }
};

window.AdminView = AdminView;
