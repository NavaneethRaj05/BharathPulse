import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { pageVariants, pageTransition } from '../animations/variants';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full py-16 lg:py-24 overflow-hidden">
        {/* Soft pastel gradient background on the left */}
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-pink-100/60 via-blue-50/50 to-white -z-10 blur-2xl" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-['Dancing_Script',cursive] text-2xl text-gray-600 mb-4 italic">
              Connecting Citizens to a Prosperous City
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1e3a5f] leading-tight mb-6">
              BHARATHPULSE COMPLAINT MANAGEMENT PORTAL
            </h1>
            <p className="text-gray-600 mb-8 text-sm md:text-base leading-relaxed">
              The mission of BharathPulse is to advance public safety, general prosperity, and long-term vitality of our residents by targeting civic issues and other assistance to foster a better environment and attraction of new business and the retention of existing business.
            </p>
            <button 
              onClick={() => navigate('/about')}
              className="bg-[#f5a623] hover:bg-[#e09612] text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all"
            >
              Learn More About BharathPulse
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <img 
              src="https://images.unsplash.com/photo-1477959858617-67f85115249c?q=80&w=800&auto=format&fit=crop" 
              alt="Cityscape" 
              className="rounded-2xl shadow-xl h-64 object-cover w-full"
            />
            <img 
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop" 
              alt="Community Building" 
              className="rounded-2xl shadow-xl h-64 object-cover w-full md:w-3/4 ml-auto"
            />
          </div>
        </div>
      </section>

      {/* Action Section */}
      <section className="bg-white py-16 lg:py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Left Text */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] mb-6 leading-tight">
              Join us For a Safer and Cleaner Environment with BharathPulse
            </h2>
            <div className="space-y-4 mb-8">
              <p className="text-sm text-gray-700 font-semibold flex items-center gap-2">
                <span className="text-red-500">📍</span> At Your Local Government Hub
              </p>
              <p className="text-sm text-gray-700 font-semibold flex items-center gap-2">
                <span className="text-red-500">📅</span> Available 24/7
              </p>
            </div>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Join the <strong>BharathPulse Issue Resolution Portal</strong> for an engaging and informative way to report issues that impact our community. Hear from leaders and citizens representing diverse roles across the city as they discuss important topics that support economic growth, job creation, and revitalization efforts.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Whether you're a business owner, resident, or community leader, this platform offers valuable insight into the strategies shaping our region's future.
            </p>
          </div>

          {/* Right Form & Map */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-gray-100">
              <div className="space-y-4">
                <input type="text" placeholder="Name" className="w-full px-4 py-3 rounded border border-gray-300 focus:outline-none focus:border-[#f5a623] text-sm" />
                <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded border border-gray-300 focus:outline-none focus:border-[#f5a623] text-sm" />
                <input type="text" placeholder="Phone Number" className="w-full px-4 py-3 rounded border border-gray-300 focus:outline-none focus:border-[#f5a623] text-sm" />
                <textarea placeholder="Message / Issue Description" rows="4" className="w-full px-4 py-3 rounded border border-gray-300 focus:outline-none focus:border-[#f5a623] text-sm resize-none" />
                <button 
                  onClick={() => navigate('/submit')}
                  className="w-full bg-[#f5a623] hover:bg-[#e09612] text-white font-bold py-3 rounded shadow-lg transition-all"
                >
                  Submit Official Report
                </button>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200 h-64 relative">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1m3!1d193595.2528000654!2d-74.1444874457319!3d40.69763123332468!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY!5e0!3m2!1sen!2sus!4v1714000000000!5m2!1sen!2sus" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy"
                title="Google Maps Location"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative w-full aspect-square max-w-md mx-auto">
            <div className="w-full h-full rounded-full overflow-hidden border-8 border-white shadow-2xl relative">
              <img 
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&auto=format&fit=crop" 
                alt="People working" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <p className="font-['Dancing_Script',cursive] text-2xl text-gray-600 mb-2 italic">
              Who We Are
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] mb-6 leading-tight">
              About The BharathPulse Development Agency
            </h2>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed font-semibold">
              The mission of the BharathPulse Agency is to advance the job opportunities, general prosperity and long-term economic vitality of our residents by targeting civic improvements and other assistance to foster creation and attraction of new business.
            </p>
            <p className="text-gray-600 text-sm mb-8 leading-relaxed">
              We focus on ensuring that our communities remain safe, engaging, and robust. By targeting resources toward repairing infrastructure, supporting local initiatives, and empowering citizens to speak up, we build a foundation for long-term growth and success.
            </p>
            <button 
              onClick={() => navigate('/about')}
              className="bg-[#f5a623] hover:bg-[#e09612] text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="bg-[#f8fafd] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="font-['Dancing_Script',cursive] text-2xl text-gray-600 mb-2 italic">
            Checkout Our
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] mb-12 leading-tight">
            Projects & Initiatives
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
              <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop" alt="Project 1" className="w-full h-48 object-cover" />
              <div className="p-6 text-left">
                <h3 className="font-bold text-[#1e3a5f] text-lg mb-2">Downtown Revitalization</h3>
                <p className="text-gray-600 text-xs">A comprehensive approach to renewing the main street areas.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
              <img src="https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=600&auto=format&fit=crop" alt="Project 2" className="w-full h-48 object-cover" />
              <div className="p-6 text-left">
                <h3 className="font-bold text-[#1e3a5f] text-lg mb-2">Infrastructure Repair</h3>
                <p className="text-gray-600 text-xs">Addressing critical road and bridge safety concerns across the county.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
              <img src="https://images.unsplash.com/photo-1506869640319-fea1a27536d0?q=80&w=600&auto=format&fit=crop" alt="Project 3" className="w-full h-48 object-cover" />
              <div className="p-6 text-left">
                <h3 className="font-bold text-[#1e3a5f] text-lg mb-2">Green Energy Solutions</h3>
                <p className="text-gray-600 text-xs">Promoting sustainable energy for public facilities.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
