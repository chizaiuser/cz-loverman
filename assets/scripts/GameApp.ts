import {
    _decorator,
    Color,
    Component,
    HorizontalTextAlignment,
    Label,
    Node,
    UITransform,
    VerticalTextAlignment,
} from 'cc';

const { ccclass } = _decorator;

@ccclass('GameApp')
export class GameApp extends Component {
    protected start(): void {
        const titleNode = new Node('Welcome');
        titleNode.layer = this.node.layer;
        this.node.addChild(titleNode);
        titleNode.setPosition(0, 80);

        const transform = titleNode.addComponent(UITransform);
        transform.setContentSize(620, 220);

        const label = titleNode.addComponent(Label);
        label.string = 'LOVERMAN\nCocos Creator 3.8.8';
        label.fontSize = 52;
        label.lineHeight = 72;
        label.color = new Color(246, 228, 196, 255);
        label.horizontalAlign = HorizontalTextAlignment.CENTER;
        label.verticalAlign = VerticalTextAlignment.CENTER;
    }
}
