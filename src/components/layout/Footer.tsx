import React from 'react';
import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-b from-[#C4710B] to-[#872816] text-[#1A2026] py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h3 className="text-2xl font-bold font-logo mb-2">BREEZE</h3>
            <p className="text-sm">Making food delivery as simple as can be.</p>
          </div>
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h4 className="text-lg font-semibold font-logo mb-2">Quick Links</h4>
            <ul className="text-sm text-white">
              {["home", "about", "contact", "faq", "terms-of-service", "privacy-policy"].map((page, i) => (
                <li key={i} className="mb-1">
                  <Link href={`/${page === "home" ? "" : page}`} className="hover:text-[#1A2026]">
                    {page.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-1/3">
            <h4 className="text-lg font-semibold font-logo mb-2">Connect With Us</h4>
            <div className="flex space-x-4">
              {[FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1A2026] text-[#C4710B] hover:bg-[#C4710B] hover:text-white transition duration-300"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-white">
          <p>&copy; {new Date().getFullYear()} BREEZE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
