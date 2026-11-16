import { writeFile } from 'node:fs/promises';

const debugPort = process.argv[2] ?? '9223';
const screenshotPath = process.argv[3] ?? '/private/tmp/loverman-preview.png';
const shouldReload = !process.argv.includes('--no-reload');
const sceneArgument = process.argv.find((argument) => argument.startsWith('--scene='));
const requestedScene = sceneArgument?.slice('--scene='.length);
const taps = process.argv
    .filter((argument) => argument.startsWith('--tap='))
    .map((argument) => argument.slice('--tap='.length));
const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
const target = targets.find((item) => item.type === 'page' && item.url.includes(':7456/'));

if (!target) {
    throw new Error('Cocos preview page was not found.');
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let requestId = 0;

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
        const details = message.params.exceptionDetails;
        console.error(
            `[exception] ${details.text}\n${details.exception?.description ?? details.exception?.value ?? ''}`,
        );
    }
    if (message.method === 'Runtime.consoleAPICalled') {
        const values = message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' ');
        console.error(`[console:${message.params.type}] ${values}`);
    }
    if (message.method === 'Log.entryAdded') {
        console.error(`[log:${message.params.entry.level}] ${message.params.entry.text}`);
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

await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
});

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
if (shouldReload) {
    await send('Page.reload', { ignoreCache: true });
}
await new Promise((resolve) => setTimeout(resolve, shouldReload ? 15000 : 3000));

if (requestedScene) {
    await send('Runtime.evaluate', {
        expression: `System.import('cc').then((cc) => {
            const engine = globalThis.cc ?? cc;
            return engine.director.loadScene('${requestedScene}');
        })`,
        awaitPromise: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 3500));
}

for (const nodeName of taps) {
    await send('Runtime.evaluate', {
        expression: `System.import('cc').then((cc) => {
            const engine = globalThis.cc ?? cc;
            const find = (node) => {
                if (node.name === ${JSON.stringify(nodeName)}) {
                    return node;
                }
                for (const child of node.children) {
                    const result = find(child);
                    if (result) {
                        return result;
                    }
                }
                return null;
            };
            const scene = engine.director.getScene();
            const target = scene ? find(scene) : null;
            if (!target) {
                return false;
            }
            target.emit(engine.Node.EventType.TOUCH_END);
            return true;
        })`,
        awaitPromise: true,
        returnByValue: true,
    });
}
if (taps.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, 500));
}

const state = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
        title: document.title,
        readyState: document.readyState,
        text: document.body.innerText.slice(0, 2000),
        canvases: [...document.querySelectorAll('canvas')].map((canvas) => ({
            width: canvas.width,
            height: canvas.height,
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight,
        })),
    })`,
    returnByValue: true,
});
console.log(state.result.value);

const sceneState = await send('Runtime.evaluate', {
    expression: `System.import('cc').then((cc) => {
        const engine = globalThis.cc ?? cc;
        const scene = engine.director.getScene();
        const summarize = (node) => ({
            name: node.name,
            active: node.activeInHierarchy,
            position: [node.position.x, node.position.y, node.position.z],
            children: node.children.map(summarize),
            components: node.components.map((component) => component.constructor.name),
        });
        const resourcePaths = [
            'scene/layers/market-canopy/spriteFrame',
            'scene/layers/pink-girl/spriteFrame',
            'scene/layers/silver-boy/spriteFrame',
        ];
        return JSON.stringify({
            engine: typeof engine.director,
            scene: scene ? summarize(scene) : null,
            resources: resourcePaths.map((path) => ({
                path,
                loaded: Boolean(engine.resources.get(path)),
            })),
        }, null, 2);
    })`,
    awaitPromise: true,
    returnByValue: true,
});
console.log(`scene=${sceneState.result.value}`);

await send('Runtime.evaluate', {
    expression: `Promise.all([
        Promise.resolve().then(() => {
            const toolbar = document.querySelector('.toolbar');
            if (toolbar) {
                toolbar.style.display = 'none';
            }
            window.dispatchEvent(new Event('resize'));
        }),
        System.import('cc').then((cc) => {
            const engine = globalThis.cc ?? cc;
            const profiler = engine.director.getScene()?.getChildByName('PROFILER_NODE');
            if (profiler) {
                profiler.active = false;
            }
        }),
    ])`,
    awaitPromise: true,
});
await new Promise((resolve) => setTimeout(resolve, 1200));

const screenshot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
});
await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'));
console.log(`screenshot=${screenshotPath}`);

socket.close();
