/* ============================================================
   Create / edit forms
   ============================================================ */
import { useState } from 'react'
import { Icon } from './Icon'
import { Modal } from './ui'

const GOAL_ICONS = ['sparkle', 'bolt', 'trophy', 'target', 'book', 'leaf', 'sun', 'flame']
const HABIT_ICONS = ['run', 'brain', 'code', 'leaf', 'book', 'dumbbell', 'water', 'sun', 'pen', 'note']

export function FormModal({ store }) {
  const { form } = store
  if (!form) return null
  return form.type === 'goal'
    ? <GoalForm store={store} editId={form.editId} />
    : <HabitForm store={store} editId={form.editId} />
}

/* ---------------- Goal form ---------------- */
function GoalForm({ store, editId }) {
  const existing = editId ? store.goals.find(g => g.id === editId) : null
  const [name, setName] = useState(existing?.name || '')
  const [why, setWhy] = useState(existing?.why || '')
  const [due, setDue] = useState(existing?.due || '')
  const [icon, setIcon] = useState(existing?.icon || 'sparkle')
  const [stages, setStages] = useState(existing ? existing.stages.map(s => s.name) : ['', ''])
  const [err, setErr] = useState(false)

  const setStage = (i, v) => setStages(s => s.map((x, j) => (j === i ? v : x)))
  const addStage = () => setStages(s => [...s, ''])
  const rmStage = (i) => setStages(s => s.filter((_, j) => j !== i))

  const save = () => {
    if (!name.trim()) { setErr(true); return }
    store.saveGoal({ editId, name: name.trim(), why: why.trim(), due, icon, stageNames: stages.map(s => s.trim()).filter(Boolean) })
  }

  return (
    <Modal onClose={store.closeForm}>
      <div className="sheet-head">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 11 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'var(--goal-tint)', color: 'var(--goal)' }}>
              <Icon name={icon} size={21} />
            </div>
            <h2 style={{ fontSize: 21 }}>{editId ? 'Изменить цель' : 'Новая цель'}</h2>
          </div>
          <button className="btn ghost sm" onClick={store.closeForm}><Icon name="x" size={18} /></button>
        </div>
      </div>
      <div className="sheet-body">
        <div className="field">
          <label>Название цели</label>
          <input type="text" value={name} autoFocus placeholder="Например: выучить испанский до B2"
            onChange={e => { setName(e.target.value); setErr(false) }}
            style={err ? { borderColor: 'var(--goal)' } : {}} />
          {err && <div className="hint" style={{ color: 'var(--goal)' }}>Дай цели название</div>}
        </div>

        <div className="field">
          <label>Зачем тебе это? <span className="muted" style={{ fontWeight: 500 }}>— твоя мотивация</span></label>
          <textarea value={why} placeholder="Это вернёт тебя к цели в трудный день…" onChange={e => setWhy(e.target.value)} />
        </div>

        <div className="grid-2">
          <div className="field">
            <label>Желаемая дата</label>
            <input type="date" value={due || ''} onChange={e => setDue(e.target.value)} />
          </div>
          <div className="field">
            <label>Иконка</label>
            <div className="swatches">
              {GOAL_ICONS.map(ic => (
                <button key={ic} className="swatch" onClick={() => setIcon(ic)}
                  style={{ background: icon === ic ? 'var(--goal)' : 'var(--goal-tint)', color: icon === ic ? '#fff' : 'var(--goal)',
                    border: icon === ic ? '2px solid var(--goal-strong)' : '2px solid transparent' }}>
                  <Icon name={ic} size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="field">
          <label>Этапы <span className="muted" style={{ fontWeight: 500 }}>— разбей путь на крупные блоки. Шаги добавишь на дорожной карте.</span></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {stages.map((s, i) => (
              <div key={i} className="row" style={{ gap: 10 }}>
                <div className="stage-num" style={{ background: 'var(--goal-tint)', color: 'var(--goal-ink)' }}>{i + 1}</div>
                <input type="text" value={s} placeholder={`Этап ${i + 1}`} onChange={e => setStage(i, e.target.value)}
                  style={{ flex: 1, padding: '10px 13px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', fontSize: 14, outline: 'none' }} />
                {stages.length > 1 && (
                  <button className="btn ghost sm" style={{ padding: 8 }} onClick={() => rmStage(i)}><Icon name="x" size={16} /></button>
                )}
              </div>
            ))}
            <button className="add-step" style={{ marginTop: 2 }} onClick={addStage}><Icon name="plus" size={15} /> Добавить этап</button>
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <button className="btn ghost" onClick={store.closeForm}>Отмена</button>
          <button className="btn primary" onClick={save}>{editId ? 'Сохранить' : 'Создать цель'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ---------------- Habit form ---------------- */
function HabitForm({ store, editId }) {
  const existing = editId ? store.habits.find(h => h.id === editId) : null
  const [name, setName] = useState(existing?.name || '')
  const [icon, setIcon] = useState(existing?.icon || 'leaf')
  const [freq, setFreq] = useState(existing?.freqType || 'daily')
  const [time, setTime] = useState(existing?.time || '')
  const [goalLinks, setGoalLinks] = useState(existing?.goals || [])
  const [err, setErr] = useState(false)

  const freqs = [
    { k: 'daily', label: 'Ежедневно' },
    { k: 'weekdays', label: 'По будням' },
    { k: 'weekly3', label: '3 раза в неделю' },
  ]
  const toggleLink = (id) => setGoalLinks(l => (l.includes(id) ? l.filter(x => x !== id) : [...l, id]))

  const save = () => {
    if (!name.trim()) { setErr(true); return }
    store.saveHabit({ editId, name: name.trim(), icon, freqType: freq,
      freq: freqs.find(f => f.k === freq).label, time: time || null, goals: goalLinks })
  }

  return (
    <Modal onClose={store.closeForm}>
      <div className="sheet-head">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 11 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'var(--habit-tint)', color: 'var(--habit-ink)' }}>
              <Icon name={icon} size={21} />
            </div>
            <h2 style={{ fontSize: 21 }}>{editId ? 'Изменить привычку' : 'Новая привычка'}</h2>
          </div>
          <button className="btn ghost sm" onClick={store.closeForm}><Icon name="x" size={18} /></button>
        </div>
      </div>
      <div className="sheet-body">
        <div className="field">
          <label>Название</label>
          <input type="text" value={name} autoFocus placeholder="Например: медитация 10 минут"
            onChange={e => { setName(e.target.value); setErr(false) }}
            style={err ? { borderColor: 'var(--habit)' } : {}} />
          {err && <div className="hint" style={{ color: 'var(--habit-ink)' }}>Дай привычке название</div>}
        </div>

        <div className="field">
          <label>Иконка</label>
          <div className="swatches">
            {HABIT_ICONS.map(ic => (
              <button key={ic} className="swatch" onClick={() => setIcon(ic)}
                style={{ background: icon === ic ? 'var(--habit)' : 'var(--habit-tint)', color: icon === ic ? '#fff' : 'var(--habit-ink)',
                  border: icon === ic ? '2px solid var(--habit-strong)' : '2px solid transparent' }}>
                <Icon name={ic} size={18} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label>Частота</label>
            <div className="seg" style={{ flexWrap: 'wrap' }}>
              {freqs.map(f => (
                <button key={f.k} className={freq === f.k ? 'on' : ''} onClick={() => setFreq(f.k)}>{f.label}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Напоминание <span className="muted" style={{ fontWeight: 500 }}>(необязательно)</span></label>
            <input type="text" value={time} placeholder="08:00" onChange={e => setTime(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Привязать к целям <span className="muted" style={{ fontWeight: 500 }}>— покажет, какую цель питает привычка</span></label>
          <div className="row" style={{ gap: 9, flexWrap: 'wrap' }}>
            {store.goals.map(g => {
              const on = goalLinks.includes(g.id)
              return (
                <button key={g.id} onClick={() => toggleLink(g.id)}
                  className={`chip ${on ? 'goal' : ''}`} style={{ cursor: 'pointer', borderStyle: on ? 'solid' : 'dashed' }}>
                  <Icon name={g.icon} size={13} /> {g.name}
                  {on && <Icon name="check" size={13} stroke={3} />}
                </button>
              )
            })}
            {store.goals.length === 0 && <span className="muted" style={{ fontSize: 13 }}>Сначала создай цель, чтобы привязать к ней привычку.</span>}
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <button className="btn ghost" onClick={store.closeForm}>Отмена</button>
          <button className="btn habit" onClick={save}>{editId ? 'Сохранить' : 'Создать привычку'}</button>
        </div>
      </div>
    </Modal>
  )
}
