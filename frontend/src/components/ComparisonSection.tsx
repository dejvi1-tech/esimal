import { motion } from "motion/react";
import { Check, X, Zap, DollarSign, Globe, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ComparisonSection = () => {
  const comparisonData = [
  {
    feature: "Setup Time",
    esim: "Instant (QR Code)",
    traditional: "Store visit required",
    roaming: "Already active"
  },
  {
    feature: "Cost per Day",
    esim: "$1-3 per day",
    traditional: "$5-15 per day",
    roaming: "$10-50 per day"
  },
  {
    feature: "Data Speed",
    esim: "4G/5G Full Speed",
    traditional: "4G/5G Full Speed",
    roaming: "Often throttled"
  },
  {
    feature: "Coverage",
    esim: "200+ countries",
    traditional: "Local only",
    roaming: "Limited countries"
  },
  {
    feature: "Multiple Plans",
    esim: "Yes - Easy switching",
    traditional: "No",
    roaming: "No"
  },
  {
    feature: "Physical Card",
    esim: "Not required",
    traditional: "Required",
    roaming: "Not required"
  },
  {
    feature: "Language Barrier",
    esim: "None (Online)",
    traditional: "Potential issue",
    roaming: "None"
  },
  {
    feature: "Activation Support",
    esim: "24/7 Online",
    traditional: "Store hours only",
    roaming: "Carrier support"
  }];


  const benefits = [
  {
    icon: Zap,
    title: "Instant Activation",
    description: "Get connected in minutes, not hours",
    color: "yellow"
  },
  {
    icon: DollarSign,
    title: "Cost Effective",
    description: "Save up to 90% vs roaming charges",
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
        return <Check className="w-5 h-5 text-green-600" data-id="74z1yg6lw" data-path="src/components/ComparisonSection.tsx" />;
      case 'good':
        return <Check className="w-5 h-5 text-blue-600" data-id="cyvheporc" data-path="src/components/ComparisonSection.tsx" />;
      case 'poor':
        return <X className="w-5 h-5 text-red-500" data-id="6o8e08ml0" data-path="src/components/ComparisonSection.tsx" />;
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
    <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30" data-id="s4yxmtm8d" data-path="src/components/ComparisonSection.tsx">
      <div className="container mx-auto px-4" data-id="zcx2he6ue" data-path="src/components/ComparisonSection.tsx">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16" data-id="tbrsmom7r" data-path="src/components/ComparisonSection.tsx">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent" data-id="zj1o6q0rx" data-path="src/components/ComparisonSection.tsx">
            Why Choose eSIM Over Alternatives?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-id="80uq8pmps" data-path="src/components/ComparisonSection.tsx">
            Compare eSIM technology with traditional solutions and see why millions of travelers are making the switch.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16" data-id="r1549uzw4" data-path="src/components/ComparisonSection.tsx">
          <Card className="overflow-hidden shadow-xl border-0" data-id="d965fathz" data-path="src/components/ComparisonSection.tsx">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-8" data-id="d836gmysl" data-path="src/components/ComparisonSection.tsx">
              <CardTitle className="text-2xl md:text-3xl font-bold" data-id="gojpbvnhz" data-path="src/components/ComparisonSection.tsx">
                Complete Solution Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0" data-id="bperombaj" data-path="src/components/ComparisonSection.tsx">
              <div className="overflow-x-auto" data-id="yr6w9lv5p" data-path="src/components/ComparisonSection.tsx">
                <table className="w-full" data-id="416krfi2y" data-path="src/components/ComparisonSection.tsx">
                  <thead data-id="c736rxq23" data-path="src/components/ComparisonSection.tsx">
                    <tr className="border-b border-gray-200" data-id="uuxjslhji" data-path="src/components/ComparisonSection.tsx">
                      <th className="text-left p-4 font-semibold text-gray-900 bg-gray-50" data-id="gpk7prk5x" data-path="src/components/ComparisonSection.tsx">Feature</th>
                      <th className="text-center p-4 font-semibold bg-green-50" data-id="8cgybozk6" data-path="src/components/ComparisonSection.tsx">
                        <div className="flex flex-col items-center" data-id="o0x0urzmq" data-path="src/components/ComparisonSection.tsx">
                          <Badge className="bg-green-600 text-white mb-2" data-id="7ne5a40wg" data-path="src/components/ComparisonSection.tsx">Recommended</Badge>
                          <span className="text-green-700" data-id="ej6p5hy93" data-path="src/components/ComparisonSection.tsx">eSIM</span>
                        </div>
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-700 bg-gray-50" data-id="49y9wbyfm" data-path="src/components/ComparisonSection.tsx">Traditional SIM</th>
                      <th className="text-center p-4 font-semibold text-gray-700 bg-gray-50" data-id="0gfiigs4u" data-path="src/components/ComparisonSection.tsx">Roaming</th>
                    </tr>
                  </thead>
                  <tbody data-id="klltc6i9f" data-path="src/components/ComparisonSection.tsx">
                    {comparisonData.map((row, index) =>
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.5 }}
                      viewport={{ once: true }}
                      className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors" data-id="zshhi4jh8" data-path="src/components/ComparisonSection.tsx">
                        <td className="p-4 font-medium text-gray-900" data-id="jsvx0s489" data-path="src/components/ComparisonSection.tsx">{row.feature}</td>
                        <td className="p-4 text-center" data-id="k9j8cvkm8" data-path="src/components/ComparisonSection.tsx">
                          <div className="flex items-center justify-center space-x-2" data-id="fwiqjznip" data-path="src/components/ComparisonSection.tsx">
                            {getResultIcon(getResultCategory(row.esim))}
                            <span className="text-gray-700" data-id="mq2tuxh93" data-path="src/components/ComparisonSection.tsx">{row.esim}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center" data-id="xge9y5fdr" data-path="src/components/ComparisonSection.tsx">
                          <div className="flex items-center justify-center space-x-2" data-id="laahoiqq8" data-path="src/components/ComparisonSection.tsx">
                            {getResultIcon(getResultCategory(row.traditional))}
                            <span className="text-gray-700" data-id="tu0g91cl4" data-path="src/components/ComparisonSection.tsx">{row.traditional}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center" data-id="5r2h5uhi0" data-path="src/components/ComparisonSection.tsx">
                          <div className="flex items-center justify-center space-x-2" data-id="pt844tnus" data-path="src/components/ComparisonSection.tsx">
                            {getResultIcon(getResultCategory(row.roaming))}
                            <span className="text-gray-700" data-id="j6yumiwhc" data-path="src/components/ComparisonSection.tsx">{row.roaming}</span>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16" data-id="hd109w074" data-path="src/components/ComparisonSection.tsx">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-900" data-id="csnzausfu" data-path="src/components/ComparisonSection.tsx">
            Key Advantages of eSIM Technology
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" data-id="trcom5fln" data-path="src/components/ComparisonSection.tsx">
            {benefits.map((benefit, index) =>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" data-id="r42u7wpb1" data-path="src/components/ComparisonSection.tsx">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${getColorClasses(benefit.color)}`} data-id="ekln4627y" data-path="src/components/ComparisonSection.tsx">
                  <benefit.icon className="w-8 h-8" data-id="rr9jbwhfd" data-path="src/components/ComparisonSection.tsx" />
                </div>
                <h4 className="text-xl font-bold mb-2 text-gray-900" data-id="hqwbgtu9m" data-path="src/components/ComparisonSection.tsx">{benefit.title}</h4>
                <p className="text-gray-600" data-id="2vk1b3p06" data-path="src/components/ComparisonSection.tsx">{benefit.description}</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Cost Savings Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center" data-id="7a87dj81j" data-path="src/components/ComparisonSection.tsx">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl p-8 text-white max-w-4xl mx-auto" data-id="z9nnv7tdb" data-path="src/components/ComparisonSection.tsx">
            <h3 className="text-3xl font-bold mb-4" data-id="j0oxamsuc" data-path="src/components/ComparisonSection.tsx">
              💰 Average Savings: $127 per Trip
            </h3>
            <p className="text-green-100 text-lg mb-6" data-id="8igytudgc" data-path="src/components/ComparisonSection.tsx">
              Based on a 7-day international trip with 2GB daily usage compared to traditional roaming charges.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8" data-id="vx8g4z6kv" data-path="src/components/ComparisonSection.tsx">
              <div className="bg-white/10 rounded-xl p-4" data-id="rd03tv2a8" data-path="src/components/ComparisonSection.tsx">
                <div className="text-2xl font-bold" data-id="h06kr9pgc" data-path="src/components/ComparisonSection.tsx">$15</div>
                <div className="text-green-100" data-id="u42oy2cjj" data-path="src/components/ComparisonSection.tsx">eSIM Cost</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4" data-id="vwmifrd5v" data-path="src/components/ComparisonSection.tsx">
                <div className="text-2xl font-bold" data-id="oxyraaqlm" data-path="src/components/ComparisonSection.tsx">$142</div>
                <div className="text-green-100" data-id="m0s0zlcyz" data-path="src/components/ComparisonSection.tsx">Roaming Cost</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4" data-id="093ibz0uj" data-path="src/components/ComparisonSection.tsx">
                <div className="text-2xl font-bold" data-id="wci7hjtbg" data-path="src/components/ComparisonSection.tsx">90%</div>
                <div className="text-green-100" data-id="29mubk862" data-path="src/components/ComparisonSection.tsx">Savings</div>
              </div>
            </div>
            
            <button className="bg-white text-green-600 font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-colors text-lg" data-id="x8cu635x7" data-path="src/components/ComparisonSection.tsx">
              Calculate Your Savings
            </button>
          </div>
        </motion.div>
      </div>
    </section>);

};

export default ComparisonSection;