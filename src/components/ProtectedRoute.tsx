import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ProtectedRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);

            supabase.auth.onAuthStateChange((_event, session) => {
                setIsAuthenticated(!!session);
            });
        };
        checkAuth();
    }, []);

    if (isAuthenticated === null) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>; // Loading state
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
