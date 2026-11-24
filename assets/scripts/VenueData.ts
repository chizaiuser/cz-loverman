import { Color, sys } from 'cc';
import { PARTNERS, PartnerSupport } from './PartnerData';

export type VenueId =
    | 'cafe'
    | 'sweet'
    | 'stage'
    | 'books'
    | 'hospital'
    | 'garage'
    | 'innovation';

export interface VenueExplorationPoint {
    id: string;
    label: string;
    action: string;
    description: string;
}

export interface VenueDefinition {
    id: VenueId;
    name: string;
    subtitle: string;
    entranceX: number;
    entranceY: number;
    accent: Color;
    wall: Color;
    floor: Color;
    captureBond: number;
    captureCharm: number;
    exploration: VenueExplorationPoint[];
}

export const VENUES: VenueDefinition[] = [
    {
        id: 'cafe',
        name: '花街咖啡馆',
        subtitle: '咖啡香与花笺秘密',
        entranceX: -425,
        entranceY: 675,
        accent: new Color(231, 158, 170, 255),
        wall: new Color(255, 224, 222, 255),
        floor: new Color(235, 196, 180, 255),
        captureBond: 3,
        captureCharm: 4,
        exploration: [
            {
                id: 'cafe-menu',
                label: '今日菜单',
                action: '查看手写菜单',
                description: '菜单背面画着一朵没有署名的樱花，和沈星澜常翻的花笺纸是同一款。',
            },
            {
                id: 'cafe-window',
                label: '临窗座位',
                action: '检查窗边座位',
                description: '窗边留着一只温热的杯子，杯沿沾着淡粉色糖霜，说明有人刚刚匆忙离开。',
            },
            {
                id: 'cafe-letter',
                label: '咖啡豆罐',
                action: '整理咖啡豆罐',
                description: '罐底压着一张约会便笺，只写了“等灯亮起来”。这或许就是下一次邀请的暗号。',
            },
        ],
    },
    {
        id: 'sweet',
        name: '甜心商店',
        subtitle: '糖霜、礼物与心动配方',
        entranceX: 405,
        entranceY: 265,
        accent: new Color(246, 155, 181, 255),
        wall: new Color(255, 224, 238, 255),
        floor: new Color(244, 203, 216, 255),
        captureBond: 3,
        captureCharm: 4,
        exploration: [
            {
                id: 'sweet-cake',
                label: '双层蛋糕',
                action: '观察展示蛋糕',
                description: '蛋糕顶层插着两枚小纸牌，一枚写着你的名字，另一枚被刻意留白了。',
            },
            {
                id: 'sweet-recipe',
                label: '配方册',
                action: '翻阅配方册',
                description: '配方册夹着一张试吃评分表，最高分旁边画着笑脸，笔迹和夏阳很像。',
            },
            {
                id: 'sweet-gift',
                label: '礼物盒',
                action: '拆开陈列礼物',
                description: '礼物盒里不是糖果，而是一枚樱花形状的胸针，样式与你的服装很相配。',
            },
        ],
    },
    {
        id: 'stage',
        name: '星屑剧场',
        subtitle: '聚光灯下的真心演出',
        entranceX: 395,
        entranceY: -745,
        accent: new Color(164, 143, 226, 255),
        wall: new Color(91, 62, 112, 255),
        floor: new Color(132, 96, 152, 255),
        captureBond: 3,
        captureCharm: 4,
        exploration: [
            {
                id: 'stage-light',
                label: '灯光控制台',
                action: '调整舞台灯光',
                description: '控制台保留着一段为你准备的追光轨迹，终点正好落在观众席第一排。',
            },
            {
                id: 'stage-note',
                label: '排练便笺',
                action: '翻阅排练便笺',
                description: '便笺上有一段没有台词的即兴表演，旁边写着“等她说愿意”。',
            },
            {
                id: 'stage-prop',
                label: '道具箱',
                action: '检查道具箱',
                description: '道具箱里放着一束不会凋谢的樱花，标签上写着今天准备登场的人。',
            },
        ],
    },
    {
        id: 'books',
        name: '月光书室',
        subtitle: '旧书页里的线索与告白',
        entranceX: -390,
        entranceY: 275,
        accent: new Color(145, 150, 220, 255),
        wall: new Color(233, 228, 250, 255),
        floor: new Color(204, 192, 225, 255),
        captureBond: 3,
        captureCharm: 4,
        exploration: [
            {
                id: 'books-map',
                label: '街区地图',
                action: '展开旧地图',
                description: '地图上标出了城市里的工作场所，每个坐标旁都写着一个男性角色的名字。',
            },
            {
                id: 'books-margin',
                label: '批注诗集',
                action: '阅读页边批注',
                description: '诗集的页边写着一句“希望下次并肩看完这条街”，墨迹仍然很新。',
            },
            {
                id: 'books-card',
                label: '借阅卡',
                action: '查看借阅卡',
                description: '借阅卡最近一次记录停留在今天，借出的书名叫《如何认真表达喜欢》。',
            },
        ],
    },
    {
        id: 'hospital',
        name: '仁心医院',
        subtitle: '白大褂下的温柔处方',
        entranceX: -405,
        entranceY: -170,
        accent: new Color(127, 190, 190, 255),
        wall: new Color(229, 248, 247, 255),
        floor: new Color(192, 220, 220, 255),
        captureBond: 3,
        captureCharm: 4,
        exploration: [
            {
                id: 'hospital-chart',
                label: '值班病历',
                action: '整理值班病历',
                description: '病历夹里夹着一张没有署名的复诊卡，预约人一栏只写了你的名字。',
            },
            {
                id: 'hospital-desk',
                label: '护士站',
                action: '询问护士站',
                description: '护士笑着说，今天有人提前换班，只为在走廊里多等你一会儿。',
            },
            {
                id: 'hospital-window',
                label: '休息区',
                action: '检查休息区',
                description: '桌上放着一杯温水和两颗糖，糖纸上画着不同的笑脸。',
            },
        ],
    },
    {
        id: 'garage',
        name: '夜轨赛车工坊',
        subtitle: '引擎声里的速度与胜负',
        entranceX: 405,
        entranceY: -210,
        accent: new Color(218, 107, 119, 255),
        wall: new Color(247, 221, 225, 255),
        floor: new Color(167, 158, 167, 255),
        captureBond: 3,
        captureCharm: 4,
        exploration: [
            {
                id: 'garage-helmet',
                label: '备用头盔',
                action: '检查备用头盔',
                description: '头盔内侧贴着一张新的名字贴，尺寸明显是按照你的头围准备的。',
            },
            {
                id: 'garage-tools',
                label: '维修工具台',
                action: '整理维修工具',
                description: '工具台最显眼的位置留着一把刻有“等你”的小扳手。',
            },
            {
                id: 'garage-track',
                label: '赛道记录',
                action: '查看赛道记录',
                description: '最快圈速旁没有写车手姓名，只画了一颗被速度线包围的心。',
            },
        ],
    },
    {
        id: 'innovation',
        name: '星环创新中心',
        subtitle: '数据、秘密与未来计划',
        entranceX: 395,
        entranceY: 850,
        accent: new Color(110, 156, 217, 255),
        wall: new Color(220, 234, 251, 255),
        floor: new Color(172, 188, 218, 255),
        captureBond: 3,
        captureCharm: 4,
        exploration: [
            {
                id: 'innovation-screen',
                label: '全息屏幕',
                action: '查看全息屏幕',
                description: '屏幕上的城市模型重复标记着同一栋大楼，像是在等待某个人解密。',
            },
            {
                id: 'innovation-terminal',
                label: '加密终端',
                action: '检查加密终端',
                description: '终端没有上锁，桌面上只留着一份未来一周的约会日程。',
            },
            {
                id: 'innovation-model',
                label: '城市模型',
                action: '观察城市模型',
                description: '模型中央多了一栋不在规划图上的粉色小屋，门前站着两个小小的人影。',
            },
        ],
    },
];

const PARTNER_VENUE: Record<string, VenueId> = {
    'shen-xinglan': 'cafe',
    'jiang-yanbai': 'books',
    'jiang-yanbai-hoodie': 'books',
    'xia-yang': 'sweet',
    'lu-qinglan': 'stage',
    'lu-qinglan-hoodie': 'stage',
    'gu-chenzhou': 'sweet',
    'liang-xingye': 'stage',
    'tang-qi': 'stage',
    'xie-wujiu': 'cafe',
    'pei-yuchuan': 'cafe',
    'qi-guanlan': 'books',
    'cheng-yanli': 'sweet',
    'huo-wenzhou': 'cafe',
    'song-zhao': 'stage',
    'wen-xuechuan': 'stage',
    'chu-yao': 'stage',
    'ji-xingran': 'stage',
    'shen-yuheng': 'hospital',
    'shen-qinghe': 'hospital',
    'wen-yu': 'hospital',
    'jing-mo': 'garage',
    'pei-yao': 'garage',
    'su-yan': 'books',
    'jiang-xubai': 'books',
    'su-linyuan': 'books',
    'ye-ci': 'innovation',
    'cang-lan': 'innovation',
    'xiao-tang': 'innovation',
    'sha-luo': 'innovation',
    'lu-shiyue': 'sweet',
};

const ACTIVE_VENUE_KEY = 'loverman.venue.active';

export function getVenue(id: string): VenueDefinition | null {
    return VENUES.find((venue) => venue.id === id) ?? null;
}

export function getPartnerVenueId(partnerId: string): VenueId {
    return PARTNER_VENUE[partnerId] ?? 'cafe';
}

export function getVenuePartners(venueId: VenueId): PartnerSupport[] {
    return PARTNERS.filter((partner) => getPartnerVenueId(partner.id) === venueId);
}

export function setActiveVenue(venueId: VenueId): void {
    sys.localStorage.setItem(ACTIVE_VENUE_KEY, venueId);
}

export function getActiveVenue(): VenueDefinition | null {
    return getVenue(sys.localStorage.getItem(ACTIVE_VENUE_KEY) ?? '');
}
