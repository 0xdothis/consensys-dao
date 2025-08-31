"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage({ onWalletConnect }: { onWalletConnect: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-start">
      {/* NAVBAR */}
      <nav className="fixed w-full p-4 shadow-2xl bg-purple-950 top-0 left-0 flex items-center justify-between z-50">
        {/* Logo */}
        <div>
          <h2 className="text-lg font-bold text-white">DAO Lending</h2>
        </div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex gap-6 text-white font-medium">
          <li>
            <Link href="/blog">Blog</Link>
          </li>
          <li>
            <Link href="/about">About Us</Link>
          </li>
          <li>
            <Link href="/contact">Contact Us</Link>
          </li>
        </ul>

        {/* Connect Wallet */}
        <button
          onClick={onWalletConnect}
          className="md:px-4 py-2 text-xs md:text-sm px-2 rounded-lg font-bold bg-white text-purple-700 cursor-pointer hover:bg-gray-100 transition"
        >
          Connect Wallet
        </button>

        {/* Hamburger (mobile only) */}
        <button
          className="md:hidden flex flex-col gap-1 ml-4"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="w-6 h-0.5 bg-white"></span>
          <span className="w-6 h-0.5 bg-white"></span>
          <span className="w-6 h-0.5 bg-white"></span>
        </button>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="absolute top-16 left-0 w-full bg-purple-900 flex flex-col items-center py-4 gap-4 md:hidden">
            <Link
              href="/blog"
              onClick={() => setMenuOpen(false)}
              className="text-white"
            >
              Blog
            </Link>
            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="text-white"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="text-white"
            >
              Contact Us
            </Link>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <header className="w-full flex flex-col justify-center items-center text-center bg-purple-100 mt-16 py-20 px-6">
        <h1 className="text-4xl md:text-6xl font-bold text-purple-900">
          Community-Powered Lending
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl">
          DAO Lending is a decentralized protocol that empowers communities to
          provide, manage, and access transparent loans with trust and security.
        </p>
        <button
          onClick={onWalletConnect}
          className="mt-6 px-6 py-3 bg-purple-700 text-white font-bold rounded-lg shadow hover:bg-purple-800"
        >
          Get Started
        </button>
      </header>

      {/* ABOUT SECTIONS */}
      <section className="w-full max-w-6xl px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold text-purple-900 mb-4">
            Why DAO Lending?
          </h2>
          <p className="text-gray-600 leading-relaxed">
            We believe in democratizing access to capital. DAO Lending lets
            communities govern lending pools, ensuring fairness, transparency,
            and inclusivity in financial systems.
          </p>
        </div>
        <Image
          src="/illustration-one.jpg"
          alt="Why DAO"
          width={500}
          height={400}
          className="rounded-2xl shadow"
        />
      </section>

      <section className="w-full max-w-6xl px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <Image
          src="/illustration-two.jpg"
          alt="How it works"
          width={500}
          height={400}
          className="rounded-2xl shadow"
        />
        <div>
          <h2 className="text-3xl font-bold text-purple-900 mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Lenders and borrowers interact directly via smart contracts.
            Community governance ensures the protocol evolves fairly, rewarding
            participants who help maintain stability and trust.
          </p>
        </div>
      </section>

      {/* SPONSORS SECTION */}
      <section className="w-full bg-gray-100 py-12">
        <h2 className="text-2xl font-bold text-center text-purple-900 mb-8">
          Backed By
        </h2>
        <div className="relative w-full overflow-hidden">
          <div className="flex gap-12 animate-scroll">
            {[
              "lisk.png",
              "base.jpeg",
              "ens.webp",
              "filecoin.png",
              "protocol.png",
              "sybmbiotic.png",
            ].map((logo, idx) => (
              <div
                key={idx}
                className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-md"
              >
                <Image
                  src={`/${logo}`}
                  alt="Sponsor Logo"
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
              </div>
            ))}

            {/* Duplicate logos for seamless infinite scroll */}
            {[
              "lisk.png",
              "base.jpeg",
              "ens.webp",
              "filecoin.png",
              "protocol.png",
              "sybmbiotic.png",
            ].map((logo, idx) => (
              <div
                key={`dup-${idx}`}
                className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-md"
              >
                <Image
                  src={`/${logo}`}
                  alt="Sponsor Logo"
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tailwind Custom Animation */}
      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          display: flex;
          width: max-content;
          animation: scroll 20s linear infinite;
        }
      `}</style>

      {/* WHAT WE OFFER */}
      <section className="w-full max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-purple-900">
          What We Offer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Community Governance",
              desc: "DAO members decide how lending pools evolve, ensuring fair and democratic financial access.",
            },
            {
              title: "Secure Smart Contracts",
              desc: "Borrowing and lending are powered by transparent and audited smart contracts.",
            },
            {
              title: "Reward Participation",
              desc: "Earn rewards by contributing liquidity and participating in governance decisions.",
            },
          ].map((offer, idx) => (
            <div
              key={idx}
              className="bg-white shadow-lg rounded-2xl p-6 text-center hover:shadow-2xl transition"
            >
              <Image
                src="/avatar-three.jpg"
                alt={offer.title}
                width={200}
                height={200}
                className="mx-auto mb-4 rounded-xl object-cover"
              />
              <h3 className="font-semibold text-lg mb-2">{offer.title}</h3>
              <p className="text-gray-600 text-sm">{offer.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM SECTION */}
      <section className="w-full max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-purple-900">
          Meet the Team
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {[
            {
              name: "Sherif",
              role: "Frontend Engineer",
              img: "/avatar-four.jpg",
            },
            {
              name: "Thompson",
              role: "Frontend Engineer",
              img: "/avatar-two.jpg",
            },
            {
              name: "Daniel",
              role: "Smart Contract Dev",
              img: "/avatar-three.jpg",
            },
            {
              name: "Ibrahim",
              role: "Smart Contract Dev",
              img: "/avatar-one.jpg",
            },
          ].map((member, idx) => (
            <div
              key={idx}
              className="bg-white shadow-lg rounded-2xl p-6 text-center hover:shadow-2xl transition"
            >
              <Image
                src={member.img}
                alt={member.name}
                width={120}
                height={120}
                className="rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="font-semibold text-lg">{member.name}</h3>
              <p className="text-gray-500 text-sm">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIALS SECTION */}
      <section className="w-full max-w-4xl px-6 py-12 text-center">
        <h2 className="text-2xl font-bold mb-6 text-purple-900">Follow Us</h2>
        <div className="flex justify-center gap-6">
          <Link
            href="#"
            className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-full text-purple-700 text-xl"
          >
            X
          </Link>
          <Link
            href="#"
            className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-full text-purple-700 text-xl"
          >
            in
          </Link>
          <Link
            href="#"
            className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-full text-purple-700 text-xl"
          >
            IG
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-purple-950 text-white py-6 text-center mt-10">
        <p>© 2025 DAO Lending. All rights reserved.</p>
      </footer>
    </div>
  );
}
