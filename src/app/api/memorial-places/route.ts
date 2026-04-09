import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const revalidate = 3600;

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'config', 'memorial-places.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ places: [] }, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
      });
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    console.error('Error loading memorial places:', error);
    return NextResponse.json({ error: 'Failed to load memorial places' }, { status: 500 });
  }
}
