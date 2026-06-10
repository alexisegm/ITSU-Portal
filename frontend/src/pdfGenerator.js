import { userSession } from './config.js';
import { StudentAPI } from './api.js';

/**
 * MÓDULO EXCLUSIVO DE DOCUMENTOS PDF
 * Toma los datos del trimestre y genera el reporte descargable.
 */
export async function generatePDF(trimestreKey) {
    try {
        // Buscamos las calificaciones actualizadas del alumno
        const bulletins = await StudentAPI.getBoletines(userSession.data.id);
        const trim = bulletins[trimestreKey];

        const { jsPDF } = window.jspdf; // Desestructuramos la librería cargada en el HTML
        const doc = new jsPDF(); // Inicializamos un lienzo PDF en blanco

        // --- CONSTRUCCIÓN DEL ENCABEZADO INSTITUCIONAL ---
        doc.setFillColor(3, 7, 18); // Color gris oscuro institucional
        doc.rect(0, 0, 210, 30, "F"); // Barra superior sólida
        doc.setTextColor(255, 255, 255); // Texto blanco
        doc.setFontSize(16); // Tamaño del título
        doc.text("INSTITUTO ITSU - BOLETÍN OFICIAL", 15, 18);

        // --- METADATOS DEL ESTUDIANTE ---
        doc.setTextColor(50, 50, 50); // Color gris oscuro para texto del cuerpo
        doc.setFontSize(11);
        doc.text(`Estudiante: ${userSession.data.name}`, 15, 45);
        doc.text(`Cédula: ${userSession.data.id}`, 15, 52);
        doc.text(`Carrera: ${userSession.data.career}`, 15, 59);
        doc.text(`Periodo: ${trimestreKey.toUpperCase()}`, 15, 66);

        // --- TABLA DE MATERIAS Y NOTAS ---
        let y = 80; // Coordenada vertical de inicio de la tabla
        doc.text("Materias", 15, y);
        doc.text("Notas", 150, y);
        doc.line(15, y + 2, 195, y + 2); // Línea divisoria
        y += 10;

        // Recorremos las materias dinámicas que vengan desde MongoDB
        Object.keys(trim.grades).forEach(materia => {
            doc.text(materia, 15, y);
            doc.text(`${trim.grades[materia]} Ptos`, 150, y);
            y += 10; // Bajamos el cursor para la siguiente fila
        });

        // Forzamos la descarga del archivo en el navegador
        doc.save(`Boletin_${trimestreKey.toUpperCase()}_${userSession.data.id}.pdf`);
    } catch (error) {
        console.error("Error al generar el documento PDF:", error);
    }
} 