import fs from 'node:fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('outputs/spec.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== Section 4 in outputs/spec.html ===');
$('.unit-row').each((i, el) => {
  console.log('Unit row', i + 1, ':', $(el).text().trim());
});

console.log('=== Section 9 in outputs/spec.html ===');
console.log($('h2:contains("9. Course Resources")').next('div').text().trim().slice(0, 400));

console.log('=== Section 10 in outputs/spec.html ===');
console.log($('.defects-audit-section').length, 'audit sections found');
