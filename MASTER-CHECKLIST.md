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
- [x] Creare fotografia specifica per ogni alimento e preparazione, senza riuso semanticamente errato. Prove: 217/217 alimenti richiesti con foto dedicata e 557/557 asset validi.
- [x] Creare fotografia finale specifica per ogni ricetta completa, con gli ingredienti realmente presenti. Prove: 214/214 foto matrice e 257/257 foto finali del catalogo (`--strict`).
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
- [x] Foto complete nella Settimana e foto più grandi in Oggi, senza ritagli significativi. `object-fit` specifico per le due viste e audit asset mobile 557/557.
- [x] Barra di modifica settimanale fissa in alto e visibile solo durante quel flusso. Test v1.18.54 e selettore condizionale su `weekEditingDay`.
- [x] Minimizzare spazi e testi inutili mantenendo leggibili grammi e nutrienti. Riepiloghi compatti senza porzione duplicata; nutrienti estesi nel riepilogo.
- [x] Refresh automatico sicuro della nuova versione senza perdere lo stato locale. Manifest interrogato senza cache, scroll e stato preservati; recupero indipendente v1.19.7, rimonta pulita v1.19.11 e versione unica manifest/client v1.19.12.

## Diario, riepiloghi e spesa

- [x] Flag mangiato reversibile e separato dall'apertura della ricetta. Test permanente e pulsante dedicato.
- [x] Totali reali aggiornati con grammi, sostituzioni, extra e bevande. Test v1.18.39 e v1.18.43.
- [x] Confronto giornaliero e settimanale tra piano, consumo registrato e scostamento. Riepilogo Dopo cena e medie/scarti dei sette giorni.
- [x] Autocomplete extra/sgarri con banca dati estesa e calcolo dai grammi. 114 voci univoche con macro, fibre e fonte (`audit-occasional-foods.mjs`).
- [x] Lista della spesa generata dai piatti scelti, modificabile, spuntabile, condivisibile e con seleziona/deseleziona tutto. Ambito giorno/settimana e quantità derivate dai componenti attivi.

## Verifica finale

- [x] Riesaminare tutta la chat e tutti gli allegati confrontandoli con questa checklist. Verificati elenco generale, matrice iniziale, quattro addendum e obiettivo permanente; perimetro ricette `C01–C44`, `S01–S42`, `P01–P64`, `D01–D64`.
- [x] Eseguire test statici, build, controllo fotografie e test mobile a ogni revisione. Ultima suite completa: 157/157; audit foto 557/557, 214/214 matrice e 257/257 ricette reali.
- [x] Stress test finale da utilizzatore: sostituzioni, grammi, rimozioni, settimana, refresh, diario, extra, ricette e spesa. Prova pubblica a 390×844 su Oggi, cambio piatto a fondo pagina, ritorno, Settimana, barra fissa, Ricette, Progressi, spesa e refresh; nessun overflow, schermata bianca o errore console. Rimozione, grammi, extra e persistenza restano inoltre coperti dai test statici dedicati.
- [x] Pubblicare l'ultima revisione soltanto dopo la chiusura documentata di ogni voce. Evidenze consolidate in `FINAL-AUDIT.md`.
