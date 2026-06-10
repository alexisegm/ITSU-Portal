// La dirección IP local donde el servidor Flask de tu compañero se queda escuchando peticiones
export const API_URL = "http://localhost:5000/api";

/**
 * Objeto de estado global para la sesión del usuario.
 * Guarda los datos del perfil del alumno o administrador mientras la aplicación esté abierta.
 */
export let userSession = {
    data: null, // Guardará el JSON del perfil (ej: { id: "V-20123456", name: "Juan", role: "student", theme: "dark" })

    // Guarda los datos del usuario cuando pasa el Login con éxito
    setSession(newData) {
        this.data = newData;
    },

    // Actualiza únicamente la preferencia de color en la sesión actual
    updateTheme(newTheme) {
        if (this.data) {
            this.data.theme = newTheme;
        }
    },

    // Borra todo rastro de datos al cerrar sesión
    clear() {
        this.data = null;
    }
}; 