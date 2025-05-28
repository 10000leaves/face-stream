'use client';

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { useEmotionDetection } from '../hooks/useEmotionDetection';
import { DetectionResult, emotionTranslations } from '../types/emotion';

const EmotionDetector: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  
  const { isLoaded, error, startDetection, stopDetection } = useEmotionDetection();

  // デフォルトの表情データ（顔が検出されていない時用）
  const defaultEmotion: DetectionResult = {
    emotion: {
      neutral: 0.14,
      happy: 0.14,
      sad: 0.14,
      angry: 0.14,
      fearful: 0.14,
      disgusted: 0.15,
      surprised: 0.15
    },
    dominantEmotion: 'neutral',
    confidence: 0
  };

  // 検出開始/停止
  const toggleDetection = () => {
    if (isDetecting) {
      stopDetection();
      setIsDetecting(false);
      setDetection(null);
      setFaceDetected(false);
    } else {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;
      
      if (video && canvas && isLoaded && isCameraOn) {
        startDetection(video, canvas, (result) => {
          setDetection(result);
          setFaceDetected(result !== null);
        });
        setIsDetecting(true);
      }
    }
  };

  // カメラオン/オフ
  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    if (isDetecting) {
      stopDetection();
      setIsDetecting(false);
      setDetection(null);
      setFaceDetected(false);
    }
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  // 表示用の表情データを取得
  const displayEmotion = isDetecting ? (detection || defaultEmotion) : null;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          リアルタイム表情分析
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 max-w-2xl mx-auto">
            {error}
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          {/* カメラ表示エリア - 中央配置 */}
          <div className="flex justify-center mb-6">
            <div className="relative bg-white rounded-lg shadow-lg p-6">
              <div className="relative inline-block">
                {/* カメラまたは黒画面 */}
                {isCameraOn ? (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    width={640}
                    height={480}
                    screenshotFormat="image/jpeg"
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-[640px] h-[480px] bg-black rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-6xl mb-4">📷</div>
                      <p className="text-lg">カメラがオフです</p>
                    </div>
                  </div>
                )}

                {/* 顔認識キャンバス */}
                {isCameraOn && (
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 rounded-lg pointer-events-none"
                    width={640}
                    height={480}
                  />
                )}

                {/* 現在の表情 - 左上（検出中は常に表示） */}
                {displayEmotion && (
                  <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {getEmotionEmoji(displayEmotion.dominantEmotion)}
                      </span>
                      <div>
                        <div className="font-bold text-lg">
                          {emotionTranslations[displayEmotion.dominantEmotion]}
                        </div>
                        <div className="text-xs opacity-80">
                          {faceDetected 
                            ? `${(displayEmotion.confidence * 100).toFixed(1)}%`
                            : '顔を探しています'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 顔認識ステータス - 右上 */}
                <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      isDetecting && faceDetected 
                        ? 'bg-green-400' 
                        : isDetecting 
                        ? 'bg-yellow-400' 
                        : 'bg-red-400'
                    }`}></div>
                    <span>
                      {isDetecting && faceDetected 
                        ? '顔認識中' 
                        : isDetecting 
                        ? '顔を探しています' 
                        : '停止中'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 各表情のパーセント - 横並び（検出中は常に表示） */}
          {displayEmotion && (
            <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(displayEmotion.emotion).map(([emotion, score]) => (
                  <div
                    key={emotion}
                    className={`text-center p-2 rounded-lg transition-colors ${
                      emotion === displayEmotion.dominantEmotion && faceDetected
                        ? 'bg-blue-100 border-2 border-blue-300'
                        : faceDetected
                        ? 'bg-gray-50'
                        : 'bg-gray-100'
                    }`}
                  >
                    <div className="text-lg mb-1">
                      {getEmotionEmoji(emotion)}
                    </div>
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      {emotionTranslations[emotion]}
                    </div>
                    <div className={`text-xs font-bold ${
                      faceDetected ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {faceDetected ? (score * 100).toFixed(0) : '--'}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div
                        className={`h-1 rounded-full transition-all duration-300 ${
                          emotion === displayEmotion.dominantEmotion && faceDetected
                            ? 'bg-blue-500'
                            : faceDetected
                            ? 'bg-gray-400'
                            : 'bg-gray-300'
                        }`}
                        style={{ 
                          width: faceDetected ? `${score * 100}%` : '14%'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {!faceDetected && isDetecting && (
                <div className="text-center text-gray-500 text-sm mt-2">
                  顔が検出されるまでお待ちください
                </div>
              )}
            </div>
          )}

          {/* コントロールボタン */}
          <div className="flex justify-center gap-4">
            {/* カメラオン/オフボタン */}
            <button
              onClick={toggleCamera}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                isCameraOn
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              {isCameraOn ? '📷 カメラオン' : '📷 カメラオフ'}
            </button>

            {/* 検出開始/停止ボタン */}
            <button
              onClick={toggleDetection}
              disabled={!isLoaded || !isCameraOn}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                !isLoaded || !isCameraOn
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isDetecting
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {!isLoaded
                ? 'モデル読み込み中...'
                : isDetecting
                ? '⏹️ 検出停止'
                : '▶️ 検出開始'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 表情に対応する絵文字を取得
const getEmotionEmoji = (emotion: string): string => {
  const emojiMap: Record<string, string> = {
    neutral: '😐',
    happy: '😊',
    sad: '😢',
    angry: '😠',
    fearful: '😨',
    disgusted: '🤢',
    surprised: '😲'
  };
  return emojiMap[emotion] || '😐';
};

export default EmotionDetector;