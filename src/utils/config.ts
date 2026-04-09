import { FamilyData } from '../types/family';

const defaultFamilyData: FamilyData = {
  generations: []
};

export async function getFamilyDataOnServer(): Promise<FamilyData> {
  try {
    const fs = await import('fs').then(m => m.default);
    const path = await import('path').then(m => m.default);
    const filePath = path.join(process.cwd(), 'config', 'family-data.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) as FamilyData;
    }
  } catch (error) {
    console.warn('Error loading family-data.json:', error);
  }
  return defaultFamilyData;
}

export function getFamilyFullName(): string {
  const familyName = process.env.NEXT_PUBLIC_FAMILY_NAME || '姓氏';
  return `${familyName}氏`;
}
