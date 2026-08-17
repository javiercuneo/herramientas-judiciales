# Herramientas para la práctica judicial

**L. Javier Cúneo Libarona** — abogado. Prosecretario Administrativo en un
juzgado civil.

Software para lo que hago todos los días: computar plazos, regular honorarios,
liquidar la tasa. Cada herramienta salió de un problema concreto de trabajo, no
de una idea de producto.

**[Ver las herramientas →](https://javiercuneo.com.ar/)**

---

## Honorio

Asistente para la regulación de honorarios de la **Ley 27.423**. Es el proyecto
principal, y desde agosto de 2026 **vive en su propio repositorio y dominio**:
[honorio.ar](https://honorio.ar) · [javiercuneo/honorio](https://github.com/javiercuneo/honorio).

Se fue con toda su historia. Acá quedó lo demás.

Hace una entrevista corta sobre el expediente y devuelve el honorario con cada
paso del cálculo a la vista: la base, las reducciones aplicadas, la escala del
art. 21, el ajuste por rol y la segunda instancia.

**No es una caja negra a propósito.** La ley es ambigua en varios puntos y la
jurisprudencia está dispersa. Donde la app adopta un criterio interpretativo lo
declara junto al número, detrás de un «por qué». Quien no quiere leerlo no lo
lee; quien tiene que fundar una regulación lo tiene ahí.

- Primera y segunda instancia, para patrocinante, apoderado, procurador y
  auxiliares.
- Procesos de conocimiento, ejecución de sentencia, ejecutivo, sucesión, medida
  cautelar, homologación, exhorto e incidente.
- Reducciones de los arts. 22, 25, 34, 35, 37, 38, 40, 41 y 49, mostrando qué
  transformó cada una.
- Regulaciones provisorias del art. 12, reparto por etapas y mínimos
  arancelarios como tabla de referencia.

[Abrir Honorio](https://honorio.ar) ·
[Código y documentación](https://github.com/javiercuneo/honorio) ·
[Registro de versiones](https://github.com/javiercuneo/honorio/blob/main/CHANGELOG.md)

---

## Calculadoras

Herramientas de un solo archivo, sin instalación y sin backend. Todo se calcula
en el navegador: nada de lo que escribís sale de tu máquina.

### Plazos

| Herramienta | Qué hace |
|---|---|
| [Vencimiento de plazos](https://javiercuneo.com.ar/calculadoras/vencimientos.html) | Vencimiento de un plazo judicial desde una fecha de inicio. |
| [Caducidad de la instancia](https://javiercuneo.com.ar/calculadoras/caducidad.html) | Cómputo de los arts. 310 y ss. del CPCCN. |
| [Ampliación por distancia](https://javiercuneo.com.ar/calculadoras/distancia.html) | Art. 158 CPCCN, dentro del país o al exterior. |
| [Contador de días](https://javiercuneo.com.ar/calculadoras/entre-fechas.html) | Días hábiles o corridos entre dos fechas. |
| [Fecha límite (regresiva)](https://javiercuneo.com.ar/calculadoras/regresiva.html) | Resta días hábiles a una fecha objetivo para saber hasta cuándo hay tiempo. |
| [Mora](https://javiercuneo.com.ar/calculadoras/mora.html) | Inicio de la mora según el plazo de la resolución y la fecha en que quedó firme. |
| [Ejecución de sentencias contra el Estado](https://javiercuneo.com.ar/calculadoras/ejecucion-estado.html) | Desde cuándo una sentencia contra el Estado Nacional es ejecutable y embargable (art. 170, Ley 11.672). |

Las que dependen de fechas usan un calendario judicial compartido, y **todo lo
que necesitan está en el repositorio**: los feriados nacionales en
[`data/feriados.json`](data/feriados.json) y los asuetos por Acordada en
[`data/dias-inhabiles.json`](data/dias-inhabiles.json). En tiempo de uso no se
le pide nada a nadie. Los feriados se actualizan con `npm run feriados`, que los
baja de una API, los controla y los escribe; si la API no contesta, el script
falla y deja el archivo como estaba.

### Honorarios y tributos

| Herramienta | Qué hace |
|---|---|
| [Honorarios del mediador](https://javiercuneo.com.ar/calculadoras/honorarios-mediacion.html) | Ley 26.589. |
| [Prorrateo (art. 730 CCyCN)](https://javiercuneo.com.ar/calculadoras/prorrateo.html) | Límite de responsabilidad del deudor por las costas. |
| [Tasa de justicia](https://javiercuneo.com.ar/calculadoras/tasa.html) | Ley 23.898, orientada a procesos civiles. |

### Otras

| Herramienta | Qué hace |
|---|---|
| [PDF Studio](https://javiercuneo.com.ar/PDF-studio/) | Unir, separar, rotar y comprimir PDF sin subirlos a ningún lado. |
| [Asistente de honorarios clásico](https://javiercuneo.com.ar/asistente-honorarios-clasico/) | La versión original de la que salió Honorio. Se conserva funcionando como referencia. |

---

## Bandejito

Aplicación en Google Apps Script que automatizaba la distribución de los
escritos que ingresaban al juzgado: leía el PDF del listado diario, extraía cada
registro, clasificaba beneficios y confrontes, repartía según las reglas
internas de la oficina por los últimos números del expediente y mandaba a cada
responsable el correo con sus tareas y las alertas de vencimiento.

Estuvo en uso hasta que lo reemplazó un desarrollo institucional.
[Ver cómo funcionaba](https://javiercuneo.com.ar/proyectos%20finalizados/bandejito.html).

---

## Sobre el uso de IA

El código de este repositorio está escrito con asistencia de modelos de
lenguaje. No hay razón para esconderlo y tampoco mucho mérito en negarlo: hoy
cualquiera genera una calculadora.

Lo que un modelo no genera es el criterio. Mis interpretaciones de esta ley
estaban resueltas antes de que existiera la aplicación: el asistente clásico,
que sigue publicado, ya distinguía por ejemplo los dos criterios alternativos
para la caducidad de instancia —art. 22 como demanda desestimada, o art. 25
como los demás modos anormales— y explicaba cuándo se reduce cada cosa.

Durante la reescritura del código, el paso de una versión HTML pura al sitio
actual, se produjo una regresión sobre ese punto ya decidido: el motor pasó a
acumular las dos quitas sobre el mismo hecho, una rama que el clásico nunca
tuvo. Ocurrió en un nivel que mi ojo de abogado no ve, el del lenguaje de
programación, y estuvo tres días en una versión publicada hasta que se corrigió
el 3 de agosto de 2026. Tener el criterio escrito de antemano es lo que permitió
detectarla.

Por eso el trabajo está en dos lugares que no son el código:

- **Decidir qué hace la herramienta donde la ley no es clara**, y dejar escrito
  por qué. Está en [`docs/domain/`](docs/domain/) —publicado en
  [la documentación de dominio](https://javiercuneo.com.ar/docs/)—
  y, para Honorio, en los «por qué» de la propia app.
- **Verificar que el número sea el correcto.** Ver abajo.

---

## Cómo se verifica

El motor de Honorio —hoy en [su repositorio](https://github.com/javiercuneo/honorio)—
tiene **17 suites de validación**, una por concern:

- **El cálculo:** escala del art. 21, reducciones sobre la base, sobre la escala
  y sobre el honorario ya calculado, segunda instancia y partidor, provisorios,
  y las funciones de apoderado, procurador y auxiliares contra la aritmética
  original de la que salieron.
- **Los procesos:** generales, especiales, exhorto e incidente, actuaciones
  posteriores a la ejecución, modificación de alimentos, mínimos de auxiliares y
  honorarios del mediador.
- **Los dos caminos de entrada:** que el cálculo directo dé exactamente lo mismo
  que la entrevista recorrida por un caso sin ninguna reducción. Si alguna vez
  difieren, uno de los dos está mal.
- **El texto de la regulación en prosa**, que es la única que no compara
  números: produce un documento con forma de resolución, y hasta que existió
  ninguna validación miraba prosa.
- **Un barrido exhaustivo de los 28.224 cruces** de la entrevista —cada uno de
  los 168 recorridos posibles contra cada uno de los otros—, que prueba que
  volver atrás y cambiar el tipo de proceso no deja pegada ninguna respuesta que
  ya no se preguntó.

Cada caso es una entrada con su resultado esperado, escrito a mano en el archivo
de validación: **no hay autoridad externa detrás**, ni jurisprudencia ni tabla
oficial. Lo que garantizan es consistencia, no corrección — que el número de hoy
sea el mismo que el de ayer salvo que alguien haya decidido cambiarlo y lo haya
escrito.

Con esa limitación, no son opcionales ni decorativas: son lo que impide que un
cambio de interfaz mueva un número. Corren solas en cada push y en cada pull
request, y el sitio **no se publica si alguna falla**. Desde el repositorio de
Honorio:

```bash
npm run check
```

Sobre eso hay tres reglas que sostienen al resto:

1. **Los resultados actuales se consideran correctos** y son la referencia a
   preservar. Un refactor que mejora el código y cambia un número no es un
   refactor: es un error.
2. **Un cambio de resultado se documenta siempre**, con el caso concreto y el
   artículo que lo funda, aunque el diff sea de una línea. Está en el
   [CHANGELOG](https://github.com/javiercuneo/honorio/blob/main/CHANGELOG.md), que por eso se versiona según qué le pasó
   al número y no según cuánto código se tocó.
3. **Las reglas jurídicas viven en una sola capa** (`lib/legal/`). La interfaz
   solo dibuja. Detalle en su [README](https://github.com/javiercuneo/honorio#cómo-está-armado).

La continuidad del trabajo —decisiones tomadas, lo que se sabe roto, las
trampas que ya costaron tiempo— está en [`docs/ESTADO.md`](docs/ESTADO.md), que
se actualiza en el mismo commit que el trabajo que describe. Lo que ya se cerró
—cómo se llegó hasta acá y por qué cada cosa quedó como quedó— está en
[`docs/HISTORIA.md`](docs/HISTORIA.md).

---

## Responsabilidad

Estas herramientas son de carácter **referencial y orientativo**. No sustituyen
el criterio del juez natural de la causa ni constituyen asesoramiento legal.
Quien las usa es responsable de verificar el resultado antes de darle efecto.

Honorio, en particular, **no aplica los mínimos arancelarios automáticamente**:
si el cálculo cae por debajo de un mínimo que corresponde, hay que desestimarlo.
Por eso la tabla de mínimos está a un clic dentro de la app.

---

## Licencia

| Qué | Licencia |
|---|---|
| Este repositorio | [MIT](LICENSE) |
| [Honorio](https://github.com/javiercuneo/honorio) | AGPL-3.0-or-later |

Las calculadoras son aritmética sobre reglas explícitas: cualquiera las
reescribe en una tarde y no hay motivo para ponerles condiciones. Usalas,
copialas, vendelas si querés.

Lo que hay en el motor de Honorio no es eso. Son los criterios para resolver
los puntos donde la ley es ambigua. La AGPL **no prohíbe el uso comercial**:
exige que quien la modifique y la ofrezca a terceros publique su versión bajo la
misma licencia. La app es y va a seguir siendo gratuita; impedir que el trabajo
vuelva cerrado es todo lo que la licencia hace.

Para integrarla en un producto propio bajo otros términos, escribime.
Si querés aportar, leé [CONTRIBUTING.md](CONTRIBUTING.md) primero.

---

## Contacto

[GitHub](https://github.com/javiercuneo) ·
[LinkedIn](https://ar.linkedin.com/in/javier-c%C3%BAneo-libarona-03b75934) ·
[javier@javiercuneo.com.ar](mailto:javier@javiercuneo.com.ar)
