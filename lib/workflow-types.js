export const MAX_MEMBER_PE_LENGTH = 64_000;
export function parseMemberExecutionPrompt(value) {
    if (typeof value !== 'string')
        throw new Error('executionPrompt 必须是有效文本');
    if (value.length > MAX_MEMBER_PE_LENGTH)
        throw new Error(`成员执行指令最多允许 ${MAX_MEMBER_PE_LENGTH} 个字符`);
    return value.trim();
}
