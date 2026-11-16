#!/usr/bin/env node
// Testes do site da Artes & Sonhos (Node 22, sem dependências nem browser). Correm no CI antes de cada
// publicação (o passo «Testar o gerador»): as regras com dados de ensaio escritos aqui, e uma construção
// do conteúdo de agora numa pasta temporária (nunca no _site/).
//
//   node scripts/testar.mjs          (precisa da cache das imagens: python3 scripts/imagens.py)
//
// O CONTEÚDO É DA LOJA, QUE O MUDA NO PAINEL: nada aqui depende do que o content/ diz hoje, a não ser
// que constrói (e, se não construir, o gerador do passo seguinte dá as razões ao painel).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as R from '../src/lib/regras.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let passaram = 0;
let falharam = 0;
function teste(nome, fn) {
  try { fn(); passaram++; console.log(`  ✓ ${nome}`); } catch (e) { falharam++; console.log(`  ✗ ${nome}\n      ${String(e.message).split('\n').join('\n      ')}`); }
}
const artigo = (extra = {}) => ({ nome: 'Bibe de ensaio', resumo: 'Um bibe.', descricao: 'Um bibe de ensaio.', categoria: 'bibes', fotos: ['foto-de-ensaio'], ...extra });
const ctxArtigo = (extra = {}) => ({ nome: 'bibe-de-ensaio', categorias: ['bibes'], fotos: new Set(['foto-de-ensaio']), videos: [], hoje: '2026-11-16', ...extra });

console.log('As regras');
teste('as quatro linhas são fixas e por esta ordem', () => assert.deepEqual([...R.LINHAS], ['bebe', 'personalizados', 'datas-especiais', 'pinturas-e-retratos']));
teste('um artigo sem preço não se esconde, nem no domínio aberto: é só um lembrete («Preço sob consulta»)', () => {
  for (const producao of [false, true]) {
    const ps = R.problemasDoArtigo(artigo(), ctxArtigo({ producao }));
    assert.equal(ps.filter((p) => p.classe === 'neutraliza').length, 0, JSON.stringify(ps));
    assert.ok(ps.some((p) => p.chave === 'artigo:bibe-de-ensaio:preco:sob-consulta' && p.lembrete));
  }
});
teste('um preço que não é número esconde o artigo', () => {
  const ps = R.problemasDoArtigo(artigo({ preco: '12 €' }), ctxArtigo());
  assert.ok(ps.some((p) => p.classe === 'neutraliza' && p.campo === 'preco'));
});
teste('«destaque» e «esgotado» são interruptores (sim ou não)', () => {
  const ps = R.problemasDoArtigo(artigo({ preco: 12, destaque: 'sim', esgotado: 1 }), ctxArtigo());
  assert.ok(ps.some((p) => p.campo === 'destaque') && ps.some((p) => p.campo === 'esgotado'));
  assert.ok(R.CAMPOS_ARTIGO.includes('destaque') && R.CAMPOS_ARTIGO.includes('esgotado'));
});
teste('uma categoria sem linha (ou com o endereço de uma linha) pára a publicação', () => {
  const base = { nome: 'Bibes', titulo: 'Bibes', resumo: 'Bibes.', foto: 'foto-de-ensaio' };
  const fotos = new Set(['foto-de-ensaio']);
  assert.ok(R.problemasDasCategorias([{ slug: 'bibes', ...base }], { fotos }).some((p) => p.classe === 'bloqueia' && p.campo === '0.linha'));
  assert.ok(R.problemasDasCategorias([{ slug: 'bebe', linha: 'bebe', ...base }], { fotos }).some((p) => p.classe === 'bloqueia'));
  assert.equal(R.problemasDasCategorias([{ slug: 'bibes', linha: 'personalizados', ...base }], { fotos }).length, 0);
});
teste('as linhas fora de ordem, ou a mais, param a publicação', () => {
  const l = (slug) => ({ slug, nome: slug, titulo: slug, resumo: slug, foto: 'f' });
  const fotos = new Set(['f']);
  assert.equal(R.problemasDasLinhas(R.LINHAS.map(l), { fotos }).length, 0);
  assert.ok(R.problemasDasLinhas([...R.LINHAS].reverse().map(l), { fotos }).some((p) => p.classe === 'bloqueia'));
  assert.ok(R.problemasDasLinhas([...R.LINHAS, 'outra'].map(l), { fotos }).some((p) => p.classe === 'bloqueia'));
});
teste('o painel não muda a linha de uma categoria, nem a ordem das linhas', () => {
  assert.equal(R.mudancasBloqueadas([{ slug: 'bibes', linha: 'personalizados' }], [{ slug: 'bibes', linha: 'bebe' }], 'categorias').length, 1);
  assert.equal(R.mudancasBloqueadas([{ slug: 'bibes', linha: 'personalizados', nome: 'A' }], [{ slug: 'bibes', linha: 'personalizados', nome: 'B' }], 'categorias').length, 0);
  assert.equal(R.mudancasBloqueadas([{ slug: 'bebe' }, { slug: 'personalizados' }], [{ slug: 'personalizados' }, { slug: 'bebe' }], 'linhas').length, 2);
});
teste('as zonas de envio são as dos CTT: continente e ilhas (e o levantamento)', () => assert.deepEqual([...R.ZONAS_ENVIO], ['continente', 'ilhas']));

console.log('O conteúdo de agora');
const ler = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8');
teste('a página inicial, as linhas e as categorias não têm nada que pare a publicação', () => {
  const ficheirosFotos = fs.readdirSync(path.join(RAIZ, 'media/fotos')).filter((f) => f.endsWith('.jpg')).map((f) => f.slice(0, -4));
  const dados = { site: ler('content/site.json'), inicio: ler('content/inicio.json'), linhas: ler('content/linhas.json'), categorias: ler('content/categorias.json'), fotos: ler('content/fotos.json'), ficheirosFotos, videos: [] };
  const bloqueiam = R.problemas(dados, { hoje: '2026-11-16' }).filter((p) => p.classe === 'bloqueia');
  assert.equal(bloqueiam.length, 0, bloqueiam.map((p) => `${p.ecra}: ${p.mensagem}`).join('\n'));
});

console.log('A construção (numa pasta temporária)');
const cache = path.join(RAIZ, '.cache/imagens/manifesto.json');
if (!fs.existsSync(cache)) {
  console.log('  — sem a cache das imagens (python3 scripts/imagens.py): a construção não se testa aqui');
} else {
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'artessonhos-teste-'));
  const r = spawnSync(process.execPath, [path.join(RAIZ, 'scripts/build.mjs'), '--sem-imagens', `--saida=${saida}`, '--base=/artessonhos'], { cwd: RAIZ, encoding: 'utf8' });
  teste('o site constrói', () => assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`.slice(-3000)));
  if (r.status === 0) {
    const existe = (rel) => fs.existsSync(path.join(saida, rel));
    const html = (rel) => fs.readFileSync(path.join(saida, rel), 'utf8');
    teste('há a página inicial, as linhas que têm artigos, o pedido e os contactos', () => {
      for (const f of ['index.html', 'pedido/index.html', 'contactos/index.html', '404.html']) assert.ok(existe(f), f);
      const categorias = JSON.parse(ler('content/categorias.json'));
      const comArtigos = new Set(fs.readdirSync(path.join(RAIZ, 'content/produtos')).map((f) => JSON.parse(ler(`content/produtos/${f}`))).filter((a) => a.publicado !== false).map((a) => a.categoria));
      for (const c of categorias) assert.equal(existe(`${c.linha}/${c.slug}/index.html`), comArtigos.has(c.slug), `${c.linha}/${c.slug}`);
    });
    teste('a pré-visualização é noindex e não carrega nada de fora', () => {
      const h = html('index.html');
      assert.ok(h.includes('name="robots" content="noindex'));
      assert.ok(!/<(script|link)[^>]+(src|href)="https?:\/\/(?!renatovalente5\.github\.io)/.test(h.replace(/<link rel="canonical"[^>]*>/g, '')));
    });
    teste('o catálogo do browser tem os caminhos do pedido (Instagram e email) e as zonas dos CTT', () => {
      const f = fs.readdirSync(path.join(saida, 'assets')).find((x) => /^catalogo-.*\.json$/.test(x));
      const cat = JSON.parse(fs.readFileSync(path.join(saida, 'assets', f), 'utf8'));
      assert.ok(cat.instagram && cat.email);
      assert.deepEqual(cat.zonas.map((z) => z.id).filter((z) => z !== 'levantamento'), ['continente', 'ilhas']);
      assert.ok(Object.keys(cat.produtos).length > 0);
    });
    teste('os cartões não compram (só a ficha tem o formulário)', () => {
      const h = html('index.html');
      assert.ok(!h.includes('data-juntar="'), 'há um botão de juntar num cartão');
    });
  }
  fs.rmSync(saida, { recursive: true, force: true });
}

console.log(`\n${passaram} passaram, ${falharam} falharam`);
process.exit(falharam ? 1 : 0);
