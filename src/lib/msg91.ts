export async function sendOTP(mobile: string, otp: string): Promise<boolean> {
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
    return data.type === 'success';
  } catch (err) {
    console.error('[MSG91 sendOTP]', err);
    return false;
  }
}
