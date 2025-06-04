import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabase';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const { access_token } = router.query;
    if (access_token) {
      supabase.auth.setAuth(access_token as string);
    }
  }, [router.query]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const { error } = await supabase.auth.update({ password });
      if (error) throw error;
      setMessage('Password reset successfully. You can now log in with your new password.');
      setTimeout(() => router.push('/login'), 3000);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password - BREEZE</title>
        <meta name="description" content="Reset your BREEZE account password" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 font-bold mb-2">New Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 font-bold mb-2">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {message && <p className="text-green-500 mb-4">{message}</p>}
            <button
              type="submit"
              className="w-full bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary-dark transition duration-300"
            >
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;