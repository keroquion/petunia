// ==========================================
// PETULAP - Utilidades de Autenticación
// ==========================================

const AuthUtils = {
    // Hash simple para contraseñas (solo para esta aplicación pequeña)
    // NOTA: Para aplicaciones reales, usar bcrypt o similar
    hashPassword: function(password) {
        // Implementación básica de hash para demostración
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return 'hash_' + Math.abs(hash).toString(36);
    },
    
    // Verificar contraseña hasheada
    verifyPassword: function(password, hashedPassword) {
        // Si la contraseña no está hasheada (formato antiguo), comparamos directamente
        if (!hashedPassword.startsWith('hash_')) {
            return password === hashedPassword;
        }
        return this.hashPassword(password) === hashedPassword;
    },
    
    // Middleware para autenticación
    requireAuth: function() {
        if (!window.app.currentUser) {
            window.app.logout();
            throw new Error('Autenticación requerida');
        }
    }
};

console.log('Módulo de autenticación cargado correctamente');

// Exportar módulo
window.AuthUtils = AuthUtils;