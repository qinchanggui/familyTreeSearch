"use client";

import { useState, useEffect } from 'react';
import { FamilyData, Person } from '@/types/family';
import { UserIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { escapeHtml, splitHighlightSegments } from '@/utils/search';

interface FamilyTreeProps {
    familyData: FamilyData;
    fullFamilyData?: FamilyData;
    searchTerm?: string;
    onPersonClick?: (personId: string) => void;
    matchedIds?: Set<string>;
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
    onPersonClick,
    matchedIds,
}: { 
    person: Person; 
    personMap: Map<string, Person>;
    sonsMap: Map<string, Person[]>;
    scrollToPerson: (personId: string) => void;
    searchTerm?: string;
    onPersonClick?: (personId: string) => void;
    matchedIds?: Set<string>;
}) => {
    const father = person.fatherId ? personMap.get(person.fatherId) : undefined;
    const sons = person.id ? sonsMap.get(person.id) || [] : [];
    const isRelated = searchTerm && matchedIds && person.id && !matchedIds.has(person.id);

    return (
        <div 
            id={`person-${person.id}`} 
            className={`group bg-card dark:bg-dark-card p-4 sm:p-6 rounded-xl shadow-sm border card-heritage ${isRelated ? 'border-l-4 border-l-gold-light dark:border-l-dark-gold border-t-border dark:border-t-dark-border border-r-border dark:border-r-dark-border border-b-border dark:border-b-dark-border' : 'border-border dark:border-dark-border hover:border-gold-light dark:hover:border-dark-gold'} relative overflow-hidden`}
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-heritage rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${isRelated ? 'bg-heritage-subtle dark:bg-dark-heritage-subtle group-hover:bg-border dark:group-hover:bg-dark-border' : 'bg-heritage dark:bg-dark-heritage group-hover:bg-heritage-hover'} transition-colors duration-300`}>
                        <UserIcon className={`h-5 w-5 ${isRelated ? 'text-gold-warm dark:text-dark-gold-warm' : 'text-cinnabar dark:text-dark-cinnabar'}`} />
                    </div>
                    {isRelated && <span className="text-[10px] text-gold dark:text-dark-gold bg-heritage-subtle dark:bg-dark-heritage-subtle px-1.5 py-0.5 rounded">关联</span>}
                    <h3
                        className="text-xl font-semibold text-ink dark:text-dark-text group-hover:text-cinnabar dark:group-hover:text-dark-cinnabar transition-colors duration-300 cursor-pointer"
                        onClick={() => {
                            if (onPersonClick && person.id) onPersonClick(person.id);
                        }}
                    >
                        {searchTerm
                            ? splitHighlightSegments(escapeHtml(person.name), searchTerm).map((seg, i) => (
                                seg.isMatch
                                    ? <mark key={i} className="bg-gold-highlight px-1 rounded">{seg.text}</mark>
                                    : <span key={i}>{seg.text}</span>
                            ))
                            : person.name}
                    </h3>
                </div>
                
                {father && (
                    <div className="flex items-center gap-2 text-muted text-sm mb-2">
                        <UserGroupIcon className="h-4 w-4 text-cinnabar" />
                        <span>父亲：</span>
                        <button 
                            onClick={() => {
                                if (father.id) scrollToPerson(father.id);
                            }}
                            className="text-cinnabar dark:text-dark-cinnabar hover:underline font-medium"
                        >
                            {father.name}
                        </button>
                    </div>
                )}
                
                {sons.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-muted text-sm mb-2">
                        <UserGroupIcon className="h-4 w-4 text-forest" />
                        <span>子嗣：</span>
                        {sons.map((son, index) => (
                            <span key={son.id || index}>
                                <button 
                                    onClick={() => {
                                        if (son.id) scrollToPerson(son.id);
                                    }}
                                    className="text-forest dark:text-dark-forest hover:underline font-medium"
                                >
                                    {son.name}
                                </button>
                                {index < sons.length - 1 && <span className="mx-1">、</span>}
                            </span>
                        ))}
                    </div>
                )}
                
                <p className="text-desc dark:text-dark-desc text-sm leading-relaxed mb-3 line-clamp-2 sm:line-clamp-3">
                    {(searchTerm)
                        ? splitHighlightSegments(escapeHtml(person.info), searchTerm).map((seg, i) => (
                            seg.isMatch
                                ? <mark key={i} className="bg-gold-highlight px-1 rounded">{seg.text}</mark>
                                : <span key={i}>{seg.text}</span>
                        ))
                        : person.info}
                </p>
                {(person.birthYear || person.deathYear) && (
                    <div className="flex items-center gap-2 text-muted dark:text-dark-muted text-sm mt-4 pt-4 border-t border-border dark:border-dark-border">
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
    onPersonClick,
    matchedIds
}: { 
    title: string; 
    people: Person[]; 
    personMap: Map<string, Person>;
    sonsMap: Map<string, Person[]>;
    scrollToPerson: (personId: string) => void;
    searchTerm?: string;
    onPersonClick?: (personId: string) => void;
    matchedIds?: Set<string>;
}) => {
    return (
        <div className="mb-10" id={`gen-${title}`}>
            <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-bold font-serif text-cinnabar dark:text-dark-cinnabar">
                    {title}
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gold to-transparent dark:from-dark-gold"></div>
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
                            onPersonClick={onPersonClick}
                        matchedIds={matchedIds}
                    />
                ))}
            </div>
        </div>
    );
};

export default function FamilyTree({ familyData, fullFamilyData, searchTerm, onPersonClick, matchedIds }: FamilyTreeProps) {
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
    }, [familyData, fullFamilyData]);
    
    const scrollToPerson = (personId: string) => {
        const element = document.getElementById(`person-${personId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // 添加一个临时高亮效果
            element.classList.add('ring-2'); element.style.boxShadow = '0 0 0 2px #B8860B';
            setTimeout(() => {
                element.classList.remove('ring-2'); element.style.boxShadow = '';
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
                    onPersonClick={onPersonClick}
                />
            ))}
        </div>
    );
} 