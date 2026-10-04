/* sistema.js - regras do atendimento: junta Lista, Fila e Pilha.
 * INVARIANTES: na fila <=> AGUARDANDO; no histórico <=> CONCLUIDO; ABERTO não está em nenhuma delas.
 * Por isso só se remove do cadastro um chamado ABERTO (a fila/pilha nunca apontam para chamado apagado).
 * A Lista é a dona dos chamados; Fila e Pilha guardam apenas referências a eles. */
(function (g) {
  const { Lista, Fila, Pilha, criarChamado, mudarStatus } = g.Suporte;
  const num = (id) => String(id).padStart(3, '0');
  const ok = (msg, chamado) => ({ ok: true, msg, chamado });
  const erro = (msg) => ({ ok: false, msg });

  class Sistema {
    constructor() {
      this.cadastro = new Lista();
      this.fila = new Fila();
      this.historico = new Pilha();
      this.proximoId = 1;                       // IDs nunca são reaproveitados
      this.emAtendimento = null;                // chamado que o técnico pegou e ainda não concluiu (só um por vez)
    }

    abrir(cliente, descricao, prioridade, dono) {
      const c = criarChamado(this.proximoId, cliente, descricao, prioridade, dono);
      if (c === null) return erro('Descreva o problema e selecione a importância.');
      this.cadastro.inserir(c);
      this.proximoId++;
      return ok(`Chamado nº ${num(c.id)} aberto.`, c);
    }

    enfileirar(id, dono) {
      const c = this.cadastro.buscar(id);
      if (c === null) return erro(`Chamado nº ${num(id)} não existe.`);
      if (dono !== undefined && c.dono !== dono) return erro('Este chamado não pertence a você.');
      if (c.status !== 'ABERTO') return erro(`Nº ${num(id)} já está em andamento ou concluído.`);
      this.fila.enfileirar(c);
      mudarStatus(c, 'AGUARDANDO');
      return ok(`Nº ${num(id)} entrou na fila (posição ${this.fila.tamanho}).`, c);
    }

    // O técnico pega o primeiro da fila. Enquanto não concluir, não pode pegar outro.
    pegar() {
      if (this.emAtendimento !== null) return erro(`Conclua primeiro o chamado nº ${num(this.emAtendimento.id)}.`);
      if (this.fila.vazia()) return erro('A fila está vazia: nenhum chamado para atender.');
      const c = this.fila.desenfileirar();
      mudarStatus(c, 'EM_ATENDIMENTO');
      this.emAtendimento = c;
      return ok(`Nº ${num(c.id)} está em atendimento.`, c);
    }

    // Confirma a resolução: o chamado vai para o histórico (pilha).
    concluir(solucao) {
      const c = this.emAtendimento;
      if (c === null) return erro('Nenhum chamado em atendimento.');
      if (solucao) c.solucao = String(solucao).trim().slice(0, 100);
      mudarStatus(c, 'CONCLUIDO');
      this.historico.empilhar(c);
      this.emAtendimento = null;
      return ok(`Nº ${num(c.id)} solucionado e registrado no histórico.`, c);
    }

    atender() { const r = this.pegar(); return r.ok ? this.concluir() : r; }   // atalho (usado nos testes)

    desfazer() {
      if (this.historico.vazia()) return erro('O histórico está vazio: nada para desfazer.');
      const c = this.historico.desempilhar();
      mudarStatus(c, 'ABERTO');                 // reaberto: pode ser enviado de novo
      return ok(`Nº ${num(c.id)} saiu do histórico e foi reaberto.`, c);
    }

    remover(id, dono) {
      const c = this.cadastro.buscar(id);
      if (c === null) return erro(`Chamado nº ${num(id)} não existe.`);
      if (dono !== undefined && c.dono !== dono) return erro('Este chamado não pertence a você.');
      if (c.status !== 'ABERTO') return erro('Só é possível remover chamados com status Aberto.');
      this.cadastro.remover(id);
      return ok(`Nº ${num(id)} cancelado.`);
    }

    // Salvamento: transforma o estado em dados simples (para o localStorage) e reconstrói as estruturas.
    exportar() {
      return { proximoId: this.proximoId, chamados: this.cadastro.paraArray(), fila: this.fila.paraArray().map((c) => c.id),
               historico: this.historico.paraArray().map((c) => c.id).reverse(), emAtendimento: this.emAtendimento ? this.emAtendimento.id : null };
    }
    static importar(d) {
      const s = new Sistema();
      s.proximoId = d.proximoId;
      d.chamados.forEach((c) => s.cadastro.inserir(c));
      d.fila.forEach((id) => s.fila.enfileirar(s.cadastro.buscar(id)));
      d.historico.forEach((id) => s.historico.empilhar(s.cadastro.buscar(id)));   // da base para o topo
      s.emAtendimento = d.emAtendimento === null ? null : s.cadastro.buscar(d.emAtendimento);
      return s;
    }

    buscar(id) { return this.cadastro.buscar(id); }
    meusChamados(dono) { return this.cadastro.paraArray().filter((c) => c.dono === dono); }
    posicao(id) { return this.fila.paraArray().findIndex((c) => c.id === id) + 1; }   // 0 = fora da fila
  }

  g.Suporte = Object.assign(g.Suporte || {}, { Sistema, num });
})(window);
