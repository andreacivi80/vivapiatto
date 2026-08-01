"use client";

import { useEffect, useMemo, useState } from "react";

type Macro = { kcal: number; protein: number; carbs: number; fat: number };
type Food = Macro & { fiber: number; source: "CREA" | "USDA" };
type RecipeIngredient = { food: string; grams: number; label?: string };
type Recipe = {
  id: string; name: string; kicker: string; image: string; time: number;
  ingredients: RecipeIngredient[]; steps: string[]; alternatives: string[];
};
type Day = { label: string; mood: string; recipes: string[] };

const VERSION = "1.0.0";
const photo = (name: string) => `${import.meta.env.BASE_URL}food/${name}.png`;

const foods: Record<string, Food> = {
  "Yogurt greco 2%": { kcal: 73, protein: 9.9, carbs: 3.9, fat: 2, fiber: 0, source: "USDA" },
  "Fiocchi d'avena": { kcal: 379, protein: 13.2, carbs: 67.7, fat: 6.5, fiber: 10.1, source: "CREA" },
  "Frutti di bosco": { kcal: 50, protein: 0.8, carbs: 11.5, fat: 0.4, fiber: 4.4, source: "USDA" },
  "Kiwi": { kcal: 61, protein: 1.1, carbs: 14.7, fat: 0.5, fiber: 3, source: "CREA" },
  "Noci": { kcal: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7, source: "CREA" },
  "Miele": { kcal: 304, protein: 0.3, carbs: 82.4, fat: 0, fiber: 0.2, source: "CREA" },
  "Pane integrale": { kcal: 247, protein: 13, carbs: 41, fat: 4.2, fiber: 7, source: "USDA" },
  "Ricotta vaccina": { kcal: 146, protein: 8.8, carbs: 3.5, fat: 10.9, fiber: 0, source: "CREA" },
  "Uovo": { kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5, fiber: 0, source: "USDA" },
  "Petto di pollo cotto": { kcal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, source: "USDA" },
  "Salmone cotto": { kcal: 208, protein: 20.4, carbs: 0, fat: 13.4, fiber: 0, source: "USDA" },
  "Tonno al naturale sgocciolato": { kcal: 116, protein: 25.5, carbs: 0, fat: 0.8, fiber: 0, source: "CREA" },
  "Quinoa cotta": { kcal: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8, source: "USDA" },
  "Farro cotto": { kcal: 127, protein: 4.3, carbs: 26.4, fat: 0.7, fiber: 3.8, source: "CREA" },
  "Riso basmati cotto": { kcal: 121, protein: 3.5, carbs: 25.2, fat: 0.4, fiber: 0.4, source: "USDA" },
  "Ceci cotti": { kcal: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, source: "USDA" },
  "Lenticchie cotte": { kcal: 116, protein: 9, carbs: 20.1, fat: 0.4, fiber: 7.9, source: "USDA" },
  "Patata dolce cotta": { kcal: 90, protein: 2, carbs: 20.7, fat: 0.2, fiber: 3.3, source: "USDA" },
  "Pomodorini": { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, source: "CREA" },
  "Zucchine": { kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1, source: "CREA" },
  "Spinaci": { kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, source: "CREA" },
  "Fagiolini": { kcal: 31, protein: 1.8, carbs: 7, fat: 0.2, fiber: 3.4, source: "CREA" },
  "Peperoni": { kcal: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, source: "CREA" },
  "Cetriolo": { kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, source: "CREA" },
  "Rucola": { kcal: 25, protein: 2.6, carbs: 3.7, fat: 0.7, fiber: 1.6, source: "CREA" },
  "Feta": { kcal: 265, protein: 14.2, carbs: 3.9, fat: 21.5, fiber: 0, source: "USDA" },
  "Olio extravergine": { kcal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, source: "CREA" },
  "Semi di zucca": { kcal: 559, protein: 30.2, carbs: 10.7, fat: 49.1, fiber: 6, source: "USDA" },
  "Banana": { kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, source: "CREA" },
  "Mela": { kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, source: "CREA" },
};

const calc = (ingredients: RecipeIngredient[], scale = 1): Macro & { fiber: number; weight: number } =>
  ingredients.reduce((sum, item) => {
    const food = foods[item.food]; const grams = item.grams * scale; const f = grams / 100;
    return { kcal: sum.kcal + food.kcal * f, protein: sum.protein + food.protein * f,
      carbs: sum.carbs + food.carbs * f, fat: sum.fat + food.fat * f,
      fiber: sum.fiber + food.fiber * f, weight: sum.weight + grams };
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, weight: 0 });

const recipes: Recipe[] = [
  { id:"jar", name:"Jar yogurt, avena e frutti", kicker:"Colazione fresca e saziante", image:photo("yogurt"), time:5,
    ingredients:[{food:"Yogurt greco 2%",grams:220},{food:"Fiocchi d'avena",grams:45},{food:"Frutti di bosco",grams:100},{food:"Kiwi",grams:70},{food:"Noci",grams:12},{food:"Miele",grams:8}],
    steps:["Versa metà yogurt nel barattolo.","Aggiungi avena e frutta a strati.","Completa con noci tritate e miele."], alternatives:["Skyr al posto dello yogurt", "Pera al posto del kiwi", "Mandorle al posto delle noci"] },
  { id:"toast", name:"Toast ricotta, uovo e pomodoro", kicker:"Croccante, proteico, veloce", image:photo("toast"), time:10,
    ingredients:[{food:"Pane integrale",grams:90},{food:"Ricotta vaccina",grams:80},{food:"Uovo",grams:60},{food:"Pomodorini",grams:120}],
    steps:["Tosta il pane.","Cuoci l'uovo in padella antiaderente.","Spalma la ricotta e completa con uovo e pomodorini."], alternatives:["Tonno al naturale al posto dell'uovo", "Yogurt greco denso al posto della ricotta"] },
  { id:"bowl", name:"Bowl pollo, quinoa e ceci", kicker:"Energia stabile e gusto mediterraneo", image:photo("chicken-bowl"), time:25,
    ingredients:[{food:"Petto di pollo cotto",grams:130},{food:"Quinoa cotta",grams:130},{food:"Ceci cotti",grams:60},{food:"Zucchine",grams:160},{food:"Pomodorini",grams:100},{food:"Spinaci",grams:50},{food:"Olio extravergine",grams:10}],
    steps:["Griglia pollo e zucchine con spezie.","Scalda quinoa e ceci.","Componi la bowl con spinaci e pomodorini; condisci con olio e limone."], alternatives:["Tofu compatto al posto del pollo", "Farro al posto della quinoa", "Fagioli cannellini al posto dei ceci"] },
  { id:"salmon", name:"Salmone, patata dolce e fagiolini", kicker:"Piatto completo senza complicazioni", image:photo("salmon"), time:30,
    ingredients:[{food:"Salmone cotto",grams:140},{food:"Patata dolce cotta",grams:230},{food:"Fagiolini",grams:180},{food:"Olio extravergine",grams:8}],
    steps:["Cuoci la patata dolce a cubetti in forno.","Cuoci il salmone al forno con limone ed erbe.","Lessa i fagiolini e condisci tutto con l'olio pesato."], alternatives:["Trota al posto del salmone", "Patate comuni al posto della patata dolce", "Broccoli al posto dei fagiolini"] },
  { id:"farro", name:"Farro, lenticchie e feta croccante", kicker:"Insalata particolare, ricca di fibre", image:photo("farro"), time:18,
    ingredients:[{food:"Farro cotto",grams:150},{food:"Lenticchie cotte",grams:110},{food:"Peperoni",grams:120},{food:"Cetriolo",grams:100},{food:"Rucola",grams:50},{food:"Feta",grams:45},{food:"Semi di zucca",grams:10},{food:"Olio extravergine",grams:8}],
    steps:["Arrostisci rapidamente i peperoni.","Mescola farro e lenticchie tiepidi con le verdure.","Completa con feta, semi e olio pesato."], alternatives:["Ceci al posto delle lenticchie", "Ricotta salata al posto della feta", "Quinoa per una variante senza glutine"] },
  { id:"rice", name:"Riso basmati, tonno e verdure", kicker:"Pranzo rapido da portare", image:photo("tuna-rice"), time:15,
    ingredients:[{food:"Riso basmati cotto",grams:190},{food:"Tonno al naturale sgocciolato",grams:120},{food:"Zucchine",grams:150},{food:"Peperoni",grams:100},{food:"Olio extravergine",grams:9}],
    steps:["Salta zucchine e peperoni.","Unisci il riso caldo e il tonno sgocciolato.","Spegni il fuoco e aggiungi l'olio misurato."], alternatives:["Pollo al posto del tonno", "Farro al posto del riso", "Ceci per la variante vegetale"] },
  { id:"snack-apple", name:"Mela, yogurt e noci", kicker:"Spuntino con masticazione e proteine", image:photo("snack"), time:3,
    ingredients:[{food:"Mela",grams:180},{food:"Yogurt greco 2%",grams:140},{food:"Noci",grams:12}],
    steps:["Taglia la mela a spicchi.","Servi con yogurt e noci; non serve aggiungere zucchero."], alternatives:["Kiwi al posto della mela", "Skyr al posto dello yogurt"] },
  { id:"snack-banana", name:"Banana e crema yogurt", kicker:"Prima o dopo un'attività intensa", image:photo("snack"), time:3,
    ingredients:[{food:"Banana",grams:130},{food:"Yogurt greco 2%",grams:170},{food:"Fiocchi d'avena",grams:20}],
    steps:["Schiaccia metà banana nello yogurt.","Completa con avena e la restante banana a rondelle."], alternatives:["Mela e cannella al posto della banana", "Pane integrale al posto dell'avena"] },
];
const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]));
const days: Day[] = [
  {label:"Giorno 1",mood:"Partenza semplice",recipes:["jar","bowl","snack-apple","salmon"]},
  {label:"Giorno 2",mood:"Fibre e colore",recipes:["toast","farro","snack-banana","rice"]},
  {label:"Giorno 3",mood:"Energia stabile",recipes:["jar","rice","snack-apple","bowl"]},
  {label:"Giorno 4",mood:"Mediterraneo",recipes:["toast","salmon","snack-banana","farro"]},
  {label:"Giorno 5",mood:"Veloce ma completo",recipes:["jar","bowl","snack-apple","rice"]},
  {label:"Giorno 6",mood:"Più movimento",recipes:["toast","farro","snack-banana","salmon"]},
  {label:"Giorno 7",mood:"Equilibrio e varietà",recipes:["jar","rice","snack-apple","bowl"]},
];

function round(n:number){ return Math.round(n); }
function fmt(n:number){ return Math.round(n * 10) / 10; }

export function FoodPlanner(){
  const [tab,setTab]=useState<"today"|"week"|"builder"|"progress">("today");
  const [calories,setCalories]=useState(1800); const [goal,setGoal]=useState("Equilibrio");
  const [dayIndex,setDayIndex]=useState(0); const [selected,setSelected]=useState<Recipe|null>(null);
  const [completed,setCompleted]=useState<Record<string,boolean>>({});
  const [check,setCheck]=useState({yesterday:"regolare", todayActivity:"no", tomorrowActivity:"no", feeling:"bene"});
  const [builder,setBuilder]=useState<RecipeIngredient[]>([{food:"Rucola",grams:60},{food:"Petto di pollo cotto",grams:120},{food:"Pomodorini",grams:120},{food:"Quinoa cotta",grams:100},{food:"Olio extravergine",grams:8}]);

  useEffect(()=>{ try { const raw=localStorage.getItem("vivapiatto-v1"); if(raw){const s=JSON.parse(raw); setCalories(s.calories||1800); setGoal(s.goal||"Equilibrio"); setCompleted(s.completed||{}); setCheck(s.check||check);} } catch{} },[]);
  useEffect(()=>{ localStorage.setItem("vivapiatto-v1",JSON.stringify({calories,goal,completed,check})); },[calories,goal,completed,check]);
  const baseTotal=useMemo(()=>days[dayIndex].recipes.reduce((s,id)=>s+calc(recipeMap[id].ingredients).kcal,0),[dayIndex]);
  const scale=calories/baseTotal;
  const dayTotals=useMemo(()=>days[dayIndex].recipes.reduce((s,id)=>{const m=calc(recipeMap[id].ingredients,scale); return {kcal:s.kcal+m.kcal,protein:s.protein+m.protein,carbs:s.carbs+m.carbs,fat:s.fat+m.fat};},{kcal:0,protein:0,carbs:0,fat:0}),[dayIndex,scale]);
  const builderTotals=useMemo(()=>calc(builder),[builder]);
  const doneCount=Object.values(completed).filter(Boolean).length;
  const guidance = check.yesterday === "molto" ? "Ieri hai mangiato più del previsto: oggi torna alla regolarità, senza saltare pasti. Scegli acqua, verdure e porzioni già pesate." : check.feeling === "gonfio" ? "Oggi ti senti gonfio: preferisci pasti regolari e non enormi, mangia lentamente e registra i cibi che sembrano associati al sintomo." : check.feeling === "stanco" ? "Giornata stanca: mantieni carboidrati e proteine distribuiti nei pasti. Non ridurre automaticamente il cibo." : check.todayActivity === "intensa" ? "Attività intensa oggi: usa lo spuntino banana e yogurt vicino all'allenamento e cura l'idratazione." : "Giornata regolare: segui le porzioni proposte e ascolta fame e sazietà.";

  const updateBuilder=(index:number,key:"food"|"grams",value:string|number)=>setBuilder(v=>v.map((x,i)=>i===index?{...x,[key]:key==="grams"?Number(value):value}:x));
  return <main className="app-shell">
    <header className="topbar"><div className="brand-mark">V</div><div><strong>VivaPiatto</strong><span>il tuo percorso alimentare</span></div><span className="version">v{VERSION}</span></header>
    <section className="content">
      {tab==="today" && <>
        <section className="hero-card"><div><span className="eyebrow">OGGI · {days[dayIndex].label}</span><h1>Mangia bene,<br/><em>senza complicarti.</em></h1><p>Un piano pratico, porzioni pesate e scelte che puoi cambiare.</p></div><div className="hero-ring"><strong>{round(dayTotals.kcal)}</strong><span>kcal</span></div></section>
        <section className="compact-config"><div><label>Obiettivo</label><select value={goal} onChange={e=>setGoal(e.target.value)}><option>Dimagrimento graduale</option><option>Equilibrio</option><option>Mantenimento massa</option></select></div><div><label>Target kcal</label><select value={calories} onChange={e=>setCalories(Number(e.target.value))}>{[1400,1600,1800,2000,2200,2400].map(x=><option key={x}>{x}</option>)}</select></div></section>
        <section className="checkin"><div className="section-title"><div><span className="eyebrow">CHECK-IN RAPIDO</span><h2>Come arrivi a oggi?</h2></div><span>30 sec</span></div>
          <div className="question"><span>Ieri com'è andata?</span><div className="chips">{[["regolare","Regolare"],["poco","Ho mangiato poco"],["molto","Ho mangiato di più"]].map(([v,l])=><button className={check.yesterday===v?"active":""} key={v} onClick={()=>setCheck({...check,yesterday:v})}>{l}</button>)}</div></div>
          <div className="question"><span>Attività fisica oggi?</span><div className="chips">{[["no","No"],["leggera","Leggera"],["intensa","Intensa"]].map(([v,l])=><button className={check.todayActivity===v?"active":""} key={v} onClick={()=>setCheck({...check,todayActivity:v})}>{l}</button>)}</div></div>
          <div className="question"><span>Come ti senti?</span><div className="chips icon-chips">{[["bene","🙂 Bene"],["gonfio","◯ Gonfio"],["stanco","☾ Stanco"],["fame","♨ Molta fame"]].map(([v,l])=><button className={check.feeling===v?"active":""} key={v} onClick={()=>setCheck({...check,feeling:v})}>{l}</button>)}</div></div>
          <div className="question"><span>Attività prevista domani?</span><div className="chips">{[["no","No"],["leggera","Leggera"],["intensa","Intensa"]].map(([v,l])=><button className={check.tomorrowActivity===v?"active":""} key={v} onClick={()=>setCheck({...check,tomorrowActivity:v})}>{l}</button>)}</div></div>
          <div className="coach-note"><b>Indicazione di oggi</b><p>{guidance}</p></div>
        </section>
        <section className="macro-strip"><div><b>{round(dayTotals.protein)}g</b><span>proteine</span></div><div><b>{round(dayTotals.carbs)}g</b><span>carboidrati</span></div><div><b>{round(dayTotals.fat)}g</b><span>grassi</span></div></section>
        <section><div className="section-title"><div><span className="eyebrow">IL TUO MENU</span><h2>Quattro momenti, zero dubbi</h2></div><button className="text-btn" onClick={()=>setTab("week")}>7 giorni</button></div>
          <div className="meal-list">{days[dayIndex].recipes.map((id,i)=>{const r=recipeMap[id];const m=calc(r.ingredients,scale);const key=`${dayIndex}-${id}`;return <article className="meal-card" key={key} onClick={()=>setSelected(r)}><img src={r.image} alt={r.name}/><div className="meal-body"><span>{["Colazione","Pranzo","Spuntino","Cena"][i]}</span><h3>{r.name}</h3><p>{round(m.kcal)} kcal · {round(m.protein)}g proteine · {r.time} min</p></div><button aria-label={completed[key]?"Segna da fare":"Segna mangiato"} className={`check ${completed[key]?"done":""}`} onClick={e=>{e.stopPropagation();setCompleted({...completed,[key]:!completed[key]})}}>{completed[key]?"✓":""}</button></article>})}</div>
        </section>
      </>}
      {tab==="week" && <section><span className="eyebrow">PIANO SETTIMANALE</span><h1 className="page-title">La tua settimana</h1><p className="page-lead">Scegli un giorno. Le porzioni si adattano al target di {calories} kcal.</p><div className="week-grid">{days.map((d,i)=>{const total=d.recipes.reduce((s,id)=>s+calc(recipeMap[id].ingredients).kcal,0);return <button key={d.label} className={i===dayIndex?"selected":""} onClick={()=>{setDayIndex(i);setTab("today");scrollTo({top:0,behavior:"smooth"})}}><span>{d.label}</span><b>{d.mood}</b><small>{round(total*(calories/total))} kcal · 4 pasti</small><i>→</i></button>})}</div><div className="source-card"><b>Numeri tracciabili, non inventati</b><p>I valori per 100 g sono registrati nella banca dati interna con fonte CREA o USDA. Le porzioni vengono moltiplicate matematicamente. Marca, varietà, cottura e sgocciolamento possono modificare il risultato reale: controlla sempre l'etichetta del prodotto.</p></div></section>}
      {tab==="builder" && <section><span className="eyebrow">LABORATORIO DEL PIATTO</span><h1 className="page-title">Componi la tua insalatona</h1><p className="page-lead">Aggiungi ciò che vuoi e indica i grammi. Il totale cambia in tempo reale.</p>
        <div className="builder-score"><div><span>Peso totale</span><strong>{round(builderTotals.weight)}<small> g</small></strong></div><div><span>Energia</span><strong>{round(builderTotals.kcal)}<small> kcal</small></strong></div><div><span>Proteine</span><strong>{round(builderTotals.protein)}<small> g</small></strong></div><div><span>Fibre</span><strong>{fmt(builderTotals.fiber)}<small> g</small></strong></div></div>
        <div className="balance-meter"><div className={builderTotals.protein>=25?"ok":""}><span>Proteine</span><b>{builderTotals.protein>=25?"Buona quota":"Da aumentare"}</b></div><div className={builderTotals.fiber>=8?"ok":""}><span>Fibre</span><b>{builderTotals.fiber>=8?"Saziante":"Aggiungi vegetali"}</b></div><div className={builderTotals.kcal<=700?"ok":"warn"}><span>Budget</span><b>{builderTotals.kcal<=700?"Compatibile":"Piatto energetico"}</b></div></div>
        <div className="ingredient-list">{builder.map((item,i)=><div className="ingredient-row" key={i}><select value={item.food} onChange={e=>updateBuilder(i,"food",e.target.value)}>{Object.keys(foods).map(f=><option key={f}>{f}</option>)}</select><div><input aria-label={`Grammi ${item.food}`} type="number" min="0" max="1000" value={item.grams} onChange={e=>updateBuilder(i,"grams",e.target.value)}/><span>g</span></div><button aria-label="Rimuovi ingrediente" onClick={()=>setBuilder(v=>v.filter((_,x)=>x!==i))}>×</button></div>)}</div>
        <button className="primary-btn" onClick={()=>setBuilder(v=>[...v,{food:"Cetriolo",grams:100}])}>＋ Aggiungi ingrediente</button>
        <div className="builder-macros"><span><b>{round(builderTotals.carbs)}g</b> carboidrati</span><span><b>{round(builderTotals.fat)}g</b> grassi</span><span><b>{round(builderTotals.protein)}g</b> proteine</span></div>
        <div className="tip-card"><b>Idea “particolare”</b><p>Prova una base di rucola, farro tiepido, salmone, kiwi a cubetti e semi di zucca. Pesa l'olio: è nutriente, ma molto concentrato in energia.</p></div>
      </section>}
      {tab==="progress" && <section><span className="eyebrow">IL TUO DIARIO</span><h1 className="page-title">Progressi, non perfezione</h1><p className="page-lead">I dati restano su questo dispositivo.</p><div className="progress-hero"><div className="progress-ring" style={{"--p":`${Math.min(doneCount/28*100,100)}%`} as React.CSSProperties}><strong>{doneCount}</strong><span>pasti registrati</span></div><div><b>Serie attuale</b><strong>{Math.floor(doneCount/4)} giorni</strong><span>Continua con regolarità</span></div></div>
        <div className="history">{days.map((d,i)=>{const n=d.recipes.filter(id=>completed[`${i}-${id}`]).length;return <div key={d.label}><span>{d.label}</span><div><i style={{width:`${n/4*100}%`}}/></div><b>{n}/4</b></div>})}</div>
        <div className="source-card"><b>Sicurezza prima di tutto</b><p>VivaPiatto è uno strumento educativo per adulti sani, non una prescrizione clinica. Allergie, gravidanza, diabete, disturbi alimentari, patologie renali o gastrointestinali richiedono un piano validato da medico o dietista. Gonfiore persistente, dolore, perdita di peso involontaria o sangue nelle feci richiedono valutazione medica.</p></div>
        <div className="links"><a href="https://www.crea.gov.it/-/on-line-le-linee-guida-per-una-sana-alimentazione-2018" target="_blank">Linee guida CREA ↗</a><a href="https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values" target="_blank">Valori di riferimento EFSA ↗</a><a href="https://fdc.nal.usda.gov/about-us/" target="_blank">Banca dati USDA ↗</a></div>
      </section>}
    </section>
    <nav className="bottom-nav" aria-label="Navigazione principale">{[["today","⌂","Oggi"],["week","▦","Settimana"],["builder","＋","Componi"],["progress","◔","Progressi"]].map(([id,icon,label])=><button key={id} className={tab===id?"active":""} onClick={()=>{setTab(id as typeof tab);scrollTo({top:0,behavior:"smooth"})}}><i>{icon}</i><span>{label}</span></button>)}</nav>
    {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><article className="recipe-sheet" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}>×</button><img src={selected.image} alt={selected.name}/><div className="recipe-content"><span className="eyebrow">RICETTA GUIDATA · {selected.time} MIN</span><h2>{selected.name}</h2><p>{selected.kicker}</p>{(()=>{const m=calc(selected.ingredients,scale);return <div className="recipe-macros"><span><b>{round(m.kcal)}</b> kcal</span><span><b>{round(m.protein)}g</b> proteine</span><span><b>{round(m.carbs)}g</b> carbo</span><span><b>{round(m.fat)}g</b> grassi</span></div>})()}<h3>Cosa ti serve</h3><ul className="ingredients">{selected.ingredients.map((x,i)=><li key={i}><span>{x.label||x.food}</span><b>{round(x.grams*scale)} g</b></li>)}</ul><h3>Come prepararlo</h3><ol className="steps">{selected.steps.map((x,i)=><li key={x}><b>{i+1}</b><span>{x}</span></li>)}</ol><h3>Alternative equivalenti</h3><div className="alternatives">{selected.alternatives.map(x=><span key={x}>{x}</span>)}</div><div className="data-note">Calcolo: valori per 100 g × grammi / 100. Fonte di ogni ingrediente: CREA o USDA. Il dato è una stima nutrizionale, non un'analisi di laboratorio del piatto cucinato.</div></div></article></div>}
  </main>;
}
