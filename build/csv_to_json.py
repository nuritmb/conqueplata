#!/usr/bin/env python3
"""
Build script: reads CSVs from data/ and writes a single items.json to public/.
This decouples editing (CSVs in a spreadsheet) from the site code.

Run from project root: python3 build/csv_to_json.py
"""

import csv
import json
import shutil
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
PUBLIC_DIR = PROJECT_ROOT / "public"
OUTPUT = PUBLIC_DIR / "items.json"


def read_csv(filename):
    """Read a CSV and return list of dicts. Empty strings become None."""
    rows = []
    with open(DATA_DIR / filename, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            clean = {}
            for k, v in row.items():
                if v == "" or v is None:
                    clean[k] = None
                else:
                    clean[k] = v
            rows.append(clean)
    return rows


def to_number(v):
    if v is None:
        return None
    try:
        return float(v)
    except (ValueError, TypeError):
        return None


def to_int(v):
    n = to_number(v)
    return int(n) if n is not None else None


def to_bool(v):
    if v is None:
        return False
    return str(v).strip().lower() in ("true", "1", "yes", "si", "sí")


def build():
    ingresos_master = read_csv("01_ingresos.csv")
    ingresos_alertas = read_csv("02_ingresos_alertas.csv")
    ingresos_componentes = read_csv("03_ingresos_componentes.csv")
    gastos_master = read_csv("04_gastos.csv")
    gastos_rampas = read_csv("05_gastos_rampas.csv")
    gastos_contiene = read_csv("06_gastos_contiene.csv")
    gastos_alertas = read_csv("07_gastos_alertas.csv")
    episodicos = read_csv("08_episodicos.csv")
    referencias = read_csv("09_referencias_fondo.csv")

    # Group alertas / componentes by item_id
    def group_by(rows, key="item_id"):
        out = {}
        for r in rows:
            k = r.get(key)
            if k is None:
                continue
            out.setdefault(k, []).append(r)
        return out

    alertas_by_ingreso = group_by(ingresos_alertas, "item_id")
    componentes_by_ingreso = group_by(ingresos_componentes, "item_id")
    rampas_by_gasto = group_by(gastos_rampas, "item_id")
    contiene_by_gasto = group_by(gastos_contiene, "gasto_id")
    alertas_by_gasto = group_by(gastos_alertas, "item_id")

    # Build ingresos
    ingresos = []
    for row in ingresos_master:
        item = {
            "id": row["id"],
            "categoria": row["categoria"],
            "nombre": row["nombre"],
            "descripcion_corta": row.get("descripcion_corta"),
            "tipo_control": row["tipo_control"],
            "maximo_millones_pen": to_number(row["maximo_millones_pen"]),
            "fuente": {
                "cita": row.get("fuente_cita"),
                "url": row.get("fuente_url"),
            },
            "notas": row.get("notas"),
            "componentes": [
                {
                    "nombre": c["componente"],
                    "monto_millones_pen": to_number(c["monto_millones_pen"]),
                    "porcentaje_del_total": to_number(c["porcentaje_del_total"]),
                    "fuente": {
                        "cita": c.get("fuente_cita"),
                        "url": c.get("fuente_url"),
                    },
                }
                for c in componentes_by_ingreso.get(row["id"], [])
            ],
            "alertas": sorted(
                [
                    {
                        "umbral_pct": to_number(a["umbral_pct"]),
                        "nivel": a["nivel"],
                        "color": a["color"],
                        "mensaje": a["mensaje_plainspoken"],
                        "fuente": {
                            "cita": a.get("fuente_cita"),
                            "url": a.get("fuente_url"),
                        },
                    }
                    for a in alertas_by_ingreso.get(row["id"], [])
                ],
                key=lambda x: x["umbral_pct"] or 0,
            ),
        }
        ingresos.append(item)

    # Build gastos
    gastos = []
    for row in gastos_master:
        item = {
            "id": row["id"],
            "categoria": row["categoria"],
            "nombre": row["nombre"],
            "descripcion_corta": row.get("descripcion_corta"),
            "tipo_control": row["tipo_control"],
            "costo_pleno_millones_pen": to_number(row["costo_pleno_millones_pen"]),
            "base_actual_pct_pbi": to_number(row.get("base_actual_pct_pbi")),
            "meta_pct_pbi": to_number(row.get("meta_pct_pbi")),
            "fuente": {
                "cita": row.get("fuente_meta_cita"),
                "url": row.get("fuente_meta_url"),
            },
            "notas": row.get("notas"),
            "rampas": [
                {
                    "id": r["rampa_id"],
                    "etiqueta": r["etiqueta"],
                    "factor": to_number(r["factor"]),
                    "costo_efectivo_millones_pen": to_number(
                        r["costo_efectivo_millones_pen"]
                    ),
                    "nota": r.get("nota"),
                }
                for r in rampas_by_gasto.get(row["id"], [])
            ],
            "contiene": [
                {
                    "nombre": c["sub_nombre"],
                    "descripcion": c.get("sub_descripcion"),
                    "costo_anual_estimado_millones_pen": to_number(
                        c.get("costo_anual_estimado_millones_pen")
                    ),
                    "estado": c.get("estado"),
                    "nota": c.get("nota"),
                    "meta_fuente": c.get("meta_fuente"),
                    "tambien_en_episodicos": to_bool(c.get("tambien_en_episodicos")),
                }
                for c in contiene_by_gasto.get(row["id"], [])
            ],
            "alertas": sorted(
                [
                    {
                        "umbral_pct": to_number(a.get("umbral_pct")),
                        "nivel": a["nivel"],
                        "color": a["color"],
                        "mensaje": a["mensaje_plainspoken"],
                        "fuente": {
                            "cita": a.get("fuente_cita"),
                            "url": a.get("fuente_url"),
                        },
                    }
                    for a in alertas_by_gasto.get(row["id"], [])
                ],
                key=lambda x: x["umbral_pct"] or 0,
            ),
        }
        gastos.append(item)

    # Episodicos and referencias pass through
    episodicos_out = [
        {
            "id": r["id"],
            "tipo": r["tipo"],  # 'ingreso' or 'gasto'
            "categoria": r["categoria"],
            "nombre": r["nombre"],
            "descripcion": r.get("descripcion"),
            "monto_total_millones_pen": to_number(r.get("monto_total_millones_pen")),
            "periodo_anos": to_number(r.get("periodo_anos")),
            "monto_anual_amortizado_millones_pen": to_number(
                r.get("monto_anual_amortizado_millones_pen")
            ),
            "fuente": {
                "cita": r.get("fuente_cita"),
                "url": r.get("fuente_url"),
            },
            "notas": r.get("notas"),
        }
        for r in episodicos
    ]

    referencias_out = [
        {
            "id": r["id"],
            "etiqueta": r["etiqueta"],
            "subetiqueta": r.get("subetiqueta"),
            "monto_anual_millones_pen": to_number(r["monto_anual_millones_pen"]),
            "fuente": {
                "cita": r.get("fuente_cita"),
                "url": r.get("fuente_url"),
            },
            "color_sugerido": r.get("color_sugerido"),
            "siempre_visible": to_bool(r.get("siempre_visible")),
        }
        for r in referencias
    ]

    out = {
        "version": "1.0",
        "baseline": {
            "pbi_2023_millones_pen": 999195,
            "tipo_cambio_promedio_2023": 3.75,
        },
        "ingresos": ingresos,
        "gastos": gastos,
        "episodicos": episodicos_out,
        "referencias_fondo": referencias_out,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    # Copy metodologia.md into public/ so the deployed site can link to it.
    methodology_src = DATA_DIR / "metodologia.md"
    methodology_dst = PUBLIC_DIR / "metodologia.md"
    if methodology_src.exists():
        shutil.copy2(methodology_src, methodology_dst)

    print(f"✓ Wrote {OUTPUT}")
    print(f"  Ingresos: {len(ingresos)}")
    print(f"  Gastos:   {len(gastos)}")
    print(f"  Episódicos: {len(episodicos_out)}")
    print(f"  Referencias: {len(referencias_out)}")
    print(f"✓ Copied metodologia.md → public/")


if __name__ == "__main__":
    build()
