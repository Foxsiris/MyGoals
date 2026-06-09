/* ============================================================
   Supabase data layer — load + transform into UI shapes, and
   granular CRUD wrappers used by the store.
   ============================================================ */
import { supabase } from './supabase'
import {
  buildHeat, calcStreak, calcBest, calcRate, todayStr, formatDue, fmtDate,
} from './metrics'

/* ---------------- load + transform ---------------- */

export async function loadAll() {
  // habit logs: a generous window so streak/best/heatmap are accurate
  const since = new Date(); since.setDate(since.getDate() - 200)
  const sinceStr = fmtDate(since)

  const [goalsR, stagesR, stepsR, habitsR, linksR, logsR, matrixR] = await Promise.all([
    supabase.from('goals').select('*').order('position'),
    supabase.from('stages').select('*').order('position'),
    supabase.from('steps').select('*').order('position'),
    supabase.from('habits').select('*').order('position'),
    supabase.from('habit_goals').select('*'),
    supabase.from('habit_logs').select('habit_id, log_date, done').gte('log_date', sinceStr),
    supabase.from('matrix_tasks').select('*').order('position'),
  ])

  const firstErr = [goalsR, stagesR, stepsR, habitsR, linksR, logsR, matrixR].find(r => r.error)
  if (firstErr) throw firstErr.error

  const goalsRows = goalsR.data, stagesRows = stagesR.data, stepsRows = stepsR.data
  const habitsRows = habitsR.data, links = linksR.data, logs = logsR.data, matrixRows = matrixR.data

  // link maps
  const goalsByHabit = {}, habitsByGoal = {}
  links.forEach(l => {
    (goalsByHabit[l.habit_id] ??= []).push(l.goal_id)
    ;(habitsByGoal[l.goal_id] ??= []).push(l.habit_id)
  })

  // steps grouped by stage, stages grouped by goal
  const stepsByStage = {}
  stepsRows.forEach(s => { (stepsByStage[s.stage_id] ??= []).push({ id: s.id, name: s.name, done: s.done }) })
  const stagesByGoal = {}
  stagesRows.forEach(st => {
    (stagesByGoal[st.goal_id] ??= []).push({
      id: st.id, name: st.name, due: st.due, steps: stepsByStage[st.id] || [],
    })
  })

  const goals = goalsRows.map(g => ({
    id: g.id, name: g.name, icon: g.icon, why: g.why,
    due: g.due, dueLabel: g.due_label || formatDue(g.due), note: g.note,
    stages: stagesByGoal[g.id] || [],
    habits: habitsByGoal[g.id] || [],
  }))

  // habit logs → done-date sets
  const doneByHabit = {}
  logs.forEach(l => { if (l.done) (doneByHabit[l.habit_id] ??= new Set()).add(l.log_date) })

  const today = todayStr()
  const habits = habitsRows.map(h => {
    const doneSet = doneByHabit[h.id] || new Set()
    const heat = buildHeat(doneSet)
    return {
      id: h.id, name: h.name, icon: h.icon, color: h.color || 'habit',
      freq: h.freq, freqType: h.freq_type, time: h.time, kind: h.kind || 'build',
      goals: goalsByHabit[h.id] || [],
      doneSet, heat,
      doneToday: doneSet.has(today),
      streak: calcStreak(doneSet), best: calcBest(doneSet), rate: calcRate(heat),
    }
  })

  const matrixTasks = matrixRows.map(t => ({
    id: t.id, name: t.name, tag: t.tag, accent: t.accent, quadrant: t.quadrant,
  }))

  return { goals, habits, matrixTasks }
}

/* ---------------- habits ---------------- */

export async function setHabitToday(habitId, on) {
  const date = todayStr()
  if (on) {
    return supabase.from('habit_logs').upsert(
      { habit_id: habitId, log_date: date, done: true },
      { onConflict: 'habit_id,log_date' },
    )
  }
  return supabase.from('habit_logs').delete().match({ habit_id: habitId, log_date: date })
}

export async function insertHabit(fields, position) {
  const { data, error } = await supabase.from('habits').insert({
    name: fields.name, icon: fields.icon, color: 'habit',
    freq: fields.freq, freq_type: fields.freqType, time: fields.time,
    kind: fields.kind || 'build', position,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateHabit(id, fields) {
  return supabase.from('habits').update({
    name: fields.name, icon: fields.icon,
    freq: fields.freq, freq_type: fields.freqType, time: fields.time,
    kind: fields.kind || 'build',
  }).eq('id', id)
}

export async function deleteHabit(id) {
  return supabase.from('habits').delete().eq('id', id)
}

export async function setHabitGoals(habitId, goalIds) {
  await supabase.from('habit_goals').delete().eq('habit_id', habitId)
  if (goalIds.length) {
    await supabase.from('habit_goals').insert(goalIds.map(goal_id => ({ habit_id: habitId, goal_id })))
  }
}

/* ---------------- steps / stages ---------------- */

export async function setStepDone(stepId, done) {
  return supabase.from('steps').update({ done }).eq('id', stepId)
}

export async function insertStep(stageId, name, position) {
  const { data, error } = await supabase.from('steps')
    .insert({ stage_id: stageId, name, done: false, position }).select().single()
  if (error) throw error
  return data
}

export async function renameStep(id, name) {
  return supabase.from('steps').update({ name }).eq('id', id)
}

export async function deleteStep(id) {
  return supabase.from('steps').delete().eq('id', id)
}

export async function insertStage(goalId, name, due, position) {
  const { data, error } = await supabase.from('stages')
    .insert({ goal_id: goalId, name, due, position }).select().single()
  if (error) throw error
  return data
}

export async function updateStage(id, fields) {
  return supabase.from('stages').update(fields).eq('id', id)
}

export async function deleteStages(ids) {
  if (ids.length) return supabase.from('stages').delete().in('id', ids)
}

/* ---------------- goals ---------------- */

export async function insertGoal(fields, position) {
  const { data, error } = await supabase.from('goals').insert({
    name: fields.name, icon: fields.icon, why: fields.why,
    due: fields.due || null, due_label: fields.dueLabel, note: fields.note, position,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateGoal(id, fields) {
  return supabase.from('goals').update({
    name: fields.name, icon: fields.icon, why: fields.why,
    due: fields.due || null, due_label: fields.dueLabel,
  }).eq('id', id)
}

export async function deleteGoal(id) {
  return supabase.from('goals').delete().eq('id', id)
}

/* ---------------- matrix ---------------- */

export async function insertMatrixTask(fields, position) {
  const { data, error } = await supabase.from('matrix_tasks').insert({
    name: fields.name, tag: fields.tag, accent: fields.accent, quadrant: fields.quadrant, position,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateMatrixTask(id, fields) {
  return supabase.from('matrix_tasks').update(fields).eq('id', id)
}

export async function deleteMatrixTask(id) {
  return supabase.from('matrix_tasks').delete().eq('id', id)
}
