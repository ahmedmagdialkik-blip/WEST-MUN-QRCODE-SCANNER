/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook: useFaceRecognition
 * Continuously detects faces via official FaceAPI pipeline at 30 FPS,
 * extracts 68-point landmarks and 128-d descriptors, and matches against
 * enrolled profiles in real-time.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceRecognitionState, EnrolledUser } from '../auth/types';
import { faceApiService } from '../services/faceApiService';
import { enrollmentStore } from '../auth/enrollmentStore';

interface UseFaceRecognitionOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onMatchFound?: (user: EnrolledUser) => void;
  enabled?: boolean;
}

export function useFaceRecognition({
  videoRef,
  canvasRef,
  onMatchFound,
  enabled = true,
}: UseFaceRecognitionOptions) {
  const [state, setState] = useState<FaceRecognitionState>({
    status: 'loading_models',
    message: 'Loading FaceAPI models (TinyFaceDetector, Landmarks, Recognition)...',
    confidence: 0,
    distance: null,
    faceCount: 0,
    recognizedUser: null,
    box: null,
    landmarks: null,
  });

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isAuthenticatingRef = useRef<boolean>(false);
  const lastDetectionTimeRef = useRef<number>(0);

  // Stop camera stream safely
  const stopWebcam = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [videoRef]);

  // Request camera and start stream
  const startWebcam = useCallback(
    async (mode: 'user' | 'environment' = facingMode) => {
      stopWebcam();
      setCameraError(null);
      setState((prev) => ({
        ...prev,
        status: 'requesting_camera',
        message: 'Requesting camera permission...',
      }));

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: mode,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setState((prev) => ({
          ...prev,
          status: 'waiting_for_face',
          message: 'Waiting for face...',
        }));
      } catch (err: unknown) {
        console.warn('Camera access error:', err);
        const msg = err instanceof Error ? err.message : String(err);
        let userMsg = 'Unable to access camera feed.';
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          userMsg = 'Camera access was denied. Please allow camera permissions to continue.';
        }
        setCameraError(userMsg);
        setState((prev) => ({
          ...prev,
          status: 'camera_denied',
          message: userMsg,
        }));
      }
    },
    [facingMode, stopWebcam, videoRef]
  );

  const flipCamera = useCallback(() => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startWebcam(nextMode);
  }, [facingMode, startWebcam]);

  // Initialize models and default enrolled user (Ahmed Magdi)
  useEffect(() => {
    let isMounted = true;

    async function initPipeline() {
      try {
        setState((prev) => ({
          ...prev,
          status: 'loading_models',
          message: 'Loading FaceAPI neural models...',
        }));

        await faceApiService.loadModels();
        await enrollmentStore.initializeDefaultEnrollment();

        if (isMounted) {
          await startWebcam(facingMode);
        }
      } catch (err) {
        console.error('FaceAPI pipeline init failed:', err);
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            status: 'error',
            message: 'Failed to load FaceAPI neural models from /models.',
          }));
        }
      }
    }

    if (enabled) {
      initPipeline();
    } else {
      stopWebcam();
    }

    return () => {
      isMounted = false;
      stopWebcam();
    };
  }, [enabled, facingMode, startWebcam, stopWebcam]);

  // Real-time continuous detection loop (~30 FPS)
  useEffect(() => {
    if (!enabled || isAuthenticatingRef.current) return;

    let isRunning = true;

    async function processLoop(timestamp: number) {
      if (!isRunning || isAuthenticatingRef.current) return;

      // Throttle to ~30 FPS (every ~33ms)
      if (timestamp - lastDetectionTimeRef.current >= 33) {
        lastDetectionTimeRef.current = timestamp;

        if (videoRef.current && videoRef.current.readyState >= 2) {
          const detections = await faceApiService.detectFacesFromVideo(videoRef.current);

          // 1. Check: If no face exists
          if (detections.length === 0) {
            setState({
              status: 'waiting_for_face',
              message: 'Waiting for face...',
              confidence: 0,
              distance: null,
              faceCount: 0,
              recognizedUser: null,
              box: null,
              landmarks: null,
            });
          }
          // 2. Check: If multiple faces exist
          else if (detections.length > 1) {
            setState({
              status: 'multiple_faces',
              message: 'Multiple faces detected. Please ensure only one person is visible.',
              confidence: 0,
              distance: null,
              faceCount: detections.length,
              recognizedUser: null,
              box: null,
              landmarks: null,
            });
          }
          // 3. Single Face Detected: Extract descriptor and compare against enrolled users
          else {
            const liveDetection = detections[0];
            const liveDescriptor = liveDetection.descriptor;
            const liveBox = liveDetection.detection.box;
            const landmarksPositions = liveDetection.landmarks
              ? liveDetection.landmarks.positions.map((pt) => ({ x: pt.x, y: pt.y }))
              : null;

            const enrolledList = enrollmentStore.getEnrolledUsers();
            let bestMatchUser: EnrolledUser | null = null;
            let lowestDistance = 999;

            for (const enrolled of enrolledList) {
              if (enrolled.descriptor && enrolled.descriptor.length === 128) {
                const distance = faceApiService.computeDistance(liveDescriptor, enrolled.descriptor);
                if (distance < lowestDistance) {
                  lowestDistance = distance;
                  bestMatchUser = enrolled;
                }
              }
            }

            const confidence = faceApiService.distanceToConfidence(lowestDistance);

            // Check if distance satisfies the threshold (<= 0.50)
            if (lowestDistance <= faceApiService.MATCH_THRESHOLD && bestMatchUser) {
              // Match Found!
              setState({
                status: 'matched',
                message: `Welcome back, ${bestMatchUser.fullName}`,
                confidence,
                distance: lowestDistance,
                faceCount: 1,
                recognizedUser: bestMatchUser,
                box: {
                  x: liveBox.x,
                  y: liveBox.y,
                  width: liveBox.width,
                  height: liveBox.height,
                },
                landmarks: landmarksPositions,
              });

              isAuthenticatingRef.current = true;
              enrollmentStore.updateLastLogin(bestMatchUser.id);

              if (onMatchFound) {
                onMatchFound(bestMatchUser);
              }
              return;
            } else {
              // Face detected but not enrolled or does not match
              setState({
                status: 'user_not_recognized',
                message: 'User not recognized',
                confidence,
                distance: lowestDistance < 900 ? lowestDistance : null,
                faceCount: 1,
                recognizedUser: null,
                box: {
                  x: liveBox.x,
                  y: liveBox.y,
                  width: liveBox.width,
                  height: liveBox.height,
                },
                landmarks: landmarksPositions,
              });
            }
          }
        }
      }

      if (isRunning && !isAuthenticatingRef.current) {
        animFrameIdRef.current = requestAnimationFrame(processLoop);
      }
    }

    animFrameIdRef.current = requestAnimationFrame(processLoop);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [enabled, onMatchFound, videoRef]);

  return {
    state,
    facingMode,
    cameraError,
    startWebcam,
    stopWebcam,
    flipCamera,
  };
}
