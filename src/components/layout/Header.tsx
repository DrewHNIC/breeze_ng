import React, { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-[#1D1D27] text-[#70452F] fixed w-full z-10 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold">
            B R E E Z E
          </Link>
          <div className="hidden md:flex space-x-4">
            {["/about", "/contact", "/faq", "/#join-community", "/login"].map((href, i) => (
              <Link key={i} href={href} className="hover:text-[#CCA281] transition duration-300 capitalize">
                {href.includes("#") ? "Sign Up" : href.replace("/", "")}
              </Link>
            ))}
            <button className="hover:text-[#CCA281] transition duration-300">
              <Search size={20} />
            </button>
          </div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-[#2D2D3A]">
          <div className="container mx-auto px-4 py-2 space-y-2">
            {["/about", "/contact", "/faq", "/#join-community", "/login"].map((href, i) => (
              <Link key={i} href={href} className="block py-2 hover:text-[#CCA281] transition duration-300">
                {href.includes("#") ? "Sign Up" : href.replace("/", "")}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
