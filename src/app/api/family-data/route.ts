import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'config', 'family-data.json');

    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ generations: [] });
    }

    const fileContent = fs.readFileSync(configPath, 'utf8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading family data:', error);
    return NextResponse.json(
      { error: 'Failed to load family data' },
      { status: 500 }
    );
  }
}
