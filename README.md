# GERMAN - Edintel Internal Management Platform

## Overview

GERMAN is an enterprise-level internal management platform developed for Edintel S.A., featuring two core modules:

1. **Expense Audit Module**: A comprehensive expense management and approval system for handling employee expense reports, including multi-level approval workflows and document management.

2. **Post-Venta Management Module**: A service ticket management system for handling post-sale technical services, including location management, ticket tracking, and technician assignment.

## To be implemented

A list of the modules that will be implemented in the future:

1. **Overtime Report Module**: This module will allows the workers to upload their overtime to be reviewed and approved.

2. **Commercial Management Module**: Pipelined Commercial department module that will allow them to easily do their work without unnecesary extra steps.

3. **In-app Post-Venta Report Forms**: Instead of using Word or Excel docs to fill up the reports, there will be in app forms to easily fill it up.

## Technical Architecture

### Core Technologies

- **Frontend**: React 18.3.1
- **Authentication**: Microsoft Azure AD (MSAL)
- **API Integration**: Microsoft Graph API
- **Storage**: SharePoint Lists and Document Libraries
- **State Management**: React Context API
- **Styling**: Tailwind CSS with custom design system
- **File Processing**: PapaCSV, SheetJS
- **Data Visualization**: Recharts

### Design Patterns & Architecture

- **Modular Architecture**: Separate modules for Expense Audit and Post-Venta Management
- **Context-Provider Pattern**: For state management and module-specific data handling
- **Custom Hook Pattern**: For reusable business logic and UI behavior
- **Service Layer Pattern**: For API and data access abstraction
- **Compound Components**: For building flexible and reusable UI components

## Prerequisites

- Node.js (v16 or higher)
- Microsoft Azure AD tenant
- SharePoint sites with required lists and libraries
- npm or yarn package manager

## Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd german-platform
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
# .env
REACT_APP_CLIENT_ID=your_azure_client_id
REACT_APP_TENANT_ID=your_azure_tenant_id
REACT_APP_REDIRECT_URI=your_redirect_uri
REACT_APP_SUPPORT_EMAIL=support@email.com
```

4. Start development server:

```bash
npm start
```

## Configuration

### SharePoint Configuration

The platform requires the following SharePoint sites and lists:

#### Expense Audit Module

- Site: "Liquidaciones"
  - Lists:
    - Desglose liquidaciones
    - Departamento
    - Roles

#### Post-Venta Module

- Site: "DocumentosTecnicos"
  - Lists:
    - Control PV
    - Edificios
    - Empresas
    - Sitios
    - Sistemas
    - Roles
    - Docs

### Azure AD Configuration

1. Register application in Azure AD
2. Configure required permissions:
   - User.Read
   - User.Read.All
   - Sites.Read.All
   - Sites.ReadWrite.All
   - Files.ReadWrite.All
   - Calendars.ReadWrite
   - Group.ReadWrite.All

## Features

### Expense Audit Module

#### Core Features

- Multi-level expense approval workflow
- Document management with image optimization
- Role-based access control
- Expense reporting and analysis
- Real-time status tracking

#### Approval Workflow

1. Initial Submission
2. Assistant Approval
3. Department Head Approval
4. Accounting Approval

### Post-Venta Module

#### Core Features

- Service ticket management
- Technician assignment and scheduling
- Location hierarchy management
- Document and image management
- Calendar integration

#### Ticket States

1. Initiated
2. Technician Assigned
3. Technician Confirmed
4. Work Started
5. Completed
6. Closed

## Security Measures

### Authentication & Authorization

- Azure AD integration for secure authentication
- Role-based access control
- Session management with automatic timeout
- Protected routes and API endpoints

### Data Security

- Token-based API access
- Secure file uploads with validation
- Input sanitization and validation
- XSS protection through React and content security policies

## Performance Optimizations

### Image Processing

- Client-side image optimization
- Progressive loading for images
- Lazy loading for components and modules
- Image compression and format optimization

### Application Performance

- Code splitting using React.lazy
- Modular architecture for efficient loading
- Optimized list rendering
- Memoization of expensive computations

## Known Limitations

- Limited offline functionality
- Dependency on SharePoint for data storage
- Calendar integration limited to group calendars
- File size limitations for uploads (20MB max)

## Troubleshooting

### Common Issues

1. Authentication Errors

```javascript
// Check if user is authenticated
if (!isAuthenticated) {
  navigate("/login", { state: { from: location } });
}
```

2. File Upload Issues

```javascript
// Validate file size and type
const MAX_SIZE = 20 * 1024 * 1024; // 20MB
if (file.size > MAX_SIZE) {
  throw new Error("File size exceeds limit");
}
```

3. SharePoint Access Issues

```javascript
// Verify SharePoint permissions
const { siteId } = await service.getSiteId(config.siteName);
if (!siteId) {
  throw new Error("Unable to access SharePoint site");
}
```

## Contributing

### Development Guidelines

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Style

- Follow React best practices
- Use ESLint configuration
- Follow component naming conventions
- Document complex functions
- Write unit tests for critical functionality

## License

Proprietary - Copyright © 2024 Edintel S.A. All rights reserved.

## Support

For technical support, contact: support@edintel.com

For documentation updates and more examples, visit the internal documentation portal.
