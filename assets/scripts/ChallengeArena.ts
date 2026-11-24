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
    getEffectiveStats,
    loadProgress,
    PlayerProgress,
    saveProgress,
    statLabel,
} from './GameProgress';
import { getOutfit } from './WardrobeData';
import {
    getPartnerSupport,
    getPartnerPortraitPath,
    PARTNERS,
    PartnerSupport,
} from './PartnerData';
import { CHALLENGE_REWARDS } from './EconomyData';

const { ccclass } = _decorator;

const DESIGN_WIDTH = 750;
const DESIGN_HEIGHT = 1334;

type ChallengeRound = 1 | 2 | 3;

interface RivalQuestion {
    prompt: string;
    choices: string[];
    correctIndex: number;
    explanation: string;
}

interface RivalDefinition {
    id: string;
    name: string;
    title: string;
    theme: string;
    themeTags: string[];
    quote: string;
    unlockAfter: string;
    firstReward: number;
    repeatReward: number;
    roundScores: [number, number, number];
    accent: Color;
    hair: Color;
    question: RivalQuestion;
}

interface ChallengeOutcome {
    won: boolean;
    firstWin: boolean;
    reward: number;
    playerTotal: number;
    rivalTotal: number;
    unlockedNext: boolean;
}

const RIVALS: RivalDefinition[] = [
    {
        id: 'su-man',
        name: '苏蔓',
        title: '甜心商店首席鉴赏师',
        theme: '甜美 × 优雅',
        themeTags: ['甜美', '优雅'],
        quote: '好看只是入场券，搭配里有没有你自己的故事，才决定能不能留下来。',
        unlockAfter: '',
        firstReward: CHALLENGE_REWARDS['su-man'].first,
        repeatReward: CHALLENGE_REWARDS['su-man'].repeat,
        roundScores: [165, 150, 145],
        accent: new Color(241, 137, 178, 255),
        hair: new Color(126, 76, 93, 255),
        question: {
            prompt: '提交线索卡前，你听见摊主说：\n“银发少年把一片樱花书签夹进了甜品券。”\n哪条信息最值得优先确认？',
            choices: [
                '甜品券上留下的店名',
                '书签是不是银色',
                '少年今天穿的外套',
            ],
            correctIndex: 0,
            explanation: '店名能直接关联旧店铺与第一章目标，是可用于推理的有效线索。',
        },
    },
    {
        id: 'ji-lan',
        name: '纪岚',
        title: '星屑剧场地下赛主持人',
        theme: '冷艳 × 街头',
        themeTags: ['冷艳', '街头'],
        quote: '别急着看观众。先看清脚下的线，再决定下一步站在哪里。',
        unlockAfter: 'su-man',
        firstReward: CHALLENGE_REWARDS['ji-lan'].first,
        repeatReward: CHALLENGE_REWARDS['ji-lan'].repeat,
        roundScores: [165, 160, 145],
        accent: new Color(126, 154, 224, 255),
        hair: new Color(54, 58, 82, 255),
        question: {
            prompt: '舞台灯光突然熄灭，距离正式演出只剩十秒。\n作为现场统筹，你的第一判断是什么？',
            choices: [
                '观察观众席是否有人离场',
                '确认固定道具位置与安全出口',
                '询问搭档是否记得节目顺序',
            ],
            correctIndex: 1,
            explanation: '突发状况下先排除移动障碍与安全风险，再处理演出调度。',
        },
    },
];

@ccclass('ChallengeArena')
export class ChallengeArena extends Component {
    private backgroundLayer!: Node;
    private arenaLayer!: Node;
    private hudLayer!: Node;
    private feedbackLayer!: Node;
    private modalLayer!: Node;
    private content!: Node;
    private coinLabel!: Label;
    private subtitleLabel!: Label;
    private toastNode: Node | null = null;
    private progress!: PlayerProgress;
    private currentRival: RivalDefinition | null = null;
    private currentRound: ChallengeRound = 1;
    private playerRoundScores = [-1, -1, -1];
    private actionLocked = false;

    protected start(): void {
        this.progress = loadProgress();
        gameFeel.init();
        this.createLayers();
        this.createBackground();
        this.createHud();
        this.renderRivalSelection();
        gameFeel.fadeIn(this.node);
    }

    protected onDestroy(): void {
        this.unscheduleAllCallbacks();
    }

    private createLayers(): void {
        this.backgroundLayer = this.createLayer('BackgroundLayer');
        this.arenaLayer = this.createLayer('ArenaLayer');
        this.hudLayer = this.createLayer('HudLayer');
        this.feedbackLayer = this.createLayer('FeedbackLayer');
        this.modalLayer = this.createLayer('ModalLayer');
        this.content = this.createNode('ChallengeContent', this.arenaLayer);
    }

    private createBackground(): void {
        const sky = this.createNode('ChallengeGradient', this.backgroundLayer);
        sky.getComponent(UITransform)?.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
        const graphics = sky.addComponent(Graphics);
        const bands = 34;
        const bandHeight = DESIGN_HEIGHT / bands;
        const top = new Color(103, 71, 139, 255);
        const middle = new Color(208, 143, 190, 255);
        const bottom = new Color(255, 211, 224, 255);
        for (let index = 0; index < bands; index += 1) {
            const ratio = index / (bands - 1);
            graphics.fillColor = ratio < 0.52
                ? this.lerpColor(top, middle, ratio / 0.52)
                : this.lerpColor(middle, bottom, (ratio - 0.52) / 0.48);
            graphics.rect(
                -DESIGN_WIDTH / 2,
                DESIGN_HEIGHT / 2 - (index + 1) * bandHeight,
                DESIGN_WIDTH,
                bandHeight + 1,
            );
            graphics.fill();
        }

        const glow = this.createNode('StageGlow', this.backgroundLayer);
        glow.setPosition(0, 225);
        glow.getComponent(UITransform)?.setContentSize(700, 660);
        const glowGraphics = glow.addComponent(Graphics);
        glowGraphics.fillColor = new Color(255, 240, 250, 34);
        glowGraphics.circle(0, 0, 285);
        glowGraphics.fill();
        glowGraphics.fillColor = new Color(255, 229, 243, 30);
        glowGraphics.circle(0, 0, 220);
        glowGraphics.fill();

        const beams = this.createNode('StageBeams', this.backgroundLayer);
        beams.getComponent(UITransform)?.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
        const beamGraphics = beams.addComponent(Graphics);
        beamGraphics.fillColor = new Color(255, 226, 243, 28);
        beamGraphics.moveTo(-335, 667);
        beamGraphics.lineTo(-70, 35);
        beamGraphics.lineTo(100, 35);
        beamGraphics.lineTo(-160, 667);
        beamGraphics.close();
        beamGraphics.fill();
        beamGraphics.moveTo(335, 667);
        beamGraphics.lineTo(70, 35);
        beamGraphics.lineTo(-100, 35);
        beamGraphics.lineTo(160, 667);
        beamGraphics.close();
        beamGraphics.fill();

        const floor = this.createNode('ArenaFloor', this.backgroundLayer);
        floor.setPosition(0, -485);
        floor.getComponent(UITransform)?.setContentSize(DESIGN_WIDTH, 360);
        const floorGraphics = floor.addComponent(Graphics);
        floorGraphics.fillColor = new Color(255, 216, 232, 105);
        floorGraphics.moveTo(-375, 180);
        floorGraphics.lineTo(375, 180);
        floorGraphics.lineTo(430, -180);
        floorGraphics.lineTo(-430, -180);
        floorGraphics.close();
        floorGraphics.fill();
        floorGraphics.strokeColor = new Color(255, 244, 250, 110);
        floorGraphics.lineWidth = 2;
        for (let index = -4; index <= 4; index += 1) {
            floorGraphics.moveTo(index * 78, 180);
            floorGraphics.lineTo(index * 105, -180);
        }
        for (let index = 0; index < 6; index += 1) {
            const y = 145 - index * 65;
            const width = 330 + index * 42;
            floorGraphics.moveTo(-width, y);
            floorGraphics.lineTo(width, y);
        }
        floorGraphics.stroke();

        const title = this.addLabel(
            this.backgroundLayer,
            'ArenaBackdropTitle',
            'LOVERMAN · RIVAL STAGE',
            18,
            new Color(255, 243, 250, 120),
            new Vec3(0, -618),
            500,
            32,
            true,
        );
        title.spacingX = 4;
    }

    private createHud(): void {
        const topBar = this.createNode('ChallengeTopBar', this.hudLayer);
        topBar.setPosition(0, 578);
        topBar.getComponent(UITransform)?.setContentSize(700, 92);
        const graphics = topBar.addComponent(Graphics);
        graphics.fillColor = new Color(255, 247, 252, 235);
        graphics.strokeColor = new Color(255, 255, 255, 220);
        graphics.lineWidth = 3;
        graphics.roundRect(-350, -46, 700, 92, 34);
        graphics.fill();
        graphics.stroke();

        this.addLabel(
            topBar,
            'ArenaTitle',
            '女 性 挑 战 场',
            31,
            new Color(103, 66, 112, 255),
            new Vec3(0, 14),
            520,
            46,
            true,
        );
        this.subtitleLabel = this.addLabel(
            topBar,
            'ArenaSubtitle',
            `穿搭 · 线索 · 搭档   |   已胜 ${this.progress.challengeWins} 场`,
            17,
            new Color(148, 105, 147, 235),
            new Vec3(0, -24),
            540,
            28,
            true,
        );

        this.createButton(
            this.hudLayer,
            'BackToCity',
            '返回街区',
            new Vec3(-278, 495),
            126,
            52,
            new Color(206, 168, 225, 255),
            () => director.loadScene('CityExplore'),
        );

        const coinPill = this.createNode('ChallengeCoinPill', this.hudLayer);
        coinPill.setPosition(258, 495);
        coinPill.getComponent(UITransform)?.setContentSize(190, 52);
        const coinGraphics = coinPill.addComponent(Graphics);
        coinGraphics.fillColor = new Color(255, 239, 181, 238);
        coinGraphics.strokeColor = new Color(234, 179, 105, 235);
        coinGraphics.lineWidth = 2;
        coinGraphics.roundRect(-95, -26, 190, 52, 26);
        coinGraphics.fill();
        coinGraphics.stroke();
        this.coinLabel = this.addLabel(
            coinPill,
            'ChallengeCoinLabel',
            `金币 ${this.progress.coins}`,
            20,
            new Color(129, 82, 52, 255),
            Vec3.ZERO,
            170,
            44,
            true,
        );

        this.addLabel(
            this.hudLayer,
            'ChallengeRuleHint',
            '三局总分更高者获胜 · 奖励与对手解锁会写入存档',
            17,
            new Color(101, 72, 112, 220),
            new Vec3(0, -630),
            580,
            32,
            true,
        );
    }

    private renderRivalSelection(): void {
        this.currentRival = null;
        this.playerRoundScores = [-1, -1, -1];
        this.clearContent();
        this.updateHudProgress();

        this.addLabel(
            this.content,
            'SelectionTitle',
            '选择今天的挑战对手',
            31,
            new Color(255, 248, 252, 255),
            new Vec3(0, 445),
            580,
            52,
            true,
        );
        this.addLabel(
            this.content,
            'SelectionHint',
            '对手有不同穿搭偏好和线索题目，搭档也会影响第三轮。',
            18,
            new Color(255, 239, 248, 225),
            new Vec3(0, 408),
            620,
            34,
            true,
        );

        RIVALS.forEach((rival, index) => {
            const y = index === 0 ? 218 : -100;
            this.createRivalCard(rival, new Vec3(0, y));
        });

        const defeatedCount = RIVALS.filter(
            (rival) => this.progress.defeatedRivals.indexOf(rival.id) >= 0,
        ).length;
        this.addLabel(
            this.content,
            'RivalProgress',
            `对手进度 ${defeatedCount}/${RIVALS.length}   ·   重复挑战仍可获得少量金币`,
            17,
            new Color(255, 240, 249, 225),
            new Vec3(0, -312),
            620,
            34,
            true,
        );
    }

    private createRivalCard(rival: RivalDefinition, position: Vec3): void {
        const unlocked = this.isRivalUnlocked(rival);
        const defeated = this.progress.defeatedRivals.indexOf(rival.id) >= 0;
        const card = this.createNode(`RivalCard_${rival.id}`, this.content);
        card.setPosition(position);
        card.getComponent(UITransform)?.setContentSize(660, 278);

        const graphics = card.addComponent(Graphics);
        graphics.fillColor = unlocked
            ? new Color(255, 247, 252, 248)
            : new Color(236, 229, 240, 238);
        graphics.strokeColor = unlocked ? rival.accent : new Color(174, 158, 186, 255);
        graphics.lineWidth = 5;
        graphics.roundRect(-330, -139, 660, 278, 38);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(rival.accent.r, rival.accent.g, rival.accent.b, 46);
        graphics.roundRect(-318, -127, 636, 254, 31);
        graphics.fill();

        this.drawRivalAvatar(card, rival, new Vec3(220, 7), 166, 208);

        this.addLabel(
            card,
            'RivalName',
            unlocked ? rival.name : '？？？',
            31,
            new Color(96, 61, 104, 255),
            new Vec3(-125, 79),
            300,
            48,
            true,
        );
        this.addLabel(
            card,
            'RivalTitle',
            unlocked ? rival.title : '击败苏蔓后解锁',
            17,
            new Color(145, 102, 143, 240),
            new Vec3(-125, 42),
            330,
            32,
            true,
        );
        this.addLabel(
            card,
            'RivalTheme',
            unlocked ? rival.theme : '未知主题',
            20,
            rival.accent,
            new Vec3(-125, 7),
            310,
            34,
            true,
        );
        this.addLabel(
            card,
            'RivalQuote',
            unlocked ? `“${rival.quote}”` : '传闻她只在星屑剧场的地下舞台出现。',
            16,
            new Color(111, 79, 111, 230),
            new Vec3(-132, -43),
            430,
            56,
            true,
        );

        const badgeText = !unlocked
            ? '尚未解锁'
            : defeated
                ? `已击败 · 重复奖励 ${rival.repeatReward}`
                : `首胜奖励 ${rival.firstReward}`;
        this.addLabel(
            card,
            'RivalReward',
            badgeText,
            16,
            unlocked ? new Color(123, 78, 117, 255) : new Color(139, 128, 150, 255),
            new Vec3(-132, -91),
            330,
            30,
            true,
        );

        this.makeInteractive(card, () => {
            if (!unlocked) {
                this.showToast('先击败苏蔓，才能挑战纪岚');
                return;
            }
            this.startChallenge(rival);
        });
    }

    private startChallenge(rival: RivalDefinition): void {
        if (!this.isRivalUnlocked(rival)) {
            this.showToast('该对手尚未解锁');
            return;
        }
        this.currentRival = rival;
        this.currentRound = 1;
        this.playerRoundScores = [-1, -1, -1];
        this.renderRoundIntro();
    }

    private renderRoundIntro(): void {
        if (!this.currentRival) {
            this.renderRivalSelection();
            return;
        }
        this.clearContent();
        this.renderDuelHeader();

        if (this.currentRound === 1) {
            this.renderOutfitRound();
        } else if (this.currentRound === 2) {
            this.renderClueRound();
        } else {
            this.renderPartnerRound();
        }
    }

    private renderDuelHeader(): void {
        const rival = this.currentRival!;
        const roundNames = ['穿搭主题', '线索问答', '搭档助战'];
        this.addLabel(
            this.content,
            'RoundTitle',
            `第 ${this.currentRound} 轮 · ${roundNames[this.currentRound - 1]}`,
            29,
            new Color(255, 248, 252, 255),
            new Vec3(0, 447),
            540,
            50,
            true,
        );

        this.createPlayerPortrait(new Vec3(-205, 330));
        this.drawRivalAvatar(this.content, rival, new Vec3(205, 327), 126, 176);
        this.addLabel(
            this.content,
            'PlayerPortraitName',
            '你',
            19,
            new Color(255, 245, 251, 255),
            new Vec3(-205, 220),
            160,
            30,
            true,
        );
        this.addLabel(
            this.content,
            'RivalPortraitName',
            rival.name,
            19,
            new Color(255, 245, 251, 255),
            new Vec3(205, 220),
            160,
            30,
            true,
        );

        const versus = this.createNode('VersusBadge', this.content);
        versus.setPosition(0, 321);
        versus.getComponent(UITransform)?.setContentSize(86, 86);
        const versusGraphics = versus.addComponent(Graphics);
        versusGraphics.fillColor = new Color(255, 247, 252, 238);
        versusGraphics.strokeColor = rival.accent;
        versusGraphics.lineWidth = 4;
        versusGraphics.circle(0, 0, 39);
        versusGraphics.fill();
        versusGraphics.stroke();
        this.addLabel(
            versus,
            'VersusLabel',
            'VS',
            24,
            rival.accent,
            Vec3.ZERO,
            70,
            58,
            true,
        );

        for (let index = 0; index < 3; index += 1) {
            const x = -190 + index * 190;
            this.createScorePill(index, x);
        }
    }

    private createScorePill(roundIndex: number, x: number): void {
        const rival = this.currentRival!;
        const names = ['穿搭', '线索', '搭档'];
        const pill = this.createNode(`ScorePill_${roundIndex}`, this.content);
        pill.setPosition(x, 170);
        pill.getComponent(UITransform)?.setContentSize(172, 68);
        const graphics = pill.addComponent(Graphics);
        const active = roundIndex === this.currentRound - 1;
        graphics.fillColor = active
            ? new Color(255, 247, 252, 248)
            : new Color(255, 244, 250, 200);
        graphics.strokeColor = active ? rival.accent : new Color(255, 255, 255, 140);
        graphics.lineWidth = active ? 4 : 2;
        graphics.roundRect(-86, -34, 172, 68, 25);
        graphics.fill();
        graphics.stroke();

        const playerScore = this.playerRoundScores[roundIndex];
        this.addLabel(
            pill,
            'ScoreLabel',
            `${names[roundIndex]}  ${playerScore >= 0 ? playerScore : '—'} : ${rival.roundScores[roundIndex]}`,
            18,
            new Color(100, 66, 107, 255),
            Vec3.ZERO,
            154,
            52,
            true,
        );
    }

    private renderOutfitRound(): void {
        const rival = this.currentRival!;
        const outfit = getOutfit(this.progress.equippedOutfit);
        const matches = rival.themeTags.filter((tag) => outfit.tags.indexOf(tag) >= 0);
        const effective = getEffectiveStats(this.progress);

        const panel = this.createPanel(new Vec3(0, -38), 660, 330);
        this.addLabel(
            panel,
            'RoundOneHeading',
            `本轮主题要求：${rival.theme}`,
            22,
            rival.accent,
            new Vec3(0, 116),
            570,
            40,
            true,
        );
        this.addLabel(
            panel,
            'OutfitName',
            `当前服装 · ${outfit.name}`,
            29,
            new Color(92, 57, 99, 255),
            new Vec3(0, 65),
            500,
            48,
            true,
        );
        this.addLabel(
            panel,
            'OutfitTags',
            `标签：${outfit.tags.join(' / ')}`,
            20,
            new Color(125, 85, 126, 250),
            new Vec3(0, 24),
            520,
            34,
            true,
        );
        this.addLabel(
            panel,
            'OutfitFormula',
            `主题命中 ${matches.length} 项  +  美貌 ${effective.beauty} × 12\n基础分 80  +  主题 ${matches.length} × 35`,
            19,
            new Color(112, 75, 116, 245),
            new Vec3(0, -35),
            540,
            72,
            true,
        );
        this.addLabel(
            panel,
            'OutfitDescription',
            outfit.description,
            17,
            new Color(144, 104, 146, 235),
            new Vec3(0, -105),
            570,
            60,
            true,
        );

        this.createButton(
            this.content,
            'SubmitOutfit',
            '提交穿搭',
            new Vec3(0, -298),
            330,
            70,
            rival.accent,
            () => this.submitOutfitRound(),
        );
    }

    private submitOutfitRound(): void {
        if (!this.currentRival || this.playerRoundScores[0] >= 0) {
            return;
        }
        const rival = this.currentRival;
        const outfit = getOutfit(this.progress.equippedOutfit);
        const effective = getEffectiveStats(this.progress);
        const matches = rival.themeTags.filter((tag) => outfit.tags.indexOf(tag) >= 0);
        const score = 80 + matches.length * 35 + effective.beauty * 12;
        this.playerRoundScores[0] = score;
        const detail = matches.length > 0
            ? `「${outfit.name}」命中 ${matches.join('、')}，美貌为 ${effective.beauty}。`
            : `这套服装没有命中 ${rival.theme}，只靠美貌获得基础表现分。`;
        this.renderRoundResult(
            0,
            score,
            rival.roundScores[0],
            detail,
            '主题匹配比单纯堆属性更重要，之后的挑战可以换装再试。',
        );
    }

    private renderClueRound(): void {
        const rival = this.currentRival!;
        const panel = this.createPanel(new Vec3(0, -58), 660, 330);
        this.addLabel(
            panel,
            'QuestionText',
            rival.question.prompt,
            23,
            new Color(91, 58, 99, 255),
            new Vec3(0, 85),
            580,
            100,
            true,
        );
        rival.question.choices.forEach((choice, index) => {
            this.createChoiceButton(
                panel,
                index,
                `${String.fromCharCode(65 + index)}.  ${choice}`,
                new Vec3(0, 15 - index * 66),
                () => this.submitClueAnswer(index),
            );
        });
    }

    private createChoiceButton(
        parent: Node,
        index: number,
        text: string,
        position: Vec3,
        onTap: () => void,
    ): void {
        const rival = this.currentRival!;
        const button = this.createNode(`ClueChoice_${index}`, parent);
        button.setPosition(position);
        button.getComponent(UITransform)?.setContentSize(540, 58);
        const graphics = button.addComponent(Graphics);
        graphics.fillColor = new Color(255, 251, 254, 240);
        graphics.strokeColor = new Color(rival.accent.r, rival.accent.g, rival.accent.b, 190);
        graphics.lineWidth = 3;
        graphics.roundRect(-270, -29, 540, 58, 25);
        graphics.fill();
        graphics.stroke();
        this.addLabel(
            button,
            'ChoiceLabel',
            text,
            18,
            new Color(99, 65, 104, 255),
            Vec3.ZERO,
            500,
            48,
            true,
        );
        this.makeInteractive(button, onTap);
    }

    private submitClueAnswer(choiceIndex: number): void {
        if (!this.currentRival || this.playerRoundScores[1] >= 0) {
            return;
        }
        const rival = this.currentRival;
        const effective = getEffectiveStats(this.progress);
        const correct = choiceIndex === rival.question.correctIndex;
        const clueBonus = Math.min(3, this.progress.clues.length) * 10;
        const score = correct
            ? 60 + effective.wisdom * 15 + effective.insight * 10 + clueBonus
            : 40 + effective.insight * 8;
        this.playerRoundScores[1] = score;
        const detail = correct
            ? `回答正确。才智 ${effective.wisdom}、洞察 ${effective.insight}，并叠加了 ${Math.min(3, this.progress.clues.length)} 条线索加成。`
            : '回答错误。本轮只按洞察力保底，收集更多线索能让下一局容错更高。';
        this.renderRoundResult(
            1,
            score,
            rival.roundScores[1],
            detail,
            rival.question.explanation,
        );
    }

    private renderPartnerRound(): void {
        const rival = this.currentRival!;
        const partner = getPartnerSupport(this.progress.activePartner);
        const effective = getEffectiveStats(this.progress);
        const panel = this.createPanel(new Vec3(0, -50), 660, 330);

        this.addLabel(
            panel,
            'PartnerRoundHeading',
            '选择一名已解锁男性搭档，让他替你稳住场面',
            21,
            rival.accent,
            new Vec3(0, 126),
            560,
            42,
            true,
        );

        if (partner) {
            this.createPartnerPortrait(partner, panel, new Vec3(200, 22), 138, 174);
            this.addLabel(
                panel,
                'PartnerName',
                `${partner.name} · ${partner.role}`,
                25,
                new Color(94, 59, 101, 255),
                new Vec3(-100, 72),
                350,
                42,
                true,
            );
            this.addLabel(
                panel,
                'PartnerSupport',
                `${statLabel(partner.stat)} ${effective[partner.stat]} × 18\n兼职联动 +${this.getBestPartnerBonus(partner)}`,
                20,
                new Color(121, 82, 122, 250),
                new Vec3(-100, 9),
                350,
                78,
                true,
            );
            this.addLabel(
                panel,
                'PartnerFlavor',
                '搭档的总分由有效属性与最强兼职联动共同决定。',
                16,
                new Color(147, 108, 149, 235),
                new Vec3(-100, -73),
                350,
                46,
                true,
            );
            this.createButton(
                this.content,
                'CyclePartner',
                '切换搭档',
                new Vec3(-142, -298),
                210,
                58,
                new Color(194, 164, 220, 255),
                () => this.cyclePartner(),
            );
            this.createButton(
                this.content,
                'SubmitPartner',
                '邀请搭档登场',
                new Vec3(142, -298),
                300,
                66,
                rival.accent,
                () => this.submitPartnerRound(),
            );
        } else {
            this.addLabel(
                panel,
                'NoPartner',
                '尚未解锁可用男性搭档。\n本轮可以单人应战，但只能获得基础分。',
                22,
                new Color(115, 83, 117, 245),
                Vec3.ZERO,
                520,
                150,
                true,
            );
            this.createButton(
                this.content,
                'SubmitSolo',
                '单人应战',
                new Vec3(0, -298),
                310,
                68,
                rival.accent,
                () => this.submitPartnerRound(),
            );
        }
    }

    private cyclePartner(): void {
        const available = PARTNERS.filter(
            (partner) => this.progress.unlockedCharacters.indexOf(partner.id) >= 0,
        );
        if (available.length <= 1) {
            this.showToast('暂无其他可切换的搭档');
            return;
        }
        const currentIndex = available.findIndex(
            (partner) => partner.id === this.progress.activePartner,
        );
        const nextPartner = available[(currentIndex + 1) % available.length];
        this.progress = {
            ...this.progress,
            activePartner: nextPartner.id,
        };
        saveProgress(this.progress);
        this.renderRoundIntro();
        this.showToast(`已换上搭档：${nextPartner.name}`);
    }

    private submitPartnerRound(): void {
        if (!this.currentRival || this.playerRoundScores[2] >= 0) {
            return;
        }
        const rival = this.currentRival;
        const partner = getPartnerSupport(this.progress.activePartner);
        const effective = getEffectiveStats(this.progress);
        const score = partner
            ? 40 + effective[partner.stat] * 18 + this.getBestPartnerBonus(partner)
            : 40;
        this.playerRoundScores[2] = score;
        const detail = partner
            ? `${partner.name}以「${partner.role}」入场，${statLabel(partner.stat)}与兼职联动带来了 ${score - 40} 点支援分。`
            : '本轮没有搭档支援，只获得 40 点基础分。';
        this.renderRoundResult(
            2,
            score,
            rival.roundScores[2],
            detail,
            '羁绊与兼职经验会转化成挑战支援，搭档不是纯收藏卡。',
        );
    }

    private renderRoundResult(
        roundIndex: number,
        playerScore: number,
        rivalScore: number,
        detail: string,
        explanation: string,
    ): void {
        this.clearContent();
        this.renderDuelHeader();
        const rival = this.currentRival!;
        const roundWon = playerScore >= rivalScore;
        const panel = this.createPanel(new Vec3(0, -35), 660, 360);
        const heading = this.addLabel(
            panel,
            'RoundResultHeading',
            roundWon ? '这一轮拿下' : '这一轮落后',
            31,
            roundWon ? new Color(209, 103, 151, 255) : new Color(102, 114, 158, 255),
            new Vec3(0, 123),
            460,
            52,
            true,
        );
        heading.spacingX = 2;
        this.addLabel(
            panel,
            'RoundScore',
            `${playerScore}  :  ${rivalScore}`,
            38,
            new Color(100, 65, 106, 255),
            new Vec3(0, 69),
            360,
            58,
            true,
        );
        this.addLabel(
            panel,
            'RoundDetail',
            detail,
            19,
            new Color(112, 75, 116, 245),
            new Vec3(0, 5),
            570,
            88,
            true,
        );
        this.addLabel(
            panel,
            'RoundExplanation',
            explanation,
            17,
            new Color(149, 107, 150, 235),
            new Vec3(0, -91),
            570,
            54,
            true,
        );

        const nextText = this.currentRound < 3 ? '进入下一轮' : '查看总比分';
        this.createButton(
            this.content,
            'ContinueChallenge',
            nextText,
            new Vec3(0, -298),
            340,
            70,
            rival.accent,
            () => {
                if (this.currentRound < 3) {
                    this.currentRound = (this.currentRound + 1) as ChallengeRound;
                    this.renderRoundIntro();
                } else {
                    this.finishChallenge();
                }
            },
        );
    }

    private finishChallenge(): void {
        if (!this.currentRival) {
            return;
        }
        const rival = this.currentRival;
        const playerTotal = this.playerRoundScores.reduce((sum, score) => sum + score, 0);
        const rivalTotal = rival.roundScores.reduce((sum, score) => sum + score, 0);
        const won = playerTotal >= rivalTotal;
        const defeatedBefore = this.progress.defeatedRivals.indexOf(rival.id) >= 0;
        const firstWin = won && !defeatedBefore;
        const reward = won ? (firstWin ? rival.firstReward : rival.repeatReward) : 0;

        if (won) {
            this.progress = {
                ...this.progress,
                coins: this.progress.coins + reward,
                challengeWins: this.progress.challengeWins + 1,
                defeatedRivals: defeatedBefore
                    ? [...this.progress.defeatedRivals]
                    : [...this.progress.defeatedRivals, rival.id],
            };
            saveProgress(this.progress);
            this.coinLabel.string = `金币 ${this.progress.coins}`;
            gameFeel.play('success');
        }

        const unlockedNext = won
            && rival.id === 'su-man'
            && this.progress.defeatedRivals.indexOf('ji-lan') < 0;
        this.renderFinal({
            won,
            firstWin,
            reward,
            playerTotal,
            rivalTotal,
            unlockedNext,
        });
    }

    private renderFinal(outcome: ChallengeOutcome): void {
        this.clearContent();
        const rival = this.currentRival!;
        const panel = this.createPanel(new Vec3(0, -5), 680, 830);

        const banner = this.createNode('FinalBanner', panel);
        banner.setPosition(0, 310);
        banner.getComponent(UITransform)?.setContentSize(590, 138);
        const bannerGraphics = banner.addComponent(Graphics);
        bannerGraphics.fillColor = outcome.won
            ? new Color(244, 163, 196, 255)
            : new Color(142, 139, 187, 255);
        bannerGraphics.strokeColor = new Color(255, 255, 255, 230);
        bannerGraphics.lineWidth = 4;
        bannerGraphics.roundRect(-295, -69, 590, 138, 40);
        bannerGraphics.fill();
        bannerGraphics.stroke();
        this.addLabel(
            banner,
            'FinalTitle',
            outcome.won ? '挑战胜利' : '挑战失败',
            40,
            Color.WHITE,
            new Vec3(0, 22),
            420,
            58,
            true,
        );
        this.addLabel(
            banner,
            'FinalSubtitle',
            outcome.won ? `你击败了 ${rival.name}` : `这次以 ${outcome.playerTotal} : ${outcome.rivalTotal} 惜败`,
            19,
            new Color(255, 249, 253, 245),
            new Vec3(0, -28),
            500,
            34,
            true,
        );

        this.addLabel(
            panel,
            'FinalScore',
            `${outcome.playerTotal}  :  ${outcome.rivalTotal}`,
            42,
            new Color(94, 60, 101, 255),
            new Vec3(0, 184),
            420,
            62,
            true,
        );
        this.addLabel(
            panel,
            'FinalScoreCaption',
            '三局总分',
            17,
            new Color(150, 109, 151, 240),
            new Vec3(0, 142),
            250,
            30,
            true,
        );

        for (let index = 0; index < 3; index += 1) {
            const x = -195 + index * 195;
            const roundPanel = this.createNode(`FinalRound_${index}`, panel);
            roundPanel.setPosition(x, 84);
            roundPanel.getComponent(UITransform)?.setContentSize(174, 82);
            const graphics = roundPanel.addComponent(Graphics);
            graphics.fillColor = new Color(255, 241, 248, 238);
            graphics.strokeColor = rival.accent;
            graphics.lineWidth = 2;
            graphics.roundRect(-87, -41, 174, 82, 22);
            graphics.fill();
            graphics.stroke();
            this.addLabel(
                roundPanel,
                'FinalRoundScore',
                `${['穿搭', '线索', '搭档'][index]}\n${this.playerRoundScores[index]} : ${rival.roundScores[index]}`,
                17,
                new Color(104, 70, 109, 255),
                Vec3.ZERO,
                154,
                62,
                true,
            );
        }

        const rewardText = outcome.won
            ? `金币 +${outcome.reward}${outcome.firstWin ? '（首胜奖励）' : '（重复挑战奖励）'}`
            : '本局没有获得金币，调整穿搭或搭档后再来挑战。';
        this.addLabel(
            panel,
            'FinalReward',
            rewardText,
            22,
            outcome.won ? new Color(151, 97, 55, 255) : new Color(110, 79, 112, 245),
            new Vec3(0, 0),
            580,
            48,
            true,
        );

        const progressText = outcome.won
            ? `累计胜场 ${this.progress.challengeWins} · 金币 ${this.progress.coins}`
            : `累计胜场 ${this.progress.challengeWins}`;
        this.addLabel(
            panel,
            'FinalProgress',
            progressText,
            18,
            new Color(138, 98, 140, 235),
            new Vec3(0, -45),
            480,
            34,
            true,
        );

        if (outcome.unlockedNext) {
            const unlockPanel = this.createNode('RivalUnlocked', panel);
            unlockPanel.setPosition(0, -120);
            unlockPanel.getComponent(UITransform)?.setContentSize(560, 70);
            const unlockGraphics = unlockPanel.addComponent(Graphics);
            unlockGraphics.fillColor = new Color(226, 233, 255, 235);
            unlockGraphics.strokeColor = new Color(126, 154, 224, 235);
            unlockGraphics.lineWidth = 3;
            unlockGraphics.roundRect(-280, -35, 560, 70, 28);
            unlockGraphics.fill();
            unlockGraphics.stroke();
            this.addLabel(
                unlockPanel,
                'RivalUnlockedLabel',
                '新对手解锁：纪岚 · 冷艳 × 街头',
                21,
                new Color(91, 101, 158, 255),
                Vec3.ZERO,
                520,
                54,
                true,
            );
        }

        this.createButton(
            panel,
            'ReplayRival',
            '再次挑战',
            new Vec3(-155, -286),
            250,
            64,
            rival.accent,
            () => this.startChallenge(rival),
        );
        this.createButton(
            panel,
            'ChooseAnotherRival',
            '选择其他对手',
            new Vec3(155, -286),
            260,
            64,
            new Color(185, 165, 217, 255),
            () => this.renderRivalSelection(),
        );
        this.createButton(
            this.content,
            'FinalBackToCity',
            '返回樱花街区',
            new Vec3(0, -383),
            320,
            60,
            new Color(150, 121, 183, 255),
            () => director.loadScene('CityExplore'),
        );
    }

    private createPlayerPortrait(position: Vec3): void {
        const frame = this.createNode('PlayerPortrait', this.content);
        frame.setPosition(position);
        frame.getComponent(UITransform)?.setContentSize(150, 190);
        const graphics = frame.addComponent(Graphics);
        graphics.fillColor = new Color(255, 238, 247, 92);
        graphics.strokeColor = new Color(255, 247, 252, 180);
        graphics.lineWidth = 3;
        graphics.roundRect(-75, -95, 150, 190, 42);
        graphics.fill();
        graphics.stroke();

        const spriteNode = this.createNode('PlayerSprite', frame);
        spriteNode.getComponent(UITransform)?.setContentSize(91, 230);
        const sprite = spriteNode.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        resources.load('scene/layers/pink-girl-hd/spriteFrame', SpriteFrame, (error, image) => {
            if (error || !image) {
                gameFeel.showMissingImage(spriteNode, '主角');
                return;
            }
            if (sprite.isValid) {
                sprite.spriteFrame = image;
            }
        });

        const outfit = getOutfit(this.progress.equippedOutfit);
        const accent = this.createNode('EquippedOutfitMark', frame);
        accent.setPosition(0, -88);
        accent.getComponent(UITransform)?.setContentSize(132, 24);
        const accentGraphics = accent.addComponent(Graphics);
        accentGraphics.fillColor = outfit.accent;
        accentGraphics.roundRect(-66, -12, 132, 24, 12);
        accentGraphics.fill();
    }

    private createPartnerPortrait(
        partner: PartnerSupport,
        parent: Node,
        position: Vec3,
        width: number,
        height: number,
    ): void {
        const frame = this.createNode('PartnerPortrait', parent);
        frame.setPosition(position);
        frame.getComponent(UITransform)?.setContentSize(width, height);
        const graphics = frame.addComponent(Graphics);
        graphics.fillColor = new Color(255, 242, 249, 225);
        graphics.strokeColor = partner.accent;
        graphics.lineWidth = 3;
        graphics.roundRect(-width / 2, -height / 2, width, height, 26);
        graphics.fill();
        graphics.stroke();

        const image = this.createNode('PartnerImage', frame);
        image.getComponent(UITransform)?.setContentSize(width - 14, height - 14);
        const sprite = image.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        const path = this.getPartnerResourcePath(partner.id);
        resources.load(path, SpriteFrame, (error, imageFrame) => {
            if (error || !imageFrame) {
                gameFeel.showMissingImage(frame, '搭档');
                return;
            }
            if (sprite.isValid) {
                sprite.spriteFrame = imageFrame;
            }
        });
    }

    private getPartnerResourcePath(partnerId: string): string {
        return getPartnerPortraitPath(partnerId);
    }

    private drawRivalAvatar(
        parent: Node,
        rival: RivalDefinition,
        position: Vec3,
        width: number,
        height: number,
    ): void {
        const avatar = this.createNode(`RivalAvatar_${rival.id}`, parent);
        avatar.setPosition(position);
        avatar.getComponent(UITransform)?.setContentSize(width, height);
        const graphics = avatar.addComponent(Graphics);
        const scale = Math.min(width / 166, height / 208);
        const left = -width / 2;
        const bottom = -height / 2;

        graphics.fillColor = new Color(rival.accent.r, rival.accent.g, rival.accent.b, 55);
        graphics.circle(0, 12 * scale, 82 * scale);
        graphics.fill();
        graphics.fillColor = new Color(255, 246, 250, 245);
        graphics.strokeColor = new Color(255, 255, 255, 210);
        graphics.lineWidth = 2;
        graphics.roundRect(left + 8, bottom + 5, width - 16, height - 10, 34);
        graphics.fill();
        graphics.stroke();

        graphics.fillColor = rival.hair;
        graphics.circle(0, 22 * scale, 62 * scale);
        graphics.fill();
        graphics.fillColor = new Color(255, 222, 222, 255);
        graphics.ellipse(0, 18 * scale, 42 * scale, 50 * scale);
        graphics.fill();

        graphics.fillColor = rival.hair;
        graphics.moveTo(-61 * scale, 48 * scale);
        graphics.lineTo(-42 * scale, 82 * scale);
        graphics.lineTo(-12 * scale, 53 * scale);
        graphics.lineTo(25 * scale, 78 * scale);
        graphics.lineTo(59 * scale, 34 * scale);
        graphics.lineTo(43 * scale, 18 * scale);
        graphics.lineTo(-46 * scale, 17 * scale);
        graphics.close();
        graphics.fill();

        graphics.fillColor = new Color(87, 54, 75, 255);
        graphics.circle(-16 * scale, 23 * scale, 3.5 * scale);
        graphics.circle(16 * scale, 23 * scale, 3.5 * scale);
        graphics.fill();
        graphics.strokeColor = new Color(188, 97, 121, 255);
        graphics.lineWidth = 2;
        graphics.moveTo(-8 * scale, 2 * scale);
        graphics.quadraticCurveTo(0, -4 * scale, 8 * scale, 2 * scale);
        graphics.stroke();

        graphics.fillColor = rival.accent;
        graphics.moveTo(-74 * scale, -84 * scale);
        graphics.lineTo(-42 * scale, -24 * scale);
        graphics.lineTo(0, -3 * scale);
        graphics.lineTo(42 * scale, -24 * scale);
        graphics.lineTo(74 * scale, -84 * scale);
        graphics.close();
        graphics.fill();
        graphics.fillColor = new Color(255, 241, 248, 220);
        graphics.roundRect(-12 * scale, -70 * scale, 24 * scale, 48 * scale, 10 * scale);
        graphics.fill();

        if (rival.id === 'ji-lan') {
            graphics.strokeColor = new Color(189, 207, 248, 255);
            graphics.lineWidth = 3;
            graphics.circle(49 * scale, -39 * scale, 16 * scale);
            graphics.stroke();
        } else {
            graphics.fillColor = new Color(255, 188, 214, 255);
            graphics.circle(-52 * scale, 42 * scale, 10 * scale);
            graphics.fill();
        }
    }

    private createPanel(position: Vec3, width: number, height: number): Node {
        const rival = this.currentRival;
        const accent = rival?.accent ?? new Color(221, 159, 218, 255);
        const panel = this.createNode('ChallengePanel', this.content);
        panel.setPosition(position);
        panel.getComponent(UITransform)?.setContentSize(width, height);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(255, 248, 252, 247);
        graphics.strokeColor = accent;
        graphics.lineWidth = 4;
        graphics.roundRect(-width / 2, -height / 2, width, height, 34);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(accent.r, accent.g, accent.b, 28);
        graphics.roundRect(-width / 2 + 12, -height / 2 + 12, width - 24, height - 24, 27);
        graphics.fill();
        return panel;
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
        graphics.fillColor = new Color(255, 249, 253, 245);
        graphics.strokeColor = accent;
        graphics.lineWidth = 4;
        graphics.roundRect(-width / 2, -height / 2, width, height, height / 2);
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(accent.r, accent.g, accent.b, 48);
        graphics.roundRect(
            -width / 2 + 7,
            -height / 2 + 7,
            width - 14,
            height - 14,
            (height - 14) / 2,
        );
        graphics.fill();
        this.addLabel(
            button,
            'ButtonLabel',
            text,
            21,
            new Color(102, 67, 108, 255),
            Vec3.ZERO,
            width - 28,
            height - 18,
            true,
        );
        this.makeInteractive(button, onTap);
        return button;
    }

    private showToast(text: string): void {
        if (this.toastNode?.isValid) {
            this.toastNode.destroy();
        }
        const toast = this.createNode('ChallengeToast', this.feedbackLayer);
        toast.setPosition(0, 414);
        toast.getComponent(UITransform)?.setContentSize(470, 60);
        const graphics = toast.addComponent(Graphics);
        graphics.fillColor = new Color(255, 249, 253, 244);
        graphics.strokeColor = new Color(246, 158, 198, 230);
        graphics.lineWidth = 2;
        graphics.roundRect(-235, -30, 470, 60, 30);
        graphics.fill();
        graphics.stroke();
        this.addLabel(
            toast,
            'ToastLabel',
            text,
            19,
            new Color(109, 72, 110, 255),
            Vec3.ZERO,
            430,
            50,
            true,
        );
        const opacity = toast.addComponent(UIOpacity);
        tween(opacity)
            .delay(1.25)
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
            }, 0.28);
        });
    }

    private clearContent(): void {
        this.content.children.slice().forEach((child) => child.destroy());
    }

    private isRivalUnlocked(rival: RivalDefinition): boolean {
        return !rival.unlockAfter
            || this.progress.defeatedRivals.indexOf(rival.unlockAfter) >= 0;
    }

    private getBestPartnerBonus(partner: PartnerSupport): number {
        return Object.keys(partner.jobBonuses)
            .reduce((best, key) => Math.max(best, partner.jobBonuses[key]), 0);
    }

    private updateHudProgress(): void {
        if (this.subtitleLabel?.isValid) {
            this.subtitleLabel.string = `穿搭 · 线索 · 搭档   |   已胜 ${this.progress.challengeWins} 场`;
        }
        if (this.coinLabel?.isValid) {
            this.coinLabel.string = `金币 ${this.progress.coins}`;
        }
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
