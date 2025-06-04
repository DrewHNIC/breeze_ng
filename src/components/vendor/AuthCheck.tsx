// components/vendor/AuthCheck.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/utils/supabase';
import { Loader } from 'lucide-react';

interface AuthCheckProps {
  children: React.ReactNode;
}

const AuthCheck: React.FC<AuthCheckProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        router.push('/login');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null;
  }

  return <>{children}</>;
};

export default AuthCheck;