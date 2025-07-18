# Backend Saman - Inventory Management System

A robust NestJS backend application for warehouse inventory management, built with TypeScript and PostgreSQL.

## 📋 Project Overview

Backend Saman is an inventory management system designed for warehouses (bodegas). It provides comprehensive functionality for tracking products, managing warehouse operations, and monitoring inventory movements.

### Key Features

- **User Management**: Role-based access control (admin/bodeguero)
- **Product Management**: Complete product catalog with units of measure
- **Warehouse Management**: Multi-warehouse inventory tracking
- **Movement Tracking**: Detailed inventory transaction history
- **Security**: JWT authentication with bcrypt password hashing
- **API Documentation**: Swagger/OpenAPI integration

## 🏗️ Architecture

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport.js
- **Validation**: Class-validator and class-transformer
- **Documentation**: Swagger/OpenAPI

### Core Entities

- **Usuario**: User management with role-based access
- **Producto**: Product catalog management
- **Bodega**: Warehouse configuration
- **UnidadMedida**: Units of measure for products
- **Movimiento**: Inventory movement transactions

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend-saman
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials and configuration:
```env
# Database Configuration
DB_HOST=your-database-host
DB_PORT=5432
DB_USERNAME=your-database-username
DB_PASSWORD=your-database-password
DB_NAME=your-database-name

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=1d

# Application Configuration
PORT=3000
NODE_ENV=development
```

## 🎯 Development

### Running the Application

```bash
# Development server with hot reload
npm run start:dev

# Development server
npm run start

# Production build
npm run build

# Production server
npm run start:prod
```

### Code Quality

```bash
# Linting
npm run lint

# Code formatting
npm run format
```

### Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Test coverage
npm run test:cov

# End-to-end tests
npm run test:e2e
```

## 🔒 Security Features

- **Password Security**: Bcrypt hashing with 10 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin and warehouse keeper roles
- **Input Validation**: Comprehensive request validation
- **SSL Support**: Database connections with SSL

## 📚 API Documentation

Once the application is running, access the Swagger documentation at:
```
http://localhost:3000/api
```

## 🗃️ Database

The application uses PostgreSQL with TypeORM for database operations. The database schema includes:

- User management with encrypted passwords
- Product catalog with categories and units
- Warehouse inventory tracking
- Transaction history and audit trails

### Database Migrations

TypeORM is configured with synchronization enabled for development. For production, consider using proper migrations.

## 🌐 Deployment

The application is configured for deployment on platforms like Render, Heroku, or similar cloud services.

### Environment Variables for Production

Ensure all environment variables are properly set in your production environment, especially:
- Database credentials
- JWT secret (use a strong, unique secret)
- NODE_ENV=production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved.

## 📞 Support

For support and questions, please contact the development team.

---

Built with ❤️ using [NestJS](https://nestjs.com/)