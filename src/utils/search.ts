import { Person, Generation, FamilyData } from '@/types/family';
import { SearchFilters } from '@/app/components/SearchBar';

export interface SearchResult {
    person: Person;
    generation: string;
    matchType: 'name' | 'info' | 'year' | 'id';
    matchText?: string;
}

// 简单的模糊匹配函数
function fuzzyMatch(text: string, searchTerm: string): boolean {
    if (!text || !searchTerm) return false;
    
    const normalizedText = text.toLowerCase();
    const normalizedSearchTerm = searchTerm.toLowerCase();
    
    // 完全匹配
    if (normalizedText.includes(normalizedSearchTerm)) {
        return true;
    }
    
    // 拆分搜索词进行部分匹配
    const searchWords = normalizedSearchTerm.split(/\s+/);
    return searchWords.every(word => normalizedText.includes(word));
}

// 检查年份是否在范围内
function isYearInRange(year: number | undefined, start?: number, end?: number): boolean {
    if (!year) return false;
    if (start && year < start) return false;
    if (end && year > end) return false;
    return true;
}

// 检查人员是否匹配搜索条件
function matchesPerson(person: Person, searchTerm: string, filters: SearchFilters): SearchResult | null {
    const { searchInInfo } = filters;
    
    if (!searchTerm) {
        return {
            person,
            generation: '',
            matchType: 'name'
        };
    }
    
    // 姓名匹配
    if (fuzzyMatch(person.name, searchTerm)) {
        return {
            person,
            generation: '',
            matchType: 'name',
            matchText: person.name
        };
    }
    
    // ID匹配（用于精确查找）
    if (person.id && person.id.toLowerCase().includes(searchTerm.toLowerCase())) {
        return {
            person,
            generation: '',
            matchType: 'id',
            matchText: person.id
        };
    }
    
    // 个人信息匹配
    if (searchInInfo && person.info && fuzzyMatch(person.info, searchTerm)) {
        // 找到匹配的片段
        const lowerInfo = person.info.toLowerCase();
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matchIndex = lowerInfo.indexOf(lowerSearchTerm);
        
        let matchText = person.info;
        if (matchIndex !== -1) {
            const start = Math.max(0, matchIndex - 20);
            const end = Math.min(person.info.length, matchIndex + searchTerm.length + 20);
            matchText = (start > 0 ? '...' : '') + 
                       person.info.substring(start, end) + 
                       (end < person.info.length ? '...' : '');
        }
        
        return {
            person,
            generation: '',
            matchType: 'info',
            matchText
        };
    }
    
    // 年份文本匹配
    if (person.birthYear && searchTerm.includes(person.birthYear.toString())) {
        return {
            person,
            generation: '',
            matchType: 'year',
            matchText: person.birthYear.toString()
        };
    }
    
    if (person.deathYear && searchTerm.includes(person.deathYear.toString())) {
        return {
            person,
            generation: '',
            matchType: 'year',
            matchText: person.deathYear.toString()
        };
    }
    
    return null;
}

// 主搜索函数
export function searchFamilyData(familyData: FamilyData, searchTerm: string, filters: SearchFilters): SearchResult[] {
    const results: SearchResult[] = [];
    
    familyData.generations.forEach(generation => {
        // 如果指定了世代过滤，检查当前世代是否被选中
        if (filters.selectedGenerations.length > 0 && 
            !filters.selectedGenerations.includes(generation.title)) {
            return;
        }
        
        generation.people.forEach(person => {
            const match = matchesPerson(person, searchTerm, filters);
            if (match) {
                match.generation = generation.title;
                results.push(match);
            }
        });
    });
    
    // 按匹配类型排序：姓名 > ID > 年份 > 信息
    const matchTypePriority = { 'name': 1, 'id': 2, 'year': 3, 'info': 4 };
    results.sort((a, b) => {
        const aPriority = matchTypePriority[a.matchType];
        const bPriority = matchTypePriority[b.matchType];
        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }
        // 同类型按姓名排序
        return a.person.name.localeCompare(b.person.name, 'zh-CN');
    });
    
    return results;
}

// 转义 HTML 实体，防止 XSS
export function escapeHtml(text: string): string {
    if (!text) return text;
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 将文本拆分为匹配和非匹配片段（安全，不使用 dangerouslySetInnerHTML）
export interface TextSegment {
    text: string;
    isMatch: boolean;
}

export function splitHighlightSegments(text: string, searchTerm: string): TextSegment[] {
    if (!text || !searchTerm) return [{ text: text || '', isMatch: false }];
    
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const segments: TextSegment[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ text: text.slice(lastIndex, match.index), isMatch: false });
        }
        segments.push({ text: match[1], isMatch: true });
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        segments.push({ text: text.slice(lastIndex), isMatch: false });
    }
    
    return segments.length > 0 ? segments : [{ text, isMatch: false }];
}

// 创建搜索结果的过滤后家族数据
export function createFilteredFamilyData(familyData: FamilyData, searchResults: SearchResult[]): FamilyData {
    if (searchResults.length === 0) {
        return { generations: [] };
    }
    
    // 收集所有匹配人物的 ID
    const matchedIds = new Set(searchResults.map(r => r.person.id).filter(Boolean));
    
    // 收集需要显示的人物 ID（匹配人物 + 其父亲和子嗣）
    const displayIds = new Set<string>();
    const allPeopleMap = new Map<string, { person: Person; generation: string }>();
    
    // 建立全量人物索引
    familyData.generations.forEach(generation => {
        generation.people.forEach(person => {
            if (person.id) {
                allPeopleMap.set(person.id, { person, generation: generation.title });
            }
        });
    });
    
    // 添加匹配人物及其父亲和子嗣
    matchedIds.forEach(id => {
        displayIds.add(id);
        const entry = allPeopleMap.get(id);
        if (entry) {
            // 添加父亲
            if (entry.person.fatherId) {
                displayIds.add(entry.person.fatherId);
            }
            // 添加子嗣（通过遍历全量数据查找 children）
            allPeopleMap.forEach((p) => {
                if (p.person.fatherId === id) {
                    displayIds.add(p.person.id!);
                }
            });
        }
    });
    
    // 按世代分组
    const generationMap = new Map<string, Person[]>();
    
    displayIds.forEach(id => {
        const entry = allPeopleMap.get(id);
        if (entry) {
            if (!generationMap.has(entry.generation)) {
                generationMap.set(entry.generation, []);
            }
            generationMap.get(entry.generation)!.push(entry.person);
        }
    });
    
    // 创建过滤后的世代数据
    const filteredGenerations: Generation[] = [];
    
    // 保持原始世代顺序
    familyData.generations.forEach(originalGeneration => {
        if (generationMap.has(originalGeneration.title)) {
            filteredGenerations.push({
                title: originalGeneration.title,
                people: generationMap.get(originalGeneration.title)!
            });
        }
    });
    
    return { generations: filteredGenerations };
}