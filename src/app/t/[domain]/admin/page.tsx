'use client';

import { ThemeToggle } from "@/components/ThemeToggle";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    LayoutDashboard, BookOpen, Users, Settings, Palette,
    Globe, Plus, XCircle, ChevronRight, ChevronLeft, Save, Upload,
    Trash2, Edit3, CheckCircle2, Megaphone, Loader2,
    MoreVertical, GripVertical, Eye, EyeOff, Video, FileText, Lock,
    BarChart3, Clock, UserCheck, Award, CheckCircle, AlertCircle, Info, Bell, Mic, Archive, LogOut, User
} from 'lucide-react';

type Tab = 'overview' | 'courses' | 'students' | 'announcements' | 'branding' | 'domains' | 'settings' | 'certificates' | 'reports';

// Toast Types
type ToastType = 'success' | 'error' | 'info';
interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

// Utility function to generate a random password
const generateRandomPassword = (length = 10) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let retVal = '';
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
};

export default function ClientAdminDashboard() {
    const params = useParams();
    const router = useRouter();
    const domain = params.domain as string;
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Profile State
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [userName, setUserName] = useState('Admin');
    const [userEmail, setUserEmail] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [profileForm, setProfileForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [stats, setStats] = useState({
        students: 0,
        courses: 0,
        enrollments: 0,
        completionRate: 0,
        avgProgress: 0,
        avgQuizScore: 0
    });
    const [courses, setCourses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [coursePerformance, setCoursePerformance] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [branding, setBranding] = useState({ name: domain.charAt(0).toUpperCase() + domain.slice(1), primaryColor: '#3b82f6' });

    // Course Builder state
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [courseFilter, setCourseFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [courseForm, setCourseForm] = useState({ title: '', description: '', thumbnail: '', skillLevel: 'All Levels', languages: 'English', captions: false });
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [newLessonForms, setNewLessonForms] = useState<Record<string, { title: string; content: string; videoUrl: string; pdfUrl?: string; type: 'VIDEO' | 'PPT' | 'QUIZ' | 'TEXT'; isActive: boolean; resources: any[] }>>({});
    const [activeQuizLesson, setActiveQuizLesson] = useState<{ moduleId: string; lessonId?: string } | null>(null);
    const [quizForm, setQuizForm] = useState<{ title: string; description: string; passingScore: number; retakeAllowed: boolean; maxAttempts: number; isRandomized: boolean; randomCount: number; questions: any[] }>({
        title: '',
        description: '',
        passingScore: 70,
        retakeAllowed: true,
        maxAttempts: 0,
        isRandomized: false,
        randomCount: 0,
        questions: []
    });
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [isSavingGeneratedQuiz, setIsSavingGeneratedQuiz] = useState<Record<string, boolean>>({});
    const [activeLessonForms, setActiveLessonForms] = useState<Record<string, boolean>>({});
    const [editingLessonIds, setEditingLessonIds] = useState<Record<string, string | null>>({});
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [moduleEditTitle, setModuleEditTitle] = useState('');
    const [courseStats, setCourseStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [validationErrors, setValidationErrors] = useState<Record<string, any>>({});

    // Toast State
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmModal, setConfirmModal] = useState<{
        title: string;
        message: string;
        resolve: (v: boolean) => void;
        variant?: 'danger' | 'info'
    } | null>(null);

    const askConfirmation = (title: string, message: string, variant: 'danger' | 'info' = 'danger') => {
        return new Promise<boolean>((resolve) => {
            setConfirmModal({ title, message, resolve, variant });
        });
    };


    const addToast = (message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    // Student state
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [studentForm, setStudentForm] = useState({ name: '', email: '', password: generateRandomPassword() });
    const [justCreatedStudent, setJustCreatedStudent] = useState<any>(null); // To show success link

    // Edit / Reset Student State
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [resetPassword, setResetPassword] = useState('');
    const [resettingPwd, setResettingPwd] = useState(false);

    // Announcement state
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '', imageUrl: '', documentUrl: '' });
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
    const [announcementPage, setAnnouncementPage] = useState(1);
    const ANNOUNCEMENTS_PER_PAGE = 5;

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        if (profileForm.newPassword !== profileForm.confirmPassword) {
            addToast('New passwords do not match', 'error');
            return;
        }

        setIsUpdatingProfile(true);
        try {
            const res = await fetch(`/api/t/${domain}/student/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    currentPassword: profileForm.currentPassword,
                    newPassword: profileForm.newPassword
                })
            });
            const data = await res.json();
            if (res.ok) {
                addToast('Profile updated successfully', 'success');
                setShowProfileModal(false);
                setProfileForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                // Refresh profile data
                const profileRes = await fetch(`/api/t/${domain}/student/profile?userId=${userId}`);
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setUserName(profileData.name || 'Admin');
                    setUserEmail(profileData.email || '');
                }
            } else {
                addToast(data.error || 'Failed to update profile', 'error');
            }
        } catch (e) {
            addToast('Error updating profile', 'error');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            // VERIFY SESSION FIRST
            const sessionRes = await fetch('/api/auth/session');
            if (!sessionRes.ok) {
                router.push(`/t/${domain}/login`);
                return;
            }
            const { user } = await sessionRes.json();
            
            // Double check role
            if (user.role === 'STUDENT') {
                router.push(`/t/${domain}/dashboard`);
                return;
            }

            setUserId(user.id);
            setUserName(user.name || 'Admin');
            setUserEmail(user.email || '');

            const [coursesRes, studentsRes, announcementsRes, statsRes] = await Promise.all([
                fetch(`/api/t/${domain}/courses`),
                fetch(`/api/t/${domain}/students`),
                fetch(`/api/t/${domain}/announcements`),
                fetch(`/api/t/${domain}/admin/stats`)
            ]);
            const [c, s, a, st] = await Promise.all([
                coursesRes.json(),
                studentsRes.json(),
                announcementsRes.json(),
                statsRes.json()
            ]);

            setCourses(Array.isArray(c) ? c : []);
            setStudents(Array.isArray(s) ? s : []);
            setAnnouncements(Array.isArray(a) ? a : []);

            if (st.stats) {
                setStats(st.stats);
                setRecentActivity(st.recentActivity || []);
                setCoursePerformance(st.coursePerformance || []);
            } else {
                // Fallback for students/courses count if stats API fails
                setStats(prev => ({
                    ...prev,
                    students: (Array.isArray(s) ? s : []).length,
                    courses: (Array.isArray(c) ? c : []).length
                }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [domain, router]);

    const [sharingSettings, setSharingSettings] = useState({ allowSelfRegistration: false, supportEmail: '' });
    const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    // Multi-level Resource Management
    const [managingResources, setManagingResources] = useState<{ id: string, type: 'COURSE' | 'MODULE', name: string, resources: any[] } | null>(null);
    const [isUploadingTargetResource, setIsUploadingTargetResource] = useState(false);

    const fetchCourseStats = async (courseId: string) => {
        setLoadingStats(true);
        try {
            const res = await fetch(`/api/t/${domain}/courses/${courseId}/stats`);
            const data = await res.json();
            setCourseStats(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Poll for transcription status updates if any video is currently processing
    useEffect(() => {
        if (!selectedCourse || activeTab !== 'courses') return;

        const hasProcessing = selectedCourse.modules?.some((mod: any) =>
            mod.lessons?.some((lesson: any) => lesson.type === 'VIDEO' && lesson.transcriptStatus === 'PROCESSING')
        );

        if (!hasProcessing) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/t/${domain}/courses/${selectedCourse.id}`);
                if (res.ok) {
                    const updated = await res.json();
                    setSelectedCourse(updated);

                    // Check if we can stop polling
                    const stillProcessing = updated.modules?.some((mod: any) =>
                        mod.lessons?.some((lesson: any) => lesson.type === 'VIDEO' && lesson.transcriptStatus === 'PROCESSING')
                    );
                    if (!stillProcessing) {
                        clearInterval(interval);
                        fetchAll(); // Refresh the main list too
                    }
                }
            } catch (e) {
                console.error("Polling error:", e);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedCourse?.id, selectedCourse?.modules, domain, activeTab, fetchAll]);

    const createCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseForm.title.trim()) {
            setValidationErrors(prev => ({ ...prev, course: { title: 'Course title is required' } }));
            addToast('Course title is required', 'error');
            return;
        }
        setValidationErrors(prev => ({ ...prev, course: null }));
        try {
            const res = await fetch(`/api/t/${domain}/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseForm)
            });
            if (res.ok) {
                setShowCourseModal(false);
                setCourseForm({ title: '', description: '', thumbnail: '', skillLevel: 'All Levels', languages: 'English', captions: false });
                setThumbnailPreview(null);
                fetchAll();
                addToast('Course created successfully');
            } else {
                addToast('Failed to create course', 'error');
            }
        } catch (e) {
            console.error(e);
            addToast('Error saving course', 'error');
        }
    };

    const togglePublish = async (course: any) => {
        const originalStatus = course.isPublished;

        // Optimistic Update
        setCourses(prev => prev.map(c => c.id === course.id ? { ...c, isPublished: !originalStatus } : c));
        if (selectedCourse?.id === course.id) {
            setSelectedCourse({ ...selectedCourse, isPublished: !originalStatus });
        }

        try {
            const res = await fetch(`/api/t/${domain}/courses/${course.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...course, isPublished: !originalStatus })
            });

            if (!res.ok) throw new Error();
            addToast(`Course ${!originalStatus ? 'published' : 'hidden'} successfully`);
        } catch (e) {
            // Rollback
            setCourses(prev => prev.map(c => c.id === course.id ? { ...c, isPublished: originalStatus } : c));
            if (selectedCourse?.id === course.id) {
                setSelectedCourse({ ...selectedCourse, isPublished: originalStatus });
            }
            addToast('Failed to update course status', 'error');
        }
    };

    const uploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingThumbnail(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setCourseForm(prev => ({ ...prev, thumbnail: data.url }));
                setThumbnailPreview(data.url);
                addToast('Thumbnail uploaded successfully');
            } else {
                addToast(data.error || 'Upload failed', 'error');
            }
        } catch (err) {
            addToast('Upload failed', 'error');
        } finally {
            setIsUploadingThumbnail(false);
        }
    };

    const deleteCourse = async (e: React.MouseEvent, courseId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const confirmed = await askConfirmation(
            'Delete Course?',
            'This action is permanent and will remove all modules, lessons, and content associated with this course.'
        );
        if (!confirmed) return;
        try {
            const res = await fetch(`/api/t/${domain}/courses/${courseId}`, { method: 'DELETE' });

            if (res.ok) {
                setSelectedCourse(null);
                fetchAll();
                addToast('Course deleted successfully');
            } else if (res.status === 409) {
                const data = await res.json();
                if (await askConfirmation('Unpublish Course?', data.error + ' Would you like to unpublish it instead?', 'info')) {
                    togglePublish(selectedCourse);
                }
            } else {
                const data = await res.json();
                addToast(data.error || 'Failed to delete course', 'error');
            }
        } catch (e) {
            addToast('Error deleting course', 'error');
        }
    };

    const addModule = async (courseId: string) => {
        if (!newModuleTitle.trim()) {
            setValidationErrors(prev => ({ ...prev, newModule: 'Module title is required' }));
            addToast('Module title is required', 'error');
            return;
        }
        setValidationErrors(prev => ({ ...prev, newModule: null }));
        const res = await fetch(`/api/t/${domain}/courses/${courseId}/modules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newModuleTitle })
        });

        if (res.ok) {
            setNewModuleTitle('');
            // Fetch updated course data immediately to reflect the new module
            const courseRes = await fetch(`/api/t/${domain}/courses/${courseId}`);
            const updatedCourse = await courseRes.json();
            setSelectedCourse(updatedCourse);
            fetchAll(); // Refresh the main courses list in background
            addToast('Module added successfully');
        } else {
            const error = await res.json();
            addToast(error.error || 'Failed to add module', 'error');
        }
    };

    const handleResourceUpload = async (moduleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isVideo = file.type.startsWith('video/');
        const isPPT = file.type === 'application/pdf' || file.type.includes('presentation') || file.type.includes('powerpoint');

        if (file.type.startsWith('video/') && file.type !== 'video/mp4') {
            addToast('Only MP4 videos are supported for the course player.', 'error');
            return;
        }

        const allowedTypes = ['video/mp4', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
        if (!allowedTypes.includes(file.type)) {
            addToast('Invalid file format. Please upload MP4, PDF, DOCX, or PPTX.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

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
                                resources: [...(currentForm.resources || []), {
                                    id: Math.random().toString(36).substring(2, 9),
                                    name: data.name,
                                    url: data.url,
                                    type: isVideo ? 'VIDEO' : 'DOCUMENT',
                                    size: data.size
                                }]
                            }
                        };
                    });
                    setUploadProgress(prev => {
                        const next = { ...prev };
                        delete next[`res-${moduleId}`];
                        return next;
                    });
                    resolve();
                } else {
                    const error = JSON.parse(xhr.responseText);
                    addToast(error.error || 'Upload failed', 'error');
                    setUploadProgress(prev => {
                        const next = { ...prev };
                        delete next[`res-${moduleId}`];
                        return next;
                    });
                    reject();
                }
            };

            xhr.onerror = () => {
                addToast('Upload error. Check connection.', 'error');
                setUploadProgress(prev => {
                    const next = { ...prev };
                    delete next[`res-${moduleId}`];
                    return next;
                });
                reject();
            };

            xhr.send(formData);
        });
    };

    const handleMainContentUpload = async (moduleId: string, file: File, type: 'VIDEO' | 'PPT') => {
        if (!file) return;

        if (type === 'VIDEO' && file.type !== 'video/mp4') {
            addToast('Please upload an MP4 file for video lessons.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        return new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload', true);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(prev => ({ ...prev, [moduleId]: percentComplete }));
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const data = JSON.parse(xhr.responseText);
                    setNewLessonForms(prev => ({
                        ...prev,
                        [moduleId]: {
                            ...prev[moduleId],
                            [type === 'VIDEO' ? 'videoUrl' : 'pdfUrl']: data.url
                        }
                    }));
                    addToast(`${type === 'VIDEO' ? 'Video' : 'File'} uploaded successfully`);
                    setUploadProgress(prev => {
                        const next = { ...prev };
                        delete next[moduleId];
                        return next;
                    });
                    resolve();
                } else {
                    const error = JSON.parse(xhr.responseText);
                    addToast(error.error || 'Upload failed', 'error');
                    setUploadProgress(prev => {
                        const next = { ...prev };
                        delete next[moduleId];
                        return next;
                    });
                    reject();
                }
            };

            xhr.onerror = () => {
                addToast('Upload error. Check connection.', 'error');
                setUploadProgress(prev => {
                    const next = { ...prev };
                    delete next[moduleId];
                    return next;
                });
                reject();
            };

            xhr.send(formData);
        });
    };

    const uploadTargetResource = async (file: File) => {
        if (!file || !managingResources) return;
        setIsUploadingTargetResource(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();

            const res = await fetch(`/api/t/${domain}/resources`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: uploadData.name,
                    url: uploadData.url,
                    type: file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
                    size: uploadData.size,
                    moduleId: managingResources.type === 'MODULE' ? managingResources.id : undefined,
                    courseId: managingResources.type === 'COURSE' ? managingResources.id : undefined
                })
            });

            if (res.ok) {
                const newResource = await res.json();
                setManagingResources(prev => prev ? { ...prev, resources: [...prev.resources, newResource] } : null);
                // Also update the selectedCourse state to reflect changes immediately
                if (selectedCourse) {
                    if (managingResources.type === 'COURSE') {
                        setSelectedCourse({ ...selectedCourse, resources: [...(selectedCourse.resources || []), newResource] });
                    } else {
                        setSelectedCourse({
                            ...selectedCourse,
                            modules: selectedCourse.modules.map((m: any) =>
                                m.id === managingResources.id ? { ...m, resources: [...(m.resources || []), newResource] } : m
                            )
                        });
                    }
                }
                addToast('Resource added successfully');
            }
        } catch (e) {
            addToast('Failed to upload resource', 'error');
        } finally {
            setIsUploadingTargetResource(false);
        }
    };

    const deleteTargetResource = async (resourceId: string) => {
        if (!managingResources) return;
        if (!(await askConfirmation('Delete Resource?', 'Are you sure you want to delete this resource?'))) return;
        if (!managingResources) return;
        try {
            const res = await fetch(`/api/t/${domain}/resources/${resourceId}`, { method: 'DELETE' });
            if (res.ok) {
                setManagingResources(prev => prev ? { ...prev, resources: prev.resources.filter(r => r.id !== resourceId) } : null);
                if (selectedCourse) {
                    if (managingResources.type === 'COURSE') {
                        setSelectedCourse({ ...selectedCourse, resources: (selectedCourse.resources || []).filter((r: any) => r.id !== resourceId) });
                    } else {
                        setSelectedCourse({
                            ...selectedCourse,
                            modules: selectedCourse.modules.map((m: any) =>
                                m.id === managingResources.id ? { ...m, resources: (m.resources || []).filter((r: any) => r.id !== resourceId) } : m
                            )
                        });
                    }
                }
                addToast('Resource removed');
            }
        } catch (e) {
            addToast('Failed to delete resource', 'error');
        }
    };


    const deleteLesson = async (e: React.MouseEvent, moduleId: string, lessonId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!(await askConfirmation('Delete Lesson?', 'Are you sure you want to delete this lesson? This action cannot be undone.'))) return;

        try {
            const courseId = selectedCourse?.id;
            if (!courseId) throw new Error('No course selected');

            const resDel = await fetch(`/api/t/${domain}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
                method: 'DELETE'
            });

            if (resDel.ok) {
                addToast('Lesson deleted successfully', 'success');
                const res = await fetch(`/api/t/${domain}/courses/${courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    setSelectedCourse(data);
                }
            } else if (resDel.status === 409) {
                const errorData = await resDel.json();
                if (await askConfirmation('Deactivate Lesson?', errorData.error + ' Would you like to deactivate it instead to hide it from students?', 'info')) {
                    const mod = selectedCourse.modules.find((m: any) => m.id === moduleId);
                    const lesson = mod?.lessons?.find((l: any) => l.id === lessonId);
                    if (lesson) toggleLessonStatus(moduleId, lesson);
                }
            } else {
                const error = await resDel.json();
                throw new Error(error.error || 'Failed to delete lesson');
            }
        } catch (error: any) {
            console.error('Delete Lesson Error:', error);
            addToast(error.message, 'error');
        }
    };

    const addOrUpdateLesson = async (moduleId: string, closeAfter: boolean = true) => {
        const lessonForm = newLessonForms[moduleId];
        if (!lessonForm?.title?.trim()) {
            setValidationErrors(prev => ({ ...prev, [`lesson-${moduleId}`]: { title: 'Lesson title is required' } }));
            addToast('Lesson title is required', 'error');
            return null;
        }
        setValidationErrors(prev => ({ ...prev, [`lesson-${moduleId}`]: null }));

        const courseId = selectedCourse?.id;
        const editingId = editingLessonIds[moduleId];

        const url = editingId
            ? `/api/t/${domain}/courses/${courseId}/modules/${moduleId}/lessons/${editingId}`
            : `/api/t/${domain}/courses/${courseId}/modules/${moduleId}/lessons`;

        const resUpdate = await fetch(url, {
            method: editingId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lessonForm)
        });

        if (resUpdate.ok) {
            const savedLesson = await resUpdate.json();
            if (closeAfter) {
                setNewLessonForms(prev => ({ ...prev, [moduleId]: { title: '', content: '', videoUrl: '', pdfUrl: '', type: 'TEXT', isActive: true, resources: [] } }));
                setActiveLessonForms(prev => ({ ...prev, [moduleId]: false }));
                setEditingLessonIds(prev => ({ ...prev, [moduleId]: null }));
            } else {
                setNewLessonForms(prev => ({ ...prev, [moduleId]: { title: '', content: '', videoUrl: '', pdfUrl: '', type: 'TEXT', isActive: true, resources: [] } }));
                setEditingLessonIds(prev => ({ ...prev, [moduleId]: null }));
            }

            fetchCourseDetails(courseId);
            addToast('Lesson saved successfully');
            return savedLesson;
        } else {
            const error = await resUpdate.json();
            addToast(error.error || 'Failed to save lesson', 'error');
            return null;
        }
    };

    const startEditingLesson = (moduleId: string, lesson: any) => {
        setNewLessonForms(prev => ({
            ...prev,
            [moduleId]: {
                title: lesson.title,
                content: lesson.content || '',
                videoUrl: lesson.videoUrl || '',
                pdfUrl: lesson.pdfUrl || '',
                type: lesson.type || 'TEXT',
                isActive: lesson.isActive ?? true,
                resources: lesson.resources || []
            }
        }));
        setEditingLessonIds(prev => ({ ...prev, [moduleId]: lesson.id }));
        setActiveLessonForms(prev => ({ ...prev, [moduleId]: true }));
    };

    const generateAIQuiz = async () => {
        if (!selectedCourse) return;
        setIsGeneratingQuiz(true);
        try {
            const url = `/api/t/${domain}/courses/${selectedCourse.id}/generate-quiz${activeQuizLesson?.lessonId ? `?lessonId=${activeQuizLesson.lessonId}` : ''}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: 10 }) // Default to 10 questions for a pool
            });
            const data = await res.json();
            if (res.ok && data.questions) {
                setQuizForm(prev => ({
                    ...prev,
                    questions: [...prev.questions, ...data.questions],
                    isRandomized: (prev.questions.length + data.questions.length) > 5,
                    randomCount: Math.min(5, prev.questions.length + data.questions.length)
                }));
                addToast('AI generated ' + data.questions.length + ' questions!');
            } else {
                addToast(data.error || 'Failed to generate quiz', 'error');
            }
        } catch (e) {
            addToast('AI Generation failed', 'error');
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    const toggleLessonStatus = async (moduleId: string, lesson: any) => {
        const originalStatus = lesson.isActive;

        // Optimistic Update
        if (selectedCourse) {
            const updatedModules = selectedCourse.modules.map((m: any) => {
                if (m.id !== moduleId) return m;
                return {
                    ...m,
                    lessons: m.lessons.map((l: any) => l.id === lesson.id ? { ...l, isActive: !originalStatus } : l)
                };
            });
            setSelectedCourse({ ...selectedCourse, modules: updatedModules });
        }

        try {
            const courseId = selectedCourse?.id;
            const resUpdate = await fetch(`/api/t/${domain}/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...lesson, isActive: !originalStatus })
            });

            if (!resUpdate.ok) throw new Error();
            addToast(`Lesson ${!originalStatus ? 'activated' : 'deactivated'}`);
        } catch (e) {
            // Rollback
            if (selectedCourse) {
                const rolledBackModules = selectedCourse.modules.map((m: any) => {
                    if (m.id !== moduleId) return m;
                    return {
                        ...m,
                        lessons: m.lessons.map((l: any) => l.id === lesson.id ? { ...l, isActive: originalStatus } : l)
                    };
                });
                setSelectedCourse({ ...selectedCourse, modules: rolledBackModules });
            }
            addToast('Failed to update lesson status', 'error');
        }
    };

    const toggleModuleStatus = async (module: any) => {
        const courseId = selectedCourse?.id;
        const resUpdate = await fetch(`/api/t/${domain}/courses/${courseId}/modules/${module.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: module.title, isActive: !module.isActive })
        });
        if (resUpdate.ok) {
            fetchCourseDetails(courseId);
        }
    };

    const updateModuleTitle = async (moduleId: string) => {
        if (!moduleEditTitle.trim()) {
            setValidationErrors(prev => ({ ...prev, [`module-${moduleId}`]: { title: 'Module title is required' } }));
            return;
        }
        setValidationErrors(prev => ({ ...prev, [`module-${moduleId}`]: null }));

        const courseId = selectedCourse?.id;
        try {
            const resUpdate = await fetch(`/api/t/${domain}/courses/${courseId}/modules/${moduleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: moduleEditTitle })
            });
            if (resUpdate.ok) {
                setEditingModuleId(null);
                setModuleEditTitle('');
                fetchCourseDetails(courseId);
                addToast('Module updated');
            } else {
                addToast('Failed to update module', 'error');
            }
        } catch (e) {
            console.error(e);
            addToast('Error updating module', 'error');
        }
    };

    const deleteModule = async (e: React.MouseEvent, moduleId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!(await askConfirmation('Delete Module?', 'Are you sure you want to delete this module and all its lessons?'))) return;
        const courseId = selectedCourse?.id;
        try {
            const resDelete = await fetch(`/api/t/${domain}/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' });

            if (resDelete.ok) {
                fetchCourseDetails(courseId);
                fetchAll();
                addToast('Module deleted successfully', 'success');
            } else {
                const data = await resDelete.json();
                if (resDelete.status === 409) {
                    if (await askConfirmation('Deactivate Module?', 'This module cannot be deleted because students have already started or completed it. Would you like to deactivate it instead to hide it from students?', 'info')) {
                        const mod = selectedCourse.modules.find((m: any) => m.id === moduleId);
                        if (mod) toggleModuleStatus(mod);
                    }
                } else {
                    addToast(data.error || 'Failed to delete module', 'error');
                }
            }
        } catch (error) {
            console.error('Delete module failed', error);
            addToast('Error deleting module', 'error');
        }
    };

    const fetchCourseDetails = async (courseId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/t/${domain}/courses/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedCourse(data);
            } else {
                addToast('Failed to fetch course details', 'error');
            }
        } catch (e) {
            console.error(e);
            addToast('Error fetching course', 'error');
        } finally {
            setLoading(false);
        }
    };

    const saveQuiz = async () => {
        if (!activeQuizLesson) return;

        // Validation
        const errors: Record<string, any> = {};
        if (!quizForm.title.trim()) errors.title = 'Quiz title is required';

        const questionErrors: Record<number, any> = {};
        quizForm.questions.forEach((q, idx) => {
            const qErr: any = {};
            if (!q.text.trim()) qErr.text = 'Question text is required';
            const optErrors: Record<number, string> = {};
            q.options.forEach((o: any, oIdx: number) => {
                if (!o.text.trim()) optErrors[oIdx] = 'Option text is required';
            });
            if (Object.keys(optErrors).length > 0) qErr.options = optErrors;
            if (Object.keys(qErr).length > 0) questionErrors[idx] = qErr;
        });

        if (Object.keys(questionErrors).length > 0) errors.questions = questionErrors;

        if (Object.keys(errors).length > 0) {
            setValidationErrors(prev => ({ ...prev, quiz: errors }));
            addToast('Please fix the errors in the quiz', 'error');
            return;
        }
        setValidationErrors(prev => ({ ...prev, quiz: null }));

        const { moduleId, lessonId } = activeQuizLesson;
        const courseId = selectedCourse?.id;

        try {
            const resQuiz = await fetch(`/api/t/${domain}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quizForm)
            });

            if (resQuiz.ok) {
                setActiveQuizLesson(null);
                fetchCourseDetails(courseId);
                addToast('Quiz saved successfully');
            } else {
                addToast('Failed to save quiz', 'error');
            }
        } catch (e) {
            console.error(e);
            addToast('Error saving quiz', 'error');
        }
    };

    const createStudent = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const errors: Record<string, string> = {};
        if (!studentForm.name.trim()) errors.name = 'Name is required';
        if (!studentForm.email.trim()) errors.email = 'Email is required';
        if (!studentForm.password.trim()) errors.password = 'Password is required';

        if (Object.keys(errors).length > 0) {
            setValidationErrors(prev => ({ ...prev, student: errors }));
            return;
        }
        setValidationErrors(prev => ({ ...prev, student: null }));

        try {
            const res = await fetch(`/api/t/${domain}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentForm)
            });
            if (res.ok) {
                setJustCreatedStudent({ ...studentForm });
                fetchAll();
                addToast('Student created successfully');
            } else {
                addToast('Failed to create student', 'error');
            }
        } catch (e) {
            console.error(e);
            addToast('Error saving student', 'error');
        }
    };

    const deleteStudent = async (studentId: string) => {
        if (!(await askConfirmation('Delete Student?', 'Are you sure you want to permanently delete this student? All their progress and data will be lost.'))) return;
        
        try {
            const res = await fetch(`/api/t/${domain}/students?studentId=${studentId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                addToast('Student deleted successfully');
                fetchAll();
            } else {
                addToast('Failed to delete student', 'error');
            }
        } catch (e) {
            console.error(e);
            addToast('Error deleting student', 'error');
        }
    };

    const updateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent) return;

        try {
            const res = await fetch(`/api/t/${domain}/students`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: editingStudent.id,
                    name: editingStudent.name,
                    email: editingStudent.email
                })
            });
            if (res.ok) {
                setIsEditStudentModalOpen(false);
                setEditingStudent(null);
                fetchAll();
                addToast('Student updated successfully');
            } else {
                addToast('Failed to update student', 'error');
            }
        } catch (e) {
            console.error(e);
            addToast('Error updating student', 'error');
        }
    };

    const toggleStudentStatus = async (student: any) => {
        const originalStatus = student.isActive !== false;
        const newStatus = !originalStatus;

        // Optimistic Update
        setStudents(prev => prev.map(s => s.id === student.id ? { ...s, isActive: newStatus } : s));
        if (selectedStudent?.id === student.id) {
            setSelectedStudent({ ...selectedStudent, isActive: newStatus });
        }

        try {
            const res = await fetch(`/api/t/${domain}/students`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: student.id, isActive: newStatus })
            });

            if (!res.ok) throw new Error();
            addToast(`Student ${newStatus ? 'activated' : 'deactivated'} successfully`);
        } catch (e) {
            // Rollback
            setStudents(prev => prev.map(s => s.id === student.id ? { ...s, isActive: originalStatus } : s));
            if (selectedStudent?.id === student.id) {
                setSelectedStudent({ ...selectedStudent, isActive: originalStatus });
            }
            addToast('Failed to update student status', 'error');
        }
    };

    const handlePasswordReset = async () => {
        if (!selectedStudent) return;
        setResettingPwd(true);
        const newPass = Math.random().toString(36).slice(-8);
        try {
            const res = await fetch(`/api/t/${domain}/students`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: selectedStudent.id, newPassword: newPass })
            });
            if (res.ok) {
                setResetPassword(newPass);
                addToast('Password reset successful');
            } else {
                addToast('Failed to reset password', 'error');
            }
        } catch (e) {
            addToast('Error resetting password', 'error');
        } finally {
            setResettingPwd(false);
        }
    };

    const createAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const errors: Record<string, string> = {};
        if (!announcementForm.title.trim()) errors.title = 'Title is required';
        if (!announcementForm.body.trim()) errors.body = 'Content is required';

        if (Object.keys(errors).length > 0) {
            setValidationErrors(prev => ({ ...prev, announcement: errors }));
            return;
        }
        setValidationErrors(prev => ({ ...prev, announcement: null }));

        try {
            const res = await fetch(`/api/t/${domain}/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(announcementForm)
            });
            if (res.ok) {
                setShowAnnouncementModal(false);
                setAnnouncementForm({ title: '', body: '', imageUrl: '', documentUrl: '' });
                fetchAll();
                addToast('Announcement posted');
            } else {
                addToast('Failed to post announcement', 'error');
            }
        } catch (e) {
            console.error(e);
            addToast('Error saving announcement', 'error');
        }
    };

    const deleteAnnouncement = async (id: string) => {
        if (!(await askConfirmation('Delete Announcement?', 'Are you sure you want to delete this announcement?'))) return;
        await fetch(`/api/t/${domain}/announcements?id=${id}`, { method: 'DELETE' });
        fetchAll();
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-secondary/10 p-6 flex flex-col gap-8 sticky top-0 h-screen">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm" style={{ backgroundColor: branding.primaryColor }}>
                        {branding.name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-tight">{branding.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Admin Portal</p>
                    </div>
                </div>

                <nav className="space-y-1 flex-1">
                    {([
                        ['overview', 'Overview', LayoutDashboard],
                        ['courses', 'Courses', BookOpen],
                        ['students', 'Students', Users],
                        ['announcements', 'Announcements', Megaphone],
                        ['branding', 'Branding', Palette],
                        ['domains', 'Domains', Globe],
                        ['settings', 'Settings', Settings],
                        ['certificates', 'Certificates', Award],
                        ['reports', 'Reports', BarChart3],
                    ] as [Tab, string, any][]).map(([tab, label, Icon]) => (
                        <button key={tab} onClick={() => { setActiveTab(tab); setSelectedCourse(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
                            <Icon size={18} />
                            {label}
                            {activeTab === tab && <ChevronRight size={14} className="ml-auto" />}
                        </button>
                    ))}
                </nav>

                <button onClick={() => window.open(`/t/${domain}/dashboard`, '_blank')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground border border-border hover:bg-secondary/50 transition-all">
                    <Eye size={14} /> Preview as Student
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                <header className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-tight">
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </h2>
                    <div className="flex items-center gap-4">
                        {activeTab === 'courses' && !selectedCourse && (
                            <button onClick={() => setShowCourseModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap">
                                <Plus size={16} /> New Course
                            </button>
                        )}
                        {activeTab === 'students' && (
                            <button onClick={() => {
                                const pass = Math.random().toString(36).slice(-8);
                                setStudentForm({ ...studentForm, password: pass });
                                setShowStudentModal(true);
                            }} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 whitespace-nowrap">
                                <Plus size={16} /> Add Student
                            </button>
                        )}
                        {activeTab === 'announcements' && (
                            <button onClick={() => setShowAnnouncementModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 whitespace-nowrap">
                                <Plus size={16} /> New Announcement
                            </button>
                        )}

                        <div className="h-6 w-px bg-border/50 mx-2" />
                        <ThemeToggle />

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowProfileModal(true)}
                                className="w-10 h-10 rounded-full border-2 border-primary/20 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-white text-sm hover:scale-105 transition-transform"
                                title="Profile Settings"
                            >
                                <User size={18} />
                            </button>
                            <button
                                onClick={async () => {
                                    await fetch(`/api/t/${domain}/logout`, { method: 'POST' }).catch(() => {});
                                    localStorage.removeItem(`${domain}_userId`);
                                    router.push(`/t/${domain}/login`);
                                }}
                                className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── OVERVIEW ── */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            {[
                                { label: 'Students', value: stats.students, icon: Users, color: 'blue' },
                                { label: 'Courses', value: stats.courses, icon: BookOpen, color: 'purple' },
                                { label: 'Enrollments', value: stats.enrollments, icon: UserCheck, color: 'emerald' },
                                { label: 'Completion', value: `${stats.completionRate}%`, icon: CheckCircle, color: 'emerald' },
                                { label: 'Avg Progress', value: `${stats.avgProgress}%`, icon: BarChart3, color: 'orange' },
                                { label: 'Avg Quiz', value: `${stats.avgQuizScore}%`, icon: Award, color: 'blue' },
                            ].map(card => (
                                <div key={card.label} className="p-4 rounded-2xl glassmorphism border border-border/50 shadow-xl text-center">
                                    <div className="flex justify-center mb-2">
                                        <card.icon size={16} className={`text-${card.color}-400 opacity-60`} />
                                    </div>
                                    <p className="text-2xl font-black mb-0.5">{loading ? '...' : card.value}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{card.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="glassmorphism p-8 rounded-3xl border border-border/50">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-orange-400" /> Latest Announcements</h3>
                                {announcements.length === 0 ? (
                                    <p className="text-muted-foreground italic text-sm">No announcements yet. Publish your first one!</p>
                                ) : announcements.slice(0, 3).map(a => (
                                    <div key={a.id} className="p-4 rounded-xl bg-secondary/20 border border-border/50 mb-3 hover:bg-secondary/30 transition-all">
                                        <p className="font-bold">{a.title}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-1">{a.body}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="glassmorphism p-8 rounded-3xl border border-border/50">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-400" /> Recent Activity</h3>
                                <div className="space-y-4">
                                    {recentActivity.length === 0 ? (
                                        <p className="text-muted-foreground italic text-sm">No recent activity found.</p>
                                    ) : recentActivity.map((activity, idx) => (
                                        <div key={idx} className="flex gap-4 items-start border-l-2 border-primary/20 pl-4 py-1">
                                            <div className="flex-1">
                                                <p className="text-xs font-bold">{activity.user.name}</p>
                                                <p className="text-[11px] text-muted-foreground">{activity.action}</p>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── COURSES ── */}
                {activeTab === 'courses' && (
                    <div className="animate-in fade-in duration-500">
                        {selectedCourse ? (
                            // Course Builder View
                            <div className="space-y-6">
                                <button onClick={() => setSelectedCourse(null)} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                                    ← Back to Courses
                                </button>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-black">{selectedCourse.title}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedCourse.description}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => fetchCourseStats(selectedCourse.id)}
                                            className="px-4 py-2 rounded-xl font-bold text-xs bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all flex items-center gap-2">
                                            <BarChart3 size={14} /> Course Statistics
                                        </button>
                                        <button onClick={() => togglePublish(selectedCourse)}
                                            className={`px-4 py-2 rounded-xl font-bold text-xs border transition-all flex items-center gap-2 ${selectedCourse.isPublished ? 'border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'}`}>
                                            {selectedCourse.isPublished ? <><EyeOff size={14} /> Unpublish Course</> : <><Eye size={14} /> Publish Course</>}
                                        </button>
                                        <button onClick={() => setManagingResources({ id: selectedCourse.id, type: 'COURSE', name: selectedCourse.title, resources: selectedCourse.resources || [] })}
                                            className="px-4 py-2 rounded-xl font-bold text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-2">
                                            <Archive size={14} /> Course Resources
                                        </button>
                                        <button onClick={(e) => deleteCourse(e, selectedCourse.id)}
                                            className="px-4 py-2 rounded-xl font-bold text-xs bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2">
                                            <Trash2 size={14} /> Delete Course
                                        </button>
                                    </div>
                                </div>

                                {courseStats && (
                                    <div className="animate-in slide-in-from-top duration-500 space-y-6">
                                        <div className="grid grid-cols-4 gap-4">
                                            {[
                                                { label: 'Enrollments', value: courseStats.totalEnrollments, icon: Users, color: 'blue' },
                                                { label: 'Completions', value: courseStats.totalCompletions, icon: UserCheck, color: 'emerald' },
                                                { label: 'Completion Rate', value: `${courseStats.totalEnrollments > 0 ? Math.round((courseStats.totalCompletions / courseStats.totalEnrollments) * 100) : 0}%`, icon: CheckCircle2, color: 'purple' },
                                                { label: 'Avg. Time', value: `${courseStats.averageCompletionTimeMinutes}m`, icon: Clock, color: 'orange' },
                                            ].map(stat => (
                                                <div key={stat.label} className="p-4 rounded-xl glassmorphism border border-border/50">
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <stat.icon size={14} />
                                                        <span className="text-[10px] uppercase font-bold tracking-wider">{stat.label}</span>
                                                    </div>
                                                    <p className="text-2xl font-black">{stat.value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="glassmorphism rounded-2xl border border-border/50 overflow-hidden">
                                            <div className="p-4 bg-secondary/20 border-b border-border/50">
                                                <h4 className="text-sm font-bold flex items-center gap-2"><Users size={14} /> Student Progress Detail</h4>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead>
                                                        <tr className="text-muted-foreground border-b border-border/50">
                                                            <th className="p-4 font-bold">Student</th>
                                                            <th className="p-4 font-bold">Progress</th>
                                                            <th className="p-4 font-bold">Time Taken</th>
                                                            <th className="p-4 font-bold">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border/50">
                                                        {courseStats.studentStats.map((s: any) => (
                                                            <tr key={s.userId} className="hover:bg-white/[0.02] transition-colors">
                                                                <td className="p-4">
                                                                    <div className="font-bold">{s.name}</div>
                                                                    <div className="text-[10px] text-muted-foreground">{s.email}</div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                                                                            <div className="h-full bg-primary" style={{ width: `${s.percentage}%` }} />
                                                                        </div>
                                                                        <span className="text-[10px] font-bold text-primary">{s.percentage}%</span>
                                                                    </div>
                                                                    <div className="text-[10px] text-muted-foreground mt-1">{s.completedCount}/{s.totalLessons} lessons</div>
                                                                </td>
                                                                <td className="p-4 font-mono text-xs">{s.isCompleted ? `${s.timeTakenMinutes}m` : '-'}</td>
                                                                <td className="p-4">
                                                                    {s.isCompleted ? (
                                                                        <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase">Completed</span>
                                                                    ) : (
                                                                        <span className="px-2 py-1 rounded-full bg-secondary text-muted-foreground text-[10px] font-bold uppercase">In Progress</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Module Builder */}
                                <div className="space-y-4">
                                    {selectedCourse.modules?.map((mod: any) => (
                                        <div key={mod.id} className="glassmorphism rounded-2xl border border-border/50 overflow-hidden">
                                            <div className="flex items-center gap-3 p-4 bg-secondary/20 border-b border-border/50">
                                                <GripVertical size={16} className="text-muted-foreground" />
                                                <div className="flex-1 flex flex-col">
                                                    {editingModuleId === mod.id ? (
                                                        <div className="flex flex-col gap-1 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={moduleEditTitle}
                                                                    onChange={(e) => {
                                                                        setModuleEditTitle(e.target.value);
                                                                        if (validationErrors[`module-${mod.id}`]?.title) {
                                                                            setValidationErrors(prev => ({ ...prev, [`module-${mod.id}`]: null }));
                                                                        }
                                                                    }}
                                                                    className={`flex-1 bg-background border rounded-lg px-2 py-1 text-sm font-bold focus:outline-none transition-all ${validationErrors[`module-${mod.id}`]?.title ? 'border-red-500 focus:ring-1 focus:ring-red-500/50' : 'border-primary/30 focus:border-primary'}`}
                                                                    autoFocus
                                                                    onKeyDown={(e) => { if (e.key === 'Enter') updateModuleTitle(mod.id); if (e.key === 'Escape') setEditingModuleId(null); }}
                                                                />
                                                                <button onClick={() => updateModuleTitle(mod.id)} className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"><CheckCircle2 size={16} /></button>
                                                                <button onClick={() => setEditingModuleId(null)} className="p-1 text-red-400 hover:text-red-300 transition-colors"><XCircle size={16} /></button>
                                                            </div>
                                                            {validationErrors[`module-${mod.id}`]?.title && <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1">{validationErrors[`module-${mod.id}`].title}</span>}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className={`font-bold ${!mod.isActive ? 'text-muted-foreground line-through' : ''}`}>{mod.title}</p>
                                                            {!mod.isActive && <span className="text-[9px] text-red-400 font-bold uppercase tracking-tighter">Deactivated Module</span>}
                                                        </>
                                                    )}
                                                </div>

                                                <div className="ml-auto flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground mr-2 font-mono">{mod.lessons?.length || 0} Lessons</span>
                                                    <button
                                                        onClick={() => setManagingResources({ id: mod.id, type: 'MODULE', name: mod.title, resources: mod.resources || [] })}
                                                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all bg-background border border-border/50 text-muted-foreground hover:text-blue-400 hover:border-blue-400/30 flex items-center gap-1.5"
                                                    >
                                                        <Archive size={12} /> Resources
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingModuleId(mod.id); setModuleEditTitle(mod.title); }}
                                                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all bg-background border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 flex items-center gap-1.5"
                                                    >
                                                        <Edit3 size={12} /> Edit
                                                    </button>
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); toggleModuleStatus(mod); }}
                                                        className="px-3 py-1.5 rounded-lg bg-background border border-border/50 flex items-center gap-2 cursor-pointer hover:bg-secondary/20 transition-all select-none"
                                                    >
                                                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors relative ${mod.isActive ? 'bg-emerald-500/20' : 'bg-secondary'}`}>
                                                            <div className={`w-3 h-3 rounded-full shadow-sm shadow-black/20 transition-all ${mod.isActive ? 'translate-x-4 bg-emerald-400' : 'bg-muted-foreground'}`} />
                                                        </div>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${mod.isActive ? 'text-emerald-400' : 'text-muted-foreground opacity-50'}`}>
                                                            {mod.isActive ? 'Module Active' : 'Deactivated'}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => deleteModule(e, mod.id)}
                                                        className="p-1.5 rounded-lg transition-all bg-background border border-border/50 text-red-500/70 hover:text-red-400 hover:bg-red-500/10"
                                                        title="Delete Module"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-4 space-y-2">
                                                {mod.lessons?.map((lesson: any) => (
                                                    <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50 group">
                                                        <BookOpen size={14} className="text-muted-foreground" />
                                                        <span className={`text-sm font-medium ${!lesson.isActive ? 'text-muted-foreground line-through' : ''}`}>{lesson.title}</span>
                                                        {!lesson.isActive && <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5 font-bold uppercase italic">Deactivated</span>}
                                                        {lesson.videoUrl && <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-2 py-0.5 font-bold uppercase">Video</span>}
                                                        {lesson.resources?.length > 0 && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5 font-bold uppercase">{lesson.resources.length} Files</span>}
                                                        {lesson.content && <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-2 py-0.5 font-bold uppercase">Text</span>}
                                                        {/* Transcript Status Badge */}
                                                        {lesson.type === 'VIDEO' && lesson.transcriptStatus === 'PROCESSING' && (
                                                            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 font-bold uppercase animate-pulse">⏳ Generating Transcript...</span>
                                                        )}
                                                        {lesson.type === 'VIDEO' && lesson.transcriptStatus === 'READY' && (
                                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5 font-bold uppercase">✅ Transcript Ready</span>
                                                        )}
                                                        {lesson.type === 'VIDEO' && lesson.transcriptStatus === 'FAILED' && (
                                                            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5 font-bold uppercase">❌ Transcript Failed</span>
                                                        )}
                                                        <div className="ml-auto flex items-center gap-2">
                                                            {lesson.type === 'VIDEO' && lesson.transcriptStatus === 'READY' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveQuizLesson({ moduleId: mod.id, lessonId: lesson.id });
                                                                        const q = lesson.quiz || { title: lesson.title, questions: [] };
                                                                        setQuizForm({
                                                                            title: q.title || lesson.title,
                                                                            description: q.description || '',
                                                                            passingScore: q.passingScore || 70,
                                                                            questions: q.questions || [],
                                                                            retakeAllowed: q.retakeAllowed ?? true,
                                                                            maxAttempts: q.maxAttempts || 0,
                                                                            isRandomized: q.isRandomized ?? false,
                                                                            randomCount: q.randomCount || 0
                                                                        });
                                                                    }}
                                                                    className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg bg-background border border-indigo-500/30 transition-all flex items-center gap-1.5 px-2.5"
                                                                    title="Generate Quiz using Whisper AI"
                                                                >
                                                                    <Mic size={12} />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">AI Quiz</span>
                                                                </button>
                                                            )}
                                                            <div
                                                                onClick={(e) => { e.stopPropagation(); toggleLessonStatus(mod.id, lesson); }}
                                                                className="px-3 py-1.5 rounded-lg bg-background border border-border/50 flex items-center gap-2 cursor-pointer hover:bg-secondary/20 transition-all select-none"
                                                            >
                                                                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors relative ${lesson.isActive ? 'bg-emerald-500/20' : 'bg-secondary'}`}>
                                                                    <div className={`w-3 h-3 rounded-full shadow-sm shadow-black/20 transition-all ${lesson.isActive ? 'translate-x-4 bg-emerald-400' : 'bg-muted-foreground'}`} />
                                                                </div>
                                                                <span className={`text-[9px] font-black uppercase tracking-widest ${lesson.isActive ? 'text-emerald-400' : 'text-muted-foreground opacity-50'}`}>
                                                                    {lesson.isActive ? 'Active' : 'Hidden'}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => startEditingLesson(mod.id, lesson)}
                                                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg bg-background border border-border/50 transition-all"
                                                                title="Edit Lesson"
                                                            >
                                                                <Edit3 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => deleteLesson(e, mod.id, lesson.id)}
                                                                className="p-1.5 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg bg-background border border-border/50 transition-all"
                                                                title="Delete Lesson"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Add Lesson Form */}
                                                {activeLessonForms[mod.id] ? (
                                                    <div className="mt-2 p-4 rounded-xl bg-secondary/10 border border-primary/20 space-y-3">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <p className="text-xs font-bold text-primary uppercase tracking-widest">{editingLessonIds[mod.id] ? 'Edit Lesson' : 'Add New Lesson'}</p>
                                                            <button onClick={() => { setActiveLessonForms(prev => ({ ...prev, [mod.id]: false })); setEditingLessonIds(prev => ({ ...prev, [mod.id]: null })); setNewLessonForms(prev => ({ ...prev, [mod.id]: { title: '', content: '', videoUrl: '', pdfUrl: '', type: 'TEXT', isActive: true, resources: [] } })); }} className="text-muted-foreground hover:text-foreground" title="Cancel"><XCircle size={14} /></button>
                                                        </div>

                                                        {/* Type Selector */}
                                                        <div className="flex gap-2 p-1 bg-secondary/20 rounded-xl border border-border/50">
                                                            {(['VIDEO', 'PPT', 'QUIZ', 'TEXT'] as const).map((t) => (
                                                                <button
                                                                    key={t}
                                                                    onClick={() => setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...prev[mod.id], type: t } }))}
                                                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newLessonForms[mod.id]?.type === t || (!newLessonForms[mod.id]?.type && t === 'TEXT') ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                                                >
                                                                    {t}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Lesson Title</label>
                                                                {validationErrors[`lesson-${mod.id}`]?.title && <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1">{validationErrors[`lesson-${mod.id}`].title}</span>}
                                                            </div>
                                                            <input
                                                                placeholder="e.g. Introduction to React..."
                                                                className={`w-full bg-secondary/30 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-all font-bold ${validationErrors[`lesson-${mod.id}`]?.title ? 'border-red-500/50 focus:ring-red-500/50' : 'border-border/50 focus:ring-primary/50'}`}
                                                                value={newLessonForms[mod.id]?.title || ''}
                                                                onChange={e => {
                                                                    setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...prev[mod.id], title: e.target.value } }));
                                                                    if (validationErrors[`lesson-${mod.id}`]?.title) {
                                                                        setValidationErrors(prev => ({ ...prev, [`lesson-${mod.id}`]: null }));
                                                                    }
                                                                }}
                                                            />
                                                        </div>

                                                        {newLessonForms[mod.id]?.type === 'VIDEO' && (
                                                            <div className="space-y-3 animate-in fade-in duration-300">
                                                                <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 flex flex-col items-center gap-3">
                                                                    <Video className="w-8 h-8 text-primary/50" />
                                                                    <div className="text-center">
                                                                        <p className="text-sm font-bold text-foreground">
                                                                            {newLessonForms[mod.id]?.videoUrl ? 'Video Ready' : 'Main Lesson Video'}
                                                                        </p>
                                                                        <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                                                                            {newLessonForms[mod.id]?.videoUrl
                                                                                ? newLessonForms[mod.id]?.videoUrl?.split('/').pop()
                                                                                : "Only MP4 uploads are supported for player playback."}
                                                                        </p>
                                                                    </div>
                                                                    <label className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                                                        {newLessonForms[mod.id]?.videoUrl ? 'Replace Video' : 'Upload MP4'}
                                                                        <input
                                                                            type="file"
                                                                            className="hidden"
                                                                            accept=".mp4"
                                                                            disabled={!!uploadProgress[mod.id]}
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) handleMainContentUpload(mod.id, file, 'VIDEO');
                                                                            }}
                                                                        />
                                                                    </label>
                                                                    {uploadProgress[mod.id] !== undefined && (
                                                                        <div className="w-full max-w-[200px] h-1.5 bg-secondary/50 rounded-full overflow-hidden mt-1">
                                                                            <div
                                                                                className="h-full bg-primary transition-all duration-300 ease-out"
                                                                                style={{ width: `${uploadProgress[mod.id]}%` }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {newLessonForms[mod.id]?.type === 'PPT' && (
                                                            <div className="space-y-3 animate-in fade-in duration-300">
                                                                <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 flex flex-col items-center gap-3">
                                                                    <FileText className="w-8 h-8 text-primary/50" />
                                                                    <div className="text-center">
                                                                        <p className="text-sm font-bold text-foreground">
                                                                            {newLessonForms[mod.id]?.pdfUrl ? 'Content Ready' : 'Main Lesson Content'}
                                                                        </p>
                                                                        <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                                                                            {newLessonForms[mod.id]?.pdfUrl
                                                                                ? newLessonForms[mod.id]?.pdfUrl?.split('/').pop()
                                                                                : "Upload PDF or PPTX for the player."}
                                                                        </p>
                                                                    </div>
                                                                    <label className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                                                        {newLessonForms[mod.id]?.pdfUrl ? 'Replace File' : 'Upload File'}
                                                                        <input
                                                                            type="file"
                                                                            className="hidden"
                                                                            accept=".pdf,.pptx"
                                                                            disabled={!!uploadProgress[mod.id]}
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) handleMainContentUpload(mod.id, file, 'PPT');
                                                                            }}
                                                                        />
                                                                    </label>
                                                                    {uploadProgress[mod.id] !== undefined && (
                                                                        <div className="w-full max-w-[200px] h-1.5 bg-secondary/50 rounded-full overflow-hidden mt-1">
                                                                            <div
                                                                                className="h-full bg-primary transition-all duration-300 ease-out"
                                                                                style={{ width: `${uploadProgress[mod.id]}%` }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {newLessonForms[mod.id]?.type === 'QUIZ' && editingLessonIds[mod.id] && (
                                                            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col items-center gap-3 animate-in fade-in duration-300">
                                                                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                                                                    <Settings size={20} />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="text-sm font-bold">Quiz Configuration</p>
                                                                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                                                                        {mod.lessons?.find((l: any) => l.id === editingLessonIds[mod.id])?.quiz
                                                                            ? 'Quiz already exists'
                                                                            : 'Use Whisper AI to generate questions from your lesson transcript.'}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        const lesson = mod.lessons.find((l: any) => l.id === editingLessonIds[mod.id]);
                                                                        if (lesson) {
                                                                            setActiveQuizLesson({ moduleId: mod.id, lessonId: lesson.id });
                                                                            const q = lesson.quiz || { title: lesson.title, questions: [] };
                                                                            setQuizForm({
                                                                                title: q.title || lesson.title,
                                                                                description: q.description || '',
                                                                                passingScore: q.passingScore || 70,
                                                                                questions: q.questions || [],
                                                                                retakeAllowed: q.retakeAllowed ?? true,
                                                                                maxAttempts: q.maxAttempts || 0,
                                                                                isRandomized: q.isRandomized ?? false,
                                                                                randomCount: q.randomCount || 0
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="px-4 py-2 bg-amber-500 text-white font-bold rounded-lg text-xs hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                                                                >
                                                                    Manage Quiz Questions
                                                                </button>
                                                            </div>
                                                        )}

                                                        {newLessonForms[mod.id]?.type === 'QUIZ' && !editingLessonIds[mod.id] && (
                                                            <div className="p-4 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 flex flex-col items-center gap-3 animate-in fade-in duration-300">
                                                                <Mic size={24} className="text-indigo-400" />
                                                                <div className="text-center">
                                                                    <p className="text-sm font-bold text-indigo-300">Whisper AI Generation</p>
                                                                    <p className="text-[10px] text-muted-foreground max-w-[200px] mx-auto">Click below to save this quiz and instantly generate questions using Whisper AI from your course content.</p>
                                                                </div>
                                                                <button
                                                                    disabled={isSavingGeneratedQuiz[mod.id]}
                                                                    onClick={async () => {
                                                                        setIsSavingGeneratedQuiz(prev => ({ ...prev, [mod.id]: true }));
                                                                        try {
                                                                            const saved = await addOrUpdateLesson(mod.id, false);
                                                                            if (saved) {
                                                                                setActiveQuizLesson({ moduleId: mod.id, lessonId: saved.id });
                                                                                setQuizForm({ title: saved.title, description: '', passingScore: 70, questions: [], retakeAllowed: true, maxAttempts: 0, isRandomized: false, randomCount: 0 });
                                                                                // Close the Add Lesson form so they can focus on the Quiz Modal
                                                                                setActiveLessonForms(prev => ({ ...prev, [mod.id]: false }));
                                                                            }
                                                                        } finally {
                                                                            setIsSavingGeneratedQuiz(prev => ({ ...prev, [mod.id]: false }));
                                                                        }
                                                                    }}
                                                                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
                                                                >
                                                                    {isSavingGeneratedQuiz[mod.id] ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                                                    {isSavingGeneratedQuiz[mod.id] ? 'Saving...' : 'Save & Generate with Whisper AI'}
                                                                </button>
                                                            </div>
                                                        )}

                                                        {newLessonForms[mod.id]?.type === 'TEXT' && (
                                                            <textarea
                                                                placeholder="Lesson text content / instructions..."
                                                                rows={4}
                                                                className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none animate-in slide-in-from-top-2 duration-300"
                                                                value={newLessonForms[mod.id]?.content || ''}
                                                                onChange={e => setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...prev[mod.id], content: e.target.value } }))}
                                                            />
                                                        )}

                                                        <div className="flex items-center gap-2 px-1">
                                                            <input
                                                                type="checkbox"
                                                                id={`lesson-active-${mod.id}`}
                                                                checked={newLessonForms[mod.id]?.isActive ?? true}
                                                                onChange={e => setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...prev[mod.id], isActive: e.target.checked } }))}
                                                                className="rounded border-border/50 bg-secondary/30 text-primary focus:ring-primary/20"
                                                            />
                                                            <label htmlFor={`lesson-active-${mod.id}`} className="text-xs font-medium text-muted-foreground cursor-pointer">Lesson is Active</label>
                                                        </div>

                                                        {/* Stacked Resources Preview */}
                                                        {newLessonForms[mod.id]?.resources?.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {newLessonForms[mod.id].resources.map((res: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center gap-2 bg-secondary/50 border border-border/50 rounded-lg px-2 py-1 text-xs text-muted-foreground">
                                                                        {res.type === 'VIDEO' ? <Video size={12} className="text-blue-400" /> : <FileText size={12} className="text-purple-400" />}
                                                                        <span className="max-w-[150px] truncate">{res.name}</span>
                                                                        <button onClick={() => {
                                                                            const newRes = [...newLessonForms[mod.id].resources];
                                                                            newRes.splice(idx, 1);
                                                                            setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...prev[mod.id], resources: newRes } }));
                                                                        }} className="text-red-400 hover:text-red-300 ml-1"><XCircle size={10} /></button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between mt-4">
                                                            <div className="flex flex-col gap-2 w-full">
                                                                <div className="flex items-center justify-between">
                                                                    <label className={`flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border/50 rounded-lg cursor-pointer transition-colors text-xs font-bold text-muted-foreground ${uploadProgress[`res-${mod.id}`] !== undefined ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                                        <Upload size={14} /> Add Downloadable Resource
                                                                        <input
                                                                            type="file"
                                                                            className="hidden"
                                                                            accept=".mp4,.pdf,.docx,.pptx"
                                                                            disabled={uploadProgress[`res-${mod.id}`] !== undefined}
                                                                            onChange={(e) => handleResourceUpload(mod.id, e)}
                                                                        />
                                                                    </label>
                                                                    <div className="flex items-center gap-2">
                                                                        {!editingLessonIds[mod.id] && (
                                                                            <button onClick={() => addOrUpdateLesson(mod.id, false)} className="px-3 py-1.5 bg-secondary/50 hover:bg-secondary font-bold rounded-lg text-xs transition-colors">
                                                                                Save & Add Next
                                                                            </button>
                                                                        )}
                                                                        <button onClick={() => addOrUpdateLesson(mod.id, true)} className="px-4 py-1.5 bg-primary/20 border border-primary/30 text-primary font-bold rounded-lg text-xs hover:bg-primary/30 transition-colors">
                                                                            <Save size={14} className="inline mr-1" /> {editingLessonIds[mod.id] ? 'Save Changes' : 'Save'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {uploadProgress[`res-${mod.id}`] !== undefined && (
                                                                    <div className="w-full h-1 bg-secondary/30 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                                                                            style={{ width: `${uploadProgress[`res-${mod.id}`]}%` }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => { setActiveLessonForms(prev => ({ ...prev, [mod.id]: true })); setNewLessonForms(prev => ({ ...prev, [mod.id]: { title: '', content: '', videoUrl: '', pdfUrl: '', type: 'TEXT', isActive: true, resources: [] } })); setEditingLessonIds(prev => ({ ...prev, [mod.id]: null })); }} className="w-full mt-2 px-4 py-3 border border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                                                        <Plus size={16} /> Add Lesson
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="space-y-2">
                                        <div className="flex gap-3">
                                            <input
                                                placeholder="New module title..."
                                                className={`flex-1 bg-secondary/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${validationErrors.newModule ? 'border-red-500/50 focus:ring-red-500/50' : 'border-border focus:ring-primary/50'}`}
                                                value={newModuleTitle}
                                                onChange={e => {
                                                    setNewModuleTitle(e.target.value);
                                                    if (validationErrors.newModule) setValidationErrors(prev => ({ ...prev, newModule: null }));
                                                }}
                                                onKeyDown={e => e.key === 'Enter' && addModule(selectedCourse.id)}
                                            />
                                            <button onClick={() => addModule(selectedCourse.id)} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 flex items-center gap-2">
                                                <Plus size={16} /> Add Module
                                            </button>
                                        </div>
                                        {validationErrors.newModule && <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1 ml-1">{validationErrors.newModule}</p>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Courses View
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex p-1 bg-secondary/20 rounded-xl border border-border/50 w-fit">
                                        {[
                                            { id: 'all', label: 'All Courses', count: courses.length },
                                            { id: 'published', label: 'Published', count: courses.filter(c => c.isPublished).length },
                                            { id: 'draft', label: 'Drafts', count: courses.filter(c => !c.isPublished).length },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setCourseFilter(tab.id as any)}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${courseFilter === tab.id ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground hover:bg-border/50'}`}
                                            >
                                                {tab.label}
                                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${courseFilter === tab.id ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'}`}>
                                                    {tab.count}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {loading ? (
                                        <div className="col-span-3 flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                                    ) : courses.filter(c => {
                                        if (courseFilter === 'published') return c.isPublished;
                                        if (courseFilter === 'draft') return !c.isPublished;
                                        return true;
                                    }).length === 0 ? (
                                        <div className="col-span-3 text-center py-20 border-2 border-dashed border-border/50 rounded-3xl bg-secondary/5">
                                            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                                            <p className="font-bold text-lg">No {courseFilter === 'all' ? '' : courseFilter} courses</p>
                                            <p className="text-muted-foreground text-sm">
                                                {courseFilter === 'all' ? 'Create your first course to get started.' : `You don't have any ${courseFilter} courses yet.`}
                                            </p>
                                        </div>
                                    ) : (
                                        courses.filter(c => {
                                            if (courseFilter === 'published') return c.isPublished;
                                            if (courseFilter === 'draft') return !c.isPublished;
                                            return true;
                                        }).map((course) => (
                                            <div key={course.id} className="group rounded-3xl overflow-hidden border border-border/50 glassmorphism hover:border-primary/30 transition-all">
                                                <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-b border-border/50 flex items-center justify-center relative overflow-hidden">
                                                    {course.thumbnail ? (
                                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <BookOpen className="w-12 h-12 text-blue-400 opacity-40 group-hover:scale-110 transition-transform duration-500" />
                                                    )}
                                                    <div className="absolute top-3 right-3">
                                                        <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-full border ${course.isPublished ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-orange-500/20 border-orange-500/30 text-orange-400'}`}>
                                                            {course.isPublished ? 'Published' : 'Draft'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <h3 className="font-bold text-lg leading-tight mb-1">{course.title}</h3>
                                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description || 'No description yet.'}</p>
                                                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                                                        <span>{course.modules?.length || 0} modules · {course.modules?.reduce((s: number, m: any) => s + (m.lessons?.length || 0), 0) || 0} lessons</span>
                                                        <span>{course._count?.enrollments || 0} enrolled</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => fetchCourseDetails(course.id)} className="flex-1 py-2 bg-primary/10 border border-primary/20 text-primary font-bold rounded-lg text-sm hover:bg-primary/20 transition-colors flex items-center justify-center gap-1">
                                                            <Edit3 size={14} /> Build Content
                                                        </button>
                                                        <button onClick={() => togglePublish(course)} className="p-2 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-muted-foreground">
                                                            {course.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── STUDENTS ── */}
                {activeTab === 'students' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="glassmorphism rounded-2xl overflow-hidden border border-border/50">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-secondary/20 border-b border-border/50">
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Learner</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Joined</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Activity</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {students.length === 0 ? (
                                        <tr><td colSpan={6} className="py-16 text-center text-muted-foreground italic">No students enrolled yet.</td></tr>
                                    ) : students.map(s => (
                                        <tr key={s.id} className={`hover:bg-secondary/10 transition-colors ${s.isActive === false ? 'opacity-60 bg-secondary/5' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${s.isActive === false ? 'bg-secondary text-muted-foreground' : 'bg-blue-500/20 text-blue-400'}`}>
                                                        {s.name?.charAt(0) || 'S'}
                                                    </div>
                                                    <div>
                                                        <span className={`font-bold block ${s.isActive === false ? 'line-through' : ''}`}>{s.name}</span>
                                                        {s.isActive === false && <span className="text-[9px] font-black uppercase text-red-400 tracking-wider">Account Deactivated</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">{s.email}</td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-foreground text-xs">{s.enrollments?.length || 0} Enrollments</span>
                                                    {s.enrollments?.length > 0 && (
                                                        <div className="flex gap-1">
                                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 rounded-full font-bold">
                                                                {s.progress?.filter((p: any) => p.completed).length || 0} Lessons Done
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); toggleStudentStatus(s); }}
                                                    className="inline-flex items-center gap-2 cursor-pointer group"
                                                >
                                                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors relative ${s.isActive !== false ? 'bg-emerald-500/20' : 'bg-secondary'}`}>
                                                        <div className={`w-4 h-4 rounded-full shadow-sm transition-all ${s.isActive !== false ? 'translate-x-5 bg-emerald-400' : 'bg-muted-foreground'}`} />
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${s.isActive !== false ? 'text-emerald-400' : 'text-muted-foreground opacity-50'}`}>
                                                        {s.isActive !== false ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => { setSelectedStudent(s); setResetPassword(''); }}
                                                        className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase"
                                                    >
                                                        <BarChart3 size={12} /> Insights
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingStudent(s); setIsEditStudentModalOpen(true); }}
                                                        className="p-1.5 rounded-lg bg-secondary/50 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                                                        title="Edit Student"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteStudent(s.id)}
                                                        className="p-1.5 rounded-lg bg-secondary/50 border border-border/50 text-muted-foreground hover:text-red-400 hover:border-red-400/30 transition-all"
                                                        title="Delete Student"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── ANNOUNCEMENTS ── */}
                {activeTab === 'announcements' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {announcements.length === 0 ? (
                            <div className="text-center py-20">
                                <Megaphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                                <p className="font-bold text-lg">No announcements posted</p>
                                <p className="text-muted-foreground text-sm">Post a message and all students will see it.</p>
                            </div>
                        ) : (() => {
                            const totalPages = Math.ceil(announcements.length / ANNOUNCEMENTS_PER_PAGE);
                            const paginatedAnnouncements = announcements.slice((announcementPage - 1) * ANNOUNCEMENTS_PER_PAGE, announcementPage * ANNOUNCEMENTS_PER_PAGE);
                            return (
                                <>
                                    {paginatedAnnouncements.map(a => (
                                        <div key={a.id} className="p-6 glassmorphism rounded-2xl border border-border/50 flex gap-6 hover:border-primary/20 transition-all cursor-pointer group relative" onClick={() => setSelectedAnnouncement(a)}>
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Megaphone size={20} className="text-primary" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold">{a.title}</h3>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                                                        <button onClick={(e) => { e.stopPropagation(); deleteAnnouncement(a.id); }} className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors z-10">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{a.body}</p>
                                                {(a.imageUrl || a.documentUrl) && (
                                                    <div className="flex gap-2 mt-2">
                                                        {a.imageUrl && <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1"><Info size={10} /> Image Attached</span>}
                                                        {a.documentUrl && <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1"><FileText size={10} /> Doc Attached</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center items-center gap-4 mt-6">
                                            <button
                                                disabled={announcementPage === 1}
                                                onClick={() => setAnnouncementPage(p => Math.max(1, p - 1))}
                                                className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 disabled:opacity-50 transition-all border border-border/50"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <span className="text-sm font-bold text-muted-foreground tracking-widest uppercase">
                                                Page {announcementPage} of {totalPages}
                                            </span>
                                            <button
                                                disabled={announcementPage === totalPages}
                                                onClick={() => setAnnouncementPage(p => Math.min(totalPages, p + 1))}
                                                className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 disabled:opacity-50 transition-all border border-border/50"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* ── REPORTS ── */}
                {activeTab === 'reports' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-2xl glassmorphism border border-border/50 shadow-xl">
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Completion Rate</p>
                                <p className="text-3xl font-black text-emerald-400">{stats.completionRate}%</p>
                                <div className="w-full h-1.5 bg-secondary/30 rounded-full mt-4 overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${stats.completionRate}%` }} />
                                </div>
                            </div>
                            <div className="p-6 rounded-2xl glassmorphism border border-border/50 shadow-xl">
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Avg Progress</p>
                                <p className="text-3xl font-black text-orange-400">{stats.avgProgress}%</p>
                                <div className="w-full h-1.5 bg-secondary/30 rounded-full mt-4 overflow-hidden">
                                    <div className="h-full bg-orange-500" style={{ width: `${stats.avgProgress}%` }} />
                                </div>
                            </div>
                            <div className="p-6 rounded-2xl glassmorphism border border-border/50 shadow-xl">
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Avg Quiz Score</p>
                                <p className="text-3xl font-black text-blue-400">{stats.avgQuizScore}%</p>
                                <div className="w-full h-1.5 bg-secondary/30 rounded-full mt-4 overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${stats.avgQuizScore}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="glassmorphism rounded-3xl border border-border/50 overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-secondary/10">
                                <h3 className="font-bold flex items-center gap-2 text-lg"><BarChart3 size={20} className="text-primary" /> Course Performance Report</h3>
                                <button className="px-4 py-2 bg-secondary/50 hover:bg-secondary border border-border/50 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
                                    <Upload size={14} className="rotate-180" /> Export CSV
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-secondary/20 border-b border-border/50">
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Course</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Enrollments</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Completions</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Avg Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {coursePerformance.length === 0 ? (
                                            <tr><td colSpan={4} className="py-20 text-center text-muted-foreground italic">No course data available yet.</td></tr>
                                        ) : coursePerformance.map(course => (
                                            <tr key={course.id} className="hover:bg-secondary/10 transition-colors">
                                                <td className="px-6 py-4 font-bold">{course.title}</td>
                                                <td className="px-6 py-4 text-center font-mono text-sm">{course.enrollments}</td>
                                                <td className="px-6 py-4 text-center font-mono text-sm">{course.completions}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${course.avgProgress}%` }} />
                                                        </div>
                                                        <span className="text-xs font-bold text-primary w-10">{Math.round(course.avgProgress)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── BRANDING ── */}
                {activeTab === 'branding' && (
                    <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
                        <div className="glassmorphism p-8 rounded-3xl border border-border/50 space-y-8">
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg">Organization Name</h3>
                                <input type="text" value={branding.name} onChange={e => setBranding({ ...branding, name: e.target.value })}
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg">Brand Color</h3>
                                <div className="flex items-center gap-4">
                                    <input type="color" value={branding.primaryColor} onChange={e => setBranding({ ...branding, primaryColor: e.target.value })}
                                        className="w-14 h-14 rounded-xl cursor-pointer border-none bg-transparent" />
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Selected Color</p>
                                        <p className="font-mono font-bold text-lg">{branding.primaryColor.toUpperCase()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    {['#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#000000'].map(c => (
                                        <button key={c} className="w-10 h-10 rounded-full border-2 transition-all hover:scale-110"
                                            style={{ backgroundColor: c, borderColor: branding.primaryColor === c ? 'white' : 'transparent' }}
                                            onClick={() => setBranding({ ...branding, primaryColor: c })} />
                                    ))}
                                </div>
                            </div>
                            <div className="p-8 rounded-2xl border border-border bg-secondary/10" style={{ borderColor: branding.primaryColor + '30' }}>
                                <h4 className="font-bold mb-2" style={{ color: branding.primaryColor }}>Preview: {branding.name} LMS</h4>
                                <p className="text-sm text-muted-foreground mb-4">This is how your portal header will look to students.</p>
                                <button className="px-4 py-2 rounded-full text-white text-sm font-bold" style={{ backgroundColor: branding.primaryColor }}>Enter Workspace</button>
                            </div>
                            <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-xl shadow-primary/20">
                                <Save size={16} /> Save Branding
                            </button>
                        </div>
                    </div>
                )}

                {/* ── DOMAINS ── */}
                {activeTab === 'domains' && (
                    <div className="max-w-2xl space-y-6 animate-in fade-in duration-500">
                        <div className="glassmorphism p-8 rounded-3xl border border-border/50 space-y-6">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Platform Subdomain</p>
                                <p className="font-mono font-bold text-blue-400">{domain}.lvh.me:3000</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Custom Domain</label>
                                <div className="flex gap-3">
                                    <input type="text" placeholder="academy.yourcompany.com"
                                        className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90">Save</button>
                                </div>
                            </div>
                            <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-4">
                                <p className="font-bold text-blue-400 text-sm">DNS Setup Instructions</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-background/80 p-4 rounded-xl border border-blue-500/20">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Record Type</p>
                                        <p className="font-mono font-bold text-sm text-blue-400">CNAME</p>
                                    </div>
                                    <div className="bg-background/80 p-4 rounded-xl border border-blue-500/20">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Target Value</p>
                                        <p className="font-mono font-bold text-sm text-blue-400">cname.infinitelms.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── SETTINGS ── */}
                {activeTab === 'settings' && (
                    <div className="max-w-2xl space-y-6 animate-in fade-in duration-500">
                        <div className="glassmorphism p-8 rounded-3xl border border-border/50 space-y-6">
                            <h3 className="font-bold text-lg">Workspace Configuration</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Support Email</label>
                                <input type="email" placeholder="support@yourcompany.com"
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50">
                                <div>
                                    <p className="font-bold text-sm">Allow Student Self-Registration</p>
                                    <p className="text-xs text-muted-foreground">Students can sign up without an invite.</p>
                                </div>
                                <div className="w-12 h-6 rounded-full bg-secondary border border-border relative">
                                    <div className="w-4 h-4 rounded-full bg-muted-foreground absolute top-1 left-1" />
                                </div>
                            </div>
                            <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:scale-105 transition-transform">
                                <Save size={16} /> Save Settings
                            </button>
                        </div>
                        <div className="glassmorphism p-8 rounded-3xl border border-red-500/20 bg-red-500/5">
                            <h3 className="font-bold text-red-400 mb-2">Danger Zone</h3>
                            <p className="text-sm text-red-400/70 mb-4">Irreversible workspace actions.</p>
                            <button className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white font-bold rounded-lg text-sm transition-all">
                                Delete Workspace
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'certificates' && (
                    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
                        <div className="glassmorphism p-8 rounded-3xl border border-border/50">
                            <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                                <Award className="w-5 h-5 text-indigo-400" /> Certificate Templates
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6">Design certificates awarded to students upon course completion.</p>

                            <div className="p-12 border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <Award size={32} />
                                </div>
                                <div>
                                    <p className="font-bold">Certificate Engine</p>
                                    <p className="text-sm text-muted-foreground mt-1">Upload a background template and configure student name placements.</p>
                                </div>
                                <button onClick={() => alert('Certificate builder coming soon!')} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-4 transition-colors">
                                    Create New Template
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            {showCourseModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
                    <div className="bg-background border border-border w-full max-w-md rounded-3xl p-8 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black">Create New Course</h3>
                            <button onClick={() => setShowCourseModal(false)} className="text-muted-foreground hover:text-foreground"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={createCourse} className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Course Title</label>
                                    {validationErrors.course?.title && <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1">{validationErrors.course.title}</span>}
                                </div>
                                <input placeholder="e.g. Introduction to Python" value={courseForm.title}
                                    onChange={e => {
                                        setCourseForm({ ...courseForm, title: e.target.value });
                                        if (validationErrors.course?.title) {
                                            setValidationErrors(prev => ({ ...prev, course: null }));
                                        }
                                    }}
                                    className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${validationErrors.course?.title ? 'border-red-500/50 focus:ring-red-500/50' : 'border-border focus:ring-primary/50'}`} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                                <textarea placeholder="Brief description of what students will learn..." value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                                    rows={3} className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Course Thumbnail</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-16 rounded-xl bg-secondary/50 border border-dashed border-border flex items-center justify-center overflow-hidden">
                                        {thumbnailPreview ? (
                                            <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Upload className="w-6 h-6 text-muted-foreground opacity-30" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={uploadThumbnail}
                                            className="hidden"
                                            id="thumbnail-upload"
                                            disabled={isUploadingThumbnail}
                                        />
                                        <label
                                            htmlFor="thumbnail-upload"
                                            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-xs font-bold uppercase tracking-widest rounded-lg cursor-pointer transition-all border border-border flex items-center justify-center gap-2"
                                        >
                                            {isUploadingThumbnail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload size={14} />}
                                            {isUploadingThumbnail ? 'Uploading...' : 'Choose Image'}
                                        </label>
                                        <p className="text-[10px] text-muted-foreground mt-2 italic">Recommended: 1280x720px (16:9)</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Skill Level</label>
                                    <select value={courseForm.skillLevel} onChange={e => setCourseForm({ ...courseForm, skillLevel: e.target.value })}
                                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        <option value="All Levels">All Levels</option>
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Languages</label>
                                    <input placeholder="e.g. English, Spanish" value={courseForm.languages} onChange={e => setCourseForm({ ...courseForm, languages: e.target.value })}
                                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-1">
                                <input type="checkbox" id="course-captions" checked={courseForm.captions} onChange={e => setCourseForm({ ...courseForm, captions: e.target.checked })}
                                    className="rounded border-border/50 bg-secondary/30 text-primary focus:ring-primary/20" />
                                <label htmlFor="course-captions" className="text-xs font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">Has Closed Captions</label>
                            </div>
                            <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90">Create Course</button>
                        </form>
                    </div>
                </div>
            )}

            {showStudentModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
                    <div className="bg-background border border-border w-full max-w-md rounded-3xl p-8 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black">{justCreatedStudent ? 'Student Enrolled!' : 'Onboard Student'}</h3>
                            <button onClick={() => { setShowStudentModal(false); setJustCreatedStudent(null); setStudentForm({ name: '', email: '', password: generateRandomPassword() }); }} className="text-muted-foreground hover:text-foreground"><XCircle size={24} /></button>
                        </div>
                        
                        {justCreatedStudent ? (
                            <div className="space-y-6">
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 size={24} className="text-emerald-500" />
                                    </div>
                                    <p className="font-bold text-emerald-400">Success!</p>
                                    <p className="text-sm text-muted-foreground">Student account created successfully.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Login Path URL</p>
                                        <div className="flex justify-between items-center gap-4">
                                            <code className="font-mono text-xs truncate text-blue-300">
                                                {window.location.origin}/t/{domain}/login
                                            </code>
                                            <button type="button" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/t/${domain}/login`); addToast('Link copied'); }} className="text-[10px] font-bold text-blue-400 hover:underline flex-shrink-0">Copy</button>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Generated Password</p>
                                        <div className="flex justify-between items-center">
                                            <code className="font-mono font-bold">{justCreatedStudent.password}</code>
                                            <button type="button" onClick={() => { navigator.clipboard.writeText(justCreatedStudent.password); addToast('Password copied'); }} className="text-[10px] font-bold hover:underline">Copy</button>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => { setShowStudentModal(false); setJustCreatedStudent(null); setStudentForm({ name: '', email: '', password: generateRandomPassword() }); }}
                                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={createStudent} className="space-y-4">
                                {[{ key: 'name', label: 'Full Name', placeholder: 'Jane Doe' }, { key: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email' }].map(f => (
                                    <div key={f.key} className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{f.label}</label>
                                            {validationErrors.student?.[f.key] && <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1">{validationErrors.student[f.key]}</span>}
                                        </div>
                                        <input
                                            type={f.type || 'text'}
                                            placeholder={f.placeholder}
                                            value={(studentForm as any)[f.key]}
                                            onChange={e => {
                                                setStudentForm({ ...studentForm, [f.key]: e.target.value });
                                                if (validationErrors.student?.[f.key]) {
                                                    setValidationErrors(prev => ({ ...prev, student: { ...prev.student, [f.key]: null } }));
                                                }
                                            }}
                                            className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${validationErrors.student?.[f.key] ? 'border-red-500/50 focus:ring-red-500/50' : 'border-border focus:ring-primary/50'}`} />
                                    </div>
                                ))}
                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Generated Password</p>
                                        <button type="button" onClick={() => setStudentForm({ ...studentForm, password: generateRandomPassword() })} className="text-[10px] font-bold text-blue-400 hover:underline">Regenerate</button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <code className="font-mono font-bold">{studentForm.password}</code>
                                        <button type="button" onClick={() => navigator.clipboard.writeText(studentForm.password)} className="text-xs font-bold text-blue-400 hover:underline">Copy</button>
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90">Enroll Student</button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {isEditStudentModalOpen && editingStudent && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
                    <div className="bg-background border border-border w-full max-w-md rounded-3xl p-8 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black">Edit Student</h3>
                            <button onClick={() => { setIsEditStudentModalOpen(false); setEditingStudent(null); }} className="text-muted-foreground hover:text-foreground"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={updateStudent} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
                                <input
                                    value={editingStudent.name}
                                    onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
                                <input
                                    type="email"
                                    value={editingStudent.email}
                                    onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedStudent && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
                    <div className="bg-background border border-border w-full max-w-4xl max-h-[90vh] rounded-3xl p-8 flex flex-col shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${selectedStudent.isActive !== false ? 'bg-blue-500/20 text-blue-400' : 'bg-secondary text-muted-foreground'}`}>
                                    {selectedStudent.name?.charAt(0) || 'S'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black">{selectedStudent.name}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={() => toggleStudentStatus(selectedStudent)}
                                    className="px-4 py-2 rounded-xl bg-secondary/50 border border-border/50 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-all"
                                >
                                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors relative ${selectedStudent.isActive !== false ? 'bg-emerald-500/20' : 'bg-secondary'}`}>
                                        <div className={`w-4 h-4 rounded-full shadow-sm transition-all ${selectedStudent.isActive !== false ? 'translate-x-5 bg-emerald-400' : 'bg-muted-foreground'}`} />
                                    </div>
                                    <span className={`text-xs font-black uppercase tracking-widest ${selectedStudent.isActive !== false ? 'text-emerald-400' : 'text-muted-foreground opacity-50'}`}>
                                        {selectedStudent.isActive !== false ? 'Active' : 'Account Disabled'}
                                    </span>
                                </div>
                                <button onClick={() => { setSelectedStudent(null); setResetPassword(''); }} className="text-muted-foreground hover:text-foreground"><XCircle size={28} /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-5 rounded-2xl bg-secondary/10 border border-border/50">
                                    <div className="flex items-center gap-3 text-primary mb-2">
                                        <BookOpen size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Learning Progress</span>
                                    </div>
                                    <p className="text-2xl font-black">{selectedStudent.enrollments?.length || 0}</p>
                                    <p className="text-xs text-muted-foreground font-medium italic">Courses Enrolled</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-secondary/10 border border-border/50">
                                    <div className="flex items-center gap-3 text-amber-500 mb-2">
                                        <Award size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Quiz Performance</span>
                                    </div>
                                    <p className="text-2xl font-black">{selectedStudent.quizAttempts?.filter((a: any) => a.passed).length || 0}</p>
                                    <p className="text-xs text-muted-foreground font-medium italic">Quizzes Passed</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-secondary/10 border border-border/50">
                                    <div className="flex items-center gap-3 text-emerald-500 mb-2">
                                        <Clock size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Activity Status</span>
                                    </div>
                                    <p className="text-2xl font-black">{selectedStudent.activityLogs?.length || 0}</p>
                                    <p className="text-xs text-muted-foreground font-medium italic">Total Actions Logged</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Course Progress */}
                                <div className="space-y-4">
                                    <h4 className="font-black text-sm uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">Course Status</h4>
                                    <div className="space-y-4">
                                        {selectedStudent.enrollments?.length > 0 ? selectedStudent.enrollments.map((env: any) => {
                                            const totalLessons = env.course.modules?.reduce((sum: number, mod: any) => sum + (mod.lessons?.length || 0), 0) || 0;
                                            const completedLessons = selectedStudent.progress?.filter((p: any) => p.completed && env.course.modules?.some((m: any) => m.lessons.some((l: any) => l.id === p.lessonId))).length || 0;
                                            const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

                                            return (
                                                <div key={env.id} className="p-4 rounded-xl bg-secondary/5 border border-border/50">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <p className="font-bold text-sm leading-tight max-w-[70%]">{env.course.title}</p>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${progressPercent === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                                                            {progressPercent}%
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mt-2 italic">{completedLessons} of {totalLessons} lessons completed</p>
                                                </div>
                                            )
                                        }) : (
                                            <p className="text-sm text-muted-foreground italic py-4">Not enrolled in any courses yet.</p>
                                        )}
                                    </div>

                                    <h4 className="font-black text-sm uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2 pt-4">Recent Quiz Scores</h4>
                                    <div className="space-y-2">
                                        {selectedStudent.quizAttempts?.length > 0 ? selectedStudent.quizAttempts.slice(0, 5).map((attempt: any) => (
                                            <div key={attempt.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/5 border border-border/30">
                                                <div>
                                                    <p className="text-xs font-bold">{attempt.quiz.title}</p>
                                                    <p className="text-[9px] text-muted-foreground">{new Date(attempt.createdAt).toLocaleDateString()} {new Date(attempt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                <div className={`px-2 py-1 rounded text-[10px] font-black ${attempt.score >= attempt.quiz.passingScore ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {attempt.score}% - {attempt.score >= attempt.quiz.passingScore ? 'PASSED' : 'FAILED'}
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-muted-foreground italic py-4">No quiz attempts yet.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Activity Feed */}
                                <div className="space-y-4">
                                    <h4 className="font-black text-sm uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">Live Activity Log</h4>
                                    <div className="space-y-3">
                                        {selectedStudent.activityLogs?.length > 0 ? selectedStudent.activityLogs.map((log: any) => (
                                            <div key={log.id} className="flex gap-4 group">
                                                <div className="mt-1 flex flex-col items-center">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 ${log.action === 'DOWNLOAD_RESOURCE' ? 'bg-purple-500' : 'bg-blue-500 focus:ring-4 focus:ring-blue-500/20'}`} />
                                                    <div className="w-px h-full bg-border group-last:hidden" />
                                                </div>
                                                <div className="pb-4 flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-xs font-bold">
                                                            {log.action === 'VIEW_LESSON' ? `Viewed: ${log.metadata?.lessonTitle || 'Unknown Lesson'}` :
                                                                log.action === 'DOWNLOAD_RESOURCE' ? `Downloaded: ${log.metadata?.resourceName || 'Unknown Resource'}` :
                                                                    log.action}
                                                        </p>
                                                        <span className="text-[9px] text-muted-foreground font-mono whitespace-nowrap ml-2">
                                                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground italic mt-0.5">{new Date(log.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="p-8 text-center glassmorphism border border-dashed border-border/50 rounded-2xl">
                                                <Info size={24} className="mx-auto text-muted-foreground mb-2 opacity-50" />
                                                <p className="text-xs text-muted-foreground italic">No student activity recorded yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
                            <div className="flex gap-4">
                                <button
                                    onClick={handlePasswordReset}
                                    disabled={resettingPwd}
                                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded-xl font-bold text-xs transition-all flex items-center gap-2"
                                >
                                    {resettingPwd ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                                    Reset Password
                                </button>
                                {resetPassword && (
                                    <div className="px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center gap-3 animate-in slide-in-from-left-2 duration-300">
                                        <p className="text-[10px] font-black text-orange-400 font-mono">{resetPassword}</p>
                                        <button onClick={() => { navigator.clipboard.writeText(resetPassword); addToast('Copied to clipboard'); }} className="text-[10px] font-bold text-orange-500 hover:underline">Copy</button>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                                Close Insights
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeQuizLesson && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                    <div className="bg-background border border-border w-full max-w-4xl max-h-[90vh] rounded-3xl p-8 flex flex-col shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-black">Quiz Builder</h3>
                                <p className="text-sm text-muted-foreground">Creating quiz for: <span className="text-foreground font-bold">{selectedCourse?.modules?.find((m: any) => m.id === activeQuizLesson.moduleId)?.lessons?.find((l: any) => l.id === activeQuizLesson.lessonId)?.title || quizForm.title}</span></p>
                            </div>
                            <button onClick={() => setActiveQuizLesson(null)} className="p-2 hover:bg-secondary rounded-full transition-colors"><XCircle size={28} className="text-muted-foreground" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-4 space-y-8 custom-scrollbar">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Quiz Title</label>
                                    {validationErrors.quiz?.title && <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1 uppercase tracking-tight">{validationErrors.quiz.title}</span>}
                                </div>
                                <input
                                    placeholder="e.g. React Fundamentals Mastery"
                                    value={quizForm.title || ''}
                                    onChange={(e) => {
                                        setQuizForm({ ...quizForm, title: e.target.value });
                                        if (validationErrors.quiz?.title) {
                                            setValidationErrors(prev => ({ ...prev, quiz: { ...prev.quiz, title: null } }));
                                        }
                                    }}
                                    className={`w-full bg-secondary/30 border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 transition-all ${validationErrors.quiz?.title ? 'border-red-500/50 focus:ring-red-500/50' : 'border-border/50 focus:ring-primary/50'}`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Quiz Description</label>
                                    </div>
                                    <textarea
                                        placeholder="Briefly explain what this quiz covers..."
                                        rows={2}
                                        value={quizForm.description || ''}
                                        onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                                        className="w-full bg-secondary/30 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Passing Score (%)</label>
                                    <input
                                        type="number"
                                        min="0" max="100"
                                        value={quizForm.passingScore}
                                        onChange={(e) => setQuizForm({ ...quizForm, passingScore: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-secondary/30 border border-border/50 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 bg-secondary/5 rounded-2xl p-6 border border-border/30">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox" id="retake-allowed"
                                            checked={quizForm.retakeAllowed}
                                            onChange={(e) => setQuizForm({ ...quizForm, retakeAllowed: e.target.checked })}
                                            className="rounded border-border text-primary focus:ring-primary/20"
                                        />
                                        <label htmlFor="retake-allowed" className="text-xs font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">Allow Retakes</label>
                                    </div>
                                    {quizForm.retakeAllowed && (
                                        <div className="space-y-1.5 ml-6">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Max Attempts (0 = unlimited)</label>
                                            <input
                                                type="number" min="0"
                                                value={quizForm.maxAttempts}
                                                onChange={(e) => setQuizForm({ ...quizForm, maxAttempts: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-secondary/30 border border-border/50 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4 border-l border-border/30 pl-6">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox" id="is-randomized"
                                            checked={quizForm.isRandomized}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setQuizForm(prev => ({
                                                    ...prev,
                                                    isRandomized: checked,
                                                    randomCount: (checked && (prev.randomCount === 0 || prev.randomCount > prev.questions.length)) ? prev.questions.length : prev.randomCount
                                                }));
                                            }}
                                            className="rounded border-border text-primary focus:ring-primary/20"
                                        />
                                        <label htmlFor="is-randomized" className="text-xs font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">Randomize Questions</label>
                                    </div>
                                    {quizForm.isRandomized && (
                                        <div className="space-y-4 ml-6 animate-in fade-in slide-in-from-left-2 transition-all duration-300">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 flex justify-between">
                                                    <span>Exam Subset Size</span>
                                                    <span className="text-primary font-black">{quizForm.randomCount} OF {quizForm.questions.length || 0}</span>
                                                </label>
                                                <p className="text-[9px] text-muted-foreground/60 px-1 italic">
                                                    {quizForm.questions.length > 0
                                                        ? `Each student will see ${quizForm.randomCount} random questions from your pool.`
                                                        : "Add questions below to build your pool first."}
                                                </p>
                                            </div>

                                            {quizForm.questions.length > 0 ? (
                                                <div className="flex items-center gap-4 bg-secondary/20 rounded-xl px-4 py-2 border border-border/50">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max={quizForm.questions.length}
                                                        value={quizForm.randomCount}
                                                        onChange={(e) => setQuizForm({ ...quizForm, randomCount: parseInt(e.target.value) })}
                                                        className="flex-1 accent-primary cursor-pointer h-1.5 bg-secondary rounded-lg appearance-none"
                                                    />
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={quizForm.questions.length}
                                                        value={quizForm.randomCount}
                                                        onChange={(e) => {
                                                            const val = Math.max(1, Math.min(parseInt(e.target.value) || 1, quizForm.questions.length));
                                                            setQuizForm({ ...quizForm, randomCount: val });
                                                        }}
                                                        className="w-16 bg-secondary/50 text-center rounded-lg py-1 text-xs font-black border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="text-[10px] font-bold text-amber-500/80 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 flex items-center gap-2">
                                                    <AlertCircle size={14} /> <span>Your question pool is currently empty.</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                                    <h4 className="font-black text-lg flex items-center gap-2"><Plus size={20} className="text-primary" /> Questions</h4>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={isGeneratingQuiz}
                                            onClick={generateAIQuiz}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-500 transition-colors flex items-center gap-2 disabled:opacity-50 group/whisper"
                                        >
                                            {isGeneratingQuiz ? <Loader2 size={14} className="animate-spin" /> : <Mic size={14} className="group-hover/whisper:scale-125 transition-transform" />}
                                            {isGeneratingQuiz ? 'Whisper generating...' : 'Whisper AI Generate'}
                                        </button>
                                        <button
                                            onClick={() => setQuizForm({ ...quizForm, questions: [...quizForm.questions, { text: '', type: 'MULTIPLE_CHOICE', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }] }] })}
                                            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-xs hover:scale-105 transition-transform"
                                        >
                                            Add Question
                                        </button>
                                    </div>
                                </div>

                                {quizForm.questions.map((q, qIdx) => (
                                    <div key={qIdx} className="p-6 rounded-2xl bg-secondary/10 border border-border/50 space-y-4 group">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black text-xs">0{qIdx + 1}</span>
                                                {validationErrors.quiz?.questions?.[qIdx]?.text && <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1">{validationErrors.quiz.questions[qIdx].text}</span>}
                                                <button
                                                    onClick={() => {
                                                        const newQs = [...quizForm.questions];
                                                        newQs.splice(qIdx, 1);
                                                        setQuizForm({ ...quizForm, questions: newQs });
                                                    }}
                                                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Question Type Selector */}
                                            <div className="flex gap-2 pt-1">
                                                {[
                                                    { value: 'MULTIPLE_CHOICE', label: '⦿ Single Answer' },
                                                    { value: 'MULTIPLE_SELECT', label: '☑ Multi-Select' },
                                                    { value: 'FILL_BLANK', label: '✏ Fill in Blank' },
                                                ].map(t => (
                                                    <button
                                                        key={t.value}
                                                        onClick={() => {
                                                            const newQs = [...quizForm.questions];
                                                            const prev = newQs[qIdx].type;
                                                            // Clone the question object to avoid direct mutation
                                                            newQs[qIdx] = {
                                                                ...newQs[qIdx],
                                                                type: t.value as any,
                                                                // Reset options when switching types
                                                                options: t.value === 'FILL_BLANK'
                                                                    ? [{ text: '', isCorrect: true }]
                                                                    : (prev === 'FILL_BLANK' ? [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }] : newQs[qIdx].options)
                                                            };
                                                            setQuizForm({ ...quizForm, questions: newQs });
                                                        }}
                                                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${(q.type || 'MULTIPLE_CHOICE') === t.value
                                                                ? 'bg-primary/20 border-primary/40 text-primary'
                                                                : 'border-border/50 text-muted-foreground hover:border-primary/30'
                                                            }`}
                                                    >
                                                        {t.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <input
                                                placeholder="Enter question text..."
                                                className={`w-full bg-transparent border-b px-2 py-3 text-lg font-bold focus:outline-none transition-all ${validationErrors.quiz?.questions?.[qIdx]?.text ? 'border-red-500' : 'border-border/50 focus:border-primary'}`}
                                                value={q.text}
                                                onChange={(e) => {
                                                    const newQs = [...quizForm.questions];
                                                    newQs[qIdx].text = e.target.value;
                                                    setQuizForm({ ...quizForm, questions: newQs });
                                                    if (validationErrors.quiz?.questions?.[qIdx]?.text) {
                                                        const newErrors = { ...validationErrors.quiz };
                                                        delete newErrors.questions[qIdx].text;
                                                        setValidationErrors(prev => ({ ...prev, quiz: newErrors }));
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* FILL IN BLANK */}
                                        {(q.type || 'MULTIPLE_CHOICE') === 'FILL_BLANK' ? (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Correct Answer (case-insensitive match)</label>
                                                <input
                                                    placeholder="Type the expected answer..."
                                                    className="w-full bg-background/50 border border-primary/30 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                    value={q.options[0]?.text || ''}
                                                    onChange={(e) => {
                                                        const newQs = [...quizForm.questions];
                                                        newQs[qIdx].options = [{ text: e.target.value, isCorrect: true }];
                                                        setQuizForm({ ...quizForm, questions: newQs });
                                                    }}
                                                />
                                                <p className="text-[10px] text-muted-foreground italic">Students will type their answer. It will be matched against this text.</p>
                                            </div>
                                        ) : (
                                            /* MULTIPLE CHOICE / MULTIPLE SELECT */
                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                {(() => {
                                                    const isMultiSelect = (q.type || 'MULTIPLE_CHOICE') === 'MULTIPLE_SELECT';
                                                    return (<>
                                                        {q.options.map((o: any, oIdx: number) => {
                                                            return (
                                                                <div key={oIdx} className="space-y-1">
                                                                    <div className={`flex items-center gap-3 p-3 rounded-xl bg-background/50 border transition-all focus-within:ring-1 ${validationErrors.quiz?.questions?.[qIdx]?.options?.[oIdx] ? 'border-red-500 focus-within:ring-red-500/50' : 'border-border/50 focus-within:ring-primary/50'}`}>
                                                                        <button
                                                                            onClick={() => {
                                                                                const newQs = [...quizForm.questions];
                                                                                if (isMultiSelect) {
                                                                                    // Toggle for multi-select
                                                                                    newQs[qIdx].options[oIdx].isCorrect = !newQs[qIdx].options[oIdx].isCorrect;
                                                                                } else {
                                                                                    // Single select — only one correct
                                                                                    newQs[qIdx].options = newQs[qIdx].options.map((opt: any, idx: number) => ({ ...opt, isCorrect: idx === oIdx }));
                                                                                }
                                                                                setQuizForm({ ...quizForm, questions: newQs });
                                                                            }}
                                                                            className={`w-5 h-5 flex-shrink-0 border-2 flex items-center justify-center transition-all ${isMultiSelect ? 'rounded-md' : 'rounded-full'
                                                                                } ${o.isCorrect ? 'bg-primary border-primary' : 'border-border'}`}
                                                                        >
                                                                            {o.isCorrect && <CheckCircle2 size={12} className="text-white" />}
                                                                        </button>
                                                                        <input
                                                                            placeholder={`Option ${oIdx + 1}`}
                                                                            className="flex-1 bg-transparent text-sm focus:outline-none font-medium"
                                                                            value={o.text}
                                                                            onChange={(e) => {
                                                                                const newQs = [...quizForm.questions];
                                                                                newQs[qIdx].options[oIdx].text = e.target.value;
                                                                                setQuizForm({ ...quizForm, questions: newQs });
                                                                                if (validationErrors.quiz?.questions?.[qIdx]?.options?.[oIdx]) {
                                                                                    const newErrors = { ...validationErrors.quiz };
                                                                                    delete newErrors.questions[qIdx].options[oIdx];
                                                                                    setValidationErrors(prev => ({ ...prev, quiz: newErrors }));
                                                                                }
                                                                            }}
                                                                        />
                                                                        {q.options.length > 2 && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newQs = [...quizForm.questions];
                                                                                    newQs[qIdx].options.splice(oIdx, 1);
                                                                                    setQuizForm({ ...quizForm, questions: newQs });
                                                                                }}
                                                                                className="text-muted-foreground hover:text-red-400"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {validationErrors.quiz?.questions?.[qIdx]?.options?.[oIdx] && <span className="text-[9px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1">{validationErrors.quiz.questions[qIdx].options[oIdx]}</span>}
                                                                </div>
                                                            );
                                                        })}
                                                        {q.options.length < 6 && (
                                                            <button
                                                                onClick={() => {
                                                                    const newQs = [...quizForm.questions];
                                                                    newQs[qIdx].options.push({ text: '', isCorrect: false });
                                                                    setQuizForm({ ...quizForm, questions: newQs });
                                                                }}
                                                                className="col-span-2 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border border-dashed border-border/50 rounded-xl"
                                                            >
                                                                + Add Option
                                                            </button>
                                                        )}
                                                        <p className="col-span-2 text-[10px] text-muted-foreground italic px-1">
                                                            {isMultiSelect
                                                                ? 'Check all correct answers — students must select all of them.'
                                                                : 'Click the circle to mark the single correct answer.'}
                                                        </p>
                                                    </>);
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                ))}

                            </div>
                        </div>

                        <div className="flex gap-4 mt-8 pt-6 border-t border-border/50">
                            <button onClick={() => setActiveQuizLesson(null)} className="flex-1 py-4 bg-secondary hover:bg-secondary/80 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all">Discard Changes</button>
                            <button onClick={saveQuiz} className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">Save Quiz Configuration</button>
                        </div>
                    </div>
                </div>
            )}

            {showAnnouncementModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
                    <div className="bg-background border border-border w-full max-w-md rounded-3xl p-8 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black">Post Announcement</h3>
                            <button onClick={() => setShowAnnouncementModal(false)} className="text-muted-foreground hover:text-foreground"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={createAnnouncement} className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Title</label>
                                    {validationErrors.announcement?.title && <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1">{validationErrors.announcement.title}</span>}
                                </div>
                                <input
                                    placeholder="Important update"
                                    value={announcementForm.title}
                                    onChange={e => {
                                        setAnnouncementForm({ ...announcementForm, title: e.target.value });
                                        if (validationErrors.announcement?.title) {
                                            setValidationErrors(prev => ({ ...prev, announcement: { ...prev.announcement, title: null } }));
                                        }
                                    }}
                                    className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${validationErrors.announcement?.title ? 'border-red-500/50 focus:ring-red-500/50' : 'border-border focus:ring-primary/50'}`} />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Message</label>
                                    {validationErrors.announcement?.body && <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1">{validationErrors.announcement.body}</span>}
                                </div>
                                <textarea
                                    placeholder="Write your announcement here..."
                                    rows={4}
                                    value={announcementForm.body}
                                    onChange={e => {
                                        setAnnouncementForm({ ...announcementForm, body: e.target.value });
                                        if (validationErrors.announcement?.body) {
                                            setValidationErrors(prev => ({ ...prev, announcement: { ...prev.announcement, body: null } }));
                                        }
                                    }}
                                    className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all resize-none ${validationErrors.announcement?.body ? 'border-red-500/50 focus:ring-red-500/50' : 'border-border focus:ring-primary/50'}`} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex justify-between">Image Attachment</label>
                                    <label className="flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-4 hover:border-primary/50 cursor-pointer hover:bg-primary/5 transition-all group text-sm font-bold h-20">
                                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            setUploadProgress(prev => ({ ...prev, 'announcement-img': 10 }));
                                            try {
                                                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    setAnnouncementForm({ ...announcementForm, imageUrl: data.url });
                                                }
                                            } finally {
                                                setUploadProgress(prev => { const next = { ...prev }; delete next['announcement-img']; return next; });
                                            }
                                        }} />
                                        {uploadProgress['announcement-img'] ? <Loader2 className="animate-spin text-primary" /> : announcementForm.imageUrl ? <span className="text-emerald-500">✅ Image Added</span> : <><Upload size={16} className="mr-2 text-muted-foreground group-hover:text-primary transition-colors" /> Add Image</>}
                                    </label>
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex justify-between">Doc Attachment</label>
                                    <label className="flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-4 hover:border-primary/50 cursor-pointer hover:bg-primary/5 transition-all group text-sm font-bold h-20">
                                        <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            setUploadProgress(prev => ({ ...prev, 'announcement-doc': 10 }));
                                            try {
                                                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    setAnnouncementForm({ ...announcementForm, documentUrl: data.url });
                                                }
                                            } finally {
                                                setUploadProgress(prev => { const next = { ...prev }; delete next['announcement-doc']; return next; });
                                            }
                                        }} />
                                        {uploadProgress['announcement-doc'] ? <Loader2 className="animate-spin text-primary" /> : announcementForm.documentUrl ? <span className="text-emerald-500">✅ Document Added</span> : <><FileText size={16} className="mr-2 text-muted-foreground group-hover:text-primary transition-colors" /> Add Document</>}
                                    </label>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90">
                                <Megaphone size={16} className="inline mr-2" />Publish Announcement
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {selectedAnnouncement && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-background border border-border/50 w-full max-w-2xl rounded-[2rem] p-8 space-y-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <button onClick={() => setSelectedAnnouncement(null)} className="absolute top-6 right-6 p-2 bg-secondary/80 hover:bg-secondary rounded-full transition-all">
                            <XCircle size={24} className="text-muted-foreground" />
                        </button>
                        <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Megaphone size={20} className="text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black">{selectedAnnouncement.title}</h3>
                                <div className="text-xs text-muted-foreground tracking-widest uppercase font-bold mt-1">
                                    {new Date(selectedAnnouncement.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedAnnouncement.body}</p>

                            {selectedAnnouncement.imageUrl && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Attached Image</h4>
                                    <div className="rounded-xl overflow-hidden border border-border/50 bg-secondary/10">
                                        <img src={selectedAnnouncement.imageUrl} alt="Announcement Attachment" className="w-full h-auto max-h-[400px] object-contain" />
                                    </div>
                                </div>
                            )}

                            {selectedAnnouncement.documentUrl && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Attached Document</h4>
                                    <a href={selectedAnnouncement.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 transition-all group">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <FileText size={20} className="text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm group-hover:text-primary transition-colors">Download Attachment</p>
                                            <p className="text-xs text-muted-foreground">Click to view or download file</p>
                                        </div>
                                        <Upload size={16} className="text-muted-foreground group-hover:text-primary transition-colors transform rotate-90" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Target Resource Management Dialog */}
            {managingResources && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-background border border-border w-full max-w-xl rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <button onClick={() => setManagingResources(null)} className="absolute top-8 right-8 p-2 bg-secondary/50 hover:bg-secondary rounded-full transition-all group">
                            <XCircle size={28} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                        </button>

                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Archive size={24} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">{managingResources.type === 'COURSE' ? 'Course' : 'Section'} Resources</h3>
                                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">{managingResources.name}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl p-10 hover:border-primary/30 cursor-pointer hover:bg-primary/5 transition-all group relative overflow-hidden">
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) uploadTargetResource(file);
                                    }}
                                    disabled={isUploadingTargetResource}
                                />
                                {isUploadingTargetResource ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                        <p className="text-sm font-bold uppercase tracking-widest text-primary animate-pulse">Uploading Document...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-lg">Click or drag to upload</p>
                                            <p className="text-sm text-muted-foreground">PDF, DOCX, ZIP or other resources</p>
                                        </div>
                                    </div>
                                )}
                            </label>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-3">
                                {managingResources.resources.length === 0 ? (
                                    <div className="text-center py-10 opacity-40">
                                        <FileText size={48} className="mx-auto mb-3" />
                                        <p className="text-sm font-bold uppercase tracking-widest">No resources added yet</p>
                                    </div>
                                ) : (
                                    managingResources.resources.map((res: any) => (
                                        <div key={res.id} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50 group hover:bg-secondary/50 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                                    <FileText size={18} className="text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm truncate">{res.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{res.type} &middot; {res.size ? `${(res.size / 1024).toFixed(0)} KB` : 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-background border border-border/50 hover:bg-primary/10 hover:text-primary transition-all">
                                                    <Eye size={16} />
                                                </a>
                                                <button onClick={() => deleteTargetResource(res.id)} className="p-2 rounded-lg bg-background border border-border/50 hover:bg-red-500/10 hover:text-red-400 transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border/50">
                            <button onClick={() => setManagingResources(null)} className="w-full py-4 bg-secondary hover:bg-secondary/80 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg hover:shadow-xl active:scale-[0.98]">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showProfileModal && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-background border border-border/50 w-full max-w-md rounded-[2rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Settings className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-black">Admin Profile</h3>
                            </div>
                            <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-secondary rounded-full transition-all">
                                <XCircle size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/20">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-foreground">{userName}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{userEmail}</span>
                                    </div>
                                </div>
                                <div className="h-px bg-border/50 w-full" />
                                <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                                    [Note: Name and Email are managed by the system administrator.]
                                </p>
                            </div>

                            <div className="pt-2 space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Award size={12} /> Security
                                </h4>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Current Password</label>
                                    <input
                                        type="password"
                                        value={profileForm.currentPassword}
                                        onChange={e => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-secondary/30 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-foreground placeholder:text-muted-foreground/30"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</label>
                                        <input
                                            type="password"
                                            value={profileForm.newPassword}
                                            onChange={e => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full bg-secondary/30 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-foreground placeholder:text-muted-foreground/30"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm New</label>
                                        <input
                                            type="password"
                                            value={profileForm.confirmPassword}
                                            onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full bg-secondary/30 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-foreground placeholder:text-muted-foreground/30"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isUpdatingProfile}
                                className="w-full py-4 mt-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Security Settings'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {confirmModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-background border border-border/50 w-full max-w-sm rounded-[2rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${confirmModal.variant === 'info' ? 'from-indigo-500/50 via-indigo-500 to-indigo-500/50' : 'from-red-500/50 via-red-500 to-red-500/50'}`} />

                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${confirmModal.variant === 'info' ? 'bg-indigo-500/10' : 'bg-red-500/10'}`}>
                            {confirmModal.variant === 'info' ? <Info className="w-10 h-10 text-indigo-500" /> : <Trash2 className="w-10 h-10 text-red-500" />}
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black">{confirmModal.title}</h3>
                            <p className="text-muted-foreground text-sm">
                                {confirmModal.message}
                            </p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => {
                                    confirmModal.resolve(false);
                                    setConfirmModal(null);
                                }}
                                className="flex-1 py-4 bg-secondary hover:bg-secondary/80 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    confirmModal.resolve(true);
                                    setConfirmModal(null);
                                }}
                                className={`flex-1 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-[1.02] transition-all ${confirmModal.variant === 'info' ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-red-500 shadow-red-500/20'}`}
                            >
                                {confirmModal.variant === 'info' ? 'Confirm' : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

