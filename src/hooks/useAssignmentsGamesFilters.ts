import { useCallback, useMemo, useState } from "react";

export interface AssignmentsGamesFilters {
  search: string;
  level: string;
  skill: string;
  type: string;
  difficulty: string;     // 'all' | 'easy' | 'medium' | 'hard'
  visibility: string;     // 'all' | 'public' | 'private'
  ownerOnly: boolean;     // chỉ của tôi
  page: number;
  pageSize: number;
}

export interface UseAssignmentsGamesFiltersOptions {
  initialFilters?: Partial<AssignmentsGamesFilters>;
  defaultPageSize?: number;
}

export interface UseAssignmentsGamesFiltersResult {
  filters: AssignmentsGamesFilters;
  queryParams: Record<string, string>;
  levelOptions: string[];
  skillOptions: string[];
  typeOptions: string[];
  difficultyOptions: string[];
  visibilityOptions: string[];
  setSearch: (value: string) => void;
  setLevel: (value: string) => void;
  setSkill: (value: string) => void;
  setType: (value: string) => void;
  setDifficulty: (value: string) => void;
  setVisibility: (value: string) => void;
  setOwnerOnly: (value: boolean) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetFilters: () => void;
}

const DEFAULT_LEVEL_OPTIONS = ["all", "A1", "A2", "B1", "B2", "C1", "C2"];
const DEFAULT_SKILL_OPTIONS = [
  "all",
  "Listening",
  "Speaking",
  "Reading",
  "Writing",
  "Vocabulary",
  "Grammar",
  "Collaboration",
];
const DEFAULT_TYPE_OPTIONS = [
  "all",
  "Flashcard",
  "Quiz",
  "Worksheet",
  "Project",
  "Interactive",
  "Role-play",
];
const DEFAULT_DIFFICULTY_OPTIONS = ["all", "easy", "medium", "hard"];
const DEFAULT_VISIBILITY_OPTIONS = ["all", "public", "private"];

const DEFAULT_FILTERS: AssignmentsGamesFilters = {
  search: "",
  level: "all",
  skill: "all",
  type: "all",
  difficulty: "all",
  visibility: "all",
  ownerOnly: false,
  page: 1,
  pageSize: 12,
};

export const useAssignmentsGamesFilters = (
  options: UseAssignmentsGamesFiltersOptions = {}
): UseAssignmentsGamesFiltersResult => {
  const { initialFilters, defaultPageSize } = options;
  const [filters, setFilters] = useState<AssignmentsGamesFilters>({
    ...DEFAULT_FILTERS,
    ...(defaultPageSize ? { pageSize: defaultPageSize } : {}),
    ...initialFilters,
  });

  const updateFilters = useCallback(
    (partial: Partial<AssignmentsGamesFilters>) => {
      setFilters((prev) => ({
        ...prev,
        ...partial,
      }));
    },
    []
  );

  const setSearch = useCallback(
    (value: string) => {
      updateFilters({ search: value, page: 1 });
    },
    [updateFilters]
  );

  const setLevel = useCallback(
    (value: string) => {
      updateFilters({ level: value, page: 1 });
    },
    [updateFilters]
  );

  const setSkill = useCallback(
    (value: string) => {
      updateFilters({ skill: value, page: 1 });
    },
    [updateFilters]
  );

  const setType = useCallback(
    (value: string) => {
      updateFilters({ type: value, page: 1 });
    },
    [updateFilters]
  );

  const setDifficulty = useCallback(
    (value: string) => {
      updateFilters({ difficulty: value, page: 1 });
    },
    [updateFilters]
  );

  const setVisibility = useCallback(
    (value: string) => {
      updateFilters({ visibility: value, page: 1 });
    },
    [updateFilters]
  );

  const setOwnerOnly = useCallback(
    (value: boolean) => {
      updateFilters({ ownerOnly: value, page: 1 });
    },
    [updateFilters]
  );

  const setPage = useCallback(
    (page: number) => {
      updateFilters({ page: Math.max(1, page) });
    },
    [updateFilters]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      updateFilters({ pageSize: Math.max(1, pageSize), page: 1 });
    },
    [updateFilters]
  );

  const resetFilters = useCallback(() => {
    setFilters({
      ...DEFAULT_FILTERS,
      ...(defaultPageSize ? { pageSize: defaultPageSize } : {}),
    });
  }, [defaultPageSize]);

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      page: filters.page.toString(),
      pageSize: filters.pageSize.toString(),
    };

    if (filters.search.trim()) {
      params.search = filters.search.trim();
    }
    if (filters.level !== "all") {
      params.level = filters.level;
    }
    if (filters.skill !== "all") {
      params.skill = filters.skill;
    }
    if (filters.type !== "all") {
      params.type = filters.type;
    }
    if (filters.difficulty !== "all") {
      params.difficulty = filters.difficulty;
    }
    if (filters.visibility !== "all") {
      params.visibility = filters.visibility;
    }
    if (filters.ownerOnly) {
      params.ownerOnly = "true";
    }

    return params;
  }, [filters]);

  return {
    filters,
    queryParams,
    levelOptions: DEFAULT_LEVEL_OPTIONS,
    skillOptions: DEFAULT_SKILL_OPTIONS,
    typeOptions: DEFAULT_TYPE_OPTIONS,
    difficultyOptions: DEFAULT_DIFFICULTY_OPTIONS,
    visibilityOptions: DEFAULT_VISIBILITY_OPTIONS,
    setSearch,
    setLevel,
    setSkill,
    setType,
    setDifficulty,
    setVisibility,
    setOwnerOnly,
    setPage,
    setPageSize,
    resetFilters,
  };
};
