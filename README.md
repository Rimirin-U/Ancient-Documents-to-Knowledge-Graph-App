# 古代地契文书知识图谱 · 前端（Expo）

展示名 **文渊智图**（见 `app.config.js` 的 `expo.name`）。工程为 **Expo SDK 54** + **expo-router** + **React Native 0.81** / **React 19**（以 `package.json` 为准）。

## 环境

```bash
npm install
```

建议使用与 Expo SDK 匹配的 Node 版本（参见 [Expo 文档](https://docs.expo.dev/)）。

## 运行

```bash
npx expo start
```

`package.json` 中相关脚本：

| 脚本 | 说明 |
|------|------|
| `npm run start` / `npx expo start` | 默认启动 Metro |
| `npm run start:go` | `expo start --go`，便于 Expo Go |
| `npm run start:tunnel` | `expo start --tunnel` |
| `npm run start:tunnel:go` | 隧道 + Expo Go |
| `npm run android` / `ios` / `web` | 各平台开发启动 |

- 使用 **Expo Go** 扫描终端二维码在真机预览。
- 在终端按 **`w`** 在浏览器中打开（Web）。

## API 基础地址（与代码一致）

运行时基址为 **`services/config.ts`** 导出的 **`API_BASE_URL`**，解析顺序为：

1. **`Constants.expoConfig?.extra?.apiBaseUrl`**（由 **`app.config.js`** 在构建/启动时写入 `expo.extra`）
2. 若上为空字符串，则用 **`process.env.EXPO_PUBLIC_API_BASE_URL`**
3. 再否则使用 **`services/config.ts` 内硬编码 `fallback`**（当前为 **`http://8.162.9.49:3000`**，须与 `app.config.js` 中 **`DEFAULT_API`** 保持一致）

**`app.config.js`** 逻辑（单一事实来源之一）：`require('dotenv').config()` 后，取 `process.env.EXPO_PUBLIC_API_BASE_URL`（去尾斜杠）；若为空则使用 **`DEFAULT_API`**（当前 **`http://8.162.9.49:3000`**），赋给 `expo.extra.apiBaseUrl`，并执行 `process.env.EXPO_PUBLIC_API_BASE_URL = apiBaseUrl`。

**本地/局域网/自建后端**：复制 **`.env.example`** 为 **`.env`**，设置 `EXPO_PUBLIC_API_BASE_URL=http://<主机>:<端口>`（无尾斜杠，端口与后端 `uvicorn` 一致，默认常为 **3000**），保存后**必须重启** `npx expo start`。也可直接修改 **`app.config.js`** 的 **`DEFAULT_API`** 与 **`services/config.ts`** 的 **`fallback`**（两处应同值，避免 Expo Go 与裸 `process.env` 路径不一致）。

**EAS 构建**：**`eas.json`** 在 `development` / `preview` / `production` 的 `env` 中均注入了 `EXPO_PUBLIC_API_BASE_URL`（当前为演示服务器地址）；换环境构建时需同步修改各 profile。

手机非局域网访问时，后端需监听 **`0.0.0.0`**，并放行云安全组/防火墙对应 **TCP** 端口。

## 网络与鉴权

- 通用请求封装：**`services/api.ts`** 的 **`apiFetch`**：附带 `Authorization: Bearer <token>`；响应 **401** 时请求 **`POST /api/v1/auth/refresh`** 刷新，成功则重试一次；仍失败则清除本地 **`auth_token`**、**`auth_expires_at`**（键名见 `api.ts`）。
- 登录后本地过期时间按 **`TOKEN_TTL_MS = 24 * 60 * 60 * 1000`** 写入，与刷新成功后的续期方式一致（与后端 JWT 有效期应对齐，以后端为准）。
- **FormData** 上传时会**删除**手动设置的 `content-type`，以便由运行时生成 `multipart` boundary（见 `apiFetch` 注释）。

## 本地存储

**`services/storage.ts`**：**iOS/Android** 使用 **`expo-secure-store`**；**Web** 使用 **`localStorage`**。`clearStorage` 在 Web 为 `localStorage.clear()`，在原生侧仅删除 `auth_token`、`auth_expires_at`。

## 路由与 Tab

- 根布局 **`app/_layout.tsx`**：**`RouteGuard`** 在未登录且非 `login`/`register` 时跳转 **`/login`**；已登录访问登录/注册页则跳转 **`/(tabs)`**。
- Tab（**`app/(tabs)/_layout.tsx`**）：**首页**、**记录**、**问答**、**统计**、**我的**；另有 **`image-detail`**、**`cross-doc-detail`**、**`edit-profile`** 等 Stack 页面。

## ECharts

图表在 **`components/echarts/`**：**`echarts.tsx`**（Web，**iframe**）、**`echarts.native.tsx`**（iOS/Android，**WebView**）。Metro 按平台自动解析 **`.native`** 文件。

**`<Chart>` Props**（两平台一致，见类型定义）：

| 参数 | 类型 | 说明 |
|------|------|------|
| `option` | `any` | ECharts `option`；更新引用会触发重绘 |
| `onGesture` | `(isBusy: boolean) => void` | 图表内手势时通知外层（如禁用 `ScrollView`） |
| `theme` | `'light' \| 'dark'` | 主题 |
| `height?` | `number` | 高度；默认 **Web 450**、**Native 480** |
| `onNodeClick?` | `(node: NodeClickData) => void` | 节点点击；**`NodeClickData`** 含 `name`、`category`、`symbolSize`、`properties`、`seriesType` |

实现细节：若 `option.legend` 为数组，会取第一项再传给内嵌页面（与 ECharts 期望一致）。

### 图谱数据格式（与后端/前端解析一致）

后端单文书图谱主格式为 **`{ nodes, links, categories }`**（`categories[].name` 多为 **卖方 / 买方 / 中人 / 契约 / 信息**）。**`components/image-detail/relation-graph-panel.tsx`** 同时支持：

- 上述 **nodes/links/categories** 对象；
- 或 **`series` 中含 `type: 'graph'`** 的 ECharts 整包 option（从中抽取 `data`、`links`、`categories`）。

兼容旧数据：英文分类名 **Seller / Buyer / Middleman / Other** 会映射为中文展示。节点若带 **`id`**，面板内会去掉 **`id`** 并以 **`name`** 对齐连线，避免与 `source`/`target` 不匹配。

### `option` 示例（`nodes` / `links` 形式，与当前后端单文书风格一致）

```json
{
  "nodes": [
    {
      "name": "恆忠",
      "category": 0,
      "symbolSize": 46,
      "value": "卖方",
      "properties": { "角色": "卖方" }
    },
    {
      "name": "地契",
      "category": 3,
      "symbol": "diamond",
      "symbolSize": 64,
      "value": "契约凭证"
    }
  ],
  "links": [
    { "source": "恆忠", "target": "地契", "value": "出卖" }
  ],
  "categories": [
    { "name": "卖方" },
    { "name": "买方" },
    { "name": "中人" },
    { "name": "契约" },
    { "name": "信息" }
  ]
}
```

### 使用示例

```tsx
import { Chart } from '@/components/echarts/echarts';

<Chart
  option={option}
  theme="light"
  height={480}
  onGesture={(isBusy) => setScrollEnabled(!isBusy)}
  onNodeClick={(node) => console.log(node.name, node.properties)}
/>
```

## 应用配置（`app.config.js` 摘要）

| 项 | 当前值/说明 |
|----|-------------|
| `expo.name` | `文渊智图` |
| `expo.slug` / `scheme` | `testapp`（与 `package.json` 的 `name` 一致，便于 deep link） |
| `android.package` | `com.zmj66.testapp` |
| `newArchEnabled` | `true` |
| `experiments.reactCompiler` | `false`（注释说明为减少与 Expo Go 差异） |
| `experiments.typedRoutes` | `true` |
| `ios.infoPlist.NSAppTransportSecurity` | `NSAllowsArbitraryLoads: true` |
| `android.usesCleartextTraffic` | `true`（且 `expo-build-properties` 中重复声明） |
| `plugins` | `expo-router`、`expo-build-properties`、`expo-splash-screen`、`expo-secure-store` |
| `extra.eas.projectId` | EAS 项目 ID（见配置文件） |

**`@wuba/react-native-echarts` 与 `echarts` 包**在 `package.json` 中声明；实际图谱渲染以上述自研 **WebView / iframe + `echartsHtml`** 路径为主。

## 依赖说明

仓库内 **`@wuba/react-native-echarts`**、**`echarts`** 等与 `package.json` 一致；请勿仅凭本文档版本号，以 **`package.json` / `package-lock.json`** 为准。
