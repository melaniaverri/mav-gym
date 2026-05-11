export interface BookingEmailPayload {
  email: string;
  courseName: string;
  instructorName: string;
  date: string;
  time: string;
  durationMinutes: number;
}

export async function sendBookingEmail(payload: BookingEmailPayload) {
  const response = await fetch('/.netlify/functions/send-booking-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Email prenotazione non inviata');
  }

  return data;
}
