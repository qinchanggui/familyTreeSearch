"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { UI_CONFIG, ANIMATION_DELAYS } from '@/utils/constants';

interface SearchBarProps {
    onSearch: (searchTerm: string, filters: SearchFilters) => void;
    generations: string[];
}

export interface SearchFilters {
    searchTerm: string;
    searchInInfo: boolean;
    selectedGenerations: string[];
    yearRange: {
        start?: number;
        end?: number;
    };
}

export default function SearchBar({ onSearch, generations }: SearchBarProps) {
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        searchTerm: '',
        searchInInfo: true,
        selectedGenerations: [],
        yearRange: {}
    });
    
    const filtersPanelRef = useRef<HTMLDivElement>(null);

    // 使用useCallback优化函数
    const handleSearch = useCallback((newSearchTerm?: string, newFilters?: Partial<SearchFilters>) => {
        const currentSearchTerm = newSearchTerm !== undefined ? newSearchTerm : searchTerm;
        const currentFilters = { ...filters, ...newFilters, searchTerm: currentSearchTerm };
        setFilters(currentFilters);
        onSearch(currentSearchTerm, currentFilters);
    }, [searchTerm, filters, onSearch]);

    const debouncedSearch = useCallback((value: string) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            handleSearch(value);
        }, ANIMATION_DELAYS.SEARCH_DEBOUNCE);
    }, [handleSearch]);

    const clearSearch = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        setSearchTerm('');
        const clearedFilters = {
            searchTerm: '',
            searchInInfo: true,
            selectedGenerations: [],
            yearRange: {}
        };
        setFilters(clearedFilters);
        setShowFilters(false);
        onSearch('', clearedFilters);
    }, [onSearch]);

    const toggleGeneration = useCallback((generation: string) => {
        const newSelectedGenerations = filters.selectedGenerations.includes(generation)
            ? filters.selectedGenerations.filter(g => g !== generation)
            : [...filters.selectedGenerations, generation];
        
        handleSearch(undefined, { selectedGenerations: newSelectedGenerations });
    }, [filters.selectedGenerations, handleSearch]);

    // 使用useMemo缓存计算结果
    const hasActiveFilters = useMemo(() => 
        filters.selectedGenerations.length > 0 || 
        Boolean(filters.yearRange.start) || 
        Boolean(filters.yearRange.end) || 
        !filters.searchInInfo
    , [filters]);

    // 点击外部关闭筛选面板
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filtersPanelRef.current && !filtersPanelRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
        };

        if (showFilters) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilters]);

    return (
        <div className="relative flex items-center" ref={filtersPanelRef}>
            {/* 与按钮组统一风格的搜索框 */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gold" />
                </div>
                <input
                    type="text"
                    className={`${UI_CONFIG.SEARCH_INPUT_WIDTH} pl-9 pr-8 py-2 bg-card border border-border rounded-md text-sm text-ink placeholder-gold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold focus:border-gold shadow-sm transition-colors`}
                    placeholder="搜索"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        debouncedSearch(e.target.value);
                    }}
                />
                {searchTerm && (
                    <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-2 flex items-center text-gold hover:text-gray-600"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                )}
            </div>
            
            {/* 筛选按钮 - 与视图按钮风格一致 */}
            <button
                onClick={() => setShowFilters(!showFilters)}
                className={`ml-1 px-3 py-2 text-sm font-medium border rounded-md flex items-center shadow-sm transition-colors ${
                    showFilters || hasActiveFilters
                        ? 'bg-cinnabar text-gold-pale border-gold-light'
                        : 'bg-card text-ink border-border hover:bg-heritage-hover'
                }`}
            >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                {hasActiveFilters && (
                    <div className="ml-1 w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                )}
            </button>

            {/* 筛选面板 */}
            {showFilters && (
                <div className={`absolute top-full left-0 mt-2 ${UI_CONFIG.FILTER_PANEL_WIDTH} bg-white rounded-lg shadow-lg border border-border z-10`}>
                    <div className="p-4 space-y-3">
                        {/* 搜索选项 */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-ink">包含详细信息</span>
                            <input
                                type="checkbox"
                                checked={filters.searchInInfo}
                                onChange={(e) => handleSearch(undefined, { searchInInfo: e.target.checked })}
                                className="rounded border-border text-cinnabar focus:ring-gold"
                            />
                        </div>

                        {/* 世代筛选 */}
                        {generations.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-ink mb-2">世代</h4>
                                <div className="flex flex-wrap gap-1">
                                    {generations.map((generation) => (
                                        <button
                                            key={generation}
                                            onClick={() => toggleGeneration(generation)}
                                            className={`px-2 py-1 rounded text-xs transition-colors ${
                                                filters.selectedGenerations.includes(generation)
                                                    ? 'bg-heritage-hover text-cinnabar'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {generation}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 年份范围 */}
                        <div>
                            <h4 className="text-sm font-medium text-ink mb-2">年份</h4>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="起始"
                                    className="flex-1 px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                                    value={filters.yearRange.start || ''}
                                    onChange={(e) => handleSearch(undefined, { 
                                        yearRange: { ...filters.yearRange, start: e.target.value ? parseInt(e.target.value) : undefined }
                                    })}
                                />
                                <span className="text-gold text-xs">-</span>
                                <input
                                    type="number"
                                    placeholder="结束"
                                    className="flex-1 px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                                    value={filters.yearRange.end || ''}
                                    onChange={(e) => handleSearch(undefined, { 
                                        yearRange: { ...filters.yearRange, end: e.target.value ? parseInt(e.target.value) : undefined }
                                    })}
                                />
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <div className="pt-2 border-t border-border">
                                <button
                                    onClick={clearSearch}
                                    className="text-xs text-desc hover:text-dark-desc underline"
                                >
                                    清除所有筛选
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}