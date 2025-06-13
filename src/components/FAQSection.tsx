import { motion } from "motion/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

const FAQSection = () => {
  const { t } = useLanguage();

  const faqs = [
  {
    question: "Çfarë është një eSIM dhe si funksionon?",
    answer: "Një eSIM (SIM e integruar) është një kartë SIM dixhitale që është e ndërtuar në pajisjen tuaj. Në vend të futjes së një karte SIM fizike, mund të shkarkoni dhe aktivizoni një plan mobil direkt në pajisjen tuaj duke përdorur një kod QR ose aplikacion. Funksionon në të njëjtën mënyrë si një kartë SIM tradicionale por ofron më shumë fleksibilitet dhe komoditet."
  },
  {
    question: "Cilat pajisje janë të përputhshme me eSIM?",
    answer: "Shumica e telefonave të mençur modernë mbështesin eSIM, duke përfshirë iPhone XS/XR dhe më të reja, Google Pixel 3 dhe më të reja, Samsung Galaxy S20 dhe më të reja, dhe shumë pajisje të tjera. Mund të kontrolloni faqen tonë të përputhshmërisë ose të kontaktoni mbështetjen për të verifikuar nëse pajisja juaj specifike mbështet teknologjinë eSIM."
  },
  {
    question: "Sa shpejt mund të lidhem pas blerjes?",
    answer: "eSIM-i juaj aktivizohet menjëherë! Pas blerjes, do të merrni një kod QR përmes email-it brenda minutave. Thjesht skanoni kodin me pajisjen tuaj, dhe do të jeni të lidhur me rrjetin tonë menjëherë. Nuk ka nevojë për pritje dërgimi fizik ose vizita dyqani."
  },
  {
    question: "A mund ta përdor eSIM-in përkrah kartës sime të rregullt SIM?",
    answer: "Po! Shumica e pajisjeve të përputhshme me eSIM mbështesin funksionalitetin dual SIM, duke ju lejuar të mbani kartën tuaj të rregullt SIM aktive ndërkohë që përdorni eSIM-in për të dhëna. Kjo është perfekte për të mbajtur numrin tuaj të shtëpisë ndërkohë që përdorni tarifen lokale të të dhënave kur udhëtoni."
  },
  {
    question: "Çfarë ndodh nëse përdor të gjitha të dhënat para se të përfundojë periudha e vlefshmërisë?",
    answer: "Pasi të keni përdorur të gjitha të dhënat tuaja, mund të blini plotësime shtesë të dhënash ose të blini një plan të ri. Profili juaj eSIM mbetet aktiv, kështu që mund të shtoni lehtësisht më shumë të dhëna pa kaluar përsëri nëpër procesin e konfigurimit."
  },
  {
    question: "A ofroni rimbursim nëse shërbimi nuk funksionon?",
    answer: "Po, ne ofrojmë një garanci 7-ditëshe kthimi parash. Nëse përjetoni ndonjë problem me shërbimin ose mbulimin tonë në destinacionin tuaj, kontaktoni ekipin tonë të mbështetjes brenda 7 ditëve nga blerja për një rimbursim të plotë. Kënaqësia juaj është prioriteti ynë."
  },
  {
    question: "Si e di cilat vende janë të mbuluara?",
    answer: "Çdo plan përfshin informacione të detajuara mbulimi që tregojnë saktësisht cilat vende dhe rrjete janë të mbështetura. Planet tona Global Plus dhe Business Pro mbulojnë 190+ dhe 200+ vende përkatësisht. Mund të shikoni listën e plotë të mbulimit në faqen e detajeve të secilit plan."
  },
  {
    question: "A është mbështetja e klientit e disponueshme nëse kam nevojë për ndihmë?",
    answer: "Absolutisht! Ekipi ynë i mbështetjes së klientit është i disponueshëm 24/7 përmes chat-it, email-it dhe telefonit. Ne gjithashtu ofrojmë udhëzues të detajuar konfigurimi dhe video-tutorial për t'ju ndihmuar të lidheni shpejt dhe lehtësisht."
  }];


  return (
    <section id="faq" className="py-20 bg-gray-50" data-id="zra9fqsgc" data-path="src/components/FAQSection.tsx">
      <div className="container mx-auto px-4" data-id="kz30wdlar" data-path="src/components/FAQSection.tsx">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16" data-id="fftq2ki47" data-path="src/components/FAQSection.tsx">

          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent" data-id="acvzlm0jq" data-path="src/components/FAQSection.tsx">
            {t('faq_title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-id="my837zimh" data-path="src/components/FAQSection.tsx">
            {t('faq_desc')}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto" data-id="h9dosv2ql" data-path="src/components/FAQSection.tsx">

          <Accordion type="single" collapsible className="space-y-4" data-id="bk1mnjxpk" data-path="src/components/FAQSection.tsx">
            {faqs.map((faq, index) =>
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-white rounded-lg border border-gray-200 px-6 shadow-sm hover:shadow-md transition-shadow" data-id="6lyc12esu" data-path="src/components/FAQSection.tsx">

                <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:text-blue-600 py-6" data-id="t6re9lppx" data-path="src/components/FAQSection.tsx">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed pb-6" data-id="jtywpr2zt" data-path="src/components/FAQSection.tsx">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-12" data-id="mwyog46sl" data-path="src/components/FAQSection.tsx">

          <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto border border-gray-200" data-id="wf0d7jad2" data-path="src/components/FAQSection.tsx">
            <h3 className="text-2xl font-bold mb-4 text-gray-900" data-id="8qqb59ycl" data-path="src/components/FAQSection.tsx">
              {t('faq_still_questions')}
            </h3>
            <p className="text-gray-600 mb-6" data-id="1mwtvm2pn" data-path="src/components/FAQSection.tsx">
              {t('faq_still_questions_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center" data-id="pts26pz0t" data-path="src/components/FAQSection.tsx">
              <button className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-blue-700 transition-colors" data-id="99nhi9rk2" data-path="src/components/FAQSection.tsx">
                {t('faq_live_chat')}
              </button>
              <button className="border border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-full hover:border-blue-600 hover:text-blue-600 transition-colors" data-id="j85bmq9t7" data-path="src/components/FAQSection.tsx">
                {t('faq_email_support')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>);

};

export default FAQSection;