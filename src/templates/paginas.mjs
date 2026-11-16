// As páginas do site (a proposta A, «Marfim», com a capa e os círculos da B — o Renato, 16 nov 2026).
// Cada função devolve { caminho, titulo, descricao, conteudo, … } e o build.mjs veste-a com a moldura
// (layout.mjs).
import { esc, euros, precoDe, markdown, textoSimples, resumir, numeroWhatsApp, numeroLegivel, notaChamada, moradaCompleta } from './util.mjs';
import { ico } from './icones.mjs';
import { tituloDaCategoria, tituloDoArtigo } from '../seo.mjs';
import { numeroPortugues, opcoesDe, personalizacaoDe, quantidadeMinimaDe, temSuplementos, ICONES_CONFIANCA, LIMITES_INICIO } from '../lib/regras.mjs';
import {
  imagem, preco, promocaoNota, cartao, grelha, circulos, pastilhas, cabecaSeccao, cabecaDePagina, simbolo,
  migalhasLd, botao, urlFoto, linhaDe, categoriaDe, caminhoDaLinha, caminhoDaCategoria, nomeDaCategoria,
  produtosDaCategoria, categoriasComArtigos, linhasComArtigos, produtosDaLinha,
} from './componentes.mjs';

const paragrafos = (t) => String(t || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('');
/* Uma ligação escrita no painel só se usa se a página existir (uma categoria sem artigos não tem
   página); senão, a alternativa. Ligações para fora (o Facebook) passam. */
const ligacaoQueExiste = (ctx, c, alternativa = '/') => (c && (/^https:\/\//.test(c) || ctx.existe(c)) ? c : alternativa);

// ---------------------------------------------------------------- a loja (JSON-LD)
export function organizacao(ctx) {
  const c = ctx.site.contactos;
  const e = ctx.site.empresa || {};
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': ctx.absoluto('/#loja'),
    name: ctx.site.marca,
    description: ctx.site.descricao,
    slogan: ctx.site.assinatura || undefined,
    url: ctx.absoluto('/'),
    logo: ctx.absoluto(`/assets/img/${ctx.manifesto.logo.altura[256].png}`),
    image: ctx.absoluto(`/assets/img/${ctx.manifesto.partilha._site}`),
    address: {
      '@type': 'PostalAddress',
      ...(e.morada ? { streetAddress: e.morada } : {}),
      ...(e.codigoPostal ? { postalCode: e.codigoPostal } : {}),
      addressLocality: e.localidade || ctx.site.local.localidade,
      addressRegion: ctx.site.local.distrito,
      addressCountry: 'PT',
    },
    areaServed: 'Portugal',
    currenciesAccepted: 'EUR',
    sameAs: [c.instagram && `https://www.instagram.com/${c.instagram}/`, c.facebook && `https://www.facebook.com/${c.facebook}`].filter(Boolean),
  };
  if (ctx.site.entrega?.pagamento) ld.paymentAccepted = ctx.site.entrega.pagamento;
  if (c.email) ld.email = c.email;
  const tel = numeroPortugues(c.telefone) || numeroPortugues(c.whatsapp);
  if (tel) ld.telephone = `+351${tel}`;
  if (e.nif) ld.vatID = `PT${String(e.nif).replace(/\D/g, '')}`;
  if (!ld.slogan) delete ld.slogan;
  return ld;
}

// ---------------------------------------------------------------- página inicial
export function inicio(ctx) {
  const h = ctx.inicio;

  // a CAPA (da proposta B, nas cores da A): o cartão areia com o texto à esquerda e as duas fotografias
  // sobrepostas à direita, o «&» no canto e, muito leve, o «&» grande por trás
  const c = h.capa;
  const fotosCapa = (c.fotos || []).filter((f) => ctx.manifesto.fotos[f]).slice(0, 2);
  const titulo = `${esc(c.titulo)}${c.destaque ? ` <em>${esc(c.destaque)}</em>` : ''}`;
  const capa = `<section class="capa" aria-labelledby="t-capa">
  <div class="contentor">
    <div class="capa__cartao">
      ${simbolo(ctx, { alto: 188, classe: 'capa__marca' })}
      <div class="capa__texto">
        ${c.etiqueta ? `<p class="etiqueta">${simbolo(ctx, { alto: 22, classe: 'etiqueta__simbolo' })}<span>${esc(c.etiqueta)}</span></p>` : ''}
        <h1 class="capa__titulo" id="t-capa">${titulo}</h1>
        ${c.texto ? `<p class="capa__sub">${esc(c.texto)}</p>` : ''}
        <div class="botoes">
          ${botao(ctx.url(ligacaoQueExiste(ctx, c.ligacao)), c.botao)}
          ${c.botao2 ? botao(ctx.url(ligacaoQueExiste(ctx, c.ligacao2)), c.botao2, { classe: 'botao botao--claro', icone: '' }) : ''}
        </div>
      </div>
      <div class="capa__fotos${fotosCapa.length === 1 ? ' capa__fotos--uma' : ''}">
        ${fotosCapa.map((f, i) => `<figure class="capa__foto capa__foto--${i + 1}">${imagem(ctx, f, { tamanhos: i === 0 ? '(min-width: 900px) 330px, 52vw' : '(min-width: 900px) 260px, 42vw', prioridade: i === 0, cedo: true, ate: 960, moldura: 0.8 })}</figure>`).join('\n        ')}
        ${simbolo(ctx, { alto: 64, classe: 'capa__simbolo' })}
      </div>
    </div>
  </div>
</section>`;

  // os CÍRCULOS das categorias, logo a seguir (as escolhidas no painel, as que têm artigos)
  const escolhidas = (h.circulos.categorias || []).map((s) => categoriaDe(ctx, s)).filter((k) => k && produtosDaCategoria(ctx, k.slug).length).slice(0, 10);
  const secCirculos = escolhidas.length ? `<section class="sec-circulos" aria-labelledby="t-circulos">
  <div class="contentor">
    <h2 class="so-leitor" id="t-circulos">${esc(h.circulos.titulo || 'Categorias')}</h2>
    ${circulos(ctx, escolhidas)}
  </div>
</section>` : '';

  // as LINHAS: os quatro cartões
  const linhas = linhasComArtigos(ctx);
  const secLinhas = linhas.length ? `<section class="secao" aria-labelledby="t-linhas">
  <div class="contentor">
    ${cabecaSeccao(ctx, { id: 't-linhas', titulo: h.linhas.titulo, texto: h.linhas.texto })}
    <ul class="linhas" role="list">
      ${linhas.map((l) => `<li class="linha-cartao">
        <a href="${ctx.url(caminhoDaLinha(l))}">
          <span class="linha-cartao__foto">${imagem(ctx, l.foto, { tamanhos: '(min-width: 1240px) 270px, (min-width: 900px) calc(25vw - 40px), 66vw', ate: 960, moldura: 0.8, alt: '' })}</span>
          <span class="linha-cartao__nome"><span>${esc(l.nome)}</span><span class="seta-circulo" aria-hidden="true">${ico('seta')}</span></span>
          ${l.frase ? `<span class="linha-cartao__frase">${esc(l.frase)}</span>` : ''}
        </a>
      </li>`).join('\n      ')}
    </ul>
  </div>
</section>` : '';

  // o DESTAQUE (o Natal): a fotografia grande, o texto, três peças e o botão
  const d = h.destaque;
  const catD = categoriaDe(ctx, d.categoria);
  const listaD = catD ? produtosDaCategoria(ctx, catD.slug) : [];
  const fotoD = d.foto && ctx.manifesto.fotos[d.foto] ? d.foto : listaD[0]?.fotos[0];
  const secDestaque = listaD.length ? `<section class="secao" aria-labelledby="t-destaque">
  <div class="contentor destaque">
    <figure class="destaque__foto">${imagem(ctx, fotoD, { tamanhos: '(min-width: 900px) 500px, calc(100vw - 40px)', ate: 1280, moldura: 0.8, alt: '' })}</figure>
    <div class="destaque__texto">
      ${d.etiqueta ? `<p class="etiqueta">${simbolo(ctx, { alto: 22, classe: 'etiqueta__simbolo' })}<span>${esc(d.etiqueta)}</span></p>` : ''}
      <h2 class="titulo-secao" id="t-destaque">${esc(d.titulo)}</h2>
      ${d.texto ? `<p class="destaque__sub">${esc(d.texto)}</p>` : ''}
      <ul class="mini" role="list">
        ${listaD.slice(0, 3).map((p) => `<li><a href="${ctx.url(`/produtos/${p.slug}/`)}">${imagem(ctx, p.fotos[0], { tamanhos: '(min-width: 900px) 170px, calc(33vw - 22px)', ate: 540, moldura: 1, alt: '' })}<span>${esc(p.nomeCurto || p.nome)}</span></a></li>`).join('\n        ')}
      </ul>
      ${botao(ctx.url(caminhoDaCategoria(catD)), d.botao)}
    </div>
  </div>
</section>` : '';

  // PERSONALIZAR: três passos
  const pz = h.personalizar;
  const secPassos = `<section class="secao" aria-labelledby="t-passos">
  <div class="contentor">
    ${cabecaSeccao(ctx, { id: 't-passos', titulo: pz.titulo, texto: pz.texto })}
    <ol class="passos" role="list">
      ${pz.passos.map((x, i) => `<li class="passo"><span class="passo__n" aria-hidden="true">${i + 1}</span><h3 class="passo__titulo">${esc(x.titulo)}</h3><p>${esc(x.texto)}</p></li>`).join('\n      ')}
    </ol>
  </div>
</section>`;

  // os MAIS PEDIDOS: os artigos marcados no painel (até 8)
  const pedidos = ctx.produtos.filter((p) => p.destaque === true).slice(0, 8);
  const pe = h.pedidos;
  const secPedidos = pedidos.length ? `<section class="secao" aria-labelledby="t-pedidos">
  <div class="contentor">
    ${cabecaSeccao(ctx, { id: 't-pedidos', titulo: pe.titulo, ligacao: pe.botao && pe.ligacao && ctx.existe(pe.ligacao) ? { href: ctx.url(pe.ligacao), texto: pe.botao } : null })}
    ${grelha(ctx, pedidos)}
  </div>
</section>` : '';

  // as OPINIÕES: só o número das críticas do Facebook e a ligação (os textos não se copiam: são das
  // pessoas, e a lei pede que se diga como se verificam — DL 57/2008, art. 10.º-A)
  const o = h.opinioes;
  // Um cartão: o número grande e, ao lado, o que ele quer dizer (lidos juntos, no mesmo título) e a
  // fonte, com quantas opiniões, na ligação.
  /* As críticas: cartões do site com o texto como a pessoa o escreveu, o primeiro nome e a inicial, e o
     mês. Por baixo, de onde vêm e que a compra não se confirma (DL 57/2008, art. 10.º-A). */
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const mes = (d) => { const m = /^(\d{4})-(\d{2})$/.exec(String(d || '')); return m ? `${MESES[Number(m[2]) - 1]} de ${m[1]}` : ''; };
  const crs = (Array.isArray(o.criticas) ? o.criticas : []).filter((c) => c && c.nome && c.texto).slice(0, LIMITES_INICIO.criticas[1]);
  const secOpinioes = o.numero && o.texto ? `<section class="secao" aria-labelledby="t-opinioes">
  <div class="contentor">
    <div class="opinioes">
      <h2 class="opinioes__titulo" id="t-opinioes"><span class="opinioes__numero">${esc(o.numero)}</span> <span class="opinioes__texto">${esc(o.texto)}</span></h2>
      ${o.botao && o.ligacao ? `<a class="opinioes__fonte" href="${esc(o.ligacao)}" target="_blank" rel="noopener"><span class="opinioes__icone" aria-hidden="true">${ico('facebook')}</span><span>${esc(o.botao)}</span>${ico('seta')}</a>` : ''}
    </div>
    ${crs.length ? `<ul class="criticas" role="list" aria-label="Críticas no Facebook">
      ${crs.map((c) => `<li class="critica">
        <span class="critica__aspas" aria-hidden="true">“</span>
        <blockquote class="critica__texto"><p>${esc(c.texto)}</p></blockquote>
        <p class="critica__autor"><span class="critica__inicial" aria-hidden="true">${esc(String(c.nome).trim().charAt(0).toUpperCase())}</span><span><strong>${esc(c.nome)}</strong><span class="critica__onde">no Facebook${mes(c.data) ? ` · ${mes(c.data)}` : ''}</span></span></p>
      </li>`).join('\n      ')}
    </ul>
    <p class="opinioes__nota">As críticas mais recentes da página da ${esc(ctx.site.marca)} no Facebook, como foram escritas. A ${esc(ctx.site.marca)} não confirma se quem as escreveu comprou.</p>` : ''}
  </div>
</section>` : '';

  // a CONFIANÇA: até quatro cartões curtos (o showroom, os envios, o pagamento)
  const frases = (h.confianca || []).filter((f) => f && f.titulo).slice(0, 4);
  const secConfianca = frases.length ? `<section class="secao secao--fim" aria-label="Como trabalhamos">
  <ul class="contentor garantias" role="list">
    ${frases.map((f) => `<li class="garantia"><span class="garantia__icone">${ico(ICONES_CONFIANCA.includes(f.icone) ? f.icone : 'coracao')}</span><h3 class="garantia__titulo">${esc(f.titulo)}</h3>${f.texto ? `<p>${esc(f.texto)}</p>` : ''}</li>`).join('\n    ')}
  </ul>
</section>` : '';

  return {
    caminho: '/',
    titulo: h.seo?.titulo || ctx.site.marca,
    descricao: h.seo?.descricao || ctx.site.descricao,
    classe: 'pagina-inicio',
    jsonld: [organizacao(ctx), { '@context': 'https://schema.org', '@type': 'WebSite', '@id': ctx.absoluto('/#site'), name: ctx.site.marca, alternateName: ctx.site.marca.replace(/\s*&\s*/, ' e '), url: ctx.absoluto('/'), inLanguage: 'pt-PT', publisher: { '@id': ctx.absoluto('/#loja') } }],
    conteudo: [capa, secCirculos, secLinhas, secDestaque, secPassos, secPedidos, secOpinioes, secConfianca].filter(Boolean).join('\n\n'),
  };
}

// ---------------------------------------------------------------- as linhas e as categorias
/* A página de uma LINHA (/bebe/) e a de cada CATEGORIA (/bebe/primeira-roupinha/): as pastilhas da linha
   em cima e, por baixo, o painel (o título, o texto e os artigos), que as pastilhas trocam sem a página
   saltar (loja.js vai buscar o painel à página da pastilha). Na linha, cada categoria num bloco com as
   quatro primeiras peças e «Ver as N»; na categoria, as peças todas. */
export function vitrine(ctx, linhaSlug, catSlug = null) {
  const l = linhaDe(ctx, linhaSlug);
  const c = catSlug ? categoriaDe(ctx, catSlug) : null;
  const caminho = c ? caminhoDaCategoria(c) : caminhoDaLinha(l);
  let painel;
  let lista;
  if (c) {
    lista = produtosDaCategoria(ctx, c.slug);
    painel = `<div class="vitrine__cabeca">
        <p class="etiqueta">${simbolo(ctx, { alto: 22, classe: 'etiqueta__simbolo' })}<a href="${ctx.url(caminhoDaLinha(l))}">${esc(l.nome)}</a></p>
        <h1 class="vitrine__titulo">${esc(c.titulo)}</h1>
        <div class="vitrine__sub">${markdown(c.resumo, ctx.url)}</div>
      </div>
      ${grelha(ctx, lista, { titulo: 'h2', cedo: 4 })}`;
  } else {
    const cats = categoriasComArtigos(ctx, l.slug);
    lista = produtosDaLinha(ctx, l.slug);
    painel = `<div class="vitrine__cabeca">
        <h1 class="vitrine__titulo">${esc(l.titulo)}</h1>
        <div class="vitrine__sub">${markdown(l.resumo, ctx.url)}</div>
      </div>
      ${cats.map((k, i) => {
        const ps = produtosDaCategoria(ctx, k.slug);
        return `<section class="bloco" aria-labelledby="b-${k.slug}">
        <div class="bloco__cabeca">
          <h2 class="bloco__titulo" id="b-${k.slug}"><a href="${ctx.url(caminhoDaCategoria(k))}">${esc(k.nome)}</a></h2>
          ${ps.length > 4 ? `<a class="ligacao-seta" href="${ctx.url(caminhoDaCategoria(k))}"><span>Ver as ${ps.length}</span><span class="so-leitor"> — ${esc(k.nome)}</span>${ico('seta')}</a>` : '' /* com 4 ou menos já estão todas à vista; o título leva à categoria */}
        </div>
        ${grelha(ctx, ps.slice(0, 4), { cedo: i === 0 ? 4 : 0 })}
      </section>`;
      }).join('\n      ')}`;
  }
  const conteudo = `<div class="vitrine">
  <div class="contentor">
    ${pastilhas(ctx, l.slug, caminho)}
    <div class="vitrine__painel" data-loja-painel>
      ${painel}
    </div>
    <p class="so-leitor" aria-live="polite" data-loja-anuncio></p>
  </div>
</div>`;
  const migalhas = [{ nome: 'Início', caminho: '/' }, { nome: l.nome, caminho: caminhoDaLinha(l) }, ...(c ? [{ nome: c.titulo, caminho }] : [])];
  return {
    caminho,
    titulo: c ? tituloDaCategoria(c, l) : l.titulo,
    descricao: resumir(textoSimples(c ? c.resumo : l.resumo)),
    jsonld: [
      migalhasLd(ctx, migalhas),
      { '@context': 'https://schema.org', '@type': 'ItemList', name: c ? c.titulo : l.titulo, itemListElement: lista.slice(0, 60).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: ctx.absoluto(`/produtos/${p.slug}/`), name: p.nome })) },
    ],
    conteudo,
  };
}

// ---------------------------------------------------------------- ficha do artigo
/* O formulário de «juntar ao pedido»: as escolhas (se houver), os campos da personalização (os rótulos
   do artigo; os obrigatórios com «*»), a quantidade (com o mínimo) e o botão. */
export function formulario(ctx, p) {
  const id = (k) => `pz-${k}-${p.slug}`;
  const grupos = opcoesDe(p);
  const escolhas = grupos.map((g, i) => {
    // marcado à partida: o primeiro valor sem acréscimo (o preço anunciado é o que se paga)
    const marcado = Math.max(0, g.valores.findIndex((v) => !v.suplemento));
    return `<fieldset class="campo escolha" data-escolha="${i}">
    <legend>${esc(g.nome)}</legend>
    <div class="escolha__lista">${g.valores.map((v, j) => `<label class="escolha__opcao"><input type="radio" name="opcao-${i}" value="${j}"${j === marcado ? ' checked' : ''}><span>${esc(v.nome)}${v.suplemento ? ` <span class="escolha__mais">+ ${euros(v.suplemento)}</span>` : ''}</span></label>`).join('')}</div>
  </fieldset>`;
  }).join('');
  const campos = personalizacaoDe(p);
  const obrig = campos.some((k) => k.obrigatorio);
  const marca = (k) => (k.obrigatorio ? ' <span class="campo__obrig" aria-hidden="true">*</span>' : '');
  const pers = campos.length ? `<fieldset class="juntar__pers">
    <legend class="juntar__legenda"><span>Personalização</span>${obrig ? '<span class="juntar__nota" aria-hidden="true">* obrigatório</span>' : ''}</legend>
    ${campos.map((k) => {
      const rotulo = `<label for="${id(k.id)}">${esc(k.rotulo)}${marca(k)}</label>`;
      if (k.id === 'data') return `<div class="campo">${rotulo}<div class="data" data-data><input id="${id('data')}" name="data" type="text" inputmode="numeric" placeholder="dd/mm/aaaa" maxlength="10" autocomplete="off" aria-describedby="${id('data')}-forma"${k.obrigatorio ? ' required' : ''}><input class="data__calendario" type="date" tabindex="-1" aria-hidden="true"><span class="data__icone" aria-hidden="true">${ico('calendario')}</span></div><span class="so-leitor" id="${id('data')}-forma">dia, mês e ano</span></div>`;
      if (k.id === 'frase') return `<div class="campo">${rotulo}<textarea id="${id('frase')}" name="frase" rows="2" maxlength="160" spellcheck="true"${k.obrigatorio ? ' required' : ''} placeholder="Ex.: ursinho azul, letra cursiva"></textarea></div>`;
      return `<div class="campo">${rotulo}<input id="${id('nome')}" name="nome" type="text" maxlength="60" autocomplete="off" autocapitalize="words" spellcheck="false"${k.obrigatorio ? ' required' : ''}></div>`;
    }).join('\n    ')}
  </fieldset>` : '';
  const minimo = quantidadeMinimaDe(p);
  if (p.esgotado) return '<p class="ficha__esgotado">Esta peça está esgotada. Pergunte-nos se a podemos fazer outra vez.</p>';
  return `<form class="juntar" data-juntar-form="${esc(p.slug)}" data-minimo="${minimo}" novalidate>
  ${escolhas}
  ${pers}
  <div class="juntar__qtd">
    <label for="${id('qtd')}">Quantidade</label>
    <div class="passo-qtd" data-passo>
      <button type="button" data-menos aria-label="Menos um">${ico('menos')}</button>
      <input id="${id('qtd')}" name="quantidade" type="number" inputmode="numeric" min="${minimo}" max="999" value="${minimo}"${minimo > 1 ? ` aria-describedby="${id('minimo')}"` : ''}>
      <button type="button" data-mais aria-label="Mais um">${ico('mais')}</button>
    </div>
    ${minimo > 1 ? `<p class="campo__ajuda" id="${id('minimo')}">Mínimo: ${minimo}</p>` : ''}
  </div>
  <p class="juntar__erro" data-erro role="alert" hidden></p>
  <button class="botao botao--largo" type="submit">${ico('saco')}<span>Juntar ao pedido</span></button>
  <p class="juntar__total" data-total aria-live="polite"></p>
</form>`;
}

/* O fabricante de um artigo, quando o painel o diz por inteiro (nome, morada e email); senão null. */
export function fabricanteDoArtigo(p) {
  const f = p.fabricante;
  if (!f || typeof f !== 'object') return null;
  const ok = ['nome', 'morada', 'email'].every((k) => typeof f[k] === 'string' && f[k].trim());
  return ok ? { nome: f.nome.trim(), morada: f.morada.trim(), email: f.email.trim() } : null;
}
const linhasDe = (v) => String(typeof v === 'string' ? v : '').split(/\n+/).map((t) => t.trim()).filter(Boolean);
export const avisosDoArtigo = (p) => linhasDe(p.avisos);
export const perigosDoArtigo = (p) => linhasDe(p.perigos);

/* A morada de quem faz as peças: sem a rua (ainda não dita), na pré-visualização vai a marca
   «[por confirmar]»; no domínio aberto, o que houver. */
export function moradaDaLoja(ctx) {
  const e = ctx.site.empresa || {};
  const resto = moradaCompleta(e);
  if (e.morada || ctx.producao) return esc(resto);
  return `${ctx.marcador('a rua e o número')}, ${esc(resto)}`;
}

export function produto(ctx, p) {
  const c = categoriaDe(ctx, p.categoria);
  const l = linhaDe(ctx, c.linha);
  const caminho = `/produtos/${p.slug}/`;
  const v = precoDe(p, ctx.hoje);
  const nome = esc(p.nome);

  // a galeria: a primeira fotografia grande; com várias, as outras deslizam e as miniaturas escolhem
  const fotos = p.fotos.filter((f) => ctx.manifesto.fotos[f]);
  const tamanhos = '(min-width: 1240px) 600px, (min-width: 760px) calc(50vw - 56px), calc(100vw - 40px)';
  const forma = Math.max(0.8, Math.min(4 / 3, ...fotos.map((f) => ctx.manifesto.fotos[f].largura / ctx.manifesto.fotos[f].altura)));
  const galeria = `<div class="galeria${fotos.length > 1 ? ' galeria--varias' : ''}" data-galeria style="--forma:${forma.toFixed(3)}">
    <div class="galeria__pista"${fotos.length > 1 ? ` tabindex="0" role="region" aria-label="Fotografias de ${nome}"` : ''}>
      ${fotos.map((f, i) => `<figure class="galeria__foto" id="foto-${i + 1}">${imagem(ctx, f, { tamanhos, prioridade: i === 0, moldura: forma })}</figure>`).join('\n      ')}
    </div>
    ${fotos.length > 1 ? `<ul class="galeria__miniaturas" role="list">${fotos.map((f, i) => `<li><button type="button" data-foto="${i}"${i === 0 ? ' aria-current="true"' : ''} aria-label="Fotografia ${i + 1} de ${fotos.length}"><img src="${urlFoto(ctx, f, ctx.manifesto.fotos[f].larguras[0])}" width="64" height="64" alt="" loading="lazy" decoding="async"></button></li>`).join('')}</ul>` : ''}
  </div>`;

  const inclui = p.inclui?.length ? `<div class="ficha__bloco"><h2 class="ficha__subtitulo">Inclui</h2><ul class="lista-certo" role="list">${p.inclui.map((t) => `<li>${ico('certo')}<span>${esc(t)}</span></li>`).join('')}</ul></div>` : '';
  const medidas = p.medidas?.length ? `<div class="ficha__bloco"><h2 class="ficha__subtitulo">Medidas</h2><table class="medidas"><tbody>${p.medidas.map((x) => `<tr><th scope="row">${esc(x.rotulo)}</th><td>${esc(x.valor)}</td></tr>`).join('')}</tbody></table></div>` : '';
  const comToalha = /\btoalhas?\b/i.test(`${p.nome} ${(p.inclui || []).join(' ')}`);
  const composicao = p.composicao
    ? `<p class="ficha__linha"><strong>Composição:</strong> ${esc(p.composicao)}</p>`
    : comToalha ? `<p class="ficha__linha"><strong>Composição:</strong> ${ctx.marcador('de que é feita a toalha (ex.: 100 % algodão)')}</p>` : '';

  const avisos = avisosDoArtigo(p);
  const perigos = perigosDoArtigo(p);
  const infoLegal = avisos.length || perigos.length || p.idade || p.naoBrinquedo === true || p.referencia ? `<div class="ficha__bloco ficha__legal">
    ${avisos.length ? `<h2 class="ficha__subtitulo">Avisos de segurança</h2><ul role="list">${avisos.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    ${perigos.length ? `<h2 class="ficha__subtitulo">Perigos</h2><ul role="list">${perigos.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    ${p.idade ? `<p class="ficha__linha"><strong>Idade recomendada:</strong> ${esc(p.idade)}</p>` : ''}
    ${p.naoBrinquedo === true ? '<p class="ficha__linha">Não é um brinquedo.</p>' : ''}
    ${p.referencia ? `<p class="ficha__linha"><strong>Referência:</strong> ${esc(p.referencia)}</p>` : ''}
  </div>` : '';

  // entrega e pagamento, numa gaveta fechada: o prazo, os portes e o pagamento
  const en = ctx.site.entrega || {};
  const portes = (en.zonas || []).filter((z) => z.morada).map((z) => `${esc(z.curto)}: ${Number.isFinite(en.portes?.[z.id]) ? euros(en.portes[z.id]) : 'a confirmar'}`).join(' · ');
  const levantamento = (en.zonas || []).find((z) => z.id === 'levantamento');
  const personalizavel = personalizacaoDe(p).length > 0;
  const entrega = `<details class="ficha__detalhe">
    <summary>${ico('caixa')}<span>Entrega e pagamento</span>${ico('baixo', { classe: 'ficha__seta' })}</summary>
    <div class="ficha__detalhe-corpo">
      <p><strong>Prazo:</strong> ${en.prazo ? esc(en.prazo) : ctx.marcador('quanto tempo leva a fazer e a entregar')}</p>
      <p><strong>Envio por CTT:</strong> ${portes}.${en.portesNota ? ` ${esc(en.portesNota)}` : ''}${levantamento ? ` ${esc(levantamento.curto)}: ${en.levantamento ? esc(en.levantamento) : ctx.marcador('se o levantamento no showroom se combina antes')}` : ''}</p>
      <p><strong>Pagamento:</strong> ${en.pagamento ? esc(en.pagamento) : ctx.marcador('as formas de pagamento')}</p>
      ${personalizavel ? '<p>Uma peça personalizada é feita à sua medida: não tem direito de livre resolução.</p>' : ''}
    </div>
  </details>`;

  // quem faz (Regulamento (UE) 2023/988, art. 19.º): o fabricante do painel; numa peça personalizada, a loja
  const e = ctx.site.empresa || {};
  const fab = fabricanteDoArtigo(p);
  const feito = fab
    ? `<p class="ficha__feito">${ico('info')}<span><strong>Fabricante:</strong> ${[fab.nome, fab.morada, fab.email].map(esc).join(' · ')}</span></p>`
    : personalizavel ? `<p class="ficha__feito">${simbolo(ctx, { alto: 22, classe: 'ficha__simbolo' })}<span><strong>Personalizado pela ${esc(ctx.site.marca)}</strong> · ${[e.nome ? esc(e.nome) : '', moradaDaLoja(ctx), esc(ctx.site.contactos.email || '')].filter(Boolean).join(' · ')}</span></p>` : '';

  // «Também pode gostar»: da mesma categoria; se não chegarem quatro, da mesma linha
  const mesmos = ctx.produtos.filter((x) => x.slug !== p.slug && x.categoria === p.categoria);
  const linhaToda = produtosDaLinha(ctx, c.linha).filter((x) => x.slug !== p.slug && x.categoria !== p.categoria);
  const relacionados = [...mesmos, ...linhaToda].slice(0, 4);

  const conteudo = `<section class="ficha">
  <div class="contentor">
    <nav class="migalhas" aria-label="Estou em"><ol role="list"><li><a href="${ctx.url('/')}">Início</a></li><li><a href="${ctx.url(caminhoDaLinha(l))}">${esc(l.nome)}</a></li><li><a href="${ctx.url(caminhoDaCategoria(c))}">${esc(nomeDaCategoria(c))}</a></li><li aria-current="page">${nome}</li></ol></nav>
    <div class="ficha__grelha">
      ${galeria}
      <div class="ficha__info">
        <h1 class="ficha__nome">${nome}</h1>
        ${preco(ctx, p, { classe: 'ficha__preco' })}
        ${promocaoNota(ctx, p)}
        ${p.resumo ? `<p class="ficha__resumo">${esc(p.resumo)}</p>` : ''}
        ${formulario(ctx, p)}
        <noscript><p class="ficha__nota">O pedido precisa de JavaScript. Pode sempre escrever-nos pelo <a href="https://www.instagram.com/${esc(ctx.site.contactos.instagram || '')}/">Instagram</a>.</p></noscript>
        <div class="ficha__mais">
          <div class="ficha__descricao prosa">${markdown(p.descricao, ctx.url)}</div>
          ${inclui}
          ${composicao}
          ${medidas}
          ${infoLegal}
          ${entrega}
          ${feito}
        </div>
      </div>
    </div>
  </div>
</section>
${relacionados.length ? `<section class="secao relacionados" aria-labelledby="t-relacionados">
  <div class="contentor">
    ${cabecaSeccao(ctx, { id: 't-relacionados', titulo: 'Também pode gostar' })}
    ${grelha(ctx, relacionados)}
  </div>
</section>` : ''}`;

  const ldProduto = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nome,
    description: p.resumo || textoSimples(p.descricao),
    image: fotos.slice(0, 4).map((f) => ctx.absoluto(`/assets/img/${f}-${ctx.manifesto.fotos[f].resumo}-${ctx.manifesto.fotos[f].larguras.at(-1)}.webp`)),
    brand: { '@type': 'Brand', name: ctx.site.marca },
    category: c.titulo,
    url: ctx.absoluto(caminho),
  };
  if (p.referencia) ldProduto.sku = p.referencia;
  if (v.atual !== null) {
    ldProduto.offers = {
      '@type': 'Offer',
      url: ctx.absoluto(caminho),
      priceCurrency: 'EUR',
      price: v.atual.toFixed(2),
      availability: p.esgotado ? 'https://schema.org/OutOfStock' : personalizavel ? 'https://schema.org/MadeToOrder' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': ctx.absoluto('/#loja') },
      hasMerchantReturnPolicy: personalizavel
        ? { '@type': 'MerchantReturnPolicy', applicableCountry: 'PT', returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted' }
        : { '@type': 'MerchantReturnPolicy', applicableCountry: 'PT', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 14, returnMethod: 'https://schema.org/ReturnByMail', returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility' },
      ...(v.ate ? { priceValidUntil: v.ate } : {}),
    };
  }
  return {
    caminho,
    titulo: tituloDoArtigo(p, c),
    descricao: resumir(`${p.resumo || textoSimples(p.descricao)}${v.atual !== null ? ` ${temSuplementos(p) ? 'Desde ' : ''}${euros(v.atual)}.` : ''} ${personalizavel ? `Personalizado pela ${ctx.site.marca}.` : `Da ${ctx.site.marca}, em ${ctx.site.local.localidade}.`}`, 160),
    tipo: 'product',
    partilha: ctx.manifesto.partilha[p.slug],
    jsonld: [migalhasLd(ctx, [{ nome: 'Início', caminho: '/' }, { nome: l.nome, caminho: caminhoDaLinha(l) }, { nome: c.titulo, caminho: caminhoDaCategoria(c) }, { nome: p.nome, caminho }]), ldProduto],
    conteudo,
  };
}

// ---------------------------------------------------------------- o pedido
/* O PEDIDO (o saco do cabeçalho). Não há pagamentos no site: as peças (com a personalização), as
   quantidades, a entrega, o nome e a morada seguem numa mensagem já escrita — pelo WhatsApp quando a
   loja tiver número; até lá, pelo Instagram (a mensagem copia-se e abre-se a conversa) ou por email
   (carrinho.js). Antes do botão, o que a lei pede que se saiba antes de encomendar (DL 24/2014, art.
   4.º): o prazo, o pagamento, os portes e que as peças personalizadas não têm livre resolução. */
export function pedido(ctx) {
  const en = ctx.site.entrega || {};
  const zonas = en.zonas || [];
  const c = ctx.site.contactos;
  const precoZona = (z) => (z.id === 'levantamento' ? 'Sem portes' : Number.isFinite(en.portes?.[z.id]) ? euros(en.portes[z.id]) : 'a confirmar');
  const temTermos = ctx.existe('/termos-e-condicoes/');
  const canais = [];
  if (c.whatsapp) canais.push(`<button class="botao botao--largo" type="submit" data-canal="whatsapp">${ico('whatsapp')}<span>Enviar pelo WhatsApp</span></button>`);
  if (c.instagram) canais.push(`<button class="botao botao--largo${c.whatsapp ? ' botao--claro' : ''}" type="submit" data-canal="instagram">${ico('instagram')}<span>Enviar pelo Instagram</span></button>`);
  if (c.email) canais.push(`<button class="botao botao--largo botao--claro" type="submit" data-canal="email">${ico('carta')}<span>Enviar por email</span></button>`);
  const conteudo = `${cabecaDePagina(ctx, { titulo: 'O seu pedido' })}
<section class="encomenda" data-encomenda>
  <div class="contentor">
    <div class="encomenda__grelha" data-encomenda-cheia hidden>
      <div class="encomenda__pecas">
        <h2 class="so-leitor" id="t-pecas">As peças</h2>
        <ul class="linhas-pedido" role="list" aria-labelledby="t-pecas" data-linhas></ul>
        <a class="ligacao-seta encomenda__continuar" href="${ctx.url('/')}">${ico('voltar')}<span>Continuar a ver a loja</span></a>
      </div>
      <form class="cartao-form" data-encomenda-form novalidate>
        <div data-por-enviar>
          <h2 class="cartao-form__titulo" id="t-encomenda">Entrega e dados</h2>
          <fieldset class="entregas">
            <legend>Como quer receber?</legend>
            ${zonas.map((z, i) => `<label class="entrega"><input type="radio" name="zona" value="${esc(z.id)}"${i === 0 ? ' checked' : ''}><span class="entrega__nome">${esc(z.curto)}</span><span class="entrega__preco">${precoZona(z)}</span></label>`).join('\n            ')}
          </fieldset>
          ${zonas.some((z) => z.id === 'levantamento') ? `<p class="campo__ajuda" data-so-levantamento>${en.levantamento ? esc(en.levantamento) : ctx.marcador('se o levantamento no showroom se combina antes, e onde fica')}</p>` : ''}
          ${en.portesNota ? `<p class="campo__ajuda" data-so-portes-a-confirmar hidden>${esc(en.portesNota)}</p>` : ''}
          <div class="campo"><label for="e-nome">Nome <span class="campo__obrig" aria-hidden="true">*</span></label><input id="e-nome" name="nome" type="text" autocomplete="name" required maxlength="80"></div>
          <div data-so-envio hidden>
            <div class="campo"><label for="e-morada">Morada <span class="campo__obrig" aria-hidden="true">*</span></label><input id="e-morada" name="morada" type="text" autocomplete="address-line1" maxlength="160" data-obrigatorio-envio></div>
            <div class="campos-lado">
              <div class="campo"><label for="e-cp">Código postal <span class="campo__obrig" aria-hidden="true">*</span></label><input id="e-cp" name="codigoPostal" type="text" autocomplete="postal-code" maxlength="12" data-obrigatorio-envio></div>
              <div class="campo"><label for="e-local">Localidade <span class="campo__obrig" aria-hidden="true">*</span></label><input id="e-local" name="localidade" type="text" autocomplete="address-level2" maxlength="60" data-obrigatorio-envio></div>
            </div>
          </div>
          <div class="campo"><label for="e-notas">Observações</label><textarea id="e-notas" name="notas" rows="3" maxlength="500" placeholder="Datas, tamanhos, cores, a ideia que tem…"></textarea></div>
          <dl class="resumo" data-resumo aria-live="polite"></dl>
          <ul class="antes" role="list" aria-label="Antes de enviar">
            <li>${ico('calendario')}<span><strong>Prazo:</strong> ${en.prazo ? esc(en.prazo) : ctx.marcador('quanto tempo leva a fazer e a entregar')}</span></li>
            <li>${ico('cartao')}<span><strong>Pagamento:</strong> ${en.pagamento ? esc(en.pagamento) : ctx.marcador('as formas de pagamento')}</span></li>
            <li>${ico('info')}<span>O preço das peças «sob consulta» e os portes dizemo-los na resposta, antes de pagar. As peças personalizadas não têm direito de livre resolução.${temTermos ? ` <a href="${ctx.url('/termos-e-condicoes/')}">Termos e condições</a>` : ''}</span></li>
          </ul>
          <p class="juntar__erro" data-erro-encomenda role="alert" hidden></p>
          <div class="canais">${canais.join('')}</div>
          <p class="cartao-form__nota">O pedido fica feito quando o confirmarmos consigo.</p>
        </div>
        <div class="enviada" data-enviada hidden>
          <span class="enviada__icone">${simbolo(ctx, { alto: 48, classe: 'enviada__simbolo' })}</span>
          <h2 class="cartao-form__titulo" id="t-enviada" tabindex="-1">Pedido pronto a enviar</h2>
          <p data-enviada-texto>Abrimos a conversa com o seu pedido<span data-enviada-quando></span>. Se ainda não o enviou, envie-o agora: respondemos com o preço e o prazo.</p>
          <a class="botao botao--largo" href="#" target="_blank" rel="noopener" data-continuar>${ico('mensagem')}<span>Abrir a conversa</span></a>
          <button class="botao botao--largo botao--claro" type="button" data-copiar hidden>${ico('copiar')}<span>Copiar a mensagem</span></button>
          <button class="botao botao--largo" type="button" data-reenviar hidden>${ico('mensagem')}<span>Enviar outra vez</span></button>
          <div class="enviada__mais">
            <button class="botao botao--claro" type="button" data-alterar>Alterar o pedido</button>
            <button class="botao botao--texto" type="button" data-esvaziar>Fazer outro pedido</button>
          </div>
        </div>
      </form>
    </div>
    <div class="vazio" data-encomenda-vazia hidden>
      <span class="vazio__icone" aria-hidden="true">${ico('saco')}</span>
      <p class="vazio__titulo">O seu pedido está vazio.</p>
      <p>Escolha uma peça, diga-nos o nome e o tema, e junte-a ao pedido.</p>
      ${botao(ctx.url('/'), 'Ver a loja')}
    </div>
    <p class="vazio" data-encomenda-carregar>A abrir o pedido…</p>
    <noscript><p class="ficha__nota">O pedido precisa de JavaScript. Pode sempre escrever-nos pelo <a href="https://www.instagram.com/${esc(c.instagram || '')}/">Instagram</a>.</p></noscript>
  </div>
</section>`;
  return { caminho: '/pedido/', titulo: 'O seu pedido', descricao: 'Reveja as peças, escolha a entrega e envie-nos o pedido.', conteudo, classe: 'pagina-pedido', indexar: false };
}

// ---------------------------------------------------------------- páginas de texto
/* As páginas de texto (content/paginas/*.md): a cabeça com o «&» e o título em Lora, e o texto numa
   coluna confortável. Dois modelos próprios («modelo:» no cabeçalho do Markdown): «passos» (os passos
   numerados e o resto em cartões) e «perguntas» (as perguntas abrem e fecham). */
const ICONE_DA_NOTA = { pagamento: 'cartao', prazos: 'calendario', prazo: 'calendario', levantamento: 'casa', entrega: 'caixa', portes: 'caixa', envios: 'caixa' };
const chaveDe = (t) => textoSimples(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
function seccoes(html) {
  const partes = html.split(/(?=<h2[ >])/);
  const intro = partes.length && !partes[0].startsWith('<h2') ? partes.shift().trim() : '';
  return { intro, lista: partes.map((x) => {
    const m = /^<h2(?: id="([^"]*)")?>([\s\S]*?)<\/h2>([\s\S]*)$/.exec(x.trim());
    return m ? { id: m[1] || '', titulo: m[2], corpo: m[3].trim() } : { id: '', titulo: '', corpo: x };
  }) };
}
function comoPassos(html) {
  const { intro, lista } = seccoes(html);
  const numerado = (x) => /^\d+\.\s/.test(textoSimples(x.titulo));
  const passos = lista.filter(numerado);
  const notas = lista.filter((x) => !numerado(x) && x.corpo.replace(/<[^>]+>/g, '').trim());
  return `${intro ? `<div class="prosa prosa--intro">${intro}</div>` : ''}
    <ol class="etapas" role="list">${passos.map((x, i) => `<li class="etapa"><span class="etapa__numero" aria-hidden="true">${i + 1}</span><div class="etapa__texto prosa"><h2 id="${x.id}">${x.titulo.replace(/^\d+\.\s*/, '')}</h2>${x.corpo}</div></li>`).join('')}</ol>
    ${notas.length ? `<div class="notas">${notas.map((x) => { const i = ICONE_DA_NOTA[chaveDe(x.titulo)]; return `<section class="nota-cartao prosa">${i ? `<span class="nota-cartao__icone">${ico(i)}</span>` : ''}<h2 id="${x.id}">${x.titulo}</h2>${x.corpo}</section>`; }).join('')}</div>` : ''}`;
}
function comoPerguntas(html) {
  const { intro, lista } = seccoes(html);
  return `${intro ? `<div class="prosa prosa--intro">${intro}</div>` : ''}
    <div class="perguntas">${lista.map((x) => `<details class="pergunta"><summary><h2 class="pergunta__titulo" id="${x.id}">${x.titulo}</h2><span class="pergunta__sinal" aria-hidden="true">${ico('mais')}</span></summary><div class="pergunta__resposta prosa">${x.corpo}</div></details>`).join('')}</div>`;
}

export function texto(ctx, pag) {
  const legal = Boolean(pag.atualizado);
  const data = legal ? `Atualizado a ${new Date(`${pag.atualizado}T12:00:00Z`).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Lisbon' })}` : '';
  const corpo = pag.modelo === 'passos' ? comoPassos(pag.html) : pag.modelo === 'perguntas' ? comoPerguntas(pag.html) : `<div class="prosa">${pag.html}</div>`;
  const comFoto = pag.foto && ctx.manifesto.fotos[pag.foto];
  const conteudo = `${cabecaDePagina(ctx, { titulo: pag.titulo, sub: pag.subtitulo ? `<p>${esc(pag.subtitulo)}</p>` : '', data })}
<section class="leitura${pag.modelo ? ` leitura--${esc(pag.modelo)}` : ''}${comFoto ? ' leitura--foto' : ''}">
  <div class="contentor leitura__grelha">
    ${comFoto ? `<figure class="leitura__foto">${imagem(ctx, pag.foto, { tamanhos: '(min-width: 900px) 360px, calc(100vw - 40px)', prioridade: true, ate: 960, moldura: 0.8 })}</figure>` : ''}
    <article class="leitura__texto">
      ${corpo}
      ${legal ? '' : `<p class="leitura__fim">${botao(ctx.url('/'), 'Ver a loja', { classe: 'botao botao--claro' })}</p>`}
    </article>
  </div>
</section>`;
  return {
    caminho: pag.caminho,
    titulo: pag.tituloSeo || pag.titulo,
    descricao: resumir(pag.descricao || textoSimples(pag.html.replace(/<[^>]+>/g, ' '))),
    indexar: pag.indexar,
    jsonld: [migalhasLd(ctx, [{ nome: 'Início', caminho: '/' }, { nome: pag.titulo, caminho: pag.caminho }])],
    classe: `pagina-texto${legal ? ' pagina-legal' : ''}`,
    conteudo,
  };
}

/* Os CONTACTOS: o caminho principal num cartão (o WhatsApp quando houver número; até lá, o Instagram, por
   onde a loja já combina as encomendas) e os outros numa lista. O WhatsApp só como ligação, sem o
   número; o telefone com a nota da chamada (DL 59/2021). */
export function contactos(ctx) {
  const c = ctx.site.contactos;
  const e = ctx.site.empresa || {};
  const tel = numeroPortugues(c.telefone);
  const linha = (icone, nome, corpo) => `<li class="contacto"><span class="contacto__icone">${ico(icone)}</span><div><h2 class="contacto__nome">${nome}</h2>${corpo}</div></li>`;
  const outros = [];
  if (tel) outros.push(linha('telefone', 'Telefone', `<p><a href="tel:+351${tel}">${esc(numeroLegivel(tel))}</a> ${notaChamada(tel)}</p>`));
  if (c.email) outros.push(linha('carta', 'Email', `<p><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>`));
  if (c.whatsapp && c.instagram) outros.push(linha('instagram', 'Instagram', `<p><a href="https://www.instagram.com/${esc(c.instagram)}/" target="_blank" rel="noopener">@${esc(c.instagram)}</a></p>`));
  if (c.facebook) outros.push(linha('facebook', 'Facebook', `<p><a href="https://www.facebook.com/${esc(c.facebook)}" target="_blank" rel="noopener">${esc(ctx.site.marca)} — Pinturas &amp; Retratos</a></p>`));
  outros.push(linha('casa', 'Showroom', `<p>${esc([e.localidade || ctx.site.local.localidade, e.concelho || ctx.site.local.distrito].filter(Boolean).join(', '))}</p>${c.horario ? `<p>${esc(c.horario)}</p>` : ''}`));
  const principal = c.whatsapp
    ? `<div class="contactos__principal">
      <span class="contactos__icone" aria-hidden="true">${ico('whatsapp')}</span>
      <h2 class="contactos__titulo">WhatsApp</h2>
      <p>É por aqui que combinamos os pedidos.</p>
      <a class="botao" href="https://wa.me/${numeroWhatsApp(c.whatsapp)}" target="_blank" rel="noopener">${ico('whatsapp')}<span>Enviar mensagem</span></a>
    </div>`
    : c.instagram ? `<div class="contactos__principal">
      <span class="contactos__icone" aria-hidden="true">${ico('instagram')}</span>
      <h2 class="contactos__titulo">Instagram</h2>
      <p>É por aqui que combinamos os pedidos.</p>
      <a class="botao" href="https://ig.me/m/${esc(c.instagram)}" target="_blank" rel="noopener">${ico('instagram')}<span>Enviar mensagem</span></a>
    </div>` : '';
  const conteudo = `${cabecaDePagina(ctx, { titulo: 'Contactos', sub: '<p>Fale connosco como preferir.</p>' })}
<section class="contactos">
  <div class="contentor contactos__grelha">
    ${principal}
    <ul class="contactos__lista" role="list">${outros.join('')}</ul>
  </div>
</section>`;
  return {
    caminho: '/contactos/',
    titulo: 'Contactos',
    descricao: resumir(`Fale com a ${ctx.site.marca}: ${c.whatsapp ? 'WhatsApp, ' : ''}Instagram, email e Facebook. Showroom em ${ctx.site.local.localidade}, ${e.concelho || ctx.site.local.distrito}.`),
    jsonld: [migalhasLd(ctx, [{ nome: 'Início', caminho: '/' }, { nome: 'Contactos', caminho: '/contactos/' }]), organizacao(ctx)],
    conteudo,
  };
}

export function erro404(ctx) {
  const escolhidas = (ctx.inicio.circulos.categorias || []).map((s) => categoriaDe(ctx, s)).filter((k) => k && produtosDaCategoria(ctx, k.slug).length);
  const conteudo = `${cabecaDePagina(ctx, { titulo: 'Esta página não existe', sub: '<p>Pode ter mudado de sítio, ou o endereço tem um erro.</p>' })}
<section class="secao sec-circulos" aria-label="Categorias">
  <div class="contentor">
    ${circulos(ctx, escolhidas, { titulo: 'p' })}
    <p class="centro">${botao(ctx.url('/'), 'Ir para a página inicial')}</p>
  </div>
</section>`;
  return { caminho: '/404.html', titulo: 'Página não encontrada', descricao: 'Esta página não existe.', conteudo, indexar: false };
}
