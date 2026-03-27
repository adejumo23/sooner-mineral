import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { executeQuery } from '../utils/database.js';
import { sendTicketEmail } from '../utils/email.js';

const TICKET_MODULES = [
  'Leads', 'Sections', 'Units', 'Buyer/Assignments', 'Owners/Contacts', 'Unassigned Owners',
  'Message Center', 'Mapping', 'Calendar & Tasks', 'Document Generation', 'Data Import',
  'Acreage Schedule', 'Pricing', 'Reporting', 'ESG Tracking', 'Deals', 'Production',
  'Compliance', 'Financials', 'Users', 'Roles', 'Privileges', 'Other'
];

function id(): string {
  return `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function commentId(): string {
  return `tcomment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function attachmentId(): string {
  return `tattach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const ticketUploadDir = 'uploads/tickets';
if (!fs.existsSync(ticketUploadDir)) {
  fs.mkdirSync(ticketUploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ticketUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf|bmp)$/i.test(file.originalname) ||
      (file.mimetype && /^image\//.test(file.mimetype));
    if (allowed) cb(null, true);
    else cb(new Error('Only images and PDF are allowed'));
  },
});

let ticketsTablesInitialized = false;
async function ensureTicketsTables(pool: Pool | null) {
  if (!pool || ticketsTablesInitialized) return;
  try {
    await executeQuery(pool, `
      CREATE TABLE IF NOT EXISTS tickets (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        module VARCHAR(100) NOT NULL,
        status ENUM('Open', 'In Progress', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
        priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
        requester_id VARCHAR(36) NOT NULL,
        assignee_id VARCHAR(36) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tickets_module (module),
        INDEX idx_tickets_status (status),
        INDEX idx_tickets_requester (requester_id),
        INDEX idx_tickets_assignee (assignee_id),
        INDEX idx_tickets_created (created_at)
      )
    `);
    await executeQuery(pool, `
      CREATE TABLE IF NOT EXISTS ticket_comments (
        id VARCHAR(36) PRIMARY KEY,
        ticket_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ticket_comments_ticket (ticket_id)
      )
    `);
    await executeQuery(pool, `
      CREATE TABLE IF NOT EXISTS ticket_attachments (
        id VARCHAR(36) PRIMARY KEY,
        ticket_id VARCHAR(36) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(512) NOT NULL,
        mime_type VARCHAR(128) NOT NULL,
        uploaded_by VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ticket_attachments_ticket (ticket_id)
      )
    `);
    ticketsTablesInitialized = true;
    console.log('[Tickets] Tables ensured (tickets, ticket_comments, ticket_attachments)');
  } catch (e) {
    console.error('[Tickets] Failed to ensure tables:', e);
  }
}

export const createTicketsRoutes = (dbPool: Pool | null) => {
  const router = Router();

  router.use(async (_req, _res, next) => {
    await ensureTicketsTables(dbPool);
    next();
  });

  const getRequesterAndAssigneeEmails = async (ticketId: string): Promise<{ requesterEmail: string; assigneeEmail: string | null }> => {
    if (!dbPool) return { requesterEmail: '', assigneeEmail: null };
    const rows = await executeQuery(dbPool,
      `SELECT u1.email AS requester_email, u2.email AS assignee_email
       FROM tickets t
       LEFT JOIN users u1 ON t.requester_id = u1.id
       LEFT JOIN users u2 ON t.assignee_id = u2.id
       WHERE t.id = ?`,
      [ticketId]
    );
    const r = (rows as any[])[0];
    return { requesterEmail: r?.requester_email || '', assigneeEmail: r?.assignee_email || null };
  };

  // List tickets
  router.get('/api/tickets', async (req, res) => {
    try {
      if (!dbPool) return res.status(500).json({ success: false, message: 'Database not initialized' });
      const module = req.query.module as string;
      const status = req.query.status as string;
      let sql = `
        SELECT t.*,
          u1.name AS requester_name, u1.email AS requester_email,
          u2.name AS assignee_name, u2.email AS assignee_email
        FROM tickets t
        LEFT JOIN users u1 ON t.requester_id = u1.id
        LEFT JOIN users u2 ON t.assignee_id = u2.id
        WHERE 1=1
      `;
      const params: any[] = [];
      if (module) { sql += ' AND t.module = ?'; params.push(module); }
      if (status) { sql += ' AND t.status = ?'; params.push(status); }
      sql += ' ORDER BY t.created_at DESC';
      const rows = await executeQuery(dbPool, sql, params);
      const tickets = (rows as any[]).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        module: row.module,
        status: row.status,
        priority: row.priority,
        requesterId: row.requester_id,
        assigneeId: row.assignee_id,
        requesterName: row.requester_name,
        assigneeName: row.assignee_name,
        requesterEmail: row.requester_email,
        assigneeEmail: row.assignee_email,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
      res.json({ data: tickets });
    } catch (e: any) {
      console.error('GET /api/tickets', e);
      res.status(500).json({ success: false, message: 'Error fetching tickets', error: e.message });
    }
  });

  // Get one ticket with comments and attachments
  router.get('/api/tickets/:id', async (req, res) => {
    try {
      if (!dbPool) return res.status(500).json({ success: false, message: 'Database not initialized' });
      const { id } = req.params;
      const rows = await executeQuery(dbPool,
        `SELECT t.*,
          u1.name AS requester_name, u1.email AS requester_email,
          u2.name AS assignee_name, u2.email AS assignee_email
         FROM tickets t
         LEFT JOIN users u1 ON t.requester_id = u1.id
         LEFT JOIN users u2 ON t.assignee_id = u2.id
         WHERE t.id = ?`,
        [id]
      );
      const row = (rows as any[])[0];
      if (!row) return res.status(404).json({ success: false, message: 'Ticket not found' });

      const comments = await executeQuery(dbPool,
        `SELECT c.id, c.ticket_id, c.user_id, c.body, c.created_at, u.name AS user_name, u.email AS user_email
         FROM ticket_comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.ticket_id = ?
         ORDER BY c.created_at ASC`,
        [id]
      );
      const attachments = await executeQuery(dbPool,
        'SELECT id, ticket_id, file_name, file_path, mime_type, uploaded_by, created_at FROM ticket_attachments WHERE ticket_id = ? ORDER BY created_at ASC',
        [id]
      );

      const ticket = {
        id: row.id,
        title: row.title,
        description: row.description,
        module: row.module,
        status: row.status,
        priority: row.priority,
        requesterId: row.requester_id,
        assigneeId: row.assignee_id,
        requesterName: row.requester_name,
        assigneeName: row.assignee_name,
        requesterEmail: row.requester_email,
        assigneeEmail: row.assignee_email,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        comments: (comments as any[]).map((c: any) => ({
          id: c.id,
          ticketId: c.ticket_id,
          userId: c.user_id,
          body: c.body,
          createdAt: c.created_at,
          userName: c.user_name,
          userEmail: c.user_email,
        })),
        attachments: (attachments as any[]).map((a: any) => ({
          id: a.id,
          ticketId: a.ticket_id,
          fileName: a.file_name,
          filePath: a.file_path,
          mimeType: a.mime_type,
          uploadedBy: a.uploaded_by,
          createdAt: a.created_at,
        })),
      };
      res.json(ticket);
    } catch (e: any) {
      console.error('GET /api/tickets/:id', e);
      res.status(500).json({ success: false, message: 'Error fetching ticket', error: e.message });
    }
  });

  // Create ticket
  router.post('/api/tickets', async (req, res) => {
    try {
      if (!dbPool) return res.status(500).json({ success: false, message: 'Database not initialized' });
      const { title, description, module, priority, requesterId, assigneeId } = req.body;
      if (!title || !module || !requesterId) {
        return res.status(400).json({ success: false, message: 'title, module, and requesterId are required' });
      }
      const ticketId = id();
      await executeQuery(dbPool,
        `INSERT INTO tickets (id, title, description, module, status, priority, requester_id, assignee_id)
         VALUES (?, ?, ?, ?, 'Open', ?, ?, ?)`,
        [ticketId, title || '', description || '', module, priority || 'Medium', requesterId, assigneeId || null]
      );

      const [requesterRow] = await executeQuery(dbPool, 'SELECT name, email FROM users WHERE id = ?', [requesterId]) as any[];
      const requesterEmail = requesterRow?.email || '';
      let assigneeEmail: string | null = null;
      if (assigneeId) {
        const [assigneeRow] = await executeQuery(dbPool, 'SELECT name, email FROM users WHERE id = ?', [assigneeId]) as any[];
        assigneeEmail = assigneeRow?.email || null;
      }

      const subject = `[Ticket #${ticketId.slice(-8)}] ${title}`;
      const text = `A new ticket has been created.\n\nModule: ${module}\nPriority: ${priority || 'Medium'}\nDescription: ${description || '—'}\n\nYou can view it in the application.`;

      if (requesterEmail) {
        await sendTicketEmail({ to: requesterEmail, subject: `Ticket created: ${title}`, text: `Your ticket has been submitted.\n\n${text}` });
      }
      if (assigneeEmail) {
        await sendTicketEmail({ to: assigneeEmail, subject, text: `You have been assigned to work on this ticket.\n\n${text}` });
      }

      const rows = await executeQuery(dbPool,
        `SELECT t.*, u1.name AS requester_name, u2.name AS assignee_name
         FROM tickets t
         LEFT JOIN users u1 ON t.requester_id = u1.id
         LEFT JOIN users u2 ON t.assignee_id = u2.id
         WHERE t.id = ?`,
        [ticketId]
      );
      const row = (rows as any[])[0];
      res.status(201).json({
        id: row.id,
        title: row.title,
        description: row.description,
        module: row.module,
        status: row.status,
        priority: row.priority,
        requesterId: row.requester_id,
        assigneeId: row.assignee_id,
        requesterName: row.requester_name,
        assigneeName: row.assignee_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    } catch (e: any) {
      console.error('POST /api/tickets', e);
      res.status(500).json({ success: false, message: 'Error creating ticket', error: e.message });
    }
  });

  // Update ticket (status, assignee, etc.)
  router.put('/api/tickets/:id', async (req, res) => {
    try {
      if (!dbPool) return res.status(500).json({ success: false, message: 'Database not initialized' });
      const { id } = req.params;
      const { title, description, status, priority, assigneeId } = req.body;

      const existing = await executeQuery(dbPool, 'SELECT requester_id, assignee_id FROM tickets WHERE id = ?', [id]) as any[];
      if (!existing.length) return res.status(404).json({ success: false, message: 'Ticket not found' });
      const prevAssigneeId = existing[0].assignee_id;

      const updates: string[] = [];
      const params: any[] = [];
      if (title !== undefined) { updates.push('title = ?'); params.push(title); }
      if (description !== undefined) { updates.push('description = ?'); params.push(description); }
      if (status !== undefined) { updates.push('status = ?'); params.push(status); }
      if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }
      if (assigneeId !== undefined) { updates.push('assignee_id = ?'); params.push(assigneeId || null); }
      if (updates.length === 0) {
        const full = await executeQuery(dbPool,
          `SELECT t.*, u1.name AS requester_name, u2.name AS assignee_name FROM tickets t
           LEFT JOIN users u1 ON t.requester_id = u1.id
           LEFT JOIN users u2 ON t.assignee_id = u2.id WHERE t.id = ?`,
          [id]
        ) as any[];
        return res.json(full[0]);
      }
      params.push(id);
      await executeQuery(dbPool, `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`, params);

      const { requesterEmail, assigneeEmail } = await getRequesterAndAssigneeEmails(id);
      const [ticketRow] = await executeQuery(dbPool, 'SELECT title, status FROM tickets WHERE id = ?', [id]) as any[];
      const ticketTitle = ticketRow?.title || 'Ticket';

      if (assigneeId && assigneeId !== prevAssigneeId) {
        const [assigneeRow] = await executeQuery(dbPool, 'SELECT name, email FROM users WHERE id = ?', [assigneeId]) as any[];
        const to = assigneeRow?.email;
        if (to) {
          await sendTicketEmail({
            to,
            subject: `[Ticket] Assigned to you: ${ticketTitle}`,
            text: `You have been assigned to work on this ticket. Please check the application.`,
          });
        }
      }
      if (status !== undefined && requesterEmail) {
        await sendTicketEmail({
          to: requesterEmail,
          subject: `[Ticket] Status update: ${ticketTitle} → ${status}`,
          text: `The status of your ticket has been updated to: ${status}.`,
        });
      }

      const rows = await executeQuery(dbPool,
        `SELECT t.*, u1.name AS requester_name, u2.name AS assignee_name
         FROM tickets t
         LEFT JOIN users u1 ON t.requester_id = u1.id
         LEFT JOIN users u2 ON t.assignee_id = u2.id
         WHERE t.id = ?`,
        [id]
      );
      res.json((rows as any[])[0]);
    } catch (e: any) {
      console.error('PUT /api/tickets/:id', e);
      res.status(500).json({ success: false, message: 'Error updating ticket', error: e.message });
    }
  });

  // Add comment
  router.post('/api/tickets/:id/comments', async (req, res) => {
    try {
      if (!dbPool) return res.status(500).json({ success: false, message: 'Database not initialized' });
      const { id } = req.params;
      const { userId, body } = req.body;
      if (!userId || !body) return res.status(400).json({ success: false, message: 'userId and body are required' });

      const ticketRows = await executeQuery(dbPool, 'SELECT id, requester_id, assignee_id FROM tickets WHERE id = ?', [id]) as any[];
      if (!ticketRows.length) return res.status(404).json({ success: false, message: 'Ticket not found' });
      const ticket = ticketRows[0];

      const commentIdVal = commentId();
      await executeQuery(dbPool,
        'INSERT INTO ticket_comments (id, ticket_id, user_id, body) VALUES (?, ?, ?, ?)',
        [commentIdVal, id, userId, body]
      );

      const [commenter] = await executeQuery(dbPool, 'SELECT name, email FROM users WHERE id = ?', [userId]) as any[];
      const commenterName = commenter?.name || 'Someone';
      const isRequester = ticket.requester_id === userId;
      const notifyUserId = isRequester ? ticket.assignee_id : ticket.requester_id;
      if (notifyUserId) {
        const [notifyUser] = await executeQuery(dbPool, 'SELECT email FROM users WHERE id = ?', [notifyUserId]) as any[];
        const to = notifyUser?.email;
        if (to) {
          await sendTicketEmail({
            to,
            subject: `[Ticket] New comment from ${commenterName}`,
            text: `${commenterName} commented on the ticket: "${body.slice(0, 200)}${body.length > 200 ? '...' : ''}"`,
          });
        }
      }

      const comments = await executeQuery(dbPool,
        `SELECT c.id, c.ticket_id, c.user_id, c.body, c.created_at, u.name AS user_name
         FROM ticket_comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.ticket_id = ? ORDER BY c.created_at ASC`,
        [id]
      );
      res.status(201).json({ comments: comments });
    } catch (e: any) {
      console.error('POST /api/tickets/:id/comments', e);
      res.status(500).json({ success: false, message: 'Error adding comment', error: e.message });
    }
  });

  // Upload attachment
  router.post('/api/tickets/:id/attachments', upload.single('file'), async (req, res) => {
    try {
      if (!dbPool) return res.status(500).json({ success: false, message: 'Database not initialized' });
      const { id } = req.params;
      const file = req.file;
      if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });

      const ticketRows = await executeQuery(dbPool, 'SELECT id FROM tickets WHERE id = ?', [id]) as any[];
      if (!ticketRows.length) return res.status(404).json({ success: false, message: 'Ticket not found' });

      const userId = (req.body as any).userId || req.body.uploadedBy || '';
      const attachId = attachmentId();
      const filePath = path.join(ticketUploadDir, file.filename);
      await executeQuery(dbPool,
        'INSERT INTO ticket_attachments (id, ticket_id, file_name, file_path, mime_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
        [attachId, id, file.originalname, filePath, file.mimetype || 'application/octet-stream', userId]
      );

      const attachments = await executeQuery(dbPool,
        'SELECT id, ticket_id, file_name, file_path, mime_type, uploaded_by, created_at FROM ticket_attachments WHERE ticket_id = ? ORDER BY created_at ASC',
        [id]
      );
      res.status(201).json({ attachments });
    } catch (e: any) {
      console.error('POST /api/tickets/:id/attachments', e);
      res.status(500).json({ success: false, message: 'Error uploading attachment', error: (e as Error).message });
    }
  });

  // Serve attachment (by path stored in DB; frontend will request /api/tickets/:id/attachments/:attachId/download or we serve from /uploads)
  router.get('/api/tickets/attachments/:attachId', async (req, res) => {
    try {
      if (!dbPool) return res.status(500).json({ success: false, message: 'Database not initialized' });
      const { attachId } = req.params;
      const rows = await executeQuery(dbPool, 'SELECT file_path, file_name, mime_type FROM ticket_attachments WHERE id = ?', [attachId]) as any[];
      if (!rows.length) return res.status(404).json({ success: false, message: 'Attachment not found' });
      const filePath = path.resolve(rows[0].file_path);
      if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found' });
      res.sendFile(filePath, { headers: { 'Content-Disposition': `inline; filename="${rows[0].file_name}"` } });
    } catch (e: any) {
      console.error('GET /api/tickets/attachments/:attachId', e);
      res.status(500).json({ success: false, message: 'Error loading attachment', error: e.message });
    }
  });

  // Modules list for dropdown
  router.get('/api/tickets/modules', (_req, res) => {
    res.json({ modules: TICKET_MODULES });
  });

  return router;
};
