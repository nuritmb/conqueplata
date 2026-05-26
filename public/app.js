// ¿Con qué plata? — calculador del plan JP
// Pure vanilla JS, no framework. Loads items.json, renders sliders/toggles/circles, recomputes on change.

const state = {
  ingresos: {},  // { id: { valor: number } }   valor in millones de soles
  gastos: {},    // { id: { activado: bool, rampa: 'año_1'|'año_3'|'año_5' } }
};

let data = null;

// ============== INIT ==============
async function init() {
  try {
    const res = await fetch('items.json');
    data = await res.json();
  } catch (e) {
    document.body.innerHTML = '<p style="padding:40px;color:#dc2626">Error cargando items.json. ¿Corriste el build script?</p>';
    return;
  }

  // Initialize state
  data.ingresos.forEach(i => {
    state.ingresos[i.id] = { valor: 0 };
  });
  data.gastos.forEach(g => {
    state.gastos[g.id] = { valor: 0 };  // unified: 0 means off; for sliders, the actual S/ M; for toggles, costo_pleno when activated
  });

  renderIngresos();
  renderGastos();
  renderEpisodicos();
  setupTabs();
  recompute();
}

// ============== RENDER INGRESOS ==============
function renderIngresos() {
  const container = document.getElementById('ingresos-container');
  container.innerHTML = '';
  data.ingresos.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.itemId = item.id;
    card.innerHTML = renderIngresoCard(item);
    container.appendChild(card);

    const slider = card.querySelector('input[type=range]');
    slider.addEventListener('input', (e) => {
      state.ingresos[item.id].valor = Number(e.target.value);
      updateIngresoCard(card, item);
      recompute();
    });
  });
}

function renderIngresoCard(item) {
  const max = item.maximo_millones_pen;
  return `
    <div class="flex justify-between gap-2">
      <div class="flex-1">
        <div class="item-name">${item.nombre}</div>
        <div class="item-meta">${item.categoria} · máx S/ ${formatM(max)}</div>
      </div>
      <div class="item-value text-right">
        <span class="ingreso-actual">S/ 0</span>
      </div>
    </div>
    <input type="range" class="slider-input" min="0" max="${max}" step="${Math.max(1, Math.round(max/200))}" value="0" data-nivel="plausible" />
    <div class="alert-area"></div>
    <button class="source-link" onclick="showDetail('ingreso','${item.id}')">ver fuente y detalle</button>
  `;
}

function updateIngresoCard(card, item) {
  const valor = state.ingresos[item.id].valor;
  const max = item.maximo_millones_pen;
  const pct = max ? (valor / max) * 100 : 0;
  const slider = card.querySelector('input[type=range]');
  slider.style.setProperty('--pct', pct + '%');
  card.querySelector('.ingreso-actual').textContent = 'S/ ' + formatM(valor);

  // Determine active alert
  const alert = pickAlertForPct(item.alertas, pct);
  if (alert) {
    slider.dataset.nivel = alert.nivel;
    card.querySelector('.alert-area').innerHTML = `
      <span class="alert-badge ${alert.nivel}">${alert.nivel}</span>
      <div class="alert-message">${alert.mensaje}</div>
    `;
  } else {
    slider.dataset.nivel = 'plausible';
    card.querySelector('.alert-area').innerHTML = '';
  }

  // Activate visual border if > 0
  card.classList.toggle('activo-ingreso', valor > 0);
}

function pickAlertForPct(alertas, pct) {
  if (!alertas || alertas.length === 0) return null;
  // Pick the highest alert whose threshold is <= current pct.
  // Alerts are sorted by umbral_pct ascending in the JSON.
  let active = null;
  for (const a of alertas) {
    if (pct >= a.umbral_pct) active = a;
    else break;
  }
  return active;
}

// ============== RENDER GASTOS ==============
function renderGastos() {
  const container = document.getElementById('gastos-container');
  container.innerHTML = '';
  data.gastos.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.itemId = item.id;
    card.innerHTML = renderGastoCard(item);
    container.appendChild(card);

    if (item.tipo_control === 'toggle_con_rampa') {
      const slider = card.querySelector('input[type=range]');
      slider.addEventListener('input', (e) => {
        state.gastos[item.id].valor = Number(e.target.value);
        updateGastoCard(card, item);
        recompute();
      });
    } else {
      const checkbox = card.querySelector('input[type=checkbox]');
      checkbox.addEventListener('change', (e) => {
        state.gastos[item.id].valor = e.target.checked ? item.costo_pleno_millones_pen : 0;
        updateGastoCard(card, item);
        recompute();
      });
    }
  });
}

function renderGastoCard(item) {
  if (item.tipo_control === 'toggle_con_rampa') return renderGastoCardSlider(item);
  return renderGastoCardToggle(item);
}

function renderGastoCardSlider(item) {
  const max = item.costo_pleno_millones_pen;
  const baseActualPct = item.base_actual_pct_pbi;
  const metaPct = item.meta_pct_pbi;
  const stepSize = Math.max(1, Math.round(max / 200));
  return `
    <div class="flex justify-between gap-2">
      <div class="flex-1">
        <div class="item-name">${item.nombre}</div>
        <div class="item-meta">${item.categoria} · gasto actual ${baseActualPct}% PBI · meta JP ${metaPct}% PBI (+S/ ${formatM(max)} M)</div>
      </div>
      <div class="item-value text-right">
        <span class="gasto-actual text-stone-400">S/ 0</span>
      </div>
    </div>
    <input type="range" class="slider-input slider-gasto" min="0" max="${max}" step="${stepSize}" value="0" data-nivel="plausible" />
    <div class="pbi-progress flex justify-between text-[10px] text-stone-500 mt-1">
      <span class="pbi-pct-actual">${baseActualPct}% del PBI</span>
      <span class="pbi-progress-target">0% del camino a ${metaPct}%</span>
    </div>
    <div class="alert-area"></div>
    <button class="source-link" onclick="showDetail('gasto','${item.id}')">ver fuente y detalle</button>
  `;
}

function renderGastoCardToggle(item) {
  const costoPleno = item.costo_pleno_millones_pen;
  return `
    <label class="toggle-row">
      <input type="checkbox" />
      <div class="flex-1">
        <div class="item-name">${item.nombre}</div>
        <div class="item-meta">${item.categoria} · costo pleno S/ ${formatM(costoPleno)}</div>
      </div>
      <div class="item-value text-right">
        <span class="gasto-actual text-stone-400">S/ 0</span>
      </div>
    </label>
    <div class="alert-area"></div>
    <button class="source-link" onclick="showDetail('gasto','${item.id}')">ver fuente y detalle</button>
  `;
}

function updateGastoCard(card, item) {
  const s = state.gastos[item.id];
  const valor = s.valor || 0;
  const max = item.costo_pleno_millones_pen;
  const pct = max ? (valor / max) * 100 : 0;

  card.querySelector('.gasto-actual').textContent = 'S/ ' + formatM(valor);
  card.querySelector('.gasto-actual').classList.toggle('text-stone-400', valor === 0);
  card.classList.toggle('activo-gasto', valor > 0);

  // PBI-specific progress display for sliders
  if (item.tipo_control === 'toggle_con_rampa') {
    const slider = card.querySelector('input[type=range]');
    slider.style.setProperty('--pct', pct + '%');

    const baseActualPct = item.base_actual_pct_pbi;
    const metaPct = item.meta_pct_pbi;
    const gapPct = metaPct - baseActualPct;
    const currentPct = baseActualPct + (gapPct * pct / 100);

    card.querySelector('.pbi-pct-actual').textContent = `quedaría en ${currentPct.toFixed(2)}% del PBI`;
    card.querySelector('.pbi-progress-target').textContent = `${Math.round(pct)}% del camino a ${metaPct}%`;
  }

  // Alert (unified: any alert with umbral_pct <= current pct fires)
  const alertArea = card.querySelector('.alert-area');
  alertArea.innerHTML = '';
  if (valor > 0) {
    const alert = pickAlertForPct(item.alertas, pct);
    if (alert) {
      alertArea.innerHTML = `
        <span class="alert-badge ${alert.nivel}">${alert.nivel}</span>
        <div class="alert-message">${alert.mensaje}</div>
      `;
      if (item.tipo_control === 'toggle_con_rampa') {
        card.querySelector('input[type=range]').dataset.nivel = alert.nivel;
      }
    } else if (item.tipo_control === 'toggle_con_rampa') {
      card.querySelector('input[type=range]').dataset.nivel = 'plausible';
    }
  } else if (item.tipo_control === 'toggle_con_rampa') {
    card.querySelector('input[type=range]').dataset.nivel = 'plausible';
  }
}

function computeGastoValue(item, s) {
  return s.valor || 0;
}

// ============== EPISODICOS TAB ==============
function renderEpisodicos() {
  const container = document.getElementById('episodicos-container');
  container.innerHTML = '';
  data.episodicos.forEach(item => {
    const card = document.createElement('div');
    card.className = 'episodico-card ' + item.tipo;
    card.innerHTML = `
      <div class="flex justify-between gap-2 mb-1">
        <div class="text-sm font-semibold">${item.nombre}</div>
        <div class="text-xs px-2 py-0.5 rounded ${item.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-200 text-emerald-900'}">${item.tipo}</div>
      </div>
      <div class="text-xs text-stone-600 mb-2">${item.descripcion || ''}</div>
      <div class="text-sm tabular-nums">
        ${item.monto_total_millones_pen ? `Total: <strong>S/ ${formatM(item.monto_total_millones_pen)} M</strong>` : ''}
        ${item.periodo_anos ? ` · ${item.periodo_anos} años` : ''}
        ${item.monto_anual_amortizado_millones_pen ? ` · ~S/ ${formatM(item.monto_anual_amortizado_millones_pen)} M/año` : ''}
      </div>
      <div class="text-xs text-stone-500 mt-2">${item.fuente?.cita || ''}</div>
    `;
    container.appendChild(card);
  });
}

// ============== RECOMPUTE + VISUALIZE ==============
function recompute() {
  const totalIngresos = sumIngresos();
  const totalGastos = sumGastos();
  document.getElementById('ingresos-total').textContent = 'S/ ' + formatM(totalIngresos);
  document.getElementById('gastos-total').textContent = 'S/ ' + formatM(totalGastos);
  document.getElementById('ingresos-readout').textContent = 'S/ ' + formatM(totalIngresos) + ' M';
  document.getElementById('gastos-readout').textContent = 'S/ ' + formatM(totalGastos) + ' M';

  const balance = totalIngresos - totalGastos;
  const balanceEl = document.getElementById('balance-amount');
  const signEl = document.getElementById('balance-sign');
  const labelEl = document.getElementById('balance-label');
  balanceEl.textContent = 'S/ ' + formatM(Math.abs(balance)) + ' M';
  signEl.textContent = balance < 0 ? '−' : (balance > 0 ? '+' : '');
  if (balance < 0) {
    balanceEl.className = 'text-rose-600';
    labelEl.textContent = 'Déficit anual del plan';
  } else if (balance > 0) {
    balanceEl.className = 'text-emerald-600';
    labelEl.textContent = 'Superávit anual del plan';
  } else {
    balanceEl.className = 'text-stone-600';
    labelEl.textContent = 'Balance equilibrado';
  }

  renderCircles(totalIngresos, totalGastos);
  renderReferencesLegend();
}

function sumIngresos() {
  return Object.values(state.ingresos).reduce((s, x) => s + (x.valor || 0), 0);
}

function sumGastos() {
  let total = 0;
  data.gastos.forEach(item => {
    total += computeGastoValue(item, state.gastos[item.id]);
  });
  return total;
}

// ============== SVG CIRCLES ==============
const VIEWBOX = 600;
const CENTER = VIEWBOX / 2;

// Scale: r = sqrt(value_millones) * SCALE
// Tuned so S/ 257,000 M (presupuesto total) has r ≈ 270 (close to fitting in viewbox)
const SCALE = 0.55;

function radiusFor(value_millones) {
  if (!value_millones || value_millones <= 0) return 0;
  return Math.sqrt(value_millones) * SCALE;
}

function renderCircles(ingresos, gastos) {
  const balanceLayer = document.getElementById('balance-layer');
  const labelsLayer = document.getElementById('labels-layer');
  balanceLayer.innerHTML = '';
  labelsLayer.innerHTML = '';

  const rIng = radiusFor(ingresos);
  const rGas = radiusFor(gastos);
  const rMax = Math.max(rIng, rGas);
  const rMin = Math.min(rIng, rGas);

  // Outer (larger) circle
  if (rMax > 0) {
    const isIngresoOuter = rIng >= rGas;
    appendBalancePair(balanceLayer, rMax, isIngresoOuter, isIngresoOuter ? ingresos : gastos);
  }
  // Inner (smaller) circle, drawn on top
  if (rMin > 0) {
    const isIngresoInner = rGas > rIng; // if ingreso is smaller, ingreso is inner
    appendBalancePair(balanceLayer, rMin, isIngresoInner, isIngresoInner ? ingresos : gastos);
  }

  // Render reference circles (background)
  renderReferences();
}

function appendBalancePair(layer, r, isIngreso, value) {
  const visClass = isIngreso ? 'balance-circle-ingreso' : 'balance-circle-gasto';
  const visual = circle(CENTER, CENTER, r, visClass);
  const hit = circle(CENTER, CENTER, r, 'balance-hit');
  attachHoverPair(hit, visual, () => showTooltip(
    isIngreso ? 'Ingresos activados' : 'Gastos activados',
    value,
    isIngreso ? 'Total de reformas tributarias prendidas' : 'Total de compromisos de gasto prendidos'
  ));
  layer.appendChild(visual);
  layer.appendChild(hit);
}

function renderReferences() {
  const layer = document.getElementById('references-layer');
  layer.innerHTML = '';
  const refs = data.referencias_fondo.filter(r => r.siempre_visible);

  // Sort by size DESC so the smallest are rendered last (on top), making them hoverable
  refs.sort((a, b) => b.monto_anual_millones_pen - a.monto_anual_millones_pen);

  refs.forEach((ref) => {
    const r = radiusFor(ref.monto_anual_millones_pen);
    if (r === 0) return;
    const isComposite = ref.id === 'tres_empresas_utilidad';
    const cls = 'reference-circle' + (isComposite ? ' is-composite' : '');
    const visual = circle(CENTER, CENTER, r, cls);
    visual.dataset.refId = ref.id;
    const hit = circle(CENTER, CENTER, r, 'reference-hit');
    attachHoverPair(hit, visual, () => showTooltip(ref.etiqueta, ref.monto_anual_millones_pen, ref.subetiqueta));
    layer.appendChild(visual);
    layer.appendChild(hit);
  });
}

// ============== TOOLTIP ==============
function showTooltip(name, value, sub) {
  const tip = document.getElementById('circle-tooltip');
  document.getElementById('tooltip-name').textContent = name;
  document.getElementById('tooltip-value').textContent = 'S/ ' + formatM(value) + ' M';
  document.getElementById('tooltip-sub').textContent = sub || '';
  tip.style.opacity = '1';
}

function hideTooltip() {
  document.getElementById('circle-tooltip').style.opacity = '0';
}

// Sticky-tooltip state: when a user TAPS a circle, the tooltip persists until they tap elsewhere.
// This is necessary because on touch devices `mouseleave` is unreliable.
let stickyHoverEl = null;

function clearSticky() {
  if (stickyHoverEl) {
    stickyHoverEl.classList.remove('is-hovered');
    stickyHoverEl = null;
  }
  hideTooltip();
}

// Dismiss sticky tooltip when tapping anywhere that isn't a circle.
document.addEventListener('click', (e) => {
  if (e.target.closest('.reference-hit, .balance-hit')) return;
  clearSticky();
});

// Attach hover behavior: hit circle catches mouse, visual circle gets highlighted.
// On desktop: hover shows tooltip, mouseleave hides it (unless sticky).
// On mobile: tap shows tooltip sticky; tap outside dismisses.
function attachHoverPair(hitEl, visualEl, onEnter) {
  hitEl.addEventListener('mouseenter', () => {
    visualEl.classList.add('is-hovered');
    onEnter();
  });
  hitEl.addEventListener('mouseleave', () => {
    if (stickyHoverEl === visualEl) return;  // sticky from a tap — don't auto-hide
    visualEl.classList.remove('is-hovered');
    hideTooltip();
  });
  hitEl.addEventListener('click', (e) => {
    e.stopPropagation();
    // Clear any previously-sticky element
    if (stickyHoverEl && stickyHoverEl !== visualEl) {
      stickyHoverEl.classList.remove('is-hovered');
    }
    // Toggle: if already sticky on this one, dismiss
    if (stickyHoverEl === visualEl) {
      clearSticky();
      return;
    }
    visualEl.classList.add('is-hovered');
    stickyHoverEl = visualEl;
    onEnter();
  });
}

function renderReferencesLegend() {
  const container = document.getElementById('references-legend');
  const refs = data.referencias_fondo.filter(r => r.siempre_visible);
  container.innerHTML = `
    <div class="text-stone-500 mb-1">Círculos de referencia (todos a la misma escala):</div>
    <div class="grid grid-cols-2 gap-x-3 gap-y-1">
      ${refs.map(r => `
        <div class="flex justify-between border-b border-stone-100 py-0.5">
          <span class="text-stone-600">${r.etiqueta}</span>
          <span class="tabular-nums text-stone-500">S/ ${formatM(r.monto_anual_millones_pen)} M</span>
        </div>
      `).join('')}
    </div>
  `;
}

function circle(cx, cy, r, className) {
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('cx', cx);
  c.setAttribute('cy', cy);
  c.setAttribute('r', r);
  c.setAttribute('class', className);
  return c;
}

// ============== TABS ==============
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('bg-stone-900', 'text-white');
        b.classList.add('text-stone-700', 'hover:bg-stone-100');
      });
      btn.classList.add('bg-stone-900', 'text-white');
      btn.classList.remove('text-stone-700', 'hover:bg-stone-100');

      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      document.getElementById('tab-' + tab).classList.remove('hidden');
    });
  });
}

// ============== DETAIL POPUP ==============
function showDetail(tipo, id) {
  const item = tipo === 'ingreso'
    ? data.ingresos.find(x => x.id === id)
    : data.gastos.find(x => x.id === id);
  if (!item) return;

  const content = document.getElementById('detail-content');
  let html = `
    <div class="flex justify-between items-start mb-3">
      <h2 class="text-lg font-bold">${item.nombre}</h2>
      <button onclick="closeDetail()" class="text-stone-400 hover:text-stone-700 text-2xl leading-none">&times;</button>
    </div>
    <p class="text-sm text-stone-700 mb-4">${item.descripcion_corta || ''}</p>
  `;

  if (item.fuente?.cita) {
    html += `<div class="text-xs text-stone-500 mb-3"><strong>Fuente:</strong> ${item.fuente.cita}`;
    if (item.fuente.url) html += ` · <a href="${item.fuente.url}" target="_blank" class="underline">enlace</a>`;
    html += `</div>`;
  }

  if (item.notas) {
    html += `<div class="text-xs text-stone-600 italic mb-3">${item.notas}</div>`;
  }

  if (item.componentes && item.componentes.length > 0) {
    html += `<h3 class="text-sm font-semibold mt-4 mb-2">Componentes</h3><ul class="text-xs space-y-1">`;
    item.componentes.forEach(c => {
      html += `<li><strong>${c.nombre}</strong>: S/ ${formatM(c.monto_millones_pen)} M ${c.porcentaje_del_total ? '('+c.porcentaje_del_total+'%)' : ''}</li>`;
    });
    html += `</ul>`;
  }

  if (item.contiene && item.contiene.length > 0) {
    html += `<h3 class="text-sm font-semibold mt-4 mb-2">Esta meta debería incluir (según el plan)</h3><ul class="text-xs space-y-2">`;
    item.contiene.forEach(c => {
      html += `<li>
        <div><strong>${c.nombre}</strong> ${c.tambien_en_episodicos ? '<span class="text-amber-600 text-[10px]">[capex en otra pestaña]</span>' : ''}</div>
        ${c.descripcion ? `<div class="text-stone-500">${c.descripcion}</div>` : ''}
        <div class="text-stone-400 italic">${c.estado === 'no_cuantificado_por_jp' ? 'JP no asignó cifra · estimación pendiente' : c.estado === 'nueva_institucion_sin_dotacion' ? 'Institución nueva sin dotación asignada' : c.costo_anual_estimado_millones_pen ? 'S/ ' + formatM(c.costo_anual_estimado_millones_pen) + ' M/año estimado' : '—'}</div>
      </li>`;
    });
    html += `</ul>`;
  }

  if (item.alertas && item.alertas.length > 0) {
    html += `<h3 class="text-sm font-semibold mt-4 mb-2">Niveles de plausibilidad</h3><div class="text-xs space-y-2">`;
    item.alertas.forEach(a => {
      html += `<div class="border-l-2 pl-2 ${alertBorderClass(a.nivel)}">
        <span class="alert-badge ${a.nivel}">${a.nivel}</span>
        ${a.umbral_pct !== undefined ? `<span class="text-stone-500 text-[10px]">a partir del ${a.umbral_pct}%</span>` : ''}
        <div class="mt-1">${a.mensaje}</div>
        ${a.fuente?.cita ? `<div class="text-stone-400 mt-1">Fuente: ${a.fuente.cita}</div>` : ''}
      </div>`;
    });
    html += `</div>`;
  }

  content.innerHTML = html;
  document.getElementById('detail-popup').classList.remove('hidden');
}

function closeDetail() {
  document.getElementById('detail-popup').classList.add('hidden');
}

function alertBorderClass(nivel) {
  return {
    plausible: 'border-emerald-400',
    ambicioso: 'border-amber-400',
    improbable: 'border-orange-400',
    irreal: 'border-rose-500',
  }[nivel] || 'border-stone-300';
}

// ============== FORMATTING ==============
function formatM(n) {
  if (!n && n !== 0) return '—';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace('.', ',') + 'k';
  return Math.round(n).toLocaleString('es-PE');
}

// ============== BOOTSTRAP ==============
window.showDetail = showDetail;
window.closeDetail = closeDetail;
init();
