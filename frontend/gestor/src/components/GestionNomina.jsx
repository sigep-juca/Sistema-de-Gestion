import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// --- IMPORTAMOS LOS ICONOS PROFESIONALES ---
import { FaFileExcel, FaFilePdf } from "react-icons/fa"; // Para los archivos
import { BiEdit } from "react-icons/bi"; // Para el botón de editar

const GestionNomina = () => {
  // Inicializamos el estado vacío porque los datos vendrán de la base de datos
  const [empleados, setEmpleados] = useState([]);

  // Usamos useEffect para cargar los datos desde Flask al abrir la pestaña
  useEffect(() => {
    const obtenerNominaReal = async () => {
      try {
        const response = await fetch('http://localhost:5000/nomina_real');
        if (response.ok) {
          const data = await response.json();
          setEmpleados(data);
        }
      } catch (error) {
        console.error("Error al obtener la nómina:", error);
      }
    };
    obtenerNominaReal();
  }, []);

  // Tu backend ya filtra a los empleados activos (WHERE e.id_status = 1)
  const empleadosActivos = empleados;

  const [editandoId, setEditandoId] = useState(null);
  const [datosEditados, setDatosEditados] = useState({});

  const iniciarEdicion = (empleado) => {
    setEditandoId(empleado.id);
    setDatosEditados(empleado);
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

  // Esta función solo los cambia visualmente en la tabla.
  const guardarCambios = async (id) => {
    try {
      // Enviamos el ID y los datos editados (que traen el nuevo pago_quincenal) al backend
      const response = await fetch('http://localhost:5000/actualizar_salario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          pago_quincenal: datosEditados.pago_quincenal
        })
      });

      if (response.ok) {
        // Si el backend responde chido, actualizamos el estado visual en React
        const nuevosEmpleados = empleados.map((emp) => 
          emp.id === id ? datosEditados : emp
        );
        setEmpleados(nuevosEmpleados);
        setEditandoId(null);
        alert("¡Sueldo actualizado con éxito en MariaDB!");
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
      'Salario Mensual': emp.salario_fijo,
      'Pago Quincenal': emp.pago_quincenal
    }));
    const hoja = XLSX.utils.json_to_sheet(datosExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Nómina");
    XLSX.writeFile(libro, "Nomina_Quincenal.xlsx");
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Nómina Quincenal", 14, 15);
    const columnas = ["ID", "Nombre", "Salario Fijo", "Pago Quincenal"];
    const filas = empleadosActivos.map(emp => [
      emp.id, emp.nombre, `$${emp.salario_fijo}`, `$${emp.pago_quincenal}`
    ]);
    autoTable(doc, { head: [columnas], body: filas, startY: 20 });
    doc.save("Nomina_Quincenal.pdf");
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', minHeight: '50px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>Procesamiento de Nómina Quincenal</h2>
          <p style={{ margin: 0, color: '#6c757d' }}>Ajusta el pago quincenal antes de exportar los reportes para Contabilidad.</p>
        </div>
        
        {/* --- BOTONES CON NUEVOS ICONOS --- */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={exportarExcel} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', backgroundColor: '#1d6f42', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <FaFileExcel fontSize="16px" /> Excel
          </button>
          <button 
            onClick={exportarPDF} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <FaFilePdf fontSize="16px" /> PDF
          </button>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#e3f2fd', textAlign: 'left' }}>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>ID</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Nombre</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Salario Fijo ($)</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Pago Quincenal ($)</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {empleadosActivos.map((empleado) => (
            <tr key={empleado.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>{empleado.id}</td>
              <td style={{ padding: '10px' }}>{empleado.nombre}</td>
              
              {editandoId === empleado.id ? (
                <>
                  <td style={{ padding: '10px' }}>${empleado.salario_fijo}</td>
                  <td style={{ padding: '10px' }}>
                    <input type="number" name="pago_quincenal" value={datosEditados.pago_quincenal} onChange={manejarCambio} style={{ width: '90px' }} />
                  </td>
                  <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
                    <button onClick={() => guardarCambios(empleado.id)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px' }}>Guardar</button>
                    <button onClick={cancelarEdicion} style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px' }}>Cancelar</button>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ padding: '10px' }}>${empleado.salario_fijo}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#0056b3' }}>${empleado.pago_quincenal}</td>
                  <td style={{ padding: '10px' }}>
                    {/* --- BOTÓN DE EDITAR CON ICONO VECTORIAL --- */}
                    <button 
                      onClick={() => iniciarEdicion(empleado)} 
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#ffc107', color: 'black', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px' }}
                    >
                      <BiEdit fontSize="16px" /> Editar
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GestionNomina; #aa