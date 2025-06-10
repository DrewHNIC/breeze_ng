// src/components/layout/Header.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-[#1A2026] to-[#872816] text-white fixed w-full z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold text-[#C4710B]">
            B R E E Z E
          </Link>
          <div className="hidden md:flex space-x-4 text-[#F4D2BD]">
            <Link href="/about" className="hover:text-[#C4710B] transition duration-300">About</Link>
            <Link href="/contact" className="hover:text-[#C4710B] transition duration-300">Contact</Link>
            <Link href="/faq" className="hover:text-[#C4710B]">FAQ</Link>
            <Link href="/#join-community" className="hover:text-[#C4710B]">Sign Up</Link>
            <Link href="/login" className="hover:text-[#C4710B]">Login</Link>
            <button className="hover:text-[#C4710B] transition duration-300">
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
        <div className="md:hidden bg-[#1A2026]">
          <div className="container mx-auto px-4 py-2 space-y-2 text-[#F4D2BD]">
            <Link href="/about" className="block py-2 hover:text-[#C4710B]">About</Link>
            <Link href="/contact" className="block py-2 hover:text-[#C4710B]">Contact</Link>
            <Link href="/faq" className="block py-2 hover:text-[#C4710B]">FAQ</Link>
            <Link href="/#join-community" className="block py-2 hover:text-[#C4710B]">Sign Up</Link>
            <Link href="/login" className="block py-2 hover:text-[#C4710B]">Login</Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
