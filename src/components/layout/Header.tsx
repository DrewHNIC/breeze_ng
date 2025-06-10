// src/components/layout/Header.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-[#041915] text-[#1E493D] fixed w-full z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold text-[#1E493D]">
            B R E E Z E
          </Link>
          <div className="hidden md:flex space-x-4">
            {["about", "contact", "faq", "#join-community", "login"].map((page, index) => (
              <Link
                key={index}
                href={`/${page === "#join-community" ? "" : page}`}
                className="hover:text-[#BF8C73] transition duration-300"
              >
                {page === "#join-community" ? "Sign Up" : page.charAt(0).toUpperCase() + page.slice(1)}
              </Link>
            ))}
            <button className="hover:text-[#BF8C73] transition duration-300">
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
        <div className="md:hidden bg-[#0a2e26]">
          <div className="container mx-auto px-4 py-2 space-y-2">
            {["about", "contact", "faq", "#join-community", "login"].map((page, index) => (
              <Link
                key={index}
                href={`/${page === "#join-community" ? "" : page}`}
                className="block py-2 hover:text-[#BF8C73] transition duration-300"
              >
                {page === "#join-community" ? "Sign Up" : page.charAt(0).toUpperCase() + page.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
