// As peças que se repetem: fotografias, o logótipo e o «&» da marca, preços, cartões de artigo, os
// círculos e as pastilhas das categorias, as cabeças das secções e das páginas, e as peças legais.
import { esc, euros, precoDe, dataPorExtenso } from './util.mjs';
import { ico } from './icones.mjs';
import { temSuplementos, quantidadeMinimaDe, LINHAS } from '../lib/regras.mjs';
import { livroReclamacoes, VERSAO as LEGAL_COMUM_VERSAO } from '../../legal-comum/index.mjs';

/* AS PEÇAS DA BIBLIOTECA legal-comum (a cópia está em legal-comum/; não se edita aqui), entre os
   marcadores que o verificar-versoes.mjs dela procura nas páginas publicadas. */
export const pecaLegal = (nome, html) => `<!-- legal-comum:${nome} v${LEGAL_COMUM_VERSAO} -->${html}<!-- /legal-comum:${nome} -->`;

/* O Livro de Reclamações Eletrónico na variante DISCRETA (ícone e texto, a letra e a cor das ligações
   vizinhas, sem caixa), e só no rodapé (o Renato, 22 e 27 out 2026). */
export const livroBotao = () => pecaLegal('livro', livroReclamacoes());

// ---------------------------------------------------------------- o catálogo: linhas e categorias
export const linhaDe = (ctx, slug) => ctx.linhas.find((l) => l.slug === slug);
export const categoriaDe = (ctx, slug) => ctx.categorias.find((c) => c.slug === slug);
export const caminhoDaLinha = (l) => `/${typeof l === 'string' ? l : l.slug}/`;
export const caminhoDaCategoria = (c) => `/${c.linha}/${c.slug}/`;
export const nomeDaCategoria = (c) => c.nomeMenu || c.nome;
export const nomeDaLinha = (l) => l.nomeMenu || l.nome;
export const produtosDaCategoria = (ctx, slug) => ctx.produtos.filter((p) => p.categoria === slug);
/* As categorias que têm artigos (as vazias não aparecem em lado nenhum, nem têm página). */
export const categoriasComArtigos = (ctx, linha = null) => ctx.categorias.filter((c) => (!linha || c.linha === linha) && ctx.produtos.some((p) => p.categoria === c.slug));
/* As linhas que têm pelo menos uma categoria com artigos, pela ordem fixa (LINHAS). */
export const linhasComArtigos = (ctx) => LINHAS.map((s) => linhaDe(ctx, s)).filter((l) => l && categoriasComArtigos(ctx, l.slug).length);
/* Os artigos de uma linha, pela ordem das categorias e, dentro delas, pela posição. */
export function produtosDaLinha(ctx, linha) {
  const cats = categoriasComArtigos(ctx, linha);
  return cats.flatMap((c) => produtosDaCategoria(ctx, c.slug));
}

// ---------------------------------------------------------------- fotografias
/** O endereço de uma versão web de uma fotografia (scripts/imagens.py). */
export function urlFoto(ctx, nome, largura, fmt = 'webp') {
  const m = ctx.manifesto.fotos[nome] || ctx.manifesto.posters[nome];
  const w = largura ?? m.larguras[m.larguras.length - 1];
  return ctx.asset(`img/${nome}-${m.resumo}-${w}.${fmt}`);
}

/* O sizes de uma fotografia cortada numa moldura (object-fit: cover): uma fotografia mais larga do que a
   moldura mostra-se mais larga do que a caixa e precisa de mais píxeis. */
export function escalarSizes(sizes, f) {
  if (!(f > 1.01)) return sizes;
  const partes = [];
  let fundo = 0;
  let atual = '';
  for (const ch of sizes) {
    if (ch === '(') fundo++;
    if (ch === ')') fundo--;
    if (ch === ',' && fundo === 0) { partes.push(atual.trim()); atual = ''; } else atual += ch;
  }
  partes.push(atual.trim());
  const k = f.toFixed(3);
  return partes.map((x) => {
    const m = /^(\([^()]*\))\s+(.+)$/.exec(x);
    return m ? `${m[1]} calc(${m[2]} * ${k})` : `calc(${x} * ${k})`;
  }).join(', ');
}

/* <picture> com AVIF e WebP em várias larguras (só as que a fotografia tem). «tamanhos» é o sizes,
   MEDIDO no browser. Fora do primeiro ecrã, loading="lazy". O ponto de foco (content/fotos.json) diz
   onde se corta quando a moldura é de outra forma; «moldura» é a forma (largura/altura) dessa caixa. */
export function imagem(ctx, nome, { tamanhos = '100vw', classe = '', prioridade = false, alt, foco, ate = Infinity, baixa = false, moldura = 0, cedo = false } = {}) {
  const m = ctx.manifesto.fotos[nome] || ctx.manifesto.posters[nome];
  if (!m) throw new Error(`imagem «${nome}» não existe em media/fotos`);
  if (moldura) tamanhos = escalarSizes(tamanhos, (m.largura / m.altura) / moldura);
  const info = ctx.fotos[nome] || {};
  const texto = alt ?? info.alt ?? '';
  const ponto = foco ?? info.foco ?? '50% 50%';
  const larguras = m.larguras.filter((w, i) => w <= ate || i === 0 || m.larguras[i - 1] < ate);
  const srcset = (fmt) => larguras.map((w) => `${ctx.asset(`img/${nome}-${m.resumo}-${w}.${fmt}`)} ${w}w`).join(', ');
  const fontes = m.formatos.filter((f) => f !== 'webp').map((f) => `<source type="image/${f}" srcset="${srcset(f)}" sizes="${tamanhos}">`).join('');
  const meio = larguras.find((w) => w >= 720) || larguras[larguras.length - 1];
  const estilo = ponto !== '50% 50%' ? ` style="object-position:${esc(ponto)}"` : '';
  const carga = prioridade ? ' fetchpriority="high"' : baixa ? ' loading="lazy" fetchpriority="low"' : cedo ? '' : ' loading="lazy"';
  return `<picture${classe ? ` class="${esc(classe)}"` : ''}>${fontes}<img src="${ctx.asset(`img/${nome}-${m.resumo}-${meio}.webp`)}" srcset="${srcset('webp')}" sizes="${tamanhos}" width="${m.largura}" height="${m.altura}" alt="${esc(texto)}"${carga} decoding="async"${estilo}></picture>`;
}

/* Uma fotografia pequena e redonda (o menu, a procura, as linhas do pedido): só a versão de 360. */
export function miniatura(ctx, nome, { lado = 46, classe = '' } = {}) {
  const m = ctx.manifesto.fotos[nome];
  const ponto = ctx.fotos[nome]?.foco || '50% 50%';
  return `<img${classe ? ` class="${esc(classe)}"` : ''} src="${urlFoto(ctx, nome, m.larguras[0])}" width="${lado}" height="${lado}" alt="" loading="lazy" decoding="async"${ponto !== '50% 50%' ? ` style="object-position:${esc(ponto)}"` : ''}>`;
}

// ---------------------------------------------------------------- o logótipo e o «&»
/* As peças da marca (media/marca/, nas versões do imagens.py): «logo» (o logótipo inteiro, tal como a
   cliente o usa: o cabeçalho, o menu e o rodapé) e «simbolo» (o «&» dourado com o coração: o motivo que
   se repete pelo site — o Renato, 16 nov 2026: «gostei de usar várias vezes o logo da marca ao longo do
   site»). «alto» é a altura em CSS; a largura sai da proporção. Nunca se recolorem. */
export function pecaDoLogo(ctx, nome, { alto, classe = '', alt = '', prioridade = false, tamanhos = '' } = {}) {
  const m = ctx.manifesto.marca[nome];
  const alturas = Object.keys(m.altura).map(Number).sort((a, b) => a - b);
  const largo = Math.round((m.w * alto) / m.h);
  const src = m.altura[alturas.find((h) => h >= alto * 2) || alturas[alturas.length - 1]];
  const srcset = alturas.map((h) => `${ctx.asset(`img/${m.altura[h].webp}`)} ${m.altura[h].largura}w`).join(', ');
  const carga = prioridade ? ' fetchpriority="high"' : ' loading="lazy"';
  return `<img${classe ? ` class="${esc(classe)}"` : ''} src="${ctx.asset(`img/${src.webp}`)}" srcset="${srcset}" sizes="${tamanhos || `${largo}px`}" width="${largo}" height="${alto}" alt="${esc(alt)}"${carga} decoding="async">`;
}
/* O «&» como enfeite (alt vazio: o leitor de ecrã salta-o). */
export const simbolo = (ctx, { alto = 28, classe = 'simbolo' } = {}) => pecaDoLogo(ctx, 'simbolo', { alto, classe });

// ---------------------------------------------------------------- preços
/* O preço como se mostra: o de hoje, e o anterior riscado quando há promoção. «Desde» quando uma
   escolha pode fazer o preço subir. Sem preço: «Preço sob consulta» (as peças personalizadas têm cada
   uma o seu; diz-se na resposta ao pedido). */
export function preco(ctx, p, { classe = 'preco', curto = false } = {}) {
  const v = precoDe(p, ctx.hoje);
  if (v.atual === null) return `<p class="${classe} ${classe}--consulta">${curto ? 'Sob consulta' : 'Preço sob consulta'}</p>`;
  const desde = temSuplementos(p) ? '<span class="preco__desde">Desde </span>' : '';
  const un = quantidadeMinimaDe(p) > 1 ? '<span class="preco__un"> / unidade</span>' : '';
  const atual = `${desde}<span class="preco__valor">${euros(v.atual)}</span>${un}`;
  if (!v.anterior) return `<p class="${classe}">${atual}</p>`;
  return `<p class="${classe} ${classe}--promocao">${atual} <s class="preco__antes"><span class="so-leitor">em vez de </span>${euros(v.anterior)}</s></p>`;
}

/* A nota legal da promoção, por baixo do preço da ficha (DL 70/2007, art. 5.º). */
export function promocaoNota(ctx, p) {
  const v = precoDe(p, ctx.hoje);
  const desde = typeof p.promocaoDesde === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.promocaoDesde) ? p.promocaoDesde : '';
  if (!v.anterior || !v.ate || !desde) return '';
  const mesmoAno = desde.slice(0, 4) === v.ate.slice(0, 4);
  return `<p class="ficha__promocao">Promoção de ${dataPorExtenso(desde, !mesmoAno)} a ${dataPorExtenso(v.ate, true)} · preço mais baixo nos 30 dias anteriores: ${euros(v.anterior)}</p>`;
}

// ---------------------------------------------------------------- cartões de artigo
/* O cartão de um artigo (a proposta A): a fotografia num quadrado de cantos redondos, o nome, o preço e
   a seta num círculo. O cartão NÃO compra (o Renato, 13 nov 2026): o cartão inteiro leva à ficha (a
   ligação do nome estende-se por cima dele, ::after), e é lá que se escolhe e se junta ao pedido. */
export const TAMANHOS_CARTAO = '(min-width: 1240px) 270px, (min-width: 900px) calc(25vw - 40px), (min-width: 640px) calc(33.3vw - 36px), calc(50vw - 27px)';
export function cartao(ctx, p, { titulo = 'h3', tamanhos = TAMANHOS_CARTAO, prioridade = false, cedo = false } = {}) {
  const v = precoDe(p, ctx.hoje);
  const pct = v.anterior && v.atual !== null ? Math.round((1 - v.atual / v.anterior) * 100) : 0;
  const selo = p.esgotado ? '<span class="selo selo--esgotado">Esgotado</span>' : pct ? `<span class="selo">−${pct}%</span>` : p.novidade ? '<span class="selo">Novidade</span>' : '';
  return `<li class="artigo">
  <div class="artigo__foto">${imagem(ctx, p.fotos[0], { tamanhos, prioridade, cedo, ate: 1280, moldura: 1 })}${selo}</div>
  <div class="artigo__info">
    <${titulo} class="artigo__nome"><a href="${ctx.url(`/produtos/${p.slug}/`)}">${esc(p.nome)}</a></${titulo}>
    ${preco(ctx, p, { classe: 'artigo__preco', curto: true })}
  </div>
  <span class="seta-circulo" aria-hidden="true">${ico('seta')}</span>
</li>`;
}
/* «cedo»: quantos cartões, do princípio, estão no primeiro ecrã (sem «lazy»). */
export const grelha = (ctx, lista, { cedo = 0, classe = '', ...opcoes } = {}) => `<ul class="grelha-artigos${classe ? ` ${classe}` : ''}" role="list">${lista.map((p, i) => cartao(ctx, p, { ...opcoes, cedo: i < cedo })).join('\n')}</ul>`;

// ---------------------------------------------------------------- círculos e pastilhas
/* Os CÍRCULOS das categorias (como os destaques do Instagram da loja, da proposta B — o Renato, 16 nov
   2026: «gostei das categorias logo a seguir»): a fotografia num círculo com o anel bronze e o nome por
   baixo. No telemóvel deslizam de lado; no computador ficam numa fila ao centro. */
export function circulos(ctx, lista, { titulo = 'h3' } = {}) {
  return `<ul class="circulos" role="list">${lista.map((c) => `<li class="circulo">
    <a class="circulo__ligacao" href="${ctx.url(caminhoDaCategoria(c))}">
      <span class="circulo__foto">${imagem(ctx, c.foto, { tamanhos: '(min-width: 900px) 112px, 84px', ate: 360, moldura: 1, alt: '' })}</span>
      <${titulo} class="circulo__nome">${esc(nomeDaCategoria(c))}</${titulo}>
    </a>
  </li>`).join('\n')}</ul>`;
}

/* As pastilhas de uma linha: «Tudo» (a página da linha) e cada categoria com artigos; a página em que
   se está fica marcada. Trocam só o painel por baixo, sem a página saltar (loja.js). */
export function pastilhas(ctx, linha, atual = '') {
  const l = linhaDe(ctx, linha);
  const itens = [{ caminho: caminhoDaLinha(l), nome: 'Tudo' }, ...categoriasComArtigos(ctx, linha).map((c) => ({ caminho: caminhoDaCategoria(c), nome: nomeDaCategoria(c) }))];
  return `<nav class="pastilhas" aria-label="Categorias de ${esc(l.nome)}"><ul role="list">${itens.map((i) => `<li><a href="${ctx.url(i.caminho)}"${i.caminho === atual ? ' aria-current="page"' : ''}>${esc(i.nome)}</a></li>`).join('')}</ul></nav>`;
}

// ---------------------------------------------------------------- cabeças
/* A cabeça de uma secção: o «&» pequeno e uma etiqueta em maiúsculas espaçadas (opcional), o título em
   Lora e uma frase. «centro» para as secções centradas. */
export function cabecaSeccao(ctx, { id, titulo, texto = '', etiqueta = '', nivel = 'h2', classe = '', ligacao = null, centro = false }) {
  return `<div class="cabeca${centro ? ' cabeca--centro' : ''}${classe ? ` ${classe}` : ''}">
  <div class="cabeca__texto">
    ${etiqueta ? `<p class="etiqueta">${simbolo(ctx, { alto: 22, classe: 'etiqueta__simbolo' })}<span>${esc(etiqueta)}</span></p>` : centro ? simbolo(ctx, { alto: 34, classe: 'cabeca__simbolo' }) : ''}
    <${nivel} class="titulo-secao" id="${id}">${esc(titulo)}</${nivel}>
    ${texto ? `<p class="cabeca__sub">${esc(texto)}</p>` : ''}
  </div>
  ${ligacao ? `<a class="ligacao-seta" href="${ligacao.href}"><span>${esc(ligacao.texto)}</span>${ico('seta')}</a>` : ''}
</div>`;
}

/* A cabeça de uma página de texto (Sobre nós, Contactos, as legais…): o «&», o título em Lora, uma frase
   curta; nas páginas legais, a data. */
export function cabecaDePagina(ctx, { titulo, sub = '', data = '', extra = '' }) {
  return `<header class="cabeca-pagina">
  <div class="contentor cabeca-pagina__dentro">
    <h1 class="titulo-pagina">${esc(titulo)}</h1>
    ${sub ? `<div class="cabeca-pagina__sub">${sub}</div>` : ''}
    ${data ? `<p class="cabeca-pagina__data">${esc(data)}</p>` : ''}
    ${extra}
  </div>
</header>`;
}

/* Um fio com o «&» ao meio, a separar o fim de uma página do rodapé. */
export const fio = (ctx) => `<div class="fio" aria-hidden="true"><span></span>${simbolo(ctx, { alto: 30, classe: 'fio__simbolo' })}<span></span></div>`;

// ---------------------------------------------------------------- JSON-LD
export function migalhasLd(ctx, itens) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((i, n) => ({ '@type': 'ListItem', position: n + 1, name: i.nome, item: ctx.absoluto(i.caminho) })),
  };
}

// ---------------------------------------------------------------- botões
export function botao(href, texto, { classe = 'botao', icone = 'seta', externo = false, antes = false } = {}) {
  const i = icone ? ico(icone) : '';
  return `<a class="${classe}" href="${esc(href)}"${externo ? ' target="_blank" rel="noopener"' : ''}>${antes ? i : ''}<span>${esc(texto)}</span>${antes ? '' : i}</a>`;
}
