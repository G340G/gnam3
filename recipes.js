/* ============================================================
   GNAM — Database Ricette (recipes.js)
   ============================================================ */

const RECIPES = [
  // ---------------- PRIMI / CEREALI + PROTEINE ----------------
  {
    id: "pasta_pomodoro_basilico",
    nome: "Pasta al pomodoro fresco e basilico",
    pasto: "entrambi",
    stili: ["m30", "normale", "elegante"],
    difficolta: 1,
    tempoMin: 20,
    ingredienti: [
      { nome: "pasta", quantita: 80, unita: "g" },
      { nome: "pomodoro", quantita: 200, unita: "g" },
      { nome: "basilico", quantita: 5, unita: "g" },
      { nome: "aglio", quantita: 1, unita: "spicchio" },
      { nome: "olio d'oliva", quantita: 10, unita: "ml" }
    ],
    stagione: ["estate", "tutte"],
    macro: { kcal: 420, proteine: 12, carboidrati: 70, grassi: 11, fibra: 4 },
    categoria: "cereale",
    fonte: "Piatto base mediterraneo, in linea con Linee Guida CREA",
    istruzioni: "Soffriggi l'aglio nell'olio, aggiungi i pomodori a cubetti e cuoci 10 min. Cuoci la pasta al dente, mantecala nel sugo, aggiungi basilico fresco."
  },
  {
    id: "riso_ceci_curcuma",
    nome: "Riso e ceci alla curcuma",
    pasto: "entrambi",
    stili: ["m30", "normale", "sportivo"],
    difficolta: 1,
    tempoMin: 20,
    ingredienti: [
      { nome: "riso", quantita: 70, unita: "g" },
      { nome: "ceci", quantita: 150, unita: "g" },
      { nome: "curcuma", quantita: 2, unita: "g" },
      { nome: "cipolla", quantita: 30, unita: "g" },
      { nome: "olio d'oliva", quantita: 10, unita: "ml" }
    ],
    stagione: ["tutte"],
    macro: { kcal: 460, proteine: 16, carboidrati: 75, grassi: 10, fibra: 9 },
    categoria: "misto",
    fonte: "Combinazione cereale+legume: proteine complete (linee guida WHO)",
    istruzioni: "Soffriggi la cipolla, aggiungi i ceci scolati e la curcuma, cuoci 5 min. Cuoci il riso separatamente e uniscilo, salta insieme 2 minuti."
  },
  {
    id: "farro_verdure_feta",
    nome: "Insalata di farro, verdure e feta",
    pasto: "pranzo",
    stili: ["normale", "elegante", "m30"],
    difficolta: 1,
    tempoMin: 25,
    ingredienti: [
      { nome: "farro", quantita: 70, unita: "g" },
      { nome: "zucchine", quantita: 100, unita: "g" },
      { nome: "pomodoro", quantita: 80, unita: "g" },
      { nome: "feta", quantita: 40, unita: "g" },
      { nome: "olio d'oliva", quantita: 10, unita: "ml" }
    ],
    stagione: ["estate", "primavera"],
    macro: { kcal: 430, proteine: 15, carboidrati: 60, grassi: 14, fibra: 7 },
    categoria: "misto",
    fonte: "Modello piatto Harvard (metà verdura, cereale integrale)",
    istruzioni: "Cuoci il farro, scolalo e raffredda. Taglia le verdure a cubetti, uniscile al farro con feta sbriciolata e un filo d'olio."
  },

  // ---------------- PROTEINE ANIMALI + CONTORNO ----------------
  {
    id: "pollo_curcuma_verdure",
    nome: "Petto di pollo alla curcuma con verdure saltate",
    pasto: "entrambi",
    stili: ["sportivo", "m30", "normale"],
    difficolta: 1,
    tempoMin: 20,
    ingredienti: [
      { nome: "pollo", quantita: 150, unita: "g" },
      { nome: "zucchine", quantita: 100, unita: "g" },
      { nome: "carote", quantita: 80, unita: "g" },
      { nome: "curcuma", quantita: 2, unita: "g" },
      { nome: "olio d'oliva", quantita: 10, unita: "ml" }
    ],
    stagione: ["tutte"],
    macro: { kcal: 350, proteine: 38, carboidrati: 12, grassi: 14, fibra: 4 },
    categoria: "proteina_animale",
    fonte: "Alto contenuto proteico magro, adatto a fabbisogno sportivo",
    istruzioni: "Taglia il pollo a cubetti, cuoci in padella con curcuma. Aggiungi le verdure a listarelle, salta insieme 10 min a fuoco vivo."
  },
  {
    id: "salmone_forno_broccoli",
    nome: "Salmone al forno con broccoli",
    pasto: "cena",
    stili: ["elegante", "sportivo", "m30"],
    difficolta: 1,
    tempoMin: 25,
    ingredienti: [
      { nome: "salmone", quantita: 150, unita: "g" },
      { nome: "broccoli", quantita: 200, unita: "g" },
      { nome: "limone", quantita: 0.5, unita: "pz" },
      { nome: "olio d'oliva", quantita: 10, unita: "ml" }
    ],
    stagione: ["autunno", "inverno"],
    macro: { kcal: 380, proteine: 34, carboidrati: 10, grassi: 22, fibra: 5 },
    categoria: "proteina_animale",
    fonte: "Ricco di omega-3 EPA/DHA (Linee guida EFSA)",
    istruzioni: "Inforna il salmone a 200°C per 15 min con limone e olio. Cuoci i broccoli al vapore 10 min, condisci con olio a crudo."
  },

  // ---------------- LEGUMI / VEGETARIANO ----------------
  {
    id: "zuppa_lenticchie",
    nome: "Zuppa di lenticchie e verdure",
    pasto: "cena",
    stili: ["m30", "normale"],
    difficolta: 1,
    tempoMin: 30,
    ingredienti: [
      { nome: "lenticchie", quantita: 150, unita: "g" },
      { nome: "carote", quantita: 60, unita: "g" },
      { nome: "sedano", quantita: 40, unita: "g" },
      { nome: "cipolla", quantita: 30, unita: "g" },
      { nome: "olio d'oliva", quantita: 10, unita: "ml" }
    ],
    stagione: ["autunno", "inverno"],
    macro: { kcal: 350, proteine: 20, carboidrati: 50, grassi: 8, fibra: 14 },
    categoria: "proteina_vegetale",
    fonte: "Legume ricco di ferro e fibra per varietà proteica",
    istruzioni: "Soffriggi il trito di carota-sedano-cipolla, aggiungi le lenticchie e acqua/brodo, cuoci 25 min a fuoco medio."
  },
  {
    id: "tofu_saltato_verdure",
    nome: "Tofu saltato con verdure e salsa di soia",
    pasto: "cena",
    stili: ["sportivo", "m30"],
    difficolta: 1,
    tempoMin: 15,
    ingredienti: [
      { nome: "tofu", quantita: 150, unita: "g" },
      { nome: "peperone", quantita: 80, unita: "g" },
      { nome: "carote", quantita: 60, unita: "g" },
      { nome: "salsa di soia", quantita: 10, unita: "ml" },
      { nome: "olio d'oliva", quantita: 5, unita: "ml" }
    ],
    stagione: ["tutte"],
    macro: { kcal: 320, proteine: 22, carboidrati: 18, grassi: 18, fibra: 5 },
    categoria: "proteina_vegetale",
    fonte: "Fonte proteica vegetale completa",
    istruzioni: "Taglia il tofu a cubetti e saltalo in padella finché dorato. Aggiungi le verdure a listarelle e la salsa di soia, cuoci 6-8 min."
  }
];

// Mappa di sinonimi per normalizzare la ricerca degli ingredienti
const INGREDIENT_SYNONYMS = {
  "pomodori": "pomodoro",
  "zucchina": "zucchine",
  "carota": "carote",
  "patata": "patate",
  "cipolle": "cipolla",
  "uovo": "uova",
  "petto di pollo": "pollo",
  "petto di tacchino": "tacchino",
  "filetto di salmone": "salmone",
  "filetto di merluzzo": "merluzzo",
  "ceci in scatola": "ceci",
  "fagioli in scatola": "fagioli",
  "lenticchie secche": "lenticchie",
  "riso basmati": "riso",
  "spaghetti": "pasta",
  "penne": "pasta"
};

// Normalizzazione testo (rimozione accenti e caratteri speciali)
function normalizeIngredientName(name) {
  const cleanName = name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  
  return INGREDIENT_SYNONYMS[cleanName] || cleanName;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { RECIPES, normalizeIngredientName, INGREDIENT_SYNONYMS };
}