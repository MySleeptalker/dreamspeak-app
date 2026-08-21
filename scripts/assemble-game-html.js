#!/usr/bin/env node
// Assembles public/game.html from checked-in chunk files (scripts/game-html-parts/*)
// to avoid keeping one giant unwieldy file in a single commit. Run automatically
// before every build.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'game-html-parts');
const order = ['part0.txt','part1.txt','part2.txt','part3.txt','part3b.txt','part4.txt','part4b.txt','part4c.txt','part5.txt'];

let html = order.map(f => fs.readFileSync(path.join(dir, f), 'utf-8')).join('');

// Fix a couple of known transcription typos introduced while assembling chunks,
// so the CONTENT text matches the audio_manifest keys stored in Postgres exactly.
const fixes = [
  ["yǒu rén ma?)\"]]", "yǒurén ma?)\"]]"],
  ["季度收益报告 (Jìdù shōuyì bàogao)", "季度收益报告 (Jìdù shōuyì bàogào)"],
  ["School\",\"σχολείο (scholeio)\"", "School\",\"σχολείο (scholeío)\""],
  ["Στρίψτε αριστερά στη γωνία. (Strípste aisterá sti gonía.)", "Στρίψτε αριστερά στη γωνία. (Strípste aristerá sti gonía.)"],
  ["Paraviási sýmvasis", "Paraviási sýmvasis"],
  ["Merger and acquisition\",\"Συγχώνευση και εξαγορά (Synchoneusi kai exagorá)", "Merger and acquisition\",\"Συγχώνευση και εξαγορά (Synchóneusi kai exagorá)"],
  ["Liability clause\",\"Ρήτρα ευθύνης (Rítra efthýnis)", "Liability clause\",\"Ρήτρα ευθύνης (Rítra efthínis)"],
  ["(Chreiazomai na alláxo synállagma.)", "(Chreiázomai na alláxo synállagma.)"],
];
for (const [wrong, right] of fixes) {
  if (html.includes(wrong)) html = html.split(wrong).join(right);
}

fs.writeFileSync(path.join(__dirname, '..', 'public', 'game.html'), html, 'utf-8');
console.log('Assembled public/game.html:', html.length, 'chars');
