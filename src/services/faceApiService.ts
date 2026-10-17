/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Official FaceAPI Service using @vladmandic/face-api
 * Repository: https://github.com/vladmandic/face-api
 *
 * Implements real facial detection, 68-point landmarks, and 128-dimensional
 * face descriptors for real-time authentication.
 */

import * as faceapi from '@vladmandic/face-api';
import { faceModelManager } from '../models/faceModels';

export type DetectedFace = faceapi.WithFaceDescriptor<
  faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>
>;

class FaceApiService {
  // Strict Euclidean distance threshold: <= 0.50 signifies a genuine match
  public readonly MATCH_THRESHOLD = 0.50;

  /**
   * Loads FaceAPI models: TinyFaceDetector, FaceLandmark68Net, FaceRecognitionNet
   */
  public async loadModels(): Promise<void> {
    await faceModelManager.loadAllModels();
  }

  public areModelsLoaded(): boolean {
    return faceModelManager.isReady();
  }

  /**
   * Computes face descriptor from an image element or image URL.
   * If multiple faces exist in reference, selects the primary/largest face.
   */
  public async computeDescriptorFromImage(
    imgInput: HTMLImageElement | string
  ): Promise<Float32Array | null> {
    await this.loadModels();

    let imgEl: HTMLImageElement;
    if (typeof imgInput === 'string') {
      imgEl = await this.loadImageElement(imgInput);
    } else {
      imgEl = imgInput;
    }

    try {
      // 1. Detect faces using TinyFaceDetector
      const detections = await faceapi
        .detectAllFaces(
          imgEl,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.30 })
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections && detections.length > 0) {
        // Pick primary/largest face in reference photo (great for portraits with incidental background)
        const sorted = [...detections].sort(
          (a, b) =>
            b.detection.box.width * b.detection.box.height -
            a.detection.box.width * a.detection.box.height
        );
        return sorted[0].descriptor;
      }

      // 2. Fallback with lower threshold if lighting is subtle
      const fallback = await faceapi
        .detectSingleFace(
          imgEl,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.15 })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (fallback && fallback.descriptor) {
        return fallback.descriptor;
      }

      return null;
    } catch (err) {
      console.warn('FaceAPI computeDescriptorFromImage error:', err);
      return null;
    }
  }

  /**
   * Detects all faces in a live video element with landmarks and descriptors
   */
  public async detectFacesFromVideo(
    videoEl: HTMLVideoElement
  ): Promise<DetectedFace[]> {
    if (!this.areModelsLoaded() || !videoEl || videoEl.readyState < 2) {
      return [];
    }

    try {
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.38,
      });

      return await faceapi
        .detectAllFaces(videoEl, options)
        .withFaceLandmarks()
        .withFaceDescriptors();
    } catch (err) {
      console.warn('FaceAPI detectFacesFromVideo error:', err);
      return [];
    }
  }

  /**
   * Computes Euclidean distance between two 128-d face descriptors
   */
  public computeDistance(d1: Float32Array | number[], d2: Float32Array | number[]): number {
    return faceapi.euclideanDistance(d1, d2);
  }

  /**
   * Calculates similarity percentage from Euclidean distance
   * Distance 0.0 => 100%, Distance 0.5 => 75%, Distance >= 0.6 => 0%
   */
  public distanceToConfidence(distance: number): number {
    if (distance >= 0.6) return 0;
    return Math.max(0, Math.min(100, Math.round((1 - distance / 0.6) * 100)));
  }

  private loadImageElement(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Failed to load image from: ${url}`));
      img.src = url;
    });
  }
}

export const faceApiService = new FaceApiService();
