import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Ticket,
  Brain,
  Mic,
  FileText,
  Radio,
  Languages,
  Map,
  ShieldCheck
} from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const { t, language } = useLanguage();

  const features = [
    {
      icon: Map,
      title: language === 'mr' ? 'संपूर्ण भारत कव्हरेज' : 'Nationwide Network',
      description: language === 'mr' ? '२८ राज्ये आणि ८ केंद्रशासित प्रदेशांमध्ये उपलब्ध.' : 'Unified access across 28 States and 8 Union Territories.',
      gradient: 'from-orange-500/10 to-orange-600/5',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200/50'
    },
    {
      icon: Ticket,
      title: t.features.onlineToken.title,
      description: t.features.onlineToken.description,
      gradient: 'from-blue-500/10 to-blue-600/5',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200/50'
    },
    {
      icon: Brain,
      title: t.features.aiPrediction.title,
      description: t.features.aiPrediction.description,
      gradient: 'from-purple-500/10 to-purple-600/5',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200/50'
    },
    {
      icon: Mic,
      title: t.features.voiceAssistant.title,
      description: t.features.voiceAssistant.description,
      gradient: 'from-green-500/10 to-green-600/5',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200/50'
    },
    {
      icon: FileText,
      title: t.features.schemes.title,
      description: t.features.schemes.description,
      gradient: 'from-yellow-500/10 to-yellow-600/5',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200/50'
    },
    {
      icon: ShieldCheck,
      title: language === 'mr' ? 'सुरक्षित आणि पारदर्शक' : 'Secure & Transparent',
      description: language === 'mr' ? 'आधार-लिंक्ड व्हेरिफिकेशन आणि रिअल-टाइम ट्रॅकिंग.' : 'Aadhaar-linked verification and real-time status tracking.',
      gradient: 'from-teal-500/10 to-teal-600/5',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-200/50'
    },
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 mb-6">
            {t.features.title}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t.features.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`group relative overflow-hidden border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${feature.borderColor} bg-card/50 backdrop-blur-sm`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <CardContent className="p-8 relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-background shadow-sm border border-border/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
