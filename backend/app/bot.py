import mysql.connector
from datetime import datetime, timedelta, date
from dotenv import load_dotenv
import os

load_dotenv()

# ── DICCIONARIO PARA LA MEMORIA TEMPORAL (SESIONES) ──
# Guardará: {'+5212345678': {'id_empleado': 3, 'hora': datetime}}
memoria_bot = {}

def get_db():
    return mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        port=int(os.getenv('DB_PORT')),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME'),
        ssl_disabled=False
    )

def procesar_mensaje(telefono, mensaje):
    conn = None
    cursor = None
    
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        mensaje_limpio = mensaje.strip()
        empleado = None
        
        # ── 1. IDENTIFICAR AL EMPLEADO Y GESTIONAR MEMORIA ─────────────────────
        if mensaje_limpio.startswith('#'):
            # Si manda un #, buscamos al empleado en la base de datos
            identificador = mensaje_limpio[1:].strip()
            if identificador.isdigit():
                cursor.execute("SELECT * FROM empleado WHERE id_empleado = %s AND id_status = 1", (int(identificador),))
            else:
                cursor.execute("SELECT * FROM empleado WHERE nombre LIKE %s AND id_status = 1", (f'%{identificador}%',))
            
            empleado = cursor.fetchone()
            
            # Si lo encontró, lo GUARDAMOS en la memoria temporal del celular
            if empleado:
                memoria_bot[telefono] = {
                    'id_empleado': empleado['id_empleado'],
                    'hora': datetime.now()
                }
                
        else:
            # Si NO mandó # (mandó un 1, 2, 3, etc.), revisamos si hay una sesión activa
            if telefono in memoria_bot:
                sesion = memoria_bot[telefono]
                # Le damos 3 minutos para contestar el menú
                if datetime.now() - sesion['hora'] < timedelta(minutes=3):
                    cursor.execute("SELECT * FROM empleado WHERE id_empleado = %s", (sesion['id_empleado'],))
                    empleado = cursor.fetchone()
                else:
                    # Si se tardó mucho, borramos la memoria
                    del memoria_bot[telefono]
            
            # Si no había memoria o expiró, buscamos por el número de teléfono registrado
            if not empleado:
                cursor.execute("SELECT * FROM empleado WHERE telefono = %s AND id_status = 1", (telefono,))
                empleado = cursor.fetchone()

        if not empleado:
            return ("No te encontré o tu sesión expiró.\n"
                    "Escribe tu número de empleado para registrar tu asistencia.\n"
                    "Ejemplo: #1023")

        # ── 2. ¿EL USUARIO ELIGIÓ UNA OPCIÓN DEL MENÚ? ─────────────
        if mensaje_limpio in ['1', '2', '3', '4']:
            id_opcion = int(mensaje_limpio)
            
            # Verificación de los 5 minutos de seguridad
            cursor.execute("""
                SELECT fecha_hora FROM registro 
                WHERE id_empleado = %s ORDER BY fecha_hora DESC LIMIT 1
            """, (empleado['id_empleado'],))
            ultimo = cursor.fetchone()
            
            if ultimo and (datetime.now() - ultimo['fecha_hora']) < timedelta(minutes=5):
                minutos_restantes = 5 - int((datetime.now() - ultimo['fecha_hora']).total_seconds() / 60)
                return f"⏳ Espera {minutos_restantes} minuto(s) antes de hacer otro registro."

            # Verificar que la opción exista en la tabla evento
            cursor.execute("SELECT * FROM evento WHERE id_orden_sec = %s", (id_opcion,))
            evento = cursor.fetchone()
            
            if not evento:
                return "Opción inválida. Envía cualquier mensaje para ver el menú."

            # ── GUARDAR EL REGISTRO ──
            cursor.execute("""
                INSERT INTO registro (id_empleado, id_evento, fecha_hora, telefono_origen)
                VALUES (%s, %s, %s, %s)
            """, (empleado['id_empleado'], evento['id_evento'], datetime.now(), telefono))
            conn.commit()
            
            # ¡IMPORTANTE! Limpiar la memoria del teléfono para el siguiente empleado
            if telefono in memoria_bot:
                del memoria_bot[telefono]

            # ── RESPUESTA DE ÉXITO ──
            nombre_corto = empleado['nombre'].split()[0]
            hora_actual  = datetime.now().strftime('%H:%M')
            mensajes_ok = {
                1: f"✅ ¡Hola {nombre_corto}! Entrada a las {hora_actual}.",
                2: f"🍔 ¡Buen provecho {nombre_corto}! Salida a comer a las {hora_actual}.",
                3: f"💼 ¡Bienvenido de vuelta {nombre_corto}! Regreso a las {hora_actual}.",
                4: f"🌙 ¡Hasta mañana {nombre_corto}! Salida final a las {hora_actual}."
            }
            
            try:
                from app.nomina import calcular_resumen_dia
                calcular_resumen_dia(date.today())
            except Exception as e:
                print(f"Advertencia resumen: {e}")

            return mensajes_ok.get(id_opcion, "✅ Registro guardado correctamente.")

        # ── 3. MOSTRAR EL MENÚ ──────────
        cursor.execute("""
            SELECT ev.descripcion FROM registro r
            JOIN evento ev ON r.id_evento = ev.id_evento
            WHERE r.id_empleado = %s AND DATE(r.fecha_hora) = CURDATE()
            ORDER BY r.fecha_hora DESC LIMIT 1
        """, (empleado['id_empleado'],))
        ultimo_hoy = cursor.fetchone()
        
        estado_actual = ultimo_hoy['descripcion'] if ultimo_hoy else "Ninguno"
        nombre_corto = empleado['nombre'].split()[0]

        menu = (
            f"Hola *{nombre_corto}* 👋\n"
            f"Tu último registro hoy: _{estado_actual}_\n\n"
            "¿Qué deseas registrar ahora?\n"
            "Responde solo con el *número*:\n\n"
            "1️⃣ Entrada\n"
            "2️⃣ Salida a comer\n"
            "3️⃣ Regreso de comida\n"
            "4️⃣ Salida final"
        )
        return menu

    except Exception as e:
        print(f"Error en bot: {e}")
        try:
            if conn: conn.rollback()
        except: pass
        return "Ocurrió un error en el sistema. Intenta de nuevo."

    finally:
        try:
            if cursor: cursor.close()
            if conn: conn.close()
        except: pass