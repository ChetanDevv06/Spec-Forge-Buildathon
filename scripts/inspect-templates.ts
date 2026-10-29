import fs from 'node:fs';
import * as cheerio from 'cheerio';

function inspectTemplate(name: string) {
  const html = fs.readFileSync(`templates/${name}`, 'utf8');
  const $ = cheerio.load(html);
  console.log(`=== ${name} ===`);
  $('h2').each((_, el) => {
    console.log('H2:', $(el).text().trim());
  });
  console.log('Number of .page elements:', $('.page').length);
  console.log('Unit rows count:', $('.unit-row').length);
}

inspectTemplate('integrated_lab.html');
inspectTemplate('non_lab.html');
