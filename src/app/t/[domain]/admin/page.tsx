'use client';

import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from 'next-themes';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    LayoutDashboard, BookOpen, Users, Settings, Palette,
    Globe, Plus, XCircle, ChevronRight, ChevronLeft, Save, Upload,
    Trash2, Edit3, CheckCircle2, Megaphone, Loader2,
    MoreVertical, GripVertical, Eye, EyeOff, Video, FileText, Lock,
    BarChart3, Clock, UserCheck, Award, CheckCircle, AlertCircle, Info, Bell, Mic, Archive, LogOut, User, Shield, UsersRound,
    Filter, TrendingUp, Medal, Calendar, Target, Activity, Users2, Download, ScanSearch, UserCircle, LayoutList, Trash, Menu, X
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { uploadFile } from '@/lib/upload';
import { RolesManager } from '@/components/admin/roles/RolesManager';
import { TeamsManager } from '@/components/admin/teams/TeamsManager';
import { LearnersManager } from '@/components/admin/learners/LearnersManager';
import CertificateManager from '@/components/admin/certificates/CertificateManager';
import CertificateDesigner from '@/components/admin/certificates/CertificateDesigner';
import { ALL_TENANT_ADMIN_PERMISSIONS } from '@/lib/permissions';

type Tab = 'overview' | 'courses' | 'learners' | 'admins' | 'announcements' | 'branding' | 'domains' | 'settings' | 'certificates' | 'reports' | 'roles' | 'teams' | 'audit';

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

const getMetadataLabel = (key: string) => {
    const labels: Record<string, string> = {
        courseId: 'Course Reference',
        title: 'Display Title',
        learnerId: 'Subject Identity',
        email: 'Email Account',
        name: 'Full Name',
        teamId: 'Structural Team',
        roleId: 'Defined Role',
        subdomain: 'Workspace Domain',
        visibility: 'Access Status',
        id: 'System Resource ID'
    };
    return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

export default function ClientAdminDashboard() {
    const params = useParams();
    const router = useRouter();
    const domain = params.domain as string;
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTab = localStorage.getItem('admin_active_tab') as Tab;
        if (savedTab) {
            setActiveTab(savedTab);
        }
    }, []);

    useEffect(() => {
        if (activeTab) {
            localStorage.setItem('admin_active_tab', activeTab);
        }
    }, [activeTab]);

    // Profile State
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [userName, setUserName] = useState('Admin');
    const [userEmail, setUserEmail] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [adminPermissions, setAdminPermissions] = useState<string[]>(ALL_TENANT_ADMIN_PERMISSIONS);
    const [profileForm, setProfileForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [stats, setStats] = useState({
        learners: 0,
        courses: 0,
        enrollments: 0,
        completions: 0,
        completionRate: 0,
        avgProgress: 0,
        avgQuizScore: 0
    });
    const [courses, setCourses] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [coursePerformance, setCoursePerformance] = useState<any[]>([]);
    const [teamPerformance, setTeamPerformance] = useState<any[]>([]);
    const [topLearners, setTopLearners] = useState<any[]>([]);
    const [enrollmentTrendData, setEnrollmentTrendData] = useState<any[]>([]);
    const [roleDistribution, setRoleDistribution] = useState<any[]>([]);
    // Report Filters
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [reportTeamId, setReportTeamId] = useState('');
    const [reportRoleId, setReportRoleId] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [availableRoles, setAvailableRoles] = useState<any[]>([]);
    const [availableTeams, setAvailableTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [branding, setBranding] = useState({
        name: domain.charAt(0).toUpperCase() + domain.slice(1),
        primaryColor: '#3b82f6',
        logoLight: null as string | null,
        logoDark: null as string | null,
        favicon: null as string | null
    });

    // Course Builder state
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [courseFilter, setCourseFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [courseForm, setCourseForm] = useState({
        title: '',
        description: '',
        thumbnail: '',
        skillLevel: 'All Levels',
        languages: 'English',
        captions: false,
        isMarketplace: false,
        exclusiveRoleId: '',
        exclusiveTeamId: '',
        certificateEnabled: false,
        certificateTemplateId: ''
    });
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
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

    const addToast = async (message: string, type: ToastType = 'success') => {
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
            win.Swal.fire({
                title: type.charAt(0).toUpperCase() + type.slice(1),
                text: message,
                icon: type,
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
            alert(message);
        }
    };

    const askConfirmation = async (title: string, message: string, variant: 'danger' | 'info' = 'danger'): Promise<boolean> => {
        if (typeof window === 'undefined') return false;
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
                title,
                text: message,
                icon: variant === 'info' ? 'info' : 'warning',
                showCancelButton: true,
                confirmButtonText: variant === 'info' ? 'Confirm' : 'Confirm Delete',
                cancelButtonText: 'Cancel',
                background: 'var(--background)',
                color: 'var(--foreground)',
                customClass: {
                    popup: 'rounded-[2rem] border border-border bg-background text-foreground shadow-2xl p-8',
                    title: 'text-lg font-black uppercase tracking-tight text-foreground !m-0 !pt-2 font-sans',
                    htmlContainer: 'text-sm text-muted-foreground font-medium !mt-2 !mb-6 font-sans',
                    confirmButton: variant === 'info'
                        ? 'px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-xl shadow-indigo-500/20 cursor-pointer font-sans mr-2'
                        : 'px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-xl shadow-red-500/20 cursor-pointer font-sans mr-2',
                    cancelButton: 'px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer font-sans ml-2'
                },
                buttonsStyling: false
            });
            return !!result.isConfirmed;
        } else {
            return confirm(message);
        }
    };

    const can = useCallback((permission: string) => adminPermissions.length === 0 || adminPermissions.includes(permission), [adminPermissions]);

    const tabPermissions: Partial<Record<Tab, string>> = {
        courses: 'courses.manage',
        learners: 'learners.manage',
        admins: 'people.manage',
        roles: 'people.manage',
        teams: 'people.manage',
        announcements: 'announcements.manage',
        branding: 'branding.manage',
        domains: 'branding.manage',
        settings: 'branding.manage',
        certificates: 'certificates.manage',
        reports: 'reports.view',
        audit: 'reports.view',
    };

    const visibleTabs = ([
        ['overview', 'Overview', LayoutDashboard],
        ['courses', 'Courses', BookOpen],
        ['learners', 'Learners', Users],
        ['roles', 'Job Roles', Shield],
        ['teams', 'Teams', UsersRound],
        ['announcements', 'Announcements', Megaphone],
        ['branding', 'Branding', Palette],
        ['domains', 'Domains', Globe],
        ['settings', 'Settings', Settings],
        ['certificates', 'Certificates', Award],
        ['reports', 'Reports', BarChart3],
        ['admins', 'Manage Admins', Shield],
        ['audit', 'Audit Monitor', Shield],
    ] as [Tab, string, any][]).filter(([tab]) => !tabPermissions[tab] || can(tabPermissions[tab]!));

    // Announcement state
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '', imageUrl: '', documentUrl: '' });
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
    const [announcementPage, setAnnouncementPage] = useState(1);
    const ANNOUNCEMENTS_PER_PAGE = 5;

    // Audit state
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [auditPagination, setAuditPagination] = useState({ total: 0, pages: 1, currentPage: 1, limit: 20 });
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditSearch, setAuditSearch] = useState('');

    // Audit Details State
    const [selectedLogMetadata, setSelectedLogMetadata] = useState<any | null>(null);
    const [insightsUserId, setInsightsUserId] = useState<string | null>(null);
    const [insightsUser, setInsightsUser] = useState<any | null>(null);
    const [isFetchingUserDetail, setIsFetchingUserDetail] = useState(false);

    const fetchUserDetail = async (userId: string) => {
        setIsFetchingUserDetail(true);
        setInsightsUserId(userId);
        try {
            const res = await fetch(`/api/t/${domain}/admin/audit/user/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setInsightsUser(data);
            }
        } catch (e) {
            console.error('User detail fetch error', e);
        } finally {
            setIsFetchingUserDetail(false);
        }
    };

    const exportAuditLog = (log: any) => {
        const data = JSON.stringify(log, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${log.id}-${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addToast('Log exported successfully', 'success');
    };

    const fetchBranding = useCallback(async () => {
        try {
            const res = await fetch(`/api/t/${domain}/admin/branding`);
            if (res.ok) {
                const data = await res.json();
                setBranding(data);
            }
        } catch (e) {
            console.error('Fetch branding error', e);
        }
    }, [domain]);

    const handleLogoUpload = async (file: File, type: 'logoLight' | 'logoDark' | 'favicon') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tenantId', domain);
        formData.append('courseId', 'branding');

        setUploadProgress(prev => ({ ...prev, [type]: 0 }));

        try {
            // Simulate progress for smoother UI since fetch doesn't support ProgressEvent easily without XHR
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    const current = prev[type] || 0;
                    if (current >= 95) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return { ...prev, [type]: current + 5 };
                });
            }, 100);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (res.ok) {
                const data = await res.json();
                setBranding(prev => ({ ...prev, [type]: data.url }));
                addToast(`${type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} uploaded successfully`, 'success');
            } else {
                addToast('Upload failed', 'error');
            }
        } catch (e) {
            addToast('Unexpected error during upload', 'error');
        } finally {
            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[type];
                return newProgress;
            });
        }
    };

    const handleSaveBranding = async () => {
        try {
            const res = await fetch(`/api/t/${domain}/admin/branding`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(branding)
            });

            if (res.ok) {
                addToast('Branding settings saved', 'success');
            } else {
                const err = await res.json();
                addToast(err.error || 'Failed to save branding', 'error');
            }
        } catch (e) {
            addToast('Unexpected error saving branding', 'error');
        }
    };

    const fetchAuditLogs = useCallback(async (page = 1, search = '') => {
        setAuditLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            if (search) params.set('search', search);

            const res = await fetch(`/api/t/${domain}/admin/audit?${params}`);
            if (res.ok) {
                const data = await res.json();
                setAuditLogs(data.logs);
                setAuditPagination(data.pagination);
            }
        } catch (e) {
            addToast('Failed to fetch audit logs', 'error');
        } finally {
            setAuditLoading(false);
        }
    }, [domain]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        if (profileForm.newPassword !== profileForm.confirmPassword) {
            addToast('New passwords do not match', 'error');
            return;
        }

        setIsUpdatingProfile(true);
        try {
            const res = await fetch(`/api/t/${domain}/learner/profile`, {
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
                const profileRes = await fetch(`/api/t/${domain}/learner/profile?userId=${userId}`);
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

            const assignedPermissions = Array.isArray(user.tenantAdminPermissions) ? user.tenantAdminPermissions : [];

            // Users with explicit domain permissions can access the admin portal, regardless of account type.
            if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN' && assignedPermissions.length === 0) {
                router.push(`/t/${domain}/dashboard`);
                return;
            }

            setUserId(user.id);
            setUserName(user.name || 'Admin');
            setUserEmail(user.email || '');
            const permissions = assignedPermissions.length > 0 || (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN')
                ? assignedPermissions
                : ALL_TENANT_ADMIN_PERMISSIONS;
            setAdminPermissions(permissions);
            if (tabPermissions[activeTab] && !permissions.includes(tabPermissions[activeTab]!)) {
                setActiveTab('overview');
            }

            const [statsRes, coursesRes, annRes, rolesRes, teamsRes, certsRes] = await Promise.all([
                fetch(`/api/t/${domain}/admin/stats`),
                permissions.includes('courses.manage') ? fetch(`/api/t/${domain}/courses`) : Promise.resolve(null),
                permissions.includes('announcements.manage') ? fetch(`/api/t/${domain}/announcements`) : Promise.resolve(null),
                permissions.includes('people.manage') ? fetch(`/api/t/${domain}/roles`) : Promise.resolve(null),
                permissions.includes('people.manage') ? fetch(`/api/t/${domain}/teams`) : Promise.resolve(null),
                permissions.includes('certificates.manage') ? fetch(`/api/t/${domain}/certificates`) : Promise.resolve(null)
            ]);

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.stats);
                setRecentActivity(data.recentActivity || []);
                setCoursePerformance(data.coursePerformance || []);
                setTeamPerformance(data.teamPerformance || []);
                setTopLearners(data.topLearners || []);
                setEnrollmentTrendData(data.enrollmentTrendData || []);
                setRoleDistribution(data.roleDistribution || []);
            }
            if (coursesRes?.ok) setCourses(await coursesRes.json());
            if (annRes?.ok) setAnnouncements(await annRes.json());
            if (rolesRes?.ok) setAvailableRoles(await rolesRes.json());
            if (teamsRes?.ok) setAvailableTeams(await teamsRes.json());
            if (certsRes?.ok) setAvailableTemplates(await certsRes.json());

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [domain, router]);

    const fetchAvailableTemplates = async () => {
        try {
            const res = await fetch(`/api/t/${domain}/certificates`);
            if (res.ok) setAvailableTemplates(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const fetchReportStats = useCallback(async (startDate: string, endDate: string, teamId: string, roleId: string) => {
        setReportLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);
            if (teamId) params.set('teamId', teamId);
            if (roleId) params.set('roleId', roleId);
            const res = await fetch(`/api/t/${domain}/admin/stats?${params}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setCoursePerformance(data.coursePerformance || []);
                setTeamPerformance(data.teamPerformance || []);
                setTopLearners(data.topLearners || []);
                setEnrollmentTrendData(data.enrollmentTrendData || []);
                setRoleDistribution(data.roleDistribution || []);
            }
        } catch (e) { console.error(e); }
        finally { setReportLoading(false); }
    }, [domain]);

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

    const [brandingFetched, setBrandingFetched] = useState(false);

    // Fetch branding data once on initial mount to ensure sidebar is branded
    useEffect(() => {
        fetchBranding();
    }, [fetchBranding]);

    useEffect(() => {
        if (activeTab === 'audit') {
            fetchAuditLogs(1, auditSearch);
        }
    }, [activeTab, fetchAuditLogs, auditSearch]);

    // Use debounced search for audit
    useEffect(() => {
        if (activeTab !== 'audit') return;
        const timer = setTimeout(() => {
            fetchAuditLogs(1, auditSearch);
        }, 500);
        return () => clearTimeout(timer);
    }, [auditSearch]);

    // Update platform identity (Title & Favicon)
    useEffect(() => {
        if (branding.name) {
            document.title = `${branding.name} | Admin Portal`;
        }
        if (branding.favicon) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = branding.favicon;
        }
    }, [branding.name, branding.favicon]);

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
                setCourseForm({
                    title: '',
                    description: '',
                    thumbnail: '',
                    skillLevel: 'All Levels',
                    languages: 'English',
                    captions: false,
                    isMarketplace: false,
                    exclusiveRoleId: '',
                    exclusiveTeamId: '',
                    certificateEnabled: false,
                    certificateTemplateId: ''
                });
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

    const updateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse) return;
        try {
            const res = await fetch(`/api/t/${domain}/courses`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...courseForm, id: selectedCourse.id })
            });
            if (res.ok) {
                const updated = await res.json();
                setSelectedCourse({ ...selectedCourse, ...updated });
                setShowCourseModal(false);
                fetchAll();
                addToast('Course updated successfully');
            } else {
                addToast('Failed to update course', 'error');
            }
        } catch (e) {
            addToast('Error updating course', 'error');
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
        formData.append('tenantId', domain);
        formData.append('courseId', selectedCourse?.id || 'misc');

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

        try {
            const data = await uploadFile(file,
                { tenantId: domain, courseId: selectedCourse?.id || 'misc' },
                (percent) => setUploadProgress(prev => ({ ...prev, [`res-${moduleId}`]: percent }))
            );

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
            addToast('Resource uploaded successfully');
        } catch (err: any) {
            console.error('Upload error:', err);
            addToast(err.message || 'Upload failed', 'error');
            setUploadProgress(prev => {
                const next = { ...prev };
                delete next[`res-${moduleId}`];
                return next;
            });
        }
    };

    const handleMainContentUpload = async (moduleId: string, file: File, type: 'VIDEO' | 'PPT') => {
        if (!file) return;

        if (type === 'VIDEO' && file.type !== 'video/mp4') {
            addToast('Please upload an MP4 file for video lessons.', 'error');
            return;
        }

        try {
            const data = await uploadFile(file,
                { tenantId: domain, courseId: selectedCourse?.id || 'misc' },
                (percent) => setUploadProgress(prev => ({ ...prev, [moduleId]: percent }))
            );

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
        } catch (err: any) {
            console.error('Upload Error:', err);
            addToast(err.message || 'Upload failed', 'error');
            setUploadProgress(prev => {
                const next = { ...prev };
                delete next[moduleId];
                return next;
            });
        }
    };

    const uploadTargetResource = async (file: File) => {
        if (!file || !managingResources) return;
        setIsUploadingTargetResource(true);

        try {
            const uploadData = await uploadFile(file, {
                tenantId: domain,
                courseId: managingResources?.id || 'misc'
            });

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
                if (await askConfirmation('Deactivate Lesson?', errorData.error + ' Would you like to deactivate it instead to hide it from learners?', 'info')) {
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
                    if (await askConfirmation('Deactivate Module?', 'This module cannot be deleted because learners have already started or completed it. Would you like to deactivate it instead to hide it from learners?', 'info')) {
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

        // Check for duplicates
        const isDuplicateTitle = announcements.some(
            (ann) => ann.title.trim().toLowerCase() === announcementForm.title.trim().toLowerCase()
        );
        const isDuplicateBody = announcements.some(
            (ann) => ann.body.trim().toLowerCase() === announcementForm.body.trim().toLowerCase()
        );

        if (isDuplicateTitle) {
            addToast('An announcement with this title already exists', 'error');
            return;
        }
        if (isDuplicateBody) {
            addToast('An announcement with this message content already exists', 'error');
            return;
        }

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
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-screen z-50 w-64 border-r border-border bg-secondary/10 p-6 flex flex-col gap-8
                transition-transform duration-300 ease-in-out
                md:sticky md:translate-x-0 md:z-auto
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="flex items-center gap-3 px-2">
                    {/* Close button — mobile only */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </button>

                    {(branding.logoDark || branding.logoLight) ? (
                        <div className="h-14 w-auto min-w-[3rem] flex items-center justify-center bg-transparent">
                            <img
                                src={mounted ? (resolvedTheme === 'dark' ? (branding.logoDark || branding.logoLight!) : (branding.logoLight || branding.logoDark!)) : (branding.logoDark || branding.logoLight!)}
                                alt={branding.name}
                                className="h-full w-auto object-contain"
                            />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-white text-sm" style={{ backgroundColor: branding.primaryColor }}>
                            {branding.name.charAt(0)}
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="font-bold text-sm leading-tight truncate">{branding.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">Admin Portal</p>
                    </div>
                </div>

                <nav className="space-y-1 flex-1 overflow-y-auto min-h-0 pr-1 no-scrollbar">
                    {visibleTabs.map(([tab, label, Icon]) => (
                        <button key={tab} onClick={() => { setActiveTab(tab); setSelectedCourse(null); setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
                            <Icon size={18} />
                            {label}
                            {activeTab === tab && <ChevronRight size={14} className="ml-auto" />}
                        </button>
                    ))}
                </nav>

                <button onClick={() => window.open(`/t/${domain}/dashboard`, '_blank')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground border border-border hover:bg-secondary/50 transition-all">
                    <Eye size={14} /> Preview as Learner
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-auto min-w-0">
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        {/* Hamburger — mobile only */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                            aria-label="Open sidebar"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-2xl font-black uppercase tracking-tight">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {activeTab === 'courses' && !selectedCourse && (
                            <button onClick={() => setShowCourseModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap">
                                <Plus size={16} /> New Course
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
                                    await fetch(`/api/logout`, { method: 'POST' }).catch(() => { });
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
                                { label: 'Learners', value: stats.learners, icon: Users, color: 'blue' },
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
                                        <button onClick={() => {
                                            setCourseForm({
                                                title: selectedCourse.title,
                                                description: selectedCourse.description || '',
                                                thumbnail: selectedCourse.thumbnail || '',
                                                skillLevel: selectedCourse.skillLevel || 'All Levels',
                                                languages: selectedCourse.languages || 'English',
                                                captions: selectedCourse.captions || false,
                                                isMarketplace: selectedCourse.isMarketplace || false,
                                                exclusiveRoleId: selectedCourse.exclusiveRoleId || '',
                                                exclusiveTeamId: selectedCourse.exclusiveTeamId || '',
                                                certificateEnabled: selectedCourse.certificateEnabled || false,
                                                certificateTemplateId: selectedCourse.certificateTemplateId || ''
                                            });
                                            setThumbnailPreview(selectedCourse.thumbnail || null);
                                            setShowCourseModal(true);
                                        }}
                                            className="px-4 py-2 rounded-xl font-bold text-xs bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all flex items-center gap-2">
                                            <Settings size={14} /> Course Settings
                                        </button>
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
                                                <h4 className="text-sm font-bold flex items-center gap-2"><Users size={14} /> Learner Progress Detail</h4>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead>
                                                        <tr className="text-muted-foreground border-b border-border/50">
                                                            <th className="p-4 font-bold">Learner</th>
                                                            <th className="p-4 font-bold">Progress</th>
                                                            <th className="p-4 font-bold">Time Taken</th>
                                                            <th className="p-4 font-bold">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border/50">
                                                        {courseStats.learnerStats.map((s: any) => (
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
                                                                    {t === 'PPT' ? 'PDF' : t}
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
                                                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                                                        {course.exclusiveRole && (
                                                            <span className="px-2 py-1 text-[10px] font-black uppercase rounded-lg bg-indigo-950/90 border border-indigo-500/50 text-indigo-300 backdrop-blur-md flex items-center gap-1 shadow-2xl">
                                                                <Lock size={10} /> Exclusive: {course.exclusiveRole.name}
                                                            </span>
                                                        )}
                                                        {course.exclusiveTeam && (
                                                            <span className="px-2 py-1 text-[10px] font-black uppercase rounded-lg bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 backdrop-blur-md flex items-center gap-1 shadow-2xl">
                                                                <UsersRound size={10} /> Team: {course.exclusiveTeam.name}
                                                            </span>
                                                        )}
                                                    </div>
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

                {/* ── LEARNERS ── */}
                {activeTab === 'learners' && (
                    <LearnersManager domain={domain} addToast={addToast} mode="learners" />
                )}

                {/* â”€â”€ MANAGE ADMINS â”€â”€ */}
                {activeTab === 'admins' && (
                    <LearnersManager domain={domain} addToast={addToast} mode="admins" />
                )}

                {/* ── ANNOUNCEMENTS ── */}
                {activeTab === 'announcements' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {announcements.length === 0 ? (
                            <div className="text-center py-20">
                                <Megaphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                                <p className="font-bold text-lg">No announcements posted</p>
                                <p className="text-muted-foreground text-sm">Post a message and all learners will see it.</p>
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

                {activeTab === 'roles' && (
                    <RolesManager domain={domain as string} addToast={addToast} />
                )}

                {activeTab === 'teams' && (
                    <TeamsManager domain={domain as string} addToast={addToast} />
                )}

                {activeTab === 'reports' && (() => {
                    const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
                    return (
                        <div className="space-y-6 animate-in fade-in duration-500 pb-10">

                            {/* ── Filter Bar ── */}
                            <div className="glassmorphism rounded-2xl border border-border/50 p-4 flex flex-col lg:flex-row items-start lg:items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm shrink-0">
                                    <Filter size={16} /> Filters
                                </div>
                                <div className="flex items-center gap-2 flex-wrap flex-1">
                                    <div className="flex items-center gap-2 bg-secondary/40 border border-border/50 rounded-xl px-3 py-2">
                                        <Calendar size={14} className="text-muted-foreground" />
                                        <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)}
                                            className="bg-transparent text-sm focus:outline-none w-32" />
                                        <span className="text-muted-foreground text-xs">to</span>
                                        <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)}
                                            className="bg-transparent text-sm focus:outline-none w-32" />
                                    </div>
                                    <select value={reportTeamId} onChange={e => { setReportTeamId(e.target.value); setReportRoleId(''); }}
                                        className="bg-secondary/40 border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
                                        <option value="">All Teams</option>
                                        {availableTeams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <select value={reportRoleId} onChange={e => { setReportRoleId(e.target.value); setReportTeamId(''); }}
                                        className="bg-secondary/40 border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
                                        <option value="">All Roles</option>
                                        {availableRoles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                    <button onClick={() => fetchReportStats(reportStartDate, reportEndDate, reportTeamId, reportRoleId)}
                                        className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:opacity-90 transition-all flex items-center gap-2">
                                        {reportLoading ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                                        Apply
                                    </button>
                                    {(reportStartDate || reportEndDate || reportTeamId || reportRoleId) && (
                                        <button onClick={() => { setReportStartDate(''); setReportEndDate(''); setReportTeamId(''); setReportRoleId(''); fetchReportStats('', '', '', ''); }}
                                            className="text-xs font-bold text-red-400 hover:text-red-300 px-2">
                                            Clear
                                        </button>
                                    )}
                                </div>
                                {reportLoading && <span className="text-xs text-muted-foreground animate-pulse">Updating…</span>}
                            </div>

                            {/* ── KPI Cards ── */}
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                                {[
                                    { label: 'Learners', value: stats.learners, icon: Users2, color: 'blue' },
                                    { label: 'Courses', value: stats.courses, icon: BookOpen, color: 'purple' },
                                    { label: 'Enrollments', value: stats.enrollments, icon: Target, color: 'cyan' },
                                    { label: 'Completions', value: stats.completions ?? 0, icon: CheckCircle, color: 'emerald' },
                                    { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'green' },
                                    { label: 'Avg Progress', value: `${stats.avgProgress}%`, icon: BarChart3, color: 'orange' },
                                ].map(({ label, value, icon: Icon, color }) => (
                                    <div key={label} className={`glassmorphism p-4 rounded-2xl border border-${color}-500/20 hover:border-${color}-500/40 transition-colors`}>
                                        <div className={`w-8 h-8 rounded-xl bg-${color}-500/10 text-${color}-400 flex items-center justify-center mb-3`}>
                                            <Icon size={16} />
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                                        <p className="text-2xl font-black mt-0.5">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* ── Charts Row ── */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                {/* Enrollment Trend */}
                                <div className="xl:col-span-2 glassmorphism rounded-2xl border border-border/50 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
                                            <TrendingUp size={14} className="text-blue-400" /> Enrollment Trend (6 months)
                                        </h3>
                                    </div>
                                    {enrollmentTrendData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={200}>
                                            <AreaChart data={enrollmentTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                                                <XAxis dataKey="date" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', borderColor: '#ffffff15', fontSize: 12 }} cursor={{ fill: '#ffffff05' }} />
                                                <Area type="monotone" dataKey="enrollments" name="New Enrollments" stroke="#3b82f6" fill="url(#enrollGrad)" strokeWidth={2} dot={false} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm italic">No enrollment data in the last 6 months</div>
                                    )}
                                </div>

                                {/* Role Distribution */}
                                <div className="glassmorphism rounded-2xl border border-border/50 p-6">
                                    <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground mb-4">
                                        <Users2 size={14} className="text-purple-400" /> Role Distribution
                                    </h3>
                                    {roleDistribution.filter(r => r.value > 0).length > 0 ? (
                                        <>
                                            <ResponsiveContainer width="100%" height={140}>
                                                <PieChart>
                                                    <Pie data={roleDistribution.filter(r => r.value > 0)} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={4}>
                                                        {roleDistribution.filter(r => r.value > 0).map((_: any, i: number) => (
                                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', borderColor: '#ffffff15', fontSize: 11 }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="mt-2 space-y-1.5">
                                                {roleDistribution.filter(r => r.value > 0).map((r: any, i: number) => (
                                                    <div key={r.name} className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                                            <span className="text-muted-foreground font-medium truncate max-w-[100px]">{r.name}</span>
                                                        </div>
                                                        <span className="font-bold">{r.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm italic">No roles assigned</div>
                                    )}
                                </div>
                            </div>

                            {/* ── Course Performance ── */}
                            <div className="glassmorphism rounded-2xl border border-border/50 overflow-hidden">
                                <div className="p-5 border-b border-border/50 flex justify-between items-center bg-secondary/10">
                                    <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
                                        <BarChart3 size={14} className="text-primary" /> Course Performance
                                    </h3>
                                    <button className="px-3 py-1.5 bg-secondary/60 hover:bg-secondary border border-border/50 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all text-muted-foreground">
                                        <Download size={11} /> Export CSV
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-secondary/10 border-b border-border/50">
                                                {['Course', 'Enrollments', 'Completions', 'Completion Rate', 'Avg Progress'].map(h => (
                                                    <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {coursePerformance.length === 0 ? (
                                                <tr><td colSpan={5} className="py-16 text-center text-muted-foreground italic text-sm">No course data yet</td></tr>
                                            ) : coursePerformance.map((c: any) => {
                                                const rate = c.enrollments > 0 ? Math.round((c.completions / c.enrollments) * 100) : 0;
                                                return (
                                                    <tr key={c.id} className="hover:bg-secondary/10 transition-colors">
                                                        <td className="px-5 py-3.5 font-bold text-sm">{c.title}</td>
                                                        <td className="px-5 py-3.5 text-center font-mono text-sm text-muted-foreground">{c.enrollments}</td>
                                                        <td className="px-5 py-3.5 text-center font-mono text-sm text-emerald-400">{c.completions}</td>
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden min-w-[60px]">
                                                                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${rate}%` }} />
                                                                </div>
                                                                <span className="text-[11px] font-bold text-emerald-400 w-8">{rate}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden min-w-[60px]">
                                                                    <div className="h-full bg-primary transition-all" style={{ width: `${c.avgProgress}%` }} />
                                                                </div>
                                                                <span className="text-[11px] font-bold text-primary w-8">{c.avgProgress}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ── Team Performance + Top Learners ── */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {/* Team Performance */}
                                <div className="glassmorphism rounded-2xl border border-border/50 overflow-hidden">
                                    <div className="p-5 border-b border-border/50 bg-secondary/10">
                                        <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
                                            <UsersRound size={14} className="text-cyan-400" /> Team Performance
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-border/30">
                                        {teamPerformance.length === 0 ? (
                                            <div className="py-12 text-center text-muted-foreground italic text-sm">No teams configured</div>
                                        ) : teamPerformance.map((t: any, idx: number) => (
                                            <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/10 transition-colors">
                                                <span className="text-xs font-black text-muted-foreground w-5">#{idx + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">{t.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{t.members} member{t.members !== 1 ? 's' : ''}</p>
                                                </div>
                                                <div className="text-right space-y-1 min-w-[120px]">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <div className="w-20 h-1 bg-secondary/50 rounded-full overflow-hidden">
                                                            <div className="h-full bg-cyan-500 transition-all" style={{ width: `${t.avgProgress}%` }} />
                                                        </div>
                                                        <span className="text-[11px] font-bold text-cyan-400 w-7">{t.avgProgress}%</span>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground text-right">{t.completionRate}% complete</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Top Learners */}
                                <div className="glassmorphism rounded-2xl border border-border/50 overflow-hidden">
                                    <div className="p-5 border-b border-border/50 bg-secondary/10">
                                        <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
                                            <Medal size={14} className="text-amber-400" /> Top Learners
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-border/30">
                                        {topLearners.length === 0 ? (
                                            <div className="py-12 text-center text-muted-foreground italic text-sm">No learner data yet</div>
                                        ) : topLearners.slice(0, 8).map((l: any, idx: number) => (
                                            <div key={l.id} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/10 transition-colors">
                                                <span className={`text-xs font-black w-5 ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>#{idx + 1}</span>
                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                                                    {(l.name || l.email)[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-xs truncate">{l.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{l.completedCourses}/{l.totalCourses} courses</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1 bg-secondary/50 rounded-full overflow-hidden">
                                                        <div className="h-full bg-amber-400 transition-all" style={{ width: `${l.avgProgress}%` }} />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-amber-400 w-7">{l.avgProgress}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    );
                })()}

                {activeTab === 'audit' && (
                    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
                        {/* Header & Search */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                                    <Shield className="w-7 h-7 text-primary" /> Audit Monitor
                                </h1>
                                <p className="text-muted-foreground text-sm font-medium mt-1">
                                    Track all administrative and learner activity across the workspace.
                                </p>
                            </div>
                            <div className="relative w-full md:w-96">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search by action, name or email..."
                                    value={auditSearch}
                                    onChange={(e) => setAuditSearch(e.target.value)}
                                    className="w-full bg-secondary/50 border border-border/50 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase font-bold tracking-tight"
                                />
                            </div>
                        </div>

                        {/* Logs Table */}
                        <div className="glassmorphism rounded-[2rem] border border-border/50 overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-secondary/20 border-b border-border/50">
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">User</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Metadata</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {auditLoading && auditLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-20 text-center">
                                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary opacity-50" />
                                                    <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Retrieving Logs...</p>
                                                </td>
                                            </tr>
                                        ) : auditLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-20 text-center">
                                                    <Activity className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                                                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No matching activity logs found.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            auditLogs.map((log) => (
                                                <tr key={log.id}
                                                    onClick={() => fetchUserDetail(log.user.id)}
                                                    className="hover:bg-primary/5 cursor-pointer transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold whitespace-nowrap">{new Date(log.createdAt).toLocaleDateString()}</span>
                                                            <span className="text-[10px] font-medium text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                                {log.user.name?.[0].toUpperCase() || 'U'}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    <span className="text-sm font-bold truncate max-w-[120px]">{log.user.name}</span>
                                                                    <UserCircle size={10} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                                <span className="text-[10px] text-muted-foreground truncate">{log.user.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-tight ${log.action.includes('CREATED') ? 'bg-emerald-500/10 text-emerald-500' :
                                                                log.action.includes('DELETED') ? 'bg-red-500/10 text-red-500' :
                                                                    log.action.includes('UPDATED') ? 'bg-blue-500/10 text-blue-500' :
                                                                        'bg-secondary text-muted-foreground'
                                                            }`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedLogMetadata(log);
                                                            }}
                                                            className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                                            title="View Detailed Insight"
                                                        >
                                                            <ScanSearch size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {auditPagination.pages > 1 && (
                                <div className="p-6 bg-secondary/10 border-t border-border/50 flex items-center justify-between">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Showing {(auditPagination.currentPage - 1) * auditPagination.limit + 1} - {Math.min(auditPagination.currentPage * auditPagination.limit, auditPagination.total)} of {auditPagination.total} logs
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={auditPagination.currentPage === 1 || auditLoading}
                                            onClick={() => fetchAuditLogs(auditPagination.currentPage - 1, auditSearch)}
                                            className="p-2 rounded-xl bg-background border border-border/50 hover:bg-secondary disabled:opacity-50 transition-all"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <span className="text-sm font-black px-4">
                                            {auditPagination.currentPage} / {auditPagination.pages}
                                        </span>
                                        <button
                                            disabled={auditPagination.currentPage === auditPagination.pages || auditLoading}
                                            onClick={() => fetchAuditLogs(auditPagination.currentPage + 1, auditSearch)}
                                            className="p-2 rounded-xl bg-background border border-border/50 hover:bg-secondary disabled:opacity-50 transition-all"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}



                {/* ── BRANDING ── */}
                {activeTab === 'branding' && (
                    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500 pb-20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="glassmorphism p-8 rounded-3xl border border-border/50 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                        <Globe size={14} /> Organization Identity
                                    </h3>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Platform Display Name</label>
                                        <input type="text" value={branding.name} onChange={e => setBranding({ ...branding, name: e.target.value })}
                                            className="w-full bg-secondary/50 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                                            placeholder="e.g. Acme Academy" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                        <Palette size={14} /> Platform Theme Color
                                    </h3>
                                    <div className="flex items-center gap-6 p-4 rounded-2xl bg-secondary/20 border border-border/30">
                                        <div className="relative group">
                                            <input type="color" value={branding.primaryColor} onChange={e => setBranding({ ...branding, primaryColor: e.target.value })}
                                                className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-background bg-transparent shadow-xl transition-transform active:scale-95" />
                                            <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/20 pointer-events-none" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mb-1">Color Token</p>
                                            <p className="font-mono font-black text-xl text-foreground tracking-tighter">{branding.primaryColor.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2.5 flex-wrap">
                                        {['#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#000000'].map(c => (
                                            <button key={c}
                                                className={`w-9 h-9 rounded-xl border-2 transition-all hover:scale-110 shadow-sm ${branding.primaryColor === c ? 'scale-110 shadow-lg shadow-black/20' : 'opacity-80 hover:opacity-100'}`}
                                                style={{ backgroundColor: c, borderColor: branding.primaryColor === c ? 'white' : 'transparent' }}
                                                onClick={() => setBranding({ ...branding, primaryColor: c })} />
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        onClick={handleSaveBranding}
                                        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-[1.25rem] font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20">
                                        <Save size={16} /> Save Platform Changes
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <section className="glassmorphism p-8 rounded-3xl border border-border/50 space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                        <Upload size={14} /> Brand Assets
                                    </h3>

                                    {/* Asset Grid */}
                                    <div className="space-y-6">
                                        {[
                                            { id: 'logoLight', label: 'Primary Logo (Light Theme)', sub: 'Transparent PNG/SVG suggested', icon: Globe },
                                            { id: 'logoDark', label: 'Secondary Logo (Dark Theme)', sub: 'Logo for dark navigation bars', icon: Globe },
                                            { id: 'favicon', label: 'Site Favicon', sub: 'Square icon (32x32px suggested)', icon: Globe },
                                        ].map((asset) => (
                                            <div key={asset.id} className="space-y-3">
                                                <div className="flex justify-between items-end px-1">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{asset.label}</p>
                                                        <p className="text-[9px] text-muted-foreground font-medium">{asset.sub}</p>
                                                    </div>
                                                </div>

                                                <div className="relative group">
                                                    <label className={`block w-full cursor-pointer rounded-[1.25rem] border-2 border-dashed transition-all overflow-hidden ${branding[asset.id as keyof typeof branding]
                                                            ? 'border-primary/20 bg-primary/5 h-24'
                                                            : 'border-border/60 hover:border-primary/40 bg-secondary/10 hover:bg-secondary/20 h-20'
                                                        }`}>
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleLogoUpload(file, asset.id as any);
                                                        }} />

                                                        {branding[asset.id as keyof typeof branding] ? (
                                                            <div className="w-full h-full flex items-center justify-center p-4">
                                                                <img src={branding[asset.id as keyof typeof branding]!} alt={asset.label} className="max-w-full max-h-full object-contain" />
                                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-[1.25rem]">
                                                                    <Upload size={20} className="text-white" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center gap-1 opacity-60">
                                                                <Plus size={16} />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Select Asset</span>
                                                            </div>
                                                        )}
                                                    </label>
                                                    {uploadProgress[asset.id] !== undefined && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20 rounded-b-[1.25rem] overflow-hidden">
                                                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress[asset.id]}%` }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Real-time Preview */}
                                <div className="p-8 rounded-[2rem] border-2 border-dashed bg-secondary/5 relative overflow-hidden"
                                    style={{ borderColor: branding.primaryColor + '30' }}>
                                    <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ backgroundColor: branding.primaryColor }} />

                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: branding.primaryColor }}>
                                            <Globe size={14} className="text-white" />
                                        </div>
                                        <h4 className="font-black text-sm" style={{ color: branding.primaryColor }}>Live Platform Preview</h4>
                                    </div>

                                    <div className="glassmorphism p-6 rounded-2xl border border-border/50 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden border border-border/40">
                                                {branding.logoLight || branding.logoDark ? (
                                                    <img src={branding.logoLight || branding.logoDark || ''} className="w-full h-full object-contain p-1" />
                                                ) : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-muted-foreground">{branding.name[0]}</div>}
                                            </div>
                                            <span className="text-sm font-black tracking-tight">{branding.name} LMS</span>
                                        </div>
                                        <div className="h-2 w-3/4 bg-secondary/50 rounded-full" />
                                        <div className="h-2 w-1/2 bg-secondary/30 rounded-full" />
                                        <button className="w-full py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/5"
                                            style={{ backgroundColor: branding.primaryColor }}>
                                            Join Learning Path
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── DOMAINS ── */}
                {activeTab === 'domains' && (
                    <div className="max-w-2xl space-y-6 animate-in fade-in duration-500">
                        <div className="glassmorphism p-8 rounded-3xl border border-border/50 space-y-6">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Platform Subdomain</p>
                                <p className="font-mono font-bold text-blue-400">{domain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lvh.me:3000'}</p>
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
                                    <p className="font-bold text-sm">Allow Learner Self-Registration</p>
                                    <p className="text-xs text-muted-foreground">Learners can sign up without an invite.</p>
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
                    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
                        {editingTemplate ? (
                            <CertificateDesigner
                                key={editingTemplate.id}
                                template={editingTemplate}
                                onBack={() => { setEditingTemplate(null); fetchAvailableTemplates(); }}
                                onSave={async (id, designFields, backgroundImage, name) => {
                                    try {
                                        const isNew = id === 'new';
                                        const url = isNew
                                            ? `/api/t/${domain}/certificates`
                                            : `/api/t/${domain}/certificates/${id}`;
                                        const method = isNew ? 'POST' : 'PATCH';

                                        const res = await fetch(url, {
                                            method,
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ designFields, backgroundImage, name })
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                            addToast('Design saved successfully.', 'success');
                                            setEditingTemplate(null);
                                            fetchAvailableTemplates();
                                        } else {
                                            addToast(data.error || 'Failed to save design.', 'error');
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        addToast('Network error while saving design.', 'error');
                                    }
                                }}
                            />
                        ) : (
                            <CertificateManager
                                domain={domain as string}
                                addToast={addToast}
                                onEditTemplate={(t) => setEditingTemplate(t)}
                                askConfirmation={askConfirmation}
                            />
                        )}
                    </div>
                )}
            </main>

            {/* Modals */}
            {showCourseModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
                    <div className="bg-background border border-border w-full max-w-2xl max-h-[90vh] rounded-3xl p-8 space-y-6 shadow-2xl flex flex-col">
                        <div className="flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-black">{selectedCourse && showCourseModal ? 'Edit Course' : 'Create New Course'}</h3>
                            <button onClick={() => { setShowCourseModal(false); if (selectedCourse) setCourseForm({ title: '', description: '', thumbnail: '', skillLevel: 'All Levels', languages: 'English', captions: false, isMarketplace: false, exclusiveRoleId: '', exclusiveTeamId: '', certificateEnabled: false, certificateTemplateId: '' }); }} className="text-muted-foreground hover:text-foreground"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={selectedCourse ? updateCourse : createCourse} className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
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
                                <textarea placeholder="Brief description of what learners will learn..." value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
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
                            <div className="flex flex-col gap-3 py-2">
                                <div className="flex items-center gap-2 px-1">
                                    <input type="checkbox" id="course-captions" checked={courseForm.captions} onChange={e => setCourseForm({ ...courseForm, captions: e.target.checked })}
                                        className="rounded border-border/50 bg-secondary/30 text-primary focus:ring-primary/20" />
                                    <label htmlFor="course-captions" className="text-xs font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">Has Closed Captions</label>
                                </div>
                                <div className="flex items-center gap-2 px-1">
                                    <input type="checkbox" id="course-marketplace" checked={courseForm.isMarketplace} onChange={e => setCourseForm({ ...courseForm, isMarketplace: e.target.checked })}
                                        className="rounded border-border/50 bg-secondary/30 text-amber-500 focus:ring-amber-500/20" />
                                    <label htmlFor="course-marketplace" className="text-xs font-bold uppercase tracking-widest text-amber-600/80 cursor-pointer">Publish to Internal Marketplace</label>
                                </div>
                                <div className="flex items-center gap-2 px-1 pt-2 border-t border-border/20 mt-2">
                                    <input type="checkbox" id="course-certificate" checked={courseForm.certificateEnabled} onChange={e => setCourseForm({ ...courseForm, certificateEnabled: e.target.checked })}
                                        className="rounded border-border/50 bg-secondary/30 text-indigo-500 focus:ring-indigo-500/20" />
                                    <label htmlFor="course-certificate" className="text-xs font-bold uppercase tracking-widest text-indigo-400 cursor-pointer flex items-center gap-2">
                                        <Award size={14} /> Enable Certificate of Achievement
                                    </label>
                                </div>
                            </div>

                            {courseForm.certificateEnabled && (
                                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Certificate Template</label>
                                    <select
                                        value={courseForm.certificateTemplateId}
                                        onChange={e => setCourseForm({ ...courseForm, certificateTemplateId: e.target.value })}
                                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        <option value="">-- Choose Template --</option>
                                        {availableTemplates.map((t: any) => (
                                            <option key={t.id} value={t.id}>{t.name} {t.isGlobal ? '(Global)' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {/* Exclusive Role/Team Gating */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Exclusive to Role (Optional)</label>
                                    <select
                                        value={courseForm.exclusiveRoleId}
                                        onChange={e => setCourseForm({ ...courseForm, exclusiveRoleId: e.target.value, isMarketplace: (e.target.value || courseForm.exclusiveTeamId) ? false : courseForm.isMarketplace })}
                                        className="w-full bg-secondary/50 border border-border/50 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:border-primary/30 cursor-pointer font-bold text-foreground"
                                    >
                                        <option value="" className="bg-background">No Restriction — All Learners</option>
                                        {availableRoles.map((r: any) => <option key={r.id} value={r.id} className="bg-background">{r.name} Only</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Exclusive to Team (Optional)</label>
                                    <select
                                        value={courseForm.exclusiveTeamId}
                                        onChange={e => setCourseForm({ ...courseForm, exclusiveTeamId: e.target.value, isMarketplace: (e.target.value || courseForm.exclusiveRoleId) ? false : courseForm.isMarketplace })}
                                        className="w-full bg-secondary/50 border border-border/50 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:border-primary/30 cursor-pointer font-bold text-foreground"
                                    >
                                        <option value="" className="bg-background">No Restriction — All Learners</option>
                                        {availableTeams.map((t: any) => <option key={t.id} value={t.id} className="bg-background">{t.name} Only</option>)}
                                    </select>
                                </div>
                            </div>
                            {(courseForm.exclusiveRoleId || courseForm.exclusiveTeamId) && (
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                                    <span className="text-base mt-0.5">⚠️</span>
                                    <div className="space-y-1">
                                        <p className="font-black uppercase tracking-wider text-[10px] text-amber-400">Exclusive Gating Active</p>
                                        <p className="text-muted-foreground/80 leading-relaxed font-bold">
                                            Exclusive courses are hidden from the Marketplace and invisible to learners without this {courseForm.exclusiveRoleId && courseForm.exclusiveTeamId ? 'role and team' : courseForm.exclusiveRoleId ? 'role' : 'team'}.
                                        </p>
                                    </div>
                                </div>
                            )}
                            <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90">
                                {selectedCourse ? 'Save Changes' : 'Create Course'}
                            </button>
                        </form>
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
                                                        ? `Each learner will see ${quizForm.randomCount} random questions from your pool.`
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
                                                <p className="text-[10px] text-muted-foreground italic">Learners will type their answer. It will be matched against this text.</p>
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
                                                                ? 'Check all correct answers — learners must select all of them.'
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
                    <div className="bg-background border border-border w-full max-w-2xl max-h-[90vh] rounded-3xl p-8 space-y-6 shadow-2xl flex flex-col">
                        <div className="flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-black">Post Announcement</h3>
                            <button onClick={() => setShowAnnouncementModal(false)} className="text-muted-foreground hover:text-foreground"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={createAnnouncement} className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
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
                                            formData.append('tenantId', domain);
                                            formData.append('courseId', 'announcements');
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
                                            formData.append('tenantId', domain);
                                            formData.append('courseId', 'announcements');
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

            {/* ── AUDIT LOG METADATA PANEL ── */}
            {selectedLogMetadata && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedLogMetadata(null)}>
                    <div className="w-full max-w-2xl bg-background border border-border/50 max-h-[90vh] rounded-3xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-border/50 flex justify-between items-center bg-secondary/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <ScanSearch className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Log Insight</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{selectedLogMetadata.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLogMetadata(null)} className="p-2 hover:bg-secondary rounded-xl transition-all">
                                <XCircle size={20} className="text-muted-foreground" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="space-y-8">
                                {/* Human Narrative */}
                                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Activity size={48} />
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Narrative Context</h4>
                                    <p className="text-sm font-bold leading-relaxed">
                                        User <span className="text-primary">{selectedLogMetadata.user.name}</span> performed a <span className="text-primary">{selectedLogMetadata.action.replace(/_/g, ' ')}</span> operation on the workspace entity.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Shield size={12} className="text-primary" /> Authority Context
                                    </h4>
                                    <div className="p-5 rounded-2xl bg-secondary/20 border border-border/50 divide-y divide-border/30">
                                        <div className="flex justify-between items-center py-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Action Type</span>
                                            <span className="text-xs font-black text-primary">{selectedLogMetadata.action}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Timestamp</span>
                                            <span className="text-[11px] font-bold">{new Date(selectedLogMetadata.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <LayoutList size={12} className="text-primary" /> Resource Properties
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {Object.entries(selectedLogMetadata.metadata || {}).map(([key, value]) => (
                                            <div key={key} className="p-4 rounded-2xl bg-secondary/10 border border-border/40 hover:border-primary/20 transition-all">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">{getMetadataLabel(key)}</p>
                                                <p className="text-xs font-bold break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-border/50">
                            <button
                                onClick={() => exportAuditLog(selectedLogMetadata)}
                                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg hover:shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Download size={14} /> Export Insight Data
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── USER INSIGHTS PANEL ── */}
            {insightsUserId && (
                <div className="fixed inset-0 z-[500] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => { setInsightsUserId(null); setInsightsUser(null); }}>
                    <div className="w-full max-w-xl bg-background border-l border-border/50 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex items-start justify-between px-8 py-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl shadow-lg shadow-primary/5">
                                    {isFetchingUserDetail ? <Loader2 size={24} className="animate-spin" /> : insightsUser?.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">Learner Analytics</p>
                                    <h2 className="text-2xl font-black truncate max-w-[320px]">{isFetchingUserDetail ? 'Hydrating Detail...' : insightsUser?.name || 'Anonymous User'}</h2>
                                </div>
                            </div>
                            <button onClick={() => { setInsightsUserId(null); setInsightsUser(null); }} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {!isFetchingUserDetail && insightsUser ? (
                                <div className="p-8 space-y-10">
                                    {/* Calculated Metrics */}
                                    {(() => {
                                        const totalEnrollments = insightsUser.enrollments?.length || 0;
                                        const totalLessons = insightsUser.enrollments?.reduce((acc: number, en: any) => acc + (en.totalLessons || 0), 0) || 0;
                                        const completedLessons = insightsUser.enrollments?.reduce((acc: number, en: any) => acc + (en.completedLessons || 0), 0) || 0;
                                        const avgProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
                                        const quizAccuracy = insightsUser.quizAttempts?.length > 0
                                            ? Math.round(insightsUser.quizAttempts.reduce((acc: any, curr: any) => acc + (curr.score || 0), 0) / insightsUser.quizAttempts.length)
                                            : 0;

                                        return (
                                            <>
                                                {/* KPI Grid */}
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50 space-y-1">
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Enrollments</p>
                                                        <p className="text-2xl font-black text-foreground">{totalEnrollments}</p>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                                                        <p className="text-[9px] font-black uppercase text-emerald-500/70 tracking-widest">Avg Progress</p>
                                                        <p className="text-2xl font-black text-emerald-400">{avgProgress}%</p>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-1">
                                                        <p className="text-[9px] font-black uppercase text-blue-500/70 tracking-widest">Assessment</p>
                                                        <p className="text-2xl font-black text-blue-400">{quizAccuracy}%</p>
                                                    </div>
                                                </div>

                                                {/* Course Breakdown */}
                                                <section className="space-y-4">
                                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                        <BookOpen size={11} className="text-primary" /> Enrollment Velocity
                                                    </h3>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {insightsUser.enrollments?.length > 0 ? insightsUser.enrollments.map((en: any) => (
                                                            <div key={en.id} className="p-4 rounded-2xl bg-secondary/10 border border-border/40 hover:border-primary/30 transition-all group">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{en.course?.title}</p>
                                                                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tight mt-0.5">
                                                                            {en.completedLessons} / {en.totalLessons} Lessons Completed
                                                                        </p>
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-primary">{en.progressPercentage}%</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-primary transition-all duration-1000"
                                                                        style={{ width: `${en.progressPercentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div className="text-center py-6 text-muted-foreground text-xs italic">No active enrollments found.</div>
                                                        )}
                                                    </div>
                                                </section>
                                            </>
                                        );
                                    })()}

                                    {/* Activity Timeline */}
                                    <section className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Clock size={11} className="text-primary" /> Activity Stream
                                        </h3>
                                        <div className="relative pl-4 space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60">
                                            {insightsUser.activityLogs?.slice(0, 10).map((log: any, idx: number) => (
                                                <div key={idx} className="relative pl-6">
                                                    <div className="absolute left-[-1px] top-1.5 w-2 h-2 rounded-full bg-primary border-2 border-background z-10 shadow-sm shadow-primary/20" />
                                                    <div>
                                                        <p className="text-xs font-bold leading-none">{log.action.replace(/_/g, ' ')}</p>
                                                        <p className="text-[10px] text-muted-foreground mt-1.5 font-medium uppercase">
                                                            {new Date(log.createdAt).toLocaleDateString()} &middot; {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!insightsUser.activityLogs || insightsUser.activityLogs.length === 0) && (
                                                <div className="text-muted-foreground text-xs italic pl-2">No recent activity recorded.</div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 opacity-40 animate-pulse">
                                    <Loader2 size={48} className="animate-spin mb-4 text-primary" />
                                    <p className="text-sm font-bold uppercase tracking-widest">Hydrating User Insight...</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-border/50 bg-background/80 backdrop-blur-sm mt-auto">
                            <button
                                onClick={() => { setInsightsUserId(null); setInsightsUser(null); }}
                                className="w-full py-4 bg-secondary text-foreground rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-secondary/80 transition-all shadow-lg active:scale-[0.98]"
                            >
                                Close Insights
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showProfileModal && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-background border border-border/50 w-full max-w-md max-h-[90vh] rounded-[2rem] p-8 space-y-6 shadow-2xl relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 shrink-0" />

                        <div className="flex justify-between items-center shrink-0">
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

                        <form onSubmit={handleUpdateProfile} className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
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

        </div>
    );
}

