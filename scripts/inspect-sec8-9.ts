import fs from 'node:fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('templates/integrated_lab.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== Section 8 text ===');
console.log($('h2:contains("8. Achieving COs")').nextUntil('h2').text().trim().slice(0, 300));

console.log('=== Section 9 text ===');
console.log($('h2:contains("9. Course Resources")').nextUntil('h2').text().trim().slice(0, 500));
