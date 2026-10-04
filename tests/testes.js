// Testes automatizados (Node.js, sem bibliotecas). Executar: node tests/testes.js
const vm = require('vm'), fs = require('fs'), path = require('path');
const win = {}; const ctx = vm.createContext({ window: win });
for (const f of ['chamado', 'lista', 'fila', 'pilha', 'sistema', 'acesso'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), ctx);
const { Sistema } = win.Suporte;
let falhas = 0;
const t = (nome, fn) => { try { fn(); console.log('[OK]    ' + nome); } catch (e) { falhas++; console.log('[FALHA] ' + nome + ' -> ' + e.message); } };
const eq = (a, b) => { if (a !== b) throw new Error(`esperado ${b}, recebido ${a}`); };
const novo = (n = 3) => { const s = new Sistema(); for (let i = 1; i <= n; i++) s.abrir('Cliente ' + i, 'Problema ' + i, 2); return s; };

t('T01 cadastrar um chamado', () => { const s = new Sistema(); eq(s.abrir('Ana', 'PC', 3).ok, true); eq(s.cadastro.tamanho, 1); eq(s.buscar(1).status, 'ABERTO'); });
t('T02 cadastrar vários (IDs 1,2,3)', () => { const s = novo(); eq(s.cadastro.paraArray().map(c => c.id).join(), '1,2,3'); });
t('T03 buscar existente', () => eq(novo().buscar(2).cliente, 'Cliente 2'));
t('T04 buscar inexistente', () => eq(novo().buscar(99), null));
t('T05 dados inválidos não cadastram', () => { const s = new Sistema(); eq(s.abrir('', 'x', 2).ok, false); eq(s.abrir('a', 'b', 9).ok, false); eq(s.cadastro.tamanho, 0); eq(s.abrir('a', 'b', 1).chamado.id, 1); });
t('T06 inserir na fila', () => { const s = novo(); eq(s.enfileirar(1).ok, true); eq(s.enfileirar(2).ok, true); eq(s.fila.tamanho, 2); eq(s.buscar(1).status, 'AGUARDANDO'); });
t('T07 enfileirar inválido', () => { const s = novo(); eq(s.enfileirar(42).ok, false); s.enfileirar(1); eq(s.enfileirar(1).ok, false); });
t('T08 atender em ordem FIFO', () => { const s = novo(); [1, 2, 3].forEach(i => s.enfileirar(i)); eq([s.atender(), s.atender(), s.atender()].map(r => r.chamado.id).join(), '1,2,3'); });
t('T09 fila vazia', () => { const s = novo(); eq(s.atender().ok, false); eq(s.fila.consultarFrente(), null); eq(s.fila.desenfileirar(), null); });
t('T10 histórico (topo = último atendido)', () => { const s = novo(); s.enfileirar(1); s.enfileirar(2); s.atender(); s.atender(); eq(s.historico.consultarTopo().id, 2); eq(s.buscar(1).status, 'CONCLUIDO'); });
t('T11 desfazer (pop) reabre o chamado', () => { const s = novo(); s.enfileirar(1); s.enfileirar(2); s.atender(); s.atender(); const r = s.desfazer(); eq(r.chamado.id, 2); eq(r.chamado.status, 'ABERTO'); eq(s.historico.consultarTopo().id, 1); });
t('T12 pilha vazia', () => { const s = novo(); eq(s.desfazer().ok, false); eq(s.historico.consultarTopo(), null); });
t('T13 remover início, meio e fim', () => { const s = novo(); eq(s.remover(2).ok, true); eq(s.remover(1).ok, true); eq(s.remover(3).ok, true); eq(s.cadastro.vazia(), true); eq(s.abrir('D', 'd', 1).chamado.id, 4); });
t('T14 remover ID inexistente', () => eq(novo().remover(99).ok, false));
t('T15 remoção bloqueada se não está Aberto', () => { const s = novo(); s.enfileirar(1); eq(s.remover(1).ok, false); s.atender(); eq(s.remover(1).ok, false); s.desfazer(); eq(s.remover(1).ok, true); });
t('T16 lista: inserir depois de remover o último', () => { const s = novo(); s.remover(3); s.abrir('X', 'x', 1); eq(s.cadastro.paraArray().length, 3); eq(s.cadastro.fim.chamado.id, 4); });
t('T17 chamado reaberto volta ao trilho', () => { const s = novo(1); s.enfileirar(1); s.atender(); s.desfazer(); eq(s.enfileirar(1).ok, true); });
t('T18 login: credenciais certas e erradas', () => { eq(win.Suporte.autenticar('Ana', '1234').perfil, 'CLIENTE'); eq(win.Suporte.autenticar('ana', 'x'), null); });
t('T19 permissões: cliente não atende; TI não cria', () => { const { autenticar, pode } = win.Suporte; const c = autenticar('ana', '1234'), ti = autenticar('tecnico', 'ti2026'); eq(pode(c, 'abrir'), true); eq(pode(c, 'pegar'), false); eq(pode(ti, 'pegar'), true); eq(pode(ti, 'concluir'), true); eq(pode(ti, 'abrir'), false); eq(pode(null, 'abrir'), false); });
t('T20 cliente só vê e mexe nos próprios chamados', () => { const s = new Sistema(); s.abrir('Ana Souza', 'PC', 2, 'ana'); s.abrir('Bruno Lima', 'Net', 1, 'bruno'); eq(s.meusChamados('ana').length, 1); eq(s.enfileirar(2, 'ana').ok, false); eq(s.remover(2, 'ana').ok, false); eq(s.enfileirar(1, 'ana').ok, true); eq(s.posicao(1), 1); eq(s.posicao(2), 0); });
t('T21 técnico pega um por vez e só conclui confirmando', () => { const s = novo(); [1, 2, 3].forEach(i => s.enfileirar(i)); eq(s.pegar().chamado.id, 1); eq(s.buscar(1).status, 'EM_ATENDIMENTO'); eq(s.pegar().ok, false); eq(s.fila.tamanho, 2); eq(s.concluir('Trocou o cabo').ok, true); eq(s.buscar(1).solucao, 'Trocou o cabo'); eq(s.historico.consultarTopo().id, 1); eq(s.concluir().ok, false); eq(s.pegar().chamado.id, 2); });
t('T22 salvar e restaurar mantém fila, histórico e atendimento', () => { const s = novo(5); [1, 2, 3, 4].forEach(i => s.enfileirar(i)); s.atender(); s.atender(); s.pegar(); const r = Sistema.importar(JSON.parse(JSON.stringify(s.exportar()))); eq(r.fila.paraArray().map(c => c.id).join(), '4'); eq(r.historico.paraArray().map(c => c.id).join(), '2,1'); eq(r.emAtendimento.id, 3); eq(r.cadastro.tamanho, 5); eq(r.proximoId, 6); eq(r.abrir('N', 'n', 1).chamado.id, 6); });
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTODOS OS TESTES PASSARAM'); process.exit(falhas ? 1 : 0);
