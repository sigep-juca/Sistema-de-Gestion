import React, { useState, useEffect } from 'react';

const MonitoreoVivo = () => {
  const [registros, setRegistros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  // Obtenemos la fecha de hoy automáticamente para que el filtro nunca amanezca vacío
  const hoy = new Date();
  const fechaLocal = new Date(hoy.getTime() - (hoy.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const [fechaFiltro, setFechaFiltro] = useState(fechaLocal);

  const API_URL = 'https://sistema-de-gestion-production-9f5d.up.railway.app';

  const cargarRegistros = async (fecha) => {
    try {
      const url = fecha ? `${API_URL}/registros?fecha=${fecha}` : `${API_URL}/registros`;
      const response = await fetch(url);
      const data = await response.json();
      setRegistros(data);
    } catch (error) {
      console.error("Error cargando monitoreo:", error);
    }
  };

  // Cada que el usuario cambie la fecha en el calendario, pedimos los datos nuevos al servidor
  useEffect(() => {
    cargarRegistros(fechaFiltro);
  }, [fechaFiltro]);

  // Filtramos la tabla en tiempo real basándonos en lo que escriban en el buscador
  const registrosFiltrados = registros.filter(registro => 
    registro.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#002855', marginBottom: '5px' }}>📍 Monitoreo en Vivo (GPS)</h2>
      <p style={{ color: '#6c757d', marginBottom: '25px', fontSize: '14px' }}>
        Línea de tiempo y ubicación satelital del personal de JUCA TECNO.
      </p>

      {/* ========================================== */}
      {/* 🛠️ BARRA DE HERRAMIENTAS (Filtros)          */}
      {/* ========================================== */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '250px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>Buscar Empleado:</label>
          <input 
            type="text" 
            placeholder="Escribe un nombre para filtrar..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>Consultar Fecha:</label>
          <input 
            type="date" 
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* ========================================== */}
      {/* 📊 TABLA CON LA LÍNEA DE TIEMPO HORIZONTAL */}
      {/* ========================================== */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
              <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Empleado</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>Entrada</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>Salida Comida</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>Regreso Comida</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>Salida</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>Última Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.length > 0 ? (
              registrosFiltrados.map((registro, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#333' }}>{registro.nombre}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{registro.entrada || '--:--'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{registro.salida_comida || '--:--'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{registro.regreso_comida || '--:--'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{registro.salida || '--:--'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {registro.latitud && registro.longitud ? (
                      <a 
                        href={`https://www.google.com/maps?q=${registro.latitud},${registro.longitud}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: '#4285F4', 
                          color: 'white', 
                          padding: '6px 12px', 
                          borderRadius: '5px', 
                          textDecoration: 'none', 
                          fontWeight: 'bold',
                          fontSize: '12px',
                          display: 'inline-block'
                        }}
                      >
                        📍 Ver Mapa
                      </a>
                    ) : (
                      <span style={{ color: '#6c757d', fontStyle: 'italic', fontSize: '13px' }}>
                        Sin GPS
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                  No se encontraron registros para la búsqueda o fecha seleccionada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonitoreoVivo;