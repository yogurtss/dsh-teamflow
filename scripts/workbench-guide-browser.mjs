/** Run against the stable workflow preview with TEAMFLOW_PREVIEW_ACTIVITY=1. */
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.TEAMFLOW_PLAYWRIGHT_MODULE ?? 'playwright')
const browser = await chromium.launch({ channel:'msedge', headless:true })
try {
  const page = await browser.newPage({ viewport:{ width:1500, height:1000 } })
  await page.goto(process.env.TEAMFLOW_GUIDE_URL ?? 'http://127.0.0.1:8371')
  await page.locator('[data-agent-teams-collapsed]').click()
  await page.locator('[data-guide="agent"]').waitFor()
  for (const [language, label] of [['zh','使用指南'], ['en','User guide']]) {
    await page.getByLabel('Preview language').selectOption(language)
    const trigger = page.getByRole('button', {name:label, exact:true})
    const expected = []
    for (const step of ['gallery','flow','roster','agent','task','edit','gate','check','inspector','run','archive','outcomes']) {
      if (await page.locator(`[data-guide="${step}"]:visible`).count()) expected.push(step)
    }
    await trigger.click()
    const popover = page.locator('dialog[open]')
    const visited = []
    while (await popover.count()) {
      const anchor = await page.locator('[data-guide-active]').getAttribute('data-guide')
      assert.ok(!visited.includes(anchor))
      visited.push(anchor)
      await popover.getByRole('button', {name:'Got it', exact:true}).click()
    }
    assert.deepEqual(visited, expected)
    await trigger.click()
    await page.keyboard.press('Escape')
    assert.equal(await popover.count(), 0)
    assert.ok(await trigger.evaluate(button => document.activeElement === button))
  }
} finally { await browser.close() }
