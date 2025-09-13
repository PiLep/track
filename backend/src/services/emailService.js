const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
      // For development with Mailpit, ignore TLS errors
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@saas-app.com',
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}:`, result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    const subject = 'Bienvenue sur Track !';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Bienvenue sur Track, ${user.full_name || user.username} !</h1>
        <p>Votre compte a été créé avec succès sur <strong>Track</strong>.</p>
        <p>Vous pouvez maintenant vous connecter avec votre email : <strong>${user.email}</strong></p>
        <p>Merci de nous avoir rejoint !</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          Cet email a été envoyé automatiquement par Track, merci de ne pas y répondre.
        </p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const subject = 'Track - Réinitialisation de mot de passe';
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Réinitialisation de mot de passe</h1>
        <p>Bonjour ${user.full_name || user.username},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe sur <strong>Track</strong>.</p>
        <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p>Ce lien est valide pendant 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          Cet email a été envoyé automatiquement par Track, merci de ne pas y répondre.
        </p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendWorkspaceInvitationEmail(invitedEmail, inviterName, workspaceName, inviteToken) {
    const subject = `Track - Invitation à rejoindre ${workspaceName}`;
    const onboardingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/onboarding?token=${inviteToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 1.8rem; font-weight: bold;">Track</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0.5rem 0 0 0; font-size: 0.9rem;">Gestion de projets et suivi d'équipe</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 2rem;">
          <h2 style="color: #333; margin: 0 0 1rem 0; font-size: 1.5rem;">Invitation à rejoindre un workspace</h2>
          <p style="color: #555; line-height: 1.6;">Bonjour,</p>
          <p style="color: #555; line-height: 1.6;"><strong>${inviterName}</strong> vous invite à rejoindre le workspace <strong style="color: #667eea;">${workspaceName}</strong> sur Track.</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
            <p style="color: #555; line-height: 1.6; margin: 0 0 1rem 0;">
              ✨ <strong>Track</strong> vous permet de :
            </p>
            <ul style="color: #666; margin: 0; padding-left: 1.2rem; line-height: 1.8;">
              <li>Gérer vos projets en équipe</li>
              <li>Suivre vos tâches et issues</li>
              <li>Collaborer efficacement</li>
            </ul>
          </div>
          
          <p style="color: #555; line-height: 1.6;">Cliquez sur le bouton ci-dessous pour créer votre compte et rejoindre l'équipe :</p>
          
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${onboardingUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
              🚀 Rejoindre ${workspaceName}
            </a>
          </div>
          
          <p style="color: #888; font-size: 0.9rem; line-height: 1.5;">
            Si vous ne souhaitez pas rejoindre ce workspace, vous pouvez ignorer cet email en toute sécurité.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 1.5rem; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #666; font-size: 0.8rem; margin: 0;">
            Cet email a été envoyé automatiquement par <strong>Track</strong><br>
            Workspace: <strong>${workspaceName}</strong> • Invité par: <strong>${inviterName}</strong>
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(invitedEmail, subject, html);
  }

  // Utility method to strip HTML tags for text version
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Test email connection
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
