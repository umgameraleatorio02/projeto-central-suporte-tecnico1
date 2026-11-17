# Central de Suporte Técnico

Sistema de Atendimento de Suporte Técnico em **HTML, CSS e JavaScript**, desenvolvido para a disciplina **Algoritmos e Estrutura de Dados I** (Engenharia de Software, UNIALFA).

Autor: **Ryan Vitor de Souza Ferreira**

## Sobre o projeto

Central de suporte com **login**, **três perfis**, **prazos de SLA**, vários técnicos com **escalonamento**, painel do gestor com gráficos e relatório em PDF. O núcleo continua sendo o de AED I: **lista, fila e pilha encadeadas, escritas à mão**.

| Perfil | Pode | Não pode |
|---|---|---|
| **Cliente** | abrir chamado (descrição, categoria, importância, print opcional), enviar ao suporte, cancelar (só Aberto), conversar com a equipe, avaliar o atendimento, ver só os próprios chamados | atender ou ver chamados de outros |
| **Técnico de TI** | ver a fila "a resolver", pegar um chamado por vez, confirmar a resolução, conversar, ver os solucionados, desfazer o próprio último registro, exportar CSV. **Nível 1** pode escalonar ao nível 2; **nível 2 (sênior)** atende primeiro a fila de escalonados | criar chamados |
| **Gestor** | painel com indicadores e gráficos, todos os chamados (somente leitura), cadastro de usuários, prazos de SLA, auditoria, relatório em PDF e CSV | atender ou abrir chamados |

Contas de demonstração (login simulado no navegador, sem segurança real):

| E-mail (login) | Senha | Perfil |
|---|---|---|
| ana.souza@gmail.com | 1234 | Cliente |
| bruno.lima@outlook.com | 1234 | Cliente |
| ryan.vitor@gmail.com | ti2026 | Técnico de TI, nível 1 (Ryan Vitor) |
| marina.alves@hotmail.com | ti2026 | Técnico de TI, nível 2 (Marina Alves) |
| paula.ribeiro@outlook.com | gestor2026 | Gestor (Paula Ribeiro) |

O login é feito por e-mail, mas o sistema **não envia e-mails**: o endereço é só o nome de usuário (formato de e-mail validado ao cadastrar).

## Dados de demonstração

Na primeira vez que abre (ou ao clicar em **Restaurar exemplos** na tela de login), o sistema já vem com 21 chamados: 13 resolvidos (com conversas, avaliações e escalonamentos), 2 em atendimento, 4 na fila (um perto do prazo e um atrasado), 2 abertos e um registro de auditoria. Eles são criados pelas mesmas operações do sistema (arquivo `js/demo.js`), com horários relativos ao momento da criação. **Começar do zero** limpa tudo.

## Funcionalidades

- **Prazo de atendimento (SLA):** o prazo depende da importância (padrão: Alta 4 h, Média 8 h, Baixa 24 h; o gestor altera) e conta a partir do envio ao suporte. Estados: no prazo, atenção (menos de 25% restante), atrasado, cumprido e violado. Ao estourar, gestor e técnicos são avisados uma vez.
- **Conversa no chamado** entre cliente e técnico (enquanto está na fila ou em atendimento) e **linha do tempo** com todos os eventos.
- **Notificações na tela** (sino) para novos chamados, mensagens, SLA estourado, escalonamento e conclusão.
- **Vários técnicos** e **escalonamento** (fila de nível 2, atendida primeiro pelos sêniores).
- **Cadastro de usuários** pelo gestor (criar, editar, ativar/desativar), com proteções (não desativar a si mesmo, manter ao menos um gestor, etc.).
- **Busca e filtros** por texto, status, categoria e importância.
- **Anexar print** (PNG/JPG, reduzido no navegador).
- **Dashboard** com gráficos (por dia/semana, categoria, importância, status), com botão "Ver tabela" e tooltips.
- **Relatório em PDF:** botão do gestor abre a impressão do navegador, escolha "Salvar como PDF".
- **Modo escuro** (segue o sistema ou pelo botão) e **registro de auditoria** (últimos 500 eventos, com CSV).
- Categoria e importância começam **sem seleção** e voltam a ficar vazias após cada chamado criado; sem elas, o sistema mostra erro.

Fluxo: **Aberto** → (cliente envia) **Aguardando** → (técnico pega) **Em atendimento** → (confirma) **Concluído**. Um técnico só pega outro chamado depois de concluir ou escalonar o atual.

Os dados ficam no navegador (`localStorage`, chave `suporte-dados-v2`). O botão **Atualizar** (e uma atualização automática a cada 30 s e entre abas) relê os dados. Para recomeçar, use "Restaurar exemplos" ou "Começar do zero" na tela de login.

## Estruturas de dados utilizadas

| Estrutura | Onde aparece | Implementação |
|---|---|---|
| Lista simplesmente encadeada | cadastro de chamados; também usuários, notificações e auditoria | `js/lista.js` (`inicio`, `fim`) |
| Fila (FIFO) | "A resolver" nível 1 e fila de nível 2 | `js/fila.js` (`frente`, `tras`) |
| Pilha (LIFO) | histórico de solucionados (desfazer) | `js/pilha.js` (`topo`) |

Todas são **encadeadas**: cada nó é um objeto com referência ao próximo, sem usar `Array` para guardar os dados (`paraArray` existe só para desenhar a tela).

Invariantes: na fila ou na fila de nível 2 ⇔ Aguardando; no histórico ⇔ Concluído; Em atendimento tem exatamente um técnico; só chamado Aberto pode ser cancelado.

## Memória em JavaScript (ponto de atenção)

A alocação é explícita (`new No(...)`), a lista é dona dos chamados e fila/pilha guardam só referências. Ao remover, os ponteiros do nó são zerados. Em JavaScript não existe `free`: o coletor de lixo libera o objeto quando nada mais aponta para ele. Se a disciplina exigir gerenciamento manual, vale confirmar com o professor.

## Estrutura do projeto

```
suporte-web/
  index.html            Interface
  css/estilo.css        Aparência (claro e escuro)
  js/chamado.js         TAD Chamado
  js/lista.js  fila.js  pilha.js   TADs encadeados
  js/demo.js            Dados de exemplo para apresentação
  js/sistema.js         Regras (SLA, escalonamento, usuários, indicadores)
  js/acesso.js          Perfis e permissões
  js/ui/                Telas: nucleo, graficos, detalhe, cliente, ti, gestor, relatorio
  js/app.js             Login e inicialização
  tests/testes.js       Testes automatizados
  README.md  RELATORIO.md
```

A pasta `js/ui` só cuida da tela; as regras ficam em `sistema.js`.

## Como executar

Não precisa compilar nem instalar nada: dê **dois cliques em `index.html`** e entre com uma conta acima. Para ver o fluxo completo, abra duas abas do mesmo navegador (uma como cliente, outra como técnico) e use "Atualizar".

## Como testar

Com o [Node.js](https://nodejs.org) instalado:

```
node tests/testes.js
```

São **36 testes**: cadastro, busca, fila, histórico, desfazer, remoção, vários técnicos, escalonamento, SLA, conversa, linha do tempo, notificações, avaliação, indicadores, login, usuários, permissões, auditoria e salvar/restaurar e dados de demonstração.

## Complexidade

| Estrutura | Operação | Custo |
|---|---|---|
| Lista | inserir (usa `fim`) | O(1) |
| Lista | buscar / remover | O(n) |
| Fila | enfileirar, desenfileirar, frente | O(1) |
| Pilha | empilhar, desempilhar, topo | O(1) |
| Sistema | pegar, concluir, escalar, desfazer | O(1) (mais a busca do chamado do técnico, O(n)) |
| Sistema | indicadores e relatório | O(n) |

## Limitações

Login e senhas são simulados no navegador (em sistema real ficam no servidor, com senha criptografada); os dados ficam só neste navegador; as notificações aparecem na tela (não há e-mail).

## Autores

- Ryan Vitor de Souza Ferreira — Engenharia de Software, UNIALFA
