// Dati derivati da centrofitness.sql, arricchiti per popolare la demo

export interface Corso {
  id: number;
  nome_corso: string;
  durata_minuti: number;
}

export interface Istruttore {
  id: number;
  id_corso: number;
  nome_istruttore: string;
  titolo_studi: string;
}

export interface CalendarioEntry {
  id: number;
  id_corso: number;
  id_istruttore: number;
  giorno: string; // YYYY-MM-DD
  orario: string; // HH:MM
  posti_disponibili: number;
}

export const corsi: Corso[] = [
  { id: 1, nome_corso: 'Powerlifting', durata_minuti: 150 },
  { id: 2, nome_corso: 'Pilates', durata_minuti: 60 },
  { id: 3, nome_corso: 'Zumba', durata_minuti: 90 },
  { id: 4, nome_corso: 'Nuoto', durata_minuti: 120 },
  { id: 5, nome_corso: 'Bodybuilding', durata_minuti: 120 },
];

export const istruttori: Istruttore[] = [
  { id: 1, id_corso: 1, nome_istruttore: 'Alessia', titolo_studi: 'Certificazione Istruttori Livello I — Accademia Italiana Forza (AIF)' },
  { id: 2, id_corso: 2, nome_istruttore: 'Sofia', titolo_studi: 'Diploma Nazionale riconosciuto dal CONI' },
  { id: 3, id_corso: 3, nome_istruttore: 'Gloria', titolo_studi: 'Licenza ufficiale Zumba Academy' },
  { id: 4, id_corso: 4, nome_istruttore: 'Dario', titolo_studi: 'Brevetto Allievo Istruttore FIN' },
  { id: 5, id_corso: 5, nome_istruttore: 'Giorgia', titolo_studi: 'Accademia Italiana Fitness (AIF)' },
];

// Schedulazione settimanale per ogni corso (giorni della settimana 0=Dom, 1=Lun, ... 6=Sab)
// Ogni corso ha più fasce orarie per giorno
const schedules: Array<{ id_corso: number; id_istruttore: number; days: number[]; orari: string[]; capienza: number }> = [
  { id_corso: 1, id_istruttore: 1, days: [2, 5],    orari: ['10:00', '18:00'],          capienza: 8  }, // Powerlifting: Mar, Ven
  { id_corso: 2, id_istruttore: 2, days: [1, 3, 5], orari: ['09:00', '12:00', '19:00'], capienza: 15 }, // Pilates: Lun, Mer, Ven
  { id_corso: 3, id_istruttore: 3, days: [2, 4, 6], orari: ['18:30', '20:00'],          capienza: 25 }, // Zumba: Mar, Gio, Sab
  { id_corso: 4, id_istruttore: 4, days: [1, 4],    orari: ['11:00', '20:00'],          capienza: 12 }, // Nuoto: Lun, Gio
  { id_corso: 5, id_istruttore: 5, days: [1, 3, 6], orari: ['09:30', '17:00'],          capienza: 14 }, // Bodybuilding: Lun, Mer, Sab
];

function pad(n: number) { return n < 10 ? '0' + n : '' + n; }

function generateCalendario(): CalendarioEntry[] {
  const entries: CalendarioEntry[] = [];
  const start = new Date(2026, 4, 5);   // 5 maggio 2026
  const end   = new Date(2026, 6, 31);  // 31 luglio 2026
  let id = 1;
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    for (const s of schedules) {
      if (!s.days.includes(dow)) continue;
      for (const orario of s.orari) {
        const orarioSeed = orario.split(':').map(Number).reduce((a, b) => a * 60 + b, 0);
        const seed = (s.id_corso * 31 + d.getDate() * 17 + d.getMonth() * 7 + d.getFullYear() + orarioSeed) % 97;
        const posti = seed < 7 ? 0 : Math.max(1, ((seed * 13) % s.capienza) + 1);
        entries.push({
          id: id++,
          id_corso: s.id_corso,
          id_istruttore: s.id_istruttore,
          giorno: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
          orario,
          posti_disponibili: posti,
        });
      }
    }
  }
  return entries;
}

// ~150 lezioni distribuite su mag/giu/lug 2026 con schedulazione settimanale realistica
export const calendario: CalendarioEntry[] = generateCalendario();

export function getCorsoById(id: number): Corso | undefined {
  return corsi.find(c => c.id === id);
}

export function getIstruttoreById(id: number): Istruttore | undefined {
  return istruttori.find(i => i.id === id);
}
