# Tavola Mia — controllo fotografie

## v1.5.0 completato

- [x] Pasta in bianco: immagine dedicata, senza condimenti estranei.
- [x] Pasta al pomodoro: immagine dedicata.
- [x] Panino fesa di tacchino e pomodoro: immagine dedicata.
- [x] Panino bresaola, ricotta e rucola: immagine dedicata.
- [x] Panino prosciutto cotto e pomodoro: immagine dedicata.
- [x] Insalata di riso: riso, tonno, piselli e pomodorini visibili.
- [x] Uova sode, pane e pomodori: immagine dedicata.
- [x] Bistecca ai ferri e patate lesse: immagine dedicata.
- [x] Noci e cracker: immagini distinte e coerenti con la porzione.

## v1.7.0 completato

- [x] Foto atomiche distinte: basmati, Venere, gnocchi, patate lesse, pane e fette biscottate.
- [x] Foto atomiche distinte: pollo alla piastra, bistecca, salmone al forno, uova sode, tonno e bresaola.
- [x] Foto atomiche distinte: zucchine, fagiolini, spinaci e rucola.
- [x] Foto atomiche distinte: mela, banana, pera, kiwi, uva e arancia.
- [x] Foto atomiche distinte: latte, yogurt, ricotta, confettura, miele, burro e biscotti.
- [x] Foto dedicate per pizza margherita e hamburger semplice.

## v1.15.19 completato

- [x] Foto finali specifiche per D41, D42, D43 e D44, coerenti con tutti gli ingredienti mostrati.
- [x] Foto atomiche autonome per sogliola al forno, riso integrale, cicerchie cotte, carciofi cotti e cipolle.
- [x] Gli asset usano nomi nuovi di revisione per impedire il riuso della cache precedente.
## v1.15.18 completato

- [x] Crescenza, primo sale, scamorza bianca e Provolone Dolce Auricchio: quattro fotografie atomiche distinte.
- [x] Bistecca di cavallo ai ferri con patate lesse e zucchine: fotografia finale dedicata coerente con i quattro componenti.
- [x] Le ricette della settimana prive di una matrice componenti esplicita derivano ora le immagini dai propri ingredienti reali.
## Revisioni successive

- [x] Controllo sistematico delle famiglie internazionali e sostituzione dei duplicati fuorvianti. Audit finale: 257/257 ricette reali con fotografia finale dedicata.
- [x] Audit finale del catalogo e delle immagini visibili nella settimana. 557/557 riferimenti validi; 214/214 ricette matrice con foto dedicata; componenti atomici verificati.

Regola permanente: prima si definiscono ingredienti e preparazione, poi si crea o si seleziona la fotografia corrispondente. Un'immagine con ingredienti estranei viene scartata.

Gli audit automatici garantiscono presenza, formato leggibile, collegamento e unicità dell'immagine, ma non certificano la corrispondenza visiva dei pixel. Il controllo manuale di tutto il catalogo resta aperto. Nella v1.19.79 sono stati controllati visivamente gli asset del prosciutto cotto e della fesa di tacchino (affettati separati dal pane), nonché la crema di mandorle, il gelato al cioccolato e il fiordilatte (immagini riconoscibili e distinte).

## v1.20.3 — controllo visivo puntuale

- [x] Controllate le foto complete C01-C04, C06 e C07 rispetto alla lista degli ingredienti.
- [x] C06: la vecchia foto ometteva il kiwi; sostituita con una nuova immagine che mostra omelette agli spinaci, pane integrale e kiwi sullo stesso piatto.
- [x] Verificate visivamente anche le immagini atomiche di broccoli, cavolfiori, carote cotte, olive, lattuga e zucchine cotte: il soggetto principale è riconoscibile.
- [x] Scansione visiva aggiuntiva delle fotografie C08–C29: i soggetti principali sono riconoscibili e non è emersa un'altra omissione evidente come in C06. La verifica nutrizionale degli ingredienti resta distinta da questo giudizio fotografico.
- [ ] Il controllo visivo dell'intero catalogo resta aperto: la verifica qui è limitata agli asset elencati.

## v1.20.4 — prima scansione completa delle 44 colazioni

- [x] Controllate visivamente le fotografie C01–C44, compresa C05 fuori dalla serie nominale `recipe-c...`.
- [x] C05: la vecchia foto mostrava banana e yogurt ma ometteva le fragole della ricetta. Nuova foto con tre pancake di avena e banana, yogurt greco e fragole riconoscibili.
- [ ] Resta aperta la revisione visiva delle altre famiglie di ricette, degli ingredienti atomici non ancora esaminati e dei casi ambigui; questa scansione non certifica quantità o macronutrienti dai pixel.

## Spuntini: controllo visivo in corso

- [x] Prima scansione delle foto S01–S19: soggetti principali riconoscibili (frutta, latticini, pane, verdure, frutta secca, cioccolato, hummus e frullato) senza omissioni evidenti rispetto ai nomi delle ricette.
- [x] Prima scansione delle foto S20–S42. S27–S34 usavano come foto finale un solo ingrediente: ora mostrano l'intero spuntino, lasciando foto singole ai componenti modificabili.
- [ ] La corrispondenza fine di ogni ingrediente rispetto alla preparazione e il resto del catalogo richiedono ancora controllo visivo.

## v1.20.5 — foto finali S27–S34

- [x] Otto fotografie nuove e distinte, generate in modalità `photorealistic-natural` e ottimizzate a 512×512: albicocche e mandorle; kefir, more e semi di lino; ricotta, mela e cannella; gallette con hummus, rucola e pomodorini; arancia e arachidi; fiocchi di latte, carote e cetrioli; yogurt, ananas e sesamo; pane di segale, ricotta e ravanelli.
- [x] Verifica visiva con tavola di contatto `outputs/s27-34-photo-contact.png`, limitata alla coerenza dei soggetti visibili.
- Prompt comune delle otto immagini: `Use case: photorealistic-natural. Square mobile nutrition-app food photograph of the finished snack described, showing exactly the named ingredients and preparation, full centered plate or bowl in soft natural daylight; no extra food, text or watermark.` Il soggetto specifico di ciascun prompt è l'elenco degli ingredienti nella voce corrispondente sopra.

## v1.20.6 — prime scansioni di pranzi e cene

- [x] Prima scansione visiva della matrice P01–P64 e D01–D64 su tavole di contatto. P01–P64 e D01–D48 mostrano il piatto completo senza omissioni evidenti a questa scala; non equivale a una certificazione nutrizionale o fotografica di dettaglio.
- [x] D49–D64 mostravano come foto finale soltanto un ingrediente. Sostituite D49–D52 con quattro foto di piatti completi: burger di fagioli con cavolo e patate; tacchino con polenta, funghi e spinaci; sardine con cavolo rosso, finocchi e pane di segale; tofu con melanzane, pomodorini e cous cous.
- [x] Nuove immagini generate in modalità `photorealistic-natural`, poi ottimizzate a 512×512; i componenti atomici rimangono separati e modificabili. Prompt: `Square high-quality editorial food photograph for a mobile nutrition app. Finished home-cooked dinner on one ceramic plate with exactly the recipe ingredients described above, each visible and recognizable; no other food, no text, no watermark, soft natural daylight.`
- [x] v1.20.7: D53–D64 hanno ora ciascuna una foto finale distinta che riunisce proteina, carboidrato e contorno o tutti gli ingredienti della zuppa/insalata. Le dodici immagini sono state confrontate sulla tavola `outputs/d53-64-photo-contact.png`; nessuna usa più un'immagine atomica come foto finale.
- [ ] Resta aperta la verifica visiva di dettaglio del resto del catalogo e degli ingredienti atomici: la prima scansione delle matrici non equivale a certificazione di ogni ingrediente nei pixel.

Prompt delle foto D53–D64: modalità `photorealistic-natural`; `Square high-quality editorial food photograph for a mobile nutrition app. Finished realistic homemade dinner on one ceramic plate or bowl with the exact named recipe ingredients, clearly visible and recognizable, full centered dish, soft natural daylight, no extra food, text or watermark.` I soggetti specifici sono, nell'ordine: platessa con riso rosso, zucca e zucchine; tacchino con patata dolce e cavolo; zuppa di fagioli neri, zucca e spinaci con pane; uova in camicia con quinoa, asparagi e pomodorini; tofu con patate e broccoli; trota con orzo, finocchi e arancia; ricotta con carciofi, pomodorini e pane di farro; polpo con cannellini, sedano, pomodorini e rucola; polpette di ceci con riso basmati e cavolfiore; coniglio con polenta e bietole; sgombro con barbabietole, rucola, finocchi e pane; tempeh con miglio, melanzane, pomodorini e cipolla.
