import React, { useState, useEffect } from 'react';
import {
  BiBarChartAlt2, BiPieChartAlt2, BiLineChart, BiCalendarCheck, BiStore, BiUser
} from "react-icons/bi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const API_BASE = 'http://localhost:5000';

const PALETTE = [
  '#0056b3', '#28a745', '#fd7e14', '#6f42c1',
  '#dc3545', '#06b6d4', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#8b5cf6', '#ef4444',
  '#14b8a6', '#f97316'
];

const STATUS_COLOR = {
  'Asistencia': '#0056b3',
  'Falta': '#dc3545',
  'Retardo': '#fd7e14',
};

// ─── TOOLTIPS ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1f2937', color: '#f9fafb', padding: '10px 14px',
        borderRadius: '8px', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        {label && <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#d1d5db' }}>{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ margin: '2px 0', color: p.color || p.fill || '#fff' }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const EmptyState = ({ mensaje = "Sin datos disponibles" }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '200px', color: '#9ca3af'
  }}>
    <span style={{ fontSize: '36px', marginBottom: '8px' }}>📊</span>
    <p style={{ margin: 0, fontSize: '14px', textAlign: 'center' }}>{mensaje}</p>
  </div>
);

const Spinner = ({ texto = "Cargando métricas de JUCA TECNO..." }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px', flexDirection: 'column', gap: '12px'
  }}>
    <div style={{
      width: '36px', height: '36px', border: '4px solid #e5e7eb',
      borderTop: '4px solid #0056b3', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>{texto}</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const Card = ({ icon, iconColor, title, subtitle, children }) => (
  <div style={{
    backgroundColor: '#ffffff', padding: '24px', borderRadius: '14px',
    border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column'
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>{children}</div>
  </div>
);

const KPIBadge = ({ valor, label, color }) => (
  <div style={{
    background: `${color}12`, border: `1px solid ${color}30`,
    borderRadius: '8px', padding: '10px 16px', textAlign: 'center', flex: 1
  }}>
    <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color }}>{valor}</p>
    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>{label}</p>
  </div>
);

// ─── TICK PERSONALIZADO: envuelve nombres largos en 2 líneas dentro del eje Y ──
const WrappedYAxisTick = ({ x, y, payload }) => {
  const palabras = String(payload.value).split(' ');
  let lineas = [];

  if (palabras.length <= 1) {
    lineas = [palabras.join(' ')];
  } else {
    // Reparte las palabras en 2 líneas balanceadas
    const mitad = Math.ceil(palabras.length / 2);
    lineas = [palabras.slice(0, mitad).join(' '), palabras.slice(mitad).join(' ')];
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} textAnchor="end" fill="#64748b" fontSize={10}>
        {lineas.map((linea, i) => (
          <tspan key={i} x={0} dy={i === 0 ? (lineas.length > 1 ? -4 : 4) : 12}>
            {linea}
          </tspan>
        ))}
      </text>
    </g>
  );
};

// ─── SELECTOR ESTILIZADO ────────────────────────────────────────────────
const SelectFiltro = ({ value, onChange, options, placeholder, icon }) => (
  <div style={{ position: 'relative', minWidth: '200px' }}>
    <select
      value={value}
      onChange={onChange}
      style={{
        width: '100%', padding: '10px 14px 10px 38px', borderRadius: '10px',
        border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: '13px',
        fontWeight: '600', color: '#1f2937', appearance: 'none', cursor: 'pointer'
      }}
    >
      <option value="">{placeholder}</option>
      {options}
    </select>
    <span style={{
      position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
      fontSize: '16px', color: '#6b7280', pointerEvents: 'none'
    }}>{icon}</span>
  </div>
);

// ══════════════════════════════════════════════════════════════════════
const Graficas = () => {
  const [filtros, setFiltros] = useState({ tiendas: [], empleados: [] });
  const [mes, setMes] = useState('');
  const [tiendaId, setTiendaId] = useState('');
  const [empleadoId, setEmpleadoId] = useState('');

  const [dataGeneral, setDataGeneral] = useState(null);
  const [dataTienda, setDataTienda] = useState(null);
  const [dataEmpleado, setDataEmpleado] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Cargar opciones de selects una sola vez
  useEffect(() => {
    fetch(`${API_BASE}/api/dashboard_filtros`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(json => setFiltros(json))
      .catch(() => console.error("No se pudieron cargar los filtros."));
  }, []);

  // Cargar datos según el modo activo (general / tienda / empleado)
  useEffect(() => {
    setLoading(true);
    setError(false);

    const qsMes = mes ? `&mes=${mes}` : '';

    let url;
    if (empleadoId) {
      url = `${API_BASE}/api/dashboard_stats_empleado?id_empleado=${empleadoId}${qsMes}`;
    } else if (tiendaId) {
      url = `${API_BASE}/api/dashboard_stats_tienda?id_tienda=${tiendaId}${qsMes}`;
    } else {
      url = `${API_BASE}/api/dashboard_stats?${qsMes.replace('&', '')}`;
    }

    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(json => {
        if (empleadoId) setDataEmpleado(json);
        else if (tiendaId) setDataTienda(json);
        else setDataGeneral(json);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [mes, tiendaId, empleadoId]);

  const handleTiendaChange = (e) => {
    setTiendaId(e.target.value);
    setEmpleadoId('');
  };
  const handleEmpleadoChange = (e) => {
    setEmpleadoId(e.target.value);
    if (e.target.value) setTiendaId('');
  };

  const modo = empleadoId ? 'empleado' : tiendaId ? 'tienda' : 'general';

  return (
    <div style={{
      padding: '28px', backgroundColor: '#f8fafc',
      minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif"
    }}>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        flexWrap: 'wrap', gap: '16px', marginBottom: '28px'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
            Gráficas y Estadísticas
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
            {modo === 'general' && "Monitoreo e indicadores clave del personal de JUCA TECNO."}
            {modo === 'tienda' && `Indicadores filtrados por sucursal.`}
            {modo === 'empleado' && `Indicadores individuales del empleado.`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <SelectFiltro
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            placeholder="Mes Actual (En curso)"
            options={Array.from({ length: 6 }, (_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const value = d.toISOString().slice(0, 7);
              const label = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
              return <option key={value} value={value}>{label}</option>;
            })}
          />

          <SelectFiltro
            value={tiendaId}
            onChange={handleTiendaChange}
            placeholder="Todas las tiendas"
            options={filtros.tiendas.map(t => (
              <option key={t.id_tienda} value={t.id_tienda}>{t.nombre}</option>
            ))}
          />

          <SelectFiltro
            value={empleadoId}
            onChange={handleEmpleadoChange}
            placeholder="Todos los empleados"
            options={filtros.empleados.map(e => (
              <option key={e.id_empleado} value={e.id_empleado}>{e.nombre}</option>
            ))}
          />
        </div>
      </div>

      {loading && <Spinner />}

      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#ef4444' }}>
          <span style={{ fontSize: '40px' }}>⚠️</span>
          <p style={{ fontWeight: '600', marginTop: '12px' }}>No se pudo conectar con el servidor.</p>
          <p style={{ color: '#6b7280', fontSize: '13px' }}>Verifica que Flask esté corriendo en el puerto 5000.</p>
        </div>
      )}

      {!loading && !error && modo === 'general' && dataGeneral && (
        <VistaGeneral data={dataGeneral} />
      )}

      {!loading && !error && modo === 'tienda' && dataTienda && (
        <VistaTienda data={dataTienda} />
      )}

      {!loading && !error && modo === 'empleado' && dataEmpleado && (
        <VistaEmpleado data={dataEmpleado} />
      )}

    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// VISTA GENERAL (sin filtros) — las 4 gráficas originales
// ══════════════════════════════════════════════════════════════════════
const VistaGeneral = ({ data }) => {
  const dataAsistencia = data.asistencia_mensual?.length > 0
    ? data.asistencia_mensual.map(item => ({
        name: item.id_status_dia === 1 ? 'Asistencias' :
              item.id_status_dia === 2 ? 'Faltas' :
              item.id_status_dia === 3 ? 'Retardos' : 'Otros',
        Cantidad: item.total,
        fill: item.id_status_dia === 1 ? '#0056b3' :
              item.id_status_dia === 2 ? '#dc3545' : '#fd7e14'
      }))
    : null;

  const dataTiendas = data.empleados_tienda?.length > 0
    ? [...data.empleados_tienda]
        .sort((a, b) => b.cantidad - a.cantidad)
        .map(item => ({ name: item.tienda || `Tienda ${item.id_tienda}`, Empleados: item.cantidad }))
    : null;

  const totalEmpleadosGeneral = data.total_empleados_general ?? null;

  const dataHoras = data.horas_trabajadas?.length > 0
    ? [...data.horas_trabajadas].sort((a, b) => b.promedio_horas - a.promedio_horas).slice(0, 10)
    : null;

  const aTiempo = data.puntualidad?.a_tiempo || 0;
  const incidencias = data.puntualidad?.incidencias || 0;
  const total = aTiempo + incidencias;
  const pct = total > 0 ? Math.round((aTiempo / total) * 100) : 0;
  const dataPuntualidad = total > 0 ? [{ name: 'A Tiempo', value: aTiempo }, { name: 'Incidencias', value: incidencias }] : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>

      <Card icon={<BiBarChartAlt2 />} iconColor="#0056b3" title="Asistencia Mensual" subtitle="Asistencias, faltas y retardos del período activo.">
        {!dataAsistencia ? <EmptyState mensaje="Sin registros de asistencia este período." /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dataAsistencia} margin={{ bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 13 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Cantidad" radius={[6, 6, 0, 0]} maxBarSize={80}>
                {dataAsistencia.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card icon={<BiPieChartAlt2 />} iconColor="#28a745" title="Empleados por Tienda" subtitle="Distribución del personal por sucursal, ordenado de mayor a menor.">
        {!dataTiendas ? <EmptyState mensaje="Sin datos de tiendas." /> : (
          <>
            {totalEmpleadosGeneral !== null && (
              <div style={{
                background: '#28a74512', border: '1px solid #28a74530',
                borderRadius: '8px', padding: '10px 16px', textAlign: 'center', marginBottom: '14px'
              }}>
                <span style={{ fontSize: '22px', fontWeight: '800', color: '#28a745' }}>{totalEmpleadosGeneral}</span>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', marginLeft: '8px' }}>
                  empleados activos en total (todas las sucursales)
                </span>
              </div>
            )}
            <ResponsiveContainer width="100%" height={Math.max(260, dataTiendas.length * 32)}>
              <BarChart data={dataTiendas} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={<WrappedYAxisTick />}
                  interval={0}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Empleados" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {dataTiendas.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </Card>

      <Card icon={<BiLineChart />} iconColor="#fd7e14" title="Top 10 – Horas Trabajadas" subtitle="Empleados con mayor promedio de horas trabajadas.">
        {!dataHoras ? <EmptyState mensaje="Sin registros de horas trabajadas." /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dataHoras} layout="vertical" margin={{ left: 10, right: 40, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} unit=" hrs" domain={[0, 12]} />
              <YAxis type="category" dataKey="nombre" width={110} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="promedio_horas" name="Hrs Promedio" fill="#fd7e14" radius={[0, 6, 6, 0]} maxBarSize={18}
                label={{ position: 'right', fontSize: 11, fill: '#475569', formatter: (v) => `${v}h` }} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card icon={<BiCalendarCheck />} iconColor="#6f42c1" title="Puntualidad Colectiva" subtitle="Porcentaje de asistencias a tiempo vs incidencias.">
        {!dataPuntualidad ? <EmptyState mensaje="Sin datos de puntualidad." /> : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '4px' }}>
              <KPIBadge valor={`${pct}%`} label="Puntualidad" color="#6f42c1" />
              <KPIBadge valor={aTiempo} label="A Tiempo" color="#28a745" />
              <KPIBadge valor={incidencias} label="Incidencias" color="#dc3545" />
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={dataPuntualidad} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                  <Cell fill="#28a745" />
                  <Cell fill="#dc3545" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={28} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// VISTA TIENDA — Asistencia/faltas de la tienda + horas por empleado
// ══════════════════════════════════════════════════════════════════════
const VistaTienda = ({ data }) => {
  const dataAsistencia = data.asistencia?.length > 0
    ? data.asistencia.map(item => ({
        name: item.id_status_dia === 1 ? 'Asistencias' :
              item.id_status_dia === 2 ? 'Faltas' :
              item.id_status_dia === 3 ? 'Retardos' : 'Otros',
        Cantidad: item.total,
        fill: item.id_status_dia === 1 ? '#0056b3' :
              item.id_status_dia === 2 ? '#dc3545' : '#fd7e14'
      }))
    : null;

  const dataHoras = data.horas_por_empleado?.length > 0 ? data.horas_por_empleado : null;

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #0056b315, #0056b305)', border: '1px solid #0056b330',
        borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '14px'
      }}>
        <BiStore style={{ fontSize: '28px', color: '#0056b3' }} />
        <div>
          <p style={{ margin: 0, fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>{data.nombre_tienda}</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{data.total_empleados} empleados activos en esta sucursal</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>

        <Card icon={<BiBarChartAlt2 />} iconColor="#0056b3" title="Asistencia de la Tienda" subtitle="Asistencias, faltas y retardos de esta sucursal.">
          {!dataAsistencia ? <EmptyState mensaje="Sin registros de asistencia para esta tienda en el período." /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dataAsistencia} margin={{ bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 13 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Cantidad" radius={[6, 6, 0, 0]} maxBarSize={80}>
                  {dataAsistencia.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card icon={<BiLineChart />} iconColor="#fd7e14" title="Horas Promedio por Empleado" subtitle="Ranking de horas trabajadas dentro de esta sucursal.">
          {!dataHoras ? <EmptyState mensaje="Sin registros de horas para los empleados de esta tienda." /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dataHoras} layout="vertical" margin={{ left: 10, right: 40, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} unit=" hrs" domain={[0, 12]} />
                <YAxis type="category" dataKey="nombre" width={120} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="promedio_horas" name="Hrs Promedio" fill="#fd7e14" radius={[0, 6, 6, 0]} maxBarSize={18}
                  label={{ position: 'right', fontSize: 11, fill: '#475569', formatter: (v) => `${v}h` }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// VISTA EMPLEADO — Línea de tiempo de horas + resumen de status
// ══════════════════════════════════════════════════════════════════════
const VistaEmpleado = ({ data }) => {
  const dataTimeline = data.timeline_horas?.length > 0 ? data.timeline_horas : null;

  const dataResumen = data.resumen_status?.length > 0
    ? data.resumen_status.map(item => ({
        name: item.descripcion || 'Otro',
        Cantidad: item.total,
        fill: STATUS_COLOR[item.descripcion] || '#6b7280'
      }))
    : null;

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #6f42c115, #6f42c105)', border: '1px solid #6f42c130',
        borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '14px'
      }}>
        <BiUser style={{ fontSize: '28px', color: '#6f42c1' }} />
        <div>
          <p style={{ margin: 0, fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>{data.nombre_empleado}</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Detalle individual de asistencia y horas trabajadas</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>

        <Card icon={<BiLineChart />} iconColor="#fd7e14" title="Horas Trabajadas por Día" subtitle="Evolución diaria dentro del período seleccionado.">
          {!dataTimeline ? <EmptyState mensaje="Sin registros de horas para este empleado en el período." /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dataTimeline} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="fecha" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit="h" domain={[0, 12]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="horas_trabajadas" name="Horas" stroke="#fd7e14" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card icon={<BiCalendarCheck />} iconColor="#6f42c1" title="Resumen de Asistencia" subtitle="Asistencias, faltas y retardos del período.">
          {!dataResumen ? <EmptyState mensaje="Sin registros de asistencia para este empleado." /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dataResumen} margin={{ bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 13 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Cantidad" radius={[6, 6, 0, 0]} maxBarSize={80}>
                  {dataResumen.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Graficas;
