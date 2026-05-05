// Estado global
let wizardState = {
    step: 0,
    valorUMA: 89875,
    tipoProceso: '',
    modoTerminacion: '',
    sentenciaResultado: null,
    aperturaPrueba: null,
    caducidadCriterio: '',
    tuvoExcepciones: null,
    sucesionUnicoLetrado: false,
    medidaOposicion: null,
    homologacionVivienda: false,
    objetoBase: '',
    desalojoVivienda: false,
    baseValor: 0,
    esProvisorio: false
};

function recolectarDatos() {
    if (wizardState.step === 0) {
        const input = document.getElementById('inputUMA');
        if (input) wizardState.valorUMA = parseNumber(input.value) || 89875;
    }
    if (wizardState.step === 4) {
        const input = document.getElementById('baseInputNum');
        if (input) wizardState.baseValor = parseNumber(input.value) || 0;
    }
}

function validarPasoActual() {
    const step = wizardState.step;
    if (step === 1) {
        if (!wizardState.tipoProceso) {
            const errorEl = document.getElementById('errorTipoProceso');
            if (errorEl) errorEl.innerHTML = 'Debe seleccionar un tipo de proceso.';
            return false;
        }
        return true;
    }
    if (step === 2) {
        if (wizardState.tipoProceso === 'conocimiento' || wizardState.tipoProceso === 'ejecucion_sentencia' || wizardState.tipoProceso === 'ejecutivo') {
            if (!wizardState.modoTerminacion) {
                alert('Debe seleccionar una forma de terminación.');
                return false;
            }
            if (wizardState.modoTerminacion === 'sentencia' && !wizardState.sentenciaResultado) {
                alert('Debe seleccionar si la demanda fue admitida o rechazada.');
                return false;
            }
            if (wizardState.modoTerminacion === 'modos_anormales' && wizardState.aperturaPrueba === null) {
                alert('Debe indicar si se produjo antes o después de la apertura a prueba.');
                return false;
            }
            if (wizardState.modoTerminacion === 'caducidad' && !wizardState.caducidadCriterio) {
                alert('Debe seleccionar un criterio para la caducidad.');
                return false;
            }
            if (wizardState.modoTerminacion === 'caducidad' && wizardState.caducidadCriterio === 'art25' && wizardState.aperturaPrueba === null) {
                alert('Debe indicar si la caducidad se declaró antes o después de la apertura a prueba.');
                return false;
            }
            if ((wizardState.tipoProceso === 'ejecucion_sentencia' || wizardState.tipoProceso === 'ejecutivo') && wizardState.tuvoExcepciones === null) {
                alert('Debe indicar si se dedujeron excepciones.');
                return false;
            }
        } else if (wizardState.tipoProceso === 'sucesion') {
            if (wizardState.sucesionUnicoLetrado === null) {
                alert('Debe indicar si intervino un solo abogado o varios.');
                return false;
            }
        } else if (wizardState.tipoProceso === 'medida_cautelar') {
            if (wizardState.medidaOposicion === null) {
                alert('Debe indicar si hubo oposición en la medida cautelar.');
                return false;
            }
        } else if (wizardState.tipoProceso === 'homologacion_desocupacion') {
            if (wizardState.homologacionVivienda === null) {
                alert('Debe indicar si la locación era para vivienda.');
                return false;
            }
        }
        return true;
    }
    if (step === 3 && wizardState.tipoProceso === 'conocimiento') {
        if (!wizardState.objetoBase) {
            const errorEl = document.getElementById('errorObjeto');
            if (errorEl) errorEl.innerHTML = 'Debe seleccionar el objeto del juicio.';
            return false;
        }
        if (wizardState.objetoBase === 'desalojo' && wizardState.desalojoVivienda === null) {
            alert('Debe indicar si el alquiler es para vivienda o demás casos.');
            return false;
        }
        return true;
    }
    if (step === 4) {
        if (!wizardState.baseValor || wizardState.baseValor <= 0) {
            alert('Debe ingresar un monto válido para la base regulatoria.');
            return false;
        }
        return true;
    }
    return true;
}

// Exponer globalmente
window.wizardState = wizardState;
window.recolectarDatos = recolectarDatos;
window.validarPasoActual = validarPasoActual;