# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Read `docs/ESTADO.md` before starting any work.** It carries what the code
> can't: where the current effort stands, which design and interpretive
> decisions were already made and why, what is known to be broken, and the
> traps that have already cost time. It is updated in the same commit as the
> work it describes.

## What this repo is

A collection of legal/judicial tools for Argentine legal practice (plazos, honorarios, tasa de justicia). It is **not one app** — it's several independent projects at different maturity levels living side by side in one repo. Most are static HTML/JS tools deployed via GitHub Pages; one (`honorio/`) is an active Next.js migration.

## Critical rules (from AGENTS.md / PROJECT_CONTEXT.md — apply repo-wide)

These override generic engineering instincts. This is legal-calculation software; correctness of the math is the product.

- **Never modify existing calculation logic** (scales, percentages, coefficients, normative rules) without explicit justification and confirmation. Current outputs are considered legally correct and are the reference to preserve.
- Do not simplify legal formulas, reorder calculation steps, or remove existing validations without explaining the impact first.
- Refactors must preserve behavior exactly: separate logic/UI/flow, don't change results.
- Propose a plan before large changes; make incremental, small, controlled edits; explain each change; ask when there's ambiguity.
- Priority order for this project: **1) Legal accuracy, 2) Code clarity, 3) Maintainability, 4) New features (controlled), 5) Performance (last).**

## Repo structure

```
calculadoras/                    Standalone single-file HTML calculators (plazos, mora, tasa, prorrateo, etc.)
                                  Each .html embeds its own JS; calendario-judicial.js is a shared dependency
                                  for date-based calculators (caducidad, entre-fechas, regresiva, vencimientos).
data/dias-inhabiles.json         Shared local holidays data (fallback alongside an external API).

asistente-honorarios-clasico/    THE reference implementation ("fuente de verdad") of the Ley 27.423
                                  fee-calculation engine. Vanilla JS, wizard UI, DOM-driven. Modules:
                                    js/core.js         - pure calc: UMA, parseNumber/formatNumber, calcularEscalaBase (Art. 21 scales)
                                    js/state.js         - global wizardState + step validation
                                    js/calculations.js  - calcularFinal(), mostrarTablasMinimos() (~43KB, bulk of legal logic)
                                    js/wizard.js         - screen rendering / navigation (imperative DOM, ~68KB)
honorio/                          ACTIVE — Next.js 16 + React 19 + TypeScript rewrite of the fee-calculator UX.
                                  This is where current development happens. See below.

PDF-studio/                       Separate small Express + vanilla JS PWA (PDF tooling). Independent app,
                                  own package.json, own server.js. Not related to the honorarios engine.

docs/domain/                      Domain documentation (numbered 01-08): process types, legal flow, business
                                  rules, domain model, dependencies, process matrix, glossary, known functional
                                  tech debt. Read these before touching legal calculation logic — they describe
                                  the *why* behind the rules in calculate.ts / calculations.js.
INFORME_TECNICO_UNIFICACION.md    Technical plan for unifying the classic engine with the honorio/ frontend
                                  (Milestone 1 integration strategy — adapter layer, no engine rewrite).
```

## `honorio/` — active Next.js app

### Commands (run from `honorio/`)

```bash
npm run dev     # Next dev server
npm run build   # Next production build
npm run start   # Serve production build
npm run lint    # eslint .
```

There is no configured test runner (`jest` is a devDependency but there is no jest config or `test` script). Validation "tests" in `lib/legal/__tests__/*.validation.ts` are standalone scripts, run individually with `tsx`:

```bash
npx tsx lib/legal/__tests__/buildGeneral.validation.ts
npx tsx lib/legal/__tests__/helpers.validation.ts
# etc. — one file per concern (escala, reduccionesBase, reduccionesEscala, reduccionesFinales,
# segundaInstanciaPartidor, buildGeneral, buildEspeciales)
```

Each validation script compares the new TS implementation against known-correct values (originally derived from the legacy vanilla-JS engine) and exits non-zero on mismatch. When changing anything in `lib/legal/calculate.ts`, run the relevant validation script(s) before considering the change done.

### Architecture (migration in progress, see `honorio/docs/ARQUITECTURA.md`)

The guiding principle: **the legal engine's logic is being ported from vanilla JS to pure TypeScript incrementally, without ever changing computed results.** Two engines currently coexist:

1. **`public/legacy/`** — a temporary copy of `core.js`, `state.js`, `calculations.js` from `asistente-honorarios-clasico/js/`, loaded via `<script>` and driven through `window.*` for whatever hasn't been ported yet. Marked explicitly temporary in `public/legacy/README.md` — do not add new dependents on it.
2. **`lib/legal/calculate.ts`** — the growing pure-TS port. Contains `calcularEscala`, `aplicarReduccionesBase/Escala/Finales`, per-role calculators (`calcularApoderado`, `calcularProcurador`, `calcularAuxiliares`, `calcularSegundaInstancia`, `calcularPartidor`), and process builders (`buildGeneral`, `buildMedidaCautelar`, `buildHomologacion`) registered in `PROCESS_REGISTRY`. This is now the primary place fee logic lives for ported process types — check here before assuming logic only exists in `public/legacy/`.

Layering (presentation → application → adaptation → data → engine):

```
components/interview/*, components/dashboard/*   React presentation only — no legal rules, just rendering
        ↓ consumes
hooks/useWizard.ts                                Orchestration: reads wizard-schema, holds React state,
                                                    calls adapters, drives step navigation/branching
        ↓ consumes
lib/legal/adapters.ts, lib/legal/calculate.ts,     Framework-agnostic TS. adapters.ts wraps whatever still
lib/legal/render-legacy.ts, lib/legal/types.ts     needs window.* (legacy engine); calculate.ts holds ported
                                                    pure logic; render-legacy.ts renders structured results
                                                    back into legacy-shaped HTML where still needed.
        ↓ (adapters.ts talks to)
lib/wizard/wizard-schema.ts                        Declarative step definitions (id, kind, options, validation,
                                                    branching conditions) — data only, no React, no logic.
        ↓ (legacy fallback only)
public/legacy/{core,state,calculations}.js         Original engine, untouched, loaded as scripts.
```

Key invariants to preserve when working in `honorio/`:
- `lib/legal/adapters.ts` and `calculate.ts` must stay framework-agnostic (no React imports, no JSX).
- `lib/wizard/wizard-schema.ts` must stay pure data (no React, no side effects).
- Components under `components/` render only — legal logic doesn't belong there.
- Path alias `@/*` maps to `honorio/` root (see `tsconfig.json`).
- `public/legacy/*.js` must remain byte-identical to `asistente-honorarios-clasico/js/*.js` — if the classic engine changes, the copy must be updated deliberately, not diverged from.

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 + shadcn/ui (`components.json`), `motion` for animation, `lucide-react` icons, package manager is pnpm (`pnpm-lock.yaml` is authoritative; `package-lock.json` also present).

## Working across the repo

- Before editing legal calculation code anywhere (`calculate.ts`, `calculations.js`, `core.js`), check `docs/domain/03_REGLAS_DE_NEGOCIO.md` and `docs/domain/07_GLOSARIO.md` for the normative reasoning, and `docs/domain/08_DEUDA_TECNICA_FUNCIONAL.md` for known issues that may already be tracked.
- If a fix belongs in the shared engine, prefer fixing it in `asistente-honorarios-clasico/js/` (the canonical source) and propagating deliberately to `honorio/public/legacy/`, rather than patching one copy silently.
- The standalone calculators in `calculadoras/` are independent single-file tools — no shared build step, no bundler; edits are direct HTML/JS file edits.
