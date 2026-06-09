/* ============================================================
   Derived metrics — turn raw Supabase rows into the shapes the
   UI needs: goal/stage progress, habit streaks, heatmaps, stats.

   Habit schedules (freq_type):
   - 'daily'    — every day is a scheduled day
   - 'weekdays' — Mon–Fri only; weekends never break streaks
                  and never count as misses
   - 'weekly3'  — 3 times per calendar week (Mon–Sun), any days;
                  streak/best are measured in WEEKS that hit the
                  target, a day is "missed" only when the weekly
                  target is no longer reachable without today
   Days before the habit was created never count against it.
   ============================================================ */

export const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
export const WEEKDAYS = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота']
export const WD_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

export const WINDOW_DAYS = 119 // 17 weeks
export const WEEK_TARGET = 3   // completions/week for 'weekly3'

// local YYYY-MM-DD (avoids UTC off-by-one from toISOString)
export function fmtDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function todayStr() {
  return fmtDate(new Date())
}
function startOfToday() {
  const d = new Date(); d.setHours(0, 0, 0, 0)
  return d
}
function parseDate(ds) {
  return new Date(ds + 'T00:00:00')
}

// Mon=0 … Sun=6
export function mondayIndex(d) {
  return (d.getDay() + 6) % 7
}
function isWorkday(d) {
  return mondayIndex(d) < 5
}
function weekStartOf(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - mondayIndex(x))
  return x
}
function countWeek(doneSet, weekStart) {
  let c = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i)
    if (doneSet.has(fmtDate(d))) c++
  }
  return c
}

// russian plural: plural(5, ['привычка','привычки','привычек'])
export function plural(n, [one, few, many]) {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

// human label for a goal due date ("до 1 декабря 2026")
export function formatDue(d) {
  if (!d) return 'без срока'
  const dt = parseDate(d)
  if (isNaN(dt)) return 'без срока'
  return `до ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

/* ---------------- habit derived ---------------- */

// 119-day window of levels (0 or 4), oldest → today
export function buildHeat(doneSet, days = WINDOW_DAYS) {
  const out = []
  const today = startOfToday()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    out.push(doneSet.has(fmtDate(d)) ? 4 : 0)
  }
  return out
}

// consecutive done days (scheduled days only) up to today;
// a not-yet-done today does not break it.
// 'weekly3' counts consecutive WEEKS that hit the target — the
// current week doesn't break the chain while it's still winnable.
export function calcStreak(doneSet, freqType = 'daily') {
  if (freqType === 'weekly3') {
    const cur = weekStartOf(new Date())
    let s = countWeek(doneSet, cur) >= WEEK_TARGET ? 1 : 0
    const d = new Date(cur)
    for (;;) {
      d.setDate(d.getDate() - 7)
      if (countWeek(doneSet, d) >= WEEK_TARGET) s++
      else break
    }
    return s
  }
  const sched = (x) => freqType !== 'weekdays' || isWorkday(x)
  const d = startOfToday()
  while (!sched(d)) d.setDate(d.getDate() - 1)
  if (!doneSet.has(fmtDate(d))) {
    do { d.setDate(d.getDate() - 1) } while (!sched(d))
  }
  let s = 0
  while (doneSet.has(fmtDate(d))) {
    s++
    do { d.setDate(d.getDate() - 1) } while (!sched(d))
  }
  return s
}

// longest run of consecutive scheduled done days (or weeks for 'weekly3')
export function calcBest(doneSet, freqType = 'daily') {
  if (!doneSet.size) return 0
  if (freqType === 'weekly3') {
    const dates = [...doneSet].sort()
    let ws = weekStartOf(parseDate(dates[0]))
    const end = weekStartOf(new Date())
    let best = 0, run = 0
    while (ws <= end) {
      if (countWeek(doneSet, ws) >= WEEK_TARGET) { run++; if (run > best) best = run }
      else run = 0
      ws = new Date(ws); ws.setDate(ws.getDate() + 7)
    }
    return best
  }
  // for 'weekdays' the chain runs over workdays; weekend marks are a bonus
  const next = (ds) => {
    const d = parseDate(ds)
    do { d.setDate(d.getDate() + 1) } while (freqType === 'weekdays' && !isWorkday(d))
    return fmtDate(d)
  }
  const dates = [...doneSet].sort()
    .filter(ds => freqType !== 'weekdays' || isWorkday(parseDate(ds)))
  let best = 0, run = 0, prev = null
  for (const ds of dates) {
    run = prev && next(prev) === ds ? run + 1 : 1
    if (run > best) best = run
    prev = ds
  }
  return best
}

// % of scheduled days completed within the window, counting only
// days since the habit was created
export function calcRate(doneSet, freqType = 'daily', createdAt = null, days = WINDOW_DAYS) {
  const today = startOfToday()
  const start = new Date(today); start.setDate(today.getDate() - (days - 1))
  if (createdAt) {
    const c = parseDate(createdAt)
    if (!isNaN(c) && c > start) start.setTime(c.getTime())
  }
  if (start > today) return 0
  let total = 0, sched = 0, done = 0
  for (const d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    total++
    const hit = doneSet.has(fmtDate(d))
    if (freqType === 'weekdays') {
      if (isWorkday(d)) { sched++; if (hit) done++ }
    } else if (hit) done++
  }
  if (freqType === 'weekly3') {
    const expected = Math.max(1, Math.round(total * WEEK_TARGET / 7))
    return Math.min(100, Math.round((done / expected) * 100))
  }
  if (freqType === 'weekdays') return sched ? Math.round((done / sched) * 100) : 0
  return total ? Math.round((done / total) * 100) : 0
}

// completions in the current calendar week (Mon..today)
export function weekDone(doneSet) {
  const ws = weekStartOf(new Date())
  let c = 0
  for (let i = 0; i <= mondayIndex(new Date()); i++) {
    const d = new Date(ws); d.setDate(ws.getDate() + i)
    if (doneSet.has(fmtDate(d))) c++
  }
  return c
}

// one place that derives everything the UI reads off a habit
export function deriveHabit(h, doneSet) {
  const heat = buildHeat(doneSet)
  return {
    ...h, doneSet, heat,
    doneToday: doneSet.has(todayStr()),
    weekDone: weekDone(doneSet),
    streak: calcStreak(doneSet, h.freqType),
    best: calcBest(doneSet, h.freqType),
    rate: calcRate(doneSet, h.freqType, h.createdAt),
  }
}

// 'дн.' for daily/weekdays streaks, 'нед.' for weekly3
export function streakUnit(h) {
  return h.freqType === 'weekly3' ? 'нед.' : 'дн.'
}
// comparable scale for picking "the best" across mixed units
export function streakDays(h) {
  return h.freqType === 'weekly3' ? h.streak * 7 : h.streak
}
export function bestDays(h) {
  return h.freqType === 'weekly3' ? h.best * 7 : h.best
}

// is the habit expected today at all?
export function dueToday(h) {
  if (h.doneToday) return true
  if (h.freqType === 'weekdays') return isWorkday(new Date())
  if (h.freqType === 'weekly3') return (h.weekDone || 0) < WEEK_TARGET
  return true
}

// why the habit is not expected today (null when it is)
export function offTodayLabel(h) {
  if (h.doneToday) return null
  if (h.freqType === 'weekdays' && !isWorkday(new Date())) return 'сегодня выходной'
  if (h.freqType === 'weekly3' && (h.weekDone || 0) >= WEEK_TARGET) return 'неделя закрыта'
  return null
}

// "missed" = a positive habit, scheduled today, not done and already
// overdue (past its reminder time, or no reminder set). Quit habits are
// never "missed". 'weekdays' habits are never missed on weekends.
// 'weekly3' is missed only when the weekly target needs today.
export function isMissed(h) {
  if (h.kind === 'quit' || h.doneToday) return false
  const now = new Date()
  const wd = mondayIndex(now)
  if (h.freqType === 'weekdays' && wd > 4) return false
  if (h.freqType === 'weekly3' && (WEEK_TARGET - (h.weekDone || 0)) <= 6 - wd) return false
  if (h.time && /^\d{1,2}:\d{2}$/.test(h.time)) {
    const [hh, mm] = h.time.split(':').map(Number)
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

// goal has a real date, it passed, and the goal is not finished
export function isOverdue(goal, pct) {
  return Boolean(goal.due) && goal.due < todayStr() && pct < 100
}

// short date for forecast chips: "20 июля" (+ year if not current)
function formatShort(d) {
  const y = d.getFullYear() === new Date().getFullYear() ? '' : ` ${d.getFullYear()}`
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${y}`
}

// pace forecast: steps done since the goal was created → projected finish.
// Returns null when there is nothing to forecast (no steps / done / no createdAt).
// { eta, etaLabel, onTrack: true|false|null, needPerWeek }
//   eta is null until the first step is done; needPerWeek is set when a due
//   date exists ("нужно ≈2 шага в неделю").
export function goalForecast(goal) {
  const p = goalProgress(goal)
  if (!p.total || p.pct === 100 || !goal.createdAt) return null
  const created = parseDate(goal.createdAt)
  if (isNaN(created)) return null
  const today = startOfToday()
  const remaining = p.total - p.done

  let needPerWeek = null
  if (goal.due && goal.due >= todayStr()) {
    const daysLeft = Math.max(1, Math.round((parseDate(goal.due) - today) / 86400000))
    needPerWeek = Math.max(1, Math.ceil(remaining / (daysLeft / 7)))
  }

  if (!p.done) return { eta: null, etaLabel: null, onTrack: null, needPerWeek }

  const elapsed = Math.max(1, Math.round((today - created) / 86400000) + 1)
  const perDay = p.done / elapsed
  const eta = new Date(today)
  eta.setDate(today.getDate() + Math.ceil(remaining / perDay))
  const onTrack = goal.due ? fmtDate(eta) <= goal.due : null
  return { eta, etaLabel: formatShort(eta), onTrack, needPerWeek }
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

// weekday breakdown (Mon..Sun) — % of that weekday completed, averaged
// across habits; skips days before creation and unscheduled weekends
export function weekdayBreakdown(habits, days = WINDOW_DAYS) {
  const today = startOfToday()
  const hit = [0, 0, 0, 0, 0, 0, 0], tot = [0, 0, 0, 0, 0, 0, 0]
  habits.forEach(h => {
    const created = h.createdAt ? parseDate(h.createdAt) : null
    const arr = h.heat.slice(-days)
    const n = arr.length
    arr.forEach((lvl, i) => {
      const date = new Date(today); date.setDate(today.getDate() - (n - 1 - i))
      if (created && date < created) return
      const wd = mondayIndex(date)
      if (h.freqType === 'weekdays' && wd > 4) return
      tot[wd]++; if (lvl > 0) hit[wd]++
    })
  })
  return WD_SHORT.map((label, i) => ({ label, pct: tot[i] ? Math.round((hit[i] / tot[i]) * 100) : 0 }))
}

// completion trend per CALENDAR week (Mon–Sun), oldest→newest; the
// current week is prorated to its elapsed days. Expected per week:
// daily 7, weekdays 5, weekly3 3 — clamped by the habit's creation date.
export function weeklyTrend(habits, weeks = 12) {
  const today = startOfToday()
  const curStart = weekStartOf(today)
  const out = []
  for (let w = weeks - 1; w >= 0; w--) {
    const ws = new Date(curStart); ws.setDate(curStart.getDate() - w * 7)
    const we = new Date(ws); we.setDate(ws.getDate() + 6)
    const last = we > today ? today : we
    let hit = 0, tot = 0
    habits.forEach(h => {
      const created = h.createdAt ? parseDate(h.createdAt) : null
      if (created && created > last) return
      const from = created && created > ws ? created : ws
      let daysIn = 0, sched = 0, done = 0
      for (const d = new Date(from); d <= last; d.setDate(d.getDate() + 1)) {
        daysIn++
        const ok = h.doneSet.has(fmtDate(d))
        if (h.freqType === 'weekdays') {
          if (isWorkday(d)) { sched++; if (ok) done++ }
        } else if (ok) done++
      }
      if (h.freqType === 'weekly3') {
        const expected = Math.min(WEEK_TARGET, daysIn)
        tot += expected; hit += Math.min(done, expected)
      } else if (h.freqType === 'weekdays') {
        tot += sched; hit += done
      } else {
        tot += daysIn; hit += done
      }
    })
    out.push(tot ? Math.round((hit / tot) * 100) : 0)
  }
  return out
}

// days where the majority of habits due that day were completed.
// weekly3 habits only count on days they were actually done.
export function productiveDays(habits, days = WINDOW_DAYS) {
  const today = startOfToday()
  let productive = 0
  for (let i = 0; i < days; i++) {
    const date = new Date(today); date.setDate(today.getDate() - (days - 1 - i))
    let due = 0, c = 0
    habits.forEach(h => {
      const created = h.createdAt ? parseDate(h.createdAt) : null
      if (created && date < created) return
      const hit = h.heat[i] > 0
      if (h.freqType === 'weekly3') { if (hit) { due++; c++ } return }
      if (h.freqType === 'weekdays' && !isWorkday(date)) return
      due++; if (hit) c++
    })
    if (due && c >= Math.ceil(due / 2)) productive++
  }
  return productive
}

/* ---------------- Eisenhower quadrants ---------------- */

export const QUADRANTS = [
  { id: 'do',       title: 'Сделать сейчас', hint: 'Срочно и важно',      urgent: true,  important: true },
  { id: 'plan',     title: 'Запланировать',  hint: 'Важно, не срочно',    urgent: false, important: true },
  { id: 'delegate', title: 'Делегировать',   hint: 'Срочно, не важно',    urgent: true,  important: false },
  { id: 'drop',     title: 'Убрать / потом', hint: 'Не срочно, не важно', urgent: false, important: false },
]
