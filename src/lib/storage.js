const KEYS = {
  recipes: 'fp_recipes',
  mealSlots: 'fp_meal_slots',
  feedingLogs: 'fp_feeding_logs',
}

function get(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || null
  } catch {
    return null
  }
}

function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ── Recipes ──
export function getRecipes() {
  return get(KEYS.recipes) || []
}

export function saveRecipes(recipes) {
  set(KEYS.recipes, recipes)
}

export function addRecipe(recipe) {
  const recipes = getRecipes()
  const newRecipe = { ...recipe, id: genId(), createdAt: new Date().toISOString() }
  saveRecipes([newRecipe, ...recipes])
  return newRecipe
}

export function updateRecipe(id, updates) {
  const recipes = getRecipes()
  saveRecipes(recipes.map(r => (r.id === id ? { ...r, ...updates } : r)))
}

export function deleteRecipe(id) {
  saveRecipes(getRecipes().filter(r => r.id !== id))
}

// ── Meal Slots ──
export function getMealSlots() {
  return get(KEYS.mealSlots) || []
}

export function saveMealSlots(slots) {
  set(KEYS.mealSlots, slots)
}

export function addMealSlot(slot) {
  const slots = getMealSlots()
  saveMealSlots([...slots, { ...slot, id: genId() }])
}

export function updateMealSlot(id, updates) {
  const slots = getMealSlots()
  saveMealSlots(slots.map(s => (s.id === id ? { ...s, ...updates } : s)))
}

export function deleteMealSlot(id) {
  saveMealSlots(getMealSlots().filter(s => s.id !== id))
}

// ── Feeding Logs ──
export function getFeedingLogs() {
  return get(KEYS.feedingLogs) || []
}

export function saveFeedingLogs(logs) {
  set(KEYS.feedingLogs, logs)
}

export function addFeedingLog(log) {
  const logs = getFeedingLogs()
  saveFeedingLogs([...logs, { ...log, id: genId() }])
}

export function updateFeedingLog(id, updates) {
  const logs = getFeedingLogs()
  saveFeedingLogs(logs.map(l => (l.id === id ? { ...l, ...updates } : l)))
}

export function deleteFeedingLog(id) {
  saveFeedingLogs(getFeedingLogs().filter(l => l.id !== id))
}

// ── Seed data for demo ──
export function seedIfEmpty() {
  if (getRecipes().length === 0) {
    const now = new Date().toISOString()
    const seeds = [
      { id: 'demo1', name: 'Avocado', emoji: '🥑', ingredient: 'avocado', ageMin: 6, texture: 'mashed', allergens: [], prepNotes: 'Mash ripe avocado with a fork. No salt or seasoning needed.', safe: true, createdAt: now },
      { id: 'demo2', name: 'Banana', emoji: '🍌', ingredient: 'banana', ageMin: 6, texture: 'mashed', allergens: [], prepNotes: 'Mash ripe banana. Can be offered as strips for finger food.', safe: true, createdAt: now },
      { id: 'demo3', name: 'Sweet Potato', emoji: '🍠', ingredient: 'sweet potato', ageMin: 6, texture: 'puree', allergens: [], prepNotes: 'Roast or steam until soft, then mash or puree.', safe: true, createdAt: now },
      { id: 'demo4', name: 'Carrot', emoji: '🥕', ingredient: 'carrot', ageMin: 6, texture: 'puree', allergens: [], prepNotes: 'Steam until very soft, then puree. Can be offered as thick sticks for grasping.', safe: true, createdAt: now },
      { id: 'demo5', name: 'Pear', emoji: '🍐', ingredient: 'pear', ageMin: 6, texture: 'mashed', allergens: [], prepNotes: 'Peel, cook until soft, then mash or offer as thin strips.', safe: true, createdAt: now },
      { id: 'demo6', name: 'Apple', emoji: '🍎', ingredient: 'apple', ageMin: 6, texture: 'puree', allergens: [], prepNotes: 'Peel, steam until soft, then puree. Serve thin strips for finger food.', safe: true, createdAt: now },
      { id: 'demo7', name: 'Egg Yolk', emoji: '🥚', ingredient: 'egg', ageMin: 8, texture: 'mashed', allergens: ['egg'], prepNotes: 'Hard boil, mash yolk with breast milk or formula. Introduce allergens early per pediatric guidance.', safe: false, createdAt: now },
      { id: 'demo8', name: 'Peanut Butter', emoji: '🥜', ingredient: 'peanut butter', ageMin: 6, texture: 'thinned', allergens: ['peanut'], prepNotes: 'Thin with warm water to a pourable consistency. Never offer whole peanuts.', safe: false, createdAt: now },
      { id: 'demo9', name: 'Zucchini', emoji: '🥒', ingredient: 'zucchini', ageMin: 6, texture: 'mashed', allergens: [], prepNotes: 'Steam until soft, mash or offer as thick strips.', safe: true, createdAt: now },
      { id: 'demo10', name: 'Spinach', emoji: '🥬', ingredient: 'spinach', ageMin: 6, texture: 'puree', allergens: [], prepNotes: 'Steam and puree. Mix with a fruit to balance flavor.', safe: true, createdAt: now },
    ]
    saveRecipes(seeds)
  }
}
