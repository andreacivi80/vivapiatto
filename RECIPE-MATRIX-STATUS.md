# Matrice ricette — stato operativo

Specifiche ricevute: matrice iniziale di 627 righe, primo addendum di 1.109 righe, secondo addendum di 800 righe e terzo addendum di 826 righe.

## Perimetro acquisito

- Colazioni `C01–C12`: 12.
- Spuntini `S01–S10`: 10.
- Pranzi `P01–P16`: 16.
- Cene `D01–D16`: 16.
- Addendum: colazioni `C13–C20` (8), spuntini `S11–S18` (8), pranzi `P17–P28` (12), cene `D17–D28` (12).
- Secondo addendum: colazioni `C21–C28` (8), spuntini `S19–S26` (8), pranzi `P29–P40` (12), cene `D29–D40` (12).
- Terzo addendum: colazioni `C29–C36` (8), spuntini `S27–S34` (8), pranzi `P41–P52` (12), cene `D41–D52` (12).
- Totale elementi definiti nelle quattro matrici: 174.
- Il terzo addendum aggiunge anche “Crea una ricetta con gli avanzi”, con data, conservazione, stato crudo/cotto e regole di sicurezza vincolanti.

Ogni ricetta entra nel motore reale soltanto dopo ingredienti pesati, indicazione crudo/cotto/sgocciolato, valori nutrizionali, allergeni, componenti sostituibili, preparazione, tempo, metodo di cottura, fotografia specifica e frequenze settimanali.

## Regole vincolanti recepite

- Pasti principali: cereale o tubero, proteina, verdura e grasso misurato; piatto unico quando tutte le componenti sono incluse.
- Due spuntini distinti, senza duplicazione automatica dello stesso frutto.
- Lavoro: colazioni, spuntini e pranzi pratici; Casa: priorità a ricette più articolate.
- Le sostituzioni consigliate restano nello stesso ruolo e ricevono grammi pratici equivalenti; la scelta libera resta separata.
- Nessuna farina viene proposta da sola: entra soltanto in una ricetta finita.
- Pesi sempre qualificati come crudi, cotti, sgocciolati o parte edibile.
- Olio, frutta secca, semi, formaggi e uova presenti nelle preparazioni vengono conteggiati.
- Nessun compenso punitivo dopo uno sgarro e nessun pasto azzerato automaticamente.
- Ricette internazionali indicate come “ispirate a” quando non sono versioni tradizionali certificate.

## Avanzamento

- `C05` collegata nella v1.12.0 con fotografia finale specifica e cinque componenti modificabili.
- `C21` collegata nella v1.13.0 come ricetta completa con cinque componenti modificabili e fotografia finale specifica.
- `S11` collegato nella v1.13.0 alle rotazioni degli spuntini come abbinamento semplice, escluso dalla libreria delle ricette complete.
- `P43` collegata nella v1.14.2 come pranzo trasportabile completo, con fotografia finale specifica, cinque componenti modificabili e conteggio di due uova.
- `C29` collegata nella v1.14.3 come porridge completo con pera e pistacchi, fotografia finale e quattro componenti modificabili.
- `C30` collegata nella v1.14.4 come yogurt greco con kiwi, avena e pecan, fotografia finale e quattro componenti modificabili.
- `C32` collegata nella v1.15.0 come omelette completa con albume CREA, verdure e pane, fotografia finale e componenti modificabili.
- `C33` collegata nella v1.15.2 come kefir con papaya, muesli e mandorle, con fotografia finale e componenti modificabili.
- `C31`, `C34`, `C35` e `C36` collegate nella v1.15.11 con fotografie finali specifiche, componenti atomici, preparazioni complete e distinzione lavoro/casa.
- `S27–S34` collegati nella v1.15.12 alle due rotazioni quotidiane, con quantità pratiche, preparazione, componenti sostituibili e fotografie atomiche specifiche.
- `P41`, `P42` e `P44` collegati nella v1.15.13 con fotografie finali specifiche, componenti modificabili e preparazioni complete.
- `P45–P52` collegati nelle v1.15.14–1.15.15 con fotografie finali specifiche e componenti sostituibili.
- Pane di farro, pane ai cereali, nocciole, crema 100% nocciole, skyr e semi di chia hanno dati strutturati, porzioni e fotografie autonome.
- La generazione automatica usa ora una prima matrice esplicita di compatibilità tra famiglia della base e proteina, invece di un abbinamento libero.
- Arachidi, crema 100% arachidi, semi di lino, finocchi, pesche e asparagi hanno dati strutturati, porzioni e fotografie autonome.
- Farine d'avena, integrale e di grano saraceno strutturate con fotografie specifiche.
- Restano 143 elementi delle quattro matrici da collegare integralmente; non sono completati finché non superano controllo dati, foto, rotazione e mobile.

## Sequenza prossimi blocchi

1. `C01–C04`, `C06–C36`: colazioni veloci e da casa/weekend.
2. `S01–S34`: spuntini realistici, distinti e trasportabili.
3. `P01–P52`: pranzi lavoro/casa con componenti sostituibili.
4. `D01–D52`: cene complete, metodi di cottura e frequenze.
5. Controllo col paniere originario: ogni alimento non occasionale deve comparire in almeno una ricetta e in una rotazione settimanale.
