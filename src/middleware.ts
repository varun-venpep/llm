import { NextRequest, NextResponse } from 'next/server';

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public (e.g. /favicon.ico)
         */
        '/((?!api/|_next/|_static/|_vercel|uploads/|[\\w-]+\\.\\w+).*)',
    ],
};

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl;

    // 1. Get raw host header (e.g. admin.lvh.me:3000, venpep.lvh.me:3000)
    const rawHost = req.headers.get('host')!;

    // 2. The root domain is what we want to strip out to find the subdomain
    // E.g. "lvh.me:3000" or "localhost:3000"
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

    // 3. Normalize the hostname (mostly for localhost mapping in simple dev environments)
    let hostname = rawHost;
    if (hostname.includes('.localhost:3000')) {
        hostname = hostname.replace('.localhost:3000', `.${rootDomain}`);
    }

    const searchParams = req.nextUrl.searchParams.toString();
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;

    console.log(`[Middleware] Raw Host: ${rawHost} | Root Domain: ${rootDomain} | Hostname: ${hostname}`);

    // --- AUTHENTICATION CHECKS ---
    const sessionToken = req.cookies.get('session-token')?.value;

    // 1. Super Admin Auth Guard
    if (url.pathname.startsWith('/admin') && !url.pathname.endsWith('/login')) {
        if (!sessionToken) {
            return NextResponse.redirect(new URL('/admin/login', req.url));
        }
    }

    // 2. Tenant Auth Guard (Dashboard or Admin)
    const isTenantArea = url.pathname.includes('/dashboard') ||
        (url.pathname.includes('/admin') && !url.pathname.startsWith('/admin'));

    if (isTenantArea && !url.pathname.endsWith('/login')) {
        if (!sessionToken) {
            const redirectUrl = url.pathname.startsWith('/t/')
                ? `/t/${url.pathname.split('/')[2]}/login`
                : '/login';
            return NextResponse.redirect(new URL(redirectUrl, req.url));
        }
    }

    // 3. Login-to-Dashboard Auto-Jump (Redirect AWAY from login if already authenticated)
    if (url.pathname.endsWith('/login') && sessionToken) {
        if (url.pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/admin', req.url));
        }

        // For tenants, check role via session API
        try {
            const isAuthRes = await fetch(`${req.nextUrl.origin}/api/auth/session`, {
                headers: { Cookie: `session-token=${sessionToken}` }
            });

            if (isAuthRes.ok) {
                const { user } = await isAuthRes.json();
                const targetSubdomain = url.pathname.startsWith('/t/') ? url.pathname.split('/')[2] : 'varun';

                if (user.role === 'STUDENT') {
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
    if (hostname === `admin.${rootDomain}`) {
        return NextResponse.rewrite(new URL(`/admin${path}`, req.url));
    }

    // Root domain check (Platform Landing Page)
    if (hostname === rootDomain) {
        // Do NOT rewrite if the path starts with /admin, /api, /t/, or /login
        if (
            url.pathname.startsWith('/admin') ||
            url.pathname.startsWith('/api') ||
            url.pathname.startsWith('/t/') ||
            url.pathname.startsWith('/login')
        ) {
            return NextResponse.next();
        }
        return NextResponse.rewrite(new URL(`/landing${path}`, req.url));
    }

    // Subdomain check (Tenant Workspaces)
    if (hostname.endsWith(`.${rootDomain}`)) {
        const subdomain = hostname.replace(`.${rootDomain}`, '');
        return NextResponse.rewrite(new URL(`/t/${subdomain}${path}`, req.url));
    }

    return NextResponse.rewrite(new URL(`/t/${hostname}${path}`, req.url));
}
