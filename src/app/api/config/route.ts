import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    familyName: process.env.NEXT_PUBLIC_FAMILY_NAME || '姓氏'
  });
}
