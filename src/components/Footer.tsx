import './Footer.css';
import {FaGithub} from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <p className={'copyright'}>Made with <span role="img" aria-label="heart">❤️</span> by {' '}
                    <a className={'underline white-link'} href="https://alainnicolas.fr/en/" target="_blank"
                       rel="noopener noreferrer">Alain Nicolas</a>
                </p>
                <a href="https://github.com/alainncls/proof-of-audit" target="_blank" rel="noopener noreferrer"
                   className="white-link"><FaGithub size={24}/></a>
            </div>
        </footer>
    );
}

export default Footer;
