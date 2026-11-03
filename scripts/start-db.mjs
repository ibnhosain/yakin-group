/**
 * Start embedded PostgreSQL for local development
 * Usage: node scripts/start-db.mjs
 *
 * First run: initialises the database cluster and creates yakin_group DB
 * Subsequent runs: starts the existing cluster
 */
import EmbeddedPostgres from 'embedded-postgres'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, '.postgres-data')

const PG_USER = 'yakin_admin'
const PG_PASSWORD = 'yakin_secure_2024'
const PG_PORT = 5432
const PG_DB = 'yakin_group'
const DATABASE_URL = `postgresql://${PG_USER}:${PG_PASSWORD}@localhost:${PG_PORT}/${PG_DB}`

async function main() {
  console.log('\n🐘 ইয়াকিন গ্রুপ — PostgreSQL শুরু হচ্ছে...\n')

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: PG_USER,
    password: PG_PASSWORD,
    port: PG_PORT,
    persistent: true,
    autoRehydrateSymlinks: true,
  })

  try {
    await pg.initialise()
    console.log('✅ Database cluster initialized')

    await pg.start()
    console.log('✅ PostgreSQL started on port', PG_PORT)

    // Create yakin_group database if not exists
    try {
      await pg.createDatabase(PG_DB)
      console.log(`✅ Database '${PG_DB}' created`)
    } catch (e) {
      // Database may already exist
      if (!e.message?.includes('already exists')) {
        console.log(`ℹ️  Database '${PG_DB}' already exists`)
      }
    }

    // Update .env with correct DATABASE_URL
    const envPath = join(ROOT, '.env')
    let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''

    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(/DATABASE_URL=.+/g, `DATABASE_URL=${DATABASE_URL}`)
    } else {
      envContent = `DATABASE_URL=${DATABASE_URL}\n` + envContent
    }
    writeFileSync(envPath, envContent)

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ PostgreSQL চালু আছে!')
    console.log(`   URL: ${DATABASE_URL}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n📋 পরবর্তী পদক্ষেপ (নতুন terminal-এ):')
    console.log('   pnpm db:migrate   (database তৈরি)')
    console.log('   pnpm db:seed      (initial data)')
    console.log('   pnpm --filter @yakin/api dev    (API শুরু)')
    console.log('\n⚠️  এই terminal বন্ধ করবেন না — database চলছে')
    console.log('   বন্ধ করতে: Ctrl+C\n')

    process.on('SIGINT', async () => {
      console.log('\n🛑 PostgreSQL বন্ধ হচ্ছে...')
      await pg.stop()
      console.log('✅ বন্ধ হয়েছে')
      process.exit(0)
    })

    // Keep alive
    await new Promise(() => {})

  } catch (err) {
    console.error('\n❌ Error:', err.message)
    if (err.message?.includes('symlink')) {
      console.error('💡 Tip: symlink issue — rerun or try: pnpm rebuild @embedded-postgres/windows-x64')
    }
    process.exit(1)
  }
}

main()
