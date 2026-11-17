/* chamado.js - TAD Chamado: dados + máquina de estados + linha do tempo.
 *
 *   ABERTO -> AGUARDANDO -> EM_ATENDIMENTO -> CONCLUIDO -> (desfazer) ABERTO
 *                 ^                |
 *                 └─ (escalonar) ──┘   o técnico de nível 1 devolve o chamado à fila de nível 2
 */
(function (g) {
  const STATUS = { ABERTO: 'Aberto', AGUARDANDO: 'Aguardando', EM_ATENDIMENTO: 'Em atendimento', CONCLUIDO: 'Concluído' };
  const PRIORIDADE = { 1: 'Baixa', 2: 'Média', 3: 'Alta' };
  const CATEGORIAS = ['Hardware', 'Software', 'Rede', 'Acesso', 'Outro'];
  const TRANSICOES = {
    ABERTO: ['AGUARDANDO'],
    AGUARDANDO: ['EM_ATENDIMENTO'],
    EM_ATENDIMENTO: ['CONCLUIDO', 'AGUARDANDO'],
    CONCLUIDO: ['ABERTO']
  };
  const ANEXO_MAX = 700000;                                   // tamanho máximo do texto da imagem (data URL)
  const ANEXO_REGEX = /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/;

  function anexoValido(a) { return typeof a === 'string' && a.length <= ANEXO_MAX && ANEXO_REGEX.test(a); }

  // Acrescenta um evento à linha do tempo do chamado.
  function registrar(chamado, texto) {
    if (!chamado.linha) chamado.linha = [];
    chamado.linha.push({ q: Date.now(), t: String(texto).slice(0, 300) });
    if (chamado.linha.length > 100) chamado.linha.shift();
  }

  // Cria um chamado (objeto novo na memória). Retorna null se os dados forem inválidos.
  function criarChamado(id, cliente, descricao, prioridade, dono, categoria, anexo) {
    cliente = String(cliente || '').trim().slice(0, 50);
    descricao = String(descricao || '').trim().slice(0, 100);
    if (categoria === undefined) categoria = 'Outro';
    prioridade = Number(prioridade);
    if (!cliente || !descricao || !PRIORIDADE[prioridade] || !CATEGORIAS.includes(categoria)) return null;
    if (anexo && !anexoValido(anexo)) return null;
    const c = { id, cliente, dono: dono || cliente, descricao, categoria, prioridade, status: 'ABERTO',
                aberto: Date.now(), linha: [], mensagens: [] };
    if (anexo) c.anexo = anexo;
    registrar(c, `Chamado aberto por ${cliente}`);
    return c;
  }

  // Só aceita transições do diagrama. O chamado é passado por referência e alterado aqui.
  function mudarStatus(chamado, novo) {
    if (!chamado || !TRANSICOES[chamado.status].includes(novo)) return false;
    const antes = chamado.status;
    const agora = Date.now();
    chamado.status = novo;
    if (novo === 'AGUARDANDO' && antes === 'ABERTO') chamado.enviadoEm = agora;   // o prazo do SLA começa aqui
    if (novo === 'EM_ATENDIMENTO') chamado.iniciadoEm = agora;
    if (novo === 'CONCLUIDO') chamado.concluidoEm = agora;
    if (novo === 'ABERTO') {                                                      // reaberto: recomeça o ciclo
      ['enviadoEm', 'iniciadoEm', 'concluidoEm', 'nota', 'solucao', 'tecnico', 'tecnicoNome', 'nivel', 'slaAlertado']
        .forEach((k) => { delete chamado[k]; });
    }
    return true;
  }

  g.Suporte = Object.assign(g.Suporte || {}, { STATUS, PRIORIDADE, CATEGORIAS, criarChamado, mudarStatus, registrar, anexoValido });
})(window);
