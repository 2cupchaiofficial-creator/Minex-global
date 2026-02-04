"""
Email Service for MINEX GLOBAL Platform
Using Resend for transactional emails
Falls back to database logging if Resend not configured
"""
import os
import asyncio
import logging
from typing import Optional
from datetime import datetime, timezone
import uuid

logger = logging.getLogger(__name__)

# Try to import Resend
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    logger.warning("Resend not installed - emails will be logged to database")


class EmailService:
    def __init__(self):
        self.api_key = None
        self.sender_email = 'onboarding@resend.dev'
        self.is_configured = False
        self.db = None
    
    def initialize(self):
        """Initialize email service after environment variables are loaded"""
        self.api_key = os.environ.get('RESEND_API_KEY')
        self.sender_email = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
        self.is_configured = bool(self.api_key) and RESEND_AVAILABLE
        
        if self.is_configured:
            resend.api_key = self.api_key
            logger.info(f"Resend email service configured with sender: {self.sender_email}")
        else:
            logger.warning("Resend not configured - emails will be logged to database")
        
    def set_db(self, db):
        """Set database reference for logging emails"""
        self.db = db
        self.initialize()
    
    def _get_email_template(self, title: str, content: str) -> str:
        """Generate professional HTML email template"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0f;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden;">
                <tr>
                    <td style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); padding: 30px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: white; letter-spacing: 2px;">MINEX GLOBAL</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.8); margin-top: 5px;">Crypto Investment Platform</div>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 40px 30px; color: #e5e7eb;">
                        <div style="font-size: 24px; font-weight: bold; color: white; margin-bottom: 20px;">{title}</div>
                        {content}
                    </td>
                </tr>
                <tr>
                    <td style="background: #0f0f1a; padding: 30px; text-align: center; color: #6b7280; font-size: 12px;">
                        <p style="margin: 0;">© 2026 MINEX GLOBAL. All rights reserved.</p>
                        <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply directly.</p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
    
    async def _log_email_to_db(self, to_email: str, subject: str, email_type: str, content_preview: str, status: str = "logged"):
        """Log email to database for admin review"""
        if self.db is not None:
            email_log = {
                "email_id": str(uuid.uuid4()),
                "to_email": to_email,
                "subject": subject,
                "email_type": email_type,
                "content_preview": content_preview[:500],
                "status": status,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await self.db.email_logs.insert_one(email_log)
    
    async def send_email(self, to_email: str, subject: str, html_content: str, email_type: str = "general") -> bool:
        """Send an email via Resend or log to database"""
        try:
            if not self.is_configured:
                await self._log_email_to_db(to_email, subject, email_type, html_content[:200], "logged")
                logger.info(f"Email logged (Resend not configured): {subject} to {to_email}")
                return True
            
            params = {
                "from": self.sender_email,
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            
            try:
                # Run sync SDK in thread to keep FastAPI non-blocking
                email_response = await asyncio.to_thread(resend.Emails.send, params)
                email_id = email_response.get("id") if isinstance(email_response, dict) else getattr(email_response, 'id', None)
                logger.info(f"Email sent successfully: {subject} to {to_email}, id: {email_id}")
                await self._log_email_to_db(to_email, subject, email_type, html_content[:200], "sent")
                return True
            except Exception as resend_error:
                logger.warning(f"Resend send failed: {str(resend_error)} - falling back to DB logging")
                await self._log_email_to_db(to_email, subject, email_type, html_content[:200], f"failed: {str(resend_error)[:100]}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False
    
    async def send_verification_code(self, to_email: str, code: str, user_name: str = "User") -> bool:
        """Send email verification code"""
        content = f"""
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Hello {user_name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Welcome to <span style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">MINEX GLOBAL</span>! To complete your registration, please use the verification code below:</p>
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 36px; font-weight: bold; color: #3b82f6; letter-spacing: 8px; font-family: monospace;">{code}</div>
        </div>
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">This code will expire in <strong>10 minutes</strong>.</p>
        <hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin: 20px 0;" />
        <p style="font-size: 14px; color: #6b7280;">If you didn't request this verification, please ignore this email.</p>
        """
        
        html_content = self._get_email_template("Email Verification", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Email Verification Code", html_content, "verification")
    
    async def send_password_reset(self, to_email: str, user_name: str, reset_code: str, reset_link: str) -> bool:
        """Send password reset email"""
        content = f"""
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Hello {user_name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">We received a request to reset your password. Use the code below to reset it:</p>
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 36px; font-weight: bold; color: #3b82f6; letter-spacing: 8px; font-family: monospace;">{reset_code}</div>
        </div>
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">This code will expire in <strong>15 minutes</strong>.</p>
        <hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin: 20px 0;" />
        <p style="font-size: 14px; color: #6b7280;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        """
        
        html_content = self._get_email_template("Password Reset Request", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Password Reset Code", html_content, "password_reset")
    
    async def send_deposit_approved(self, to_email: str, user_name: str, amount: float) -> bool:
        """Send deposit approval notification"""
        content = f"""
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Hello {user_name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Great news! Your deposit has been <span style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">approved</span>.</p>
        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 14px; color: #9ca3af; margin-bottom: 10px;">Deposit Amount</div>
            <div style="font-size: 32px; font-weight: bold; color: #22c55e; font-family: monospace;">${amount:,.2f}</div>
        </div>
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">The funds have been credited to your account balance and are now available for investment.</p>
        <hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin: 20px 0;" />
        <p style="font-size: 16px; color: #9ca3af;">Start investing now to maximize your returns!</p>
        """
        
        html_content = self._get_email_template("Deposit Approved ✓", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Deposit Approved", html_content, "deposit_approved")
    
    async def send_deposit_rejected(self, to_email: str, user_name: str, amount: float, reason: str) -> bool:
        """Send deposit rejection notification"""
        content = f"""
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Hello {user_name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">We regret to inform you that your deposit request has been <span style="color: #ef4444; font-weight: bold;">rejected</span>.</p>
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 14px; color: #9ca3af; margin-bottom: 10px;">Requested Amount</div>
            <div style="font-size: 24px; color: #ef4444; font-weight: bold;">${amount:,.2f}</div>
        </div>
        <table width="100%" style="margin: 20px 0;">
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #6b7280;">Reason</td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #ef4444; font-weight: bold; text-align: right;">{reason}</td>
            </tr>
        </table>
        <hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin: 20px 0;" />
        <p style="font-size: 16px; color: #9ca3af;">If you believe this is an error, please contact our support team.</p>
        """
        
        html_content = self._get_email_template("Deposit Rejected", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Deposit Status Update", html_content, "deposit_rejected")
    
    async def send_withdrawal_approved(self, to_email: str, user_name: str, amount: float, tx_hash: str) -> bool:
        """Send withdrawal approval notification"""
        content = f"""
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Hello {user_name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Your withdrawal request has been <span style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">processed successfully</span>.</p>
        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 14px; color: #9ca3af; margin-bottom: 10px;">Withdrawal Amount</div>
            <div style="font-size: 32px; font-weight: bold; color: #22c55e; font-family: monospace;">${amount:,.2f}</div>
        </div>
        <table width="100%" style="margin: 20px 0;">
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #6b7280;">Transaction Hash</td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: white; font-weight: bold; text-align: right; font-family: monospace; font-size: 12px;">{tx_hash[:20]}...</td>
            </tr>
        </table>
        <hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin: 20px 0;" />
        <p style="font-size: 16px; color: #9ca3af;">The funds should arrive in your wallet shortly.</p>
        """
        
        html_content = self._get_email_template("Withdrawal Processed ✓", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Withdrawal Processed", html_content, "withdrawal_approved")
    
    async def send_withdrawal_rejected(self, to_email: str, user_name: str, amount: float, reason: str) -> bool:
        """Send withdrawal rejection notification"""
        content = f"""
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Hello {user_name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">We regret to inform you that your withdrawal request has been <span style="color: #ef4444; font-weight: bold;">rejected</span>.</p>
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 14px; color: #9ca3af; margin-bottom: 10px;">Requested Amount</div>
            <div style="font-size: 24px; color: #ef4444; font-weight: bold;">${amount:,.2f}</div>
        </div>
        <table width="100%" style="margin: 20px 0;">
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #6b7280;">Reason</td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #ef4444; font-weight: bold; text-align: right;">{reason}</td>
            </tr>
        </table>
        <p style="font-size: 16px; color: #9ca3af;">The amount has been restored to your account balance.</p>
        <hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin: 20px 0;" />
        <p style="font-size: 16px; color: #9ca3af;">If you believe this is an error, please contact our support team.</p>
        """
        
        html_content = self._get_email_template("Withdrawal Rejected", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Withdrawal Status Update", html_content, "withdrawal_rejected")
    
    async def send_roi_notification(self, to_email: str, user_name: str, roi_amount: float, total_roi: float, package_name: str) -> bool:
        """Send daily ROI notification"""
        content = f"""
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Hello {user_name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">You've received your <span style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">daily ROI</span> earnings!</p>
        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 14px; color: #9ca3af; margin-bottom: 10px;">Today's ROI Earnings</div>
            <div style="font-size: 32px; font-weight: bold; color: #22c55e; font-family: monospace;">+${roi_amount:,.2f}</div>
        </div>
        <table width="100%" style="margin: 20px 0;">
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #6b7280;">Investment Package</td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: white; font-weight: bold; text-align: right;">{package_name}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #6b7280;">Total ROI Earned</td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #22c55e; font-weight: bold; text-align: right;">${total_roi:,.2f}</td>
            </tr>
        </table>
        <hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin: 20px 0;" />
        <p style="font-size: 16px; color: #9ca3af;">Your ROI has been added to your withdrawable balance. Keep growing your investment!</p>
        """
        
        html_content = self._get_email_template("Daily ROI Credited 📈", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Daily ROI Credited", html_content, "roi_notification")
    
    async def send_commission_notification(self, to_email: str, user_name: str, commission_amount: float, from_user: str, level: int, total_commission: float) -> bool:
        """Send commission notification"""
        level_names = {1: "Direct", 2: "Level 2", 3: "Level 3", 4: "Level 4", 5: "Level 5", 6: "Level 6"}
        level_name = level_names.get(level, f"Level {level}")
        
        content = f"""
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Hello {user_name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">You've earned a <span style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">{level_name} commission</span>!</p>
        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 14px; color: #9ca3af; margin-bottom: 10px;">Commission Earned</div>
            <div style="font-size: 32px; font-weight: bold; color: #22c55e; font-family: monospace;">+${commission_amount:,.2f}</div>
        </div>
        <table width="100%" style="margin: 20px 0;">
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #6b7280;">From Team Member</td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: white; font-weight: bold; text-align: right;">{from_user}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #6b7280;">Commission Level</td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #8b5cf6; font-weight: bold; text-align: right;">{level_name}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #6b7280;">Total Commissions Earned</td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #22c55e; font-weight: bold; text-align: right;">${total_commission:,.2f}</td>
            </tr>
        </table>
        <hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin: 20px 0;" />
        <p style="font-size: 16px; color: #9ca3af;">Great job building your team! Keep referring to earn more commissions.</p>
        """
        
        html_content = self._get_email_template("Commission Earned 🎉", content)
        return await self.send_email(to_email, f"MINEX GLOBAL - {level_name} Commission Earned", html_content, "commission_notification")
    
    async def send_level_promotion(self, to_email: str, user_name: str, old_level: int, new_level: int) -> bool:
        """Send level promotion notification"""
        content = f"""
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Hello {user_name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Congratulations! You've been <span style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">promoted</span> to a higher level!</p>
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 14px; color: #9ca3af; margin-bottom: 10px;">Your New Level</div>
            <div style="font-size: 48px; font-weight: bold; color: #3b82f6; letter-spacing: 4px;">LEVEL {new_level}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 10px;">Previously Level {old_level}</div>
        </div>
        <p style="font-size: 16px; color: #9ca3af;">With this promotion, you now enjoy:</p>
        <ul style="list-style: none; padding: 0; margin: 20px 0; color: #9ca3af;">
            <li style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">✓ Higher daily ROI percentage</li>
            <li style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">✓ Better commission rates</li>
            <li style="padding: 8px 0;">✓ Increased investment limits</li>
        </ul>
        <hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin: 20px 0;" />
        <p style="font-size: 16px; color: #9ca3af;">Keep growing your team to unlock even more rewards!</p>
        """
        
        html_content = self._get_email_template("Level Promotion! 🏆", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Congratulations on Your Promotion!", html_content, "level_promotion")
    
    async def send_password_change_confirmation(self, to_email: str, user_name: str) -> bool:
        """Send password change confirmation"""
        content = f"""
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Hello {user_name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Your password has been <span style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">successfully changed</span>.</p>
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 48px;">🔐</div>
            <div style="font-size: 14px; color: #9ca3af; margin-top: 10px;">Password Updated</div>
        </div>
        <p style="font-size: 16px; color: #9ca3af;">If you did not make this change, please contact our support team immediately.</p>
        <hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin: 20px 0;" />
        <p style="font-size: 14px; color: #6b7280;">For security, we recommend using a unique password for each account.</p>
        """
        
        html_content = self._get_email_template("Password Changed", content)
        return await self.send_email(to_email, "MINEX GLOBAL - Password Changed", html_content, "password_change")


# Global instance
email_service = EmailService()
