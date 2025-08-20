function esisteTriangolazionePerSegmento(seg, aste, nodi){
  const hasBar = (a,b) => aste.some(s => s.tipo !== "piano" && ((s.n1===a && s.n2===b)||(s.n1===b && s.n2===a)));
  const collinear = (A,B,C)=> Math.abs((B.y-A.y)*(C.x-B.x) - (B.x-A.x)*(C.y-B.y)) < 1e-3;
  for (const p of nodi){
    if (p===seg.n1 || p===seg.n2) continue;
    const c1 = hasBar(p, seg.n1);
    const c2 = hasBar(p, seg.n2);
    if ((c1 && c2) && !collinear(seg.n1, seg.n2, p)) return true;
  }
  return false;
}

function valutaRequisiti(ctx){
  const {
    pianoPercorrenza,
    nodi,
    aste,
    vincoli,
    canvas,
    checkDeterminacy,
    pathToSupport
  } = ctx || (typeof globalThis !== "undefined" ? globalThis : {});
  const messaggi = [];
  if (pianoPercorrenza.length === 0) return {ok:false, testo:"Piano: nessun tratto (partirà il collasso)", classe:"bad", messaggi:["Nessun tratto di piano"]};

  const degree = new Map(); const allNodes = new Set();
  pianoPercorrenza.forEach(seg => { allNodes.add(seg.n1); allNodes.add(seg.n2); degree.set(seg.n1,(degree.get(seg.n1)||0)+1); degree.set(seg.n2,(degree.get(seg.n2)||0)+1); });
  const branching = [...degree.values()].some(d => d > 2);
  const adj = new Map(); allNodes.forEach(n => adj.set(n, []));
  pianoPercorrenza.forEach(seg => { adj.get(seg.n1).push(seg.n2); adj.get(seg.n2).push(seg.n1); });
  const start = [...allNodes][0]; const visited = new Set();
  (function dfs(n){ if (visited.has(n)) return; visited.add(n); adj.get(n).forEach(m=>dfs(m)); })(start);
  const connected = visited.size === allNodes.size;

  const lenOK = pianoPercorrenza.length >= 3;
  if (!connected) messaggi.push("Piano non connesso");
  if (branching) messaggi.push("Ramificazioni sul piano");
  if (!lenOK) messaggi.push("Meno di 3 tratti di piano");

  const trianglesMissing = pianoPercorrenza.filter(seg => !esisteTriangolazionePerSegmento(seg, aste, nodi));
  if (trianglesMissing.length) messaggi.push("Manca triangolazione su uno o più tratti");

  const W = canvas.clientWidth;
  const toLeft  = (n)=> n.x <= W*0.18 + 2;
  const toRight = (n)=> n.x >= W*0.82 - 2;
  const supportsLeft  = nodi.some(n => n.vincolo && toLeft(n));
  const supportsRight = nodi.some(n => n.vincolo && toRight(n));
  if (!supportsLeft)  messaggi.push("Nessun vincolo a terra lato sinistro");
  if (!supportsRight) messaggi.push("Nessun vincolo a terra lato destro");
  const det = checkDeterminacy();
  if(det.joints>0){
    if(det.val<0) messaggi.push("Meccanismo globale (b+r < 2j)");
    if(det.val>0) messaggi.push("Iperstaticità globale (b+r > 2j)");
    const uniquePts = Array.from(new Set(vincoli.map(v=>`${Math.round(v.x)}:${Math.round(v.y)}`)));
    if(uniquePts.length<2) messaggi.push("Vincoli troppo concentrati");
  }
  const nodesOnDeck = nodi.filter(n => pianoPercorrenza.some(s=>s.n1===n||s.n2===n));
  const leftOK  = nodesOnDeck.every(n=>pathToSupport(n,"L"));
  const rightOK = nodesOnDeck.every(n=>pathToSupport(n,"R"));
  if(!leftOK||!rightOK) messaggi.push("Il piano non ha ancoraggi ridondanti a entrambi i lati");

  const ok = connected && !branching && lenOK && trianglesMissing.length===0 && supportsLeft && supportsRight;

  let testo, classe;
  if (ok) { testo = "Piano: CONTINUO e STABILIZZATO – pronto all'avvio"; classe = "ok"; }
  else { testo = "Piano: requisiti mancanti – la simulazione causerà il collasso"; classe = "bad"; }

  return {ok, testo, classe, messaggi};
}

if (typeof module !== "undefined") {
  module.exports = {valutaRequisiti};
}
