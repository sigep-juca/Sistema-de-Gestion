import React from 'react';
import { BiBarChartAlt2, BiLineChart, BiPieChartAlt2, BiCalendarCheck } from "react-icons/bi";

const tarjetasGraficas = [
  {
    icono: <BiBarChartAlt2 style={{ fontSize: '40px', color: '#0056b3' }} />,
    titulo: 'Asistencia Mensual',
    descripcion: 'Faltas, retardos y asistencias por mes.',
  },
  {
    icono: <BiPieChartAlt2 style={{ fontSize: '40px', color: '#28a745' }} />,
    titulo: 'Empleados por Tienda',
    descripcion: 'Distribución del personal en cada sucursal.',
  },
  {
    icono: <BiLineChart style={{ fontSize: '40px', color: '#fd7e14' }} />,
    titulo: 'Horas Trabajadas',
    descripcion: 'Promedio de horas trabajadas por empleado.',
  },
  {
    icono: <BiCalendarCheck style={{ fontSize: '40px', color: '#6f42c1' }} />,
    titulo: 'Puntualidad',
    descripcion: 'Porcentaje de puntualidad por semana.',
  },
];

const Graficas = () => {
  return (
    <div>
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>Gráficas y Estadísticas</h2>
        <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
          Visualiza el desempeño y las estadísticas del personal de Juca Tecno.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '20px',
      }}>
        {tarjetasGraficas.map((tarjeta, i) => (
          <div key={i} style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '30px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'center',
          }}>
            {tarjeta.icono}
            <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '16px' }}>{tarjeta.titulo}</h3>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '13px' }}>{tarjeta.descripcion}</p>
            <span style={{
              marginTop: '8px',
              backgroundColor: '#e9ecef',
              color: '#495057',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '4px 10px',
              borderRadius: '20px',
            }}>
              PRÓXIMAMENTE
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Graficas;