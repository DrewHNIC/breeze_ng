import React, { useState, FormEvent } from 'react';
import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

type FormData = {
  name: string;
  email: string;
  message: string;
};

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.message) newErrors.message = 'Message is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Head>
        <title>Contact Us - BREEZE</title>
        <meta name="description" content="Get in touch with BREEZE - We're here to help!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-grow">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto bg-gray rounded-2xl shadow-xl overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="bg-gradient-to-r from-black to-white p-12 text-white">
                  <h2 className="text-4xl font-bold mb-6">Contact Us</h2>
                  <p className="text-lg mb-12">We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.</p>
                  <div className="flex items-center mb-6">
                    <FiMail className="w-6 h-6 mr-4" />
                    <span>support@breeze.com</span>
                  </div>
                  <div className="flex items-center mb-6">
                    <FiPhone className="w-6 h-6 mr-4" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center">
                    <FiMapPin className="w-6 h-6 mr-4" />
                    <span>123 BREEZE Street, Food City, FC 12345</span>
                  </div>
                </div>
                <div className="p-12">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                      <label htmlFor="name" className="block text-white font-bold mb-2">Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="Your name"
                      />
                      {errors.name && <p className="text-red-900 text-sm mt-1">{errors.name}</p>}
                    </div>
                    <div className="mb-6">
                      <label htmlFor="email" className="block text-white font-bold mb-2">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="your@email.com"
                      />
                      {errors.email && <p className="text-red-900 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <div className="mb-6">
                      <label htmlFor="message" className="block text-white font-bold mb-2">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="Your message"
                      ></textarea>
                      {errors.message && <p className="text-red-900 text-sm mt-1">{errors.message}</p>}
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-black to-black text-white font-bold py-3 px-4 rounded-md hover:from-bg[#111] hover:to-bg[#111] transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                  {submitStatus === 'success' && (
                    <p className="mt-4 text-green-600 text-center font-semibold">Your message has been sent successfully!</p>
                  )}
                  {submitStatus === 'error' && (
                    <p className="mt-4 text-red-600 text-center font-semibold">There was an error sending your message. Please try again.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUs;