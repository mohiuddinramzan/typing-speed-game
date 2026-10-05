(function () {
  'use strict';

  var SENTENCES = [
    "The quick brown fox jumps over the lazy dog.",
    "Technology changes the way people learn, work, and communicate.",
    "Small steps every day can lead to big improvements over time.",
    "Practice makes progress when you stay consistent and focused.",
    "A good habit is easier to keep when it fits naturally into your day.",
    "The morning train arrived early, so we waited quietly on the platform.",
    "She opened the window and listened to the rain tapping on the roof.",
    "Every great project begins with a simple idea and a willingness to try.",
    "Reading a few pages before bed can make the whole evening feel calmer.",
    "Our team reviewed the plan, fixed the small problems, and shipped it on Friday.",
    "Good design is not only about how something looks, but also how it works.",
    "He carried the old wooden box across the field and set it down by the river.",
    "Clear writing helps readers understand an idea without any extra effort.",
    "The library was silent except for the soft sound of turning pages.",
    "When the lights went out, the whole street filled with the glow of candles.",
    "Learning to type quickly saves hours of time over the course of a year.",
    "The market was crowded with people selling fresh bread, fruit, and flowers.",
    "Patience and curiosity are two of the most useful skills you can build.",
    "A calm mind makes better decisions than a hurried one.",
    "The mountain trail was steep, but the view from the top was worth every step.",
    "Please remember to save your work before closing the program.",
    "Winter arrived overnight, covering the hills with a thin layer of snow.",
    "They talked for hours about music, travel, and the places they wanted to see.",
    "Accuracy matters more than speed when you are still learning a new skill.",
    "The engineer checked each connection twice before turning on the power.",
    "Fresh coffee, warm sunlight, and a quiet desk make a perfect start to the day.",
    "Success rarely comes from a single big moment; it grows from many small efforts.",
    "The children built a castle out of sand and decorated it with shells.",
    "Keep your wrists relaxed, your back straight, and your eyes on the screen.",
    "An honest question often teaches more than a confident guess.",
    "The bakery on the corner opens at six and always smells like cinnamon.",
    "Even a short walk outside can clear your head and bring new ideas.",
    "After the storm passed, the sky turned a soft shade of orange and pink.",
    "Good teachers explain difficult topics in simple words and encourage questions.",
    "The software update included several bug fixes and a faster start-up time.",
    "Many people find that a tidy desk makes it easier to concentrate.",
    "He practiced the piano every evening until the melody felt natural.",
    "Travel teaches us that there are many different ways to live a good life.",
    "The garden grew quickly this spring thanks to steady rain and warm days.",
    "If you make a mistake, correct it calmly and keep moving forward.",
    "A strong password should be long, unique, and hard for others to guess.",
    "The festival ended with fireworks that lit up the harbor and the nearby hills.",
    "Teamwork works best when everyone knows the goal and trusts each other.",
    "She wrote a short note, folded it twice, and slipped it under the door.",
    "The museum's newest exhibit explores how ancient cities solved everyday problems.",
    "Rhythm is important in typing: steady, relaxed strokes beat sudden bursts.",
    "We planted twelve trees along the road, hoping they would grow tall and strong.",
    "Sometimes the best solution is the simplest one, hidden in plain sight.",
    "The old clock in the hall struck noon, and the house slowly came to life.",
    "Healthy routines, enough sleep, and regular breaks help you work at your best.",
    "Fishermen pushed their boats into the calm water just before sunrise.",
    "It takes courage to share an unfinished idea, but feedback makes it better.",
    "The recipe calls for two eggs, a cup of flour, and a pinch of salt.",
    "Curiosity led her to take apart the radio and learn how every piece fit together.",
    "Whether you type with two fingers or ten, steady practice will improve your speed.",
    "Wind rattled the shutters as the lantern flickered on the kitchen table.",
    "A clean interface lets people focus on the task instead of the tool.",
    "The new bridge connects both sides of the valley and shortens the trip by an hour.",
    "Do not be afraid to start slowly; speed will follow once the pattern feels familiar.",
    "Bright stars filled the desert sky, and the night felt endless and quiet."
  ];

  var KEY_SETTINGS = 'tsg_settings';
  var KEY_BEST = 'tsg_best';
  var KEY_HISTORY = 'tsg_history';
  var DURATIONS = [15, 30, 60, 120];
  var HISTORY_LIMIT = 10;
  var BLOCKED_INPUT_TYPES = ['insertFromPaste', 'insertFromDrop', 'insertFromYank', 'insertReplacementText', 'insertFromPasteAsQuotation'];

  function $(sel) { return document.querySelector(sel); }

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }

  function num(v) {
    v = Number(v);
    return isFinite(v) ? v : 0;
  }

  /* ---------- Settings ---------- */
  var stored = load(KEY_SETTINGS, {});
  var settings = {
    theme: stored.theme === 'dark' || stored.theme === 'light'
      ? stored.theme
      : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    sound: stored.sound === true,
    autoFocus: stored.autoFocus !== false,
    duration: DURATIONS.indexOf(stored.duration) !== -1 ? stored.duration : 60
  };

  function saveSettings() { save(KEY_SETTINGS, settings); }

  /* ---------- Elements ---------- */
  var views = { home: $('#homeView'), test: $('#testView'), result: $('#resultView') };
  var typing = $('#typing');
  var viewport = $('#viewport');
  var textEl = $('#text');
  var input = $('#typeInput');
  var wpmEl = $('#wpmVal');
  var accEl = $('#accVal');
  var errEl = $('#errVal');
  var timeEl = $('#timeVal');
  var timeStat = $('#timeStat');
  var bar = $('#bar');
  var themeBtn = $('#themeBtn');
  var historyDialog = $('#historyDialog');
  var settingsDialog = $('#settingsDialog');
  var soundSwitch = $('#soundSwitch');
  var focusSwitch = $('#focusSwitch');

  /* ---------- State ---------- */
  var state = {
    running: false,
    duration: 60,
    startedAt: 0,
    timerId: 0,
    target: '',
    chars: [],
    typed: '',
    total: 0,
    correct: 0,
    wrong: 0
  };
  var view = 'home';

  /* ---------- Sound (Web Audio) ---------- */
  var audioCtx = null;

  function getAudio() {
    if (!settings.sound) return null;
    try {
      if (!audioCtx) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (e) {
      return null;
    }
  }

  function tone(freq, dur, type, vol, delay) {
    var a = getAudio();
    if (!a) return;
    var t = a.currentTime + (delay || 0);
    var osc = a.createOscillator();
    var gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(a.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  var sfx = {
    key: function () { tone(600 + Math.random() * 80, 0.05, 'triangle', 0.05); },
    error: function () { tone(150, 0.12, 'square', 0.035); },
    done: function () {
      tone(523, 0.16, 'sine', 0.08, 0);
      tone(659, 0.16, 'sine', 0.08, 0.15);
      tone(784, 0.32, 'sine', 0.08, 0.3);
    }
  };

  /* ---------- Text generator ---------- */
  var queue = [];
  var lastSentence = '';

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function nextSentence() {
    if (!queue.length) {
      queue = shuffle(SENTENCES.slice());
      if (queue[queue.length - 1] === lastSentence) {
        var swap = queue[0];
        queue[0] = queue[queue.length - 1];
        queue[queue.length - 1] = swap;
      }
    }
    lastSentence = queue.pop();
    return lastSentence;
  }

  function appendText(str) {
    var full = (state.target ? ' ' : '') + str;
    var frag = document.createDocumentFragment();
    var wrap = null;
    for (var i = 0; i < full.length; i++) {
      var c = full.charAt(i);
      var span = document.createElement('span');
      span.className = 'ch';
      span.textContent = c;
      state.chars.push(span);
      if (c === ' ') {
        wrap = null;
        frag.appendChild(span);
      } else {
        if (!wrap) {
          wrap = document.createElement('span');
          wrap.className = 'word';
          frag.appendChild(wrap);
        }
        wrap.appendChild(span);
      }
    }
    textEl.appendChild(frag);
    state.target += full;
  }

  /* ---------- Rendering ---------- */
  function showView(name) {
    view = name;
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== name; });
    typing.classList.toggle('running', name === 'test');
  }

  function paint(from, to) {
    var t = state.typed;
    var g = state.target;
    var start = Math.max(0, from);
    var end = Math.min(to, state.chars.length - 1);
    for (var i = start; i <= end; i++) {
      var cls = 'ch';
      if (i < t.length) cls += t.charAt(i) === g.charAt(i) ? ' correct' : ' incorrect';
      else if (i === t.length) cls += ' current';
      if (state.chars[i].className !== cls) state.chars[i].className = cls;
    }
  }

  function scrollToCurrent() {
    var el = state.chars[Math.min(state.typed.length, state.chars.length - 1)];
    if (!el) return;
    var lh = parseFloat(getComputedStyle(textEl).lineHeight) || 40;
    viewport.scrollTop = Math.max(0, el.offsetTop - lh);
  }

  function countCorrect() {
    var c = 0;
    var t = state.typed;
    var g = state.target;
    for (var i = 0; i < t.length; i++) {
      if (t.charAt(i) === g.charAt(i)) c++;
    }
    return c;
  }

  function elapsedSeconds() {
    return (performance.now() - state.startedAt) / 1000;
  }

  function updateStats() {
    var wpm = 0;
    var acc = 100;
    if (state.total > 0) {
      var e = Math.max(elapsedSeconds(), 3);
      wpm = Math.round(state.correct / 5 / (e / 60));
      acc = Math.min(100, Math.round(state.correct / state.total * 100));
    }
    wpmEl.textContent = String(wpm);
    accEl.textContent = acc + '%';
    errEl.textContent = String(state.wrong);
  }

  function renderTime(remaining) {
    var secs = Math.ceil(remaining);
    timeEl.textContent = secs + 's';
    bar.style.transform = 'scaleX(' + Math.max(0, remaining / state.duration) + ')';
    timeStat.classList.toggle('warn', secs <= 10 && state.running);
  }

  /* ---------- Test flow ---------- */
  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = 0;
    }
  }

  function startTest() {
    stopTimer();
    getAudio();
    state.duration = settings.duration;
    state.running = true;
    state.typed = '';
    state.total = 0;
    state.correct = 0;
    state.wrong = 0;
    state.target = '';
    state.chars = [];
    textEl.textContent = '';
    while (state.target.length < 240) appendText(nextSentence());

    input.disabled = false;
    input.value = '';
    viewport.scrollTop = 0;
    paint(0, 0);
    timeStat.classList.remove('warn');
    showView('test');
    renderTime(state.duration);
    updateStats();

    state.startedAt = performance.now();
    state.timerId = setInterval(tick, 100);
    if (settings.autoFocus) input.focus({ preventScroll: true });
  }

  function tick() {
    var remaining = Math.max(0, state.duration - elapsedSeconds());
    renderTime(remaining);
    updateStats();
    if (remaining <= 0) finishTest();
  }

  function cancelTest() {
    state.running = false;
    stopTimer();
    input.disabled = true;
    input.blur();
    showView('home');
  }

  function levelFor(wpm) {
    if (wpm <= 20) return 'Beginner';
    if (wpm <= 35) return 'Novice';
    if (wpm <= 50) return 'Average';
    if (wpm <= 70) return 'Fast';
    if (wpm <= 90) return 'Very Fast';
    return 'Expert';
  }

  function finishTest() {
    if (!state.running) return;
    state.running = false;
    stopTimer();
    input.disabled = true;

    state.correct = Math.min(countCorrect(), state.total);
    var wpm = Math.max(0, Math.round(state.correct / 5 / (state.duration / 60)));
    var acc = state.total > 0 ? Math.min(100, state.correct / state.total * 100) : 0;
    acc = Math.round(acc * 10) / 10;
    var score = Math.max(0, Math.round(wpm * (acc / 100) * 10));

    var result = {
      wpm: wpm,
      acc: acc,
      errors: state.wrong,
      chars: state.total,
      correct: state.correct,
      time: state.duration,
      score: score,
      date: Date.now()
    };

    var newBest = false;
    if (result.chars > 0) {
      var history = load(KEY_HISTORY, []);
      if (!Array.isArray(history)) history = [];
      history.unshift({ wpm: wpm, acc: acc, errors: result.errors, time: result.time, date: result.date });
      save(KEY_HISTORY, history.slice(0, HISTORY_LIMIT));
    }
    if (result.chars >= 20) {
      var b = load(KEY_BEST, {});
      var nb = { wpm: num(b.wpm), acc: num(b.acc), score: num(b.score) };
      if (wpm > nb.wpm) { nb.wpm = wpm; newBest = true; }
      if (acc > nb.acc) nb.acc = acc;
      if (score > nb.score) nb.score = score;
      save(KEY_BEST, nb);
    }

    var level = levelFor(wpm);
    $('#perfVal').textContent = level;
    $('#rWpm').textContent = String(wpm);
    $('#rAcc').textContent = acc.toFixed(1) + '%';
    $('#rErr').textContent = String(result.errors);
    $('#rChars').textContent = String(result.chars);
    $('#rCorrect').textContent = String(result.correct);
    $('#rTime').textContent = result.time + ' seconds';
    $('#rScore').textContent = String(score);
    $('#newBest').hidden = !newBest;
    $('#live').textContent = 'Test complete. ' + wpm + ' words per minute, ' + acc.toFixed(1) + ' percent accuracy. Performance: ' + level + '.';

    renderBest();
    showView('result');
    window.scrollTo(0, 0);
    $('#tryAgainBtn').focus({ preventScroll: true });
    sfx.done();
  }

  /* ---------- Typing input ---------- */
  function placeCaretAtEnd() {
    var n = input.value.length;
    try { input.setSelectionRange(n, n); } catch (e) { /* not supported */ }
  }

  input.addEventListener('input', function (e) {
    if (!state.running) return;
    var old = state.typed;
    var val = input.value;
    var type = e.inputType || '';
    var grew = val.length > old.length;
    var composing = e.isComposing === true;

    var reject =
      BLOCKED_INPUT_TYPES.indexOf(type) !== -1 ||
      (grew && val.length - old.length > 2) ||
      (grew && !composing && val.indexOf(old) !== 0) ||
      (!grew && !composing && val.length < old.length && old.indexOf(val) !== 0) ||
      (!grew && !composing && val.length === old.length && val !== old);

    if (reject) {
      input.value = old;
      placeCaretAtEnd();
      return;
    }

    if (val.length > state.target.length) {
      val = val.slice(0, state.target.length);
      input.value = val;
    }

    if (grew && val.indexOf(old) === 0) {
      for (var i = old.length; i < val.length; i++) {
        state.total++;
        if (val.charAt(i) === state.target.charAt(i)) {
          sfx.key();
        } else {
          state.wrong++;
          sfx.error();
        }
      }
    }

    state.typed = val;
    state.correct = countCorrect();

    if (state.target.length - val.length < 160) appendText(nextSentence());

    paint(Math.min(old.length, val.length) - 1, Math.max(old.length, val.length) + 1);
    scrollToCurrent();
    updateStats();
  });

  input.addEventListener('keydown', function (e) {
    var k = e.key;
    var selectAll = (e.ctrlKey || e.metaKey) && k.toLowerCase() === 'a';
    if (k === 'Enter' || k === 'ArrowLeft' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'Home' || k === 'PageUp' || selectAll) {
      e.preventDefault();
    }
  });

  ['paste', 'drop', 'cut', 'copy', 'dragstart'].forEach(function (name) {
    input.addEventListener(name, function (e) { e.preventDefault(); });
  });

  ['click', 'select', 'focus', 'keyup'].forEach(function (name) {
    input.addEventListener(name, placeCaretAtEnd);
  });

  typing.addEventListener('contextmenu', function (e) {
    if (state.running) e.preventDefault();
  });

  input.addEventListener('focus', function () { typing.classList.add('focused'); });
  input.addEventListener('blur', function () { typing.classList.remove('focused'); });

  /* ---------- Personal best & history ---------- */
  function renderBest() {
    var b = load(KEY_BEST, {});
    var hasBest = num(b.wpm) > 0;
    $('#bestWpm').textContent = hasBest ? String(num(b.wpm)) : '—';
    $('#bestAcc').textContent = hasBest ? num(b.acc).toFixed(1) + '%' : '—';
    $('#bestScore').textContent = hasBest ? String(num(b.score)) : '—';
  }

  function cell(text, title) {
    var td = document.createElement('td');
    td.textContent = text;
    if (title) td.title = title;
    return td;
  }

  function renderHistory() {
    var history = load(KEY_HISTORY, []);
    if (!Array.isArray(history)) history = [];
    var body = $('#historyBody');
    body.textContent = '';
    history.slice(0, HISTORY_LIMIT).forEach(function (item) {
      var d = new Date(num(item.date));
      var short = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      var tr = document.createElement('tr');
      tr.appendChild(cell(num(item.wpm) + ' WPM'));
      tr.appendChild(cell(num(item.acc).toFixed(1) + '%'));
      tr.appendChild(cell(String(num(item.errors))));
      tr.appendChild(cell(num(item.time) + 's'));
      tr.appendChild(cell(short, d.toLocaleString()));
      body.appendChild(tr);
    });
    var empty = history.length === 0;
    $('#historyEmpty').hidden = !empty;
    $('#historyTable').hidden = empty;
    $('#clearHistoryBtn').disabled = empty;
  }

  /* ---------- Theme & settings UI ---------- */
  function applyTheme(theme) {
    settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#10141a' : '#eef1f0');
    themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    var radio = document.querySelector('input[name="theme"][value="' + theme + '"]');
    if (radio) radio.checked = true;
  }

  function syncSwitches() {
    soundSwitch.checked = settings.sound;
    focusSwitch.checked = settings.autoFocus;
    $('#soundState').textContent = settings.sound ? 'On' : 'Off';
    $('#focusState').textContent = settings.autoFocus ? 'On' : 'Off';
  }

  function openDialog(dialog) {
    if (dialog.open) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  /* ---------- Events ---------- */
  $('#startBtn').addEventListener('click', startTest);
  $('#restartBtn').addEventListener('click', startTest);
  $('#tryAgainBtn').addEventListener('click', startTest);
  $('#newTestBtn').addEventListener('click', function () { showView('home'); $('#startBtn').focus({ preventScroll: true }); });
  $('#exitBtn').addEventListener('click', cancelTest);
  $('#brandBtn').addEventListener('click', function () {
    if (state.running) cancelTest();
    else showView('home');
  });

  Array.prototype.forEach.call(document.querySelectorAll('input[name="duration"]'), function (r) {
    r.checked = Number(r.value) === settings.duration;
    r.addEventListener('change', function () {
      settings.duration = Number(r.value);
      saveSettings();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('input[name="theme"]'), function (r) {
    r.addEventListener('change', function () {
      applyTheme(r.value);
      saveSettings();
    });
  });

  themeBtn.addEventListener('click', function () {
    applyTheme(settings.theme === 'dark' ? 'light' : 'dark');
    saveSettings();
  });

  soundSwitch.addEventListener('change', function () {
    settings.sound = soundSwitch.checked;
    saveSettings();
    syncSwitches();
    if (settings.sound) sfx.key();
  });

  focusSwitch.addEventListener('change', function () {
    settings.autoFocus = focusSwitch.checked;
    saveSettings();
    syncSwitches();
  });

  $('#historyBtn').addEventListener('click', function () {
    renderHistory();
    openDialog(historyDialog);
  });

  $('#settingsBtn').addEventListener('click', function () { openDialog(settingsDialog); });

  $('#clearHistoryBtn').addEventListener('click', function () {
    if (window.confirm('Clear all saved test history?')) {
      save(KEY_HISTORY, []);
      renderHistory();
    }
  });

  [historyDialog, settingsDialog].forEach(function (dialog) {
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || (e.target.closest && e.target.closest('[data-close]'))) {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
      }
    });
    dialog.addEventListener('close', function () {
      if (state.running && settings.autoFocus) input.focus({ preventScroll: true });
    });
  });

  document.addEventListener('keydown', function (e) {
    if (document.querySelector('dialog[open]')) return;
    if (e.key === 'Escape' && state.running) {
      e.preventDefault();
      cancelTest();
    } else if (e.key === 'Enter' && !state.running && (view === 'home' || view === 'result')) {
      if (e.target.closest && e.target.closest('button, a, summary')) return;
      e.preventDefault();
      startTest();
    }
  });

  /* ---------- Init ---------- */
  applyTheme(settings.theme);
  syncSwitches();
  renderBest();
  showView('home');
})();
