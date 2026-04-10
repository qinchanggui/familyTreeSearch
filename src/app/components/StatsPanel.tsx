"use client";

import { FamilyData } from '@/types/family';
import { useMemo } from 'react';
import { UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface StatsPanelProps {
    data: FamilyData;
}

export default function StatsPanel({ data }: StatsPanelProps) {
    const stats = useMemo(() => {
        const totalPeople = data.generations.reduce((sum, g) => sum + g.people.length, 0);
        
        // 各代人数
        const genCounts = data.generations.map(g => ({
            title: g.title,
            count: g.people.length,
        }));
        
        // 同名统计
        const nameCount = new Map<string, number>();
        data.generations.forEach(g => {
            g.people.forEach(p => {
                nameCount.set(p.name, (nameCount.get(p.name) || 0) + 1);
            });
        });
        const duplicates = [...nameCount.entries()]
            .filter(([_, count]) => count > 1)
            .sort((a, b) => b[1] - a[1]);
        
        // 有子嗣的人数 vs 无子嗣
        let withChildren = 0;
        let withoutChildren = 0;
        const allIds = new Set<string>();
        data.generations.forEach(g => g.people.forEach(p => allIds.add(p.id)));
        data.generations.forEach(g => {
            g.people.forEach(p => {
                if (p.fatherId) {
                    if (allIds.has(p.fatherId)) {
                        // 不在这里计数，用反向查
                    }
                }
            });
        });
        // 简化：统计作为父亲出现过的ID
        const fatherIds = new Set<string>();
        data.generations.forEach(g => {
            g.people.forEach(p => {
                if (p.fatherId) fatherIds.add(p.fatherId);
            });
        });
        withChildren = [...fatherIds].filter(id => allIds.has(id)).length;
        withoutChildren = totalPeople - withChildren;

        // 最长世系链（从太始祖到二十代的直系最长路径）
        const maxGen = data.generations.length;

        return { totalPeople, genCounts, duplicates, withChildren, withoutChildren, maxGen };
    }, [data]);

    const maxCount = Math.max(...stats.genCounts.map(g => g.count));

    return (
        <div className="p-3 sm:p-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <ChartBarIcon className="h-5 w-5 text-blue-500" />
                <h2 className="text-base sm:text-lg font-bold text-ink dark:text-dark-text">全族概况</h2>
            </div>

            {/* 核心数字 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-card dark:bg-dark-card rounded-xl p-3 sm:p-4 border border-border dark:border-dark-border">
                    <p className="text-2xl sm:text-3xl font-bold text-cinnabar dark:text-dark-cinnabar">{stats.totalPeople}</p>
                    <p className="text-xs text-muted dark:text-dark-muted mt-1">总人数</p>
                </div>
                <div className="bg-card dark:bg-dark-card rounded-xl p-3 sm:p-4 border border-border dark:border-dark-border">
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.maxGen}</p>
                    <p className="text-xs text-muted dark:text-dark-muted mt-1">传承世代</p>
                </div>
                <div className="bg-card dark:bg-dark-card rounded-xl p-3 sm:p-4 border border-border dark:border-dark-border">
                    <p className="text-2xl sm:text-3xl font-bold text-violet-600 dark:text-violet-400">{stats.withChildren}</p>
                    <p className="text-xs text-muted dark:text-dark-muted mt-1">有后嗣</p>
                </div>
                <div className="bg-card dark:bg-dark-card rounded-xl p-3 sm:p-4 border border-border dark:border-dark-border">
                    <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.withoutChildren}</p>
                    <p className="text-xs text-muted dark:text-dark-muted mt-1">无后嗣</p>
                </div>
            </div>

            {/* 各代人数柱状图 */}
            <div className="bg-card dark:bg-dark-card rounded-xl p-4 border border-border dark:border-dark-border mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">各代人数分布</h3>
                <div className="space-y-2">
                    {stats.genCounts.map((g, i) => (
                        <div key={g.title} className="flex items-center gap-2">
                            <span className="text-xs text-muted dark:text-dark-muted w-14 sm:w-16 flex-shrink-0 text-right truncate">{g.title}</span>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 sm:h-6 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                                    style={{ width: `${Math.max(8, (g.count / maxCount) * 100)}%` }}
                                >
                                    <span className="text-[10px] sm:text-xs text-white font-medium">{g.count}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


        </div>
    );
}
