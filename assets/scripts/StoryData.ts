export type PlayerStatKey = 'wisdom' | 'beauty' | 'emotion' | 'insight';

export interface StatRequirement {
    stat: PlayerStatKey;
    minimum: number;
}

export interface ChoiceEffects {
    bondDelta?: number;
    giftDelta?: number;
    heartDelta?: number;
    addClue?: string;
    unlockCharacters?: string[];
    completeEvent?: boolean;
}

export interface StoryChoice {
    id: string;
    label: string;
    description: string;
    requirement?: StatRequirement;
    outcome: string;
    effects: ChoiceEffects;
}

export interface StoryChapter {
    id: string;
    characterId: string;
    title: string;
    objective: string;
    clueId: string;
    clueTitle: string;
    clueDescription: string;
    eventTitle: string;
    eventDescription: string;
    choices: StoryChoice[];
}

export const SWEET_SHOP_CHAPTER: StoryChapter = {
    id: 'sakura-sweet-shop',
    characterId: 'shen-xinglan',
    title: '第一章 · 樱花甜品摊',
    objective: '观察市集，找到银发少年等待的原因。',
    clueId: 'market-sweet',
    clueTitle: '樱花甜品',
    clueDescription: '甜品摊附近散落着几片樱花包装纸，有人特意留下了一份甜品。',
    eventTitle: '等待的银发少年',
    eventDescription: '你把找到的线索告诉了银发少年。他沉默了一会儿，像是在决定要不要说出真正的来意。',
    choices: [
        {
            id: 'gentle-response',
            label: '温柔回应',
            description: '先不问答案，陪他等一会儿。',
            requirement: { stat: 'emotion', minimum: 5 },
            outcome: '你陪他等到灯亮起来。他终于笑着说，其实是在等一个愿意听故事的人。',
            effects: {
                bondDelta: 2,
                giftDelta: 1,
                heartDelta: 1,
                unlockCharacters: ['shen-xinglan'],
                completeEvent: true,
            },
        },
        {
            id: 'read-the-clue',
            label: '指出包装纸上的字',
            description: '从细节里还原他真正想找的人。',
            requirement: { stat: 'insight', minimum: 5 },
            outcome: '你认出了包装纸上的旧店名。他找到了记忆里的那家店，也第一次向你道谢。',
            effects: {
                bondDelta: 1,
                giftDelta: 1,
                heartDelta: 1,
                addClue: 'old-shop-name',
                unlockCharacters: ['shen-xinglan'],
                completeEvent: true,
            },
        },
        {
            id: 'ask-the-owner',
            label: '请摊主一起确认',
            description: '不依赖属性，稳当地把线索问清楚。',
            outcome: '摊主确认了甜品主人的身份。虽然没有单独解开谜题，你和少年仍然顺利完成了这次委托。',
            effects: {
                bondDelta: 1,
                giftDelta: 1,
                heartDelta: 1,
                unlockCharacters: ['shen-xinglan'],
                completeEvent: true,
            },
        },
    ],
};
