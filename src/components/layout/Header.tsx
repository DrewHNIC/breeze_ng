"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuLinks = [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Join Community", href: "#join-community" },
    { label: "Login", href: "/login" },
  ]

  return (
    <header className="bg-gradient-to-r from-[#b9c6c8] to-[#1d2c36] text-[#1d2c36] fixed w-full z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link
            href="/"
            className="text-2xl font-bold font-logo tracking-wider hover:text-[#b9c6c8] transition duration-300"
            style={{ letterSpacing: "0.2em" }}
          >
            B R E E Z E
          </Link>

          <div className="hidden md:flex space-x-4 font-logo">
            {menuLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="hover:text-[#b9c6c8] transition duration-300 capitalize"
              >
                {label}
              </Link>
            ))}
            <button className="hover:text-[#b9c6c8] transition duration-300">
              <Search size={20} />
            </button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-gradient-to-br from-[#b9c6c8] to-[#2a3a4d]">
          <div className="container mx-auto px-4 py-2 space-y-2">
            {menuLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 hover:text-[#8f8578] transition duration-300 capitalize"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
