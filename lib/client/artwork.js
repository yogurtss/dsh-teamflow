/** Shared, deterministic role portraits for every AgentTeams surface. */
export const ART_BASE = '/plugins/dsh-agent-teams/assets/';
// Small vector glyphs stay legible at roster size and need no image downloads.
function portrait(path, color = '#4c6b91', background = '#edf2f8') {
    return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="1" y="1" width="46" height="46" rx="14" fill="${background}"/><g transform="translate(12 12)" fill="none" stroke="${color}" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${path}</g></svg>`);
}
const portraits = {
    member: portrait('<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>'),
    research: portrait('<circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 6 6M7 10h6M10 7v6"/>'),
    engineer: portrait('<path d="m7 6-5 6 5 6m10-12 5 6-5 6M14 3l-4 18"/>'),
    qa: portrait('<circle cx="12" cy="12" r="9"/><path d="m7.5 12 3 3 6-6"/>', '#42796b', '#edf5f1'),
    design: portrait('<path d="m5 15-1 5 5-1L20 8l-4-4L5 15Zm8-8 4 4M5 15l4 4"/>', '#7b6595', '#f3eff7'),
    review: portrait('<path d="m12 2 8 3v6c0 5-4 8-8 11-4-3-8-6-8-11V5l8-3Z"/><path d="m8 11 3 3 5-5"/>', '#42796b', '#edf5f1'),
    docs: portrait('<path d="M6 2h8l5 5v15H6V2Zm8 0v6h5M9 12h7M9 16h7"/>'),
    data: portrait('<path d="M4 21V11h4v10M10 21V4h4v17M16 21v-7h4v7"/>', '#7b6595', '#f3eff7'),
    operator: portrait('<path d="M5 3v18M12 3v18M19 3v18"/><rect x="2" y="7" width="6" height="4" rx="1" fill="#edf2f8"/><rect x="9" y="14" width="6" height="4" rx="1" fill="#edf2f8"/><rect x="16" y="5" width="6" height="4" rx="1" fill="#edf2f8"/>'),
};
export const LEAD_ART = portrait('<rect x="8" y="2" width="8" height="6" rx="2"/><path d="M12 8v5M5 16v-3h14v3"/><rect x="1" y="16" width="8" height="6" rx="2"/><rect x="15" y="16" width="8" height="6" rx="2"/>', '#376ac4', '#edf3ff');
export const REVIEW_ART = portraits.review;
export const ACTION_ART = {
    working: portrait('<path d="m13 2-8 12h6l-1 8 9-13h-7l1-7Z"/>'),
    idle: portrait('<path d="M8 5v14M16 5v14"/>'),
    unknown: portrait('<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>'),
};
const ROLE_ART = [
    [/secur|audit|review|验收|安全|审计|审查|评审/, 'review'],
    [/\bqa\b|test|verif|quality|测试|质量|验证/, 'qa'],
    [/design|\bui\b|\bux\b|front|设计|前端|无障碍/, 'design'],
    [/data|analys|metric|performance|数据|分析|指标|性能/, 'data'],
    [/resear|investig|explor|study|研究|调查|探索|调研/, 'research'],
    [/engineer|develop|\bdev\b|server|backend|\bapi\b|工程|后端|服务|接口|开发|代码|编程/, 'engineer'],
    [/docs|writer|product|spec|撰写|文案|写作|文档|规范|产品/, 'docs'],
    [/release|\bbuild\b|deploy|\bops\b|\bci\b|coordin|发布|构建|部署|运维|协调/, 'operator'],
];
/** Role takes precedence over display names; equal roles always share a portrait. */
export function memberArtUrl(name, role) {
    const identity = (role.trim() || name.trim()).toLowerCase();
    for (const [pattern, key] of ROLE_ART)
        if (pattern.test(identity))
            return portraits[key];
    return portraits.member;
}
