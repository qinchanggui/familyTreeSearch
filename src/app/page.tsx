"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import FamilyTree from './components/FamilyTree';
import TreeView from './components/TreeView';
import TimelineView from './components/TimelineView';
import StatsPanel from './components/StatsPanel';
import PersonDetail from './components/PersonDetail';
import MemorialMap from './components/MemorialMap';
import Footer from './components/Footer';
import SearchBar, { SearchFilters } from './components/SearchBar';
import { useFamilyData } from '../data/familyDataWithIds';
import { QueueListIcon, Squares2X2Icon, ClockIcon, SunIcon, MoonIcon, ChartBarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { getFamilyFullName } from '@/utils/config';
import { searchFamilyData, createFilteredFamilyData, SearchResult } from '@/utils/search';
import { buildFamilyTree } from '@/utils/familyTree';

export default function Home() {
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'tree' | 'stats' | 'memorial'>('list');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [memorialPlaces, setMemorialPlaces] = useState<any[]>([]);
  const { data: familyData, loading: dataLoading, error: dataError } = useFamilyData();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: '',
    searchInInfo: true,
    selectedGenerations: [],
    yearRange: {}
  });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const familyFullName = useMemo(() => getFamilyFullName(), []);

  const treeData = useMemo(() => {
    if (dataLoading || dataError || !familyData.generations.length) {
      return { generations: [{ title: "家族树", people: [] }] };
    }
    return buildFamilyTree(familyData);
  }, [familyData, dataLoading, dataError]);

  const filteredFamilyData = useMemo(() => {
    if (searchResults.length > 0) {
      return createFilteredFamilyData(familyData, searchResults);
    }
    return familyData;
  }, [familyData, searchResults]);

  const handleSearch = useCallback((term: string, filters: SearchFilters) => {
    setSearchTerm(term);
    setSearchFilters(filters);
  }, []);

  useEffect(() => {
    // 缓存全量数据供搜索模式下FamilyTree组件使用
    if (!dataLoading && !dataError && familyData.generations.length) {
      (window as any).__familyDataFull = familyData;
    }
  }, [familyData, dataLoading, dataError]);

  // 加载祭祖地点数据
  useEffect(() => {
    fetch('/api/memorial-places')
      .then(res => res.json())
      .then(data => {
        if (data.places) setMemorialPlaces(data.places);
      })
      .catch(() => {});
  }, []);

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

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <header className="bg-white dark:bg-gray-900 shadow-sm mb-4 sm:mb-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center">
            {familyFullName}族谱
          </h1>
          <p className="mt-0.5 sm:mt-2 text-gray-500 dark:text-gray-400 text-center text-[10px] sm:text-sm tracking-wide">
            传承历史 · 延续文化
          </p>
          <div className="mt-3 sm:mt-6 flex justify-center gap-3">
            {/* 深色模式切换 */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <div className="inline-flex rounded-md shadow-sm">
                <button
                  type="button"
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-l-md flex items-center ${
                    viewMode === 'list'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setViewMode('list')}
                >
                  <QueueListIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-0.5 sm:mr-2" />
                  <span className="hidden sm:inline">列表</span>
                </button>
                <button
                  type="button"
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium flex items-center ${
                    viewMode === 'timeline'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setViewMode('timeline')}
                >
                  <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-0.5 sm:mr-2" />
                  <span className="hidden sm:inline">时间线</span>
                </button>
                <button
                  type="button"
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium flex items-center ${
                    viewMode === 'tree'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setViewMode('tree')}
                >
                  <Squares2X2Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-0.5 sm:mr-2" />
                  <span className="hidden sm:inline">树状</span>
                </button>
                <button
                  type="button"
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium flex items-center ${
                    viewMode === 'stats'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setViewMode('stats')}
                >
                  <ChartBarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-0.5 sm:mr-2" />
                  <span className="hidden sm:inline">统计</span>
                </button>
                <button
                  type="button"
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-r-md flex items-center ${
                    viewMode === 'memorial'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setViewMode('memorial')}
                >
                  <MapPinIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-0.5 sm:mr-2" />
                  <span className="hidden sm:inline">祭祖</span>
                </button>
              </div>
              <button
                onClick={() => {
                  document.documentElement.classList.toggle('dark');
                  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
                }}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                aria-label="切换深色模式"
              >
                <MoonIcon className="h-4 w-4 dark:hidden" />
                <SunIcon className="h-4 w-4 hidden dark:block" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-grow">
        {dataError && (
          <div className="text-center text-red-500 mb-4 text-sm">
            {dataError} - 使用默认数据
          </div>
        )}

        {/* 搜索框和世代导航：仅列表视图显示 */}
        {viewMode === 'list' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 mb-4 sm:mb-6">
            <div className="mb-4">
              <SearchBar
                onSearch={handleSearch}
                generations={familyData.generations.map(g => g.title)}
              />
            </div>

            {searchResults.length === 0 && (searchTerm || searchFilters.selectedGenerations.length > 0 ||
             searchFilters.yearRange.start || searchFilters.yearRange.end) && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-6 sm:py-8">
                <p className="text-base sm:text-lg">未找到匹配的家族成员</p>
                <p className="text-xs sm:text-sm">请尝试修改搜索条件</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mb-3 sm:mb-4">
                找到 <span className="font-medium text-blue-600">{searchResults.length}</span> 个匹配结果
              </div>
            )}
          </div>
        )}

        {/* 人物详情页 */}
        {selectedPersonId && (
          <PersonDetail
            data={familyData}
            personId={selectedPersonId}
            onBack={() => setSelectedPersonId(null)}
            onNavigate={(id) => setSelectedPersonId(id)}
          />
        )}

        {!selectedPersonId && (
          <>
            {/* 世代快速跳转导航条：仅列表视图 */}
            {viewMode === 'list' && (
              <div className="max-w-7xl mx-auto px-3 sm:px-4 mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {familyData.generations.map((g, i) => (
                  <button
                    key={g.title}
                    onClick={() => {
                      const el = document.getElementById(`gen-${g.title}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300 hover:border-blue-200 dark:hover:border-blue-700 transition-colors whitespace-nowrap"
                  >
                    {g.title}
                    <span className="ml-1 text-[10px] opacity-60">{g.people.length}</span>
                  </button>
                ))}
              </div>
            </div>
            )}

            {viewMode === 'list' ? (
              <FamilyTree
                familyData={filteredFamilyData}
                searchTerm={searchTerm}
                searchInInfo={searchFilters.searchInInfo}
                onPersonClick={(id) => setSelectedPersonId(id)}
              />
            ) : viewMode === 'timeline' ? (
              <TimelineView data={familyData} />
            ) : viewMode === 'stats' ? (
              <StatsPanel data={familyData} />
            ) : viewMode === 'memorial' ? (
              <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4">
                <MemorialMap places={memorialPlaces} />
              </div>
            ) : (
              <TreeView data={treeData} />
            )}
          </>
        )}
      </div>

      {/* 回到顶部浮动按钮 */}
      <BackToTop />

      <Footer />
    </main>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-4 z-50 w-10 h-10 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all"
      aria-label="回到顶部"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
