/* ui/gestor.js - telas do gestor: visão geral (indicadores e gráficos), chamados, usuários, configurações e auditoria. */
(function (g) {
  const { UI, PRIORIDADE, PERFIL_NOME } = g.Suporte;
  const { esc, num, dataHora, dur, pill, pri, slaBadge, estrelas } = UI;
  const DIA = 86400000;
  let assinatura = null, editando = null;

  const inicioDia = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const fmtDia = (t) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  /* ---------- período ---------- */
  function periodo(el) {
    const v = el.querySelector('#g-per').value, agora = Date.now();
    if (v === 'tudo') return { de: 0, ate: Infinity, texto: 'Todo o período' };
    if (v === 'pers') {
      const a = el.querySelector('#g-de').value, b = el.querySelector('#g-ate').value;
      const de = a ? new Date(a + 'T00:00:00').getTime() : 0, ate = b ? new Date(b + 'T23:59:59').getTime() : Infinity;
      return { de, ate, texto: `${a ? new Date(a + 'T00:00:00').toLocaleDateString('pt-BR') : 'início'} a ${b ? new Date(b + 'T00:00:00').toLocaleDateString('pt-BR') : 'hoje'}` };
    }
    return { de: inicioDia(agora - (Number(v) - 1) * DIA), ate: Infinity, texto: `Últimos ${v} dias` };
  }

  // baldes por dia (até 14 dias) ou por semana
  function baldes(lista, p) {
    const aberturas = lista.map((c) => c.aberto);
    const ini = inicioDia(p.de > 0 ? p.de : (aberturas.length ? Math.min(...aberturas) : Date.now()));
    const fim = inicioDia(Math.min(p.ate, Date.now()));
    const dias = Math.max(1, Math.round((fim - ini) / DIA) + 1), passo = dias <= 14 ? 1 : 7;
    let n = Math.ceil(dias / passo); n = Math.min(n, 26);
    const comeco = fim - (n * passo - 1) * DIA;
    const rot = [], a = [], b = [];
    for (let i = 0; i < n; i++) {
      const x = comeco + i * passo * DIA, y = x + passo * DIA;
      rot.push(passo === 1 ? fmtDia(x) : fmtDia(x) + '+');
      a.push(lista.filter((c) => c.aberto >= x && c.aberto < y).length);
      b.push(lista.filter((c) => c.concluidoEm && c.concluidoEm >= x && c.concluidoEm < y).length);
    }
    return { rot, a, b, passo };
  }

  function visao(el) {
    const s = UI.sis, p = periodo(el);
    const lista = s.todos().filter((c) => c.aberto >= p.de && c.aberto <= p.ate);
    const ind = s.indicadores(lista);
    const sig = JSON.stringify([el.querySelector('#g-per').value, p.de, p.ate, ind, lista.map((c) => c.id + c.status)]);
    el.querySelector('#g-tit').textContent = p.texto;
    if (sig === assinatura) return;
    assinatura = sig;
    const k = (t, v, cls) => `<div class="kpi ${cls || ''}"><small>${t}</small><b>${v}</b></div>`;
    el.querySelector('#g-kpis').innerHTML =
      k('Prazos cumpridos', ind.slaPct === null ? '—' : ind.slaPct + '%', 'hero') + k('Atrasados agora', ind.atrasados, ind.atrasados ? 'alerta' : '') +
      k('Chamados no período', ind.total) + k('Concluídos', ind.concluidos) + k('Em andamento', ind.andamento) +
      k('Tempo médio de resolução', ind.tempoMedioMs === null ? '—' : dur(ind.tempoMedioMs)) + k('Satisfação média', ind.notaMedia === null ? '—' : ind.notaMedia.toFixed(1) + ' ★');
    const b = baldes(lista, p), graf = el.querySelector('#g-graf');
    graf.innerHTML = '';
    graf.appendChild(UI.colunas2(b.passo === 1 ? 'Chamados por dia' : 'Chamados por semana', b.rot, { nome: 'Abertos', valores: b.a }, { nome: 'Concluídos', valores: b.b }));
    graf.appendChild(UI.barras('Por categoria', Object.entries(ind.porCategoria).map(([nome, valor]) => ({ nome, valor }))));
    graf.appendChild(UI.barras('Por importância', [3, 2, 1].map((n) => ({ nome: PRIORIDADE[n], valor: ind.porImportancia[n] }))));
    graf.appendChild(UI.barras('Por status', Object.entries(ind.porStatus).map(([k2, valor]) => ({ nome: UI.STATUS_NOME[k2], valor }))));
    el.querySelector('#t-tec').innerHTML = ind.tecnicos.length ? ind.tecnicos.map((t) => `<tr><td>${esc(t.nome)}${t.ativo ? '' : ' <small>(inativo)</small>'}</td><td>${t.nivel === 'SENIOR' ? 'Nível 2' : 'Nível 1'}</td><td class="num">${t.resolvidos}</td><td class="num">${dur(t.tempoMedioMs)}</td><td>${t.notaMedia === null ? '—' : t.notaMedia.toFixed(1) + ' ★'}</td><td>${t.emAtendimento ? '<span class="badge b-az">Atendendo</span>' : '<span class="badge b-neu">Livre</span>'}</td></tr>`).join('') : '<tr><td class="v" colspan="6">Sem técnicos.</td></tr>';
    el.__lista = lista; el.__p = p; el.__ind = ind;
  }

  function montarVisao(el) {
    assinatura = null;
    el.innerHTML = `<h2 class="pg">Visão geral</h2>
    <section class="painel"><div class="cab"><h3 id="g-tit"></h3><div class="acoes"><button id="g-rel" class="btn" type="button">Gerar relatório (PDF)</button><button id="g-csv" class="btn sec" type="button">Exportar CSV</button></div></div>
      <div class="grade2"><label>Período<select id="g-per"><option value="7">Últimos 7 dias</option><option value="30" selected>Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="tudo">Tudo</option><option value="pers">Personalizado</option></select></label>
      <label id="l-de" hidden>De<input type="date" id="g-de"></label><label id="l-ate" hidden>Até<input type="date" id="g-ate"></label></div></section>
    <div class="kpis" id="g-kpis"></div><div class="viz-grid" id="g-graf"></div>
    <section class="painel"><h3>Desempenho dos técnicos</h3><div class="tabela"><table><thead><tr><th>Técnico</th><th>Nível</th><th>Resolvidos</th><th>Tempo médio</th><th>Satisfação</th><th>Agora</th></tr></thead><tbody id="t-tec"></tbody></table></div></section>`;
    const tudo = () => visao(el);
    el.querySelector('#g-per').addEventListener('change', (e) => { const pers = e.target.value === 'pers'; el.querySelector('#l-de').hidden = !pers; el.querySelector('#l-ate').hidden = !pers; tudo(); });
    el.querySelector('#g-de').addEventListener('change', tudo); el.querySelector('#g-ate').addEventListener('change', tudo);
    el.querySelector('#g-rel').addEventListener('click', () => { UI.recarregar(); visao(el); UI.gerarRelatorio(el.__lista, el.__p.texto, el.__ind); UI.sis.auditar(UI.sessao, 'relatorio', 'Relatório em PDF: ' + el.__p.texto); UI.salvar(); });
    el.querySelector('#g-csv').addEventListener('click', () => {
      const l = [['Nº', 'Descrição', 'Solicitante', 'Categoria', 'Importância', 'Status', 'Técnico', 'Aberto em', 'Concluído em', 'Prazo', 'Nota']];
      el.__lista.forEach((c) => l.push([num(c.id), c.descricao, c.cliente, c.categoria, PRIORIDADE[c.prioridade], UI.STATUS_NOME[c.status], c.tecnicoNome || '', dataHora(c.aberto), dataHora(c.concluidoEm), UI.sis.sla(c).estado, c.nota || '']));
      UI.baixarCSV('chamados.csv', l); UI.sis.auditar(UI.sessao, 'exportar', 'CSV de chamados'); UI.salvar();
    });
  }

  /* ---------- todos os chamados ---------- */
  function montarChamados(el) {
    el.innerHTML = `<h2 class="pg">Todos os chamados</h2><section class="painel">${UI.filtrosHTML('gc')}<div class="tabela"><table><thead><tr><th>Nº</th><th>Descrição</th><th>Solicitante</th><th>Categoria</th><th>Importância</th><th>Status</th><th>Técnico</th><th>Prazo</th><th></th></tr></thead><tbody id="t-todos"></tbody></table></div></section>`;
    UI.ligarFiltros(el, 'gc', () => atualizarChamados(el));
    el.addEventListener('click', (e) => { const b = e.target.closest('button[data-id]'); if (b) UI.abrirDetalhe(Number(b.dataset.id)); });
  }
  function atualizarChamados(el) {
    const l = UI.filtrar(UI.sis.todos().reverse(), el, 'gc');
    el.querySelector('#t-todos').innerHTML = l.length ? l.map((c) => `<tr><td class="num">${num(c.id)}</td><td>${esc(c.descricao)}</td><td>${esc(c.cliente)}</td><td>${esc(c.categoria)}</td><td>${pri(c.prioridade)}</td><td>${pill(c.status)}</td><td>${esc(c.tecnicoNome || '—')}</td><td>${slaBadge(c)}</td><td><button class="btn sec mini" data-id="${c.id}">Detalhes</button></td></tr>`).join('') : '<tr><td class="v" colspan="9">Nenhum chamado.</td></tr>';
  }

  /* ---------- usuários ---------- */
  function montarUsuarios(el) {
    editando = null;
    el.innerHTML = `<h2 class="pg">Usuários</h2>
    <form id="f-user" class="painel" novalidate><h3 id="u-tit">Novo usuário</h3>
      <div class="grade2"><label>E-mail (usado para entrar)<input id="u-login" maxlength="60" autocomplete="off" placeholder="nome@gmail.com"></label><label>Nome completo<input id="u-nome-f" maxlength="50" autocomplete="off"></label>
      <label>Senha<input id="u-senha" type="password" autocomplete="new-password" placeholder=""></label>
      <label>Perfil<select id="u-perfil-f"><option value="CLIENTE">Cliente</option><option value="TI">Técnico de TI</option><option value="GESTOR">Gestor</option></select></label>
      <label id="l-nivel" hidden>Nível<select id="u-nivel"><option value="JUNIOR">Nível 1 (júnior)</option><option value="SENIOR">Nível 2 (sênior)</option></select></label></div>
      <div class="acoes" style="margin-top:14px"><button class="btn" type="submit" id="u-ok">Criar usuário</button><button class="btn sec" type="button" id="u-cancel" hidden>Cancelar edição</button></div><p id="u-erro" class="erro" role="alert"></p></form>
    <section class="painel"><div class="tabela"><table><thead><tr><th>E-mail</th><th>Nome</th><th>Perfil</th><th>Situação</th><th></th></tr></thead><tbody id="t-users"></tbody></table></div></section>`;
    const $$ = (s) => el.querySelector(s);
    const nivelVis = () => { $$('#l-nivel').hidden = $$('#u-perfil-f').value !== 'TI'; };
    const limpar = () => { editando = null; $$('#f-user').reset(); $$('#u-login').readOnly = false; $$('#u-tit').textContent = 'Novo usuário'; $$('#u-ok').textContent = 'Criar usuário'; $$('#u-cancel').hidden = true; $$('#u-erro').textContent = ''; nivelVis(); };
    $$('#u-perfil-f').addEventListener('change', nivelVis);
    $$('#u-cancel').addEventListener('click', limpar);
    $$('#f-user').addEventListener('submit', (e) => {
      e.preventDefault();
      const d = { usuario: $$('#u-login').value, nome: $$('#u-nome-f').value, senha: $$('#u-senha').value, perfil: $$('#u-perfil-f').value, nivel: $$('#u-nivel').value };
      const r = UI.agir('usuarios', (s) => (editando ? s.editarUsuario(editando, d, UI.sessao.usuario) : s.criarUsuario(d)));
      $$('#u-erro').textContent = r && !r.ok ? r.msg : '';
      if (r && r.ok) limpar();
    });
    $$('#t-users').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const login = b.dataset.l, u = UI.sis.usuario(login); if (!u) return;
      if (b.dataset.a === 'ed') {
        editando = login; $$('#u-login').value = login; $$('#u-login').readOnly = true; $$('#u-nome-f').value = u.nome; $$('#u-senha').value = '';
        $$('#u-perfil-f').value = u.perfil; if (u.nivel) $$('#u-nivel').value = u.nivel; nivelVis();
        $$('#u-tit').textContent = 'Editar ' + login + ' (senha em branco mantém a atual)'; $$('#u-ok').textContent = 'Salvar alterações'; $$('#u-cancel').hidden = false; $$('#u-nome-f').focus();
      } else if (b.dataset.a === 'at') {
        const r = UI.agir('usuarios', (s) => s.editarUsuario(login, { ativo: !u.ativo }, UI.sessao.usuario));
        if (r && !r.ok) $$('#u-erro').textContent = r.msg;
      }
    });
  }
  function atualizarUsuarios(el) {
    el.querySelector('#t-users').innerHTML = UI.sis.usuarios.paraArray().map((u) => `<tr><td>${esc(u.usuario)}</td><td>${esc(u.nome)}</td><td>${PERFIL_NOME[u.perfil]}${u.nivel ? ' · ' + (u.nivel === 'SENIOR' ? 'Nível 2' : 'Nível 1') : ''}</td><td>${u.ativo ? '<span class="badge b-ok">✓ Ativo</span>' : '<span class="badge b-neu">Inativo</span>'}</td><td><div class="acoes"><button class="btn sec mini" data-a="ed" data-l="${esc(u.usuario)}">Editar</button><button class="btn sec mini" data-a="at" data-l="${esc(u.usuario)}">${u.ativo ? 'Desativar' : 'Ativar'}</button></div></td></tr>`).join('');
  }

  /* ---------- configurações (SLA) ---------- */
  function montarConfig(el) {
    const c = UI.sis.config.sla;
    el.innerHTML = `<h2 class="pg">Configurações</h2><form id="f-sla" class="painel" novalidate><h3>Prazos de atendimento (em minutos)</h3>
      <p class="dica">O prazo conta a partir do momento em que o chamado é enviado ao suporte.</p>
      <div class="grade2"><label>Importância Alta<input id="s3" type="number" min="1" max="10080" value="${c[3]}"></label><label>Importância Média<input id="s2" type="number" min="1" max="10080" value="${c[2]}"></label><label>Importância Baixa<input id="s1" type="number" min="1" max="10080" value="${c[1]}"></label></div>
      <div class="acoes" style="margin-top:14px"><button class="btn" type="submit">Salvar prazos</button></div><p id="s-erro" class="erro" role="alert"></p></form>`;
    el.querySelector('#f-sla').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = { 1: el.querySelector('#s1').value, 2: el.querySelector('#s2').value, 3: el.querySelector('#s3').value };
      const r = UI.agir('config', (s) => s.configurarSLA(v));
      el.querySelector('#s-erro').textContent = r && !r.ok ? r.msg : '';
    });
  }

  /* ---------- auditoria ---------- */
  function montarAuditoria(el) {
    el.innerHTML = `<h2 class="pg">Registro de auditoria</h2><section class="painel"><div class="cab"><div class="filtros" style="margin:0;flex:1"><input type="search" id="au-q" placeholder="Filtrar por usuário, ação ou detalhe" aria-label="Filtrar"></div><button id="au-csv" class="btn sec" type="button">Exportar CSV</button></div>
      <div class="tabela"><table><thead><tr><th>Data e hora</th><th>Usuário</th><th>Perfil</th><th>Ação</th><th>Detalhe</th></tr></thead><tbody id="t-aud"></tbody></table></div><p class="dica">Guarda os últimos 500 registros.</p></section>`;
    el.querySelector('#au-q').addEventListener('input', () => atualizarAuditoria(el));
    el.querySelector('#au-csv').addEventListener('click', () => {
      UI.baixarCSV('auditoria.csv', [['Data e hora', 'Usuário', 'Perfil', 'Ação', 'Detalhe'], ...UI.sis.auditoria.paraArray().reverse().map((a) => [dataHora(a.q), a.usuario, a.perfil, a.acao, a.detalhe])]);
    });
  }
  function atualizarAuditoria(el) {
    const q = el.querySelector('#au-q').value.trim().toLowerCase();
    const l = UI.sis.auditoria.paraArray().reverse().filter((a) => !q || [a.usuario, a.acao, a.detalhe, a.perfil].some((t) => String(t).toLowerCase().includes(q))).slice(0, 200);
    el.querySelector('#t-aud').innerHTML = l.length ? l.map((a) => `<tr><td class="num">${dataHora(a.q)}</td><td>${esc(a.usuario)}</td><td>${PERFIL_NOME[a.perfil] || ''}</td><td>${esc(a.acao)}</td><td>${esc(a.detalhe)}</td></tr>`).join('') : '<tr><td class="v" colspan="5">Nenhum registro.</td></tr>';
  }

  const M = { visao: [montarVisao, visao], chamados: [montarChamados, atualizarChamados], usuarios: [montarUsuarios, atualizarUsuarios], config: [montarConfig, () => {}], auditoria: [montarAuditoria, atualizarAuditoria] };
  UI.registrar('GESTOR', { montar: (el, sub) => M[sub][0](el), atualizar: (el, sub) => M[sub][1](el) });
})(window);
