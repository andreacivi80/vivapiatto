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

## Checkpoint pubblico 1.20.6

- Quattro foto finali D49–D52 sostituite con il piatto completo, non più l'ingrediente singolo. Identificato il medesimo difetto su D53–D64, ora in lavorazione.
- `npm test`: 234/234 test passati; 597/597 foto disponibili; 266/266 ricette con foto finale distinta.
- Manifest e script pubblici allineati: `1.20.6` e `index-B_Sg4NGI.js` sul link GitHub Pages unico. Stress test mobile 390×844 superato senza errori JavaScript o overflow.
- Aggiornamento automatico reale `1.20.5 → 1.20.6` superato: versione visibile aggiornata senza comando dell'utente, menu e grammatura a 54 g conservati, scroll a 900 px ripristinato, nessun errore JavaScript.

## Checkpoint pubblico 1.20.7

- D53–D64 completate con dodici fotografie distinte dei piatti interi; la prima scansione visiva delle matrici di pranzo e cena è registrata in `PHOTO-AUDIT.md`.
- `npm test`: 235/235 test passati; 609/609 foto disponibili; 266/266 ricette con fotografia finale distinta.
- Manifest e script pubblici allineati: `1.20.7` e `index-BucyxBBI.js` sul link GitHub Pages unico. Test pubblico mobile 390×844 superato senza overflow o errori JavaScript.
- Aggiornamento reale `1.20.6 → 1.20.7` automatico e riuscito: versione visibile corretta, menù e grammatura a 54 g conservati, scroll a 900 px ripristinato.

## Checkpoint pubblico 1.20.8

- Corrette due foto PNG troncate (cipollotti e vino bianco) e quattro foto atomiche non rappresentative (farro cotto, noci, semi di girasole e di zucca).
- L'audit fotografico ora decomprime i dati PNG e controlla che il numero di pixel sia completo: 609/609 asset referenziati superano il controllo; `npm test` 235/235 prima dell'ultima asserzione fotografica, poi test statici mirati superati.
- Manifest e script pubblici allineati: `1.20.8` e `index-BFKscQ-B.js`; tutte le sei nuove immagini rispondono `200 image/png` sullo stesso link. Stress test mobile pubblico superato, senza overflow, schermata bianca o errori JavaScript.

## Checkpoint pubblico 1.20.9

- Foto di cipolle crude, cracker integrali e tre risi rese coerenti con le rispettive descrizioni e con lo stato crudo/cotto. Nessun alimento aggiunto o quantità nutrizionale cambiata.
- `npm test` 237/237; audit foto 609/609; 266/266 ricette con foto finale distinta. Manifest pubblico `1.20.9`, script `index-C9GMoHXq.js` e cinque nuove foto verificati sul link esistente; stress test mobile pubblico superato, incluso «+ → Sgarri», senza overflow o errori JavaScript.
- Il test di transizione su scheda già aperta `1.20.8 → 1.20.9` è scaduto prima di osservare il cambio di versione: ha conservato menù, grammatura 54 g e scroll 900 px, ma non prova il refresh automatico di questo passaggio. Il manifest pubblico risulta poi allineato; ripetere la verifica live alla prossima pubblicazione avviando l'osservazione immediatamente prima del push.

## Checkpoint pubblico 1.20.10

- Corretto il controllo di disponibilità della release: verifica la stessa URL principale `/vivapiatto/` che verrà ricaricata, non `/vivapiatto/index.html` che GitHub Pages può tenere in una cache diversa. La testata distingue la versione attiva da quella nuova e permette di aggiornare subito; l'aggiornamento automatico resta rinviato se una modifica è ancora aperta.
- `npm test` 237/237. Manifest pubblico `1.20.10` e script `index-BYFG0R5v.js` allineati sullo stesso link. Test mobile pubblico riuscito, senza overflow o errori JavaScript.
- Test di transizione live `1.20.9 → 1.20.10` riuscito su una scheda lasciata aperta: refresh automatico osservato, grammatura 54 g, menù e scroll 900 px preservati; nessun errore JavaScript. Questo prova il passaggio osservato, non garantisce assenza di futuri ritardi di rete o cache.

## Checkpoint pubblico 1.20.11

- Separati i pranzi proposti per la mensa da quelli trasportabili per il lavoro. Il paniere mensa contiene preparazioni semplici da confrontare con il menù effettivo, non presume la disponibilità di un piatto specifico. Indicazioni generali: [Ministero della Salute, ristorazione collettiva](https://www.salute.gov.it/new/it/tema/nutrizione/linee-di-indirizzo-nazionale-la-ristorazione-collettiva/) e [CREA, mangiare fuori casa](https://sapermangiare.an.crea.gov.it/files/download/linee-guida/linee-guida-09.pdf).
- `npm test` 238/238; matrice di 24 profili locali e pubblici (Italiano/Asiatico × Lavoro/Casa/Mensa × 1400/2000/2600/3000 kcal) senza overflow o scostamenti oltre la soglia di test. Manifest pubblico `1.20.11`, HTML e asset `index-DeqFZpga.js` allineati. Stress mobile pubblico superato.
- Test live `1.20.10 → 1.20.11` riuscito con una scheda già aperta: versione aggiornata automaticamente, grammatura 54 g, menù e scroll (~900 px) preservati, zero errori JavaScript. Aggiunto il controllo del link pubblico diretto senza query e della versione effettivamente mostrata nella testata; un avviso che cita la release nuova non basta più per dichiarare aggiornata la schermata. La propagazione delle cache GitHub può comunque non essere simultanea in tutte le reti.

## Checkpoint pubblico 1.20.12

- Rimossa la doppia calibrazione delle porzioni: i grammi mostrati per i componenti corrispondono a quelli usati per calorie e macronutrienti. L'hummus non viene più trattato come ceci interi. Caso Italiano/Casa/1400 kcal: il piano osservato passa da 1554 a 1400 kcal; lo spuntino mostra 30 g di hummus, 100 g di carote e 100 g di finocchi, 122 kcal totali.
- Le modifiche manuali al menù riadattano i giorni successivi verso il rispettivo target senza cancellare pasti registrati o componenti già modificati. La matrice locale e pubblica di 24 combinazioni Italiano/Asiatico × Lavoro/Casa/Mensa × 1400/2000/2600/3000 kcal e lo stress mobile sono passati, senza overflow o errori JavaScript. Un cambio pranzo a 2000 kcal ha prodotto il giorno successivo a 1961 kcal, mantenendo il nuovo piatto.
- `npm test` 242/242, typecheck, build e audit degli ingredienti/foto riusciti. Manifest pubblico `1.20.12`, HTML e script `index-Bl4ak87y.js` allineati sul link diretto. Il test della transizione live legge l'esatta versione nella testata: il testo dell'avviso di aggiornamento non può più far risultare nuova una schermata ancora vecchia. Transizione osservata `1.20.11 → 1.20.12` su una scheda già aperta: menù invariato, 54 g modificati e scroll 900 → 894 px conservati; nessun errore JavaScript. GitHub Pages può comunque propagare file nuovi in tempi diversi tra cache e reti, quindi il controllo riprova e aggiorna quando la release completa è disponibile senza interrompere una modifica aperta.

## Checkpoint pubblico 1.20.13

- L'elenco dei piatti completi consigliati calcola compatibilità e kcal con le stesse porzioni che verranno inserite dopo la scelta, ignorando le modifiche appartenenti al piatto che viene sostituito. Prima la card mostrava le kcal della ricetta base, che potevano differire dal piatto inserito.
- Le scelte consigliate del piatto intero rispettano ora i filtri attivi del profilo, oltre alla fascia del pasto: stile alimentare, allergie/esclusioni, attrezzatura e tempo. Le scelte libere restano disponibili separatamente.
- `npm test` 243/243, typecheck e build superati. Nel test mobile locale e pubblico, dopo aver cambiato un componente da 40 a 60 g, l'alternativa kefir/papaya/muesli/mandorle indicava 440 kcal nella card e 440 kcal nel pasto scelto. Matrice locale e pubblica di 24 profili superata; stress mobile pubblico senza overflow o errori JavaScript. Manifest pubblico `1.20.13`, HTML e asset `index-BkRNrnml.js` allineati; il numero effettivo nella testata pubblica è stato verificato.
- Non è stata ottenuta una misura valida della transizione automatica di una scheda già aperta per questa release: una sonda è scaduta prima della pubblicazione e quella successiva si è avviata sulla versione già nuova. Questo non contraddice le prove valide delle release precedenti, ma non viene riportato come successo della 1.20.13. Il controllo va avviato immediatamente prima del prossimo push.

## Checkpoint pubblico 1.20.14

- GitHub Pages espone `Cache-Control: max-age=600` per pagina e manifesto: una cache può far vedere temporaneamente una testata precedente. La nuova testata mette in primo piano la revisione pubblicata rilevata dal manifesto e indica separatamente la versione effettivamente in uso, senza interrompere una modifica aperta.
- `npm test`: 244/244 superati; typecheck e build riusciti. Il link diretto, il manifesto `1.20.14` e lo script `index-CxddhevD.js` sono allineati. Lo stress mobile pubblico conferma `v1.20.14` nella testata, nessun overflow e zero errori JavaScript.
- Un browser isolato già aperto sulla 1.20.13 è passato automaticamente alla 1.20.14 mantenendo il menù, i 49 g modificati e lo scroll a 900 px. La stessa sonda ha contato 11 eventi di errore durante la navigazione senza registrarne il dettaglio; pertanto il requisito «zero errori durante la transizione» non è certificato per questo passaggio e va diagnosticato al prossimo aggiornamento reale. La prova a freddo della nuova versione ha zero errori. Una seconda prova di navigazione sulla stessa 1.20.14, con i medesimi marcatori di ripristino, ha conservato menù, 49 g e scroll 900 px con zero errori; il test di transizione ora registra il dettaglio degli errori futuri.

## Checkpoint pubblico 1.20.15

- Nuova foto per P38 «Bulgur con salmone, finocchi e arancia»: il salmone grigliato è visibile e distinto dal bulgur; asset dal nome nuovo per non recuperare dalla cache l'immagine precedente. Le altre immagini P17–P48 sono state esaminate su tavole di contatto, non certificate singolarmente.
- `npm test` 244/244, typecheck e build riusciti; manifesto pubblico `1.20.15`, HTML e asset `index-DvelAzhW.js` allineati. Stress mobile sulla pagina pubblica superato: versione visibile nella testata, immagini in vista caricate, nessun overflow orizzontale e zero errori JavaScript nei flussi provati.
- La sonda avviata sulla 1.20.14 prima del push ha osservato la navigazione automatica reale alla 1.20.15: stesso menù, stessa modifica a 49 g, stessa posizione di scroll a 900 px, nessun errore JavaScript. Questo verifica la transizione attuale; non riclassifica retroattivamente gli 11 eventi non descritti del passaggio precedente.

## Checkpoint pubblico 1.20.16

- Confrontate le foto dei pranzi P49–P64 con nomi e ingredienti principali. P58 espone ora 5 g di zenzero, 3 g di aglio e 10 g di succo di limone che erano richiesti dal testo della ricetta ma mancavano dal calcolo; il cavolo rosso resta crudo come indicano foto e voce nutrizionale, mentre i funghi vengono cotti.
- `npm test` 245/245, typecheck e build riusciti. Release pubblica `1.20.16` e asset `index-CtqLG7Fh.js` verificati; stress mobile pubblico superato, senza errori JavaScript, immagini mancanti in vista o overflow nei percorsi provati.
- Una scheda isolata sulla 1.20.15 è passata automaticamente alla 1.20.16 senza perdere menù, modifica a 49 g o posizione di scroll a 900 px. Zero errori JavaScript registrati nella transizione.

## Checkpoint pubblico 1.20.17

- Scansione D01–D16: D14 mostrava il cavolo rosso crudo come componente ma lo cuoceva al forno. Nuova foto atomica del cavolo arrostito, con istruzione di pesare 250 g prima della cottura e stima nutrizionale riferita a quel peso. Zenzero, paprika e aceto di mele richiesti dall'elenco originale ora figurano con grammi, valori e immagini.
- `npm test` 246/246, typecheck e build riusciti. Lo script mobile resta sotto il limite statico di 576 kB, pur con un avviso di Vite per chunk superiori a 575 kB: ulteriore alleggerimento resta opportuno. Manifest, HTML e asset `index-BlWj72sr.js` pubblici allineati; stress mobile pubblico senza errori JavaScript né overflow nei percorsi provati.
- La navigazione automatica reale 1.20.16 → 1.20.17 ha conservato lo stesso menù, i 49 g modificati e lo scroll a 900 px; zero errori JavaScript.

## Checkpoint pubblico 1.20.18

- D24 ora mostra il cavolo rosso arrostito nel componente al posto della foto cruda. Aceto di mele 10 g, pepe nero 1 g ed erba cipollina fresca 5 g, già nel testo originale senza grammi, partecipano al calcolo e hanno foto separate. La card specifica 150 g di salmone **cotto**, mentre l'allegato ne indicava 150 g **crudi**: la differenza rimane un lavoro aperto, non una conversione certificata.
- `npm test` 247/247, typecheck e build riusciti. L'asset mobile è sotto i limiti automatici di 580 kB non compressi e 130 kB gzip; la soglia gzip aggiunge un controllo utile al precedente limite del solo file grezzo. Manifest pubblico `1.20.18`, HTML e `index-m9_LUwGE.js` allineati.
- Transizione reale 1.20.17 → 1.20.18: menù, 49 g modificati e scroll a 900 px conservati, zero errori JavaScript. Uno stress pubblico ha inizialmente letto come assente l'avviso allergie 5 secondi dopo un reload; la ripetizione è passata. La sonda ora aspetta fino a 15 secondi il ripristino effettivo e un'ulteriore esecuzione ha superato il percorso senza errori o overflow. Questo migliora il test, non prova da solo che ogni caricamento utente abbia la stessa durata.
