import {
  Component,
  type ComponentType,
  type ReactNode,
  lazy,
  Suspense,
  useCallback,
  useState,
} from 'react';
import './App.css';
import Analytics from './components/Analytics.tsx';
import Footer from './components/Footer.tsx';
import Header from './components/Header.tsx';

const loadWalletApp = () => import('./WalletApp.tsx');
type WalletAppModule = { default: ComponentType };
type WalletAppLoad = () => Promise<WalletAppModule>;

const walletAppFallback = (
  <div className="form form-loading" role="status" aria-live="polite">
    Loading wallet tools...
  </div>
);

type WalletLoadErrorProps = {
  error: Error;
  onRetry: () => void;
};

const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  return new Error('The wallet tools could not be loaded.');
};

const isMissingWalletConfig = (error: Error): boolean =>
  error.message.includes('VITE_WALLETCONNECT_PROJECT_ID');

const isChunkLoadError = (error: Error): boolean =>
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(
    error.message,
  );

const walletLoadMessage = (error: Error): string => {
  if (isMissingWalletConfig(error)) {
    return 'Wallet configuration is missing. Set VITE_WALLETCONNECT_PROJECT_ID in the environment used to build this app, then try again. A project id is not invented here.';
  }

  if (isChunkLoadError(error)) {
    return 'The wallet tools bundle failed to load. Check your connection, then try again.';
  }

  return `The wallet tools could not be loaded. Try again. ${error.message}`;
};

function WalletLoadError({ error, onRetry }: Readonly<WalletLoadErrorProps>) {
  return (
    <section className="form wallet-load-error" role="alert">
      <h2 className="wallet-load-error-title">Wallet tools unavailable</h2>
      <p>{walletLoadMessage(error)}</p>
      <button type="button" className="start-button" onClick={onRetry}>
        Try again
      </button>
    </section>
  );
}

function WalletAppLoader({ load }: Readonly<{ load: WalletAppLoad }>) {
  const [WalletApp] = useState(() => lazy(load));

  return <WalletApp />;
}

type WalletErrorBoundaryProps = {
  children: ReactNode;
  onRetry: () => void;
};

type WalletErrorBoundaryState = {
  error: Error | null;
};

class WalletErrorBoundary extends Component<
  WalletErrorBoundaryProps,
  WalletErrorBoundaryState
> {
  state: WalletErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): WalletErrorBoundaryState {
    return { error: toError(error) };
  }

  render() {
    if (this.state.error) {
      return (
        <WalletLoadError
          error={this.state.error}
          onRetry={this.props.onRetry}
        />
      );
    }

    return this.props.children;
  }
}

type AppProps = {
  loadWalletApp?: WalletAppLoad;
};

const App = ({
  loadWalletApp: walletAppLoad = loadWalletApp,
}: Readonly<AppProps>) => {
  const [isWalletAppEnabled, setIsWalletAppEnabled] = useState(false);
  const [walletLoadAttempt, setWalletLoadAttempt] = useState(0);
  const [preloadError, setPreloadError] = useState<Error | null>(null);

  const preloadWalletApp = useCallback(() => {
    void walletAppLoad().catch((error: unknown) => {
      setPreloadError(toError(error));
    });
  }, [walletAppLoad]);

  const retryWalletLoad = useCallback(() => {
    setPreloadError(null);
    setWalletLoadAttempt((attempt) => attempt + 1);
    setIsWalletAppEnabled(true);
  }, []);

  let walletArea = (
    <section className="tool-start" aria-label="Start Proof of Audit">
      <p className="tool-start-copy">
        Prepare the attestation form and wallet connection when you are ready to
        issue proof.
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
  );

  if (preloadError) {
    walletArea = (
      <WalletLoadError error={preloadError} onRetry={retryWalletLoad} />
    );
  } else if (isWalletAppEnabled) {
    walletArea = (
      <WalletErrorBoundary key={walletLoadAttempt} onRetry={retryWalletLoad}>
        <Suspense fallback={walletAppFallback}>
          <WalletAppLoader load={walletAppLoad} />
        </Suspense>
      </WalletErrorBoundary>
    );
  }

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
        {walletArea}
      </main>
      <Footer />
      <Analytics />
    </>
  );
};

export default App;
