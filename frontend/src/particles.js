/* --- Reemplaza el contenido de particles.js --- */
export const ParticleSystem = {
    init() {
        const container = document.getElementById('particles-container');
        // Iconos con estilo de línea (más nítidos)
        const icons = ['⬡', '{…}', '⎅', '☤', '⚡', '💻']; 
        
        setInterval(() => {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + 'vw';
            // Variar el tiempo de subida
            p.style.animationDuration = (Math.random() * 6 + 6) + 's';
            // NUEVO: Color blanco puro para mayor brillo
            p.style.color = 'rgba(255, 255, 255, 0.8)';
            p.innerText = icons[Math.floor(Math.random() * icons.length)];
            container.appendChild(p);
            
            // Eliminar elemento después de que termine la animación
            setTimeout(() => p.remove(), 12000);
        }, 600); // AUMENTADO: Generar partículas más rápido
    }
}; 