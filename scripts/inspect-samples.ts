import fs from 'node:fs';
import { extractFile } from '../server/extract.js';

async function main() {
  const specBuf = fs.readFileSync('sample-inputs/sample_course_spec.docx');
  const specRes = await extractFile({ originalname: 'sample_course_spec.docx', buffer: specBuf } as any);
  fs.writeFileSync('outputs/spec_extracted.txt', specRes.text, 'utf8');

  const bpBuf = fs.readFileSync('sample-inputs/sample_blueprint.doc');
  const bpRes = await extractFile({ originalname: 'sample_blueprint.doc', buffer: bpBuf } as any);
  fs.writeFileSync('outputs/blueprint_extracted.txt', bpRes.text, 'utf8');

  const axBuf = fs.readFileSync('sample-inputs/annexure_a.docx');
  const axRes = await extractFile({ originalname: 'annexure_a.docx', buffer: axBuf } as any);
  fs.writeFileSync('outputs/annexure_extracted.txt', axRes.text, 'utf8');

  console.log('Done extraction. Spec:', specRes.text.length, 'BP:', bpRes.text.length, 'Annexure:', axRes.text.length);
}
main();
