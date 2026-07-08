import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true });

    // Clear the session cookies
    response.cookies.set('session-token', '', {
        maxAge: 0,
        path: '/'
    });
    response.cookies.set('admin_token', '', {
        maxAge: 0,
        path: '/'
    });
    response.cookies.set('learner_token', '', {
        maxAge: 0,
        path: '/'
    });

    return response;
}
