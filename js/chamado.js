/* chamado.js - TAD Chamado: dados + máquina de estados.
 * ABERTO -> AGUARDANDO -> EM_ATENDIMENTO -> CONCLUIDO -> (desfazer) ABERTO */
(function (g) {
  const STATUS = { ABERTO: 'Aberto', AGUARDANDO: 'Aguardando', EM_ATENDIMENTO: 'Em atendimento', CONCLUIDO: 'Concluído' };
  const PRIORIDADE = { 1: 'Baixa', 2: 'Média', 3: 'Alta' };
  const TRANSICOES = { ABERTO: ['AGUARDANDO'], AGUARDANDO: ['EM_ATENDIMENTO'], EM_ATENDIMENTO: ['CONCLUIDO'], CONCLUIDO: ['ABERTO'] };

  // Cria um chamado (objeto novo na memória). Retorna null se os dados forem inválidos.
  function criarChamado(id, cliente, descricao, prioridade, dono) {
    cliente = String(cliente || '').trim().slice(0, 50);
    descricao = String(descricao || '').trim().slice(0, 100);
    if (!cliente || !descricao || !PRIORIDADE[prioridade]) return null;
    return { id, cliente, dono: dono || cliente, descricao, prioridade: Number(prioridade), status: 'ABERTO' };
  }

  // Só aceita transições do diagrama. O chamado é passado por referência e alterado aqui.
  function mudarStatus(chamado, novo) {
    if (!chamado || !TRANSICOES[chamado.status].includes(novo)) return false;
    chamado.status = novo;
    return true;
  }

  g.Suporte = Object.assign(g.Suporte || {}, { STATUS, PRIORIDADE, criarChamado, mudarStatus });
})(window);
