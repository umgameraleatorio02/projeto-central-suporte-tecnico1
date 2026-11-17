// Testes automatizados (Node.js, sem bibliotecas). Executar: node tests/testes.js
const vm = require('vm'), fs = require('fs'), path = require('path');
const win = {}; const ctx = vm.createContext({ window: win });
for (const f of ['chamado', 'lista', 'fila', 'pilha', 'sistema', 'demo', 'acesso'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), ctx);
const { Sistema, pode } = win.Suporte;
let falhas = 0, total = 0;
const t = (nome, fn) => { total++; try { fn(); console.log('[OK]    ' + nome); } catch (e) { falhas++; console.log('[FALHA] ' + nome + ' -> ' + e.message); } };
const eq = (a, b) => { if (a !== b) throw new Error(`esperado ${b}, recebido ${a}`); };
const T1 = 'ryan.vitor@gmail.com', T2 = 'marina.alves@hotmail.com';                   // T1 = nível 1 (júnior), T2 = nível 2 (sênior)
const novo = (n = 3) => { const s = new Sistema(); for (let i = 1; i <= n; i++) s.abrir('Cliente ' + i, 'Problema ' + i, 2, 'ana.souza@gmail.com', 'Rede'); return s; };
const fila = (s, ...ids) => ids.forEach((i) => s.enfileirar(i));
const envelhecer = (c, min) => { c.enviadoEm -= min * 60000; };   // simula a passagem do tempo

/* ---- cadastro, busca, fila e pilha (núcleo da disciplina) ---- */
t('T01 cadastrar um chamado', () => { const s = new Sistema(); const r = s.abrir('Ana', 'PC', 3, 'ana.souza@gmail.com', 'Hardware'); eq(r.ok, true); eq(s.cadastro.tamanho, 1); eq(s.buscar(1).status, 'ABERTO'); eq(s.buscar(1).linha.length, 1); });
t('T02 cadastrar vários (IDs 1,2,3)', () => eq(novo().cadastro.paraArray().map((c) => c.id).join(), '1,2,3'));
t('T03 buscar existente / inexistente', () => { const s = novo(); eq(s.buscar(2).cliente, 'Cliente 2'); eq(s.buscar(99), null); eq(s.buscar(-5), null); });
t('T04 dados inválidos não cadastram', () => { const s = new Sistema(); eq(s.abrir('', 'x', 2, 'ana.souza@gmail.com', 'Rede').ok, false); eq(s.abrir('a', 'b', 9, 'ana.souza@gmail.com', 'Rede').ok, false); eq(s.abrir('a', 'b', 1, 'ana.souza@gmail.com', 'Vírus').ok, false); eq(s.cadastro.tamanho, 0); eq(s.abrir('a', 'b', 1, 'ana.souza@gmail.com', 'Rede').chamado.id, 1); });
t('T05 anexo: só imagem válida', () => { const s = new Sistema(); eq(s.abrir('a', 'b', 1, 'ana.souza@gmail.com', 'Rede', 'data:text/html;base64,AAAA').ok, false); const r = s.abrir('a', 'b', 1, 'ana.souza@gmail.com', 'Rede', 'data:image/jpeg;base64,/9j/4AAQ'); eq(r.ok, true); eq(typeof r.chamado.anexo, 'string'); });
t('T06 fila: enfileirar, ordem FIFO e estados', () => { const s = novo(); fila(s, 1, 2, 3); eq(s.fila.tamanho, 3); eq(s.buscar(1).status, 'AGUARDANDO'); eq([s.atender(T1), s.atender(T1), s.atender(T1)].map((r) => r.chamado.id).join(), '1,2,3'); });
t('T07 enfileirar inválido', () => { const s = novo(); eq(s.enfileirar(42).ok, false); s.enfileirar(1); eq(s.enfileirar(1).ok, false); eq(s.enfileirar(2, 'bruno.lima@outlook.com').ok, false); eq(s.fila.tamanho, 1); });
t('T08 fila e pilha vazias', () => { const s = novo(); eq(s.pegar(T1).ok, false); eq(s.fila.consultarFrente(), null); eq(s.desfazer(T1).ok, false); eq(s.historico.consultarTopo(), null); });
t('T09 histórico (LIFO) e desfazer reabre', () => { const s = novo(); fila(s, 1, 2); s.atender(T1); s.atender(T1); eq(s.historico.consultarTopo().id, 2); const r = s.desfazer(T1); eq(r.chamado.id, 2); eq(r.chamado.status, 'ABERTO'); eq(s.historico.consultarTopo().id, 1); });
t('T10 remover início, meio e fim; IDs não reaproveitados', () => { const s = novo(); eq(s.remover(2).ok, true); eq(s.remover(1).ok, true); eq(s.remover(3).ok, true); eq(s.cadastro.vazia(), true); eq(s.abrir('D', 'd', 1, 'ana.souza@gmail.com', 'Rede').chamado.id, 4); });
t('T11 remover inexistente / bloqueado por status / de outro dono', () => { const s = novo(); eq(s.remover(99).ok, false); eq(s.remover(1, 'bruno.lima@outlook.com').ok, false); s.enfileirar(1); eq(s.remover(1).ok, false); s.atender(T1); eq(s.remover(1).ok, false); s.desfazer(T1); eq(s.remover(1, 'ana.souza@gmail.com').ok, true); });
t('T12 lista: inserir depois de remover o último', () => { const s = novo(); s.remover(3); s.abrir('X', 'x', 1, 'ana.souza@gmail.com', 'Rede'); eq(s.cadastro.paraArray().length, 3); eq(s.cadastro.fim.dado.id, 4); });
t('T13 reaberto volta à fila e recomeça o ciclo', () => { const s = novo(1); fila(s, 1); s.atender(T1); s.avaliar(1, 'ana.souza@gmail.com', 5); s.desfazer(T1); const c = s.buscar(1); eq(c.nota, undefined); eq(c.concluidoEm, undefined); eq(c.tecnico, undefined); eq(s.enfileirar(1).ok, true); });
t('T14 transições de status', () => { const { criarChamado, mudarStatus } = win.Suporte; const c = criarChamado(1, 'Ana', 'd', 1, 'ana.souza@gmail.com', 'Rede'); eq(mudarStatus(c, 'CONCLUIDO'), false); eq(mudarStatus(c, 'AGUARDANDO'), true); eq(mudarStatus(c, 'ABERTO'), false); eq(mudarStatus(c, 'EM_ATENDIMENTO'), true); eq(mudarStatus(c, 'AGUARDANDO'), true); eq(mudarStatus(c, 'EM_ATENDIMENTO'), true); eq(mudarStatus(c, 'CONCLUIDO'), true); eq(mudarStatus(c, 'ABERTO'), true); eq(mudarStatus(null, 'ABERTO'), false); });

/* ---- vários técnicos ---- */
t('T15 técnico pega um por vez e só conclui confirmando', () => { const s = novo(); fila(s, 1, 2, 3); eq(s.pegar(T1).chamado.id, 1); eq(s.buscar(1).tecnico, T1); eq(s.pegar(T1).ok, false); eq(s.fila.tamanho, 2); eq(s.concluir('Trocou o cabo', T1).ok, true); eq(s.buscar(1).solucao, 'Trocou o cabo'); eq(s.concluir('x', T1).ok, false); eq(s.pegar(T1).chamado.id, 2); });
t('T16 dois técnicos trabalham em paralelo', () => { const s = novo(); fila(s, 1, 2); eq(s.pegar(T1).chamado.id, 1); eq(s.pegar(T2).chamado.id, 2); eq(s.concluir('a', T2).ok, true); eq(s.emAtendimentoDe(T1).id, 1); eq(s.emAtendimentoDe(T2), null); eq(s.buscar(2).tecnicoNome, 'Marina Alves'); });
t('T17 só técnicos ativos pegam chamados; cliente não', () => { const s = novo(); fila(s, 1); eq(s.pegar('ana.souza@gmail.com').ok, false); eq(s.pegar('naoexiste').ok, false); });
t('T18 desfazer: cada técnico só desfaz o próprio registro', () => { const s = novo(); fila(s, 1); s.atender(T1); eq(s.desfazer(T2).ok, false); eq(s.historico.tamanho, 1); eq(s.desfazer(T1).ok, true); });

/* ---- escalonamento ---- */
t('T19 escalonar: júnior devolve à fila de nível 2; só sênior atende', () => {
  const s = novo(2); fila(s, 1, 2); s.pegar(T1);
  eq(s.escalar('', T1).ok, false);                                  // motivo obrigatório
  eq(s.escalar('Falha de hardware', T2).ok, false);                 // sênior não escala
  const r = s.escalar('Falha de hardware', T1); eq(r.ok, true);
  const c = s.buscar(1); eq(c.status, 'AGUARDANDO'); eq(c.nivel, 2); eq(c.tecnico, undefined); eq(s.filaN2.tamanho, 1);
  eq(s.posicao(1).fila, 'N2'); eq(s.posicao(2).fila, 'N1');
  eq(s.proximoPara(T2).id, 1); eq(s.proximoPara(T1).id, 2);         // sênior vê o N2 primeiro; júnior só o N1
  eq(s.pegar(T2).chamado.id, 1); eq(s.buscar(1).tecnico, T2);
  eq(s.pegar(T1).chamado.id, 2);
});
t('T20 júnior não consegue pegar quando só há escalonados', () => { const s = novo(1); fila(s, 1); s.pegar(T1); s.escalar('x', T1); eq(s.pegar(T1).ok, false); eq(s.filaN2.tamanho, 1); });

/* ---- SLA ---- */
t('T21 SLA: no prazo, atenção, atrasado, cumprido e violado', () => {
  const s = new Sistema(); s.abrir('A', 'a', 3, 'ana.souza@gmail.com', 'Rede'); s.abrir('B', 'b', 3, 'ana.souza@gmail.com', 'Rede'); fila(s, 1, 2);
  const c = s.buscar(1); eq(s.sla(c).estado, 'NO_PRAZO'); eq(s.sla(s.buscar(2)).prazoMs, 240 * 60000);
  envelhecer(c, 200); eq(s.sla(c).estado, 'ATENCAO');               // restam 40 min de 240 (< 25%)
  envelhecer(c, 60); eq(s.sla(c).estado, 'ATRASADO');
  s.pegar(T1); s.concluir('', T1); eq(s.sla(c).estado, 'VIOLADO');
  s.pegar(T1); s.concluir('', T1); eq(s.sla(s.buscar(2)).estado, 'CUMPRIDO');
  eq(s.sla(win.Suporte.criarChamado(9, 'x', 'y', 1, 'ana.souza@gmail.com', 'Rede')).estado, 'NA');
});
t('T22 verificarSLA avisa uma única vez (gestor e técnico)', () => {
  const s = new Sistema(); s.abrir('A', 'a', 3, 'ana.souza@gmail.com', 'Rede'); fila(s, 1); s.pegar(T1);
  eq(s.verificarSLA(), false); envelhecer(s.buscar(1), 300);
  eq(s.verificarSLA(), true); eq(s.verificarSLA(), false);
  eq(s.notificacoesDe('paula.ribeiro@outlook.com').filter((n) => n.msg.includes('Prazo')).length, 1);
  eq(s.notificacoesDe(T1).filter((n) => n.msg.includes('Prazo')).length, 1);
});
t('T23 configurar SLA (prazos válidos e inválidos)', () => { const s = new Sistema(); eq(s.configurarSLA({ 1: 60, 2: 30, 3: 10 }).ok, true); eq(s.config.sla[3], 10); eq(s.configurarSLA({ 1: 0, 2: 30, 3: 10 }).ok, false); eq(s.configurarSLA({ 1: 'a', 2: 30, 3: 10 }).ok, false); eq(s.config.sla[3], 10); });

/* ---- conversa, linha do tempo, notificações, avaliação ---- */
t('T24 conversa: permissões e estados', () => {
  const s = novo(); const ana = { usuario: 'ana.souza@gmail.com', nome: 'Ana', perfil: 'CLIENTE' }, bruno = { usuario: 'bruno.lima@outlook.com', nome: 'B', perfil: 'CLIENTE' }, ti = { usuario: T1, nome: 'C', perfil: 'TI' }, ge = { usuario: 'paula.ribeiro@outlook.com', nome: 'P', perfil: 'GESTOR' };
  eq(s.mensagem(1, ana, 'oi').ok, false);                           // ABERTO: sem conversa
  fila(s, 1); eq(s.mensagem(1, ana, 'oi').ok, true); eq(s.mensagem(1, bruno, 'oi').ok, false); eq(s.mensagem(1, ge, 'oi').ok, false); eq(s.mensagem(1, ana, '   ').ok, false);
  s.pegar(T1); eq(s.mensagem(1, ti, 'Reinicie o PC').ok, true); eq(s.buscar(1).mensagens.length, 2);
  eq(s.notificacoesDe('ana.souza@gmail.com').filter((n) => n.msg.includes('mensagem')).length, 1);
  s.concluir('', T1); eq(s.mensagem(1, ana, 'obrigada').ok, false);
});
t('T25 linha do tempo registra o ciclo', () => { const s = novo(1); fila(s, 1); s.pegar(T1); s.concluir('Trocou a fonte', T1); const l = s.buscar(1).linha.map((e) => e.t).join(' | '); eq(l.includes('aberto por'), true); eq(l.includes('Enviado ao suporte'), true); eq(l.includes('Pego por Ryan'), true); eq(l.includes('Trocou a fonte'), true); });
t('T26 notificações: envio, leitura e destinatários', () => { const s = novo(1); fila(s, 1); eq(s.notificacoesDe(T1).length, 1); eq(s.notificacoesDe(T2).length, 1); eq(s.notificacoesDe('ana.souza@gmail.com').length, 0); s.pegar(T1); eq(s.notificacoesDe('ana.souza@gmail.com').length, 1); s.marcarLidas('ana.souza@gmail.com'); eq(s.notificacoesDe('ana.souza@gmail.com')[0].lida, true); eq(s.notificacoesDe(T2)[0].lida, false); });
t('T27 avaliação: dono, concluído, uma vez, nota 1-5', () => { const s = novo(1); eq(s.avaliar(1, 'ana.souza@gmail.com', 5).ok, false); fila(s, 1); s.atender(T1); eq(s.avaliar(1, 'bruno.lima@outlook.com', 5).ok, false); eq(s.avaliar(1, 'ana.souza@gmail.com', 9).ok, false); eq(s.avaliar(1, 'ana.souza@gmail.com', 4).ok, true); eq(s.avaliar(1, 'ana.souza@gmail.com', 5).ok, false); });
t('T28 indicadores e desempenho por técnico', () => {
  const s = novo(3); fila(s, 1, 2, 3); s.pegar(T1); s.concluir('', T1); s.pegar(T2); s.concluir('', T2); s.avaliar(1, 'ana.souza@gmail.com', 5); s.avaliar(2, 'ana.souza@gmail.com', 3);
  const i = s.indicadores(s.todos());
  eq(i.total, 3); eq(i.concluidos, 2); eq(i.andamento, 1); eq(i.slaPct, 100); eq(i.notaMedia, 4); eq(i.porCategoria.Rede, 3); eq(i.porStatus.CONCLUIDO, 2);
  const c1 = i.tecnicos.find((x) => x.usuario === T1); eq(c1.resolvidos, 1); eq(c1.notaMedia, 5);
  eq(i.tecnicos.find((x) => x.usuario === T2).notaMedia, 3);
});

/* ---- usuários, login e permissões ---- */
t('T29 login: correto, errado e conta desativada', () => { const s = new Sistema(); eq(s.autenticar('Ana.Souza@Gmail.com', '1234').usuario.perfil, 'CLIENTE'); eq(s.autenticar('ana.souza@gmail.com', 'x').ok, false); eq(s.autenticar('naoexiste@x.com', '1').ok, false); s.editarUsuario('bruno.lima@outlook.com', { ativo: false }, 'paula.ribeiro@outlook.com'); eq(s.autenticar('bruno.lima@outlook.com', '1234').ok, false); });
t('T30 cadastro de usuários: validações', () => { const s = new Sistema(); eq(s.criarUsuario({ usuario: 'Jo', nome: 'João', senha: 'abcd', perfil: 'TI', nivel: 'JUNIOR' }).ok, false); eq(s.criarUsuario({ usuario: 'joao.s@gmail.com', nome: 'João', senha: 'abcd', perfil: 'TI', nivel: 'JUNIOR' }).ok, true); eq(s.criarUsuario({ usuario: 'joao.s@gmail.com', nome: 'J', senha: 'abcd', perfil: 'CLIENTE' }).ok, false); eq(s.criarUsuario({ usuario: 'novo1@gmail.com', nome: 'N', senha: '12', perfil: 'CLIENTE' }).ok, false); eq(s.criarUsuario({ usuario: 'novo2@gmail.com', nome: 'N', senha: '1234', perfil: 'TI' }).ok, false); eq(s.autenticar('joao.s@gmail.com', 'abcd').ok, true); });
t('T31 editar usuário: proteções', () => {
  const s = new Sistema();
  eq(s.editarUsuario('paula.ribeiro@outlook.com', { ativo: false }, 'paula.ribeiro@outlook.com').ok, false);       // não desativa a si mesmo
  eq(s.editarUsuario('paula.ribeiro@outlook.com', { perfil: 'CLIENTE' }, 'outro').ok, false);   // último gestor ativo
  s.abrir('A', 'a', 1, 'ana.souza@gmail.com', 'Rede'); fila(s, 1); s.pegar(T1);
  eq(s.editarUsuario(T1, { ativo: false }, 'paula.ribeiro@outlook.com').ok, false);             // técnico com chamado em atendimento
  eq(s.editarUsuario('ana.souza@gmail.com', { nome: 'Ana M.', senha: 'novaSenha' }, 'paula.ribeiro@outlook.com').ok, true); eq(s.autenticar('ana.souza@gmail.com', 'novaSenha').ok, true); eq(s.usuario('ana.souza@gmail.com').nome, 'Ana M.');
});
t('T32 permissões por perfil', () => {
  const c = { perfil: 'CLIENTE' }, ti = { perfil: 'TI' }, ge = { perfil: 'GESTOR' };
  eq(pode(c, 'abrir'), true); eq(pode(c, 'pegar'), false); eq(pode(ti, 'abrir'), false); eq(pode(ti, 'pegar'), true); eq(pode(ti, 'escalar'), true);
  eq(pode(ge, 'usuarios'), true); eq(pode(ge, 'pegar'), false); eq(pode(ge, 'abrir'), false); eq(pode(ti, 'usuarios'), false); eq(pode(null, 'abrir'), false);
});
t('T33 auditoria e limite de registros', () => { const s = new Sistema(); s.auditar({ usuario: 'ana.souza@gmail.com', perfil: 'CLIENTE' }, 'abrir', 'x'); eq(s.auditoria.tamanho, 1); for (let i = 0; i < 600; i++) s.auditar({ usuario: 'a', perfil: 'TI' }, 'x', String(i)); eq(s.auditoria.tamanho, 500); eq(s.auditoria.paraArray()[499].detalhe, '599'); });

/* ---- salvar e restaurar ---- */
t('T34 salvar e restaurar mantém tudo', () => {
  const s = novo(6); fila(s, 1, 2, 3, 4, 5); s.atender(T1); s.atender(T1); s.pegar(T1); s.escalar('x', T1); s.pegar(T2);
  s.criarUsuario({ usuario: 'novo@hotmail.com', nome: 'Novo', senha: 'abcd', perfil: 'CLIENTE' }); s.configurarSLA({ 1: 100, 2: 50, 3: 20 }); s.auditar({ usuario: 'a', perfil: 'TI' }, 'x', 'y');
  const r = Sistema.importar(JSON.parse(JSON.stringify(s.exportar())));
  eq(r.fila.paraArray().map((c) => c.id).join(), '4,5'); eq(r.filaN2.tamanho, 0); eq(r.historico.paraArray().map((c) => c.id).join(), '2,1');
  eq(r.emAtendimentoDe(T2).id, 3); eq(r.cadastro.tamanho, 6); eq(r.proximoId, 7); eq(r.config.sla[3], 20);
  eq(r.autenticar('novo@hotmail.com', 'abcd').ok, true); eq(r.auditoria.tamanho, 1); eq(r.notificacoes.tamanho, s.notificacoes.tamanho);
  eq(r.abrir('N', 'n', 1, 'ana.souza@gmail.com', 'Rede').chamado.id, 7);
});
t('T35 importar dados antigos sem usuários recria as contas iniciais', () => { const r = Sistema.importar({ proximoId: 1, chamados: [] }); eq(r.autenticar('paula.ribeiro@outlook.com', 'gestor2026').ok, true); eq(r.usuarios.tamanho, 5); });
t('T36 dados de demonstração: consistentes e com movimento', () => {
  const s = Sistema.comDemonstracao(), c = s.todos(), n = (st) => c.filter((x) => x.status === st).length;
  eq(c.length, 21); eq(n('CONCLUIDO'), 13); eq(n('EM_ATENDIMENTO'), 2); eq(n('AGUARDANDO'), 4); eq(n('ABERTO'), 2);
  eq(s.historico.tamanho, 13); eq(s.fila.tamanho, 3); eq(s.filaN2.tamanho, 1);                     // invariantes: fila/pilha <=> status
  c.filter((x) => x.status === 'AGUARDANDO').forEach((x) => eq(s.posicao(x.id).fila !== null, true));
  eq(c.filter((x) => (x.mensagens || []).length > 0).length >= 8, true);                           // há conversas
  eq(s.indicadores(c).atrasados >= 2, true); eq(s.indicadores(c).slaPct !== null, true);          // há prazos estourados e % calculado
  eq(s.auditoria.tamanho > 40, true); eq(s.emAtendimentoDe(T1).status, 'EM_ATENDIMENTO'); eq(s.emAtendimentoDe(T2).status, 'EM_ATENDIMENTO');
  eq(Sistema.importar(JSON.parse(JSON.stringify(s.exportar()))).cadastro.tamanho, 21);            // salva e restaura
});

console.log(falhas ? `\n${falhas} FALHA(S) em ${total}` : `\nTODOS OS ${total} TESTES PASSARAM`); process.exit(falhas ? 1 : 0);
