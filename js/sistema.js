/* sistema.js - regras do atendimento: junta Lista, Fila e Pilha.
 *
 * Estruturas:
 *   cadastro  (Lista)  todos os chamados; é a DONA dos chamados
 *   fila      (Fila)   aguardando atendimento, nível 1 (FIFO)
 *   filaN2    (Fila)   chamados escalonados, só técnicos sêniores atendem (FIFO)
 *   historico (Pilha)  concluídos (LIFO: o último registro pode ser desfeito)
 *   usuarios, notificacoes, auditoria (Listas encadeadas)
 *
 * INVARIANTES: na fila ou na filaN2 <=> AGUARDANDO; no histórico <=> CONCLUIDO;
 * EM_ATENDIMENTO está com exatamente um técnico (campo `tecnico`); ABERTO não está em nenhuma estrutura.
 * Por isso só se cancela (remove) um chamado ABERTO. */
(function (g) {
  const { Lista, Fila, Pilha, criarChamado, mudarStatus, registrar, CATEGORIAS, PRIORIDADE } = g.Suporte;
  const num = (id) => String(id).padStart(3, '0');
  const ok = (msg, chamado) => ({ ok: true, msg, chamado });
  const erro = (msg) => ({ ok: false, msg });
  const PERFIS = ['CLIENTE', 'TI', 'GESTOR'];
  const NIVEIS = ['JUNIOR', 'SENIOR'];
  const SLA_PADRAO = { 3: 240, 2: 480, 1: 1440 };      // prazo em MINUTOS por importância (Alta, Média, Baixa)
  const USUARIOS_INICIAIS = [
    { usuario: 'ana.souza@gmail.com', senha: '1234', nome: 'Ana Souza', perfil: 'CLIENTE', ativo: true },
    { usuario: 'bruno.lima@outlook.com', senha: '1234', nome: 'Bruno Lima', perfil: 'CLIENTE', ativo: true },
    { usuario: 'ryan.vitor@gmail.com', senha: 'ti2026', nome: 'Ryan Vitor', perfil: 'TI', nivel: 'JUNIOR', ativo: true },
    { usuario: 'marina.alves@hotmail.com', senha: 'ti2026', nome: 'Marina Alves', perfil: 'TI', nivel: 'SENIOR', ativo: true },
    { usuario: 'paula.ribeiro@outlook.com', senha: 'gestor2026', nome: 'Paula Ribeiro', perfil: 'GESTOR', ativo: true }
  ];
  const media = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

  class Sistema {
    constructor(semUsuarios) {
      this.cadastro = new Lista();
      this.fila = new Fila();
      this.filaN2 = new Fila();
      this.historico = new Pilha();
      this.usuarios = new Lista();
      this.notificacoes = new Lista();
      this.auditoria = new Lista();
      this.proximoId = 1;                       // IDs de chamados nunca são reaproveitados
      this.proximoLog = 1;                      // IDs de notificações e auditoria
      this.config = { sla: Object.assign({}, SLA_PADRAO) };
      if (!semUsuarios) USUARIOS_INICIAIS.forEach((u) => this.usuarios.inserir(Object.assign({}, u)));
    }

    /* ---------- usuários e acesso ---------- */
    usuario(login) { return this.usuarios.buscarPor((u) => u.usuario === login); }
    ativos(perfil, nivel) {
      return this.usuarios.paraArray().filter((u) => u.ativo && u.perfil === perfil && (!nivel || u.nivel === nivel)).map((u) => u.usuario);
    }

    autenticar(login, senha) {
      const u = this.usuario(String(login || '').trim().toLowerCase());
      if (!u || u.senha !== senha) return erro('Usuário ou senha incorretos.');
      if (!u.ativo) return erro('Conta desativada. Procure o gestor.');
      return { ok: true, usuario: { usuario: u.usuario, nome: u.nome, perfil: u.perfil, nivel: u.nivel } };
    }

    criarUsuario(d) {
      const login = String(d.usuario || '').trim().toLowerCase();
      if (login.length > 60 || !/^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(login)) return erro('Informe um e-mail válido (ex.: nome@gmail.com).');
      if (this.usuario(login)) return erro('Já existe um usuário com esse login.');
      const nome = String(d.nome || '').trim().slice(0, 50);
      if (!nome) return erro('Informe o nome completo.');
      if (String(d.senha || '').length < 4) return erro('A senha deve ter pelo menos 4 caracteres.');
      if (!PERFIS.includes(d.perfil)) return erro('Escolha o perfil.');
      if (d.perfil === 'TI' && !NIVEIS.includes(d.nivel)) return erro('Escolha o nível do técnico.');
      const u = { usuario: login, senha: String(d.senha), nome, perfil: d.perfil, ativo: true };
      if (d.perfil === 'TI') u.nivel = d.nivel;
      this.usuarios.inserir(u);
      return ok(`Usuário ${login} criado.`);
    }

    editarUsuario(login, d, ator) {
      const u = this.usuario(login);
      if (!u) return erro('Usuário não encontrado.');
      const nome = d.nome === undefined ? u.nome : String(d.nome).trim().slice(0, 50);
      const perfil = d.perfil === undefined ? u.perfil : d.perfil;
      const nivel = perfil === 'TI' ? (d.nivel === undefined ? u.nivel : d.nivel) : undefined;
      const ativo = d.ativo === undefined ? u.ativo : !!d.ativo;
      if (!nome) return erro('Informe o nome completo.');
      if (!PERFIS.includes(perfil)) return erro('Perfil inválido.');
      if (perfil === 'TI' && !NIVEIS.includes(nivel)) return erro('Escolha o nível do técnico.');
      if (d.senha && String(d.senha).length < 4) return erro('A senha deve ter pelo menos 4 caracteres.');
      if (login === ator && (!ativo || perfil !== u.perfil)) return erro('Você não pode desativar nem mudar o perfil da própria conta.');
      const eraGestor = u.perfil === 'GESTOR' && u.ativo;
      if (eraGestor && !(perfil === 'GESTOR' && ativo) && this.ativos('GESTOR').filter((x) => x !== login).length === 0) {
        return erro('Deve existir ao menos um gestor ativo.');
      }
      if (u.perfil === 'TI' && (!ativo || perfil !== 'TI') && this.emAtendimentoDe(login)) {
        return erro('Este técnico está com um chamado em atendimento.');
      }
      u.nome = nome; u.perfil = perfil; u.ativo = ativo;
      if (perfil === 'TI') u.nivel = nivel; else delete u.nivel;
      if (d.senha) u.senha = String(d.senha);
      return ok(`Usuário ${login} atualizado.`);
    }

    /* ---------- notificações e auditoria ---------- */
    notificar(destinatarios, msg, chamadoId) {
      [...new Set(destinatarios)].filter(Boolean).forEach((para) => {
        this.notificacoes.inserir({ id: this.proximoLog++, para, msg, chamado: chamadoId || null, q: Date.now(), lida: false });
        if (this.notificacoes.tamanho > 300) this.notificacoes.removerPrimeiro();
      });
    }
    notificacoesDe(login) { return this.notificacoes.paraArray().filter((n) => n.para === login).reverse(); }
    marcarLidas(login) { this.notificacoes.paraArray().forEach((n) => { if (n.para === login) n.lida = true; }); }

    auditar(ator, acao, detalhe) {
      this.auditoria.inserir({ id: this.proximoLog++, q: Date.now(), usuario: ator.usuario, perfil: ator.perfil, acao, detalhe: String(detalhe || '').slice(0, 200) });
      if (this.auditoria.tamanho > 500) this.auditoria.removerPrimeiro();
    }

    /* ---------- chamados ---------- */
    abrir(cliente, descricao, prioridade, dono, categoria, anexo) {
      const c = criarChamado(this.proximoId, cliente, descricao, prioridade, dono, categoria, anexo);
      if (c === null) return erro('Descreva o problema e selecione categoria e importância.');
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
      registrar(c, 'Enviado ao suporte (fila de nível 1)');
      this.notificar(this.ativos('TI'), `Novo chamado nº ${num(c.id)} (${PRIORIDADE[c.prioridade]}) na fila.`, c.id);
      return ok(`Nº ${num(id)} entrou na fila (posição ${this.fila.tamanho}).`, c);
    }

    emAtendimentoDe(tecnico) {
      return this.cadastro.buscarPor((c) => c.status === 'EM_ATENDIMENTO' && c.tecnico === tecnico);
    }

    // Quem é o próximo da fila PARA este técnico: sênior olha primeiro a fila de nível 2.
    proximoPara(tecnico) {
      const u = this.usuario(tecnico);
      if (u && u.nivel === 'SENIOR' && !this.filaN2.vazia()) return this.filaN2.consultarFrente();
      return this.fila.consultarFrente();
    }

    // O técnico pega um chamado. Enquanto não concluir (ou escalonar), não pode pegar outro.
    pegar(tecnico) {
      const u = this.usuario(tecnico);
      if (!u || u.perfil !== 'TI' || !u.ativo) return erro('Apenas técnicos ativos podem pegar chamados.');
      const atual = this.emAtendimentoDe(tecnico);
      if (atual !== null) return erro(`Conclua primeiro o chamado nº ${num(atual.id)}.`);
      let c;
      if (u.nivel === 'SENIOR' && !this.filaN2.vazia()) c = this.filaN2.desenfileirar();
      else if (!this.fila.vazia()) c = this.fila.desenfileirar();
      else if (!this.filaN2.vazia()) return erro('Só há chamados escalonados, que exigem técnico de nível 2.');
      else return erro('A fila está vazia: nenhum chamado para atender.');
      mudarStatus(c, 'EM_ATENDIMENTO');
      c.tecnico = tecnico; c.tecnicoNome = u.nome;
      registrar(c, `Pego por ${u.nome}`);
      this.notificar([c.dono], `Seu chamado nº ${num(c.id)} foi pego por ${u.nome}.`, c.id);
      return ok(`Nº ${num(c.id)} está em atendimento.`, c);
    }

    // Confirma a resolução: o chamado vai para o histórico (pilha).
    concluir(solucao, tecnico) {
      const c = this.emAtendimentoDe(tecnico);
      if (c === null) return erro('Nenhum chamado em atendimento.');
      if (solucao) c.solucao = String(solucao).trim().slice(0, 100);
      mudarStatus(c, 'CONCLUIDO');
      this.historico.empilhar(c);
      registrar(c, `Concluído por ${c.tecnicoNome}${c.solucao ? '. Solução: ' + c.solucao : ''}`);
      this.notificar([c.dono], `Seu chamado nº ${num(c.id)} foi solucionado. Avalie o atendimento.`, c.id);
      return ok(`Nº ${num(c.id)} solucionado e registrado no histórico.`, c);
    }

    atender(tecnico) { const r = this.pegar(tecnico); return r.ok ? this.concluir('', tecnico) : r; }   // atalho (usado nos testes)

    // Técnico de nível 1 devolve o chamado à fila de nível 2.
    escalar(motivo, tecnico) {
      const u = this.usuario(tecnico);
      if (!u || u.nivel !== 'JUNIOR') return erro('Só técnicos de nível 1 podem escalonar.');
      const c = this.emAtendimentoDe(tecnico);
      if (c === null) return erro('Nenhum chamado em atendimento.');
      motivo = String(motivo || '').trim().slice(0, 150);
      if (!motivo) return erro('Informe o motivo do escalonamento.');
      this.filaN2.enfileirar(c);                                    // entra na fila antes de mudar o status
      mudarStatus(c, 'AGUARDANDO');
      c.nivel = 2;
      registrar(c, `Escalonado para o nível 2 por ${u.nome}. Motivo: ${motivo}`);
      delete c.tecnico; delete c.tecnicoNome;
      this.notificar([...this.ativos('TI', 'SENIOR'), ...this.ativos('GESTOR'), c.dono], `Chamado nº ${num(c.id)} escalonado para o nível 2.`, c.id);
      return ok(`Nº ${num(c.id)} escalonado para o nível 2.`, c);
    }

    // Desfaz o último registro do histórico (pop). Cada técnico só desfaz o próprio registro.
    desfazer(tecnico) {
      const topo = this.historico.consultarTopo();
      if (topo === null) return erro('O histórico está vazio: nada para desfazer.');
      if (tecnico !== undefined && topo.tecnico !== tecnico) return erro(`O último registro é de outro técnico (${topo.tecnicoNome}).`);
      const nome = topo.tecnicoNome;
      const c = this.historico.desempilhar();
      mudarStatus(c, 'ABERTO');                                     // reaberto: o cliente pode enviar de novo
      registrar(c, `Registro desfeito por ${nome}; chamado reaberto`);
      this.notificar([c.dono], `Seu chamado nº ${num(c.id)} foi reaberto.`, c.id);
      return ok(`Nº ${num(c.id)} saiu do histórico e foi reaberto.`, c);
    }

    // Cancelar = remover do cadastro (só o dono, só ABERTO).
    remover(id, dono) {
      const c = this.cadastro.buscar(id);
      if (c === null) return erro(`Chamado nº ${num(id)} não existe.`);
      if (dono !== undefined && c.dono !== dono) return erro('Este chamado não pertence a você.');
      if (c.status !== 'ABERTO') return erro('Só é possível cancelar chamados com status Aberto.');
      this.cadastro.remover(id);
      return ok(`Nº ${num(id)} cancelado.`);
    }

    // Conversa dentro do chamado (cliente dono e técnicos; gestor só lê).
    mensagem(id, autor, texto) {
      const c = this.cadastro.buscar(id);
      if (c === null) return erro(`Chamado nº ${num(id)} não existe.`);
      const permitido = (autor.perfil === 'CLIENTE' && c.dono === autor.usuario) || autor.perfil === 'TI';
      if (!permitido) return erro('Você não pode enviar mensagens neste chamado.');
      if (c.status !== 'AGUARDANDO' && c.status !== 'EM_ATENDIMENTO') return erro('A conversa só fica aberta enquanto o chamado está na fila ou em atendimento.');
      texto = String(texto || '').trim().slice(0, 300);
      if (!texto) return erro('Escreva a mensagem.');
      if (!c.mensagens) c.mensagens = [];
      c.mensagens.push({ de: autor.usuario, nome: autor.nome, perfil: autor.perfil, t: texto, q: Date.now() });
      if (c.mensagens.length > 100) c.mensagens.shift();
      const destino = autor.perfil === 'CLIENTE' ? (c.tecnico ? [c.tecnico] : this.ativos('TI')) : [c.dono];
      this.notificar(destino, `Nova mensagem no chamado nº ${num(c.id)}.`, c.id);
      return ok('Mensagem enviada.', c);
    }

    // O cliente avalia (1 a 5) um chamado seu já concluído; uma única vez.
    avaliar(id, dono, nota) {
      const c = this.cadastro.buscar(id);
      if (c === null) return erro(`Chamado nº ${num(id)} não existe.`);
      if (c.dono !== dono) return erro('Este chamado não pertence a você.');
      if (c.status !== 'CONCLUIDO') return erro('Só é possível avaliar chamados concluídos.');
      if (c.nota) return erro('Este chamado já foi avaliado.');
      if (!Number.isInteger(nota) || nota < 1 || nota > 5) return erro('A nota deve ser de 1 a 5.');
      c.nota = nota;
      registrar(c, `Avaliado pelo cliente: ${nota}/5`);
      return ok(`Obrigado! Nota ${nota} registrada para o nº ${num(id)}.`, c);
    }

    /* ---------- SLA ---------- */
    // Prazo por importância; o relógio começa quando o chamado é enviado ao suporte.
    sla(c, agora) {
      agora = agora === undefined ? Date.now() : agora;
      const prazoMs = this.config.sla[c.prioridade] * 60000;
      if (!c.enviadoEm) return { estado: 'NA', prazoMs, restanteMs: null };
      if (c.status === 'CONCLUIDO') {
        const gasto = c.concluidoEm - c.enviadoEm;
        return { estado: gasto <= prazoMs ? 'CUMPRIDO' : 'VIOLADO', prazoMs, restanteMs: prazoMs - gasto };
      }
      const restanteMs = prazoMs - (agora - c.enviadoEm);
      const estado = restanteMs < 0 ? 'ATRASADO' : restanteMs < prazoMs * 0.25 ? 'ATENCAO' : 'NO_PRAZO';
      return { estado, prazoMs, restanteMs };
    }

    // Avisa uma única vez quando um chamado em andamento estoura o prazo. Retorna true se algo mudou.
    verificarSLA() {
      let mudou = false;
      this.cadastro.paraArray().forEach((c) => {
        if ((c.status === 'AGUARDANDO' || c.status === 'EM_ATENDIMENTO') && !c.slaAlertado && this.sla(c).estado === 'ATRASADO') {
          c.slaAlertado = true;
          registrar(c, 'Prazo de atendimento estourado');
          const sup = c.nivel === 2 ? this.ativos('TI', 'SENIOR') : [];
          this.notificar([...this.ativos('GESTOR'), c.tecnico, ...sup], `Prazo estourado no chamado nº ${num(c.id)}.`, c.id);
          mudou = true;
        }
      });
      return mudou;
    }

    configurarSLA(minutos) {
      const novo = {};
      for (const p of [1, 2, 3]) {
        const m = Number(minutos[p]);
        if (!Number.isInteger(m) || m < 1 || m > 10080) return erro('Cada prazo deve ser um número inteiro de 1 a 10080 minutos.');
        novo[p] = m;
      }
      this.config.sla = novo;
      return ok('Prazos de atendimento atualizados.');
    }

    /* ---------- consultas ---------- */
    buscar(id) { return this.cadastro.buscar(id); }
    meusChamados(dono) { return this.cadastro.paraArray().filter((c) => c.dono === dono); }
    todos() { return this.cadastro.paraArray(); }
    posicao(id) {
      const n2 = this.filaN2.paraArray().findIndex((c) => c.id === id);
      if (n2 >= 0) return { fila: 'N2', pos: n2 + 1 };
      const n1 = this.fila.paraArray().findIndex((c) => c.id === id);
      return n1 >= 0 ? { fila: 'N1', pos: n1 + 1 } : { fila: null, pos: 0 };
    }

    // Indicadores de uma lista de chamados (gráficos do gestor e relatório). O(n).
    indicadores(lista) {
      const conc = lista.filter((c) => c.status === 'CONCLUIDO' && c.concluidoEm);
      const porCategoria = {}, porImportancia = { 3: 0, 2: 0, 1: 0 }, porStatus = { ABERTO: 0, AGUARDANDO: 0, EM_ATENDIMENTO: 0, CONCLUIDO: 0 };
      CATEGORIAS.forEach((k) => { porCategoria[k] = 0; });
      lista.forEach((c) => { porCategoria[c.categoria] = (porCategoria[c.categoria] || 0) + 1; porImportancia[c.prioridade]++; porStatus[c.status]++; });
      const comSla = conc.filter((c) => c.enviadoEm);
      const cumpridos = comSla.filter((c) => this.sla(c).estado === 'CUMPRIDO').length;
      const notas = conc.filter((c) => c.nota).map((c) => c.nota);
      const tecnicos = this.usuarios.paraArray().filter((u) => u.perfil === 'TI').map((u) => {
        const meus = conc.filter((c) => c.tecnico === u.usuario);
        const nt = meus.filter((c) => c.nota).map((c) => c.nota);
        return { usuario: u.usuario, nome: u.nome, nivel: u.nivel, ativo: u.ativo, resolvidos: meus.length,
                 tempoMedioMs: media(meus.filter((c) => c.iniciadoEm).map((c) => c.concluidoEm - c.iniciadoEm)),
                 notaMedia: media(nt), emAtendimento: this.emAtendimentoDe(u.usuario) !== null };
      });
      return {
        total: lista.length, concluidos: conc.length,
        andamento: porStatus.AGUARDANDO + porStatus.EM_ATENDIMENTO,
        atrasados: lista.filter((c) => this.sla(c).estado === 'ATRASADO').length,
        slaPct: comSla.length ? Math.round((cumpridos / comSla.length) * 100) : null, slaAvaliados: comSla.length,
        tempoMedioMs: media(conc.filter((c) => c.enviadoEm).map((c) => c.concluidoEm - c.enviadoEm)),
        notaMedia: media(notas), avaliados: notas.length,
        porCategoria, porImportancia, porStatus, tecnicos
      };
    }
    estatisticas() { return this.indicadores(this.historico.paraArray()); }

    /* ---------- salvar e restaurar ---------- */
    exportar() {
      const ids = (estrutura) => estrutura.paraArray().map((c) => c.id);
      return { v: 2, proximoId: this.proximoId, proximoLog: this.proximoLog, config: this.config,
               chamados: this.cadastro.paraArray(), fila: ids(this.fila), filaN2: ids(this.filaN2),
               historico: ids(this.historico).reverse(),            // da base para o topo
               usuarios: this.usuarios.paraArray(), notificacoes: this.notificacoes.paraArray(), auditoria: this.auditoria.paraArray() };
    }
    static importar(d) {
      const s = new Sistema(true);
      s.proximoId = d.proximoId || 1;
      s.proximoLog = d.proximoLog || 1;
      if (d.config && d.config.sla) s.config.sla = Object.assign({}, SLA_PADRAO, d.config.sla);
      (d.chamados || []).forEach((c) => s.cadastro.inserir(c));
      const achar = (id) => s.cadastro.buscar(id);
      (d.fila || []).forEach((id) => { const c = achar(id); if (c) s.fila.enfileirar(c); });
      (d.filaN2 || []).forEach((id) => { const c = achar(id); if (c) s.filaN2.enfileirar(c); });
      (d.historico || []).forEach((id) => { const c = achar(id); if (c) s.historico.empilhar(c); });
      (d.usuarios && d.usuarios.length ? d.usuarios : USUARIOS_INICIAIS).forEach((u) => s.usuarios.inserir(Object.assign({}, u)));
      (d.notificacoes || []).forEach((n) => s.notificacoes.inserir(n));
      (d.auditoria || []).forEach((a) => s.auditoria.inserir(a));
      return s;
    }
  }

  g.Suporte = Object.assign(g.Suporte || {}, { Sistema, num, USUARIOS_INICIAIS, SLA_PADRAO });
})(window);
