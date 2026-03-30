import React, { useState, useEffect } from 'react';
import { BiCalendarEvent } from "react-icons/bi";

const ControlAsistencia = () => {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/registros/hoy')
      .then(res => res.json())
      .then(data => {
        setRegistros(data);
        setCargando(false);
      })
      .catch(err => {
        console.error(err);
        setCargando(false);
      });
  }, []);

  const hoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>
          Control de Asistencia y Horarios
        </h2>
        <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
          Monitorea el registro del reloj checador vía WhatsApp.
        </p>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <BiCalendarEvent fontSize="20px" color="#0056b3" />
        <span style={{ fontWeight: 'bold', color: '#0056b3', fontSize: '16px' }}>
          Registros de hoy — {hoy}
        </span>
      </div>

      {cargando ? (
        <p style={{ color: '#6c757d' }}>Cargando registros...</p>
      ) : registros.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          <p style={{ fontSize: '18px' }}>No hay registros de asistencia hoy.</p>
          <p style={{ fontSize: '14px' }}>Los empleados deben enviar un mensaje por WhatsApp para registrar su entrada.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#0056b3', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>#</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Empleado</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Evento</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Fecha y Hora</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((reg, i) => (
              <tr key={reg.id_registro} style={{ backgroundColor: i % 2 === 0 ? '#f8f9fa' : 'white', borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px' }}>{reg.id_registro}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{reg.nombre}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    backgroundColor: reg.evento === 'Entrada' ? '#d4edda' : reg.evento === 'Salida final' ? '#f8d7da' : '#fff3cd',
                    color: reg.evento === 'Entrada' ? '#155724' : reg.evento === 'Salida final' ? '#721c24' : '#856404',
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'
                  }}>
                    {reg.evento}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>{reg.fecha_hora}</td>
                <td style={{ padding: '12px', color: '#6c757d', fontSize: '13px' }}>{reg.telefono_origen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ControlAsistencia;