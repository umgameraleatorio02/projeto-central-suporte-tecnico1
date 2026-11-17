/* app.js - ponto de entrada: login, contas de demonstração e ligação da interface. */
(function (g) {
  const { UI, Sistema, USUARIOS_INICIAIS, PERFIL_NOME } = g.Suporte;
  const { $ } = UI;

  function iniciar() {
    UI.iniciarTema(); UI.ligarGeral(); UI.ligarDetalhe(); UI.ligarTooltip();
    $('demo').innerHTML = '<tr><th>E-mail</th><th>Senha</th><th>Perfil</th></tr>' + USUARIOS_INICIAIS.map((u) =>
      `<tr><td>${u.usuario}</td><td>${u.senha}</td><td>${PERFIL_NOME[u.perfil]}${u.nivel ? ' (' + (u.nivel === 'SENIOR' ? 'nível 2' : 'nível 1') + ')' : ''}</td></tr>`).join('');

    // Enter no usuário passa para a senha (não tenta entrar ainda)
    $('l-user').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('l-pass').focus(); } });
    $('f-login').addEventListener('submit', (e) => {
      e.preventDefault();
      const login = $('l-user').value.trim().toLowerCase(), senha = $('l-pass').value;
      if (!login) { $('l-erro').textContent = 'Informe o e-mail.'; $('l-user').focus(); return; }
      if (!senha) { $('l-erro').textContent = ''; $('l-pass').focus(); return; }
      UI.recarregar();
      const r = UI.sis.autenticar(login, senha);
      if (!r.ok) {
        $('l-erro').textContent = r.msg || 'Usuário ou senha inválidos.';
        UI.sis.auditar({ usuario: login.slice(0, 60), perfil: '' }, 'login-falhou', 'Tentativa de acesso recusada'); UI.salvar();
        $('l-pass').value = ''; $('l-pass').focus(); return;
      }
      UI.sis.auditar(r.usuario, 'login', 'Entrou no sistema'); UI.salvar();
      $('f-login').reset(); $('l-erro').textContent = '';
      UI.entrar(r.usuario);
    });
    $('b-sair').addEventListener('click', () => { UI.recarregar(); UI.sis.auditar(UI.sessao, 'logout', 'Saiu do sistema'); UI.salvar(); UI.sair(); });
    const zerar = (pergunta, criar, msg) => () => {
      if (!confirm(pergunta)) return;
      UI.sis = criar(); UI.salvar(); UI.avisar(msg);
    };
    $('b-reset').addEventListener('click', zerar('Apagar os dados atuais e restaurar os chamados de exemplo?', () => Sistema.comDemonstracao(), 'Exemplos restaurados.'));
    $('b-vazio').addEventListener('click', zerar('Apagar os dados atuais e começar sem nenhum chamado?', () => new Sistema(), 'Sistema limpo (só as contas de demonstração).'));
    UI.restaurarSessao();
  }
  document.addEventListener('DOMContentLoaded', iniciar);
})(window);
