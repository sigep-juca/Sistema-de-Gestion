import React, { useState, useEffect } from 'react';
import { BiSearch, BiPlus } from "react-icons/bi"; 

const TablaGeneral = () => {
  // Empezamos con la tabla vacía, esperando a MariaDB
  const [empleados, setEmpleados] = useState([]);
  
  const [editandoId, setEditandoId] = useState(null);
  const [datosEditados, setDatosEditados] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // --- FUNCIÓN PARA DESCARGAR DATOS REALES DE MARIADB ---
  const cargarEmpleados = async () => {
    try {
      const response = await fetch('https://sistema-de-gestion-production-9f5d.up.railway.app/empleados');
      
      if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.status}`);
      }

      const data = await response.json();

      // Traducimos los datos del backend al formato de nuestra tabla
      const empleadosReales = data.map(emp => ({
        id: emp.id_empleado,
        nombre: emp.nombre,
        puesto: emp.puesto,
        telefono: emp.telefono,
        supervisor: emp.id_supervisor ? emp.id_supervisor.toString() : '',
        tienda: emp.id_tienda ? emp.id_tienda.toString() : '1',
        nombreTienda: emp.tienda, 
        fechaInicio: emp.fecha_inicio ? new Date(emp.fecha_inicio).toISOString().split('T')[0] : '',
        fechaSalida: emp.fecha_fin ? new Date(emp.fecha_fin).toISOString().split('T')[0] : '',
        status: emp.status ? emp.status.toLowerCase() : 'inactivo'
      }));

      setEmpleados(empleadosReales);
    } catch (error) {
      console.error("Error al cargar la base de datos:", error);
    }
  };

  // El useEffect hace que cargarEmpleados() corra automáticamente al abrir la página
  useEffect(() => {
    cargarEmpleados();
  }, []);

  const obtenerNombreSupervisor = (idStr) => {
    const mapa = { "1": "Irays Monserrath", "2": "Sinai Guevara", "3": "Irene Michell", "4": "Olivia Ceron" };
    return mapa[idStr] || "-";
  };

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
    setDatosEditados({ ...datosEditados, [e.target.name]: e.target.value });
  };

  const guardarCambios = async (id) => {
    let datosFinales = { ...datosEditados };
    // Verificamos si es nuevo revisando si el ID es gigante (el que creamos temporalmente)
    const esNuevo = id === 999999;

    try {
      const response = await fetch('https://sistema-de-gestion-production-9f5d.up.railway.app/empleados', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: esNuevo ? 'crear' : 'editar', 
          id_empleado: esNuevo ? null : id,                      
          nombre: datosFinales.nombre,
          puesto: datosFinales.puesto,
          telefono: datosFinales.telefono,
          id_supervisor: datosFinales.supervisor ? parseInt(datosFinales.supervisor) : null,
          id_tienda: datosFinales.tienda ? parseInt(datosFinales.tienda) : 1,
          ingreso: datosFinales.fechaInicio,
          salida: datosFinales.fechaSalida || null,
          status: datosFinales.status === 'activo' ? 'Activo' : 'Inactivo'
        }),
      });

      if (response.ok) {
        alert(esNuevo ? "Empleado creado" : "Empleado actualizado en MariaDB");
        setEditandoId(null);
        // Recargamos la tabla entera desde la base de datos para ver los cambios
        cargarEmpleados(); 
      } else {
        alert("Error en el servidor al guardar.");
      }
    } catch (error) {
      alert("Error de conexión con el Backend.");
    }
  };

  const agregarEmpleado = () => {
    const nuevoId = 999999; // ID temporal, MariaDB pondrá el real
    const nuevoEmpleado = {
      id: nuevoId, nombre: '', puesto: '', telefono: '', supervisor: '', tienda: '1', 
      fechaInicio: new Date().toISOString().split('T')[0], fechaSalida: '', status: 'activo'
    };
    setEmpleados([nuevoEmpleado, ...empleados]); // Lo pone hasta arriba
    iniciarEdicion(nuevoEmpleado);
    setBusqueda(''); 
    setFiltroStatus('todos');
  };

  const empleadosFiltrados = empleados.filter((emp) => {
    const coincideBusqueda = emp.nombre.toLowerCase().includes(busqueda.toLowerCase()) || emp.puesto.toLowerCase().includes(busqueda.toLowerCase()) || emp.id.toString().includes(busqueda);
    
    // Aquí hacemos que "inactivo" englobe tanto "baja" como "baja definitiva" e "inactivo"
    const coincideStatus = filtroStatus === 'todos' || 
                           (filtroStatus === 'activo' && emp.status === 'activo') || 
                           (filtroStatus === 'inactivo' && (emp.status === 'inactivo' || emp.status === 'baja' || emp.status === 'baja definitiva'));
                           
    return coincideBusqueda && coincideStatus;
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
            display: 'flex', alignItems: 'center', width: '100%', maxWidth: '400px', padding: '10px 15px',
            borderRadius: '20px', border: '1px solid #ccc', backgroundColor: 'white'
          }}>
            <BiSearch style={{ color: '#888', marginRight: '10px', fontSize: '18px' }} />
            <input type="text" placeholder="Buscar empleado..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', padding: 0 }} />
          </div>
        </div>

        <div style={{ flex: '1 1 150px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={agregarEmpleado} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            <BiPlus fontSize={'18px'} /> Agregar Empleado
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '1050px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left', fontSize: '13px' }}>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '4%' }}>ID</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '15%' }}>Nombre</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '11%' }}>Puesto</th>
              {/* Le dimos 14% al teléfono para que quepa bien el número con código de país */}
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '14%' }}>Teléfono</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '13%' }}>Supervisor</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '12%' }}>Tienda</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '9%' }}>Ingreso</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '9%' }}>Salida</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '9%' }}>
                <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={estiloFiltroLimpio}>
                  <option value="todos">Status (Todos)</option>
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '10%' }}>Acciones</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '14px' }}>
            {empleadosFiltrados.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No se encontraron empleados en la base de datos.</td></tr>
            ) : (
              empleadosFiltrados.map((empleado) => (
                <tr key={empleado.id} style={{ backgroundColor: empleado.status !== 'activo' ? '#fff0f0' : 'white', borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>{empleado.id === 999999 ? 'NUEVO' : empleado.id}</td>
                  {editandoId === empleado.id ? (
                    <>
                      <td style={{ padding: '5px' }}><input type="text" name="nombre" value={datosEditados.nombre} onChange={manejarCambio} style={{ width: '90%' }} /></td>
                      <td style={{ padding: '5px' }}>
                        <select name="puesto" value={datosEditados.puesto} onChange={manejarCambio} style={{ width: '90%', padding: '2px' }}>
                          <option value="">Seleccionar...</option>
                          <option value="Supervisora">Supervisora</option>
                          <option value="Vendedora">Vendedora</option>
                          <option value="Bodega">Bodega</option>
                          <option value="Entrega">Entrega</option>
                        </select>
                      </td>
                      <td style={{ padding: '5px' }}><input type="text" name="telefono" value={datosEditados.telefono} onChange={manejarCambio} style={{ width: '90%' }} /></td>
                      
                      {/* SOLO EL SELECT DURANTE LA EDICIÓN */}
                      <td style={{ padding: '5px' }}>
                        <select name="supervisor" value={datosEditados.supervisor} onChange={manejarCambio} style={{ width: '90%', padding: '2px' }}>
                          <option value="">Seleccionar...</option>
                          <option value="1">Irays Monserrath</option>
                          <option value="2">Sinai Guevara</option>
                          <option value="3">Irene Michell</option>
                          <option value="4">Olivia Ceron</option>
                        </select>
                      </td>
                      
                      <td style={{ padding: '5px' }}>
                        <select name="tienda" value={datosEditados.tienda} onChange={manejarCambio} style={{ width: '90%', padding: '2px' }}>
                          <option value="">Seleccionar...</option>
                          <option value="1">TODAS</option>
                          <option value="2">CUAJIMALPA</option>
                          <option value="3">CIUDAD AZTECA</option>
                          <option value="4">IXTAPALUCA</option>
                          <option value="5">CHALCO 2000</option>
                          <option value="6">CHIMALHUACAN</option>
                          <option value="7">VALLE DE CHALCO</option>
                          <option value="8">ZUMPANGO</option>
                          <option value="9">GRAN PATIO ECATEPEC</option>
                          <option value="10">HUEHUETOCA</option>
                          <option value="11">PLAZA ARAGON</option>
                          <option value="12">ROSARIO</option>
                          <option value="13">PLAZA ECATEPEC</option>
                          <option value="14">MARTIN CARRERA</option>
                        </select>
                      </td>
                      <td style={{ padding: '5px' }}><input type="date" name="fechaInicio" value={datosEditados.fechaInicio} onChange={manejarCambio} style={{ width: '90%' }} /></td>
                      <td style={{ padding: '5px' }}><input type="date" name="fechaSalida" value={datosEditados.fechaSalida} onChange={manejarCambio} style={{ width: '90%' }} disabled={datosEditados.status === 'activo'} /></td>
                      <td style={{ padding: '5px' }}><select name="status" value={datosEditados.status} onChange={manejarCambio} style={{ width: '100%' }}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></td>
                      <td style={{ padding: '5px', display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                        <button onClick={() => guardarCambios(empleado.id)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px', cursor: 'pointer', borderRadius: '3px', flex: 1, fontSize: '12px' }}>✓</button>
                        <button onClick={cancelarEdicion} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px', cursor: 'pointer', borderRadius: '3px', flex: 1, fontSize: '12px' }}>✖</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{empleado.nombre}</td>
                      <td style={{ padding: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{empleado.puesto}</td>
                      
                      {/* Agregado whiteSpace nowrap para que el teléfono no se parta en dos líneas */}
                      <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{empleado.telefono}</td>
                      
                      <td style={{ padding: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{obtenerNombreSupervisor(empleado.supervisor)}</td>
                      <td style={{ padding: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{empleado.nombreTienda || '-'}</td>
                      <td style={{ padding: '10px' }}>{empleado.fechaInicio}</td>
                      <td style={{ padding: '10px', color: '#666' }}>{empleado.status !== 'activo' ? empleado.fechaSalida : '-'}</td>
                      <td style={{ padding: '10px' }}><span style={{ fontWeight: 'bold', color: empleado.status === 'activo' ? 'green' : 'red' }}>{empleado.status.toUpperCase()}</span></td>
                      <td style={{ padding: '10px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <button onClick={() => iniciarEdicion(empleado)} style={{ padding: '4px 8px', cursor: 'pointer', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '3px', fontSize: '12px', flex: 1 }}>Editar</button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaGeneral;