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
const PANEL_X = 175;
const PANEL_Y = 80;

interface ZodiacChoice {
    name: string;
    symbol: string;
}

interface PersonalityChoice {
    name: string;
    description: string;
    symbol: string;
    color: Color;
}

const ZODIACS: ZodiacChoice[] = [
    { name: '白羊', symbol: '♈' },
    { name: '金牛', symbol: '♉' },
    { name: '双子', symbol: '♊' },
    { name: '巨蟹', symbol: '♋' },
    { name: '狮子', symbol: '♌' },
    { name: '处女', symbol: '♍' },
    { name: '天秤', symbol: '♎' },
    { name: '天蝎', symbol: '♏' },
    { name: '射手', symbol: '♐' },
    { name: '摩羯', symbol: '♑' },
    { name: '水瓶', symbol: '♒' },
    { name: '双鱼', symbol: '♓' },
];

const PERSONALITIES: PersonalityChoice[] = [
    {
        name: '温柔治愈',
        description: '善解人意',
        symbol: '✦',
        color: new Color(255, 176, 200, 230),
    },
    {
        name: '清冷傲娇',
        description: '嘴硬心软',
        symbol: '❄',
        color: new Color(220, 190, 247, 230),
    },
    {
        name: '活泼直球',
        description: '主动坦率',
        symbol: '☀',
        color: new Color(184, 220, 255, 230),
    },
    {
        name: '神秘内敛',
        description: '观察敏锐',
        symbol: '◇',
        color: new Color(255, 215, 186, 230),
    },
];

@ccclass('CharacterCustomization')
export class CharacterCustomization extends Component {
    private backgroundLayer!: Node;
    private characterLayer!: Node;
    private selectionLayer!: Node;
    private attributeLayer!: Node;
    private actionLayer!: Node;
    private feedbackLayer!: Node;
    private modalLayer!: Node;
    private selectedZodiac = '';
    private selectedPersonality = '';
    private activeModal: Node | null = null;
    private toastNode: Node | null = null;
    private zodiacOptions = new Map<string, Node>();
    private personalityOptions = new Map<string, Node>();

    protected start(): void {
        this.createLayers();
        this.createBackground();
        this.createCharacter();
        this.createSelectionPanel();
        this.createAttributes();
        this.createActions();
    }

    private createLayers(): void {
        this.backgroundLayer = this.createLayer('BackgroundLayer');
        this.characterLayer = this.createLayer('CharacterLayer');
        this.selectionLayer = this.createLayer('SelectionLayer');
        this.attributeLayer = this.createLayer('AttributeLayer');
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
        const gradientNode = this.createUiNode('TwilightGradient', this.backgroundLayer);
        const gradient = gradientNode.addComponent(Graphics);
        const bands = 40;
        const bandHeight = DESIGN_HEIGHT / bands;
        const top = new Color(207, 190, 245, 255);
        const middle = new Color(241, 207, 242, 255);
        const bottom = new Color(255, 223, 235, 255);
        for (let index = 0; index < bands; index += 1) {
            const ratio = index / (bands - 1);
            gradient.fillColor = ratio < 0.55
                ? this.lerpColor(top, middle, ratio / 0.55)
                : this.lerpColor(middle, bottom, (ratio - 0.55) / 0.45);
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
            'CustomizationTitle',
            '形 象 定 制',
            40,
            new Color(116, 80, 132, 245),
            new Vec3(-178, 565),
            330,
            70,
            true,
        );
        this.addLabel(
            this.backgroundLayer,
            'CustomizationSubtitle',
            '让故事从你的选择开始',
            20,
            new Color(143, 105, 151, 220),
            new Vec3(-178, 520),
            320,
            42,
            true,
        );
    }

    private drawSakuraFrame(): void {
        const decorations = this.createUiNode('SakuraDecorations', this.backgroundLayer);
        const graphics = decorations.addComponent(Graphics);
        graphics.strokeColor = new Color(142, 94, 137, 205);
        graphics.lineWidth = 10;
        graphics.moveTo(-375, 667);
        graphics.lineTo(-275, 560);
        graphics.lineTo(-170, 470);
        graphics.moveTo(375, 667);
        graphics.lineTo(290, 555);
        graphics.lineTo(205, 470);
        graphics.stroke();

        const flowerColors = [
            new Color(255, 175, 210, 230),
            new Color(250, 199, 224, 220),
            new Color(211, 184, 242, 210),
        ];
        for (let index = 0; index < 18; index += 1) {
            const leftSide = index % 2 === 0;
            const x = leftSide ? -295 + (index * 31) % 150 : 215 + (index * 29) % 160;
            const y = 620 - (index * 53) % 330;
            this.drawFlower(graphics, x, y, 8 + (index % 3) * 3, flowerColors[index % 3]);
        }

        graphics.fillColor = new Color(255, 247, 252, 86);
        graphics.circle(-296, 535, 110);
        graphics.circle(335, 525, 130);
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
        graphics.fillColor = new Color(255, 233, 164, 245);
        graphics.circle(x, y, radius * 0.48);
        graphics.fill();
    }

    private createCharacter(): void {
        const pedestal = this.createUiNode('CharacterPedestal', this.characterLayer);
        pedestal.setPosition(-190, -300);
        const pedestalGraphics = pedestal.addComponent(Graphics);
        pedestalGraphics.fillColor = new Color(255, 232, 244, 180);
        pedestalGraphics.ellipse(0, 0, 310, 82);
        pedestalGraphics.fill();
        pedestalGraphics.strokeColor = new Color(255, 255, 255, 220);
        pedestalGraphics.lineWidth = 4;
        pedestalGraphics.ellipse(0, 0, 260, 62);
        pedestalGraphics.stroke();

        const character = this.createUiNode('CharacterPreview', this.characterLayer);
        character.setPosition(-190, -30);
        character.getComponent(UITransform)?.setContentSize(310, 620);
        const sprite = character.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this.loadSprite(sprite, 'scene/layers/pink-girl/spriteFrame');
        this.makeInteractive(character, () => this.showModal(
            '角色预览',
            '粉衣女孩正在等待新的形象设定。\n\n选择星座和性格，让她带着专属于你的故事进入樱花之城。',
            new Color(255, 133, 185, 255),
        ));

        this.addLabel(
            this.characterLayer,
            'PreviewHint',
            '轻触角色查看预览',
            18,
            new Color(137, 94, 143, 210),
            new Vec3(-190, -382),
            260,
            36,
            true,
        );
    }

    private createSelectionPanel(): void {
        const panel = this.createUiNode('CustomizationPanel', this.selectionLayer);
        panel.setPosition(PANEL_X, PANEL_Y);
        panel.getComponent(UITransform)?.setContentSize(400, 1010);
        const panelGraphics = panel.addComponent(Graphics);
        panelGraphics.fillColor = new Color(255, 250, 253, 225);
        panelGraphics.strokeColor = new Color(238, 190, 231, 230);
        panelGraphics.lineWidth = 3;
        panelGraphics.roundRect(-200, -505, 400, 1010, 32);
        panelGraphics.fill();
        panelGraphics.stroke();

        this.addLabel(
            panel,
            'ZodiacHeading',
            '选择星座',
            29,
            new Color(126, 82, 137, 255),
            new Vec3(0, 445),
            300,
            54,
            true,
        );
        this.addLabel(
            panel,
            'PersonalityHeading',
            '选择性格',
            27,
            new Color(126, 82, 137, 255),
            new Vec3(0, 68),
            300,
            48,
            true,
        );
        this.addLabel(
            panel,
            'AttributeHeading',
            '初始属性',
            27,
            new Color(126, 82, 137, 255),
            new Vec3(0, -98),
            300,
            48,
            true,
        );

        const columnX = [-128, -43, 42, 127];
        const rowY = [300, 215, 130];
        ZODIACS.forEach((choice, index) => {
            this.createZodiacOption(
                choice,
                PANEL_X + columnX[index % 4],
                PANEL_Y + rowY[Math.floor(index / 4)],
            );
        });

        PERSONALITIES.forEach((choice, index) => {
            this.createPersonalityOption(
                choice,
                PANEL_X + columnX[index],
                PANEL_Y - 36,
            );
        });
    }

    private createZodiacOption(choice: ZodiacChoice, x: number, y: number): void {
        const option = this.createUiNode(`Zodiac_${choice.name}`, this.selectionLayer);
        option.setPosition(x, y);
        option.getComponent(UITransform)?.setContentSize(78, 78);

        const graphics = option.addComponent(Graphics);
        graphics.fillColor = new Color(255, 236, 246, 245);
        graphics.strokeColor = new Color(235, 184, 220, 210);
        graphics.lineWidth = 2;
        graphics.circle(0, 11, 27);
        graphics.fill();
        graphics.stroke();

        this.addLabel(
            option,
            'Symbol',
            choice.symbol,
            27,
            new Color(139, 91, 150, 255),
            new Vec3(0, 11),
            58,
            52,
            true,
        );
        this.addLabel(
            option,
            'Name',
            choice.name,
            16,
            new Color(112, 78, 119, 255),
            new Vec3(0, -29),
            72,
            28,
            true,
        );

        const selection = this.createSelectionRing(option, 34, 'circle');
        selection.active = false;
        this.zodiacOptions.set(choice.name, option);
        this.makeInteractive(option, () => {
            this.selectedZodiac = choice.name;
            this.zodiacOptions.forEach((node, key) => {
                const ring = node.getChildByName('SelectedRing');
                if (ring) {
                    ring.active = key === choice.name;
                }
            });
            this.showToast(`星座已选择：${choice.name}`);
        });
    }

    private createPersonalityOption(choice: PersonalityChoice, x: number, y: number): void {
        const option = this.createUiNode(`Personality_${choice.name}`, this.selectionLayer);
        option.setPosition(x, y);
        option.getComponent(UITransform)?.setContentSize(78, 108);

        const graphics = option.addComponent(Graphics);
        graphics.fillColor = choice.color;
        graphics.strokeColor = new Color(255, 255, 255, 210);
        graphics.lineWidth = 2;
        graphics.roundRect(-39, -54, 78, 108, 16);
        graphics.fill();
        graphics.stroke();

        this.addLabel(
            option,
            'Symbol',
            choice.symbol,
            25,
            new Color(117, 79, 124, 255),
            new Vec3(0, 26),
            54,
            36,
            true,
        );
        this.addLabel(
            option,
            'Name',
            choice.name,
            15,
            new Color(102, 69, 111, 255),
            new Vec3(0, -9),
            70,
            28,
            true,
        );
        this.addLabel(
            option,
            'Description',
            choice.description,
            11,
            new Color(129, 86, 128, 230),
            new Vec3(0, -34),
            70,
            24,
            true,
        );

        const selection = this.createSelectionRing(option, 39, 'card');
        selection.active = false;
        this.personalityOptions.set(choice.name, option);
        this.makeInteractive(option, () => {
            this.selectedPersonality = choice.name;
            this.personalityOptions.forEach((node, key) => {
                const ring = node.getChildByName('SelectedRing');
                if (ring) {
                    ring.active = key === choice.name;
                }
            });
            this.showToast(`性格已选择：${choice.name}`);
        });
    }

    private createSelectionRing(parent: Node, radius: number, shape: 'circle' | 'card'): Node {
        const ring = this.createUiNode('SelectedRing', parent);
        ring.getComponent(UITransform)?.setContentSize(radius * 2 + 12, radius * 2 + 12);
        const graphics = ring.addComponent(Graphics);
        graphics.strokeColor = new Color(255, 103, 175, 255);
        graphics.fillColor = new Color(255, 255, 255, 32);
        graphics.lineWidth = 5;
        if (shape === 'circle') {
            graphics.circle(0, 11, radius);
            graphics.fill();
            graphics.stroke();
        } else {
            graphics.roundRect(-radius, -54, radius * 2, 108, 18);
            graphics.fill();
            graphics.stroke();
        }
        return ring;
    }

    private createAttributes(): void {
        this.createAttributeBar('Wisdom', '才智', 4, -150, new Color(250, 145, 178, 255));
        this.createAttributeBar('Beauty', '美貌', 3, -192, new Color(231, 160, 220, 255));
        this.createAttributeBar('Emotion', '情商', 4, -234, new Color(252, 163, 187, 255));
        this.createAttributeBar('Insight', '洞察力', 4, -276, new Color(172, 168, 239, 255));
    }

    private createAttributeBar(
        name: string,
        title: string,
        value: number,
        localY: number,
        color: Color,
    ): void {
        const bar = this.createUiNode(name, this.attributeLayer);
        bar.setPosition(PANEL_X, PANEL_Y + localY);
        bar.getComponent(UITransform)?.setContentSize(350, 34);
        const graphics = bar.addComponent(Graphics);
        graphics.fillColor = new Color(252, 231, 243, 230);
        graphics.roundRect(-175, -17, 350, 34, 17);
        graphics.fill();
        graphics.fillColor = color;
        graphics.roundRect(-175, -17, 350 * (value / 5), 34, 17);
        graphics.fill();

        this.addLabel(
            bar,
            'AttributeName',
            `${title}  ${value}`,
            20,
            new Color(99, 68, 104, 255),
            Vec3.ZERO,
            310,
            32,
            true,
        );
        this.makeInteractive(bar, () => this.showModal(
            `${title} ${value}`,
            `影响角色成长与剧情判定。\n\n当前${title}为 ${value}/5，选择不同星座和性格可以获得不同组合。`,
            color,
        ));
    }

    private createActions(): void {
        this.createButton(
            'DialogueButton',
            '对话',
            new Vec3(-215, -585),
            245,
            104,
            new Color(255, 149, 192, 255),
            () => this.showModal(
                '初次对话',
                '女孩：你觉得我该选哪个星座？\n\n你：选一个最像你的吧。\n\n女孩：那就等我们一起决定。',
                new Color(255, 151, 187, 255),
            ),
        );
        this.createButton(
            'ConfirmButton',
            '确认，进入樱花之城',
            new Vec3(155, -585),
            390,
            104,
            new Color(190, 153, 255, 255),
            () => this.confirmAndEnterMarket(),
        );
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
        graphics.fillColor = new Color(accent.r, accent.g, accent.b, 46);
        graphics.roundRect(-width / 2 + 10, -height / 2 + 10, width - 20, height - 20, (height - 20) / 2);
        graphics.fill();

        this.addLabel(
            button,
            'ButtonLabel',
            text,
            29,
            new Color(105, 69, 113, 255),
            Vec3.ZERO,
            width - 34,
            height - 22,
            true,
        );
        this.makeInteractive(button, onTap);
        return button;
    }

    private showToast(text: string): void {
        if (this.toastNode?.isValid) {
            this.toastNode.destroy();
        }

        const toast = this.createUiNode('SelectionToast', this.feedbackLayer);
        toast.setPosition(0, 445);
        toast.getComponent(UITransform)?.setContentSize(430, 60);
        const graphics = toast.addComponent(Graphics);
        graphics.fillColor = new Color(255, 250, 253, 240);
        graphics.strokeColor = new Color(255, 151, 194, 220);
        graphics.lineWidth = 2;
        graphics.roundRect(-215, -30, 430, 60, 30);
        graphics.fill();
        graphics.stroke();
        this.addLabel(
            toast,
            'ToastLabel',
            text,
            25,
            new Color(111, 72, 106, 255),
            Vec3.ZERO,
            390,
            52,
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

    private confirmAndEnterMarket(): void {
        sys.localStorage.setItem('loverman.zodiac', this.selectedZodiac || '未选择');
        sys.localStorage.setItem('loverman.personality', this.selectedPersonality || '未选择');
        director.loadScene('Main');
    }

    private showModal(title: string, message: string, accent: Color): void {
        if (this.activeModal?.isValid) {
            this.activeModal.destroy();
        }

        const modal = this.createUiNode('CustomizationModal', this.modalLayer);
        const opacity = modal.addComponent(UIOpacity);
        opacity.opacity = 0;
        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(53, 34, 68, 150);
        shade.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        shade.fill();

        const panel = this.createUiNode('Panel', modal);
        panel.setPosition(0, 28);
        panel.getComponent(UITransform)?.setContentSize(620, 490);
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
            true,
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

    private loadSprite(sprite: Sprite, resourcePath: string): void {
        resources.load(resourcePath, SpriteFrame, (error, frame) => {
            if (error || !frame) {
                console.error(`[CharacterCustomization] Failed to load ${resourcePath}`, error);
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

        label.outlineColor = new Color(255, 255, 255, 112);
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
