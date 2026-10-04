/* fila.js - TAD Fila (FIFO) encadeada: chamados aguardando atendimento. */
(function (g) {
  class NoFila {
    constructor(chamado) { this.chamado = chamado; this.prox = null; }
  }

  class Fila {
    constructor() { this.frente = null; this.tras = null; this.tamanho = 0; }

    vazia() { return this.frente === null; }                         // O(1)

    enfileirar(chamado) {                                            // O(1): entra em `tras`
      const no = new NoFila(chamado);
      if (this.tras === null) this.frente = no; else this.tras.prox = no;
      this.tras = no;
      this.tamanho++;
    }

    desenfileirar() {                                                // O(1): sai de `frente`
      if (this.vazia()) return null;
      const no = this.frente, chamado = no.chamado;
      this.frente = no.prox;
      if (this.frente === null) this.tras = null;                    // ficou vazia
      no.prox = null; no.chamado = null;
      this.tamanho--;
      return chamado;
    }

    consultarFrente() { return this.vazia() ? null : this.frente.chamado; }   // O(1)

    paraArray() {                                                    // O(n): da frente para trás
      const itens = [];
      for (let a = this.frente; a !== null; a = a.prox) itens.push(a.chamado);
      return itens;
    }
  }

  g.Suporte = Object.assign(g.Suporte || {}, { Fila });
})(window);
