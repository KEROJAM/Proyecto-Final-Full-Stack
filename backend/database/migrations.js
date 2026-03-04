const { Pool } = require('pg');
require('dotenv').config();

const MIGRATIONS = [
    {
        name: 'add_role_to_users',
        sql: `
            -- Add role column to users table if it doesn't exist
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='role'
                ) THEN 
                    ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
                END IF; 
            END $$;
        `
    }
];

async function runMigrations() {
    const pool = new Pool();
    
    try {
        console.log('🔄 Running migrations...');
        
        for (const migration of MIGRATIONS) {
            try {
                await pool.query(migration.sql);
                console.log(`✅ Migration "${migration.name}" completed successfully`);
            } catch (error) {
                console.log(`⚠️  Migration "${migration.name}" - ${error.message}`);
            }
        }
        
        console.log('✅ All migrations completed');
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

module.exports = { runMigrations };

// Run if called directly
if (require.main === module) {
    runMigrations();
}
