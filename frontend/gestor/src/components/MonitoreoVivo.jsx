import React, { useState, useEffect } from 'react';

const MonitoreoVivo = () => {
  const [registros, setRegistros] = useState([]);
  // Ponemos tu URL de producción
  const API_URL = 'https://sistema-de-gestion-production-9f5d.up.railway.app';

  useEffect(() => {
    // Pedimos los registros del día al backend
    fetch(`${API_URL}/registros`)
      .then(res => res.json())
      .then(data => setRegistros(data))
      .catch(err => console.error("Error cargando monitoreo:", err));
  }, []);

  return (
    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#002855' }}>Monitoreo en Vivo (GPS)</h2>
      <p style={{ color: '#6c757d', marginBottom: '20px' }}>
        Ubicación exacta de los empleados al momento de marcar su entrada.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Empleado</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Hora Entrada</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Ubicación Satelital</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((registro, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{registro.nombre}</td>
              <td style={{ padding: '12px' }}>{registro.entrada || '--:--'}</td>
              <td style={{ padding: '12px' }}>
                
                {/* BOTÓN MÁGICO DE GOOGLE MAPS */}
                {registro.latitud && registro.longitud ? (
                  <a 
                    href={`https://www.google.com/maps?q=${registro.latitud},${registro.longitud}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: '#4285F4', 
                      color: 'white', 
                      padding: '8px 12px', 
                      borderRadius: '5px', 
                      textDecoration: 'none', 
                      fontWeight: 'bold',
                      fontSize: '14px',
                      display: 'inline-block'
                    }}
                  >
                    Ver en Mapa
                  </a>
                ) : (
                  <span style={{ color: '#6c757d', fontStyle: 'italic' }}>
                    Sin ubicación 
                  </span>
                )}
                {/* FIN DEL BOTÓN */}

              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonitoreoVivo;