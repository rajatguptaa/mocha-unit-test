import { expect } from 'chai';
import sinon from 'sinon';
import { getUserById } from '../userService.js';

describe('UserService - getUserById with Redis & DB', function () {
  let db, redis;

  beforeEach(() => {
    db = { findUserById: sinon.stub() }; // Mocked database
    redis = { get: sinon.stub(), set: sinon.stub() }; // Mocked Redis
  });

  afterEach(() => {
    sinon.restore();
  });

  /** ✅ Test case 1: User exists in Redis (cache hit) */
  it('should return user details from Redis if available', async function () {
    const fakeUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
    redis.get.resolves(JSON.stringify(fakeUser)); // Redis returns cached user

    const result = await getUserById(1, db, redis);

    expect(result).to.deep.equal(fakeUser);
    expect(redis.get.calledOnceWith('user:1')).to.be.true;
    expect(db.findUserById.notCalled).to.be.true; // DB should not be queried
  });

  /** ✅ Test case 2: User not in Redis but found in DB (cache miss) */
  it('should fetch user from DB if Redis cache is empty and store in Redis', async function () {
    const fakeUser = { id: 2, name: 'Jane Doe', email: 'jane@example.com' };
    redis.get.resolves(null); // No cache
    db.findUserById.resolves(fakeUser); // Fetch from DB

    const result = await getUserById(2, db, redis);

    expect(result).to.deep.equal(fakeUser);
    expect(redis.get.calledOnceWith('user:2')).to.be.true;
    expect(db.findUserById.calledOnceWith(2)).to.be.true;
    expect(redis.set.calledOnceWith('user:2', JSON.stringify(fakeUser), 'EX', 3600)).to.be.true; // Cached
  });

  /** ✅ Test case 3: User not found in Redis & DB */
  it('should throw an error if user does not exist in DB and Redis is empty', async function () {
    redis.get.resolves(null); // No cache
    db.findUserById.resolves(null); // User not found in DB

    try {
      await getUserById(3, db, redis);
      throw new Error('Test should have thrown an error');
    } catch (error) {
      expect(error.message).to.equal('User not found');
    }
  });

  /** ✅ Test case 4: User not found in Redis, DB returns user, and Redis stores it */
  it('should store user in Redis after fetching from DB', async function () {
    const fakeUser = { id: 4, name: 'Alice Doe', email: 'alice@example.com' };
    redis.get.resolves(null); // No cache
    db.findUserById.resolves(fakeUser); // Found in DB

    const result = await getUserById(4, db, redis);

    expect(result).to.deep.equal(fakeUser);
    expect(redis.set.calledOnceWith('user:4', JSON.stringify(fakeUser), 'EX', 3600)).to.be.true; // Cached
  });

  /** ✅ Test case 5: User ID is required */
  it('should throw an error if userId is not provided', async function () {
    try {
      await getUserById(null, db, redis);
      throw new Error('Test should have thrown an error');
    } catch (error) {
      expect(error.message).to.equal('User ID is required');
    }
  });

  /** ✅ Test case 6: Redis is unavailable, should still fetch from DB */
  it('should work even if Redis is unavailable', async function () {
    const fakeUser = { id: 5, name: 'Bob Doe', email: 'bob@example.com' };
    db.findUserById.resolves(fakeUser); // Found in DB

    const result = await getUserById(5, db, null); // Redis is null

    expect(result).to.deep.equal(fakeUser);
    expect(db.findUserById.calledOnceWith(5)).to.be.true;
  });

  /** ✅ Test case 7: Redis is available but set operation fails */
  it('should not fail if Redis set operation fails', async function () {
    const fakeUser = { id: 6, name: 'Charlie Doe', email: 'charlie@example.com' };
    redis.get.resolves(null); // No cache
    db.findUserById.resolves(fakeUser); // Found in DB
    redis.set.rejects(new Error('Redis error')); // Simulate Redis failure

    const result = await getUserById(6, db, redis);

    expect(result).to.deep.equal(fakeUser);
    expect(redis.set.calledOnceWith('user:6', JSON.stringify(fakeUser), 'EX', 3600)).to.be.true;
  });
});
