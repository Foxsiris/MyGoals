/* ============================================================
   Shared UI primitives
   ============================================================ */
import { useEffect } from 'react'
import { Icon } from './Icon'

// ---- Animated check button ----
export function Check({ on, onClick, color = 'habit', size = 'md' }) {
  return (
    <button
      className={`check ${color === 'goal' ? 'goal' : ''} ${on ? 'on' : ''} ${size === 'lg' ? 'lg' : ''}`}
      onClick={onClick} aria-pressed={on}>
      <Icon name="check" size={size === 'lg' ? 17 : 15} stroke={3} />
    </button>
  )
}

// ---- Progress ring (SVG) ----
export function Ring({ pct, size = 54, stroke = 6, color = 'var(--goal)', track = 'oklch(0.93 0.008 75)', children, label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c - (pct / 100) * c
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,0.61,0.36,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', flexDirection: 'column' }}>
        {children || (
          <span className="stat-num" style={{ fontSize: size * 0.27, lineHeight: 1 }}>{pct}<span style={{ fontSize: size * 0.16 }}>%</span></span>
        )}
        {label && <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{label}</span>}
      </div>
    </div>
  )
}

// ---- Progress bar ----
export function Bar({ pct, color = 'goal' }) {
  return (
    <div className={`pbar ${color === 'habit' ? 'habit' : ''}`}>
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}

// ---- Heatmap ----
export function Heatmap({ data, weeks = 17 }) {
  const cells = data.slice(-(weeks * 7))
  return (
    <div className="heat">
      {cells.map((lvl, i) => (
        <div key={i} className={`cell ${lvl ? 'l' + lvl : ''}`}
          title={lvl ? 'Выполнено' : 'Пропущено'} />
      ))}
    </div>
  )
}

// ---- Habit icon badge ----
export function HabitBadge({ icon, color = 'habit', size = 40 }) {
  const isGoal = color === 'goal'
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.32, flex: 'none',
      display: 'grid', placeItems: 'center',
      background: isGoal ? 'var(--goal-tint)' : 'var(--habit-tint)',
      color: isGoal ? 'var(--goal)' : 'var(--habit-ink)',
    }}>
      <Icon name={icon} size={size * 0.5} stroke={2} />
    </div>
  )
}

// ---- Streak pill ----
export function Streak({ n, color = 'goal' }) {
  return (
    <span className="streak" style={color === 'habit' ? { color: 'var(--habit-ink)' } : {}}>
      <Icon name="flame" size={14} /> {n}
    </span>
  )
}

// ---- Modal shell ----
export function Modal({ children, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet">{children}</div>
    </div>
  )
}

// ---- Section header (used across screens) ----
export function SectionHead({ icon, color, title, right }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
      <div className="row" style={{ gap: 10, minWidth: 0 }}>
        <span style={{ color: color === 'goal' ? 'var(--goal)' : 'var(--habit-ink)', flex: 'none', display: 'inline-flex' }}><Icon name={icon} size={19} /></span>
        <h3 style={{ fontSize: 16.5, whiteSpace: 'nowrap' }}>{title}</h3>
      </div>
      <div style={{ flex: 'none' }}>{right}</div>
    </div>
  )
}
