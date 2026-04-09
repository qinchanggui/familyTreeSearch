"use client";

import { useState, useMemo } from 'react';
import { FamilyData, Person } from '@/types/family';
import { UserIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface TimelineViewProps {
    data: FamilyData;
}

const genColors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-amber-500', 'bg-indigo-500',
    'bg-teal-500', 'bg-rose-500', 'bg-blue-600', 'bg-emerald-600',
    'bg-violet-600', 'bg-orange-600', 'bg-pink-600', 'bg-cyan-600',
    'bg-amber-600', 'bg-indigo-600', 'bg-teal-600', 'bg-rose-600',
];

interface GenBlockProps {
    generation: { title: string; people: Person[] };
    index: number;
}

function GenBlock({ generation, index }: GenBlockProps) {
    const [expanded, setExpanded] = useState(false);
    const color = genColors[index % genColors.length];

    return (
        <div className="mb-2">
            <div
                className={`flex items-center gap-3 px-4 py-3 ${color} text-white rounded-xl cursor-pointer shadow-sm active:scale-[0.98] transition-transform`}
                onClick={() => setExpanded(!expanded)}
            >
                <span className="text-base font-bold">{generation.title}</span>
                <span className="text-xs opacity-80 bg-white/20 px-2 py-0.5 rounded-full">
                    {generation.people.length}人
                </span>
                <span className="ml-auto">
                    {expanded
                        ? <ChevronDownIcon className="h-5 w-5" />
                        : <ChevronRightIcon className="h-5 w-5" />}
                </span>
            </div>
            {expanded && (
                <div className="mt-1 ml-2 border-l-2 border-gray-200 pl-3 space-y-1.5 pb-2">
                    {generation.people.map((person, i) => (
                        <div
                            key={person.id || i}
                            className="flex items-start gap-2 py-2 px-3 bg-white rounded-lg shadow-sm"
                        >
                            <div className={`${color} rounded-full p-1 mt-0.5 flex-shrink-0`}>
                                <UserIcon className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 text-sm">{person.name}</p>
                                {person.info && (
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{person.info}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function TimelineView({ data }: TimelineViewProps) {
    if (!data.generations.length) {
        return (
            <div className="p-6 text-center text-gray-400 text-sm">
                暂无数据
            </div>
        );
    }

    return (
        <div className="p-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-700">族谱时间线</h2>
                <p className="text-[10px] text-gray-400">点击展开世代</p>
            </div>
            <div>
                {data.generations.map((generation, index) => (
                    <GenBlock key={generation.title} generation={generation} index={index} />
                ))}
            </div>
        </div>
    );
}
