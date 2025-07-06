# Supplier Management System

## Overview

This is a comprehensive supplier management web application built for a computer hardware sales business. The system enables users to manage suppliers from various countries, track pricing, handle inquiries, and manage orders efficiently. The application features a modern React frontend with a Node.js/Express backend, utilizing PostgreSQL for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **File Upload**: Multer for handling Excel/CSV price lists
- **Session Management**: Express sessions with PostgreSQL store

### Database Architecture
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with migrations support
- **Schema**: Comprehensive supplier management schema with relationships

## Key Components

### Database Schema
The system uses a normalized database structure with the following main entities:

1. **Suppliers**: Core supplier information including contact details, reputation scores, and business categories
2. **Price List Files**: File metadata for uploaded Excel/CSV price lists
3. **Price List Items**: Individual product entries from price lists
4. **Offers**: Text-based offers from suppliers via email/WhatsApp
5. **Orders**: Purchase orders with line items
6. **Order Items**: Individual products within orders
7. **Inquiries**: Outbound inquiry tracking
8. **Cost Calculation Files**: Supplier-specific cost calculation logic

### Frontend Components
- **Layout System**: Responsive sidebar navigation with mobile support
- **Search & Filter**: Advanced filtering by country, category, brand, and reputation
- **Supplier Management**: CRUD operations for supplier data
- **Order Management**: Excel-like table interface for order creation
- **File Upload**: Integration for price list and cost calculation files
- **Bulk Operations**: Multi-supplier inquiry sending

### API Structure
The backend provides RESTful endpoints for:
- Supplier CRUD operations
- File upload and processing
- Search and filtering
- Order management
- Inquiry handling
- Price list management

## Data Flow

### Search and Discovery Flow
1. User applies filters (country, category, brand, reputation)
2. Frontend sends query to `/api/suppliers` with filter parameters
3. Backend searches across supplier data, price lists, and offers
4. Results returned with matching products and supplier information
5. Frontend displays results with supplier cards and match highlights

### Supplier Management Flow
1. User can add suppliers manually or via Google Forms integration
2. Supplier data includes contact information, business categories, and trading brands
3. Price lists uploaded as Excel files, automatically converted to searchable data
4. Offers can be manually entered or automatically imported from WhatsApp
5. Orders created using spreadsheet-like interface with automatic calculations

### Inquiry Management Flow
1. User selects suppliers via checkboxes or from supplier detail pages
2. Inquiry message composed with fixed template integration
3. System sends to supplier's WhatsApp and email simultaneously
4. Inquiry tracking stored in database for follow-up

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **File Processing**: XLSX library for Excel file handling
- **WebSocket**: WebSocket support for real-time features
- **Date Handling**: date-fns for date manipulation

### Communication Dependencies
- **WhatsApp Integration**: Planned integration for automated messaging
- **Email Service**: SMTP integration for inquiry sending
- **Google Forms**: API integration for automated supplier onboarding

### Development Dependencies
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Fast production builds
- **Vite**: Development server with HMR
- **Tailwind CSS**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- **Server**: Express.js with Vite middleware for HMR
- **Database**: Neon PostgreSQL with connection pooling
- **Build Process**: TypeScript compilation with Vite bundling
- **File Storage**: Local filesystem for uploaded files

### Production Deployment
- **Server**: Node.js with compiled JavaScript
- **Database**: Neon PostgreSQL with connection pooling
- **Static Assets**: Served via Express static middleware
- **File Storage**: Persistent storage for uploaded price lists and documents

### Environment Configuration
- **Database**: PostgreSQL connection via DATABASE_URL environment variable
- **Session**: Secure session management with PostgreSQL store
- **File Upload**: Configurable upload directory with size limits

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 05, 2025. Initial setup
- July 05, 2025. Updated categories list with comprehensive computer hardware categories (96 categories covering laptops, desktops, servers, components, peripherals, accessories, software, cabling, networking, and specialized equipment)
- July 05, 2025. Updated brands list with comprehensive computer hardware brands (166 brands covering major manufacturers from Access IS to ZOTAC, including processors, graphics cards, storage, peripherals, networking, and specialized equipment)
- July 06, 2025. Implemented comprehensive file upload system for price lists with conversion logic processing:
  - Added Python file processing module with pandas integration
  - Created backend routes for logic file upload and price list processing
  - Implemented secure file validation and processing
  - Added frontend upload forms with progress indicators
  - Created preview functionality for processed data
  - Added download functionality for converted CSV files
  - Integrated error handling and user feedback