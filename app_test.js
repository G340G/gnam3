const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORAGE='gnam-v6-food-os';
const DAY_NAMES=['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
const PROFILE_INFO={
 normal:{name:'Normale',note:'Equilibrato e quotidiano: varietà, fibre, proteine diverse e preparazioni realistiche.',protein:1.0,energy:1.0},
 sport:{name:'Sportivo',note:'Più densità energetica e proteica, senza trasformare ogni piatto in un “meal prep”.',protein:1.35,energy:1.12},
 elegant:{name:'Elegante',note:'Piatti più curati e tecniche leggermente più creative, con la stessa disciplina nutrizionale.',protein:1.05,energy:1.03}
};
const BUDGETS=[
{id:'smart',icon:'🧺',title:'Smart · ~35€',desc:'base economica + dispensa',items:[['uova',10,'pz'],['petto di pollo',650,'g'],['tonno al naturale',360,'g'],['ceci cotti',600,'g'],['lenticchie cotte',600,'g'],['fagioli cannellini',400,'g'],['pasta integrale',700,'g'],['pasta',300,'g'],['riso',700,'g'],['cous cous',350,'g'],['passata di pomodoro',850,'g'],['patate',1100,'g'],['zucchine',600,'g'],['carote',450,'g'],['broccoli',400,'g'],['spinaci',300,'g'],['piselli',300,'g'],['pomodori',600,'g'],['cipolla',300,'g'],['limone',2,'pz'],['yogurt greco',350,'g'],['ricotta',250,'g'],['parmigiano',50,'g'],['pane integrale',400,'g'],['olio evo',250,'ml']]},
{id:'balanced',icon:'🥕',title:'Balanced · ~55€',desc:'varietà, pesce, legumi',items:[['uova',8,'pz'],['petto di pollo',500,'g'],['salmone',350,'g'],['merluzzo',400,'g'],['tonno al naturale',240,'g'],['ceci cotti',500,'g'],['lenticchie cotte',450,'g'],['fagioli cannellini',350,'g'],['pasta integrale',500,'g'],['pasta',250,'g'],['riso',500,'g'],['orzo',300,'g'],['cous cous',300,'g'],['passata di pomodoro',700,'g'],['patate',900,'g'],['zucchine',600,'g'],['broccoli',400,'g'],['spinaci',300,'g'],['pomodori',600,'g'],['carote',450,'g'],['peperoni',350,'g'],['piselli',300,'g'],['cipolla',300,'g'],['limone',2,'pz'],['yogurt greco',350,'g'],['ricotta',250,'g'],['feta',180,'g'],['parmigiano',50,'g'],['pane integrale',400,'g'],['olive',80,'g'],['olio evo',250,'ml']]},
{id:'plus',icon:'🍷',title:'Plus · ~75€',desc:'più scelta e più fresco',items:[['uova',8,'pz'],['petto di pollo',550,'g'],['fesa di tacchino',400,'g'],['salmone',350,'g'],['merluzzo',400,'g'],['orata',350,'g'],['tonno al naturale',240,'g'],['ceci cotti',500,'g'],['lenticchie cotte',450,'g'],['fagioli cannellini',350,'g'],['pasta integrale',500,'g'],['pasta',300,'g'],['riso',500,'g'],['orzo',300,'g'],['cous cous',350,'g'],['passata di pomodoro',700,'g'],['patate',900,'g'],['zucchine',600,'g'],['broccoli',400,'g'],['spinaci',300,'g'],['pomodori',600,'g'],['carote',450,'g'],['peperoni',350,'g'],['melanzane',350,'g'],['lattuga',250,'g'],['yogurt greco',400,'g'],['ricotta',250,'g'],['feta',180,'g'],['parmigiano',50,'g'],['pane integrale',400,'g'],['noci',100,'g'],['cipolla',300,'g'],['limone',3,'pz'],['olive',80,'g'],['piselli',300,'g'],['olio evo',250,'ml']]}
];

const state=Object.assign({pantry:[],profile:'normal',difficulty:2,people:1,age:30,weight:70,activity:'moderate',weekStart:null,plan:null,score:null,suggestions:[],cookLog:{},leftovers:[],prefs:{likes:{},seen:{}},shoppingChecks:[]},loadState());
function loadState(){try{return JSON.parse(localStorage.getItem(STORAGE))||{}}catch{return{}}}
function save(){localStorage.setItem(STORAGE,JSON.stringify(state))}
function todayISO(){return new Date().toISOString().slice(0,10)}
function parseDate(s){return new Date(`${s}T12:00:00`)}
function addDays(date,days){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
function daysFromToday(s){return Math.round((parseDate(s)-parseDate(todayISO()))/86400000)}
function mondayOf(date=new Date()){const d=new Date(date),day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return d.toISOString().slice(0,10)}
function fmtDate(s){return new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit'}).format(parseDate(s))}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function normalizeName(s){const x=String(s||'').toLowerCase().normalize('NFKC').replace(/[’]/g,"'").replace(/[-_/]+/g,' ').replace(/\s+/g,' ').trim();return window.INGREDIENT_ALIASES[x]||x}
function canonMeta(n){const key=normalizeName(n);return window.INGREDIENT_CATALOG[key]||{group:'other',unit:'g',days:7,cost:.8,nutritionKey:key}}
function baseAmount(q,u){return ['kg','l'].includes(u)?q*1000:q}
function availableFor(name, pantry){const n=normalizeName(name);return pantry.filter(i=>normalizeName(i.name)===n&&i.qty>0&&((i.unit===canonMeta(n).unit)||['g','ml'].includes(i.unit))).sort((a,b)=>a.expiry.localeCompare(b.expiry)).reduce((sum,i)=>sum+baseAmount(i.qty,i.unit),0)}
function scaleQty(q){return q*(Number(state.people)||1)/2}
function recipeIngredients(r){return (r.ingredients||[]).map(([n,q,u])=>({name:normalizeName(n),label:n,qty:q*(Number(state.people)||1)/2,unit:u}))}
function recipeCovered(r,pantry){return recipeIngredients(r).every(x=>availableFor(x.name,pantry)>=baseAmount(x.qty,x.unit)-0.01)}
function consumeInto(pantry,r){for(const x of recipeIngredients(r)){let need=baseAmount(x.qty,x.unit);for(const item of pantry.filter(i=>normalizeName(i.name)===x.name&&i.qty>0).sort((a,b)=>a.expiry.localeCompare(b.expiry))){const can=baseAmount(item.qty,item.unit),used=Math.min(can,need);item.qty=Math.max(0,(can-used)/(['kg','l'].includes(item.unit)?1000:1));need-=used;if(need<=0)break}}}
function freshInfo(n){const days=daysFromToday(n.expiry);return days<0?'scaduto':days===0?'oggi':days===1?'domani':`${days} gg`}
function expirySuggested(name){const n=normalizeName(name),m=canonMeta(n);return m?.days!=null?addDays(todayISO(),m.days):addDays(todayISO(),7)}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2300)}
function money(n){return `€ ${Number(n||0).toFixed(2).replace('.',',')}`}
function quantityForDisplay(q,u){return `${Number(q).toLocaleString('it-IT',{maximumFractionDigits:1})} ${u}`}
function ingredientCost(item,used){const meta=canonMeta(item.name);if(item.price!=null&&item.price>0){const full=baseAmount(item.qty,item.unit)||1;return item.price*(used/full)}return meta.cost*((baseAmount(used,item.unit)||used)/100)}
function unitCompatible(a,b){return a===b||(['g','ml'].includes(a)&&['g','ml'].includes(b))}

function renderPresets(){$('#presetGrid').innerHTML=BUDGETS.map(b=>`<button class="preset-card" data-preset="${b.id}"><span>${b.icon}</span><div><b>${b.title}</b><small>${b.desc}</small></div><strong>→</strong></button>`).join('');$$('[data-preset]').forEach(b=>b.onclick=()=>applyPreset(b.dataset.preset))}
function renderQuickAdds(){const quick=['uova','yogurt greco','petto di pollo','salmone','ceci cotti','pasta integrale','riso','zucchine'];$('#quickAdds').innerHTML=quick.map(n=>`<button class="quick-pill" data-quick="${escapeHtml(n)}">+ ${escapeHtml(n)}</button>`).join('');$$('[data-quick]').forEach(b=>b.onclick=()=>{fillIngredient(b.dataset.quick)})}
function renderAutocomplete(value){const q=value.trim().toLowerCase();const target=$('#autocomplete');if(q.length<1){target.innerHTML='';target.classList.remove('show');return}const toks=q.split(/\s+/).filter(Boolean);const hits=window.INGREDIENT_SEARCH_ITEMS.map(x=>{const exact=x===q?100:0;const starts=x.startsWith(q)?35:0;const token=toks.reduce((n,t)=>n+(x.includes(t)?12:0),0);const canon=normalizeName(x);const canonBonus=canon===q?30:(canon.startsWith(q)?12:0);return {x,s:exact+starts+token+canonBonus}}).filter(o=>o.s>0).sort((a,b)=>b.s-a.s||a.x.length-b.x.length).slice(0,10).map(o=>o.x);if(!hits.length){target.innerHTML='';target.classList.remove('show');return}target.innerHTML=hits.map(x=>`<button type="button" data-hit="${escapeHtml(x)}"><b>${escapeHtml(x)}</b>${normalizeName(x)!==x?`<small>→ ${escapeHtml(normalizeName(x))}</small>`:''}</button>`).join('');target.classList.add('show');$$('[data-hit]').forEach(b=>b.onclick=()=>fillIngredient(b.dataset.hit))}
function fillIngredient(raw){const n=normalizeName(raw);$('#ingredientName').value=raw;const meta=canonMeta(n);if(meta.unit)$('#ingredientUnit').value=meta.unit;if(meta.days!=null)$('#ingredientExpiry').value=expirySuggested(n);$('#autocomplete').classList.remove('show');$('#ingredientQty').focus()}
function renderPantry(){const p=state.pantry;$('#pantryCount').textContent=`${p.length} prodott${p.length===1?'o':'i'}`;if(!p.length){$('#pantryList').innerHTML='<div class="empty-pantry">Il tuo inventario è vuoto. Parti da un ingrediente o da un preset. 🍋</div>';return}const sorted=[...p].sort((a,b)=>a.expiry.localeCompare(b.expiry));$('#pantryList').innerHTML=sorted.map(i=>`<div class="pantry-row"><div class="pantry-main"><span class="food-dot ${daysFromToday(i.expiry)<=3?'hot':''}"></span><div><b>${escapeHtml(i.original||i.name)}</b><small>${quantityForDisplay(i.qty,i.unit)} · ${freshInfo(i)} ${i.frozen?'· ❄️ freezer':''}</small></div></div><div class="pantry-actions"><button class="icon-btn ${i.frozen?'active':''}" title="Segna freezer" data-freeze="${i.id}">❄</button><button class="icon-btn" title="Modifica" data-edit="${i.id}">✎</button><button class="icon-btn danger" title="Elimina" data-delete="${i.id}">×</button></div></div>`).join('');
$$('[data-delete]').forEach(b=>b.onclick=()=>{state.pantry=state.pantry.filter(x=>x.id!==b.dataset.delete);state.plan=null;state.score=null;save();renderAll();});$$('[data-freeze]').forEach(b=>b.onclick=()=>{const i=state.pantry.find(x=>x.id===b.dataset.freeze);if(i)i.frozen=!i.frozen;save();renderPantry();buildPlan();});$$('[data-edit]').forEach(b=>b.onclick=()=>editPantry(b.dataset.edit));const exp=sorted.filter(i=>daysFromToday(i.expiry)<=3).length;$('#expiredBanner').classList.toggle('hidden',!exp);if(exp)$('#expiredBanner').innerHTML=`⏰ ${exp} prodott${exp===1?'o è':'i sono'} da usare presto. Gnam li spingerà verso l'inizio del menu.`}
function editPantry(id){const i=state.pantry.find(x=>x.id===id);if(!i)return;const q=prompt(`Quantità di ${i.original||i.name}`,String(i.qty));if(q!==null&&!Number.isNaN(Number(q))){i.qty=Math.max(0,Number(q));state.plan=null;save();renderAll()}}
function addPantryItems(items){const t=todayISO();items.forEach((x,idx)=>state.pantry.push({id:`i-${Date.now()}-${idx}-${Math.random()}`,name:normalizeName(x[0]),original:x[0],qty:x[1],unit:x[2],expiry:addDays(t,canonMeta(x[0]).days ?? (idx+3)),price:null,frozen:false}));save()}
function applyPreset(id){const b=BUDGETS.find(x=>x.id===id);if(!b)return;state.pantry=[];addPantryItems(b.items);state.plan=null;state.score=null;state.suggestions=[];checkShopping(true);buildPlan();toast(`${b.title} caricata: menu e check aggiornati.`);window.scrollTo({top:0,behavior:'smooth'})}
function nutrientProfile(){const activityFactor={low:1,moderate:1.1,high:1.2}[state.activity]||1.1;const base=24*(Number(state.weight)||70)*activityFactor*PROFILE_INFO[state.profile].energy;return {kcal:Math.round(base),protein:Math.round((Number(state.weight)||70)*PROFILE_INFO[state.profile].protein)}}

const NUTRIENTS={
 'uovo':[143,13,1,10,0], 'petto di pollo':[120,23,0,3,0], pollo:[120,23,0,3,0], 'fesa di tacchino':[114,24,0,2,0], tacchino:[114,24,0,2,0], salmone:[208,20,0,13,0], 'merluzzo':[82,18,0,1,0], orata:[121,20,0,4,0], branzino:[97,20,0,2,0], sgombro:[205,19,0,14,0], sardine:[208,25,0,11,0], tonno:[116,26,0,1,0], 'tonno al naturale':[116,26,0,1,0], 'ceci cotti':[164,9,27,3,8], ceci:[164,9,27,3,8], 'lenticchie cotte':[116,9,20,.4,8], lenticchie:[116,9,20,.4,8], 'fagioli cannellini':[140,9,25,.6,6], 'fagioli borlotti':[127,9,23,.5,7], tofu:[76,8,2,5,1], tempeh:[195,20,8,11,0], seitan:[141,24,12,2,0], ricotta:[174,11,3,13,0], mozzarella:[280,18,3,22,0], 'yogurt greco':[97,9,4,5,0], skyr:[63,11,4,.2,0], feta:[265,14,4,21,0], parmigiano:[402,33,0,29,0], latte:[46,3.3,4.8,1.6,0], pasta:[350,12,72,1.5,3], 'pasta integrale':[350,14,67,2.5,7], spaghetti:[350,12,72,1.5,3], riso:[360,7,80,1,1], 'riso integrale':[362,8,76,3,4], 'riso basmati':[350,8,78,.7,1], orzo:[350,10,77,1,10], farro:[335,15,67,2.5,7], 'cous cous':[376,13,77,.6,5], quinoa:[368,14,64,6,7], bulgur:[342,12,76,1.3,12], patata:[77,2,17,.1,2.2], 'patata dolce':[86,1.6,20,.1,3], 'pane integrale':[247,13,41,4,7], pane:[265,9,49,3,3], 'pane di segale':[259,9,48,3.3,6], 'pane pita':[275,9,56,1.2,2], piadina:[300,8,50,8,3], zucchina:[17,1.2,3.1,.3,1], broccolo:[35,2.4,7,.4,3], cavolfiore:[25,2,5,.3,2], spinaci:[23,2.9,3.6,.4,2.2], bietola:[19,1.8,3.7,.2,2.1], lattuga:[15,1.4,2.9,.2,1.3], rucola:[25,2.6,3.7,.7,1.6], pomodoro:[18,.9,3.9,.2,1.2], pomodorino:[18,.9,3.9,.2,1.2], carota:[41,.9,10,.2,2.8], peperone:[31,1,6,.3,2.1], melanzana:[25,1,6,.2,3], cetriolo:[15,.7,3.6,.1,.5], fagiolino:[31,1.8,7,.1,3.4], pisello:[81,5,14,.4,5], zucca:[26,1,7,.1,.5], finocchio:[31,1.2,7,.2,3.1], sedano:[16,.7,3,.2,1.6], porro:[61,1.5,14,.3,1.8], cipolla:[40,1.1,9,.1,1.7], aglio:[149,6.4,33,.5,2.1], avocado:[160,2,9,15,7], olive:[115,.8,6,10,3], noci:[654,15,14,65,7], mandorle:[579,21,22,50,12.5], nocciole:[628,15,17,61,10], arachidi:[567,26,16,49,9], 'burro di arachidi':[588,25,20,50,6], tahina:[595,17,21,53,9], 'olio evo':[884,0,0,100,0], 'olio extravergine':[884,0,0,100,0], 'passata di pomodoro':[30,1.3,5,.3,1.5], 'polpa di pomodoro':[32,1.5,5,.3,1.7], 'pomodori pelati':[24,1.2,4.5,.2,1.2], funghi:[22,3.1,3.3,.3,1], champignon:[22,3.1,3.3,.3,1]};
function nutrientFor(name){const n=normalizeName(name),m=canonMeta(n);return NUTRIENTS[n]||NUTRIENTS[m.nutritionKey]||NUTRIENTS[normalizeName(m.nutritionKey)]||null}
function macroForItems(items){let k=0,p=0,c=0,f=0,fib=0;for(const i of items){const n=nutrientFor(i.name);if(!n)continue;const grams=baseAmount(i.qty,i.unit);const factor=grams/100;k+=n[0]*factor;p+=n[1]*factor;c+=n[2]*factor;f+=n[3]*factor;fib+=n[4]*factor}return {k:Math.round(k),p:Math.round(p),c:Math.round(c),f:Math.round(f),fiber:Math.round(fib)}}
function aggregateMacros(pantry){return macroForItems(pantry.filter(i=>i.qty>0))}
function groupSet(){const out={};for(const [name,m] of Object.entries(window.INGREDIENT_CATALOG)){(out[m.group]??=[]).push(name)}return out}
const GROUPS=groupSet();
function byGroups(pantry){const map={};for(const i of pantry){const g=canonMeta(i.name).group;(map[g]??=[]).push(i)}return map}
function groupHas(g,pantry){return pantry.some(i=>canonMeta(i.name).group===g&&i.qty>0)}
function proteinFamily(i){const g=canonMeta(i.name).group,n=normalizeName(i.name);if(g==='fish')return'fish';if(g==='meat')return'meat';if(g==='eggs')return'egg';if(g==='legume')return'legume';if(g==='dairy')return'dairy';if(['nuts'].includes(g))return'nuts';if(['tofu','tempeh','seitan'].includes(n))return'plant-protein';return null}
function eligible(name,pantry,min=15){return availableFor(name,pantry)>=min}

const METHODS=[
 {key:'pasta',label:'pasta',make:(p,v,c)=>({name:`${cap(v)} e ${displayFood(p)} nella pasta rustica`,ingredients:[[c,80,'g'],[p,100,'g'],[v,180,'g']],time:20,diff:1,tags:['pasta','mediterranea'],tip:'Cuoci la pasta al dente e finisci il condimento in padella con un po’ della sua acqua.'})},
 {key:'forno',label:'forno',make:(p,v,c)=>({name:`${cap(displayFood(p))} arrosto con ${v} e ${c}`,ingredients:[[p,140,'g'],[v,220,'g'],[c,180,'g']],time:35,diff:1,tags:['forno','piatto unico'],tip:'Taglia in pezzi simili: così cuoce tutto nello stesso tempo.'})},
 {key:'padella',label:'padella',make:(p,v,c)=>({name:`Saltato in padella: ${displayFood(p)}, ${v} e ${c}`,ingredients:[[p,140,'g'],[v,180,'g'],[c,160,'g']],time:20,diff:1,tags:['padella','veloce'],tip:'Fuoco medio-alto e pochi minuti: la verdura deve restare viva.'})},
 {key:'frittata',label:'frittata',make:(p,v,c)=>({name:`Frittata morbida di ${v} con ${c}`,ingredients:[[p,3,'pz'],[v,180,'g'],[c,100,'g']],time:18,diff:1,tags:['uova','frittata'],tip:'Sbatti poco le uova e termina la cottura con coperchio.'})},
 {key:'zuppa',label:'zuppa',make:(p,v,c)=>({name:`Zuppa rustica di ${displayFood(p)} e ${v}`,ingredients:[[p,180,'g'],[v,220,'g'],[c,80,'g']],time:30,diff:1,tags:['zuppa','comfort'],tip:'Lascia sobbollire: la consistenza migliore arriva con una cottura dolce.'})},
 {key:'insalata',label:'insalata',make:(p,v,c)=>({name:`Insalata tiepida di ${displayFood(p)}, ${v} e ${c}`,ingredients:[[p,140,'g'],[v,200,'g'],[c,100,'g']],time:15,diff:1,tags:['fresca','zero sbatti'],tip:'Cuoci solo ciò che serve e condisci alla fine per mantenere contrasto e freschezza.'})},
 {key:'polpette',label:'polpette',make:(p,v,c)=>({name:`Polpette semplici di ${displayFood(p)} con ${v}`,ingredients:[[p,180,'g'],[v,180,'g'],[c,80,'g']],time:30,diff:2,tags:['forno','polpette'],tip:'Forma piccole polpette: cuociono meglio e restano più morbide.'})},
 {key:'gratin',label:'gratin',make:(p,v,c)=>({name:`Gratin di ${v}, ${displayFood(p)} e ${c}`,ingredients:[[p,120,'g'],[v,240,'g'],[c,140,'g']],time:35,diff:2,tags:['gratin','forno'],tip:'Una gratinatura breve alla fine crea contrasto senza seccare il piatto.'})},
 {key:'cous',label:'cous cous',make:(p,v,c)=>({name:`Cous cous mediterraneo con ${displayFood(p)} e ${v}`,ingredients:[[c,90,'g'],[p,140,'g'],[v,200,'g']],time:18,diff:1,tags:['cous cous','mediterranea'],tip:'Sgrana il cous cous con una forchetta e aggiungi il condimento mentre è ancora caldo.'})},
 {key:'risotto',label:'risotto',make:(p,v,c)=>({name:`Riso cremoso con ${displayFood(p)} e ${v}`,ingredients:[[c,95,'g'],[p,140,'g'],[v,180,'g']],time:28,diff:2,tags:['riso','cremoso'],tip:'Aggiungi il liquido poco per volta e mescola spesso.'})},
 {key:'ripiena',label:'ripiena',make:(p,v,c)=>({name:`Patate ripiene di ${displayFood(p)} e ${v}`,ingredients:[['patata',280,'g'],[p,130,'g'],[v,160,'g']],time:35,diff:2,tags:['forno','ripiena'],tip:'Cuoci prima le patate; il ripieno richiede poi solo pochi minuti di finitura.'})},
 {key:'bruschetta',label:'bruschetta',make:(p,v,c)=>({name:`Bruschette calde di ${displayFood(p)} con ${v}`,ingredients:[['pane integrale',120,'g'],[p,130,'g'],[v,180,'g']],time:15,diff:1,tags:['pane','veloce'],tip:'Tosta il pane molto caldo e aggiungi il condimento solo alla fine.'})},
 {key:'padella2',label:'hash',make:(p,v,c)=>({name:`Hash croccante di ${v}, ${displayFood(p)} e ${c}`,ingredients:[[v,180,'g'],[p,140,'g'],[c,160,'g']],time:25,diff:1,tags:['croccante','padella'],tip:'Non muovere troppo gli ingredienti: serve superficie di contatto per la crosticina.'})},
 {key:'ragù',label:'ragù',make:(p,v,c)=>({name:`Ragù rapido di ${displayFood(p)} e ${v}`,ingredients:[[p,160,'g'],[v,180,'g'],[c,80,'g']],time:30,diff:2,tags:['sugo','comfort'],tip:'Rosola bene la base prima di aggiungere il resto: il sapore cambia molto.'})},
 {key:'spiedini',label:'spiedini',make:(p,v,c)=>({name:`Spiedini di ${displayFood(p)} e ${v} con ${c}`,ingredients:[[p,140,'g'],[v,180,'g'],[c,150,'g']],time:25,diff:1,tags:['spiedini','forno'],tip:'Taglia tutto della stessa dimensione per una cottura uniforme.'})},
 {key:'omelette',label:'omelette',make:(p,v,c)=>({name:`Omelette farcita con ${v}, ${displayFood(p)} e ${c}`,ingredients:[[p,3,'pz'],[v,160,'g'],[c,80,'g']],time:12,diff:1,tags:['uova','veloce'],tip:'Fuoco basso: l’uovo deve restare morbido e non asciutto.'})},
 {key:'sformatino',label:'sformatino',make:(p,v,c)=>({name:`Sformatino di ${v} con ${displayFood(p)}`,ingredients:[[v,220,'g'],[p,130,'g'],[c,70,'g']],time:35,diff:2,tags:['forno','curato'],tip:'Compatta bene il composto e lascia riposare un paio di minuti prima di sformare.'})},
 {key:'stufato',label:'stufato',make:(p,v,c)=>({name:`Stufato morbido di ${displayFood(p)} con ${v} e ${c}`,ingredients:[[p,160,'g'],[v,220,'g'],[c,100,'g']],time:35,diff:2,tags:['stufato','comfort'],tip:'Cuocendo lentamente guadagni consistenza e sapore anche con pochi ingredienti.'})}
];
function displayFood(n){const meta=canonMeta(n);return n}
function cap(s){return String(s).replace(/^./,m=>m.toUpperCase())}
function familyCandidates(pantry){const groups=byGroups(pantry);return {proteins:[...(groups.meat||[]),...(groups.fish||[]),...(groups.eggs||[]),...(groups.legume||[]),...(groups.dairy||[])],veggies:[...(groups.vegetable||[]),...(groups.fruit||[])].filter(i=>!['avocado','olive'].includes(normalizeName(i.name))),carbs:[...(groups.grain||[]),...(groups.legume||[])].filter(i=>!['ceci','ceci cotti','lenticchie','lenticchie cotte','fagioli cannellini'].includes(normalizeName(i.name))),fat:[...(groups.oil||[]),...(groups.nuts||[])]}}
function dynamicRecipeCandidates(pantry,usedNames,seed=0){
 return [];
 /* legacy generator intentionally disabled: never fabricate recipes.
 const {proteins,veggies,carbs}=familyCandidates(pantry), candidates=[];
 const rng=(n)=>Math.abs((seed*1103515245+n*12345)|0);
 for(const method of METHODS){
  for(let pi=0;pi<proteins.length;pi++){
   for(let vi=0;vi<veggies.length;vi++){
    for(let ci=0;ci<Math.max(1,carbs.length);ci++){
     const p=proteins[(pi+seed)%proteins.length], v=veggies[(vi+seed+pi)%veggies.length], c=carbs.length?carbs[(ci+seed+vi)%carbs.length]:null;
     if(['frittata','omelette'].includes(method.key)&&canonMeta(p.name).group!=='eggs')continue;
     if(!c && !['frittata','omelette','sformatino'].includes(method.key))continue;
     let m=method.make(normalizeName(p.name),normalizeName(v.name),normalizeName(c?.name||v.name));
     const em=estimateRecipeMacros(m);m.diff=Math.max(m.diff,state.profile==='elegant'?m.diff:1);m.tags=[...(m.tags||[]),p.name,v.name,c?.name||''];m.id='dyn-'+method.key+'-'+normalizeName(p.name)+'-'+normalizeName(v.name)+'-'+normalizeName(c?.name||'none')+'-'+rng(pi+vi+ci);m.kcal=em.k;m.p=em.p;m.c=em.c;m.f=em.f;m.veg=1;m.grain=1;m.protein=proteinFamily(p);
     if(m.ingredients.every(([n,q,u])=>n&&q>0&&recipeCovered({ingredients:m.ingredients},pantry)) && m.diff<=Number(state.difficulty) && !usedNames.has(m.name))candidates.push(m);
    }
   }
  }
 }
 // Extra low-complexity forms guarantee a sensible fallback when the basket is sparse.
 const methods2=[
  (p,v)=>({name:`${cap(displayFood(p))} con ${v} in padella`,ingredients:[[p,140,'g'],[v,220,'g']],time:18,diff:1,tags:['padella','semplice'],tip:'Rosola la proteina, aggiungi la verdura e completa la cottura senza asciugare troppo.'}),
  (p,c)=>({name:`${cap(displayFood(p))} e ${c} al forno`,ingredients:[[p,140,'g'],[c,220,'g']],time:30,diff:1,tags:['forno','semplice'],tip:'Taglia tutto in pezzi simili e cuoci finché la parte centrale è ben cotta.'}),
  (v,c)=>({name:`${cap(v)} saltata con ${c}`,ingredients:[[v,240,'g'],[c,100,'g']],time:15,diff:1,tags:['vegetale','veloce'],tip:'Mantieni la verdura croccante: pochi minuti ad alta intensità bastano.'})
 ];
 for(let pi=0;pi<proteins.length;pi++)for(let vi=0;vi<veggies.length;vi++){
  const p=proteins[(pi+seed)%proteins.length],v=veggies[(vi+seed)%veggies.length];
  const m=methods2[pi%methods2.length](normalizeName(p.name),normalizeName(v.name));
  const em=estimateRecipeMacros(m);m.id='simple-'+m.name+'-'+seed+'-'+pi+'-'+vi;m.kcal=em.k;m.p=em.p;m.c=em.c;m.f=em.f;m.protein=proteinFamily(p);m.diff=1;
  if(m.ingredients.every(([n,q,u])=>recipeCovered({ingredients:m.ingredients},pantry))&&!usedNames.has(m.name))candidates.push(m)
 }
 return candidates;
 */
}
function estimateRecipeMacros(r){const parts=[];for(const [n,q,u] of r.ingredients||[]){parts.push({name:normalizeName(n),qty:q,unit:u})}return macroForItems(parts).k?macroForItems(parts):{k:520,p:25,c:60,f:17}}
function recipeIsValid(r){
  if(!r||!r.name||!Array.isArray(r.ingredients)||r.ingredients.length<2)return false;
  if(!Array.isArray(r.steps)||r.steps.length<4)return false;
  if(r.ingredients.some(([n,q,u])=>!n||!(Number(q)>0)||!u||!canonMeta(n)))return false;
  if(/(?:saltato in padella:|con \+1|— pranzo|— cena|ricetta generata|ricetta generica)/i.test(r.name))return false;
  return r.editorialStatus==='curated';
}
function hashString(s){let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h+s.charCodeAt(i))|0;return Math.abs(h)}
function recipeMacroSummary(r){
  const e=Math.max(0,Number(r.kcal||estimateRecipeMacros(r).k)||0);
  const p=Math.max(0,Number(r.p||estimateRecipeMacros(r).p)||0);
  const c=Math.max(0,Number(r.c||estimateRecipeMacros(r).c)||0);
  const f=Math.max(0,Number(r.f||estimateRecipeMacros(r).f)||0);
  const fiber=macroForItems((r.ingredients||[]).map(([n,q,u])=>({name:normalizeName(n),qty:q*(Number(state.people)||1)/2,unit:u}))).fiber||0;
  return {kcal:e,p,c,f,fiber};
}
function coreIngredientSet(r){
  const ignore=new Set(['olio evo','sale','pepe','erbe aromatiche','spezie']);
  return new Set((r.ingredients||[]).map(([n])=>normalizeName(n)).filter(n=>!ignore.has(n)));
}
function pairOverlap(a,b){const A=coreIngredientSet(a),B=coreIngredientSet(b);return [...A].filter(x=>B.has(x));}
function dailyNutrition(a,b){
  const x=recipeMacroSummary(a),y=recipeMacroSummary(b), kcal=x.kcal+y.kcal||1;
  const carbs=(x.c+y.c)*4/kcal*100, fat=(x.f+y.f)*9/kcal*100, protein=(x.p+y.p)*4/kcal*100;
  return {kcal,protein:x.p+y.p,carbs:x.c+y.c,fat:x.f+y.f,fiber:x.fiber+y.fiber,carbPct:carbs,fatPct:fat,proteinPct:protein,veg:(a.veg||0)+(b.veg||0),grain:(a.grain||0)+(b.grain||0)};
}
function dayBalanceScore(a,b){
  const n=dailyNutrition(a,b); let s=0;
  // EFSA RI for adults: carbs 45–60 E%, fats 20–35 E%. Use these as a strict planning band.
  s += n.carbPct>=45&&n.carbPct<=60 ? 24 : n.carbPct>=40&&n.carbPct<=65 ? 12 : 0;
  s += n.fatPct>=20&&n.fatPct<=35 ? 20 : n.fatPct>=17&&n.fatPct<=38 ? 10 : 0;
  s += n.proteinPct>=15&&n.proteinPct<=28 ? 12 : n.proteinPct>=12&&n.proteinPct<=32 ? 6 : 0;
  s += n.fiber>=8 ? 12 : n.fiber>=5 ? 6 : 0;
  s += n.veg>=3 ? 14 : n.veg>=2 ? 8 : n.veg>=1 ? 3 : 0;
  s += a.protein!==b.protein ? 10 : -18;
  s -= Math.min(15,pairOverlap(a,b).length*5);
  if((a.tags||[]).includes('omega-3')||(b.tags||[]).includes('omega-3'))s+=4;
  if(a.protein==='legume'||b.protein==='legume')s+=3;
  return Math.max(0,Math.min(100,Math.round(s)));
}
function pairUrgency(a,b,working){
  let s=0;
  for(const [n] of [...(a.ingredients||[]),...(b.ingredients||[])]){
    const i=working.find(x=>normalizeName(x.name)===normalizeName(n)&&x.qty>0);
    if(i)s+=Math.max(0,12-daysFromToday(i.expiry))*2;
  }
  return s;
}
function recipeAllowed(r){
  return recipeIsValid(r)&&Number(r.diff||1)<=Number(state.difficulty||2)&&(r.style?.includes(state.profile)||!r.style);
}
function searchWeeklyPlan(curated, source){
  const BEAM=18, PAIRS_PER_STATE=24;
  let states=[{day:0,working:source.map(x=>({...x})),used:new Set(),meals:[],dayScores:[],score:0}];
  for(let day=0;day<7;day++){
    const next=[];
    for(const st of states){
      const pool=curated.filter(r=>recipeAllowed(r)&&!st.used.has(r.id)&&recipeCovered(r,st.working));
      const pairs=[];
      for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++){
        const a=pool[i],b=pool[j];
        if(a.protein===b.protein)continue;
        const overlap=pairOverlap(a,b);
        if(overlap.some(x=>['petto di pollo','fesa di tacchino','salmone','merluzzo','orata','tonno al naturale','uova','tofu'].includes(x)))continue;
        const temp=st.working.map(x=>({...x}));
        if(!recipeCovered(a,temp))continue; consumeInto(temp,a);
        if(!recipeCovered(b,temp))continue;
        const bal=dayBalanceScore(a,b), urgent=pairUrgency(a,b,st.working);
        let variety=0;
        const recentFamilies=new Set(st.meals.slice(-4).map(m=>m.recipe.protein).filter(Boolean));
        if(a.protein&&!recentFamilies.has(a.protein))variety+=7;
        if(b.protein&&!recentFamilies.has(b.protein))variety+=7;
        const score=bal*2.4+urgent+variety+(hashString(a.id+'|'+b.id+'|'+day)%17);
        pairs.push({a,b,temp,bal,score});
      }
      pairs.sort((x,y)=>y.score-x.score);
      for(const p of pairs.slice(0,PAIRS_PER_STATE)){
        const used=new Set(st.used);used.add(p.a.id);used.add(p.b.id);
        next.push({day:day+1,working:p.temp,used,meals:st.meals.concat([{day,slot:0,recipe:p.a},{day,slot:1,recipe:p.b}]),dayScores:st.dayScores.concat(p.bal),score:st.score+p.score});
      }
    }
    if(!next.length)break;
    next.sort((a,b)=>b.score-a.score);
    // De-duplicate states with the same consumed inventory fingerprint; keeps the browser fast.
    const seen=new Set(); states=[];
    for(const st of next){
      const fp=[...st.working].filter(x=>x.qty>0).map(x=>`${normalizeName(x.name)}:${Math.round(baseAmount(x.qty,x.unit))}`).sort().join('|');
      if(seen.has(fp))continue;seen.add(fp);states.push(st);if(states.length>=BEAM)break;
    }
  }
  const complete=states.filter(s=>s.meals.length===14).sort((a,b)=>b.score-a.score)[0];
  if(complete)return {meals:complete.meals,working:complete.working,dayScores:complete.dayScores,score:complete.score};
  return states.sort((a,b)=>b.meals.length-a.meals.length||b.score-a.score)[0]||{meals:[],working:source.map(x=>({...x})),dayScores:[],score:0};
}
function buildPlan(){
 const source=state.pantry.filter(i=>i.qty>0).map(i=>({...i}));
 if(!source.length){state.plan=null;renderPlan();return}
 state.people=Math.max(1,Number($('#people').value||state.people||1));state.difficulty=Number($('#difficulty').value||state.difficulty||2);state.age=Number($('#age').value||state.age||30);state.weight=Number($('#weight').value||state.weight||70);state.activity=$('#activity').value||state.activity;state.weekStart=$('#weekStart').value||state.weekStart||mondayOf();
 const curated=(typeof RECIPES!=='undefined'&&Array.isArray(RECIPES)?RECIPES:[]).filter(recipeAllowed);
 let result=searchWeeklyPlan(curated,source);
 // If the full constraint search cannot fill 7 days, progressively relax only cross-day variety.
 if(result.meals.length<14){
   const fallback=[]; let w=source.map(x=>({...x})), used=new Set();
   for(let d=0;d<7;d++){
     let pairs=[];
     const pool=curated.filter(r=>!used.has(r.id)&&recipeCovered(r,w));
     for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++){
       const a=pool[i],b=pool[j]; if(a.protein===b.protein)continue;
       if(pairOverlap(a,b).some(x=>['petto di pollo','fesa di tacchino','salmone','merluzzo','orata','tonno al naturale','uova','tofu','ceci cotti','lenticchie cotte','fagioli cannellini'].includes(x)))continue;
       const t=w.map(x=>({...x})); consumeInto(t,a); if(!recipeCovered(b,t))continue;
       pairs.push({a,b,bal:dayBalanceScore(a,b),s:dayBalanceScore(a,b)*2+pairUrgency(a,b,w)});
     }
     pairs.sort((x,y)=>y.s-x.s); const p=pairs[0]; if(!p)break;
     consumeInto(w,p.a);consumeInto(w,p.b);used.add(p.a.id);used.add(p.b.id);fallback.push({day:d,slot:0,recipe:p.a},{day:d,slot:1,recipe:p.b});
   }
   if(fallback.length>result.meals.length)result={meals:fallback,working:w,dayScores:fallback.reduce((acc,m,i)=>{if(m.slot===1)acc.push(dayBalanceScore(fallback[i-1].recipe,m.recipe));return acc},[]),score:0};
 }
 const meals=result.meals.map((m,idx)=>{const r={...m.recipe,ingredients:(m.recipe.ingredients||[]).map(([n,q,u])=>[normalizeName(n),q,u])};const e=estimateRecipeMacros(r);r.kcal=r.kcal||e.k;r.p=r.p||e.p;r.c=r.c||e.c;r.f=r.f||e.f;r.cost=estimateRecipeCost(r,result.working||source);return {id:`m-${m.day}-${m.slot}-${Date.now()}-${idx}`,day:m.day,slot:m.slot,recipe:r}});
 const dayScores=[];for(let d=0;d<7;d++){const pair=meals.filter(m=>m.day===d);dayScores[d]=pair.length===2?dayBalanceScore(pair[0].recipe,pair[1].recipe):0;}
 state.plan={start:state.weekStart,meals,remaining:result.working||source,dayScores};
 for(const m of meals)state.prefs.seen[m.recipe.name]=(state.prefs.seen[m.recipe.name]||0)+1;
 save();buildSuggestions();renderAll();
 toast(meals.length<14?`Ho coperto ${Math.floor(meals.length/2)} giorni: la spesa non contiene abbastanza combinazioni complete.`:'14 pasti costruiti: ogni giorno è valutato anche come coppia pranzo+cena.');
}
function estimateRecipeCost(r,working){let total=0;for(const [n,q,u] of r.ingredients){let need=baseAmount(q,u);for(const item of working.filter(i=>normalizeName(i.name)===normalizeName(n)&&i.qty>0).sort((a,b)=>a.expiry.localeCompare(b.expiry))){const use=Math.min(baseAmount(item.qty,item.unit),need);total+=item.price>0?item.price*(use/baseAmount(item.qty,item.unit)):canonMeta(n).cost*(use/100);need-=use;if(need<=0)break}}return Number(total.toFixed(2))}
function renderPlan(){const g=$('#planGrid'),status=$('#planStatus');if(!state.plan||!state.plan.meals?.length){g.innerHTML='';status.textContent=state.pantry.length?'Premi “Genera 7 giorni” per costruire il calendario.':'Inserisci la spesa o scegli un preset.';$('#weeklySummary').classList.add('hidden');return}const byDay=DAY_NAMES.map((name,d)=>({name,d,meals:state.plan.meals.filter(x=>x.day===d)}));g.innerHTML=byDay.map(day=>{const date=addDays(state.plan.start,day.d);return `<article class="day-card"><div class="day-head"><div><b>${day.name}</b><small>${fmtDate(date)}</small></div><span class="day-score">${day.meals.length===2?`⚖ ${state.plan.dayScores?.[day.d]??0}/100`:`${day.meals.length}/2`}</span></div>${[0,1].map(slot=>{const m=day.meals.find(x=>x.slot===slot);return m?`<button class="meal-card ${slot?'dinner':''}" data-meal="${m.id}"><div class="meal-type">${slot?'CENA':'PRANZO'}</div><div class="meal-title">${escapeHtml(m.recipe.name)}</div><div class="meal-meta"><span>⏱ ${m.recipe.time||20}′</span><span>${m.recipe.kcal||520} kcal</span><span>${money(m.recipe.cost)}</span></div><div class="meal-bottom"><span>${m.recipe.protein||'mix'}</span><span class="cook-state ${state.cookLog[m.id]?'done':''}">${state.cookLog[m.id]?'✓ cucinato':'○ da fare'}</span></div></button>`:`<div class="meal-card empty-slot"><div class="meal-type">${slot?'CENA':'PRANZO'}</div><p>Non coperto dalla spesa</p></div>`}).join('')}</article>`}).join('');$$('[data-meal]').forEach(b=>b.onclick=()=>openMeal(b.dataset.meal));const totalK=state.plan.meals.reduce((a,m)=>a+(m.recipe.kcal||0),0),totalCost=state.plan.meals.reduce((a,m)=>a+(m.recipe.cost||0),0);status.innerHTML=`<b>${state.plan.meals.length}/14 pasti coperti</b> · ${Math.round(totalK/Math.max(1,state.plan.meals.length))} kcal medie/pasto · ${money(totalCost)} costo stimato del menu <span class="status-extra">· vocabolario ${typeof window.INGREDIENT_COUNT!=='undefined'?window.INGREDIENT_COUNT.toLocaleString('it-IT'):'2.000+'} forme</span>`;$(`#weeklySummary`).innerHTML=`<div class="summary-stat"><b>${state.plan.meals.length}</b><span>pasti coperti</span></div><div class="summary-stat"><b>${money(totalCost)}</b><span>costo previsto</span></div><div class="summary-stat"><b>${countSoon()}</b><span>ingredienti da spingere</span></div><div class="summary-note">La coppia pranzo+cena viene ottimizzata insieme: macronutrienti, fibra, vegetali, varietà proteica, scadenze e sovrapposizione degli ingredienti. I punteggi sono indicatori di pianificazione, non una valutazione clinica dell'intera giornata.</div>`;$('#weeklySummary').classList.remove('hidden')}
function countSoon(){return state.pantry.filter(i=>daysFromToday(i.expiry)<=3&&i.qty>0).length}
const RECIPE_STEPS={
'pasta-zucchine':['Porta a bollore una pentola d’acqua. Nel frattempo lava le zucchine e tagliale a mezze rondelle sottili; affetta finemente la cipolla.','Scalda l’olio in una padella larga, aggiungi la cipolla e cuoci 3–4 minuti a fuoco medio finché diventa traslucida. Unisci le zucchine, alza leggermente il fuoco e cuoci 7–9 minuti, mescolando, finché sono tenere ma non sfatte.','Cuoci la pasta al dente secondo il tempo indicato sulla confezione. Prima di scolarla conserva circa 100 ml di acqua di cottura.','Scola la pasta, trasferiscila nella padella e aggiungi la ricotta. Versa poca acqua di cottura alla volta, mescolando, finché il condimento diventa cremoso e avvolge bene la pasta.'],
'pollo-peperoni':['Taglia il pollo a striscioline regolari e i peperoni a listarelle. Grattugia finemente la scorza del limone e tieni da parte un po’ di succo.','Scalda metà dell’olio in una padella ampia. Cuoci il pollo a fuoco medio-alto per 5–7 minuti, girandolo, finché è ben dorato e completamente cotto al centro. Toglilo dalla padella.','Nella stessa padella aggiungi il resto dell’olio e i peperoni. Cuoci 8–10 minuti; devono ammorbidirsi ma conservare un minimo di struttura.','Rimetti il pollo, aggiungi scorza e succo di limone e cuoci ancora 1 minuto. Servi con il riso cotto a parte.'],
'lenticchie-pomodoro':['Trita finemente cipolla e carota. Scalda l’olio in una casseruola e falle appassire a fuoco medio per 5 minuti, senza bruciarle.','Aggiungi la passata e lascia sobbollire 5 minuti. Unisci le lenticchie già cotte e 100–150 ml di acqua; cuoci a fuoco basso per 8–10 minuti, fino a ottenere un sugo denso.','Nel frattempo tosta il pane in padella o nel forno finché è croccante ai bordi.','Regola la consistenza delle lenticchie con poca acqua se necessario e servi calde con il pane.'],
'salmone-broccoli':['Scalda il forno a 190 °C statico. Taglia le patate a fette sottili e disponile in una teglia con metà dell’olio.','Cuoci le patate per 15 minuti: devono iniziare ad ammorbidirsi. Nel frattempo dividi i broccoli in cimette piccole.','Togli la teglia dal forno, sistema il salmone sulle patate e aggiungi i broccoli intorno. Completa con il resto dell’olio e cuoci per altri 15–18 minuti, finché il salmone raggiunge il centro ben cotto e le patate sono tenere.','Lascia riposare 2 minuti fuori dal forno prima di servire, così i succhi del salmone si ridistribuiscono.'],
'frittata-spinaci':['Scalda il forno a 190 °C. Se gli spinaci sono freschi, falli appassire in padella con un cucchiaino d’olio per 2–3 minuti; se sono già cotti e surgelati, strizzali bene.','Sbatti le uova in una ciotola con il parmigiano. Unisci gli spinaci e mescola in modo uniforme.','Ungi una piccola teglia o rivestila con carta forno, versa il composto e livellalo. Cuoci 12–15 minuti, finché il centro è appena rappreso.','Lascia riposare 2 minuti, poi taglia a spicchi. Servi con il pane integrale tostato.'],
'ceci-couscous':['Taglia le zucchine a dadini e i pomodori a cubetti. Scalda l’olio in una padella e cuoci le zucchine 6–8 minuti, finché sono dorate ma ancora consistenti.','Unisci i ceci scolati e cuoci altri 3–4 minuti, mescolando. Togli dal fuoco e aggiungi i pomodori.','Prepara il cous cous seguendo il rapporto acqua/cous cous indicato sulla confezione. Coprilo, lascialo gonfiare per il tempo previsto e poi sgranalo con una forchetta.','Mescola cous cous e verdure, aggiungi la feta sbriciolata e assaggia. Servi tiepido o a temperatura ambiente.'],
};
function recipeInstructions(r){
 if(Array.isArray(r.steps)&&r.steps.length)return r.steps;
 if(RECIPE_STEPS[r.id])return RECIPE_STEPS[r.id];
 return ['Questa ricetta non è stata validata per una procedura dettagliata. Gnam la esclude dal calendario finché non dispone di passaggi verificati.'];
}
function findMeal(id){return state.plan?.meals?.find(m=>m.id===id)}
function openMeal(id){const m=findMeal(id);if(!m)return;const r=m.recipe;const ing=r.ingredients.map(([n,q,u])=>`<li><b>${quantityForDisplay(q,u)}</b> ${escapeHtml(displayFood(n))}</li>`).join('');const steps=recipeInstructions(r).map((x,i)=>`<li><span>${i+1}</span>${escapeHtml(x)}</li>`).join('');const cooked=!!state.cookLog[m.id];const verified=!!r.sourceUrl;const source=r.sourceUrl?`<a href="${escapeHtml(r.sourceUrl)}" target="_blank" rel="noreferrer">Fonte online verificata ↗</a>`:'';const provenance=verified?'✓ fonte online verificata':'✓ ricetta curata';$('#modalContent').innerHTML=`<div class="modal-eyebrow">${DAY_NAMES[m.day]} · ${m.slot?'CENA':'PRANZO'} · ${provenance}</div><h2 id="modalTitle">${escapeHtml(r.name)}</h2><div class="recipe-metrics"><span>⏱ ${r.time||20} min</span><span>🧩 difficoltà ${r.diff||1}/3</span><span>🧬 ${r.kcal||520} kcal</span><span>💪 ${r.p||25} g proteine</span><span>💶 ${money(r.cost)}</span></div><div class="source-line">${source}</div><div class="recipe-cols"><div><h3>Ingredienti</h3><ul class="ingredient-list">${ing}</ul></div><div><h3>Preparazione</h3><ol class="step-list">${steps}</ol></div></div><div class="tip-box"><b>💡 Consiglio Gnam</b> ${escapeHtml(r.tip||'Prepara il piatto senza inseguire la perfezione: conta soprattutto consumare bene quello che hai.')}</div><div class="modal-actions"><button class="primary-btn" id="cookBtn">${cooked?'✓ Segnato come cucinato':'🍳 Segna cucinato'}</button><button class="ghost-btn" id="likeBtn">👍 Mi è piaciuto</button><button class="ghost-btn" id="dislikeBtn">👎 Non rifarlo</button></div>`;$('#recipeModal').classList.remove('hidden');$('#cookBtn').onclick=()=>markCooked(m.id);$('#likeBtn').onclick=()=>rateRecipe(r,1);$('#dislikeBtn').onclick=()=>rateRecipe(r,-1)}
function rateRecipe(r,val){const key=r.name,stateLikes=state.prefs.likes;stateLikes[key]=(stateLikes[key]||0)+val;save();toast(val>0?'Segnata come preferita: la userò per variare meglio.':'Ricevuto: abbasserò la priorità di questo stile.');closeModal()}
function markCooked(id){const m=findMeal(id);if(!m)return;if(state.cookLog[id]){toast('Questo pasto è già segnato come cucinato.');return}const recipe=m.recipe;consumeActual(recipe);state.cookLog[id]=true;const portion=prompt('Avanzi salvati? Inserisci le porzioni (0 se nessuna).', '0');const p=Math.max(0,Number(portion||0));if(p>0)state.leftovers.push({id:`l-${Date.now()}`,name:recipe.name,portions:p,created:todayISO(),frozen:false});save();closeModal();renderAll();toast(p>0?`Cucinato + ${p} porzion${p===1?'e salvata':'i salvate'} come avanzo.`:'Pasto segnato come cucinato.')}
function consumeActual(r){for(const [n,q,u] of r.ingredients){let need=baseAmount(q,u);for(const item of state.pantry.filter(i=>normalizeName(i.name)===normalizeName(n)&&i.qty>0).sort((a,b)=>a.expiry.localeCompare(b.expiry))){const can=baseAmount(item.qty,item.unit),used=Math.min(can,need);item.qty=Math.max(0,(can-used)/(['kg','l'].includes(item.unit)?1000:1));need-=used;if(need<=0)break}}}
function closeModal(){$('#recipeModal').classList.add('hidden')}
function checkShopping(silent=false){const p=state.pantry.filter(i=>i.qty>0);if(!p.length){state.score=null;renderCheck();return}const g=byGroups(p), macro=aggregateMacros(p), proteinF=new Set(p.map(proteinFamily).filter(Boolean)), vegCount=(g.vegetable||[]).length, fruitCount=(g.fruit||[]).length, fresh=p.filter(i=>daysFromToday(i.expiry)<=7).length, long=p.filter(i=>daysFromToday(i.expiry)>14).length, urgent=p.filter(i=>daysFromToday(i.expiry)<=3).length;let score=0;score+=Math.min(18,vegCount*4);score+=Math.min(8,fruitCount*4);score+=g.legume?.length?12:0;score+=(g.grain?.length?10:0);score+=proteinF.size>=3?14:proteinF.size===2?9:proteinF.size===1?5:0;score+=g.dairy?.length?6:0;score+=(g.nuts?.length||g.oil?.length)?8:0;score+=fresh&&long?8:fresh||long?4:0;score+=macro.fiber>=20?6:macro.fiber>=10?3:0;score-=urgent>5?4:0;score=Math.max(1,Math.min(100,Math.round(score)));const micro=[];micro.push(['Vitamina C / folati',(vegCount+fruitCount)>=3?'buona varietà di fonti':'rinforzare vegetali colorati']);micro.push(['Ferro + B-vitamine',(g.legume?.length||proteinF.size>=2)?'diverse fonti presenti':'aggiungere legumi o fonti proteiche variate']);micro.push(['Calcio',g.dairy?.length?'fonti presenti':'aggiungere latticini o alternativa fortificata']);micro.push(['Omega-3',p.some(i=>['salmone','sgombro','sardine','alici'].includes(normalizeName(i.name)))||g.nuts?.some(i=>normalizeName(i.name)==='noci')?'fonte presente':'aggiungere pesce grasso o noci']);const sug=[];if(vegCount<3)sug.push('Aggiungi 2–3 verdure diverse, preferibilmente di colori differenti.');if(!fruitCount)sug.push('Aggiungi 2 frutti: rende più facile coprire vitamina C, potassio e fibra.');if(!g.legume?.length)sug.push('Aggiungi ceci, lenticchie o fagioli per fibra e proteine vegetali.');if(proteinF.size<3)sug.push('Varia almeno 3 famiglie proteiche durante la settimana.');if(!g.nuts?.length&&!g.oil?.length)sug.push('Aggiungi una fonte di grassi prevalentemente insaturi.');if(!long)sug.push('Inserisci 2–3 alimenti a lunga conservazione per rendere la settimana più resiliente.');if(urgent>5)sug.push('Hai molte cose da usare entro 3 giorni: congela dove appropriato e spingi questi alimenti nei primi pasti.');state.score={score,proteinFamilies:[...proteinF],macro,vegCount,fruitCount,fresh,long,urgent,micro,suggestions:sug.slice(0,5)};state.shoppingChecks.push({date:todayISO(),score});save();renderCheck();if(!silent)$('#checkSection').scrollIntoView({behavior:'smooth',block:'start'})}
function renderCheck(){const x=state.score;if(!x){$('#shoppingScoreBadge').textContent='— / 100';$('#shoppingScoreBadge').className='score-badge neutral';$('#shoppingCheck').innerHTML='<div class="check-face">🔎</div><div><h3>Controllo pronto quando vuoi.</h3><p>Premi “Check spesa” per leggere qualità, varietà e robustezza della tua spesa.</p></div>';return}const cls=x.score>=80?'great':x.score>=65?'good':x.score>=50?'mid':'low';$('#shoppingScoreBadge').textContent=`${x.score} / 100`;$(`#shoppingScoreBadge`).className=`score-badge ${cls}`;$('#shoppingCheck').innerHTML=`<div class="score-big ${cls}">${x.score}</div><div class="check-main"><div class="check-grid"><div><span>🥬</span><b>Vegetali</b><small>${x.vegCount} tipi</small></div><div><span>🍎</span><b>Frutta</b><small>${x.fruitCount} tipi</small></div><div><span>💪</span><b>Proteine</b><small>${x.proteinFamilies.length} famiglie</small></div><div><span>🌾</span><b>Fibra</b><small>~${x.macro.fiber} g potenziali</small></div><div><span>⏳</span><b>Fresco</b><small>${x.fresh} prodotti</small></div><div><span>📦</span><b>Dispensa</b><small>${x.long} lunga durata</small></div></div><div class="micro-list"><b>Micronutrienti · segnali utili</b>${x.micro.map(m=>`<span><strong>${escapeHtml(m[0])}</strong> · ${escapeHtml(m[1])}</span>`).join('')}</div><div class="improve"><b>🎯 Per migliorare</b>${x.suggestions.map(s=>`<span>→ ${escapeHtml(s)}</span>`).join('')}</div></div>`}
function buildSuggestions(){
 const p=state.pantry.filter(i=>i.qty>0);
 if(!p.length){state.suggestions=[];renderSuggestions();return}
 const candidates=[];
 const curated=Array.isArray(typeof RECIPES!=='undefined'?RECIPES:[])?RECIPES:[];
 for(const r of curated.filter(recipeIsValid)){
   if(recipeCovered(r,p))continue;
   const missing=[...new Set(recipeIngredients(r).filter(x=>availableFor(x.name,p)<baseAmount(x.qty,x.unit)).map(x=>normalizeName(x.name)))];
   if(missing.length===1)candidates.push({r,missing:missing[0]});
 }
 const seen=new Set();
 state.suggestions=candidates.sort(()=>Math.random()-.5).filter(x=>{if(seen.has(x.r.name))return false;seen.add(x.r.name);return true}).slice(0,6);
 save();renderSuggestions();
}
function renderSuggestions(){const a=state.suggestions||[];$('#suggestionSection').classList.toggle('hidden',!a.length);$('#suggestionGrid').innerHTML=a.map(x=>`<button class="suggestion-card" data-suggest="${escapeHtml(x.r.id)}"><div class="suggestion-art">+1</div><div><span class="suggestion-add">Ti manca solo</span><h3>${escapeHtml(x.missing)}</h3><p>${escapeHtml(x.r.name)}</p><small>${x.r.kcal||520} kcal · ${x.r.time||20} min</small></div></button>`).join('');$$('[data-suggest]').forEach(b=>b.onclick=()=>openSuggested(findRecipeAny(b.dataset.suggest)))}
function findRecipeAny(id){return [...(typeof RECIPES!=='undefined'?RECIPES:[]),...(state.suggestions||[]).map(x=>x.r)].find(r=>r.id===id)||null}
function openSuggested(r){if(!r)return;const fake={id:'s',day:0,slot:0,recipe:r};state.plan??={meals:[]};state.plan.meals.push(fake);openMeal('s');state.plan.meals.pop()}
function renderOS(){const section=$('#osSection');if(!state.plan){section.classList.add('hidden');return}section.classList.remove('hidden');const actualCost=Object.values(state.cookLog).length?state.plan.meals.filter(m=>state.cookLog[m.id]).reduce((a,m)=>a+m.recipe.cost,0):0;const planned=state.plan.meals.length;const cooked=Object.keys(state.cookLog).length;const leftoverPortions=state.leftovers.reduce((a,x)=>a+x.portions,0);const wasteRisk=state.pantry.filter(i=>i.qty>0&&daysFromToday(i.expiry)<=3).length;$('#osGrid').innerHTML=`<div class="os-card"><span>🍳</span><b>${cooked}/${planned}</b><small>pasti cucinati</small></div><div class="os-card"><span>💶</span><b>${money(actualCost)}</b><small>costo già “usato”</small></div><div class="os-card"><span>🥡</span><b>${leftoverPortions}</b><small>porzioni di avanzo</small></div><div class="os-card"><span>${wasteRisk?'⚠️':'✅'}</span><b>${wasteRisk}</b><small>rischio scadenza ≤3 gg</small></div>`;renderLeftovers();renderShoppingList()}
function renderLeftovers(){const e=$('#leftovers'),a=state.leftovers;if(!a.length){e.classList.add('hidden');return}e.classList.remove('hidden');e.innerHTML=`<div class="subhead"><h3>♻️ Avanzi salvati</h3><small>Puoi considerarli un pasto rapido prima di cucinare altro.</small></div>${a.map(x=>`<div class="leftover-row"><div><b>${escapeHtml(x.name)}</b><small>${x.portions} porzioni · ${x.frozen?'❄ freezer':'frigo'} · ${fmtDate(x.created)}</small></div><button class="icon-btn" data-leftover="${x.id}">${x.frozen?'↺':'❄'}</button><button class="icon-btn danger" data-leftover-delete="${x.id}">×</button></div>`).join('')}`;$$('[data-leftover]').forEach(b=>b.onclick=()=>{const x=state.leftovers.find(y=>y.id===b.dataset.leftover);if(x)x.frozen=!x.frozen;save();renderLeftovers()});$$('[data-leftover-delete]').forEach(b=>{b.onclick=()=>{state.leftovers=state.leftovers.filter(x=>x.id!==b.dataset.leftoverDelete);save();renderLeftovers();renderOS()}})}
function renderShoppingList(){const e=$('#shoppingList');if(!state.score){e.classList.add('hidden');return}const wanted=[];for(const s of state.score.suggestions){const match=s.match(/Aggiungi ([^,.]+)/i);if(match)wanted.push(match[1])}const generic=[['broccolo','verdura + fibra'],['mela','frutta + fibra'],['ceci cotti','legumi + proteine'],['noci','grassi insaturi'],['salmone','omega-3']];const merged=[...wanted.map(x=>[x,'colma una lacuna']),...generic].filter(([n])=>!state.pantry.some(i=>normalizeName(i.name)===normalizeName(n))).slice(0,7);if(!merged.length){e.classList.add('hidden');return}e.classList.remove('hidden');e.innerHTML=`<div class="subhead"><h3>🛒 Lista della prossima spesa</h3><small>Non serve al menu attuale: serve a rendere migliore il prossimo ciclo.</small></div>${merged.map(([n,r],i)=>`<label class="shop-line"><input type="checkbox" data-shop="${i}"><span><b>${escapeHtml(n)}</b><small>${escapeHtml(r)}</small></span></label>`).join('')}<button class="ghost-btn" id="copyShop">Copia lista</button>`;$('#copyShop').onclick=()=>{navigator.clipboard?.writeText(merged.map(x=>x[0]).join('\n'));toast('Lista copiata negli appunti.')}}
async function webSearch(){const active=state.pantry.filter(i=>i.qty>0&&daysFromToday(i.expiry)>=0).sort((a,b)=>a.expiry.localeCompare(b.expiry));if(!active.length){toast('Prima inserisci qualcosa.');return}$('#webRecipesSection').classList.remove('hidden');$('#webGrid').innerHTML='<div class="small-note">Cerco ispirazione online…</div>';const q=encodeURIComponent(normalizeName(active[0].name));try{const r=await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${q}`);const data=await r.json();const meals=(data.meals||[]).slice(0,8);$('#webGrid').innerHTML=meals.length?meals.map(m=>`<article class="web-card"><img src="${m.strMealThumb}" alt=""><div class="web-body"><h3>${escapeHtml(m.strMeal)}</h3><p>ispirazione online</p><a href="https://www.themealdb.com/meal.php?c=${m.idMeal}" target="_blank" rel="noreferrer">Apri ↗</a></div></article>`).join(''):'<div class="small-note">Nessun risultato. Il motore locale continua a funzionare.</div>'}catch{ $('#webGrid').innerHTML='<div class="small-note">La fonte web non risponde ora. Gnam resta utilizzabile offline.</div>'}}
function renderAll(){renderPantry();renderCheck();renderPlan();renderOS();renderSuggestions()}
function bind(){
 $('#ingredientName').addEventListener('input',e=>{renderAutocomplete(e.target.value);const n=normalizeName(e.target.value);if(window.INGREDIENT_CATALOG[n]){const exp=expirySuggested(n);if(!$('#ingredientExpiry').dataset.manual)$('#ingredientExpiry').value=exp;$('#ingredientUnit').value=canonMeta(n).unit||$('#ingredientUnit').value}});
 $('#ingredientExpiry').addEventListener('input',e=>e.target.dataset.manual='1');
 document.addEventListener('click',e=>{if(!e.target.closest('.autocomplete-wrap'))$('#autocomplete').classList.remove('show')});
 $('#ingredientForm').addEventListener('submit',e=>{e.preventDefault();const raw=$('#ingredientName').value.trim(),n=normalizeName(raw),qty=Number($('#ingredientQty').value),unit=$('#ingredientUnit').value,expiry=$('#ingredientExpiry').value,price=Number($('#ingredientPrice').value)||null;if(!raw||!qty||!expiry)return;const meta=canonMeta(n);state.pantry.push({id:`i-${Date.now()}-${Math.random()}`,name:n,original:raw,qty,unit,expiry,price,frozen:false});state.plan=null;state.score=null;state.suggestions=[];save();e.target.reset();$('#ingredientQty').value=meta.unit==='pz'?1:300;$('#ingredientUnit').value=meta.unit||'g';$('#ingredientExpiry').value=addDays(todayISO(),meta.days??7);$('#ingredientExpiry').dataset.manual='';renderAll();toast(`${raw} aggiunto.`)});
 $$('.profile-tab').forEach(b=>b.onclick=()=>{state.profile=b.dataset.profile;$$('.profile-tab').forEach(x=>x.classList.toggle('active',x===b));$('#profileNote').textContent=PROFILE_INFO[state.profile].note;save();if(state.plan)buildPlan()});
 ['difficulty','people','age','weight','activity','weekStart'].forEach(id=>$('#'+id).addEventListener('change',()=>{state[id]=id==='people'||id==='age'||id==='weight'||id==='difficulty'?Number($('#'+id).value):$('#'+id).value;save()}));
 $('#generateBtn').onclick=buildPlan;$('#generateTopBtn').onclick=()=>{buildPlan();$('#planSection').scrollIntoView({behavior:'smooth'});};$('#checkBtn').onclick=()=>checkShopping();$('#webBtn').onclick=webSearch;$('#demoBtn').onclick=()=>{applyPreset('balanced')};$$('[data-close-modal]').forEach(e=>e.onclick=closeModal);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
}
function init(){state.weekStart=state.weekStart||mondayOf();$('#weekStart').value=state.weekStart;$('#profileNote').textContent=PROFILE_INFO[state.profile].note;$$('.profile-tab').forEach(x=>x.classList.toggle('active',x.dataset.profile===state.profile));$('#difficulty').value=state.difficulty;$('#people').value=state.people;$('#age').value=state.age;$('#weight').value=state.weight;$('#activity').value=state.activity;renderPresets();renderQuickAdds();renderAll();bind()}
init();
