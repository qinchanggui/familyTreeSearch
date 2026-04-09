# 族谱 (Family Tree)

[English](./README.md) | 中文

基于 [Next.js](https://nextjs.org) 开发的家族谱展示项目，用于展示和管理家族历史与成员关系。

## 功能特点

- **5种视图模式**：列表、时间线、树状图、统计、祭祖
- **21代325人**完整世系数据
- **智能搜索**：按姓名、简介、世代、年份范围搜索，支持跨世代跳转
- **人物详情**：独立详情页，支持父亲/兄弟姐妹/子嗣连续跳转
- **祭祖导航**：8处先祖墓地，一键高德地图导航
- **时间线视图**：按世代时间轴展示，每代独立配色
- **统计面板**：总人数、世代分布柱状图
- **深色模式**：跟随系统偏好，支持手动切换
- **响应式设计**：移动端优化布局
- **完全可定制的家族数据**

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`：

```env
NEXT_PUBLIC_FAMILY_NAME=覃
PORT=3000
```

### 添加家族数据

在 `config` 目录下创建 `family-data.json`（参考 `config/family-data.example.json`）：

```json
{
  "generations": [
    {
      "title": "第一世",
      "people": [
        {
          "id": "ancestor",
          "name": "始祖",
          "info": "家族创始人",
          "fatherId": "",
          "birthYear": 1850
        }
      ]
    },
    {
      "title": "第二世",
      "people": [
        {
          "id": "son-1",
          "name": "长子",
          "info": "长子，妻王氏",
          "fatherId": "ancestor",
          "birthYear": 1880,
          "deathYear": 1950
        }
      ]
    }
  ]
}
```

**字段说明：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | 是 | 每个人的唯一标识符 |
| `name` | 是 | 姓名 |
| `info` | 否 | 个人描述、生平简介 |
| `fatherId` | 否 | 父亲的ID，建立父子关系 |
| `birthYear` | 否 | 出生年份 |
| `deathYear` | 否 | 逝世年份 |

### 添加祭祖地点（可选）

创建 `config/memorial-places.json`：

```json
{
  "places": [
    {
      "id": "memorial-1",
      "name": "地点名称",
      "address": "详细地址",
      "lng": 109.435643,
      "lat": 22.932513,
      "memorialDay": "",
      "ancestor": "",
      "note": "",
      "photo": ""
    }
  ]
}
```

### 运行

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看族谱。

## 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com/new) 导入仓库
3. 添加环境变量：`NEXT_PUBLIC_FAMILY_NAME`
4. 部署

之后每次推送到 `main` 分支会自动触发部署。

## 利用 AI 生成家族数据

可以使用 AI（ChatGPT、Claude 等）将非结构化的家族信息转换为 JSON 格式。提供以下提示词：

```
请将家族信息整理成以下 JSON 格式：
{
  "generations": [
    {
      "title": "第X世",
      "people": [
        {
          "id": "唯一标识",
          "name": "姓名",
          "info": "详细信息",
          "fatherId": "父亲ID",
          "birthYear": 1900,
          "deathYear": 1980
        }
      ]
    }
  ]
}

要求：
1. 为每个人物生成唯一 id
2. 通过 fatherId 建立父子关系
3. 按世代归类
4. 在 info 中包含配偶等信息
5. 确保生成有效的 JSON
```

## 技术栈

- [Next.js](https://nextjs.org) - React 框架
- [Tailwind CSS v4](https://tailwindcss.com) - 样式（CSS-first 配置）
- [ReactFlow](https://reactflow.dev) - 树状可视化
- [Heroicons](https://heroicons.com/) - 图标库
- [高德地图](https://lbs.amap.com/) - 祭祖地点导航

## 项目结构

```
├── config/
│   ├── family-data.json          # 家族数据（325人）
│   ├── family-data.example.json  # 数据模板
│   └── memorial-places.json      # 祭祖地点（8处）
├── public/                       # 静态资源
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── family-data/      # 家族数据 API
│   │   │   ├── config/           # 站点配置 API
│   │   │   └── memorial-places/  # 祭祖地点 API
│   │   ├── components/
│   │   │   ├── FamilyTree.tsx     # 列表视图 + 搜索
│   │   │   ├── TreeView.tsx       # 树状视图（ReactFlow）
│   │   │   ├── TimelineView.tsx   # 时间线视图
│   │   │   ├── StatsPanel.tsx     # 统计面板
│   │   │   ├── PersonDetail.tsx   # 人物详情页
│   │   │   ├── MemorialMap.tsx    # 祭祖地点 + 导航
│   │   │   ├── SearchBar.tsx      # 搜索组件
│   │   │   ├── Footer.tsx         # 页脚
│   │   │   └── BackToTop.tsx      # 回到顶部按钮
│   │   ├── globals.css            # 全局样式（Tailwind v4）
│   │   ├── layout.tsx             # 根布局（深色模式）
│   │   ├── page.tsx               # 主页面（视图路由）
│   │   └── middleware.ts          # 安全头
│   ├── data/                      # 数据钩子
│   ├── types/                     # TypeScript 类型
│   └── utils/                     # 工具函数（搜索、配置）
├── vercel.json                   # Vercel 配置（安全头）
├── .env.local.example            # 环境变量模板
├── next.config.ts                # Next.js 配置
└── package.json
```

## 许可

MIT
