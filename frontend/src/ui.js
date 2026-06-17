import { userSession } from './config.js';
import { StudentAPI, AdminAPI, AuthAPI } from './api.js';
import { generatePDF } from './pdfGenerator.js';

let localThemeBackup = 'dark'; 

export const UI = {
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `bg-gray-900 border ${type === 'success' ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400'} p-4 rounded-xl shadow-2xl text-xs font-bold transition-all duration-300 transform scale-95 opacity-0`;
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => toast.classList.remove('scale-95', 'opacity-0'), 10);
        setTimeout(() => {
            toast.classList.add('scale-95', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    toggleRegisterModal(show) {
        document.getElementById('register-modal').classList.toggle('hidden', !show);
    },

    applyTheme(theme) {
        const body = document.body;
        const themeBtnText = document.getElementById('theme-text');
        const themeBtnIcon = document.querySelector('#btn-toggle-theme i');
        
        const elements = {
            loginCard: document.getElementById('login-card'),
            infoBox: document.getElementById('info-box'),
            infoBoxText: document.getElementById('info-box-text'),
            appHeader: document.getElementById('app-header'),
            welcomeBox: document.getElementById('welcome-box'),
            adminTableCard: document.getElementById('admin-table-card'),
            adminLogsCard: document.getElementById('admin-logs-card'),
            logsContainer: document.getElementById('logs-container'),
            tableHead: document.getElementById('table-head'),
            modalCard: document.getElementById('modal-card'),
            loginTitle: document.getElementById('login-title'),
            loginSubtitle: document.getElementById('login-subtitle')
        };

        if (theme === 'light') {
            // MODO CLARO: Usamos light-mode-bg
            body.className = "light-mode-bg text-gray-900 min-h-screen flex flex-col justify-between transition-colors duration-300";
            
            if (elements.loginCard) elements.loginCard.className = "bg-gray-50/90 backdrop-blur-md w-full max-w-md p-8 rounded-2xl border border-gray-300 shadow-xl";
            if (elements.loginTitle) elements.loginTitle.className = "text-2xl font-extrabold text-black";
            
            // Ajustes de textos y cajas en modo claro
            const subtitleBox = document.querySelector('.w-full.max-w-\\[320px\\]');
            if (subtitleBox) subtitleBox.className = "w-full max-w-[320px] p-2 bg-gray-200 rounded-lg border border-gray-400 text-center";
            
            if (elements.infoBox) elements.infoBox.className = "bg-gray-100 p-5 rounded-xl border-2 border-black text-xs space-y-3 mb-5 shadow-sm";
            if (elements.infoBoxText) {
                elements.infoBoxText.className = "text-gray-900 space-y-2";
                elements.infoBoxText.querySelectorAll('span').forEach(sp => sp.className = "font-black text-black");
                elements.infoBoxText.querySelectorAll('code').forEach(cd => cd.className = "text-blue-900 font-black bg-white px-1.5 py-0.5 rounded border border-gray-400");
            }

            if (themeBtnText) themeBtnText.innerText = "Modo Oscuro";
            if (themeBtnIcon) themeBtnIcon.setAttribute('data-lucide', 'moon');
        } else {
            // MODO OSCURO: Usamos animated-bg
            body.className = "animated-bg text-slate-100 min-h-screen flex flex-col justify-between transition-colors duration-300";
            
            if (elements.loginCard) elements.loginCard.className = "bg-gray-900/80 backdrop-blur-md w-full max-w-md p-8 rounded-2xl border border-gray-800 shadow-2xl";
            if (elements.loginTitle) elements.loginTitle.className = "text-2xl font-extrabold text-white";
            
            const subtitleBox = document.querySelector('.w-full.max-w-\\[320px\\]');
            if (subtitleBox) subtitleBox.className = "w-full max-w-[320px] p-2 bg-gray-950/30 rounded-lg border border-cyan-900/20 text-center";

            if (elements.infoBox) elements.infoBox.className = "bg-gray-950/60 p-4 rounded-xl border border-gray-800 text-xs space-y-2 mb-5";
            if (elements.infoBoxText) {
                elements.infoBoxText.className = "text-gray-400 space-y-1";
                elements.infoBoxText.querySelectorAll('span').forEach(sp => sp.className = "font-semibold text-slate-200");
                elements.infoBoxText.querySelectorAll('code').forEach(cd => cd.className = "text-cyan-300");
            }

            if (themeBtnText) themeBtnText.innerText = "Modo Claro";
            if (themeBtnIcon) themeBtnIcon.setAttribute('data-lucide', 'sun');
        }
        
        if (window.lucide) window.lucide.createIcons();
    },

    async toggleTheme() {
        const currentTheme = userSession.data ? userSession.data.theme : localThemeBackup;
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        if (userSession.data) {
            userSession.updateTheme(nextTheme);
        } else {
            localThemeBackup = nextTheme;
        }
        this.applyTheme(nextTheme);
    },

    launchWorkspace() {
        const session = userSession.data;
        const loginScreen = document.getElementById('login-screen');
        const workspace = document.getElementById('app-workspace');

        if (!loginScreen || !workspace) return;

        loginScreen.classList.add('hidden');
        workspace.classList.remove('hidden');
        this.applyTheme(session.theme || 'dark');
        console.log(`Transición exitosa. Rol detectado: ${session.role || 'Estudiante'}`);

        // Redirección basada en el rol exacto de Flask
        if (session.role === 'admin' || session.correo === 'admin@itsu.education') {
            this.loadAdminDashboard();
        } else {
            this.loadStudentDashboard(session);
        }
    },

    // NUEVA FUNCIÓN: Construye la tabla del boletín
    async loadStudentDashboard(session) {
        const workspace = document.getElementById('app-workspace');
        
        // 1. Inyectamos una estructura de carga visual (Skeleton loading)
        workspace.innerHTML = `
            <div class="flex flex-col items-center justify-center mt-20">
                <i data-lucide="loader-2" class="w-10 h-10 animate-spin text-cyan-500 mb-4"></i>
                <h2 class="text-xl text-gray-300">Cargando tu boletín académico...</h2>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();

        // ==========================================
        // MODO DEBUG: Verificando la respuesta de Flask
        // ==========================================
        console.warn("==== DATOS DE SESIÓN DESDE FLASK ====");
        console.log(session);
        
        try {
            // Ampliamos la búsqueda.
            // Dependiendo de cómo lo programaste en Python, 
            // los datos podrían estar en la raíz o dentro de un objeto 'user'.
            const usuario = session.user ? session.user : session;
            
            // Buscamos cédula, correo o el _id de MongoDB
            const identificador = usuario.cedula || usuario.correo || usuario._id || usuario.id; 
            
            console.log("Identificador final enviado a la API:", identificador);
            // ==========================================

            if (!identificador) {
                throw new Error("No se encontró la cédula o correo en la sesión. Revisa la consola.");
            }

            const boletinData = await StudentAPI.getBoletines(identificador);

            // 3. Renderizamos la interfaz (Plantilla dinámica que respeta tu Tailwind)
            const estudiante = boletinData;
            const bulletins = estudiante && estudiante.bulletins ? estudiante.bulletins : {};

            let trimestersHtml = '';
            Object.keys(bulletins).forEach(key => {
                const t = bulletins[key];
                const grades = t.grades || {};
                let gradesRows = '';
                Object.keys(grades).forEach(materia => {
                    gradesRows += `<tr class="border-b border-gray-800"><td class="px-4 py-2 text-sm text-gray-200">${materia}</td><td class="px-4 py-2 text-sm text-cyan-300">${grades[materia]}</td></tr>`;
                });

                trimestersHtml += `
                    <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-4 shadow-sm">
                        <div class="flex justify-between items-center mb-3">
                            <h3 class="text-lg font-bold text-white">${key.toUpperCase()}</h3>
                            <div class="text-sm">
                                <span class="px-2 py-1 rounded-full ${t.available ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'}">${t.available ? 'Disponible' : 'No disponible'}</span>
                            </div>
                        </div>
                        <p class="text-sm text-gray-400 mb-3">Promedio: <span class="text-cyan-300">${t.promedio || 0}</span></p>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-gray-950/80 border-b border-gray-800">
                                        <th class="px-4 py-2 text-xs font-bold text-gray-400">Materia</th>
                                        <th class="px-4 py-2 text-xs font-bold text-gray-400">Nota</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${gradesRows || '<tr><td colspan="2" class="px-4 py-6 text-gray-500 text-center">No hay calificaciones registradas.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            });

            workspace.innerHTML = `
                <div class="max-w-6xl mx-auto w-full px-4 pt-10">
                    <div class="flex justify-between items-end mb-6 border-b border-gray-700/50 pb-4">
                        <div>
                            <h2 class="text-3xl font-extrabold text-white">Mi Boletín</h2>
                            <p class="text-gray-400 mt-1">Estudiante: <span class="text-cyan-400">${estudiante.nombre || estudiante.correo}</span></p>
                        </div>
                        <div class="flex items-center gap-3">
                            <button id="btn-download-pdf" class="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 border border-gray-600 transition">
                                <i data-lucide="download" class="w-4 h-4"></i> Descargar PDF
                            </button>
                        </div>
                    </div>

                    <div class="grid gap-4">
                        ${trimestersHtml}
                    </div>
                </div>
            `;

            // Evento para descargar PDF (descarga el primer trimestre disponible por defecto)
            document.getElementById('btn-download-pdf')?.addEventListener('click', () => {
                const first = Object.keys(bulletins)[0];
                if (first) generatePDF(first);
            });
            if (window.lucide) window.lucide.createIcons();

        } catch (err) {
            workspace.innerHTML = `
                <div class="text-center mt-20">
                    <i data-lucide="alert-triangle" class="w-12 h-12 text-red-500 mx-auto mb-4"></i>
                    <h2 class="text-xl text-white">Error al cargar datos</h2>
                    <p class="text-gray-400">${err.message}</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        }
    },

    async loadAdminDashboard() {
        const workspace = document.getElementById('app-workspace');
        workspace.innerHTML = `
            <div class="flex flex-col items-center justify-center mt-20">
                <i data-lucide="loader-2" class="w-10 h-10 animate-spin text-cyan-500 mb-4"></i>
                <h2 class="text-xl text-gray-300">Cargando Panel de Administrador...</h2>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();

        try {
            // Consultamos la lista de alumnos reales de MongoDB
            const estudiantes = await AdminAPI.getEstudiantes();
            let tableRows = '';
            estudiantes.forEach(est => {
                tableRows += `
                    <tr class="border-b border-gray-800 hover:bg-gray-800/30 transition">
                        <td class="px-6 py-4 text-sm text-white font-medium">${est.nombre || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm text-cyan-400 font-mono">${est.cedula || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm text-gray-400">${est.correo || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 text-xs rounded-full ${est.estado === 'Activo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                                ${est.estado || 'Activo'}
                            </span>
                        </td>
                    </tr>
                `;
            });
            
            workspace.innerHTML = `
                <div class="max-w-6xl mx-auto w-full px-4 pt-10">
                    <div class="flex justify-between items-center mb-6 border-b border-gray-700/50 pb-4">
                        <div>
                            <h2 class="text-3xl font-extrabold text-white">Panel de Administración</h2>
                            <p class="text-gray-400 mt-1">Control de Estudiantes e Historial Académico</p>
                        </div>
                        <button id="btn-open-register" class="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-gray-950 font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition">
                            <i data-lucide="user-plus" class="w-4 h-4"></i> Registrar Estudiante
                        </button>
                    </div>

                    <div id="admin-table-card" class="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-gray-950/80 border-b border-gray-800">
                                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Nombre</th>
                                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Cédula</th>
                                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Correo</th>
                                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRows || '<tr><td colspan="4" class="text-center py-6 text-gray-500">No hay estudiantes en la base de datos.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();

        } catch (err) {
            workspace.innerHTML = `
                <div class="text-center mt-20">
                    <i data-lucide="alert-triangle" class="w-12 h-12 text-red-500 mx-auto mb-4"></i>
                    <h2 class="text-xl text-white">Error al cargar el panel de administración</h2>
                    <p class="text-gray-400">${err.message}</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        }
    }
};