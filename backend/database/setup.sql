-- ============================================================
--  SISTEMA INTEGRAL DE GESTIÓN DE RRHH Y ASISTENCIA
--  Base de datos: gestion_de_personal
--  Motor: MariaDB | Cotejamiento: utf8mb4_unicode_ci
--  Fecha: 2026
-- ============================================================

CREATE DATABASE IF NOT EXISTS gestion_de_personal
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE gestion_de_personal;

-- ============================================================
-- 1. CATÁLOGOS BASE (sin dependencias)
-- ============================================================

-- Puestos de trabajo
CREATE TABLE puesto (
    id_puesto   INT          NOT NULL AUTO_INCREMENT,
    descripcion VARCHAR(100) NOT NULL,
    PRIMARY KEY (id_puesto)
) ENGINE=InnoDB;

-- Estatus del empleado (Activo, Baja temporal, Baja definitiva)
CREATE TABLE status_em (
    id_status   INT         NOT NULL AUTO_INCREMENT,
    descripcion VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_status)
) ENGINE=InnoDB;

-- Estatus del día para nómina (Asistencia, Retardo, Falta)
CREATE TABLE status_dia (
    id_status_dia INT         NOT NULL AUTO_INCREMENT,
    descripcion   VARCHAR(50) NOT NULL,
    color         CHAR(7)     NOT NULL COMMENT 'Color hex para el frontend, ej: #FF0000',
    PRIMARY KEY (id_status_dia)
) ENGINE=InnoDB;

-- Tipos de evento que registra el bot de WhatsApp
CREATE TABLE evento (
    id_evento    INT         NOT NULL AUTO_INCREMENT,
    descripcion  VARCHAR(100) NOT NULL,
    id_orden_sec INT         NOT NULL COMMENT '1=Entrada, 2=Salida a comer, 3=Regreso comida, 4=Salida final',
    PRIMARY KEY (id_evento)
) ENGINE=InnoDB;

-- Empresas (JUCA, PROAS, etc.)
CREATE TABLE empresa (
    id_empresa INT          NOT NULL AUTO_INCREMENT,
    nombre     VARCHAR(100) NOT NULL,
    PRIMARY KEY (id_empresa)
) ENGINE=InnoDB;

-- Horarios de trabajo
CREATE TABLE horario (
    id_horario          INT         NOT NULL AUTO_INCREMENT,
    descripcion         VARCHAR(100) NOT NULL COMMENT 'Ej: Turno mañana, Turno tarde',
    hora_entrada        TIME        NOT NULL,
    hora_salida         TIME        NOT NULL,
    hora_inicio_comida  TIME        NULL,
    hora_fin_comida     TIME        NULL,
    tolerancia_minutos  INT         NOT NULL DEFAULT 10 COMMENT 'Minutos de gracia antes de marcar retardo',
    PRIMARY KEY (id_horario)
) ENGINE=InnoDB;

-- Días festivos (tabla satélite, sin FK)
CREATE TABLE dias_festivos (
    id_dias_festivos INT          NOT NULL AUTO_INCREMENT,
    fecha            DATE         NOT NULL UNIQUE,
    motivo           VARCHAR(150) NOT NULL,
    paga_doble       TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1=Sí paga doble, 0=No',
    PRIMARY KEY (id_dias_festivos)
) ENGINE=InnoDB;

-- ============================================================
-- 2. TIENDAS (depende de empresa)
-- ============================================================

CREATE TABLE tienda (
    id_tienda  INT          NOT NULL AUTO_INCREMENT,
    nombre     VARCHAR(150) NOT NULL,
    ubicacion  VARCHAR(200) NULL,
    id_empresa INT          NOT NULL,
    PRIMARY KEY (id_tienda),
    CONSTRAINT fk_tienda_empresa FOREIGN KEY (id_empresa)
        REFERENCES empresa(id_empresa)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 3. EMPLEADO (tabla central)
-- ============================================================

CREATE TABLE empleado (
    id_empleado   INT          NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(200) NOT NULL,
    id_puesto     INT          NOT NULL,
    id_supervisor INT          NULL     COMMENT 'Auto-referencia: FK al id_empleado del supervisor',
    id_status     INT          NOT NULL DEFAULT 1,
    id_tienda     INT          NOT NULL,
    id_horario    INT          NULL     COMMENT 'NULL hasta que se definan los horarios con la jefa',
    telefono      VARCHAR(20)  NULL     COMMENT 'Número registrado de WhatsApp',
    fecha_inicio  DATE         NOT NULL,
    fecha_fin     DATE         NULL     COMMENT 'NULL si el empleado sigue activo',
    comentario    TEXT         NULL     COMMENT 'Comentarios al dar de baja al empleado',
    PRIMARY KEY (id_empleado),
    CONSTRAINT fk_empleado_puesto    FOREIGN KEY (id_puesto)     REFERENCES puesto(id_puesto)       ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_empleado_status    FOREIGN KEY (id_status)     REFERENCES status_em(id_status)    ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_empleado_tienda    FOREIGN KEY (id_tienda)     REFERENCES tienda(id_tienda)       ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_empleado_horario   FOREIGN KEY (id_horario)    REFERENCES horario(id_horario)     ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_empleado_superv    FOREIGN KEY (id_supervisor) REFERENCES empleado(id_empleado)   ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 4. BANCARIO (info sensible, relación 1 a 1 con empleado)
-- ============================================================

CREATE TABLE bancario (
    id_bancario  INT          NOT NULL AUTO_INCREMENT,
    id_empleado  INT          NOT NULL UNIQUE COMMENT 'UNIQUE garantiza relación 1 a 1',
    propietario  VARCHAR(200) NULL     COMMENT 'Si la cuenta está a nombre de otra persona',
    banco        VARCHAR(100) NOT NULL,
    num_cuenta   VARCHAR(50)  NULL,
    num_tarjeta  VARCHAR(25)  NULL,
    clabe        VARCHAR(20)  NULL,
    salario      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (id_bancario),
    CONSTRAINT fk_bancario_empleado FOREIGN KEY (id_empleado)
        REFERENCES empleado(id_empleado)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 5. REGISTRO (auditoría inmutable de cada mensaje WhatsApp)
-- ============================================================

CREATE TABLE registro (
    id_registro     INT         NOT NULL AUTO_INCREMENT,
    id_empleado     INT         NOT NULL,
    id_evento       INT         NOT NULL,
    fecha_hora      DATETIME    NOT NULL COMMENT 'Timestamp exacto del mensaje de WhatsApp',
    telefono_origen VARCHAR(20) NULL     COMMENT 'Número desde donde se mandó el mensaje (puede ser prestado)',
    PRIMARY KEY (id_registro),
    CONSTRAINT fk_registro_empleado FOREIGN KEY (id_empleado)
        REFERENCES empleado(id_empleado)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_registro_evento   FOREIGN KEY (id_evento)
        REFERENCES evento(id_evento)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 6. RESUMEN (tabla de nómina, calculada por el script Python)
-- ============================================================

CREATE TABLE resumen (
    id_resumen       INT          NOT NULL AUTO_INCREMENT,
    id_empleado      INT          NOT NULL,
    fecha            DATE         NOT NULL,
    hora_entrada     TIME         NULL,
    hora_salida      TIME         NULL,
    horas_trabajadas DECIMAL(5,2) NULL     COMMENT 'Total de horas trabajadas descontando comida',
    dias_trabajados  INT          NOT NULL DEFAULT 0,
    id_status_dia    INT          NULL,
    resumen_dia      TEXT         NULL     COMMENT 'Descripción de la actividad del día generada por el bot',
    PRIMARY KEY (id_resumen),
    UNIQUE KEY uq_resumen_emp_fecha (id_empleado, fecha) COMMENT 'Un solo resumen por empleado por día',
    CONSTRAINT fk_resumen_empleado   FOREIGN KEY (id_empleado)
        REFERENCES empleado(id_empleado)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_resumen_status_dia FOREIGN KEY (id_status_dia)
        REFERENCES status_dia(id_status_dia)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 7. DATOS INICIALES DE CATÁLOGOS
-- ============================================================

-- Estatus del empleado
INSERT INTO status_em (descripcion) VALUES
    ('Activo'),
    ('Baja temporal'),
    ('Baja definitiva');

-- Estatus del día
INSERT INTO status_dia (descripcion, color) VALUES
    ('Asistencia', '#28A745'),
    ('Retardo',    '#FFC107'),
    ('Falta',      '#DC3545');

-- Eventos del bot (lógica de pares/impares)
INSERT INTO evento (descripcion, id_orden_sec) VALUES
    ('Entrada',          1),
    ('Salida a comer',   2),
    ('Regreso de comida',3),
    ('Salida final',     4);

-- Empresas
INSERT INTO empresa (nombre) VALUES
    ('JUCA'),
    ('PROAS');

-- Puestos (ajusta según lo que defina la jefa)
INSERT INTO puesto (descripcion) VALUES
    ('Supervisora'),
    ('Vendedora');

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
