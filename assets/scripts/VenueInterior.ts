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
    UIOpacity,
    UITransform,
    Vec3,
    VerticalTextAlignment,
} from 'cc';
import { gameFeel } from './GameFeel';
import {
    captureCharacter,
    discoverVenueClue,
    getBond,
    getCharmBreakdown,
    getEffectiveStats,
    loadProgress,
    meetCharacter,
    PlayerProgress,
    saveProgress,
} from './GameProgress';
import { getPartnerPortraitPath, PartnerSupport } from './PartnerData';
import {
    getActiveVenue,
    getVenuePartners,
    VenueDefinition,
    VenueExplorationPoint,
} from './VenueData';
import { SURGERIES, SurgeryDefinition } from './BeautyData';
import { getCharacterLore } from './CharacterLoreData';

const { ccclass } = _decorator;

const DESIGN_WIDTH = 750;
const DESIGN_HEIGHT = 1334;

@ccclass('VenueInterior')
export class VenueInterior extends Component {
    private backgroundLayer!: Node;
    private decorLayer!: Node;
    private characterLayer!: Node;
    private hudLayer!: Node;
    private feedbackLayer!: Node;
    private modalLayer!: Node;
    private venue!: VenueDefinition;
    private progress!: PlayerProgress;
    private characterRoot!: Node;
    private hotspotNodes = new Map<string, Node>();
    private explorationLabel!: Label;
    private charmLabel!: Label;
    private dialogueModal: Node | null = null;
    private surgeryModal: Node | null = null;
    private surgeryContent: Node | null = null;
    private surgeryCharmLabel: Label | null = null;
    private infoModal: Node | null = null;
    private toastNode: Node | null = null;
    private actionLocked = false;

    protected start(): void {
        this.progress = loadProgress();
        if (!this.progress.onboardingComplete) {
            director.loadScene('CharacterCustomization');
            return;
        }
        const venue = getActiveVenue();
        if (!venue) {
            director.loadScene('CityExplore');
            return;
        }
        this.venue = venue;
        gameFeel.init();
        this.createLayers();
        this.createBackground();
        this.createVenueDecor();
        this.createExplorationPoints();
        this.createCharacters();
        this.createHud();
        this.showVenueIntro();
        gameFeel.fadeIn(this.node);
    }

    private createLayers(): void {
        this.backgroundLayer = this.createLayer('BackgroundLayer');
        this.decorLayer = this.createLayer('VenueDecorationLayer');
        this.characterLayer = this.createLayer('CharacterLayer');
        this.hudLayer = this.createLayer('HudLayer');
        this.feedbackLayer = this.createLayer('FeedbackLayer');
        this.modalLayer = this.createLayer('ModalLayer');
    }

    private createBackground(): void {
        const gradient = this.createNode('VenueGradient', this.backgroundLayer);
        gradient.getComponent(UITransform)?.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
        const graphics = gradient.addComponent(Graphics);
        const bands = 34;
        const bandHeight = DESIGN_HEIGHT / bands;
        const dark = this.lerpColor(this.venue.wall, new Color(74, 52, 84, 255), 0.24);
        for (let index = 0; index < bands; index += 1) {
            const ratio = index / (bands - 1);
            graphics.fillColor = ratio < 0.62
                ? this.lerpColor(dark, this.venue.wall, ratio / 0.62)
                : this.lerpColor(this.venue.wall, this.venue.floor, (ratio - 0.62) / 0.38);
            graphics.rect(
                -DESIGN_WIDTH / 2,
                DESIGN_HEIGHT / 2 - (index + 1) * bandHeight,
                DESIGN_WIDTH,
                bandHeight + 1,
            );
            graphics.fill();
        }

        const floor = this.createNode('VenueFloor', this.backgroundLayer);
        floor.setPosition(0, -430);
        floor.getComponent(UITransform)?.setContentSize(DESIGN_WIDTH, 474);
        const floorGraphics = floor.addComponent(Graphics);
        floorGraphics.fillColor = new Color(
            this.venue.floor.r,
            this.venue.floor.g,
            this.venue.floor.b,
            235,
        );
        floorGraphics.rect(-375, -237, 750, 474);
        floorGraphics.fill();
        floorGraphics.strokeColor = new Color(255, 245, 250, 70);
        floorGraphics.lineWidth = 2;
        for (let index = -5; index <= 5; index += 1) {
            floorGraphics.moveTo(index * 68, 237);
            floorGraphics.lineTo(index * 105, -237);
        }
        for (let index = 0; index < 7; index += 1) {
            const y = 220 - index * 74;
            floorGraphics.moveTo(-375, y);
            floorGraphics.lineTo(375, y);
        }
        floorGraphics.stroke();

        this.drawRoomFrame();
    }

    private drawRoomFrame(): void {
        const frame = this.createNode('RoomFrame', this.decorLayer);
        frame.getComponent(UITransform)?.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
        const graphics = frame.addComponent(Graphics);
        graphics.fillColor = this.venue.accent;
        graphics.roundRect(-375, 275, 750, 34, 12);
        graphics.fill();
        graphics.fillColor = new Color(255, 248, 252, 170);
        graphics.roundRect(-330, 315, 660, 130, 32);
        graphics.fill();
        graphics.strokeColor = new Color(255, 255, 255, 175);
        graphics.lineWidth = 4;
        for (let index = -2; index <= 2; index += 1) {
            graphics.roundRect(index * 120 - 42, 328, 84, 94, 16);
        }
        graphics.stroke();
    }

    private createVenueDecor(): void {
        if (this.venue.id === 'cafe') {
            this.drawCafe();
        } else if (this.venue.id === 'sweet') {
            this.drawSweetShop();
        } else if (this.venue.id === 'stage') {
            this.drawStage();
        } else if (this.venue.id === 'books') {
            this.drawBookstore();
        } else if (this.venue.id === 'hospital') {
            this.drawHospital();
        } else if (this.venue.id === 'garage') {
            this.drawGarage();
        } else {
            this.drawInnovationCenter();
        }
    }

    private drawCafe(): void {
        const node = this.createNode('CafeDecor', this.decorLayer);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = new Color(139, 92, 82, 235);
        graphics.roundRect(-285, -15, 570, 95, 22);
        graphics.fill();
        graphics.fillColor = new Color(244, 179, 169, 245);
        graphics.roundRect(-270, 48, 540, 38, 18);
        graphics.fill();
        graphics.fillColor = new Color(93, 62, 76, 235);
        graphics.roundRect(-198, -8, 150, 105, 18);
        graphics.fill();
        graphics.fillColor = new Color(255, 239, 207, 245);
        graphics.circle(-256, 81, 17);
        graphics.circle(-216, 82, 15);
        graphics.fill();
        graphics.fillColor = new Color(255, 225, 235, 235);
        graphics.circle(90, 85, 34);
        graphics.circle(140, 84, 31);
        graphics.fill();
        graphics.fillColor = new Color(111, 76, 102, 220);
        graphics.roundRect(95, 40, 52, 48, 12);
        graphics.fill();
    }

    private drawSweetShop(): void {
        const node = this.createNode('SweetShopDecor', this.decorLayer);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = new Color(255, 246, 251, 225);
        graphics.roundRect(-290, -20, 580, 110, 23);
        graphics.fill();
        graphics.strokeColor = new Color(227, 160, 190, 230);
        graphics.lineWidth = 4;
        graphics.roundRect(-290, -20, 580, 110, 23);
        graphics.stroke();
        const cakeColors = [
            new Color(255, 175, 196, 255),
            new Color(248, 207, 156, 255),
            new Color(226, 176, 232, 255),
            new Color(161, 212, 195, 255),
        ];
        cakeColors.forEach((color, index) => {
            graphics.fillColor = color;
            graphics.roundRect(-230 + index * 125, 28, 82, 40, 12);
            graphics.fill();
            graphics.fillColor = new Color(255, 252, 249, 245);
            graphics.circle(-202 + index * 125, 73, 11);
            graphics.circle(-176 + index * 125, 74, 9);
            graphics.fill();
        });
        graphics.fillColor = new Color(255, 183, 207, 230);
        for (let index = 0; index < 9; index += 1) {
            graphics.circle(-320 + index * 80, 235 + (index % 3) * 15, 14);
        }
        graphics.fill();
    }

    private drawStage(): void {
        const node = this.createNode('StageDecor', this.decorLayer);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = new Color(75, 42, 91, 245);
        graphics.roundRect(-370, -50, 165, 410, 30);
        graphics.roundRect(205, -50, 165, 410, 30);
        graphics.fill();
        graphics.fillColor = new Color(188, 105, 157, 235);
        graphics.moveTo(-350, 355);
        graphics.lineTo(-205, 355);
        graphics.lineTo(-285, -35);
        graphics.close();
        graphics.fill();
        graphics.moveTo(350, 355);
        graphics.lineTo(205, 355);
        graphics.lineTo(285, -35);
        graphics.close();
        graphics.fill();
        graphics.fillColor = new Color(255, 221, 244, 35);
        graphics.moveTo(-170, 340);
        graphics.lineTo(0, -20);
        graphics.lineTo(170, 340);
        graphics.close();
        graphics.fill();
        graphics.fillColor = new Color(91, 57, 110, 245);
        graphics.roundRect(-285, -30, 570, 92, 22);
        graphics.fill();
        graphics.fillColor = new Color(166, 131, 220, 235);
        graphics.roundRect(-285, 49, 570, 18, 9);
        graphics.fill();
    }

    private drawBookstore(): void {
        const node = this.createNode('BookstoreDecor', this.decorLayer);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = new Color(112, 87, 143, 235);
        graphics.roundRect(-340, -20, 150, 370, 22);
        graphics.roundRect(190, -20, 150, 370, 22);
        graphics.fill();
        const bookColors = [
            new Color(244, 170, 190, 255),
            new Color(150, 190, 225, 255),
            new Color(239, 197, 127, 255),
            new Color(179, 159, 222, 255),
        ];
        for (let shelf = 0; shelf < 4; shelf += 1) {
            const y = 10 + shelf * 78;
            graphics.fillColor = new Color(239, 220, 244, 235);
            graphics.roundRect(-328, y, 126, 9, 4);
            graphics.roundRect(202, y, 126, 9, 4);
            graphics.fill();
            for (let book = 0; book < 7; book += 1) {
                graphics.fillColor = bookColors[(book + shelf) % bookColors.length];
                graphics.roundRect(-320 + book * 17, y + 10, 12, 42, 3);
                graphics.roundRect(210 + book * 17, y + 10, 12, 42, 3);
            }
            graphics.fill();
        }
        graphics.fillColor = new Color(128, 101, 157, 235);
        graphics.roundRect(-150, -5, 300, 82, 22);
        graphics.fill();
        graphics.fillColor = new Color(255, 247, 250, 225);
        graphics.roundRect(-125, 56, 250, 24, 12);
        graphics.fill();
    }

    private drawHospital(): void {
        const node = this.createNode('HospitalDecor', this.decorLayer);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = new Color(255, 255, 255, 225);
        graphics.strokeColor = new Color(177, 218, 214, 235);
        graphics.lineWidth = 3;
        graphics.roundRect(-300, -20, 600, 105, 24);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(129, 195, 193, 235);
        graphics.roundRect(-270, -5, 190, 72, 18);
        graphics.fill();
        graphics.fillColor = new Color(255, 255, 255, 245);
        graphics.roundRect(-205, 12, 60, 40, 9);
        graphics.roundRect(-188, -5, 26, 74, 8);
        graphics.fill();
        graphics.fillColor = new Color(205, 231, 231, 235);
        graphics.roundRect(40, -10, 210, 82, 18);
        graphics.fill();
        graphics.fillColor = new Color(241, 164, 172, 235);
        graphics.circle(110, 72, 14);
        graphics.circle(150, 72, 14);
        graphics.fill();
        graphics.fillColor = new Color(255, 240, 198, 235);
        graphics.circle(260, 70, 28);
        graphics.fill();
    }

    private drawGarage(): void {
        const node = this.createNode('GarageDecor', this.decorLayer);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = new Color(83, 77, 86, 245);
        graphics.roundRect(-310, -20, 620, 112, 22);
        graphics.fill();
        graphics.strokeColor = new Color(236, 105, 117, 235);
        graphics.lineWidth = 8;
        graphics.moveTo(-295, 55);
        graphics.lineTo(295, 55);
        graphics.stroke();
        graphics.fillColor = new Color(43, 42, 48, 245);
        graphics.circle(-205, 41, 48);
        graphics.circle(-205, 41, 21);
        graphics.fill();
        graphics.fillColor = new Color(220, 220, 228, 245);
        graphics.circle(-205, 41, 11);
        graphics.fill();
        graphics.fillColor = new Color(195, 196, 205, 235);
        graphics.roundRect(50, 5, 205, 76, 16);
        graphics.fill();
        graphics.fillColor = new Color(225, 107, 118, 235);
        graphics.roundRect(75, 31, 155, 20, 10);
        graphics.fill();
        graphics.fillColor = new Color(255, 229, 166, 235);
        graphics.circle(255, 78, 19);
        graphics.fill();
    }

    private drawInnovationCenter(): void {
        const node = this.createNode('InnovationDecor', this.decorLayer);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = new Color(65, 87, 130, 230);
        graphics.roundRect(-320, 15, 640, 230, 28);
        graphics.fill();
        graphics.strokeColor = new Color(146, 205, 255, 190);
        graphics.lineWidth = 2;
        for (let row = 0; row < 5; row += 1) {
            graphics.moveTo(-300, 55 + row * 35);
            graphics.lineTo(300, 55 + row * 35);
        }
        graphics.stroke();
        graphics.fillColor = new Color(103, 192, 230, 120);
        graphics.roundRect(-235, 60, 180, 130, 18);
        graphics.roundRect(55, 60, 180, 130, 18);
        graphics.fill();
        graphics.strokeColor = new Color(215, 243, 255, 210);
        graphics.lineWidth = 4;
        graphics.circle(-145, 125, 44);
        graphics.moveTo(85, 95);
        graphics.lineTo(205, 155);
        graphics.moveTo(205, 95);
        graphics.lineTo(85, 155);
        graphics.stroke();
        graphics.fillColor = new Color(255, 255, 255, 220);
        graphics.roundRect(-250, -17, 500, 50, 20);
        graphics.fill();
    }

    private createExplorationPoints(): void {
        const title = this.createNode('ExploreTitlePill', this.hudLayer);
        title.setPosition(0, 333);
        title.getComponent(UITransform)?.setContentSize(360, 44);
        const titleGraphics = title.addComponent(Graphics);
        titleGraphics.fillColor = new Color(255, 249, 253, 225);
        titleGraphics.strokeColor = venueNullFallback(this.venue.accent);
        titleGraphics.lineWidth = 2;
        titleGraphics.roundRect(-180, -22, 360, 44, 22);
        titleGraphics.fill();
        titleGraphics.stroke();
        this.addLabel(
            title,
            'ExploreTitle',
            '调查工作场所，完成他的委托',
            19,
            new Color(105, 69, 111, 255),
            Vec3.ZERO,
            330,
            38,
            true,
        );

        const positions = [
            new Vec3(-255, 220),
            new Vec3(0, 245),
            new Vec3(255, 220),
        ];
        this.venue.exploration.forEach((point, index) => {
            const discovered = this.progress.venueDiscoveries.indexOf(point.id) >= 0;
            const hotspot = this.createNode(`Explore_${point.id}`, this.decorLayer);
            hotspot.setPosition(positions[index]);
            hotspot.getComponent(UITransform)?.setContentSize(145, 122);
            this.drawHotspot(hotspot, point, discovered);

            const icon = this.addLabel(
                hotspot,
                'HotspotIcon',
                discovered ? '✓' : '?',
                27,
                Color.WHITE,
                new Vec3(0, 25),
                60,
                44,
                true,
            );
            icon.node.name = 'HotspotState';
            this.addLabel(
                hotspot,
                'HotspotLabel',
                point.label,
                16,
                new Color(99, 68, 107, 255),
                new Vec3(0, -33),
                130,
                32,
                true,
            );
            this.hotspotNodes.set(point.id, hotspot);
            this.makeInteractive(hotspot, () => this.explorePoint(point));
        });
    }

    private drawHotspot(node: Node, point: VenueExplorationPoint, discovered: boolean): void {
        const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = discovered
            ? new Color(
                this.venue.accent.r,
                this.venue.accent.g,
                this.venue.accent.b,
                210,
            )
            : new Color(255, 249, 253, 240);
        graphics.strokeColor = discovered ? Color.WHITE : this.venue.accent;
        graphics.lineWidth = 4;
        graphics.roundRect(-69, -57, 138, 114, 28);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = discovered
            ? new Color(255, 255, 255, 55)
            : new Color(
                this.venue.accent.r,
                this.venue.accent.g,
                this.venue.accent.b,
                48,
            );
        graphics.circle(0, 25, 30);
        graphics.fill();
    }

    private explorePoint(point: VenueExplorationPoint): void {
        const alreadyFound = this.progress.venueDiscoveries.indexOf(point.id) >= 0;
        if (!alreadyFound) {
            this.progress = discoverVenueClue(this.progress, point.id);
            saveProgress(this.progress);
            this.updateHotspot(point.id, true);
            this.updateHudProgress();
            gameFeel.play('success');
        }
        const foundCount = this.getVenueDiscoveryCount();
        this.showInfoModal(
            alreadyFound ? point.label : '发现新线索',
            `${point.description}\n\n场所探索：${foundCount} / ${this.venue.exploration.length}`
                + (foundCount >= this.venue.exploration.length
                    ? '\n\n场所委托已完成，现在可以去找喜欢的角色确认心意。'
                    : '\n\n继续调查另外两处，就能完成这里的工作委托。'),
            this.venue.accent,
        );
    }

    private updateHotspot(pointId: string, discovered: boolean): void {
        const node = this.hotspotNodes.get(pointId);
        if (!node?.isValid) {
            return;
        }
        const point = this.venue.exploration.find((entry) => entry.id === pointId);
        if (!point) {
            return;
        }
        this.drawHotspot(node, point, discovered);
        const stateLabel = node.getChildByName('HotspotState')?.getComponent(Label);
        if (stateLabel) {
            stateLabel.string = discovered ? '✓' : '?';
        }
    }

    private createCharacters(): void {
        if (this.characterRoot?.isValid) {
            this.characterRoot.destroy();
        }
        this.characterRoot = this.createNode('VenueCharacters', this.characterLayer);
        const partners = getVenuePartners(this.venue.id);
        const compact = partners.length > 6;
        const columns = compact ? [-270, -90, 90, 270] : [-235, 0, 235];
        const rows = [-72, -305];
        const positions = partners.map((_, index) => new Vec3(
            columns[index % columns.length],
            rows[Math.floor(index / columns.length)],
        ));
        partners.forEach((partner, index) => {
            this.createCharacterCard(partner, positions[index], compact);
        });

        const player = this.createNode('VenuePlayer', this.characterLayer);
        player.setPosition(0, -525);
        player.getComponent(UITransform)?.setContentSize(55, 138);
        const sprite = player.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        resources.load('scene/layers/pink-girl-hd/spriteFrame', SpriteFrame, (error, frame) => {
            if (error || !frame) {
                gameFeel.showMissingImage(player, '你');
                return;
            }
            if (sprite.isValid) {
                sprite.spriteFrame = frame;
            }
        });
    }

    private createCharacterCard(partner: PartnerSupport, position: Vec3, compact = false): void {
        if (!this.characterRoot?.isValid) {
            return;
        }
        const met = this.progress.metCharacters.indexOf(partner.id) >= 0;
        const captured = this.progress.capturedCharacters.indexOf(partner.id) >= 0;
        const ready = this.isCaptureReady(partner);
        const card = this.createNode(`VenuePartner_${partner.id}`, this.characterRoot);
        card.setPosition(position);
        const cardWidth = compact ? 162 : 210;
        card.getComponent(UITransform)?.setContentSize(cardWidth, 194);
        const graphics = card.addComponent(Graphics);
        graphics.fillColor = captured
            ? new Color(255, 239, 248, 250)
            : new Color(255, 249, 253, 238);
        graphics.strokeColor = captured || ready
            ? this.venue.accent
            : new Color(235, 213, 237, 235);
        graphics.lineWidth = captured || ready ? 4 : 2;
        graphics.roundRect(-cardWidth / 2, -97, cardWidth, 194, 28);
        graphics.fill();
        graphics.stroke();

        const portraitFrame = this.createNode('PortraitFrame', card);
        portraitFrame.setPosition(0, 20);
        const portraitWidth = compact ? 82 : 105;
        const portraitHeight = compact ? 104 : 120;
        portraitFrame.getComponent(UITransform)?.setContentSize(portraitWidth, portraitHeight);
        const portraitGraphics = portraitFrame.addComponent(Graphics);
        portraitGraphics.fillColor = new Color(
            partner.accent.r,
            partner.accent.g,
            partner.accent.b,
            55,
        );
        portraitGraphics.roundRect(
            -portraitWidth / 2,
            -portraitHeight / 2,
            portraitWidth,
            portraitHeight,
            22,
        );
        portraitGraphics.fill();
        const portrait = this.createNode('Portrait', portraitFrame);
        portrait.getComponent(UITransform)?.setContentSize(
            portraitWidth - 6,
            portraitHeight - 6,
        );
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

        this.addLabel(
            card,
            'PartnerName',
            partner.name,
            18,
            new Color(93, 59, 101, 255),
            new Vec3(0, -52),
            cardWidth - 22,
            28,
            true,
        );
        this.addLabel(
            card,
            'PartnerRole',
            partner.role,
            13,
            new Color(137, 94, 139, 230),
            new Vec3(0, -76),
            cardWidth - 22,
            24,
            true,
        );
        const statusText = captured
            ? '已俘获'
            : ready
                ? '可以俘获'
                : met
                    ? `好感 ${getBond(this.progress, partner.id)} · 点击对话`
                    : '初次相遇 · 点击对话';
        this.addLabel(
            card,
            'PartnerStatus',
            statusText,
            12,
            captured || ready ? this.venue.accent : new Color(152, 112, 148, 230),
            new Vec3(0, -98),
            cardWidth - 22,
            22,
            true,
        );
        this.makeInteractive(card, () => this.openCharacterDialogue(partner));
    }

    private createHud(): void {
        const topBar = this.createNode('VenueTopBar', this.hudLayer);
        topBar.setPosition(0, 580);
        topBar.getComponent(UITransform)?.setContentSize(700, 92);
        const graphics = topBar.addComponent(Graphics);
        graphics.fillColor = new Color(255, 248, 252, 238);
        graphics.strokeColor = new Color(255, 255, 255, 225);
        graphics.lineWidth = 3;
        graphics.roundRect(-350, -46, 700, 92, 34);
        graphics.fill();
        graphics.stroke();
        this.addLabel(
            topBar,
            'VenueTitle',
            this.venue.name,
            31,
            new Color(101, 65, 108, 255),
            new Vec3(0, 14),
            500,
            44,
            true,
        );
        this.addLabel(
            topBar,
            'VenueSubtitle',
            this.venue.subtitle,
            17,
            new Color(145, 103, 146, 235),
            new Vec3(0, -24),
            520,
            28,
            true,
        );

        this.createButton(
            this.hudLayer,
            'BackToCity',
            '返回街区',
            new Vec3(-280, 493),
            128,
            54,
            this.venue.accent,
            () => director.loadScene('CityExplore'),
        );

        this.explorationLabel = this.addPillLabel(
            new Vec3(92, 493),
            225,
            `探索 ${this.getVenueDiscoveryCount()} / ${this.venue.exploration.length}`,
            new Color(255, 243, 248, 240),
            this.venue.accent,
        );
        this.charmLabel = this.addPillLabel(
            new Vec3(270, 493),
            130,
            `魅力 ${getCharmBreakdown(this.progress).total}`,
            new Color(255, 239, 186, 240),
            new Color(230, 177, 102, 255),
        );
        if (this.venue.id === 'hospital') {
            this.createButton(
                this.hudLayer,
                'OpenMedicalBeauty',
                '医疗美容中心',
                new Vec3(0, 405),
                230,
                54,
                new Color(129, 190, 189, 255),
                () => this.openSurgeryPanel(),
            );
        }

        this.addLabel(
            this.hudLayer,
            'VenueHint',
            '点击三处调查点熟悉场所 · 点击角色对话与完成任务',
            16,
            new Color(102, 70, 112, 225),
            new Vec3(0, -620),
            650,
            32,
            true,
        );
    }

    private addPillLabel(
        position: Vec3,
        width: number,
        text: string,
        fill: Color,
        stroke: Color,
    ): Label {
        const pill = this.createNode('HudPill', this.hudLayer);
        pill.setPosition(position);
        pill.getComponent(UITransform)?.setContentSize(width, 48);
        const graphics = pill.addComponent(Graphics);
        graphics.fillColor = fill;
        graphics.strokeColor = stroke;
        graphics.lineWidth = 2;
        graphics.roundRect(-width / 2, -24, width, 48, 24);
        graphics.fill();
        graphics.stroke();
        return this.addLabel(
            pill,
            'PillLabel',
            text,
            16,
            new Color(101, 69, 108, 255),
            Vec3.ZERO,
            width - 18,
            40,
            true,
        );
    }

    private updateHudProgress(): void {
        if (this.explorationLabel?.isValid) {
            this.explorationLabel.string = `探索 ${this.getVenueDiscoveryCount()} / ${this.venue.exploration.length}`;
        }
        if (this.charmLabel?.isValid) {
            this.charmLabel.string = `魅力 ${getCharmBreakdown(this.progress).total}`;
        }
    }

    private openSurgeryPanel(): void {
        if (this.surgeryModal?.isValid) {
            return;
        }
        const modal = this.createNode('SurgeryModal', this.modalLayer);
        modal.on(Node.EventType.TOUCH_START, (event) => {
            event.propagationStopped = true;
        });
        modal.on(Node.EventType.TOUCH_END, (event) => {
            event.propagationStopped = true;
        });
        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(34, 27, 52, 188);
        shade.rect(-375, -667, 750, 1334);
        shade.fill();

        const panel = this.createNode('SurgeryPanel', modal);
        panel.getComponent(UITransform)?.setContentSize(700, 850);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(247, 252, 252, 252);
        graphics.strokeColor = new Color(127, 190, 189, 255);
        graphics.lineWidth = 5;
        graphics.roundRect(-350, -425, 700, 850, 42);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(127, 190, 189, 255);
        graphics.roundRect(-135, 350, 270, 64, 32);
        graphics.fill();
        this.addLabel(
            panel,
            'SurgeryTitle',
            '医 疗 美 容 中 心',
            29,
            Color.WHITE,
            new Vec3(0, 382),
            500,
            56,
            true,
        );
        this.surgeryCharmLabel = this.addLabel(
            panel,
            'SurgeryCharm',
            '',
            21,
            new Color(77, 117, 119, 255),
            new Vec3(0, 305),
            580,
            40,
            true,
        );
        this.addLabel(
            panel,
            'SurgeryHint',
            '医疗美容按阶段解锁，效果永久生效并计入俘获魅力',
            17,
            new Color(112, 142, 144, 235),
            new Vec3(0, 268),
            600,
            34,
            true,
        );
        this.surgeryContent = this.createNode('SurgeryContent', panel);
        this.surgeryContent.setPosition(0, -5);
        this.surgeryContent.getComponent(UITransform)?.setContentSize(650, 540);
        this.createButton(
            panel,
            'CloseSurgery',
            '离开美容中心',
            new Vec3(0, -360),
            250,
            56,
            new Color(177, 202, 210, 255),
            () => this.closeSurgeryPanel(),
        );
        this.surgeryModal = modal;
        this.renderSurgeryContent();
    }

    private renderSurgeryContent(): void {
        if (!this.surgeryContent?.isValid) {
            return;
        }
        for (const child of [...this.surgeryContent.children]) {
            child.destroy();
        }
        const charm = getCharmBreakdown(this.progress);
        if (this.surgeryCharmLabel?.isValid) {
            this.surgeryCharmLabel.string = `当前魅力 ${charm.total}`
                + `（基础 ${charm.base} + 美妆 ${charm.cosmetics} + 医美 ${charm.surgery}）`;
        }
        const positions = [170, -20, -210];
        SURGERIES.forEach((surgery, index) => {
            this.createSurgeryCard(surgery, positions[index]);
        });
    }

    private createSurgeryCard(surgery: SurgeryDefinition, y: number): void {
        if (!this.surgeryContent?.isValid) {
            return;
        }
        const done = this.progress.surgeryLevel >= surgery.level;
        const available = this.progress.surgeryLevel === surgery.level - 1;
        const card = this.createNode(`Surgery_${surgery.level}`, this.surgeryContent);
        card.setPosition(0, y);
        card.getComponent(UITransform)?.setContentSize(620, 168);
        const graphics = card.addComponent(Graphics);
        graphics.fillColor = done
            ? new Color(surgery.accent.r, surgery.accent.g, surgery.accent.b, 72)
            : new Color(255, 255, 255, 240);
        graphics.strokeColor = done || available
            ? surgery.accent
            : new Color(205, 213, 218, 235);
        graphics.lineWidth = done || available ? 4 : 2;
        graphics.roundRect(-310, -84, 620, 168, 26);
        graphics.fill();
        graphics.stroke();
        this.addLabel(
            card,
            'SurgeryName',
            `${surgery.level}. ${surgery.name}`,
            23,
            new Color(65, 91, 98, 255),
            new Vec3(-112, 50),
            350,
            34,
            true,
        );
        this.addLabel(
            card,
            'SurgeryDescription',
            surgery.description,
            16,
            new Color(103, 124, 129, 235),
            new Vec3(-112, 8),
            390,
            48,
            true,
        );
        this.addLabel(
            card,
            'SurgeryBonus',
            `魅力永久 +${surgery.charmBonus} · ${surgery.price} 金币`,
            16,
            surgery.accent,
            new Vec3(-112, -48),
            360,
            28,
            true,
        );
        this.createButton(
            card,
            'SurgeryAction',
            done ? '已完成' : available ? '进行手术' : '尚未解锁',
            new Vec3(227, 0),
            140,
            56,
            done ? new Color(174, 190, 193, 255) : available
                ? surgery.accent
                : new Color(190, 199, 204, 255),
            () => this.buySurgery(surgery),
        );
    }

    private buySurgery(surgery: SurgeryDefinition): void {
        if (this.progress.surgeryLevel >= surgery.level) {
            this.showToast('这一阶段的医疗美容已经完成');
            return;
        }
        if (this.progress.surgeryLevel !== surgery.level - 1) {
            this.showToast('请先完成上一阶段医疗美容');
            return;
        }
        if (this.progress.coins < surgery.price) {
            this.showToast(`金币不足，还需要 ${surgery.price - this.progress.coins}`);
            return;
        }
        this.progress = {
            ...this.progress,
            coins: this.progress.coins - surgery.price,
            surgeryLevel: surgery.level,
        };
        saveProgress(this.progress);
        this.updateHudProgress();
        this.renderSurgeryContent();
        gameFeel.play('success');
        this.showToast(`${surgery.name}完成：魅力永久 +${surgery.charmBonus}`);
    }

    private closeSurgeryPanel(): void {
        if (this.surgeryModal?.isValid) {
            this.surgeryModal.destroy();
        }
        this.surgeryModal = null;
        this.surgeryContent = null;
        this.surgeryCharmLabel = null;
    }

    private openCharacterDialogue(partner: PartnerSupport): void {
        if (this.dialogueModal?.isValid) {
            return;
        }
        this.closeInfoModal();
        if (this.progress.metCharacters.indexOf(partner.id) < 0) {
            this.progress = meetCharacter(this.progress, partner.id);
            saveProgress(this.progress);
            this.createCharacters();
            gameFeel.play('gift');
        }

        const bond = getBond(this.progress, partner.id);
        const charm = getCharmBreakdown(this.progress).total;
        const found = this.getVenueDiscoveryCount();
        const captured = this.progress.capturedCharacters.indexOf(partner.id) >= 0;
        const ready = this.isCaptureReady(partner);
        const modal = this.createNode('VenueDialogueModal', this.modalLayer);
        modal.on(Node.EventType.TOUCH_START, (event) => {
            event.propagationStopped = true;
        });
        modal.on(Node.EventType.TOUCH_END, (event) => {
            event.propagationStopped = true;
        });
        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(39, 25, 49, 184);
        shade.rect(-375, -667, 750, 1334);
        shade.fill();

        const panel = this.createNode('VenueDialoguePanel', modal);
        panel.setPosition(0, 8);
        panel.getComponent(UITransform)?.setContentSize(680, 850);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(255, 248, 252, 252);
        graphics.strokeColor = partner.accent;
        graphics.lineWidth = 5;
        graphics.roundRect(-340, -425, 680, 850, 42);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = partner.accent;
        graphics.roundRect(-132, 345, 264, 64, 32);
        graphics.fill();
        this.addLabel(
            panel,
            'DialogueTitle',
            `${partner.name} · ${partner.role}`,
            29,
            Color.WHITE,
            new Vec3(0, 377),
            520,
            56,
            true,
        );

        const portraitCard = this.createNode('DialoguePortraitCard', panel);
        portraitCard.setPosition(-190, 95);
        portraitCard.getComponent(UITransform)?.setContentSize(240, 390);
        const portraitGraphics = portraitCard.addComponent(Graphics);
        portraitGraphics.fillColor = new Color(
            partner.accent.r,
            partner.accent.g,
            partner.accent.b,
            45,
        );
        portraitGraphics.strokeColor = new Color(255, 255, 255, 225);
        portraitGraphics.lineWidth = 3;
        portraitGraphics.roundRect(-120, -195, 240, 390, 32);
        portraitGraphics.fill();
        portraitGraphics.stroke();
        const portrait = this.createNode('DialoguePortrait', portraitCard);
        portrait.setPosition(0, 18);
        portrait.getComponent(UITransform)?.setContentSize(220, 260);
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
            'DialogueBond',
            `好感度 ${bond} / 6`,
            19,
            new Color(124, 82, 128, 255),
            new Vec3(0, -145),
            210,
            32,
            true,
        );
        this.createButton(
            portraitCard,
            'OpenCharacterProfile',
            '查看完整档案',
            new Vec3(0, -176),
            190,
            36,
            partner.accent,
            () => this.showCharacterProfile(partner),
        );

        this.addLabel(
            panel,
            'DialogueText',
            this.getDialogueText(partner),
            21,
            new Color(87, 55, 96, 255),
            new Vec3(140, 218),
            350,
            135,
            true,
        );
        this.addLabel(
            panel,
            'TaskTitle',
            '俘获条件',
            22,
            partner.accent,
            new Vec3(140, 128),
            300,
            38,
            true,
        );
        this.addLabel(
            panel,
            'CaptureConditions',
            `${found >= this.venue.exploration.length ? '✓' : '○'} 完成场所探索  ${found}/${this.venue.exploration.length}\n`
                + `${bond >= this.venue.captureBond ? '✓' : '○'} 好感度  ${bond}/${this.venue.captureBond}\n`
                + `${charm >= this.venue.captureCharm ? '✓' : '○'} 魅力值  ${charm}/${this.venue.captureCharm}`,
            19,
            new Color(108, 74, 114, 250),
            new Vec3(140, 42),
            360,
            150,
            true,
        );
        this.addLabel(
            panel,
            'CaptureState',
            captured
                ? '你已经俘获了他，可以继续邀请他约会或参加挑战。'
                : ready
                    ? '所有条件已满足，他正在等待你的回应。'
                    : '完成探索，并通过服装、化妆品、技能或医疗美容提升魅力后再来。',
            16,
            captured || ready ? partner.accent : new Color(147, 109, 151, 235),
            new Vec3(140, -80),
            350,
            54,
            true,
        );

        this.createButton(
            panel,
            'GiftPartner',
            `送礼物 ×${this.progress.gifts}`,
            new Vec3(-205, -342),
            190,
            58,
            new Color(247, 173, 197, 255),
            () => this.giveGift(partner),
        );
        this.createButton(
            panel,
            'CapturePartner',
            captured ? '已经俘获' : ready ? `俘获 ${partner.name}` : '条件未满足',
            new Vec3(0, -342),
            220,
            62,
            captured || ready ? partner.accent : new Color(190, 174, 201, 255),
            () => this.tryCapture(partner),
        );
        this.createButton(
            panel,
            'CloseDialogue',
            '继续探索',
            new Vec3(210, -342),
            180,
            58,
            new Color(195, 174, 221, 255),
            () => this.closeDialogue(),
        );
        this.dialogueModal = modal;
    }

    private showCharacterProfile(partner: PartnerSupport): void {
        const lore = getCharacterLore(partner.id);
        if (!lore) {
            this.showInfoModal(
                `${partner.name} · 角色档案`,
                `${partner.role}\n\n暂时还没有更详细的档案。`,
                partner.accent,
            );
            return;
        }
        this.showInfoModal(
            `${partner.name} · 角色档案`,
            `年龄 ${lore.age} · ${lore.job}\n\n`
                + `性格：${lore.personality}\n\n`
                + `偏好：${lore.preference}\n\n`
                + `关系：${lore.relationship}\n\n`
                + `故事钩子：${lore.hook}`,
            partner.accent,
        );
    }

    private giveGift(partner: PartnerSupport): void {
        if (this.progress.gifts <= 0) {
            this.showToast('礼物不足，可以先去街区兼职或完成线索任务');
            return;
        }
        const nextBond = Math.min(6, getBond(this.progress, partner.id) + 1);
        this.progress = {
            ...this.progress,
            gifts: this.progress.gifts - 1,
            hearts: Math.min(6, this.progress.hearts + 1),
            bonds: {
                ...this.progress.bonds,
                [partner.id]: nextBond,
            },
        };
        saveProgress(this.progress);
        gameFeel.play('gift');
        this.closeDialogue();
        this.createCharacters();
        this.updateHudProgress();
        this.openCharacterDialogue(partner);
        this.showToast(`送给${partner.name}一份樱花礼盒，好感 +1`);
    }

    private tryCapture(partner: PartnerSupport): void {
        if (this.progress.capturedCharacters.indexOf(partner.id) >= 0) {
            this.showToast('你已经俘获了这位角色');
            return;
        }
        if (!this.isCaptureReady(partner)) {
            const charm = getCharmBreakdown(this.progress).total;
            const bond = getBond(this.progress, partner.id);
            const found = this.getVenueDiscoveryCount();
            this.showToast(
                `还需探索 ${this.venue.exploration.length - found} 处 · `
                    + `好感 ${Math.max(0, this.venue.captureBond - bond)} 点 · `
                    + `魅力 ${Math.max(0, this.venue.captureCharm - charm)} 点`,
            );
            return;
        }

        this.progress = captureCharacter(this.progress, partner.id);
        saveProgress(this.progress);
        gameFeel.play('success');
        this.closeDialogue();
        this.createCharacters();
        this.updateHudProgress();
        this.showInfoModal(
            '俘获成功',
            `${partner.name}已经加入你的心动图鉴与搭档列表。\n\n`
                + '金币 +30 · 好感 +1 · 收集进度 +1\n\n'
                + '回到街区后，可以把他的工作地点作为下一次约会的起点。',
            partner.accent,
        );
    }

    private isCaptureReady(partner: PartnerSupport): boolean {
        return this.getVenueDiscoveryCount() >= this.venue.exploration.length
            && getBond(this.progress, partner.id) >= this.venue.captureBond
            && getCharmBreakdown(this.progress).total >= this.venue.captureCharm;
    }

    private getVenueDiscoveryCount(): number {
        return this.venue.exploration.filter(
            (point) => this.progress.venueDiscoveries.indexOf(point.id) >= 0,
        ).length;
    }

    private getDialogueText(partner: PartnerSupport): string {
        const dialogue: Record<string, string> = {
            'shen-xinglan': '咖啡馆今天很安静。我留了你喜欢的靠窗位置，不过要先帮我确认三张花笺。',
            'jiang-yanbai': '这几本旧书里夹着同一天的借阅卡。我怀疑有人故意把它们放在一起。',
            'jiang-yanbai-hoodie': '便装比较方便查资料。你愿意陪我看完最后三本书吗？',
            'xia-yang': '蛋糕试做成功啦！先别急着夸味道，帮我找出店里藏着的三个小惊喜。',
            'lu-qinglan': '舞台已经清场。我想让你先看看这束追光，再决定今晚的演出。',
            'lu-qinglan-hoodie': '没有灯光的时候，剧场反而更真实。陪我检查一下后台吧。',
            'gu-chenzhou': '礼物的价值藏在细节里。我已经准备好一份，但还想听听你的选择。',
            'liang-xingye': '舞台的空间比想象中更复杂。三处标记都确认后，我才能放心让你上台。',
            'tang-qi': '节奏已经起拍，你的脚步比任何提示都准。跟我一起把这段排练完吧。',
            'xie-wujiu': '咖啡渣和星图都指向同一个答案：今天适合认真认识一个人。',
            'pei-yuchuan': '不用着急完成委托。先坐下来喝杯咖啡，再告诉我今天过得怎么样。',
            'qi-guanlan': '借阅记录不会说谎。找出三处线索，我就能告诉你这段故事的另一半。',
            'cheng-yanli': '甜点要趁热，喜欢也要趁现在。帮我检查三处配方，好吗？',
            'huo-wenzhou': '工作场所的安全检查刚好缺一个人。你在旁边，我会更认真。',
            'song-zhao': '今晚的谢幕需要一个特别观众。先陪我确认舞台的三处细节吧。',
            'wen-xuechuan': '我想把这里的每个角度都拍下来，但最想留下的还是你入镜的一瞬。',
            'chu-yao': '这首曲子还没有名字。等你听完今晚的彩排，也许它会知道该写给谁。',
            'ji-xingran': '鼓点已经起拍，下一段只差一个愿意站到舞台边的人。你会留下吗？',
            'shen-yuheng': '走廊里的灯有点冷。先帮我确认这三份值班记录，再一起喝杯热的。',
            'shen-qinghe': '孩子们刚离开，诊室安静下来了。我想听你说说今天有没有哪里不舒服。',
            'wen-yu': '深海探测最怕失去方向，我却总能在这里找到你。帮我检查最后三件设备吧。',
            'jing-mo': '今晚的赛道很干净，适合跑一圈。不过我更想知道，你愿不愿意坐副驾驶。',
            'pei-yao': '速度可以计算，心动不行。三处赛道标记确认后，陪我做一圈慢速赛道吧。',
            'su-yan': '课堂之外，我不太习惯给人打分。但这三份旧资料，还是想请你一起看看。',
            'jiang-xubai': '这册古书缺了几页。我想把故事补完整，也想留一页写我们的名字。',
            'su-linyuan': '古物最会说谎，人的眼睛却很难。你愿意让我认真看看你在想什么吗？',
            'ye-ci': '这次任务没有危险，只有三处需要确认的地点。任务结束后，我想用真名见你。',
            'cang-lan': '深海里的光很弱，所以才显得相遇珍贵。陪我完成最后三项探测吧。',
            'xiao-tang': '今天的会议可以推后。这栋楼里还有三件事没有确认，但最重要的客人已经来了。',
            'sha-luo': '系统说今天的相遇概率不到百分之一。看来最值得相信的还是眼前的人。',
            'lu-shiyue': '我为这里的人调过很多气味。今天想留下一种，只在你靠近时才会出现。',
        };
        return dialogue[partner.id] ?? `${partner.name}正在等你完成工作场所的探索。`;
    }

    private closeDialogue(): void {
        if (this.dialogueModal?.isValid) {
            this.dialogueModal.destroy();
        }
        this.dialogueModal = null;
    }

    private showInfoModal(title: string, message: string, accent: Color): void {
        this.closeInfoModal();
        const modal = this.createNode('VenueInfoModal', this.modalLayer);
        const opacity = modal.addComponent(UIOpacity);
        opacity.opacity = 0;
        const shade = modal.addComponent(Graphics);
        shade.fillColor = new Color(40, 26, 50, 178);
        shade.rect(-375, -667, 750, 1334);
        shade.fill();

        const panel = this.createNode('InfoPanel', modal);
        panel.setPosition(0, 18);
        panel.getComponent(UITransform)?.setContentSize(620, 510);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(255, 248, 252, 250);
        graphics.strokeColor = accent;
        graphics.lineWidth = 5;
        graphics.roundRect(-310, -255, 620, 510, 38);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = accent;
        graphics.roundRect(-125, 178, 250, 62, 31);
        graphics.fill();
        this.addLabel(panel, 'InfoTitle', title, 32, Color.WHITE, new Vec3(0, 209), 430, 54, true);
        this.addLabel(
            panel,
            'InfoMessage',
            message,
            22,
            new Color(91, 60, 98, 255),
            new Vec3(0, 30),
            530,
            270,
            true,
        );
        this.createButton(
            panel,
            'CloseInfo',
            '知道了',
            new Vec3(0, -204),
            230,
            58,
            accent,
            () => this.closeInfoModal(),
        );
        this.infoModal = modal;
        tween(opacity).to(0.16, { opacity: 255 }).start();
    }

    private closeInfoModal(): void {
        if (this.infoModal?.isValid) {
            this.infoModal.destroy();
        }
        this.infoModal = null;
    }

    private showVenueIntro(): void {
        const partnerCount = getVenuePartners(this.venue.id).length;
        this.showToast(`${this.venue.name} · ${partnerCount} 名角色正在工作`);
    }

    private showToast(text: string): void {
        if (this.toastNode?.isValid) {
            this.toastNode.destroy();
        }
        const toastParent = this.dialogueModal?.isValid || this.surgeryModal?.isValid
            ? this.modalLayer
            : this.feedbackLayer;
        const toast = this.createNode('VenueToast', toastParent);
        toast.setPosition(0, 397);
        toast.getComponent(UITransform)?.setContentSize(520, 58);
        const graphics = toast.addComponent(Graphics);
        graphics.fillColor = new Color(255, 249, 253, 245);
        graphics.strokeColor = this.venue.accent;
        graphics.lineWidth = 2;
        graphics.roundRect(-260, -29, 520, 58, 29);
        graphics.fill();
        graphics.stroke();
        this.addLabel(
            toast,
            'ToastLabel',
            text,
            18,
            new Color(101, 68, 108, 255),
            Vec3.ZERO,
            480,
            48,
            true,
        );
        const opacity = toast.addComponent(UIOpacity);
        tween(opacity)
            .delay(1.5)
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
        const button = this.createNode(name, parent);
        button.setPosition(position);
        button.getComponent(UITransform)?.setContentSize(width, height);
        const graphics = button.addComponent(Graphics);
        graphics.fillColor = new Color(255, 250, 253, 246);
        graphics.strokeColor = accent;
        graphics.lineWidth = 3;
        graphics.roundRect(-width / 2, -height / 2, width, height, height / 2);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(accent.r, accent.g, accent.b, 45);
        graphics.roundRect(
            -width / 2 + 8,
            -height / 2 + 8,
            width - 16,
            height - 16,
            (height - 16) / 2,
        );
        graphics.fill();
        this.addLabel(
            button,
            'ButtonLabel',
            text,
            18,
            new Color(100, 65, 108, 255),
            Vec3.ZERO,
            width - 22,
            height - 16,
            true,
        );
        this.makeInteractive(button, onTap);
        return button;
    }

    private makeInteractive(node: Node, onTap: () => void): void {
        node.on(Node.EventType.TOUCH_START, () => {
            if (!this.actionLocked) {
                tween(node).to(0.06, { scale: new Vec3(0.96, 0.96, 1) }).start();
            }
        });
        const restore = (): void => {
            if (node.isValid) {
                tween(node).to(0.08, { scale: Vec3.ONE }).start();
            }
        };
        node.on(Node.EventType.TOUCH_CANCEL, restore);
        node.on(Node.EventType.TOUCH_END, () => {
            restore();
            if (this.actionLocked) {
                return;
            }
            this.actionLocked = true;
            gameFeel.play('click');
            onTap();
            this.scheduleOnce(() => {
                this.actionLocked = false;
            }, 0.26);
        });
    }

    private createLayer(name: string): Node {
        const node = this.createNode(name, this.node);
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
        label.outlineColor = new Color(255, 255, 255, 105);
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

function venueNullFallback(color: Color): Color {
    return new Color(color.r, color.g, color.b, 225);
}
