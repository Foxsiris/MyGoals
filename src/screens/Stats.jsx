/* ============================================================
   Habit statistics — broad analytics
   ============================================================ */
import { Icon } from '../components/Icon'
import { Bar, HabitBadge } from '../components/ui'
import { totalCompletions, weekdayBreakdown, weeklyTrend, WINDOW_DAYS } from '../lib/metrics'

export function Stats({ store }) {
  const { habits } = store

  if (habits.length === 0) {
    return (
      <div className="fade-in">
        <div className="page-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--habit-ink)' }}>СТАТИСТИКА</div>
            <h1>Аналитика привычек</h1>
          </div>
        </div>
        <div className="card empty" style={{ padding: 48 }}>Добавь привычки — здесь появится статистика выполнения.</div>
      </div>
    )
  }

  const total = totalCompletions(habits)
  const avgRate = Math.round(habits.reduce((a, h) => a + h.rate, 0) / habits.length)
  const bestStreak = Math.max(...habits.map(h => h.best))
  const curBest = habits.reduce((a, h) => (h.streak > a.streak ? h : a), habits[0])
  const trend = weeklyTrend(habits, 12)
  const wd = weekdayBreakdown(habits)
  const ranked = [...habits].sort((a, b) => b.rate - a.rate)
  const top = ranked[0], weak = ranked[ranked.length - 1]
  const trendDelta = trend[trend.length - 1] - trend[trend.length - 2]

  // productive days = days where a majority of habits were completed
  const days = WINDOW_DAYS
  const need = Math.ceil(habits.length / 2)
  let productive = 0
  for (let i = 0; i < days; i++) {
    let c = 0
    habits.forEach(h => { const arr = h.heat.slice(-days); if (arr[i] > 0) c++ })
    if (c >= need) productive++
  }

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ color: 'var(--habit-ink)' }}>СТАТИСТИКА</div>
          <h1>Аналитика привычек</h1>
          <p className="sub">Широкая картина регулярности: серии, проценты выполнения, динамика по неделям и сильные дни.</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="stat-kpis">
        <Kpi icon="check" value={total} label="всего выполнений" sub="за 17 недель" />
        <Kpi icon="calendar" value={productive} label="продуктивных дней" sub="бо́льшая часть привычек" />
        <Kpi icon="trend" value={avgRate + '%'} label="средний процент" sub="по всем привычкам" />
        <Kpi icon="flame" value={bestStreak} label="рекорд серии" sub={`сейчас: ${curBest.name}`} accent />
      </div>

      <div className="stat-cols">
        {/* weekly trend */}
        <section className="card" style={{ padding: 'var(--pad)' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
            <div className="row" style={{ gap: 10 }}>
              <span style={{ color: 'var(--habit-ink)' }}><Icon name="trend" size={19} /></span>
              <h3 style={{ fontSize: 16.5 }}>Динамика по неделям</h3>
            </div>
            <span className={`chip ${trendDelta >= 0 ? 'habit' : ''}`} style={{ fontSize: 12, whiteSpace: 'nowrap', flex: 'none' }}>
              {trendDelta >= 0 ? '▲' : '▼'} {Math.abs(trendDelta)}% за неделю
            </span>
          </div>
          <TrendChart data={trend} />
        </section>

        {/* weekday breakdown */}
        <section className="card" style={{ padding: 'var(--pad)' }}>
          <div className="row" style={{ gap: 10, marginBottom: 18 }}>
            <span style={{ color: 'var(--habit-ink)' }}><Icon name="grid" size={19} /></span>
            <h3 style={{ fontSize: 16.5 }}>Сильные дни недели</h3>
          </div>
          <WeekdayBars data={wd} />
        </section>
      </div>

      {/* per-habit completion bars */}
      <section className="card" style={{ padding: 'var(--pad)', marginTop: 'var(--gap)' }}>
        <div className="row" style={{ gap: 10, marginBottom: 18 }}>
          <span style={{ color: 'var(--habit-ink)' }}><Icon name="chart" size={19} /></span>
          <h3 style={{ fontSize: 16.5 }}>Процент выполнения по привычкам</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ranked.map(h => (
            <div key={h.id} className="row" style={{ gap: 14 }}>
              <HabitBadge icon={h.icon} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{h.name}</span>
                  <span className="stat-num" style={{ fontSize: 14, color: 'var(--habit-ink)' }}>{h.rate}%</span>
                </div>
                <Bar pct={h.rate} color="habit" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* best & weakest */}
      <div className="stat-cols" style={{ marginTop: 'var(--gap)' }}>
        <HighlightCard kind="best" h={top} />
        <HighlightCard kind="weak" h={weak} />
      </div>
    </div>
  )
}

function Kpi({ icon, value, label, sub, accent }) {
  return (
    <div className="card kpi">
      <div className="kpi-ic" style={accent ? { background: 'var(--goal-tint)', color: 'var(--goal)' } : {}}>
        <Icon name={icon} size={22} />
      </div>
      <div className="stat-num kpi-val">{value}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}

// SVG area/line trend chart
function TrendChart({ data }) {
  const w = 520, h = 150, pad = 8
  const max = 100, min = 0
  const n = data.length
  const x = (i) => pad + (i / (n - 1)) * (w - pad * 2)
  const y = (v) => h - pad - ((v - min) / (max - min)) * (h - pad * 2)
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L ${x(n - 1).toFixed(1)} ${h - pad} L ${x(0).toFixed(1)} ${h - pad} Z`
  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--habit)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--habit)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[25, 50, 75].map(g => (
          <line key={g} x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} stroke="var(--border-2)" strokeWidth="1" />
        ))}
        <path d={area} fill="url(#trendgrad)" />
        <path d={line} fill="none" stroke="var(--habit)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={i === n - 1 ? 4.5 : 2.6}
            fill={i === n - 1 ? 'var(--habit)' : 'var(--surface)'} stroke="var(--habit)" strokeWidth="2" />
        ))}
      </svg>
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <span className="muted" style={{ fontSize: 11.5 }}>12 недель назад</span>
        <span className="muted" style={{ fontSize: 11.5 }}>эта неделя</span>
      </div>
    </div>
  )
}

function WeekdayBars({ data }) {
  const best = data.reduce((a, d) => (d.pct > a.pct ? d : a), data[0])
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150 }}>
      {data.map(d => (
        <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%' }}>
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
            <div title={`${d.pct}%`} style={{
              width: '100%', height: `${Math.max(6, (d.pct / 100) * 100)}%`,
              borderRadius: '8px 8px 4px 4px',
              background: d.label === best.label ? 'var(--habit)' : 'var(--habit-soft)',
              transition: 'height 0.6s cubic-bezier(0.22,0.61,0.36,1)',
            }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: d.label === best.label ? 'var(--habit-ink)' : 'var(--muted)' }}>{d.label}</span>
          <span className="muted" style={{ fontSize: 11 }}>{d.pct}%</span>
        </div>
      ))}
    </div>
  )
}

function HighlightCard({ kind, h }) {
  const best = kind === 'best'
  return (
    <div className="card" style={{ padding: 'var(--pad)', display: 'flex', gap: 15, alignItems: 'center',
      borderColor: best ? 'var(--habit-soft)' : 'var(--goal-soft)' }}>
      <div style={{ width: 50, height: 50, borderRadius: 16, flex: 'none', display: 'grid', placeItems: 'center',
        background: best ? 'var(--habit-tint)' : 'var(--goal-tint)', color: best ? 'var(--habit-ink)' : 'var(--goal)' }}>
        <Icon name={best ? 'trophy' : 'alert'} size={26} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          {best ? 'Самая стабильная' : 'Нужно внимание'}
        </div>
        <div style={{ fontWeight: 700, fontSize: 16.5, marginTop: 3 }}>{h.name}</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
          {h.rate}% выполнения · серия {h.streak} {best ? '· так держать' : '· подтяни на этой неделе'}
        </div>
      </div>
      <div className="stat-num" style={{ fontSize: 30, color: best ? 'var(--habit-ink)' : 'var(--goal)' }}>{h.rate}%</div>
    </div>
  )
}
