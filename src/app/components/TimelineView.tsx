"use client";

import { useState, useMemo } from 'react';
import { FamilyData, Person } from '@/types/family';
import { UserIcon, ChevronDownIcon, ChevronRightIcon, ClockIcon } from '@heroicons/react/24/outline';

interface TimelineViewProps {
    data: FamilyData;
}

const genColors = [
    '#8B2500', '#A63200', '#7A2000', '#B54000', '#6B1C00',
    '#9B3010', '#853010', '#AB3818', '#702808', '#C04420',
    '#8B3015', '#9A3818', '#7B2810', '#B54525', '#6E2005',
    '#A03518', '#883012', '#B84A28', '#752508', '#9B3E20',
    '#8B2500',
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
        <div className="w-full">
            <div className="bg-card dark:bg-dark-card shadow-sm overflow-hidden">
                <div className="p-3 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <ClockIcon className="h-5 w-5 text-cinnabar" />
                        <h2 className="text-base sm:text-lg font-bold font-serif text-ink dark:text-dark-text">族谱时间线</h2>
                    </div>
            <div>
                {data.generations.map((generation, index) => (
                    <GenBlock key={generation.title} generation={generation} index={index} />
                ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
