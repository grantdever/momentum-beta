// All DOM painting for Momentum. No event listeners live here — app.js owns
// wiring. This module only reads state and streaks.js and writes to the DOM
// ids/attributes defined in index.html.

import { todayISO, addDays, weekStart } from './dates.js';
import {
  dailyStreak,
  weeklyQuotaStreak,
  weeklyQuotaProgress,
  cumulativeStats,
  historyWeeks,
  habitCounts,
} from './streaks.js';
import { effectiveThreshold } from './habits.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthDay(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatTime12h(hhmm) {
  const parts = String(hhmm || '22:00').split(':');
  let h = Number(parts[0]);
  const m = Number(parts[1] || 0);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${period}`;
}

function setPressed(el, pressed) {
  if (el) el.setAttribute('aria-pressed', pressed ? 'true' : 'false');
}

export function renderSyncStatus(status, message) {
  const el = document.getElementById('sync-status');
  if (!el) return;

  const classByStatus = {
    off: '',
    syncing: 'pending',
    synced: 'ok',
    offline: 'pending',
    error: 'error',
  };
  const textByStatus = {
    off: '',
    syncing: 'Syncing…',
    synced: 'Synced',
    offline: 'Offline — saved locally',
    error: 'Sync error',
  };

  el.classList.remove('ok', 'pending', 'error');
  const cls = classByStatus[status] || '';
  if (cls) el.classList.add(cls);
  el.textContent = message || textByStatus[status] || '';
}

function renderStreakBlock(state, todayIso) {
  const streakEl = document.getElementById('streak-number');
  const trainingEl = document.getElementById('training-streak');
  const dotsEl = document.getElementById('week-dots');
  if (!streakEl || !trainingEl || !dotsEl) return;

  const { habits, coreSlack } = state.settings;
  const streak = dailyStreak(state.entries, habits, coreSlack, todayIso);
  const stats = cumulativeStats(state.entries, habits, coreSlack, todayIso);

  const captionEl = streakEl.parentElement?.querySelector('.streak-caption');
  streakEl.textContent = String(streak);
  if (captionEl) {
    // Achievement framing on a broken chain: pair day 1 with the stats that
    // never reset, so history reads as banked progress rather than loss.
    captionEl.textContent =
      streak === 0 && stats.totalLogged > 0
        ? `day 1 — ${stats.totalLogged} days logged, best ${stats.bestStreak}`
        : 'day core streak';
  }

  const trainedHabit = habits.find((h) => h.id === 'trained');
  const trainingStreak = weeklyQuotaStreak(state.entries, trainedHabit, todayIso);
  trainingEl.textContent = String(trainingStreak);

  const progress = weeklyQuotaProgress(state.entries, trainedHabit, todayIso);
  dotsEl.innerHTML = '';
  const monday = weekStart(todayIso);
  for (let i = 0; i < 7; i++) {
    const dayIso = addDays(monday, i);
    const dot = document.createElement('span');
    dot.className = 'dot';
    if (progress.days[i]) dot.classList.add('hit');
    if (dayIso === todayIso) dot.classList.add('today');
    dot.title = `${WEEKDAY_LABELS[i]}${progress.days[i] ? ' — trained' : ''}`;
    dotsEl.appendChild(dot);
  }

  const countEl = document.getElementById('week-count');
  if (countEl) {
    const target = trainedHabit.weeklyTarget;
    const remaining = target - progress.count;
    // "To-go" framing once past halfway pulls harder late in the week.
    countEl.textContent =
      remaining > 0 && progress.count >= Math.ceil(target / 2)
        ? `${remaining} to go`
        : `${progress.count}/${target} this week`;
  }
}

function renderHabitRows(state, todayIso) {
  const entry = state.entries[state.activeDate];
  const habitList = document.getElementById('habit-list');
  const bonusSection = document.getElementById('bonus-section');

  if (habitList) {
    for (const btn of habitList.querySelectorAll('[data-habit]')) {
      setPressed(btn, !!entry?.[btn.dataset.habit]);
    }
  }
  if (bonusSection) {
    for (const btn of bonusSection.querySelectorAll('[data-habit]')) {
      setPressed(btn, !!entry?.[btn.dataset.habit]);
    }
  }

  const sleepLabel = document.getElementById('sleep-label');
  if (sleepLabel) {
    sleepLabel.textContent = `Asleep by ${formatTime12h(state.settings.sleepTargetTime)} (last night)`;
  }

  const trainedHabit = state.settings.habits.find((h) => h.id === 'trained');
  const weeklyLabel = document.getElementById('weekly-label');
  if (weeklyLabel) weeklyLabel.textContent = `Weekly — ${trainedHabit.weeklyTarget}×`;
  const dailyLabel = document.getElementById('daily-label');
  if (dailyLabel) {
    const threshold = effectiveThreshold(state.settings.habits, state.settings.coreSlack, todayIso);
    // threshold is null only when zero cores are active today [R1]; adaptive
    // display / hiding the card entirely is stage 3 — this is a minimal,
    // non-crashing fallback until then.
    dailyLabel.textContent = threshold === null ? 'Daily —' : `Daily — ${threshold} of 5`;
  }

  const offdayChip = document.getElementById('offday-chip');
  if (offdayChip) offdayChip.hidden = !entry?.offDay;

  const noteInput = document.getElementById('note-input');
  if (noteInput && document.activeElement !== noteInput) {
    noteInput.value = entry?.note || '';
  }

  setPressed(document.getElementById('offday-toggle'), !!entry?.offDay);
}

function renderDaySelector(state, todayIso) {
  const selector = document.getElementById('day-selector');
  if (!selector) return;
  const yesterday = addDays(todayIso, -1);
  for (const btn of selector.querySelectorAll('[data-day-offset]')) {
    const offset = Number(btn.dataset.dayOffset);
    const dateForBtn = offset === 0 ? todayIso : yesterday;
    setPressed(btn, state.activeDate === dateForBtn);
  }
}

function renderCumulativeStats(state, todayIso) {
  const el = document.getElementById('cumulative-stats');
  if (!el) return;
  const stats = cumulativeStats(state.entries, state.settings.habits, state.settings.coreSlack, todayIso);
  el.innerHTML = '';
  const items = [
    { value: stats.totalLogged, label: 'Days logged' },
    { value: stats.totalCoreHit, label: 'Core-threshold days' },
    { value: stats.totalTrained, label: 'Days trained' },
    { value: stats.bestStreak, label: 'Best streak' },
    { value: stats.offDayCount, label: 'Off days' },
    { value: `${stats.last30Hit}/30`, label: 'Last 30 days' },
  ];
  for (const item of items) {
    const stat = document.createElement('div');
    stat.className = 'stat';
    const value = document.createElement('div');
    value.className = 'stat-value';
    value.textContent = String(item.value);
    const label = document.createElement('div');
    label.className = 'stat-label';
    label.textContent = item.label;
    stat.appendChild(value);
    stat.appendChild(label);
    el.appendChild(stat);
  }
}

export function renderToday(state) {
  const todayIso = todayISO();
  renderStreakBlock(state, todayIso);
  renderHabitRows(state, todayIso);
  renderDaySelector(state, todayIso);
  renderCumulativeStats(state, todayIso);
}

export function renderHistory(state) {
  const grid = document.getElementById('history-grid');
  if (!grid) return;
  const todayIso = todayISO();
  const weeks = historyWeeks(state.entries, state.settings.habits, todayIso);
  grid.innerHTML = '';

  // Column-major grid: first column is weekday labels, then one column per
  // week (Mon..Sun top to bottom), so weekly rhythm reads across a row.
  for (const label of WEEKDAY_LABELS) {
    const div = document.createElement('div');
    div.className = 'wd-label';
    div.textContent = label[0];
    div.setAttribute('aria-hidden', 'true');
    grid.appendChild(div);
  }

  for (const week of weeks) {
    for (const cell of week.days) {
      const div = document.createElement('div');
      if (cell.future) {
        div.className = 'cell future';
        grid.appendChild(div);
        continue;
      }
      const intensity = cell.logged ? Math.min(cell.count, 5) : 0;
      div.className = `cell i${intensity}`;
      if (cell.offDay) div.classList.add('off');
      if (cell.trained) div.classList.add('trained');
      const parts = [
        cell.logged ? `${cell.count} of 5` : 'not logged',
        cell.offDay ? 'off day' : '',
        cell.trained ? 'trained' : '',
      ].filter(Boolean);
      const detail = `${monthDay(cell.date)}: ${parts.join(', ')}`;
      div.dataset.detail = detail;
      div.setAttribute('role', 'img');
      div.setAttribute('aria-label', detail);
      grid.appendChild(div);
    }
  }

  renderHabitCounts(state);
}

function renderHabitCounts(state) {
  const el = document.getElementById('habit-counts');
  if (!el) return;
  const habits = state.settings.habits;
  const counts = habitCounts(state.entries, habits);
  el.innerHTML = '';
  // Canonical order, plain counts — deliberately never ranked or judged.
  for (const habit of habits) {
    const row = document.createElement('div');
    row.className = 'habit-count-row';
    if (habit.cadence === 'bonus') {
      row.classList.add('bonus');
    }
    const label = document.createElement('span');
    label.textContent = habit.label;
    const value = document.createElement('span');
    value.className = 'habit-count-value';
    value.textContent = `${counts[habit.id]} days`;
    row.appendChild(label);
    row.appendChild(value);
    el.appendChild(row);
  }
}

export function renderSettingsForm(state) {
  const settings = state.settings;
  const todayIso = todayISO();
  const trainedHabit = settings.habits.find((h) => h.id === 'trained');
  const thresholdEl = document.getElementById('set-threshold');
  const sleepEl = document.getElementById('set-sleep');
  const gymEl = document.getElementById('set-gym');
  const ghEnabledEl = document.getElementById('gh-enabled');
  const ghOwnerEl = document.getElementById('gh-owner');
  const ghRepoEl = document.getElementById('gh-repo');
  const ghPathEl = document.getElementById('gh-path');
  const ghTokenEl = document.getElementById('gh-token');

  const holdEl = document.getElementById('set-hold');
  if (holdEl) holdEl.checked = !!settings.holdToComplete;
  if (thresholdEl && document.activeElement !== thresholdEl) {
    // This field still shows/edits the concrete "N of 5" number; under the
    // hood it maps to coreSlack via today's active core count (D3). The
    // slack-based editor is stage 3.
    thresholdEl.value = effectiveThreshold(settings.habits, settings.coreSlack, todayIso);
  }
  if (sleepEl && document.activeElement !== sleepEl) sleepEl.value = settings.sleepTargetTime;
  if (gymEl && document.activeElement !== gymEl) gymEl.value = trainedHabit.weeklyTarget;
  if (ghEnabledEl) ghEnabledEl.checked = !!settings.github.enabled;
  if (ghOwnerEl && document.activeElement !== ghOwnerEl) ghOwnerEl.value = settings.github.owner || '';
  if (ghRepoEl && document.activeElement !== ghRepoEl) ghRepoEl.value = settings.github.repo || '';
  if (ghPathEl && document.activeElement !== ghPathEl) ghPathEl.value = settings.github.path || 'data.json';
  if (ghTokenEl && document.activeElement !== ghTokenEl) ghTokenEl.value = settings.github.token || '';
}

export function renderAll(state) {
  renderToday(state);
  renderHistory(state);
  renderSettingsForm(state);
}
