# Family Tree (族谱)

English | [中文](./README.zh.md)

A family tree visualization project built with [Next.js](https://nextjs.org), for displaying and managing family history and member relationships.

## Features

- Visual representation of multiple generations of family members
- List view and tree view switching
- Search by name, info, generation, and year range
- Responsive design, works on mobile
- Fully customizable family data

## Quick Start

### Install Dependencies

```bash
npm install
```

### Configure

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_FAMILY_NAME=覃
PORT=3000
```

### Add Family Data

Create `config/family-data.json` (refer to `config/family-data.example.json`):

```json
{
  "generations": [
    {
      "title": "First Generation",
      "people": [
        {
          "id": "ancestor",
          "name": "Ancestor",
          "info": "Family founder",
          "fatherId": "",
          "birthYear": 1850
        }
      ]
    },
    {
      "title": "Second Generation",
      "people": [
        {
          "id": "son-1",
          "name": "First Son",
          "info": "Eldest son",
          "fatherId": "ancestor",
          "birthYear": 1880,
          "deathYear": 1950
        }
      ]
    }
  ]
}
```

**Field descriptions:**

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier for each person |
| `name` | Yes | Name |
| `info` | No | Personal description, life summary |
| `fatherId` | No | Father's ID, for establishing parent-child relationships |
| `birthYear` | No | Birth year |
| `deathYear` | No | Death year |

### Run

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view your family tree.

## Deploy to Vercel

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com/new) and import the repository
3. Add environment variable: `NEXT_PUBLIC_FAMILY_NAME`
4. Deploy

Every push to `main` branch will automatically trigger a new deployment.

## Using AI to Generate Family Data

You can use AI (ChatGPT, Claude, etc.) to convert unstructured family information into JSON format. Provide this prompt:

```
Please organize the family information into the following JSON format:
{
  "generations": [
    {
      "title": "Xth Generation",
      "people": [
        {
          "id": "unique-id",
          "name": "Name",
          "info": "Details",
          "fatherId": "Father ID",
          "birthYear": 1900,
          "deathYear": 1980
        }
      ]
    }
  ]
}

Requirements:
1. Generate unique id for each person
2. Set fatherId to establish parent-child relationships
3. Group by generation
4. Include spouse info in the info field
5. Ensure valid JSON
```

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [ReactFlow](https://reactflow.dev) - Tree visualization

## Project Structure

```
├── config/
│   ├── family-data.json          # Family data
│   └── family-data.example.json  # Data template
├── public/                       # Static assets
├── src/
│   ├── app/
│   │   ├── api/                  # API routes
│   │   ├── components/           # React components
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── data/                     # Data hooks
│   ├── types/                    # TypeScript types
│   └── utils/                    # Utilities
├── .env.local.example            # Environment template
├── next.config.ts                # Next.js config
└── package.json
```

## License

MIT
