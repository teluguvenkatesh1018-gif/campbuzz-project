// Clear require cache and start fresh
Object.keys(require.cache).forEach(function(key) {
  delete require.cache[key];
});

// Now require and start the server
require('./server.js');