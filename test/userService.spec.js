import { expect } from 'chai';
import sinon from 'sinon';
import { getUserById } from '../userService.js';

describe('UserService - getUserById with Redis', function () {
  let db, redis;

  beforeEach(() => {
    db = { findUserById: sinon.stub() }; // Mocked database
    redis = { get: sinon.stub(), set: sinon.stub() }; // Mocked Redis
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return user details from Redis if available', async function () {
    const fakeUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
    redis.get.resolves(JSON.stringify(fakeUser)); // Redis returns cached user

    const result = await getUserById(1, db, redis);

    expect(result).to.deep.equal(fakeUser);
    expect(redis.get.calledOnceWith('user:1')).to.be.true;
    expect(db.findUserById.notCalled).to.be.true; // DB should not be queried
  });

  it('should fetch from DB if Redis cache is empty and store in Redis', async function () {
    const fakeUser = { id: 2, name: 'Jane Doe', email: 'jane@example.com' };
    redis.get.resolves(null); // No cache
    db.findUserById.resolves(fakeUser); // Fetch from DB

    const result = await getUserById(2, db, redis);

    expect(result).to.deep.equal(fakeUser);
    expect(redis.get.calledOnceWith('user:2')).to.be.true;
    expect(db.findUserById.calledOnceWith(2)).to.be.true;
    expect(redis.set.calledOnceWith('user:2', JSON.stringify(fakeUser), 'EX', 3600)).to.be.true; // Cached
  });

  it('should throw an error if user does not exist in DB and Redis is empty', async function () {
    redis.get.resolves(null);
    db.findUserById.resolves(null); // User not found

    try {
      await getUserById(3, db, redis);
      throw new Error('Test should have thrown an error');
    } catch (error) {
      expect(error.message).to.equal('User not found');
    }
  });

  it('should throw an error if userId is not provided', async function () {
    try {
      await getUserById(null, db, redis);
      throw new Error('Test should have thrown an error');
    } catch (error) {
      expect(error.message).to.equal('User ID is required');
    }
  });
});
