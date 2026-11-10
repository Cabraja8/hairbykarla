import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CURRENCY = 'EUR';
const ANCHOR_DATE = '2026-09-10';
const CURRENT_VERSION_DATE = '2026-11-10';
const ARCHIVE_VERSION_DATE = '2026-09-10';

const archivedRows = [
  ['Frizure & styling', 'Pranje kose i frizura 1', 15],
  ['Frizure & styling', 'Pranje kose i frizura 2', 17],
  ['Frizure & styling', 'Pranje kose i frizura 3', 20],
  ['Frizure & styling', 'Pranje kose i frizura 4', 25],
  ['Frizure & styling', 'Valovi', 2],
  ['Frizure & styling', 'Frizura s figarom', 18],
  ['Frizure & styling', 'Pranje kose, šišanje i frizura 1', 35],
  ['Frizure & styling', 'Pranje kose, šišanje i frizura 2', 38],
  ['Frizure & styling', 'Pranje kose, šišanje i frizura 3', 41],
  ['Frizure & styling', 'Pranje kose, šišanje i frizura 4', 45],
  ['Frizure & styling', 'Dječije žensko šišanje', 20],
  ['Frizure & styling', 'Dječije žensko šišanje s pranjem', 25],
  ['Bojanje', 'Farbanje izrasta i frizura 1', 45],
  ['Bojanje', 'Farbanje izrasta i frizura 2', 47],
  ['Bojanje', 'Farbanje izrasta i frizura 3', 50],
  ['Bojanje', 'Farbanje cijele dužine 1', 20],
  ['Bojanje', 'Farbanje cijele dužine 2', 30],
  ['Bojanje', 'Preljev', 15],
  ['Bojanje', 'Farbanje, šišanje i frizura 1', 65],
  ['Bojanje', 'Farbanje, šišanje i frizura 2', 70],
  ['Bojanje', 'Farbanje, šišanje i frizura 3', 75],
  ['Bojanje', 'Farbanje s korisnikovom bojom', 12],
  ['Bojanje', 'Farbanje', 20],
  ['Bojanje', 'Blajhanje', 50],
  ['Šišanje', 'Šišanje s mašinicom', 10],
  ['Šišanje', 'Šišanje s mašinicom i pranje kose', 13],
  ['Šišanje', 'Muško šišanje', 12],
  ['Šišanje', 'Muško šišanje s pranjem', 15],
  ['Šišanje', 'Dječije muško šišanje', 11],
  ['Šišanje', 'Šišanje šiški', 4],
  ['Pramenovi', 'Klasični pramenovi i frizura 1', 70],
  ['Pramenovi', 'Klasični pramenovi i frizura 2', 75],
  ['Pramenovi', 'Klasični pramenovi i frizura 3', 80],
  ['Pramenovi', 'Klasični pramenovi, šišanje i frizura 1', 85],
  ['Pramenovi', 'Klasični pramenovi, šišanje i frizura 2', 90],
  ['Pramenovi', 'Klasični pramenovi, šišanje i frizura 3', 95],
  ['Pramenovi', 'Balayage pramenovi, preljev i frizura 2', 100],
  ['Pramenovi', 'Balayage pramenovi, preljev i frizura 3', 110],
  ['Pramenovi', 'Balayage pramenovi, preljev, šišanje i frizura 2', 120],
  ['Pramenovi', 'Balayage pramenovi, preljev, šišanje i frizura 3', 130],
  ['Pramenovi', 'Površinski pramenovi', 30],
  ['Njega & detalji', 'Njega kose', 4],
  ['Njega & detalji', 'Čupanje obrva', 4],
  ['Njega & detalji', 'Farbanje obrva', 5],
  ['Njega & detalji', 'Svečana frizura', 35],
  ['Njega & detalji', 'Pletenica', 3],
  ['Njega & detalji', 'Botox', 25],
].map(([category, name, price], index) => ({
  id: `usluga-${String(index + 1).padStart(3, '0')}`,
  category,
  name,
  price,
  specialSale: 'Nema',
  anchorPrice: price,
  anchorDate: ANCHOR_DATE,
}));

const decodeHtml = (value) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .trim();

export const extractCurrentPriceRows = (html) => {
  const rows = [];
  const groupPattern = /<section class="price-group" data-category="[^"]+">([\s\S]*?)<\/section>/g;
  const itemPattern = /<li><span>([\s\S]*?)<\/span><strong>([\d.,]+)\s*€<\/strong><\/li>/g;

  for (const groupMatch of html.matchAll(groupPattern)) {
    const groupHtml = groupMatch[1];
    const categoryMatch = groupHtml.match(/<h3>([\s\S]*?)<\/h3>/);
    if (!categoryMatch) continue;

    const category = decodeHtml(categoryMatch[1]);
    for (const itemMatch of groupHtml.matchAll(itemPattern)) {
      const price = Number(itemMatch[2].replace(',', '.'));
      rows.push({
        id: `usluga-${String(rows.length + 1).padStart(3, '0')}`,
        category,
        name: decodeHtml(itemMatch[1]),
        price,
        specialSale: 'Nema',
        anchorPrice: price,
        anchorDate: ANCHOR_DATE,
      });
    }
  }

  return rows;
};

const csvCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
const priceValue = (value) => Number(value).toFixed(2);

const toCsv = (rows) => {
  const header = [
    'id',
    'kategorija',
    'naziv_usluge',
    'valuta',
    'trenutna_cijena_eur',
    'poseban_oblik_prodaje',
    'sidrena_cijena_eur',
    'datum_sidrene_cijene',
  ];
  const lines = rows.map((row) =>
    [
      row.id,
      row.category,
      row.name,
      CURRENCY,
      priceValue(row.price),
      row.specialSale,
      priceValue(row.anchorPrice),
      row.anchorDate,
    ]
      .map(csvCell)
      .join(','),
  );

  return `\uFEFF${header.map(csvCell).join(',')}\r\n${lines.join('\r\n')}\r\n`;
};

const xmlEscape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const toXml = (rows, versionDate) => {
  const services = rows
    .map(
      (row) => `    <usluga id="${xmlEscape(row.id)}">
      <kategorija>${xmlEscape(row.category)}</kategorija>
      <naziv>${xmlEscape(row.name)}</naziv>
      <valuta>${CURRENCY}</valuta>
      <trenutnaCijena>${priceValue(row.price)}</trenutnaCijena>
      <posebanOblikProdaje primjenjujeSe="false">${xmlEscape(row.specialSale)}</posebanOblikProdaje>
      <sidrenaCijena datum="${row.anchorDate}">${priceValue(row.anchorPrice)}</sidrenaCijena>
    </usluga>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<cjenik salon="Hair by Karla" valuta="${CURRENCY}" verzija="${versionDate}">
  <usluge>
${services}
  </usluge>
</cjenik>
`;
};

export const writeDigitalPriceFiles = async (html, outputDirectory) => {
  const currentRows = extractCurrentPriceRows(html);
  if (currentRows.length !== 47) {
    throw new Error(`Očekivano je 47 usluga, pronađeno ${currentRows.length}.`);
  }

  const archiveDirectory = join(outputDirectory, 'arhiva');
  await mkdir(archiveDirectory, { recursive: true });
  await Promise.all([
    writeFile(join(outputDirectory, 'cjenik.csv'), toCsv(currentRows), 'utf8'),
    writeFile(join(outputDirectory, 'cjenik.xml'), toXml(currentRows, CURRENT_VERSION_DATE), 'utf8'),
    writeFile(join(archiveDirectory, 'cjenik-2026-09-10.csv'), toCsv(archivedRows), 'utf8'),
    writeFile(join(archiveDirectory, 'cjenik-2026-09-10.xml'), toXml(archivedRows, ARCHIVE_VERSION_DATE), 'utf8'),
  ]);
};
