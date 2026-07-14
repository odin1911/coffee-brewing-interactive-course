import type { CourseConfig, QuizSlide } from './course';

export type VoteCounts = Record<string, number>;

export type SessionState = {
  currentId: string;
  visitedPath: string[];
  votes: Record<string, VoteCounts>;
  selectedDetail: string | null;
};

export type SessionAction =
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'VOTE'; slideId: string; optionId: string; delta: 1 | -1 }
  | { type: 'OPEN_DETAIL'; detailId: string }
  | { type: 'CLOSE_DETAIL' }
  | { type: 'RESET' };

export function createInitialState(course: CourseConfig): SessionState {
  const firstId = course.slides[0]?.id ?? '';
  return { currentId: firstId, visitedPath: firstId ? [firstId] : [], votes: {}, selectedDetail: null };
}

export function getWinningOptionId(slide: QuizSlide, votes: VoteCounts = {}): string | null {
  const max = Math.max(0, ...slide.options.map((option) => votes[option.id] ?? 0));
  if (max === 0) return null;
  const leaders = slide.options.filter((option) => (votes[option.id] ?? 0) === max);
  return leaders.length === 1 ? leaders[0].id : null;
}

export function getNextSlideId(course: CourseConfig, state: SessionState): string | null {
  const index = course.slides.findIndex((slide) => slide.id === state.currentId);
  const slide = course.slides[index];
  if (!slide) return null;
  if (slide.type === 'quiz') {
    const optionId = getWinningOptionId(slide, state.votes[slide.id]);
    return optionId ? slide.options.find((option) => option.id === optionId)?.goto ?? null : null;
  }
  return slide.next ?? course.slides[index + 1]?.id ?? null;
}

export function createCourseReducer(course: CourseConfig) {
  return (state: SessionState, action: SessionAction): SessionState => {
    if (action.type === 'RESET') return createInitialState(course);
    if (action.type === 'VOTE') {
      const slideVotes = state.votes[action.slideId] ?? {};
      const count = Math.max(0, (slideVotes[action.optionId] ?? 0) + action.delta);
      return { ...state, votes: { ...state.votes, [action.slideId]: { ...slideVotes, [action.optionId]: count } } };
    }
    if (action.type === 'OPEN_DETAIL') return { ...state, selectedDetail: action.detailId };
    if (action.type === 'CLOSE_DETAIL') return { ...state, selectedDetail: null };
    if (action.type === 'PREVIOUS') {
      if (state.visitedPath.length < 2) return state;
      const visitedPath = state.visitedPath.slice(0, -1);
      return { ...state, currentId: visitedPath[visitedPath.length - 1], visitedPath };
    }
    const nextId = getNextSlideId(course, state);
    if (!nextId || state.visitedPath.includes(nextId)) return state;
    return { ...state, currentId: nextId, visitedPath: [...state.visitedPath, nextId], selectedDetail: null };
  };
}
