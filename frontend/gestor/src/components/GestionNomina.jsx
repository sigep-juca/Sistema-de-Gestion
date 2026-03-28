import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// --- IMPORTAMOS LOS ICONOS PROFESIONALES ---
import { FaFileExcel, FaFilePdf } from "react-icons/fa"; // Para los archivos
import { BiEdit } from "react-icons/bi"; // Para el botón de editar

const GestionNomina = () => {
  const [empleados, setEmpleados] = useState([
    { id: 1, nombre: 'Ana López', puesto: 'Desarrolladora', salario: 15000, quincena: 7500, status: 'activo' },
    { id: 2, nombre: 'Carlos Ruiz', puesto: 'Diseñador', salario: 12000, quincena: 6000, status: 'inactivo' },
    { id: 3, nombre: 'Beto Diaz', puesto: 'Soporte', salario: 10000, quincena: 5000, status: 'activo' },
    { id: 4, nombre: 'Diana Pérez', puesto: 'Recursos Humanos', salario: 18000, quincena: 9000, status: 'activo' },
    { id: 5, nombre: 'Elena Gómez', puesto: 'Ventas', salario: 9000, quincena: 4500, status: 'inactivo' }
  ]);

  const empleadosActivos = empleados.filter(emp => emp.status === 'activo');

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

  const guardarCambios = (id) => {
    const nuevosEmpleados = empleados.map((emp) => 
      emp.id === id ? datosEditados : emp
    );
    setEmpleados(nuevosEmpleados);
    setEditandoId(null);
  };

  const exportarExcel = () => {
    const datosExcel = empleadosActivos.map(emp => ({
      'ID': emp.id,
      'Nombre del Empleado': emp.nombre,
      'Salario Mensual': emp.salario,
      'Pago Quincenal': emp.quincena
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
      emp.id, emp.nombre, `$${emp.salario}`, `$${emp.quincena}`
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
                  <td style={{ padding: '10px' }}>${empleado.salario}</td>
                  <td style={{ padding: '10px' }}>
                    <input type="number" name="quincena" value={datosEditados.quincena} onChange={manejarCambio} style={{ width: '90px' }} />
                  </td>
                  <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
                    <button onClick={() => guardarCambios(empleado.id)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px' }}>Guardar</button>
                    <button onClick={cancelarEdicion} style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px' }}>Cancelar</button>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ padding: '10px' }}>${empleado.salario}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#0056b3' }}>${empleado.quincena}</td>
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

export default GestionNomina;