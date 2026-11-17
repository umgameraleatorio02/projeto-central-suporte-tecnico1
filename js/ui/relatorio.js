/* ui/relatorio.js - relatório para impressão / "Salvar como PDF" (o CSS de impressão mostra só esta seção). */
(function (g) {
  const { UI, PRIORIDADE } = g.Suporte;
  const { esc, num, dur, dataHora } = UI;
  const SLA_TXT = { NA: 'Aguardando envio', NO_PRAZO: 'No prazo', ATENCAO: 'Atenção', ATRASADO: 'Atrasado', CUMPRIDO: 'Cumprido', VIOLADO: 'Violado' };

  UI.gerarRelatorio = function (lista, periodo, ind) {
    const k = (t, v) => `<div class="r-kpi">${esc(t)}<b>${esc(v)}</b></div>`;
    const tab = (cab, linhas) => `<table><thead><tr>${cab.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${linhas.map((l) => `<tr>${l.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const MAX = 150;
    document.getElementById('relatorio').innerHTML = `
      <h1>Relatório de Suporte Técnico</h1>
      <p>Período: <b>${esc(periodo)}</b> · Gerado em ${dataHora(Date.now())} por ${esc(UI.sessao.nome)}</p>
      <h2>Indicadores</h2>
      <div class="r-kpis">${k('Chamados no período', ind.total)}${k('Concluídos', ind.concluidos)}${k('Em andamento', ind.andamento)}
        ${k('Prazos cumpridos', ind.slaPct === null ? '—' : ind.slaPct + '%')}${k('Atrasados agora', ind.atrasados)}${k('Tempo médio de resolução', ind.tempoMedioMs === null ? '—' : dur(ind.tempoMedioMs))}
        ${k('Satisfação média', ind.notaMedia === null ? '—' : ind.notaMedia.toFixed(1) + ' de 5')}</div>
      <h2>Por categoria e importância</h2>
      ${tab(['Categoria', 'Chamados'], Object.entries(ind.porCategoria))}
      <p></p>${tab(['Importância', 'Chamados'], [3, 2, 1].map((n) => [PRIORIDADE[n], ind.porImportancia[n]]))}
      <h2>Desempenho dos técnicos</h2>
      ${tab(['Técnico', 'Nível', 'Resolvidos', 'Tempo médio', 'Satisfação'], ind.tecnicos.map((t) => [t.nome, t.nivel === 'SENIOR' ? 'Nível 2' : 'Nível 1', t.resolvidos, dur(t.tempoMedioMs), t.notaMedia === null ? '—' : t.notaMedia.toFixed(1)]))}
      <h2>Chamados${lista.length > MAX ? ` (últimos ${MAX} de ${lista.length})` : ''}</h2>
      ${tab(['Nº', 'Descrição', 'Categoria', 'Importância', 'Status', 'Técnico', 'Prazo'], lista.slice(-MAX).reverse().map((c) => [num(c.id), c.descricao, c.categoria, PRIORIDADE[c.prioridade], UI.STATUS_NOME[c.status], c.tecnicoNome || '—', SLA_TXT[UI.sis.sla(c).estado]]))}`;
    setTimeout(() => g.print(), 50);
  };
})(window);
