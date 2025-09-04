# Clay Cafe Database Management System

A modern React web application for managing customers and ceramic pieces at Clay Cafe, a ceramics workshop. The application provides comprehensive CRUD functionality with email/SMS notification capabilities for pickup alerts.

## Features

### 🏺 Customer Management
- Add, edit, and delete customer information
- Track customer contact details (email, phone, Instagram)
- Check-in status management
- Customer search and filtering

### 🎨 Piece Tracking
- Complete ceramic piece lifecycle management
- Track piece types (handbuilding, painting, glaze, wheel-throwing)
- Status tracking from creation to pickup
- Payment status monitoring (clay and glaze payments)
- Cubic inches and pricing tracking

### 📱 Notifications
- Email notifications for pickup alerts
- SMS notifications (when phone number available)
- Customizable notification templates
- Batch notification capabilities

### 📊 Dashboard & Analytics
- Overview dashboard with key statistics
- Real-time piece status tracking
- Revenue tracking and unpaid piece alerts
- Responsive design for all devices

### 🔍 Search & Filtering
- Global search across customers and pieces
- Status-based filtering
- Advanced filtering options
- Real-time search results

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom Clay Cafe theme
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns
- **Storage**: Local Storage (easily upgradeable to backend)

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd clay-cafe-database
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.

## Data Structure

### Customer
- Personal information (name, email, phone, Instagram)
- Check-in status
- Creation and update timestamps

### Piece
- Customer association
- Type and current status
- Pricing and payment information
- Physical measurements (cubic inches)
- Notes and special instructions
- Timeline tracking (ready for pickup, picked up dates)

## Ceramics Pipeline Status

The application tracks pieces through the following stages:
1. **Created** - Initial piece creation
2. **Drying** - Piece is drying
3. **Bisque Fired** - First firing complete
4. **Glazed** - Glazing applied
5. **Final Fired** - Final firing complete
6. **Ready for Pickup** - Available for customer pickup
7. **Picked Up** - Customer has collected the piece

## Notification System

The notification system is designed to be easily integrated with real email/SMS services:

- **Email**: Currently simulated, ready for SendGrid, AWS SES, etc.
- **SMS**: Currently simulated, ready for Twilio, AWS SNS, etc.
- **Templates**: Customizable message templates with customer name substitution

## Customization

### Adding New Piece Types
Edit the `pieceTypes` array in `src/components/PieceForm.tsx`:

```typescript
const pieceTypes = [
  { value: 'handbuilding', label: 'Handbuilding' },
  { value: 'painting', label: 'Painting' },
  { value: 'glaze', label: 'Glaze' },
  { value: 'wheel-throwing', label: 'Wheel Throwing' },
  // Add new types here
];
```

### Customizing Notifications
Modify notification templates in `src/services/notificationService.ts`:

```typescript
private emailTemplate = 'Your custom email template here...';
private smsTemplate = 'Your custom SMS template here...';
```

### Styling
The application uses Tailwind CSS with a custom Clay Cafe theme. Modify `tailwind.config.js` to adjust colors and styling.

## Future Enhancements

- [ ] Backend API integration
- [ ] User authentication and roles
- [ ] Advanced reporting and analytics
- [ ] Inventory management
- [ ] Appointment scheduling
- [ ] Payment processing integration
- [ ] Mobile app development
- [ ] Multi-location support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team or create an issue in the repository.
