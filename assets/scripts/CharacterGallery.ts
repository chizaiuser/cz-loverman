import {
    _decorator,
    Color,
    Component,
    director,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    tween,
    UITransform,
    UIOpacity,
    Vec3,
    VerticalTextAlignment,
} from 'cc';
import {
    getBond,
    loadProgress,
    PlayerProgress,
    saveProgress,
} from './GameProgress';
import { gameFeel } from './GameFeel';

const { ccclass } = _decorator;

const DESIGN_WIDTH = 750;
const DESIGN_HEIGHT = 1334;

interface CharacterEntry {
    id: string;
    name: string;
    bond: string;
    resource: string;
    accent: Color;
    description: string;
}

const CHARACTERS: CharacterEntry[] = [
    {
        id: 'shen-xinglan',
        name: '沈星澜',
        bond: '4/2',
        resource: 'scene/gallery/shen-xinglan/spriteFrame',
        accent: new Color(255, 170, 205, 255),
        description: '喜欢在樱花市集收集花笺。安静下来时，总会认真听你讲完每一个故事。',
    },
    {
        id: 'jiang-yanbai',
        name: '江砚白',
        bond: '4/2',
        resource: 'scene/gallery/jiang-yanbai/spriteFrame',
        accent: new Color(222, 186, 244, 255),
        description: '总把想说的话写进书页里。若你留意书本的边角，会发现藏着给你的短句。',
    },
    {
        id: 'jiang-yanbai-hoodie',
        name: '江砚白',
        bond: '4/3',
        resource: 'scene/gallery/jiang-yanbai-hoodie/spriteFrame',
        accent: new Color(255, 210, 157, 255),
        description: '换上便装后，会主动约你去逛夜市。他说热闹的地方更适合慢慢聊。',
    },
    {
        id: 'xia-yang',
        name: '夏阳',
        bond: '4/2',
        resource: 'scene/gallery/xia-yang/spriteFrame',
        accent: new Color(255, 205, 178, 255),
        description: '阳光开朗，擅长照顾身边的人。遇到麻烦时，他经常第一个站出来。',
    },
    {
        id: 'lu-qinglan',
        name: '陆青澜',
        bond: '4/3',
        resource: 'scene/gallery/lu-qinglan/spriteFrame',
        accent: new Color(170, 190, 255, 255),
        description: '沉静可靠，习惯默默记住约定。答应过的事情，他从不会忘记。',
    },
    {
        id: 'lu-qinglan-hoodie',
        name: '陆青澜',
        bond: '4/6',
        resource: 'scene/gallery/lu-qinglan-hoodie/spriteFrame',
        accent: new Color(172, 207, 250, 255),
        description: '脱下外套后，比平时更容易亲近。偶尔露出的笑，会成为一天里的小惊喜。',
    },
    {
        id: 'gu-chenzhou',
        name: '顾沉舟',
        bond: '4/2',
        resource: 'scene/gallery/gu-chenzhou/spriteFrame',
        accent: new Color(230, 185, 153, 255),
        description: '说话谨慎，却会把你的喜好记在心上。下一次见面，他总能带来恰好合适的礼物。',
    },
    {
        id: 'lin-you',
        name: '林柚',
        bond: '4/3',
        resource: 'scene/gallery/lin-you/spriteFrame',
        accent: new Color(255, 171, 196, 255),
        description: '耳机里循环着为你挑的歌。如果你问起歌名，她会把另一半耳机递给你。',
    },
];

@ccclass('CharacterGallery')
export class CharacterGallery extends Component {
    private backgroundLayer!: Node;
    private characterLayer!: Node;
    private actionLayer!: Node;
    private feedbackLayer!: Node;
    private modalLayer!: Node;
    private selectedId = '';
    private cardNodes = new Map<string, Node>();
    private bondLabels = new Map<string, Label>();
    private progress!: PlayerProgress;
    private progressLabel: Label | null = null;
    private giftButton: Node | null = null;
    private toastNode: Node | null = null;
    private modal: Node | null = null;

    protected start(): void {
        gameFeel.init();
        this.progress = loadProgress();
        this.selectedId = CHARACTERS.find((entry) => (
            this.progress.unlockedCharacters.indexOf(entry.id) >= 0
        ))?.id ?? CHARACTERS[0].id;
        this.createLayers();
        this.createBackground();
        this.createGallery();
        this.createActions();
        gameFeel.fadeIn(this.node);
    }

    private createLayers(): void {
        this.backgroundLayer = this.createLayer('BackgroundLayer');
        this.characterLayer = this.createLayer('CharacterGridLayer');
        this.actionLayer = this.createLayer('ActionLayer');
        this.feedbackLayer = this.createLayer('FeedbackLayer');
        this.modalLayer = this.createLayer('ModalLayer');
    }

    private createLayer(name: string): Node {
        const node = new Node(name);
        node.layer = this.node.layer;
        this.node.addChild(node);
        node.addComponent(UITransform).setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
        return node;
    }

    private createBackground(): void {
        const gradientNode = this.createUiNode('GalleryGradient', this.backgroundLayer);
        const gradient = gradientNode.addComponent(Graphics);
        const bands = 40;
        const bandHeight = DESIGN_HEIGHT / bands;
        const top = new Color(201, 180, 244, 255);
        const middle = new Color(245, 206, 238, 255);
        const bottom = new Color(255, 220, 233, 255);
        for (let index = 0; index < bands; index += 1) {
            const ratio = index / (bands - 1);
            gradient.fillColor = ratio < 0.58
                ? this.lerpColor(top, middle, ratio / 0.58)
                : this.lerpColor(middle, bottom, (ratio - 0.58) / 0.42);
            gradient.rect(
                -DESIGN_WIDTH / 2,
                DESIGN_HEIGHT / 2 - (index + 1) * bandHeight,
                DESIGN_WIDTH,
                bandHeight + 1,
            );
            gradient.fill();
        }

        this.drawSakuraFrame();
        this.addLabel(
            this.backgroundLayer,
            'GalleryTitle',
            '心 动 图 鉴',
            48,
            new Color(255, 250, 254, 255),
            new Vec3(0, 575),
            460,
            78,
            true,
        );
        this.addLabel(
            this.backgroundLayer,
            'GallerySubtitle',
            '收集线索，解锁他的故事',
            24,
            new Color(129, 91, 143, 235),
            new Vec3(0, 522),
            420,
            44,
            true,
        );
    }

    private drawSakuraFrame(): void {
        const decorations = this.createUiNode('SakuraDecorations', this.backgroundLayer);
        const graphics = decorations.addComponent(Graphics);
        graphics.strokeColor = new Color(143, 99, 144, 210);
        graphics.lineWidth = 9;
        graphics.moveTo(-375, 667);
        graphics.lineTo(-276, 590);
        graphics.lineTo(-210, 508);
        graphics.moveTo(375, 667);
        graphics.lineTo(285, 590);
        graphics.lineTo(218, 515);
        graphics.stroke();

        const colors = [
            new Color(255, 174, 209, 235),
            new Color(251, 203, 224, 220),
            new Color(213, 187, 243, 210),
        ];
        for (let index = 0; index < 20; index += 1) {
            const left = index % 2 === 0;
            const x = left ? -310 + (index * 27) % 145 : 210 + (index * 31) % 150;
            const y = 630 - (index * 51) % 360;
            this.drawFlower(graphics, x, y, 7 + (index % 3) * 3, colors[index % 3]);
        }

        graphics.fillColor = new Color(255, 248, 253, 70);
        graphics.circle(-310, 525, 128);
        graphics.circle(332, 535, 140);
        graphics.fill();
    }

    private drawFlower(graphics: Graphics, x: number, y: number, radius: number, color: Color): void {
        graphics.fillColor = color;
        for (let petal = 0; petal < 5; petal += 1) {
            const angle = (Math.PI * 2 * petal) / 5;
            graphics.circle(
                x + Math.cos(angle) * radius * 1.15,
                y + Math.sin(angle) * radius * 1.15,
                radius * 0.72,
            );
        }
        graphics.fill();
        graphics.fillColor = new Color(255, 236, 173, 245);
        graphics.circle(x, y, radius * 0.46);
        graphics.fill();
    }

    private createGallery(): void {
        const panel = this.createUiNode('GalleryPanel', this.characterLayer);
        panel.setPosition(0, 10);
        panel.getComponent(UITransform)?.setContentSize(710, 955);
        const panelGraphics = panel.addComponent(Graphics);
        panelGraphics.fillColor = new Color(255, 249, 253, 165);
        panelGraphics.strokeColor = new Color(255, 255, 255, 220);
        panelGraphics.lineWidth = 4;
        panelGraphics.roundRect(-355, -478, 710, 955, 38);
        panelGraphics.fill();
        panelGraphics.stroke();

        const columns = [-232, 0, 232];
        const rows = [305, 55, -195];
        CHARACTERS.forEach((entry, index) => {
            const column = index % 3;
            const row = Math.floor(index / 3);
            this.createCharacterCard(
                entry,
                columns[column],
                rows[row],
            );
        });
        this.createProgressCard(columns[2], rows[2]);
        this.updateCardSelection();
    }

    private createCharacterCard(entry: CharacterEntry, x: number, y: number): void {
        const card = this.createUiNode(`CharacterCard_${entry.id}`, this.characterLayer);
        card.setPosition(x, y);
        card.getComponent(UITransform)?.setContentSize(204, 226);

        const graphics = card.addComponent(Graphics);
        graphics.fillColor = new Color(255, 248, 252, 242);
        graphics.strokeColor = new Color(255, 255, 255, 235);
        graphics.lineWidth = 3;
        graphics.roundRect(-102, -113, 204, 226, 24);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(entry.accent.r, entry.accent.g, entry.accent.b, 60);
        graphics.roundRect(-92, -103, 184, 206, 19);
        graphics.fill();

        const portrait = this.createUiNode('Portrait', card);
        portrait.setPosition(0, 24);
        portrait.getComponent(UITransform)?.setContentSize(180, 172);
        const sprite = portrait.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this.loadSprite(sprite, entry.resource);

        const namePill = this.createUiNode('NamePill', card);
        namePill.setPosition(0, -76);
        namePill.getComponent(UITransform)?.setContentSize(164, 36);
        const pill = namePill.addComponent(Graphics);
        pill.fillColor = new Color(entry.accent.r, entry.accent.g, entry.accent.b, 230);
        pill.roundRect(-82, -18, 164, 36, 18);
        pill.fill();

        this.addLabel(
            namePill,
            'Heart',
            '♥',
            17,
            new Color(248, 105, 157, 255),
            new Vec3(-65, 0),
            24,
            30,
            true,
        );
        this.addLabel(
            namePill,
            'CharacterName',
            entry.name,
            21,
            new Color(126, 70, 107, 255),
            new Vec3(-4, 0),
            108,
            32,
            true,
        );
        const bondLabel = this.addLabel(
            card,
            'Bond',
            `${getBond(this.progress, entry.id)}/6`,
            12,
            new Color(129, 91, 132, 210),
            new Vec3(74, -102),
            42,
            24,
            true,
        );
        this.bondLabels.set(entry.id, bondLabel);

        const selection = this.createUiNode('SelectedFrame', card);
        selection.getComponent(UITransform)?.setContentSize(214, 236);
        const outline = selection.addComponent(Graphics);
        outline.strokeColor = new Color(255, 91, 164, 255);
        outline.fillColor = new Color(255, 255, 255, 30);
        outline.lineWidth = 6;
        outline.roundRect(-107, -118, 214, 236, 27);
        outline.fill();
        outline.stroke();

        const unlocked = this.progress.unlockedCharacters.indexOf(entry.id) >= 0;
        if (!unlocked) {
            const lock = this.createUiNode('LockedOverlay', card);
            const lockGraphics = lock.addComponent(Graphics);
            lockGraphics.fillColor = new Color(67, 48, 78, 150);
            lockGraphics.roundRect(-102, -113, 204, 226, 24);
            lockGraphics.fill();
            this.addLabel(
                lock,
                'LockIcon',
                '锁',
                34,
                new Color(255, 245, 251, 235),
                new Vec3(0, 28),
                80,
                52,
                true,
            );
            this.addLabel(
                lock,
                'LockHint',
                '完成剧情解锁',
                17,
                new Color(255, 245, 251, 230),
                new Vec3(0, -25),
                170,
                32,
                true,
            );
        }

        this.cardNodes.set(entry.id, card);
        this.makeInteractive(card, () => {
            if (this.progress.unlockedCharacters.indexOf(entry.id) < 0) {
                this.showModal(
                    '尚未解锁',
                    `${entry.name}的档案仍处于锁定状态。\n\n完成对应剧情后，会自动加入心动图鉴。`,
                    entry.accent,
                );
                return;
            }
            this.selectedId = entry.id;
            this.updateCardSelection();
            this.showToast(`已选择：${entry.name}`);
        });
    }

    private createProgressCard(x: number, y: number): void {
        const card = this.createUiNode('CollectionProgress', this.characterLayer);
        card.setPosition(x, y);
        card.getComponent(UITransform)?.setContentSize(204, 226);
        const graphics = card.addComponent(Graphics);
        graphics.fillColor = new Color(255, 250, 253, 245);
        graphics.strokeColor = new Color(255, 255, 255, 235);
        graphics.lineWidth = 3;
        graphics.roundRect(-102, -113, 204, 226, 24);
        graphics.fill();
        graphics.stroke();

        this.addLabel(
            card,
            'ProgressTitle',
            '收集进度',
            23,
            new Color(139, 89, 137, 255),
            new Vec3(0, 76),
            160,
            38,
            true,
        );
        this.progressLabel = this.addLabel(
            card,
            'ProgressValue',
            `${this.progress.hearts}/6`,
            58,
            new Color(255, 126, 157, 255),
            new Vec3(0, 6),
            170,
            96,
            true,
        );
        this.addLabel(
            card,
            'ProgressHint',
            '继续探索解锁故事',
            15,
            new Color(152, 110, 146, 220),
            new Vec3(0, -67),
            170,
            30,
            true,
        );
        this.makeInteractive(card, () => this.showModal(
            '收集进度',
            `已收集 ${this.progress.hearts}/6 颗心。\n\n送出礼物或完成角色对话，可以继续解锁心动图鉴。`,
            new Color(255, 142, 181, 255),
        ));
    }

    private updateCardSelection(): void {
        this.cardNodes.forEach((node, id) => {
            const frame = node.getChildByName('SelectedFrame');
            if (frame) {
                frame.active = id === this.selectedId
                    && this.progress.unlockedCharacters.indexOf(id) >= 0;
            }
        });
    }

    private createActions(): void {
        this.createButton(
            'BackButton',
            '返回市集',
            new Vec3(-290, 590),
            128,
            56,
            new Color(190, 159, 240, 255),
            () => director.loadScene('Main'),
        );
        this.createButton(
            'SearchButton',
            '搜索',
            new Vec3(305, 590),
            96,
            56,
            new Color(211, 169, 239, 255),
            () => this.showModal(
                '线索搜索',
                '输入角色姓名或故事关键字。\n\n目前可以搜索：花笺、夜市、礼物、耳机。',
                new Color(200, 150, 241, 255),
            ),
        );

        const actionBar = this.createUiNode('GalleryActionBar', this.actionLayer);
        actionBar.setPosition(0, -568);
        actionBar.getComponent(UITransform)?.setContentSize(690, 150);
        const graphics = actionBar.addComponent(Graphics);
        graphics.fillColor = new Color(255, 246, 252, 190);
        graphics.strokeColor = new Color(255, 255, 255, 220);
        graphics.lineWidth = 4;
        graphics.roundRect(-345, -75, 690, 150, 45);
        graphics.fill();
        graphics.stroke();

        this.createButton(
            'DetailButton',
            '查看详情',
            new Vec3(-180, -568),
            260,
            100,
            new Color(250, 158, 194, 255),
            () => this.showSelectedCharacter(),
        );
        this.giftButton = this.createButton(
            'GiftButton',
            `送出礼物 ×${this.progress.gifts}`,
            new Vec3(185, -568),
            320,
            100,
            new Color(255, 177, 203, 255),
            () => this.sendGift(),
        );
    }

    private showSelectedCharacter(): void {
        const entry = CHARACTERS.find((item) => item.id === this.selectedId) ?? CHARACTERS[0];
        if (this.progress.unlockedCharacters.indexOf(entry.id) < 0) {
            this.showModal(
                '尚未解锁',
                `${entry.name}的档案仍处于锁定状态。\n\n完成对应剧情后即可查看。`,
                entry.accent,
            );
            return;
        }
        this.showModal(
            entry.name,
            `${entry.description}\n\n心动值：${getBond(this.progress, entry.id)}/6`,
            entry.accent,
        );
    }

    private sendGift(): void {
        const entry = CHARACTERS.find((item) => item.id === this.selectedId) ?? CHARACTERS[0];
        if (this.progress.unlockedCharacters.indexOf(entry.id) < 0) {
            this.showModal(
                '角色尚未解锁',
                `需要先完成${entry.name}的对应剧情，才能送出礼物。`,
                entry.accent,
            );
            return;
        }
        if (this.progress.gifts <= 0) {
            this.showModal(
                '礼物不足',
                '礼物已经用完。继续完成市集剧情可以获得新的礼物。',
                entry.accent,
            );
            return;
        }

        const nextBond = Math.min(6, getBond(this.progress, entry.id) + 1);
        this.progress = {
            ...this.progress,
            gifts: this.progress.gifts - 1,
            hearts: Math.min(6, this.progress.hearts + 1),
            bonds: {
                ...this.progress.bonds,
                [entry.id]: nextBond,
            },
        };
        saveProgress(this.progress);
        gameFeel.play('gift');
        this.updateProgressUi();
        this.showModal(
            '送出礼物',
            `已将樱花礼盒送给 ${entry.name}。\n\n心动值：${nextBond}/6\n`
                + `剩余礼物：${this.progress.gifts}\n收集进度：${this.progress.hearts}/6。`,
            entry.accent,
        );
    }

    private updateProgressUi(): void {
        if (this.progressLabel?.isValid) {
            this.progressLabel.string = `${this.progress.hearts}/6`;
        }
        this.bondLabels.forEach((label, id) => {
            if (label.isValid) {
                label.string = `${getBond(this.progress, id)}/6`;
            }
        });
        const giftLabel = this.giftButton
            ?.getChildByName('ButtonLabel')
            ?.getComponent(Label);
        if (giftLabel?.isValid) {
            giftLabel.string = `送出礼物 ×${this.progress.gifts}`;
        }
    }

    private createButton(
        name: string,
        text: string,
        position: Vec3,
        width: number,
        height: number,
        accent: Color,
        onTap: () => void,
    ): Node {
        const button = this.createUiNode(name, this.actionLayer);
        button.setPosition(position);
        button.getComponent(UITransform)?.setContentSize(width, height);
        const graphics = button.addComponent(Graphics);
        graphics.fillColor = new Color(255, 250, 253, 245);
        graphics.strokeColor = accent;
        graphics.lineWidth = 4;
        graphics.roundRect(-width / 2, -height / 2, width, height, height / 2);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(accent.r, accent.g, accent.b, 50);
        graphics.roundRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16, (height - 16) / 2);
        graphics.fill();
        this.addLabel(
            button,
            'ButtonLabel',
            text,
            27,
            new Color(108, 71, 113, 255),
            Vec3.ZERO,
            width - 30,
            height - 20,
            true,
        );
        this.makeInteractive(button, onTap);
        return button;
    }

    private showToast(text: string): void {
        if (this.toastNode?.isValid) {
            this.toastNode.destroy();
        }
        const toast = this.createUiNode('GalleryToast', this.feedbackLayer);
        toast.setPosition(0, 458);
        toast.getComponent(UITransform)?.setContentSize(410, 56);
        const graphics = toast.addComponent(Graphics);
        graphics.fillColor = new Color(255, 250, 253, 240);
        graphics.strokeColor = new Color(255, 145, 188, 220);
        graphics.lineWidth = 2;
        graphics.roundRect(-205, -28, 410, 56, 28);
        graphics.fill();
        graphics.stroke();
        this.addLabel(
            toast,
            'ToastLabel',
            text,
            24,
            new Color(111, 72, 106, 255),
            Vec3.ZERO,
            370,
            48,
            true,
        );
        const opacity = toast.addComponent(UIOpacity);
        tween(opacity)
            .delay(1.2)
            .to(0.25, { opacity: 0 })
            .call(() => {
                if (this.toastNode === toast) {
                    this.toastNode = null;
                }
                if (toast.isValid) {
                    toast.destroy();
                }
            })
            .start();
        this.toastNode = toast;
    }

    private showModal(title: string, message: string, accent: Color): void {
        if (this.modal?.isValid) {
            this.modal.destroy();
        }
        const modal = this.createUiNode('GalleryModal', this.modalLayer);
        const opacity = modal.addComponent(UIOpacity);
        opacity.opacity = 0;
        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(52, 32, 66, 155);
        shade.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        shade.fill();

        const panel = this.createUiNode('Panel', modal);
        panel.setPosition(0, 20);
        panel.getComponent(UITransform)?.setContentSize(620, 490);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(255, 247, 252, 250);
        graphics.strokeColor = accent;
        graphics.lineWidth = 5;
        graphics.roundRect(-310, -245, 620, 490, 36);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = accent;
        graphics.roundRect(-115, 162, 230, 62, 31);
        graphics.fill();

        this.addLabel(panel, 'Title', title, 32, Color.WHITE, new Vec3(0, 193), 420, 58, true);
        this.addLabel(
            panel,
            'Message',
            message,
            27,
            new Color(88, 57, 87, 255),
            new Vec3(0, 8),
            520,
            310,
            true,
        );
        this.addLabel(
            panel,
            'CloseHint',
            '轻触任意位置关闭',
            21,
            new Color(157, 116, 151, 255),
            new Vec3(0, -205),
            350,
            48,
            true,
        );
        modal.on(Node.EventType.TOUCH_END, () => {
            if (this.modal === modal) {
                this.modal = null;
            }
            modal.destroy();
        });
        this.modal = modal;
        tween(opacity).to(0.16, { opacity: 255 }).start();
        tween(panel)
            .set({ scale: new Vec3(0.92, 0.92, 1) })
            .to(0.2, { scale: Vec3.ONE }, { easing: 'backOut' })
            .start();
    }

    private loadSprite(sprite: Sprite, resourcePath: string): void {
        resources.load(resourcePath, SpriteFrame, (error, frame) => {
            if (error || !frame) {
                console.error(`[CharacterGallery] Failed to load ${resourcePath}`, error);
                gameFeel.showMissingImage(sprite.node, '角色图片缺失');
                return;
            }
            if (sprite.isValid) {
                sprite.spriteFrame = frame;
            }
        });
    }

    private makeInteractive(node: Node, onTap: () => void): void {
        node.on(Node.EventType.TOUCH_START, () => {
            tween(node).to(0.06, { scale: new Vec3(0.96, 0.96, 1) }).start();
        });
        const restore = (): void => {
            if (node.isValid) {
                tween(node).to(0.08, { scale: Vec3.ONE }).start();
            }
        };
        node.on(Node.EventType.TOUCH_CANCEL, restore);
        node.on(Node.EventType.TOUCH_END, () => {
            restore();
            gameFeel.play('click');
            onTap();
        });
    }

    private createUiNode(name: string, parent: Node): Node {
        const node = new Node(name);
        node.layer = parent.layer;
        parent.addChild(node);
        node.addComponent(UITransform).setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
        return node;
    }

    private addLabel(
        parent: Node,
        name: string,
        text: string,
        fontSize: number,
        color: Color,
        position: Vec3,
        width: number,
        height: number,
        centered = false,
    ): Label {
        const labelNode = this.createUiNode(name, parent);
        labelNode.setPosition(position);
        labelNode.getComponent(UITransform)?.setContentSize(width, height);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = Math.round(fontSize * 1.4);
        label.color = color;
        label.enableWrapText = true;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = centered
            ? HorizontalTextAlignment.CENTER
            : HorizontalTextAlignment.LEFT;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.outlineColor = new Color(255, 255, 255, 100);
        label.outlineWidth = 1;
        return label;
    }

    private lerpColor(from: Color, to: Color, ratio: number): Color {
        const clamped = Math.max(0, Math.min(1, ratio));
        return new Color(
            Math.round(from.r + (to.r - from.r) * clamped),
            Math.round(from.g + (to.g - from.g) * clamped),
            Math.round(from.b + (to.b - from.b) * clamped),
            255,
        );
    }
}
