import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Image from 'next/image';

interface TeamMember {
  id: number;
  name: string;
  position: string;
  image: string;
}

const AboutUs: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch('/api/team-members');
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };

    fetchTeamMembers();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>About Us - BREEZE</title>
        <meta name="description" content="Learn about BREEZE - Revolutionizing Food Delivery" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[50vh]">
          <Image
            src="/about-hero.jpg"
            alt="BREEZE Team"
            layout="fill"
            objectFit="cover"
            quality={100}
          />
          <div className="absolute inset-0 bg-[#111] bg-opacity-900 flex items-center justify-center">
            <h1 className="text-5xl font-bold text-white">About BREEZE</h1>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8 text-white">Our Story</h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg mb-4 text-gray-400">
                BREEZE was born out of a simple yet powerful idea: to revolutionize the food delivery industry by creating a platform that truly cares for all its stakeholders - customers, vendors, riders, and affiliates.
              </p>
              <p className="text-lg mb-4 text-gray-400">
                Founded in 2025 by Achir Andrew Luper, a young entrepreneur with a vision to transform the way people experience food delivery, BREEZE quickly grew from a local startup to a game-changer in the industry.
              </p>
              <p className="text-lg text-gray-400">
                Our journey began with a commitment to fairness, efficiency, and customer satisfaction. We&apos;ve since grown into a platform that not only delivers great food but also fosters a community of food lovers, hard-working vendors, dedicated riders, and passionate affiliates.
              </p>
            </div>
          </div>
        </section>

        {/* Our Mission Section */}
        <section className="py-16 bg-[#111]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8 text-white">Our Mission</h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-center text-gray-400">
                At BREEZE, our mission is to make every food delivery a delightful experience for all involved. We strive to:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-gray-400">
                <li>Provide customers with a diverse range of high-quality food options and a seamless ordering experience</li>
                <li>Empower local restaurants and vendors to reach more customers and grow their businesses</li>
                <li>Offer flexible, fair, and rewarding opportunities for our delivery riders</li>
                <li>Create a supportive ecosystem for our affiliates to thrive and grow with us</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8 text-white">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div key={index} className="text-center">
                  <div className="bg-[#222] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{value.title}</h3>
                  <p className="text-gray-400">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-[#111]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8 text-white">Meet Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <div key={member.id} className="text-center">
                  <Image
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    width={200}
                    height={200}
                    className="rounded-full mx-auto mb-4"
                  />
                  <h3 className="text-xl font-semibold mb-2 text-white">{member.name}</h3>
                  <p className="text-gray-400">{member.position}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

const values = [
  {
    title: 'Customer-Centric',
    description: 'We put our customers first in everything we do, ensuring their satisfaction and delight.',
    icon: ({ className }: { className?: string }) => (
      <div className="bg-red-900 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className={`w-10 h-10 text-white ${className}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      </div>
    )
  },
  {
    title: 'Innovation',
    description: 'We constantly seek new ways to improve our service and stay ahead in the industry.',
    icon: ({ className }: { className?: string }) => (
      <div className="bg-red-900 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className={`w-10 h-10 text-white ${className}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    )
  },
  {
    title: 'Integrity',
    description: 'We operate with honesty and transparency in all our dealings with stakeholders.',
    icon: ({ className }: { className?: string }) => (
      <div className="bg-red-900 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className={`w-10 h-10 text-white ${className}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
    )
  },
];

export default AboutUs;