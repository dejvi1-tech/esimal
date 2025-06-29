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

  const getGlassColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-500/20 text-blue-400 border-blue-400/30",
      purple: "bg-purple-500/20 text-purple-400 border-purple-400/30",
      green: "bg-green-500/20 text-green-400 border-green-400/30",
      orange: "bg-orange-500/20 text-orange-400 border-orange-400/30"
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 dark:text-gray-200">
            Si Funksionon eSIM
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Lidhuni në minuta me procesin tonë të thjeshtë 4-hapeshore. Nuk kërkohet ekspertizë teknike.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) =>
            <div
              key={index}
              className="text-center relative p-6 bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">

                {/* Connection Line */}
                {index < steps.length - 1 &&
              <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-gray-300 transform translate-x-4 translate-y-0.5" />
              }
                
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border-2 mb-6 ${getGlassColorClasses(step.color)}`}>
                  <step.icon className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                  {step.title}
                </h3>
                
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {step.description}
                </p>
                
                {/* Step Number */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                  {index + 1}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center mt-16">
          <div className="bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              I Përputhshëm me Shumicën e Pajisjeve Moderne
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Funksionon me iPhone XS/XR dhe më të reja, Google Pixel 3 dhe më të reja, Samsung Galaxy S20 dhe më të reja, dhe shumë pajisje të tjera me eSIM.
            </p>
            <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold underline transition-colors">
              Kontrollo përputhshmërinë e pajisjes
            </button>
          </div>
        </div>
      </div>
    </section>);

};

export default HowItWorksSection;