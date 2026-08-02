# Tavola Mia — roadmap versioni

Questa lista raccoglie le richieste dell'utente. Dopo ogni rilascio viene aggiornata senza perdere le richieste destinate alle versioni successive.

## v1.13.0 — in preparazione

- [x] C21 porridge banana, arachidi e lino: ricetta completa, componenti modificabili, calcolo e fotografia specifica.
- [x] S11 banana e crema 100% arachidi: presente nei due spuntini, ma escluso dalla libreria delle ricette complete.
- [x] Arachidi, crema 100% arachidi, lino, finocchi, pesche e asparagi con dati, porzioni e foto autonome.
- [x] Contesto “Stile” e “Dove” disposto su due colonne centrate.
- [ ] Bistecche distinte per animale e taglio: manzo, vitello, maiale/lonza e cavallo, con dati e immagini autonome.

## v1.12.1 — pubblicata

- [x] Corretto il ruolo dopo una scelta libera: il latte non eredita più il gruppo delle fette biscottate.
- [x] Alternative consigliate del latte: vaccino, soia, avena, yogurt e ricotta.
- [x] Rimossa la scelta globale “Da bere” dalla testata Oggi.
- [x] “Attività oggi/domani” usa “Nessuna, leggera, intensa”, senza etichetta ambigua “Riposo”.
- [x] Settimana con fotografie contestuali: tavola colazione, pausa spuntino, tavola pranzo e tavola cena.
- [x] Acquisiti due addendum da 40 ricette; totale matrici operative 134 ricette.
- [ ] Foto autonome per prosciutto cotto, fesa, bresaola, petto di pollo e tacchino; panini separati come ricette.
- [ ] Sottogruppi visivi nel pannello alternative.

## v1.12.0 — pronta per pubblicazione

- [x] Acquisita integralmente la specifica da 627 righe: 12 colazioni, 10 spuntini, 16 pranzi e 16 cene.
- [x] Aggiornamento automatico tramite `version.json`, rinviato mentre ricetta, alternative, preferenze o modifica settimanale sono aperte; archivio `vivapiatto-v1` invariato.
- [x] Vista Settimana con cinque immagini semantiche fisse, indipendenti dal primo ingrediente.
- [x] Primo collegamento della matrice: C05 pancake d'avena e banana, componenti modificabili, preparazione completa e fotografia specifica.
- [x] Farina d'avena, integrale e di grano saraceno con valori, foto e peso a crudo; escluse dalle rotazioni come alimenti crudi isolati.
- [x] Grissini con fotografia esatta e nuovo nome asset per invalidare la cache.
- [x] Sostituzioni del latticino a colazione ordinate per ruolo: latte, soia, avena, yogurt e ricotta.
- [ ] Collegare le altre 53 ricette della matrice in blocchi verificati, ognuna con componenti, valori, istruzioni, frequenze e foto propria.
- [ ] Completare il paniere oltre le 95 fotografie presenti e sostituire le foto ricetta generiche o duplicate.

## v1.2.0 — pubblicata

- [x] Eliminare il blocco grande “Mangia bene” e ridurre gli spazi inutili.
- [x] Rinominare l'app in “Scheda Alimenti”.
- [x] Filtri per allergie, intolleranze e alimenti non desiderati.
- [x] Menu settimanale consultabile senza ritorni poco chiari alla pagina Oggi.
- [x] Catalogo con oltre 300 proposte italiane, asiatiche, mediterranee, gourmet e vegetali.
- [x] Basi varie: riso, quinoa, farro, miglio, cous cous, grano saraceno, orzo, noodles e patata dolce.
- [x] Ricette guidate da zero con tempi, temperature, consistenza e impiattamento.
- [x] Colazioni, spuntini, frutta, frutta secca, dolci e frozen yogurt.
- [ ] Rifare la correlazione immagini: ogni foto deve rappresentare gli ingredienti reali della ricetta; evitare immagini duplicate e fuorvianti. (Riaperto dopo verifica v1.2.0)
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

- [ ] Cambio del singolo ingrediente nella ricetta (es. mela, kiwi, arancia) con grammi e calorie equivalenti ricalcolati.
- [ ] Foto dedicata e rappresentativa per ogni famiglia di piatti; rifiutare immagini con ingredienti estranei.
- [ ] Modalità settimana “più varietà” oppure “ripeti ciò che mi piace”.
- [ ] Dopo ogni sostituzione aggiornare automaticamente menu successivo e lista della spesa.
- [ ] Scelta rapida per pesce, carne, uova, vegetale, primo, secondo, contorno e piatto unico.
- [ ] Domande iniziali brevi e generazione immediata di proposte.
- [ ] Visualizzazione delle calorie rimanenti quando si sostituisce un piatto.
- [ ] Suggerimento di riequilibrio, sempre facoltativo.
- [ ] Centrifughe, smoothie e bevande preparabili a casa.
- [ ] Modalità “Fuori casa” con zona, tipo di locale e registrazione della scelta reale.

## v1.5.0 — pubblicata

- [x] Colazioni feriali predefinite entro 1-3 minuti; colazioni più elaborate solo nel weekend o su scelta esplicita.
- [x] Piatti italiani semplici: pasta in bianco/al pomodoro, pane, panini, uova, bistecca e patate lesse.
- [x] Modalità Lavoro/Casa: a pranzo propone preparazioni trasportabili o reperibili in mensa; la cena resta libera.
- [x] Completamento guidato dei piatti semplici senza obbligare un piatto unico composto.
- [ ] Legumi completi: ceci, lenticchie, fagioli, piselli; disponibili normalmente e limitati solo quando il check-in lo giustifica.
- [ ] Tabella interna verificata “stato → preferenze/cautele” con fonti ufficiali.
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
- [ ] Ampliare catalogo di paste, risi, verdure, funghi, olive, carni, pesci e metodi di cottura.
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
- [ ] Continuare paniere, foto atomiche e fotografie finali delle ricette.

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
- [ ] Riposizionare la lista della spesa in un flusso dedicato dopo la revisione con l’utente.
- [ ] Prossimo lotto del paniere: feta, grana e altri formaggi, con dati, foto, porzioni, ricette e alternative.
- [ ] Integrare ogni voce residua dell’elenco generale con dati, fotografia e ricette: il lavoro continua nelle revisioni successive.

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
- [ ] Rotazione settimanale completa senza ripetizioni inutili.
- [ ] Estetica iniziale più calda e riconoscibile, ispirata alla cucina, senza aumentare gli spazi vuoti.

## v1.9.0 — prossima

- [ ] Ampliare il catalogo dall’elenco generale allegato: dati, porzioni, ruoli e foto.
- [ ] Banca dati testuale separata per extra/sgarri con autocomplete e valori da etichetta.
- [ ] Portare la vista Settimana alla stessa composizione modificabile di Oggi.
- [ ] Applicare le frequenze registrate alla generazione automatica dei giorni successivi.

- [ ] Ampliare progressivamente piatti e fotografie senza sacrificare precisione e usabilità.
- [ ] Verificare sempre assenza di scorrimento orizzontale e densità su cellulare.
- [ ] Mantenere un unico repository, un unico link GitHub Pages e numero di versione visibile.
- [ ] Valori nutrizionali tracciabili; dichiarare chiaramente che restano stime e non analisi cliniche del piatto reale.
