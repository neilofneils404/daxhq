const { test, expect } = require('@playwright/test')

async function resetApp(page, url = '/') {
  await page.goto(url)
  await page.evaluate(() => {
    localStorage.clear()
  })
  await page.goto(url)
}

test('title screen loads and game starts', async ({ page }) => {
  await resetApp(page)

  await expect(page).toHaveTitle(/DAX HQ/i)
  await expect(page.getByRole('button', { name: 'Enter Chamber' })).toBeVisible()
  await expect(page.locator('#tutorialCard')).toBeVisible()

  await page.getByRole('button', { name: 'Enter Chamber' }).click()

  await expect(page.locator('body')).toHaveClass(/is-playing/)
  await expect(page.locator('#introPanel')).toHaveClass(/hidden/)

  const state = await page.evaluate(() => window.__daxhqDebug.getState())
  expect(state.mode).toBe('playing')
})

test('tutorial can be skipped and replayed through completion quickly', async ({ page }) => {
  await resetApp(page)

  await expect(page.locator('#tutorialCard')).toBeVisible()
  await page.getByRole('button', { name: 'Skip' }).click()
  await expect(page.locator('#tutorialCard')).toHaveClass(/hidden/)
  await expect(page.getByRole('button', { name: 'Replay Tutorial' })).toBeVisible()

  let tutorialState = await page.evaluate(() => localStorage.getItem('daxhq-tutorial-state'))
  expect(tutorialState).toBe('skipped')

  await page.getByRole('button', { name: 'Replay Tutorial' }).click()
  await expect(page.locator('#tutorialStepLabel')).toContainText('1/3')
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.locator('#tutorialStepLabel')).toContainText('2/3')
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.locator('#tutorialStepLabel')).toContainText('3/3')
  await page.getByRole('button', { name: 'Done' }).click()

  await expect(page.locator('#tutorialCard')).toHaveClass(/hidden/)
  tutorialState = await page.evaluate(() => localStorage.getItem('daxhq-tutorial-state'))
  expect(tutorialState).toBe('completed')
})

test('boss-win autotest reaches and clears a boss round', async ({ page }) => {
  await resetApp(page, '/?autotest=boss-win-threats')

  await page.locator('#autotest-result[data-status="done"]').waitFor()
  const result = JSON.parse(await page.locator('#autotest-result').textContent())

  expect(result.mode).toBe('playing')
  expect(result.bossLevel).toBeGreaterThanOrEqual(1)
  expect(result.score).toBeGreaterThan(0)
  expect(result.boss).toBeNull()
})

test('game-over can be forced and displayed via local debug hook', async ({ page }) => {
  await resetApp(page)

  await page.getByRole('button', { name: 'Enter Chamber' }).click()
  await page.evaluate(() => {
    window.__daxhqDebug.forceGameOver()
  })

  await expect(page.locator('#gameOverPanel')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run It Back' })).toBeVisible()

  const state = await page.evaluate(() => window.__daxhqDebug.getState())
  expect(state.mode).toBe('gameover')
})

test('progression stats persist after a run and boss clear', async ({ page }) => {
  await resetApp(page)

  await page.getByRole('button', { name: 'Enter Chamber' }).click()
  await page.evaluate(() => {
    window.__daxhqDebug.forceBossWinWithThreats()
  })
  await page.waitForTimeout(1800)
  await page.evaluate(() => {
    window.__daxhqDebug.forceGameOver()
  })

  const progress = await page.evaluate(() => window.__daxhqDebug.getProgress())

  expect(progress.runsStarted).toBeGreaterThanOrEqual(1)
  expect(progress.totalScore).toBeGreaterThan(0)
  expect(progress.bossesDefeated).toBeGreaterThanOrEqual(1)
  expect(progress.unlocked.length).toBeGreaterThan(0)
})

test('assist mode can be toggled and persists across reloads', async ({ page }) => {
  await resetApp(page)

  const assistButton = page.getByRole('button', { name: /Assist:/ })
  await expect(assistButton).toBeVisible()

  const initialSettings = await page.evaluate(() => window.__daxhqDebug.getSettings())
  const expectedStoredValue = initialSettings.assistMode ? 'off' : 'on'

  await assistButton.click()
  await expect(page.getByRole('button', { name: new RegExp(`Assist: ${initialSettings.assistMode ? 'Off' : 'On'}`) })).toBeVisible()

  let settings = await page.evaluate(() => window.__daxhqDebug.getSettings())
  expect(settings.assistMode).toBe(!initialSettings.assistMode)
  expect(settings.assistModeExplicit).toBe(true)

  await page.reload()

  await expect(page.getByRole('button', { name: new RegExp(`Assist: ${initialSettings.assistMode ? 'Off' : 'On'}`) })).toBeVisible()
  settings = await page.evaluate(() => window.__daxhqDebug.getSettings())
  expect(settings.assistMode).toBe(!initialSettings.assistMode)
  expect(settings.assistModeExplicit).toBe(true)
  expect(await page.evaluate(() => localStorage.getItem('daxhq-assist-mode'))).toBe(expectedStoredValue)
})
