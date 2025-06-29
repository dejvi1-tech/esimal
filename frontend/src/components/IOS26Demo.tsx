import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Globe, 
  Wifi, 
  Shield, 
  Star, 
  Download,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const IOS26Demo = () => {
  return (
    <div className="min-h-screen p-8 space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="glass p-8 rounded-2xl max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-4">
            iOS 26 Liquid Glass Theme
          </h1>
          <p className="text-xl text-gray-200 mb-8">
            Modern glassmorphism design with fixed purple background and no animations
          </p>
          <div className="flex gap-4 justify-center">
            <Button className="btn-glass bg-accent text-accent-foreground">
              <Download className="w-4 h-4" />
              Get Started
            </Button>
            <Button className="btn-glass">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <Card className="card-glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="glass-light p-2 rounded-lg">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">eSIM Technology</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-200">
              Instant activation with no physical SIM card required. 
              Connect to networks worldwide in seconds.
            </p>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="glass-light p-2 rounded-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Global Coverage</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-200">
              Access to 190+ countries with reliable network coverage 
              and high-speed data connections.
            </p>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="glass-light p-2 rounded-lg">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">High Speed Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-200">
              5G and 4G LTE networks with unlimited data plans 
              for seamless browsing and streaming.
            </p>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="glass-light p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Secure Connection</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-200">
              Military-grade encryption and secure protocols 
              to protect your data and privacy.
            </p>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="glass-light p-2 rounded-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Premium Support</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-200">
              24/7 customer support with dedicated agents 
              ready to help with any questions or issues.
            </p>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="glass-light p-2 rounded-lg">
                <Download className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Instant Setup</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-200">
              Download and activate your eSIM in minutes. 
              No waiting, no shipping, no hassle.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Contact Form */}
      <section className="max-w-2xl mx-auto">
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-white text-center">Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-200 mb-2 block">
                  First Name
                </label>
                <Input 
                  className="input-glass" 
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-200 mb-2 block">
                  Last Name
                </label>
                <Input 
                  className="input-glass" 
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200 mb-2 block">
                Email
              </label>
              <Input 
                className="input-glass" 
                type="email"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200 mb-2 block">
                Message
              </label>
              <textarea 
                className="input-glass w-full h-32 resize-none"
                placeholder="Enter your message"
              />
            </div>
            <Button className="btn-glass bg-accent text-accent-foreground w-full">
              Send Message
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Stats Section */}
      <section className="max-w-4xl mx-auto">
        <div className="glass p-8 rounded-2xl">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Our Numbers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">1M+</div>
              <div className="text-gray-200">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">190+</div>
              <div className="text-gray-200">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">24/7</div>
              <div className="text-gray-200">Support</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">99.9%</div>
              <div className="text-gray-200">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="max-w-4xl mx-auto">
        <div className="glass p-8 rounded-2xl">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Get in Touch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="glass-light p-3 rounded-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white">Email</div>
                <div className="text-gray-200">support@esimfly.com</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="glass-light p-3 rounded-lg">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white">Phone</div>
                <div className="text-gray-200">+1 (555) 123-4567</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="glass-light p-3 rounded-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white">Address</div>
                <div className="text-gray-200">San Francisco, CA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Badges Demo */}
      <section className="max-w-2xl mx-auto">
        <div className="glass p-8 rounded-2xl">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            Available Plans
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Badge className="glass-light text-white">Europe</Badge>
            <Badge className="glass-light text-white">Asia</Badge>
            <Badge className="glass-light text-white">Americas</Badge>
            <Badge className="glass-light text-white">Africa</Badge>
            <Badge className="glass-light text-white">Oceania</Badge>
            <Badge className="bg-accent text-accent-foreground">Most Popular</Badge>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IOS26Demo; 