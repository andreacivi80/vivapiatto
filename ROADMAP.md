# Tavola Mia — roadmap versioni

Questa lista raccoglie le richieste dell'utente. Dopo ogni rilascio viene aggiornata senza perdere le richieste destinate alle versioni successive.

## v1.19.80 — spuntini pratici in Lavoro e Mensa

- [x] Il ranking automatico penalizza spuntini con due o più ortaggi da preparare, più componenti o oltre cinque minuti; restano disponibili nelle alternative e nella scelta libera.
- [x] Telefono simulato: a 1400 kcal pera e crema di mandorle / anguria e yogurt proteico; a 2600 banana e yogurt proteico / skyr e melagrana; a 3000 banana e yogurt proteico / uva, skyr e cracker. Casa mantiene scelte diverse. Nessun overflow o errore JavaScript.
- [x] Suite completa 208/208, TypeScript, build e collaudo mobile locale della versione esatta.
- [ ] Pubblicazione sullo stesso link e collaudo pubblico.

## v1.19.79 — pubblicata e verificata

- [x] “Più varietà” considera anche basi amidacee e ortaggi non ancora proposti nei pasti principali, con un peso inferiore a equilibrio e calorie.
- [x] Le diverse cotture dello stesso alimento non gonfiano artificialmente il conteggio; la settimana mostra i due numeri senza inventare range nutrizionali.
- [x] I pasti già registrati entrano nel conteggio e rimangono invariati quando si rigenera la settimana.
- [x] Suite completa 208/208, build e collaudo mobile locale della v1.19.79: sette basi e sedici ortaggi distinti nei pasti principali, zero errori JavaScript, immagini rotte o overflow.
- [x] Pubblicazione sul link unico e collaudo mobile pubblico della versione esatta: 7 basi e 16 ortaggi nella settimana, senza errori JavaScript, immagini rotte, schermate di recupero o overflow.

## v1.19.78 — pubblicata e verificata

- [x] Per vegetariano, pescetariano e vegano la Settimana mostra solo le famiglie compatibili, senza presentare i range onnivori come errori da correggere.
- [x] Il comando di rotazione cerca piatti compatibili anche quando la famiglia della sequenza onnivora non è disponibile; conserva i pasti già registrati.
- [x] Le ripetizioni negli stili non onnivori confrontano l'alimento proteico effettivo, non l'intera famiglia vegetale.
- [x] Inserito un collaudo mobile di rotazione vegetariana e conteggi vegani, senza inventare target clinici per questi stili.
- [x] Suite completa nella cartella richiesta: 208/208 test, build e collaudo mobile locale della versione esatta superati. Settimana vegetariana con tre sole categorie pertinenti, rotazione senza carne/pesce, pasto registrato conservato; vegano senza falsi allarmi di range.
- [x] Pubblicazione sul link unico e collaudo mobile pubblico: nessun errore JavaScript, foto rotta, immagine pendente o overflow; settimana vegetariana con tre categorie pertinenti, senza carne/pesce e con pasto registrato invariato.

## v1.19.77 — pubblicata e verificata

- [x] Allineata la cartella `C:\Users\utente38\Desktop\Manuale\Scheda Alimenti` al repository GitHub senza sovrascrivere le modifiche precedenti, conservate in uno stash recuperabile.
- [x] Corretto l'audit fotografico che interpretava lo spazio del percorso come `%20` e interrompeva `npm test` nella cartella reale.
- [x] Nella cartella richiesta: 569 fotografie controllate, 214 ricette della matrice e 217 alimenti del paniere; aggiunta una prova regressiva per i percorsi con spazi.
- [x] Suite completa nella cartella richiesta: 207/207 test, build e prova mobile locale della v1.19.77 superati senza errori JavaScript o overflow.
- [x] Pubblicazione sullo stesso link e prova mobile pubblica della versione esatta: zero errori JavaScript, immagini pendenti o rotte e overflow.

## v1.19.76 — pubblicata e verificata

- [x] Cambiare stile alimentare, tempo massimo o attrezzature su una settimana confermata la riapre e ricalcola tutti i pasti ancora da fare, non solo il giorno corrente.
- [x] Stress mobile aggiunto: settimana confermata, stile vegetariano, pasti non registrati senza carne/pesce, pasto già registrato conservato; poi ripristino dello stile e prova dei filtri estremi.
- [x] Prova mobile locale: settimana bloccata riaperta dal cambio a vegetariano, 34 pasti non registrati senza carne o pesce, pasto registrato invariato dopo ricarica; test estremo delle allergie e zero errori JavaScript.
- [x] Suite tecnica: 206/206 test, TypeScript e build superati.
- [x] Pubblicazione e collaudo mobile pubblico della versione esatta: settimana confermata riaperta al cambio di stile, 34 pasti ancora da fare privi di carne e pesce, pasto registrato conservato, avvisi per filtri estremi persistenti e zero errori JavaScript o overflow.

## v1.19.75 — pubblicata e verificata

- [x] Il paniere da lavoro non riprende più ricette fuori dallo stile alimentare, dal tempo massimo o dalle attrezzature disponibili.
- [x] Se nessuna colazione rapida è compatibile, il sistema non sostituisce di nascosto con una preparazione troppo lunga.
- [x] Oggi e Settimana mostrano in modo permanente quando i filtri non permettono un piano automatico; i pasti preesistenti fuori preferenze sono distinguibili dagli alimenti esclusi.
- [x] Stress mobile locale con 14 allergie, stile vegano, massimo 5 minuti e nessuna cottura: avviso persistente in Oggi/Settimana anche dopo reload, 28 pasti esclusi evidenziati e settimana non confermabile, 6 fuori preferenze distinti, zero overflow o errori JavaScript.
- [x] Suite completa: TypeScript, build e 206/206 test superati.
- [x] Pubblicazione e collaudo mobile pubblico della versione esatta: 14 allergie estreme, avvisi persistenti anche dopo reload, 28 pasti esclusi segnalati, settimana non confermabile, zero errori JavaScript e overflow.

## v1.19.74 — pubblicata e verificata

- [x] Sostituire un piatto intero azzera componenti, grammi e rimozioni della ricetta precedente; il nuovo piatto mostra solo i propri ingredienti.
- [x] Se un pasto già registrato viene sostituito, la spunta torna da fare: una ricetta mai mangiata non viene conteggiata come consumata.
- [x] Check-in, cambio profilo, riequilibrio giornaliero e settimanale cancellano gli override obsoleti solo nei pasti ricalcolati e non registrati; i pasti già mangiati restano invariati.
- [x] Il collaudo da cellulare verifica una grammatura modificata, la registrazione, la sostituzione completa, la sparizione della vecchia quantità e lo stato da fare, oltre alla persistenza dopo ricarica.
- [x] Prova mobile locale: modifica a 777 g, registrazione, sostituzione intera, vecchia grammatura sparita, pasto non più segnato come mangiato, identità nuova persistente dopo ricarica; cinque giorni successivi senza glutine, zero errori JavaScript.
- [x] Suite tecnica completa: TypeScript, build e 206/206 test superati.
- [x] Pubblicazione e prova mobile pubblica della versione esatta: nuova ricetta persistente, vecchio peso rimosso e pasto da registrare, 35 pasti senza glutine dopo il filtro, zero errori JavaScript e overflow.

## v1.19.73 — pubblicata e verificata

- [x] Il riequilibrio dei giorni seguenti usa solo ricette compatibili anche con allergie, attrezzature e tempo massimo: il menu italiano da lavoro non può più reinserire una ricetta predefinita fuori dal paniere filtrato.
- [x] Una scelta esplicita libera rimane applicata anche se il piatto appartiene a una categoria diversa dal momento del pasto; il piano automatico continua a usare le categorie coerenti.
- [x] Nella settimana i pasti ancora da fare con alimenti esclusi sono evidenziati e non è possibile confermare il piano finché non vengono sostituiti; quelli già registrati restano nello storico.
- [x] Collaudo mobile locale: scelta libera di piatto completo a colazione salvata anche dopo ricarica, cinque giorni successivi senza glutine, nessun errore JavaScript; suite 206/206 superata.
- [x] Pubblicazione e collaudo mobile pubblico della versione esatta sul link unico: 35 pasti senza glutine, scelta libera persistente, giorni successivi compatibili, zero errori JavaScript e overflow.

## v1.19.72 — pubblicata e verificata

- [x] Il filtro glutine esclude l'avena generica, compresi fiocchi e bevanda, perché senza certificazione può essere contaminata.
- [x] La verifica allergeni unisce la dichiarazione della ricetta al controllo dei singoli ingredienti, impedendo che un elenco incompleto renda eleggibili pane e pasta.
- [x] Nuova colazione reale da lavoro senza cereali: yogurt, banana, noci e miele, due minuti, componenti modificabili e foto finale dedicata generata dalla ricetta.
- [x] Il collaudo mobile include l'avena nel filtro, verifica 35/35 pasti e conserva il pasto registrato; 206 test, TypeScript e prova mobile locale passati.
- [x] Pubblicazione sul link unico e collaudo mobile pubblico della versione esatta: 35/35 pasti compatibili nel test glutine, pasto registrato invariato, zero errori JavaScript e overflow.

## v1.19.71 — pubblicata; lacuna individuata dal collaudo rafforzato

- [x] Agli spuntini con biscotti o pane non vengono più aggiunti anche cracker per far salire le calorie: una quota di noci è più coerente e resta soggetta ad allergie e preferenze.
- [x] Il collaudo mobile registra un pasto prima del cambio allergia e ne verifica nome e stato dopo il ricalcolo della settimana.
- [x] 206 test, TypeScript e collaudo mobile locale superati: spuntino senza doppio cereale, pasto registrato preservato, nessun errore JavaScript.
- [x] Pubblicazione sullo stesso link: spuntino e pasto registrato verificati; il test pubblico rafforzato ha rilevato avena con il filtro glutine e ha aperto la correzione della 1.19.72.

## v1.19.70 — pubblicata e verificata

- [x] Se un'allergia, un'intolleranza o un'esclusione cambia dopo la conferma, la settimana torna modificabile e ricalcola tutti i giorni futuri non registrati.
- [x] I pasti già registrati come mangiati restano invariati durante il ricalcolo.
- [x] 206 test, TypeScript e prova mobile sulla settimana confermata superati in locale: 35/35 pasti coerenti dopo l'allergia al glutine, nessun errore JavaScript o overflow.
- [x] Pubblicazione e collaudo pubblico della versione esatta `1.19.70`: 35 pasti senza glutine dopo il cambio, nessun errore JavaScript o overflow.

## v1.19.69 — pubblicata e verificata

- [x] A 3000 kcal le aggiunte a uno spuntino salato con verdure diventano una porzione pratica di pane, senza banana e cracker arbitrari.
- [x] Le aggiunte automatiche rispettano alimenti esclusi, allergie dichiarate e stile alimentare; le card segnalano anche un ingrediente aggiunto incompatibile.
- [x] Cambiare allergie, intolleranze o alimenti da evitare ricalcola subito le proposte non ancora registrate, mantenendo quelle già mangiate.
- [x] 206/206 test, TypeScript e collaudo mobile del target 3000 e del filtro glutine superati in locale.
- [x] Pubblicazione sullo stesso link e collaudo mobile pubblico della versione esatta, senza errori JavaScript o overflow.

## v1.19.68 — pubblicata e verificata

- [x] Colazione automatica di Lavoro/Mensa limitata alle preparazioni da massimo tre minuti, lasciando frullati, pancake e toast nel ricettario e nella scelta libera.
- [x] Prova mobile aggiunta per bloccare il ritorno di colazioni elaborate nella modalità Lavoro.
- [x] Test completi e collaudo mobile: in Lavoro compare una colazione con fette biscottate, confettura e latte, senza frullato automatico.
- [x] Pubblicazione sullo stesso link e collaudo pubblico della versione esatta.
- [x] Refresh automatico reale `1.19.67 → 1.19.68`: menu, latte modificato da 200 a 209 g e scroll a 900 px conservati, senza recupero o errori JavaScript.

## v1.19.67 — pubblicata e verificata

- [x] Corrette le dichiarazioni di tipo delle fonti alimentari senza perdere i codici di provenienza CREA e USDA.
- [x] Ripristino filtri da memoria limitato alle opzioni valide; modalità del gelato composta ricondotta a `parts`.
- [x] Controllo TypeScript pulito e integrato nel comando di test, con tipi Node per il file di configurazione Vite.
- [x] Test completi e verifica mobile locale senza errori JavaScript o overflow.
- [x] Pubblicazione sullo stesso link e collaudo pubblico della versione esatta.

## v1.19.66 — pubblicata e verificata

- [x] Le proposte automatiche di spuntino privilegiano frutta, yogurt, frutta secca e abbinamenti pratici; wafer e grissini restano selezionabili solo a scelta dell'utente.
- [x] Ai target calorici più alti non viene aggiunto un secondo yogurt/skyr o una seconda frutta secca quando il piatto ne contiene già.
- [x] La proposta iniziale riduce la priorità dei piatti con tre legumi; il ricettario e le alternative li mantengono disponibili.
- [x] Fagiolini riconosciuti come contorno e roast beef come carne rossa: verificata la famiglia proteica effettiva di tutti i 14 pasti principali della settimana iniziale.
- [x] Verifica mobile reale della 1.19.66, pubblicazione sul link unico e collaudo pubblico della versione esatta.

## v1.19.65 — pubblicata e verificata

- [x] Un errore temporaneo della CDN su una fotografia viene ricontrollato direttamente prima di bloccare il collaudo.
- [x] Solo una risposta reale riuscita può classificare l'errore come transitorio; asset mancanti, non leggibili o ancora pendenti restano bloccanti.
- [x] Il collaudo ripete la scansione delle immagini quando React sostituisce una tessera durante il ritorno dal selettore, verificando i nodi realmente visibili.
- [x] Stress pubblico 390×844 completato sulla versione esatta `1.19.65`: zero errori JavaScript, immagini rotte, immagini pendenti, overflow o schermate di recupero.

## v1.19.64 — pubblicata e verificata localmente

- [x] Il timeout delle fotografie viene iniettato esplicitamente nelle quattro valutazioni eseguite dentro il browser.
- [x] Un test permanente impedisce che una variabile Node non disponibile nella pagina interrompa nuovamente il collaudo.

## v1.19.63 — pubblicata, collaudo sostituito

- [x] Il collaudo attende fino a 20 secondi le fotografie visibili quando GitHub Pages consegna gli asset lentamente.
- [x] Le immagini concluse con errore e quelle ancora pendenti restano condizioni bloccanti: l'attesa maggiore non nasconde difetti reali.

## v1.19.62 — pubblicata e verificata localmente

- [x] La modifica della grammatura nel collaudo pubblico usa un vero evento di digitazione del browser, non una modifica artificiale del DOM.
- [x] Il controllo attende il salvataggio effettivo prima della ricarica e continua a bloccare la pubblicazione se il valore non persiste.

## v1.19.61 — pubblicata e verificata

- [x] L'avvio del collaudo mobile concede fino a 30 secondi a Edge headless e, in caso di blocco reale, riporta stato del processo e profilo temporaneo invece di un errore generico.
- [x] Stress pubblico 390×844 concluso sulla versione esatta: tutti i flussi verdi, fotografie caricate, grammi persistenti e zero errori JavaScript.

## v1.19.60 — pubblicata e verificata

- [x] Lo stress pubblico attende realmente la fotografia del dettaglio del piatto pronto, sia quando l'immagine finale porta direttamente la classe visuale sia quando il piatto usa più fotografie.
- [x] La persistenza dei grammi attende il salvataggio asincrono prima della ricarica e gli eventuali errori JavaScript riportano metodo, testo e URL invece del solo conteggio.
- [x] Stress pubblico 390×844 superato integralmente: dettaglio piatto pronto e componenti caricati, grammatura persistente, zero errori JavaScript, zero immagini rotte e nessun overflow.

## v1.19.59 — pubblicata e verificata

- [x] Sostituite due immagini storiche non aderenti: toast ricotta-uovo-pomodoro e quinoa-lenticchie-kiwi ora mostrano esattamente gli ingredienti della ricetta.
- [x] Prosegue l'audit visivo delle 17 ricette con asset storici, oltre ai controlli automatici di presenza, semantica e unicità.
- [x] Audit visivo concluso sulle 17 ricette storiche: 15 immagini già aderenti e due sostituite con fotografie dedicate.

## v1.19.58 — pubblicata e verificata

- [x] Lo stress test mobile seleziona obbligatoriamente la scheda Tavola Mia invece di una scheda Edge vuota.
- [x] Il test attende il caricamento reale dell'interfaccia e delle foto dei componenti prima di misurare menu, scroll e immagini.
- [x] Gli errori di caricamento riportano stato pagina, script e log recenti per distinguere un difetto dell'app da un bersaglio browser errato.
- [x] Stress pubblico 390×844 completato sulla versione esatta: nessun errore JavaScript, nessuna schermata di recupero, nessun overflow o immagine rotta; flussi Oggi, Settimana, Ricette, alternative, spesa, extra, gelato, registrazione, componenti, piatto pronto, check-in e profilo tutti operativi.

## v1.19.57 — verificata

- [x] Sei ricette con immagini condivise o semanticamente errate ricevono fotografie finali distinte: cracker-ricotta-miele, fette-burro-confettura, coppa mela-avena, riso-tonno-verdure, bowl salmone-riso e insalatona tonno-ceci.
- [x] Eliminata la poke con tonno crudo e ingredienti estranei dalla ricetta quotidiana riso basmati e tonno.
- [x] Nuovo audit bloccante: nessuna fotografia può essere condivisa da due ricette reali differenti.

## v1.19.56 — verificata

- [x] Lo stress test del target calorico riparte da un profilo pulito, separato da gelato, piatti pronti e grammature modificati nelle prove precedenti.
- [x] Il controllo pubblico blocca la release se il ripristino pulito apre la schermata di recupero o conserva scelte manuali.

## v1.19.55 — verificata

- [x] Pasta in bianco, bowl pollo-quinoa-ceci e pollo-farro-peperoni ricevono tre fotografie complete e fedeli, senza immagini atomiche o generiche condivise.
- [x] Nuovo audit semantico bloccante: 257/257 ricette reali usano una fotografia finale esplicita.

## v1.19.54 — verificata

- [x] Pollo con quinoa, barbabietola e spinaci riceve una fotografia completa della ricetta, non più la sola foto atomica del pollo.
- [x] I quattro componenti restano separati e riconoscibili nella tessera mobile, senza ingredienti estranei.

## v1.19.53 — verificata

- [x] Bulgogi VisitKorea riallineato agli ingredienti effettivi: riso, manzo, carote, cipolla e spinaci.
- [x] Rimossa dalla fotografia la zucchina non presente nella ricetta e mantenuta la ciotola intera nelle card mobili.

## v1.19.52 — verificata

- [x] Kashiwa-meshi MAFF riceve una fotografia finale autentica del riso condito con pollo, carote e funghi.
- [x] Eliminato il precedente riuso della foto generica del solo riso; ciotola completa e margini sicuri per le card mobili.

## v1.19.51 — verificata

- [x] Keihan MAFF sostituito con una fotografia finale autentica e completa, non più con la foto generica del solo riso.
- [x] Riso, pollo sfilacciato, uovo a striscioline, funghi, fagiolini e brodo sono tutti riconoscibili e coerenti con ingredienti e preparazione.

## v1.19.50 — verificata

- [x] Negima-nabe MAFF con nuova fotografia completa: tonno cotto, porro, shiitake e ciotola di riso separata.
- [x] Tonno chiaramente cotto e nessun sashimi o ingrediente estraneo nella card.

## v1.19.49 — verificata

- [x] Phat Thai con fotografia finale fedele: noodles di riso, gamberi cotti, uovo, germogli, erba cipollina, arachidi e lime.
- [x] Foto in formato mobile senza spaghetti, ingredienti estranei, testo o ritagli del piatto.

## v1.19.48 — verificata

- [x] Japchae VisitKorea con nuova fotografia finale fedele: vermicelli traslucidi, manzo cotto, spinaci, carote, funghi e sesamo.
- [x] Piatto intero leggibile nella card mobile e immagine separata dalle fotografie atomiche.

## v1.19.47 — verificata

- [x] Oyakodon MAFF con nuova fotografia finale fedele: riso, pollo, cipolla, funghi e uovo cotto tutti riconoscibili.
- [x] Inquadratura mobile mostra la ciotola intera, senza collage, testo o ingredienti estranei.

## v1.19.46 — verificata

- [x] Bibimbap verificato da fonte ufficiale VisitKorea con fotografia finale nuova e fedele alla ricetta.
- [x] Zucchine e sesamo presenti sia nel testo nutrizionale sia nell'immagine, con componenti sostituibili separatamente.
- [x] Immagine dedicata cache-bustata, piatto intero visibile e nessun riuso generico.

## v1.19.45 — verificata

- [x] Misurazione della posizione iniziale eseguita dopo il completamento reale dello scroll mobile.
- [x] Confronto finale bloccante fra posizione iniziale e posizione ripristinata.

## v1.19.44 — verificata funzionalmente

- [x] Navigazione mobile del collaudo individuata dal testo accessibile completo, comprese le icone dei pulsanti.
- [x] Verifica automatica reale del passaggio 1.19.43 → 1.19.44 con stato utente conservato.

## v1.19.43 — verificata staticamente

- [x] Il collaudo usa una vista Ricette realmente più alta dello schermo mobile per misurare lo scroll.
- [x] La navigazione automatica di release viene rilevata prima che l'app ripulisca il parametro tecnico dall'indirizzo.
- [x] Dopo il ripristino della posizione, il test torna in Oggi e confronta menu e grammatura reali.

## v1.19.42 — verificata staticamente

- [x] Aggiornamento automatico tra due release pubbliche verificato senza azione dell'utilizzatore.
- [x] Menu, grammatura modificata e posizione di scorrimento devono restare invariati dopo il refresh automatico.
- [x] Schermata di recupero, overflow ed errori JavaScript bloccano la pubblicazione.

## v1.19.41 — verificata

- [x] Componente del Giorno 1 modificato realmente dall'editor settimanale.
- [x] La scelta persiste nella scheda Settimana e coincide esattamente nella vista Oggi.

## v1.19.40 — verificata

- [x] Totale calorico visibile letto direttamente dalla barra del giorno per 1400 e 2600 kcal.
- [x] Il piano alto deve superare quello basso di almeno 300 kcal e cambiare realmente composizione.

## v1.19.39 — verificata

- [x] Tre cicli completi di scroll mobile verificano che menu e grammature non cambino.
- [x] Ritorno in cima e assenza di scorrimento orizzontale controllati dopo ogni stress.

## v1.19.38 — verificata

- [x] Un piatto completo già scelto può essere sostituito nuovamente con un altro piatto completo.
- [x] Dopo la seconda sostituzione restano disponibili sia “Cambia piatto pronto” sia “Dividi in componenti”.

## v1.19.37 — verificata

- [x] Piatto completo sostituito realmente dal pannello alternative e fotografia verificata.
- [x] Scheda ricetta aperta con ingredienti, preparazione e fotografia caricata.
- [x] Divisione in componenti, ricomposizione invariata e blocco della ricomposizione dopo una sostituzione verificati su mobile.

## v1.19.36 — verificata

- [x] Target 1400 e 2600 kcal selezionati realmente e confrontati sul piano visibile.
- [x] Verificato che un target diverso cambia calorie pianificate o composizione del menu.
- [x] Contesto Lavoro/Casa confrontato sul piano reale, senza uscita orizzontale.

## v1.19.35 — verificata

- [x] Gonfiore verificato con cambio reale del menu e cena senza i trigger comuni mappati.
- [x] Stanchezza e riposo scarso verificati con ricalcolo e indicazioni coerenti.
- [x] Attività intensa verificata con adattamento energetico, senza overflow mobile.

## v1.19.34 — verificata

- [x] Conferma della settimana verificata con sette totali calorici e media giornaliera.
- [x] Rotazione confermata verificata interamente nei range del piano proposto.
- [x] Anteprima stampa verificata con sette giorni, pasti, ingredienti, grammi, macro ed esportazioni.

## v1.19.33 — verificata

- [x] Le quattro famiglie fornite vengono aperte e contate separatamente sul sito pubblico mobile.
- [x] Verificati 44 colazioni, 42 spuntini, 64 pranzi e 64 cene senza uscita orizzontale.
- [x] Prima scheda e fotografia realmente caricata verificate in ogni famiglia.

## v1.19.32 — verificata

- [x] Aggiunta reale di un componente al pranzo verificata sul sito pubblico mobile.
- [x] Pannello “AGGIUNGI AL PASTO” verificato senza card bianche né uscita orizzontale.
- [x] Rimozione diretta col comando meno verificata con ritorno esatto al numero iniziale di componenti.

## v1.19.31 — verificata

- [x] Flag mangiato provato direttamente sullo spuntino nel sito pubblico.
- [x] Riepilogo reale verificato nel passaggio 0/5 → 1/5 e dopo ricaricamento.
- [x] Deflag verificato nel passaggio 1/5 → 0/5 senza aprire la ricetta.

## v1.19.30 — in verifica

- [x] Compositore gelato aperto realmente dallo sgarro dello spuntino mattutino.
- [x] Scelta fra due e tre palline, almeno dieci gusti e calorie calcolate verificate.
- [x] Tre componenti con fotografie proprie applicati al pasto e pannello richiuso correttamente.

## v1.19.29 — in verifica

- [x] Inserimento pubblico reale di uno sgarro tramite nome e grammi.
- [x] Calorie e macronutrienti verificati nella riga registrata.
- [x] Rimozione diretta dello sgarro verificata senza lasciare residui nel diario.

## v1.19.28 — in verifica

- [x] Apertura reale della prima ricetta consigliata nel sito pubblico mobile.
- [x] Verifica di fotografia caricata, ingredienti, preparazione, macro e allergeni nella scheda completa.
- [x] Nessun overflow della scheda e chiusura verificata prima di proseguire nel ricettario.

## v1.19.27 — in verifica

- [x] Stress pubblico della lista della spesa settimanale con elementi reali, nessun overflow e chiusura corretta.
- [x] Seleziona tutto e Deseleziona tutto verificati tramite lo stato effettivo di ogni checkbox.
- [x] Modifica di un giorno della settimana aperta realmente e barra Chiudi / Chiudi e riequilibra verificata a fondo pagina.
- [x] Chiusura semplice verificata senza lasciare la barra settimanale nella vista sbagliata.

## v1.19.26 — in verifica

- [x] Il collaudo forza eager soltanto sulle fotografie già visibili, lasciando invariato il lazy loading dell'app reale.
- [x] La modifica grammi usa un vero InputEvent e il value tracker React prima di verificare la persistenza.
- [x] Focus e blur riproducono il gesto completo dell'utilizzatore senza ricorrere a scorciatoie nello stato interno.

## v1.19.25 — in verifica

- [x] Le immagini lazy vengono attese prima della verifica pubblica, senza falsi errori durante il cambio scheda.
- [x] Il rapporto distingue fotografie ancora pendenti da risorse concluse con errore reale.
- [x] Entrambe le condizioni bloccano la revisione se persistono dopo la finestra di caricamento.

## v1.19.24 — in verifica

- [x] Lo stress test pubblico controlla anche che ogni fotografia presente nel viewport mobile sia realmente caricata e non sia un riquadro rotto.
- [x] Il controllo immagini copre Oggi, Settimana, Ricette, fondo del ricettario, cambio piatto, ritorno e ricaricamento persistente.
- [x] Il rapporto distingue numero di immagini visibili e risorse non caricate per rendere diagnosticabile ogni regressione pubblica.

## v1.19.21 — in verifica

- [x] Stress test pubblico mobile riutilizzabile aggiunto al repository e avviabile senza finestre.
- [x] Il test attraversa Oggi, Settimana, Ricette, cambio piatto e ritorno a fondo pagina.
- [x] Alternative del latte, chiusura del pannello, modifica grammatura e persistenza dopo ricarica verificate automaticamente.
- [x] Overflow orizzontale, schermata di recupero ed errori JavaScript bloccano il test.

## v1.19.20 — pubblicata

- [x] React e le dipendenze stabili sono separate in un chunk cacheabile, riducendo il download delle revisioni successive.
- [x] Nessun caricamento lazy del pianificatore: il guscio di recupero continua a proteggere dalle schermate bianche.
- [x] Budget automatico sui file prodotti per impedire una nuova crescita silenziosa del pacchetto mobile.

## v1.19.19 — in verifica

- [x] Il manifest sorgente e la versione visibile derivano dalla stessa release anche prima della build.
- [x] Verifica pubblica della 1.19.18 conclusa sul link GitHub Pages unico.
- [x] Checklist finale riallineata alla suite corrente di 163/163 test.
- [x] Dipendenza transitiva `source-map-js` aggiornata alla 1.2.2 dopo il nuovo avviso di sicurezza; audit nuovamente a zero vulnerabilità.

## v1.19.18 — pubblicata

- [x] Vite aggiornato e fissato alla versione corretta 8.2.2.
- [x] Audit delle dipendenze senza vulnerabilità note.

## v1.19.17 — in verifica

- [x] Il riepilogo delle 214 ricette permette di aprire direttamente colazioni, spuntini, pranzi o cene.
- [x] Il secondo tocco sul gruppo attivo ritorna all'intera raccolta senza perdere la ricerca.

## v1.19.16 — in verifica

- [x] Il filtro “Le tue 214” espone un riepilogo visibile della matrice completa: 44 colazioni, 42 spuntini, 64 pranzi e 64 cene.
- [x] La copertura resta leggibile sul telefono senza caricare contemporaneamente tutte le fotografie.

## v1.19.15 — pubblicata

- [x] Tutte le 214 ricette fornite sono raggiungibili direttamente dal ricettario con un filtro dedicato.
- [x] Colazioni, spuntini, dolci e gelati hanno filtri rapidi espliciti oltre a pranzi e cene.

## v1.19.14 — pubblicata

- [x] Il catalogo dei 268 alimenti nel cambio piatto viene caricato 24 elementi alla volta, mantenendo ricerca e scelta completa.

## v1.15.19 — in verifica

- [x] D41–D44 dell’addendum trasformate in ricette complete, non semplici elementi: sogliola, pollo con riso integrale, zuppa di cicerchie e frittata ai carciofi.
- [x] Le quattro ricette entrano nel ricettario e nelle proposte della giornata/settimana tramite il bacino delle cene.
- [x] Ogni piatto può restare intero oppure essere diviso nei singoli componenti con quantità e ricalcolo.
- [x] Sei alimenti nuovi nel paniere: sogliola, riso integrale, petto di pollo a crudo, cipolle, cicerchie e carciofi cotti.
- [x] Nove fotografie dedicate: quattro piatti finali e cinque componenti atomici.
## v1.15.18 — in verifica

- [x] Vista Settimana corretta: anche i piatti senza componenti precompilati mostrano fotografie, quantità e cambio del singolo ingrediente in tutti i sette giorni.
- [x] Le sostituzioni effettuate sui componenti derivati aggiornano davvero chilocalorie, proteine, carboidrati, grassi e fibre.
- [x] Quinoa aggiunta alle basi sostituibili; crescenza, ricotta, primo sale, scamorza e Provolone Dolce Auricchio presenti come latticini distinti.
- [x] Cavallo presente sia come alimento alternativo sia in una cena completa con patate lesse e zucchine.
- [x] Cinque fotografie autonome nuove e cache-bustate: crescenza, primo sale, scamorza, provolone e piatto completo di cavallo.
## v1.15.17 — in verifica

- [x] Rimosse dall'interfaccia tutte le denominazioni tecniche “matrice C/P/S/D + numero”.
- [x] I codici restano esclusivamente interni per preservare collegamenti, dati e rotazioni.

## v1.15.16 — in verifica

- [x] Ricette complete collegate al pianificatore come piatti unici, non più isolate nella libreria.
- [x] Informazioni del piatto aprono ingredienti e preparazione dalla giornata.
- [x] Passaggio reversibile da piatto unico a componenti sostituibili con ricalcolo nutrizionale.
- [x] “Piatto completo” riconosciuto in selezione, check-in e rigenerazione settimanale.
- [x] A lavoro le ricette trasportabili hanno precedenza senza nascondere le altre scelte.

## v1.15.15 — in verifica

- [x] P45–P52 collegati con preparazioni complete, componenti modificabili e foto finali specifiche.
- [x] Dieci nuovi alimenti strutturati e inseriti nelle alternative per ruolo.
- [x] Quindici fotografie nuove, atomiche o di piatto completo, senza riuso generico.

## v1.15.13 — pubblicata

- [x] P41, P42 e P44 collegati come pranzi completi con componenti modificabili e preparazione da zero.
- [x] Foto finali specifiche per pasta con piselli e ricotta, riso con merluzzo e quinoa con cannellini e barbabietola.
- [x] Hummus di barbabietola e barbabietole cotte inseriti con ruolo, porzione, valori e foto autonome.
- [x] Ananas fresco riceve una fotografia dedicata realmente presente nel pacchetto.
- [x] Riepilogo settimanale: quantità e unità kcal sulla stessa riga; fibre su riga separata.
## v1.15.12 — pubblicata

- [x] Spuntini S27–S34 collegati alle proposte reali di metà mattina e pomeriggio.
- [x] Carote crude e carote cotte bollite distinte per dati, foto e alternative.
- [x] Otto nuove fotografie atomiche cache-bustate: more, gallette, hummus, fiocchi di latte, sesamo, ravanelli e due cotture delle carote.
- [x] Gallette, hummus, fiocchi di latte, more, ananas, ravanelli e sesamo entrano nel paniere delle sostituzioni per ruolo.
- [x] P41–P52 completate con fotografie finali specifiche; incluse nell'audit 214/214.
## v1.15.11 — pubblicata

- [x] C31 pane di farro, ricotta, mela e nocciole collegata come colazione veloce completa.
- [x] C34 pancake di grano saraceno con albume, pera e yogurt collegata come colazione da casa/weekend.
- [x] C35 skyr, melone, chia e pane di segale collegata come colazione fresca e trasportabile.
- [x] C36 pane ai cereali, crema 100% nocciole, fragole e yogurt collegata come colazione veloce.
- [x] Quattro fotografie finali e sei fotografie atomiche nuove, specifiche e cache-bustate.
- [x] Dati verificati per nocciole CREA; skyr, pani e crema 100% nocciole da etichette ufficiali; chia da USDA.
- [x] Prima matrice strutturata di compatibilità tra famiglia della base e proteine per le combinazioni automatiche.
- [x] Matrice base–proteina–verdura–condimento applicata per ruolo e momento della giornata.

## v1.15.10 — pubblicata

- [x] Target calorico del giorno visibile nel riepilogo aggiornato.
- [x] Scarto con segno positivo o negativo ricalcolato dopo sostituzioni, grammi, bevande ed extra, senza messaggi punitivi.
- [x] Verifica mobile: target e scarto restano leggibili nel riepilogo compatto senza uscire dalla larghezza.

## v1.15.9 — pubblicata

- [x] Riepilogo dopo cena calcolato con grammature realmente registrate per i pasti spuntati e piano corrente per quelli ancora aperti.
- [x] Bevande registrate ed extra inclusi nel totale effettivo.
- [x] Confronto corretto contro il piano previsto dopo profilo, sostituzioni e porzioni, non contro la ricetta grezza originale.
- [x] Stato esplicito: “x/5 registrati” oppure “Totale consumato” soltanto quando tutti i cinque momenti sono confermati.
- [x] Collaudo mobile della registrazione e del deflag: il contatore passa 0/5 → 1/5 → 0/5 senza aprire schede indesiderate.

## v1.15.8 — pubblicata

- [x] Otto basi caloriche gestite con differenze reali: riduzione proporzionata sotto 1800 e componenti interi visibili da 2000 a 3000 kcal.
- [x] Nessuna micro-porzione artificiale: riduzioni arrotondate a 5 g con minimi pratici e aggiunte da vasetto, frutto, pane, cracker, frutta secca o olio.
- [x] Se un alimento aggiunto è già nel pasto, la sua grammatura aumenta senza creare una tessera duplicata.
- [x] Cambio di base e obiettivo seleziona cinque proposte vicine alla distribuzione 22/9/30/9/30, mantenendo distinti i due spuntini.
- [x] Prima della conferma il cambio profilo ricalibra tutti i sette giorni; dopo la conferma modifica soltanto Oggi e non perturba la settimana salvata.
- [x] Collaudo browser delle basi 1400, 1800, 2200, 2600 e 3000 kcal, compresi i sette giorni non ancora confermati.

## v1.15.7 — pubblicata

- [x] Settimana italiana ricalibrata con combinazioni visibili e porzioni normali: niente compensazioni nascoste o grammature innaturali.
- [x] Due spuntini proteici pratici aggiunti al piano: yogurt proteico con fragole e budino proteico con pera.
- [x] Giorno di maggiore movimento riportato vicino al target usando una colazione quotidiana realistica.
- [x] Giorno 5 completato con jar preparabile la sera e farro, uova, fagiolini e pomodori in porzioni standard.
- [x] Collaudo mobile dei sette totali, della rotazione, della conferma e della persistenza dopo ricaricamento.

## v1.15.6 — pubblicata

- [x] Fibre calcolate nel totale giornaliero, negli extra, nel confronto su 25 g EFSA e nella media dei sette giorni.
- [x] Pane integrale riallineato ai valori CREA e aggiunti pane bianco tipo 0, semintegrale tipo 1 e di segale con porzioni da 50 g.
- [x] Tre fotografie autonome per i nuovi pani e priorità ai pani equivalenti quando si cambia una porzione di pane.
- [x] Uova sode separate da uova strapazzate/frittata con dati CREA, metodi espliciti e fotografie diverse; olio e burro restano componenti separati.
- [x] Controllo TypeScript completo aggiunto alla verifica della revisione.

## v1.15.5 — pubblicata

- [x] Rotazione pianificata calcolata prima della conferma, non soltanto sui pasti già registrati.
- [x] Settimana italiana di base verificata nel browser: pesce 3, carne bianca 3, carne rossa 2, uova 2 e legumi 3, tutti negli intervalli mostrati.
- [x] Porzione di legumi conteggiata solo da 100 g cotti o da un burger vegetale completo; una piccola aggiunta di piselli non vale come pasto di legumi.
- [x] Spuntini generati con porzioni pratiche dedicate: pane 40 g, fette biscottate 20 g, biscotti/cracker 25 g e frutta secca 15 g.
- [x] Il caricamento della nuova versione conserva le scelte salvate e non rigenera automaticamente il giorno aperto.

## v1.15.4 — pubblicata

- [x] Sedano e broccoli aggiunti come contorni con valori CREA, stagionalità e fotografie autonome.
- [x] Yogurt HiPRO e budino Ehrmann aggiunti con valori da etichetta ufficiale, fotografie specifiche e priorità negli spuntini.
- [x] Burger vegetale di soia aggiunto con valori da etichetta ufficiale, fotografia atomica e piatto completo con pane e broccoli.
- [x] Lenticchie cotte riclassificate soltanto come proteina vegetale: eliminata la duplicazione impropria tra i contorni.

## v1.15.3 — pubblicata

- [x] Crash della pagina Ricette corretto all'origine: `Zucca cotta` riallineata alla voce nutrizionale `Zucca`.
- [x] Protezione permanente: una ricetta con dati incompleti non può più azzerare l'intera libreria.
- [x] Dicitura “porzione” rimossa dai riepiloghi generali dei pasti.
- [x] Data corrente visibile nella pagina Oggi.
- [x] Alternative frutta e contorni ordinate prima per stagionalità e scelta libera deduplicata.

## v1.15.2 — pubblicata

- [x] Refresh della nuova versione automatico senza scroll, applicato appena non è aperta una modifica.
- [x] Riepilogo compatto dopo cena con kcal, proteine, carboidrati e grassi aggiornati e percentuali rispetto al piano base.
- [x] C33 kefir, papaya, muesli e mandorle collegata con dati istituzionali e fotografie specifiche.
- [x] Ciliegie, albicocche, anguria e melone aggiunti con valori CREA, porzioni e fotografie autonome.
- [x] Le quattro nuove frutte sono selezionabili nelle alternative e incidono realmente sui calcoli.

## v1.15.1 — pubblicata

- [x] Barra “Chiudi / Chiudi e riequilibra” fissata in alto e rimossa quando si apre normalmente la sezione Oggi.
- [x] Fotografia finale specifica per pasta integrale, lenticchie e zucca.
- [x] Fotografia finale specifica per gnocchi, tonno al naturale e zucchine, senza maccheroni.
- [x] Entrambe le composizioni trasformate in ricette guidate complete e proposte come piatti unici modificabili.

## v1.15.0 — pubblicata

- [x] Barra “Chiudi / Chiudi e riequilibra” fissa sopra la navigazione e sempre visibile durante lo scorrimento.
- [x] Miniature Settimana con immagine completa, senza taglio di olio, piselli o cracker.
- [x] Combinazioni automatiche escluse dalla libreria delle ricette guidate.
- [x] Lenticchie cotte rese disponibili nel paniere; la classificazione è stata poi corretta nella v1.15.4.
- [x] Foto finali specifiche per cena patate/uova/fagiolini e riso/pollo/fagiolini.
- [x] Foto wafer corretta e foto specifica per banana, yogurt e avena.
- [x] C32 omelette con pomodori, funghi e pane integrale collegata con albume CREA.

## v1.14.4 — pubblicata

- [x] C30 yogurt greco, kiwi, avena e pecan collegata alle colazioni veloci.
- [x] Fotografia finale C30 e fotografia atomica delle pecan specifiche.
- [x] Pecan e pistacchi inseriti nelle alternative reali della frutta a guscio.
- [x] Componenti, porzioni, macro, preparazione e trasporto al lavoro verificabili separatamente.

## v1.14.3 — pubblicata

- [x] C29 porridge con pera e pistacchi collegata a ricette e proposte da casa/weekend.
- [x] Fotografia finale C29 e fotografia atomica dei pistacchi specifiche e cache-bustate.
- [x] Quattro componenti C29 modificabili separatamente con calorie e macro ricalcolati.
- [x] Alternativa latte/soia coerente e allergeni dichiarati.

## v1.14.2 — pubblicata

- [x] P43 farro, due uova, fagiolini e pomodori collegata come piatto unico trasportabile.
- [x] Fotografia finale P43 specifica con tutti gli ingredienti realmente visibili.
- [x] Componenti P43 modificabili separatamente e due uova conteggiate nella rotazione.
- [x] Preparazione da zero, distinzione 70 g secco / circa 175 g cotto e istruzioni per il trasporto al lavoro.

## v1.14.1 — pubblicata

- [x] Lenticchie e cannellini aggiunti alle alternative proteiche quotidiane.
- [x] Fotografie specifiche e cache-bustate per lenticchie cotte e cannellini cotti.
- [x] Cannellini con porzione standard da 150 g e valori CREA per alimento bollito e scolato.
- [x] Lenticchie e cannellini collegati alle combinazioni coerenti con pasta, gnocchi, riso e altre basi.

## v1.14.0 — pubblicata

- [x] Bistecche distinte per animale: manzo, vitello, maiale/lonza e cavallo.
- [x] Valori CREA specifici e peso dichiarato a crudo per le quattro carni.
- [x] Fotografie autonome e cache-bustate per le quattro carni.
- [x] Fotografie sciolte di fesa di tacchino e prosciutto cotto; le foto dei panini restano separate.
- [x] Porzioni alternative di carne limitate a quantità pratiche da 100–150 g.
- [x] Conteggio settimanale carne rossa esteso anche a lonza/maiale e cavallo.

## v1.13.2 — pubblicata

- [x] Migrazione automatica di tutte le categorie semantiche salvate male, incluso il latte ereditato come carboidrato.
- [x] Refresh con URL versionato appena l'app è inattiva e nessuna modifica è aperta; archivio locale invariato.
- [x] Lista della spesa con “Seleziona tutto” e “Deseleziona tutto”.
- [x] Macro scritti per esteso nel riepilogo del pasto.
- [x] Modifica giorno settimanale con barra fissa e azioni separate “Chiudi” / “Chiudi e riequilibra”.
- [x] Il riequilibrio conserva gli elementi modificati, ricalibra il resto del giorno e aggiorna i giorni successivi.
- [x] Grissini esclusi dalle proposte automatiche di colazione e spuntino.
- [x] Armonia delle combinazioni: matrice di compatibilità tra base, proteina, verdura, condimento e momento della giornata.
- [x] Legumi completi: ceci, fagioli, piselli, lenticchie e altre varietà con foto singole e ricette coerenti.
- [x] Acquisito integralmente il terzo addendum da 40 elementi; totale matrice 174.
- [x] `C29–C36`, `S27–S34`, `P41–P52` e `D41–D52` integrate in ricette, proposte e rotazioni.
- [x] “Crea una ricetta con gli avanzi” con quantità, data, conservazione e blocchi di sicurezza alimentare.

## v1.13.1 — pubblicata

- [x] Corretto il ruolo corrente delle tessere: riaprendo il latte compaiono alternative latticino e non cereali.
- [x] Porzioni alternative pratiche: pasta/riso 60–100 g, gnocchi 120–200 g, patate 150–300 g.
- [x] Farine, fiocchi d'avena crudi, burro, olio e lino esclusi dalle scelte libere isolate.
- [x] Riepilogo di ogni pasto con kcal, proteine, carboidrati e grassi.
- [x] Conferma settimana con kcal per giorno, media giornaliera e rotazione calcolata sul piano confermato.
- [x] Mela, frutta singola, spuntini e combinazioni semplici esclusi dalla libreria delle ricette.
- [x] “Panino con fesa di tacchino” distinto dalla fesa di tacchino come alimento.
- [x] Riequilibrare automaticamente le frequenze quando il piano supera gli intervalli settimanali.

## v1.13.0 — pubblicata

- [x] C21 porridge banana, arachidi e lino: ricetta completa, componenti modificabili, calcolo e fotografia specifica.
- [x] S11 banana e crema 100% arachidi: presente nei due spuntini, ma escluso dalla libreria delle ricette complete.
- [x] Arachidi, crema 100% arachidi, lino, finocchi, pesche e asparagi con dati, porzioni e foto autonome.
- [x] Contesto “Stile” e “Dove” disposto su due colonne centrate.
- [x] Bistecche distinte per animale e taglio: manzo, vitello, maiale/lonza e cavallo, con dati e immagini autonome.

## v1.12.1 — pubblicata

- [x] Corretto il ruolo dopo una scelta libera: il latte non eredita più il gruppo delle fette biscottate.
- [x] Alternative consigliate del latte: vaccino, soia, avena, yogurt e ricotta.
- [x] Rimossa la scelta globale “Da bere” dalla testata Oggi.
- [x] “Attività oggi/domani” usa “Nessuna, leggera, intensa”, senza etichetta ambigua “Riposo”.
- [x] Settimana con fotografie contestuali: tavola colazione, pausa spuntino, tavola pranzo e tavola cena.
- [x] Acquisiti due addendum da 40 ricette; totale matrici operative 134 ricette.
- [x] Foto autonome per prosciutto cotto e fesa; panini separati come ricette.
- [x] Foto autonome completate per bresaola, petto di pollo e tacchino.
- [x] Sottogruppi visivi nel pannello alternative.

## v1.12.0 — pronta per pubblicazione

- [x] Acquisita integralmente la specifica da 627 righe: 12 colazioni, 10 spuntini, 16 pranzi e 16 cene.
- [x] Aggiornamento automatico tramite `version.json`, rinviato mentre ricetta, alternative, preferenze o modifica settimanale sono aperte; archivio `vivapiatto-v1` invariato.
- [x] Vista Settimana con cinque immagini semantiche fisse, indipendenti dal primo ingrediente.
- [x] Primo collegamento della matrice: C05 pancake d'avena e banana, componenti modificabili, preparazione completa e fotografia specifica.
- [x] Farina d'avena, integrale e di grano saraceno con valori, foto e peso a crudo; escluse dalle rotazioni come alimenti crudi isolati.
- [x] Grissini con fotografia esatta e nuovo nome asset per invalidare la cache.
- [x] Sostituzioni del latticino a colazione ordinate per ruolo: latte, soia, avena, yogurt e ricotta.
- [x] Tutte le ricette della matrice collegate in blocchi verificati, ognuna con componenti, valori, istruzioni, frequenze e foto propria.
- [x] Paniere completato oltre il primo lotto: 557 asset verificati e 257 ricette con foto finale dedicata.

## v1.2.0 — pubblicata

- [x] Eliminare il blocco grande “Mangia bene” e ridurre gli spazi inutili.
- [x] Rinominare l'app in “Scheda Alimenti”.
- [x] Filtri per allergie, intolleranze e alimenti non desiderati.
- [x] Menu settimanale consultabile senza ritorni poco chiari alla pagina Oggi.
- [x] Catalogo con oltre 300 proposte italiane, asiatiche, mediterranee, gourmet e vegetali.
- [x] Basi varie: riso, quinoa, farro, miglio, cous cous, grano saraceno, orzo, noodles e patata dolce.
- [x] Ricette guidate da zero con tempi, temperature, consistenza e impiattamento.
- [x] Colazioni, spuntini, frutta, frutta secca, dolci e frozen yogurt.
- [x] Correlazione immagini rifatta e protetta da audit: 214/214 matrice e 257/257 ricette reali con foto finale dedicata.
- [x] Quantità reali modificabili ingrediente per ingrediente nella scheda della ricetta.
- [x] Lista della spesa giornaliera/settimanale modificabile, spuntabile e condivisibile.
- [x] Collaudo mobile e pubblicazione GitHub.

## v1.3.0 — pubblicata

- [x] Nuovo nome “Tavola Mia”, senza cambiare link GitHub o perdere i dati salvati.
- [x] “Cambia piatto” rispetta il momento: colazione con colazioni, spuntino con spuntini, pranzo/cena con pasti completi.
- [x] Colazioni realistiche e veloci con fette biscottate, confettura, ricotta, biscotti, cracker, latte e bevande vegetali.
- [x] Diario completo di piatti, quantità, calorie, bevande ed extra.
- [x] Acqua, latte, bevande di soia/avena, spremute, frullati, Coca-Cola Zero e bibite gassate zero.
- [x] Riepilogo e confronto con il target senza giudizi.
- [x] Ricalcolo del resto della giornata dopo quantità o piatti diversi dal previsto.
- [x] Rielaborazione del giorno successivo e aggiornamento della settimana.
- [x] Attività fisica: proposta moderatamente maggiore nei giorni intensi e più leggera nei giorni di riposo.
- [x] Stato: bene, gonfio, stanco, affamato; suggerimenti non punitivi.
- [x] Cambio piatto direttamente dalla vista settimana, collegato alla giornata scelta.

## v1.4.0 — pubblicata

- [x] Impedire definitivamente che una colazione venga proposta a pranzo o cena.
- [x] Sostituire “Proponi pranzo e cena” con “Crea menu completo”.
- [x] Cinque momenti: colazione, spuntino mattina, pranzo, spuntino pomeriggio e cena.
- [x] Spuntini immediati: frutta, noci, cracker e wafer porzionati.
- [x] Check-in operativo: le risposte cambiano realmente piatti e distribuzione del menu.
- [x] Stato gonfio: ridurre proposte fermentabili e bibite gassate, con avviso non diagnostico.
- [x] Stato stanco/attività: pasti regolari, carboidrati distribuiti e spuntino coerente.
- [x] Diario: conteggio dei caffè e riferimento EFSA sulla caffeina.
- [x] Extra assistiti: suggerimento alimento, grammi e calorie calcolate automaticamente.
- [x] Target selezionabile fino a 3000 kcal.
- [x] Più esclusioni alimentari contemporanee e chiusura esplicita del pannello filtri.

- [x] Cambio del singolo ingrediente nella ricetta con grammi e calorie equivalenti ricalcolati.
- [x] Foto dedicata e rappresentativa per ogni famiglia di piatti; audit severi bloccano riferimenti mancanti o riusi non ammessi.
- [x] Modalità settimana “Più varietà” oppure “Ripeti ciò che mi piace”, funzionale dalla v1.19.8.
- [x] Dopo ogni sostituzione aggiornamento automatico del menu successivo e della lista della spesa derivata.
- [x] Scelta rapida per pesce, carne, uova, vegetale, primo, secondo, contorno e piatto unico dalla v1.19.9.
- [x] Domande iniziali brevi e generazione immediata di proposte.
- [x] Visualizzazione delle calorie disponibili quando si sostituisce un piatto dalla v1.19.9.
- [x] Suggerimento di riequilibrio sempre facoltativo.
- [x] Centrifughe, smoothie e bevande preparabili a casa.
- [x] Modalità “Fuori casa” con zona, tipo di locale e registrazione della scelta reale.

## v1.5.0 — pubblicata

- [x] Colazioni feriali predefinite entro 1-3 minuti; colazioni più elaborate solo nel weekend o su scelta esplicita.
- [x] Piatti italiani semplici: pasta in bianco/al pomodoro, pane, panini, uova, bistecca e patate lesse.
- [x] Modalità Lavoro/Casa: a pranzo propone preparazioni trasportabili o reperibili in mensa; la cena resta libera.
- [x] Completamento guidato dei piatti semplici senza obbligare un piatto unico composto.
- [x] Legumi completi: ceci, lenticchie, fagioli, piselli; disponibili normalmente e limitati solo quando il check-in lo giustifica.
- [x] Tabella interna verificata “stato → preferenze/cautele” con fonti ufficiali nel `NUTRITION-VADEMECUM.md` e nel motore check-in.
- [x] Nuove foto specifiche per pasta, panini, insalata di riso, uova, bistecca con patate, cracker e noci.
- [x] Etichette non ambigue: “g porzione” e “g proteine”.

## Continuo

## v1.6.0 — pubblicata

- [x] Eliminare lo scaling libero che produceva quantità come 290 g di pasta o 237 g di yogurt.
- [x] Usare porzioni discrete: pasta/riso a peso secco, yogurt a vasetti, pane e patate in quantità pratiche.
- [x] Mostrare ingredienti e pesi direttamente nella scheda del pasto.
- [x] Cena a tre parti con tre immagini, tre pesi e sostituzione separata di base, proteina e contorno.
- [x] Alternare pasti in tre parti e piatti unici completi.
- [x] Latte come componente eliminabile della colazione, non come bevanda dell'intera giornata.
- [x] Modalità Lavoro: escludere ricette elaborate da pranzo, cambio piatto e rigenerazione.
- [x] Obiettivo, calorie, stile, luogo e bevanda incidono sulla selezione dei piatti.
- [x] Primo catalogo strutturato CREA/SINU con paste, risi, gnocchi, proteine, contorni e cucina orientale.

## v1.7.0 — pronta per pubblicazione

- [x] Alternative per ruolo con porzioni specifiche e sostituzioni contestuali per colazione e pasti principali.
- [x] Scelta libera fuori categoria dopo le alternative consigliate.
- [x] Prime proposte occasionali di pizza e hamburger, senza meccanismo punitivo.
- [x] Catalogo ampliato con paste, risi, verdure, funghi, olive, carni, pesci e metodi di cottura; 217/217 voci richieste.
- [x] Rendere le colazioni feriali principali scomponibili, eliminabili e sostituibili.
- [x] Rendere reversibile il comando “registrato come mangiato”.
- [x] Conservare il piatto registrato quando un nuovo check-in rigenera il menu.
- [x] Fotografie atomiche per riso basmati/Venere, gnocchi, pollo, bistecca, salmone, uova, tonno, bresaola, verdure e frutta principali.

## v1.11.1 — pronta per pubblicazione

- [x] Preferenze con contrasto più forte; piano, calorie scelte, target del giorno e scarto visibili insieme.
- [x] Foto olive servita con un nuovo nome-file per impedire il riuso della cache precedente.
- [x] Flusso Settimana: apri un giorno, chiudi e riequilibra i successivi, poi conferma o riapri la settimana.
- [x] Dopo la conferma, le modifiche di Oggi non riscrivono gli altri giorni.
- [x] Foto-riassunto dedicata alla colazione completa nella vista settimanale.
- [x] Casa privilegia ricette più elaborate; Lavoro privilegia piatti trasportabili e semplici.
- [x] Feta e Grana Padano DOP aggiunti con valori CREA, foto atomiche, porzioni e ingresso nelle rotazioni.
- [x] Spuntini predefiniti senza bicchiere di latte: frutta, yogurt, frutta secca e basi pratiche; latte disponibile solo nella scelta libera.
- [x] Vademecum nutrizionale tracciabile salvato nel progetto.
- [x] Paniere, foto atomiche e fotografie finali completati per il perimetro ricevuto; audit 557/557 e 257/257.

## v1.11.0 — pubblicata

- [x] Paniere strutturato collegato alla rotazione: 36 colazioni, 30 spuntini e 84 pasti completi generati dai componenti reali.
- [x] Fragole, mango, papaya e frutti di bosco separati, con foto dedicate e valori nutrizionali.
- [x] Nessun duplicato automatico dello stesso frutto nello stesso pasto.
- [x] Due frutti diversi nelle proposte giornaliere predefinite; la ripetizione resta una scelta manuale.
- [x] Alternative dello stesso ruolo ricalcolate in grammi per avvicinarsi alle calorie del componente sostituito.
- [x] Pannello alternative più alto, X sempre visibile e sezioni consigliate/scelta libera richiudibili.
- [x] Area di inserimento extra ampliata su cellulare.
- [x] “Preferenze” chiarisce allergie e alimenti da evitare; testata e configurazione iniziale ridisegnate.
- [x] Rimossi dalla prima schermata i pulsanti “Crea menu completo” e “Lista della spesa di oggi”; la rigenerazione resta automatica.
- [x] Lista della spesa riposizionata nel flusso giorno/settimana dedicato, fuori dalla testata iniziale.
- [x] Feta, Grana e altri formaggi integrati con dati, foto, porzioni, ricette e alternative.
- [x] Ogni voce dell’elenco generale ricevuto integrata con dati, fotografia e almeno una ricetta; audit 217/217.

## v1.10.0 — pubblicata

- [x] Settimana mostra le stesse tessere alimento di Oggi.
- [x] Ogni componente settimanale apre direttamente le alternative con foto, grammi e kcal.
- [x] Una modifica rigenera soltanto i giorni successivi non ancora registrati.
- [x] I pasti già mangiati restano invariati nello storico.

## v1.9.0 — pubblicata

- [x] Schede mobile senza altezza fissa: nessun componente tagliato.
- [x] Pane, olio e aggiunte caloriche trasformati in componenti modificabili.
- [x] Alternative ordinate per momento della giornata, mantenendo tutto il catalogo nella scelta libera.
- [x] Pane sostituibile con cracker, fette biscottate e grissini con quantità e kcal.
- [x] Nomi geografici inventati eliminati dalle ricette generate.
- [x] X del pannello alternative sempre visibile e ad alto contrasto.
- [x] Extra spostati nel flusso di Oggi; Progressi resta il riepilogo.
- [x] Settimana mostra le parti effettivamente scelte e le kcal aggiornate.
- [x] Cache immagini aggiornata a ogni versione.
- [x] Foto mancanti di pomodori, carote, funghi e olive create e collegate.
- [x] Prime nuove immagini dell'elenco: farine, mandorle e crema cacao-nocciole.

## v1.8.0 — pubblicata

- [x] Flag diretto e reversibile senza apertura involontaria della ricetta.
- [x] “Nessuno” per rimuovere qualsiasi componente e sottrarlo dal totale.
- [x] Titoli dinamici, grammi editabili, kcal/proteine per elemento e tessere ad altezza variabile.
- [x] Alternative contestuali ancorate al ruolo originale del pasto.
- [x] Primi metodi/tagli distinti con immagini: pollo alla piastra, petto arrosto, coscia arrosto, merluzzo, orata.
- [x] Prime frequenze settimanali CREA calcolate sui pasti registrati.
- [x] Foto atomiche per nuovi ortaggi, condimento, caffè e vino.
- [x] Rotazione settimanale completa senza ripetizioni inutili; audit 14/14.
- [x] Estetica iniziale più calda e riconoscibile, ispirata alla cucina, senza aumentare gli spazi vuoti.

## v1.9.0 — prossima

- [x] Catalogo dell’elenco generale allegato completato: dati, porzioni, ruoli e foto.
- [x] Banca dati testuale separata per extra/sgarri con autocomplete e valori da etichetta; 114 voci.
- [x] Vista Settimana portata alla stessa composizione modificabile di Oggi.
- [x] Frequenze registrate applicate alla generazione automatica dei giorni successivi.

- [x] Piatti e fotografie ampliati mantenendo audit nutrizionali, fotografici e mobile permanenti.
- [x] Assenza di scorrimento orizzontale verificata staticamente e a 390 px; la freccia swap è stata corretta dopo prova reale.
- [x] Unico repository, unico link GitHub Pages e numero di versione visibile mantenuti.
- [x] Valori nutrizionali tracciabili e dichiarati come stime, non analisi cliniche del piatto reale.
