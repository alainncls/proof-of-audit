import { lazy, Suspense } from 'react';
import './App.css';
import Analytics from './components/Analytics.tsx';
import Footer from './components/Footer.tsx';
import Header from './components/Header.tsx';

const WalletApp = lazy(() => import('./WalletApp.tsx'));

const walletAppFallback = (
  <div className="form form-loading" role="status" aria-live="polite">
    Loading wallet tools...
  </div>
);

const App = () => {
  return (
    <>
      <Header />
      <main className="main-container">
        <Suspense fallback={walletAppFallback}>
          <WalletApp />
        </Suspense>
      </main>
      <Footer />
      <Analytics />
    </>
  );
};

export default App;
