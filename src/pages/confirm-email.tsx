import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabase';

const ConfirmEmail: React.FC = () => {
  const [message, setMessage] = useState('Confirming your email...');
  const router = useRouter();

  useEffect(() => {
    const confirmEmail = async () => {
      const { token_hash, type } = router.query;

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token_hash as string,
          type: type as 'signup' | 'recovery' | 'email_change' | 'invite',
        });

        if (error) {
          setMessage('Error confirming email. Please try again.');
        } else {
          setMessage('Email confirmed successfully! You can now log in.');
          setTimeout(() => router.push('/login'), 3000);
        }
      }
    };

    confirmEmail();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Email Confirmation</h1>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default ConfirmEmail;