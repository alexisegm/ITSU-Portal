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
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-workspace').classList.remove('hidden');
        this.applyTheme(session.theme || 'dark');
    }
}; 