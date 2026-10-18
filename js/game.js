// GabMad Game Controller & UI Orchestrator

class GabMadGame {
  constructor() {
    this.DEFAULT_TEAMS = [
      { id: 0, name: 'The Orange Crush', color: '#ff5e36', score: 0 },
      { id: 1, name: 'The Neon Cyan', color: '#00d2ff', score: 0 },
      { id: 2, name: 'The Mint Mojitos', color: '#00f0a0', score: 0 },
      { id: 3, name: 'The Purple Haze', color: '#d946ef', score: 0 }
    ];

    this.state = {
      screen: 'setup', // 'setup', 'game', 'winner'
      teamCount: 2,
      teams: [],
      timerSecs: 60,
      cardLimit: 20,
      categoryFilter: 'All',
      deck: [],
      currentIndex: 0,
      phase: 'gab', // 'gab' | 'reveal'
      remainingMs: 0,
      timerId: null,
      isPaused: false,
      timeUp: false,
      hintTier: 0,
      theme: localStorage.getItem('gabmad_theme') || 'dark'
    };

    // Confetti engine
    this.confettiCanvas = document.getElementById('confettiCanvas');
    this.confettiCtx = this.confettiCanvas ? this.confettiCanvas.getContext('2d') : null;
    this.confettiParticles = [];
    this.confettiRaf = null;

    this.init();
  }

  init() {
    this.applyTheme(this.state.theme);
    this.bindDOM();
    this.bindKeyboardShortcuts();
    this.setupConfetti();
    this.renderTeamInputs();
    this.showScreen('setup');
  }

  applyTheme(theme) {
    this.state.theme = theme;
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('gabmad_theme', theme);
  }

  toggleTheme() {
    const next = this.state.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
    if (window.gabAudio) window.gabAudio.click();
  }

  bindDOM() {
    // Theme toggle
    const themeBtn = document.getElementById('btnToggleTheme');
    if (themeBtn) themeBtn.addEventListener('click', () => this.toggleTheme());

    // Audio toggles
    const musicBtn = document.getElementById('btnToggleMusic');
    if (musicBtn) {
      musicBtn.addEventListener('click', () => {
        if (!window.gabAudio) return;
        const next = !window.gabAudio.musicEnabled;
        window.gabAudio.setMusicEnabled(next);
        musicBtn.classList.toggle('active', next);
        musicBtn.setAttribute('aria-pressed', next);
      });
    }

    const sfxBtn = document.getElementById('btnToggleSfx');
    if (sfxBtn) {
      sfxBtn.addEventListener('click', () => {
        if (!window.gabAudio) return;
        const next = !window.gabAudio.sfxEnabled;
        window.gabAudio.setSfxEnabled(next);
        sfxBtn.classList.toggle('active', next);
        sfxBtn.setAttribute('aria-pressed', next);
      });
    }

    // Rules Dialog
    const rulesDialog = document.getElementById('rulesDialog');
    const openRulesBtn = document.getElementById('btnOpenRules');
    const closeRulesBtn = document.getElementById('btnCloseRules');
    if (rulesDialog && openRulesBtn && closeRulesBtn) {
      openRulesBtn.addEventListener('click', () => {
        if (window.gabAudio) window.gabAudio.click();
        rulesDialog.showModal();
      });
      closeRulesBtn.addEventListener('click', () => {
        if (window.gabAudio) window.gabAudio.click();
        rulesDialog.close();
      });
      rulesDialog.addEventListener('click', (e) => {
        const rect = rulesDialog.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
          rulesDialog.close();
        }
      });
    }

    // Team Count Segment
    const teamCountGroup = document.getElementById('teamCountGroup');
    if (teamCountGroup) {
      teamCountGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const count = parseInt(btn.dataset.count, 10);
        this.setTeamCount(count);
      });
    }

    // Timer Duration Segment
    const timerGroup = document.getElementById('timerDurationGroup');
    if (timerGroup) {
      timerGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const secs = parseInt(btn.dataset.secs, 10);
        this.state.timerSecs = secs;
        timerGroup.querySelectorAll('button').forEach(b => b.classList.toggle('selected', b === btn));
        if (window.gabAudio) window.gabAudio.click();
      });
    }

    // Card Limit Segment
    const cardsLimitGroup = document.getElementById('cardsLimitGroup');
    if (cardsLimitGroup) {
      cardsLimitGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const limit = btn.dataset.limit === 'all' ? 9999 : parseInt(btn.dataset.limit, 10);
        this.state.cardLimit = limit;
        cardsLimitGroup.querySelectorAll('button').forEach(b => b.classList.toggle('selected', b === btn));
        if (window.gabAudio) window.gabAudio.click();
      });
    }

    // Start Button
    const startBtn = document.getElementById('btnStartGame');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (window.gabAudio) {
          window.gabAudio.getContext();
          window.gabAudio.fanfare();
        }
        this.startGame();
      });
    }

    // In-game buttons
    const revealBtn = document.getElementById('btnRevealAnswer');
    if (revealBtn) revealBtn.addEventListener('click', () => this.revealAnswer());

    const skipBtn = document.getElementById('btnSkipCard');
    if (skipBtn) skipBtn.addEventListener('click', () => this.skipCard());

    const hintBtn = document.getElementById('btnHint');
    if (hintBtn) hintBtn.addEventListener('click', () => this.showHint());

    const speakBtn = document.getElementById('btnSpeakPhonetic');
    if (speakBtn) speakBtn.addEventListener('click', () => this.speakCurrentPhonetic());

    const micBtn = document.getElementById('btnListenMic');
    if (micBtn) micBtn.addEventListener('click', () => this.toggleMicrophone());

    const plusTimeBtn = document.getElementById('btnPlusTime');
    if (plusTimeBtn) plusTimeBtn.addEventListener('click', () => this.addTime(15));

    const pauseBtn = document.getElementById('btnPauseTimer');
    if (pauseBtn) pauseBtn.addEventListener('click', () => this.togglePause());

    const nextCardBtn = document.getElementById('btnNextCard');
    if (nextCardBtn) nextCardBtn.addEventListener('click', () => this.nextCard());

    const nobodyBtn = document.getElementById('btnNobodyScored');
    if (nobodyBtn) {
      nobodyBtn.addEventListener('click', () => {
        if (window.gabAudio) window.gabAudio.wrong();
        this.nextCard();
      });
    }

    const quitGameBtn = document.getElementById('btnQuitGame');
    if (quitGameBtn) quitGameBtn.addEventListener('click', () => this.quitGame());

    // Winner Screen
    const playAgainBtn = document.getElementById('btnPlayAgain');
    if (playAgainBtn) playAgainBtn.addEventListener('click', () => this.playAgain());

    const newSetupBtn = document.getElementById('btnNewSetup');
    if (newSetupBtn) newSetupBtn.addEventListener('click', () => this.showScreen('setup'));

    // Speech listener hook
    if (window.gabSpeech) {
      window.gabSpeech.onStateChange = (listening, msg, isSuccess) => {
        const statusEl = document.getElementById('micStatusText');
        const micIcon = document.getElementById('btnListenMic');
        if (statusEl) {
          statusEl.textContent = msg;
          statusEl.className = 'mic-status-text' + (isSuccess ? ' heard' : '');
        }
        if (micIcon) {
          micIcon.classList.toggle('listening', listening);
        }
      };

      window.gabSpeech.onAnswerDetected = (transcript) => {
        if (window.gabAudio) window.gabAudio.fanfare();
        this.revealAnswer();
      };
    }
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      const activeTag = (document.activeElement && document.activeElement.tagName) || '';
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      if (this.state.screen === 'game') {
        if (e.code === 'Space') {
          e.preventDefault();
          if (this.state.phase === 'gab') this.revealAnswer();
          else this.nextCard();
        } else if (e.key === 'h' || e.key === 'H') {
          this.showHint();
        } else if (e.key === 's' || e.key === 'S') {
          this.speakCurrentPhonetic();
        } else if (e.key === 'm' || e.key === 'M') {
          this.toggleMicrophone();
        } else if (e.key === 'p' || e.key === 'P') {
          this.togglePause();
        } else if (this.state.phase === 'reveal' && ['1', '2', '3', '4'].includes(e.key)) {
          const teamIdx = parseInt(e.key, 10) - 1;
          if (teamIdx < this.state.teams.length) {
            this.awardPoint(teamIdx);
            this.nextCard();
          }
        }
      } else if (this.state.screen === 'setup' && e.code === 'Enter') {
        this.startGame();
      }
    });
  }

  showScreen(screenName) {
    this.state.screen = screenName;
    document.querySelectorAll('.screen').forEach(scr => scr.classList.remove('active'));
    const target = document.getElementById(`${screenName}Screen`);
    if (target) target.classList.add('active');

    const scoreboard = document.getElementById('scoreboardHUD');
    if (scoreboard) {
      scoreboard.style.display = screenName === 'game' ? 'flex' : 'none';
    }

    const quitBtn = document.getElementById('btnQuitGame');
    if (quitBtn) {
      quitBtn.style.display = screenName === 'game' ? 'inline-flex' : 'none';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setTeamCount(count) {
    this.state.teamCount = count;
    const teamCountGroup = document.getElementById('teamCountGroup');
    if (teamCountGroup) {
      teamCountGroup.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.count, 10) === count);
      });
    }
    this.renderTeamInputs();
    if (window.gabAudio) window.gabAudio.click();
  }

  renderTeamInputs() {
    const container = document.getElementById('teamsListContainer');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < this.state.teamCount; i++) {
      const def = this.DEFAULT_TEAMS[i];
      const row = document.createElement('div');
      row.className = 'team-input-row';

      const dot = document.createElement('span');
      dot.className = 'team-color-indicator';
      dot.style.color = def.color;
      dot.style.background = def.color;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'team-name-input';
      input.maxLength = 24;
      input.value = def.name;
      input.id = `inputTeamName_${i}`;
      input.setAttribute('aria-label', `Team ${i + 1} Name`);

      row.appendChild(dot);
      row.appendChild(input);
      container.appendChild(row);
    }
  }

  startGame() {
    // Collect team names
    this.state.teams = [];
    for (let i = 0; i < this.state.teamCount; i++) {
      const input = document.getElementById(`inputTeamName_${i}`);
      const name = (input && input.value.trim()) ? input.value.trim() : this.DEFAULT_TEAMS[i].name;
      this.state.teams.push({
        id: i,
        name: name,
        color: this.DEFAULT_TEAMS[i].color,
        score: 0
      });
    }

    // Retrieve shuffled deck
    this.state.deck = getShuffledDeck(this.state.categoryFilter, this.state.cardLimit);
    this.state.currentIndex = 0;

    this.renderScoreboardHUD();
    this.showScreen('game');
    this.dealCurrentCard();
  }

  dealCurrentCard() {
    if (this.state.currentIndex >= this.state.deck.length) {
      this.endGame();
      return;
    }

    const card = this.state.deck[this.state.currentIndex];
    this.state.phase = 'gab';
    this.state.timeUp = false;
    this.state.isPaused = false;
    this.state.hintTier = 0;

    // Reset UI elements
    const flipper = document.getElementById('cardFlipper');
    if (flipper) {
      flipper.classList.remove('flipped', 'shake');
    }

    const timesUpOverlay = document.getElementById('timesUpOverlay');
    if (timesUpOverlay) timesUpOverlay.classList.remove('show');

    const hintBox = document.getElementById('hintDisplayBox');
    if (hintBox) {
      hintBox.classList.remove('show');
      hintBox.textContent = '';
    }

    const hintBtn = document.getElementById('btnHint');
    if (hintBtn) {
      hintBtn.disabled = false;
      hintBtn.innerHTML = '💡 Hint';
    }

    // Set card content
    document.getElementById('cardCategoryBadge').textContent = card.c;
    document.getElementById('cardGibberishText').textContent = card.g;
    document.getElementById('cardAnswerText').textContent = card.a;

    // Progress counter
    document.getElementById('progressLabel').textContent = `Card ${this.state.currentIndex + 1} of ${this.state.deck.length}`;
    const progressPct = ((this.state.currentIndex) / this.state.deck.length) * 100;
    document.getElementById('progressFillBar').style.width = `${progressPct}%`;

    // Show guessing controls, hide scoring controls
    document.getElementById('cardActionsBar').style.display = 'flex';
    document.getElementById('scoringPanel').classList.remove('show');

    const statusEl = document.getElementById('micStatusText');
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.className = 'mic-status-text';
    }

    // Audio SFX & fast music mode
    if (window.gabAudio) {
      window.gabAudio.deal();
      window.gabAudio.setMusicMode('fast');
      window.gabAudio.duckMusic(false);
    }

    // Start timer
    this.state.remainingMs = this.state.timerSecs * 1000;
    this.startTimer();
  }

  startTimer() {
    this.stopTimer();
    let lastTime = performance.now();

    this.state.timerId = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;

      if (!this.state.isPaused && this.state.phase === 'gab') {
        const prevSec = Math.ceil(this.state.remainingMs / 1000);
        this.state.remainingMs = Math.max(0, this.state.remainingMs - delta);
        const curSec = Math.ceil(this.state.remainingMs / 1000);

        if (curSec !== prevSec && curSec > 0 && curSec <= 5) {
          if (window.gabAudio) window.gabAudio.urgentTick();
        } else if (curSec !== prevSec && curSec <= 10) {
          if (window.gabAudio) window.gabAudio.tick();
        }

        if (this.state.remainingMs <= 0) {
          this.state.remainingMs = 0;
          this.stopTimer();
          this.onTimerExpired();
        }
      }
      this.paintTimer();
    }, 100);

    this.paintTimer();
  }

  stopTimer() {
    if (this.state.timerId) {
      clearInterval(this.state.timerId);
      this.state.timerId = null;
    }
  }

  paintTimer() {
    const totalMs = this.state.timerSecs * 1000;
    const curSec = Math.ceil(this.state.remainingMs / 1000);
    const numEl = document.getElementById('timerCountdownNum');
    const fillEl = document.getElementById('timerFillProgress');

    if (numEl) {
      numEl.textContent = curSec;
      numEl.classList.toggle('low', curSec <= 10 && curSec > 0 && this.state.phase === 'gab');
    }

    if (fillEl) {
      const pct = totalMs > 0 ? (this.state.remainingMs / totalMs) * 100 : 0;
      fillEl.style.width = `${pct}%`;
      fillEl.classList.toggle('low', curSec <= 10 && curSec > 0 && this.state.phase === 'gab');
    }
  }

  onTimerExpired() {
    if (this.state.timeUp || this.state.phase !== 'gab') return;
    this.state.timeUp = true;

    const overlay = document.getElementById('timesUpOverlay');
    if (overlay) overlay.classList.add('show');

    const flipper = document.getElementById('cardFlipper');
    if (flipper) {
      flipper.classList.remove('shake');
      void flipper.offsetWidth;
      flipper.classList.add('shake');
    }

    if (window.gabAudio) window.gabAudio.buzzer();
    if (window.gabSpeech) window.gabSpeech.stop();
  }

  addTime(seconds) {
    if (this.state.screen !== 'game' || this.state.phase !== 'gab') return;
    this.state.remainingMs += (seconds * 1000);
    if (this.state.timeUp) {
      this.state.timeUp = false;
      const overlay = document.getElementById('timesUpOverlay');
      if (overlay) overlay.classList.remove('show');
      this.startTimer();
    }
    this.paintTimer();
    if (window.gabAudio) window.gabAudio.pointScored();
  }

  togglePause() {
    if (this.state.screen !== 'game' || this.state.phase !== 'gab' || this.state.timeUp) return;
    this.state.isPaused = !this.state.isPaused;

    const btn = document.getElementById('btnPauseTimer');
    if (btn) btn.textContent = this.state.isPaused ? '▶ Resume' : '⏸ Pause';

    if (window.gabAudio) {
      window.gabAudio.click();
      window.gabAudio.pauseMusic(this.state.isPaused);
    }
    if (this.state.isPaused && window.gabSpeech) {
      window.gabSpeech.stop();
    }
  }

  showHint() {
    if (this.state.phase !== 'gab') return;
    const card = this.state.deck[this.state.currentIndex];
    const hintBox = document.getElementById('hintDisplayBox');
    const hintBtn = document.getElementById('btnHint');
    if (!hintBox || !card) return;

    this.state.hintTier++;
    if (this.state.hintTier === 1) {
      // Tier 1: Letter Skeleton
      const skeleton = card.a.split(' ').map(word => {
        const clean = word.replace(/[^a-zA-Z']/g, '');
        if (!clean.length) return word;
        return clean.charAt(0).toUpperCase() + ' ' + '_ '.repeat(clean.length - 1);
      }).join('   ');
      hintBox.textContent = skeleton;
      hintBox.classList.add('show');
      hintBtn.innerHTML = '💡 Hint 2';
    } else if (this.state.hintTier === 2) {
      // Tier 2: Category context clue
      hintBox.textContent = `Clue: ${card.hint || card.c}`;
      hintBtn.disabled = true;
      hintBtn.innerHTML = '💡 Max Hint';
    }

    if (window.gabAudio) window.gabAudio.click();
  }

  speakCurrentPhonetic() {
    if (this.state.phase !== 'gab') return;
    const card = this.state.deck[this.state.currentIndex];
    if (!card || !window.gabAudio) return;

    const speakBtn = document.getElementById('btnSpeakPhonetic');
    if (speakBtn) {
      speakBtn.innerHTML = '<span class="audio-wave"><span></span><span></span><span></span></span> Speaking...';
    }

    window.gabAudio.speakPhonetic(
      card.g,
      null,
      () => {
        if (speakBtn) speakBtn.innerHTML = '🗣️ Read Aloud';
      }
    );
  }

  toggleMicrophone() {
    if (this.state.phase !== 'gab' || !window.gabSpeech) return;
    const card = this.state.deck[this.state.currentIndex];
    if (!card) return;

    if (window.gabSpeech.isListening) {
      window.gabSpeech.stop();
    } else {
      window.gabSpeech.start(card.a, 15);
    }
  }

  revealAnswer() {
    if (this.state.phase !== 'gab') return;
    this.state.phase = 'reveal';

    this.stopTimer();
    if (window.gabSpeech) window.gabSpeech.stop();
    if (window.gabAudio) {
      window.gabAudio.flip();
      window.gabAudio.setMusicMode('chill');
      setTimeout(() => window.gabAudio.correct(), 240);
    }

    // Flip 3D Card
    const flipper = document.getElementById('cardFlipper');
    if (flipper) flipper.classList.add('flipped');

    const overlay = document.getElementById('timesUpOverlay');
    if (overlay) overlay.classList.remove('show');

    // Switch action controls to scoring panel
    document.getElementById('cardActionsBar').style.display = 'none';
    this.renderScoringPanel();
    document.getElementById('scoringPanel').classList.add('show');

    // Update progress bar
    const progressPct = ((this.state.currentIndex + 1) / this.state.deck.length) * 100;
    document.getElementById('progressFillBar').style.width = `${progressPct}%`;
  }

  renderScoringPanel() {
    const grid = document.getElementById('scoringRowsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    this.state.teams.forEach((team, idx) => {
      const card = document.createElement('div');
      card.className = 'score-award-card';

      const info = document.createElement('div');
      info.className = 'score-award-info';

      const dot = document.createElement('span');
      dot.className = 'team-color-dot';
      dot.style.color = team.color;
      dot.style.background = team.color;

      const name = document.createElement('span');
      name.className = 'team-chip-name';
      name.textContent = team.name;

      info.appendChild(dot);
      info.appendChild(name);

      const btn = document.createElement('button');
      btn.className = 'score-award-btn';
      btn.style.background = team.color;
      btn.textContent = '+1 Point';
      btn.setAttribute('aria-label', `Award 1 point to ${team.name}`);
      btn.addEventListener('click', () => {
        this.awardPoint(idx);
        this.nextCard();
      });

      card.appendChild(info);
      card.appendChild(btn);
      grid.appendChild(card);
    });
  }

  awardPoint(teamIndex) {
    if (!this.state.teams[teamIndex]) return;
    this.state.teams[teamIndex].score += 1;

    if (window.gabAudio) window.gabAudio.pointScored();
    this.spawnScoreFloat(teamIndex);
    this.renderScoreboardHUD();
  }

  spawnScoreFloat(teamIndex) {
    const scoreboard = document.getElementById('scoreboardHUD');
    if (!scoreboard || !scoreboard.children[teamIndex]) return;

    const chip = scoreboard.children[teamIndex];
    const bubble = document.createElement('span');
    bubble.className = 'floating-plus-one';
    bubble.textContent = '+1';
    chip.appendChild(bubble);

    setTimeout(() => bubble.remove(), 900);
  }

  skipCard() {
    if (this.state.phase !== 'gab') return;
    if (window.gabAudio) window.gabAudio.wrong();
    this.nextCard();
  }

  nextCard() {
    this.state.currentIndex++;
    if (this.state.currentIndex >= this.state.deck.length) {
      this.endGame();
    } else {
      this.dealCurrentCard();
    }
  }

  quitGame() {
    if (confirm('Are you sure you want to end the current game?')) {
      this.stopTimer();
      if (window.gabSpeech) window.gabSpeech.stop();
      if (window.gabAudio) window.gabAudio.setMusicMode('chill');
      this.showScreen('setup');
    }
  }

  renderScoreboardHUD() {
    const hud = document.getElementById('scoreboardHUD');
    if (!hud) return;
    hud.innerHTML = '';

    const maxScore = Math.max(...this.state.teams.map(t => t.score));

    this.state.teams.forEach(team => {
      const chip = document.createElement('div');
      chip.className = 'team-chip' + (team.score === maxScore && maxScore > 0 ? ' leader' : '');

      const dot = document.createElement('span');
      dot.className = 'team-color-dot';
      dot.style.color = team.color;
      dot.style.background = team.color;

      const name = document.createElement('span');
      name.className = 'team-chip-name';
      name.textContent = team.name;

      const score = document.createElement('span');
      score.className = 'team-chip-score';
      score.textContent = team.score;

      chip.appendChild(dot);
      chip.appendChild(name);
      chip.appendChild(score);
      hud.appendChild(chip);
    });
  }

  endGame() {
    this.stopTimer();
    if (window.gabSpeech) window.gabSpeech.stop();
    if (window.gabAudio) {
      window.gabAudio.setMusicMode('chill');
      window.gabAudio.fanfare();
    }

    const sorted = [...this.state.teams].sort((a, b) => b.score - a.score);
    const topScore = sorted[0].score;
    const winners = sorted.filter(t => t.score === topScore);

    const headline = document.getElementById('winnerHeadline');
    const recap = document.getElementById('winnerRecapText');
    const podium = document.getElementById('podiumStandings');

    if (winners.length > 1) {
      headline.textContent = "It's a Tie!";
      recap.textContent = `${winners.map(w => w.name).join(' & ')} tied for first place with ${topScore} ${topScore === 1 ? 'point' : 'points'}!`;
    } else {
      headline.textContent = `${sorted[0].name} Wins!`;
      recap.textContent = `Dominating the room with ${topScore} ${topScore === 1 ? 'point' : 'points'}. Unmatched phonetics mastery!`;
    }

    if (podium) {
      podium.innerHTML = '';
      sorted.forEach((team, idx) => {
        const item = document.createElement('div');
        item.className = 'podium-item' + (idx === 0 ? ' first-place' : '');

        const rank = document.createElement('span');
        rank.className = 'podium-rank';
        rank.textContent = `#${idx + 1}`;

        const detail = document.createElement('div');
        detail.className = 'podium-team-detail';

        const dot = document.createElement('span');
        dot.className = 'team-color-dot';
        dot.style.color = team.color;
        dot.style.background = team.color;

        const name = document.createElement('strong');
        name.textContent = team.name;

        detail.appendChild(dot);
        detail.appendChild(name);

        const score = document.createElement('span');
        score.className = 'podium-score-count';
        score.textContent = `${team.score} pts`;

        item.appendChild(rank);
        item.appendChild(detail);
        item.appendChild(score);
        podium.appendChild(item);
      });
    }

    this.showScreen('winner');
    this.launchConfettiStorm();
  }

  playAgain() {
    this.state.teams.forEach(t => t.score = 0);
    this.state.deck = getShuffledDeck(this.state.categoryFilter, this.state.cardLimit);
    this.state.currentIndex = 0;
    this.renderScoreboardHUD();
    this.showScreen('game');
    this.dealCurrentCard();
  }

  /* ================= CONFETTI SYSTEM ================= */
  setupConfetti() {
    if (!this.confettiCanvas) return;
    const resize = () => {
      this.confettiCanvas.width = window.innerWidth;
      this.confettiCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
  }

  launchConfettiStorm() {
    if (!this.confettiCanvas || !this.confettiCtx) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const colors = ['#ff5e36', '#00d2ff', '#00f0a0', '#ffb703', '#d946ef', '#ffffff'];
    const particleCount = 140;

    for (let i = 0; i < particleCount; i++) {
      this.confettiParticles.push({
        x: Math.random() * this.confettiCanvas.width,
        y: -20 - Math.random() * 150,
        w: 8 + Math.random() * 8,
        h: 10 + Math.random() * 10,
        vx: (Math.random() - 0.5) * 4,
        vy: 3 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    if (!this.confettiRaf) {
      this.renderConfetti();
    }
  }

  renderConfetti() {
    this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
    this.confettiParticles = this.confettiParticles.filter(p => p.y < this.confettiCanvas.height + 40);

    this.confettiParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;

      this.confettiCtx.save();
      this.confettiCtx.translate(p.x, p.y);
      this.confettiCtx.rotate(p.rot);
      this.confettiCtx.fillStyle = p.color;
      this.confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.sin(p.rot)));
      this.confettiCtx.restore();
    });

    if (this.confettiParticles.length > 0) {
      this.confettiRaf = requestAnimationFrame(() => this.renderConfetti());
    } else {
      this.confettiRaf = null;
    }
  }
}

// Instantiate game on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.gabMadGame = new GabMadGame();
});
