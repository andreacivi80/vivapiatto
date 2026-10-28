# Coerenza fra preparazione e distinta — v1.20.61

## Correzioni implementate

- Il generatore di 84 pasti usa nelle istruzioni il condimento effettivo della distinta. Nei 21 casi con Grana non invita più ad aggiungere olio non conteggiato.
- 47 ricette dichiarano ora 62 aromi prima citati soltanto nei passi: curry in polvere 2 g, curcuma in polvere 1 g, zenzero fresco 5 g, aglio crudo 3 g e paprika dolce 2 g, secondo la presenza effettiva nella preparazione. Si tratta di quantità culinarie editoriali per una persona, non di dosi attribuite alle fonti originali o di indicazioni terapeutiche.
- Due piatti hanno anche cipolla cruda 40 g; quattro hanno aceto consumato come condimento 5 g, distinguendo vino e mele secondo i passi. Due di queste sei ricette appartengono già alle 47 sopra: in totale 51 ricette letterali e 68 aggiunte misurate.
- Gli ingredienti hanno le voci nutrizionali e le foto già disponibili nel paniere. Quando una ricetta ha componenti espliciti, food e grammi sono identici alla distinta. Le ricette senza parts esplicite continuano a derivare i componenti dagli ingredienti.
- I filtri Senape e Solfiti escludono prudenzialmente, rispettivamente, il curry generico e gli aceti senza etichetta di prodotto verificata. Le note nella ricetta spiegano l'incertezza: non è un'affermazione che tutte le marche contengano l'allergene. Il riferimento FSA descrive la possibile presenza di senape nei curry e la necessità di controllare gli ingredienti: [scheda allergene Senape](https://data.food.gov.uk/codes/alerts/def/allergen/mustard), [regole di dichiarazione degli allergeni](https://www.gov.uk/food-labelling-and-packaging/ingredients-list). Non vengono trasformate vecchie allerte di richiamo in un divieto permanente.
- Il manifesto della build viene scritto in `writeBundle`, dopo la scrittura riuscita dei file. Il precedente `closeBundle`, eseguito anche in caso di errore, poteva nascondere il problema originale con un errore secondario di HTML mancante. La causa del primo fallimento della copia/build non è stata dimostrata da una ripetizione riuscita.

## Verifiche

- Test AST sulle 47 ricette e 62 aromi, più test AST sulle sei aggiunte di cipolla/aceto.
- Test del generatore effettivo di 84 piatti: condimento contato e istruzioni coincidono in tutti i casi, inclusi 21 con Grana.
- Test dei filtri prudenziali su curry e aceti, con controllo delle note di etichetta.
- Test deterministici dei browser di audit: exit zero non è da solo un fallimento; file della porta parziale, endpoint estraneo, richiesta HTTP/WebSocket bloccata e chiusura della connessione sono gestiti con scadenze. Tutti e tre gli audit condividono avvio e manutenzione.
- Nessun `taskkill` su PID numerici: prima si richiede la chiusura sulla sessione CDP propria, poi si gestisce solo l'handle originale ancora vivo. La rimozione del profilo richiede prova di proprietà, processi assenti e percorso privo di reparse; altrimenti è saltata e registrata. Il preflight host `scripts/check-headless-maintenance.mjs` ha confermato il controllo directory; una riga WMI non verificabile lascia prudentemente il profilo intatto.
- Guardie sulle dimensioni mantenute: meno di 640 kB per il bundle applicativo e meno di 142 kB gzip, senza caricamento differito del pianificatore.
- Suite completa, matrice dei profili, audit mobile e pubblicazione: esiti registrati nella checklist generale al termine del rilascio.

## Lavoro ancora aperto

- Circa 69 preparazioni citano limone senza quantità riproducibile: distinguere succo consumato, scorza, guarnizione e opzione, senza aggiungere arbitrariamente entrambi.
- P28: salsa di soia facoltativa da rendere esplicita come scelta, non obbligatoria.
- Panna cotta, pastiera e arancino: mantenere le voci di prodotto pronto e aggiungere vere ricette domestiche distinte, con ingredienti completi e fonti. Piano e fonti in `PREPARED-RECIPE-BACKLOG.md`.
- Proseguire il controllo fine di tecniche, tempi, fonti e fotografie dell'intero catalogo; questi test non equivalgono a una validazione nutrizionale clinica.
- Manutenzione degli audit: è stata riprodotta una peculiarità WMIC, che sul PC non quota sempre le virgole delle CommandLine nel CSV. Il parser non salta tali righe: mantiene il profilo. Una futura soluzione deve usare dati strutturati e conservare la stessa prudenza sui dati ambigui, non assumere che una colonna mancante provi l'assenza di un processo.
