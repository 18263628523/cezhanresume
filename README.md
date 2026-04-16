# 策展简历（OnlineResume）

在线编辑、预览与发布个人简历的前后端项目：Vue 3 单页应用 + Node 轻量 API 服务，支持邮箱注册登录、静态 HTML 发布、意见反馈与「我的在线简历」管理。

## 功能概览

- **落地页 / 模板 / 联系我们**：站点导航与内容页
- **简历编辑器**：多板块编辑（个人信息、工作经历、教育、技能、项目等）、外观与模板预设、导出 PDF（浏览器打开打印）
- **账号体系**：邮箱验证码注册、登录、JWT
- **发布在线简历**：登录后生成静态 HTML，公网访问路径为 `/r/:slug`
- **我的在线简历**：列表、预览链接、删除（软删除：登记 `deletedAt`，HTML 重命名为 `slug-detal.html` 留档）
- **提意见**：匿名或留邮箱提交到服务端 JSON 存储

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3、TypeScript、Vite 7、Vue Router、Pinia、Tailwind CSS 4、Element Plus |
| 后端 | Node.js（原生 `http`）、JWT、nodemailer（验证码邮件） |
| 数据 | JSON 文件（`users.json`、`published-registry.json`、`feedback.json` 等） |

## 仓库结构（简要）

```
├── src/                 # 前端源码（页面、组件、路由、状态）
├── server/              # Node 服务（API、邮件、发布目录）
│   └── src/index.js     # 主入口与路由
├── vite.config.ts       # 开发代理、base: /resume/
└── package.json
```

## 环境要求

- Node.js：**^20.19.0 或 ≥22.12.0**

## 本地开发

### 1. 安装依赖

```bash
# 前端
npm install

# 后端
cd server
npm install
cd ..
```

### 2. 配置后端环境变量

复制 `server/.env.example` 为 `server/.env`，填写：

- `JWT_SECRET`：随机长字符串
- `EMAIL_USER` / `EMAIL_PASS`：用于发送验证码的 SMTP（示例为 163，可按需改）
- `PORT`：默认 `3030`
- `HOST`：默认 `0.0.0.0`（局域网可访问）；仅本机可改为 `127.0.0.1`

**切勿将 `server/.env` 提交到 Git。**

### 3. 启动服务（两个终端）

```bash
# 终端 A：后端（默认 http://127.0.0.1:3030）
cd server
npm run dev

# 终端 B：前端（默认 http://localhost:3000，base 为 /resume/）
cd ..
npm run dev
```

浏览器访问：

- 站点根路径：`http://localhost:3000/resume/`
- 编辑器：`http://localhost:3000/resume/editor`

Vite 已将 `/api` 与 `/r/` 代理到本机 `3030`，与生产环境 Nginx 行为一致。

### 4. 可选：前端环境变量

若 API 与前端不同源，可在根目录配置 `.env`（或构建时注入）：

- `VITE_PUBLISH_API_BASE`：发布/登录等接口根地址（不含末尾 `/`）。**同域部署可留空**。

## 构建与预览

```bash
npm run build
npm run preview
```

产物在 `dist/`，需按 `base: '/resume/'` 部署到子路径（如 `https://example.com/resume/`）。

## 生产部署要点

- 静态资源：Nginx（或其它 Web 服务器）托管 `dist/`，`location /resume/` 回退到 `index.html`
- 反代：`/api`、`/r/` 到 Node 服务（默认 `127.0.0.1:3030`）
- 确保 `/api/auth/`、`/api/resume/`、`/api/feedback` 等均指向同一后端，避免与其它项目的 `location /api` 冲突

## 许可证

私有项目或未声明时，默认保留所有权利；如需开源请自行补充 `LICENSE`。

## 作者

维护者可根据实际情况在下方补充链接或联系方式。

---

*README 随仓库演进，若接口或目录有变更请同步更新本文。*
