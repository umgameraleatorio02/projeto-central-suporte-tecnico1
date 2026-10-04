/* lista.js - TAD Lista simplesmente encadeada (cadastro dos chamados).
 * MEMÓRIA: cada `new No()` aloca um nó. Ao remover, desligamos os ponteiros (= null);
 * em JavaScript quem de fato libera é o coletor de lixo, quando nada mais aponta para o nó. */
(function (g) {
  class No {
    constructor(chamado) { this.chamado = chamado; this.prox = null; }
  }

  class Lista {
    constructor() { this.inicio = null; this.fim = null; this.tamanho = 0; }

    vazia() { return this.inicio === null; }                         // O(1)

    inserir(chamado) {                                               // O(1): usa o ponteiro `fim`
      const no = new No(chamado);
      if (this.fim === null) this.inicio = no; else this.fim.prox = no;
      this.fim = no;
      this.tamanho++;
    }

    buscar(id) {                                                     // O(n): percorre nó a nó
      for (let atual = this.inicio; atual !== null; atual = atual.prox) {
        if (atual.chamado.id === id) return atual.chamado;
      }
      return null;
    }

    remover(id) {                                                    // O(n): busca + religar ponteiros
      let anterior = null, atual = this.inicio;
      while (atual !== null && atual.chamado.id !== id) { anterior = atual; atual = atual.prox; }
      if (atual === null) return false;
      if (anterior === null) this.inicio = atual.prox; else anterior.prox = atual.prox;
      if (atual === this.fim) this.fim = anterior;                   // removeu o último: o fim recua
      atual.prox = null; atual.chamado = null;                       // solta as referências do nó
      this.tamanho--;
      return true;
    }

    paraArray() {                                                    // O(n): só para exibir na tela
      const itens = [];
      for (let a = this.inicio; a !== null; a = a.prox) itens.push(a.chamado);
      return itens;
    }
  }

  g.Suporte = Object.assign(g.Suporte || {}, { Lista });
})(window);
