import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../utils/supabase';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    try {
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  
      if (signInError) throw signInError;
      if (user) {
        // Check user type and redirect accordingly
        const { data: vendor } = await supabase.from('vendors').select('*').eq('id', user.id).single();
        
        if (vendor) {
          router.push('/vendor/dashboard');
        } else {
          // Check other user types and redirect accordingly
          const { data: customer } = await supabase.from('customers').select('*').eq('id', user.id).single();
          const { data: rider } = await supabase.from('riders').select('*').eq('id', user.id).single();
          const { data: affiliate } = await supabase.from('affiliates').select('*').eq('id', user.id).single();
  
          if (customer) router.push('/customer/home');
          else if (rider) router.push('/rider/home');
          else if (affiliate) router.push('/affiliate/dashboard');
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  return (
    <>
      <Head>
        <title>Login - BREEZE</title>
        <meta name="description" content="Log in to your BREEZE account" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex min-h-screen bg-gradient-to-r from-black to-white p-12">
        <div className="w-1/2 bg-black flex items-center justify-center">
          <Image src="/login.gif" alt="Login" width={400} height={400} />
        </div>
        <div className="w-1/2 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-3xl font-bold mb-6 text-center text-primary">Log In to BREEZE</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-white-700 font-bold mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-primary"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="password" className="block text-white-700 font-bold mb-2">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-primary"
                  required
                />
              </div>
              {error && <p className="text-red-500 mb-4">{error}</p>}
              <button
                type="submit"
                className="w-full bg-black text-white font-bold py-2 px-4 rounded-md hover:bg-primary-dark transition duration-300"
              >
                Log In
              </button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;