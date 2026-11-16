/* Artes & Sonhos — juntar ao pedido: o formulário da ficha (os cartões não compram: o cartão inteiro
   leva à ficha, onde se escreve o nome e o tema). Depois de juntar: o saco do cabeçalho conta mais uma
   e aparece o recado com «Ver o pedido». */
(function () {
  'use strict';
  const { $, $$, esc, catalogo, miniaturaHtml, hojeLisboa, isoDe } = window.AS;

  /* Liga um formulário de juntar: o total ao vivo, os erros junto do campo, e o juntar. */
  function ligar(form) {
    const slug = form.dataset.juntarForm;
    const minimo = Number(form.dataset.minimo) || 1;
    const erro = $('[data-erro]', form);
    const total = $('[data-total]', form);
    const botao = $('button[type="submit"]', form);
    const escolhas = () => $$('[data-escolha]', form).map((f) => Number(($('input:checked', f) || {}).value || 0));
    const quantidade = () => Math.min(999, Math.max(minimo, parseInt(form.elements.quantidade.value, 10) || minimo));
    const mostrarTotal = async () => {
      const q = quantidade();
      const passo = $('[data-passo]', form);
      if (passo) { $('[data-menos]', passo).disabled = q <= minimo; $('[data-mais]', passo).disabled = q >= 999; }
      const t = await window.AS.carrinho.totalDe({ produto: slug, opcoes: escolhas(), qtd: q });
      total.textContent = t && q > 1 ? `Total: ${t}` : '';
    };
    form.addEventListener('input', mostrarTotal);
    form.addEventListener('change', mostrarTotal);
    form.elements.quantidade.addEventListener('blur', () => { form.elements.quantidade.value = quantidade(); mostrarTotal(); });
    mostrarTotal();
    /* A frase do erro aparece junto ao campo que falta: por baixo do botão ficava fora do ecrã. */
    const errar = (campo, texto) => {
      erro.textContent = texto;
      const sitio = campo && campo.closest('.campo');
      if (sitio) sitio.append(erro); else botao.before(erro);
      erro.hidden = false;
      if (campo) { campo.setAttribute('aria-invalid', 'true'); campo.focus(); }
    };
    form.addEventListener('input', (ev) => { if (ev.target.hasAttribute('aria-invalid')) ev.target.removeAttribute('aria-invalid'); erro.hidden = true; });
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      erro.hidden = true;
      $$('[aria-invalid]', form).forEach((i) => i.removeAttribute('aria-invalid'));
      const pers = {};
      for (const k of ['nome', 'data', 'frase']) {
        const i = form.elements[k];
        if (!i) continue;
        let v = i.value.trim();
        const rotulo = ($(`label[for="${i.id}"]`, form).firstChild.textContent || '').trim();
        if (i.required && !v) { errar(i, k === 'data' ? `Escolha a ${rotulo.toLowerCase()}.` : `Falta preencher: ${rotulo.toLowerCase()}.`); return; }
        // a data escreve-se dd/mm/aaaa e guarda-se aaaa-mm-dd (a mensagem diz «12 de dezembro de 2026»)
        if (k === 'data' && v) {
          const iso = isoDe(v);
          if (iso === null) { errar(i, 'Essa data não existe.'); return; }
          if (!iso) { errar(i, 'Escreva a data assim: 12/12/2026.'); return; }
          if (iso < hojeLisboa()) { errar(i, 'Essa data já passou.'); return; }
          v = iso;
        }
        if (v) pers[k] = v;
      }
      const q = quantidade();
      const { nova } = window.AS.carrinho.juntar({ produto: slug, opcoes: escolhas(), pers, qtd: q });
      for (const k of ['nome', 'data', 'frase']) if (form.elements[k]) form.elements[k].value = '';
      form.elements.quantidade.value = minimo;
      mostrarTotal();
      juntou(slug, q, nova);
    });
  }

  /* Depois de juntar: o recado com a fotografia e «Ver o pedido» («Novo pedido» quando o anterior já
     tinha seguido). */
  async function juntou(slug, q, nova = false) {
    let cat = null;
    try { cat = await catalogo(); } catch (_) { /* sem catálogo, o recado vai sem fotografia */ }
    const p = cat && cat.produtos[slug];
    const destino = (cat && cat.encomenda) || `${document.body.dataset.base}pedido/`;
    window.AS.recado(`${p ? miniaturaHtml(cat, p.img, 44) : ''}<span class="recado__texto"><strong>${nova ? 'Novo pedido' : 'Juntou-se ao pedido'}</strong>${p ? `<span>${q > 1 ? `${q} × ` : ''}${esc(p.curto || p.nome)}</span>` : ''}</span><a href="${esc(destino)}">Ver o pedido</a>`);
  }

  $$('form[data-juntar-form]').forEach((f) => ligar(f));

  // o catálogo vem quando o browser está livre: a procura abre logo
  const depois = window.requestIdleCallback || ((f) => window.setTimeout(f, 1200));
  depois(() => { catalogo().catch(() => {}); });
})();
