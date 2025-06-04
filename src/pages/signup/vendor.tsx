import React from 'react';
import Head from 'next/head';
import SignupForm from '../../components/SignupForm';

const VendorSignup: React.FC = () => {
  return (
    <>
      <Head>
        <title>Vendor Signup - BREEZE</title>
        <meta name="description" content="Sign up as a vendor on BREEZE" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SignupForm userType="vendor" gifSrc="/vendor-signup.gif" />
    </>
  );
};

export default VendorSignup;