import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, CheckCircle, Smartphone, Globe, Shield } from 'lucide-react';

const CTASection: React.FC = () => {
  const { language } = useLanguage();

  const benefits = language === 'mr' ? [
    'आधार-लिंक्ड सुरक्षित लॉगिन',
    'रिअल-टाइम ट्रॅकिंग',
    '२४/७ उपलब्धता',
    'सर्व शासकीय सेवा एकाच ठिकाणी',
  ] : [
    'Aadhaar-linked Secure Login',
    'Real-time Status Tracking',
    '24/7 Availability',
    'Unified Service Access',
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-green-600/90" />

      {/* Texture */}
      <div className="absolute inset-0 bg-hero-pattern opacity-10 mix-blend-overlay" />

      {/* Floating Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-5xl mx-auto bg-white/5 backdrop-blur-md rounded-3xl p-8 md:p-16 border border-white/20 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] animate-shimmer" />

          <div className="relative flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-md">
                {language === 'mr'
                  ? 'जनसेवा सोबत डिजिटल भारताचा अनुभव घ्या'
                  : 'Experience Digital India with JanSeva'}
              </h2>

              <p className="text-xl text-white/90 leading-relaxed font-light">
                {language === 'mr'
                  ? 'रांगांचा त्रास विसरा. घरबसल्या सर्व सरकारी सेवांचा लाभ घ्या.'
                  : 'Join millions of citizens who strictly skip the queue. Book tokens, track status, and access services from your home.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-white/90 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link to="/login">
                  <Button size="xl" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/20 border-0 text-lg font-bold h-14 px-8 transition-transform hover:scale-105">
                    {language === 'mr' ? 'आता सुरू करा' : 'Get Started Now'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="xl" variant="outline" className="w-full sm:w-auto border-2 border-white/30 text-white hover:bg-white/10 hover:border-white h-14 px-8 text-lg backdrop-blur-sm transition-all">
                    {language === 'mr' ? 'अधिक जाणून घ्या' : 'Learn More'}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Side */}
            <div className="hidden md:block w-80 relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-[2.5rem] transform rotate-3 scale-95 transition-transform group-hover:rotate-6" />
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-6 relative shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-transform duration-500 ease-out">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">Secure Access</p>
                      <p className="text-xs text-white/70">Verified by Gov. of India</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
                      <Globe className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">10+ Languages</p>
                      <p className="text-xs text-white/70">Multilingual Support</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                      <Smartphone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">Mobile First</p>
                      <p className="text-xs text-white/70">Accessible Anywhere</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Circle */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-orange-400/20 rounded-full blur-xl" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-green-400/20 rounded-full blur-xl" />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
