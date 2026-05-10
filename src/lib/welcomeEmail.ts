export interface WelcomeEmailPayload {
  nome: string;
  cognome: string;
  email: string;
  telefono: string | null;
  piano: 'flex' | 'plus' | 'elite';
  pianoNome: string;
  prezzoMensile: number;
  fatturazione: string;
}

export async function sendWelcomeEmail(payload: WelcomeEmailPayload) {
  const response = await fetch('/.netlify/functions/send-welcome-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Email non inviata');
  }

  return data;
}
