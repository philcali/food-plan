import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { seedIfEmpty } from './lib/repository'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Recipes from './pages/Recipes'
import RecipeDetail from './pages/RecipeDetail'
import MealPlan from './pages/MealPlan'
import Diary from './pages/Diary'

export default function App() {
  seedIfEmpty()

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f8f7f4]">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/plan" element={<MealPlan />} />
          <Route path="/diary" element={<Diary />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
