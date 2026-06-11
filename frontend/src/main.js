import { userSession } from './config.js';
import { AuthAPI, AdminAPI } from './api.js';
import { UI } from './ui.js';

// ==========================================
// FUNCIÓN INYECTORA
// ==========================================
async function loadComponent(id, file) {
    try {
        const res = await fetch(file);
        if (!res.ok) throw new Error(`No se pudo cargar ${file}`);
        document.getElementById(id).innerHTML = await res.text();
    } catch (err) {
        console.error("Error al cargar componente:", err);
    }
}

// ==========================================
// CONTROLADORES
// ==========================================
async function onLoginSubmit(e) {
    e.preventDefault();
    const correo = document.getElementById('login-email').value;
    const contrasena = document.getElementById('login-password').value;
    try {
        const data = await AuthAPI.login(correo, contrasena);
        // NUEVO: Como Flask solo devuelve {success: true, role: "..."}, 
        // inyectamos manualmente el correo capturado del formulario
        // para que la SPA sepa a quién le pertenecen los boletines.
        data.correo = correo; 
        
        userSession.setSession(data);
        UI.showToast("Acceso correcto", "success");
        UI.launchWorkspace();
    } catch (err) {
        UI.showToast(err.message, "error");
    }
}

async function onRegisterStudentSubmit(e) {
    e.preventDefault();
    const studentData = {
        nombre: document.getElementById('reg-name').value,
        cedula: document.getElementById('reg-id').value,
        correo: document.getElementById('reg-email').value,
        career: document.getElementById('reg-career').value
    };
    try {
        await AdminAPI.registrarEstudiante(studentData);
        UI.showToast("Alumno guardado", "success");
        UI.toggleRegisterModal(false);
        document.getElementById('register-student-form').reset();
        UI.loadAdminDashboard();
    } catch (err) {
        UI.showToast(err.message, "error");
    }
}

// ==========================================
// DELEGACIÓN CENTRAL DE EVENTOS (A PRUEBA DE FALLOS)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar componentes: header, modal Y FOOTER
    await Promise.all([
        loadComponent('header-container', 'components/header.html'),
        loadComponent('modal-container', 'components/modal.html'),
        loadComponent('footer-container', 'components/footer.html')
    ]);

    // 2. Inicializar iconos una vez cargado el HTML (necesario para los iconos que inyectamos)
    if (window.lucide) window.lucide.createIcons();

    // 3. Delegación de eventos en el body: captura TODO sin importar cuándo se cargó el elemento
    document.body.addEventListener('submit', (e) => {
        if (e.target.id === 'login-form') onLoginSubmit(e);
        if (e.target.id === 'register-student-form') onRegisterStudentSubmit(e);
    });

    document.body.addEventListener('click', (e) => {
        // Manejo de botones de navegación y temas
        if (e.target.id === 'btn-logout') {
            AuthAPI.logout().then(() => location.reload());
        }
        if (e.target.id === 'btn-open-register') UI.toggleRegisterModal(true);
        if (e.target.id === 'btn-close-register') UI.toggleRegisterModal(false);
        
        // .closest permite detectar el clic incluso si el usuario presiona el icono dentro del botón
        if (e.target.closest('#btn-toggle-theme')) UI.toggleTheme();
    });
});

// Añade esto al principio de tu main.js
import { ParticleSystem } from './particles.js';

// Añade esto donde inicializas tus otras funciones
document.addEventListener('DOMContentLoaded', () => {
    ParticleSystem.init();
    // ... tus otras funciones de inicio (como la del tema o login)
});