import { Link } from 'react-router-dom';
import { Page, btn } from '../components/Shell.jsx';

export default function NotFound() {
  return (
    <Page narrow>
      <p className="spec">404</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">This page doesn't exist</h1>
      <Link to="/library" className={`${btn.primary} mt-6`}>
        Go to your library
      </Link>
    </Page>
  );
}
