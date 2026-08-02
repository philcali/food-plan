// ── Repository Interface ──
// All data sources implement this contract.
// UI code calls repo methods — no knowledge of storage backend.
//
// Recipes & FeedingLogs: offset-based pagination
// MealSlots: returns all, UI slices by week
// Ordering: descending by default (newest first)

/**
 * Format a Date as YYYY-MM-DD in the user's local timezone.
 * Uses 'en-CA' locale which produces YYYY-MM-DD natively.
 */
export function localDate(d = new Date()) {
  return d.toLocaleDateString('en-CA')
}

/**
 * Parse a YYYY-MM-DD string back to a Date at local midnight.
 * Avoids UTC midnight pitfalls — treats the string as local time.
 */
export function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const KEYS = {
  recipes: 'fp_recipes',
  mealSlots: 'fp_meal_slots',
  feedingLogs: 'fp_feeding_logs',
}

/**
 * Compress an image file to a JPEG data URL.
 * Reduces file size to keep localStorage from filling up.
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width in pixels (default 800)
 * @param {number} quality - JPEG quality 0-1 (default 0.6)
 * @returns {Promise<string>} Base64 data URL of compressed image
 */
export async function compressImage(file, maxWidth = 800, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
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

function sortDesc(items) {
  return [...items].sort((a, b) => {
    const aTime = a.createdAt || a.date || ''
    const bTime = b.createdAt || b.date || ''
    return bTime.localeCompare(aTime)
  })
}

// ── Recipes ──
export const recipesRepo = {
  list({ limit = 100, offset = 0 } = {}) {
    const all = sortDesc(get(KEYS.recipes) || [])
    const items = all.slice(offset, offset + limit)
    return { items, total: all.length }
  },
  get(id) {
    return (get(KEYS.recipes) || []).find(r => r.id === id) || null
  },
  create(recipe) {
    const all = get(KEYS.recipes) || []
    const newRecipe = { ...recipe, id: genId(), createdAt: new Date().toISOString() }
    set(KEYS.recipes, [newRecipe, ...all])
    return newRecipe
  },
  update(id, updates) {
    const all = get(KEYS.recipes) || []
    set(KEYS.recipes, all.map(r => (r.id === id ? { ...r, ...updates } : r)))
  },
  delete(id) {
    set(KEYS.recipes, (get(KEYS.recipes) || []).filter(r => r.id !== id))
  },
}

// ── Meal Slots ──
export const mealSlotsRepo = {
  list() {
    return sortDesc(get(KEYS.mealSlots) || [])
  },
  get(id) {
    return (get(KEYS.mealSlots) || []).find(s => s.id === id) || null
  },
  create(slot) {
    const all = get(KEYS.mealSlots) || []
    const newSlot = { ...slot, id: genId(), createdAt: new Date().toISOString() }
    set(KEYS.mealSlots, [newSlot, ...all])
    return newSlot
  },
  update(id, updates) {
    const all = get(KEYS.mealSlots) || []
    set(KEYS.mealSlots, all.map(s => (s.id === id ? { ...s, ...updates } : s)))
  },
  delete(id) {
    set(KEYS.mealSlots, (get(KEYS.mealSlots) || []).filter(s => s.id !== id))
  },
}

// ── Feeding Logs ──
export const feedingLogsRepo = {
  list({ limit = 100, offset = 0 } = {}) {
    const all = sortDesc(get(KEYS.feedingLogs) || [])
    const items = all.slice(offset, offset + limit)
    return { items, total: all.length }
  },
  get(id) {
    return (get(KEYS.feedingLogs) || []).find(l => l.id === id) || null
  },
  create(log) {
    const all = get(KEYS.feedingLogs) || []
    const newLog = { ...log, id: genId() }
    set(KEYS.feedingLogs, [newLog, ...all])
    return newLog
  },
  update(id, updates) {
    const all = get(KEYS.feedingLogs) || []
    set(KEYS.feedingLogs, all.map(l => (l.id === id ? { ...l, ...updates } : l)))
  },
  delete(id) {
    set(KEYS.feedingLogs, (get(KEYS.feedingLogs) || []).filter(l => l.id !== id))
  },
}

// ── Seed data for demo ──
export function seedIfEmpty() {
  if ((get(KEYS.recipes) || []).length === 0) {
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
    set(KEYS.recipes, seeds)

    // Seed demo meal slots if empty
    if ((get(KEYS.mealSlots) || []).length === 0) {
      const day = localDate()
      const slotSeeds = [
        { id: 'slot1', day, time: '09:00', recipeId: 'demo1', notes: 'First morning snack' },
        { id: 'slot2', day, time: '12:00', recipeId: 'demo3', notes: 'Lunch time' },
        { id: 'slot3', day, time: '15:00', recipeId: 'demo2', notes: 'Afternoon treat' },
      ]
      set(KEYS.mealSlots, slotSeeds)
    }

    // Seed demo feeding logs if empty
    if ((get(KEYS.feedingLogs) || []).length === 0) {
      const logSeeds = [
        { id: 'log1', date: day, time: '09:15', recipeId: 'demo1', amount: 'Ate most', reaction: 'None', notes: 'Loved it!', favorite: true },
        { id: 'log2', date: day, time: '12:10', recipeId: 'demo3', amount: 'Ate all', reaction: 'None', notes: '', favorite: false },
        { id: 'log3', date: day, time: '15:20', recipeId: 'demo2', amount: 'Tasted', reaction: 'None', notes: 'Wasn\'t hungry', favorite: false },
      ]
      set(KEYS.feedingLogs, logSeeds)
    }
  }
}
