const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

class User {
  static get collection() {
    return getDB().collection('users');
  }

  static async findAll(options = {}) {
    const { page = 1, limit = 10, sort, group_name, course, age_min, age_max } = options;
    const query = {};
    
    if (group_name) query.group_name = group_name;
    if (course) query.course = Number(course);
    if (age_min || age_max) {
      query.age = {};
      if (age_min) query.age.$gte = Number(age_min);
      if (age_max) query.age.$lte = Number(age_max);
    }

    let sortObj = {};
    if (sort) {
      const isDesc = sort.startsWith('-');
      const field = isDesc ? sort.substring(1) : sort;
      sortObj[field] = isDesc ? -1 : 1;
    }

    const skip = (page - 1) * limit;
    const total = await this.collection.countDocuments(query);
    const data = await this.collection.find(query).sort(sortObj).skip(skip).limit(limit).toArray();
    
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async findById(id) {
    return this.collection.findOne({ _id: new ObjectId(id) });
  }

  static async findByEmail(email) {
    return this.collection.findOne({ email });
  }

  static async create(data) {
    const result = await this.collection.insertOne({ ...data, created_at: new Date() });
    return { _id: result.insertedId, ...data };
  }

  static async update(id, data) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: data }
    );
    return result.modifiedCount > 0;
  }

  static async delete(id) {
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

module.exports = User;