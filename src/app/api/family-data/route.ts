import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const revalidate = 3600; // 每小时重新验证

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'config', 'family-data.json');

    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ generations: [] });
    }

    const fileContent = fs.readFileSync(configPath, 'utf8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error loading family data:', error);
    return NextResponse.json(
      { error: 'Failed to load family data' },
      { status: 500 }
    );
  }
}
