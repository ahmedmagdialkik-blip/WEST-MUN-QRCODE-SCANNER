/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Enrolled Users Store for FaceAPI Biometric Authentication
 * Manages enrolled biometric profiles with 128-dimensional face descriptors.
 *
 * Each enrolled user stores:
 * - UUID
 * - Full Name
 * - Profile Photo
 * - Face Descriptor
 * - Created Date
 * - Last Login
 */

import { EnrolledUser } from './types';
import { StaffRole } from '../types/venue';
import { faceApiService } from '../services/faceApiService';

const STORAGE_KEY_ENROLLED = 'west_mun_faceapi_enrolled_users_v3';

// UUID v4 generator
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class EnrollmentStore {
  private enrolledUsers: EnrolledUser[] = [];
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ENROLLED);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Only keep valid profiles with 128-d face descriptors
          this.enrolledUsers = parsed.filter(
            (u: EnrolledUser) =>
              u &&
              u.id &&
              u.fullName &&
              Array.isArray(u.descriptor) &&
              u.descriptor.length === 128
          );
        }
      }
    } catch {
      this.enrolledUsers = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY_ENROLLED, JSON.stringify(this.enrolledUsers));
    } catch (err) {
      console.warn('Could not save enrolled users to localStorage:', err);
    }
  }

  public getEnrolledUsers(): EnrolledUser[] {
    return this.enrolledUsers;
  }

  public getUserById(id: string): EnrolledUser | undefined {
    return this.enrolledUsers.find((u) => u.id === id);
  }

  /**
   * Enrolls a user from a reference image and computes its 128-d FaceAPI descriptor.
   * Throws an error if no face is detected in the image.
   */
  public async enrollUser(userData: {
    fullName: string;
    profilePhoto: string;
    email?: string;
    role?: StaffRole;
    ticketId?: string;
  }): Promise<EnrolledUser> {
    // Compute face descriptor using FaceAPI from the provided reference image
    const descriptorFloat = await faceApiService.computeDescriptorFromImage(userData.profilePhoto);
    if (!descriptorFloat || descriptorFloat.length !== 128) {
      throw new Error(
        `FaceAPI could not detect a valid face in the provided reference image for ${userData.fullName}. Please provide a clear, well-lit portrait photo.`
      );
    }

    const descriptorArray = Array.from(descriptorFloat);

    const newUser: EnrolledUser = {
      id: generateUUID(),
      fullName: userData.fullName.trim(),
      email: userData.email || userData.fullName.toLowerCase().replace(/\s+/g, ''),
      profilePhoto: userData.profilePhoto,
      descriptor: descriptorArray,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      role: userData.role || 'volunteers',
      ticketId: userData.ticketId || `MUN-${(userData.role || 'VOL').substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    // Check if user with same name already enrolled and update, else push
    const existingIndex = this.enrolledUsers.findIndex(
      (u) => u.fullName.toLowerCase() === userData.fullName.toLowerCase()
    );

    if (existingIndex >= 0) {
      this.enrolledUsers[existingIndex] = {
        ...this.enrolledUsers[existingIndex],
        profilePhoto: userData.profilePhoto,
        descriptor: descriptorArray,
      };
    } else {
      this.enrolledUsers.push(newUser);
    }

    this.saveToStorage();
    return newUser;
  }

  public deleteUser(id: string): void {
    this.enrolledUsers = this.enrolledUsers.filter((u) => u.id !== id);
    this.saveToStorage();
  }

  public updateLastLogin(userId: string): void {
    const user = this.enrolledUsers.find((u) => u.id === userId);
    if (user) {
      user.lastLogin = new Date().toISOString();
      this.saveToStorage();
    }
  }

  /**
   * Automatically enrolls the reference image for Ahmed Magdi (/enrolled/ahmed_magdi.jpg)
   * computes its actual 128-d FaceAPI descriptor using TinyFaceDetector and FaceRecognitionNet.
   */
  public async initializeDefaultEnrollment(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      // Check if Ahmed Magdi is already enrolled with a valid 128-d descriptor
      const existingAhmed = this.enrolledUsers.find(
        (u) =>
          u.fullName.toLowerCase().includes('ahmed magdi') &&
          u.descriptor &&
          u.descriptor.length === 128
      );

      if (existingAhmed) {
        this.isInitialized = true;
        return;
      }

      // Automatically enroll provided reference image for Ahmed Magdi
      try {
        await this.enrollUser({
          fullName: 'Ahmed Magdi',
          email: 'AhmedMagdi',
          profilePhoto: '/enrolled/ahmed_magdi.jpg',
          role: 'it',
          ticketId: 'MUN-IT-01',
        });
        this.isInitialized = true;
      } catch (err) {
        console.error('Initial auto-enrollment of Ahmed Magdi reference photo failed:', err);
        throw err;
      }
    })();

    return this.initPromise;
  }
}

export const enrollmentStore = new EnrollmentStore();
