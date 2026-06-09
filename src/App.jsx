/* ============================================================
   Рост — app shell, routing, and the data store wired to Supabase.
   ============================================================ */
import { useEffect, useState } from 'react'
import { Icon } from './components/Icon'
import { FormModal } from './components/forms'
import { Dashboard } from './screens/Dashboard'
import { Habits } from './screens/Habits'
import { Goals } from './screens/Goals'
import { GoalDetail } from './screens/GoalDetail'
import { Matrix } from './screens/Matrix'
import { Stats } from './screens/Stats'
import { useData } from './store'
import {
  buildHeat, calcStreak, calcBest, calcRate, todayStr, formatDue,
} from './lib/metrics'
import * as api from './lib/api'

const ROUTES = ['dashboard', 'matrix', 'habits', 'stats', 'goals']

function recomputeHabit(h, doneSet) {
  const heat = buildHeat(doneSet)
  return { ...h, doneSet, heat, doneToday: doneSet.has(todayStr()),
    streak: calcStreak(doneSet), best: calcBest(doneSet), rate: calcRate(heat) }
}

export default function App() {
  const { goals, setGoals, habits, setHabits, matrixTasks, setMatrixTasks, loading, error } = useData()

  const initRoute = (() => {
    const h = typeof location !== 'undefined' ? location.hash.slice(1) : ''
    if (h.startsWith('goal:')) return { route: 'goalDetail', goal: h.slice(5) }
    if ([...ROUTES].includes(h)) return { route: h, goal: null }
    return { route: 'dashboard', goal: null }
  })()
  const [route, setRouteState] = useState(initRoute.route)
  const [selectedGoal, setSelectedGoal] = useState(initRoute.goal)
  const [form, setForm] = useState(null)
  const [addMenu, setAddMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)')
    const h = () => setIsMobile(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const scrollTop = () => document.querySelector('.main')?.scrollTo({ top: 0 })
  const setRoute = (k) => { setRouteState(k); scrollTop() }

  // helpers to mutate one goal immutably
  const updGoalLocal = (gid, fn) =>
    setGoals(gs => gs.map(g => (g.id === gid
      ? fn({ ...g, stages: g.stages.map(s => ({ ...s, steps: [...s.steps] })) })
      : g)))

  const store = {
    goals, habits, matrixTasks, route, selectedGoal, form, setRoute,

    openGoal(id) { setSelectedGoal(id); setRouteState('goalDetail'); scrollTop() },

    /* ---------- habits ---------- */
    toggleHabit(id) {
      const h = habits.find(x => x.id === id)
      if (!h) return
      const on = !h.doneToday
      const doneSet = new Set(h.doneSet)
      if (on) doneSet.add(todayStr()); else doneSet.delete(todayStr())
      setHabits(hs => hs.map(x => (x.id === id ? recomputeHabit(x, doneSet) : x)))
      api.setHabitToday(id, on).then(r => { if (r?.error) console.error(r.error) }).catch(console.error)
    },

    /* ---------- steps / stages ---------- */
    toggleStep(gid, sid, tid) {
      const g = goals.find(x => x.id === gid)
      const st = g?.stages.find(x => x.id === sid)
      const step = st?.steps.find(x => x.id === tid)
      if (!step) return
      const done = !step.done
      updGoalLocal(gid, gg => {
        gg.stages = gg.stages.map(s => (s.id !== sid ? s
          : { ...s, steps: s.steps.map(x => (x.id === tid ? { ...x, done } : x)) }))
        return gg
      })
      api.setStepDone(tid, done).then(r => { if (r?.error) console.error(r.error) }).catch(console.error)
    },

    async addStep(gid, sid, name) {
      const g = goals.find(x => x.id === gid)
      const st = g?.stages.find(x => x.id === sid)
      if (!st) return
      try {
        const row = await api.insertStep(sid, name, st.steps.length)
        updGoalLocal(gid, gg => {
          gg.stages = gg.stages.map(s => (s.id !== sid ? s
            : { ...s, steps: [...s.steps, { id: row.id, name: row.name, done: false }] }))
          return gg
        })
      } catch (e) { console.error(e) }
    },

    async addStage(gid) {
      const g = goals.find(x => x.id === gid)
      if (!g) return
      try {
        const row = await api.insertStage(gid, 'Новый этап', 'без срока', g.stages.length)
        updGoalLocal(gid, gg => {
          gg.stages = [...gg.stages, { id: row.id, name: row.name, due: row.due, steps: [] }]
          return gg
        })
      } catch (e) { console.error(e) }
    },

    /* ---------- forms ---------- */
    openForm(type, editId = null) { setForm({ type, editId }) },
    closeForm() { setForm(null) },

    async saveGoal({ editId, name, why, due, icon, stageNames }) {
      const dueLabel = formatDue(due)
      if (editId) {
        const g = goals.find(x => x.id === editId)
        try {
          await api.updateGoal(editId, { name, icon, why, due, dueLabel })
          // reconcile stages by position
          const newStages = []
          for (let i = 0; i < stageNames.length; i++) {
            const cur = g.stages[i]
            if (cur) {
              if (cur.name !== stageNames[i]) await api.updateStage(cur.id, { name: stageNames[i] })
              newStages.push({ ...cur, name: stageNames[i] })
            } else {
              const row = await api.insertStage(editId, stageNames[i], 'без срока', i)
              newStages.push({ id: row.id, name: row.name, due: row.due, steps: [] })
            }
          }
          const removed = g.stages.slice(stageNames.length)
          if (removed.length) await api.deleteStages(removed.map(s => s.id))
          updGoalLocal(editId, gg => {
            gg.name = name; gg.icon = icon; gg.why = why; gg.due = due; gg.dueLabel = dueLabel
            gg.stages = newStages
            return gg
          })
        } catch (e) { console.error(e) }
      } else {
        const note = 'Двигайся маленькими шагами — главное не скорость, а постоянство.'
        const names = stageNames.length ? stageNames : ['Первый этап']
        try {
          const goalRow = await api.insertGoal({ name, icon, why, due, dueLabel, note }, goals.length)
          const stages = []
          for (let i = 0; i < names.length; i++) {
            const row = await api.insertStage(goalRow.id, names[i], 'без срока', i)
            stages.push({ id: row.id, name: row.name, due: row.due, steps: [] })
          }
          const ng = { id: goalRow.id, name, why, due, dueLabel, icon, note, stages, habits: [] }
          setGoals(gs => [...gs, ng])
          setSelectedGoal(ng.id); setRouteState('goalDetail'); scrollTop()
        } catch (e) { console.error(e) }
      }
      setForm(null)
    },

    async saveHabit({ editId, name, icon, freqType, freq, time, goals: gl }) {
      if (editId) {
        try {
          await api.updateHabit(editId, { name, icon, freq, freqType, time })
          await api.setHabitGoals(editId, gl)
          setHabits(hs => hs.map(h => (h.id === editId ? { ...h, name, icon, freq, freqType, time, goals: gl } : h)))
          // keep goal.habits in sync
          setGoals(gs => gs.map(g => ({
            ...g,
            habits: gl.includes(g.id)
              ? Array.from(new Set([...g.habits, editId]))
              : g.habits.filter(id => id !== editId),
          })))
        } catch (e) { console.error(e) }
      } else {
        try {
          const row = await api.insertHabit({ name, icon, freq, freqType, time }, habits.length)
          await api.setHabitGoals(row.id, gl)
          const nh = recomputeHabit({
            id: row.id, name, icon, color: 'habit', freq, freqType, time, goals: gl,
          }, new Set())
          setHabits(hs => [...hs, nh])
          setGoals(gs => gs.map(g => (gl.includes(g.id)
            ? { ...g, habits: Array.from(new Set([...g.habits, row.id])) } : g)))
        } catch (e) { console.error(e) }
      }
      setForm(null)
    },

    /* ---------- matrix ---------- */
    moveTask(id, quadrant) {
      setMatrixTasks(ts => ts.map(t => (t.id === id ? { ...t, quadrant } : t)))
      api.updateMatrixTask(id, { quadrant }).then(r => { if (r?.error) console.error(r.error) }).catch(console.error)
    },
    removeMatrixTask(id) {
      setMatrixTasks(ts => ts.filter(t => t.id !== id))
      api.deleteMatrixTask(id).then(r => { if (r?.error) console.error(r.error) }).catch(console.error)
    },
    renameTask(id, name) {
      setMatrixTasks(ts => ts.map(t => (t.id === id ? { ...t, name, isNew: false } : t)))
      api.updateMatrixTask(id, { name }).then(r => { if (r?.error) console.error(r.error) }).catch(console.error)
    },
    async addMatrixTask(quadrant) {
      const pos = matrixTasks.filter(t => t.quadrant === quadrant).length
      try {
        const row = await api.insertMatrixTask({ name: '', tag: 'Личное', accent: 'neutral', quadrant }, pos)
        setMatrixTasks(ts => [...ts, { ...row, isNew: true }])
        if (route !== 'matrix') setRouteState('matrix')
      } catch (e) { console.error(e) }
    },
  }

  const NAV = [
    { k: 'dashboard', label: 'Дашборд', short: 'Главная', icon: 'home' },
    { k: 'matrix', label: 'Матрица', short: 'Матрица', icon: 'grid' },
    { k: 'habits', label: 'Привычки', short: 'Привычки', icon: 'habit', count: habits.length },
    { k: 'stats', label: 'Статистика', short: 'Стата', icon: 'chart' },
    { k: 'goals', label: 'Цели', short: 'Цели', icon: 'goal', count: goals.length },
  ]
  const isActive = (k) => route === k || (k === 'goals' && route === 'goalDetail')
  const go = (k) => { setRouteState(k); scrollTop() }

  if (loading) {
    return (
      <div className="app-loader">
        <div className="brand-mark"><span /></div>
        Загружаем твой прогресс…
      </div>
    )
  }
  if (error) {
    return (
      <div className="app-loader">
        <div className="brand-mark"><span /></div>
        Не удалось подключиться к базе. Проверь соединение и обнови страницу.
      </div>
    )
  }

  const screen = (
    <div className="main-inner">
      {route === 'dashboard' && <Dashboard store={store} />}
      {route === 'matrix' && <Matrix store={store} />}
      {route === 'habits' && <Habits store={store} />}
      {route === 'stats' && <Stats store={store} />}
      {route === 'goals' && <Goals store={store} />}
      {route === 'goalDetail' && <GoalDetail store={store} />}
    </div>
  )

  // ---------------- Mobile shell ----------------
  if (isMobile) {
    return (
      <div className="app mobile">
        <header className="mtopbar">
          <div className="brand">
            <div className="brand-mark"><span /></div>
            <div className="brand-name">Рост</div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button className={`madd ${addMenu ? 'open' : ''}`} onClick={() => setAddMenu(a => !a)} aria-label="Добавить">
              <Icon name="plus" size={22} stroke={2.4} />
            </button>
            <div className="mavatar">Д</div>
          </div>
        </header>

        <main className="main">{screen}</main>

        {addMenu && <>
          <div className="addmenu-overlay" onClick={() => setAddMenu(false)} />
          <div className="addmenu addmenu-top">
            <button onClick={() => { setAddMenu(false); store.openForm('habit') }}>
              <span className="mi" style={{ background: 'var(--habit-tint)', color: 'var(--habit-ink)' }}><Icon name="habit" size={20} /></span>
              Новая привычка
            </button>
            <button onClick={() => { setAddMenu(false); store.openForm('goal') }}>
              <span className="mi" style={{ background: 'var(--goal-tint)', color: 'var(--goal)' }}><Icon name="goal" size={20} /></span>
              Новая цель
            </button>
            <button onClick={() => { setAddMenu(false); store.addMatrixTask('do') }}>
              <span className="mi" style={{ background: 'var(--goal-tint)', color: 'var(--goal)' }}><Icon name="grid" size={20} /></span>
              Задача в матрицу
            </button>
          </div>
        </>}

        <nav className="tabbar tabbar-5">
          {NAV.map(n => (
            <button key={n.k} className={`tab ${isActive(n.k) ? 'active' : ''}`} onClick={() => { setAddMenu(false); go(n.k) }}>
              <Icon name={n.icon} size={22} /> {n.short}
            </button>
          ))}
        </nav>

        {form && <FormModal store={store} />}
      </div>
    )
  }

  // ---------------- Desktop shell ----------------
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><span /></div>
          <div className="brand-name">Рост</div>
        </div>
        <div className="nav-label">Меню</div>
        {NAV.map(n => (
          <button key={n.k} className={`nav-item ${isActive(n.k) ? 'active' : ''}`} onClick={() => go(n.k)}>
            <Icon name={n.icon} size={19} /> {n.label}
            {n.count != null && <span className="nav-count">{n.count}</span>}
          </button>
        ))}

        <div className="nav-label">Быстро</div>
        <button className="nav-item" onClick={() => store.openForm('habit')}>
          <span style={{ color: 'var(--habit)' }}><Icon name="plus" size={19} /></span> Привычка
        </button>
        <button className="nav-item" onClick={() => store.openForm('goal')}>
          <span style={{ color: 'var(--goal)' }}><Icon name="plus" size={19} /></span> Цель
        </button>

        <div className="sidebar-foot">
          <div className="avatar">Д</div>
          <div className="who">Даниил<small>Растёт каждый день</small></div>
        </div>
      </aside>

      <main className="main">{screen}</main>

      {form && <FormModal store={store} />}
    </div>
  )
}
