import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'BengalHomestay <notifications@bengalihomestay.com>';

// ── Email to HOST when a guest sends an inquiry ───────────────────────────
export async function notifyHostNewInquiry({
  hostEmail,
  hostName,
  guestName,
  guestMobile,
  homestayName,
  checkIn,
  checkOut,
  guests,
  message,
  dashboardUrl,
}: {
  hostEmail:    string;
  hostName:     string;
  guestName:    string;
  guestMobile:  string;
  homestayName: string;
  checkIn:      string;
  checkOut:     string;
  guests:       number;
  message?:     string | null;
  dashboardUrl: string;
}) {
  if (!process.env.RESEND_API_KEY || !hostEmail) return;

  await resend.emails.send({
    from:    FROM,
    to:      hostEmail,
    subject: `New inquiry for ${homestayName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#166534">New Guest Inquiry — ${homestayName}</h2>
        <p>Hi ${hostName},</p>
        <p>You have received a new inquiry from <strong>${guestName}</strong> (${guestMobile}).</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #e5e7eb;color:#6b7280">Check-in</td><td style="padding:8px;border:1px solid #e5e7eb">${checkIn}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;color:#6b7280">Check-out</td><td style="padding:8px;border:1px solid #e5e7eb">${checkOut}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;color:#6b7280">Guests</td><td style="padding:8px;border:1px solid #e5e7eb">${guests}</td></tr>
          ${message ? `<tr><td style="padding:8px;border:1px solid #e5e7eb;color:#6b7280">Message</td><td style="padding:8px;border:1px solid #e5e7eb">${message}</td></tr>` : ''}
        </table>
        <a href="${dashboardUrl}" style="display:inline-block;background:#166534;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          View Inquiry in Dashboard
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">BengalHomestay · bengalihomestay.com</p>
      </div>
    `,
  });
}

// ── Email to GUEST when host confirms or declines ────────────────────────
export async function notifyGuestBookingUpdate({
  guestEmail,
  guestName,
  homestayName,
  hostName,
  status,
  checkIn,
  checkOut,
  bookingsUrl,
}: {
  guestEmail:   string;
  guestName:    string;
  homestayName: string;
  hostName:     string;
  status:       'confirmed' | 'cancelled';
  checkIn:      string;
  checkOut:     string;
  bookingsUrl:  string;
}) {
  if (!process.env.RESEND_API_KEY || !guestEmail) return;

  const isConfirmed = status === 'confirmed';

  await resend.emails.send({
    from:    FROM,
    to:      guestEmail,
    subject: isConfirmed
      ? `Your stay at ${homestayName} is confirmed!`
      : `Update on your inquiry for ${homestayName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:${isConfirmed ? '#166534' : '#991b1b'}">
          ${isConfirmed ? '✅ Booking Confirmed' : '❌ Inquiry Declined'}
        </h2>
        <p>Hi ${guestName},</p>
        <p>
          ${isConfirmed
            ? `Great news! <strong>${hostName}</strong> has confirmed your stay at <strong>${homestayName}</strong>.`
            : `Unfortunately, <strong>${hostName}</strong> is unable to accommodate your request at <strong>${homestayName}</strong> for the selected dates.`
          }
        </p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #e5e7eb;color:#6b7280">Check-in</td><td style="padding:8px;border:1px solid #e5e7eb">${checkIn}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;color:#6b7280">Check-out</td><td style="padding:8px;border:1px solid #e5e7eb">${checkOut}</td></tr>
        </table>
        ${!isConfirmed ? '<p>You can search for other available homestays on BengalHomestay.</p>' : ''}
        <a href="${bookingsUrl}" style="display:inline-block;background:#166534;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          View My Bookings
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">BengalHomestay · bengalihomestay.com</p>
      </div>
    `,
  });
}
