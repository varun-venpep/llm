import {
  BarChart3,
  BookOpenCheck,
  Building2,
  FileCheck2,
  Globe2,
  GraduationCap,
  Layers3,
  LifeBuoy,
  LockKeyhole,
  Mail,
  MapPin,
  MessageSquareText,
  MonitorPlay,
  Palette,
  Phone,
  ShieldCheck,
  UsersRound,
  Zap,
} from 'lucide-react';

export const homeHighlights = [
  { icon: MonitorPlay, title: 'Content-rich courses', text: 'Deliver videos, documents, quizzes, modules, certificates, resources, and progress tracking.' },
  { icon: ShieldCheck, title: 'Operational governance', text: 'Keep access, reporting, user roles, and platform controls structured for serious teams.' },
  { icon: Palette, title: 'White-label portals', text: 'Launch every academy with your logo, colors, domain, and learner-facing identity.' },
  { icon: Layers3, title: 'Multi-tenant control', text: 'Manage multiple organizations, teams, admins, learners, and catalogs from one command center.' },
];

export const featureGroups = [
  { icon: Building2, title: 'Tenant Management', text: 'Create branded workspaces for companies, schools, franchises, or departments with separate users, catalogs, settings, and analytics.' },
  { icon: GraduationCap, title: 'Learner Experience', text: 'Give learners a focused dashboard with assigned courses, progress, certificates, notes, achievements, and mobile-friendly course playback.' },
  { icon: BookOpenCheck, title: 'Course Authoring', text: 'Organize learning into courses, modules, lessons, videos, PDFs, resources, quizzes, reviews, and marketplace-ready global content.' },
  { icon: UsersRound, title: 'Teams and Roles', text: 'Group learners by department, cohort, job role, or client account, then assign targeted content and view segmented performance.' },
  { icon: BarChart3, title: 'Reports and Insights', text: 'Track completions, enrollment trends, activity, course engagement, certificates, team progress, and platform-level growth.' },
  { icon: LockKeyhole, title: 'Secure Access', text: 'Support admin, manager, and learner roles with session-based access, tenant-aware routes, and structured permission boundaries.' },
  { icon: FileCheck2, title: 'Certificates', text: 'Design completion certificates and issue verifiable records that make training outcomes visible and shareable.' },
  { icon: Globe2, title: 'Localization Ready', text: 'Prepare training experiences for distributed teams with tenant locale settings and translation-ready content workflows.' },
  { icon: LifeBuoy, title: 'Managed Support', text: 'Operate the platform with admin tooling, recovery paths, audit visibility, and practical support touchpoints for learners and admins.' },
];

export const pricingPlans = [
  {
    name: 'Launch',
    price: '₹14,999',
    note: 'per workspace / month',
    description: 'For small teams launching a branded training portal quickly.',
    features: ['1 branded tenant', 'Up to 500 learners', 'Course builder', 'Basic reports', 'Email support'],
  },
  {
    name: 'Scale',
    price: '₹39,999',
    note: 'per workspace / month',
    description: 'For growing academies and organizations with multiple teams.',
    features: ['5 branded tenants', 'Up to 5,000 learners', 'Teams and role assignment', 'Certificates', 'Priority support'],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    note: 'tailored agreement',
    description: 'For high-volume training businesses with complex operating needs.',
    features: ['Unlimited tenant strategy', 'Custom onboarding', 'Advanced governance', 'Dedicated success support', 'Custom integrations'],
  },
];

export const contactMethods = [
  { icon: Mail, title: 'Email', text: 'skalathmika@gmail.com', href: 'mailto:skalathmika@gmail.com' },
  { icon: Phone, title: 'Phone', text: 'Schedule a guided call', href: '/contact' },
  { icon: MapPin, title: 'Region', text: 'Built for distributed teams', href: '/contact' },
  { icon: MessageSquareText, title: 'Support', text: 'Platform, onboarding, and learner operations', href: '/contact' },
];
