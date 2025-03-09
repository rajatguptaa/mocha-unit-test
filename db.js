export async function findUserById(userId) {
    // Simulating database lookup
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Doe', email: 'jane@example.com' }
    ];
  
    return users.find(user => user.id === userId) || null;
  }
  