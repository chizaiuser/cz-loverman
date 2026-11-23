import { Color } from 'cc';

export interface OutfitDefinition {
    id: string;
    name: string;
    price: number;
    tags: string[];
    description: string;
    bonusLabel: string;
    accent: Color;
    accessory: 'sakura' | 'flower' | 'stars' | 'street' | 'academy';
}

export const DEFAULT_OUTFIT_ID = 'sakura-default';

export const OUTFITS: OutfitDefinition[] = [
    {
        id: DEFAULT_OUTFIT_ID,
        name: '粉樱日常',
        price: 0,
        tags: ['甜美', '日常'],
        description: '柔软的粉色连帽装扮，适合在樱花街慢慢散步。',
        bonusLabel: '情商 +1',
        accent: new Color(255, 151, 193, 255),
        accessory: 'sakura',
    },
    {
        id: 'mint-florist',
        name: '薄荷花艺',
        price: 80,
        tags: ['温柔', '自然'],
        description: '薄荷色围巾与小花胸针，适合花店兼职和温柔系对话。',
        bonusLabel: '洞察 +1',
        accent: new Color(139, 201, 177, 255),
        accessory: 'flower',
    },
    {
        id: 'starlight-gown',
        name: '星夜礼服',
        price: 150,
        tags: ['优雅', '冷艳'],
        description: '深紫礼服配星轨发饰，适合舞台和正式挑战。',
        bonusLabel: '美貌 +1',
        accent: new Color(154, 139, 225, 255),
        accessory: 'stars',
    },
    {
        id: 'street-pop',
        name: '活力街头',
        price: 120,
        tags: ['活泼', '街头'],
        description: '青色耳机和短夹克，适合电竞、运动与节奏挑战。',
        bonusLabel: '洞察 +1',
        accent: new Color(103, 197, 226, 255),
        accessory: 'street',
    },
    {
        id: 'academy-retro',
        name: '复古学院',
        price: 180,
        tags: ['复古', '知性'],
        description: '酒红贝雷帽与格纹围巾，适合档案室和推理挑战。',
        bonusLabel: '才智 +1',
        accent: new Color(190, 113, 136, 255),
        accessory: 'academy',
    },
];

export function getOutfit(id: string): OutfitDefinition {
    return OUTFITS.find((outfit) => outfit.id === id) ?? OUTFITS[0];
}
