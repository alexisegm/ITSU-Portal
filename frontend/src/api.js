import { API_URL } from './config.js';

/**
 * SERVICIOS DE AUTENTICACIÓN Y PERFIL
 */
export const AuthAPI = {
    // Envía las credenciales del formulario al backend para verificar accesos
    async login(correo, contrasena) {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error de autenticación");
        return data; // Devuelve el perfil completo del usuario
    },

    // Notifica al servidor el cierre de la sesión actual
    async logout() {
        return await fetch(`${API_URL}/logout`, { method: 'POST' });
    },

    // Envía al backend de Python el nuevo estado del tema visual para guardarlo en MongoDB
    async salvarPreferenciaTema(cedula, theme) {
        return await fetch(`${API_URL}/student/theme`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedula, theme })
        });
    }
};

/**
 * SERVICIOS EXCLUSIVOS PARA EL ROL ESTUDIANTE
 */
export const StudentAPI = {
    // Descarga las materias y notas del alumno logueado usando su Cédula
    async getBoletines(identificador) {
        
        // Diccionario actualizado con el formato EXACTO de tu base de datos (datosDB.txt)
        const mapaCedulas = {
            "ana@itsu.education": "V-29640288",
            "yeneily@itsu.education": "V-32554575",
            "alexis@itsu.education": "V-21622104"
        };
        
        // Si el identificador es un correo conocido, usamos su cédula con la "V-".
        // Si no, enviamos lo que llegue.
        const cedulaFinal = mapaCedulas[identificador] || identificador;

        console.log(`Buscando boletín para la cédula exacta: ${cedulaFinal}`);
        
        // Enviamos la petición a Flask con la Cédula correcta
        const res = await fetch(`${API_URL}/student/boletines/${cedulaFinal}`);
        
        if (!res.ok) throw new Error("No se pudieron obtener tus boletines");
        return await res.json();
    }
};

/**
 * SERVICIOS EXCLUSIVOS PARA EL ROL ADMINISTRADOR
 */
export const AdminAPI = {
    // Trae la lista de todos los alumnos guardados en la base de datos
    async getEstudiantes() {
        const res = await fetch(`${API_URL}/admin/estudiantes`);
        return await res.json();
    },

    // Consulta los logs de auditoría para la consola de monitoreo de seguridad
    async getLogs() {
        const res = await fetch(`${API_URL}/admin/logs`);
        return await res.json();
    },

    // Activa o desactiva la visibilidad de las notas de un trimestre específico
    async toggleBoletin(cedula, trimestre) {
        return await fetch(`${API_URL}/admin/toggle_boletin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedula, trimestre })
        });
    },

    // Cambia el estatus del ciclo del alumno (Activo / Egresado)
    async cambiarEstado(cedula, estado) {
        return await fetch(`${API_URL}/admin/cambiar_estado`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedula, estado })
        });
    },

    // Inserta un documento de estudiante nuevo dentro de MongoDB
    async registrarEstudiante(studentData) {
        const res = await fetch(`${API_URL}/admin/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error al registrar alumno");
        return data;
    }
};