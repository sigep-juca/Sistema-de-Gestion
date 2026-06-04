import React, { useState, useEffect } from 'react';
import {
  BiBarChartAlt2, BiPieChartAlt2, BiLineChart, BiCalendarCheck
} from "react-icons/bi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// ─── PALETA CONSISTENTE ────────────────────────────────────────────────────
const PALETTE = [
  '#0056b3', '#28a745', '#fd7e14', '#6f42c1',
  '#dc3545', '#06b6d4', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#8b5cf6', '#ef4444',
  '#14b8a6', '#f97316'
];

// ─── TOOLTIP PERSONALIZADO ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1f2937', color: '#f9fafb', padding: '10px 14px',
        borderRadius: '8px', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        {label && <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#d1d5db' }}>{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ margin: '2px 0', color: p.color || '#fff' }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── TOOLTIP PARA PIE ──────────────────────────────────────────────────────
const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const total = payload[0]?.payload?.total || null;
    return (
      <div style={{
        background: '#1f2937', color: '#f9fafb', padding: '10px 14px',
        borderRadius: '8px', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        <p style={{ margin: '0', fontWeight: '600' }}>{payload[0].name}</p>
        <p style={{ margin: '4px 0 0 0' }}>
          {payload[0].value} empleados
          {total && <span style={{ color: '#9ca3af' }}> ({((payload[0].value / total) * 100).toFixed(1)}%)</span>}
        </p>
      </div>
    );
  }
  return null;
};

// ─── COMPONENTE ESTADO VACÍO ───────────────────────────────────────────────
const EmptyState = ({ mensaje = "Sin datos disponibles" }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '200px', color: '#9ca3af'
  }}>
    <span style={{ fontSize: '36px', marginBottom: '8px' }}>📊</span>
    <p style={{ margin: 0, fontSize: '14px' }}>{mensaje}</p>
  </div>
);

// ─── COMPONENTE SPINNER ────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px', flexDirection: 'column', gap: '12px'
  }}>
    <div style={{
      width: '36px', height: '36px', border: '4px solid #e5e7eb',
      borderTop: '4px solid #0056b3', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Cargando métricas de JUCA TECNO...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── CARD WRAPPER ──────────────────────────────────────────────────────────
const Card = ({ icon, iconColor, title, subtitle, children }) => (
  <div style={{
    backgroundColor: '#ffffff', padding: '24px', borderRadius: '14px',
    border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column', minHeight: '380px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px',
        backgroundColor: `${iconColor}18`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        {React.cloneElement(icon, { style: { fontSize: '22px', color: iconColor } })}
      </div>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0' }}>{title}</h2>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '3px 0 0 0' }}>{subtitle}</p>
      </div>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

// ─── COMPONENTE KPI ────────────────────────────────────────────────────────
const KPIBadge = ({ valor, label, color }) => (
  <div style={{
    background: `${color}12`, border: `1px solid ${color}30`,
    borderRadius: '8px', padding: '10px 16px', textAlign: 'center', flex: 1
  }}>
    <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color }}>{valor}</p>
    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>{label}</p>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════
const Graficas = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dashboard_stats');
        if (response.ok) {
          const json = await response.json();
          setData(json);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error al conectar con la API:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Spinner />;

  if (error || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#ef4444' }}>
        <span style={{ fontSize: '40px' }}>⚠️</span>
        <p style={{ fontWeight: '600', marginTop: '12px' }}>No se pudo conectar con el servidor.</p>
        <p style={{ color: '#6b7280', fontSize: '13px' }}>Verifica que Flask esté corriendo en el puerto 5000.</p>
      </div>
    );
  }

  // ── PROCESAMIENTO DE DATOS ─────────────────────────────────────────────

  // 1. Asistencia mensual
  const dataAsistencia = data.asistencia_mensual && data.asistencia_mensual.length > 0
    ? data.asistencia_mensual.map(item => ({
        name: item.id_status_dia === 1 ? 'Asistencias' :
              item.id_status_dia === 2 ? 'Faltas' :
              item.id_status_dia === 3 ? 'Retardos' : 'Otros',
        Cantidad: item.total,
        fill: item.id_status_dia === 1 ? '#0056b3' :
              item.id_status_dia === 2 ? '#dc3545' : '#fd7e14'
      }))
    : null;

  // 2. Tiendas — barras horizontales con el NOMBRE REAL
  const dataTiendas = data.empleados_tienda && data.empleados_tienda.length > 0
    ? [...data.empleados_tienda]
        .sort((a, b) => b.cantidad - a.cantidad)
        .map(item => ({
          name: item.tienda || `Tienda ${item.id_tienda}`,
          Empleados: item.cantidad
        }))
    : null;

  // 3. Horas trabajadas — top 10
  const dataHorasRaw = data.horas_trabajadas && data.horas_trabajadas.length > 0
    ? data.horas_trabajadas : null;
  const dataHoras = dataHorasRaw
    ? [...dataHorasRaw]
        .sort((a, b) => b.promedio_horas - a.promedio_horas)
        .slice(0, 10)
    : null;

  // 4. Puntualidad — parseamos explícitamente a números usando Number() para romper el bug
  const aTiempo = Number(data.puntualidad?.a_tiempo || 0);
  const incidencias = Number(data.puntualidad?.incidencias || 0);
  const totalPuntualidad = aTiempo + incidencias;
  const pctPuntualidad = totalPuntualidad > 0
    ? Math.round((aTiempo / totalPuntualidad) * 100) : 0;
  
  const dataPuntualidad = totalPuntualidad > 0
    ? [
        { name: 'A Tiempo', value: aTiempo },
        { name: 'Incidencias', value: incidencias }
      ]
    : null;

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      padding: '28px', backgroundColor: '#f8fafc',
      minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif"
    }}>

      {/* ENCABEZADO */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
          Gráficas y Estadísticas
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
          Monitoreo e indicadores clave del personal de JUCA TECNO.
        </p>
      </div>

      {/* GRID 2×2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: '24px'
      }}>

        {/* ── CARD 1: ASISTENCIA MENSUAL ── */}
        <Card
          icon={<BiBarChartAlt2 />}
          iconColor="#0056b3"
          title="Asistencia Mensual"
          subtitle="Asistencias, faltas y retardos del período activo."
        >
          {!dataAsistencia ? <EmptyState mensaje="Sin registros de asistencia este período." /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dataAsistencia} margin={{ bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 13 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Cantidad" radius={[6, 6, 0, 0]} maxBarSize={80}>
                  {dataAsistencia.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* ── CARD 2: EMPLEADOS POR TIENDA ── */}
        <Card
          icon={<BiPieChartAlt2 />}
          iconColor="#28a745"
          title="Empleados por Tienda"
          subtitle="Distribución del personal por sucursal, ordenado de mayor a menor."
        >
          {!dataTiendas ? <EmptyState mensaje="Sin datos de tiendas." /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={dataTiendas}
                layout="vertical"
                margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Empleados" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {dataTiendas.map((_, index) => (
                    <Cell key={index} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* ── CARD 3: TOP 10 HORAS TRABAJADAS ── */}
        <Card
          icon={<BiLineChart />}
          iconColor="#fd7e14"
          title="Top 10 – Horas Trabajadas"
          subtitle="Empleados con mayor promedio de horas trabajadas."
        >
          {!dataHoras ? <EmptyState mensaje="Sin registros de horas trabajadas." /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={dataHoras}
                layout="vertical"
                margin={{ left: 10, right: 40, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  unit=" hrs"
                  domain={[0, 12]}
                />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={110}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="promedio_horas"
                  name="Hrs Promedio"
                  fill="#fd7e14"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={18}
                  label={{
                    position: 'right',
                    fontSize: 11,
                    fill: '#475569',
                    formatter: (v) => `${v}h`
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* ── CARD 4: PUNTUALIDAD CON KPI CENTRAL CORREGIDA ── */}
        <Card
          icon={<BiCalendarCheck />}
          iconColor="#6f42c1"
          title="Puntualidad Colectiva"
          subtitle="Porcentaje de asistencias a tiempo vs incidencias."
        >
          {!dataPuntualidad ? <EmptyState mensaje="Sin datos de puntualidad." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

              {/* KPI NUMÉRICO */}
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '4px' }}>
                <KPIBadge valor={`${pctPuntualidad}%`} label="Puntualidad" color="#6f42c1" />
                <KPIBadge valor={aTiempo} label="A Tiempo" color="#28a745" />
                <KPIBadge valor={incidencias} label="Incidencias" color="#dc3545" />
              </div>

              {/* DONA */}
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={dataPuntualidad}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={4}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#28a745" name="A Tiempo" />
                    <Cell fill="#dc3545" name="Incidencias" />
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={28}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color, fontSize: '13px', fontWeight: '600' }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};

export default Graficas;