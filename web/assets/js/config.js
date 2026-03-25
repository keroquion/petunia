// Configuración de la aplicación
console.log('Cargando configuración de la aplicación...');

// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://madzdaywdmfylbgvdltn.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_QirwPHmBp0nkLyPdyLBxXA_bQ_flLrY';    

// Validación de configuración
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('ERROR DE CONFIGURACIÓN: Faltan credenciales de Supabase');
}

const CONFIG = {
    SUPABASE_URL,
    SUPABASE_KEY,
    DEBUG_MODE: true // Cambiar a false en producción
};

console.log('Configuración cargada correctamente');
console.log('Modo debug:', CONFIG.DEBUG_MODE);

// Exportar configuración
window.CONFIG = CONFIG;