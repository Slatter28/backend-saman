# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS backend application called "backend-saman" - an inventory management system for warehouses (bodegas). It uses TypeScript, PostgreSQL with TypeORM, and follows standard NestJS architecture patterns.

## Core Architecture

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM as ORM
- **Authentication**: JWT with Passport.js strategies (Local & JWT)
- **Validation**: Class-validator and class-transformer
- **Documentation**: Swagger/OpenAPI at `/api` endpoint
- **Main Entities**: Usuario (User), Producto (Product), Bodega (Warehouse), UnidadMedida (Unit of Measure), Movimiento (Movement/Transaction), Cliente (Client)
- **Structure**: Standard NestJS monolithic architecture with entities, controllers, services, and modules

### Module Structure
The application is organized into feature modules:
- `AuthModule`: Authentication and authorization (JWT, Local strategies)
- `ProductosModule`: Product management
- `BodegasModule`: Warehouse management
- `MovimientosModule`: Inventory movement tracking (entries/exits)
- `UnidadesMedidaModule`: Unit of measure management
- `ClientesModule`: Client management
- `DashboardModule`: Dashboard analytics

### Database Configuration
- Database connection configured in `app.module.ts` using environment variables
- Uses SSL connection with `rejectUnauthorized: false` for production compatibility
- TypeORM synchronize enabled only in development mode (`NODE_ENV === 'development'`)
- Database logging enabled in development mode
- All entities registered in both `TypeOrmModule.forRoot()` and `TypeOrmModule.forFeature()`

### Entity Relationships
- **Usuario**: Has roles ('admin' | 'bodeguero'), creates Movimientos, bcrypt password hashing
- **Movimiento**: Tracks inventory ('entrada' | 'salida'), links Usuario, Producto, Bodega, Cliente
- **Producto**: Linked to UnidadMedida, has multiple Movimientos
- **Bodega**: Warehouses that contain products via Movimientos
- **Cliente**: Optional client association for Movimientos

## Development Commands

```bash
# Install dependencies
npm install

# Development server with hot reload
npm run start:dev

# Development server with debugging
npm run start:debug

# Build for production
npm run build

# Production server
npm run start:prod

# Linting and formatting
npm run lint
npm run format

# Testing
npm run test          # unit tests
npm run test:watch    # watch mode
npm run test:cov      # with coverage
npm run test:debug    # debug mode
npm run test:e2e      # end-to-end tests
```

## Application Configuration

### Global Setup (main.ts)
- API prefix: `/api` (all endpoints prefixed with /api)
- CORS enabled for localhost:4200 and localhost:3000
- Global validation pipes with whitelist and transform enabled
- Swagger documentation served at `/api`
- JWT Bearer authentication configured for Swagger

### Key Configuration Files
- `nest-cli.json`: NestJS CLI configuration
- `tsconfig.json` & `tsconfig.build.json`: TypeScript configuration
- `test/jest-e2e.json`: E2E test configuration
- `package.json`: Jest configuration for unit tests

## Security Features

- **Password Security**: bcrypt hashing with 10 salt rounds in Usuario entity
- **Automatic Hashing**: Password hashing on insert/update via TypeORM lifecycle hooks (@BeforeInsert, @BeforeUpdate)
- **Password Validation**: `validatePassword()` method available on Usuario entity
- **JWT Authentication**: Bearer token authentication with Passport.js
- **Role-based Access**: Admin and bodeguero roles supported
- **Input Validation**: Global validation pipes prevent invalid data
- **SSL Database**: Configured with `rejectUnauthorized: false` for production compatibility

## Environment Configuration

Required environment variables:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`: Database connection
- `PORT`: Application port (defaults to 3000)
- `NODE_ENV`: Environment mode (affects synchronize and logging)

## Testing Setup

- **Unit Tests**: Jest configured in package.json, test files in `src/` with `*.spec.ts` pattern
- **E2E Tests**: Separate Jest config in `test/jest-e2e.json`, files with `*.e2e-spec.ts` pattern
- **Coverage**: Available via `npm run test:cov`
- **Watch Mode**: Available for continuous testing during development