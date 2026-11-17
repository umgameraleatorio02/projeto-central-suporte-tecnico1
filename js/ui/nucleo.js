/* ui/nucleo.js - estado da interface, utilitários, notificações, tema e atualização automática. */
(function (g) {
  const { Sistema, pode, MENUS, PERFIL_NOME, PRIORIDADE, CATEGORIAS } = g.Suporte;
  const CHAVE = 'suporte-dados-v2', CHAVE_TEMA = 'suporte-tema', CHAVE_SESSAO = 'suporte-sessao';
  const $ = (id) => document.getElementById(id);
  const UI = { $, sis: null, sessao: null, destaque: null, sub: null, detalheId: null, views: {}, CHAVE };
  let montado = false, ultimoTotalNotif = null;

  /* ---------- armazenamento (localStorage) ---------- */
  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { return null; } }
  function recarregar() {
    let s = null;
    const d = ler();
    if (d && d.v === 2) { try { s = Sistema.importar(d); } catch (e) { s = null; } }
    UI.sis = s || Sistema.comDemonstracao();
    if (UI.sis.verificarSLA() || !s) salvar();
    return UI.sis;
  }
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(UI.sis.exportar())); return true; }
    catch (e) { avisar('Não foi possível salvar no navegador (armazenamento cheio ou bloqueado).', true); return false; }
  }

  /* ---------- formatação ---------- */
  const esc = (t) => String(t === undefined || t === null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (id) => String(id).padStart(3, '0');
  function dur(ms) {
    if (ms === null || ms === undefined) return '—';
    const m = Math.round(Math.abs(ms) / 60000);
    if (m < 1) return '< 1 min';
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h' + (m % 60 ? ' ' + (m % 60) + 'min' : '');
    const d = Math.floor(h / 24);
    return d + 'd' + (h % 24 ? ' ' + (h % 24) + 'h' : '');
  }
  const dataHora = (t) => (t ? new Date(t).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
  const pri = (p) => `<span class="pr pr${p}">${esc(PRIORIDADE[p])}</span>`;
  const STATUS_NOME = { ABERTO: 'Aberto', AGUARDANDO: 'Na fila', EM_ATENDIMENTO: 'Em atendimento', CONCLUIDO: 'Concluído' };
  const pill = (s) => `<span class="pill s-${s}">${STATUS_NOME[s]}</span>`;
  function slaBadge(c) {
    const r = UI.sis.sla(c);
    switch (r.estado) {
      case 'NO_PRAZO': return `<span class="badge b-ok">✓ No prazo · resta ${dur(r.restanteMs)}</span>`;
      case 'ATENCAO': return `<span class="badge b-wr">! Atenção · resta ${dur(r.restanteMs)}</span>`;
      case 'ATRASADO': return `<span class="badge b-er">✕ Atrasado há ${dur(r.restanteMs)}</span>`;
      case 'CUMPRIDO': return '<span class="badge b-ok">✓ Prazo cumprido</span>';
      case 'VIOLADO': return '<span class="badge b-er">✕ Prazo violado</span>';
      default: return '<span class="badge b-neu">Aguardando envio</span>';
    }
  }
  const estrelas = (n) => (n ? `<span class="est" title="${n} de 5">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>` : '—');

  let tAviso = null;
  function avisar(msg, erro) {
    const a = $('aviso');
    a.textContent = msg; a.className = 'aviso on' + (erro ? ' err' : '');
    clearTimeout(tAviso); tAviso = setTimeout(() => { a.className = 'aviso'; }, 3600);
  }

  /* ---------- executar uma ação do sistema (checa permissão, recarrega, executa, audita, salva) ---------- */
  function agir(acao, fn) {
    if (!pode(UI.sessao, acao)) { avisar('Seu perfil não tem permissão para isto.', true); return null; }
    recarregar();
    const r = fn(UI.sis);
    if (r.ok) {
      UI.sis.auditar(UI.sessao, acao, r.msg);
      salvar();
      if (r.chamado) UI.destaque = r.chamado.id;
    }
    render();
    avisar(r.msg, !r.ok);
    return r;
  }

  /* ---------- filtros de busca ---------- */
  function filtrosHTML(p, op) {
    op = op || {};
    const opt = (arr) => arr.map(([v, n]) => `<option value="${v}">${n}</option>`).join('');
    return `<div class="filtros" role="search">
      <input type="search" id="${p}-q" placeholder="Buscar por nº, descrição ou nome" aria-label="Buscar">
      ${op.status === false ? '' : `<select id="${p}-st" aria-label="Status"><option value="">Todos os status</option>${opt(Object.entries(STATUS_NOME))}</select>`}
      <select id="${p}-ca" aria-label="Categoria"><option value="">Todas as categorias</option>${opt(CATEGORIAS.map((c) => [c, c]))}</select>
      <select id="${p}-pr" aria-label="Importância"><option value="">Qualquer importância</option>${opt([[3, 'Alta'], [2, 'Média'], [1, 'Baixa']])}</select>
    </div>`;
  }
  function ligarFiltros(raiz, p, cb) {
    ['q', 'st', 'ca', 'pr'].forEach((k) => { const e = raiz.querySelector('#' + p + '-' + k); if (e) { e.addEventListener('input', cb); e.addEventListener('change', cb); } });
  }
  function filtrar(lista, raiz, p) {
    const v = (k) => { const e = raiz.querySelector('#' + p + '-' + k); return e ? e.value : ''; };
    const q = v('q').trim().toLowerCase(), st = v('st'), ca = v('ca'), pr = v('pr');
    return lista.filter((c) => (!st || c.status === st) && (!ca || c.categoria === ca) && (!pr || String(c.prioridade) === pr) &&
      (!q || [num(c.id), String(c.id), c.descricao, c.cliente, c.tecnicoNome || ''].some((t) => String(t).toLowerCase().includes(q))));
  }

  /* ---------- CSV ---------- */
  function baixarCSV(nome, linhas) {
    const cel = (v) => { let s = String(v === undefined || v === null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const txt = '﻿' + linhas.map((l) => l.map(cel).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------- tema ---------- */
  function temaAtual() { return document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
  function aplicarTema(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(CHAVE_TEMA, t); } catch (e) { /* sem armazenamento: vale só nesta sessão */ }
    const nome = t === 'dark' ? '☀ Tema claro' : '☾ Tema escuro';
    $('b-tema').textContent = nome; $('b-tema-login').textContent = nome;
    if (UI.sessao) render();       // gráficos usam variáveis CSS, mas o redesenho garante consistência
  }
  function iniciarTema() {
    let t = null; try { t = localStorage.getItem(CHAVE_TEMA); } catch (e) { /* ignora */ }
    if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
    aplicarTema(temaAtual());
  }

  /* ---------- notificações ---------- */
  function sino() {
    const lista = UI.sis.notificacoesDe(UI.sessao.usuario);
    const novas = lista.filter((n) => !n.lida).length;
    const cont = $('n-cont'); cont.textContent = novas > 99 ? '99+' : novas; cont.hidden = novas === 0;
    $('b-sino').setAttribute('aria-label', novas ? `Notificações: ${novas} novas` : 'Notificações');
    const box = $('lista-notif');
    box.innerHTML = '';
    if (!lista.length) { const p = document.createElement('p'); p.className = 'vz-vazio'; p.textContent = 'Nenhuma notificação.'; box.appendChild(p); }
    lista.slice(0, 30).forEach((n) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'notif-item' + (n.lida ? '' : ' nova');
      b.textContent = n.msg;
      const s = document.createElement('small'); s.textContent = dataHora(n.q); b.appendChild(s);
      b.addEventListener('click', () => { if (n.chamado && UI.abrirDetalhe) { $('painel-notif').hidden = true; UI.abrirDetalhe(n.chamado); } });
      box.appendChild(b);
    });
    // aviso quando chegam notificações novas durante o uso
    const total = novas;
    if (ultimoTotalNotif !== null && total > ultimoTotalNotif) avisar(lista[0].msg);
    ultimoTotalNotif = total;
  }

  /* ---------- desenho ---------- */
  function render() {
    if (!UI.sessao) return;
    $('hora').textContent = new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
    sino();
    const v = UI.views[UI.sessao.perfil];
    if (v && montado) v.atualizar(UI.raiz, UI.sub);
    if (UI.detalheId !== null && UI.atualizarDetalhe) UI.atualizarDetalhe();
  }
  function navegar(sub) {
    const itens = MENUS[UI.sessao.perfil];
    UI.sub = sub || itens[0].id;
    UI.destaque = null;
    document.querySelectorAll('#menu .item').forEach((b) => { b.classList.toggle('ativo', b.dataset.id === UI.sub); if (b.dataset.id === UI.sub) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    const area = $('conteudo'); area.innerHTML = '';
    const el = UI.raiz = document.createElement('div'); area.appendChild(el);   // contêiner novo a cada tela: não acumula ouvintes de eventos
    UI.views[UI.sessao.perfil].montar(el, UI.sub);
    montado = true;
    render();
  }
  function registrar(perfil, view) { UI.views[perfil] = view; }

  /* ---------- sessão ---------- */
  function entrar(usuario) {
    UI.sessao = usuario; montado = false; ultimoTotalNotif = null;
    try { sessionStorage.setItem(CHAVE_SESSAO, usuario.usuario); } catch (e) { /* ignora */ }
    $('login').hidden = true; $('app').hidden = false;
    $('avatar').textContent = usuario.nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    $('u-nome').textContent = usuario.nome;
    $('u-perfil').textContent = PERFIL_NOME[usuario.perfil] + (usuario.nivel ? ' · Nível ' + (usuario.nivel === 'SENIOR' ? '2 (sênior)' : '1 (júnior)') : '');
    const menu = $('menu'); menu.innerHTML = '';
    MENUS[usuario.perfil].forEach((m) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'item'; b.dataset.id = m.id; b.textContent = m.nome;
      b.addEventListener('click', () => navegar(m.id)); menu.appendChild(b);
    });
    $('painel-notif').hidden = true;
    navegar();
  }
  function sair() {
    UI.sessao = null; montado = false; UI.detalheId = null;
    try { sessionStorage.removeItem(CHAVE_SESSAO); } catch (e) { /* ignora */ }
    if ($('dlg').open) $('dlg').close();
    $('app').hidden = true; $('login').hidden = false; $('conteudo').innerHTML = '';
    $('l-pass').value = ''; $('l-erro').textContent = ''; $('l-user').focus();
  }
  function restaurarSessao() {
    let login = null; try { login = sessionStorage.getItem(CHAVE_SESSAO); } catch (e) { /* ignora */ }
    if (!login) return;
    recarregar();
    const u = UI.sis.usuario(login);
    if (u && u.ativo) entrar({ usuario: u.usuario, nome: u.nome, perfil: u.perfil, nivel: u.nivel });
  }

  /* ---------- atualização (botão, outra aba, a cada 30 s) ---------- */
  function atualizar() { recarregar(); if (UI.sessao) { const u = UI.sis.usuario(UI.sessao.usuario); if (!u || !u.ativo) { sair(); return; } render(); } }
  function ligarGeral() {
    $('b-tema').addEventListener('click', () => aplicarTema(temaAtual() === 'dark' ? 'light' : 'dark'));
    $('b-tema-login').addEventListener('click', () => aplicarTema(temaAtual() === 'dark' ? 'light' : 'dark'));
    $('b-atualizar').addEventListener('click', () => { atualizar(); avisar('Lista atualizada.'); });
    $('b-sino').addEventListener('click', () => { const p = $('painel-notif'); p.hidden = !p.hidden; $('b-sino').setAttribute('aria-expanded', String(!p.hidden)); });
    $('b-lidas').addEventListener('click', () => { recarregar(); UI.sis.marcarLidas(UI.sessao.usuario); salvar(); ultimoTotalNotif = 0; render(); });
    document.addEventListener('click', (e) => { if (!e.target.closest('.sino-wrap')) $('painel-notif').hidden = true; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('painel-notif').hidden = true; });
    g.addEventListener('storage', (e) => { if (e.key === CHAVE && UI.sessao) atualizar(); });
    setInterval(() => { if (UI.sessao && !document.hidden) atualizar(); }, 30000);
  }

  Object.assign(UI, { recarregar, salvar, esc, num, dur, dataHora, pri, pill, slaBadge, estrelas, avisar, agir, filtrosHTML, ligarFiltros, filtrar,
    baixarCSV, registrar, navegar, render, entrar, sair, restaurarSessao, iniciarTema, ligarGeral, STATUS_NOME });
  g.Suporte.UI = UI;
})(window);
