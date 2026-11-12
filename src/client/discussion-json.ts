/** Format whitespace only, preserving duplicate keys, escapes and numeric literals. */
function formatJson(text: string): string | undefined {
  const source = text.trim()
  if (!/^[{[]/.test(source) || !/[}\]]$/.test(source)) return
  try { JSON.parse(source) } catch { return }

  let depth = 0
  let previous = ''
  let output = ''
  for (const [token] of source.matchAll(/"(?:\\[\s\S]|[^"\\])*"|[{}\[\],:]|[^\s{}\[\],:"]+/g)) {
    const closing = token === '}' || token === ']'
    const afterOpen = previous === '{' || previous === '['
    if (closing) depth--
    if ((closing && !afterOpen) || (!closing && afterOpen) || previous === ',') {
      output += '\n' + '  '.repeat(Math.min(depth, 24))
    }
    output += token === ':' ? ': ' : token
    if (token === '{' || token === '[') depth++
    previous = token
  }
  return output
}

/** Rewrite only complete top-level JSON fences, preserving surrounding Markdown verbatim. */
export function discussionMarkdown(text: string): string {
  const json = formatJson(text)
  if (json !== undefined) return '```json\n' + json + '\n```'
  let result = '', copied = 0
  let fence: { marker: string; body: number; json: boolean; indent: string } | undefined
  for (const match of text.matchAll(/^( {0,3})(`{3,}|~{3,})([^\r\n]*)(\r?\n|$)/gm)) {
    const indent = match[1]!, marker = match[2]!, info = match[3]!
    if (!fence) {
      if (marker.startsWith('`') && info.includes('`')) continue
      fence = { marker, body: match.index + match[0].length, json: /^(json)?$/i.test(info.trim()), indent }
    } else if (marker.startsWith(fence.marker) && !info.trim()) {
      const formatted = fence.json ? formatJson(text.slice(fence.body, match.index)) : undefined
      if (formatted !== undefined) {
        result += text.slice(copied, fence.body) + fence.indent + formatted.replaceAll('\n', '\n' + fence.indent) + '\n'
        copied = match.index
      }
      fence = undefined
    }
  }
  return copied ? result + text.slice(copied) : text
}
