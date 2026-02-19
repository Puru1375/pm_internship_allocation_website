import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const logoUrl = '/skillbridge_logo.png';

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        
       <div className="h-16 flex items-center border-b border-transparent md:border-none">
          <img src={logoUrl} alt="SkillBridge Logo" style={{height: "110px", width: "180px"}}/>
          <div className="flex flex-col ml-2">
            {/* <span className="text-base text-slate-900 font-bold tracking-tight">SkillBridge</span> */}
            {/* <span className="text-[10px] text-slate-500 -mt-0.5">
              {user?.role === 'intern' ? 'Student Portal' : user?.role === 'company' ? 'Company Portal' : user?.role === 'admin' ? 'Admin Portal' : 'Dashboard'}
            </span> */}
          </div>
          {/* <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto text-slate-400">
            <X size={20} />
          </button> */}
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-brand-blue font-bold' : 'text-slate-600 hover:text-brand-blue'}`}>Home</Link>
          <a href="#features" className="text-sm font-medium text-slate-600 hover:text-brand-blue transition-colors">Features</a>
          <a href="#about" className="text-sm font-medium text-slate-600 hover:text-brand-blue transition-colors">About</a>
          
          <div className="h-4 w-px bg-slate-200 mx-1"></div>
          
          <Link to="/login" className={`text-sm font-medium ${isActive('/login') ? 'text-brand-blue font-bold' : 'text-slate-600 hover:text-brand-blue'}`}>
            Login
          </Link>
          <Link to="/register/intern" className="btn-primary shadow-none hover:shadow-md">
            Register (Intern)
          </Link>
          <Link to="/register/company" className={`text-sm font-medium ${isActive('/register/company') ? 'text-brand-blue font-bold' : 'text-slate-600 hover:text-brand-blue'}`}>
            For Companies
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-slate-600">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-3 shadow-lg absolute w-full">
          <Link to="/" 
          onClick={() => setIsOpen(!isOpen)}
          className="block py-2 text-slate-600 font-medium">Home</Link>
          <Link to="/login" onClick={() => setIsOpen(!isOpen)} className="block py-2 text-slate-600 font-medium">Login</Link>
          <Link to="/register/intern" onClick={() => setIsOpen(!isOpen)} className="block w-full text-center btn-primary py-2">Register as Intern</Link>
          <Link to="/register/company" onClick={() => setIsOpen(!isOpen)} className="block py-2 text-slate-600 font-medium">Register as Company</Link>
        </div>
      )}
    </nav>
  );
}