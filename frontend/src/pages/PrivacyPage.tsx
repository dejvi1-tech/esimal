import { Helmet } from 'react-helmet-async';

const PrivacyPage = () => (
  <>
    <Helmet>
      <title>Politika e Privatësisë & Cookies | e-SimFly</title>
      <meta name="description" content="Lexoni politikën e privatësisë dhe cookies të e-SimFly. Mësoni si mbrohen të dhënat tuaja personale dhe si përdoren cookies në platformën tonë." />
    </Helmet>
    <div className="min-h-screen flex flex-col items-center justify-center py-20 px-4">
      <section className="w-full max-w-2xl mx-auto">
        <div className="card-glass p-10 md:p-14 rounded-3xl shadow-glow text-white">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight font-orbitron text-center">
            Politika e Privatësisë – e-Simfly
          </h1>
          <div className="text-gray-200 text-base md:text-lg leading-relaxed space-y-6">
            <div className="text-accent font-semibold mb-2">E vlefshme nga data: 27 Janar 2025</div>
            <p>Te e-Simfly, privatësia juaj është prioriteti ynë. Kjo politikë shpjegon mënyrën si mbledhim, përdorim dhe mbrojmë të dhënat tuaja personale.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">1. Çfarë të dhënash mbledhim?</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><b>Të dhëna personale:</b> Emri, emaili, numri i telefonit (nëse jepet)</li>
              <li><b>Të dhëna pagese:</b> Transaksionet përmes Stripe (nuk ruajmë informacion të kartës)</li>
              <li><b>Të dhëna teknike:</b> IP, pajisja, shfletuesi, vendndodhja</li>
              <li><b>Përdorimi i faqes:</b> Faqet e vizituara, koha e qëndrimit</li>
            </ul>
            <h2 className="text-xl font-bold mt-8 mb-2">2. Si i përdorim?</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Për të ofruar dhe menaxhuar shërbimin eSIM</li>
              <li>Për pagesa dhe porosi</li>
              <li>Për komunikime dhe mbështetje</li>
              <li>Për përmirësimin e platformës</li>
              <li>Për përmbushje ligjore</li>
            </ul>
            <h2 className="text-xl font-bold mt-8 mb-2">3. Të drejtat tuaja (për përdoruesit e BE)</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Qasje, korrigjim, fshirje ose kufizim i të dhënave</li>
              <li>Tërheqje e pëlqimit në çdo kohë</li>
              <li>Ankesë tek autoriteti përkatës</li>
            </ul>
            <h2 className="text-xl font-bold mt-8 mb-2">4. Me kë i ndajmë?</h2>
            <p>Vetëm me palë të besueshme si:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Stripe (pagesa)</li>
              <li>Google Analytics</li>
              <li>Ofrues cloud ose shërbim klienti<br />Të gjithë janë të detyruar të respektojnë ligjin për privatësinë.</li>
            </ul>
            <h2 className="text-xl font-bold mt-8 mb-2">5. Cookie & analiza</h2>
            <p>Përdorim cookie për funksionalitet, analiza dhe personalizim. Ju mund t'i çaktivizoni në shfletuesin tuaj.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">6. Ruajtja & siguria</h2>
            <p>Të dhënat ruhen sa kohë janë të nevojshme për shërbim apo detyrime ligjore. Përdorim enkriptim dhe masa sigurie për mbrojtjen e tyre.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">7. Fëmijët</h2>
            <p>Nuk u ofrojmë shërbime personave nën 16 vjeç.</p>
            <h2 className="text-xl font-bold mt-8 mb-2">8. Ndryshime</h2>
            <p>Politika mund të përditësohet. Versioni më i fundit është gjithmonë i disponueshëm në këtë faqe.</p>
          </div>
        </div>
      </section>
    </div>
  </>
);

export default PrivacyPage; 