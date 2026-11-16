# Loverman

使用 Cocos Creator 3.8.8 创建的微信小游戏项目。

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

分层图片位于 `assets/resources/scene/layers`。原始的两张 JPG 只保留作素材来源，运行时不再加载整张成品界面。

`tools/extract_foreground.swift` 使用 macOS Vision 的显著性检测从原始 JPG 中提取透明人物，便于后续重新生成角色素材。
