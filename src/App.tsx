import { lazy, Suspense, useState } from 'react';
import './App.css';
import Analytics from './components/Analytics.tsx';
import Footer from './components/Footer.tsx';
import Header from './components/Header.tsx';

const loadWalletApp = () => import('./WalletApp.tsx');
const preloadWalletApp = () => {
  void loadWalletApp();
};

const WalletApp = lazy(loadWalletApp);

const walletAppFallback = (
  <div className="form form-loading" role="status" aria-live="polite">
    Loading wallet tools...
  </div>
);

const App = () => {
  const [isWalletAppEnabled, setIsWalletAppEnabled] = useState(false);

  return (
    <>
      <Header />
      <main className="main-container">
        <section className="intro" aria-labelledby="intro-title">
          <h2 className="intro-title" id="intro-title">
            Issue on-chain audit attestations
          </h2>
          <p className="intro-copy">
            Link a GitHub repository, audited commit, and smart contract address
            to a Verax attestation on Linea.
          </p>
        </section>

        {isWalletAppEnabled ? (
          <Suspense fallback={walletAppFallback}>
            <WalletApp />
          </Suspense>
        ) : (
          <section className="tool-start" aria-label="Start Proof of Audit">
            <p className="tool-start-copy">
              Prepare the attestation form and wallet connection when you are
              ready to issue proof.
            </p>
            <button
              type="button"
              className="start-button"
              onFocus={preloadWalletApp}
              onClick={() => setIsWalletAppEnabled(true)}
              onPointerEnter={preloadWalletApp}
            >
              Start attestation
            </button>
          </section>
        )}
      </main>
      <Footer />
      <Analytics />
    </>
  );
};

export default App;
