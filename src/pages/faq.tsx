import React, { useState, useEffect } from "react";
import Head from "next/head";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Accordion from "../components/Accordion";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQPage: React.FC = () => {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await fetch("/api/faq");
        if (!response.ok) {
          throw new Error("Failed to fetch FAQ data");
        }
        const data = await response.json();
        setFaqItems(data);
      } catch (err) {
        setError("Error loading FAQ data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Head>
        <title>FAQ - BREEZE</title>
        <meta name="description" content="Frequently Asked Questions about BREEZE food delivery platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 bg-black text-white">
        <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
        {isLoading ? (
          <p>Loading FAQ...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <Accordion items={faqItems} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
