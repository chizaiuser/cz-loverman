import {
    _decorator,
    Color,
    Component,
    director,
    EventKeyboard,
    EventTouch,
    Graphics,
    HorizontalTextAlignment,
    input,
    Input,
    KeyCode,
    Label,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    tween,
    UITransform,
    Vec3,
    VerticalTextAlignment,
} from 'cc';
import { gameFeel } from './GameFeel';
import {
    loadProgress,
    PlayerProgress,
    saveProgress,
} from './GameProgress';
import { getOutfit, OUTFITS, OutfitDefinition } from './WardrobeData';
import {
    getPartnerSupport,
    PARTNERS,
    PartnerSupport,
} from './PartnerData';

const { ccclass } = _decorator;

const DESIGN_WIDTH = 750;
const DESIGN_HEIGHT = 1334;
const MAP_WIDTH = 1800;
const MAP_HEIGHT = 2600;
const PLAYER_RADIUS = 22;
const PLAYER_SPEED = 260;
const JOYSTICK_RADIUS = 64;

interface CollisionBox {
    left: number;
    right: number;
    bottom: number;
    top: number;
}

interface CityJob {
    id: string;
    building: string;
    action: string;
    x: number;
    y: number;
    baseReward: number;
    bonusReward: number;
    accent: Color;
}

const CITY_JOBS: CityJob[] = [
    {
        id: 'cafe',
        building: '花街咖啡馆',
        action: '冲煮咖啡',
        x: -610,
        y: 640,
        baseReward: 12,
        bonusReward: 15,
        accent: new Color(238, 150, 190, 255),
    },
    {
        id: 'sweet',
        building: '甜心商店',
        action: '装饰蛋糕',
        x: 590,
        y: 130,
        baseReward: 15,
        bonusReward: 18,
        accent: new Color(246, 170, 132, 255),
    },
    {
        id: 'stage',
        building: '星屑剧场',
        action: '整理舞台',
        x: 590,
        y: -1005,
        baseReward: 18,
        bonusReward: 22,
        accent: new Color(186, 143, 229, 255),
    },
];

@ccclass('CityExplore')
export class CityExplore extends Component {
    private worldRoot!: Node;
    private buildingLayer!: Node;
    private decorationLayer!: Node;
    private characterLayer!: Node;
    private hudLayer!: Node;
    private feedbackLayer!: Node;
    private modalLayer!: Node;
    private player!: Node;
    private playerVisual!: Node;
    private joystickBase!: Node;
    private joystickKnob!: Node;
    private locationLabel!: Label;
    private coinLabel!: Label;
    private jobPromptButton!: Node;
    private jobPromptLabel!: Label;
    private currentJob: CityJob | null = null;
    private jobModal: Node | null = null;
    private jobTrack: Node | null = null;
    private jobMarker: Node | null = null;
    private jobTarget: Node | null = null;
    private jobStatusLabel: Label | null = null;
    private jobStopLabel: Label | null = null;
    private jobCoinLabel: Label | null = null;
    private playerOutfitAccessory: Node | null = null;
    private wardrobeButton!: Node;
    private wardrobeModal: Node | null = null;
    private wardrobeList: Node | null = null;
    private wardrobeCoinLabel: Label | null = null;
    private wardrobeMessageLabel: Label | null = null;
    private wardrobePreviewVisual: Node | null = null;
    private wardrobePreviewCaption: Label | null = null;
    private partnerButton!: Node;
    private partnerButtonLabel!: Label;
    private partnerModal: Node | null = null;
    private partnerList: Node | null = null;
    private partnerPageLabel: Label | null = null;
    private partnerActiveLabel: Label | null = null;
    private partnerPage = 0;
    private jobActive = false;
    private jobCompleted = false;
    private jobRound = 0;
    private jobRoundIncome = 0;
    private jobTotalIncome = 0;
    private jobMarkerValue = -1;
    private jobDirection = 1;
    private jobSpeed = 1.25;
    private jobTargetValue = 0;
    private progress!: PlayerProgress;
    private keyboard = new Set<KeyCode>();
    private joystickDirection = new Vec3();
    private collisions: CollisionBox[] = [];
    private lastLocation = '';

    protected start(): void {
        this.progress = loadProgress();
        gameFeel.init();
        this.createLayers();
        this.createWorld();
        this.createPlayer();
        this.createHud();
        this.bindKeyboard();
        this.updateCamera();
        gameFeel.fadeIn(this.node);
    }

    protected onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    protected update(deltaTime: number): void {
        if (!this.player?.isValid) {
            return;
        }
        if (
            this.jobModal?.isValid
            || this.wardrobeModal?.isValid
            || this.partnerModal?.isValid
        ) {
            if (this.jobActive) {
                this.updateJob(deltaTime);
            }
            return;
        }
        this.updateJobProximity();

        const keyboardX = (this.isPressed(KeyCode.KEY_D) || this.isPressed(KeyCode.ARROW_RIGHT) ? 1 : 0)
            - (this.isPressed(KeyCode.KEY_A) || this.isPressed(KeyCode.ARROW_LEFT) ? 1 : 0);
        const keyboardY = (this.isPressed(KeyCode.KEY_W) || this.isPressed(KeyCode.ARROW_UP) ? 1 : 0)
            - (this.isPressed(KeyCode.KEY_S) || this.isPressed(KeyCode.ARROW_DOWN) ? 1 : 0);
        const useJoystick = this.joystickDirection.lengthSqr() > 0.01;
        const direction = new Vec3(
            useJoystick ? this.joystickDirection.x : keyboardX,
            useJoystick ? this.joystickDirection.y : keyboardY,
            0,
        );

        if (direction.lengthSqr() > 1) {
            direction.normalize();
        }
        if (direction.lengthSqr() <= 0.01) {
            return;
        }

        const stepX = direction.x * PLAYER_SPEED * deltaTime;
        const stepY = direction.y * PLAYER_SPEED * deltaTime;
        const current = this.player.position;
        if (!this.isBlocked(current.x + stepX, current.y)) {
            this.player.setPosition(current.x + stepX, current.y);
        }
        if (!this.isBlocked(current.x, current.y + stepY)) {
            this.player.setPosition(current.x, current.y + stepY);
        }

        if (this.playerVisual?.isValid) {
            this.playerVisual.setScale(new Vec3(direction.x < -0.05 ? -1 : 1, 1, 1));
        }
        this.updateCamera();
        this.updateLocation();
    }

    private createLayers(): void {
        this.worldRoot = this.createLayer('WorldRoot');
        this.decorationLayer = this.createLayer('CityDecorationLayer', this.worldRoot);
        this.buildingLayer = this.createLayer('BuildingLayer', this.worldRoot);
        this.characterLayer = this.createLayer('CharacterLayer', this.worldRoot);
        this.hudLayer = this.createLayer('HudLayer');
        this.feedbackLayer = this.createLayer('FeedbackLayer');
        this.modalLayer = this.createLayer('ModalLayer');
    }

    private createWorld(): void {
        const background = this.createNode('PinkCityGround', this.decorationLayer);
        background.getComponent(UITransform)?.setContentSize(MAP_WIDTH, MAP_HEIGHT);
        const graphics = background.addComponent(Graphics);
        graphics.fillColor = new Color(250, 216, 235, 255);
        graphics.rect(-MAP_WIDTH / 2, -MAP_HEIGHT / 2, MAP_WIDTH, MAP_HEIGHT);
        graphics.fill();

        graphics.fillColor = new Color(255, 228, 238, 255);
        graphics.rect(-260, -MAP_HEIGHT / 2, 520, MAP_HEIGHT);
        graphics.rect(-MAP_WIDTH / 2, -610, MAP_WIDTH, 300);
        graphics.fill();

        graphics.fillColor = new Color(120, 105, 126, 235);
        graphics.rect(-170, -MAP_HEIGHT / 2, 340, MAP_HEIGHT);
        graphics.rect(-MAP_WIDTH / 2, -520, MAP_WIDTH, 160);
        graphics.fill();

        graphics.strokeColor = new Color(255, 240, 248, 220);
        graphics.lineWidth = 3;
        graphics.moveTo(-210, -MAP_HEIGHT / 2);
        graphics.lineTo(-210, MAP_HEIGHT / 2);
        graphics.moveTo(210, -MAP_HEIGHT / 2);
        graphics.lineTo(210, MAP_HEIGHT / 2);
        graphics.moveTo(-MAP_WIDTH / 2, -380);
        graphics.lineTo(MAP_WIDTH / 2, -380);
        graphics.moveTo(-MAP_WIDTH / 2, -580);
        graphics.lineTo(MAP_WIDTH / 2, -580);
        graphics.stroke();

        graphics.strokeColor = new Color(255, 224, 157, 230);
        graphics.lineWidth = 5;
        graphics.moveTo(0, -MAP_HEIGHT / 2);
        graphics.lineTo(0, MAP_HEIGHT / 2);
        graphics.moveTo(-MAP_WIDTH / 2, -450);
        graphics.lineTo(MAP_WIDTH / 2, -450);
        graphics.stroke();

        graphics.fillColor = new Color(255, 242, 249, 235);
        for (let index = -5; index <= 5; index += 1) {
            graphics.roundRect(-160, -450 + index * 72 - 11, 320, 22, 11);
        }
        graphics.fill();

        this.createRoadDetails();
        this.createBuildings();
        this.createFountain(0, 420);
        this.createTrees();
        this.createJobMarkers();
    }

    private createRoadDetails(): void {
        const details = this.createNode('RoadDetails', this.decorationLayer);
        const graphics = details.addComponent(Graphics);
        for (let index = 0; index < 18; index += 1) {
            const y = -1180 + index * 135;
            graphics.fillColor = new Color(255, 248, 251, 190);
            graphics.circle(-230, y, 5);
            graphics.circle(230, y, 5);
            graphics.fill();
        }

        for (let index = 0; index < 8; index += 1) {
            graphics.strokeColor = new Color(220, 170, 205, 180);
            graphics.lineWidth = 2;
            graphics.moveTo(-170, -430 - index * 17);
            graphics.lineTo(170, -430 - index * 17);
        }
        graphics.stroke();
    }

    private createBuildings(): void {
        const buildings = [
            { name: '花街咖啡馆', x: -610, y: 870, w: 350, h: 360, body: new Color(255, 205, 224), roof: new Color(190, 128, 170), sign: 'CAFE' },
            { name: '樱花钟楼', x: 585, y: 850, w: 360, h: 430, body: new Color(245, 212, 242), roof: new Color(159, 126, 194), sign: 'CLOCK' },
            { name: '月光书室', x: -590, y: 360, w: 340, h: 310, body: new Color(230, 216, 250), roof: new Color(142, 124, 187), sign: 'BOOKS' },
            { name: '甜心商店', x: 590, y: 340, w: 340, h: 320, body: new Color(255, 218, 225), roof: new Color(204, 124, 159), sign: 'SWEET' },
            { name: '花语公寓', x: -600, y: -760, w: 350, h: 390, body: new Color(240, 211, 239), roof: new Color(162, 120, 180), sign: 'HOME' },
            { name: '星屑剧场', x: 590, y: -780, w: 350, h: 390, body: new Color(252, 214, 230), roof: new Color(194, 124, 171), sign: 'STAGE' },
        ];
        buildings.forEach((building) => {
            this.createBuilding(building);
        });
    }

    private createBuilding(config: {
        name: string;
        x: number;
        y: number;
        w: number;
        h: number;
        body: Color;
        roof: Color;
        sign: string;
    }): void {
        const building = this.createNode(config.name, this.buildingLayer);
        building.setPosition(config.x, config.y);
        building.getComponent(UITransform)?.setContentSize(config.w, config.h);
        const graphics = building.addComponent(Graphics);

        graphics.fillColor = new Color(87, 61, 83, 45);
        graphics.roundRect(-config.w / 2 + 12, -config.h / 2 - 18, config.w, config.h, 24);
        graphics.fill();
        graphics.fillColor = config.body;
        graphics.strokeColor = new Color(255, 248, 253, 230);
        graphics.lineWidth = 5;
        graphics.roundRect(-config.w / 2, -config.h / 2, config.w, config.h, 24);
        graphics.fill();
        graphics.stroke();

        graphics.fillColor = config.roof;
        graphics.roundRect(-config.w / 2, config.h / 2 - 78, config.w, 78, 24);
        graphics.fill();

        const windowColor = new Color(255, 246, 196, 245);
        graphics.fillColor = windowColor;
        for (let column = 0; column < 3; column += 1) {
            for (let row = 0; row < Math.max(1, Math.floor((config.h - 150) / 95)); row += 1) {
                graphics.roundRect(
                    -config.w / 2 + 44 + column * (config.w - 88) / 3,
                    config.h / 2 - 160 - row * 92,
                    (config.w - 140) / 3,
                    48,
                    10,
                );
            }
        }
        graphics.fill();

        graphics.fillColor = new Color(114, 76, 108, 245);
        graphics.roundRect(-42, -config.h / 2 + 20, 84, 110, 12);
        graphics.fill();
        graphics.fillColor = new Color(255, 231, 241, 250);
        graphics.roundRect(-config.w / 2 + 24, config.h / 2 - 64, config.w - 48, 42, 18);
        graphics.fill();

        this.addLabel(
            building,
            'ShopSign',
            config.sign,
            18,
            new Color(120, 73, 116, 255),
            new Vec3(0, config.h / 2 - 43),
            config.w - 70,
            32,
            true,
        );
        this.addLabel(
            building,
            'BuildingName',
            config.name,
            22,
            Color.WHITE,
            new Vec3(0, -config.h / 2 + 145),
            config.w - 44,
            40,
            true,
        );

        this.collisions.push({
            left: config.x - config.w / 2,
            right: config.x + config.w / 2,
            bottom: config.y - config.h / 2,
            top: config.y + config.h / 2,
        });
    }

    private createFountain(x: number, y: number): void {
        const fountain = this.createNode('SakuraFountain', this.decorationLayer);
        fountain.setPosition(x, y);
        const graphics = fountain.addComponent(Graphics);
        graphics.fillColor = new Color(255, 233, 244, 250);
        graphics.strokeColor = new Color(205, 139, 190, 255);
        graphics.lineWidth = 7;
        graphics.circle(0, 0, 96);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(155, 205, 244, 235);
        graphics.circle(0, 0, 64);
        graphics.fill();
        graphics.strokeColor = new Color(255, 255, 255, 235);
        graphics.lineWidth = 4;
        graphics.circle(0, 0, 42);
        graphics.stroke();
        this.addLabel(
            fountain,
            'FountainLabel',
            '樱花广场',
            20,
            new Color(111, 77, 119, 255),
            new Vec3(0, -122),
            220,
            38,
            true,
        );
        this.collisions.push({
            left: x - 96,
            right: x + 96,
            bottom: y - 96,
            top: y + 96,
        });
    }

    private createTrees(): void {
        const points = [
            new Vec3(-315, 1180), new Vec3(315, 1160),
            new Vec3(-315, 650), new Vec3(315, 610),
            new Vec3(-315, 70), new Vec3(315, 30),
            new Vec3(-315, -930), new Vec3(315, -960),
            new Vec3(-315, -1190), new Vec3(315, -1210),
        ];
        for (const point of points) {
            const tree = this.createNode('SakuraTree', this.decorationLayer);
            tree.setPosition(point);
            const graphics = tree.addComponent(Graphics);
            graphics.fillColor = new Color(120, 82, 112, 210);
            graphics.roundRect(-8, -48, 16, 72, 8);
            graphics.fill();
            graphics.fillColor = new Color(255, 152, 194, 245);
            graphics.circle(0, 48, 46);
            graphics.circle(-30, 28, 34);
            graphics.circle(32, 28, 36);
            graphics.fill();
            graphics.fillColor = new Color(255, 232, 244, 230);
            graphics.circle(8, 58, 16);
            graphics.fill();
        }
    }

    private createJobMarkers(): void {
        for (const job of CITY_JOBS) {
            const marker = this.createNode(`JobMarker_${job.id}`, this.decorationLayer);
            marker.setPosition(job.x, job.y);
            const graphics = marker.addComponent(Graphics);
            graphics.fillColor = new Color(job.accent.r, job.accent.g, job.accent.b, 225);
            graphics.strokeColor = new Color(255, 255, 255, 235);
            graphics.lineWidth = 3;
            graphics.circle(0, 0, 34);
            graphics.fill();
            graphics.stroke();
            this.addLabel(
                marker,
                'JobIcon',
                '★',
                25,
                Color.WHITE,
                Vec3.ZERO,
                54,
                48,
                true,
            );
            this.addLabel(
                marker,
                'JobName',
                job.action,
                17,
                new Color(105, 72, 112, 255),
                new Vec3(0, -54),
                180,
                30,
                true,
            );
        }
    }

    private createPlayer(): void {
        this.player = this.createNode('Player', this.characterLayer);
        this.player.setPosition(0, -760);
        this.player.getComponent(UITransform)?.setContentSize(PLAYER_RADIUS * 2, PLAYER_RADIUS * 2);

        const shadow = this.createNode('PlayerShadow', this.player);
        shadow.setPosition(0, -66);
        const shadowGraphics = shadow.addComponent(Graphics);
        shadowGraphics.fillColor = new Color(109, 78, 106, 95);
        shadowGraphics.ellipse(0, 0, 76, 30);
        shadowGraphics.fill();

        this.playerVisual = this.createNode('PlayerVisual', this.player);
        this.playerVisual.getComponent(UITransform)?.setContentSize(82, 164);
        const sprite = this.playerVisual.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        resources.load('scene/layers/pink-girl/spriteFrame', SpriteFrame, (error, frame) => {
            if (error || !frame) {
                gameFeel.showMissingImage(this.playerVisual, '主角素材缺失');
                return;
            }
            if (sprite.isValid) {
                sprite.spriteFrame = frame;
            }
        });
        this.playerOutfitAccessory = this.createNode('OutfitAccessory', this.playerVisual);
        this.playerOutfitAccessory.getComponent(UITransform)?.setContentSize(140, 200);
        this.playerOutfitAccessory.addComponent(Graphics);
        this.drawOutfitAccessory(this.playerOutfitAccessory, this.progress.equippedOutfit);
        this.playerVisual.setPosition(0, 16);
        tween(this.playerVisual)
            .repeatForever(
                tween()
                    .to(0.8, { position: new Vec3(0, 21, 0) }, { easing: 'sineInOut' })
                    .to(0.8, { position: new Vec3(0, 16, 0) }, { easing: 'sineInOut' }),
            )
            .start();
    }

    private createHud(): void {
        const topBar = this.createNode('CityTopBar', this.hudLayer);
        topBar.setPosition(0, 578);
        topBar.getComponent(UITransform)?.setContentSize(650, 78);
        const topGraphics = topBar.addComponent(Graphics);
        topGraphics.fillColor = new Color(255, 247, 252, 225);
        topGraphics.strokeColor = new Color(255, 255, 255, 220);
        topGraphics.lineWidth = 3;
        topGraphics.roundRect(-325, -39, 650, 78, 30);
        topGraphics.fill();
        topGraphics.stroke();

        this.addLabel(
            topBar,
            'CityTitle',
            '樱 花 街 · 漫 游',
            31,
            new Color(114, 74, 121, 255),
            new Vec3(0, 12),
            480,
            44,
            true,
        );
        this.locationLabel = this.addLabel(
            topBar,
            'LocationLabel',
            '甜品住宅街',
            17,
            new Color(153, 105, 151, 235),
            new Vec3(0, -22),
            420,
            28,
            true,
        );

        const coinPill = this.createNode('CoinPill', this.hudLayer);
        coinPill.setPosition(285, 435);
        coinPill.getComponent(UITransform)?.setContentSize(128, 44);
        const coinGraphics = coinPill.addComponent(Graphics);
        coinGraphics.fillColor = new Color(255, 240, 183, 235);
        coinGraphics.strokeColor = new Color(236, 183, 112, 235);
        coinGraphics.lineWidth = 2;
        coinGraphics.roundRect(-64, -22, 128, 44, 22);
        coinGraphics.fill();
        coinGraphics.stroke();
        this.coinLabel = this.addLabel(
            coinPill,
            'CoinLabel',
            `金币 ${this.progress.coins}`,
            19,
            new Color(133, 87, 57, 255),
            Vec3.ZERO,
            112,
            38,
            true,
        );
        this.partnerButton = this.createHudButton(
            'PartnerButton',
            '搭档',
            new Vec3(285, 365),
            160,
            58,
            () => this.openPartnerPanel(),
        );
        this.partnerButtonLabel = this.partnerButton
            .getChildByName('ButtonLabel')!
            .getComponent(Label)!;
        this.updatePartnerButtonLabel();

        this.createHudButton('CityBackButton', '返回市集', new Vec3(-285, 500), 124, 56, () => {
            director.loadScene('Main');
        });
        this.createHudButton('CityGalleryButton', '查看图鉴', new Vec3(285, 500), 124, 56, () => {
            director.loadScene('CharacterGallery');
        });
        this.createJoystick();
        this.wardrobeButton = this.createHudButton(
            'WardrobeButton',
            '换装',
            new Vec3(-35, -500),
            170,
            82,
            () => this.openWardrobe(),
        );
        this.jobPromptButton = this.createHudButton(
            'JobPromptButton',
            '兼职',
            new Vec3(225, -500),
            270,
            82,
            () => this.openCurrentJob(),
        );
        this.jobPromptLabel = this.jobPromptButton
            .getChildByName('ButtonLabel')!
            .getComponent(Label)!;
        this.jobPromptButton.active = false;
        this.addLabel(
            this.hudLayer,
            'ControlHint',
            '拖动左侧摇杆移动 · 桌面可用 WASD / 方向键',
            17,
            new Color(116, 82, 122, 225),
            new Vec3(0, -630),
            540,
            34,
            true,
        );
    }

    private createHudButton(
        name: string,
        text: string,
        position: Vec3,
        width: number,
        height: number,
        onTap: () => void,
    ): Node {
        const button = this.createNode(name, this.hudLayer);
        button.setPosition(position);
        button.getComponent(UITransform)?.setContentSize(width, height);
        const graphics = button.addComponent(Graphics);
        graphics.fillColor = new Color(255, 247, 252, 235);
        graphics.strokeColor = new Color(221, 164, 224, 235);
        graphics.lineWidth = 3;
        graphics.roundRect(-width / 2, -height / 2, width, height, height / 2);
        graphics.fill();
        graphics.stroke();
        this.addLabel(
            button,
            'ButtonLabel',
            text,
            23,
            new Color(113, 75, 120, 255),
            Vec3.ZERO,
            width - 24,
            height - 18,
            true,
        );
        this.makeInteractive(button, onTap);
        return button;
    }

    private createJoystick(): void {
        this.joystickBase = this.createNode('JoystickBase', this.hudLayer);
        this.joystickBase.setPosition(-255, -500);
        this.joystickBase.getComponent(UITransform)?.setContentSize(170, 170);
        const baseGraphics = this.joystickBase.addComponent(Graphics);
        baseGraphics.fillColor = new Color(255, 245, 252, 145);
        baseGraphics.strokeColor = new Color(214, 157, 214, 225);
        baseGraphics.lineWidth = 4;
        baseGraphics.circle(0, 0, 78);
        baseGraphics.fill();
        baseGraphics.stroke();

        this.joystickKnob = this.createNode('JoystickKnob', this.joystickBase);
        this.joystickKnob.getComponent(UITransform)?.setContentSize(84, 84);
        const knobGraphics = this.joystickKnob.addComponent(Graphics);
        knobGraphics.fillColor = new Color(255, 176, 209, 235);
        knobGraphics.strokeColor = new Color(255, 255, 255, 235);
        knobGraphics.lineWidth = 3;
        knobGraphics.circle(0, 0, 38);
        knobGraphics.fill();
        knobGraphics.stroke();

        const updateJoystick = (event: EventTouch): void => {
            const ui = event.getUILocation();
            const canvasTransform = this.node.getComponent(UITransform);
            if (!canvasTransform) {
                return;
            }
            const local = canvasTransform.convertToNodeSpaceAR(new Vec3(ui.x, ui.y, 0));
            const dx = local.x - this.joystickBase.position.x;
            const dy = local.y - this.joystickBase.position.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const ratio = length > JOYSTICK_RADIUS ? JOYSTICK_RADIUS / length : 1;
            const knobX = dx * ratio;
            const knobY = dy * ratio;
            this.joystickKnob.setPosition(knobX, knobY);
            this.joystickDirection.set(knobX / JOYSTICK_RADIUS, knobY / JOYSTICK_RADIUS, 0);
        };
        const resetJoystick = (): void => {
            this.joystickKnob.setPosition(0, 0);
            this.joystickDirection.set(0, 0, 0);
        };

        this.joystickBase.on(Node.EventType.TOUCH_START, updateJoystick);
        this.joystickBase.on(Node.EventType.TOUCH_MOVE, updateJoystick);
        this.joystickBase.on(Node.EventType.TOUCH_END, resetJoystick);
        this.joystickBase.on(Node.EventType.TOUCH_CANCEL, resetJoystick);
    }

    private openWardrobe(): void {
        if (this.wardrobeModal?.isValid) {
            return;
        }
        this.jobPromptButton.active = false;
        const modal = this.createNode('WardrobeModal', this.modalLayer);
        modal.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        modal.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(47, 28, 57, 170);
        shade.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        shade.fill();

        const panel = this.createNode('WardrobePanel', modal);
        panel.getComponent(UITransform)?.setContentSize(700, 960);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(255, 247, 252, 252);
        graphics.strokeColor = new Color(218, 162, 224, 255);
        graphics.lineWidth = 5;
        graphics.roundRect(-350, -480, 700, 960, 40);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(219, 157, 222, 255);
        graphics.roundRect(-110, 400, 220, 62, 31);
        graphics.fill();

        this.partnerActiveLabel = this.addLabel(
            panel,
            'WardrobeTitle',
            '衣 橱',
            32,
            Color.WHITE,
            new Vec3(0, 431),
            300,
            56,
            true,
        );
        this.wardrobeCoinLabel = this.addLabel(
            panel,
            'WardrobeCoins',
            `金币 ${this.progress.coins}`,
            20,
            new Color(151, 93, 104, 255),
            new Vec3(240, 373),
            180,
            38,
            true,
        );

        const previewCard = this.createNode('WardrobePreviewCard', panel);
        previewCard.setPosition(-215, -5);
        previewCard.getComponent(UITransform)?.setContentSize(220, 610);
        const previewGraphics = previewCard.addComponent(Graphics);
        previewGraphics.fillColor = new Color(255, 230, 243, 195);
        previewGraphics.strokeColor = new Color(255, 255, 255, 230);
        previewGraphics.lineWidth = 3;
        previewGraphics.roundRect(-110, -305, 220, 610, 28);
        previewGraphics.fill();
        previewGraphics.stroke();

        this.wardrobePreviewVisual = this.createNode('WardrobePreview', previewCard);
        this.wardrobePreviewVisual.setPosition(0, 75);
        this.wardrobePreviewVisual.getComponent(UITransform)?.setContentSize(180, 360);
        const previewSprite = this.wardrobePreviewVisual.addComponent(Sprite);
        previewSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        resources.load('scene/layers/pink-girl/spriteFrame', SpriteFrame, (error, frame) => {
            if (error || !frame) {
                gameFeel.showMissingImage(this.wardrobePreviewVisual, '角色素材缺失');
                return;
            }
            if (previewSprite.isValid) {
                previewSprite.spriteFrame = frame;
            }
        });
        const previewAccessory = this.createNode('PreviewOutfitAccessory', this.wardrobePreviewVisual);
        previewAccessory.getComponent(UITransform)?.setContentSize(180, 260);
        previewAccessory.addComponent(Graphics);
        this.drawOutfitAccessory(previewAccessory, this.progress.equippedOutfit);

        this.wardrobePreviewCaption = this.addLabel(
            previewCard,
            'PreviewCaption',
            '',
            18,
            new Color(121, 77, 126, 255),
            new Vec3(0, -238),
            190,
            74,
            true,
        );
        this.wardrobeMessageLabel = this.addLabel(
            panel,
            'WardrobeMessage',
            '选择服装购买或穿戴',
            18,
            new Color(149, 101, 149, 230),
            new Vec3(-215, -334),
            220,
            44,
            true,
        );

        this.wardrobeList = this.createNode('WardrobeList', panel);
        this.wardrobeList.getComponent(UITransform)?.setContentSize(430, 660);
        this.renderWardrobeList();

        this.createPanelButton(
            panel,
            'CloseWardrobe',
            '关闭衣橱',
            new Vec3(0, -425),
            240,
            52,
            new Color(211, 180, 222, 255),
            () => this.closeWardrobe(),
        );
        this.wardrobeModal = modal;
        this.updateWardrobePreview();
    }

    private renderWardrobeList(): void {
        if (!this.wardrobeList?.isValid) {
            return;
        }
        for (const child of [...this.wardrobeList.children]) {
            child.destroy();
        }
        OUTFITS.forEach((outfit, index) => {
            this.createOutfitRow(outfit, 260 - index * 112);
        });
    }

    private createOutfitRow(outfit: OutfitDefinition, y: number): void {
        if (!this.wardrobeList?.isValid) {
            return;
        }
        const row = this.createNode(`Outfit_${outfit.id}`, this.wardrobeList);
        row.setPosition(120, y);
        row.getComponent(UITransform)?.setContentSize(420, 96);
        const owned = this.progress.ownedOutfits.indexOf(outfit.id) >= 0;
        const equipped = this.progress.equippedOutfit === outfit.id;
        const graphics = row.addComponent(Graphics);
        graphics.fillColor = equipped
            ? new Color(outfit.accent.r, outfit.accent.g, outfit.accent.b, 80)
            : new Color(255, 251, 254, 240);
        graphics.strokeColor = equipped ? outfit.accent : new Color(239, 216, 235, 230);
        graphics.lineWidth = equipped ? 4 : 2;
        graphics.roundRect(-210, -48, 420, 96, 22);
        graphics.fill();
        graphics.stroke();

        graphics.fillColor = outfit.accent;
        graphics.circle(-174, 0, 25);
        graphics.fill();
        this.addLabel(
            row,
            'OutfitName',
            outfit.name,
            21,
            new Color(101, 65, 109, 255),
            new Vec3(-92, 20),
            190,
            32,
            true,
        );
        this.addLabel(
            row,
            'OutfitInfo',
            `${outfit.tags.join(' · ')}  ${outfit.bonusLabel}`,
            14,
            new Color(145, 99, 143, 230),
            new Vec3(-92, -20),
            190,
            28,
            true,
        );
        const status = equipped
            ? '穿戴中'
            : owned
                ? '点击穿戴'
                : `${outfit.price} 金币`;
        this.addLabel(
            row,
            'OutfitStatus',
            status,
            16,
            equipped
                ? new Color(179, 76, 137, 255)
                : new Color(126, 84, 132, 255),
            new Vec3(137, 0),
            120,
            38,
            true,
        );
        this.makeInteractive(row, () => this.chooseOutfit(outfit));
    }

    private chooseOutfit(outfit: OutfitDefinition): void {
        const owned = this.progress.ownedOutfits.indexOf(outfit.id) >= 0;
        if (!owned && this.progress.coins < outfit.price) {
            if (this.wardrobeMessageLabel?.isValid) {
                this.wardrobeMessageLabel.string = `金币不足，还需要 ${outfit.price - this.progress.coins}`;
            }
            return;
        }

        if (!owned) {
            this.progress = {
                ...this.progress,
                coins: this.progress.coins - outfit.price,
                ownedOutfits: [...this.progress.ownedOutfits, outfit.id],
                equippedOutfit: outfit.id,
            };
            if (this.wardrobeMessageLabel?.isValid) {
                this.wardrobeMessageLabel.string = `购买并穿上：${outfit.name}`;
            }
            gameFeel.play('gift');
        } else {
            this.progress = {
                ...this.progress,
                equippedOutfit: outfit.id,
            };
            if (this.wardrobeMessageLabel?.isValid) {
                this.wardrobeMessageLabel.string = `已穿上：${outfit.name}`;
            }
        }
        saveProgress(this.progress);
        this.updateCoinLabel();
        this.updateWardrobePreview();
        this.renderWardrobeList();
    }

    private updateWardrobePreview(): void {
        const outfit = getOutfit(this.progress.equippedOutfit);
        if (this.wardrobePreviewCaption?.isValid) {
            this.wardrobePreviewCaption.string = `${outfit.name}\n${outfit.tags.join(' · ')}`;
        }
        const previewAccessory = this.wardrobePreviewVisual?.getChildByName('PreviewOutfitAccessory');
        if (previewAccessory?.isValid) {
            this.drawOutfitAccessory(previewAccessory, outfit.id);
        }
        if (this.playerOutfitAccessory?.isValid) {
            this.drawOutfitAccessory(this.playerOutfitAccessory, outfit.id);
        }
    }

    private drawOutfitAccessory(node: Node, outfitId: string): void {
        const graphics = node.getComponent(Graphics);
        if (!graphics) {
            return;
        }
        const outfit = getOutfit(outfitId);
        graphics.clear();
        graphics.fillColor = outfit.accent;
        graphics.strokeColor = new Color(255, 255, 255, 225);
        graphics.lineWidth = 3;

        if (outfit.accessory === 'flower') {
            graphics.circle(-34, 1, 8);
            graphics.circle(-44, -7, 10);
            graphics.circle(-25, -10, 10);
            graphics.circle(-32, -19, 8);
            graphics.fill();
            graphics.fillColor = new Color(255, 236, 164, 255);
            graphics.circle(-33, -8, 6);
            graphics.fill();
        } else if (outfit.accessory === 'stars') {
            for (let index = 0; index < 5; index += 1) {
                const angle = Math.PI * 2 * index / 5;
                graphics.circle(Math.cos(angle) * 66, 52 + Math.sin(angle) * 40, 6);
            }
            graphics.fill();
        } else if (outfit.accessory === 'street') {
            graphics.strokeColor = outfit.accent;
            graphics.lineWidth = 7;
            graphics.moveTo(-42, 52);
            graphics.lineTo(42, 52);
            graphics.stroke();
            graphics.fillColor = outfit.accent;
            graphics.circle(-45, 45, 13);
            graphics.circle(45, 45, 13);
            graphics.fill();
        } else if (outfit.accessory === 'academy') {
            graphics.fillColor = outfit.accent;
            graphics.moveTo(-50, 73);
            graphics.lineTo(28, 73);
            graphics.lineTo(52, 92);
            graphics.lineTo(-22, 96);
            graphics.close();
            graphics.fill();
            graphics.strokeColor = new Color(255, 239, 218, 235);
            graphics.lineWidth = 6;
            graphics.moveTo(-48, 20);
            graphics.lineTo(44, 20);
            graphics.stroke();
        } else {
            graphics.fillColor = new Color(255, 238, 247, 220);
            graphics.circle(-52, 48, 7);
            graphics.circle(50, 18, 5);
            graphics.circle(-38, -26, 4);
            graphics.fill();
        }
    }

    private closeWardrobe(): void {
        if (this.wardrobeModal?.isValid) {
            this.wardrobeModal.destroy();
        }
        this.wardrobeModal = null;
        this.wardrobeList = null;
        this.wardrobeCoinLabel = null;
        this.wardrobeMessageLabel = null;
        this.wardrobePreviewVisual = null;
        this.wardrobePreviewCaption = null;
        this.updateJobProximity();
    }

    private openPartnerPanel(): void {
        if (this.partnerModal?.isValid) {
            return;
        }
        this.jobPromptButton.active = false;
        this.partnerPage = 0;
        const modal = this.createNode('PartnerModal', this.modalLayer);
        modal.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        modal.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(43, 27, 57, 170);
        shade.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        shade.fill();

        const panel = this.createNode('PartnerPanel', modal);
        panel.getComponent(UITransform)?.setContentSize(680, 930);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(255, 247, 252, 252);
        graphics.strokeColor = new Color(209, 161, 228, 255);
        graphics.lineWidth = 5;
        graphics.roundRect(-340, -465, 680, 930, 42);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(204, 151, 225, 255);
        graphics.roundRect(-126, 380, 252, 64, 32);
        graphics.fill();
        this.addLabel(panel, 'PartnerTitle', '选择支援搭档', 32, Color.WHITE, new Vec3(0, 412), 340, 58, true);

        const active = getPartnerSupport(this.progress.activePartner);
        this.addLabel(
            panel,
            'ActivePartner',
            active ? `当前：${active.name} · ${this.partnerSupportText(active)}` : '当前未选择搭档',
            18,
            new Color(139, 94, 148, 235),
            new Vec3(0, 338),
            570,
            42,
            true,
        );

        this.partnerList = this.createNode('PartnerList', panel);
        this.partnerList.getComponent(UITransform)?.setContentSize(620, 560);
        this.renderPartnerPage();

        this.createPanelButton(
            panel,
            'PreviousPartnerPage',
            '‹',
            new Vec3(-235, -342),
            62,
            52,
            new Color(202, 170, 235, 255),
            () => {
                this.partnerPage = Math.max(0, this.partnerPage - 1);
                this.renderPartnerPage();
            },
        );
        this.partnerPageLabel = this.addLabel(
            panel,
            'PartnerPageLabel',
            '',
            17,
            new Color(121, 85, 130, 230),
            new Vec3(0, -342),
            340,
            36,
            true,
        );
        this.createPanelButton(
            panel,
            'NextPartnerPage',
            '›',
            new Vec3(235, -342),
            62,
            52,
            new Color(202, 170, 235, 255),
            () => {
                const partners = this.getUnlockedPartners();
                const maxPage = Math.max(0, Math.ceil(partners.length / 6) - 1);
                this.partnerPage = Math.min(maxPage, this.partnerPage + 1);
                this.renderPartnerPage();
            },
        );
        this.createPanelButton(
            panel,
            'ClosePartnerPanel',
            '关闭',
            new Vec3(0, -410),
            230,
            50,
            new Color(213, 182, 225, 255),
            () => this.closePartnerPanel(),
        );
        this.partnerModal = modal;
        this.renderPartnerPage();
    }

    private getUnlockedPartners(): PartnerSupport[] {
        return PARTNERS.filter((partner) => (
            this.progress.unlockedCharacters.indexOf(partner.id) >= 0
        ));
    }

    private renderPartnerPage(): void {
        if (!this.partnerList?.isValid) {
            return;
        }
        for (const child of [...this.partnerList.children]) {
            child.destroy();
        }
        const partners = this.getUnlockedPartners();
        const totalPages = Math.max(1, Math.ceil(partners.length / 6));
        this.partnerPage = Math.max(0, Math.min(totalPages - 1, this.partnerPage));
        if (this.partnerPageLabel?.isValid) {
            this.partnerPageLabel.string = `${this.partnerPage + 1} / ${totalPages}　已解锁 ${partners.length} 人`;
        }
        if (partners.length === 0) {
            this.addLabel(
                this.partnerList,
                'NoPartners',
                '还没有可支援的男性角色\n先完成剧情解锁图鉴角色',
                21,
                new Color(138, 99, 143, 230),
                new Vec3(0, 50),
                440,
                90,
                true,
            );
            return;
        }

        const pagePartners = partners.slice(this.partnerPage * 6, this.partnerPage * 6 + 6);
        const columns = [-155, 155];
        const rows = [245, 55, -135];
        pagePartners.forEach((partner, index) => {
            this.createPartnerCard(
                partner,
                columns[index % 2],
                rows[Math.floor(index / 2)],
            );
        });
    }

    private createPartnerCard(partner: PartnerSupport, x: number, y: number): void {
        if (!this.partnerList?.isValid) {
            return;
        }
        const active = this.progress.activePartner === partner.id;
        const card = this.createNode(`Partner_${partner.id}`, this.partnerList);
        card.setPosition(x, y);
        card.getComponent(UITransform)?.setContentSize(280, 156);
        const graphics = card.addComponent(Graphics);
        graphics.fillColor = active
            ? new Color(partner.accent.r, partner.accent.g, partner.accent.b, 88)
            : new Color(255, 251, 254, 240);
        graphics.strokeColor = active ? partner.accent : new Color(238, 219, 239, 230);
        graphics.lineWidth = active ? 4 : 2;
        graphics.roundRect(-140, -78, 280, 156, 24);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = partner.accent;
        graphics.circle(-105, 22, 24);
        graphics.fill();
        this.addLabel(
            card,
            'PartnerName',
            partner.name,
            21,
            new Color(101, 65, 110, 255),
            new Vec3(20, 38),
            190,
            32,
            true,
        );
        this.addLabel(
            card,
            'PartnerRole',
            partner.role,
            15,
            new Color(146, 99, 147, 230),
            new Vec3(20, 7),
            190,
            26,
            true,
        );
        this.addLabel(
            card,
            'PartnerSupport',
            this.partnerSupportText(partner),
            15,
            new Color(126, 82, 136, 255),
            new Vec3(0, -34),
            240,
            42,
            true,
        );
        if (active) {
            this.addLabel(
                card,
                'ActiveTag',
                '支援中',
                14,
                new Color(190, 75, 138, 255),
                new Vec3(92, 56),
                76,
                28,
                true,
            );
        }
        this.makeInteractive(card, () => {
            this.progress = {
                ...this.progress,
                activePartner: partner.id,
            };
            saveProgress(this.progress);
            this.updatePartnerButtonLabel();
            if (this.partnerActiveLabel?.isValid) {
                this.partnerActiveLabel.string = `当前：${partner.name} · ${this.partnerSupportText(partner)}`;
            }
            this.renderPartnerPage();
            gameFeel.play('success');
        });
    }

    private partnerSupportText(partner: PartnerSupport): string {
        const statName = {
            wisdom: '才智',
            beauty: '美貌',
            emotion: '情商',
            insight: '洞察',
        }[partner.stat];
        const jobNames: Record<string, string> = {
            cafe: '咖啡',
            sweet: '甜品',
            stage: '舞台',
        };
        const jobText = ['cafe', 'sweet', 'stage']
            .filter((job) => Boolean(partner.jobBonuses[job]))
            .map((job) => `${jobNames[job]}+${partner.jobBonuses[job]}`)
            .join(' ');
        return `${statName}+${partner.statBonus}  ${jobText}`;
    }

    private updatePartnerButtonLabel(): void {
        const partner = getPartnerSupport(this.progress.activePartner);
        if (this.partnerButtonLabel?.isValid) {
            this.partnerButtonLabel.string = partner ? `搭档\n${partner.name}` : '选择搭档';
        }
    }

    private closePartnerPanel(): void {
        if (this.partnerModal?.isValid) {
            this.partnerModal.destroy();
        }
        this.partnerModal = null;
        this.partnerList = null;
        this.partnerPageLabel = null;
        this.partnerActiveLabel = null;
        this.updateJobProximity();
    }

    private updateJobProximity(): void {
        if (!this.jobPromptButton?.isValid) {
            return;
        }
        if (
            this.jobModal?.isValid
            || this.wardrobeModal?.isValid
            || this.partnerModal?.isValid
        ) {
            this.jobPromptButton.active = false;
            return;
        }

        let nearest: CityJob | null = null;
        let nearestDistance = 120 * 120;
        for (const job of CITY_JOBS) {
            const dx = this.player.position.x - job.x;
            const dy = this.player.position.y - job.y;
            const distance = dx * dx + dy * dy;
            if (distance < nearestDistance) {
                nearest = job;
                nearestDistance = distance;
            }
        }
        this.currentJob = nearest;
        this.jobPromptButton.active = Boolean(nearest);
        if (nearest && this.jobPromptLabel?.isValid) {
            this.jobPromptLabel.string = `${nearest.building}\n${nearest.action}`;
        }
    }

    private openCurrentJob(): void {
        if (!this.currentJob || this.jobModal?.isValid) {
            return;
        }
        const job = this.currentJob;
        this.jobPromptButton.active = false;
        this.jobActive = false;
        this.jobCompleted = false;
        this.jobRound = 0;
        this.jobRoundIncome = 0;
        this.jobTotalIncome = 0;

        const modal = this.createNode('JobModal', this.modalLayer);
        modal.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        modal.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(47, 28, 57, 165);
        shade.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        shade.fill();

        const panel = this.createNode('JobPanel', modal);
        panel.setPosition(0, 15);
        panel.getComponent(UITransform)?.setContentSize(620, 610);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(255, 247, 252, 252);
        graphics.strokeColor = job.accent;
        graphics.lineWidth = 5;
        graphics.roundRect(-310, -305, 620, 610, 38);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = job.accent;
        graphics.roundRect(-132, 222, 264, 62, 31);
        graphics.fill();

        this.addLabel(
            panel,
            'JobTitle',
            job.building,
            31,
            Color.WHITE,
            new Vec3(0, 253),
            450,
            56,
            true,
        );
        this.addLabel(
            panel,
            'JobSubtitle',
            `${job.action} · 三轮时机判定`,
            20,
            new Color(137, 91, 139, 235),
            new Vec3(0, 187),
            480,
            38,
            true,
        );

        this.jobTrack = this.createNode('JobTimingTrack', panel);
        this.jobTrack.setPosition(0, 75);
        this.jobTrack.getComponent(UITransform)?.setContentSize(500, 70);
        const trackGraphics = this.jobTrack.addComponent(Graphics);
        trackGraphics.fillColor = new Color(247, 226, 241, 245);
        trackGraphics.roundRect(-250, -20, 500, 40, 20);
        trackGraphics.fill();
        trackGraphics.strokeColor = new Color(255, 255, 255, 235);
        trackGraphics.lineWidth = 2;
        trackGraphics.roundRect(-250, -20, 500, 40, 20);
        trackGraphics.stroke();

        this.jobTarget = this.createNode('JobTargetZone', this.jobTrack);
        this.jobTarget.getComponent(UITransform)?.setContentSize(72, 48);
        const targetGraphics = this.jobTarget.addComponent(Graphics);
        targetGraphics.fillColor = new Color(job.accent.r, job.accent.g, job.accent.b, 145);
        targetGraphics.roundRect(-36, -24, 72, 48, 15);
        targetGraphics.fill();

        this.jobMarker = this.createNode('JobMarker', this.jobTrack);
        this.jobMarker.getComponent(UITransform)?.setContentSize(18, 54);
        const markerGraphics = this.jobMarker.addComponent(Graphics);
        markerGraphics.fillColor = new Color(112, 69, 120, 255);
        markerGraphics.roundRect(-9, -27, 18, 54, 9);
        markerGraphics.fill();

        this.jobStatusLabel = this.addLabel(
            panel,
            'JobStatus',
            '点击“停止”，让指针落在高亮区域',
            21,
            new Color(100, 67, 108, 255),
            new Vec3(0, -32),
            510,
            50,
            true,
        );
        this.jobCoinLabel = this.addLabel(
            panel,
            'JobCoinLabel',
            `当前金币：${this.progress.coins}`,
            18,
            new Color(159, 109, 80, 245),
            new Vec3(0, -84),
            360,
            36,
            true,
        );
        const actionButton = this.createPanelButton(
            panel,
            'JobActionButton',
            '停止',
            new Vec3(0, -165),
            300,
            74,
            job.accent,
            () => this.handleJobAction(),
        );
        this.jobStopLabel = actionButton
            .getChildByName('ButtonLabel')
            ?.getComponent(Label) ?? null;
        this.createPanelButton(
            panel,
            'CloseJobButton',
            '暂时离开',
            new Vec3(0, -252),
            230,
            50,
            new Color(218, 197, 229, 255),
            () => this.closeJobModal(),
        );

        this.jobModal = modal;
        this.beginJobRound();
    }

    private createPanelButton(
        parent: Node,
        name: string,
        text: string,
        position: Vec3,
        width: number,
        height: number,
        accent: Color,
        onTap: () => void,
    ): Node {
        const button = this.createNode(name, parent);
        button.setPosition(position);
        button.getComponent(UITransform)?.setContentSize(width, height);
        const graphics = button.addComponent(Graphics);
        graphics.fillColor = new Color(255, 250, 253, 245);
        graphics.strokeColor = accent;
        graphics.lineWidth = 4;
        graphics.roundRect(-width / 2, -height / 2, width, height, height / 2);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(accent.r, accent.g, accent.b, 45);
        graphics.roundRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16, (height - 16) / 2);
        graphics.fill();
        this.addLabel(
            button,
            'ButtonLabel',
            text,
            24,
            new Color(107, 68, 114, 255),
            Vec3.ZERO,
            width - 28,
            height - 18,
            true,
        );
        this.makeInteractive(button, onTap);
        return button;
    }

    private beginJobRound(): void {
        if (!this.jobModal?.isValid || !this.jobMarker?.isValid || !this.jobTarget?.isValid) {
            return;
        }
        if (this.jobRound >= 3) {
            this.jobCompleted = true;
            this.jobActive = false;
            if (this.jobStatusLabel?.isValid) {
                this.jobStatusLabel.string = `工作完成 · 本次收入 ${this.jobTotalIncome} 金币`;
            }
            if (this.jobStopLabel?.isValid) {
                this.jobStopLabel.string = '再做一次';
            }
            this.jobMarker.active = false;
            this.jobTarget.active = false;
            return;
        }

        this.jobRound += 1;
        this.jobRoundIncome = 0;
        this.jobTargetValue = -0.72 + Math.random() * 1.44;
        this.jobTarget.setPosition(225 * this.jobTargetValue, 0);
        this.jobTarget.active = true;
        this.jobMarker.active = true;
        this.jobMarkerValue = -1;
        this.jobDirection = 1;
        this.jobSpeed = 1.12 + this.jobRound * 0.22;
        this.jobActive = true;
        this.jobCompleted = false;
        if (this.jobStatusLabel?.isValid) {
            this.jobStatusLabel.string = `第 ${this.jobRound} / 3 轮 · 点击“停止”`;
        }
        if (this.jobStopLabel?.isValid) {
            this.jobStopLabel.string = '停止';
        }
    }

    private updateJob(deltaTime: number): void {
        if (!this.jobActive || !this.jobMarker?.isValid) {
            return;
        }
        this.jobMarkerValue += this.jobDirection * this.jobSpeed * deltaTime;
        if (this.jobMarkerValue >= 1) {
            this.jobMarkerValue = 1;
            this.jobDirection = -1;
        } else if (this.jobMarkerValue <= -1) {
            this.jobMarkerValue = -1;
            this.jobDirection = 1;
        }
        this.jobMarker.setPosition(225 * this.jobMarkerValue, 0);
    }

    private handleJobAction(): void {
        if (this.jobActive) {
            this.stopJobRound();
            return;
        }
        if (this.jobCompleted) {
            this.jobRound = 0;
            this.jobTotalIncome = 0;
            this.jobCompleted = false;
        }
        this.beginJobRound();
    }

    private stopJobRound(): void {
        if (!this.jobActive || !this.currentJob) {
            return;
        }
        this.jobActive = false;
        const distance = Math.abs(this.jobMarkerValue - this.jobTargetValue);
        const accuracy = Math.max(0, Math.min(1, 1 - distance / 0.38));
        const partner = getPartnerSupport(this.progress.activePartner);
        const partnerBonus = partner?.jobBonuses[this.currentJob.id] ?? 0;
        const reward = this.currentJob.baseReward
            + Math.round(this.currentJob.bonusReward * accuracy)
            + partnerBonus;
        this.jobRoundIncome += reward;
        this.jobTotalIncome += reward;
        this.progress = {
            ...this.progress,
            coins: this.progress.coins + reward,
        };
        saveProgress(this.progress);
        this.updateCoinLabel();
        gameFeel.play('success');
        if (this.jobStatusLabel?.isValid) {
            this.jobStatusLabel.string = `本轮 +${reward} 金币 · 准确度 ${Math.round(accuracy * 100)}%`
                + (partnerBonus > 0 ? ` · 搭档 +${partnerBonus}` : '');
        }
        if (this.jobRound >= 3) {
            this.jobCompleted = true;
            if (this.jobMarker?.isValid) {
                this.jobMarker.active = false;
            }
            if (this.jobTarget?.isValid) {
                this.jobTarget.active = false;
            }
            if (this.jobStopLabel?.isValid) {
                this.jobStopLabel.string = '再做一次';
            }
        } else if (this.jobStopLabel?.isValid) {
            this.jobStopLabel.string = '下一轮';
        }
    }

    private closeJobModal(): void {
        this.jobActive = false;
        this.jobCompleted = false;
        if (this.jobModal?.isValid) {
            this.jobModal.destroy();
        }
        this.jobModal = null;
        this.jobTrack = null;
        this.jobMarker = null;
        this.jobTarget = null;
        this.jobStatusLabel = null;
        this.jobStopLabel = null;
        this.jobCoinLabel = null;
        this.updateJobProximity();
    }

    private updateCoinLabel(): void {
        if (this.coinLabel?.isValid) {
            this.coinLabel.string = `金币 ${this.progress.coins}`;
        }
        if (this.jobCoinLabel?.isValid) {
            this.jobCoinLabel.string = `当前金币：${this.progress.coins}`;
        }
        if (this.wardrobeCoinLabel?.isValid) {
            this.wardrobeCoinLabel.string = `金币 ${this.progress.coins}`;
        }
    }

    private bindKeyboard(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    private onKeyDown(event: EventKeyboard): void {
        this.keyboard.add(event.keyCode);
    }

    private onKeyUp(event: EventKeyboard): void {
        this.keyboard.delete(event.keyCode);
    }

    private isPressed(key: KeyCode): boolean {
        return this.keyboard.has(key);
    }

    private isBlocked(x: number, y: number): boolean {
        if (
            x - PLAYER_RADIUS < -MAP_WIDTH / 2
            || x + PLAYER_RADIUS > MAP_WIDTH / 2
            || y - PLAYER_RADIUS < -MAP_HEIGHT / 2
            || y + PLAYER_RADIUS > MAP_HEIGHT / 2
        ) {
            return true;
        }
        for (const box of this.collisions) {
            if (
                x + PLAYER_RADIUS > box.left
                && x - PLAYER_RADIUS < box.right
                && y + PLAYER_RADIUS > box.bottom
                && y - PLAYER_RADIUS < box.top
            ) {
                return true;
            }
        }
        return false;
    }

    private updateCamera(): void {
        const maxOffsetX = Math.max(0, MAP_WIDTH / 2 - DESIGN_WIDTH / 2);
        const maxOffsetY = Math.max(0, MAP_HEIGHT / 2 - DESIGN_HEIGHT / 2);
        this.worldRoot.setPosition(
            Math.max(-maxOffsetX, Math.min(maxOffsetX, -this.player.position.x)),
            Math.max(-maxOffsetY, Math.min(maxOffsetY, -this.player.position.y)),
        );
    }

    private updateLocation(): void {
        let location = '甜品住宅街';
        if (this.player.position.y > 780) {
            location = '樱花钟楼广场';
        } else if (this.player.position.y > 120) {
            location = '花街商铺区';
        } else if (this.player.position.y > -620) {
            location = '中央喷泉街';
        }
        if (location !== this.lastLocation && this.locationLabel?.isValid) {
            this.lastLocation = location;
            this.locationLabel.string = location;
        }
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

    private createLayer(name: string, parent?: Node): Node {
        const node = this.createNode(name, parent ?? this.node);
        node.getComponent(UITransform)?.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
        return node;
    }

    private createNode(name: string, parent: Node): Node {
        const node = new Node(name);
        node.layer = parent.layer;
        parent.addChild(node);
        node.addComponent(UITransform);
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
        const labelNode = this.createNode(name, parent);
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
        label.outlineColor = new Color(255, 255, 255, 110);
        label.outlineWidth = 1;
        return label;
    }
}
