import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, MapPin, Building2, Search, ArrowRight } from 'lucide-react';
import { useStates, useDistricts, useCities, useOfficesByCity, useServices } from '@/hooks/useMasterData';
import AshokaLoader from '@/components/ui/AshokaLoader';

const HeroSection: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');

  const { data: states = [], isLoading: loadingStates } = useStates();
  const { data: districts = [], isLoading: loadingDistricts } = useDistricts(selectedState);
  const { data: cities = [], isLoading: loadingCities } = useCities(selectedDistrict);
  const { data: offices = [], isLoading: loadingOffices } = useOfficesByCity(selectedCity);
  const { data: services = [], isLoading: loadingServices } = useServices(selectedOffice);

  const handleSearch = () => {
    if (selectedOffice && selectedService) {
      // Navigate to book token page with pre-filled data
      navigate('/citizen/book-token', {
        state: {
          prefilled: {
            state: selectedState,
            district: selectedDistrict,
            city: selectedCity,
            office: selectedOffice,
            service: selectedService
          }
        }
      });
    } else {
      navigate('/login');
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-grid-white/5 bg-[size:30px_30px] [mask-image:radial-gradient(white,transparent_85%)]" />

      {/* Indian Flag Gradient Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="container relative z-10 px-4 pt-20 pb-12">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left space-y-6">
            <Badge variant="outline" className="px-4 py-1.5 text-sm border-primary/20 bg-primary/5 text-primary backdrop-blur-sm animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 mr-2 text-orange-500" />
              {language === 'mr' ? 'नवीन: संपूर्ण भारत कव्हरेज' : 'New: Pan-India Coverage'}
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-foreground to-green-600">
                JanSeva
              </span>
              <br />
              Queue System
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              {language === 'mr'
                ? 'भारताची एकीकृत टोकन आणि अपॉइंटमेंट प्रणाली. रांग टाळा, वेळ वाचवा.'
                : "India's Unified Token & Appointment System. Skip the queue, save time, and access government services effortlessly."}
            </p>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
              <Button size="lg" className="h-12 px-8 text-lg shadow-lg shadow-primary/25 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-0" onClick={() => navigate('/login')}>
                {language === 'mr' ? 'आत्ताच बुक करा' : 'Book Token Now'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg border-2 hover:bg-accent/50" onClick={() => navigate('/schemes')}>
                {language === 'mr' ? 'योजना शोधा' : 'Explore Schemes'}
              </Button>
            </div>

            <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>Live in 28 States</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <span>10M+ Citizens Served</span>
              </div>
            </div>
          </div>

          {/* Right Card (Search) */}
          <div className="flex-1 w-full max-w-md lg:max-w-lg">
            <Card className="border-border/50 shadow-2xl backdrop-blur-xl bg-card/80">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2 mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {language === 'mr' ? 'कार्यालय शोधा' : 'Find Government Office'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'mr' ? 'तुमच्या जवळचे कार्यालय शोधण्यासाठी खालील तपशील निवडा' : 'Select details below to find nearest office'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground ml-1">State</label>
                    <Select onValueChange={setSelectedState} value={selectedState}>
                      <SelectTrigger className="h-12 bg-background/50">
                        <SelectValue placeholder={loadingStates ? "Loading..." : "Select State"} />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.state_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground ml-1">District</label>
                      <Select onValueChange={setSelectedDistrict} value={selectedDistrict} disabled={!selectedState}>
                        <SelectTrigger className="h-12 bg-background/50">
                          <SelectValue placeholder={loadingDistricts ? "Loading..." : "District"} />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map((d: any) => (
                            <SelectItem key={d.id} value={d.id}>{d.district_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground ml-1">City</label>
                      <Select onValueChange={setSelectedCity} value={selectedCity} disabled={!selectedDistrict}>
                        <SelectTrigger className="h-12 bg-background/50">
                          <SelectValue placeholder={loadingCities ? "Loading..." : "City"} />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>{c.city_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground ml-1">Office</label>
                    <Select onValueChange={setSelectedOffice} value={selectedOffice} disabled={!selectedCity}>
                      <SelectTrigger className="h-12 bg-background/50">
                        <SelectValue placeholder={loadingOffices ? "Loading..." : "Select Office"} />
                      </SelectTrigger>
                      <SelectContent>
                        {offices.map((o: any) => (
                          <SelectItem key={o.id} value={o.id}>{o.office_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground ml-1">Service</label>
                    <Select onValueChange={setSelectedService} value={selectedService} disabled={!selectedOffice}>
                      <SelectTrigger className="h-12 bg-background/50">
                        <SelectValue placeholder={loadingServices ? "Loading..." : "Select Service"} />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.service_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full h-12 text-lg mt-4 bg-primary hover:bg-primary/90"
                    disabled={!selectedService}
                    onClick={handleSearch}
                  >
                    <Search className="h-5 w-5 mr-2" />
                    {language === 'mr' ? 'बुक करा' : 'Book Appointment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
