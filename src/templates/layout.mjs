// A moldura de todas as páginas (a proposta A, «Marfim», escolhida pelo Renato a 16 nov 2026): o
// cabeçalho marfim (o menu e a procura à esquerda, o logótipo da cliente ao centro, os contactos e o
// pedido à direita), o menu de ecrã inteiro com as quatro linhas e as categorias, o painel da procura, o
// rodapé com o logótipo, e o botão do WhatsApp (só quando houver número).
import { esc, numeroWhatsApp } from './util.mjs';
import { sprite, ico } from './icones.mjs';
import { pecaDoLogo, simbolo, livroBotao, miniatura, linhasComArtigos, categoriasComArtigos, caminhoDaLinha, caminhoDaCategoria, nomeDaCategoria, nomeDaLinha } from './componentes.mjs';

const wa = (ctx) => (ctx.site.contactos.whatsapp ? `https://wa.me/${numeroWhatsApp(ctx.site.contactos.whatsapp)}` : '');

/* O aviso do topo (content/site.json, «aviso»): uma faixa fina por cima do cabeçalho, só com uma
   campanha (o Natal) e até ao dia que a dona escolher (o nucleo.js esconde-a no dia seguinte, mesmo sem
   publicar). */
function aviso(ctx) {
  const a = ctx.site.aviso || {};
  if (!a.texto || (a.ate && ctx.hoje > a.ate)) return '';
  const texto = esc(a.texto);
  const destino = a.ligacao && ctx.existe(a.ligacao) ? a.ligacao : '';
  return `<div class="aviso"${a.ate ? ` data-ate="${esc(a.ate)}"` : ''}><p class="contentor">${simbolo(ctx, { alto: 18, classe: 'aviso__simbolo' })}${destino ? `<a href="${ctx.url(destino)}">${texto}${ico('seta')}</a>` : `<span>${texto}</span>`}</p></div>`;
}

function cabecalho(ctx, caminho) {
  return `<header class="topo" id="topo">
  <div class="contentor topo__barra">
    <div class="topo__lado">
      <button class="topo__botao" type="button" id="abrir-menu" aria-label="Abrir o menu" aria-haspopup="dialog" aria-controls="gaveta" aria-expanded="false">${ico('menu')}<span class="topo__rotulo" aria-hidden="true">Menu</span></button>
      <button class="topo__botao" type="button" id="abrir-procura" aria-label="Procurar" aria-haspopup="dialog" aria-controls="procura" aria-expanded="false">${ico('lupa')}<span class="topo__rotulo" aria-hidden="true">Procurar</span></button>
    </div>
    <a class="topo__logo" href="${ctx.url('/')}"${caminho === '/' ? ' aria-current="page"' : ''}>${pecaDoLogo(ctx, 'logo', { alto: 56, classe: 'topo__logo-img', alt: `${ctx.site.marca}, pinturas e retratos — página inicial`, prioridade: true, tamanhos: '(min-width: 900px) 146px, 115px' })}</a>
    <div class="topo__lado topo__lado--fim">
      ${ctx.existe('/contactos/') ? `<a class="topo__botao topo__so-largo" href="${ctx.url('/contactos/')}"${caminho === '/contactos/' ? ' aria-current="page"' : ''}><span class="topo__rotulo">Contactos</span></a>` : ''}
      <a class="topo__botao saco" href="${ctx.url('/pedido/')}" id="saco" aria-label="O meu pedido"${caminho === '/pedido/' ? ' aria-current="page"' : ''}>${ico('saco')}<span class="saco__n" data-conta hidden></span></a>
    </div>
  </div>
</header>`;
}

/* O MENU (um <dialog>: o foco fica lá dentro e o Esc fecha), de ecrã inteiro no telemóvel e de lado
   no computador: as quatro linhas, cada uma numa gaveta com as categorias que têm artigos (a da página
   em que se está vem aberta), as páginas de ajuda, e as redes. */
function gaveta(ctx, caminho) {
  const marca = (c) => (c === caminho ? ' aria-current="page"' : '');
  const paginas = [['/sobre-nos/', 'Sobre nós'], ['/como-encomendar/', 'Como encomendar'], ['/perguntas-frequentes/', 'Perguntas frequentes'], ['/contactos/', 'Contactos']].filter(([c]) => ctx.existe(c));
  const w = wa(ctx);
  return `<dialog class="gaveta" id="gaveta" aria-label="Menu">
  <div class="gaveta__interior">
    <div class="gaveta__topo">
      <a class="gaveta__casa" href="${ctx.url('/')}">${pecaDoLogo(ctx, 'logo', { alto: 48, classe: 'gaveta__logo', alt: `${ctx.site.marca} — página inicial` })}</a>
      <button class="topo__botao" type="button" data-fechar aria-label="Fechar o menu">${ico('fechar')}</button>
    </div>
    <nav class="gaveta__linhas" aria-label="Loja">
      ${linhasComArtigos(ctx).map((l) => {
        const cats = categoriasComArtigos(ctx, l.slug);
        const aberta = caminho.startsWith(caminhoDaLinha(l)) || cats.some((c) => ctx.produtos.some((p) => p.categoria === c.slug && caminho === `/produtos/${p.slug}/`));
        return `<details class="gaveta__linha"${aberta ? ' open' : ''}>
        <summary><span>${esc(l.nome)}</span>${ico('baixo', { classe: 'gaveta__seta' })}</summary>
        <ul role="list">
          <li><a class="gaveta__tudo" href="${ctx.url(caminhoDaLinha(l))}"${marca(caminhoDaLinha(l))}>${simbolo(ctx, { alto: 22, classe: 'gaveta__simbolo' })}<span>Ver tudo em ${esc(nomeDaLinha(l))}</span></a></li>
          ${cats.map((c) => `<li><a href="${ctx.url(caminhoDaCategoria(c))}"${marca(caminhoDaCategoria(c))}>${miniatura(ctx, c.foto, { lado: 40 })}<span>${esc(nomeDaCategoria(c))}</span></a></li>`).join('\n          ')}
        </ul>
      </details>`;
      }).join('\n      ')}
    </nav>
    <nav class="gaveta__paginas" aria-label="Ajuda">
      <ul role="list">
        ${paginas.map(([c, t]) => `<li><a href="${ctx.url(c)}"${marca(c)}>${esc(t)}</a></li>`).join('\n        ')}
      </ul>
    </nav>
    <div class="gaveta__fim">
      ${w ? `<a class="botao botao--claro" href="${w}" target="_blank" rel="noopener">${ico('whatsapp')}<span>Enviar mensagem</span></a>` : ''}
      ${redes(ctx)}
    </div>
  </div>
</dialog>`;
}

function redes(ctx) {
  const c = ctx.site.contactos;
  const r = [];
  if (c.instagram) r.push(`<a href="https://www.instagram.com/${esc(c.instagram)}/" target="_blank" rel="noopener" aria-label="Instagram da ${esc(ctx.site.marca)}">${ico('instagram')}</a>`);
  if (c.facebook) r.push(`<a href="https://www.facebook.com/${esc(c.facebook)}" target="_blank" rel="noopener" aria-label="Facebook da ${esc(ctx.site.marca)}">${ico('facebook')}</a>`);
  return r.length ? `<div class="redes">${r.join('')}</div>` : '';
}

/* A PROCURA: o campo e, por baixo, os resultados (procura.js procura no catálogo: o nome, a frase curta
   e a categoria, sem acentos nem maiúsculas). Vazia, mostra as categorias mais procuradas. */
function procura(ctx) {
  const atalhos = categoriasComArtigos(ctx).filter((c) => (ctx.inicio.circulos?.categorias || []).includes(c.slug));
  return `<dialog class="procura" id="procura" aria-label="Procurar">
  <div class="procura__interior">
    <form class="procura__linha" role="search" action="${ctx.url('/')}" data-procura>
      <label class="procura__campo">
        ${ico('lupa')}
        <span class="so-leitor">Procurar na loja</span>
        <input type="search" name="q" placeholder="Bibe, mochila, fralda, Natal…" autocomplete="off" enterkeyhint="search" spellcheck="false" aria-controls="procura-resultados">
      </label>
      <button class="topo__botao" type="button" data-fechar aria-label="Fechar a procura">${ico('fechar')}</button>
    </form>
    <p class="so-leitor" role="status" data-procura-estado></p>
    <div class="procura__resultados" id="procura-resultados" data-procura-resultados hidden></div>
    <div class="procura__inicio" data-procura-inicio>
      <p class="etiqueta">${simbolo(ctx, { alto: 20, classe: 'etiqueta__simbolo' })}<span>Mais procurados</span></p>
      <div class="fichas">
        ${atalhos.map((c) => `<a href="${ctx.url(caminhoDaCategoria(c))}">${esc(nomeDaCategoria(c))}</a>`).join('\n        ')}
      </div>
    </div>
  </div>
</dialog>`;
}

/* O RODAPÉ (curto, como o Renato quer: o logótipo, a frase, as redes, quatro ligações de ajuda e, em
   baixo, o «©» só com o ano e a marca e as legais, com o Livro de Reclamações discreto). Por cima, o
   fio com o «&». */
/* AS ENCOMENDAS, no rodapé de todas as páginas: por onde se pede (o WhatsApp se houver, senão a mensagem
   no Instagram; e o email), onde é o showroom, e numa linha os envios e o pagamento. Sem o horário, o
   telefone nem a morada inteira (ficam nos Contactos). */
function encomendasDoRodape(ctx) {
  const c = ctx.site.contactos || {};
  const en = ctx.site.entrega || {};
  const linha = (icone, html) => `<li><span class="rodape__icone" aria-hidden="true">${ico(icone)}</span><span>${html}</span></li>`;
  const itens = [];
  if (c.whatsapp) itens.push(linha('whatsapp', `<a href="https://wa.me/${numeroWhatsApp(c.whatsapp)}" target="_blank" rel="noopener">Pedidos pelo WhatsApp</a>`));
  else if (c.instagram) itens.push(linha('instagram', `<a href="https://ig.me/m/${esc(c.instagram)}" target="_blank" rel="noopener">Pedidos pelo Instagram</a>`));
  if (c.email) itens.push(linha('carta', `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`));
  const local = [ctx.site.local?.localidade, ctx.site.local?.distrito].filter(Boolean).join(', ');
  if (local) itens.push(linha('casa', `Showroom em ${esc(local)}`));
  itens.push(linha('caixa', `Envios por CTT para todo o país${en.pagamento ? `<br>${esc(en.pagamento)}` : ''}`));
  return `<div class="rodape__coluna rodape__encomendas">
        <h2 class="rodape__titulo">Encomendas</h2>
        <ul role="list">
          ${itens.join('\n          ')}
        </ul>
      </div>`;
}

function rodape(ctx) {
  const ligacao = (caminho, texto) => (ctx.existe(caminho) ? `<li><a href="${ctx.url(caminho)}">${esc(texto)}</a></li>` : '');
  return `<footer class="rodape">
  <div class="contentor">
    <div class="rodape__fio" aria-hidden="true"><span></span>${simbolo(ctx, { alto: 34, classe: 'rodape__simbolo' })}<span></span></div>
    <div class="rodape__grelha">
      <div class="rodape__marca">
        <a class="rodape__logo" href="${ctx.url('/')}">${pecaDoLogo(ctx, 'logo', { alto: 72, alt: `${ctx.site.marca} — página inicial` })}</a>
        <p class="rodape__frase">${esc(ctx.site.assinatura || '')}</p>
        ${redes(ctx)}
      </div>
      <nav class="rodape__coluna" aria-labelledby="r-loja">
        <h2 class="rodape__titulo" id="r-loja">A loja</h2>
        <ul role="list">
          ${linhasComArtigos(ctx).map((l) => `<li><a href="${ctx.url(caminhoDaLinha(l))}">${esc(l.nome)}</a></li>`).join('\n          ')}
        </ul>
      </nav>
      <nav class="rodape__coluna" aria-labelledby="r-ajuda">
        <h2 class="rodape__titulo" id="r-ajuda">Ajuda</h2>
        <ul role="list">
          ${ligacao('/como-encomendar/', 'Como encomendar')}
          ${ligacao('/perguntas-frequentes/', 'Perguntas frequentes')}
          ${ligacao('/sobre-nos/', 'Sobre nós')}
          ${ligacao('/contactos/', 'Contactos')}
        </ul>
      </nav>
      ${encomendasDoRodape(ctx)}
    </div>
    <div class="rodape__legal">
      <p>© ${ctx.hoje.slice(0, 4)} ${esc(ctx.site.marca)}</p>
      <ul role="list">
        ${ligacao('/termos-e-condicoes/', 'Termos e condições')}
        ${ligacao('/politica-de-privacidade/', 'Privacidade')}
        ${ligacao('/politica-de-cookies/', 'Cookies')}
        ${ligacao('/resolucao-de-litigios/', 'Litígios')}
        <li>${livroBotao()}</li>
      </ul>
    </div>
  </div>
</footer>`;
}

/* O botão do WhatsApp, a flutuar no canto, só depois de descer (nucleo.js) e só com número; não aparece
   na página do pedido (lá, o botão principal já é o envio). */
function botaoWhatsApp(ctx, caminho) {
  const w = wa(ctx);
  if (!w || caminho === '/pedido/') return '';
  return `<a class="whats" href="${w}" target="_blank" rel="noopener" aria-label="Enviar mensagem pelo WhatsApp" data-flutua hidden>${ico('whatsapp')}</a>`;
}

export function pagina(ctx, { titulo, descricao, caminho, conteudo, partilha, tipo = 'website', jsonld = [], classe = '', indexar = true }) {
  const marca = ctx.site.marca;
  const tituloCompleto = titulo.includes(marca) ? titulo : `${titulo} | ${marca}`;
  const cartaoPartilha = partilha || ctx.manifesto.partilha._site;
  const l = ctx.manifesto.logo;
  const robots = !ctx.producao ? 'noindex, nofollow' : indexar === false ? 'noindex' : '';
  return `<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(tituloCompleto)}</title>
<meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${ctx.absoluto(caminho)}">
${robots ? `<meta name="robots" content="${robots}">\n` : ''}<meta property="og:type" content="${tipo}">
<meta property="og:site_name" content="${esc(marca)}">
<meta property="og:locale" content="pt_PT">
<meta property="og:title" content="${esc(tituloCompleto)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${ctx.absoluto(caminho)}">
<meta property="og:image" content="${ctx.absoluto(`/assets/img/${cartaoPartilha}`)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(marca)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FBF8F3">
<link rel="icon" type="image/png" sizes="32x32" href="${ctx.asset(`img/${l.icones[32]}`)}">
<link rel="icon" type="image/png" sizes="48x48" href="${ctx.asset(`img/${l.icones[48]}`)}">
<link rel="apple-touch-icon" href="${ctx.asset(`img/${l.icones.apple}`)}">
<link rel="preload" href="${ctx.asset('fontes/lora-latin.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${ctx.asset('fontes/lato-400-latin.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${ctx.asset(ctx.ficheiros.css)}">
<script>document.documentElement.classList.add('js')</script>
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
<script src="${ctx.asset(ctx.ficheiros.js)}" defer></script>
</head>
<body${classe ? ` class="${esc(classe)}"` : ''} data-catalogo="${ctx.asset(ctx.ficheiros.catalogo)}" data-base="${ctx.url('/')}">
${sprite()}
<a class="saltar" href="#conteudo">Saltar para o conteúdo</a>
${aviso(ctx)}
${cabecalho(ctx, caminho)}
<main id="conteudo" tabindex="-1">
${conteudo}
</main>
${rodape(ctx)}
${botaoWhatsApp(ctx, caminho)}
${gaveta(ctx, caminho)}
${procura(ctx)}
<div class="recado" role="status" aria-live="polite" data-recado></div>
</body>
</html>
`;
}

/* Um endereço antigo que reencaminha (/carrinho/ → /pedido/). */
export function reencaminhar(ctx, { para, texto = 'Continuar' }) {
  const alvo = ctx.url(para);
  return `<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(ctx.site.marca)}</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${ctx.absoluto(para)}">
<meta http-equiv="refresh" content="0; url=${alvo}">
<script>location.replace(${JSON.stringify(alvo)} + location.search + location.hash)</script>
</head>
<body>
<p><a href="${alvo}">${esc(texto)}</a></p>
</body>
</html>
`;
}
