import { Link, useLocation } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/recipes', label: 'Recipes', icon: '📖' },
  { to: '/plan', label: 'Plan', icon: '📅' },
  { to: '/diary', label: 'Diary', icon: '📝' },
]

export default function BottomNav() {
  const loc = useLocation()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-gray-200/60 safe-area-pb">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {nav.map(n => (
          <Link
            key={n.to}
            to={n.to}
            className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 transition-colors ${
              loc.pathname === n.to ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <span className="text-xl leading-none">{n.icon}</span>
            <span className="text-[10px] font-medium">{n.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
