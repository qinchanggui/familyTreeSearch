"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { FamilyData, Person } from '@/types/family';
import { ChevronDownIcon, ChevronRightIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { escapeHtml, splitHighlightSegments } from '@/utils/search';
import { ANIMATION_DELAYS, CSS_CLASSES } from '@/utils/constants';

interface TreeViewProps {
  data: FamilyData;
  searchTerm?: string;
  searchInInfo?: boolean;
}

interface TreeNodeProps {
  person: Person;
  level: number;
  searchTerm?: string;
  searchInInfo?: boolean;
  firstMatchId?: string | null;
}

// 检查是否匹配搜索条件
const isPersonMatch = (person: Person, searchTerm: string, searchInInfo: boolean): boolean => {
  if (!searchTerm) return false;

  const lowerSearchTerm = searchTerm.toLowerCase();
  const nameMatch = person.name.toLowerCase().includes(lowerSearchTerm);
  const infoMatch = searchInInfo && person.info && person.info.toLowerCase().includes(lowerSearchTerm);
  const yearMatch = (person.birthYear?.toString().includes(lowerSearchTerm) || false) ||
                    (person.deathYear?.toString().includes(lowerSearchTerm) || false);

  return nameMatch || !!infoMatch || yearMatch;
};

// 递归判断子孙中是否有匹配
const hasDescendantMatch = (person: Person, searchTerm: string, searchInInfo: boolean): boolean => {
  if (isPersonMatch(person, searchTerm, searchInInfo)) return true;
  if (person.children) {
    return person.children.some(child => hasDescendantMatch(child, searchTerm, searchInInfo));
  }
  return false;
};

const TreeNode = ({ person, level, searchTerm, searchInInfo, firstMatchId }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const timeoutRefs = useRef<(NodeJS.Timeout | null)[]>([]);
  const hasChildren = person.children && person.children.length > 0;
  const isFirstMatch = person.id === firstMatchId;
  const isMatch = searchTerm ? isPersonMatch(person, searchTerm, searchInInfo || false) : false;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    timeoutRefs.current = [];
  };

  useEffect(() => {
    if (isFirstMatch && nodeRef.current) {
      clearAllTimeouts();
      const scrollTimeout = setTimeout(() => {
        if (nodeRef.current) {
          nodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setIsHighlighted(true);
          const highlightTimeout = setTimeout(() => setIsHighlighted(false), ANIMATION_DELAYS.HIGHLIGHT_DURATION);
          timeoutRefs.current.push(highlightTimeout);
        }
      }, ANIMATION_DELAYS.SCROLL_TO_MATCH);
      timeoutRefs.current.push(scrollTimeout);
    }
    return () => clearAllTimeouts();
  }, [isFirstMatch]);

  return (
    <div className={level === 0 ? '' : 'ml-3 sm:ml-5 md:ml-6'}>
      <div
        ref={nodeRef}
        className={`flex items-start py-2 px-2 rounded-md cursor-pointer transition-all duration-300 ${
          isHighlighted
            ? `${CSS_CLASSES.HIGHLIGHT.RING} ${CSS_CLASSES.HIGHLIGHT.RING_COLOR} ${CSS_CLASSES.HIGHLIGHT.BACKGROUND}`
            : isMatch && searchTerm
              ? 'bg-yellow-50'
              : 'hover:bg-gray-50'
        }`}
        onClick={toggleExpand}
      >
        {hasChildren ? (
          <div className="mr-1 mt-0.5 text-gray-400 flex-shrink-0">
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </div>
        ) : (
          <div className="w-4 mr-1 flex-shrink-0"></div>
        )}

        <div className="flex items-start min-w-0 flex-1">
          <div className="bg-blue-50 p-1 rounded-md mr-2 flex-shrink-0">
            <UserIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <span className={`font-medium ${isMatch ? 'text-blue-700' : 'text-gray-800'}`}>
              {searchTerm
                ? splitHighlightSegments(escapeHtml(person.name), searchTerm).map((seg, i) => (
                    seg.isMatch
                      ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{seg.text}</mark>
                      : <span key={i}>{seg.text}</span>
                  ))
                : person.name}
            </span>
            {person.info && (
              <p className="text-gray-600 text-sm mt-1 break-words">
                {(searchTerm && searchInInfo)
                  ? splitHighlightSegments(escapeHtml(person.info), searchTerm).map((seg, i) => (
                      seg.isMatch
                        ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{seg.text}</mark>
                        : <span key={i}>{seg.text}</span>
                    ))
                  : person.info}
              </p>
            )}
            {(person.birthYear || person.deathYear) && (
              <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                <span>
                  {person.birthYear}
                  {person.birthYear && person.deathYear && ' - '}
                  {person.deathYear && (person.birthYear ? person.deathYear : `- ${person.deathYear}`)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="border-l border-gray-200 ml-2 sm:ml-3 pl-1 sm:pl-2">
          {person.children?.map((child, index) => (
            <TreeNode
              key={index}
              person={child}
              level={level + 1}
              searchTerm={searchTerm}
              searchInInfo={searchInInfo}
              firstMatchId={firstMatchId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 递归查找所有匹配的人员
const findAllMatches = (person: Person, searchTerm: string, searchInInfo: boolean): Person[] => {
  const matches: Person[] = [];
  if (isPersonMatch(person, searchTerm, searchInInfo)) {
    matches.push(person);
  }
  if (person.children) {
    person.children.forEach(child => {
      matches.push(...findAllMatches(child, searchTerm, searchInInfo));
    });
  }
  return matches;
};

// 过滤树：只保留匹配节点及其祖先路径
const filterTree = (people: Person[], searchTerm: string, searchInInfo: boolean): Person[] => {
  return people.reduce<Person[]>((acc, person) => {
    const childrenFiltered = person.children
      ? filterTree(person.children, searchTerm, searchInInfo)
      : [];

    if (isPersonMatch(person, searchTerm, searchInInfo) || childrenFiltered.length > 0) {
      acc.push({
        ...person,
        children: childrenFiltered.length > 0 ? childrenFiltered : person.children,
      });
    }
    return acc;
  }, []);
};

export default function TreeView({ data, searchTerm, searchInInfo }: TreeViewProps) {
  const [firstMatchId, setFirstMatchId] = useState<string | null>(null);
  const rootPeople = data.generations[0]?.people || [];

  // 搜索时过滤树数据
  const filteredRootPeople = useMemo(() => {
    if (!searchTerm) return rootPeople;
    return filterTree(rootPeople, searchTerm, searchInInfo || false);
  }, [rootPeople, searchTerm, searchInInfo]);

  useEffect(() => {
    if (searchTerm) {
      const allMatches: Person[] = [];
      rootPeople.forEach(person => {
        allMatches.push(...findAllMatches(person, searchTerm, searchInInfo || false));
      });
      setFirstMatchId(allMatches.length > 0 ? allMatches[0].id || null : null);
    } else {
      setFirstMatchId(null);
    }
  }, [searchTerm, searchInInfo, rootPeople]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">家族树状图</h2>
        <div className="overflow-x-auto -mx-2 px-2">
          {filteredRootPeople.length > 0 ? (
            filteredRootPeople.map((person, index) => (
              <TreeNode
                key={index}
                person={person}
                level={0}
                searchTerm={searchTerm}
                searchInInfo={searchInInfo}
                firstMatchId={firstMatchId}
              />
            ))
          ) : searchTerm ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-base sm:text-lg">未找到匹配的家族成员</p>
              <p className="text-sm">请尝试修改搜索条件</p>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">暂无数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
