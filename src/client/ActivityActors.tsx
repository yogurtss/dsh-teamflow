import type { ActivityTeam } from './activity-monitor.ts'
import type { AgentTeamsTranslate } from './locales.ts'
import { LEAD_ART, memberArtUrl } from './artwork.ts'
import { activityActors } from './activity-actors.ts'
import css from './ActivityActors.module.css'

const marks = {ready:'○',active:'●',adapting:'●',complete:'✓',blocked:'!',decision:'◇'}
export function ActivityActors({team, archived, t}: {team:ActivityTeam; archived?:boolean; t:AgentTeamsTranslate}) {
  return <span className={css.stack}>{activityActors(team,archived).map((actor,index)=>{
    const member = team.members.find(m => m.name === actor.name)
    const captain = actor.name === 'captain'
    const art = captain ? LEAD_ART : member && memberArtUrl(member.name,member.role ?? '')
    const name = captain ? 'Captain' : actor.name
    return <span key={index} className={css.actor} data-tone={actor.tone}>
      <span className={css.portrait} aria-hidden="true">{art ? <img src={art} alt=""/> : name?.slice(0,1).toUpperCase() || marks[actor.tone]}</span>
      <span className={css.copy}><strong>{actor.from && actor.from+' → '}{name || t(actor.label)}</strong>
        <span>{name && t(actor.label)}{name && actor.task && ' · '}{actor.task}</span></span>
      <span className={css.mark} aria-hidden="true">{marks[actor.tone]}</span>
    </span>
  })}</span>
}
