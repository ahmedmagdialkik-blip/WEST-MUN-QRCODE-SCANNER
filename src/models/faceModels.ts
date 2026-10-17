/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FaceAPI Neural Network Models Manager
 * Loads and verifies:
 * - TinyFaceDetector
 * - FaceLandmark68Net
 * - FaceRecognitionNet
 * Repository: https://github.com/vladmandic/face-api
 */

import * as faceapi from '@vladmandic/face-api';

export const MODEL_BASE_URI = '/models';

export interface ModelLoadProgress {
  tinyFaceDetector: boolean;
  faceLandmark68Net: boolean;
  faceRecognitionNet: boolean;
  allLoaded: boolean;
}

class FaceModelManager {
  private progress: ModelLoadProgress = {
    tinyFaceDetector: false,
    faceLandmark68Net: false,
    faceRecognitionNet: false,
    allLoaded: false,
  };

  private loadPromise: Promise<void> | null = null;

  public async loadAllModels(uri = MODEL_BASE_URI): Promise<void> {
    if (this.progress.allLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(uri).then(() => {
            this.progress.tinyFaceDetector = true;
          }),
          faceapi.nets.faceLandmark68Net.loadFromUri(uri).then(() => {
            this.progress.faceLandmark68Net = true;
          }),
          faceapi.nets.faceRecognitionNet.loadFromUri(uri).then(() => {
            this.progress.faceRecognitionNet = true;
          }),
        ]);

        this.progress.allLoaded = true;
      } catch (err) {
        console.error('Failed to load FaceAPI neural network models from:', uri, err);
        throw err;
      }
    })();

    return this.loadPromise;
  }

  public isReady(): boolean {
    return this.progress.allLoaded;
  }

  public getProgress(): ModelLoadProgress {
    return { ...this.progress };
  }

  public getDetectorOptions(inputSize = 320, scoreThreshold = 0.4): faceapi.TinyFaceDetectorOptions {
    return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });
  }
}

export const faceModelManager = new FaceModelManager();
