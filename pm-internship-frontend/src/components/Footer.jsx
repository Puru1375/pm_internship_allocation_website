import { Facebook, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0b2b6b] text-white pt-8 md:pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 border-b border-white/10 pb-6 md:pb-8">
        
        {/* Brand */}
        <div className="space-y-3 sm:col-span-2 lg:col-span-1">
         <div className="flex items-center">
          <div className="h-7 w-7 bg-blue-600 rounded-full flex items-center justify-center mr-2 shrink-0">
            <div className="h-3 w-3 bg-white rounded-full opacity-30"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-base md:text-lg font-bold tracking-tight">SkillBridge</span>
          </div>
        </div>
          <p className="text-blue-200 text-xs md:text-sm leading-relaxed max-w-sm">
            An AI-driven initiative to bridge the gap between academic learning and industry requirements through smart internship allocation.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-sm md:text-base mb-3">Quick Links</h4>
          <ul className="space-y-1.5 text-xs md:text-sm text-blue-200">
            <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Search Jobs</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Company Registration</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Student Guidelines</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-bold text-sm md:text-base mb-3">Contact Us</h4>
          <ul className="space-y-2 text-xs md:text-sm text-blue-200">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <span className="leading-relaxed">Shastri Bhawan, New Delhi,<br/>India - 110001</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="shrink-0" /> <span>+91 11 2345 6789</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="shrink-0" /> <span className="break-all">support@pm-internship.gov.in</span>
            </li>
          </ul>
        </div>

        {/* Social & Legal */}
        <div>
          <h4 className="font-bold text-sm md:text-base mb-3">Connect</h4>
          <div className="flex gap-2 mb-4">
            <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" aria-label="Facebook">
              <Facebook size={16}/>
            </a>
            <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" aria-label="Twitter">
              <Twitter size={16}/>
            </a>
            <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" aria-label="LinkedIn">
              <Linkedin size={16}/>
            </a>
          </div>
          <div className="text-xs md:text-sm text-blue-300 space-y-1">
            <a href="#" className="block hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="block hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

      <div className="text-center pt-4 md:pt-6 text-blue-300 text-xs md:text-sm">
        &copy; 2025 PM Internship Allocation Portal. All rights reserved.
      </div>
      </div>
    </footer>
  );
}