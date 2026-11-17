# Relatório Técnico: Central de Suporte Técnico

**Disciplina:** Algoritmos e Estrutura de Dados I  
**Autor:** Ryan Vitor de Souza Ferreira, Engenharia de Software, UNIALFA  
**Linguagem:** HTML, CSS e JavaScript

## 1. Objetivo e problema simulado

Simular uma central de suporte técnico com login e três perfis (cliente, técnico de TI e gestor). Clientes abrem chamados, que esperam em filas e são atendidos por vários técnicos; casos difíceis são escalonados ao nível 2; cada chamado tem prazo de SLA; os atendidos vão para um histórico, cujo último registro pode ser desfeito. O gestor acompanha indicadores, usuários e auditoria.

## 2. TADs e estruturas

| TAD | Estrutura | Função |
|---|---|---|
| Chamado | objeto + máquina de estados | dados, status, linha do tempo, conversa |
| Lista | encadeada simples (`inicio`, `fim`) | cadastro de chamados, usuários, notificações, auditoria |
| Fila | encadeada (`frente`, `tras`) | fila de nível 1 e fila de nível 2 (FIFO) |
| Pilha | encadeada (`topo`) | histórico de solucionados (LIFO) |
| Sistema | junta as estruturas | regras, SLA, escalonamento, indicadores, invariantes |
| Acesso | permissões por perfil | define o que cada perfil pode fazer |

## 3. Interface pública

- **Lista:** `vazia`, `inserir`, `buscar`, `buscarPor`, `remover`, `removerPrimeiro`, `paraArray`.
- **Fila:** `vazia`, `enfileirar`, `desenfileirar`, `consultarFrente`, `paraArray`.
- **Pilha:** `vazia`, `empilhar`, `desempilhar`, `consultarTopo`, `paraArray`.
- **Sistema:** `abrir`, `enfileirar`, `pegar`, `concluir`, `escalar`, `desfazer`, `remover`, `mensagem`, `avaliar`, `sla`, `verificarSLA`, `indicadores`, `criarUsuario`, `editarUsuario`, `autenticar`, `exportar`/`importar`.
- **Chamado:** `criarChamado`, `mudarStatus`, `registrar`.

## 4. Alocação de memória

Cada nó e cada chamado é criado com `new`/literal de objeto. A lista é dona dos chamados; fila e pilha guardam referências. Ao remover um nó, seus campos são zerados. Em JavaScript não há `free`: o coletor de lixo libera os objetos quando nada mais os referencia. Invariantes: na fila ⇔ Aguardando; na pilha ⇔ Concluído; Em atendimento tem um único técnico; só Aberto pode ser removido, então fila e pilha nunca apontam para chamado apagado. As listas de notificações (300) e auditoria (500) têm limite, removendo o mais antigo.

## 5. Complexidade

| Operação | Custo | Justificativa |
|---|---|---|
| `Lista.inserir` | O(1) | liga em `fim` |
| `Lista.buscar`, `remover` | O(n) | percorre os nós |
| `Fila` (enfileirar, desenfileirar, frente) | O(1) | só `tras` ou `frente` |
| `Pilha` (empilhar, desempilhar, topo) | O(1) | só `topo` |
| `pegar`, `concluir`, `escalar`, `desfazer` | O(1) + O(n) | operação em fila/pilha O(1); localizar o chamado do técnico percorre a lista |
| `sla` | O(1) | cálculo com datas |
| `verificarSLA`, `indicadores` | O(n) | percorrem o cadastro |
| `paraArray` | O(n) | só para a tela |

## 6. Decisões de implementação

Ponteiros `fim` e `tras` para inserção em O(1); transições de estado validadas; fila separada para o nível 2, que só sêniores atendem; um chamado por técnico; SLA contado desde o envio ao suporte; desfazer só do próprio registro; permissões checadas a cada ação; texto digitado é escapado ou inserido com `textContent`; gráficos em SVG escrito à mão; dados em `localStorage` (chave `suporte-dados-v2`); regras separadas da interface, o que permite testes sem navegador.

## 7. Testes

36 testes automatizados (`node tests/testes.js`) cobrindo cadastro, busca, fila, histórico, vazios, remoção, vários técnicos, escalonamento, SLA, conversa, linha do tempo, notificações, avaliação, indicadores, login, usuários, permissões, auditoria e salvar/restaurar. A interface foi verificada em navegador automatizado (fluxo cliente, técnico júnior, sênior e gestor, em tema claro e escuro e em tela de celular).

## 8. Conclusão

O sistema usa lista, fila e pilha encadeadas em um problema onde cada uma tem papel natural, com complexidades analisadas a partir do código. Limitações: busca por ID é linear; login simulado e dados salvos só no navegador; notificações apenas na tela.
