import { Metadata } from 'next';
import {
  CtaSection,
  FeaturesShowcase,
  HeroSection,
  HowItWorks,
  MarketingPage,
  PricingSection,
  ProblemSolution,
  RolesSection,
  TestimonialsSection,
  FaqSection,
} from '@/components/marketing/MarketingLayout';

export const metadata: Metadata = {
  title: 'AI Learning Platform & LMS for Training Academies | Lebra',
  description: 'Lebra.AI is an AI learning platform and learning management system (LMS) with AI course creation, employee training, certificates, analytics, and reporting.',
  keywords: [
    'ai learning course',
    'ai learning platform',
    'learning management system lms',
    'ai training platform',
    'employee training platform',
    'AI Course Creation'
  ],
  alternates: {
    canonical: 'https://lebra.ai/landing',
  },
};

const schemaJson = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://lebra.ai/#organization",
      "name": "Lebra.AI",
      "url": "https://lebra.ai",
      "logo": "https://lebra.ai/_next/image?url=%2Flebra_ai_logo_footer.png&w=1920&q=75",
      "description": "AI-powered multi-tenant learning management platform for employee training, customer education, partner enablement, compliance learning, certifications, analytics, and reporting."
    },
    {
      "@type": "WebSite",
      "@id": "https://lebra.ai/#website",
      "url": "https://lebra.ai",
      "name": "Lebra.AI",
      "publisher": {
        "@id": "https://lebra.ai/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://lebra.ai/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://lebra.ai/#software",
      "name": "Lebra.AI",
      "url": "https://lebra.ai",
      "applicationCategory": "BusinessApplication",
      "applicationSubCategory": "Learning Management System",
      "operatingSystem": "Web",
      "description": "AI-powered learning platform for employee training, onboarding, certifications, compliance learning, customer education, partner enablement, and analytics.",
      "keywords": [
        "AI Learning Platform",
        "Learning Management System",
        "Employee Training Software",
        "Corporate LMS",
        "Customer Education Platform",
        "Partner Training Software",
        "Compliance Training Software",
        "Multi Tenant LMS",
        "AI Course Creation",
        "AI Quiz Generator"
      ],
      "featureList": [
        "AI Course Creation",
        "AI Quiz Generation",
        "Multi-Tenant LMS",
        "Employee Training",
        "Customer Education",
        "Partner Enablement",
        "Compliance Learning",
        "Certificates",
        "Learning Analytics",
        "Reporting Dashboard",
        "Role-Based Access",
        "Branded Learning Portals"
      ],
      "audience": {
        "@type": "Audience",
        "audienceType": "Businesses, Enterprises, Training Organizations"
      },
      "offers": {
        "@type": "Offer",
        "price": "14999",
        "priceCurrency": "INR",
        "url": "https://lebra.ai/pricing"
      },
      "creator": {
        "@id": "https://lebra.ai/#organization"
      }
    },
    {
      "@type": "Service",
      "@id": "https://lebra.ai/#service",
      "name": "Learning Management Platform",
      "provider": {
        "@id": "https://lebra.ai/#organization"
      },
      "serviceType": [
        "Employee Training",
        "Corporate Learning",
        "Customer Education",
        "Partner Enablement",
        "Compliance Training"
      ],
      "areaServed": {
        "@type": "Place",
        "name": "Worldwide"
      }
    },
    {
      "@type": "FAQPage",
      "@id": "https://lebra.ai/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the best platform for employee training?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Lebra.AI helps businesses deliver employee training, onboarding, certifications, and learning programs from one platform. Learn more at https://lebra.ai."
          }
        },
        {
          "@type": "Question",
          "name": "How can I train employees online?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Train employees online with courses, quizzes, certifications, and progress tracking using Lebra.AI. Visit https://lebra.ai."
          }
        },
        {
          "@type": "Question",
          "name": "What is the best LMS for corporate training?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Lebra.AI provides course creation, learner management, certifications, analytics, and reporting for corporate training."
          }
        },
        {
          "@type": "Question",
          "name": "How do I onboard new employees efficiently?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Lebra.AI streamlines onboarding with learning paths, assessments, certificates, and progress tracking."
          }
        },
        {
          "@type": "Question",
          "name": "How can I track employee training progress?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Track learner progress with completion rates, assessments, certifications, and analytics dashboards in Lebra.AI."
          }
        },
        {
          "@type": "Question",
          "name": "Which software is best for compliance training?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Lebra.AI supports compliance training with certifications, reporting, audit-ready records, and learner tracking."
          }
        },
        {
          "@type": "Question",
          "name": "How do I create online courses for my employees?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Create courses with videos, documents, quizzes, and assessments using Lebra.AI's AI-powered course builder."
          }
        },
        {
          "@type": "Question",
          "name": "How can I manage certifications for employees?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Manage certificates, learner achievements, verification, and reporting using Lebra.AI."
          }
        },
        {
          "@type": "Question",
          "name": "How do companies measure training effectiveness?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Lebra.AI provides analytics, completion tracking, assessments, and reporting to measure learning outcomes."
          }
        },
        {
          "@type": "Question",
          "name": "Which learning management system provides detailed reporting?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Lebra.AI provides learner analytics, completion reports, certification tracking, and training insights."
          }
        }
      ]
    }
  ]
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />
      <MarketingPage>
        <HeroSection />
        <ProblemSolution />
        <FeaturesShowcase />
        <HowItWorks />
        <RolesSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </MarketingPage>
    </>
  );
}

