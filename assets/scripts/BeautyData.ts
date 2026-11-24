import { Color } from 'cc';
import {
    COSMETIC_PRICES,
    SURGERY_PRICES,
} from './EconomyData';

export interface CosmeticDefinition {
    id: string;
    name: string;
    description: string;
    price: number;
    charmBonus: number;
    accent: Color;
}

export interface SurgeryDefinition {
    level: number;
    name: string;
    description: string;
    price: number;
    charmBonus: number;
    accent: Color;
}

export const COSMETICS: CosmeticDefinition[] = [
    {
        id: 'sakura-lipstick',
        name: '樱色口红',
        description: '柔和的樱粉色，让气色和第一印象更好。',
        price: COSMETIC_PRICES['sakura-lipstick'],
        charmBonus: 1,
        accent: new Color(232, 102, 146, 255),
    },
    {
        id: 'pearl-base',
        name: '珍珠底妆',
        description: '细腻的珍珠光泽，提升自拍和舞台表现。',
        price: COSMETIC_PRICES['pearl-base'],
        charmBonus: 1,
        accent: new Color(215, 181, 202, 255),
    },
    {
        id: 'starlight-eyes',
        name: '星眸眼妆',
        description: '带细闪的晚霞眼影，适合正式挑战和约会。',
        price: COSMETIC_PRICES['starlight-eyes'],
        charmBonus: 1,
        accent: new Color(158, 142, 224, 255),
    },
];

export const SURGERIES: SurgeryDefinition[] = [
    {
        level: 1,
        name: '精致轮廓',
        description: '医疗美容中心的轻度轮廓调整，自然提升魅力。',
        price: SURGERY_PRICES[1],
        charmBonus: 1,
        accent: new Color(132, 191, 190, 255),
    },
    {
        level: 2,
        name: '五官精雕',
        description: '更精细的五官协调方案，让整体气质更鲜明。',
        price: SURGERY_PRICES[2],
        charmBonus: 1,
        accent: new Color(120, 164, 210, 255),
    },
    {
        level: 3,
        name: '星耀容颜',
        description: '顶级医疗美容方案，获得显著且永久的魅力提升。',
        price: SURGERY_PRICES[3],
        charmBonus: 2,
        accent: new Color(186, 140, 215, 255),
    },
];
