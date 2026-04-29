import { Resend } from 'resend';

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set. Emails won't be sent.");
    return null;
  }
  return new Resend(apiKey);
};

const FROM_EMAIL = 'Mirrorly <no-reply@mirrorly.app>';

export const sendWelcomeEmail = async (email: string, name: string) => {
  const resend = getResend();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to Mirrorly! 🚀',
      html: `
        <h2>Hi ${name}, welcome to Mirrorly!</h2>
        <p>We're thrilled to have you on board. You can now start transforming your boutique into a virtual try-on experience.</p>
        <p><strong>Next steps:</strong></p>
        <ol>
          <li>Complete your merchant profile details.</li>
          <li>Upload your first garment with a high-quality image.</li>
          <li>Print the QR code and display it on your storefront!</li>
        </ol>
        <p>If you need any help, just hit reply!</p>
      `,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
};

export const sendLowCreditAlert = async (email: string, currentCredits: number) => {
  const resend = getResend();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your Mirrorly Credits are running low ⚠️',
      html: `
        <h2>Action Required: Low Credits</h2>
        <p>Your current balance is down to <strong>${currentCredits} credits</strong>.</p>
        <p>To ensure your customers don't experience interruptions while trying on your garments, please top up your account or upgrade your subscription plan.</p>
        <p>Visit your dashboard to add more credits.</p>
      `,
    });
    console.log(`Low credit email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send low credit email:', error);
  }
};
