'use client';

import { useState, useEffect } from 'react';
import { FamilyData } from '../types/family';

// 默认空数据（仅供 useFamilyData 内部使用）
const defaultFamilyData: FamilyData = {
  generations: []
};

// 用于在客户端获取家族数据的钩子
export function useFamilyData(): {
  data: FamilyData;
  loading: boolean;
  error: string | null
} {
  const [data, setData] = useState<FamilyData>(defaultFamilyData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const response = await fetch('/api/family-data');

        if (!response.ok) {
          throw new Error(`API返回错误状态: ${response.status}`);
        }

        const fetchedData = await response.json();
        setData(fetchedData);
        setError(null);
      } catch (err) {
        console.error('获取家族数据失败:', err);
        setError('加载家族数据失败，使用默认数据');
        // 出错时使用默认数据
        setData(defaultFamilyData);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}
