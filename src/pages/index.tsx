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
  const [currentVideo, setCurrentVideo] = useState<string>(
    'https://iucltqyclynvzjjexxdl.supabase.co/storage/v1/object/public/landing-videos/hero-video-1.mp4'
  );

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
      'https://iucltqyclynvzjjexxdl.supabase.co/storage/v1/object/public/landing-videos/hero-video-1.mp4',
      'https://iucltqyclynvzjjexxdl.supabase.co/storage/v1/object/public/landing-videos/hero-video-2.mp4',
      'https://iucltqyclynvzjjexxdl.supabase.co/storage/v1/object/public/landing-videos/hero-video-3.mp4',
      'https://iucltqyclynvzjjexxdl.supabase.co/storage/v1/object/public/landing-videos/hero-video-4.mp4',
      'https://iucltqyclynvzjjexxdl.supabase.co/storage/v1/object/public/landing-videos/hero-video-5.mp4',
      'https://iucltqyclynvzjjexxdl.supabase.co/storage/v1/object/public/landing-videos/hero-video-6.mp4',
    ];

    const changeVideo = () => {
      const randomIndex = Math.floor(Math.random() * videos.length);
      setCurrentVideo(videos[randomIndex]);
    };

    const intervalId = setInterval(changeVideo, 10000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#b9c6c8] to-[#1d2c36] text-[#1d2c36]">
      <Head>
        <title>BREEZE - Revolutionizing Food Delivery</title>
        <meta name="description" content="BREEZE - A platform tailored towards a delivery persona" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-screen overflow-hidden">
          {/* Fallback Blur Background */}
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-sm scale-105"
            style={{ backgroundImage: 'url(/fallback-image.jpg)' }}
          />

          {/* Hero Video */}
          <video
            key={currentVideo}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out"
          >
            <source src={currentVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Overlay Text */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#b9c6c8]/80 to-[#1d2c36]/60 flex items-center justify-center">
            <div className="text-center text-[#1d2c36]">
              <h1 className="text-6xl font-bold italic mb-4">Welcome to breeze</h1>
              <p className="text-2xl mb-8 italic">Driven. Dedicated. Ours.</p>
              <button
                onClick={scrollToPersonas}
                className="border border-[#1d2c36] text-[#1d2c36] px-6 py-2 rounded-md bg-transparent hover:text-[#b9c6c8] hover:border-[#b9c6c8] transition duration-300"
              >
                Get Started
              </button>
            </div>
          </div>
        </section>

        {/* User Personas */}
        <section
          id="join-community"
          className="py-20 bg-gradient-to-b from-[#b9c6c8] to-[#1d2c36]"
          ref={personasRef}
        >
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl sm:text-5xl font-bold font-logo text-center mb-16 tracking-tight">
              Join Our Community
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {personas.map((persona) => (
                <div
                  key={persona.title}
                  className="bg-gradient-to-br from-[#1d2c36] to-[#2a3a4d] text-[#8f8578] rounded-2xl shadow-lg overflow-hidden transform transition duration-300 hover:scale-[1.02] hover:shadow-xl"
                >
                  <Image
                    src={persona.image || '/placeholder.svg'}
                    alt={persona.title}
                    width={600}
                    height={400}
                    className="w-full h-52 object-cover rounded-t-2xl"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-[#b9c6c8] uppercase mb-2 tracking-wide">
                      {persona.title}
                    </h3>
                    <p className="leading-relaxed mb-4">{persona.description}</p>
                    <Link
                      href={persona.link}
                      className="inline-block mt-2 px-5 py-2 text-sm font-medium text-[#b9c6c8] border border-[#b9c6c8] rounded-md hover:bg-[#b9c6c8] hover:text-[#1d2c36] transition duration-300"
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
        <section className="py-20 bg-gradient-to-b from-[#b9c6c8] to-[#1d2c36]">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl sm:text-5xl font-bold font-logo text-center mb-16 tracking-tight">
              Featured Restaurants
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {featuredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="bg-gradient-to-br from-[#1d2c36] to-[#2a3a4d] text-[#8f8578] rounded-2xl shadow-lg overflow-hidden transform transition duration-300 hover:scale-[1.02] hover:shadow-xl"
                >
                  <Image
                    src={restaurant.image || '/placeholder.svg'}
                    alt={restaurant.name}
                    width={600}
                    height={400}
                    className="w-full h-52 object-cover rounded-t-2xl"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-[#b9c6c8] mb-2">{restaurant.name}</h3>
                    <p className="text-sm mb-4">
                      {restaurant.cuisine} • {restaurant.price} • {restaurant.rating} ★
                    </p>
                    <Link
                      href={`/restaurant/${restaurant.id}`}
                      className="inline-block mt-2 px-5 py-2 text-sm font-medium text-[#b9c6c8] border border-[#b9c6c8] rounded-md hover:bg-[#b9c6c8] hover:text-[#1d2c36] transition duration-300"
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
