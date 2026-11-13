const User = require('../models/user');

async function createUser(data) {
  console.log(`[SERVICE] Создание пользователя: ${data.email}`);
  const existing = await User.findByEmail(data.email);
  if (existing) {
    const error = new Error('Email already exists');
    error.status = 409;
    throw error;
  }
  return await User.create(data);
}

async function getUsers() {
  return await User.findAll();
}

async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  return user;
}

module.exports = { createUser, getUsers, getUserById };