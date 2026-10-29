// ---------------------------------------------------------------------------
// El panel lateral. Es un marco: adentro va calculadoras/panel.html del sitio
// publicado, que es la que calcula, con el motor de siempre. La extensión no
// tiene una sola cuenta propia.
//
// Recibe el caso del click derecho por chrome.storage.session (lo deja
// fondo.js) y se lo pasa a la pantalla en el fragmento, sin recargarla.
// ---------------------------------------------------------------------------
import { ORIGEN } from './config.js';

const PANTALLA = ORIGEN + '/calculadoras/panel.html';
const marco = document.getElementById('pantalla');
const tablero = document.getElementById('tablero');

tablero.href = ORIGEN + '/calculadoras/tablero.html';
if (!ORIGEN.startsWith('https://javiercuneo.com.ar')) {
    document.getElementById('origen').textContent = 'probando: ' + new URL(ORIGEN).host;
}

function abrir(caso) {
    const p = new URLSearchParams();
    if (caso) {
        if (caso.herramienta) p.set('herramienta', caso.herramienta);
        if (caso.fecha) p.set('fecha', caso.fecha);
        if (caso.herramienta === 'entre' && caso.hasta) p.set('hasta', caso.hasta);
        if (caso.plazo) p.set('plazo', String(caso.plazo));
        p.set('tomado', tomado(caso));
        // Para que el mismo caso dos veces seguidas también llegue.
        p.set('n', String(caso.n));
    }
    marco.src = PANTALLA + (caso ? '#' + p.toString() : '');
}

// Lo que se le muestra a la persona sobre de dónde salió el dato.
function tomado(caso) {
    const de = caso.texto ? `«${caso.texto.length > 60 ? caso.texto.slice(0, 60) + '…' : caso.texto}»` : 'lo marcado';
    if (!caso.fecha) return `No encontré una fecha en ${de}.`;
    let t = `Fecha tomada de ${de}.`;
    if (caso.herramienta === 'entre' && caso.hasta) {
        t = `Fechas tomadas de ${de}.`;
        if (caso.otrasFechas > 1) t += ` Había ${caso.otrasFechas + 1}: usé las dos primeras.`;
    } else if (caso.otrasFechas) t += ` Había ${caso.otrasFechas + 1} fechas: usé la primera.`;
    return t;
}

chrome.storage.session.get('caso').then(({ caso }) => abrir(caso || null));
chrome.storage.onChanged.addListener((cambios, area) => {
    if (area === 'session' && cambios.caso && cambios.caso.newValue) abrir(cambios.caso.newValue);
});

// Un iframe dispara `load` aunque cargue la página de error: se pregunta
// aparte si el sitio contesta.
fetch(PANTALLA, { mode: 'no-cors', cache: 'no-store' }).catch(() => {
    marco.hidden = true;
    document.getElementById('sin-conexion').hidden = false;
});
