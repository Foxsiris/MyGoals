/* ============================================================
   Dashboard
   ============================================================ */
import { Icon } from '../components/Icon'
import { Check, Ring, HabitBadge, Streak, SectionHead } from '../components/ui'
import { goalProgress, nextSteps, currentStage, isMissed, MONTHS, WEEKDAYS } from '../lib/metrics'

export function Dashboard({ store }) {
  const { goals, habits, toggleHabit, toggleStep, openGoal } = store

  const doneCount = habits.filter(h => h.doneToday).length
  const weekRate = habits.length ? Math.round(habits.reduce((a, h) => a + h.rate, 0) / habits.length) : 0
  const bestStreak = habits.length ? Math.max(...habits.map(h => h.streak)) : 0
  const bestStreakHabit = habits.reduce((a, h) => (h.streak > (a?.streak ?? -1) ? h : a), null)
  const steps = nextSteps(goals, 5)
  const goalsPct = goals.length ? Math.round(goals.reduce((a, g) => a + goalProgress(g).pct, 0) / goals.length) : 0

  const today = new Date()
  const dateStr = `${WEEKDAYS[today.getDay()]}, ${today.getDate()} ${MONTHS[today.getMonth()]}`
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
  const hour = today.getHours()
  const greet = hour < 5 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <div className="eyebrow">{cap(dateStr)}</div>
          <h1>{greet}, Даниил</h1>
          <p className="sub">{doneCount} из {habits.length} привычек уже отмечено. Маленькие шаги сегодня — большой результат потом.</p>
        </div>
      </div>

      {/* momentum tiles */}
      <div className="tiles">
        <StatTile color="habit" icon="flame" big={bestStreak} unit="дней" label="Лучшая серия"
          sub={bestStreakHabit ? bestStreakHabit.name : '—'} />
        <StatTile color="goal" icon="goal" ringPct={goalsPct}
          label="Прогресс по целям" sub={`${goals.length} активные цели`} />
        <StatTile color="habit" icon="sparkle" big={weekRate} unit="%" label="За период"
          sub="по всем привычкам" />
      </div>

      <div className="dash-cols">
        {/* Today's habits */}
        <section className="card" style={{ padding: 'var(--pad)' }}>
          <SectionHead icon="habit" color="habit" title="Привычки на сегодня"
            right={<span className="muted" style={{ fontWeight: 700, fontSize: 13 }}>{doneCount}/{habits.length}</span>} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
            {habits.map(h => {
              const missed = isMissed(h)
              const quit = h.kind === 'quit'
              return (
                <div key={h.id} className="row" style={{ gap: 13, padding: '9px 4px' }}>
                  <Check on={h.doneToday} color="habit" miss={missed} onClick={() => toggleHabit(h.id)} />
                  <HabitBadge icon={h.icon} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5, color: h.doneToday ? 'var(--faint)' : 'var(--ink)',
                      textDecorationLine: h.doneToday ? 'line-through' : 'none', textDecorationColor: 'var(--habit-soft)' }}>{h.name}</div>
                    <div className="tag-freq" style={missed ? { color: 'var(--miss-ink)', fontWeight: 700 } : {}}>
                      {missed ? 'пропущено · ' : ''}{h.time ? h.time + ' · ' : ''}{h.freq}
                    </div>
                  </div>
                  {quit
                    ? <span className="chip quit" style={{ fontSize: 12, whiteSpace: 'nowrap' }}><Icon name="flame" size={12} /> {h.streak} дн.</span>
                    : <Streak n={h.streak} color="habit" />}
                </div>
              )
            })}
            {habits.length === 0 && <div className="empty">Пока нет привычек. Добавь первую!</div>}
          </div>
        </section>

        {/* Next steps */}
        <section className="card" style={{ padding: 'var(--pad)' }}>
          <SectionHead icon="goal" color="goal" title="Ближайшие шаги к целям"
            right={<span className="muted" style={{ fontWeight: 700, fontSize: 13 }}>{steps.length}</span>} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {steps.map(({ goal, stage, step }) => (
              <div key={step.id} className="row" style={{ gap: 13, padding: '10px 4px' }}>
                <Check on={step.done} color="goal" onClick={() => toggleStep(goal.id, stage.id, step.id)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{step.name}</div>
                  <button className="chip goal" style={{ marginTop: 5, cursor: 'pointer' }} onClick={() => openGoal(goal.id)}>
                    <Icon name={goal.icon} size={12} /> {goal.name}
                  </button>
                </div>
              </div>
            ))}
            {steps.length === 0 && <div className="empty">Все ближайшие шаги выполнены 🎉</div>}
          </div>
        </section>
      </div>

      {/* Goals strip */}
      <section style={{ marginTop: 'var(--gap)' }}>
        <SectionHead icon="target" color="goal" title="Твои цели"
          right={<button className="btn ghost sm" onClick={() => store.setRoute('goals')}>Все цели <Icon name="arrowR" size={15} /></button>} />
        <div className="goals-strip">
          {goals.map(g => {
            const p = goalProgress(g)
            const st = currentStage(g)
            return (
              <button key={g.id} className="card" onClick={() => openGoal(g.id)}
                style={{ padding: 18, textAlign: 'left', display: 'flex', gap: 15, alignItems: 'center', cursor: 'pointer' }}>
                <Ring pct={p.pct} size={56} color="var(--goal)" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2, marginBottom: 5 }}>{g.name}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>Сейчас: {st ? st.name : '—'}</div>
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function StatTile({ icon, color, big, unit, ringPct, label, sub }) {
  return (
    <div className="card" style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
      {ringPct != null
        ? <Ring pct={ringPct} size={52} color={color === 'goal' ? 'var(--goal)' : 'var(--habit)'} />
        : <div style={{ width: 52, height: 52, borderRadius: 15, flex: 'none', display: 'grid', placeItems: 'center',
            background: color === 'goal' ? 'var(--goal-tint)' : 'var(--habit-tint)',
            color: color === 'goal' ? 'var(--goal)' : 'var(--habit-ink)' }}>
            <Icon name={icon} size={25} />
          </div>}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {big != null && <div className="stat-num" style={{ fontSize: 27, lineHeight: 1.05 }}>{big}<span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 3 }}>{unit}</span></div>}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
      </div>
    </div>
  )
}
