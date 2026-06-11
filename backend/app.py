# app.py
import os
from dotenv import load_dotenv

# Cargar las variables del archivo .env al sistema
load_dotenv()
from flask import Flask, request, jsonify, session
from flask_pymongo import PyMongo
from flask_cors import CORS
from werkzeug.security import check_password_hash
from datetime import datetime

app = Flask(__name__)
# Llave para encriptar las sesiones de los estudiantes en las cookies del navegador
app.secret_key = "clave_secreta_itsu_2026"

# Permite que el HTML/JS de tu compañera consuma esta API sin bloqueos de seguridad de red (CORS)
CORS(app, supports_credentials=True)

app.config.update(
    SESSION_COOKIE_SAMESITE='None',
    # Ponlo en False si estás probando localmente en HTTP sin certificado SSL.
    # Cámbialo a True obligatoriamente al desplegar en producción con HTTPS (Render, AWS, Railway, etc.)
    SESSION_COOKIE_SECURE=os.getenv('FLASK_ENV') == 'production' 
)

# CONFIGURACIÓN DE INFRAESTRUCTURA (REEMPLAZA CON TU URI DE ATLAS)
# Nota: Añadimos '/itsu_portal' al final de la ruta para indicarle a Flask la BD exacta
app.config["MONGO_URI"] = f"{os.getenv('MONGO_URI')}itsu_portal?retryWrites=true&w=majority"
mongo = PyMongo(app)

# Función modular para registrar las acciones en la colección de auditoría
def registrar_log(usuario, accion, tipo="info"):
    mongo.db.logs_auditoria.insert_one({
        "usuario": usuario,
        "accion": accion,
        "fecha_hora": datetime.utcnow(),
        "tipo": tipo,
        "ip_origen": request.remote_addr
    })

# ==========================================
# ENDPOINTS DE LA API (RESPUESTAS JSON)
# ==========================================

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    correo = data.get('correo', '').strip().lower()
    contrasena = data.get('contrasena', '')

    # 1. Login exclusivo del Administrador/Auditor
    if correo == "admin@itsu.education" and contrasena == "admin":
        session['user'] = "admin@itsu.education"
        session['role'] = "admin"
        registrar_log("admin@itsu.education", "Inició sesión como ADMINISTRADOR", "info")
        return jsonify({"success": True, "role": "admin"})

    # 2. Login de Estudiantes (Validación contra base de datos cifrada)
    estudiante = mongo.db.estudiantes.find_one({"correo": correo})
    
    if estudiante and check_password_hash(estudiante['contrasena'], contrasena):
        if estudiante['estado'] != "activo":
            return jsonify({"success": False, "message": "Acceso denegado. Ciclo escolar finalizado o cuenta inactiva."}), 403
            
        session['user'] = estudiante['correo']
        session['role'] = "estudiante"
        session['cedula'] = estudiante['cedula']
        registrar_log(estudiante['nombre'], "Inició sesión en el portal de boletines", "info")
        return jsonify({"success": True, "role": "estudiante"})

    return jsonify({"success": False, "message": "Credenciales incorrectas"}), 401

@app.route('/api/estudiante/boletin', methods=['GET'])
def obtener_boletin():
    if 'user' not in session or session.get('role') != 'estudiante':
        return jsonify({"success": False, "message": "No autorizado"}), 401

    estudiante = mongo.db.estudiantes.find_one({"cedula": session.get('cedula')}, {"contrasena": 0, "_id": 0})
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

    estado_actual = estudiante['bulletins'][trimestre]['available']
    nuevo_estado = not estado_actual
    
    mongo.db.estudiantes.update_one(
        {"cedula": cedula},
        {"$set": {f"bulletins.{trimestre}.available": nuevo_estado}}
    )
    
    registrar_log("Administrador", f"Modificó visibilidad del {trimestre.upper()} para {estudiante['nombre']}", "warning")
    return jsonify({"success": True, "nuevo_estado": nuevo_estado})

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

if __name__ == '__main__':
    # Ejecuta el servidor local en el puerto 5000 listo para recibir peticiones del frontend
    app.run(debug=True, port=5000)
