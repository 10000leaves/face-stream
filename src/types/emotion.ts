export interface EmotionScore {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

export interface DetectionResult {
  emotion: EmotionScore;
  dominantEmotion: string;
  confidence: number;
}

export const emotionTranslations: Record<string, string> = {
  neutral: '無表情',
  happy: '笑顔',
  sad: '悲しい',
  angry: '怒り',
  fearful: '怖い',
  disgusted: '気分が悪い',
  surprised: '驚き'
};