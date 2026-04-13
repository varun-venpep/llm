import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = { width: 32, height: 32 };

export default async function Icon({ params }: { params: Promise<{ domain: string }> }) {
    const { domain } = await params;
    
    const tenant = await prisma.tenant.findUnique({
        where: { subdomain: domain }
    });

    if (!tenant?.branding?.favicon) {
        // Return a default icon if none set (e.g., a colored circle with first letter)
        return new ImageResponse(
            (
                <div
                    style={{
                        fontSize: 24,
                        background: 'black',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        borderRadius: '20%',
                    }}
                >
                    {domain[0].toUpperCase()}
                </div>
            ),
            { ...size }
        );
    }

    // If there is a favicon URL, we fetch it and return it
    // Note: In a production app, you might want to proxy the image data
    // for security and performance.
    return new ImageResponse(
        (
            <img 
                src={tenant.branding.favicon} 
                width="32" 
                height="32" 
                style={{ borderRadius: '20%' }}
            />
        ),
        { ...size }
    );
}
