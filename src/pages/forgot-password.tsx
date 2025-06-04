import React, { useState } from 'react';
import Head from 'next/head';
import { supabase } from '../utils/supabase';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const { error } = await supabase.auth.api.resetPasswordForEmail(email);
      if (error) throw error;
      setMessage('Password reset email sent. Check your inbox.');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password - BREEZE</title>
        <meta name="description" content="Reset your BREEZE account password" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-black font-bold mb-2">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-black"
                required
              />
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {message && <p className="text-green-500 mb-4">{message}</p>}
            <button
              type="submit"
              className="w-full bg-black text-white font-bold py-2 px-4 rounded-md hover:bg-primary-dark transition duration-300"
            >
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;