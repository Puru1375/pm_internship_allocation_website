import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Eye, Linkedin } from 'lucide-react';
import slide1 from '../../assets/slide1.png';
import slide2 from '../../assets/slide2.jpg';
import slide3 from '../../assets/slide3.png';
import slide4 from '../../assets/slide4.jpg';

export default function LandingPage() {
  
  // --- CAROUSEL LOGIC ---
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const heroImages = [
    slide1,
    slide2,
    slide3,
    slide4
  ];

  useEffect(() => {
    // Change image every 5 seconds (5000ms)
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // --- TEAM DATA ---
  const team = [
    { name: "Riddhi Thakkar", role: "Project Lead / AI Architect", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Riddhi" },
    { name: "Jiya Jayswal", role: "Frontend Developer", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jiya" },
    { name: "Mihir Patel", role: "Backend Engineer", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mihir" },
    { name: "Viyom Jagtap", role: "Data Scientist / ML Ops", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vijyam" },
    { name: "Tejas Panchal", role: "Full Stack Developer", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tejas" },
    { name: "Purvanshu Machhi", role: "Affirmative Action Specialist", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Purvanshu" },
  ];

  return (
    <div className="font-sans">
      
      {/* --- HERO SECTION --- */}
      <div className="relative h-[500px] md:h-[650px] w-full overflow-hidden bg-slate-900">
        
        {/* Background Image Carousel */}
        {heroImages.length > 0 && heroImages.map((img, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img 
              src={img} 
              alt={`Slide ${index + 1}`} 
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}

        {/* Gradient Overlay (Static - stays on top of changing images) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F3B8C]/80 via-[#0F3B8C]/60 to-black/30 z-10"></div>

        {/* Content */}
        <div className="relative z-20 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pt-8 md:pt-10">
            <div className="max-w-3xl animate-fade-in-up">
              <span className="inline-block py-0.5 px-2.5 rounded-full bg-white/10 border border-white/20 text-white text-[9px] sm:text-xs font-bold tracking-wider uppercase mb-3 backdrop-blur-sm">
                PM Internship Scheme Initiative
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 md:mb-4">
                The AI-Powered <br />
                <span className="text-[#FFB067]">Allocation Engine</span>
              </h1>
              <p className="text-sm sm:text-base text-blue-100 mb-4 md:mb-6 leading-relaxed max-w-2xl">
                Harnessing Machine Learning algorithms to deliver smarter, faster, and fairer internship placements. Accounting for equity, industry capacity, and student potential.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-start">
                <Link to="/register" className="w-auto min-w-[120px] inline-flex items-center justify-center btn-primary bg-[#FF9933] hover:bg-[#e68a00] border-none text-white px-4 sm:px-6 py-2 sm:py-2.5 text-sm shadow-lg shadow-orange-900/20 transition-transform transform hover:-translate-y-0.5">
                  Get Started Today
                </Link>
                <Link to="/login" className="w-auto min-w-[100px] inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-2.5 rounded-md bg-white/10 text-white font-semibold backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-sm">
                  Login to Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- ABOUT SECTION --- */}
      <section className="py-12 sm:py-14 bg-white px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">About <span className="text-brand-blue">SkillBridge</span></h2>
            <p className="text-base text-slate-600 max-w-4xl mx-auto leading-relaxed">
              <span className="font-bold text-slate-800">SkillBridge</span> is a platform built under the <span className="text-brand-blue font-bold">PM Internship Scheme</span>, harnessing Artificial Intelligence to connect students with the right internship opportunities. Our mission is to reduce inefficiency, eliminate bias, and empower both students and companies with smarter, data-driven solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Mission Card */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div className="h-12 w-12 bg-brand-blue rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                <Target size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Our Mission</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                To revolutionize internship allocation by leveraging <strong>AI-driven recomandation and allocation</strong>, ensuring every student finds the right opportunity and every company connects with the best talent, upholding equity and national priorities.
              </p>
            </div>

            {/* Vision Card */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div className="h-12 w-12 bg-brand-orange rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                <Eye size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Our Vision</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                To become India's leading AI-driven platform for talent placement, actively supporting the nation's <strong>Skill Development Mission</strong> and empowering the youth for a brighter, more competitive future.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- BUILDERS SECTION (Team) --- */}
      <section className="py-16 bg-slate-50 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Meet Our Builders</h2>
            <div className="w-16 h-1 bg-brand-blue mx-auto mt-3 rounded-full"></div>
            <p className="text-slate-500 mt-3 text-sm">The minds behind the AI Architecture</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center group">
                {/* Avatar with Ring */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-brand-blue/10 rounded-full scale-110 group-hover:scale-125 transition-transform duration-300"></div>
                  <img 
                    src={member.img} 
                    alt={member.name} 
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-full relative z-10 border-4 border-white shadow-sm"
                  />
                </div>
                
                {/* Info */}
                <h3 className="text-xl font-bold text-slate-900 mb-1">{member.name}</h3>
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full mb-6">
                  {member.role}
                </span>

                {/* Connect Button */}
                <button className="flex items-center gap-2 text-brand-blue font-semibold text-sm border border-brand-blue/20 px-6 py-2 rounded-lg hover:bg-brand-blue hover:text-white transition-colors w-full justify-center">
                  <Linkedin size={16} /> Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- STATS / CTA --- */}
      <section className="bg-[#0F3B8C] py-14 sm:py-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Decorative Background Circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-orange/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">Ready to start your journey?</h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of students and companies transforming the internship landscape of India.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 sm:mb-12 text-white border-t border-white/10 pt-10">
            <div>
              <div className="text-4xl font-bold mb-1">1M+</div>
              <div className="text-blue-200 text-sm">Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">500+</div>
              <div className="text-blue-200 text-sm">Corporates</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">98%</div>
              <div className="text-blue-200 text-sm">Match Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">24/7</div>
              <div className="text-blue-200 text-sm">AI Support</div>
            </div>
          </div>

          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-brand-blue font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
            Register Now <ArrowRight size={20} />
          </Link>
        </div>
      </section>

    </div>
  );
}