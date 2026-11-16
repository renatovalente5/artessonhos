/* Artes & Sonhos — o pedido.
   Não há pagamentos no site: o pedido junta as peças (com a personalização e as escolhas de cada uma),
   soma os portes da entrega escolhida e, no fim, envia o pedido escrito por um de três caminhos: o
   WhatsApp (quando a loja tiver número), o Instagram (a mensagem copia-se e abre-se a conversa: o
   Instagram não deixa escrever por uma ligação) ou o email. Nada sai do aparelho da pessoa até ela
   enviar a mensagem. No browser («artessonhos:pedido») fica só o pedido — as peças, a personalização, as
   quantidades e a entrega — e, depois de abrir a conversa, a hora e o caminho, para a página dizer
   «Pedido pronto a enviar» quando a pessoa volta; nunca o nome nem a morada.
   Os preços nunca se guardam: lêem-se sempre do catálogo publicado, para um preço mudado no painel
   valer logo. Sem preço, «sob consulta»: o preço diz-se na resposta. */
(function () {
  'use strict';
  const { $, $$, esc, euros, dataPorExtenso, ico, guardado, precoDe, catalogo, miniaturaHtml } = window.AS;
  const CHAVE = 'artessonhos:pedido';
  const MAX_QTD = 999;
  const CAMPOS = ['nome', 'data', 'frase'];

  // ---------------------------------------------------------------- estado
  const linhaValida = (l) => l && typeof l.produto === 'string' && Number.isInteger(l.qtd) && l.qtd > 0;
  function ler() {
    const e = guardado.ler(CHAVE, null);
    if (e && e.v === 1 && Array.isArray(e.linhas)) {
      e.linhas = e.linhas.filter(linhaValida).map((l) => ({ ...l, opcoes: Array.isArray(l.opcoes) ? l.opcoes : [], pers: l.pers && typeof l.pers === 'object' ? l.pers : {} }));
      if (typeof e.zona !== 'string') e.zona = 'levantamento';
      if (!(e.enviada && typeof e.enviada.em === 'string' && typeof e.enviada.encomenda === 'string')) delete e.enviada;
      else if (!['whatsapp', 'instagram', 'email'].includes(e.enviada.canal)) e.enviada.canal = 'whatsapp';
      return e;
    }
    return { v: 1, linhas: [], zona: 'levantamento' };
  }
  let estado = ler();
  // «B & A» e «b & a» são duas linhas: a peça leva o nome exatamente como foi escrito (os termos dizem-no)
  const chaveLinha = (l) => JSON.stringify([l.produto, l.opcoes || [], CAMPOS.map((k) => String((l.pers || {})[k] || '').trim())]);
  /* «Encomenda enviada» vale para ESTA encomenda: mudar uma peça, a quantidade ou a entrega apaga a
     marca (a encomenda que seguiu já não é esta), e ao fim de 14 dias também. */
  const assinatura = () => JSON.stringify([estado.linhas.map((l) => [chaveLinha(l), l.qtd]), estado.zona]);
  function enviada() {
    const env = estado.enviada;
    if (!env) return null;
    const idade = Date.now() - Date.parse(env.em);
    if (!estado.linhas.length || env.encomenda !== assinatura() || !(idade >= 0 && idade < 14 * 864e5)) { delete estado.enviada; return null; }
    return env;
  }
  const ouvintes = [];
  /* Grava e redesenha. Devolve a promessa do desenho (a página da encomenda espera pelo catálogo): o
     foco que se põe depois dela cai no botão novo, e não no que o desenho deita fora. */
  function guardar() {
    enviada();
    guardado.gravar(CHAVE, estado);
    desenharConta();
    return Promise.all(ouvintes.map((f) => f()));
  }
  window.addEventListener('storage', (ev) => { if (ev.key === CHAVE) { estado = ler(); desenharConta(); ouvintes.forEach((f) => f()); } });
  // A página volta da memória do browser (o «voltar» depois do WhatsApp): lê-se outra vez.
  window.addEventListener('pageshow', (ev) => { if (ev.persisted) { estado = ler(); desenharConta(); ouvintes.forEach((f) => f()); } });

  // ---------------------------------------------------------------- contas
  /* As escolhas de uma linha, com o valor escolhido em cada grupo (ou o primeiro sem acréscimo, se a
     escolha já não existe: o artigo mudou no painel). */
  function escolhasDe(p, l) {
    return (p.opcoes || []).map((g, i) => {
      let j = (l.opcoes || [])[i];
      if (!Number.isInteger(j) || !g.valores[j]) j = Math.max(0, g.valores.findIndex((x) => !x.suplemento));
      return { grupo: g.nome, valor: g.valores[j].nome, suplemento: g.valores[j].suplemento || 0 };
    });
  }
  function contas(cat, linhas, zona) {
    let pecas = 0;
    let porConfirmar = false;
    const detalhe = linhas.map((l) => {
      const p = cat.produtos[l.produto];
      if (!p) return { linha: l, p: null };
      const escolhas = escolhasDe(p, l);
      const base = precoDe(p).atual;
      const unidade = base === null ? null : base + escolhas.reduce((s, x) => s + x.suplemento, 0);
      const total = unidade === null ? null : Math.round(unidade * l.qtd * 100) / 100;
      if (total === null) porConfirmar = true; else pecas += total;
      return { linha: l, p, escolhas, unidade, total };
    });
    const validas = detalhe.filter((d) => d.p);
    pecas = Math.round(pecas * 100) / 100;
    let portes = 0;
    let portesPorConfirmar = false;
    if (zona !== 'levantamento' && validas.length) {
      const v = (cat.portes || {})[zona];
      const gratis = (cat.portes || {}).gratisAPartirDe;
      // portes grátis no continente a partir de um valor (quando a loja o definir)
      if (zona === 'continente' && typeof gratis === 'number' && !porConfirmar && pecas >= gratis) portes = 0;
      else if (typeof v === 'number') portes = v; else portesPorConfirmar = true;
    }
    return { detalhe, validas, pecas, porConfirmar, portes, portesPorConfirmar, total: Math.round((pecas + portes) * 100) / 100 };
  }

  // ---------------------------------------------------------------- o saco do cabeçalho
  /* O número no saco: as peças diferentes da encomenda (com 80 convites, «80» no saco não dizia nada),
     sem as que saíram da loja, quando o catálogo já chegou (essas não entram na encomenda). */
  let ultimaConta = null;
  function desenharConta() {
    const cat = window.AS.catalogoJa();
    const n = cat ? estado.linhas.filter((l) => cat.produtos[l.produto]).length : estado.linhas.length;
    const saco = $('#saco');
    const conta = saco && $('[data-conta]', saco);
    if (!saco || !conta) return;
    conta.hidden = n === 0;
    conta.textContent = n > 99 ? '99+' : String(n);
    saco.setAttribute('aria-label', n ? `O meu pedido: ${n} ${n === 1 ? 'peça' : 'peças'}` : 'O meu pedido');
    if (ultimaConta !== null && n > ultimaConta) { conta.classList.remove('is-pulo'); void conta.offsetWidth; conta.classList.add('is-pulo'); }
    ultimaConta = n;
  }

  // ---------------------------------------------------------------- juntar (a ficha e a folha)
  /* Depois de enviada, uma peça nova começa outra encomenda: a que seguiu pelo WhatsApp não se repete
     na mensagem seguinte. Devolve { nova } para o recado o dizer. */
  function juntar({ produto, opcoes = [], pers = {}, qtd = 1 }) {
    const nova = Boolean(enviada());
    if (nova) { estado = { v: 1, linhas: [], zona: estado.zona }; ultimaMensagem = ''; }
    const limpo = Object.fromEntries(CAMPOS.map((k) => [k, String(pers[k] || '').trim().replace(/\s+/g, ' ').slice(0, k === 'frase' ? 160 : 60)]).filter(([, v]) => v));
    const linha = { produto, opcoes: opcoes.map(Number), pers: limpo, qtd: Math.max(1, Math.min(MAX_QTD, qtd)) };
    const igual = estado.linhas.find((l) => chaveLinha(l) === chaveLinha(linha));
    if (igual) igual.qtd = Math.min(MAX_QTD, igual.qtd + linha.qtd);
    else estado.linhas.push(linha);
    guardar();
    return { nova };
  }
  async function totalDe({ produto, opcoes = [], qtd = 1 }) {
    try {
      const cat = await catalogo();
      const c = contas(cat, [{ produto, opcoes, qtd, pers: {} }], 'levantamento');
      if (!c.validas.length) return '';
      return c.porConfirmar ? '' : euros(c.pecas);
    } catch (_) { return ''; }
  }

  // ---------------------------------------------------------------- a página da encomenda
  const pagina = $('[data-encomenda]');
  const form = pagina && $('[data-encomenda-form]', pagina);
  let ultimaMensagem = '';

  /* Os pormenores de uma linha (escolhas e personalização), pela ordem da mensagem. O rótulo sem o
     «(opcional)» que alguns trazem: na encomenda já não é pergunta. */
  const semOpcional = (t) => String(t).replace(/\s*\(opcional\)\s*$/i, '');
  function pormenores(d) {
    const out = [];
    for (const x of d.escolhas) out.push([x.grupo, `${x.valor}${x.suplemento ? ` (+ ${euros(x.suplemento)})` : ''}`]);
    for (const k of d.p.pers || []) {
      const v = (d.linha.pers || {})[k.id];
      if (v) out.push([semOpcional(k.rotulo), k.id === 'data' ? dataPorExtenso(v) : v]);
    }
    return out;
  }

  function linhaHtml(cat, d, i) {
    if (!d.p) {
      return `<li class="linha linha--saiu"><span class="linha__foto"></span><div class="linha__info"><p class="linha__nome">Peça que já não está à venda</p><p class="linha__un">Saiu da loja e não entra no pedido.</p></div><div class="linha__fundo"><button class="topo__botao linha__tirar" type="button" data-tirar="${i}" aria-label="Tirar do pedido">${ico('lixo')}</button></div></li>`;
    }
    const p = d.p;
    const minimo = p.minimo || 1;
    const nome = esc(p.nome);
    const extras = pormenores(d).map(([k, v]) => `<li>${esc(k)}: <strong>${esc(v)}</strong></li>`).join('');
    const un = d.unidade === null ? 'Preço sob consulta' : `${euros(d.unidade)} / unidade`;
    return `<li class="linha">
      <a class="linha__foto" href="${esc(p.url)}" tabindex="-1" aria-hidden="true">${miniaturaHtml(cat, p.img, 104)}</a>
      <div class="linha__info">
        <p class="linha__nome"><a href="${esc(p.url)}">${nome}</a></p>
        ${extras ? `<ul class="linha__pormenores" role="list">${extras}</ul>` : ''}
        <p class="linha__un">${un}</p>
      </div>
      <div class="linha__fundo">
        <div class="passo-qtd" data-linha="${i}">
          <button type="button" data-menos aria-label="Menos um: ${nome}"${d.linha.qtd <= minimo ? ' disabled' : ''}>${ico('menos')}</button>
          <input type="number" inputmode="numeric" min="${minimo}" max="${MAX_QTD}" value="${d.linha.qtd}" aria-label="Quantidade: ${nome}">
          <button type="button" data-mais aria-label="Mais um: ${nome}"${d.linha.qtd >= MAX_QTD ? ' disabled' : ''}>${ico('mais')}</button>
        </div>
        <span class="linha__total">${d.total === null ? 'sob consulta' : euros(d.total)}</span>
        <button class="topo__botao linha__tirar" type="button" data-tirar="${i}" aria-label="Tirar do pedido: ${nome}">${ico('lixo')}</button>
      </div>
    </li>`;
  }

  function resumoHtml(c, cat, zona) {
    const portes = zona === 'levantamento' ? 'Sem portes' : (c.portesPorConfirmar ? 'a confirmar' : euros(c.portes));
    const pecas = c.porConfirmar ? (c.pecas ? `${euros(c.pecas)} + sob consulta` : 'sob consulta') : euros(c.pecas);
    let total;
    if (c.porConfirmar) total = 'na resposta';
    else if (zona !== 'levantamento' && c.portesPorConfirmar) total = `${euros(c.pecas)} + portes`;
    else total = euros(c.total);
    return `<div><dt>Subtotal</dt><dd>${pecas}</dd></div>
      <div><dt>Portes</dt><dd>${portes}</dd></div>
      <div class="resumo__total"><dt>Total</dt><dd>${total}</dd></div>`;
  }

  // « hoje, às 21:34» ou « a 12 de outubro, às 21:34» (em Lisboa)
  function quando(iso) {
    const d = new Date(iso);
    const dia = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    const hora = new Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit' }).format(d);
    if (dia === window.AS.hojeLisboa()) return ` hoje, às ${hora}`;
    return ` a ${new Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon', day: 'numeric', month: 'long' }).format(d)}, às ${hora}`;
  }

  async function desenharPagina() {
    if (!pagina) return;
    const carregar = $('[data-encomenda-carregar]', pagina);
    const cheia = $('[data-encomenda-cheia]', pagina);
    const vazia = $('[data-encomenda-vazia]', pagina);
    let cat;
    try { cat = await catalogo(); } catch (_) {
      carregar.textContent = 'Não conseguimos abrir o pedido. Verifique a ligação e recarregue a página.';
      return;
    }
    carregar.hidden = true;
    const radios = $$('input[name="zona"]', form);
    if (!radios.some((r) => r.value === estado.zona)) estado.zona = radios[0] ? radios[0].value : 'levantamento';
    radios.forEach((r) => { r.checked = r.value === estado.zona; });
    const vazio = !estado.linhas.length;
    cheia.hidden = vazio;
    vazia.hidden = !vazio;
    if (vazio) return;
    const c = contas(cat, estado.linhas, estado.zona);
    // as linhas redesenham-se por inteiro: o foco volta ao controlo equivalente da linha nova
    const ativo = document.activeElement;
    const passo = ativo && ativo.closest ? ativo.closest('[data-linhas] [data-linha]') : null;
    const foco = passo && { i: passo.dataset.linha, tipo: ['data-mais', 'data-menos'].find((a) => ativo.hasAttribute(a)) };
    $('[data-linhas]', pagina).innerHTML = c.detalhe.map((d, i) => linhaHtml(cat, d, i)).join('');
    const sitio = foco && $(`[data-linha="${foco.i}"]`, pagina);
    if (sitio) { const alvo = foco.tipo ? $(`[${foco.tipo}]`, sitio) : null; (alvo && !alvo.disabled ? alvo : $('input', sitio)).focus(); }
    $('[data-resumo]', form).innerHTML = resumoHtml(c, cat, estado.zona);
    const zona = cat.zonas.find((z) => z.id === estado.zona) || {};
    $('[data-so-envio]', form).hidden = !zona.morada;
    $$('[data-obrigatorio-envio]', form).forEach((i) => { i.required = Boolean(zona.morada); });
    const europa = $('[data-so-europa]', form);
    if (europa) { europa.hidden = estado.zona !== 'europa'; $('input', europa).required = estado.zona === 'europa'; }
    $$('[data-so-levantamento]', form).forEach((x) => { x.hidden = estado.zona !== 'levantamento'; });
    // a nota dos portes «a confirmar» (como se calculam), só num envio sem portes escritos
    $$('[data-so-portes-a-confirmar]', form).forEach((x) => { x.hidden = !(zona.morada && typeof (cat.portes || {})[estado.zona] !== 'number'); });
    // Já abriu a conversa com este pedido: a página diz isso (também quando a pessoa volta mais tarde, ou
    // recarrega), em vez de pedir os dados outra vez.
    const env = enviada();
    $('[data-por-enviar]', form).hidden = Boolean(env);
    $('[data-enviada]', form).hidden = !env;
    if (env) {
      $('[data-enviada-quando]', form).textContent = quando(env.em);
      const texto = $('[data-enviada-texto]', form);
      if (texto && env.canal === 'instagram') texto.innerHTML = `Copiámos o pedido e abrimos a conversa no Instagram<span data-enviada-quando>${esc(quando(env.em))}</span>: cole a mensagem e envie-a. Respondemos com o preço e o prazo.`;
      else if (texto && env.canal === 'email') texto.innerHTML = `Abrimos o email com o pedido<span data-enviada-quando>${esc(quando(env.em))}</span>. Se ainda não o enviou, envie-o agora: respondemos com o preço e o prazo.`;
      /* Depois de recarregar, a mensagem já não existe (o nome e a morada nunca se guardam): em vez de uma
         conversa vazia, «Enviar outra vez» volta ao formulário. */
      const continuar = $('[data-continuar]', form);
      continuar.href = destinoDe(cat, env.canal, ultimaMensagem);
      continuar.hidden = !ultimaMensagem;
      $('[data-copiar]', form).hidden = !(ultimaMensagem && env.canal === 'instagram');
      $('[data-alterar]', form).hidden = !ultimaMensagem;
      $('[data-reenviar]', form).hidden = Boolean(ultimaMensagem);
    }
  }

  // ---------------------------------------------------------------- a mensagem
  /* A mensagem que a pessoa envia: as peças (quantidade, nome, preço e a personalização), a entrega e
     os portes, o total, a forma de pagamento, o nome, a morada e as observações. O *negrito* e os «- »
     (lista) são do WhatsApp; no email e no Instagram leem-se na mesma. */
  function mensagem(cat, c, dados) {
    const z = cat.zonas.find((x) => x.id === estado.zona) || cat.zonas[0];
    const linhas = ['Olá! Gostava de fazer este pedido:', ''];
    for (const d of c.validas) {
      linhas.push(`*${d.linha.qtd} × ${d.p.nome}* — ${d.total === null ? 'preço sob consulta' : euros(d.total)}`);
      for (const [k, v] of pormenores(d)) linhas.push(`- ${k}: ${v}`);
      linhas.push('');
    }
    linhas.push(`Subtotal: ${c.porConfirmar ? (c.pecas ? `${euros(c.pecas)} + sob consulta` : 'sob consulta') : euros(c.pecas)}`);
    if (estado.zona === 'levantamento') linhas.push(`Entrega: ${z.nome}`);
    else linhas.push(`Entrega: ${z.nome} — portes ${c.portesPorConfirmar ? 'a confirmar' : euros(c.portes)}`);
    if (c.porConfirmar) linhas.push('*Total: a confirmar*');
    else if (estado.zona !== 'levantamento' && c.portesPorConfirmar) linhas.push(`*Total: ${euros(c.pecas)} + portes*`);
    else linhas.push(`*Total: ${euros(c.total)}*`);
    if (cat.pagamento) linhas.push(`Pagamento: ${cat.pagamento}`);
    linhas.push('');
    linhas.push(`Nome: ${dados.nome}`);
    if (z.morada) linhas.push(`Morada: ${[dados.morada, [dados.codigoPostal, dados.localidade].filter(Boolean).join(' ')].filter(Boolean).join(', ')}`);
    if (dados.notas) linhas.push(`Observações: ${dados.notas}`);
    return linhas.join('\n').replace(/\n{3,}/g, '\n\n');
  }

  /* PARA ONDE VAI O PEDIDO: o WhatsApp com a mensagem escrita; a conversa do Instagram (ig.me, sem
     texto: a mensagem vai copiada); o email com o assunto e a mensagem. */
  function destinoDe(cat, canal, texto) {
    if (canal === 'whatsapp') return `https://wa.me/${cat.whatsapp}?text=${encodeURIComponent(texto)}`;
    if (canal === 'instagram') return `https://ig.me/m/${encodeURIComponent(cat.instagram)}`;
    return `mailto:${cat.email}?subject=${encodeURIComponent(`Pedido — ${cat.marca}`)}&body=${encodeURIComponent(texto.replace(/\*/g, ''))}`;
  }
  /* Copiar a mensagem (para o Instagram): a área de transferência dentro do toque; se o browser não
     deixar, o caminho antigo, com um campo escondido. */
  async function copiar(texto) {
    try { await navigator.clipboard.writeText(texto); return true; } catch (_) { /* segue */ }
    try {
      const t = document.createElement('textarea');
      t.value = texto; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.append(t); t.select();
      const ok = document.execCommand('copy');
      t.remove();
      return ok;
    } catch (_) { return false; }
  }
  /* ABRIR A CONVERSA. No telemóvel, a própria página segue para a ligação (abre logo a aplicação). No
     computador, um separador novo; se o browser o recusar, abre-se aqui mesmo. O email abre-se sempre
     aqui (é o programa de email que abre). O window.open é chamado dentro do toque, sem esperas antes:
     por isso o envio usa o catálogo já carregado. */
  const telemovel = window.matchMedia('(hover: none) and (pointer: coarse)');
  function abrir(url) {
    if (url.startsWith('mailto:') || telemovel.matches) { window.location.href = url; return; }
    const janela = window.open(url, '_blank');
    if (janela) { try { janela.opener = null; } catch (_) { /* já é de outra origem */ } } else window.location.href = url;
  }

  if (pagina && form) {
    const erro = $('[data-erro-encomenda]', form);
    const botaoEnviar = $('button[type="submit"]', form);
    const focar = (sel) => { const t = $(sel, pagina); if (t) { t.tabIndex = -1; t.focus(); } };
    /* A frase do erro junto ao primeiro campo que falta (junto do botão ficava fora do ecrã, no
       telemóvel); os outros erros junto do botão. */
    const errar = (texto, campo = null) => {
      erro.textContent = texto;
      const sitio = campo && campo.closest('.campo');
      if (sitio) sitio.append(erro); else botaoEnviar.before(erro);
      erro.hidden = false;
      if (campo) campo.focus();
    };

    // as acções nas linhas (o desenho devolve o foco ao botão equivalente da linha nova)
    pagina.addEventListener('click', (ev) => {
      const tirar = ev.target.closest('[data-tirar]');
      if (tirar) {
        estado.linhas.splice(Number(tirar.dataset.tirar), 1);
        guardar().then(() => focar(estado.linhas.length ? '#t-encomenda' : '.vazio__titulo'));
        window.AS.recado('<span class="recado__texto">A peça saiu do pedido.</span>');
        return;
      }
      const b = ev.target.closest('[data-linha] [data-mais], [data-linha] [data-menos]');
      if (b) {
        const i = Number(b.closest('[data-linha]').dataset.linha);
        const l = estado.linhas[i];
        if (!l) return;
        const cat = window.AS.catalogoJa();
        const minimo = (cat && cat.produtos[l.produto] && cat.produtos[l.produto].minimo) || 1;
        const accao = b.hasAttribute('data-mais') ? 'data-mais' : 'data-menos';
        l.qtd = Math.max(minimo, Math.min(MAX_QTD, l.qtd + (accao === 'data-mais' ? 1 : -1)));
        guardar();
      }
    });
    // a quantidade escrita à mão (80 convites não se fazem com o «+»)
    pagina.addEventListener('change', (ev) => {
      const input = ev.target.closest('[data-linha] input');
      if (input) {
        const i = Number(input.closest('[data-linha]').dataset.linha);
        const l = estado.linhas[i];
        if (!l) return;
        const minimo = Number(input.min) || 1;
        l.qtd = Math.max(minimo, Math.min(MAX_QTD, parseInt(input.value, 10) || minimo));
        // o desenho espera que o Tab acabe: a meio, deitava fora o campo de onde o foco estava a sair
        window.setTimeout(guardar, 0);
        return;
      }
      if (ev.target.name === 'zona') { estado.zona = ev.target.value; guardar(); }
    });
    form.addEventListener('input', (ev) => { if (ev.target.hasAttribute('aria-invalid')) ev.target.removeAttribute('aria-invalid'); erro.hidden = true; });

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      erro.hidden = true;
      $$('[aria-invalid]', form).forEach((i) => i.removeAttribute('aria-invalid'));
      let cat = window.AS.catalogoJa();
      if (!cat) {
        try { cat = await catalogo(); } catch (_) { errar('Não conseguimos carregar a loja. Verifique a ligação e tente outra vez.'); return; }
      }
      const c = contas(cat, estado.linhas, estado.zona);
      if (!c.validas.length) { errar('O pedido está vazio.'); return; }
      const faltam = ['nome', 'morada', 'codigoPostal', 'localidade', 'pais'].map((n) => form.elements[n]).filter((i) => i && i.required && !i.value.trim());
      if (faltam.length) {
        faltam.forEach((i) => i.setAttribute('aria-invalid', 'true'));
        const nomes = faltam.map((i) => $(`label[for="${i.id}"]`, form).firstChild.textContent.trim().toLowerCase());
        errar(`Falta preencher: ${nomes.join(', ')}.`, faltam[0]);
        return;
      }
      const dados = Object.fromEntries(['nome', 'morada', 'codigoPostal', 'localidade', 'pais', 'notas'].map((n) => [n, form.elements[n] ? form.elements[n].value.trim().replace(/\s+/g, ' ') : '']));
      ultimaMensagem = mensagem(cat, c, dados);
      const pedido = ev.submitter && ev.submitter.dataset ? ev.submitter.dataset.canal : '';
      const canal = ['whatsapp', 'instagram', 'email'].includes(pedido) ? pedido : cat.whatsapp ? 'whatsapp' : cat.instagram ? 'instagram' : 'email';
      // no Instagram a mensagem vai copiada (a conversa abre vazia): copia-se ainda dentro do toque
      if (canal === 'instagram') {
        const ok = await copiar(ultimaMensagem);
        window.AS.recado(`<span class="recado__texto">${ok ? '<strong>Mensagem copiada.</strong> Cole-a na conversa do Instagram.' : 'Não conseguimos copiar: use «Copiar a mensagem».'}</span>`);
      }
      // A marca «enviada» grava-se antes de abrir: no telemóvel a página pode sair logo a seguir.
      estado.enviada = { em: new Date().toISOString(), encomenda: assinatura(), canal };
      const desenho = guardar();
      abrir(destinoDe(cat, canal, ultimaMensagem));
      desenho.then(() => focar('#t-enviada'));
    });
    // «Copiar a mensagem» (Instagram), outra vez
    $('[data-copiar]', form).addEventListener('click', async () => {
      const ok = await copiar(ultimaMensagem);
      window.AS.recado(`<span class="recado__texto">${ok ? '<strong>Mensagem copiada.</strong> Cole-a na conversa do Instagram.' : 'Não conseguimos copiar a mensagem neste browser.'}</span>`);
    });
    // «Alterar o pedido» (e «Enviar outra vez», depois de recarregar): o formulário outra vez, com o
    // pedido como está.
    const alterar = () => { delete estado.enviada; guardar().then(() => focar('#t-encomenda')); };
    $('[data-alterar]', form).addEventListener('click', alterar);
    $('[data-reenviar]', form).addEventListener('click', alterar);
    // «Fazer outro pedido»: o pedido fica vazio.
    $('[data-esvaziar]', form).addEventListener('click', () => {
      estado = { v: 1, linhas: [], zona: estado.zona };
      ultimaMensagem = '';
      form.reset();
      guardar().then(() => focar('.vazio__titulo'));
    });
    ouvintes.push(desenharPagina);
  }

  window.AS.carrinho = { juntar, totalDe, linhas: () => estado.linhas.slice() };
  desenharConta();
  desenharPagina();
  // com peças no saco, conta-as outra vez quando o catálogo chegar (o juntar.js pede-o quando o browser
  // está livre; é o mesmo pedido)
  if (estado.linhas.length) (window.requestIdleCallback || ((f) => window.setTimeout(f, 1200)))(() => { catalogo().then(desenharConta, () => {}); });
})();
