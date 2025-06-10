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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#1D1D27] to-[#2A2A39] text-[#70452F]">
      <Head>
        <title>BREEZE - Revolutionizing Food Delivery</title>
        <meta name="description" content="BREEZE - A platform tailored towards a delivery persona" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-grow">
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
          <div className="absolute inset-0 bg-gradient-to-r from-[#1D1D27]/80 to-[#2A2A39]/80 flex items-center justify-center">
            <div className="text-center text-[#70452F]">
              <h1 className="text-6xl font-bold mb-4">Welcome to BREEZE</h1>
              <p className="text-2xl mb-8 italic">Make each delivery a breeze</p>
              <button
                onClick={scrollToPersonas}
                className="border border-[#70452F] text-[#70452F] px-6 py-2 rounded-md hover:bg-[#70452F]/10 transition duration-300"
              >
                Get Started
              </button>
            </div>
          </div>
        </section>

        <section id="join-community" className="py-16 bg-gradient-to-b from-[#1D1D27] to-[#2A2A39]" ref={personasRef}>
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">Join Our Community</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {personas.map((persona) => (
                <div key={persona.title} className="bg-[#2A2A39] rounded-lg shadow-md hover:shadow-lg transition duration-300">
                  <div className="md:flex">
                    <div className="md:flex-shrink-0">
                      <Image
                        src={persona.image || "/placeholder.svg"}
                        alt={persona.title}
                        width={300}
                        height={200}
                        className="h-48 w-full object-cover md:w-48"
                      />
                    </div>
                    <div className="p-8">
                      <h3 className="uppercase tracking-wide text-sm text-[#CCA281] font-bold">{persona.title}</h3>
                      <p className="mt-2 text-[#b88e74]">{persona.description}</p>
                      <Link
                        href={persona.link}
                        className="mt-4 block border border-[#70452F] text-[#70452F] px-6 py-2 rounded-md hover:bg-[#70452F]/10 transition duration-300 text-center"
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

        <section className="py-16 bg-gradient-to-t from-[#1D1D27] to-[#2A2A39]">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">Featured Restaurants</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredRestaurants.map((restaurant) => (
                <div key={restaurant.id} className="bg-[#2A2A39] rounded-lg shadow-md hover:shadow-lg transition duration-300">
                  <Image src={restaurant.image || "/placeholder.svg"} alt={restaurant.name} width={400} height={300} className="w-full h-48 object-cover" />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{restaurant.name}</h3>
                    <p className="text-[#b88e74] mb-4">{restaurant.cuisine} • {restaurant.price} • {restaurant.rating} ★</p>
                    <Link
                      href={`/restaurant/${restaurant.id}`}
                      className="border border-[#70452F] text-[#70452F] px-4 py-2 rounded-md hover:bg-[#70452F]/10 transition duration-300"
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
