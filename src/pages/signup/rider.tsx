import React from 'react';
import Head from 'next/head';
import SignupForm from '../../components/SignupForm';

const RiderSignup: React.FC = () => {
  return (
    <>
      <Head>
        <title>Rider Signup - BREEZE</title>
        <meta name="description" content="Sign up as a rider on BREEZE" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SignupForm userType="rider" gifSrc="/rider-signup.gif" />
    </>
  );
};

export default RiderSignup;