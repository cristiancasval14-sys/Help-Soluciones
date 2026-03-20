'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/Sidebar";
import { AuthGuard } from "@/components/AuthGuard";

import { AppDatabase } from "@/lib/database";

export function AppContentWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname?.startsWith('/auth');

    React.useEffect(() => {
        AppDatabase.init();
    }, []);

    return (
        <AuthGuard>
            <div className="app-container">
                {!isAuthPage && <Sidebar />}
                <main className={!isAuthPage ? "main-content" : "auth-content"}>
                    {children}
                </main>
            </div>
            <style jsx>{`
                .auth-content {
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
            `}</style>
        </AuthGuard>
    );
}
