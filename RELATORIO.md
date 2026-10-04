# Relatório Técnico: Central de Suporte Técnico

**Disciplina:** Algoritmos e Estrutura de Dados I  
**Autor:** Ryan Vitor de Souza Ferreira, Engenharia de Software, UNIALFA  
**Linguagem:** HTML, CSS e JavaScript

## 1. Objetivo e problema simulado

Simular uma central de suporte técnico com login e dois perfis (cliente abre e envia chamados; técnico de TI vê a fila a resolver e os solucionados): clientes abrem chamados, que esperam numa fila e são atendidos na ordem de chegada; os atendidos vão para um histórico, cujo último registro pode ser desfeito.

## 2. TADs e estruturas

| TAD | Estrutura | Função |
|---|---|---|
| Chamado | objeto + máquina de estados | id, cliente, descrição, prioridade, status |
| Lista | encadeada simples (`inicio`, `fim`) | cadastro dos chamados |
| Fila | encadeada (`frente`, `tras`) | chamados aguardando (FIFO) |
| Pilha | encadeada (`topo`) | histórico (LIFO) |
| Sistema | junta os três | regras e invariantes |
| Acesso | login e permissões | perfil Cliente ou TI define as ações permitidas |

## 3. Interface pública

- **Lista:** `vazia`, `inserir`, `buscar`, `remover`, `paraArray`.
- **Fila:** `vazia`, `enfileirar`, `desenfileirar`, `consultarFrente`, `paraArray`.
- **Pilha:** `vazia`, `empilhar`, `desempilhar`, `consultarTopo`, `paraArray`.
- **Sistema:** `abrir`, `enfileirar`, `pegar`/`concluir`, `desfazer`, `remover`, `buscar`.
- **Chamado:** `criarChamado`, `mudarStatus`.

## 4. Alocação de memória

Cada nó e cada chamado é criado com `new`/literal de objeto. A lista é dona dos chamados; fila e pilha guardam referências. Ao remover um nó, seus campos são zerados (`null`) para não restarem ligações. Diferente de C, não há `free`: o coletor de lixo libera os objetos quando nada mais os referencia. Invariante: chamado na fila ⇔ Aguardando; na pilha ⇔ Concluído; só chamados Abertos podem ser removidos, então fila e pilha nunca referenciam um chamado apagado.

## 5. Complexidade

| Operação | Custo | Justificativa |
|---|---|---|
| `Lista.inserir` | O(1) | liga em `fim` |
| `Lista.buscar` | O(n) | percorre os nós |
| `Lista.remover` | O(n) | busca O(n) + religação O(1) |
| `Fila.enfileirar`, `desenfileirar`, `consultarFrente` | O(1) | só `tras` ou `frente` |
| `Pilha.empilhar`, `desempilhar`, `consultarTopo` | O(1) | só `topo` |
| `vazia` | O(1) | compara uma referência |
| `paraArray` | O(n) | visita todos os nós (só para a tela) |

## 6. Decisões de implementação

Ponteiros `fim` e `tras` para inserção em O(1); estados com transições validadas; desfazer reabre o chamado; prioridade apenas informativa (fila FIFO); regras separadas da interface, o que permite testes sem navegador.

## 7. Testes

22 testes automatizados (incluindo login e permissões) (`node tests/testes.js`) cobrindo cadastro, busca, fila, histórico, estruturas vazias, remoção em início/meio/fim, IDs inexistentes e regras de status.

## 8. Conclusão

O sistema usa lista, fila e pilha encadeadas em um problema onde cada uma tem papel natural, com complexidades analisadas a partir do código. Limitações: a busca por ID é linear e os dados não são salvos ao fechar a página.
