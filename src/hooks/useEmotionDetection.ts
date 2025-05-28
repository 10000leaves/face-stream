import { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { DetectionResult, EmotionScore } from '../types/emotion';

export const useEmotionDetection = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // モデルの読み込み
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        
        setIsLoaded(true);
      } catch (err) {
        console.error('モデルの読み込みに失敗しました:', err);
        setError('モデルの読み込みに失敗しました');
      }
    };

    loadModels();
  }, []);

  // 表情検出の開始
  const startDetection = useCallback((
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    onDetection: (result: DetectionResult | null) => void
  ) => {
    if (!isLoaded) return;

    const detect = async () => {
      if (videoElement && canvasElement) {
        try {
          const detections = await faceapi
            .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

          // キャンバスをクリア
          const displaySize = { width: videoElement.videoWidth, height: videoElement.videoHeight };
          faceapi.matchDimensions(canvasElement, displaySize);
          
          const ctx = canvasElement.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          }

          if (detections.length > 0) {
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            
            // 顔の枠を描画
            faceapi.draw.drawDetections(canvasElement, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvasElement, resizedDetections);

            // 最初の顔の表情を取得
            const expressions = detections[0].expressions as EmotionScore;
            const dominantEmotion = getDominantEmotion(expressions);
            const confidence = expressions[dominantEmotion as keyof EmotionScore];

            onDetection({
              emotion: expressions,
              dominantEmotion,
              confidence
            });
          } else {
            onDetection(null);
          }
        } catch (err) {
          console.error('検出エラー:', err);
        }
      }
    };

    intervalRef.current = setInterval(detect, 100);
  }, [isLoaded]);

  // 表情検出の停止
  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { isLoaded, error, startDetection, stopDetection };
};

// 最も強い表情を取得
const getDominantEmotion = (expressions: EmotionScore): string => {
  return Object.keys(expressions).reduce((a, b) => 
    expressions[a as keyof EmotionScore] > expressions[b as keyof EmotionScore] ? a : b
  );
};