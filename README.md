# Loverman

使用 Cocos Creator 3.8.8 创建的微信小游戏项目。

新增男性角色的职业、外形、性格与首章钩子见
[docs/character-roster-10.md](docs/character-roster-10.md)。

尚未实现的功能和验证项见 [代办.md](代办.md)。

## 打开项目

1. 在 Cocos Dashboard 中选择“导入项目”。
2. 选择本目录：`/Users/hik/Desktop/work/loverman`。
3. 打开 `assets/scenes/Main.scene`，点击预览即可看到启动画面。

## 发布微信小游戏

1. 在 Cocos Creator 中打开“项目 > 构建发布”。
2. 平台选择“微信小游戏”。
3. 将 `Main` 场景设为启动场景。
4. 构建完成后，用微信开发者工具导入生成的 `build/wechatgame` 目录。

项目使用 750 x 1334 的竖屏设计分辨率。

## 场景分层

场景由 `GameApp.ts` 和 `CharacterCustomization.ts` 在运行时建立独立节点，不再把人物、按钮和选项烘焙在整张成品图里。

市集场景：

```text
Canvas
├─ BackgroundLayer       天空、樱花冠层、道路
├─ CharacterLayer        粉衣女孩、银发少年
├─ StoryUiLayer          线索气泡和提示卡
├─ ActionLayer           对话、查看信息
├─ ModalLayer            详情弹窗
└─ FeedbackLayer         临时操作提示
```

形象定制场景：

```text
Canvas
├─ BackgroundLayer       渐变和樱花装饰
├─ CharacterLayer        角色预览和底座
├─ SelectionLayer        星座、性格及各自选中框
├─ AttributeLayer        属性条
├─ ActionLayer           对话、确认
├─ FeedbackLayer         选择提示
└─ ModalLayer            详情弹窗
```

心动图鉴场景：

```text
Canvas
├─ BackgroundLayer       渐变、樱花和标题
├─ CharacterGridLayer    8 个角色卡和收集进度
├─ ActionLayer           返回、搜索、详情、送礼物
├─ FeedbackLayer         角色选择提示
└─ ModalLayer            详情和操作弹窗
```

樱花街区场景：

```text
Canvas
├─ CityDecorationLayer   道路、人行道、喷泉、树木
├─ BuildingLayer         商店、住宅、钟楼及碰撞区域
├─ CharacterLayer        可移动主角
├─ HudLayer              标题、位置、返回按钮和虚拟摇杆
└─ FeedbackLayer         场景过渡
```

街区使用俯视 2D 布局。手机端拖动左下角摇杆移动，桌面端支持 WASD 和方向键；镜头跟随主角，建筑与喷泉会阻挡移动。从市集点击“进入街区”即可打开。

街区包含三处兼职点：花街咖啡馆、甜心商店和星屑剧场。靠近兼职点后点击右下角按钮，进入三轮时机判定；指针越接近高亮区域，获得的金币越多。金币保存在 `loverman.save.v1`，会显示在街区 HUD 和市集线索簿中。

街区 HUD 的“换装”可以打开衣橱。现有 5 套服装，支持金币购买、穿戴和角色预览；已购服装和当前穿戴会持久化。服装提供主题标签和属性加成，穿搭后的有效属性会参与市集剧情判定。

分层图片位于 `assets/resources/scene/layers`。原始的两张 JPG 只保留作素材来源，运行时不再加载整张成品界面。

图鉴角色素材位于 `assets/resources/scene/gallery`。市集页左上角的“图鉴”按钮会进入 `CharacterGallery` 场景。

`tools/extract_foreground.swift` 使用 macOS Vision 的显著性检测从原始 JPG 中提取透明人物，便于后续重新生成角色素材。

## 当前玩法闭环

角色数据、线索、礼物、好感和剧情进度统一保存在 `loverman.save.v1`。首次进入需要完成形象定制，后续启动会直接继续到市集。

第一章流程：

```text
观察市集 → 收集樱花甜品线索
→ 与银发少年交谈 → 根据属性和性格选择回应
→ 获得礼物和好感 → 解锁沈星澜图鉴
→ 在心动图鉴查看资料或送出礼物
```

星座与性格会给初始属性增加一点加成。情商和洞察力达到条件时可以触发对应分支，属性不足时仍可通过“请摊主一起确认”完成章节，避免流程卡死。

## 当前表现层

- 三个场景启动时使用淡入过渡。
- 市集角色带有轻微待机浮动。
- 按钮、章节完成和送礼使用独立音效，微信小游戏环境会附带短震动。
- 背景音乐在首次点击后播放，避免浏览器和微信小游戏的自动播放限制。
- 图片加载失败时会显示占位卡，不再留下无反馈的透明区域。
- 市集底部“线索簿”会显示目前记录到的线索、属性、礼物、好感和章节状态。
- 市集右上角“设置”可以分别关闭背景音乐、界面音效和操作震动，偏好保存在本机。
- 设置页支持“重新开始旅程”，需要二次点击确认；重置会清除形象、线索、礼物、好感和图鉴解锁进度，但保留声音设置。
