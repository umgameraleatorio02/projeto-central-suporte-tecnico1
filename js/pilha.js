/* pilha.js - TAD Pilha (LIFO) encadeada: histórico de atendimentos concluídos. */
(function (g) {
  class NoPilha {
    constructor(chamado, abaixo) { this.chamado = chamado; this.abaixo = abaixo; }
  }

  class Pilha {
    constructor() { this.topo = null; this.tamanho = 0; }

    vazia() { return this.topo === null; }                           // O(1)

    empilhar(chamado) {                                              // O(1): novo nó vira o topo
      this.topo = new NoPilha(chamado, this.topo);
      this.tamanho++;
    }

    desempilhar() {                                                  // O(1): remove o topo
      if (this.vazia()) return null;
      const no = this.topo, chamado = no.chamado;
      this.topo = no.abaixo;
      no.abaixo = null; no.chamado = null;
      this.tamanho--;
      return chamado;
    }

    consultarTopo() { return this.vazia() ? null : this.topo.chamado; }       // O(1)

    paraArray() {                                                    // O(n): do topo para a base
      const itens = [];
      for (let a = this.topo; a !== null; a = a.abaixo) itens.push(a.chamado);
      return itens;
    }
  }

  g.Suporte = Object.assign(g.Suporte || {}, { Pilha });
})(window);
