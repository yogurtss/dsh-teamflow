/** Format whitespace only, preserving duplicate keys, escapes and numeric literals. */
export function discussionJson(text) {
    const trimmed = text.trim();
    const source = trimmed.startsWith('```')
        ? /^```(?:json)?[^\S\r\n]*\r?\n([\s\S]*?)\r?\n```$/i.exec(trimmed)?.[1]?.trim()
        : trimmed;
    if (!source || !/^[{[]/.test(source) || !/[}\]]$/.test(source))
        return;
    try {
        JSON.parse(source);
    }
    catch {
        return;
    }
    let depth = 0;
    let previous = '';
    let output = '';
    for (const [token] of source.matchAll(/"(?:\\[\s\S]|[^"\\])*"|[{}\[\],:]|[^\s{}\[\],:"]+/g)) {
        const closing = token === '}' || token === ']';
        const afterOpen = previous === '{' || previous === '[';
        if (closing)
            depth--;
        if ((closing && !afterOpen) || (!closing && afterOpen) || previous === ',') {
            output += '\n' + '  '.repeat(Math.min(depth, 24));
        }
        output += token === ':' ? ': ' : token;
        if (token === '{' || token === '[')
            depth++;
        previous = token;
    }
    return output;
}
