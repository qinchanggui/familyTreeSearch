import { FamilyData, Person } from '@/types/family';

// 构建家族树的核心算法
export function buildFamilyTree(familyData: FamilyData): FamilyData {
  if (!familyData.generations.length) {
    return {
      generations: [
        {
          title: "家族树",
          people: []
        }
      ]
    };
  }

  try {
    // 创建一个映射，用于快速查找人物 - O(n) 时间复杂度
    const personMap = new Map<string, Person & { children: Person[] }>();
    
    // 首先将所有人物添加到映射中
    familyData.generations.forEach(generation => {
      generation.people.forEach(person => {
        if (person.id) {
          personMap.set(person.id, { ...person, children: [] });
        }
      });
    });
    
    // 根据 fatherId 建立父子关系 - O(n) 时间复杂度
    familyData.generations.forEach(generation => {
      generation.people.forEach(person => {
        if (person.fatherId && personMap.has(person.fatherId)) {
          const father = personMap.get(person.fatherId);
          const child = personMap.get(person.id!);
          if (father && child) {
            father.children.push(child);
          }
        }
      });
    });
    
    // 找到第一代人物（没有 fatherId 的人）
    const rootPeople: Person[] = [];
    if (familyData.generations[0]) {
      familyData.generations[0].people.forEach(person => {
        const personWithChildren = personMap.get(person.id!);
        if (personWithChildren) {
          rootPeople.push(personWithChildren);
        }
      });
    }
    
    return {
      generations: [
        {
          title: "家族树",
          people: rootPeople
        }
      ]
    };
  } catch (error) {
    console.error('构建树状结构出错:', error);
    // 返回空的安全结构
    return {
      generations: [
        {
          title: "家族树",
          people: []
        }
      ]
    };
  }
}

