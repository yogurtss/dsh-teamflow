import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createInterface } from 'node:readline'

const { chromium } = await import(process.env.TEAMFLOW_PLAYWRIGHT_MODULE ?? 'playwright')
const host = spawn(process.execPath, ['scripts/loop-preview.mjs'], {
  env: { ...process.env, TEAMFLOW_LOOP_PORT: '18387' }, stdio: ['pipe','pipe','inherit'], windowsHide: true,
})
const lines = createInterface({input:host.stdout})
let browser
try {
  for await (const line of lines) { if (line.includes('"url":')) break }
  browser = await chromium.launch({channel:'msedge',headless:true})
  const page = await browser.newPage({viewport:{width:1500,height:1000}})
  await page.goto('http://127.0.0.1:18387')
  await page.getByRole('button',{name:'关闭提示'}).click()
  await page.reload()
  await page.getByRole('button',{name:'使用指南'}).click()
  const anchors = []
  while (await page.locator('dialog[open]').count()) {
    anchors.push(await page.locator('[data-guide-active]').getAttribute('data-guide'))
    await page.getByRole('button',{name:'Got it'}).click()
  }
  assert.ok(['roster','inspector'].every(id=>anchors.includes(id)))
  assert.equal(await page.getByRole('button',{name:'关闭提示'}).count(),0)
  const card=page.locator('[data-canvas-node="a"]')
  const inspector=page.locator('[data-guide="inspector"]:visible').last()
  const memberButton=card.locator('[data-card-member]')
  const taskButton=card.locator('[data-card-task]')
  await memberButton.click()
  assert.match(await inspector.innerText(),/Agent · worker/)
  await taskButton.click()
  assert.match(await inspector.innerText(),/任务 · 方案/)
  for(const region of [memberButton.locator('img'),memberButton.locator('b'),taskButton,card.locator('[data-card-tone] > span:last-child')]){
    const before=await card.evaluate(node=>[node.offsetLeft,node.offsetTop])
    const bounds=await region.boundingBox()
    const x=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2
    await page.mouse.move(x,y)
    await page.mouse.down()
    await page.mouse.move(x+20,y+12,{steps:5})
    const saved=page.waitForResponse(res=>res.url().endsWith('/workflow') && res.request().postDataJSON()?.action==='layout')
    await page.mouse.up()
    assert.ok((await saved).ok())
    assert.notDeepEqual(await card.evaluate(node=>[node.offsetLeft,node.offsetTop]),before)
    assert.match(await inspector.innerText(),/任务 · 方案/)
  }
  await memberButton.focus()
  await page.keyboard.press('Enter')
  assert.match(await inspector.innerText(),/Agent · worker/)
  const canvas = page.locator('[data-linking]')
  const palette = page.locator('[data-guide="gate"]')
  await palette.dragTo(canvas,{targetPosition:{x:90,y:150}})
  const gate = page.locator('[data-canvas-node="t5"]')
  await gate.waitFor()
  assert.equal(await gate.getAttribute('data-node-shape'),'decision')
  assert.equal(await gate.locator('[data-connection-handle]').count(),3)
  await gate.getByRole('combobox').selectOption('ai')
  const panel = page.locator('[data-loop-panel]')
  await panel.getByLabel('独立审核成员').waitFor()
  assert.equal(await panel.getByLabel('审核方式').inputValue(),'ai')
  await panel.getByLabel('审核方式').selectOption('human')
  await page.waitForFunction(()=>document.querySelector('[data-canvas-node="t5"] select')?.value==='human')
  await page.locator('[data-guide="check"]').click()
  const acceptance=page.locator('[data-canvas-node="t6"]')
  await acceptance.waitFor()
  assert.equal(await acceptance.locator('[data-connection-handle]').count(),2)
  await acceptance.getByRole('combobox').selectOption('ai')
  await page.waitForFunction(()=>document.querySelector('[data-canvas-node="t6"]')?.dataset.gateMode==='ai')
  await page.reload()
  assert.equal(await acceptance.getByRole('combobox').inputValue(),'ai')
  const existing=page.locator('[data-canvas-node="gate"]')
  await page.locator('[data-guide="edit"]').click()
  await Promise.all([
    page.waitForResponse(res=>res.url().endsWith('/workflow') && res.request().postDataJSON()?.action==='layout'),
    page.getByRole('button',{name:'自动整理'}).click(),
  ])
  await page.getByRole('button',{name:'适应画布'}).click()
  await existing.getByRole('button',{name:'REJECT',exact:true}).dragTo(page.locator('[data-canvas-node="a"]'))
  const settings=page.locator('[data-loop-panel]')
  await page.waitForFunction(()=>document.querySelector('[data-loop-panel] select[aria-label="返回连线目标（必选）"]')?.value==='a',{},{timeout:4000})
  await settings.getByRole('button',{name:'连接返回线并创建环路'}).click()
  await page.locator('[data-flow-branch="reject"]').waitFor()
  await page.reload()
  await page.getByRole('button',{name:'收起循环任务'}).waitFor()
  assert.equal(await page.locator('[data-canvas-node="b"]').count(),1)
  console.log('Verified drag creation, both review modes, ports, reload and panel guide steps.')
} finally {
  await browser?.close()
  if (host.exitCode === null) { const done=once(host,'exit'); host.kill(); await done }
}
