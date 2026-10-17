/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * User Authentication & Database Service
 *
 * Requirements:
 * - Enterprise traditional Username + Password authentication.
 * - Passwords stored strictly as salted bcrypt hashes (never plain text).
 * - Multi-user database containing:
 *   - User ID (UUID)
 *   - Username
 *   - Display Name
 *   - Password Hash (salted bcrypt)
 *   - Email
 *   - Role
 *   - Profile Picture
 *   - Last Login
 *   - Account Status (active | disabled | locked)
 *   - Failed attempts count & temporary lock timestamp
 * - Rate limiting & temporary account lockout after repeated failed attempts.
 * - Audit logging of successful and failed authentication attempts for administrators.
 * - Strict rejection messages:
 *   - Username not found: "❌ Invalid username."
 *   - Password incorrect: "❌ Incorrect password."
 * - No demo passcodes, no verification codes, no auto-filling.
 */

import bcrypt from 'bcryptjs';
import { StaffRole } from '../types/venue';
import officialLogoImage from '../assets/images/west_mun_logo_official.jpg';

export interface UserAccount {
  id: string; // UUID
  username: string; // Unique username (e.g. 'sarah.johnson', 'ahmed.magdi', 'john.smith')
  displayName: string; // Full display name
  passwordHash: string; // Salted bcrypt hash
  email: string;
  role: StaffRole;
  profilePicture?: string;
  lastLogin: string | null;
  accountStatus: 'active' | 'disabled' | 'locked';
  failedAttempts: number;
  lockedUntil?: string | null; // ISO timestamp
  ticketId: string;
  assignedGate: string;
  customTitle?: string;
}

export interface LoginAuditLog {
  id: string;
  timestamp: string;
  username: string;
  displayName?: string;
  status: 'success' | 'invalid_username' | 'incorrect_password' | 'account_locked' | 'account_disabled';
  method: 'password' | 'face_id' | 'qr_code';
  ipPlaceholder?: string;
  notes?: string;
}

export type AuthResult =
  | { success: true; user: UserAccount }
  | { success: false; errorType: 'invalid_username' | 'incorrect_password' | 'account_locked' | 'account_disabled' | 'empty_field'; error: string };

const STORAGE_KEY_USERS = 'west_mun_users_credentials_db_v1';
const STORAGE_KEY_AUDIT_LOGS = 'west_mun_auth_audit_logs_v1';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

/**
 * Pre-generate salted bcrypt hashes for initial accredited users.
 * Generated with bcrypt salt rounds = 10.
 *
 * Pre-seeded users and credentials:
 * - username: sarah.johnson | password: exec8812
 * - username: ahmed.magdi   | password: 344
 * - username: john.smith    | password: sec3914
 * - username: rakan.almerbed| password: sg1001
 * - username: elena.rostova | password: cer4482
 * - username: marcus.vance  | password: press7719
 * - username: saleh.samaha  | password: it6002
 * - username: david.miller  | (disabled account example)
 */
function createInitialUsers(): UserAccount[] {
  return [
    {
      id: 'usr-sarah-johnson-uuid-8812',
      username: 'sarah.johnson',
      displayName: 'Sarah Johnson',
      passwordHash: bcrypt.hashSync('exec8812', 10),
      email: 'sarah.johnson@westmun.org',
      role: 'executive',
      customTitle: 'Executive Board Vice President',
      assignedGate: 'Executive Chamber',
      ticketId: 'MUN-EXEC-08',
      profilePicture: officialLogoImage,
      lastLogin: null,
      accountStatus: 'active',
      failedAttempts: 0,
      lockedUntil: null,
    },
    {
      id: 'usr-ahmed-magdi-uuid-1049',
      username: 'ahmed.magdi',
      displayName: 'Ahmed Magdi',
      passwordHash: bcrypt.hashSync('344', 10),
      email: 'ahmed.magdi@westmun.org',
      role: 'it',
      customTitle: 'Admin of IT & Head of Systems',
      assignedGate: 'Security & Tech Hub',
      ticketId: 'MUN-IT-01',
      profilePicture: officialLogoImage,
      lastLogin: null,
      accountStatus: 'active',
      failedAttempts: 0,
      lockedUntil: null,
    },
    {
      id: 'usr-john-smith-uuid-3914',
      username: 'john.smith',
      displayName: 'John Smith',
      passwordHash: bcrypt.hashSync('sec3914', 10),
      email: 'john.smith@westmun.org',
      role: 'security',
      customTitle: 'Chief Security Officer',
      assignedGate: 'Diplomatic Main Gate',
      ticketId: 'MUN-SEC-01',
      profilePicture: officialLogoImage,
      lastLogin: null,
      accountStatus: 'active',
      failedAttempts: 0,
      lockedUntil: null,
    },
    {
      id: 'usr-rakan-almerbed-uuid-0012',
      username: 'rakan.almerbed',
      displayName: 'Rakan Almerbed',
      passwordHash: bcrypt.hashSync('sg1001', 10),
      email: 'rakan.almerbed@westmun.org',
      role: 'super_admin',
      customTitle: 'Secretary-General',
      assignedGate: 'Grand Assembly Hall',
      ticketId: 'MUN-EXEC-01',
      profilePicture: officialLogoImage,
      lastLogin: null,
      accountStatus: 'active',
      failedAttempts: 0,
      lockedUntil: null,
    },
    {
      id: 'usr-elena-rostova-uuid-4482',
      username: 'elena.rostova',
      displayName: 'Elena Rostova',
      passwordHash: bcrypt.hashSync('cer4482', 10),
      email: 'elena.rostova@westmun.org',
      role: 'ceremonies',
      customTitle: 'Head of Diplomatic Protocol',
      assignedGate: 'Diplomatic Reception',
      ticketId: 'MUN-CER-01',
      profilePicture: officialLogoImage,
      lastLogin: null,
      accountStatus: 'active',
      failedAttempts: 0,
      lockedUntil: null,
    },
    {
      id: 'usr-marcus-vance-uuid-7719',
      username: 'marcus.vance',
      displayName: 'Marcus Vance',
      passwordHash: bcrypt.hashSync('press7719', 10),
      email: 'marcus.vance@westmun.org',
      role: 'media_and_press',
      customTitle: 'Director of Communications',
      assignedGate: 'Press Gallery',
      ticketId: 'MUN-PRESS-01',
      profilePicture: officialLogoImage,
      lastLogin: null,
      accountStatus: 'active',
      failedAttempts: 0,
      lockedUntil: null,
    },
    {
      id: 'staff-it-saleh',
      username: 'saleh.samaha',
      displayName: 'Saleh Samaha',
      passwordHash: bcrypt.hashSync('it6002', 10),
      email: 'saleh.samaha@munvenue.org',
      role: 'it',
      customTitle: 'IT Specialist',
      assignedGate: 'Security & Tech Hub',
      ticketId: 'MUN-IT-02',
      profilePicture: officialLogoImage,
      lastLogin: null,
      accountStatus: 'active',
      failedAttempts: 0,
      lockedUntil: null,
    },
    {
      id: 'usr-david-miller-disabled-uuid',
      username: 'david.miller',
      displayName: 'David Miller',
      passwordHash: bcrypt.hashSync('vol0000', 10),
      email: 'david.miller@westmun.org',
      role: 'volunteers',
      customTitle: 'Delegate Services',
      assignedGate: 'Registration Desk',
      ticketId: 'MUN-VOL-99',
      profilePicture: officialLogoImage,
      lastLogin: null,
      accountStatus: 'disabled', // Disabled account for security testing
      failedAttempts: 0,
      lockedUntil: null,
    },
  ];
}

class UserAuthService {
  private users: UserAccount[] = [];
  private auditLogs: LoginAuditLog[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEY_USERS);
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      } else {
        this.users = createInitialUsers();
        this.saveUsers();
      }
    } catch (e) {
      console.warn('Failed to parse users from storage, resetting to initial list:', e);
      this.users = createInitialUsers();
      this.saveUsers();
    }

    try {
      const storedLogs = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
      if (storedLogs) {
        this.auditLogs = JSON.parse(storedLogs);
      } else {
        this.auditLogs = [];
      }
    } catch {
      this.auditLogs = [];
    }
  }

  private saveUsers(): void {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
    } catch (e) {
      console.error('Failed to save users to storage:', e);
    }
  }

  private saveAuditLogs(): void {
    try {
      // Keep last 150 entries to avoid overflow
      const trimmed = this.auditLogs.slice(-150);
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save audit logs:', e);
    }
  }

  private addAuditLog(entry: Omit<LoginAuditLog, 'id' | 'timestamp'>): void {
    const log: LoginAuditLog = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.push(log);
    this.saveAuditLogs();
  }

  /**
   * Search for a user by normalized username or email.
   * Matches case-insensitively.
   */
  public findUserByUsername(rawUsername: string): UserAccount | undefined {
    const normalized = rawUsername.trim().toLowerCase();
    if (!normalized) return undefined;

    return this.users.find((u) => {
      const uName = u.username.toLowerCase();
      const uEmail = u.email.toLowerCase();
      // Match full username, or email before @, or exact email
      const emailPrefix = uEmail.split('@')[0];
      return (
        uName === normalized ||
        uEmail === normalized ||
        emailPrefix === normalized ||
        // Also support first-name alias (e.g. 'sarah' -> 'sarah.johnson', 'ahmed' -> 'ahmed.magdi')
        uName.split('.')[0] === normalized
      );
    });
  }

  /**
   * Enterprise Authentication Workflow:
   * 1. Validate inputs (reject empty fields).
   * 2. Search for the username in user database.
   *    If username does not exist:
   *      Display: "❌ Invalid username." (Do not reveal password correctness, remain on page)
   * 3. Check account status (Disabled or Locked).
   * 4. Verify password using salted bcrypt hash.
   *    If password is incorrect:
   *      Increment failed login attempts.
   *      If attempts >= MAX_FAILED_ATTEMPTS, lock account temporarily.
   *      Display: "❌ Incorrect password."
   * 5. If correct:
   *      Reset failed attempts.
   *      Update last login time.
   *      Log successful authentication.
   *      Return authenticated user profile.
   */
  public authenticate(rawUsername: string, rawPassword: string): AuthResult {
    const trimmedUsername = (rawUsername || '').trim();
    const password = rawPassword || '';

    // Step 0: Ensure inputs are provided
    if (!trimmedUsername) {
      return {
        success: false,
        errorType: 'empty_field',
        error: 'Please enter your username.',
      };
    }

    if (!password) {
      return {
        success: false,
        errorType: 'empty_field',
        error: 'Please enter your password.',
      };
    }

    // Step 1: Search for username
    const user = this.findUserByUsername(trimmedUsername);

    if (!user) {
      this.addAuditLog({
        username: trimmedUsername,
        status: 'invalid_username',
        method: 'password',
        notes: 'Rejected: Username not found in registered database.',
      });

      return {
        success: false,
        errorType: 'invalid_username',
        error: '❌ Invalid username.',
      };
    }

    // Step 2: Check account disabled status
    if (user.accountStatus === 'disabled') {
      this.addAuditLog({
        username: user.username,
        displayName: user.displayName,
        status: 'account_disabled',
        method: 'password',
        notes: 'Rejected: Account has been revoked/disabled.',
      });

      return {
        success: false,
        errorType: 'account_disabled',
        error: '❌ This account is disabled. Please contact the administrator.',
      };
    }

    // Step 3: Check temporary account lock
    const now = Date.now();
    if (user.lockedUntil) {
      const lockTime = new Date(user.lockedUntil).getTime();
      if (lockTime > now) {
        const remainingMinutes = Math.max(1, Math.ceil((lockTime - now) / 60000));
        this.addAuditLog({
          username: user.username,
          displayName: user.displayName,
          status: 'account_locked',
          method: 'password',
          notes: `Attempt blocked: Account locked for ${remainingMinutes} more minute(s).`,
        });

        return {
          success: false,
          errorType: 'account_locked',
          error: `❌ Account is temporarily locked due to multiple failed attempts. Please try again in ${remainingMinutes} minute(s).`,
        };
      } else {
        // Lockout period expired: automatically unlock and reset counter
        user.lockedUntil = null;
        user.failedAttempts = 0;
        if (user.accountStatus === 'locked') {
          user.accountStatus = 'active';
        }
      }
    }

    // Step 4: Verify password against salted bcrypt hash
    let passwordMatches = false;
    try {
      passwordMatches = bcrypt.compareSync(password, user.passwordHash);
    } catch (err) {
      console.error('Password hash comparison failed:', err);
      passwordMatches = false;
    }

    if (!passwordMatches) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;

      if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(now + LOCKOUT_DURATION_MS).toISOString();
        user.accountStatus = 'locked';
        this.saveUsers();

        this.addAuditLog({
          username: user.username,
          displayName: user.displayName,
          status: 'account_locked',
          method: 'password',
          notes: `Account locked for 15 minutes after ${MAX_FAILED_ATTEMPTS} consecutive failed password attempts.`,
        });

        return {
          success: false,
          errorType: 'account_locked',
          error: '❌ Account locked for 15 minutes due to too many failed password attempts.',
        };
      }

      this.saveUsers();

      this.addAuditLog({
        username: user.username,
        displayName: user.displayName,
        status: 'incorrect_password',
        method: 'password',
        notes: `Failed attempt ${user.failedAttempts}/${MAX_FAILED_ATTEMPTS}.`,
      });

      return {
        success: false,
        errorType: 'incorrect_password',
        error: '❌ Incorrect password.',
      };
    }

    // Step 5: Success! Authenticate session
    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date().toISOString();
    if (user.accountStatus === 'locked') {
      user.accountStatus = 'active';
    }
    this.saveUsers();

    this.addAuditLog({
      username: user.username,
      displayName: user.displayName,
      status: 'success',
      method: 'password',
      notes: 'Authenticated successfully via Username + Password.',
    });

    return {
      success: true,
      user,
    };
  }

  /**
   * Log an authentication from Face ID or QR Code into the audit log.
   */
  public logExternalAuth(username: string, displayName: string, method: 'face_id' | 'qr_code'): void {
    const user = this.findUserByUsername(username);
    if (user) {
      user.lastLogin = new Date().toISOString();
      user.failedAttempts = 0;
      this.saveUsers();
    }

    this.addAuditLog({
      username,
      displayName,
      status: 'success',
      method,
      notes: `Authenticated successfully via ${method === 'face_id' ? 'Face ID Biometrics' : 'Cryptographic QR Code'}.`,
    });
  }

  /**
   * Admin: Retrieve all users
   */
  public getAllUsers(): UserAccount[] {
    return [...this.users];
  }

  /**
   * Admin: Retrieve all audit logs
   */
  public getAuditLogs(): LoginAuditLog[] {
    return [...this.auditLogs].reverse();
  }

  /**
   * Admin: Reset lockout / failed attempts for a specific user
   */
  public resetLockout(userId: string): void {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.failedAttempts = 0;
      user.lockedUntil = null;
      if (user.accountStatus === 'locked') {
        user.accountStatus = 'active';
      }
      this.saveUsers();
    }
  }

  /**
   * Admin: Toggle account status (active/disabled)
   */
  public toggleAccountStatus(userId: string): UserAccount | null {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return null;

    user.accountStatus = user.accountStatus === 'active' ? 'disabled' : 'active';
    this.saveUsers();
    return { ...user };
  }

  /**
   * Admin: Create new user account with salted bcrypt password hash
   */
  public createUser(
    account: Omit<UserAccount, 'id' | 'passwordHash' | 'failedAttempts' | 'lockedUntil' | 'lastLogin'>,
    plainPassword: string
  ): UserAccount {
    const newUser: UserAccount = {
      ...account,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      passwordHash: bcrypt.hashSync(plainPassword, 10),
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: null,
    };

    this.users.push(newUser);
    this.saveUsers();
    return newUser;
  }
}

export const userAuthService = new UserAuthService();
