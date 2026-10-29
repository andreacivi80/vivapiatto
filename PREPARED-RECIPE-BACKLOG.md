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

### Fonti nutrizionali reperite, non ancora inserite nel database

Le fonti per i tre ingredienti mancanti sono ora disponibili. Questo sblocco documentale non significa che nuovi alimenti, foto o ricetta siano stati implementati. `Zucchero` esiste già; il prodotto composto `Panna cotta` resta separato e non entra nella distinta domestica.

Valori riferiti a **100 g di ingrediente**, non a una porzione di dolce:

| Voce da usare | kcal | Proteine (g) | Carboidrati (g) | Grassi (g) | Fibre (g) | Fonte |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Panna liquida da montare, 35% grassi | 337 | 2,3 | 3,4 | 35 | 0 | [CREA, codice 140300](https://www.alimentinutrizione.it/tabelle-nutrizionali/140300) |
| Gelatina in fogli S.Martino | 357 | 89 | 0 | 0 | 0 | [Etichetta ufficiale S.Martino](https://www.ilovesanmartino.it/catalogo/ingredienti/farciture/gelatina-in-fogli/) |
| Vaniglia Bourbon Rapunzel, baccello intero macinato | 317 | 3,9 | 56 | 3,2 | 24,4 | [Etichetta ufficiale Rapunzel](https://shop.rapunzel.de/1460380/Vanillepulver-Bourbon/) |
| Zucchero, voce già presente | 392 | 0 | 100 | 0 | 0 | Database corrente, attribuzione CREA da conservare |

La gelatina scelta è espressamente **S.Martino**: il produttore dichiara origine suina, sei fogli da 2 g, sale 1,2 g/100 g e idratazione in acqua fredda per almeno dieci minuti. Gli 8 g della ricetta corrispondono a quattro fogli di questo prodotto. Non trasferire questi nutrienti o questa equivalenza a Paneangeli, ad altre marche o alla gelatina in polvere. La pagina non dichiara il valore Bloom: non inventarlo e verificare la resa culinaria con il prodotto scelto.

I valori Rapunzel riguardano tutta la polvere di baccello consumata, non un baccello tolto dopo infusione e neppure i soli semi. Per panna con diversa percentuale di grassi o ingredienti di altra marca occorre rivalutare dati e formulazione.

### Una sola ricetta domestica proposta, con adattamenti dichiarati

Nuovo ID previsto: `home-panna-cotta-vaniglia`; categoria Dolce, cucina italiana, preparazione domestica distinta dall'ID esistente del prodotto pronto.

| Ingrediente del lotto da quattro porzioni | Quantità da pesare per preparare il lotto | Quota ingredienti di 1/4 lotto, non peso pronto |
| --- | ---: | ---: |
| Panna liquida 35% | 500 g | 125 g |
| Zucchero | 80 g | 20 g |
| Gelatina in fogli S.Martino, prima dell'ammollo | 8 g | 2 g |
| Vaniglia Bourbon Rapunzel in polvere | 1 g | 0,25 g |

La fonte Piemonte Italia usa **500 ml** e un baccello: **500 g** di panna e **1 g** di polvere sono nuove dosi editoriali pesate, non una conversione volume/massa e non equivalenze della fonte. Gli 80 g di zucchero e gli 8 g di gelatina restano le quantità originali; marca della gelatina e sostituzione della vaniglia devono comparire nell'attribuzione dell'adattamento.

Il procedimento futuro deve separare preparazione e riposo di almeno cinque ore in frigorifero. L'ammollo segue il prodotto S.Martino; la vaniglia in polvere resta nella miscela e non viene rimossa come il baccello della fonte. Uniformare prima della pubblicazione la formulazione termica contraddittoria della pagina culinaria, che menziona sia l'assenza di ebollizione sia il raggiungimento del bollore; non copiarla meccanicamente. La prova culinaria della nuova formulazione resta da fare.

Calcolare i nutrienti dell'intero lotto dai quattro ingredienti e attribuirne un quarto a una porzione. Non aggiungere anche la voce composta `Panna cotta`. Non assegnare un peso finale di 589 g o un peso pronto per stampino dalla semplice somma: acqua trattenuta dalla gelatina, evaporazione e residui richiedono pesatura del lotto finito. Finché manca questa misura, la porzione si indica come **1/4 ricetta**; un successivo inserimento per grammi di dolce pronto richiede la resa misurata.

Il dolce resta visivamente composto e le guarnizioni sono extra facoltativi, con nutrienti e pesi propri. La base proposta non contiene automaticamente frutti rossi, coulis, cioccolato o caramello.

### Vincoli UI riscontrati e da risolvere prima dell'inserimento

Nel modello `Recipe` corrente non esistono numero di porzioni, frazione consumata o resa finale. `peopleCount` è intero e il dettaglio arrotonda i grammi con `round`: non è un selettore di quarti di lotto e annullerebbe la quota di vaniglia da 0,25 g.

- Mostrare separatamente **Ingredienti per preparare quattro porzioni** e **Porzione consumata: 1/4 ricetta**. I nutrienti del diario devono seguire la frazione del lotto; la spesa deve seguire la quantità realmente preparata, senza duplicare il prodotto composto.
- Conservare i decimali necessari nei calcoli e nell'eventuale dettaglio proporzionale; non arrotondare 0,25 g a zero e non far pesare all'utente un quarto di aroma quando sta preparando il lotto intero.
- Per il prodotto pronto restano grammi di dolce acquistato; per questa preparazione restano grammi di ingredienti prima della lavorazione. Le etichette devono esplicitare panna liquida, gelatina secca prima dell'ammollo e vaniglia in polvere. L'attuale euristica `ingredientWeightState` non distingue in modo affidabile questi stati.
- `plannedIngredients`/`calibratePlannedIngredients` possono ricalibrare ingredienti singoli e applicare minimi/arrotondamenti standard: proteggere le proporzioni della ricetta, soprattutto gelatina e aroma. Una diversa porzione di dolce deve scalare il lotto coerentemente, non trasformare indipendentemente 2 g di gelatina in una quantità standard da alimento.
- Verificare nello stesso percorso oggi, settimana, ricettario, diario e spesa: frazione del lotto, ingredienti visibili, eventuali modifiche, macro senza doppio conteggio e mantenimento della foto del dolce composto.

### Allergeni, sicurezza e stato dei lavori

Allergene certo della formulazione: latte, con lattosio. La gelatina S.Martino è suina: non classificare la ricetta come vegetariana/vegana o compatibile con restrizioni che la escludono. Verificare comunque confezioni e possibili contaminazioni degli ingredienti effettivi.

Per igiene e conservazione riferirsi alle indicazioni attuali del [Ministero della Salute sulla sicurezza domestica](https://www.salute.gov.it/new/it/tema/sistema-di-controllo-della-sicurezza-alimentare/sicurezza-domestica-degli-alimenti/): alimenti deperibili refrigerati, contenitori chiusi, separazione dai crudi e rispetto delle etichette. Non inventare una durata domestica di due o tre giorni; le cinque ore della ricetta sono un riposo di rassodamento, non una scadenza sanitaria.

- [x] Reperite fonti primarie di composizione per panna 35%, gelatina in fogli S.Martino e vaniglia in polvere Rapunzel.
- [ ] Inserire le tre voci nel database con fonte corretta, metadati e fotografie canoniche.
- [ ] Verificare formulazione, preparazione, porzionamento e resa finale; acquisire una foto fedele del dolce finito.
- [ ] Adeguare il modello/UI per lotto, quarto di ricetta, decimali e stato di pesata senza alterare le registrazioni del prodotto pronto.
- [ ] Integrare la ricetta e provarne tutti i percorsi senza duplicazioni o ricalibrazioni improprie.

È uno sblocco delle fonti, non una ricetta già pubblicata o una validazione nutrizionale professionale.

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
