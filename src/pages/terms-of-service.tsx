import React, { useEffect, useState } from "react";
import Head from "next/head";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const TermsOfService: React.FC = () => {
  const [termsContent, setTermsContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTermsContent = async () => {
      try {
        const response = await fetch("/api/terms-of-service");
        if (!response.ok) {
          throw new Error("Failed to fetch terms of service");
        }
        const data = await response.json();
        setTermsContent(data.content);
      } catch (error) {
        setError("Error loading terms of service. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTermsContent();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Head>
        <title>Terms of Service - BREEZE</title>
        <meta name="description" content="Terms of Service for BREEZE food delivery platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 bg-black text-white">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        {isLoading ? (
          <p>Loading terms of service...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="prose max-w-none text-white" dangerouslySetInnerHTML={{ __html: termsContent }} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;