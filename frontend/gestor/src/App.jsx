import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import TablaGeneral from './components/TablaGeneral.jsx';
import GestionNomina from './components/GestionNomina.jsx';
import ControlAsistencia from './components/ControlAsistencia.jsx';
import Login from './components/Login.jsx';
import logoEmpresa from './assets/JUCA.png'; 
import { HiExclamationTriangle } from "react-icons/hi2";

function App() {
  const location = useLocation();
  
  // --- EL CANDADO DEL SISTEMA ---
  // Si está en false, vemos el Login. Si está en true, vemos el sistema.
  const [autenticado, setAutenticado] = useState(false);

  const estiloBoton = (ruta) => ({
    padding: '10px 15px',
    backgroundColor: location.pathname === ruta ? '#0056b3' : '#e0e0e0',
    color: location.pathname === ruta ? 'white' : 'black',
    textDecoration: 'none',
    borderRadius: '5px',
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  });

  // Si no está autenticado, retornamos SOLO la pantalla de Login
  if (!autenticado) {
    return <Login onLoginExitoso={() => setAutenticado(true)} />;
  }

  // Si ya pasó el Login, mostramos todo el sistema
  return (
    <div style={{ padding: '0', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      
      <header style={{
        backgroundColor: 'white', padding: '10px 25px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={logoEmpresa} alt="Logo" style={{ height: '55px', width: 'auto', objectFit: 'contain' }} />
          <div style={{ borderLeft: '1px solid #ddd', paddingLeft: '15px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', color: '#0056b3', letterSpacing: '-0.5px' }}>
              JUCA TECNO S. DE R.L DE C.V
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#6c757d', fontWeight: 'bold' }}>
              Panel de Administración de Recursos Humanos
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ margin: 0, fontSize: '16px', color: '#333', fontWeight: 'normal', backgroundColor: '#e9ecef', padding: '5px 10px', borderRadius: '4px' }}>
            SIGEP - Sistema Integral
          </h1>
          {/* Botón para cerrar sesión */}
          <button 
            onClick={() => setAutenticado(false)}
            style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div style={{ padding: '0 25px 25px 25px' }}>
        <nav style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #dee2e6', paddingBottom: '10px' }}>
          <Link to="/" style={estiloBoton('/')}>1. Directorio General</Link>
          <Link to="/nomina" style={estiloBoton('/nomina')}>2. Nómina Quincenal</Link>
          <Link to="/asistencia" style={estiloBoton('/asistencia')}>3. Control de Asistencia y Horarios</Link>
        </nav>

        <main style={{ border: '1px solid #ddd', padding: '25px', borderRadius: '8px', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <Routes>
            <Route path="/" element={<TablaGeneral />} />
            <Route path="/nomina" element={<GestionNomina />} />
            {/* Aquí conectamos la Pestaña 3 */}
            <Route path="/asistencia" element={<ControlAsistencia />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;