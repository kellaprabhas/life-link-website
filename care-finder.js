const providers = {
    Cardiology: [
        {
            name: 'Dr. Matha Srinivas',
            hospital: 'Medicover',
            specialty: 'Interventional Cardiology',
            experience: '28+ years'
        },
        {
            name: 'Dr. Pranav Pallempati',
            hospital: 'Medicover',
            specialty: 'Interventional Cardiology',
            experience: '24+ years'
        },
        {
            name: 'Dr. Kurakula Naresh',
            hospital: 'Medicover',
            specialty: 'Interventional Cardiology',
            experience: '17+ years'
        },
        {
            name: 'Dr. S N Chennakesava Rao Kuchiraju',
            hospital: 'Medicover',
            specialty: 'Interventional Cardiology',
            experience: '8+ years'
        },
        {
            name: 'Dr. T. Venkateswara Rao',
            hospital: 'Apollo',
            specialty: 'Interventional Cardiology',
            experience: '13+ years'
        },
        {
            name: 'Dr. Venkatesh Reddy Sathi',
            hospital: 'Apollo',
            specialty: 'Cardiac Sciences',
            experience: '10+ years'
        }
    ],
    'General Medicine': [
        {
            name: 'Dr. Manohar Prasad Bomidi',
            hospital: 'Apollo Hospitals',
            specialty: 'Internal Medicine',
            experience: '17+ years'
        },
        {
            name: 'Dr. Vasantha Kumar V R R',
            hospital: 'Medicover Hospitals - Kakinada',
            specialty: 'General Physician & Diabetologist',
            experience: '11+ years'
        },
        {
            name: 'Dr. Vamsi Krishna Kedarisetti',
            hospital: 'Medicover Hospitals - Kakinada',
            specialty: 'General Physician / Diabetology / Endocrinology / Rheumatology',
            experience: '5+ years'
        }
    ],
    Orthopedics: [
        {
            name: 'Dr. Partha Pratim Chatterjee',
            hospital: 'Apollo Hospitals',
            specialty: 'Orthopedics',
            experience: '23+ years'
        },
        {
            name: 'Dr. A. Ravi Kiran',
            hospital: 'Kakinada',
            specialty: 'Orthopedic Spine Surgery',
            experience: '—'
        },
        {
            name: 'Dr. Sunil Dachepalli',
            hospital: 'Yashoda',
            specialty: 'Orthopedics / Joint Replacement / Sports Medicine',
            experience: '—'
        }
    ],
    Ophthalmology: [],
    Neurology: [
        {
            name: 'Dr. M. Venkata Kiran Kumar',
            hospital: 'Apollo Hospitals',
            specialty: 'Neurosciences / Neurosurgery',
            experience: '20+ years'
        },
        {
            name: 'Dr. Sivarama Gandhi',
            hospital: 'Apollo Hospitals',
            specialty: 'Neurosciences / Neurology',
            experience: '11+ years'
        },
        {
            name: 'Dr. Krishna Haskar Dhanyamraju',
            hospital: 'Medicover Hospitals - Kakinada',
            specialty: 'Interventional Neurology',
            experience: '2+ years'
        },
        {
            name: 'Dr. Chandu Lingolu',
            hospital: 'Medicover Hospitals - Kakinada',
            specialty: 'Neurosurgery',
            experience: '16+ years'
        }
    ],
    Pediatrics: [
        {
            name: 'Dr. Ravi Angara',
            hospital: 'Medicover Hospitals - Kakinada',
            specialty: 'Pediatrics & Neonatology',
            experience: '20+ years'
        }
    ]
};

const specialtyMessages = {
    Ophthalmology: 'Provider information available through the connected directory.'
};

const specialtyLabels = {
    Ophthalmology: 'Eye Care'
};

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function findDoctors(specialty) {
    const doctorList = document.querySelector('#doctorList');
    const resultTitle = document.querySelector('#resultTitle');
    const selectedProviders = providers[specialty] || [];

    if (!doctorList || !resultTitle) {
        return;
    }

    const displaySpecialty = specialtyLabels[specialty] || specialty;
    resultTitle.textContent = selectedProviders.length
        ? `${displaySpecialty} Providers`
        : `${displaySpecialty} Providers`;

    const hospitals = [...new Set(selectedProviders.map((provider) => provider.hospital))];
    const hospitalSummary = hospitals.length
        ? `
            <div class="hospital-summary">
                <h3>Hospitals with ${escapeHtml(displaySpecialty)} care</h3>
                <div class="hospital-list">
                    ${hospitals.map((hospital) => `<span>${escapeHtml(hospital)}</span>`).join('')}
                </div>
            </div>
        `
        : '';

    doctorList.innerHTML = selectedProviders.length
        ? hospitalSummary + selectedProviders.map((provider) => `
            <article class="provider-card">
                <div class="provider-avatar" aria-hidden="true">&#9829;</div>
                <div class="provider-details">
                    <h3>${escapeHtml(provider.name)}</h3>
                    <p class="provider-specialty">${escapeHtml(provider.specialty)}</p>
                    <div class="provider-meta">
                        <span>${escapeHtml(provider.hospital)}</span>
                        <span>${escapeHtml(provider.experience)} experience</span>
                    </div>
                </div>
                <button class="provider-action" type="button" onclick="showProviderMessage('${escapeHtml(provider.name)}')">View details</button>
            </article>
        `).join('')
        : `<p class="provider-empty">${escapeHtml(specialtyMessages[specialty] || 'No providers are available for this specialty yet.')}</p>`;

    doctorList.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showProviderMessage(providerName) {
    window.alert(`More information about ${providerName} will be available soon.`);
}
