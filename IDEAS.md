# Ideas

Lo que todavía no existe. Está acá para que se pueda discutir antes de
construirse, y para que si algo muere quede escrito por qué.

**Nada de esto está prometido.** Varias de estas ideas no se van a hacer nunca,
y eso no es un problema: el repositorio publica lo que funciona, no lo que se
piensa. Si a alguien le sirve el germen de alguna para construir lo suyo, mejor
—así empezó buena parte de lo que hay acá—.

Lo que sí está hecho vive en [`README.md`](README.md). Lo que está en curso, en
[`docs/ESTADO.md`](docs/ESTADO.md).

---

## Un tablero de plazos

Hoy cada cálculo de plazos es una calculadora aparte: vencimiento, caducidad,
ampliación por distancia, mora, días entre fechas, plazo regresivo. Están
separadas porque cada una salió de un problema distinto, no porque tenga sentido
que lo estén. Trabajando, uno abre tres pestañas.

La idea es concentrarlas en una sola pantalla: **cargás una fecha una vez y de
ahí sale todo lo que quieras preguntarle**. Cuándo vence, cuándo caduca, cuándo
se produce la mora, cuántos días pasaron. Un compañero de despacho más que una
calculadora.

Dos cosas que la distinguirían de lo que hay:

- **Una sola entrada de datos.** El expediente, la fecha, el plazo, y a partir
  de ahí cada herramienta se sirve sola. Hoy se recarga lo mismo tres veces.
- **El resultado en un calendario, con la escala que corresponda.** Si el plazo
  es de días, la semana. Si es de meses, el año o el cuatrimestre. Ver el plazo
  dibujado dice cosas que una fecha suelta no dice: dónde cae la feria, cuántos
  fines de semana se comió, qué tan cerca está de un asueto.

**No sería un HTML monolítico.** Las calculadoras de un archivo envejecen bien
porque son chicas y hacen una cosa; esto no lo es. Se puede publicar igual en
GitHub Pages —Honorio ya lo hace desde su propio repositorio— y la decisión de
si vive acá o aparte se toma cuando se sepa cuánto pesa.

**Lo que hay que resolver antes de escribir una línea:** el motor de plazos hoy
está repartido dentro de cada calculadora. Reunirlas exige extraerlo a una capa
propia, como en Honorio, y esa extracción **no puede mover un solo número**. Es
el trabajo real; la pantalla es lo fácil.

---

## Un respaldo de verdad para los feriados

Ver la entrada abierta en [`docs/ESTADO.md`](docs/ESTADO.md). Resumido: los
feriados nacionales salen de una sola API externa, y cuando no responde —CORS,
caída— el cálculo sigue adelante sin ellos.

Lo que haría falta es una **segunda fuente**, y ahí está el problema difícil:
dos fuentes que discrepen en un feriado dan dos vencimientos distintos, que es
peor que no tener ninguna. Así que no alcanza con encontrar otra API: hay que
decidir **qué pasa cuando no coinciden**. Las opciones, de menos a más trabajo:

1. **Respaldo local completo**, versionado en el repositorio, generado desde la
   fuente oficial. Determinístico y auditable. Cuesta mantenerlo al día.
2. **Segunda API como reserva**, usada solo si la primera no contesta. Simple,
   pero introduce la posibilidad de dos resultados según cuál respondió.
3. **Las dos, comparadas**, y si discrepan la herramienta no calcula: avisa. Es
   lo único honesto, y también lo que más molesta al que solo quiere una fecha.

La opción 1 es la que se lleva mejor con el resto del repositorio: las
calculadoras ya presumen de no depender de nadie.

---

## Los huecos de criterio de Honorio

`AGENTS.md` dice que una interpretación se funda en jurisprudencia y que sin
fallo no se afirma. En los hechos **eso no se cumple en todos lados**:
`lib/legal/jurisprudencia.ts` tiene fallos para algunos criterios y no para
otros. La elección entre el art. 22 y el art. 25 para la caducidad, por
ejemplo, no tiene ninguno cargado, y sin embargo la aplicación adopta un
criterio.

La idea es hacer el barrido completo: **listar cada punto donde Honorio decide
algo que la ley no resuelve sola, y anotar con qué está fundado hoy**. De ahí
salen tres grupos:

- Los que tienen fallo. Están bien.
- Los que no tienen fallo pero sí **doctrina**. Ahí una cita de un libro
  —cómo se calcula sobre la escala anterior, por ejemplo— es mejor que nada y
  es honesta si se la declara como lo que es.
- Los que no tienen ni una cosa ni la otra. Esos hay que **declararlos
  abiertos**, con el criterio a la vista y sin disfrazarlo de regla establecida.

El resultado esperado no es que desaparezcan los huecos: es que estén contados.
Una regla que se anuncia y no se cumple es peor que una regla más modesta que
sí.

---

## Dos cosas que se están cocinando aparte

Ninguna está terminada y las dos pueden morir. Van acá por si a alguien le
sirve la idea.

### Una base de criterios jurisprudenciales

Notas en Markdown con los criterios que resuelven las cuestiones de todos los
días, indexadas para que se puedan consultar por tema y para que un modelo de
lenguaje pueda citar el texto exacto en lugar de reconstruirlo de memoria.

Sirve para dos públicos distintos: el que quiere los criterios, y el que quiere
copiar el método de cargar conocimiento propio en un formato que después se
pueda consultar sin depender de nadie.

Hoy es chica. Si crece, se publica.

### Un motor determinístico para preparar borradores

Un flujo por etapas donde el programa controla el orden y el modelo de lenguaje
resuelve solo tareas puntuales y acotadas, nunca qué hacer a continuación. Cada
etapa declara qué forma tiene su salida y qué validación tiene que pasar.

**Es asistencia a la redacción, no decisión.** El criterio, el contenido y la
firma son de quien resuelve; lo que se automatiza es el trabajo mecánico previo
—ordenar el expediente, extraer datos, armar el esqueleto—. Un flujo no
determinístico no se puede auditar ni reanudar, y por eso el modelo no decide
el recorrido.

Está lejos de poder mostrarse y probablemente sea lo que más tarde en llegar,
si llega.
