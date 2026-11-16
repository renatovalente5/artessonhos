/* Artes & Sonhos — a interface: o menu e a procura (dialog nativo: o foco fica lá dentro e o Esc
   fecha), as entradas ao descer, as pastilhas das categorias, a galeria da ficha, os passos (+ / −), o
   campo das datas e o botão flutuante do WhatsApp. */
(function () {
  'use strict';
  const { $, $$, menosMovimento } = window.AS;

  /* ---------- O aviso do topo com data: sai sozinho no dia seguinte ---------- */
  $$('.aviso[data-ate]').forEach((a) => { if (window.AS.hojeLisboa() > a.dataset.ate) a.hidden = true; });

  /* ---------- Os painéis: o menu e a procura ---------- */
  // Um clique no fundo fecha; o foco volta ao botão que o abriu; enquanto um está aberto, a página de
  // trás não rola (no iPhone, um menu que cabe todo passava o gesto à página: memória menu-ecra-inteiro-ios).
  // O Chrome repõe um <dialog> aberto ao voltar atrás: fecha-se à chegada.
  const origens = new WeakMap();
  const raiz = document.documentElement;
  function abrir(dialogo, origem) {
    if (!dialogo) return;
    if (origem) origens.set(dialogo, origem);
    if (!dialogo.open) dialogo.showModal();
    raiz.classList.add('menu-aberto');
    const botao = origem && origem.getAttribute('aria-controls') === dialogo.id ? origem : null;
    if (botao) botao.setAttribute('aria-expanded', 'true');
    dialogo.dispatchEvent(new CustomEvent('as:aberto'));
  }
  function fechar(dialogo) {
    if (dialogo && dialogo.open) dialogo.close();
  }
  $$('dialog').forEach((d) => {
    if (d.open) d.close();
    d.addEventListener('cancel', (ev) => { ev.preventDefault(); fechar(d); });
    d.addEventListener('click', (ev) => {
      if (ev.target === d) { fechar(d); return; }
      if (ev.target.closest('[data-fechar]')) fechar(d);
    });
    d.addEventListener('close', () => {
      if (!$('dialog[open]')) raiz.classList.remove('menu-aberto');
      $$(`[aria-controls="${d.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'false'));
      const o = origens.get(d);
      if (o && document.contains(o)) o.focus({ preventScroll: true });
      d.dispatchEvent(new CustomEvent('as:fechado'));
    });
  });
  window.addEventListener('pageshow', (ev) => { if (ev.persisted) $$('dialog[open]').forEach((d) => d.close()); });
  const botaoMenu = $('#abrir-menu');
  const botaoProcura = $('#abrir-procura');
  if (botaoMenu) botaoMenu.addEventListener('click', () => abrir($('#gaveta'), botaoMenu));
  if (botaoProcura) botaoProcura.addEventListener('click', () => abrir($('#procura'), botaoProcura));
  window.AS.paineis = { abrir, fechar };

  /* ---------- Entradas ao descer (como a Apple, memória efeitos-ao-descer-como-a-apple) ---------- */
  // Só o que está abaixo do primeiro ecrã quando o script corre (o primeiro ecrã nunca pisca); numa fila
  // que desliza de lado entra a fila inteira; sem JS ou com «reduzir movimento», está tudo à vista.
  const ALVOS = '.linha-cartao, .destaque__foto, .destaque__texto, .passo, .artigo, .opinioes, .garantia, .circulos, .bloco__cabeca';
  if ('IntersectionObserver' in window && !menosMovimento.matches) {
    const alto = window.innerHeight;
    const desliza = (el) => el.scrollWidth > el.clientWidth + 2;
    const alvos = new Set();
    $$(ALVOS).forEach((el) => {
      if (el.parentElement.closest(ALVOS)) return;
      const fila = el.parentElement;
      const alvo = fila && getComputedStyle(fila).overflowX === 'auto' && desliza(fila) ? fila : el;
      const r = alvo.getBoundingClientRect();
      if (r.top >= alto && r.width > 0) alvos.add(alvo);
    });
    const observador = new IntersectionObserver((entradas) => {
      let n = 0;
      entradas.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.style.setProperty('--d', `${Math.min(n++, 5) * 0.09}s`);
        en.target.classList.add('is-visivel');
        observador.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    alvos.forEach((el) => { el.classList.add('revela'); observador.observe(el); });
  }

  /* ---------- As pastilhas: a da página aberta fica à vista (no telemóvel deslizam de lado) ---------- */
  const fila = $('.pastilhas');
  const aberta = fila && $('[aria-current="page"]', fila);
  if (aberta && fila.scrollWidth > fila.clientWidth && !document.documentElement.hasAttribute('data-lugar-da-loja')) {
    const li = aberta.parentElement;
    fila.scrollLeft = li.offsetLeft - (fila.clientWidth - li.offsetWidth) / 2;
  }

  /* ---------- Galeria da ficha: as miniaturas escolhem a fotografia ---------- */
  $$('[data-galeria]').forEach((g) => {
    const pista = $('.galeria__pista', g);
    const minis = $$('[data-foto]', g);
    if (!minis.length) return;
    minis.forEach((b) => b.addEventListener('click', () => {
      pista.scrollTo({ left: Number(b.dataset.foto) * pista.clientWidth, behavior: menosMovimento.matches ? 'auto' : 'smooth' });
    }));
    pista.addEventListener('scroll', () => {
      const i = Math.round(pista.scrollLeft / pista.clientWidth);
      minis.forEach((b, n) => (n === i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
    }, { passive: true });
  });

  /* ---------- Os passos (+ / −) do formulário de juntar (os das linhas do pedido são do carrinho) ---------- */
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-passo] [data-mais], [data-passo] [data-menos]');
    if (!b) return;
    const input = $('input', b.closest('[data-passo]'));
    const minimo = Number(input.min) || 1;
    const n = Math.min(999, Math.max(minimo, (parseInt(input.value, 10) || minimo) + (b.hasAttribute('data-mais') ? 1 : -1)));
    input.value = n;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  /* ---------- A data: escreve-se dd/mm/aaaa, ou escolhe-se no calendário ---------- */
  // O campo é de texto (a data aparece sempre como em Portugal); o calendário é o do sistema, num
  // <input type="date"> invisível por cima do ícone, sem os dias que já passaram.
  function ligarDatas(raizDatas = document) {
    $$('[data-data]', raizDatas).forEach((caixa) => {
      if (caixa.dataset.ligada) return;
      caixa.dataset.ligada = '1';
      const { hojeLisboa, isoDe, dataCurta } = window.AS;
      const texto = $('input[type="text"]', caixa);
      const nativa = $('input[type="date"]', caixa);
      texto.addEventListener('input', (ev) => {
        if (ev.inputType !== 'insertText' || texto.selectionStart !== texto.value.length) return;
        let v = texto.value.replace(/\/{2,}/g, '/');
        if (/^\d{2}$|^\d{1,2}\/\d{2}$/.test(v)) v += '/';
        if (v !== texto.value) texto.value = v;
      });
      texto.addEventListener('blur', () => { const iso = isoDe(texto.value); if (iso) texto.value = dataCurta(iso); });
      const preparar = () => { nativa.min = hojeLisboa(); nativa.value = isoDe(texto.value) || ''; };
      nativa.addEventListener('pointerdown', (ev) => {
        preparar();
        if (typeof nativa.showPicker !== 'function' && ev.pointerType === 'mouse') { ev.preventDefault(); texto.focus(); }
      });
      nativa.addEventListener('focus', preparar);
      nativa.addEventListener('click', () => {
        if (typeof nativa.showPicker === 'function') { try { nativa.showPicker(); } catch (_) { /* o browser abre-o sozinho */ } }
      });
      const escolhida = () => {
        if (!nativa.value) return;
        texto.value = dataCurta(nativa.value);
        texto.dispatchEvent(new Event('input', { bubbles: true }));
      };
      nativa.addEventListener('input', escolhida);
      nativa.addEventListener('change', escolhida);
    });
  }
  ligarDatas();
  window.AS.ligarDatas = ligarDatas;

  /* ---------- O botão do WhatsApp: aparece depois de descer 200 px, e sai da frente do formulário ---------- */
  const whats = $('[data-flutua]');
  if (whats) {
    whats.hidden = false;
    let pedido = false;
    let sobreForm = false;
    const ver = () => {
      pedido = false;
      const y = window.scrollY;
      const mostra = (y > 200 || (y > 120 && !whats.classList.contains('is-escondido'))) && !sobreForm;
      whats.classList.toggle('is-escondido', !mostra);
      if (mostra) whats.removeAttribute('tabindex'); else whats.setAttribute('tabindex', '-1');
    };
    window.addEventListener('scroll', () => { if (!pedido) { pedido = true; window.requestAnimationFrame(ver); } }, { passive: true });
    const form = $('form.juntar');
    if (form && 'IntersectionObserver' in window) {
      const estreito = window.matchMedia('(max-width: 899px)');
      new IntersectionObserver((e) => { sobreForm = estreito.matches && e.some((x) => x.isIntersecting); ver(); }).observe(form);
    }
    ver();
  }
})();
