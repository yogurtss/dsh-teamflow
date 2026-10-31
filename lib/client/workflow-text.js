import { workflowEnglish } from "./workflow-messages.js";
import { zh, en } from "./locales.js";
const legacyMessages = Object.fromEntries(Object.entries(zh).map(([key, value]) => [value, en[key]]));
const format = (text, values) => text.replace(/\{(\d+)\}/g, (token, index) => Number(index) < values.length ? String(values[Number(index)]) : token);
export const sourceText = Object.assign((source, ...values) => format(source, values), { language: 'zh' });
export function workflowText(t) {
    return t?.('language.code') === 'en' ? Object.assign((source, ...values) => format(workflowEnglish[source] ?? legacyMessages[source] ?? source, values), { language: 'en' }) : sourceText;
}
/** Localize plugin-owned feedback at render time, including feedback saved before a locale switch. */
export function workflowMessage(text, l) {
    for (const [source, english] of Object.entries(workflowEnglish)) {
        if (text === source || text === english)
            return l(source);
        if (!source.includes('{0}'))
            continue;
        for (const pattern of [source, english]) {
            const parts = pattern.split(/(\{\d+\})/g), order = [];
            const expression = parts.map(part => {
                if (/^\{\d+\}$/.test(part)) {
                    order.push(Number(part.slice(1, -1)));
                    return '(.*?)';
                }
                return part.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
            }).join('');
            const match = new RegExp('^' + expression + '$', 's').exec(text);
            if (match) {
                const values = [];
                order.forEach((index, i) => { values[index] = match[i + 1]; });
                return l(source, ...values);
            }
        }
    }
    return text;
}
export function briefDisplay(value, l) {
    return [value.requirements, value.deliverables && l('交付物：') + '\n' + value.deliverables, value.acceptance && l('验收要求：') + '\n' + value.acceptance].filter(Boolean).join('\n\n');
}
