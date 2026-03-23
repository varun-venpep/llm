export default async function TenantPage({ params }: { params: Promise<{ domain: string }> }) {
    const resolvedParams = await params;
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold">Client Workspace: {resolvedParams.domain}</h1>
            <p className="mt-4 text-xl">Manage your courses and students here.</p>
        </div>
    );
}
