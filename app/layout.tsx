// app/layout.tsx
import './globals.css';
import { Lora } from 'next/font/google'; // A great serif font similar to Times New Roman
import { Providers } from './providers';
import Logo from './components/Logo'; // THE FIX: The corrected import path is now here.

// Configure the font
const lora = Lora({ subsets: ['latin'] });

export const metadata = {
  title: 'EaseMail - AI Email Assistant',
  description: 'Generate and send personalized emails effortlessly.',
};

// A new Footer component
function Footer() {
  return (
    <footer className="w-full py-4 mt-auto text-center text-white bg-slate-800/80">
      <p className="text-sm">© {new Date().getFullYear()} mj665. All Rights Reserved.</p>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* This sets the favicon for your site */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      {/* Apply the new font class to the body */}
      <body className={lora.className}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}