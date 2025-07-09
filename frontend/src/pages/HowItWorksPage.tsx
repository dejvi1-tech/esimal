import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Smartphone, 
  Download, 
  Wifi, 
  Globe, 
  Shield, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Play,
  Star,
  Users,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const phoneImages = [
  // Replace these URLs with your actual assets if available
  '/images/step1-phone.png', // Plan selection
  '/images/step2-qr.png',    // QR code
  '/images/step3-connected.png' // Connected/beach
];

const HowItWorksPage = () => {
  const { t } = useLanguage();

  const processSteps = [
    {
      step: "01",
      icon: Download,
      title: "Choose a plan",
      description: "Buy the plan that suits you.",
      image: '',
    },
    {
      step: "02", 
      icon: Smartphone,
      title: "Scan QR code or install automatically from the app",
      description: "QR Code will be sent to your app and email.",
      image: '',
    },
    {
      step: "03",
      icon: Wifi, 
      title: "You're connected to the world!",
      description: "After activation, congratulations you're equipped with super internet.",
      image: '',
    }
  ];

  const features = [
    {
      icon: Zap,
      title: "Instant Activation",
      description: "No waiting time - your eSIM is ready to use immediately after purchase"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Bank-level security with encrypted connections and 24/7 support"
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description: "Connect in 190+ countries with our extensive network of partners"
    },
    {
      icon: Users,
      title: "24/7 Support",
      description: "Round-the-clock customer support in multiple languages"
    }
  ];

  const compatibleDevices = [
    { name: "iPhone 14 Pro", brand: "Apple", year: "2022+" },
    { name: "Samsung Galaxy S23", brand: "Samsung", year: "2023+" },
    { name: "Google Pixel 7", brand: "Google", year: "2022+" },
    { name: "iPad Pro", brand: "Apple", year: "2021+" },
    { name: "MacBook Pro", brand: "Apple", year: "2020+" },
    { name: "Surface Pro", brand: "Microsoft", year: "2021+" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Business Traveler",
      content: "e-SimFly made my international trips so much easier. No more hunting for local SIM cards!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Digital Nomad", 
      content: "The instant activation and global coverage are game-changers for my remote work lifestyle.",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      role: "Tourist",
      content: "Perfect for my European vacation. Connected immediately in every country I visited.",
      rating: 5
    }
  ];

  return (
    <>
      <Helmet>
        <title>How It Works | e-SimFly - Global eSIM Solutions</title>
        <meta name="description" content="Learn how e-SimFly's eSIM technology works. Simple 4-step process to get connected globally in minutes." />
      </Helmet>
      
      <div className="pt-16">
        {/* Hero Section: Full-width image provided by user */}
        <section className="relative py-12 md:py-20 bg-gradient-to-br from-purple-900/40 via-blue-900/20 to-indigo-900/10 flex flex-col justify-center items-center">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-10 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            How does e-SimFly work?
          </h1>
          <div className="w-full flex justify-center">
            <picture>
              <source srcSet="/optimized/images/phone-mockup.webp" type="image/webp" />
              <img
                src="/optimized/images/phone-mockup.png"
                alt="How it works steps"
                className="w-full max-w-5xl rounded-3xl shadow-2xl object-contain border-4 border-white/10"
                style={{ background: 'rgba(30, 22, 54, 0.9)' }}
              />
            </picture>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-20">
          <div className="container mx-auto px-4 flex flex-col items-center justify-center">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Simple 3-Step Process
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                From purchase to connection in under 5 minutes
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full max-w-5xl">
              {processSteps.slice(0, 3).map((step, index) => (
                <div key={index} className="relative group flex-1 max-w-sm">
                  {/* Step Number */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg z-10 border-4 border-purple-800">
                    {`0${index + 1}`}
                  </div>
                  <div className="flex flex-col items-center justify-center bg-white/5 border border-white/20 rounded-2xl shadow-lg px-8 pt-12 pb-8 min-h-[320px]">
                    <div className="w-16 h-16 mb-6 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-white text-center">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-center">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-indigo-900/10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Why Choose e-SimFly?
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Experience the future of global connectivity
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="glass border-white/20 hover:border-white/40 transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                      <feature.icon className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-white">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="glass border-white/20 rounded-3xl p-12 text-center max-w-4xl mx-auto">
              <Award className="w-16 h-16 mx-auto mb-6 text-blue-400" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Ready to Go Global?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join millions of travelers who trust e-SimFly for their global connectivity needs. 
                Get started today and experience seamless worldwide internet access.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="btn-glass bg-accent text-accent-foreground font-semibold">
                  Browse eSIM Plans
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="glass">
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HowItWorksPage;