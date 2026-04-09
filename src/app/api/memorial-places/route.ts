import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'config', 'memorial-places.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ places: [] });
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading memorial places:', error);
    return NextResponse.json({ error: 'Failed to load memorial places' }, { status: 500 });
  }
}
