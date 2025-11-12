/**
 * Test migration script - runs migration on first 10 words only
 */

import { WiktionaryMigrationService } from './wiktionary-migration-service';

async function testMigration() {
  const service = new WiktionaryMigrationService();
  
  // Run migration with limit of 10 words for testing
  await service.runMigration(10);
}

testMigration()
  .then(() => {
    console.log('\n✅ Test migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test migration failed:', error);
    process.exit(1);
  });