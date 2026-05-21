import {
  Award,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  Brain,
  Building2,
  Crown,
  FileCheck2,
  Globe,
  GraduationCap,
  Layers,
  Mail,
  MessageSquare,
  MessageSquareText,
  MonitorPlay,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  Users2,
  Zap,
} from 'lucide-react';

export const logoCloud = ['Northwind', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark Inc'];

export const problemPoints = [
  'Juggling live calls, documents, forms, and spreadsheets',
  'Spending weeks creating quizzes manually',
  'No easy way to brand portals for different teams or clients',
  'Limited visibility into who actually completed training',
  'Certificates designed and tracked outside the LMS',
];

export const solutionPoints = [
  'One platform for courses, quizzes, certificates, and analytics',
  'AI generates complete quizzes from training content in seconds',
  'Multi-tenant workspaces with custom branding and domains',
  'Real-time progress tracking down to the lesson',
  'Auto-issued certificates with verification-ready records',
];

export const homeHighlights = [
  { icon: Brain, title: 'AI quiz generation', text: 'Upload a video, PDF, slide deck, or text and generate editable multiple-choice quizzes with explanations.' },
  { icon: Users, title: 'Multi-tenant portals', text: 'Spin up branded workspaces for clients, departments, schools, franchises, or partner programs.' },
  { icon: MonitorPlay, title: 'Rich course delivery', text: 'Deliver videos, PDFs, modules, lessons, notes, resources, quizzes, certificates, and progress tracking.' },
  { icon: BarChart3, title: 'Live analytics', text: 'Track completion, quiz scores, learner activity, certificates, and team performance in real time.' },
];

export const featureGroups = [
  { icon: BookOpen, title: 'Drag-and-drop course builder', text: 'Create structured modules, lessons, video content, PDFs, slides, resources, and quizzes in one flow.' },
  { icon: Award, title: 'Branded certificates', text: 'Issue polished completion certificates with custom templates and verification details.' },
  { icon: Shield, title: 'Secure video learning', text: 'Protect training videos with controlled playback, signed delivery, and learner-aware access.' },
  { icon: Globe, title: 'Global marketplace', text: 'Publish reusable content across tenants and let workspaces claim courses into their own catalog.' },
  { icon: Layers, title: 'Teams and departments', text: 'Organize learners by cohort, department, client account, job role, or manager hierarchy.' },
  { icon: MessageSquare, title: 'Announcements and i18n', text: 'Reach learners with workspace announcements and support multilingual training workflows.' },
  { icon: Building2, title: 'Tenant management', text: 'Manage isolated workspaces with their own branding, users, content, settings, and analytics.' },
  { icon: FileCheck2, title: 'Audit-ready reporting', text: 'Export progress, activity, completions, assessment results, and certificate outcomes for stakeholders.' },
  { icon: ShieldCheck, title: 'Role-based access', text: 'Keep platform owners, admins, managers, instructors, and learners in purpose-built surfaces.' },
];

export const workflowSteps = [
  { n: '01', title: 'Create your workspace', text: 'Pick a subdomain, upload branding, configure access, and make the first portal feel owned from day one.' },
  { n: '02', title: 'Build courses with AI', text: 'Upload training assets and generate quizzes, modules, and structured learning paths faster.' },
  { n: '03', title: 'Invite your learners', text: 'Bulk import users, assign roles, organize teams, and give every learner a clean dashboard.' },
  { n: '04', title: 'Track, certify, scale', text: 'Monitor progress, issue certificates, export reports, and expand into new teams or tenants.' },
];

export const roles = [
  { icon: Crown, title: 'Super Admins', text: 'Platform-wide analytics, tenant management, billing, global course library, and staff oversight.' },
  { icon: Building2, title: 'Tenant Admins', text: 'Course builder, learner management, branding, certificates, announcements, and audit logs.' },
  { icon: ShieldCheck, title: 'Platform Managers', text: 'Operational oversight across tenants without broad billing or destructive permissions.' },
  { icon: Users2, title: 'Team Managers', text: 'Assign courses, monitor team progress, and drive accountability with team dashboards.' },
  { icon: BookOpenCheck, title: 'Instructors and Teachers', text: 'Author courses, build quizzes, support learners, and publish content to the marketplace.' },
  { icon: GraduationCap, title: 'Learners', text: 'Open a focused course library, continue lessons, take notes, complete quizzes, and collect certificates.' },
];

export const pricingPlans = [
  {
    name: 'Starter',
    currency: 'SGD',
    price: '799',
    note: 'per workspace / month',
    description: 'Perfect for small teams getting started with a branded academy.',
    features: ['Up to 500 learners', 'Course builder', 'Basic analytics', 'Standard certificates', 'Email support'],
  },
  {
    name: 'Professional',
    currency: 'SGD',
    price: '1,499',
    note: 'per workspace / month',
    description: 'For growing learning teams that need AI, branding, and team controls.',
    features: ['Up to 5,000 learners', 'AI quiz generation', 'Custom branding and domain', 'Teams and roles', 'Priority support'],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    note: 'tailored agreement',
    description: 'For large organizations, franchises, and multi-tenant learning businesses.',
    features: ['Unlimited tenant strategy', 'Custom onboarding', 'Advanced governance', 'Dedicated success support', 'Custom integrations'],
  },
];

export const faqs = [
  { q: 'How long does setup take?', a: 'Most teams can start with a branded workspace quickly, then expand learners, roles, courses, and reporting as the academy grows.' },
  { q: 'How does AI quiz generation work?', a: 'Upload training content such as a video, PDF, slide deck, or text. The platform can generate questions, answers, explanations, and difficulty settings for review.' },
  { q: 'What does multi-tenant mean?', a: 'Each tenant can have its own branding, learners, courses, admins, and settings while the platform owner manages everything centrally.' },
  { q: 'Does it support certificates and reporting?', a: 'Yes. Certificates, completion tracking, learner activity, admin reports, and team-level progress are core platform workflows.' },
  { q: 'Can managers track their teams?', a: 'Yes. Team managers can view assigned learner progress and keep training aligned with department or cohort goals.' },
  { q: 'Can we use our own logo and colors?', a: 'Yes. Tenant workspaces are designed for custom branding, domains, colors, and learner-facing identity.' },
];

export const testimonials = [
  {
    quote: 'The platform replaced disconnected tools and gave our team one place to build, assign, and measure training.',
    name: 'Sarah Chen',
    role: 'Head of Learning',
    company: 'Northwind',
  },
  {
    quote: 'The multi-tenant model is exactly what we needed for partner training. Branded portals are much easier to manage now.',
    name: 'Marcus Williams',
    role: 'VP Operations',
    company: 'Globex',
  },
  {
    quote: 'Learners finally get a modern experience, and admins can see progress without chasing spreadsheets.',
    name: 'Priya Patel',
    role: 'Training Director',
    company: 'ACME Corp',
  },
];

export const contactMethods = [
  { icon: Mail, title: 'Email', text: 'skalathmika@gmail.com', href: 'mailto:skalathmika@gmail.com' },
  { icon: Phone, title: 'Demo Call', text: 'Book a guided walkthrough', href: '/contact' },
  { icon: MessageSquareText, title: 'Support', text: 'Platform, onboarding, and learner operations', href: '/contact' },
  { icon: Sparkles, title: 'Workspace Plan', text: 'Map tenants, roles, courses, and launch steps', href: '/contact' },
];
