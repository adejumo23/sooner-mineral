# Support Ticket System

A comprehensive ticketing system module for the Sooner Mineral application that allows users to report issues and administrators to manage support requests.

## Features

### User Features
- **Create Support Tickets**: Users can submit detailed issue reports with:
  - Title and description
  - Category selection (Bug Report, Feature Request, UI Issue, etc.)
  - Priority level (Critical, High, Medium, Low)
  - Automatic capture of technical information (browser, page URL, user agent)
  - Module identification

- **View Ticket Status**: Users can track their submitted tickets and see updates

### Administrator Features
- **Ticket Dashboard**: Comprehensive view of all tickets with:
  - Statistics overview (total, open, in progress, resolved, closed)
  - Filtering by status, priority, category, and search
  - Pagination for large ticket volumes
  - Real-time updates

- **Ticket Management**: 
  - View detailed ticket information
  - Update ticket status and priority
  - Assign tickets to team members
  - Add resolution notes
  - Edit ticket details

- **Email Notifications**: Automatic email alerts for:
  - New ticket creation
  - Ticket updates
  - Ticket resolution

## Database Schema

The ticketing system uses a normalized database structure with the following tables:

### Core Tables
- `tickets` - Main ticket information
- `ticket_categories` - Issue categories (Bug Report, Feature Request, etc.)
- `ticket_priorities` - Priority levels (Critical, High, Medium, Low)
- `ticket_statuses` - Status tracking (New, Open, In Progress, Resolved, Closed)
- `ticket_comments` - Comments and updates on tickets
- `ticket_notifications` - Notification tracking

### Key Features
- Full audit trail with timestamps
- User assignment and tracking
- Technical information capture
- File attachment support
- Email notification system

## API Endpoints

### Ticket Management
- `GET /api/tickets` - List tickets with filtering and pagination
- `GET /api/tickets/:id` - Get specific ticket details
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Ticket Metadata
- `GET /api/tickets/categories` - Get available categories
- `GET /api/tickets/priorities` - Get priority levels
- `GET /api/tickets/statuses` - Get status options

### Comments
- `GET /api/tickets/:id/comments` - Get ticket comments
- `POST /api/tickets/:id/comments` - Add comment
- `PUT /api/tickets/:id/comments/:commentId` - Update comment
- `DELETE /api/tickets/:id/comments/:commentId` - Delete comment

### Statistics
- `GET /api/tickets/statistics` - Get ticket statistics

## Email Notifications

The system includes a comprehensive email notification service:

### Email Templates
- **New Ticket Notification**: Sent to administrators when a new ticket is created
- **Ticket Update Notification**: Sent when ticket status or details are updated
- **Ticket Resolved Notification**: Sent when a ticket is marked as resolved

### Configuration
Email service can be configured via environment variables:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@sooner-mineral.com
APP_URL=http://localhost:3000
```

## File Structure

```
components/
├── TicketForm.tsx          # Ticket creation form
├── TicketDashboard.tsx     # Admin dashboard for ticket management
└── icons/
    └── Icons.tsx          # ExclamationTriangleIcon for tickets

pages/
├── TicketsPage.tsx        # Main tickets page
├── TicketFormPage.tsx     # Ticket creation page
└── TicketDetailPage.tsx   # Individual ticket view

services/
├── ticketApi.ts           # Ticket API service with mock data
└── emailService.ts        # Email notification service

database/
└── ticket_system_schema.sql # Database schema for tickets
```

## Usage

### For Users
1. Navigate to "Support Tickets" in the sidebar
2. Click "Create New Ticket"
3. Fill out the form with issue details
4. Submit the ticket
5. Receive confirmation and ticket number

### For Administrators
1. Navigate to "Support Tickets" in the sidebar
2. View the dashboard with ticket statistics
3. Filter and search tickets as needed
4. Click on a ticket to view details
5. Update status, priority, or add comments
6. Assign tickets to team members

## Integration

The ticketing system is fully integrated with the existing Sooner Mineral application:

- **Navigation**: Added to the main sidebar with appropriate icon
- **Routing**: Integrated with React Router for seamless navigation
- **Authentication**: Uses existing user authentication system
- **Styling**: Consistent with the application's design system
- **Database**: Extends the existing normalized database schema

## Development

### Mock Data
The system includes comprehensive mock data for development and testing:
- Sample tickets with various statuses and priorities
- Mock email service for testing notifications
- Realistic user and technical data

### Testing
To test the system:
1. Start the development server
2. Navigate to `/tickets`
3. Create a new ticket
4. Check the browser console for email notification logs
5. View the ticket in the dashboard

## Future Enhancements

Potential improvements for the ticketing system:
- Real-time notifications using WebSockets
- File upload support for screenshots and documents
- Advanced reporting and analytics
- Integration with external ticketing systems
- Mobile-responsive design improvements
- Automated ticket routing based on category
- SLA tracking and escalation rules

## Support

For issues with the ticketing system itself, please contact the development team or create a ticket using the system (meta-ticketing!).
