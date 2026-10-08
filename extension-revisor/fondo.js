// ---------------------------------------------------------------------------
// Script de fondo. Dos cosas:
//   - el icono de la extension (o Alt+Mayus+R) muestra u oculta el recuadro
//     de la pestana donde se aprieta;
//   - pone en el icono la cantidad de posibles errores de esa pestana, para
//     verla con el recuadro oculto.
// No lee ni guarda nada del proveido.
// ---------------------------------------------------------------------------
chrome.action.setBadgeBackgroundColor({ color: '#b42318' });

chrome.action.onClicked.addListener((pestana) => {
    // En una pestana que no es un proveido no hay quien conteste: no pasa nada.
    chrome.tabs.sendMessage(pestana.id, { revisorPJN: 'alternar' }).catch(() => {});
});

chrome.runtime.onMessage.addListener((msg, de) => {
    if (!msg || msg.revisorPJN !== 'insignia') return;
    if (!de.tab) return;
    const texto = typeof msg.texto === 'string' ? msg.texto.slice(0, 4) : '';
    chrome.action.setBadgeText({ tabId: de.tab.id, text: texto }).catch(() => {});
});
