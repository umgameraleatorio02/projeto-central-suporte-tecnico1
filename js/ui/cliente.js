/* ui/cliente.js - tela do cliente: abrir, enviar, cancelar, acompanhar e avaliar chamados. */
(function (g) {
  const { UI, CATEGORIAS, anexoValido } = g.Suporte;
  const { esc, num, dataHora, pill, pri, slaBadge, estrelas } = UI;
  let anexo = null;

  // reduz a imagem (máx. 900 px, JPEG) para caber no armazenamento do navegador
  function reduzir(arq, cb) {
    if (!/^image\/(png|jpeg)$/.test(arq.type)) { UI.avisar('Anexe uma imagem PNG ou JPG.', true); return cb(null); }
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 900 / Math.max(img.width, img.height));
        const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        const url = cv.toDataURL('image/jpeg', 0.72);
        if (!anexoValido(url)) { UI.avisar('Imagem grande demais, escolha outra menor.', true); return cb(null); }
        cb(url);
      };
      img.onerror = () => { UI.avisar('Não foi possível ler a imagem.', true); cb(null); };
      img.src = fr.result;
    };
    fr.onerror = () => cb(null);
    fr.readAsDataURL(arq);
  }

  function montar(el) {
    anexo = null;
    el.innerHTML = `<h2 class="pg">Meus chamados</h2>
    <form id="f-novo" class="painel" novalidate>
      <h3>Abrir novo chamado</h3>
      <div class="grade2">
        <label style="grid-column:1/-1">Descreva o problema<input id="n-desc" maxlength="120" placeholder="Ex.: Impressora do 2º andar não imprime"></label>
        <label>Categoria<select id="n-cat"><option value="">Selecione...</option>${CATEGORIAS.map((c) => `<option>${esc(c)}</option>`).join('')}</select></label>
        <fieldset class="imp"><legend>Importância</legend><div class="opcoes">
          <label class="seg"><input type="radio" name="imp" value="3"><span>Alta</span></label>
          <label class="seg"><input type="radio" name="imp" value="2"><span>Média</span></label>
          <label class="seg"><input type="radio" name="imp" value="1"><span>Baixa</span></label></div></fieldset>
      </div>
      <div class="anexo-linha"><label>Anexar print (opcional)<input id="n-arq" type="file" accept="image/png,image/jpeg"></label>
        <img id="n-prev" class="anexo-prev" alt="Prévia do anexo" hidden><button id="n-tirar" class="btn sec mini" type="button" hidden>Remover anexo</button></div>
      <div class="acoes" style="margin-top:14px"><button class="btn" type="submit">Criar chamado</button></div>
      <p id="n-erro" class="erro" role="alert"></p>
    </form>
    <section class="painel"><div class="cab"><h3>Acompanhamento</h3></div>${UI.filtrosHTML('fc')}<div class="tabela"><table><thead><tr><th>Nº</th><th>Descrição</th><th>Categoria</th><th>Importância</th><th>Status</th><th>Prazo</th><th>Atendimento</th><th>Ações</th></tr></thead><tbody id="t-meus"></tbody></table></div></section>`;
    const $$ = (s) => el.querySelector(s);
    $$('#n-arq').addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      reduzir(f, (url) => { anexo = url; $$('#n-prev').hidden = !url; $$('#n-tirar').hidden = !url; if (url) $$('#n-prev').src = url; else e.target.value = ''; });
    });
    $$('#n-tirar').addEventListener('click', () => { anexo = null; $$('#n-arq').value = ''; $$('#n-prev').hidden = true; $$('#n-tirar').hidden = true; });
    $$('#f-novo').addEventListener('submit', (e) => {
      e.preventDefault();
      const imp = el.querySelector('input[name=imp]:checked');
      const desc = $$('#n-desc').value.trim(), cat = $$('#n-cat').value;
      const falta = !desc ? 'Descreva o problema.' : !cat ? 'Selecione a categoria do chamado.' : !imp ? 'Selecione a importância do chamado.' : '';
      $$('#n-erro').textContent = falta;
      if (falta) { UI.avisar(falta, true); return; }
      const r = UI.agir('abrir', (s) => s.abrir(UI.sessao.nome, desc, Number(imp.value), UI.sessao.usuario, cat, anexo));
      if (r && r.ok) {
        $$('#f-novo').reset(); anexo = null; $$('#n-prev').hidden = true; $$('#n-tirar').hidden = true;   // importância e categoria voltam a "sem seleção"
        $$('#n-desc').focus();
      }
    });
    UI.ligarFiltros(el, 'fc', () => atualizar(el));
    $$('#t-meus').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const id = Number(b.dataset.id);
      if (b.dataset.a === 'det') UI.abrirDetalhe(id);
      else if (b.dataset.a === 'env') UI.agir('enviar', (s) => s.enfileirar(id, UI.sessao.usuario));
      else if (b.dataset.a === 'can') { if (confirm(`Cancelar o chamado nº ${num(id)}?`)) UI.agir('cancelar', (s) => s.remover(id, UI.sessao.usuario)); }
      else if (b.dataset.a === 'nota') UI.agir('avaliar', (s) => s.avaliar(id, UI.sessao.usuario, Number(b.dataset.n)));
    });
  }

  function atualizar(el) {
    const todos = UI.sis.meusChamados(UI.sessao.usuario).reverse();
    const lista = UI.filtrar(todos, el, 'fc');
    const corpo = el.querySelector('#t-meus');
    corpo.innerHTML = lista.length ? lista.map((c) => {
      const f = UI.sis.posicao(c.id);
      const atend = c.tecnicoNome ? esc(c.tecnicoNome) : f.fila ? `Fila ${f.fila} · posição ${f.pos}` : '—';
      let acoes = `<button class="btn sec mini" data-a="det" data-id="${c.id}">Detalhes</button>`;
      if (c.status === 'ABERTO') acoes += ` <button class="btn mini" data-a="env" data-id="${c.id}">Enviar ao suporte</button> <button class="btn perigo mini" data-a="can" data-id="${c.id}">Cancelar</button>`;
      if (c.status === 'CONCLUIDO') acoes += c.nota ? ` ${estrelas(c.nota)}` : ` <span class="nota-bt" role="group" aria-label="Avaliar de 1 a 5">${[1, 2, 3, 4, 5].map((n) => `<button class="btn sec mini" data-a="nota" data-id="${c.id}" data-n="${n}" aria-label="Nota ${n}">${n}★</button>`).join('')}</span>`;
      return `<tr class="${UI.destaque === c.id ? 'novo' : ''}"><td class="num">${num(c.id)}</td><td>${esc(c.descricao)}</td><td>${esc(c.categoria)}</td><td>${pri(c.prioridade)}</td><td>${pill(c.status)}</td><td>${slaBadge(c)}</td><td>${atend}</td><td><div class="acoes">${acoes}</div></td></tr>`;
    }).join('') : `<tr><td class="v" colspan="8">${todos.length ? 'Nenhum chamado com esses filtros.' : 'Você ainda não abriu chamados.'}</td></tr>`;
  }
  UI.registrar('CLIENTE', { montar, atualizar });
})(window);
