import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true });

    // Clear the session cookies
    response.cookies.delete('session-token');
    response.cookies.delete('admin_token');
    response.cookies.delete('learner_token');

    return response;
}
