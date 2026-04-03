import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:jc@example.com';
const CRON_SECRET = process.env.CRON_SECRET || '';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface NotificationMessage {
  title: string;
  body: string;
}

function getNotificationForHour(hour: number): NotificationMessage | null {
  switch (hour) {
    case 7:
      return {
        title: 'Buenos dias Jose Carlos!',
        body: 'Tu desayuno: Chilaquiles con tostadas Sanissimo, pollo/huevos, salsa, frijoles y aguacate. No olvides tu creatina!',
      };
    default:
      return null;
  }
}

export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get current hour in Mexico City timezone
  const now = new Date();
  const mexicoCityTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' })
  );
  const currentHour = mexicoCityTime.getHours();

  const notification = getNotificationForHour(currentHour);
  if (!notification) {
    return NextResponse.json({
      message: `No notification scheduled for hour ${currentHour} (Mexico City)`,
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, keys');

    if (error) {
      console.error('[cron] Failed to fetch subscriptions', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found' });
    }

    const payload = JSON.stringify(notification);

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys as { p256dh: string; auth: string },
          },
          payload
        )
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // Clean up expired subscriptions
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (
        result.status === 'rejected' &&
        (result.reason as { statusCode?: number })?.statusCode === 410
      ) {
        await supabaseAdmin
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscriptions[i].endpoint);
      }
    }

    return NextResponse.json({
      hour: currentHour,
      notification: notification.title,
      sent,
      failed,
    });
  } catch (err) {
    console.error('[cron] Unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
