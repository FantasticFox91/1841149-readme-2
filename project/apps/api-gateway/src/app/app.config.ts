export const ApplicationServiceURL = {
  Users: process.env.USERS_SERVICE_URL || 'http://localhost:3001/api/auth',
  Subscribe: process.env.SUBSCRIBE_SERVICE_URL || 'http://localhost:3001/api/subscribe',
  Posts: process.env.POSTS_SERVICE_URL || 'http://localhost:3002/api/posts',
  Files: process.env.FILES_SERVICE_URL || 'http://localhost:3003/api/files',
  Feed: process.env.FEED_SERVICE_URL || 'http://localhost:3333/api/feed',
}

export const HTTP_CLIENT_MAX_REDIRECTS = 5;
export const HTTP_CLIENT_TIMEOUT = 5000;
