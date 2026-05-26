# JP Plan Calculator — Datos

Datos para el calculador del balance fiscal del **Plan de Gobierno de Juntos por el Perú 2026-2031**.

## Archivos

| Archivo | Contenido | Filas |
|---|---|---|
| `01_ingresos.csv` | Items de ingreso (master) | 7 |
| `02_ingresos_alertas.csv` | Umbrales de alerta por slider de ingreso | 14 |
| `03_ingresos_componentes.csv` | Descomposición de items de ingreso (IGV/Renta, etc.) | 13 |
| `04_gastos.csv` | Items de gasto recurrentes (master) | 10 |
| `05_gastos_rampas.csv` | Opciones de rampa para items con meta %PBI | 12 |
| `06_gastos_contiene.csv` | Sub-metas absorbidas por cada envelope de gasto | 51 |
| `07_gastos_alertas.csv` | Umbrales de alerta por toggle de gasto | 7 |
| `08_episodicos.csv` | Items episódicos (capex + one-time, ingreso y gasto) | 13 |
| `09_referencias_fondo.csv` | Círculos de referencia para el fondo de la visualización | 10 |
| `metodologia.md` | Documento de metodología | — |
| `README.md` | Este archivo | — |

## Joins (relaciones entre tablas)

```
01_ingresos.id
  ← 02_ingresos_alertas.item_id  (muchos a uno)
  ← 03_ingresos_componentes.item_id  (muchos a uno)

04_gastos.id
  ← 05_gastos_rampas.item_id  (3 por cada item con meta %PBI)
  ← 06_gastos_contiene.gasto_id  (muchos a uno)
  ← 07_gastos_alertas.item_id  (muchos a uno)

(08_episodicos es independiente. Algunos items se referencian desde 06_gastos_contiene.tambien_en_episodicos = true.)

(09_referencias_fondo es independiente. Se carga como capa visual.)
```

## Convenciones de campo

### `tipo_control` (en 01_ingresos y 04_gastos)
- `slider`: el usuario elige un valor 0 → máximo
- `toggle`: encendido/apagado (cost pleno o 0)
- `toggle_con_rampa`: toggle más selector de rampa (ver 05_gastos_rampas)

### `nivel` (en alertas)
- `plausible` (verde) — históricamente alcanzado en algún país de la región
- `ambicioso` (amarillo) — alcanzable pero excepcional
- `improbable` (naranja) — sin precedente regional cercano
- `irreal` (rojo) — máximo teórico, incompatible con condiciones estructurales

### `estado` (en 06_gastos_contiene)
- `no_cuantificado_por_jp` — el plan JP menciona la meta pero no asigna costo
- `nueva_institucion_sin_dotacion` — el plan crea una institución/fondo sin asignar presupuesto
- `estimacion_propia` — ballpark calculado (con metodología documentada)
- `cuantificado_por_jp` — caso raro: el plan SÍ asigna cifra explícita

### `tambien_en_episodicos` (en 06_gastos_contiene)
- `true`: el sub-item tiene componente CAPEX importante que aparece en `08_episodicos.csv`
- `false`: el sub-item es mayormente opex y vive dentro del envelope

### Cifras
- Todos los `*_millones_pen` están en millones de soles peruanos de 2023.
- Conversiones US$ → S/ usan tipo de cambio promedio 2023: S/ 3.75/US$.
- Anual = un año típico en steady state.

## Para extender los datos

1. **Agregar un item de ingreso**: nueva fila en `01_ingresos.csv` con un `id` único. Agregar alertas correspondientes en `02_ingresos_alertas.csv`. Componentes opcionales en `03_ingresos_componentes.csv`.

2. **Agregar un item de gasto**: nueva fila en `04_gastos.csv`. Si es %PBI, agregar 3 rampas en `05_gastos_rampas.csv`. Listar sub-items absorbidos en `06_gastos_contiene.csv`. Alertas opcionales en `07_gastos_alertas.csv`.

3. **Hacer una estimación ballpark de un sub-item**: actualizar `costo_anual_estimado_millones_pen` y cambiar `estado` a `estimacion_propia` en `06_gastos_contiene.csv`. Agregar nota con metodología.

4. **Agregar reforma de ingreso NO contemplada por JP** (cuando el usuario las envíe): nueva fila en `01_ingresos.csv` con `categoria` = el sector relevante. Marcar en `notas` que es reforma adicional propuesta por nosotros, no por JP.

## Conversión a JSON (para el sitio web)

Cuando los datos estén estables, todos los CSV se convertirán a un único `items.json` para servir al sitio. Las relaciones se anidarán: alertas dentro de items, componentes dentro de items, contiene dentro de gastos.

Esquema sugerido del JSON final:

```json
{
  "version": "1.0",
  "baseline": {
    "pbi_2023_millones_pen": 999195,
    "presion_tributaria_actual_pct": 19.7
  },
  "ingresos": [
    {
      "id": "evasion_total",
      "nombre": "...",
      "maximo_millones_pen": 99000,
      "fuente": { "cita": "...", "url": "..." },
      "componentes": [...],
      "alertas": [...]
    }
  ],
  "gastos_recurrentes": [...],
  "episodicos": [...],
  "referencias_fondo": [...]
}
```

## Estado de los datos

- ✅ Estructura completa
- ✅ 7 items de ingreso con fuentes
- ✅ 10 items de gasto recurrente con fuentes
- ✅ 13 items episódicos
- ✅ 51 sub-items de `contiene` listados (todos `no_cuantificado_por_jp`)
- ✅ 10 referencias de fondo
- ⏳ **Pendiente**: ballpark de los 51 sub-items en `06_gastos_contiene.csv`
- ⏳ **Pendiente**: reformas adicionales de ingreso (el usuario las enviará después)
- ⏳ **Pendiente**: validación de URLs de fuentes (algunas pueden requerir login o no abrir directo)
