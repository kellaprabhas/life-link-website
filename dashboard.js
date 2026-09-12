function completeRoutine(button) {
    button.textContent = 'Completed';
    button.disabled = true;
    button.closest('.routine-item')?.classList.add('completed');
}

function addWater(button) {
    const waterCount = document.querySelector('#waterCount');
    const currentCount = Number(waterCount?.textContent || 0);
    const nextCount = Math.min(currentCount + 1, 8);

    if (waterCount) {
        waterCount.textContent = nextCount;
    }

    button.textContent = nextCount >= 8 ? 'Goal reached' : '+1 Added';
    if (nextCount >= 8) {
        button.disabled = true;
    }
}

function selectMood(mood) {
    const moodMessage = document.querySelector('#moodMessage');
    if (moodMessage) {
        moodMessage.textContent = `Thanks for checking in. You selected ${mood}`;
    }
}

function showAddReminder() {
    window.location.href = 'medicine-reminders.html';
}

function logout() {
    window.location.href = 'index.html';
}

function loadDashboardConnections() {
    const profile = JSON.parse(localStorage.getItem('lifelinkProfile') || '{}');
    const requests = JSON.parse(localStorage.getItem('lifelinkBloodRequests') || '[]');
    const orders = JSON.parse(localStorage.getItem('lifelinkMedicineOrders') || '[]');
    const bloodGroup = document.querySelector('#dashboardBloodGroup');
    const bloodStatus = document.querySelector('#dashboardBloodStatus');
    const requestStatus = document.querySelector('#dashboardRequestStatus');
    const orderStatus = document.querySelector('#dashboardOrderStatus');
    const greeting = document.querySelector('#dashboardGreeting');
    const notificationButton = document.querySelector('#notificationButton');
    const notificationDot = notificationButton?.querySelector('.notification-dot');
    const userRequests = requests.filter((request) => request.requesterId === 'demo-user');

    if (bloodGroup) bloodGroup.textContent = profile.bloodGroup && profile.bloodGroup !== 'Unknown' ? `Blood group: ${profile.bloodGroup}` : 'Blood group not set';
    if (bloodStatus) bloodStatus.textContent = profile.bloodGroup ? 'Available for emergency matching' : 'Set it in your profile';
    if (requestStatus) requestStatus.textContent = userRequests.length ? `${userRequests.length} blood request${userRequests.length === 1 ? '' : 's'} active` : 'No blood requests';
    if (orderStatus) orderStatus.textContent = orders.length ? `${orders.length} medicine order${orders.length === 1 ? '' : 's'} saved` : 'No medicine orders';
    if (greeting && profile.name) greeting.textContent = `Good Morning, ${profile.name} 👋`;
    if (notificationButton) {
        const incoming = JSON.parse(localStorage.getItem('lifelinkContactRequests') || '[]').filter((request) => request.donorId === 'demo-user' && request.status === 'Request Sent').length;
        if (notificationDot) notificationDot.hidden = incoming === 0;
        notificationButton.setAttribute('aria-label', incoming ? `${incoming} new blood request${incoming === 1 ? '' : 's'}` : 'No new notifications');
        notificationButton.addEventListener('click', () => {
            window.location.href = incoming ? 'blood-bank.html#incomingRequests' : 'blood-bank.html';
        });
    }
}

loadDashboardConnections();

const assistantForm = document.querySelector('#assistantForm');
const assistantInput = document.querySelector('#assistantInput');
const assistantMessage = document.querySelector('#assistantMessage');
const languageSelect = document.querySelector('#languageSelect');
const voiceButton = document.querySelector('#voiceButton');
const voiceStatus = document.querySelector('#voiceStatus');

function getAssistantReply(question) {
    if (question.includes('water') || question.includes('hydration')) {
        return 'You have logged 6 of 8 glasses today. Keep water nearby and take your next glass when ready.';
    }

    if (question.includes('sleep')) {
        return 'Your dashboard shows 7 hours and 20 minutes of sleep. A regular bedtime can help you keep this rhythm.';
    }

    if (question.includes('medicine') || question.includes('routine')) {
        return 'You have completed 4 of 5 planned medicines. Check your routine above for the remaining item.';
    }

    if (question.includes('doctor') || question.includes('care')) {
        return 'You can use Find Care in the sidebar to browse providers by specialty.';
    }

    return 'I can help with hydration, sleep, medicines, routines, or finding care.';
}

function speakAssistantReply(message) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
    }
}

if (assistantForm && assistantInput && assistantMessage) {
    assistantForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const question = assistantInput.value.trim();

        if (!question) {
            assistantMessage.textContent = 'Please enter a question so I can help.';
            return;
        }

        assistantMessage.textContent = getAssistantReply(question.toLowerCase());

        assistantInput.value = '';
    });
}

if (voiceButton && assistantInput && assistantMessage && voiceStatus) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        voiceButton.disabled = true;
        voiceStatus.textContent = 'Voice input is not supported in this browser. You can still type your question.';
    } else {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        voiceButton.addEventListener('click', () => {
            recognition.lang = languageSelect?.value === 'Hindi' ? 'hi-IN'
                : languageSelect?.value === 'Telugu' ? 'te-IN'
                    : languageSelect?.value === 'Tamil' ? 'ta-IN' : 'en-US';
            recognition.start();
            voiceButton.setAttribute('aria-pressed', 'true');
            voiceButton.classList.add('listening');
            voiceStatus.textContent = 'Listening... ask about your routine, sleep, hydration, or care.';
        });

        recognition.addEventListener('result', (event) => {
            const transcript = event.results[0][0].transcript;
            const reply = getAssistantReply(transcript.toLowerCase());
            assistantInput.value = transcript;
            assistantMessage.textContent = reply;
            voiceStatus.textContent = `Heard: “${transcript}”`;
            speakAssistantReply(reply);
            assistantInput.value = '';
        });

        recognition.addEventListener('error', () => {
            voiceStatus.textContent = 'I could not hear that. Please try the microphone again or type your question.';
        });

        recognition.addEventListener('end', () => {
            voiceButton.setAttribute('aria-pressed', 'false');
            voiceButton.classList.remove('listening');
        });
    }
}

if (languageSelect) {
    const savedLanguage = localStorage.getItem('lifelinkLanguage');
    if (savedLanguage && languageSelect.querySelector(`option[value="${savedLanguage}"]`)) {
        languageSelect.value = savedLanguage;
    }

    languageSelect.addEventListener('change', () => {
        localStorage.setItem('lifelinkLanguage', languageSelect.value);
        document.documentElement.lang = languageSelect.value;
    });
}

const scanMedicineButton = document.querySelector('#scanMedicine');
const medicineImageInput = document.querySelector('#medicineImage');
const medicineUploadName = document.querySelector('#medicineUploadName');
const scanProgress = document.querySelector('#scanProgress');
const medicineResult = document.querySelector('#medicineResult');
const medicinePreview = document.querySelector('#medicinePreview');
const medicinePreviewImage = document.querySelector('#medicinePreviewImage');

const medicineDatabase = [
    { name: 'Paracetamol', genericName: 'Paracetamol', strength: '500 mg', dosageForm: 'Tablet', category: 'Pain and fever relief', uses: ['Temporary relief of fever and mild-to-moderate pain.'], commonWarnings: ['Follow the package label and professional medical advice.'] },
    { name: 'Amoxicillin', genericName: 'Amoxicillin', strength: '500 mg', dosageForm: 'Capsule', category: 'Antibiotic', uses: ['Treatment of certain bacterial infections when prescribed.'], commonWarnings: ['Use only as prescribed by a qualified clinician.'] },
    { name: 'Cetirizine', genericName: 'Cetirizine hydrochloride', strength: '10 mg', dosageForm: 'Tablet', category: 'Allergy medicine', uses: ['Relief of common allergy symptoms.'], commonWarnings: ['May cause drowsiness in some people. Follow the package label.'] },
    { name: 'Omeprazole', genericName: 'Omeprazole', strength: '20 mg', dosageForm: 'Capsule', category: 'Antacid', uses: ['Reduces stomach acid for certain acid-related conditions.'], commonWarnings: ['Use according to the package label or professional advice.'] },
    { name: 'Clotrimazole', genericName: 'Clotrimazole', strength: '1%', dosageForm: 'Cream', category: 'Antifungal', uses: ['Topical treatment of certain fungal skin infections.'], commonWarnings: ['For external use as directed on the package.'] },
    { name: 'Salbutamol', genericName: 'Salbutamol', strength: '100 mcg', dosageForm: 'Inhaler', category: 'Respiratory medicine', uses: ['Relief of certain breathing symptoms when prescribed.'], commonWarnings: ['Use only as directed by a qualified clinician.'] },
    { name: 'Ascorbic Acid', genericName: 'Vitamin C', strength: '500 mg', dosageForm: 'Tablet', category: 'Vitamin', uses: ['Vitamin C supplementation.'], commonWarnings: ['Follow the package label and professional advice.'] },
    { name: 'Dextromethorphan', genericName: 'Dextromethorphan hydrobromide', strength: '10 mg/5 ml', dosageForm: 'Syrup', category: 'Cough and cold medicine', uses: ['Temporary relief of cough symptoms in suitable products.'], commonWarnings: ['Check the label and ask a pharmacist about interactions.'] }
];

let previewUrl = '';
let isMedicineScanRunning = false;

function normalizeMedicineText(value) {
    return String(value || '').toLowerCase().replace(/[|]/g, 'i').replace(/[^a-z0-9%/.-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function getMedicineInformation(medicineName) {
    const normalizedName = normalizeMedicineText(medicineName);
    return medicineDatabase.find((medicine) => normalizeMedicineText(medicine.name) === normalizedName) || null;
}

function calculateTextSimilarity(firstValue, secondValue) {
    const first = normalizeMedicineText(firstValue);
    const second = normalizeMedicineText(secondValue);
    const distances = Array.from({ length: second.length + 1 }, (_, index) => index);

    for (let row = 1; row <= first.length; row += 1) {
        let previous = distances[0];
        distances[0] = row;
        for (let column = 1; column <= second.length; column += 1) {
            const current = distances[column];
            distances[column] = first[row - 1] === second[column - 1]
                ? previous
                : Math.min(previous + 1, distances[column] + 1, distances[column - 1] + 1);
            previous = current;
        }
    }

    return 1 - distances[second.length] / Math.max(first.length, second.length, 1);
}

function extractMedicineCandidates(text, visionCandidates = []) {
    const ignoredLinePattern = /(?:exp(?:iry|ires)?|use\s*before|mfg|mfd|manufactur(?:ed|ing)?\s*(?:date|by)?|batch|lot|www\.|ingredients?)/i;
    const ocrCandidates = String(text || '').split(/\r?\n/)
        .map((line) => line.replace(/[^a-zA-Z0-9 -]/g, ' ').replace(/\s+/g, ' ').trim())
        .filter((line) => line.length >= 4 && /[a-zA-Z]/.test(line) && !ignoredLinePattern.test(line));

    return [...new Set([...visionCandidates, ...ocrCandidates])];
}

function matchMedicine(candidates) {
    let bestMatch = null;
    let bestScore = 0;

    medicineDatabase.forEach((medicine) => {
        const searchableNames = [medicine.name, medicine.genericName];
        candidates.forEach((candidate) => {
            searchableNames.forEach((searchableName) => {
                const candidateText = normalizeMedicineText(candidate);
                const nameText = normalizeMedicineText(searchableName);
                const candidateWords = candidateText.split(' ').filter((word) => word.length > 2);
                const wordScore = Math.max(...candidateWords.map((word) => calculateTextSimilarity(word, nameText)), 0);
                const score = candidateText.includes(nameText) ? 0.96 : wordScore;
                if (score > bestScore) {
                    bestMatch = medicine;
                    bestScore = score;
                }
            });
        });
    });

    return bestMatch && bestScore >= 0.72 ? { medicine: getMedicineInformation(bestMatch.name), score: bestScore } : null;
}

function parseLabelValue(text, labels) {
    const labelPattern = labels.join('|');
    const match = String(text).match(new RegExp(`(?:${labelPattern})\\s*(?:number|no\\.?|date)?\\s*[:#.-]?\\s*([A-Za-z0-9./% -]{2,35})`, 'i'));
    return match ? match[1].trim().replace(/[|]+$/, '') : null;
}

function normalizeDetectedDate(value) {
    const cleaned = value.trim().replace(/[.-]/g, '/');
    const parts = cleaned.split('/');
    if (parts.length === 2 && /^\d{1,2}$/.test(parts[0])) {
        return `${parts[0].padStart(2, '0')}/${parts[1].length === 2 ? `20${parts[1]}` : parts[1]}`;
    }
    return cleaned;
}

function extractExpiryDate(text) {
    const match = String(text).match(/(?:exp(?:iry|ires)?|use\s*before|use\s*by)\s*[:.#-]?\s*(\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}|\d{1,2}[/.\-]\d{2,4}|[A-Za-z]{3,9}\s*\d{2,4})/i);
    return match ? normalizeDetectedDate(match[1]) : null;
}

function extractManufacturingDate(text) {
    return parseLabelValue(text, ['mfg', 'mfd', 'manufactured', 'manufacturing date']);
}

function extractBatchNumber(text) {
    return parseLabelValue(text, ['batch', 'batch number', 'lot']);
}

function extractStrength(text) {
    const match = String(text).match(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|%)\b(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:ml|mg))?/i);
    return match ? match[0] : null;
}

function extractDosageForm(text) {
    const forms = ['tablet', 'capsule', 'cream', 'ointment', 'gel', 'lotion', 'syrup', 'drops?', 'injection', 'powder', 'suspension', 'inhaler', 'spray', 'sachet', 'solution', 'suppository'];
    const match = String(text).match(new RegExp(`\\b(${forms.join('|')})\\b`, 'i'));
    return match ? match[1].replace(/s$/, '').replace(/^./, (letter) => letter.toUpperCase()) : null;
}

function calculateExpiryStatus(expiryDate) {
    if (!expiryDate) return { label: 'Expiry not detected', className: 'unknown' };
    const parts = expiryDate.split('/');
    const hasDay = parts.length === 3;
    const month = Number(hasDay ? parts[1] : parts[0]);
    const year = Number(hasDay ? parts[2] : parts[1]);
    if (!month || !year || month > 12) return { label: 'Expiry not detected', className: 'unknown' };
    const expiry = hasDay ? new Date(year, month - 1, Number(parts[0]), 23, 59, 59) : new Date(year, month, 0, 23, 59, 59);
    const now = new Date();
    const monthsRemaining = (expiry.getFullYear() - now.getFullYear()) * 12 + expiry.getMonth() - now.getMonth();
    if (expiry < now) return { label: 'EXPIRED', className: 'expired' };
    if (monthsRemaining <= 3) return { label: `Expires in ${Math.max(monthsRemaining, 0)} month${monthsRemaining === 1 ? '' : 's'}`, className: 'soon' };
    return { label: 'VALID', className: '' };
}

function preprocessMedicineImage(image) {
    return new Promise((resolve, reject) => {
        const imageElement = new Image();
        imageElement.onload = () => {
            const scale = Math.min(1, 1800 / Math.max(imageElement.naturalWidth, imageElement.naturalHeight));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(imageElement.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(imageElement.naturalHeight * scale));
            const context = canvas.getContext('2d');
            if (!context) return reject(new Error('Image preprocessing is unavailable.'));
            context.filter = 'grayscale(1) contrast(1.25)';
            context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(imageElement.src);
            resolve(canvas);
        };
        imageElement.onerror = () => reject(new Error('The selected image could not be opened.'));
        imageElement.src = URL.createObjectURL(image);
    });
}

function performOCR(image) {
    if (!window.Tesseract) throw new Error('OCR library is unavailable.');
    return Tesseract.recognize(image, 'eng', {
        logger: (message) => {
            if (message.status === 'recognizing text') {
                const progress = 25 + Math.round(message.progress * 20);
                scanProgress.textContent = `${progress}% Reading medicine label...`;
            }
        }
    });
}

async function requestVisionAnalysis(image) {
    const imageDataUrl = image.toDataURL('image/jpeg', 0.9);
    let response;
    try {
        response = await fetch('/api/analyze-medicine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageDataUrl })
        });
    } catch (error) {
        const connectionError = new Error('Medicine analysis service is unavailable. Start the LifeLink server and configure the vision API.');
        connectionError.code = 'VISION_API_NOT_CONNECTED';
        throw connectionError;
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const apiError = new Error(payload.error || 'Medicine analysis service is unavailable.');
        apiError.code = payload.code || 'VISION_API_ERROR';
        throw apiError;
    }
    return payload;
}

function identifyMedicine(visionResult, ocrText) {
    const visionCandidate = visionResult.medicineName || '';
    const candidates = extractMedicineCandidates(`${visionCandidate}\n${ocrText}`, visionCandidate ? [visionCandidate] : []);
    const match = matchMedicine(candidates);
    const visionConfidence = Number.isFinite(Number(visionResult.confidence)) ? Number(visionResult.confidence) : 0;
    const medicineMatchConfidence = match?.score || 0;
    const visionNameIsReliable = Boolean(visionCandidate) && visionConfidence >= 0.65;
    const databaseMatchIsReliable = Boolean(match) && medicineMatchConfidence >= 0.82;
    const medicineName = visionNameIsReliable ? visionCandidate : databaseMatchIsReliable ? match.medicine.name : null;

    return {
        medicineName,
        medicine: medicineName ? getMedicineInformation(medicineName) || match?.medicine || null : null,
        match,
        visionConfidence,
        medicineMatchConfidence,
        candidates,
        source: visionNameIsReliable ? 'vision-api' : databaseMatchIsReliable ? 'ocr/database' : 'none'
    };
}

async function analyzeMedicineImage(image) {
    const processedImage = await preprocessMedicineImage(image);
    scanProgress.textContent = '25% Image preprocessing complete. Reading medicine label...';
    const ocrResult = await performOCR(processedImage);
    const ocrText = ocrResult.data.text || '';
    const ocrConfidenceValue = Number(ocrResult.data.confidence);
    const ocrConfidence = Number.isFinite(ocrConfidenceValue) && ocrText.trim() ? ocrConfidenceValue / 100 : null;
    scanProgress.textContent = '65% Reading complete. Identifying medicine...';
    const visionResult = await requestVisionAnalysis(processedImage);
    if (visionResult.analysisCompleted !== true) {
        const serviceError = new Error(visionResult.error || 'Medicine analysis service is unavailable.');
        serviceError.code = visionResult.code || 'VISION_API_ERROR';
        throw serviceError;
    }

    scanProgress.textContent = '80% Medicine identified. Looking up medicine information...';
    const identified = identifyMedicine(visionResult, ocrText);
    const medicine = identified.medicine;
    const fields = {
        genericName: visionResult.activeIngredient || medicine?.genericName || null,
        strength: visionResult.strength || extractStrength(ocrText),
        dosageForm: visionResult.dosageForm || extractDosageForm(ocrText),
        expiryDate: visionResult.expiryDate || extractExpiryDate(ocrText),
        manufacturingDate: visionResult.manufacturingDate || extractManufacturingDate(ocrText),
        batchNumber: visionResult.batchNumber || extractBatchNumber(ocrText),
        manufacturer: visionResult.manufacturer || parseLabelValue(ocrText, ['manufacturer', 'manufactured by'])
    };
    scanProgress.textContent = '95% Information checked. Running safety validation...';

    return {
        success: Boolean(identified.medicineName),
        medicine,
        medicineName: identified.medicineName,
        confidence: identified.visionConfidence || identified.medicineMatchConfidence,
        visionConfidence: identified.visionConfidence,
        ocrConfidence,
        medicineMatchConfidence: identified.medicineMatchConfidence,
        ...fields,
        debug: {
            vision: visionResult,
            ocr: ocrText || 'No OCR text detected.',
            candidate: identified.medicineName || identified.candidates.join(' | ') || 'No candidate identified.',
            apiStatus: `Vision API response received. Source: ${identified.source}`,
            databaseLookup: medicine ? 'Detailed demo database record found.' : identified.medicineName ? 'Medicine identified, but detailed information is unavailable.' : 'No medicine identified.'
        }
    };
}

function setMedicineField(fieldName, value, fallback = 'Not detected') {
    const row = document.querySelector(`[data-medicine-field="${fieldName}"]`);
    if (!row) return;
    const hasValue = Boolean(value);
    row.hidden = !hasValue;
    const valueElement = row.querySelector('span');
    if (valueElement) valueElement.textContent = hasValue ? value : fallback;
}

function displayMedicineResult(result) {
    const medicine = result.medicine;
    document.querySelector('#medicineName').textContent = result.medicineName || 'Medicine could not be identified confidently.';
    setMedicineField('genericName', result.genericName || medicine?.genericName);
    setMedicineField('strength', result.strength || medicine?.strength);
    setMedicineField('dosageForm', result.dosageForm || medicine?.dosageForm);
    setMedicineField('expiryDate', result.expiryDate);
    setMedicineField('manufacturingDate', result.manufacturingDate);
    setMedicineField('batchNumber', result.batchNumber);
    setMedicineField('manufacturer', result.manufacturer);

    const detailsRow = document.querySelector('#medicineDetails').closest('p');
    const warningsRow = document.querySelector('#medicineWarnings').closest('p');
    detailsRow.hidden = false;
    warningsRow.hidden = false;
    document.querySelector('#medicineDetails').textContent = medicine
        ? medicine.uses.join(' ')
        : 'Medicine identified, but detailed information is unavailable.';
    document.querySelector('#medicineWarnings').textContent = medicine
        ? medicine.commonWarnings.join(' ')
        : 'Do not use this result as treatment advice.';
    document.querySelector('#medicineConfidence').textContent = result.confidence ? `${Math.round(result.confidence * 100)}%` : 'Not available';
    setMedicineField('visionConfidence', result.visionConfidence ? `${Math.round(result.visionConfidence * 100)}%` : null);
    setMedicineField('ocrConfidence', result.ocrConfidence !== null ? `${Math.round(result.ocrConfidence * 100)}%` : null);
    setMedicineField('medicineMatchConfidence', result.medicineMatchConfidence ? `${Math.round(result.medicineMatchConfidence * 100)}%` : null);

    document.querySelector('#medicineVisionDebug').textContent = JSON.stringify(result.debug.vision, null, 2);
    document.querySelector('#medicineOcrDebug').textContent = result.debug.ocr;
    document.querySelector('#medicineCandidateDebug').textContent = result.debug.candidate;
    document.querySelector('#medicineApiDebug').textContent = `${result.debug.apiStatus}\nDatabase lookup: ${result.debug.databaseLookup}`;

    const status = document.querySelector('#medicineStatus');
    const expiryStatus = calculateExpiryStatus(result.expiryDate);
    status.textContent = expiryStatus.label;
    status.className = `medicine-status ${expiryStatus.className}`.trim();
    medicineResult.hidden = false;
}

function showMedicineError(message, debugMessage = 'No analysis result.') {
    medicineResult.hidden = false;
    document.querySelector('#medicineName').textContent = message;
    ['genericName', 'strength', 'dosageForm', 'expiryDate', 'manufacturingDate', 'batchNumber', 'manufacturer', 'visionConfidence', 'ocrConfidence', 'medicineMatchConfidence'].forEach((fieldName) => setMedicineField(fieldName, null));
    document.querySelector('#medicineDetails').closest('p').hidden = true;
    document.querySelector('#medicineWarnings').closest('p').hidden = false;
    document.querySelector('#medicineWarnings').textContent = 'Please verify the package with a pharmacist or doctor.';
    document.querySelector('#medicineConfidence').textContent = 'Not available';
    document.querySelector('#medicineVisionDebug').textContent = 'Not available';
    document.querySelector('#medicineOcrDebug').textContent = 'Not available';
    document.querySelector('#medicineCandidateDebug').textContent = 'Not available';
    document.querySelector('#medicineApiDebug').textContent = debugMessage;
    const status = document.querySelector('#medicineStatus');
    status.textContent = 'Not checked';
    status.className = 'medicine-status unknown';
}

async function handleMedicineImageUpload() {
    const image = medicineImageInput?.files[0];
    if (!image || !image.type.startsWith('image/')) {
        if (medicineUploadName) medicineUploadName.textContent = 'Choose medicine file';
        if (medicinePreview) medicinePreview.hidden = true;
        scanProgress.textContent = 'Please choose a valid medicine image.';
        return;
    }
    if (medicineUploadName) medicineUploadName.textContent = image.name;
    if (isMedicineScanRunning) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(image);
    medicinePreviewImage.src = previewUrl;
    medicinePreview.hidden = false;
    scanMedicineButton.disabled = true;
    isMedicineScanRunning = true;
    scanProgress.textContent = '10% Image loaded. Analyzing medicine image...';

    try {
        const result = await analyzeMedicineImage(image);
        if (!result.success) {
            showMedicineError('Medicine could not be identified from this image.', 'Analysis completed, but no reliable medicine candidate was found.');
            scanProgress.textContent = 'Please upload a clearer image showing the medicine name or package label.';
        } else {
            displayMedicineResult(result);
            scanProgress.textContent = '100% Analysis completed.';
        }
    } catch (error) {
        console.error('Medicine scan failed:', error);
        const isConfigurationError = error.code === 'VISION_API_NOT_CONNECTED' || error.code === 'VISION_API_NOT_CONFIGURED' || error.code === 'VISION_API_ERROR' || error.code === 'VISION_RESPONSE_ERROR';
        showMedicineError(
            isConfigurationError ? 'Medicine analysis service is unavailable.' : 'Medicine could not be identified from this image.',
            `${error.code || 'UNKNOWN_ERROR'}: ${error.message}`
        );
        scanProgress.textContent = error.message || 'Could not read the medicine label. Please upload a clearer image.';
    } finally {
        isMedicineScanRunning = false;
        scanMedicineButton.disabled = false;
    }
}

medicineImageInput?.addEventListener('change', handleMedicineImageUpload);
scanMedicineButton?.addEventListener('click', handleMedicineImageUpload);
