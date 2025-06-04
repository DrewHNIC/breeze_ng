import React from 'react';
import Head from 'next/head';
import SignupForm from '../../components/SignupForm';

const AffiliateSignup: React.FC = () => {
  return (
    <>
      <Head>
        <title>Affiliate Signup - BREEZE</title>
        <meta name="description" content="Sign up as an affiliate on BREEZE" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SignupForm userType="affiliate" gifSrc="/affiliate-signup.gif" />
    </>
  );
};

export default AffiliateSignup;