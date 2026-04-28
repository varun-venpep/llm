import { NextRequest, NextResponse } from 'next/server';

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public (e.g. /favicon.ico)
         * 5. /verify (Public global certificate verification)
         */
        '/((?!api/|verify/|_next/|_static/|_vercel|uploads/|[\\w-]+\\.\\w+).*)',
    ],
};

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl;

    // 1. Get raw host header (e.g. admin.lvh.me:3000, venpep.lvh.me:3000)
    const hostHeader = req.headers.get('host');
    const forwardedHost = req.headers.get('x-forwarded-host');
    const rawHost = (forwardedHost || hostHeader || '').split(':')[0]; // Strip port

    // 2. The root domain is what we want to strip out to find the subdomain
    // E.g. "lvh.me:3000" or "localhost:3000" or "dev.lebra.ai"
    let rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'dev.lebra.ai';

    // 3. Normalize the hostname
    let hostname = rawHost.split(',')[0].trim();
    // Remove port if present, except for localhost mapping
    if (hostname.includes(':') && !hostname.includes('localhost')) {
        hostname = hostname.split(':')[0];
    }

    if (hostname.includes('.localhost:3000')) {
        hostname = hostname.replace('.localhost:3000', `.${rootDomain}`);
    }

    const searchParams = req.nextUrl.searchParams.toString();
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;

    console.log(`[Middleware] Raw Host: ${rawHost} | Root Domain: ${rootDomain} | Hostname: ${hostname}`);

    // --- AUTHENTICATION CHECKS ---
    const sessionToken = req.cookies.get('session-token')?.value;
    const isSuperAdminHost = hostname === `admin.${rootDomain}`;

    // 1. Super Admin Auth Guard
    // Only protect if on the admin subdomain OR on root domain it specifically starts with /admin
    const isSuperAdminPath = url.pathname.startsWith('/admin') && !url.pathname.endsWith('/login');
    if (isSuperAdminPath && (isSuperAdminHost || hostname === rootDomain)) {
        if (!sessionToken) {
            return NextResponse.redirect(new URL('/admin/login', req.url));
        }
    }

    // 2. Tenant Auth Guard (Dashboard or Admin)
    const isTenantSubdomain = hostname.endsWith(`.${rootDomain}`) && !isSuperAdminHost;

    // Check if the path is explicitly a tenant path (e.g., /t/abc/...)
    const isExplicitTenantPath = url.pathname.startsWith('/t/');
    const pathSubdomain = isExplicitTenantPath ? url.pathname.split('/')[2] : null;

    const isTenantArea = url.pathname.includes('/dashboard') ||
        (url.pathname.includes('/admin') && !url.pathname.startsWith('/admin')) ||
        (isTenantSubdomain && url.pathname.startsWith('/admin'));

    if (isTenantArea && !url.pathname.endsWith('/login')) {
        if (!sessionToken) {
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
    if (url.pathname.endsWith('/login') && sessionToken) {
        if (url.pathname.startsWith('/admin') && (isSuperAdminHost || hostname === rootDomain)) {
            return NextResponse.redirect(new URL('/admin', req.url));
        }

        // For tenants, check role via session API
        try {
            const isAuthRes = await fetch(`${req.nextUrl.origin}/api/auth/session`, {
                headers: { Cookie: `session-token=${sessionToken}` }
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
    if (hostname === rootDomain) {
        // Do NOT rewrite if the path starts with /admin, /api, /t/, or /login
        if (
            url.pathname.startsWith('/admin') ||
            url.pathname.startsWith('/api') ||
            url.pathname.startsWith('/t/') ||
            url.pathname.startsWith('/login') ||
            url.pathname.startsWith('/auth') ||
            url.pathname.startsWith('/landing')
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
