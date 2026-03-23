// Helper to call Stitch MCP API
const API_KEY = 'AQ.Ab8RN6JnuNj5q522pfBMnp48YpInL7OI6eCRYPrimXjFBon0ew';
const PROJECT_ID = '3964198457554600043';
const URL = 'https://stitch.googleapis.com/mcp';

const [,, toolName, ...promptParts] = process.argv;
const prompt = promptParts.join(' ');

if (!toolName) {
    console.log('Usage: node stitch-call.mjs <tool_name> [prompt]');
    console.log('Tools: list_screens, get_screen <screenId>, generate_screen_from_text <prompt>, get_screen_code <screenId>, edit_screens <prompt> --screens <id1,id2>');
    process.exit(1);
}

let args = {};
if (toolName === 'list_screens') {
    args = { projectId: PROJECT_ID };
} else if (toolName === 'get_screen') {
    args = { projectId: PROJECT_ID, screenId: prompt };
} else if (toolName === 'generate_screen_from_text') {
    args = { projectId: PROJECT_ID, prompt, deviceType: 'MOBILE' };
} else if (toolName === 'edit_screens') {
    // Parse --screens flag
    const screensIdx = process.argv.indexOf('--screens');
    const screenIds = screensIdx !== -1 ? process.argv[screensIdx + 1].split(',') : [];
    const editPrompt = process.argv.slice(3, screensIdx !== -1 ? screensIdx : undefined).join(' ');
    args = { projectId: PROJECT_ID, prompt: editPrompt, screenIds };
} else if (toolName === 'generate_variants') {
    const screensIdx = process.argv.indexOf('--screens');
    const screenIds = screensIdx !== -1 ? process.argv[screensIdx + 1].split(',') : [];
    const varPrompt = process.argv.slice(3, screensIdx !== -1 ? screensIdx : undefined).join(' ');
    args = { projectId: PROJECT_ID, prompt: varPrompt, screenIds };
} else {
    args = { projectId: PROJECT_ID, ...JSON.parse(prompt || '{}') };
}

const body = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: toolName, arguments: args },
});

const resp = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body,
});

const data = await resp.json();

if (data.error) {
    console.error('ERROR:', JSON.stringify(data.error, null, 2));
    process.exit(1);
}

import { writeFileSync } from 'fs';

for (const c of data.result.content) {
    if (c.type === 'text') {
        try {
            const parsed = JSON.parse(c.text);
            console.log(JSON.stringify(parsed, null, 2));
        } catch {
            console.log(c.text);
        }
    } else if (c.type === 'image') {
        const filename = `/tmp/stitch_screen_${Date.now()}.png`;
        writeFileSync(filename, Buffer.from(c.data, 'base64'));
        console.log(`Screenshot saved: ${filename}`);
    }
}
