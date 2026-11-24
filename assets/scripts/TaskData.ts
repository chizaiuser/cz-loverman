import { Color } from 'cc';
import { PlayerStatKey } from './StoryData';
import {
    ROLE_TASK_REWARDS,
    SKILL_PRICES,
    TASK_REWARDS,
} from './EconomyData';
import { CHARACTER_LORE, CharacterLore } from './CharacterLoreData';
import { getPartnerSupport } from './PartnerData';
import { getPartnerVenueId } from './VenueData';

export type TaskMetric = 'flowers' | 'jobIncome' | 'skills';

export interface TaskDefinition {
    id: string;
    title: string;
    description: string;
    metric: TaskMetric;
    target: number;
    rewardCoins: number;
    rewardGifts: number;
    accent: Color;
}

export interface SkillDefinition {
    id: string;
    name: string;
    description: string;
    price: number;
    stat: PlayerStatKey;
    statBonus: number;
    icon: string;
    accent: Color;
}

export type RoleTaskRequirement =
    | { kind: 'met-character'; characterId: string; label: string }
    | { kind: 'bond'; characterId: string; target: number; label: string }
    | { kind: 'venue-complete'; venueId: string; label: string }
    | { kind: 'learned-skill'; skillId?: string; target: number; label: string }
    | { kind: 'job-income'; target: number; label: string }
    | { kind: 'flowers'; target: number; label: string };

export interface RoleTaskDefinition {
    id: string;
    characterId: string;
    title: string;
    description: string;
    requirements: RoleTaskRequirement[];
    prerequisiteTaskId?: string;
    rewardCoins: number;
    rewardGifts: number;
    rewardBond: number;
    accent: Color;
}

export const TASKS: TaskDefinition[] = [
    {
        id: 'flower-gathering',
        title: '花街采集',
        description: '在粉色街区采集 3 朵掉落的花，熟悉地图和采集玩法。',
        metric: 'flowers',
        target: 3,
        rewardCoins: TASK_REWARDS['flower-gathering'].coins,
        rewardGifts: TASK_REWARDS['flower-gathering'].gifts,
        accent: new Color(246, 143, 185, 255),
    },
    {
        id: 'work-income',
        title: '勤工目标',
        description: '通过咖啡、甜品或舞台兼职累计赚取 60 金币。',
        metric: 'jobIncome',
        target: 60,
        rewardCoins: TASK_REWARDS['work-income'].coins,
        rewardGifts: TASK_REWARDS['work-income'].gifts,
        accent: new Color(244, 181, 115, 255),
    },
    {
        id: 'skill-learning',
        title: '技能研习',
        description: '学习任意一项城市技能，永久提升对应属性。',
        metric: 'skills',
        target: 1,
        rewardCoins: TASK_REWARDS['skill-learning'].coins,
        rewardGifts: TASK_REWARDS['skill-learning'].gifts,
        accent: new Color(167, 147, 232, 255),
    },
];

export const SKILLS: SkillDefinition[] = [
    {
        id: 'florist-basics',
        name: '花艺整理',
        description: '辨认花材与色彩，永久提升洞察力。',
        price: SKILL_PRICES['florist-basics'],
        stat: 'insight',
        statBonus: 1,
        icon: '花',
        accent: new Color(239, 167, 197, 255),
    },
    {
        id: 'latte-art',
        name: '咖啡拉花',
        description: '练习奶泡与构图，永久提升美貌。',
        price: SKILL_PRICES['latte-art'],
        stat: 'beauty',
        statBonus: 1,
        icon: '咖',
        accent: new Color(218, 166, 123, 255),
    },
    {
        id: 'stage-rhythm',
        name: '舞台节奏',
        description: '学习舞台呼吸与节拍，永久提升情商。',
        price: SKILL_PRICES['stage-rhythm'],
        stat: 'emotion',
        statBonus: 1,
        icon: '演',
        accent: new Color(166, 157, 229, 255),
    },
];

const SPECIAL_ROLE_TASKS: RoleTaskDefinition[] = [
    {
        id: 'shen-window-letter',
        characterId: 'shen-xinglan',
        title: '窗边留下的花笺',
        description: '帮助沈星澜整理咖啡馆，找出他想留在窗边的真正原因。',
        requirements: [
            { kind: 'met-character', characterId: 'shen-xinglan', label: '在咖啡馆遇见沈星澜' },
            { kind: 'venue-complete', venueId: 'cafe', label: '完成咖啡馆探索' },
            { kind: 'bond', characterId: 'shen-xinglan', target: 3, label: '好感达到 3' },
        ],
        rewardCoins: ROLE_TASK_REWARDS['shen-window-letter'].coins,
        rewardGifts: ROLE_TASK_REWARDS['shen-window-letter'].gifts,
        rewardBond: ROLE_TASK_REWARDS['shen-window-letter'].bond,
        accent: new Color(244, 153, 192, 255),
    },
    {
        id: 'jiang-old-book',
        characterId: 'jiang-yanbai',
        title: '旧书页里的第一封信',
        description: '替江砚白整理月光书室，找出夹在旧书里的借阅卡。',
        requirements: [
            { kind: 'met-character', characterId: 'jiang-yanbai', label: '在书室遇见江砚白' },
            { kind: 'venue-complete', venueId: 'books', label: '完成月光书室探索' },
            { kind: 'learned-skill', target: 1, label: '学习任意一项技能' },
        ],
        rewardCoins: ROLE_TASK_REWARDS['jiang-old-book'].coins,
        rewardGifts: ROLE_TASK_REWARDS['jiang-old-book'].gifts,
        rewardBond: ROLE_TASK_REWARDS['jiang-old-book'].bond,
        accent: new Color(177, 158, 226, 255),
    },
    {
        id: 'jiang-next-chapter',
        characterId: 'jiang-yanbai',
        title: '尚未写完的下一章',
        description: '完成第一封信后，江砚白愿意把书页背后的故事继续讲给你听。',
        requirements: [
            { kind: 'bond', characterId: 'jiang-yanbai', target: 4, label: '江砚白好感达到 4' },
            { kind: 'job-income', target: 80, label: '兼职累计收入 80' },
        ],
        prerequisiteTaskId: 'jiang-old-book',
        rewardCoins: ROLE_TASK_REWARDS['jiang-next-chapter'].coins,
        rewardGifts: ROLE_TASK_REWARDS['jiang-next-chapter'].gifts,
        rewardBond: ROLE_TASK_REWARDS['jiang-next-chapter'].bond,
        accent: new Color(148, 128, 212, 255),
    },
    {
        id: 'chu-yao-untitled-song',
        characterId: 'chu-yao',
        title: '没有名字的钢琴曲',
        description: '在星屑剧场完成一场彩排，为楚曜的匿名钢琴曲找到名字。',
        requirements: [
            { kind: 'met-character', characterId: 'chu-yao', label: '在剧场遇见楚曜' },
            { kind: 'venue-complete', venueId: 'stage', label: '完成星屑剧场探索' },
            {
                kind: 'learned-skill',
                skillId: 'stage-rhythm',
                target: 1,
                label: '学会舞台节奏',
            },
        ],
        rewardCoins: ROLE_TASK_REWARDS['chu-yao-untitled-song'].coins,
        rewardGifts: ROLE_TASK_REWARDS['chu-yao-untitled-song'].gifts,
        rewardBond: ROLE_TASK_REWARDS['chu-yao-untitled-song'].bond,
        accent: new Color(193, 166, 226, 255),
    },
    {
        id: 'cheng-yanli-childhood-cake',
        characterId: 'cheng-yanli',
        title: '记忆里的那块蛋糕',
        description: '通过甜心商店的兼职收入，帮助程砚礼复刻童年甜品。',
        requirements: [
            { kind: 'met-character', characterId: 'cheng-yanli', label: '在甜心商店遇见程砚礼' },
            { kind: 'venue-complete', venueId: 'sweet', label: '完成甜心商店探索' },
            { kind: 'job-income', target: 120, label: '兼职累计收入 120' },
        ],
        rewardCoins: ROLE_TASK_REWARDS['cheng-yanli-childhood-cake'].coins,
        rewardGifts: ROLE_TASK_REWARDS['cheng-yanli-childhood-cake'].gifts,
        rewardBond: ROLE_TASK_REWARDS['cheng-yanli-childhood-cake'].bond,
        accent: new Color(235, 162, 114, 255),
    },
];

function createLoreRoleTask(lore: CharacterLore): RoleTaskDefinition {
    const partner = getPartnerSupport(lore.id);
    const venueId = getPartnerVenueId(lore.id);
    const extraRequirement: RoleTaskRequirement = lore.taskExtra === 'skill'
        ? {
            kind: 'learned-skill',
            target: lore.taskExtraTarget,
            label: '学习任意技能',
        }
        : lore.taskExtra === 'job-income'
            ? {
                kind: 'job-income',
                target: lore.taskExtraTarget,
                label: `兼职收入 ${lore.taskExtraTarget}`,
            }
            : lore.taskExtra === 'flowers'
                ? {
                    kind: 'flowers',
                    target: lore.taskExtraTarget,
                    label: `采集花朵 ${lore.taskExtraTarget}`,
                }
                : {
                    kind: 'bond',
                    characterId: lore.id,
                    target: lore.taskExtraTarget,
                    label: `好感达到 ${lore.taskExtraTarget}`,
                };
    return {
        id: `role-${lore.id}`,
        characterId: lore.id,
        title: lore.taskTitle,
        description: lore.taskDescription,
        requirements: [
            {
                kind: 'met-character',
                characterId: lore.id,
                label: `遇见${partner?.name ?? '角色'}`,
            },
            {
                kind: 'venue-complete',
                venueId,
                label: '完成工作场所探索',
            },
            extraRequirement,
        ],
        rewardCoins: lore.rewardCoins,
        rewardGifts: 1,
        rewardBond: 1,
        accent: partner?.accent ?? new Color(181, 159, 220, 255),
    };
}

const coveredCharacterIds = new Set(SPECIAL_ROLE_TASKS.map((task) => task.characterId));

export const ROLE_TASKS: RoleTaskDefinition[] = [
    ...SPECIAL_ROLE_TASKS,
    ...CHARACTER_LORE
        .filter((lore) => !coveredCharacterIds.has(lore.id))
        .map(createLoreRoleTask),
];

export function getSkill(id: string): SkillDefinition | null {
    return SKILLS.find((skill) => skill.id === id) ?? null;
}
