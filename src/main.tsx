import { useEffect, useMemo, useReducer, useRef, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { assetUrl, courseTheme, CourseConfigError, findMissingAssets, imageReferrerPolicy, loadCourse, type ChartSlide, type CourseConfig, type QuizSlide, type Slide, type UiCopy } from './course';
import { createCourseReducer, createInitialState, getNextSlideId } from './session';
import { SessionRecorder } from './recorder';
import './styles.css';
import './print.css';

export function CoursePage({ course }: { course: CourseConfig }) {
  const reducer = useMemo(() => createCourseReducer(course), [course]);
  const [state, dispatch] = useReducer(reducer, course, createInitialState);
  const [detailId, setDetailId] = useState<string | null>(null);
  const recorder = useRef<SessionRecorder | null>(null);
  const slide = course.slides.find((item) => item.id === state.currentId) ?? course.slides[0];
  const nextId = getNextSlideId(course, state);
  const pageNumber = String(state.visitedPath.length).padStart(2, '0');

  useEffect(() => setDetailId(state.selectedDetail), [state.selectedDetail]);

  useEffect(() => {
    const activeRecorder = new SessionRecorder({ enabled: window.location.protocol !== 'file:' });
    recorder.current = activeRecorder;
    void activeRecorder.start(course.course.id);
    return () => { void activeRecorder.finish('abandoned'); };
  }, [course.course.id]);

  useEffect(() => {
    const onVisibility = () => recorder.current?.setVisibility(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const goNext = async () => { await recorder.current?.slideCompleted(slide.id); dispatch({ type: 'NEXT' }); };
  const goPrevious = async () => { await recorder.current?.slideCompleted(slide.id); dispatch({ type: 'PREVIOUS' }); };

  return (
    <main className="app-shell" style={courseTheme(course.course.brand) as CSSProperties}>
      <header className="course-header">
        <a className="brand" href="/course" aria-label={course.course.title}>
          <img src={assetUrl(course.course.brand.logo)} referrerPolicy={imageReferrerPolicy(course.course.brand.logo)} alt="" />
          <span>{course.course.presenter}</span>
        </a>
        <span className="course-label">{course.course.title}</span>
      </header>
      <section className="stage" aria-labelledby="slide-title">
        <div className="rail" aria-label={pageNumber}><strong>{pageNumber}</strong></div>
        <div className="slide-body">
          <SlideView course={course} slide={slide} pageNumber={pageNumber} answer={state.answers[slide.id]} detailId={detailId} onAnswer={(optionId) => { dispatch({ type: 'ANSWER', slideId: slide.id, optionId }); void recorder.current?.answer(slide.id, optionId); }} onDetail={(id) => { dispatch({ type: 'OPEN_DETAIL', detailId: id }); void recorder.current?.feature('chart_detail_open'); }} onCloseDetail={() => { dispatch({ type: 'CLOSE_DETAIL' }); void recorder.current?.feature('chart_detail_close'); }} />
          <nav className="slide-nav" aria-label={course.ui.navigation}>
            <button type="button" onClick={goPrevious} disabled={state.visitedPath.length <= 1}>{course.ui.previous}</button>
            <span>{pageNumber}</span>
            {slide.type === 'cta' ? <a className="primary" href={slide.action.href} onClick={() => { void recorder.current?.slideCompleted(slide.id); void recorder.current?.finish('completed'); }}>{slide.action.label}</a> : <button type="button" className="primary" onClick={goNext} disabled={!nextId}>{slide.type === 'quiz' ? course.ui.continue : course.ui.next}</button>}
          </nav>
        </div>
      </section>
    </main>
  );
}

export function SlideView({ course, slide, pageNumber, answer, detailId, onAnswer, onDetail, onCloseDetail }: {
  course: CourseConfig;
  slide: Slide;
  pageNumber: string;
  answer?: string;
  detailId: string | null;
  onAnswer: (optionId: string) => void;
  onDetail: (detailId: string) => void;
  onCloseDetail: () => void;
}) {
  if (slide.type === 'cover') return <div className="cover-grid"><div>{slide.kicker && <p className="eyebrow">{slide.kicker} · {pageNumber}</p>}<h1 id="slide-title">{slide.title}</h1>{slide.subtitle && <p className="lead">{slide.subtitle}</p>}{slide.topics && <div className="topic-line">{slide.topics.map((topic, index) => <span key={topic}>{index > 0 && <i />}{topic}</span>)}</div>}</div>{slide.image && <img className="hero-image" src={assetUrl(slide.image)} referrerPolicy={imageReferrerPolicy(slide.image)} alt={slide.imageAlt ?? ''} />}</div>;
  if (slide.type === 'content') return <div className="content-slide">{slide.kicker && <p className="eyebrow">{slide.kicker} · {pageNumber}</p>}<h1 id="slide-title">{slide.title}</h1><ul className="lesson-list">{slide.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>{slide.image && <img className="content-image" src={assetUrl(slide.image)} referrerPolicy={imageReferrerPolicy(slide.image)} alt={slide.imageAlt ?? ''} />}</div>;
  if (slide.type === 'chart') return <ChartView slide={slide} course={course} pageNumber={pageNumber} detailId={detailId} onDetail={onDetail} onCloseDetail={onCloseDetail} />;
  if (slide.type === 'quiz') return <QuizView slide={slide} ui={course.ui} pageNumber={pageNumber} answer={answer} onAnswer={onAnswer} />;
  return <div className="content-slide">{slide.kicker && <p className="eyebrow">{slide.kicker} · {pageNumber}</p>}<h1 id="slide-title">{slide.title}</h1><p className="lead">{slide.body}</p></div>;
}

export function ChartView({ slide, course, pageNumber, detailId, onDetail, onCloseDetail }: { slide: ChartSlide; course: CourseConfig; pageNumber: string; detailId: string | null; onDetail: (id: string) => void; onCloseDetail: () => void }) {
  const max = Math.max(...slide.chart.series.map((item) => item.value));
  const activeId = slide.chart.clickable ? detailId : null;
  const detail = activeId ? course.details[activeId] : undefined;
  const colors = course.course.brand.chartColors ?? [course.course.brand.primary, course.course.brand.accent, course.course.brand.text];
  return <div className="chart-slide"><div className="chart-main">{slide.kicker && <p className="eyebrow">{slide.kicker} · {pageNumber}</p>}<h1 id="slide-title">{slide.title}</h1><div className="bars" role="list" aria-label={`${slide.title} ${slide.chart.unit}`}>{slide.chart.series.map((item, index) => <button key={item.detail} type="button" className={item.detail === activeId ? 'bar active' : 'bar'} style={{ height: `${Math.max(25, item.value / max * 100)}%`, '--bar-color': colors[index % colors.length] } as CSSProperties} aria-label={`${course.ui.showDetail}: ${item.label}`} aria-pressed={item.detail === activeId} disabled={!slide.chart.clickable} onClick={() => onDetail(item.detail)}><strong>{item.value}{slide.chart.unit}</strong><span>{item.label}</span></button>)}</div></div>{detail && <aside className="detail-panel"><h2>{detail.title}</h2><ul>{detail.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul><button type="button" onClick={onCloseDetail}>{course.ui.closeDetail}</button></aside>}</div>;
}

export function QuizView({ slide, ui, pageNumber, answer, onAnswer }: { slide: QuizSlide; ui: UiCopy; pageNumber: string; answer?: string; onAnswer: (optionId: string) => void }) {
  const total = slide.options.reduce((sum, option) => sum + (option.initialVotes ?? 0), 0) + (answer ? 1 : 0);
  return <div className="quiz-slide"><div className="quiz-prompt">{slide.kicker && <p className="eyebrow">{slide.kicker} · {pageNumber}</p>}<h1 id="slide-title">{slide.question}</h1>{slide.description && <p className="lead">{slide.description}</p>}</div><div className="quiz-panel"><div className="choices">{slide.options.map((option) => <button key={option.id} type="button" aria-pressed={answer === option.id} className={answer === option.id ? 'choice selected' : 'choice'} onClick={() => onAnswer(option.id)}><span>{option.text}</span><small>{answer === option.id ? ui.selected : ui.select}</small></button>)}</div><div className="results"><h2>{ui.results} · {total} {ui.peopleUnit}</h2>{slide.options.map((option) => { const votes = (option.initialVotes ?? 0) + (answer === option.id ? 1 : 0); const percent = total ? Math.round(votes / total * 100) : 0; return <div className="result" key={option.id}><span>{option.text}</span><div className="track"><i style={{ width: `${percent}%` }} /></div><strong>{percent}%</strong></div>; })}</div></div></div>;
}

export async function waitForImages(images: HTMLImageElement[]): Promise<void> {
  await Promise.all(images.map(async (image) => {
    const source = image.currentSrc || image.src;
    if (!image.complete) await new Promise<void>((resolve, reject) => {
      image.addEventListener('load', () => resolve(), { once: true });
      image.addEventListener('error', () => reject(new Error(source)), { once: true });
    });
    if (image.naturalWidth === 0) throw new Error(source);
    try { await image.decode?.(); } catch { throw new Error(source); }
  }));
}

function App() {
  const [course, setCourse] = useState<CourseConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { loadCourse().then(setCourse).catch((reason: unknown) => setError(reason instanceof CourseConfigError ? reason.errors.join('；') : String(reason))); }, []);
  if (error) return <main className="status-card"><h1>课程配置无法加载</h1><p>{error}</p></main>;
  if (!course) return <main className="status-card"><p>正在加载课程……</p></main>;
  if (window.location.pathname === '/tools') return <ToolsPage course={course} />;
  if (window.location.pathname === '/print') return <PrintPage course={course} />;
  return <CoursePage course={course} />;
}

function ToolsPage({ course }: { course: CourseConfig }) {
  const [missingAssets, setMissingAssets] = useState<string[]>([]);
  useEffect(() => { void findMissingAssets(course).then(setMissingAssets); }, [course]);
  return <main className="utility-shell"><a className="utility-back" href="/course">← 回到课程</a><div className="utility-card"><p className="eyebrow">课外工具</p><h1>课件工具页</h1><p>这里放记录、校验和完整打印，不打断教学路径。</p><div className="utility-actions"><a href="/print">打开完整打印版</a><a href="/course">重新开始课程</a></div><dl><div><dt>课程</dt><dd>{course.course.title}</dd></div><div><dt>配置</dt><dd>已加载 {course.slides.length} 个页面定义</dd></div><div><dt>素材</dt><dd>{missingAssets.length ? <span className="asset-error">缺少：{missingAssets.join('、')}</span> : '本地素材检查通过'}</dd></div><div><dt>记录</dt><dd>本地运行时由服务端增量保存；纯静态部署自动关闭</dd></div></dl></div></main>;
}

export function PrintPage({ course }: { course: CourseConfig }) {
  const colors = course.course.brand.chartColors ?? [course.course.brand.primary, course.course.brand.accent, course.course.brand.text];
  const [imageError, setImageError] = useState('');
  const print = async () => {
    setImageError('');
    try {
      await waitForImages(Array.from(document.querySelectorAll<HTMLImageElement>('.print-deck img')));
      window.print();
    } catch (error) {
      setImageError(`${course.ui.imageLoadError}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  return <main className="print-deck" style={courseTheme(course.course.brand) as CSSProperties}><header className="print-toolbar"><a href="/course">{course.ui.backToCourse}</a>{imageError && <p className="print-error" role="alert">{imageError}</p>}<button type="button" onClick={print}>{course.ui.exportPdf}</button></header>{course.slides.map((slide, index) => <article className="print-slide" key={slide.id}><p className="eyebrow">{String(index + 1).padStart(2, '0')} / {course.slides.length}{slide.kicker ? ` · ${slide.kicker}` : ''}</p>{slide.type === 'cover' && <div className="print-brand"><img src={assetUrl(course.course.brand.logo)} referrerPolicy={imageReferrerPolicy(course.course.brand.logo)} alt="" /><strong>{course.course.title}</strong><span>{course.course.presenter}</span></div>}<h1>{slide.title ?? ('question' in slide ? slide.question : slide.id)}</h1>{slide.type === 'cover' && <><p className="print-lead">{slide.subtitle}</p>{slide.topics && <p className="print-topics">{slide.topics.join(' · ')}</p>}{slide.image && <img src={assetUrl(slide.image)} referrerPolicy={imageReferrerPolicy(slide.image)} alt={slide.imageAlt ?? ''} />}</>}{slide.type === 'content' && <><ul>{slide.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>{slide.image && <img src={assetUrl(slide.image)} referrerPolicy={imageReferrerPolicy(slide.image)} alt={slide.imageAlt ?? ''} />}</>}{slide.type === 'quiz' && <><p className="print-lead">{slide.description}</p><div className="print-options">{slide.options.map((option) => <p key={option.id}><strong>{option.text}</strong><span>→ {option.goto}</span></p>)}</div></>}{slide.type === 'chart' && <div className="print-chart"><div className="print-bars">{slide.chart.series.map((item, itemIndex) => { const max = Math.max(...slide.chart.series.map((entry) => entry.value)); return <div key={item.detail} style={{ height: `${Math.max(25, item.value / max * 100)}%`, '--bar-color': colors[itemIndex % colors.length] } as CSSProperties}><strong>{item.value}{slide.chart.unit}</strong><span>{item.label}</span></div>; })}</div><div className="print-details">{slide.chart.series.map((item) => <section key={item.detail}><h2>{course.details[item.detail]?.title}</h2><ul>{course.details[item.detail]?.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul></section>)}</div></div>}{slide.type === 'cta' && <><p className="print-lead">{slide.body}</p><a className="print-action" href={slide.action.href}>{slide.action.label}</a></>}</article>)}</main>;
}

if (typeof document !== 'undefined') createRoot(document.getElementById('root')!).render(<App />);
