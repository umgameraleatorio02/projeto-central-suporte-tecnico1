/* ui/detalhe.js - janela de detalhes do chamado: dados, anexo, linha do tempo e conversa. */
(function (g) {
  const { UI, anexoValido, pode } = g.Suporte;
  const { $, esc, num, dataHora, pill, pri, slaBadge, estrelas } = UI;

  function podeVer(c) { return c && pode(UI.sessao, 'detalhe') && (UI.sessao.perfil !== 'CLIENTE' || c.dono === UI.sessao.usuario); }

  UI.abrirDetalhe = function (id) {
    const c = UI.sis.buscar(id);
    if (!podeVer(c)) { UI.avisar('Chamado não encontrado.', true); return; }
    UI.detalheId = id;
    if (!$('dlg').open) $('dlg').showModal();
    UI.atualizarDetalhe();
  };

  UI.atualizarDetalhe = function () {
    const c = UI.sis.buscar(UI.detalheId);
    if (!podeVer(c)) { if ($('dlg').open) $('dlg').close(); return; }
    $('dlg-titulo').textContent = `Chamado nº ${num(c.id)}`;
    const fila = UI.sis.posicao(c.id);
    $('dlg-info').innerHTML = `<div class="det">
      <div><small>Status</small>${pill(c.status)}</div>
      <div><small>Importância</small>${pri(c.prioridade)}</div>
      <div><small>Categoria</small><b>${esc(c.categoria)}</b></div>
      <div><small>Prazo</small>${slaBadge(c)}</div>
      <div><small>Solicitante</small><b>${esc(c.cliente)}</b></div>
      <div><small>Técnico</small><b>${esc(c.tecnicoNome || (fila.fila ? 'Fila ' + fila.fila + ' · posição ' + fila.pos : '—'))}</b></div>
      <div><small>Aberto em</small><b>${dataHora(c.aberto)}</b></div>
      <div><small>Avaliação</small>${estrelas(c.nota)}</div>
    </div><p><b>Descrição:</b> ${esc(c.descricao)}</p>${c.solucao ? `<p><b>Solução:</b> ${esc(c.solucao)}</p>` : ''}`;
    const an = $('dlg-anexo'); an.innerHTML = '';
    if (c.anexo && anexoValido(c.anexo)) { const i = document.createElement('img'); i.className = 'anexo-img'; i.alt = 'Print anexado ao chamado'; i.src = c.anexo; an.appendChild(i); }
    const ol = $('dlg-linha'); ol.innerHTML = '';
    (c.linha || []).forEach((e) => {
      const li = document.createElement('li'); li.textContent = e.t;
      const s = document.createElement('small'); s.textContent = dataHora(e.q); li.appendChild(s); ol.appendChild(li);
    });
    const box = $('dlg-msgs'); const fim = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
    box.innerHTML = '';
    if (!(c.mensagens || []).length) { const p = document.createElement('p'); p.className = 'vz-vazio'; p.textContent = 'Nenhuma mensagem ainda.'; box.appendChild(p); }
    (c.mensagens || []).forEach((m) => {
      const d = document.createElement('div'); d.className = 'msg' + (m.de === UI.sessao.usuario ? ' minha' : '');
      d.textContent = m.t;
      const s = document.createElement('small'); s.textContent = `${m.nome} · ${dataHora(m.q)}`; d.appendChild(s); box.appendChild(d);
    });
    if (fim) box.scrollTop = box.scrollHeight;
    const aberta = c.status === 'AGUARDANDO' || c.status === 'EM_ATENDIMENTO';
    const permitido = pode(UI.sessao, 'conversar');
    $('dlg-form').hidden = !(aberta && permitido);
    $('dlg-aviso').textContent = !permitido ? 'Você tem acesso somente leitura a esta conversa.' : !aberta ? 'A conversa só fica aberta enquanto o chamado está na fila ou em atendimento.' : '';
  };

  UI.ligarDetalhe = function () {
    $('dlg-fechar').addEventListener('click', () => $('dlg').close());
    $('dlg').addEventListener('close', () => { UI.detalheId = null; });
    $('dlg').addEventListener('click', (e) => { if (e.target === $('dlg')) $('dlg').close(); });
    $('dlg-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const t = $('dlg-texto').value;
      const r = UI.agir('conversar', (s) => s.mensagem(UI.detalheId, UI.sessao, t));
      if (r && r.ok) $('dlg-texto').value = '';
    });
  };
})(window);
