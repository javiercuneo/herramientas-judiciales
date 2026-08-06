# 07 - Glosario de conceptos jurídicos

Conceptos de la Ley 27.423 que el sistema de cálculo usa, con el nombre técnico
que les da la ley y la clave con la que aparecen en el código.

**Para quién está escrito:** para un abogado que va a leer el código. Por eso el
término jurídico manda y es el correcto; donde el schema de la entrevista usa
una clave (`sumas_dinero`, `familia_alimentos`), va identificada como tal y
nunca como si fuera el nombre de la cosa.

> **Estado de verificación.** Reescrito el 5/8/2026 después de encontrar que
> varias entradas estaban inventadas —los siete tramos de la escala del art. 21
> tenían todos los límites errados, y por dos órdenes de magnitud en el último—.
> Todo lo que dice ahora está contrastado **contra el texto de la ley**, que está
> en [`00_LEY_27423.md`](00_LEY_27423.md).
>
> **Esa verificación cambió cosas que ya se creían corregidas**, porque la
> primera pasada usó como fuente el motor clásico y el motor clásico explica mal
> lo que calcula bien: presenta la banda del 5-10 % como regla general del art.
> 21 cuando está acotada a los auxiliares, y cita como art. 19 un texto que no
> existe en esta ley. Es exactamente lo que advierte `AGENTS.md`. **Contra el
> texto, no contra la implementación.**

---

## UMA — Unidad de Medida Arancelaria · art. 19

> **ARTÍCULO 19.-** Institúyese la Unidad de Medida Arancelaria (UMA) […] la que
> equivaldrá al **tres por ciento (3 %) de la remuneración básica asignada al
> cargo de juez federal de primera instancia**. La **Corte Suprema de Justicia
> de la Nación** suministrará y publicará **mensualmente** […] el valor
> resultante, **eliminando las fracciones decimales**, e informará a las
> diferentes cámaras el valor de la UMA.

De ahí se sigue lo que importa: la UMA **no se actualiza por inflación ni por
índice alguno**, sino que sigue al sueldo de un juez federal de primera
instancia. Es un anclaje a la remuneración judicial, no una indexación.

La app toma el valor de la fuente oficial y lo deja versionado con su norma: al
5/8/2026, `$102.076` según **Res. SGA n.° 1785/26** (`csjn.gov.ar`, ver
`honorio/data/uma.json`).

> **No confundir con el UMA de la Ciudad** (Ley 5134 CABA), que sí fija el
> Consejo de la Magistratura porteño. Son dos unidades distintas, de dos
> regímenes arancelarios distintos. La versión anterior de este glosario decía
> «Unidad Monetaria de Actualización» y la atribuía al Consejo de la
> Magistratura: las dos cosas eran falsas y venían de esa confusión.

**El art. 19 hace además otra cosa**, que no se deduce de su encabezado: en su
segundo párrafo fija **honorarios mínimos en UMA**, con dos tablas —a) asuntos
judiciales no susceptibles de apreciación pecuniaria, b) labor extrajudicial—.
Que la unidad de medida y la tabla de mínimos convivan en el mismo artículo es
mala técnica legislativa, pero es lo que dice: al buscar un mínimo de divorcio,
adopción o consulta verbal, el artículo es el 19.

---

## Escala del art. 21

Escala progresiva de **siete tramos**, aplicada sobre la base expresada en UMA.
Estos son los valores que usa el motor (`calcularEscalaBase` en
`asistente-honorarios-clasico/js/core.js`):

| Tramo | Base en UMA | Mínimo | Máximo |
|---|---|---|---|
| 1.ª | hasta 15 | 22 % | 33 % |
| 2.ª | 16 a 45 | 20 % | 26 % |
| 3.ª | 46 a 90 | 18 % | 24 % |
| 4.ª | 91 a 150 | 17 % | 22 % |
| 5.ª | 151 a 450 | 15 % | 20 % |
| 6.ª | 451 a 750 | 13 % | 17 % |
| 7.ª | más de 750 | 12 % | 15 % |

**La escala no se aplica de corrido sobre toda la base.** Cada tramo arrastra el
máximo acumulado del tramo anterior y el porcentaje corre solo sobre el
excedente. Por ejemplo, en la 3.ª escala el mínimo es `(base − 45) × 0,18 +
11,7`, donde `11,7` es lo acumulado hasta 45 UMA. Es lo que la app llama el
**contrafáctico**: mucha gente lee la tabla y espera el resultado de multiplicar
la base entera por el porcentaje del tramo, que da otro número.

**La regla de no retroceso**, que es lo que hace progresiva a la escala:

> En ningún caso los honorarios podrán ser inferiores al máximo del grado
> inmediato anterior de la escala, con más el incremento por aplicación al
> excedente de la alícuota que corresponde al grado siguiente.

**El piso y el techo del 5 % al 10 % son solo para los auxiliares de la
Justicia:**

> **En el caso de los auxiliares de la Justicia**, el monto de los honorarios a
> regular no podrá ser inferior al cinco por ciento (5 %) ni superior al diez
> por ciento (10 %) del monto del proceso. Ante la existencia de labores
> altamente complejas o extensas, los jueces […] podrán por auto fundado,
> aplicar un porcentaje mayor.

> **Ojo, porque cuesta caro.** El motor clásico presenta esa banda como «la
> regla general del art. 21», y una versión anterior de este glosario copió esa
> lectura. **No es general: está acotada a los auxiliares.** El motor sí la
> implementa bien —calcula 5-10 % solo para `auxiliares`—; lo que estaba mal era
> el texto explicativo. Es el ejemplo de por qué `AGENTS.md` dice que el motor
> clásico no es oráculo: puede calcular bien y explicar mal.

Otras dos reglas del mismo artículo: con litisconsorcio se regula sobre el
interés de **cada** litisconsorte, y en jurisdicción voluntaria se considera que
hay **una sola parte**. Y si no hay susceptibilidad de apreciación pecuniaria,
se aplican las pautas del **art. 16**.

---

## Roles profesionales y cómo se reparten

El art. 20 es el que gobierna esto, y conviene leerlo entero porque el reparto
no es intuitivo:

> **ARTÍCULO 20.-** Los honorarios de los procuradores se fijarán en un 40 % de
> los que por esta ley corresponda fijar a los abogados patrocinantes. Si el
> abogado actuare en carácter de apoderado sin patrocinio, percibirá la
> asignación total que hubiere correspondido a ambos.

De ahí salen los tres números que usa el motor:

| Rol | Cuánto | Clave en el código |
|---|---|---|
| **Patrocinante** | 100 % de la escala. Es la referencia de la que dependen los otros dos. | `patrocinante` |
| **Procurador** | 40 % de lo del patrocinante. | `procurador` |
| **Apoderado sin patrocinio separado** | Cobra los dos: patrocinante + procurador = **×1,4** sobre el patrocinante. | `apoderado` |

> **Ojo con el sentido de la cuenta.** La versión anterior de este glosario
> decía que al patrocinante le corresponde «el 60 % del total» y al apoderado
> «el 40 % del total que correspondería a ambos». Eso es repartir 100 entre dos;
> la ley hace otra cosa: el patrocinante es el 100 % y el resto se calcula
> *sobre* él, de modo que el apoderado sin patrocinio llega a 140. Además de
> estar mal, contradecía a la app, que multiplica por 1,4.

**Auxiliares de justicia** (peritos, martilleros, liquidadores): el motor calcula
entre el **5 % y el 10 % de la base en UMA**. Clave: `auxiliares`. Ver también
arts. 60 y 61 bis para los mínimos.

---

## Base regulatoria (cuantía del asunto)

Valor económico sobre el que se aplica la escala. **De su determinación depende
todo lo demás**, porque define el tramo. Las reglas por tipo de bien están en el
art. 23; los procesos con regla propia, más abajo.

Una base mal determinada no produce un error chico: mueve de tramo y con eso
cambia el porcentaje.

---

## Clases y objeto del proceso

Dos cosas distintas que conviene no mezclar:

- **Clase de proceso.** Es como lo llama el CPCCN: Libro Segundo, Título I,
  Capítulo I «Clases», y el art. 319. Ordinario, sumarísimo, ejecutivo.
- **Objeto del juicio.** Qué se reclama: sumas de dinero, desalojo, escrituración,
  alimentos.

**La app llama «tipo de proceso» a lo que combina las dos cosas**, y está bien
así para el usuario: es lo que entiende alguien que no maneja la nomenclatura
procesal. Pero en la documentación conviene mantener la distinción, porque los
artículos de la ley se enganchan a una o a la otra.

Claves del schema, para que se pueda buscar en el código: `conocimiento`,
`ejecutivo`, `ejecucion_sentencia`, `sucesion`, `medida_cautelar`,
`homologacion_desocupacion`, `exhorto`, `incidente`. Y de objeto:
`sumas_dinero`, `desalojo`, `escrituracion`, `familia_alimentos`,
`familia_liquidacion`, `posesorias_interdictos`, `incidencia_colectiva`.

---

## Modo de terminación

Forma en que concluyó el proceso. Es una de las contingencias que más mueve el
número.

- **Sentencia.** Si la demanda se admite, honorarios completos; si se desestima
  íntegramente, art. 22.
- **Modos anormales.** Allanamiento, desistimiento y transacción. Art. 25.
- **Caducidad de la instancia.** Ver la entrada propia: la ley no la contempla
  como categoría separada.
- **Honorarios provisorios.** Art. 12, cuando el profesional se retira antes de
  la conclusión.

---

## Apertura a prueba

Momento que parte en dos el tratamiento de los modos anormales. **No es una
graduación: es un interruptor.** Ver art. 25.

---

## Caducidad de la instancia

Extinción del proceso por inactividad (arts. 310 y ss. CPCCN).

**La Ley 27.423 no la menciona como categoría separada**, así que la app te deja
elegir cómo tratarla, y lo dice:

1. Como **demanda desestimada** → la base se reduce 30 % (art. 22).
2. Por el **art. 25** → la escala se reduce 50 % si fue antes de la apertura a
   prueba.

**Los dos criterios son alternativos**, no acumulables: elegido el art. 22, la
instancia cae como demanda desestimada y el momento de la apertura a prueba ya
no juega. Que se pudieran acumular fue un bug, corregido el 3/8/2026.

---

## Segunda instancia — art. 30

Tres párrafos, y el del medio suele pasarse por alto:

1. Por la segunda o ulterior instancia se regula **del 30 % al 35 %** de lo
   fijado en primera.
2. **Si la sentencia se revoca *o modifica*, el tribunal de alzada debe adecuar
   de oficio las regulaciones de primera instancia**, según el nuevo resultado
   del pleito. No es solo regular la alzada: es rehacer lo de abajo.
3. Si la sentencia se revoca **en todas sus partes en favor del apelante**, los
   honorarios de la apelación van **del 30 % al 40 %**.

---

## Etapas del proceso — art. 29

El proceso se divide en etapas y los honorarios se fraccionan en consecuencia:
**una etapa = 1/3**, **dos etapas = 2/3**, proceso completo = total. Es
aritmética directa sobre el resultado de la escala.

Los incidentes van aparte: según el art. 29 inc. g) se dividen en **dos** etapas
—el planteo que lo origina y el desarrollo hasta su conclusión—.

---

# Artículos que modifican el cálculo

Ordenados por cómo pegan, que es lo que importa al leer el código: unos tocan la
**base**, otros la **escala**, otros los **honorarios ya calculados**. El orden
no es intercambiable.

## Sobre la base

**Art. 22 — demanda íntegramente desestimada.** La base se reduce **30 %**.

> Si fuere íntegramente desestimada la demanda o la reconvención, se tendrá como
> valor del pleito el importe de la misma, actualizado por intereses al momento
> de la sentencia, si ello correspondiere, disminuido en un 30 %.

**Art. 23 — determinación por tipo de bien.** Inmuebles (inc. a: tasación;
valuación fiscal adecuada incrementada en 50 %), derechos crediticios (inc. d:
valor de escrituras deducidas amortizaciones), títulos y acciones (inc. e:
cotización en la Bolsa de Comercio de Buenos Aires, o informe bancario si no
cotiza), establecimientos comerciales (inc. f: activo menos pasivo justificado).

**Art. 24 — intereses.** Integran la base cuando corresponden.

**Art. 39 — alimentos.** La base es el importe correspondiente a **2 años** de la
cuota fijada judicialmente.

**Art. 40 — desalojo.** Escala del art. 21 sobre el total del contrato. **Si el
destino es vivienda, la base se reduce 20 %.**

**Art. 43 — causas laborales.** El artículo es más amplio de lo que sugiere el
uso que le da la app: gobierna las causas laborales y complementarias ante los
tribunales de trabajo, en procedimientos contradictorios, ejecuciones de
resoluciones administrativas y actuación como alzada. **Lo que la app usa es una
regla puntual de adentro:** en las demandas de desalojo por restitución de
inmuebles concedidos a los trabajadores en virtud del empleo, la base es el
**50 % de la última remuneración mensual, por 2 años**.

**Art. 46 — escrituración.** Se aplica el art. 23 inc. a), salvo que resulte
mayor el monto del boleto de compraventa, en cuyo caso se aplica este último.

**Art. 45 — liquidación y disolución del régimen patrimonial del matrimonio.** Se
regula al patrocinante o apoderado de cada parte con la escala del art. 21,
**calculada sobre el patrimonio que se le adjudique a su patrocinado o
representado** —no sobre la masa total—. *Verificado contra el texto: la versión
anterior decía bien.*

## Sobre la escala

**Art. 25 — allanamiento, desistimiento y transacción.**

> En caso de allanamiento, desistimiento y transacción, **antes de decretarse la
> apertura a prueba**, los honorarios serán del 50 % de la escala del artículo
> 21. **En los demás casos, se aplica el 100 %.**

> **Corrección importante.** La versión anterior decía que después de la apertura
> a prueba «la reducción es menor». No hay reducción menor: **no hay reducción**.
> Es 50 % o 100 %, sin escalones intermedios.

**Art. 35 — sucesión con letrado único.** Si hay un solo abogado para todos los
herederos, la escala se regula en **la mitad**.

**Art. 37 — medida cautelar.** Los honorarios se regulan **sobre el monto que se
pretende asegurar**, aplicando como base el **25 %** de la escala del art. 21;
en casos de controversia u oposición, el **50 %**. Vale tanto si la cautelar
tramita autónomamente como si va incidental o dentro del proceso.

**Art. 41 — ejecución de sentencia.** La escala se reduce al **50 %**.

## Sobre los honorarios ya calculados

**Art. 34 — ausencia de excepciones.** Reduce **10 %** el resultado, en ejecutivo
y ejecución de sentencia.

**Art. 38 — posesorias, interdictos y división de bienes comunes.** Reduce
**20 %** cuando el juicio es en beneficio exclusivo del patrocinado.

**Art. 49 — incidencia colectiva.** Acciones sobre derechos de incidencia
colectiva **con contenido patrimonial**: el resultado del art. 21 reducido en un
**25 %**. El calificativo no es adorno: sin contenido patrimonial no hay escala
que reducir.

## Mínimos y regímenes propios

**Art. 12 — honorarios provisorios.** Retiro del profesional antes de la
conclusión: se toma **solo el mínimo** de la escala. En el sucesorio no se
admiten provisorios salvo la excepción del letrado que renuncia con la sucesión
sin terminar, y **en esa excepción la regulación es definitiva, con mínimo y
máximo** —justo lo contrario de lo que hace el art. 12—.

**Art. 16 — pautas valorativas.** Los criterios con los que el juez se mueve
dentro de la banda: complejidad, monto, calidad de la labor, resultado.

**Asuntos sin valor pecuniario apreciable.** Se aplican las **pautas del art.
16** —lo dice el propio art. 21— y los **mínimos en UMA de la tabla a) del art.
19**.

> **Cuidado con una cita del motor clásico.** Su cuadro explicativo atribuye al
> «ARTÍCULO 19» un texto que empieza «Cuando no fuere posible apreciar el valor
> pecuniario del asunto, los jueces fijarán los honorarios teniendo en cuenta la
> naturaleza de las actuaciones…». **Esa frase no existe en la Ley 27.423** —se
> buscó en el texto completo—: es del arancel anterior, la Ley 21.839. El art.
> 19 de esta ley instituye la UMA y fija mínimos. No copiar esa cita.

**Art. 31 — recursos ante la CSJN.** Recursos extraordinarios, de
inconstitucionalidad, revisión, casación, ordinarios y directos: **no menos de
20 UMA**. Las **quejas por denegación** de esos recursos: **no menos de 15
UMA**. Si el recurso se concede y tramita, se está al art. 21.

*La versión anterior decía «entre 15 y 20 UMA», como si fuera una banda. Son dos
pisos distintos para dos cosas distintas.*

**Art. 48 — inconstitucionalidad, amparo, hábeas data y hábeas corpus.** Cuando
**no puedan regularse conforme la escala del art. 21**, se aplican las normas del
art. 16 con un **mínimo de 20 UMA**. La condición importa: no es un mínimo que
rija siempre, sino para cuando la escala no es aplicable. Y la acción de
**inconstitucionalidad** entra acá, cosa que la versión anterior omitía.

## Incidentes: un criterio que la app adopta y hay que declarar

**El art. 47 —el que regulaba incidentes y tercerías— está observado**, o sea
vetado por el Decreto 1077/2017 y no vigente. Decía: considerados por separado
del principal, honorarios entre el **8 % y el 25 %** de lo que correspondiere al
proceso principal, con un mínimo de 5 UMA. Nada de eso rige.

**Los dos motores aplican 2 % a 20 % de la base del incidente**, que **no está
en la Ley 27.423**: es la regla del arancel anterior. La versión previa de este
glosario lo atribuía al «art. 33», pero el art. 33 de esta ley es **causas
penales**.

> **Esto es un criterio interpretativo, no una regla de la ley**, y por la regla
> de contenido de la app —«los criterios que adopta se declaran, no se
> esconden»— tiene que estar dicho. *Falta confirmar la norma exacta de la que
> sale el 2-20 % antes de citarla.*

Lo que sí rige para incidentes es el **art. 29 inc. g)**: se dividen en **dos**
etapas, el planteo que los origina y el desarrollo hasta su conclusión.

**Art. 33 — causas penales.** Reglas del art. 16 y las demás pautas que el
artículo enumera. *No es el artículo de los incidentes.*

**Art. 44 — acciones y peticiones de naturaleza administrativa.** Demandas
contencioso administrativas: se aplican los arts. 21 y 23, y si la cuestión es
susceptible de apreciación pecuniaria, la escala del 21. *Los mínimos de 7 y 5
UMA que decía la versión anterior no se verificaron contra los incisos; leer el
artículo antes de citarlos.*

**Art. 50 — exhortos y oficios (ley 22.172).** No son montos fijos sino escalas
según la diligencia:

- Notificaciones o actos semejantes: **no menos de 3 UMA**.
- Inscripciones registrales (dominios, hijuelas, gravámenes, embargos,
  inhibiciones, inventarios, remates, desalojos): **entre 10 y 20 UMA**.
- Diligencias de prueba con intervención en su producción o contralor: **entre 7
  y 30 UMA**, en proporción a la labor.

**Art. 52 — intereses, frutos y accesorios.** Integran la base cuando
corresponden.

**Art. 58 — mínimos residuales.** Para juicios **susceptibles de apreciación
pecuniaria** no previstos en otros artículos. **No es un mínimo único: el
artículo abre incisos por tipo de proceso** —el primero, procesos de
conocimiento, 10 UMA—. El calificativo importa: no cubre cualquier actuación no
contemplada, solo las pecuniarias.

**Art. 60 — peritos en procesos no pecuniarios** (texto según B.O. 06/03/2026).
Pautas del art. 16 y mínimo de **2 UMA**.

**Art. 61 bis — peritos en controversias judiciales** (B.O. 06/03/2026). Sus
honorarios **no están vinculados a la cuantía del juicio** ni al porcentaje de
incapacidad que se dictamine. Mínimo de 2 UMA; si el caso se resuelve antes de
la pericia, 1/4 de UMA.

**Art. 35, última parte — partidor.**

> Los honorarios del abogado o abogados partidores en conjunto, se fijarán sobre
> el valor del haber a dividirse, aplicando una escala del **2 % al 3 %** del
> total. Si se trata del auxiliar de Justicia, los honorarios derivados de la
> actuación como perito partidor […] será regulada en una escala del 2 % al 3 %
> del valor de los bienes objeto de la partición.

---

## Regla de proporcionalidad — art. 478 CPCCN

El art. 478 CPCCN manda regular los honorarios de los **peritos** en proporción
a los de los letrados, y habilita a bajar del mínimo arancelario cuando la
aplicación estricta llevaría a una desproporción.

> **Alcance, porque la versión anterior lo estiraba.** Está redactado para los
> auxiliares, no como un principio general de proporcionalidad entre todos los
> profesionales del juicio. Que se lo invoque más ampliamente es otra discusión,
> y no es lo que dice la norma.
