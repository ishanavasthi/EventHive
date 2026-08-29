// Internal near-duplicate detector for the EventHive documentation set.
// Shingle-based (8-word) containment + longest verbatim run, prose only.
const fs = require('fs'), path = require('path');
const ROOT = '<REPO_ROOT>';
const FILES = ['README.md', 'mobile-app/README.md',
  ...fs.readdirSync(path.join(ROOT,'docs')).filter(f=>f.endsWith('.md')).map(f=>'docs/'+f)];

const K = 8;
const stripCode = t => t.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
const norm = t => t
  .replace(/^\s*\|.*\|\s*$/gm, ' ')          // tables: structural, not prose
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')   // links → link text
  .replace(/[#*_>|:•·←→✅⚠️❌]/g, ' ')
  .replace(/[^A-Za-z0-9\s.,'-]/g, ' ')
  .toLowerCase().replace(/\s+/g, ' ').trim();

const words = t => norm(t).split(' ').filter(Boolean);
const shingles = w => { const s = new Set(); for (let i=0;i+K<=w.length;i++) s.add(w.slice(i,i+K).join(' ')); return s; };

const docs = FILES.map(f => {
  const raw = fs.readFileSync(path.join(ROOT,f),'utf8');
  const wProse = words(stripCode(raw));
  return { f, raw, wProse, sProse: shingles(wProse), wAll: words(raw), sAll: shingles(words(raw)) };
});

console.log('=== CORPUS ===');
docs.forEach(d => console.log(`  ${d.f.padEnd(38)} ${String(d.wProse.length).padStart(6)} prose words, ${String(d.sProse.size).padStart(6)} shingles`));

// longest common word-run between two token arrays (capped search)
function longestRun(a, b) {
  const idx = new Map();
  for (let j=0;j<b.length;j++){ const k=b[j]; if(!idx.has(k)) idx.set(k,[]); idx.get(k).push(j); }
  let best = 0, bestTxt = '';
  for (let i=0;i<a.length;i++){
    const hits = idx.get(a[i]) || [];
    for (const j0 of hits){
      let n=0; while (i+n<a.length && j0+n<b.length && a[i+n]===b[j0+n]) n++;
      if (n>best){ best=n; bestTxt=a.slice(i,i+n).join(' '); }
    }
  }
  return { len: best, text: bestTxt };
}

console.log('\n=== PAIRWISE PROSE OVERLAP (code fences excluded) ===');
console.log('  containment = shared 8-word shingles / shingles of the SMALLER document\n');
const rows = [];
for (let i=0;i<docs.length;i++) for (let j=i+1;j<docs.length;j++){
  const A=docs[i], B=docs[j];
  let shared=0; for (const s of A.sProse) if (B.sProse.has(s)) shared++;
  const small = Math.min(A.sProse.size, B.sProse.size) || 1;
  const jac = shared / ((A.sProse.size + B.sProse.size - shared) || 1);
  if (shared > 0) rows.push({ a:A.f, b:B.f, shared, cont: shared/small*100, jac: jac*100, A, B });
}
rows.sort((x,y)=>y.cont-x.cont);
rows.slice(0,15).forEach(r=>{
  const lr = longestRun(r.A.wProse, r.B.wProse);
  console.log(`  ${r.cont.toFixed(2).padStart(6)}%  containment | ${r.jac.toFixed(2).padStart(5)}% jaccard | ${String(r.shared).padStart(4)} shingles | longest verbatim run: ${lr.len} words`);
  console.log(`          ${r.a}  <->  ${r.b}`);
  if (lr.len >= K) console.log(`          "${lr.text.slice(0,150)}${lr.text.length>150?'…':''}"`);
});
if (!rows.length) console.log('  (no shared 8-word prose shingles anywhere in the corpus)');

// corpus-wide duplicated-shingle rate
const seen = new Map();
docs.forEach(d => d.sProse.forEach(s => seen.set(s,(seen.get(s)||0)+1)));
const dup = [...seen.values()].filter(v=>v>1).length;
console.log(`\n=== CORPUS TOTALS (prose) ===`);
console.log(`  distinct 8-word shingles across the set : ${seen.size}`);
console.log(`  shingles appearing in >1 document       : ${dup}  (${(dup/seen.size*100).toFixed(2)}%)`);

const seenAll = new Map();
docs.forEach(d => d.sAll.forEach(s => seenAll.set(s,(seenAll.get(s)||0)+1)));
const dupAll = [...seenAll.values()].filter(v=>v>1).length;
console.log(`\n=== CORPUS TOTALS (including code blocks, tables, commands) ===`);
console.log(`  distinct 8-word shingles : ${seenAll.size}`);
console.log(`  in >1 document           : ${dupAll}  (${(dupAll/seenAll.size*100).toFixed(2)}%)`);
