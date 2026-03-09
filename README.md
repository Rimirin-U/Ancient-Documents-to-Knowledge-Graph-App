## 环境

```bash
npm install
```

## 运行

启动开发服务器：

```bash
npx expo start
```

启动后，可通过 Expo Go App 扫描二维码在真机上预览，或按 `w` 在浏览器中打开、按 `a` 打开 Android 模拟器，按 `i` 打开 iOS 模拟器。

## ECharts相关

图表组件位于 `components/echarts/`，对外暴露统一的 `<Chart>` 组件，平台自动适配：移动端（Native）基于 `WebView` 渲染，Web 端基于 `iframe` 渲染。

### 组件 Props

| 参数 | 类型 | 说明 |
|------|------|------|
| `option` | `any` | ECharts 配置项，直接传入标准 ECharts `option` 对象 |
| `theme` | `'light' \| 'dark'` | 图表主题 |
| `onGesture` | `(isBusy: boolean) => void` | 触摸手势回调，用于在图表交互时禁用外层 ScrollView 滚动 |

`option`示例如下

```json
{
    "legend": [
        {
            "data": [
                "Seller",
                "Buyer",
                "Middleman",
                "Other"
            ]
        }
    ],
    "series": [
        {
            "categories": [
                {
                    "name": "Seller"
                },
                {
                    "name": "Buyer"
                },
                {
                    "name": "Middleman"
                },
                {
                    "name": "Other"
                }
            ],
            "data": [
                {
                    "attributes": {
                        "doc_id": "1",
                        "role": "Seller"
                    },
                    "category": 0,
                    "id": "1_姪恒忠",
                    "name": "姪恒忠",
                    "symbolSize": 20,
                    "value": 1
                },
                {
                    "attributes": {
                        "doc_id": "1",
                        "role": "Buyer"
                    },
                    "category": 1,
                    "id": "1_叔父名下篋叙堂",
                    "name": "叔父名下篋叙堂",
                    "symbolSize": 20,
                    "value": 1
                }
            ],
            "label": {
                "formatter": "{b}",
                "position": "right"
            },
            "layout": "force",
            "lineStyle": {
                "color": "source",
                "curveness": 0.3
            },
            "links": [
                {
                    "label": {
                        "formatter": "交易",
                        "show": true
                    },
                    "source": "1_姪恒忠",
                    "target": "1_叔父名下篋叙堂",
                    "value": "Trade"
                }
            ],
            "roam": true,
            "type": "graph"
        }
    ],
    "title": {
        "text": "地契关系图"
    },
    "tooltip": {}
}
```

### 使用示例

将 ECharts `option` 传入组件。

```tsx
import { Chart } from '@/components/echarts/echarts';

const option = ...

<Chart
  option={option}
  theme="light"
  onGesture={(isBusy) => setScrollEnabled(!isBusy)}
/>
```

`option` 更新后图表会自动重渲染，无需重新挂载组件。
