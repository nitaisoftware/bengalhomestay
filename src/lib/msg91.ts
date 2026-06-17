export async function sendOTP(mobile: string, otp: string): Promise<boolean> {
  // Try Fast2SMS first (works without DLT for OTP route)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const res = await fetch(
        `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&variables_values=${otp}&route=otp&numbers=${mobile}`,
        { method: 'GET' }
      );
      const data = await res.json();
      console.log('[Fast2SMS]', data);
      if (data.return === true) return true;
    } catch (err) {
      console.error('[Fast2SMS sendOTP]', err);
    }
  }

  // Fallback to MSG91 (requires DLT registration)
  if (process.env.MSG91_API_KEY) {
    try {
      const res = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': process.env.MSG91_API_KEY!,
        },
        body: JSON.stringify({
          template_id: process.env.MSG91_TEMPLATE_ID,
          mobile: `91${mobile}`,
          otp,
        }),
      });
      const data = await res.json();
      console.log('[MSG91]', data);
      return data.type === 'success';
    } catch (err) {
      console.error('[MSG91 sendOTP]', err);
    }
  }

  return false;
}
