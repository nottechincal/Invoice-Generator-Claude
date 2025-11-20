# SMTP Email Setup (VentraIP)

Your invoice system now supports sending emails through your own email server via SMTP. This means you can use your VentraIP business email directly instead of Resend.

## VentraIP SMTP Settings

Add these environment variables to your Vercel project:

### Environment Variables

```bash
SMTP_HOST=mail.ventraip.net.au
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourbusiness.com
SMTP_PASSWORD=your-email-password
```

### Step-by-Step Setup

1. **Get Your Email Credentials**
   - Login to VentraIP control panel
   - Go to Email section
   - Use your full email address as username
   - Use your email password (or create one if needed)

2. **Add to Vercel**
   - Go to your Vercel project
   - Navigate to Settings → Environment Variables
   - Add each variable above
   - Click "Save"
   - Redeploy your application

3. **Test It**
   - Send a test invoice to yourself
   - Check your email inbox
   - Emails will come from: `Your Company Name <your-email@yourbusiness.com>`

## How It Works

The system automatically detects which email method to use:

- **If SMTP credentials are configured** → Uses your VentraIP email ✅
- **If no SMTP credentials** → Falls back to Resend

## Troubleshooting

### Port Options
VentraIP supports multiple SMTP ports:

```bash
# Option 1: Port 587 (Recommended - TLS/STARTTLS)
SMTP_PORT=587
SMTP_SECURE=false

# Option 2: Port 465 (SSL)
SMTP_PORT=465
SMTP_SECURE=true

# Option 3: Port 25 (Basic)
SMTP_PORT=25
SMTP_SECURE=false
```

### Common Issues

**"Authentication failed"**
- Double-check your email password
- Make sure you're using the full email address as username

**"Connection timeout"**
- Try port 465 instead of 587
- Check if your hosting allows outbound SMTP

**"Email not received"**
- Check spam folder
- Verify the recipient email is correct
- Check Vercel logs for error messages

### Verify SMTP Settings

To test your SMTP connection, check the Vercel deployment logs. You'll see:
```
Sending email via SMTP...
SMTP email sent: <message-id>
```

If using Resend instead, you'll see:
```
Sending email via Resend...
```

## Support

- **VentraIP SMTP Support**: https://ventraip.com.au/support/
- **Email Settings**: https://ventraip.com.au/faq/email-settings/

## Benefits of SMTP

✅ **Your own domain** - Emails come from your business email
✅ **No third-party service** - Direct connection to your mail server
✅ **Unlimited emails** - No API limits (depends on your hosting plan)
✅ **Better deliverability** - Coming from your established domain
✅ **Full control** - Manage everything through your email hosting

## Reverting to Resend

To switch back to Resend:
1. Remove SMTP environment variables from Vercel
2. Keep your RESEND_API_KEY
3. Redeploy

The system will automatically fall back to Resend.
