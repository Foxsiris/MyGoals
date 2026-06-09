/* ============================================================
   Goal detail — decomposition roadmap (HERO screen)
   ============================================================ */
import { Fragment, useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { Check, Ring, Bar, Streak } from '../components/ui'
import { goalProgress, stageProgress, currentStage, isOverdue, streakUnit, goalForecast, plural } from '../lib/metrics'

export function GoalDetail({ store }) {
  const { goals, habits, selectedGoal, toggleHabit, setRoute, openForm } = store
  const g = goals.find(x => x.id === selectedGoal)
  if (!g) {
    return (
      <div className="fade-in">
        <div className="card empty" style={{ padding: 48 }}>
          Цель не найдена — возможно, она была удалена.
          <div style={{ marginTop: 18 }}>
            <button className="btn" onClick={() => setRoute('goals')}>
              <Icon name="chevronL" size={16} /> К списку целей
            </button>
          </div>
        </div>
      </div>
    )
  }
  const p = goalProgress(g)
  const cur = currentStage(g)
  const linked = habits.filter(h => g.habits.includes(h.id))
  const overdue = isOverdue(g, p.pct)
  const fc = goalForecast(g)

  return (
    <div className="fade-in">
      {/* breadcrumb */}
      <button className="btn ghost sm" style={{ marginBottom: 18, paddingLeft: 8 }} onClick={() => setRoute('goals')}>
        <Icon name="chevronL" size={16} /> Все цели
      </button>

      {/* hero header */}
      <div className="card" style={{ padding: 28, marginBottom: 26, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--goal-tint), transparent 70%)' }} />
        <div className="row gd-hero-row" style={{ gap: 26, alignItems: 'flex-start', position: 'relative' }}>
          <Ring pct={p.pct} size={104} stroke={9} color="var(--goal)">
            <span className="stat-num" style={{ fontSize: 30, lineHeight: 1, color: 'var(--goal)' }}>{p.pct}<span style={{ fontSize: 16 }}>%</span></span>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>готово</span>
          </Ring>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ gap: 11 }}>
              <div style={{ width: 34, height: 34, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'var(--goal-tint)', color: 'var(--goal)', flex: 'none' }}>
                <Icon name={g.icon} size={20} />
              </div>
              <h1 style={{ fontSize: 28, lineHeight: 1.05 }}>{g.name}</h1>
            </div>
            {g.why && (
              <p style={{ margin: '14px 0 0', color: 'var(--ink-soft)', fontSize: 15, maxWidth: '54ch', lineHeight: 1.55 }}>
                <span style={{ color: 'var(--goal)', fontWeight: 700 }}>Зачем: </span>{g.why}</p>
            )}
            <div className="row" style={{ gap: 18, marginTop: 18, flexWrap: 'wrap' }}>
              <span className={`chip ${overdue ? 'miss' : ''}`}>
                <Icon name={overdue ? 'alert' : 'calendar'} size={14} /> {g.dueLabel}{overdue ? ' · просрочено' : ''}
              </span>
              {cur && <span className="chip"><Icon name="target" size={14} /> Этап {g.stages.indexOf(cur) + 1} из {p.stagesTotal}</span>}
              <span className="chip"><Icon name="check" size={14} /> {p.done} из {p.total} шагов</span>
              {fc && fc.eta && (
                <span className={`chip ${fc.onTrack === false ? 'miss' : 'goal'}`}>
                  <Icon name="trend" size={14} /> при таком темпе — к {fc.etaLabel}{fc.onTrack === false ? ' · позже срока' : fc.onTrack ? ' · успеваешь' : ''}
                </span>
              )}
              {fc && !fc.eta && fc.needPerWeek != null && (
                <span className="chip goal">
                  <Icon name="trend" size={14} /> нужно ≈{fc.needPerWeek} {plural(fc.needPerWeek, ['шаг', 'шага', 'шагов'])} в неделю
                </span>
              )}
            </div>
          </div>
          <button className="btn sm gd-edit" onClick={() => openForm('goal', g.id)}><Icon name="edit" size={15} /> Изменить</button>
        </div>

        {/* linked habits feeding this goal */}
        {linked.length > 0 && (
          <div style={{ marginTop: 24, paddingTop: 22, borderTop: '1px solid var(--border-2)' }}>
            <div className="row" style={{ gap: 8, marginBottom: 14 }}>
              <span style={{ color: 'var(--habit-ink)' }}><Icon name="link" size={17} /></span>
              <h3 style={{ fontSize: 15, whiteSpace: 'nowrap' }}>Привычки, которые питают эту цель</h3>
            </div>
            <div className="linked-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(linked.length, 3)}, 1fr)`, gap: 12 }}>
              {linked.map(h => (
                <div key={h.id} className="row" style={{ gap: 12, padding: '12px 14px', borderRadius: 'var(--r)', background: 'var(--habit-tint)', border: '1px solid var(--habit-soft)' }}>
                  <Check on={h.doneToday} color="habit" onClick={() => toggleHabit(h.id)} label={`Отметить «${h.name}»`} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{h.name}</div>
                    <div className="row" style={{ gap: 8, marginTop: 3 }}>
                      <Streak n={`${h.streak} ${streakUnit(h)}`} color="habit" />
                      <span className="muted" style={{ fontSize: 11.5 }}>· {h.rate}% за период</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* roadmap header */}
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="row" style={{ gap: 10, minWidth: 0 }}>
          <span style={{ color: 'var(--goal)', flex: 'none' }}><Icon name="bolt" size={20} /></span>
          <h2 style={{ fontSize: 21, whiteSpace: 'nowrap' }}>Дорожная карта</h2>
          <span className="muted" style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>Цель → этапы → шаги</span>
        </div>
        <button className="btn sm" onClick={() => store.addStage(g.id)}><Icon name="plus" size={15} /> Этап</button>
      </div>

      {/* roadmap board */}
      <div className="roadmap">
        {g.stages.map((st, i) => (
          <Fragment key={st.id}>
            <StageColumn goal={g} stage={st} index={i} store={store} />
            {i < g.stages.length - 1 && (
              <div className="stage-link"><Icon name="chevronR" size={22} /></div>
            )}
          </Fragment>
        ))}
      </div>

      {/* reflection note */}
      {g.note && (
        <div className="card" style={{ padding: 'var(--pad)', marginTop: 26, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, flex: 'none', display: 'grid', placeItems: 'center', background: 'var(--goal-tint)', color: 'var(--goal)' }}>
            <Icon name="note" size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 15, marginBottom: 6 }}>Заметка для себя</h3>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.6, fontStyle: 'italic' }}>«{g.note}»</p>
          </div>
        </div>
      )}
    </div>
  )
}

function StepRow({ goal, stage, step, store }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(step.name)
  const ref = useRef(null)
  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select() } }, [editing])

  const commit = () => {
    const v = text.trim()
    if (v && v !== step.name) store.renameStep(goal.id, stage.id, step.id, v)
    else setText(step.name)
    setEditing(false)
  }

  return (
    <div className={`step ${step.done ? 'done' : ''}`}>
      <Check on={step.done} color="goal" onClick={() => store.toggleStep(goal.id, stage.id, step.id)} />
      <div className="step-body">
        {editing ? (
          <input ref={ref} className="step-rename" value={text}
            onChange={e => setText(e.target.value)} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setText(step.name); setEditing(false) } }} />
        ) : (
          <div className="step-title editable" onClick={() => { setText(step.name); setEditing(true) }} title="Нажми, чтобы изменить">{step.name}</div>
        )}
      </div>
      <button className="step-del" onClick={() => store.removeStep(goal.id, stage.id, step.id)} aria-label="Удалить шаг">
        <Icon name="x" size={14} />
      </button>
    </div>
  )
}

function StageColumn({ goal, stage, index, store }) {
  const sp = stageProgress(stage)
  const done = sp.pct === 100
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { if (adding && inputRef.current) inputRef.current.focus() }, [adding])

  const submit = () => {
    if (text.trim()) { store.addStep(goal.id, stage.id, text.trim()); setText('') }
    setAdding(false)
  }

  return (
    <div className={`stage-col ${done ? 'done' : ''}`}>
      <div className="stage-head">
        <div className="row">
          <div className="stage-num">{done ? <Icon name="check" size={14} stroke={3} /> : index + 1}</div>
          <h3 style={{ flex: 1 }}>{stage.name}</h3>
        </div>
        <div className="stage-meta">
          <Bar pct={sp.pct} color="goal" />
          <span style={{ flex: 'none', minWidth: 38, textAlign: 'right' }}>{sp.done}/{sp.total}</span>
        </div>
        <div className="stage-meta" style={{ marginTop: 7 }}>
          <span className="row" style={{ gap: 4 }}><Icon name="calendar" size={12} /> {stage.due}</span>
        </div>
      </div>
      <div className="stage-steps">
        {stage.steps.map(s => (
          <StepRow key={s.id} goal={goal} stage={stage} step={s} store={store} />
        ))}

        {adding ? (
          <div className="step" style={{ alignItems: 'center' }}>
            <div className="check" style={{ opacity: 0.4 }} />
            <input ref={inputRef} className="step-input" value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setText(''); setAdding(false) } }}
              onBlur={submit}
              placeholder="Новый шаг…"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }} />
          </div>
        ) : (
          <button className="add-step" onClick={() => setAdding(true)}>
            <Icon name="plus" size={15} /> Добавить шаг
          </button>
        )}
      </div>
    </div>
  )
}
