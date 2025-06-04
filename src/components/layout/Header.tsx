import React, { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-black text-white fixed w-full z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold">
            B R E E Z E
          </Link>
          <div className="hidden md:flex space-x-4">
            <Link href="/about" className="hover:text-red-900 transition duration-300">About</Link>
            <Link href="/contact" className="hover:text-red-900 transition duration-300">Contact</Link>
            <Link href="/faq" className="hover:text-red-900">FAQ</Link>
            <Link href="/#join-community" className="hover:text-red-900">Sign Up</Link>
            <Link href="/login" className="hover:text-red-900">Login</Link>
            <button className="hover:text-red-900 transition duration-300">
              <Search size={20} />
            </button>
          </div>
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900">
          <div className="container mx-auto px-4 py-2">
            <Link href="/about" className="block py-2 hover:text-red-900 transition duration-300">About</Link>
            <Link href="/contact" className="block py-2 hover:text-red-900 transition duration-300">Contact</Link>
            <button className="block py-2 hover:text-red-900 transition duration-300">
              <Search size={20} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;