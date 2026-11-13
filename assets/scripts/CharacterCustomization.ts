import {
    _decorator,
    Color,
    Component,
    director,
    Graphics,
    HorizontalTextAlignment,
    Label,
    LabelOutline,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    sys,
    tween,
    UITransform,
    UIOpacity,
    Vec3,
    VerticalTextAlignment,
} from 'cc';

const { ccclass } = _decorator;

const DESIGN_WIDTH = 750;
const DESIGN_HEIGHT = 1334;

interface Choice {
    name: string;
    x: number;
    y: number;
}

const ZODIACS: Choice[] = [
    { name: '白羊', x: 79, y: 304 },
    { name: '金牛', x: 168, y: 304 },
    { name: '双子', x: 256, y: 304 },
    { name: '巨蟹', x: 345, y: 304 },
    { name: '狮子', x: 79, y: 151 },
    { name: '处女', x: 168, y: 151 },
    { name: '天秤', x: 256, y: 151 },
    { name: '天蝎', x: 345, y: 151 },
    { name: '射手', x: 79, y: 78 },
    { name: '摩羯', x: 168, y: 78 },
    { name: '水瓶', x: 256, y: 78 },
    { name: '双鱼', x: 345, y: 78 },
];

const PERSONALITIES: Choice[] = [
    { name: '温柔治愈', x: 79, y: -73 },
    { name: '清冷傲娇', x: 168, y: -73 },
    { name: '活泼直球', x: 256, y: -73 },
    { name: '神秘内敛', x: 345, y: -73 },
];

@ccclass('CharacterCustomization')
export class CharacterCustomization extends Component {
    private selection: Graphics | null = null;
    private selectedZodiac = '';
    private selectedPersonality = '';
    private activeModal: Node | null = null;
    private toastNode: Node | null = null;

    protected start(): void {
        this.createBackground();
        this.createInteractions();
    }

    private createBackground(): void {
        const background = new Node('CharacterCustomizationBackground');
        background.layer = this.node.layer;
        this.node.addChild(background);
        background.setSiblingIndex(0);
        background.addComponent(UITransform).setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);

        const sprite = background.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        resources.load('scene/character-customization/spriteFrame', SpriteFrame, (error, frame) => {
            if (error || !frame) {
                console.error('[CharacterCustomization] Failed to load background', error);
                this.createFallbackBackground(background);
                return;
            }
            sprite.spriteFrame = frame;
        });
    }

    private createFallbackBackground(parent: Node): void {
        const graphics = parent.addComponent(Graphics);
        graphics.fillColor = new Color(228, 198, 241, 255);
        graphics.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        graphics.fill();
    }

    private createInteractions(): void {
        const layer = new Node('CustomizationInteractions');
        layer.layer = this.node.layer;
        this.node.addChild(layer);
        layer.addComponent(UITransform).setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);

        const selectionNode = new Node('SelectionHighlight');
        selectionNode.layer = this.node.layer;
        layer.addChild(selectionNode);
        selectionNode.addComponent(UITransform).setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
        this.selection = selectionNode.addComponent(Graphics);

        for (const zodiac of ZODIACS) {
            this.addHotspot(layer, `Zodiac_${zodiac.name}`, zodiac.x, zodiac.y, 96, 100, () => {
                this.selectedZodiac = zodiac.name;
                this.drawZodiacSelection(zodiac);
                this.showToast(`星座已选择：${zodiac.name}`);
            });
        }

        for (const personality of PERSONALITIES) {
            this.addHotspot(
                layer,
                `Personality_${personality.name}`,
                personality.x,
                personality.y,
                102,
                132,
                () => {
                    this.selectedPersonality = personality.name;
                    this.drawPersonalitySelection(personality);
                    this.showToast(`性格已选择：${personality.name}`);
                },
            );
        }

        this.addHotspot(layer, 'CharacterPreview', -178, 75, 390, 940, () => {
            this.showModal(
                '角色预览',
                '粉衣女孩正在等待新的形象设定。\n\n选择星座和性格，让她带着专属于你的故事进入樱花之城。',
                new Color(255, 133, 185, 255),
            );
        });

        this.addHotspot(layer, 'Wisdom', 120, -205, 390, 62, () => {
            this.showModal('才智 4', '影响解谜、观察和推理类选项。\n\n较高的才智更容易发现场景中的隐藏信息。', new Color(246, 142, 174, 255));
        });

        this.addHotspot(layer, 'Beauty', 120, -242, 390, 58, () => {
            this.showModal('美貌 3', '影响角色对你的第一印象。\n\n部分角色会更愿意分享自己的故事。', new Color(212, 151, 232, 255));
        });

        this.addHotspot(layer, 'Emotion', 120, -278, 390, 58, () => {
            this.showModal('情商 4', '影响对话、安慰和理解他人情绪的能力。\n\n有助于解锁更温柔的回答。', new Color(248, 156, 190, 255));
        });

        this.addHotspot(layer, 'Insight', 120, -314, 390, 58, () => {
            this.showModal('洞察力 4', '影响对线索和人物关系变化的判断。\n\n可以提前察觉隐藏剧情。', new Color(161, 165, 236, 255));
        });

        this.addHotspot(layer, 'DialogueButton', -270, -510, 260, 140, () => {
            this.showModal(
                '初次对话',
                '女孩：你觉得我该选哪个星座？\n\n你：选一个最像你的吧。\n\n女孩：那就等我们一起决定。',
                new Color(255, 151, 187, 255),
            );
        });

        this.addHotspot(layer, 'ConfirmButton', 143, -518, 500, 140, () => {
            this.confirmAndEnterMarket();
        });
    }

    private drawZodiacSelection(choice: Choice): void {
        if (!this.selection) {
            return;
        }
        this.selection.clear();
        this.selection.lineWidth = 6;
        this.selection.strokeColor = new Color(255, 112, 177, 255);
        this.selection.fillColor = new Color(255, 255, 255, 45);
        this.selection.circle(choice.x, choice.y + 8, 45);
        this.selection.fill();
        this.selection.stroke();
    }

    private drawPersonalitySelection(choice: Choice): void {
        if (!this.selection) {
            return;
        }
        this.selection.clear();
        this.selection.lineWidth = 5;
        this.selection.strokeColor = new Color(255, 114, 179, 255);
        this.selection.fillColor = new Color(255, 255, 255, 35);
        this.selection.roundRect(choice.x - 58, choice.y - 68, 116, 136, 18);
        this.selection.fill();
        this.selection.stroke();
    }

    private showToast(text: string): void {
        this.toastNode?.destroy();

        const toast = new Node('SelectionToast');
        toast.layer = this.node.layer;
        this.node.addChild(toast);
        toast.setPosition(0, 404);
        toast.addComponent(UITransform).setContentSize(440, 62);

        const graphics = toast.addComponent(Graphics);
        graphics.fillColor = new Color(255, 250, 253, 235);
        graphics.strokeColor = new Color(255, 151, 194, 220);
        graphics.lineWidth = 2;
        graphics.roundRect(-220, -31, 440, 62, 31);
        graphics.fill();
        graphics.stroke();

        this.addLabel(
            toast,
            'ToastLabel',
            text,
            26,
            new Color(111, 72, 106, 255),
            Vec3.ZERO,
            400,
            54,
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
                toast.destroy();
            })
            .start();

        this.toastNode = toast;
    }

    private confirmAndEnterMarket(): void {
        sys.localStorage.setItem('loverman.zodiac', this.selectedZodiac || '未选择');
        sys.localStorage.setItem('loverman.personality', this.selectedPersonality || '未选择');
        director.loadScene('Main');
    }

    private addHotspot(
        parent: Node,
        name: string,
        x: number,
        y: number,
        width: number,
        height: number,
        onTap: () => void,
    ): Node {
        const hotspot = new Node(name);
        hotspot.layer = parent.layer;
        parent.addChild(hotspot);
        hotspot.setPosition(x, y);
        hotspot.addComponent(UITransform).setContentSize(width, height);

        hotspot.on(Node.EventType.TOUCH_START, () => {
            tween(hotspot).to(0.06, { scale: new Vec3(0.98, 0.98, 1) }).start();
        });

        const restoreScale = (): void => {
            tween(hotspot).to(0.08, { scale: Vec3.ONE }).start();
        };

        hotspot.on(Node.EventType.TOUCH_CANCEL, restoreScale);
        hotspot.on(Node.EventType.TOUCH_END, () => {
            restoreScale();
            onTap();
        });

        return hotspot;
    }

    private showModal(title: string, message: string, accent: Color): void {
        if (this.activeModal?.isValid) {
            this.activeModal.destroy();
        }

        const modal = new Node('CustomizationModal');
        modal.layer = this.node.layer;
        this.node.addChild(modal);
        modal.setSiblingIndex(this.node.children.length - 1);
        modal.addComponent(UITransform).setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);

        const opacity = modal.addComponent(UIOpacity);
        opacity.opacity = 0;

        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(53, 34, 68, 125);
        shade.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        shade.fill();

        const panel = new Node('Panel');
        panel.layer = this.node.layer;
        modal.addChild(panel);
        panel.setPosition(0, 28);
        panel.addComponent(UITransform).setContentSize(620, 490);

        const panelGraphics = panel.addComponent(Graphics);
        panelGraphics.fillColor = new Color(255, 247, 252, 250);
        panelGraphics.strokeColor = accent;
        panelGraphics.lineWidth = 5;
        panelGraphics.roundRect(-310, -245, 620, 490, 36);
        panelGraphics.fill();
        panelGraphics.stroke();

        panelGraphics.fillColor = accent;
        panelGraphics.roundRect(-126, 168, 252, 62, 31);
        panelGraphics.fill();

        this.addLabel(panel, 'Title', title, 33, Color.WHITE, new Vec3(0, 199), 460, 60, true);
        this.addLabel(
            panel,
            'Message',
            message,
            29,
            new Color(87, 56, 88, 255),
            new Vec3(0, 12),
            520,
            320,
        );
        this.addLabel(
            panel,
            'CloseHint',
            '轻触任意位置关闭',
            22,
            new Color(158, 116, 153, 255),
            new Vec3(0, -204),
            360,
            50,
            true,
        );

        modal.on(Node.EventType.TOUCH_END, () => {
            if (this.activeModal === modal) {
                this.activeModal = null;
            }
            modal.destroy();
        });

        this.activeModal = modal;
        tween(opacity).to(0.16, { opacity: 255 }).start();
        tween(panel)
            .set({ scale: new Vec3(0.92, 0.92, 1) })
            .to(0.2, { scale: Vec3.ONE }, { easing: 'backOut' })
            .start();
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
        const labelNode = new Node(name);
        labelNode.layer = parent.layer;
        parent.addChild(labelNode);
        labelNode.setPosition(position);
        labelNode.addComponent(UITransform).setContentSize(width, height);

        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = Math.round(fontSize * 1.55);
        label.color = color;
        label.enableWrapText = true;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = centered
            ? HorizontalTextAlignment.CENTER
            : HorizontalTextAlignment.LEFT;
        label.verticalAlign = VerticalTextAlignment.CENTER;

        const outline = labelNode.addComponent(LabelOutline);
        outline.color = new Color(255, 255, 255, 105);
        outline.width = 1;

        return label;
    }
}
