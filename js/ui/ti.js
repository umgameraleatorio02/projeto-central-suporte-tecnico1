/* ui/ti.js - painel do técnico: pega um chamado por vez, confirma a resolução ou escalona. */
(function (g) {
  const { UI } = g.Suporte;
  const { esc, num, dataHora, dur, pill, pri, slaBadge, estrelas } = UI;
  let chaveAtend = null;

  function montar(el) {
    chaveAtend = null;
    el.innerHTML = `<h2 class="pg">Painel de atendimento</h2>
    <div class="kpis" id="k-ti"></div>
    <section class="painel atend" id="p-atend"></section>
    <section class="painel"><div class="cab"><h3>A resolver</h3><small>Nível 2 primeiro; depois a ordem de chegada</small></div>
      <div class="tabela"><table><thead><tr><th>#</th><th>Nº</th><th>Descrição</th><th>Categoria</th><th>Importância</th><th>Fila</th><th>Prazo</th><th></th></tr></thead><tbody id="t-fila"></tbody></table></div></section>
    <section class="painel"><h3>Equipe em atendimento agora</h3><div class="tabela"><table><thead><tr><th>Nº</th><th>Descrição</th><th>Técnico</th><th>Prazo</th><th></th></tr></thead><tbody id="t-equipe"></tbody></table></div></section>
    <section class="painel"><div class="cab"><h3>Já solucionados</h3><div class="acoes"><button id="b-desf" class="btn sec mini" type="button">Desfazer meu último registro</button><button id="b-csv" class="btn sec mini" type="button">Exportar CSV</button></div></div>
      ${UI.filtrosHTML('ft', { status: false })}
      <div class="tabela"><table><thead><tr><th>Nº</th><th>Descrição</th><th>Técnico</th><th>Solução</th><th>Concluído em</th><th>Prazo</th><th>Nota</th><th></th></tr></thead><tbody id="t-hist"></tbody></table></div></section>`;
    UI.ligarFiltros(el, 'ft', () => atualizar(el));
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const a = b.dataset.a, id = Number(b.dataset.id);
      if (a === 'det') UI.abrirDetalhe(id);
      else if (a === 'pegar') UI.agir('pegar', (s) => s.pegar(UI.sessao.usuario));
      else if (a === 'concluir') {
        const c = UI.sis.emAtendimentoDe(UI.sessao.usuario);
        if (c && confirm(`Confirmar que o chamado nº ${num(c.id)} foi resolvido?`)) UI.agir('concluir', (s) => s.concluir(el.querySelector('#a-sol').value, UI.sessao.usuario));
      } else if (a === 'escalar') {
        const m = el.querySelector('#a-mot').value;
        if (!m.trim()) { UI.avisar('Informe o motivo do escalonamento.', true); return; }
        UI.agir('escalar', (s) => s.escalar(m, UI.sessao.usuario));
      }
    });
    el.querySelector('#b-desf').addEventListener('click', () => { if (confirm('Desfazer o último registro do histórico? O chamado volta a ficar Aberto.')) UI.agir('desfazer', (s) => s.desfazer(UI.sessao.usuario)); });
    el.querySelector('#b-csv').addEventListener('click', () => {
      const l = [['Nº', 'Descrição', 'Categoria', 'Importância', 'Técnico', 'Solução', 'Concluído em', 'Prazo', 'Nota']];
      UI.sis.historico.paraArray().forEach((c) => l.push([num(c.id), c.descricao, c.categoria, g.Suporte.PRIORIDADE[c.prioridade], c.tecnicoNome, c.solucao || '', dataHora(c.concluidoEm), UI.sis.sla(c).estado === 'CUMPRIDO' ? 'Cumprido' : 'Violado', c.nota || '']));
      UI.baixarCSV('solucionados.csv', l); UI.sis.auditar(UI.sessao, 'exportar', 'CSV de solucionados'); UI.salvar();
    });
  }

  function atualizar(el) {
    const s = UI.sis, eu = UI.sessao;
    const u = s.usuario(eu.usuario), junior = u && u.nivel === 'JUNIOR';
    const meus = s.historico.paraArray().filter((c) => c.tecnico === eu.usuario);
    const notas = meus.filter((c) => c.nota).map((c) => c.nota);
    const prox = s.proximoPara(eu.usuario);
    el.querySelector('#k-ti').innerHTML = `
      <div class="kpi"><small>Aguardando</small><b>${s.fila.tamanho + s.filaN2.tamanho}</b></div>
      <div class="kpi"><small>Escalonados (nível 2)</small><b>${s.filaN2.tamanho}</b></div>
      <div class="kpi"><small>Meus solucionados</small><b>${meus.length}</b></div>
      <div class="kpi"><small>Minha satisfação</small><b>${notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) + ' ★' : '—'}</b></div>
      <div class="kpi larga"><small>Próximo para você</small><b>${prox ? `Nº ${num(prox.id)} · ${esc(prox.descricao)}` : 'Fila vazia'}</b></div>`;

    // painel "em atendimento": só é redesenhado quando muda o chamado, para não apagar o que está sendo digitado
    const atual = s.emAtendimentoDe(eu.usuario);
    const chave = atual ? atual.id : 'nenhum:' + (prox ? prox.id : 0);
    const pa = el.querySelector('#p-atend');
    if (chave !== chaveAtend) {
      chaveAtend = chave;
      if (!atual) {
        pa.innerHTML = `<h3>Em atendimento</h3><p class="vz-vazio">Você não está com nenhum chamado.</p><div class="acoes"><button class="btn" data-a="pegar" ${prox ? '' : 'disabled'}>Pegar próximo chamado</button></div>`;
      } else {
        pa.innerHTML = `<h3>Em atendimento · Nº ${num(atual.id)}</h3><div class="det"><div><small>Solicitante</small><b>${esc(atual.cliente)}</b></div><div><small>Categoria</small><b>${esc(atual.categoria)}</b></div><div><small>Importância</small>${pri(atual.prioridade)}</div><div><small>Prazo</small><span id="a-sla">${slaBadge(atual)}</span></div></div>
          <p>${esc(atual.descricao)}</p>
          <div class="fim"><label>Solução aplicada (opcional)<input id="a-sol" maxlength="100"></label><button class="btn" data-a="concluir">Confirmar resolução</button><button class="btn sec" data-a="det" data-id="${atual.id}">Detalhes e conversa</button></div>
          ${junior ? `<div class="fim"><label>Motivo para escalonar ao nível 2<input id="a-mot" maxlength="150"></label><button class="btn sec" data-a="escalar">Escalonar</button></div>` : ''}
          <p class="dica">Você só pode pegar outro chamado depois de confirmar a resolução${junior ? ' ou escalonar' : ''}.</p>`;
      }
    } else if (atual) { const sl = pa.querySelector('#a-sla'); if (sl) sl.innerHTML = slaBadge(atual); }

    const ordem = [...s.filaN2.paraArray(), ...s.fila.paraArray()];
    el.querySelector('#t-fila').innerHTML = ordem.length ? ordem.map((c, i) => `<tr class="${UI.destaque === c.id ? 'novo' : ''}"><td class="num">${i + 1}</td><td class="num">${num(c.id)}</td><td>${esc(c.descricao)}</td><td>${esc(c.categoria)}</td><td>${pri(c.prioridade)}</td><td>${c.nivel === 2 ? '<span class="badge b-az">Nível 2</span>' : 'Nível 1'}</td><td>${slaBadge(c)}</td><td><button class="btn sec mini" data-a="det" data-id="${c.id}">Detalhes</button></td></tr>`).join('') : '<tr><td class="v" colspan="8">Nenhum chamado aguardando.</td></tr>';

    const eq = s.todos().filter((c) => c.status === 'EM_ATENDIMENTO');
    el.querySelector('#t-equipe').innerHTML = eq.length ? eq.map((c) => `<tr><td class="num">${num(c.id)}</td><td>${esc(c.descricao)}</td><td>${esc(c.tecnicoNome)}</td><td>${slaBadge(c)}</td><td><button class="btn sec mini" data-a="det" data-id="${c.id}">Detalhes</button></td></tr>`).join('') : '<tr><td class="v" colspan="5">Ninguém atendendo agora.</td></tr>';

    const topo = s.historico.consultarTopo();
    el.querySelector('#b-desf').disabled = !(topo && topo.tecnico === eu.usuario);
    const hist = UI.filtrar(s.historico.paraArray(), el, 'ft');
    el.querySelector('#t-hist').innerHTML = hist.length ? hist.map((c) => `<tr class="${UI.destaque === c.id ? 'novo' : ''}"><td class="num">${num(c.id)}</td><td>${esc(c.descricao)}</td><td>${esc(c.tecnicoNome)}${c.tecnico === eu.usuario ? ' <small>(você)</small>' : ''}</td><td>${esc(c.solucao || '—')}</td><td>${dataHora(c.concluidoEm)}</td><td>${slaBadge(c)}</td><td>${estrelas(c.nota)}</td><td><button class="btn sec mini" data-a="det" data-id="${c.id}">Detalhes</button></td></tr>`).join('') : '<tr><td class="v" colspan="8">Nada solucionado ainda.</td></tr>';
  }
  UI.registrar('TI', { montar, atualizar });
})(window);
