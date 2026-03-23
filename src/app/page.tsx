import { redirect } from 'next/navigation';

export default function RootPage() {
    // The middleware handles routing to /landing for the root domain,
    // but Next.js needs a page.tsx at the root to compile properly.
    redirect('/landing');
}
