/** Versioned built-ins are read-only; edits become independent personal copies. */
import { parseTemplate } from "./templates.js";
const member = (name, summary) => ({ name, summary, role: summary, executionPrompt: '按本次完整任务要求工作，先检查输入与范围；不臆造缺失信息。交付可追溯的文件、结果和证据，区分实际验证与推断。发现阻塞及时报告，不擅自扩大范围或替用户批准。' });
const node = (id, subject, assignee, dependencies, requirements, deliverables, acceptance) => ({ id, subject, assignee, dependencies, checkpoint: !assignee, general: { requirements, deliverables, acceptance } });
const gate = (id, subject, dependencies, requirements) => node(id, subject, '', dependencies, requirements, '供用户决策的检查清单、证据链接、未决项和风险说明。', '逐项对应检查标准；由用户明确通过或退回。证据不足时不得代替用户批准。');
const analyst = member('analyst', '澄清需求、范围、约束与可检验的完成标准');
const builder = member('builder', '依据确认的规格完成最小必要实现并提供自测证据');
const verifier = member('verifier', '独立验证实现与规格的一致性，复核边界与回归风险');
function template(id, name, description, inputs, tags, members, tasks) {
    return { ...parseTemplate({ name, description, inputs, tags, members, tasks, positions: {} }), id, version: 1, createdAt: 1793404800000, updatedAt: 1793404800000 };
}
const definitions = [
    template('builtin-feature', '功能开发', '从需求确认到独立验证，适合新功能、接口和工具开发。', '提供目标与使用场景、代码仓库和允许修改范围、接口与兼容性约束、运行及测试方式、完成标准。', ['开发', '需求确认'], [analyst, builder, verifier], [
        node('requirements', '需求分析', 'analyst', [], '读取现有实现和用户目标，明确输入输出、使用场景、范围与非目标。识别兼容性约束、依赖和未决问题，将需求转化为可验证的验收条目；不自行决定关键产品行为。', '需求说明、影响范围、验收清单、最小实现方案和待确认问题。', '每条核心需求有验收方式；范围边界清晰；关键未知项显式列出。'),
        gate('scope-review', '确认需求与方案', ['requirements'], '核对目标、范围、接口行为、兼容性风险及验收清单；明确解决关键问题后再允许实现。'),
        node('implementation', '实现与自测', 'builder', ['scope-review'], '按已确认规格完成最小必要变更，遵循仓库约定；补充行为测试与必要文档。记录实际运行的检查，不把未执行的检查写成通过。', '实现变更、测试与文档、需求到变更的对应说明、自测证据及限制。', '实现覆盖确认范围，不引入无关变更；必要检查有结果与可复现步骤。'),
        node('verification', '独立验证', 'verifier', ['implementation'], '独立对照确认的规格检查实现，验证核心路径、边界、异常输入及兼容性；复跑关键检查，不直接采信实现者报告。发现问题时提供复现步骤、影响与证据。', '逐项验收结果、回归记录、问题清单、未覆盖项与残余风险。', '每条验收标准有可追溯结果；失败与未验证项明确，不能冒充通过。'),
        gate('acceptance', '最终验收', ['verification'], '结合需求、自测与独立验证结果检查交付是否完整；有阻塞问题则退回，不自动部署、合并或发布。')
    ]),
    template('builtin-bugfix', '问题排查与修复', '先复现和定位根因，再最小修复并验证不再复发。', '提供异常表现、期望行为、复现步骤、环境和版本、日志或样例、近期变更，以及允许修改范围。', ['排障', '修复', '回归'], [analyst, builder, verifier], [
        node('reproduce', '复现与取证', 'analyst', [], '建立最小复现，区分预期与实际行为。记录环境、输入、日志与触发条件；优先非破坏性取证。无法复现时列出缺少的证据，不把猜测写成事实。', '最小复现、环境记录、异常证据、已排除条件和信息缺口。', '复现步骤可重做且有观察结果；未复现或环境限制明确标注。'),
        node('root-cause', '根因分析', 'analyst', ['reproduce'], '沿调用链和数据流定位故障，逐项验证假设，区分根因与表面症状。评估影响范围，提出最小修复方案及防复发测试；证据不足时请求补充。', '证据支持的因果说明、影响范围、修复方案、回归测试设计。', '根因能解释观察结果；关键假设有证据；方案不靠绕过校验或隐藏异常消除症状。'),
        gate('fix-review', '确认根因与修复范围', ['root-cause'], '确认根因证据、修复范围、兼容性影响及回归方案；未定位根因时决定是否继续调查。'),
        node('fix', '最小修复', 'builder', ['fix-review'], '依据确认方案修复根因，加入能覆盖原故障的回归测试，保持范围收敛。记录修改前后的行为和实际测试结果。', '修复变更、回归测试、前后行为对比、自测记录。', '原故障的检测方式明确；补丁能通过相应检查且不掩盖失败，变更符合确认范围。'),
        node('regression', '独立回归验证', 'verifier', ['fix'], '复跑最小复现与新增回归测试，检查相邻路径、边界和兼容性。验证缺陷不再出现，并调查新增异常；无法验证的环境单独列出。', '独立复现与回归结果、新问题清单、覆盖范围与残余风险。', '原故障有修复证据；关键相邻行为未退化；未覆盖项不计作通过。'),
        gate('acceptance', '修复验收', ['regression'], '核对根因、补丁、回归证据与遗留风险；决定接受或退回，不把测试通过等同于上线授权。')
    ]),
    template('builtin-operator', '算子开发与优化', '以规格和基线为起点，先验证正确性，再做可复现的性能评测。', '提供目标算子语义、参考实现、输入形状与数据类型、布局与边界约束、目标设备和环境、误差标准、基线及性能目标。', ['算子', '正确性', '性能'], [analyst, builder, verifier, member('benchmark', '在正确性通过后进行可复现的性能评测与瓶颈分析')], [
        node('specification', '规格与基线', 'analyst', [], '明确算子语义、输入输出、形状、数据类型、布局、边界及数值要求。检查参考实现与运行环境，制定正确性用例矩阵和可比性能基线；未知阈值向用户澄清，不自行编造。', '算子规格、用例矩阵、误差判定方法、基线方案和环境清单。', '语义与边界可检验；精度及性能指标定义清楚；缺少设备或参考结果时明确阻塞。'),
        gate('spec-review', '确认规格与指标', ['specification'], '确认算子语义、测试覆盖、误差标准、目标平台和性能比较方法，再进入实现。'),
        node('implementation', '实现与优化', 'builder', ['spec-review'], '按确认规格实现算子，先保证正确性再进行有依据的优化。遵守接口、内存与并发约束，记录实现假设和优化取舍；不得牺牲规格中的精度或边界支持换取性能。', '算子实现、接口说明、自测用例与记录、优化说明和已知限制。', '满足确认的接口与约束；核心路径自测有证据；优化可解释且不扩大未授权变更。'),
        node('correctness', '独立正确性验证', 'verifier', ['implementation'], '对照参考实现与规格独立验证，覆盖已确认的形状、数据类型、布局、边界与异常条件。按约定误差方法评估数值结果，记录失败样例；没有完整运行证据时不得宣称正确性通过。', '用例矩阵结果、数值误差记录、失败样例与复现步骤、覆盖缺口。', '确认范围内的正确性标准逐项达成；未解决失败应报告任务失败，阻止后续性能结论被当作有效交付。'),
        node('performance', '性能评测', 'benchmark', ['correctness'], '仅在正确性验证通过后，在一致环境和输入条件下比较实现与基线。明确预热、重复次数、计时与同步方法，报告波动和资源开销；识别瓶颈，不以单次最好成绩代表整体性能。', '可复现评测命令与环境、基线对比表、重复测量统计、瓶颈分析及限制。', '比较条件公平且可重做；结果覆盖确认场景；未达性能目标明确报告，不擅改阈值或隐去退化。'),
        gate('acceptance', '算子交付验收', ['performance'], '联合检查规格、实现、独立正确性与性能证据；确认精度和性能目标及适用范围，决定通过或退回。')
    ])
];
// Keep v1 readable for existing template references; Gallery lists the latest definition.
const featureV1 = definitions.find(item => item.id === 'builtin-feature');
const featureTasks = featureV1.tasks;
const featureV2 = { ...featureV1, version: 2, updatedAt: 1793414400000,
    description: "并行分析需求与代码影响，实现与测试准备并行，最后独立验证和代码审查汇合验收。", members: [...featureV1.members, { "name": "reviewer", "summary": "只读调查代码影响，独立审查实现与兼容性风险", "role": "只读调查代码影响，独立审查实现与兼容性风险", "executionPrompt": "按本次完整任务要求工作，先检查输入与范围；不臆造缺失信息。交付可追溯的文件、结果和证据，区分实际验证与推断。发现阻塞及时报告，不擅自扩大范围或替用户批准。" }],
    tasks: [featureTasks[0], { "id": "impact", "subject": "代码与影响调查", "assignee": "reviewer", "dependencies": [], "checkpoint": false, "general": { "requirements": "只读检查现有实现、接口、依赖与仓库约定，识别兼容性风险和可复用实现。与需求分析并行，基于用户目标形成独立证据；不修改业务代码或自行扩大范围。", "deliverables": "代码定位、影响范围、风险与建议修改文件清单。", "acceptance": "结论有代码或文档依据；待确认项明确，未修改业务文件。" } },
        { ...featureTasks[1], dependencies: ['requirements', 'impact'], general: { ...featureTasks[1].general, requirements: "综合需求分析与代码影响调查，确认范围、接口和验收标准。明确实现目录、独立测试目录及交付文档归属，禁止并行节点修改相同文件；关键问题解决后再允许实现和测试准备。" } },
        { ...featureTasks[2], general: { ...featureTasks[2].general, requirements: "按已确认规格完成最小必要实现与自测，仅修改分配的实现文件及自测文件，不改独立验证目录或其他并行节点的文件。遵循仓库约定，记录真实检查结果；接口变化或需要共享配置修改时先报告并协调。" } },
        { "id": "test-preparation", "subject": "独立测试准备", "assignee": "verifier", "dependencies": ["scope-review"], "checkpoint": false, "general": { "requirements": "根据已确认规格独立编写行为、边界和异常用例，与实现并行。仅修改方案分配的独立测试目录，不修改业务代码、共享配置或锁文件；接口未明确时报告阻塞。执行条件未满足时只交付测试工具与预期，不宣称验证通过。", "deliverables": "独立测试用例、测试数据、执行命令和预期结果。", "acceptance": "用例对应验收条目，覆盖核心与异常路径；文件范围与实现者不重叠。" } },
        { ...featureTasks[3], dependencies: ['implementation', 'test-preparation'] },
        { "id": "code-review", "subject": "代码与兼容性审查", "assignee": "reviewer", "dependencies": ["implementation"], "checkpoint": false, "general": { "requirements": "只读审查实现变更，核对已确认规格、接口兼容性、错误处理及仓库约定。与行为验证并行，不修改被审查代码或测试文件；发现问题提供定位、影响和证据，不能把尚未完成的验证当作通过。", "deliverables": "代码审查结论、兼容性风险、问题定位和证据。", "acceptance": "审查范围和未覆盖项明确；阻塞问题显式报告，不擅自修改或批准。" } }, { "id": "delivery", "subject": "汇总交付与验收材料", "assignee": "analyst", "dependencies": ["verification", "code-review"], "checkpoint": false, "general": { "requirements": "等待行为验证和代码审查全部结束，逐项汇总需求、实现、测试与审查证据。明确失败、未验证项及残余风险，不替代修复或用户批准；只写方案指定的交付文档，不改实现和测试。", "deliverables": "需求到证据的对应清单、交付说明、未决问题和验收建议。", "acceptance": "两个并行分支的结论均已纳入；失败与未验证项未被隐藏，交付可追溯。" } },
        { ...featureTasks[4], dependencies: ['delivery'] }]
};
const latest = definitions.map(item => item.id === 'builtin-feature' ? featureV2 : item);
export function builtinTemplates() { return structuredClone(latest); }
export function getBuiltinTemplate(id, version) {
    const found = (version === 1 ? definitions : latest).find(t => t.id === id);
    if (!found || version !== undefined && version !== found.version)
        throw new Error('内置模板版本不存在');
    return structuredClone(found);
}
