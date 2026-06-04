import React, { useState } from 'react';
import logoEmpresa from '../assets/JUCA.png';

const Login = ({ onLoginExitoso }) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const manejarEnvio = (e) => {
    e.preventDefault(); 

    // Validación de prueba (El backend BRIANNNN  lo hará en el futuro)
    if (usuario === 'admin' && password === '12345') {
      setError('');
      onLoginExitoso(); 
    } else {
      setError('Usuario o contraseña incorrectos. Contacte a su administrador.');
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white', padding: '40px', borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px',
        textAlign: 'center'
      }}>
        
        <img src={logoEmpresa} alt="Logo" style={{ height: '60px', marginBottom: '20px' }} />
        
        <h2 style={{ color: '#0056b3', margin: '0 0 5px 0' }}>Juca Tecno</h2>
        <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '30px' }}>
          Acceso exclusivo para Administración y RH
        </p>

        <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>Usuario asignado</label>
            <input 
              type="text" 
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ingresa tu usuario"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          {error && <div style={{ color: '#dc3545', fontSize: '13px', backgroundColor: '#f8d7da', padding: '8px', borderRadius: '4px', textAlign: 'left' }}>{error}</div>}

          <button 
            type="submit" 
            style={{ 
              marginTop: '10px', padding: '12px', backgroundColor: '#0d6efd', 
              color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', 
              fontWeight: 'bold', fontSize: '15px' 
            }}>
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;