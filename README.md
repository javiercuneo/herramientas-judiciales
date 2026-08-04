# Herramientas para la práctica judicial

**L. Javier Cúneo Libarona** — abogado. Prosecretario Administrativo en un
juzgado civil.

Software para lo que hago todos los días: computar plazos, regular honorarios,
liquidar la tasa. Cada herramienta salió de un problema concreto de trabajo, no
de una idea de producto.

**[Ver las herramientas →](https://javiercuneo.github.io/Herramientas-Judiciales-IA/)**

---

## Honorio

Asistente para la regulación de honorarios de la **Ley 27.423**. Es el proyecto
principal del repositorio y el único que se mantiene activamente.

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

[Abrir Honorio](https://javiercuneo.github.io/Herramientas-Judiciales-IA/honorio/) ·
[Documentación](honorio/README.md) ·
[Registro de versiones](honorio/CHANGELOG.md)

---

## Calculadoras

Herramientas de un solo archivo, sin instalación y sin backend. Todo se calcula
en el navegador: nada de lo que escribís sale de tu máquina.

### Plazos

| Herramienta | Qué hace |
|---|---|
| [Vencimiento de plazos](https://javiercuneo.github.io/Herramientas-Judiciales-IA/calculadoras/vencimientos.html) | Vencimiento de un plazo judicial desde una fecha de inicio. |
| [Caducidad de la instancia](https://javiercuneo.github.io/Herramientas-Judiciales-IA/calculadoras/caducidad.html) | Cómputo de los arts. 310 y ss. del CPCCN. |
| [Ampliación por distancia](https://javiercuneo.github.io/Herramientas-Judiciales-IA/calculadoras/distancia.html) | Art. 158 CPCCN, dentro del país o al exterior. |
| [Contador de días](https://javiercuneo.github.io/Herramientas-Judiciales-IA/calculadoras/entre-fechas.html) | Días hábiles o corridos entre dos fechas. |
| [Fecha límite (regresiva)](https://javiercuneo.github.io/Herramientas-Judiciales-IA/calculadoras/regresiva.html) | Resta días hábiles a una fecha objetivo para saber hasta cuándo hay tiempo. |
| [Mora](https://javiercuneo.github.io/Herramientas-Judiciales-IA/calculadoras/mora.html) | Inicio de la mora según el plazo de la resolución y la fecha en que quedó firme. |
| [Ejecución de sentencias contra el Estado](https://javiercuneo.github.io/Herramientas-Judiciales-IA/calculadoras/ejecucion-estado.html) | Desde cuándo una sentencia contra el Estado Nacional es ejecutable y embargable (art. 170, Ley 11.672). |

Las que dependen de fechas usan un calendario judicial compartido, con feriados
de una API externa y un respaldo local en [`data/`](data/).

### Honorarios y tributos

| Herramienta | Qué hace |
|---|---|
| [Honorarios (Ley 27.423)](https://javiercuneo.github.io/Herramientas-Judiciales-IA/calculadoras/honorarios.html) | Cálculo directo, sin entrevista. Para el caso simple. |
| [Honorarios del mediador](https://javiercuneo.github.io/Herramientas-Judiciales-IA/calculadoras/honorarios-mediacion.html) | Ley 26.589. |
| [Prorrateo (art. 730 CCyCN)](https://javiercuneo.github.io/Herramientas-Judiciales-IA/calculadoras/prorrateo.html) | Límite de responsabilidad del deudor por las costas. |
| [Tasa de justicia](https://javiercuneo.github.io/Herramientas-Judiciales-IA/calculadoras/tasa.html) | Ley 23.898, orientada a procesos civiles. |

### Otras

| Herramienta | Qué hace |
|---|---|
| [PDF Studio](https://javiercuneo.github.io/Herramientas-Judiciales-IA/PDF-studio/) | Unir, separar, rotar y comprimir PDF sin subirlos a ningún lado. |
| [Asistente de honorarios clásico](https://javiercuneo.github.io/Herramientas-Judiciales-IA/asistente-honorarios-clasico/) | La versión original de la que salió Honorio. Se conserva funcionando como referencia. |

### Bandejito

Aplicación en Google Apps Script que automatizaba la distribución de los
escritos que ingresaban al juzgado: leía el PDF del listado diario, extraía cada
registro, clasificaba beneficios y confrontes, repartía según las reglas
internas de la oficina por los últimos números del expediente y mandaba a cada
responsable el correo con sus tareas y las alertas de vencimiento.

Estuvo en uso hasta que lo reemplazó un desarrollo institucional.
[Ver cómo funcionaba](https://javiercuneo.github.io/Herramientas-Judiciales-IA/proyectos%20finalizados/bandejito.html).

---

## Sobre el uso de IA

El código de este repositorio está escrito con asistencia de modelos de
lenguaje. No hay razón para esconderlo y tampoco mucho mérito en negarlo: hoy
cualquiera genera una calculadora.

Lo que un modelo no genera es el criterio. Un ejemplo real, de agosto de 2026:
el motor aplicaba la reducción del art. 25 también cuando la caducidad se
resolvía por art. 22, acumulando dos quitas sobre el mismo hecho. Nada en el
código lo delataba y el resultado parecía razonable. Está mal porque los dos
criterios de la caducidad son alternativos: elegido el art. 22, la instancia
cae como demanda desestimada y el momento de la apertura a prueba deja de
jugar. Esa corrección no sale de leer la ley con más atención; sale de haber
resuelto el caso.

Por eso el trabajo está en dos lugares que no son el código:

- **Decidir qué hace la herramienta donde la ley no es clara**, y dejar escrito
  por qué. Está en [`docs/domain/`](docs/domain/) —publicado en
  [la documentación de dominio](https://javiercuneo.github.io/Herramientas-Judiciales-IA/docs/)—
  y, para Honorio, en los «por qué» de la propia app.
- **Verificar que el número sea el correcto.** Ver abajo.

---

## Cómo se verifica

El motor de Honorio tiene **11 suites de validación** que comparan su salida
contra casos conocidos, uno por concern: escala del art. 21, reducciones de
base, de escala y finales, segunda instancia, partidor, provisorios, procesos
generales, especiales, exhorto e incidente, y un barrido exhaustivo de los
25.600 recorridos posibles de la entrevista.

No son opcionales ni decorativas: son lo que impide que un cambio de interfaz
mueva un número. Corren solas en cada push y en cada pull request, y el sitio
**no se publica si alguna falla**.

```bash
npm run check
```

Sobre eso hay tres reglas que sostienen al resto:

1. **Los resultados actuales se consideran correctos** y son la referencia a
   preservar. Un refactor que mejora el código y cambia un número no es un
   refactor: es un error.
2. **Un cambio de resultado se documenta siempre**, con el caso concreto y el
   artículo que lo funda, aunque el diff sea de una línea. Está en el
   [CHANGELOG](honorio/CHANGELOG.md), que por eso se versiona según qué le pasó
   al número y no según cuánto código se tocó.
3. **Las reglas jurídicas viven en una sola capa** (`lib/legal/`). La interfaz
   solo dibuja. Detalle en [honorio/README.md](honorio/README.md#cómo-está-armado).

La continuidad del trabajo —decisiones tomadas, lo que se sabe roto, las
trampas que ya costaron tiempo— está en [`docs/ESTADO.md`](docs/ESTADO.md), que
se actualiza en el mismo commit que el trabajo que describe.

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
| Todo el repositorio | [MIT](LICENSE) |
| `honorio/` | [AGPL-3.0-or-later](honorio/LICENSE) |

Las calculadoras son aritmética sobre reglas explícitas: cualquiera las
reescribe en una tarde y no hay motivo para ponerles condiciones. Usalas,
copialas, vendelas si querés.

Lo que hay en `honorio/lib/legal/` no es eso. Son los criterios para resolver
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
[javiercuneol@hotmail.com](mailto:javiercuneol@hotmail.com)
