// src/pages/index.tsx
import React, { useRef, useEffect, useState } from 'react';
import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../utils/supabase';

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
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string>('');

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
    const fetchVideos = async () => {
      const { data, error } = await supabase.storage
        .from('landing-videos')
        .list('', { limit: 100 });

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }

      const urls = await Promise.all(
        data
          .filter((file) => file.name.endsWith('.mp4'))
          .map(async (file) => {
            const { data: urlData } = await supabase
              .storage
              .from('landing-videos')
              .createSignedUrl(file.name, 60 * 60); // 1 hour
            return urlData?.signedUrl || '';
          })
      );

      setVideoUrls(urls.filter(Boolean));

      const random = urls[Math.floor(Math.random() * urls.length)];
      if (random) setCurrentVideo(random);
    };

    fetchVideos();

    const intervalId = setInterval(() => {
      if (videoUrls.length > 0) {
        const random = videoUrls[Math.floor(Math.random() * videoUrls.length)];
        setCurrentVideo(random);
      }
    }, 10000); // 10s

    return () => clearInterval(intervalId);
  }, [videoUrls]);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Head>
        <title>BREEZE - Revolutionizing Food Delivery</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="BREEZE - A platform tailored towards a delivery persona" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[100dvh] sm:h-screen">
          {currentVideo && (
            <video
              key={currentVideo}
              autoPlay
              loop
              muted
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={currentVideo} type="video/mp4" />
            </video>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 text-center">
            <div className="max-w-xl">
              <h1 className="text-4xl sm:text-6xl font-bold mb-4">Welcome to BREEZE</h1>
              <p className="text-lg sm:text-2xl mb-6 italic">Make each delivery a breeze</p>
              <button
                onClick={scrollToPersonas}
                className="bg-white text-black px-6 py-2 rounded-md text-lg font-semibold hover:bg-gray-300 transition"
              >
                Get Started
              </button>
            </div>
          </div>
        </section>

        {/* User Personas Section */}
        <section id="join-community" className="py-16 bg-[#000000]" ref={personasRef}>
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-white">Join Our Community</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {personas.map((persona) => (
                <div key={persona.title} className="bg-[#111] rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
                  <div className="md:flex">
                    <div className="md:flex-shrink-0">
                      <Image
                        src={persona.image || "/placeholder.svg"}
                        alt={persona.title}
                        width={400}
                        height={300}
                        className="w-full md:w-64 lg:w-80 h-48 md:h-auto object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="uppercase tracking-wide text-sm text-red-900 font-bold">{persona.title}</h3>
                      <p className="mt-2 text-gray-300">{persona.description}</p>
                      <Link
                        href={persona.link}
                        className="mt-4 block bg-black text-white px-6 py-2 rounded-md hover:bg-gray-500 transition duration-300 text-center"
                      >
                        Sign Up as {persona.title}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Restaurants Section */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-white">Featured Restaurants</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredRestaurants.map((restaurant) => (
                <div key={restaurant.id} className="bg-[#111] rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
                  <Image
                    src={restaurant.image || "/placeholder.svg"}
                    alt={restaurant.name}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-white">{restaurant.name}</h3>
                    <p className="text-gray-400 mb-4">{restaurant.cuisine} • {restaurant.price} • {restaurant.rating} ★</p>
                    <Link
                      href={`/restaurant/${restaurant.id}`}
                      className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-500 transition duration-300"
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
