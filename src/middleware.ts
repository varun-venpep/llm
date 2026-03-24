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

    // Super Admin check
    if (hostname === `admin.${rootDomain}`) {
        return NextResponse.rewrite(new URL(`/admin${path}`, req.url));
    }

    // Root domain check (Platform Landing Page)
    if (hostname === rootDomain) {
        // Do NOT rewrite if the path starts with /admin, /api, or /t/
        if (
            url.pathname.startsWith('/admin') ||
            url.pathname.startsWith('/api') ||
            url.pathname.startsWith('/t/')
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

    // Custom Domain logic
    // Here we would lookup the hostname in our DB. 
    // For the MVP, we'll rewrite to a special /custom-domain path or handle it via a query param.
    // Actually, rewriting to /t/[tenantId] where tenantId is looked up from custom domain is best.
    // For now, let's assume it's mapped.
    return NextResponse.rewrite(new URL(`/t/${hostname}${path}`, req.url));
}
