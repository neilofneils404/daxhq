(function () {
  const canvas = document.getElementById("arena")
  const ctx = canvas.getContext("2d")

  const scoreValue = document.getElementById("scoreValue")
  const comboValue = document.getElementById("comboValue")
  const integrityValue = document.getElementById("integrityValue")
  const phaseValue = document.getElementById("phaseValue")
  const bestValue = document.getElementById("bestValue")
  const finalScoreValue = document.getElementById("finalScoreValue")
  const finalBestValue = document.getElementById("finalBestValue")
  const bossesDefeatedValue = document.getElementById("bossesDefeatedValue")
  const powerMeter = document.getElementById("powerMeter")
  const bossHud = document.getElementById("bossHud")
  const bossEyebrow = document.getElementById("bossEyebrow")
  const bossNameValue = document.getElementById("bossNameValue")
  const bossBarFill = document.getElementById("bossBarFill")
  const announcement = document.getElementById("announcement")
  const announcementKicker = document.getElementById("announcementKicker")
  const announcementTitle = document.getElementById("announcementTitle")
  const introPanel = document.getElementById("introPanel")
  const gameOverPanel = document.getElementById("gameOverPanel")
  const startButton = document.getElementById("startButton")
  const restartButton = document.getElementById("restartButton")
  const soundToggle = document.getElementById("soundToggle")
  const loadoutOptions = Array.from(document.querySelectorAll("[data-loadout]"))

  const STORAGE_KEY = "daxhq-best-score"
  const FIRST_BOSS_SCORE = 420
  const BOSS_VARIANTS = [
    {
      name: "Rift Warden",
      shape: "orbital",
      bodyColor: "255, 109, 58",
      accentColor: "140, 236, 255",
      eyeColor: "255, 211, 107",
      slashColor: "255, 94, 74",
      slashCore: "255, 218, 165",
      volleyBonus: 0,
      spreadBonus: 0,
      slashBonus: 0,
      guardNeeded: 3,
      movementScale: 1
    },
    {
      name: "Chrome Reaper",
      shape: "reaper",
      bodyColor: "118, 212, 255",
      accentColor: "255, 150, 96",
      eyeColor: "223, 255, 255",
      slashColor: "255, 150, 96",
      slashCore: "255, 246, 210",
      volleyBonus: 1,
      spreadBonus: 0.16,
      slashBonus: 1,
      guardNeeded: 4,
      movementScale: 1.15
    },
    {
      name: "Solar Fang",
      shape: "fang",
      bodyColor: "255, 186, 72",
      accentColor: "140, 236, 255",
      eyeColor: "255, 246, 210",
      slashColor: "255, 186, 72",
      slashCore: "255, 249, 227",
      volleyBonus: 0,
      spreadBonus: 0.08,
      slashBonus: 2,
      guardNeeded: 4,
      movementScale: 0.92
    },
    {
      name: "Nebula Tyrant",
      shape: "tyrant",
      bodyColor: "126, 255, 176",
      accentColor: "255, 166, 82",
      eyeColor: "223, 255, 255",
      slashColor: "126, 255, 176",
      slashCore: "234, 255, 242",
      volleyBonus: 2,
      spreadBonus: 0.24,
      slashBonus: 1,
      guardNeeded: 5,
      movementScale: 1.2
    },
    {
      name: "Shadow Howler",
      shape: "crescent",
      bodyColor: "255, 94, 74",
      accentColor: "168, 204, 255",
      eyeColor: "255, 246, 210",
      slashColor: "255, 94, 74",
      slashCore: "255, 226, 210",
      volleyBonus: 1,
      spreadBonus: 0.28,
      slashBonus: 2,
      guardNeeded: 5,
      movementScale: 1.32
    }
  ]
  const SABER_LOADOUTS = {
    blue: {
      id: "blue",
      player: {
        blade: "140, 236, 255",
        core: "223, 255, 255",
        trail: "118, 212, 255",
        hilt: "255, 211, 107",
        grip: "22, 30, 42"
      },
      enemy: {
        blade: "255, 94, 74",
        core: "255, 226, 210"
      }
    },
    green: {
      id: "green",
      player: {
        blade: "126, 255, 176",
        core: "234, 255, 242",
        trail: "126, 255, 176",
        hilt: "255, 211, 107",
        grip: "22, 30, 42"
      },
      enemy: {
        blade: "255, 109, 58",
        core: "255, 246, 210"
      }
    },
    red: {
      id: "red",
      player: {
        blade: "255, 94, 74",
        core: "255, 226, 210",
        trail: "255, 150, 96",
        hilt: "223, 255, 255",
        grip: "18, 22, 34"
      },
      enemy: {
        blade: "118, 212, 255",
        core: "223, 255, 255"
      }
    },
    amber: {
      id: "amber",
      player: {
        blade: "255, 186, 72",
        core: "255, 240, 191",
        trail: "255, 211, 107",
        hilt: "223, 255, 255",
        grip: "22, 30, 42"
      },
      enemy: {
        blade: "140, 236, 255",
        core: "223, 255, 255"
      }
    }
  }

  const TWO_PI = Math.PI * 2
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
  const mix = (a, b, amount) => a + (b - a) * amount
  const rand = (min, max) => min + Math.random() * (max - min)
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

  function readBestScore() {
    try {
      return Number.parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10) || 0
    } catch {
      return 0
    }
  }

  function writeBestScore(value) {
    try {
      localStorage.setItem(STORAGE_KEY, String(value))
    } catch {}
  }

  const audio = {
    enabled: true,
    context: null,
    ready: false,
    masterGain: null,
    compressor: null,
    unlockPromise: null,
    primed: false,
    samplePrimed: false,
    samplePools: {},
    sampleIndexes: {},
    activeClips: new Set()
  }
  const SAMPLE_AUDIO_FILES = {
    start: "./audio/start.wav",
    deflect: "./audio/deflect.wav",
    parry: "./audio/parry.wav",
    damage: "./audio/damage.wav",
    bossSpawn: "./audio/boss-spawn.wav",
    bossDamage: "./audio/boss-damage.wav",
    victory: "./audio/victory.wav",
    gameOver: "./audio/game-over.wav"
  }
  const SAMPLE_POOL_SIZES = {
    start: 2,
    deflect: 4,
    parry: 4,
    damage: 3,
    bossSpawn: 2,
    bossDamage: 3,
    victory: 2,
    gameOver: 2
  }

  const state = {
    mode: "title",
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    lastTime: 0,
    titleElapsed: 0,
    elapsed: 0,
    spawnTimer: 0.55,
    slashTimer: 1.7,
    mineTimer: 3.2,
    bossIntroTimer: 0,
    cooldownTimer: 0,
    score: 0,
    combo: 0,
    integrity: 100,
    best: readBestScore(),
    bossesDefeated: 0,
    bossLevel: 0,
    nextBossScore: FIRST_BOSS_SCORE,
    phaseLabel: "Standby",
    pulse: 0,
    damageFlash: 0,
    shake: 0,
    announcementTimer: 0,
    parryHintShown: false,
    selectedLoadout: "blue",
    hudDirty: true,
    center: {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.58,
      radius: Math.min(window.innerWidth, window.innerHeight) * 0.08
    },
    pointer: {
      targetX: window.innerWidth * 0.5,
      targetY: window.innerHeight * 0.68,
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.68,
      lastX: window.innerWidth * 0.5,
      lastY: window.innerHeight * 0.68,
      angle: -Math.PI / 3,
      pointerType: "mouse",
      speed: 0,
      power: 0,
      hitCooldown: 0
    },
    playerBlade: null,
    playerPalette: SABER_LOADOUTS.blue.player,
    enemyPalette: SABER_LOADOUTS.blue.enemy,
    trail: [],
    bolts: [],
    mines: [],
    slashes: [],
    particles: [],
    rings: [],
    stars: [],
    boss: null
  }

  function getBossVariant(level) {
    return BOSS_VARIANTS[(level - 1) % BOSS_VARIANTS.length]
  }

  function getBossCycle(level) {
    return Math.floor((level - 1) / BOSS_VARIANTS.length)
  }

  function bossNameForLevel(level) {
    return getBossVariant(level).name
  }

  function getLoadout(id) {
    return SABER_LOADOUTS[id] || SABER_LOADOUTS.blue
  }

  function setLoadout(id) {
    const loadout = getLoadout(id)

    state.selectedLoadout = loadout.id
    state.playerPalette = loadout.player
    state.enemyPalette = loadout.enemy

    for (const option of loadoutOptions) {
      option.classList.toggle("is-selected", option.dataset.loadout === loadout.id)
    }

    markHudDirty()
  }

  function getArenaRamp() {
    const timeRamp = clamp((state.elapsed - 8) / 72, 0, 1)
    const bossRamp = clamp(state.bossesDefeated / 4, 0, 1)

    return clamp(timeRamp * 0.72 + bossRamp * 0.45, 0, 1)
  }

  function usingCoarseInput() {
    return (
      state.pointer.pointerType === "touch" ||
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0
    )
  }

  function shouldUseSampleAudio() {
    return usingCoarseInput()
  }

  function ensureSampleBank() {
    const keys = Object.keys(SAMPLE_AUDIO_FILES)

    if (Object.keys(audio.samplePools).length === keys.length) {
      return
    }

    for (const [name, src] of Object.entries(SAMPLE_AUDIO_FILES)) {
      if (audio.samplePools[name]) {
        continue
      }

      const size = SAMPLE_POOL_SIZES[name] || 2
      audio.samplePools[name] = Array.from({ length: size }, () => {
        const clip = document.createElement("audio")
        clip.src = src
        clip.preload = "auto"
        clip.playsInline = true
        clip.setAttribute("playsinline", "true")
        clip.setAttribute("webkit-playsinline", "true")
        clip.style.display = "none"
        document.body.appendChild(clip)
        clip.load()
        return clip
      })
      audio.sampleIndexes[name] = 0
    }
  }

  function primeSampleAudio() {
    ensureSampleBank()

    if (audio.samplePrimed) {
      return true
    }

    for (const pool of Object.values(audio.samplePools)) {
      for (const clip of pool) {
        clip.muted = true

        try {
          const playPromise = clip.play()

          if (playPromise && typeof playPromise.then === "function") {
            playPromise.catch(() => {})
          }
        } catch {}

        clip.pause()

        try {
          clip.currentTime = 0
        } catch {}

        clip.muted = false
      }
    }

    audio.samplePrimed = true
    return true
  }

  function playSample(name, volume = 1) {
    if (!audio.enabled) {
      return false
    }

    ensureSampleBank()
    const pool = audio.samplePools[name]

    if (!pool || pool.length === 0) {
      return false
    }

    const index = audio.sampleIndexes[name] || 0
    const clip = pool[index]
    audio.sampleIndexes[name] = (index + 1) % pool.length

    clip.pause()

    try {
      clip.currentTime = 0
    } catch {}

    clip.volume = volume
    audio.activeClips.add(clip)

    const cleanup = () => {
      audio.activeClips.delete(clip)
    }

    clip.addEventListener("ended", cleanup, { once: true })
    clip.addEventListener("error", cleanup, { once: true })

    const playPromise = clip.play()

    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          audio.samplePrimed = true
        })
        .catch(() => {
          cleanup()
        })
    }

    return true
  }

  function markHudDirty() {
    state.hudDirty = true
  }

  function setPhaseLabel(label) {
    state.phaseLabel = label
    markHudDirty()
  }

  function resize() {
    state.width = window.innerWidth
    state.height = window.innerHeight
    state.dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(state.width * state.dpr)
    canvas.height = Math.round(state.height * state.dpr)
    canvas.style.width = `${state.width}px`
    canvas.style.height = `${state.height}px`
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0)

    state.center.x = state.width * 0.5
    state.center.y = state.height * 0.58
    state.center.radius = Math.min(state.width, state.height) * 0.08

    if (state.boss) {
      state.boss.targetY = state.height * 0.22
    }

    rebuildStars()

    if (state.trail.length === 0) {
      resetPointer(state.width * 0.5, state.height * 0.68)
    }
  }

  function rebuildStars() {
    const count = Math.max(60, Math.round((state.width * state.height) / 15000))
    state.stars = Array.from({ length: count }, () => ({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      size: rand(0.6, 2.2),
      depth: rand(0.2, 1),
      twinkle: rand(0.8, 2.2),
      seed: rand(0, TWO_PI)
    }))
  }

  function resetPointer(x, y) {
    state.pointer.targetX = x
    state.pointer.targetY = y
    state.pointer.x = x
    state.pointer.y = y
    state.pointer.lastX = x
    state.pointer.lastY = y
    state.pointer.pointerType = usingCoarseInput() ? "touch" : "mouse"
    state.pointer.speed = 0
    state.pointer.power = 0
    state.pointer.angle = -Math.PI / 3
    state.trail = []

    for (let index = 0; index < 12; index += 1) {
      state.trail.push({
        x: x + index * 8,
        y: y + index * 3
      })
    }

    updatePlayerBlade()
  }

  function addScore(amount) {
    state.score += Math.round(amount)

    if (state.score > state.best) {
      state.best = state.score
      writeBestScore(state.best)
    }

    markHudDirty()
  }

  function updateHud(force = false) {
    if (!force && !state.hudDirty) {
      return
    }

    scoreValue.textContent = String(state.score).padStart(4, "0")
    comboValue.textContent = `${state.combo}x`
    integrityValue.textContent = `${Math.max(0, Math.round(state.integrity))}%`
    phaseValue.textContent = state.phaseLabel
    bestValue.textContent = String(state.best).padStart(4, "0")
    powerMeter.style.transform = `scaleX(${clamp(state.pointer.power, 0.04, 1)})`

    if (state.boss && state.boss.phase !== "dying") {
      bossEyebrow.textContent =
        state.boss.vulnerableTimer > 0
          ? `Boss Round ${String(state.boss.level).padStart(2, "0")} // Weak Point Open`
          : `Boss Round ${String(state.boss.level).padStart(2, "0")} // Guard ${Math.ceil(
              state.boss.guardHits
            )}/${state.boss.guardNeeded}`
      bossNameValue.textContent = state.boss.name
      bossBarFill.style.transform = `scaleX(${clamp(
        state.boss.health / state.boss.maxHealth,
        0,
        1
      )})`
      bossHud.classList.remove("hidden")
    } else {
      bossBarFill.style.transform = "scaleX(0)"
      bossHud.classList.add("hidden")
    }

    state.hudDirty = false
  }

  function showAnnouncement(kicker, title, duration = 2.2) {
    announcementKicker.textContent = kicker
    announcementTitle.textContent = title
    state.announcementTimer = duration
    announcement.classList.add("is-visible")
  }

  function hideAnnouncement() {
    state.announcementTimer = 0
    announcement.classList.remove("is-visible")
  }

  function updateAnnouncement(dt) {
    if (state.announcementTimer <= 0) {
      return
    }

    state.announcementTimer -= dt

    if (state.announcementTimer <= 0) {
      announcement.classList.remove("is-visible")
    }
  }

  function updateSoundLabel() {
    if (!audio.enabled) {
      soundToggle.textContent = "Sound: Off"
      return
    }

    if (!audio.context) {
      soundToggle.textContent = "Sound: On"
      return
    }

    soundToggle.textContent = audio.ready ? "Sound: On" : "Sound: Tap To Arm"
  }

  async function ensureAudio() {
    if (!audio.context) {
      const Context = window.AudioContext || window.webkitAudioContext

      if (!Context) {
        audio.enabled = false
        soundToggle.textContent = "Sound: Unsupported"
        soundToggle.disabled = true
        return
      }

      audio.context = new Context({
        latencyHint: "interactive"
      })
      audio.compressor = audio.context.createDynamicsCompressor()
      audio.masterGain = audio.context.createGain()
      audio.compressor.threshold.value = -18
      audio.compressor.knee.value = 18
      audio.compressor.ratio.value = 12
      audio.compressor.attack.value = 0.003
      audio.compressor.release.value = 0.22
      audio.masterGain.gain.value = 0.72
      audio.masterGain.connect(audio.compressor)
      audio.compressor.connect(audio.context.destination)
    }

    if (audio.context.state !== "running") {
      if (!audio.unlockPromise) {
        audio.unlockPromise = audio.context
          .resume()
          .catch(() => {})
          .finally(() => {
            audio.unlockPromise = null
          })
      }

      await audio.unlockPromise
    }

    audio.ready = audio.context.state === "running"

    if (audio.ready && !audio.primed && !shouldUseSampleAudio()) {
      playTone({
        frequency: usingCoarseInput() ? 720 : 520,
        slideTo: usingCoarseInput() ? 940 : 740,
        duration: 0.05,
        type: "triangle",
        gain: usingCoarseInput() ? 0.045 : 0.026,
        filterFrequency: usingCoarseInput() ? 7200 : 5200,
        voices: [1, 2]
      })
      audio.primed = true
    }

    updateSoundLabel()
    return audio.ready
  }

  function playTone({
    frequency,
    duration = 0.12,
    type = "sine",
    gain = 0.03,
    slideTo = frequency,
    delay = 0,
    attack = 0.008,
    filterFrequency = 4200,
    voices = [1, 2]
  }) {
    if (!audio.enabled || !audio.context || !audio.masterGain) {
      return
    }

    if (audio.context.state !== "running") {
      audio.ready = false
      return
    }

    const now = audio.context.currentTime + delay
    const outputGain = audio.context.createGain()
    const lowpass = audio.context.createBiquadFilter()
    const highpass = audio.context.createBiquadFilter()
    const coarseMix = usingCoarseInput()
    const frequencyScale = coarseMix ? 1.55 : 1
    const adjustedFrequency = frequency * frequencyScale
    const adjustedSlideTo = slideTo * frequencyScale
    const adjustedGain = gain * (coarseMix ? 1.22 : 1)
    const adjustedFilterFrequency = filterFrequency * (coarseMix ? 1.6 : 1)

    highpass.type = "highpass"
    highpass.frequency.setValueAtTime(coarseMix ? 320 : 180, now)
    highpass.Q.value = coarseMix ? 0.9 : 0.7
    lowpass.type = "lowpass"
    lowpass.frequency.setValueAtTime(adjustedFilterFrequency, now)
    lowpass.Q.value = coarseMix ? 1.1 : 0.8

    outputGain.gain.setValueAtTime(0.0001, now)
    outputGain.gain.linearRampToValueAtTime(adjustedGain, now + attack)
    outputGain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    highpass.connect(lowpass)
    lowpass.connect(outputGain)
    outputGain.connect(audio.masterGain)

    for (let index = 0; index < voices.length; index += 1) {
      const oscillator = audio.context.createOscillator()
      const oscillatorGain = audio.context.createGain()
      const ratio = voices[index]
      const level = 1 / (1 + index * 1.25)

      oscillator.type = type
      oscillator.frequency.setValueAtTime(adjustedFrequency * ratio, now)
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(70, adjustedSlideTo * ratio),
        now + duration
      )
      oscillator.detune.value = index === 0 ? 0 : (index % 2 === 0 ? -7 : 7)
      oscillatorGain.gain.value = level
      oscillator.connect(oscillatorGain)
      oscillatorGain.connect(highpass)
      oscillator.start(now)
      oscillator.stop(now + duration)
    }
  }

  function playStartSound() {
    if (shouldUseSampleAudio() && playSample("start", 0.88)) {
      return
    }

    playTone({
      frequency: 300,
      slideTo: 430,
      duration: 0.18,
      type: "triangle",
      gain: 0.12,
      filterFrequency: 3800,
      voices: [1, 1.5]
    })
    playTone({
      frequency: 430,
      slideTo: 680,
      duration: 0.24,
      delay: 0.1,
      type: "triangle",
      gain: 0.1,
      filterFrequency: 4600,
      voices: [1, 2]
    })
  }

  function playDeflectSound() {
    if (shouldUseSampleAudio() && playSample("deflect", 0.76)) {
      return
    }

    playTone({
      frequency: rand(680, 920),
      slideTo: rand(360, 520),
      duration: 0.14,
      type: "sawtooth",
      gain: 0.09,
      filterFrequency: 5200,
      voices: [1, 2.02]
    })
  }

  function playParrySound() {
    if (shouldUseSampleAudio() && playSample("parry", 0.82)) {
      return
    }

    playTone({
      frequency: rand(520, 760),
      slideTo: rand(260, 380),
      duration: 0.18,
      type: "triangle",
      gain: 0.11,
      filterFrequency: 4200,
      voices: [1, 1.5, 2]
    })
  }

  function playDamageSound() {
    if (shouldUseSampleAudio() && playSample("damage", 0.9)) {
      return
    }

    playTone({
      frequency: 240,
      slideTo: 120,
      duration: 0.24,
      type: "square",
      gain: 0.12,
      filterFrequency: 2600,
      voices: [1, 0.5]
    })
  }

  function playBossSpawnSound() {
    if (shouldUseSampleAudio() && playSample("bossSpawn", 0.88)) {
      return
    }

    playTone({
      frequency: 180,
      slideTo: 460,
      duration: 0.48,
      type: "sawtooth",
      gain: 0.12,
      filterFrequency: 3600,
      voices: [1, 1.5, 2]
    })
  }

  function playBossDamageSound() {
    if (shouldUseSampleAudio() && playSample("bossDamage", 0.78)) {
      return
    }

    playTone({
      frequency: rand(340, 460),
      slideTo: rand(180, 240),
      duration: 0.2,
      type: "square",
      gain: 0.1,
      filterFrequency: 3200,
      voices: [1, 1.5]
    })
  }

  function playVictorySound() {
    if (shouldUseSampleAudio() && playSample("victory", 0.9)) {
      return
    }

    playTone({
      frequency: 260,
      slideTo: 420,
      duration: 0.22,
      type: "triangle",
      gain: 0.11,
      filterFrequency: 3000,
      voices: [1, 2]
    })
    playTone({
      frequency: 360,
      slideTo: 620,
      duration: 0.28,
      delay: 0.12,
      type: "triangle",
      gain: 0.09,
      filterFrequency: 3400,
      voices: [1, 2]
    })
  }

  function playGameOverSound() {
    if (shouldUseSampleAudio() && playSample("gameOver", 0.94)) {
      return
    }

    playTone({
      frequency: 220,
      slideTo: 70,
      duration: 0.46,
      type: "triangle",
      gain: 0.11,
      filterFrequency: 1800,
      voices: [1, 0.5]
    })
  }

  function cross(ax, ay, bx, by) {
    return ax * by - ay * bx
  }

  function distanceToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax
    const dy = by - ay

    if (dx === 0 && dy === 0) {
      return Math.hypot(px - ax, py - ay)
    }

    const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1)
    const x = ax + dx * t
    const y = ay + dy * t

    return Math.hypot(px - x, py - y)
  }

  function closestPointOnSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax
    const dy = by - ay

    if (dx === 0 && dy === 0) {
      return { x: ax, y: ay }
    }

    const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1)

    return {
      x: ax + dx * t,
      y: ay + dy * t
    }
  }

  function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    const rX = bx - ax
    const rY = by - ay
    const sX = dx - cx
    const sY = dy - cy
    const denominator = cross(rX, rY, sX, sY)

    if (denominator === 0) {
      return false
    }

    const u = cross(cx - ax, cy - ay, rX, rY) / denominator
    const t = cross(cx - ax, cy - ay, sX, sY) / denominator

    return t >= 0 && t <= 1 && u >= 0 && u <= 1
  }

  function distanceBetweenSegments(ax, ay, bx, by, cx, cy, dx, dy) {
    if (segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy)) {
      return 0
    }

    return Math.min(
      distanceToSegment(ax, ay, cx, cy, dx, dy),
      distanceToSegment(bx, by, cx, cy, dx, dy),
      distanceToSegment(cx, cy, ax, ay, bx, by),
      distanceToSegment(dx, dy, ax, ay, bx, by)
    )
  }

  function spawnSparks(x, y, count, palette) {
    const colors =
      palette === "ember"
        ? ["255, 150, 96", "255, 210, 122", "255, 109, 58"]
        : palette === "enemy"
          ? [state.enemyPalette.blade, state.enemyPalette.core, state.enemyPalette.blade]
          : palette === "player"
            ? [state.playerPalette.blade, state.playerPalette.core, state.playerPalette.trail]
            : ["140, 236, 255", "223, 255, 255", "118, 212, 255"]

    for (let index = 0; index < count; index += 1) {
      const angle = rand(0, TWO_PI)
      const speed = rand(40, 280)
      const life = rand(0.24, 0.62)

      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: rand(1.2, 3.6),
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }
  }

  function spawnRing(
    x,
    y,
    { color = "140, 236, 255", life = 0.55, radius = 18, growth = 84, lineWidth = 2.2 } = {}
  ) {
    state.rings.push({
      x,
      y,
      color,
      life,
      maxLife: life,
      radius,
      growth,
      lineWidth
    })
  }

  function updateParticles(dt) {
    for (let index = state.particles.length - 1; index >= 0; index -= 1) {
      const particle = state.particles[index]

      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      particle.vx *= 0.985
      particle.vy *= 0.985
      particle.life -= dt

      if (particle.life <= 0) {
        state.particles.splice(index, 1)
      }
    }
  }

  function updateRings(dt) {
    for (let index = state.rings.length - 1; index >= 0; index -= 1) {
      const ring = state.rings[index]

      ring.life -= dt
      ring.radius += ring.growth * dt

      if (ring.life <= 0) {
        state.rings.splice(index, 1)
      }
    }
  }

  function updateMines(dt) {
    for (let index = state.mines.length - 1; index >= 0; index -= 1) {
      const mine = state.mines[index]

      if (!mine) {
        continue
      }

      mine.life -= dt
      mine.pulse += dt * 3

      const toCoreX = state.center.x - mine.x
      const toCoreY = state.center.y - mine.y
      const distanceToCore = Math.hypot(toCoreX, toCoreY) || 1
      const tangentX = -toCoreY / distanceToCore
      const tangentY = toCoreX / distanceToCore

      mine.vx += ((toCoreX / distanceToCore) * 12 + tangentX * mine.orbitStrength * mine.orbitDirection) * dt
      mine.vy += ((toCoreY / distanceToCore) * 12 + tangentY * mine.orbitStrength * mine.orbitDirection) * dt
      mine.vx *= 0.992
      mine.vy *= 0.992
      mine.x += mine.vx * dt
      mine.y += mine.vy * dt

      if (state.pointer.hitCooldown <= 0 && state.pointer.speed > 155) {
        const segments = getPlayerCollisionSegments()

        for (const segment of segments) {
          const contactDistance = distanceToSegment(
            mine.x,
            mine.y,
            segment.ax,
            segment.ay,
            segment.bx,
            segment.by
          )

          if (contactDistance <= mine.radius + 8 + state.pointer.power * 8) {
            state.pointer.hitCooldown = 0.04
            addScore(18)
            spawnSparks(mine.x, mine.y, 20, "ice")
            spawnRing(mine.x, mine.y, {
              color: state.playerPalette.blade,
              radius: 16,
              life: 0.45,
              growth: 108
            })
            playDeflectSound()
            state.mines.splice(index, 1)
            break
          }
        }

        if (!state.mines[index]) {
          continue
        }
      }

      if (mine.life <= 0 || distanceToCore < state.center.radius + mine.radius * 0.58) {
        damageCore(mine.damage, mine.x, mine.y)
        state.mines.splice(index, 1)
      }
    }
  }

  function cleanupHostileThreats(clearAll = false) {
    state.slashes.length = 0
    state.mines.length = 0

    if (clearAll) {
      state.bolts.length = 0
      return
    }

    const survivors = state.bolts.filter((bolt) => bolt.deflected)
    state.bolts.length = 0
    state.bolts.push(...survivors)
  }

  function createBolt({
    x,
    y,
    targetX,
    targetY,
    speed,
    heavy = false,
    owner = "raider"
  }) {
    const dx = targetX - x
    const dy = targetY - y
    const length = Math.hypot(dx, dy) || 1

    const hostile = owner === "boss" || owner === "raider"

    state.bolts.push({
      x,
      y,
      prevX: x,
      prevY: y,
      vx: (dx / length) * speed,
      vy: (dy / length) * speed,
      speed,
      radius: heavy ? 7.7 : 5.3,
      life: heavy ? 3.2 : 2.5,
      deflected: false,
      owner,
      heavy,
      damage: heavy ? 16 : 11,
      color: hostile ? state.enemyPalette.blade : heavy ? "255, 166, 82" : "255, 109, 58"
    })
  }

  function randomPerimeterPoint(radiusScale = 0.55) {
    const angle = rand(-Math.PI, Math.PI)
    const radius = Math.min(state.width, state.height) * radiusScale

    return {
      x: state.center.x + Math.cos(angle) * radius * 1.22,
      y: state.center.y + Math.sin(angle) * radius * 0.84
    }
  }

  function spawnAmbientBolt() {
    const origin = randomPerimeterPoint(0.72)
    const aimAngle = rand(0, TWO_PI)
    const aimRadius = rand(0, state.center.radius * 0.68)
    const heavy = Math.random() < 0.22
    const ramp = getArenaRamp()

    createBolt({
      x: origin.x,
      y: origin.y,
      targetX: state.center.x + Math.cos(aimAngle) * aimRadius,
      targetY: state.center.y + Math.sin(aimAngle) * aimRadius,
      speed: rand(248, 320) + ramp * 138 + state.combo * 1.3 + (heavy ? 42 : 0),
      heavy,
      owner: "raider"
    })

    spawnRing(origin.x, origin.y, {
      color: state.enemyPalette.blade,
      radius: 14,
      life: 0.35,
      growth: 116
    })
    spawnSparks(origin.x, origin.y, heavy ? 10 : 6, "enemy")
  }

  function spawnWave() {
    const ramp = getArenaRamp()
    const burstChance = mix(0.05, 0.34, ramp)
    let boltsThisWave = 1 + (Math.random() < burstChance ? 1 : 0)

    if (ramp > 0.62 && Math.random() < burstChance * 0.42) {
      boltsThisWave += 1
    }

    for (let index = 0; index < boltsThisWave; index += 1) {
      spawnAmbientBolt()
    }
  }

  function spawnMine(options = {}) {
    const origin =
      options.origin ||
      randomPerimeterPoint(options.radiusScale ?? rand(0.62, 0.82))
    const orbitDirection = Math.random() < 0.5 ? -1 : 1
    const dx = state.center.x - origin.x
    const dy = state.center.y - origin.y
    const distance = Math.hypot(dx, dy) || 1
    const speed =
      rand(54, 82) + clamp(state.elapsed * 0.4, 0, 18) + (options.speedBonus || 0)
    const color = options.color || "255, 166, 82"
    const radius = options.radius || rand(16, 21)
    const damage = options.damage || 18
    const life = options.life || rand(9, 12)

    state.mines.push({
      x: origin.x,
      y: origin.y,
      vx: (dx / distance) * speed,
      vy: (dy / distance) * speed,
      orbitDirection,
      orbitStrength: options.orbitStrength || rand(18, 34),
      radius,
      pulse: rand(0, TWO_PI),
      life,
      damage,
      color
    })

    spawnRing(origin.x, origin.y, {
      color,
      radius: 14,
      life: 0.4,
      growth: 102
    })
  }

  function spawnSlash({
    originX,
    originY,
    targetX,
    targetY,
    owner = "raider",
    width = 16,
    damage = 14,
    scoreValue = 28,
    bossDamage = 0,
    telegraphDuration = 0.82,
    activeDuration = 0.26,
    fadeDuration = 0.28,
    sweep = rand(0.82, 1.08) * (Math.random() < 0.5 ? -1 : 1),
    lengthExtra = 82,
    emitterRadius = 12
  }) {
    const baseAngle = Math.atan2(targetY - originY, targetX - originX)
    const distance = Math.hypot(targetX - originX, targetY - originY)

    state.slashes.push({
      owner,
      originX,
      originY,
      targetX,
      targetY,
      startAngle: baseAngle + sweep * 0.5,
      endAngle: baseAngle - sweep * 0.5,
      currentAngle: baseAngle + sweep * 0.5,
      length: distance + lengthExtra,
      width,
      damage,
      scoreValue,
      bossDamage,
      telegraphDuration,
      activeDuration,
      fadeDuration,
      emitterRadius,
      age: 0,
      parried: false,
      parryTimer: 0,
      hit: false,
      color: owner === "boss" || owner === "raider" ? state.enemyPalette.blade : "255, 109, 58",
      coreColor: owner === "boss" || owner === "raider" ? state.enemyPalette.core : "255, 246, 210"
    })

    spawnRing(originX, originY, {
      color: owner === "boss" || owner === "raider" ? state.enemyPalette.blade : "255, 109, 58",
      radius: emitterRadius,
      life: 0.32,
      growth: 96
    })
  }

  function spawnRaiderSlash() {
    const anchor = randomPerimeterPoint(rand(0.42, 0.52))
    const targetAngle = rand(0, TWO_PI)
    const targetRadius = rand(0, state.center.radius * 0.74)

    if (!state.parryHintShown) {
      state.parryHintShown = true
      showAnnouncement("Parry Saber", "Cut Through The Enemy Swing", 1.55)
    }

    spawnSlash({
      originX: anchor.x,
      originY: anchor.y,
      targetX: state.center.x + Math.cos(targetAngle) * targetRadius,
      targetY: state.center.y + Math.sin(targetAngle) * targetRadius,
      owner: "raider",
      width: rand(14, 18),
      damage: 13,
      scoreValue: 30,
      telegraphDuration: rand(0.7, 0.94),
      activeDuration: rand(0.22, 0.29),
      fadeDuration: 0.28,
      sweep: rand(0.84, 1.14) * (Math.random() < 0.5 ? -1 : 1),
      lengthExtra: rand(68, 104),
      emitterRadius: 12
    })
  }

  function startBossIntro() {
    if (state.mode !== "playing" || state.boss || state.bossIntroTimer > 0) {
      return
    }

    const level = state.bossLevel + 1
    const variant = getBossVariant(level)

    cleanupHostileThreats()
    state.bossIntroTimer = 2
    setPhaseLabel(`Boss ${String(level).padStart(2, "0")}`)
    showAnnouncement("Boss Incoming", bossNameForLevel(level), 2.1)
    spawnRing(state.center.x, state.height * 0.22, {
      color: variant.slashColor,
      radius: 26,
      life: 0.8,
      growth: 180,
      lineWidth: 3.4
    })
    playBossSpawnSound()
  }

  function spawnBoss() {
    const level = state.bossLevel + 1
    const variant = getBossVariant(level)
    const cycle = getBossCycle(level)
    const rank = clamp((level - 1) / 8, 0, 1)
    const maxHealth = 116 + level * 58 + cycle * 18

    state.boss = {
      level,
      name: variant.name,
      variant,
      x: state.center.x,
      y: -140,
      targetY: state.height * 0.22,
      radius: Math.min(58 + level * 6, 82),
      health: maxHealth,
      maxHealth,
      guardHits: 0,
      guardNeeded: variant.guardNeeded + cycle,
      vulnerableTimer: 0,
      guardCooldown: 0,
      damageCooldown: 0,
      pressureTimer: 0,
      pressureCooldown: 0,
      phase: "enter",
      volleyTimer: mix(1.48, 1.08, rank),
      slashTimer: mix(2.7, 2.05, rank),
      specialTimer: mix(6.2, 3.8, rank),
      rage: 0,
      moveSeed: rand(0, TWO_PI),
      hitFlash: 0,
      defeatTimer: 0
    }

    bossHud.classList.remove("hidden")
    markHudDirty()
  }

  function breakBossGuard(x, y) {
    if (!state.boss || state.boss.phase === "dying") {
      return
    }

    state.boss.vulnerableTimer = Math.max(1.8, 2.55 - (state.boss.level - 1) * 0.08)
    state.boss.guardHits = 0
    state.boss.guardCooldown = 0.2
    state.boss.pressureTimer = 0
    state.boss.volleyTimer = Math.max(state.boss.volleyTimer, 0.7)
    state.boss.slashTimer = Math.max(state.boss.slashTimer, 0.9)
    state.pulse = 1
    state.shake = Math.min(20, state.shake + 6)
    showAnnouncement("Weak Point Open", state.boss.name, 1.35)
    spawnRing(x, y, {
      color: state.playerPalette.blade,
      radius: 22,
      life: 0.55,
      growth: 124,
      lineWidth: 3
    })
    markHudDirty()
  }

  function advanceBossGuard(amount, x, y) {
    if (!state.boss || state.boss.phase === "dying") {
      return false
    }

    if (state.boss.vulnerableTimer > 0) {
      return true
    }

    if (state.boss.guardCooldown > 0) {
      return false
    }

    state.boss.guardHits = clamp(state.boss.guardHits + amount, 0, state.boss.guardNeeded)
    state.boss.guardCooldown = 0.26
    state.boss.hitFlash = 0.65
    spawnSparks(x, y, 12, "player")
    spawnRing(x, y, {
      color: state.playerPalette.blade,
      radius: 12,
      life: 0.3,
      growth: 80
    })
    playParrySound()

    if (state.boss.guardHits >= state.boss.guardNeeded) {
      breakBossGuard(x, y)
      return true
    }

    markHudDirty()
    return false
  }

  function damageBoss(amount, x, y) {
    if (!state.boss || state.boss.phase === "dying") {
      return
    }

    if (state.boss.vulnerableTimer <= 0) {
      advanceBossGuard(amount >= 16 ? 1 : 0.75, x, y)
      return
    }

    if (state.boss.damageCooldown > 0) {
      return
    }

    state.boss.health = clamp(state.boss.health - amount, 0, state.boss.maxHealth)
    state.boss.damageCooldown = Math.min(0.12, 0.07 + (state.boss.level - 1) * 0.01)
    state.boss.hitFlash = 1
    state.pulse = 1
    state.shake = Math.min(22, state.shake + 5)
    spawnSparks(x, y, 18, "player")
    spawnRing(x, y, {
      color: state.playerPalette.blade,
      radius: 12,
      life: 0.36,
      growth: 90
    })
    addScore(8 + amount * 0.8)
    playBossDamageSound()
    markHudDirty()

    if (state.boss.health <= 0) {
      defeatBoss()
    }
  }

  function defeatBoss() {
    if (!state.boss || state.boss.phase === "dying") {
      return
    }

    const boss = state.boss

    boss.phase = "dying"
    boss.defeatTimer = 1.15
    boss.hitFlash = 1
    boss.volleyTimer = 999
    boss.slashTimer = 999
    boss.vulnerableTimer = 0
    state.bossesDefeated += 1
    state.bossLevel += 1
    state.nextBossScore += 560 + boss.level * 120
    state.cooldownTimer = 2.5
    state.spawnTimer = 0.58
    state.slashTimer = 2.25
    state.mineTimer = 3.4

    cleanupHostileThreats(true)
    addScore(240 + boss.level * 80)
    setPhaseLabel(`Arena ${String(state.bossLevel + 1).padStart(2, "0")}`)
    showAnnouncement("Boss Destroyed", boss.name, 2.3)
    spawnSparks(boss.x, boss.y, 56, "ember")
    spawnRing(boss.x, boss.y, {
      color: "255, 109, 58",
      radius: boss.radius * 0.8,
      life: 0.95,
      growth: 220,
      lineWidth: 4
    })
    playVictorySound()
    markHudDirty()
  }

  function spawnBossVolley() {
    if (!state.boss || state.boss.phase !== "fight") {
      return
    }

    const boss = state.boss
    const count =
      4 +
      boss.level +
      boss.variant.volleyBonus +
      (boss.rage > 0.35 ? 1 : 0) +
      (boss.rage > 0.72 ? 1 : 0)
    const spread = 0.72 + boss.rage * 0.45 + boss.variant.spreadBonus
    const baseAngle = Math.atan2(state.center.y - boss.y, state.center.x - boss.x)
    const reach = Math.hypot(state.center.x - boss.x, state.center.y - boss.y)

    for (let index = 0; index < count; index += 1) {
      const offset = count === 1 ? 0 : (index / (count - 1) - 0.5) * spread
      const angle = baseAngle + offset + rand(-0.03, 0.03)
      const heavy = Math.random() < 0.2 + boss.rage * 0.2

      createBolt({
        x: boss.x + Math.cos(angle) * (boss.radius * 0.4),
        y: boss.y + Math.sin(angle) * (boss.radius * 0.4),
        targetX: boss.x + Math.cos(angle) * reach,
        targetY: boss.y + Math.sin(angle) * reach,
        speed: 420 + boss.level * 24 + boss.rage * 64 + rand(-18, 26),
        heavy,
        owner: "boss"
      })
    }

    spawnRing(boss.x, boss.y, {
      color: boss.variant.slashColor,
      radius: 18,
      life: 0.42,
      growth: 138,
      lineWidth: 2.8
    })
    spawnSparks(boss.x, boss.y, 9, "enemy")
  }

  function spawnBossSlashCombo() {
    if (!state.boss || state.boss.phase !== "fight") {
      return
    }

    const boss = state.boss
    const count =
      2 +
      boss.variant.slashBonus +
      (boss.level > 1 ? 1 : 0) +
      (boss.rage > 0.68 ? 1 : 0)
    const span = Math.min(state.center.radius * 1.8, 120)

    for (let index = 0; index < count; index += 1) {
      const offset = count === 1 ? 0 : index / (count - 1) - 0.5

      spawnSlash({
        originX: boss.x + offset * 28,
        originY: boss.y + rand(-12, 12),
        targetX: state.center.x + offset * span * 1.2,
        targetY: state.center.y + rand(-state.center.radius * 0.35, state.center.radius * 0.35),
        owner: "boss",
        width: 18 + boss.level * 1.8,
        damage: 15 + boss.level * 2,
        scoreValue: 34 + boss.level * 4,
        bossDamage: 16 + boss.level * 3,
        telegraphDuration: Math.max(0.42, 0.72 - boss.rage * 0.16),
        activeDuration: 0.28,
        fadeDuration: 0.24,
        sweep: rand(0.84, 1.18) * (index % 2 === 0 ? 1 : -1),
        lengthExtra: 108,
        emitterRadius: 18
      })
    }
  }

  function spawnBossMineBurst(boss, count = 2) {
    for (let index = 0; index < count; index += 1) {
      const spread = count === 1 ? 0 : index / (count - 1) - 0.5

      spawnMine({
        origin: {
          x: boss.x + spread * boss.radius * 1.35 + rand(-10, 10),
          y: boss.y + boss.radius * 0.35 + rand(-8, 12)
        },
        speedBonus: 10 + boss.level * 2,
        orbitStrength: rand(22, 38) + boss.rage * 10,
        radius: rand(16, 23),
        life: rand(7.8, 10.2),
        damage: 18 + boss.level,
        color: boss.variant.bodyColor
      })
    }
  }

  function spawnBossSpecial() {
    if (!state.boss || state.boss.phase !== "fight") {
      return
    }

    const boss = state.boss

    switch (boss.variant.shape) {
      case "orbital": {
        spawnBossMineBurst(boss, 2 + (boss.rage > 0.55 ? 1 : 0))
        spawnBossVolley()
        break
      }
      case "reaper": {
        for (const side of [-1, 1]) {
          spawnSlash({
            originX: boss.x + side * boss.radius * 0.92,
            originY: boss.y - boss.radius * 0.08,
            targetX: state.center.x - side * state.center.radius * 1.14,
            targetY: state.center.y + rand(-state.center.radius * 0.28, state.center.radius * 0.22),
            owner: "boss",
            width: 21 + boss.level * 1.6,
            damage: 18 + boss.level * 2,
            scoreValue: 42 + boss.level * 4,
            bossDamage: 18 + boss.level * 3,
            telegraphDuration: Math.max(0.38, 0.64 - boss.rage * 0.12),
            activeDuration: 0.24,
            fadeDuration: 0.24,
            sweep: side * rand(1.2, 1.42),
            lengthExtra: 156,
            emitterRadius: 20
          })
        }
        break
      }
      case "fang": {
        spawnBossMineBurst(boss, 3 + (boss.rage > 0.5 ? 1 : 0))
        break
      }
      case "tyrant": {
        const barrageCount = 4 + boss.level + (boss.rage > 0.5 ? 2 : 0)

        for (let index = 0; index < barrageCount; index += 1) {
          const origin = randomPerimeterPoint(0.84)

          createBolt({
            x: origin.x,
            y: origin.y,
            targetX: state.center.x + rand(-state.center.radius * 0.6, state.center.radius * 0.6),
            targetY: state.center.y + rand(-state.center.radius * 0.6, state.center.radius * 0.6),
            speed: 360 + boss.level * 22 + rand(-10, 20),
            heavy: Math.random() < 0.45,
            owner: "boss"
          })
        }

        spawnRing(state.center.x, state.center.y, {
          color: boss.variant.bodyColor,
          radius: state.center.radius * 1.16,
          life: 0.48,
          growth: 120,
          lineWidth: 3
        })
        break
      }
      case "crescent": {
        for (const side of [-1, 1]) {
          spawnSlash({
            originX: boss.x + side * boss.radius * 1.08,
            originY: boss.y + boss.radius * 0.1,
            targetX: state.center.x,
            targetY: state.center.y + side * state.center.radius * 0.48,
            owner: "boss",
            width: 20 + boss.level * 1.5,
            damage: 17 + boss.level * 2,
            scoreValue: 40 + boss.level * 4,
            bossDamage: 18 + boss.level * 3,
            telegraphDuration: Math.max(0.4, 0.66 - boss.rage * 0.12),
            activeDuration: 0.25,
            fadeDuration: 0.24,
            sweep: side * rand(1.24, 1.48),
            lengthExtra: 150,
            emitterRadius: 18
          })
        }
        break
      }
      default:
        break
    }

    spawnRing(boss.x, boss.y, {
      color: boss.variant.accentColor,
      radius: boss.radius * 0.58,
      life: 0.4,
      growth: 124,
      lineWidth: 2.8
    })
    spawnSparks(boss.x, boss.y, 10, "enemy")
  }

  function updateBoss(dt) {
    if (!state.boss) {
      return
    }

    const boss = state.boss

    boss.hitFlash = Math.max(0, boss.hitFlash - dt * 4)
    boss.vulnerableTimer = Math.max(0, boss.vulnerableTimer - dt)
    boss.guardCooldown = Math.max(0, boss.guardCooldown - dt)
    boss.damageCooldown = Math.max(0, boss.damageCooldown - dt)
    boss.pressureCooldown = Math.max(0, boss.pressureCooldown - dt)

    if (boss.phase === "enter") {
      boss.x = mix(boss.x, state.center.x, 1 - Math.exp(-dt * 3))
      boss.y = mix(boss.y, boss.targetY, 1 - Math.exp(-dt * 3.5))

      if (Math.abs(boss.y - boss.targetY) < 1.5) {
        boss.phase = "fight"
      }

      markHudDirty()
      return
    }

    if (boss.phase === "dying") {
      boss.defeatTimer -= dt
      boss.radius += dt * 28
      boss.y -= dt * 22

      if (Math.random() < 0.45) {
        spawnSparks(
          boss.x + rand(-boss.radius, boss.radius),
          boss.y + rand(-boss.radius, boss.radius),
          4,
          Math.random() < 0.5 ? "ember" : "ice"
        )
      }

      if (boss.defeatTimer <= 0) {
        state.boss = null
        markHudDirty()
      }

      return
    }

    boss.rage = 1 - boss.health / boss.maxHealth
    const bossRamp = clamp((boss.level - 1) / 7, 0, 1)

    const moveX =
      Math.sin(state.elapsed * (0.8 + boss.level * 0.04) * boss.variant.movementScale + boss.moveSeed) *
      Math.min(state.width * 0.24, 220)
    const moveY =
      Math.sin(state.elapsed * 1.5 * boss.variant.movementScale + boss.moveSeed * 1.3) *
      (12 + boss.level * 1.5)

    boss.x = mix(boss.x, state.center.x + moveX, 1 - Math.exp(-dt * 4))
    boss.y = mix(boss.y, state.height * 0.2 + moveY, 1 - Math.exp(-dt * 4))

    if (boss.vulnerableTimer > 0) {
      boss.y = mix(boss.y, state.height * 0.16, 1 - Math.exp(-dt * 4))
    }

    const pressureDistance = Math.hypot(state.pointer.x - boss.x, state.pointer.y - boss.y)
    const pressureEnabled = boss.level >= 2

    if (pressureEnabled && boss.vulnerableTimer <= 0 && pressureDistance < boss.radius + 84) {
      boss.pressureTimer += dt
    } else {
      boss.pressureTimer = Math.max(0, boss.pressureTimer - dt * 2)
    }

    if (pressureEnabled && boss.pressureCooldown <= 0 && boss.pressureTimer > 0.78 - bossRamp * 0.18) {
      boss.pressureCooldown = 1.15
      boss.pressureTimer = 0
      state.combo = 0
      spawnRing(boss.x, boss.y, {
        color: boss.variant.slashColor,
        radius: boss.radius * 0.82,
        life: 0.5,
        growth: 206,
        lineWidth: 3.4
      })
      damageCore(5 + boss.level * 1.1, state.pointer.x, state.pointer.y)
      return
    }

    boss.volleyTimer -= dt
    boss.slashTimer -= dt
    boss.specialTimer -= dt

    if (boss.vulnerableTimer <= 0 && boss.volleyTimer <= 0) {
      spawnBossVolley()
      boss.volleyTimer = Math.max(0.78, 1.72 - boss.level * 0.05 - boss.rage * 0.38) * rand(0.94, 1.16)
    }

    if (boss.vulnerableTimer <= 0 && boss.slashTimer <= 0) {
      spawnBossSlashCombo()
      boss.slashTimer = Math.max(1.18, 2.7 - boss.level * 0.07 - boss.rage * 0.7) * rand(0.9, 1.14)
    }

    if (boss.vulnerableTimer <= 0 && boss.specialTimer <= 0) {
      spawnBossSpecial()
      boss.specialTimer = Math.max(3.4, 5.8 - boss.level * 0.11 - boss.rage * 0.7) * rand(0.96, 1.12)
    }

    markHudDirty()
  }

  function updatePlayerBlade() {
    if (state.trail.length < 2) {
      state.playerBlade = null
      return
    }

    const tail = state.trail[Math.min(4, state.trail.length - 1)]
    let directionX = state.pointer.x - tail.x
    let directionY = state.pointer.y - tail.y
    let directionLength = Math.hypot(directionX, directionY)

    if (directionLength < 1) {
      directionX = Math.cos(state.pointer.angle)
      directionY = Math.sin(state.pointer.angle)
      directionLength = 1
    }

    directionX /= directionLength
    directionY /= directionLength

    const normalX = -directionY
    const normalY = directionX
    const handleFrontX = state.pointer.x - directionX * 10
    const handleFrontY = state.pointer.y - directionY * 10
    const handleBackX = state.pointer.x + directionX * 22
    const handleBackY = state.pointer.y + directionY * 22
    const bladeLength = (118 + state.pointer.power * 72) * (usingCoarseInput() ? 0.88 : 1)
    const bladeTipX = handleFrontX - directionX * bladeLength
    const bladeTipY = handleFrontY - directionY * bladeLength
    const pommelX = handleBackX + directionX * 8
    const pommelY = handleBackY + directionY * 8
    const guardHalf = 8

    state.playerBlade = {
      ax: handleFrontX,
      ay: handleFrontY,
      bx: bladeTipX,
      by: bladeTipY,
      handleBackX,
      handleBackY,
      pommelX,
      pommelY,
      guardAX: handleFrontX + normalX * guardHalf,
      guardAY: handleFrontY + normalY * guardHalf,
      guardBX: handleFrontX - normalX * guardHalf,
      guardBY: handleFrontY - normalY * guardHalf,
      emitterX: handleFrontX,
      emitterY: handleFrontY
    }
  }

  function updatePointer(dt) {
    const coarseInput = usingCoarseInput()
    const follow = 1 - Math.exp(-dt * (coarseInput ? 14 : 18))

    state.pointer.x = mix(state.pointer.x, state.pointer.targetX, follow)
    state.pointer.y = mix(state.pointer.y, state.pointer.targetY, follow)

    const dx = state.pointer.x - state.pointer.lastX
    const dy = state.pointer.y - state.pointer.lastY
    const distance = Math.hypot(dx, dy)

    const rawSpeed = distance / Math.max(dt, 0.001)
    state.pointer.speed = rawSpeed * (coarseInput ? 0.72 : 1)
    state.pointer.power = clamp((state.pointer.speed - (coarseInput ? 165 : 120)) / (coarseInput ? 980 : 900), 0, 1)

    if (distance > 0.25) {
      state.pointer.angle = Math.atan2(dy, dx)
    }

    state.pointer.lastX = state.pointer.x
    state.pointer.lastY = state.pointer.y
    state.pointer.hitCooldown = Math.max(0, state.pointer.hitCooldown - dt)

    state.trail.unshift({
      x: state.pointer.x,
      y: state.pointer.y
    })

    if (state.trail.length > 16) {
      state.trail.length = 16
    }

    updatePlayerBlade()
    markHudDirty()
  }

  function getPlayerCollisionSegments() {
    const segments = []

    if (state.playerBlade) {
      segments.push({
        ax: state.playerBlade.ax,
        ay: state.playerBlade.ay,
        bx: state.playerBlade.bx,
        by: state.playerBlade.by
      })
    }

    for (let index = 0; index < Math.min(1, state.trail.length - 1); index += 1) {
      const a = state.trail[index]
      const b = state.trail[index + 1]

      segments.push({
        ax: a.x,
        ay: a.y,
        bx: b.x,
        by: b.y
      })
    }

    return segments
  }

  function tryDeflectBolt(bolt) {
    const coarseInput = usingCoarseInput()

    if (state.pointer.speed < (coarseInput ? 235 : 180) || state.pointer.hitCooldown > 0) {
      return null
    }

    const segments = getPlayerCollisionSegments()

    for (const segment of segments) {
      const distance = distanceToSegment(
        bolt.x,
        bolt.y,
        segment.ax,
        segment.ay,
        segment.bx,
        segment.by
      )

      if (distance < bolt.radius + (coarseInput ? 11 : 18) + state.pointer.power * (coarseInput ? 5 : 8)) {
        return segment
      }
    }

    return null
  }

  function deflectBolt(bolt, segment) {
    const segmentX = segment.ax - segment.bx
    const segmentY = segment.ay - segment.by
    const segmentLength = Math.hypot(segmentX, segmentY) || 1
    const normalX = -segmentY / segmentLength
    const normalY = segmentX / segmentLength
    const fromCoreX = bolt.x - state.center.x
    const fromCoreY = bolt.y - state.center.y
    const coreLength = Math.hypot(fromCoreX, fromCoreY) || 1
    let directionX = fromCoreX / coreLength + normalX * 0.6
    let directionY = fromCoreY / coreLength + normalY * 0.6
    const directionLength = Math.hypot(directionX, directionY) || 1

    directionX /= directionLength
    directionY /= directionLength

    const boostedSpeed = bolt.speed * rand(1.12, 1.28) + state.pointer.power * 110

    bolt.vx = directionX * boostedSpeed
    bolt.vy = directionY * boostedSpeed
    bolt.speed = boostedSpeed
    bolt.life = 1.3
    bolt.deflected = true
    bolt.color = state.playerPalette.blade
    bolt.deflectX = bolt.x
    bolt.deflectY = bolt.y

    state.combo += 1
    state.pointer.hitCooldown = usingCoarseInput() ? 0.085 : 0.055
    addScore(10 + Math.min(50, state.combo * 2))
    state.pulse = 1
    state.shake = Math.min(18, state.shake + 4)
    spawnSparks(bolt.x, bolt.y, 15, "player")
    spawnRing(bolt.x, bolt.y, {
      color: state.playerPalette.blade,
      radius: 10,
      life: 0.28,
      growth: 86
    })
    playDeflectSound()
    markHudDirty()
  }

  function damageCore(amount, x, y) {
    state.integrity = clamp(state.integrity - amount, 0, 100)
    state.combo = 0
    state.damageFlash = 1
    state.pulse = 0.4
    state.shake = Math.min(22, state.shake + 7)
    spawnSparks(x, y, 18, "ember")
    spawnRing(x, y, {
      color: "255, 109, 58",
      radius: 16,
      life: 0.42,
      growth: 116
    })
    playDamageSound()
    markHudDirty()

    if (state.integrity <= 0) {
      writeBestScore(state.best)
      endGame()
    }
  }

  function updateBolts(dt) {
    for (let index = state.bolts.length - 1; index >= 0; index -= 1) {
      const bolt = state.bolts[index]

      if (!bolt) {
        continue
      }

      bolt.prevX = bolt.x
      bolt.prevY = bolt.y
      bolt.x += bolt.vx * dt
      bolt.y += bolt.vy * dt
      bolt.life -= dt

      if (!bolt.deflected) {
        const segment = tryDeflectBolt(bolt)

        if (segment) {
          deflectBolt(bolt, segment)
        }
      }

      if (bolt.deflected && state.boss && state.boss.phase !== "dying") {
        const bossDistance = Math.hypot(bolt.x - state.boss.x, bolt.y - state.boss.y)
        const deflectedTravel = bolt.deflectX
          ? Math.hypot(bolt.x - bolt.deflectX, bolt.y - bolt.deflectY)
          : 999

        if (bossDistance < state.boss.radius + bolt.radius + 8 && deflectedTravel > 125) {
          damageBoss((bolt.heavy ? 18 : 11) + state.pointer.power * 8, bolt.x, bolt.y)
          state.bolts.splice(index, 1)
          continue
        }
      }

      if (!bolt.deflected) {
        const coreDistance = Math.hypot(bolt.x - state.center.x, bolt.y - state.center.y)

        if (coreDistance < state.center.radius) {
          state.bolts.splice(index, 1)
          damageCore(bolt.damage, bolt.x, bolt.y)
          continue
        }
      }

      const outOfBounds =
        bolt.x < -140 ||
        bolt.x > state.width + 140 ||
        bolt.y < -140 ||
        bolt.y > state.height + 140

      if (bolt.life <= 0 || outOfBounds) {
        state.bolts.splice(index, 1)
      }
    }
  }

  function getSlashSegment(slash) {
    const tipX = slash.originX + Math.cos(slash.currentAngle) * slash.length
    const tipY = slash.originY + Math.sin(slash.currentAngle) * slash.length
    const impact = closestPointOnSegment(
      state.center.x,
      state.center.y,
      slash.originX,
      slash.originY,
      tipX,
      tipY
    )

    return {
      ax: slash.originX,
      ay: slash.originY,
      bx: tipX,
      by: tipY,
      impactX: impact.x,
      impactY: impact.y
    }
  }

  function findParryContact(segment, width) {
    const coarseInput = usingCoarseInput()

    if (
      !state.playerBlade ||
      state.pointer.speed < (coarseInput ? 248 : 190) ||
      state.pointer.hitCooldown > 0
    ) {
      return null
    }

    const candidates = getPlayerCollisionSegments()
    let bestDistance = Infinity
    let bestPoint = null

    for (const candidate of candidates) {
      const distance = distanceBetweenSegments(
        candidate.ax,
        candidate.ay,
        candidate.bx,
        candidate.by,
        segment.ax,
        segment.ay,
        segment.bx,
        segment.by
      )

      if (distance < bestDistance) {
        bestDistance = distance
        bestPoint = closestPointOnSegment(
          state.pointer.x,
          state.pointer.y,
          segment.ax,
          segment.ay,
          segment.bx,
          segment.by
        )
      }
    }

    if (bestDistance <= width + (coarseInput ? 11 : 18) + state.pointer.power * (coarseInput ? 8 : 12)) {
      return bestPoint
    }

    return null
  }

  function parrySlash(slash, contact) {
    slash.parried = true
    slash.parryTimer = 0.18

    state.combo += 1
    state.pointer.hitCooldown = usingCoarseInput() ? 0.09 : 0.06
    addScore(slash.scoreValue + Math.min(60, state.combo * 3))
    state.pulse = 1
    state.shake = Math.min(18, state.shake + 5)

    spawnSparks(contact.x, contact.y, 26, "player")
    spawnRing(contact.x, contact.y, {
      color: state.playerPalette.blade,
      radius: 18,
      life: 0.52,
      growth: 118,
      lineWidth: 2.8
    })

    playParrySound()

    if (slash.owner === "boss") {
      if (state.boss && state.boss.vulnerableTimer > 0) {
        damageBoss(slash.bossDamage + state.pointer.power * 12, contact.x, contact.y)
      } else {
        advanceBossGuard(1 + state.pointer.power * 0.7, contact.x, contact.y)
      }
    }

    markHudDirty()
  }

  function updateSlashes(dt) {
    for (let index = state.slashes.length - 1; index >= 0; index -= 1) {
      const slash = state.slashes[index]

      if (!slash) {
        continue
      }

      slash.age += dt

      if (slash.parried) {
        slash.parryTimer -= dt

        if (slash.parryTimer <= 0) {
          state.slashes.splice(index, 1)
        }

        continue
      }

      if (slash.age < slash.telegraphDuration) {
        slash.currentAngle = slash.startAngle
        continue
      }

      if (slash.age < slash.telegraphDuration + slash.activeDuration) {
        const progress = clamp(
          (slash.age - slash.telegraphDuration) / slash.activeDuration,
          0,
          1
        )

        slash.currentAngle = mix(slash.startAngle, slash.endAngle, easeOutCubic(progress))

        const segment = getSlashSegment(slash)
        const contact = findParryContact(segment, slash.width)

        if (
          contact &&
          Math.hypot(contact.x - slash.originX, contact.y - slash.originY) >
            slash.length * (slash.owner === "boss" ? 0.58 : 0.44)
        ) {
          parrySlash(slash, contact)
        }

        continue
      }

      slash.currentAngle = slash.endAngle

      if (!slash.hit) {
        slash.hit = true
        const segment = getSlashSegment(slash)
        damageCore(slash.damage, segment.impactX, segment.impactY)
      }

      if (slash.age >= slash.telegraphDuration + slash.activeDuration + slash.fadeDuration) {
        state.slashes.splice(index, 1)
      }
    }
  }

  async function startGame() {
    const useSampleAudio = audio.enabled && shouldUseSampleAudio()
    const audioReadyPromise =
      audio.enabled && !useSampleAudio ? ensureAudio() : Promise.resolve(true)

    resetPointer(state.pointer.targetX, state.pointer.targetY)
    state.mode = "playing"
    state.elapsed = 0
    state.spawnTimer = 0.82
    state.slashTimer = 3.25
    state.mineTimer = 5.8
    state.bossIntroTimer = 0
    state.cooldownTimer = 0
    state.score = 0
    state.combo = 0
    state.integrity = 100
    state.bossesDefeated = 0
    state.bossLevel = 0
    state.nextBossScore = FIRST_BOSS_SCORE
    state.parryHintShown = false
    state.pulse = 0
    state.damageFlash = 0
    state.shake = 0
    state.bolts = []
    state.mines = []
    state.slashes = []
    state.particles = []
    state.rings = []
    state.boss = null

    introPanel.classList.add("hidden")
    gameOverPanel.classList.add("hidden")
    bossHud.classList.add("hidden")
    document.body.classList.add("is-playing")

    hideAnnouncement()
    setLoadout(state.selectedLoadout)
    setPhaseLabel("Arena 01")
    showAnnouncement("Defense Grid", "Chamber Online", 1.1)
    if (useSampleAudio) {
      playStartSound()
    }
    const audioReady = await audioReadyPromise
    if (audio.enabled && audioReady && !useSampleAudio) {
      playStartSound()
    }
    markHudDirty()
    updateHud(true)
  }

  function endGame() {
    state.mode = "gameover"
    state.bossIntroTimer = 0
    state.cooldownTimer = 0
    state.boss = null
    cleanupHostileThreats(true)
    hideAnnouncement()
    setPhaseLabel("Core Breached")

    finalScoreValue.textContent = String(state.score)
    finalBestValue.textContent = String(state.best).padStart(4, "0")
    bossesDefeatedValue.textContent = String(state.bossesDefeated)

    gameOverPanel.classList.remove("hidden")
    bossHud.classList.add("hidden")
    document.body.classList.remove("is-playing")
    playGameOverSound()
    updateHud(true)
  }

  function update(dt) {
    state.titleElapsed += dt

    updatePointer(dt)
    updateParticles(dt)
    updateRings(dt)
    updateMines(dt)
    updateAnnouncement(dt)

    state.pulse = Math.max(0, state.pulse - dt * 1.8)
    state.damageFlash = Math.max(0, state.damageFlash - dt * 2.4)
    state.shake = Math.max(0, state.shake - dt * 42)

    if (state.mode !== "playing") {
      updateHud()
      return
    }

    state.elapsed += dt

    if (!state.boss && state.bossIntroTimer <= 0 && state.cooldownTimer <= 0 && state.score >= state.nextBossScore) {
      startBossIntro()
    }

    if (state.bossIntroTimer > 0) {
      state.bossIntroTimer -= dt

      if (state.bossIntroTimer <= 0) {
        spawnBoss()
      }
    }

    if (state.cooldownTimer > 0) {
      state.cooldownTimer -= dt
    }

    if (!state.boss && state.bossIntroTimer <= 0 && state.cooldownTimer <= 0) {
      const ramp = getArenaRamp()
      const allowSlashes = state.bossesDefeated > 0 || state.elapsed > 9
      const allowMines = state.bossesDefeated > 0 || state.elapsed > 26

      state.spawnTimer -= dt
      state.slashTimer -= dt
      state.mineTimer -= dt

      if (state.spawnTimer <= 0) {
        spawnWave()
        if (ramp > 0.34 && Math.random() < mix(0.05, 0.24, ramp)) {
          spawnAmbientBolt()
        }
        state.spawnTimer = mix(1.04, 0.46, ramp) * rand(0.86, 1.14)
      }

      if (allowSlashes && state.slashTimer <= 0) {
        let slashCount = 1

        if (ramp > 0.58 && Math.random() < mix(0.12, 0.56, ramp)) {
          slashCount += 1
        }

        for (let index = 0; index < slashCount; index += 1) {
          spawnRaiderSlash()
        }

        state.slashTimer = mix(3.25, 1.28, ramp) * rand(0.9, 1.14)
      }

      if (allowMines && state.mineTimer <= 0) {
        let mineCount = 1

        if (ramp > 0.76 && Math.random() < mix(0.08, 0.34, ramp)) {
          mineCount += 1
        }

        for (let index = 0; index < mineCount; index += 1) {
          spawnMine()
        }

        state.mineTimer = mix(5.5, 2.65, ramp) * rand(0.92, 1.16)
      }
    }

    updateBoss(dt)
    updateBolts(dt)
    updateSlashes(dt)
    updateHud()
  }

  function drawStars(time) {
    const offsetX = (state.pointer.x - state.center.x) * -0.02
    const offsetY = (state.pointer.y - state.center.y) * -0.02

    for (const star of state.stars) {
      const twinkle = 0.45 + Math.sin(time * 0.0012 * star.twinkle + star.seed) * 0.28
      const x = star.x + offsetX * star.depth
      const y = star.y + offsetY * star.depth

      ctx.fillStyle = `rgba(223, 255, 255, ${0.25 + twinkle * 0.55})`
      ctx.fillRect(x, y, star.size, star.size)
    }
  }

  function drawArenaField(time) {
    const bossPresence = state.boss && state.boss.phase !== "dying" ? 0.14 : 0
    const bg = ctx.createRadialGradient(
      state.center.x,
      state.center.y,
      state.center.radius * 0.3,
      state.center.x,
      state.center.y,
      Math.max(state.width, state.height)
    )

    bg.addColorStop(0, `rgba(24, 58, 82, ${0.62 + state.pulse * 0.1 + bossPresence})`)
    bg.addColorStop(0.32, "rgba(6, 13, 24, 0.92)")
    bg.addColorStop(1, "rgba(2, 6, 11, 1)")

    ctx.fillStyle = bg
    ctx.fillRect(0, 0, state.width, state.height)

    drawStars(time)

    ctx.save()
    ctx.globalAlpha = 0.16 + bossPresence * 0.2
    ctx.strokeStyle = "rgba(140, 236, 255, 0.28)"
    ctx.lineWidth = 1

    for (let ring = 1; ring <= 5; ring += 1) {
      ctx.beginPath()
      ctx.arc(state.center.x, state.center.y, state.center.radius * (1 + ring * 0.78), 0, TWO_PI)
      ctx.stroke()
    }

    const lineCount = state.boss ? 14 : 10

    for (let line = 0; line < lineCount; line += 1) {
      const angle = (line / lineCount) * TWO_PI + time * 0.00006
      ctx.beginPath()
      ctx.moveTo(state.center.x, state.center.y)
      ctx.lineTo(
        state.center.x + Math.cos(angle) * state.width,
        state.center.y + Math.sin(angle) * state.height
      )
      ctx.stroke()
    }

    ctx.restore()
  }

  function drawRings() {
    ctx.save()
    ctx.globalCompositeOperation = "lighter"

    for (const ring of state.rings) {
      const alpha = clamp(ring.life / ring.maxLife, 0, 1)
      ctx.strokeStyle = `rgba(${ring.color}, ${alpha * 0.55})`
      ctx.lineWidth = ring.lineWidth
      ctx.beginPath()
      ctx.arc(ring.x, ring.y, ring.radius, 0, TWO_PI)
      ctx.stroke()
    }

    ctx.restore()
  }

  function drawMines() {
    ctx.save()
    ctx.globalCompositeOperation = "lighter"

    for (const mine of state.mines) {
      const spikeCount = 6
      const pulse = 1 + Math.sin(mine.pulse) * 0.12

      ctx.save()
      ctx.translate(mine.x, mine.y)

      ctx.fillStyle = "rgba(12, 18, 30, 0.92)"
      ctx.beginPath()
      ctx.arc(0, 0, mine.radius * 0.72 * pulse, 0, TWO_PI)
      ctx.fill()

      ctx.strokeStyle = `rgba(${mine.color}, 0.82)`
      ctx.lineWidth = 2.2
      for (let index = 0; index < spikeCount; index += 1) {
        const angle = (index / spikeCount) * TWO_PI + mine.pulse * 0.4
        ctx.beginPath()
        ctx.moveTo(Math.cos(angle) * mine.radius * 0.42, Math.sin(angle) * mine.radius * 0.42)
        ctx.lineTo(Math.cos(angle) * mine.radius * 1.15, Math.sin(angle) * mine.radius * 1.15)
        ctx.stroke()
      }

      ctx.fillStyle = `rgba(${mine.color}, 0.92)`
      ctx.shadowBlur = 20
      ctx.shadowColor = `rgba(${mine.color}, 0.7)`
      ctx.beginPath()
      ctx.arc(0, 0, mine.radius * 0.3, 0, TWO_PI)
      ctx.fill()

      ctx.restore()
    }

    ctx.restore()
    ctx.shadowBlur = 0
  }

  function drawCore(time) {
    ctx.save()
    ctx.translate(state.center.x, state.center.y)
    ctx.globalCompositeOperation = "lighter"

    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, state.center.radius * 2.2)
    glow.addColorStop(0, `rgba(140, 236, 255, ${0.34 + state.pulse * 0.18})`)
    glow.addColorStop(0.45, "rgba(140, 236, 255, 0.12)")
    glow.addColorStop(1, "rgba(140, 236, 255, 0)")
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(0, 0, state.center.radius * 2.2, 0, TWO_PI)
    ctx.fill()

    ctx.strokeStyle = "rgba(223, 255, 255, 0.86)"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, state.center.radius * 0.58, 0, TWO_PI)
    ctx.stroke()

    ctx.strokeStyle = `rgba(140, 236, 255, ${0.45 + state.pulse * 0.3})`
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.arc(0, 0, state.center.radius, time * 0.001, time * 0.001 + Math.PI * 1.4)
    ctx.stroke()

    ctx.strokeStyle = "rgba(255, 211, 107, 0.42)"
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(0, 0, state.center.radius * 1.34, -time * 0.00075, -time * 0.00075 + Math.PI * 1.1)
    ctx.stroke()

    ctx.restore()
  }

  function drawBoss(time) {
    if (!state.boss) {
      return
    }

    const boss = state.boss
    const { bodyColor, accentColor, eyeColor, shape } = boss.variant
    const alpha =
      boss.phase === "enter"
        ? clamp((boss.targetY - boss.y + boss.radius * 2) / (boss.targetY + boss.radius * 2 + 140), 0.25, 1)
        : 1
    const vulnerable = boss.vulnerableTimer > 0

    ctx.save()
    ctx.translate(boss.x, boss.y)
    ctx.globalAlpha = alpha

    const glowRadius = boss.radius * (boss.phase === "dying" ? 3.1 : 2.4)
    const glow = ctx.createRadialGradient(0, 0, boss.radius * 0.2, 0, 0, glowRadius)
    glow.addColorStop(
      0,
      `rgba(${vulnerable ? state.playerPalette.blade : bodyColor}, ${
        0.22 + boss.rage * 0.16 + boss.hitFlash * 0.12
      })`
    )
    glow.addColorStop(0.45, `rgba(${bodyColor}, 0.09)`)
    glow.addColorStop(1, `rgba(${bodyColor}, 0)`)
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(0, 0, glowRadius, 0, TWO_PI)
    ctx.fill()

    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (vulnerable) {
      ctx.save()
      ctx.rotate(time * 0.0013)
      ctx.strokeStyle = `rgba(${state.playerPalette.blade}, 0.7)`
      ctx.lineWidth = 3.5
      ctx.beginPath()
      ctx.arc(0, 0, boss.radius * 1.16, 0, Math.PI * 1.55)
      ctx.stroke()
      ctx.restore()
    } else {
      const pipRadius = boss.radius * 1.18
      for (let index = 0; index < boss.guardNeeded; index += 1) {
        const angle = -Math.PI * 0.88 + (index / Math.max(1, boss.guardNeeded - 1)) * Math.PI * 1.76
        const filled = index < Math.floor(boss.guardHits)
        ctx.strokeStyle = `rgba(${filled ? bodyColor : accentColor}, ${filled ? 0.86 : 0.32})`
        ctx.lineWidth = filled ? 4 : 2.2
        ctx.beginPath()
        ctx.moveTo(Math.cos(angle) * pipRadius, Math.sin(angle) * pipRadius)
        ctx.lineTo(Math.cos(angle) * (pipRadius + 10), Math.sin(angle) * (pipRadius + 10))
        ctx.stroke()
      }
    }

    if (shape === "orbital") {
      ctx.save()
      ctx.rotate(time * 0.00085 + boss.moveSeed)
      ctx.strokeStyle = `rgba(${accentColor}, 0.48)`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(0, 0, boss.radius * 1.14, 0.24, Math.PI * 1.36)
      ctx.stroke()
      ctx.restore()

      ctx.save()
      ctx.rotate(-time * 0.0012 - boss.moveSeed * 0.7)
      ctx.strokeStyle = `rgba(${bodyColor}, 0.48)`
      ctx.lineWidth = 2.4
      ctx.beginPath()
      ctx.arc(0, 0, boss.radius * 0.78, Math.PI * 0.9, Math.PI * 1.95)
      ctx.stroke()
      ctx.restore()

      ctx.fillStyle = "rgba(8, 16, 29, 0.94)"
      ctx.beginPath()
      ctx.arc(0, 0, boss.radius, 0, TWO_PI)
      ctx.fill()

      ctx.strokeStyle = `rgba(${accentColor}, ${0.44 + boss.hitFlash * 0.18})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, boss.radius * 0.96, 0, TWO_PI)
      ctx.stroke()

      for (const side of [-1, 1]) {
        const armY = Math.sin(time * 0.003 + side + boss.moveSeed) * 10
        const armX = boss.radius * 1.08 * side

        ctx.strokeStyle = `rgba(${accentColor}, 0.32)`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(side * boss.radius * 0.56, side * 4)
        ctx.lineTo(armX, armY)
        ctx.stroke()

        ctx.fillStyle = `rgba(${bodyColor}, 0.9)`
        ctx.beginPath()
        ctx.arc(armX, armY, boss.radius * 0.16, 0, TWO_PI)
        ctx.fill()
      }

      ctx.fillStyle = `rgba(${eyeColor}, ${0.78 + boss.hitFlash * 0.22})`
      ctx.beginPath()
      ctx.ellipse(0, -4, boss.radius * 0.26, boss.radius * 0.16, 0, 0, TWO_PI)
      ctx.fill()
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
      ctx.beginPath()
      ctx.ellipse(0, -4, boss.radius * 0.09, boss.radius * 0.05, 0, 0, TWO_PI)
      ctx.fill()
    } else if (shape === "reaper") {
      ctx.fillStyle = "rgba(6, 14, 24, 0.96)"
      ctx.beginPath()
      ctx.moveTo(0, -boss.radius * 1.08)
      ctx.bezierCurveTo(
        boss.radius * 0.72,
        -boss.radius * 0.92,
        boss.radius * 0.98,
        boss.radius * 0.2,
        0,
        boss.radius * 1.18
      )
      ctx.bezierCurveTo(
        -boss.radius * 0.98,
        boss.radius * 0.2,
        -boss.radius * 0.72,
        -boss.radius * 0.92,
        0,
        -boss.radius * 1.08
      )
      ctx.fill()

      ctx.strokeStyle = `rgba(${accentColor}, 0.42)`
      ctx.lineWidth = 2.4
      ctx.stroke()

      for (const side of [-1, 1]) {
        ctx.strokeStyle = `rgba(${bodyColor}, 0.72)`
        ctx.lineWidth = 4.4
        ctx.beginPath()
        ctx.moveTo(side * boss.radius * 0.52, -boss.radius * 0.2)
        ctx.quadraticCurveTo(side * boss.radius * 1.22, boss.radius * 0.06, side * boss.radius * 1.02, boss.radius * 0.72)
        ctx.stroke()
      }

      ctx.fillStyle = `rgba(${eyeColor}, ${0.88 + boss.hitFlash * 0.12})`
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.ellipse(side * boss.radius * 0.22, -boss.radius * 0.1, boss.radius * 0.14, boss.radius * 0.08, side * 0.28, 0, TWO_PI)
        ctx.fill()
      }

      ctx.strokeStyle = `rgba(${bodyColor}, 0.64)`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(-boss.radius * 0.22, boss.radius * 0.18)
      ctx.lineTo(0, boss.radius * 0.44)
      ctx.lineTo(boss.radius * 0.22, boss.radius * 0.18)
      ctx.stroke()
    } else if (shape === "fang") {
      ctx.fillStyle = "rgba(7, 16, 27, 0.95)"
      ctx.beginPath()
      ctx.moveTo(0, -boss.radius * 1.02)
      ctx.lineTo(boss.radius * 1.02, -boss.radius * 0.08)
      ctx.lineTo(boss.radius * 0.24, boss.radius * 0.94)
      ctx.lineTo(0, boss.radius * 0.5)
      ctx.lineTo(-boss.radius * 0.24, boss.radius * 0.94)
      ctx.lineTo(-boss.radius * 1.02, -boss.radius * 0.08)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = `rgba(${accentColor}, 0.36)`
      ctx.lineWidth = 2.2
      ctx.stroke()

      ctx.fillStyle = `rgba(${bodyColor}, 0.94)`
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(side * boss.radius * 0.2, boss.radius * 0.28)
        ctx.lineTo(side * boss.radius * 0.04, boss.radius * 0.82)
        ctx.lineTo(side * boss.radius * 0.36, boss.radius * 0.82)
        ctx.closePath()
        ctx.fill()
      }

      ctx.fillStyle = `rgba(${eyeColor}, 0.92)`
      ctx.beginPath()
      ctx.ellipse(0, -boss.radius * 0.1, boss.radius * 0.2, boss.radius * 0.11, 0, 0, TWO_PI)
      ctx.fill()

      ctx.strokeStyle = `rgba(${bodyColor}, 0.72)`
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(-boss.radius * 0.78, -boss.radius * 0.08)
      ctx.lineTo(-boss.radius * 0.16, boss.radius * 0.26)
      ctx.lineTo(0, boss.radius * 0.42)
      ctx.lineTo(boss.radius * 0.16, boss.radius * 0.26)
      ctx.lineTo(boss.radius * 0.78, -boss.radius * 0.08)
      ctx.stroke()
    } else if (shape === "tyrant") {
      ctx.fillStyle = "rgba(6, 15, 24, 0.96)"
      ctx.beginPath()
      ctx.moveTo(0, -boss.radius * 1.06)
      ctx.lineTo(boss.radius * 0.72, -boss.radius * 0.72)
      ctx.lineTo(boss.radius * 0.94, 0)
      ctx.lineTo(boss.radius * 0.68, boss.radius * 0.92)
      ctx.lineTo(-boss.radius * 0.68, boss.radius * 0.92)
      ctx.lineTo(-boss.radius * 0.94, 0)
      ctx.lineTo(-boss.radius * 0.72, -boss.radius * 0.72)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = `rgba(${accentColor}, 0.42)`
      ctx.lineWidth = 2.6
      ctx.stroke()

      for (const side of [-1, 1]) {
        ctx.fillStyle = `rgba(${bodyColor}, 0.86)`
        ctx.fillRect(side * boss.radius * 0.56 - boss.radius * 0.16, -boss.radius * 0.12, boss.radius * 0.32, boss.radius * 0.48)

        ctx.strokeStyle = `rgba(${accentColor}, 0.4)`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(side * boss.radius * 0.28, -boss.radius * 0.92)
        ctx.lineTo(side * boss.radius * 0.12, -boss.radius * 1.18)
        ctx.stroke()
      }

      ctx.fillStyle = `rgba(${eyeColor}, 0.9)`
      ctx.fillRect(-boss.radius * 0.28, -boss.radius * 0.14, boss.radius * 0.56, boss.radius * 0.16)

      ctx.fillStyle = `rgba(${bodyColor}, 0.86)`
      ctx.fillRect(-boss.radius * 0.24, boss.radius * 0.24, boss.radius * 0.48, boss.radius * 0.18)
    } else if (shape === "crescent") {
      ctx.fillStyle = "rgba(7, 15, 27, 0.96)"
      ctx.beginPath()
      ctx.arc(-boss.radius * 0.06, 0, boss.radius * 0.98, Math.PI * 0.24, Math.PI * 1.76)
      ctx.arc(boss.radius * 0.36, 0, boss.radius * 0.7, Math.PI * 1.75, Math.PI * 0.25, true)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = `rgba(${accentColor}, 0.46)`
      ctx.lineWidth = 2.4
      ctx.stroke()

      ctx.fillStyle = `rgba(${bodyColor}, 0.86)`
      ctx.beginPath()
      ctx.arc(-boss.radius * 0.18, 0, boss.radius * 0.18, 0, TWO_PI)
      ctx.fill()

      ctx.fillStyle = `rgba(${eyeColor}, 0.92)`
      ctx.beginPath()
      ctx.ellipse(-boss.radius * 0.18, -boss.radius * 0.06, boss.radius * 0.16, boss.radius * 0.09, -0.18, 0, TWO_PI)
      ctx.fill()

      ctx.save()
      ctx.rotate(time * 0.0014 + boss.moveSeed)
      ctx.strokeStyle = `rgba(${bodyColor}, 0.58)`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(0, 0, boss.radius * 1.12, Math.PI * 0.22, Math.PI * 0.92)
      ctx.stroke()
      ctx.restore()
    }

    if (boss.hitFlash > 0) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${boss.hitFlash * 0.7})`
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(0, 0, boss.radius * 0.9, 0, TWO_PI)
      ctx.stroke()
    }

    ctx.restore()
  }

  function drawSlashes() {
    ctx.save()
    ctx.globalCompositeOperation = "lighter"
    ctx.lineCap = "round"

    for (const slash of state.slashes) {
      const segment = getSlashSegment(slash)
      const telegraphProgress = clamp(slash.age / slash.telegraphDuration, 0, 1)
      const startTipX = slash.originX + Math.cos(slash.startAngle) * slash.length
      const startTipY = slash.originY + Math.sin(slash.startAngle) * slash.length
      const endTipX = slash.originX + Math.cos(slash.endAngle) * slash.length
      const endTipY = slash.originY + Math.sin(slash.endAngle) * slash.length
      const slashColor = slash.parried ? state.playerPalette.blade : slash.color
      const slashCore = slash.parried ? state.playerPalette.core : slash.coreColor
      const alpha = slash.parried
        ? clamp(slash.parryTimer / 0.18, 0, 1)
        : slash.age < slash.telegraphDuration
          ? 0.2 + telegraphProgress * 0.2
          : 1

      if (!slash.parried && slash.age < slash.telegraphDuration) {
        ctx.setLineDash([10, 12])
        ctx.strokeStyle = `rgba(${slash.color}, ${0.14 + telegraphProgress * 0.18})`
        ctx.lineWidth = Math.max(2, slash.width * 0.42)
        ctx.beginPath()
        ctx.moveTo(slash.originX, slash.originY)
        ctx.lineTo(startTipX, startTipY)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(slash.originX, slash.originY)
        ctx.lineTo(endTipX, endTipY)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.strokeStyle = `rgba(${slash.color}, ${0.12 + telegraphProgress * 0.2})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(segment.impactX, segment.impactY)
        ctx.lineTo(state.center.x, state.center.y)
        ctx.stroke()
      }

      ctx.shadowBlur = 28
      ctx.shadowColor = `rgba(${slashColor}, 0.8)`
      ctx.strokeStyle = `rgba(${slashColor}, ${alpha * 0.78})`
      ctx.lineWidth = slash.width
      ctx.beginPath()
      ctx.moveTo(segment.ax, segment.ay)
      ctx.lineTo(segment.bx, segment.by)
      ctx.stroke()

      ctx.shadowBlur = 14
      ctx.strokeStyle = `rgba(${slashCore}, ${alpha})`
      ctx.lineWidth = Math.max(3, slash.width * 0.28)
      ctx.beginPath()
      ctx.moveTo(segment.ax, segment.ay)
      ctx.lineTo(segment.bx, segment.by)
      ctx.stroke()

      ctx.shadowBlur = 12
      ctx.fillStyle = `rgba(${slashColor}, ${0.8 * alpha})`
      ctx.beginPath()
      ctx.arc(slash.originX, slash.originY, slash.emitterRadius, 0, TWO_PI)
      ctx.fill()
    }

    ctx.restore()
    ctx.shadowBlur = 0
  }

  function drawBolts() {
    ctx.save()
    ctx.globalCompositeOperation = "lighter"

    for (const bolt of state.bolts) {
      const vx = bolt.x - bolt.prevX
      const vy = bolt.y - bolt.prevY
      const length = Math.hypot(vx, vy) || 1
      const trailLength = bolt.deflected ? 34 : 26
      const tailX = bolt.x - (vx / length) * trailLength
      const tailY = bolt.y - (vy / length) * trailLength
      const gradient = ctx.createLinearGradient(tailX, tailY, bolt.x, bolt.y)

      gradient.addColorStop(0, "rgba(255, 255, 255, 0)")
      gradient.addColorStop(0.4, `rgba(${bolt.color}, 0.24)`)
      gradient.addColorStop(1, `rgba(${bolt.color}, 1)`)

      ctx.strokeStyle = gradient
      ctx.lineWidth = bolt.radius * 1.9
      ctx.lineCap = "round"
      ctx.beginPath()
      ctx.moveTo(tailX, tailY)
      ctx.lineTo(bolt.x, bolt.y)
      ctx.stroke()

      ctx.fillStyle = `rgba(${bolt.color}, 1)`
      ctx.shadowBlur = bolt.deflected ? 26 : 18
      ctx.shadowColor = `rgba(${bolt.color}, 0.8)`
      ctx.beginPath()
      ctx.arc(bolt.x, bolt.y, bolt.radius, 0, TWO_PI)
      ctx.fill()
    }

    ctx.restore()
    ctx.shadowBlur = 0
  }

  function drawParticles() {
    ctx.save()
    ctx.globalCompositeOperation = "lighter"

    for (const particle of state.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1)
      ctx.fillStyle = `rgba(${particle.color}, ${alpha})`
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, TWO_PI)
      ctx.fill()
    }

    ctx.restore()
  }

  function drawBlade() {
    if (!state.playerBlade || state.trail.length < 2) {
      return
    }

    ctx.save()
    ctx.globalCompositeOperation = "lighter"
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    for (let index = state.trail.length - 2; index >= 0; index -= 1) {
      const point = state.trail[index]
      const next = state.trail[index + 1]
      const alpha = 1 - index / (state.trail.length - 1)

      ctx.strokeStyle = `rgba(${state.playerPalette.trail}, ${alpha * 0.22})`
      ctx.lineWidth = 28 * alpha
      ctx.beginPath()
      ctx.moveTo(point.x, point.y)
      ctx.lineTo(next.x, next.y)
      ctx.stroke()
    }

    ctx.strokeStyle = `rgba(${state.playerPalette.blade}, ${0.7 + state.pointer.power * 0.18})`
    ctx.shadowBlur = 32
    ctx.shadowColor = `rgba(${state.playerPalette.blade}, 0.9)`
    ctx.lineWidth = 12
    ctx.beginPath()
    ctx.moveTo(state.playerBlade.ax, state.playerBlade.ay)
    ctx.lineTo(state.playerBlade.bx, state.playerBlade.by)
    ctx.stroke()

    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)"
    ctx.shadowBlur = 14
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(state.playerBlade.ax, state.playerBlade.ay)
    ctx.lineTo(state.playerBlade.bx, state.playerBlade.by)
    ctx.stroke()

    ctx.shadowBlur = 0
    ctx.strokeStyle = `rgba(${state.playerPalette.grip}, 0.98)`
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(state.playerBlade.ax, state.playerBlade.ay)
    ctx.lineTo(state.playerBlade.pommelX, state.playerBlade.pommelY)
    ctx.stroke()

    ctx.strokeStyle = `rgba(${state.playerPalette.hilt}, 0.88)`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(state.playerBlade.ax, state.playerBlade.ay)
    ctx.lineTo(state.playerBlade.pommelX, state.playerBlade.pommelY)
    ctx.stroke()

    ctx.strokeStyle = `rgba(${state.playerPalette.hilt}, 0.92)`
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(state.playerBlade.guardAX, state.playerBlade.guardAY)
    ctx.lineTo(state.playerBlade.guardBX, state.playerBlade.guardBY)
    ctx.stroke()

    ctx.fillStyle = `rgba(${state.playerPalette.hilt}, 0.96)`
    ctx.beginPath()
    ctx.arc(state.playerBlade.emitterX, state.playerBlade.emitterY, 3.8, 0, TWO_PI)
    ctx.fill()

    ctx.fillStyle = `rgba(${state.playerPalette.hilt}, 0.86)`
    ctx.beginPath()
    ctx.arc(state.playerBlade.pommelX, state.playerBlade.pommelY, 4.2, 0, TWO_PI)
    ctx.fill()

    ctx.restore()
  }

  function drawOverlays() {
    if (state.bossIntroTimer > 0) {
      ctx.fillStyle = `rgba(255, 109, 58, ${state.bossIntroTimer * 0.05})`
      ctx.fillRect(0, 0, state.width, state.height)
    }

    if (state.damageFlash > 0) {
      ctx.fillStyle = `rgba(255, 70, 38, ${state.damageFlash * 0.16})`
      ctx.fillRect(0, 0, state.width, state.height)
    }
  }

  function render(time) {
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0)
    ctx.clearRect(0, 0, state.width, state.height)

    const shakeX = state.shake > 0 ? rand(-state.shake, state.shake) : 0
    const shakeY = state.shake > 0 ? rand(-state.shake, state.shake) : 0

    ctx.save()
    ctx.translate(shakeX, shakeY)
    drawArenaField(time)
    drawRings()
    drawCore(time)
    drawBoss(time)
    drawMines()
    drawSlashes()
    drawBolts()
    drawParticles()
    drawBlade()
    ctx.restore()

    drawOverlays()
  }

  function frame(time) {
    if (!state.lastTime) {
      state.lastTime = time
    }

    const dt = Math.min((time - state.lastTime) / 1000, 0.033)
    state.lastTime = time

    update(dt)
    render(time)
    requestAnimationFrame(frame)
  }

  function handlePointerMove(event) {
    if (event.pointerType) {
      state.pointer.pointerType = event.pointerType
    }

    state.pointer.targetX = event.clientX
    state.pointer.targetY = event.clientY
  }

  function handleImmediateAudioActivation() {
    if (!audio.enabled) {
      return
    }

    if (shouldUseSampleAudio()) {
      primeSampleAudio()
    }

    void ensureAudio()
  }

  async function handleSoundToggle() {
    audio.enabled = !audio.enabled

    if (audio.enabled) {
      handleImmediateAudioActivation()
      if (!shouldUseSampleAudio()) {
        await ensureAudio()
      }
      playStartSound()
    } else {
      audio.ready = false
    }

    updateSoundLabel()
  }

  function handleUserActivation() {
    if (audio.enabled) {
      handleImmediateAudioActivation()
    }
  }

  window.addEventListener("resize", resize)
  window.addEventListener("pointermove", handlePointerMove)
  window.addEventListener("pointerdown", handlePointerMove)
  window.addEventListener("pointerdown", () => {
    handleUserActivation()
  }, { passive: true })
  window.addEventListener("touchstart", () => {
    state.pointer.pointerType = "touch"
    handleUserActivation()
  }, { passive: true })
  window.addEventListener("keydown", () => {
    handleUserActivation()
  })

  startButton.addEventListener("click", () => {
    handleUserActivation()
    void startGame()
  })
  restartButton.addEventListener("click", () => {
    handleUserActivation()
    void startGame()
  })
  soundToggle.addEventListener("click", () => {
    void handleSoundToggle()
  })
  for (const option of loadoutOptions) {
    option.addEventListener("click", () => {
      setLoadout(option.dataset.loadout)
    })
  }

  const isLocalDebugHost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === ""

  if (isLocalDebugHost) {
    const params = new URLSearchParams(window.location.search)
    const autotestMode = params.get("autotest")

    window.__daxhqDebug = {
      getState: () => ({
        mode: state.mode,
        score: state.score,
        combo: state.combo,
        integrity: state.integrity,
        bossLevel: state.bossLevel,
        nextBossScore: state.nextBossScore,
        cooldownTimer: state.cooldownTimer,
        bossIntroTimer: state.bossIntroTimer,
        boss: state.boss
          ? {
              name: state.boss.name,
              phase: state.boss.phase,
              health: state.boss.health,
              maxHealth: state.boss.maxHealth
            }
          : null
      }),
      forceBossRound() {
        if (state.mode !== "playing") {
          startGame()
        }

        state.score = Math.max(state.score, state.nextBossScore)
        cleanupHostileThreats(true)
        state.boss = null
        state.cooldownTimer = 0
        state.bossIntroTimer = 0
        startBossIntro()
        markHudDirty()
      },
      forceBossWin() {
        if (state.mode !== "playing") {
          startGame()
        }

        if (!state.boss) {
          state.bossLevel = 0
          state.nextBossScore = FIRST_BOSS_SCORE
          spawnBoss()
        }

        state.boss.phase = "fight"
        state.boss.health = 1
        state.boss.vulnerableTimer = 2
        state.boss.damageCooldown = 0
        damageBoss(9999, state.boss.x, state.boss.y)
      },
      forceBossWinWithThreats() {
        if (state.mode !== "playing") {
          startGame()
        }

        if (!state.boss) {
          state.bossLevel = 0
          state.nextBossScore = FIRST_BOSS_SCORE
          spawnBoss()
        }

        state.boss.phase = "fight"
        spawnBossVolley()
        spawnBossSlashCombo()
        state.boss.health = 1
        state.boss.vulnerableTimer = 2
        state.boss.damageCooldown = 0
        damageBoss(9999, state.boss.x, state.boss.y)
      }
    }

    if (autotestMode) {
      const autotestResult = document.createElement("div")
      autotestResult.id = "autotest-result"
      autotestResult.style.position = "fixed"
      autotestResult.style.left = "-9999px"
      autotestResult.style.top = "0"
      autotestResult.dataset.status = "running"
      autotestResult.textContent = "running"
      document.body.appendChild(autotestResult)

      window.addEventListener("error", (event) => {
        autotestResult.dataset.status = "error"
        autotestResult.textContent = event.message || "unknown error"
      })

      const runAutotest = () => {
        if (autotestMode === "boss-win") {
          startGame()

          window.setTimeout(() => {
            window.__daxhqDebug.forceBossWin()
          }, 80)

          window.setTimeout(() => {
            autotestResult.dataset.status = "done"
            autotestResult.textContent = JSON.stringify(window.__daxhqDebug.getState())
          }, 3200)
        } else if (autotestMode === "boss-win-threats") {
          startGame()

          window.setTimeout(() => {
            window.__daxhqDebug.forceBossWinWithThreats()
          }, 80)

          window.setTimeout(() => {
            autotestResult.dataset.status = "done"
            autotestResult.textContent = JSON.stringify(window.__daxhqDebug.getState())
          }, 3200)
        }
      }

      if (document.readyState === "complete") {
        window.setTimeout(runAutotest, 0)
      } else {
        window.addEventListener("load", runAutotest, { once: true })
      }
    }
  }

  resize()
  setLoadout(state.selectedLoadout)
  updateSoundLabel()
  updateHud(true)
  requestAnimationFrame(frame)
})()
