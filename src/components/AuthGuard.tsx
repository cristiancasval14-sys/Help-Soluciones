'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        // Exclude auth routes from the guard
        if (pathname.startsWith('/auth')) {
            setIsAuthorized(true);
            return;
        }

        const checkAuth = () => {
            const session = localStorage.getItem('help_session');
            if (!session) {
                setIsAuthorized(false);
                router.push('/auth/login');
            } else {
                setIsAuthorized(true);
            }
        };

        checkAuth();
        
        // Listen for storage changes (optional, but good for multi-tab)
        const handleStorage = () => checkAuth();
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [pathname, router]);

    if (isAuthorized === null) {
        return (
            <div style={{ 
                height: '100vh', 
                width: '100vw', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'var(--background)',
                color: 'var(--text-main)'
            }}>
                <div className="loading-spinner"></div>
                <style jsx>{`
                    .loading-spinner {
                        width: 40px;
                        height: 40px;
                        border: 3px solid rgba(37, 99, 235, 0.1);
                        border-top: 3px solid var(--primary);
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (isAuthorized === false && !pathname.startsWith('/auth')) {
        return null; // Will redirect shortly
    }

    return <>{children}</>;
}
