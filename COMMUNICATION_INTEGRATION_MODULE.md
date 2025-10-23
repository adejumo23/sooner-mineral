# Communication Integration Module

## Overview

The Communication Integration Module enables seamless interaction with landowners and stakeholders directly from within the CRM. This includes email, call logging, SMS, and direct mail workflows. The goal is to reduce context-switching, ensure outreach is tracked systematically, and improve communication transparency across the team.

## Key Features

### ✅ Core Functionality
- **Multi-channel Communication**: Email, Call, SMS, and Direct Mail tracking
- **Message Center**: Centralized inbox for all communications
- **Communication History**: Full timeline for contacts and leads
- **Bulk Email Sequencing**: Multi-step automated campaigns
- **Role-based Permissions**: Secure access control
- **Real-time Tracking**: Delivery status and engagement metrics

### ✅ Database Schema
- **Communications Table**: Main communication records
- **Communication Attachments**: File attachments
- **Email Campaigns**: Bulk email campaign management
- **Email Sequence Steps**: Multi-step email automation
- **Campaign Recipients**: Recipient management and tracking
- **Direct Mail Logs**: Physical mail tracking
- **Communication Templates**: Reusable message templates

### ✅ API Endpoints
- **Communications API**: CRUD operations for communications
- **Email Campaigns API**: Campaign management and automation
- **Templates API**: Template management
- **Direct Mail API**: Physical mail tracking
- **Health Check**: System status monitoring

### ✅ UI Components
- **Message Center**: Centralized communication hub
- **Communication Tab**: Contact and lead communication history
- **Bulk Email Tool**: Campaign creation and management
- **Permission System**: Role-based access control

## Technical Implementation

### Database Tables

#### Communications Table
```sql
CREATE TABLE communications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    contact_id VARCHAR(36),
    lead_id VARCHAR(36),
    deal_id VARCHAR(36),
    method ENUM('Email', 'Call', 'SMS', 'Mail'),
    direction ENUM('Inbound', 'Outbound'),
    subject VARCHAR(500),
    message_snippet TEXT,
    full_message TEXT,
    outcome ENUM('No Answer', 'Left Voicemail', 'Sent', 'Bounced', 'Replied', 'Delivered', 'Failed', 'Returned', 'Opened', 'Clicked'),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INT,
    phone_number VARCHAR(20),
    email_address VARCHAR(255),
    campaign_id VARCHAR(36),
    sequence_step INT,
    attachment_count INT DEFAULT 0,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Email Campaigns Table
```sql
CREATE TABLE email_campaigns (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(36) NOT NULL,
    status ENUM('Draft', 'Active', 'Paused', 'Completed', 'Cancelled'),
    total_recipients INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    opened_count INT DEFAULT 0,
    clicked_count INT DEFAULT 0,
    bounced_count INT DEFAULT 0,
    unsubscribed_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### API Endpoints

#### Communications
- `GET /api/communications` - List communications with filtering
- `GET /api/communications/:id` - Get specific communication
- `POST /api/communications` - Create new communication
- `PUT /api/communications/:id` - Update communication
- `GET /api/communications/contact/:contactId` - Get contact communications
- `GET /api/communications/lead/:leadId` - Get lead communications

#### Email Campaigns
- `GET /api/email-campaigns` - List campaigns
- `POST /api/email-campaigns` - Create campaign
- `POST /api/email-campaigns/:id/start` - Start campaign
- `POST /api/email-campaigns/:id/pause` - Pause campaign
- `POST /api/email-campaigns/:id/stop` - Stop campaign

#### Templates
- `GET /api/communication-templates` - List templates
- `POST /api/communication-templates` - Create template
- `PUT /api/communication-templates/:id` - Update template
- `DELETE /api/communication-templates/:id` - Delete template

#### Direct Mail
- `GET /api/direct-mail-logs` - List mail logs
- `POST /api/direct-mail-logs` - Create mail log
- `PUT /api/direct-mail-logs/:id` - Update mail log

### Permission System

#### Role Permissions
- **Admin**: Full access to all communications, campaigns, and private data
- **Manager**: Full access to communications and campaigns, can view private data
- **Buyer**: Access only to assigned communications and campaigns
- **Read-Only**: View-only access to assigned communications

#### Permission Checks
```javascript
const checkPermission = (userRole, requiredPermission) => {
  const permissions = {
    'Admin': ['read_all', 'write_all', 'delete_all', 'manage_campaigns', 'view_private'],
    'Manager': ['read_all', 'write_all', 'manage_campaigns', 'view_private'],
    'Buyer': ['read_assigned', 'write_assigned'],
    'Read-Only': ['read_assigned']
  };
  
  return permissions[userRole]?.includes(requiredPermission) || false;
};
```

### UI Components

#### Message Center (`components/MessageCenter.tsx`)
- Centralized communication hub
- Advanced filtering and search
- Real-time communication tracking
- Bulk operations support

#### Communication Tab (`components/CommunicationTab.tsx`)
- Contact and lead communication history
- New communication creation
- Communication detail viewing
- Timeline-based display

#### Bulk Email Tool (`components/BulkEmailSequencingTool.tsx`)
- Campaign creation and management
- Multi-step sequence builder
- Recipient management
- Campaign analytics

## Usage Examples

### Creating a Communication
```javascript
const communication = {
  user_id: 'user123',
  contact_id: 'contact456',
  method: 'Email',
  direction: 'Outbound',
  subject: 'Mineral Rights Opportunity',
  message_snippet: 'I hope this message finds you well...',
  outcome: 'Sent'
};

const response = await fetch('/api/communications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Role': 'Buyer',
    'X-User-Id': 'user123'
  },
  body: JSON.stringify(communication)
});
```

### Creating an Email Campaign
```javascript
const campaign = {
  name: 'Q4 Outreach Campaign',
  description: 'End-of-year mineral rights acquisition campaign',
  created_by: 'user123'
};

const response = await fetch('/api/email-campaigns', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Role': 'Manager',
    'X-User-Id': 'user123'
  },
  body: JSON.stringify(campaign)
});
```

### Filtering Communications
```javascript
const params = new URLSearchParams({
  method: 'Email',
  outcome: 'Delivered',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  search: 'mineral rights'
});

const response = await fetch(`/api/communications?${params.toString()}`);
```

## Integration Points

### Contact Module Integration
- Communication tab added to contact detail pages
- Communication history linked to contact records
- Contact-specific communication filtering

### Lead Module Integration
- Communication tab added to lead detail pages
- Lead-specific communication tracking
- Communication outcomes linked to lead status

### Assignment Module Integration
- Communications linked to assignments
- Assignment-based communication filtering
- Buyer-specific communication access

## Security Features

### Data Protection
- Role-based access control
- Private communication support
- Audit trail maintenance
- Communication record immutability

### Permission Validation
- API-level permission checks
- UI-level permission filtering
- Database-level access control
- User role validation

## Performance Considerations

### Database Optimization
- Indexed queries for fast retrieval
- Pagination for large datasets
- Connection pooling for scalability
- Query optimization for complex filters

### Caching Strategy
- Communication data caching
- Campaign status caching
- Template caching
- User permission caching

## Monitoring and Analytics

### Communication Metrics
- Delivery rates by method
- Response rates by outcome
- User engagement tracking
- Campaign effectiveness metrics

### System Health
- API response times
- Database connection status
- Error rate monitoring
- User activity tracking

## Future Enhancements

### Planned Features
- **Outlook Integration**: Direct email sync
- **Twilio Integration**: SMS automation
- **Voice Recording**: Call recording and transcription
- **AI Insights**: Communication pattern analysis
- **Mobile App**: Mobile communication management

### Integration Opportunities
- **CRM Systems**: Salesforce, HubSpot integration
- **Email Providers**: Gmail, Outlook API integration
- **Phone Systems**: VoIP integration
- **Document Management**: File attachment handling

## Troubleshooting

### Common Issues
1. **Database Connection**: Check MySQL credentials and port
2. **Permission Errors**: Verify user role and permissions
3. **API Timeouts**: Check server resources and connection limits
4. **Missing Data**: Verify database table creation

### Debug Steps
1. Check server logs for errors
2. Verify database connectivity
3. Test API endpoints individually
4. Check user permissions
5. Validate data formats

## Support

For technical support or questions about the Communication Integration Module:
- Check the API health endpoint: `GET /api/health`
- Review server logs for error messages
- Verify database table creation
- Test with sample data first

## Conclusion

The Communication Integration Module provides a comprehensive solution for managing all communications with landowners and stakeholders. With its robust permission system, multi-channel support, and seamless CRM integration, it enables teams to maintain systematic outreach while ensuring transparency and accountability across all communication activities.
