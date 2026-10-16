# Tavola Mia — audit progressivo del perimetro ricevuto

Data verifica: 16 ottobre 2026. Ultimo checkpoint pubblico verificato: `1.20.4`.

Questo audit registra copertura tecnica e prove eseguite; non certifica clinicamente un piano alimentare né sostituisce la revisione visiva completa delle fotografie. I controlli residui sono in `MASTER-CHECKLIST.md`.

## Specifiche acquisite

- Elenco generale degli alimenti e degli extra/sgarri.
- Matrice iniziale e quattro addendum: 214 ricette, da `C01` a `C44`, da `S01` a `S42`, da `P01` a `P64` e da `D01` a `D64`.
- Obiettivo operativo permanente confrontato con il repository e con le checklist storiche.

## Evidenze automatiche

- Banca dati: 225 alimenti base con macronutrienti, fibre e fonte riconosciuta.
- Copertura selezionabile: 287/287 voci nutrizionali e 270/270 ingredienti ricetta con componente e foto.
- Paniere esplicito: 217/217 alimenti richiesti selezionabili, fotografati e utilizzati da almeno una ricetta reale.
- Ricette: 214/214 elementi delle matrici completi e univoci; ingredienti, grammature e componenti allineati.
- Fotografie: 583/583 asset validi; 214/214 foto matrice dedicate; 266/266 ricette reali con foto finale dedicata, semanticamente completa e non condivisa.
- Extra/sgarri: 114 voci univoche con chilocalorie, proteine, carboidrati, grassi, fibre e fonte.
- Alternative: 273 alimenti senza duplicati né card vuote nella stessa categoria.
- Rotazione: 14/14 pasti principali nei range definiti, senza famiglie proteiche consecutive.
- Suite pubblicabile: 227/227 test dell'app superati localmente nella 1.20.0, controllo TypeScript senza errori, SSR superato e build GitHub Pages riuscita. Un ulteriore test statico dell'audit mobile porta la suite a 228/228 e protegge la lettura della versione 1.20.
- Aggiornamento automatico tra release verificato su mobile reale: versione nuova rilevata senza intervento, menu, grammatura modificata e posizione di scorrimento conservati.
- Stress mobile pubblico ripetibile: viewport 390×844, target calorico verificato su profilo pulito e contesto Lavoro/Casa, check-in adattivo, conferma/rotazione/stampa settimanale, quattro famiglie delle 214 ricette, ritorno fisso, alternative del latte, modifica grammatura persistente, aggiunta/rimozione diretta di componenti, fotografie visibili realmente caricate e zero errori JavaScript.
- Pubblicazione verificata sul link unico: manifest `1.19.91`, HTML e asset JavaScript allineati. Lo stress mobile pubblico della 1.19.91 è passato senza errori JavaScript, overflow globale, recupero, immagini rotte o immagini pendenti. Le due card lunghe segnalate contengono tutto il testo a 320/390 px; con “+ → Sgarri” la pizza è visibile attraverso un accesso rapido fisso, si aggiunge al pasto senza cancellarne le parti, mostra la propria foto e si rimuove direttamente. Anche dopo un filtro ricette precedente, la categoria Sgarri ripropone pizza e altre scelte occasionali. Pizza → tiramisù sostituisce soltanto lo sgarro aggiunto; il tiramisù offre “Modifica porzione”, componente e foto propri.
- Pubblicazione 1.19.92 sullo stesso link: manifest, HTML e asset `index-BOZC7zJF.js` allineati dopo il deploy GitHub Pages; stress mobile pubblico riuscito con versione visibile, nessun recupero, nessun overflow, nessuna foto rotta e zero errori JavaScript. L'avvio ora accetta la nuova versione soltanto quando anche HTML e script risultano disponibili, con fino a tre tentativi anti-cache; la sessione aperta mostra separatamente la revisione in uso e quella appena pubblicata e riprova al ritorno in pagina o online. Un'attività aperta continua a differire il refresh per non interrompere il lavoro.
- Pubblicazione 1.19.93 sullo stesso link: manifest, HTML e asset `index-D0dDQAby.js` allineati dopo il deploy GitHub Pages; stress mobile pubblico riuscito con v1.19.93 visibile, nessuna pagina di recupero, nessuna foto rotta, nessun overflow e zero errori JavaScript. Il test del piano asiatico rileva tutte e tre le ricette indiane FSSAI effettivamente proposte, non soltanto archiviate.
- Pubblicazione 1.19.94 sullo stesso link: manifest, HTML e asset `index-DaW6g2KQ.js` allineati; test mobile pubblico riuscito. Aggiornamento reale 1.19.93 → 1.19.94 senza intervento: porzione 45 → 54 g, menu e scroll conservati, zero errori JavaScript. Due ricette giapponesi MAFF adattate in pasti completi con foto dedicate e riso a chicco corto cotto USDA SR28; entrambe proposte nel piano asiatico.
- Pubblicazione 1.19.95 sullo stesso link: manifest `1.19.95`, HTML e asset `index-xBVL1Ie-.js` allineati dopo deploy GitHub Pages riuscito. Dondoroke-meshi MAFF adattato e chana masala NHS adattato, entrambi pasti completi con foto dedicate e istruzioni; spinaci cotti CREA 005705 distinti da crudi. Il test locale dello stile asiatico propone il chana masala, con 12/14 pasti asiatici e 9 ricette istituzionali documentate. Stress mobile locale riuscito senza errori JavaScript, immagini rotte o overflow.
- Pubblicazione 1.19.96 sullo stesso link: manifest, HTML e asset `index-Bzga3TMS.js` allineati. La prova reale 1.19.95 → 1.19.96 ha conservato menu, 54 g modificati, vista Ricette e scroll 900 → 900 px, zero errori JavaScript. Lo stress mobile pubblico della 1.19.96 è riuscito senza recupero, foto rotte o overflow. La causa del difetto precedente era un ripristino eseguito prima dell'idratazione del profilo; ora il marker viene consumato solo dopo il montaggio della vista salvata.
- Pubblicazione 1.19.97 sullo stesso link: manifest, HTML e asset `index-Cke7Xu32.js` allineati, stress mobile pubblico senza recupero, foto rotte, overflow o errori JavaScript. Aggiornamento reale 1.19.96 → 1.19.97: 54 g modificati, menu, vista Ricette e scroll 900 → 900 px conservati. Corretto il falso positivo di “pollo” dentro “cipollotti” in famiglia proteica, stile alimentare, ricerca e suggerimenti: test pubblico 14/14 pasti asiatici, entrambi i nuovi piatti con legumi proposti e cinque pranzi feriali pratici.
- Pubblicazione 1.19.98 sullo stesso link: manifest, HTML e asset `index-uTI__eOt.js` allineati. Aggiornamento reale 1.19.97 → 1.19.98 con menu, 54 g modificati, vista Ricette e scroll 900 → 900 px conservati, zero errori JavaScript. Quattro ricette che indicavano spinaci cotti usano ora valori CREA e foto coerenti con il peso cotto, con stagionalità invariata. Suite e stress mobile locali superati.
- Pubblicazione 1.19.99 sullo stesso link: il dato generico di spinaci è precisato come crudo e attribuito a [USDA SR28, NDB 11457](https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg11.pdf); foto ingredienti e grammi a crudo sono separati da quelli cotti della [tabella CREA 005705](https://alimentinutrizione.it/tabelle-nutrizionali/005705). Nel test di aggiornamento 1.19.98 → 1.19.99 sono rimasti menu, grammatura e vista Ricette, ma lo scroll è stato letto a zero subito dopo la navigazione.
- Pubblicazione 1.20.0 sullo stesso link: manifest, HTML e asset `index-CJ2Da3xC.js` allineati. La prova reale 1.19.99 → 1.20.0 ha conservato automaticamente vista Ricette, scroll 900 → 900 px, menu e grammatura modificata a 54 g, senza errori JavaScript. Lo stress mobile pubblico è riuscito senza recupero, immagini rotte o overflow. Corretto inoltre il test mobile che, dopo il passaggio alla serie 1.20, saltava erroneamente i controlli storici sugli Sgarri: la seconda esecuzione ha provato pizza, accesso dal “+”, sostituzione e rimozione con esito positivo.
- Pubblicazione 1.20.1 sullo stesso link: una verifica visiva ha trovato foto crude sotto etichette di funghi cotti. Create tre fotografie distinte per champignon da pesare crudi e poi cuocere, champignon già cotti e shiitake cotti; aggiornate le ricette pertinenti, conservando il valore nutrizionale del peso a crudo dove indicato. Suite 229/229, stress mobile locale e pubblico riusciti. Manifest, HTML e asset `index-CAL7DCfp.js` allineati. La prova reale 1.20.0 → 1.20.1 ha conservato menu, 54 g, Ricette e scroll 900 → 894 px, senza errori JavaScript.
- Pubblicazione 1.20.2 sullo stesso link: foto degli asparagi crudi nel paniere distinta dalla foto degli asparagi preparati nelle sei ricette interessate; i grammi restano dichiarati a crudo. La preparazione del bulgur con tofu lascia ora crude le carote indicate come tali anche negli ingredienti. Suite 230/230 e stress mobile locale/pubblico riusciti. Manifest, HTML e asset `index-BJgne5gg.js` allineati; aggiornamento reale 1.20.1 → 1.20.2 con menu, 54 g, Ricette e scroll 900 → 900 px conservati, zero errori JavaScript.
- Collaudo stile e lavoro della 1.19.91 sulla versione pubblica: tutti i 14 pasti principali iniziali sono italiani, i cinque pranzi feriali sono trasportabili; anche dopo Asiatico → Italiano, i 14 pasti restano italiani/mediterranei e i cinque pranzi feriali restano pratici. Il nuovo panino caprese ha foto finale dedicata e istruzioni per mantenere al fresco la mozzarella, coerenti con le indicazioni di sicurezza alimentare della [FDA](https://www.fda.gov/food/buy-store-serve-safe-food/handling-food-safely-while-eating-outdoors) e del [Ministero della Salute](https://www.salute.gov.it/new/it/news-e-media/notizie/etichette-e-igiene-ecco-le-regole-la-sicurezza-alimentare/).
- Il repository nella cartella `Scheda Alimenti` è stato allineato senza cancellare le modifiche locali preesistenti; lo script di audit fotografico usa un percorso filesystem corretto anche quando la cartella contiene spazi.
- Su una settimana già confermata, il cambio dello stile alimentare a vegetariano ha riaperto il piano e ricalcolato 34 pasti non registrati senza carne o pesce, conservando il pasto già registrato.
- Una scelta libera di piatto completo anche fuori dalla categoria automatica resta visibile dopo la ricarica; il riequilibrio dei giorni successivi non reintroduce ricette escluse. La settimana segnala i pasti incompatibili ancora da fare e ne impedisce la conferma finché non sono sostituiti.
- Il collaudo pubblico modifica un componente a 777 g, registra il pasto, lo sostituisce con una ricetta diversa e verifica che peso vecchio e spunta scompaiano; la nuova identità resta dopo la ricarica. Check-in e ricalcoli puliscono solo gli override dei pasti modificati non registrati.
- Una combinazione estrema di 14 allergie, nessuna cottura, massimo cinque minuti e stile vegano non viene presentata come piano valido: Oggi e Settimana avvisano anche dopo reload; 28 pasti con alimenti esclusi sono marcati e la conferma è disabilitata, mentre altri 6 fuori preferenze sono distinti.
- Cambio allergie dopo conferma: settimana riaperta e tutti i 35 pasti aggiornati nel collaudo pubblico mobile, senza pane, pasta o avena generica nelle proposte mostrate; pasto già registrato conservato.
- Revisione pratica: spuntini automatici senza wafer o grissini, colazione Lavoro entro tre minuti, aggiunte caloriche senza duplicare yogurt o frutta secca, fagiolini distinti dai fagioli nella rotazione.
- Refresh automatico reale `1.19.88 → 1.19.89` e `1.19.89 → 1.19.90`: grammi delle fette biscottate `45 → 54` conservati, stesso menu e scroll `900 → 900` px dopo ciascun aggiornamento, senza errore JavaScript. Dalla 1.19.89 il manifest viene controllato prima del primo render, e una modifica già aperta resta protetta. Dalla 1.19.90 il deploy verifica manifest, HTML e asset serviti sul link pubblico.

## Stress test pubblico mobile

Eseguito sul link GitHub Pages con viewport 390×844:

- versione visibile coerente con il manifest;
- nessun overflow orizzontale in Oggi, Settimana, Ricette, Progressi e spesa;
- cinque pasti giornalieri e sette giorni settimanali presenti;
- cambio piatto aperto fino a fondo pagina: freccia di ritorno rimasta visibile e ritorno senza modifica riuscito;
- barra `Chiudi` / `Chiudi e riequilibra` visibile durante la modifica settimanale, fissa durante lo scroll e assente in Oggi;
- ricettario popolato, non bianco;
- lista della spesa con `Seleziona tutto` e `Deseleziona tutto`;
- ricarica della pagina con stato della vista e URL stabili;
- nessuna schermata di recupero e nessun errore JavaScript rilevato.

## Correzione dell'errore bloccante

Le revisioni `1.19.11–1.19.12` hanno eliminato due cause concatenate:

1. il recupero ora isola il salvataggio incompatibile e rimonta l'app pulita nello stesso documento, senza dipendere da un secondo reindirizzamento;
2. versione visibile e controllo aggiornamenti derivano dalla stessa proprietà di `package.json`, impedendo il ciclo continuo causato dal disallineamento manifest/client.

Il link resta unico: https://andreacivi80.github.io/vivapiatto/

## Checkpoint pubblico 1.20.3

- Foto C06 corretta: omelette agli spinaci, pane integrale e kiwi ora compaiono insieme; PNG mobile ottimizzato a 512 px.
- `npm test`: 230/230 test passati; audit foto 585/585, foto complete 266/266, paniere richiesto 217/217.
- Deploy GitHub Actions completato; manifest pubblico `1.20.3` e script `index-BBTNfnJ8.js` allineati sullo stesso link.
- Aggiornamento reale `1.20.2 → 1.20.3`: menu, grammatura 54 g e scroll a 900 px conservati; nessun errore JavaScript.
- Stress test pubblico mobile 390×844 superato: nessun overflow orizzontale, ricette e sgarri accessibili, anteprima settimana e passaggi di modifica operativi.

## Checkpoint pubblico 1.20.4

- Scansione visiva iniziale completata per C01–C44; sostituita la foto C05 che ometteva le fragole previste dalla preparazione.
- `npm test`: 231/231 test passati; foto 585/585, ricette finali 266/266, paniere richiesto 217/217.
- Manifest e script pubblici allineati: `1.20.4` e `index-gg4WG46A.js` sul link GitHub Pages unico.
- Aggiornamento automatico reale `1.20.3 → 1.20.4`: menu, grammatura 54 g e scroll a 900 px conservati; nessun errore JavaScript.
- Stress test pubblico mobile 390×844 superato, compresi ricettario, sgarri, settimana e modifiche dei pasti.

## Checkpoint pubblico 1.20.5

- Controllo iniziale della revisione esteso a 8 secondi con più verifiche dell'allineamento fra manifest, HTML e script: su rete lenta si evita di mostrare prematuramente la vecchia schermata. Se la rete non risponde, l'app apre i dati salvati e continua a controllare ogni 5 secondi; una modifica in corso non viene interrotta.
- Otto foto finali S27–S34 corrette: ogni card rappresenta lo spuntino completo, mentre i componenti conservano le proprie immagini singole.
- `npm test`: 233/233 test passati; foto 593/593, ricette finali 266/266, paniere richiesto 217/217.
- GitHub Actions completato; manifest pubblico `1.20.5` e script `index-s8nreN6l.js` allineati sullo stesso link.
- Stress test pubblico mobile 390×844 superato: versione corretta, nessun overflow orizzontale, scelte e grammature conservate dopo ricarica, nessun errore JavaScript.
- Il test dell'aggiornamento dal client già aperto `1.20.4 → 1.20.5` è partito prima che Pages distribuisse i nuovi file: ha confermato conservazione di menu, 54 g e scroll a 900 px, ma non la transizione di versione in quella finestra. La transizione reale resta da riprovare al prossimo deploy.
