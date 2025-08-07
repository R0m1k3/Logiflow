import { 
  type User, 
  type UpsertUser, 
  type Group, 
  type InsertGroup,
  type DashboardMessage,
  type InsertDashboardMessage,
  type DashboardMessageWithRelations,
  type IStorage
} from "@shared/schema";
import { hashPassword } from "./localAuth";

// Simple in-memory storage for development
class MemoryStorage {
  private users: Map<string, User> = new Map();
  private groups: Map<number, Group> = new Map();
  private dashboardMessages: Map<number, DashboardMessage> = new Map();
  private messageCounter = 1;
  private groupCounter = 1;

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Create admin user
    const adminPasswordHash = await hashPassword('admin');
    const adminUser: User = {
      id: '1',
      username: 'admin',
      email: 'admin@logiflow.com',
      name: 'Admin System',
      firstName: 'Admin',
      lastName: 'System',
      role: 'admin',
      password: adminPasswordHash,
      passwordChanged: false,
      createdAt: new Date(),
      lastLogin: null,
      profilePicture: null
    };
    this.users.set('1', adminUser);
    this.users.set('admin', adminUser); // Also store by username for lookup

    // Create default group
    const defaultGroup: Group = {
      id: 1,
      name: 'Magasin Principal',
      color: '#3B82F6',
      type: 'store',
      createdAt: new Date()
    };
    this.groups.set(1, defaultGroup);

    console.log('🔧 Memory storage initialized with admin user and default group');
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.get(username);
  }

  async getUserWithGroups(id: string): Promise<any> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    return {
      ...user,
      groups: [this.groups.get(1)] // Default to first group
    };
  }

  async createUser(data: UpsertUser): Promise<User> {
    const userId = String(this.users.size + 1);
    const user: User = {
      id: userId,
      username: data.username,
      email: data.email,
      name: data.name || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      role: data.role || 'employee',
      password: data.password || '',
      passwordChanged: data.passwordChanged || false,
      createdAt: new Date(),
      lastLogin: null,
      profilePicture: null
    };
    this.users.set(userId, user);
    this.users.set(data.username, user);
    return user;
  }

  // Group operations
  async getGroups(): Promise<Group[]> {
    return Array.from(this.groups.values());
  }

  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async createGroup(data: InsertGroup): Promise<Group> {
    const group: Group = {
      id: this.groupCounter++,
      name: data.name,
      color: data.color || '#666666',
      type: data.type || 'store',
      createdAt: new Date()
    };
    this.groups.set(group.id, group);
    return group;
  }

  // Dashboard messages operations
  async getDashboardMessages(groupIds?: number[]): Promise<DashboardMessageWithRelations[]> {
    const messages = Array.from(this.dashboardMessages.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    return messages.map(message => ({
      ...message,
      creator: this.users.get('1')!,
      store: message.storeId ? this.groups.get(message.storeId) : null
    }));
  }

  async getDashboardMessage(id: number): Promise<DashboardMessageWithRelations | undefined> {
    const message = this.dashboardMessages.get(id);
    if (!message) return undefined;

    return {
      ...message,
      creator: this.users.get('1')!,
      store: message.storeId ? this.groups.get(message.storeId) : null
    };
  }

  async createDashboardMessage(data: InsertDashboardMessage): Promise<DashboardMessage> {
    const message: DashboardMessage = {
      id: this.messageCounter++,
      title: data.title,
      content: data.content,
      type: data.type || 'info',
      storeId: data.storeId || null,
      createdBy: data.createdBy,
      createdAt: new Date()
    };
    this.dashboardMessages.set(message.id, message);
    return message;
  }

  async deleteDashboardMessage(id: number): Promise<void> {
    this.dashboardMessages.delete(id);
  }

  // Placeholder methods for compatibility
  async getRoles(): Promise<any[]> { return []; }
  async getPermissions(): Promise<any[]> { return []; }
  async getUserRoles(userId: string): Promise<any[]> { return []; }
  async getRolePermissions(roleId: number): Promise<any[]> { return []; }
}

export const memStorage = new MemoryStorage();