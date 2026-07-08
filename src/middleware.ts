import { NextRequest, NextResponse } from 'next/server';

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public (e.g. /favicon.ico)
         * 5. marketing assets copied from the website project
         * 6. /verify (Public global certificate verification)
         */
        '/((?!api/|verify/|_next/|_static/|_vercel|uploads/|marketing-assets/|[\\w-]+\\.\\w+).*)',
    ],
};

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl;

    // Normalize explicit /t/[domain] paths to lowercase to avoid DB query casing mismatches
    if (url.pathname.startsWith('/t/')) {
        const pathSegments = url.pathname.split('/');
        const rawDomain = pathSegments[2];
        if (rawDomain && rawDomain !== rawDomain.toLowerCase()) {
            const newPathname = url.pathname.replace(`/t/${rawDomain}`, `/t/${rawDomain.toLowerCase()}`);
            return NextResponse.redirect(new URL(newPathname + url.search, req.url));
        }
    }

    // 1. Get raw host header (e.g. admin.lvh.me:3000, venpep.lvh.me:3000)
    const hostHeader = req.headers.get('host');
    const forwardedHost = req.headers.get('x-forwarded-host');
    const rawHost = (forwardedHost || hostHeader || '').split(':')[0]; // Strip port

    // 2. The root domain is what we want to strip out to find the subdomain
    // E.g. "lvh.me:3000" or "localhost:3000" or "dev.lebra.ai"
    const configuredRootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'dev.lebra.ai';
    let rootDomain = configuredRootDomain.split(':')[0];

    // Auto-detect local development environments (localhost, lvh.me)
    if (rawHost.endsWith('.localhost') || rawHost === 'localhost') {
        rootDomain = 'localhost';
    } else if (rawHost.endsWith('.lvh.me') || rawHost === 'lvh.me') {
        rootDomain = 'lvh.me';
    }

    // 3. Normalize the hostname
    let hostname = rawHost.split(',')[0].trim();
    // Remove port if present, except for localhost mapping
    if (hostname.includes(':') && !hostname.includes('localhost')) {
        hostname = hostname.split(':')[0];
    }

    if (hostname.includes(`.${configuredRootDomain}`)) {
        hostname = hostname.replace(`.${configuredRootDomain}`, `.${rootDomain}`);
    }

    const searchParams = req.nextUrl.searchParams.toString();
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isRootHost = hostname === rootDomain || isLocalhost;

    console.log(`[Middleware] Raw Host: ${rawHost} | Root Domain: ${rootDomain} | Hostname: ${hostname}`);

    // --- AUTHENTICATION CHECKS ---
    const adminToken = req.cookies.get('admin_token')?.value || req.cookies.get('session-token')?.value;
    const learnerToken = req.cookies.get('learner_token')?.value || req.cookies.get('session-token')?.value;
    const isSuperAdminHost = hostname === `admin.${rootDomain}`;

    // 1. Super Admin Auth Guard
    // Only protect if on the admin subdomain OR on root domain it specifically starts with /admin
    const isSuperAdminPath = url.pathname.startsWith('/admin') && !url.pathname.endsWith('/login');
    if (isSuperAdminPath && (isSuperAdminHost || isRootHost)) {
        if (!adminToken) {
            return NextResponse.redirect(new URL('/admin/login', req.url));
        }
    }

    // 2. Tenant Auth Guard (Dashboard or Admin)
    const isTenantSubdomain = hostname.endsWith(`.${rootDomain}`) && !isSuperAdminHost;

    // Check if the path is explicitly a tenant path (e.g., /t/abc/...)
    const isExplicitTenantPath = url.pathname.startsWith('/t/');
    const pathSubdomain = isExplicitTenantPath ? url.pathname.split('/')[2] : null;

    const isAdminArea = (url.pathname.includes('/admin') && !url.pathname.startsWith('/admin')) ||
        (isTenantSubdomain && url.pathname.startsWith('/admin'));
    const isLearnerArea = url.pathname.includes('/dashboard') ||
        url.pathname.includes('/course') ||
        url.pathname.includes('/achievements');

    if ((isAdminArea || isLearnerArea) && !url.pathname.endsWith('/login')) {
        const requiredToken = isLearnerArea ? (learnerToken || adminToken) : adminToken;
        if (!requiredToken) {
            let redirectUrl = '/login';
            if (isTenantSubdomain) {
                redirectUrl = `/login`;
            } else if (pathSubdomain) {
                redirectUrl = `/t/${pathSubdomain}/login`;
            } else {
                const subdomain = hostname.replace(`.${rootDomain}`, '');
                redirectUrl = `/t/${subdomain}/login`;
            }
            return NextResponse.redirect(new URL(redirectUrl, req.url));
        }
    }

    // 3. Login-to-Dashboard Auto-Jump (Redirect AWAY from login if already authenticated)
    if (url.pathname.endsWith('/login') && url.searchParams.get('forceLogin') !== '1') {
        const isSuperAdminLogin = url.pathname.startsWith('/admin') && (isSuperAdminHost || isRootHost);
        const activeToken = isSuperAdminLogin ? adminToken : (adminToken || learnerToken);
        const cookieName = activeToken === adminToken ? 'admin_token' : 'learner_token';

        if (activeToken) {
            if (isSuperAdminLogin) {
                return NextResponse.redirect(new URL('/admin', req.url));
            }

            // For tenants, check role via session API
            try {
                const portalName = activeToken === adminToken ? 'admin' : 'learner';
                const isAuthRes = await fetch(`${req.nextUrl.origin}/api/auth/session?portal=${portalName}`, {
                    headers: { Cookie: `${cookieName}=${activeToken}` }
                });

                if (isAuthRes.ok) {
                    const { user } = await isAuthRes.json();
                    const targetSubdomain = pathSubdomain || (isTenantSubdomain ? hostname.replace(`.${rootDomain}`, '') : 'varun');

                    if (user.role === 'LEARNER') {
                        return NextResponse.redirect(new URL(`/t/${targetSubdomain}/dashboard`, req.url));
                    } else {
                        return NextResponse.redirect(new URL(`/t/${targetSubdomain}/admin`, req.url));
                    }
                }
            } catch (e) {
                // Fallback to basic dashboard if API check fails
                return NextResponse.next();
            }
        }
    }

    // Super Admin Subdomain (e.g., admin.llm.com)
    if (isSuperAdminHost) {
        // Do NOT rewrite if the path starts with /t/ or /api/t/
        if (url.pathname.startsWith('/t/') || url.pathname.startsWith('/api/t/')) {
            return NextResponse.next();
        }

        // Avoid double /admin prefix if user already included it in URL
        const targetPath = url.pathname.startsWith('/admin') ? path : `/admin${path}`;
        return NextResponse.rewrite(new URL(targetPath, req.url));
    }

    // Root domain check (Platform Landing Page)
    if (isRootHost) {
        // Do NOT rewrite if the path starts with /admin, /api, /t/, or /login
        if (
            url.pathname.startsWith('/admin') ||
            url.pathname.startsWith('/api') ||
            url.pathname.startsWith('/t/') ||
            url.pathname.startsWith('/login') ||
            url.pathname.startsWith('/auth') ||
            url.pathname.startsWith('/landing') ||
            url.pathname.startsWith('/features') ||
            url.pathname.startsWith('/pricing') ||
            url.pathname.startsWith('/contact')
        ) {
            return NextResponse.next();
        }
        return NextResponse.rewrite(new URL(`/landing${path}`, req.url));
    }

    // Subdomain check (Tenant Workspaces)
    if (hostname.endsWith(`.${rootDomain}`)) {
        const subdomain = hostname.replace(`.${rootDomain}`, '');

        // If the path already starts with /t/[subdomain], don't rewrite it again
        if (url.pathname.startsWith(`/t/${subdomain}`)) {
            return NextResponse.next();
        }

        return NextResponse.rewrite(new URL(`/t/${subdomain}${path}`, req.url));
    }

    // Final fallback rewrite
    if (url.pathname.startsWith(`/t/${hostname}`)) {
        return NextResponse.next();
    }

    return NextResponse.rewrite(new URL(`/t/${hostname}${path}`, req.url));
}
