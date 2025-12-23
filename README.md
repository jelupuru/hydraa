# Hydraa - Complaint Management System

A comprehensive complaint management system built with Next.js, designed for efficient handling and tracking of complaints with role-based access control and integrated document management.

## Features ✨

- **Role-based Access Control**: Multi-level user management (Field Officer, DCP, ACP, Commissioner, Super Admin)
- **Complaint Management**: Complete complaint lifecycle from registration to resolution
- **FIR Integration**: Seamless FIR registration and tracking
- **Document Management**: File attachments with secure upload handling
- **Real-time Comments**: Threaded discussion system for each complaint
- **Dashboard Analytics**: Comprehensive overview and reporting
- **PostgreSQL Database**: Robust data storage with Prisma ORM
- **NextAuth Authentication**: Secure login and user management
- **Rich Text Editor**: Advanced document editing capabilities

## Tech Stack 🛠️

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **File Upload**: UploadThing
- **Rich Text**: Plate.js
- **UI Components**: Radix UI
- **Deployment**: Docker, nginx

## 🚀 Quick Start

Clone the repository and set up your development environment:

```bash
git clone https://github.com/jelupuru/hydraa.git
cd hydraa
npm install --legacy-peer-deps
```

Create your environment file:
```bash
cp .env.example .env
# Update .env with your database and other configurations
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Database Setup

The application uses PostgreSQL with Prisma. Set up your database:

```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed the database (optional)
npx prisma db seed
```

## 🐳 Docker Deployment

For complete Docker setup including database, see [README_DOCKER.md](README_DOCKER.md) and [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md).

Quick Docker setup:
```bash
# Development with database
docker compose up --build

# Production deployment
docker compose -f docker-compose.prod.yml up --build
```

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── (site)/         # Public site pages
│   │   ├── api/            # API routes
│   │   └── dashboard/      # Dashboard pages
│   ├── components/         # React components
│   │   ├── Dashboard/      # Dashboard components
│   │   └── ui/             # UI components
│   ├── lib/                # Utility libraries
│   └── utils/              # Helper functions
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
└── docker/                 # Docker configuration files
```

## 🔐 Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/hydraa

# NextAuth
SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_NAME=Hydraa
```

## 🚀 Deployment

### Vercel/Netlify

Deploy to cloud platforms:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjelupuru%2Fhydraa)

### Azure VM
For production deployment on Azure VM with nginx, see [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md).

### Docker Hub
Automated Docker builds are available at `jelupuru/hydraa:latest`.

## Changelog

**Version 1.0.0** - Initial Release

- Complete complaint management system
- Role-based access control
- FIR integration and tracking
- Document upload and management
- Real-time commenting system
- PostgreSQL database with Prisma
- Docker deployment support
- Azure VM deployment guide
- GitHub Actions CI/CD pipeline
