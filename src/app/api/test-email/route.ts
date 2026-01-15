import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';

// Test endpoint for email - DELETE THIS IN PRODUCTION
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({
      error: 'Please provide email parameter',
      usage: '/api/test-email?email=your@email.com',
    }, { status: 400 });
  }

  console.log('Testing email to:', email);

  try {
    const result = await sendWelcomeEmail({
      to: email,
      customerName: 'Test Customer',
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `✅ Welcome email sent successfully to ${email}!`,
        via: (result as any).via || 'unknown',
        messageId: (result as any).messageId,
        data: (result as any).data,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '❌ Failed to send email',
        error: result.error,
        hint: 'Make sure GMAIL_USER and GMAIL_APP_PASSWORD are set in .env file',
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '❌ Error sending email',
      error: String(error),
    }, { status: 500 });
  }
}
