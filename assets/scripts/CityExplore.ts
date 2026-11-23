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

@ccclass('CityExplore')
export class CityExplore extends Component {
    private worldRoot!: Node;
    private buildingLayer!: Node;
    private decorationLayer!: Node;
    private characterLayer!: Node;
    private hudLayer!: Node;
    private feedbackLayer!: Node;
    private player!: Node;
    private playerVisual!: Node;
    private joystickBase!: Node;
    private joystickKnob!: Node;
    private locationLabel!: Label;
    private keyboard = new Set<KeyCode>();
    private joystickDirection = new Vec3();
    private collisions: CollisionBox[] = [];
    private lastLocation = '';

    protected start(): void {
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

        this.createHudButton('CityBackButton', '返回市集', new Vec3(-285, 500), 124, 56, () => {
            director.loadScene('Main');
        });
        this.createHudButton('CityGalleryButton', '查看图鉴', new Vec3(285, 500), 124, 56, () => {
            director.loadScene('CharacterGallery');
        });
        this.createJoystick();
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
