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
    currency: localStorage.getItem('calcCurrency') || '',
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const displayEl = $('#display');
  const exprEl = $('#expression');
  const sciPanel = $('#sciPanel');
  const convertPanel = $('#convertPanel');
  const convertOutput = $('#convertOutput');
  const agePanel = $('#agePanel');
  const ageDay = $('#ageDay');
  const ageMonth = $('#ageMonth');
  const ageYear = $('#ageYear');
  const ageBtn = $('#ageBtn');
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

  const AR_DIGITS = ['صفر', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const FR_DIGITS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const EN_DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

  // --- Currencies ---
  var CURRENCIES = {
    MAD: {
      ar: { name: 'درهم', dual: 'درهمان', plural: 'دراهم', sub: 'سنتيم', subDual: 'سنتيمان', subPlural: 'سنتيمات' },
      fr: { name: 'dirham', plural: 'dirhams', sub: 'centime', subPlural: 'centimes' },
      en: { name: 'dirham', plural: 'dirhams', sub: 'centime', subPlural: 'centimes' },
    },
    USD: {
      ar: { name: 'دولار', dual: 'دولاران', plural: 'دولارات', sub: 'سنت', subDual: 'سنتان', subPlural: 'سنتات' },
      fr: { name: 'dollar', plural: 'dollars', sub: 'cent', subPlural: 'cents' },
      en: { name: 'dollar', plural: 'dollars', sub: 'cent', subPlural: 'cents' },
    },
    EUR: {
      ar: { name: 'يورو', dual: 'يوروان', plural: 'يورو', sub: 'سنت', subDual: 'سنتان', subPlural: 'سنتات' },
      fr: { name: 'euro', plural: 'euros', sub: 'centime', subPlural: 'centimes' },
      en: { name: 'euro', plural: 'euros', sub: 'cent', subPlural: 'cents' },
    },
    GBP: {
      ar: { name: 'جنيه', dual: 'جنيهان', plural: 'جنيهات', sub: 'بنس', subDual: 'بنسان', subPlural: 'بنسات' },
      fr: { name: 'livre', plural: 'livres', sub: 'penny', subPlural: 'pence' },
      en: { name: 'pound', plural: 'pounds', sub: 'penny', subPlural: 'pence' },
    },
  };

  // Arabic noun agreement helpers
  function arNounForm(n, singular, dual, plural) {
    if (n === 0) return singular; // will be handled separately
    if (n === 1) return singular;
    if (n === 2) return dual;
    if (n >= 3 && n <= 10) return plural;
    return singular; // 11+ defaults to singular
  }

  function arNumberPrefix(n, lang) {
    if (lang !== 'ar') return '';
    if (n === 0) return '';
    if (n === 1) return ''; // noun alone for 1
    if (n === 2) return ''; // dual noun for 2
    return numToAr(n) + ' ';
  }

  function frNounForm(n, singular, plural) {
    if (n === 0 || n === 1) return singular;
    return plural;
  }

  function enNounForm(n, singular, plural) {
    if (n === 0 || n === 1) return singular;
    return plural;
  }

  function updateConvert() {
    const el = convertOutput;
    const raw = state.display;
    const v = parseFloat(raw);

    if (isNaN(v) || !isFinite(v)) {
      el.textContent = '—';
      return;
    }
    if (Math.abs(v) > 999999999999) {
      el.textContent = state.convertLang === 'ar' ? 'الرقم كبير جداً' :
                       state.convertLang === 'fr' ? 'Nombre trop grand' : 'Number too large';
      return;
    }

    const parts = raw.split('.');
    const intPart = parseInt(parts[0], 10);
    var lang = state.convertLang;

    // If a currency is selected
    var currCode = state.currency;
    if (currCode && CURRENCIES[currCode]) {
      var curr = CURRENCIES[currCode][lang];
      if (!curr) curr = CURRENCIES[currCode]['en']; // fallback
      var result = '';
      var neg = v < 0;
      var absInt = Math.abs(intPart);
      var decStr = parts.length > 1 ? parts[1] : '';
      var decVal = decStr ? parseInt(decStr, 10) : 0;

      if (lang === 'ar') {
        if (neg) result += 'سالب ';

        // Integer part
        if (absInt === 0 && !decStr) {
          result += 'صفر';
        } else if (absInt === 1) {
          result += curr.name + ' واحد'; // درهم واحد
        } else if (absInt === 2) {
          result += curr.dual; // درهمان
        } else if (absInt >= 3 && absInt <= 10) {
          result += numToAr(absInt) + ' ' + curr.plural;
        } else if (absInt > 10) {
          result += numToAr(absInt) + ' ' + curr.name + 'اً';
        }

        // Decimal part
        if (decStr && decVal > 0) {
          if (absInt > 0) result += ' و';
          if (decVal === 1) {
            result += curr.sub + ' واحد';
          } else if (decVal === 2) {
            result += curr.subDual;
          } else if (decVal >= 3 && decVal <= 10) {
            result += numToAr(decVal) + ' ' + curr.subPlural;
          } else {
            result += numToAr(decVal) + ' ' + curr.sub + 'اً';
          }
        }
      } else {
        // French / English
        if (neg) result += lang === 'fr' ? 'moins ' : 'negative ';

        // Integer part
        if (absInt === 0 && !decStr) {
          result += lang === 'fr' ? 'zéro' : 'zero';
        } else {
          var intWords = lang === 'fr' ? numToFr(absInt) : numToEn(absInt);
          var intForm = lang === 'fr' ? frNounForm(absInt, curr.name, curr.plural) : enNounForm(absInt, curr.name, curr.plural);
          result += intWords + ' ' + intForm;
        }

        // Decimal part
        if (decStr && decVal > 0) {
          result += ' ' + (lang === 'fr' ? 'et' : 'and') + ' ';
          var decWords = lang === 'fr' ? numToFr(decVal) : numToEn(decVal);
          var decForm = lang === 'fr' ? frNounForm(decVal, curr.sub, curr.subPlural) : enNounForm(decVal, curr.sub, curr.subPlural);
          result += decWords + ' ' + decForm;
        }
      }

      el.textContent = result;
      return;
    }

    // Original number-to-words mode (no currency)
    result = '';
    neg = v < 0;
    absInt = Math.abs(intPart);

    switch (lang) {
      case 'ar':
        result = neg ? 'سالب ' : '';
        result += absInt === 0 && parts.length === 1 ? 'صفر' : numToAr(absInt);
        if (parts.length > 1 && parts[1]) {
          result += ' فاصل';
          for (const ch of parts[1]) {
            result += ' ' + (AR_DIGITS[parseInt(ch, 10)] || ch);
          }
        }
        break;
      case 'fr':
        result = neg ? 'moins ' : '';
        result += absInt === 0 && parts.length === 1 ? 'zéro' : numToFr(absInt);
        if (parts.length > 1 && parts[1]) {
          result += ' virgule';
          for (const ch of parts[1]) {
            result += ' ' + (FR_DIGITS[parseInt(ch, 10)] || ch);
          }
        }
        break;
      case 'en':
        result = neg ? 'negative ' : '';
        result += absInt === 0 && parts.length === 1 ? 'zero' : numToEn(absInt);
        if (parts.length > 1 && parts[1]) {
          result += ' point';
          for (const ch of parts[1]) {
            result += ' ' + (EN_DIGITS[parseInt(ch, 10)] || ch);
          }
        }
        break;
    }
    el.textContent = result;
  }

  // --- Age Calculator ---
  function initAgeSelects() {
    // Year: 1900 to current
    var cy = new Date().getFullYear();
    ageYear.innerHTML = '';
    for (var y = cy; y >= 1900; y--) {
      var opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      ageYear.appendChild(opt);
    }
    // Month: 1-12
    ageMonth.innerHTML = '';
    for (var m = 1; m <= 12; m++) {
      var opt = document.createElement('option');
      opt.value = m; opt.textContent = m;
      ageMonth.appendChild(opt);
    }
    // Day: 1-31
    ageDay.innerHTML = '';
    for (var d = 1; d <= 31; d++) {
      var opt = document.createElement('option');
      opt.value = d; opt.textContent = d;
      ageDay.appendChild(opt);
    }
    // Set default to 18 years ago so user sees something meaningful
    var def = new Date();
    ageYear.value = def.getFullYear() - 18;
    ageMonth.value = def.getMonth() + 1;
    ageDay.value = Math.min(def.getDate(), 28);
  }

  function calculateAge() {
    var y = parseInt(ageYear.value);
    var m = parseInt(ageMonth.value);
    var d = parseInt(ageDay.value);
    if (!y || !m || !d) {
      showToast('⚠️ الرجاء اختيار تاريخ كامل');
      return;
    }

    var birth = new Date(y, m - 1, d);
    var now = new Date();

    if (birth > now) {
      showToast('⚠️ التاريخ لا يمكن أن يكون في المستقبل');
      return;
    }

    // Difference in ms
    var diffMs = now - birth;

    // ---- Precise years, months, days ----
    var years = now.getFullYear() - birth.getFullYear();
    var months = now.getMonth() - birth.getMonth();
    var days = now.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      // Days in previous month
      var prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    // ---- Totals ----
    var totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    var totalWeeks = Math.floor(totalDays / 7);
    var totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    var totalMinutes = Math.floor(diffMs / (1000 * 60));

    // ---- Update UI with animation ----
    var els = [
      { el: $('#ageYearsVal'), val: years, suffix: ' 🎂' },
      { el: $('#ageMonthsVal'), val: months, suffix: '' },
      { el: $('#ageWeeksVal'), val: totalWeeks.toLocaleString(), suffix: '' },
      { el: $('#ageDaysVal'), val: totalDays.toLocaleString(), suffix: '' },
      { el: $('#ageHoursVal'), val: totalHours.toLocaleString(), suffix: '' },
      { el: $('#ageMinsVal'), val: totalMinutes.toLocaleString(), suffix: '' },
    ];

    els.forEach(function(item) {
      var el = item.el;
      if (!el) return;
      // Remove animation then re-add for visual feedback
      el.style.animation = 'none';
      el.offsetHeight; // force reflow
      el.textContent = item.val + item.suffix;
      el.style.animation = 'fadeIn 0.4s ease';
    });
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
        agePanel.classList.toggle('visible', state.mode === 'age');
        convertPanel.classList.toggle('visible', state.mode === 'convert');
        if (state.mode === 'convert') updateConvert();
        if (state.mode === 'age') {
          if (ageYear.options.length === 0) initAgeSelects();
          calculateAge();
        }
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

    // Currency select
    $('#currSelect').addEventListener('change', function() {
      state.currency = this.value;
      localStorage.setItem('calcCurrency', state.currency);
      if (state.mode === 'convert') updateConvert();
    });

    // Age calculator
    function calcAndSaveAge() {
      calculateAge();
      // Store date for recall
      localStorage.setItem('ageY', ageYear.value);
      localStorage.setItem('ageM', ageMonth.value);
      localStorage.setItem('ageD', ageDay.value);
    }

    ageBtn.addEventListener('click', calcAndSaveAge);

    // Auto-calculate on select change
    ageYear.addEventListener('change', calcAndSaveAge);
    ageMonth.addEventListener('change', calcAndSaveAge);
    ageDay.addEventListener('change', calcAndSaveAge);

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
    $('#currSelect').value = state.currency;
    renderHistory();
    updateDisplay();
    bindEvents();
    registerSW();
    checkForUpdate();

    // Init age selects and restore saved date
    initAgeSelects();
    var savedY = localStorage.getItem('ageY');
    if (savedY) {
      ageYear.value = savedY;
      ageMonth.value = localStorage.getItem('ageM') || 1;
      ageDay.value = localStorage.getItem('ageD') || 1;
    }

    updateBtn.addEventListener('click', applyUpdate);
  }

  init();
})();
