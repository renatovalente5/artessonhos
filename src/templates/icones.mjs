// Os ícones da Artes & Sonhos: traço de 1,6 em 24×24, pontas e cantos redondos, na cor do texto à volta
// (o bronze do «&» do logótipo aparece nos círculos onde vivem). Vão uma vez por página, num <svg>
// escondido no topo do <body> (os <symbol>); cada ícone é um <use href="#i-nome">. O JavaScript usa os
// mesmos (ico() no nucleo.js). Os das redes (Instagram, Facebook, WhatsApp) são os desenhos dessas
// marcas, numa cor só. Todos levam aria-hidden: o nome do botão ou da ligação é que diz o que fazem.
// O «&» da marca NÃO é um ícone: é o desenho da cliente (media/marca/simbolo.png), que nunca se redesenha.

const S = {
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  lupa: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  saco: '<path d="M5 8h14l-1.2 12H6.2L5 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  fechar: '<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>',
  mais: '<path d="M12 6.5v11M6.5 12h11"/>',
  menos: '<path d="M6.5 12h11"/>',
  seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  voltar: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  chevron: '<path d="m9.5 6 6 6-6 6"/>',
  baixo: '<path d="m6 9.5 6 6 6-6"/>',
  lixo: '<path d="M5 7h14M10 10.8v5.6M14 10.8v5.6M6.7 7l.8 11.4a1.8 1.8 0 0 0 1.8 1.6h5.4a1.8 1.8 0 0 0 1.8-1.6L17.3 7M9.3 7V5.5a1.6 1.6 0 0 1 1.6-1.6h2.2a1.6 1.6 0 0 1 1.6 1.6V7"/>',
  certo: '<path d="m5.5 12.5 4.2 4.2L18.5 8"/>',
  calendario: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.2 3.5v4M15.8 3.5v4"/>',
  info: '<circle cx="12" cy="12" r="8.2"/><path d="M12 11v5M12 8v.1"/>',
  carta: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4 7.5 8 5.6 8-5.6"/>',
  local: '<path d="M12 21s-6.4-5.6-6.4-10.9a6.4 6.4 0 0 1 12.8 0C18.4 15.4 12 21 12 21Z"/><circle cx="12" cy="10.1" r="2.3"/>',
  telefone: '<path d="M6.7 4h2.5c.4 0 .7.3.8.6l.9 3.5a.9.9 0 0 1-.3.9l-1.5 1.1a11 11 0 0 0 4.8 4.8l1.1-1.5a.9.9 0 0 1 .9-.3l3.5.9c.4.1.6.4.6.8v2.5a1.8 1.8 0 0 1-1.8 1.8A15.4 15.4 0 0 1 4.9 5.8 1.8 1.8 0 0 1 6.7 4Z"/>',
  copiar: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.2"/><path d="M15.5 8.5V6.2a1.7 1.7 0 0 0-1.7-1.7H6.2a1.7 1.7 0 0 0-1.7 1.7v7.6a1.7 1.7 0 0 0 1.7 1.7h2.3"/>',
  // a faixa de confiança e a página inicial (regras.mjs, ICONES_CONFIANCA): um desenho para cada nome
  casa: '<path d="M3.8 10.6 12 4.2l8.2 6.4V20H3.8v-9.4Z"/><path d="M9.7 20v-5.1h4.6V20"/>',
  caixa: '<path d="M3.5 7.3h11v9.2h-11zM14.5 10.3h3.7l2.8 3v3.2h-6.5z"/><circle cx="7.3" cy="17.6" r="1.6"/><circle cx="17" cy="17.6" r="1.6"/>',
  cartao: '<rect x="3.2" y="6" width="17.6" height="12" rx="2.5"/><path d="M3.2 10h17.6M7 14.6h3.6"/>',
  mao: '<path d="M8.5 12.2V6.3a1.4 1.4 0 0 1 2.8 0v5.2M11.3 11V4.9a1.4 1.4 0 0 1 2.8 0V11M14.1 11.2V6.3a1.4 1.4 0 0 1 2.8 0v7.3c0 3.7-2.4 6.4-5.8 6.4-2.4 0-3.9-1.1-5-3l-2-3.5a1.4 1.4 0 0 1 2.4-1.4l1.7 2.4"/>',
  coracao: '<path d="M12 19.6s-7.4-4.5-7.4-10C4.6 7 6.6 5 9 5c1.4 0 2.4.6 3 1.7.6-1.1 1.6-1.7 3-1.7 2.4 0 4.4 2 4.4 4.6 0 5.5-7.4 10-7.4 10Z"/>',
  estrela: '<path d="m12 4.3 2.3 4.8 5.2.7-3.8 3.6.9 5.2L12 16.1l-4.6 2.5.9-5.2-3.8-3.6 5.2-.7L12 4.3Z"/>',
  presente: '<rect x="4" y="9" width="16" height="11" rx="1.6"/><path d="M3.3 9h17.4M12 9v11M12 9c-1.3-2.8-4.6-3.6-5-1.5-.4 2 3.2 1.5 5 1.5Zm0 0c1.3-2.8 4.6-3.6 5-1.5.4 2-3.2 1.5-5 1.5Z"/>',
  mensagem: '<path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-4.2 3.2V16.5h.7a2 2 0 0 1-2-2v-8Z"/>',
  pincel: '<path d="M14.3 4.6 19.4 9.7l-7.6 7.6-5.1-5.1 7.6-7.6Z"/><path d="M6.7 12.2 4.6 14.3c-1 1-1 2.6 0 3.6l1.5 1.5c1 1 2.6 1 3.6 0l2.1-2.1"/>',
  agulha: '<path d="M18.6 4.4 6.2 16.8"/><path d="M15.7 4.9a1.6 1.6 0 1 1 2.3 2.3"/><path d="M6.2 16.8 4.4 19.6l2.8-1.8"/><path d="M9 9.5c-3-1.2-5.2.6-4.4 2.6.9 2.2 5.2.6 6.6 3.3 1.1 2.1-.8 4.6-4.1 4.1"/>',
  // as redes, numa cor só
  instagram: '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>',
  facebook: '<path fill="currentColor" stroke="none" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3Z"/>',
  whatsapp: '<path fill="currentColor" stroke="none" d="M12 3.5a8.4 8.4 0 0 0-7.2 12.7L3.7 20.4l4.3-1.1A8.4 8.4 0 1 0 12 3.5Zm0 15.3a6.9 6.9 0 0 1-3.6-1l-.3-.1-2.5.7.7-2.5-.2-.3A6.9 6.9 0 1 1 12 18.8Zm3.8-5.2c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1l-.6.8c-.1.1-.2.2-.4.1a5.6 5.6 0 0 1-2.8-2.5c-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4l-.6-1.5c-.2-.4-.3-.3-.5-.3h-.4a.8.8 0 0 0-.6.3 2.4 2.4 0 0 0-.8 1.8 4.2 4.2 0 0 0 .9 2.2 9.4 9.4 0 0 0 3.6 3.2c1.3.6 1.9.6 2.5.5a2.2 2.2 0 0 0 1.4-1 1.8 1.8 0 0 0 .1-1c0-.1-.2-.2-.5-.3Z"/>',
  livro: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z"/><path d="M8 20a3 3 0 0 1-3-3"/>',
};

export const NOMES_ICONES = Object.keys(S);

/** O <svg> escondido com todos os desenhos (um por página, no topo do <body>). */
export const sprite = () => `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">${Object.entries(S).map(([n, d]) => `<symbol id="i-${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</symbol>`).join('')}</svg>`;

/** Um ícone: <svg class="i i-nome"><use href="#i-nome"/></svg>. */
export function ico(nome, { classe = '' } = {}) {
  if (!S[nome]) throw new Error(`ícone «${nome}» não existe em src/templates/icones.mjs`);
  return `<svg class="i i-${nome}${classe ? ` ${classe}` : ''}" aria-hidden="true" focusable="false"><use href="#i-${nome}"/></svg>`;
}
