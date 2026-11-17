import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readdir, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';

const directory = process.argv[2];
if (!directory) {
    throw new Error('Usage: generate_sprite_meta.mjs <asset-directory>');
}

const files = (await readdir(directory))
    .filter((file) => ['.png', '.jpg', '.webp'].includes(extname(file).toLowerCase()))
    .sort();

for (const file of files) {
    const path = join(directory, file);
    const dimensions = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', path], {
        encoding: 'utf8',
    });
    const width = Number(dimensions.match(/pixelWidth:\s*(\d+)/)?.[1]);
    const height = Number(dimensions.match(/pixelHeight:\s*(\d+)/)?.[1]);
    if (!width || !height) {
        throw new Error(`Unable to read dimensions for ${path}`);
    }

    const uuid = randomUUID();
    const textureUuid = `${uuid}@6c48a`;
    const spriteFrameUuid = `${uuid}@f9941`;
    const displayName = basename(file, extname(file));
    const hasAlpha = extname(file).toLowerCase() !== '.jpg';
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const meta = {
        ver: '1.0.27',
        importer: 'image',
        imported: true,
        uuid,
        files: [extname(file), '.json'],
        subMetas: {
            '6c48a': {
                importer: 'texture',
                uuid: textureUuid,
                displayName,
                id: '6c48a',
                name: 'texture',
                userData: {
                    wrapModeS: 'clamp-to-edge',
                    wrapModeT: 'clamp-to-edge',
                    imageUuidOrDatabaseUri: uuid,
                    isUuid: true,
                    visible: false,
                    minfilter: 'linear',
                    magfilter: 'linear',
                    mipfilter: 'none',
                    anisotropy: 0,
                },
                ver: '1.0.22',
                imported: true,
                files: ['.json'],
                subMetas: {},
            },
            f9941: {
                importer: 'sprite-frame',
                uuid: spriteFrameUuid,
                displayName,
                id: 'f9941',
                name: 'spriteFrame',
                userData: {
                    trimThreshold: 1,
                    rotated: false,
                    offsetX: 0,
                    offsetY: 0,
                    trimX: 0,
                    trimY: 0,
                    width,
                    height,
                    rawWidth: width,
                    rawHeight: height,
                    borderTop: 0,
                    borderBottom: 0,
                    borderLeft: 0,
                    borderRight: 0,
                    packable: false,
                    pixelsToUnit: 100,
                    pivotX: 0.5,
                    pivotY: 0.5,
                    meshType: 0,
                    vertices: {
                        rawPosition: [
                            -halfWidth,
                            -halfHeight,
                            0,
                            halfWidth,
                            -halfHeight,
                            0,
                            -halfWidth,
                            halfHeight,
                            0,
                            halfWidth,
                            halfHeight,
                            0,
                        ],
                        indexes: [0, 1, 2, 2, 1, 3],
                        uv: [0, height, width, height, 0, 0, width, 0],
                        nuv: [0, 0, 1, 0, 0, 1, 1, 1],
                        minPos: [-halfWidth, -halfHeight, 0],
                        maxPos: [halfWidth, halfHeight, 0],
                    },
                    isUuid: true,
                    imageUuidOrDatabaseUri: textureUuid,
                    atlasUuid: '',
                    trimType: 'auto',
                },
                ver: '1.0.12',
                imported: true,
                files: ['.json'],
                subMetas: {},
            },
        },
        userData: {
            type: 'sprite-frame',
            fixAlphaTransparencyArtifacts: hasAlpha,
            hasAlpha,
            redirect: textureUuid,
        },
    };

    await writeFile(`${path}.meta`, `${JSON.stringify(meta, null, 2)}\n`);
    console.log(`${file}: ${width}x${height}`);
}
