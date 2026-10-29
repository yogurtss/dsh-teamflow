/** Small-size vector realization of the approved purple monoline image concepts. */
export function BrandIcon({name='teamflow',size=24}:{name?:'teamflow'|'gallery'|'save';size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{color:'var(--teamflow-brand, #a333f5)',flexShrink:0}}>
    {name==='teamflow'?<><path d="M5.2 19.2A11.3 11.3 0 0 1 19.3 5.2M26.8 12.8A11.3 11.3 0 0 1 12.7 26.8"/><circle cx="16" cy="16" r="3.4"/><circle cx="24.6" cy="7.4" r="2.7"/><circle cx="7.4" cy="24.6" r="2.7"/></>
      :name==='gallery'?<><rect x="5" y="5" width="9" height="9" rx="2.5"/><circle cx="22.5" cy="9.5" r="4.5"/><rect x="5" y="18" width="9" height="9" rx="2.5"/><rect x="18" y="18" width="9" height="9" rx="2.5"/></>
      :<><path d="M20 5H10a3 3 0 0 0-3 3v19l9-5 9 5V13"/><circle cx="25" cy="6" r="3"/></>}
  </svg>
}
