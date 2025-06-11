import React, { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-[#1A2026] to-[#232B33] text-[#872816] fixed w-full z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold font-wellingborough">
  S E R V I T U S
</Link>
          <div className="hidden md:flex space-x-4">
            {["about", "contact", "faq", "#join-community", "login"].map((path, i) => (
              <Link key={i} href={`/${path}`} className="hover:text-[#C4710B] transition duration-300 capitalize">
                {path.replace('#', '')}
              </Link>
            ))}
            <button className="hover:text-[#C4710B] transition duration-300">
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
        <div className="md:hidden bg-[#232B33]">
          <div className="container mx-auto px-4 py-2 space-y-2">
            {["About", "Contact", "Faq", "#Join-community", "Login"].map((path, i) => (
              <Link key={i} href={`/${path}`} className="block py-2 hover:text-[#C4710B] transition duration-300 capitalize">
                {path.replace('#', '')}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
