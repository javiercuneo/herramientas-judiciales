// ===== Estado Global de la Aplicación =====
const state = {
  currentStep: 0,
  umaValue: null,
  history: [0], // Historial de navegación para el botón "Atrás"
  selections: {
    tipoProcesoId: null,
    tipoProceso: null,
    // Paso 2 - Contingencias
    modoTerminacion: null,
    subOpcionModo: null,
    excepciones: null,
    abogados: null,
    cautelarOposicion: null,
    tipoLocacion: null,
    caducidadArticulo: null,
    caducidadMomento: null,
    // Paso 3 - Objeto
    objetoJuicioId: null,
    objetoJuicio: null,
    subOpcionObjeto: null,
    // Paso 4
    montoJuicio: null
  },
  fromMinimos: false
};

// ===== Configuración de Pasos =====
const steps = [
  { id: 0, name: 'Inicio', short: 'UMA' },
  { id: 1, name: 'Tipo de Proceso', short: 'Tipo' },
  { id: 2, name: 'Contingencias', short: 'Conting.' },
  { id: 3, name: 'Objeto', short: 'Objeto' },
  { id: 4, name: 'Base Regulatoria', short: 'Monto' },
  { id: 5, name: 'Resultado', short: 'Resultado' }
];

// ===== Tipos de Proceso =====
const tiposProceso = [
  { id: 1, name: 'De conocimiento (ordinario o sumarísimo)', icon: 'book' },
  { id: 2, name: 'Ejecución de sentencia (o de honorarios o acuerdos)', icon: 'gavel' },
  { id: 3, name: 'Ejecutivo (expensas, alquileres, etc.)', icon: 'bolt' },
  { id: 4, name: 'Sucesión', icon: 'users' },
  { id: 5, name: 'Exhorto', icon: 'mail' },
  { id: 6, name: 'Incidente', icon: 'alert' },
  { id: 7, name: 'Medida cautelar', icon: 'shield' },
  { id: 8, name: 'Homologación de convenio de desocupación', icon: 'home' }
];

// ===== Objetos del Juicio (Paso 3) =====
const objetosJuicio = [
  { id: 1, name: 'Juicios en los que se reclaman sumas de dinero', icon: 'dollar' },
  { id: 2, name: 'Juicios sobre inmuebles o muebles', icon: 'building' },
  { id: 3, name: 'Juicio sobre derechos crediticios', icon: 'credit' },
  { id: 4, name: 'Juicio sobre títulos de renta o acciones', icon: 'chart' },
  { id: 5, name: 'Juicio sobre establecimientos comerciales, industriales o mineros', icon: 'factory' },
  { id: 6, name: 'Juicio sobre derecho de uso o habitación', icon: 'key' },
  { id: 7, name: 'Juicio de escrituración', icon: 'document' },
  { id: 8, name: 'Familia: alimentos', icon: 'heart' },
  { id: 9, name: 'Familia: liquidación del Régimen Patrimonial del Matrimonio', icon: 'ring' },
  { id: 10, name: 'Acciones Posesorias, Interdictos o División de Bienes Comunes', icon: 'divide', hasSubOptions: true },
  { id: 11, name: 'Desalojo', icon: 'door', hasSubOptions: true },
  { id: 12, name: 'Derechos de incidencia colectiva con contenido patrimonial', icon: 'group' }
];

// ===== Iconos SVG =====
const icons = {
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  gavel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2v4.5"/><path d="M4.5 14.5l4-4"/><path d="m2 22 5.5-5.5"/><path d="M8.5 8.5 22 22"/><rect x="12" y="2" width="5" height="5" rx="1" transform="rotate(45 14.5 4.5)"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  dollar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
  credit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>',
  factory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>',
  document: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  ring: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>',
  divide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="6" r="2"/><line x1="5" x2="19" y1="12" y2="12"/><circle cx="12" cy="18" r="2"/></svg>',
  door: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20"/><path d="M14 12v.01"/></svg>',
  group: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5c0-1.1.9-2 2-2h2"/><path d="M17 3h2c1.1 0 2 .9 2 2v2"/><path d="M21 17v2c0 1.1-.9 2-2 2h-2"/><path d="M7 21H5c-1.1 0-2-.9-2-2v-2"/><circle cx="12" cy="12" r="3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
  calculator: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>'
};

// ===== Elementos del DOM =====
const mainContent = document.getElementById('mainContent');
const stepper = document.getElementById('stepper');
const summaryBar = document.getElementById('summaryBar');
const footerInfo = document.getElementById('footerInfo');
const btnBack = document.getElementById('btnBack');
const btnNext = document.getElementById('btnNext');

// ===== Inicialización =====
document.addEventListener('DOMContentLoaded', () => {
  cargarUMA(); // carga valor UMA desde Google Sheets
  renderStepper();
  renderStep(0);
  setupNavigation();

  // Monitorear carga async de UMA desde Google Sheets (cargarUMA en core.js actualiza window.valorUMA)
  var umaInterval = setInterval(function() {
    var loaded = window.valorUMA;
    if (loaded && loaded !== 92482) {
      state.umaValue = loaded;
      updateSummaryBar();
      var input = document.getElementById('umaInput');
      if (input && !input.value) {
        input.value = formatNumber(loaded);
      }
      clearInterval(umaInterval);
    }
  }, 300);
  // Timeout de seguridad
  setTimeout(function() { clearInterval(umaInterval); }, 15000);
});

// ===== Renderizado del Stepper =====
function renderStepper() {
  stepper.innerHTML = steps.map((step, index) => `
    <div class="step ${index === state.currentStep ? 'active' : ''} ${index < state.currentStep ? 'completed' : ''}" data-step="${index}">
      <div class="step-indicator">
        ${index < state.currentStep ? icons.check : index + 1}
      </div>
      <span class="step-label">${step.short}</span>
    </div>
    ${index < steps.length - 1 ? '<div class="step-connector"></div>' : ''}
  `).join('');
}

// ===== Actualizar Summary Bar =====
function updateSummaryBar() {
  const items = [];
  
  if (state.umaValue) {
    items.push(`<div class="summary-item"><strong>UMA:</strong> $${formatNumber(state.umaValue)}</div>`);
  }
  if (state.selections.tipoProceso) {
    items.push(`<div class="summary-item"><strong>Proceso:</strong> ${truncate(state.selections.tipoProceso, 25)}</div>`);
  }
  if (state.selections.modoTerminacion) {
    items.push(`<div class="summary-item"><strong>Modo:</strong> ${state.selections.modoTerminacion}</div>`);
  }
  if (state.selections.objetoJuicio) {
    items.push(`<div class="summary-item"><strong>Objeto:</strong> ${truncate(state.selections.objetoJuicio, 25)}</div>`);
  }
  if (state.selections.montoJuicio) {
    items.push(`<div class="summary-item"><strong>Monto:</strong> $${formatNumber(state.selections.montoJuicio)}</div>`);
  }

  summaryBar.innerHTML = items.join('');
  summaryBar.classList.toggle('visible', items.length > 0);
}

// ===== Renderizado de Pasos =====
function renderStep(stepNumber) {
  state.currentStep = stepNumber;
  renderStepper();
  updateSummaryBar();
  updateFooterInfo(stepNumber);
  updateNavButtons();

  mainContent.innerHTML = '';
  mainContent.classList.add('fade-in');

  switch (stepNumber) {
    case 0:
      renderStep0();
      break;
    case 1:
      renderStep1();
      break;
    case 2:
      renderStep2();
      break;
    case 3:
      renderStep3();
      break;
    case 4:
      renderStep4();
      break;
    case 5:
      renderStep5();
      break;
    case 'minimos':
      renderMinimos();
      break;
  }

  setTimeout(() => mainContent.classList.remove('fade-in'), 300);
}

// ===== PASO 0: Bienvenida =====
function renderStep0() {
  mainContent.innerHTML = `
    <div class="welcome-screen">
      <div class="welcome-left">
        <div>
          <h2 class="welcome-title">Calculadora de Honorarios</h2>
          <p class="welcome-subtitle">Calculá los honorarios según la ley 27.423</p>
        </div>
        
        <div class="uma-input-group">
          <label for="umaInput">Valor de la UMA (Unidad de Medida Arancelaria)</label>
          <input 
            type="text" 
            id="umaInput" 
            class="uma-input" 
            placeholder="Ingrese el valor de la UMA"
            value="${state.umaValue || ''}"
            inputmode="numeric"
          >
          <div id="umaError" class="error-message" style="display: none;">Por favor ingrese un valor numérico válido</div>
        </div>

        <div class="welcome-buttons">
          <button class="btn btn-primary" id="btnIniciarCalculo">
            ${icons.calculator}
            Iniciar Cálculo
          </button>
          <button class="btn btn-outline" id="btnVerMinimos">
            ${icons.list}
            Ver Mínimos
          </button>
        </div>
      </div>

      <div class="welcome-right">
        <div class="steps-preview">
          <h3>¿Cómo funciona?</h3>
          <div class="preview-step">
            <div class="preview-step-number">1</div>
            <div class="preview-step-text">Seleccioná el <strong>tipo de proceso</strong> judicial</div>
          </div>
          <div class="preview-step">
            <div class="preview-step-number">2</div>
            <div class="preview-step-text">Indicá las <strong>contingencias procesales</strong> aplicables</div>
          </div>
          <div class="preview-step">
            <div class="preview-step-number">3</div>
            <div class="preview-step-text">Especificá el <strong>objeto del juicio</strong> si corresponde</div>
          </div>
          <div class="preview-step">
            <div class="preview-step-number">4</div>
            <div class="preview-step-text">Ingresá la <strong>base regulatoria</strong> (monto del juicio)</div>
          </div>
          <div class="preview-step">
            <div class="preview-step-number">5</div>
            <div class="preview-step-text">Obtené el <strong>cálculo de honorarios</strong></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  const umaInput = document.getElementById('umaInput');
  const btnIniciar = document.getElementById('btnIniciarCalculo');
  const btnMinimos = document.getElementById('btnVerMinimos');

  umaInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9.,]/g, '');
    document.getElementById('umaError').style.display = 'none';
    umaInput.classList.remove('input-error');
  });

  btnIniciar.addEventListener('click', () => {
    const value = parseNumber(umaInput.value);
    if (!value || value <= 0) {
      document.getElementById('umaError').style.display = 'block';
      umaInput.classList.add('input-error');
      return;
    }
    state.umaValue = value;
    state.fromMinimos = false;
    navigateTo(1);
  });

  btnMinimos.addEventListener('click', () => {
    const value = parseNumber(umaInput.value);
    if (value && value > 0) {
      state.umaValue = value;
    }
    state.fromMinimos = true;
    renderStep('minimos');
  });

  // Ocultar botones de navegación en paso 0
  btnBack.style.display = 'none';
  btnNext.style.display = 'none';
}

// ===== PASO 1: Tipo de Proceso =====
function renderStep1() {
  mainContent.innerHTML = `
    <h2 class="cards-title">Tipo de Proceso</h2>
    <p class="cards-subtitle">¿De qué tipo de proceso se trata?</p>
    
    <div class="cards-grid">
      ${tiposProceso.map(tipo => `
        <div class="selectable-card ${state.selections.tipoProcesoId === tipo.id ? 'selected' : ''}" data-id="${tipo.id}">
          <div class="card-icon">${icons[tipo.icon]}</div>
          <span class="card-label">${tipo.name}</span>
        </div>
      `).join('')}
    </div>
    <div id="errorTipoProceso" class="error-message" style="display: none;"></div>
  `;

  // Event listeners para tarjetas
  document.querySelectorAll('.selectable-card').forEach(card => {
    card.addEventListener('click', () => {
      showError('errorTipoProceso', '');
      document.querySelectorAll('.selectable-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const id = parseInt(card.dataset.id);
      state.selections.tipoProcesoId = id;
      state.selections.tipoProceso = tiposProceso.find(t => t.id === id).name;
      // Reset subsiguientes
      state.selections.modoTerminacion = null;
      state.selections.subOpcionModo = null;
      state.selections.excepciones = null;
      state.selections.abogados = null;
      state.selections.cautelarOposicion = null;
      state.selections.tipoLocacion = null;
      state.selections.caducidadArticulo = null;
      state.selections.caducidadMomento = null;
      state.selections.objetoJuicioId = null;
      state.selections.objetoJuicio = null;
      state.selections.subOpcionObjeto = null;
      updateSummaryBar();
    });
  });

  btnBack.style.display = 'flex';
  btnNext.style.display = 'flex';
}

// ===== PASO 2: Contingencias Procesales =====
function renderStep2() {
  const tipoId = state.selections.tipoProcesoId;
  
  let content = `
    <h2 class="cards-title">Contingencias Procesales</h2>
    <p class="cards-subtitle">Indicá las características del proceso</p>
    <div id="errorContingencias" class="error-message" style="display: none;"></div>
  `;

  // Conocimiento, Ejecución de sentencia, Ejecutivo
  if ([1, 2, 3].includes(tipoId)) {
    content += renderModoTerminacion();
  }
  
  // Solo para Ejecución de sentencia y Ejecutivo: Excepciones
  if ([2, 3].includes(tipoId)) {
    content += renderExcepciones();
  }

  // Solo para Sucesión
  if (tipoId === 4) {
    content += renderAbogados();
  }

  // Solo para Medida cautelar
  if (tipoId === 7) {
    content += renderCautelarOposicion();
  }

  // Solo para Homologación
  if (tipoId === 8) {
    content += renderTipoLocacion();
  }

  mainContent.innerHTML = content;
  attachStep2Listeners();
}

function renderModoTerminacion() {
  let html = `
    <div class="binary-options" id="modoTerminacionOptions">
      <div class="binary-option ${state.selections.modoTerminacion === 'Sentencia' ? 'selected' : ''}" data-value="Sentencia">
        <div class="card-icon">${icons.gavel}</div>
        <span class="card-label">Sentencia</span>
      </div>
      <div class="binary-option ${state.selections.modoTerminacion === 'Modos anormales' ? 'selected' : ''}" data-value="Modos anormales">
        <div class="card-icon">${icons.alert}</div>
        <span class="card-label">Modos anormales</span>
      </div>
      <div class="binary-option ${state.selections.modoTerminacion === 'Caducidad' ? 'selected' : ''}" data-value="Caducidad">
        <div class="card-icon">${icons.bolt}</div>
        <span class="card-label">Caducidad</span>
      </div>
    </div>
    
    <div class="special-button-container">
      <button class="btn btn-special ${state.selections.modoTerminacion === 'Honorarios provisorios' ? 'selected' : ''}" id="btnProvisorio">
        Fijar honorarios provisorios
      </button>
    </div>
  `;

  // Sub-opciones según modo seleccionado
  if (state.selections.modoTerminacion === 'Sentencia') {
    html += `
      <div class="suboptions-section" id="subOpcionesModo">
        <h3>¿La demanda fue admitida o rechazada?</h3>
        <div class="binary-options">
          <div class="binary-option ${state.selections.subOpcionModo === 'Demanda admitida' ? 'selected' : ''}" data-subvalue="Demanda admitida">
            <div class="card-icon">${icons.check}</div>
            <span class="card-label">Demanda admitida</span>
          </div>
          <div class="binary-option ${state.selections.subOpcionModo === 'Demanda rechazada' ? 'selected' : ''}" data-subvalue="Demanda rechazada">
            <div class="card-icon">${icons.alert}</div>
            <span class="card-label">Demanda rechazada</span>
          </div>
        </div>
      </div>
    `;
  } else if (state.selections.modoTerminacion === 'Modos anormales') {
    html += `
      <div class="suboptions-section" id="subOpcionesModo">
        <h3>¿Cuándo se produjo?</h3>
        <div class="binary-options">
          <div class="binary-option ${state.selections.subOpcionModo === 'Antes de apertura a prueba' ? 'selected' : ''}" data-subvalue="Antes de apertura a prueba">
            <div class="card-icon">${icons.document}</div>
            <span class="card-label">ANTES de la apertura a prueba</span>
          </div>
          <div class="binary-option ${state.selections.subOpcionModo === 'Después de apertura a prueba' ? 'selected' : ''}" data-subvalue="Después de apertura a prueba">
            <div class="card-icon">${icons.document}</div>
            <span class="card-label">DESPUÉS de la apertura a prueba</span>
          </div>
        </div>
      </div>
    `;
  } else if (state.selections.modoTerminacion === 'Caducidad') {
    html += `
      <div class="suboptions-section" id="subOpcionesModo">
        <h3>¿Bajo qué criterio se calculará?</h3>
        <div class="binary-options">
          <div class="binary-option ${state.selections.caducidadArticulo === 'Art. 22' ? 'selected' : ''}" data-caducidad="Art. 22">
            <div class="card-icon">${icons.document}</div>
            <span class="card-label">Aplicar art. 22</span>
          </div>
          <div class="binary-option ${state.selections.caducidadArticulo === 'Art. 25' ? 'selected' : ''}" data-caducidad="Art. 25">
            <div class="card-icon">${icons.document}</div>
            <span class="card-label">Aplicar art. 25</span>
          </div>
        </div>
      </div>
    `;

    if (state.selections.caducidadArticulo === 'Art. 25') {
      html += `
        <div class="suboptions-section" id="subOpcionesCaducidad">
          <h3>¿Cuándo se declaró la caducidad?</h3>
          <div class="binary-options">
            <div class="binary-option ${state.selections.caducidadMomento === 'Antes de apertura a prueba' ? 'selected' : ''}" data-caducidad-momento="Antes de apertura a prueba">
              <div class="card-icon">${icons.document}</div>
              <span class="card-label">ANTES de la apertura a prueba</span>
            </div>
            <div class="binary-option ${state.selections.caducidadMomento === 'Después de apertura a prueba' ? 'selected' : ''}" data-caducidad-momento="Después de apertura a prueba">
              <div class="card-icon">${icons.document}</div>
              <span class="card-label">DESPUÉS de la apertura a prueba</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  return html;
}

function renderExcepciones() {
  return `
    <div class="suboptions-section">
      <h3>¿Se dedujeron excepciones?</h3>
      <div class="binary-options" id="excepcionesOptions">
        <div class="binary-option ${state.selections.excepciones === 'Se dedujeron excepciones' ? 'selected' : ''}" data-excepciones="Se dedujeron excepciones">
          <div class="card-icon">${icons.alert}</div>
          <span class="card-label">Se dedujeron excepciones</span>
        </div>
        <div class="binary-option ${state.selections.excepciones === 'No se dedujeron excepciones' ? 'selected' : ''}" data-excepciones="No se dedujeron excepciones">
          <div class="card-icon">${icons.check}</div>
          <span class="card-label">No se dedujeron excepciones</span>
        </div>
      </div>
    </div>
  `;
}

function renderAbogados() {
  return `
    <div class="binary-options" id="abogadosOptions">
      <div class="binary-option ${state.selections.abogados === 'Un solo abogado' ? 'selected' : ''}" data-abogados="Un solo abogado">
        <div class="card-icon">${icons.users}</div>
        <span class="card-label">Un solo abogado</span>
      </div>
      <div class="binary-option ${state.selections.abogados === 'Varios abogados' ? 'selected' : ''}" data-abogados="Varios abogados">
        <div class="card-icon">${icons.group}</div>
        <span class="card-label">Varios abogados</span>
      </div>
    </div>
  `;
}

function renderCautelarOposicion() {
  return `
    <div class="binary-options" id="cautelarOptions">
      <div class="binary-option ${state.selections.cautelarOposicion === 'Cautelar con oposición' ? 'selected' : ''}" data-cautelar="Cautelar con oposición">
        <div class="card-icon">${icons.shield}</div>
        <span class="card-label">Cautelar con oposición</span>
      </div>
      <div class="binary-option ${state.selections.cautelarOposicion === 'Cautelar sin oposición' ? 'selected' : ''}" data-cautelar="Cautelar sin oposición">
        <div class="card-icon">${icons.shield}</div>
        <span class="card-label">Cautelar sin oposición</span>
      </div>
    </div>
  `;
}

function renderTipoLocacion() {
  return `
    <div class="binary-options" id="locacionOptions">
      <div class="binary-option ${state.selections.tipoLocacion === 'Alquiler para vivienda' ? 'selected' : ''}" data-locacion="Alquiler para vivienda">
        <div class="card-icon">${icons.home}</div>
        <span class="card-label">Alquiler para vivienda</span>
      </div>
      <div class="binary-option ${state.selections.tipoLocacion === 'Demás casos' ? 'selected' : ''}" data-locacion="Demás casos">
        <div class="card-icon">${icons.building}</div>
        <span class="card-label">Demás casos</span>
      </div>
    </div>
  `;
}

function attachStep2Listeners() {
  const tipoId = state.selections.tipoProcesoId;

  // Modo terminación
  if ([1, 2, 3].includes(tipoId)) {
    document.querySelectorAll('#modoTerminacionOptions .binary-option').forEach(opt => {
      opt.addEventListener('click', () => {
        state.selections.modoTerminacion = opt.dataset.value;
        state.selections.subOpcionModo = null;
        state.selections.caducidadArticulo = null;
        state.selections.caducidadMomento = null;
        renderStep2();
      });
    });

    const btnProvisorio = document.getElementById('btnProvisorio');
    if (btnProvisorio) {
      btnProvisorio.addEventListener('click', () => {
        state.selections.modoTerminacion = 'Honorarios provisorios';
        state.selections.subOpcionModo = null;
        renderStep2();
      });
    }

    // Sub-opciones de modo
    document.querySelectorAll('[data-subvalue]').forEach(opt => {
      opt.addEventListener('click', () => {
        showError('errorContingencias', '');
        document.querySelectorAll('[data-subvalue]').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        state.selections.subOpcionModo = opt.dataset.subvalue;
      });
    });

    // Caducidad artículo
    document.querySelectorAll('[data-caducidad]').forEach(opt => {
      opt.addEventListener('click', () => {
        state.selections.caducidadArticulo = opt.dataset.caducidad;
        state.selections.caducidadMomento = null;
        renderStep2();
      });
    });

    // Caducidad momento
    document.querySelectorAll('[data-caducidad-momento]').forEach(opt => {
      opt.addEventListener('click', () => {
        showError('errorContingencias', '');
        document.querySelectorAll('[data-caducidad-momento]').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        state.selections.caducidadMomento = opt.dataset['caducidad-momento'] || opt.dataset.caducidadMomento;
      });
    });
  }

  // Excepciones
  document.querySelectorAll('[data-excepciones]').forEach(opt => {
    opt.addEventListener('click', () => {
      showError('errorContingencias', '');
      document.querySelectorAll('[data-excepciones]').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.selections.excepciones = opt.dataset.excepciones;
    });
  });

  // Abogados (Sucesión)
  document.querySelectorAll('[data-abogados]').forEach(opt => {
    opt.addEventListener('click', () => {
      showError('errorContingencias', '');
      document.querySelectorAll('[data-abogados]').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.selections.abogados = opt.dataset.abogados;
    });
  });

  // Cautelar
  document.querySelectorAll('[data-cautelar]').forEach(opt => {
    opt.addEventListener('click', () => {
      showError('errorContingencias', '');
      document.querySelectorAll('[data-cautelar]').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.selections.cautelarOposicion = opt.dataset.cautelar;
    });
  });

  // Locación
  document.querySelectorAll('[data-locacion]').forEach(opt => {
    opt.addEventListener('click', () => {
      showError('errorContingencias', '');
      document.querySelectorAll('[data-locacion]').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.selections.tipoLocacion = opt.dataset.locacion;
    });
  });
}

// ===== PASO 3: Objeto del Juicio =====
function renderStep3() {
  mainContent.innerHTML = `
    <h2 class="cards-title">Objeto del Juicio</h2>
    <p class="cards-subtitle">¿Cuál es el objeto del juicio?</p>
    
    <div class="cards-grid">
      ${objetosJuicio.map(obj => `
        <div class="selectable-card ${state.selections.objetoJuicioId === obj.id ? 'selected' : ''}" data-id="${obj.id}">
          <div class="card-icon">${icons[obj.icon]}</div>
          <span class="card-label">${obj.name}</span>
        </div>
      `).join('')}
    </div>
    
    <div id="subOpcionesObjeto"></div>
    <div id="errorObjeto" class="error-message" style="display: none;"></div>
  `;

  // Event listeners para tarjetas
  document.querySelectorAll('.selectable-card').forEach(card => {
    card.addEventListener('click', () => {
      showError('errorObjeto', '');
      document.querySelectorAll('.selectable-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const id = parseInt(card.dataset.id);
      const objeto = objetosJuicio.find(o => o.id === id);
      state.selections.objetoJuicioId = id;
      state.selections.objetoJuicio = objeto.name;
      state.selections.subOpcionObjeto = null;
      updateSummaryBar();
      
      // Mostrar sub-opciones si corresponde
      renderSubOpcionesObjeto(id);
    });
  });

  // Si ya hay una selección con sub-opciones, mostrarlas
  if (state.selections.objetoJuicioId) {
    renderSubOpcionesObjeto(state.selections.objetoJuicioId);
  }
}

function renderSubOpcionesObjeto(objetoId) {
  const container = document.getElementById('subOpcionesObjeto');
  
  if (objetoId === 10) {
    // Acciones Posesorias
    container.innerHTML = `
      <div class="suboptions-section">
        <h3>Especificá el caso</h3>
        <div class="binary-options">
          <div class="binary-option ${state.selections.subOpcionObjeto === 'Actuación exclusiva beneficio patrocinado' ? 'selected' : ''}" data-subobjeto="Actuación exclusiva beneficio patrocinado">
            <div class="card-icon">${icons.users}</div>
            <span class="card-label">Actuación exclusivamente en beneficio del patrocinado (cuota o parte defendida)</span>
          </div>
          <div class="binary-option ${state.selections.subOpcionObjeto === 'Demás casos' ? 'selected' : ''}" data-subobjeto="Demás casos">
            <div class="card-icon">${icons.document}</div>
            <span class="card-label">Demás casos</span>
          </div>
        </div>
      </div>
    `;
  } else if (objetoId === 11) {
    // Desalojo
    container.innerHTML = `
      <div class="suboptions-section">
        <h3>Tipo de desalojo</h3>
        <div class="binary-options" style="max-width: 800px;">
          <div class="binary-option ${state.selections.subOpcionObjeto === 'Alquiler para vivienda' ? 'selected' : ''}" data-subobjeto="Alquiler para vivienda">
            <div class="card-icon">${icons.home}</div>
            <span class="card-label">Alquiler para vivienda</span>
          </div>
          <div class="binary-option ${state.selections.subOpcionObjeto === 'Demás casos civiles' ? 'selected' : ''}" data-subobjeto="Demás casos civiles">
            <div class="card-icon">${icons.building}</div>
            <span class="card-label">Demás casos civiles</span>
          </div>
          <div class="binary-option ${state.selections.subOpcionObjeto === 'Desalojo laboral' ? 'selected' : ''}" data-subobjeto="Desalojo laboral">
            <div class="card-icon">${icons.factory}</div>
            <span class="card-label">Desalojo laboral</span>
          </div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = '';
    return;
  }

  // Attach listeners
  document.querySelectorAll('[data-subobjeto]').forEach(opt => {
    opt.addEventListener('click', () => {
      showError('errorObjeto', '');
      document.querySelectorAll('[data-subobjeto]').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.selections.subOpcionObjeto = opt.dataset.subobjeto;
    });
  });
}

// ===== PASO 4: Base Regulatoria =====
function renderStep4() {
  mainContent.innerHTML = `
    <div class="amount-input-container">
      <h2>Base Regulatoria</h2>
      <p>Ingresá el monto del juicio para calcular los honorarios</p>
      
      <div class="amount-input-wrapper">
        <span class="currency-symbol">$</span>
        <input 
          type="text" 
          id="montoInput" 
          class="amount-input" 
          placeholder="0"
          value="${state.selections.montoJuicio ? formatNumber(state.selections.montoJuicio) : ''}"
          inputmode="numeric"
        >
      </div>
      <div id="montoError" class="error-message" style="display: none;">Por favor ingrese un monto mayor a 0</div>
    </div>
  `;

  const montoInput = document.getElementById('montoInput');
  montoInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9.,]/g, '');
    document.getElementById('montoError').style.display = 'none';
    montoInput.classList.remove('input-error');
  });
}

// ===== PASO 5: Resultado =====
// NOTA: Aquí se inyectarán tus archivos .JS de cálculos
// El objeto "state" contiene todos los datos recopilados:
//   - state.umaValue
//   - state.selections.tipoProcesoId
//   - state.selections.tipoProceso
//   - state.selections.modoTerminacion
//   - state.selections.subOpcionModo
//   - state.selections.excepciones
//   - state.selections.abogados
//   - state.selections.cautelarOposicion
//   - state.selections.tipoLocacion
//   - state.selections.caducidadArticulo
//   - state.selections.caducidadMomento
//   - state.selections.objetoJuicioId
//   - state.selections.objetoJuicio
//   - state.selections.subOpcionObjeto
//   - state.selections.montoJuicio

function renderStep5() {
  // Sincronizar state → wizardState antes del cálculo
  syncWizardState();

  mainContent.innerHTML = `
    <div class="result-screen">
      <h2>Resultado del Cálculo</h2>
      <p>Honorarios estimados según Ley 27.423</p>
      
      <div id="resultadoCalculo" class="result-card">
        <div id="resultadosDinamicos">
          <p style="text-align:center; color:var(--text-muted);">Calculando...</p>
        </div>
      </div>
      
      <div class="result-actions">
        <button class="btn btn-secondary" id="btnNuevoCalculo">
          ${icons.calculator}
          Nuevo Cálculo
        </button>
      </div>
    </div>
  `;
  
  // Ejecutar el motor de cálculo del wizard original
  calcularFinal();
  
  // El botón "Ver mínimos para contrastar" que genera calcularFinal()
  // no aplica en la nueva UI (ya existe en pantalla de inicio)
  var btnViejoMinimos = document.getElementById('btnIrAMinimosDesdeResultado');
  if (btnViejoMinimos && btnViejoMinimos.parentNode) {
    btnViejoMinimos.parentNode.removeChild(btnViejoMinimos);
  }
  
  document.getElementById('btnNuevoCalculo').addEventListener('click', () => {
    resetState();
    navigateTo(0);
  });
  
  btnNext.style.display = 'none';
}

// ===== Categorías de Mínimos =====
const categoriasMinimos = [
  { id: 'judicial', name: 'Asuntos judiciales no susceptibles de apreciación pecuniaria', subtitle: 'Art. 19 inc. a', icon: 'gavel' },
  { id: 'extrajudicial', name: 'Mínimos por labor extrajudicial', subtitle: 'Art. 19 inc. b', icon: 'document' },
  { id: 'acciones_48', name: 'Acciones de inconstitucionalidad, amparo, hábeas data, hábeas corpus', subtitle: 'Art. 48', icon: 'shield' },
  { id: 'contencioso_44', name: 'Demandas contencioso administrativas no susceptibles de apreciación pecuniaria', subtitle: 'Art. 44', icon: 'building' },
  { id: 'minimos_art58', name: 'Mínimos en juicios susceptibles de apreciación pecuniaria', subtitle: 'Art. 58', icon: 'dollar' },
  { id: 'recursos_csjn', name: 'Recursos ante la CSJN', subtitle: 'Art. 31', icon: 'alert' },
  { id: 'auxiliares_justicia', name: 'Auxiliares de justicia', subtitle: 'Arts. 58, 60, 61 bis', icon: 'users' }
];

function getMinimoHTML(categoriaId, uma) {
  if (categoriaId === 'judicial') {
    var items = [
      { asunto: 'Divorcio', uma: 10 },
      { asunto: 'Acción sobre efectos del divorcio y responsabilidad parental', uma: 25 },
      { asunto: 'Adopción', uma: 20 },
      { asunto: 'Tutela', uma: 20 },
      { asunto: 'Restricciones a la capacidad e inhabilitación', uma: 25 },
      { asunto: 'Reclamación e impugnación de filiación', uma: 25 },
      { asunto: 'Acciones de estado y familia', uma: 25 },
      { asunto: 'Veeduría', uma: 10 },
      { asunto: 'Información sumaria', uma: 2 },
      { asunto: 'Trámite administrativo ante autoridad de aplicación', uma: 2 },
      { asunto: 'Trámite ante la Inspección General de Justicia', uma: 3 },
      { asunto: 'Presentación de denuncias penales con firma de letrado', uma: 8 },
      { asunto: 'Incidente de excarcelación o exención de prisión o audiencia de control de detención o medidas de coerción', uma: 10 },
      { asunto: 'Pedido y audiencia de suspensión de juicio a prueba', uma: 10 },
      { asunto: 'Acta de juicio abreviado', uma: 15 },
      { asunto: 'Actuación hasta la clausura de la instrucción o de control de la acusación', uma: 15 },
      { asunto: 'Actuación desde la clausura de la instrucción o de control de la acusación hasta la sentencia', uma: 20 },
      { asunto: 'Acción de incidencia colectiva, hábeas corpus, hábeas data', uma: 25 }
    ];
    return '<div class="dashboard-card"><h3>Mínimos en asuntos judiciales no susceptibles de apreciación pecuniaria (art. 19 inc. a)</h3><div class="legal-box">ARTÍCULO 19.- Cuando no fuere posible apreciar el valor pecuniario del asunto, los jueces fijarán los honorarios teniendo en cuenta la naturaleza de las actuaciones y la gestión profesional desarrollada, con arreglo a las siguientes pautas:<br>a) En asuntos judiciales:</div><table><thead><tr><th>Asunto</th><th>UMA</th><th>$</th></tr></thead><tbody>' + items.map(function(item) { return '<tr><td>' + item.asunto + '</td><td>' + item.uma + ' UMA</td><td>$' + formatNumber(item.uma * uma) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  if (categoriaId === 'extrajudicial') {
    var items = [
      { labor: 'Consulta verbal', uma: 0.5 },
      { labor: 'Consulta con informe', uma: 1 },
      { labor: 'Redacción de carta documento', uma: 1 },
      { labor: 'Estudio o información de actuaciones judiciales o administrativas', uma: 1.5 },
      { labor: 'Asistencia y asesoramiento del cliente en la realización de actos jurídicos', uma: 1.5 },
      { labor: 'Redacción de contrato de locación', uma: 2 },
      { labor: 'Redacción de boleto de compraventa', uma: 3 },
      { labor: 'Redacción de contrato o estatuto de sociedades comerciales, asociaciones o fundaciones y constitución de personas jurídicas en general', uma: 5 },
      { labor: 'Redacción de otros contratos', uma: 2 },
      { labor: 'Arreglo extrajudicial', uma: 1 },
      { labor: 'Gastos administrativos de estudio para iniciación de juicios', uma: 0.5 },
      { labor: 'Redacción de denuncia penal (sin firma de letrado)', uma: 3 },
      { labor: 'Asistencia a una audiencia de mediación o conciliación', uma: 2 }
    ];
    return '<div class="dashboard-card"><h3>Mínimos por labor extrajudicial (art. 19 inc. b)</h3><div class="legal-box">ARTÍCULO 19.- Cuando no fuere posible apreciar el valor pecuniario del asunto, los jueces fijarán los honorarios teniendo en cuenta la naturaleza de las actuaciones y la gestión profesional desarrollada, con arreglo a las siguientes pautas:<br>b) En asuntos extrajudiciales:</div><table><thead><tr><th>Labor</th><th>UMA</th><th>$</th></tr></thead><tbody>' + items.map(function(item) { return '<tr><td>' + item.labor + '</td><td>' + item.uma + ' UMA</td><td>$' + formatNumber(item.uma * uma) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  if (categoriaId === 'acciones_48') {
    return '<div class="dashboard-card"><h3>Mínimos del art. 48</h3><table><thead><tr><th colspan="2">Acciones de inconstitucionalidad, amparo, hábeas data, hábeas corpus</th></tr></thead><tbody><tr><td>20 UMA</td><td>$' + formatNumber(20 * uma) + '</td></tr></tbody></table><div class="legal-box">ARTÍCULO 48.- Por la interposición de acciones de inconstitucionalidad, de amparo, de hábeas data, de hábeas corpus, en caso de que no puedan regularse de conformidad con la escala del artículo 21, se aplicarán las normas del artículo 16, con un mínimo de 20 UMA.</div></div>';
  }
  if (categoriaId === 'contencioso_44') {
    return '<div class="dashboard-card"><h3>Mínimos del art. 44</h3><table><thead><tr><th>Tipo</th><th>Mínimo (UMA)</th><th>Mínimo $</th></tr></thead><tbody><tr><td>Acciones contencioso administrativas</td><td>7 UMA</td><td>$' + formatNumber(7 * uma) + '</td></tr><tr><td>Actuaciones administrativas</td><td>5 UMA</td><td>$' + formatNumber(5 * uma) + '</td></tr></tbody></table><div class="legal-box">ARTÍCULO 44.- La interposición de acciones y peticiones de naturaleza administrativa seguirá las siguientes reglas… En los casos en que los asuntos no sean susceptibles de apreciación pecuniaria, la regulación no será inferior a 7 o 5 UMA, según se trate del ejercicio de acciones contencioso administrativas o actuaciones administrativas, respectivamente.</div></div>';
  }
  if (categoriaId === 'minimos_art58') {
    return '<div class="dashboard-card"><h3>Mínimos del art. 58 (juicios susceptibles de apreciación pecuniaria que no estuviesen previstos en otros artículos)</h3><table><thead><tr><th>Inciso</th><th>Mínimo (UMA)</th><th>Mínimo $</th></tr></thead><tbody><tr><td>a) procesos de conocimiento</td><td>10 UMA</td><td>$' + formatNumber(10 * uma) + '</td></tr><tr><td>b) ejecutivos</td><td>6 UMA</td><td>$' + formatNumber(6 * uma) + '</td></tr><tr><td>c) mediación</td><td>2 UMA</td><td>$' + formatNumber(2 * uma) + '</td></tr><tr><td>d) Auxiliares de la Justicia</td><td>4 UMA</td><td>$' + formatNumber(4 * uma) + '</td></tr></tbody></table><div class="legal-box">Art. 58: Mínimo establecido para regular honorarios de juicios susceptibles de apreciación pecuniaria que no estuviesen previstos en otros artículos.</div></div>';
  }
  if (categoriaId === 'recursos_csjn') {
    return '<div class="dashboard-card"><h3>Recursos ante la CSJN (art. 31)</h3><table><thead><tr><th>Concepto</th><th>Mínimo</th><th>Valor</th></tr></thead><tbody><tr><td>Queja por denegación de recurso</td><td>15 UMA</td><td>$' + formatNumber(15 * uma) + '</td></tr><tr><td>Interposición de recurso extraordinario, etc.</td><td>20 UMA</td><td>$' + formatNumber(20 * uma) + '</td></tr></tbody></table><div class="legal-box">Art. 31: La interposición ante la CSJN de los recursos extraordinarios, de inconstitucionalidad, de revisión, de casación, ordinarios, directos y otros similares o que no sean los normales de acceso, no podrá remunerarse en una cantidad inferior a 20 UMA. Las quejas por denegación de estos recursos no podrán remunerarse en una cantidad inferior a 15 UMA. Si dichos recursos fueren concedidos y se tramitaren, se estará a lo dispuesto en el artículo 21.</div></div>';
  }
  if (categoriaId === 'auxiliares_justicia') {
    return '<div class="dashboard-card"><h3>Auxiliares de justicia</h3><table><thead><tr><th>Concepto</th><th>Mínimo</th><th>$</th></tr></thead><tbody><tr><td>Art. 58 - Juicios susceptibles de apreciación pecuniaria</td><td>4 UMA</td><td>$' + formatNumber(4 * uma) + '</td></tr><tr><td>Art. 60 - Peritos (procesos no susceptibles)</td><td>2 UMA</td><td>$' + formatNumber(2 * uma) + '</td></tr><tr><td>Art. 61 bis - Peritos (controversias judiciales)</td><td>2 UMA por pericia</td><td>$' + formatNumber(2 * uma) + '</td></tr><tr><td>Art. 61 bis - Peritos sin dictamen (transacción)</td><td>1/4 UMA</td><td>$' + formatNumber(0.25 * uma) + '</td></tr></tbody></table><div class="legal-box">ARTÍCULO 60 (B.O. 06/03/2026).- En los procesos no susceptibles de apreciación pecuniaria, los honorarios de los peritos y de los peritos liquidadores de averías serán fijados conforme a las pautas valorativas del artículo 16 y en un mínimo de 2 UMA, siendo suficiente para la fijación de los honorarios mínimos, la aceptación del cargo conferido. En el caso de los demás auxiliares de la Justicia, se aplicarán las normas específicas.<br><br>Artículo 61 bis (B.O. 06/03/2026) Los honorarios de los peritos que intervengan en las controversias judiciales, no estarán vinculados a la cuantía del respectivo juicio, ni al porcentaje de incapacidad que se dictamine en caso de producirse una pericia médica. Su regulación responderá exclusivamente a la apreciación judicial de la labor técnica realizada en el pleito y su relevancia; calidad y extensión en lo concreto y deberá fijarse en un monto que asegure una adecuada retribución al perito. Por cada pericia, se fijará un monto mínimo de 2 UMA. En caso de finalizar el proceso por transacción, avenimiento y conciliación, sin que el perito haya presentado la pericia encargada, se le regulará 1/4 de UMA en tanto el perito haya aceptado el cargo.</div></div>';
  }
  return '';
}

// ===== Pantalla de Mínimos =====
function renderMinimos() {
  var umaActual = state.umaValue || window.valorUMA || 92482;
  
  mainContent.innerHTML = `
    <div class="minimos-screen">
      <h2>Honorarios Mínimos</h2>
      <p>Seleccioná una categoría para ver los valores mínimos establecidos por ley (UMA: $${formatNumber(umaActual)})</p>
      
      <div class="cards-grid" id="minimosCards">
        ${categoriasMinimos.map(function(cat) { return `
          <div class="selectable-card" data-categoria="${cat.id}">
            <div class="card-icon">${icons[cat.icon] || icons.document}</div>
            <span class="card-label">${cat.name}</span>
            <span style="font-size:0.8rem;color:var(--text-muted);margin-top:-4px;">${cat.subtitle}</span>
          </div>
        `; }).join('')}
      </div>
      
      <div id="minimoDetalle" style="margin-top: 2rem;"></div>
      
      <div class="back-from-minimos" style="margin-top: 2rem;">
        <button class="btn btn-secondary" id="btnVolverInicio">
          Volver al inicio
        </button>
      </div>
    </div>
  `;

  document.querySelectorAll('#minimosCards .selectable-card').forEach(function(card) {
    card.addEventListener('click', function() {
      document.querySelectorAll('#minimosCards .selectable-card').forEach(function(c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      var categoria = card.dataset.categoria;
      document.getElementById('minimoDetalle').innerHTML = getMinimoHTML(categoria, umaActual);
    });
  });

  document.getElementById('btnVolverInicio').addEventListener('click', function() {
    renderStep(0);
  });

  btnBack.style.display = 'none';
  btnNext.style.display = 'none';
}

// ===== Navegación =====
function setupNavigation() {
  btnBack.addEventListener('click', handleBack);
  btnNext.addEventListener('click', handleNext);
}

function handleBack() {
  if (state.history.length > 1) {
    state.history.pop();
    const previousStep = state.history[state.history.length - 1];
    renderStep(previousStep);
  }
}

function handleNext() {
  const currentStep = state.currentStep;

  // Validaciones según paso actual
  if (currentStep === 1) {
    if (!state.selections.tipoProcesoId) {
      showError('errorTipoProceso', 'Por favor seleccioná un tipo de proceso');
      return;
    }
    
    // Bifurcación de navegación
    const tipoId = state.selections.tipoProcesoId;
    
    if (tipoId === 5) { // Exhorto -> directo a Resultado (no necesita base)
      navigateTo(5);
    } else if (tipoId === 6) { // Incidente -> directo a Base regulatoria
      navigateTo(4);
    } else {
      navigateTo(2); // Resto va a Contingencias
    }
    return;
  }

  if (currentStep === 2) {
    // Validar contingencias según tipo
    if (!validateStep2()) {
      return;
    }
    
    const tipoId = state.selections.tipoProcesoId;
    
    // Solo conocimiento va a Paso 3 (Objeto)
    if (tipoId === 1) {
      navigateTo(3);
    } else {
      navigateTo(4); // Resto va a Base regulatoria
    }
    return;
  }

  if (currentStep === 3) {
    if (!state.selections.objetoJuicioId) {
      showError('errorObjeto', 'Por favor seleccioná el objeto del juicio');
      return;
    }
    
    // Validar sub-opciones si aplica
    const objeto = objetosJuicio.find(o => o.id === state.selections.objetoJuicioId);
    if (objeto.hasSubOptions && !state.selections.subOpcionObjeto) {
      showError('errorObjeto', 'Por favor seleccioná la sub-opción correspondiente');
      return;
    }
    
    navigateTo(4);
    return;
  }

  if (currentStep === 4) {
    const montoInput = document.getElementById('montoInput');
    const value = parseNumber(montoInput.value);
    
    if (!value || value <= 0) {
      document.getElementById('montoError').style.display = 'block';
      montoInput.classList.add('input-error');
      return;
    }
    
    state.selections.montoJuicio = value;
    updateSummaryBar();
    navigateTo(5);
    return;
  }
}

function validateStep2() {
  const tipoId = state.selections.tipoProcesoId;

  // Conocimiento, Ejecución, Ejecutivo
  if ([1, 2, 3].includes(tipoId)) {
    if (!state.selections.modoTerminacion) {
      showError('errorContingencias', 'Por favor seleccioná el modo de terminación');
      return false;
    }
    
    // Validar sub-opciones de modo
    if (state.selections.modoTerminacion === 'Sentencia' && !state.selections.subOpcionModo) {
      showError('errorContingencias', 'Por favor indicá si la demanda fue admitida o rechazada');
      return false;
    }
    if (state.selections.modoTerminacion === 'Modos anormales' && !state.selections.subOpcionModo) {
      showError('errorContingencias', 'Por favor indicá cuándo se produjo');
      return false;
    }
    if (state.selections.modoTerminacion === 'Caducidad') {
      if (!state.selections.caducidadArticulo) {
        showError('errorContingencias', 'Por favor seleccioná el artículo a aplicar');
        return false;
      }
      if (state.selections.caducidadArticulo === 'Art. 25' && !state.selections.caducidadMomento) {
        showError('errorContingencias', 'Por favor indicá cuándo se declaró la caducidad');
        return false;
      }
    }
  }

  // Ejecución y Ejecutivo -> excepciones
  if ([2, 3].includes(tipoId) && !state.selections.excepciones) {
    showError('errorContingencias', 'Por favor indicá si se dedujeron excepciones');
    return false;
  }

  // Sucesión -> abogados
  if (tipoId === 4 && !state.selections.abogados) {
    showError('errorContingencias', 'Por favor indicá la cantidad de abogados');
    return false;
  }

  // Medida cautelar -> oposición
  if (tipoId === 7 && !state.selections.cautelarOposicion) {
    showError('errorContingencias', 'Por favor indicá si hubo oposición');
    return false;
  }

  // Homologación -> tipo locación
  if (tipoId === 8 && !state.selections.tipoLocacion) {
    showError('errorContingencias', 'Por favor indicá el tipo de locación');
    return false;
  }

  return true;
}

function navigateTo(step) {
  state.history.push(step);
  renderStep(step);
}

function updateNavButtons() {
  const step = state.currentStep;
  
  btnBack.disabled = state.history.length <= 1;
  btnBack.style.display = step === 0 || step === 'minimos' ? 'none' : 'flex';
  btnNext.style.display = step === 0 || step === 5 || step === 'minimos' ? 'none' : 'flex';
}

function updateFooterInfo(step) {
  var s = state.selections;
  var msg = '';

  if (step === 0) {
    msg = 'El valor de la UMA (Unidad de Medida Arancelaria) se actualiza periódicamente. Consultá el valor vigente antes de realizar el cálculo.';
  } else if (step === 1) {
    msg = 'En la Ley 27.423, el tipo de proceso define coeficientes específicos que pueden reducir o incrementar el resultado final del cálculo. Por eso, es fundamental que elijas una de las siguientes opciones:';
  } else if (step === 2) {
    var tipoId = s.tipoProcesoId;
    if ([1, 2, 3].includes(tipoId)) {
      msg = 'El modo en que termina el proceso tiene un impacto directo en el cálculo, ya que afecta tanto la alícuota aplicable como la base económica. Por favor, seleccioná la forma de finalización para ajustar el resultado a las pautas legales correspondientes.';
      if (tipoId === 2) {
        msg += '<br><br><strong>Excepciones</strong><br>La oposición de excepciones es un factor determinante en el proceso de ejecución ya que su ausencia genera una reducción directa del 10% sobre el monto que correspondería regular.<br>ARTÍCULO 41.- En el procedimiento de ejecución de sentencias…no habiendo excepciones, los honorarios se reducirán en un 10%...';
      } else if (tipoId === 3) {
        msg += '<br><br><strong>Excepciones</strong><br>La oposición de excepciones es un factor determinante en el proceso ejecutivo, ya que además de modificar la estructura de las etapas (art. 29, inc. f), su ausencia genera una reducción directa del 10% sobre el monto que correspondería regular.<br>ARTÍCULO 34.- En los juicios ejecutivos y ejecuciones especiales…No habiendo excepciones, los honorarios se reducirán en un 10%...';
      }
    } else if (tipoId === 4) {
      msg = 'En los procesos sucesorios, la existencia de un abogado único para todos los herederos es un factor determinante ya que según el art. 35, los honorarios deben regularse en la mitad de la escala del art. 21. Es necesario que indiques si hubo uno o más letrados para aplicar este tope específico.<br><br>ARTÍCULO 35.- En el proceso sucesorio, si 1 solo abogado patrocina o representa a todos los herederos o interesados, sus honorarios se regularán…en la mitad del mínimo y del máximo de la escala establecida en el art. 21.';
    } else if (tipoId === 7) {
      msg = 'En las medidas cautelares, la existencia de oposición o controversia tiene un impacto directo en el cálculo de los honorarios, ya que modifica el porcentaje de la escala aplicable.<br><br>- Sin oposición: los honorarios se regulan tomando como base el 25% de la escala general establecida en el art. 21.<br>- Con oposición: la base para el cálculo se eleva al 50% de dicha escala.<br><br>Por favor, indicá si existió controversia para que el asistente aplique el coeficiente correcto.<br><br>ARTÍCULO 37.- En las medidas cautelares, ya sea que éstas tramiten autónomamente, en forma incidental o dentro del proceso, los honorarios se regularán sobre el monto que se pretende a asegurar, aplicándose como base el 25% de la escala del art. 21; salvo casos de controversia u oposición, en que la base se elevará al 50 %.';
    } else if (tipoId === 8) {
      msg = 'Seleccione el tipo de locación:';
    }
  } else if (step === 3) {
    msg = 'El objeto reclamado en el juicio es un factor determinante para establecer la base regulatoria (o cuantía del asunto) sobre la cual se aplicará la escala de porcentajes para calcular los honorarios. Varía sustancialmente dependiendo del reclamo, si se requieren sumas de dinero u otros bienes (y su naturaleza). Por eso es necesario que elijas una de las siguientes opciones:';
  } else if (step === 4) {
    var tipoId = s.tipoProcesoId;
    var objId = s.objetoJuicioId;
    msg = 'La base regulatoria, también llamada cuantía o monto del asunto, es el valor económico que se toma como referencia para aplicar la escala de honorarios del art. 21 en los procesos susceptibles de apreciación pecuniaria. Su correcta determinación es fundamental ya que de ella depende el coeficiente aplicable y la determinación de los mínimos y máximos arancelarios. Según las elecciones previas, en este paso tenés que ingresar ese monto.<br><br>';

    if (tipoId === 1 && objId === 11) {
      if (s.subOpcionObjeto === 'Alquiler para vivienda') {
        msg += 'Ingresá el valor de la totalidad del contrato. Si es un desalojo sin contrato o en el caso que el profesional haya estimado inadecuado el valor del contrato, ingresá la sumatoria de alquileres estimados o determinados por el perito designado.<br>Nota: si elegiste "alquiler para vivienda" en el paso anterior, no ingreses el monto reducido porque ya estará calculado por el sistema.<br><br>ARTÍCULO 40: En los procesos de desalojo se fijarán los honorarios de acuerdo con la escala del art. 21, tomando como base el total de los alquileres del contrato… Si el profesional estimare inadecuado el alquiler fijado en el contrato o en caso de que éste no pudiera determinarse exactamente o se tratase de juicios por intrusión o tenencia precaria, deberá fijarse el valor locativo actualizado del inmueble, para lo cual el profesional podrá acompañar tasaciones al respecto o designar perito para que lo determine.';
      } else if (s.subOpcionObjeto === 'Desalojo laboral') {
        msg += 'En los juicios donde se reclama la restitución de inmuebles dados al trabajador por su empleo, la base regulatoria es el 50% de la última remuneración mensual durante 2 años.<br><br>ARTÍCULO 43.- …En las demandas de desalojo por restitución de inmuebles o parte de ellos, concedidos a los trabajadores en virtud de la relación de trabajo, se considerará como valor del juicio el cincuenta por ciento (50%) de la última remuneración mensual normal y habitual que deba percibir según su categoría profesional por el término de dos (2) años.';
      } else {
        msg += 'Ingresá el valor de la totalidad del contrato. Si es un desalojo sin contrato o en el caso que el profesional haya estimado inadecuado el valor del contrato, ingresá la sumatoria de alquileres estimados o determinados por el perito designado.<br><br>ARTÍCULO 40: En los procesos de desalojo se fijarán los honorarios de acuerdo con la escala del art. 21, tomando como base el total de los alquileres del contrato… Si el profesional estimare inadecuado el alquiler fijado en el contrato o en caso de que éste no pudiera determinarse exactamente o se tratase de juicios por intrusión o tenencia precaria, deberá fijarse el valor locativo actualizado del inmueble, para lo cual el profesional podrá acompañar tasaciones al respecto o designar perito para que lo determine.';
      }
    } else if (tipoId === 1 && objId === 1) {
      msg += 'Nota: no ingreses el monto con reducciones porque ya estará calculado por el sistema según tus elecciones previas.<br><br>ARTÍCULO 22.- En los juicios por cobro de sumas de dinero la cuantía del asunto …será el monto de la demanda o reconvención; si hubiera sentencia será el de la liquidación que resulte de la misma, actualizado por intereses si correspondiere. En caso de transacción, la cuantía será el monto de la misma.<br><br>ARTÍCULO 24.- A los efectos de la regulación de honorarios, se tendrán en cuenta los intereses que deban calcularse sobre el monto de condena. Los intereses fijados en la sentencia deberán siempre integrar la base regulatoria, bajo pena de nulidad.<br><br>ARTÍCULO 52.- … A los efectos de la regulación se tendrán en cuenta los intereses, los frutos y los accesorios, que integrarán la base regulatoria según lo establecido en los artículos 22, 23 y 24.';
    } else if (tipoId === 1 && objId === 2) {
      msg += 'Ingresá el valor del bien según estas reglas:<br>- Si los bienes fueron tasados, ingresá el monto de la tasación.<br>- Si la valuación fiscal (VF) se consideró adecuada, ingresa el monto de la VF actualizada incrementado en un 50%.<br>- Si la VF se consideró inadecuada, se inició y terminó el procedimiento del art. 23 para la valuación de los bienes, ingresá el valor de la estimación.<br>- Recordá que si hay montos en dólares, tenés que definir el tipo de cambio que vas a usar (oficial venta, MEP, etc.) para ingresar la base en pesos.<br><br>ARTÍCULO 23.- El monto de los procesos en caso de que existan bienes susceptibles de apreciación pecuniaria, se determinará conforme lo siguiente: a) Si se trata de bienes inmuebles o derechos sobre los mismos y no han sido tasados en autos, se tendrá como cuantía del asunto la valuación fiscal al momento en que se practique la regulación, incrementada en un 50%. No obstante reputándose ésta, inadecuada al valor real del inmueble, el profesional podrá estimar el valor que le asigne, de lo que se dará traslado al obligado al pago. En caso de oposición, el juez designará perito tasador… b) Si se trata de bienes muebles o semovientes, se tomará como cuantía del asunto el valor que surja de autos, sin perjuicio de efectuarse la determinación establecida en el inciso a)... g) Si se trata de usufructo o nuda propiedad, se determinará el valor de los bienes conforme el inciso a) de este artículo; i) Si se trata de bienes sujetos a agotamiento, minas, canteras y similares, se determinará el valor por el procedimiento previsto en el inciso b) del presente artículo.';
    } else if (tipoId === 1 && objId === 3) {
      msg += 'Ingresá el valor consignado en las escrituras o documentos respectivos, deducidas las amortizaciones.<br><br>Art. 23 inc. d): Si se trata de derechos crediticios, se tomará como cuantía del asunto el valor consignado en las escrituras o documentos respectivos, deducidas las amortizaciones normales previstas en los mismos, o las extraordinarias que justifique el interesado.';
    } else if (tipoId === 1 && objId === 4) {
      msg += 'Ingresá el valor de cotización de los títulos.<br><br>Art. 23 inc. e): Si se trata de títulos de renta o acciones de entidades privadas, se tomará como cuantía del asunto el valor de cotización de la Bolsa de Comercio de Buenos Aires; si no cotizara en bolsa, el valor que informe cualquier entidad bancaria oficial; si por esta vía fuere imposible lograr la determinación, se aplicará el procedimiento del inciso a).';
    } else if (tipoId === 1 && objId === 5) {
      msg += 'Art. 23 inc. f): Si se trata de establecimientos comerciales, industriales o mineros, se valuará el activo conforme las normas de los incisos de este artículo; se descontará el pasivo justificado por certificación contable u otro medio idóneo en caso de que no se lleve la contabilidad en legal forma, y al líquido que resulte se le sumará un diez por ciento (10%) que será computado como valor llave.';
    } else if (tipoId === 1 && objId === 6) {
      msg += 'Ingresá el valor del bien según estas reglas:<br><br>Art. 23 inc. h): Si se trata de uso y habitación, será valuado en el 10% anual del valor del bien respectivo, justipreciado según las reglas del inciso a) y el resultado se multiplicará por el número de años por el que se transmite el derecho, no pudiendo exceder en ningún caso del 100% de aquél.';
    } else if (tipoId === 1 && objId === 7) {
      msg += 'Ingresá el valor del bien o el monto del boleto si es mayor.<br><br>ARTÍCULO 46.- En los juicios de escrituración y, en general, en los procesos derivados del contrato de compraventa de inmuebles, a los efectos de la regulación, se aplicará la norma del artículo 23, inciso a), salvo que resulte un monto mayor del boleto de compraventa, en cuyo caso se aplicará este último.';
    } else if (tipoId === 1 && objId === 8) {
      msg += 'Ingresá el importe correspondiente a 2 años de la cuota fijada.<br><br>ARTÍCULO 39.- En los juicios de alimentos la base del cálculo de los honorarios será el importe correspondiente a 2 años de la cuota que se fijare judicialmente.';
    } else if (tipoId === 1 && objId === 9) {
      msg += 'Ingresá el valor del patrimonio adjudicado.<br><br>ARTÍCULO 45.- En la liquidación y disolución del régimen patrimonial del matrimonio se regularán honorarios al patrocinante o apoderado de cada parte conforme la escala del art. 21 calculado sobre el patrimonio que se le adjudique a su patrocinado o representado.';
    } else if (tipoId === 1 && objId === 10) {
      msg += 'Si elegís esta opción, cuando llegues al cálculo final, el honorario que se muestra como resultado tendrá una reducción en ese porcentaje.<br><br>ARTÍCULO 38.- Tratándose de acciones posesorias, interdictos o de división de bienes comunes, se aplicará la escala del artículo 21. El monto de los honorarios se reducirá en un 20% atendiendo al valor de los bienes conforme a lo dispuesto en el artículo 23 si fuere exclusivamente en beneficio del patrocinado, con relación a la cuota o parte defendida.';
    } else if (tipoId === 1 && objId === 12) {
      msg += 'En estos casos, los honorarios se reducen en un 25%.<br><br>ARTÍCULO 49.- En las acciones sobre derechos de incidencia colectiva con contenido patrimonial, los honorarios serán los que resulten de la aplicación del artículo 21, reducidos en un 25%.';
    } else if (tipoId === 4) {
      msg += 'Ingrese el valor del patrimonio que se transmite (art. 35).<br>Si la valuación fiscal se consideró inadecuada, se inició y terminó el procedimiento del art. 23 para la valuación de los bienes, ingrese el valor de la estimación.<br>Si hay montos en dólares, tenés que definir el tipo de cambio que vas a usar (oficial venta, MEP, etc.).<br>Si la valuación fiscal se consideró adecuada, ingresa ese monto incrementado en un 50%.<br><br>ARTÍCULO 23.- El monto de los procesos en caso de que existan bienes susceptibles de apreciación pecuniaria, se determinará conforme lo siguiente:<br>a) Si se trata de bienes inmuebles o derechos sobre los mismos y no han sido tasados en autos, se tendrá como cuantía del asunto la valuación fiscal al momento en que se practique la regulación, incrementada en un cincuenta por ciento (50%). No obstante reputándose ésta, inadecuada al valor real del inmueble, el profesional podrá estimar el valor que le asigne, de lo que se dará traslado al obligado al pago. En caso de oposición, el juez designará perito tasador.<br><br>ARTÍCULO 35.- En el proceso sucesorio, los honorarios se regulan sobre el valor del patrimonio que se transmite. Para establecer el valor de los bienes se tendrá en cuenta lo dispuesto en el artículo 23.';
    } else if (tipoId === 5) {
      msg += 'Por lo general, algunos incidentes se consideran de valor autónomo (o lo discutido) y en otros, su base es el del juicio principal.';
    } else if (tipoId === 6) {
      msg += 'Por lo general, algunos incidentes se consideran de valor autónomo (o lo discutido) y en otros, su base es el del juicio principal.';
    } else if (tipoId === 7) {
      msg += 'Ingrese el monto a asegurar.';
    } else if (tipoId === 8) {
      msg += 'Ingresá el valor de la totalidad del contrato. Si es un desalojo sin contrato o en el caso que el profesional haya estimado inadecuado el valor del contrato, ingresá la sumatoria de alquileres estimados o determinados por el perito designado.<br>Nota: si elegiste "alquiler para vivienda" en el paso anterior, no ingreses el monto reducido porque ya estará calculado por el sistema.<br><br>ARTÍCULO 40: En los procesos de desalojo se fijarán los honorarios de acuerdo con la escala del art. 21, tomando como base el total de los alquileres del contrato… Si el profesional estimare inadecuado el alquiler fijado en el contrato o en caso de que éste no pudiera determinarse exactamente o se tratase de juicios por intrusión o tenencia precaria, deberá fijarse el valor locativo actualizado del inmueble, para lo cual el profesional podrá acompañar tasaciones al respecto o designar perito para que lo determine.<br><br>Tratándose de una homologación de convenio de desocupación y su ejecución, los honorarios se regularán en un 50% del establecido en el párrafo primero.';
    }
  } else if (step === 5) {
    msg = 'Este cálculo es orientativo. Los valores finales pueden variar según las circunstancias del caso.';
  } else if (step === 'minimos') {
    msg = 'Los mínimos establecidos por ley garantizan un piso para los honorarios profesionales.';
  }

  footerInfo.innerHTML = '<p>' + msg + '</p>';
}

// ===== Utilidades =====
function formatNumber(num) {
  return new Intl.NumberFormat('es-AR').format(num);
}

function parseNumber(str) {
  if (!str) return null;
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

function truncate(str, length) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

// Muestra error inline en un container, oculta los demás
var errorContainers = ['errorTipoProceso', 'errorContingencias', 'errorObjeto'];
function showError(containerId, msg) {
  errorContainers.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  });
  if (!msg) return;
  var el = document.getElementById(containerId);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function resetState() {
  state.currentStep = 0;
  state.umaValue = null;
  state.history = [0];
  state.selections = {
    tipoProcesoId: null,
    tipoProceso: null,
    modoTerminacion: null,
    subOpcionModo: null,
    excepciones: null,
    abogados: null,
    cautelarOposicion: null,
    tipoLocacion: null,
    caducidadArticulo: null,
    caducidadMomento: null,
    objetoJuicioId: null,
    objetoJuicio: null,
    subOpcionObjeto: null,
    montoJuicio: null
  };
  state.fromMinimos = false;
}

// ===== Bridge: mapea state (nuevo) → wizardState (viejo) para usar core.js / calculations.js =====
function syncWizardState() {
  const s = state.selections;
  // Map tipoProcesoId (1-8) → string
  var tipoMap = {
    1: 'conocimiento', 2: 'ejecucion_sentencia', 3: 'ejecutivo',
    4: 'sucesion', 5: 'exhorto', 6: 'incidente',
    7: 'medida_cautelar', 8: 'homologacion_desocupacion'
  };
  wizardState.tipoProceso = tipoMap[s.tipoProcesoId] || '';
  wizardState.step = state.currentStep;
  wizardState.valorUMA = state.umaValue || window.valorUMA || 92482;

  // Map modoTerminacion
  var modoMap = { 'Sentencia': 'sentencia', 'Modos anormales': 'modos_anormales', 'Caducidad': 'caducidad', 'Honorarios provisorios': 'provisorios' };
  wizardState.modoTerminacion = modoMap[s.modoTerminacion] || '';

  // Map sentenciaResultado (solo aplica si modoTerminacion === 'Sentencia')
  if (s.modoTerminacion === 'Sentencia') {
    wizardState.sentenciaResultado = s.subOpcionModo === 'Demanda admitida' ? 'admitida' : (s.subOpcionModo === 'Demanda rechazada' ? 'rechazada' : null);
  } else {
    wizardState.sentenciaResultado = null;
  }

  // Map aperturaPrueba (boolean: true=después, false=antes)
  // Puede venir de subOpcionModo (modos anormales) o caducidadMomento (caducidad art.25)
  if (s.modoTerminacion === 'Modos anormales') {
    wizardState.aperturaPrueba = s.subOpcionModo === 'Después de apertura a prueba' ? true : (s.subOpcionModo === 'Antes de apertura a prueba' ? false : null);
  } else if (s.caducidadArticulo === 'Art. 25') {
    wizardState.aperturaPrueba = s.caducidadMomento === 'Después de apertura a prueba' ? true : (s.caducidadMomento === 'Antes de apertura a prueba' ? false : null);
  } else {
    wizardState.aperturaPrueba = null;
  }

  // Map caducidadCriterio
  if (s.caducidadArticulo === 'Art. 22') wizardState.caducidadCriterio = 'art22';
  else if (s.caducidadArticulo === 'Art. 25') wizardState.caducidadCriterio = 'art25';
  else wizardState.caducidadCriterio = '';

  // Map tuvoExcepciones (boolean)
  if (s.excepciones === 'Se dedujeron excepciones') wizardState.tuvoExcepciones = true;
  else if (s.excepciones === 'No se dedujeron excepciones') wizardState.tuvoExcepciones = false;
  else wizardState.tuvoExcepciones = null;

  // Map sucesionUnicoLetrado (boolean)
  if (s.abogados === 'Un solo abogado') wizardState.sucesionUnicoLetrado = true;
  else if (s.abogados === 'Varios abogados') wizardState.sucesionUnicoLetrado = false;
  else wizardState.sucesionUnicoLetrado = null;

  // Map medidaOposicion (boolean)
  if (s.cautelarOposicion === 'Cautelar con oposición') wizardState.medidaOposicion = true;
  else if (s.cautelarOposicion === 'Cautelar sin oposición') wizardState.medidaOposicion = false;
  else wizardState.medidaOposicion = null;

  // Map homologacionVivienda (boolean)
  if (s.tipoLocacion === 'Alquiler para vivienda') wizardState.homologacionVivienda = true;
  else if (s.tipoLocacion === 'Demás casos') wizardState.homologacionVivienda = false;
  else wizardState.homologacionVivienda = null;

  // Map objetoBase (id 1-12 → string)
  var objetoMap = {
    1: 'sumas_dinero', 2: 'inmuebles', 3: 'derechos_crediticios',
    4: 'titulos_acciones', 5: 'establecimientos', 6: 'uso_habitacion',
    7: 'escrituracion', 8: 'familia_alimentos', 9: 'familia_liquidacion',
    10: 'posesorias_interdictos', 11: 'desalojo', 12: 'incidencia_colectiva'
  };
  wizardState.objetoBase = objetoMap[s.objetoJuicioId] || '';

  // Map desalojoVivienda (string: 'vivienda'|'civil'|'laboral'|null)
  if (s.subOpcionObjeto === 'Alquiler para vivienda') wizardState.desalojoVivienda = 'vivienda';
  else if (s.subOpcionObjeto === 'Demás casos civiles') wizardState.desalojoVivienda = 'civil';
  else if (s.subOpcionObjeto === 'Desalojo laboral') wizardState.desalojoVivienda = 'laboral';
  else wizardState.desalojoVivienda = null;

  // Map posesoriasTipo (string: 'beneficio'|'demas'|null)
  if (s.subOpcionObjeto === 'Actuación exclusiva beneficio patrocinado') wizardState.posesoriasTipo = 'beneficio';
  else if (s.subOpcionObjeto === 'Demás casos') wizardState.posesoriasTipo = 'demas';
  else wizardState.posesoriasTipo = null;

  // Map baseValor
  wizardState.baseValor = s.montoJuicio || 0;

  // Map esProvisorio
  wizardState.esProvisorio = s.modoTerminacion === 'Honorarios provisorios';

  // Resetear flags que no aplican en la nueva UI
  wizardState.desdeMinimos = false;
  wizardState.desdeResultado = false;
}
window.syncWizardState = syncWizardState;
