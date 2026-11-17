/* acesso.js - permissões por perfil e menus (SIMULADO no navegador, apenas para demonstração).
 * Em um sistema real, usuários e senhas ficam no servidor, com senha criptografada.
 * A autenticação em si está em Sistema.autenticar(); aqui ficam só as regras do que cada perfil pode fazer. */
(function (g) {
  const PERMISSOES = {
    CLIENTE: ['abrir', 'enviar', 'cancelar', 'avaliar', 'conversar', 'detalhe'],
    TI: ['verFila', 'pegar', 'concluir', 'escalar', 'desfazer', 'conversar', 'detalhe', 'exportar'],
    GESTOR: ['dashboard', 'verTodos', 'usuarios', 'config', 'auditoria', 'relatorio', 'exportar', 'detalhe']
  };
  const PERFIL_NOME = { CLIENTE: 'Cliente', TI: 'Técnico de TI', GESTOR: 'Gestor' };
  const MENUS = {
    CLIENTE: [{ id: 'chamados', nome: 'Meus chamados' }],
    TI: [{ id: 'painel', nome: 'Painel de atendimento' }],
    GESTOR: [{ id: 'visao', nome: 'Visão geral' }, { id: 'chamados', nome: 'Todos os chamados' }, { id: 'usuarios', nome: 'Usuários' },
             { id: 'config', nome: 'Configurações' }, { id: 'auditoria', nome: 'Auditoria' }]
  };
  function pode(sessao, acao) { return !!sessao && !!PERMISSOES[sessao.perfil] && PERMISSOES[sessao.perfil].includes(acao); }
  g.Suporte = Object.assign(g.Suporte || {}, { pode, PERFIL_NOME, MENUS, PERMISSOES });
})(window);
