/* ==========================================================================
   GabMad — Game Controller
   Handles: intro flow, setup, game loop, scoring, winner screen
   ========================================================================== */
"use strict";

/* ── TEAM DEFAULTS ─────────────────────────── */
const TEAM_DEFAULTS = [
  { name: "The Orange Crush",   color: "#ff5e1a" },
  { name: "The Neon Cyan",      color: "#00b4ff" },
  { name: "The Mint Mojitos",   color: "#3ef5c8" },
  { name: "The Purple Haze",    color: "#d946ef" }
];

const TEAM_AVATARS = [
  { emoji: "",   label: "No avatar",   group: "" },
  // Animals
  { emoji: "🦊", label: "Fox",        group: "Animals" },
  { emoji: "🐸", label: "Frog",       group: "Animals" },
  { emoji: "🦄", label: "Unicorn",    group: "Animals" },
  { emoji: "🐙", label: "Octopus",    group: "Animals" },
  { emoji: "🦉", label: "Owl",        group: "Animals" },
  { emoji: "🐼", label: "Panda",      group: "Animals" },
  { emoji: "🦖", label: "Dinosaur",   group: "Animals" },
  { emoji: "🐺", label: "Wolf",       group: "Animals" },
  { emoji: "🐯", label: "Tiger",      group: "Animals" },
  { emoji: "🦋", label: "Butterfly",  group: "Animals" },
  { emoji: "🐬", label: "Dolphin",    group: "Animals" },
  { emoji: "🦈", label: "Shark",      group: "Animals" },
  { emoji: "🦁", label: "Lion",       group: "Animals" },
  { emoji: "🐉", label: "Dragon",     group: "Animals" },
  { emoji: "🦅", label: "Eagle",      group: "Animals" },
  // Food & Party
  { emoji: "🍕", label: "Pizza",      group: "Food" },
  { emoji: "🌮", label: "Taco",       group: "Food" },
  { emoji: "🍩", label: "Donut",      group: "Food" },
  { emoji: "🌶️", label: "Hot Pepper", group: "Food" },
  { emoji: "🧁", label: "Cupcake",    group: "Food" },
  { emoji: "🍟", label: "Fries",      group: "Food" },
  // Fun & Misc
  { emoji: "🚀", label: "Rocket",     group: "Fun" },
  { emoji: "👾", label: "Alien Bug",  group: "Fun" },
  { emoji: "🎸", label: "Guitar",     group: "Fun" },
  { emoji: "💀", label: "Skull",      group: "Fun" },
  { emoji: "🔥", label: "Fire",       group: "Fun" },
  { emoji: "⚡", label: "Lightning",  group: "Fun" },
  { emoji: "💎", label: "Diamond",    group: "Fun" },
  { emoji: "🎯", label: "Bullseye",   group: "Fun" },
  { emoji: "🧠", label: "Brain",      group: "Fun" },
  { emoji: "🏆", label: "Trophy",     group: "Fun" },
];

// Preset team color palette
const TEAM_COLOR_PALETTE = [
  "#ff5e1a", // Burnt Orange
  "#ffd23f", // Gold
  "#00b4ff", // Cyan
  "#3ef5c8", // Mint
  "#d946ef", // Purple
  "#f72585", // Hot Pink
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#fb923c", // Peach
  "#facc15", // Yellow
  "#38bdf8", // Sky
  "#a3e635", // Lime
];

const HISTORY_STORAGE_KEY = "gabmad_team_history";

function loadHistoryStore() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return { teams: {}, games: [], error: "" };
    const saved = JSON.parse(raw);
    if (!saved || !saved.teams || typeof saved.teams !== "object" ||
        Array.isArray(saved.teams) || !Array.isArray(saved.games)) {
      throw new Error("Saved history has an unexpected format.");
    }
    const games = saved.games.filter(game =>
      game && typeof game.playedAt === "string" &&
      Array.isArray(game.winners) && Array.isArray(game.teams)
    ).slice(0, 25);
    return { teams: Object.assign(Object.create(null), saved.teams), games, error: "" };
  } catch (error) {
    console.error("Unable to load GabMad team history.", error);
    return {
      teams: {},
      games: [],
      error: "Saved history couldn't be read. New results won't overwrite it."
    };
  }
}

const savedHistory = loadHistoryStore();

/* ── STATE ──────────────────────────────────── */
const state = {
  screen:      "intro",
  teamCount:   2,
  timerSecs:   60,
  cardLimit:   20,
  setupStep:   1,    // 1 = teams, 2 = options, 3 = review
  category:    "All",
  teams:       [],
  teamDrafts:  [],
  deck:        [],
  idx:         0,
  phase:       "gab",    // "gab" | "reveal"
  remainingMs: 0,
  timerId:     null,
  paused:      false,
  timeUp:      false,
  hintTier:    0,
  activeTeamIdx: 0,
  roomId:      null,
  isJudgeMode: false,
  historyTeams: savedHistory.teams,
  historyGames: savedHistory.games,
  historyError: savedHistory.error,
  theme:       localStorage.getItem("gabmad_theme") || "dark"
};

/* ── HELPERS ────────────────────────────────── */
const $ = id => document.getElementById(id);

function applyTheme(t) {
  state.theme = t;
  const isLight = t === "light";
  if (isLight) {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  localStorage.setItem("gabmad_theme", t);

  const themeBtn = $("btnToggleTheme");
  if (themeBtn) {
    themeBtn.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    themeBtn.setAttribute("title", isLight ? "Switch to dark mode" : "Switch to light mode");
    themeBtn.innerHTML = isLight
      ? `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
      : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  }
}

/* ── CINEMATIC INTRO FLOW ───────────────────── */
function initIntroFlow() {
  const intro = $("introScreen");
  if (!intro) return;

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("role") === "judge") {
    intro.classList.remove("intro-splash-state");
    intro.classList.add("intro-flowed");
    document.body.classList.remove("intro-splash-active");
    return;
  }

  let flowed = false;
  function triggerFlow() {
    if (flowed) return;
    flowed = true;
    intro.classList.remove("intro-splash-state");
    intro.classList.add("intro-flowed");
    document.body.classList.remove("intro-splash-active");
  }

  // Smoothly glide into home position after 1.35s
  const timer = setTimeout(triggerFlow, 1350);

  // Or immediately on tap/click anywhere
  intro.addEventListener("click", () => {
    clearTimeout(timer);
    triggerFlow();
  }, { once: true });
}

/* ── INTRO CONTROLLER ───────────────────────── */
const INTRO_STEPS = document.querySelectorAll(".intro-step");
let introIdx = 0;

function gotoIntroStep(n, sfxPlay = true) {
  introIdx = Math.max(0, Math.min(INTRO_STEPS.length - 1, n));

  INTRO_STEPS.forEach((el, i) => el.classList.toggle("active", i === introIdx));

  document.querySelectorAll("#introDots .intro-dot").forEach((d, i) => {
    d.classList.toggle("active", i === introIdx);
    d.setAttribute("aria-selected", i === introIdx);
  });

  const isLast = introIdx === INTRO_STEPS.length - 1;
  $("btnIntroNext").textContent = isLast ? "Set up teams →" : "Next →";

  if (sfxPlay && window.gabAudio) {
    if (introIdx === 2) {
      window.gabAudio.flip();
      setTimeout(() => { window.gabAudio.correct && window.gabAudio.correct(); }, 260);
    } else {
      window.gabAudio.click();
    }
  }
}

function finishIntro() {
  if (window.gabAudio) window.gabAudio.click();
  showScreen("setup");
}

function bindIntro() {
  $("btnIntroNext").addEventListener("click", () => {
    if (introIdx >= INTRO_STEPS.length - 1) finishIntro();
    else gotoIntroStep(introIdx + 1);
  });

  $("btnIntroSkip").addEventListener("click", finishIntro);

  document.querySelectorAll("#introDots .intro-dot").forEach(d => {
    d.addEventListener("click", () => gotoIntroStep(parseInt(d.dataset.goto, 10)));
  });
}

/* ── SCREEN TRANSITIONS ─────────────────────── */
function showScreen(name) {
  state.screen = name;
  // Reset setup flow to step 1 whenever entering setup
  if (name === "setup") {
    state.setupStep = 1;
  }
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active", "screen-enter"));
  const target = $(`${name}Screen`);
  if (target) {
    target.classList.add("active");
    // small defer so @starting-style fires
    requestAnimationFrame(() => target.classList.add("screen-enter"));
  }

  const hud = $("scoreboardHUD");
  if (hud) hud.style.display = name === "game" ? "flex" : "none";

  const quitBtn = $("btnQuitGame");
  if (quitBtn) quitBtn.style.display = name === "game" ? "inline-flex" : "none";

  const topNav = $("topNav");
  if (topNav) topNav.style.display = name === "judge" ? "none" : "flex";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ── SETUP ──────────────────────────────────── */
function renderTeamInputs() {
  const list = $("teamsList");
  if (!list) return;

  // Persist current values before re-rendering
  Array.from(list.children).forEach((row, i) => {
    const input  = row.querySelector(".team-inp");
    const avatar = row.querySelector(".team-avatar-select");
    const color  = row.dataset.chosenColor;
    if (input) {
      state.teamDrafts[i] = Object.assign({}, state.teamDrafts[i] || {}, {
        name:   input.value,
        avatar: avatar ? avatar.value : (state.teamDrafts[i] ? state.teamDrafts[i].avatar : ""),
        color:  color  || (state.teamDrafts[i] ? state.teamDrafts[i].color : TEAM_DEFAULTS[i].color)
      });
    }
  });

  list.innerHTML = "";

  for (let i = 0; i < state.teamCount; i++) {
    const def   = TEAM_DEFAULTS[i];
    const draft = state.teamDrafts[i] || {};
    const chosenColor = draft.color || def.color;

    const row = document.createElement("div");
    row.className = "team-row team-row-stacked";
    row.dataset.teamIndex   = i;
    row.dataset.chosenColor = chosenColor;
    row.style.setProperty("--team-color", chosenColor);

    /* ── Top line: avatar picker + name input ── */
    const topLine = document.createElement("div");
    topLine.className = "team-row-top";

    // Avatar <select> with optgroups
    const avatar = document.createElement("select");
    avatar.className = "team-avatar-select";
    avatar.id = `tavatar${i}`;
    avatar.setAttribute("aria-label", `Team ${i + 1} avatar`);

    // "No avatar" option
    const blankOpt = document.createElement("option");
    blankOpt.value = "";
    blankOpt.textContent = "No avatar";
    avatar.appendChild(blankOpt);

    // Build grouped options
    const groups = {};
    TEAM_AVATARS.forEach(opt => {
      if (!opt.emoji) return; // already handled above
      const g = opt.group || "Other";
      if (!groups[g]) {
        const og = document.createElement("optgroup");
        og.label = g;
        groups[g] = og;
        avatar.appendChild(og);
      }
      const item = document.createElement("option");
      item.value = opt.emoji;
      item.textContent = `${opt.emoji} ${opt.label}`;
      groups[g].appendChild(item);
    });

    avatar.value = draft.avatar !== undefined ? draft.avatar : "";

    const inp = document.createElement("input");
    inp.type = "text";
    inp.className = "team-inp";
    inp.maxLength = 24;
    inp.value = draft.name || def.name;
    inp.id = `tinp${i}`;
    inp.setAttribute("aria-label", `Team ${i + 1} name`);

    topLine.appendChild(avatar);
    topLine.appendChild(inp);

    /* ── Color row: swatch + palette chips + custom picker ── */
    const colorRow = document.createElement("div");
    colorRow.className = "team-color-row";
    colorRow.setAttribute("aria-label", `Team ${i + 1} color`);

    // Label swatch (shows currently chosen color)
    const swatchBtn = document.createElement("span");
    swatchBtn.className = "team-swatch team-color-swatch-btn";
    swatchBtn.style.background  = chosenColor;
    swatchBtn.style.boxShadow   = `0 0 10px ${chosenColor}88`;
    swatchBtn.title = "Current color";
    swatchBtn.setAttribute("aria-hidden", "true");

    // Palette chips
    const palette = document.createElement("div");
    palette.className = "team-color-palette";

    function applyColor(color) {
      row.dataset.chosenColor = color;
      row.style.setProperty("--team-color", color);
      swatchBtn.style.background = color;
      swatchBtn.style.boxShadow  = `0 0 10px ${color}88`;
      customInput.value = color;
      // Update selected state on chips
      palette.querySelectorAll(".color-chip").forEach(c => {
        c.classList.toggle("selected", c.dataset.color === color);
      });
      // Ensure audio context is unlocked on any interaction
      if (window.gabAudio) {
        window.gabAudio.getContext();
        if (window.gabAudio.musicEnabled && !window.gabAudio.musicStarted) {
          window.gabAudio.startMusic();
        }
        window.gabAudio.click();
      }
    }

    TEAM_COLOR_PALETTE.forEach(hex => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "color-chip" + (hex === chosenColor ? " selected" : "");
      chip.dataset.color = hex;
      chip.style.background = hex;
      chip.style.boxShadow  = `0 0 6px ${hex}66`;
      chip.title = hex;
      chip.setAttribute("aria-label", `Color ${hex}`);
      chip.addEventListener("click", () => applyColor(hex));
      palette.appendChild(chip);
    });

    // Custom color <input type="color">
    const customInput = document.createElement("input");
    customInput.type  = "color";
    customInput.className = "team-color-custom";
    customInput.value = chosenColor;
    customInput.title = "Custom color";
    customInput.setAttribute("aria-label", `Team ${i + 1} custom color`);
    customInput.addEventListener("input", e => applyColor(e.target.value));

    const customLabel = document.createElement("label");
    customLabel.className = "team-color-custom-wrap";
    customLabel.title = "Pick custom color";
    customLabel.appendChild(customInput);
    customLabel.insertAdjacentHTML("beforeend", `<span class="custom-color-icon" aria-hidden="true">🎨</span>`);

    colorRow.appendChild(swatchBtn);
    colorRow.appendChild(palette);
    colorRow.appendChild(customLabel);

    row.appendChild(topLine);
    row.appendChild(colorRow);
    list.appendChild(row);
  }
}

function populateCategoryOptions() {
  const select = $("categorySelect");
  if (!select) return;
  select.replaceChildren();

  const allOption = document.createElement("option");
  allOption.value = "All";
  allOption.textContent = `Shuffle all cards (${DECK.length})`;
  select.appendChild(allOption);

  getDeckCategories().forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = `${category} (${DECK.filter(card => card.c === category).length})`;
    select.appendChild(option);
  });
  select.value = state.category;
}

function teamHistoryKey(name) {
  return name.trim().toLocaleLowerCase();
}

function saveHistoryStore() {
  if (state.historyError) return;
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({
      teams: state.historyTeams,
      games: state.historyGames
    }));
  } catch (error) {
    console.error("Unable to save GabMad team history.", error);
    state.historyError = "History couldn't be saved. Check this browser's storage settings.";
  }
}

function renderTeamHistory() {
  const records = $("teamRecords");
  const games = $("recentGames");
  const status = $("historyStatus");
  if (!records || !games || !status) return;

  status.textContent = state.historyError;
  records.replaceChildren();
  games.replaceChildren();

  const sortedRecords = Object.values(state.historyTeams)
    .filter(record => record && typeof record.name === "string")
    .sort((a, b) => (b.wins || 0) - (a.wins || 0) || (b.games || 0) - (a.games || 0));

  if (!sortedRecords.length && !state.historyGames.length) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "No completed games yet. Your team records will show up here.";
    records.appendChild(empty);
    return;
  }

  sortedRecords.slice(0, 8).forEach(record => {
    const chip = document.createElement("div");
    chip.className = "record-chip";
    if (record.avatar) {
      const avatar = document.createElement("span");
      avatar.className = "team-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = record.avatar;
      chip.appendChild(avatar);
    }
    const name = document.createElement("strong");
    name.textContent = record.name;
    const stats = document.createElement("span");
    stats.textContent = `${record.wins || 0} ${record.wins === 1 ? "win" : "wins"} · ${record.games || 0} games`;
    chip.append(name, stats);
    records.appendChild(chip);
  });

  state.historyGames.slice(0, 5).forEach(game => {
    const item = document.createElement("li");
    const date = new Date(game.playedAt);
    const dateLabel = Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
    const winners = game.winners.filter(name => typeof name === "string").join(" & ") || "No winner";
    const result = Array.isArray(game.teams)
      ? game.teams.filter(team => team && typeof team.name === "string")
        .map(team => `${team.name} ${team.score}`).join(" · ")
      : "";
    item.textContent = `${dateLabel} — ${winners} won${result ? ` (${result})` : ""}`;
    games.appendChild(item);
  });
}

function recordCompletedGame() {
  const topScore = Math.max(...state.teams.map(team => team.score));
  const winners = state.teams.filter(team => team.score === topScore).map(team => team.name);

  state.teams.forEach(team => {
    const key = teamHistoryKey(team.name);
    const record = Object.hasOwn(state.historyTeams, key) ? state.historyTeams[key] : {
      name: team.name,
      avatar: team.avatar,
      color: team.color,
      wins: 0,
      games: 0,
      points: 0
    };
    record.name = team.name;
    record.avatar = team.avatar;
    record.color = team.color;
    record.games = (record.games || 0) + 1;
    record.points = (record.points || 0) + team.score;
    if (winners.includes(team.name)) record.wins = (record.wins || 0) + 1;
    state.historyTeams[key] = record;
  });

  state.historyGames.unshift({
    playedAt: new Date().toISOString(),
    winners,
    teams: state.teams.map(({ name, avatar, score }) => ({ name, avatar, score }))
  });
  state.historyGames = state.historyGames.slice(0, 25);
  saveHistoryStore();
  renderTeamHistory();
}

/* ── MULTI-STEP SETUP ───────────────────────── */

function flushTeamDrafts() {
  const list = $("teamsList");
  if (!list) return;
  Array.from(list.children).forEach((row, i) => {
    const input  = row.querySelector(".team-inp");
    const avatar = row.querySelector(".team-avatar-select");
    const color  = row.dataset.chosenColor;
    if (input) {
      state.teamDrafts[i] = Object.assign({}, state.teamDrafts[i] || {}, {
        name:   input.value,
        avatar: avatar ? avatar.value : (state.teamDrafts[i] ? state.teamDrafts[i].avatar : ""),
        color:  color  || (state.teamDrafts[i] ? state.teamDrafts[i].color : TEAM_DEFAULTS[i].color)
      });
    }
  });
}

function gotoSetupStep(n) {
  // Flush current team drafts before leaving step 1
  if (state.setupStep === 1) flushTeamDrafts();

  state.setupStep = Math.max(1, Math.min(3, n));

  // Update step tabs
  document.querySelectorAll(".setup-step").forEach((tab, i) => {
    const active = i + 1 === state.setupStep;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active);
  });

  // Update step panels
  document.querySelectorAll(".setup-step-panel").forEach((panel, i) => {
    panel.classList.toggle("active", i + 1 === state.setupStep);
  });

  // Update nav buttons
  const backBtn = $("setupBtnBack");
  const nextBtn = $("setupBtnNext");
  const startBtn = $("btnStart");

  if (backBtn) backBtn.style.display = state.setupStep === 1 ? "none" : "inline-flex";
  if (nextBtn) nextBtn.style.display = state.setupStep === 3 ? "none" : "inline-flex";
  if (startBtn) {
    startBtn.style.display = state.setupStep === 3 ? "inline-flex" : "none";
    startBtn.classList.toggle("active", state.setupStep === 3);
  }

  // Build review content on step 3
  if (state.setupStep === 3) {
    buildSetupReview();
  }

  if (window.gabAudio) window.gabAudio.click();
}

function buildSetupReview() {
  const review = $("setupReview");
  if (!review) return;

  const teamCount = state.teamCount;
  const timerSecs = state.timerSecs;
  const cardLimit = state.cardLimit === 9999 ? "All" : state.cardLimit;
  const category = state.category;
  const rows = $("teamsList") ? Array.from($("teamsList").children) : [];

  // Build teams section with swatches + avatars
  const teamsHtml = Array.from({ length: teamCount }, (_, i) => {
    const inp    = $(`tinp${i}`);
    const avSel  = $(`tavatar${i}`);
    const row    = rows[i];
    const name   = (inp && inp.value.trim()) || TEAM_DEFAULTS[i].name;
    const avatar = avSel ? avSel.value : "";
    const color  = (row && row.dataset.chosenColor) ? row.dataset.chosenColor : TEAM_DEFAULTS[i].color;
    return `<span class="review-team-chip" style="--team-color:${color}">
      <span class="review-team-dot" style="background:${color};box-shadow:0 0 7px ${color}88"></span>
      ${avatar ? `<span class="review-team-avatar">${avatar}</span>` : ""}
      <span class="review-team-name">${name}</span>
    </span>`;
  }).join("");

  review.innerHTML = `
    <div class="review-row">
      <span class="review-label">Teams</span>
      <span class="review-value review-teams-value">${teamsHtml}</span>
    </div>
    <div class="review-row">
      <span class="review-label">Timer per card</span>
      <span class="review-value">${timerSecs}s</span>
    </div>
    <div class="review-row">
      <span class="review-label">Deck size</span>
      <span class="review-value">${cardLimit}</span>
    </div>
    <div class="review-row">
      <span class="review-label">Category</span>
      <span class="review-value">${category}</span>
    </div>
  `;
}

function bindSetup() {
  // team count
  $("teamCountSeg").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    state.teamCount = parseInt(b.dataset.n, 10);
    $("teamCountSeg").querySelectorAll("button").forEach(el => el.classList.toggle("sel", el === b));
    renderTeamInputs();
    if (window.gabAudio) window.gabAudio.click();
  });

  // timer
  $("timerSeg").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    state.timerSecs = parseInt(b.dataset.s, 10);
    $("timerSeg").querySelectorAll("button").forEach(el => el.classList.toggle("sel", el === b));
    if (window.gabAudio) window.gabAudio.click();
  });

  // deck size
  $("deckSeg").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    state.cardLimit = b.dataset.l === "all" ? 9999 : parseInt(b.dataset.l, 10);
    $("deckSeg").querySelectorAll("button").forEach(el => el.classList.toggle("sel", el === b));
    if (window.gabAudio) window.gabAudio.click();
  });

  $("categorySelect").addEventListener("change", e => {
    state.category = e.target.value;
    if (window.gabAudio) window.gabAudio.click();
  });

  $("btnStart").addEventListener("click", () => {
    if (window.gabAudio) { window.gabAudio.getContext(); window.gabAudio.fanfare(); }
    startGame();
  });

  // Step tab clicks
  document.querySelectorAll(".setup-step").forEach(tab => {
    tab.addEventListener("click", () => {
      const step = parseInt(tab.dataset.step, 10);
      gotoSetupStep(step);
    });
  });

  // Back / Next nav
  $("setupBtnBack").addEventListener("click", () => gotoSetupStep(state.setupStep - 1));
  $("setupBtnNext").addEventListener("click", () => gotoSetupStep(state.setupStep + 1));

  // Initialize on first show
  gotoSetupStep(1);
}

/* ── GAME START ─────────────────────────────── */
function startGame() {
  state.teams = [];
  const rows = $("teamsList").children;
  for (let i = 0; i < state.teamCount; i++) {
    const inp    = $(`tinp${i}`);
    const nm     = (inp && inp.value.trim()) ? inp.value.trim() : TEAM_DEFAULTS[i].name;
    const avatar = $(`tavatar${i}`);
    const row    = rows[i];
    const color  = (row && row.dataset.chosenColor) ? row.dataset.chosenColor : TEAM_DEFAULTS[i].color;
    state.teams.push({
      name:   nm,
      avatar: avatar ? avatar.value : "",
      color,
      score:  0
    });
  }
  state.deck = getShuffledDeck(state.category, state.cardLimit);
  state.idx = 0;
  state.activeTeamIdx = 0;

  renderHUD();
  showScreen("game");
  dealCard();
}

function dealCard() {
  if (state.idx >= state.deck.length) { endGame(); return; }

  const card = state.deck[state.idx];
  state.phase   = "gab";
  state.timeUp  = false;
  state.paused  = false;
  state.hintTier = 0;
  state.activeTeamIdx = state.idx % state.teams.length;

  // reset 3D card (no flash)
  const flipper = $("cardFlipper");
  flipper.style.transition = "none";
  flipper.classList.remove("flipped", "shake");
  void flipper.offsetWidth;
  flipper.style.transition = "";

  $("timesUp").classList.remove("show");

  const hintBox = $("hintBox");
  hintBox.classList.remove("show");
  hintBox.textContent = "";

  const hintBtn = $("btnHint");
  hintBtn.disabled = false;
  hintBtn.innerHTML = "💡 Hint";

  $("catBadge").textContent   = card.c;
  $("gabText").textContent    = titleCase(card.g);
  $("answerText").textContent = card.a;

  $("progressLbl").textContent    = `Card ${state.idx + 1} of ${state.deck.length}`;
  $("progressFill").style.width   = `${(state.idx / state.deck.length) * 100}%`;

  $("actionBar").style.display = "flex";
  $("scoringPanel").classList.remove("show");

  const ms = $("micStatus");
  ms.textContent = "";
  ms.className = "mic-status";

  $("btnPause").textContent = "⏸ Pause";

  updateTurnDisplay();

  if (window.gabAudio) {
    window.gabAudio.deal();
    window.gabAudio.setMusicMode("fast");
    window.gabAudio.duckMusic(false);
  }

  state.remainingMs = state.timerSecs * 1000;
  broadcastGameState();
  startTimer();
}

function titleCase(s) {
  return (s || "").replace(/\S+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/* ── TIMER ──────────────────────────────────── */
function startTimer() {
  stopTimer();
  let last = performance.now();
  let lastSec = Math.ceil(state.remainingMs / 1000);

  state.timerId = setInterval(() => {
    const now = performance.now();
    if (!state.paused && state.phase === "gab") {
      state.remainingMs = Math.max(0, state.remainingMs - (now - last));
      const cur = Math.ceil(state.remainingMs / 1000);
      if (cur !== lastSec) {
        lastSec = cur;
        broadcastGameState();
        if (cur > 0 && cur <= 5 && window.gabAudio)  window.gabAudio.urgentTick();
        else if (cur > 0 && cur <= 10 && window.gabAudio) window.gabAudio.tick();
      }
      if (state.remainingMs <= 0) { stopTimer(); onTimeUp(); }
    }
    last = now;
    paintTimer();
  }, 100);

  paintTimer();
}

function stopTimer() {
  if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
}

function paintTimer() {
  const total = state.timerSecs * 1000;
  const sec = Math.ceil(state.remainingMs / 1000);
  const low = sec <= 10 && sec > 0 && state.phase === "gab";

  $("timerNum").textContent = sec;
  $("timerNum").classList.toggle("low", low);

  const pct = total > 0 ? (state.remainingMs / total) * 100 : 0;
  $("timerFill").style.width = `${pct}%`;
  $("timerFill").classList.toggle("low", low);
}

function onTimeUp() {
  if (state.timeUp || state.phase !== "gab") return;
  state.timeUp = true;
  $("timesUp").classList.add("show");

  const f = $("cardFlipper");
  f.classList.remove("shake");
  void f.offsetWidth;
  f.classList.add("shake");

  if (window.gabAudio) window.gabAudio.buzzer();
  if (window.gabSpeech) window.gabSpeech.stop();
  broadcastGameState();
}

/* ── GAME ACTIONS ───────────────────────────── */
function reveal() {
  if (state.phase !== "gab") return;
  state.phase = "reveal";
  stopTimer();
  if (window.gabSpeech) window.gabSpeech.stop();

  const ms = $("micStatus");
  if (!ms.classList.contains("heard")) { ms.textContent = ""; ms.className = "mic-status"; }

  if (window.gabAudio) {
    window.gabAudio.flip();
    window.gabAudio.setMusicMode("chill");
    setTimeout(() => window.gabAudio.correct(), 240);
  }

  $("cardFlipper").classList.add("flipped");
  $("timesUp").classList.remove("show");
  $("actionBar").style.display = "none";

  $("progressFill").style.width = `${((state.idx + 1) / state.deck.length) * 100}%`;
  buildScoreGrid();
  $("scoringPanel").classList.add("show");
  broadcastGameState();
}


function showHint() {
  if (state.phase !== "gab") return;
  const card = state.deck[state.idx];
  const box  = $("hintBox");
  const btn  = $("btnHint");
  state.hintTier++;

  if (state.hintTier === 1) {
    // Letter skeleton
    box.textContent = card.a.split(" ").map(w => {
      const c = w.replace(/[^a-zA-Z']/g, "");
      return c ? c[0].toUpperCase() + " _".repeat(c.length - 1) : w;
    }).join("   ");
    box.classList.add("show");
    btn.innerHTML = "💡 Hint 2";
  } else {
    box.textContent = `Clue: ${card.hint || card.c}`;
    btn.disabled = true;
    btn.innerHTML = "💡 Max hint";
  }

  if (window.gabAudio) window.gabAudio.click();
}

function speakCard() {
  const card = state.deck[state.idx];
  if (!card || !window.gabAudio) return;
  const btn = $("btnSpeak");
  btn.innerHTML = "🔊 Speaking…";
  window.gabAudio.speakPhonetic(card.g, null, () => { btn.innerHTML = "🗣️ Read Aloud"; });
}

function toggleMic() {
  if (state.phase !== "gab" || !window.gabSpeech) return;
  const card = state.deck[state.idx];
  if (!card) return;
  if (window.gabSpeech.isListening) window.gabSpeech.stop();
  else window.gabSpeech.start(card.a, 15);
}

function addTime(secs) {
  if (state.phase !== "gab") return;
  state.remainingMs += secs * 1000;
  if (state.timeUp) {
    state.timeUp = false;
    $("timesUp").classList.remove("show");
    startTimer();
  }
  paintTimer();
  if (window.gabAudio) window.gabAudio.pointScored();
}

function togglePause() {
  if (state.phase !== "gab" || state.timeUp) return;
  state.paused = !state.paused;
  $("btnPause").textContent = state.paused ? "▶ Resume" : "⏸ Pause";
  if (window.gabAudio) {
    window.gabAudio.click();
    window.gabAudio.pauseMusic(state.paused);
  }
  if (state.paused && window.gabSpeech) window.gabSpeech.stop();
}

function skipCard() {
  if (state.phase !== "gab") return;
  if (window.gabAudio) window.gabAudio.wrong();
  nextCard();
}

function nextCard() {
  state.idx++;
  dealCard();
}

/* ── SCORING ────────────────────────────────── */
function buildScoreGrid() {
  const grid = $("scoreGrid");
  grid.innerHTML = "";
  state.teams.forEach((t, i) => {
    const card = document.createElement("div");
    card.className = "score-card";
    card.style.setProperty("--team-color", t.color);

    const info = document.createElement("div");
    info.className = "score-info";

    if (t.avatar) {
      const avatar = document.createElement("span");
      avatar.className = "team-avatar team-avatar-colored";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = t.avatar;
      info.appendChild(avatar);
    }

    const dot = document.createElement("span");
    dot.className = "chip-dot";
    dot.style.background = t.color;
    dot.style.boxShadow = `0 0 8px ${t.color}88`;

    const nm = document.createElement("span");
    nm.className = "chip-name";
    nm.textContent = t.name;

    info.appendChild(dot);
    info.appendChild(nm);

    const btn = document.createElement("button");
    btn.className = "award-btn";
    btn.style.background = `linear-gradient(135deg, ${t.color}, ${t.color}cc)`;
    btn.style.boxShadow = `0 4px 16px ${t.color}55`;
    btn.textContent = "+1 Point";
    btn.setAttribute("aria-label", `Award a point to ${t.name}`);
    btn.addEventListener("click", () => { awardPoint(i); nextCard(); });

    card.appendChild(info);
    card.appendChild(btn);
    grid.appendChild(card);
  });
}

function awardPoint(idx) {
  state.teams[idx].score++;
  if (window.gabAudio) window.gabAudio.pointScored();
  spawnScoreFloat(idx);
  renderHUD();
}

function spawnScoreFloat(idx) {
  const hud = $("scoreboardHUD");
  if (!hud || !hud.children[idx]) return;
  const bubble = document.createElement("span");
  bubble.className = "float-score";
  bubble.textContent = "+1";
  hud.children[idx].appendChild(bubble);
  setTimeout(() => bubble.remove(), 950);
}

/* ── HUD ────────────────────────────────────── */
function renderHUD() {
  const hud = $("scoreboardHUD");
  hud.innerHTML = "";
  const max = Math.max(...state.teams.map(t => t.score));
  state.teams.forEach(t => {
    const chip = document.createElement("div");
    chip.className = "team-chip" + (t.score === max && max > 0 ? " leader" : "");
    chip.style.setProperty("--team-color", t.color);

    if (t.avatar) {
      const avatar = document.createElement("span");
      avatar.className = "team-avatar team-avatar-colored";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = t.avatar;
      chip.appendChild(avatar);
    }

    const dot = document.createElement("span");
    dot.className = "chip-dot";
    dot.style.background = t.color;
    dot.style.boxShadow = `0 0 8px ${t.color}88`;

    const nm = document.createElement("span");
    nm.className = "chip-name";
    nm.textContent = t.name;

    const sc = document.createElement("span");
    sc.className = "chip-score";
    sc.textContent = t.score;

    chip.appendChild(dot);
    chip.appendChild(nm);
    chip.appendChild(sc);
    hud.appendChild(chip);
  });
}

/* ── END GAME ───────────────────────────────── */
function endGame() {
  stopTimer();
  if (window.gabSpeech) window.gabSpeech.stop();
  if (window.gabAudio) { window.gabAudio.setMusicMode("chill"); window.gabAudio.fanfare(); }
  recordCompletedGame();

  const sorted = [...state.teams].sort((a, b) => b.score - a.score);
  const top = sorted[0].score;
  const tied = sorted.filter(t => t.score === top);

  if (tied.length > 1) {
    $("winnerHeadline").textContent = "It's a Tie!";
    $("winnerSub").textContent = `${tied.map(t => t.name).join(" & ")} are crowned co-champions with ${top} ${top === 1 ? "point" : "points"}!`;
  } else {
    $("winnerHeadline").textContent = `${sorted[0].name} Wins!`;
    $("winnerSub").textContent = `Dominating the room with ${top} ${top === 1 ? "point" : "points"}. Unmatched phonetics mastery!`;
  }

  const podium = $("podium");
  podium.innerHTML = "";
  sorted.forEach((t, i) => {
    const row = document.createElement("div");
    row.className = "podium-row" + (i === 0 ? " first" : "");
    row.style.setProperty("--team-color", t.color);

    const rank = document.createElement("span");
    rank.className = "podium-rank";
    rank.textContent = `#${i + 1}`;

    const info = document.createElement("div");
    info.className = "podium-info";

    if (t.avatar) {
      const avatar = document.createElement("span");
      avatar.className = "team-avatar team-avatar-colored";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = t.avatar;
      info.appendChild(avatar);
    }

    const dot = document.createElement("span");
    dot.className = "chip-dot";
    dot.style.background = t.color;
    dot.style.boxShadow = `0 0 8px ${t.color}88`;

    const nm = document.createElement("strong");
    nm.textContent = t.name;

    info.appendChild(dot);
    info.appendChild(nm);

    const sc = document.createElement("span");
    sc.className = "podium-score";
    sc.style.color = t.color;
    sc.textContent = `${t.score} pts`;

    row.appendChild(rank);
    row.appendChild(info);
    row.appendChild(sc);
    podium.appendChild(row);
  });

  showScreen("winner");
  launchConfetti();
}

/* ── CONFETTI ───────────────────────────────── */
let confettiPieces = [], confettiRaf = null;
const confettiCanvas = $("confettiCanvas");
const cctx = confettiCanvas ? confettiCanvas.getContext("2d") : null;
const CCOLORS = ["#3ef5c8","#ff5e1a","#ff2d78","#00b4ff","#ffd23f","#ffffff","#d946ef"];

function sizeCanvas() {
  if (!confettiCanvas) return;
  confettiCanvas.width  = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

window.addEventListener("resize", sizeCanvas);
sizeCanvas();

function launchConfetti() {
  if (!confettiCanvas || !cctx) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function spawn(n, spread) {
    for (let i = 0; i < n; i++) {
      confettiPieces.push({
        x: Math.random() * confettiCanvas.width,
        y: -20 - Math.random() * (spread || 100),
        w: 7 + Math.random() * 8, h: 9 + Math.random() * 9,
        vx: (Math.random() - .5) * 3.5,
        vy: 2.5 + Math.random() * 3.5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - .5) * .18,
        color: CCOLORS[Math.floor(Math.random() * CCOLORS.length)]
      });
    }
    if (!confettiRaf) confLoop();
  }

  spawn(140, 220);
  setTimeout(() => spawn(110, 180), 500);
  setTimeout(() => spawn(80, 150), 1100);
}

function confLoop() {
  cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiPieces = confettiPieces.filter(p => p.y < confettiCanvas.height + 40);
  confettiPieces.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    cctx.save();
    cctx.translate(p.x, p.y);
    cctx.rotate(p.rot);
    cctx.fillStyle = p.color;
    cctx.fillRect(-p.w/2, -p.h/2, p.w, p.h * Math.abs(Math.sin(p.rot)));
    cctx.restore();
  });
  confettiRaf = confettiPieces.length ? requestAnimationFrame(confLoop) : null;
}

/* ── SPEECH HOOKS ───────────────────────────── */
function bindSpeech() {
  if (!window.gabSpeech) return;
  window.gabSpeech.onStateChange = (listening, msg, isSuccess) => {
    const ms = $("micStatus");
    ms.textContent = msg;
    ms.className = "mic-status" + (isSuccess ? " heard" : "");
    $("btnMic").classList.toggle("listening", listening);
  };
  window.gabSpeech.onAnswerDetected = () => {
    if (window.gabAudio) window.gabAudio.fanfare();
    setTimeout(reveal, 400);
  };
}

/* ── NAV & MISC BINDINGS ────────────────────── */
function bindNav() {
  const brand = $("brandHome");
  if (brand) {
    brand.addEventListener("click", e => {
      e.preventDefault();
      if (state.screen === "intro") return;
      showScreen("setup");
    });
  }

  const btnRules = $("btnOpenRules");
  if (btnRules) {
    btnRules.addEventListener("click", () => {
      if (window.gabAudio) window.gabAudio.click();
      const dlg = $("rulesDialog");
      if (dlg) dlg.showModal();
    });
  }

  const btnCloseRules = $("btnCloseRules");
  if (btnCloseRules) {
    btnCloseRules.addEventListener("click", () => {
      if (window.gabAudio) window.gabAudio.click();
      const dlg = $("rulesDialog");
      if (dlg) dlg.close();
    });
  }

  const rulesDlg = $("rulesDialog");
  if (rulesDlg) {
    rulesDlg.addEventListener("click", e => {
      const r = rulesDlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        rulesDlg.close();
      }
    });
  }

  const btnMusic = $("btnToggleMusic");
  if (btnMusic) {
    btnMusic.addEventListener("click", () => {
      if (!window.gabAudio) return;
      const on = !window.gabAudio.musicEnabled;
      window.gabAudio.setMusicEnabled(on);
      btnMusic.classList.toggle("active", on);
      btnMusic.setAttribute("aria-pressed", on);
    });
  }

  const btnSfx = $("btnToggleSfx");
  if (btnSfx) {
    btnSfx.addEventListener("click", () => {
      if (!window.gabAudio) return;
      const on = !window.gabAudio.sfxEnabled;
      window.gabAudio.setSfxEnabled(on);
      btnSfx.classList.toggle("active", on);
      btnSfx.setAttribute("aria-pressed", on);
    });
  }

  const btnTheme = $("btnToggleTheme");
  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      applyTheme(state.theme === "dark" ? "light" : "dark");
      if (window.gabAudio) window.gabAudio.click();
    });
  }

  const btnQuit = $("btnQuitGame");
  if (btnQuit) {
    btnQuit.addEventListener("click", () => {
      if (!confirm("End the current game?")) return;
      stopTimer();
      if (window.gabSpeech) window.gabSpeech.stop();
      if (window.gabAudio) window.gabAudio.setMusicMode("chill");
      showScreen("setup");
    });
  }
}

function bindGame() {
  $("btnReveal").addEventListener("click", reveal);
  $("btnHint").addEventListener("click", showHint);
  $("btnSpeak").addEventListener("click", speakCard);
  $("btnMic").addEventListener("click", toggleMic);
  $("btnSkip").addEventListener("click", skipCard);
  $("btnPlusTime").addEventListener("click", () => addTime(15));
  $("btnPause").addEventListener("click", togglePause);
  $("btnNext").addEventListener("click", () => { if (window.gabAudio) window.gabAudio.click(); nextCard(); });
  $("btnNobody").addEventListener("click", () => { if (window.gabAudio) window.gabAudio.wrong(); nextCard(); });
}

function bindWinner() {
  $("btnPlayAgain").addEventListener("click", () => {
    state.teams.forEach(t => t.score = 0);
    state.deck = getShuffledDeck(state.category, state.cardLimit);
    state.idx = 0;
    renderHUD();
    showScreen("game");
    dealCard();
  });
  $("btnNewSetup").addEventListener("click", () => {
    if (window.gabAudio) window.gabAudio.click();
    showScreen("setup");
  });
}

/* ── KEYBOARD SHORTCUTS ─────────────────────── */
function bindKeys() {
  document.addEventListener("keydown", e => {
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (state.screen === "intro") {
      if (e.code === "Enter" || e.code === "ArrowRight") {
        if (introIdx >= INTRO_STEPS.length - 1) finishIntro();
        else gotoIntroStep(introIdx + 1);
      } else if (e.code === "ArrowLeft") {
        gotoIntroStep(introIdx - 1);
      }
      return;
    }

    if (state.screen === "setup" && e.code === "Enter") { startGame(); return; }

    if (state.screen === "game") {
      if (e.code === "Space") {
        e.preventDefault();
        if (state.phase === "gab") reveal(); else nextCard();
      } else if (e.key === "h" || e.key === "H") showHint();
      else if (e.key === "s" || e.key === "S") speakCard();
      else if (e.key === "m" || e.key === "M") toggleMic();
      else if (e.key === "p" || e.key === "P") togglePause();
      else if (state.phase === "reveal" && ["1","2","3","4"].includes(e.key)) {
        const i = parseInt(e.key,10) - 1;
        if (i < state.teams.length) { awardPoint(i); nextCard(); }
      }
    }
  });
}

/* ── TURN & SYNC CONTROLLER ─────────────────── */
function updateTurnDisplay() {
  const activeTeam = state.teams[state.activeTeamIdx];
  const disp = $("activeTeamDisplay");
  if (disp && activeTeam) {
    disp.textContent = `${activeTeam.avatar ? activeTeam.avatar + " " : ""}${activeTeam.name}`;
    disp.style.color = activeTeam.color;
  }
  const peek = $("peekVal");
  if (peek && state.deck[state.idx]) {
    peek.textContent = state.deck[state.idx].a;
  }
}

function broadcastGameState() {
  if (!window.GabSync || window.GabSync.role !== "host") return;
  const card = state.deck[state.idx] || null;
  const activeTeam = state.teams[state.activeTeamIdx] || null;
  window.GabSync.broadcastState({
    idx: state.idx,
    totalCards: state.deck ? state.deck.length : 0,
    card: card ? { g: titleCase(card.g), a: card.a, c: card.c, hint: card.hint } : null,
    phase: state.phase,
    activeTeamIdx: state.activeTeamIdx,
    activeTeam: activeTeam,
    teams: state.teams,
    remainingMs: state.remainingMs,
    timerSecs: state.timerSecs,
    paused: state.paused,
    timeUp: state.timeUp,
    hintTier: state.hintTier
  });
}

function initSyncHost() {
  if (!window.GabSync) return;
  state.roomId = window.GabSync.initHost();

  window.GabSync.on("peers", data => {
    const dot = $("judgeBadgeDot");
    if (dot) dot.classList.toggle("connected", data.count > 0);
    const peerDot = $("peerStatusDot");
    const peerText = $("peerStatusText");
    if (peerDot) peerDot.classList.toggle("connected", data.count > 0);
    if (peerText) {
      peerText.textContent = data.count > 0 
        ? `🟢 ${data.count} opponent phone${data.count > 1 ? "s" : ""} connected!` 
        : "Waiting for opponent phone to connect…";
    }
  });

  window.GabSync.on("command", ({ command, payload }) => {
    if (command === "CORRECT") {
      awardPoint(state.activeTeamIdx);
      if (typeof triggerConfetti === "function") triggerConfetti();
      setTimeout(() => nextCard(), 1200);
    } else if (command === "REVEAL") {
      reveal();
    } else if (command === "HINT") {
      showHint();
    } else if (command === "PAUSE_TOGGLE") {
      togglePause();
    } else if (command === "NEXT") {
      nextCard();
    }
  });
}

let qrCodeInstance = null;

function openJudgeDialog() {
  const dialog = $("judgeDialog");
  if (!dialog) return;

  if (!state.roomId) {
    state.roomId = window.GabSync ? window.GabSync.initHost() : "GAB1";
  }

  const roomDisplay = $("roomCodeDisplay");
  if (roomDisplay) roomDisplay.textContent = state.roomId;

  const judgeUrl = window.GabSync ? window.GabSync.getJudgeUrl() : window.location.href;
  const linkTab = $("linkOpenJudgeTab");
  if (linkTab) linkTab.href = judgeUrl;

  const qrBox = $("judgeQrBox");
  if (qrBox && typeof QRCode !== "undefined") {
    qrBox.innerHTML = "";
    qrCodeInstance = new QRCode(qrBox, {
      text: judgeUrl,
      width: 180,
      height: 180,
      colorDark: "#0B0D13",
      colorLight: "#FFFFFF",
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  dialog.showModal();
}

function bindJudgeDialog() {
  const btnOpen = $("btnJudgeModal");
  if (btnOpen) btnOpen.addEventListener("click", openJudgeDialog);

  const btnGameOpen = $("btnOpenJudgeModalFromGame");
  if (btnGameOpen) btnGameOpen.addEventListener("click", openJudgeDialog);

  const btnClose = $("btnCloseJudgeDialog");
  if (btnClose) btnClose.addEventListener("click", () => $("judgeDialog").close());

  const btnCopy = $("btnCopyJudgeLink");
  if (btnCopy) {
    btnCopy.addEventListener("click", async () => {
      const url = window.GabSync ? window.GabSync.getJudgeUrl() : window.location.href;
      try {
        await navigator.clipboard.writeText(url);
        btnCopy.textContent = "Copied! ✓";
        setTimeout(() => { btnCopy.textContent = "📋 Copy Judge Link"; }, 2000);
      } catch (err) {
        prompt("Copy this Judge Screen link:", url);
      }
    });
  }
}

function bindPeekControl() {
  const btn = $("btnPeekAnswer");
  const pop = $("peekPopover");
  if (!btn || !pop) return;

  function showPeek(e) {
    if (e && e.cancelable) e.preventDefault();
    pop.classList.add("show");
  }

  function hidePeek() {
    pop.classList.remove("show");
  }

  btn.addEventListener("mousedown", showPeek);
  btn.addEventListener("touchstart", showPeek, { passive: false });

  btn.addEventListener("mouseup", hidePeek);
  btn.addEventListener("mouseleave", hidePeek);
  btn.addEventListener("touchend", hidePeek);
  btn.addEventListener("touchcancel", hidePeek);
}

/* ── JUDGE SCREEN CONTROLLER ────────────────── */
function renderJudgeState(remote) {
  if (!remote) return;

  // Timer
  const timerNum = $("judgeTimerNum");
  if (timerNum && typeof remote.remainingMs === "number") {
    const sec = Math.ceil(remote.remainingMs / 1000);
    timerNum.textContent = sec;
    const chip = $("judgeTimerChip");
    if (chip) chip.classList.toggle("low", sec <= 10 && sec > 0);
  }

  // Active Team info
  if (remote.activeTeam) {
    const swatch = $("judgeTeamSwatch");
    const avatar = $("judgeTeamAvatar");
    const name = $("judgeActiveTeamName");
    if (swatch) swatch.style.background = remote.activeTeam.color;
    if (avatar) avatar.textContent = remote.activeTeam.avatar || "";
    if (name) {
      name.textContent = remote.activeTeam.name;
      name.style.color = remote.activeTeam.color;
    }
  }

  // Card details
  if (remote.card) {
    const cat = $("judgeCardCat");
    const ans = $("judgeAnswerText");
    const gab = $("judgeGabText");
    if (cat) cat.textContent = remote.card.c;
    if (ans) ans.textContent = remote.card.a;
    if (gab) gab.textContent = remote.card.g;
  }

  // Hint status
  const hintStatus = $("judgeHintStatus");
  if (hintStatus) {
    if (remote.hintTier > 0 && remote.card) {
      hintStatus.textContent = `💡 Clue active: ${remote.card.hint || remote.card.c}`;
      hintStatus.style.display = "block";
    } else {
      hintStatus.style.display = "none";
    }
  }

  // Scores grid
  const scoreGrid = $("judgeScoresGrid");
  if (scoreGrid && Array.isArray(remote.teams)) {
    scoreGrid.innerHTML = "";
    remote.teams.forEach(t => {
      const chip = document.createElement("div");
      chip.className = "judge-score-chip";
      chip.style.setProperty("--team-color", t.color);
      chip.innerHTML = `
        <span class="chip-dot" style="background:${t.color}; box-shadow:0 0 6px ${t.color}88"></span>
        <span class="chip-name">${t.avatar ? t.avatar + " " : ""}${t.name}</span>
        <span class="chip-score">${t.score || 0}</span>
      `;
      scoreGrid.appendChild(chip);
    });
  }
}

function bindJudgeMode() {
  const btnCorrect = $("judgeBtnCorrect");
  if (btnCorrect) {
    btnCorrect.addEventListener("click", () => {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([100, 50, 100]);
      }
      if (window.GabSync) {
        window.GabSync.sendCommand("CORRECT");
      }
      btnCorrect.classList.add("tapped");
      setTimeout(() => btnCorrect.classList.remove("tapped"), 600);
    });
  }

  const btnHint = $("judgeBtnHint");
  if (btnHint) {
    btnHint.addEventListener("click", () => {
      if (window.GabSync) window.GabSync.sendCommand("HINT");
    });
  }

  const btnPause = $("judgeBtnPause");
  if (btnPause) {
    btnPause.addEventListener("click", () => {
      if (window.GabSync) window.GabSync.sendCommand("PAUSE_TOGGLE");
    });
  }

  const btnReveal = $("judgeBtnReveal");
  if (btnReveal) {
    btnReveal.addEventListener("click", () => {
      if (window.GabSync) window.GabSync.sendCommand("REVEAL");
    });
  }

  const btnPass = $("judgeBtnPass");
  if (btnPass) {
    btnPass.addEventListener("click", () => {
      if (window.GabSync) window.GabSync.sendCommand("NEXT");
    });
  }

  const btnDisconnect = $("judgeBtnDisconnect");
  if (btnDisconnect) {
    btnDisconnect.addEventListener("click", () => {
      window.location.href = window.location.pathname;
    });
  }
}

function initJudgeMode(roomId) {
  state.isJudgeMode = true;
  state.screen = "judge";
  showScreen("judge");

  bindJudgeMode();

  if (window.GabSync) {
    window.GabSync.initJudge(roomId);
    window.GabSync.on("state", renderJudgeState);
    window.GabSync.on("connection", ({ connected }) => {
      const liveTag = document.querySelector(".judge-live-tag");
      if (liveTag) {
        liveTag.textContent = connected ? `LIVE CONNECTED (${roomId})` : "RECONNECTING…";
        liveTag.classList.toggle("connected", connected);
      }
    });
  }
}

/* ── INIT ───────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(state.theme);

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("role") === "judge") {
    initJudgeMode(urlParams.get("room") || "");
    return;
  }

  initIntroFlow();

  bindIntro();
  bindSetup();
  bindGame();
  bindWinner();
  bindNav();
  bindKeys();
  bindSpeech();
  renderTeamInputs();
  populateCategoryOptions();
  renderTeamHistory();

  initSyncHost();
  bindJudgeDialog();
  bindPeekControl();
});
