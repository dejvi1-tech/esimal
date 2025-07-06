import { Helmet } from 'react-helmet-async';

const TermsPage = () => (
  <>
    <Helmet>
      <title>Kushtet e Përdorimit | e-SimFly</title>
      <meta name="description" content="Lexoni kushtet e përdorimit të e-SimFly. Mësoni rregullat, përgjegjësitë dhe të drejtat tuaja si përdorues i platformës sonë." />
    </Helmet>
    <div className="min-h-screen flex flex-col items-center justify-center py-20 px-4">
      <section className="w-full max-w-2xl mx-auto">
        <div className="card-glass p-10 md:p-14 rounded-3xl shadow-glow text-white">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight font-orbitron text-center">
            Kushtet e Përdorimit – e-Simfly
          </h1>
          <div className="text-gray-200 text-base md:text-lg leading-relaxed space-y-6">
            <div className="text-accent font-semibold mb-2">Përditësuar më: 27 Janar 2025</div>
            <p>Duke përdorur shërbimet tona, ju pranoni këto kushte. Ju lutemi lexoni me kujdes.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">1. Përdorimi i Drejtë</h2>
            <p>Paketat tona janë të pakufizuara, por i nënshtrohen një politike përdorimi të drejtë.<br />Shembull: për paketa 30-ditore, shpejtësia mund të reduktohet pas 30GB/60GB.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">2. Pajisje të Përputhshme</h2>
            <p>Pajisja juaj duhet të mbështesë teknologjinë eSIM. Ne nuk mbajmë përgjegjësi për pajisje të papërshtatshme.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">3. Rimbursime</h2>
            <p>Rimbursimet ofrohen vetëm nëse problemi është nga ana jonë dhe shërbimi nuk është aktivizuar siç duhet.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">4. Mbulesa e Shërbimit</h2>
            <p>Ju lutemi verifikoni nëse vendi ku udhëtoni mbulohet nga rrjeti ynë përpara blerjes.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">5. Përdorim Ligjor</h2>
            <p>Shërbimi duhet të përdoret në përputhje me ligjet lokale dhe ndërkombëtare.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">6. Siguria</h2>
            <p>Ju jeni përgjegjës për sigurinë e pajisjes dhe të dhënave tuaja gjatë përdorimit të shërbimit.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">7. Pronësia Intelektuale</h2>
            <p>E gjithë përmbajtja dhe teknologjia mbrohen nga të drejtat e autorit. Përdorimi pa leje ndalohet.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">8. Kufizimi i Përgjegjësisë</h2>
            <p>Nuk mbajmë përgjegjësi për dëme që vijnë nga përdorimi ose pamundësia për të përdorur shërbimin.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">9. Ndryshime në Kushte</h2>
            <p>Kushtet mund të përditësohen. Versioni më i fundit do të publikohet në faqen tonë.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">10. Juridiksioni</h2>
            <p>Këto kushte rregullohen nga ligjet e Republikës së Kosovës. Çdo mosmarrëveshje i nënshtrohet gjykatave të Prishtinës.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">11. Zgjidhja e Mosmarrëveshjeve</h2>
            <p>Fillimisht do të tentohet zgjidhje miqësore. Nëse dështon, çështja zgjidhet përmes arbitrazhit.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">12. Pagesat</h2>
            <p>Pagesat kryhen përmes Stripe, App Store ose Google Play. Çmimet mund të ndryshojnë sipas rajonit ose ofertave.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">13. Përdorim i Ndaluar</h2>
            <p>Ndalohen aktivitetet si spam, abuzim me hotspot, VPN në shtete të ndaluara, apo çdo veprim që shkel këto kushte.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">14. Kontakt</h2>
            <p>Për çdo pyetje, na kontaktoni në: <a href="mailto:support@e-simfly.al" className="text-accent underline">support@e-simfly.al</a></p>
          </div>
        </div>
      </section>
    </div>
  </>
);

export default TermsPage; 