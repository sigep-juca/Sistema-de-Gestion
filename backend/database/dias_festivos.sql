-- ============================================================
--  DÍAS FESTIVOS OFICIALES MÉXICO 2026
--  Fuente: Ley Federal del Trabajo (Art. 74)
--  Base de datos: gestion_de_personal
-- ============================================================

USE gestion_de_personal;

INSERT INTO dias_festivos (fecha, motivo, paga_doble) VALUES
    ('2026-01-01', 'Año Nuevo',                                          1),
    ('2026-02-02', 'Día de la Constitución (primer lunes de febrero)',   1),
    ('2026-03-16', 'Natalicio de Benito Juárez (tercer lunes de marzo)', 1),
    ('2026-04-02', 'Jueves Santo',                                       0),  -- No es LFT pero muchas empresas lo dan
    ('2026-04-03', 'Viernes Santo',                                      0),  -- No es LFT pero muchas empresas lo dan
    ('2026-05-01', 'Día del Trabajo',                                    1),
    ('2026-09-16', 'Día de la Independencia',                            1),
    ('2026-11-02', 'Día de Muertos',                                     0),  -- No es LFT pero muchas empresas lo dan
    ('2026-11-16', 'Día de la Revolución (tercer lunes de noviembre)',   1),
    ('2026-12-01', 'Transmisión del Poder Ejecutivo',                    1),  -- Solo cada 6 años, toca en 2026
    ('2026-12-25', 'Navidad',                                            1);

-- ============================================================
-- NOTAS:
-- paga_doble = 1 → Obligatorio por Ley Federal del Trabajo
-- paga_doble = 0 → Depende de la política interna de la empresa
--
-- Días marcados como NO obligatorios (Jueves Santo, Viernes Santo,
-- Día de Muertos) → Confirmar con la jefa si la empresa los da
-- y si paga doble o no. Si no los dan, puedes borrarlos con:
--
-- DELETE FROM dias_festivos WHERE fecha = '2026-04-02';
-- DELETE FROM dias_festivos WHERE fecha = '2026-04-03';
-- DELETE FROM dias_festivos WHERE fecha = '2026-11-02';
--
-- El 1 de diciembre (Transmisión del Poder Ejecutivo) aplica
-- porque en 2026 hay cambio de gobierno. No se repite cada año.
-- ============================================================
