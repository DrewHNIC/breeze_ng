import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <main className={roboto.className}>
      <Component {...pageProps} />
    </main>
  );
}

export default MyApp;