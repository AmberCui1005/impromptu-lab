# 即兴表达训练场 · Impromptu Lab

一款**单文件、零后端**的双语即兴表达练习小游戏：抽题 → 限时准备（或自主检索）→ 语音/文本作答 → AI 评分 → 复盘归档。

面向口语晨练、面试即兴题热身、限时写作训练，以及"查完一个概念后用自己的话讲出来"的复述练习。

## 快速开始

### 想用语音 + AI 评分：只双击「启动网页.bat」

一个窗口同时起两件事：

- 页面：`http://localhost:8080/`（语音识别只在 localhost / https 下可用，`file:///` 会被拒绝）
- AI 代理：`http://localhost:8787/v1`（绕开官方 API 的跨域限制，默认指向火山方舟）

浏览器会自动打开页面。**窗口别关**，关了页面和代理一起停。

### 只用文本作答：直接双击 index.html 也行

```bash
start index.html      # Windows
open  index.html      # macOS

# 或者自己起个服务
python -m http.server 8080
```

> 语音识别依赖 Chrome / Edge 内置的在线语音服务，国内网络可能报 `network` 错误；不支持时应用会自动降级为文本作答。

## 功能

| 模块 | 说明 |
|---|---|
| 双语题库 | 42 道即兴题（7 个话题分类，中英双语）+ 30 个概念（只给名字，材料自己检索） |
| 两种模式 | 即兴演讲/观点写作；概念检索复述（检索阶段计时，复述时概念名收起，可回看 1 次） |
| 三档节奏 | 快 / 标准 / 深度 / 不限时，准备、检索、作答时长随之联动 |
| 语音作答 | 实时转写、可编辑纠错、暂停继续、口头禅与停顿统计 |
| 文本作答 | 中文字数 / 英文词数实时统计 |
| AI 评分 | 兼容 OpenAI Chat Completions 的任意接口；按雅思（英文）与结构化面试（中文）分项评分 |
| 降级策略 | 未配置或调用失败时自动用本地规则估算，记录照常保存，可事后重新评分 |
| 配置指南 | 应用内「设置 → 不会配？打开配置指南」：8 家服务商一键填入、跨域解法、报错对照、麦克风自检 |
| 复盘 | 总分/等级、雷达图、分项评语、亮点、改进点、逐条错误清单 |
| 改进版 | 中文模式下，AI 在你原文基础上做必要修改（语法/用词/衔接/结构/补支撑），保留观点与骨架，不整篇重写 |
| 英语阶梯 | 英文模式按 IELTS 9 分制爬梯：这次 4 分就给 5 分版本，够到 5 就给 6 分版本，一路到 9。同一题反复录，自动进档 |
| 三阶段复述 | ① 照读示范全文 → ② 只看关键词 → ③ 空白复述；每段计时计字，练完可无限轮次重复 |
| 重新录制 | 复盘页一键同题重来，不用重新抽题 |
| 错误集锦 | 跨场次按类别聚合统计，支持语言/类别/时间筛选与"标记已掌握" |
| 结果卡片 | Canvas 生成 1080×1440 结果图，可下载 PNG，可复制文本摘要 |
| 本地数据 | localStorage 保存；支持导出 JSON、二次确认清空 |

## 配置 AI 评分（3 分钟）

应用内点「设置 → 不会配？打开配置指南」有完整图文步骤和 8 家服务商的一键填入。要点：

- **Endpoint**：填到 `/v1` 即可，会自动补 `/chat/completions`；粘贴完整地址也能识别
- **API Key**：仅存本机 localStorage；留空则不带 `Authorization` 头（走本地代理时正是这样）
- **Model**：必须与服务商文档完全一致，如 `gpt-4o-mini`、`deepseek-chat`、`qwen-plus`

### 常见服务商

| 服务商 | Endpoint | 示例模型 |
|---|---|---|
| 火山方舟（豆包） | `https://ark.cn-beijing.volces.com/api/v3` | `doubao-seed-2-1-pro-260915` 或 `ep-xxxx` |
| 本地代理（推荐，默认已指向方舟） | `http://localhost:8787/v1` | 上游模型名 |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| 阿里云百炼（兼容模式） | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` |
| 月之暗面 Kimi | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-flash` |
| 硅基流动 | `https://api.siliconflow.cn/v1` | `Qwen/Qwen2.5-7B-Instruct` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| OpenRouter | `https://openrouter.ai/api/v1` | `openai/gpt-4o-mini` |

### 用火山方舟（豆包）

1. 方舟控制台 →「API Key 管理」创建 Key（`ARK_API_KEY`）
2. 控制台 →「模型列表」复制要用的 Model ID（例如 `doubao-seed-2-1-pro-260915`）；也可以创建「推理接入点」拿 `ep-` 开头的 ID
3. 双击「启动网页.bat」（页面 + 代理一起起来，窗口别关）
4. 应用「设置 → AI 评分接口」：Endpoint `http://localhost:8787/v1`，Model 填第 2 步的 ID，Key 可以直接粘在页面的 API Key 框里（也可以写进 `proxy.config.json` 的 `apiKey`，二者任选其一）
5. 点「测试连接」。不知道模型名就点「不知道模型名？自动挑」——它会用你的 Key 逐个试公开模型，通了自动填入

> 方舟返回 `ModelNotOpen` = 该模型没开通；去控制台「开通管理」勾一个即可（按量计费，不用预充值）。

> 方舟的 Base URL 是 `/api/v3`，不是 `/v1`；代理会自动把页面里的 `/v1` 前缀换成配置里的版本段。

### 跨域（CORS）怎么办

多数官方 API 不允许浏览器直连，会报 CORS 错误 —— 这不是配置写错，是浏览器安全策略。两种解法：

**A. 用仓库自带的本地代理（零跨域，推荐）**

```bash
# 1. 复制配置模板，填入上游地址与 Key
copy proxy.config.example.json proxy.config.json     # Windows
cp   proxy.config.example.json proxy.config.json     # macOS / Linux

# 2. 双击「启动代理.bat」，或执行
node proxy.js
```

`proxy.config.json`：

```json
{ "upstream": "https://api.deepseek.com/v1", "apiKey": "sk-xxx", "port": 8787 }
```

然后在应用里把 Endpoint 填 `http://localhost:8787/v1`，**API Key 留空**（代理会自己加）。

`proxy.config.json` 含密钥，不要提交到仓库（已在 `.gitignore` 中排除）。

**B. 用自己已有的网关**（one-api / new-api 之类），网关通常已处理跨域。

### 报错对照

| 现象 | 含义 | 处理 |
|---|---|---|
| `Failed to fetch` / 无法连接 | 请求根本到不了 | 端点填 `localhost:8787` → 代理没启动，双击「启动网页.bat」；端点填官方地址 → 被跨域拦了，改用代理 |
| `401` | Key 不对或没带上 | 方舟返回 `AuthenticationError`；检查空格、项目是否正确、Key 是否粘全 |
| `403` | Key 无该模型权限 / 账号受限 | 换模型、开通模型服务或完成实名 |
| `404` | 地址拼错 | 方舟填 `/api/v3`；通用厂商填到 `/v1` 就停，别把 `/chat/completions` 写两遍 |
| `429` | 额度用尽或太快 | 充值或降频；本地规则仍可用 |
| CORS 错误 | 浏览器拦跨域 | 用本地代理（Endpoint 改 `http://localhost:8787/v1`） |
| 超时 | 代理没启动 / 主机写错 / 网络不通 | 先看启动窗口里有没有打出代理地址 |

### 一次评分花多少

一次评分几百到一千 token，按常见价格约几分钱。建议在服务商后台设月度限额。Key 只存在本机浏览器，页面代码不会上传它；但导出的 JSON 备份会包含 Key。

### 评分请求契约

评分请求遵循需求文档 §8 的契约：

```json
{
  "language": "zh | en", "mode": "impromptu | retell", "inputType": "voice | text",
  "level": "quick | standard | deep", "topic": "题目/概念",
  "content": "作答文本",
  "timing": { "prepareSec": 0, "searchSec": 0, "answerSec": 0 },
  "rubric": "按语言与模式的分项标准"
}
```

返回结构：

```json
{
  "overall": 7.0, "band": "7.0",
  "dimensions": [{"key":"fluency","name":"流利与连贯","score":7,"max":9,"comment":""}],
  "strengths": ["", ""], "improvements": ["", ""],
  "errors": [{"category":"语法错误","excerpt":"","issue":"","suggestion":""}],
  "retellCoverage": {"keyPoints":0,"totalKeyPoints":0}
}
```

## 评分框架

- **英语 · 口语**：流利与连贯 / 词汇丰富度 / 语法广度与准确度 / 发音（转写限制，弱评分）
- **英语 · 写作**：任务回应 / 连贯与衔接 / 词汇丰富度 / 语法广度与准确度
- **中文 · 口语**：扣题与观点 / 结构与逻辑 / 内容支撑 / 语言表达 / 表达仪态（弱评分）
- **中文 · 写作**：扣题与观点 / 结构与逻辑 / 内容支撑 / 语言表达
- **概念复述（附加）**：要点覆盖 / 术语准确 / 转述能力 / 逻辑结构

错误类别统一为：语法错误、用词不当、搭配错误、表达不地道/中式、逻辑与结构问题、扣题偏差、拼写/标点、口头禅与停顿（语音）、术语错误（复述）、内容缺失（复述）。

## 技术说明

- 单文件 `index.html`，原生 JS，无构建、无框架、无后端；CSS/JS 全内联
- 页内 hash 路由 + 普通对象状态
- 数据模型与需求文档 §7 一致（`sessionRecord` / `errorCollection` / `settings`）

## 已知限制

- 发音、语速、停顿只能基于转写文本弱推断，不能替代录音回听
- 语音识别的转写质量取决于浏览器与网络；`file://` 下无法启动，需用 `localhost`
- Chrome 的语音识别会把音频送到在线服务，离线或受限网络不可用
- 本地规则评分只是启发式估算，仅用于未配置 AI 时的兜底
- 结果卡片为本地 Canvas 渲染，未做服务端分享链接

## 目录

```
index.html                  # 应用本体（单文件，含全部功能与样式）
serve.js                    # 本地静态服务（localhost:8080，解决语音安全上下文）
proxy.js                    # 本地 CORS 代理（localhost:8787 → 上游 AI 接口）
proxy.config.example.json   # 代理配置模板（复制为 proxy.config.json 后填 Key）
启动网页.bat                # 双击：起静态服务并打开浏览器（Windows）
启动代理.bat                # 双击：起 CORS 代理（Windows）
README.md
LICENSE
```

需要 Node.js 才能用两个 `.js`（仅本地运行，应用本身不依赖 Node）。macOS / Linux 直接 `node serve.js`、`node proxy.js` 即可。

## License

MIT
