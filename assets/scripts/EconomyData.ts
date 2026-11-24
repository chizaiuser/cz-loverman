export const ECONOMY = {
    startingCoins: 25,
    captureRewardCoins: 25,
    jobRepeatMultiplierStep: 0.1,
    jobRepeatMultiplierFloor: 0.65,
} as const;

export const JOB_REWARDS: Record<string, { base: number; bonus: number }> = {
    cafe: { base: 5, bonus: 10 },
    sweet: { base: 6, bonus: 11 },
    stage: { base: 7, bonus: 13 },
};

export const OUTFIT_PRICES: Record<string, number> = {
    'sakura-default': 0,
    'mint-florist': 160,
    'starlight-gown': 300,
    'street-pop': 210,
    'academy-retro': 350,
};

export const COSMETIC_PRICES: Record<string, number> = {
    'sakura-lipstick': 30,
    'pearl-base': 55,
    'starlight-eyes': 80,
};

export const SKILL_PRICES: Record<string, number> = {
    'florist-basics': 25,
    'latte-art': 40,
    'stage-rhythm': 55,
};

export const SURGERY_PRICES: Record<number, number> = {
    1: 150,
    2: 300,
    3: 500,
};

export const TASK_REWARDS: Record<string, { coins: number; gifts: number }> = {
    'flower-gathering': { coins: 25, gifts: 1 },
    'work-income': { coins: 50, gifts: 1 },
    'skill-learning': { coins: 40, gifts: 1 },
};

export const ROLE_TASK_REWARDS: Record<
    string,
    { coins: number; gifts: number; bond: number }
> = {
    'shen-window-letter': { coins: 40, gifts: 1, bond: 1 },
    'jiang-old-book': { coins: 45, gifts: 1, bond: 1 },
    'jiang-next-chapter': { coins: 65, gifts: 1, bond: 1 },
    'chu-yao-untitled-song': { coins: 70, gifts: 1, bond: 1 },
    'cheng-yanli-childhood-cake': { coins: 65, gifts: 1, bond: 1 },
};

export const CHALLENGE_REWARDS: Record<string, { first: number; repeat: number }> = {
    'su-man': { first: 120, repeat: 25 },
    'ji-lan': { first: 180, repeat: 35 },
};
