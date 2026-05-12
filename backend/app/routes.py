from flask import Blueprint, jsonify, request, current_app, Response
import mysql.connector
import html
import logging
from twilio.twiml.messaging_response import MessagingResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

main = Blueprint('main', __name__)

def get_db():
    conn = mysql.connector.connect(
        host=current_app.config['DB_HOST'],
        port=current_app.config['DB_PORT'],
        user=current_app.config['DB_USER'],
        password=current_app.config['DB_PASSWORD'],
        database=current_app.config['DB_NAME'],
        ssl_disabled=False
    )
    return conn

# ── EMPLEADOS ──────────────────────────────────────────────

@main.route('/empleados', methods=['GET'])
def get_empleados():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    # Usamos LEFT JOIN por si hay datos nulos, para que no desaparezcan de la tabla
    cursor.execute("""
        SELECT e.id_empleado, e.nombre, p.descripcion AS puesto,
               e.id_tienda, t.nombre AS tienda, s.descripcion AS status,
               e.id_supervisor, e.telefono, e.fecha_inicio
        FROM empleado e
        LEFT JOIN puesto p ON e.id_puesto = p.id_puesto
        LEFT JOIN tienda t ON e.id_tienda = t.id_tienda
        LEFT JOIN status_em s ON e.id_status = s.id_status
        ORDER BY e.id_empleado DESC
    """)
    empleados = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(empleados)

# ── REGISTROS ──────────────────────────────────────────────

@main.route('/registros', methods=['GET'])
def get_registros():
    """
    Obtiene registros/resumen de asistencia con soporte para múltiples vistas.
    Soporta parámetros: fecha, mes, semana
    """
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    fecha = request.args.get('fecha')  # Formato: YYYY-MM-DD
    mes = request.args.get('mes')      # Formato: YYYY-MM
    semana = request.args.get('semana')  # Número de semana (1-4)
    
    query = """
        SELECT e.nombre, r.fecha,
               TIME_FORMAT(r.hora_entrada, '%H:%i') AS entrada,
               TIME_FORMAT(r.hora_salida, '%H:%i') AS salida,
               CONCAT(FLOOR(r.horas_trabajadas), 'h ', 
                      ROUND((r.horas_trabajadas % 1) * 60), 'm') AS total,
               sd.descripcion AS status
        FROM resumen r
        JOIN empleado e ON r.id_empleado = e.id_empleado
        LEFT JOIN status_dia sd ON r.id_status_dia = sd.id_status_dia
        WHERE 1=1
    """
    
    # Filtro por fecha específica
    if fecha:
        from datetime import datetime
        try:
            datetime.strptime(fecha, '%Y-%m-%d')
            query += f" AND r.fecha = '{fecha}'"
        except ValueError:
            pass
    
    # Filtro por mes
    if mes:
        query += f" AND DATE_FORMAT(r.fecha, '%Y-%m') = '{mes}'"

    # Si no hay filtro específico, mostrar hoy
    if not fecha and not mes:
        query += " AND r.fecha = CURDATE()"

    query += " ORDER BY e.nombre"

    cursor.execute(query)
    registros = cursor.fetchall()
    cursor.close()
    conn.close()

    # Filtro por semana en Python para evitar problemas de SQL muy pesados
    if mes and semana:
        try:
            semana_num = int(semana)
            registros_semana = []
            for reg in registros:
                dia = int(reg['fecha'].day)
                semana_actual = (dia - 1) // 7 + 1
                if semana_actual == semana_num:
                    registros_semana.append(reg)
            return jsonify(registros_semana)
        except Exception as e:
            print(f"Error filtrando semana: {e}")
            return jsonify([])

    return jsonify(registros)

@main.route('/registros/hoy', methods=['GET'])
def get_registros_hoy():
    """Alias para /registros sin parámetros"""
    return get_registros()

# ── RESUMEN ────────────────────────────────────────────────

@main.route('/resumen/hoy', methods=['GET'])
def get_resumen_hoy():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT r.id_resumen, e.nombre, r.fecha,
               TIME_FORMAT(r.hora_entrada, '%H:%i') AS entrada,
               TIME_FORMAT(r.hora_salida, '%H:%i') AS salida,
               CONCAT(FLOOR(r.horas_trabajadas), 'h ', 
                      ROUND((r.horas_trabajadas % 1) * 60), 'm') AS total,
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
    """
    Webhook para recibir mensajes de WhatsApp via Twilio.
    Retorna respuesta en formato TwiML válido.
    """
    try:
        datos = request.form
        telefono = datos.get('From', '').replace('whatsapp:', '')
        mensaje = datos.get('Body', '').strip()
        
        logger.info(f"[WEBHOOK] Mensaje recibido de {telefono}: {mensaje}")
        
        # Importar y procesar el mensaje
        try:
            from app.bot import procesar_mensaje
            respuesta = procesar_mensaje(telefono, mensaje)
        except ImportError as ie:
            logger.error(f"[WEBHOOK] Error importando bot: {ie}")
            respuesta = "Sistema en mantenimiento. Intenta mas tarde."
        except Exception as e:
            logger.error(f"[WEBHOOK] Error procesando mensaje: {e}", exc_info=True)
            respuesta = "Error al procesar tu solicitud."
        
        if respuesta is None:
            respuesta = "Solicitud procesada."
        
        logger.info(f"[WEBHOOK] Respondiendo: {respuesta}")
        
        # Crear respuesta TwiML utilizando la librería oficial de Twilio
        twiml_response = MessagingResponse()
        twiml_response.message(str(respuesta))
        
        # Retornar con el Content-Type correcto
        return Response(str(twiml_response), mimetype='application/xml')
        
    except Exception as e:
        logger.error(f"[WEBHOOK] Error crítico: {e}", exc_info=True)
        # Retornar error en formato TwiML
        error_response = MessagingResponse()
        error_response.message("Error del sistema. Intenta de nuevo.")
        return Response(str(error_response), mimetype='application/xml')

# ── TEST WEBHOOK ──────────────────────────────────────────

@main.route('/bot/test', methods=['GET', 'POST'])
def test_webhook():
    """Endpoint de prueba para verificar que el webhook recibe requests"""
    logger.info(f"[TEST] Request recibido: {request.method}")
    logger.info(f"[TEST] Datos: {request.form if request.form else request.json}")
    
    xml_test = '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Bot funcionando correctamente</Message></Response>'
    return xml_test, 200, {'Content-Type': 'text/xml'}

# ── HEALTH CHECK ───────────────────────────────────────────

@main.route('/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'ok', 'mensaje': 'Backend funcionando'})

# ── CRUD DE EMPLEADOS (CREAR Y ACTUALIZAR) ─────────────────

@main.route('/empleados', methods=['POST'])
def gestionar_empleado():
    try:
        data = request.json
        accion = data.get('accion', 'crear') # Por defecto crea
        conn = get_db()
        cursor = conn.cursor()
        
        # 1. Traducir puesto
        cursor.execute("SELECT id_puesto FROM puesto WHERE descripcion = %s", (data['puesto'],))
        res_puesto = cursor.fetchone()
        id_puesto = res_puesto[0] if res_puesto else 1 
        
        # 2. Status y Fechas
        fecha_fin = data.get('salida') if data.get('salida') else None
        id_status = 1 if data.get('status') == 'Activo' else 2 

        if accion == 'editar':
            # --- LÓGICA DE ACTUALIZACIÓN ---
            query = """
                UPDATE empleado 
                SET nombre=%s, id_puesto=%s, id_supervisor=%s, id_status=%s, 
                    telefono=%s, fecha_inicio=%s, fecha_fin=%s, id_tienda=%s
                WHERE id_empleado=%s
            """
            valores = (
                data['nombre'], id_puesto, data.get('id_supervisor'), 
                id_status, data['telefono'], data['ingreso'], 
                fecha_fin, data.get('id_tienda'), data.get('id_empleado')
            )
        else:
            # --- LÓGICA DE CREACIÓN (INSERT) ---
            query = """
                INSERT INTO empleado 
                (nombre, id_puesto, id_supervisor, id_status, telefono, fecha_inicio, fecha_fin, id_tienda) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            valores = (
                data['nombre'], id_puesto, data.get('id_supervisor'), 
                id_status, data['telefono'], data['ingreso'], 
                fecha_fin, data.get('id_tienda')
            )
        
        cursor.execute(query, valores)
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": f"Éxito al {accion}"}), 201
    except Exception as e:
        print("Error gestionando empleado:", e)
        return jsonify({"error": str(e)}), 500

# ── CRUD DE EMPLEADOS (BORRADO LÓGICO) ─────────────────────

@main.route('/empleados/<int:id>', methods=['DELETE'])
def eliminar_empleado(id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # En lugar de hacer un DELETE real que borre el historial,
        # hacemos un UPDATE para pasarlo a Inactivo (id_status = 2) y marcar su salida hoy.
        query = "UPDATE empleado SET id_status = 2, fecha_fin = CURDATE() WHERE id_empleado = %s"
        cursor.execute(query, (id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Empleado dado de baja exitosamente"}), 200
    except Exception as e:
        print("Error eliminando empleado:", e)
        return jsonify({"error": str(e)}), 500