# app.py
import os
from dotenv import load_dotenv

# Cargar las variables del archivo .env al sistema
load_dotenv()
from flask import Flask, request, jsonify, session
from flask_pymongo import PyMongo
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime

app = Flask(__name__, static_folder='../frontend', static_url_path='')

# Configuración crítica desde variables de entorno
# Usa un `SECRET_KEY` desde .env; si no existe, se deja un valor por defecto (solo para desarrollo)
app.secret_key = os.getenv('SECRET_KEY', 'dev_secret_key_itsu_2026')

# Seguridad de cookies de sesión
use_production = os.getenv('FLASK_ENV', 'development') == 'production'
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=use_production,
    SESSION_COOKIE_SAMESITE='None' if use_production else 'Lax'
)

# Permite que el HTML/JS de tu compañera consuma esta API sin bloqueos de seguridad de red (CORS)
CORS(app, supports_credentials=True, origins=[
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
])

# CONFIGURACIÓN DE INFRAESTRUCTURA (REEMPLAZA CON TU URI DE ATLAS)
# Nota: Añadimos '/itsu_portal' al final de la ruta para indicarle a Flask la BD exacta
raw_uri = os.getenv('MONGO_URI')
if not raw_uri:
    raise RuntimeError('La variable de entorno MONGO_URI no está definida. Por favor configúrala en .env')
clean_uri = raw_uri.rstrip('/')
app.config["MONGO_URI"] = f"{clean_uri}/itsu_portal?retryWrites=true&w=majority"
mongo = PyMongo(app)

# Función modular para registrar las acciones en la colección de auditoría
def registrar_log(usuario, accion, tipo="info"):
    try:
        mongo.db.logs_auditoria.insert_one({
            "usuario": usuario,
            "accion": accion,
            "fecha_hora": datetime.utcnow(),
            "tipo": tipo,
            "ip_origen": request.remote_addr or 'unknown'
        })
    except Exception:
        # No queremos que un fallo en el logger detenga la API
        pass

# ==========================================
# ENDPOINTS DE LA API (RESPUESTAS JSON)
# ==========================================

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    correo = data.get('correo', '').strip().lower()
    contrasena = data.get('contrasena', '')

    # 1. Login exclusivo del Administrador/Auditor (credenciales desde .env)
    admin_email = os.getenv('ADMIN_EMAIL', 'admin@itsu.education')
    admin_password = os.getenv('ADMIN_PASSWORD', 'admin')
    if correo == admin_email and contrasena == admin_password:
        session['user'] = admin_email
        session['role'] = 'admin'
        registrar_log(admin_email, 'Inició sesión como ADMINISTRADOR', 'info')
        return jsonify({"success": True, "role": "admin", "data": {"correo": admin_email}})

    # 2. Login de Estudiantes (Validación contra base de datos cifrada)
    estudiante = mongo.db.estudiantes.find_one({"correo": correo})

    if estudiante and check_password_hash(estudiante.get('contrasena', ''), contrasena):
        if estudiante.get('estado') != "activo":
            return jsonify({"success": False, "message": "Acceso denegado. Ciclo escolar finalizado o cuenta inactiva."}), 403

        session['user'] = estudiante['correo']
        session['role'] = "estudiante"
        session['cedula'] = estudiante.get('cedula')
        registrar_log(estudiante.get('nombre', estudiante.get('correo')), "Inició sesión en el portal de boletines", "info")
        # Devolver algunos campos del perfil para que el frontend pueda inicializar la sesión
        perfil = {
            "correo": estudiante.get('correo'),
            "cedula": estudiante.get('cedula'),
            "nombre": estudiante.get('nombre'),
            "estado": estudiante.get('estado')
        }
        return jsonify({"success": True, "role": "estudiante", "data": perfil})

    return jsonify({"success": False, "message": "Credenciales incorrectas"}), 401

@app.route('/api/estudiante/boletin', methods=['GET'])
def obtener_boletin():
    if 'user' not in session or session.get('role') != 'estudiante':
        return jsonify({"success": False, "message": "No autorizado"}), 401
    estudiante = mongo.db.estudiantes.find_one({"cedula": session.get('cedula')}, {"contrasena": 0, "_id": 0})
    if not estudiante:
        return jsonify({"success": False, "message": "Estudiante no encontrado"}), 404
    return jsonify({"success": True, "data": estudiante})

@app.route('/api/admin/estudiantes', methods=['GET'])
def listar_estudiantes():
    if 'user' not in session or session.get('role') != 'admin':
        return jsonify({"success": False, "message": "No autorizado"}), 401

    estudiantes_cursor = mongo.db.estudiantes.find({}, {"contrasena": 0, "_id": 0})
    return jsonify({"success": True, "data": list(estudiantes_cursor)})

@app.route('/api/admin/toggle_boletin', methods=['POST'])
def toggle_boletin():
    if 'user' not in session or session.get('role') != 'admin':
        return jsonify({"success": False, "message": "No autorizado"}), 401

    data = request.json
    cedula = data.get('cedula')
    trimestre = data.get('trimestre') # Recibe 't1', 't2', etc.

    estudiante = mongo.db.estudiantes.find_one({"cedula": cedula})
    if not estudiante:
        return jsonify({"success": False, "message": "Estudiante no encontrado"}), 404

    bulletins = estudiante.get('bulletins', {})
    if trimestre not in bulletins:
        return jsonify({"success": False, "message": "Trimestre inválido"}), 400

    estado_actual = bool(bulletins[trimestre].get('available', False))
    nuevo_estado = not estado_actual

    mongo.db.estudiantes.update_one(
        {"cedula": cedula},
        {"$set": {f"bulletins.{trimestre}.available": nuevo_estado}}
    )

    registrar_log("Administrador", f"Modificó visibilidad del {trimestre.upper()} para {estudiante.get('nombre', cedula)}", "warning")
    return jsonify({"success": True, "nuevo_estado": nuevo_estado})


@app.route('/api/admin/registrar', methods=['POST'])
def registrar_estudiante():
    if 'user' not in session or session.get('role') != 'admin':
        return jsonify({"success": False, "message": "No autorizado"}), 401

    data = request.json or {}
    cedula = data.get('cedula')
    correo = data.get('correo')
    nombre = data.get('nombre')
    carrera = data.get('career') or data.get('carrera')

    if not (cedula and correo and nombre):
        return jsonify({"success": False, "message": "Faltan campos requeridos"}), 400

    existing = mongo.db.estudiantes.find_one({"cedula": cedula})
    if existing:
        return jsonify({"success": False, "message": "Estudiante ya existente"}), 409

    default_password = os.getenv('DEFAULT_STUDENT_PASSWORD', 'itsu2026')
    hashed = generate_password_hash(default_password)

    plantilla_bulletins = {
        "t1": {"available": False, "promedio": 0, "grades": {}},
        "t2": {"available": False, "promedio": 0, "grades": {}},
        "t3": {"available": False, "promedio": 0, "grades": {}},
        "t4": {"available": False, "promedio": 0, "grades": {}}
    }

    nuevo = {
        "cedula": cedula,
        "nombre": nombre,
        "correo": correo,
        "carrera": carrera,
        "contrasena": hashed,
        "estado": "activo",
        "bulletins": plantilla_bulletins
    }

    mongo.db.estudiantes.insert_one(nuevo)
    registrar_log(session.get('user', 'Administrador'), f"Registró al estudiante {nombre}", "info")
    # No devolvemos la contraseña ni campos sensibles
    nuevo.pop('contrasena', None)
    return jsonify({"success": True, "data": nuevo})


@app.route('/api/admin/cambiar_estado', methods=['POST'])
def cambiar_estado():
    if 'user' not in session or session.get('role') != 'admin':
        return jsonify({"success": False, "message": "No autorizado"}), 401

    data = request.json or {}
    cedula = data.get('cedula')
    estado = data.get('estado')
    if not cedula or not estado:
        return jsonify({"success": False, "message": "Faltan campos"}), 400

    res = mongo.db.estudiantes.update_one({"cedula": cedula}, {"$set": {"estado": estado}})
    if res.matched_count == 0:
        return jsonify({"success": False, "message": "Estudiante no encontrado"}), 404

    registrar_log(session.get('user', 'Administrador'), f"Cambiado estado de {cedula} a {estado}", "warning")
    return jsonify({"success": True})

@app.route('/api/admin/logs', methods=['GET'])
def obtener_logs():
    if 'user' not in session or session.get('role') != 'admin':
        return jsonify({"success": False, "message": "No autorizado"}), 401

    logs_cursor = mongo.db.logs_auditoria.find({}, {"_id": 0}).sort("fecha_hora", -1).limit(30)
    return jsonify({"success": True, "data": list(logs_cursor)})

@app.route('/api/logout', methods=['POST'])
def logout():
    usuario = session.get('user', 'Desconocido')
    registrar_log(usuario, "Cerró sesión de forma segura")
    session.clear()
    return jsonify({"success": True})

@app.route('/')
def index():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    # Ejecuta el servidor local en el puerto definido por la variable de entorno (por defecto 5000)
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() in ('1', 'true', 'yes')
    port = int(os.getenv('PORT', '5000'))
    app.run(debug=debug_mode, port=port)