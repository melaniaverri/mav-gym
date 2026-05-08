import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Dumbbell, Calendar as CalendarIcon, MapPin, Phone, Mail, Instagram, Facebook, Menu, X, CreditCard, CheckCircle, BookOpen, Activity, Waves, Music, Sparkles, Award, Star, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { calendario, getCorsoById, getIstruttoreById, corsi, istruttori, type CalendarioEntry, type Istruttore, type Corso } from '@/data/gymData';

// Category badge mapping (solo label — colori dal sistema palette via CSS vars)
function getCourseBadge(corsoId: number): { label: string } | null {
  switch (corsoId) {
    case 1: case 5: return { label: 'Forza' };
    case 2: return { label: 'Benessere' };
    case 3: return { label: 'Cardio' };
    case 4: return { label: 'Nuoto' };
    default: return null;
  }
}
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { smoothScrollToElement } from '@/lib/lenis';
import { toast } from 'sonner';
// Gallery photos (Unsplash, license-free) — 3 per categoria per il lightbox
import salaPesi from '@/assets/gallery/sala-pesi.jpg';
import salaPesi2 from '@/assets/gallery/sala-pesi-2.jpg';
import salaPesi3 from '@/assets/gallery/sala-pesi-3.jpg';
import areaCardio from '@/assets/gallery/cardio.jpg';
import areaCardio2 from '@/assets/gallery/cardio-2.jpg';
import areaCardio3 from '@/assets/gallery/cardio-3.jpg';
import salaCorsi from '@/assets/gallery/sala-corsi.jpg';
import salaCorsi2 from '@/assets/gallery/sala-corsi-2.jpg';
import salaCorsi3 from '@/assets/gallery/sala-corsi-3.jpg';
import zumbaImg from '@/assets/gallery/zumba.jpg';
import piscina from '@/assets/gallery/piscina.jpg';
import piscina2 from '@/assets/gallery/piscina-2.jpg';
import piscina3 from '@/assets/gallery/piscina-3.jpg';
import receptionImg from '@/assets/gallery/reception.jpg';
import receptionImg2 from '@/assets/gallery/reception-2.jpg';
import receptionImg3 from '@/assets/gallery/reception-3.jpg';
import spogliatoi from '@/assets/gallery/spogliatoi.jpg';
import spogliatoi2 from '@/assets/gallery/spogliatoi-2.jpg';
import spogliatoi3 from '@/assets/gallery/spogliatoi-3.jpg';
// Instructor portraits
import alessiaPowerliftingImg from '@/assets/instructors/alessia-powerlifting.jpg';
import sofiaImg from '@/assets/instructors/sofia.jpg';
import gloriaImg from '@/assets/instructors/gloria.jpg';
import darioImg from '@/assets/instructors/dario.jpg';
import giorgiaImg from '@/assets/instructors/giorgia.jpg';

const instructorPhotos: Record<number, string> = {
  1: alessiaPowerliftingImg,
  2: sofiaImg,
  3: gloriaImg,
  4: darioImg,
  5: giorgiaImg,
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

// Helpers timezone-safe: evita lo slittamento UTC (giorno prima in Italia)
function parseLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function formatLocalDate(date: Date): string {
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Get available dates for a specific course
function getCourseDates(corsoId: number) {
  return calendario
    .filter(e => e.id_corso === corsoId && e.posti_disponibili > 0)
    .map(e => parseLocalDate(e.giorno));
}

function getEntryByDate(corsoId: number, date: Date) {
  const dateStr = formatLocalDate(date);
  return calendario.find(e => e.id_corso === corsoId && e.giorno === dateStr);
}

interface Booking {
  id: number;
  corsoNome: string;
  giorno: string;
  orario: string;
  email: string;
}

interface UserProfile {
  nome: string;
  cellulare: string;
  email: string;
}

// --- Booking Modal ---
function BookingModal({ entry, onClose, onConfirm }: {
  entry: CalendarioEntry & { posti: number };
  onClose: () => void;
  onConfirm: (entryId: number, email: string) => void;
}) {
  const corso = getCorsoById(entry.id_corso);
  const availableDates = getCourseDates(entry.id_corso);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(parseLocalDate(entry.giorno));
  const [selectedEntry, setSelectedEntry] = useState(entry);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      const found = getEntryByDate(entry.id_corso, selectedDate);
      if (found) setSelectedEntry({ ...found, posti: found.posti_disponibili });
    }
  }, [selectedDate, entry.id_corso]);

  const isDateAvailable = (date: Date) => {
    return availableDates.some(d => d.toDateString() === date.toDateString());
  };

  const handleConfirm = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Inserisci un\'email valida');
      return;
    }
    setSending(true);
    // Simulate async booking
    await new Promise(r => setTimeout(r, 800));
    onConfirm(selectedEntry.id, email);
    setSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ isolation: 'isolate' }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border/50 p-7 overflow-y-auto max-h-[90vh] bg-background"
        style={{ boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-2xl tracking-wider text-foreground mb-1">Prenota {corso?.nome_corso}</h3>
        <p className="text-sm text-muted-foreground mb-4">Seleziona una data disponibile</p>

        <div className="flex justify-center mb-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => !isDateAvailable(date)}
            className="p-3 pointer-events-auto rounded-lg border border-border"
          />
        </div>

        {selectedDate && (
          <div className="mb-4 p-3 rounded-lg bg-muted border border-border text-sm text-foreground/85 space-y-1">
            <p><strong className="text-foreground">Data:</strong> {formatDate(selectedDate.toISOString())}</p>
            <p><strong className="text-foreground">Orario:</strong> {selectedEntry.orario}</p>
            <p><strong className="text-foreground">Posti disponibili:</strong> {selectedEntry.posti}</p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1.5">La tua email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="es. mario@email.com"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selectedDate || sending || selectedEntry.posti <= 0}
          className="w-full py-3 rounded-lg font-semibold text-sm tracking-wide text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}
        >
          {sending ? 'Prenotazione in corso...' : 'Conferma Prenotazione'}
        </button>
      </motion.div>
    </motion.div>
  );
}

// --- Course Card ---
const courseIcons: Record<number, typeof Dumbbell> = {
  1: Dumbbell,
  2: Activity,
  3: Music,
  4: Waves,
  5: Dumbbell,
};

const courseImages: Record<number, string> = {
  1: salaPesi,
  2: salaCorsi,
  3: zumbaImg,
  4: piscina,
  5: salaPesi,
};

type LiveEntry = CalendarioEntry & { posti: number };

function CourseCard({ corso, entries, onBook }: {
  corso: Corso;
  entries: LiveEntry[];
  onBook: (entry: LiveEntry) => void;
}) {
  const istruttore = istruttori.find(i => i.id_corso === corso.id);
  const courseEntries = entries
    .filter(e => e.id_corso === corso.id)
    .sort((a, b) => a.giorno.localeCompare(b.giorno));
  const availableSessions = courseEntries.filter(e => e.posti > 0);
  const totalSpots = availableSessions.reduce((s, e) => s + e.posti, 0);
  const firstAvailable = availableSessions[0];
  const Icon = courseIcons[corso.id] ?? Dumbbell;
  const badge = getCourseBadge(corso.id);
  const image = courseImages[corso.id];
  const esaurito = !firstAvailable;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="group relative rounded-xl border border-border overflow-hidden flex flex-col transition-all hover:[border-color:var(--th-card-hover)]"
      style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Image header */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={corso.nome_corso}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

        {/* Top-left: category badge */}
        {badge && (
          <span
            className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur border"
            style={{ background: 'var(--th-badge-bg)', color: 'var(--th-badge-fg)', borderColor: 'var(--th-badge-bd)' }}
          >
            {badge.label}
          </span>
        )}
        {/* Top-right: icon */}
        <div className="absolute top-3 right-3 w-11 h-11 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center">
          <Icon className="w-5 h-5" strokeWidth={2} style={{ color: 'var(--th-card-icon)' }} />
        </div>
        {/* Bottom: course name */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-3xl tracking-wider drop-shadow-lg leading-none" style={{ color: 'var(--th-card-name)' }}>{corso.nome_corso}</h3>
          {istruttore && (
            <p className="mt-1 text-xs text-white/85 font-medium">con {istruttore.nome_istruttore}</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-border/60 py-2.5">
            <p className="flex items-center justify-center gap-1 text-xs font-semibold" style={{ color: 'var(--th-stat-icon)' }}>
              <Clock className="w-3.5 h-3.5" /> Durata
            </p>
            <p className="mt-1 text-foreground font-bold text-sm">{corso.durata_minuti} min</p>
          </div>
          <div className="rounded-lg border border-border/60 py-2.5">
            <p className="flex items-center justify-center gap-1 text-xs font-semibold" style={{ color: 'var(--th-stat-icon)' }}>
              <CalendarIcon className="w-3.5 h-3.5" /> Lezioni
            </p>
            <p className="mt-1 text-foreground font-bold text-sm">{availableSessions.length}</p>
          </div>
          <div className="rounded-lg border border-border/60 py-2.5">
            <p className="flex items-center justify-center gap-1 text-xs font-semibold" style={{ color: 'var(--th-stat-icon)' }}>
              <Users className="w-3.5 h-3.5" /> Posti
            </p>
            <p className={`mt-1 font-bold text-sm ${esaurito ? 'text-destructive' : 'text-foreground'}`}>{totalSpots}</p>
          </div>
        </div>

        <button
          onClick={() => firstAvailable && onBook(firstAvailable)}
          disabled={esaurito}
          className={`mt-auto w-full py-3 rounded-lg font-semibold text-sm tracking-wide transition-all duration-300 ${
            esaurito
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'text-primary-foreground hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]'
          }`}
          style={!esaurito ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' } : {}}
        >
          {esaurito ? 'Tutte esaurite' : 'Prenota e scegli la data'}
        </button>
      </div>
    </motion.div>
  );
}

// --- Payments Section ---
function PaymentsSection({ onBack }: { onBack: () => void }) {
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    setProcessing(false);
    toast.success('Pagamento effettuato! Abbonamento rinnovato.');
    onBack();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <button onClick={onBack} className="text-sm text-primary hover:underline">← Torna al profilo</button>
      <h3 className="text-2xl tracking-wider text-foreground">Rinnova Abbonamento</h3>

      <div className="space-y-3">
        {[
          { nome: 'Mensile', prezzo: '€39/mese', durata: '1 mese' },
          { nome: 'Trimestrale', prezzo: '€99/trimestre', durata: '3 mesi' },
          { nome: 'Annuale', prezzo: '€349/anno', durata: '12 mesi' },
        ].map(plan => (
          <div key={plan.nome} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
            <div>
              <p className="text-foreground font-semibold">{plan.nome}</p>
              <p className="text-sm text-muted-foreground">{plan.durata}</p>
            </div>
            <span className="text-primary font-bold">{plan.prezzo}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handlePay}
        disabled={processing}
        className="w-full py-3 rounded-lg font-semibold text-sm tracking-wide text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
        style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}
      >
        <span className="flex items-center justify-center gap-2">
          <CreditCard className="w-4 h-4" />
          {processing ? 'Elaborazione...' : 'Procedi al Pagamento'}
        </span>
      </button>
    </motion.div>
  );
}

// --- Personal Section ---
function PersonalSection({ bookings }: { bookings: Booking[] }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ nome: '', cellulare: '', email: '' });

  const handleLogin = () => {
    if (!profile.nome || !profile.cellulare || !profile.email) {
      toast.error('Compila tutti i campi');
      return;
    }
    setLoggedIn(true);
    toast.success(`Benvenuto/a, ${profile.nome}!`);
  };

  // Simulated subscription data
  const abbonamento = {
    tipo: 'Mensile',
    scadenza: '2026-05-15',
    attivo: true,
  };

  if (!loggedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-xl border border-border p-8"
        style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}
      >
        <h3 className="text-xl tracking-wider text-foreground mb-6 text-center">Accedi alla tua area personale</h3>
        <div className="max-w-sm mx-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nome</label>
            <input
              type="text"
              value={profile.nome}
              onChange={e => setProfile(p => ({ ...p, nome: e.target.value }))}
              placeholder="Il tuo nome"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Cellulare</label>
            <input
              type="tel"
              value={profile.cellulare}
              onChange={e => setProfile(p => ({ ...p, cellulare: e.target.value }))}
              placeholder="+39 333 1234567"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              placeholder="mario@email.com"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-lg font-semibold text-sm tracking-wide text-primary-foreground hover:brightness-110 transition-all"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}
          >
            Accedi
          </button>
        </div>
      </motion.div>
    );
  }

  if (showPayments) {
    return (
      <div className="rounded-xl border border-border p-8" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
        <PaymentsSection onBack={() => setShowPayments(false)} />
      </div>
    );
  }

  // Calculate stats
  const currentMonth = new Date().getMonth();
  const monthBookings = bookings.filter(b => new Date(b.giorno).getMonth() === currentMonth).length;
  const subStartDate = new Date('2026-03-15');
  const daysSinceStart = Math.floor((Date.now() - subStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const nextBooking = bookings.length > 0
    ? bookings.reduce((next, b) => new Date(b.giorno) > new Date() && (!next || new Date(b.giorno) < new Date(next.giorno)) ? b : next, null as Booking | null)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Mini Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border p-5 flex items-center gap-4" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">{monthBookings}</p>
            <p className="text-xs text-muted-foreground">Lezioni questo mese</p>
          </div>
        </div>
        <div className="rounded-xl border border-border p-5 flex items-center gap-4" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
            <Activity className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">{Math.max(daysSinceStart, 0)}g</p>
            <p className="text-xs text-muted-foreground">Abbonamento attivo da</p>
          </div>
        </div>
        <div className="rounded-xl border border-border p-5 flex items-center gap-4" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-primary">{nextBooking ? formatDate(nextBooking.giorno).split(',').slice(0, 2).join(',') : '—'}</p>
            <p className="text-xs text-muted-foreground">{nextBooking ? nextBooking.corsoNome : 'Nessuna lezione'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border p-8 space-y-6" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl tracking-wider text-foreground">Ciao, {profile.nome}!</h3>
          <button onClick={() => setLoggedIn(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Esci</button>
        </div>

        {/* Subscription */}
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-foreground font-semibold">Stato Abbonamento</h4>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${abbonamento.attivo ? 'bg-green-500/20 text-green-600' : 'bg-destructive/20 text-destructive'}`}>
              {abbonamento.attivo ? 'Attivo' : 'Scaduto'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Piano: <strong className="text-foreground">{abbonamento.tipo}</strong></p>
          <p className="text-sm text-muted-foreground">Scadenza: <strong className="text-foreground">{formatDate(abbonamento.scadenza)}</strong></p>
          <button
            onClick={() => setShowPayments(true)}
            className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all flex items-center gap-2"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}
          >
            <CreditCard className="w-4 h-4" /> Rinnova
          </button>
        </div>

        {/* Bookings */}
        <div>
          <h4 className="text-foreground font-semibold mb-3">Le tue prenotazioni</h4>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna prenotazione effettuata.</p>
          ) : (
            <div className="space-y-2">
              {bookings.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border border-border text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <div>
                    <p className="text-foreground font-medium">{b.corsoNome}</p>
                    <p className="text-muted-foreground">{formatDate(b.giorno)} • {b.orario}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// --- Gallery Section ---
type GalleryItem = {
  title: string;
  subtitle: string;
  icon: typeof Dumbbell;
  accent: 'yellow' | 'blue';
  photos: string[]; // primo elemento = cover
};

const galleryItems: GalleryItem[] = [
  { title: 'Sala Pesi', subtitle: '600 m² di area iso e free weight', icon: Dumbbell, accent: 'yellow', photos: [salaPesi, salaPesi2, salaPesi3] },
  { title: 'Area Cardio', subtitle: 'Tapis roulant, ellittiche, vogatori', icon: Activity, accent: 'blue', photos: [areaCardio, areaCardio2, areaCardio3] },
  { title: 'Sala Corsi', subtitle: 'Specchio a tutta parete, audio premium', icon: Music, accent: 'yellow', photos: [salaCorsi, salaCorsi2, salaCorsi3] },
  { title: 'Piscina', subtitle: '25m, 4 corsie, acqua a 28°', icon: Waves, accent: 'blue', photos: [piscina, piscina2, piscina3] },
  { title: 'Reception', subtitle: 'Aperta 7 giorni su 7', icon: MapPin, accent: 'blue', photos: [receptionImg, receptionImg2, receptionImg3] },
  { title: 'Spogliatoi', subtitle: 'Sauna, docce e armadietti', icon: Sparkles, accent: 'yellow', photos: [spogliatoi, spogliatoi2, spogliatoi3] },
];

// --- Lightbox ---
function Lightbox({ item, index, onClose, onChange }: {
  item: GalleryItem;
  index: number;
  onClose: () => void;
  onChange: (newIndex: number) => void;
}) {
  const photos = item.photos;
  const total = photos.length;
  const Icon = item.icon;

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onChange((index + 1) % total);
      else if (e.key === 'ArrowLeft') onChange((index - 1 + total) % total);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, total, onClose, onChange]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between p-4 sm:p-6 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl tracking-wider leading-none text-primary">{item.title}</h3>
            <p className="text-xs text-white/70 mt-1">{index + 1} / {total} • {item.subtitle}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Chiudi"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 flex items-center justify-center text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image area */}
      <div className="relative z-[5] w-full max-w-6xl flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="wait">
          <motion.img
            key={photos[index]}
            src={photos[index]}
            alt={`${item.title} ${index + 1}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="max-w-full max-h-[78vh] object-contain rounded-lg shadow-2xl"
          />
        </AnimatePresence>
      </div>

      {/* Prev / Next buttons */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onChange((index - 1 + total) % total); }}
            aria-label="Foto precedente"
            className="absolute left-2 sm:left-6 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 flex items-center justify-center text-white transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onChange((index + 1) % total); }}
            aria-label="Foto successiva"
            className="absolute right-2 sm:right-6 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 flex items-center justify-center text-white transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Thumbnails */}
      <div className="absolute bottom-4 inset-x-0 z-10 flex items-center justify-center gap-2 px-4" onClick={(e) => e.stopPropagation()}>
        {photos.map((p, i) => (
          <button
            key={p}
            onClick={() => onChange(i)}
            aria-label={`Vai alla foto ${i + 1}`}
            className={`relative h-14 w-20 rounded-md overflow-hidden border-2 transition-all ${
              i === index ? 'border-primary scale-105 shadow-glow' : 'border-white/20 opacity-60 hover:opacity-100'
            }`}
          >
            <img src={p} alt="" className="absolute inset-0 w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function GallerySection() {
  const [lightbox, setLightbox] = useState<{ item: GalleryItem; index: number } | null>(null);

  return (
    <section id="galleria" className="relative max-w-6xl mx-auto w-full px-4 py-12 md:py-20">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="hidden md:block text-3xl sm:text-4xl md:text-5xl tracking-wide md:tracking-widest text-center mb-3"
      >
        <span className="font-extrabold" style={{ color: 'var(--th-h2-eyebrow)' }}>La Nostra</span> <span className="font-extrabold" style={{ color: 'var(--th-h2-primary)' }}>Galleria</span>
      </motion.h2>
      <p className="hidden md:block text-center text-foreground/80 mb-10 max-w-xl mx-auto">
        Clicca su un ambiente per vedere altre foto e scoprire gli spazi nel dettaglio.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {galleryItems.map((item, i) => {
          const Icon = item.icon;
          const cover = item.photos[0];
          return (
            <motion.button
              key={item.title}
              type="button"
              onClick={() => setLightbox({ item, index: 0 })}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group relative overflow-hidden rounded-xl aspect-[4/3] cursor-pointer border border-border transition-all bg-card text-left focus:outline-none hover:[border-color:var(--th-card-hover)]"
              style={{ willChange: 'transform' }}
              aria-label={`Apri galleria ${item.title}`}
            >
              {/* Photo */}
              <img
                src={cover}
                alt={item.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Icon top-left */}
              <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 z-10">
                <Icon className="w-6 h-6" strokeWidth={2} style={{ color: 'var(--th-card-icon)' }} />
              </div>
              {/* Photo count badge top-right */}
              <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-xs font-bold text-white tracking-wider">
                {item.photos.length} foto
              </div>
              {/* Bottom label */}
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/95 via-black/65 to-transparent z-10">
                <h3 className="text-2xl tracking-wider" style={{ color: 'var(--th-card-name)' }}>{item.title}</h3>
                <p className="text-sm text-white/90 mt-1 font-medium">{item.subtitle}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            item={lightbox.item}
            index={lightbox.index}
            onClose={() => setLightbox(null)}
            onChange={(i) => setLightbox({ item: lightbox.item, index: i })}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// --- Instructors Section ---
function InstructorCard({ ist, index }: { ist: Istruttore; index: number }) {
  const corso = getCorsoById(ist.id_corso);
  const photo = instructorPhotos[ist.id];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="group relative rounded-xl border border-border overflow-hidden flex flex-col transition-all hover:[border-color:var(--th-card-hover)]"
      style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Photo */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={photo}
          alt={`${ist.nome_istruttore} — istruttore di ${corso?.nome_corso}`}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ objectPosition: 'center 25%' }}
        />
        {/* Bottom gradient for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/95 via-black/65 to-transparent" />
        {/* Bottom info block (badge + name) */}
        <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-2">
          <span
            className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur text-[10px] font-extrabold uppercase tracking-widest border border-white/15 shadow-lg"
            style={{ background: 'var(--th-instructor-badge-bg)', color: 'var(--th-instructor-badge-fg)' }}
          >
            <Dumbbell className="w-3 h-3" />
            {corso?.nome_corso ?? '—'}
          </span>
          <div>
            <h3 className="text-3xl tracking-wider drop-shadow-lg leading-none" style={{ color: 'var(--th-card-name)' }}>{ist.nome_istruttore}</h3>
            <p className="text-xs text-white/85 font-medium mt-1">Istruttore certificato</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Award className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--th-card-icon)' }} />
          <p className="text-left leading-snug">{ist.titolo_studi}</p>
        </div>

        <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {corso?.durata_minuti} min</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
          <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Certificato</span>
        </div>
      </div>
    </motion.div>
  );
}

function InstructorsSection() {
  return (
    <section id="istruttori" className="relative max-w-6xl mx-auto w-full px-4 py-12 md:py-20">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="hidden md:block text-3xl sm:text-4xl md:text-5xl tracking-wide md:tracking-widest text-center mb-3"
      >
        <span className="font-extrabold" style={{ color: 'var(--th-h2-eyebrow)' }}>I Nostri</span> <span className="font-extrabold" style={{ color: 'var(--th-h2-primary)' }}>Istruttori</span>
      </motion.h2>
      <p className="hidden md:block text-center text-foreground/80 mb-12 max-w-xl mx-auto">
        Professionisti certificati che ti guideranno passo dopo passo.
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {istruttori.map((ist, i) => (
          <InstructorCard key={ist.id} ist={ist} index={i} />
        ))}
      </div>
    </section>
  );
}

// --- Pricing Section ---
interface Piano {
  id: string;
  nome: string;
  prezzoMensile: number;
  prezzoTotale?: number;
  fatturazione: string;
  highlight?: boolean;
  benefici: string[];
  cta: string;
}

const piani: Piano[] = [
  {
    id: 'flex',
    nome: 'Flex',
    prezzoMensile: 49,
    fatturazione: 'al mese — nessun vincolo',
    benefici: [
      'Accesso sala pesi e cardio',
      '2 corsi a settimana inclusi',
      'App prenotazioni MAV GYM',
      'Spogliatoi e docce',
    ],
    cta: 'Inizia ora',
  },
  {
    id: 'plus',
    nome: 'Plus',
    prezzoMensile: 59,
    fatturazione: 'al mese — il più scelto',
    highlight: true,
    benefici: [
      'Tutto del piano Flex',
      'Corsi illimitati di gruppo',
      '1 valutazione personal trainer',
      'Accesso anticipato ai workshop',
    ],
    cta: 'Scegli Plus',
  },
  {
    id: 'elite',
    nome: 'Elite',
    prezzoMensile: 69,
    fatturazione: 'al mese — esperienza completa',
    benefici: [
      'Tutto del piano Plus',
      '4 sessioni di Personal Training',
      'Wellness day annuale',
      'Accesso ospiti (1 al mese)',
    ],
    cta: 'Diventa Elite',
  },
];

// --- Signup Modal ---
function SignupModal({ piano, onClose }: { piano: Piano; onClose: () => void }) {
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cognome.trim() || !email.includes('@')) {
      toast.error('Compila nome, cognome ed email valida');
      return;
    }
    setSending(true);
    const { error } = await supabase.from('iscrizioni').insert({
      nome: nome.trim(),
      cognome: cognome.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim() || null,
      piano: piano.id as 'flex' | 'plus' | 'elite',
      prezzo_mensile: piano.prezzoMensile,
    });
    setSending(false);
    if (error) {
      toast.error(`Errore nell'invio: ${error.message}`);
      return;
    }
    toast.success(`Iscrizione al piano ${piano.nome} registrata! Ti contatteremo a breve a ${email}`, { duration: 5000 });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.form
        onSubmit={handleSubmit}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border p-7 bg-card overflow-y-auto max-h-[90vh]"
        style={{ boxShadow: '0 25px 60px -12px rgba(15,23,42,0.25), 0 0 0 1px rgba(15,23,42,0.05)' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-secondary/10 hover:bg-secondary/20 text-foreground transition-colors"
          aria-label="Chiudi"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-2xl tracking-wider text-foreground mb-4">Iscriviti a MAV GYM</h3>

        {/* Piano scelto: pillola evidente */}
        <div className="mb-6 p-4 rounded-xl border-2 border-primary/40 bg-primary/5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Piano scelto</p>
            <p className="text-xl font-extrabold text-foreground leading-tight">{piano.nome}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{piano.fatturazione}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-0.5 justify-end">
              <span className="text-3xl font-extrabold text-primary leading-none">€{piano.prezzoMensile}</span>
              <span className="text-xs text-muted-foreground">/mese</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="signup-nome" className="block text-sm font-medium text-foreground mb-1.5">
                Nome
              </label>
              <input
                id="signup-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                autoComplete="given-name"
                placeholder="Mario"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="signup-cognome" className="block text-sm font-medium text-foreground mb-1.5">
                Cognome
              </label>
              <input
                id="signup-cognome"
                type="text"
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                required
                autoComplete="family-name"
                placeholder="Rossi"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="mario@email.com"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="signup-tel" className="block text-sm font-medium text-foreground mb-1.5">
              Telefono <span className="text-muted-foreground font-normal">(opzionale)</span>
            </label>
            <input
              id="signup-tel"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              autoComplete="tel"
              placeholder="+39 333 1234567"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="mt-6 w-full py-3 rounded-lg font-semibold text-sm tracking-wide text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}
        >
          {sending ? 'Invio in corso...' : `Conferma iscrizione`}
        </button>
        <p className="mt-3 text-xs text-muted-foreground text-center">
          I tuoi dati vengono salvati e useremo l'email per ricontattarti.
        </p>
      </motion.form>
    </motion.div>
  );
}

function PricingCard({ piano, index, onSignup }: { piano: Piano; index: number; onSignup: (piano: Piano) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={cn(
        'relative rounded-2xl border p-7 flex flex-col',
        piano.highlight ? 'border-primary' : 'border-border'
      )}
      style={{
        background: 'var(--gradient-card)',
        boxShadow: piano.highlight ? 'var(--shadow-glow)' : 'var(--shadow-card)',
      }}
    >
      {piano.highlight && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest"
          style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}
        >
          Più scelto
        </span>
      )}

      <h3 className="text-3xl tracking-wider text-foreground">{piano.nome}</h3>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-5xl font-bold text-primary leading-none">€{piano.prezzoMensile}</span>
        <span className="text-sm text-muted-foreground">/mese</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">{piano.fatturazione}</p>
      {piano.prezzoTotale && (
        <p className="text-xs text-foreground/60 mt-0.5">Totale: €{piano.prezzoTotale}</p>
      )}

      <ul className="mt-6 space-y-3 flex-1">
        {piano.benefici.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span className="text-foreground/85 leading-snug">{b}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSignup(piano)}
        className={cn(
          'mt-8 w-full py-3 rounded-lg text-sm font-bold tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]',
          piano.highlight
            ? 'text-primary-foreground hover:brightness-110'
            : 'border-2 border-foreground text-foreground hover:bg-foreground hover:text-background'
        )}
        style={piano.highlight ? { background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' } : {}}
      >
        {piano.cta}
      </button>
    </motion.div>
  );
}

function PricingSection({ onSignup }: { onSignup: (piano: Piano) => void }) {
  return (
    <section id="abbonamenti" className="relative max-w-6xl mx-auto w-full px-4 py-12 md:py-20">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-3xl sm:text-4xl md:text-5xl tracking-wide md:tracking-widest text-center mb-3"
      >
        <span className="font-extrabold" style={{ color: 'var(--th-h2-eyebrow)' }}>I Nostri</span> <span className="font-extrabold" style={{ color: 'var(--th-h2-primary)' }}>Abbonamenti</span>
      </motion.h2>
      <p className="text-center text-foreground/80 mb-12 max-w-xl mx-auto">
        Scegli il piano più adatto a te. Nessun costo nascosto, disdici quando vuoi.
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        {piani.map((piano, i) => (
          <PricingCard key={piano.id} piano={piano} index={i} onSignup={onSignup} />
        ))}
      </div>
    </section>
  );
}

// --- Testimonials Section ---
interface Testimonial {
  id: number;
  nome: string;
  ruolo: string;
  foto: string;
  stelle: number;
  quote: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    nome: 'Marco Bianchi',
    ruolo: 'Manager · Membro da 2 anni',
    foto: 'https://randomuser.me/api/portraits/men/32.jpg',
    stelle: 5,
    quote: "Da quando frequento MAV GYM ho perso 8 kg in 4 mesi. Gli istruttori sono attentissimi e l'ambiente è familiare.",
  },
  {
    id: 2,
    nome: 'Sara Rossi',
    ruolo: 'Insegnante yoga · 1 anno',
    foto: 'https://randomuser.me/api/portraits/women/44.jpg',
    stelle: 5,
    quote: 'Le lezioni di Pilates sono di altissimo livello. Alessia ti segue con cura, ogni dettaglio conta.',
  },
  {
    id: 3,
    nome: 'Luca Ferrari',
    ruolo: 'Ingegnere · 6 mesi',
    foto: 'https://randomuser.me/api/portraits/men/45.jpg',
    stelle: 5,
    quote: 'Volevo riprendere il powerlifting dopo anni di pausa. Qui ho trovato attrezzature top e una community che ti spinge davvero.',
  },
  {
    id: 4,
    nome: 'Giulia Esposito',
    ruolo: 'Marketing · 8 mesi',
    foto: 'https://randomuser.me/api/portraits/women/68.jpg',
    stelle: 5,
    quote: 'Mi sono iscritta al piano Plus per Zumba e non smetto più. Atmosfera energica, motivazione alle stelle.',
  },
];

function TestimonialCard({ t, index }: { t: Testimonial; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="rounded-2xl border border-border p-6 flex flex-col"
      style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Stelle */}
      <div className="flex items-center gap-0.5 mb-4">
        {Array.from({ length: t.stelle }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
        ))}
      </div>
      {/* Quote */}
      <p className="text-sm text-foreground/85 leading-relaxed flex-1 mb-5 italic">
        &ldquo;{t.quote}&rdquo;
      </p>
      {/* Autore */}
      <div className="flex items-center gap-3 pt-4 border-t border-border/60">
        <img
          src={t.foto}
          alt={t.nome}
          loading="lazy"
          className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/30"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{t.nome}</p>
          <p className="text-xs text-muted-foreground truncate">{t.ruolo}</p>
        </div>
      </div>
    </motion.div>
  );
}

function TestimonialsSection() {
  return (
    <section id="testimonianze" className="relative max-w-6xl mx-auto w-full px-4 py-12 md:py-20">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-3xl sm:text-4xl md:text-5xl tracking-wide md:tracking-widest text-center mb-3"
      >
        <span className="font-extrabold" style={{ color: 'var(--th-h2-eyebrow)' }}>Cosa Dicono</span> <span className="font-extrabold" style={{ color: 'var(--th-h2-primary)' }}>I Soci</span>
      </motion.h2>
      <p className="text-center text-foreground/80 mb-12 max-w-xl mx-auto">
        Le storie di chi ha scelto MAV GYM e fa parte della nostra community.
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {testimonials.map((t, i) => (
          <TestimonialCard key={t.id} t={t} index={i} />
        ))}
      </div>
    </section>
  );
}

// --- Trovaci Section ---
const orari: Array<{ giorno: string; fascia: string; chiuso?: boolean }> = [
  { giorno: 'Lunedì — Venerdì', fascia: '06:30 — 23:00' },
  { giorno: 'Sabato', fascia: '08:00 — 22:00' },
  { giorno: 'Domenica', fascia: '09:00 — 14:00' },
];

function TrovaciSection() {
  const indirizzo = 'Via Tortona 27, Milano';
  const mappaQuery = encodeURIComponent(indirizzo);

  return (
    <section id="trovaci" className="relative max-w-6xl mx-auto w-full px-4 py-12 md:py-20">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-3xl sm:text-4xl md:text-5xl tracking-wide md:tracking-widest text-center mb-3"
      >
        <span className="font-extrabold" style={{ color: 'var(--th-h2-eyebrow)' }}>Vieni a</span> <span className="font-extrabold" style={{ color: 'var(--th-h2-primary)' }}>Trovarci</span>
      </motion.h2>
      <p className="text-center text-foreground/80 mb-12 max-w-xl mx-auto">
        Siamo nel cuore di Milano. Passa quando vuoi per un tour gratuito della struttura.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mappa */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl overflow-hidden border border-border flex flex-col"
          style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}
        >
          <iframe
            src={`https://maps.google.com/maps?q=${mappaQuery}&output=embed`}
            className="w-full h-72 lg:h-[400px] border-0 grayscale-[0.2]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mappa MAV GYM"
          />
          <div className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{indirizzo}</p>
              <p className="text-xs text-muted-foreground">20144 Milano, Italia</p>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${mappaQuery}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg text-xs font-bold tracking-wide text-primary-foreground hover:brightness-110 hover:scale-105 transition-all shrink-0"
              style={{ background: 'var(--gradient-primary)' }}
            >
              Indicazioni
            </a>
          </div>
        </motion.div>

        {/* Orari + Contatti */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col gap-6"
        >
          {/* Orari */}
          <div
            className="rounded-2xl border border-border p-6"
            style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="text-2xl tracking-wider text-foreground">Orari</h3>
            </div>
            <div className="space-y-1">
              {orari.map((o) => (
                <div
                  key={o.giorno}
                  className="flex justify-between items-center py-2.5 border-b border-border/60 last:border-0"
                >
                  <span className="text-sm font-semibold text-foreground">{o.giorno}</span>
                  <span className={`text-sm font-medium ${o.chiuso ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {o.fascia}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Contatti */}
          <div
            className="rounded-2xl border border-border p-6 flex-1"
            style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-primary" />
              <h3 className="text-2xl tracking-wider text-foreground">Contatti</h3>
            </div>
            <div className="space-y-3">
              <a
                href="tel:+390289426315"
                className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium">+39 02 8942 6315</span>
              </a>
              <a
                href="mailto:info@mavgym.com"
                className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium">info@mavgym.com</span>
              </a>
              <div className="flex items-center gap-2 pt-3 border-t border-border/60">
                <span className="text-xs text-muted-foreground mr-auto">Seguici</span>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// --- Mobile Collapsible Wrapper ---
// Su mobile (< md) mostra un toggle button col titolo; su desktop il wrapper è trasparente (display:contents)
function MobileCollapsible({
  id,
  title,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="md:contents">
      <button
        onClick={onToggle}
        className="md:hidden w-full flex items-center justify-between px-4 py-5 border-t border-border bg-card hover:bg-muted transition-colors"
        aria-expanded={isOpen}
        aria-controls={`mc-${id}`}
      >
        <span
          className="text-2xl"
          style={{
            color: 'var(--th-h2-primary)',
            fontFamily: 'var(--font-heading)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontWeight: 700,
          }}
        >
          {title}
        </span>
        <ChevronDown className={cn('w-5 h-5 text-primary transition-transform duration-300', isOpen && 'rotate-180')} />
      </button>
      <div id={`mc-${id}`} className={cn(isOpen ? 'block' : 'hidden', 'md:block')}>
        {children}
      </div>
    </div>
  );
}

// --- Main Page ---
export default function Index() {
  const [entries, setEntries] = useState(() =>
    calendario.map(e => ({ ...e, posti: e.posti_disponibili }))
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingEntry, setBookingEntry] = useState<(CalendarioEntry & { posti: number }) | null>(null);
  const [signupPiano, setSignupPiano] = useState<Piano | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeSection, setActiveSection] = useState('');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  const collapsibleIds = new Set(['galleria', 'istruttori', 'chi-siamo']);
  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBookConfirm = (entryId: number, email: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry || entry.posti <= 0) return;

    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, posti: e.posti - 1 } : e));

    const corso = getCorsoById(entry.id_corso);
    setBookings(prev => [...prev, {
      id: Date.now(),
      corsoNome: corso?.nome_corso || '',
      giorno: entry.giorno,
      orario: entry.orario,
      email,
    }]);

    setBookingEntry(null);
    toast.success(
      `Prenotazione confermata! Una notifica è stata inviata a ${email}`,
      { duration: 5000 }
    );
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Track URL-bar height on mobile via visualViewport API: aggiorna --vv-bottom
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      document.documentElement.style.setProperty('--vv-bottom', `${Math.max(0, offset)}px`);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const sections = ['corsi', 'abbonamenti', 'testimonianze', 'trovaci', 'galleria', 'istruttori', 'chi-siamo', 'personale'];
    const handleScroll = () => {
      let current = '';
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) current = id;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    if (collapsibleIds.has(id)) {
      setOpenSections(prev => prev.has(id) ? prev : new Set([...prev, id]));
    }
    requestAnimationFrame(() => {
      smoothScrollToElement(id, -64);
    });
  };

  const navItems = [
    { label: 'Lezioni', target: 'corsi' },
    { label: 'Abbonamenti', target: 'abbonamenti' },
    { label: 'Testimonianze', target: 'testimonianze' },
    { label: 'Trovaci', target: 'trovaci' },
    { label: 'Galleria', target: 'galleria' },
    { label: 'Istruttori', target: 'istruttori' },
    { label: 'Chi Siamo', target: 'chi-siamo' },
    { label: 'Area Personale', target: 'personale' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 text-2xl font-extrabold tracking-wider text-primary hover:brightness-110 transition leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
            <Dumbbell className="w-6 h-6 text-primary" strokeWidth={2.5} />
            MAV GYM
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
              <button
                key={item.target}
                onClick={() => scrollTo(item.target)}
                className={`relative text-sm font-semibold tracking-wide transition-colors py-1 ${
                  activeSection === item.target ? 'text-primary' : 'text-foreground/70 hover:text-primary'
                }`}
              >
                {item.label}
                {activeSection === item.target && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          {/* CTA + Mobile Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollTo('corsi')}
              className="hidden md:block px-5 py-2 rounded-lg text-sm font-bold tracking-wide text-primary-foreground hover:brightness-110 transition-all"
              style={{ background: 'var(--gradient-primary)' }}
            >
              Prenota ora
            </button>

            {/* Mobile hamburger */}
            <div className="md:hidden" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                aria-label="Menu"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-16 right-4 w-56 rounded-xl border border-border bg-card p-2 flex flex-col gap-1"
                    style={{ boxShadow: 'var(--shadow-card)' }}
                  >
                    {navItems.map(item => (
                      <button
                        key={item.target}
                        onClick={() => scrollTo(item.target)}
                        className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          activeSection === item.target
                            ? 'text-primary bg-primary/10'
                            : 'text-foreground hover:bg-secondary'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                    <button
                      onClick={() => scrollTo('corsi')}
                      className="mt-1 px-4 py-2.5 rounded-lg text-sm font-bold text-primary-foreground text-center"
                      style={{ background: 'var(--gradient-primary)' }}
                    >
                      Prenota ora
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Header - Hero (l'immagine bg è globale, fissa per tutto il sito; qui solo overlay scuro per il testo bianco) */}
      <header
        className="relative min-h-[80vh] flex items-center justify-center text-center pt-24 pb-12"
        aria-label="MAV GYM — sala spinning"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/0" />
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 px-4 w-full max-w-5xl"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.15, duration: 0.55, type: 'spring', stiffness: 180, damping: 14 }}
            className="flex items-center justify-center mb-6"
          >
            <Dumbbell className="w-20 h-20 md:w-24 md:h-24 text-primary" strokeWidth={2} />
          </motion.div>
          <h1 className="text-6xl sm:text-7xl md:text-9xl tracking-[0.04em] font-extrabold text-primary drop-shadow-lg leading-[0.95]">
            MAV GYM
          </h1>
          <p className="mt-6 text-3xl md:text-5xl font-bold text-white tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>
            Allenati. <span style={{ color: 'var(--th-hero-emphasis)' }}>Progredisci.</span> Appartieni.
          </p>
          <p className="mt-4 text-base md:text-lg text-white/70 font-medium tracking-wide max-w-md mx-auto">
            Il tuo percorso fitness inizia qui
          </p>
        </motion.div>
      </header>

      {/* Corsi / Lezioni - priorità #1 (prenotazione) */}
      <main id="corsi" className="relative flex-1 w-full py-12">
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl tracking-wide md:tracking-widest text-center mb-3">
            <span className="font-extrabold" style={{ color: 'var(--th-h2-eyebrow)' }}>I Nostri</span> <span className="font-extrabold" style={{ color: 'var(--th-h2-primary)' }}>Corsi</span>
          </h2>
          <p className="text-center text-foreground/80 mb-10 max-w-xl mx-auto">
            Scegli la disciplina, poi prenota la data che preferisci.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {corsi.map((corso) => (
              <CourseCard key={corso.id} corso={corso} entries={entries} onBook={setBookingEntry} />
            ))}
          </div>
        </div>
      </main>

      {/* Abbonamenti - priorità #2 (acquisto) */}
      <PricingSection onSignup={setSignupPiano} />

      {/* Testimonianze - social proof */}
      <TestimonialsSection />

      {/* Trovaci - info pratica */}
      <TrovaciSection />

      {/* Galleria - collassabile su mobile */}
      <MobileCollapsible
        id="galleria"
        title="Galleria"
        isOpen={openSections.has('galleria')}
        onToggle={() => toggleSection('galleria')}
      >
        <GallerySection />
      </MobileCollapsible>

      {/* Istruttori - collassabile su mobile */}
      <MobileCollapsible
        id="istruttori"
        title="Istruttori"
        isOpen={openSections.has('istruttori')}
        onToggle={() => toggleSection('istruttori')}
      >
        <InstructorsSection />
      </MobileCollapsible>

      {/* Chi siamo - collassabile su mobile, in fondo (storia, meno prioritaria) */}
      <MobileCollapsible
        id="chi-siamo"
        title="Chi Siamo"
        isOpen={openSections.has('chi-siamo')}
        onToggle={() => toggleSection('chi-siamo')}
      >
        <section id="chi-siamo" className="relative max-w-full w-full px-0 py-10 md:py-16">
          <div className="relative z-10 max-w-4xl mx-auto px-4">
            <h2 className="hidden md:block text-4xl tracking-widest text-center mb-8 font-extrabold" style={{ color: 'var(--th-h2-primary)' }}>Chi Siamo</h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-xl border border-border p-8 text-muted-foreground leading-relaxed space-y-4"
              style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}
            >
              <p>
                <strong className="text-foreground">MAV GYM</strong> nasce nel 2018 dalla passione di tre amici – Marco, Andrea e Valentina – uniti dal sogno di creare uno spazio dove il fitness incontra la comunità. Situata nel cuore di Milano, in Via Tortona 27, la palestra è diventata in pochi anni un punto di riferimento per atleti e appassionati di ogni livello.
              </p>
              <p>
                Dai primi mesi con pochi attrezzi e tanta determinazione, MAV GYM si è evoluta fino a offrire oltre 5 discipline – dal Powerlifting al Nuoto – con istruttori certificati e strutture all'avanguardia. La nostra filosofia è semplice: ogni persona merita un ambiente accogliente, professionale e motivante per raggiungere i propri obiettivi.
              </p>
              <p>
                Oggi MAV GYM conta centinaia di iscritti e una community attiva che va ben oltre l'allenamento. Organizziamo eventi, workshop e sfide mensili perché crediamo che il benessere sia un percorso da vivere insieme.
              </p>
            </motion.div>
          </div>
        </section>
      </MobileCollapsible>

      {/* Sezione Personale */}
      <section id="personale" className="max-w-4xl mx-auto w-full px-4 py-10 md:py-16">
        <h2 className="text-3xl sm:text-4xl tracking-wide md:tracking-widest text-center mb-8 font-extrabold" style={{ color: 'var(--th-h2-primary)' }}>Il Tuo Spazio</h2>
        <PersonalSection bookings={bookings} />
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16" style={{ background: 'var(--gradient-card)' }}>
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 hover:brightness-110 transition"
            aria-label="Torna in cima"
          >
            <Dumbbell className="w-5 h-5 text-primary" strokeWidth={2.5} />
            <span className="text-xl font-extrabold tracking-wider text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
              MAV GYM
            </span>
          </button>

          {/* Social */}
          <div className="flex items-center gap-2">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:text-primary hover:border-primary transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:text-primary hover:border-primary transition-colors"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Strip legale */}
        <div className="border-t border-border/60">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>© 2026 MAV GYM · P.IVA IT09876543210</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <span className="text-border">·</span>
              <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
              <span className="text-border">·</span>
              <a href="#" className="hover:text-primary transition-colors">Termini</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Spacer mobile: copre l'altezza della sticky CTA inclusa la URL bar mobile */}
      <div
        className="md:hidden"
        aria-hidden="true"
        style={{ height: 'calc(var(--vv-bottom, 0px) + 5rem + env(safe-area-inset-bottom))' }}
      />

      {/* Sticky CTA mobile — sempre visibile, porta direttamente alla prenotazione.
          bottom = altezza URL bar browser (var --vv-bottom) + safe-area home indicator iOS */}
      <div
        className="md:hidden fixed left-0 right-0 z-40 pointer-events-none px-3"
        style={{
          bottom: 'calc(var(--vv-bottom, 0px) + max(0.75rem, env(safe-area-inset-bottom)))',
        }}
      >
        <button
          onClick={() => scrollTo('corsi')}
          className="pointer-events-auto w-full py-3.5 rounded-full text-sm font-bold tracking-wide text-primary-foreground hover:brightness-110 transition-all"
          style={{
            background: 'var(--gradient-primary)',
            boxShadow: '0 10px 30px -5px hsl(354 78% 56% / 0.5), 0 0 0 1px hsl(354 78% 56% / 0.3)',
          }}
        >
          Prenota una lezione
        </button>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {bookingEntry && (
          <BookingModal
            entry={bookingEntry}
            onClose={() => setBookingEntry(null)}
            onConfirm={handleBookConfirm}
          />
        )}
      </AnimatePresence>

      {/* Signup Modal — abbonamento piano */}
      <AnimatePresence>
        {signupPiano && (
          <SignupModal piano={signupPiano} onClose={() => setSignupPiano(null)} />
        )}
      </AnimatePresence>

      {/* Parallax scroll effect */}
      <ParallaxEffect />
    </div>
  );
}

// Parallax scroll handler
function ParallaxEffect() {
  useEffect(() => {
    const handleScroll = () => {
      const images = document.querySelectorAll<HTMLImageElement>('[data-parallax]');
      images.forEach(img => {
        const rect = img.parentElement?.getBoundingClientRect();
        if (!rect) return;
        const speed = 0.3;
        const yPos = -(rect.top * speed);
        img.style.transform = `translateY(${yPos}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return null;
}