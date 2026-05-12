# MY STUDIO — Self-Hosting Guide

> This guide will be available after Phase 11 (all modules complete).

## Prerequisites

You will need accounts on:
- Modal.com (GPU compute)
- Supabase (database + auth)
- Cloudflare (edge workers)
- Cloudinary (media storage)
- Upstash (rate limiting)

## Quick Start

1. Clone the repository
2. Copy `packages/config/environments/selfhost.env.example` to `.env`
3. Fill in all credentials
4. Run `bash scripts/setup.sh`
5. Deploy backend: `modal deploy apps/backend/main.py`
6. Deploy frontend: push to your Vercel project

Detailed instructions coming soon.
