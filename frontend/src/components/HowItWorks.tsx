import { Smartphone } from "lucide-react";

// Move static data outside the component for better performance
const iphoneSteps = [
  "Hapni Settings në iPhone-in tuaj",
  "Zgjidhni Mobile Data ose Cellular",
  "Shtoni një eSIM",
  "Skanoni QR Code nga operatori"
];

const androidSteps = [
  "Hapni Settings në Android-in tuaj",
  "Zgjidhni SIM card manager ose SIMs",
  "Klikoni Add mobile plan",
  "Skanoni QR Code nga operatori"
];

// Deep purple glassmorphism card style
const glassClass =
  "bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 bg-opacity-80 border border-purple-700 rounded-2xl p-8 shadow-xl backdrop-blur text-white";

const HowItWorks = () => {
  return (
    <section className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-3 text-purple-800">
          Si të lidheni me eSIM në iPhone dhe Android
        </h2>
        <p className="text-lg md:text-xl text-purple-900">
          Ndiqni këto hapa të thjeshtë për të aktivizuar eSIM-in tuaj në çdo pajisje
        </p>
      </div>

      <div className="mb-10 flex justify-center">
        <img
          src="/esim-udhezues.png"
          alt="eSIM udhëzues"
          className="w-full max-w-2xl rounded-2xl shadow-lg border-2 border-purple-200"
          loading="lazy"
          width={600}
          height={300}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* iPhone Card */}
        <div className={glassClass + " flex flex-col"}>
          <div className="flex items-center mb-5">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-purple-400/70 text-white mr-3">
              <Smartphone className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-white">📱 Si të lidheni me eSIM në iPhone</span>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-white font-medium">
            {iphoneSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Android Card */}
        <div className={glassClass + " flex flex-col"}>
          <div className="flex items-center mb-5">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-purple-400/70 text-white mr-3">
              <Smartphone className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-white">🤖 Si të lidheni me eSIM në Android</span>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-white font-medium">
            {androidSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      {/* Tip Box - deep purple glassmorphism */}
      <div className="mt-12 flex justify-center">
        <div className={glassClass + " text-center max-w-xl"}>
          <div className="text-2xl mb-2 text-white">💡 Këshillë e Shpejtë</div>
          <div className="text-white font-medium">
            Sigurohuni që pajisja juaj të mbështesë eSIM-in para blerjes. Shumica e iPhone-ve të rinj dhe Android-eve të fundit e mbështesin këtë teknologji.
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks; 