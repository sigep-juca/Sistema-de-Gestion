import mysql.connector
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

def get_db():
    return mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        port=int(os.getenv('DB_PORT')),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME')
    )

def procesar_mensaje(telefono, mensaje):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # ── 1. IDENTIFICAR AL EMPLEADO ─────────────────────
        # Verificar si el mensaje empieza con # (celular prestado)
        if mensaje.startswith('#'):
            identificador = mensaje[1:].strip()
            # Buscar por id_empleado o nombre
            if identificador.isdigit():
                cursor.execute("""
                    SELECT * FROM empleado 
                    WHERE id_empleado = %s AND id_status = 1
                """, (int(identificador),))
            else:
                cursor.execute("""
                    SELECT * FROM empleado 
                    WHERE nombre LIKE %s AND id_status = 1
                """, (f'%{identificador}%',))
            empleado = cursor.fetchone()
            if not empleado:
                return "No encontré a ese empleado. Verifica el nombre o número e intenta de nuevo."
        else:
            # Buscar por teléfono registrado
            cursor.execute("""
                SELECT * FROM empleado 
                WHERE telefono = %s AND id_status = 1
            """, (telefono,))
            empleado = cursor.fetchone()

            if not empleado:
                # Teléfono no registrado, pedir número de empleado
                return ("Tu número no está registrado en el sistema.\n"
                        "Escribe tu número de empleado para registrar tu asistencia.\n"
                        "Ejemplo: #1023")

        # ── 2. VERIFICAR VENTANA DE 5 MINUTOS ─────────────
        cursor.execute("""
            SELECT fecha_hora FROM registro
            WHERE id_empleado = %s
            ORDER BY fecha_hora DESC LIMIT 1
        """, (empleado['id_empleado'],))
        ultimo = cursor.fetchone()

        if ultimo:
            diferencia = datetime.now() - ultimo['fecha_hora']
            if diferencia < timedelta(minutes=5):
                minutos_restantes = 5 - int(diferencia.total_seconds() / 60)
                return (f"Ya registramos tu asistencia hace menos de 5 minutos.\n"
                        f"Espera {minutos_restantes} minuto(s) antes de registrar de nuevo.")

        # ── 3. DETERMINAR EL EVENTO (LÓGICA DE PARES/IMPARES) ─
        cursor.execute("""
            SELECT r.id_evento, ev.id_orden_sec 
            FROM registro r
            JOIN evento ev ON r.id_evento = ev.id_evento
            WHERE r.id_empleado = %s 
            AND DATE(r.fecha_hora) = CURDATE()
            ORDER BY r.fecha_hora DESC LIMIT 1
        """, (empleado['id_empleado'],))
        ultimo_hoy = cursor.fetchone()

        # Determinar siguiente evento
        if not ultimo_hoy:
            siguiente_orden = 1  # Primera vez hoy → Entrada
        else:
            siguiente_orden = ultimo_hoy['id_orden_sec'] + 1
            if siguiente_orden > 4:
                return (f"Hola {empleado['nombre'].split()[0]}, "
                        f"ya completaste todos tus registros del día. "
                        f"¡Hasta mañana!")

        # Verificar que existe el evento
        cursor.execute("""
            SELECT * FROM evento WHERE id_orden_sec = %s
        """, (siguiente_orden,))
        evento = cursor.fetchone()

        if not evento:
            return "Ocurrió un error al determinar el evento. Contacta a RRHH."

        # ── 4. GUARDAR EL REGISTRO ─────────────────────────
        cursor.execute("""
            INSERT INTO registro (id_empleado, id_evento, fecha_hora, telefono_origen)
            VALUES (%s, %s, %s, %s)
        """, (
            empleado['id_empleado'],
            evento['id_evento'],
            datetime.now(),
            telefono
        ))
        conn.commit()

        # ── 5. RESPUESTA AL EMPLEADO ───────────────────────
        nombre_corto = empleado['nombre'].split()[0]
        hora_actual  = datetime.now().strftime('%H:%M')
        mensajes = {
            1: f"✅ Buenos días {nombre_corto}!\nEntrada registrada a las {hora_actual}.",
            2: f"🍽️ Buen provecho {nombre_corto}!\nSalida a comer registrada a las {hora_actual}.",
            3: f"✅ Bienvenido de vuelta {nombre_corto}!\nRegreso de comida registrado a las {hora_actual}.",
            4: f"👋 Hasta mañana {nombre_corto}!\nSalida registrada a las {hora_actual}.\nQue descanses."
        }
        return mensajes.get(siguiente_orden, "Registro guardado correctamente.")

    except Exception as e:
        conn.rollback()
        print(f"Error en bot: {e}")
        return "Ocurrió un error en el sistema. Intenta de nuevo o contacta a RRHH."

    finally:
        cursor.close()
        conn.close()