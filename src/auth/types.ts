/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Types for FaceAPI Facial Recognition Authentication Module
 */

import { StaffRole } from '../types/venue';

export interface EnrolledUser {
  id: string; // UUID
  fullName: string;
  email: string;
  profilePhoto: string;
  descriptor: number[]; // 128-dimensional facial embedding vector
  createdAt: string;
  lastLogin: string | null;
  role: StaffRole;
  ticketId: string;
}

export type RecognitionStatus =
  | 'loading_models'
  | 'requesting_camera'
  | 'waiting_for_face'
  | 'multiple_faces'
  | 'analyzing'
  | 'user_not_recognized'
  | 'matched'
  | 'camera_denied'
  | 'error';

export interface FaceRecognitionState {
  status: RecognitionStatus;
  message: string;
  confidence: number;
  distance: number | null;
  faceCount: number;
  recognizedUser: EnrolledUser | null;
  box: { x: number; y: number; width: number; height: number } | null;
  landmarks?: { x: number; y: number }[] | null;
}
