# Ricette domestiche e prodotti pronti: lavoro da implementare

Stato: materiale di ricerca e checklist per revisioni successive. Questo documento non prova l'implementazione delle ricette, l'inserimento dei nuovi alimenti o una validazione nutrizionale professionale.

## Obiettivo e separazione dei dati

Le voci attuali `occasional-panna-cotta`, `occasional-pastiera` e `occasional-arancino` utilizzano nei nutrienti un prodotto già composto. Alcune istruzioni descrivono invece una preparazione domestica senza una distinta completa pesata. Occorre separare i due casi:

- Prodotto pronto: conservare identificatore e dati salvati; descrivere scelta, porzione e registrazione del prodotto acquistato. Eventuali aggiunte sono registrate separatamente.
- Ricetta domestica: creare un identificatore nuovo, ingredienti pesati, procedimento concreto, resa della preparazione e fotografia dedicata. I nutrienti derivano dagli ingredienti, non dalla somma del prodotto pronto con i suoi stessi ingredienti.
- Proposte di nuovi identificatori, ancora da implementare: `home-panna-cotta-vaniglia`, `home-pastiera-napoletana`, `home-arancine-ragu`.

## 1. Panna cotta alla vaniglia

### Fonte culinaria verificata

[Piemonte Italia — Panna cotta](https://www.piemonteitalia.eu/it/enogastronomia/ricette/panna-cotta), portale regionale, presenta ingredienti, procedimento e dosi per quattro persone.

Dosi dichiarate dalla fonte: panna fresca 500 ml, zucchero 80 g, un baccello di vaniglia, gelatina in fogli 8 g. Sono previsti quattro stampini da 150 ml. Il procedimento comprende ammollo della gelatina per 10–15 minuti, riscaldamento della panna con zucchero e vaniglia, scioglimento della gelatina e almeno cinque ore in frigorifero. Caramello, cioccolato o coulis sono possibili accompagnamenti, non ingredienti obbligatori della base.

La [scheda PAT della Regione Piemonte](https://www.piemonteagri.it/qualita/it/prodotti/paste-e-dolci/scheda/334-panna-cotta) documenta la tradizione e varianti del prodotto. Non va confusa con un'analisi nutrizionale della nostra preparazione.

### Dati ancora necessari

Nel database verificato mancano panna fresca liquida, gelatina alimentare in fogli e vaniglia pura. Esistono `Zucchero` e il prodotto composto `Panna cotta`, che non sostituisce la panna come ingrediente.

- Acquisire valori per 100 g della panna effettivamente scelta, precisandone la percentuale di grassi.
- Acquisire gelatina e vaniglia come ingredienti distinti con fonte dei dati e fotografia corretta.
- Non convertire automaticamente 500 ml di panna in 500 g: dichiarare la conversione adottata o pesare la massa reale.
- Per la vaniglia distinguere baccello usato in infusione e parte effettivamente consumata. La pesatura editoriale eventualmente introdotta non è una dose in grammi della fonte.
- Non equiparare un foglio di gelatina a un peso universale; verificare peso e indicazioni della confezione.

### Implementazione proposta

Calcolare il lotto completo e quattro porzioni. Distinguere tempo attivo e riposo refrigerato. Mostrare la panna cotta come dolce unico; consentire aggiunte o scomposizione volontaria. Guarnizioni con propri grammi, calorie e fotografie, mai aggiunte implicitamente.

## 2. Pastiera napoletana

### Fonte culinaria verificata

[Accademia Italiana della Cucina — Civiltà della Tavola, n. 259, aprile 2014, pagina 9](https://www.accademiaitalianadellacucina.it/sites/default/files/allegati/CdT_259.pdf) pubblica una ricetta per dieci persone e una teglia da 28 cm di diametro, alta 4 cm.

Dosi dichiarate, raggruppate per lavorazione:

| Lavorazione | Ingredienti e quantità originali |
| --- | --- |
| Frolla | Farina bianca 400 g; quattro tuorli; zucchero 200 g; strutto 100 g; burro 100 g; scorza di limone |
| Grano | Grano bagnato 230 g; due noci di strutto; una bustina e mezza di vanillina; scorza di mezza arancia; latte 600 ml |
| Ripieno | Ricotta 320 g; zucchero 230 g; quattro tuorli; tre albumi; due fialette di acqua di fiori d'arancio; canditi 100 g; cannella |

La preparazione prevede cottura anticipata del grano, frolla riposata, crema di ricotta e uova, assemblaggio e griglia di pasta, quindi forno a 150 °C fino alla cottura descritta. La [Soprintendenza MiC di Napoli](https://sabap.na.it/la-pastiera/) offre un ulteriore riferimento istituzionale con procedimento e dosi differenti: non mescolare le due formule attribuendole a una sola fonte.

### Dati ancora necessari

Mancano grano per pastiera, strutto/sugna, tuorlo separato, vanillina, canditi, acqua di fiori d'arancio, scorze come ingredienti distinti e zucchero a velo per l'eventuale finitura. Sono già disponibili farina 00, zucchero, burro, latte intero, ricotta vaccina e albume.

- `Grano saraceno cotto` non è il grano della pastiera. Non sostituire una voce nutrizionale con l'altra.
- La fonte usa grano bagnato: una quantità di grano cotto in barattolo non è automaticamente equivalente. Un eventuale adattamento va descritto e ricalcolato.
- Pesare tuorli e albumi sulla parte edibile; non usare i valori dell'uovo intero per il solo tuorlo.
- Definire in grammi le quantità non univoche: noci di strutto, bustine, fialette, scorze, cannella e finitura. Si tratta di pesature editoriali dichiarate, non di dosi ponderali presenti nella fonte.
- Precisare il tipo di ricotta e gli eventuali adattamenti rispetto alla formula scelta.

### Implementazione proposta e sicurezza

Creare una ricetta a lotto intero con numero di fette modificabile e peso finale misurato. Ripartire calorie e macro sugli ingredienti pesati e sulla porzione effettiva, tenendo distinta la perdita d'acqua in cottura.

Il PDF storico contiene un'indicazione di maturazione per più giorni a temperatura ambiente. Non trasferirla nell'app: la fonte culturale non sostituisce le indicazioni ufficiali aggiornate di sicurezza alimentare. Prima dell'integrazione, verificare raffreddamento, refrigerazione, durata e corretta cottura di un dolce con latticini e uova.

## 3. Arancine al ragù

### Fonte culinaria verificata

[Visit Sicily — Arancine](https://www.visitsicily.info/ricetta/arancine/), portale dell'Assessorato del Turismo della Regione Siciliana, descrive la variante al ragù per circa 20–22 pezzi.

Dosi dichiarate per riso e involucro: riso 1,3 kg; brodo circa 3 litri; burro 100 g; una cipolla; due bustine di zafferano; caciocavallo fresco 200 g; due albumi e un uovo intero; farina, pangrattato e olio senza peso specificato. Per il ragù: manzo macinato 400 g; concentrato di pomodoro 100 g; un'altra cipolla; piselli 200 g; olio EVO, sale, pepe e mezzo bicchiere di vino bianco.

La lavorazione comprende riso allo zafferano, ragù, farcitura con formaggio, panatura e frittura. La pagina distingue anche varianti e denominazioni territoriali; scegliere una preparazione precisa senza presentarla come unica versione siciliana.

### Dati ancora necessari

Mancano una voce di riso adatto alle arancine, brodo, zafferano, caciocavallo, carne macinata, concentrato di pomodoro e pangrattato. Sono presenti burro, cipolle crude, farina 00, uovo, albume, piselli cotti, olio EVO, olio di arachidi, vino bianco e sale iodato.

- Precisare varietà e stato del riso, tipo di brodo e tenore di grasso del macinato; non riutilizzare senza dichiarazione i valori di una bistecca.
- Pesare editorialmente cipolle, vino, zafferano, farina e panatura realmente utilizzati. Riportare chiaramente che la fonte non fornisce tutti questi pesi.
- Distinguere piselli crudi e cotti e lo stato di pesata della carne.
- L'olio assorbito dalla frittura è una stima della parte consumata: non coincide con tutto l'olio versato nella padella. Dichiarare metodo e incertezza, separando l'olio del ragù da quello assorbito durante la frittura.
- Il numero finale di pezzi deve essere registrabile; 20–22 è l'intervallo della fonte, non una resa individuale esatta.

### Implementazione proposta e sicurezza

Creare il lotto completo e ripartirlo sul numero reale di arancine o sul peso della porzione. La foto deve mostrare un'arancina al ragù, non riso e ingredienti separati; gli elementi restano consultabili e modificabili volontariamente.

La preparazione anticipata del riso richiede indicazioni ufficiali aggiornate su raffreddamento e refrigerazione. La menzione culinaria di un anticipo di dodici ore non autorizza a lasciare il riso a temperatura ambiente per tale durata. Verificare separatamente anche cottura della carne e gestione della frittura.

## Piano di lavoro e criteri di accettazione

- [ ] Acquisire fonti nutrizionali primarie o etichette verificabili per ogni ingrediente mancante; indicare valori per 100 g, stato crudo/cotto, parte edibile e allergeni.
- [ ] Creare le fotografie canoniche dei nuovi ingredienti e tre fotografie complete delle preparazioni, fedeli alla distinta effettiva.
- [ ] Ripulire le istruzioni delle tre voci di prodotto pronto senza cambiare registrazioni, identificatori o porzioni salvate dall'utente.
- [ ] Aggiungere tre ricette domestiche con nuovi ID, distinta completa pesata e attribuzione culinaria distinta dalla fonte dei nutrienti.
- [ ] Dichiarare tutte le scelte editoriali: quantità originariamente non misurate, sostituzioni, tempi adattati, conversioni e stime di resa/olio.
- [ ] Integrare le ricette nelle alternative pertinenti e nelle occasioni appropriate, specialmente casa/weekend, senza renderle proposte automatiche irrealistiche per lavoro o mattine di fretta.
- [ ] Mantenere il piatto composto dopo aggiunta o sostituzione; permettere scomposizione solo su scelta esplicita. Il collegamento alla ricetta deve essere consultabile prima della selezione.
- [ ] Verificare conteggi di lotto/porzione, modifiche dei grammi, alternative, lista della spesa, oggi/settimana e registrazioni senza doppio conteggio tra prodotto pronto e ingredienti.
- [ ] Confrontare ingredienti e componenti con test AST, verificare fotografie e nutrienti, poi provare il percorso mobile reale e il rilascio pubblico.
- [ ] Verificare la sicurezza su fonti ufficiali aggiornate prima della pubblicazione; non presentare l'autenticità culinaria come certificazione sanitaria o nutrizionale.

Finché queste verifiche non sono concluse, le tre nuove ricette restano attività da fare, non funzionalità dichiarate complete.
