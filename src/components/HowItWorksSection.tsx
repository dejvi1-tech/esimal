import { motion } from "motion/react";
import { Download, Smartphone, Wifi, CheckCircle } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
  {
    icon: Download,
    title: "Bli & Shkarko",
    description: "Zgjidhni planin tuaj dhe merrni menjëherë kodin QR të eSIM-it përmes email-it",
    color: "blue"
  },
  {
    icon: Smartphone,
    title: "Skano Kodin QR",
    description: "Përdorni kamerën e telefonit për të skanuar kodin QR dhe instaluar profilin eSIM",
    color: "purple"
  },
  {
    icon: Wifi,
    title: "Aktivizo të Dhënat",
    description: "Ndizni eSIM-in tuaj dhe zgjidheni si burim të dhënash kur të arrini",
    color: "green"
  },
  {
    icon: CheckCircle,
    title: "Qëndroni të Lidhur",
    description: "Gëzoni internet të shpejtë dhe të besueshëm pa tarifa roaming ose karta SIM fizike",
    color: "orange"
  }];


  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600 border-blue-200",
      purple: "bg-purple-100 text-purple-600 border-purple-200",
      green: "bg-green-100 text-green-600 border-green-200",
      orange: "bg-orange-100 text-orange-600 border-orange-200"
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <section id="how-it-works" className="py-20 bg-white" data-id="01wtbljz4" data-path="src/components/HowItWorksSection.tsx">
      <div className="container mx-auto px-4" data-id="pw937g63v" data-path="src/components/HowItWorksSection.tsx">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16" data-id="m6hxf0aak" data-path="src/components/HowItWorksSection.tsx">

          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent" data-id="ze4f0afgp" data-path="src/components/HowItWorksSection.tsx">
            Si Funksionon eSIM
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-id="agmzr3eo4" data-path="src/components/HowItWorksSection.tsx">
            Lidhuni në minuta me procesin tonë të thjeshtë 4-hapeshore. Nuk kërkohet ekspertizë teknike.
          </p>
        </motion.div>
        
        <div className="max-w-6xl mx-auto" data-id="y37zx24y3" data-path="src/components/HowItWorksSection.tsx">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8" data-id="mvxusqap8" data-path="src/components/HowItWorksSection.tsx">
            {steps.map((step, index) =>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center relative" data-id="a0wrkke03" data-path="src/components/HowItWorksSection.tsx">

                {/* Connection Line */}
                {index < steps.length - 1 &&
              <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-gray-300 transform translate-x-4 translate-y-0.5" data-id="vndq2i236" data-path="src/components/HowItWorksSection.tsx" />
              }
                
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border-2 mb-6 ${getColorClasses(step.color)}`} data-id="q4zi39qjj" data-path="src/components/HowItWorksSection.tsx">
                  <step.icon className="w-8 h-8" data-id="bb4dphoev" data-path="src/components/HowItWorksSection.tsx" />
                </div>
                
                <h3 className="text-xl font-bold mb-4 text-gray-900" data-id="jgdq8u0w7" data-path="src/components/HowItWorksSection.tsx">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed" data-id="qe55q748m" data-path="src/components/HowItWorksSection.tsx">
                  {step.description}
                </p>
                
                {/* Step Number */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold" data-id="xsyceo3cc" data-path="src/components/HowItWorksSection.tsx">
                  {index + 1}
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16" data-id="igiqaz484" data-path="src/components/HowItWorksSection.tsx">

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 max-w-4xl mx-auto" data-id="klgrspy4s" data-path="src/components/HowItWorksSection.tsx">
            <h3 className="text-2xl font-bold mb-4 text-gray-900" data-id="lh5vv1r4d" data-path="src/components/HowItWorksSection.tsx">
              I Përputhshëm me Shumicën e Pajisjeve Moderne
            </h3>
            <p className="text-gray-600 mb-6" data-id="4adho4gwn" data-path="src/components/HowItWorksSection.tsx">
              Funksionon me iPhone XS/XR dhe më të reja, Google Pixel 3 dhe më të reja, Samsung Galaxy S20 dhe më të reja, dhe shumë pajisje të tjera me eSIM.
            </p>
            <button className="text-blue-600 hover:text-blue-700 font-semibold underline transition-colors" data-id="rcp6m75gf" data-path="src/components/HowItWorksSection.tsx">
              Kontrollo përputhshmërinë e pajisjes
            </button>
          </div>
        </motion.div>
      </div>
    </section>);

};

export default HowItWorksSection;