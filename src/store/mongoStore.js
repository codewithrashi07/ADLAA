const mongoose = require('mongoose');
const Application = require('../models/Application');

/** MongoDB backed store. Used when MONGODB_URI is set and reachable. */
class MongoStore {
  constructor(uri) {
    this.uri = uri;
  }

  get label() {
    return 'mongodb';
  }

  async connect() {
    await mongoose.connect(this.uri, { serverSelectionTimeoutMS: 5000 });
    return this;
  }

  static toPlain(doc) {
    if (!doc) return null;
    const plain = doc.toObject({ versionKey: false });
    plain.id = String(plain._id);
    delete plain._id;
    return plain;
  }

  async create(doc) {
    const created = await Application.create(doc);
    return MongoStore.toPlain(created);
  }

  async list({ status, category, difficulty, search, limit = 20, page = 1 } = {}) {
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: rx }, { service: rx }, { location: rx }, { trackingId: rx }, { categoryName: rx }];
    }
    const [docs, total] = await Promise.all([
      Application.find(query)
        .sort({ createdAt: -1 })
        .skip((Math.max(1, Number(page)) - 1) * Number(limit))
        .limit(Number(limit)),
      Application.countDocuments(query)
    ]);
    return { items: docs.map(MongoStore.toPlain), total };
  }

  async findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return MongoStore.toPlain(await Application.findById(id));
  }

  async findByTracking(trackingId) {
    return MongoStore.toPlain(await Application.findOne({ trackingId: String(trackingId).toUpperCase() }));
  }

  async findLatest() {
    return MongoStore.toPlain(await Application.findOne().sort({ createdAt: -1 }));
  }

  async update(id, patch) {
    if (!mongoose.isValidObjectId(id)) return null;
    return MongoStore.toPlain(await Application.findByIdAndUpdate(id, patch, { new: true }));
  }

  async remove(id) {
    if (!mongoose.isValidObjectId(id)) return false;
    const result = await Application.findByIdAndDelete(id);
    return Boolean(result);
  }

  async all() {
    const docs = await Application.find().sort({ createdAt: -1 });
    return docs.map(MongoStore.toPlain);
  }

  async clear() {
    await Application.deleteMany({});
  }
}

module.exports = MongoStore;
