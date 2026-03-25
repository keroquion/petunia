// ==========================================
// PETULAP - Módulo de UI (Gestión de Vistas)
// ==========================================

const UI = {
    // Mostrar/ocultar vistas
    showView: function(viewId) {
        const views = ['view-login', 'view-tecnico', 'view-admin', 'view-ventas'];
        views.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden-view');
        });
        
        const target = document.getElementById(viewId);
        if (target) target.classList.remove('hidden-view');
    },
    
    // ================= TOASTS =================
    
    toast: function(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const colors = {
            success: 'toast-success',
            error: 'toast-error',
            warning: 'toast-warning',
            info: 'toast-info'
        };
        
        const toast = document.createElement('div');
        toast.className = `${colors[type]} toast fade-in`;
        toast.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="ml-4 hover:text-gray-200">
                <i class="fa-solid fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Sonido según tipo
        if (type === 'error') SoundFx.error();
        else if (type === 'warning') SoundFx.tick();
        
        // Auto-eliminar
        setTimeout(() => {
            toast.classList.add('opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },
    
    // ================= BOTONES =================
    
    setLoading: function(btnId, isLoading, html = '') {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
        } else {
            btn.disabled = false;
            btn.innerHTML = html;
        }
    },
    
    // ================= MODALES =================
    
    showModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden-view');
    },
    
    hideModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden-view');
    },
    
    // ================= ESTADOS TÉCNICO =================
    
    setTecnicoState: function(status) {
        const states = ['state-inicio', 'state-proceso', 'state-pedido-proceso', 
                        'state-pausado', 'state-finalizacion'];
        states.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden-view');
        });
        
        const banner = document.getElementById('tec-banner-activo');
        const pendientes = document.getElementById('tec-pendientes-ventas');
        const accordion = document.getElementById('accordion-admin-tasks');
        
        // Configurar banner según estado
        if (banner) {
            const configs = {
                libre: { class: 'hidden-view', color: '' },
                trabajando: { 
                    class: '', 
                    color: 'bg-blue-600 border-blue-800',
                    estado: 'ACTIVIDAD ACTUAL'
                },
                pausado: { 
                    class: '', 
                    color: 'bg-amber-500 border-amber-700',
                    estado: 'PAUSADO'
                }
            };
            
            if (status === 'libre') {
                banner.classList.add('hidden-view');
            } else {
                banner.classList.remove('hidden-view');
                banner.className = `rounded-3xl shadow-xl p-6 mb-6 text-center border-b-8 ${configs[status].color}`;
                
                const lblEstado = document.getElementById('tec-banner-estado');
                if (lblEstado) lblEstado.innerText = configs[status].estado;
            }
        }
        
        // Mostrar/ocultar pendientes y accordion
        if (pendientes) {
            if (status !== 'libre') pendientes.classList.add('hidden-view');
            else pendientes.classList.remove('hidden-view');
        }
        
        if (accordion) {
            if (status !== 'libre') accordion.classList.add('hidden-view');
            else accordion.classList.remove('hidden-view');
        }
    },
    
    // Actualizar banner con info de actividad
    updateBanner: function(actividad, tiempo) {
        const lblActividad = document.getElementById('tec-banner-actividad');
        const lblTiempo = document.getElementById('tec-banner-tiempo');
        
        if (lblActividad) lblActividad.innerText = actividad;
        if (lblTiempo) lblTiempo.innerText = tiempo;
    },
    
    // ================= NAVBAR =================
    
    showNavbar: function(user) {
        const navUserInfo = document.getElementById('nav-user-info');
        const userDisplay = document.getElementById('user-display');
        
        if (navUserInfo) navUserInfo.classList.remove('hidden-view');
        if (userDisplay) {
            userDisplay.innerHTML = `<i class="fa-solid fa-user-circle mr-1"></i> ${user.username}
            `;
        }
    },
    
    hideNavbar: function() {
        const navUserInfo = document.getElementById('nav-user-info');
        if (navUserInfo) navUserInfo.classList.add('hidden-view');
    },
    
    // ================= HISTORIAL =================
    
    renderHistorial: function(registros, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const finalizados = registros.filter(r => 
            r.evento === 'Fin' && 
            r.tipo_actividad !== 'MENSAJE'
        );
        
        if (finalizados.length === 0) {
            container.innerHTML = `
                <li class="text-gray-400 text-sm font-bold text-center py-4 uppercase">
                    Ningún logro hoy.
                </li>
            `;
            return;
        }
        
        container.innerHTML = finalizados.map(r => `
            <li class="flex items-center gap-3 bg-white p-3 rounded-xl border-2 border-gray-100 shadow-sm">
                <div class="bg-blue-100 text-blue-600 p-3 rounded-lg border border-blue-300 shadow-inner">
                    <i class="fa-solid fa-check-double"></i>
                </div>
                <div class="flex-grow">
                    <p class="font-black text-gray-800 text-sm uppercase">${r.actividad}</p>
                    <p class="text-xs text-gray-500 font-bold mt-1">
                        <span class="text-white bg-green-500 px-2 py-0.5 rounded text-outline">
                            OK: ${r.ok}
                        </span> 
                        <span class="text-white bg-red-500 px-2 py-0.5 rounded ml-1 text-outline">
                            SOP: ${r.fallo}
                        </span>
                    </p>
                </div>
            </li>
        `).join('');
    },
    
    // ================= CHECKLIST =================
    
    renderChecklist: function(items) {
        const container = document.getElementById('pedido-checklist-container');
        const wrapper = document.getElementById('pedido-checklist-wrapper');
        
        if (!container || !wrapper) return;
        
        container.innerHTML = '';
        
        if (items.length === 0) {
            wrapper.classList.add('hidden-view');
            return;
        }
        
        wrapper.classList.remove('hidden-view');
        
        items.forEach((item, idx) => {
            const id = `chk-${idx}`;
            container.innerHTML += `
                <label for="${id}" class="checklist-item flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-indigo-100 transition hover:bg-indigo-50 cursor-pointer">
                    <input type="checkbox" id="${id}" 
                        class="w-6 h-6 rounded text-green-500 focus:ring-green-500" 
                        onchange="app.evaluarChecklist()">
                    <span class="font-black text-indigo-900 text-sm uppercase">${item}</span>
                </label>
            `;
        });
    },
    
    evaluarChecklist: function() {
        const checks = document.querySelectorAll('.checklist-item input[type="checkbox"]');
        const obsContainer = document.getElementById('pedido-observaciones-container');
        const btnCompletar = document.getElementById('btn-completar-pedido');
        
        let todosCheck = true;
        
        checks.forEach(chk => {
            if (!chk.checked) todosCheck = false;
            chk.parentElement.classList.toggle('checked', chk.checked);
        });
        
        if (todosCheck || checks.length === 0) {
            if (obsContainer) obsContainer.classList.add('hidden-view');
            if (btnCompletar) {
                btnCompletar.className = btnCompletar.className
                    .replace('bg-amber-600', 'bg-indigo-600')
                    .replace('border-amber-800', 'border-indigo-800');
            }
        } else {
            if (obsContainer) obsContainer.classList.remove('hidden-view');
            if (btnCompletar) {
                btnCompletar.className = btnCompletar.className
                    .replace('bg-indigo-600', 'bg-amber-600')
                    .replace('border-indigo-800', 'border-amber-800');
            }
        }
    },
    
    // ================= POPUPS =================
    
    showEmergencia: function(actividad) {
        const modal = document.getElementById('modal-emergencia');
        const txt = document.getElementById('txt-emergencia-tarea');
        
        if (modal) {
            modal.classList.remove('hidden-view');
            SoundFx.alert();
            SoundFx.vibrate([200, 100, 200, 100, 400]);
        }
        if (txt) txt.innerText = actividad;
    },
    
    showPedidoVentas: function(actividad) {
        const modal = document.getElementById('modal-pedido-ventas');
        const txt = document.getElementById('txt-pedido-ventas-tarea');
        
        if (modal) {
            modal.classList.remove('hidden-view');
            SoundFx.message();
            SoundFx.vibrate([100, 50, 100]);
        }
        if (txt) txt.innerText = actividad;
    },
    
    hideEmergencia: function() {
        this.hideModal('modal-emergencia');
    },
    
    hidePedidoVentas: function() {
        this.hideModal('modal-pedido-ventas');
    }
};

// Exponer globalmente
window.UI = UI;
