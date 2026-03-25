// Interacción con la base de datos Supabase
console.log('Cargando módulo de base de datos...');

// Inicializar cliente de Supabase
let supabaseClient = null;

try {
    // Verificar que las credenciales estén disponibles
    if (window.CONFIG && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY) {
        supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        console.log('Cliente de Supabase inicializado correctamente');
    } else {
        console.error('ERROR: Credenciales de Supabase no configuradas');
    }
} catch (error) {
    console.error('Error al inicializar cliente de Supabase:', error);
}

const Database = {
    client: supabaseClient,

    // Cargar lista de técnicos desde la base de datos
    cargarTecnicos: async function() {
        try {
            console.log('Cargando técnicos desde la base de datos...');
            
            if (!this.client) {
                throw new Error('Cliente de Supabase no inicializado');
            }

            const { data, error } = await this.client
                .from('usuarios_petulap')
                .select('username')
                .eq('rol', 'tecnico');

            if (error) {
                throw new Error(`Error de base de datos: ${error.message}`);
            }

            if (data) {
                const tecnicos = data.map(t => t.username);
                console.log(`Técnicos cargados: ${tecnicos.length}`);
                return tecnicos;
            }

            console.warn('No se encontraron técnicos en la base de datos');
            return [];
        } catch (error) {
            console.error('Error al cargar técnicos:', error);
            return [];
        }
    },

    // Autenticar usuario
    autenticarUsuario: async function(username, password) {
        try {
            console.log(`Autenticando usuario: ${username}`);
            
            if (!this.client) {
                throw new Error('Cliente de Supabase no inicializado');
            }

            const { data, error } = await this.client
                .from('usuarios_petulap')
                .select('*')
                .eq('username', username)
                .single();

            if (error || !data) {
                throw new Error('Usuario no encontrado');
            }

            // Verificar contraseña usando AuthUtils
            if (!window.AuthUtils.verifyPassword(password, data.password)) {
                throw new Error('Contraseña incorrecta');
            }

            console.log(`Usuario autenticado correctamente: ${username}`);
            return data;
        } catch (error) {
            console.error('Error en autenticación:', error);
            throw error;
        }
    },

    // Registrar evento en la base de datos
    registrarEvento: async function(registro) {
        try {
            console.log('Registrando evento:', registro);
            
            if (!this.client) {
                throw new Error('Cliente de Supabase no inicializado');
            }

            const { data, error } = await this.client
                .from('registros_petulap')
                .insert([registro]);

            if (error) {
                throw new Error(`Error al registrar evento: ${error.message}`);
            }

            console.log('Evento registrado correctamente');
            return data;
        } catch (error) {
            console.error('Error al registrar evento:', error);
            throw error;
        }
    },

    // Cargar registros de la base de datos
    cargarRegistros: async function(filtros = {}) {
        try {
            console.log('Cargando registros con filtros:', filtros);
            
            if (!this.client) {
                throw new Error('Cliente de Supabase no inicializado');
            }

            let query = this.client.from('registros_petulap').select('*');

            // Aplicar filtros si existen
            if (filtros.gte) {
                query = query.gte('fecha_hora', filtros.gte);
            }
            
            if (filtros.lte) {
                query = query.lte('fecha_hora', filtros.lte);
            }
            
            if (filtros.order) {
                query = query.order('fecha_hora', { ascending: filtros.order === 'asc' });
            } else {
                query = query.order('fecha_hora', { ascending: false });
            }

            const { data, error } = await query;

            if (error) {
                throw new Error(`Error al cargar registros: ${error.message}`);
            }

            console.log(`Registros cargados: ${data ? data.length : 0}`);
            return data || [];
        } catch (error) {
            console.error('Error al cargar registros:', error);
            return [];
        }
    },

    // Eliminar registros de la base de datos
    eliminarRegistros: async function(ids) {
        try {
            console.log('Eliminando registros:', ids);
            
            if (!this.client) {
                throw new Error('Cliente de Supabase no inicializado');
            }

            const { data, error } = await this.client
                .from('registros_petulap')
                .delete()
                .in('id', ids);

            if (error) {
                throw new Error(`Error al eliminar registros: ${error.message}`);
            }

            console.log('Registros eliminados correctamente');
            return data;
        } catch (error) {
            console.error('Error al eliminar registros:', error);
            throw error;
        }
    }
};

console.log('Módulo de base de datos cargado correctamente');

// Exportar módulo
window.Database = Database;