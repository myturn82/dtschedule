import { useState, useCallback } from 'react'
import { type Tab, TAB_LABELS } from '../lib/adminTabs'

const ALL_TABS = Object.keys(TAB_LABELS) as Tab[]

function loadFavorites(): Tab[] {
  try {
    const stored = localStorage.getItem('admin_tab_favorites')
    if (!stored) return []
    const parsed = JSON.parse(stored) as Tab[]
    return parsed.filter((t): t is Tab => ALL_TABS.includes(t))
  } catch {
    return []
  }
}

export function useAdminFavorites() {
  const [favorites, setFavorites] = useState<Tab[]>(loadFavorites)

  const toggleFavorite = useCallback((t: Tab) => {
    setFavorites(prev => {
      const next = prev.includes(t) ? prev.filter(f => f !== t) : [...prev, t]
      localStorage.setItem('admin_tab_favorites', JSON.stringify(next))
      return next
    })
  }, [])

  const isFavorite = useCallback((t: Tab) => favorites.includes(t), [favorites])

  const reorderFavorites = useCallback((from: number, to: number) => {
    setFavorites(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      localStorage.setItem('admin_tab_favorites', JSON.stringify(next))
      return next
    })
  }, [])

  const reorderFavoritesById = useCallback((fromId: Tab, toId: Tab) => {
    setFavorites(prev => {
      const from = prev.indexOf(fromId)
      const to = prev.indexOf(toId)
      if (from < 0 || to < 0 || from === to) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      localStorage.setItem('admin_tab_favorites', JSON.stringify(next))
      return next
    })
  }, [])

  return { favorites, isFavorite, toggleFavorite, reorderFavorites, reorderFavoritesById }
}
