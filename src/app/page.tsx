"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import FamilyTree from './components/FamilyTree';
import TreeView from './components/TreeView';
import Footer from './components/Footer';
import SearchBar, { SearchFilters } from './components/SearchBar';
import { useFamilyData } from '../data/familyDataWithIds';
import { QueueListIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { getFamilyFullName } from '@/utils/config';
import { searchFamilyData, createFilteredFamilyData, SearchResult } from '@/utils/search';
import { buildFamilyTree } from '@/utils/familyTree';

export default function Home() {
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const { data: familyData, loading: dataLoading, error: dataError } = useFamilyData();

  // Search related state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: '',
    searchInInfo: true,
    selectedGenerations: [],
    yearRange: {}
  });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const familyFullName = useMemo(() => getFamilyFullName(), []);

  // 使用useMemo缓存树状结构数据的构建
  const treeData = useMemo(() => {
    if (dataLoading || dataError || !familyData.generations.length) {
      return {
        generations: [
          {
            title: "家族树",
            people: []
          }
        ]
      };
    }
    return buildFamilyTree(familyData);
  }, [familyData, dataLoading, dataError]);

  // 使用useMemo缓存过滤后的家族数据
  const filteredFamilyData = useMemo(() => {
    if (searchResults.length > 0) {
      return createFilteredFamilyData(familyData, searchResults);
    }
    return familyData;
  }, [familyData, searchResults]);

  // 使用useCallback缓存搜索处理函数
  const handleSearch = useCallback((term: string, filters: SearchFilters) => {
    setSearchTerm(term);
    setSearchFilters(filters);
  }, []);

  // Search effect - 使用useEffect处理搜索逻辑
  useEffect(() => {
    if (!dataLoading && !dataError && familyData.generations.length) {
      if (searchTerm || searchFilters.selectedGenerations.length > 0 ||
          searchFilters.yearRange.start || searchFilters.yearRange.end) {
        const results = searchFamilyData(familyData, searchTerm, searchFilters);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }
  }, [familyData, searchTerm, searchFilters, dataLoading, dataError]);

  // 显示加载状态
  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm mb-4">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            {familyFullName}族谱
          </h1>
          <p className="mt-2 text-gray-500 text-center text-sm tracking-wide">
            传承历史 · 延续文化
          </p>
          <div className="mt-6 flex justify-center">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-l-md flex items-center ${
                  viewMode === 'list'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setViewMode('list')}
              >
                <QueueListIcon className="h-4 w-4 mr-2" />
                列表视图
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-r-md flex items-center ${
                  viewMode === 'tree'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setViewMode('tree')}
              >
                <Squares2X2Icon className="h-4 w-4 mr-2" />
                树状视图
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-grow">
        {dataError && (
          <div className="text-center text-red-500 mb-4">
            {dataError} - 使用默认数据
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 mb-6">
          {/* 搜索框 */}
          <div className="flex justify-end mb-4">
            <SearchBar
              onSearch={handleSearch}
              generations={familyData.generations.map(g => g.title)}
            />
          </div>

          {/* 搜索结果提示 */}
          {searchResults.length === 0 && (searchTerm || searchFilters.selectedGenerations.length > 0 ||
           searchFilters.yearRange.start || searchFilters.yearRange.end) && (
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg">未找到匹配的家族成员</p>
              <p className="text-sm">请尝试修改搜索条件</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="text-sm text-gray-600 text-center mb-4">
              找到 <span className="font-medium text-blue-600">{searchResults.length}</span> 个匹配结果
            </div>
          )}
        </div>

        {viewMode === 'list' ? (
          <FamilyTree
            familyData={filteredFamilyData}
            searchTerm={searchTerm}
            searchInInfo={searchFilters.searchInInfo}
          />
        ) : (
          <TreeView
            data={treeData}
            searchTerm={searchTerm}
            searchInInfo={searchFilters.searchInInfo}
          />
        )}
      </div>

      <Footer />
    </main>
  );
}
