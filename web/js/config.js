// ==========================================
// PETULAP - Configuración Global
// ==========================================

const CONFIG = {
    // Supabase
    SUPABASE_URL: 'https://madzdaywdmfylbgvdltn.supabase.co',
    SUPABASE_KEY: 'sb_publishable_QirwPHmBp0nkLyPdyLBxXA_bQ_flLrY',
    
    // Roles
    ROLES: {
        TECNICO: 'tecnico',
        VENTAS: 'ventas',
        ADMIN: 'admin'
    },
    
    // Tipos de actividad
    TIPOS_ACTIVIDAD: {
        PRODUCCION: 'PRODUCCION',
        PEDIDO_VENTAS: 'PEDIDO_VENTAS',
        EMERGENCIA: 'EMERGENCIA',
        TAREA_ADMIN: 'TAREA_ADMIN',
        MENSAJE: 'MENSAJE'
    },
    
    // Storage keys
    STORAGE: {
        USER: 'petulap_user',
        TIPO_EQUIPO: 'petulap_tipo_equipo',
        POPUP_PREFIX: 'popup_seen_'
    },
    
    // Intervalos
    POLLING_INTERVAL: 15000, // 15 segundos
    
    // Versión
    VERSION: '6.3'
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
