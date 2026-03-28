import React, { useState } from 'react';
import { BiCalendarEvent, BiCalendar, BiCalendarWeek, BiGridAlt, BiChevronLeft, BiChevronRight } from "react-icons/bi";

const ControlAsistencia = () => {
  const [vistaActiva, setVistaActiva] = useState('hoy'); 
  
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toISOString().slice(0, 7));
  const [numSemana, setNumSemana] = useState('1'); 

  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [modoCalendario, setModoCalendario] = useState('dia'); 
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1); 

  const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const diasCortos = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  const [añoStr, mesStr] = mesSeleccionado.split('-');
  const año = parseInt(añoStr, 10);
  const mes = parseInt(mesStr, 10);
  const diasEnElMes = new Date(año, mes, 0).getDate();
  const diasMesArray = Array.from({ length: diasEnElMes }, (_, i) => i + 1);
  const totalSemanas = diasEnElMes === 28 ? 4 : 5;
  const semanasArray = Array.from({ length: totalSemanas }, (_, i) => i + 1);

  const fechaHoy = new Date();
  fechaHoy.setHours(0, 0, 0, 0);

  // ==========================================
  // LÓGICA AUTOMÁTICA DE ESTATUS Y DATOS SIMULADOS
  // ==========================================
  const empleadosNombres = ['Monse Irays', 'Claudia Moreno', 'Cristian', 'Karen Gallardo', 'Yazir', 'Andrea Ivone', 'Diana Cuajimalpa', 'Camila Mili'];
  
  const datosDiarios = empleadosNombres.map((nombre, index) => {
    // 1. Base de horas (Como si las leyeramos de la base de datos de WhatsApp)
    let entrada = '09:00:00'; 
    let salida = '18:00:00'; 
    let statusManual = null; // Para descansos o faltas marcadas por RH

    // Simulamos diferentes escenarios de los empleados:
    if (index === 2) { entrada = '09:45:00'; salida = '18:00:00'; } // Cristian llegó tarde
    if (index === 3) { entrada = '-'; salida = '-'; statusManual = 'falta'; } // Karen faltó
    if (index === 4) { entrada = '09:10:00'; salida = '-'; } // Yazir olvidó checar SALIDA
    if (index === 5) { entrada = '-'; salida = '18:05:00'; } // Andrea olvidó checar ENTRADA
    if (index === 6) { entrada = '-'; salida = '-'; statusManual = 'descanso'; } // Diana descansa

    // 2. LA COMPUTADORA DECIDE EL ESTATUS AUTOMÁTICAMENTE
    let statusFinal = '';
    let total = '-';

    if (statusManual) {
      statusFinal = statusManual; // Si RH dijo que es Falta o Descanso, se respeta.
    } else if (entrada === '-' || salida === '-') {
      statusFinal = 'incompleto'; // ¡La regla que pediste! Faltó checar una de las dos.
    } else if (entrada > '09:15:00') {
      statusFinal = 'retardo'; // Entró después de las 9:15
      total = '8:15:00'; // (Simulado)
    } else {
      statusFinal = 'asistencia'; // Tiene ambas y llegó a tiempo
      total = '9:00:00'; // (Simulado)
    }

    return { id: index + 1, nombre, fecha: fechaSeleccionada, entrada, salida, total, status: statusFinal };
  });

  // Agregamos el color NARANJA para los "Incompletos"
  const getColorStatus = (status) => {
    switch(status) {
      case 'asistencia': return { bg: '#d4edda', text: '#155724' }; // Verde
      case 'retardo': return { bg: '#fff3cd', text: '#856404' }; // Amarillo
      case 'falta': return { bg: '#f8d7da', text: '#721c24' }; // Rojo
      case 'descanso': return { bg: '#e2e3e5', text: '#383d41' }; // Gris
      case 'festivo': return { bg: '#cce5ff', text: '#004085' }; // Azul
      case 'incompleto': return { bg: '#ffe8a1', text: '#b35900' }; // Naranja llamativo
      default: return { bg: 'white', text: 'black' };
    }
  };

  const getBotonEstilo = (vista) => ({
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
    backgroundColor: vistaActiva === vista ? '#0056b3' : '#e9ecef',
    color: vistaActiva === vista ? 'white' : '#333',
    border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
    transition: '0.2s'
  });

  const abrirCalendario = (modo) => {
    setModoCalendario(modo);
    setVistaActiva(modo);
    if (modo === 'dia') {
      const [y, m] = fechaSeleccionada.split('-');
      setCalYear(parseInt(y)); setCalMonth(parseInt(m));
    } else {
      setCalYear(año); setCalMonth(mes);
    }
    setMostrarCalendario(true);
  };

  const cambiarMesCal = (delta) => {
    let nuevoMes = calMonth + delta;
    let nuevoAño = calYear;
    if (nuevoMes > 12) { nuevoMes = 1; nuevoAño++; }
    if (nuevoMes < 1) { nuevoMes = 12; nuevoAño--; }
    setCalMonth(nuevoMes);
    setCalYear(nuevoAño);
  };

  const seleccionarDiaCalendario = (dia) => {
    const mm = String(calMonth).padStart(2, '0');
    const dd = String(dia).padStart(2, '0');
    if (modoCalendario === 'dia') {
      setFechaSeleccionada(`${calYear}-${mm}-${dd}`);
    } else if (modoCalendario === 'semana') {
      setMesSeleccionado(`${calYear}-${mm}`);
      const semanaCalculada = Math.ceil(dia / 7);
      setNumSemana(String(semanaCalculada));
    }
    setMostrarCalendario(false); 
  };

  const renderCuadriculaCalendario = () => {
    const primerDiaSemana = new Date(calYear, calMonth - 1, 1).getDay(); 
    const diasTotalMes = new Date(calYear, calMonth, 0).getDate();
    const celdas = [];
    for (let i = 0; i < primerDiaSemana; i++) {
      celdas.push(<div key={`empty-${i}`} style={{ padding: '10px' }}></div>);
    }
    for (let d = 1; d <= diasTotalMes; d++) {
      celdas.push(
        <button 
          key={d} onClick={() => seleccionarDiaCalendario(d)}
          style={{ padding: '10px', border: 'none', backgroundColor: '#f8f9fa', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#e2e6ea'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#f8f9fa'}
        >
          {d}
        </button>
      );
    }
    return celdas;
  };

  const renderTablaDiaria = () => (
    <div>
      <h3 style={{ marginTop: '20px', color: '#0056b3' }}>Mostrando registro de: {fechaSeleccionada}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Nombre</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Fecha</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Hora Entrada</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Hora Salida</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Horas Totales</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Estatus</th>
          </tr>
        </thead>
        <tbody>
          {datosDiarios.map((emp) => {
            const colores = getColorStatus(emp.status);
            return (
              <tr key={emp.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{emp.nombre}</td>
                <td style={{ padding: '12px' }}>{emp.fecha}</td>
                <td style={{ padding: '12px', color: emp.entrada === '-' ? '#dc3545' : 'black', fontWeight: emp.entrada === '-' ? 'bold' : 'normal' }}>{emp.entrada}</td>
                <td style={{ padding: '12px', color: emp.salida === '-' ? '#dc3545' : 'black', fontWeight: emp.salida === '-' ? 'bold' : 'normal' }}>{emp.salida}</td>
                <td style={{ padding: '12px' }}>{emp.total}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ backgroundColor: colores.bg, color: colores.text, padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {emp.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderTablaSemanal = () => {
    const diasSemana = ['D', 'L', 'Ma', 'Mi', 'J', 'V', 'S']; 
    return (
      <div style={{ overflowX: 'auto', marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e3f2fd' }}>
              <th rowSpan="3" style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left', verticalAlign: 'middle', backgroundColor: '#f2f2f2' }}>Nombre</th>
              <th colSpan={diasSemana.length * 3} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontSize: '14px' }}>
                Semana {numSemana} ({año})
              </th>
            </tr>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              {diasSemana.map((dia, i) => {
                const diaDelMes = (parseInt(numSemana) - 1) * 7 + (i + 1);
                const labelDia = diaDelMes <= diasEnElMes ? `${dia} (${diaDelMes})` : dia;
                return <th key={i} colSpan="3" style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>{labelDia}</th>;
              })}
            </tr>
            <tr style={{ backgroundColor: '#fafafa' }}>
              {diasSemana.map((_, i) => (
                <React.Fragment key={i}>
                  <th style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>Entrada</th>
                  <th style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center' }}>Salida</th>
                  <th style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>Total</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {empleadosNombres.map((nombre, idx) => (
              <tr key={idx}>
                <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>{nombre}</td>
                {diasSemana.map((_, i) => {
                  const diaDelMes = (parseInt(numSemana) - 1) * 7 + (i + 1);
                  const fechaCelda = new Date(año, mes - 1, diaDelMes);
                  
                  if (diaDelMes > diasEnElMes) {
                    return (
                      <React.Fragment key={i}>
                        <td style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#e9ecef' }}></td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#e9ecef' }}></td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#e9ecef' }}></td>
                      </React.Fragment>
                    );
                  }

                  const esFuturo = fechaCelda > fechaHoy;

                  if (esFuturo) {
                    return (
                      <React.Fragment key={i}>
                        <td style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f4f4f4', color: '#aaa', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f4f4f4', color: '#aaa', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f4f4f4', color: '#aaa', textAlign: 'center' }}>-</td>
                      </React.Fragment>
                    );
                  }

                  // Simulador aleatorio para la vista semanal (incluye incompletos)
                  const rand = Math.random();
                  let in_val = '09:00:00'; let out_val = '18:00:00'; let bg = 'white';
                  
                  if (rand > 0.9) { in_val = '-'; out_val = '-'; bg = '#f8d7da'; } // Falta
                  else if (rand > 0.8) { in_val = '09:00:00'; out_val = '-'; bg = '#ffe8a1'; } // Incompleto (Sin salida)
                  else if (rand > 0.7) { in_val = '-'; out_val = '18:00:00'; bg = '#ffe8a1'; } // Incompleto (Sin entrada)

                  return (
                    <React.Fragment key={i}>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', backgroundColor: bg, color: in_val === '-' ? '#dc3545' : 'inherit' }}>{in_val}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', backgroundColor: bg, color: out_val === '-' ? '#dc3545' : 'inherit' }}>{out_val}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', backgroundColor: bg }}>{in_val === '-' || out_val === '-' ? '-' : '9:00:00'}</td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTablaMensual = () => {
    return (
      <div style={{ overflowX: 'auto', marginTop: '20px' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '1000px', fontSize: '11px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: '#f2f2f2', zIndex: 2 }}>Nombre</th>
              {diasMesArray.map(dia => (
                <th key={dia} style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center', width: '25px' }}>{dia}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {empleadosNombres.map((nombre, idx) => (
              <tr key={idx}>
                <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>{nombre}</td>
                {diasMesArray.map(dia => {
                  const fechaCelda = new Date(año, mes - 1, dia);
                  const esFuturo = fechaCelda > fechaHoy;
                  if (esFuturo) {
                    return <td key={dia} style={{ border: '1px solid #ddd', backgroundColor: '#f4f4f4' }} title={`Día ${dia} (Pendiente)`}></td>;
                  }
                  
                  // Colores mensuales aleatorios (incluye naranja para incompleto)
                  const rand = Math.random();
                  let colorCelda = '#d4edda'; 
                  if (rand > 0.9) colorCelda = '#f8d7da'; // falta
                  else if (rand > 0.8) colorCelda = '#fff3cd'; // retardo
                  else if (rand > 0.7) colorCelda = '#ffe8a1'; // incompleto

                  return <td key={dia} style={{ border: '1px solid #ccc', backgroundColor: colorCelda, padding: '10px' }} title={`Día ${dia}`}></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>Control de Asistencia y Horarios</h2>
        <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>Monitorea el registro del reloj checador vía WhatsApp.</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        
        <button onClick={() => { setVistaActiva('hoy'); setFechaSeleccionada(new Date().toISOString().split('T')[0]); }} style={getBotonEstilo('hoy')}>
          <BiCalendarEvent fontSize="18px" /> Hoy
        </button>
        
        <button onClick={() => abrirCalendario('dia')} style={getBotonEstilo('dia')}>
          <BiCalendar fontSize="18px" /> Día
        </button>

        <button onClick={() => abrirCalendario('semana')} style={getBotonEstilo('semana')}>
          <BiCalendarWeek fontSize="18px" /> Semana
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button onClick={() => setVistaActiva('mes')} style={getBotonEstilo('mes')}>
            <BiGridAlt fontSize="18px" /> Mes
          </button>
          
          {vistaActiva === 'mes' && (
            <input 
              type="month" 
              value={mesSeleccionado} 
              onChange={(e) => setMesSeleccionado(e.target.value)}
              style={{ padding: '9px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', cursor: 'pointer' }}
            />
          )}
        </div>
      </div>

      {vistaActiva === 'hoy' && renderTablaDiaria()}
      {vistaActiva === 'dia' && renderTablaDiaria()}
      {vistaActiva === 'semana' && renderTablaSemanal()}
      {vistaActiva === 'mes' && renderTablaMensual()}

      {mostrarCalendario && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#0056b3' }}>
                {modoCalendario === 'dia' ? 'Selecciona un Día' : 'Selecciona un día de la Semana'}
              </h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>
                {modoCalendario === 'semana' ? 'El sistema calculará la semana automáticamente.' : ''}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <button onClick={() => cambiarMesCal(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#333' }}><BiChevronLeft /></button>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{mesesNombres[calMonth - 1]} {calYear}</span>
              <button onClick={() => cambiarMesCal(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#333' }}><BiChevronRight /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center', marginBottom: '10px' }}>
              {diasCortos.map(d => <div key={d} style={{ fontSize: '12px', fontWeight: 'bold', color: '#888' }}>{d}</div>)}
              {renderCuadriculaCalendario()}
            </div>

            <button 
              onClick={() => setMostrarCalendario(false)} 
              style={{ width: '100%', padding: '10px', marginTop: '10px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ControlAsistencia;