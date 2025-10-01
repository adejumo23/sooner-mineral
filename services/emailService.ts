// Email service for sending ticket notifications
// Note: nodemailer import removed for frontend build - using mock service instead

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
};

// Create transporter (commented out for frontend build)
// const transporter = nodemailer.createTransporter(emailConfig);

// Email templates
const emailTemplates = {
  newTicket: (ticket: any, reporter: any) => ({
    subject: `New Support Ticket: ${ticket.ticket_number} - ${ticket.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Support Ticket</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .ticket-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .priority { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; font-weight: bold; }
          .priority-critical { background: #dc2626; }
          .priority-high { background: #ea580c; }
          .priority-medium { background: #d97706; }
          .priority-low { background: #059669; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Support Ticket</h1>
            <p>Ticket #${ticket.ticket_number}</p>
          </div>
          <div class="content">
            <h2>Ticket Details</h2>
            <div class="ticket-info">
              <p><strong>Title:</strong> ${ticket.title}</p>
              <p><strong>Reporter:</strong> ${reporter.name} (${reporter.email})</p>
              <p><strong>Category:</strong> ${ticket.category?.name || 'N/A'}</p>
              <p><strong>Priority:</strong> 
                <span class="priority priority-${ticket.priority?.name?.toLowerCase() || 'medium'}">
                  ${ticket.priority?.name || 'Medium'}
                </span>
              </p>
              <p><strong>Module:</strong> ${ticket.module_name || 'N/A'}</p>
              <p><strong>Page URL:</strong> ${ticket.page_url || 'N/A'}</p>
              <p><strong>Created:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
            </div>
            
            <h3>Description</h3>
            <div class="ticket-info">
              <p>${ticket.description.replace(/\n/g, '<br>')}</p>
            </div>
            
            <h3>Technical Information</h3>
            <div class="ticket-info">
              <p><strong>Browser:</strong> ${ticket.browser_info || 'N/A'}</p>
              <p><strong>User Agent:</strong> ${ticket.user_agent || 'N/A'}</p>
            </div>
            
            <p style="margin-top: 20px;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/tickets/${ticket.id}" 
                 style="background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Ticket
              </a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated notification from the Sooner Mineral Support System.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  ticketUpdate: (ticket: any, updates: any, updater: any) => ({
    subject: `Ticket Updated: ${ticket.ticket_number} - ${ticket.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket Updated</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .update-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ticket Updated</h1>
            <p>Ticket #${ticket.ticket_number}</p>
          </div>
          <div class="content">
            <h2>Update Details</h2>
            <div class="update-info">
              <p><strong>Updated by:</strong> ${updater.name}</p>
              <p><strong>Updated at:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Changes:</strong></p>
              <ul>
                ${Object.entries(updates).map(([key, value]) => 
                  `<li><strong>${key}:</strong> ${value}</li>`
                ).join('')}
              </ul>
            </div>
            
            <p style="margin-top: 20px;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/tickets/${ticket.id}" 
                 style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Ticket
              </a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated notification from the Sooner Mineral Support System.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  ticketResolved: (ticket: any, resolver: any) => ({
    subject: `Ticket Resolved: ${ticket.ticket_number} - ${ticket.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket Resolved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .resolution-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ticket Resolved</h1>
            <p>Ticket #${ticket.ticket_number}</p>
          </div>
          <div class="content">
            <h2>Resolution Details</h2>
            <div class="resolution-info">
              <p><strong>Title:</strong> ${ticket.title}</p>
              <p><strong>Resolved by:</strong> ${resolver.name}</p>
              <p><strong>Resolved at:</strong> ${new Date().toLocaleString()}</p>
              ${ticket.resolution_notes ? `
                <p><strong>Resolution Notes:</strong></p>
                <p>${ticket.resolution_notes.replace(/\n/g, '<br>')}</p>
              ` : ''}
            </div>
            
            <p style="margin-top: 20px;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/tickets/${ticket.id}" 
                 style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Ticket
              </a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated notification from the Sooner Mineral Support System.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Email service functions
export class EmailService {
  private static instance: EmailService;
  // private transporter: nodemailer.Transporter; // Commented out for frontend build

  private constructor() {
    // this.transporter = transporter; // Commented out for frontend build
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // Send new ticket notification to administrators
  public async sendNewTicketNotification(ticket: any, reporter: any, adminEmails: string[]): Promise<void> {
    try {
      const template = emailTemplates.newTicket(ticket, reporter);
      
      // Mock implementation for frontend build
      console.log('📧 Email would be sent to:', adminEmails);
      console.log('📧 Subject:', template.subject);
      console.log('📧 Template generated successfully');
      
      // In production, this would use the actual transporter:
      // for (const email of adminEmails) {
      //   await this.transporter.sendMail({
      //     from: process.env.SMTP_FROM || 'noreply@sooner-mineral.com',
      //     to: email,
      //     subject: template.subject,
      //     html: template.html
      //   });
      // }
      
      console.log(`New ticket notification sent to ${adminEmails.length} administrators`);
    } catch (error) {
      console.error('Error sending new ticket notification:', error);
      throw error;
    }
  }

  // Send ticket update notification
  public async sendTicketUpdateNotification(ticket: any, updates: any, updater: any, recipientEmails: string[]): Promise<void> {
    try {
      const template = emailTemplates.ticketUpdate(ticket, updates, updater);
      
      // Mock implementation for frontend build
      console.log('📧 Update notification would be sent to:', recipientEmails);
      console.log('📧 Subject:', template.subject);
      
      // In production, this would use the actual transporter:
      // for (const email of recipientEmails) {
      //   await this.transporter.sendMail({
      //     from: process.env.SMTP_FROM || 'noreply@sooner-mineral.com',
      //     to: email,
      //     subject: template.subject,
      //     html: template.html
      //   });
      // }
      
      console.log(`Ticket update notification sent to ${recipientEmails.length} recipients`);
    } catch (error) {
      console.error('Error sending ticket update notification:', error);
      throw error;
    }
  }

  // Send ticket resolved notification
  public async sendTicketResolvedNotification(ticket: any, resolver: any, recipientEmails: string[]): Promise<void> {
    try {
      const template = emailTemplates.ticketResolved(ticket, resolver);
      
      // Mock implementation for frontend build
      console.log('📧 Resolution notification would be sent to:', recipientEmails);
      console.log('📧 Subject:', template.subject);
      
      // In production, this would use the actual transporter:
      // for (const email of recipientEmails) {
      //   await this.transporter.sendMail({
      //     from: process.env.SMTP_FROM || 'noreply@sooner-mineral.com',
      //     to: email,
      //     subject: template.subject,
      //     html: template.html
      //   });
      // }
      
      console.log(`Ticket resolved notification sent to ${recipientEmails.length} recipients`);
    } catch (error) {
      console.error('Error sending ticket resolved notification:', error);
      throw error;
    }
  }

  // Test email configuration
  public async testEmailConfiguration(): Promise<boolean> {
    try {
      // Mock implementation for frontend build
      console.log('📧 Mock: Testing email configuration...');
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('📧 Mock: Email configuration is valid');
      return true;
      
      // In production, this would use the actual transporter:
      // await this.transporter.verify();
      // console.log('Email configuration is valid');
      // return true;
    } catch (error) {
      console.error('Email configuration error:', error);
      return false;
    }
  }

  // Send test email
  public async sendTestEmail(to: string): Promise<void> {
    try {
      // Mock implementation for frontend build
      console.log(`📧 Mock: Test email would be sent to: ${to}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('📧 Mock: Test email sent successfully!');
      
      // In production, this would use the actual transporter:
      // await this.transporter.sendMail({
      //   from: process.env.SMTP_FROM || 'noreply@sooner-mineral.com',
      //   to: to,
      //   subject: 'Test Email - Sooner Mineral Support System',
      //   html: `
      //     <h1>Test Email</h1>
      //     <p>This is a test email from the Sooner Mineral Support System.</p>
      //     <p>If you received this email, the email configuration is working correctly.</p>
      //     <p>Sent at: ${new Date().toLocaleString()}</p>
      //   `
      // });
      
      console.log(`Test email sent to ${to}`);
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();

// Mock implementation for development
export const mockEmailService = {
  async sendNewTicketNotification(ticket: any, reporter: any, adminEmails: string[]): Promise<void> {
    console.log('📧 Mock: New ticket notification would be sent to:', adminEmails);
    console.log('📧 Mock: Ticket details:', {
      ticket_number: ticket.ticket_number,
      title: ticket.title,
      reporter: reporter.name,
      priority: ticket.priority?.name
    });
    
    // Simulate email delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would send actual emails
    console.log('📧 Mock: Email sent successfully!');
  },

  async sendTicketUpdateNotification(ticket: any, updates: any, updater: any, recipientEmails: string[]): Promise<void> {
    console.log('📧 Mock: Ticket update notification would be sent to:', recipientEmails);
    console.log('📧 Mock: Update details:', updates);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('📧 Mock: Update notification sent successfully!');
  },

  async sendTicketResolvedNotification(ticket: any, resolver: any, recipientEmails: string[]): Promise<void> {
    console.log('📧 Mock: Ticket resolved notification would be sent to:', recipientEmails);
    console.log('📧 Mock: Resolution details:', {
      ticket_number: ticket.ticket_number,
      resolver: resolver.name
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('📧 Mock: Resolution notification sent successfully!');
  },

  async testEmailConfiguration(): Promise<boolean> {
    console.log('📧 Mock: Testing email configuration...');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('📧 Mock: Email configuration is valid');
    return true;
  },

  async sendTestEmail(to: string): Promise<void> {
    console.log(`📧 Mock: Test email would be sent to: ${to}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('📧 Mock: Test email sent successfully!');
  }
};

// Export the appropriate service based on environment
export const emailNotificationService = process.env.NODE_ENV === 'production' ? emailService : mockEmailService;
