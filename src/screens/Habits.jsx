/* ============================================================
   Habits screen
   ============================================================ */
import { Icon } from '../components/Icon'
import { Check, Heatmap, HabitBadge } from '../components/ui'
import { isMissed } from '../lib/metrics'

export function Habits({ store }) {
  const { habits, goals, toggleHabit, openForm } = store

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ color: 'var(--habit-ink)' }}>ПРИВЫЧКИ</div>
          <h1>Регулярность</h1>
          <p className="sub">Короткие повторяющиеся действия, которые питают твои цели. Отмечай выполнение и держи серию.</p>
        </div>
        <button className="btn habit head-add" onClick={() => openForm('habit')}>
          <Icon name="plus" size={17} /> Новая привычка
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
        {habits.map(h => (
          <HabitCard key={h.id} h={h} goals={goals} onToggle={() => toggleHabit(h.id)}
            onOpenGoal={store.openGoal} onEdit={() => openForm('habit', h.id)} />
        ))}
        {habits.length === 0 && (
          <div className="card empty" style={{ padding: 40 }}>Пока нет привычек. Нажми «Новая привычка», чтобы начать.</div>
        )}
      </div>
    </div>
  )
}

function HabitCard({ h, goals, onToggle, onOpenGoal, onEdit }) {
  const linked = goals.filter(g => h.goals.includes(g.id))
  const quit = h.kind === 'quit'
  const missed = isMissed(h)
  return (
    <div className="card habit-card" style={{ padding: 'var(--pad)' }}>
      <div className="habit-row">
        <Check on={h.doneToday} color="habit" size="lg" miss={missed} onClick={onToggle} />
        <HabitBadge icon={h.icon} size={46} />
        <div className="habit-meta">
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 18 }}>{h.name}</h3>
            <span className={`chip ${missed ? 'miss' : ''}`} style={{ padding: '3px 10px', fontSize: 12 }}>{h.time ? h.time + ' · ' : ''}{h.freq}</span>
            {quit && <span className="chip quit" style={{ padding: '3px 10px', fontSize: 12 }}><Icon name="arrowDownCircle" size={12} /> Отказ</span>}
            {missed && <span className="chip miss" style={{ padding: '3px 10px', fontSize: 12 }}><Icon name="alert" size={12} /> пропущено</span>}
            <button className="btn ghost sm" style={{ padding: 6, marginLeft: 'auto' }} onClick={onEdit} aria-label="Изменить привычку">
              <Icon name="edit" size={16} />
            </button>
          </div>
          {linked.length > 0 && (
            <div className="row" style={{ gap: 7, marginTop: 9, flexWrap: 'wrap' }}>
              <span className="muted" style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon name="link" size={13} /> питает:</span>
              {linked.map(g => (
                <button key={g.id} className="chip goal" style={{ cursor: 'pointer', fontSize: 12 }} onClick={() => onOpenGoal(g.id)}>
                  <Icon name={g.icon} size={12} /> {g.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="habit-metrics">
          <Metric value={h.streak} label={quit ? 'дней без срыва' : 'серия'} icon="flame" />
          <Metric value={h.best} label="рекорд" />
          <Metric value={h.rate + '%'} label="за период" />
        </div>
      </div>

      <div style={{ marginTop: 18, overflowX: 'auto', paddingBottom: 4 }}>
        <Heatmap data={h.heat} weeks={17} />
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
          <span className="muted" style={{ fontSize: 11.5 }}>17 недель назад</span>
          <div className="row" style={{ gap: 6 }}>
            <span className="muted" style={{ fontSize: 11.5 }}>меньше</span>
            <div className="heat" style={{ gridTemplateRows: '1fr', gridAutoFlow: 'column', gap: 4 }}>
              {[0, 1, 2, 3, 4].map(l => <div key={l} className={`cell ${l ? 'l' + l : ''}`} />)}
            </div>
            <span className="muted" style={{ fontSize: 11.5 }}>больше</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ value, label, icon }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="stat-num" style={{ fontSize: 22, lineHeight: 1, color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {icon && <span style={{ color: 'var(--habit)' }}><Icon name={icon} size={16} /></span>}{value}
      </div>
      <div className="muted" style={{ fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  )
}
