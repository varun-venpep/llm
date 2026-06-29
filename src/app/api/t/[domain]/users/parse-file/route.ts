import { NextRequest, NextResponse } from 'next/server';
import { checkSession } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;

        // Check user session
        const session = await checkSession(req, domain);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ error: 'No file received' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            return NextResponse.json({ error: 'The uploaded file is empty' }, { status: 400 });
        }

        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: 'The uploaded file contains no data' }, { status: 400 });
        }

        // Get headers from first row and normalize them
        const headers = (rows[0] as any[]).map(h => String(h || '').trim());
        const requiredHeaders = ['Full Name', 'Email Address', 'Assigned Roles', 'Assigned Teams'];

        // Find missing headers (case-insensitive check)
        const missingHeaders = requiredHeaders.filter(reqHeader => 
            !headers.some(h => h.toLowerCase() === reqHeader.toLowerCase())
        );

        if (missingHeaders.length > 0) {
            return NextResponse.json({
                error: `Invalid file format. The file must contain these exact columns: ${requiredHeaders.join(', ')}. Missing columns: ${missingHeaders.join(', ')}`
            }, { status: 400 });
        }

        // Map column indexes
        const fullNameIdx = headers.findIndex(h => h.toLowerCase() === 'full name');
        const emailIdx = headers.findIndex(h => h.toLowerCase() === 'email address');
        const rolesIdx = headers.findIndex(h => h.toLowerCase() === 'assigned roles');
        const teamsIdx = headers.findIndex(h => h.toLowerCase() === 'assigned teams');

        const users: any[] = [];
        
        // Parse rows skipping header
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i] as any[];
            if (!row || row.length === 0) continue;

            const name = String(row[fullNameIdx] || '').trim();
            const email = String(row[emailIdx] || '').trim();
            const role = String(row[rolesIdx] || '').trim();
            const teams = String(row[teamsIdx] || '').trim();

            // Only add rows that have at least name or email
            if (name || email) {
                users.push({
                    name,
                    email,
                    role,
                    teams
                });
            }
        }

        if (users.length === 0) {
            return NextResponse.json({ error: 'No user records found in the uploaded file' }, { status: 400 });
        }

        return NextResponse.json({ users });

    } catch (error: any) {
        console.error('Parse file error:', error);
        return NextResponse.json({ error: error.message || 'Failed to parse file' }, { status: 500 });
    }
}
