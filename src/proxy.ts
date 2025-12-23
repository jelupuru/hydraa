import type { NextFetchEvent, NextRequest } from 'next/server';
// import { detectBot } from '@arcjet/next';
// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
// import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
// import arcjet from '@/libs/Arcjet';
// import { routing } from './libs/I18nRouting';

// Placeholder middleware
export default function middleware(request: NextRequest, event: NextFetchEvent) {
  return NextResponse.next();
}