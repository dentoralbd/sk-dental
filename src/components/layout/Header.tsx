import { Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
      >
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex-1 lg:flex-none" />
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium">Dr. Admin</p>
          <p className="text-xs text-text-secondary">Dentist</p>
        </div>
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
          DA
        </div>
      </div>
    </header>
  )
}
