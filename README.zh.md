# 族谱 (Family Tree)

[English](./README.md) | 中文

基于 [Next.js](https://nextjs.org) 开发的家族谱展示项目，用于展示和管理家族历史与成员关系。

## 功能特点

- 多代家族成员的可视化展示
- 列表视图和树状视图切换
- 按姓名、简介、世代、年份范围搜索
- 响应式设计，支持手机访问
- 完全可定制的家族数据

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
- [Tailwind CSS](https://tailwindcss.com) - 样式
- [ReactFlow](https://reactflow.dev) - 树状可视化

## 项目结构

```
├── config/
│   ├── family-data.json          # 家族数据
│   └── family-data.example.json  # 数据模板
├── public/                       # 静态资源
├── src/
│   ├── app/
│   │   ├── api/                  # API 路由
│   │   ├── components/           # React 组件
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── data/                     # 数据钩子
│   ├── types/                    # TypeScript 类型
│   └── utils/                    # 工具函数
├── .env.local.example            # 环境变量模板
├── next.config.ts                # Next.js 配置
└── package.json
```

## 许可

MIT
