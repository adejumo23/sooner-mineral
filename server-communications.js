import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3053;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
let dbPool;

const initializeDatabase = async () => {
  try {
    dbPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3359,
      user: process.env.MYSQL_USER || 'soonermineral',
      password: process.env.MYSQL_PASSWORD || 'soonermineralpass',
      database: process.env.MYSQL_DATABASE || 'soonermineraldb',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000
    });

    console.log('✅ Communication database connection pool created');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Execute query helper
const executeQuery = async (query, params = []) => {
  try {
    const [rows] = await dbPool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// ============================================================================
// PERMISSION HELPERS
// ============================================================================

const checkPermission = (userRole, requiredPermission) => {
  const permissions = {
    'Admin': ['read_all', 'write_all', 'delete_all', 'manage_campaigns', 'view_private'],
    'Manager': ['read_all', 'write_all', 'manage_campaigns', 'view_private'],
    'Buyer': ['read_assigned', 'write_assigned'],
    'Read-Only': ['read_assigned']
  };
  
  return permissions[userRole]?.includes(requiredPermission) || false;
};

const checkCommunicationAccess = (userRole, userId, communication) => {
  // Admin and Manager can see all communications
  if (checkPermission(userRole, 'read_all')) {
    return true;
  }
  
  // Buyers can only see communications they created or are assigned to
  if (checkPermission(userRole, 'read_assigned')) {
    return communication.user_id === userId || 
           communication.assigned_to === userId;
  }
  
  return false;
};

// ============================================================================
// COMMUNICATION API ENDPOINTS
// ============================================================================

// Get all communications with filtering and pagination
app.get('/api/communications', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    // Extract user info from headers (in real implementation, this would come from JWT token)
    const userRole = req.headers['x-user-role'] || 'Buyer';
    const userId = req.headers['x-user-id'] || '';

    const {
      page = 1,
      limit = 50,
      method,
      outcome,
      user_id,
      contact_id,
      lead_id,
      start_date,
      end_date,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];

    // Add permission-based filtering
    if (!checkPermission(userRole, 'read_all')) {
      // Buyers and Read-Only users can only see their own communications
      whereConditions.push('c.user_id = ?');
      queryParams.push(userId);
    }

    // Build WHERE conditions
    if (method) {
      whereConditions.push('c.method = ?');
      queryParams.push(method);
    }
    if (outcome) {
      whereConditions.push('c.outcome = ?');
      queryParams.push(outcome);
    }
    if (user_id) {
      whereConditions.push('c.user_id = ?');
      queryParams.push(user_id);
    }
    if (contact_id) {
      whereConditions.push('c.contact_id = ?');
      queryParams.push(contact_id);
    }
    if (lead_id) {
      whereConditions.push('c.lead_id = ?');
      queryParams.push(lead_id);
    }
    if (start_date) {
      whereConditions.push('c.timestamp >= ?');
      queryParams.push(start_date);
    }
    if (end_date) {
      whereConditions.push('c.timestamp <= ?');
      queryParams.push(end_date);
    }
    if (search) {
      whereConditions.push('(c.subject LIKE ? OR c.message_snippet LIKE ? OR co.name LIKE ? OR l.lead_name LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filter out private communications for non-admin/manager users
    if (!checkPermission(userRole, 'view_private')) {
      whereConditions.push('c.is_private = FALSE');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM communications c
      LEFT JOIN contacts co ON c.contact_id = co.id
      LEFT JOIN leads l ON c.lead_id = l.id
      ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Get communications with user and contact details
    const communicationsQuery = `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        co.name as contact_name,
        co.email as contact_email,
        co.phone as contact_phone,
        l.lead_name,
        d.deal_name
      FROM communications c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN contacts co ON c.contact_id = co.id
      LEFT JOIN leads l ON c.lead_id = l.id
      LEFT JOIN deals d ON c.deal_id = d.id
      ${whereClause}
      ORDER BY c.timestamp DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), offset);
    const communications = await executeQuery(communicationsQuery, queryParams);

    res.json({
      success: true,
      data: communications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching communications', 
      error: error.message 
    });
  }
});

// Get communication by ID
app.get('/api/communications/:id', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;

    const query = `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        co.name as contact_name,
        co.email as contact_email,
        co.phone as contact_phone,
        l.lead_name,
        d.deal_name
      FROM communications c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN contacts co ON c.contact_id = co.id
      LEFT JOIN leads l ON c.lead_id = l.id
      LEFT JOIN deals d ON c.deal_id = d.id
      WHERE c.id = ?
    `;

    const communications = await executeQuery(query, [id]);

    if (communications.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Communication not found' 
      });
    }

    // Get attachments
    const attachmentsQuery = `
      SELECT * FROM communication_attachments 
      WHERE communication_id = ?
    `;
    const attachments = await executeQuery(attachmentsQuery, [id]);

    res.json({
      success: true,
      data: {
        ...communications[0],
        attachments
      }
    });
  } catch (error) {
    console.error('Error fetching communication:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching communication', 
      error: error.message 
    });
  }
});

// Create new communication
app.post('/api/communications', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    // Extract user info from headers
    const userRole = req.headers['x-user-role'] || 'Buyer';
    const userId = req.headers['x-user-id'] || '';

    // Check write permission
    if (!checkPermission(userRole, 'write_all') && !checkPermission(userRole, 'write_assigned')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create communications'
      });
    }

    const {
      user_id,
      contact_id,
      lead_id,
      deal_id,
      method,
      direction,
      subject,
      message_snippet,
      full_message,
      outcome,
      duration_seconds,
      phone_number,
      email_address,
      campaign_id,
      sequence_step,
      attachment_count,
      is_private
    } = req.body;

    // Validate required fields
    if (!user_id || !method || !direction || !outcome) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: user_id, method, direction, outcome'
      });
    }

    // Check if user can create private communications
    if (is_private && !checkPermission(userRole, 'view_private')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create private communications'
      });
    }

    const communicationId = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const insertQuery = `
      INSERT INTO communications (
        id, user_id, contact_id, lead_id, deal_id, method, direction,
        subject, message_snippet, full_message, outcome, duration_seconds,
        phone_number, email_address, campaign_id, sequence_step,
        attachment_count, is_private
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(insertQuery, [
      communicationId, user_id, contact_id, lead_id, deal_id, method, direction,
      subject, message_snippet, full_message, outcome, duration_seconds,
      phone_number, email_address, campaign_id, sequence_step,
      attachment_count, is_private
    ]);

    res.json({
      success: true,
      message: 'Communication created successfully',
      data: { id: communicationId }
    });
  } catch (error) {
    console.error('Error creating communication:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating communication', 
      error: error.message 
    });
  }
});

// Update communication
app.put('/api/communications/:id', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { id } = req.params;
    const {
      outcome,
      full_message,
      duration_seconds,
      is_private
    } = req.body;

    const updateQuery = `
      UPDATE communications 
      SET outcome = ?, full_message = ?, duration_seconds = ?, is_private = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await executeQuery(updateQuery, [outcome, full_message, duration_seconds, is_private, id]);

    res.json({
      success: true,
      message: 'Communication updated successfully'
    });
  } catch (error) {
    console.error('Error updating communication:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating communication', 
      error: error.message 
    });
  }
});

// Get communications for a specific contact
app.get('/api/communications/contact/:contactId', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { contactId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        l.lead_name,
        d.deal_name
      FROM communications c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN leads l ON c.lead_id = l.id
      LEFT JOIN deals d ON c.deal_id = d.id
      WHERE c.contact_id = ?
      ORDER BY c.timestamp DESC
      LIMIT ? OFFSET ?
    `;

    const communications = await executeQuery(query, [contactId, parseInt(limit), offset]);

    res.json({
      success: true,
      data: communications
    });
  } catch (error) {
    console.error('Error fetching contact communications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching contact communications', 
      error: error.message 
    });
  }
});

// Get communications for a specific lead
app.get('/api/communications/lead/:leadId', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { leadId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        co.name as contact_name,
        co.email as contact_email,
        d.deal_name
      FROM communications c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN contacts co ON c.contact_id = co.id
      LEFT JOIN deals d ON c.deal_id = d.id
      WHERE c.lead_id = ?
      ORDER BY c.timestamp DESC
      LIMIT ? OFFSET ?
    `;

    const communications = await executeQuery(query, [leadId, parseInt(limit), offset]);

    res.json({
      success: true,
      data: communications
    });
  } catch (error) {
    console.error('Error fetching lead communications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching lead communications', 
      error: error.message 
    });
  }
});

// ============================================================================
// EMAIL CAMPAIGNS API ENDPOINTS
// ============================================================================

// Get all email campaigns
app.get('/api/email-campaigns', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    // Extract user info from headers
    const userRole = req.headers['x-user-role'] || 'Buyer';
    const userId = req.headers['x-user-id'] || '';

    // Check campaign management permission
    if (!checkPermission(userRole, 'manage_campaigns') && !checkPermission(userRole, 'read_all')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view email campaigns'
      });
    }

    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];

    if (status) {
      whereClause = 'WHERE ec.status = ?';
      queryParams.push(status);
    }

    const query = `
      SELECT 
        ec.*,
        u.name as created_by_name
      FROM email_campaigns ec
      LEFT JOIN users u ON ec.created_by = u.id
      ${whereClause}
      ORDER BY ec.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), offset);
    const campaigns = await executeQuery(query, queryParams);

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    console.error('Error fetching email campaigns:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching email campaigns', 
      error: error.message 
    });
  }
});

// Create new email campaign
app.post('/api/email-campaigns', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const {
      name,
      description,
      created_by,
      status = 'Draft'
    } = req.body;

    if (!name || !created_by) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, created_by'
      });
    }

    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const insertQuery = `
      INSERT INTO email_campaigns (id, name, description, created_by, status)
      VALUES (?, ?, ?, ?, ?)
    `;

    await executeQuery(insertQuery, [campaignId, name, description, created_by, status]);

    res.json({
      success: true,
      message: 'Email campaign created successfully',
      data: { id: campaignId }
    });
  } catch (error) {
    console.error('Error creating email campaign:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating email campaign', 
      error: error.message 
    });
  }
});

// ============================================================================
// COMMUNICATION TEMPLATES API ENDPOINTS
// ============================================================================

// Get all communication templates
app.get('/api/communication-templates', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { type, is_public } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (type) {
      whereConditions.push('type = ?');
      queryParams.push(type);
    }
    if (is_public !== undefined) {
      whereConditions.push('is_public = ?');
      queryParams.push(is_public === 'true');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        ct.*,
        u.name as created_by_name
      FROM communication_templates ct
      LEFT JOIN users u ON ct.created_by = u.id
      ${whereClause}
      ORDER BY ct.created_at DESC
    `;

    const templates = await executeQuery(query, queryParams);

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching communication templates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching communication templates', 
      error: error.message 
    });
  }
});

// ============================================================================
// DIRECT MAIL LOGS API ENDPOINTS
// ============================================================================

// Get all direct mail logs
app.get('/api/direct-mail-logs', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const { page = 1, limit = 50, status, contact_id, lead_id } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];

    if (status) {
      whereConditions.push('dml.status = ?');
      queryParams.push(status);
    }
    if (contact_id) {
      whereConditions.push('dml.contact_id = ?');
      queryParams.push(contact_id);
    }
    if (lead_id) {
      whereConditions.push('dml.lead_id = ?');
      queryParams.push(lead_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        dml.*,
        co.name as contact_name,
        co.email as contact_email,
        l.lead_name,
        u.name as sent_by_name
      FROM direct_mail_logs dml
      LEFT JOIN contacts co ON dml.contact_id = co.id
      LEFT JOIN leads l ON dml.lead_id = l.id
      LEFT JOIN users u ON dml.sent_by = u.id
      ${whereClause}
      ORDER BY dml.sent_date DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), offset);
    const mailLogs = await executeQuery(query, queryParams);

    res.json({
      success: true,
      data: mailLogs
    });
  } catch (error) {
    console.error('Error fetching direct mail logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching direct mail logs', 
      error: error.message 
    });
  }
});

// Create new direct mail log
app.post('/api/direct-mail-logs', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ success: false, message: 'Database pool not initialized' });
    }

    const {
      contact_id,
      lead_id,
      mail_type,
      subject,
      content_summary,
      sent_by,
      sent_date,
      tracking_number,
      status = 'Sent',
      return_reason,
      notes
    } = req.body;

    if (!contact_id || !mail_type || !sent_by || !sent_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: contact_id, mail_type, sent_by, sent_date'
      });
    }

    const mailLogId = `mail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const insertQuery = `
      INSERT INTO direct_mail_logs (
        id, contact_id, lead_id, mail_type, subject, content_summary,
        sent_by, sent_date, tracking_number, status, return_reason, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(insertQuery, [
      mailLogId, contact_id, lead_id, mail_type, subject, content_summary,
      sent_by, sent_date, tracking_number, status, return_reason, notes
    ]);

    res.json({
      success: true,
      message: 'Direct mail log created successfully',
      data: { id: mailLogId }
    });
  } catch (error) {
    console.error('Error creating direct mail log:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating direct mail log', 
      error: error.message 
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({ 
        status: 'ERROR', 
        message: 'Database pool not initialized',
        timestamp: new Date().toISOString()
      });
    }

    // Test database connection
    await executeQuery('SELECT 1');
    
    res.json({
      status: 'OK',
      message: 'Communication API server is running',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Communication API server running on port ${PORT}`);
      console.log(`📊 Database: MySQL (soonermineraldb)`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
