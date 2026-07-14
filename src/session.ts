import type { CourseConfig } from './course';

export type SessionState = {
  currentId: string;
  visitedPath: string[];
  answers: Record<string, string>;
  selectedDetail: string | null;
};

export type SessionAction =
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'ANSWER'; slideId: string; optionId: string }
  | { type: 'OPEN_DETAIL'; detailId: string }
  | { type: 'CLOSE_DETAIL' }
  | { type: 'RESET' };

export function createInitialState(course: CourseConfig): SessionState {
  const firstId = course.slides[0]?.id ?? '';
  return { currentId: firstId, visitedPath: firstId ? [firstId] : [], answers: {}, selectedDetail: null };
}

export function getNextSlideId(course: CourseConfig, state: SessionState): string | null {
  const index = course.slides.findIndex((slide) => slide.id === state.currentId);
  const slide = course.slides[index];
  if (!slide) return null;
  if (slide.type === 'quiz') {
    const optionId = state.answers[slide.id];
    return optionId ? slide.options.find((option) => option.id === optionId)?.goto ?? null : null;
  }
  return slide.next ?? course.slides[index + 1]?.id ?? null;
}

export function createCourseReducer(course: CourseConfig) {
  return (state: SessionState, action: SessionAction): SessionState => {
    if (action.type === 'RESET') return createInitialState(course);
    if (action.type === 'ANSWER') return { ...state, answers: { ...state.answers, [action.slideId]: action.optionId } };
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
