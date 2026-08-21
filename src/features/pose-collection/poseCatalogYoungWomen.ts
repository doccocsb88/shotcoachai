import { ImageSourcePropType } from 'react-native';

import { Pose, PoseBodyPosition, PoseCameraAngle, PoseFraming, PoseLocation, PoseStyle } from '../../models/pose';

const browsingSources: Record<string, ImageSourcePropType> = {
  'cafe-window-turn': require('../../../assets/pose-collection/generated/cafe-window-turn.jpg'),
  'cafe-menu-glance': require('../../../assets/pose-collection/generated/cafe-menu-glance.jpg'),
  'saigon-retro-couch': require('../../../assets/pose-collection/generated/saigon-retro-couch.jpg'),
  'dalat-vintage-cafe-sit': require('../../../assets/pose-collection/generated/dalat-vintage-cafe-sit.jpg'),
  'beach-shoreline-twirl': require('../../../assets/pose-collection/generated/beach-shoreline-twirl.jpg'),
  'beach-toes-walk': require('../../../assets/pose-collection/generated/beach-toes-walk.jpg'),
  'beach-hair-sweep': require('../../../assets/pose-collection/generated/beach-hair-sweep.jpg'),
  'coastal-hat-hold': require('../../../assets/pose-collection/generated/coastal-hat-hold.jpg'),
  'street-curb-perch': require('../../../assets/pose-collection/generated/street-curb-perch.jpg'),
  'street-jacket-shoulder': require('../../../assets/pose-collection/generated/street-jacket-shoulder.jpg'),
  'street-forward-stride': require('../../../assets/pose-collection/generated/street-forward-stride.jpg'),
  'hoi-an-lantern-glance': require('../../../assets/pose-collection/generated/hoi-an-lantern-glance.jpg'),
  'nature-trail-lookback': require('../../../assets/pose-collection/generated/nature-trail-lookback.jpg'),
  'nature-flower-crouch': require('../../../assets/pose-collection/generated/nature-flower-crouch.jpg'),
  'dalat-pine-wander': require('../../../assets/pose-collection/generated/dalat-pine-wander.jpg'),
  'nature-meadow-sit': require('../../../assets/pose-collection/generated/nature-meadow-sit.jpg'),
  'store-mirror-step': require('../../../assets/pose-collection/generated/store-mirror-step.jpg'),
  'street-flower-stall': require('../../../assets/pose-collection/generated/street-flower-stall.jpg'),
  'store-exit-turn': require('../../../assets/pose-collection/generated/store-exit-turn.jpg'),
  'vintage-mirror-check': require('../../../assets/pose-collection/generated/vintage-mirror-check.jpg')
};

const overlaySources: Record<string, ImageSourcePropType> = {
  'cafe-window-turn': require('../../../assets/pose-collection/overlays/cafe-window-turn.png'),
  'cafe-menu-glance': require('../../../assets/pose-collection/overlays/cafe-menu-glance.png'),
  'saigon-retro-couch': require('../../../assets/pose-collection/overlays/saigon-retro-couch.png'),
  'dalat-vintage-cafe-sit': require('../../../assets/pose-collection/overlays/dalat-vintage-cafe-sit.png'),
  'beach-shoreline-twirl': require('../../../assets/pose-collection/overlays/beach-shoreline-twirl.png'),
  'beach-toes-walk': require('../../../assets/pose-collection/overlays/beach-toes-walk.png'),
  'beach-hair-sweep': require('../../../assets/pose-collection/overlays/beach-hair-sweep.png'),
  'coastal-hat-hold': require('../../../assets/pose-collection/overlays/coastal-hat-hold.png'),
  'street-curb-perch': require('../../../assets/pose-collection/overlays/street-curb-perch.png'),
  'street-jacket-shoulder': require('../../../assets/pose-collection/overlays/street-jacket-shoulder.png'),
  'street-forward-stride': require('../../../assets/pose-collection/overlays/street-forward-stride.png'),
  'hoi-an-lantern-glance': require('../../../assets/pose-collection/overlays/hoi-an-lantern-glance.png'),
  'nature-trail-lookback': require('../../../assets/pose-collection/overlays/nature-trail-lookback.png'),
  'nature-flower-crouch': require('../../../assets/pose-collection/overlays/nature-flower-crouch.png'),
  'dalat-pine-wander': require('../../../assets/pose-collection/overlays/dalat-pine-wander.png'),
  'nature-meadow-sit': require('../../../assets/pose-collection/overlays/nature-meadow-sit.png'),
  'store-mirror-step': require('../../../assets/pose-collection/overlays/store-mirror-step.png'),
  'street-flower-stall': require('../../../assets/pose-collection/overlays/street-flower-stall.png'),
  'store-exit-turn': require('../../../assets/pose-collection/overlays/store-exit-turn.png'),
  'vintage-mirror-check': require('../../../assets/pose-collection/overlays/vintage-mirror-check.png')
};

interface YoungWomenPoseDraft {
  id: string;
  title: string;
  subtitle: string;
  primaryLocation: PoseLocation;
  styles: PoseStyle[];
  framing: PoseFraming;
  bodyPosition: PoseBodyPosition;
  cameraAngle: PoseCameraAngle;
  howToPose: string;
  cameraGuidance: string;
  searchTerms: string[];
  sortOrder: number;
}

function createYoungWomenPose(draft: YoungWomenPoseDraft): Pose {
  return {
    id: draft.id,
    title: draft.title,
    subtitle: draft.subtitle,
    primaryLocation: draft.primaryLocation,
    subjectCount: 1,
    ageApplicability: ['teen', 'adult'],
    subjectTypes: ['feminine'],
    styles: draft.styles,
    framing: draft.framing,
    bodyPosition: draft.bodyPosition,
    cameraAngle: draft.cameraAngle,
    howToPose: draft.howToPose,
    cameraGuidance: draft.cameraGuidance,
    browsingImage: {
      assetKey: `assets/pose-collection/generated/${draft.id}.jpg`,
      source: browsingSources[draft.id]
    },
    overlayImage: {
      assetKey: `assets/pose-collection/overlays/${draft.id}.png`,
      source: overlaySources[draft.id]
    },
    searchTerms: [...draft.searchTerms, 'female', 'under 30', 'feminine'],
    isFeatured: false,
    sortOrder: draft.sortOrder,
    status: 'published'
  };
}

export const YOUNG_WOMEN_POSE_CATALOG: Pose[] = [
  createYoungWomenPose({
    id: 'cafe-window-turn',
    title: 'Window-Seat Turn',
    subtitle: 'Sit sideways and turn one shoulder to camera.',
    primaryLocation: 'cafe',
    styles: ['candid', 'casual'],
    framing: 'three_quarter',
    bodyPosition: 'sitting',
    cameraAngle: 'eye_level',
    howToPose: 'Sit sideways, lengthen your back, turn one shoulder toward the camera, and look slightly past it.',
    cameraGuidance: 'Eye level, three-quarter crop, window light on the face.',
    searchTerms: ['cafe', 'window', 'sit', 'shoulder'],
    sortOrder: 200
  }),
  createYoungWomenPose({
    id: 'cafe-menu-glance',
    title: 'Cafe Side Glance',
    subtitle: 'Stand angled, glance toward the counter.',
    primaryLocation: 'cafe',
    styles: ['editorial', 'casual'],
    framing: 'three_quarter',
    bodyPosition: 'standing',
    cameraAngle: 'side_angle',
    howToPose: 'Angle your body, shift weight to the back leg, join your hands loosely, and glance sideways.',
    cameraGuidance: 'Slight side angle, head to mid-shin.',
    searchTerms: ['cafe', 'stand', 'glance'],
    sortOrder: 210
  }),
  createYoungWomenPose({
    id: 'saigon-retro-couch',
    title: 'Retro Sofa Sit',
    subtitle: 'Recline into a vintage sofa.',
    primaryLocation: 'cafe',
    styles: ['casual', 'elegant'],
    framing: 'full_body',
    bodyPosition: 'sitting',
    cameraAngle: 'eye_level',
    howToPose: 'Sit back into the sofa, tuck one leg, and drape one arm along the backrest.',
    cameraGuidance: 'Eye level, full body, keep the sofa line clean.',
    searchTerms: ['sofa', 'cafe', 'sit', 'saigon'],
    sortOrder: 220
  }),
  createYoungWomenPose({
    id: 'dalat-vintage-cafe-sit',
    title: 'Da Lat Morning Sit',
    subtitle: 'Hold the mug and look to the window.',
    primaryLocation: 'cafe',
    styles: ['candid', 'minimal'],
    framing: 'three_quarter',
    bodyPosition: 'sitting',
    cameraAngle: 'side_angle',
    howToPose: 'Sit at the table, hold the mug with both hands, and gaze toward the window.',
    cameraGuidance: 'Side light from the window, chest-up to three-quarter.',
    searchTerms: ['dalat', 'mug', 'window', 'cafe'],
    sortOrder: 230
  }),
  createYoungWomenPose({
    id: 'beach-shoreline-twirl',
    title: 'Shoreline Half-Twirl',
    subtitle: 'Gentle turn, look back to camera.',
    primaryLocation: 'beach',
    styles: ['playful', 'candid'],
    framing: 'full_body',
    bodyPosition: 'action',
    cameraAngle: 'eye_level',
    howToPose: 'Make a gentle half-turn, open your arms slightly, lift one heel, and look back.',
    cameraGuidance: 'Eye level, full body, leave space in the turn direction.',
    searchTerms: ['beach', 'twirl', 'turn'],
    sortOrder: 240
  }),
  createYoungWomenPose({
    id: 'beach-toes-walk',
    title: 'Barefoot Diagonal Walk',
    subtitle: 'Walk the water line with a soft look down.',
    primaryLocation: 'beach',
    styles: ['candid', 'playful'],
    framing: 'full_body',
    bodyPosition: 'walking',
    cameraAngle: 'eye_level',
    howToPose: 'Walk diagonally with small steps, look down softly, and let both arms move naturally.',
    cameraGuidance: 'Eye level, full stride in frame.',
    searchTerms: ['beach', 'walk', 'barefoot'],
    sortOrder: 250
  }),
  createYoungWomenPose({
    id: 'beach-hair-sweep',
    title: 'Windward Hair Sweep',
    subtitle: 'Side profile, sweep hair toward the light.',
    primaryLocation: 'beach',
    styles: ['elegant', 'casual'],
    framing: 'three_quarter',
    bodyPosition: 'standing',
    cameraAngle: 'side_angle',
    howToPose: 'Turn side-on, soften the front knee, sweep your hair back with one hand, and look toward the light.',
    cameraGuidance: 'Side profile, head to mid-shin.',
    searchTerms: ['beach', 'hair', 'profile'],
    sortOrder: 260
  }),
  createYoungWomenPose({
    id: 'coastal-hat-hold',
    title: 'Sea Breeze Hat Hold',
    subtitle: 'Hold the hat against the wind.',
    primaryLocation: 'beach',
    styles: ['playful', 'casual'],
    framing: 'half_body',
    bodyPosition: 'standing',
    cameraAngle: 'eye_level',
    howToPose: 'Face the wind, hold the hat with both hands, and keep the elbows open.',
    cameraGuidance: 'Eye level, half body, hat as the top frame.',
    searchTerms: ['beach', 'hat', 'wind'],
    sortOrder: 270
  }),
  createYoungWomenPose({
    id: 'street-curb-perch',
    title: 'Low-Step Perch',
    subtitle: 'Sit tall on a safe low step.',
    primaryLocation: 'street',
    styles: ['candid', 'casual'],
    framing: 'three_quarter',
    bodyPosition: 'sitting',
    cameraAngle: 'eye_level',
    howToPose: 'Sit on a stable low step, angle both knees, rest one elbow lightly, and sit tall.',
    cameraGuidance: 'Eye level, keep the step and legs in frame.',
    searchTerms: ['street', 'sit', 'step', 'curb'],
    sortOrder: 280
  }),
  createYoungWomenPose({
    id: 'street-jacket-shoulder',
    title: 'Over-Shoulder Pause',
    subtitle: 'Face away, then look back.',
    primaryLocation: 'street',
    styles: ['editorial', 'candid'],
    framing: 'full_body',
    bodyPosition: 'standing',
    cameraAngle: 'over_shoulder',
    howToPose: 'Face slightly away, place weight on the far leg, relax both arms, and look back over your shoulder.',
    cameraGuidance: 'Over-shoulder, full body, keep the street clean.',
    searchTerms: ['street', 'lookback', 'jacket'],
    sortOrder: 290
  }),
  createYoungWomenPose({
    id: 'street-forward-stride',
    title: 'Sidewalk Stride',
    subtitle: 'Walk parallel with a natural stride.',
    primaryLocation: 'street',
    styles: ['candid', 'editorial'],
    framing: 'full_body',
    bodyPosition: 'walking',
    cameraAngle: 'side_angle',
    howToPose: 'Walk along a safe sidewalk, take a comfortable stride, swing opposite arms, and look forward.',
    cameraGuidance: 'Side view, leave lead room in front of the walk.',
    searchTerms: ['street', 'walk', 'hanoi'],
    sortOrder: 300
  }),
  createYoungWomenPose({
    id: 'hoi-an-lantern-glance',
    title: 'Ancient Town Glance',
    subtitle: 'Turn the body, look back to camera.',
    primaryLocation: 'street',
    styles: ['candid', 'romantic'],
    framing: 'half_body',
    bodyPosition: 'standing',
    cameraAngle: 'over_shoulder',
    howToPose: 'Turn your torso away, clasp your hands at the waist, and look back over your shoulder.',
    cameraGuidance: 'Chest-up to half body, lantern light behind.',
    searchTerms: ['hoian', 'lantern', 'lookback', 'night'],
    sortOrder: 310
  }),
  createYoungWomenPose({
    id: 'nature-trail-lookback',
    title: 'Trail Walk Look-Back',
    subtitle: 'Walk away, then turn the upper body back.',
    primaryLocation: 'nature',
    styles: ['candid', 'minimal'],
    framing: 'full_body',
    bodyPosition: 'walking',
    cameraAngle: 'over_shoulder',
    howToPose: 'Walk away slowly on a flat path, keep the steps small, and turn your upper body back toward camera.',
    cameraGuidance: 'Full body, path as a leading line.',
    searchTerms: ['nature', 'trail', 'lookback'],
    sortOrder: 320
  }),
  createYoungWomenPose({
    id: 'nature-flower-crouch',
    title: 'Garden Crouch',
    subtitle: 'Shallow crouch among the flowers.',
    primaryLocation: 'nature',
    styles: ['playful', 'candid'],
    framing: 'three_quarter',
    bodyPosition: 'sitting',
    cameraAngle: 'eye_level',
    howToPose: 'Use a shallow crouch on firm ground, keep both feet flat, angle your knees, and lift one hand near your cheek.',
    cameraGuidance: 'Eye level, keep the face clear of flowers.',
    searchTerms: ['garden', 'flower', 'dalat', 'crouch'],
    sortOrder: 330
  }),
  createYoungWomenPose({
    id: 'dalat-pine-wander',
    title: 'Pine Forest Wanderer',
    subtitle: 'Walk and look up through the pines.',
    primaryLocation: 'nature',
    styles: ['elegant', 'minimal'],
    framing: 'full_body',
    bodyPosition: 'walking',
    cameraAngle: 'low_angle',
    howToPose: 'Walk through the pines, look up at the canopy, and lift one hand into your hair.',
    cameraGuidance: 'Slight low angle, full body under the trees.',
    searchTerms: ['dalat', 'pine', 'forest', 'walk'],
    sortOrder: 340
  }),
  createYoungWomenPose({
    id: 'nature-meadow-sit',
    title: 'Meadow Sit',
    subtitle: 'Sit on the grass and look slightly up.',
    primaryLocation: 'nature',
    styles: ['casual', 'minimal'],
    framing: 'full_body',
    bodyPosition: 'sitting',
    cameraAngle: 'eye_level',
    howToPose: 'Sit on the grass, bend both knees, rest your arms, and look slightly upward.',
    cameraGuidance: 'Eye level, full body, keep the horizon simple.',
    searchTerms: ['meadow', 'sit', 'grass', 'nature'],
    sortOrder: 350
  }),
  createYoungWomenPose({
    id: 'store-mirror-step',
    title: 'Fitting-Room Step',
    subtitle: 'One foot forward, check the fit.',
    primaryLocation: 'stores',
    styles: ['editorial', 'casual'],
    framing: 'full_body',
    bodyPosition: 'standing',
    cameraAngle: 'eye_level',
    howToPose: 'Step one foot forward, angle your hips, lift one hand near your hair, and keep the other arm loose.',
    cameraGuidance: 'Straight-on full body, mirror or aisle as the frame.',
    searchTerms: ['store', 'mirror', 'outfit'],
    sortOrder: 360
  }),
  createYoungWomenPose({
    id: 'street-flower-stall',
    title: 'Flower Market Browse',
    subtitle: 'Reach toward a bouquet and look down.',
    primaryLocation: 'stores',
    styles: ['candid', 'casual'],
    framing: 'half_body',
    bodyPosition: 'standing',
    cameraAngle: 'eye_level',
    howToPose: 'Stand at the stall, reach toward the flowers, and look down at the blooms.',
    cameraGuidance: 'Half body, flowers in the lower frame.',
    searchTerms: ['flower', 'market', 'store', 'browse'],
    sortOrder: 370
  }),
  createYoungWomenPose({
    id: 'store-exit-turn',
    title: 'Exit Turn-and-Smile',
    subtitle: 'Take one step, then smile back.',
    primaryLocation: 'stores',
    styles: ['playful', 'candid'],
    framing: 'full_body',
    bodyPosition: 'walking',
    cameraAngle: 'over_shoulder',
    howToPose: 'Take one slow step toward the exit, turn from the waist, and smile back at the camera.',
    cameraGuidance: 'Full body with turning space.',
    searchTerms: ['store', 'exit', 'smile', 'turn'],
    sortOrder: 380
  }),
  createYoungWomenPose({
    id: 'vintage-mirror-check',
    title: 'Antique Shop Mirror',
    subtitle: 'Adjust hair or glasses in the mirror.',
    primaryLocation: 'stores',
    styles: ['editorial', 'minimal'],
    framing: 'half_body',
    bodyPosition: 'standing',
    cameraAngle: 'side_angle',
    howToPose: 'Stand in profile to camera, raise both hands to adjust your hair or glasses, and look into the mirror.',
    cameraGuidance: 'Side profile, half body.',
    searchTerms: ['mirror', 'vintage', 'store', 'glasses'],
    sortOrder: 390
  })
];
