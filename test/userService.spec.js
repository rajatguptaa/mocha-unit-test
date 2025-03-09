import { expect } from 'chai';
import sinon from 'sinon';
import { getUserById } from '../userService.js';

describe('UserService - getUserById', function () {
  let db;

  beforeEach(() => {
    db = { findUserById: sinon.stub() }; // Mocked database object
  });

  afterEach(() => {
    sinon.restore(); // Clean up stubs/mocks after each test
  });

  it('should return user details when user exists', async function () {
    const fakeUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
    db.findUserById.resolves(fakeUser); // Stub the method

    const result = await getUserById(1, db);

    expect(result).to.deep.equal(fakeUser);
    expect(db.findUserById.calledOnceWith(1)).to.be.true;
  });

  it('should throw an error if user does not exist', async function () {
    db.findUserById.resolves(null); // Stub to return null

    try {
      await getUserById(2, db);
      throw new Error('Test should have thrown an error');
    } catch (error) {
      expect(error.message).to.equal('User not found');
    }
  });

  it('should throw an error if userId is not provided', async function () {
    try {
      await getUserById(null, db);
      throw new Error('Test should have thrown an error');
    } catch (error) {
      expect(error.message).to.equal('User ID is required');
    }
  });

  it('should call findUserById with the correct userId', async function () {
    const fakeUser = { id: 3, name: 'Jane Doe', email: 'jane@example.com' };
    db.findUserById.resolves(fakeUser);

    await getUserById(3, db);

    expect(db.findUserById.calledOnceWith(3)).to.be.true;
  });

  it('should handle errors thrown by db.findUserById()', async function () {
    db.findUserById.rejects(new Error('Database connection failed'));

    try {
      await getUserById(4, db);
      throw new Error('Test should have thrown an error');
    } catch (error) {
      expect(error.message).to.equal('Database connection failed');
    }
  });

  it('should return the correct user for different userIds', async function () {
    const users = [
      { id: 5, name: 'Alice', email: 'alice@example.com' },
      { id: 6, name: 'Bob', email: 'bob@example.com' },
    ];

    db.findUserById.withArgs(5).resolves(users[0]);
    db.findUserById.withArgs(6).resolves(users[1]);

    const result1 = await getUserById(5, db);
    const result2 = await getUserById(6, db);

    expect(result1).to.deep.equal(users[0]);
    expect(result2).to.deep.equal(users[1]);
  });
});
