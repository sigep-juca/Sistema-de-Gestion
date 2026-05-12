import mysql.connector
from datetime import datetime, date
from dotenv import load_dotenv
import os

load_dotenv()

def get_db():
    return mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        port=int(os.getenv('DB_PORT')),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME'),
        ssl_disabled=False
    )

def calcular_resumen_dia(fecha=None):
    """
    Calcula el resumen del día para todos los empleados.
    Si no se pasa fecha, calcula el día de hoy.
    """
    if fecha is None:
        fecha = date.today()

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # Obtener todos los empleados activos
        cursor.execute("""
            SELECT e.id_empleado, e.nombre, e.id_horario
            FROM empleado e
            WHERE e.id_status = 1
        """)
        empleados = cursor.fetchall()

        # Verificar si es día festivo
        cursor.execute("""
            SELECT * FROM dias_festivos WHERE fecha = %s
        """, (fecha,))
        es_festivo = cursor.fetchone()

        for empleado in empleados:
            id_emp = empleado['id_empleado']

            # Obtener registros del día ordenados
            cursor.execute("""
                SELECT r.fecha_hora, ev.id_orden_sec, ev.descripcion
                FROM registro r
                JOIN evento ev ON r.id_evento = ev.id_evento
                WHERE r.id_empleado = %s AND DATE(r.fecha_hora) = %s
                ORDER BY r.fecha_hora ASC
            """, (id_emp, fecha))
            registros = cursor.fetchall()

            # Valores por defecto
            hora_entrada    = None
            hora_salida     = None
            horas_trabajadas = 0.0
            id_status_dia   = None  # Se asignará después

            if not registros and not es_festivo:
                # Sin registros y no es festivo → Falta
                id_status_dia = 3  # Falta
            elif registros:
                # Extraer entrada y salida
                for reg in registros:
                    if reg['id_orden_sec'] == 1:
                        hora_entrada = reg['fecha_hora'].time()
                    if reg['id_orden_sec'] == 4:
                        hora_salida = reg['fecha_hora'].time()

                # Calcular horas trabajadas
                if hora_entrada and hora_salida:
                    from datetime import datetime as dt
                    entrada_dt = dt.combine(fecha, hora_entrada)
                    salida_dt  = dt.combine(fecha, hora_salida)

                    # Restar tiempo de comida si existe
                    salida_comida  = None
                    regreso_comida = None
                    for reg in registros:
                        if reg['id_orden_sec'] == 2:
                            salida_comida = reg['fecha_hora']
                        if reg['id_orden_sec'] == 3:
                            regreso_comida = reg['fecha_hora']

                    tiempo_comida = 0
                    if salida_comida and regreso_comida:
                        tiempo_comida = (regreso_comida - salida_comida).total_seconds() / 3600

                    horas_trabajadas = round(
                        (salida_dt - entrada_dt).total_seconds() / 3600 - tiempo_comida, 2
                    )

                    # Determinar estatus según horario
                    if empleado['id_horario']:
                        cursor.execute("""
                            SELECT hora_entrada, tolerancia_minutos 
                            FROM horario WHERE id_horario = %s
                        """, (empleado['id_horario'],))
                        horario = cursor.fetchone()

                        if horario:
                            from datetime import datetime as dt
                            limite = dt.combine(fecha, horario['hora_entrada'])
                            limite_tolerancia = limite.replace(
                                minute=limite.minute + horario['tolerancia_minutos']
                            )
                            entrada_real = dt.combine(fecha, hora_entrada)

                            if entrada_real <= limite_tolerancia:
                                id_status_dia = 1  # Asistencia
                            else:
                                id_status_dia = 2  # Retardo
                        else:
                            id_status_dia = 1  # Sin horario definido → Asistencia
                    else:
                        id_status_dia = 1  # Sin horario definido → Asistencia
                else:
                    # Entró pero no registró salida
                    id_status_dia = 1  # Asistencia parcial

            # Verificar si ya existe resumen del día
            cursor.execute("""
                SELECT id_resumen FROM resumen
                WHERE id_empleado = %s AND fecha = %s
            """, (id_emp, fecha))
            existe = cursor.fetchone()

            if existe:
                # Actualizar
                cursor.execute("""
                    UPDATE resumen SET
                        hora_entrada = %s,
                        hora_salida = %s,
                        horas_trabajadas = %s,
                        id_status_dia = %s
                    WHERE id_empleado = %s AND fecha = %s
                """, (hora_entrada, hora_salida, horas_trabajadas,
                      id_status_dia, id_emp, fecha))
            else:
                # Insertar
                cursor.execute("""
                    INSERT INTO resumen 
                        (id_empleado, fecha, hora_entrada, hora_salida,
                         horas_trabajadas, dias_trabajados, id_status_dia)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    id_emp, fecha, hora_entrada, hora_salida,
                    horas_trabajadas,
                    1 if id_status_dia in [1, 2] else 0,
                    id_status_dia
                ))

        conn.commit()
        print(f"Resumen del {fecha} calculado correctamente.")

    except Exception as e:
        conn.rollback()
        print(f"Error calculando resumen: {e}")

    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    calcular_resumen_dia()