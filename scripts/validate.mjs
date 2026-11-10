import { readFile, access, cp, copyFile, mkdir, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { writeDigitalPriceFiles } from './digital-price-list.mjs';

const html = await readFile('index.html', 'utf8');
const css = await readFile('style.css', 'utf8');
const script = await readFile('script.js', 'utf8');

const requiredFiles = [
  'script.js',
  'slike/logo.png',
  'slike/friz1.jpeg',
  'slike/friz2.jpeg',
  'slike/friz3.jpeg',
  'slike/friz4.jpeg',
  'slike/friz5.jpeg',
  'slike/friz6.jpeg',
  'slike/og.png',
];

await Promise.all(requiredFiles.map((file) => access(file)));

const checks = [
  ['Croatian language', html.includes('lang="hr"')],
  ['single-page sections', ['pocetna', 'radovi', 'cjenik', 'kontakt'].every((id) => html.includes(`id="${id}"`))],
  ['responsive viewport', html.includes('name="viewport"')],
  [
    'price list',
    (html.match(/<li><span>/g) || []).length === 47 &&
      html.includes('<span>Pranje kose i frizura 1</span><strong>20 €</strong>') &&
      html.includes('<span>Klasični pramenovi s bojom i frizura</span><strong>70 €</strong>') &&
      html.includes('<span>Balayage pramenovi, preljev, šišanje i frizura 3</span><strong>160 €</strong>') &&
      !html.includes('Čupanje obrva'),
  ],
  ['working hours', html.includes('08:00 – 20:00 h') && html.includes('08:00 – 13:00 h')],
  ['social links', html.includes('instagram.com/_hairbykarla_') && html.includes('facebook.com/profile.php?id=100075678672406')],
  ['social app icons', (html.match(/class="social-icon/g) || []).length === 2],
  ['mobile overflow guard', css.includes('overflow-x: hidden') && css.includes('max-width: 100%')],
  ['mobile price columns', css.includes('overflow-wrap: anywhere') && css.includes('white-space: nowrap')],
  ['anchor prices', script.includes("date.textContent = '10.09.2026.'") && script.includes("anchor.className = 'anchor-price'")],
  [
    'digital price list links',
    html.includes('href="digitalni-cjenik/cjenik.csv"') &&
      html.includes('href="digitalni-cjenik/cjenik.xml"') &&
      html.includes('digitalni-cjenik/arhiva/cjenik-2026-09-10.csv'),
  ],
  ['full-screen mobile menu', css.includes('body.menu-open .site-header') && css.includes('height: 100dvh')],
  ['responsive styles', css.includes('@media (max-width: 720px)')],
  ['reduced motion support', css.includes('prefers-reduced-motion')],
];

const failures = checks.filter(([, passed]) => !passed);
if (failures.length) {
  failures.forEach(([name]) => console.error(`Failed: ${name}`));
  process.exit(1);
}

const root = resolve('.');
const output = resolve('dist');
if (!output.startsWith(`${root}${sep}`)) {
  throw new Error('Refusing to write outside the project.');
}

await writeDigitalPriceFiles(html, resolve('digitalni-cjenik'));

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all([
  copyFile('index.html', 'dist/index.html'),
  copyFile('cjenik.html', 'dist/cjenik.html'),
  copyFile('kontakt.html', 'dist/kontakt.html'),
  copyFile('style.css', 'dist/style.css'),
  copyFile('script.js', 'dist/script.js'),
  cp('slike', 'dist/slike', { recursive: true }),
  cp('digitalni-cjenik', 'dist/digitalni-cjenik', { recursive: true }),
]);

const [digitalCsv, digitalXml, archiveCsv] = await Promise.all([
  readFile('dist/digitalni-cjenik/cjenik.csv', 'utf8'),
  readFile('dist/digitalni-cjenik/cjenik.xml', 'utf8'),
  readFile('dist/digitalni-cjenik/arhiva/cjenik-2026-09-10.csv', 'utf8'),
]);

const digitalChecks = [
  ['digital CSV rows', digitalCsv.trim().split(/\r?\n/).length === 48],
  ['digital CSV fields', digitalCsv.includes('"trenutna_cijena_eur"') && digitalCsv.includes('"sidrena_cijena_eur"')],
  ['digital XML services', (digitalXml.match(/<usluga id=/g) || []).length === 47],
  ['digital XML fields', digitalXml.includes('<posebanOblikProdaje') && digitalXml.includes('<sidrenaCijena datum="2026-09-10">')],
  ['digital archive', archiveCsv.trim().split(/\r?\n/).length === 48 && archiveCsv.includes('"Čupanje obrva"')],
];

const digitalFailures = digitalChecks.filter(([, passed]) => !passed);
if (digitalFailures.length) {
  digitalFailures.forEach(([name]) => console.error(`Failed: ${name}`));
  process.exit(1);
}

console.log('Static site validation and build passed.');
