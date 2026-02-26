from flask import Blueprint, jsonify, request, current_app
import mysql.connector

main = Blueprint('main', __name__)

def get_db():
    conn = mysql.connector.connect(
        host=current_app.config['DB_HOST'],
        port=current_app.config['DB_PORT'],
        user=current_app.config['DB_USER'],
        password=current_app.config['DB_PASSWORD'],
        database=current_app.config['DB_NAME']
    )
    return conn

# ── EMPLEADOS ──────────────────────────────────────────────

@main.route('/empleados', methods=['GET'])
def get_empleados():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT e.id_empleado, e.nombre, p.descripcion AS puesto,
               t.nombre AS tienda, s.descripcion AS status,
               e.telefono, e.fecha_inicio
        FROM empleado e
        JOIN puesto p ON e.id_puesto = p.id_puesto
        JOIN tienda t ON e.id_tienda = t.id_tienda
        JOIN status_em s ON e.id_status = s.id_status
        ORDER BY e.nombre
    """)
    empleados = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(empleados)

@main.route('/empleados/<int:id>', methods=['GET'])
def get_empleado(id):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT e.*, p.descripcion AS puesto,
               t.nombre AS tienda, s.descripcion AS status
        FROM empleado e
        JOIN puesto p ON e.id_puesto = p.id_puesto
        JOIN tienda t ON e.id_tienda = t.id_tienda
        JOIN status_em s ON e.id_status = s.id_status
        WHERE e.id_empleado = %s
    """, (id,))
    empleado = cursor.fetchone()
    cursor.close()
    conn.close()
    if not empleado:
        return jsonify({'error': 'Empleado no encontrado'}), 404
    return jsonify(empleado)

# ── REGISTROS ──────────────────────────────────────────────

@main.route('/registros/hoy', methods=['GET'])
def get_registros_hoy():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT r.id_registro, e.nombre, ev.descripcion AS evento,
               r.fecha_hora, r.telefono_origen
        FROM registro r
        JOIN empleado e ON r.id_empleado = e.id_empleado
        JOIN evento ev ON r.id_evento = ev.id_evento
        WHERE DATE(r.fecha_hora) = CURDATE()
        ORDER BY r.fecha_hora DESC
    """)
    registros = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(registros)

# ── RESUMEN ────────────────────────────────────────────────

@main.route('/resumen/hoy', methods=['GET'])
def get_resumen_hoy():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT r.id_resumen, e.nombre, r.fecha,
               r.hora_entrada, r.hora_salida,
               r.horas_trabajadas, r.dias_trabajados,
               sd.descripcion AS status_dia, sd.color
        FROM resumen r
        JOIN empleado e ON r.id_empleado = e.id_empleado
        LEFT JOIN status_dia sd ON r.id_status_dia = sd.id_status_dia
        WHERE r.fecha = CURDATE()
        ORDER BY e.nombre
    """)
    resumen = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(resumen)

# ── WEBHOOK BOT WHATSAPP ───────────────────────────────────

@main.route('/bot/webhook', methods=['POST'])
def webhook():
    from app.bot import procesar_mensaje
    datos = request.form
    telefono = datos.get('From', '').replace('whatsapp:', '')
    mensaje  = datos.get('Body', '').strip()
    respuesta = procesar_mensaje(telefono, mensaje)
    return f"""
    <Response>
        <Message>{respuesta}</Message>
    </Response>
    """, 200, {'Content-Type': 'text/xml'}

# ── HEALTH CHECK ───────────────────────────────────────────

@main.route('/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'ok', 'mensaje': 'Backend funcionando'})