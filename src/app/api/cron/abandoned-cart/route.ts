import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { abandonedCartEmail } from '@/lib/abandoned-cart-email';

export const dynamic = 'force-dynamic';

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testMode = searchParams.get('test') === 'true';

  // Verify cron secret to prevent unauthorized calls (skipped in test mode)
  const authHeader = request.headers.get('authorization');
  if (!testMode && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  // In test mode, send immediately (0 min wait); otherwise 1 hour
  const oneHourAgo = new Date(now.getTime() - (testMode ? 0 : 60 * 60 * 1000));
  const twentyFourHoursAgo = new Date(now.getTime() - (testMode ? 0 : 24 * 60 * 60 * 1000));
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  let sent = 0;
  let expired = 0;

  try {
    // Expire carts older than 48 hours
    await prisma.abandonedCart.updateMany({
      where: { status: 'PENDING', createdAt: { lt: fortyEightHoursAgo } },
      data: { status: 'EXPIRED' },
    });

    // Find carts for first reminder (1+ hours old, no reminder sent yet)
    const firstReminders = await prisma.abandonedCart.findMany({
      where: {
        status: 'PENDING',
        reminderCount: 0,
        createdAt: { lte: oneHourAgo },
      },
      take: 50,
    });

    // Find carts for second reminder (24+ hours old, only 1 reminder sent).
    // Skipped in test mode to avoid double-sending to the same cart in one call.
    const secondReminders = testMode ? [] : await prisma.abandonedCart.findMany({
      where: {
        status: 'PENDING',
        reminderCount: 1,
        lastReminderAt: { lt: twentyFourHoursAgo },
      },
      take: 50,
    });

    const transporter = createTransporter();
    const fromEmail = `"Darshan Style Hub™" <${process.env.GMAIL_USER}>`;

    for (const cart of firstReminders) {
      try {
        const items = cart.items as unknown as Parameters<typeof abandonedCartEmail>[0]['items'];
        const { subject, html } = abandonedCartEmail({
          name: cart.name,
          items,
          total: cart.total,
          isSecondReminder: false,
        });

        await transporter.sendMail({ from: fromEmail, to: cart.email, subject, html });

        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: { reminderCount: 1, lastReminderAt: now },
        });

        sent++;
      } catch (err) {
        console.error(`Failed to send first reminder to ${cart.email}:`, err);
      }
    }

    for (const cart of secondReminders) {
      try {
        const items = cart.items as unknown as Parameters<typeof abandonedCartEmail>[0]['items'];
        const { subject, html } = abandonedCartEmail({
          name: cart.name,
          items,
          total: cart.total,
          isSecondReminder: true,
        });

        await transporter.sendMail({ from: fromEmail, to: cart.email, subject, html });

        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: { reminderCount: 2, lastReminderAt: now },
        });

        sent++;
      } catch (err) {
        console.error(`Failed to send second reminder to ${cart.email}:`, err);
      }
    }

    const totalCarts = await prisma.abandonedCart.count();
    const pendingCarts = await prisma.abandonedCart.count({ where: { status: 'PENDING' } });

    return NextResponse.json({
      success: true,
      sent,
      expired,
      firstReminders: firstReminders.length,
      secondReminders: secondReminders.length,
      debug: { totalCartsInDb: totalCarts, pendingCarts },
    });
  } catch (error) {
    console.error('Abandoned cart cron error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Cron job failed' }, { status: 500 });
  }
}
