const reminderKey = 'lifelinkMedicineReminders';
const logKey = 'lifelinkMedicationLogs';
const preferenceKey = 'lifelinkReminderPreferences';
let reminders = readReminderData(reminderKey);
let logs = readReminderData(logKey);
let preferences = readReminderData(preferenceKey);
let activeAlarm = null;
let audioContext = null;
let alarmTimer = null;
let currentFilter = 'Today';
let editingReminder = null;

function readReminderData(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function saveReminderData(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function todayKey(date = new Date()) { return date.toISOString().slice(0, 10); }
function localDateKey(date) { const copy = new Date(date); copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset()); return copy.toISOString().slice(0, 10); }
function formatTime(time) { const [hour, minute] = time.split(':').map(Number); return new Date(2000, 0, 1, hour, minute).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function formatDateTime(value) { return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }
function uid(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }
function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character])); }
function byId(id) { return document.querySelector(`#${id}`); }
function isEnabled(reminder) { return reminder.isEnabled && !reminder.snoozedUntil; }

function occursOn(reminder, dateKey) {
    if (dateKey < reminder.startDate || (reminder.endDate && dateKey > reminder.endDate)) return false;
    const date = new Date(`${dateKey}T12:00:00`);
    const start = new Date(`${reminder.startDate}T12:00:00`);
    if (reminder.repeatType === 'Once') return dateKey === reminder.startDate;
    if (reminder.repeatType === 'Daily') return true;
    if (reminder.repeatType === 'Selected Days') return reminder.selectedDays.includes(String(date.getDay()));
    const dayDifference = Math.round((date - start) / 86400000);
    return dayDifference >= 0 && dayDifference % Number(reminder.customInterval || 1) === 0;
}

function occurrenceKey(reminder, dateKey) { return `${reminder.id}:${dateKey}:${reminder.time}`; }
function logForOccurrence(key) { return logs.find((log) => log.occurrenceKey === key); }
function scheduledDate(reminder, dateKey) { return new Date(`${dateKey}T${reminder.time}:00`); }

function getTodayOccurrences() {
    const dateKey = todayKey();
    return reminders.filter((reminder) => occursOn(reminder, dateKey)).map((reminder) => ({ reminder, dateKey, key: occurrenceKey(reminder, dateKey), time: scheduledDate(reminder, dateKey) })).sort((a, b) => a.time - b.time);
}

function renderUpcoming() {
    const occurrences = getTodayOccurrences().filter((item) => item.reminder.isEnabled || logForOccurrence(item.key));
    byId('upcomingList').innerHTML = occurrences.length ? occurrences.map((item) => renderOccurrence(item)).join('') : '<div class="empty-state">No medicines scheduled for today. Add a reminder to build your routine.</div>';
    const next = occurrences.find((item) => !logForOccurrence(item.key) && item.time >= new Date());
    byId('nextReminderHeroText').textContent = next ? `${next.reminder.name} at ${formatTime(next.reminder.time)}` : 'No upcoming reminders';
}

function statusForOccurrence(item) {
    const log = logForOccurrence(item.key);
    if (log) return log.action;
    if (!item.reminder.isEnabled) return 'Disabled';
    return item.time < new Date() ? 'Missed' : 'Upcoming';
}

function renderOccurrence(item) {
    const status = statusForOccurrence(item);
    return `<article class="reminder-card"><div class="reminder-time">${formatTime(item.reminder.time)}<span>${escapeHtml(item.reminder.mealInstruction)}</span></div><div class="reminder-card-main"><h3>${escapeHtml(item.reminder.name)}</h3><p>${escapeHtml(item.reminder.dosage)}${item.reminder.notes ? ` · ${escapeHtml(item.reminder.notes)}` : ''}</p></div><span class="reminder-status status-${status.toLowerCase()}">${status}</span></article>`;
}

function reminderMatchesFilter(reminder) {
    const todayOccurrences = getTodayOccurrences().filter((item) => item.reminder.id === reminder.id);
    if (currentFilter === 'Disabled') return !reminder.isEnabled;
    if (currentFilter === 'Today') return todayOccurrences.length > 0;
    if (currentFilter === 'Upcoming') return todayOccurrences.some((item) => statusForOccurrence(item) === 'Upcoming') || reminder.repeatType !== 'Once';
    if (currentFilter === 'Completed') return todayOccurrences.some((item) => ['Taken', 'Skipped', 'Snoozed'].includes(statusForOccurrence(item)));
    return todayOccurrences.some((item) => statusForOccurrence(item) === 'Missed');
}

function renderAllReminders() {
    const filtered = reminders.filter(reminderMatchesFilter);
    byId('activeReminderCount').textContent = `${reminders.filter((item) => item.isEnabled).length} active`;
    byId('allRemindersList').innerHTML = filtered.length ? filtered.map((reminder) => {
        const occurrence = getTodayOccurrences().find((item) => item.reminder.id === reminder.id);
        const status = occurrence ? statusForOccurrence(occurrence) : (reminder.isEnabled ? 'Upcoming' : 'Disabled');
        return `<article class="scheduled-reminder-card"><div><h3>${escapeHtml(reminder.name)}</h3><p>${escapeHtml(reminder.dosage)} · ${formatTime(reminder.time)} · ${escapeHtml(reminder.repeatType)}</p><p>${escapeHtml(reminder.mealInstruction)}${reminder.endDate ? ` · Until ${escapeHtml(reminder.endDate)}` : ''}</p></div><span class="reminder-status status-${status.toLowerCase()}">${status}</span><div class="reminder-controls"><button class="secondary-btn" type="button" data-edit="${reminder.id}">Edit</button><button class="secondary-btn" type="button" data-toggle="${reminder.id}">${reminder.isEnabled ? 'Pause' : 'Resume'}</button><button class="secondary-btn danger-button" type="button" data-delete="${reminder.id}">Delete</button></div></article>`;
    }).join('') : `<div class="empty-state">No reminders in the ${currentFilter.toLowerCase()} view.</div>`;
}

function renderHistory() {
    const medicine = byId('historyMedicine').value;
    const status = byId('historyStatus').value;
    const filtered = logs.filter((log) => (medicine === 'all' || log.medicineName === medicine) && (status === 'all' || log.action === status)).sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt));
    byId('historyList').innerHTML = filtered.length ? filtered.map((log) => `<article class="history-row"><div><strong>${escapeHtml(log.medicineName)}</strong><span>${escapeHtml(log.dosage)} · ${formatDateTime(log.scheduledTime)}</span></div><span class="reminder-status status-${log.action.toLowerCase()}">${escapeHtml(log.action)}</span><small>${log.notes ? escapeHtml(log.notes) : ''}</small></article>`).join('') : '<div class="empty-state">No medication history matches these filters.</div>';
    const todayLogs = logs.filter((log) => localDateKey(log.scheduledTime) === todayKey());
    const todayScheduled = getTodayOccurrences().length;
    const completed = todayLogs.filter((log) => ['Taken', 'Snoozed'].includes(log.action)).length;
    byId('adherenceSummary').textContent = `${completed} of ${todayScheduled} reminders completed today`;
}

function populateHistoryMedicines() {
    const values = [...new Set(logs.map((log) => log.medicineName))].sort();
    byId('historyMedicine').innerHTML = '<option value="all">All medicines</option>' + values.map((value) => `<option>${escapeHtml(value)}</option>`).join('');
}

function collectForm() {
    const selectedDays = [...document.querySelectorAll('#selectedDaysField input:checked')].map((input) => input.value);
    return { id: byId('reminderId').value || uid('reminder'), name: byId('medicineName').value.trim(), dosage: byId('dosage').value.trim(), time: byId('reminderTime').value, startDate: byId('startDate').value, endDate: byId('endDate').value, repeatType: byId('repeatType').value, selectedDays, customInterval: byId('customInterval').value, mealInstruction: byId('mealInstruction').value, notes: byId('reminderNotes').value.trim(), isEnabled: byId('isEnabled').checked, createdAt: editingReminder?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
}

function resetForm() {
    byId('reminderForm').reset();
    byId('reminderId').value = '';
    byId('startDate').value = todayKey();
    byId('isEnabled').checked = true;
    byId('formMode').textContent = 'New reminder';
    byId('cancelEdit').hidden = true;
    editingReminder = null;
    updateRepeatFields();
}

function updateRepeatFields() {
    const type = byId('repeatType').value;
    byId('selectedDaysField').hidden = type !== 'Selected Days';
    byId('customIntervalField').hidden = type !== 'Custom interval';
}

byId('reminderForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const endDate = byId('endDate');
    endDate.setCustomValidity(endDate.value && endDate.value < byId('startDate').value ? 'End date cannot be before the start date.' : '');
    if (byId('repeatType').value === 'Selected Days' && !document.querySelector('#selectedDaysField input:checked')) {
        byId('reminderFormStatus').textContent = 'Choose at least one day for a selected-days reminder.';
        return;
    }
    if (!form.checkValidity()) { byId('reminderFormStatus').textContent = 'Complete the required reminder fields.'; form.reportValidity(); return; }
    const reminder = collectForm();
    reminders = reminders.filter((item) => item.id !== reminder.id).concat(reminder);
    saveReminderData(reminderKey, reminders);
    byId('reminderFormStatus').textContent = 'Reminder saved locally. Keep this page open for the alarm.';
    resetForm();
    renderAll();
});

byId('repeatType').addEventListener('change', updateRepeatFields);
byId('cancelEdit').addEventListener('click', resetForm);
byId('allRemindersList').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const reminder = reminders.find((item) => item.id === (button.dataset.edit || button.dataset.toggle || button.dataset.delete));
    if (!reminder) return;
    if (button.dataset.delete) { reminders = reminders.filter((item) => item.id !== reminder.id); saveReminderData(reminderKey, reminders); renderAll(); return; }
    if (button.dataset.toggle) { reminder.isEnabled = !reminder.isEnabled; reminder.updatedAt = new Date().toISOString(); saveReminderData(reminderKey, reminders); renderAll(); return; }
    editingReminder = reminder;
    Object.entries({ reminderId: 'id', medicineName: 'name', dosage: 'dosage', reminderTime: 'time', startDate: 'startDate', endDate: 'endDate', repeatType: 'repeatType', customInterval: 'customInterval', mealInstruction: 'mealInstruction', reminderNotes: 'notes', isEnabled: 'isEnabled' }).forEach(([field, key]) => { byId(field).value = reminder[key] ?? ''; if (byId(field).type === 'checkbox') byId(field).checked = reminder[key]; });
    document.querySelectorAll('#selectedDaysField input').forEach((input) => { input.checked = reminder.selectedDays.includes(input.value); });
    byId('formMode').textContent = 'Editing reminder'; byId('cancelEdit').hidden = false; updateRepeatFields(); byId('medicineName').focus();
});

document.querySelectorAll('[data-reminder-filter]').forEach((button) => button.addEventListener('click', () => { currentFilter = button.dataset.reminderFilter; document.querySelectorAll('[data-reminder-filter]').forEach((tab) => tab.setAttribute('aria-selected', String(tab === button))); renderAllReminders(); }));
byId('historyMedicine').addEventListener('change', renderHistory);
byId('historyStatus').addEventListener('change', renderHistory);

function logAction(item, action, extra = {}) {
    if (logForOccurrence(item.key)) return;
    logs.push({ id: uid('log'), occurrenceKey: item.key, reminderId: item.reminder.id, medicineName: item.reminder.name, dosage: item.reminder.dosage, scheduledTime: item.time.toISOString(), action, completedAt: new Date().toISOString(), notes: item.reminder.notes, ...extra });
    saveReminderData(logKey, logs);
}

function stopAlarm() {
    if (alarmTimer) window.clearInterval(alarmTimer);
    alarmTimer = null;
    if (audioContext) { audioContext.close(); audioContext = null; }
}

function playAlarm() {
    stopAlarm();
    if (preferences.muted) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const beep = () => { const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); oscillator.frequency.value = 660; gain.gain.setValueAtTime(.0001, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.06, audioContext.currentTime + .03); gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .35); oscillator.connect(gain).connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + .4); };
        beep(); alarmTimer = window.setInterval(beep, 1000);
    } catch { byId('reminderFormStatus').textContent = 'Alarm sound is not available in this browser.'; }
}

function sendNotification(item) {
    if (Notification.permission === 'granted') new Notification(`LifeLink: ${item.reminder.name}`, { body: `${item.reminder.dosage} · ${item.reminder.mealInstruction}` });
}

function triggerAlarm(item) {
    if (activeAlarm || logForOccurrence(item.key)) return;
    activeAlarm = item;
    byId('alarmDetails').textContent = `${item.reminder.name} · ${item.reminder.dosage}`;
    byId('alarmInstruction').textContent = `${item.reminder.mealInstruction}${item.reminder.notes ? ` · ${item.reminder.notes}` : ''}`;
    byId('alarmModal').hidden = false;
    playAlarm();
    sendNotification(item);
}

function resolveAlarm(action) {
    if (!activeAlarm) return;
    const item = activeAlarm;
    stopAlarm();
    if (action === 'Snoozed') {
        logAction(item, 'Snoozed', { snoozedUntil: new Date(Date.now() + 600000).toISOString() });
        const followUp = { ...item.reminder, id: uid('snooze'), startDate: todayKey(), endDate: todayKey(), time: new Date(Date.now() + 600000).toTimeString().slice(0, 5), repeatType: 'Once', isEnabled: true };
        reminders.push(followUp); saveReminderData(reminderKey, reminders);
    } else logAction(item, action);
    byId('alarmModal').hidden = true; activeAlarm = null; renderAll();
}

byId('markTaken').addEventListener('click', () => resolveAlarm('Taken'));
byId('snoozeReminder').addEventListener('click', () => resolveAlarm('Snoozed'));
byId('skipReminder').addEventListener('click', () => resolveAlarm('Skipped'));
byId('muteAlarm').addEventListener('click', () => { preferences.muted = !preferences.muted; saveReminderData(preferenceKey, preferences); byId('muteAlarm').textContent = preferences.muted ? '🔇 Sound muted' : '🔊 Sound on'; byId('muteAlarm').setAttribute('aria-pressed', String(preferences.muted)); if (preferences.muted) stopAlarm(); });
byId('enableNotifications').addEventListener('click', async () => { if (!('Notification' in window)) { byId('notificationStatus').textContent = 'Notifications unsupported'; return; } const result = await Notification.requestPermission(); preferences.notifications = result; saveReminderData(preferenceKey, preferences); byId('notificationStatus').textContent = result === 'granted' ? 'Notifications enabled' : 'Permission denied'; });

function processSchedule() {
    const now = new Date();
    getTodayOccurrences().forEach((item) => {
        if (!item.reminder.isEnabled || logForOccurrence(item.key)) return;
        const difference = now - item.time;
        if (difference >= 0 && difference < 60000) triggerAlarm(item);
        if (difference > 60000 && !activeAlarm) logAction(item, 'Missed');
    });
    renderUpcoming(); renderAllReminders(); renderHistory();
}

function renderAll() { renderUpcoming(); renderAllReminders(); populateHistoryMedicines(); renderHistory(); }

function logout() { localStorage.removeItem('lifelinkLoggedIn'); window.location.href = 'index.html'; }

byId('startDate').value = todayKey();
byId('muteAlarm').setAttribute('aria-pressed', String(Boolean(preferences.muted)));
byId('muteAlarm').textContent = preferences.muted ? '🔇 Sound muted' : '🔊 Sound on';
byId('notificationStatus').textContent = preferences.notifications === 'granted' ? 'Notifications enabled' : 'Not enabled';
renderAll();
processSchedule();
window.setInterval(processSchedule, 15000);
