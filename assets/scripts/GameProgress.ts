import { sys } from 'cc';
import { ChoiceEffects, PlayerStatKey, StatRequirement } from './StoryData';
import { DEFAULT_OUTFIT_ID, OUTFITS } from './WardrobeData';
import { getPartnerSupport, PARTNERS } from './PartnerData';
import { SKILLS } from './TaskData';
import { COSMETICS, SURGERIES } from './BeautyData';
import { ECONOMY } from './EconomyData';

const SAVE_KEY = 'loverman.save.v1';
const LEGACY_ZODIAC_KEY = 'loverman.zodiac';
const LEGACY_PERSONALITY_KEY = 'loverman.personality';

export type PlayerStats = Record<PlayerStatKey, number>;

export interface PlayerProgress {
    version: 1;
    playerName: string;
    onboardingComplete: boolean;
    zodiac: string;
    personality: string;
    stats: PlayerStats;
    clues: string[];
    coins: number;
    gifts: number;
    hearts: number;
    bonds: Record<string, number>;
    unlockedCharacters: string[];
    ownedOutfits: string[];
    equippedOutfit: string;
    activePartner: string;
    challengeWins: number;
    defeatedRivals: string[];
    metCharacters: string[];
    venueDiscoveries: string[];
    capturedCharacters: string[];
    gatheredFlowers: string[];
    jobIncomeEarned: number;
    jobRuns: Record<string, number>;
    learnedSkills: string[];
    claimedTaskRewards: string[];
    purchasedCosmetics: string[];
    surgeryLevel: number;
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
        playerName: '',
        onboardingComplete: false,
        zodiac: '',
        personality: '',
        stats: { ...BASE_STATS },
        clues: [],
        coins: ECONOMY.startingCoins,
        gifts: 1,
        hearts: 3,
        bonds: {},
        unlockedCharacters: ['jiang-yanbai', 'xia-yang', 'lu-qinglan'],
        ownedOutfits: [DEFAULT_OUTFIT_ID],
        equippedOutfit: DEFAULT_OUTFIT_ID,
        activePartner: 'jiang-yanbai',
        challengeWins: 0,
        defeatedRivals: [],
        metCharacters: [],
        venueDiscoveries: [],
        capturedCharacters: [],
        gatheredFlowers: [],
        jobIncomeEarned: 0,
        jobRuns: {},
        learnedSkills: [],
        claimedTaskRewards: [],
        purchasedCosmetics: [],
        surgeryLevel: 0,
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
        const hasLegacySetup = Boolean(
            parsed.zodiac
            && parsed.zodiac !== '未选择'
            && parsed.personality
            && parsed.personality !== '未选择',
        );
        const onboardingComplete = typeof parsed.onboardingComplete === 'boolean'
            ? parsed.onboardingComplete
            : hasLegacySetup;
        const jobRuns: Record<string, number> = {};
        if (parsed.jobRuns && typeof parsed.jobRuns === 'object') {
            Object.keys(parsed.jobRuns).forEach((key) => {
                const value = parsed.jobRuns?.[key];
                if (typeof value === 'number' && Number.isFinite(value)) {
                    jobRuns[key] = Math.max(0, value);
                }
            });
        }
        const savedName = typeof parsed.playerName === 'string'
            ? parsed.playerName.trim()
            : '';
        const playerName = savedName || (onboardingComplete ? '旅人' : '');
        const unlockedCharacters = thisStringArray(
            parsed.unlockedCharacters,
            defaults.unlockedCharacters,
        );
        const ownedOutfits = thisStringArray(parsed.ownedOutfits, defaults.ownedOutfits);
        if (ownedOutfits.indexOf(DEFAULT_OUTFIT_ID) < 0) {
            ownedOutfits.unshift(DEFAULT_OUTFIT_ID);
        }
        const equippedOutfit = typeof parsed.equippedOutfit === 'string'
            && ownedOutfits.indexOf(parsed.equippedOutfit) >= 0
            ? parsed.equippedOutfit
            : DEFAULT_OUTFIT_ID;
        const activePartner = typeof parsed.activePartner === 'string'
            && unlockedCharacters.indexOf(parsed.activePartner) >= 0
            && Boolean(getPartnerSupport(parsed.activePartner))
            ? parsed.activePartner
            : PARTNERS.find((partner) => unlockedCharacters.indexOf(partner.id) >= 0)?.id ?? '';
        return {
            ...defaults,
            ...parsed,
            version: 1,
            playerName,
            onboardingComplete,
            stats: {
                wisdom: thisNumber(stats.wisdom, defaults.stats.wisdom),
                beauty: thisNumber(stats.beauty, defaults.stats.beauty),
                emotion: thisNumber(stats.emotion, defaults.stats.emotion),
                insight: thisNumber(stats.insight, defaults.stats.insight),
            },
            clues: thisStringArray(parsed.clues, defaults.clues),
            coins: Math.max(0, thisNumber(parsed.coins, defaults.coins)),
            gifts: thisNumber(parsed.gifts, defaults.gifts),
            hearts: Math.min(6, thisNumber(parsed.hearts, defaults.hearts)),
            bonds: parsed.bonds && typeof parsed.bonds === 'object' ? parsed.bonds : {},
            unlockedCharacters,
            ownedOutfits,
            equippedOutfit,
            activePartner,
            challengeWins: Math.max(0, thisNumber(parsed.challengeWins, defaults.challengeWins)),
            defeatedRivals: thisStringArray(parsed.defeatedRivals, defaults.defeatedRivals),
            metCharacters: thisStringArray(parsed.metCharacters, defaults.metCharacters),
            venueDiscoveries: thisStringArray(
                parsed.venueDiscoveries,
                defaults.venueDiscoveries,
            ),
            capturedCharacters: thisStringArray(
                parsed.capturedCharacters,
                defaults.capturedCharacters,
            ),
            gatheredFlowers: thisStringArray(
                parsed.gatheredFlowers,
                defaults.gatheredFlowers,
            ),
            jobIncomeEarned: Math.max(
                0,
                thisNumber(parsed.jobIncomeEarned, defaults.jobIncomeEarned),
            ),
            jobRuns,
            learnedSkills: thisStringArray(parsed.learnedSkills, defaults.learnedSkills),
            claimedTaskRewards: thisStringArray(
                parsed.claimedTaskRewards,
                defaults.claimedTaskRewards,
            ),
            purchasedCosmetics: thisStringArray(
                parsed.purchasedCosmetics,
                defaults.purchasedCosmetics,
            ),
            surgeryLevel: Math.max(
                0,
                Math.min(
                    SURGERIES.length,
                    thisNumber(parsed.surgeryLevel, defaults.surgeryLevel),
                ),
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
    playerName: string,
    selectedOutfit: string,
): PlayerProgress {
    const next = cloneProgress(progress);
    const equippedOutfit = OUTFITS.some((outfit) => outfit.id === selectedOutfit)
        ? selectedOutfit
        : next.equippedOutfit;
    if (next.ownedOutfits.indexOf(equippedOutfit) < 0) {
        next.ownedOutfits.push(equippedOutfit);
    }
    return {
        ...next,
        playerName: playerName.trim().slice(0, 8),
        onboardingComplete: true,
        zodiac,
        personality,
        stats: calculateStats(zodiac, personality),
        equippedOutfit,
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

export function getEffectiveStats(progress: PlayerProgress): PlayerStats {
    const stats = { ...progress.stats };
    const bonuses: Record<string, Partial<PlayerStats>> = {
        'sakura-default': { emotion: 1 },
        'mint-florist': { insight: 1 },
        'starlight-gown': { beauty: 1 },
        'street-pop': { insight: 1 },
        'academy-retro': { wisdom: 1 },
    };
    const bonus = bonuses[progress.equippedOutfit] ?? {};
    (Object.keys(bonus) as PlayerStatKey[]).forEach((key) => {
        stats[key] = Math.min(5, stats[key] + Number(bonus[key] ?? 0));
    });
    const partner = getPartnerSupport(progress.activePartner);
    if (partner) {
        stats[partner.stat] = Math.min(5, stats[partner.stat] + partner.statBonus);
    }
    for (const skillId of progress.learnedSkills) {
        const skill = SKILLS.find((entry) => entry.id === skillId);
        if (skill) {
            stats[skill.stat] = Math.min(5, stats[skill.stat] + skill.statBonus);
        }
    }
    return stats;
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

export function meetCharacter(progress: PlayerProgress, characterId: string): PlayerProgress {
    const next = cloneProgress(progress);
    if (next.metCharacters.indexOf(characterId) >= 0) {
        return next;
    }
    next.metCharacters.push(characterId);
    if (next.unlockedCharacters.indexOf(characterId) < 0) {
        next.unlockedCharacters.push(characterId);
    }
    next.bonds[characterId] = Math.max(3, getBond(next, characterId));
    return next;
}

export function discoverVenueClue(progress: PlayerProgress, clueId: string): PlayerProgress {
    const next = cloneProgress(progress);
    if (next.venueDiscoveries.indexOf(clueId) < 0) {
        next.venueDiscoveries.push(clueId);
    }
    return next;
}

export function captureCharacter(progress: PlayerProgress, characterId: string): PlayerProgress {
    const next = cloneProgress(progress);
    if (next.capturedCharacters.indexOf(characterId) >= 0) {
        return next;
    }
    next.capturedCharacters.push(characterId);
    if (next.unlockedCharacters.indexOf(characterId) < 0) {
        next.unlockedCharacters.push(characterId);
    }
    next.bonds[characterId] = Math.min(6, getBond(next, characterId) + 1);
    next.hearts = Math.min(6, next.hearts + 1);
    next.coins += ECONOMY.captureRewardCoins;
    return next;
}

export function collectFlower(progress: PlayerProgress, flowerId: string): PlayerProgress {
    const next = cloneProgress(progress);
    if (next.gatheredFlowers.indexOf(flowerId) < 0) {
        next.gatheredFlowers.push(flowerId);
    }
    return next;
}

export interface CharmBreakdown {
    base: number;
    cosmetics: number;
    surgery: number;
    total: number;
}

export function getCharmBreakdown(progress: PlayerProgress): CharmBreakdown {
    const base = getEffectiveStats(progress).beauty;
    const cosmetics = COSMETICS
        .filter((item) => progress.purchasedCosmetics.indexOf(item.id) >= 0)
        .reduce((sum, item) => sum + item.charmBonus, 0);
    const surgery = SURGERIES
        .filter((item) => item.level <= progress.surgeryLevel)
        .reduce((sum, item) => sum + item.charmBonus, 0);
    return {
        base,
        cosmetics,
        surgery,
        total: Math.min(10, base + cosmetics + surgery),
    };
}

export function getCharmValue(progress: PlayerProgress): number {
    return getCharmBreakdown(progress).total;
}

function cloneProgress(progress: PlayerProgress): PlayerProgress {
    return {
        ...progress,
        stats: { ...progress.stats },
        clues: [...progress.clues],
        bonds: { ...progress.bonds },
        unlockedCharacters: [...progress.unlockedCharacters],
        ownedOutfits: [...progress.ownedOutfits],
        defeatedRivals: [...progress.defeatedRivals],
        metCharacters: [...progress.metCharacters],
        venueDiscoveries: [...progress.venueDiscoveries],
        capturedCharacters: [...progress.capturedCharacters],
        gatheredFlowers: [...progress.gatheredFlowers],
        learnedSkills: [...progress.learnedSkills],
        claimedTaskRewards: [...progress.claimedTaskRewards],
        purchasedCosmetics: [...progress.purchasedCosmetics],
        jobRuns: { ...progress.jobRuns },
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
