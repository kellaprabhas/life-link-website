const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const currentUserId = 'demo-user';
const donorKey = 'lifelinkBloodDonors';
const requestKey = 'lifelinkBloodRequests';
const contactKey = 'lifelinkContactRequests';

const read = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
let donors = read(donorKey);
let bloodRequests = read(requestKey);
let contactRequests = read(contactKey);

const mockDonors = [
    { id: 'mock-anita', displayName: 'Anita', bloodGroup: 'O+', city: 'Hyderabad', area: 'Banjara Hills', isAvailable: true, lastDonationDate: '2026-06-14', consentGiven: true, updatedAt: 'Today, 9:20 AM', contactPreference: 'In-app message', phone: '', email: '' },
    { id: 'mock-rahul', displayName: 'Rahul', bloodGroup: 'A+', city: 'Hyderabad', area: 'Kukatpally', isAvailable: true, lastDonationDate: '2026-04-02', consentGiven: true, updatedAt: 'Yesterday, 6:10 PM', contactPreference: 'Phone after approval', phone: '', email: '' },
    { id: 'mock-meera', displayName: 'M.', bloodGroup: 'B-', city: 'Bengaluru', area: 'Indiranagar', isAvailable: true, lastDonationDate: '2026-05-22', consentGiven: true, updatedAt: '2 days ago', contactPreference: 'In-app message', phone: '', email: '' },
    { id: 'mock-dev', displayName: 'Dev', bloodGroup: 'AB+', city: 'Pune', area: 'Kothrud', isAvailable: false, lastDonationDate: '2026-01-12', consentGiven: true, updatedAt: 'Last week', contactPreference: 'Email after approval', phone: '', email: '' }
];

const byId = (id) => document.querySelector(`#${id}`);
const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
const formatDate = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-IN') : 'Not provided';

function populateGroupSelects() {
    ['searchBloodGroup', 'donorBloodGroup', 'requestBloodGroup'].forEach((id) => {
        const select = byId(id);
        bloodGroups.forEach((group) => {
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group;
            select.append(option);
        });
    });
}

function allDonors() {
    const savedDonor = donors.find((donor) => donor.id === currentUserId);
    return [...mockDonors, ...(savedDonor ? [savedDonor] : [])];
}

function renderBloodCounts() {
    const counts = bloodGroups.map((group) => ({ group, count: allDonors().filter((donor) => donor.consentGiven && donor.isAvailable && donor.bloodGroup === group).length }));
    byId('bloodCounts').innerHTML = counts.map(({ group, count }) => `<div class="blood-count"><strong>${group}</strong><span>${count} available</span></div>`).join('');
}

function donorMatches(donor) {
    const group = byId('searchBloodGroup').value;
    const city = byId('searchCity').value.trim().toLowerCase();
    const area = byId('searchArea').value.trim().toLowerCase();
    const availableOnly = byId('availableOnly').checked;
    return donor.consentGiven && (!availableOnly || donor.isAvailable) && (group === 'all' || donor.bloodGroup === group) && donor.city.toLowerCase().includes(city) && donor.area.toLowerCase().includes(area);
}

function renderDonors() {
    const matches = allDonors().filter(donorMatches);
    byId('donorResultCount').textContent = `${matches.length} match${matches.length === 1 ? '' : 'es'}`;
    byId('donorResults').innerHTML = matches.length ? matches.map((donor) => `<article class="donor-card"><div class="donor-avatar" aria-hidden="true">${escapeHtml(donor.displayName.charAt(0))}</div><div class="donor-card-main"><div class="donor-card-heading"><h3>${escapeHtml(donor.displayName)}</h3><span class="blood-type-badge">${donor.bloodGroup}</span></div><p>${escapeHtml(donor.city)} · ${escapeHtml(donor.area)}</p><p class="donor-updated"><span class="availability-dot ${donor.isAvailable ? '' : 'offline'}"></span>${donor.isAvailable ? 'Available now' : 'Not available'} · Updated ${escapeHtml(donor.updatedAt || 'recently')}</p><p class="donor-meta">Last donation: ${formatDate(donor.lastDonationDate)}</p></div><button class="primary-btn request-contact-button" type="button" data-request-donor="${donor.id}">Send blood request</button></article>`).join('') : '<div class="empty-state">No opted-in donors match these filters. Contact a licensed blood bank or hospital for urgent help.</div>';
}

function getCurrentDonor() {
    return donors.find((donor) => donor.id === currentUserId);
}

function loadDonorForm() {
    const donor = getCurrentDonor();
    if (!donor) {
        const profile = JSON.parse(localStorage.getItem('lifelinkProfile') || '{}');
        if (profile.name) byId('donorName').value = profile.name;
        if (profile.bloodGroup && profile.bloodGroup !== 'Unknown') byId('donorBloodGroup').value = profile.bloodGroup;
        if (profile.city) byId('donorCity').value = profile.city;
        return;
    }
    ['displayName:donorName', 'bloodGroup:donorBloodGroup', 'city:donorCity', 'area:donorArea', 'phone:donorPhone', 'email:donorEmail', 'lastDonationDate:lastDonation', 'contactPreference:contactPreference'].forEach((mapping) => {
        const [key, id] = mapping.split(':');
        byId(id).value = donor[key] || '';
    });
    byId('donorAvailable').checked = donor.isAvailable;
    byId('donorConsent').checked = donor.consentGiven;
    updateDonorStatus(donor);
}

function updateDonorStatus(donor) {
    const status = byId('donorProfileStatus');
    status.textContent = donor?.consentGiven ? (donor.isAvailable ? 'Available' : 'Not available') : 'Not registered';
    status.classList.toggle('status-badge', Boolean(donor));
}

byId('donorForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
        byId('donorStatus').textContent = 'Complete the required fields and consent before saving.';
        form.reportValidity();
        return;
    }
    const existing = getCurrentDonor();
    const donor = { id: currentUserId, displayName: byId('donorName').value.trim().split(/\s+/)[0], fullName: byId('donorName').value.trim(), bloodGroup: byId('donorBloodGroup').value, city: byId('donorCity').value.trim(), area: byId('donorArea').value.trim(), phone: byId('donorPhone').value.trim(), email: byId('donorEmail').value.trim(), lastDonationDate: byId('lastDonation').value, contactPreference: byId('contactPreference').value, isAvailable: byId('donorAvailable').checked, consentGiven: byId('donorConsent').checked, updatedAt: 'just now', createdAt: existing?.createdAt || new Date().toISOString() };
    donors = donors.filter((item) => item.id !== currentUserId).concat(donor);
    write(donorKey, donors);
    byId('donorStatus').textContent = 'Donor profile saved locally. Only privacy-safe details are searchable.';
    updateDonorStatus(donor);
    renderBloodCounts();
    renderDonors();
    renderIncomingRequests();
});

['searchBloodGroup', 'searchCity', 'searchArea', 'availableOnly'].forEach((id) => byId(id).addEventListener('input', renderDonors));

byId('donorResults').addEventListener('click', (event) => {
    const button = event.target.closest('[data-request-donor]');
    if (!button) return;
    const donor = allDonors().find((item) => item.id === button.dataset.requestDonor);
    if (!donor) return;
    byId('requestBloodGroup').value = donor.bloodGroup;
    byId('emergencyRequest').scrollIntoView({ behavior: 'smooth', block: 'start' });
    byId('requestStatus').textContent = `Create a request for ${escapeHtml(donor.displayName)} by completing the emergency form below.`;
    byId('bloodRequestForm').dataset.targetDonor = donor.id;
});

byId('bloodRequestForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
        byId('requestStatus').textContent = 'Complete each required request field with valid details.';
        form.reportValidity();
        return;
    }
    const request = { id: `blood-${Date.now().toString(36)}`, requesterId: currentUserId, bloodGroup: byId('requestBloodGroup').value, hospitalName: byId('hospitalName').value.trim(), city: byId('requestCity').value.trim(), area: byId('requestArea').value.trim(), urgency: byId('urgency').value, unitsRequired: Number(byId('unitsRequired').value), message: byId('requestMessage').value.trim(), requesterName: byId('requesterName').value.trim(), requesterPhone: byId('requesterPhone').value.trim(), requesterEmail: byId('requesterEmail').value.trim(), status: 'Request Sent', createdAt: new Date().toLocaleString('en-IN'), targetDonorId: form.dataset.targetDonor || '' };
    bloodRequests = [request, ...bloodRequests];
    write(requestKey, bloodRequests);
    if (request.targetDonorId) {
        contactRequests = [{ id: `contact-${Date.now().toString(36)}`, bloodRequestId: request.id, donorId: request.targetDonorId, requesterId: currentUserId, status: 'Request Sent', donorResponse: '', createdAt: request.createdAt }, ...contactRequests];
        write(contactKey, contactRequests);
    }
    form.reset();
    delete form.dataset.targetDonor;
    byId('requestStatus').textContent = 'Blood request saved. Requests move to donor approval before contact details can be shared.';
    renderRequests();
});

function updateContactRequest(contact, status, response) {
    contact.status = status;
    contact.donorResponse = response;
    write(contactKey, contactRequests);
    const request = bloodRequests.find((item) => item.id === contact.bloodRequestId);
    if (request) {
        request.status = status;
        write(requestKey, bloodRequests);
    }
    renderRequests();
}

function renderRequestCard(request, isIncoming = false) {
    const related = contactRequests.find((contact) => contact.bloodRequestId === request.id);
    const status = related?.status || request.status;
    const approved = status === 'Contact Shared' || status === 'Completed';
    const contactDetails = approved ? `<div class="approved-contact"><strong>Contact shared after approval:</strong> ${escapeHtml(request.requesterPhone)} · ${escapeHtml(request.requesterEmail)}</div>` : '';
    const actions = isIncoming && related && status === 'Request Sent' ? `<div class="request-actions"><button class="primary-btn" type="button" data-approve="${related.id}">Accept & share contact</button><button class="secondary-btn" type="button" data-decline="${related.id}">Decline</button></div>` : approved && isIncoming ? `<button class="secondary-btn" type="button" data-complete="${related.id}">Mark completed</button>` : '';
    return `<article class="blood-request-card"><div class="request-card-heading"><div><h3>${escapeHtml(request.bloodGroup)} · ${escapeHtml(request.hospitalName)}</h3><p>${escapeHtml(request.city)} · ${escapeHtml(request.area)} · ${escapeHtml(request.urgency)}</p></div><span class="request-status">${escapeHtml(status)}</span></div><p>${escapeHtml(request.unitsRequired)} unit(s): ${escapeHtml(request.message)}</p><p class="request-date">${escapeHtml(request.createdAt)}</p>${contactDetails}${actions}</article>`;
}

function renderRequests() {
    const mine = bloodRequests.filter((request) => request.requesterId === currentUserId);
    byId('myRequestList').innerHTML = mine.length ? mine.map((request) => renderRequestCard(request)).join('') : '<div class="empty-state">Your blood requests will appear here.</div>';
    renderIncomingRequests();
    byId('requestCount').textContent = `${mine.length} request${mine.length === 1 ? '' : 's'}`;
}

function renderIncomingRequests() {
    const donor = getCurrentDonor();
    const incoming = donor ? contactRequests.filter((contact) => contact.donorId === currentUserId).map((contact) => bloodRequests.find((request) => request.id === contact.bloodRequestId)).filter(Boolean) : [];
    byId('incomingRequestList').innerHTML = incoming.length ? incoming.map((request) => renderRequestCard(request, true)).join('') : '<div class="empty-state">Incoming requests appear after you save a donor profile and someone sends a request to you.</div>';
}

byId('incomingRequestList').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const contact = contactRequests.find((item) => item.id === (button.dataset.approve || button.dataset.decline || button.dataset.complete));
    if (!contact) return;
    if (button.dataset.approve) updateContactRequest(contact, 'Contact Shared', 'accepted');
    if (button.dataset.decline) updateContactRequest(contact, 'Donor Responded', 'declined');
    if (button.dataset.complete) updateContactRequest(contact, 'Completed', 'accepted');
});

function logout() { window.location.href = 'index.html'; }

populateGroupSelects();
loadDonorForm();
renderBloodCounts();
renderDonors();
renderRequests();
