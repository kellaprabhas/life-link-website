const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 3000);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';
const ROOT = __dirname;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

const visionPrompt = `You are analyzing a pharmaceutical medicine package image.

Identify only information that is visibly readable or reliably inferable from the package.
Extract:
- brand/product name
- active ingredient/generic name
- strength
- dosage form
- manufacturer
- batch number
- manufacturing date
- expiry date

Do not guess missing information. If the medicine cannot be identified confidently, return medicineName as null.
Do not invent a medicine name, medical use, dosage, warning, contraindication, or expiry date.
Return only valid JSON with this exact shape:
{
  "medicineName": string or null,
  "activeIngredient": string or null,
  "strength": string or null,
  "dosageForm": string or null,
  "manufacturer": string or null,
  "batchNumber": string or null,
  "manufacturingDate": string or null,
  "expiryDate": string or null,
  "confidence": number between 0 and 1
}`;

function sendJson(response, statusCode, payload) {
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
    return new Promise((resolve, reject) => {
        let body = '';
        request.setEncoding('utf8');
        request.on('data', (chunk) => {
            body += chunk;
            if (Buffer.byteLength(body) > MAX_IMAGE_BYTES * 1.5) {
                reject(new Error('Request is too large.'));
                request.destroy();
            }
        });
        request.on('end', () => resolve(body));
        request.on('error', reject);
    });
}

function parseVisionJson(content) {
    const cleaned = String(content || '').trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleaned);
    return {
        medicineName: typeof parsed.medicineName === 'string' ? parsed.medicineName.trim() : null,
        activeIngredient: typeof parsed.activeIngredient === 'string' ? parsed.activeIngredient.trim() : null,
        strength: typeof parsed.strength === 'string' ? parsed.strength.trim() : null,
        dosageForm: typeof parsed.dosageForm === 'string' ? parsed.dosageForm.trim() : null,
        manufacturer: typeof parsed.manufacturer === 'string' ? parsed.manufacturer.trim() : null,
        batchNumber: typeof parsed.batchNumber === 'string' ? parsed.batchNumber.trim() : null,
        manufacturingDate: typeof parsed.manufacturingDate === 'string' ? parsed.manufacturingDate.trim() : null,
        expiryDate: typeof parsed.expiryDate === 'string' ? parsed.expiryDate.trim() : null,
        confidence: Number.isFinite(Number(parsed.confidence)) ? Math.max(0, Math.min(1, Number(parsed.confidence))) : 0
    };
}

async function analyzeMedicine(request, response) {
    if (!OPENAI_API_KEY) {
        sendJson(response, 503, {
            error: 'AI medicine recognition is not connected yet.',
            code: 'VISION_API_NOT_CONFIGURED'
        });
        return;
    }

    let body;
    try {
        body = JSON.parse(await readRequestBody(request));
    } catch (error) {
        sendJson(response, 400, { error: 'Invalid JSON request.' });
        return;
    }

    const imageDataUrl = body.imageDataUrl;
    if (typeof imageDataUrl !== 'string' || !/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(imageDataUrl)) {
        sendJson(response, 400, { error: 'A base64 image data URL is required.' });
        return;
    }

    if (Buffer.byteLength(imageDataUrl) > MAX_IMAGE_BYTES * 1.5) {
        sendJson(response, 413, { error: 'Image is too large. Please choose an image under 12 MB.' });
        return;
    }

    try {
        const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: OPENAI_VISION_MODEL,
                temperature: 0,
                response_format: { type: 'json_object' },
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: visionPrompt },
                        { type: 'image_url', image_url: { url: imageDataUrl, detail: 'high' } }
                    ]
                }]
            })
        });

        const result = await visionResponse.json();
        if (!visionResponse.ok) {
            console.error('Vision provider error:', result);
            sendJson(response, 502, { error: 'The vision service could not analyze this image.', code: 'VISION_API_ERROR' });
            return;
        }

        const content = result.choices?.[0]?.message?.content;
        const analysis = parseVisionJson(content);
        sendJson(response, 200, {
            success: Boolean(analysis.medicineName),
            analysisCompleted: true,
            ...analysis,
            provider: 'openai-vision'
        });
    } catch (error) {
        console.error('Medicine analysis failed:', error);
        sendJson(response, 502, { error: 'The vision service returned an unreadable response.', code: 'VISION_RESPONSE_ERROR' });
    }
}

function serveStatic(request, response) {
    const requestedPath = request.url === '/' ? '/dashboard.html' : request.url.split('?')[0];
    const safePath = path.normalize(requestedPath).replace(/^([.][.][\\/])+/, '');
    const filePath = path.join(ROOT, safePath);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        sendJson(response, 404, { error: 'Not found' });
        return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8' };
    response.writeHead(200, { 'Content-Type': contentTypes[extension] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
    if (request.method === 'POST' && request.url === '/api/analyze-medicine') {
        await analyzeMedicine(request, response);
        return;
    }
    if (request.method === 'GET') {
        serveStatic(request, response);
        return;
    }
    sendJson(response, 405, { error: 'Method not allowed' });
});

server.listen(PORT, () => {
    console.log(`LifeLink server running at http://localhost:${PORT}`);
    console.log(OPENAI_API_KEY ? `Vision model: ${OPENAI_VISION_MODEL}` : 'Vision API is not configured. Set OPENAI_API_KEY before scanning.');
});
