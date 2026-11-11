import { parseTemplate } from "./templates.js";
export const RESEARCH_ID = 'builtin-deep-research';
export function deepResearchTemplate(language = 'zh') {
    const t = (zh, en) => language === 'en' ? en : zh;
    const search = t('优先使用当前可用且适合本题的 MCP 检索工具。围绕子问题分别检索原始资料与反例，打开原文核对。记录工具、查询词、日期、来源链接和定位。若工具不可用或覆盖不足，使用获准的其他来源，说明检索缺口。只引用实际读到的材料。', 'Prefer available MCP retrieval tools suited to the question. Search for primary sources and counterexamples, then check the originals. Log tools, queries, dates, source links and locators. If retrieval is unavailable or coverage is insufficient, use other permitted sources and document the gap. Cite only material actually inspected.');
    const role = (name, summary, executionPrompt, galleryMcp = false) => ({ name, summary, role: summary, executionPrompt, galleryMcp });
    const step = (id, subject, assignee, dependencies, requirements, deliverables, acceptance) => ({ id, subject, assignee, dependencies, checkpoint: !assignee, general: { requirements, deliverables, acceptance } });
    const trace = t('每项关键主张均附原始来源、发布日期和可复查的位置。', 'Each key claim has an original source, publication date and verifiable locator.');
    const scope = t('将研究问题拆成可回答的子问题，明确对象、时间范围、纳入标准和证据缺口。', 'Break the question into answerable parts and define the population, time frame, inclusion criteria and gaps.');
    const synthesis = t('按子问题综合证据，解释冲突、适用条件与局限，区分观察结果和推断。', 'Synthesize evidence by question, explain disagreements, applicability and limitations, and distinguish observations from inferences.');
    return { ...parseTemplate({
            name: t('深度研究', 'Deep research'), description: t('并行检索一手证据与反例，交叉核对后形成带引用的研究报告。', 'Investigate primary evidence and counterexamples in parallel, cross-check findings and deliver a cited report.'),
            inputs: t('提供研究问题、报告用途、时间范围、关注地区与语言，以及允许使用的数据源或 MCP 服务。', 'Provide the research question, intended use, time period, regions, languages and permitted data sources or MCP services.'),
            tags: [t('研究', 'Research'), t('证据核查', 'Source verification'), 'MCP'],
            members: [role('editor', t('研究设计与报告撰写', 'Study design and report writing'), scope + ' ' + synthesis),
                role('researcher', t('检索一手来源并提取证据', 'Retrieve primary sources and extract evidence'), search, true),
                role('reviewer', t('检索独立反证并复核引用', 'Find counterevidence and verify citations'), search, true)],
            tasks: [
                step('scope', t('拆解研究问题', 'Frame the research question'), 'editor', [], scope, t('子问题、检索计划和来源筛选标准。', 'Subquestions, search plan and source selection criteria.'), t('每个子问题都对应可核查的证据类型。', 'Each subquestion identifies a verifiable type of evidence.')),
                step('scope-check', t('确认研究范围', 'Confirm scope'), '', ['scope'], t('核对研究边界与报告用途。', 'Check scope against the intended use.'), t('确认的研究范围。', 'Agreed research scope.'), t('由用户确认问题与边界。', 'The user confirms the question and scope.')),
                step('sources', t('检索一手证据', 'Retrieve primary evidence'), 'researcher', ['scope-check'], search, t('按子问题整理的证据表与检索日志。', 'Evidence table by subquestion and retrieval log.'), trace),
                step('counter', t('查找反例与边界', 'Find counterexamples'), 'reviewer', ['scope-check'], search + ' ' + t('独立寻找不同结论、失败案例与方法局限。', 'Independently seek conflicting findings, negative cases and methodological limits.'), t('反证清单、适用边界与来源。', 'Counterevidence, applicability and sources.'), trace),
                step('report', t('综合研究报告', 'Synthesize the report'), 'editor', ['sources', 'counter'], synthesis, t('带引用的报告、结论置信度与未决问题。', 'Cited report with confidence assessments and open questions.'), trace),
                step('verify', t('复核结论与引文', 'Verify claims and citations'), 'reviewer', ['report'], t('优先使用 MCP 检索原文，逐项复核核心结论与引文，给出更正依据。', 'Prefer MCP retrieval to reopen originals and verify each key claim and citation. Document corrections.'), t('逐项复核记录、更正项及证据缺口。', 'Claim audit, corrections and evidence gaps.'), trace),
                step('delivery', t('定稿与交付', 'Finalize the report'), 'editor', ['verify'], t('将复核更正落实到最终报告，标明仍有争议的结论。', 'Apply verified corrections to the final report and flag remaining disputes.'), t('最终报告、引用目录与检索记录。', 'Final report, bibliography and retrieval log.'), trace),
                step('acceptance', t('研究报告验收', 'Accept the research report'), '', ['delivery'], t('按研究范围核对报告是否回答问题、引文能否支持结论。', 'Check that the report answers the agreed questions and that citations support its conclusions.'), t('逐项验收意见。', 'Acceptance findings by criterion.'), t('证据缺口已说明，由用户决定通过或返工。', 'Disclose gaps for the user to approve or request rework.'))
            ], positions: {}
        }), id: RESEARCH_ID, version: 1, createdAt: 1794355200000, updatedAt: 1794355200000 };
}
