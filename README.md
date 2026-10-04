# Central de Suporte Técnico

Sistema de Atendimento de Suporte Técnico em **HTML, CSS e JavaScript**, desenvolvido para a disciplina **Algoritmos e Estrutura de Dados I** (Engenharia de Software, UNIALFA).

Autor: **Ryan Vitor de Souza Ferreira**

## Sobre o projeto

Simula uma central de suporte com **tela de login** e **dois perfis**:

| Perfil | Pode | Não pode |
|---|---|---|
| **Cliente** | abrir chamado, definir a importância (Baixa/Média/Alta, escolha obrigatória a cada chamado), enviar ao suporte, cancelar, acompanhar a posição na fila (só vê os próprios chamados) | atender ou ver a fila de outros |
| **Técnico de TI** | ver a fila **a resolver**, **pegar** o próximo (um por vez) e ver os detalhes, **confirmar a resolução**, ver os **já solucionados**, desfazer o último registro, **atualizar** a lista | criar chamados |

Contas de demonstração (login simulado no navegador, sem segurança real):

| Usuário | Senha | Perfil |
|---|---|---|
| ana | 1234 | Cliente |
| bruno | 1234 | Cliente |
| tecnico | ti2026 | Técnico de TI |

Fluxo: o cliente cria o chamado (**Aberto**), envia ao suporte (**Aguardando**, entra na fila), o técnico **pega** o chamado (**Em atendimento**, só um por vez) e, ao **confirmar a resolução**, ele vira **Concluído** e vai ao histórico. Os dados ficam salvos no navegador (`localStorage`); o botão **Atualizar** relê os dados salvos, útil com cliente e técnico em abas diferentes do mesmo navegador. Para recomeçar, use "Apagar dados salvos" na tela de login.

## Objetivos

Demonstrar modularização, passagem de parâmetros, alocação de memória e estruturas encadeadas (lista, fila e pilha), com análise de complexidade e testes.

## Estruturas de dados utilizadas

| Estrutura | Na tela | Papel | Implementação |
|---|---|---|---|
| Lista simplesmente encadeada | Cadastro ("Meus chamados") | cadastro de todos os chamados | `js/lista.js` (nós, `inicio`, `fim`) |
| Fila (FIFO) | Painel do TI: "A resolver" | chamados aguardando atendimento | `js/fila.js` (nós, `frente`, `tras`) |
| Pilha (LIFO) | Painel do TI: "Já solucionados" | histórico de atendimentos | `js/pilha.js` (nós, `topo`) |

Todas são **encadeadas**: cada nó é um objeto (`new No(...)`) com uma referência ao próximo. Nenhuma usa `Array` para guardar os dados (o método `paraArray` existe só para desenhar na tela).

### Estados do chamado

```
ABERTO -> AGUARDANDO -> EM_ATENDIMENTO -> CONCLUIDO
  ^                                           |
  +--------- (desfazer histórico) ------------+
```

- **Aberto:** só na lista. **Aguardando:** na lista e na fila. **Em atendimento:** o técnico pegou o chamado e ainda não confirmou a resolução (fora da fila e do histórico). **Concluído:** na lista e na pilha.
- Só transições do diagrama são aceitas (`mudarStatus`).
- Só se **cancela** (remove) chamado **Aberto**, e só o dono pode cancelar ou enviar o seu, para fila e pilha nunca apontarem para um chamado apagado.
- **Desfazer** tira o último atendimento do histórico e **reabre** o chamado.
- A prioridade é informativa; a fila é FIFO.

## Memória em JavaScript (ponto de atenção)

A alocação é explícita (`new No(...)` cria cada nó) e a lista é a dona dos chamados; fila e pilha guardam só referências. Ao remover, os ponteiros do nó são zerados (`= null`). A diferença para C: em JavaScript não existe `free`; a liberação final é feita pelo coletor de lixo quando nada mais aponta para o objeto. Se a disciplina exigir gerenciamento manual, vale confirmar com o professor.

## Tecnologias

HTML5, CSS3 e JavaScript puro (sem bibliotecas). Fonte IBM Plex Sans, do Google Fonts (se estiver sem internet, o sistema usa fontes padrão).

## Estrutura do projeto

```
suporte-web/
  index.html          Interface
  css/estilo.css      Aparência
  js/chamado.js       TAD Chamado (dados e estados)
  js/lista.js         TAD Lista encadeada
  js/fila.js          TAD Fila
  js/pilha.js         TAD Pilha
  js/sistema.js       Regras (junta lista, fila e pilha)
  js/acesso.js        Login e permissões por perfil
  js/app.js           Tela: lê formulários, chama o Sistema, redesenha
  tests/testes.js     Testes automatizados
  README.md  RELATORIO.md
```

`app.js` só cuida da tela; as regras ficam em `sistema.js`.

## Como compilar

Não precisa compilar: é JavaScript puro.

## Como executar

Dê **dois cliques em `index.html`** (abre no navegador) e entre com uma das contas acima. Não precisa de servidor nem de instalação. Para ver os dois perfis, use "Sair" e entre com outra conta, ou abra o `index.html` em duas abas.

## Como testar

Com o [Node.js](https://nodejs.org) instalado, na pasta do projeto:

```
node tests/testes.js
```

São 22 testes: login e permissões por perfil, cadastro, busca (existente e inexistente), fila, atendimento, fila vazia, histórico, desfazer, pilha vazia, remoção (início, meio, fim), ID inexistente e regras de status.

## Decisões de projeto

- Ponteiro `fim` na lista e `tras` na fila: inserção em O(1).
- Fila e pilha guardam referências, não cópias: o status fica num só lugar.
- Em `atender`, o chamado só é empilhado depois de sair da fila, mantendo as invariantes.
- IDs automáticos, nunca reaproveitados.
- O texto digitado é escapado antes de ir para a tela.
- Os scripts são carregados com `<script>` comum (e não módulos ES) para o sistema funcionar abrindo o arquivo direto, sem servidor.

## Complexidade

| Estrutura | Operação | Custo | Por quê |
|---|---|---|---|
| Lista | inserir | O(1) | usa `fim` |
| Lista | buscar | O(n) | percorre nó a nó |
| Lista | remover | O(n) | busca + religar ponteiros |
| Fila | enfileirar / desenfileirar / frente | O(1) | só mexe em `tras` ou `frente` |
| Pilha | empilhar / desempilhar / topo | O(1) | só mexe no `topo` |
| Todas | vazia | O(1) | compara uma referência |

No sistema: enfileirar e remover são O(n) (começam com a busca); pegar, concluir e desfazer são O(1).

## Autores

- Ryan Vitor de Souza Ferreira — Engenharia de Software, UNIALFA
