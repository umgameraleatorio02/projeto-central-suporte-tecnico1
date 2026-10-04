/* app.js - interface: login, telas por perfil, salvamento e redesenho das estruturas. */
(function () {
  const { Sistema, STATUS, PRIORIDADE, num, autenticar, pode, USUARIOS_DEMO } = window.Suporte;
  const CHAVE = 'suporte-dados-v1';
  const $ = (id) => document.getElementById(id);
  let sis = carregar(), sessao = null, destaque = null, timer = null;

  // Estado salvo no navegador (localStorage): permite cliente e técnico em abas diferentes.
  function carregar() {
    try { const t = localStorage.getItem(CHAVE); if (t) return Sistema.importar(JSON.parse(t)); } catch (e) { /* dados ausentes ou inválidos: começa vazio */ }
    return new Sistema();
  }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(sis.exportar())); } catch (e) { /* sem armazenamento: segue só em memória */ } }

  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pri = (c) => `<span class="pr pr${c.prioridade}">${PRIORIDADE[c.prioridade]}</span>`;
  const pill = (c) => `<span class="pill s-${c.status}">${STATUS[c.status]}</span>`;
  const vazio = (n, txt) => `<tr><td class="v" colspan="${n}">${txt}</td></tr>`;
  const marca = (c) => (c.id === destaque ? ' class="novo"' : '');

  function avisar(r) {
    const el = $('aviso');
    el.textContent = r.msg;
    el.className = 'aviso on' + (r.ok ? '' : ' err');
    clearTimeout(timer);
    timer = setTimeout(() => { el.className = 'aviso'; }, 3200);
  }

  // Toda ação: confere a permissão, lê o estado mais recente (outra aba pode ter mudado), executa e salva.
  function agir(acao, fn) {
    if (!pode(sessao, acao)) return avisar({ ok: false, msg: 'Seu perfil não tem permissão para esta ação.' });
    sis = carregar();
    const r = fn();
    if (r.ok) salvar();
    destaque = r.ok && r.chamado ? r.chamado.id : null;
    render();
    avisar(r);
    return r;
  }

  function render() {
    if (!sessao) return;
    $('hora').textContent = 'Atualizado às ' + new Date().toLocaleTimeString('pt-BR');
    if (pode(sessao, 'verProprios')) {
      const meus = sis.meusChamados(sessao.usuario);
      $('t-meus').innerHTML = meus.length ? meus.map((c) => {
        const pos = sis.posicao(c.id), aberto = c.status === 'ABERTO';
        return `<tr${marca(c)}><td>${num(c.id)}</td><td>${esc(c.descricao)}${c.solucao ? `<br><small>Solução: ${esc(c.solucao)}</small>` : ''}</td><td>${pri(c)}</td><td>${pill(c)}</td>
          <td>${pos ? pos + 'º' : '-'}</td><td>${aberto ? `<button class="btn mini" data-a="enviar" data-id="${c.id}">Enviar ao suporte</button>
          <button class="btn mini perigo" data-a="cancelar" data-id="${c.id}">Cancelar</button>` : ''}</td></tr>`;
      }).join('') : vazio(6, 'Você ainda não abriu nenhum chamado.');
    }
    if (pode(sessao, 'verFila')) {
      const fila = sis.fila.paraArray(), hist = sis.historico.paraArray(), at = sis.emAtendimento;
      $('k-fila').textContent = fila.length;
      $('k-hist').textContent = hist.length;
      $('k-prox').textContent = fila.length ? `Nº ${num(fila[0].id)} · ${fila[0].cliente} · ${fila[0].descricao}` : 'Nenhum chamado na fila';
      $('atend').innerHTML = at ? `<div class="det"><div><small>Chamado</small><b>Nº ${num(at.id)}</b></div><div><small>Cliente</small><b>${esc(at.cliente)}</b></div>
          <div><small>Importância</small>${pri(at)}</div><div><small>Status</small>${pill(at)}</div></div>
        <p style="margin:0 0 14px"><small style="color:var(--mu)">Problema relatado</small><br>${esc(at.descricao)}</p>
        <div class="fim"><label>Solução aplicada (opcional)<input id="f-sol" maxlength="100" placeholder="Ex.: Troca da fonte de alimentação"></label>
        <button id="b-concluir" class="btn">Confirmar resolução</button></div>`
        : '<p class="vz">Nenhum chamado em atendimento. Pegue o próximo da fila.</p>';
      $('t-fila').innerHTML = fila.length ? fila.map((c, i) => `<tr${marca(c)}><td>${i + 1}º</td><td>${num(c.id)}</td><td>${esc(c.cliente)}</td><td>${esc(c.descricao)}</td><td>${pri(c)}</td></tr>`).join('')
                                          : vazio(5, 'Nenhum chamado aguardando atendimento.');
      $('t-hist').innerHTML = hist.length ? hist.map((c) => `<tr${marca(c)}><td>${num(c.id)}</td><td>${esc(c.cliente)}</td><td>${esc(c.descricao)}</td><td>${c.solucao ? esc(c.solucao) : '-'}</td><td>${pri(c)}</td></tr>`).join('')
                                          : vazio(5, 'Nenhum chamado solucionado ainda.');
      $('b-pegar').disabled = !!at || sis.fila.vazia();
      $('b-pegar').title = at ? 'Conclua o chamado em atendimento primeiro' : '';
      $('b-desfazer').disabled = sis.historico.vazia();
    }
  }

  function entrar(s) {
    sessao = s; destaque = null; sis = carregar();
    const ti = s.perfil === 'TI';
    $('login').hidden = true; $('app').hidden = false;
    $('v-cliente').hidden = ti; $('v-ti').hidden = !ti;
    $('avatar').textContent = s.nome.split(' ').map((p) => p[0]).slice(0, 2).join('');
    $('u-nome').textContent = s.nome;
    $('u-perfil').textContent = ti ? 'Técnico de TI' : 'Cliente';
    $('u-menu').textContent = ti ? 'Painel de atendimento' : 'Meus chamados';
    render();
  }

  $('demo').innerHTML = USUARIOS_DEMO.map((u) => `<tr><td>${u.usuario}</td><td>${u.senha}</td><td>${u.perfil === 'TI' ? 'Técnico de TI' : 'Cliente'}</td></tr>`).join('');
  // Enter no campo Usuário passa para a Senha (em vez de tentar entrar sem senha).
  $('l-user').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); $('l-pass').focus(); }
  });
  $('f-login').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!$('l-pass').value) { $('l-erro').textContent = ''; $('l-pass').focus(); return; }   // senha vazia: só leva o cursor para o campo
    const s = autenticar($('l-user').value, $('l-pass').value);
    if (!s) { $('l-erro').textContent = 'Usuário ou senha incorretos.'; return; }
    $('l-erro').textContent = ''; $('l-pass').value = '';
    entrar(s);
  });
  $('b-reset').addEventListener('click', () => {
    if (!confirm('Apagar todos os chamados salvos?')) return;
    try { localStorage.removeItem(CHAVE); } catch (e) { /* ignora */ }
    sis = new Sistema();
    $('l-erro').textContent = 'Dados apagados.';
  });
  $('b-sair').addEventListener('click', () => { sessao = null; $('app').hidden = true; $('login').hidden = false; $('l-user').focus(); });
  $('b-atualizar').addEventListener('click', () => { sis = carregar(); destaque = null; render(); avisar({ ok: true, msg: 'Lista atualizada.' }); });

  $('f-abrir').addEventListener('submit', (e) => {
    e.preventDefault();
    const marcada = document.querySelector('input[name=pri]:checked');
    if (!$('f-desc').value.trim()) { $('f-desc').focus(); return avisar({ ok: false, msg: 'Descreva o problema do chamado.' }); }
    if (!marcada) { document.querySelector('input[name=pri]').focus(); return avisar({ ok: false, msg: 'Selecione a importância do chamado.' }); }
    const r = agir('abrir', () => sis.abrir(sessao.nome, $('f-desc').value, marcada.value, sessao.usuario));
    if (r && r.ok) {
      $('f-desc').value = '';
      document.querySelectorAll('input[name=pri]').forEach((o) => { o.checked = false; });   // a importância volta a ficar sem seleção
      $('f-desc').focus();
    }
  });
  $('t-meus').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-a]');
    if (!b) return;
    const id = Number(b.dataset.id);
    agir(b.dataset.a, () => (b.dataset.a === 'enviar' ? sis.enfileirar(id, sessao.usuario) : sis.remover(id, sessao.usuario)));
  });
  $('b-pegar').addEventListener('click', () => agir('pegar', () => sis.pegar()));
  $('b-desfazer').addEventListener('click', () => agir('desfazer', () => sis.desfazer()));
  // O botão "Confirmar resolução" é criado dinamicamente: usamos o clique no bloco "Em atendimento".
  $('atend').addEventListener('click', (e) => {
    if (!e.target.closest('#b-concluir')) return;
    const c = sis.emAtendimento;
    if (c && !confirm(`Confirmar que o chamado nº ${num(c.id)} foi resolvido?`)) return;
    const sol = $('f-sol') ? $('f-sol').value : '';
    agir('concluir', () => sis.concluir(sol));
  });
  render();
})();
