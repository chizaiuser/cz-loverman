import { writeFile } from 'node:fs/promises';

const debugPort = process.argv[2] ?? '9223';
const screenshotPath = process.argv[3] ?? '/private/tmp/loverman-p0-gallery.png';
const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
const target = targets.find((item) => item.type === 'page' && item.url.includes(':7456/'));
if (!target) {
    throw new Error('Cocos preview page was not found.');
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let requestId = 0;
let pageErrors = [];

socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
        const { resolve, reject } = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) {
            reject(new Error(message.error.message));
        } else {
            resolve(message.result);
        }
        return;
    }
    if (message.method === 'Runtime.exceptionThrown') {
        const text = message.params.exceptionDetails.text;
        pageErrors.push(text);
        console.error(`[page:exception] ${text}`);
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        const text = message.params.args
            .map((arg) => arg.value ?? arg.description ?? '')
            .join(' ');
        pageErrors.push(text);
        console.error(`[page:error] ${text}`);
    }
});

function send(method, params = {}) {
    requestId += 1;
    const id = requestId;
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
    });
}

async function evaluate(expression) {
    const result = await send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
    });
    if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.text);
    }
    return result.result.value;
}

async function waitForScene(name, timeoutMs = 360000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
        const current = await evaluate(
            `System.import('cc').then((cc) => (globalThis.cc ?? cc).director.getScene()?.name ?? null)`,
        );
        if (current === name) {
            return;
        }
        console.log(`[wait] scene ${current ?? 'initializing'} -> ${name}`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    throw new Error(`Timed out waiting for scene ${name}`);
}

async function waitForNode(name, timeoutMs = 30000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
        const found = await evaluate(`System.import('cc').then((cc) => {
            const engine = globalThis.cc ?? cc;
            const find = (node) => {
                if (node.name === ${JSON.stringify(name)}) return true;
                return node.children.some(find);
            };
            const scene = engine.director.getScene();
            return scene ? find(scene) : false;
        })`);
        if (found) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error(`Timed out waiting for node ${name}`);
}

async function emitNode(name) {
    const result = await evaluate(`System.import('cc').then((cc) => {
        const engine = globalThis.cc ?? cc;
        const find = (node) => {
            if (node.name === ${JSON.stringify(name)}) return node;
            for (const child of node.children) {
                const found = find(child);
                if (found) return found;
            }
            return null;
        };
        const scene = engine.director.getScene();
        const target = scene ? find(scene) : null;
        if (!target) return false;
        target.emit(engine.Node.EventType.TOUCH_END);
        return true;
    })`);
    if (!result) {
        throw new Error(`Node not found: ${name}`);
    }
    console.log(`[tap] ${name}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
}

await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
});

await send('Runtime.enable');
await send('Page.enable');
await evaluate(`localStorage.clear(); true`);
await evaluate(`System.import('cc').then((cc) => {
    const engine = globalThis.cc ?? cc;
    return engine.director.loadScene('CharacterCustomization');
})`);
await waitForScene('CharacterCustomization');

await emitNode('Zodiac_双鱼');
await emitNode('Personality_温柔治愈');
await emitNode('ConfirmButton');
await waitForScene('Main');

await emitNode('ClueBubble');
await emitNode('InfoModal');
await emitNode('TalkButton');
await emitNode('Choice_gentle-response');
await emitNode('InfoModal');

const mainSave = JSON.parse(
    await evaluate(`localStorage.getItem('loverman.save.v1')`),
);
console.log(`[save:main] ${JSON.stringify(mainSave)}`);
if (!mainSave.completedEvents.includes('sakura-sweet-shop')) {
    throw new Error('Chapter was not completed.');
}
if (!mainSave.unlockedCharacters.includes('shen-xinglan')) {
    throw new Error('Gallery character was not unlocked.');
}

const attachResult = await evaluate(`System.import('cc').then((cc) => {
    const engine = globalThis.cc ?? cc;
    const GalleryClass = engine.js.getClassByName('CharacterGallery');
    const scene = engine.director.getScene();
    const canvas = scene?.getChildByName('Canvas');
    const UITransformClass = canvas?.components.find(
        (component) => component.constructor.name === 'UITransform',
    )?.constructor;
    if (!GalleryClass || !canvas || !UITransformClass) {
        return { attached: false };
    }
    for (const child of canvas.children) {
        if (child.name !== 'Camera') {
            child.active = false;
        }
    }
    const galleryNode = new engine.Node('CharacterGalleryPreview');
    galleryNode.layer = canvas.layer;
    canvas.addChild(galleryNode);
    galleryNode.addComponent(UITransformClass).setContentSize(750, 1334);
    galleryNode.addComponent(GalleryClass);
    return { attached: true };
})`);
console.log(`[load:gallery] ${JSON.stringify(attachResult)}`);
if (!attachResult.attached) {
    throw new Error('Unable to attach CharacterGallery in preview.');
}
await waitForNode('CharacterCard_shen-xinglan');

const galleryState = await evaluate(`System.import('cc').then((cc) => {
    const engine = globalThis.cc ?? cc;
    const find = (node, name) => {
        if (node.name === name) return node;
        for (const child of node.children) {
            const found = find(child, name);
            if (found) return found;
        }
        return null;
    };
    const scene = engine.director.getScene();
    const shen = find(scene, 'CharacterCard_shen-xinglan');
    const progress = find(scene, 'ProgressValue');
    const progressLabel = progress?.components.find(
        (component) => component.constructor.name === 'Label',
    );
    return {
        shenUnlocked: Boolean(shen && !shen.getChildByName('LockedOverlay')),
        progress: progressLabel?.string ?? null,
    };
})`);
console.log(`[gallery] ${JSON.stringify(galleryState)}`);
if (!galleryState.shenUnlocked) {
    throw new Error('Shen Xinglan is still locked in the gallery.');
}

await emitNode('GiftButton');
const gallerySave = JSON.parse(
    await evaluate(`localStorage.getItem('loverman.save.v1')`),
);
console.log(`[save:gallery] ${JSON.stringify(gallerySave)}`);
if (gallerySave.gifts !== mainSave.gifts - 1) {
    throw new Error('Gift inventory was not persisted.');
}

const screenshot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
});
await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'));
console.log(`[screenshot] ${screenshotPath}`);
console.log(`[errors] ${JSON.stringify(pageErrors)}`);
socket.close();
