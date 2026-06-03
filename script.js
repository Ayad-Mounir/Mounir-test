(function() {
  'use strict';

  // --- State ---
  let state = {
    display: '0',
    expression: '',
    memory: 0,
    operator: null,
    prevValue: null,
    resetNext: false,
    justEvaluated: false,
    openParens: 0,
    history: JSON.parse(localStorage.getItem('calcHistory') || '[]'),
    mode: 'basic',
    theme: localStorage.getItem('calcTheme') || 'dark',
    convertLang: localStorage.getItem('calcLang') || 'ar',
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const displayEl = $('#display');
  const exprEl = $('#expression');
  const sciPanel = $('#sciPanel');
  const convertPanel = $('#convertPanel');
  const convertOutput = $('#convertOutput');
  const historyPanel = $('#historyPanel');
  const historyList = $('#historyList');
  const toastEl = $('#toast');

  let toastTimer = null;

  // --- Utilities ---
  function formatNum(n) {
    if (n === Infinity || n === -Infinity) return 'Infinity';
    if (typeof n !== 'number' || isNaN(n)) return 'خطأ';
    const s = n.toPrecision(12);
    return parseFloat(s).toString();
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2000);
  }

  function updateDisplay() {
    let d = state.display;
    const maxLen = 14;
    if (d.length > maxLen) {
      displayEl.classList.add('shrink');
    } else {
      displayEl.classList.remove('shrink');
    }
    if (d === 'خطأ' || d === 'Infinity') {
      displayEl.classList.add('error');
    } else {
      displayEl.classList.remove('error');
    }
    displayEl.textContent = d;
    exprEl.textContent = state.expression;
    if (state.mode === 'convert') updateConvert();
  }

  // --- History ---
  function saveHistory() {
    localStorage.setItem('calcHistory', JSON.stringify(state.history));
  }

  function renderHistory() {
    if (state.history.length === 0) {
      historyList.innerHTML = '<div class="empty-history">لا يوجد سجل بعد</div>';
      return;
    }
    historyList.innerHTML = [...state.history].reverse().map((item, i) =>
      `<div class="history-item" data-idx="${state.history.length - 1 - i}">
        <div class="h-expr">${item.expr}</div>
        <div class="h-result">= ${item.result}</div>
      </div>`
    ).join('');
  }

  function addHistory(expr, result) {
    state.history.push({ expr, result });
    if (state.history.length > 100) state.history.shift();
    saveHistory();
    renderHistory();
  }

  // --- Core ---
  function inputDigit(d) {
    if (state.resetNext || state.display === '0' || state.justEvaluated) {
      state.display = d;
      state.resetNext = false;
      state.justEvaluated = false;
    } else {
      if (state.display.length >= 16) return;
      state.display += d;
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (state.resetNext || state.justEvaluated) {
      state.display = '0.';
      state.resetNext = false;
      state.justEvaluated = false;
      updateDisplay();
      return;
    }
    if (!state.display.includes('.')) {
      state.display += '.';
    }
    updateDisplay();
  }

  function clearAll() {
    state.display = '0';
    state.expression = '';
    state.operator = null;
    state.prevValue = null;
    state.resetNext = false;
    state.justEvaluated = false;
    state.openParens = 0;
    updateDisplay();
  }

  function backspace() {
    if (state.resetNext || state.justEvaluated) return;
    if (state.display.length > 1) {
      state.display = state.display.slice(0, -1);
    } else {
      state.display = '0';
    }
    updateDisplay();
  }

  function negate() {
    if (state.display === '0') return;
    state.display = state.display.startsWith('-') ? state.display.slice(1) : '-' + state.display;
    updateDisplay();
  }

  function percent() {
    const v = parseFloat(state.display);
    if (isNaN(v)) return;
    state.display = formatNum(v / 100);
    updateDisplay();
  }

  function setOperator(op) {
    const cur = parseFloat(state.display);
    if (isNaN(cur)) return;

    if (state.operator && !state.resetNext) {
      const result = compute(state.prevValue, cur, state.operator);
      state.display = formatNum(result);
      state.prevValue = result;
    } else {
      state.prevValue = cur;
    }

    state.operator = op;
    state.resetNext = true;
    state.justEvaluated = false;

    const sym = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
    const expr = state.expression ? `${state.expression} ${sym[op] || op}` : `${state.display} ${sym[op] || op}`;
    state.expression = expr;
    updateDisplay();
  }

  function compute(a, b, op) {
    switch (op) {
      case 'add': return a + b;
      case 'subtract': return a - b;
      case 'multiply': return a * b;
      case 'divide': return b === 0 ? NaN : a / b;
      default: return b;
    }
  }

  function evaluate() {
    if (state.justEvaluated) return;

    const cur = parseFloat(state.display);
    if (isNaN(cur)) return;

    let result;
    if (state.operator && state.prevValue !== null) {
      result = compute(state.prevValue, cur, state.operator);
    } else {
      result = cur;
    }

    if (isNaN(result) || !isFinite(result)) {
      state.display = 'خطأ';
      state.expression = '';
      state.operator = null;
      state.prevValue = null;
      state.resetNext = true;
      state.justEvaluated = true;
      updateDisplay();
      return;
    }

    const exprStr = state.expression
      ? `${state.expression} ${state.display} =`
      : `${state.display} =`;
    const formattedResult = formatNum(result);

    addHistory(exprStr, formattedResult);

    state.display = formattedResult;
    state.expression = '';
    state.operator = null;
    state.prevValue = null;
    state.resetNext = true;
    state.justEvaluated = true;
    updateDisplay();
  }

  // --- Scientific Functions ---
  function applySci(fn) {
    const v = parseFloat(state.display);
    if (isNaN(v)) { showToast('رقم غير صالح'); return; }

    let result;
    const expr = state.display;

    switch (fn) {
      case 'sin': result = Math.sin(v * Math.PI / 180); break;
      case 'cos': result = Math.cos(v * Math.PI / 180); break;
      case 'tan': result = Math.tan(v * Math.PI / 180); break;
      case 'log': result = Math.log10(v); break;
      case 'ln': result = Math.log(v); break;
      case '√': result = Math.sqrt(v); break;
      case 'x²': result = v * v; break;
      case 'x³': result = v * v * v; break;
      case 'xʸ':
        state.prevValue = v;
        state.operator = 'pow';
        state.resetNext = true;
        state.expression = `${state.display} ^`;
        updateDisplay();
        return;
      case 'π': result = Math.PI; state.justEvaluated = false; state.resetNext = true; break;
      case 'e': result = Math.E; state.justEvaluated = false; state.resetNext = true; break;
      case '!':
        if (v < 0 || !Number.isInteger(v)) { showToast('غير معرف'); return; }
        result = factorial(v);
        break;
      case '1/x':
        if (v === 0) { showToast('غير معرف'); return; }
        result = 1 / v;
        break;
      case '|x|': result = Math.abs(v); break;
      case '(':
        state.openParens++;
        state.expression += '(';
        if (state.resetNext || state.justEvaluated) {
          state.display = '0';
          state.resetNext = false;
          state.justEvaluated = false;
        }
        updateDisplay();
        return;
      case ')':
        if (state.openParens <= 0) { showToast('لا يوجد قوس فتح'); return; }
        state.openParens--;
        evaluate();
        return;
      default: return;
    }

    if (isNaN(result) || !isFinite(result)) {
      state.display = 'خطأ';
    } else {
      state.display = formatNum(result);
      state.expression = `${fn}(${expr})`;
    }
    state.resetNext = true;
    state.justEvaluated = false;
    updateDisplay();
  }

  function factorial(n) {
    if (n <= 1) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  // --- Power (xʸ) completion ---
  function computePower(a, b) {
    return Math.pow(a, b);
  }

  // --- Number to Words ---
  const NU = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const NU2 = ['', 'أحد', 'اثنا', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const TEENS = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];

  function arUnder1000(n) {
    if (n === 0) return '';
    let s = '';
    const h = Math.floor(n / 100);
    const r = n % 100;
    if (h === 1) s += 'مئة';
    else if (h === 2) s += 'مئتان';
    else if (h > 2) s += NU[h] + ' مئة';
    if (r === 0) return s;
    if (s) s += ' و';
    if (r < 10) s += NU[r];
    else if (r < 20) s += TEENS[r - 10];
    else {
      const u = r % 10;
      const t = Math.floor(r / 10);
      if (u) s += NU[u] + ' و';
      s += TENS[t];
    }
    return s;
  }

  function numToAr(n) {
    if (n === 0) return 'صفر';
    if (n < 0) return 'سالب ' + numToAr(-n);
    const groups = [
      [1e9, 'مليار', 'ملياران', 'مليارات'],
      [1e6, 'مليون', 'مليونان', 'ملايين'],
      [1e3, 'ألف', 'ألفان', 'آلاف'],
    ];
    let s = '';
    let rem = n;
    for (const [div, sg, dual, pl] of groups) {
      const q = Math.floor(rem / div);
      if (q > 0) {
        if (s) s += ' و';
        if (q === 1) s += sg;
        else if (q === 2) s += dual;
        else if (q <= 10) s += NU[q] + ' ' + pl;
        else s += arUnder1000(q) + ' ' + sg;
      }
      rem %= div;
    }
    if (rem > 0) {
      if (s) s += ' و';
      s += arUnder1000(rem);
    }
    return s;
  }

  function numToFr(n) {
    if (n === 0) return 'zéro';
    if (n < 0) return 'moins ' + numToFr(-n);
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
      'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix',
      'quatre-vingt', 'quatre-vingt-dix'];

    function under1000(x) {
      if (x === 0) return '';
      let s = '';
      const c = Math.floor(x / 100);
      const r = x % 100;
      if (c === 1) s += 'cent';
      else if (c > 1) {
        s += units[c] + ' cent';
        if (r === 0 && c > 1) s += 's';
      }
      if (r > 0) {
        if (s) s += ' ';
        if (r < 17) s += units[r];
        else if (r < 20) s += 'dix-' + units[r - 10];
        else {
          const u = r % 10;
          const t = Math.floor(r / 10);
          if (t === 7 || t === 9) {
            const base = (t === 7) ? 60 : 80;
            const offset = r - base;
            if (t === 7) {
              s += 'soixante-';
              if (offset === 1) s += 'et ';
              s += (offset < 17) ? units[offset] : 'dix-' + units[offset - 10];
            } else {
              s += 'quatre-vingt-';
              if (offset === 0) s += 's';
              else s += units[offset];
            }
          } else {
            s += tens[t];
            if (u === 1 && t < 7) s += ' et un';
            else if (u > 1) s += '-' + units[u];
          }
        }
      }
      return s;
    }

    const groups = [
      [1e9, 'milliard'],
      [1e6, 'million'],
      [1e3, 'mille'],
    ];
    let s = '';
    let rem = n;
    for (const [div, name] of groups) {
      const q = Math.floor(rem / div);
      if (q > 0) {
        if (s) s += ' ';
        if (q === 1 && name !== 'mille') s += 'un ' + name;
        else {
          s += under1000(q) + ' ' + name;
          if (q > 1 && name !== 'mille') s += 's';
        }
      }
      rem %= div;
    }
    if (rem > 0) {
      if (s) s += ' ';
      s += under1000(rem);
    }
    return s;
  }

  function numToEn(n) {
    if (n === 0) return 'zero';
    if (n < 0) return 'negative ' + numToEn(-n);
    const units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
      'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
      'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    function under1000(x) {
      if (x === 0) return '';
      let s = '';
      const h = Math.floor(x / 100);
      const r = x % 100;
      if (h) s += units[h] + ' hundred';
      if (r) {
        if (s) s += ' ';
        if (r < 20) s += units[r];
        else {
          const u = r % 10;
          const t = Math.floor(r / 10);
          s += tens[t];
          if (u) s += '-' + units[u];
        }
      }
      return s;
    }

    const groups = [
      [1e9, 'billion'],
      [1e6, 'million'],
      [1e3, 'thousand'],
    ];
    let s = '';
    let rem = n;
    for (const [div, name] of groups) {
      const q = Math.floor(rem / div);
      if (q > 0) {
        if (s) s += ' ';
        s += under1000(q) + ' ' + name;
        if (q > 1) s += 's';
      }
      rem %= div;
    }
    if (rem > 0) {
      if (s) s += ' ';
      s += under1000(rem);
    }
    return s;
  }

  function updateConvert() {
    const v = parseFloat(state.display);
    const el = convertOutput;
    if (isNaN(v) || !isFinite(v)) {
      el.textContent = '—';
      return;
    }
    if (v > 999999999999 || v < -999999999999) {
      el.textContent = 'الرقم كبير جداً';
      return;
    }
    if (v % 1 !== 0) {
      el.textContent = 'الأعداد العشرية غير مدعومة';
      return;
    }
    const n = Math.round(v);
    switch (state.convertLang) {
      case 'ar': el.textContent = numToAr(n); break;
      case 'fr': el.textContent = numToFr(n); break;
      case 'en': el.textContent = numToEn(n); break;
    }
  }

  // --- Main input handler ---
  function handleInput(action, value) {
    if (action === 'num') {
      inputDigit(value);
    } else if (action === 'decimal') {
      inputDecimal();
    } else if (action === 'clear') {
      clearAll();
    } else if (action === 'backspace') {
      backspace();
    } else if (action === 'negate') {
      negate();
    } else if (action === 'percent') {
      percent();
    } else if (['add', 'subtract', 'multiply', 'divide'].includes(action)) {
      setOperator(action);
    } else if (action === 'equals') {
      if (state.operator === 'pow') {
        const cur = parseFloat(state.display);
        if (isNaN(cur)) return;
        const result = computePower(state.prevValue, cur);
        const exprStr = `${state.prevValue} ^ ${cur} =`;
        state.display = formatNum(result);
        state.expression = '';
        state.operator = null;
        state.prevValue = null;
        state.resetNext = true;
        state.justEvaluated = true;
        addHistory(exprStr, state.display);
        updateDisplay();
        return;
      }
      evaluate();
    }
  }

  // --- Event Binding ---
  function bindEvents() {
    // Number buttons
    $$('.btn[data-value]').forEach(btn => {
      btn.addEventListener('click', () => {
        handleInput('num', btn.dataset.value);
      });
    });

    // Action buttons
    $$('.btn[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        handleInput(btn.dataset.action);
      });
    });

    // Scientific buttons
    $$('.sci-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        applySci(btn.textContent);
      });
    });

    // Mode tabs
    $$('.mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.mode = tab.dataset.mode;
        sciPanel.classList.toggle('visible', state.mode === 'sci');
        convertPanel.classList.toggle('visible', state.mode === 'convert');
        if (state.mode === 'convert') updateConvert();
      });
    });

    // Language buttons
    $$('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.convertLang = btn.dataset.lang;
        localStorage.setItem('calcLang', state.convertLang);
        if (state.mode === 'convert') updateConvert();
      });
    });

    // Theme toggle
    $('#themeBtn').addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      document.body.classList.toggle('light', state.theme === 'light');
      $('#themeBtn').textContent = state.theme === 'dark' ? '🌙' : '☀️';
      localStorage.setItem('calcTheme', state.theme);
    });

    // History toggle
    $('#histBtn').addEventListener('click', () => {
      historyPanel.classList.toggle('open');
      renderHistory();
    });

    $('#closeHist').addEventListener('click', () => {
      historyPanel.classList.remove('open');
    });

    $('#clearHist').addEventListener('click', () => {
      state.history = [];
      saveHistory();
      renderHistory();
      showToast('تم مسح السجل');
    });

    // Click history item to use result
    historyList.addEventListener('click', (e) => {
      const item = e.target.closest('.history-item');
      if (!item) return;
      const idx = parseInt(item.dataset.idx);
      const entry = state.history[idx];
      if (entry) {
        const result = entry.result;
        state.display = result;
        state.resetNext = true;
        state.justEvaluated = false;
        state.expression = '';
        historyPanel.classList.remove('open');
        updateDisplay();
      }
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleInput('num', e.key);
        e.preventDefault();
      } else if (e.key === '.') {
        handleInput('decimal');
        e.preventDefault();
      } else if (e.key === '+' || e.key === '-') {
        if (e.key === '-' && state.display === '0') {
          handleInput('negate');
        } else {
          const map = { '+': 'add', '-': 'subtract' };
          handleInput(map[e.key]);
        }
        e.preventDefault();
      } else if (e.key === '*') {
        handleInput('multiply');
        e.preventDefault();
      } else if (e.key === '/') {
        handleInput('divide');
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === '=') {
        handleInput('equals');
        e.preventDefault();
      } else if (e.key === 'Backspace') {
        handleInput('backspace');
        e.preventDefault();
      } else if (e.key === 'Escape') {
        handleInput('clear');
        e.preventDefault();
      } else if (e.key === '%') {
        handleInput('percent');
        e.preventDefault();
      }
    });
  }

  // --- Version & Update ---
  const APP_VER = document.querySelector('meta[name="app-version"]')?.content || '1.00';
  const updateBanner = $('#updateBanner');
  const updateBtn = $('#updateBtn');
  const verDisplay = $('#verDisplay');

  verDisplay.textContent = APP_VER;

  function checkForUpdate() {
    const knownVer = localStorage.getItem('calcVer');
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        const serverVer = data.version;
        if (knownVer && knownVer !== serverVer) {
          updateBanner.classList.add('show');
        }
        localStorage.setItem('calcVer', serverVer);
        verDisplay.textContent = serverVer;
      })
      .catch(() => {});
  }

  function applyUpdate() {
    if ('serviceWorker' in navigator) {
      caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))));
      navigator.serviceWorker.getRegistration().then(r => r?.unregister());
      setTimeout(() => window.location.reload(), 300);
    } else {
      window.location.reload();
    }
  }

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });

    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
      reg.update();
    });
  }

  // --- Init ---
  function init() {
    document.body.classList.toggle('light', state.theme === 'light');
    if (state.theme === 'light') $('#themeBtn').textContent = '☀️';
    $$('.lang-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === state.convertLang);
    });
    renderHistory();
    updateDisplay();
    bindEvents();
    registerSW();
    checkForUpdate();

    updateBtn.addEventListener('click', applyUpdate);
  }

  init();
})();
