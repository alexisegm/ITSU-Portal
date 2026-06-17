import { API_URL } from './config.js';

async function parseResponse(res) {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
        const data = await res.json();
        return { ok: res.ok, data };
    }
    // Fallback: read text and wrap into an error-like object
    const text = await res.text();
    return { ok: res.ok, data: { message: text } };
}

/**
 * SERVICIOS DE AUTENTICACIÓN Y PERFIL
 */
export const AuthAPI = {
    // Envía las credenciales del formulario al backend para verificar accesos
    async login(correo, contrasena) {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena })
        });
        const { ok, data } = await parseResponse(res);
        if (!ok) throw new Error(data.message || "Error de autenticación");
        // Normalizamos la respuesta: devolvemos role + campos del perfil (si existen)
        return Object.assign({ role: data.role || null }, data.data || {});
    },

    // Notifica al servidor el cierre de la sesión actual
    async logout() {
        return await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
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
    async getBoletines() {
        // El backend usa la sesión de Flask para identificar al estudiante
        const res = await fetch(`${API_URL}/estudiante/boletin`, { credentials: 'include' });
        const { ok, data } = await parseResponse(res);
        if (!ok) throw new Error(data.message || "No se pudieron obtener tus boletines");
        return data.data; // Documento del estudiante
    }
};

/**
 * SERVICIOS EXCLUSIVOS PARA EL ROL ADMINISTRADOR
 */
export const AdminAPI = {
    // Trae la lista de todos los alumnos guardados en la base de datos
    async getEstudiantes() {
        const res = await fetch(`${API_URL}/admin/estudiantes`, { credentials: 'include' });
        const { ok, data } = await parseResponse(res);
        if (!ok) throw new Error(data.message || 'Error al listar estudiantes');
        return data.data;
    },

    // Consulta los logs de auditoría para la consola de monitoreo de seguridad
    async getLogs() {
        const res = await fetch(`${API_URL}/admin/logs`, { credentials: 'include' });
        const { ok, data } = await parseResponse(res);
        if (!ok) throw new Error(data.message || 'Error al obtener logs');
        return data.data;
    },

    // Activa o desactiva la visibilidad de las notas de un trimestre específico
    async toggleBoletin(cedula, trimestre) {
        const res = await fetch(`${API_URL}/admin/toggle_boletin`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedula, trimestre })
        });
        const { ok, data } = await parseResponse(res);
        if (!ok) throw new Error(data.message || 'Error al cambiar estado');
        return data;
    },

    // Cambia el estatus del ciclo del alumno (Activo / Egresado)
    async cambiarEstado(cedula, estado) {
        return await fetch(`${API_URL}/admin/cambiar_estado`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedula, estado })
        });
    },

    // Inserta un documento de estudiante nuevo dentro de MongoDB
    async registrarEstudiante(studentData) {
        const res = await fetch(`${API_URL}/admin/registrar`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        const { ok, data } = await parseResponse(res);
        if (!ok) throw new Error(data.message || "Error al registrar alumno");
        return data;
    }
};