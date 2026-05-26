# ¿Alcanza la plata?

Calculador interactivo del balance fiscal del Plan de Gobierno de **Juntos por el Perú 2026-2031**.

Permite activar/desactivar reformas tributarias propuestas (ingresos) y compromisos de gasto, viendo en tiempo real si el plan se financia o no.

## Estructura del proyecto

```
jp_plan_calculator/
├── data/              # CSVs editables — fuente de verdad
│   ├── 01_ingresos.csv
│   ├── 02_ingresos_alertas.csv
│   ├── ...
│   ├── metodologia.md
│   └── README.md
├── build/             # Script de build
│   └── csv_to_json.py
└── public/            # Sitio desplegable
    ├── index.html
    ├── style.css
    ├── app.js
    └── items.json     # generado por el build
```

## Workflow para editar contenido

1. Editar los CSVs en `data/` (Numbers, Excel, o cualquier editor de texto)
2. Correr el build: `python3 build/csv_to_json.py`
3. Recargar el navegador

Editar la **UI** (no contenido): tocar `public/index.html`, `public/style.css`, `public/app.js`.
Estos archivos no dependen de los datos — leen lo que el build script genera.

## Cómo ver el sitio

Se necesita un servidor HTTP local porque el navegador bloquea `fetch()` desde `file://`.

```bash
cd public
python3 -m http.server 8765
```

Abrir http://localhost:8765 en el navegador.

## Estado actual

- ✅ MVP funcional con sliders, toggles, círculos nested, alertas
- ✅ Datos de 7 reformas de ingreso y 10 items de gasto recurrente
- ✅ 13 items episódicos (capex / one-time) en pestaña separada
- ✅ 10 círculos de referencia para escala visual
- ⏳ Pendiente: ballpark de los ~65 sub-items de `06_gastos_contiene.csv`
- ⏳ Pendiente: reformas adicionales de ingreso (no en el plan JP)
- ⏳ Pendiente: implementación mobile (los círculos no escalan a pantallas estrechas)
- ⏳ Pendiente: URL state encoding para compartir escenarios

## Despliegue

El contenido de `public/` se puede subir a Vercel, Netlify o GitHub Pages sin configuración extra. Solo correr el build antes de desplegar.

## Convenciones

- Cifras en millones de soles de 2023
- PBI 2023 = S/ 999,195 M (base para conversiones %PBI → soles)
- Tipo de cambio promedio 2023: S/ 3.75/US$
