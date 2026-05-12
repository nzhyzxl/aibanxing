# 爱伴行 / AiBanXing — Claude Code 项目说明

## 项目是什么

爱伴行是一个基于**可溯源信任链**的手工艺人展示平台。

核心理念：每位匠人都必须由平台内已有成员邀请并背书才能加入。访客可以在每位匠人的主页上看到完整的信任来源（谁邀请了他、邀请人写了什么背书），信任链永久可溯。

平台不做线上支付，成交发生在私域（微信）。匠人主页展示微信二维码，访客长按扫码加微信后在私域完成交易。

**这不是电商平台，是信任背书展示平台。**

---

## 技术栈

| 模块 | 技术 |
|------|------|
| 前台框架 | Next.js 14（App Router） |
| 后台UI | Ant Design 5.x |
| 数据库 | Supabase（PostgreSQL） |
| 图片存储 | 阿里云 OSS |
| 部署 | Vercel |
| 国际化 | next-intl（zh / en） |
| 微信分享 | weixin-js-sdk |
| 样式 | Tailwind CSS |
| 图片压缩 | browser-image-compression |
| 图片裁剪 | react-image-crop |

---

## 项目结构

```
app/
├── [locale]/          # 前台（中英文路由）
│   ├── page.tsx       # 首页（产品瀑布流）
│   ├── artisans/
│   │   ├── page.tsx   # 匠人列表页
│   │   └── [id]/      # 匠人主页
│   ├── about/         # 关于页
│   └── layout.tsx     # 前台布局
├── admin/             # 后台（无国际化）
│   ├── login/         # 登录
│   ├── dashboard/     # 控制台
│   ├── artisans/      # 匠人管理
│   ├── invitations/   # 邀请审核
│   ├── products/      # 产品管理
│   └── profile/       # 手艺人自助页
└── api/
    ├── upload/        # 图片上传到OSS
    └── wechat/        # 微信JS-SDK签名

components/
├── frontend/          # 前台组件
└── admin/             # 后台组件

lib/
├── supabase.ts        # Supabase客户端
├── oss.ts             # 阿里云OSS
└── wechat.ts          # 微信工具函数

messages/
├── zh.json            # 中文文案
└── en.json            # 英文文案

supabase/migrations/
└── 001_init.sql       # 建表SQL（在Supabase SQL Editor里执行）
```

---

## 数据库表结构

### users（匠人/管理员账号）
- `id` uuid PK
- `email` text unique
- `role` text — `admin` | `artisan`
- `name` / `name_en` — 姓名（中/英）
- `avatar_url` — OSS头像URL
- `bio` / `bio_en` — 一句话介绍
- `city` / `city_en`
- `category` — ceramics | leather | textile | food | handcraft | service
- `wechat_qr_url` — 微信二维码图片URL（OSS）
- `shipping_address`
- `status` — `active` | `suspended`（suspended时所有产品自动下架）
- `invited_by` — 邀请人ID（FK → users.id）

### endorsements（信任链背书）
- `artisan_id` — 被背书的匠人
- `endorser_id` — 写背书的人
- `content` / `content_en` — 背书文字
- `relationship` — 关系描述，如「相识5年」

### products（产品/作品）
- `artisan_id` FK
- `name` / `name_en`
- `description` / `description_en`
- `price` numeric — null表示「询价」
- `images` text[] — OSS URL数组，最多6张
- `category`
- `is_published` boolean
- `sort_order` integer — 手动排序权重

### invitations（邀请审核）
- `inviter_id` — 邀请人
- `invitee_name` / `invitee_email`
- `endorsement` — 邀请人写的背书
- `status` — pending | approved | rejected

---

## 视觉设计规范

**配色**
- 页面背景：`#FDFAF5`（暖奶白）
- 主色调（按钮/标签）：`#F5A623`（琥珀橙）
- 正文：`#2C2420`（暖炭色）
- 次要文字：`#9E9189`（暖灰）

**初心价标签**：所有产品价格前必须显示橙色 pill badge，文字「初心价」，background `#F5A623`，color white

**信任链**：匠人主页的信任链是视觉主角，展示谁邀请了他 + 背书文字，支持多层溯源

**字体**：标题用 Lora 或 Playfair Display（serif），正文用 DM Sans

---

## 关键业务规则

1. **只有受邀才能加入**：新匠人必须由现有成员邀请，邀请人必须写背书
2. **禁用逻辑**：管理员禁用某匠人账号后，该账号下所有产品自动下架，前台不可见、不可检索
3. **无线上支付**：所有成交在微信私域完成，平台只做展示和引流
4. **初心价**：平台专属价格，不与市场价对比显示，只显示初心价
5. **分享追踪**：每个匠人主页分享链接携带 `?ref=用户ID`，追踪分享来源

---

## 环境变量

开发时复制 `.env.example` 为 `.env.local` 并填入真实值：

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OSS_REGION=
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET=
OSS_CDN_DOMAIN=
NEXT_PUBLIC_WECHAT_APP_ID=
WECHAT_APP_SECRET=
ADMIN_SECRET=
```

---

## 本地开发

```bash
npm install
cp .env.example .env.local
# 填入环境变量
npm run dev
# 访问 http://localhost:3000（前台）
# 访问 http://localhost:3000/admin/login（后台）
```

---

## 当前 MVP 进度

- [x] 产品设计文档
- [x] 技术设计文档
- [x] 项目基础架构代码
- [ ] 前台页面开发
- [ ] 后台管理开发
- [ ] Supabase 数据库初始化
- [ ] 阿里云 OSS 配置
- [ ] 微信 JS-SDK 接入
- [ ] Vercel 部署上线

---

## 开发约定

- 组件用函数式组件 + TypeScript
- 数据获取在 Server Component 层完成（Next.js App Router）
- 客户端交互组件加 `'use client'` 指令
- 所有文案通过 `next-intl` 的 `useTranslations` hook 获取，不要硬编码中文
- 图片上传统一走 `/api/upload`，不要在客户端直接调用 OSS
- 微信签名统一走 `/api/wechat`，AppSecret 只在服务端使用
- Tailwind 类名按：布局 → 尺寸 → 颜色 → 状态 的顺序排列
