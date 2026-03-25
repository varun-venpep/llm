'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    Menu, X, Loader2, Settings, XCircle, Save, 
    ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle, CheckCircle2, Lock, 
    PlayCircle, Trophy, Globe, Layout, BookOpen, 
    Video, FileText, HelpCircle, User, LogOut,
    ArrowLeft, ArrowRight, Clock, Star, Download,
    Search, Bell, MoreVertical, CreditCard, Users,
    Circle, GripVertical, Eye, EyeOff, BarChart3,
    UserCheck, Award, AlertCircle, Info, Target,
    Layers, Archive, Upload
} from 'lucide-react';
import dynamic from 'next/dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ScormDocumentPlayer = dynamic(() => import('@/components/ScormDocumentPlayer'), { ssr: false });

export default function CoursePlayer({ params: paramsPromise }: { params: Promise<{ domain: string, courseId: string }> }) {
    const params = React.use(paramsPromise);
    const router = useRouter();
    const domain = params.domain;
    const courseId = params.courseId;

    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeLesson, setActiveLesson] = useState<any>(null);
    const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
    const [marking, setMarking] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [userAnswers, setUserAnswers] = useState<any[]>([]);
    const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; attemptsCount?: number } | null>(null);
    const [randomizedQuestions, setRandomizedQuestions] = useState<any[]>([]);
    const [fetchingAttempts, setFetchingAttempts] = useState(false);
    const [currentAttempts, setCurrentAttempts] = useState(0);
    const [progressMap, setProgressMap] = useState<Record<string, any>>({});

    const [submittingQuiz, setSubmittingQuiz] = useState(false);
    const [quizError, setQuizError] = useState(false);
    const userId = typeof window !== 'undefined' ? localStorage.getItem(`${domain}_userId`) : null;
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
    const [notes, setNotes] = useState<any[]>([]);
    const [reviewsData, setReviewsData] = useState<{ reviews: any[], averageRating: number, totalReviews: number }>({ reviews: [], averageRating: 0, totalReviews: 0 });
    const [newNote, setNewNote] = useState('');
    const [newReviewRating, setNewReviewRating] = useState(5);
    const [newReviewComment, setNewReviewComment] = useState('');
    const [submittingNote, setSubmittingNote] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [toasts, setToasts] = useState<any[]>([]);
    const addToast = (message: string, type: 'success' | 'error' = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const maxWatchedRef = useRef(0);

    useEffect(() => {
        fetchCourseDetail();
        fetchReviews();
    }, [courseId]);

    useEffect(() => {
        if (userId && courseId) {
            fetchNotes();
        }
    }, [userId, courseId]);

    const fetchNotes = async () => {
        if (!userId || !courseId) return;
        try {
            const res = await fetch(`/api/t/${domain}/notes?userId=${userId}&courseId=${courseId}`);
            const data = await res.json();
            setNotes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch notes', err);
        }
    };

    const fetchReviews = async () => {
        if (!courseId) return;
        try {
            const res = await fetch(`/api/t/${domain}/reviews?courseId=${courseId}`);
            const data = await res.json();
            setReviewsData(data);
        } catch (err) {
            console.error('Failed to fetch reviews', err);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim() || !userId || !courseId || !activeLesson) return;
        setSubmittingNote(true);
        try {
            const timestamp = videoRef.current?.currentTime || 0;
            const res = await fetch(`/api/t/${domain}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newNote,
                    timestamp,
                    userId,
                    courseId,
                    lessonId: activeLesson.id
                })
            });
            if (res.ok) {
                setNewNote('');
                fetchNotes();
                addToast('Note saved');
            }
        } catch (err) {
            console.error('Failed to save note', err);
        } finally {
            setSubmittingNote(false);
        }
    };

    const handleDeleteNote = async (id: string) => {
        try {
            const res = await fetch(`/api/t/${domain}/notes?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchNotes();
                addToast('Note deleted');
            }
        } catch (err) {
            console.error('Failed to delete note', err);
        }
    };

    const handleSubmitReview = async () => {
        if (!userId || !courseId) return;
        setSubmittingReview(true);
        try {
            const res = await fetch(`/api/t/${domain}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating: newReviewRating,
                    content: newReviewComment,
                    userId,
                    courseId
                })
            });
            if (res.ok) {
                setNewReviewComment('');
                fetchReviews();
                addToast('Review submitted');
            }
        } catch (err) {
            console.error('Failed to submit review', err);
        } finally {
            setSubmittingReview(false);
        }
    };

    const markLessonComplete = async (lessonId: string) => {
        if (!userId || completedLessonIds.includes(lessonId)) return;
        try {
            await fetch(`/api/t/${domain}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, lessonId, completed: true })
            });
            setCompletedLessonIds(prev => [...new Set([...prev, lessonId])]);
        } catch (err) {
            console.error('Failed to mark lesson complete', err);
        }
    };

    useEffect(() => {
        if (!activeLesson) return;
        setQuizStarted(false);
        setQuizResult(null);
        setCurrentQuestionIdx(0);
        setUserAnswers([]);
        setCurrentAttempts(0);

        // Pre-fetch attempt count when switching to a quiz lesson
        if (activeLesson.type === 'QUIZ' && activeLesson.quiz?.maxAttempts > 0) {
            const uid = localStorage.getItem(`${domain}_userId`);
            if (uid) {
                fetch(`/api/t/${domain}/quiz-attempts/count?quizId=${activeLesson.quiz.id}&userId=${uid}`)
                    .then(r => r.json())
                    .then(({ count }) => setCurrentAttempts(count || 0))
                    .catch(() => {});
            }
        }

        // Reset max watched time for the new lesson to its initial saved position
        const initialPos = progressMap[activeLesson.id]?.lastPosition ? parseInt(progressMap[activeLesson.id].lastPosition) : 0;
        maxWatchedRef.current = initialPos;

        if (activeLesson) {
            logActivity('VIEW_LESSON', { lessonId: activeLesson.id, lessonTitle: activeLesson.title });
        }

        let pptTimer: NodeJS.Timeout;
        if (activeLesson.type === 'PPT' && !activeLesson.pdfUrl?.toLowerCase().endsWith('.pdf')) {
            pptTimer = setTimeout(() => {
                markLessonComplete(activeLesson.id);
            }, 10000); // Wait 10s for PPTs before completing (if not using ScormDocumentPlayer)
        }
        return () => {
            if (pptTimer) clearTimeout(pptTimer);
        };
    }, [activeLesson]);

    const saveVideoProgress = async (lessonId: string, seconds: number) => {
        if (!userId) return;
        try {
            await fetch(`/api/t/${domain}/progress/position`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, lessonId, position: Math.floor(seconds) })
            });
            setProgressMap(prev => ({
                ...prev,
                [lessonId]: { ...prev[lessonId], lastPosition: String(Math.floor(seconds)) }
            }));
        } catch (e) {
            console.error("Failed to save video progress");
        }
    };

    useEffect(() => {
        if (!activeLesson || (activeLesson.type && activeLesson.type !== 'TEXT')) return;
        
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                markLessonComplete(activeLesson.id);
            }
        }, { threshold: 1.0 });

        const target = document.getElementById('text-lesson-end');
        if (target) observer.observe(target);

        return () => observer.disconnect();
    }, [activeLesson, completedLessonIds]);

    const logActivity = async (action: string, metadata: any = {}) => {
        const uid = typeof window !== 'undefined' ? localStorage.getItem(`${domain}_userId`) : null;
        if (!uid) return;
        try {
            await fetch(`/api/t/${domain}/activity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: uid, action, metadata })
            });
        } catch (err) {
            console.error('Failed to log activity', err);
        }
    };

    const trackLessonStart = async (userId: string, lessonId: string) => {
        try {
            await fetch(`/api/t/${domain}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, lessonId, completed: false })
            });
            logActivity('VIEW_LESSON', { lessonId, lessonTitle: activeLesson?.title });
        } catch (err) {
            console.error('Failed to track lesson start', err);
        }
    };

    const fetchCourseDetail = async () => {
        try {
            const res = await fetch(`/api/t/${domain}/courses/${courseId}`);
            const data = await res.json();
            setCourse(data);
            const firstActiveLesson = data.modules?.flatMap((m: any) => m.lessons).find((l: any) => l.isActive !== false);
            if (firstActiveLesson) {
                setActiveLesson(firstActiveLesson);
            }
            // Fetch progress if userId in localStorage
            const uid = typeof window !== 'undefined' ? localStorage.getItem(`${domain}_userId`) : null;
            if (uid) {
                const pRes = await fetch(`/api/t/${domain}/progress?userId=${uid}&courseId=${courseId}`);
                const pData = await pRes.json();
                setCompletedLessonIds(pData.completedLessonIds || []);
                setProgressMap(pData.progressMap || {});
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const startQuiz = async () => {
        if (!activeLesson?.quiz) return;
        
        // 1. Reset all quiz state synchronously first, so the UI is clean immediately on retry
        setUserAnswers([]);
        setCurrentQuestionIdx(0);
        setQuizResult(null);
        setQuizError(false);
        setRandomizedQuestions([]);
        
        // 2. Check attempts if limited
        if (activeLesson.quiz.maxAttempts > 0) {
            setFetchingAttempts(true);
            try {
                const uid = localStorage.getItem(`${domain}_userId`);
                const res = await fetch(`/api/t/${domain}/quiz-attempts/count?quizId=${activeLesson.quiz.id}&userId=${uid}`);
                const { count } = await res.json();
                setCurrentAttempts(count);
                if (count >= activeLesson.quiz.maxAttempts) {
                    alert(`You have reached the maximum number of attempts (${activeLesson.quiz.maxAttempts}) for this quiz.`);
                    setFetchingAttempts(false);
                    return;
                }
            } catch (e) {
                console.error("Failed to check attempts", e);
            } finally {
                setFetchingAttempts(false);
            }
        }

        // 3. Prepare questions (Randomization & Shuffling)
        let questions = [...activeLesson.quiz.questions];

        if (activeLesson.quiz.isRandomized) {
            // Shuffle pool and pick subset
            questions = questions.sort(() => Math.random() - 0.5);
            if (activeLesson.quiz.randomCount > 0) {
                questions = questions.slice(0, activeLesson.quiz.randomCount);
            }
        }

        // Shuffle options for each question
        const processedQuestions = questions.map(q => ({
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5)
        }));

        setRandomizedQuestions(processedQuestions);
        setQuizStarted(true);
    };

    const handleRetakeCourse = async () => {
        if (!confirm('Are you sure you want to reset your progress and retake this course? All quiz attempts and completed lessons will be cleared for this course.')) return;
        try {
            const uid = localStorage.getItem(`${domain}_userId`);
            await fetch(`/api/t/${domain}/progress/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: uid, courseId })
            });
            setCompletedLessonIds([]);
            fetchCourseDetail();
        } catch (err) {
            console.error(err);
        }
    };

    const allActiveLessons = course?.modules?.flatMap((m: any) =>
        m.isActive !== false ? m.lessons.filter((l: any) => l.isActive !== false) : []
    ) || [];

    const currentLessonIdx = allActiveLessons.findIndex((l: any) => l.id === activeLesson?.id);
    
    const isLessonLocked = (lessonId: string) => {
        const idx = allActiveLessons.findIndex((l: any) => l.id === lessonId);
        if (idx <= 0) return false;
        
        // A lesson is locked if ANY previous active lesson is not in completedLessonIds
        for (let i = 0; i < idx; i++) {
            if (!completedLessonIds.includes(allActiveLessons[i].id)) return true;
        }
        return false;
    };

    const handlePrevious = () => {
        if (currentLessonIdx > 0) {
            setActiveLesson(allActiveLessons[currentLessonIdx - 1]);
        }
    };

    const handleNext = () => {
        if (currentLessonIdx < allActiveLessons.length - 1) {
            setActiveLesson(allActiveLessons[currentLessonIdx + 1]);
        }
    };



    if (loading) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Player Experience...</p>
        </div>
    );

    if (!course) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-3xl font-black mb-4">Course Not Found</h1>
            <button onClick={() => router.push(`/t/${domain}/dashboard`)} className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-bold">Return to Dashboard</button>
        </div>
    );


    const toggleModule = (moduleId: string) => setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));

    return (
        <>
            <div className="min-h-screen bg-background flex overflow-hidden">
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-background/50">
                <header className="px-8 py-5 flex items-center justify-between glassmorphism sticky top-0 z-10 border-b border-border/50">
                    <button onClick={() => setSidebarOpen(true)} className={`lg:hidden ${sidebarOpen ? 'hidden' : 'block'}`}>
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex-1 lg:ml-0 ml-4">
                        <button onClick={() => router.push(`/t/${domain}/dashboard`)} className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group mb-1">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                        </button>
                        <h1 className="font-bold text-xl truncate">{course.title}</h1>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto flex flex-col">
                    {activeLesson ? (
                        <div className="flex-1 flex flex-col w-full">
                            {/* ── PLAYER AREA (Full Width) ── */}
                            <div className="w-full bg-black min-h-[40vh] flex flex-col justify-center">
                                {isLessonLocked(activeLesson.id) ? (
                                    <div className="w-full max-w-4xl mx-auto py-24 px-8 text-center space-y-6">
                                        <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center mx-auto mb-6">
                                            <Lock className="w-10 h-10 text-muted-foreground" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white">Lesson Locked</h2>
                                        <p className="text-muted-foreground max-w-md mx-auto">This lesson is part of a progressive learning path. Please complete the previous lessons to unlock this content.</p>
                                        <button 
                                            onClick={() => {
                                                const firstUncompleted = allActiveLessons.find((l: any) => !completedLessonIds.includes(l.id));
                                                if (firstUncompleted) setActiveLesson(firstUncompleted);
                                            }}
                                            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-transform"
                                        >
                                            Go to Current Lesson
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {activeLesson.type === 'VIDEO' && (
                                            <div className="w-full aspect-video max-h-[70vh] flex justify-center bg-black">
                                                {activeLesson.videoUrl ? (
                                                    activeLesson.videoUrl.startsWith('/') ? (
                                                        <div className="w-full h-full relative">
                                                            <video
                                                                key={activeLesson.id}
                                                                src={activeLesson.videoUrl}
                                                                controls
                                                                controlsList="nodownload"
                                                                onContextMenu={(e: any) => e.preventDefault()}
                                                                playsInline
                                                                className="w-full h-full outline-none"
                                                                ref={videoRef}
                                                                onLoadedMetadata={(e: any) => {
                                                                    const video = e.target;
                                                                    if (progressMap[activeLesson.id]?.lastPosition) {
                                                                        const pos = parseInt(progressMap[activeLesson.id].lastPosition);
                                                                        if (pos > 0) {
                                                                            video.currentTime = pos;
                                                                            maxWatchedRef.current = Math.max(maxWatchedRef.current, pos);
                                                                        }
                                                                    }
                                                                }}
                                                                onSeeking={(e: any) => {
                                                                    const video = e.target;
                                                                    // Strict check: if they seek forward beyond what they've watched, snap back
                                                                    if (video.currentTime > maxWatchedRef.current + 1) {
                                                                        video.currentTime = maxWatchedRef.current;
                                                                    }
                                                                }}
                                                                onEnded={() => markLessonComplete(activeLesson.id)}
                                                                onTimeUpdate={(e: any) => {
                                                                    const video = e.target;
                                                                    
                                                                    // If the jump is too large (seeking forward skip), reset it
                                                                    // We allow a small 1s buffer for natural playback jitter
                                                                    if (video.currentTime > maxWatchedRef.current + 1.5) {
                                                                        video.currentTime = maxWatchedRef.current;
                                                                        return;
                                                                    }

                                                                    // Update the furthest point watched only if it's a small forward increment
                                                                    if (video.currentTime > maxWatchedRef.current) {
                                                                        maxWatchedRef.current = video.currentTime;
                                                                    }

                                                                    const seconds = Math.floor(video.currentTime);
                                                                    if (seconds % 5 === 0 && seconds > 0) {
                                                                        saveVideoProgress(activeLesson.id, seconds);
                                                                    }
                                                                }}
                                                                onError={(e: any) => {
                                                                    console.error("Native Video Error:", e);
                                                                    addToast("Video playback error. Please try again.", "error");
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center text-center p-12">
                                                            <Video className="w-16 h-16 text-muted-foreground opacity-20 mb-4" />
                                                            <p className="font-bold text-lg text-white">External videos are not supported</p>
                                                            <p className="text-sm text-muted-foreground mt-2">Only uploaded videos can be played in this viewer.</p>
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-center p-12">
                                                        <PlayCircle className="w-16 h-16 text-muted-foreground opacity-20 mb-4" />
                                                        <p className="font-bold text-lg text-white">No video URL provided</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeLesson.type === 'PPT' && (
                                            <div className="w-full aspect-video max-h-[75vh] flex justify-center bg-black">
                                                {activeLesson.pdfUrl ? (
                                                    activeLesson.pdfUrl.startsWith('/') ? (
                                                        activeLesson.pdfUrl.toLowerCase().endsWith('.pdf') ? (
                                                            <ScormDocumentPlayer 
                                                                url={activeLesson.pdfUrl}
                                                                domain={domain}
                                                                lessonId={activeLesson.id}
                                                                userId={userId || ''}
                                                                initialPosition={progressMap[activeLesson.id]?.lastPosition ? parseInt(progressMap[activeLesson.id].lastPosition) : 1}
                                                                onComplete={() => markLessonComplete(activeLesson.id)}
                                                            />
                                                        ) : (
                                                            (typeof window !== 'undefined' && window.location.hostname === 'localhost' || typeof window !== 'undefined' && window.location.hostname === '127.0.0.1' || typeof window !== 'undefined' && window.location.hostname.includes('192.168.')) ? (
                                                                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-black">
                                                                    <FileText className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
                                                                    <p className="font-bold text-lg text-white mb-2">PPT Preview Unavailable</p>
                                                                    <p className="text-sm text-muted-foreground mb-6">Online viewers cannot preview local files during development.</p>
                                                                    <a href={activeLesson.pdfUrl} download className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2">
                                                                        Download Presentation
                                                                    </a>
                                                                    <button onClick={() => markLessonComplete(activeLesson.id)} className="mt-8 text-xs underline text-muted-foreground hover:text-white">Mark as Complete</button>
                                                                </div>
                                                            ) : (
                                                                <iframe 
                                                                    src={`https://docs.google.com/gview?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + activeLesson.pdfUrl : activeLesson.pdfUrl)}&embedded=true`} 
                                                                    className="w-full h-full border-none bg-white" 
                                                                />
                                                            )
                                                        )
                                                    ) : activeLesson.pdfUrl.includes('<iframe') ? (
                                                        <div className="w-full h-full flex justify-center items-center [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-none" dangerouslySetInnerHTML={{ __html: activeLesson.pdfUrl }} />
                                                    ) : (
                                                        <iframe src={
                                                            activeLesson.pdfUrl.includes('drive.google.com') || activeLesson.pdfUrl.includes('onedrive') ? activeLesson.pdfUrl :
                                                                activeLesson.pdfUrl.includes('canva.com') ? activeLesson.pdfUrl :
                                                                    activeLesson.pdfUrl.includes('slideshare.net') ? activeLesson.pdfUrl :
                                                                        activeLesson.pdfUrl.includes('scribd.com/embed') ? activeLesson.pdfUrl :
                                                                            (activeLesson.pdfUrl.toLowerCase().endsWith('.pptx') || activeLesson.pdfUrl.toLowerCase().endsWith('.docx') || activeLesson.pdfUrl.toLowerCase().endsWith('.xlsx')) ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(activeLesson.pdfUrl)}` :
                                                                                `https://docs.google.com/gview?url=${encodeURIComponent(activeLesson.pdfUrl)}&embedded=true`
                                                        } className="w-full h-full border-none" allowFullScreen />
                                                    )
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-center p-12">
                                                        <FileText className="w-16 h-16 text-muted-foreground opacity-20 mb-4" />
                                                        <p className="font-bold text-lg text-white">No presentation URL provided</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {(!activeLesson.type || activeLesson.type === 'TEXT') && (
                                            <div className="w-full max-w-5xl mx-auto py-12 px-8 relative">
                                                <div className="bg-background rounded-3xl p-8 border border-border/50">
                                                    <h2 className="text-4xl font-black mb-6 border-b border-border/50 pb-4 text-foreground">{activeLesson.title}</h2>
                                                    <div className="prose prose-invert max-w-none prose-lg">
                                                        <p className="whitespace-pre-wrap text-foreground">{activeLesson.content || "No text content provided."}</p>
                                                    </div>
                                                    <div id="text-lesson-end" className="h-[1px] w-full mt-8" />
                                                </div>
                                            </div>
                                        )}

                                        {activeLesson.type === 'QUIZ' && (
                                            <div className="w-full max-w-4xl mx-auto py-12 px-8">
                                                {!quizStarted && !quizResult ? (
                                                    <div className="text-center py-16 space-y-6 glassmorphism rounded-3xl border border-white/10 p-12">
                                                        <h2 className="text-4xl font-black text-white">{activeLesson.quiz?.title || 'Course Quiz'}</h2>
                                                        <div className="space-y-2">
                                                            <p className="text-muted-foreground uppercase tracking-widest text-xs font-bold">Passing Score: {activeLesson.quiz?.passingScore || 70}%</p>
                                                            {activeLesson.quiz?.maxAttempts > 0 && (
                                                                (() => {
                                                                    const remaining = activeLesson.quiz.maxAttempts - currentAttempts;
                                                                    return (
                                                                        <p className={`uppercase tracking-widest text-xs font-black ${
                                                                            remaining <= 0 ? 'text-red-400' : remaining === 1 ? 'text-amber-400' : 'text-muted-foreground'
                                                                        }`}>
                                                                            {remaining <= 0 ? '0 Attempts Remaining' : `${remaining} Attempt${remaining !== 1 ? 's' : ''} Remaining`}
                                                                        </p>
                                                                    );
                                                                })()
                                                            )}
                                                        </div>
                                                        {activeLesson.quiz?.maxAttempts > 0 && currentAttempts >= activeLesson.quiz.maxAttempts ? (
                                                            <div className="mt-8 space-y-3">
                                                                <div className="inline-flex items-center gap-3 px-8 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                                                    <span className="font-black text-red-400 uppercase tracking-widest text-sm">No Attempts Remaining</span>
                                                                </div>
                                                                <p className="text-muted-foreground text-xs">You have used all {activeLesson.quiz.maxAttempts} attempt{activeLesson.quiz.maxAttempts !== 1 ? 's' : ''} for this quiz. Contact your instructor if you need assistance.</p>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                disabled={fetchingAttempts}
                                                                onClick={startQuiz} 
                                                                className="mt-8 px-12 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                                                            >
                                                                {fetchingAttempts ? 'Checking Eligibility...' : 'Start Quiz'}
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : quizResult ? (
                                                    <div className="text-center py-16 space-y-6 glassmorphism rounded-3xl border border-white/10 p-12">
                                                        <h2 className="text-4xl font-black text-white">{quizResult.passed ? 'Passed!' : 'Try Again'}</h2>
                                                        <p className="text-xl text-white">Score: <span className="font-black">{quizResult.score}%</span></p>
                                                        {(!quizResult.passed) && (
                                                            <button onClick={startQuiz} className="px-8 py-3 bg-secondary rounded-xl font-bold mt-4">Retry Knowledge Check</button>
                                                        )}
                                                        {quizResult.passed && (
                                                            <button onClick={handleNext} className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold mt-4">Continue to Next Lesson</button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="glassmorphism rounded-3xl border border-white/10 p-12 space-y-8 shadow-2xl">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Question {currentQuestionIdx + 1} of {randomizedQuestions.length}</span>
                                                            <div className="h-1.5 w-32 bg-secondary/50 rounded-full overflow-hidden">
                                                                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((currentQuestionIdx + 1) / randomizedQuestions.length) * 100}%` }} />
                                                            </div>
                                                        </div>

                                                        {(() => {
                                                            const currentQ = randomizedQuestions[currentQuestionIdx];
                                                            const qType = currentQ?.type || 'MULTIPLE_CHOICE';
                                                            
                                                            // Diagnostic log
                                                            console.log('Quiz Question Render:', {
                                                                index: currentQuestionIdx,
                                                                text: currentQ?.text,
                                                                type: currentQ?.type,
                                                                options: currentQ?.options?.length
                                                            });

                                                            if (qType === 'FILL_BLANK') {
                                                                return (
                                                                    <>
                                                                        <div className="space-y-2">
                                                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fill in the Blank</span>
                                                                            <h3 className="text-3xl font-black leading-tight text-white">{currentQ?.text}</h3>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Type your answer here..."
                                                                            value={userAnswers[currentQuestionIdx] as string || ''}
                                                                            onChange={(e) => {
                                                                                const newAns = [...userAnswers];
                                                                                newAns[currentQuestionIdx] = e.target.value;
                                                                                setUserAnswers(newAns);
                                                                                setQuizError(false);
                                                                            }}
                                                                            className="w-full bg-secondary/20 border border-white/10 rounded-2xl px-6 py-5 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground transition-all"
                                                                        />
                                                                    </>
                                                                );
                                                            }

                                                            if (qType === 'MULTIPLE_SELECT') {
                                                                const selected: number[] = Array.isArray(userAnswers[currentQuestionIdx]) ? userAnswers[currentQuestionIdx] as number[] : [];
                                                                return (
                                                                    <>
                                                                        <div className="space-y-2">
                                                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Multiple Select</span>
                                                                            <h3 className="text-3xl font-black leading-tight text-white">{currentQ?.text}</h3>
                                                                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 w-fit mt-1">
                                                                                <span className="text-blue-400 text-xs font-black">☑ Check all correct answers.</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 gap-4">
                                                                            {currentQ?.options.map((opt: any, idx: number) => {
                                                                                const isSelected = selected.includes(idx);
                                                                                return (
                                                                                    <button key={idx} onClick={() => {
                                                                                        const newAns = [...userAnswers];
                                                                                        const cur: number[] = Array.isArray(newAns[currentQuestionIdx]) ? [...(newAns[currentQuestionIdx] as number[])] : [];
                                                                                        if (cur.includes(idx)) {
                                                                                            newAns[currentQuestionIdx] = cur.filter(i => i !== idx);
                                                                                        } else {
                                                                                            newAns[currentQuestionIdx] = [...cur, idx];
                                                                                        }
                                                                                        setUserAnswers(newAns);
                                                                                        setQuizError(false);
                                                                                    }} className={`p-6 rounded-2xl border text-left transition-all group ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'bg-secondary/20 border-white/5 hover:bg-secondary/40'}`}>
                                                                                        <div className="flex items-center gap-4">
                                                                                            <div className={`w-8 h-8 rounded-md border-2 flex items-center justify-center font-black ${isSelected ? 'bg-white text-primary border-white' : 'border-white/10 group-hover:border-white/30'}`}>
                                                                                                {isSelected ? <CheckCircle2 size={16} /> : String.fromCharCode(65 + idx)}
                                                                                            </div>
                                                                                            <span className="font-bold text-lg">{opt.text}</span>
                                                                                        </div>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </>
                                                                );
                                                            }

                                                            // Default: MULTIPLE_CHOICE
                                                            return (
                                                                <>
                                                                    <h3 className="text-3xl font-black leading-tight text-white">{currentQ?.text}</h3>
                                                                    <div className="grid grid-cols-1 gap-4">
                                                                        {currentQ?.options.map((opt: any, idx: number) => (
                                                                            <button key={idx} onClick={() => {
                                                                                const newAns = [...userAnswers];
                                                                                newAns[currentQuestionIdx] = idx;
                                                                                setUserAnswers(newAns);
                                                                                setQuizError(false);
                                                                            }} className={`p-6 rounded-2xl border text-left transition-all group ${userAnswers[currentQuestionIdx] === idx ? 'bg-primary border-primary text-primary-foreground' : 'bg-secondary/20 border-white/5 hover:bg-secondary/40'}`}>
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black ${userAnswers[currentQuestionIdx] === idx ? 'bg-white text-primary border-white' : 'border-white/10 group-hover:border-white/30'}`}>{String.fromCharCode(65 + idx)}</div>
                                                                                    <span className="font-bold text-lg">{opt.text}</span>
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}

                                                        {quizError && (
                                                            <div className="flex items-center gap-2 text-red-400 font-bold text-sm animate-bounce mt-4 bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                                                                <AlertCircle size={16} />
                                                                <span>Please provide an answer to proceed</span>
                                                            </div>
                                                        )}

                                                        <div className="flex gap-4 pt-6">
                                                            {currentQuestionIdx > 0 && <button onClick={() => { setCurrentQuestionIdx(prev => prev - 1); setQuizError(false); }} className="px-8 py-4 bg-secondary text-foreground rounded-2xl font-black">Previous</button>}
                                                            {currentQuestionIdx < randomizedQuestions.length - 1 ? (
                                                                <button onClick={() => {
                                                                    const ans = userAnswers[currentQuestionIdx];
                                                                    const qType = randomizedQuestions[currentQuestionIdx]?.type || 'MULTIPLE_CHOICE';
                                                                    const isEmpty = qType === 'FILL_BLANK' ? !ans || (ans as string).trim() === '' :
                                                                                    qType === 'MULTIPLE_SELECT' ? !Array.isArray(ans) || (ans as number[]).length === 0 :
                                                                                    ans === undefined;
                                                                    if (isEmpty) { setQuizError(true); return; }
                                                                    setCurrentQuestionIdx(prev => prev + 1);
                                                                    setQuizError(false);
                                                                }} className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs">Next Question</button>
                                                            ) : (
                                                                <button onClick={async () => {
                                                                    const ans = userAnswers[currentQuestionIdx];
                                                                    const qType = randomizedQuestions[currentQuestionIdx]?.type || 'MULTIPLE_CHOICE';
                                                                    const isEmpty = qType === 'FILL_BLANK' ? !ans || (ans as string).trim() === '' :
                                                                                    qType === 'MULTIPLE_SELECT' ? !Array.isArray(ans) || (ans as number[]).length === 0 :
                                                                                    ans === undefined;
                                                                    if (isEmpty) { setQuizError(true); return; }
                                                                    setSubmittingQuiz(true);

                                                                    // Build answers payload based on question type
                                                                    const answersToSubmit = randomizedQuestions.map((q: any, idx: number) => {
                                                                        const type = q.type || 'MULTIPLE_CHOICE';
                                                                        if (type === 'FILL_BLANK') {
                                                                            return { questionId: q.id, fillAnswer: (userAnswers[idx] as string)?.trim() || '' };
                                                                        } else if (type === 'MULTIPLE_SELECT') {
                                                                            const sel: number[] = Array.isArray(userAnswers[idx]) ? userAnswers[idx] as number[] : [];
                                                                            return { questionId: q.id, optionIds: sel.map((i: number) => q.options[i]?.id).filter(Boolean) };
                                                                        } else {
                                                                            return { questionId: q.id, optionId: q.options[userAnswers[idx] as number]?.id };
                                                                        }
                                                                    });

                                                                    const uid = localStorage.getItem(`${domain}_userId`);
                                                                    const res = await fetch(`/api/t/${domain}/quiz-attempts`, {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ quizId: activeLesson.quiz.id, userId: uid, answers: answersToSubmit })
                                                                    });
                                                                    const result = await res.json();

                                                                    setCurrentAttempts(prev => prev + 1);
                                                                    setQuizResult({ score: result.score, passed: result.passed });
                                                                    if (result.passed) markLessonComplete(activeLesson.id);
                                                                    setSubmittingQuiz(false);
                                                                }} disabled={submittingQuiz} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs">
                                                                    {submittingQuiz ? 'Submitting...' : 'Finish Knowledge Check'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* ── TABS SECTION ── */}
                                <div className="w-full max-w-5xl mx-auto px-8 py-6">
                                    <div className="flex justify-between items-end border-b border-border/50 pb-4 mb-8">
                                        <div className="flex gap-8">
                                            {(['overview', 'resources', 'notes', 'reviews']).map(tab => (
                                                <button key={tab} onClick={() => setActiveTab(tab)} className={`text-lg font-bold pb-4 -mb-4 border-b-4 transition-colors ${activeTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {completedLessonIds.includes(activeLesson?.id) && (
                                                <div className="px-6 py-2.5 rounded-xl text-sm font-black tracking-wide border bg-emerald-500/10 border-emerald-500/20 text-emerald-500 flex items-center gap-2">
                                                    ✓ Completed
                                                </div>
                                            )}
                                            <button onClick={handleNext} disabled={currentLessonIdx === allActiveLessons.length - 1} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black disabled:opacity-20 hover:scale-105">
                                                Next &rarr;
                                            </button>
                                        </div>
                                    </div>

                                    {activeTab === 'overview' && (
                                        <div className="space-y-12 animate-in fade-in pb-20">
                                            <h2 className="text-3xl font-black max-w-3xl leading-snug">{course.description || "Course description currently unavailable."}</h2>

                                            <div className="flex items-center gap-6 divide-x divide-border">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-amber-500 flex items-center gap-1"><Star className="fill-amber-500" size={16} /> {(reviewsData.averageRating || 0).toFixed(1)}</span>
                                                    <span className="text-muted-foreground text-sm">({reviewsData.totalReviews} ratings)</span>
                                                </div>
                                                <div className="pl-6 text-sm font-bold">{course._count?.enrollments || 0} Students</div>
                                                <div className="pl-6 text-sm font-bold flex items-center gap-2"><Trophy size={16} className="text-primary" /> Certificate of Completion</div>
                                            </div>

                                            {/* Schedule learning time widget */}
                                            <div className="p-6 rounded-3xl border border-secondary bg-secondary/10 flex justify-between items-center sm:flex-row flex-col gap-4 shadow-sm relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                                                <div className="z-10">
                                                    <h3 className="font-black text-lg mb-1 flex items-center gap-2"><Clock size={18} className="text-primary" /> Schedule learning time</h3>
                                                    <p className="text-sm text-muted-foreground max-w-xl">Learning a little each day adds up. Research shows that students who make learning a habit are more likely to reach their goals. Set time aside to learn and get reminders.</p>
                                                </div>
                                                <button className="z-10 px-6 py-2 bg-background border border-border text-foreground font-bold rounded-xl whitespace-nowrap hover:bg-secondary shadow-sm">Get started</button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pt-6 border-t border-border/50">
                                                <div className="space-y-4">
                                                    <h3 className="font-bold text-muted-foreground text-sm tracking-widest uppercase">By the numbers</h3>
                                                    <ul className="space-y-3 text-sm font-medium">
                                                        <li className="flex justify-between border-b border-border/50 pb-2"><span>Skill level:</span> <span className="font-bold">{course.skillLevel || 'All Levels'}</span></li>
                                                        <li className="flex justify-between border-b border-border/50 pb-2"><span>Students:</span> <span className="font-bold">{course._count?.enrollments || 0}</span></li>
                                                        <li className="flex justify-between border-b border-border/50 pb-2"><span>Languages:</span> <span className="font-bold">{course.languages || 'English'}</span></li>
                                                        <li className="flex justify-between border-b border-border/50 pb-2"><span>Captions:</span> <span className="font-bold">{course.captions ? 'Yes' : 'No'}</span></li>
                                                    </ul>
                                                </div>
                                                <div className="space-y-4">
                                                    <h3 className="font-bold text-muted-foreground text-sm tracking-widest uppercase">Course Content</h3>
                                                    <ul className="space-y-3 text-sm font-medium">
                                                        <li className="flex justify-between border-b border-border/50 pb-2"><span>Total Modules:</span> <span className="font-bold">{course.modules?.length || 0}</span></li>
                                                        <li className="flex justify-between border-b border-border/50 pb-2"><span>Total Lessons:</span> <span className="font-bold">{allActiveLessons.length}</span></li>
                                                    </ul>
                                                </div>
                                                <div className="space-y-4">
                                                    <h3 className="font-bold text-muted-foreground text-sm tracking-widest uppercase">Description</h3>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 'notes' && (
                                        <div className="space-y-8 animate-in fade-in pb-20">
                                            {/* Add Note Section */}
                                            <div className="p-6 rounded-3xl border border-primary/20 bg-primary/5 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-lg">Take a New Note</h3>
                                                        <p className="text-sm text-muted-foreground">Notes are automatically synced to the current video timestamp.</p>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <textarea 
                                                        value={newNote}
                                                        onChange={(e) => setNewNote(e.target.value)}
                                                        placeholder="What's on your mind? Capture a key concept or a reminder..."
                                                        className="w-full bg-background border border-border/50 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[120px] shadow-sm transition-all"
                                                    />
                                                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                                        <span className="text-[10px] font-black uppercase text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                                                            At {videoRef.current ? Math.floor(videoRef.current.currentTime / 60) : 0}:{String(Math.floor((videoRef.current?.currentTime || 0) % 60)).padStart(2, '0')}
                                                        </span>
                                                        <button 
                                                            onClick={handleAddNote}
                                                            disabled={submittingNote || !newNote.trim()}
                                                            className="px-6 py-2 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                                                        >
                                                            {submittingNote ? 'Saving...' : 'Save Note'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes List */}
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-black flex items-center gap-2">
                                                    <Clock className="text-primary" size={20} /> Your Personal Notes ({notes.length})
                                                </h3>
                                                {notes.length === 0 ? (
                                                    <div className="py-20 text-center space-y-4 glassmorphism rounded-3xl border border-dashed border-border/50">
                                                        <Target className="w-16 h-16 mx-auto text-muted-foreground opacity-20" />
                                                        <p className="text-xl font-bold text-muted-foreground italic">Your personal notes will appear here.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-4">
                                                        {notes.map((note) => (
                                                            <div key={note.id} className="group p-6 rounded-2xl border border-border/50 glassmorphism hover:border-primary/30 transition-all space-y-3 relative">
                                                                <div className="flex justify-between items-start">
                                                                    <button 
                                                                        onClick={() => {
                                                                            if (videoRef.current) {
                                                                                videoRef.current.currentTime = note.timestamp;
                                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                            }
                                                                        }}
                                                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all group/time"
                                                                    >
                                                                        <PlayCircle size={14} className="group-hover/time:scale-125 transition-transform" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                                                            {Math.floor(note.timestamp / 60)}:{String(Math.floor(note.timestamp % 60)).padStart(2, '0')}
                                                                        </span>
                                                                    </button>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] text-muted-foreground font-medium">{new Date(note.createdAt).toLocaleDateString()}</span>
                                                                        <button 
                                                                            onClick={() => handleDeleteNote(note.id)}
                                                                            className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm leading-relaxed text-foreground font-medium">{note.content}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'resources' && (
                                        <div className="space-y-12 animate-in fade-in pb-20">
                                            {(() => {
                                                const activeModule = course.modules.find((m: any) => m.lessons.some((l: any) => l.id === activeLesson.id));
                                                
                                                // 1. Direct Lesson Resources
                                                const lessonRes = (activeLesson.resources || []).filter((res: any) => 
                                                    res.url !== activeLesson.videoUrl && 
                                                    res.url !== activeLesson.pdfUrl &&
                                                    res.type !== 'SUBTITLE'
                                                );

                                                // 2. Direct Module Resources (plus legacy lesson aggregation if desired, but let's stick to direct/clear for now as per user request for "disconnect")
                                                // Actually, let's include BOTH: direct module resources AND all resources from lessons in this module.
                                                const moduleRes = [
                                                    ...(activeModule?.resources || []),
                                                    ...((activeModule?.lessons || []).flatMap((l: any) => 
                                                        (l.resources || []).filter((res: any) => res.url !== l.videoUrl && res.url !== l.pdfUrl && res.type !== 'SUBTITLE')
                                                    ))
                                                ];
                                                const uniqueModuleRes = Array.from(new Map(moduleRes.map((item: any) => [item['url'], item])).values());

                                                // 3. Direct Course Resources (plus all from all modules)
                                                const courseRes = [
                                                    ...(course.resources || []),
                                                    ...(course.modules.flatMap((m: any) => 
                                                        m.lessons.flatMap((l: any) => 
                                                            (l.resources || []).filter((res: any) => res.url !== l.videoUrl && res.url !== l.pdfUrl && res.type !== 'SUBTITLE')
                                                        )
                                                    ))
                                                ];
                                                const uniqueCourseRes = Array.from(new Map(courseRes.map((item: any) => [item['url'], item])).values());

                                                const totalCount = lessonRes.length + uniqueModuleRes.length + uniqueCourseRes.length;

                                                if (totalCount === 0) {
                                                    return (
                                                        <div className="py-20 text-center space-y-4">
                                                            <Archive className="w-16 h-16 mx-auto text-muted-foreground opacity-20" />
                                                            <p className="text-xl font-bold text-muted-foreground">No resources found</p>
                                                            <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">There are no additional documents or files attached to this lesson, module, or course.</p>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="space-y-12">
                                                        {/* Lesson Resources */}
                                                        {lessonRes.length > 0 && (
                                                            <div>
                                                                <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                                                                    <BookOpen className="text-primary" size={20} /> Lesson Resources
                                                                </h3>
                                                                <div className="grid gap-4">
                                                                    {lessonRes.map((res: any, idx: number) => (
                                                                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-border/50 glassmorphism hover:bg-secondary/20 transition-colors">
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                                                                    <FileText size={20} />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-bold">{res.name}</p>
                                                                                    <p className="text-sm text-muted-foreground uppercase tracking-widest">{res.type} &middot; {res.size ? `${Math.round(res.size / 1024)} KB` : 'Direct Link'}</p>
                                                                                </div>
                                                                            </div>
                                                                            <a href={res.url} download target="_blank" onClick={() => logActivity('DOWNLOAD_RESOURCE', { resourceName: res.name, resourceUrl: res.url, lessonId: activeLesson.id, level: 'LESSON' })} className="px-6 py-2 rounded-xl bg-secondary hover:bg-secondary/80 font-bold transition-colors border border-border/50 text-sm">Download</a>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Module Resources */}
                                                        {uniqueModuleRes.length > 0 && (
                                                            <div>
                                                                <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                                                                    <Layers className="text-primary" size={20} /> Module Resources
                                                                </h3>
                                                                <div className="grid gap-4">
                                                                    {uniqueModuleRes.map((res: any, idx: number) => (
                                                                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-border/50 glassmorphism hover:bg-secondary/20 transition-colors opacity-90">
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="w-12 h-12 rounded-full bg-secondary/30 text-muted-foreground flex items-center justify-center">
                                                                                    <FileText size={20} />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-bold">{res.name}</p>
                                                                                    <p className="text-sm text-muted-foreground uppercase tracking-widest">{res.type}</p>
                                                                                </div>
                                                                            </div>
                                                                            <a href={res.url} download target="_blank" onClick={() => logActivity('DOWNLOAD_RESOURCE', { resourceName: res.name, resourceUrl: res.url, lessonId: activeLesson.id, level: 'MODULE' })} className="px-6 py-2 rounded-xl bg-secondary hover:bg-secondary/80 font-bold transition-colors border border-border/50 text-sm">Download</a>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Course Resources */}
                                                        {uniqueCourseRes.length > 0 && (
                                                            <div>
                                                                <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                                                                    <Archive className="text-primary" size={20} /> Course Resources
                                                                </h3>
                                                                <div className="grid gap-4">
                                                                    {uniqueCourseRes.map((res: any, idx: number) => (
                                                                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-border/50 glassmorphism hover:bg-secondary/20 transition-colors opacity-70">
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="w-12 h-12 rounded-full bg-secondary/30 text-muted-foreground flex items-center justify-center">
                                                                                    <FileText size={20} />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-bold">{res.name}</p>
                                                                                    <p className="text-sm text-muted-foreground uppercase tracking-widest">{res.type}</p>
                                                                                </div>
                                                                            </div>
                                                                            <a href={res.url} download target="_blank" onClick={() => logActivity('DOWNLOAD_RESOURCE', { resourceName: res.name, resourceUrl: res.url, lessonId: activeLesson.id, level: 'COURSE' })} className="px-6 py-2 rounded-xl bg-secondary hover:bg-secondary/80 font-bold transition-colors border border-border/50 text-sm">Download</a>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                    {activeTab === 'reviews' && (
                                        <div className="space-y-12 animate-in fade-in pb-20">
                                            {/* Summary & Form */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 flex flex-col items-center justify-center text-center space-y-2 text-white">
                                                    <span className="text-6xl font-black text-primary">{(reviewsData.averageRating || 0).toFixed(1)}</span>
                                                    <div className="flex gap-1 text-amber-500">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={20} fill={i < Math.round(reviewsData.averageRating) ? 'currentColor' : 'none'} className={i < Math.round(reviewsData.averageRating) ? '' : 'text-muted-foreground/30'} />
                                                        ))}
                                                    </div>
                                                    <p className="text-sm font-bold text-muted-foreground mt-2">{reviewsData.totalReviews} Course Reviews</p>
                                                </div>

                                                <div className="lg:col-span-2 p-8 rounded-3xl border border-border/50 glassmorphism space-y-6">
                                                    <div>
                                                        <h3 className="text-xl font-black mb-1">How would you rate this course?</h3>
                                                        <p className="text-sm text-muted-foreground">Your feedback helps us improve and helps other students decide.</p>
                                                    </div>
                                                    
                                                    <div className="flex gap-3">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <button 
                                                                key={s}
                                                                onClick={() => setNewReviewRating(s)}
                                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${newReviewRating >= s ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-secondary text-muted-foreground'}`}
                                                            >
                                                                <Star size={20} fill={newReviewRating >= s ? 'currentColor' : 'none'} />
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <textarea 
                                                        value={newReviewComment}
                                                        onChange={(e) => setNewReviewComment(e.target.value)}
                                                        placeholder="What did you like? What could be improved?"
                                                        className="w-full bg-background border border-border/50 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] shadow-sm transition-all"
                                                    />

                                                    <button 
                                                        onClick={handleSubmitReview}
                                                        disabled={submittingReview}
                                                        className="px-8 py-3 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                                                    >
                                                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Reviews List */}
                                            <div className="space-y-6">
                                                <h3 className="text-2xl font-black flex items-center gap-2">
                                                    <Users className="text-primary" size={24} /> Community Feedback
                                                </h3>
                                                {reviewsData.reviews.length === 0 ? (
                                                    <div className="py-12 text-center text-muted-foreground italic glassmorphism rounded-3xl border border-dashed border-border/50">
                                                        No reviews yet. Be the first to share your thoughts!
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-6">
                                                        {reviewsData.reviews.map((review: any) => (
                                                            <div key={review.id} className="p-8 rounded-3xl border border-border/50 glassmorphism space-y-4">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-black text-primary border border-border">
                                                                            {review.user?.name ? review.user.name[0].toUpperCase() : 'S'}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-lg">{review.user?.name || 'Anonymous'}</p>
                                                                            <div className="flex gap-1 text-amber-500 scale-90 origin-left">
                                                                                {[...Array(5)].map((_, i) => (
                                                                                    <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} className={i < review.rating ? '' : 'text-muted-foreground/30'} />
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-muted-foreground leading-relaxed font-medium">{review.content}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                            ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center text-center p-12 space-y-4 pt-32">
                                <div className="w-24 h-24 rounded-3xl bg-secondary flex items-center justify-center">
                                    <Lock className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-2xl font-black">Select a lesson to begin</h3>
                                <p className="text-muted-foreground">Use the course content menu to navigate and start learning.</p>
                            </div>
                    )}
                        </div>
            </main>

            {/* Sidebar - Course Structure (Right Side) */}
            <aside className={`fixed inset-y-0 right-0 z-50 w-[380px] bg-background border-l border-white/5 transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-secondary/10">
                    <h2 className="text-lg font-black tracking-tight">Course content</h2>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                    {!sidebarOpen && <div />}
                </div>

                <div className="flex-1 overflow-y-auto bg-background">
                    {course.modules?.filter((m: any) => m.isActive !== false && m.lessons?.some((l: any) => l.isActive !== false)).map((module: any, mIdx: number) => {
                        const isExpanded = expandedModules[module.id] !== false; // default to true
                        return (
                            <div key={module.id} className="border-b border-white/5 pb-0 bg-secondary/5">
                                <button onClick={() => toggleModule(module.id)} className="w-full flex justify-between items-center p-5 hover:bg-secondary/20 transition-colors text-left group">
                                    <div className="flex-1 pr-4">
                                        <h3 className="font-bold text-[15px] leading-tight group-hover:text-primary transition-colors">Section {mIdx + 1}: {module.title}</h3>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground/60 mt-1.5">{module.lessons?.filter((l: any) => l.isActive !== false).length} lessons</p>
                                    </div>
                                    <div className="text-muted-foreground">
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="bg-background pt-1">
                                        {module.lessons?.filter((l: any) => l.isActive !== false).map((lesson: any, lIdx: number) => (
                                            <button
                                                key={lesson.id}
                                                onClick={() => {
                                                    if (isLessonLocked(lesson.id)) return;
                                                    const uid = localStorage.getItem(`${domain}_userId`);
                                                    if (uid && lesson.id) trackLessonStart(uid, lesson.id);
                                                    setActiveLesson(lesson);
                                                    if (window.innerWidth < 1024) setSidebarOpen(false);
                                                }}
                                                className={`w-full text-left px-5 py-3 flex gap-4 transition-all ${isLessonLocked(lesson.id) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary/20 group'} ${activeLesson?.id === lesson.id ? 'bg-primary/5' : ''}`}
                                            >
                                                <div className="mt-1 shrink-0 px-2">
                                                    {isLessonLocked(lesson.id) ? (
                                                        <div className="w-4 h-4 text-muted-foreground flex items-center justify-center"><Lock size={14} /></div>
                                                    ) : completedLessonIds.includes(lesson.id) ? (
                                                        <div className="w-4 h-4 text-emerald-500 rounded flex items-center justify-center"><CheckCircle2 size={16} /></div>
                                                    ) : (
                                                        <input type="checkbox" checked={false} readOnly className="w-4 h-4 rounded-sm border-2 border-muted-foreground/50 bg-transparent group-hover:border-primary cursor-pointer" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[14px] leading-snug ${activeLesson?.id === lesson.id ? 'font-bold text-primary' : 'font-medium'}`}>
                                                        {lIdx + 1}. {lesson.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground font-medium">
                                                        {lesson.type === 'VIDEO' ? <PlayCircle size={12} /> : <FileText size={12} />}
                                                        <span>{lesson.type === 'VIDEO' ? '15min' : '5min'}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </aside>
        </div>
        
        {/* Toast Notification Overlay */}
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
            {toasts.map(toast => (
                <div 
                    key={toast.id} 
                    className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300 ${
                        toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
                    }`}
                >
                    {toast.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
                    <p className="font-bold text-sm tracking-tight">{toast.message}</p>
                </div>
            ))}
        </div>
    </>
    );
}
