// API configuration — all values from environment variables
// Never hardcode secrets here

export const config = {
  port: parseInt(process.env.API_PORT ?? '3001', 10),
  host: process.env.API_HOST ?? '0.0.0.0',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isDev: (process.env.NODE_ENV ?? 'development') === 'development',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(','),
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    apiSecret: process.env.CLOUDINARY_API_SECRET!,
  },

  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM ?? 'Yakin Group <noreply@yakingroup.com>',
  },

  app: {
    name: process.env.APP_NAME ?? 'Yakin Group',
    url: process.env.APP_URL ?? 'http://localhost:3000',
    apiUrl: process.env.API_URL ?? 'http://localhost:3001',
  },
} as const

// Validate required env vars on startup
export function validateConfig(): void {
  const required = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
  ]
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
