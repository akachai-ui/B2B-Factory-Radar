import { LeadStatus, LeadStatusRecord } from './types';
import { supabase } from './supabase';

const STORAGE_KEY_PREFIX = 'b2b_lead_status_records_';

export function getLeadStatuses(userId: string = 'default'): Record<string, LeadStatusRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (raw && raw !== 'undefined' && raw !== 'null' && raw.trim() !== '') {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading lead statuses:', e);
  }
  return {};
}

export function saveLeadStatus(
  placeId: string,
  status: LeadStatus,
  note: string = '',
  userId: string = 'default'
): Record<string, LeadStatusRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const current = getLeadStatuses(userId);
    current[placeId] = {
      status,
      note: note !== undefined && note !== '' ? note : current[placeId]?.note || '',
      updatedAt: new Date().toISOString(),
    };
    
    // 1. Save to LocalStorage immediately (0ms latency, persistent across refreshes/restarts)
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(current));
    
    // 2. Broadcast custom event so all open views, maps, and tables update reactively
    window.dispatchEvent(new CustomEvent('lead_status_updated', { detail: { placeId, status, note } }));

    // 3. Asynchronously sync to Supabase Cloud if user is logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && user.id !== 'demo-user-12345') {
        supabase
          .from('lead_interactions')
          .upsert({
            user_id: user.id,
            place_id: placeId,
            status,
            note: current[placeId]?.note || '',
            updated_at: new Date().toISOString(),
          })
          .then(({ error }) => {
            if (error) {
              // Gracefully silent if table is being created
              console.debug('Cloud sync note:', error.message);
            }
          });
      }
    });

    return current;
  } catch (e) {
    console.warn('Error saving lead status:', e);
    return {};
  }
}
