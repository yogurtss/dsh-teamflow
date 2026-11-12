import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getBuiltinTemplate } from '../lib/builtin-templates.js'
import { instantiateTemplate } from '../lib/templates.js'
import { createTeamDir, readTeam, readTeamSync, writeTeam } from '../lib/state.js'

test('stable Git installs can reopen a loop template and persist its original run', async t => {
  const root = await mkdtemp(join(tmpdir(), 'teamflow-stable-loop-'))
  t.after(() => rm(root, {recursive:true, force:true}))
  const template = getBuiltinTemplate('builtin-bugfix-loop', 1)
  const team = instantiateTemplate(template, 'demo', 'captain', 'Demo', 'Fix the regression')
  await createTeamDir(root, team)
  const saved = await readTeam(root, team.id)
  assert.deepEqual(saved.workflow.loops, team.workflow.loops)
  await writeTeam(root, saved)
  assert.deepEqual(readTeamSync(root, team.id).workflow.loops, team.workflow.loops)
})

test('stable installation excludes the development Super Agent route and sidebar', async () => {
  const server = await readFile(new URL('../lib/index.js', import.meta.url), 'utf8')
  const client = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.doesNotMatch(server, /installSuperAgent|super-agent\.js/)
  assert.doesNotMatch(client, /teamflow\/super-agent-card|plugins\/dsh-agent-teams\/super-agent/)
})
