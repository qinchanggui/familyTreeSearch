"use client";

import { useState, useEffect } from 'react';
import { FamilyData, Person } from '@/types/family';
import { UserIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { escapeHtml, splitHighlightSegments } from '@/utils/search';

interface FamilyTreeProps {
    familyData: FamilyData;
    fullFamilyData?: FamilyData;
    searchTerm?: string;
    searchInInfo?: boolean;
    onPersonClick?: (personId: string) => void;
    onClearSearch?: () => void;
}

// 创建一个映射，用于快速查找人物
const createPersonMap = (data: FamilyData) => {
    const map = new Map<string, Person>();
    data.generations.forEach(generation => {
        generation.people.forEach(person => {
            if (person.id) {
                map.set(person.id, person);
            }
        });
    });
    return map;
};

// 创建一个映射，用于查找一个人的所有儿子
const createSonsMap = (data: FamilyData) => {
    const map = new Map<string, Person[]>();
    
    // 初始化每个人的儿子数组
    data.generations.forEach(generation => {
        generation.people.forEach(person => {
            if (person.id) {
                map.set(person.id, []);
            }
        });
    });
    
    // 根据 fatherId 填充儿子数组（包含所有儿子）
    data.generations.forEach(generation => {
        generation.people.forEach(person => {
            // 任何有fatherId的人都被认为是其父亲的儿子
            if (person.fatherId && map.has(person.fatherId)) {
                const sons = map.get(person.fatherId) || [];
                sons.push(person);
                map.set(person.fatherId, sons);
            }
        });
    });
    
    return map;
};

const PersonCard = ({ 
    person, 
    personMap,
    sonsMap,
    scrollToPerson,
    searchTerm,
    searchInInfo,
    onPersonClick,
    onClearSearch,
}: { 
    person: Person; 
    personMap: Map<string, Person>;
    sonsMap: Map<string, Person[]>;
    scrollToPerson: (personId: string) => void;
    searchTerm?: string;
    searchInInfo?: boolean;
    onPersonClick?: (personId: string) => void;
    onClearSearch?: () => void;
}) => {
    const father = person.fatherId ? personMap.get(person.fatherId) : undefined;
    const sons = person.id ? sonsMap.get(person.id) || [] : [];

    return (
        <div 
            id={`person-${person.id}`} 
            className="group bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-800 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors duration-300">
                        <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3
                        className="text-xl font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 cursor-pointer"
                        onClick={() => {
                            if (onPersonClick && person.id) onPersonClick(person.id);
                        }}
                    >
                        {searchTerm
                            ? splitHighlightSegments(escapeHtml(person.name), searchTerm).map((seg, i) => (
                                seg.isMatch
                                    ? <mark key={i} className="bg-yellow-200 px-1 rounded">{seg.text}</mark>
                                    : <span key={i}>{seg.text}</span>
                            ))
                            : person.name}
                    </h3>
                </div>
                
                {father && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-2">
                        <UserGroupIcon className="h-4 w-4 text-blue-500" />
                        <span>父亲：</span>
                        <button 
                            onClick={() => {
                                if (onClearSearch) onClearSearch();
                                setTimeout(() => {
                                    if (father.id) scrollToPerson(father.id);
                                }, 50);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium"
                        >
                            {father.name}
                        </button>
                    </div>
                )}
                
                {sons.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-2">
                        <UserGroupIcon className="h-4 w-4 text-green-500" />
                        <span>子嗣：</span>
                        {sons.map((son, index) => (
                            <span key={son.id || index}>
                                <button 
                                    onClick={() => {
                                        if (onClearSearch) onClearSearch();
                                        setTimeout(() => {
                                            if (son.id) scrollToPerson(son.id);
                                        }, 50);
                                    }}
                                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:underline font-medium"
                                >
                                    {son.name}
                                </button>
                                {index < sons.length - 1 && <span className="mx-1">、</span>}
                            </span>
                        ))}
                    </div>
                )}
                
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-3 line-clamp-2 sm:line-clamp-3">
                    {(searchTerm && searchInInfo)
                        ? splitHighlightSegments(escapeHtml(person.info), searchTerm).map((seg, i) => (
                            seg.isMatch
                                ? <mark key={i} className="bg-yellow-200 px-1 rounded">{seg.text}</mark>
                                : <span key={i}>{seg.text}</span>
                        ))
                        : person.info}
                </p>
                {(person.birthYear || person.deathYear) && (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                            {person.birthYear}
                            {person.birthYear && person.deathYear && ' - '}
                            {person.deathYear && (person.birthYear ? person.deathYear : ` - ${person.deathYear}`)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const Generation = ({ 
    title, 
    people, 
    personMap,
    sonsMap,
    scrollToPerson,
    searchTerm,
    searchInInfo,
    onPersonClick,
    onClearSearch
}: { 
    title: string; 
    people: Person[]; 
    personMap: Map<string, Person>;
    sonsMap: Map<string, Person[]>;
    scrollToPerson: (personId: string) => void;
    searchTerm?: string;
    searchInInfo?: boolean;
    onPersonClick?: (personId: string) => void;
    onClearSearch?: () => void;
}) => {
    return (
        <div className="mb-10" id={`gen-${title}`}>
            <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {title}
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-50 dark:from-blue-900/30 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {people.map((person, index) => (
                    <PersonCard 
                        key={index} 
                        person={person} 
                        personMap={personMap}
                        sonsMap={sonsMap}
                        scrollToPerson={scrollToPerson}
                        searchTerm={searchTerm}
                        searchInInfo={searchInInfo}
                        onPersonClick={onPersonClick}
                    onClearSearch={onClearSearch}
                    />
                ))}
            </div>
        </div>
    );
};

export default function FamilyTree({ familyData, fullFamilyData, searchTerm, searchInInfo, onPersonClick, onClearSearch }: FamilyTreeProps) {
    const [personMap, setPersonMap] = useState<Map<string, Person>>(new Map());
    const [sonsMap, setSonsMap] = useState<Map<string, Person[]>>(new Map());
    
    useEffect(() => {
        // 搜索模式下，personMap和sonsMap需要基于全量数据构建
        if (fullFamilyData) {
            setPersonMap(createPersonMap(fullFamilyData));
            setSonsMap(createSonsMap(fullFamilyData));
        } else {
            setPersonMap(createPersonMap(familyData));
            setSonsMap(createSonsMap(familyData));
        }
    }, [familyData]);
    
    const scrollToPerson = (personId: string) => {
        const element = document.getElementById(`person-${personId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // 添加一个临时高亮效果
            element.classList.add('ring-2', 'ring-blue-500');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-blue-500');
            }, 2000);
        }
    };
    
    return (
        <div className="max-w-7xl mx-auto px-4">
            {familyData.generations.map((generation, index) => (
                <Generation
                    key={index}
                    title={generation.title}
                    people={generation.people}
                    personMap={personMap}
                    sonsMap={sonsMap}
                    scrollToPerson={scrollToPerson}
                    searchTerm={searchTerm}
                    searchInInfo={searchInInfo}
                    onPersonClick={onPersonClick}
                />
            ))}
        </div>
    );
} 