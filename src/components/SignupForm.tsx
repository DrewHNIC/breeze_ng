import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { supabase } from '../utils/supabase';

interface SignupFormProps {
  userType: 'customer' | 'vendor' | 'rider' | 'affiliate';
  gifSrc: string;
}

const SignupForm: React.FC<SignupFormProps> = ({ userType, gifSrc }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
  
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
  
      if (error) throw error;
  
      if (data.user) {
        // Add user details to the appropriate table based on user type
        const { error: profileError } = await supabase
          .from(userType + 's')
          .insert([{ id: data.user.id, name: formData.name, email: formData.email }]);
  
        if (profileError) throw profileError;
  
        setError('Signup successful! Please check your email to confirm your account.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      <div className="w-1/2 bg-primary flex items-center justify-center">
        <Image src={gifSrc || "/placeholder.svg"} alt={`${userType} signup`} width={400} height={400} />
      </div>
      <div className="w-1/2 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6 text-center text-primary">Sign Up as {userType.charAt(0).toUpperCase() + userType.slice(1)}</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-black font-bold mb-2">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:none focus:border-black"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-black font-bold mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:none focus:border-black"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-black font-bold mb-2">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:none focus:border-black"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-black font-bold mb-2">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:none focus:border-black"
                required
              />
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <button
              type="submit"
              className="w-full bg-black text-white font-bold py-2 px-4 rounded-md hover:bg-primary-dark transition duration-300"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;