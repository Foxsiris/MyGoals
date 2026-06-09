/* ============================================================
   Icons — simple geometric stroke set
   ============================================================ */
export const Icon = ({ name, size = 20, stroke = 2, style }) => {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round',
    strokeLinejoin: 'round', style,
  }
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M9.5 20v-5.5h5V20" /></>,
    habit: <><path d="M17 3.5 21 7l-4 3.5" /><path d="M21 7H8a4 4 0 0 0-4 4v.5" /><path d="M7 20.5 3 17l4-3.5" /><path d="M3 17h13a4 4 0 0 0 4-4v-.5" /></>,
    goal: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></>,
    check: <path d="M5 12.5 10 17.5 19 6.5" />,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    arrowR: <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>,
    chevronR: <path d="M9 6l6 6-6 6" />,
    chevronL: <path d="M15 6l-6 6 6 6" />,
    chevronD: <path d="M6 9l6 6 6-6" />,
    calendar: <><rect x="3.5" y="4.5" width="17" height="16" rx="3" /><path d="M3.5 9h17M8 2.5v4M16 2.5v4" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
    flame: <path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c0-.5-.2-1-.4-1.4 1.6.9 2.9 2.6 2.9 5A4.5 4.5 0 0 1 7.6 13c0-2.4 1.4-3.8 2.4-5.5C11 5.7 11 4 12 3Z" />,
    target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /></>,
    bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
    sparkle: <><path d="M12 3v5M12 16v5M3 12h5M16 12h5" /><path d="M7 7l2.5 2.5M14.5 14.5 17 17M17 7l-2.5 2.5M9.5 14.5 7 17" /></>,
    note: <><rect x="4.5" y="3.5" width="15" height="17" rx="3" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    link: <><path d="M9 12a3 3 0 0 1 3-3h3a3 3 0 0 1 0 6h-1.5" /><path d="M15 12a3 3 0 0 1-3 3H9a3 3 0 0 1 0-6h1.5" /></>,
    edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="M14 6l4 4" /></>,
    trash: <><path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13" /></>,
    x: <><path d="M6 6l12 12M18 6 6 18" /></>,
    trophy: <><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M9 14v3h6v-3M8 20h8" /></>,
    leaf: <><path d="M5 19c0-8 6-13 14-13 0 8-6 13-14 13Z" /><path d="M5 19c3-5 7-7 11-8" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5Z" /></>,
    run: <><circle cx="14" cy="4.5" r="1.8" /><path d="M13 9 9 11l2 3v6M13 9l3 2 3 1M13 9l-2 3M5 21l4-7" /></>,
    code: <><path d="M9 8l-4 4 4 4M15 8l4 4-4 4" /></>,
    pen: <><path d="M5 19l1-4L16 5l3 3L9 18l-4 1Z" /></>,
    brain: <><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 2 5 3 3 0 0 0 6 0V4.5A2.5 2.5 0 0 0 9 4Z" /><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-2 5 3 3 0 0 1-3 1" /></>,
    water: <path d="M12 3c3 5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-6 6-11Z" />,
    dumbbell: <><path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" /></>,
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    chart: <><path d="M4 4v15.5a.5.5 0 0 0 .5.5H20" /><rect x="7.5" y="11" width="2.6" height="6" rx="0.8" fill="currentColor" stroke="none" /><rect x="12" y="7" width="2.6" height="10" rx="0.8" fill="currentColor" stroke="none" /><rect x="16.5" y="13" width="2.6" height="4" rx="0.8" fill="currentColor" stroke="none" /></>,
    trend: <><path d="M3 16l5-5 4 4 8-9" /><path d="M16 6h5v5" /></>,
    grip: <><circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none" /><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none" /><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none" /></>,
    alert: <><path d="M12 3 2 20h20L12 3Z" /><path d="M12 9v5M12 17.5v.01" /></>,
    arrowDownCircle: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8.5 12.5 12 16l3.5-3.5" /></>,
  }
  return <svg {...p}>{paths[name] || paths.goal}</svg>
}
