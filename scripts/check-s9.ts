import fs from 'node:fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('templates/integrated_lab.html', 'utf8');
const $ = cheerio.load(html);

const h2 = $('h2:contains("9. Course Resources")');
console.log('Next tag:', h2.next().prop('tagName'), 'Next class:', h2.next().attr('class'));
console.log('Next element HTML:', h2.next().toString().slice(0, 300));
console.log('Does s9 match?', h2.next('div').length);
