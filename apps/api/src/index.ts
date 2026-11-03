import { validateConfig } from './config'
import { buildApp } from './app'
import { config } from './config'

async function start() {
  try {
    validateConfig()
    const app = await buildApp()
    await app.listen({ port: config.port, host: config.host })
    console.log(`\n🚀 Yakin Group API running at http://${config.host}:${config.port}`)
    console.log(`   Environment: ${config.nodeEnv}`)
    console.log(`   Health:      http://localhost:${config.port}/health\n`)
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
