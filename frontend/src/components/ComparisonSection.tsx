import { motion } from "motion/react";
import { Check, X, Zap, DollarSign, Globe, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ComparisonSection = () => {
  const comparisonData = [
  {
    feature: "Setup Time",
    esim: "Instant",
    traditional: "Store visit required",
    roaming: "Already active"
  },
  {
    feature: "Daily Cost",
    esim: "$1-3",
    traditional: "$5-15",
    roaming: "$10-50"
  },
  {
    feature: "Data Speed",
    esim: "4G/5G Full Speed",
    traditional: "Full Speed",
    roaming: "Carrier dependent"
  },
  {
    feature: "Coverage",
    esim: "200+ Countries",
    traditional: "Single country",
    roaming: "Home carrier only"
  },
  {
    feature: "No Contract",
    esim: "Yes",
    traditional: "Sometimes",
    roaming: "Yes"
  },
  {
    feature: "Physical Card",
    esim: "Not required",
    traditional: "Required",
    roaming: "Not required"
  },
  {
    feature: "Hidden Fees",
    esim: "None",
    traditional: "Activation fees",
    roaming: "High overage charges"
  },
  {
    feature: "Support",
    esim: "24/7",
    traditional: "Store hours",
    roaming: "Carrier support"
  }];


  const benefits = [
  {
    icon: Zap,
    title: "Instant Activation",
    description: "Connect immediately after purchase",
    color: "yellow"
  },
  {
    icon: DollarSign,
    title: "Cost Effective",
    description: "Save up to 90% vs roaming",
    color: "green"
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "One solution for worldwide travel",
    color: "blue"
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Enterprise-grade network security",
    color: "purple"
  }];


  const getResultIcon = (category: 'best' | 'good' | 'poor') => {
    switch (category) {
      case 'best':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'good':
        return <Check className="w-5 h-5 text-blue-600" />;
      case 'poor':
        return <X className="w-5 h-5 text-red-500" />;
    }
  };

  const getResultCategory = (value: string) => {
    if (value.includes('Instant') || value.includes('$1-3') || value.includes('4G/5G Full') || value.includes('200+') || value.includes('Yes') || value.includes('Not required') || value.includes('None') || value.includes('24/7')) {
      return 'best';
    } else if (value.includes('Already') || value.includes('Full Speed') || value.includes('Carrier')) {
      return 'good';
    }
    return 'poor';
  };

  const getColorClasses = (color: string) => {
    const colors = {
      yellow: "bg-yellow-100 text-yellow-600",
      green: "bg-green-100 text-green-600",
      blue: "bg-blue-100 text-blue-600",
      purple: "bg-purple-100 text-purple-600"
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
            Why Choose eSIM Over Alternatives?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Compare eSIM technology with traditional solutions and see why millions of travelers are making the switch.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mb-16">
          <Card className="overflow-hidden shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-8">
              <CardTitle className="text-2xl md:text-3xl font-bold">
                Complete Solution Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-4 font-semibold text-gray-900 bg-gray-50">Feature</th>
                      <th className="text-center p-4 font-semibold bg-green-50">
                        <div className="flex flex-col items-center">
                          <Badge className="bg-green-600 text-white mb-2">Recommended</Badge>
                          <span className="text-green-700">eSIM</span>
                        </div>
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-700 bg-gray-50">Traditional SIM</th>
                      <th className="text-center p-4 font-semibold text-gray-700 bg-gray-50">Roaming</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, index) =>
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{row.feature}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {getResultIcon(getResultCategory(row.esim))}
                            <span className="text-gray-700">{row.esim}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {getResultIcon(getResultCategory(row.traditional))}
                            <span className="text-gray-700">{row.traditional}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {getResultIcon(getResultCategory(row.roaming))}
                            <span className="text-gray-700">{row.roaming}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Benefits */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-900">
            Key Advantages of eSIM Technology
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) =>
            <div
              key={index}
              className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${getColorClasses(benefit.color)}`}>
                  <benefit.icon className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2 text-gray-900">{benefit.title}</h4>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cost Savings Calculator */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl p-8 text-white max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">
              💰 Average Savings: $127 per Trip
            </h3>
            <p className="text-green-100 text-lg mb-6">
              Based on a 7-day international trip with 2GB daily usage compared to traditional roaming charges.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold">$15</div>
                <div className="text-green-100">eSIM Cost</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold">$142</div>
                <div className="text-green-100">Roaming Cost</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold">90%</div>
                <div className="text-green-100">Savings</div>
              </div>
            </div>
            
            <button className="bg-white text-green-600 font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-colors text-lg">
              Calculate Your Savings
            </button>
          </div>
        </div>
      </div>
    </section>);

};

export default ComparisonSection;