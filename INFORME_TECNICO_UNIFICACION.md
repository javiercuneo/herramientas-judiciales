# Informe Tecnico: Unificacion de Proyectos — Asistente de Honorarios Judiciales

**Fecha:** 27 de julio de 2026
**Version:** 1.1 (revisada)
**Objetivo:** Unificar el motor juridico existente (Proyecto A) con la nueva experiencia visual (Proyecto B)

---

## 1. Resumen Ejecutivo

| Aspecto | Proyecto A (Clasico) | Proyecto B (Honorio/Next.js) |
|---------|---------------------|------------------------------|
| **Arquitectura** | Vanilla JS, HTML/CSS estatico | Next.js 16 + React 19 + TypeScript, App Router |
| **Estado** | **Fuente de verdad — completamente funcional** | **Prototipo visual — sin logica legal real** |
| **Logica de negocio** | ~13K lineas JS. Ley 27.423 completa | ~500 lineas TS mock (marketing, descartable) |
| **UX** | Wizard imperativo, DOM directo | Componentes React animados, shadcn/ui |

**Estrategia acordada: Integracion por capa de adaptacion minima.** No se reescribe el motor. Se envuelve con adaptadores TS que la UI de honorio consume. Solo tras validar la integracion se extrae logica pura progresivamente.

---

## 2. Arquitectura de Ambos Proyectos

### 2.1 Proyecto A — `asistente-honorarios-clasico` (Motor Legal)

```
asistente-honorarios-clasico/
+-- index.html
+-- css/styles.css             # ~8KB
+-- js/
    +-- core.js                # 5KB  — UMA, parseNumber, formatNumber, calcularEscalaBase
    +-- state.js               # 5KB  — wizardState global, validarPasoActual, recolectarDatos
    +-- calculations.js        # 43KB — calcularFinal(), mostrarTablasMinimos()
    +-- wizard.js              # 68KB — renderScreen(), navegacion entre pasos, DOM imperativo
```

**Contrato publico del motor (expuesto en `window`):**
- `window.wizardState` — estado global mutable
- `window.valorUMA` — valor de la UMA
- `window.calcularEscalaBase(base, uma)` — calculo de escala pura (7 escalas Art. 21)
- `window.calcularFinal()` — calculo completo con reducciones
- `window.mostrarTablasMinimos(modo)` — tablas de minimos legales
- `window.parseNumber(str)`, `window.formatNumber(num)` — formato argentino
- `window.recolectarDatos()`, `window.validarPasoActual()` — validacion por paso
- `window.cargarUMA()` — fetch desde Google Sheets

### 2.2 Proyecto A — `asistente-honorarios-moderno` (Intento de refactor)

**Estado:** Abandonado. Copia identica de los JS del clasico + `app.js` (90KB) con UI alternativa. Build Vite/React incompleto en `dist/`. No se reutilizara.

### 2.3 Proyecto B — `honorio` (Nuevo Frontend)

```
honorio/
+-- app/
¦   +-- layout.tsx             # Root layout, fonts Geist + Instrument Serif
¦   +-- page.tsx               # ? <InterviewExperience />
¦   +-- globals.css            # Tailwind v4 + shadcn tokens OKLCH
+-- components/
¦   +-- ui/button.tsx          # shadcn/base-ui Button con CVA
¦   +-- interview/
¦       +-- interview-experience.tsx   # Orquestador: intro ? questions ? dashboard
¦       +-- dashboard-view.tsx         # Dashboard final (KPIs, donut, barras)
¦       +-- step-shell.tsx             # Wrapper de paso generico
¦       +-- numeric-field.tsx          # Input numerico con presets
¦       +-- cards-field.tsx            # Grid de tarjetas single/multi select
¦       +-- progress-rail.tsx          # Barra de progreso
¦       +-- context-panel.tsx          # Panel lateral resumen + jump nav
¦       +-- intro-view.tsx             # Pantalla de inicio
¦       +-- explanation-disclosure.tsx # Detalle desplegable
+-- lib/
¦   +-- interview-data.ts      # Schema de 5 pasos (MOCK — debe reemplazarse)
¦   +-- plan.ts                # Logica MOCK (marketing — debe descartarse)
¦   +-- utils.ts               # cn() = clsx + tailwind-merge
+-- package.json               # Next 16, React 19, Tailwind 4, motion, lucide, etc.
+-- tsconfig.json / next.config.mjs / components.json
+-- pnpm-lock.yaml
```

---

## 3. Estrategia de Integracion: Adaptacion Minima

El motor JS existente permanece intacto. Se incorpora a honorio como dependencia externa (scripts globales) y se consume mediante **adaptadores TS** que actuan como puente tipado.

```
+----------------------+     +------------------------------+
¦  honorio/ (Next.js)  ¦     ¦  Motor Legal (Vanilla JS)    ¦
¦                      ¦     ¦                              ¦
¦  Componentes UI      ¦---->¦  Adaptadores TS              ¦---->¦ window.calcularEscalaBase()
¦  (React + Tailwind)  ¦     ¦  (lib/legal/adapters.ts)     ¦     ¦ window.wizardState
¦                      ¦     ¦  Tipos + wrappers            ¦     ¦ window.calcularFinal()
¦  InterviewExperience ¦     ¦  Sin modificar el JS legacy  ¦     ¦ etc.
+----------------------+     +------------------------------+
                                  ?
                             +---------+
                             ¦ public/  ¦
                             ¦ legacy/  ¦
                             ¦ core.js  ¦
                             ¦ state.js ¦
                             ¦ calc.js  ¦
                             +---------+
```

### 3.1 Ciclo de vida del motor en la nueva UI

1. **Carga:** Los scripts JS legacy se cargan via `<script>` en el layout (o dinamicamente en cliente)
2. **Adaptacion:** `adapters.ts` expone funciones tipadas que leen/llaman `window.*`
3. **Estado:** `useWizard` hook sincroniza `wizardState` con React state
4. **Calculo:** Los componentes llaman `adapters.calcularEscalaBase()` o `adapters.calcularFinal()` en lugar de tener logica propia
5. **Renderizado:** El dashboard recibe datos ya calculados y solo se encarga de presentarlos

---

## 4. Plan de Implementacion: Milestone 1 — Integracion

### Fase 0: Preparacion del motor legacy (1 tarea)

```
accion: Copiar los 3 archivos JS del motor a honorio/public/legacy/
origen: asistente-honorarios-clasico/js/{core.js, state.js, calculations.js}
destino: honorio/public/legacy/{core.js, state.js, calculations.js}
```

Se copian **sin modificaciones**. El archivo `wizard.js` (UI imperativa) **NO** se copia — es el que reemplazaremos con la UI de honorio.

### Fase 1: Capa de adaptacion TS (2-3 tareas)

```
Crear: honorio/lib/legal/
+-- types.ts          # Interfaces TS: WizardState, EscalaResult, ProcesoTipo, etc.
+-- adapters.ts       # Wrappers tipados que llaman a window.*
+-- index.ts          # Re-export
```

`adapters.ts` ejemplo:
```typescript
// Funciones puras del motor legacy
export function calcularEscala(base: number, uma: number) {
  return (window as any).calcularEscalaBase(base, uma) as EscalaResult;
}

export function ejecutarCalculoFinal() {
  return (window as any).calcularFinal();
}

export function getWizardState(): WizardState {
  return (window as any).wizardState;
}

export function setWizardState(partial: Partial<WizardState>) {
  Object.assign((window as any).wizardState, partial);
}

export function getUMA(): number {
  return (window as any).valorUMA;
}

export function cargarUMA(): Promise<void> {
  return (window as any).cargarUMA();
}

export function parseNumero(str: string): number {
  return (window as any).parseNumber(str);
}

export function formatNumero(num: number): string {
  return (window as any).formatNumber(num);
}

export function validarPaso(paso: number): string {
  return (window as any).validarPasoActual();
}
```

`types.ts`:
```typescript
export interface WizardState {
  step: number | 'minimos';
  valorUMA: number;
  tipoProceso: string;
  modoTerminacion: string;
  sentenciaResultado: string | null;
  aperturaPrueba: boolean | null;
  caducidadCriterio: string;
  tuvoExcepciones: boolean | null;
  sucesionUnicoLetrado: boolean | null;
  medidaOposicion: boolean | null;
  homologacionVivienda: boolean | null;
  objetoBase: string;
  desalojoVivienda: string | null;
  posesoriasTipo: string | null;
  baseValor: number;
  esProvisorio: boolean;
  desdeMinimos: boolean;
  desdeResultado: boolean;
}

export interface EscalaResult {
  tituloEscala: string;
  baseEnUMA: number;
  minPorc: number;
  maxPorc: number;
  maximoEscalaAnterior: number;
  limiteAnterior: number;
  patrocinante: { full: Etapa; uno: Etapa; dos: Etapa };
  apoderado: { full: Etapa; uno: Etapa; dos: Etapa };
  auxMin: number;
  auxMax: number;
}

export interface Etapa {
  min: number;
  max: number;
}
```

### Fase 2: Schema de wizard legal (1 tarea)

```
Crear: honorio/lib/wizard/wizard-schema.ts
```

Schema declarativo que describe los pasos del wizard legal usando el mismo patron que `interview-data.ts` pero con datos reales:

```typescript
export const LEGAL_STEPS: WizardStep[] = [
  {
    id: 'tipoProceso',
    kind: 'cards',
    select: 'single',
    eyebrow: 'Proceso',
    question: 'Seleccione el tipo de proceso',
    helper: 'El tipo de proceso determina las reglas aplicables',
    options: [
      { id: 'conocimiento', label: 'Juicio de conocimiento', description: 'Proceso ordinario mas completo' },
      { id: 'ejecutivo', label: 'Juicio ejecutivo', description: 'Ejecucion de titulos ejecutivos' },
      // ... resto de opciones
    ]
  },
  // ... mas pasos
];
```

### Fase 3: Hook useWizard (1 tarea)

```
Crear: honorio/hooks/useWizard.ts
```

Hook que sincroniza el `wizardState` global con React state y proporciona navegacion:

```typescript
export function useWizard(steps: WizardStep[]) {
  const [phase, setPhase] = useState<'intro' | 'question' | 'dashboard'>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  // Sincroniza con window.wizardState
  useEffect(() => {
    const ws = getWizardState();
    setAnswers({ tipoProceso: ws.tipoProceso, baseValor: ws.baseValor, ... });
  }, []);

  // Al cambiar una respuesta, actualiza wizardState via adapter
  const handleAnswer = (value: string | string[] | number) => {
    setAnswers(prev => ({ ...prev, [currentStep.id]: value }));
    // Sincronizar con el motor legacy si es necesario
  };

  // Navegacion con validacion via adapter
  const next = () => {
    const error = validarPaso(index);
    if (error) return error;
    // Avanzar paso
  };

  return { phase, index, answers, next, back, jumpTo, currentStep, ... };
}
```

### Fase 4: Integracion de componentes UI (3-4 tareas)

1. **Cargar scripts legacy** en `app/layout.tsx` (o componente cliente dedicado)
2. **Adaptar `InterviewExperience`** para usar `LEGAL_STEPS` en lugar de pasos mock
3. **Adaptar `NumericField`** para formato argentino ($ y UMA)
4. **Adaptar `CardsField`** para sub-opciones condicionales (desalojo ? vivienda/civil/laboral)
5. **Adaptar `ContextPanel`** para mostrar resumen legal (tipo proceso, base, contingencias)
6. **Reemplazar `DashboardView`**: el dashboard deja de usar `derivePlan()` y recibe datos de `adapters.calcularFinal()`

### Fase 5: Integracion del dashboard de resultados (2 tareas)

El dashboard actual de honorio (donut chart, confidence gauge, lever bars) se reemplaza o adapta para mostrar:

- Resumen del juicio (tipo, base, UMA, escala)
- Tabla de honorarios (patrocinante, apoderado, procurador) con etapas (1/3, 2/3, completo)
- Segunda instancia (Art. 30)
- Auxiliares de justicia (5-10%)
- Partidor (solo sucesion)
- Tablas de minimos (Art. 19, 31, 44, 48, 58, 60, 61 bis)

**Importante:** Se reutiliza la estructura visual de honorio (cards, tablas, animaciones) pero los datos provienen del motor legacy via adaptadores.

---

## 5. Estructura Final del Proyecto (Milestone 1)

```
honorio/
+-- public/
¦   +-- legacy/
¦       +-- core.js              # Copia directa del clasico (intacto)
¦       +-- state.js             # Copia directa del clasico (intacto)
¦       +-- calculations.js      # Copia directa del clasico (intacto)
+-- app/                         # (sin cambios estructurales)
+-- lib/
¦   +-- legal/
¦   ¦   +-- types.ts             # Interfaces TS nuevas
¦   ¦   +-- adapters.ts          # Wrappers tipados (nuevo)
¦   ¦   +-- index.ts             # Re-export
¦   +-- wizard/
¦   ¦   +-- wizard-schema.ts     # Schema declarativo (nuevo)
¦   +-- interview-data.ts        # SE ELIMINA (reemplazado por wizard-schema.ts)
¦   +-- plan.ts                  # SE ELIMINA (mock de marketing)
¦   +-- utils.ts                 # Se conserva
+-- hooks/
¦   +-- useWizard.ts             # Hook de estado/navegacion (nuevo)
+-- components/                  # Se adaptan los existentes
+-- package.json                 # Sin cambios
```

**Fuera de honorio (se conservan como referencia):**
```
asistente-honorarios-clasico/   # Referencia historica, fallback legacy
asistente-honorarios-moderno/   # Se archiva/elimina (obsoleto)
```

---

## 6. Riesgos y Mitigaciones (Milestone 1)

| Riesgo | Mitigacion |
|--------|-----------|
| `window.*` no disponible en SSR | Solo cargar adapters en `"use client"`, usar `useEffect` para inicializar |
| Scripts JS legacy no cargados al momento del render | Mostrar "Cargando motor juridico..." hasta que `window.coreLoaded` sea true |
| `wizardState` no es reactivo | El hook `useWizard` lee el estado legacy SOLO al iniciar y al calcular resultado; las respuestas intermedias se manejan en React state |
| Inconsistencia entre React state y `wizardState` al recalcular | Antes de `calcularFinal()`, se vuelca React state ? `wizardState` via adapter |
| El motor legacy espera IDs de DOM que no existen | Los adapters llaman solo funciones de calculo puras, no tocan DOM |

---

## 7. Criterios de Exito del Milestone 1

- [ ] Los 3 archivos JS legacy se cargan desde `public/legacy/`
- [ ] `adapters.ts` expone funciones tipadas que llaman al motor sin errores
- [ ] `wizard-schema.ts` describe correctamente los pasos del wizard legal
- [ ] `useWizard` hook sincroniza estado React ? motor legacy
- [ ] El wizard de 6 pasos funciona visualmente en honorio (navegacion, validacion, resumen lateral)
- [ ] El dashboard de resultados muestra datos reales del motor (no mock)
- [ ] Los calculos coinciden exactamente con el clasico (verificacion manual en 5-10 casos)
- [ ] No se modifico ninguna linea de `core.js`, `state.js` ni `calculations.js`

---

## 8. Post-Milestone 1 (Futuro)

Una vez validada la integracion:

1. **Extraer logica pura:** Portar funciones de `calculations.js` a `lib/legal/calculations.ts` con types
2. **Agregar tests:** Vitest con snapshot de los 20-30 casos extraidos del clasico
3. **Eliminar `public/legacy/`:** Cuando toda la logica este en TS puro
4. **Eliminar duplicados:** Archivar `asistente-honorarios-moderno/`
5. **Migrar `asistente-honorarios-clasico/`** a documentacion/referencia historica

---

*Fin del informe v1.1. Pendiente de confirmacion para iniciar Milestone 1.*
