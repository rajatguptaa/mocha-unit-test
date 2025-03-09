export async function getUserById(userId, db, redis) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Check Redis cache first
  if (redis) {
    const cachedUser = await redis.get(`user:${userId}`);
    if (cachedUser) {
      return JSON.parse(cachedUser); // Return cached data
    }
  }

  // Fetch from database if not found in cache
  const user = await db.findUserById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Store user data in Redis for future requests
  if (redis) {
    await redis.set(`user:${userId}`, JSON.stringify(user), 'EX', 3600); // Cache for 1 hour
  }

  return user;
}
