/* ============================================================
   Goals list
   ============================================================ */
import { Icon } from '../components/Icon'
import { Bar } from '../components/ui'
import { goalProgress, currentStage, stageProgress, isOverdue, plural } from '../lib/metrics'

export function Goals({ store }) {
  const { goals, habits, openGoal, openForm } = store

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ color: 'var(--goal)' }}>ЦЕЛИ</div>
          <h1>Направление</h1>
          <p className="sub">Большие результаты, разбитые на этапы и шаги. Прогресс считается автоматически по выполненным шагам.</p>
        </div>
        <button className="btn primary head-add" onClick={() => openForm('goal')}>
          <Icon name="plus" size={17} /> Новая цель
        </button>
      </div>

      <div className="goals-grid">
        {goals.map(g => {
          const p = goalProgress(g)
          const cur = currentStage(g)
          const linked = habits.filter(h => g.habits.includes(h.id))
          const overdue = isOverdue(g, p.pct)
          return (
            <button key={g.id} className="card" onClick={() => openGoal(g.id)}
              style={{ padding: 'var(--pad)', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, flex: 'none', display: 'grid', placeItems: 'center',
                  background: 'var(--goal-tint)', color: 'var(--goal)' }}>
                  <Icon name={g.icon} size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 18, lineHeight: 1.15 }}>{g.name}</h3>
                  <div className={overdue ? 'row' : 'muted row'}
                    style={{ fontSize: 12.5, gap: 5, marginTop: 5, ...(overdue ? { color: 'var(--miss-ink)', fontWeight: 700 } : {}) }}>
                    <Icon name={overdue ? 'alert' : 'calendar'} size={13} /> {g.dueLabel}{overdue ? ' · просрочено' : ''}
                  </div>
                </div>
                <span className="stat-num" style={{ fontSize: 26, color: 'var(--goal)' }}>{p.pct}%</span>
              </div>

              <Bar pct={p.pct} color="goal" />

              {/* stage pips */}
              <div className="row" style={{ gap: 7 }}>
                {g.stages.map(st => {
                  const sp = stageProgress(st)
                  return (
                    <div key={st.id} style={{ flex: 1 }} title={st.name}>
                      <div style={{ height: 5, borderRadius: 3, background: sp.pct === 100 ? 'var(--goal)' : sp.pct > 0 ? 'var(--goal-soft)' : 'oklch(0.93 0.008 75)' }} />
                    </div>
                  )
                })}
              </div>

              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="muted" style={{ fontSize: 13 }}>
                  {cur ? <>Этап {g.stages.indexOf(cur) + 1} из {p.stagesTotal} · <b style={{ color: 'var(--ink-soft)' }}>{cur.name}</b></> : 'Без этапов'}
                </div>
                {linked.length > 0 && (
                  <span className="chip habit" style={{ fontSize: 12 }}>
                    <Icon name="link" size={12} /> {linked.length} {plural(linked.length, ['привычка', 'привычки', 'привычек'])}
                  </span>
                )}
              </div>
            </button>
          )
        })}

        {/* add card */}
        <button onClick={() => openForm('goal')} style={{
          border: '1.5px dashed var(--border)', borderRadius: 'var(--r-lg)', background: 'transparent',
          padding: 'var(--pad)', minHeight: 180, display: 'grid', placeItems: 'center', color: 'var(--muted)',
          cursor: 'pointer', fontWeight: 600, gap: 10, transition: 'border-color 0.16s, color 0.16s, background 0.16s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--goal)'; e.currentTarget.style.color = 'var(--goal)'; e.currentTarget.style.background = 'var(--goal-tint)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent' }}>
          <div style={{ display: 'grid', justifyItems: 'center', gap: 8 }}>
            <Icon name="plus" size={26} />
            <span>Поставить новую цель</span>
          </div>
        </button>
      </div>
    </div>
  )
}
