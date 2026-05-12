import React, { useState, useEffect } from 'react';
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

  const fechaHoy = new Date();
  fechaHoy.setHours(0, 0, 0, 0);

  const empleadosNombres = ['Monse Irays', 'Claudia Moreno', 'Cristian', 'Karen Gallardo', 'Yazir', 'Andrea Ivone', 'Diana Cuajimalpa', 'Camila Mili'];

  const [datosDiarios, setDatosDiarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const empleadosUnicos = [...new Set(datosDiarios.map((reg) => reg.nombre).filter(Boolean))];
  const empleadosUsar = empleadosUnicos.length ? empleadosUnicos : empleadosNombres;

  const formatearFecha = (fecha) => {
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const getDatosPorFecha = (fecha) => datosDiarios.filter((item) => formatearFecha(item.fecha) === formatearFecha(fecha));

  const getRegistro = (nombre, fecha) => datosDiarios.find((item) => item.nombre === nombre && formatearFecha(item.fecha) === formatearFecha(fecha));

  useEffect(() => {
    const base = 'http://localhost:5000';
    let url = `${base}/registros/hoy`;

    if (vistaActiva === 'dia') {
      url = `${base}/registros?fecha=${fechaSeleccionada}`;
    } else if (vistaActiva === 'semana') {
      url = `${base}/registros?mes=${mesSeleccionado}&semana=${numSemana}`;
    } else if (vistaActiva === 'mes') {
      url = `${base}/registros?mes=${mesSeleccionado}`;
    }

    setCargando(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setDatosDiarios(Array.isArray(data) ? data : []);
        setCargando(false);
      })
      .catch((err) => {
        console.error(err);
        setDatosDiarios([]);
        setCargando(false);
      });
  }, [fechaSeleccionada, mesSeleccionado, numSemana, vistaActiva]);

  const getColorStatus = (status) => {
    switch(status) {
      case 'asistencia': return { bg: '#d4edda', text: '#155724' };
      case 'retardo': return { bg: '#fff3cd', text: '#856404' };
      case 'falta': return { bg: '#f8d7da', text: '#721c24' };
      case 'descanso': return { bg: '#e2e3e5', text: '#383d41' };
      case 'festivo': return { bg: '#cce5ff', text: '#004085' };
      case 'incompleto': return { bg: '#ffe8a1', text: '#b35900' };
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

  const renderTablaDiaria = () => {
    const registros = vistaActiva === 'hoy'
      ? datosDiarios
      : getDatosPorFecha(fechaSeleccionada);

    return (
      <div>
        <h3 style={{ marginTop: '20px', color: '#0056b3' }}>
          Mostrando registro de: {vistaActiva === 'hoy' ? new Date().toISOString().split('T')[0] : fechaSeleccionada}
        </h3>
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
            {registros.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '16px' }}>No hay registros para esta fecha.</td>
              </tr>
            ) : registros.map((emp, index) => {
              const colores = getColorStatus(emp.status || '');
              return (
                <tr key={`${emp.nombre}-${index}`} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{emp.nombre || 'Desconocido'}</td>
                  <td style={{ padding: '12px' }}>{formatearFecha(emp.fecha) || new Date().toISOString().split('T')[0]}</td>
                  <td style={{ padding: '12px', color: emp.entrada === '-' ? '#dc3545' : 'black', fontWeight: emp.entrada === '-' ? 'bold' : 'normal' }}>{emp.entrada || '-'}</td>
                  <td style={{ padding: '12px', color: emp.salida === '-' ? '#dc3545' : 'black', fontWeight: emp.salida === '-' ? 'bold' : 'normal' }}>{emp.salida || '-'}</td>
                  <td style={{ padding: '12px' }}>{emp.total || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: colores.bg, color: colores.text, padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {emp.status || '-'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTablaSemanal = () => {
    const diasSemana = ['D', 'L', 'Ma', 'Mi', 'J', 'V', 'S'];
    const inicioSemana = (parseInt(numSemana, 10) - 1) * 7 + 1;
    const diasSemanaNumeros = Array.from({ length: 7 }, (_, i) => inicioSemana + i);

    return (
      <div style={{ overflowX: 'auto', marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e3f2fd' }}>
              <th rowSpan="3" style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left', verticalAlign: 'middle', backgroundColor: '#f2f2f2' }}>Nombre</th>
              <th colSpan={diasSemana.length * 3} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontSize: '14px' }}>
                Semana {numSemana} ({año}-{String(mes).padStart(2, '0')})
              </th>
            </tr>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              {diasSemanaNumeros.map((diaDelMes, i) => {
                const labelDia = diaDelMes <= diasEnElMes ? `${diasSemana[i]} (${diaDelMes})` : '-';
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
            {empleadosUsar.map((nombre, idx) => (
              <tr key={`${nombre}-${idx}`}>
                <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>{nombre}</td>
                {diasSemanaNumeros.map((diaDelMes, i) => {
                  if (diaDelMes > diasEnElMes) {
                    return (
                      <React.Fragment key={i}>
                        <td style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#e9ecef' }}></td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#e9ecef' }}></td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#e9ecef' }}></td>
                      </React.Fragment>
                    );
                  }
                  const fechaCelda = `${año}-${String(mes).padStart(2, '0')}-${String(diaDelMes).padStart(2, '0')}`;
                  const registro = getRegistro(nombre, fechaCelda);
                  if (!registro) {
                    return (
                      <React.Fragment key={i}>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>-</td>
                      </React.Fragment>
                    );
                  }
                  const colores = getColorStatus(registro.status || '');
                  return (
                    <React.Fragment key={i}>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', backgroundColor: colores.bg }}>{registro.entrada || '-'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', backgroundColor: colores.bg }}>{registro.salida || '-'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', backgroundColor: colores.bg }}>{registro.total || '-'}</td>
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
              {diasMesArray.map((dia) => (
                <th key={dia} style={{ padding: '5px', border: '1px solid #ddd', textAlign: 'center', width: '25px' }}>{dia}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {empleadosUsar.map((nombre, idx) => (
              <tr key={`${nombre}-${idx}`}>
                <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>{nombre}</td>
                {diasMesArray.map((dia) => {
                  const fechaCelda = new Date(año, mes - 1, dia);
                  const fechaCadena = `${año}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                  const esFuturo = fechaCelda > fechaHoy;
                  if (esFuturo) {
                    return <td key={dia} style={{ border: '1px solid #ddd', backgroundColor: '#f4f4f4' }} title={`Día ${dia} (Pendiente)`}></td>;
                  }
                  const registro = getRegistro(nombre, fechaCadena);
                  if (!registro) {
                    return <td key={dia} style={{ border: '1px solid #ddd', backgroundColor: '#fff' }} title={`Día ${dia}`}>&nbsp;</td>;
                  }
                  const colores = getColorStatus(registro.status || '');
                  return (
                    <td key={dia} style={{ border: '1px solid #ccc', backgroundColor: colores.bg, color: colores.text, padding: '6px', textAlign: 'center' }} title={`Entrada: ${registro.entrada || '-'}\nSalida: ${registro.salida || '-'}\nTotal: ${registro.total || '-'}`}>
                      <div style={{ fontSize: '10px' }}>{registro.entrada || '-'}</div>
                      <div style={{ fontSize: '10px' }}>{registro.salida || '-'}</div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold' }}>{registro.total || '-'}</div>
                    </td>
                  );
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

      {cargando ? (
        <div style={{ marginTop: '20px', fontWeight: 'bold', color: '#007bff' }}>Cargando registros...</div>
      ) : (
        <>
          {vistaActiva === 'hoy' && renderTablaDiaria()}
          {vistaActiva === 'dia' && renderTablaDiaria()}
          {vistaActiva === 'semana' && renderTablaSemanal()}
          {vistaActiva === 'mes' && renderTablaMensual()}
        </>
      )}

      {mostrarCalendario && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
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
            <button onClick={() => setMostrarCalendario(false)} style={{ width: '100%', padding: '10px', marginTop: '10px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlAsistencia;