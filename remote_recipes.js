/* Live recipe discovery for Gnam.
   TheMealDB V1 is used as a discovery/verification source. Recipes keep their
   original source URL; Gnam never treats generated combinations as recipes. */
const GNAM_REMOTE_CONFIG={
  base:'https://www.themealdb.com/api/json/v1/1',
  cacheKey:'gnam_live_recipe_cache_v1',
  ttlMs:7*24*60*60*1000,
  maxMeals:700
};

function remoteCacheRead(){try{const x=JSON.parse(localStorage.getItem(GNAM_REMOTE_CONFIG.cacheKey)||'{}');if(x.ts&&Date.now()-x.ts<GNAM_REMOTE_CONFIG.ttlMs)return x.meals||[];}catch{}return[]}
function remoteCacheWrite(meals){try{localStorage.setItem(GNAM_REMOTE_CONFIG.cacheKey,JSON.stringify({ts:Date.now(),meals}))}catch{}}
function remoteFieldList(m){const out=[];for(let i=1;i<=20;i++){const n=(m[`strIngredient${i}`]||'').trim();const q=(m[`strMeasure${i}`]||'').trim();if(n)out.push([n,q]);}return out}
function remoteCleanName(s){return String(s||'').toLowerCase().replace(/[^a-zà-ÿ0-9\s]/gi,' ').replace(/\s+/g,' ').trim()}
function remoteValid(m){
  const ings=remoteFieldList(m); const ins=String(m.strInstructions||'').trim();
  return !!(m&&m.idMeal&&m.strMeal&&ings.length>=3&&ins.length>=120&&(m.strSource||m.strMealThumb));
}
async function remoteFetch(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}
function remoteToGnam(m){
  const ingredients=remoteFieldList(m).map(([n,q])=>[n,q||'q.b.','raw']);
  return {
    id:`web-${m.idMeal}`,
    externalId:m.idMeal,
    name:m.strMeal,
    time:30,
    diff:2,
    tags:['online','verificata',String(m.strCategory||'').toLowerCase(),String(m.strArea||'').toLowerCase()].filter(Boolean),
    style:['normal','sport','elegant'],
    ingredients,
    protein:remoteProteinFamily(m),
    sourceUrl:m.strSource||`https://www.themealdb.com/meal/${m.idMeal}`,
    sourceName:'TheMealDB',
    sourceInstructions:String(m.strInstructions||''),
    thumb:m.strMealThumb||'',
    verifiedOnline:true,
    remote:true,
    steps:null
  }
}
function remoteProteinFamily(m){
  const s=remoteFieldList(m).map(x=>remoteCleanName(x[0])).join(' | ');
  if(/salmon|tuna|cod|haddock|mackerel|sardine|anchov|prawn|shrimp|fish|seafood|trout/.test(s))return'fish';
  if(/chicken|turkey|duck/.test(s))return'chicken';
  if(/beef|steak|mince|lamb|pork|bacon|sausage/.test(s))return'meat';
  if(/egg/.test(s))return'egg';
  if(/lentil|chickpea|bean|pea|black bean|kidney bean/.test(s))return'legume';
  if(/tofu|tempeh/.test(s))return'plant-protein';
  if(/yogurt|yoghurt|cheese|ricotta|feta|mozzarella|milk/.test(s))return'dairy';
  return null;
}
async function getLiveRecipePool(pantry){
  const cached=remoteCacheRead();
  const seed=(cached.length?cached:[]);
  const pantryNames=pantry.map(x=>normalizeName(x.name)).filter(Boolean);
  const aliases={
    'petto di pollo':'chicken breast','salmone':'salmon','merluzzo':'cod','orata':'bream',
    'tonno al naturale':'tuna','ceci cotti':'chickpeas','lenticchie cotte':'lentils','fagioli cannellini':'cannellini beans',
    'pasta integrale':'whole wheat pasta','pasta':'pasta','riso':'rice','patate':'potatoes','zucchine':'courgettes',
    'broccoli':'broccoli','spinaci':'spinach','carote':'carrots','pomodori':'tomatoes','peperoni':'peppers',
    'melanzane':'aubergine','uova':'eggs','ricotta':'ricotta','yogurt greco':'greek yogurt','feta':'feta','olive':'olives',
    'pane integrale':'whole wheat bread','cipolla':'onion','limone':'lemon','piselli':'peas','noci':'walnuts'
  };
  const queries=[...new Set(pantryNames.map(n=>aliases[n]||n).filter(Boolean))].slice(0,16);
  let ids=new Set(seed.map(x=>x.externalId));
  try{
    const letters='abcdefghijklmnopqrstuvwxyz'.split('');
    const byLetter=await Promise.all(letters.map(async letter=>{try{const d=await remoteFetch(`${GNAM_REMOTE_CONFIG.base}/search.php?f=${letter}`);return d.meals||[]}catch{return[]}}));
    for(const list of byLetter)for(const x of list)ids.add(x.idMeal);
    const ingredientBatches=await Promise.all(queries.map(async q=>{try{const d=await remoteFetch(`${GNAM_REMOTE_CONFIG.base}/filter.php?i=${encodeURIComponent(q)}`);return d.meals||[]}catch{return[]}}));
    for(const list of ingredientBatches)for(const x of list)ids.add(x.idMeal);
    const newIds=[...ids].slice(0,GNAM_REMOTE_CONFIG.maxMeals);
    const seedFull=[];
    for(const list of byLetter)seedFull.push(...list);
    const fullById=new Map(seedFull.map(x=>[x.idMeal,x]));
    const missingIds=newIds.filter(id=>!fullById.has(id));
    const chunk=16;
    for(let i=0;i<missingIds.length;i+=chunk){
      const part=await Promise.all(missingIds.slice(i,i+chunk).map(async id=>{try{const d=await remoteFetch(`${GNAM_REMOTE_CONFIG.base}/lookup.php?i=${id}`);return d.meals?.[0]||null}catch{return null}}));
      for(const m of part.filter(Boolean))fullById.set(m.idMeal,m);
    }
    const valid=[...fullById.values()].filter(remoteValid).map(remoteToGnam);
    const merged=[...cached.filter(Boolean),...valid];
    const uniq=[...new Map(merged.map(x=>[x.externalId,x])).values()].slice(-GNAM_REMOTE_CONFIG.maxMeals);
    remoteCacheWrite(uniq);
    return uniq;
  }catch{return seed}
}
window.GNAM_REMOTE={getLiveRecipePool};
