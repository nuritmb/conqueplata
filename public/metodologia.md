# Metodología

Documento que explica las decisiones detrás de los datos en este calculador. Cada cifra del calculador debería ser auditable a partir de este documento + las fuentes en cada CSV.

## Baseline macroeconómico

- **PBI nominal 2023**: S/ 999,195 millones (MEF Análisis del Rendimiento de los Tributos 2023; BCRP series estadísticas).
- Para conversiones % del PBI → soles, se usa el PBI 2023.
- Las cifras de costos están en soles de 2023 y escalarán con el PBI nominal en años posteriores.
- **No** se ajusta por inflación a 2026-2031, asumiendo que las metas de %PBI se mueven con el PBI nominal.

## Presión tributaria — la ambigüedad

"Presión tributaria" tiene cuatro definiciones técnicas:

| Medida | Qué incluye | Perú 2023 |
|---|---|---|
| Presión tributaria Gobierno Central | Solo SUNAT (IGV, IR, ISC, aranceles) | 14.7% PBI |
| ↑ + contribuciones sociales | EsSalud + ONP | 16.6% PBI |
| Presión tributaria Gobierno General | + tributos regionales + municipales | 17.1% PBI |
| Ingresos del Gobierno General | + ingresos no tributarios (regalías, tasas, utilidades) | 19.7% PBI |

El Plan JP propone "25% del PBI" sin especificar cuál medida. Las comparaciones internacionales del plan (Chile 24.7%, México 24.4%, Brasil 40%) usan **Ingresos del Gobierno General**, por lo que se interpreta la meta JP en esos términos. Con base 19.7%, la brecha es **5.3 puntos PBI ≈ S/ 53,000 M/año**.

**Decisión metodológica**: el calculador NO incluye un slider único de "presión tributaria al 25%". En su lugar, descompone el aumento en mecanismos específicos (evasión, exoneraciones, etc.). La suma de máximos teóricos de los mecanismos excede S/ 53,000 M por solapamiento entre ellos.

## Items de ingreso — supuestos

### 1. Evasión tributaria (slider, máx S/ 99,000 M)

- Total 2023: S/ 99,000 M ≈ **10% del PBI** (OCDE 2025, citando MEF 2025).
- Composición: IGV S/ 34,669 M (SUNAT Informe 000035-2024) + IR derivado ~S/ 64,331 M.
- Tasa de incumplimiento IGV: 36.5% del impuesto potencial.
- Tasa de incumplimiento IR Tercera Categoría: 40.5%.
- El slider va de 0 a S/ 99,000 M. Las alertas indican plausibilidad histórica.

### 2. Eliminar exoneraciones regresivas (slider, máx S/ 20,000 M)

- Total gasto tributario 2026: S/ 26,350 M (MEF MMM 2026-2029).
- Tope del slider: 70% del total = S/ 20,000 M.
- El 70% es un juicio editorial: excluye CTS (S/ ~3,500 M, beneficio laboral) y otros conceptos protegidos.
- El plan no detalla qué exoneraciones considera "regresivas".

### 3. Impuesto a las grandes fortunas (slider, máx S/ 4,000 M)

- Estimación ballpark basada en:
  - LatAm HNW wealth ≈ US$ 9.2 T (Capgemini 2024)
  - Participación Perú estimada ~6-8% por PBI/población = ~US$ 500-700 B
  - UHNW (>US$ 30M): ~30-40% de HNW total = ~US$ 150-280 B
  - Tasa 1% anual sobre UHNW = US$ 1.5-2.8 B = S/ 5.6-10.5 B
  - Descuento por fuga de capital 30-50%
  - Resultado realista: S/ 3-5 B; tope conservador S/ 4 B.
- Referencia: Argentina Aporte Solidario 2020-2021 recaudó ~0.5% PBI argentino.

### 4. Renegociar contratos de estabilidad tributaria (slider, máx S/ 1,500 M)

- CooperAcción y Red Muqui estiman el costo fiscal anual de los CET activos en sector minero entre S/ 1-2 B.
- Alto riesgo de arbitraje internacional CIADI (Perú perdió US$ 111M entre 2022-2023).
- Tope realista S/ 1.5 B, asumiendo no renovación al vencer y disputas selectivas.

### 5. +40% ingresos mineros (slider, máx S/ 7,350 M)

- Base 2024: S/ 18,384 M total fiscal minero (SUNAT/Comex Perú).
- 40% = S/ 7,353 M adicionales.
- Incluye potencialmente un nuevo impuesto a sobreganancias (el plan no diferencia).
- Composición histórica del Nuevo Esquema Fiscal Minero (2011): NRM 50.8%, IEM 35.1%, GEM 14.1%.

### 6. +20% regalías minero-energéticas (slider, máx S/ 900 M)

- Base regalías mineras 2024: S/ 2,187 M (SUNAT).
- Estimado regalías energéticas (gas Camisea principalmente) ~S/ 2,300 M.
- 20% sobre el total ≈ S/ 897 M.
- Cambio normativo simple — modificación de Ley 28258.
- Posible solapamiento parcial con +40% ingresos mineros.

### 7. Canon hídrico (slider, máx S/ 1,000 M)

- Meta explícita del plan JP: "mil millones anuales recaudados por canon hídrico" (p. 73).
- Marco legal ya existe (Ley 31720, 2023). Falta reglamentación.
- Tasa actual de uso del agua absurdamente baja: minería paga US$ 0.101/m³, agroexportación paga US$ 0.001/m³ — mientras obtienen US$ 120/m³ y US$ 12.24/m³ respectivamente.

## Items de gasto — supuestos

### Envelopes con meta de % PBI

Cuatro items de gasto operan como envelopes ("Salud 8% PBI", etc.). Cada uno **absorbe** múltiples sub-metas específicas del plan (listadas en `06_gastos_contiene.csv`).

**Interpretación**: el envelope cubre los costos de todos los sub-items contenidos. Los sub-items se listan para auditoría y eventual estimación ballpark — si la suma de sub-items excede el envelope, eso es un hallazgo que el calculador debe surfacear.

**Cálculo del envelope**: gap entre base actual (cifra reportada por OPS/Banco Mundial/MEF) y meta JP, multiplicado por PBI 2023.

- Salud: (8.0% − 3.3%) × S/ 999,195 M = S/ 46,962 M ≈ S/ 47,000 M
- Educación: (6.0% − 4.24%) × S/ 999,195 M = S/ 17,586 M ≈ S/ 17,600 M
- Protección infantil: (1.0% − 0.5%) × S/ 999,195 M = S/ 4,996 M ≈ S/ 5,000 M
- I+D: (0.5% − 0.15%) × S/ 999,195 M = S/ 3,497 M ≈ S/ 3,500 M

### Rampas

Cada envelope %PBI se puede activar a tres niveles, modelando la transición 2026-2031:

- **Año 1** (20% del gap): rampa inicial, costo bajo
- **Año 3** (60% del gap): rampa media
- **Año 5** (100% del gap): meta plena

Default: Año 5 (steady state). Útil para que el usuario explore "qué pasa si solo llegan al 60% del compromiso para fin de mandato".

### Items específicos no-envelope

Programas que no caen dentro de los cuatro envelopes:

- **Servicio militar voluntario 100k** (S/ 2,500 M): ~S/ 25,000/persona/año (subsistencia + estipendio + formación).
- **Becas adicionales** (S/ 2,000 M): 170k becas adicionales acumuladas; base Beca 18 ≈ S/ 12,000/año/estudiante.
- **Pensiones reparaciones** (S/ 400 M): componente recurrente; el lump-sum está en episódicos.
- **Cultura recurrente** (S/ 300 M): fondo + formalización.
- **Opex nuevas instituciones** (S/ 500 M): ~12 instituciones/fondos × S/ ~40 M opex anual cada una.
- **Otros jóvenes** (S/ 300 M): programas chicos sumados.

## Items episódicos

El balance anual no debe incluir CAPEX ni pagos one-time. Se asume que estos se financian con:

- Deuda pública nueva
- Windfall taxes (renta extraordinaria por desastres)
- Recuperación de obras paralizadas (capital ya comprometido)
- Cooperación internacional

Items en `08_episodicos.csv`:

- Infraestructura: Metro Lima + trenes cercanías + teleféricos, irrigaciones, viviendas, complejos industriales, CITE/polos GRD, parques mineros, salud-capex, educación-capex
- One-time: reparaciones lump-sum, setup nuevas instituciones, obras paralizadas
- Ingreso episódico: renta extraordinaria por desastres

## Caveats importantes

1. **Solapamiento entre items de ingreso**. Cerrar la evasión incluye eliminar exoneraciones que la facilitan; reformar la fiscalidad minera incluye cerrar evasión en ese sector. La suma de máximos teóricos excede el techo real. Una alerta de "overlap" se mostrará cuando el usuario active varios items simultáneamente al máximo.

2. **No incluye contribuciones sociales**. EsSalud y ONP no se modelan como ingreso ni gasto del calculador.

3. **Sub-items sin cuantificar**. De los ~50 sub-items en `06_gastos_contiene.csv`, ninguno tiene cifra asignada por JP. Una pasada futura asignará ballpark con metodología documentada.

4. **PBI fijo**. Se usa PBI 2023 = S/ 999,195 M para todas las conversiones. En 2026-2031 el PBI será 15-25% mayor, escalando los costos de las metas %PBI proporcionalmente — pero también los ingresos potenciales (la evasión escala con el PBI).

5. **No se modela el déficit existente**. El calculador muestra el balance *neto del plan JP*, no el balance fiscal total. Perú tiene un déficit fiscal de ~2.8% PBI actual (2024). Las metas JP se *suman* a ese déficit, no lo reducen.

6. **"Sobreganancias mineras"**. El plan menciona el concepto suelto sin meta cuantificada explícita. Se asume incluido dentro de "+40% ingresos mineros".

## Fuentes primarias

| Fuente | URL |
|---|---|
| Plan de Gobierno Juntos por el Perú 2026-2031 | Archivo PDF original |
| OCDE Estudios Económicos de Perú 2025 | https://www.oecd.org/es/publications/estudios-economicos-de-la-ocde-peru-2025_626594d0-es.html |
| MEF Análisis del Rendimiento de los Tributos 2023 | https://www.mef.gob.pe/ |
| MEF Marco Macroeconómico Multianual 2026-2029 | https://www.mef.gob.pe/ |
| SUNAT Informe N° 000035-2024 (IGV 2023) | https://www.sunat.gob.pe/ |
| BCRP estadísticas y memorias | https://estadisticas.bcrp.gob.pe/ |
| Comex Perú análisis fiscal y minero | https://www.comexperu.org.pe/ |
| CIAT/BID Recaudar no basta (2012) | https://publications.iadb.org/ |
| Capgemini World Wealth Report 2024 | https://www.capgemini.com/ |
| FMI Propuestas para reforma tributaria Perú (2022) | (interno FMI) |
| OPS Informe Anual Perú 2024 | https://www.paho.org/es/publicaciones/peru-informe-anual-pais-2024 |
| MINEDU Diagnóstico Brecha Infraestructura Educativa 2023 | https://www.gob.pe/minedu |
| MINSA Diagnóstico de Brechas 2027-2029 | https://www.gob.pe/institucion/minsa/ |
| CooperAcción análisis sector minero | https://cooperaccion.org.pe/ |
| Ley 31720 Canon Hídrico (2023) | https://www.gob.pe/ |

## Convenciones

- Todas las cifras en **soles de 2023** salvo indicación contraria.
- Conversiones US$ → S/ usan tipo de cambio promedio 2023: **S/ 3.75 / US$**.
- "Anual" se refiere a un año típico en steady state, no al promedio de los 5 años.
- "Recurrente" = se paga cada año indefinidamente. "Episódico" = one-time o intermitente.
