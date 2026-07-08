'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Globe, Plus, Loader2, BookOpen, Users, ChevronRight,
    ChevronDown, Trash2, Edit3, CheckCircle2, XCircle,
    Eye, EyeOff, Layers, Video, FileText, HelpCircle,
    Archive, Mic, ShoppingCart, Sparkles, Settings, BarChart3,
    Clock, UserCheck, CheckCircle, Info, Activity,
    Calendar, Filter, TrendingUp, Target, Users2,
    Lock, UsersRound, Megaphone, ChevronLeft,
    AlertCircle, Award, Cpu, ShieldCheck, Share2, Save, Upload, ArrowLeft, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { uploadFile } from '@/lib/upload';

const showSwal = async (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info') => {
    if (typeof window === 'undefined') return;
    const win = window as any;
    if (!win.Swal) {
        // Load CSS
        if (!document.getElementById('sweetalert2-css')) {
            const link = document.createElement('link');
            link.id = 'sweetalert2-css';
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css';
            document.head.appendChild(link);
        }
        // Load JS
        await new Promise<void>((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.body.appendChild(script);
        });
    }
    if (win.Swal) {
        return win.Swal.fire({
            title,
            text,
            icon,
            background: 'var(--background)',
            color: 'var(--foreground)',
            customClass: {
                popup: 'rounded-[2rem] border border-border bg-background text-foreground shadow-2xl p-8',
                title: 'text-lg font-black uppercase tracking-tight text-foreground !m-0 !pt-2 font-sans',
                htmlContainer: 'text-sm text-muted-foreground font-medium !mt-2 !mb-6 font-sans',
                confirmButton: 'px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-xl shadow-indigo-500/20 cursor-pointer font-sans'
            },
            buttonsStyling: false
        });
    } else {
        alert(`${title}: ${text}`);
    }
};

interface GlobalCourse {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    skillLevel: string;
    isPublished: boolean;
    modules: GlobalModule[];
    resources: GlobalResource[];
    _count: { marketplaceClaims: number };
    courseCreateCount?: number;
}
type GlobalModule = {
    id: string;
    title: string;
    order: number;
    isActive: boolean;
    lessons: GlobalLesson[];
    resources: GlobalResource[];
};

interface GlobalLesson {
    id: string;
    title: string;
    type: string;
    order: number;
    content: string | null;
    videoUrl: string | null;
    pdfUrl: string | null;
    isActive: boolean;
    transcript?: string;
    transcriptStatus?: string;
    resources: GlobalResource[];
    quiz?: any;
}

interface GlobalResource {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number | null;
    createdAt: string | Date;
}

interface GlobalStats {
    totalClaims: number;
    totalEnrollments: number;
    totalCompletions: number;
    avgCompletionRate: number;
    learnerStats: any[];
    tenantBreakdown: any[];
}

export default function GlobalMarketplacePage() {
    const [courses, setCourses] = useState<GlobalCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<GlobalCourse | null>(null);
    const [activeTab, setActiveTab] = useState<'courses' | 'stats' | 'claims'>('courses');
    const [courseFilter, setCourseFilter] = useState<'all' | 'published' | 'draft'>('all');

    // UI States
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<any>({});

    // Course Form
    const [courseForm, setCourseForm] = useState({
        title: '',
        description: '',
        thumbnail: '',
        skillLevel: 'All Levels',
        isPublished: false,
        courseCreateCount: 0
    });

    // Builder State
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [moduleEditTitle, setModuleEditTitle] = useState('');
    const [activeLessonForms, setActiveLessonForms] = useState<Record<string, boolean>>({});
    const [newLessonForms, setNewLessonForms] = useState<Record<string, any>>({});
    const [editingLessonIds, setEditingLessonIds] = useState<Record<string, string | null>>({});
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

    // Quiz Builder
    const [activeQuizLesson, setActiveQuizLesson] = useState<{ moduleId: string; lessonId: string } | null>(null);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [quizForm, setQuizForm] = useState({
        title: '',
        description: '',
        passingScore: 70,
        questions: [] as any[],
        isRandomized: false,
        randomCount: 0
    });

    // Stats State
    const [courseStats, setCourseStats] = useState<GlobalStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);

    const [managingResources, setManagingResources] = useState<{ id: string; type: 'COURSE' | 'MODULE' | 'LESSON'; name: string; resources: any[] } | null>(null);
    const [isDeletingResource, setIsDeletingResource] = useState<string | null>(null);

    // Global Metadata
    const [globalStatsOverview, setGlobalStatsOverview] = useState<any>(null);
    const [claimsRegistry, setClaimsRegistry] = useState<any[]>([]);
    const [loadingGlobal, setLoadingGlobal] = useState(false);

    const getValidationError = (key: string): string | null => {
        if (!validationErrors) return null;
        const err = validationErrors[key];
        if (!err) return null;
        if (typeof err === 'string') return err;
        if (typeof err === 'object' && err.title) return err.title;
        return null;
    };

    const fetchCourses = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/global-courses');
            const data = await res.json();
            setCourses(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const fetchGlobalStats = async () => {
        setLoadingGlobal(true);
        try {
            const res = await fetch('/api/admin/global-courses/stats-overview');
            if (res.ok) setGlobalStatsOverview(await res.json());
        } catch (e) { console.error(e); } finally { setLoadingGlobal(false); }
    };

    const fetchClaimsRegistry = async () => {
        setLoadingGlobal(true);
        try {
            const res = await fetch('/api/admin/global-courses/claims');
            if (res.ok) setClaimsRegistry(await res.json());
        } catch (e) { console.error(e); } finally { setLoadingGlobal(false); }
    };

    useEffect(() => {
        if (activeTab === 'stats' && !globalStatsOverview) fetchGlobalStats();
        if (activeTab === 'claims' && claimsRegistry.length === 0) fetchClaimsRegistry();
    }, [activeTab]);

    const fetchCourseDetails = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/global-courses/${id}`);
            const data = await res.json();
            setSelectedCourse(data);
            fetchCourseStats(id);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourseStats = async (id: string, openModal = false) => {
        setLoadingStats(true);
        try {
            const res = await fetch(`/api/admin/global-courses/${id}/stats`);
            if (res.ok) {
                setCourseStats(await res.json());
                if (openModal) setShowStatsModal(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingStats(false);
        }
    };

    const createCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationErrors({});
        const errors: any = {};

        if (!courseForm.title.trim()) {
            errors.title = 'Blueprint Title is required';
        }
        if (!courseForm.description?.trim()) {
            errors.description = 'Mission Abstract is required';
        }

        // Check for duplicate name
        if (courseForm.title.trim()) {
            const titleExists = courses.some(c => c.title.trim().toLowerCase() === courseForm.title.trim().toLowerCase());
            if (titleExists) {
                errors.title = 'Blueprint Title already exists';
            }
        }

        // Check for duplicate description
        if (courseForm.description?.trim()) {
            const descExists = courses.some(c => c.description?.trim().toLowerCase() === courseForm.description.trim().toLowerCase());
            if (descExists) {
                errors.description = 'Mission Abstract already exists';
            }
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        try {
            const res = await fetch('/api/admin/global-courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseForm)
            });
            if (res.ok) {
                const data = await res.json();
                await fetchCourses();
                setShowCourseModal(false);
                fetchCourseDetails(data.id);
                showSwal('Success', 'Blueprint forged successfully!', 'success');
            } else {
                const data = await res.json();
                showSwal('Error', data.error || 'Failed to forge blueprint', 'error');
            }
        } catch (e) {
            console.error(e);
            showSwal('Error', 'An error occurred', 'error');
        }
    };

    const updateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse) return;

        setValidationErrors({});
        const errors: any = {};

        if (!courseForm.title.trim()) {
            errors.title = 'Blueprint Title is required';
        }
        if (!courseForm.description?.trim()) {
            errors.description = 'Mission Abstract is required';
        }

        // Check for duplicate name
        if (courseForm.title.trim()) {
            const titleExists = courses.some(c => c.title.trim().toLowerCase() === courseForm.title.trim().toLowerCase() && c.id !== selectedCourse.id);
            if (titleExists) {
                errors.title = 'Blueprint Title already exists';
            }
        }

        // Check for duplicate description
        if (courseForm.description?.trim()) {
            const descExists = courses.some(c => c.description?.trim().toLowerCase() === courseForm.description.trim().toLowerCase() && c.id !== selectedCourse.id);
            if (descExists) {
                errors.description = 'Mission Abstract already exists';
            }
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        try {
            const res = await fetch(`/api/admin/global-courses/${selectedCourse.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseForm)
            });
            if (res.ok) {
                await fetchCourses();
                await fetchCourseDetails(selectedCourse.id);
                setShowCourseModal(false);
                showSwal('Success', 'Blueprint refined successfully!', 'success');
            } else {
                const data = await res.json();
                showSwal('Error', data.error || 'Failed to refine blueprint', 'error');
            }
        } catch (e) {
            console.error(e);
            showSwal('Error', 'An error occurred', 'error');
        }
    };

    const deleteCourse = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        if (typeof window === 'undefined') return;
        const win = window as any;
        if (!win.Swal) {
            // Load CSS
            if (!document.getElementById('sweetalert2-css')) {
                const link = document.createElement('link');
                link.id = 'sweetalert2-css';
                link.rel = 'stylesheet';
                link.href = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css';
                document.head.appendChild(link);
            }
            // Load JS
            await new Promise<void>((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
                script.onload = () => resolve();
                script.onerror = () => resolve();
                document.body.appendChild(script);
            });
        }

        if (win.Swal) {
            const result = await win.Swal.fire({
                title: 'Delete Master Blueprint?',
                text: 'Are you sure you want to delete this global master course? All tenant claims will be affected.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Delete Master',
                cancelButtonText: 'Cancel',
                background: 'var(--background)',
                color: 'var(--foreground)',
                customClass: {
                    popup: 'rounded-[2rem] border border-border bg-background text-foreground shadow-2xl p-8',
                    title: 'text-lg font-black uppercase tracking-tight text-foreground !m-0 !pt-2 font-sans',
                    htmlContainer: 'text-sm text-muted-foreground font-medium !mt-2 !mb-6 font-sans',
                    confirmButton: 'px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-xl shadow-red-500/20 cursor-pointer font-sans mr-2',
                    cancelButton: 'px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer font-sans ml-2'
                },
                buttonsStyling: false
            });

            if (!result.isConfirmed) return;
        } else {
            if (!confirm('Are you sure you want to delete this global master course? All tenant claims will be affected.')) return;
        }

        try {
            const res = await fetch(`/api/admin/global-courses/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCourses(prev => prev.filter(c => c.id !== id));
                if (selectedCourse?.id === id) setSelectedCourse(null);
                showSwal('Success', 'Blueprint deleted successfully!', 'success');
            } else {
                const data = await res.json();
                showSwal('Error', data.error || 'Failed to delete course', 'error');
            }
        } catch (e) {
            console.error(e);
            showSwal('Error', 'An error occurred', 'error');
        }
    };

    const togglePublish = async (course: GlobalCourse) => {
        try {
            const res = await fetch(`/api/admin/global-courses/${course.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: !course.isPublished })
            });
            if (res.ok) {
                await fetchCourses();
                if (selectedCourse?.id === course.id) {
                    setSelectedCourse({ ...selectedCourse, isPublished: !course.isPublished });
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const uploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingThumbnail(true);
        try {
            const data = await uploadFile(file, { tenantId: 'system', courseId: selectedCourse?.id || 'global' });
            setCourseForm(prev => ({ ...prev, thumbnail: data.url }));
            setThumbnailPreview(data.url);
        } catch (e) {
            console.error(e);
        } finally {
            setIsUploadingThumbnail(false);
        }
    };

    const addModule = async (courseId: string) => {
        if (!newModuleTitle.trim()) {
            setValidationErrors({ newModule: 'Module title is required' });
            return;
        }

        try {
            const res = await fetch(`/api/admin/global-courses/${courseId}/modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newModuleTitle })
            });
            if (res.ok) {
                setNewModuleTitle('');
                fetchCourseDetails(courseId);
                showSwal('Module Added', 'New module has been created successfully!', 'success');
            } else {
                const data = await res.json().catch(() => ({}));
                showSwal('Error', data.error || 'Failed to add module', 'error');
            }
        } catch (e) {
            console.error(e);
            showSwal('Error', 'An error occurred while adding the module', 'error');
        }
    };

    const updateModuleTitle = async (moduleId: string) => {
        if (!selectedCourse || !moduleEditTitle.trim()) return;

        try {
            const res = await fetch(`/api/admin/global-courses/${selectedCourse.id}/modules`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduleId, title: moduleEditTitle })
            });
            if (res.ok) {
                setEditingModuleId(null);
                fetchCourseDetails(selectedCourse.id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const deleteModule = async (e: React.MouseEvent, moduleId: string) => {
        e.stopPropagation();
        if (!selectedCourse) return;

        if (typeof window === 'undefined') return;
        const win = window as any;
        if (!win.Swal) {
            // Load CSS
            if (!document.getElementById('sweetalert2-css')) {
                const link = document.createElement('link');
                link.id = 'sweetalert2-css';
                link.rel = 'stylesheet';
                link.href = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css';
                document.head.appendChild(link);
            }
            // Load JS
            await new Promise<void>((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
                script.onload = () => resolve();
                script.onerror = () => resolve();
                document.body.appendChild(script);
            });
        }

        if (win.Swal) {
            const result = await win.Swal.fire({
                title: 'Delete Module?',
                text: 'Are you sure you want to delete this module? All lessons within this module will be deleted.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Delete Module',
                cancelButtonText: 'Cancel',
                background: 'var(--background)',
                color: 'var(--foreground)',
                customClass: {
                    popup: 'rounded-[2rem] border border-border bg-background text-foreground shadow-2xl p-8',
                    title: 'text-lg font-black uppercase tracking-tight text-foreground !m-0 !pt-2 font-sans',
                    htmlContainer: 'text-sm text-muted-foreground font-medium !mt-2 !mb-6 font-sans',
                    confirmButton: 'px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-xl shadow-red-500/20 cursor-pointer font-sans mr-2',
                    cancelButton: 'px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer font-sans ml-2'
                },
                buttonsStyling: false
            });

            if (!result.isConfirmed) return;
        } else {
            if (!confirm('Delete this module?')) return;
        }

        try {
            const res = await fetch(`/api/admin/global-courses/${selectedCourse.id}/modules`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduleId })
            });
            if (res.ok) {
                fetchCourseDetails(selectedCourse.id);
                showSwal('Success', 'Module deleted successfully!', 'success');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const addOrUpdateLesson = async (moduleId: string, shouldClose: boolean) => {
        if (!selectedCourse) return;
        const form = newLessonForms[moduleId];
        if (!form?.title?.trim()) {
            setValidationErrors((prev: any) => ({ ...prev, [`lesson-${moduleId}`]: { title: 'Title is required' } }));
            return;
        }

        const lessonId = editingLessonIds[moduleId];
        const method = lessonId ? 'PUT' : 'POST';
        const url = `/api/admin/global-courses/${selectedCourse.id}/modules/${moduleId}/lessons`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lessonId ? { ...form, lessonId } : form)
            });

            if (res.ok) {
                const savedLesson = await res.json();
                if (shouldClose) {
                    setActiveLessonForms(prev => ({ ...prev, [moduleId]: false }));
                    setEditingLessonIds(prev => ({ ...prev, [moduleId]: null }));
                    setNewLessonForms(prev => ({ ...prev, [moduleId]: null }));
                } else {
                    setNewLessonForms(prev => ({ ...prev, [moduleId]: { title: '', type: 'TEXT', isActive: true, resources: [] } }));
                }
                fetchCourseDetails(selectedCourse.id);
                showSwal('Success', lessonId ? 'Lesson updated successfully!' : 'Lesson added successfully!', 'success');
                return savedLesson;
            }
        } catch (e) {
            console.error(e);
        }
    };

    const deleteLesson = async (e: React.MouseEvent, moduleId: string, lessonId: string) => {
        e.stopPropagation();
        if (!selectedCourse) return;

        if (typeof window === 'undefined') return;
        const win = window as any;
        if (!win.Swal) {
            // Load CSS
            if (!document.getElementById('sweetalert2-css')) {
                const link = document.createElement('link');
                link.id = 'sweetalert2-css';
                link.rel = 'stylesheet';
                link.href = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css';
                document.head.appendChild(link);
            }
            // Load JS
            await new Promise<void>((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
                script.onload = () => resolve();
                script.onerror = () => resolve();
                document.body.appendChild(script);
            });
        }

        if (win.Swal) {
            const result = await win.Swal.fire({
                title: 'Delete Lesson?',
                text: 'Are you sure you want to delete this lesson?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Delete Lesson',
                cancelButtonText: 'Cancel',
                background: 'var(--background)',
                color: 'var(--foreground)',
                customClass: {
                    popup: 'rounded-[2rem] border border-border bg-background text-foreground shadow-2xl p-8',
                    title: 'text-lg font-black uppercase tracking-tight text-foreground !m-0 !pt-2 font-sans',
                    htmlContainer: 'text-sm text-muted-foreground font-medium !mt-2 !mb-6 font-sans',
                    confirmButton: 'px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-xl shadow-red-500/20 cursor-pointer font-sans mr-2',
                    cancelButton: 'px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer font-sans ml-2'
                },
                buttonsStyling: false
            });

            if (!result.isConfirmed) return;
        } else {
            if (!confirm('Delete this lesson?')) return;
        }

        try {
            const res = await fetch(`/api/admin/global-courses/${selectedCourse.id}/modules/${moduleId}/lessons`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId })
            });
            if (res.ok) {
                fetchCourseDetails(selectedCourse.id);
                showSwal('Success', 'Lesson deleted successfully!', 'success');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleResourceUpload = async (moduleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['video/mp4', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
        if (!allowedTypes.includes(file.type)) {
            showSwal('Invalid File Format', 'Please upload MP4, PDF, DOCX, or PPTX.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('tenantId', 'system');
        formData.append('courseId', selectedCourse?.id || 'global');

        return new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload', true);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(prev => ({ ...prev, [`res-${moduleId}`]: percentComplete }));
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const data = JSON.parse(xhr.responseText);
                    setNewLessonForms(prev => {
                        const currentForm = prev[moduleId] || { title: '', content: '', videoUrl: '', pdfUrl: '', type: 'TEXT', resources: [] };
                        return {
                            ...prev,
                            [moduleId]: {
                                ...currentForm,
                                resources: [...(currentForm.resources || []), { name: file.name, url: data.url, type: file.type.includes('video') ? 'VIDEO' : 'DOCUMENT', size: file.size }]
                            }
                        };
                    });
                    setUploadProgress(prev => ({ ...prev, [`res-${moduleId}`]: undefined as any }));
                    resolve();
                } else {
                    reject();
                }
            };
            xhr.send(formData);
        });
    };

    const deleteTargetResource = async (resourceId: string) => {
        if (!confirm('Delete this resource?')) return;
        setIsDeletingResource(resourceId);
        try {
            const res = await fetch(`/api/admin/global-courses/${selectedCourse?.id}/resources`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resourceId })
            });
            if (res.ok) {
                if (managingResources) {
                    setManagingResources({
                        ...managingResources,
                        resources: managingResources.resources.filter(r => r.id !== resourceId)
                    });
                }
                if (selectedCourse) fetchCourseDetails(selectedCourse.id);
            }
        } finally {
            setIsDeletingResource(null);
        }
    };

    const toggleModuleStatus = async (mod: GlobalModule) => {
        if (!selectedCourse) return;
        try {
            const res = await fetch(`/api/admin/global-courses/${selectedCourse.id}/modules`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduleId: mod.id, isActive: !mod.isActive })
            });
            if (res.ok) fetchCourseDetails(selectedCourse.id);
        } catch (e) {
            console.error(e);
        }
    };

    const toggleLessonStatus = async (moduleId: string, lesson: GlobalLesson) => {
        if (!selectedCourse) return;
        try {
            const res = await fetch(`/api/admin/global-courses/${selectedCourse.id}/modules/${moduleId}/lessons`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId: lesson.id, isActive: !lesson.isActive })
            });
            if (res.ok) fetchCourseDetails(selectedCourse.id);
        } catch (e) {
            console.error(e);
        }
    };

    const generateAIQuiz = async () => {
        if (!selectedCourse || !activeQuizLesson) return;
        setIsGeneratingQuiz(true);
        try {
            const url = `/api/admin/global-courses/${selectedCourse.id}/generate-quiz?lessonId=${activeQuizLesson.lessonId}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: 10 })
            });
            const data = await res.json();
            if (res.ok && data.questions) {
                setQuizForm(prev => ({
                    ...prev,
                    questions: [...prev.questions, ...data.questions],
                    isRandomized: (prev.questions.length + data.questions.length) > 5,
                    randomCount: Math.min(5, prev.questions.length + data.questions.length)
                }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    const saveQuiz = async () => {
        if (!selectedCourse || !activeQuizLesson) return;
        try {
            const res = await fetch(`/api/admin/global-courses/${selectedCourse.id}/modules/${activeQuizLesson.moduleId}/lessons`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId: activeQuizLesson.lessonId,
                    quiz: quizForm
                })
            });
            if (res.ok) {
                setActiveQuizLesson(null);
                fetchCourseDetails(selectedCourse.id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Main Render
    return (
        <div className="min-h-screen bg-black text-white pb-20 overflow-x-hidden">
            {/* Header */}
            <header className="border-b border-white/[0.08] bg-black/80 backdrop-blur-xl sticky top-0 z-[100]">
                <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <Globe className="text-indigo-500" />
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Curriculum <span className="text-indigo-500">Forge</span></h1>
                        </div>
                        <div className="h-6 w-px bg-white/[0.08]" />
                        <nav className="flex gap-6">
                            {(['courses', 'stats', 'claims'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        if (tab !== 'courses') setSelectedCourse(null);
                                    }}
                                    className={`text-[10px] font-black uppercase tracking-widest transition-all relative py-2 ${activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
                                >
                                    {tab}
                                    {activeTab === tab && <div className="absolute -bottom-2 left-0 right-0 h-1 bg-primary rounded-full" />}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-8 pt-10">
                {selectedCourse ? (
                    /* ── Builder View (100% Stylistic Clone) ── */
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div>
                            <button
                                onClick={() => setSelectedCourse(null)}
                                className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all group mb-6"
                            >
                                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                Back to Courses
                            </button>
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-4xl font-black uppercase tracking-tighter text-white">{selectedCourse.title}</h2>
                                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${selectedCourse.isPublished ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                                            {selectedCourse.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">{selectedCourse.description || "Experimental global curriculum awaiting final structural optimization."}</p>
                                </div>
                                <div className="flex flex-row items-center gap-2 shrink-0 overflow-x-auto pb-1 max-w-full" style={{ flexWrap: 'nowrap' }}>
                                    <button onClick={() => { setCourseForm({ ...selectedCourse, description: selectedCourse.description || '', thumbnail: selectedCourse.thumbnail || '', courseCreateCount: selectedCourse.courseCreateCount || 0 }); setThumbnailPreview(selectedCourse.thumbnail); setValidationErrors({}); setShowCourseModal(true); }}
                                        className="px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-white/[0.03] border border-white/[0.08] text-muted-foreground hover:text-white hover:bg-white/[0.06] transition-all flex items-center gap-2">
                                        <Settings size={14} className="text-indigo-400" /> Course Settings
                                    </button>
                                    <button
                                        onClick={() => fetchCourseStats(selectedCourse.id, true)}
                                        disabled={loadingStats}
                                        className="px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-white/[0.03] border border-white/[0.08] text-muted-foreground hover:text-white hover:bg-white/[0.06] transition-all flex items-center gap-2 disabled:opacity-50">
                                        {loadingStats ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} className="text-purple-400" />}
                                        {loadingStats ? 'Loading...' : 'Statistics'}
                                    </button>
                                    <button onClick={() => togglePublish(selectedCourse)}
                                        className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all flex items-center gap-2 ${selectedCourse.isPublished ? 'border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'}`}>
                                        {selectedCourse.isPublished ? <><EyeOff size={14} className="text-amber-400" /> Unpublish Blueprint</> : <><Eye size={14} className="text-emerald-400" /> Publish Blueprint</>}
                                    </button>
                                    <button onClick={() => setManagingResources({ id: selectedCourse.id, type: 'COURSE', name: selectedCourse.title, resources: selectedCourse.resources || [] })}
                                        className="px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-2">
                                        <Archive size={14} className="text-blue-400" /> Course Resources
                                    </button>
                                    <button onClick={(e) => deleteCourse(e, selectedCourse.id)}
                                        className="px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2">
                                        <Trash2 size={14} className="text-red-400" /> Delete Master
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* KPI Grid */}
                        {courseStats && (
                            <div className="grid grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-500">
                                {[
                                    { label: 'Tenant Claims', value: courseStats.totalClaims || 0, icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/10' },
                                    { label: 'Global Students', value: courseStats.totalEnrollments || 0, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
                                    { label: 'Global Completions', value: courseStats.totalCompletions || 0, icon: Award, color: 'text-purple-400', bg: 'bg-purple-500/5', border: 'border-purple-500/10' },
                                    { label: 'Success Rate', value: `${courseStats.avgCompletionRate || 0}%`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/10' },
                                ].map(stat => (
                                    <div key={stat.label} className={`p-6 rounded-2xl border ${stat.border} ${stat.bg} backdrop-blur-xl flex flex-col gap-2 group hover:scale-[1.02] transition-transform`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <stat.icon size={14} className={stat.color} />
                                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/60">{stat.label}</span>
                                        </div>
                                        <p className="text-3xl font-black text-white group-hover:text-primary transition-colors">{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Module Builder */}
                        <div className="space-y-4 w-full">
                            {selectedCourse.modules?.map((mod) => (
                                <div key={mod.id} className="glassmorphism rounded-2xl border border-white/[0.08] overflow-hidden group">
                                    <div className="flex items-center gap-3 p-4 bg-white/[0.02] border-b border-white/[0.05]">
                                        <div className="flex-1 flex flex-col">
                                            {editingModuleId === mod.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        autoFocus
                                                        value={moduleEditTitle}
                                                        onChange={e => setModuleEditTitle(e.target.value)}
                                                        className="bg-black border border-primary/50 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none"
                                                        onKeyDown={e => e.key === 'Enter' && updateModuleTitle(mod.id)}
                                                    />
                                                    <button onClick={() => updateModuleTitle(mod.id)} className="p-1 text-emerald-400 transition-colors"><CheckCircle2 size={16} /></button>
                                                    <button onClick={() => setEditingModuleId(null)} className="p-1 text-red-400 transition-colors"><XCircle size={16} /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className={`font-bold ${!mod.isActive ? 'text-muted-foreground opacity-50' : ''}`}>{mod.title}</p>
                                                    {!mod.isActive && <span className="text-[9px] text-red-400 font-bold uppercase tracking-tighter">Deactivated Module</span>}
                                                </>
                                            )}
                                        </div>
                                        <div className="ml-auto flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground mr-2 font-mono">{mod.lessons?.length || 0} Lessons</span>
                                            <button
                                                onClick={() => setManagingResources({ id: mod.id, type: 'MODULE', name: mod.title, resources: mod.resources || [] })}
                                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all bg-black border border-white/10 text-muted-foreground hover:text-blue-400 hover:border-blue-400/30 flex items-center gap-1.5"
                                            >
                                                <Archive size={12} /> Resources
                                            </button>
                                            <button
                                                onClick={() => { setEditingModuleId(mod.id); setModuleEditTitle(mod.title); }}
                                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all bg-black border border-white/10 text-muted-foreground hover:text-primary hover:border-primary/30 flex items-center gap-1.5"
                                            >
                                                <Edit3 size={12} /> Edit
                                            </button>
                                            <div
                                                onClick={(e) => { e.stopPropagation(); toggleModuleStatus(mod); }}
                                                className="px-3 py-1.5 rounded-lg bg-black border border-white/10 flex items-center gap-2 cursor-pointer hover:bg-white/5 transition-all select-none"
                                            >
                                                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors relative ${mod.isActive ? 'bg-emerald-500' : 'bg-white/10 border border-white/10'}`}>
                                                    <div className={`w-3 h-3 rounded-full shadow-sm shadow-black/20 transition-all bg-white ${mod.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                    {mod.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => deleteModule(e, mod.id)}
                                                className="p-1.5 rounded-lg transition-all bg-black border border-white/10 text-red-500/70 hover:text-red-400 hover:bg-red-500/10"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-2">
                                        {mod.lessons?.map((lesson) => (
                                            <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] group">
                                                <BookOpen size={14} className="text-muted-foreground" />
                                                <span className={`text-sm font-medium ${!lesson.isActive ? 'text-muted-foreground opacity-50 line-through' : ''}`}>{lesson.title}</span>
                                                {!lesson.isActive && <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5 font-bold uppercase">Hidden</span>}
                                                {lesson.videoUrl && <span className="text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg px-2 py-0.5 font-black uppercase tracking-widest">Video Content</span>}
                                                {lesson.resources?.length > 0 && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg px-2 py-0.5 font-black uppercase tracking-widest">{lesson.resources.length} Downloadables</span>}

                                                {lesson.type === 'VIDEO' && lesson.transcriptStatus === 'PROCESSING' && (
                                                    <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg px-2 py-0.5 font-black uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                                                        <Clock size={10} /> Transcription Processing
                                                    </span>
                                                )}
                                                {lesson.type === 'VIDEO' && lesson.transcriptStatus === 'READY' && (
                                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg px-2 py-0.5 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                        <CheckCircle size={10} /> AI Transcripts Ready
                                                    </span>
                                                )}
                                                {lesson.type === 'VIDEO' && lesson.transcriptStatus === 'FAILED' && (
                                                    <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-2 py-0.5 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                        <AlertCircle size={10} /> Transcription Failed
                                                    </span>
                                                )}

                                                <div className="ml-auto flex items-center gap-2">
                                                    {lesson.type === 'VIDEO' && lesson.transcriptStatus === 'READY' && (
                                                        <button
                                                            onClick={() => {
                                                                setActiveQuizLesson({ moduleId: mod.id, lessonId: lesson.id });
                                                                setQuizForm(lesson.quiz || { title: lesson.title, description: '', passingScore: 70, questions: [], isRandomized: false, randomCount: 0 });
                                                            }}
                                                            className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg bg-black border border-indigo-500/30 transition-all flex items-center gap-1.5 px-2.5"
                                                        >
                                                            <Mic size={12} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">AI Quiz</span>
                                                        </button>
                                                    )}
                                                    <div
                                                        onClick={() => toggleLessonStatus(mod.id, lesson)}
                                                        className="px-3 py-1.5 rounded-lg bg-black border border-white/10 flex items-center gap-2 cursor-pointer hover:bg-white/5 transition-all select-none"
                                                    >
                                                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors relative ${lesson.isActive ? 'bg-emerald-500' : 'bg-white/10 border border-white/10'}`}>
                                                            <div className={`w-3 h-3 rounded-full transition-all bg-white ${lesson.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                                                        </div>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                            {lesson.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setEditingLessonIds(prev => ({ ...prev, [mod.id]: lesson.id }));
                                                            setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...lesson } }));
                                                            setActiveLessonForms(prev => ({ ...prev, [mod.id]: true }));
                                                        }}
                                                        className="p-1.5 text-muted-foreground hover:text-white rounded-lg bg-black border border-white/10 transition-all"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => deleteLesson(e, mod.id, lesson.id)}
                                                        className="p-1.5 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg bg-black border border-white/10 transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Lesson Form */}
                                        {activeLessonForms[mod.id] ? (
                                            <div className="mt-2 p-4 rounded-xl bg-white/[0.03] border border-primary/20 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{editingLessonIds[mod.id] ? 'Edit Lesson' : 'Add New Lesson'}</p>
                                                    <button onClick={() => { setActiveLessonForms(prev => ({ ...prev, [mod.id]: false })); setEditingLessonIds(prev => ({ ...prev, [mod.id]: null })); }} className="text-muted-foreground hover:text-white transition-colors"><XCircle size={14} /></button>
                                                </div>

                                                <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
                                                    {(['VIDEO', 'PPT', 'QUIZ', 'TEXT'] as const).map((t) => (
                                                        <button
                                                            key={t}
                                                            onClick={() => setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...(prev[mod.id] || {}), type: t } }))}
                                                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newLessonForms[mod.id]?.type === t || (!newLessonForms[mod.id]?.type && t === 'TEXT') ? 'bg-white shadow-sm text-black' : 'text-muted-foreground hover:text-white'}`}
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Lesson Title</label>
                                                        {getValidationError(`lesson-${mod.id}`) && (
                                                            <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1 mr-1 uppercase tracking-tight">
                                                                {getValidationError(`lesson-${mod.id}`)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <input className={`w-full bg-black border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-all font-bold ${getValidationError(`lesson-${mod.id}`) ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-primary/50'}`}
                                                        placeholder="e.g. Introduction to React..."
                                                        value={newLessonForms[mod.id]?.title || ''}
                                                        onChange={e => setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...(prev[mod.id] || {}), title: e.target.value } }))}
                                                    />
                                                </div>

                                                {newLessonForms[mod.id]?.type === 'TEXT' && (
                                                    <textarea placeholder="Lesson text content / instructions..."
                                                        rows={4}
                                                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none animate-in fade-in duration-300"
                                                        value={newLessonForms[mod.id]?.content || ''}
                                                        onChange={e => setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...(prev[mod.id] || {}), content: e.target.value } }))}
                                                    />
                                                )}

                                                {(newLessonForms[mod.id]?.type === 'VIDEO' || newLessonForms[mod.id]?.type === 'PPT') && (
                                                    <div className="p-10 border-2 border-dashed border-white/[0.08] rounded-2xl bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
                                                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                            {newLessonForms[mod.id]?.type === 'VIDEO' ? <Video size={32} /> : <FileText size={32} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-white">Upload {newLessonForms[mod.id]?.type === 'VIDEO' ? 'MP4 Master Content' : 'PDF Study Guide'}</p>
                                                            {newLessonForms[mod.id]?.videoUrl || newLessonForms[mod.id]?.pdfUrl ? (
                                                                <p className="text-[9px] text-emerald-400 font-bold mt-1">Content Linked: {newLessonForms[mod.id]?.videoUrl || newLessonForms[mod.id]?.pdfUrl}</p>
                                                            ) : (
                                                                <p className="text-[9px] text-muted-foreground/50 mt-1">Maximum file size 2GB (Regional replication enabled)</p>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            id={`main-file-${mod.id}`}
                                                            accept={newLessonForms[mod.id]?.type === 'VIDEO' ? '.mp4,.avi,.mov,.wmv,.webm,video/*' : '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation'}
                                                            onChange={async e => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;

                                                                const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                                                                if (newLessonForms[mod.id]?.type === 'VIDEO') {
                                                                    const allowedVideoExts = ['.mp4', '.avi', '.mov', '.wmv', '.webm'];
                                                                    if (!allowedVideoExts.includes(ext)) {
                                                                        showSwal('Invalid File Type', 'Please upload a valid video format (.mp4, .avi, .mov, .wmv, .webm)', 'error');
                                                                        e.target.value = '';
                                                                        return;
                                                                    }
                                                                } else {
                                                                    const allowedPptExts = ['.ppt', '.pptx'];
                                                                    if (!allowedPptExts.includes(ext)) {
                                                                        showSwal('Invalid File Type', 'Please upload a valid PowerPoint format (.ppt, .pptx)', 'error');
                                                                        e.target.value = '';
                                                                        return;
                                                                    }
                                                                }

                                                                setUploadProgress(prev => ({ ...prev, [mod.id]: 0 }));
                                                                try {
                                                                    const data = await uploadFile(file,
                                                                        { tenantId: 'system', courseId: selectedCourse?.id || 'global' },
                                                                        (percent) => setUploadProgress(prev => ({ ...prev, [mod.id]: percent }))
                                                                    );
                                                                    setNewLessonForms(prev => ({
                                                                        ...prev,
                                                                        [mod.id]: {
                                                                            ...prev[mod.id],
                                                                            [newLessonForms[mod.id]?.type === 'VIDEO' ? 'videoUrl' : 'pdfUrl']: data.url
                                                                        }
                                                                    }));
                                                                } catch (err) {
                                                                    console.error(err);
                                                                } finally {
                                                                    setUploadProgress(prev => ({ ...prev, [mod.id]: undefined as any }));
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor={`main-file-${mod.id}`} className="px-8 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/[0.1] transition-all">
                                                            {uploadProgress[mod.id] !== undefined ? `Uploading ${uploadProgress[mod.id]}%` : 'Select File'}
                                                        </label>
                                                    </div>
                                                )}

                                                {newLessonForms[mod.id]?.type === 'QUIZ' && (
                                                    <div className="p-10 border-2 border-dashed border-white/[0.08] rounded-2xl bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
                                                        <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                            <Mic size={32} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-white">AI Quiz Whisperer</p>
                                                            <p className="text-[9px] text-muted-foreground/50 max-w-[200px] mx-auto">Generate a master quiz archive using deep learning from global pool.</p>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setActiveQuizLesson({ moduleId: mod.id, lessonId: editingLessonIds[mod.id] || 'new' });
                                                                setQuizForm({ title: newLessonForms[mod.id]?.title || 'Untitled Quiz', description: '', passingScore: 70, questions: [], isRandomized: false, randomCount: 0 });
                                                            }}
                                                            className="px-8 py-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center gap-2"
                                                        >
                                                            <Cpu size={14} /> Initialize AI Generator
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 px-1 py-1">
                                                    <input
                                                        type="checkbox"
                                                        id={`lesson-active-${mod.id}`}
                                                        checked={newLessonForms[mod.id]?.isActive !== false}
                                                        onChange={e => setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...prev[mod.id], isActive: e.target.checked } }))}
                                                        className="rounded border-white/10 bg-black text-primary"
                                                    />
                                                    <label htmlFor={`lesson-active-${mod.id}`} className="text-xs font-medium text-muted-foreground cursor-pointer">Lesson is Active</label>
                                                </div>

                                                {/* Resources Preview */}
                                                {newLessonForms[mod.id]?.resources?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                        {newLessonForms[mod.id]?.resources?.map((res: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-muted-foreground">
                                                                <FileText size={10} className="text-primary/50" />
                                                                <span className="truncate max-w-[120px]">{res.name}</span>
                                                                <button onClick={() => {
                                                                    const resArr = [...(newLessonForms[mod.id]?.resources || [])];
                                                                    resArr.splice(idx, 1);
                                                                    setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...prev[mod.id], resources: resArr } }));
                                                                }} className="text-red-400 hover:text-red-300"><XCircle size={10} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                                                    <label className={`flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-colors text-xs font-bold text-muted-foreground ${uploadProgress[`res-${mod.id}`] !== undefined ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                        <Upload size={14} /> Add Downloadable Resource
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            disabled={uploadProgress[`res-${mod.id}`] !== undefined}
                                                            onChange={e => handleResourceUpload(mod.id, e)}
                                                        />
                                                    </label>

                                                    <div className="flex items-center gap-2">
                                                        {!editingLessonIds[mod.id] && (
                                                            <button onClick={() => addOrUpdateLesson(mod.id, false)} className="px-3 py-1.5 font-bold rounded-lg text-xs bg-white/5 hover:bg-white/10 transition-colors">
                                                                Save & Add Next
                                                            </button>
                                                        )}
                                                        <button onClick={() => addOrUpdateLesson(mod.id, true)} className="px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary font-bold rounded-lg text-xs hover:bg-primary/20 transition-colors flex items-center gap-1.5">
                                                            <Sparkles size={14} /> {editingLessonIds[mod.id] ? 'Save Changes' : 'Save'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {uploadProgress[`res-${mod.id}`] !== undefined && (
                                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                                                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress[`res-${mod.id}`]}%` }} />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setActiveLessonForms(prev => ({ ...prev, [mod.id]: true })); setNewLessonForms(prev => ({ ...prev, [mod.id]: { title: '', type: 'TEXT', isActive: true, resources: [] } })); setEditingLessonIds(prev => ({ ...prev, [mod.id]: null })); }}
                                                className="w-full mt-2 px-4 py-3 border border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus size={16} /> Add Lesson
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="flex gap-3 items-start">
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <input
                                        className={`w-full bg-white/[0.03] border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all font-bold ${getValidationError('newModule') ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-primary/50'}`}
                                        placeholder="New module title..."
                                        value={newModuleTitle}
                                        onChange={e => {
                                            setNewModuleTitle(e.target.value);
                                            if (getValidationError('newModule')) {
                                                setValidationErrors((prev: any) => ({ ...prev, newModule: null }));
                                            }
                                        }}
                                        onKeyDown={e => e.key === 'Enter' && addModule(selectedCourse.id)}
                                    />
                                    {getValidationError('newModule') && (
                                        <p className="text-[11px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1 uppercase tracking-wider">
                                            {getValidationError('newModule')}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => addModule(selectedCourse.id)}
                                    className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:opacity-90 flex items-center gap-2 h-[46px]"
                                >
                                    <Plus size={16} /> Add Module
                                </button>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'stats' ? (
                    /* ── Global Stats Tab View (Modernized High-Density Command Center) ── */
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-end justify-between">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Global <span className="text-indigo-500">Analytics</span></h2>
                                <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold flex items-center gap-2">
                                    <Activity size={12} className="text-emerald-400" /> Cross-platform ecosystem performance
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={fetchGlobalStats} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-muted-foreground hover:text-white transition-all hover:bg-white/10">
                                    <RefreshCw size={16} className={loadingGlobal ? "animate-spin" : ""} />
                                </button>
                                <div className="px-5 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck size={14} /> System Secure
                                </div>
                            </div>
                        </div>

                        {loadingGlobal ? (
                            <div className="h-96 flex flex-col items-center justify-center gap-6 glassmorphism rounded-[3rem] border border-white/[0.08]">
                                <div className="relative">
                                    <Loader2 className="animate-spin text-primary" size={64} />
                                    <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 animate-pulse">Aggregating Global Intelligence...</p>
                            </div>
                        ) : globalStatsOverview ? (
                            <div className="space-y-12">
                                {/* Enhanced KPI Cards */}
                                <div className="grid grid-cols-4 gap-6">
                                    {[
                                        { label: 'Master Blueprints', value: globalStatsOverview.totalCourses, trend: '+12%', icon: Layers, color: 'text-indigo-400', bg: 'from-indigo-500/10' },
                                        { label: 'Active Claims', value: globalStatsOverview.totalClaims, trend: '+8%', icon: Globe, color: 'text-sky-400', bg: 'from-sky-500/10' },
                                        { label: 'Learner Reach', value: globalStatsOverview.totalEnrollments, trend: '+14%', icon: Users, color: 'text-emerald-400', bg: 'from-emerald-500/10' },
                                        { label: 'Avg Completion', value: '78%', trend: '-2%', icon: Target, color: 'text-amber-400', bg: 'from-amber-500/10' }
                                    ].map(stat => (
                                        <div key={stat.label} className={`p-8 rounded-[2.5rem] border border-white/[0.08] bg-gradient-to-br ${stat.bg} to-transparent backdrop-blur-3xl flex flex-col gap-4 relative overflow-hidden group hover:scale-[1.02] transition-all`}>
                                            <div className="flex items-center justify-between relative z-10">
                                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                                    <stat.icon className={stat.color} size={18} />
                                                </div>
                                                <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${stat.trend.startsWith('+') ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-rose-400 border-rose-500/20 bg-rose-500/10'}`}>
                                                    {stat.trend}
                                                </span>
                                            </div>
                                            <div className="relative z-10">
                                                <p className="text-4xl font-black text-white group-hover:text-primary transition-colors">{stat.value}</p>
                                                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">{stat.label}</span>
                                            </div>
                                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <stat.icon size={120} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Main Analytics Grid */}
                                <div className="grid grid-cols-3 gap-8">
                                    {/* Platform Growth Chart */}
                                    <div className="col-span-2 p-10 rounded-[3rem] border border-white/[0.08] glassmorphism space-y-8 relative overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black uppercase tracking-tighter text-white">Platform Adoption Trend</h3>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Growth in marketplace claims (last 7 days)</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest text-indigo-400">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> Claims
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Enrollments
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-72 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={globalStatsOverview.claimGrowth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#0A0A0A', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}
                                                        itemStyle={{ fontWeight: 900, textTransform: 'uppercase' }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="claims"
                                                        stroke="#6366f1"
                                                        strokeWidth={4}
                                                        fillOpacity={1}
                                                        fill="url(#colorClaims)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Distribution View */}
                                    <div className="p-8 rounded-[3rem] border border-white/[0.08] glassmorphism space-y-8">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                                            <PieChart className="text-sky-400" style={{ width: 18, height: 18 }} /> Ecosystem Pulse
                                        </h3>
                                        <div className="h-64 flex flex-col justify-between items-center relative">
                                            {/* Minimal Pie Logic or Visualization Card */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-32 h-32 rounded-full border-8 border-indigo-500/20 shadow-2xl shadow-indigo-500/10 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <p className="text-2xl font-black text-white">82%</p>
                                                        <p className="text-[8px] uppercase font-black tracking-widest text-muted-foreground">Active</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-auto w-full space-y-4">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-muted-foreground">Ecosystem Health</span>
                                                        <span className="text-emerald-400">Peak Performance</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full w-[82%] bg-emerald-500 animate-in slide-in-from-left duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-muted-foreground">Global Replication</span>
                                                        <span className="text-indigo-400">99.9% Latency Match</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full w-[94%] bg-indigo-500 animate-in slide-in-from-left duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* High-Density Activity Log */}
                                <div className="p-10 rounded-[3rem] border border-white/[0.08] glassmorphism relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-10">
                                        <h3 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-4">
                                            <div className="w-2 h-8 bg-indigo-500 rounded-full" /> Live Platform Activity
                                        </h3>
                                        <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">Export Ledger</button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {globalStatsOverview.recentClaims?.length > 0 ? globalStatsOverview.recentClaims.map((claim: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 group hover:bg-white/10 transition-all hover:translate-x-1">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                        {claim.tenant?.name?.charAt(0) || 'T'}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-black text-white">{claim.tenant?.name || 'Unknown Tenant'}</span>
                                                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-black text-muted-foreground uppercase tracking-widest">Verified Claim</span>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Injected Blueprint: <span className="text-indigo-400">"{claim.course?.title}"</span></span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-white">{new Date(claim.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter opacity-40">{new Date(claim.claimedAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <ChevronRight className="text-white/10 group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="h-48 flex flex-col items-center justify-center gap-4 text-muted-foreground/20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                                                <Activity size={32} />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Listening for global activity signals...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-96 flex flex-col items-center justify-center gap-6 glassmorphism rounded-[3rem] border border-white/[0.08] text-center">
                                <div className="w-24 h-24 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                                    <AlertCircle size={48} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Aggregation Failure</h3>
                                    <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">The analytics engine encountered a high-latency response in the global data pool. Integrity replication is still active.</p>
                                </div>
                                <button onClick={fetchGlobalStats} className="px-8 py-3 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">Re-initialize Sync</button>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'claims' ? (
                    /* ── Global Claims Tab View ── */
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Adoption <span className="text-blue-500">Registry</span></h2>
                            <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Comprehensive list of all platform course claims</p>
                        </div>

                        {loadingGlobal ? (
                            <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>
                        ) : (
                            <div className="rounded-[2.5rem] border border-white/[0.08] glassmorphism overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/[0.03] border-b border-white/[0.08]">
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tenant / Platform</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Course Blueprint</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Claim Date</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {claimsRegistry.length > 0 ? claimsRegistry.map((claim: any) => (
                                            <tr key={claim.id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-white group-hover:text-primary transition-colors">{claim.tenant?.name || 'Unknown'}</span>
                                                        <span className="text-[10px] text-muted-foreground lowercase opacity-50 font-mono italic">{claim.tenant?.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lvh.me:3000'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <Layers size={14} className="text-indigo-400" />
                                                        <span className="text-sm font-bold text-muted-foreground group-hover:text-white transition-colors">{claim.course?.title || 'Unknown Course'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="text-xs font-black text-muted-foreground/60">{new Date(claim.claimedAt).toLocaleDateString()}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-white transition-all">
                                                            <Share2 size={14} />
                                                        </button>
                                                        <button className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400/50 hover:text-red-400 transition-all">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center text-muted-foreground/30 text-xs font-black uppercase tracking-widest">
                                                    No marketplace claims found in registry
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── Library View (100% Stylistic Clone) ── */
                    <div className="space-y-10 animate-in fade-in duration-700">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                                {(['all', 'published', 'draft'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setCourseFilter(f)}
                                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${courseFilter === f ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'}`}
                                    >
                                        <span className="capitalize">{f}</span>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    setCourseForm({ title: '', description: '', thumbnail: '', skillLevel: 'All Levels', isPublished: false, courseCreateCount: 0 });
                                    setThumbnailPreview(null);
                                    setValidationErrors({});
                                    setShowCourseModal(true);
                                }}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                            >
                                <Plus size={16} /> Forge New Course
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {courses.filter(c => {
                                if (courseFilter === 'published') return c.isPublished;
                                if (courseFilter === 'draft') return !c.isPublished;
                                return true;
                            }).map(course => (
                                <div
                                    key={course.id}
                                    className="group rounded-3xl overflow-hidden border border-white/[0.08] glassmorphism hover:border-primary/30 transition-all shadow-2xl shadow-black/40"
                                >
                                    <div className="aspect-video relative overflow-hidden bg-white/[0.02] border-b border-white/[0.05]">
                                        {course.thumbnail ? (
                                            <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                                <Layers size={48} />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${course.isPublished ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/20 border-amber-500/30 text-amber-400'}`}>
                                                {course.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="font-bold text-lg leading-tight mb-2 truncate">{course.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-6 line-clamp-2 h-10">{course.description || 'Global master curriculum blueprint.'}</p>

                                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-6">
                                            <span className="flex items-center gap-1.5"><Layers size={12} className="text-primary/40" /> {course.modules?.length || 0} Modules</span>
                                            <span className="flex items-center gap-1.5" title="Course Creation Limit"><Cpu size={12} className="text-primary/40" /> Limit: {course.courseCreateCount || 0}</span>
                                            <span className="flex items-center gap-1.5"><Users size={12} className="text-primary/40" /> {course._count?.marketplaceClaims || 0} Claims</span>
                                        </div>

                                        <div className="flex gap-2">
                                            <button onClick={() => fetchCourseDetails(course.id)} className="flex-1 py-2.5 bg-primary/10 border border-primary/20 text-primary font-bold rounded-xl text-xs hover:bg-primary/20 transition-all flex items-center justify-center gap-2">
                                                <Plus size={14} /> Open Builder
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); togglePublish(course); }} className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-muted-foreground">
                                                {course.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Modals & Portals (Uniform Stylistic Clones) */}
            {showCourseModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
                    <div className="bg-[#0A0A0A] border border-white/[0.08] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl p-12 space-y-10 animate-in zoom-in-95 duration-500 no-scrollbar">
                        <div className="flex justify-between items-center">
                            <h3 className="text-3xl font-black uppercase tracking-tighter text-white">{selectedCourse ? 'Refine Blueprint' : 'Forge Blueprint'}</h3>
                            <button onClick={() => setShowCourseModal(false)} className="w-12 h-12 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors border border-white/[0.08] text-2xl font-light">&times;</button>
                        </div>
                        <form onSubmit={selectedCourse ? updateCourse : createCourse} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">Blueprint Title</label>
                                <input
                                    className={`w-full bg-black border rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 transition-all ${
                                        getValidationError('title') ? 'border-red-500/50 focus:ring-red-500/10' : 'border-white/[0.08] focus:ring-primary/10'
                                    }`}
                                    placeholder="e.g. Advanced System Architecture"
                                    value={courseForm.title}
                                    onChange={e => {
                                        setCourseForm({ ...courseForm, title: e.target.value });
                                        if (getValidationError('title')) {
                                            setValidationErrors((prev: any) => ({ ...prev, title: null }));
                                        }
                                    }}
                                />
                                {getValidationError('title') && (
                                    <p className="text-[11px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-3 uppercase tracking-wider">
                                        {getValidationError('title')}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">Mission Abstract</label>
                                <textarea
                                    rows={3}
                                    className={`w-full bg-black border rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-4 transition-all resize-none ${
                                        getValidationError('description') ? 'border-red-500/50 focus:ring-red-500/10' : 'border-white/[0.08] focus:ring-primary/10'
                                    }`}
                                    placeholder="Define the scope of this global curriculum..."
                                    value={courseForm.description || ''}
                                    onChange={e => {
                                        setCourseForm({ ...courseForm, description: e.target.value });
                                        if (getValidationError('description')) {
                                            setValidationErrors((prev: any) => ({ ...prev, description: null }));
                                        }
                                    }}
                                />
                                {getValidationError('description') && (
                                    <p className="text-[11px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-3 uppercase tracking-wider">
                                        {getValidationError('description')}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">Visual Prototype</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-2xl border border-white/[0.08] bg-black overflow-hidden flex items-center justify-center relative">
                                        {thumbnailPreview ? <img src={thumbnailPreview} className="w-full h-full object-cover" alt="" /> : <Layers className="opacity-10" />}
                                        {isUploadingThumbnail && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 size={16} className="animate-spin text-primary" /></div>}
                                    </div>
                                    <label className="flex-1 py-4 border-2 border-dashed border-white/[0.08] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all">
                                        <Plus size={20} className="text-muted-foreground/30 mb-1" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Link Asset</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={uploadThumbnail} />
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">Difficulty Vector</label>
                                <select
                                    className="w-full bg-black border border-white/[0.08] rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] focus:outline-none appearance-none cursor-pointer"
                                    value={courseForm.skillLevel}
                                    onChange={e => setCourseForm({ ...courseForm, skillLevel: e.target.value })}
                                >
                                    <option>All Levels</option>
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">Course Create Count</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full bg-black border border-white/[0.08] rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-white"
                                    placeholder="Enter course create count..."
                                    value={courseForm.courseCreateCount}
                                    onChange={e => setCourseForm({ ...courseForm, courseCreateCount: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <button className="w-full py-5 bg-primary text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                                {selectedCourse ? 'Seal Prototype' : 'Ignite Forge'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Quiz Builder Modal (Reflected from Tenant Side) */}
            {activeQuizLesson && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="bg-[#0A0A0A] border border-white/[0.08] w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl p-12 flex flex-col gap-10 overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter text-white">Neural Exam Architecture</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Generating logic for global assessment</p>
                            </div>
                            <button onClick={() => setActiveQuizLesson(null)} className="w-12 h-12 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors border border-white/[0.08] text-2xl font-light">&times;</button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-4 space-y-12 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">Exam Vector Title</label>
                                    <input
                                        className="w-full bg-black border border-white/[0.08] rounded-2xl px-6 py-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                        value={quizForm.title}
                                        onChange={e => setQuizForm({ ...quizForm, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">Passing Integrity Threshold (%)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black border border-white/[0.08] rounded-2xl px-6 py-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                                        value={quizForm.passingScore}
                                        onChange={e => setQuizForm({ ...quizForm, passingScore: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                                        <Layers size={18} className="text-primary" /> Logic Candidates ({quizForm.questions.length})
                                    </h4>
                                    <div className="flex gap-3">
                                        <button
                                            disabled={isGeneratingQuiz}
                                            onClick={generateAIQuiz}
                                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-30"
                                        >
                                            {isGeneratingQuiz ? <Loader2 size={14} className="animate-spin" /> : <Mic size={14} />}
                                            {isGeneratingQuiz ? 'Neural Mapping...' : 'Whisper AI Generation'}
                                        </button>
                                        <button
                                            onClick={() => setQuizForm({ ...quizForm, questions: [...quizForm.questions, { text: '', type: 'MULTIPLE_CHOICE', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }] })}
                                            className="px-6 py-3 bg-white/[0.03] border border-white/[0.08] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/[0.08] transition-all"
                                        >
                                            Manual Insertion
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {quizForm.questions.map((q, qIdx) => (
                                        <div key={qIdx} className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/[0.08] space-y-6 group">
                                            <div className="flex justify-between items-start">
                                                <span className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-black text-xs">V{qIdx + 1}</span>
                                                <button
                                                    onClick={() => {
                                                        const qs = [...quizForm.questions];
                                                        qs.splice(qIdx, 1);
                                                        setQuizForm({ ...quizForm, questions: qs });
                                                    }}
                                                    className="p-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                            <input
                                                className="w-full bg-transparent border-b border-white/[0.1] px-0 py-4 text-xl font-black focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/10"
                                                placeholder="State the core inquiry..."
                                                value={q.text}
                                                onChange={e => {
                                                    const qs = [...quizForm.questions];
                                                    qs[qIdx].text = e.target.value;
                                                    setQuizForm({ ...quizForm, questions: qs });
                                                }}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                {q.options.map((opt: any, oIdx: number) => (
                                                    <div key={oIdx} className="flex items-center gap-3 bg-black border border-white/[0.05] p-4 rounded-xl">
                                                        <div
                                                            onClick={() => {
                                                                const qs = [...quizForm.questions];
                                                                qs[qIdx].options = qs[qIdx].options.map((o: any, idx: number) => ({ ...o, isCorrect: idx === oIdx }));
                                                                setQuizForm({ ...quizForm, questions: qs });
                                                            }}
                                                            className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${opt.isCorrect ? 'border-emerald-500 bg-emerald-500/20' : 'border-white/10'}`}
                                                        />
                                                        <input
                                                            className="flex-1 bg-transparent text-sm font-bold focus:outline-none"
                                                            value={opt.text}
                                                            onChange={e => {
                                                                const qs = [...quizForm.questions];
                                                                qs[qIdx].options[oIdx].text = e.target.value;
                                                                setQuizForm({ ...quizForm, questions: qs });
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 pt-6 border-t border-white/[0.08] flex justify-end gap-4">
                            <button onClick={() => setActiveQuizLesson(null)} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white">Discard Logic</button>
                            <button onClick={saveQuiz} className="px-12 py-4 bg-primary text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-primary/20">Seal Global Assessment</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resources Management Modal */}
            {managingResources && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="bg-[#0A0A0A] border border-white/[0.08] w-full max-w-2xl rounded-[3rem] shadow-2xl p-12 space-y-8 animate-in zoom-in-95 duration-500">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Resource Archive</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">{managingResources.name}</p>
                            </div>
                            <button onClick={() => setManagingResources(null)} className="w-12 h-12 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors border border-white/[0.08] text-2xl font-light">&times;</button>
                        </div>

                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                            {managingResources.resources.length > 0 ? managingResources.resources.map((res: any) => (
                                <div key={res.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:bg-white/5 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{res.name}</p>
                                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                                            <span>{res.type}</span>
                                            {res.size && <span>• {(res.size / (1024 * 1024)).toFixed(2)} MB</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteTargetResource(res.id)}
                                        disabled={isDeletingResource === res.id}
                                        className="p-2 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-30"
                                    >
                                        {isDeletingResource === res.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center py-12 space-y-4 opacity-30">
                                    <Archive size={40} className="mx-auto" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No assets archived for this vector</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-white/[0.08]">
                            <label className={`w-full py-4 border-2 border-dashed border-white/[0.08] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all ${uploadProgress[`res-${managingResources.id}`] !== undefined ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload size={24} className="text-muted-foreground/30 mb-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {uploadProgress[`res-${managingResources.id}`] !== undefined ? `Compiling Asset ${uploadProgress[`res-${managingResources.id}`]}%` : 'Inject New Global Resource'}
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        setUploadProgress(prev => ({ ...prev, [`res-${managingResources.id}`]: 0 }));

                                        try {
                                            const data = await uploadFile(file,
                                                { tenantId: 'system', courseId: selectedCourse?.id || 'global' },
                                                (percent) => setUploadProgress(prev => ({ ...prev, [`res-${managingResources.id}`]: percent }))
                                            );

                                            const res = await fetch(`/api/admin/global-courses/${selectedCourse?.id}/resources`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    name: data.name,
                                                    url: data.url,
                                                    type: file.type.startsWith('video/') ? 'VIDEO' : file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
                                                    size: data.size
                                                })
                                            });
                                            if (res.ok) {
                                                const newRes = await res.json();
                                                setManagingResources(prev => prev ? {
                                                    ...prev,
                                                    resources: [...prev.resources, newRes]
                                                } : null);
                                                if (selectedCourse) fetchCourseDetails(selectedCourse.id);
                                            }
                                        } finally {
                                            setUploadProgress(prev => ({ ...prev, [`res-${managingResources.id}`]: undefined as any }));
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* ── STATISTICS MODAL ── */}
            {showStatsModal && courseStats && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300" onClick={() => setShowStatsModal(false)}>
                    <div className="bg-[#0A0A0B] border border-white/[0.08] w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-white/[0.08] shrink-0">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1">Blueprint Analytics</p>
                                <h2 className="text-xl font-black text-white">{selectedCourse?.title}</h2>
                            </div>
                            <button onClick={() => setShowStatsModal(false)} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
                                <XCircle size={18} />
                            </button>
                        </div>

                        {/* KPI Strip */}
                        <div className="grid grid-cols-4 gap-4 px-8 py-6 border-b border-white/[0.08] shrink-0">
                            {[
                                { label: 'Tenant Claims', value: courseStats.totalClaims, color: 'text-blue-400', icon: Globe },
                                { label: 'Global Students', value: courseStats.totalEnrollments, color: 'text-emerald-400', icon: Users },
                                { label: 'Completions', value: courseStats.totalCompletions, color: 'text-purple-400', icon: Award },
                                { label: 'Success Rate', value: `${courseStats.avgCompletionRate}%`, color: 'text-amber-400', icon: TrendingUp },
                            ].map(kpi => (
                                <div key={kpi.label} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                                    <kpi.icon size={16} className={`mx-auto mb-2 ${kpi.color}`} />
                                    <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 mt-1">{kpi.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Body: Two sections */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">

                            {/* Tenant Breakdown */}
                            {courseStats.tenantBreakdown.length > 0 && (
                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Globe size={12} className="text-blue-400" /> Tenant Breakdown
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/[0.06]">
                                                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Company</th>
                                                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subdomain</th>
                                                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Enrollments</th>
                                                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Completions</th>
                                                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.04]">
                                                {courseStats.tenantBreakdown.map((t: any) => {
                                                    const rate = t.enrollments > 0 ? Math.round((t.completions / t.enrollments) * 100) : 0;
                                                    return (
                                                        <tr key={t.tenantId} className="hover:bg-white/[0.02] transition-colors">
                                                            <td className="py-3 font-bold text-sm text-white">{t.name}</td>
                                                            <td className="py-3 font-mono text-xs text-blue-400">{t.subdomain}</td>
                                                            <td className="py-3 text-right text-sm font-bold text-white">{t.enrollments}</td>
                                                            <td className="py-3 text-right text-sm font-bold text-emerald-400">{t.completions}</td>
                                                            <td className="py-3 text-right">
                                                                <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${rate >= 80 ? 'bg-emerald-500/10 text-emerald-400' : rate >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                    {rate}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {/* Learner Stats */}
                            {courseStats.learnerStats.length > 0 && (
                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Users size={12} className="text-emerald-400" /> Learner Progress ({courseStats.learnerStats.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {courseStats.learnerStats.map((ls: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                                                <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-black text-purple-400 text-xs shrink-0">
                                                    {ls.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-sm font-bold text-white truncate">{ls.name || 'Anonymous'}</p>
                                                        <span className={`text-xs font-black ml-2 shrink-0 ${ls.isCompleted ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                                                            {ls.isCompleted ? '✓ Completed' : `${ls.percentage}%`}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${ls.isCompleted ? 'bg-emerald-500' : 'bg-purple-500'}`}
                                                            style={{ width: `${ls.percentage}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mt-1">{ls.tenantName} · {ls.completedCount}/{ls.totalLessons} lessons</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {courseStats.learnerStats.length === 0 && courseStats.tenantBreakdown.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                    <BarChart3 size={48} className="text-muted-foreground mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No learner data available yet</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 border-t border-white/[0.08] shrink-0 flex justify-between items-center">
                            <p className="text-[10px] text-muted-foreground/50">Showing up to 100 learners · Live data</p>
                            <button
                                onClick={() => setShowStatsModal(false)}
                                className="px-8 py-3 bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
