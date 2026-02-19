import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-14"> {/* pt-14 accounts for fixed navbar height */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}