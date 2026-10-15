# Tavola Mia — checklist generale persistente

Questa checklist resta nel repository e viene aggiornata a ogni revisione. Una voce è completa solo quando dati, fotografia, proposta, alternativa, calcolo e comportamento mobile sono verificati insieme.

## Fondamenta alimentari

- [x] Completare tutti gli alimenti degli allegati con kcal, proteine, carboidrati, grassi, fibra, fonte e stato crudo/cotto. Prove: 282/282 voci selezionabili coperte (`audit-nutrition-coverage.mjs`) e 217/217 voci richieste (`audit-requested-pantry.mjs`).
- [x] Collegare ogni alimento ordinario alle ricette e ai bacini di proposta quotidiani; separare chiaramente gli sgarri e gli extra. Verifica automatica: 217/217 alimenti richiesti usati da ricette reali (`audit-pantry-recipe-usage.mjs`); colazioni, spuntini e pasti principali derivano tutti da `allRecipes`.
- [x] Completare equivalenze per categoria con grammi realmente proporzionati, mai quantità identiche arbitrarie. Il motore usa l'energia dell'elemento originale, intervalli e confezioni pratiche; controllo permanente v1.18.94.
- [x] Verificare porzioni pratiche e pesabili e distinguere peso a crudo, cotto e sgocciolato. Ogni ricetta espone lo stato di pesata e gli input usano intervalli/step pratici; controlli v1.18.5, v1.18.79 e v1.18.94.
- [x] Completare rotazioni settimanali secondo riferimenti istituzionali senza trasformarle in prescrizioni cliniche. Prova: `audit-weekly-rotation.mjs`, 14/14 pasti nei range e fonte CREA visibile.

## Ricette e fotografie

- [x] Collegare integralmente le quattro matrici di ricette al motore dei pasti. Verifica automatica: 214/214 (C44, S42, P64, D64).
- [x] Eliminare dalla libreria ogni combinazione che non sia una ricetta vera. Spuntini elementari restano nel piano ma il ricettario richiede tecnica, piatto preparato riconoscibile oppure almeno quattro ingredienti.
- [x] Collegare fotografie dedicate agli alimenti e alle preparazioni. Prove automatiche: 217/217 alimenti richiesti con foto, 570/570 asset validi e 259/259 ricette reali con associazione fotografica univoca; il controllo visivo completo è ancora aperto sotto.
- [x] Creare fotografie finali dedicate alle ricette complete. Prove automatiche: 214/214 foto matrice e 259/259 foto finali del catalogo (`--strict`); la corrispondenza visiva di ogni ingrediente resta da rivedere manualmente.
- [x] Controllare automaticamente riferimenti mancanti, associazioni foto/alimento e cache busting a ogni versione. `audit-photo-assets.mjs`, `audit-full-dish-photos.mjs`, `audit-all-recipe-photos.mjs`; URL foto versionati con `VERSION`.
- [x] Completare ricette italiane, orientali, internazionali, semplici da lavoro e più elaborate da casa/weekend. Catalogo unico con stile, contesto, tempo, attrezzatura e trasportabilità applicati al ranking.

## Piano e alternative

- [x] Rendere ogni risposta iniziale realmente influente su menu, porzioni e suggerimenti. Obiettivo, kcal, check-in, stile, luogo, tempo, attrezzatura, budget e profilo entrano nei pool o nel ranking; test v1.16.90–v1.17.3.
- [x] Distinguere lavoro, casa, mensa, trasporto e tempo disponibile. Pool separati e persistenti per Lavoro, Casa, Mensa e Ristorante; trasportabilità e tempo filtrati.
- [x] Ordinare le alternative per momento della giornata mantenendo comunque una scelta libera completa. Ordinamento per slot/ruolo, consigliate richiudibili e catalogo completo separato.
- [x] Permettere rimozione, aggiunta, cambio e modifica grammi di ogni componente. Controlli presenti sia in Oggi sia nella Settimana.
- [x] Riequilibrare giorno e settimana dopo le modifiche senza sovrascrivere le scelte bloccate. Le scelte registrate/confermate sono preservate; riequilibrio facoltativo esplicito.
- [x] Sincronizzare Oggi, Settimana, ricette proposte, diario, progressi e lista della spesa. Tutte le viste derivano da `choices`, componenti e pesi correnti; test v1.18.39–v1.18.43.

## Interfaccia mobile

- [x] Nessun testo, pulsante, foto o valore deve uscire dalla larghezza del telefono. Controllo statico v1.18.75 e prova reale a 390 px su Oggi e cambio piatto: nessun overflow orizzontale.
- [x] Alternative richiudibili, chiusura sempre accessibile e scelta libera separata. Freccia mobile fissa corretta in v1.19.10 dopo stress test a fondo pagina.
- [x] Foto complete nella Settimana e foto più grandi in Oggi, senza ritagli significativi. `object-fit` specifico per le due viste e audit asset mobile 567/567.
- [x] Barra di modifica settimanale fissa in alto e visibile solo durante quel flusso. Test v1.18.54 e selettore condizionale su `weekEditingDay`.
- [x] Minimizzare spazi e testi inutili mantenendo leggibili grammi e nutrienti. Riepiloghi compatti senza porzione duplicata; nutrienti estesi nel riepilogo.
- [x] Refresh automatico sicuro della nuova versione senza perdere lo stato locale. Manifest interrogato senza cache, scroll e stato preservati; recupero indipendente v1.19.7, rimonta pulita v1.19.11 e versione unica manifest/client v1.19.12. In v1.19.85 compare un avviso di versione pronta mentre una modifica è aperta, e la copia locale non viene sovrascritta prima del ripristino del profilo. Prova pubblica 1.19.84 → 1.19.85 riuscita su sessione già aperta. Le prove 1.19.85→1.19.86 e 1.19.86→1.19.87 hanno mostrato oscillazioni di 24 px dovute all'avviso in flusso e a una compensazione stimata; la 1.19.88 usa l'avviso sovrapposto e lo scroll reale senza compensazione arbitraria. Passaggio pubblico 1.19.87→1.19.88 riuscito: grammi 45→54, menu invariato, scroll 900→900 px e zero errori JavaScript. Dalla 1.19.89 l'app interroga il manifest anche *prima* di mostrare la schermata iniziale. La 1.19.92 verifica anche che HTML e script siano pronti, può riprovare tre volte all'avvio e distingue chiaramente la revisione della schermata da quella pubblicata; controlla nuovamente quando la pagina torna visibile o online. Una modifica già aperta resta protetta.

## Diario, riepiloghi e spesa

- [x] Flag mangiato reversibile e separato dall'apertura della ricetta. Test permanente e pulsante dedicato.
- [x] Totali reali aggiornati con grammi, sostituzioni, extra e bevande. Test v1.18.39 e v1.18.43.
- [x] Confronto giornaliero e settimanale tra piano, consumo registrato e scostamento. Riepilogo Dopo cena e medie/scarti dei sette giorni.
- [x] Autocomplete extra/sgarri con banca dati estesa e calcolo dai grammi. 114 voci univoche con macro, fibre e fonte (`audit-occasional-foods.mjs`).
- [x] Lista della spesa generata dai piatti scelti, modificabile, spuntabile, condivisibile e con seleziona/deseleziona tutto. Ambito giorno/settimana e quantità derivate dai componenti attivi.

## Verifiche automatiche eseguite

- [x] Riesaminare tutta la chat e tutti gli allegati confrontandoli con questa checklist. Verificati elenco generale, matrice iniziale, quattro addendum e obiettivo permanente; perimetro ricette `C01–C44`, `S01–S42`, `P01–P64`, `D01–D64`.
- [x] Eseguire test statici, build, controllo fotografie e test mobile a ogni revisione. Revisione pubblicata 1.19.90: 217/217 test statici, typecheck e build; audit foto 569/569, 214/214 matrice e 258/258 ricette reali con file dedicato; stress mobile locale e pubblico riuscito con schede a 320/390 px, percorso “+ → Sgarri”, filtro ricettario dopo altri filtri, pizza → tiramisù e persistenza. Un primo stress pubblico della 1.19.90 ha segnalato un controllo fallito non riprodotto nella ripetizione; la seconda esecuzione è passata senza errori JavaScript. Build/deploy GitHub riusciti, manifest pubblico 1.19.90, HTML e asset JavaScript coerenti e passaggio automatico 1.19.89→1.19.90 verificato: quantità 45→54 g, menu invariato, scroll 900→900 px. Il workflow controlla la release servita dopo ogni pubblicazione.
- [x] Revisione pubblicata 1.19.91: avvio in stile italiano, pranzi feriali trasportabili, weekend libero da vincoli di lavoro; nuova ricetta caprese con foto dedicata e indicazione di mantenere al fresco. Test mobile locale e pubblico su tutti i 14 pasti, 218/218 test statici, 570/570 asset e 259/259 foto ricetta. Manifest pubblico `1.19.91`, HTML e asset allineati; stress pubblico senza overflow, recupero o errori JavaScript.
- [x] Stress test finale da utilizzatore: sostituzioni, grammi, rimozioni, settimana, refresh, diario, extra, ricette e spesa. Prova pubblica a 390×844 su Oggi, cambio piatto a fondo pagina, ritorno, Settimana, barra fissa, Ricette, Progressi, spesa e refresh; nessun overflow, schermata bianca o errore console. Rimozione, grammi, extra e persistenza restano inoltre coperti dai test statici dedicati.
- [x] Conservare le evidenze delle revisioni pubblicate in `FINAL-AUDIT.md`; il documento non sostituisce i controlli ancora aperti sotto.

## Controlli ancora aperti

- [ ] Controllo visivo sistematico di tutte le fotografie: gli audit automatici verificano file, collegamenti e unicità, non possono certificare che ogni pixel corrisponda davvero al piatto o all'alimento. I casi segnalati dall'utente hanno priorità.
- [x] Campione visivo mirato 1.19.84: grissini, olive, frutti di bosco, crema di mandorle, gelato fiordilatte e le due ricette di pollo con patate/catalogna e verza/polenta mostrano soggetti coerenti; questo non sostituisce la revisione dell'intero archivio.
- [ ] Riesame delle frequenze settimanali personalizzate per tutti gli stili alimentari con fonti istituzionali e, prima di chiamarle prescrizioni individuali, revisione di un professionista qualificato.
- [ ] Verifica di autenticità e provenienza per ogni ricetta internazionale, oltre al controllo automatico di ingredienti e grammature. Revisione 1.19.86: separati nell'app riferimento culturale del piatto, modello di composizione, sicurezza e soli dati nutrizionali; le preparazioni asiatiche prive di fonte regionale sono indicate come ispirazioni. Corretta la fonte ufficiale del bibimbap; verificati i collegamenti esistenti a MAFF, VisitKorea e TAT. Restano da controllare sistematicamente ingredienti, tecniche e denominazioni di tutte le ricette internazionali.
- [ ] Riesame continuo da utilizzatore delle proposte di Lavoro, Casa e Mensa a diversi target calorici, per correggere pasti impraticabili prima di ulteriori rilasci. La 1.19.91 copre il caso iniziale di Lavoro a 2600 kcal e il cambio stile Asiatico → Italiano, ma non tutte le combinazioni di profilo.
