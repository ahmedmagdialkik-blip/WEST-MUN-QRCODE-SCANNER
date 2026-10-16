/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Real Biometric Facial Recognition Pipeline
 * Built with @vladmandic/face-api (TensorFlow.js backend)
 *
 * Architecture:
 * 1. Model Loading: Loads TinyFaceDetector, FaceLandmark68Net, and FaceRecognitionNet from static /models
 * 2. Enrollment: Computes 128-dimensional facial descriptor from enrolled photo of Ahmed Magdi
 * 3. Live Verification: Captures live webcam stream, detects facial landmarks, computes live descriptor,
 *    and calculates Euclidean distance against the enrolled reference descriptor.
 * 4. Secure Thresholding: Strict Euclidean distance cutoff (<= 0.52) for genuine biometric verification.
 */

import * as faceapi from '@vladmandic/face-api';
import enrolledPhotoUrl from '../assets/images/ahmed_magdi_face.jpg';

export interface FaceMatchResult {
  isMatch: boolean;
  distance: number;
  similarity: number;
  landmarks?: faceapi.FaceLandmarks68;
  box?: faceapi.Box;
}

export interface ModelLoadingStatus {
  isLoaded: boolean;
  isLoading: boolean;
  error?: string;
}

class FaceRecognitionEngine {
  private modelsLoaded = false;
  private isLoading = false;
  private enrolledDescriptor: Float32Array | null = null;
  private enrolledImageElement: HTMLImageElement | null = null;
  private loadPromise: Promise<void> | null = null;

  // Real threshold: Euclidean distance < 0.52 is recognized as the same person
  private readonly SIMILARITY_THRESHOLD = 0.52;

  /**
   * Initializes the AI models and computes reference descriptor for Ahmed Magdi.
   */
  public async initialize(): Promise<void> {
    if (this.modelsLoaded && this.enrolledDescriptor) return;
    if (this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    this.loadPromise = (async () => {
      try {
        const modelUri = '/models';

        // 1. Load TinyFaceDetector, FaceLandmark68Net, and FaceRecognitionNet
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelUri),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelUri),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelUri),
        ]);

        this.modelsLoaded = true;

        // 2. Pre-enroll Ahmed Magdi's uploaded reference photograph
        await this.enrollReferenceImage(enrolledPhotoUrl);

        this.isLoading = false;
      } catch (err) {
        this.isLoading = false;
        console.error('Failed to load Face-API neural models:', err);
        throw new Error(
          err instanceof Error
            ? err.message
            : 'Could not load facial recognition models from /models'
        );
      }
    })();

    return this.loadPromise;
  }

  /**
   * Loads the enrolled image and extracts its 128-float facial descriptor
   */
  public async enrollReferenceImage(imgUrl: string): Promise<Float32Array> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgUrl;

      img.onload = async () => {
        try {
          this.enrolledImageElement = img;

          // Detect face and extract descriptor from uploaded photo
          const detection = await faceapi
            .detectSingleFace(
              img,
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 416,
                scoreThreshold: 0.5,
              })
            )
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!detection) {
            // Fallback with standard settings if inputSize 416 was too selective
            const fallbackDetection = await faceapi
              .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }))
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (!fallbackDetection) {
              throw new Error('No face detected in reference photo of Ahmed Magdi');
            }
            this.enrolledDescriptor = fallbackDetection.descriptor;
            resolve(fallbackDetection.descriptor);
            return;
          }

          this.enrolledDescriptor = detection.descriptor;
          resolve(detection.descriptor);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load enrolled image from: ${imgUrl}`));
      };
    });
  }

  public isReady(): boolean {
    return this.modelsLoaded && this.enrolledDescriptor !== null;
  }

  public getEnrolledDescriptor(): Float32Array | null {
    return this.enrolledDescriptor;
  }

  /**
   * Detects a live face in an HTML5 video stream, computes its descriptor,
   * and matches it against the stored descriptor for Ahmed Magdi.
   */
  public async verifyLiveFace(
    videoEl: HTMLVideoElement
  ): Promise<FaceMatchResult | null> {
    if (!this.isReady() || !videoEl || videoEl.readyState < 2) {
      return null;
    }

    try {
      const detection = await faceapi
        .detectSingleFace(
          videoEl,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.45,
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return null;
      }

      if (!this.enrolledDescriptor) {
        throw new Error('Enrolled profile descriptor is missing');
      }

      // Calculate Euclidean distance between live face and enrolled face
      const distance = faceapi.euclideanDistance(
        detection.descriptor,
        this.enrolledDescriptor
      );

      // Convert distance to similarity percentage (distance 0 = 100%, distance >= 0.6 = 0%)
      const similarity = Math.max(
        0,
        Math.min(100, Math.round((1 - distance / 0.6) * 100))
      );

      const isMatch = distance <= this.SIMILARITY_THRESHOLD;

      return {
        isMatch,
        distance,
        similarity,
        landmarks: detection.landmarks,
        box: detection.detection.box,
      };
    } catch (err) {
      console.error('Error during live face verification:', err);
      return null;
    }
  }

  /**
   * Compare two descriptors directly
   */
  public compareDescriptors(d1: Float32Array, d2: Float32Array): {
    distance: number;
    isMatch: boolean;
    similarity: number;
  } {
    const distance = faceapi.euclideanDistance(d1, d2);
    const similarity = Math.max(0, Math.min(100, Math.round((1 - distance / 0.6) * 100)));
    return {
      distance,
      isMatch: distance <= this.SIMILARITY_THRESHOLD,
      similarity,
    };
  }
}

export const faceEngine = new FaceRecognitionEngine();
