import React, { useState, useEffect } from 'react';

// Conectamos directamente a tu backend en producción
const API_URL = 'https://sistema-de-gestion-production-9f5d.up.railway.app';

const AsistenciaWeb = () => {
  const [empleados, setEmpleados] = useState([]);
  const [idEmpleado, setIdEmpleado] = useState('');
  const [nip, setNip] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cargando, setCargando] = useState(false);

  const cargarEmpleados = async () => {
    try {
      // Usamos tu API_URL de Railway
      const response = await fetch(`${API_URL}/empleados`);
      
      if (!response.ok) {
        throw new Error(`Servidor respondió con código ${response.status}`);
      }

      const data = await response.json();
      const lista = Array.isArray(data) ? data : (data.empleados || data.data || []);

      const activos = lista.filter(emp => {
        if (!emp) return false;
        const statusTexto = String(emp.status || emp.id_status || '').toLowerCase().trim();
        return statusTexto === 'activo' || statusTexto === 'activos' || statusTexto === '1';
      });

      setEmpleados(activos);
      setMensaje({ tipo: '', texto: '' });
    } catch (error) {
      console.error("Error al cargar empleados:", error);
      setMensaje({ tipo: 'error', texto: `No se pudieron cargar: ${error.message}` });
    }
  };

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const registrarAsistencia = (accion) => {
    // 1. Validaciones básicas
    if (!empleadoSeleccionado) {
      setMensajeError('Por favor selecciona tu nombre.');
      return;
    }
    if (!nip || nip.length !== 4) {
      setMensajeError('Por favor ingresa tu NIP de 4 dígitos.');
      return;
    }

    setCargando(true);
    setMensajeError('');
    setMensajeExito('');

    // ========================================================
    // 2. VALIDACIÓN Y LECTURA DEL GPS (NUEVO)
    // ========================================================
    if (!navigator.geolocation) {
      setMensajeError('Tu dispositivo no soporta la ubicación.');
      setCargando(false);
      return;
    }

    // Pedimos las coordenadas exactas
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitud = position.coords.latitude;
        const longitud = position.coords.longitude;

        // 3. ENVIAR TODO AL BACKEND CON LA UBICACIÓN INCLUIDA
        try {
          const response = await fetch(`${API_URL}/api/asistencia-web`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_empleado: empleadoSeleccionado,
              accion: accion,
              nip: nip,
              latitud: latitud,     // <- Mandamos la latitud
              longitud: longitud    // <- Mandamos la longitud
            })
          });

          const data = await response.json();

          if (response.ok) {
            setMensajeExito(`¡Marcado con éxito: ${accion.toUpperCase()}!`);
            setNip(''); // Limpiamos el NIP por seguridad
          } else {
            setMensajeError(data.error || 'Ocurrió un error al registrar.');
          }
        } catch (error) {
          setMensajeError('Error de conexión con el servidor.');
        } finally {
          setCargando(false);
        }
      },
      (error) => {
        // 4. SI EL EMPLEADO DENIEGA EL PERMISO O FALLA EL GPS
        setCargando(false);
        if (error.code === error.PERMISSION_DENIED) {
          setMensajeError('ACCESO DENEGADO: Debes permitir tu ubicación GPS para checar.');
        } else {
          setMensajeError('Error al obtener ubicación. Revisa tu señal GPS.');
        }
      },
      // Configuración para pedir la mayor precisión posible
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 } 
    );
  };

  const enviarAlBackend = async (accion, lat, lng) => {
    try {
      // Usamos tu API_URL de Railway para registrar la checada
      const response = await fetch(`${API_URL}/api/asistencia-web`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_empleado: idEmpleado,
          nip: nip,
          accion: accion,
          latitud: lat,
          longitud: lng
        })
      });

      const resData = await response.json();

      if (response.ok) {
        setMensaje({ tipo: 'exito', texto: `¡Marcado con éxito: ${accion.replace('_', ' ').toUpperCase()}!` });
        setNip(''); 
      } else {
        setMensaje({ tipo: 'error', texto: resData.error || 'Error al registrar.' });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', backgroundColor: '#fff', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#0d6efd', marginBottom: '5px' }}>Registro de Asistencia</h2>
      <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>JUCA TECNO - Panel Móvil</p>

      {mensaje.texto && (
        <div style={{ padding: '10px', borderRadius: '6px', marginBottom: '15px', backgroundColor: mensaje.tipo === 'exito' ? '#d1e7dd' : '#f8d7da', color: mensaje.tipo === 'exito' ? '#0f5132' : '#842029' }}>
          {mensaje.texto}
        </div>
      )}

      <div style={{ marginBottom: '15px', textAlign: 'left' }}>
        <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#333' }}>Empleado:</label>
        <select 
          value={idEmpleado} 
          onChange={(e) => setIdEmpleado(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginTop: '5px', fontSize: '15px' }}
        >
          <option value="">-- Selecciona tu nombre --</option>
          {empleados.map(emp => {
            const empId = emp.id || emp.id_empleado;
            return (
              <option key={empId} value={empId}>
                {empId}. {emp.nombre}
              </option>
            );
          })}
        </select>
      </div>

      <div style={{ marginBottom: '20px', textAlign: 'left' }}>
        <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#333' }}>NIP de Seguridad (4 dígitos):</label>
        <input 
          type="password" 
          maxLength="4" 
          value={nip} 
          onChange={(e) => setNip(e.target.value)} 
          placeholder="••••"
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginTop: '5px', fontSize: '16px', textAlign: 'center', letterSpacing: '5px' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button disabled={cargando} onClick={() => registrarAsistencia('entrada')} style={{ backgroundColor: '#198754', color: 'white', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          Entrada
        </button>
        <button disabled={cargando} onClick={() => registrarAsistencia('salida_comida')} style={{ backgroundColor: '#ffc107', color: 'black', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          Salida Comida
        </button>
        <button disabled={cargando} onClick={() => registrarAsistencia('regreso_comida')} style={{ backgroundColor: '#0dcaf0', color: 'black', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          Regreso Comida
        </button>
        <button disabled={cargando} onClick={() => registrarAsistencia('salida')} style={{ backgroundColor: '#dc3545', color: 'white', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          Salida
        </button>
      </div>
    </div>
  );
};

export default AsistenciaWeb;