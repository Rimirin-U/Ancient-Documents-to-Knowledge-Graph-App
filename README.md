# 古代地契文书知识图谱 · 前端（Expo）

## 环境

```bash
npm install
```

## 运行

```bash
npx expo start
```

- 使用 **Expo Go** 扫描终端二维码在真机预览。
- 按 **`w`** 在浏览器中打开（Web）。

## API 基础地址

后端根地址由 **`services/config.ts`** 的 **`API_BASE_URL`** 决定：

- **推荐**：在项目根目录复制 `.env.example` 为 `.env`，设置 `EXPO_PUBLIC_API_BASE_URL=http://公网IP:端口`，保存后**重启** `npx expo start`（环境变量在启动时注入）。
- **或直接改代码**：编辑 `services/config.ts` 里的 `fallback` 字符串为 `http://公网IP:端口`。
- 仅局域网联调本机后端时，可设为 `http://localhost:3000` 或 `http://局域网IP:3000`，须与 `uvicorn` 端口一致。

手机用移动网络访问时，后端须监听 `0.0.0.0` 且云安全组/防火墙放行对应 TCP 端口；详见仓库根目录 `remote.md`。

通用请求与 Token 刷新逻辑在 **`services/api.ts`**（`getToken`、`apiFetch` 等）。

## ECharts

图表位于 `components/echarts/`，通过 **`echarts.tsx`**（及 Native 平台的 `echarts.native.tsx`）对外提供统一的 `<Chart>` 组件：

- **iOS / Android**：`WebView` 内嵌图表
- **Web**：`iframe` 渲染

### 组件 Props

| 参数 | 类型 | 说明 |
|------|------|------|
| `option` | `any` | 标准 ECharts `option` |
| `theme` | `'light' \| 'dark'` | 主题 |
| `onGesture` | `(isBusy: boolean) => void` | 手势交互时通知外层是否禁用 `ScrollView` 滚动 |

### `option` 示例（与后端图谱数据结构风格一致时可参考）

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
                { "name": "Seller" },
                { "name": "Buyer" },
                { "name": "Middleman" },
                { "name": "Other" }
            ],
            "data": [
                {
                    "attributes": { "doc_id": "1", "role": "Seller" },
                    "category": 0,
                    "id": "1_姪恒忠",
                    "name": "姪恒忠",
                    "symbolSize": 20,
                    "value": 1
                },
                {
                    "attributes": { "doc_id": "1", "role": "Buyer" },
                    "category": 1,
                    "id": "1_叔父名下篋叙堂",
                    "name": "叔父名下篋叙堂",
                    "symbolSize": 20,
                    "value": 1
                }
            ],
            "label": { "formatter": "{b}", "position": "right" },
            "layout": "force",
            "lineStyle": { "color": "source", "curveness": 0.3 },
            "links": [
                {
                    "label": { "formatter": "交易", "show": true },
                    "source": "1_姪恒忠",
                    "target": "1_叔父名下篋叙堂",
                    "value": "Trade"
                }
            ],
            "roam": true,
            "type": "graph"
        }
    ],
    "title": { "text": "地契关系图" },
    "tooltip": {}
}
```

### 使用示例

```tsx
import { Chart } from '@/components/echarts/echarts';

const option = { /* ... */ };

<Chart
  option={option}
  theme="light"
  onGesture={(isBusy) => setScrollEnabled(!isBusy)}
/>
```

`option` 引用变化时会触发图表更新，无需为数据变更单独卸载挂载组件。

## 应用配置

Expo 配置见根目录 **`app.config.js`**（如 `scheme`、`plugins`、与 Expo Go 对齐的 `extra.apiBaseUrl` 等）。
