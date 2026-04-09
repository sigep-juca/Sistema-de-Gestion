import React, { useState } from 'react';
import { BiSearch, BiPlus } from "react-icons/bi"; 
import { HiOutlineChatBubbleBottomCenterText } from "react-icons/hi2"; 

const TablaGeneral = () => {
  const [empleados, setEmpleados] = useState([
    { id: 1, nombre: 'Ana López', puesto: 'Desarrolladora', telefono: '555-0101', supervisor: 'Roberto M.', fechaInicio: '2023-01-15', fechaSalida: '', status: 'activo', comentario: '' },
    { id: 2, nombre: 'Carlos Ruiz', puesto: 'Diseñador', telefono: '555-0102', supervisor: 'Julia P.', fechaInicio: '2022-05-10', fechaSalida: '2025-11-30', status: 'inactivo', comentario: 'Renuncia voluntaria por cambio de residencia.' },
    { id: 3, nombre: 'Beto Diaz', puesto: 'Soporte', telefono: '555-0103', supervisor: 'Roberto M.', fechaInicio: '2024-02-01', fechaSalida: '', status: 'activo', comentario: '' },
    { id: 4, nombre: 'Diana Pérez', puesto: 'Recursos Humanos', telefono: '555-0104', supervisor: 'Dirección', fechaInicio: '2021-08-20', fechaSalida: '', status: 'activo', comentario: '' },
    { id: 5, nombre: 'Elena Gómez', puesto: 'Ventas', telefono: '555-0105', supervisor: 'Julia P.', fechaInicio: '2023-11-05', fechaSalida: '2026-01-15', status: 'inactivo', comentario: 'Bajo rendimiento en el último trimestre.' }
  ]);

  const [editandoId, setEditandoId] = useState(null);
  const [datosEditados, setDatosEditados] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroSupervisor, setFiltroSupervisor] = useState('todos');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [textoComentario, setTextoComentario] = useState('');

  const supervisoresUnicos = [...new Set(empleados.map(emp => emp.supervisor))].filter(sup => sup.trim() !== '');

  const iniciarEdicion = (empleado) => {
    setEditandoId(empleado.id);
    setDatosEditados(empleado);
  };

  const cancelarEdicion = () => {
    if (datosEditados.nombre === '') {
      setEmpleados(empleados.filter(emp => emp.id !== datosEditados.id));
    }
    setEditandoId(null);
    setDatosEditados({});
  };

  const manejarCambio = (e) => {
    setDatosEditados({
      ...datosEditados,
      [e.target.name]: e.target.value
    });
  };

  const guardarCambios = (id) => {
    let datosFinales = { ...datosEditados };
    if (datosFinales.status === 'inactivo' && !datosFinales.fechaSalida) {
      datosFinales.fechaSalida = new Date().toISOString().split('T')[0];
    } else if (datosFinales.status === 'activo') {
      datosFinales.fechaSalida = ''; 
    }
    const nuevosEmpleados = empleados.map((emp) => emp.id === id ? datosFinales : emp);
    setEmpleados(nuevosEmpleados);
    setEditandoId(null); 
  };

  const agregarEmpleado = () => {
    const nuevoId = empleados.length > 0 ? Math.max(...empleados.map(e => e.id)) + 1 : 1;
    const nuevoEmpleado = {
      id: nuevoId, nombre: '', puesto: '', telefono: '', supervisor: '',
      fechaInicio: new Date().toISOString().split('T')[0], 
      fechaSalida: '', status: 'activo', comentario: ''
    };
    setEmpleados([...empleados, nuevoEmpleado]);
    iniciarEdicion(nuevoEmpleado);
    setBusqueda(''); setFiltroStatus('todos'); setFiltroSupervisor('todos');
  };

  const abrirModal = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setTextoComentario(empleado.comentario || ''); 
    setModalAbierto(true);
  };

  const guardarComentario = () => {
    const nuevosEmpleados = empleados.map(emp => emp.id === empleadoSeleccionado.id ? { ...emp, comentario: textoComentario } : emp);
    setEmpleados(nuevosEmpleados);
    setModalAbierto(false);
  };

  const empleadosFiltrados = empleados.filter((emp) => {
    const coincideBusqueda = emp.nombre.toLowerCase().includes(busqueda.toLowerCase()) || emp.puesto.toLowerCase().includes(busqueda.toLowerCase()) || emp.id.toString().includes(busqueda);
    const coincideStatus = filtroStatus === 'todos' || emp.status === filtroStatus;
    const coincideSupervisor = filtroSupervisor === 'todos' || emp.supervisor === filtroSupervisor;
    return coincideBusqueda && coincideStatus && coincideSupervisor;
  });

  const estiloFiltroLimpio = { border: 'none', backgroundColor: 'transparent', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontSize: '13px', outline: 'none', padding: '0', color: 'black' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', minHeight: '50px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ flex: '1 1 200px' }}>
          <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>Directorio Completo</h2>
          <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>Administra el historial del personal de Juca Tecno.</p>
        </div>

        <div style={{ flex: '2 1 300px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            width: '100%', maxWidth: '400px', padding: '10px 15px',
            borderRadius: '20px', border: '1px solid #ccc',
            backgroundColor: 'white'
          }}>
            <BiSearch style={{ color: '#888', marginRight: '10px', fontSize: '18px' }} />
            <input 
              type="text" 
              placeholder="Buscar empleado..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', padding: 0 }} 
            />
          </div>
        </div>

        <div style={{ flex: '1 1 150px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={agregarEmpleado} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            <BiPlus fontSize={'18px'} />
            Agregar Empleado
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '950px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left', fontSize: '13px' }}>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '5%' }}>ID</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '15%' }}>Nombre</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '14%' }}>Puesto</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '10%' }}>Teléfono</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '14%' }}>
                <select value={filtroSupervisor} onChange={(e) => setFiltroSupervisor(e.target.value)} style={estiloFiltroLimpio} title="Filtrar por Supervisor">
                  <option value="todos">Supervisor (Todos)</option>
                  {supervisoresUnicos.map((sup, index) => (<option key={index} value={sup}>{sup}</option>))}
                </select>
              </th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '10%' }}>Ingreso</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '10%' }}>Salida</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '10%' }}>
                <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={estiloFiltroLimpio} title="Filtrar por Status">
                  <option value="todos">Status (Todos)</option>
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '12%' }}>Acciones</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '14px' }}>
            {empleadosFiltrados.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No se encontraron empleados.</td></tr>
            ) : (
              empleadosFiltrados.map((empleado) => (
                <tr key={empleado.id} style={{ backgroundColor: empleado.status === 'inactivo' ? '#fff0f0' : 'white', borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>{empleado.id}</td>
                  {editandoId === empleado.id ? (
                    <>
                      <td style={{ padding: '5px' }}><input type="text" name="nombre" value={datosEditados.nombre} onChange={manejarCambio} style={{ width: '90%' }} /></td>
                      <td style={{ padding: '5px' }}><input type="text" name="puesto" value={datosEditados.puesto} onChange={manejarCambio} style={{ width: '90%' }} /></td>
                      <td style={{ padding: '5px' }}><input type="text" name="telefono" value={datosEditados.telefono} onChange={manejarCambio} style={{ width: '90%' }} /></td>
                      <td style={{ padding: '5px' }}><input type="text" name="supervisor" value={datosEditados.supervisor} onChange={manejarCambio} style={{ width: '90%' }} /></td>
                      <td style={{ padding: '5px' }}><input type="date" name="fechaInicio" value={datosEditados.fechaInicio} onChange={manejarCambio} style={{ width: '90%' }} /></td>
                      <td style={{ padding: '5px' }}><input type="date" name="fechaSalida" value={datosEditados.fechaSalida} onChange={manejarCambio} style={{ width: '90%' }} disabled={datosEditados.status === 'activo'} /></td>
                      <td style={{ padding: '5px' }}><select name="status" value={datosEditados.status} onChange={manejarCambio} style={{ width: '100%' }}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></td>
                      <td style={{ padding: '5px', display: 'flex', gap: '2px', flexWrap: 'wrap' }}><button onClick={() => guardarCambios(empleado.id)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px', cursor: 'pointer', borderRadius: '3px', flex: 1, fontSize: '12px' }}>✓</button><button onClick={cancelarEdicion} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px', cursor: 'pointer', borderRadius: '3px', flex: 1, fontSize: '12px' }}>✖</button></td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{empleado.nombre}</td>
                      <td style={{ padding: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{empleado.puesto}</td>
                      <td style={{ padding: '10px' }}>{empleado.telefono}</td>
                      <td style={{ padding: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{empleado.supervisor}</td>
                      <td style={{ padding: '10px' }}>{empleado.fechaInicio}</td>
                      <td style={{ padding: '10px', color: '#666' }}>{empleado.status === 'inactivo' ? empleado.fechaSalida : '-'}</td>
                      <td style={{ padding: '10px' }}><span style={{ fontWeight: 'bold', color: empleado.status === 'activo' ? 'green' : 'red' }}>{empleado.status.toUpperCase()}</span></td>
                      <td style={{ padding: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button onClick={() => iniciarEdicion(empleado)} style={{ padding: '4px 8px', cursor: 'pointer', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '3px', fontSize: '12px', flex: 1 }}>Editar</button>
                        {empleado.status === 'inactivo' && (
                          <button onClick={() => abrirModal(empleado)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', flex: 1 }} title="Ver motivo de baja">
                            <HiOutlineChatBubbleBottomCenterText fontSize={'16px'} />
                          </button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '400px', maxWidth: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Motivo de Baja</h3>
            <p style={{ fontSize: '14px', color: '#555' }}>Empleado: <strong>{empleadoSeleccionado?.nombre}</strong></p>
            <textarea value={textoComentario} onChange={(e) => setTextoComentario(e.target.value)} placeholder="Escribe el motivo de la salida..." style={{ width: '100%', height: '100px', padding: '10px', marginTop: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', resize: 'vertical' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setModalAbierto(false)} style={{ padding: '8px 15px', backgroundColor: '#e0e0e0', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={guardarComentario} style={{ padding: '8px 15px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Nota</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablaGeneral;