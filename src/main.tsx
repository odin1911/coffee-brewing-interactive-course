import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CourseConfigError, findMissingAssets, loadCourse, type ChartSlide, type CourseConfig, type QuizSlide, type Slide } from './course';
import { createCourseReducer, createInitialState, getNextSlideId } from './session';
import { SessionRecorder } from './recorder';
import './styles.css';
import './print.css';

const assetUrl = (path: string) => path.startsWith('/') ? path : `/${path}`;

function CoursePage({ course }: { course: CourseConfig }) {
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
    <main className="app-shell">
      <header className="course-header">
        <a className="brand" href="/course" aria-label={course.course.title}>
          <img src={assetUrl(course.course.brand.logo)} alt="" />
          <span>{course.course.presenter}</span>
        </a>
        <span className="course-label">{course.course.title}</span>
      </header>
      <section className="stage" aria-labelledby="slide-title">
        <div className="rail" aria-label={`第 ${pageNumber} 页，共 08 页`}><strong>{pageNumber}</strong><span>/ 08</span></div>
        <div className="slide-body">
          <SlideView course={course} slide={slide} pageNumber={pageNumber} answer={state.answers[slide.id]} detailId={detailId} onAnswer={(optionId) => { dispatch({ type: 'ANSWER', slideId: slide.id, optionId }); void recorder.current?.answer(slide.id, optionId); }} onDetail={(id) => { dispatch({ type: 'OPEN_DETAIL', detailId: id }); void recorder.current?.feature('chart_detail_open'); }} onCloseDetail={() => { dispatch({ type: 'CLOSE_DETAIL' }); void recorder.current?.feature('chart_detail_close'); }} />
          <nav className="slide-nav" aria-label={course.ui.navigation}>
            <button type="button" onClick={goPrevious} disabled={state.visitedPath.length <= 1}>{course.ui.previous}</button>
            <span>{slide.type === 'quiz' && !state.answers[slide.id] ? '先选一个答案，再继续。' : '每次只改变一个变量。'}</span>
            {slide.type === 'cta' ? <button type="button" className="primary" onClick={async () => { await recorder.current?.slideCompleted(slide.id); await recorder.current?.finish('completed'); dispatch({ type: 'RESET' }); }}>{slide.action.label}</button> : <button type="button" className="primary" onClick={goNext} disabled={!nextId}>{course.ui.continue}</button>}
          </nav>
        </div>
      </section>
    </main>
  );
}

function SlideView({ course, slide, pageNumber, answer, detailId, onAnswer, onDetail, onCloseDetail }: {
  course: CourseConfig;
  slide: Slide;
  pageNumber: string;
  answer?: string;
  detailId: string | null;
  onAnswer: (optionId: string) => void;
  onDetail: (detailId: string) => void;
  onCloseDetail: () => void;
}) {
  if (slide.type === 'cover') return <div className="cover-grid"><div><p className="eyebrow">{pageNumber} / 08 · 开始课程</p><h1 id="slide-title">{slide.title}</h1><p className="lead">{slide.subtitle}</p><div className="topic-line"><span>风味</span><i /> <span>变量</span><i /> <span>记录</span></div></div>{slide.image && <img className="hero-image" src={assetUrl(slide.image)} alt={slide.imageAlt ?? ''} />}</div>;
  if (slide.type === 'content') return <div className="content-slide"><p className="eyebrow">学习记录 · {pageNumber} / 08</p><h1 id="slide-title">{slide.title}</h1><ul className="lesson-list">{slide.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></div>;
  if (slide.type === 'chart') return <ChartView slide={slide} course={course} pageNumber={pageNumber} detailId={detailId} onDetail={onDetail} onCloseDetail={onCloseDetail} />;
  if (slide.type === 'quiz') return <QuizView slide={slide} pageNumber={pageNumber} answer={answer} onAnswer={onAnswer} />;
  return <div className="content-slide"><p className="eyebrow">{pageNumber} / 08 · 总结</p><h1 id="slide-title">{slide.title}</h1><p className="lead">{slide.body}</p></div>;
}

function ChartView({ slide, course, pageNumber, detailId, onDetail, onCloseDetail }: { slide: ChartSlide; course: CourseConfig; pageNumber: string; detailId: string | null; onDetail: (id: string) => void; onCloseDetail: () => void }) {
  const max = Math.max(...slide.chart.series.map((item) => item.value));
  const activeId = detailId ?? slide.chart.series[1]?.detail ?? slide.chart.series[0]?.detail;
  const detail = activeId ? course.details[activeId] : undefined;
  return <div className="chart-slide"><div className="chart-main"><p className="eyebrow">变量观察 · {pageNumber} / 08</p><h1 id="slide-title">{slide.title}</h1><div className="bars" role="list" aria-label={`${slide.title}，单位 ${slide.chart.unit}`}>{slide.chart.series.map((item) => <button key={item.detail} type="button" className={item.detail === activeId ? 'bar active' : 'bar'} style={{ height: `${Math.max(25, item.value / max * 100)}%` }} aria-pressed={item.detail === activeId} onClick={() => onDetail(item.detail)}><strong>{item.value}</strong><span>{item.label}</span></button>)}</div></div>{detail && <aside className="detail-panel"><p className="eyebrow">当前明细</p><h2>{detail.title}</h2><ul>{detail.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul><button type="button" onClick={onCloseDetail}>{course.ui.closeDetail}</button></aside>}</div>;
}

function QuizView({ slide, pageNumber, answer, onAnswer }: { slide: QuizSlide; pageNumber: string; answer?: string; onAnswer: (optionId: string) => void }) {
  const total = slide.options.reduce((sum, option) => sum + (option.initialVotes ?? 0), 0) + (answer ? 1 : 0);
  return <div className="quiz-slide"><div className="quiz-prompt"><p className="eyebrow">路径选择 · {pageNumber} / 08</p><h1 id="slide-title">{slide.question}</h1><p className="lead">答案没有对错，它只决定下一页先讲固定配方，还是先讲变量对比。</p></div><div className="quiz-panel"><div className="choices">{slide.options.map((option) => <button key={option.id} type="button" aria-pressed={answer === option.id} className={answer === option.id ? 'choice selected' : 'choice'} onClick={() => onAnswer(option.id)}><span>{option.text}</span><small>{answer === option.id ? '已选择' : '选择'}</small></button>)}</div><div className="results"><h2>当前结果 · {total} 人</h2>{slide.options.map((option) => { const votes = (option.initialVotes ?? 0) + (answer === option.id ? 1 : 0); const percent = total ? Math.round(votes / total * 100) : 0; return <div className="result" key={option.id}><span>{option.text}</span><div className="track"><i style={{ width: `${percent}%` }} /></div><strong>{percent}%</strong></div>; })}</div></div></div>;
}

function App() {
  const [course, setCourse] = useState<CourseConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { loadCourse().then(setCourse).catch((reason: unknown) => setError(reason instanceof CourseConfigError ? reason.errors.join('；') : String(reason))); }, []);
  if (error) return <main className="status-card"><h1>课程配置无法加载</h1><p>{error}</p></main>;
  if (!course) return <main className="status-card"><p>正在准备冲煮手记……</p></main>;
  if (window.location.pathname === '/tools') return <ToolsPage course={course} />;
  if (window.location.pathname === '/print') return <PrintPage course={course} />;
  return <CoursePage course={course} />;
}

function ToolsPage({ course }: { course: CourseConfig }) {
  const [missingAssets, setMissingAssets] = useState<string[]>([]);
  useEffect(() => { void findMissingAssets(course).then(setMissingAssets); }, [course]);
  return <main className="utility-shell"><a className="utility-back" href="/course">← 回到课程</a><div className="utility-card"><p className="eyebrow">课外工具</p><h1>冲煮手记工具页</h1><p>这里放记录、校验和完整打印，不打断教学路径。</p><div className="utility-actions"><a href="/print">打开完整打印版</a><a href="/course">重新开始课程</a></div><dl><div><dt>课程</dt><dd>{course.course.title}</dd></div><div><dt>配置</dt><dd>已加载 {course.slides.length} 个页面定义</dd></div><div><dt>素材</dt><dd>{missingAssets.length ? <span className="asset-error">缺少：{missingAssets.join('、')}</span> : '本地素材检查通过'}</dd></div><div><dt>记录</dt><dd>本地运行时由服务端增量保存；纯静态部署自动关闭</dd></div></dl></div></main>;
}

function PrintPage({ course }: { course: CourseConfig }) {
  return <main className="print-deck"><header className="print-toolbar"><a href="/course">← 回到课程</a><button type="button" onClick={() => window.print()}>打印 / 导出 PDF</button></header>{course.slides.map((slide, index) => <article className="print-slide" key={slide.id}><p className="eyebrow">{String(index + 1).padStart(2, '0')} / {course.slides.length} · {slide.type}</p><h1>{slide.title ?? ('question' in slide ? slide.question : slide.id)}</h1>{slide.type === 'cover' && <><p className="print-lead">{slide.subtitle}</p>{slide.image && <img src={assetUrl(slide.image)} alt={slide.imageAlt ?? ''} />}</>}{slide.type === 'content' && <ul>{slide.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}{slide.type === 'quiz' && <div className="print-options">{slide.options.map((option) => <p key={option.id}><strong>{option.text}</strong><span>→ {option.goto}</span></p>)}</div>}{slide.type === 'chart' && <div className="print-chart"><div className="print-bars">{slide.chart.series.map((item) => <div key={item.detail}><strong>{item.value}{slide.chart.unit}</strong><span>{item.label}</span></div>)}</div><div className="print-details">{slide.chart.series.map((item) => <section key={item.detail}><h2>{course.details[item.detail]?.title}</h2><ul>{course.details[item.detail]?.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul></section>)}</div></div>}{slide.type === 'cta' && <p className="print-lead">{slide.body}</p>}</article>)}</main>;
}

createRoot(document.getElementById('root')!).render(<App />);
