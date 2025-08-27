

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { IBooking } from '@/models/Booking';
import type { IUser } from '@/models/User';
import UserModel from '@/models/User';
import type { ITutorProfile } from '@/models/TutorProfile';
import type { IInquiry } from '@/models/Inquiry';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const GOOGLE_EMAIL = process.env.GOOGLE_EMAIL;
const GOOGLE_PASSWORD = process.env.GOOGLE_PASSWORD; 
const ADMIN_EMAIL = 'paudelsunil16@gmail.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:9002';

let transporterInstance: Transporter | null = null;
let mailerConfigError: string | null = null;

if (!GOOGLE_EMAIL || !GOOGLE_PASSWORD) {
  mailerConfigError = "GOOGLE_EMAIL or GOOGLE_PASSWORD environment variables are missing. Emails will not be sent.";
  console.warn(`[Mailer] ${mailerConfigError}`);
} else {
  // Initialize transporter but don't verify here.
  // Verification on startup can be brittle in some environments.
  transporterInstance = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GOOGLE_EMAIL,
      pass: GOOGLE_PASSWORD,
    },
  });
  console.log('[Mailer] Gmail service is configured.');
}

export const sendEmail = async (options: MailOptions): Promise<{success: boolean; messageId?: string; error?: string}> => {
  if (!transporterInstance) { // This check now only fails if credentials are missing.
    const errorMessage = mailerConfigError || "Mailer not initialized.";
    console.warn(`[Mailer] Attempted to send email but mailer is not configured. Subject: "${options.subject}", To: "${options.to}"`);
    return { success: false, error: errorMessage };
  }

  try {
    const info = await transporterInstance.sendMail({
      from: `"YourTutor" <${GOOGLE_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log(`[Mailer] Email sent successfully. Subject: "${options.subject}", To: "${options.to}", Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    let specificError = error.message;
    if (error.code === 'EAUTH' || (error.responseCode && error.responseCode === 535)) {
        specificError = "Authentication failed with Gmail. Check your GOOGLE_EMAIL and GOOGLE_PASSWORD in your .env file. Ensure you are using a Google App Password if 2FA is enabled.";
        console.error(`[Mailer] Gmail Authentication Error: ${specificError}`);
    } else if (error.code === 'ECONNECTION' && error.command === 'CONN') {
        specificError = "Connection to Gmail failed. This could be a temporary network issue or a firewall blocking the connection. The error was: 'Greeting never received'.";
        console.error(`[Mailer] Gmail Connection Error: ${specificError}`);
    } else {
        console.error(`[Mailer] Error sending email. Subject: "${options.subject}", To: "${options.to}"`, error);
    }
    return { success: false, error: specificError };
  }
};


// --- Email Styling and Templates ---

const getEmailStyles = () => `
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
        h1 { color: #333; font-size: 24px; margin: 0; }
        .brand { color: hsl(36, 100%, 50%); font-weight: bold; }
        p { line-height: 1.6; font-size: 16px; }
        .button-container { text-align: center; margin: 25px 0; }
        .button { background-color: hsl(36, 100%, 50%); color: hsl(24, 9.8%, 10%); padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
        .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .details-table td { padding: 10px 0; border-bottom: 1px solid #eee; font-size: 16px; vertical-align: top;}
        .details-table td:first-child { font-weight: bold; color: #555; width: 150px;}
        blockquote { border-left: 4px solid #eee; padding-left: 15px; margin: 15px 0; color: #555; font-style: italic; }
        ul { padding-left: 20px; }
        li { margin-bottom: 10px; }
        .token {
            display: inline-block;
            background-color: #eee;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 3px;
            font-family: 'Courier New', Courier, monospace;
            margin: 15px 0;
        }
    </style>
`;


// --- Specific Email Functions ---

function generateStudentBookingConfirmationHtml(booking: IBooking, student: IUser, tutor: IUser): string {
    const myClassesUrl = `${APP_URL}/my-classes`;
    
    return `
    <!DOCTYPE html><html><head><title>Booking Confirmed</title>${getEmailStyles()}</head><body>
        <div class="container">
            <div class="header"><h1>Booking Confirmed on <span class="brand">YourTutor</span>!</h1></div>
            <p>Hi ${student.name},</p>
            <p>Your tutoring session with <strong>${tutor.name}</strong> for <strong>${booking.subject}</strong> has been successfully booked!</p>
            <p>You can find the exact session time, displayed in your local timezone, on your "My Classes" page. You can also join the meeting directly from there.</p>
            <table class="details-table"><tbody>
                <tr><td>Subject:</td><td>${booking.subject}</td></tr>
                <tr><td>Tutor:</td><td>${tutor.name}</td></tr>
                ${booking.meetingUrl ? `<tr><td>Convenience Link:</td><td><a href="${booking.meetingUrl}" target="_blank">Join Zoom Meeting</a></td></tr>` : ''}
            </tbody></table>
            <p>Please refer to your schedule on the website for the authoritative session time.</p>
            <div class="button-container"><a href="${myClassesUrl}" target="_blank" class="button">View My Classes</a></div>
            <p>If you need to reschedule, please contact your tutor through the platform.</p>
            <div class="footer"><p>&copy; ${new Date().getFullYear()} YourTutor. All rights reserved.</p></div>
        </div></body></html>`;
}

function generateTutorNewBookingHtml(booking: IBooking, student: IUser, tutor: IUser): string {
    const myClassesUrl = `${APP_URL}/my-classes`;

    return `
    <!DOCTYPE html><html><head><title>New Booking</title>${getEmailStyles()}</head><body>
        <div class="container">
            <div class="header"><h1>New Booking Received on <span class="brand">YourTutor</span>!</h1></div>
            <p>Hi ${tutor.name},</p>
            <p>You have a new tutoring session booked with <strong>${student.name}</strong> for <strong>${booking.subject}</strong>.</p>
            <p>The session has been added to your schedule. You can find the exact time, displayed in your local timezone, on your "My Classes" page.</p>
            <table class="details-table"><tbody>
                <tr><td>Subject:</td><td>${booking.subject}</td></tr>
                <tr><td>Student:</td><td>${student.name} (${student.email})</td></tr>
                 ${booking.meetingStartUrl ? `<tr><td>Your Host Link:</td><td><a href="${booking.meetingStartUrl}" target="_blank">Start Meeting as Host</a></td></tr>` : booking.meetingUrl ? `<tr><td>Meeting Link:</td><td><a href="${booking.meetingUrl}" target="_blank">Join Zoom Meeting</a></td></tr>` : ''}
            </tbody></table>
            <p>Please refer to your schedule on the website for the authoritative session time.</p>
            <div class="button-container"><a href="${myClassesUrl}" target="_blank" class="button">View Your Schedule</a></div>
            <p>The session has been added to your schedule. Please prepare for the upcoming class.</p>
            <div class="footer"><p>&copy; ${new Date().getFullYear()} YourTutor. All rights reserved.</p></div>
        </div></body></html>`;
}

export async function sendBookingEmails(booking: IBooking, student: IUser, tutor: IUser) {
  const myClassesUrl = `${APP_URL}/my-classes`;
  try {
    await sendEmail({
      to: student.email, subject: `YourTutor Session Confirmed: ${booking.subject} with ${tutor.name}`,
      text: `Your session for ${booking.subject} with ${tutor.name} is confirmed. Please visit your 'My Classes' page for the exact time in your local timezone and the meeting link: ${myClassesUrl}`,
      html: generateStudentBookingConfirmationHtml(booking, student, tutor),
    });
    await sendEmail({
      to: tutor.email, subject: `New YourTutor Booking: ${booking.subject} with ${student.name}`,
      text: `You have a new session for ${booking.subject} with ${student.name}. Please visit your 'My Classes' page for the exact time in your local timezone and your host link: ${myClassesUrl}`,
      html: generateTutorNewBookingHtml(booking, student, tutor),
    });
  } catch (error) {
    console.error(`[sendBookingEmails] Failed to send emails for booking ${booking._id}:`, error);
  }
}

function generateTutorApplicationConfirmationHtml(tutorName: string): string {
    return `
    <!DOCTYPE html><html><head><title>Application Received</title>${getEmailStyles()}</head><body>
    <div class="container">
        <div class="header"><h1>We've Received Your <span class="brand">YourTutor</span> Application</h1></div>
        <p>Hi ${tutorName},</p>
        <p>Thank you for submitting your application to become a tutor on our platform. We're excited to learn more about you!</p>
        <p>Our team will review your profile and qualifications. This process typically takes 3-5 business days. We will notify you via email as soon as a decision has been made.</p>
        <p>In the meantime, you can log in to your account to review the information you submitted.</p>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} YourTutor. All rights reserved.</p></div>
    </div></body></html>`;
}

function generateAdminTutorApplicationHtml(tutor: IUser, profile: ITutorProfile): string {
    const profileUrl = `${APP_URL}/admin/tutors/${tutor._id}`;
    return `
    <!DOCTYPE html><html><head><title>New Tutor Application</title>${getEmailStyles()}</head><body>
    <div class="container">
        <div class="header"><h1>New Tutor Application for Review</h1></div>
        <p>A new application has been submitted by <strong>${tutor.name}</strong>.</p>
        <table class="details-table"><tbody>
            <tr><td>Name:</td><td>${tutor.name}</td></tr>
            <tr><td>Email:</td><td>${tutor.email}</td></tr>
            <tr><td>Hourly Rate:</td><td>$${profile.hourlyRate}</td></tr>
            <tr><td>Subjects:</td><td>${profile.subjects.join(', ')}</td></tr>
            <tr><td>Bio:</td><td><blockquote>${profile.bio}</blockquote></td></tr>
            <tr><td>Qualifications:</td><td>
                ${profile.qualifications.length > 0 ? `
                    <ul>${profile.qualifications.map(q => `<li><a href="${q.url}" target="_blank">${q.originalFilename}</a> (${q.fileType})</li>`).join('')}</ul>
                ` : 'None provided'}
            </td></tr>
        </tbody></table>
        <div class="button-container">
            <a href="${profileUrl}" target="_blank" class="button">Review Application</a>
        </div>
        <div class="footer"><p>This is an automated notification from YourTutor.</p></div>
    </div></body></html>`;
}

export async function sendTutorApplicationEmails(tutor: IUser, profile: ITutorProfile): Promise<{success: boolean, error?: string}> {
    try {
        // To Tutor
        const tutorEmailResult = await sendEmail({
            to: tutor.email,
            subject: "We've Received Your YourTutor Application!",
            text: `Hi ${tutor.name},\n\nThank you for submitting your application to become a tutor. Our team will review your profile and we'll be in touch soon.\n\nThanks,\nThe YourTutor Team`,
            html: generateTutorApplicationConfirmationHtml(tutor.name),
        });

        // To Admin
        const adminEmailResult = await sendEmail({
            to: ADMIN_EMAIL,
            subject: `[Action Required] New Tutor Application: ${tutor.name}`,
            text: `A new tutor application from ${tutor.name} (${tutor.email}) is ready for review. Subjects: ${profile.subjects.join(', ')}.`,
            html: generateAdminTutorApplicationHtml(tutor, profile),
        });
        
        if (!tutorEmailResult.success || !adminEmailResult.success) {
            const errorDetails = `Tutor email failed: ${!tutorEmailResult.success}, Admin email failed: ${!adminEmailResult.success}`;
            throw new Error(`One or more application emails failed to send. ${errorDetails}`);
        }
        
        return { success: true };

    } catch (error: any) {
        console.error(`[sendTutorApplicationEmails] Failed to send emails for tutor ${tutor._id}:`, error.message);
        return { success: false, error: error.message };
    }
}

function generateTutorStatusUpdateHtml(tutorName: string, status: 'approved' | 'rejected', reason?: string | null): string {
    const isApproved = status === 'approved';
    const subject = isApproved ? 'Congratulations! Your Tutor Profile is Approved' : 'Update on Your Tutor Application';
    const loginUrl = `${APP_URL}/login`;

    return `
    <!DOCTYPE html><html><head><title>${subject}</title>${getEmailStyles()}</head><body>
    <div class="container">
        <div class="header"><h1>${subject}</h1></div>
        <p>Hi ${tutorName},</p>
        ${isApproved ? `
            <p>We are thrilled to let you know that your application to become a tutor on <span class="brand">YourTutor</span> has been approved! Your profile is now live and visible to students.</p>
            <p>You can now log in to manage your schedule and start connecting with learners.</p>
            <div class="button-container"><a href="${loginUrl}" target="_blank" class="button">Go to Your Dashboard</a></div>
        ` : `
            <p>Thank you for your interest in becoming a tutor on <span class="brand">YourTutor</span>. After careful review, we regret to inform you that we are unable to approve your application at this time.</p>
            ${reason ? `
                <p><strong>Reason:</strong></p>
                <blockquote>${reason}</blockquote>
                <p>You may log in to your account to update your profile and resubmit for another review.</p>
            ` : ''}
        `}
        <div class="footer"><p>&copy; ${new Date().getFullYear()} YourTutor. All rights reserved.</p></div>
    </div></body></html>`;
}

export async function sendTutorStatusUpdateEmail(tutor: IUser) {
    if (tutor.tutorStatus !== 'approved' && tutor.tutorStatus !== 'rejected') return;

    try {
         await sendEmail({
            to: tutor.email,
            subject: `Your YourTutor Application Status: ${tutor.tutorStatus.charAt(0).toUpperCase() + tutor.tutorStatus.slice(1)}`,
            text: `Hi ${tutor.name},\nYour application status has been updated to: ${tutor.tutorStatus}.${tutor.rejectionReason ? `\nReason: ${tutor.rejectionReason}` : ''}`,
            html: generateTutorStatusUpdateHtml(tutor.name, tutor.tutorStatus, tutor.rejectionReason),
        });
    } catch(error) {
        console.error(`[sendTutorStatusUpdateEmail] Failed to send email for tutor ${tutor._id}:`, error);
    }
}

function generateInquiryNotificationHtml(inquiry: IInquiry): string {
    const adminDashboardUrl = `${APP_URL}/admin`;
    return `
    <!DOCTYPE html><html><head><title>New Contact Form Inquiry</title>${getEmailStyles()}</head><body>
    <div class="container">
        <div class="header"><h1>New Inquiry from <span class="brand">YourTutor</span> Contact Form</h1></div>
        <p>You have received a new message from your website's contact form.</p>
        <table class="details-table"><tbody>
            <tr><td>Name:</td><td>${inquiry.name}</td></tr>
            <tr><td>Email:</td><td><a href="mailto:${inquiry.email}">${inquiry.email}</a></td></tr>
            ${inquiry.subject ? `<tr><td>Subject:</td><td>${inquiry.subject}</td></tr>` : ''}
            <tr><td>Message:</td><td><blockquote>${inquiry.message.replace(/\n/g, '<br>')}</blockquote></td></tr>
        </tbody></table>
        <div class="button-container">
            <a href="${adminDashboardUrl}" target="_blank" class="button">Go to Admin Dashboard</a>
        </div>
        <div class="footer"><p>This is an automated notification from YourTutor.</p></div>
    </div></body></html>`;
}

function generateInquiryConfirmationHtml(inquiry: IInquiry): string {
    return `
    <!DOCTYPE html><html><head><title>We've Received Your Message</title>${getEmailStyles()}</head><body>
    <div class="container">
        <div class="header"><h1>We've Received Your Message</h1></div>
        <p>Hi ${inquiry.name},</p>
        <p>Thank you for contacting <span class="brand">YourTutor</span>. This is an automated confirmation that we have successfully received your inquiry. Our team will review your message and get back to you as soon as possible.</p>
        <p>Here is a copy of your message for your records:</p>
        <blockquote>${inquiry.message.replace(/\n/g, '<br>')}</blockquote>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} YourTutor. All rights reserved.</p></div>
    </div></body></html>`;
}

export async function sendInquiryEmails(inquiry: IInquiry): Promise<{success: boolean; error?: string}> {
    if (!ADMIN_EMAIL) {
        console.warn('[Mailer] ADMIN_EMAIL is not set. Cannot send inquiry notification.');
        return { success: false, error: 'Admin email not configured.' };
    }

    try {
        // 1. Send notification to admin
        const adminEmailResult = await sendEmail({
            to: ADMIN_EMAIL,
            subject: `New Contact Inquiry: ${inquiry.subject || 'No Subject'}`,
            text: `Name: ${inquiry.name}\nEmail: ${inquiry.email}\nSubject: ${inquiry.subject || 'N/A'}\n\nMessage:\n${inquiry.message}`,
            html: generateInquiryNotificationHtml(inquiry),
        });

        // 2. Send confirmation to user
        const userEmailResult = await sendEmail({
            to: inquiry.email,
            subject: `We've received your inquiry at YourTutor`,
            text: `Hi ${inquiry.name},\n\nThis is an automated confirmation that we have received your inquiry. Our team will review your message and get back to you as soon as possible.\n\nThanks,\nThe YourTutor Team`,
            html: generateInquiryConfirmationHtml(inquiry),
        });

        if (!adminEmailResult.success || !userEmailResult.success) {
             const errorDetails = `Admin email failed: ${!adminEmailResult.success}, User email failed: ${!userEmailResult.success}`;
            throw new Error(`One or more inquiry emails failed to send. ${errorDetails}`);
        }

        return { success: true };

    } catch (error: any) {
        console.error(`[sendInquiryEmails] Failed to send email for inquiry ${inquiry._id}:`, error.message);
        return { success: false, error: error.message };
    }
}


function generatePasswordResetHtml(userName: string, resetToken: string): string {
    const resetUrl = `${APP_URL}/reset-password`;

    return `
    <!DOCTYPE html><html><head><title>Your Password Reset Token</title>${getEmailStyles()}</head><body>
    <div class="container">
        <div class="header"><h1>Password Reset Request</h1></div>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password for your <span class="brand">YourTutor</span> account. Please use the token below to set a new password. This token is valid for one hour.</p>
        <p>Your password reset token is:</p>
        <div class="token">${resetToken}</div>
        <p>Please enter this token on the password reset page.</p>
        <div class="button-container">
            <a href="${resetUrl}" target="_blank" class="button">Reset Your Password</a>
        </div>
        <p>If you did not request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} YourTutor. All rights reserved.</p></div>
    </div></body></html>`;
}

export async function sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string) {
    try {
        await sendEmail({
            to: userEmail,
            subject: 'Your YourTutor Password Reset Token',
            text: `Your password reset token is: ${resetToken}. It is valid for one hour.`,
            html: generatePasswordResetHtml(userName, resetToken),
        });
    } catch (error) {
        console.error(`[sendPasswordResetEmail] Failed to send reset email to ${userEmail}:`, error);
        // We throw here so the calling action can handle the UI feedback
        throw new Error('Could not send password reset email.');
    }
}

function generateNewMessageNotificationHtml(student: IUser, tutor: IUser, message: string): string {
    const messagesUrl = `${APP_URL}/messages/${student._id.toString()}`;

    return `
    <!DOCTYPE html><html><head><title>New Message on YourTutor</title>${getEmailStyles()}</head><body>
        <div class="container">
            <div class="header"><h1>You Have a New Message on <span class="brand">YourTutor</span></h1></div>
            <p>Hi ${tutor.name},</p>
            <p>You've received a new message from a potential student, <strong>${student.name}</strong>, regarding your tutoring services.</p>
            <p><strong>Message:</strong></p>
            <blockquote>${message.replace(/\n/g, '<br>')}</blockquote>
            <p>You can view the full conversation and reply on the YourTutor platform.</p>
            <div class="button-container">
                <a href="${messagesUrl}" class="button">View & Reply to Message</a>
            </div>
            <div class="footer"><p>&copy; ${new Date().getFullYear()} YourTutor. All rights reserved.</p></div>
        </div></body></html>`;
}

export async function sendNewMessageNotificationEmail(sender: IUser, receiver: IUser, message: string) {
    try {
        await sendEmail({
            to: receiver.email,
            subject: `New Message from ${sender.name} on YourTutor`,
            text: `You have a new message from ${sender.name}:\n\n${message}\n\nYou can view and reply to the message here: ${APP_URL}/messages/${sender._id.toString()}`,
            html: generateNewMessageNotificationHtml(sender, receiver, message),
        });
    } catch (error) {
        console.error(`[sendNewMessageNotificationEmail] Failed to send message notification to user ${receiver._id}:`, error);
    }
}


function generateRescheduleRequestHtml(booking: IBooking, student: IUser, tutor: IUser, requesterRole: 'student' | 'tutor', reason: string): string {
    const isStudentRequesting = requesterRole === 'student';
    const requesterName = isStudentRequesting ? student.name : tutor.name;
    const recipientName = isStudentRequesting ? tutor.name : student.name;
    const messagesUrl = `${APP_URL}/messages`;

    return `
    <!DOCTYPE html><html><head><title>Reschedule Request</title>${getEmailStyles()}</head><body>
        <div class="container">
            <div class="header"><h1>Reschedule Request for Your <span class="brand">YourTutor</span> Session</h1></div>
            <p>Hi ${recipientName},</p>
            <p><strong>${requesterName}</strong> has requested to reschedule your upcoming session for <strong>${booking.subject}</strong>.</p>
            <p><strong>Reason Provided:</strong></p>
            <blockquote>${reason}</blockquote>
            <p>Please contact them via the platform's messaging system to discuss a new time that works for both of you.</p>
            <div class="button-container">
                <a href="${messagesUrl}" target="_blank" class="button">Go to Messages</a>
            </div>
            <p>Once you have agreed on a new time, the student will need to book the new session, and this one should be cancelled.</p>
            <div class="footer"><p>&copy; ${new Date().getFullYear()} YourTutor. All rights reserved.</p></div>
        </div></body></html>`;
}

export async function sendRescheduleRequestEmail(booking: IBooking, student: IUser, tutor: IUser, requesterRole: 'student' | 'tutor', reason: string) {
    const isStudentRequesting = requesterRole === 'student';
    const recipient = isStudentRequesting ? tutor : student;
    const requester = isStudentRequesting ? student : tutor;
    
    try {
        await sendEmail({
            to: recipient.email,
            subject: `Reschedule Request for Your Session with ${requester.name}`,
            text: `${requester.name} has requested to reschedule your session for ${booking.subject}. Reason: ${reason}. Please use the messaging feature on YourTutor to coordinate.`,
            html: generateRescheduleRequestHtml(booking, student, tutor, requesterRole, reason),
        });
    } catch (error) {
        console.error(`[sendRescheduleRequestEmail] Failed to send email for booking ${booking._id}:`, error);
    }
}
