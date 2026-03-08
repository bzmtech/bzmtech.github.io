/**
 * BZMTECH - Professional Visitor Counter System
 * Total visits: real API counter (counterapi.dev)
 * Live visitors: BroadcastChannel + time-based organic model
 */
(function () {
  'use strict';

  // ---- CONFIG ----
  var API_URL = 'https://api.counterapi.dev/v1/bzmtech_landing/page_visits/up';
  var REFRESH_LIVE = 8000; // ms

  // ---- HELPERS ----
  function formatNum(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function animateValue(el, end, suffix, duration) {
    if (!el || !end) return;
    var start = 0;
    var steps = 40;
    var inc = Math.max(1, Math.ceil(end / steps));
    var delay = Math.floor(duration / steps);
    var curr = 0;
    var timer = setInterval(function () {
      curr += inc;
      if (curr >= end) {
        curr = end;
        clearInterval(timer);
      }
      el.innerText = formatNum(curr) + (suffix || '');
    }, delay);
  }

  // ---- BUILD WIDGET HTML ----
  function createWidget() {
    var w = document.createElement('div');
    w.className = 'bzm-pro-counter-widget';

    var inner = document.createElement('div');
    inner.className = 'bzm-counter-inner';

    // Live section
    var liveSection = document.createElement('div');
    liveSection.className = 'bzm-live-section';
    liveSection.title = 'Visiteurs en ligne maintenant';

    var dot = document.createElement('div');
    dot.className = 'bzm-pulse-dot';

    var liveNum = document.createElement('span');
    liveNum.id = 'bzm-live-number';
    liveNum.innerText = '1';

    var liveLabel = document.createElement('span');
    liveLabel.className = 'bzm-label';
    liveLabel.innerText = 'En direct';

    liveSection.appendChild(dot);
    liveSection.appendChild(liveNum);
    liveSection.appendChild(liveLabel);

    // Divider
    var divider = document.createElement('div');
    divider.className = 'bzm-divider';

    // Total section
    var totalSection = document.createElement('div');
    totalSection.className = 'bzm-total-section';
    totalSection.title = 'Total des visites';

    var icon = document.createElement('span');
    icon.className = 'bzm-icon';
    icon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';

    var totalNum = document.createElement('span');
    totalNum.id = 'bzm-total-number';
    totalNum.innerText = '...';

    var totalLabel = document.createElement('span');
    totalLabel.className = 'bzm-label';
    totalLabel.innerText = 'Visites';

    totalSection.appendChild(icon);
    totalSection.appendChild(totalNum);
    totalSection.appendChild(totalLabel);

    inner.appendChild(liveSection);
    inner.appendChild(divider);
    inner.appendChild(totalSection);
    w.appendChild(inner);
    document.body.appendChild(w);
  }

  // ---- TOTAL VISITS (Real API) ----
  function fetchTotalVisits() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', API_URL, true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data && data.count) {
            var count = data.count;

            // Animate the widget total number
            var widgetEl = document.getElementById('bzm-total-number');
            if (widgetEl) {
              animateValue(widgetEl, count, '', 1800);
            }

            // Sync with main stats bar "Visiteurs Total"
            var mainEl = document.getElementById('total-visitors');
            if (mainEl) {
              mainEl.dataset.target = count;
              animateValue(mainEl, count, '+', 2000);
            }
          }
        } catch (e) {
          console.warn('[BZM Counter] API parse error:', e);
        }
      }
    };
    xhr.onerror = function () {
      console.warn('[BZM Counter] API offline');
      var el = document.getElementById('bzm-total-number');
      if (el) el.innerText = '-';
    };
    xhr.send();
  }

  // ---- LIVE VISITORS (BroadcastChannel + organic model) ----
  var activeTabs = 1;
  var bc = null;

  try {
    bc = new BroadcastChannel('bzmtech_live_presence');
    bc.onmessage = function (e) {
      if (e.data === 'ping') {
        bc.postMessage('pong');
      } else if (e.data === 'pong') {
        activeTabs++;
      }
    };
  } catch (err) {
    // BroadcastChannel not supported (older browsers)
  }

  function updateLiveCount() {
    var h = new Date().getHours();
    var m = new Date().getMinutes();
    var organic = 1;

    // Business hours model (9h-19h = more traffic)
    if (h >= 9 && h < 19) {
      organic = 1 + (m % 4); // 1 to 4
    } else if (h >= 19 && h < 23) {
      organic = 1 + (m % 2); // 1 to 2
    } else {
      organic = 1; // Night: minimal
    }

    var total = Math.max(1, organic + (activeTabs - 1));
    var el = document.getElementById('bzm-live-number');
    if (el) el.innerText = total;
  }

  function pollLive() {
    activeTabs = 1;
    if (bc) {
      try { bc.postMessage('ping'); } catch (e) {}
    }
    setTimeout(updateLiveCount, 400);
  }

  // ---- INIT ----
  function init() {
    createWidget();
    fetchTotalVisits();
    updateLiveCount();
    setInterval(pollLive, REFRESH_LIVE);
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
