import nodemailer from 'nodemailer';
import { logger } from './logger.util';

/**
 * Email service using Nodemailer
 */
class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Connection pooling
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 10,
    });
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      return await this.transporter.verify();
    } catch (error) {
      logger.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    template: string;
    data?: Record<string, any>;
    attachments?: nodemailer.Attachment[];
  }): Promise<string> {
    try {
      // Render email template
      const html = this.renderTemplate(options.template, options.data || {});

      const mailOptions: nodemailer.SendMailOptions = {
        from: process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent', {
        to: options.to,
        subject: options.subject,
        messageId: result.messageId,
      });

      return result.messageId || '';
    } catch (error) {
      logger.error('Email send error:', { error, options });
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(email: string, name: string, token: string): Promise<string> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    return this.sendEmail({
      to: email,
      subject: 'Verify your SmartInsight account',
      template: 'verification',
      data: {
        name,
        verificationUrl,
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<string> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    return this.sendEmail({
      to: email,
      subject: 'Reset your SmartInsight password',
      template: 'password-reset',
      data: {
        name,
        resetUrl,
        expiresIn: '24 hours',
      },
    });
  }

  /**
   * Send notification to admin
   */
  async sendAdminNotification(subject: string, message: string): Promise<string> {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    return this.sendEmail({
      to: adminEmail,
      subject: `[ADMIN] ${subject}`,
      template: 'admin-notification',
      data: {
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Simple template renderer (extend with proper template engine)
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    // This is simplified - replace with proper Handlebars/EJS template engine
    const templates: Record<string, string> = {
      verification: `
        <!DOCTYPE html>
        <html>
          <head><title>Verify Email</title></head>
          <body>
            <h1>Welcome to SmartInsight!</h1>
            <p>Hi ${data.name},</p>
            <p>Click below to verify your email:</p>
            <a href="${data.verificationUrl}">Verify Email</a>
            <p>This link expires in 24 hours.</p>
          </body>
        </html>
      `,
      'password-reset': `
        <!DOCTYPE html>
        <html>
          <head><title>Reset Password</title></head>
          <body>
            <h1>Password Reset Request</h1>
            <p>Hi ${data.name},</p>
            <p>Click below to reset your password:</p>
            <a href="${data.resetUrl}">Reset Password</a>
            <p>This link expires in ${data.expiresIn}.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </body>
        </html>
      `,
      'admin-notification': `
        <!DOCTYPE html>
        <html>
          <head><title>Admin Notification</title></head>
          <body>
            <h1>Admin Notification</h1>
            <p>${data.message}</p>
            <small>Sent at: ${data.timestamp}</small>
          </body>
        </html>
      `,
    };

    return templates[template] || `<p>${JSON.stringify(data)}</p>`;
  }

  /**
   * Close transporter
   */
  async close(): Promise<void> {
    if (this.transporter) {
      await this.transporter.close();
    }
  }
}

export const emailService = new EmailService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await emailService.close();
});
