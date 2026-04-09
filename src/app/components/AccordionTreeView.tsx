"use client";

import { useState, useMemo } from 'react';
import { FamilyData, Person } from '@/types/family';
import { ChevronDownIcon, ChevronRightIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface AccordionTreeViewProps {
    data: FamilyData;
}

// 创建子嗣映射
const createSonsMap = (data: FamilyData) => {
    const map = new Map<string, Person[]>();
    data.generations.forEach(generation => {
        generation.people.forEach(person => {
            if (person.id) map.set(person.id, []);
        });
    });
    data.generations.forEach(generation => {
        generation.people.forEach(person => {
            if (person.fatherId && map.has(person.fatherId)) {
                map.get(person.fatherId)!.push(person);
            }
        });
    });
    return map;
};

// 创建人物映射
const createPersonMap = (data: FamilyData) => {
    const map = new Map<string, Person>();
    data.generations.forEach(generation => {
        generation.people.forEach(person => {
            if (person.id) map.set(person.id, person);
        });
    });
    return map;
};

interface TreeNodeProps {
    person: Person;
    personMap: Map<string, Person>;
    sonsMap: Map<string, Person[]>;
    generation: string;
    depth: number;
}

function TreeNode({ person, personMap, sonsMap, generation, depth }: TreeNodeProps) {
    const [expanded, setExpanded] = useState(false);
    const sons = person.id ? sonsMap.get(person.id) || [] : [];
    const father = person.fatherId ? personMap.get(person.fatherId) : undefined;

    const borderColor = [
        'border-l-blue-600', 'border-l-emerald-600', 'border-l-violet-600',
        'border-l-orange-600', 'border-l-pink-600', 'border-l-cyan-600',
        'border-l-amber-600', 'border-l-indigo-600', 'border-l-teal-600',
        'border-l-rose-600',
    ][depth % 10];

    return (
        <div className="ml-2">
            <div
                className={`${borderColor} border-l-3 pl-3 py-2 cursor-pointer hover:bg-gray-50 rounded-r-lg transition-colors`}
                onClick={() => sons.length > 0 && setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {sons.length > 0 && (
                            <span className="text-gray-400 flex-shrink-0">
                                {expanded
                                    ? <ChevronDownIcon className="h-4 w-4" />
                                    : <ChevronRightIcon className="h-4 w-4" />}
                            </span>
                        )}
                        <span className="text-xs text-gray-400 flex-shrink-0">{generation}</span>
                        <span className="font-medium text-gray-800 truncate">{person.name}</span>
                    </div>
                    {sons.length > 0 && (
                        <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                            <UserGroupIcon className="h-3 w-3" />
                            {sons.length}
                        </span>
                    )}
                </div>
                {person.info && expanded && (
                    <p className="text-xs text-gray-500 mt-1 ml-6">{person.info}</p>
                )}
                {!expanded && person.info && (
                    <p className="text-xs text-gray-400 mt-0.5 ml-6 truncate">{person.info}</p>
                )}
                {father && expanded && (
                    <p className="text-xs text-blue-500 mt-1 ml-6">父亲：{father.name}</p>
                )}
            </div>
            {expanded && sons.length > 0 && (
                <div className="mt-0.5">
                    {sons.map((son, index) => {
                        // 查找子嗣所在的世代
                        const sonGen = data_generations_ref.current?.find(g =>
                            g.people.some(p => p.id === son.id)
                        )?.title || '';
                        return (
                            <TreeNode
                                key={son.id || index}
                                person={son}
                                personMap={personMap}
                                sonsMap={sonsMap}
                                generation={sonGen}
                                depth={depth + 1}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// 用于在TreeNode中查找世代
let data_generations_ref: { current: FamilyData['generations'] | null };

export default function AccordionTreeView({ data }: AccordionTreeViewProps) {
    const sonsMap = useMemo(() => createSonsMap(data), [data]);
    const personMap = useMemo(() => createPersonMap(data), [data]);

    // 保存引用供TreeNode使用
    data_generations_ref = { current: data.generations };

    const roots = data.generations[0]?.people || [];

    if (!roots.length) {
        return (
            <div className="p-6 text-center text-gray-400 text-sm">
                暂无数据
            </div>
        );
    }

    return (
        <div className="p-3">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-700">族谱手风琴</h2>
                <p className="text-[10px] text-gray-400">点击展开/折叠</p>
            </div>
            <div className="space-y-0.5">
                {roots.map((person, index) => (
                    <TreeNode
                        key={person.id || index}
                        person={person}
                        personMap={personMap}
                        sonsMap={sonsMap}
                        generation={data.generations[0]?.title || ''}
                        depth={0}
                    />
                ))}
            </div>
        </div>
    );
}
