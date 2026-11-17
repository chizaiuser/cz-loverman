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
    applyChoice,
    getBond,
    loadProgress,
    meetsRequirement,
    PlayerProgress,
    saveProgress,
    statLabel,
} from './GameProgress';
import { StoryChoice, SWEET_SHOP_CHAPTER } from './StoryData';

const { ccclass } = _decorator;

const DESIGN_WIDTH = 750;
const DESIGN_HEIGHT = 1334;

@ccclass('GameApp')
export class GameApp extends Component {
    private backgroundLayer!: Node;
    private characterLayer!: Node;
    private storyLayer!: Node;
    private actionLayer!: Node;
    private modalLayer!: Node;
    private feedbackLayer!: Node;
    private modal: Node | null = null;
    private choiceModal: Node | null = null;
    private toastNode: Node | null = null;
    private progress!: PlayerProgress;
    private objectiveLabel: Label | null = null;
    private clueBubble: Node | null = null;
    private clueCard: Node | null = null;

    protected start(): void {
        this.progress = loadProgress();
        this.createLayers();
        this.createBackground();
        this.createCharacters();
        this.createStoryUi();
        this.createActions();
        this.showSceneHint();
        this.updateStoryUi();
    }

    private createLayers(): void {
        this.backgroundLayer = this.createLayer('BackgroundLayer');
        this.characterLayer = this.createLayer('CharacterLayer');
        this.storyLayer = this.createLayer('StoryUiLayer');
        this.actionLayer = this.createLayer('ActionLayer');
        this.modalLayer = this.createLayer('ModalLayer');
        this.feedbackLayer = this.createLayer('FeedbackLayer');
    }

    private createLayer(name: string): Node {
        const node = new Node(name);
        node.layer = this.node.layer;
        this.node.addChild(node);
        node.addComponent(UITransform).setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
        return node;
    }

    private createBackground(): void {
        const gradient = this.createUiNode('SakuraSkyGradient', this.backgroundLayer);
        const sky = gradient.addComponent(Graphics);
        const bands = 40;
        const bandHeight = DESIGN_HEIGHT / bands;
        const top = new Color(226, 202, 242, 255);
        const middle = new Color(250, 219, 240, 255);
        const bottom = new Color(255, 220, 228, 255);

        for (let index = 0; index < bands; index += 1) {
            const ratio = index / (bands - 1);
            sky.fillColor = ratio < 0.55
                ? this.lerpColor(top, middle, ratio / 0.55)
                : this.lerpColor(middle, bottom, (ratio - 0.55) / 0.45);
            sky.rect(
                -DESIGN_WIDTH / 2,
                DESIGN_HEIGHT / 2 - (index + 1) * bandHeight,
                DESIGN_WIDTH,
                bandHeight + 1,
            );
            sky.fill();
        }

        const canopy = this.createUiNode('SakuraCanopy', this.backgroundLayer);
        canopy.setPosition(0, 337);
        canopy.getComponent(UITransform)?.setContentSize(DESIGN_WIDTH, 700);
        const canopySprite = canopy.addComponent(Sprite);
        canopySprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this.loadSprite(canopySprite, 'scene/layers/market-canopy/spriteFrame');

        this.drawMarketGround();
        this.addLabel(
            this.backgroundLayer,
            'SceneTitle',
            '樱 花 市 集',
            36,
            new Color(111, 74, 118, 235),
            new Vec3(0, 568),
            420,
            70,
            true,
        );
    }

    private drawMarketGround(): void {
        const ground = this.createUiNode('MarketGround', this.backgroundLayer);
        const graphics = ground.addComponent(Graphics);

        graphics.fillColor = new Color(255, 222, 234, 245);
        graphics.moveTo(-58, 245);
        graphics.lineTo(58, 245);
        graphics.lineTo(330, -DESIGN_HEIGHT / 2);
        graphics.lineTo(-330, -DESIGN_HEIGHT / 2);
        graphics.close();
        graphics.fill();

        graphics.strokeColor = new Color(255, 246, 249, 210);
        graphics.lineWidth = 3;
        graphics.moveTo(-70, 205);
        graphics.lineTo(-292, -DESIGN_HEIGHT / 2);
        graphics.moveTo(70, 205);
        graphics.lineTo(292, -DESIGN_HEIGHT / 2);
        graphics.stroke();

        graphics.strokeColor = new Color(232, 174, 204, 150);
        graphics.lineWidth = 2;
        for (let row = 0; row < 8; row += 1) {
            const y = 150 - row * 92;
            const halfWidth = 78 + row * 29;
            graphics.moveTo(-halfWidth, y);
            graphics.lineTo(halfWidth, y);
        }
        graphics.stroke();

        graphics.fillColor = new Color(255, 183, 215, 230);
        graphics.roundRect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, 245, 300, 48);
        graphics.roundRect(130, -DESIGN_HEIGHT / 2, 245, 300, 48);
        graphics.fill();

        const crystal = new Color(191, 157, 255, 220);
        graphics.fillColor = crystal;
        this.drawCrystal(graphics, -298, -445, 36, 120);
        this.drawCrystal(graphics, 305, -455, 44, 142);

        graphics.fillColor = new Color(255, 247, 251, 210);
        for (let index = 0; index < 14; index += 1) {
            const x = -325 + (index * 47) % 650;
            const y = -120 - (index % 5) * 79;
            graphics.circle(x, y, 3 + (index % 2));
            graphics.fill();
        }
    }

    private drawCrystal(
        graphics: Graphics,
        x: number,
        y: number,
        width: number,
        height: number,
    ): void {
        graphics.moveTo(x, y + height);
        graphics.lineTo(x + width / 2, y + height * 0.48);
        graphics.lineTo(x + width * 0.32, y);
        graphics.lineTo(x - width * 0.32, y);
        graphics.lineTo(x - width / 2, y + height * 0.48);
        graphics.close();
        graphics.fill();
    }

    private createCharacters(): void {
        const player = this.createSpriteNode(
            this.characterLayer,
            'PlayerCharacter',
            'scene/layers/pink-girl/spriteFrame',
            new Vec3(-200, -205),
            270,
            540,
        );
        this.makeInteractive(player, () => this.showModal(
            '人物观察',
            '粉衣女孩正站在樱花集市入口。\n\n她似乎正在寻找与“樱花甜品”有关的线索。',
            new Color(255, 147, 190, 255),
        ));

        const silverBoy = this.createSpriteNode(
            this.characterLayer,
            'SilverHairCharacter',
            'scene/layers/silver-boy/spriteFrame',
            new Vec3(198, -170),
            178,
            386,
        );
        this.makeInteractive(silverBoy, () => this.startStoryDialogue());
    }

    private createStoryUi(): void {
        const chapterBar = this.createUiNode('ChapterObjective', this.storyLayer);
        chapterBar.setPosition(0, 505);
        chapterBar.getComponent(UITransform)?.setContentSize(560, 48);
        const chapterGraphics = chapterBar.addComponent(Graphics);
        chapterGraphics.fillColor = new Color(255, 250, 253, 220);
        chapterGraphics.strokeColor = new Color(238, 185, 222, 210);
        chapterGraphics.lineWidth = 2;
        chapterGraphics.roundRect(-280, -24, 560, 48, 24);
        chapterGraphics.fill();
        chapterGraphics.stroke();
        this.objectiveLabel = this.addLabel(
            chapterBar,
            'ObjectiveLabel',
            SWEET_SHOP_CHAPTER.objective,
            19,
            new Color(113, 75, 111, 240),
            Vec3.ZERO,
            525,
            42,
            true,
        );

        this.clueBubble = this.createBubble(
            this.storyLayer,
            'ClueBubble',
            '收集线索',
            '他喜欢樱花甜品\n今天在市集散步',
            new Vec3(-155, 270),
            350,
            172,
            new Color(255, 141, 193, 255),
            () => this.collectSweetClue(),
        );

        this.clueCard = this.createBubble(
            this.storyLayer,
            'InformationExpert',
            '信息达人',
            '市集里的摊主\n知道很多消息',
            new Vec3(235, 285),
            245,
            154,
            new Color(185, 137, 255, 255),
            () => this.showModal(
                '信息达人',
                '市集里的摊主知道很多消息。\n\n试着观察甜品摊，或与街上的角色交谈。',
                new Color(185, 137, 255, 255),
            ),
        );

        this.createBubble(
            this.storyLayer,
            'ClueCard',
            '线索详情',
            '先去看看樱花甜品摊',
            new Vec3(120, -315),
            355,
            130,
            new Color(255, 143, 195, 255),
            () => this.showModal(
                '当前线索',
                this.progress.clues.length > 0
                    ? SWEET_SHOP_CHAPTER.clueDescription
                    : '尚未发现线索。先观察市集里的粉色线索气泡。',
                new Color(255, 143, 195, 255),
            ),
        );
    }

    private createActions(): void {
        const actionBar = this.createUiNode('ActionBar', this.actionLayer);
        actionBar.setPosition(0, -579);
        actionBar.getComponent(UITransform)?.setContentSize(700, 184);
        const barGraphics = actionBar.addComponent(Graphics);
        barGraphics.fillColor = new Color(255, 241, 249, 205);
        barGraphics.strokeColor = new Color(255, 177, 211, 210);
        barGraphics.lineWidth = 3;
        barGraphics.roundRect(-350, -92, 700, 184, 46);
        barGraphics.fill();
        barGraphics.stroke();

        this.createButton(
            this.actionLayer,
            'GalleryButton',
            '图鉴',
            new Vec3(-286, 585),
            138,
            58,
            new Color(198, 158, 242, 255),
            () => director.loadScene('CharacterGallery'),
        );

        this.createButton(
            this.actionLayer,
            'TalkButton',
            '对话',
            new Vec3(-190, -579),
            250,
            116,
            new Color(255, 149, 192, 255),
            () => this.startStoryDialogue(),
        );

        this.createButton(
            this.actionLayer,
            'ViewInfoButton',
            '查看信息',
            new Vec3(175, -579),
            330,
            116,
            new Color(190, 153, 255, 255),
            () => this.showProgressSummary(),
        );
    }

    private collectSweetClue(): void {
        if (this.progress.clues.indexOf(SWEET_SHOP_CHAPTER.clueId) >= 0) {
            this.showModal(
                SWEET_SHOP_CHAPTER.clueTitle,
                `${SWEET_SHOP_CHAPTER.clueDescription}\n\n线索已记录，可以去找银发少年聊聊。`,
                new Color(255, 142, 194, 255),
            );
            return;
        }

        this.progress = {
            ...this.progress,
            clues: [...this.progress.clues, SWEET_SHOP_CHAPTER.clueId],
        };
        saveProgress(this.progress);
        this.updateStoryUi();
        this.showModal(
            '获得线索',
            `${SWEET_SHOP_CHAPTER.clueTitle}\n\n${SWEET_SHOP_CHAPTER.clueDescription}\n\n去找银发少年询问线索吧。`,
            new Color(255, 142, 194, 255),
        );
    }

    private startStoryDialogue(): void {
        if (this.progress.clues.indexOf(SWEET_SHOP_CHAPTER.clueId) < 0) {
            this.showModal(
                SWEET_SHOP_CHAPTER.eventTitle,
                '银发少年似乎在等待什么。\n\n先留意市集里的粉色线索气泡，然后再回来和他交谈。',
                new Color(162, 190, 255, 255),
            );
            return;
        }

        if (this.progress.completedEvents.indexOf(SWEET_SHOP_CHAPTER.id) >= 0) {
            const choiceId = this.progress.selectedChoices[SWEET_SHOP_CHAPTER.id];
            const choice = SWEET_SHOP_CHAPTER.choices.find((item) => item.id === choiceId);
            this.showModal(
                '章节回看',
                `${choice?.outcome ?? '你已经帮助银发少年完成了这次委托。'}\n\n他正在等你一起探索下一处樱花地标。`,
                new Color(162, 190, 255, 255),
            );
            return;
        }

        this.showChoiceModal();
    }

    private showChoiceModal(): void {
        if (this.choiceModal?.isValid) {
            this.choiceModal.destroy();
        }

        const modal = this.createUiNode('StoryChoiceModal', this.modalLayer);
        const opacity = modal.addComponent(UIOpacity);
        opacity.opacity = 0;
        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(44, 24, 54, 170);
        shade.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        shade.fill();

        const panel = this.createUiNode('ChoicePanel', modal);
        panel.setPosition(0, 5);
        panel.getComponent(UITransform)?.setContentSize(640, 730);
        const panelGraphics = panel.addComponent(Graphics);
        panelGraphics.fillColor = new Color(255, 247, 252, 252);
        panelGraphics.strokeColor = new Color(187, 158, 242, 255);
        panelGraphics.lineWidth = 5;
        panelGraphics.roundRect(-320, -365, 640, 730, 38);
        panelGraphics.fill();
        panelGraphics.stroke();
        panelGraphics.fillColor = new Color(190, 153, 255, 255);
        panelGraphics.roundRect(-124, 275, 248, 62, 31);
        panelGraphics.fill();

        this.addLabel(
            panel,
            'ChoiceTitle',
            SWEET_SHOP_CHAPTER.eventTitle,
            31,
            Color.WHITE,
            new Vec3(0, 306),
            430,
            58,
            true,
        );
        this.addLabel(
            panel,
            'ChoiceDescription',
            SWEET_SHOP_CHAPTER.eventDescription,
            24,
            new Color(87, 56, 88, 255),
            new Vec3(0, 200),
            550,
            120,
            true,
        );
        this.addLabel(
            panel,
            'CurrentStats',
            `才智 ${this.progress.stats.wisdom} · 美貌 ${this.progress.stats.beauty} · 情商 ${this.progress.stats.emotion} · 洞察 ${this.progress.stats.insight}`,
            17,
            new Color(142, 99, 145, 230),
            new Vec3(0, 125),
            550,
            36,
            true,
        );

        const choiceY = [50, -60, -170];
        SWEET_SHOP_CHAPTER.choices.forEach((choice, index) => {
            this.createChoiceButton(panel, choice, choiceY[index]);
        });

        const closeButton = this.createUiNode('CloseChoices', panel);
        closeButton.setPosition(0, -286);
        closeButton.getComponent(UITransform)?.setContentSize(220, 50);
        const closeGraphics = closeButton.addComponent(Graphics);
        closeGraphics.fillColor = new Color(246, 231, 243, 235);
        closeGraphics.roundRect(-110, -25, 220, 50, 25);
        closeGraphics.fill();
        this.addLabel(
            closeButton,
            'CloseLabel',
            '暂不决定',
            21,
            new Color(122, 88, 126, 255),
            Vec3.ZERO,
            190,
            44,
            true,
        );
        this.makeInteractive(closeButton, () => {
            if (this.choiceModal === modal) {
                this.choiceModal = null;
            }
            modal.destroy();
        });

        this.choiceModal = modal;
        tween(opacity).to(0.16, { opacity: 255 }).start();
        tween(panel)
            .set({ scale: new Vec3(0.94, 0.94, 1) })
            .to(0.2, { scale: Vec3.ONE }, { easing: 'backOut' })
            .start();
    }

    private createChoiceButton(parent: Node, choice: StoryChoice, y: number): void {
        const available = meetsRequirement(this.progress.stats, choice.requirement);
        const button = this.createUiNode(`Choice_${choice.id}`, parent);
        button.setPosition(0, y);
        button.getComponent(UITransform)?.setContentSize(550, 94);
        const graphics = button.addComponent(Graphics);
        graphics.fillColor = available
            ? new Color(255, 240, 248, 248)
            : new Color(238, 232, 237, 235);
        graphics.strokeColor = available
            ? new Color(255, 151, 193, 230)
            : new Color(190, 182, 190, 200);
        graphics.lineWidth = 3;
        graphics.roundRect(-275, -47, 550, 94, 22);
        graphics.fill();
        graphics.stroke();

        this.addLabel(
            button,
            'ChoiceLabel',
            choice.label,
            23,
            available ? new Color(101, 66, 110, 255) : new Color(132, 124, 132, 230),
            new Vec3(0, 18),
            500,
            34,
            true,
        );
        const requirementText = choice.requirement
            ? `${choice.description}  ${statLabel(choice.requirement.stat)}需 ${choice.requirement.minimum}`
            : choice.description;
        this.addLabel(
            button,
            'ChoiceDescription',
            requirementText,
            17,
            available ? new Color(139, 91, 135, 235) : new Color(151, 143, 150, 220),
            new Vec3(0, -20),
            500,
            30,
            true,
        );

        this.makeInteractive(button, () => {
            if (!available) {
                this.showToast(
                    `需要${statLabel(choice.requirement!.stat)}达到 ${choice.requirement!.minimum}`,
                );
                return;
            }
            this.applyStoryChoice(choice);
        });
    }

    private applyStoryChoice(choice: StoryChoice): void {
        if (this.progress.completedEvents.indexOf(SWEET_SHOP_CHAPTER.id) >= 0) {
            return;
        }
        this.progress = applyChoice(this.progress, {
            eventId: SWEET_SHOP_CHAPTER.id,
            characterId: SWEET_SHOP_CHAPTER.characterId,
            choiceId: choice.id,
            effects: choice.effects,
        });
        saveProgress(this.progress);
        this.updateStoryUi();

        if (this.choiceModal?.isValid) {
            this.choiceModal.destroy();
            this.choiceModal = null;
        }
        this.showModal(
            '第一章完成',
            `${choice.outcome}\n\n奖励：礼物 +1，心动值 +${choice.effects.bondDelta ?? 0}\n沈星澜已解锁至心动图鉴。`,
            new Color(255, 148, 190, 255),
        );
    }

    private updateStoryUi(): void {
        const complete = this.progress.completedEvents.indexOf(SWEET_SHOP_CHAPTER.id) >= 0;
        const hasClue = this.progress.clues.indexOf(SWEET_SHOP_CHAPTER.clueId) >= 0;
        if (this.objectiveLabel?.isValid) {
            this.objectiveLabel.string = complete
                ? '第一章完成 · 沈星澜已解锁'
                : hasClue
                    ? '与银发少年交谈，选择你的回应'
                    : SWEET_SHOP_CHAPTER.objective;
        }

        const bubbleTitle = this.clueBubble
            ?.getChildByName('BubbleTitle')
            ?.getComponent(Label);
        const bubbleMessage = this.clueBubble
            ?.getChildByName('BubbleMessage')
            ?.getComponent(Label);
        if (bubbleTitle?.isValid) {
            bubbleTitle.string = hasClue ? '线索已收集' : '收集线索';
        }
        if (bubbleMessage?.isValid) {
            bubbleMessage.string = hasClue
                ? '樱花甜品\n已记录到线索簿'
                : '粉色包装纸\n似乎藏着秘密';
        }

        const cardTitle = this.clueCard
            ?.getChildByName('BubbleTitle')
            ?.getComponent(Label);
        const cardMessage = this.clueCard
            ?.getChildByName('BubbleMessage')
            ?.getComponent(Label);
        if (cardTitle?.isValid) {
            cardTitle.string = complete ? '章节完成' : '当前目标';
        }
        if (cardMessage?.isValid) {
            cardMessage.string = complete
                ? '前往图鉴\n查看解锁角色'
                : hasClue
                    ? '去甜品摊\n和银发少年聊聊'
                    : '先发现\n市集里的线索';
        }
    }

    private showProgressSummary(): void {
        const complete = this.progress.completedEvents.indexOf(SWEET_SHOP_CHAPTER.id) >= 0;
        this.showModal(
            '旅程进度',
            `身份：${this.progress.zodiac || '未选择'} · ${this.progress.personality || '未选择'}\n`
                + `属性：才智 ${this.progress.stats.wisdom} / 美貌 ${this.progress.stats.beauty} / `
                + `情商 ${this.progress.stats.emotion} / 洞察 ${this.progress.stats.insight}\n\n`
                + `线索：${this.progress.clues.length} 条\n`
                + `礼物：${this.progress.gifts} 份\n`
                + `沈星澜心动值：${getBond(this.progress, SWEET_SHOP_CHAPTER.characterId)}/6\n\n`
                + (complete ? '第一章已完成。' : SWEET_SHOP_CHAPTER.objective),
            new Color(183, 148, 255, 255),
        );
    }

    private createBubble(
        parent: Node,
        name: string,
        title: string,
        message: string,
        position: Vec3,
        width: number,
        height: number,
        accent: Color,
        onTap: () => void,
    ): Node {
        const bubble = this.createUiNode(name, parent);
        bubble.setPosition(position);
        bubble.getComponent(UITransform)?.setContentSize(width, height);

        const graphics = bubble.addComponent(Graphics);
        graphics.fillColor = new Color(255, 250, 253, 238);
        graphics.strokeColor = accent;
        graphics.lineWidth = 3;
        graphics.roundRect(-width / 2, -height / 2, width, height, 34);
        graphics.fill();
        graphics.stroke();

        graphics.fillColor = accent;
        graphics.roundRect(-54, height / 2 - 14, 108, 36, 18);
        graphics.fill();

        this.addLabel(
            bubble,
            'BubbleTitle',
            title,
            19,
            Color.WHITE,
            new Vec3(0, height / 2 + 3),
            140,
            34,
            true,
        );
        this.addLabel(
            bubble,
            'BubbleMessage',
            message,
            26,
            new Color(96, 65, 94, 255),
            new Vec3(0, -15),
            width - 50,
            height - 52,
            true,
        );

        this.makeInteractive(bubble, onTap);
        return bubble;
    }

    private createButton(
        parent: Node,
        name: string,
        text: string,
        position: Vec3,
        width: number,
        height: number,
        accent: Color,
        onTap: () => void,
    ): Node {
        const button = this.createUiNode(name, parent);
        button.setPosition(position);
        button.getComponent(UITransform)?.setContentSize(width, height);

        const glow = this.createUiNode('Glow', button);
        glow.getComponent(UITransform)?.setContentSize(width + 18, height + 18);
        const glowGraphics = glow.addComponent(Graphics);
        glowGraphics.fillColor = new Color(accent.r, accent.g, accent.b, 70);
        glowGraphics.roundRect(
            -(width + 18) / 2,
            -(height + 18) / 2,
            width + 18,
            height + 18,
            (height + 18) / 2,
        );
        glowGraphics.fill();

        const graphics = button.addComponent(Graphics);
        graphics.fillColor = new Color(255, 249, 253, 245);
        graphics.strokeColor = accent;
        graphics.lineWidth = 4;
        graphics.roundRect(-width / 2, -height / 2, width, height, height / 2);
        graphics.fill();
        graphics.stroke();

        this.addLabel(
            button,
            'ButtonLabel',
            text,
            34,
            new Color(112, 70, 112, 255),
            Vec3.ZERO,
            width - 34,
            height - 26,
            true,
        );
        this.makeInteractive(button, onTap);
        return button;
    }

    private createSpriteNode(
        parent: Node,
        name: string,
        resourcePath: string,
        position: Vec3,
        width: number,
        height: number,
    ): Node {
        const node = this.createUiNode(name, parent);
        node.setPosition(position);
        node.getComponent(UITransform)?.setContentSize(width, height);
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this.loadSprite(sprite, resourcePath);
        return node;
    }

    private loadSprite(sprite: Sprite, resourcePath: string): void {
        resources.load(resourcePath, SpriteFrame, (error, frame) => {
            if (error || !frame) {
                console.error(`[GameApp] Failed to load ${resourcePath}`, error);
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

    private showModal(title: string, message: string, accent: Color): void {
        if (this.modal?.isValid) {
            this.modal.destroy();
        }

        const modal = this.createUiNode('InfoModal', this.modalLayer);
        const opacity = modal.addComponent(UIOpacity);
        opacity.opacity = 0;

        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(48, 25, 55, 150);
        shade.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        shade.fill();

        const panel = this.createUiNode('Panel', modal);
        panel.setPosition(0, 24);
        panel.getComponent(UITransform)?.setContentSize(620, 500);
        const panelGraphics = panel.addComponent(Graphics);
        panelGraphics.fillColor = new Color(255, 246, 252, 250);
        panelGraphics.strokeColor = accent;
        panelGraphics.lineWidth = 5;
        panelGraphics.roundRect(-310, -250, 620, 500, 36);
        panelGraphics.fill();
        panelGraphics.stroke();
        panelGraphics.fillColor = accent;
        panelGraphics.roundRect(-112, 172, 224, 62, 31);
        panelGraphics.fill();

        this.addLabel(panel, 'Title', title, 34, Color.WHITE, new Vec3(0, 203), 420, 60, true);
        this.addLabel(
            panel,
            'Message',
            message,
            30,
            new Color(88, 57, 87, 255),
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

    private showSceneHint(): void {
        const hint = this.createUiNode('SceneHint', this.feedbackLayer);
        hint.setPosition(0, 455);
        hint.getComponent(UITransform)?.setContentSize(510, 60);
        const graphics = hint.addComponent(Graphics);
        graphics.fillColor = new Color(255, 247, 252, 225);
        graphics.roundRect(-255, -30, 510, 60, 30);
        graphics.fill();
        this.addLabel(
            hint,
            'HintLabel',
            '轻触角色、气泡或按钮探索市集',
            24,
            new Color(113, 77, 106, 255),
            Vec3.ZERO,
            470,
            54,
            true,
        );

        const opacity = hint.addComponent(UIOpacity);
        tween(opacity)
            .delay(2.8)
            .to(0.4, { opacity: 0 })
            .call(() => {
                if (hint.isValid) {
                    hint.destroy();
                }
            })
            .start();
    }

    private showToast(text: string): void {
        if (this.toastNode?.isValid) {
            this.toastNode.destroy();
        }
        const toast = this.createUiNode('GameToast', this.feedbackLayer);
        toast.setPosition(0, 430);
        toast.getComponent(UITransform)?.setContentSize(450, 56);
        const graphics = toast.addComponent(Graphics);
        graphics.fillColor = new Color(255, 250, 253, 240);
        graphics.strokeColor = new Color(255, 151, 194, 220);
        graphics.lineWidth = 2;
        graphics.roundRect(-225, -28, 450, 56, 28);
        graphics.fill();
        graphics.stroke();
        this.addLabel(
            toast,
            'ToastLabel',
            text,
            23,
            new Color(111, 72, 106, 255),
            Vec3.ZERO,
            410,
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
        label.lineHeight = Math.round(fontSize * 1.45);
        label.color = color;
        label.enableWrapText = true;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = centered
            ? HorizontalTextAlignment.CENTER
            : HorizontalTextAlignment.LEFT;
        label.verticalAlign = VerticalTextAlignment.CENTER;

        label.outlineColor = new Color(255, 255, 255, 120);
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
