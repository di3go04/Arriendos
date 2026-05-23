import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function sendDailyReminders() {
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching reminders:', error);
    return;
  }

  for (const reminder of reminders) {
    try {
      // Send notification logic (e.g., email, SMS, push notification)
      console.log(`Sending reminder to ${reminder.user_id}: ${reminder.message}`);

      // Update reminder status
      await supabase
        .from('reminders')
        .update({ status: 'sent' })
        .eq('id', reminder.id);
    } catch (err) {
      console.error('Error sending reminder:', err);
    }
  }
}

sendDailyReminders();
