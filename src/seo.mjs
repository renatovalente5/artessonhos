/* O SEO À MÃO: o que as pessoas escrevem no Google («bibes personalizados», «mala de maternidade») e
   que os nomes curtos do site não dizem. Só mexe no <title> (e no og:title); o H1, as migalhas e o menu
   continuam com os nomes da loja. Uma categoria sem entrada aqui fica com o título que tem, mais a linha. */
export const TITULOS_DAS_CATEGORIAS = Object.freeze({
  'primeira-roupinha': 'Primeira roupinha do bebé para a maternidade',
  conjuntos: 'Conjuntos de bebé para menino e menina',
  'vestidos-e-fofos': 'Vestidos e fofos de bebé',
  'bodies-e-babygrows': 'Bodies, babygrows e jardineiras de bebé',
  'casacos-e-malhas': 'Casacos de malha, botinhas e gorros de bebé',
  acessorios: 'Acessórios para o bebé: laços, collants e prende-chuchas',
  quarto: 'Lençóis, edredões e ninhos para o quarto do bebé',
  mantas: 'Mantas de bebé com peluche, malha e polar',
  passeio: 'Sacos e forras para o ovo e a alcofa',
  banho: 'Toalhas de banho de bebé com capuz',
  maternidade: 'Malas de maternidade, porta-documentos e muda-fraldas',
  bibes: 'Bibes escolares personalizados com nome',
  'mochilas-e-sacos': 'Mochilas e sacos personalizados para a creche',
  'fraldas-e-babetes': 'Fraldas e babetes personalizados com nome',
  'bodies-com-frase': 'Bodies de bebé personalizados com frase',
  'tapa-ovos': 'Tapa-ovos personalizados para o bebé',
  doudous: 'Doudous personalizados com nome',
  'mantas-personalizadas': 'Mantas de bebé personalizadas com nome',
  'lembrancas-em-madeira': 'Lembranças em madeira personalizadas',
  natal: 'Presentes de Natal personalizados',
  'dia-do-pai': 'Presentes personalizados para o Dia do Pai',
  'dia-da-mae': 'Presentes personalizados para o Dia da Mãe',
  'dia-dos-avos': 'Presentes personalizados para os avós',
  padrinhos: 'Presentes e convites personalizados para os padrinhos',
  batizado: 'Conjuntos de batizado personalizados',
  retratos: 'Retratos a carvão por encomenda',
  pinturas: 'Pinturas a óleo por encomenda',
});
/* O Google mostra cerca de 60 caracteres do título; com « | Artes & Sonhos» (17), o resto cabe em 45. */
const CABE = 45;

export function tituloDaCategoria(c, linha) {
  const t = c && TITULOS_DAS_CATEGORIAS[c.slug];
  if (t) return t;
  const comLinha = linha ? `${c.titulo} · ${linha.nome}` : c.titulo;
  return comLinha.length <= CABE ? comLinha : c.titulo;
}

export function tituloDoArtigo(p) {
  return String(p.nome || '').trim();
}
