const Database = require('better-sqlite3');

const dbPath = '/Users/jamesreeves/Desktop/ghost/content/data/ghost-local.db';

try {
  const db = new Database(dbPath);
  
  // Update image URLs from __GHOST_URL__ to your live CDN
  const updatePosts = db.prepare(`
    UPDATE posts 
    SET html = REPLACE(html, '__GHOST_URL__/content/images/', 'https://jamesreeves.ghost.io/content/images/'),
        mobiledoc = REPLACE(mobiledoc, '__GHOST_URL__/content/images/', 'https://jamesreeves.ghost.io/content/images/')
    WHERE html LIKE '%__GHOST_URL__/content/images/%' 
    OR mobiledoc LIKE '%__GHOST_URL__/content/images/%'
  `);
  
  const result = updatePosts.run();
  console.log(`Updated ${result.changes} posts`);
  
  db.close();
  console.log('Image URLs fixed successfully!');
  
} catch (error) {
  console.error('Error:', error.message);
}
