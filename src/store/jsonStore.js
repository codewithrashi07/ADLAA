const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

/**
 * File backed store used whenever MongoDB is not configured or not reachable.
 * Keeps ADLAA runnable with zero infrastructure, which matters for demos.
 */
class JsonStore {
  constructor(file) {
    this.file = file;
    this.records = [];
    this.writeQueue = Promise.resolve();
  }

  get label() {
    return `json-file (${path.relative(process.cwd(), this.file)})`;
  }

  async connect() {
    await fsp.mkdir(path.dirname(this.file), { recursive: true });
    if (fs.existsSync(this.file)) {
      const raw = await fsp.readFile(this.file, 'utf8');
      try {
        const parsed = JSON.parse(raw || '[]');
        this.records = Array.isArray(parsed) ? parsed : [];
      } catch {
        this.records = [];
      }
    } else {
      await fsp.writeFile(this.file, '[]');
    }
    return this;
  }

  flush() {
    const snapshot = JSON.stringify(this.records, null, 2);
    this.writeQueue = this.writeQueue.then(() => fsp.writeFile(this.file, snapshot)).catch(() => {});
    return this.writeQueue;
  }

  async create(doc) {
    const record = { ...doc, id: crypto.randomUUID() };
    this.records.unshift(record);
    await this.flush();
    return record;
  }

  async list({ status, category, difficulty, search, limit = 20, page = 1 } = {}) {
    let items = this.records.slice();
    if (status) items = items.filter((item) => item.status === status);
    if (category) items = items.filter((item) => item.category === category);
    if (difficulty) items = items.filter((item) => item.difficulty === difficulty);
    if (search) {
      const needle = String(search).toLowerCase();
      items = items.filter((item) =>
        [item.name, item.service, item.location, item.trackingId, item.categoryName]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle))
      );
    }
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = items.length;
    const start = (Math.max(1, Number(page)) - 1) * Number(limit);
    return { items: items.slice(start, start + Number(limit)), total };
  }

  async findById(id) {
    return this.records.find((item) => item.id === id) || null;
  }

  async findByTracking(trackingId) {
    const needle = String(trackingId).toUpperCase();
    return this.records.find((item) => item.trackingId === needle) || null;
  }

  async findLatest() {
    return this.records.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
  }

  async update(id, patch) {
    const index = this.records.findIndex((item) => item.id === id);
    if (index === -1) return null;
    this.records[index] = { ...this.records[index], ...patch };
    await this.flush();
    return this.records[index];
  }

  async remove(id) {
    const index = this.records.findIndex((item) => item.id === id);
    if (index === -1) return false;
    this.records.splice(index, 1);
    await this.flush();
    return true;
  }

  async all() {
    return this.records.slice();
  }

  async clear() {
    this.records = [];
    await this.flush();
  }
}

module.exports = JsonStore;
