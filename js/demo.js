/* demo.js - dados de demonstração (para apresentar o sistema já com movimento).
 * Usa as MESMAS operações do sistema (abrir, enfileirar, pegar, escalar, concluir...), só com o relógio ajustado para o passado,
 * então todas as regras e invariantes continuam valendo. Os horários são relativos a "agora" (quando os dados são criados). */
(function (g) {
  const { Sistema } = g.Suporte;
  const MIN = 60000, H = 60, D = 1440;
  const ANA = 'ana.souza@gmail.com', BRU = 'bruno.lima@outlook.com', RYAN = 'ryan.vitor@gmail.com', MAR = 'marina.alves@hotmail.com', GES = 'paula.ribeiro@outlook.com';

  Sistema.comDemonstracao = function () {
    const realNow = Date.now, base = realNow();
    const s = new Sistema();
    const relogio = (minAtras) => { Date.now = () => base - minAtras * MIN; };
    const ator = (login) => { const u = s.usuario(login); return { usuario: u.usuario, nome: u.nome, perfil: u.perfil, nivel: u.nivel }; };
    const reg = (login, acao, r) => { if (!r.ok) throw new Error('demo: ' + acao + ' ' + login + ' falhou: ' + r.msg + ' | id=' + JSON.stringify(s.todos().length)); s.auditar(ator(login), acao, r.msg); return r; };

    // Executa os eventos de um chamado em ordem de tempo. Offsets em minutos, contados a partir da abertura (t0 = minutos atrás).
    function cena(c) {
      const ev = [];
      let id = null;
      const add = (off, fn) => ev.push([off, ev.length, fn]);
      add(0, () => { id = reg(c.dono, 'abrir', s.abrir(ator(c.dono).nome, c.desc, c.pri, c.dono, c.cat)).chamado.id; });
      if (c.env !== undefined) add(c.env, () => reg(c.dono, 'enviar', s.enfileirar(id, c.dono)));
      if (c.pega) add(c.pega, () => reg(RYAN_OU(c.tec1), 'pegar', s.pegar(RYAN_OU(c.tec1))));
      (c.msgs || []).forEach(([off, quem, txt]) => add(off, () => reg(quem, 'conversar', s.mensagem(id, ator(quem), txt))));
      if (c.esc) add(c.esc[0], () => reg(RYAN, 'escalar', s.escalar(c.esc[1], RYAN)));
      if (c.pega2) add(c.pega2, () => reg(MAR, 'pegar', s.pegar(MAR)));
      if (c.fim) add(c.fim[0], () => reg(c.fimPor || RYAN, 'concluir', s.concluir(c.fim[1], c.fimPor || RYAN)));
      if (c.nota) add(c.nota[0], () => reg(c.dono, 'avaliar', s.avaliar(id, c.dono, c.nota[1])));
      ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]).forEach(([off, , fn]) => { relogio(c.t0 - off); fn(); });
      return id;
    }
    const RYAN_OU = (x) => x || RYAN;

    try {
      /* ---- usuário entrando (para a auditoria ter movimento) ---- */
      relogio(19 * D + 30); s.auditar(ator(GES), 'login', 'Entrou no sistema');

      /* ---- chamados já resolvidos (histórico) ---- */
      cena({ dono: ANA, desc: 'Computador não liga após queda de energia', cat: 'Hardware', pri: 3, t0: 19 * D, env: 5, pega: 20,
        msgs: [[28, RYAN, 'Bom dia! Já testou ligar em outra tomada?'], [35, ANA, 'Sim, continua sem ligar.'], [60, RYAN, 'Vou passar para o nível 2 avaliar a fonte.']],
        esc: [70, 'Suspeita de fonte queimada, precisa de bancada'], pega2: 100, fimPor: MAR, fim: [150, 'Fonte de alimentação trocada'], nota: [200, 5] });
      cena({ dono: BRU, desc: 'Esqueci a senha do sistema financeiro', cat: 'Acesso', pri: 2, t0: 18 * D, env: 4, pega: 30,
        msgs: [[35, RYAN, 'Vou redefinir agora. Pode confirmar seu setor?'], [38, BRU, 'Financeiro, sala 3.']], fim: [50, 'Senha redefinida'], nota: [90, 5] });
      cena({ dono: ANA, desc: 'Instalar o pacote Office no notebook novo', cat: 'Software', pri: 1, t0: 16 * D, env: 10, pega: 300,
        msgs: [[310, RYAN, 'Iniciando a instalação, leva cerca de 1 hora.']], fim: [1500, 'Pacote instalado e ativado'], nota: [1560, 3] });
      cena({ dono: BRU, desc: 'Sem internet na sala de reuniões', cat: 'Rede', pri: 3, t0: 14 * D, env: 5, pega: 15,
        msgs: [[20, RYAN, 'Os outros setores estão com internet?'], [25, BRU, 'Sim, só a sala de reuniões.']],
        esc: [60, 'Switch com falha, verificar infraestrutura'], pega2: 90, fimPor: MAR, fim: [200, 'Switch reiniciado e cabo trocado'], nota: [260, 4] });
      cena({ dono: ANA, desc: 'Sistema de ponto travando ao abrir', cat: 'Software', pri: 2, t0: 12 * D, env: 5, pega: 40, fim: [120, 'Cache limpo e programa reinstalado'], nota: [200, 4] });
      cena({ dono: BRU, desc: 'Mouse sem fio parou de funcionar', cat: 'Hardware', pri: 1, t0: 10 * D, env: 5, pega: 60, fim: [80, 'Troca de pilhas e do receptor'], nota: [120, 5] });
      cena({ dono: ANA, desc: 'Conta bloqueada antes da reunião', cat: 'Acesso', pri: 3, t0: 9 * D, env: 2, pega: 10, tec1: MAR, fimPor: MAR, fim: [25, 'Conta desbloqueada'], nota: [40, 5] });
      cena({ dono: BRU, desc: 'Wi-Fi lento no 2º andar', cat: 'Rede', pri: 2, t0: 7 * D, env: 5, pega: 30,
        msgs: [[35, RYAN, 'Vou medir a velocidade no andar.']], esc: [75, 'Possível interferência, analisar os roteadores'], pega2: 120,
        fimPor: MAR, fim: [300, 'Canal do roteador ajustado'], nota: [400, 4] });
      cena({ dono: ANA, desc: 'Solicitar segundo monitor', cat: 'Outro', pri: 1, t0: 6 * D, env: 5, pega: 120, fimPor: RYAN, fim: [200, 'Monitor instalado na mesa'], nota: [260, 5] });
      cena({ dono: BRU, desc: 'Erro ao emitir nota fiscal', cat: 'Software', pri: 3, t0: 4 * D, env: 3, pega: 20,
        msgs: [[25, RYAN, 'Qual mensagem de erro aparece?'], [30, BRU, 'Diz "Certificado inválido".']], fim: [90, 'Atualização do sistema aplicada'], nota: [150, 5] });
      cena({ dono: ANA, desc: 'Impressora do 2º andar não imprime', cat: 'Hardware', pri: 2, t0: 3 * D, env: 5, pega: 50, fim: [130, 'Fila de impressão limpa e driver reinstalado'], nota: [180, 4] });
      cena({ dono: BRU, desc: 'Criar e-mail para o novo estagiário', cat: 'Acesso', pri: 1, t0: 2 * D, env: 5, pega: 90, fim: [150, 'Conta criada e entregue ao gestor'] });
      cena({ dono: ANA, desc: 'VPN não conecta', cat: 'Rede', pri: 3, t0: 1 * D, env: 4, pega: 10,
        msgs: [[15, RYAN, 'Vou verificar o certificado da VPN.']], fim: [60, 'Certificado da VPN renovado'], nota: [100, 5] });

      /* ---- em andamento ---- */
      const idServidor = cena({ dono: ANA, desc: 'Servidor de arquivos muito lento', cat: 'Rede', pri: 3, t0: 5 * H + 5, env: 5, pega: 10,
        msgs: [[14, RYAN, 'Vou analisar o servidor.'], [16, ANA, 'Está travando para todo o setor.']],
        esc: [30, 'Problema no servidor, fora do alcance do nível 1'], pega2: 215 });
      relogio(70); s.mensagem(idServidor, ator(MAR), 'Estou verificando o disco do servidor. Retorno em breve.');
      cena({ dono: BRU, desc: 'Falha no backup noturno', cat: 'Software', pri: 3, t0: 3 * H + 40, env: 5, pega: 10,
        msgs: [[12, RYAN, 'Vou verificar o log do backup.']], esc: [25, 'Erro de permissão no servidor de backup'] });
      cena({ dono: BRU, desc: 'Notebook com tela piscando', cat: 'Hardware', pri: 2, t0: 100, env: 5, pega: 60,
        msgs: [[62, RYAN, 'Entendi. Pode trazer o notebook até a TI hoje?'], [70, BRU, 'Posso levar às 15h.']] });

      /* ---- aguardando na fila (nível 1) ---- */
      cena({ dono: ANA, desc: 'Instalar antivírus no computador novo', cat: 'Software', pri: 2, t0: 400, env: 10 });             // perto do prazo
      cena({ dono: BRU, desc: 'Sistema de cobrança fora do ar', cat: 'Software', pri: 3, t0: 280, env: 10,                         // prazo estourado
        msgs: [[200, BRU, 'Ainda sem acesso. Isso está parando o setor.']] });
      cena({ dono: ANA, desc: 'Teclado com teclas falhando', cat: 'Hardware', pri: 1, t0: 125, env: 5 });

      /* ---- abertos (ainda não enviados ao suporte) ---- */
      cena({ dono: ANA, desc: 'Solicitar acesso à pasta compartilhada do financeiro', cat: 'Acesso', pri: 1, t0: 40 });
      cena({ dono: BRU, desc: 'Monitor com manchas na tela', cat: 'Hardware', pri: 2, t0: 25 });

      /* ---- acessos recentes ---- */
      relogio(90); s.auditar(ator(RYAN), 'login', 'Entrou no sistema');
      relogio(30); s.auditar(ator(MAR), 'login', 'Entrou no sistema');
    } finally { Date.now = realNow; }

    // notificações antigas já estão lidas; só as mais recentes ficam como novas
    s.notificacoes.paraArray().forEach((n) => { if (n.q < base - 3 * H * MIN) n.lida = true; });
    s.verificarSLA();     // avisa quem já estourou o prazo (com o relógio real)
    return s;
  };
})(window);
