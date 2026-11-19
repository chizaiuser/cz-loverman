import {
    AudioClip,
    AudioSource,
    Color,
    director,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    resources,
    sys,
    tween,
    UIOpacity,
    UITransform,
    Vec3,
    VerticalTextAlignment,
} from 'cc';

type SoundName = 'click' | 'success' | 'gift';

export interface FeelSettings {
    bgmEnabled: boolean;
    sfxEnabled: boolean;
    vibrationEnabled: boolean;
}

const SETTINGS_KEY = 'loverman.settings.v1';
const DEFAULT_SETTINGS: FeelSettings = {
    bgmEnabled: true,
    sfxEnabled: true,
    vibrationEnabled: true,
};

function loadStoredSettings(): FeelSettings {
    const raw = sys.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
        return { ...DEFAULT_SETTINGS };
    }
    try {
        const parsed = JSON.parse(raw) as Partial<FeelSettings>;
        return {
            bgmEnabled: typeof parsed.bgmEnabled === 'boolean'
                ? parsed.bgmEnabled
                : DEFAULT_SETTINGS.bgmEnabled,
            sfxEnabled: typeof parsed.sfxEnabled === 'boolean'
                ? parsed.sfxEnabled
                : DEFAULT_SETTINGS.sfxEnabled,
            vibrationEnabled: typeof parsed.vibrationEnabled === 'boolean'
                ? parsed.vibrationEnabled
                : DEFAULT_SETTINGS.vibrationEnabled,
        };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

class GameFeelService {
    private initialized = false;
    private sfxSource: AudioSource | null = null;
    private bgmSource: AudioSource | null = null;
    private clips = new Map<SoundName | 'bgm', AudioClip>();
    private bgmStarted = false;
    private settings: FeelSettings = loadStoredSettings();

    init(): void {
        if (this.initialized || !director.getScene()) {
            return;
        }
        this.initialized = true;

        const persistent = new Node('GameFeelPersistent');
        director.getScene()!.addChild(persistent);
        director.addPersistRootNode(persistent);

        const sfxNode = new Node('SfxAudio');
        persistent.addChild(sfxNode);
        this.sfxSource = sfxNode.addComponent(AudioSource);

        const bgmNode = new Node('BgmAudio');
        persistent.addChild(bgmNode);
        this.bgmSource = bgmNode.addComponent(AudioSource);
        this.bgmSource.loop = true;
        this.bgmSource.volume = 0.12;

        this.loadClip('click', 'audio/ui-click');
        this.loadClip('success', 'audio/chapter-success');
        this.loadClip('gift', 'audio/gift');
        this.loadClip('bgm', 'audio/sakura-loop');
    }

    play(name: SoundName): void {
        this.init();
        const clip = this.clips.get(name);
        if (this.settings.sfxEnabled && clip && this.sfxSource?.isValid) {
            this.sfxSource.playOneShot(clip, name === 'click' ? 0.55 : 0.8);
        }
        this.ensureBgm();
        if (this.settings.vibrationEnabled) {
            this.vibrate(name === 'success' ? 'medium' : 'light');
        }
    }

    getSettings(): FeelSettings {
        return { ...this.settings };
    }

    setBgmEnabled(enabled: boolean): void {
        this.settings = { ...this.settings, bgmEnabled: enabled };
        this.saveSettings();
        if (!enabled) {
            this.bgmSource?.stop();
            this.bgmStarted = false;
            return;
        }
        this.ensureBgm();
    }

    setSfxEnabled(enabled: boolean): void {
        this.settings = { ...this.settings, sfxEnabled: enabled };
        this.saveSettings();
    }

    setVibrationEnabled(enabled: boolean): void {
        this.settings = { ...this.settings, vibrationEnabled: enabled };
        this.saveSettings();
    }

    fadeIn(parent: Node): void {
        const fade = new Node('SceneFade');
        fade.layer = parent.layer;
        parent.addChild(fade);
        fade.addComponent(UITransform).setContentSize(750, 1334);
        const graphics = fade.addComponent(Graphics);
        graphics.fillColor = new Color(255, 235, 247, 255);
        graphics.rect(-375, -667, 750, 1334);
        graphics.fill();
        const opacity = fade.addComponent(UIOpacity);
        opacity.opacity = 255;
        tween(opacity)
            .to(0.32, { opacity: 0 }, { easing: 'sineOut' })
            .call(() => {
                if (fade.isValid) {
                    fade.destroy();
                }
            })
            .start();
    }

    float(node: Node, amplitude = 5, duration = 1.8): void {
        const base = node.position.clone();
        tween(node)
            .repeatForever(
                tween()
                    .to(
                        duration,
                        { position: new Vec3(base.x, base.y + amplitude, base.z) },
                        { easing: 'sineInOut' },
                    )
                    .to(
                        duration,
                        { position: base },
                        { easing: 'sineInOut' },
                    ),
            )
            .start();
    }

    showMissingImage(parent: Node, text = '图片加载失败'): void {
        if (parent.getChildByName('MissingImagePlaceholder')) {
            return;
        }
        const placeholder = new Node('MissingImagePlaceholder');
        placeholder.layer = parent.layer;
        parent.addChild(placeholder);
        const transform = placeholder.addComponent(UITransform);
        const parentTransform = parent.getComponent(UITransform);
        transform.setContentSize(
            parentTransform?.width ?? 160,
            parentTransform?.height ?? 160,
        );
        const graphics = placeholder.addComponent(Graphics);
        graphics.fillColor = new Color(247, 220, 235, 220);
        graphics.strokeColor = new Color(255, 255, 255, 220);
        graphics.lineWidth = 2;
        graphics.roundRect(
            -transform.width / 2,
            -transform.height / 2,
            transform.width,
            transform.height,
            18,
        );
        graphics.fill();
        graphics.stroke();

        const labelNode = new Node('PlaceholderLabel');
        labelNode.layer = parent.layer;
        placeholder.addChild(labelNode);
        labelNode.addComponent(UITransform).setContentSize(transform.width - 18, transform.height - 18);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 18;
        label.lineHeight = 26;
        label.color = new Color(129, 92, 132, 255);
        label.horizontalAlign = HorizontalTextAlignment.CENTER;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.overflow = Label.Overflow.SHRINK;
    }

    private loadClip(name: SoundName | 'bgm', path: string): void {
        resources.load(path, AudioClip, (error, clip) => {
            if (error || !clip) {
                console.warn(`[GameFeel] Missing audio ${path}`, error);
                return;
            }
            this.clips.set(name, clip);
            if (name === 'bgm' && this.bgmStarted) {
                this.ensureBgm();
            }
        });
    }

    private ensureBgm(): void {
        const clip = this.clips.get('bgm');
        if (
            !this.settings.bgmEnabled
            || !clip
            || !this.bgmSource?.isValid
            || this.bgmStarted
        ) {
            return;
        }
        this.bgmSource.clip = clip;
        this.bgmSource.play();
        this.bgmStarted = true;
    }

    private saveSettings(): void {
        sys.localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    }

    private vibrate(type: 'light' | 'medium'): void {
        const wxApi = (globalThis as unknown as {
            wx?: { vibrateShort?: (options: { type: string }) => void };
        }).wx;
        wxApi?.vibrateShort?.({ type });
    }
}

export const gameFeel = new GameFeelService();
