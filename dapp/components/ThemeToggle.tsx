'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
    )
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-lg bg-gray-950 border border-gray-700 hover:bg-gray-900 transition-all duration-200 flex items-center justify-center group"
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {/* Sun icon (visible in dark mode) */}
      <Sun className="w-5 h-5 text-white absolute transition-all duration-300 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />

      {/* Moon icon (visible in light mode) */}
      <Moon className="w-5 h-5 text-white dark:text-white absolute transition-all duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />

      {/* Tooltip */}
      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-dark-900 border border-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </span>
    </button>
  )
}
