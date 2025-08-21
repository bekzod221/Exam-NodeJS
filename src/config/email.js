import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const createTransporter = () => {
  // Prefer explicit SMTP config if provided; fallback to Gmail service
  const hasSmtpHost = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
  const hasBasicCreds = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

  if (!hasSmtpHost && !hasBasicCreds) {
    console.warn('Email credentials not configured. Email functionality will be disabled.');
    return null;
  }

  if (hasSmtpHost) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      pool: true,
      auth: hasBasicCreds
        ? {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        : undefined,
      tls: { rejectUnauthorized: false }
    });
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });
};

const transporter = createTransporter();

export const sendVerificationCode = async (email, code) => {
  if (!transporter) {
    console.error('Email transporter not configured');
    return false;
  }

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME || 'Avto Salon'} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Avto Salon - Autentifikatsiya kodi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1; text-align: center;">Avto Salon</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-bottom: 15px;">Autentifikatsiya kodi</h3>
          <p style="color: #64748b; margin-bottom: 20px;">Sizning autentifikatsiya kodingiz:</p>
          <div style="background: #6366f1; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 5px;">
            ${code}
          </div>
          <p style="color: #64748b; margin-top: 20px; font-size: 14px;">
            Bu kod 10 daqiqa davomida amal qiladi. Agar siz bu so'rovni qilmagan bo'lsangiz, uni e'tiborsiz qoldiring.
          </p>
        </div>
        <p style="color: #94a3b8; text-align: center; font-size: 12px;">
          © ${new Date().getFullYear()} Avto Salon. Barcha huquqlar himoyalangan.
        </p>
      </div>
    `
  };

  try {
    // Verifies connection configuration. If provider blocks verify, continue to send.
    try { await transporter.verify(); } catch (_) {}
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    return false;
  }
};

export const sendOrderConfirmation = async (email, orderDetails) => {
  if (!transporter) {
    console.error('Email transporter not configured');
    return false;
  }

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME || 'Avto Salon'} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Avto Salon - Buyurtma tasdiqlandi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1; text-align: center;">Avto Salon</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-bottom: 15px;">Buyurtma tasdiqlandi</h3>
          <p style="color: #64748b; margin-bottom: 20px;">Hurmatli mijoz, sizning buyurtmangiz muvaffaqiyatli qabul qilindi:</p>
          <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #6366f1;">
            <p><strong>Mashina:</strong> ${orderDetails.car}</p>
            <p><strong>Narxi:</strong> ${orderDetails.price}</p>
            <p><strong>Buyurtma raqami:</strong> ${orderDetails.orderId}</p>
          </div>
          <p style="color: #64748b; margin-top: 20px; font-size: 14px;">
            Tez orada sizga aloqaga chiqamiz.
          </p>
        </div>
        <p style="color: #94a3b8; text-align: center; font-size: 12px;">
          © ${new Date().getFullYear()} Avto Salon. Barcha huquqlar himoyalangan.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Order confirmation email error:', error.message);
    return false;
  }
};

export const sendPasswordResetEmail = async (email, resetCode) => {
  if (!transporter) {
    console.error('Email transporter not configured');
    return false;
  }

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME || 'Avto Salon'} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Avto Salon - Parolni tiklash',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1; text-align: center;">Avto Salon</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-bottom: 15px;">Parolni tiklash</h3>
          <p style="color: #64748b; margin-bottom: 20px;">Parolni tiklash uchun quyidagi kodni kiriting:</p>
          <div style="background: #ef4444; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 5px;">
            ${resetCode}
          </div>
          <p style="color: #64748b; margin-top: 20px; font-size: 14px;">
            Bu kod 10 daqiqa davomida amal qiladi. Agar siz bu so'rovni qilmagan bo'lsangiz, uni e'tiborsiz qoldiring.
          </p>
        </div>
        <p style="color: #94a3b8; text-align: center; font-size: 12px;">
          © ${new Date().getFullYear()} Avto Salon. Barcha huquqlar himoyalangan.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Password reset email error:', error.message);
    return false;
  }
};

export default transporter; 