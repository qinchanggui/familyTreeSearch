"use client";

import { FamilyData, Person } from '@/types/family';
import { useMemo, useState } from 'react';
import { ArrowLeftIcon, UserIcon, UserGroupIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PersonDetailProps {
    data: FamilyData;
    personId: string;
    onBack: () => void;
    onNavigate: (personId: string) => void;
}

export default function PersonDetail({ data, personId, onBack, onNavigate }: PersonDetailProps) {
    const [showSiblings, setShowSiblings] = useState(false);
    const [showChildren, setShowChildren] = useState(false);

    const { person, generation, father, children, siblings } = useMemo(() => {
        const personMap = new Map<string, { person: Person; genIndex: number }>();
        data.generations.forEach((g, gi) => {
            g.people.forEach(p => {
                if (p.id) personMap.set(p.id, { person: p, genIndex: gi });
            });
        });

        const entry = personMap.get(personId);
        if (!entry) return { person: null, generation: '', father: null, children: [], siblings: [] };

        const { person, genIndex } = entry;
        const generation = data.generations[genIndex]?.title || '';

        // 父亲
        const father = person.fatherId ? personMap.get(person.fatherId)?.person || null : null;

        // 子嗣
        const children = data.generations[genIndex + 1]?.people.filter(p => p.fatherId === personId) || [];

        // 兄弟姐妹
        let siblings: Person[] = [];
        if (person.fatherId) {
            siblings = data.generations[genIndex]?.people.filter(p => p.fatherId === person.fatherId && p.id !== personId) || [];
        }

        return { person, generation, father, children, siblings };
    }, [data, personId]);

    if (!person) {
        return (
            <div className="p-6 text-center text-muted">
                <p>未找到该人物</p>
                <button onClick={onBack} className="mt-4 text-cinnabar underline">返回</button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-3 sm:px-4 pb-8">
            {/* 顶部导航 */}
            <div className="flex items-center gap-3 py-3 sticky top-0 bg-parchment dark:bg-dark-bg z-10">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-lg hover:bg-border dark:hover:bg-dark-border transition-colors"
                >
                    <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-muted" />
                </button>
                <h1 className="text-lg font-bold text-ink dark:text-dark-text truncate">{person.name}</h1>
                <span className="text-xs text-muted ml-auto flex-shrink-0">{generation}</span>
            </div>

            {/* 人物头像区 */}
            <div className="bg-card dark:bg-dark-card rounded-2xl p-6 border border-border dark:border-dark-border mb-4 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-cinnabar-light to-cinnabar-dark rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-ink dark:text-dark-text">{person.name}</h2>
                        <p className="text-sm text-gray-500 dark:text-muted mt-1">{generation}</p>
                    </div>
                </div>
                <p className="text-desc dark:text-dark-desc leading-relaxed">{person.info}</p>
                {(person.birthYear || person.deathYear) && (
                    <div className="mt-4 pt-4 border-t border-border dark:border-dark-border text-sm text-gray-500 dark:text-muted">
                        {person.birthYear && <span>出生: {person.birthYear}</span>}
                        {person.birthYear && person.deathYear && <span> · </span>}
                        {person.deathYear && <span>去世: {person.deathYear}</span>}
                    </div>
                )}
            </div>

            {/* 世系关系 */}
            <div className="bg-card dark:bg-dark-card rounded-2xl border border-border dark:border-dark-border overflow-hidden shadow-sm">
                {/* 父亲 */}
                {father && (
                    <div className="p-4 border-b border-border dark:border-dark-border">
                        <p className="text-xs text-muted mb-2">父亲</p>
                        <button
                            onClick={() => onNavigate(father.id!)}
                            className="flex items-center gap-3 w-full text-left group"
                        >
                            <div className="w-10 h-10 bg-heritage dark:bg-dark-heritage rounded-full flex items-center justify-center flex-shrink-0">
                                <UserIcon className="h-5 w-5 text-cinnabar dark:text-dark-cinnabar" />
                            </div>
                            <span className="flex-1 font-medium text-ink dark:text-dark-text group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {father.name}
                            </span>
                            <ChevronRightIcon className="h-4 w-4 text-border dark:text-dark-border" />
                        </button>
                    </div>
                )}

                {/* 兄弟姐妹 */}
                {siblings.length > 0 && (
                    <div className="p-4 border-b border-border dark:border-dark-border">
                        <button
                            onClick={() => setShowSiblings(!showSiblings)}
                            className="flex items-center justify-between w-full mb-2"
                        >
                            <p className="text-xs text-muted">兄弟姐妹 ({siblings.length})</p>
                            <ChevronRightIcon className={`h-4 w-4 text-muted transition-transform ${showSiblings ? 'rotate-90' : ''}`} />
                        </button>
                        {showSiblings && (
                            <div className="space-y-2">
                                {siblings.map((s, i) => (
                                    <button
                                        key={s.id || i}
                                        onClick={() => onNavigate(s.id!)}
                                        className="flex items-center gap-3 w-full text-left group"
                                    >
                                        <div className="w-10 h-10 bg-heritage-subtle dark:bg-dark-heritage-subtle rounded-full flex items-center justify-center flex-shrink-0">
                                            <UserIcon className="h-5 w-5 text-muted dark:text-dark-muted" />
                                        </div>
                                        <span className="flex-1 font-medium text-ink dark:text-dark-text group-hover:text-blue-600 dark:group-hover:text-blue-400 text-sm">
                                            {s.name}
                                        </span>
                                        <ChevronRightIcon className="h-4 w-4 text-border dark:text-dark-border" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 子嗣 */}
                {children.length > 0 && (
                    <div className="p-4">
                        <button
                            onClick={() => setShowChildren(!showChildren)}
                            className="flex items-center justify-between w-full mb-2"
                        >
                            <p className="text-xs text-muted">子嗣 ({children.length})</p>
                            <ChevronRightIcon className={`h-4 w-4 text-muted transition-transform ${showChildren ? 'rotate-90' : ''}`} />
                        </button>
                        {showChildren && (
                            <div className="space-y-2">
                                {children.map((c, i) => (
                                    <button
                                        key={c.id || i}
                                        onClick={() => onNavigate(c.id!)}
                                        className="flex items-center gap-3 w-full text-left group"
                                    >
                                        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                                            <UserIcon className="h-5 w-5 text-forest dark:text-dark-forest" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium text-ink dark:text-dark-text group-hover:text-blue-600 dark:group-hover:text-blue-400 text-sm block">
                                                {c.name}
                                            </span>
                                            {c.info && (
                                                <span className="text-xs text-muted truncate block">{c.info}</span>
                                            )}
                                        </div>
                                        <ChevronRightIcon className="h-4 w-4 text-border dark:text-dark-border flex-shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 无子嗣 */}
                {!children.length && (
                    <div className="p-4">
                        <p className="text-xs text-muted">无后嗣记录</p>
                    </div>
                )}
            </div>
        </div>
    );
}
