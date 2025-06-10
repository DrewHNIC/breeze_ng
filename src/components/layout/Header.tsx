import React, { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-[#001A12] to-[#00281c] text-[#35604E] fixed w-full z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold">
            B R E E Z E
          </Link>
          <div className="hidden md:flex space-x-4">
            <Link href="/about" className="hover:text-[#F56F4F] transition duration-300">About</Link>
            <Link href="/contact" className="hover:text-[#F56F4F] transition duration-300">Contact</Link>
            <Link href="/faq" className="hover:text-[#F56F4F]">FAQ</Link>
            <Link href="/#join-community" className="hover:text-[#F56F4F]">Sign Up</Link>
            <Link href="/login" className="hover:text-[#F56F4F]">Login</Link>
            <button className="hover:text-[#F56F4F] transition duration-300">
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
        <div className="md:hidden bg-[#00281c]">
          <div className="container mx-auto px-4 py-2 space-y-2">
            <Link href="/about" className="block py-2 hover:text-[#F56F4F] transition duration-300">About</Link>
            <Link href="/contact" className="block py-2 hover:text-[#F56F4F] transition duration-300">Contact</Link>
            <Link href="/faq" className="block py-2 hover:text-[#F56F4F] transition duration-300">FAQ</Link>
            <Link href="/#join-community" className="block py-2 hover:text-[#F56F4F] transition duration-300">Sign Up</Link>
            <Link href="/login" className="block py-2 hover:text-[#F56F4F] transition duration-300">Login</Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
