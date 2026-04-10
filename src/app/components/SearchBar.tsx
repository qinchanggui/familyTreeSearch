"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { UI_CONFIG, ANIMATION_DELAYS } from '@/utils/constants';

interface SearchBarProps {
    onSearch: (searchTerm: string, filters: SearchFilters) => void;
    generations: string[];
}

export interface SearchFilters {
    searchTerm: string;
    selectedGenerations: string[];
}

export default function SearchBar({ onSearch, generations }: SearchBarProps) {
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<SearchFilters>({
        searchTerm: '',
        selectedGenerations: [],
    });

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
            selectedGenerations: [],
        };
        setFilters(clearedFilters);
        onSearch('', clearedFilters);
    }, [onSearch]);

      return (
        <div className="flex items-center gap-2">
            <div className="relative flex-1">
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
                        className="absolute inset-y-0 right-0 pr-2 flex items-center text-gold hover:text-dark-desc"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                )}
            </div>


        </div>
    );
}
