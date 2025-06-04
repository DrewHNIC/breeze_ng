import React, { useEffect, useState } from "react";
import Head from "next/head";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const PrivacyPolicy: React.FC = () => {
  const [policyContent, setPolicyContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        const response = await fetch("/api/privacy-policy");
        if (!response.ok) {
          throw new Error("Failed to fetch privacy policy");
        }
        const data = await response.json();
        setPolicyContent(data.content);
      } catch (error) {
        setError("Error loading privacy policy. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrivacyPolicy();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Head>
        <title>Privacy Policy - BREEZE</title>
        <meta name="description" content="Privacy Policy for BREEZE food delivery platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 bg-black text-white">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        {isLoading ? (
          <p>Loading privacy policy...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="prose max-w-none text-white" dangerouslySetInnerHTML={{ __html: policyContent }} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;