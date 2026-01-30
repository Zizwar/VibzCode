import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const STORAGE_MODE = process.env.STORAGE_MODE || 'local';
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');

// MongoDB client instance
let mongoClient = null;
let db = null;

/**
 * Database abstraction layer that supports both local file storage and MongoDB
 * Currently using local storage, but ready for MongoDB Atlas integration
 */
class Database {
  constructor() {
    this.mode = STORAGE_MODE;

    // Create local data directories if using local storage
    if (this.mode === 'local') {
      ['projects', 'chats', 'users'].forEach(dir => {
        const dirPath = path.join(LOCAL_DATA_DIR, dir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      });
    }
  }

  /**
   * Connect to database (MongoDB or local storage)
   */
  async connect() {
    if (this.mode === 'mongodb') {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        console.warn('⚠️  MongoDB URI not set, falling back to local storage');
        this.mode = 'local';
        return;
      }

      try {
        mongoClient = new MongoClient(mongoUri);
        await mongoClient.connect();
        db = mongoClient.db('vibzcode');
        console.log('✅ Connected to MongoDB Atlas');

        // Create indexes
        await this.createIndexes();
      } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.log('📁 Falling back to local file storage');
        this.mode = 'local';
      }
    } else {
      console.log('📁 Using local file storage');
    }
  }

  /**
   * Create database indexes for MongoDB
   */
  async createIndexes() {
    if (this.mode !== 'mongodb') return;

    try {
      await db.collection('projects').createIndex({ userId: 1, uploadDate: -1 });
      await db.collection('chats').createIndex({ projectId: 1, createdAt: -1 });
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      console.log('✅ Database indexes created');
    } catch (error) {
      console.error('Error creating indexes:', error.message);
    }
  }

  /**
   * Save project data
   */
  async saveProject(projectData) {
    if (this.mode === 'mongodb') {
      const result = await db.collection('projects').insertOne(projectData);
      return result.insertedId;
    } else {
      // Local file storage
      const projectId = Date.now().toString();
      const projectPath = path.join(LOCAL_DATA_DIR, 'projects', `${projectId}.json`);
      fs.writeFileSync(projectPath, JSON.stringify({ _id: projectId, ...projectData }, null, 2));
      return projectId;
    }
  }

  /**
   * Get project by ID
   */
  async getProject(projectId) {
    if (this.mode === 'mongodb') {
      return await db.collection('projects').findOne({ _id: projectId });
    } else {
      const projectPath = path.join(LOCAL_DATA_DIR, 'projects', `${projectId}.json`);
      if (fs.existsSync(projectPath)) {
        return JSON.parse(fs.readFileSync(projectPath, 'utf8'));
      }
      return null;
    }
  }

  /**
   * Get all projects for a user
   */
  async getProjects(userId = 'default') {
    if (this.mode === 'mongodb') {
      return await db.collection('projects')
        .find({ userId })
        .sort({ uploadDate: -1 })
        .toArray();
    } else {
      const projectsDir = path.join(LOCAL_DATA_DIR, 'projects');
      const files = fs.readdirSync(projectsDir);
      const projects = files
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const content = fs.readFileSync(path.join(projectsDir, f), 'utf8');
          return JSON.parse(content);
        })
        .filter(p => p.userId === userId)
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      return projects;
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectId) {
    if (this.mode === 'mongodb') {
      await db.collection('projects').deleteOne({ _id: projectId });
    } else {
      const projectPath = path.join(LOCAL_DATA_DIR, 'projects', `${projectId}.json`);
      if (fs.existsSync(projectPath)) {
        fs.unlinkSync(projectPath);
      }
    }
  }

  /**
   * Save chat message
   */
  async saveChatMessage(projectId, message) {
    const chatData = {
      projectId,
      ...message,
      timestamp: new Date()
    };

    if (this.mode === 'mongodb') {
      // Update chat history by pushing new message
      await db.collection('chats').updateOne(
        { projectId },
        {
          $push: { messages: chatData },
          $set: { updatedAt: new Date() }
        },
        { upsert: true }
      );
    } else {
      // Local file storage
      const chatPath = path.join(LOCAL_DATA_DIR, 'chats', `${projectId}.json`);
      let chatHistory = { projectId, messages: [], createdAt: new Date() };

      if (fs.existsSync(chatPath)) {
        chatHistory = JSON.parse(fs.readFileSync(chatPath, 'utf8'));
      }

      chatHistory.messages.push(chatData);
      chatHistory.updatedAt = new Date();
      fs.writeFileSync(chatPath, JSON.stringify(chatHistory, null, 2));
    }
  }

  /**
   * Get chat history for a project
   */
  async getChatHistory(projectId) {
    if (this.mode === 'mongodb') {
      const chat = await db.collection('chats').findOne({ projectId });
      return chat?.messages || [];
    } else {
      const chatPath = path.join(LOCAL_DATA_DIR, 'chats', `${projectId}.json`);
      if (fs.existsSync(chatPath)) {
        const chatHistory = JSON.parse(fs.readFileSync(chatPath, 'utf8'));
        return chatHistory.messages || [];
      }
      return [];
    }
  }

  /**
   * Save user data
   */
  async saveUser(userData) {
    if (this.mode === 'mongodb') {
      const result = await db.collection('users').insertOne(userData);
      return result.insertedId;
    } else {
      const userId = Date.now().toString();
      const userPath = path.join(LOCAL_DATA_DIR, 'users', `${userId}.json`);
      fs.writeFileSync(userPath, JSON.stringify({ _id: userId, ...userData }, null, 2));
      return userId;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    if (this.mode === 'mongodb') {
      return await db.collection('users').findOne({ email });
    } else {
      const usersDir = path.join(LOCAL_DATA_DIR, 'users');
      if (!fs.existsSync(usersDir)) return null;

      const files = fs.readdirSync(usersDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = fs.readFileSync(path.join(usersDir, file), 'utf8');
          const user = JSON.parse(content);
          if (user.email === email) return user;
        }
      }
      return null;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.mode === 'mongodb' && mongoClient) {
      await mongoClient.close();
      console.log('👋 Disconnected from MongoDB');
    }
  }
}

// Export singleton instance
export default new Database();
