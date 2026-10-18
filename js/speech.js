// GabMad Speech Recognition & Fuzzy Matching Engine

class GabSpeechListener {
  constructor() {
    this.SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    this.recognition = null;
    this.isListening = false;
    this.currentAnswer = '';
    this.deadline = 0;
    this.timeoutId = null;

    this.onStateChange = null; // (listening: bool, message: string, isSuccess: bool) => void
    this.onAnswerDetected = null; // (transcript: string) => void

    this.isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  isSupported() {
    return !!this.SR;
  }

  /* Normalization and Fuzzy Matching */
  normalize(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[’']/g, '')
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    if (!m) return n;
    if (!n) return m;

    const row = [];
    for (let j = 0; j <= n; j++) row[j] = j;

    for (let i = 1; i <= m; i++) {
      let prev = i;
      for (let j = 1; j <= n; j++) {
        let val;
        if (a.charAt(i - 1) === b.charAt(j - 1)) {
          val = row[j - 1];
        } else {
          val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
        }
        row[j - 1] = prev;
        prev = val;
      }
      row[n] = prev;
    }
    return row[n];
  }

  matchesAnswer(heardText, targetAnswer) {
    const heard = this.normalize(heardText);
    const target = this.normalize(targetAnswer);
    if (!heard || !target) return false;

    // 1. Direct or substring match
    if (heard.includes(target)) return true;

    // 2. Continuous spaceless match (handles spacing differences)
    const heardNoSpace = heard.replace(/ /g, '');
    const targetNoSpace = target.replace(/ /g, '');
    if (heardNoSpace.includes(targetNoSpace)) return true;

    // 3. Token set overlap (for multi-word phrases)
    const targetWords = target.split(' ');
    const heardWords = heard.split(' ');
    if (targetWords.length > 1) {
      let matchedCount = 0;
      targetWords.forEach(w => {
        if (heardWords.includes(w)) matchedCount++;
      });
      if (matchedCount / targetWords.length >= 0.75) return true;
    }

    // 4. Levenshtein ratio for short/fuzzy matches
    const maxLen = Math.max(heard.length, target.length);
    if (maxLen > 0) {
      const dist = this.levenshtein(heard, target);
      const similarity = 1 - dist / maxLen;
      if (similarity >= 0.8) return true;
    }

    return false;
  }

  start(answer, timeoutSeconds = 15) {
    if (!this.isSupported()) {
      if (this.onStateChange) {
        this.onStateChange(false, 'Speech recognition is not supported in this browser (Chrome or Safari works best).', false);
      }
      return;
    }

    if (this.isListening) {
      this.stop();
      return;
    }

    this.currentAnswer = answer;
    this.deadline = Date.now() + (timeoutSeconds * 1000);

    try {
      this.recognition = new this.SR();
    } catch (e) {
      if (this.onStateChange) {
        this.onStateChange(false, 'Unable to initialize microphone.', false);
      }
      return;
    }

    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true;
    this.recognition.continuous = !this.isIOS;
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        for (let j = 0; j < result.length; j++) {
          const transcript = result[j].transcript;
          if (this.matchesAnswer(transcript, this.currentAnswer)) {
            this.handleMatch(transcript);
            return;
          }
        }
        if (!result.isFinal && this.onStateChange) {
          const raw = result[0].transcript.trim();
          this.onStateChange(true, `Heard: "${raw}" — keep shouting!`, false);
        }
      }
    };

    this.recognition.onerror = (e) => {
      if (!this.isListening) return;
      if (e.error === 'no-speech' || e.error === 'aborted') return;

      this.stop();
      let errorMsg = 'Listening error occurred.';
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        errorMsg = 'Microphone permission was denied. Please allow mic access in your browser.';
      } else if (e.error === 'network') {
        errorMsg = 'Speech service network error. Check your internet connection.';
      } else if (e.error === 'audio-capture') {
        errorMsg = 'No microphone detected.';
      }
      if (this.onStateChange) {
        this.onStateChange(false, errorMsg, false);
      }
    };

    this.recognition.onend = () => {
      // Auto-reconnect if time remains on this listening window
      if (this.isListening && Date.now() < this.deadline) {
        try {
          this.recognition.start();
        } catch (err) {}
      } else if (this.isListening) {
        this.stop();
        if (this.onStateChange) {
          this.onStateChange(false, 'Listening time expired. Tap Listen to try again!', false);
        }
      }
    };

    this.isListening = true;
    if (window.gabAudio) window.gabAudio.duckMusic(true);

    if (this.onStateChange) {
      this.onStateChange(true, 'Listening... shout the answer loud and clear!', false);
    }

    try {
      this.recognition.start();
    } catch (err) {
      // Catch start error
    }

    this.timeoutId = setTimeout(() => {
      if (this.isListening) {
        this.stop();
        if (this.onStateChange) {
          this.onStateChange(false, 'Didn’t catch it that time. Tap Listen to try again!', false);
        }
      }
    }, timeoutSeconds * 1000);
  }

  handleMatch(transcript) {
    const matchedTranscript = transcript;
    this.stop();
    if (this.onStateChange) {
      this.onStateChange(false, `Heard it! "${matchedTranscript}"`, true);
    }
    if (this.onAnswerDetected) {
      this.onAnswerDetected(matchedTranscript);
    }
  }

  stop() {
    if (!this.isListening) return;
    this.isListening = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.recognition) {
      this.recognition.onend = null;
      try {
        this.recognition.stop();
      } catch (err) {}
      this.recognition = null;
    }
    if (window.gabAudio) window.gabAudio.duckMusic(false);
  }
}

const speechListener = new GabSpeechListener();
window.gabSpeech = speechListener;
