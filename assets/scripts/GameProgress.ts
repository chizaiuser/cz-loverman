import { sys } from 'cc';
import { ChoiceEffects, PlayerStatKey, StatRequirement } from './StoryData';

const SAVE_KEY = 'loverman.save.v1';
const LEGACY_ZODIAC_KEY = 'loverman.zodiac';
const LEGACY_PERSONALITY_KEY = 'loverman.personality';

export type PlayerStats = Record<PlayerStatKey, number>;

export interface PlayerProgress {
    version: 1;
    zodiac: string;
    personality: string;
    stats: PlayerStats;
    clues: string[];
    gifts: number;
    hearts: number;
    bonds: Record<string, number>;
    unlockedCharacters: string[];
    completedEvents: string[];
    selectedChoices: Record<string, string>;
}

export interface ChoiceApplication {
    eventId: string;
    characterId: string;
    choiceId: string;
    effects: ChoiceEffects;
}

const BASE_STATS: PlayerStats = {
    wisdom: 4,
    beauty: 3,
    emotion: 4,
    insight: 4,
};

const ZODIAC_BONUS: Record<string, PlayerStatKey> = {
    白羊: 'beauty',
    金牛: 'wisdom',
    双子: 'emotion',
    巨蟹: 'emotion',
    狮子: 'beauty',
    处女: 'insight',
    天秤: 'beauty',
    天蝎: 'insight',
    射手: 'emotion',
    摩羯: 'wisdom',
    水瓶: 'insight',
    双鱼: 'emotion',
};

const PERSONALITY_BONUS: Record<string, PlayerStatKey> = {
    温柔治愈: 'emotion',
    清冷傲娇: 'insight',
    活泼直球: 'beauty',
    神秘内敛: 'wisdom',
};

export function createDefaultProgress(): PlayerProgress {
    return {
        version: 1,
        zodiac: '',
        personality: '',
        stats: { ...BASE_STATS },
        clues: [],
        gifts: 1,
        hearts: 3,
        bonds: {},
        unlockedCharacters: ['jiang-yanbai', 'xia-yang', 'lu-qinglan'],
        completedEvents: [],
        selectedChoices: {},
    };
}

export function calculateStats(zodiac: string, personality: string): PlayerStats {
    const stats = { ...BASE_STATS };
    const zodiacBonus = ZODIAC_BONUS[zodiac];
    const personalityBonus = PERSONALITY_BONUS[personality];
    if (zodiacBonus) {
        stats[zodiacBonus] = Math.min(5, stats[zodiacBonus] + 1);
    }
    if (personalityBonus) {
        stats[personalityBonus] = Math.min(5, stats[personalityBonus] + 1);
    }
    return stats;
}

export function loadProgress(): PlayerProgress {
    const defaults = createDefaultProgress();
    const raw = sys.localStorage.getItem(SAVE_KEY);
    if (!raw) {
        return {
            ...defaults,
            zodiac: sys.localStorage.getItem(LEGACY_ZODIAC_KEY) ?? '',
            personality: sys.localStorage.getItem(LEGACY_PERSONALITY_KEY) ?? '',
            stats: calculateStats(
                sys.localStorage.getItem(LEGACY_ZODIAC_KEY) ?? '',
                sys.localStorage.getItem(LEGACY_PERSONALITY_KEY) ?? '',
            ),
        };
    }

    try {
        const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
        const stats = parsed.stats ?? defaults.stats;
        return {
            ...defaults,
            ...parsed,
            version: 1,
            stats: {
                wisdom: thisNumber(stats.wisdom, defaults.stats.wisdom),
                beauty: thisNumber(stats.beauty, defaults.stats.beauty),
                emotion: thisNumber(stats.emotion, defaults.stats.emotion),
                insight: thisNumber(stats.insight, defaults.stats.insight),
            },
            clues: thisStringArray(parsed.clues, defaults.clues),
            gifts: thisNumber(parsed.gifts, defaults.gifts),
            hearts: Math.min(6, thisNumber(parsed.hearts, defaults.hearts)),
            bonds: parsed.bonds && typeof parsed.bonds === 'object' ? parsed.bonds : {},
            unlockedCharacters: thisStringArray(
                parsed.unlockedCharacters,
                defaults.unlockedCharacters,
            ),
            completedEvents: thisStringArray(parsed.completedEvents, defaults.completedEvents),
            selectedChoices: parsed.selectedChoices && typeof parsed.selectedChoices === 'object'
                ? parsed.selectedChoices
                : {},
        };
    } catch (error) {
        console.warn('[GameProgress] Invalid save data, using defaults.', error);
        return defaults;
    }
}

export function saveProgress(progress: PlayerProgress): void {
    sys.localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
    sys.localStorage.setItem(LEGACY_ZODIAC_KEY, progress.zodiac);
    sys.localStorage.setItem(LEGACY_PERSONALITY_KEY, progress.personality);
}

export function resetProgress(): PlayerProgress {
    sys.localStorage.removeItem(SAVE_KEY);
    sys.localStorage.removeItem(LEGACY_ZODIAC_KEY);
    sys.localStorage.removeItem(LEGACY_PERSONALITY_KEY);
    return createDefaultProgress();
}

export function applyCustomization(
    progress: PlayerProgress,
    zodiac: string,
    personality: string,
): PlayerProgress {
    return {
        ...cloneProgress(progress),
        zodiac,
        personality,
        stats: calculateStats(zodiac, personality),
    };
}

export function applyChoice(
    progress: PlayerProgress,
    application: ChoiceApplication,
): PlayerProgress {
    const next = cloneProgress(progress);
    const effects = application.effects;
    if (effects.addClue && next.clues.indexOf(effects.addClue) < 0) {
        next.clues.push(effects.addClue);
    }
    next.gifts = Math.max(0, next.gifts + (effects.giftDelta ?? 0));
    next.hearts = Math.max(0, Math.min(6, next.hearts + (effects.heartDelta ?? 0)));
    const currentBond = Number(next.bonds[application.characterId] ?? 2);
    next.bonds[application.characterId] = Math.max(
        0,
        Math.min(6, currentBond + (effects.bondDelta ?? 0)),
    );
    for (const id of effects.unlockCharacters ?? []) {
        if (next.unlockedCharacters.indexOf(id) < 0) {
            next.unlockedCharacters.push(id);
        }
    }
    next.selectedChoices[application.eventId] = application.choiceId;
    if (effects.completeEvent && next.completedEvents.indexOf(application.eventId) < 0) {
        next.completedEvents.push(application.eventId);
    }
    return next;
}

export function meetsRequirement(stats: PlayerStats, requirement?: StatRequirement): boolean {
    if (!requirement) {
        return true;
    }
    return stats[requirement.stat] >= requirement.minimum;
}

export function statLabel(stat: PlayerStatKey): string {
    return {
        wisdom: '才智',
        beauty: '美貌',
        emotion: '情商',
        insight: '洞察力',
    }[stat];
}

export function getBond(progress: PlayerProgress, characterId: string): number {
    return Number(progress.bonds[characterId] ?? 2);
}

function cloneProgress(progress: PlayerProgress): PlayerProgress {
    return {
        ...progress,
        stats: { ...progress.stats },
        clues: [...progress.clues],
        bonds: { ...progress.bonds },
        unlockedCharacters: [...progress.unlockedCharacters],
        completedEvents: [...progress.completedEvents],
        selectedChoices: { ...progress.selectedChoices },
    };
}

function thisNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function thisStringArray(value: unknown, fallback: string[]): string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string')
        ? [...value]
        : [...fallback];
}
