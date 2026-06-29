import { Resend } from 'resend';

export const sendPasswordResetEmail = async (toEmail: string, token: string) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const resetLink = `gathering://reset-password?token=${token}`;

    await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: toEmail,
        subject: 'Reset your Gathering password',
        html: `<p>Tap the link below to reset your password. It expires in 1 hour.</p>
               <a href="${resetLink}">Reset password</a>
               <p>If you didn't request this, you can ignore this email.</p>`,
    });
}
