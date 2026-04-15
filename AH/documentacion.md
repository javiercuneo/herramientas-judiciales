Lógica de navegación del código - flujo de pantallas (pasos 0 al 5).

El asistente maneja un estado lineal de 6 pasos (`wizardState.step` de 0 a 5), pero altera el avance dependiendo de las selecciones del usuario.

### Estructura de Pasos y Avance ("Siguiente ▶")

**Paso 0: Inicio (`step: 0`)**
* **Acción:** El usuario ingresa/modifica el valor de la UMA.
* **Navegación:** Al presionar "Siguiente", se avanza obligatoriamente al **Paso 1**.

**Paso 1: Tipo de proceso (`step: 1`)**
* **Validación:** Se exige seleccionar una opción del menú desplegable.
* **Navegación según selección:**
    * Si se elige **`exhorto`**: Salta directamente al **Paso 5** (Resultado). Omite contingencias, objeto y base.
    * Si se elige **`incidente`**: Salta directamente al **Paso 4** (Base). Omite contingencias y objeto.
    * Si se elige **`medida_cautelar`**: Avanza al **Paso 2** (Contingencias).
    * Si se elige **`conocimiento`**, **`ejecucion_sentencia`**, **`ejecutivo`**, **`sucesion`** u **`homologacion_desocupacion`**: Avanzan al **Paso 2** (Contingencias).

**Paso 2: Contingencias (`step: 2`)**
* **Opciones anidadas obligatorias según el proceso elegido en el Paso 1:**
    * Para **`conocimiento`**, **`ejecucion_sentencia`**, o **`ejecutivo`**:
        * Pide elegir "Modo de terminación".
        * Si es *`sentencia`* -> Pide elegir Resultado (`admitida` / `rechazada`).
        * Si es *`modos_anormales`* -> Pide elegir Apertura a prueba (`antes` / `despues`).
        * Si es *`caducidad`* -> Pide elegir Criterio (`art22` / `art25`). Si elige `art25`, pide además Apertura a prueba (`antes` / `despues`).
        * Si es *`provisorios`* -> No pide sub-opciones.
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
* **Opciones:** Pide elegir el objeto de la demanda (`desalojo`, `sumas_dinero`, `inmuebles`, etc.).
    * Si se elige **`desalojo`**: Despliega una sub-opción obligatoria para elegir el Tipo de locación (`vivienda` / `otros`).
* **Navegación:** Al validar y presionar "Siguiente", avanza al **Paso 4** (Base).

**Paso 4: Base (`step: 4`)**
* **Validación:** Exige que se ingrese un monto numérico mayor a 0 en el campo de texto.
* **Navegación:** Al presionar "Siguiente", avanza al **Paso 5** (Resultado).

**Paso 5: Resultado (`step: 5`)**
* **Navegación final:** En este paso se muestran los cálculos.
* El botón "Siguiente" cambia su texto a "Calcular" (sirve para refrescar los cálculos en la misma pantalla).
* Si el proceso elegido en el Paso 1 fue `exhorto` o `incidente`, el botón "Siguiente/Calcular" desaparece por completo de la interfaz, limitando al usuario a volver atrás o reiniciar.

---

### Lógica de "Reiniciar"

* **Acción:** Reemplaza el objeto completo de estado (`wizardState`) por sus valores en blanco/por defecto, borra todo el progreso y fuerza el `step` nuevamente a **0**.
* **Disponibilidad:** Visible en todos los pasos excepto en el Paso 0. Ignora cualquier trampa de navegación.
