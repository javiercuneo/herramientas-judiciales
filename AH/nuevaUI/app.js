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

// ===== Mínimos de Honorarios =====
const minimosHonorarios = [
  { tipo: 'Juicio de conocimiento', minimo: 30 },
  { tipo: 'Ejecución de sentencia', minimo: 20 },
  { tipo: 'Juicio ejecutivo', minimo: 20 },
  { tipo: 'Sucesión', minimo: 25 },
  { tipo: 'Exhorto', minimo: 5 },
  { tipo: 'Incidente', minimo: 10 },
  { tipo: 'Medida cautelar', minimo: 10 },
  { tipo: 'Homologación de convenio', minimo: 15 }
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
  renderStepper();
  renderStep(0);
  setupNavigation();
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
  `;

  // Event listeners para tarjetas
  document.querySelectorAll('.selectable-card').forEach(card => {
    card.addEventListener('click', () => {
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
        document.querySelectorAll('[data-caducidad-momento]').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        state.selections.caducidadMomento = opt.dataset['caducidad-momento'] || opt.dataset.caducidadMomento;
      });
    });
  }

  // Excepciones
  document.querySelectorAll('[data-excepciones]').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('[data-excepciones]').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.selections.excepciones = opt.dataset.excepciones;
    });
  });

  // Abogados (Sucesión)
  document.querySelectorAll('[data-abogados]').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('[data-abogados]').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.selections.abogados = opt.dataset.abogados;
    });
  });

  // Cautelar
  document.querySelectorAll('[data-cautelar]').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('[data-cautelar]').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.selections.cautelarOposicion = opt.dataset.cautelar;
    });
  });

  // Locación
  document.querySelectorAll('[data-locacion]').forEach(opt => {
    opt.addEventListener('click', () => {
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
  `;

  // Event listeners para tarjetas
  document.querySelectorAll('.selectable-card').forEach(card => {
    card.addEventListener('click', () => {
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
  mainContent.innerHTML = `
    <div class="result-screen">
      <h2>Resultado del Cálculo</h2>
      <p>Honorarios estimados según Ley 27.423</p>
      
      <!-- Contenedor donde se inyectará el resultado de tus cálculos -->
      <div id="resultadoCalculo" class="result-card">
        <p>Aquí se mostrarán los resultados de tus cálculos.</p>
        <p>Datos disponibles en el objeto <code>state</code>:</p>
        <pre style="text-align: left; font-size: 12px; background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto;">${JSON.stringify(state, null, 2)}</pre>
      </div>
      
      <div class="result-actions">
        <button class="btn btn-secondary" id="btnNuevoCalculo">
          ${icons.calculator}
          Nuevo Cálculo
        </button>
      </div>
    </div>
  `;
  
  // ====================================================
  // INYECTA TUS CÁLCULOS AQUÍ
  // Podés llamar a tu función de cálculo y actualizar el DOM:
  // Ejemplo:
  //   const resultado = tuFuncionDeCalculo(state);
  //   document.getElementById('resultadoCalculo').innerHTML = resultado;
  // ====================================================
  
  document.getElementById('btnNuevoCalculo').addEventListener('click', () => {
    resetState();
    navigateTo(0);
  });
  
  // Ocultar botón siguiente en resultado
  btnNext.style.display = 'none';
}

// ===== Pantalla de Mínimos =====
function renderMinimos() {
  const umaActual = state.umaValue || 1;
  
  mainContent.innerHTML = `
    <div class="minimos-screen">
      <h2>Honorarios Mínimos</h2>
      <p>Valores mínimos según tipo de proceso ${state.umaValue ? `(UMA: $${formatNumber(state.umaValue)})` : ''}</p>
      
      <div class="minimos-table">
        <table>
          <thead>
            <tr>
              <th>Tipo de Proceso</th>
              <th>Mínimo (UMAs)</th>
              ${state.umaValue ? '<th>Valor ($)</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${minimosHonorarios.map(item => `
              <tr>
                <td>${item.tipo}</td>
                <td class="minimos-value">${item.minimo} UMAs</td>
                ${state.umaValue ? `<td class="minimos-value">$${formatNumber(item.minimo * umaActual)}</td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="back-from-minimos">
        <button class="btn btn-secondary" id="btnVolverInicio">
          Volver al inicio
        </button>
      </div>
    </div>
  `;

  document.getElementById('btnVolverInicio').addEventListener('click', () => {
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
      alert('Por favor seleccioná un tipo de proceso');
      return;
    }
    
    // Bifurcación de navegación
    const tipoId = state.selections.tipoProcesoId;
    
    if (tipoId === 5) { // Exhorto -> directo a Resultado (pero necesita monto)
      navigateTo(4); // Primero va a monto
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
      alert('Por favor seleccioná el objeto del juicio');
      return;
    }
    
    // Validar sub-opciones si aplica
    const objeto = objetosJuicio.find(o => o.id === state.selections.objetoJuicioId);
    if (objeto.hasSubOptions && !state.selections.subOpcionObjeto) {
      alert('Por favor seleccioná la sub-opción correspondiente');
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
      alert('Por favor seleccioná el modo de terminación');
      return false;
    }
    
    // Validar sub-opciones de modo
    if (state.selections.modoTerminacion === 'Sentencia' && !state.selections.subOpcionModo) {
      alert('Por favor indicá si la demanda fue admitida o rechazada');
      return false;
    }
    if (state.selections.modoTerminacion === 'Modos anormales' && !state.selections.subOpcionModo) {
      alert('Por favor indicá cuándo se produjo');
      return false;
    }
    if (state.selections.modoTerminacion === 'Caducidad') {
      if (!state.selections.caducidadArticulo) {
        alert('Por favor seleccioná el artículo a aplicar');
        return false;
      }
      if (state.selections.caducidadArticulo === 'Art. 25' && !state.selections.caducidadMomento) {
        alert('Por favor indicá cuándo se declaró la caducidad');
        return false;
      }
    }
  }

  // Ejecución y Ejecutivo -> excepciones
  if ([2, 3].includes(tipoId) && !state.selections.excepciones) {
    alert('Por favor indicá si se dedujeron excepciones');
    return false;
  }

  // Sucesión -> abogados
  if (tipoId === 4 && !state.selections.abogados) {
    alert('Por favor indicá la cantidad de abogados');
    return false;
  }

  // Medida cautelar -> oposición
  if (tipoId === 7 && !state.selections.cautelarOposicion) {
    alert('Por favor indicá si hubo oposición');
    return false;
  }

  // Homologación -> tipo locación
  if (tipoId === 8 && !state.selections.tipoLocacion) {
    alert('Por favor indicá el tipo de locación');
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
  const infos = {
    0: 'El valor de la UMA (Unidad de Medida Arancelaria) se actualiza periódicamente. Consultá el valor vigente antes de realizar el cálculo.',
    1: 'Seleccioná el tipo de proceso judicial para determinar la escala aplicable según la Ley 27.423.',
    2: 'Las contingencias procesales pueden modificar el porcentaje de honorarios aplicable.',
    3: 'El objeto del juicio determina la base de cálculo y los porcentajes específicos a aplicar.',
    4: 'Ingresá el monto reclamado o el valor del bien en disputa como base regulatoria.',
    5: 'Este cálculo es orientativo. Los valores finales pueden variar según las circunstancias del caso.',
    minimos: 'Los mínimos establecidos por ley garantizan un piso para los honorarios profesionales.'
  };
  
  footerInfo.innerHTML = `<p>${infos[step] || ''}</p>`;
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
