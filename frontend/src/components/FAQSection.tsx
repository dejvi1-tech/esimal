import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

const FAQSection = () => {
  const { t, language } = useLanguage();

  const faqs = [
    {
      question: {
        al: "Çfarë është një eSIM dhe si funksionon?",
        en: "What is an eSIM and how does it work?"
      },
      answer: {
        al: "Një eSIM (SIM e integruar) është një kartë SIM dixhitale që është e ndërtuar në pajisjen tuaj. Në vend të futjes së një karte SIM fizike, mund të shkarkoni dhe aktivizoni një plan mobil direkt në pajisjen tuaj duke përdorur një kod QR ose aplikacion. Funksionon në të njëjtën mënyrë si një kartë SIM tradicionale por ofron më shumë fleksibilitet dhe komoditet.",
        en: "An eSIM (embedded SIM) is a digital SIM card that's built into your device. Instead of inserting a physical SIM card, you can download and activate a mobile plan directly on your device using a QR code or app. It works the same way as a traditional SIM card but offers more flexibility and convenience."
      }
    },
    {
      question: {
        al: "Cilat pajisje janë të përputhshme me eSIM?",
        en: "Which devices are compatible with eSIM?"
      },
      answer: {
        al: "Shumica e telefonave të mençur modernë mbështesin eSIM, duke përfshirë iPhone XS/XR dhe më të reja, Google Pixel 3 dhe më të reja, Samsung Galaxy S20 dhe më të reja, dhe shumë pajisje të tjera. Mund të kontrolloni faqen tonë të përputhshmërisë ose të kontaktoni mbështetjen për të verifikuar nëse pajisja juaj specifike mbështet teknologjinë eSIM.",
        en: "Most modern smartphones support eSIM, including iPhone XS/XR and newer, Google Pixel 3 and newer, Samsung Galaxy S20 and newer, and many other devices. You can check our compatibility page or contact support to verify if your specific device supports eSIM technology."
      }
    },
    {
      question: {
        al: "Sa shpejt mund të lidhem pas blerjes?",
        en: "How quickly can I connect after purchase?"
      },
      answer: {
        al: "eSIM-i juaj aktivizohet menjëherë! Pas blerjes, do të merrni një kod QR përmes email-it brenda minutave. Thjesht skanoni kodin me pajisjen tuaj, dhe do të jeni të lidhur me rrjetin tonë menjëherë. Nuk ka nevojë për pritje dërgimi fizik ose vizita dyqani.",
        en: "Your eSIM activates instantly! After purchase, you'll receive a QR code via email within minutes. Simply scan the code with your device, and you'll be connected to our network immediately. No waiting for physical shipping or store visits required."
      }
    },
    {
      question: {
        al: "A mund ta përdor eSIM-in përkrah kartës sime të rregullt SIM?",
        en: "Can I use eSIM alongside my regular SIM card?"
      },
      answer: {
        al: "Po! Shumica e pajisjeve të përputhshme me eSIM mbështesin funksionalitetin dual SIM, duke ju lejuar të mbani kartën tuaj të rregullt SIM aktive ndërkohë që përdorni eSIM-in për të dhëna. Kjo është perfekte për të mbajtur numrin tuaj të shtëpisë ndërkohë që përdorni tarifen lokale të të dhënave kur udhëtoni.",
        en: "Yes! Most eSIM-compatible devices support dual SIM functionality, allowing you to keep your regular SIM card active while using eSIM for data. This is perfect for keeping your home number while using local data rates when traveling."
      }
    },
    {
      question: {
        al: "Çfarë ndodh nëse përdor të gjitha të dhënat para se të përfundojë periudha e vlefshmërisë?",
        en: "What happens if I use all my data before the validity period ends?"
      },
      answer: {
        al: "Pasi të keni përdorur të gjitha të dhënat tuaja, mund të blini plotësime shtesë të dhënash ose të blini një plan të ri. Profili juaj eSIM mbetet aktiv, kështu që mund të shtoni lehtësisht më shumë të dhëna pa kaluar përsëri nëpër procesin e konfigurimit.",
        en: "Once you've used all your data, you can purchase additional data top-ups or buy a new plan. Your eSIM profile remains active, so you can easily add more data without going through the setup process again."
      }
    },
    {
      question: {
        al: "A ofroni rimbursim nëse shërbimi nuk funksionon?",
        en: "Do you offer refunds if the service doesn't work?"
      },
      answer: {
        al: "Po, ne ofrojmë një garanci 7-ditëshe kthimi parash. Nëse përjetoni ndonjë problem me shërbimin ose mbulimin tonë në destinacionin tuaj, kontaktoni ekipin tonë të mbështetjes brenda 7 ditëve nga blerja për një rimbursim të plotë. Kënaqësia juaj është prioriteti ynë.",
        en: "Yes, we offer a 7-day money-back guarantee. If you experience any issues with our service or coverage at your destination, contact our support team within 7 days of purchase for a full refund. Your satisfaction is our priority."
      }
    },
    {
      question: {
        al: "Si e di cilat vende janë të mbuluara?",
        en: "How do I know which countries are covered?"
      },
      answer: {
        al: "Çdo plan përfshin informacione të detajuara mbulimi që tregojnë saktësisht cilat vende dhe rrjete janë të mbështetura. Planet tona Global Plus dhe Business Pro mbulojnë 190+ dhe 200+ vende përkatësisht. Mund të shikoni listën e plotë të mbulimit në faqen e detajeve të secilit plan.",
        en: "Each plan includes detailed coverage information showing exactly which countries and networks are supported. Our Global Plus and Business Pro plans cover 190+ and 200+ countries respectively. You can view the complete coverage list on each plan's details page."
      }
    },
    {
      question: {
        al: "A është mbështetja e klientit e disponueshme nëse kam nevojë për ndihmë?",
        en: "Is customer support available if I need help?"
      },
      answer: {
        al: "Absolutisht! Ekipi ynë i mbështetjes së klientit është i disponueshëm 24/7 përmes chat-it, email-it dhe telefonit. Ne gjithashtu ofrojmë udhëzues të detajuar konfigurimi dhe video-tutorial për t'ju ndihmuar të lidheni shpejt dhe lehtësisht.",
        en: "Absolutely! Our customer support team is available 24/7 via chat, email, and phone. We also provide detailed setup guides and video tutorials to help you connect quickly and easily."
      }
    }
  ];

  return (
    <section id="faq" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 dark:text-gray-200">
            {t('faq_title')}
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            {t('faq_desc')}
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) =>
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-white/30 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 rounded-lg px-6 shadow-sm hover:shadow-md transition-shadow">

                <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 py-6">
                  {faq.question[language]}
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 dark:text-gray-300 leading-relaxed pb-6">
                  {faq.answer[language]}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
        
        <div className="text-center mt-12">
          <div className="bg-white/30 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {t('faq_still_questions')}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {t('faq_still_questions_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-blue-700 transition-colors">
                {t('faq_live_chat')}
              </button>
              <button className="border border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-full hover:border-blue-600 hover:text-blue-600 transition-colors">
                {t('faq_email_support')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>);

};

export default FAQSection;