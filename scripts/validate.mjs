import { readFile, access, cp, copyFile, mkdir, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const html = await readFile('index.html', 'utf8');
const css = await readFile('style.css', 'utf8');

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
  ['price list', (html.match(/<li><span>/g) || []).length === 47],
  ['working hours', html.includes('08:00 – 20:00 h') && html.includes('08:00 – 13:00 h')],
  ['social links', html.includes('instagram.com/_hairbykarla_') && html.includes('facebook.com/profile.php?id=100075678672406')],
  ['social app icons', (html.match(/class="social-icon/g) || []).length === 2],
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

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all([
  copyFile('index.html', 'dist/index.html'),
  copyFile('cjenik.html', 'dist/cjenik.html'),
  copyFile('kontakt.html', 'dist/kontakt.html'),
  copyFile('style.css', 'dist/style.css'),
  copyFile('script.js', 'dist/script.js'),
  cp('slike', 'dist/slike', { recursive: true }),
]);

console.log('Static site validation and build passed.');
