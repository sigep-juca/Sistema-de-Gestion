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
 
    # Usamos LEFT JOIN para traer los datos descriptivos de cada empleado
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

# ── NÓMINA (NUEVA RUTA CON DATOS REALES DE BANCARIO) ─────────

@main.route('/nomina_real', methods=['GET'])
def get_nomina_real():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Esta consulta une al empleado con su sueldo real en la tabla bancario
        query = """
            SELECT 
                e.id_empleado as id, 
                e.nombre, 
                b.salario as salario_fijo
            FROM empleado e
            JOIN bancario b ON e.id_empleado = b.id_empleado
            WHERE e.id_status = 1
        """
        
        cursor.execute(query)
        nomina = cursor.fetchall()
        
        # Calculamos el pago quincenal antes de enviar al frontend
        for emp in nomina:
            # Si el salario es nulo en la BD, lo manejamos como 0 para evitar errores
            salario = emp['salario_fijo'] if emp['salario_fijo'] is not None else 0
            emp['pago_quincenal'] = salario / 2
            
        cursor.close()
        conn.close()
        return jsonify(nomina)
    except Exception as e:
        logger.error(f"Error consultando nomina: {e}")
        return jsonify({"error": str(e)}), 500

# ── REGISTROS ──────────────────────────────────────────────

@main.route('/registros', methods=['GET'])
def get_registros():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    fecha = request.args.get('fecha')
    mes = request.args.get('mes')
    semana = request.args.get('semana')
    
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
    
    if fecha:
        query += f" AND r.fecha = '{fecha}'"
    if mes:
        query += f" AND DATE_FORMAT(r.fecha, '%Y-%m') = '{mes}'"
    if not fecha and not mes:
        query += " AND r.fecha = CURDATE()"

    query += " ORDER BY e.nombre"
    cursor.execute(query)
    registros = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(registros)

# ── WEBHOOK BOT WHATSAPP ───────────────────────────────────

@main.route('/bot/webhook', methods=['POST'])
def webhook():
    try:
        datos = request.form
        telefono = datos.get('From', '').replace('whatsapp:', '')
        mensaje = datos.get('Body', '').strip()
        
        logger.info(f"[WEBHOOK] Mensaje recibido de {telefono}: {mensaje}")
        
        try:
            from app.bot import procesar_mensaje
            respuesta = procesar_mensaje(telefono, mensaje)
        except Exception as e:
            logger.error(f"[WEBHOOK] Error procesando mensaje: {e}")
            respuesta = "Error al procesar tu solicitud."
        
        twiml_response = MessagingResponse()
        twiml_response.message(str(respuesta))
        return Response(str(twiml_response), mimetype='application/xml')
        
    except Exception as e:
        logger.error(f"[WEBHOOK] Error crítico: {e}")
        error_response = MessagingResponse()
        error_response.message("Error del sistema. Intenta de nuevo.")
        return Response(str(error_response), mimetype='application/xml')

# ── CRUD DE EMPLEADOS ──────────────────────────────────────

@main.route('/empleados', methods=['POST'])
def gestionar_empleado():
    try:
        data = request.json
        accion = data.get('accion', 'crear')
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id_puesto FROM puesto WHERE descripcion = %s", (data['puesto'],))
        res_puesto = cursor.fetchone()
        id_puesto = res_puesto[0] if res_puesto else 1 
        
        fecha_fin = data.get('salida') if data.get('salida') else None
        id_status = 1 if data.get('status') == 'Activo' else 2 

        if accion == 'editar':
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
        return jsonify({"error": str(e)}), 500

@main.route('/empleados/<int:id>', methods=['DELETE'])
def eliminar_empleado(id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        query = "UPDATE empleado SET id_status = 2, fecha_fin = CURDATE() WHERE id_empleado = %s"
        cursor.execute(query, (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Empleado dado de baja exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main.route('/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'ok', 'mensaje': 'Backend funcionando'})

@main.route('/actualizar_salario', methods=['POST'])
def actualizar_salario():
    try:
        data = request.json
        id_empleado = data.get('id')
        pago_quincenal = float(data.get('pago_quincenal'))
        
        # El sueldo en la base de datos es mensual, así que multiplicamos por 2
        salario_mensual = pago_quincenal * 2
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Actualizamos directamente la columna 'salario' en la tabla 'bancario'
        query = "UPDATE bancario SET salario = %s WHERE id_empleado = %s"
        cursor.execute(query, (salario_mensual, id_empleado))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Salario actualizado correctamente en la base de datos"}), 200
    except Exception as e:
        logger.error(f"Error al actualizar salario: {e}")
        return jsonify({"error": str(e)}), 500

# ── ESTADÍSTICAS DEL DASHBOARD (CORREGIDO Y MAPEADO CON NOMBRE REAL) ──

@main.route('/api/dashboard_stats', methods=['GET'])
def get_dashboard_stats():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # 1. METRICA: Asistencia Mensual (Contar estatus de abril 2026)
        query_asistencia = """
            SELECT id_status_dia, COUNT(*) as total 
            FROM resumen 
            WHERE fecha BETWEEN '2026-04-01' AND '2026-04-30'
            GROUP BY id_status_dia
        """
        cursor.execute(query_asistencia)
        res_asistencia = cursor.fetchall()
        
        # 2. METRICA: Empleados por Tienda (Distribución uniendo la tabla tienda para obtener el nombre)
        query_tiendas = """
            SELECT t.nombre as tienda, COUNT(*) as cantidad 
            FROM empleado e
            LEFT JOIN tienda t ON e.id_tienda = t.id_tienda
            WHERE e.id_status = 1 
            GROUP BY e.id_tienda, t.nombre
        """
        cursor.execute(query_tiendas)
        res_tiendas = cursor.fetchall()
        
        # 3. METRICA: Horas Trabajadas Promedio por Empleado (Abril)
        query_horas = """
            SELECT e.nombre, ROUND(AVG(r.horas_trabajadas), 1) as promedio_horas
            FROM resumen r
            JOIN empleado e ON r.id_empleado = e.id_empleado
            WHERE r.fecha BETWEEN '2026-04-01' AND '2026-04-30' AND r.horas_trabajadas > 0
            GROUP BY e.id_empleado, e.nombre
        """
        cursor.execute(query_horas)
        res_horas = cursor.fetchall()

        # 4. METRICA: Puntualidad (Corregido 'a_tiempo' para evitar error de SQL)
        query_puntualidad = """
            SELECT 
                SUM(CASE WHEN id_status_dia = 1 THEN 1 ELSE 0 END) as a_tiempo,
                SUM(CASE WHEN id_status_dia = 3 THEN 1 ELSE 0 END) as incidencias
            FROM resumen
            WHERE fecha BETWEEN '2026-04-01' AND '2026-04-30'
        """
        cursor.execute(query_puntualidad)
        res_puntualidad = cursor.fetchone()

        cursor.close()
        conn.close()

        # Retornamos todo consolidado en un solo objeto JSON empaquetado
        return jsonify({
            "asistencia_mensual": res_asistencia,
            "empleados_tienda": res_tiendas,
            "horas_trabajadas": res_horas,
            "puntualidad": res_puntualidad
        }), 200

    except Exception as e:
        logger.error(f"Error al generar métricas del dashboard: {e}")
        return jsonify({"error": str(e)}), 500