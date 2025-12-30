import './Footer.css';
import { FaGithub } from 'react-icons/fa';
import { BsTwitterX } from 'react-icons/bs';
import LogoVerax from '../assets/logo-verax.svg';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="copyright">
          Made with <span aria-label="love">❤️</span> by{' '}
          <a
            href="https://alainnicolas.fr/en/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Alain Nicolas
          </a>
        </p>
        <div className="footer-links">
          <a
            href="https://www.ver.ax"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            aria-label="Verax website"
          >
            <img src={LogoVerax} alt="Verax logo" height={24} width={24} />
          </a>
          <a
            href="https://github.com/alainncls/proof-of-audit"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            aria-label="GitHub repository"
          >
            <FaGithub size={24} aria-hidden="true" />
          </a>
          <a
            href="https://x.com/Alain_Ncls"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            aria-label="View my X profile"
          >
            <BsTwitterX size={24} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
