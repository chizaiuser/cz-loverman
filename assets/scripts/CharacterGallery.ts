import {
    _decorator,
    Color,
    Component,
    director,
    EventTouch,
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
import { getCharacterLore } from './CharacterLoreData';

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
    {
        id: 'liang-xingye',
        name: '梁星野',
        bond: '2/6',
        resource: 'characters/new-male-leads/01-liang-xingye/spriteFrame',
        accent: new Color(191, 157, 117, 255),
        description: '独立建筑师，寡言而专注。他设计了一座没有业主的观景亭，草图却像你童年的秘密基地。',
    },
    {
        id: 'tang-qi',
        name: '唐栖',
        bond: '2/6',
        resource: 'characters/new-male-leads/02-tang-qi/spriteFrame',
        accent: new Color(94, 194, 226, 255),
        description: '电竞战队队长，话多又好胜。匿名比赛录像里的坐标，指向一间废弃游戏厅。',
    },
    {
        id: 'xie-wujiu',
        name: '谢无咎',
        bond: '2/6',
        resource: 'characters/new-male-leads/03-xie-wujiu/spriteFrame',
        accent: new Color(145, 132, 221, 255),
        description: '天文馆馆主，平静而神秘。他准确说出你会在今天出现，却拒绝预言接下来的故事。',
    },
    {
        id: 'pei-yuchuan',
        name: '裴予川',
        bond: '2/6',
        resource: 'characters/new-male-leads/04-pei-yuchuan/spriteFrame',
        accent: new Color(143, 193, 156, 255),
        description: '花艺策展人，温柔而有边界。他为匿名客人准备花束，请你在花瓣里寻找收花人的线索。',
    },
    {
        id: 'qi-guanlan',
        name: '祁观澜',
        bond: '2/6',
        resource: 'characters/new-male-leads/05-qi-guanlan/spriteFrame',
        accent: new Color(142, 151, 167, 255),
        description: '古籍修复师，克制又严谨。一册旧书缺失的页码里，出现了你的名字。',
    },
    {
        id: 'cheng-yanli',
        name: '程砚礼',
        bond: '2/6',
        resource: 'characters/new-male-leads/06-cheng-yanli/spriteFrame',
        accent: new Color(226, 166, 117, 255),
        description: '甜品店继承人，认真直球。他想复刻你童年吃过的甜点，却不肯说出配方是谁提供的。',
    },
    {
        id: 'huo-wenzhou',
        name: '霍闻舟',
        bond: '2/6',
        resource: 'characters/new-male-leads/07-huo-wenzhou/spriteFrame',
        accent: new Color(92, 125, 174, 255),
        description: '城市救援队长，成熟可靠。一次市集事故后，他请你在寻找走失孩子的过程中留意异常线索。',
    },
    {
        id: 'song-zhao',
        name: '宋照',
        bond: '2/6',
        resource: 'characters/new-male-leads/08-song-zhao/spriteFrame',
        accent: new Color(205, 101, 124, 255),
        description: '剧院首席演员，明艳又敏感。他请你临时对戏，剧本里的台词却逐渐对应两人的真实经历。',
    },
    {
        id: 'wen-xuechuan',
        name: '闻雪川',
        bond: '2/6',
        resource: 'characters/new-male-leads/09-wen-xuechuan/spriteFrame',
        accent: new Color(126, 187, 230, 255),
        description: '气象摄影师，银发冒险家。他拍到一张照片，里面是你从未去过的地点和未来的自己。',
    },
    {
        id: 'chu-yao',
        name: '楚曜',
        bond: '2/6',
        resource: 'characters/new-male-leads/10-chu-yao/spriteFrame',
        accent: new Color(211, 191, 236, 255),
        description: '青年钢琴家，优雅却厌倦被包装成完美偶像。他匿名留下一段曲子，只等你听出真正的情绪。',
    },
    {
        id: 'ji-xingran',
        name: '季星燃',
        bond: '2/6',
        resource: 'characters/new-male-leads/23-ji-xingran/spriteFrame',
        accent: new Color(215, 105, 117, 255),
        description: '爵士鼓手，舞台上永远精力充沛。散场后却会认真记住你随口说过的一首老歌。',
    },
    {
        id: 'shen-yuheng',
        name: '沈逾恒',
        bond: '2/6',
        resource: 'characters/new-male-leads/11-shen-yuheng/spriteFrame',
        accent: new Color(139, 180, 204, 255),
        description: '骨科主治医生，理性克制，说话简短。他的值班表上总会为你留出一段不被工作占用的时间。',
    },
    {
        id: 'shen-qinghe',
        name: '沈清和',
        bond: '2/6',
        resource: 'characters/new-male-leads/18-shen-qinghe/spriteFrame',
        accent: new Color(143, 199, 202, 255),
        description: '儿科医生，温和耐心。面对孩子总能找到最柔软的表达，面对喜欢的人却会紧张到忘记医嘱。',
    },
    {
        id: 'wen-yu',
        name: '温聿',
        bond: '2/6',
        resource: 'characters/new-male-leads/20-wen-yu/spriteFrame',
        accent: new Color(104, 161, 215, 255),
        description: '深海医学家，习惯在极端环境里保持冷静。他说最危险的不是深海，而是无法说出口的喜欢。',
    },
    {
        id: 'jing-mo',
        name: '荆墨',
        bond: '2/6',
        resource: 'characters/new-male-leads/12-jing-mo/spriteFrame',
        accent: new Color(107, 96, 197, 255),
        description: '地下赛车手，爱笑也爱冒险。比起稳赢的比赛，他更在意终点有没有等着自己的人。',
    },
    {
        id: 'pei-yao',
        name: '裴曜',
        bond: '2/6',
        resource: 'characters/new-male-leads/16-pei-yao/spriteFrame',
        accent: new Color(207, 102, 115, 255),
        description: '职业赛车手，胜负欲强却尊重对手。他把最快的圈速留给自己，把副驾驶的位置留给你。',
    },
    {
        id: 'su-yan',
        name: '苏砚',
        bond: '2/6',
        resource: 'characters/new-male-leads/13-su-yan/spriteFrame',
        accent: new Color(139, 134, 177, 255),
        description: '大学教授，成熟克制。课堂上从不迟到，唯独为了等你，会在旧书室多留一盏灯。',
    },
    {
        id: 'jiang-xubai',
        name: '江叙白',
        bond: '2/6',
        resource: 'characters/new-male-leads/21-jiang-xubai/spriteFrame',
        accent: new Color(145, 115, 87, 255),
        description: '古籍修复师，安静专注。他能修好残缺的书页，也愿意慢慢补全两个人之间错过的故事。',
    },
    {
        id: 'su-linyuan',
        name: '苏临渊',
        bond: '2/6',
        resource: 'characters/new-male-leads/22-su-linyuan/spriteFrame',
        accent: new Color(175, 142, 104, 255),
        description: '古董鉴定师，眼光锐利而从容。他说真正的珍品不靠年代证明，而看是否有人愿意一直珍藏。',
    },
    {
        id: 'ye-ci',
        name: '夜辞',
        bond: '2/6',
        resource: 'characters/new-male-leads/14-ye-ci/spriteFrame',
        accent: new Color(94, 91, 111, 255),
        description: '秘密特工，行踪神秘。他擅长隐藏身份，却在每次任务结束后都会回到同一条樱花街。',
    },
    {
        id: 'cang-lan',
        name: '沧澜',
        bond: '2/6',
        resource: 'characters/new-male-leads/15-cang-lan/spriteFrame',
        accent: new Color(77, 165, 205, 255),
        description: '深海学家，对未知世界充满好奇。他记录过无数深海生物，却第一次想认真记录一个人的笑容。',
    },
    {
        id: 'xiao-tang',
        name: '萧棠',
        bond: '2/6',
        resource: 'characters/new-male-leads/17-xiao-tang/spriteFrame',
        accent: new Color(116, 107, 105, 255),
        description: '集团总裁，成熟果断。他习惯安排所有细节，却愿意把周末的决定权完整交给你。',
    },
    {
        id: 'sha-luo',
        name: '撒罗',
        bond: '2/6',
        resource: 'characters/new-male-leads/19-sha-luo/spriteFrame',
        accent: new Color(93, 130, 191, 255),
        description: '科技新贵，聪明又有点孩子气。他能破解最复杂的程序，却猜不透一句晚安背后的心意。',
    },
    {
        id: 'lu-shiyue',
        name: '陆时玥',
        bond: '2/6',
        resource: 'characters/new-male-leads/24-lu-shiyue/spriteFrame',
        accent: new Color(188, 161, 211, 255),
        description: '私人调香师，银发冷淡。他为许多人调配气味，唯独为你保留了那瓶还没命名的香。',
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
    private pageRoot!: Node;
    private pages: Node[] = [];
    private currentPage = 0;
    private pageIndicatorLabel: Label | null = null;
    private leftPageButton: Node | null = null;
    private rightPageButton: Node | null = null;
    private swipeStartX = 0;
    private gestureMoved = false;
    private pageAnimating = false;

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

        this.pageRoot = this.createUiNode('GalleryPages', this.characterLayer);
        const columns = [-232, 0, 232];
        const rows = [305, 55, -195];
        const pageEntries: CharacterEntry[][] = [CHARACTERS.slice(0, 8)];
        for (let index = 8; index < CHARACTERS.length; index += 9) {
            pageEntries.push(CHARACTERS.slice(index, index + 9));
        }
        pageEntries.forEach((entries, pageIndex) => {
            const page = this.createUiNode(`GalleryPage_${pageIndex + 1}`, this.pageRoot);
            page.setPosition(pageIndex * DESIGN_WIDTH, 0);
            this.pages.push(page);
            entries.forEach((entry, index) => {
                this.createCharacterCard(
                    page,
                    entry,
                    columns[index % 3],
                    rows[Math.floor(index / 3)],
                );
            });
            if (pageIndex === 0) {
                this.createProgressCard(page, columns[2], rows[2]);
            }
        });

        this.characterLayer.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            this.swipeStartX = event.getUILocation().x;
            this.gestureMoved = false;
        });
        this.characterLayer.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
            if (Math.abs(event.getUILocation().x - this.swipeStartX) > 12) {
                this.gestureMoved = true;
            }
        });
        this.characterLayer.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            const deltaX = event.getUILocation().x - this.swipeStartX;
            if (Math.abs(deltaX) > 58) {
                this.changePage(this.currentPage + (deltaX < 0 ? 1 : -1));
            }
            this.gestureMoved = false;
        });
        this.characterLayer.on(Node.EventType.TOUCH_CANCEL, () => {
            this.gestureMoved = false;
        });
        this.updateCardSelection();
        this.updatePageNavigation();
    }

    private createCharacterCard(
        parent: Node,
        entry: CharacterEntry,
        x: number,
        y: number,
    ): void {
        const card = this.createUiNode(`CharacterCard_${entry.id}`, parent);
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
                '前往工作场所相遇',
                17,
                new Color(255, 245, 251, 230),
                new Vec3(0, -25),
                170,
                32,
                true,
            );
        } else if (this.progress.capturedCharacters.indexOf(entry.id) >= 0) {
            const captureBadge = this.createUiNode('CapturedBadge', card);
            captureBadge.setPosition(-66, 99);
            captureBadge.getComponent(UITransform)?.setContentSize(72, 28);
            const captureGraphics = captureBadge.addComponent(Graphics);
            captureGraphics.fillColor = new Color(246, 140, 178, 245);
            captureGraphics.roundRect(-36, -14, 72, 28, 14);
            captureGraphics.fill();
            this.addLabel(
                captureBadge,
                'CapturedLabel',
                '已俘获',
                13,
                Color.WHITE,
                Vec3.ZERO,
                66,
                24,
                true,
            );
        }

        this.cardNodes.set(entry.id, card);
        this.makeInteractive(card, () => {
            if (this.gestureMoved) {
                return;
            }
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

    private createProgressCard(parent: Node, x: number, y: number): void {
        const card = this.createUiNode('CollectionProgress', parent);
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

    private changePage(targetPage: number, playSound = true): void {
        if (this.pageAnimating) {
            return;
        }
        const nextPage = Math.max(0, Math.min(this.pages.length - 1, targetPage));
        if (nextPage === this.currentPage) {
            if (targetPage !== nextPage) {
                this.showToast(targetPage < 0 ? '已经是第一页' : '已经是最后一页');
            }
            return;
        }
        this.pageAnimating = true;
        this.currentPage = nextPage;
        this.updatePageNavigation();
        if (playSound) {
            gameFeel.play('click');
        }
        tween(this.pageRoot)
            .to(
                0.28,
                { position: new Vec3(-nextPage * DESIGN_WIDTH, 0, 0) },
                { easing: 'quadOut' },
            )
            .call(() => {
                this.pageAnimating = false;
            })
            .start();
    }

    private updatePageNavigation(): void {
        if (this.pageIndicatorLabel?.isValid) {
            this.pageIndicatorLabel.string = `${this.currentPage + 1} / ${this.pages.length}　左右滑动翻页`;
        }
        const leftOpacity = this.leftPageButton?.getComponent(UIOpacity);
        const rightOpacity = this.rightPageButton?.getComponent(UIOpacity);
        if (leftOpacity) {
            leftOpacity.opacity = this.currentPage === 0 ? 80 : 255;
        }
        if (rightOpacity) {
            rightOpacity.opacity = this.currentPage === this.pages.length - 1 ? 80 : 255;
        }
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

        this.leftPageButton = this.createButton(
            'PreviousPageButton',
            '‹',
            new Vec3(-305, -420),
            58,
            52,
            new Color(202, 170, 235, 255),
            () => this.changePage(this.currentPage - 1, false),
        );
        this.leftPageButton.addComponent(UIOpacity);
        this.rightPageButton = this.createButton(
            'NextPageButton',
            '›',
            new Vec3(305, -420),
            58,
            52,
            new Color(202, 170, 235, 255),
            () => this.changePage(this.currentPage + 1, false),
        );
        this.rightPageButton.addComponent(UIOpacity);
        this.pageIndicatorLabel = this.addLabel(
            this.actionLayer,
            'PageIndicator',
            `1 / ${this.pages.length}　左右滑动翻页`,
            17,
            new Color(122, 86, 132, 220),
            new Vec3(0, -420),
            430,
            36,
            true,
        );
        this.updatePageNavigation();

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
            this.characterProfileText(entry),
            entry.accent,
            22,
        );
    }

    private characterProfileText(entry: CharacterEntry): string {
        const lore = getCharacterLore(entry.id);
        const capture = this.progress.capturedCharacters.indexOf(entry.id) >= 0
            ? '已俘获'
            : '尚未俘获';
        if (!lore) {
            return `${entry.description}\n\n心动值：${getBond(this.progress, entry.id)}/6\n`
                + `俘获状态：${capture}`;
        }
        return `${entry.description}\n\n`
            + `年龄 ${lore.age} · ${lore.job}\n`
            + `性格：${lore.personality}\n`
            + `偏好：${lore.preference}\n`
            + `关系：${lore.relationship}\n`
            + `故事钩子：${lore.hook}\n`
            + `心动值：${getBond(this.progress, entry.id)}/6 · ${capture}`;
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

    private showModal(
        title: string,
        message: string,
        accent: Color,
        messageFontSize = 27,
    ): void {
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
            messageFontSize,
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
