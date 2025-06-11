// src/pages/index.tsx
import React, { useRef, useEffect, useState } from 'react';
import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';

interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  price: string;
  image: string;
}

const Home: React.FC = () => {
  const personasRef = useRef<HTMLDivElement>(null);
  const [featuredRestaurants, setFeaturedRestaurants] = useState<Restaurant[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string>('/videos/hero-video-1.mp4');

  const scrollToPersonas = () => {
    personasRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchFeaturedRestaurants = async () => {
      try {
        const response = await fetch('/api/featured-restaurants');
        if (response.ok) {
          const data = await response.json();
          setFeaturedRestaurants(data);
        }
      } catch (error) {
        console.error('Error fetching featured restaurants:', error);
      }
    };
    fetchFeaturedRestaurants();
  }, []);

  useEffect(() => {
    const videos = [
      '/videos/hero-video-1.mp4',
      '/videos/hero-video-2.mp4',
      '/videos/hero-video-3.mp4',
      '/videos/hero-video-4.mp4',
      '/videos/hero-video-5.mp4',
      '/videos/hero-video-6.mp4',
    ];
    const changeVideo = () => {
      const randomIndex = Math.floor(Math.random() * videos.length);
      setCurrentVideo(videos[randomIndex]);
    };
    const intervalId = setInterval(changeVideo, 10000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#CCA281] to-[#70452F] text-[#70452F]">
      <Head>
        <title>BREEZE - Revolutionizing Food Delivery</title>
        <meta name="description" content="BREEZE - A platform tailored towards a delivery persona" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-screen">
          <video
            key={currentVideo}
            autoPlay
            loop
            muted
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={currentVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-[#CCA281]/80 to-[#70452F]/60 flex items-center justify-center">
            <div className="text-center text-[#70452F]">
              <h1 className="text-6xl font-bold italic mb-4">Welcome to breeze</h1>
              <p className="text-2xl mb-8 italic">Driven. Dedicated. Ours.</p>
              <button
                onClick={scrollToPersonas}
                className="border border-[#70452F] text-[#70452F] px-6 py-2 rounded-md bg-transparent hover:text-[#1D1D27] hover:border-[#1D1D27] transition duration-300"
              >
                Get Started
              </button>
            </div>
          </div>
        </section>

        {/* User Personas */}
        <section id="join-community" className="py-20 bg-gradient-to-b from-[#CCA281] to-[#70452F]" ref={personasRef}>
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl sm:text-5xl font-bold font-logo text-center mb-16 tracking-tight">Join Our Community</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {personas.map((persona) => (
                <div
                  key={persona.title}
                  className="bg-[#70452F] text-[#CCA281] rounded-2xl shadow-lg overflow-hidden transform transition duration-300 hover:scale-[1.02] hover:shadow-xl"
                >
                  <Image
                    src={persona.image || "/placeholder.svg"}
                    alt={persona.title}
                    width={600}
                    height={400}
                    className="w-full h-52 object-cover rounded-t-2xl"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-[#1D1D27] uppercase mb-2 tracking-wide">{persona.title}</h3>
                    <p className="text-[#CCA281] leading-relaxed mb-4">{persona.description}</p>
                    <Link
                      href={persona.link}
                      className="inline-block mt-2 px-5 py-2 text-sm font-medium text-[#CCA281] border border-[#CCA281] rounded-md hover:bg-[#CCA281] hover:text-white transition duration-300"
                    >
                      Join as {persona.title}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Restaurants */}
        <section className="py-20 bg-gradient-to-b from-[#CCA281] to-[#70452F]">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl sm:text-5xl font-bold font-logo text-center mb-16 tracking-tight">Featured Restaurants</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {featuredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="bg-[#70452F] text-[#CCA281] rounded-2xl shadow-lg overflow-hidden transform transition duration-300 hover:scale-[1.02] hover:shadow-xl"
                >
                  <Image
                    src={restaurant.image || "/placeholder.svg"}
                    alt={restaurant.name}
                    width={600}
                    height={400}
                    className="w-full h-52 object-cover rounded-t-2xl"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-[#1D1D27] mb-2">{restaurant.name}</h3>
                    <p className="text-sm text-[#CCA281] mb-4">
                      {restaurant.cuisine} • {restaurant.price} • {restaurant.rating} ★
                    </p>
                    <Link
                      href={`/restaurant/${restaurant.id}`}
                      className="inline-block mt-2 px-5 py-2 text-sm font-medium text-[#CCA281] border border-[#CCA281] rounded-md hover:bg-[#CCA281] hover:text-white transition duration-300"
                    >
                      View Menu
                    </Link>
                  </div>
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

const personas = [
  {
    title: 'Customer',
    description: 'Discover a world of culinary delights with BREEZE...',
    image: '/customer.gif',
    link: '/signup/customer',
  },
  {
    title: 'Vendor',
    description: 'Join BREEZE as a vendor and expand your culinary reach...',
    image: '/vendor.gif',
    link: '/signup/vendor',
  },
  {
    title: 'Rider',
    description: 'Become a BREEZE rider and enjoy flexible hours...',
    image: '/rider.gif',
    link: '/signup/rider',
  },
  {
    title: 'Affiliate',
    description: 'Turn your influence into income with our affiliate program...',
    image: '/affiliate.gif',
    link: '/signup/affiliate',
  },
];

export default Home;
