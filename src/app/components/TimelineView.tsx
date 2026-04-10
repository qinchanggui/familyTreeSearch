"use client";

import { useState, useMemo } from 'react';
import { FamilyData, Person } from '@/types/family';
import { UserIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface TimelineViewProps {
    data: FamilyData;
}

const genColors = [
    '#8B2500', '#8B3000', '#8B3B00', '#8B4600', '#8B5100',
    '#8B5C10', '#8B6720', '#8B7230', '#8B7D40', '#8B8850',
    '#9B8840', '#A88730', '#B58620', '#C28510', '#B8860B',
    '#C49520', '#D0A435', '#DCB34A', '#E8C25F', '#F4D174',
    '#F5DEB3',
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
                className="flex items-center gap-3 px-4 py-3 text-white rounded-xl cursor-pointer shadow-sm active:scale-[0.98] transition-transform"
                style={{ background: color }}
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
                <div className="mt-1 ml-2 border-l-2 border-border dark:border-dark-border pl-3 space-y-1.5 pb-2">
                    {generation.people.map((person, i) => (
                        <div
                            key={person.id || i}
                            className="flex items-start gap-2 py-2 px-3 bg-card dark:bg-dark-card rounded-lg shadow-sm"
                        >
                            <div className={`${color} rounded-full p-1 mt-0.5 flex-shrink-0`}>
                                <UserIcon className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-ink dark:text-dark-text text-sm">{person.name}</p>
                                {person.info && (
                                    <p className="text-xs text-muted dark:text-dark-muted mt-0.5 line-clamp-2">{person.info}</p>
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
            <div className="p-6 text-center text-muted text-sm">
                暂无数据
            </div>
        );
    }

    return (
        <div className="p-3 pt-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">族谱时间线</h2>
            </div>
            <div>
                {data.generations.map((generation, index) => (
                    <GenBlock key={generation.title} generation={generation} index={index} />
                ))}
            </div>
        </div>
    );
}
