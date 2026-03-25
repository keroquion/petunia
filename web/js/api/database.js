// ==========================================
// PETULAP - API de Base de Datos (Supabase)
// ==========================================

const Database = {
    client: null,
    
    // Inicializar cliente Supabase
    init: function() {
        if (typeof supabase === 'undefined') {
            console.error('Supabase no está cargado');
            return false;
        }
        
        try {
            this.client = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
            return true;
        } catch (e) {
            console.error('Error inicializando Supabase:', e);
            return false;
        }
    },
    
    // Login de usuario
    login: async function(username, password) {
        if (!this.client) throw new Error('Database no inicializada');
        
        const { data, error } = await this.client
            .from('usuarios_petulap')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();
        
        if (error || !data) {
            throw new Error('Credenciales incorrectas');
        }
        
        return data;
    },
    
    // Cargar lista de técnicos
    cargarTecnicos: async function() {
        if (!this.client) return [];
        
        const { data, error } = await this.client
            .from('usuarios_petulap')
            .select('username, nombre_completo')
            .eq('rol', 'tecnico');
        
        if (error) {
            console.error('Error cargando técnicos:', error);
            return [];
        }
        
        return data || [];
    },
    
    // Obtener registros desde una fecha
    obtenerRegistrosDesde: async function(fechaISO) {
        if (!this.client) return [];
        
        const { data, error } = await this.client
            .from('registros_petulap')
            .select('*')
            .gte('fecha_hora', fechaISO)
            .order('fecha_hora', { ascending: false });
        
        if (error) {
            console.error('Error obteniendo registros:', error);
            return [];
        }
        
        return data || [];
    },
    
    // Insertar nuevo registro
    insertarRegistro: async function(registro) {
        if (!this.client) throw new Error('Database no inicializada');
        
        const registroCompleto = {
            ...registro,
            fecha_hora: new Date().toISOString()
        };
        
        const { error } = await this.client
            .from('registros_petulap')
            .insert([registroCompleto]);
        
        if (error) throw error;
        return true;
    },
    
    // Obtener asignaciones para un técnico
    obtenerAsignaciones: async function(tecnico, limit = 50) {
        if (!this.client) return [];
        
        const { data, error } = await this.client
            .from('registros_petulap')
            .select('*')
            .in('tecnico', [tecnico, 'TODOS'])
            .eq('evento', 'Asignacion')
            .order('fecha_hora', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('Error obteniendo asignaciones:', error);
            return [];
        }
        
        return data || [];
    },
    
    // Verificar si una actividad ya fue tomada
    actividadTomada: async function(actividad) {
        if (!this.client) return false;
        
        const { data, error } = await this.client
            .from('registros_petulap')
            .select('id')
            .eq('actividad', actividad)
            .eq('evento', 'Inicio')
            .limit(1);
        
        if (error) return false;
        return data && data.length > 0;
    },
    
    // Obtener historial de un técnico
    obtenerHistorialTecnico: async function(tecnico, desdeFecha) {
        if (!this.client) return [];
        
        const { data, error } = await this.client
            .from('registros_petulap')
            .select('*')
            .eq('tecnico', tecnico)
            .gte('fecha_hora', desdeFecha)
            .order('fecha_hora', { ascending: false });
        
        if (error) {
            console.error('Error obteniendo historial:', error);
            return [];
        }
        
        return data || [];
    },
    
    // Obtener dashboard admin (todos los registros de una fecha)
    obtenerDashboardAdmin: async function(fecha) {
        if (!this.client) return [];
        
        const inicioDia = fecha + 'T00:00:00.000Z';
        const finDia = fecha + 'T23:59:59.999Z';
        
        const { data, error } = await this.client
            .from('registros_petulap')
            .select('*')
            .gte('fecha_hora', inicioDia)
            .lte('fecha_hora', finDia)
            .order('fecha_hora', { ascending: false });
        
        if (error) {
            console.error('Error obteniendo dashboard:', error);
            return [];
        }
        
        return data || [];
    }
};

// Exponer globalmente
window.Database = Database;
