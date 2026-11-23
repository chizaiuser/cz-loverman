import { Color } from 'cc';
import { PlayerStatKey } from './StoryData';

export interface PartnerSupport {
    id: string;
    name: string;
    role: string;
    stat: PlayerStatKey;
    statBonus: number;
    jobBonuses: Record<string, number>;
    accent: Color;
}

export const PARTNERS: PartnerSupport[] = [
    {
        id: 'shen-xinglan',
        name: '沈星澜',
        role: '花笺观察',
        stat: 'emotion',
        statBonus: 1,
        jobBonuses: { cafe: 4, sweet: 2 },
        accent: new Color(255, 170, 205, 255),
    },
    {
        id: 'jiang-yanbai',
        name: '江砚白',
        role: '书页推理',
        stat: 'wisdom',
        statBonus: 1,
        jobBonuses: { cafe: 4, stage: 2 },
        accent: new Color(214, 187, 244, 255),
    },
    {
        id: 'jiang-yanbai-hoodie',
        name: '江砚白·便装',
        role: '细节记录',
        stat: 'insight',
        statBonus: 1,
        jobBonuses: { sweet: 4, stage: 2 },
        accent: new Color(255, 210, 157, 255),
    },
    {
        id: 'xia-yang',
        name: '夏阳',
        role: '活力协助',
        stat: 'emotion',
        statBonus: 1,
        jobBonuses: { sweet: 5, stage: 3 },
        accent: new Color(255, 205, 178, 255),
    },
    {
        id: 'lu-qinglan',
        name: '陆青澜',
        role: '舞台统筹',
        stat: 'insight',
        statBonus: 1,
        jobBonuses: { stage: 5, cafe: 2 },
        accent: new Color(170, 190, 255, 255),
    },
    {
        id: 'lu-qinglan-hoodie',
        name: '陆青澜·便装',
        role: '冷静判断',
        stat: 'wisdom',
        statBonus: 1,
        jobBonuses: { stage: 4, sweet: 2 },
        accent: new Color(172, 207, 250, 255),
    },
    {
        id: 'gu-chenzhou',
        name: '顾沉舟',
        role: '礼物鉴赏',
        stat: 'emotion',
        statBonus: 1,
        jobBonuses: { sweet: 4, cafe: 3 },
        accent: new Color(230, 185, 153, 255),
    },
    {
        id: 'liang-xingye',
        name: '梁星野',
        role: '空间洞察',
        stat: 'wisdom',
        statBonus: 1,
        jobBonuses: { stage: 5, cafe: 2 },
        accent: new Color(191, 157, 117, 255),
    },
    {
        id: 'tang-qi',
        name: '唐栖',
        role: '节奏连击',
        stat: 'insight',
        statBonus: 1,
        jobBonuses: { stage: 6, sweet: 2 },
        accent: new Color(94, 194, 226, 255),
    },
    {
        id: 'xie-wujiu',
        name: '谢无咎',
        role: '星象预判',
        stat: 'insight',
        statBonus: 1,
        jobBonuses: { cafe: 4, stage: 4 },
        accent: new Color(145, 132, 221, 255),
    },
    {
        id: 'pei-yuchuan',
        name: '裴予川',
        role: '温柔协调',
        stat: 'emotion',
        statBonus: 1,
        jobBonuses: { sweet: 5, cafe: 3 },
        accent: new Color(143, 193, 156, 255),
    },
    {
        id: 'qi-guanlan',
        name: '祁观澜',
        role: '档案检索',
        stat: 'wisdom',
        statBonus: 1,
        jobBonuses: { cafe: 4, stage: 3 },
        accent: new Color(142, 151, 167, 255),
    },
    {
        id: 'cheng-yanli',
        name: '程砚礼',
        role: '甜品专注',
        stat: 'emotion',
        statBonus: 1,
        jobBonuses: { sweet: 6, cafe: 2 },
        accent: new Color(226, 166, 117, 255),
    },
    {
        id: 'huo-wenzhou',
        name: '霍闻舟',
        role: '安全守护',
        stat: 'wisdom',
        statBonus: 1,
        jobBonuses: { cafe: 3, sweet: 3, stage: 3 },
        accent: new Color(92, 125, 174, 255),
    },
    {
        id: 'song-zhao',
        name: '宋照',
        role: '舞台表现',
        stat: 'emotion',
        statBonus: 1,
        jobBonuses: { stage: 6, cafe: 2 },
        accent: new Color(205, 101, 124, 255),
    },
    {
        id: 'wen-xuechuan',
        name: '闻雪川',
        role: '镜头观察',
        stat: 'insight',
        statBonus: 1,
        jobBonuses: { stage: 5, sweet: 3 },
        accent: new Color(126, 187, 230, 255),
    },
];

export function getPartnerSupport(id: string): PartnerSupport | null {
    return PARTNERS.find((partner) => partner.id === id) ?? null;
}
