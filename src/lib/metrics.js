/* ============================================================
   Derived metrics — turn raw Supabase rows into the shapes the
   UI needs: goal/stage progress, habit streaks, heatmaps, stats.
   ============================================================ */

export const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
export const WEEKDAYS = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота']
export const WD_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

export const WINDOW_DAYS = 119 // 17 weeks

// local YYYY-MM-DD (avoids UTC off-by-one from toISOString)
export function fmtDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function todayStr() {
  const d = new Date(); d.setHours(0, 0, 0, 0)
  return fmtDate(d)
}
function addDayStr(ds, n = 1) {
  const d = new Date(ds + 'T00:00:00'); d.setDate(d.getDate() + n)
  return fmtDate(d)
}

// human label for a goal due date ("до 1 декабря 2026")
export function formatDue(d) {
  if (!d) return 'без срока'
  const dt = new Date(d + 'T00:00:00')
  if (isNaN(dt)) return 'без срока'
  return `до ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

/* ---------------- habit derived ---------------- */

// 119-day window of levels (0 or 4), oldest → today
export function buildHeat(doneSet, days = WINDOW_DAYS) {
  const out = []
  const today = new Date(); today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    out.push(doneSet.has(fmtDate(d)) ? 4 : 0)
  }
  return out
}

// consecutive done days up to today; a not-yet-done today does not break it
export function calcStreak(doneSet) {
  const d = new Date(); d.setHours(0, 0, 0, 0)
  if (!doneSet.has(fmtDate(d))) d.setDate(d.getDate() - 1)
  let s = 0
  while (doneSet.has(fmtDate(d))) { s++; d.setDate(d.getDate() - 1) }
  return s
}

// longest run of consecutive done days ever
export function calcBest(doneSet) {
  const arr = [...doneSet].sort()
  let best = 0, run = 0, prev = null
  for (const ds of arr) {
    run = prev && addDayStr(prev) === ds ? run + 1 : 1
    if (run > best) best = run
    prev = ds
  }
  return best
}

// % of the window's days completed
export function calcRate(heat) {
  if (!heat.length) return 0
  return Math.round((heat.filter(l => l > 0).length / heat.length) * 100)
}

// "missed" = a positive habit not done today and already overdue (past its
// reminder time, or no reminder set). Quit habits are never "missed" — an
// unmarked day there just means the clean streak hasn't been extended yet.
export function isMissed(h) {
  if (h.kind === 'quit') return false
  if (h.doneToday) return false
  if (h.time && /^\d{1,2}:\d{2}$/.test(h.time)) {
    const [hh, mm] = h.time.split(':').map(Number)
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes() >= hh * 60 + mm
  }
  return true
}

/* ---------------- goal / stage progress ---------------- */

export function stageProgress(stage) {
  const total = stage.steps.length || 1
  const done = stage.steps.filter(s => s.done).length
  return { done, total, pct: Math.round((done / total) * 100) }
}

export function goalProgress(goal) {
  let total = 0, done = 0
  goal.stages.forEach(st => { total += st.steps.length; done += st.steps.filter(s => s.done).length })
  return {
    done, total, pct: total ? Math.round((done / total) * 100) : 0,
    stagesDone: goal.stages.filter(st => stageProgress(st).pct === 100).length,
    stagesTotal: goal.stages.length,
  }
}

export function currentStage(goal) {
  return goal.stages.find(st => stageProgress(st).pct < 100) || goal.stages[goal.stages.length - 1]
}

// next actionable steps across all goals
export function nextSteps(goals, n = 4) {
  const out = []
  goals.forEach(g => {
    if (!g.stages.length) return
    const st = currentStage(g)
    st.steps.filter(s => !s.done).slice(0, 2).forEach(s => out.push({ goal: g, stage: st, step: s }))
  })
  return out.slice(0, n)
}

/* ---------------- habit statistics ---------------- */

export function totalCompletions(habits) {
  return habits.reduce((a, h) => a + h.heat.filter(l => l > 0).length, 0)
}

// weekday breakdown (Mon..Sun) — % of that weekday completed, averaged across habits
export function weekdayBreakdown(habits, days = WINDOW_DAYS) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const hit = [0, 0, 0, 0, 0, 0, 0], tot = [0, 0, 0, 0, 0, 0, 0]
  habits.forEach(h => {
    const arr = h.heat.slice(-days)
    const n = arr.length
    arr.forEach((lvl, i) => {
      const date = new Date(today); date.setDate(today.getDate() - (n - 1 - i))
      const wd = (date.getDay() + 6) % 7 // Mon=0
      tot[wd]++; if (lvl > 0) hit[wd]++
    })
  })
  return WD_SHORT.map((label, i) => ({ label, pct: tot[i] ? Math.round((hit[i] / tot[i]) * 100) : 0 }))
}

// weekly completion trend — % per week over last `weeks` weeks (oldest→newest)
export function weeklyTrend(habits, weeks = 12) {
  const out = []
  for (let w = weeks - 1; w >= 0; w--) {
    let hit = 0, tot = 0
    habits.forEach(h => {
      const arr = h.heat
      const end = arr.length - w * 7
      const start = Math.max(0, end - 7)
      for (let i = start; i < end; i++) { tot++; if (arr[i] > 0) hit++ }
    })
    out.push(tot ? Math.round((hit / tot) * 100) : 0)
  }
  return out
}

// distinct days with at least one completion
export function activeDays(habits, days = WINDOW_DAYS) {
  const any = new Array(days).fill(false)
  habits.forEach(h => { h.heat.slice(-days).forEach((l, i) => { if (l > 0) any[i] = true }) })
  return any.filter(Boolean).length
}

/* ---------------- Eisenhower quadrants ---------------- */

export const QUADRANTS = [
  { id: 'do',       title: 'Сделать сейчас', hint: 'Срочно и важно',      urgent: true,  important: true },
  { id: 'plan',     title: 'Запланировать',  hint: 'Важно, не срочно',    urgent: false, important: true },
  { id: 'delegate', title: 'Делегировать',   hint: 'Срочно, не важно',    urgent: true,  important: false },
  { id: 'drop',     title: 'Убрать / потом', hint: 'Не срочно, не важно', urgent: false, important: false },
]
