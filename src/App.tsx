import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./components/ui/tooltip";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ReferenceLine,
} from "recharts";
import { Sun, Moon, Mic2, Wand2, Grid, Info, PlusCircle, Trash2 } from "lucide-react";

/** ----------------------------------------------
 *  Narzędzia do analizy rytmicznej (PL)
 *  - liczenie sylab (przybliżenie na podstawie samogłosek)
 *  - mapowanie spółgłosek/samogłosek do oryginalnych indeksów
 *  - wykrywanie zatorów (ciągi spółgłosek >= 3)
 *  - akcenty paroksytoniczne (zgrubnie: przedostatnia sylaba wyrazu)
 *  - porównanie do metrum z tolerancją
 * ---------------------------------------------- */

const VOWELS = new Set(["a","e","i","o","u","y","ą","ę","ó"]); // uproszczenie

function normalizeBase(s: string) {
  return s
    .toLowerCase()
    .replaceAll("rz","ż")
    .replaceAll("ch","h")
    .replaceAll("ó","u")
    .replace(/[\t ]+/g," ")
    .trim();
}

function normalizeForMap(srcRaw: string) {
  const src = srcRaw.toLowerCase();
  let out = "";
  const map: Array<[number,number]> = [];
  for (let i=0;i<src.length;) {
    const three = src.slice(i,i+3);
    const two = src.slice(i,i+2);
    if (three === "dż") { out += "ƍ"; map.push([i,i+3]); i+=3; continue; }
    if (three === "dź") { out += "Ƌ"; map.push([i,i+3]); i+=3; continue; }
    if (two === "cz") { out += "ƈ"; map.push([i,i+2]); i+=2; continue; }
    if (two === "sz") { out += "ƨ"; map.push([i,i+2]); i+=2; continue; }
    if (two === "dz") { out += "ƌ"; map.push([i,i+2]); i+=2; continue; }
    if (two === "rz") { out += "ż"; map.push([i,i+2]); i+=2; continue; }
    if (two === "ch") { out += "h"; map.push([i,i+2]); i+=2; continue; }
    const ch = src[i];
    if (ch === "ó") { out += "u"; map.push([i,i+1]); i++; continue; }
    if (ch === "x") { out += "k"; map.push([i,i+1]); out += "s"; map.push([i,i+1]); i++; continue; }
    out += ch; map.push([i,i+1]); i++;
  }
  return { norm: out, map };
}

function tokenizeWords(s: string) {
  return (s.match(/[a-ząćęłńóśźż']+/gi) || []).map(t=>t.toLowerCase());
}

function countSyllablesInToken(t: string) {
  let count = 0; let inV = false;
  for (const ch of t) {
    const isV = VOWELS.has(ch as any);
    if (isV && !inV) count++;
    inV = isV;
  }
  return Math.max(1,count);
}

function countSyllablesLine(line: string) {
  const toks = tokenizeWords(normalizeBase(line));
  return toks.reduce((acc,t)=>acc+countSyllablesInToken(t),0);
}

type Ph = { type: 'V'|'C'; start: number; end: number };
function phonemizeLineWithMap(line: string) {
  const { norm, map } = normalizeForMap(line);
  const letters = Array.from(norm);
  const seq: Ph[] = [];
  let V = 0, C = 0;
  for (let i=0;i<letters.length;i++) {
    const ch = letters[i];
    if (!/[a-ząćęłńuśźżƋƍƌƨƈ]/u.test(ch)) continue;
    const span = map[i];
    const isV = VOWELS.has(ch as any);
    if (isV) { V++; seq.push({ type:'V', start: span[0], end: span[1] }); }
    else { C++; seq.push({ type:'C', start: span[0], end: span[1] }); }
  }
  return { seq, vowels: V, consonants: C, phonemes: V+C };
}

function findClusters(seq: Ph[], k=3) {
  const res: Array<{ startPh:number; endPh:number; len:number; start:number; end:number }> = [];
  let i=0;
  while (i<seq.length) {
    if (seq[i].type==='C') {
      let j=i; while (j<seq.length && seq[j].type==='C') j++;
      const len = j-i;
      if (len>=k) {
        const start = Math.min(...seq.slice(i,j).map(p=>p.start));
        const end = Math.max(...seq.slice(i,j).map(p=>p.end));
        res.push({ startPh:i, endPh:j-1, len, start, end });
      }
      i=j;
    } else i++;
  }
  return res;
}

function accentPositions(line: string) {
  const toks = tokenizeWords(normalizeBase(line));
  let pos=0; const acc:number[]=[];
  for (const t of toks) { const s=countSyllablesInToken(t); acc.push(s===1?pos:pos+s-2); pos+=s; }
  return acc;
}

function buildSyllableMap(line: string) {
  const toks = tokenizeWords(normalizeBase(line));
  const marks:string[]=[];
  for (const t of toks) marks.push(...Array.from({length:countSyllablesInToken(t)},()=>'-'));
  return marks;
}

function parseMeterStr(s: string) {
  return s.split(/[ ,xX-]+/).map(n=>parseInt(n,10)).filter(n=>Number.isFinite(n)&&n>0);
}

function compareToMeter(syls:number[], meter:number[], tol=1) {
  if (!meter.length) return syls.map(() => ({ target:null as any, delta:null as any, ok:true }));
  return syls.map((s,i)=>{ const t=meter[i%meter.length]; const d=s-t; return { target:t, delta:d, ok:Math.abs(d)<=tol }; });
}

function mergeRanges(ranges: Array<{start:number;end:number;len?:number}>) {
  if (!ranges.length) return [] as typeof ranges;
  const sorted=[...ranges].sort((a,b)=>a.start-b.start);
  const out=[{...sorted[0]}];
  for (let i=1;i<sorted.length;i++){
    const prev=out[out.length-1], cur=sorted[i];
    if (cur.start<=prev.end){ prev.end=Math.max(prev.end,cur.end); prev.len=Math.max(prev.len||0,cur.len||0); }
    else out.push({...cur});
  }
  return out;
}

function renderHighlighted(line:string, ranges: Array<{start:number;end:number;len?:number}>) {
  if (!ranges.length) return <>{line}</>;
  const merged=mergeRanges(ranges);
  const out:React.ReactNode[]=[]; let cur=0;
  merged.forEach((r,idx)=>{
    if (r.start>cur) out.push(<span key={`t-${idx}`}>{line.slice(cur,r.start)}</span>);
    const frag=line.slice(r.start,r.end);
    out.push(
      <Tooltip key={`h-${idx}`}>
        <TooltipTrigger asChild>
          <span className="bg-rose-100/80 dark:bg-rose-900/40 ring-1 ring-rose-300 dark:ring-rose-700 rounded px-0.5">{frag}</span>
        </TooltipTrigger>
        <TooltipContent>Zator spółgłoskowy (≥3): „{frag}”</TooltipContent>
      </Tooltip>
    );
    cur=r.end;
  });
  if (cur<line.length) out.push(<span key="t-end">{line.slice(cur)}</span>);
  return <>{out}</>;
}

// ---------------- Demo i testy ----------------
const DEMO = `To jest nasze lato\nW słońcu biegnie czas\nNiech płynie lekko fraza\nBez zatorów spółgłoskowych\nPrzstrń w snach (edge case)`;

const BUILT_IN_TESTS: Array<{ line:string; expectClusters:number }> = [
  { line: "To jest nasze lato", expectClusters: 0 },
  { line: "Przstrń w snach", expectClusters: 1 },
  { line: "Krzcz skrzyp krzywd", expectClusters: 3 },
];

export default function App() {
  const [text,setText]=useState(DEMO);
  const [preset,setPreset]=useState("8-8-8-8");
  const [tolerance,setTolerance]=useState(1);
  const [dark,setDark]=useState(false);
  const [userTest,setUserTest]=useState("");
  const [extraTests,setExtraTests]=useState<string[]>([]);

  const lines=useMemo(()=>text.replaceAll("\r","" ).split("\n"),[text]);

  const meter=useMemo(()=>parseMeterStr(preset),[preset]);

  const analysis=useMemo(()=>{
    return lines.map((line)=>{
      const syll=countSyllablesLine(line);
      const ph=phonemizeLineWithMap(line);
      const clusters=findClusters(ph.seq,3);
      const accIdx=accentPositions(line);
      const sylMap=buildSyllableMap(line);
      accIdx.forEach(i=>{ if(i>=0 && i<sylMap.length) sylMap[i]='*';});
      return { line, syllables:syll, vowels:ph.vowels, consonants:ph.consonants, phonemes:ph.phonemes, clusters, accentMap:sylMap.join("") };
    });
  },[lines]);

  const results=useMemo(()=>{
    const syls=analysis.map(a=>a.syllables);
    const cmp=compareToMeter(syls,meter,tolerance);
    return analysis.map((a,i)=>({ ...a, meter: cmp[i] }));
  },[analysis,meter,tolerance]);

  const chartData=useMemo(()=>results.map((r,i)=>({ line:i+1, syl:r.syllables, target:r.meter.target, ok:r.meter.ok })),[results]);
  const oneTarget=useMemo(()=>{ const ts=chartData.map(d=>d.target).filter(Boolean); return ts.length && ts.every(t=>t===ts[0]) ? ts[0] : null; },[chartData]);

  const dynamicTests=useMemo(()=>{
    const all=[...BUILT_IN_TESTS, ...extraTests.map(l=>({ line:l, expectClusters: NaN as unknown as number }))];
    return all.map(t=>{ const found=findClusters(phonemizeLineWithMap(t.line).seq,3).length; const ok=Number.isFinite(t.expectClusters)? found===t.expectClusters : undefined; return { ...t, found, ok }; });
  },[extraTests]);

  const addTest=()=>{ const v=userTest.trim(); if(!v) return; setExtraTests(p=>[v,...p]); setUserTest(""); };
  const rmTest=(i:number)=>setExtraTests(p=>p.filter((_,idx)=>idx!==i));

  return (
    <div className={dark?"dark":""}>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <div className="mx-auto max-w-6xl p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* --- Panel wejściowy --- */}
          <Card className="dark:border-slate-700">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Mic2 className="h-5 w-5"/> Tekst</CardTitle>
              <Button variant="outline" onClick={()=>setDark(d=>!d)} className="gap-2 dark:border-slate-600">
                {dark? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
                {dark? 'Jasny' : 'Ciemny'} tryb
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea rows={16} value={text} onChange={(e)=>setText(e.target.value)} className="min-h-[360px] dark:bg-slate-950 dark:text-slate-100 dark:border-slate-700" placeholder="Wklej tekst…"/>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Preset metrum</span>
                  <select value={preset} onChange={e=>setPreset(e.target.value)} className="h-10 px-3 rounded-xl border dark:bg-slate-950 dark:border-slate-700">
                    <option value="8-8-8-8">Pop 8-8-8-8</option>
                    <option value="7-6-7-6">Ballada 7-6-7-6</option>
                    <option value="9-8-9-8">9-8-9-8</option>
                    <option value="16">Rap 16</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Tolerancja</span>
                  <Input type="number" min={0} max={3} value={tolerance} onChange={e=>setTolerance(parseInt(e.target.value||"0",10))} className="w-20 dark:bg-slate-950 dark:border-slate-700"/>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" className="gap-2 dark:border-slate-600" onClick={()=>{
                        const v = prompt("Wpisz metrum, np. 8-8-8-8 lub 7 6 7 6", preset);
                        if (v) setPreset(v);
                      }}>
                        <Grid className="h-4 w-4"/> Własne metrum
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Podaj ciąg liczb: 8-8-8-8 lub 7 6 7 6</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>

          {/* --- Analiza --- */}
          <Card className="dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5"/> Analiza rytmiczna</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="line" tickLine={false} axisLine={false} stroke={dark?"#e2e8f0":"#1e293b"}/>
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} stroke={dark?"#e2e8f0":"#1e293b"}/>
                    <ChartTooltip contentStyle={{ background: dark?"#0f172a":"#ffffff", color: dark?"#f1f5f9":"#0f172a", border: `1px solid ${dark?"#334155":"#e2e8f0"}` }}/>
                    {oneTarget && <ReferenceLine y={oneTarget as number} strokeDasharray="4 4" stroke={dark?"#f87171":"#334155"}/>} 
                    <Bar dataKey="syl" radius={[8,8,0,0]} fill={dark?"#93c5fd":"#0f172a"}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {results.map((r,idx)=> (
                  <motion.div key={idx} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} className="rounded-xl border p-3 bg-white dark:bg-slate-950 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {renderHighlighted(r.line, r.clusters.map(c=>({start:c.start,end:c.end,len:c.len})))}
                      </div>
                      <div className="flex flex-col items-end gap-1 min-w-[140px]">
                        <Badge className={`border ${r.meter.ok? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700':'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700'}`}>{r.syllables} syl (cel {r.meter.target ?? '–'})</Badge>
                        <div className="text-xs text-slate-500 dark:text-slate-400">V/C: {r.vowels}/{r.consonants} • fonemów: {r.phonemes}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Akcenty: {r.accentMap || '–'}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Card className="bg-slate-50/60 dark:bg-slate-900/40 border-dashed dark:border-slate-700">
                <CardContent className="p-3 text-xs flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5"/>
                  <div className="space-y-1">
                    <div><strong>Legenda:</strong> <Badge className="ml-1 mr-1">V</Badge> samogłoska, <Badge className="ml-1 mr-1">C</Badge> spółgłoska, <Badge className="ml-1 mr-1">*</Badge> akcent. <span className="ml-1">Zaznaczenia w tekście = zatory (ciągi spółgłosek ≥ 3).</span></div>
                    <div>Kolor paska: <span className="font-semibold">ciemny</span> – liczba sylab; linia przerywana – cel metrum. Zielone/bordowe badge = zgodność/odchyłka.</div>
                    <div>„Szary” opis: słowo z &lt; 3 spółgłoskami (informacyjnie).</div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* --- Szybkie testy --- */}
          <Card className="lg:col-span-2 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/> Szybkie testy (zatory)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={userTest} onChange={e=>setUserTest(e.target.value)} placeholder="Wpisz linijkę do testu…" className="dark:bg-slate-950 dark:border-slate-700"/>
                <Button onClick={addTest} className="gap-2"><PlusCircle className="h-4 w-4"/>Dodaj</Button>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                {dynamicTests.map((t,idx)=> (
                  <div key={idx} className="rounded-lg border p-2 text-sm bg-white dark:bg-slate-950 dark:border-slate-700 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{t.line}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">zatory: {t.found}{ Number.isFinite(t.expectClusters) ? ` (oczekiwano ${t.expectClusters})` : ''}</div>
                    </div>
                    {idx>=BUILT_IN_TESTS.length && (
                      <Button variant="outline" onClick={()=>rmTest(idx-BUILT_IN_TESTS.length)} className="h-8 px-2 dark:border-slate-600"><Trash2 className="h-4 w-4"/></Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
