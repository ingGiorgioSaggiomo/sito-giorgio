const {valutaRequisiti} = require('../ponte.js');

describe('valutaRequisiti', () => {
  const baseCtx = () => {
    const canvas = {clientWidth: 1000};
    const nodi = [
      {x:100, y:0, vincolo: true},
      {x:300, y:0},
      {x:600, y:0},
      {x:900, y:0, vincolo: true},
      {x:200, y:-100},
      {x:450, y:-100},
      {x:750, y:-100}
    ];
    const pianoPercorrenza = [
      {n1:nodi[0], n2:nodi[1]},
      {n1:nodi[1], n2:nodi[2]},
      {n1:nodi[2], n2:nodi[3]}
    ];
    const aste = [
      {n1:nodi[0], n2:nodi[4], tipo:'barra'},
      {n1:nodi[1], n2:nodi[4], tipo:'barra'},
      {n1:nodi[1], n2:nodi[5], tipo:'barra'},
      {n1:nodi[2], n2:nodi[5], tipo:'barra'},
      {n1:nodi[2], n2:nodi[6], tipo:'barra'},
      {n1:nodi[3], n2:nodi[6], tipo:'barra'}
    ];
    const vincoli = [];
    const checkDeterminacy = () => ({joints:0,val:0});
    const pathToSupport = () => true;
    return {pianoPercorrenza, nodi, aste, vincoli, canvas, checkDeterminacy, pathToSupport};
  };

  test('returns ok for valid bridge', () => {
    const res = valutaRequisiti(baseCtx());
    expect(res.ok).toBe(true);
    expect(res.classe).toBe('ok');
  });

  test('returns bad when right support is missing', () => {
    const ctx = baseCtx();
    ctx.nodi[3].vincolo = false; // remove right support
    const res = valutaRequisiti(ctx);
    expect(res.ok).toBe(false);
    expect(res.classe).toBe('bad');
  });
});
