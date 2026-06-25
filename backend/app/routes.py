from flask import Blueprint, jsonify, request, current_app, Response
import mysql.connector
import html
import logging
from datetime import datetime
import calendar
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
 
    cursor.execute("""
        SELECT e.id_empleado, e.nombre, p.descripcion AS puesto,
               e.id_tienda, t.nombre AS tienda, s.descripcion AS status,
               e.id_supervisor, e.telefono, e.fecha_inicio, e.fecha_fin
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

# ── NÓMINA (CÁLCULO EXACTO + PROPORCIÓN SÉPTIMO DÍA + TOPE SALARIAL) ──

@main.route('/nomina_real', methods=['GET'])
def get_nomina_real():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        mes = request.args.get('mes') 
        quincena = request.args.get('quincena') 
        
        if not mes or not quincena:
            hoy = datetime.today()
            mes = hoy.strftime('%Y-%m')
            quincena = '1' if hoy.day <= 15 else '2'

        year, month = map(int, mes.split('-'))
        if quincena == '1':
            fecha_inicio = f"{mes}-01"
            fecha_fin = f"{mes}-15"
        else:
            ultimo_dia = calendar.monthrange(year, month)[1]
            fecha_inicio = f"{mes}-16"
            fecha_fin = f"{mes}-{ultimo_dia}"
        
        query = """
            SELECT 
                e.id_empleado as id, 
                e.nombre, 
                b.banco,
                b.clabe,
                b.num_tarjeta,
                b.num_cuenta,
                b.salario as salario_fijo,
                COALESCE(SUM(r.horas_trabajadas), 0) as total_horas,
                COUNT(DISTINCT r.fecha) as dias_trabajados
            FROM empleado e
            JOIN bancario b ON e.id_empleado = b.id_empleado
            LEFT JOIN resumen r ON e.id_empleado = r.id_empleado 
                AND r.fecha BETWEEN %s AND %s
            WHERE e.id_status = 1
            GROUP BY e.id_empleado, e.nombre, b.banco, b.clabe, b.num_tarjeta, b.num_cuenta, b.salario
        """
        
        cursor.execute(query, (fecha_inicio, fecha_fin))
        nomina = cursor.fetchall()
        
        for emp in nomina:
            salario_base = float(emp['salario_fijo']) if emp['salario_fijo'] is not None else 0.0
            
            # REGLA 1: PAGO POR DÍA (<= 1500)
            if salario_base > 0 and salario_base <= 1500:
                dias_trabajados = int(emp['dias_trabajados'])
                
                dias_descanso = dias_trabajados / 6.0
                dias_a_pagar = dias_trabajados + dias_descanso
                
                pago_quincenal_teorico = salario_base * 15 
                pago_calculado = dias_a_pagar * salario_base
                
                # TOPE: No pagar más de la quincena contratada
                if pago_calculado > pago_quincenal_teorico:
                    pago_calculado = pago_quincenal_teorico
                
                if dias_trabajados > 0:
                    emp['tiempo_registrado'] = f"{dias_trabajados}d (+{round(dias_descanso, 1)}d desc)"
                else:
                    emp['tiempo_registrado'] = "0 días"
                    
                emp['tarifa_display'] = f"${salario_base}/Día"
                emp['pago_quincenal_teorico'] = pago_quincenal_teorico
                emp['pago_quincenal'] = round(pago_calculado, 2)
                
            # REGLA 2: PAGO POR HORA (> 1500)
            else:
                salario_diario = salario_base / 30.0
                tarifa_hora = salario_diario / 8.0
                total_horas = float(emp['total_horas'])
                
                horas_descanso = total_horas / 6.0
                horas_a_pagar = total_horas + horas_descanso
                
                pago_quincenal_teorico = round(salario_base / 2.0, 2)
                pago_calculado = horas_a_pagar * tarifa_hora
                
                # TOPE: No pagar más de la quincena contratada
                if pago_calculado > pago_quincenal_teorico:
                    pago_calculado = pago_quincenal_teorico
                
                if total_horas > 0:
                    emp['tiempo_registrado'] = f"{round(total_horas, 1)}h (+{round(horas_descanso, 1)}h desc)"
                else:
                    emp['tiempo_registrado'] = "0 hrs"
                    
                emp['tarifa_display'] = f"${round(tarifa_hora, 2)}/Hr"
                emp['pago_quincenal_teorico'] = pago_quincenal_teorico
                emp['pago_quincenal'] = round(pago_calculado, 2)
            
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

# ── ACTUALIZAR SALARIO Y DATOS BANCARIOS ───────────────────

@main.route('/actualizar_salario', methods=['POST'])
def actualizar_salario():
    try:
        data = request.json
        id_empleado = data.get('id')
        pago_quincenal = float(data.get('pago_quincenal'))
        banco = data.get('banco')
        cuenta = data.get('cuenta')
        
        salario_mensual = pago_quincenal * 2
        
        clabe = None
        num_tarjeta = None
        num_cuenta = None
        
        if cuenta:
            cuenta = str(cuenta).strip()
            if len(cuenta) == 18:
                clabe = cuenta
            elif len(cuenta) == 16:
                num_tarjeta = cuenta
            else:
                num_cuenta = cuenta
        
        conn = get_db()
        cursor = conn.cursor()
        
        query = """
            UPDATE bancario 
            SET salario = %s, banco = %s, clabe = %s, num_tarjeta = %s, num_cuenta = %s 
            WHERE id_empleado = %s
        """
        cursor.execute(query, (salario_mensual, banco, clabe, num_tarjeta, num_cuenta, id_empleado))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Datos actualizados correctamente en la base de datos"}), 200
    except Exception as e:
        logger.error(f"Error al actualizar datos: {e}")
        return jsonify({"error": str(e)}), 500

# ── ESTADÍSTICAS DEL DASHBOARD ──────────────────────────────
@main.route('/api/dashboard_stats', methods=['GET'])
def get_dashboard_stats():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
 
        mes_param = request.args.get('mes')
 
        if mes_param:
            filtro_fecha = f"DATE_FORMAT(fecha, '%Y-%m') = '{mes_param}'"
            filtro_fecha_r = f"DATE_FORMAT(r.fecha, '%Y-%m') = '{mes_param}'"
        else:
            filtro_fecha = "MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())"
            filtro_fecha_r = "MONTH(r.fecha) = MONTH(CURDATE()) AND YEAR(r.fecha) = YEAR(CURDATE())"
 
        # ── Asistencia mensual ──
        query_asistencia = f"""
            SELECT id_status_dia, COUNT(*) as total 
            FROM resumen 
            WHERE {filtro_fecha}
            GROUP BY id_status_dia
        """
        cursor.execute(query_asistencia)
        res_asistencia = cursor.fetchall()
 
        # ── Empleados por tienda (excluyendo el comodín "TODAS" = id_tienda 1) ──
        query_tiendas = """
            SELECT t.nombre as tienda, COUNT(*) as cantidad 
            FROM empleado e
            LEFT JOIN tienda t ON e.id_tienda = t.id_tienda
            WHERE e.id_status = 1 AND e.id_tienda != 1
            GROUP BY e.id_tienda, t.nombre
            ORDER BY cantidad DESC
        """
        cursor.execute(query_tiendas)
        res_tiendas = cursor.fetchall()
 
        total_empleados_general = sum(t['cantidad'] for t in res_tiendas)
 
        # ── Horas trabajadas promedio por empleado ──
        query_horas = f"""
            SELECT e.nombre, ROUND(AVG(r.horas_trabajadas), 1) as promedio_horas
            FROM resumen r
            JOIN empleado e ON r.id_empleado = e.id_empleado
            WHERE {filtro_fecha_r} AND r.horas_trabajadas > 0
            GROUP BY e.id_empleado, e.nombre
        """
        cursor.execute(query_horas)
        res_horas = cursor.fetchall()
 
        # ── Puntualidad colectiva ──
        query_puntualidad = f"""
            SELECT 
                SUM(CASE WHEN id_status_dia = 1 THEN 1 ELSE 0 END) as a_tiempo,
                SUM(CASE WHEN id_status_dia = 3 THEN 1 ELSE 0 END) as incidencias
            FROM resumen
            WHERE {filtro_fecha}
        """
        cursor.execute(query_puntualidad)
        res_puntualidad = cursor.fetchone()
 
        cursor.close()
        conn.close()
 
        # ── Un solo return, al final, con todo ya calculado ──
        return jsonify({
            "asistencia_mensual": res_asistencia,
            "empleados_tienda": res_tiendas,
            "total_empleados_general": total_empleados_general,
            "horas_trabajadas": res_horas,
            "puntualidad": res_puntualidad
        }), 200
 
    except Exception as e:
        logger.error(f"Error al generar métricas del dashboard: {e}")
        return jsonify({"error": str(e)}), 500

@main.route('/api/dashboard_filtros', methods=['GET'])
def get_dashboard_filtros():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT id_tienda, nombre 
            FROM tienda 
            ORDER BY nombre
        """)
        tiendas = cursor.fetchall()

        cursor.execute("""
            SELECT id_empleado, nombre, id_tienda 
            FROM empleado 
            WHERE id_status = 1
            ORDER BY nombre
        """)
        empleados = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            "tiendas": tiendas,
            "empleados": empleados
        }), 200

    except Exception as e:
        logger.error(f"Error al obtener filtros del dashboard: {e}")
        return jsonify({"error": str(e)}), 500


# ── ENDPOINT: ESTADÍSTICAS FILTRADAS POR TIENDA ─────────────────────────
# Devuelve asistencia/faltas/retardos de la tienda + horas promedio por empleado

@main.route('/api/dashboard_stats_tienda', methods=['GET'])
def get_dashboard_stats_tienda():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        id_tienda = request.args.get('id_tienda')
        mes_param = request.args.get('mes')

        if not id_tienda:
            return jsonify({"error": "Se requiere id_tienda"}), 400

        if mes_param:
            filtro_fecha_r = "DATE_FORMAT(r.fecha, '%Y-%m') = %s"
            params_fecha = (mes_param,)
        else:
            filtro_fecha_r = "MONTH(r.fecha) = MONTH(CURDATE()) AND YEAR(r.fecha) = YEAR(CURDATE())"
            params_fecha = ()

        # Nombre de la tienda (para el título de la vista)
        cursor.execute("SELECT nombre FROM tienda WHERE id_tienda = %s", (id_tienda,))
        tienda_info = cursor.fetchone()
        nombre_tienda = tienda_info['nombre'] if tienda_info else f"Tienda {id_tienda}"

        # Asistencia / faltas / retardos de los empleados de esa tienda
        query_asistencia = f"""
            SELECT r.id_status_dia, COUNT(*) as total
            FROM resumen r
            JOIN empleado e ON r.id_empleado = e.id_empleado
            WHERE e.id_tienda = %s AND {filtro_fecha_r}
            GROUP BY r.id_status_dia
        """
        cursor.execute(query_asistencia, (id_tienda,) + params_fecha)
        res_asistencia = cursor.fetchall()

        # Horas promedio por empleado de esa tienda
        query_horas = f"""
            SELECT e.nombre, ROUND(AVG(r.horas_trabajadas), 1) as promedio_horas
            FROM resumen r
            JOIN empleado e ON r.id_empleado = e.id_empleado
            WHERE e.id_tienda = %s AND {filtro_fecha_r} AND r.horas_trabajadas > 0
            GROUP BY e.id_empleado, e.nombre
            ORDER BY promedio_horas DESC
        """
        cursor.execute(query_horas, (id_tienda,) + params_fecha)
        res_horas = cursor.fetchall()

        # Total de empleados activos en esa tienda
        cursor.execute(
            "SELECT COUNT(*) as total FROM empleado WHERE id_tienda = %s AND id_status = 1",
            (id_tienda,)
        )
        total_empleados = cursor.fetchone()['total']

        cursor.close()
        conn.close()

        return jsonify({
            "nombre_tienda": nombre_tienda,
            "total_empleados": total_empleados,
            "asistencia": res_asistencia,
            "horas_por_empleado": res_horas
        }), 200

    except Exception as e:
        logger.error(f"Error al generar estadísticas de tienda: {e}")
        return jsonify({"error": str(e)}), 500


# ── ENDPOINT: ESTADÍSTICAS FILTRADAS POR EMPLEADO ───────────────────────
# Devuelve línea de tiempo diaria de horas + resumen de asistencia/faltas/retardos

@main.route('/api/dashboard_stats_empleado', methods=['GET'])
def get_dashboard_stats_empleado():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        id_empleado = request.args.get('id_empleado')
        mes_param = request.args.get('mes')

        if not id_empleado:
            return jsonify({"error": "Se requiere id_empleado"}), 400

        if mes_param:
            filtro_fecha = "DATE_FORMAT(r.fecha, '%Y-%m') = %s"
            params_fecha = (mes_param,)
        else:
            filtro_fecha = "MONTH(r.fecha) = MONTH(CURDATE()) AND YEAR(r.fecha) = YEAR(CURDATE())"
            params_fecha = ()

        # Nombre del empleado
        cursor.execute("SELECT nombre FROM empleado WHERE id_empleado = %s", (id_empleado,))
        emp_info = cursor.fetchone()
        nombre_empleado = emp_info['nombre'] if emp_info else "Empleado"

        # Línea de tiempo diaria de horas trabajadas
        query_timeline = f"""
            SELECT 
                DATE_FORMAT(r.fecha, '%d/%m') as fecha,
                r.horas_trabajadas,
                sd.descripcion as status
            FROM resumen r
            LEFT JOIN status_dia sd ON r.id_status_dia = sd.id_status_dia
            WHERE r.id_empleado = %s AND {filtro_fecha}
            ORDER BY r.fecha ASC
        """
        cursor.execute(query_timeline, (id_empleado,) + params_fecha)
        res_timeline = cursor.fetchall()

        # Resumen de asistencias / faltas / retardos del empleado
        query_resumen = f"""
            SELECT r.id_status_dia, sd.descripcion, COUNT(*) as total
            FROM resumen r
            LEFT JOIN status_dia sd ON r.id_status_dia = sd.id_status_dia
            WHERE r.id_empleado = %s AND {filtro_fecha}
            GROUP BY r.id_status_dia, sd.descripcion
        """
        cursor.execute(query_resumen, (id_empleado,) + params_fecha)
        res_resumen = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            "nombre_empleado": nombre_empleado,
            "timeline_horas": res_timeline,
            "resumen_status": res_resumen
        }), 200

    except Exception as e:
        logger.error(f"Error al generar estadísticas de empleado: {e}")
        return jsonify({"error": str(e)}), 500
