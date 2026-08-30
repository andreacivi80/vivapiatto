# Tavola Mia — checklist generale persistente

Questa checklist resta nel repository e viene aggiornata a ogni revisione. Una voce è completa solo quando dati, fotografia, proposta, alternativa, calcolo e comportamento mobile sono verificati insieme.

## Fondamenta alimentari

- [ ] Completare tutti gli alimenti degli allegati con kcal, proteine, carboidrati, grassi, fibra, fonte e stato crudo/cotto.
- [x] Collegare ogni alimento ordinario alle ricette e ai bacini di proposta quotidiani; separare chiaramente gli sgarri e gli extra. Verifica automatica: 217/217 alimenti richiesti usati da ricette reali (`audit-pantry-recipe-usage.mjs`); colazioni, spuntini e pasti principali derivano tutti da `allRecipes`.
- [ ] Completare equivalenze per categoria con grammi realmente proporzionati, mai quantità identiche arbitrarie.
- [ ] Verificare porzioni pratiche e pesabili e distinguere peso a crudo, cotto e sgocciolato.
- [ ] Completare rotazioni settimanali secondo riferimenti istituzionali senza trasformarle in prescrizioni cliniche.

## Ricette e fotografie

- [x] Collegare integralmente le quattro matrici di ricette al motore dei pasti. Verifica automatica: 214/214 (C44, S42, P64, D64).
- [x] Eliminare dalla libreria ogni combinazione che non sia una ricetta vera. Spuntini elementari restano nel piano ma il ricettario richiede tecnica, piatto preparato riconoscibile oppure almeno quattro ingredienti.
- [ ] Creare fotografia specifica per ogni alimento e preparazione, senza riuso semanticamente errato.
- [ ] Creare fotografia finale specifica per ogni ricetta completa, con gli ingredienti realmente presenti.
- [ ] Controllare automaticamente riferimenti mancanti, associazioni foto/alimento e cache busting a ogni versione.
- [ ] Completare ricette italiane, orientali, internazionali, semplici da lavoro e più elaborate da casa/weekend.

## Piano e alternative

- [ ] Rendere ogni risposta iniziale realmente influente su menu, porzioni e suggerimenti.
- [ ] Distinguere lavoro, casa, mensa, trasporto e tempo disponibile.
- [ ] Ordinare le alternative per momento della giornata mantenendo comunque una scelta libera completa.
- [ ] Permettere rimozione, aggiunta, cambio e modifica grammi di ogni componente.
- [ ] Riequilibrare giorno e settimana dopo le modifiche senza sovrascrivere le scelte bloccate.
- [ ] Sincronizzare Oggi, Settimana, ricette proposte, diario, progressi e lista della spesa.

## Interfaccia mobile

- [ ] Nessun testo, pulsante, foto o valore deve uscire dalla larghezza del telefono.
- [ ] Alternative richiudibili, chiusura sempre accessibile e scelta libera separata.
- [ ] Foto complete nella Settimana e foto più grandi in Oggi, senza ritagli significativi.
- [ ] Barra di modifica settimanale fissa in alto e visibile solo durante quel flusso.
- [ ] Minimizzare spazi e testi inutili mantenendo leggibili grammi e nutrienti.
- [ ] Refresh automatico sicuro della nuova versione senza perdere lo stato locale.

## Diario, riepiloghi e spesa

- [ ] Flag mangiato reversibile e separato dall'apertura della ricetta.
- [ ] Totali reali aggiornati con grammi, sostituzioni, extra e bevande.
- [ ] Confronto giornaliero e settimanale tra piano, consumo registrato e scostamento.
- [ ] Autocomplete extra/sgarri con banca dati estesa e calcolo dai grammi.
- [ ] Lista della spesa generata dai piatti scelti, modificabile, spuntabile, condivisibile e con seleziona/deseleziona tutto.

## Verifica finale

- [ ] Riesaminare tutta la chat e tutti gli allegati confrontandoli con questa checklist.
- [ ] Eseguire test statici, build, controllo fotografie e test mobile a ogni revisione.
- [ ] Stress test finale da utilizzatore: sostituzioni, grammi, rimozioni, settimana, refresh, diario, extra, ricette e spesa.
- [ ] Pubblicare l'ultima revisione soltanto dopo la chiusura documentata di ogni voce.
