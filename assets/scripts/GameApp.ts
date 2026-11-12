import {
    _decorator,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    LabelOutline,
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

const { ccclass } = _decorator;

const DESIGN_WIDTH = 750;
const DESIGN_HEIGHT = 1334;

@ccclass('GameApp')
export class GameApp extends Component {
    private modal: Node | null = null;

    protected start(): void {
        this.createBackground();
        this.createHotspots();
    }

    private createBackground(): void {
        const background = new Node('SakuraMarketBackground');
        background.layer = this.node.layer;
        this.node.addChild(background);
        background.setSiblingIndex(0);

        const transform = background.addComponent(UITransform);
        transform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);

        const sprite = background.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        resources.load('scene/sakura-market/spriteFrame', SpriteFrame, (error, frame) => {
            if (error || !frame) {
                console.error('[GameApp] Failed to load sakura market background', error);
                this.createFallbackBackground(background);
                return;
            }
            sprite.spriteFrame = frame;
            transform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
        });
    }

    private createFallbackBackground(parent: Node): void {
        const graphics = parent.addComponent(Graphics);
        graphics.fillColor = new Color(244, 190, 218, 255);
        graphics.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        graphics.fill();

        this.addLabel(
            parent,
            'BackgroundMissing',
            '樱花市集\n场景图片加载失败',
            38,
            new Color(104, 51, 92, 255),
            Vec3.ZERO,
            650,
            160,
        );
    }

    private createHotspots(): void {
        const layer = new Node('InteractiveLayer');
        layer.layer = this.node.layer;
        this.node.addChild(layer);
        layer.addComponent(UITransform).setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);

        this.addHotspot(
            layer,
            'LeftCharacter',
            -184,
            -156,
            272,
            500,
            () => this.showModal(
                '人物观察',
                '粉衣女孩正站在樱花集市入口。\n\n她似乎正在寻找与“樱花甜品”有关的线索。',
                new Color(255, 147, 190, 255),
            ),
        );

        this.addHotspot(
            layer,
            'SakuraClue',
            -160,
            62,
            438,
            205,
            () => this.showModal(
                '收集线索',
                '他喜欢樱花甜品，\n今天在市集散步。\n\n已加入线索簿。',
                new Color(255, 142, 194, 255),
            ),
        );

        this.addHotspot(
            layer,
            'InformationExpert',
            229,
            84,
            230,
            118,
            () => this.showModal(
                '信息达人',
                '市集里的摊主知道很多消息。\n\n试着观察甜品摊，或与街上的角色交谈。',
                new Color(185, 137, 255, 255),
            ),
        );

        this.addHotspot(
            layer,
            'SilverHairCharacter',
            142,
            -64,
            190,
            520,
            () => this.showModal(
                '银发少年',
                '他站在甜品摊旁，像是在等待某个人。\n\n“今天的花，比平时更热闹。”',
                new Color(162, 190, 255, 255),
            ),
        );

        this.addHotspot(
            layer,
            'ClueCard',
            112,
            -286,
            390,
            170,
            () => this.showModal(
                '线索详情',
                '收集线索\n\n他喜欢樱花甜品，今天在市集散步。\n或许可以先去甜品摊看看。',
                new Color(255, 143, 195, 255),
            ),
        );

        this.addHotspot(
            layer,
            'TalkButton',
            -218,
            -588,
            300,
            140,
            () => this.showModal(
                '对话',
                '你：今天市集很热闹。\n\n银发少年：是啊，樱花甜品也快卖完了。',
                new Color(255, 158, 194, 255),
            ),
        );

        this.addHotspot(
            layer,
            'ViewInfoButton',
            210,
            -588,
            330,
            140,
            () => this.showModal(
                '人物信息',
                '姓名：???\n位置：樱花甜品摊\n喜好：樱花甜品\n\n继续收集线索，解锁更多资料。',
                new Color(183, 148, 255, 255),
            ),
        );

        this.addToast(layer, '轻触角色或气泡探索市集');
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
            tween(hotspot)
                .to(0.06, { scale: new Vec3(0.98, 0.98, 1) })
                .start();
        });

        const restoreScale = (): void => {
            tween(hotspot)
                .to(0.08, { scale: Vec3.ONE })
                .start();
        };

        hotspot.on(Node.EventType.TOUCH_CANCEL, restoreScale);
        hotspot.on(Node.EventType.TOUCH_END, () => {
            restoreScale();
            onTap();
        });

        return hotspot;
    }

    private showModal(title: string, message: string, accent: Color): void {
        if (this.modal?.isValid) {
            this.modal.destroy();
        }

        const modal = new Node('InfoModal');
        modal.layer = this.node.layer;
        this.node.addChild(modal);
        modal.setSiblingIndex(this.node.children.length - 1);
        modal.addComponent(UITransform).setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);

        const opacity = modal.addComponent(UIOpacity);
        opacity.opacity = 0;

        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(48, 25, 55, 120);
        shade.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        shade.fill();

        const panel = new Node('Panel');
        panel.layer = this.node.layer;
        modal.addChild(panel);
        panel.setPosition(0, 24);
        panel.addComponent(UITransform).setContentSize(620, 500);

        const panelGraphics = panel.addComponent(Graphics);
        panelGraphics.fillColor = new Color(255, 246, 252, 248);
        panelGraphics.strokeColor = accent;
        panelGraphics.lineWidth = 5;
        panelGraphics.roundRect(-310, -250, 620, 500, 36);
        panelGraphics.fill();
        panelGraphics.stroke();

        panelGraphics.fillColor = accent;
        panelGraphics.roundRect(-112, 172, 224, 62, 31);
        panelGraphics.fill();

        this.addLabel(
            panel,
            'Title',
            title,
            34,
            Color.WHITE,
            new Vec3(0, 203),
            420,
            60,
            true,
        );

        this.addLabel(
            panel,
            'Message',
            message,
            30,
            new Color(88, 57, 87, 255),
            new Vec3(0, 12),
            520,
            320,
        );

        this.addLabel(
            panel,
            'CloseHint',
            '轻触任意位置关闭',
            22,
            new Color(157, 116, 151, 255),
            new Vec3(0, -208),
            360,
            50,
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

    private addToast(parent: Node, text: string): void {
        const toast = new Node('SceneHint');
        toast.layer = parent.layer;
        parent.addChild(toast);
        toast.setPosition(0, 500);
        toast.addComponent(UITransform).setContentSize(520, 64);

        const graphics = toast.addComponent(Graphics);
        graphics.fillColor = new Color(255, 247, 252, 210);
        graphics.roundRect(-260, -32, 520, 64, 32);
        graphics.fill();

        this.addLabel(
            toast,
            'HintLabel',
            text,
            24,
            new Color(113, 77, 106, 255),
            Vec3.ZERO,
            480,
            58,
            true,
        );

        const opacity = toast.addComponent(UIOpacity);
        tween(opacity)
            .delay(3)
            .to(0.4, { opacity: 0 })
            .call(() => toast.destroy())
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
        outline.color = new Color(255, 255, 255, 110);
        outline.width = 1;

        return label;
    }
}
