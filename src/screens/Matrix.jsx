/* ============================================================
   Eisenhower matrix — distribute tasks by urgency × importance
   ============================================================ */
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { QUADRANTS } from '../lib/metrics'

const QUAD_STYLE = {
  do:       { accent: 'var(--goal)',          tint: 'var(--goal-tint)',     soft: 'var(--goal-soft)',     ink: 'var(--goal-ink)',     icon: 'bolt' },
  plan:     { accent: 'var(--habit)',         tint: 'var(--habit-tint)',    soft: 'var(--habit-soft)',    ink: 'var(--habit-ink)',    icon: 'calendar' },
  delegate: { accent: 'oklch(0.7 0.13 75)',   tint: 'oklch(0.97 0.025 80)', soft: 'oklch(0.9 0.06 80)',   ink: 'oklch(0.5 0.1 70)',   icon: 'link' },
  drop:     { accent: 'oklch(0.62 0.015 65)', tint: 'oklch(0.972 0.004 75)', soft: 'oklch(0.9 0.006 75)', ink: 'oklch(0.5 0.012 65)', icon: 'arrowDownCircle' },
}

export function Matrix({ store }) {
  const { matrixTasks } = store
  const [dragId, setDragId] = useState(null)
  const [overQ, setOverQ] = useState(null)

  const byQuad = (q) => matrixTasks.filter(t => t.quadrant === q)
  const counts = QUADRANTS.reduce((m, q) => (m[q.id] = byQuad(q.id).length, m), {})

  const onDrop = (q) => {
    if (dragId) store.moveTask(dragId, q)
    setDragId(null); setOverQ(null)
  }

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ color: 'var(--goal)' }}>ПРИОРИТЕТЫ</div>
          <h1>Матрица Эйзенхауэра</h1>
          <p className="sub">Распредели задачи по срочности и важности. Перетащи карточку между квадрантами или нажми на иконку слева, чтобы выбрать новый.</p>
        </div>
        <button className="btn primary head-add" onClick={() => store.addMatrixTask('do')}>
          <Icon name="plus" size={17} /> Задача
        </button>
      </div>

      {/* axis + grid */}
      <div className="matrix-wrap">
        <div className="axis-imp"><span>важно</span><span>не важно</span></div>
        <div>
          <div className="axis-urg"><span>срочно</span><span>не срочно</span></div>
          <div className="matrix-grid">
            {QUADRANTS.map(q => {
              const st = QUAD_STYLE[q.id]
              const tasks = byQuad(q.id)
              return (
                <section key={q.id}
                  className={`quad ${overQ === q.id ? 'over' : ''}`}
                  style={{ '--qa': st.accent, '--qt': st.tint, '--qs': st.soft }}
                  onDragOver={(e) => { e.preventDefault(); if (overQ !== q.id) setOverQ(q.id) }}
                  onDragLeave={(e) => { if (e.currentTarget === e.target) setOverQ(null) }}
                  onDrop={() => onDrop(q.id)}>
                  <div className="quad-head">
                    <div className="quad-badge" style={{ background: st.tint, color: st.ink }}>
                      <Icon name={st.icon} size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 16 }}>{q.title}</h3>
                      <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{q.hint}</div>
                    </div>
                    <span className="quad-count" style={{ color: st.ink, background: st.tint }}>{counts[q.id]}</span>
                  </div>

                  <div className="quad-body">
                    {tasks.map(t => (
                      <TaskCard key={t.id} t={t} dragging={dragId === t.id}
                        onDragStart={() => setDragId(t.id)} onDragEnd={() => { setDragId(null); setOverQ(null) }}
                        onRemove={() => store.removeMatrixTask(t.id)}
                        onRename={(name) => store.renameTask(t.id, name)}
                        onMove={(qq) => store.moveTask(t.id, qq)} />
                    ))}
                    {tasks.length === 0 && (
                      <div className="quad-empty">Перетащи задачу сюда</div>
                    )}
                    <button className="quad-add" onClick={() => store.addMatrixTask(q.id)}>
                      <Icon name="plus" size={14} /> добавить
                    </button>
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 13, marginTop: 18, display: 'flex', alignItems: 'center', gap: 7 }}>
        <Icon name="grip" size={15} /> Совет: держи квадрант «Сделать сейчас» коротким — не больше 3–4 задач.
      </p>
    </div>
  )
}

function TaskCard({ t, dragging, onDragStart, onDragEnd, onRemove, onRename, onMove }) {
  const accentChip = t.accent === 'goal' ? 'goal' : t.accent === 'habit' ? 'habit' : ''
  const [editing, setEditing] = useState(!!t.isNew)
  const [text, setText] = useState(t.name)
  const [picker, setPicker] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus() }, [editing])

  const commit = () => {
    const v = text.trim()
    onRename(v || 'Без названия')
    if (!v) setText('Без названия')
    setEditing(false)
  }

  return (
    <div className={`taskcard ${dragging ? 'dragging' : ''}`} draggable={!editing}
      onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <button className="task-grip" onClick={() => setPicker(p => !p)} aria-label="Переместить" title="Переместить">
        <Icon name={picker ? 'x' : 'grip'} size={16} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input ref={inputRef} className="task-input" value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setText(t.name); setEditing(false); if (t.isNew) onRemove() } }}
            placeholder="Что нужно сделать?" />
        ) : (
          <div className="task-name" onClick={() => { setText(t.name); setEditing(true) }} title="Нажми, чтобы изменить">{t.name}</div>
        )}
        {picker ? (
          <div className="task-move">
            {QUADRANTS.filter(q => q.id !== t.quadrant).map(q => {
              const st = QUAD_STYLE[q.id]
              return (
                <button key={q.id} onClick={() => { onMove(q.id); setPicker(false) }}
                  style={{ '--qa': st.accent, color: st.ink, background: st.tint }} title={q.hint}>
                  <Icon name={st.icon} size={12} /> {q.title}
                </button>
              )
            })}
          </div>
        ) : (
          <span className={`chip ${accentChip}`} style={{ marginTop: 7, fontSize: 11, padding: '2px 9px' }}>
            {t.accent === 'goal' && <Icon name="goal" size={11} />}
            {t.accent === 'habit' && <Icon name="habit" size={11} />}
            {t.tag}
          </span>
        )}
      </div>
      <button className="task-del" onClick={onRemove} aria-label="Удалить"><Icon name="x" size={15} /></button>
    </div>
  )
}
