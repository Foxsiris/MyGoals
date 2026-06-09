/* ============================================================
   Data hook — loads everything from Supabase once on mount.
   ============================================================ */
import { useEffect, useState } from 'react'
import { loadAll } from './lib/api'

export function useData() {
  const [goals, setGoals] = useState([])
  const [habits, setHabits] = useState([])
  const [matrixTasks, setMatrixTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    loadAll()
      .then(d => {
        if (!alive) return
        setGoals(d.goals); setHabits(d.habits); setMatrixTasks(d.matrixTasks)
        setLoading(false)
      })
      .catch(e => {
        if (!alive) return
        console.error('loadAll failed', e)
        setError(e); setLoading(false)
      })
    return () => { alive = false }
  }, [])

  return { goals, setGoals, habits, setHabits, matrixTasks, setMatrixTasks, loading, error }
}
