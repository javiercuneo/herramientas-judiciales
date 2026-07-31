Lógica de navegación del código - flujo de pantallas (pasos 0 al 5, más la pantalla de mínimos).

El asistente maneja un estado lineal de 6 pasos (`wizardState.step` de 0 a 5), pero altera el avance dependiendo de las selecciones del usuario. Existe además una pantalla especial de mínimos arancelarios (`wizardState.step === 'minimos'`) accesible desde el paso 0.

### Estructura de Pasos y Avance ("Siguiente →")

**Paso 0: Inicio (`step: 0`)**
* **Acción:** El usuario ingresa/modifica el valor de la UMA.
* **Navegación:** Al presionar "Siguiente", se avanza obligatoriamente al **Paso 1**.
* **Extras:** Hay un botón "Ver mínimos arancelarios" que abre la pantalla de mínimos (`step='minimos'`).

**Paso 1: Tipo de proceso (`step: 1`)**
* **Validación:** Se exige seleccionar una opción del menú desplegable.
* **Opciones:** `conocimiento`, `ejecucion_sentencia`, `ejecutivo`, `sucesion`, `exhorto`, `incidente`, `medida_cautelar`, `homologacion_desocupacion`.
* **Navegación según selección:**
    * Si se elige **`exhorto`**: Salta directamente al **Paso 5** (Resultado). Omite contingencias, objeto y base.
    * Si se elige **`incidente`**: Salta directamente al **Paso 4** (Base). Omite contingencias y objeto.
    * Si se elige **`medida_cautelar`** o **`homologacion_desocupacion`**: Avanza al **Paso 2** (Contingencias).
    * Si se elige **`conocimiento`**, **`ejecucion_sentencia`**, **`ejecutivo`** o **`sucesion`**: Avanzan al **Paso 2** (Contingencias).
* **Nota:** los procesos de mínimos arancelarios no se eligen aquí; entran por la pantalla de mínimos del paso 0.

**Paso 2: Contingencias (`step: 2`)**
* **Opciones anidadas obligatorias según el proceso elegido en el Paso 1:**
    * Para **`conocimiento`**, **`ejecucion_sentencia`** o **`ejecutivo`**:
        * Pide elegir "Modo de terminación": `sentencia`, `modos_anormales`, `caducidad` o `provisorios` (art. 12).
        * Si es *`sentencia`* -> Pide elegir Resultado (`admitida` / `rechazada`).
        * Si es *`modos_anormales`* -> Pide elegir Apertura a prueba (`antes` / `despues`).
        * Si es *`caducidad`* -> Pide elegir Criterio (`art22` / `art25`). Si elige `art25`, pide además Apertura a prueba (`antes` / `despues`).
        * Si es *`provisorios`* -> No pide sub-opciones (solo se mostrará el mínimo en el resultado).
        * *Específico para `ejecucion_sentencia` o `ejecutivo`:* Pide adicionalmente elegir Excepciones (`si` / `no`).
    * Para **`sucesion`**:
        * Pide elegir Único letrado (`si` / `no`).
    * Para **`medida_cautelar`**:
        * Pide elegir Oposición (`si` / `no`).
    * Para **`homologacion_desocupacion`**:
        * Pide elegir Tipo de locación (`vivienda` / `otros`).
* **Navegación al presionar "Siguiente" (tras validar):**
    * Si el proceso es **`conocimiento`**: Avanza al **Paso 3** (Objeto del juicio).
    * Para **cualquier otro proceso** que haya pasado por aquí: Salta directamente al **Paso 4** (Base).

**Paso 3: Objeto del juicio (`step: 3`)**
* **Condición de entrada:** Este paso *solo* renderiza contenido si el tipo de proceso es `conocimiento`. (Si por alguna razón interna se accede sin serlo, la función `renderScreen` fuerza un salto automático al **Paso 4**).
* **Opciones:** desalojo, sumas de dinero, inmuebles o muebles, derechos crediticios, títulos de renta o acciones, establecimientos, uso o habitación, escrituración, alimentos (art. 39), liquidación del régimen patrimonial del matrimonio (art. 45), acciones posesorias/interdictos (art. 38) e incidencia colectiva (art. 49).
* **Sub-opciones obligatorias:**
    * Si se elige **`desalojo`**: Tipo de locación (`vivienda` / `civil` / `laboral`).
    * Si se elige **`posesorias_interdictos`**: Tipo de actuación (`beneficio` / `demas`).
* **Navegación:** Al validar y presionar "Siguiente", avanza al **Paso 4** (Base).

**Paso 4: Base (`step: 4`)**
* **Validación:** Exige que se ingrese un monto numérico mayor a 0 en el campo de texto.
* **Navegación:** Al presionar "Siguiente", avanza al **Paso 5** (Resultado). La leyenda de ayuda varía según el proceso/objeto (art. 23, art. 35, etc.).

**Paso 5: Resultado (`step: 5`)**
* **Navegación final:** En este paso se muestran los cálculos.
* El botón "Siguiente" cambia su texto a "Calcular" (sirve para refrescar los cálculos en la misma pantalla).
* El botón "Siguiente/Calcular" desaparece por completo de la interfaz si el proceso es `exhorto`, `incidente` o cualquiera de los de mínimos (`minimos_judiciales`, `minimos_judicial`, `minimos_extrajudicial`, `minimos_art58`, `minimos_recursos_csjn`, `minimos_auxiliares`), limitando al usuario a volver atrás o reiniciar.

**Pantalla de mínimos arancelarios (`step: 'minimos'`)**
* Se abre desde el botón "Ver mínimos arancelarios" del Paso 0, o como destino de "Atrás" desde un resultado de mínimos.
* **Opciones:** extrajudicial (art. 19 b), judicial (art. 19 a), acciones de inconstitucionalidad/amparo (art. 48), contencioso administrativo (art. 44), mínimos del art. 58, recursos CSJN (art. 31) y auxiliares de justicia.
* Las opciones de art. 48 y art. 44 muestran su tabla en la misma pantalla (sin "Siguiente").
* Al presionar "Siguiente" (según opción), se fija `tipoProceso` en `minimos_*` y se salta al **Paso 5**.
* El botón "Volver al inicio" retorna al Paso 0 (o "Volver al resultado" si se entró desde un resultado, flag `desdeResultado`).

### Lógica de "Atrás" inteligente
* **Acción:** Retrocede según el tipo de proceso, respetando los saltos de ida.
* Desde el **Paso 5**: si se vino desde mínimos (`desdeMinimos` o `tipoProceso` `minimos_*`) vuelve a la pantalla de mínimos; si el proceso es `exhorto` o `minimos_judiciales` vuelve al Paso 1; en los demás casos vuelve al Paso 4 (Base).
* Desde el **Paso 4** con proceso `incidente`: vuelve al Paso 1.
* En los demás casos retrocede un paso.

### Lógica de "Reiniciar"
* **Acción:** Reemplaza el objeto completo de estado (`wizardState`) por sus valores en blanco/por defecto, borra todo el progreso y fuerza el `step` nuevamente a **0**. Conserva el valor de la UMA actualizado (`window.valorUMA`).
* **Disponibilidad:** Visible en todos los pasos excepto en el Paso 0. Ignora cualquier trampa de navegación.