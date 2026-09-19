import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET: Fetch Company Leads Portfolio
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const company_id = searchParams.get('company_id');
    const user_id = searchParams.get('user_id');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();

    if (!company_id || !UUID_REGEX.test(company_id)) {
      return NextResponse.json({ success: true, count: 0, leads: [] });
    }

    const conditions = ['cl.company_id = $1'];
    const values: any[] = [company_id];
    let paramIdx = 2;

    if (user_id === 'UNASSIGNED' || user_id === 'POOL') {
      conditions.push('cl.user_id IS NULL');
    } else if (user_id && user_id !== 'ALL' && UUID_REGEX.test(user_id)) {
      conditions.push(`cl.user_id = $${paramIdx++}`);
      values.push(user_id);
    }


    if (status && status !== 'ALL') {
      conditions.push(`cl.status = $${paramIdx++}`);
      values.push(status);
    }

    if (search) {
      conditions.push(`(cl.company_name ILIKE $${paramIdx} OR cl.tax_id ILIKE $${paramIdx} OR cl.notes ILIKE $${paramIdx})`);
      values.push(`%${search}%`);
      paramIdx++;
    }

    const query = `
      SELECT 
        cl.*,
        p.full_name as sales_rep_name,
        p.email as sales_rep_email,
        p.avatar_url as sales_rep_avatar
      FROM public.company_leads cl
      LEFT JOIN public.profiles p ON cl.user_id = p.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY cl.created_at DESC;
    `;

    const res = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      count: res.rows.length,
      leads: res.rows,
    });
  } catch (err: any) {
    console.error('Error fetching portfolio:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH: Update Portfolio Lead (Status, Notes, Deal Value, Priority, Assignee) or Batch Assign
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, company_id, status, notes, deal_value, priority, user_id, contact_person, phone, email, action, lead_ids, target_user_id } = body;

    // Handle Batch Assign from Company Pool
    if (action === 'batch_assign') {
      if (!company_id || !Array.isArray(lead_ids) || lead_ids.length === 0) {
        return NextResponse.json({ success: false, error: 'company_id and lead_ids array are required' }, { status: 400 });
      }

      const effectiveUserId = target_user_id && target_user_id !== 'UNASSIGNED' ? target_user_id : null;
      const res = await pool.query(
        `UPDATE public.company_leads SET user_id = $1, updated_at = NOW(), last_activity_at = NOW() WHERE id = ANY($2::uuid[]) AND company_id = $3 RETURNING id`,
        [effectiveUserId, lead_ids, company_id]
      );

      // Log assignment activity
      if (effectiveUserId && res.rows.length > 0) {
        try {
          const assigneeRes = await pool.query(`SELECT full_name, email FROM public.profiles WHERE id = $1`, [effectiveUserId]);
          const assigneeName = assigneeRes.rows[0]?.full_name || assigneeRes.rows[0]?.email || 'เซลส์ในทีม';
          for (const row of res.rows) {
            await pool.query(
              `INSERT INTO public.lead_activities (company_id, company_lead_id, user_id, activity_type, content)
               VALUES ($1, $2, $3, 'NOTE', $4);`,
              [company_id, row.id, effectiveUserId, `👥 ได้รับมอบหมายงานจากคลังกลางให้คุณ "${assigneeName}" ดูแล`]
            );
          }
        } catch (e) {}
      }

      return NextResponse.json({
        success: true,
        message: effectiveUserId ? `มอบหมายลูกค้า ${res.rows.length} แห่งให้เซลส์เรียบร้อย` : `ย้ายลูกค้า ${res.rows.length} แห่งเข้าคลังกลางเรียบร้อย`,
        assignedCount: res.rows.length,
      });
    }

    if (!id || !company_id) {
      return NextResponse.json(
        { success: false, error: 'id and company_id are required' },
        { status: 400 }
      );
    }


    const updates: string[] = ['updated_at = NOW()', 'last_activity_at = NOW()'];
    const values: any[] = [id, company_id];
    let paramIdx = 3;

    if (status !== undefined) {
      updates.push(`status = $${paramIdx++}`);
      values.push(status);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIdx++}`);
      values.push(notes);
    }
    if (deal_value !== undefined) {
      updates.push(`deal_value = $${paramIdx++}`);
      values.push(deal_value);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIdx++}`);
      values.push(priority);
    }
    if (user_id !== undefined) {
      updates.push(`user_id = $${paramIdx++}`);
      values.push(user_id);
    }
    if (contact_person !== undefined) {
      updates.push(`contact_person = $${paramIdx++}`);
      values.push(contact_person);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIdx++}`);
      values.push(phone);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIdx++}`);
      values.push(email);
    }

    // Fetch previous lead state to detect REAL changes and prevent duplicate logs
    const oldRes = await pool.query(
      `SELECT status, deal_value, priority, user_id FROM public.company_leads WHERE id = $1 AND company_id = $2`,
      [id, company_id]
    );

    if (oldRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lead not found or unauthorized' },
        { status: 404 }
      );
    }

    const oldLead = oldRes.rows[0];

    const query = `
      UPDATE public.company_leads
      SET ${updates.join(', ')}
      WHERE id = $1 AND company_id = $2
      RETURNING *;
    `;

    const res = await pool.query(query, values);
    const updatedLead = res.rows[0];

    // Auto-log status / deal_value / priority updates into lead_activities timeline ONLY if values actually changed
    try {
      const statusLabels: Record<string, string> = {
        NEW: 'ลูกค้าใหม่',
        CONTACTED: 'โทรติดต่อแล้ว',
        QUOTED: 'เสนอราคาแล้ว',
        MEETING: 'นัดหมายพบลูกค้า',
        WON: 'ปิดการขายสำเร็จ'
      };
      const priorityLabels: Record<string, string> = {
        LOW: 'ต่ำ',
        MEDIUM: 'ปานกลาง',
        HIGH: 'สำคัญมาก',
        URGENT: 'ด่วนพิเศษ'
      };

      const changes: string[] = [];
      if (status !== undefined && status !== oldLead.status) {
        changes.push(`สถานะ: ${statusLabels[status] || status}`);
      }
      if (deal_value !== undefined && Number(deal_value) !== Number(oldLead.deal_value || 0)) {
        changes.push(`มูลค่าดีล: ฿${Number(deal_value).toLocaleString()}`);
      }
      if (priority !== undefined && priority !== (oldLead.priority || 'MEDIUM')) {
        changes.push(`ความสำคัญ: ${priorityLabels[priority] || priority}`);
      }

      if (changes.length > 0) {
        await pool.query(
          `INSERT INTO public.lead_activities (company_id, company_lead_id, user_id, activity_type, content, status_change, deal_value_change)
           VALUES ($1, $2, $3, 'STATUS_CHANGE', $4, $5, $6);`,
          [
            company_id,
            id,
            user_id || updatedLead.user_id,
            `🔄 อัปเดตข้อมูล CRM: ${changes.join(' • ')}`,
            status || null,
            deal_value !== undefined ? deal_value : null
          ]
        );
      }
    } catch (logErr) {
      console.warn('Auto-log lead activity failed:', logErr);
    }

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      message: 'อัปเดตข้อมูลพอร์ตสำเร็จ',
    });
  } catch (err: any) {
    console.error('Error updating portfolio lead:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Release Lead from Portfolio or Permanently remove from company
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    const id = searchParams.get('id') || body.id;
    const company_id = searchParams.get('company_id') || body.company_id;
    const mode = searchParams.get('mode') || body.mode; // 'permanent' for hard delete, default: 'pool'
    const user_id = searchParams.get('user_id') || body.user_id;
    const reason_key = searchParams.get('reason_key') || body.reason_key || '';
    const reason_label = searchParams.get('reason_label') || body.reason_label || '';
    const note = searchParams.get('note') || body.note || '';

    if (!id || !company_id) {
      return NextResponse.json(
        { success: false, error: 'id and company_id are required' },
        { status: 400 }
      );
    }

    if (mode === 'permanent') {
      await pool.query(
        `DELETE FROM public.company_leads WHERE id = $1 AND company_id = $2;`,
        [id, company_id]
      );
      return NextResponse.json({
        success: true,
        message: 'ถอนการจองและส่งคืนสู่ศูนย์รวมข้อมูลเรียบร้อยแล้ว',
      });
    }

    // Default: Soft Release to Company Unassigned Pool (user_id = NULL)
    let updateQuery = `UPDATE public.company_leads SET user_id = NULL, updated_at = NOW(), last_activity_at = NOW() WHERE id = $1 AND company_id = $2 RETURNING *;`;
    let queryParams: any[] = [id, company_id];

    if (reason_label) {
      const formattedNote = note
        ? `[เหตุผลที่คืนคลัง]: ${reason_label} • โน้ต: ${note}`
        : `[เหตุผลที่คืนคลัง]: ${reason_label}`;
      updateQuery = `UPDATE public.company_leads SET user_id = NULL, notes = $3, updated_at = NOW(), last_activity_at = NOW() WHERE id = $1 AND company_id = $2 RETURNING *;`;
      queryParams = [id, company_id, formattedNote];
    }

    const res = await pool.query(updateQuery, queryParams);

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // Log the release activity to timeline
    try {
      const timelineContent = reason_label
        ? note
          ? `📥 คืนลูกค้าเข้าคลังกลาง\n• สาเหตุ: ${reason_label}\n• รายละเอียด: ${note}`
          : `📥 คืนลูกค้าเข้าคลังกลาง\n• สาเหตุ: ${reason_label}`
        : '📥 เซลส์ปล่อยลูกค้าออกจากพอร์ตส่วนตัว ส่งคืนเข้าสู่คลังลูกค้ารอจัดสรรของบริษัท';

      await pool.query(
        `INSERT INTO public.lead_activities (company_id, company_lead_id, user_id, activity_type, content)
         VALUES ($1, $2, $3, 'NOTE', $4);`,
        [company_id, id, user_id || null, timelineContent]
      );
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'ส่งคืนลูกค้ารายนี้เข้าสู่ "คลังลูกค้ารอจัดสรร" เรียบร้อยแล้ว',
    });
  } catch (err: any) {
    console.error('Error releasing portfolio lead:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
