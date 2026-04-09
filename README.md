# Family Tree (族谱)

English | [中文](./README.zh.md)

A family tree visualization project built with [Next.js](https://nextjs.org), for displaying and managing family history and member relationships.

## Features

- **5 View Modes**: List, Timeline, Tree, Stats, Memorial
- **21 generations, 325 members** with full genealogy data
- **Search**: By name, info, generation, and year range with cross-generation jump navigation
- **Person Detail**: Dedicated detail page with father/sibling/children navigation
- **Memorial Navigation**: 8 ancestral tomb locations with one-click Amap navigation
- **Timeline View**: Chronological generation display with unique colors
- **Statistics Panel**: Member counts, generation distribution chart
- **Dark Mode**: System preference detection with manual toggle
- **Responsive Design**: Optimized for mobile with compact layout
- **Fully customizable family data**

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

### Add Memorial Places (Optional)

Create `config/memorial-places.json`:

```json
{
  "places": [
    {
      "id": "memorial-1",
      "name": "Location Name",
      "address": "Address",
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
- [Tailwind CSS v4](https://tailwindcss.com) - Styling (CSS-first configuration)
- [ReactFlow](https://reactflow.dev) - Tree visualization
- [Heroicons](https://heroicons.com/) - Icons
- [Amap (高德地图)](https://lbs.amap.com/) - Memorial place navigation

## Project Structure

```
├── config/
│   ├── family-data.json          # Family data (325 members)
│   ├── family-data.example.json  # Data template
│   └── memorial-places.json      # Memorial places (8 locations)
├── public/                       # Static assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── family-data/      # Family data API
│   │   │   ├── config/           # Site config API
│   │   │   └── memorial-places/  # Memorial places API
│   │   ├── components/
│   │   │   ├── FamilyTree.tsx     # List view + search
│   │   │   ├── TreeView.tsx       # Tree view (ReactFlow)
│   │   │   ├── TimelineView.tsx   # Timeline view
│   │   │   ├── StatsPanel.tsx     # Statistics panel
│   │   │   ├── PersonDetail.tsx   # Person detail page
│   │   │   ├── MemorialMap.tsx    # Memorial places + navigation
│   │   │   ├── SearchBar.tsx      # Search component
│   │   │   ├── Footer.tsx         # Footer
│   │   │   └── BackToTop.tsx      # Back to top button
│   │   ├── globals.css            # Global styles (Tailwind v4)
│   │   ├── layout.tsx             # Root layout (dark mode)
│   │   ├── page.tsx               # Main page (view router)
│   │   └── middleware.ts          # Security headers
│   ├── data/                      # Data hooks
│   ├── types/                     # TypeScript types
│   └── utils/                     # Utilities (search, config)
├── vercel.json                   # Vercel config (security headers)
├── .env.local.example            # Environment template
├── next.config.ts                # Next.js config
└── package.json
```

## License

MIT
