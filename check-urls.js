const Database = require('better-sqlite3');

const dbPath = '/Users/jamesreeves/Desktop/ghost/content/data/ghost-local.db';

try {
  const db = new Database(dbPath, { readonly: true });
  
  // Check what image URLs actually exist
  const posts = db.prepare(`
    SELECT id, title, html, mobiledoc 
    FROM posts 
    WHERE html LIKE '%content/images%' 
    OR mobiledoc LIKE '%content/images%'
    LIMIT 3
  `).all();
  
  posts.forEach(post => {
    console.log('\n--- POST:', post.title, '---');
    if (post.html && post.html.includes('content/images')) {
      console.log('HTML images found');
      // Extract just the image URLs
      const imageMatches = post.html.match(/src="[^"]*content\/images[^"]*"/g);
      if (imageMatches) {
        imageMatches.forEach(match => console.log(match));
      }
    }
  });
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}
