/**
 * CALCOLATORE COMPENSI CTU
 * D.M. 30 maggio 2002 - artt. 11, 12, 13 + vacazioni + spese + proforma forfettario
 * Conforme a Corte Cost. n. 16/2025 (vacazioni successive a tariffa intera)
 */

// ============================================================
// CLASSE DEC - ARITMETICA AD ALTA PRECISIONE (BigInt scalato 10^8)
// ============================================================
class Dec {
    constructor(val) {
        if (val instanceof Dec) {
            this.n = val.n;
        } else if (typeof val === 'bigint') {
            this.n = val;
        } else {
            this.n = Dec.toBigInt(val);
        }
    }

    static toBigInt(val) {
        if (val === undefined || val === null || val === '') return 0n;
        let s = typeof val === 'number' ? val.toFixed(8) : String(val).trim();
        s = s.replace(/€/g, '').replace(/\s/g, '');
        if (s.includes(',')) {
            // Se contiene sia punto che virgola, il punto è il separatore delle migliaia
            s = s.replace(/\./g, '').replace(',', '.');
        } else {
            let dotCount = (s.match(/\./g) || []).length;
            if (dotCount > 1) {
                // Più punti indicano separatori delle migliaia (es. 1.250.000)
                s = s.replace(/\./g, '');
            }
        }
        let parts = s.split('.');
        let integer = parts[0] || '0';
        let isNegative = false;
        if (integer.startsWith('-')) {
            isNegative = true;
            integer = integer.slice(1);
        } else if (integer.startsWith('+')) {
            integer = integer.slice(1);
        }
        let fraction = parts[1] || '0';
        fraction = fraction.slice(0, 8).padEnd(8, '0');
        let bigVal = BigInt(integer + fraction);
        return isNegative ? -bigVal : bigVal;
    }

    toString() {
        let absVal = this.n < 0n ? -this.n : this.n;
        let s = absVal.toString().padStart(9, '0');
        let integer = s.slice(0, -8);
        let fraction = s.slice(-8);
        return (this.n < 0n ? '-' : '') + integer + '.' + fraction;
    }

    toNumber() {
        return Number(this.toString());
    }

    plus(other) {
        return new Dec(this.n + new Dec(other).n);
    }

    minus(other) {
        return new Dec(this.n - new Dec(other).n);
    }

    times(other) {
        let o = new Dec(other);
        return new Dec(Dec.divRound(this.n * o.n, 100000000n));
    }

    div(other) {
        let o = new Dec(other);
        return new Dec(Dec.divRound(this.n * 100000000n, o.n));
    }

    static divRound(numerator, denominator) {
        let absNum = numerator < 0n ? -numerator : numerator;
        let absDen = denominator < 0n ? -denominator : denominator;
        let quotient = absNum / absDen;
        let remainder = absNum % absDen;
        if (remainder * 2n >= absDen) {
            quotient += 1n;
        }
        return numerator < 0n !== denominator < 0n ? -quotient : quotient;
    }

    round2() {
        let rounded = Dec.divRound(this.n, 1000000n);
        return new Dec(rounded * 1000000n);
    }

    round4() {
        let rounded = Dec.divRound(this.n, 10000n);
        return new Dec(rounded * 10000n);
    }

    ceil() {
        let integer = this.n / 100000000n;
        let remainder = this.n % 100000000n;
        if (remainder > 0n) {
            integer += 1n;
        }
        return new Dec(integer * 100000000n);
    }

    isZero() {
        return this.n === 0n;
    }

    isGreaterThan(other) {
        return this.n > new Dec(other).n;
    }

    isLessThan(other) {
        return this.n < new Dec(other).n;
    }
}

// ============================================================
// PARAMETRI E TABELLE D.M. 30 MAGGIO 2002
// ============================================================
const MINIMO_GENERALE = new Dec("145.12");
const VACAZIONE_TARIFFA = new Dec("14.68");
const BOLLO_IMPORTO = new Dec("2.00");
const BOLLO_SOGLIA = new Dec("77.47");

const SCAGLIONI_ART11 = [
    [new Dec("5164.57"),   new Dec("6.5686"), new Dec("13.1531")],
    [new Dec("10329.14"),  new Dec("4.6896"), new Dec("9.3951")],
    [new Dec("25822.84"),  new Dec("3.7580"), new Dec("7.5160")],
    [new Dec("51645.69"),  new Dec("2.8106"), new Dec("5.6370")],
    [new Dec("103291.38"), new Dec("1.8790"), new Dec("3.7580")],
    [new Dec("258228.45"), new Dec("0.9316"), new Dec("1.8790")],
    [new Dec("516456.90"), new Dec("0.2353"), new Dec("0.4705")],
];

const SCAGLIONI_ART13 = [
    [new Dec("5164.57"),   new Dec("1.0264"), new Dec("2.0685")],
    [new Dec("10329.14"),  new Dec("0.9316"), new Dec("1.8790")],
    [new Dec("25822.84"),  new Dec("0.8369"), new Dec("1.6895")],
    [new Dec("51645.69"),  new Dec("0.5684"), new Dec("1.1211")],
    [new Dec("103291.38"), new Dec("0.3790"), new Dec("0.7579")],
    [new Dec("258228.45"), new Dec("0.2842"), new Dec("0.5684")],
    [new Dec("516456.90"), new Dec("0.0474"), new Dec("0.0947")],
];

// ============================================================
// FORMATTAZIONE
// ============================================================
function formatEuro(valore) {
    let d = new Dec(valore).round2();
    let numStr = d.toNumber().toFixed(2);
    let parts = numStr.split('.');
    let integer = parts[0];
    let fraction = parts[1];
    
    let isNegative = integer.startsWith('-');
    if (isNegative) integer = integer.slice(1);
    
    let rev = integer.split('').reverse().join('');
    let grouped = [];
    for (let i = 0; i < rev.length; i += 3) {
        grouped.push(rev.slice(i, i + 3));
    }
    let integerFormatted = grouped.join('.').split('').reverse().join('');
    if (isNegative) integerFormatted = '-' + integerFormatted;
    
    return '€ ' + integerFormatted + ',' + fraction;
}

function formatPercent(valore) {
    let d = new Dec(valore).round4();
    let numStr = d.toNumber().toFixed(4);
    let parts = numStr.split('.');
    let integer = parts[0];
    let fraction = parts[1];
    
    let isNegative = integer.startsWith('-');
    if (isNegative) integer = integer.slice(1);
    
    let rev = integer.split('').reverse().join('');
    let grouped = [];
    for (let i = 0; i < rev.length; i += 3) {
        grouped.push(rev.slice(i, i + 3));
    }
    let integerFormatted = grouped.join('.').split('').reverse().join('');
    if (isNegative) integerFormatted = '-' + integerFormatted;
    
    return integerFormatted + ',' + fraction + ' %';
}

function percentualeDaCriterio(percMin, percMax, criterio) {
    if (criterio === "minimo") return percMin;
    if (criterio === "massimo") return percMax;
    return percMin.plus(percMax).div(new Dec("2"));
}

// ============================================================
// STATO DELL'APPLICAZIONE
// ============================================================
let state = {
    vociOnorari: [],
    spese: [],
    coeffArt52: "1.0",
    quotaTipo: "intero", // "intero", "frazione", "percentuale"
    quotaDenominatore: "1",
    quotaPercentuale: "100",
    quotaArt15Tipo: "stessa", // "stessa", "intero", "manuale"
    quotaArt15Manuale: "0.00",
    percentualeCassa: "4",
    applicaBollo: true,
    acconti: "0.00",
    tribunale: "Tribunale di ...",
    giudice: "",
    nrg: "",
    attore: "",
    convenuto: "",
    ctuNome: "Dott. Ing. ...",
    partitaIva: "",
    codiceFiscale: "",
    indirizzo: "",
    email: "",
    telefono: "",
    cassaTipo: "Inarcassa", // e.g. "Inarcassa", "Cassa Geometri", "EPPI", "Gestione Separata INPS"
    codiceDestinatario: "",
    pec: ""
};

// Carica stato da LocalStorage se presente
function caricaStato() {
    const saved = localStorage.getItem('ctu_calculator_state_rev03');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
        } catch (e) {
            console.error("Errore nel caricamento dello stato salvato", e);
        }
    }
}

function salvaStato() {
    localStorage.setItem('ctu_calculator_state_rev03', JSON.stringify(state));
}

// ============================================================
// CALCOLI PRINCIPALI
// ============================================================
function calcolaScaglioni(valore, scaglioni, criterio) {
    valore = new Dec(valore);
    let limiteMassimo = scaglioni[scaglioni.length - 1][0];
    let valoreCalcolato, eccedenza;

    if (valore.isGreaterThan(limiteMassimo)) {
        valoreCalcolato = limiteMassimo;
        eccedenza = valore.minus(limiteMassimo);
    } else {
        valoreCalcolato = valore;
        eccedenza = new Dec("0.00");
    }

    let residuo = valoreCalcolato;
    let limitePrecedente = new Dec("0.00");
    let totale = new Dec("0.00");
    let dettaglio = [];

    for (let [limite, percMin, percMax] of scaglioni) {
        if (residuo.isLessThan(0) || residuo.isZero()) {
            break;
        }

        let ampiezza = limite.minus(limitePrecedente);
        let quota = residuo.isLessThan(ampiezza) ? residuo : ampiezza;

        let percApplicata = percentualeDaCriterio(percMin, percMax, criterio);
        let compenso = quota.times(percApplicata).div(new Dec("100"));

        dettaglio.push({
            da: limitePrecedente,
            a: limite,
            quota: quota,
            percMin: percMin,
            percMax: percMax,
            percApplicata: percApplicata,
            compenso: compenso
        });

        totale = totale.plus(compenso);
        residuo = residuo.minus(quota);
        limitePrecedente = limite;
    }

    let minimoApplicato = false;
    if (totale.isLessThan(MINIMO_GENERALE)) {
        totale = MINIMO_GENERALE;
        minimoApplicato = true;
    }

    return {
        totale: totale.round2(),
        dettaglio: dettaglio,
        eccedenza: eccedenza,
        minimoApplicato: minimoApplicato
    };
}

// Calcola quota coefficiente
function ottieniQuotaCoeff() {
    if (state.quotaTipo === "frazione") {
        let den = parseInt(state.quotaDenominatore) || 1;
        if (den <= 0) den = 1;
        return new Dec("1").div(new Dec(den));
    } else if (state.quotaTipo === "percentuale") {
        let perc = new Dec(state.quotaPercentuale || "100");
        if (perc.isLessThan("0")) perc = new Dec("0");
        if (perc.isGreaterThan("100")) perc = new Dec("100");
        return perc.div(new Dec("100"));
    }
    return new Dec("1.00");
}

function calcolaTutto() {
    // 1. Calcolo voci onorari
    let onorariBaseTot = new Dec("0.00");
    let vociCalcolate = state.vociOnorari.map(v => {
        let compenso = new Dec("0.00");
        let dettaglioInfo = null;
        let eccedenza = new Dec("0.00");
        let extraInfo = "";

        if (v.tipo === "art11") {
            let res = calcolaScaglioni(v.valore, SCAGLIONI_ART11, v.criterio);
            compenso = res.totale;
            dettaglioInfo = res.dettaglio;
            eccedenza = res.eccedenza;
            extraInfo = `Valore opera: ${formatEuro(v.valore)} | Criterio: ${v.criterio}`;
        } else if (v.tipo === "art12") {
            let min = MINIMO_GENERALE;
            let max = new Dec("970.42");
            let med = min.plus(max).div(new Dec("2"));

            if (v.criterio === "minimo") compenso = min;
            else if (v.criterio === "massimo") compenso = max;
            else if (v.criterio === "manuale") {
                compenso = new Dec(v.importoManuale);
                if (compenso.isLessThan(min)) compenso = min;
                if (compenso.isGreaterThan(max)) compenso = max;
            } else compenso = med;

            compenso = compenso.round2();
            extraInfo = `Criterio: ${v.criterio === "manuale" ? "manuale (" + formatEuro(v.importoManuale) + ")" : v.criterio}`;
        } else if (v.tipo === "art13") {
            let res = calcolaScaglioni(v.valore, SCAGLIONI_ART13, v.criterio);
            let compBase = res.totale;
            dettaglioInfo = res.dettaglio;
            eccedenza = res.eccedenza;

            if (v.tipoStima === "sommaria") {
                compenso = compBase.div(new Dec("2"));
                extraInfo = `Stima sommaria (riduzione 1/2)`;
            } else if (v.tipoStima === "semplice") {
                compenso = compBase.div(new Dec("3"));
                extraInfo = `Semplice giudizio di stima (riduzione 2/3)`;
            } else {
                compenso = compBase;
                extraInfo = `Stima ordinaria`;
            }

            if (compenso.isLessThan(MINIMO_GENERALE)) {
                compenso = MINIMO_GENERALE;
            }
            compenso = compenso.round2();
            extraInfo += ` | Valore stima: ${formatEuro(v.valore)} | Criterio: ${v.criterio}`;
        } else if (v.tipo === "vacazioni") {
            let vacazioniNum = parseInt(v.vacazioniRichieste) || 0;
            if (v.tipoInput === "ore") {
                let ore = new Dec(v.oreComplessive || "0");
                let vac = ore.div(new Dec("2")).ceil();
                vacazioniNum = vac.toNumber();
            }

            let vacazioniLiquidabili = vacazioniNum;
            if (v.applicaLimiteGiornaliero) {
                let giorni = parseInt(v.giorniAttivita) || 1;
                let limite = giorni * 4;
                if (vacazioniLiquidabili > limite) {
                    vacazioniLiquidabili = limite;
                }
            }

            let baseVac = new Dec(vacazioniLiquidabili).times(VACAZIONE_TARIFFA);
            let coeffUrgenza = new Dec("1.0");
            if (v.urgenza === "media") coeffUrgenza = new Dec("1.5");
            else if (v.urgenza === "massima") coeffUrgenza = new Dec("2.0");

            compenso = baseVac.times(coeffUrgenza).round2();
            extraInfo = `Vacazioni: ${vacazioniNum} (liquidate: ${vacazioniLiquidabili}) | Urgenza coeff: ${coeffUrgenza}`;
        }

        onorariBaseTot = onorariBaseTot.plus(compenso);

        return {
            ...v,
            compenso: compenso,
            dettaglioInfo: dettaglioInfo,
            eccedenza: eccedenza,
            extraInfo: extraInfo
        };
    });

    onorariBaseTot = onorariBaseTot.round2();

    // 2. Maggiorazione Art. 52
    let coeff52 = new Dec(state.coeffArt52 || "1.0");
    if (coeff52.isLessThan("1.0")) coeff52 = new Dec("1.0");
    if (coeff52.isGreaterThan("2.0")) coeff52 = new Dec("2.0");
    let onorariMaggioratiTot = onorariBaseTot.times(coeff52).round2();

    // 3. Calcolo spese
    let speseImponibiliTot = new Dec("0.00");
    let speseArt15Tot = new Dec("0.00");
    let speseCalcolate = state.spese.map(s => {
        let importo = new Dec("0.00");
        let extraInfo = "";

        if (s.tipo === "viva") {
            importo = new Dec(s.importo).round2();
            extraInfo = `Rif: ${s.riferimento || 'n.d.'}`;
        } else if (s.tipo === "viaggio") {
            let acc = new Dec(s.accessi || "0");
            let vpa = new Dec(s.viaggiPerAccesso || "2");
            let km = new Dec(s.kmSoloAndata || "0");
            let tariffa = new Dec(s.tariffaKm || "0.40");
            
            let kmTot = acc.times(vpa).times(km);
            importo = kmTot.times(tariffa).round2();
            extraInfo = `Accessi: ${s.accessi} | Km totali: ${kmTot.toNumber()} km | Tariffa: ${formatEuro(s.tariffaKm)}/km`;
        }

        if (s.categoria === "art15") {
            speseArt15Tot = speseArt15Tot.plus(importo);
        } else {
            speseImponibiliTot = speseImponibiliTot.plus(importo);
        }

        return {
            ...s,
            importo: importo,
            extraInfo: extraInfo
        };
    });

    let totaleSpese = speseImponibiliTot.plus(speseArt15Tot).round2();
    let totaleIstanza = onorariMaggioratiTot.plus(totaleSpese).round2();

    // 4. Calcoli Proforma (Quota)
    let quotaCoeff = ottieniQuotaCoeff();
    
    // Prestazioni professionali (onorari + spese imponibili) ripartite
    let prestazioniIntere = onorariMaggioratiTot.plus(speseImponibiliTot).round2();
    let prestazioniRipartite = prestazioniIntere.times(quotaCoeff).round2();

    // Contributo Previdenziale (standard 4%)
    let percCassa = new Dec(state.percentualeCassa || "4");
    let contributoCassa = prestazioniRipartite.times(percCassa).div(new Dec("100")).round2();

    // Imponibile prestazioni (Prestazioni + Cassa)
    let imponibileFattura = prestazioniRipartite.plus(contributoCassa).round2();

    // Calcolo automatico bollo (se imponibile prestazioni > 77.47)
    let bolloConsigliato = imponibileFattura.isGreaterThan(BOLLO_SOGLIA);
    let bolloApplicato = (state.applicaBollo && bolloConsigliato) ? BOLLO_IMPORTO : new Dec("0.00");

    let totaleFattura = imponibileFattura.plus(bolloApplicato).round2();

    // Le spese Art 15 ripartite
    let art15Ripartite = new Dec("0.00");
    if (state.quotaArt15Tipo === "stessa") {
        art15Ripartite = speseArt15Tot.times(quotaCoeff).round2();
    } else if (state.quotaArt15Tipo === "intero") {
        art15Ripartite = speseArt15Tot;
    } else {
        art15Ripartite = new Dec(state.quotaArt15Manuale || "0.00").round2();
    }

    let accontiDetratti = new Dec(state.acconti || "0.00").round2();
    let nettoDaVersare = totaleFattura.plus(art15Ripartite).minus(accontiDetratti).round2();

    return {
        vociCalcolate,
        speseCalcolate,
        onorariBaseTot,
        coeff52,
        onorariMaggioratiTot,
        speseImponibiliTot,
        speseArt15Tot,
        totaleSpese,
        totaleIstanza,
        quotaCoeff,
        prestazioniIntere,
        prestazioniRipartite,
        contributoCassa,
        imponibileFattura,
        bolloConsigliato,
        bolloApplicato,
        totaleFattura,
        art15Ripartite,
        accontiDetratti,
        nettoDaVersare
    };
}

// ============================================================
// GESTIONE EVENTI & INTERFACCIA UTENTE
// ============================================================

// Elementi DOM
let refs = {};

function initDOMRefs() {
    const ids = [
        'onorario-tipo', 'form-container-onorario', 'btn-add-onorario',
        'spesa-tipo', 'form-container-spesa', 'btn-add-spesa',
        'voci-list', 'spese-list',
        'istanza-preview', 'proforma-preview',
        'coeff-art52', 'coeff-art52-val',
        'quota-tipo', 'quota-frazione-wrapper', 'quota-percentuale-wrapper',
        'quota-denominatore', 'quota-percentuale',
        'quota-art15-tipo', 'quota-art15-manuale-wrapper', 'quota-art15-manuale',
        'percentuale-cassa', 'applica-bollo', 'acconti',
        'tab-dati', 'tab-istanza', 'tab-proforma',
        'btn-tab-dati', 'btn-tab-istanza', 'btn-tab-proforma',
        'btn-print', 'theme-toggle',
        // Dati anagrafici e di cancelleria
        'tribunale', 'giudice', 'nrg', 'attore', 'convenuto',
        'ctu-nome', 'partita-iva', 'codice-fiscale', 'indirizzo',
        'email', 'telefono', 'cassa-tipo', 'codice-destinatario', 'pec',
        'btn-pulisci-dati', 'btn-esporta', 'btn-importa', 'import-file-input', 'btn-word'
    ];
    ids.forEach(id => {
        refs[id] = document.getElementById(id);
    });
}

// Render dei form dinamici per gli onorari
function renderFormOnorario() {
    const tipo = refs['onorario-tipo'].value;
    let html = '';

    if (tipo === 'art11') {
        html = `
            <div class="form-group">
                <label for="art11-valore">Valore dell'opera o della controversia (€)</label>
                <input type="text" id="art11-valore" placeholder="es. 50.000,00" required>
            </div>
            <div class="form-group">
                <label for="art11-criterio">Criterio di Liquidazione</label>
                <select id="art11-criterio">
                    <option value="medio" selected>Valore Medio (raccomandato)</option>
                    <option value="minimo">Valore Minimo</option>
                    <option value="massimo">Valore Massimo</option>
                </select>
            </div>
        `;
    } else if (tipo === 'art12') {
        html = `
            <div class="form-group">
                <label for="art12-criterio">Criterio di Liquidazione</label>
                <select id="art12-criterio" onchange="toggleArt12Manuale()">
                    <option value="medio" selected>Valore Medio (€ 557,77)</option>
                    <option value="minimo">Valore Minimo (€ 145,12)</option>
                    <option value="massimo">Valore Massimo (€ 970,42)</option>
                    <option value="manuale">Valore Personalizzato</option>
                </select>
            </div>
            <div class="form-group d-none" id="art12-manuale-wrapper">
                <label for="art12-manuale-importo">Importo personalizzato (€)</label>
                <input type="text" id="art12-manuale-importo" placeholder="Compreso tra 145,12 e 970,42">
            </div>
        `;
    } else if (tipo === 'art13') {
        html = `
            <div class="form-group">
                <label for="art13-valore">Importo stimato del bene (€)</label>
                <input type="text" id="art13-valore" placeholder="es. 150.000,00" required>
            </div>
            <div class="form-group">
                <label for="art13-criterio">Criterio di Liquidazione</label>
                <select id="art13-criterio">
                    <option value="medio" selected>Valore Medio (raccomandato)</option>
                    <option value="minimo">Valore Minimo</option>
                    <option value="massimo">Valore Massimo</option>
                </select>
            </div>
            <div class="form-group">
                <label for="art13-tipo-stima">Tipologia di Stima</label>
                <select id="art13-tipo-stima">
                    <option value="ordinaria" selected>Stima Ordinaria (Tariffa Piena)</option>
                    <option value="sommaria">Stima Sommaria (Ridotta alla metà)</option>
                    <option value="semplice">Semplice giudizio di stima (Ridotta di due terzi)</option>
                </select>
            </div>
        `;
    } else if (tipo === 'vacazioni') {
        html = `
            <div class="form-group">
                <label for="vac-tipo-input">Inserimento per</label>
                <select id="vac-tipo-input" onchange="toggleVacazioniInput()">
                    <option value="ore" selected>Ore di attività</option>
                    <option value="vacazioni">Numero diretto vacazioni</option>
                </select>
            </div>
            <div class="form-group" id="vac-ore-wrapper">
                <label for="vac-ore">Ore complessive impiegate</label>
                <input type="text" id="vac-ore" placeholder="es. 12,5" required>
                <span class="input-help">Il sistema calcolerà le vacazioni arrotondando all'eccedenza di 2 ore (1 vacazione = 2 ore)</span>
            </div>
            <div class="form-group d-none" id="vac-num-wrapper">
                <label for="vac-num">Numero di vacazioni</label>
                <input type="number" id="vac-num" min="1" placeholder="es. 6">
            </div>
            <div class="form-group-checkbox">
                <input type="checkbox" id="vac-limite" checked onchange="toggleVacazioniGiorni()">
                <label for="vac-limite">Applica limite di 4 vacazioni al giorno (art. 4 L. 319/80)</label>
            </div>
            <div class="form-group" id="vac-giorni-wrapper">
                <label for="vac-giorni">Numero di giorni di attività</label>
                <input type="number" id="vac-giorni" min="1" value="1" placeholder="es. 3">
            </div>
            <div class="form-group">
                <label for="vac-urgenza">Urgenza (aumento a vacazione)</label>
                <select id="vac-urgenza">
                    <option value="nessuna" selected>Nessuna maggiorazione</option>
                    <option value="media">Termine non sup. a 15 giorni (Aumento fino al 50%)</option>
                    <option value="massima">Termine non sup. a 5 giorni (Raddoppio)</option>
                </select>
            </div>
        `;
    }

    refs['form-container-onorario'].innerHTML = html;
}

window.toggleArt12Manuale = function() {
    const criterio = document.getElementById('art12-criterio').value;
    const wrapper = document.getElementById('art12-manuale-wrapper');
    if (criterio === 'manuale') {
        wrapper.classList.remove('d-none');
    } else {
        wrapper.classList.add('d-none');
    }
}

window.toggleVacazioniInput = function() {
    const tipo = document.getElementById('vac-tipo-input').value;
    const oreW = document.getElementById('vac-ore-wrapper');
    const numW = document.getElementById('vac-num-wrapper');
    if (tipo === 'ore') {
        oreW.classList.remove('d-none');
        numW.classList.add('d-none');
    } else {
        oreW.classList.add('d-none');
        numW.classList.remove('d-none');
    }
}

window.toggleVacazioniGiorni = function() {
    const checked = document.getElementById('vac-limite').checked;
    const wrapper = document.getElementById('vac-giorni-wrapper');
    if (checked) {
        wrapper.classList.remove('d-none');
    } else {
        wrapper.classList.add('d-none');
    }
}

// Render dei form dinamici per le spese
function renderFormSpesa() {
    const tipo = refs['spesa-tipo'].value;
    let html = '';

    if (tipo === 'viva') {
        html = `
            <div class="form-group">
                <label for="viva-desc">Descrizione spesa</label>
                <input type="text" id="viva-desc" placeholder="es. Marche da bollo, Copie di atti, Diritti di cancelleria" required>
            </div>
            <div class="form-group">
                <label for="viva-data">Data / Riferimento</label>
                <input type="text" id="viva-data" placeholder="es. 15/04/2026, fattura n. 12">
            </div>
            <div class="form-group">
                <label for="viva-importo">Importo spesa (€)</label>
                <input type="text" id="viva-importo" placeholder="es. 16,00" required>
            </div>
            <div class="form-group">
                <label for="viva-categoria">Categoria fiscale</label>
                <select id="viva-categoria">
                    <option value="art15" selected>Anticipazioni ex art. 15 DPR 633/72 (Escluso IVA)</option>
                    <option value="imponibile">Spesa Imponibile (Rimborso spese ordinario)</option>
                </select>
            </div>
        `;
    } else if (tipo === 'viaggio') {
        html = `
            <div class="form-group">
                <label for="viaggio-desc">Descrizione viaggio</label>
                <input type="text" id="viaggio-desc" placeholder="es. Accesso all'immobile per sopralluogo" required>
            </div>
            <div class="form-group">
                <label for="viaggio-data">Data / Riferimento</label>
                <input type="text" id="viaggio-data" placeholder="es. 20/04/2026">
            </div>
            <div class="grid grid-2">
                <div class="form-group">
                    <label for="viaggio-accessi">Numero accessi/sopralluoghi</label>
                    <input type="number" id="viaggio-accessi" min="1" value="1" required>
                </div>
                <div class="form-group">
                    <label for="viaggio-vpa">Viaggi per accesso (Andata/Ritorno = 2)</label>
                    <input type="number" id="viaggio-vpa" min="1" value="2" required>
                </div>
            </div>
            <div class="grid grid-2">
                <div class="form-group">
                    <label for="viaggio-km">Km solo andata</label>
                    <input type="text" id="viaggio-km" placeholder="es. 25,4" required>
                </div>
                <div class="form-group">
                    <label for="viaggio-tariffa">Tariffa chilometrica (€/km)</label>
                    <input type="text" id="viaggio-tariffa" value="0,40" required>
                </div>
            </div>
            <div class="form-group">
                <label for="viaggio-categoria">Categoria fiscale</label>
                <select id="viaggio-categoria">
                    <option value="imponibile" selected>Spesa Imponibile (Standard per rimborsi chilometrici)</option>
                    <option value="art15">Anticipazioni ex art. 15 DPR 633/72 (Escluso IVA)</option>
                </select>
            </div>
        `;
    }

    refs['form-container-spesa'].innerHTML = html;
}

// ============================================================
// AGGIUNTA ELEMENTI ALLO STATO
// ============================================================
function aggiungiOnorario() {
    const tipo = refs['onorario-tipo'].value;
    let voce = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        tipo: tipo
    };

    if (tipo === 'art11') {
        const valoreInput = document.getElementById('art11-valore').value;
        if (!valoreInput) return alert("Inserire il valore della controversia/opera.");
        voce.valore = new Dec(valoreInput).toString();
        voce.criterio = document.getElementById('art11-criterio').value;
        voce.titolo = "Art. 11 - Costruzioni, Impianti, Strutture";
    } else if (tipo === 'art12') {
        const criterio = document.getElementById('art12-criterio').value;
        voce.criterio = criterio;
        voce.titolo = "Art. 12 - Verifiche, Collaudi, Rilievi, Contabilità";
        if (criterio === 'manuale') {
            const manualeVal = document.getElementById('art12-manuale-importo').value;
            if (!manualeVal) return alert("Inserire l'importo personalizzato.");
            voce.importoManuale = new Dec(manualeVal).toString();
        } else {
            voce.importoManuale = "0.00";
        }
    } else if (tipo === 'art13') {
        const valoreInput = document.getElementById('art13-valore').value;
        if (!valoreInput) return alert("Inserire l'importo stimato.");
        voce.valore = new Dec(valoreInput).toString();
        voce.criterio = document.getElementById('art13-criterio').value;
        voce.tipoStima = document.getElementById('art13-tipo-stima').value;
        voce.titolo = "Art. 13 - Estimo";
    } else if (tipo === 'vacazioni') {
        const tipoInput = document.getElementById('vac-tipo-input').value;
        voce.tipoInput = tipoInput;
        voce.titolo = "Vacazioni (Compenso a tempo)";
        if (tipoInput === 'ore') {
            const oreInput = document.getElementById('vac-ore').value;
            if (!oreInput) return alert("Inserire le ore complessive.");
            voce.oreComplessive = new Dec(oreInput).toString();
            voce.vacazioniRichieste = 0;
        } else {
            const numInput = document.getElementById('vac-num').value;
            if (!numInput) return alert("Inserire il numero di vacazioni.");
            voce.vacazioniRichieste = parseInt(numInput);
            voce.oreComplessive = "0.00";
        }

        const applicaLimite = document.getElementById('vac-limite').checked;
        voce.applicaLimiteGiornaliero = applicaLimite;
        if (applicaLimite) {
            voce.giorniAttivita = parseInt(document.getElementById('vac-giorni').value) || 1;
        } else {
            voce.giorniAttivita = 1;
        }

        voce.urgenza = document.getElementById('vac-urgenza').value;
    }

    state.vociOnorari.push(voce);
    salvaStato();
    aggiornaUI();
    
    // Resetta i campi del valore
    if (document.getElementById('art11-valore')) document.getElementById('art11-valore').value = '';
    if (document.getElementById('art13-valore')) document.getElementById('art13-valore').value = '';
    if (document.getElementById('vac-ore')) document.getElementById('vac-ore').value = '';
    if (document.getElementById('vac-num')) document.getElementById('vac-num').value = '';
}

function aggiungiSpesa() {
    const tipo = refs['spesa-tipo'].value;
    let spesa = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        tipo: tipo
    };

    if (tipo === 'viva') {
        const desc = document.getElementById('viva-desc').value;
        const data = document.getElementById('viva-data').value;
        const importo = document.getElementById('viva-importo').value;
        
        if (!desc || !importo) return alert("Compilare descrizione e importo della spesa.");
        
        spesa.descrizione = desc;
        spesa.riferimento = data;
        spesa.importo = new Dec(importo).toString();
        spesa.categoria = document.getElementById('viva-categoria').value;
    } else if (tipo === 'viaggio') {
        const desc = document.getElementById('viaggio-desc').value;
        const data = document.getElementById('viaggio-data').value;
        const accessi = parseInt(document.getElementById('viaggio-accessi').value) || 1;
        const vpa = parseInt(document.getElementById('viaggio-vpa').value) || 2;
        const km = document.getElementById('viaggio-km').value;
        const tariffa = document.getElementById('viaggio-tariffa').value;

        if (!desc || !km || !tariffa) return alert("Compilare descrizione, km e tariffa.");

        spesa.descrizione = desc;
        spesa.riferimento = data;
        spesa.accessi = accessi;
        spesa.viaggiPerAccesso = vpa;
        spesa.kmSoloAndata = new Dec(km).toString();
        spesa.tariffaKm = new Dec(tariffa).toString();
        spesa.categoria = document.getElementById('viaggio-categoria').value;
        
        // Calcolo preliminare per memorizzazione ordinata
        let kmTot = new Dec(accessi).times(new Dec(vpa)).times(new Dec(km));
        spesa.importo = kmTot.times(new Dec(tariffa)).round2().toString();
    }

    state.spese.push(spesa);
    salvaStato();
    aggiornaUI();

    // Resetta campi
    if (document.getElementById('viva-desc')) document.getElementById('viva-desc').value = '';
    if (document.getElementById('viva-importo')) document.getElementById('viva-importo').value = '';
    if (document.getElementById('viaggio-desc')) document.getElementById('viaggio-desc').value = '';
    if (document.getElementById('viaggio-km')) document.getElementById('viaggio-km').value = '';
}

window.cancellaOnorario = function(id) {
    state.vociOnorari = state.vociOnorari.filter(v => v.id !== id);
    salvaStato();
    aggiornaUI();
}

window.cancellaSpesa = function(id) {
    state.spese = state.spese.filter(s => s.id !== id);
    salvaStato();
    aggiornaUI();
}

// Modifica voce esistente
window.modificaOnorario = function(id) {
    const voce = state.vociOnorari.find(v => v.id === id);
    if (!voce) return;

    refs['onorario-tipo'].value = voce.tipo;
    renderFormOnorario();

    if (voce.tipo === 'art11') {
        document.getElementById('art11-valore').value = new Dec(voce.valore).toNumber().toLocaleString('it-IT', { minimumFractionDigits: 2 });
        document.getElementById('art11-criterio').value = voce.criterio;
    } else if (voce.tipo === 'art12') {
        document.getElementById('art12-criterio').value = voce.criterio;
        window.toggleArt12Manuale();
        if (voce.criterio === 'manuale') {
            document.getElementById('art12-manuale-importo').value = new Dec(voce.importoManuale).toNumber().toLocaleString('it-IT', { minimumFractionDigits: 2 });
        }
    } else if (voce.tipo === 'art13') {
        document.getElementById('art13-valore').value = new Dec(voce.valore).toNumber().toLocaleString('it-IT', { minimumFractionDigits: 2 });
        document.getElementById('art13-criterio').value = voce.criterio;
        document.getElementById('art13-tipo-stima').value = voce.tipoStima;
    } else if (voce.tipo === 'vacazioni') {
        document.getElementById('vac-tipo-input').value = voce.tipoInput;
        window.toggleVacazioniInput();
        if (voce.tipoInput === 'ore') {
            document.getElementById('vac-ore').value = new Dec(voce.oreComplessive).toNumber().toLocaleString('it-IT', { maximumFractionDigits: 2 });
        } else {
            document.getElementById('vac-num').value = voce.vacazioniRichieste;
        }
        document.getElementById('vac-limite').checked = voce.applicaLimiteGiornaliero;
        window.toggleVacazioniGiorni();
        if (voce.applicaLimiteGiornaliero) {
            document.getElementById('vac-giorni').value = voce.giorniAttivita;
        }
        document.getElementById('vac-urgenza').value = voce.urgenza;
    }

    // Rimuove la voce per sovrascriverla all'aggiunta
    state.vociOnorari = state.vociOnorari.filter(v => v.id !== id);
    salvaStato();
    aggiornaUI();
}

window.modificaSpesa = function(id) {
    const spesa = state.spese.find(s => s.id === id);
    if (!spesa) return;

    refs['spesa-tipo'].value = spesa.tipo;
    renderFormSpesa();

    if (spesa.tipo === 'viva') {
        document.getElementById('viva-desc').value = spesa.descrizione;
        document.getElementById('viva-data').value = spesa.riferimento || '';
        document.getElementById('viva-importo').value = new Dec(spesa.importo).toNumber().toLocaleString('it-IT', { minimumFractionDigits: 2 });
        document.getElementById('viva-categoria').value = spesa.categoria;
    } else if (spesa.tipo === 'viaggio') {
        document.getElementById('viaggio-desc').value = spesa.descrizione;
        document.getElementById('viaggio-data').value = spesa.riferimento || '';
        document.getElementById('viaggio-accessi').value = spesa.accessi;
        document.getElementById('viaggio-vpa').value = spesa.viaggiPerAccesso;
        document.getElementById('viaggio-km').value = new Dec(spesa.kmSoloAndata).toNumber().toLocaleString('it-IT', { maximumFractionDigits: 2 });
        document.getElementById('viaggio-tariffa').value = new Dec(spesa.tariffaKm).toNumber().toLocaleString('it-IT', { minimumFractionDigits: 2 });
        document.getElementById('viaggio-categoria').value = spesa.categoria;
    }

    state.spese = state.spese.filter(s => s.id !== id);
    salvaStato();
    aggiornaUI();
}

// ============================================================
// AGGIORNAMENTO UI & RENDERING RIEPILOGHI
// ============================================================
function aggiornaUI() {
    const res = calcolaTutto();

    // Aggiorna lista onorari inseriti
    if (res.vociCalcolate.length === 0) {
        refs['voci-list'].innerHTML = `<div class="empty-list-msg">Nessun onorario inserito. Usa il pannello a sinistra per aggiungerlo.</div>`;
    } else {
        let html = '';
        res.vociCalcolate.forEach((v) => {
            let scaglioniHtml = '';
            if (v.dettaglioInfo && v.dettaglioInfo.length > 0) {
                let rows = v.dettaglioInfo.map(r => {
                    // Calcola percentuale riempimento barra
                    let ampiezza = r.a.minus(r.da);
                    let fillPerc = r.quota.div(ampiezza).times(new Dec("100")).toNumber().toFixed(1);
                    return `
                        <tr>
                            <td>Da ${formatEuro(r.da)} a ${formatEuro(r.a)}</td>
                            <td>
                                <div class="scaglione-quota-bar">
                                    <div class="scaglione-quota-fill" style="width: ${fillPerc}%"></div>
                                    <span class="scaglione-quota-text">${formatEuro(r.quota)}</span>
                                </div>
                            </td>
                            <td>${formatPercent(r.percApplicata)}</td>
                            <td class="text-right">${formatEuro(r.compenso)}</td>
                        </tr>
                    `;
                }).join('');
                
                let eccedenzaAlert = '';
                if (v.eccedenza.isGreaterThan(0)) {
                    eccedenzaAlert = `
                        <div class="eccedenza-alert">
                            <span class="icon-warning">⚠️</span>
                            <span>Il valore supera il limite tabellare. Eccedenza non calcolata: <strong>${formatEuro(v.eccedenza)}</strong></span>
                        </div>
                    `;
                }

                scaglioniHtml = `
                    <div class="scaglioni-details-accordion">
                        <button class="btn-toggle-scaglioni" onclick="this.nextElementSibling.classList.toggle('active')">
                            Mostra dettaglio scaglioni
                            <span class="arrow-indicator">▼</span>
                        </button>
                        <div class="scaglioni-table-wrapper">
                            <table class="scaglioni-table">
                                <thead>
                                    <tr>
                                        <th>Scaglione</th>
                                        <th>Quota valore considerata</th>
                                        <th>Percentuale</th>
                                        <th class="text-right">Compenso quota</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>
                            ${eccedenzaAlert}
                        </div>
                    </div>
                `;
            }

            html += `
                <div class="list-item-card">
                    <div class="card-header-actions">
                        <div class="card-item-title-badge">
                            <h4>${v.titolo}</h4>
                        </div>
                        <div class="card-action-buttons">
                            <button class="btn-icon btn-edit" onclick="modificaOnorario('${v.id}')" title="Modifica">✏️</button>
                            <button class="btn-icon btn-delete" onclick="cancellaOnorario('${v.id}')" title="Elimina">🗑️</button>
                        </div>
                    </div>
                    <p class="card-item-desc">${v.extraInfo}</p>
                    ${scaglioniHtml}
                    <div class="card-item-price-tag">
                        <span>Importo liquidato:</span>
                        <strong>${formatEuro(v.compenso)}</strong>
                    </div>
                </div>
            `;
        });
        refs['voci-list'].innerHTML = html;
    }

    // Aggiorna lista spese inserite
    if (res.speseCalcolate.length === 0) {
        refs['spese-list'].innerHTML = `<div class="empty-list-msg">Nessuna spesa inserita. Usa il pannello a sinistra per aggiungerla.</div>`;
    } else {
        let html = '';
        res.speseCalcolate.forEach((s) => {
            let catBadge = s.categoria === 'art15' 
                ? '<span class="badge badge-art15">Art. 15 (Escluso IVA)</span>' 
                : '<span class="badge badge-imponibile">Spesa Imponibile</span>';
            
            html += `
                <div class="list-item-card">
                    <div class="card-header-actions">
                        <div class="card-item-title-badge">
                            <h4>${s.tipo === 'viva' ? 'Spesa Viva' : 'Spesa di Viaggio'}</h4>
                            ${catBadge}
                        </div>
                        <div class="card-action-buttons">
                            <button class="btn-icon btn-edit" onclick="modificaSpesa('${s.id}')" title="Modifica">✏️</button>
                            <button class="btn-icon btn-delete" onclick="cancellaSpesa('${s.id}')" title="Elimina">🗑️</button>
                        </div>
                    </div>
                    <p class="card-item-desc"><strong>${s.descrizione}</strong></p>
                    <p class="card-item-desc">${s.extraInfo} ${s.riferimento ? '| Rif: ' + s.riferimento : ''}</p>
                    <div class="card-item-price-tag">
                        <span>Importo spesa:</span>
                        <strong>${formatEuro(s.importo)}</strong>
                    </div>
                </div>
            `;
        });
        refs['spese-list'].innerHTML = html;
    }

    // Aggiorna suggestion per il bollo
    if (res.bolloConsigliato) {
        refs['applica-bollo'].parentElement.classList.add('highlight-bollo');
    } else {
        refs['applica-bollo'].parentElement.classList.remove('highlight-bollo');
    }

    // Aggiorna anteprima ISTANZA LIQUIDAZIONE
    renderIstanza(res);

    // Aggiorna anteprima PROFORMA FATTURA
    renderProforma(res);
}

function renderIstanza(res) {
    let onorariRows = state.vociOnorari.length === 0 
        ? `<tr><td colspan="2" class="text-center italic">Nessun onorario inserito</td></tr>`
        : res.vociCalcolate.map(v => `
            <tr>
                <td>${v.titolo} <br><small class="text-muted">${v.extraInfo}</small></td>
                <td class="text-right bold">${formatEuro(v.compenso)}</td>
            </tr>
        `).join('');

    let magRow = '';
    if (res.coeff52.isGreaterThan("1.0")) {
        let maggAliquota = res.coeff52.minus(new Dec("1.0")).times(new Dec("100")).toNumber().toFixed(0);
        magRow = `
            <tr>
                <td class="indent-1">Maggiorazione Art. 52 D.P.R. 115/2002 (+${maggAliquota}%)</td>
                <td class="text-right bold text-warning">${formatEuro(res.onorariMaggioratiTot.minus(res.onorariBaseTot))}</td>
            </tr>
        `;
    }

    let speseRows = state.spese.length === 0
        ? `<tr><td colspan="2" class="text-center italic">Nessuna spesa inserita</td></tr>`
        : res.speseCalcolate.map(s => `
            <tr>
                <td>${s.tipo === 'viva' ? 'Spesa Viva' : 'Spesa di Viaggio'} - ${s.descrizione} <br><small class="text-muted">${s.extraInfo}</small></td>
                <td class="text-right bold">${formatEuro(s.importo)}</td>
            </tr>
        `).join('');

    let dateStr = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

    let html = `
        <div class="print-document">
            <div class="print-header text-center">
                <h2>ECCELLENTISSIMO TRIBUNALE DI ${state.tribunale.toUpperCase().replace("TRIBUNALE DI", "").trim()}</h2>
                ${state.giudice ? `<h3>GIUDICE: ${state.giudice.toUpperCase()}</h3>` : ''}
                ${state.nrg ? `<h4>R.G. N. ${state.nrg}</h4>` : ''}
            </div>

            <div class="print-parties-info">
                <p><strong>Causa promossa da:</strong> ${state.attore || '...'}</p>
                <p><strong>Contro:</strong> ${state.convenuto || '...'}</p>
            </div>

            <div class="print-title text-center">
                <h3>ISTANZA DI LIQUIDAZIONE DEL COMPENSO DEL C.T.U.</h3>
            </div>

            <div class="print-body">
                <p>Il sottoscritto <strong>${state.ctuNome || '...'}</strong>, nominato Consulente Tecnico d'Ufficio nel procedimento indicato in epigrafe, rassegnate le proprie conclusioni con il deposito della relazione peritale, chiede che l'Ill.mo Sig. Giudice voglia liquidare le proprie competenze professionali e rimborsare le spese sostenute per l'espletamento dell'incarico, come da seguente specificazione:</p>

                <h4 class="print-sec-title">A. ONORARI REGOLAMENTARI (D.M. 30 maggio 2002)</h4>
                <table class="print-table">
                    <thead>
                        <tr>
                            <th>Descrizione della prestazione</th>
                            <th class="text-right">Compenso</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${onorariRows}
                        ${magRow}
                        <tr class="table-subtotal-row">
                            <td>Subtotale Onorari CTU</td>
                            <td class="text-right">${formatEuro(res.onorariMaggioratiTot)}</td>
                        </tr>
                    </tbody>
                </table>

                <h4 class="print-sec-title">B. SPESE VIVE E DI VIAGGIO</h4>
                <table class="print-table">
                    <thead>
                        <tr>
                            <th>Descrizione della spesa</th>
                            <th class="text-right">Importo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${speseRows}
                        <tr class="table-subtotal-row">
                            <td>Subtotale Spese Documentate</td>
                            <td class="text-right">${formatEuro(res.totaleSpese)}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="print-totals-summary">
                    <div class="print-totals-row">
                        <span>TOTALE ONORARI:</span>
                        <span>${formatEuro(res.onorariMaggioratiTot)}</span>
                    </div>
                    <div class="print-totals-row">
                        <span>TOTALE SPESE CTU:</span>
                        <span>${formatEuro(res.totaleSpese)}</span>
                    </div>
                    <div class="print-totals-row print-grand-total">
                        <span>TOTALE COMPLESSIVO LIQUIDANDO:</span>
                        <span>${formatEuro(res.totaleIstanza)}</span>
                    </div>
                </div>

                <p class="print-disclaimer">Si fa presente che il sottoscritto C.T.U. opera in <strong>Regime Forfettario</strong> (Legge 190/2014) per cui l'importo sopra indicato non è assoggettato ad IVA né a ritenuta d'acconto, ma sarà gravato esclusivamente del contributo previdenziale integrativo di legge e della marca da bollo ove dovuta.</p>

                <div class="print-footer grid grid-2">
                    <div>
                        <p>Luogo e data:</p>
                        <p>......................, lì ${dateStr}</p>
                    </div>
                    <div class="text-right">
                        <p>Il Consulente Tecnico d'Ufficio</p>
                        <br><br>
                        <p>____________________________________</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    refs['istanza-preview'].innerHTML = html;
}

function renderProforma(res) {
    let quotaDettaglio = '';
    if (state.quotaTipo === 'frazione') {
        quotaDettaglio = `Quota di addebito: 1/${state.quotaDenominatore}`;
    } else if (state.quotaTipo === 'percentuale') {
        quotaDettaglio = `Quota di addebito: ${state.quotaPercentuale}%`;
    } else {
        quotaDettaglio = `Quota di addebito: Intero Importo (100%)`;
    }

    let quotaSpeseA15Dettaglio = '';
    if (state.quotaArt15Tipo === 'stessa') {
        quotaSpeseA15Dettaglio = 'ripartite con la stessa quota';
    } else if (state.quotaArt15Tipo === 'intero') {
        quotaSpeseA15Dettaglio = 'addebito intero (100%)';
    } else {
        quotaSpeseA15Dettaglio = 'addebito importo fisso concordato';
    }

    let dateStr = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

    let html = `
        <div class="print-document">
            <div class="proforma-letterhead grid grid-2">
                <div class="letterhead-ctu-info">
                    <h3>${state.ctuNome || 'PROFILO C.T.U.'}</h3>
                    ${state.indirizzo ? `<p>${state.indirizzo}</p>` : ''}
                    ${state.telefono || state.email ? `<p>${state.telefono ? 'Tel: ' + state.telefono : ''} ${state.email ? ' | E-mail: ' + state.email : ''}</p>` : ''}
                    ${state.partitaIva || state.codiceFiscale ? `<p>${state.partitaIva ? 'P.IVA: ' + state.partitaIva : ''} ${state.codiceFiscale ? ' | C.F.: ' + state.codiceFiscale : ''}</p>` : ''}
                    ${state.pec || state.codiceDestinatario ? `<p>${state.pec ? 'PEC: ' + state.pec : ''} ${state.codiceDestinatario ? ' | SDI: ' + state.codiceDestinatario : ''}</p>` : ''}
                </div>
                <div class="letterhead-doc-meta text-right">
                    <h2>PROGETTO DI NOTULA / PROFORMA</h2>
                    <p><strong>Data emissione:</strong> ${dateStr}</p>
                    <p><strong>Destinatario:</strong> Parte / Soggetto onerato</p>
                    <p class="text-muted italic">${quotaDettaglio}</p>
                </div>
            </div>

            <div class="print-parties-info proforma-case-details">
                <h4>RIFERIMENTO PROCEDIMENTO</h4>
                <p><strong>Ufficio Giudiziario:</strong> ${state.tribunale} ${state.giudice ? ` | G.I.: ${state.giudice}` : ''} ${state.nrg ? ` | R.G. N. ${state.nrg}` : ''}</p>
                <p><strong>Attore/i:</strong> ${state.attore || '...'} | <strong>Convenuto/i:</strong> ${state.convenuto || '...'}</p>
            </div>

            <div class="print-body">
                <table class="proforma-calculation-table">
                    <thead>
                        <tr>
                            <th>Descrizione della voce di compenso</th>
                            <th class="text-right">Importo base</th>
                            <th class="text-right">Quota a carico</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Onorari professionali del CTU (già maggiorati Art. 52 se applicabile)</td>
                            <td class="text-right">${formatEuro(res.onorariMaggioratiTot)}</td>
                            <td class="text-right bold">${formatEuro(res.onorariMaggioratiTot.times(res.quotaCoeff))}</td>
                        </tr>
                        <tr>
                            <td>Rimborso spese imponibili (es. spese di viaggio, rimborsi km)</td>
                            <td class="text-right">${formatEuro(res.speseImponibiliTot)}</td>
                            <td class="text-right bold">${formatEuro(res.speseImponibiliTot.times(res.quotaCoeff))}</td>
                        </tr>
                        
                        <tr class="proforma-subtotal-row">
                            <td colspan="2">A. Prestazioni professionali imponibili (Onorari + Spese imponibili a carico)</td>
                            <td class="text-right bold text-primary">${formatEuro(res.prestazioniRipartite)}</td>
                        </tr>
                        
                        <tr>
                            <td colspan="2">Contributo previdenziale integrativo (${state.cassaTipo || 'Cassa'} ${state.percentualeCassa}%)</td>
                            <td class="text-right bold">${formatEuro(res.contributoCassa)}</td>
                        </tr>
                        
                        <tr class="proforma-subtotal-row">
                            <td colspan="2">B. Imponibile prestazioni previdenziali (A + Cassa)</td>
                            <td class="text-right bold">${formatEuro(res.imponibileFattura)}</td>
                        </tr>
                        
                        <tr>
                            <td colspan="2">Imposta di bollo (assolta sull'originale se > € 77,47)</td>
                            <td class="text-right bold">${formatEuro(res.bolloApplicato)}</td>
                        </tr>
                        
                        <tr class="proforma-subtotal-row">
                            <td colspan="2">C. TOTALE FATTURA (B + Bollo)</td>
                            <td class="text-right bold">${formatEuro(res.totaleFattura)}</td>
                        </tr>

                        <tr>
                            <td colspan="2">Rimborsi spese escluse da IVA ex art. 15 DPR 633/72 <br><small class="text-muted">Intero totale di causa: ${formatEuro(res.speseArt15Tot)} (${quotaSpeseA15Dettaglio})</small></td>
                            <td class="text-right bold">${formatEuro(res.art15Ripartite)}</td>
                        </tr>

                        ${res.accontiDetratti.isGreaterThan(0) ? `
                            <tr class="proforma-acconto-row">
                                <td colspan="2" class="text-danger">Detrazione acconti già ricevuti / pagati da questa parte</td>
                                <td class="text-right bold text-danger">-${formatEuro(res.accontiDetratti)}</td>
                            </tr>
                        ` : ''}

                        <tr class="proforma-final-total-row">
                            <td colspan="2">NETTO DA VERSARE / SALDO COMPLESSIVO:</td>
                            <td class="text-right bold text-success">${formatEuro(res.nettoDaVersare)}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="proforma-tax-notes">
                    <h4>DICHIARAZIONE FISCALE REGIME FORFETTARIO</h4>
                    <p>“Operazione senza applicazione dell’IVA ai sensi dell’articolo 1, commi da 54 a 89, della Legge n. 190 del 23 dicembre 2014 e successive modifiche, regime forfettario. Prestazione non soggetta a ritenuta d’acconto ai sensi del comma 67 della citata Legge.”</p>
                    <p>“Imposta di bollo da € 2,00 assolta sull'originale per importi superiori a € 77,47.”</p>
                </div>

                <div class="proforma-payment-instructions">
                    <h4>ESTREMI PER IL PAGAMENTO</h4>
                    <p>Il versamento dovrà essere effettuato tramite bonifico bancario intestato a:</p>
                    <p><strong>Beneficiario:</strong> ${state.ctuNome || '...'}</p>
                    <p><strong>Istituto bancario:</strong> ...................................................... <strong>IBAN:</strong> ....................................................................................</p>
                    <p><strong>Causale:</strong> Saldo compenso CTU per causa R.G. ${state.nrg || '...'} - Tribunale di ${state.tribunale.replace("Tribunale di", "").trim()}</p>
                </div>
            </div>
        </div>
    `;

    refs['proforma-preview'].innerHTML = html;
}

// ============================================================
// AZIONI UTENTE ED EVENTI GLOBAL
// ============================================================

function toggleTab(tabId) {
    const tabDati = refs['tab-dati'];
    const tabIstanza = refs['tab-istanza'];
    const tabProforma = refs['tab-proforma'];
    
    const btnDati = refs['btn-tab-dati'];
    const btnIstanza = refs['btn-tab-istanza'];
    const btnProforma = refs['btn-tab-proforma'];

    [tabDati, tabIstanza, tabProforma].forEach(t => t.classList.add('d-none'));
    [btnDati, btnIstanza, btnProforma].forEach(b => b.classList.remove('active'));

    if (tabId === 'dati') {
        tabDati.classList.remove('d-none');
        btnDati.classList.add('active');
    } else if (tabId === 'istanza') {
        tabIstanza.classList.remove('d-none');
        btnIstanza.classList.add('active');
    } else if (tabId === 'proforma') {
        tabProforma.classList.remove('d-none');
        btnProforma.classList.add('active');
    }
}

function printDocument() {
    window.print();
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('ctu_calculator_theme', newTheme);
    refs['theme-toggle'].textContent = newTheme === 'dark' ? '☀️ Modalità Chiara' : '🌙 Modalità Scura';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('ctu_calculator_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    refs['theme-toggle'].textContent = savedTheme === 'dark' ? '☀️ Modalità Chiara' : '🌙 Modalità Scura';
}

function handleQuotaChange() {
    const tipo = refs['quota-tipo'].value;
    const frazW = refs['quota-frazione-wrapper'];
    const percW = refs['quota-percentuale-wrapper'];

    frazW.classList.add('d-none');
    percW.classList.add('d-none');

    if (tipo === 'frazione') {
        frazW.classList.remove('d-none');
    } else if (tipo === 'percentuale') {
        percW.classList.remove('d-none');
    }

    state.quotaTipo = tipo;
    salvaStato();
    aggiornaUI();
}

function handleQuotaArt15Change() {
    const tipo = refs['quota-art15-tipo'].value;
    const manualeW = refs['quota-art15-manuale-wrapper'];

    if (tipo === 'manuale') {
        manualeW.classList.remove('d-none');
    } else {
        manualeW.classList.add('d-none');
    }

    state.quotaArt15Tipo = tipo;
    salvaStato();
    aggiornaUI();
}

function syncGlobalInput(field, isChecked = false) {
    if (isChecked) {
        state[field] = refs[field].checked;
    } else {
        state[field] = refs[field].value;
    }
    salvaStato();
    aggiornaUI();
}

function syncAnagrafica(field) {
    state[field] = refs[field].value;
    salvaStato();
    aggiornaUI();
}

// Inizializza i valori anagrafici e globali nei form all'avvio
function popolaCampiAllAvvio() {
    // Campi globali/proforma
    refs['coeff-art52'].value = state.coeffArt52;
    refs['coeff-art52-val'].textContent = state.coeffArt52;
    refs['quota-tipo'].value = state.quotaTipo;
    refs['quota-denominatore'].value = state.quotaDenominatore;
    refs['quota-percentuale'].value = state.quotaPercentuale;
    refs['quota-art15-tipo'].value = state.quotaArt15Tipo;
    refs['quota-art15-manuale'].value = state.quotaArt15Manuale;
    refs['percentuale-cassa'].value = state.percentualeCassa;
    refs['applica-bollo'].checked = state.applicaBollo;
    refs['acconti'].value = state.acconti;

    // Campi anagrafici
    refs['tribunale'].value = state.tribunale;
    refs['giudice'].value = state.giudice;
    refs['nrg'].value = state.nrg;
    refs['attore'].value = state.attore;
    refs['convenuto'].value = state.convenuto;
    refs['ctu-nome'].value = state.ctuNome;
    refs['partita-iva'].value = state.partitaIva;
    refs['codice-fiscale'].value = state.codiceFiscale;
    refs['indirizzo'].value = state.indirizzo;
    refs['email'].value = state.email;
    refs['telefono'].value = state.telefono;
    refs['cassa-tipo'].value = state.cassaTipo;
    refs['codice-destinatario'].value = state.codiceDestinatario;
    refs['pec'].value = state.pec;

    // Gestione visibilità sezioni condizionali
    handleQuotaChange();
    handleQuotaArt15Change();
}

function pulisciTuttiDati() {
    if (confirm("Sei sicuro di voler cancellare tutti i dati inseriti e ripartire da zero?")) {
        localStorage.removeItem('ctu_calculator_state_rev03');
        state = {
            vociOnorari: [],
            spese: [],
            coeffArt52: "1.0",
            quotaTipo: "intero",
            quotaDenominatore: "1",
            quotaPercentuale: "100",
            quotaArt15Tipo: "stessa",
            quotaArt15Manuale: "0.00",
            percentualeCassa: "4",
            applicaBollo: true,
            acconti: "0.00",
            tribunale: "Tribunale di ...",
            giudice: "",
            nrg: "",
            attore: "",
            convenuto: "",
            ctuNome: "Dott. Ing. ...",
            partitaIva: "",
            codiceFiscale: "",
            indirizzo: "",
            email: "",
            telefono: "",
            cassaTipo: "Inarcassa",
            codiceDestinatario: "",
            pec: ""
        };
        popolaCampiAllAvvio();
        aggiornaUI();
    }
}

function esportaDati() {
    // Esporta lo stato come file JSON scaricabile localmente
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    
    // Genera nome file basato su R.G. se disponibile
    let rgStr = state.nrg ? "_" + state.nrg.replace(/[^a-zA-Z0-9]/g, "-") : "";
    let dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    let timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, "");
    let fileName = `parcella_ctu${rgStr}_${dateStr}_${timeStr}.json`;
    
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importaDati(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (parsed && (Array.isArray(parsed.vociOnorari) || Array.isArray(parsed.spese))) {
                state = { ...state, ...parsed };
                salvaStato();
                popolaCampiAllAvvio();
                aggiornaUI();
                alert("Parcella importata con successo!");
            } else {
                alert("Il file selezionato non è un formato di parcella CTU valido.");
            }
        } catch (err) {
            alert("Errore durante il parsing del file JSON: " + err.message);
        }
    };
    reader.readAsText(file);
    refs['import-file-input'].value = ''; // Resetta il valore dell'input
}

function esportaWord() {
    // Verifica quale scheda documento è attiva
    const isIstanzaActive = !refs['tab-istanza'].classList.contains('d-none');
    const isProformaActive = !refs['tab-proforma'].classList.contains('d-none');
    
    let contentHtml = '';
    let fileName = '';
    let docTitle = '';
    
    // Stili specifici per l'esportazione Word compatibili con il layout
    let cssStyles = `
        body { font-family: "Georgia", "Times New Roman", serif; font-size: 11pt; line-height: 1.5; color: #000000; }
        h2 { font-family: Arial, sans-serif; font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 5px; }
        h3 { font-family: Arial, sans-serif; font-size: 12pt; font-weight: bold; text-align: center; margin-bottom: 5px; }
        h4 { font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #000000; padding-bottom: 3px; }
        p { text-align: justify; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { border: 1px solid #dddddd; padding: 6px 10px; font-size: 10pt; text-align: left; }
        th { font-family: Arial, sans-serif; font-weight: bold; background-color: #f1f5f9; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .table-subtotal-row td { font-weight: bold; border-top: 1px solid #000000; border-bottom: 1px solid #000000; background-color: #f8fafc; }
        .print-totals-summary { width: 250px; margin-left: auto; border: 1px solid #000000; padding: 10px; background-color: #f8fafc; margin-bottom: 20px; }
        .print-totals-row { display: table; width: 100%; margin-bottom: 4px; }
        .print-totals-row span { display: table-cell; }
        .print-totals-row span:last-child { text-align: right; font-weight: bold; }
        .print-grand-total { border-top: 1px solid #000000; padding-top: 6px; font-weight: bold; }
        .print-disclaimer { font-size: 9pt; font-style: italic; margin-bottom: 30px; }
        .letterhead-ctu-info h3 { font-family: Arial, sans-serif; color: #1e3a8a; font-size: 14pt; font-weight: bold; margin-bottom: 5px; }
        .letterhead-ctu-info p { font-family: Arial, sans-serif; font-size: 9pt; margin-bottom: 2px; }
        .letterhead-doc-meta h2 { font-family: Arial, sans-serif; font-size: 13pt; font-weight: bold; color: #1e3a8a; margin-bottom: 5px; }
        .letterhead-doc-meta p { font-family: Arial, sans-serif; font-size: 9pt; margin-bottom: 2px; }
        .proforma-case-details { border: 1px solid #dddddd; background-color: #f8fafc; padding: 10px; margin-bottom: 15px; }
        .proforma-case-details h4 { font-family: Arial, sans-serif; font-size: 10pt; font-weight: bold; color: #1e3a8a; margin-bottom: 5px; margin-top: 0; border: none; padding: 0; }
        .proforma-case-details p { font-family: Arial, sans-serif; font-size: 9pt; margin-bottom: 2px; }
        .proforma-calculation-table th, .proforma-calculation-table td { padding: 8px 10px; border-bottom: 1px solid #cbd5e1; }
        .proforma-calculation-table th { background-color: #f1f5f9; }
        .proforma-subtotal-row td { font-weight: bold; border-top: 1px solid #000000; border-bottom: 1px solid #000000; background-color: #f8fafc; }
        .proforma-acconto-row td { background-color: #fef2f2; color: #b91c1c; }
        .proforma-final-total-row td { font-size: 11pt; font-weight: bold; border-top: 2px double #000000; border-bottom: 2px double #000000; background-color: #f0fdf4; color: #166534; }
        .proforma-tax-notes { border: 1px solid #cbd5e1; padding: 10px; margin-bottom: 15px; font-size: 8pt; font-style: italic; }
        .proforma-payment-instructions { border: 1px dashed #cbd5e1; padding: 10px; font-family: Arial, sans-serif; font-size: 9pt; }
        .proforma-payment-instructions h4 { color: #1e3a8a; border: none; padding: 0; margin-top: 0; }
    `;

    if (isIstanzaActive) {
        contentHtml = refs['istanza-preview'].innerHTML;
        docTitle = "Istanza Liquidazione CTU";
        let rgStr = state.nrg ? "_" + state.nrg.replace(/[^a-zA-Z0-9]/g, "-") : "";
        fileName = `istanza_liquidazione${rgStr}.doc`;
    } else if (isProformaActive) {
        contentHtml = refs['proforma-preview'].innerHTML;
        docTitle = "Proforma CTU";
        let rgStr = state.nrg ? "_" + state.nrg.replace(/[^a-zA-Z0-9]/g, "-") : "";
        fileName = `proforma_ctu${rgStr}.doc`;
    } else {
        alert("Seleziona la scheda 'Istanza Liquidazione' o 'Progetto Notula' per esportare il relativo documento in formato Word.");
        return;
    }

    // Costruisce la struttura HTML finale compatibile con Microsoft Word
    const docHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <title>${docTitle}</title>
            <!--[if gte mso 9]>
            <xml>
             <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
             </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
                ${cssStyles}
            </style>
        </head>
        <body>
            ${contentHtml}
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}

// Inizializzazione principale al caricamento della pagina
window.addEventListener('DOMContentLoaded', () => {
    initDOMRefs();
    caricaStato();
    loadTheme();
    popolaCampiAllAvvio();
    renderFormOnorario();
    renderFormSpesa();

    // Event listener per cambi form dinamici
    refs['onorario-tipo'].addEventListener('change', renderFormOnorario);
    refs['spesa-tipo'].addEventListener('change', renderFormSpesa);
    refs['quota-tipo'].addEventListener('change', handleQuotaChange);
    refs['quota-art15-tipo'].addEventListener('change', handleQuotaArt15Change);

    // Event listener per aggiunte
    refs['btn-add-onorario'].addEventListener('click', aggiungiOnorario);
    refs['btn-add-spesa'].addEventListener('click', aggiungiSpesa);

    // Event listener per globali
    refs['coeff-art52'].addEventListener('input', () => {
        refs['coeff-art52-val'].textContent = refs['coeff-art52'].value;
        syncGlobalInput('coeff-art52');
    });
    refs['quota-denominatore'].addEventListener('input', () => syncGlobalInput('quota-denominatore'));
    refs['quota-percentuale'].addEventListener('input', () => syncGlobalInput('quota-percentuale'));
    refs['quota-art15-manuale'].addEventListener('input', () => syncGlobalInput('quota-art15-manuale'));
    refs['percentuale-cassa'].addEventListener('input', () => syncGlobalInput('percentuale-cassa'));
    refs['applica-bollo'].addEventListener('change', () => syncGlobalInput('applica-bollo', true));
    refs['acconti'].addEventListener('input', () => syncGlobalInput('acconti'));

    // Event listener per anagrafiche
    const anagraficheIds = [
        'tribunale', 'giudice', 'nrg', 'attore', 'convenuto',
        'ctu-nome', 'partita-iva', 'codice-fiscale', 'indirizzo',
        'email', 'telefono', 'cassa-tipo', 'codice-destinatario', 'pec'
    ];
    anagraficheIds.forEach(id => {
        refs[id].addEventListener('input', () => syncAnagrafica(id));
    });

    // Reset button
    refs['btn-pulisci-dati'].addEventListener('click', pulisciTuttiDati);

    // Tab buttons
    refs['btn-tab-dati'].addEventListener('click', () => toggleTab('dati'));
    refs['btn-tab-istanza'].addEventListener('click', () => toggleTab('istanza'));
    refs['btn-tab-proforma'].addEventListener('click', () => toggleTab('proforma'));

    // Print button
    refs['btn-print'].addEventListener('click', printDocument);

    // Theme toggle
    refs['theme-toggle'].addEventListener('click', toggleTheme);

    // Esportazione e Importazione JSON
    refs['btn-esporta'].addEventListener('click', esportaDati);
    refs['btn-importa'].addEventListener('click', () => refs['import-file-input'].click());
    refs['import-file-input'].addEventListener('change', importaDati);

    // Esportazione Word
    refs['btn-word'].addEventListener('click', esportaWord);

    // Rendering iniziale
    aggiornaUI();
});
