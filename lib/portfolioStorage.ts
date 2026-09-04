import { LeadStatus, FactoryLead } from './types';
import { supabase } from './supabase';

export interface PortfolioLeadRecord {
  placeId: string;
  status: LeadStatus;
  note: string;
  addedAt: string;
  leadData?: FactoryLead;
}

const STORAGE_KEY_PREFIX = 'b2b_portfolio_leads_';

export function getPortfolioRecords(userId: string = 'default'): Record<string, PortfolioLeadRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (raw && raw !== 'undefined' && raw !== 'null' && raw.trim() !== '') {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
  } catch (e) {
    console.warn('Error reading portfolio records:', e);
  }
  return {};
}

export function isLeadInPortfolio(placeId: string, userId: string = 'default'): boolean {
  const records = getPortfolioRecords(userId);
  return !!records[placeId];
}

export function addToPortfolio(
  lead: FactoryLead,
  status: LeadStatus = 'NEW',
  note: string = '',
  userId: string = 'default'
): Record<string, PortfolioLeadRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const records = getPortfolioRecords(userId);
    records[lead.place_id] = {
      placeId: lead.place_id,
      status,
      note,
      addedAt: new Date().toISOString(),
      leadData: lead,
    };

    // Save to local storage
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(records));

    // Broadcast event
    window.dispatchEvent(new CustomEvent('portfolio_updated', { detail: { placeId: lead.place_id, action: 'add' } }));

    // Sync with Supabase Cloud in background
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('lead_interactions')
          .upsert({
            user_id: user.id,
            place_id: lead.place_id,
            status,
            note,
            updated_at: new Date().toISOString(),
          })
          .then(() => {});
      }
    });

    return records;
  } catch (e) {
    console.warn('Error adding to portfolio:', e);
    return {};
  }
}

export function removeFromPortfolio(
  placeId: string,
  userId: string = 'default'
): Record<string, PortfolioLeadRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const records = getPortfolioRecords(userId);
    delete records[placeId];

    // Save to local storage
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(records));

    // Broadcast event
    window.dispatchEvent(new CustomEvent('portfolio_updated', { detail: { placeId, action: 'remove' } }));

    // Delete in Supabase Cloud in background
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('lead_interactions')
          .delete()
          .match({ user_id: user.id, place_id: placeId })
          .then(() => {});
      }
    });

    return records;
  } catch (e) {
    console.warn('Error removing from portfolio:', e);
    return {};
  }
}

export function updatePortfolioLead(
  placeId: string,
  status: LeadStatus,
  note?: string,
  userId: string = 'default'
): Record<string, PortfolioLeadRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const records = getPortfolioRecords(userId);
    if (records[placeId]) {
      records[placeId].status = status;
      if (note !== undefined) records[placeId].note = note;
      records[placeId].addedAt = new Date().toISOString();

      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(records));
      window.dispatchEvent(new CustomEvent('portfolio_updated', { detail: { placeId, action: 'update', status, note } }));

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from('lead_interactions')
            .upsert({
              user_id: user.id,
              place_id: placeId,
              status,
              note: records[placeId].note,
              updated_at: new Date().toISOString(),
            })
            .then(() => {});
        }
      });
    }
    return records;
  } catch (e) {
    console.warn('Error updating portfolio lead:', e);
    return {};
  }
}
