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
    sys,
    tween,
    UITransform,
    UIOpacity,
    Vec3,
    VerticalTextAlignment,
} from 'cc';
import { gameFeel } from './GameFeel';
import {
    collectFlower,
    getBond,
    getCharmBreakdown,
    loadProgress,
    PlayerProgress,
    saveProgress,
} from './GameProgress';
import { getOutfit, OUTFITS, OutfitDefinition } from './WardrobeData';
import {
    getPartnerSupport,
    getPartnerPortraitPath,
    PARTNERS,
    PartnerSupport,
} from './PartnerData';
import {
    getPartnerVenueId,
    setActiveVenue,
    VENUES,
    VenueDefinition,
} from './VenueData';
import {
    SKILLS,
    ROLE_TASKS,
    RoleTaskDefinition,
    RoleTaskRequirement,
    SkillDefinition,
    TASKS,
    TaskDefinition,
} from './TaskData';
import { COSMETICS, CosmeticDefinition } from './BeautyData';
import { ECONOMY, JOB_REWARDS } from './EconomyData';
import { backNavigation, navigateTo } from './BackNavigation';

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

interface FlowerSpot {
    id: string;
    x: number;
    y: number;
    accent: Color;
}

interface IsometricBuildingDefinition {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    body: Color;
    roof: Color;
    accent: Color;
    sign: string;
    style?: 'cafe' | 'innovation' | 'home' | 'stage' | 'tower';
}

type TaskView = 'jobs' | 'roles';

const ISO_CITY_LEFT = -MAP_WIDTH / 2;
const ISO_CITY_RIGHT = MAP_WIDTH / 2;
const ISO_CITY_BOTTOM = -MAP_HEIGHT / 2;
const ISO_CITY_TOP = MAP_HEIGHT / 2;
const ISO_BUILDING_SKEW_X = 54;
const ISO_BUILDING_DEPTH = 86;
const HOME_ENTER_KEY = 'loverman.home.enter';
const HOME_ENTRANCE_X = -425;
const HOME_ENTRANCE_Y = -650;

const CITY_ISO_BUILDINGS: IsometricBuildingDefinition[] = [
    {
        name: '樱花钟楼',
        x: 0,
        y: 880,
        width: 300,
        height: 240,
        body: new Color(247, 223, 238, 255),
        roof: new Color(131, 94, 154, 255),
        accent: new Color(203, 166, 225, 255),
        sign: 'SAKURA CLOCK',
        style: 'tower',
    },
    {
        name: '花街咖啡馆',
        x: -425,
        y: 900,
        width: 320,
        height: 300,
        body: new Color(255, 216, 229, 255),
        roof: new Color(190, 128, 170, 255),
        accent: new Color(231, 158, 170, 255),
        sign: 'CAFE & FLOWERS',
        style: 'cafe',
    },
    {
        name: '星环创新中心',
        x: 425,
        y: 880,
        width: 340,
        height: 370,
        body: new Color(224, 232, 250, 255),
        roof: new Color(132, 149, 205, 255),
        accent: new Color(110, 156, 217, 255),
        sign: 'STAR RING',
        style: 'innovation',
    },
    {
        name: '月光书室',
        x: -425,
        y: 360,
        width: 310,
        height: 258,
        body: new Color(237, 225, 250, 255),
        roof: new Color(143, 124, 190, 255),
        accent: new Color(145, 150, 220, 255),
        sign: 'MOONLIGHT BOOKS',
    },
    {
        name: '甜心商店',
        x: 425,
        y: 340,
        width: 310,
        height: 266,
        body: new Color(255, 226, 235, 255),
        roof: new Color(207, 126, 160, 255),
        accent: new Color(246, 155, 181, 255),
        sign: 'SWEET HEART',
    },
    {
        name: '仁心医院',
        x: -425,
        y: -170,
        width: 310,
        height: 230,
        body: new Color(226, 246, 244, 255),
        roof: new Color(125, 179, 183, 255),
        accent: new Color(127, 190, 190, 255),
        sign: 'KIND HEART',
    },
    {
        name: '夜轨赛车工坊',
        x: 425,
        y: -210,
        width: 310,
        height: 230,
        body: new Color(245, 225, 229, 255),
        roof: new Color(145, 119, 132, 255),
        accent: new Color(218, 107, 119, 255),
        sign: 'NIGHT RAIL',
    },
    {
        name: '花语公寓',
        x: -425,
        y: -790,
        width: 330,
        height: 350,
        body: new Color(244, 218, 241, 255),
        roof: new Color(162, 120, 180, 255),
        accent: new Color(203, 142, 194, 255),
        sign: 'FLOWER HOME',
        style: 'home',
    },
    {
        name: '星屑剧场',
        x: 425,
        y: -800,
        width: 330,
        height: 360,
        body: new Color(255, 219, 234, 255),
        roof: new Color(194, 124, 171, 255),
        accent: new Color(164, 143, 226, 255),
        sign: 'STARDUST THEATRE',
        style: 'stage',
    },
];

const CITY_JOBS: CityJob[] = [
    {
        id: 'cafe',
        building: '花街咖啡馆',
        action: '冲煮咖啡',
        x: -610,
        y: 640,
        baseReward: JOB_REWARDS.cafe.base,
        bonusReward: JOB_REWARDS.cafe.bonus,
        accent: new Color(238, 150, 190, 255),
    },
    {
        id: 'sweet',
        building: '甜心商店',
        action: '装饰蛋糕',
        x: 590,
        y: 130,
        baseReward: JOB_REWARDS.sweet.base,
        bonusReward: JOB_REWARDS.sweet.bonus,
        accent: new Color(246, 170, 132, 255),
    },
    {
        id: 'stage',
        building: '星屑剧场',
        action: '整理舞台',
        x: 590,
        y: -1005,
        baseReward: JOB_REWARDS.stage.base,
        bonusReward: JOB_REWARDS.stage.bonus,
        accent: new Color(186, 143, 229, 255),
    },
];

const FLOWER_SPOTS: FlowerSpot[] = [
    { id: 'flower-1', x: -260, y: 1130, accent: new Color(255, 149, 195, 255) },
    { id: 'flower-2', x: 155, y: 930, accent: new Color(247, 172, 214, 255) },
    { id: 'flower-3', x: -155, y: 500, accent: new Color(222, 174, 242, 255) },
    { id: 'flower-4', x: 150, y: 120, accent: new Color(255, 191, 208, 255) },
    { id: 'flower-5', x: -150, y: -260, accent: new Color(242, 156, 204, 255) },
    { id: 'flower-6', x: 150, y: -1180, accent: new Color(213, 177, 240, 255) },
];

@ccclass('CityExplore')
export class CityExplore extends Component {
    private worldRoot!: Node;
    private buildingLayer!: Node;
    private decorationLayer!: Node;
    private isoDepthLayer!: Node;
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
    private coinPill!: Node;
    private charmPill!: Node;
    private jobPromptButton!: Node;
    private jobPromptLabel!: Label;
    private venuePromptButton!: Node;
    private venuePromptLabel!: Label;
    private currentJob: CityJob | null = null;
    private currentVenue: VenueDefinition | null = null;
    private currentHome = false;
    private jobModal: Node | null = null;
    private jobTrack: Node | null = null;
    private jobMarker: Node | null = null;
    private jobTarget: Node | null = null;
    private jobStatusLabel: Label | null = null;
    private jobStopLabel: Label | null = null;
    private jobCoinLabel: Label | null = null;
    private playerOutfitAccessory: Node | null = null;
    private wardrobeModal: Node | null = null;
    private wardrobeList: Node | null = null;
    private wardrobeCoinLabel: Label | null = null;
    private wardrobeMessageLabel: Label | null = null;
    private wardrobePreviewVisual: Node | null = null;
    private wardrobePreviewCaption: Label | null = null;
    private menuBadge: Node | null = null;
    private menuBadgeLabel: Label | null = null;
    private charmLabel!: Label;
    private partnerModal: Node | null = null;
    private taskModal: Node | null = null;
    private taskContent: Node | null = null;
    private taskMessageLabel: Label | null = null;
    private taskView: TaskView = 'jobs';
    private roleTaskPage = 0;
    private beautyModal: Node | null = null;
    private beautyContent: Node | null = null;
    private beautyCharmLabel: Label | null = null;
    private maleDialogueModal: Node | null = null;
    private cityMenuModal: Node | null = null;
    private placeModal: Node | null = null;
    private exitModal: Node | null = null;
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
    private isoDepthNodes: Node[] = [];
    private maleNpcNodes: Node[] = [];
    private lastLocation = '';

    protected start(): void {
        this.progress = loadProgress();
        if (!this.progress.onboardingComplete) {
            navigateTo('CharacterCustomization');
            return;
        }
        gameFeel.init();
        backNavigation.mount(() => this.handleBack());
        this.createLayers();
        this.createWorld();
        this.createPlayer();
        this.createMaleNpcs();
        this.createHud();
        this.bindKeyboard();
        this.updateCamera();
        gameFeel.fadeIn(this.node);
    }

    private handleBack(): boolean {
        if (this.exitModal?.isValid) {
            backNavigation.exitGame();
            return true;
        }
        if (this.placeModal?.isValid) {
            this.placeModal.destroy();
            this.placeModal = null;
            return true;
        }
        if (this.cityMenuModal?.isValid) {
            this.closeCityMenu();
            return true;
        }
        if (this.maleDialogueModal?.isValid) {
            this.closeMaleDialogue();
            return true;
        }
        if (this.jobModal?.isValid) {
            this.closeJobModal();
            return true;
        }
        if (this.wardrobeModal?.isValid) {
            this.closeWardrobe();
            return true;
        }
        if (this.partnerModal?.isValid) {
            this.closePartnerPanel();
            return true;
        }
        if (this.taskModal?.isValid) {
            this.closeTaskPanel();
            return true;
        }
        if (this.beautyModal?.isValid) {
            this.closeBeautyStudio();
            return true;
        }
        this.showExitConfirmation();
        return true;
    }

    private showExitConfirmation(): void {
        if (this.exitModal?.isValid) {
            return;
        }
        this.jobPromptButton.active = false;
        this.venuePromptButton.active = false;
        const modal = this.createNode('ExitConfirmation', this.modalLayer);
        modal.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        modal.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(42, 27, 53, 172);
        shade.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        shade.fill();

        const panel = this.createNode('ExitConfirmationPanel', modal);
        panel.setPosition(0, 18);
        panel.getComponent(UITransform)?.setContentSize(570, 390);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(255, 248, 252, 252);
        graphics.strokeColor = new Color(208, 163, 219, 255);
        graphics.lineWidth = 5;
        graphics.roundRect(-285, -195, 570, 390, 38);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(206, 153, 217, 255);
        graphics.roundRect(-112, 125, 224, 58, 29);
        graphics.fill();
        this.addLabel(panel, 'ExitTitle', '离开樱花街？', 29, Color.WHITE, new Vec3(0, 154), 360, 50, true);
        this.addLabel(
            panel,
            'ExitMessage',
            '当前进度会在每次获得金币、礼物、服装和好感时保存。\n\n'
                + '返回键会关闭当前弹窗；在街区首页再次返回将退出游戏。',
            19,
            new Color(100, 66, 108, 255),
            new Vec3(0, 30),
            470,
            140,
            true,
        );
        this.createPanelButton(
            panel,
            'ConfirmExit',
            '退出游戏',
            new Vec3(-125, -128),
            210,
            58,
            new Color(226, 145, 176, 255),
            () => backNavigation.exitGame(),
        );
        this.createPanelButton(
            panel,
            'CancelExit',
            '继续散步',
            new Vec3(125, -128),
            210,
            58,
            new Color(197, 176, 221, 255),
            () => {
                if (this.exitModal === modal) {
                    this.exitModal = null;
                }
                modal.destroy();
            },
        );
        this.exitModal = modal;
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
            || this.taskModal?.isValid
            || this.beautyModal?.isValid
            || this.maleDialogueModal?.isValid
            || this.cityMenuModal?.isValid
            || this.placeModal?.isValid
            || this.exitModal?.isValid
        ) {
            if (this.jobActive) {
                this.updateJob(deltaTime);
            }
            return;
        }
        this.updateJobProximity();
        this.updateVenueProximity();

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
        this.updateCityDepthPresentation();
        this.updateLocation();
    }

    private createLayers(): void {
        this.worldRoot = this.createLayer('WorldRoot');
        this.decorationLayer = this.createLayer('CityDecorationLayer', this.worldRoot);
        this.buildingLayer = this.createLayer('BuildingLayer', this.worldRoot);
        this.isoDepthLayer = this.createLayer('CityDepthLayer', this.worldRoot);
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
        this.createIsometricCityDistrict();
        this.createBuildings();
        this.createFountain(0, 420);
        this.createCentralDateBenches();
        this.createTrees();
        this.createIsometricStreetProps();
        this.createJobMarkers();
        this.createVenueMarkers();
        this.createHomeEntranceMarker();
        this.createFlowerPickups();
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

    private createIsometricCityDistrict(): void {
        const surface = this.createNode('IsometricCitySurface', this.decorationLayer);
        surface.getComponent(UITransform)?.setContentSize(
            ISO_CITY_RIGHT - ISO_CITY_LEFT,
            ISO_CITY_TOP - ISO_CITY_BOTTOM,
        );
        const graphics = surface.addComponent(Graphics);

        graphics.fillColor = new Color(248, 218, 234, 255);
        graphics.rect(
            ISO_CITY_LEFT,
            ISO_CITY_BOTTOM,
            ISO_CITY_RIGHT - ISO_CITY_LEFT,
            ISO_CITY_TOP - ISO_CITY_BOTTOM,
        );
        graphics.fill();

        graphics.fillColor = new Color(255, 236, 245, 235);
        graphics.ellipse(0, 900, 640, 230);
        graphics.ellipse(0, -820, 660, 250);
        graphics.fill();

        graphics.fillColor = new Color(255, 232, 241, 255);
        graphics.moveTo(-310, ISO_CITY_BOTTOM);
        graphics.lineTo(310, ISO_CITY_BOTTOM);
        graphics.lineTo(230, ISO_CITY_TOP);
        graphics.lineTo(-230, ISO_CITY_TOP);
        graphics.close();
        graphics.fill();

        graphics.fillColor = new Color(229, 210, 231, 255);
        graphics.moveTo(-500, ISO_CITY_BOTTOM);
        graphics.lineTo(-310, ISO_CITY_BOTTOM);
        graphics.lineTo(-230, ISO_CITY_TOP);
        graphics.lineTo(-430, ISO_CITY_TOP);
        graphics.close();
        graphics.fill();
        graphics.moveTo(310, ISO_CITY_BOTTOM);
        graphics.lineTo(500, ISO_CITY_BOTTOM);
        graphics.lineTo(430, ISO_CITY_TOP);
        graphics.lineTo(230, ISO_CITY_TOP);
        graphics.close();
        graphics.fill();

        graphics.fillColor = new Color(247, 236, 247, 255);
        graphics.rect(-126, ISO_CITY_BOTTOM, 252, ISO_CITY_TOP - ISO_CITY_BOTTOM);
        graphics.fill();

        graphics.strokeColor = new Color(255, 250, 252, 190);
        graphics.lineWidth = 4;
        for (let index = 0; index < 31; index += 1) {
            const topRatio = index / 30;
            const y = ISO_CITY_BOTTOM + topRatio * (ISO_CITY_TOP - ISO_CITY_BOTTOM);
            const halfWidth = 300 - topRatio * 72;
            graphics.moveTo(-halfWidth, y);
            graphics.lineTo(halfWidth, y);
        }
        graphics.stroke();

        graphics.strokeColor = new Color(221, 174, 210, 150);
        graphics.lineWidth = 2;
        for (let index = -3; index <= 3; index += 1) {
            graphics.moveTo(index * 72, ISO_CITY_BOTTOM);
            graphics.lineTo(index * 54, ISO_CITY_TOP);
        }
        graphics.stroke();

        graphics.fillColor = new Color(255, 225, 236, 255);
        graphics.ellipse(0, 420, 390, 190);
        graphics.fill();
        graphics.strokeColor = new Color(255, 247, 250, 245);
        graphics.lineWidth = 8;
        graphics.ellipse(0, 420, 360, 166);
        graphics.stroke();
        graphics.strokeColor = new Color(221, 166, 203, 220);
        graphics.lineWidth = 4;
        graphics.ellipse(0, 420, 325, 141);
        graphics.stroke();

        graphics.strokeColor = new Color(255, 255, 255, 170);
        graphics.lineWidth = 3;
        graphics.ellipse(0, 420, 292, 118);
        graphics.stroke();

        graphics.fillColor = new Color(255, 244, 249, 245);
        graphics.moveTo(-390, 420);
        graphics.lineTo(-500, 230);
        graphics.lineTo(-500, 610);
        graphics.close();
        graphics.fill();
        graphics.moveTo(390, 420);
        graphics.lineTo(500, 610);
        graphics.lineTo(500, 230);
        graphics.close();
        graphics.fill();

        graphics.strokeColor = new Color(255, 248, 252, 210);
        graphics.lineWidth = 5;
        graphics.ellipse(0, 900, 560, 178);
        graphics.ellipse(0, -820, 580, 198);
        graphics.stroke();
        graphics.strokeColor = new Color(222, 173, 209, 165);
        graphics.lineWidth = 3;
        graphics.ellipse(0, 900, 515, 148);
        graphics.ellipse(0, -820, 535, 166);
        graphics.stroke();
    }

    private createIsometricBuilding(config: IsometricBuildingDefinition): void {
        const building = this.createNode(config.name, this.isoDepthLayer);
        building.setPosition(config.x, config.y);
        building.getComponent(UITransform)?.setContentSize(
            config.width + ISO_BUILDING_SKEW_X + 40,
            config.height + ISO_BUILDING_DEPTH + 70,
        );
        const graphics = building.addComponent(Graphics);
        const halfWidth = config.width / 2;
        const sideColor = new Color(
            Math.round(config.body.r * 0.72),
            Math.round(config.body.g * 0.72),
            Math.round(config.body.b * 0.72),
            255,
        );
        const roofShade = new Color(
            Math.round(config.roof.r * 0.82),
            Math.round(config.roof.g * 0.82),
            Math.round(config.roof.b * 0.82),
            255,
        );

        graphics.fillColor = new Color(75, 54, 74, 70);
        graphics.ellipse(18, -16, config.width * 0.58, 30);
        graphics.fill();

        graphics.fillColor = sideColor;
        graphics.moveTo(halfWidth, 0);
        graphics.lineTo(halfWidth + ISO_BUILDING_SKEW_X, ISO_BUILDING_DEPTH);
        graphics.lineTo(
            halfWidth + ISO_BUILDING_SKEW_X,
            config.height + ISO_BUILDING_DEPTH,
        );
        graphics.lineTo(halfWidth, config.height);
        graphics.close();
        graphics.fill();

        graphics.strokeColor = new Color(255, 252, 253, 210);
        graphics.lineWidth = 4;
        const sideWindowRows = Math.max(1, Math.floor((config.height - 72) / 86));
        for (let row = 0; row < sideWindowRows; row += 1) {
            const y = 36 + row * 82;
            graphics.fillColor = new Color(255, 236, 176, 230);
            graphics.moveTo(halfWidth + 17, y);
            graphics.lineTo(halfWidth + ISO_BUILDING_SKEW_X - 12, y + 24);
            graphics.lineTo(halfWidth + ISO_BUILDING_SKEW_X - 12, y + 60);
            graphics.lineTo(halfWidth + 17, y + 38);
            graphics.close();
            graphics.fill();
        }

        graphics.fillColor = config.roof;
        graphics.moveTo(-halfWidth, config.height);
        graphics.lineTo(halfWidth, config.height);
        graphics.lineTo(
            halfWidth + ISO_BUILDING_SKEW_X,
            config.height + ISO_BUILDING_DEPTH,
        );
        graphics.lineTo(
            -halfWidth + ISO_BUILDING_SKEW_X,
            config.height + ISO_BUILDING_DEPTH,
        );
        graphics.close();
        graphics.fill();
        graphics.strokeColor = new Color(255, 250, 253, 220);
        graphics.lineWidth = 4;
        graphics.stroke();

        graphics.fillColor = roofShade;
        graphics.moveTo(-halfWidth + 10, config.height + 10);
        graphics.lineTo(halfWidth - 10, config.height + 10);
        graphics.lineTo(
            halfWidth + ISO_BUILDING_SKEW_X - 20,
            config.height + ISO_BUILDING_DEPTH - 12,
        );
        graphics.lineTo(
            -halfWidth + ISO_BUILDING_SKEW_X + 20,
            config.height + ISO_BUILDING_DEPTH - 12,
        );
        graphics.close();
        graphics.fill();

        graphics.strokeColor = new Color(255, 247, 252, 145);
        graphics.lineWidth = 3;
        for (let index = 1; index <= 3; index += 1) {
            const ratio = index / 4;
            graphics.moveTo(
                -halfWidth + ISO_BUILDING_SKEW_X * ratio,
                config.height + ISO_BUILDING_DEPTH * ratio,
            );
            graphics.lineTo(
                halfWidth + ISO_BUILDING_SKEW_X * ratio,
                config.height + ISO_BUILDING_DEPTH * ratio,
            );
        }
        graphics.stroke();

        graphics.fillColor = config.body;
        graphics.roundRect(-halfWidth, 0, config.width, config.height, 18);
        graphics.fill();
        graphics.strokeColor = new Color(255, 253, 254, 235);
        graphics.lineWidth = 5;
        graphics.roundRect(-halfWidth, 0, config.width, config.height, 18);
        graphics.stroke();

        const windowFill = config.style === 'innovation'
            ? new Color(181, 232, 255, 250)
            : config.style === 'stage'
                ? new Color(255, 222, 240, 250)
                : new Color(255, 243, 190, 250);
        const windowCount = 3;
        const windowWidth = 56;
        const windowGap = 20;
        const windowsWidth = windowCount * windowWidth + (windowCount - 1) * windowGap;
        const windowStart = -windowsWidth / 2;
        const windowRows = config.style === 'tower'
            ? 0
            : config.height >= 300
                ? 2
                : 1;
        for (let row = 0; row < windowRows; row += 1) {
            for (let index = 0; index < windowCount; index += 1) {
                const x = windowStart + index * (windowWidth + windowGap);
                const y = 88 + row * 80;
                graphics.fillColor = windowFill;
                graphics.roundRect(x, y, windowWidth, 64, 14);
                graphics.fill();
                graphics.strokeColor = config.accent;
                graphics.lineWidth = 3;
                graphics.roundRect(x, y, windowWidth, 64, 14);
                graphics.stroke();
                graphics.strokeColor = new Color(255, 255, 255, 180);
                graphics.lineWidth = 2;
                graphics.moveTo(x + windowWidth / 2, y + 6);
                graphics.lineTo(x + windowWidth / 2, y + 58);
                graphics.moveTo(x + 8, y + 32);
                graphics.lineTo(x + windowWidth - 8, y + 32);
                graphics.stroke();
            }
        }

        graphics.fillColor = config.accent;
        graphics.roundRect(-halfWidth + 18, 75, config.width - 36, 22, 10);
        graphics.fill();
        for (let index = 0; index < 8; index += 1) {
            graphics.fillColor = index % 2 === 0
                ? new Color(255, 248, 251, 235)
                : config.accent;
            graphics.roundRect(
                -halfWidth + 32 + index * (config.width - 64) / 8,
                75,
                (config.width - 64) / 16,
                22,
                6,
            );
            graphics.fill();
        }

        if (config.style === 'home') {
            graphics.fillColor = new Color(181, 128, 181, 220);
            graphics.roundRect(-halfWidth + 18, 158, config.width - 36, 10, 5);
            graphics.roundRect(-halfWidth + 18, 238, config.width - 36, 10, 5);
            graphics.fill();
            for (let index = 0; index < 9; index += 1) {
                graphics.fillColor = index % 2 === 0
                    ? new Color(255, 165, 201, 240)
                    : new Color(255, 232, 241, 240);
                graphics.circle(
                    -halfWidth + 38 + index * (config.width - 76) / 8,
                    254,
                    7,
                );
                graphics.fill();
            }
        } else if (config.style === 'innovation') {
            graphics.fillColor = new Color(95, 170, 226, 70);
            graphics.roundRect(-halfWidth + 20, 82, config.width - 40, config.height - 158, 18);
            graphics.fill();
            graphics.strokeColor = new Color(182, 234, 255, 230);
            graphics.lineWidth = 3;
            graphics.moveTo(-halfWidth + 22, config.height - 86);
            graphics.lineTo(halfWidth - 22, config.height - 86);
            graphics.stroke();
        } else if (config.style === 'stage') {
            graphics.fillColor = config.accent;
            graphics.moveTo(-halfWidth, config.height - 10);
            graphics.lineTo(-halfWidth + 24, config.height - 104);
            graphics.lineTo(-halfWidth + 24, config.height - 10);
            graphics.close();
            graphics.fill();
            graphics.moveTo(halfWidth, config.height - 10);
            graphics.lineTo(halfWidth - 24, config.height - 104);
            graphics.lineTo(halfWidth - 24, config.height - 10);
            graphics.close();
            graphics.fill();
            for (let index = 0; index < 9; index += 1) {
                graphics.fillColor = new Color(255, 236, 157, 250);
                graphics.circle(
                    -halfWidth + 24 + index * (config.width - 48) / 8,
                    config.height - 68,
                    5,
                );
                graphics.fill();
            }
        } else if (config.style === 'cafe') {
            graphics.fillColor = new Color(255, 250, 245, 220);
            graphics.roundRect(-halfWidth + 20, 61, config.width - 40, 8, 4);
            graphics.fill();
        } else if (config.style === 'tower') {
            const clockY = config.height - 76;
            graphics.fillColor = config.roof;
            graphics.moveTo(-42, config.height + ISO_BUILDING_DEPTH + 4);
            graphics.lineTo(0, config.height + ISO_BUILDING_DEPTH + 66);
            graphics.lineTo(42, config.height + ISO_BUILDING_DEPTH + 4);
            graphics.close();
            graphics.fill();
            graphics.fillColor = new Color(255, 236, 177, 255);
            graphics.circle(0, config.height + ISO_BUILDING_DEPTH + 68, 8);
            graphics.fill();

            graphics.fillColor = new Color(255, 248, 218, 255);
            graphics.strokeColor = config.roof;
            graphics.lineWidth = 8;
            graphics.circle(0, clockY, 50);
            graphics.fill();
            graphics.stroke();
            graphics.strokeColor = new Color(106, 75, 121, 245);
            graphics.lineWidth = 5;
            graphics.moveTo(0, clockY);
            graphics.lineTo(0, clockY + 31);
            graphics.moveTo(0, clockY);
            graphics.lineTo(24, clockY - 11);
            graphics.stroke();
            for (let index = 0; index < 12; index += 1) {
                const angle = Math.PI * 2 * index / 12;
                graphics.fillColor = config.accent;
                graphics.circle(
                    Math.cos(angle) * 39,
                    clockY + Math.sin(angle) * 39,
                    3,
                );
                graphics.fill();
            }
            graphics.fillColor = config.accent;
            graphics.circle(0, clockY, 8);
            graphics.fill();
        }

        graphics.fillColor = new Color(101, 70, 105, 250);
        graphics.roundRect(-42, 8, 84, 76, 12);
        graphics.fill();
        graphics.fillColor = new Color(255, 225, 171, 235);
        graphics.roundRect(-31, 20, 62, 48, 8);
        graphics.fill();
        graphics.fillColor = new Color(105, 72, 108, 220);
        graphics.circle(0, 45, 5);
        graphics.fill();

        graphics.fillColor = new Color(88, 59, 91, 225);
        graphics.roundRect(-halfWidth + 22, config.height - 62, config.width - 44, 42, 16);
        graphics.fill();
        graphics.strokeColor = new Color(255, 247, 252, 210);
        graphics.lineWidth = 2;
        graphics.roundRect(-halfWidth + 22, config.height - 62, config.width - 44, 42, 16);
        graphics.stroke();

        graphics.fillColor = new Color(255, 237, 246, 245);
        graphics.roundRect(-104, config.height + ISO_BUILDING_DEPTH + 8, 208, 34, 15);
        graphics.fill();

        if (config.style !== 'tower') {
            this.addLabel(
                building,
                'BuildingName',
                config.name,
                20,
                Color.WHITE,
                new Vec3(0, config.height - 41),
                config.width - 64,
                34,
                true,
            );
        }
        if (config.style !== 'tower') {
            this.addLabel(
                building,
                'RoofSign',
                config.sign,
                14,
                new Color(108, 72, 113, 255),
                new Vec3(0, config.height + ISO_BUILDING_DEPTH + 25),
                188,
                26,
                true,
            );
        }

        this.registerIsoDepth(building);
        this.collisions.push({
            left: config.x - halfWidth,
            right: config.x + halfWidth + ISO_BUILDING_SKEW_X,
            bottom: config.y + 8,
            top: config.y + ISO_BUILDING_DEPTH + 12,
        });
    }

    private createBuildings(): void {
        CITY_ISO_BUILDINGS.forEach((building) => {
            this.createIsometricBuilding(building);
        });
    }

    private createFountain(x: number, y: number): void {
        if (this.isInIsometricCity(x, y)) {
            this.createIsometricFountain(x, y);
            return;
        }
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

    private createIsometricFountain(x: number, y: number): void {
        const fountain = this.createNode('SakuraFountain2_5D', this.isoDepthLayer);
        fountain.setPosition(x, y);
        fountain.getComponent(UITransform)?.setContentSize(450, 390);
        const graphics = fountain.addComponent(Graphics);

        graphics.fillColor = new Color(89, 64, 88, 65);
        graphics.ellipse(16, -14, 242, 92);
        graphics.fill();

        graphics.fillColor = new Color(199, 139, 182, 255);
        graphics.moveTo(-176, -8);
        graphics.lineTo(176, -8);
        graphics.lineTo(150, 34);
        graphics.lineTo(-150, 34);
        graphics.close();
        graphics.fill();

        graphics.fillColor = new Color(255, 231, 243, 255);
        graphics.ellipse(0, 27, 184, 74);
        graphics.fill();
        graphics.strokeColor = new Color(209, 145, 192, 255);
        graphics.lineWidth = 8;
        graphics.ellipse(0, 27, 184, 74);
        graphics.stroke();

        graphics.fillColor = new Color(137, 199, 239, 250);
        graphics.ellipse(0, 36, 148, 54);
        graphics.fill();
        graphics.strokeColor = new Color(255, 255, 255, 230);
        graphics.lineWidth = 4;
        graphics.ellipse(0, 40, 112, 35);
        graphics.stroke();

        graphics.fillColor = new Color(255, 231, 243, 255);
        graphics.roundRect(-34, 34, 68, 58, 16);
        graphics.fill();
        graphics.fillColor = new Color(218, 159, 201, 255);
        graphics.roundRect(-24, 82, 48, 94, 13);
        graphics.fill();
        graphics.fillColor = new Color(255, 238, 247, 255);
        graphics.roundRect(-50, 158, 100, 24, 12);
        graphics.fill();
        graphics.fillColor = new Color(217, 160, 204, 255);
        graphics.roundRect(-18, 174, 36, 66, 11);
        graphics.fill();
        graphics.fillColor = new Color(255, 244, 249, 255);
        graphics.circle(0, 244, 28);
        graphics.fill();

        graphics.strokeColor = new Color(177, 225, 246, 245);
        graphics.lineWidth = 6;
        graphics.moveTo(-12, 230);
        graphics.bezierCurveTo(-62, 194, -92, 126, -85, 68);
        graphics.moveTo(12, 230);
        graphics.bezierCurveTo(62, 194, 92, 126, 85, 68);
        graphics.stroke();
        graphics.fillColor = new Color(202, 235, 249, 120);
        graphics.circle(-85, 66, 14);
        graphics.circle(85, 66, 14);
        graphics.fill();

        for (let index = 0; index < 12; index += 1) {
            const angle = Math.PI * 2 * index / 12;
            const radiusX = 154 + (index % 3) * 12;
            graphics.fillColor = index % 2 === 0
                ? new Color(255, 148, 191, 235)
                : new Color(230, 183, 245, 225);
            graphics.ellipse(
                Math.cos(angle) * radiusX,
                36 + Math.sin(angle) * 55,
                10,
                5,
            );
            graphics.fill();
        }

        this.addLabel(
            fountain,
            'FountainLabel',
            '樱花喷泉',
            19,
            new Color(111, 77, 119, 245),
            new Vec3(0, -55),
            190,
            34,
            true,
        );
        this.registerIsoDepth(fountain);
        this.collisions.push({
            left: x - 145,
            right: x + 145,
            bottom: y - 42,
            top: y + 70,
        });
    }

    private createCentralDateBenches(): void {
        const benches = [
            new Vec3(-268, 258),
            new Vec3(268, 238),
        ];
        benches.forEach((position, index) => {
            const bench = this.createNode(`FountainBench_${index}`, this.isoDepthLayer);
            bench.setPosition(position);
            bench.getComponent(UITransform)?.setContentSize(180, 120);
            bench.getComponent(UITransform)?.setAnchorPoint(0.5, 0);
            const graphics = bench.addComponent(Graphics);
            graphics.fillColor = new Color(87, 61, 83, 55);
            graphics.ellipse(0, -3, 86, 20);
            graphics.fill();
            graphics.fillColor = new Color(124, 84, 111, 255);
            graphics.roundRect(-76, 4, 14, 54, 6);
            graphics.roundRect(62, 4, 14, 54, 6);
            graphics.fill();
            graphics.fillColor = new Color(225, 166, 184, 255);
            graphics.roundRect(-86, 48, 172, 18, 9);
            graphics.roundRect(-78, 70, 156, 16, 8);
            graphics.fill();
            graphics.fillColor = new Color(255, 220, 233, 245);
            graphics.roundRect(-82, 82, 164, 12, 6);
            graphics.fill();
            graphics.fillColor = new Color(255, 150, 193, 235);
            graphics.circle(-62, 45, 7);
            graphics.circle(62, 45, 7);
            graphics.fill();
            this.makeInteractive(bench, () => {
                const partner = getPartnerSupport(this.progress.activePartner);
                this.showCityPlaceModal(
                    '喷泉边的长椅',
                    partner
                        ? `你和${partner.name}在喷泉边坐下。\n\n水声和远处的市集人声混在一起，`
                            + '这一刻不需要急着去完成什么。'
                        : '喷泉边的长椅空着。\n\n也许可以邀请一位已经相遇的人，'
                            + '在这里听一会儿水声。',
                    new Color(226, 154, 198, 255),
                );
            });
            this.registerIsoDepth(bench);
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
            if (this.isInIsometricCity(point.x, point.y)) {
                this.createIsometricTree(point);
                continue;
            }
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

    private createIsometricTree(point: Vec3): void {
        const tree = this.createNode('SakuraTree2_5D', this.isoDepthLayer);
        tree.setPosition(point);
        tree.getComponent(UITransform)?.setContentSize(210, 300);
        const graphics = tree.addComponent(Graphics);

        graphics.fillColor = new Color(86, 62, 86, 55);
        graphics.ellipse(14, -5, 95, 30);
        graphics.fill();

        graphics.fillColor = new Color(121, 82, 111, 255);
        graphics.moveTo(-9, 0);
        graphics.lineTo(12, 0);
        graphics.lineTo(24, 92);
        graphics.lineTo(2, 104);
        graphics.close();
        graphics.fill();
        graphics.strokeColor = new Color(238, 171, 197, 190);
        graphics.lineWidth = 3;
        graphics.moveTo(3, 12);
        graphics.lineTo(14, 84);
        graphics.stroke();

        graphics.fillColor = new Color(210, 127, 175, 245);
        graphics.circle(-28, 114, 54);
        graphics.circle(34, 124, 60);
        graphics.circle(4, 164, 56);
        graphics.fill();
        graphics.fillColor = new Color(255, 166, 204, 250);
        graphics.circle(-43, 140, 40);
        graphics.circle(20, 151, 47);
        graphics.circle(62, 110, 33);
        graphics.fill();
        graphics.fillColor = new Color(255, 216, 234, 245);
        graphics.circle(-14, 176, 24);
        graphics.circle(48, 146, 18);
        graphics.fill();
        graphics.fillColor = new Color(255, 246, 251, 220);
        graphics.circle(-28, 188, 10);
        graphics.circle(59, 158, 8);
        graphics.fill();

        for (let index = 0; index < 7; index += 1) {
            graphics.fillColor = new Color(255, 173, 207, 215);
            graphics.circle(
                -88 + (index * 37) % 178,
                96 + (index * 29) % 112,
                3 + index % 3,
            );
            graphics.fill();
        }
        this.registerIsoDepth(tree);
    }

    private createIsometricStreetProps(): void {
        const sign = this.createNode('CentralFountainDistrictSign', this.isoDepthLayer);
        sign.setPosition(0, -585);
        sign.getComponent(UITransform)?.setContentSize(390, 230);
        const graphics = sign.addComponent(Graphics);

        graphics.fillColor = new Color(89, 59, 93, 65);
        graphics.ellipse(0, -5, 170, 24);
        graphics.fill();
        graphics.fillColor = new Color(134, 91, 133, 255);
        graphics.roundRect(-143, 0, 18, 118, 8);
        graphics.roundRect(125, 0, 18, 118, 8);
        graphics.fill();
        graphics.fillColor = new Color(255, 237, 246, 255);
        graphics.strokeColor = new Color(206, 132, 184, 255);
        graphics.lineWidth = 5;
        graphics.roundRect(-172, 102, 344, 92, 26);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(250, 169, 205, 255);
        graphics.roundRect(-153, 118, 306, 60, 18);
        graphics.fill();
        graphics.fillColor = new Color(120, 76, 126, 255);
        graphics.circle(-116, 109, 8);
        graphics.circle(116, 109, 8);
        graphics.fill();

        this.addLabel(
            sign,
            'DistrictSignTitle',
            '中央喷泉街',
            25,
            Color.WHITE,
            new Vec3(0, 153),
            270,
            36,
            true,
        );
        this.addLabel(
            sign,
            'DistrictSignSubtitle',
            'SAKURA CITY · 2.5D',
            13,
            new Color(123, 76, 128, 255),
            new Vec3(0, 127),
            260,
            24,
            true,
        );
        this.registerIsoDepth(sign);

        const lampPoints = [
            new Vec3(-270, 1050),
            new Vec3(270, 1030),
            new Vec3(-270, 850),
            new Vec3(270, 820),
            new Vec3(-318, 60),
            new Vec3(318, 20),
            new Vec3(-318, -350),
            new Vec3(318, -390),
            new Vec3(-318, -560),
            new Vec3(318, -600),
            new Vec3(-285, -780),
            new Vec3(285, -810),
            new Vec3(-285, -1000),
            new Vec3(285, -1030),
            new Vec3(-285, -1200),
            new Vec3(285, -1230),
        ];
        lampPoints.forEach((point, index) => {
            const lamp = this.createNode(`IsoStreetLamp_${index}`, this.isoDepthLayer);
            lamp.setPosition(point);
            lamp.getComponent(UITransform)?.setContentSize(120, 230);
            const lampGraphics = lamp.addComponent(Graphics);
            lampGraphics.fillColor = new Color(255, 231, 174, 38);
            lampGraphics.circle(0, 132, 60);
            lampGraphics.fill();
            lampGraphics.fillColor = new Color(102, 72, 108, 245);
            lampGraphics.roundRect(-4, 0, 8, 116, 4);
            lampGraphics.fill();
            lampGraphics.fillColor = new Color(255, 232, 167, 255);
            lampGraphics.roundRect(-20, 106, 40, 44, 12);
            lampGraphics.fill();
            lampGraphics.strokeColor = new Color(111, 76, 113, 240);
            lampGraphics.lineWidth = 4;
            lampGraphics.roundRect(-20, 106, 40, 44, 12);
            lampGraphics.stroke();
            lampGraphics.fillColor = new Color(255, 248, 214, 255);
            lampGraphics.circle(0, 128, 10);
            lampGraphics.fill();
            this.registerIsoDepth(lamp);
        });
    }

    private createJobMarkers(): void {
        for (const job of CITY_JOBS) {
            const inIsoDistrict = this.isInIsometricCity(job.x, job.y);
            const marker = this.createNode(
                `JobMarker_${job.id}`,
                inIsoDistrict ? this.isoDepthLayer : this.decorationLayer,
            );
            marker.setPosition(job.x, job.y);
            marker.getComponent(UITransform)?.setContentSize(72, 72);
            const graphics = marker.addComponent(Graphics);
            graphics.fillColor = new Color(job.accent.r, job.accent.g, job.accent.b, 45);
            graphics.circle(0, 0, 30);
            graphics.fill();
            graphics.fillColor = new Color(job.accent.r, job.accent.g, job.accent.b, 225);
            graphics.strokeColor = new Color(255, 255, 255, 225);
            graphics.lineWidth = 2;
            graphics.circle(0, 0, 12);
            graphics.fill();
            graphics.stroke();
            graphics.fillColor = new Color(255, 246, 202, 245);
            graphics.circle(0, 0, 4);
            graphics.fill();
            if (inIsoDistrict) {
                this.registerIsoDepth(marker);
            }
        }
    }

    private createVenueMarkers(): void {
        for (const venue of VENUES) {
            const inIsoDistrict = this.isInIsometricCity(
                venue.entranceX,
                venue.entranceY,
            );
            const marker = this.createNode(
                `VenueEntrance_${venue.id}`,
                inIsoDistrict ? this.isoDepthLayer : this.decorationLayer,
            );
            marker.setPosition(venue.entranceX, venue.entranceY);
            marker.getComponent(UITransform)?.setContentSize(90, 42);
            const graphics = marker.addComponent(Graphics);
            graphics.fillColor = new Color(
                venue.accent.r,
                venue.accent.g,
                venue.accent.b,
                55,
            );
            graphics.ellipse(0, -4, 38, 14);
            graphics.fill();
            graphics.fillColor = new Color(
                venue.accent.r,
                venue.accent.g,
                venue.accent.b,
                210,
            );
            graphics.circle(0, 12, 6);
            graphics.fill();
            if (inIsoDistrict) {
                this.registerIsoDepth(marker);
            }
        }
    }

    private createHomeEntranceMarker(): void {
        const marker = this.createNode('HomeEntranceGlow', this.isoDepthLayer);
        marker.setPosition(HOME_ENTRANCE_X, HOME_ENTRANCE_Y);
        marker.getComponent(UITransform)?.setContentSize(100, 50);
        const graphics = marker.addComponent(Graphics);
        graphics.fillColor = new Color(255, 220, 163, 62);
        graphics.ellipse(0, 1, 46, 18);
        graphics.fill();
        graphics.fillColor = new Color(255, 232, 177, 220);
        graphics.circle(0, 18, 7);
        graphics.fill();
        this.registerIsoDepth(marker);
    }

    private createFlowerPickups(): void {
        for (const flower of FLOWER_SPOTS) {
            if (this.progress.gatheredFlowers.indexOf(flower.id) >= 0) {
                continue;
            }
            const inIsoDistrict = this.isInIsometricCity(flower.x, flower.y);
            const node = this.createNode(
                `FlowerPickup_${flower.id}`,
                inIsoDistrict ? this.isoDepthLayer : this.decorationLayer,
            );
            node.setPosition(flower.x, flower.y);
            node.getComponent(UITransform)?.setContentSize(90, 104);
            const graphics = node.addComponent(Graphics);
            graphics.fillColor = new Color(255, 234, 246, 175);
            graphics.circle(0, 12, 35);
            graphics.fill();
            graphics.fillColor = flower.accent;
            for (let petal = 0; petal < 6; petal += 1) {
                const angle = Math.PI * 2 * petal / 6;
                graphics.circle(
                    Math.cos(angle) * 20,
                    26 + Math.sin(angle) * 20,
                    11,
                );
            }
            graphics.fill();
            graphics.fillColor = new Color(255, 225, 139, 255);
            graphics.circle(0, 26, 8);
            graphics.fill();
            graphics.strokeColor = new Color(111, 169, 132, 230);
            graphics.lineWidth = 3;
            graphics.moveTo(0, 15);
            graphics.lineTo(0, -18);
            graphics.stroke();
            this.makeInteractive(node, () => this.pickFlower(flower, node));
            if (inIsoDistrict) {
                this.registerIsoDepth(node);
            }
        }
    }

    private pickFlower(flower: FlowerSpot, node: Node): void {
        if (this.progress.gatheredFlowers.indexOf(flower.id) >= 0) {
            return;
        }
        this.progress = collectFlower(this.progress, flower.id);
        saveProgress(this.progress);
        gameFeel.play('success');
        this.updateTaskButtonLabel();
        const collected = this.progress.gatheredFlowers.length;
        const flowerTask = TASKS.find((task) => task.metric === 'flowers');
        if (flowerTask && collected >= flowerTask.target) {
            this.showCityToast('采集任务已完成，可以在任务列表领取奖励');
        } else {
            this.showCityToast(`采集到一朵花 · ${collected} / ${flowerTask?.target ?? 3}`);
        }
        tween(node)
            .to(0.18, { scale: new Vec3(1.35, 1.35, 1) })
            .call(() => {
                if (node.isValid) {
                    node.destroy();
                }
            })
            .start();
    }

    private createPlayer(): void {
        this.player = this.createNode('Player', this.isoDepthLayer);
        this.player.setPosition(0, -760);
        this.player.getComponent(UITransform)?.setContentSize(PLAYER_RADIUS * 2, PLAYER_RADIUS * 2);

        const shadow = this.createNode('PlayerShadow', this.player);
        shadow.setPosition(0, -66);
        const shadowGraphics = shadow.addComponent(Graphics);
        shadowGraphics.fillColor = new Color(109, 78, 106, 95);
        shadowGraphics.ellipse(0, 0, 76, 30);
        shadowGraphics.fill();

        this.playerVisual = this.createNode('PlayerVisual', this.player);
        this.playerVisual.getComponent(UITransform)?.setContentSize(65, 166);
        const sprite = this.playerVisual.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        resources.load('scene/layers/pink-girl-hd/spriteFrame', SpriteFrame, (error, frame) => {
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
        this.registerIsoDepth(this.player);
        this.updateCityDepthPresentation();
    }

    private createMaleNpcs(): void {
        for (const node of this.maleNpcNodes) {
            if (node.isValid) {
                node.destroy();
            }
        }
        this.maleNpcNodes = [];
        const partners = this.getUnlockedPartners().slice(0, 6);
        const positions = [
            new Vec3(-145, -565),
            new Vec3(155, -610),
            new Vec3(-145, -1010),
            new Vec3(150, -1080),
            new Vec3(365, -510),
            new Vec3(-380, -520),
        ];

        partners.forEach((partner, index) => {
            const npc = this.createNode(`MaleNpc_${partner.id}`, this.isoDepthLayer);
            npc.setPosition(positions[index]);
            npc.getComponent(UITransform)?.setContentSize(150, 190);

            const shadow = this.createNode('NpcShadow', npc);
            shadow.setPosition(0, -78);
            shadow.getComponent(UITransform)?.setContentSize(96, 30);
            const shadowGraphics = shadow.addComponent(Graphics);
            shadowGraphics.fillColor = new Color(92, 65, 94, 80);
            shadowGraphics.ellipse(0, 0, 48, 14);
            shadowGraphics.fill();

            const halo = this.createNode('NpcHalo', npc);
            halo.setPosition(0, 2);
            halo.getComponent(UITransform)?.setContentSize(126, 152);
            const haloGraphics = halo.addComponent(Graphics);
            haloGraphics.fillColor = new Color(
                partner.accent.r,
                partner.accent.g,
                partner.accent.b,
                38,
            );
            haloGraphics.circle(0, 32, 66);
            haloGraphics.fill();

            const portrait = this.createNode('NpcPortrait', npc);
            portrait.setPosition(0, 5);
            portrait.getComponent(UITransform)?.setContentSize(104, 128);
            const sprite = portrait.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            resources.load(getPartnerPortraitPath(partner.id), SpriteFrame, (error, frame) => {
                if (error || !frame) {
                    gameFeel.showMissingImage(portrait, '角色');
                    return;
                }
                if (sprite.isValid) {
                    sprite.spriteFrame = frame;
                }
            });

            this.makeInteractive(npc, () => this.openMaleDialogue(partner));
            this.maleNpcNodes.push(npc);
            this.registerIsoDepth(npc);
        });
        this.sortIsometricDepth();
    }

    private openMaleDialogue(partner: PartnerSupport): void {
        if (this.maleDialogueModal?.isValid) {
            return;
        }
        this.jobPromptButton.active = false;
        const modal = this.createNode('MaleDialogueModal', this.modalLayer);
        modal.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        modal.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(42, 27, 55, 178);
        shade.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        shade.fill();

        const panel = this.createNode('MaleDialoguePanel', modal);
        panel.setPosition(0, 10);
        panel.getComponent(UITransform)?.setContentSize(670, 820);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(255, 247, 252, 252);
        graphics.strokeColor = partner.accent;
        graphics.lineWidth = 5;
        graphics.roundRect(-335, -410, 670, 820, 42);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = partner.accent;
        graphics.roundRect(-128, 330, 256, 64, 32);
        graphics.fill();

        this.addLabel(
            panel,
            'DialogueTitle',
            `与 ${partner.name} 对话`,
            30,
            Color.WHITE,
            new Vec3(0, 362),
            400,
            56,
            true,
        );

        const portraitCard = this.createNode('DialoguePortraitCard', panel);
        portraitCard.setPosition(-195, 55);
        portraitCard.getComponent(UITransform)?.setContentSize(230, 470);
        const portraitGraphics = portraitCard.addComponent(Graphics);
        portraitGraphics.fillColor = new Color(255, 235, 246, 230);
        portraitGraphics.strokeColor = new Color(255, 255, 255, 225);
        portraitGraphics.lineWidth = 3;
        portraitGraphics.roundRect(-115, -235, 230, 470, 32);
        portraitGraphics.fill();
        portraitGraphics.stroke();

        const portrait = this.createNode('DialoguePortrait', portraitCard);
        portrait.setPosition(0, 28);
        portrait.getComponent(UITransform)?.setContentSize(205, 250);
        const sprite = portrait.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        resources.load(getPartnerPortraitPath(partner.id), SpriteFrame, (error, frame) => {
            if (error || !frame) {
                gameFeel.showMissingImage(portrait, '角色图片缺失');
                return;
            }
            if (sprite.isValid) {
                sprite.spriteFrame = frame;
            }
        });
        this.addLabel(
            portraitCard,
            'DialogueRole',
            partner.role,
            19,
            new Color(123, 80, 127, 255),
            new Vec3(0, -132),
            190,
            32,
            true,
        );
        this.addLabel(
            portraitCard,
            'DialogueBond',
            `心动值 ${getBond(this.progress, partner.id)} / 6`,
            17,
            new Color(153, 103, 139, 235),
            new Vec3(0, -174),
            180,
            30,
            true,
        );

        this.addLabel(
            panel,
            'DialogueText',
            this.getMaleDialogueText(partner),
            23,
            new Color(91, 59, 99, 255),
            new Vec3(132, 91),
            350,
            300,
            true,
        );
        this.addLabel(
            panel,
            'DialogueSupport',
            `${this.partnerSupportText(partner)}\n`
                + (partner.id === this.progress.activePartner ? '当前支援搭档' : '可以设为支援搭档'),
            17,
            new Color(145, 101, 144, 235),
            new Vec3(132, -107),
            350,
            72,
            true,
        );

        if (partner.id !== this.progress.activePartner) {
            this.createPanelButton(
                panel,
                'SetActivePartner',
                '设为支援搭档',
                new Vec3(-148, -312),
                250,
                64,
                partner.accent,
                () => {
                    this.progress = {
                        ...this.progress,
                        activePartner: partner.id,
                    };
                    saveProgress(this.progress);
                    this.createMaleNpcs();
                    this.closeMaleDialogue();
                },
            );
        } else {
            this.createPanelButton(
                panel,
                'ChallengeWithPartner',
                '一起参加挑战',
                new Vec3(-148, -312),
                250,
                64,
                partner.accent,
                () => navigateTo('ChallengeArena'),
            );
        }
        this.createPanelButton(
            panel,
            'CloseMaleDialogue',
            '继续散步',
            new Vec3(150, -312),
            250,
            64,
            new Color(197, 174, 219, 255),
            () => this.closeMaleDialogue(),
        );

        const previous = this.maleDialogueModal;
        this.maleDialogueModal = modal;
        if (previous?.isValid) {
            previous.destroy();
        }
    }

    private getMaleDialogueText(partner: PartnerSupport): string {
        const dialogues: Record<string, string> = {
            'shen-xinglan': '风里有一点甜味。我本来只是来等一份甜品，没想到先等到了你。',
            'jiang-yanbai': '书室里那页旧地图提到了樱花街。你愿意陪我确认最后一个标记吗？',
            'jiang-yanbai-hoodie': '我换了便装，还是被你一眼认出来了。看来今天适合一起走走。',
            'xia-yang': '嘿！我刚从甜心商店出来。要不要一起找点更有趣的事做？',
            'lu-qinglan': '今晚的舞台还缺一段即兴演出。如果你愿意，我可以把最好的位置留给你。',
            'lu-qinglan-hoodie': '灯光还没亮，现在这条街只属于我们。想聊一会儿吗？',
            'gu-chenzhou': '礼物重要的不是价格，而是送的人有没有认真记住对方。',
            'liang-xingye': '这条街的空间比看上去复杂。跟着我，不会让你迷路。',
            'tang-qi': '听见了吗？街角的鼓点刚好和你的脚步合拍。',
            'xie-wujiu': '星象说今天会遇见一个改变计划的人。看来它就是现在。',
            'pei-yuchuan': '不用急着决定方向。先告诉我，你今天最想做什么？',
            'qi-guanlan': '我查到一条只在樱花街出现过的记录。也许你会对它感兴趣。',
            'cheng-yanli': '橱窗里的蛋糕还热着。比起一个人吃完，我更想听你评价。',
            'huo-wenzhou': '前面那段路刚修好，不过有我在，你走哪边都可以。',
            'song-zhao': '观众还没来，舞台已经准备好了。你要不要先听我的开场？',
            'wen-xuechuan': '刚才那个角度很好。如果你愿意，我想把今天的樱花街拍下来。',
        };
        return dialogues[partner.id]
            ?? `${partner.name}在街角停下脚步，似乎正等着和${this.progress.playerName}说些什么。`;
    }

    private closeMaleDialogue(): void {
        if (this.maleDialogueModal?.isValid) {
            this.maleDialogueModal.destroy();
        }
        this.maleDialogueModal = null;
        this.updateJobProximity();
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
            `${this.progress.playerName} · 甜品住宅街`,
            17,
            new Color(153, 105, 151, 235),
            new Vec3(0, -22),
            420,
            28,
            true,
        );

        this.coinPill = this.createNode('CoinPill', this.hudLayer);
        this.coinPill.setPosition(285, 435);
        this.coinPill.getComponent(UITransform)?.setContentSize(128, 44);
        const coinGraphics = this.coinPill.addComponent(Graphics);
        coinGraphics.fillColor = new Color(255, 240, 183, 235);
        coinGraphics.strokeColor = new Color(236, 183, 112, 235);
        coinGraphics.lineWidth = 2;
        coinGraphics.roundRect(-64, -22, 128, 44, 22);
        coinGraphics.fill();
        coinGraphics.stroke();
        this.coinLabel = this.addLabel(
            this.coinPill,
            'CoinLabel',
            `金币 ${this.progress.coins}`,
            19,
            new Color(133, 87, 57, 255),
            Vec3.ZERO,
            112,
            38,
            true,
        );
        this.charmPill = this.createNode('CharmPill', this.hudLayer);
        this.charmPill.setPosition(0, 435);
        this.charmPill.getComponent(UITransform)?.setContentSize(170, 44);
        const charmGraphics = this.charmPill.addComponent(Graphics);
        charmGraphics.fillColor = new Color(255, 224, 240, 238);
        charmGraphics.strokeColor = new Color(232, 145, 188, 235);
        charmGraphics.lineWidth = 2;
        charmGraphics.roundRect(-85, -22, 170, 44, 22);
        charmGraphics.fill();
        charmGraphics.stroke();
        this.charmLabel = this.addLabel(
            this.charmPill,
            'CharmLabel',
            '魅力 0',
            19,
            new Color(142, 73, 108, 255),
            Vec3.ZERO,
            152,
            38,
            true,
        );
        this.createHudButton(
            'CityReturnButton',
            '返回',
            new Vec3(-285, 365),
            132,
            58,
            () => this.showExitConfirmation(),
        );
        const menuButton = this.createHudButton(
            'CityMenuButton',
            '手账',
            new Vec3(285, 365),
            132,
            58,
            () => this.openCityMenu(),
        );
        this.menuBadge = this.createNode('MenuBadge', menuButton);
        this.menuBadge.setPosition(52, 19);
        this.menuBadge.getComponent(UITransform)?.setContentSize(30, 30);
        const badgeGraphics = this.menuBadge.addComponent(Graphics);
        badgeGraphics.fillColor = new Color(235, 103, 153, 255);
        badgeGraphics.strokeColor = new Color(255, 255, 255, 235);
        badgeGraphics.lineWidth = 2;
        badgeGraphics.circle(0, 0, 13);
        badgeGraphics.fill();
        badgeGraphics.stroke();
        this.menuBadgeLabel = this.addLabel(
            this.menuBadge,
            'MenuBadgeLabel',
            '',
            14,
            Color.WHITE,
            Vec3.ZERO,
            24,
            24,
            true,
        );
        this.menuBadge.active = false;
        this.updateTaskButtonLabel();
        this.venuePromptButton = this.createHudButton(
            'VenuePromptButton',
            '进入场所',
            new Vec3(225, -405),
            270,
            64,
            () => this.openCurrentVenue(),
        );
        this.venuePromptLabel = this.venuePromptButton
            .getChildByName('ButtonLabel')!
            .getComponent(Label)!;
        this.venuePromptButton.active = false;
        this.updateCharmLabel();

        this.createJoystick();
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

    private openCityMenu(): void {
        if (this.cityMenuModal?.isValid) {
            return;
        }
        this.jobPromptButton.active = false;
        this.venuePromptButton.active = false;

        const modal = this.createNode('CityMenuModal', this.modalLayer);
        modal.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        modal.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(43, 28, 54, 155);
        shade.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        shade.fill();

        const panel = this.createNode('CityMenuPanel', modal);
        panel.getComponent(UITransform)?.setContentSize(660, 650);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(255, 247, 252, 250);
        graphics.strokeColor = new Color(213, 160, 221, 255);
        graphics.lineWidth = 5;
        graphics.roundRect(-330, -325, 660, 650, 42);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(207, 150, 219, 255);
        graphics.roundRect(-112, 250, 224, 60, 30);
        graphics.fill();

        this.addLabel(
            panel,
            'CityMenuTitle',
            '樱 花 手 账',
            31,
            Color.WHITE,
            new Vec3(0, 280),
            320,
            54,
            true,
        );
        const activePartner = getPartnerSupport(this.progress.activePartner);
        const claimable = this.getClaimableTaskCount();
        this.addLabel(
            panel,
            'CityMenuSubtitle',
            `${activePartner ? `搭档 ${activePartner.name}` : '尚未选择搭档'}　`
                + `金币 ${this.progress.coins}　魅力 ${getCharmBreakdown(this.progress).total}`
                + (claimable > 0 ? `\n${claimable} 项委托可以领取` : ''),
            17,
            new Color(136, 92, 143, 235),
            new Vec3(0, 215),
            570,
            58,
            true,
        );

        const runAfterClose = (action: () => void): (() => void) => () => {
            this.closeCityMenu();
            action();
        };
        const columns = [-155, 155];
        const rows = [135, 45, -45, -135];
        const actions: Array<{
            name: string;
            label: string;
            color: Color;
            action: () => void;
        }> = [
            {
                name: 'OpenCityTasks',
                label: claimable > 0 ? `街区委托 · ${claimable}` : '街区委托',
                color: new Color(202, 158, 230, 255),
                action: () => this.openTaskPanel(),
            },
            {
                name: 'OpenCityChallenge',
                label: '女性挑战',
                color: new Color(236, 151, 190, 255),
                action: () => navigateTo('ChallengeArena'),
            },
            {
                name: 'OpenCityWardrobe',
                label: '衣橱换装',
                color: new Color(213, 165, 222, 255),
                action: () => this.openWardrobe(),
            },
            {
                name: 'OpenCityPartner',
                label: activePartner ? `搭档 · ${activePartner.name}` : '选择搭档',
                color: new Color(178, 164, 231, 255),
                action: () => this.openPartnerPanel(),
            },
            {
                name: 'OpenCityBeauty',
                label: '美妆店',
                color: new Color(238, 173, 204, 255),
                action: () => this.openBeautyStudio(),
            },
            {
                name: 'OpenCityGallery',
                label: '角色图鉴',
                color: new Color(170, 183, 232, 255),
                action: () => navigateTo('CharacterGallery'),
            },
            {
                name: 'OpenSakuraMarket',
                label: '樱花市集',
                color: new Color(229, 176, 209, 255),
                action: () => navigateTo('Main'),
            },
        ];
        actions.forEach((entry, index) => {
            this.createPanelButton(
                panel,
                entry.name,
                entry.label,
                new Vec3(columns[index % 2], rows[Math.floor(index / 2)]),
                280,
                66,
                entry.color,
                runAfterClose(entry.action),
            );
        });

        this.createPanelButton(
            panel,
            'CloseCityMenu',
            '继续散步',
            new Vec3(0, -250),
            250,
            54,
            new Color(197, 178, 219, 255),
            () => this.closeCityMenu(),
        );
        this.cityMenuModal = modal;
    }

    private closeCityMenu(): void {
        if (this.cityMenuModal?.isValid) {
            this.cityMenuModal.destroy();
        }
        this.cityMenuModal = null;
        this.updateJobProximity();
        this.updateVenueProximity();
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

    private openTaskPanel(): void {
        if (this.taskModal?.isValid) {
            return;
        }
        this.taskView = 'jobs';
        this.roleTaskPage = 0;
        this.jobPromptButton.active = false;
        this.venuePromptButton.active = false;
        const modal = this.createNode('TaskModal', this.modalLayer);
        modal.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        modal.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(42, 27, 57, 178);
        shade.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        shade.fill();

        const panel = this.createNode('TaskPanel', modal);
        panel.setPosition(0, 0);
        panel.getComponent(UITransform)?.setContentSize(700, 1120);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(255, 247, 252, 252);
        graphics.strokeColor = new Color(218, 159, 222, 255);
        graphics.lineWidth = 5;
        graphics.roundRect(-350, -560, 700, 1120, 42);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(212, 149, 219, 255);
        graphics.roundRect(-118, 470, 236, 64, 32);
        graphics.fill();

        this.addLabel(
            panel,
            'TaskTitle',
            '兼 职 任 务',
            32,
            Color.WHITE,
            new Vec3(0, 502),
            340,
            56,
            true,
        );
        this.createPanelButton(
            panel,
            'JobTaskTab',
            '兼职任务',
            new Vec3(-92, 430),
            170,
            44,
            new Color(222, 161, 209, 255),
            () => this.switchTaskView('jobs'),
        );
        this.createPanelButton(
            panel,
            'RoleTaskTab',
            '角色委托',
            new Vec3(92, 430),
            170,
            44,
            new Color(164, 150, 225, 255),
            () => this.switchTaskView('roles'),
        );

        this.taskContent = this.createNode('TaskContent', panel);
        this.taskContent.setPosition(0, 40);
        this.taskContent.getComponent(UITransform)?.setContentSize(650, 790);
        this.taskMessageLabel = this.addLabel(
            panel,
            'TaskMessage',
            `当前金币 ${this.progress.coins} · 任务和技能会保存到本机`,
            17,
            new Color(132, 94, 140, 235),
            new Vec3(0, -428),
            610,
            42,
            true,
        );
        this.createPanelButton(
            panel,
            'CloseTaskPanel',
            '关闭任务',
            new Vec3(0, -505),
            230,
            54,
            new Color(196, 167, 219, 255),
            () => this.closeTaskPanel(),
        );
        this.taskModal = modal;
        this.renderTaskPanel();
    }

    private renderTaskPanel(): void {
        if (!this.taskContent?.isValid) {
            return;
        }
        for (const child of [...this.taskContent.children]) {
            child.destroy();
        }

        if (this.taskView === 'roles') {
            this.renderRoleTasks();
            this.updateTaskButtonLabel();
            return;
        }

        const taskYs = [270, 100, -70];
        TASKS.forEach((task, index) => {
            this.createTaskCard(task, taskYs[index]);
        });

        this.addLabel(
            this.taskContent,
            'SkillHeading',
            '技能学习 · 学会后永久提升属性',
            21,
            new Color(111, 73, 119, 255),
            new Vec3(0, -178),
            590,
            36,
            true,
        );
        const skillXs = [-210, 0, 210];
        SKILLS.forEach((skill, index) => {
            this.createSkillCard(skill, skillXs[index]);
        });
        this.updateTaskButtonLabel();
    }

    private switchTaskView(view: TaskView): void {
        this.taskView = view;
        this.roleTaskPage = 0;
        this.renderTaskPanel();
        this.showTaskMessage(
            view === 'jobs'
                ? '兼职任务：采集、收入和技能学习'
                : '角色委托：完成角色故事、提升好感和获取额外羁绊',
        );
    }

    private renderRoleTasks(): void {
        if (!this.taskContent?.isValid) {
            return;
        }
        const pageSize = 3;
        const totalPages = Math.max(1, Math.ceil(ROLE_TASKS.length / pageSize));
        this.roleTaskPage = Math.max(0, Math.min(totalPages - 1, this.roleTaskPage));
        const tasks = ROLE_TASKS.slice(
            this.roleTaskPage * pageSize,
            this.roleTaskPage * pageSize + pageSize,
        );
        const taskYs = [250, 75, -100];
        tasks.forEach((task, index) => {
            this.createRoleTaskCard(task, taskYs[index]);
        });

        this.createPanelButton(
            this.taskContent,
            'PreviousRoleTaskPage',
            '‹',
            new Vec3(-225, -285),
            62,
            48,
            new Color(191, 167, 219, 255),
            () => {
                this.roleTaskPage = Math.max(0, this.roleTaskPage - 1);
                this.renderTaskPanel();
            },
        );
        this.addLabel(
            this.taskContent,
            'RoleTaskPageLabel',
            `${this.roleTaskPage + 1} / ${totalPages}　共 ${ROLE_TASKS.length} 个角色委托`,
            17,
            new Color(126, 91, 139, 235),
            new Vec3(0, -285),
            320,
            34,
            true,
        );
        this.createPanelButton(
            this.taskContent,
            'NextRoleTaskPage',
            '›',
            new Vec3(225, -285),
            62,
            48,
            new Color(191, 167, 219, 255),
            () => {
                const maxPage = Math.max(0, Math.ceil(ROLE_TASKS.length / pageSize) - 1);
                this.roleTaskPage = Math.min(maxPage, this.roleTaskPage + 1);
                this.renderTaskPanel();
            },
        );
    }

    private createTaskCard(task: TaskDefinition, y: number): void {
        if (!this.taskContent?.isValid) {
            return;
        }
        const progress = this.getTaskProgress(task);
        const complete = progress >= task.target;
        const claimed = this.progress.claimedTaskRewards.indexOf(task.id) >= 0;
        const card = this.createNode(`Task_${task.id}`, this.taskContent);
        card.setPosition(0, y);
        card.getComponent(UITransform)?.setContentSize(640, 150);
        const graphics = card.addComponent(Graphics);
        graphics.fillColor = claimed
            ? new Color(241, 235, 243, 230)
            : new Color(255, 250, 253, 240);
        graphics.strokeColor = complete && !claimed ? task.accent : new Color(236, 214, 237, 230);
        graphics.lineWidth = complete && !claimed ? 4 : 2;
        graphics.roundRect(-320, -75, 640, 150, 25);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(task.accent.r, task.accent.g, task.accent.b, 50);
        graphics.roundRect(-312, -67, 624, 134, 20);
        graphics.fill();

        this.addLabel(
            card,
            'TaskName',
            task.title,
            23,
            new Color(94, 59, 103, 255),
            new Vec3(-126, 43),
            310,
            34,
            true,
        );
        this.addLabel(
            card,
            'TaskDescription',
            task.description,
            16,
            new Color(125, 85, 126, 235),
            new Vec3(-132, 3),
            390,
            50,
            true,
        );
        this.addLabel(
            card,
            'TaskProgress',
            `${Math.min(progress, task.target)} / ${task.target}`
                + `　奖励 ${task.rewardCoins} 金币 + ${task.rewardGifts} 礼物`,
            16,
            new Color(149, 103, 128, 240),
            new Vec3(-125, -48),
            390,
            30,
            true,
        );

        const buttonText = claimed
            ? '已领取'
            : complete
                ? '领取奖励'
                : task.metric === 'flowers'
                    ? '去采集'
                    : task.metric === 'jobIncome'
                        ? '去兼职'
                        : '学习技能';
        this.createPanelButton(
            card,
            'TaskAction',
            buttonText,
            new Vec3(225, -3),
            150,
            58,
            claimed ? new Color(184, 171, 192, 255) : task.accent,
            () => this.handleTaskAction(task),
        );
    }

    private createRoleTaskCard(task: RoleTaskDefinition, y: number): void {
        if (!this.taskContent?.isValid) {
            return;
        }
        const character = getPartnerSupport(task.characterId);
        const claimed = this.progress.claimedTaskRewards.indexOf(task.id) >= 0;
        const prerequisiteReady = !task.prerequisiteTaskId
            || this.progress.claimedTaskRewards.indexOf(task.prerequisiteTaskId) >= 0;
        const met = this.progress.metCharacters.indexOf(task.characterId) >= 0;
        const ready = this.isRoleTaskReady(task);
        const card = this.createNode(`RoleTask_${task.id}`, this.taskContent);
        card.setPosition(0, y);
        card.getComponent(UITransform)?.setContentSize(640, 155);
        const graphics = card.addComponent(Graphics);
        graphics.fillColor = claimed
            ? new Color(241, 235, 243, 230)
            : new Color(255, 250, 253, 242);
        graphics.strokeColor = ready && !claimed ? task.accent : new Color(233, 214, 238, 230);
        graphics.lineWidth = ready && !claimed ? 4 : 2;
        graphics.roundRect(-320, -77, 640, 155, 25);
        graphics.fill();
        graphics.stroke();

        this.addLabel(
            card,
            'RoleTaskTitle',
            `${task.title} · ${character?.name ?? '角色'}`,
            21,
            new Color(93, 58, 102, 255),
            new Vec3(-110, 50),
            370,
            34,
            true,
        );
        this.addLabel(
            card,
            'RoleTaskReward',
            `${task.rewardCoins} 金币 · ${task.rewardGifts} 礼物`,
            15,
            new Color(142, 99, 132, 235),
            new Vec3(170, 50),
            210,
            28,
            true,
        );
        this.addLabel(
            card,
            'RoleTaskDescription',
            task.description,
            15,
            new Color(126, 87, 130, 235),
            new Vec3(-108, 17),
            410,
            38,
            true,
        );
        const requirementText = task.requirements.map((requirement) => {
            const status = this.getRoleRequirementStatus(requirement);
            return `${status.met ? '✓' : '○'} ${status.text}`;
        }).join('  ');
        const prerequisiteText = task.prerequisiteTaskId && !prerequisiteReady
            ? '○ 请先完成上一阶段委托\n'
            : '';
        this.addLabel(
            card,
            'RoleTaskRequirements',
            prerequisiteText + requirementText,
            13,
            ready && !claimed ? task.accent : new Color(143, 105, 146, 235),
            new Vec3(-132, -43),
            420,
            54,
            true,
        );

        const buttonText = claimed
            ? '已完成'
            : !met
                ? '先去相遇'
                : !prerequisiteReady
                    ? '前置未完成'
                    : ready
                        ? '领取奖励'
                        : '继续任务';
        this.createPanelButton(
            card,
            'RoleTaskAction',
            buttonText,
            new Vec3(225, -43),
            145,
            48,
            claimed ? new Color(180, 169, 190, 255) : task.accent,
            () => this.handleRoleTaskAction(task),
        );
    }

    private getRoleRequirementStatus(requirement: RoleTaskRequirement): {
        met: boolean;
        text: string;
    } {
        if (requirement.kind === 'met-character') {
            const met = this.progress.metCharacters.indexOf(requirement.characterId) >= 0;
            return {
                met,
                text: requirement.label,
            };
        }
        if (requirement.kind === 'bond') {
            const bond = getBond(this.progress, requirement.characterId);
            return {
                met: bond >= requirement.target,
                text: `好感 ${bond}/${requirement.target}`,
            };
        }
        if (requirement.kind === 'venue-complete') {
            const venue = VENUES.find((entry) => entry.id === requirement.venueId);
            const found = venue
                ? venue.exploration.filter((point) => (
                    this.progress.venueDiscoveries.indexOf(point.id) >= 0
                )).length
                : 0;
            const target = venue?.exploration.length ?? 3;
            return {
                met: found >= target,
                text: `场所探索 ${found}/${target}`,
            };
        }
        if (requirement.kind === 'learned-skill') {
            const learned = requirement.skillId
                ? this.progress.learnedSkills.indexOf(requirement.skillId) >= 0
                : this.progress.learnedSkills.length >= requirement.target;
            return {
                met: learned,
                text: requirement.label,
            };
        }
        if (requirement.kind === 'flowers') {
            return {
                met: this.progress.gatheredFlowers.length >= requirement.target,
                text: `采集花朵 ${Math.min(this.progress.gatheredFlowers.length, requirement.target)}/${requirement.target}`,
            };
        }
        return {
            met: this.progress.jobIncomeEarned >= requirement.target,
            text: `兼职收入 ${Math.min(this.progress.jobIncomeEarned, requirement.target)}/${requirement.target}`,
        };
    }

    private isRoleTaskReady(task: RoleTaskDefinition): boolean {
        const prerequisiteReady = !task.prerequisiteTaskId
            || this.progress.claimedTaskRewards.indexOf(task.prerequisiteTaskId) >= 0;
        return prerequisiteReady
            && task.requirements.every((requirement) => this.getRoleRequirementStatus(requirement).met);
    }

    private handleRoleTaskAction(task: RoleTaskDefinition): void {
        if (this.progress.claimedTaskRewards.indexOf(task.id) >= 0) {
            this.showTaskMessage('这项角色委托已经完成并领取');
            return;
        }
        if (
            task.prerequisiteTaskId
            && this.progress.claimedTaskRewards.indexOf(task.prerequisiteTaskId) < 0
        ) {
            this.showTaskMessage('请先完成上一阶段角色委托');
            return;
        }
        if (this.progress.metCharacters.indexOf(task.characterId) < 0) {
            const venue = VENUES.find((entry) => entry.id === getPartnerVenueId(task.characterId));
            this.closeTaskPanel();
            this.showCityToast(`先去${venue?.name ?? '工作场所'}找到他并完成初次对话`);
            return;
        }
        if (!this.isRoleTaskReady(task)) {
            const missing = task.requirements
                .map((requirement) => this.getRoleRequirementStatus(requirement))
                .filter((status) => !status.met)
                .map((status) => status.text);
            this.showTaskMessage(`还差：${missing.join('、')}`);
            return;
        }

        this.progress = {
            ...this.progress,
            coins: this.progress.coins + task.rewardCoins,
            gifts: this.progress.gifts + task.rewardGifts,
            bonds: {
                ...this.progress.bonds,
                [task.characterId]: Math.min(
                    6,
                    getBond(this.progress, task.characterId) + task.rewardBond,
                ),
            },
            claimedTaskRewards: [...this.progress.claimedTaskRewards, task.id],
        };
        saveProgress(this.progress);
        this.updateCoinLabel();
        this.updateTaskButtonLabel();
        gameFeel.play('success');
        this.renderTaskPanel();
        const character = getPartnerSupport(task.characterId);
        this.showTaskMessage(
            `${task.title}完成：${character?.name ?? '角色'}好感 +${task.rewardBond}，`
                + `获得 ${task.rewardCoins} 金币`,
        );
    }

    private createSkillCard(skill: SkillDefinition, x: number): void {
        if (!this.taskContent?.isValid) {
            return;
        }
        const learned = this.progress.learnedSkills.indexOf(skill.id) >= 0;
        const card = this.createNode(`Skill_${skill.id}`, this.taskContent);
        card.setPosition(x, -310);
        card.getComponent(UITransform)?.setContentSize(190, 150);
        const graphics = card.addComponent(Graphics);
        graphics.fillColor = learned
            ? new Color(skill.accent.r, skill.accent.g, skill.accent.b, 85)
            : new Color(255, 250, 253, 240);
        graphics.strokeColor = learned ? skill.accent : new Color(229, 207, 234, 235);
        graphics.lineWidth = learned ? 4 : 2;
        graphics.roundRect(-95, -75, 190, 150, 24);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = skill.accent;
        graphics.circle(0, 39, 22);
        graphics.fill();
        this.addLabel(
            card,
            'SkillIcon',
            skill.icon,
            20,
            Color.WHITE,
            new Vec3(0, 40),
            40,
            34,
            true,
        );
        this.addLabel(
            card,
            'SkillName',
            skill.name,
            19,
            new Color(98, 63, 106, 255),
            new Vec3(0, 2),
            175,
            30,
            true,
        );
        this.addLabel(
            card,
            'SkillBonus',
            `${this.taskStatLabel(skill.stat)} +${skill.statBonus}`,
            15,
            new Color(135, 91, 137, 235),
            new Vec3(0, -27),
            170,
            26,
            true,
        );
        this.addLabel(
            card,
            'SkillPrice',
            learned ? '已学会' : `${skill.price} 金币`,
            15,
            learned ? skill.accent : new Color(154, 105, 80, 255),
            new Vec3(0, -55),
            160,
            26,
            true,
        );
        this.makeInteractive(card, () => this.learnSkill(skill));
    }

    private handleTaskAction(task: TaskDefinition): void {
        if (this.progress.claimedTaskRewards.indexOf(task.id) >= 0) {
            this.showTaskMessage('这项任务的奖励已经领取');
            return;
        }
        if (this.getTaskProgress(task) < task.target) {
            if (task.metric === 'skills') {
                this.showTaskMessage('在下方选择一项技能学习即可完成');
                return;
            }
            this.closeTaskPanel();
            this.showCityToast(
                task.metric === 'flowers'
                    ? '去街区道路附近寻找会发光的花朵'
                    : '靠近兼职点，完成三轮兼职积累收入',
            );
            return;
        }

        this.progress = {
            ...this.progress,
            coins: this.progress.coins + task.rewardCoins,
            gifts: this.progress.gifts + task.rewardGifts,
            claimedTaskRewards: [...this.progress.claimedTaskRewards, task.id],
        };
        saveProgress(this.progress);
        this.updateCoinLabel();
        this.updateTaskButtonLabel();
        gameFeel.play('success');
        this.renderTaskPanel();
        this.showTaskMessage(
            `${task.title}完成：获得 ${task.rewardCoins} 金币和 ${task.rewardGifts} 份礼物`,
        );
    }

    private learnSkill(skill: SkillDefinition): void {
        if (this.progress.learnedSkills.indexOf(skill.id) >= 0) {
            this.showTaskMessage(`已经学会${skill.name}`);
            return;
        }
        if (this.progress.coins < skill.price) {
            this.showTaskMessage(`金币不足，还需要 ${skill.price - this.progress.coins}`);
            return;
        }
        this.progress = {
            ...this.progress,
            coins: this.progress.coins - skill.price,
            learnedSkills: [...this.progress.learnedSkills, skill.id],
        };
        saveProgress(this.progress);
        this.updateCoinLabel();
        this.updateCharmLabel();
        gameFeel.play('success');
        this.renderTaskPanel();
        this.showTaskMessage(
            `学会${skill.name}：${this.taskStatLabel(skill.stat)}永久 +${skill.statBonus}`,
        );
    }

    private getTaskProgress(task: TaskDefinition): number {
        if (task.metric === 'flowers') {
            return this.progress.gatheredFlowers.length;
        }
        if (task.metric === 'jobIncome') {
            return this.progress.jobIncomeEarned;
        }
        return this.progress.learnedSkills.length;
    }

    private getClaimableTaskCount(): number {
        return TASKS.filter((task) => (
            this.progress.claimedTaskRewards.indexOf(task.id) < 0
            && this.getTaskProgress(task) >= task.target
        )).length + ROLE_TASKS.filter((task) => (
            this.progress.claimedTaskRewards.indexOf(task.id) < 0
            && this.isRoleTaskReady(task)
        )).length;
    }

    private updateTaskButtonLabel(): void {
        if (!this.menuBadge?.isValid || !this.menuBadgeLabel?.isValid) {
            return;
        }
        const claimable = this.getClaimableTaskCount();
        this.menuBadge.active = claimable > 0;
        this.menuBadgeLabel.string = claimable > 9 ? '9+' : String(claimable);
    }

    private updateCharmLabel(): void {
        if (this.charmLabel?.isValid) {
            this.charmLabel.string = `魅力 ${getCharmBreakdown(this.progress).total}`;
        }
    }

    private taskStatLabel(stat: SkillDefinition['stat']): string {
        return {
            wisdom: '才智',
            beauty: '美貌',
            emotion: '情商',
            insight: '洞察',
        }[stat];
    }

    private showTaskMessage(message: string): void {
        if (this.taskMessageLabel?.isValid) {
            this.taskMessageLabel.string = message;
        }
    }

    private closeTaskPanel(): void {
        if (this.taskModal?.isValid) {
            this.taskModal.destroy();
        }
        this.taskModal = null;
        this.taskContent = null;
        this.taskMessageLabel = null;
        this.updateJobProximity();
        this.updateVenueProximity();
    }

    private showCityToast(text: string): void {
        const toast = this.createNode('CityToast', this.feedbackLayer);
        toast.setPosition(0, 420);
        toast.getComponent(UITransform)?.setContentSize(500, 60);
        const graphics = toast.addComponent(Graphics);
        graphics.fillColor = new Color(255, 249, 253, 242);
        graphics.strokeColor = new Color(238, 158, 197, 230);
        graphics.lineWidth = 2;
        graphics.roundRect(-250, -30, 500, 60, 30);
        graphics.fill();
        graphics.stroke();
        this.addLabel(
            toast,
            'ToastLabel',
            text,
            18,
            new Color(104, 68, 111, 255),
            Vec3.ZERO,
            460,
            50,
            true,
        );
        const opacity = toast.addComponent(UIOpacity);
        tween(opacity)
            .delay(1.4)
            .to(0.25, { opacity: 0 })
            .call(() => {
                if (toast.isValid) {
                    toast.destroy();
                }
            })
            .start();
    }

    private showCityPlaceModal(title: string, message: string, accent: Color): void {
        if (this.placeModal?.isValid) {
            this.placeModal.destroy();
        }
        const modal = this.createNode('CityPlaceModal', this.modalLayer);
        modal.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        modal.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(43, 28, 54, 165);
        shade.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        shade.fill();

        const panel = this.createNode('CityPlacePanel', modal);
        panel.getComponent(UITransform)?.setContentSize(600, 430);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(255, 248, 252, 250);
        graphics.strokeColor = accent;
        graphics.lineWidth = 5;
        graphics.roundRect(-300, -215, 600, 430, 38);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = accent;
        graphics.roundRect(-118, 146, 236, 58, 29);
        graphics.fill();
        this.addLabel(panel, 'CityPlaceTitle', title, 29, Color.WHITE, new Vec3(0, 175), 400, 50, true);
        this.addLabel(
            panel,
            'CityPlaceMessage',
            message,
            21,
            new Color(92, 60, 98, 255),
            new Vec3(0, 22),
            510,
            220,
            true,
        );
        this.createPanelButton(
            panel,
            'CloseCityPlace',
            '继续散步',
            new Vec3(0, -158),
            230,
            54,
            accent,
            () => {
                if (this.placeModal === modal) {
                    this.placeModal = null;
                }
                modal.destroy();
            },
        );
        this.placeModal = modal;
    }

    private openBeautyStudio(): void {
        if (this.beautyModal?.isValid) {
            return;
        }
        this.jobPromptButton.active = false;
        this.venuePromptButton.active = false;
        const modal = this.createNode('BeautyModal', this.modalLayer);
        modal.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        modal.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
        });
        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(48, 27, 57, 175);
        shade.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
        shade.fill();

        const panel = this.createNode('BeautyPanel', modal);
        panel.getComponent(UITransform)?.setContentSize(700, 900);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(255, 246, 251, 252);
        graphics.strokeColor = new Color(230, 153, 192, 255);
        graphics.lineWidth = 5;
        graphics.roundRect(-350, -450, 700, 900, 42);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(230, 140, 182, 255);
        graphics.roundRect(-125, 370, 250, 64, 32);
        graphics.fill();
        this.addLabel(
            panel,
            'BeautyTitle',
            '樱 色 美 妆',
            31,
            Color.WHITE,
            new Vec3(0, 402),
            360,
            56,
            true,
        );
        this.beautyCharmLabel = this.addLabel(
            panel,
            'BeautyCharm',
            '',
            21,
            new Color(138, 79, 110, 255),
            new Vec3(0, 330),
            560,
            40,
            true,
        );
        this.addLabel(
            panel,
            'BeautyHint',
            '化妆品永久生效，并会提高俘获角色所需的魅力值',
            17,
            new Color(148, 105, 144, 235),
            new Vec3(0, 292),
            590,
            34,
            true,
        );
        this.beautyContent = this.createNode('BeautyContent', panel);
        this.beautyContent.setPosition(0, 10);
        this.beautyContent.getComponent(UITransform)?.setContentSize(650, 540);
        const message = this.addLabel(
            panel,
            'BeautyMessage',
            `当前金币 ${this.progress.coins}`,
            18,
            new Color(139, 101, 139, 235),
            new Vec3(0, -290),
            580,
            40,
            true,
        );
        message.node.name = 'BeautyMessage';
        this.createPanelButton(
            panel,
            'CloseBeauty',
            '离开美妆店',
            new Vec3(0, -374),
            250,
            56,
            new Color(199, 165, 216, 255),
            () => this.closeBeautyStudio(),
        );
        this.beautyModal = modal;
        this.renderBeautyContent();
    }

    private renderBeautyContent(): void {
        if (!this.beautyContent?.isValid) {
            return;
        }
        for (const child of [...this.beautyContent.children]) {
            child.destroy();
        }
        const charm = getCharmBreakdown(this.progress);
        if (this.beautyCharmLabel?.isValid) {
            this.beautyCharmLabel.string = `当前魅力 ${charm.total}`
                + `（基础 ${charm.base} + 美妆 ${charm.cosmetics} + 医美 ${charm.surgery}）`;
        }
        const positions = [190, 10, -170];
        COSMETICS.forEach((item, index) => {
            this.createCosmeticCard(item, positions[index]);
        });
    }

    private createCosmeticCard(item: CosmeticDefinition, y: number): void {
        if (!this.beautyContent?.isValid) {
            return;
        }
        const owned = this.progress.purchasedCosmetics.indexOf(item.id) >= 0;
        const card = this.createNode(`Cosmetic_${item.id}`, this.beautyContent);
        card.setPosition(0, y);
        card.getComponent(UITransform)?.setContentSize(620, 155);
        const graphics = card.addComponent(Graphics);
        graphics.fillColor = owned
            ? new Color(item.accent.r, item.accent.g, item.accent.b, 75)
            : new Color(255, 251, 254, 242);
        graphics.strokeColor = owned ? item.accent : new Color(235, 211, 237, 235);
        graphics.lineWidth = owned ? 4 : 2;
        graphics.roundRect(-310, -77, 620, 154, 25);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = item.accent;
        graphics.circle(-260, 15, 30);
        graphics.fill();
        this.addLabel(
            card,
            'CosmeticIcon',
            '妆',
            22,
            Color.WHITE,
            new Vec3(-260, 15),
            52,
            38,
            true,
        );
        this.addLabel(
            card,
            'CosmeticName',
            item.name,
            23,
            new Color(95, 60, 104, 255),
            new Vec3(-70, 40),
            330,
            36,
            true,
        );
        this.addLabel(
            card,
            'CosmeticDescription',
            item.description,
            16,
            new Color(127, 87, 128, 235),
            new Vec3(-65, 3),
            360,
            44,
            true,
        );
        this.addLabel(
            card,
            'CosmeticBonus',
            `魅力 +${item.charmBonus}`,
            17,
            item.accent,
            new Vec3(-78, -48),
            280,
            28,
            true,
        );
        this.createPanelButton(
            card,
            'BuyCosmetic',
            owned ? '已拥有' : `${item.price} 金币`,
            new Vec3(225, 0),
            145,
            58,
            owned ? new Color(181, 168, 188, 255) : item.accent,
            () => this.buyCosmetic(item),
        );
    }

    private buyCosmetic(item: CosmeticDefinition): void {
        if (this.progress.purchasedCosmetics.indexOf(item.id) >= 0) {
            this.showBeautyMessage(`${item.name}已经购买并生效`);
            return;
        }
        if (this.progress.coins < item.price) {
            this.showBeautyMessage(`金币不足，还需要 ${item.price - this.progress.coins}`);
            return;
        }
        this.progress = {
            ...this.progress,
            coins: this.progress.coins - item.price,
            purchasedCosmetics: [...this.progress.purchasedCosmetics, item.id],
        };
        saveProgress(this.progress);
        this.updateCoinLabel();
        this.updateCharmLabel();
        gameFeel.play('success');
        this.renderBeautyContent();
        this.showBeautyMessage(`${item.name}已购买：魅力永久 +${item.charmBonus}`);
    }

    private showBeautyMessage(message: string): void {
        const label = this.beautyModal
            ?.getChildByName('BeautyPanel')
            ?.getChildByName('BeautyMessage')
            ?.getComponent(Label);
        if (label?.isValid) {
            label.string = message;
        }
    }

    private closeBeautyStudio(): void {
        if (this.beautyModal?.isValid) {
            this.beautyModal.destroy();
        }
        this.beautyModal = null;
        this.beautyContent = null;
        this.beautyCharmLabel = null;
        this.updateJobProximity();
        this.updateVenueProximity();
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
        this.wardrobePreviewVisual.getComponent(UITransform)?.setContentSize(142, 360);
        const previewSprite = this.wardrobePreviewVisual.addComponent(Sprite);
        previewSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        resources.load('scene/layers/pink-girl-hd/spriteFrame', SpriteFrame, (error, frame) => {
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
        this.updateCharmLabel();
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
            this.drawMiniFlower(graphics, -18, 66, 8, 3.4, outfit.accent);
            graphics.fillColor = new Color(112, 163, 132, 230);
            graphics.moveTo(-25, 57);
            graphics.lineTo(-17, 62);
            graphics.lineTo(-24, 67);
            graphics.close();
            graphics.fill();
        } else if (outfit.accessory === 'stars') {
            graphics.strokeColor = outfit.accent;
            graphics.lineWidth = 3;
            graphics.moveTo(-21, 69);
            graphics.lineTo(-10, 76);
            graphics.lineTo(0, 70);
            graphics.lineTo(11, 76);
            graphics.lineTo(21, 69);
            graphics.stroke();
            this.drawMiniStar(graphics, -11, 78, 3.2, new Color(255, 245, 187, 255));
            this.drawMiniStar(graphics, 0, 83, 4.4, new Color(255, 253, 231, 255));
            this.drawMiniStar(graphics, 11, 78, 3.2, new Color(255, 245, 187, 255));
        } else if (outfit.accessory === 'street') {
            graphics.strokeColor = outfit.accent;
            graphics.lineWidth = 6;
            graphics.arc(0, 44, 35, Math.PI, Math.PI * 2, false);
            graphics.stroke();
            graphics.fillColor = outfit.accent;
            graphics.roundRect(-42, 18, 14, 36, 7);
            graphics.roundRect(28, 18, 14, 36, 7);
            graphics.fill();
            graphics.fillColor = new Color(255, 255, 255, 190);
            graphics.roundRect(-39, 24, 5, 22, 3);
            graphics.roundRect(31, 24, 5, 22, 3);
            graphics.fill();
        } else if (outfit.accessory === 'academy') {
            graphics.fillColor = outfit.accent;
            graphics.moveTo(-5, 72);
            graphics.lineTo(14, 75);
            graphics.lineTo(34, 70);
            graphics.lineTo(45, 78);
            graphics.lineTo(42, 85);
            graphics.lineTo(24, 91);
            graphics.lineTo(3, 88);
            graphics.lineTo(-12, 79);
            graphics.close();
            graphics.fill();
            graphics.fillColor = new Color(
                Math.round(outfit.accent.r * 0.78),
                Math.round(outfit.accent.g * 0.78),
                Math.round(outfit.accent.b * 0.78),
                255,
            );
            graphics.moveTo(-14, 76);
            graphics.lineTo(41, 79);
            graphics.lineTo(40, 84);
            graphics.lineTo(-13, 82);
            graphics.close();
            graphics.fill();
            graphics.strokeColor = new Color(255, 227, 190, 230);
            graphics.lineWidth = 1;
            graphics.moveTo(0, 81);
            graphics.lineTo(38, 83);
            graphics.stroke();
            graphics.fillColor = outfit.accent;
            graphics.roundRect(-16, 20, 32, 9, 4);
            graphics.fill();
            graphics.strokeColor = new Color(255, 224, 191, 210);
            graphics.lineWidth = 1;
            graphics.moveTo(-11, 24);
            graphics.lineTo(11, 24);
            graphics.moveTo(-3, 20);
            graphics.lineTo(-3, 29);
            graphics.moveTo(7, 20);
            graphics.lineTo(7, 29);
            graphics.stroke();
        } else {
            this.drawMiniFlower(graphics, -18, 68, 5, 3, outfit.accent);
            graphics.fillColor = new Color(255, 255, 255, 210);
            graphics.circle(-10, 75, 2);
            graphics.fill();
        }
    }

    private drawMiniFlower(
        graphics: Graphics,
        x: number,
        y: number,
        petalCount: number,
        radius: number,
        color: Color,
    ): void {
        graphics.fillColor = color;
        for (let index = 0; index < petalCount; index += 1) {
            const angle = -Math.PI / 2 + Math.PI * 2 * index / petalCount;
            const petalX = x + Math.cos(angle) * radius * 1.5;
            const petalY = y + Math.sin(angle) * radius * 1.5;
            graphics.fillColor = color;
            graphics.circle(
                petalX,
                petalY,
                radius * 0.78,
            );
            graphics.fill();
            graphics.strokeColor = new Color(255, 255, 255, 210);
            graphics.lineWidth = 1;
            graphics.circle(petalX, petalY, radius * 0.78);
            graphics.stroke();
        }
        graphics.fillColor = new Color(255, 235, 167, 255);
        graphics.circle(x, y, radius * 0.58);
        graphics.fill();
    }

    private drawMiniStar(
        graphics: Graphics,
        x: number,
        y: number,
        radius: number,
        color: Color,
    ): void {
        const inner = radius * 0.34;
        graphics.fillColor = color;
        graphics.moveTo(x, y + radius);
        graphics.lineTo(x + inner, y + inner);
        graphics.lineTo(x + radius, y);
        graphics.lineTo(x + inner, y - inner);
        graphics.lineTo(x, y - radius);
        graphics.lineTo(x - inner, y - inner);
        graphics.lineTo(x - radius, y);
        graphics.lineTo(x - inner, y + inner);
        graphics.close();
        graphics.fill();
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
                '还没有可支援的男性角色\n先去工作场所探索并俘获角色',
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
            this.updateCharmLabel();
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
            || this.maleDialogueModal?.isValid
            || this.cityMenuModal?.isValid
            || this.placeModal?.isValid
            || this.exitModal?.isValid
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

    private updateVenueProximity(): void {
        if (!this.venuePromptButton?.isValid) {
            return;
        }
        if (
            this.jobModal?.isValid
            || this.wardrobeModal?.isValid
            || this.partnerModal?.isValid
            || this.maleDialogueModal?.isValid
            || this.cityMenuModal?.isValid
            || this.placeModal?.isValid
            || this.exitModal?.isValid
        ) {
            this.venuePromptButton.active = false;
            return;
        }

        let nearest: VenueDefinition | null = null;
        let nearestDistance = 160 * 160;
        for (const venue of VENUES) {
            const dx = this.player.position.x - venue.entranceX;
            const dy = this.player.position.y - venue.entranceY;
            const distance = dx * dx + dy * dy;
            if (distance < nearestDistance) {
                nearest = venue;
                nearestDistance = distance;
            }
        }
        const homeDx = this.player.position.x - HOME_ENTRANCE_X;
        const homeDy = this.player.position.y - HOME_ENTRANCE_Y;
        const homeDistance = homeDx * homeDx + homeDy * homeDy;
        this.currentHome = homeDistance < nearestDistance;
        if (this.currentHome) {
            this.currentVenue = null;
            this.venuePromptButton.active = true;
            if (this.venuePromptLabel?.isValid) {
                this.venuePromptLabel.string = '花语公寓\n回家';
            }
            return;
        }
        this.currentVenue = nearest;
        this.venuePromptButton.active = Boolean(nearest);
        if (nearest && this.venuePromptLabel?.isValid) {
            this.venuePromptLabel.string = `${nearest.name}\n进入探索`;
        }
    }

    private openCurrentVenue(): void {
        if (this.currentHome) {
            sys.localStorage.setItem(HOME_ENTER_KEY, '1');
            navigateTo('VenueInterior');
            return;
        }
        if (!this.currentVenue) {
            return;
        }
        setActiveVenue(this.currentVenue.id);
        navigateTo('VenueInterior');
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
        const completedRuns = this.progress.jobRuns[this.currentJob.id] ?? 0;
        const repeatMultiplier = Math.max(
            ECONOMY.jobRepeatMultiplierFloor,
            1 - completedRuns * ECONOMY.jobRepeatMultiplierStep,
        );
        const rawReward = this.currentJob.baseReward
            + Math.round(this.currentJob.bonusReward * accuracy)
            + partnerBonus;
        const reward = Math.max(1, Math.round(rawReward * repeatMultiplier));
        this.jobRoundIncome += reward;
        this.jobTotalIncome += reward;
        const nextJobRuns = { ...this.progress.jobRuns };
        if (this.jobRound >= 3) {
            nextJobRuns[this.currentJob.id] = completedRuns + 1;
        }
        this.progress = {
            ...this.progress,
            coins: this.progress.coins + reward,
            jobIncomeEarned: this.progress.jobIncomeEarned + reward,
            jobRuns: nextJobRuns,
        };
        saveProgress(this.progress);
        this.updateCoinLabel();
        this.updateTaskButtonLabel();
        gameFeel.play('success');
        if (this.jobStatusLabel?.isValid) {
            this.jobStatusLabel.string = `本轮 +${reward} 金币 · 准确度 ${Math.round(accuracy * 100)}%`
                + (partnerBonus > 0 ? ` · 搭档 +${partnerBonus}` : '')
                + (repeatMultiplier < 1 ? ` · 重复收益 ${Math.round(repeatMultiplier * 100)}%` : '');
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

    private isInIsometricCity(x: number, y: number): boolean {
        return x >= ISO_CITY_LEFT
            && x <= ISO_CITY_RIGHT
            && y >= ISO_CITY_BOTTOM
            && y <= ISO_CITY_TOP;
    }

    private registerIsoDepth(node: Node): void {
        if (this.isoDepthNodes.indexOf(node) < 0) {
            this.isoDepthNodes.push(node);
        }
    }

    private sortIsometricDepth(): void {
        this.isoDepthNodes = this.isoDepthNodes.filter((node) => node?.isValid);
        const ordered = [...this.isoDepthNodes].sort(
            (left, right) => right.position.y - left.position.y,
        );
        ordered.forEach((node, index) => {
            if (node.parent === this.isoDepthLayer) {
                node.setSiblingIndex(index);
            }
        });
    }

    private updateCityDepthPresentation(): void {
        if (!this.player?.isValid) {
            return;
        }
        const inside = this.isInIsometricCity(
            this.player.position.x,
            this.player.position.y,
        );
        if (inside) {
            const depthRatio = Math.max(
                0,
                Math.min(
                    1,
                    (ISO_CITY_TOP - this.player.position.y)
                        / (ISO_CITY_TOP - ISO_CITY_BOTTOM),
                ),
            );
            const scale = 0.84 + depthRatio * 0.2;
            this.player.setScale(new Vec3(scale, scale, 1));
        } else if (this.player.scale.x !== 1) {
            this.player.setScale(Vec3.ONE);
        }
        this.sortIsometricDepth();
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
        const showQuickStats = this.player.position.y <= 780;
        if (this.coinPill?.isValid) {
            this.coinPill.active = showQuickStats;
        }
        if (this.charmPill?.isValid) {
            this.charmPill.active = showQuickStats;
        }
        if (location !== this.lastLocation && this.locationLabel?.isValid) {
            this.lastLocation = location;
            this.locationLabel.string = `${this.progress.playerName} · ${location}`;
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
