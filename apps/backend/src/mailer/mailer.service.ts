// import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// // import * as nodemailer from 'nodemailer';
// import { User } from '../database/schema';

// @Injectable()
// export class MailerService {
//   private readonly logger = new Logger(MailerService.name);
//   private transporter: nodemailer.Transporter | null = null;

//   constructor(private readonly configService: ConfigService) {
//     const apiKey = this.configService.get<string>('mail.resendApiKey');
//     if (apiKey) {
//       this.transporter = nodemailer.createTransport({
//         host: 'smtp.resend.com',
//         port: 465,
//         secure: true,
//         auth: {
//           user: 'resend',
//           pass: apiKey,
//         },
//       });
//       this.logger.log('MailerService initialized with Resend SMTP');
//     } else {
//       this.logger.warn('RESEND_API_KEY is not defined. Emails will be logged to the console instead.');
//     }
//   }

//   async sendVerificationCode(user: User, code: string): Promise<void> {
//     const from = this.configService.get<string>('mail.mailFrom') || 'noreply@socialpilot.ai';
//     const subject = 'Verify your SocialPilot AI account';
//     const html = `
//       <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
//         <h2 style="color: #4f46e5; margin-bottom: 20px;">Verify your SocialPilot AI account</h2>
//         <p>Hi ${user.fullName},</p>
//         <p>Thank you for signing up for SocialPilot AI. Please use the verification code below to complete your registration:</p>
//         <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 30px 0; color: #1e1b4b; background-color: #f1f5f9; padding: 15px; border-radius: 6px;">
//           ${code}
//         </div>
//         <p>This code is valid for 15 minutes. If you did not request this, please ignore this email.</p>
//         <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
//         <p style="font-size: 12px; color: #64748b;">© 2026 SocialPilot AI. All rights reserved.</p>
//       </div>
//     `;

//     if (this.transporter) {
//       try {
//         await this.transporter.sendMail({
//           from,
//           to: user.email,
//           subject,
//           html,
//         });
//         this.logger.log(`Verification email sent to ${user.email}`);
//       } catch (error) {
//         this.logger.error(`Failed to send verification email to ${user.email}`, error);
//         throw error;
//       }
//     } else {
//       this.logger.log(`[MOCK EMAIL] To: ${user.email} | Subject: ${subject} | Code: ${code}`);
//     }
//   }

//   async sendWelcomeEmail(user: User): Promise<void> {
//     const from = this.configService.get<string>('mail.mailFrom') || 'noreply@socialpilot.ai';
//     const subject = 'Welcome to SocialPilot AI!';
//     const html = `
//       <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
//         <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to SocialPilot AI!</h2>
//         <p>Hi ${user.fullName},</p>
//         <p>Your email has been successfully verified, and your account is active.</p>
//         <p>We are excited to have you on board! You can now start scheduling your posts and using our AI features to grow your social media presence.</p>
//         <a href="${this.configService.get<string>('frontendUrl')}/dashboard" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Go to Dashboard</a>
//         <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
//         <p style="font-size: 12px; color: #64748b;">© 2026 SocialPilot AI. All rights reserved.</p>
//       </div>
//     `;

//     if (this.transporter) {
//       try {
//         await this.transporter.sendMail({
//           from,
//           to: user.email,
//           subject,
//           html,
//         });
//         this.logger.log(`Welcome email sent to ${user.email}`);
//       } catch (error) {
//         this.logger.error(`Failed to send welcome email to ${user.email}`, error);
//         throw error;
//       }
//     } else {
//       this.logger.log(`[MOCK EMAIL] To: ${user.email} | Subject: ${subject} | Welcome to SocialPilot AI`);
//     }
//   }
// }
