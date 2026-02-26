-- ============================================================
--  INSERTAR DATOS REALES - gestion_de_personal
--  Fuente: hoja "Tablas" del Excel nomina_febrero_1.xlsx
--  Fecha: Febrero 2026
-- ============================================================

USE gestion_de_personal;

-- ============================================================
-- 1. PUESTOS (limpiamos los nombres del Excel)
-- ============================================================
-- Nota: Ya teníamos Supervisora(1) y Vendedora(2) del script anterior
-- Agregamos los nuevos que encontramos en el Excel

INSERT INTO puesto (descripcion) VALUES
    ('Bodega'),
    ('Entrega');

-- Resultado final de puestos:
-- 1 = Supervisora
-- 2 = Vendedora
-- 3 = Bodega
-- 4 = Entrega

-- ============================================================
-- 2. TIENDAS (todas las de la empresa, tal como están en el Excel)
-- ============================================================
-- Todas son de JUCA (id_empresa = 1)

INSERT INTO tienda (nombre, id_empresa) VALUES
    ('TODAS',                           1),  -- id 1  (Monse cubre todas)
    ('CUAJIMALPA',                      1),  -- id 2
    ('CHALCO 2000-VALLE DE CHALCO-IXT', 1),  -- id 3
    ('IXTAPALUCA',                      1),  -- id 4
    ('CHALCO 2000',                     1),  -- id 5
    ('CHIMALHUACAN',                    1),  -- id 6
    ('IXTAPALUCA-VALLE',                1),  -- id 7
    ('ZUMPANGO',                        1),  -- id 8
    ('GRAN PATIO ECATEPEC',             1),  -- id 9
    ('HUEHUETOCA',                      1),  -- id 10
    ('ARAGON/CD AZTECA',                1),  -- id 11
    ('ROSARIO',                         1),  -- id 12
    ('PLAZA ECATEPEC',                  1),  -- id 13
    ('MARTIN CARRERA',                  1);  -- id 14

-- ============================================================
-- 3. EMPLEADOS
-- Orden: primero supervisoras (para poder asignar id_supervisor)
-- ============================================================
-- Campos: nombre, id_puesto, id_supervisor, id_status, id_tienda, id_horario, telefono, fecha_inicio, fecha_fin, comentario
-- id_horario = NULL (pendiente definir con la jefa)
-- id_status:  1=Activo, 2=Baja temporal, 3=Baja definitiva
-- fecha_inicio = 2026-01-01 como placeholder hasta tener la info real

-- --- SUPERVISORAS PRIMERO ---
INSERT INTO empleado (nombre, id_puesto, id_supervisor, id_status, id_tienda, id_horario, telefono, fecha_inicio) VALUES
    ('Irays Monserrath Rodriguez Quiroz', 1, NULL, 1,  1, NULL, NULL, '2026-01-01'),  -- id 1 - Monse
    ('Sinai Guevara Guerrero',           1, NULL, 1,  8, NULL, NULL, '2026-01-01'),  -- id 2 - Sinai
    ('Irene Michell Ramirez Montesinos', 1, NULL, 1, 11, NULL, NULL, '2026-01-01'),  -- id 3 - Irene
    ('Olivia Ceron Gutierrez',           1, NULL, 1, 12, NULL, NULL, '2026-01-01');  -- id 4 - Olivia

-- --- VENDEDORAS DE MONSE (id_supervisor = 1) ---
INSERT INTO empleado (nombre, id_puesto, id_supervisor, id_status, id_tienda, id_horario, telefono, fecha_inicio) VALUES
    ('Diana Alvarado De Jesus',          2, 1, 1,  2, NULL, NULL, '2026-01-01'),  -- id 5
    ('Claudia Moreno Cervantes',         2, 1, 1,  2, NULL, NULL, '2026-01-01'),  -- id 6
    ('Yazir Alexander Celis Sosa',       2, 1, 1,  3, NULL, NULL, '2026-01-01'),  -- id 7
    ('Ivonne Andrea Sandoval Salazar',   2, 1, 1,  4, NULL, NULL, '2026-01-01'),  -- id 8
    ('Karen Cristina Gallardo Merino',   2, 1, 1,  5, NULL, NULL, '2026-01-01'),  -- id 9
    ('Camila Valentin Hernandez Rico',   2, 1, 1,  6, NULL, NULL, '2026-01-01'),  -- id 10
    ('Cristian Jesus Lozano Angeles',    2, 1, 1,  7, NULL, NULL, '2026-01-01');  -- id 11

-- --- VENDEDORAS DE SINAI (id_supervisor = 2) ---
INSERT INTO empleado (nombre, id_puesto, id_supervisor, id_status, id_tienda, id_horario, telefono, fecha_inicio) VALUES
    ('Melany Arlette Mendez Licona',     2, 2, 1,  9, NULL, NULL, '2026-01-01'),  -- id 12
    ('Alma Virgen Mendoza Lugo',         2, 2, 1, 10, NULL, NULL, '2026-01-01'),  -- id 13
    ('Emanuel Guervara Guerrero',        2, 2, 1,  8, NULL, NULL, '2026-01-01');  -- id 14 (tienda no especificada, se pone Zumpango por ser equipo Sinai)

-- --- VENDEDORAS DE IRENE (id_supervisor = 3) ---
INSERT INTO empleado (nombre, id_puesto, id_supervisor, id_status, id_tienda, id_horario, telefono, fecha_inicio) VALUES
    ('Lucero Abigail Espitia Hernandez', 2, 3, 1, 11, NULL, NULL, '2026-01-01'),  -- id 15
    ('Esteban Alarik Gonzalez Martinez', 2, 3, 1, 11, NULL, NULL, '2026-01-01'),  -- id 16
    ('Marlen Irais Zaragoza Morelos',    2, 3, 1, 11, NULL, NULL, '2026-01-01'),  -- id 17
    ('Mari Fer Sanchez Mejia',           2, 3, 1, 14, NULL, NULL, '2026-01-01'),  -- id 18
    ('Landy Belem Sanchez Mejia',        2, 3, 1, 14, NULL, NULL, '2026-01-01');  -- id 19

-- --- VENDEDORAS DE OLIVIA (id_supervisor = 4) ---
INSERT INTO empleado (nombre, id_puesto, id_supervisor, id_status, id_tienda, id_horario, telefono, fecha_inicio) VALUES
    ('Natalia Hernandez',                2, 4, 1, 12, NULL, NULL, '2026-01-01'),  -- id 20
    ('Diana Yoselin Ceron Hernandez',    2, 4, 1, 13, NULL, NULL, '2026-01-01'),  -- id 21
    ('Eduardo Escudero Cruz',            2, 4, 1, 13, NULL, NULL, '2026-01-01'),  -- id 22

-- --- SIN SUPERVISOR CLARO / BODEGA / ENTREGA ---
    ('Espiridion Sanchez Ramirez',       4, NULL, 1,  1, NULL, NULL, '2026-01-01'),  -- id 23 Entrega
    ('Jose de Jesus Hernandez Lopez',    3, NULL, 1,  1, NULL, NULL, '2026-01-01'),  -- id 24 Bodega
    ('Karla Yaridia Hernandez Rodriguez',3, NULL, 1,  1, NULL, NULL, '2026-01-01'),  -- id 25 Bodega
    ('Juan Antonio Duenas Ortiz',        3, NULL, 1,  1, NULL, NULL, '2026-01-01');  -- id 26 Bodega

-- ============================================================
-- 4. BANCARIO
-- Limpiamos espacios y caracteres raros de CLABEs y tarjetas
-- propietario = NULL si la cuenta es del mismo empleado
-- ============================================================

INSERT INTO bancario (id_empleado, propietario, banco, num_cuenta, num_tarjeta, clabe, salario) VALUES
-- Supervisoras
(1,  NULL,                              'BBVA',        '1551130849',    '4152314381815862', '012180015511308495', 632.00),
(2,  'LILIANA GUERRERO JIMENEZ',        'BBVA',        '4152314006590411','5210030060613622','012180015318107365', 0.00),   -- salario con formula, pendiente
(3,  NULL,                              'BBVA',        '1563064359',    '4152313811176754', '012060015630643591', 0.00),    -- salario con formula, pendiente
(4,  NULL,                              'AZTECA',      '1067135075328 9','4027665864420170','127180013507532890', 0.00),   -- salario con formula, pendiente

-- Vendedoras Monse
(5,  NULL,                              'BBVA',        '1544163493',    '4152314455725799', '012180015441634938', 1000.00),
(6,  NULL,                              'BBVA',        NULL,            '4152314542653913', NULL,                3966.00),
(7,  NULL,                              'BBVA',        '1562155259',    '4152314565472662', '012180015621552597', 3500.00),
(8,  NULL,                              'BBVA',        '1503931953',    '4152314276947184', '012180015039319539', 5100.00),
(9,  NULL,                              'AFIRME',      '844584297',     '4130981766192096', '062180008445842974', 3966.00),
(10, NULL,                              'MERCADO PAGO',NULL,            '5428785238504079', NULL,                3966.00),
(11, NULL,                              'BBVA',        '1532173971',    '4152314528435269', '012180015321739717', 5100.00),

-- Vendedoras Sinai
(12, NULL,                              'NU',          '18960191',      '5101258763903573', '638180000189601913', 0.00),   -- salario formula, pendiente
(13, NULL,                              'BBVA',        '1513572325',    '4152314306283691', '012180015135723252', 0.00),   -- salario formula, pendiente
(14, NULL,                              'Santander',   '56898607036',   NULL,               '014180568986070366', 0.00),  -- salario formula, pendiente

-- Vendedoras Irene
(15, 'Guadalupe Hernandez Espitia',     'KLAR',        '1559209696',    '4152314555543977', '012180015592096962', 0.00),  -- salario formula, pendiente
(16, NULL,                              'BANAMEX',     '7522363',       '5256314555543977', '002180905375223632', 0.00),  -- salario formula, pendiente
(17, NULL,                              'BBVA',        '1520895988',    '415231432471',     '012180015208959885', 0.00),  -- salario formula, pendiente
(18, NULL,                              'BBVA',        '1539102243',    '4815163127797697', '012180015391022438', 0.00),  -- salario formula, pendiente
(19, NULL,                              'BBVA',        '1539102243',    '4815163127797697', '012180015391022438', 0.00),  -- misma cuenta que Mari Fer (hermanas?)

-- Vendedoras Olivia
(20, NULL,                              'AZTECA',      NULL,            '4027665744770992', '127180013129331343', 0.00),  -- salario formula, pendiente
(21, NULL,                              'BANCOPPEL',   '21010285086',   '4169161111350582', '137180210102850867', 0.00),  -- salario formula, pendiente
(22, 'Eligio Escudero Quiroz',          'AZTECA',      '90930185351306',NULL,               '127180001853513067', 0.00), -- salario formula, pendiente

-- Bodega y Entrega
(23, NULL,                              'BANAMEX',     NULL,            '5256784440420593', NULL,                0.00),
(24, 'Iracema Lopez Hernandez',         'AZTECA',      NULL,            '4027664152123604', NULL,                0.00),
(25, NULL,                              'NU',          NULL,            '5101250761014495', '638180010185517703', 0.00),
(26, NULL,                              'BBVA',        '4152313827417861',NULL,             NULL,                0.00);

-- ============================================================
-- NOTAS IMPORTANTES PARA ACTUALIZAR DESPUÉS:
-- ============================================================
-- 1. Los salarios con "0.00" tienen fórmulas en el Excel (ej: =(8500/2)+233.3).
--    Pedirle a la jefa los montos exactos y actualiza con:
--    UPDATE bancario SET salario = MONTO WHERE id_empleado = X;
--
-- 2. Las fechas de inicio de todos los empleados quedaron como
--    2026-01-01 como placeholder. Actualizar cuando tengan la info.
--
-- 3. Emanuel Guervara Guerrero no tiene tienda definida en el Excel,
--    se asignó a ZUMPANGO por ser del equipo de Sinai. Verificar.
--
-- 4. Los empleados de Bodega/Entrega no tienen supervisor asignado.
--    Verificar con la jefa a quién reportan.
--
-- 5. Mari Fer y Landy Belem Sanchez Mejia comparten la misma CLABE
--    y número de cuenta. Confirmar si es correcto o es un error.
-- ============================================================
