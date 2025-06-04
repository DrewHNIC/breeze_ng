import React from 'react';
import Head from 'next/head';
import SignupForm from '../../components/SignupForm';

const CustomerSignup: React.FC = () => {
  return (
    <>
      <Head>
        <title>Customer Signup - BREEZE</title>
        <meta name="description" content="Sign up as a customer on BREEZE" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SignupForm userType="customer" gifSrc="/customer-signup.gif" />
    </>
  );
};

export default CustomerSignup;