import Link from "next/link";

export default function DatenschutzPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4 text-primary">
        Datenschutzerklärung für Indusync 
      </h1>
      <div className="prose max-w-none">
        <p className="font-bold">Datenschutzerklärung für [Plattformname]</p>
        <p>Gültig ab: [Datum]</p>

        <p className="font-bold">Verantwortlicher</p>
        <p>
          [Firmenname]
          <br />
          [Adresse]
          <br />
          [E-Mail, Telefon]
        </p>

        <h2>1. Einleitung</h2>
        <p>
          Wir nehmen den Schutz Ihrer personenbezogenen Daten sehr ernst und verarbeiten Ihre Daten ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, BDSG). Mit dieser Datenschutzerklärung möchten wir Sie darüber informieren, welche Daten wir erheben und wie wir sie verwenden.
        </p>

        <hr className="my-8" />

        <h2>2. Begriffsdefinitionen</h2>
        <p>
          <strong>Personenbezogene Daten:</strong> Alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen.
        </p>
        <p>
          <strong>Verarbeitung:</strong> Jeder Vorgang im Zusammenhang mit personenbezogenen Daten (Erheben, Speichern, Ändern, Übermitteln, Löschen usw.).
        </p>

        <hr className="my-8" />

        <h2>3. Datenkategorien und Verarbeitungszwecke</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datenkategorie
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zweck der Verarbeitung
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rechtsgrundlage
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Speicherdauer
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">Registrierungsdaten</td>
                <td className="px-6 py-4 whitespace-nowrap">Anlegen und Verwalten Ihres Nutzerkontos</td>
                <td className="px-6 py-4 whitespace-nowrap">Art. 6 Abs. 1 lit. b DSGVO</td>
                <td className="px-6 py-4 whitespace-nowrap">Bis zur Löschung des Kontos</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">Kontaktdaten (E-Mail, Telefon)</td>
                <td className="px-6 py-4 whitespace-nowrap">Kommunikation über Aufträge, Support</td>
                <td className="px-6 py-4 whitespace-nowrap">Art. 6 Abs. 1 lit. b DSGVO</td>
                <td className="px-6 py-4 whitespace-nowrap">Bis zur Löschung des Kontos</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">Unternehmensdaten (Handelsregister-Nr., Sitz)</td>
                <td className="px-6 py-4 whitespace-nowrap">Echtheitsprüfung, Profilfreischaltung</td>
                <td className="px-6 py-4 whitespace-nowrap">Art. 6 Abs. 1 lit. c DSGVO</td>
                <td className="px-6 py-4 whitespace-nowrap">Bis zur Löschung des Kontos</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">Auftragsdaten (Beschreibung, Dauer, Ort)</td>
                <td className="px-6 py-4 whitespace-nowrap">Abwicklung und Dokumentation von Aufträgen</td>
                <td className="px-6 py-4 whitespace-nowrap">Art. 6 Abs. 1 lit. b DSGVO</td>
                <td className="px-6 py-4 whitespace-nowrap">3 Jahre nach Abschluss des Auftrags</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">Bewertungsdaten</td>
                <td className="px-6 py-4 whitespace-nowrap">Ermöglichen und Anzeigen von Bewertungen</td>
                <td className="px-6 py-4 whitespace-nowrap">Art. 6 Abs. 1 lit. f DSGVO</td>
                <td className="px-6 py-4 whitespace-nowrap">3 Jahre nach Abgabe der Bewertung</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">Zahlungs- und Abrechnungsdaten</td>
                <td className="px-6 py-4 whitespace-nowrap">Abrechnung der Plattformgebühren</td>
                <td className="px-6 py-4 whitespace-nowrap">Art. 6 Abs. 1 lit. b DSGVO</td>
                <td className="px-6 py-4 whitespace-nowrap">10 Jahre (Steueraufbewahrung)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <hr className="my-8" />

        <h2>4. Empfänger der Daten</h2>
        <p>
          <strong>Zahlungsdienstleister</strong> (z. B. PayPal, Kreditkartenanbieter): zur Abwicklung von Zahlungen.
        </p>
        <p>
          <strong>Hosting- und Infrastrukturanbieter:</strong> Speicherung und Betrieb der Plattform.
        </p>
        <p>
          <strong>Datenschutzbeauftragter</strong> (sofern benannt): interne Beratung und Kontrolle.
        </p>
        <p>
          Eine Übermittlung an Dritte zu anderen Zwecken findet nicht statt.
        </p>

        <hr className="my-8" />

        <h2>5. Cookies und Tracking</h2>
        <p>
          Wir setzen für die technische Bereitstellung der Plattform notwendige Cookies ein. Soweit wir darüber hinaus Analysen durchführen oder Marketing-Tools einsetzen, erfolgt dies nur mit Ihrer vorherigen Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Weitere Details entnehmen Sie bitte unserem Cookie-Banner.
        </p>

        <hr className="my-8" />

        <h2>6. Ihre Betroffenenrechte</h2>
        <p>Sie haben das Recht auf</p>
        <ul>
          <li>Auskunft (Art. 15 DSGVO),</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO),</li>
          <li>Löschung oder Einschränkung der Verarbeitung (Art. 17, 18 DSGVO),</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO),</li>
          <li>Widerspruch gegen Verarbeitung aus berechtigten Interessen (Art. 21 Abs. 1 DSGVO),</li>
          <li>Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO).</li>
        </ul>
        <p>
          Zur Ausübung Ihrer Rechte wenden Sie sich bitte an [Datenschutz-Kontakt, E-Mail].
        </p>

        <hr className="my-8" />

        <h2>7. Datensicherheit</h2>
        <p>
          Wir treffen technische und organisatorische Maßnahmen (TLS/SSL, Zugriffskontrollen, regelmäßige Backups), um Ihre Daten vor Verlust, Missbrauch oder unbefugtem Zugriff zu schützen.
        </p>

        <hr className="my-8" />

        <h2>8. Datenverarbeitung durch Auftragsverarbeiter</h2>
        <p>
          Wir nutzen Dienstleister als Auftragsverarbeiter (Art. 28 DSGVO). Mit allen Auftragsverarbeitern werden Verträge geschlossen, die das Datenschutzniveau sicherstellen.
        </p>

        <hr className="my-8" />

        <h2>9. Änderungen dieser Datenschutzerklärung</h2>
        <p>
          Wir können diese Erklärung anpassen, wenn sich gesetzliche Vorgaben oder unser Leistungsangebot ändern. Änderungen werden wir auf der Plattform ankündigen und das Datum der letzten Aktualisierung anpassen.
        </p>

        <hr className="my-8" />

        <p className="font-bold">Kontakt für Datenschutzanfragen:</p>
        <p>[Name, E-Mail, ggf. Datenschutzbeauftragter]</p>
      </div>
    </div>
  );
}