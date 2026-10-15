# Tavola Mia — audit progressivo del perimetro ricevuto

Data verifica: 15 ottobre 2026. Ultimo checkpoint pubblico verificato: `1.19.92`.

Questo audit registra copertura tecnica e prove eseguite; non certifica clinicamente un piano alimentare né sostituisce la revisione visiva completa delle fotografie. I controlli residui sono in `MASTER-CHECKLIST.md`.

## Specifiche acquisite

- Elenco generale degli alimenti e degli extra/sgarri.
- Matrice iniziale e quattro addendum: 214 ricette, da `C01` a `C44`, da `S01` a `S42`, da `P01` a `P64` e da `D01` a `D64`.
- Obiettivo operativo permanente confrontato con il repository e con le checklist storiche.

## Evidenze automatiche

- Banca dati: 221 alimenti base con macronutrienti, fibre e fonte riconosciuta.
- Copertura selezionabile: 282/282 voci nutrizionali e 265/265 ingredienti ricetta con componente e foto.
- Paniere esplicito: 217/217 alimenti richiesti selezionabili, fotografati e utilizzati da almeno una ricetta reale.
- Ricette: 214/214 elementi delle matrici completi e univoci; ingredienti, grammature e componenti allineati.
- Fotografie: 570/570 asset validi; 214/214 foto matrice dedicate; 259/259 ricette reali con foto finale dedicata, semanticamente completa e non condivisa.
- Extra/sgarri: 114 voci univoche con chilocalorie, proteine, carboidrati, grassi, fibre e fonte.
- Alternative: 268 alimenti senza duplicati né card vuote nella stessa categoria.
- Rotazione: 14/14 pasti principali nei range definiti, senza famiglie proteiche consecutive.
- Suite pubblicabile: 219/219 test superati nella 1.19.92, controllo TypeScript senza errori, SSR superato e build GitHub Pages riuscita.
- Aggiornamento automatico tra release verificato su mobile reale: versione nuova rilevata senza intervento, menu, grammatura modificata e posizione di scorrimento conservati.
- Stress mobile pubblico ripetibile: viewport 390×844, target calorico verificato su profilo pulito e contesto Lavoro/Casa, check-in adattivo, conferma/rotazione/stampa settimanale, quattro famiglie delle 214 ricette, ritorno fisso, alternative del latte, modifica grammatura persistente, aggiunta/rimozione diretta di componenti, fotografie visibili realmente caricate e zero errori JavaScript.
- Pubblicazione verificata sul link unico: manifest `1.19.91`, HTML e asset JavaScript allineati. Lo stress mobile pubblico della 1.19.91 è passato senza errori JavaScript, overflow globale, recupero, immagini rotte o immagini pendenti. Le due card lunghe segnalate contengono tutto il testo a 320/390 px; con “+ → Sgarri” la pizza è visibile attraverso un accesso rapido fisso, si aggiunge al pasto senza cancellarne le parti, mostra la propria foto e si rimuove direttamente. Anche dopo un filtro ricette precedente, la categoria Sgarri ripropone pizza e altre scelte occasionali. Pizza → tiramisù sostituisce soltanto lo sgarro aggiunto; il tiramisù offre “Modifica porzione”, componente e foto propri.
- Pubblicazione 1.19.92 sullo stesso link: manifest, HTML e asset `index-BOZC7zJF.js` allineati dopo il deploy GitHub Pages; stress mobile pubblico riuscito con versione visibile, nessun recupero, nessun overflow, nessuna foto rotta e zero errori JavaScript. L'avvio ora accetta la nuova versione soltanto quando anche HTML e script risultano disponibili, con fino a tre tentativi anti-cache; la sessione aperta mostra separatamente la revisione in uso e quella appena pubblicata e riprova al ritorno in pagina o online. Un'attività aperta continua a differire il refresh per non interrompere il lavoro.
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
