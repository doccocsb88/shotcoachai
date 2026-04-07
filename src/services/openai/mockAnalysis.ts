import { AnalysisResult } from '../../models/analysis';

export function createMockAnalysisResult(originalImageUri: string): AnalysisResult {
  return {
    analysisId: `${Date.now()}`,
    overallScore: 7.6,
    subscores: {
      composition: 7.8,
      pose: 6.9,
      camera_angle: 7.1,
      background: 8.0,
      lighting: 7.4
    },
    summary: 'Good scene and light, but the crop and subject placement can be stronger.',
    strengths: [
      'The background has useful depth',
      'Lighting is balanced enough for a clean result',
      'The frame already has a clear subject'
    ],
    issues: [
      'The subject sits too close to the center',
      'The camera angle could be slightly lower',
      'The frame has extra space that weakens the shot'
    ],
    suggestions: [
      {
        title: 'Cleaner Composition',
        description: 'Move the subject toward the right third and crop a little tighter.'
      },
      {
        title: 'Look Taller',
        description: 'Lower the camera slightly and keep the body turned a bit.'
      },
      {
        title: 'Simpler Frame',
        description: 'Keep the brightest background details away from the face area.'
      }
    ],
    overlayData: {
      grid: true,
      cropRect: {
        x: 0.12,
        y: 0.08,
        w: 0.76,
        h: 0.84
      },
      arrows: [
        {
          from: [0.5, 0.66],
          to: [0.62, 0.66],
          label: 'Move slightly right'
        },
        {
          from: [0.48, 0.88],
          to: [0.48, 0.78],
          label: 'Lower camera'
        }
      ],
      notes: [
        {
          x: 0.55,
          y: 0.28,
          text: 'Turn shoulders a bit'
        },
        {
          x: 0.18,
          y: 0.12,
          text: 'Crop tighter'
        }
      ]
    },
    visualOutput: {
      type: 'overlay_only'
    },
    createdAt: new Date().toISOString(),
    originalImageUri
  };
}
