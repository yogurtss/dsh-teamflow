import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LEAD_ART, memberArtUrl } from "./artwork.js";
import { activityActors } from "./activity-actors.js";
import css from './ActivityActors.module.css';
const marks = { ready: '○', active: '●', adapting: '●', complete: '✓', blocked: '!', decision: '◇' };
export function ActivityActors({ team, archived, t }) {
    return _jsx("span", { className: css.stack, children: activityActors(team, archived).map((actor, index) => {
            const member = team.members.find(m => m.name === actor.name);
            const captain = actor.name === 'captain';
            const art = captain ? LEAD_ART : member && memberArtUrl(member.name, member.role ?? '');
            const name = captain ? 'Captain' : actor.name;
            return _jsxs("span", { className: css.actor, "data-tone": actor.tone, children: [_jsx("span", { className: css.portrait, "aria-hidden": "true", children: art ? _jsx("img", { src: art, alt: "" }) : name?.slice(0, 1).toUpperCase() || marks[actor.tone] }), _jsxs("span", { className: css.copy, children: [_jsxs("strong", { children: [actor.from && actor.from + ' → ', name || t(actor.label)] }), _jsxs("span", { children: [name && t(actor.label), name && actor.task && ' · ', actor.task] })] }), _jsx("span", { className: css.mark, "aria-hidden": "true", children: marks[actor.tone] })] }, index);
        }) });
}
