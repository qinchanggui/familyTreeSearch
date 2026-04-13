"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import FamilyTree from './components/FamilyTree';
import TimelineView from './components/TimelineView';
import StatsPanel from './components/StatsPanel';
import PersonDetail from './components/PersonDetail';
import MemorialMap from './components/MemorialMap';
const TreeView = dynamic(() => import('./components/TreeView'), { ssr: false });

import Footer from './components/Footer';
import SearchBar, { SearchFilters } from './components/SearchBar';
import { useFamilyData } from '../data/familyDataWithIds';
import { ANIMATION_DELAYS } from '@/utils/constants';
import { QueueListIcon, Squares2X2Icon, ClockIcon, SunIcon, MoonIcon, ChartBarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { getFamilyFullName } from '@/utils/config';
import { searchFamilyData, createFilteredFamilyData, SearchResult } from '@/utils/search';

interface MemorialPlace {
  id: string;
  name: string;
  address: string;
  lng: number;
  lat: number;
  memorialDay: string;
  ancestor: string;
  note: string;
  photo: string;
}

export default function Home() {
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'tree' | 'stats' | 'memorial'>('list');
  const [activeGen, setActiveGen] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [memorialPlaces, setMemorialPlaces] = useState<MemorialPlace[]>([]);
  const { data: familyData, loading: dataLoading, error: dataError } = useFamilyData();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: '',
    
    selectedGenerations: [],
  });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const genScrollRef = useRef<HTMLDivElement>(null);

  const familyFullName = useMemo(() => getFamilyFullName(), []);

  const matchedIds = useMemo(() => {
    return new Set(searchResults.filter(r => r.person.id).map(r => r.person.id!));
  }, [searchResults]);

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
    fetch('/api/memorial-places')
      .then(res => res.json())
      .then(data => {
        if (data.places) setMemorialPlaces(data.places);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!dataLoading && !dataError && familyData.generations.length) {
      if (searchTerm || searchFilters.selectedGenerations.length > 0) {
        const results = searchFamilyData(familyData, searchTerm, searchFilters);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }
  }, [familyData, searchTerm, searchFilters, dataLoading, dataError]);

  // P2: 搜索结果变化后自动滚动到第一个匹配人物
  useEffect(() => {
    if (searchResults.length > 0 && viewMode === 'list' && !selectedPersonId) {
      const firstPerson = searchResults[0];
      if (firstPerson?.person?.id) {
        // 等待 DOM 渲染后再滚动
        requestAnimationFrame(() => {
          const el = document.getElementById(`person-${firstPerson.person.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-gold');
            setTimeout(() => el.classList.remove('ring-2', 'ring-gold'), ANIMATION_DELAYS.HIGHLIGHT_DURATION);
          }
        });
      }
    }
  }, [searchResults, viewMode, selectedPersonId]);

  if (dataLoading) {
    return (
      <main className="min-h-screen bg-parchment dark:bg-dark-bg">
        <header className="bg-gradient-to-b from-cinnabar-dark to-cinnabar shadow-sm mb-4 sm:mb-6 header-ornament">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
            <div className="animate-pulse h-8 w-40 bg-white/20 rounded mx-auto mb-2" />
            <div className="animate-pulse h-4 w-28 bg-gold/30 rounded mx-auto" />
            <div className="mt-4 flex justify-center gap-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="animate-pulse h-9 w-16 bg-border dark:bg-dark-border rounded" />
              ))}
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="animate-pulse h-10 w-full bg-border dark:bg-dark-border rounded mb-6" />
          <div className="flex gap-2 mb-6 overflow-hidden">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="animate-pulse h-8 w-20 bg-border dark:bg-dark-border rounded-full flex-shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-card dark:bg-dark-card rounded-xl border border-border p-6">
                <div className="animate-pulse h-6 w-24 bg-border dark:bg-dark-border rounded mb-3" />
                <div className="animate-pulse h-4 w-full bg-border dark:bg-dark-border rounded mb-2" />
                <div className="animate-pulse h-4 w-3/4 bg-border dark:bg-dark-border rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-parchment dark:bg-dark-bg flex flex-col">
      <header className="bg-gradient-to-b from-cinnabar-dark to-cinnabar shadow-sm mb-4 sm:mb-6 header-ornament">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <h1 className="text-xl sm:text-3xl font-bold text-gold-pale dark:text-dark-gold-pale text-center font-serif">
            {familyFullName}族谱
          </h1>
          <p className="mt-0.5 sm:mt-2 text-gold-light dark:text-dark-gold text-center text-[10px] sm:text-sm tracking-widest">
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
                      ? 'text-gold-pale dark:text-dark-gold-pale border border-gold-light dark:border-dark-gold'
                      : 'text-gold-light dark:text-dark-gold border border-transparent hover:border-gold-light/50 dark:hover:border-dark-gold/50'
                  }`}
                  onClick={() => { setSelectedPersonId(null); setViewMode('list'); }}
                >
                  <QueueListIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
                  <span className="inline">列表</span>
                </button>
                <button
                  type="button"
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium flex items-center ${
                    viewMode === 'timeline'
                      ? 'text-gold-pale dark:text-dark-gold-pale border border-gold-light dark:border-dark-gold'
                      : 'text-gold-light dark:text-dark-gold border border-transparent hover:border-gold-light/50 dark:hover:border-dark-gold/50'
                  }`}
                  onClick={() => { setSelectedPersonId(null); setViewMode('timeline'); }}
                >
                  <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
                  <span className="inline">时间线</span>
                </button>
                <button
                  type="button"
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium flex items-center ${
                    viewMode === 'tree'
                      ? 'text-gold-pale dark:text-dark-gold-pale border border-gold-light dark:border-dark-gold'
                      : 'text-gold-light dark:text-dark-gold border border-transparent hover:border-gold-light/50 dark:hover:border-dark-gold/50'
                  }`}
                  onClick={() => { setSelectedPersonId(null); setViewMode('tree'); }}
                >
                  <Squares2X2Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
                  <span className="inline">树状</span>
                </button>
                <button
                  type="button"
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium flex items-center ${
                    viewMode === 'stats'
                      ? 'text-gold-pale dark:text-dark-gold-pale border border-gold-light dark:border-dark-gold'
                      : 'text-gold-light dark:text-dark-gold border border-transparent hover:border-gold-light/50 dark:hover:border-dark-gold/50'
                  }`}
                  onClick={() => { setSelectedPersonId(null); setViewMode('stats'); }}
                >
                  <ChartBarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
                  <span className="inline">统计</span>
                </button>
                <button
                  type="button"
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-r-md flex items-center ${
                    viewMode === 'memorial'
                      ? 'text-gold-pale dark:text-dark-gold-pale border border-gold-light dark:border-dark-gold'
                      : 'text-gold-light dark:text-dark-gold border border-transparent hover:border-gold-light/50 dark:hover:border-dark-gold/50'
                  }`}
                  onClick={() => { setSelectedPersonId(null); setViewMode('memorial'); }}
                >
                  <MapPinIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
                  <span className="inline">祭祖</span>
                </button>
              </div>
              <button
                onClick={() => {
                  document.documentElement.classList.toggle('dark');
                  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
                }}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gold-light/40 dark:border-dark-gold/40 bg-white/10 dark:bg-black/10 text-gold-light dark:text-dark-gold hover:bg-white/20 dark:hover:bg-black/20 hover:border-gold-light/70 dark:hover:border-dark-gold/70 flex items-center backdrop-blur-sm transition-all"
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

            {searchResults.length === 0 && (searchTerm || searchFilters.selectedGenerations.length > 0) && (
              <div className="text-center text-muted dark:text-dark-muted py-6 sm:py-8">
                <p className="text-base sm:text-lg">未找到匹配的家族成员</p>
                <p className="text-xs sm:text-sm">请尝试修改搜索条件</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="text-xs sm:text-sm text-muted dark:text-dark-muted text-center mb-3 sm:mb-4">
                找到 <span className="font-medium text-cinnabar">{searchResults.filter(r => r.matchType === 'name' || r.matchType === 'id').length}</span> 个匹配结果{searchResults.filter(r => r.matchType !== 'name' && r.matchType !== 'id').length > 0 && <span>，含 <span className="text-muted">{searchResults.filter(r => r.matchType !== 'name' && r.matchType !== 'id').length}</span> 个描述匹配</span>}
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
            onScrollToPerson={(id) => {
              setSelectedPersonId(null);
              setViewMode('list');
              setTimeout(() => {
                const el = document.getElementById(`person-${id}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('ring-2');
                  el.style.boxShadow = '0 0 0 2px #B8860B';
                  setTimeout(() => {
                    el.classList.remove('ring-2');
                    el.style.boxShadow = '';
                  }, 2000);
                }
              }, 50);
            }}
          />
        )}

        {!selectedPersonId && (
          <>
            {/* 世代快速跳转导航条：仅列表视图，sticky 吸顶 */}
            {viewMode === 'list' && (
              <div className="sticky top-0 z-20 bg-parchment dark:bg-dark-bg pb-2 mb-4">
              <div className="max-w-7xl mx-auto px-3 sm:px-4">
              <div ref={genScrollRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 scroll-smooth snap-x snap-mandatory"
                onWheel={(e) => {
                  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    e.preventDefault();
                    (genScrollRef.current!).scrollLeft += e.deltaY;
                  }
                }}
              >
                {familyData.generations.map((g, i) => (
                  <button
                    key={g.title}
                    onClick={() => {
                      setActiveGen(g.title);
                      const el = document.getElementById(`gen-${g.title}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      setTimeout(() => setActiveGen(null), 2000);
                    }}
                    className={`flex-shrink-0 snap-start px-4 py-1.5 text-xs font-medium font-serif border transition-colors whitespace-nowrap relative ${
                      activeGen === g.title
                        ? 'border-cinnabar dark:border-dark-cinnabar bg-cinnabar/10 dark:bg-dark-cinnabar/20 text-cinnabar dark:text-dark-cinnabar'
                        : 'border-border dark:border-dark-border bg-card dark:bg-dark-card text-ink dark:text-dark-text hover:text-cinnabar dark:hover:text-dark-cinnabar hover:border-gold-light dark:hover:border-dark-gold hover:bg-heritage-hover dark:hover:bg-dark-heritage-hover'
                    }`}
                  >
                    <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-light to-transparent dark:via-dark-gold opacity-0 hover:opacity-100 transition-opacity"></span>
                    {g.title}
                    <span className="ml-1.5 text-[10px] opacity-50">{g.people.length}</span>
                  </button>
                ))}
              </div>
              </div>
              </div>
            )}

            {viewMode === 'list' ? (
              <FamilyTree
                familyData={filteredFamilyData}
                fullFamilyData={familyData}
                searchTerm={searchTerm}
                
                onPersonClick={(id) => setSelectedPersonId(id)}
                matchedIds={matchedIds}
              />
            ) : viewMode === 'timeline' ? (
              <TimelineView data={familyData} />
            ) : viewMode === 'stats' ? (
              <StatsPanel data={familyData} />
            ) : viewMode === 'memorial' ? (
              <MemorialMap places={memorialPlaces} />
            ) : (
              <TreeView data={filteredFamilyData} />
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
      className="fixed bottom-20 right-4 z-50 w-10 h-10 bg-cinnabar text-white rounded-full shadow-lg flex items-center justify-center hover:bg-cinnabar-light active:scale-95 transition-all"
      aria-label="回到顶部"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
