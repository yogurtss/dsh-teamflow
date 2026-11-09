/** Plugin-owned icons avoid depending on the host's generated design-export names. */
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
export function IconBranchOutline16() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" {...stroke}><circle cx="4" cy="3" r="1.5" /><circle cx="12" cy="4" r="1.5" /><circle cx="4" cy="13" r="1.5" /><path d="M4 4.5v7M4 9h3a5 5 0 0 0 5-3.5" /></svg>
}
export function IconChevronDownOutline14() {
  return <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" {...stroke}><path d="m3 5 4 4 4-4" /></svg>
}
export function IconPanelLeftOutline16() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" {...stroke}><rect x="2" y="2.5" width="12" height="11" rx="2" /><path d="M6 2.5v11" /></svg>
}
export function IconStopFill16() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="4" y="4" width="8" height="8" rx="1" fill="currentColor" /></svg>
}
export function IconWarningOutline16() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" {...stroke}><path d="m7 2-5.5 10a1 1 0 0 0 1 1.5h11a1 1 0 0 0 1-1.5L9 2a1.1 1.1 0 0 0-2 0Z" /><path d="M8 6v3m0 2v.1" /></svg>
}

/** Shared visual language for canvas tools, object kinds and contextual actions. */
export function WorkflowIcon({ name }: { name: 'task' | 'agent' | 'review' | 'properties' | 'chat' | 'edit' | 'expand' | 'fit' | 'arrange' | 'select' | 'pan' }) {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false" {...stroke}>
    {name === 'task' && <><rect x="3" y="2.5" width="10" height="11" rx="2" /><path d="M6 2.5V2h4v.5M6 6h4M6 9h4M6 11h2" /></>}
    {name === 'agent' && <><rect x="2.5" y="5" width="11" height="8" rx="2.5" /><path d="M8 2v3M1 8v2m14-2v2M6 11h4" /><circle cx="5.5" cy="8" r=".5" /><circle cx="10.5" cy="8" r=".5" /></>}
    {name === 'review' && <><path d="m8 1.5 5.5 2v4c0 3-3 5.2-5.5 7-2.5-1.8-5.5-4-5.5-7v-4z" /><path d="m5.5 7.5 1.7 1.7 3.3-3.4" /></>}
    {name === 'properties' && <><path d="M2 4h4m3 0h5M2 8h8m3 0h1M2 12h1m3 0h8M6 2.5v3M10 6.5v3M3 10.5v3" /></>}
    {name === 'chat' && <><path d="M13.5 8.5a3 3 0 0 1-3 3H7l-4 2v-2.5a3 3 0 0 1-1.5-2.5V5a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3z" /><path d="M5 6h5M5 8.5h3" /></>}
    {name === 'edit' && <><path d="m3 10 7.5-7.5a1.4 1.4 0 0 1 2 2L5 12l-3 1zM9 4l2 2M8 13h6" /></>}
    {name === 'expand' && <path d="M6 2H2v4m8-4h4v4M2 10v4h4m8-4v4h-4" />}
    {name === 'fit' && <><path d="M5 2H2v3m9-3h3v3M2 11v3h3m9-3v3h-3" /><rect x="5" y="5" width="6" height="6" rx="1" /></>}
    {name === 'arrange' && <><rect x="1.5" y="2.5" width="4" height="4" rx="1" /><rect x="10.5" y="2.5" width="4" height="4" rx="1" /><rect x="6" y="10" width="4" height="4" rx="1" /><path d="M3.5 6.5v1.5h9V6.5M8 8v2" /></>}
    {name === 'select' && <path d="m3 1.5 10 7-5 1-2 4z" />}
    {name === 'pan' && <path d="M5 8V4a1 1 0 0 1 2 0v3-4a1 1 0 0 1 2 0v4-3a1 1 0 0 1 2 0v3-1a1 1 0 0 1 2 0v4c0 3-2 4-4 4H8c-2 0-3-1-4-2L2 9a1 1 0 0 1 1.5-1L5 9" />}
  </svg>
}
