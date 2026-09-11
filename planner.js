/* ============================================================
   GNAM — Planner Engine (planner.js)
   ============================================================ */

if (typeof require !== "undefined") {
  var { RECIPES, normalizeIngredientName } = require("./recipes.js");
}

/**
 * Filtra le ricette in base ai criteri dell'utente.
 */
function filterRecipes(recipes, filters = {}) {
  const { pasto, stile, stagione, maxTempo, ingrediente } = filters;

  return recipes.filter((recipe) => {
    if (pasto && recipe.pasto !== "entrambi" && recipe.pasto !== pasto) return false;
    if (stile && !recipe.stili.includes(stile)) return false;
    if (stagione && !recipe.stagione.includes("tutte") && !recipe.stagione.includes(stagione)) return false;
    if (maxTempo && recipe.tempoMin > maxTempo) return false;
    
    if (ingrediente) {
      const normalizedQuery = normalizeIngredientName(ingrediente);
      const hasIngredient = recipe.ingredienti.some(
        ing => normalizeIngredientName(ing.nome).includes(normalizedQuery)
      );
      if (!hasIngredient) return false;
    }

    return true;
  });
}

/**
 * Genera un piano pasti per N giorni selezionando ricette varie ed equilibrate.
 */
function generateMealPlan(daysCount = 7, options = {}) {
  const plan = [];
  const usedRecipeIds = new Set();

  for (let i = 1; i <= daysCount; i++) {
    const pranzoPool = filterRecipes(RECIPES, { pasto: "pranzo", ...options })
      .filter(r => !usedRecipeIds.has(r.id));
    
    const pranzo = pranzoPool.length > 0 
      ? pranzoPool[Math.floor(Math.random() * pranzoPool.length)]
      : RECIPES[0];

    if (pranzo) usedRecipeIds.add(pranzo.id);

    const cenaPool = filterRecipes(RECIPES, { pasto: "cena", ...options })
      .filter(r => !usedRecipeIds.has(r.id));

    const cena = cenaPool.length > 0
      ? cenaPool[Math.floor(Math.random() * cenaPool.length)]
      : RECIPES[1];

    if (cena) usedRecipeIds.add(cena.id);

    plan.push({
      giorno: `Giorno ${i}`,
      pranzo,
      cena
    });
  }

  return plan;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { filterRecipes, generateMealPlan };
}