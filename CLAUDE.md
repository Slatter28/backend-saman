# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS backend application called "backend-saman" - an inventory management system for warehouses (bodegas). It uses TypeScript, PostgreSQL with TypeORM, and follows standard NestJS architecture patterns.

## Core Architecture

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL hosted on Render, using TypeORM as ORM
- **Main Entities**: Usuario (User), Producto (Product), Bodega (Warehouse), UnidadMedida (Unit of Measure), Movimiento (Movement/Transaction)
- **Structure**: Standard NestJS monolithic architecture with entities, controllers, services, and modules

### Database Configuration
- Production database is configured in `app.module.ts` with hardcoded credentials (lines 17-36)
- Uses SSL connection with `rejectUnauthorized: false`
- TypeORM synchronize is enabled (development only)
- Logging is enabled for database queries

### Entity Relationships
- Users have roles: 'admin' or 'bodeguero' (warehouse keeper)
- Users can create multiple Movimientos (inventory movements)
- The system tracks inventory movements between warehouses

## Development Commands

```bash
# Install dependencies
npm install

# Development server with hot reload
npm run start:dev

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
npm run test:e2e      # end-to-end tests
```

## Key Configuration Files

- `nest-cli.json`: NestJS CLI configuration
- `tsconfig.json` & `tsconfig.build.json`: TypeScript configuration
- `test/jest-e2e.json`: E2E test configuration

## Security Features

- Database credentials are configured via environment variables (see `.env.example`)
- Password hashing implemented using bcrypt with 10 salt rounds in Usuario entity
- Automatic password hashing on insert/update via TypeORM lifecycle hooks
- Password validation method available via `validatePassword()` method
- SSL is configured but with relaxed certificate validation for development

## Environment Configuration

Create a `.env` file based on `.env.example` with your database credentials and configuration.

## Testing Setup

- Jest for unit testing (configured in package.json)
- Supertest for E2E testing
- Test files follow `*.spec.ts` pattern for unit tests
- E2E tests in `/test` directory with `*.e2e-spec.ts` pattern