import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaFileExcel, FaFilePdf } from "react-icons/fa"; 
import { BiEdit } from "react-icons/bi";

const GestionNomina = () => {
  const [empleados, setEmpleados] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [datosEditados, setDatosEditados] = useState({});

  const [mesSeleccionado, setMesSeleccionado] = useState('2026-06');
  const [quincenaSeleccionada, setQuincenaSeleccionada] = useState('1');

  const cargarNomina = async () => {
    try {
      const url = `http://localhost:5000/nomina_real?mes=${mesSeleccionado}&quincena=${quincenaSeleccionada}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setEmpleados(data);
      }
    } catch (error) {
      console.error("Error al obtener la nómina:", error);
    }
  };

  useEffect(() => {
    cargarNomina();
  }, [mesSeleccionado, quincenaSeleccionada]);

  const empleadosActivos = empleados;

  const granTotalNomina = empleadosActivos.reduce((acc, emp) => acc + (emp.pago_quincenal || 0), 0);

  const iniciarEdicion = (empleado) => {
    setEditandoId(empleado.id);
    const cuentaActual = empleado.clabe || empleado.num_tarjeta || empleado.num_cuenta || '';
    setDatosEditados({ ...empleado, cuenta_editar: cuentaActual });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setDatosEditados({});
  };

  const manejarCambio = (e) => {
    setDatosEditados({
      ...datosEditados,
      [e.target.name]: e.target.value
    });
  };

  const guardarCambios = async (id) => {
    try {
      const response = await fetch('http://localhost:5000/actualizar_salario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          pago_quincenal: datosEditados.pago_quincenal_teorico,
          banco: datosEditados.banco,
          cuenta: datosEditados.cuenta_editar
        })
      });

      if (response.ok) {
        setEditandoId(null);
        alert("¡Datos contractuales actualizados con éxito!");
        cargarNomina(); 
      } else {
        alert("Hubo un error al guardar en el servidor.");
      }
    } catch (error) {
      console.error("Error al conectar con la API:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const exportarExcel = () => {
    const datosExcel = empleadosActivos.map(emp => ({
      'ID': emp.id,
      'Nombre del Empleado': emp.nombre,
      'Banco': emp.banco || 'S/B',
      'Cuenta': emp.clabe || emp.num_tarjeta || emp.num_cuenta || 'S/C',
      'Tiempo Registrado': emp.tiempo_registrado || 0,
      'Tarifa': emp.tarifa_display,
      'Base Quincenal ($)': emp.pago_quincenal_teorico,
      'Total Calculado ($)': emp.pago_quincenal
    }));

    datosExcel.push({
      'ID': '', 'Nombre del Empleado': '', 'Banco': '', 'Cuenta': '', 'Tiempo Registrado': '', 'Tarifa': '',
      'Base Quincenal ($)': 'TOTAL NÓMINA:',
      'Total Calculado ($)': granTotalNomina.toFixed(2)
    });

    const hoja = XLSX.utils.json_to_sheet(datosExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, `Q${quincenaSeleccionada}_${mesSeleccionado}`);
    XLSX.writeFile(libro, `Nomina_Q${quincenaSeleccionada}_${mesSeleccionado}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF('landscape'); 
    doc.setFontSize(14);
    doc.text("JUCA TECNO S. DE R.L DE C.V", 14, 15);
    doc.setFontSize(10);
    doc.text(`Reporte de Nómina Exacta - Quincena ${quincenaSeleccionada} de ${mesSeleccionado}`, 14, 22);
    
    // Cambiamos los títulos para que sean genéricos (Tiempo y Tarifa)
    const columnas = ["ID", "Nombre", "Banco", "Cuenta", "Tiempo", "Tarifa", "Base Quincenal", "Total a Pagar"];
    const filas = empleadosActivos.map(emp => [
      emp.id, 
      emp.nombre, 
      emp.banco || 'S/B',
      emp.clabe || emp.num_tarjeta || emp.num_cuenta || 'S/C',
      emp.tiempo_registrado || 0,
      emp.tarifa_display,
      `$${emp.pago_quincenal_teorico}`, 
      `$${emp.pago_quincenal}`
    ]);

    filas.push([{ content: 'TOTAL GENERAL DE NÓMINA', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } }, `$${granTotalNomina.toFixed(2)}`]);

    autoTable(doc, { 
      head: [columnas], 
      body: filas, 
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 86, 179] }
    });
    doc.save(`Nomina_Q${quincenaSeleccionada}_${mesSeleccionado}.pdf`);
  };

  const thStyle = { padding: '8px 6px', borderBottom: '2px solid #ddd', fontSize: '12px', backgroundColor: '#e3f2fd', textAlign: 'left', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '8px 6px', borderBottom: '1px solid #ddd', fontSize: '12px' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>Procesamiento de Nómina Exacta</h2>
          <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>Cálculo automático basado en tiempo real trabajado por periodo.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', backgroundColor: '#fff', padding: '6px', borderRadius: '6px', border: '1px solid #ddd' }}>
            <select 
              value={quincenaSeleccionada} 
              onChange={(e) => setQuincenaSeleccionada(e.target.value)}
              style={{ padding: '6px', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
            >
              <option value="1">1ra Quincena (Días 1-15)</option>
              <option value="2">2da Quincena (Días 16-Fin)</option>
            </select>
            <div style={{ width: '1px', backgroundColor: '#ddd' }}></div>
            <select 
              value={mesSeleccionado} 
              onChange={(e) => setMesSeleccionado(e.target.value)}
              style={{ padding: '6px', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '13px' }}
            >
              <option value="2026-06">Junio 2026</option>
              <option value="2026-05">Mayo 2026</option>
              <option value="2026-04">Abril 2026</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={exportarExcel} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', backgroundColor: '#1d6f42', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
              <FaFileExcel fontSize="14px" /> Excel
            </button>
            <button onClick={exportarPDF} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
              <FaFilePdf fontSize="14px" /> PDF
            </button>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '950px' }}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Banco</th>
              <th style={thStyle}>Cuenta</th>
              <th style={{...thStyle, textAlign: 'center'}}>Tiempo</th>
              <th style={thStyle}>Tarifa</th>
              <th style={thStyle}>Base Quincenal</th>
              <th style={thStyle}>Total a Pagar</th>
              <th style={{...thStyle, textAlign: 'center'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleadosActivos.map((empleado) => {
              const cuentaMostrar = empleado.clabe || empleado.num_tarjeta || empleado.num_cuenta || 'S/C';

              return (
                <tr key={empleado.id} style={{ backgroundColor: editandoId === empleado.id ? '#fdfbf7' : 'transparent' }}>
                  <td style={tdStyle}>{empleado.id}</td>
                  <td style={{ ...tdStyle, fontWeight: '500' }}>{empleado.nombre}</td>
                  
                  {editandoId === empleado.id ? (
                    <>
                      <td style={tdStyle}>
                        <select 
                          name="banco" 
                          value={datosEditados.banco || ''} 
                          onChange={manejarCambio}
                          style={{ width: '100px', padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #ced4da' }}
                        >
                          <option value="">N/A</option>
                          <option value="BBVA">BBVA</option>
                          <option value="BANAMEX">BANAMEX</option>
                          <option value="SANTANDER">SANTANDER</option>
                          <option value="AZTECA">AZTECA</option>
                          <option value="BANCOPPEL">BANCOPPEL</option>
                          <option value="MERCADO PAGO">MERCADO PAGO</option>
                          <option value="NU">NU</option>
                          <option value="KLAR">KLAR</option>
                          <option value="AFIRME">AFIRME</option>
                        </select>
                      </td>
                      
                      <td style={tdStyle}>
                        <input 
                          type="text" 
                          name="cuenta_editar" 
                          value={datosEditados.cuenta_editar} 
                          onChange={manejarCambio} 
                          placeholder="Ingresar cuenta"
                          style={{ width: '130px', padding: '4px', fontSize: '11px', fontFamily: 'monospace', borderRadius: '4px', border: '1px solid #ced4da' }} 
                        />
                      </td>

                      {/* Recibimos el texto dinámico del backend ("X hrs" o "X días") */}
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#6c757d' }}>{empleado.tiempo_registrado}</td>
                      <td style={{ ...tdStyle, color: '#6c757d' }}>{empleado.tarifa_display}</td>

                      <td style={tdStyle}>
                        <input 
                          type="number" 
                          name="pago_quincenal_teorico" 
                          value={datosEditados.pago_quincenal_teorico} 
                          onChange={manejarCambio} 
                          title="Sueldo base contratado por quincena"
                          style={{ width: '70px', padding: '4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #0056b3' }} 
                        />
                      </td>

                      <td style={{ ...tdStyle, fontWeight: 'bold', color: '#adb5bd' }}>Automático</td>

                      <td style={{ ...tdStyle, display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button onClick={() => guardarCambios(empleado.id)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '4px 8px', cursor: 'pointer', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold' }}>Guardar</button>
                        <button onClick={cancelarEdicion} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '4px 8px', cursor: 'pointer', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold' }}>X</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={tdStyle}>{empleado.banco || 'S/B'}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#495057' }}>{cuentaMostrar}</td>
                      
                      {/* Vista limpia sin símbolos duplicados */}
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>{empleado.tiempo_registrado || '0 hrs'}</td>
                      <td style={tdStyle}>{empleado.tarifa_display}</td>
                      <td style={{ ...tdStyle, color: '#6c757d' }}>${empleado.pago_quincenal_teorico}</td>
                      <td style={{ ...tdStyle, fontWeight: '800', color: '#0056b3', fontSize: '13px' }}>${empleado.pago_quincenal}</td>
                      
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <button 
                          onClick={() => iniciarEdicion(empleado)} 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ffc107', color: 'black', border: 'none', padding: '4px 10px', cursor: 'pointer', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}
                        >
                          <BiEdit fontSize="13px" /> Editar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionNomina;