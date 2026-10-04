/* acesso.js - login e permissões por perfil (SIMULADO no navegador, apenas para demonstração).
 * Em um sistema real, usuários e senhas ficam no servidor, com senha criptografada. */
(function (g) {
  const USUARIOS = [
    { usuario: 'ana', senha: '1234', nome: 'Ana Souza', perfil: 'CLIENTE' },
    { usuario: 'bruno', senha: '1234', nome: 'Bruno Lima', perfil: 'CLIENTE' },
    { usuario: 'tecnico', senha: 'ti2026', nome: 'Carlos Mendes', perfil: 'TI' }
  ];
  const PERMISSOES = {
    CLIENTE: ['abrir', 'enviar', 'cancelar', 'verProprios'],
    TI: ['verFila', 'verHistorico', 'pegar', 'concluir', 'desfazer']      // o técnico não cria chamados
  };

  // Retorna a sessão (sem a senha) ou null se usuário/senha estiverem errados.
  function autenticar(usuario, senha) {
    const u = USUARIOS.find((x) => x.usuario === String(usuario).trim().toLowerCase() && x.senha === senha);
    return u ? { usuario: u.usuario, nome: u.nome, perfil: u.perfil } : null;
  }
  function pode(sessao, acao) { return !!sessao && PERMISSOES[sessao.perfil].includes(acao); }

  g.Suporte = Object.assign(g.Suporte || {}, { autenticar, pode, USUARIOS_DEMO: USUARIOS.map(({ usuario, senha, perfil }) => ({ usuario, senha, perfil })) });
})(window);
