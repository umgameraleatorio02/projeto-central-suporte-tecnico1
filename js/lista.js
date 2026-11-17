/* lista.js - TAD Lista simplesmente encadeada, genérica (chamados, usuários, notificações, auditoria).
 * Os itens guardados precisam ter o campo `id` apenas para buscar()/remover(); buscarPor() aceita qualquer critério.
 * MEMÓRIA: cada `new No()` aloca um nó. Ao remover, desligamos os ponteiros (= null);
 * em JavaScript quem de fato libera é o coletor de lixo, quando nada mais aponta para o nó. */
(function (g) {
  class No {
    constructor(dado) { this.dado = dado; this.prox = null; }
  }

  class Lista {
    constructor() { this.inicio = null; this.fim = null; this.tamanho = 0; }

    vazia() { return this.inicio === null; }                         // O(1)

    inserir(dado) {                                                  // O(1): usa o ponteiro `fim`
      const no = new No(dado);
      if (this.fim === null) this.inicio = no; else this.fim.prox = no;
      this.fim = no;
      this.tamanho++;
    }

    buscarPor(criterio) {                                            // O(n): percorre nó a nó
      for (let atual = this.inicio; atual !== null; atual = atual.prox) {
        if (criterio(atual.dado)) return atual.dado;
      }
      return null;
    }

    buscar(id) { return this.buscarPor((d) => d.id === id); }        // O(n)

    remover(id) {                                                    // O(n): busca + religar ponteiros
      let anterior = null, atual = this.inicio;
      while (atual !== null && atual.dado.id !== id) { anterior = atual; atual = atual.prox; }
      if (atual === null) return false;
      if (anterior === null) this.inicio = atual.prox; else anterior.prox = atual.prox;
      if (atual === this.fim) this.fim = anterior;                   // removeu o último: o fim recua
      atual.prox = null; atual.dado = null;                          // solta as referências do nó
      this.tamanho--;
      return true;
    }

    removerPrimeiro() {                                              // O(1): descarta o item mais antigo (limite de logs)
      if (this.inicio === null) return false;
      const no = this.inicio;
      this.inicio = no.prox;
      if (this.inicio === null) this.fim = null;
      no.prox = null; no.dado = null;
      this.tamanho--;
      return true;
    }

    paraArray() {                                                    // O(n): só para exibir na tela
      const itens = [];
      for (let a = this.inicio; a !== null; a = a.prox) itens.push(a.dado);
      return itens;
    }
  }

  g.Suporte = Object.assign(g.Suporte || {}, { Lista });
})(window);
