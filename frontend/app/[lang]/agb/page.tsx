export default function AgbPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4 text-primary">
        Allgemeine Geschäftsbedingungen (AGB)
      </h1>
      <div className="prose max-w-none">
        <p className="font-bold">Allgemeine Geschäftsbedingungen (AGB) der [Plattformname]</p>

        <h2>§ 1 Definitionen</h2>
        <p>
          <strong>Plattform:</strong> Die von [Firmenname, Rechtsform, Sitz] betriebene Online-Plattform unter der URL [URL], über die Unternehmen Aufträge einstellen und ausführen lassen können.
        </p>
        <p>
          <strong>Nutzer:</strong> Juristische Personen (Unternehmen), die bei der Plattform registriert sind.
        </p>
        <p>
          <strong>Auftraggeber:</strong> Nutzer, die einen Auftrag einstellen.
        </p>
        <p>
          <strong>Auftragnehmer:</strong> Nutzer, die auf einen Auftrag bieten und diesen ausführen.
        </p>
        <p>
          <strong>Auftrag:</strong> Die von einem Auftraggeber auf der Plattform eingestellte Leistungsanforderung.
        </p>
        <p>
          <strong>Vertrag:</strong> Der zwischen Auftraggeber und Auftragnehmer geschlossene Dienstleistungsvertrag.
        </p>
        <p>
          <strong>Gebühren:</strong> Entgelte, die Nutzer für die Nutzung der Plattform zahlen (Tagessatz, Premium-Abo o. Ä.).
        </p>

        <hr className="my-8" />

        <h2>§ 2 Gegenstand der Plattform</h2>
        <p>
          <strong>2.1</strong> Die Plattform stellt eine neutrale Infrastruktur bereit, über die Auftraggeber und Auftragnehmer Aufträge erstellen, suchen, annehmen und bewerten können.
        </p>
        <p>
          <strong>2.2</strong> Die Plattform selbst tritt nicht als Vertragspartei zwischen Auftraggeber und Auftragnehmer auf und übernimmt keine Gewähr für die Erfüllung der Aufträge.
        </p>

        <hr className="my-8" />

        <h2>§ 3 Vertragsschluss</h2>
        <p>
          <strong>3.1</strong> Angebote von Auftragnehmern erfolgen durch Abgabe eines Angebots („Bieten“) auf einen konkreten Auftrag.
        </p>
        <p>
          <strong>3.2</strong> Ein Vertrag zwischen Auftraggeber und Auftragnehmer kommt zustande, wenn der Auftraggeber das Angebot des Auftragnehmers in der Plattform annimmt und die Plattform dies dem Auftragnehmer bestätigt.
        </p>
        <p>
          <strong>3.3</strong> Die Plattform informiert beide Parteien über den Vertragsabschluss per E-Mail.
        </p>

        <hr className="my-8" />

        <h2>§ 4 Registrierung und Nutzerkonten</h2>
        <p>
          <strong>4.1</strong> Voraussetzung für die Nutzung ist die Registrierung mit Angabe vollständiger und wahrheitsgemäßer Daten, insbesondere:
          <br />
          Firmenname, Sitz, Handelsregisternummer
          <br />
          Kontaktdaten und vertretungsberechtigte Personen
        </p>
        <p>
          <strong>4.2</strong> Jeder Nutzer legt während der Registrierung ein persönliches Login (E-Mail/Passwort oder OAuth über Drittanbieter) an.
        </p>
        <p>
          <strong>4.3</strong> Ein Nutzerkonto ist nicht übertragbar. Bei Verdacht auf Missbrauch kann die Plattform das Konto sperren.
        </p>
        <p>
          <strong>4.4</strong> Nutzer sind verpflichtet, Änderungen ihrer Daten unverzüglich zu aktualisieren.
        </p>

        <hr className="my-8" />

        <h2>§ 5 Leistungsbeschreibung</h2>
        <p>
          <strong>5.1 Auftragserstellung:</strong> Auftraggeber füllen ein Formular mit Leistungsbeschreibung, Ort, voraussichtlicher Dauer und weiteren Details aus.
        </p>
        <p>
          <strong>5.2 Angebote:</strong> Auftragnehmer übermitteln einen Tagessatz und geschätzte Dauer.
        </p>
        <p>
          <strong>5.3 Bewertungssystem:</strong> Nach Abschluss eines Auftrags können sich beide Parteien gegenseitig bewerten. Bewertungen sind nur für die beteiligten Nutzer sichtbar und können nicht nachträglich geändert werden, außer bei nachgewiesenem Fehler.
        </p>

        <hr className="my-8" />

        <h2>§ 6 Gebühren und Zahlungsbedingungen</h2>
        <p>
          <strong>6.1 Standard-Tagessatz:</strong> 5 €/Tag pro laufendem Vertragstag, abgerechnet über die Plattform.
        </p>
        <p>
          <strong>6.2 Premium-Abonnement:</strong> 120 € p. a. (Reduzierung auf 3 €/Tag); Zahlungsweise monatlich oder jährlich.
        </p>
        <p>
          <strong>6.3 Rechnung und Fälligkeit:</strong> Gebühren werden nach Vertragsabschluss in Rechnung gestellt und sind innerhalb von 14 Tagen zur Zahlung fällig. Zahlungen erfolgen über integrierte Zahlungsdienstleister (z. B. PayPal, Kreditkarte, Lastschrift).
        </p>
        <p>
          <strong>6.4 Verzug:</strong> Bei Zahlungsverzug gelten die gesetzlichen Verzugszinsen.
        </p>

        <hr className="my-8" />

        <h2>§ 7 Pflichten der Nutzer</h2>
        <p>
          <strong>7.1</strong> Nutzer dürfen nur legale, nicht diskriminierende und urheberrechtsfreie Inhalte einstellen.
        </p>
        <p>
          <strong>7.2</strong> Jeder Nutzer darf nur ein Konto führen; Mehrfachkonten sind untersagt.
        </p>
        <p>
          <strong>7.3</strong> Nutzer verpflichten sich, ihre vertraglichen Verpflichtungen (Leistungserbringung bzw. Zahlung) ordnungsgemäß zu erfüllen.
        </p>
        <p>
          <strong>7.4</strong> Bei Verstößen gegen diese AGB behält sich die Plattform das Recht vor, Nutzerkonten zu sperren oder dauerhaft auszuschließen.
        </p>

        <hr className="my-8" />

        <h2>§ 8 Haftung und Gewährleistung</h2>
        <p>
          <strong>8.1</strong> Die Plattform übernimmt keine Gewähr für die Qualität, Rechtmäßigkeit oder Vollständigkeit der von Nutzern eingestellten Inhalte.
        </p>
        <p>
          <strong>8.2</strong> Die Haftung der Plattform ist – außer in Fällen von Vorsatz und grober Fahrlässigkeit – ausgeschlossen.
        </p>
        <p>
          <strong>8.3</strong> Für Schäden aus der Nichterfüllung des Vertrags zwischen Auftraggeber und Auftragnehmer haftet allein der jeweilige Vertragspartner.
        </p>

        <hr className="my-8" />

        <h2>§ 9 Geistiges Eigentum</h2>
        <p>
          <strong>9.1</strong> Alle Texte, Logos, Grafiken und sonstige Inhalte auf der Plattform sind urheberrechtlich geschützt.
        </p>
        <p>
          <strong>9.2</strong> Nutzer räumen der Plattform ein einfaches, räumlich und zeitlich unbeschränktes Nutzungsrecht an den von ihnen eingestellten Inhalten ein.
        </p>
        <p>
          <strong>9.3</strong> Nutzer dürfen Inhalte Dritter nur einstellen, wenn sie die entsprechenden Rechte besitzen.
        </p>

        <hr className="my-8" />

        <h2>§ 10 Datenschutz</h2>
        <p>
          <strong>10.1</strong> Personenbezogene Daten werden nur im Rahmen der DSGVO und unserer Datenschutzerklärung verarbeitet.
        </p>
        <p>
          <strong>10.2</strong> Eine Verarbeitung erfolgt ausschließlich zur Vertragserfüllung, technischen Administration und, nach Einwilligung, zu Marketingzwecken.
        </p>
        <p>
          <strong>10.3</strong> Nutzer können jederzeit Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung ihrer Daten verlangen.
        </p>

        <hr className="my-8" />

        <h2>§ 11 Vertraulichkeit</h2>
        <p>
          <strong>11.1</strong> Nutzer verpflichten sich, alle Informationen, die im Rahmen der Auftragsabwicklung bekannt werden und nicht öffentlich sind, vertraulich zu behandeln.
        </p>
        <p>
          <strong>11.2</strong> Diese Vertraulichkeitspflicht besteht auch nach Beendigung des Nutzerkontos fort.
        </p>

        <hr className="my-8" />

        <h2>§ 12 Kündigung und Sperrung</h2>
        <p>
          <strong>12.1</strong> Nutzer können ihr Konto jederzeit selbst löschen; bereits gezahlte Gebühren werden nicht erstattet.
        </p>
        <p>
          <strong>12.2</strong> Die Plattform kann Konten bei Verstößen gegen diese AGB oder aus wichtigem Grund (z. B. Betrug, Datenschutzverletzungen) fristlos sperren oder kündigen.
        </p>

        <hr className="my-8" />

        <h2>§ 13 Änderung der AGB</h2>
        <p>
          <strong>13.1</strong> Der Plattformbetreiber behält sich das Recht vor, diese AGB jederzeit zu ändern.
        </p>
        <p>
          <strong>13.2</strong> Änderungen werden den Nutzern mindestens vier Wochen vor Inkrafttreten per E-Mail angekündigt.
        </p>
        <p>
          <strong>13.3</strong> Widerspricht der Nutzer nicht innerhalb von vier Wochen schriftlich, gelten die Änderungen als angenommen.
        </p>

        <hr className="my-8" />

        <h2>§ 14 Schlussbestimmungen</h2>
        <p>
          <strong>14.1</strong> Es gilt deutsches Recht.
        </p>
        <p>
          <strong>14.2</strong> Erfüllungsort und Gerichtsstand ist – soweit zulässig – der Sitz der Plattform.
        </p>
        <p>
          <strong>14.3</strong> Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
        </p>
      </div>
    </div>
  );
}