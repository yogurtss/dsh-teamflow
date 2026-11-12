export const MAX_WORKFLOW_TEXT_LENGTH = 64_000;
export const MAX_MEMBER_PE_LENGTH = MAX_WORKFLOW_TEXT_LENGTH;
export const MAX_WORKFLOW_PROPOSAL_LENGTH = 4_000_000;
// A JSON string of this length takes at most three UTF-8 bytes per UTF-16
// code unit. Leave room for the surrounding workbench request.
export const MAX_WORKFLOW_REQUEST_BYTES = 16_000_000;
export function parseMemberExecutionPrompt(value) {
    if (typeof value !== 'string')
        throw new Error('executionPrompt 必须是有效文本');
    if (value.length > MAX_MEMBER_PE_LENGTH)
        throw new Error(`成员执行指令最多允许 ${MAX_MEMBER_PE_LENGTH} 个字符`);
    return value.trim();
}
