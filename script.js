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
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const displayEl = $('#display');
  const exprEl = $('#expression');
  const sciPanel = $('#sciPanel');
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

  // --- Init ---
  function init() {
    document.body.classList.toggle('light', state.theme === 'light');
    if (state.theme === 'light') $('#themeBtn').textContent = '☀️';
    renderHistory();
    updateDisplay();
    bindEvents();
  }

  init();
})();
