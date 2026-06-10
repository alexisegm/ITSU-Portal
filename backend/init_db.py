# init_db.py
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
import datetime
import os
from dotenv import load_dotenv

load_dotenv()
# 1. Conexión al servidor de MongoDB Atlas (La Nube)
# Reemplaza el texto entre comillas con tu URI real de Atlas
# 1. Conexión al servidor de MongoDB Atlas (La Nube) de forma segura
URI_ATLAS = os.getenv("MONGO_URI")
client = MongoClient(URI_ATLAS)
db = client["itsu_portal"]

# 2. Limpieza de colecciones previas (Evita duplicados si ejecutas el script varias veces)
db.estudiantes.drop()
db.logs_auditoria.drop()

# 3. Estructura base para el Trimestre 2 (Materias en curso, notas en 0, no disponible aún)
materias_t2 = {
    "Programación Orientada a Objetos con Python": 0,
    "Desarrollo Web Frontend Esencial": 0,
    "Base de Datos (relacionales y no relacionales)": 0
}

# 4. Documentos con los datos oficiales y reales del equipo
estudiantes_oficiales = [
    {
        "cedula": "V-32554575",
        "nombre": "Yeneily Nohemy Seijas Martínez",
        "correo": "yeneily@itsu.education",
        "carrera": "Desarrollador Web y Aplicaciones Móviles",
        "contrasena": generate_password_hash("itsu2026"),
        "estado": "activo",
        "bulletins": {
            "t1": {
                "available": True,
                "promedio": 19,
                "grades": {
                    "Programación Fundamental con Python": 19,
                    "Fundamentos de Hardware y Redes": 20,
                    "Inteligencia Artificial Generativa": 18,
                    "Fundamentos de sistemas y entornos de desarrollo": 17,
                    "Proyecto final Integral (App de Sistema de riego automatizado)": 20
                }
            },
            "t2": {"available": False, "promedio": 0, "grades": materias_t2},
            "t3": {"available": False, "promedio": 0, "grades": {}},
            "t4": {"available": False, "promedio": 0, "grades": {}}
        }
    },
    {
        "cedula": "V-29640288",
        "nombre": "Ana Alexandra Anselmi Pallares",
        "correo": "ana@itsu.education",
        "carrera": "Desarrollador Web y Aplicaciones Móviles",
        "contrasena": generate_password_hash("itsu2026"),
        "estado": "activo",
        "bulletins": {
            "t1": {
                "available": True,
                "promedio": 19,
                "grades": {
                    "Programación Fundamental con Python": 19,
                    "Fundamentos de Hardware y Redes": 20,
                    "Inteligencia Artificial Generativa": 18,
                    "Fundamentos de sistemas y entornos de desarrollo": 18,
                    "Proyecto final Integral (App de Sistema de riego automatizado)": 20
                }
            },
            "t2": {"available": False, "promedio": 0, "grades": materias_t2},
            "t3": {"available": False, "promedio": 0, "grades": {}},
            "t4": {"available": False, "promedio": 0, "grades": {}}
        }
    },
    {
        "cedula": "V-21622104",
        "nombre": "Alexis Eduardo González Martínez",
        "correo": "alexis@itsu.education",
        "carrera": "Desarrollador Web y Aplicaciones Móviles",
        "contrasena": generate_password_hash("itsu2026"),
        "estado": "activo",
        "bulletins": {
            "t1": {
                "available": True,
                "promedio": 19,
                "grades": {
                    "Programación Fundamental con Python": 19,
                    "Fundamentos de Hardware y Redes": 20,
                    "Inteligencia Artificial Generativa": 18,
                    "Fundamentos de sistemas y entornos de desarrollo": 17,
                    "Proyecto final Integral (App de Sistema de riego automatizado)": 20
                }
            },
            "t2": {"available": False, "promedio": 0, "grades": materias_t2},
            "t3": {"available": False, "promedio": 0, "grades": {}},
            "t4": {"available": False, "promedio": 0, "grades": {}}
        }
    }
]

# 5. Inserción de documentos en la colección 'estudiantes'
db.estudiantes.insert_many(estudiantes_oficiales)

# 6. Registro del Log de Auditoría
db.logs_auditoria.insert_one({
    "usuario": "Sistema Backend",
    "accion": "Inicialización de base de datos y carga de notas oficiales T1 en MongoDB Atlas",
    "fecha_hora": datetime.datetime.utcnow(),
    "tipo": "info",
    "ip_origen": "Cloud"
})

print("--> ¡Base de datos 'itsu_portal' poblada e inicializada con éxito en la nube! <--")