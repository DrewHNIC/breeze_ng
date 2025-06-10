// src/components/layout/Header.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-[#141421] to-[#0A5784] text-white fixed w-full z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold">
            B R E E Z E
          </Link>
          <div className="hidden md:flex space-x-4">
            {['About', 'Contact', 'FAQ', 'Sign Up', 'Login'].map((label, index) => (
              <Link
                key={index}
                href={`/${label.toLowerCase().replace(' ', '-')}`}
                className="hover:text-[#f15152] transition duration-300"
              >
                {label}
              </Link>
            ))}
            <button className="hover:text-[#f15152] transition duration-300">
              <Search size={20} />
            </button>
          </div>
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-[#0A5784]">
          <div className="container mx-auto px-4 py-2 space-y-2">
            {['About', 'Contact', 'FAQ', 'Sign Up', 'Login'].map((label, index) => (
              <Link
                key={index}
                href={`/${label.toLowerCase().replace(' ', '-')}`}
                className="block py-2 hover:text-[#f15152] transition duration-300"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
