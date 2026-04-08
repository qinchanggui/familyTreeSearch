import { NextResponse } from 'next/server';
import { getAuthConfigOnServer } from '@/utils/config';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const configType = url.searchParams.get('type');

    const authConfig = await getAuthConfigOnServer();

    // 根据不同的配置类型返回不同的数据
    if (configType === 'auth') {
      const publicConfig = {
        familyName: authConfig.familyName,
      };
      return NextResponse.json(publicConfig);
    } else {
      return NextResponse.json({ error: 'Invalid config type' }, { status: 400 });
    }
  } catch (error) {
    console.error('获取配置时出错:', error);
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
  }
}
