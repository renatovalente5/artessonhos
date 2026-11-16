# Artes & Sonhos — o site

Site da **Artes & Sonhos** («pinturas & retratos», Maceira, Leiria): o enxoval do bebé (primeira
roupinha, conjuntos, mantas, quarto, malas de maternidade), peças personalizadas pintadas e bordadas à
mão (bibes, mochilas, fraldas, babetes, tapa-ovos, doudous, lembranças em madeira), presentes para
datas especiais e retratos/pinturas por encomenda. Instagram @artessonhos_, Facebook
«Artes & Sonhos - Pinturas & Retratos».

**Não há pagamentos no site.** O cliente junta as peças ao pedido (com o nome e o tema de cada uma),
escolhe a entrega e envia o pedido escrito — pelo WhatsApp quando a loja tiver número, pelo Instagram
(a mensagem copia-se e abre-se a conversa) ou por email. A loja responde com o preço («sob consulta»
nas peças sem preço), os portes e o prazo; o pagamento é por MB WAY ou transferência.

- **Começado a 16 nov 2026**, «sem compromisso», para a loja ver. Pré-visualização no GitHub Pages
  (`.github/workflows/pre-visualizacao.yml`, `--base=/artessonhos`, noindex). Para o domínio, os
  workflows estão em `docs/para-o-dominio/`.
- **O desenho**: a proposta A, «Marfim» (escolhida pelo Renato a 16 nov 2026), com a capa em cartão e
  as categorias em círculos da proposta B, e o «&» dourado do logótipo como motivo que se repete.
  Letras: Lora e Lato (a letra do logótipo). As propostas estão em `propostas/` (fora do git).
- **O catálogo** vem da arrumação dos 111 álbuns do Facebook da loja (e das publicações recentes do
  Instagram) em 4 linhas e 38 categorias: `_cliente/notas/categorias.json` (fora do git). As
  fotografias com caras, personagens (Disney, Hello Kitty, Patrulha Pata…) ou clubes ficaram de fora.

## Correr

```bash
python3 scripts/imagens.py        # as versões web das fotografias (Pillow), para .cache/imagens
node scripts/build.mjs            # o site em _site/ (python3 -m http.server 4975 --directory _site)
node scripts/build.mjs --base=/artessonhos   # como no GitHub Pages
node scripts/build.mjs --producao            # como no domínio: pára se faltar um dado que a lei pede
```

## Onde está cada coisa

| | |
|---|---|
| `content/site.json` | marca, contactos, dados legais, aviso do topo, entrega (levantamento, CTT continente e ilhas), portes, prazo, pagamento |
| `content/linhas.json` | as quatro linhas (Bebé, Personalizados, Datas especiais, Pinturas e retratos): `/<linha>/` |
| `content/categorias.json` | as categorias, cada uma numa linha: `/<linha>/<categoria>/` (as vazias não aparecem) |
| `content/produtos/*.json` | um ficheiro por peça (o nome do ficheiro é o endereço `/produtos/<slug>/`) |
| `content/inicio.json` | a página inicial: a capa, os círculos, as linhas, o destaque (Natal), personalizar, os mais pedidos, as opiniões, a confiança |
| `content/paginas/*.md` | páginas de texto (sobre nós, como encomendar, perguntas, legais), com marcadores `{{…}}` |
| `content/fotos.json` | texto alternativo e ponto de foco de cada fotografia |
| `media/fotos/` | as fotografias (as versões web faz o `scripts/imagens.py`) |
| `media/marca/` | o logótipo da cliente (`logo.png`) e o «&» (`simbolo.png`), só recortados: nunca redesenhados |
| `src/lib/regras.mjs` | as regras dos dados: as mesmas no gerador e no painel (cópia byte a byte) |
| `legal-comum/` | as peças legais comuns aos sites do Renato (instalada por `_ferramentas/legal-comum`) |

O material da loja (as fotografias e legendas do Facebook e do Instagram, o logótipo original, a
arrumação e os scripts que os tiraram) está em `_cliente/`, fora do git.
