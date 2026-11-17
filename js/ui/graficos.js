/* ui/graficos.js - gráficos em SVG escrito à mão (sem bibliotecas), com tooltip e "Ver tabela". */
(function (g) {
  const { UI } = g.Suporte;
  const esc = UI.esc;
  const NS = 'http://www.w3.org/2000/svg';

  function passo(max) {            // passo "bonito" para o eixo de contagens
    const bruto = Math.max(1, Math.ceil(max / 4));
    for (const b of [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]) if (b >= bruto) return b;
    return bruto;
  }
  // barra com 4px arredondados só na ponta dos dados (direita)
  function barraH(x, y, w, h) {
    if (w <= 0) return '';
    const r = Math.min(4, w, h / 2);
    return `M${x},${y}h${w - r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 -${r},${r}h-${w - r}z`;
  }
  // barra vertical com 4px arredondados só no topo
  function barraV(x, y, w, h) {
    if (h <= 0) return '';
    const r = Math.min(4, w / 2, h);
    return `M${x},${y + h}v-${h - r}a${r},${r} 0 0 1 ${r},-${r}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - r}z`;
  }
  const tip = (titulo, linhas) => esc(JSON.stringify({ t: titulo, l: linhas }));

  function cartao(titulo, svg, cabecalhoTabela, linhasTabela, legenda, desc) {
    const el = document.createElement('section'); el.className = 'painel viz';
    const tab = `<table><thead><tr>${cabecalhoTabela.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${linhasTabela.map((l) => `<tr>${l.map((c) => `<td class="num">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    el.innerHTML = `<div class="viz-cab"><h3>${esc(titulo)}</h3><button type="button" class="btn sec mini" aria-pressed="false">Ver tabela</button></div>
      ${legenda || ''}<div class="viz-corpo"><div class="viz-graf" role="img" aria-label="${esc(desc || titulo)}">${svg}</div><div class="tabela viz-tab" hidden>${tab}</div></div>`;
    const bt = el.querySelector('button'), graf = el.querySelector('.viz-graf'), t = el.querySelector('.viz-tab');
    bt.addEventListener('click', () => {
      const ver = t.hidden; t.hidden = !ver; graf.hidden = ver; bt.setAttribute('aria-pressed', String(ver)); bt.textContent = ver ? 'Ver gráfico' : 'Ver tabela';
    });
    return el;
  }

  /* Barras horizontais: itens = [{nome, valor}] (uma série, cor 1) */
  function barras(titulo, itens, unidade) {
    const W = 460, X0 = 128, XF = 410, H = 26, B = 18;
    const max = Math.max(1, ...itens.map((i) => i.valor)), st = passo(max), topo = st * Math.ceil(max / st);
    const esc_ = (v) => X0 + (v / topo) * (XF - X0);
    const alt = itens.length * H + 22;
    let s = `<svg viewBox="0 0 ${W} ${alt}" xmlns="${NS}" aria-hidden="true">`;
    for (let v = 0; v <= topo; v += st) {
      const x = esc_(v);
      s += `<line x1="${x}" y1="0" x2="${x}" y2="${itens.length * H}" stroke="var(--${v === 0 ? 'base' : 'grid'})" stroke-width="1"/><text x="${x}" y="${itens.length * H + 15}" text-anchor="middle" font-size="11" fill="var(--mu)">${v}</text>`;
    }
    itens.forEach((it, i) => {
      const y = i * H + (H - B) / 2;
      s += `<text x="${X0 - 10}" y="${y + B / 2 + 4}" text-anchor="end" font-size="12.5" fill="var(--tx2)">${esc(it.nome)}</text>`;
      s += `<path class="f-s1" d="${barraH(X0, y, esc_(it.valor) - X0, B)}"/>`;
      s += `<text x="${esc_(it.valor) + 6}" y="${y + B / 2 + 4}" font-size="12" font-weight="600" fill="var(--tx)">${it.valor}</text>`;
      s += `<rect class="hit" x="0" y="${i * H}" width="${W}" height="${H}" tabindex="0" data-tip="${tip(it.nome, [{ k: 's1', n: unidade || 'Chamados', v: it.valor }])}"/>`;
    });
    s += '</svg>';
    return cartao(titulo, s, ['Item', unidade || 'Chamados'], itens.map((i) => [i.nome, i.valor]), '', `${titulo}: ` + itens.map((i) => `${i.nome} ${i.valor}`).join(', '));
  }

  /* Colunas agrupadas, duas séries: a = Abertos (cor 1), b = Concluídos (cor 2) */
  function colunas2(titulo, rotulos, a, b) {
    const W = 460, H = 200, X0 = 30, X1 = 452, Y0 = 8, Y1 = 168;
    const max = Math.max(1, ...a.valores, ...b.valores), st = passo(max), topo = st * Math.ceil(max / st);
    const y = (v) => Y1 - (v / topo) * (Y1 - Y0);
    const n = rotulos.length, bw = (X1 - X0) / n, w = Math.max(3, Math.min(24, (bw - 6) / 2 - 1));
    const cada = Math.ceil(n / 7);
    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="${NS}" aria-hidden="true">`;
    for (let v = 0; v <= topo; v += st) {
      s += `<line x1="${X0}" y1="${y(v)}" x2="${X1}" y2="${y(v)}" stroke="var(--${v === 0 ? 'base' : 'grid'})" stroke-width="1"/><text x="${X0 - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--mu)">${v}</text>`;
    }
    rotulos.forEach((r, i) => {
      const cx = X0 + bw * i + bw / 2;
      const x1 = cx - w - 1, x2 = cx + 1;
      s += `<path class="f-s1" d="${barraV(x1, y(a.valores[i]), w, Y1 - y(a.valores[i]))}"/><path class="f-s2" d="${barraV(x2, y(b.valores[i]), w, Y1 - y(b.valores[i]))}"/>`;
      if (i % cada === 0) s += `<text x="${cx}" y="${Y1 + 16}" text-anchor="middle" font-size="11" fill="var(--mu)">${esc(r)}</text>`;
      s += `<rect class="hit" x="${X0 + bw * i}" y="${Y0}" width="${bw}" height="${Y1 - Y0}" tabindex="0" data-tip="${tip(r, [{ k: 's1', n: a.nome, v: a.valores[i] }, { k: 's2', n: b.nome, v: b.valores[i] }])}"/>`;
    });
    s += '</svg>';
    const leg = `<div class="legenda"><span><i class="k-s1"></i>${esc(a.nome)}</span><span><i class="k-s2"></i>${esc(b.nome)}</span></div>`;
    return cartao(titulo, s, ['Período', a.nome, b.nome], rotulos.map((r, i) => [r, a.valores[i], b.valores[i]]), leg,
      `${titulo}: ` + rotulos.map((r, i) => `${r}: ${a.valores[i]} abertos, ${b.valores[i]} concluídos`).join('; '));
  }

  /* ---------- tooltip único e delegado (só textContent) ---------- */
  function ligarTooltip() {
    const t = UI.$('tip');
    const mostrar = (e) => {
      const alvo = e.target.closest && e.target.closest('[data-tip]');
      if (!alvo) { t.hidden = true; return; }
      let d; try { d = JSON.parse(alvo.dataset.tip); } catch (x) { return; }
      t.textContent = '';
      const h = document.createElement('div'); h.className = 't-tit'; h.textContent = d.t; t.appendChild(h);
      d.l.forEach((l) => {
        const r = document.createElement('div'); r.className = 't-lin';
        const k = document.createElement('span'); k.className = 't-key k-' + l.k; r.appendChild(k);
        const v = document.createElement('b'); v.textContent = String(l.v); r.appendChild(v);
        r.appendChild(document.createTextNode(' ' + l.n));
        t.appendChild(r);
      });
      t.hidden = false;
      const b = alvo.getBoundingClientRect();
      const px = e.type === 'focusin' ? b.left + b.width / 2 : e.clientX;
      const py = e.type === 'focusin' ? b.top : e.clientY;
      const tw = t.offsetWidth, th = t.offsetHeight;
      t.style.left = Math.max(8, Math.min(innerWidth - tw - 8, px + 14)) + 'px';
      t.style.top = Math.max(8, py - th - 12 < 8 ? py + 18 : py - th - 12) + 'px';
    };
    document.addEventListener('mousemove', mostrar);
    document.addEventListener('focusin', mostrar);
    document.addEventListener('focusout', () => { t.hidden = true; });
    document.addEventListener('scroll', () => { t.hidden = true; }, true);
  }

  Object.assign(UI, { barras, colunas2, ligarTooltip });
})(window);
