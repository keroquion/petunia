// ==========================================
// PETULAP - Utilidades de UI
// ==========================================

const UI = {
    // Mostrar toast/notificación
    toast: function(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const colors = {
            success: 'bg-green-500 border-b-4 border-green-700',
            error: 'bg-red-500 border-b-4 border-red-700',
            warning: 'bg-amber-500 border-b-4 border-amber-700',
            info: 'bg-blue-500 border-b-4 border-blue-700'
        };
        
        const toast = document.createElement('div');
        toast.className = `${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl font-black uppercase tracking-wider flex items-center justify-between transition-all duration-300 translate-y-[-20px] opacity-0 text-sm text-outline z-[1000]`;
        toast.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="ml-4 hover:text-gray-200">
                <i class="fa-solid fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Sonidos
        if (type === 'error') SoundFx.error();
        else if (type === 'warning') SoundFx.tick();
        
        // Animación de entrada
        setTimeout(() => toast.classList.remove('translate-y-[-20px]', 'opacity-0'), 10);
        
        // Auto-eliminar
        setTimeout(() => {
            toast.classList.add('opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },
    
    // Cambiar estado de carga en botón
    setLoading: function(btnId, isLoading, html) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
        } else {
            btn.disabled = false;
            btn.innerHTML = html;
        }
    },
    
    // Mostrar/ocultar navbar
    showNavbar: function(user) {
        const navInfo = document.getElementById('nav-user-info');
        const userDisplay = document.getElementById('user-display');
        
        if (navInfo && userDisplay && user) {
            navInfo.classList.remove('hidden-view');
            userDisplay.innerHTML = `<i class="fa-solid fa-user-circle mr-1"></i> ${user.username}`;
        }
    },
    
    hideNavbar: function() {
        const navInfo = document.getElementById('nav-user-info');
        if (navInfo) {
            navInfo.classList.add('hidden-view');
        }
    },
    
    // Mostrar vista específica
    showView: function(viewId) {
        // Ocultar todas las vistas principales
        const vistas = ['view-login', 'view-tecnico', 'view-admin', 'view-ventas'];
        vistas.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden-view');
        });
        
        // Mostrar la solicitada
        const target = document.getElementById(viewId);
        if (target) target.classList.remove('hidden-view');
    },
    
    // Actualizar estado visual del técnico
    setTecnicoState: function(status) {
        const estados = ['state-inicio', 'state-proceso', 'state-pedido-proceso', 'state-pausado', 'state-finalizacion'];
        estados.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden-view');
        });
        
        const banner = document.getElementById('tec-banner-activo');
        const accordion = document.getElementById('accordion-admin-tasks');
        const pendientes = document.getElementById('tec-pendientes-ventas');
        
        if (status !== 'libre') {
            if (pendientes) pendientes.classList.add('hidden-view');
            if (accordion) accordion.classList.add('hidden-view');
        } else {
            if (pendientes) pendientes.classList.remove('hidden-view');
            if (accordion) accordion.classList.remove('hidden-view');
        }
        
        if (status === 'libre') {
            if (banner) banner.classList.add('hidden-view');
            const stateInicio = document.getElementById('state-inicio');
            if (stateInicio) stateInicio.classList.remove('hidden-view');
        }
    },
    
    // Actualizar banner de actividad
    updateBanner: function(actividad, tiempo) {
        const lblActividad = document.getElementById('tec-banner-actividad');
        const lblTiempo = document.getElementById('tec-banner-tiempo');
        
        if (lblActividad) lblActividad.innerText = actividad;
        if (lblTiempo) lblTiempo.innerText = tiempo;
    },
    
    // Renderizar historial
    renderHistorial: function(registros, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const finalizados = registros.filter(r => 
            r.evento === 'Fin' && r.tipo_actividad !== 'MENSAJE'
        );
        
        if (finalizados.length === 0) {
            container.innerHTML = '<li class="text-gray-400 text-sm font-bold text-center py-4 uppercase">Ningún logro hoy.</li>';
            return;
        }
        
        container.innerHTML = '';
        finalizados.forEach(r => {
            container.innerHTML += `
                <li class="flex items-center gap-3 bg-white p-3 rounded-xl border-2 border-gray-100 shadow-sm fade-in">
                    <div class="bg-blue-100 text-blue-600 p-3 rounded-lg border border-blue-300 shadow-inner">
                        <i class="fa-solid fa-check-double"></i>
                    </div>
                    <div class="flex-grow">
                        <p class="font-black text-gray-800 text-sm uppercase">${Helpers.escapeHtml(r.actividad)}</p>
                        <p class="text-xs text-gray-500 font-bold mt-1">
                            <span class="text-white bg-green-500 px-2 py-0.5 rounded text-outline">OK: ${r.ok || 0}</span>
                            <span class="text-white bg-red-500 px-2 py-0.5 rounded ml-1 text-outline">SOP: ${r.fallo || 0}</span>
                        </p>
                    </div>
                </li>
            `;
        });
    },
    
    // Renderizar checklist
    renderChecklist: function(items) {
        const container = document.getElementById('pedido-checklist-container');
        const wrapper = document.getElementById('pedido-checklist-wrapper');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (items.length === 0) {
            if (wrapper) wrapper.classList.add('hidden-view');
            return;
        }
        
        if (wrapper) wrapper.classList.remove('hidden-view');
        
        items.forEach((item, idx) => {
            const id = `chk-${idx}`;
            container.innerHTML += `
                <label for="${id}" class="checklist-item flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-indigo-100 transition hover:bg-indigo-50 cursor-pointer">
                    <input type="checkbox" id="${id}" class="w-6 h-6 rounded text-green-500 focus:ring-green-500" onchange="app.evaluarChecklist?.() || UI.evaluarChecklist()">
                    <span class="font-black text-indigo-900 text-sm uppercase">${Helpers.escapeHtml(item)}</span>
                </label>
            `;
        });
    },
    
    // Evaluar estado del checklist
    evaluarChecklist: function() {
        const checks = document.querySelectorAll('.checklist-item input[type="checkbox"]');
        const obsContainer = document.getElementById('pedido-observaciones-container');
        const btn = document.getElementById('btn-completar-pedido');
        
        if (!btn) return;
        
        let todosCheck = true;
        
        checks.forEach(chk => {
            if (!chk.checked) todosCheck = false;
            chk.parentElement.classList.toggle('checked', chk.checked);
        });
        
        if (todosCheck || checks.length === 0) {
            if (obsContainer) obsContainer.classList.add('hidden-view');
            btn.className = btn.className.replace('bg-amber-600', 'bg-indigo-600')
                                         .replace('border-amber-800', 'border-indigo-800');
        } else {
            if (obsContainer) obsContainer.classList.remove('hidden-view');
            btn.className = btn.className.replace('bg-indigo-600', 'bg-amber-600')
                                         .replace('border-indigo-800', 'border-amber-800');
        }
    },
    
    // Mostrar modal de emergencia
    showEmergencia: function(actividad) {
        const modal = document.getElementById('modal-emergencia');
        const txt = document.getElementById('txt-emergencia-tarea');
        
        if (modal && txt) {
            txt.innerText = actividad;
            modal.classList.remove('hidden-view');
        }
        
        SoundFx.alert();
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 400]);
        }
    },
    
    // Ocultar modal de emergencia
    hideEmergencia: function() {
        const modal = document.getElementById('modal-emergencia');
        if (modal) modal.classList.add('hidden-view');
    },
    
    // Mostrar modal de pedido
    showPedido: function(actividad) {
        const modal = document.getElementById('modal-pedido-ventas');
        const txt = document.getElementById('txt-pedido-ventas-tarea');
        
        if (modal && txt) {
            txt.innerText = actividad;
            modal.classList.remove('hidden-view');
        }
        
        SoundFx.message();
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    },
    
    // Ocultar modal de pedido
    hidePedido: function() {
        const modal = document.getElementById('modal-pedido-ventas');
        if (modal) modal.classList.add('hidden-view');
    },
    
    // Actualizar selects de técnicos
    actualizarSelectsTecnicos: function(tecnicos) {
        const options = '<option value="TODOS">TODOS (Planta)</option>' +
            tecnicos.map(t => `<option value="${t.username}">${t.username}</option>`).join('');
        
        document.querySelectorAll('.select-tecnicos-dinamico').forEach(el => {
            el.innerHTML = options;
        });
    }
};

// Exponer globalmente
window.UI = UI;
