import { Pose } from '../../models/pose';

export const POSE_CATALOG: Pose[] = [
  {
    id: 'coffee-lean',
    title: 'The Coffee Lean',
    subtitle: 'Elbow on the table, look toward the window.',
    primaryLocation: 'cafe',
    subjectCount: 1,
    ageApplicability: ['teen', 'adult'],
    subjectTypes: ['feminine'],
    styles: ['casual', 'candid'],
    framing: 'three_quarter',
    bodyPosition: 'sitting',
    cameraAngle: 'high_angle',
    howToPose: 'Rest one elbow on the table, hold the cup near the chest, look toward the window, and keep the neck long.',
    cameraGuidance: 'Slight top-down, 35-50mm, chest-up framing.',
    browsingImage: {
      assetKey: 'assets/pose-collection/blurred/008-table-elbow-rest.jpg',
      source: require('../../../assets/pose-collection/blurred/008-table-elbow-rest.jpg')
    },
    overlayImage: {
      assetKey: 'assets/pose-collection/overlays/coffee-lean.png',
      source: require('../../../assets/pose-collection/overlays/coffee-lean.png')
    },
    searchTerms: ['coffee', 'cafe', 'sit', 'window', 'cup'],
    isFeatured: true,
    sortOrder: 10,
    status: 'published'
  },
  {
    id: 'street-crosser',
    title: 'Street Crosser',
    subtitle: 'Mid-walk lookback on the street.',
    primaryLocation: 'street',
    subjectCount: 1,
    ageApplicability: ['teen', 'adult'],
    subjectTypes: ['any'],
    styles: ['candid', 'editorial'],
    framing: 'full_body',
    bodyPosition: 'walking',
    cameraAngle: 'low_angle',
    howToPose: 'Walk slowly across frame, pause with one leg forward, and look back over the shoulder.',
    cameraGuidance: 'Low angle, wide 24-28mm, keep the full stride in frame.',
    browsingImage: {
      assetKey: 'assets/pose-collection/blurred/002-crosswalk-pause.jpg',
      source: require('../../../assets/pose-collection/blurred/002-crosswalk-pause.jpg')
    },
    overlayImage: {
      assetKey: 'assets/pose-collection/overlays/street-crosser.png',
      source: require('../../../assets/pose-collection/overlays/street-crosser.png')
    },
    searchTerms: ['street', 'walk', 'city', 'lookback', 'crosswalk'],
    isFeatured: true,
    sortOrder: 20,
    status: 'published'
  },
  {
    id: 'beach-couple',
    title: 'Sunset Hand-in-Hand',
    subtitle: 'Couple walk with a soft lean.',
    primaryLocation: 'beach',
    subjectCount: 2,
    ageApplicability: ['adult'],
    subjectTypes: ['any'],
    styles: ['romantic', 'candid'],
    framing: 'full_body',
    bodyPosition: 'walking',
    cameraAngle: 'eye_level',
    howToPose: 'Walk slowly toward the light, hold hands, and lean slightly toward each other.',
    cameraGuidance: 'Eye level from a 3/4 rear-side, leave space ahead of the walk.',
    browsingImage: {
      assetKey: 'assets/pose-collection/blurred/024-couple-hand-in-hand-walk.jpg',
      source: require('../../../assets/pose-collection/blurred/024-couple-hand-in-hand-walk.jpg')
    },
    overlayImage: {
      assetKey: 'assets/pose-collection/overlays/beach-couple.png',
      source: require('../../../assets/pose-collection/overlays/beach-couple.png')
    },
    searchTerms: ['beach', 'couple', 'walk', 'sunset', 'romantic'],
    isFeatured: true,
    sortOrder: 30,
    status: 'published'
  },
  {
    id: 'lake-sit',
    title: 'Lakeside Sit',
    subtitle: 'Knees up, quiet horizon look.',
    primaryLocation: 'nature',
    subjectCount: 1,
    ageApplicability: ['teen', 'adult'],
    subjectTypes: ['any'],
    styles: ['minimal', 'casual'],
    framing: 'full_body',
    bodyPosition: 'sitting',
    cameraAngle: 'eye_level',
    howToPose: 'Sit on the ground, draw the knees up, rest the arms loosely, and look toward the horizon.',
    cameraGuidance: 'Eye level, keep the horizon clean, full body in frame.',
    browsingImage: {
      assetKey: 'assets/pose-collection/blurred/023-sea-wall-sit.jpg',
      source: require('../../../assets/pose-collection/blurred/023-sea-wall-sit.jpg')
    },
    overlayImage: {
      assetKey: 'assets/pose-collection/overlays/lake-sit.png',
      source: require('../../../assets/pose-collection/overlays/lake-sit.png')
    },
    searchTerms: ['lake', 'sit', 'nature', 'horizon', 'park'],
    isFeatured: true,
    sortOrder: 40,
    status: 'published'
  },
  {
    id: 'supermarket-aisle',
    title: 'Aisle Wander',
    subtitle: 'Walk the aisle with a basket.',
    primaryLocation: 'stores',
    subjectCount: 1,
    ageApplicability: ['teen', 'adult'],
    subjectTypes: ['any'],
    styles: ['candid', 'playful'],
    framing: 'full_body',
    bodyPosition: 'walking',
    cameraAngle: 'eye_level',
    howToPose: 'Walk toward the camera, carry a basket in one hand, and keep the other arm relaxed.',
    cameraGuidance: 'Eye level in the aisle center, use the shelves as leading lines.',
    browsingImage: {
      assetKey: 'assets/pose-collection/blurred/047-food-court-tray-walk.jpg',
      source: require('../../../assets/pose-collection/blurred/047-food-court-tray-walk.jpg')
    },
    overlayImage: {
      assetKey: 'assets/pose-collection/overlays/supermarket-aisle.png',
      source: require('../../../assets/pose-collection/overlays/supermarket-aisle.png')
    },
    searchTerms: ['supermarket', 'store', 'aisle', 'basket', 'walk'],
    isFeatured: true,
    sortOrder: 50,
    status: 'published'
  },
  {
    id: 'wall-lean',
    title: 'Wall Lean Relax',
    subtitle: 'One shoulder on the wall, ankles crossed.',
    primaryLocation: 'street',
    subjectCount: 1,
    ageApplicability: ['teen', 'adult'],
    subjectTypes: ['masculine', 'neutral'],
    styles: ['casual', 'editorial'],
    framing: 'full_body',
    bodyPosition: 'leaning',
    cameraAngle: 'eye_level',
    howToPose: 'Lean one shoulder into the wall, cross the ankles, and keep both hands in the pockets.',
    cameraGuidance: 'Eye level, straight-on, leave a little wall space on the lean side.',
    browsingImage: {
      assetKey: 'assets/pose-collection/blurred/003-wall-lean-relax.jpg',
      source: require('../../../assets/pose-collection/blurred/003-wall-lean-relax.jpg')
    },
    overlayImage: {
      assetKey: 'assets/pose-collection/overlays/wall-lean.png',
      source: require('../../../assets/pose-collection/overlays/wall-lean.png')
    },
    searchTerms: ['wall', 'lean', 'urban', 'street', 'casual'],
    isFeatured: true,
    sortOrder: 60,
    status: 'published'
  },
  {
    id: 'window-gaze',
    title: 'Window Gaze',
    subtitle: 'Soft profile toward the light.',
    primaryLocation: 'cafe',
    subjectCount: 1,
    ageApplicability: ['teen', 'adult'],
    subjectTypes: ['feminine'],
    styles: ['elegant', 'minimal'],
    framing: 'close_up',
    bodyPosition: 'standing',
    cameraAngle: 'side_angle',
    howToPose: 'Stand near the window at 45 degrees, keep the shoulders soft, and look toward the light.',
    cameraGuidance: 'Eye-level profile, tight portrait, expose for the face.',
    browsingImage: {
      assetKey: 'assets/pose-collection/blurred/009-window-light-soft-smile.jpg',
      source: require('../../../assets/pose-collection/blurred/009-window-light-soft-smile.jpg')
    },
    searchTerms: ['window', 'cafe', 'portrait', 'soft light'],
    isFeatured: false,
    sortOrder: 70,
    status: 'published'
  },
  {
    id: 'coffee-profile',
    title: 'Coffee Cup Profile',
    subtitle: 'Hold the cup, look to the light.',
    primaryLocation: 'cafe',
    subjectCount: 1,
    ageApplicability: ['teen', 'adult'],
    subjectTypes: ['feminine', 'neutral'],
    styles: ['casual', 'candid'],
    framing: 'half_body',
    bodyPosition: 'sitting',
    cameraAngle: 'side_angle',
    howToPose: 'Hold the cup near the face, keep a clean side profile, and look toward the window.',
    cameraGuidance: '90-degree side, chest-up framing.',
    browsingImage: {
      assetKey: 'assets/pose-collection/blurred/007-coffee-cup-side-profile.jpg',
      source: require('../../../assets/pose-collection/blurred/007-coffee-cup-side-profile.jpg')
    },
    searchTerms: ['coffee', 'profile', 'cafe', 'cup'],
    isFeatured: false,
    sortOrder: 80,
    status: 'published'
  },
  {
    id: 'beach-walk',
    title: 'Barefoot Beach Walk',
    subtitle: 'Slow walk along the water line.',
    primaryLocation: 'beach',
    subjectCount: 1,
    ageApplicability: ['teen', 'adult'],
    subjectTypes: ['any'],
    styles: ['candid', 'playful'],
    framing: 'full_body',
    bodyPosition: 'walking',
    cameraAngle: 'eye_level',
    howToPose: 'Walk barefoot along the water, keep the stride long, and glance slightly away from camera.',
    cameraGuidance: 'Eye level, leave space in the walking direction.',
    browsingImage: {
      assetKey: 'assets/pose-collection/blurred/021-beach-walk-barefoot.jpg',
      source: require('../../../assets/pose-collection/blurred/021-beach-walk-barefoot.jpg')
    },
    searchTerms: ['beach', 'walk', 'sand', 'solo'],
    isFeatured: false,
    sortOrder: 90,
    status: 'published'
  },
  {
    id: 'park-bench',
    title: 'Park Bench Relax',
    subtitle: 'Easy sit with open shoulders.',
    primaryLocation: 'nature',
    subjectCount: 1,
    ageApplicability: ['all_ages'],
    subjectTypes: ['any'],
    styles: ['casual', 'candid'],
    framing: 'three_quarter',
    bodyPosition: 'sitting',
    cameraAngle: 'eye_level',
    howToPose: 'Sit toward the front of the bench, angle the knees, and keep one hand resting naturally.',
    cameraGuidance: 'Eye level, three-quarter crop, keep the bench line clean.',
    browsingImage: {
      assetKey: 'assets/pose-collection/blurred/018-park-bench-relax.jpg',
      source: require('../../../assets/pose-collection/blurred/018-park-bench-relax.jpg')
    },
    searchTerms: ['park', 'bench', 'sit', 'nature'],
    isFeatured: false,
    sortOrder: 100,
    status: 'published'
  },
  {
    id: 'bookstore-browse',
    title: 'Bookstore Wanderer',
    subtitle: 'Browse the aisle, face the spines.',
    primaryLocation: 'stores',
    subjectCount: 1,
    ageApplicability: ['teen', 'adult'],
    subjectTypes: ['any'],
    styles: ['candid', 'minimal'],
    framing: 'full_body',
    bodyPosition: 'standing',
    cameraAngle: 'over_shoulder',
    howToPose: 'Stand in the aisle, tilt a book open, and keep the shoulders relaxed.',
    cameraGuidance: 'Over-shoulder or slight side, use the shelves as a frame.',
    browsingImage: {
      assetKey: 'assets/pose-collection/blurred/044-bookstore-aisle-browse.jpg',
      source: require('../../../assets/pose-collection/blurred/044-bookstore-aisle-browse.jpg')
    },
    searchTerms: ['bookstore', 'store', 'book', 'aisle'],
    isFeatured: false,
    sortOrder: 110,
    status: 'published'
  },
  {
    id: 'street-walk-candid',
    title: 'Street Walk Candid',
    subtitle: 'Walk and look away from the lens.',
    primaryLocation: 'street',
    subjectCount: 1,
    ageApplicability: ['teen', 'adult'],
    subjectTypes: ['any'],
    styles: ['candid', 'casual'],
    framing: 'full_body',
    bodyPosition: 'walking',
    cameraAngle: 'eye_level',
    howToPose: 'Walk slowly across frame, look away from camera, and keep one hand on the jacket.',
    cameraGuidance: 'Eye level, slight 30-degree side angle.',
    browsingImage: {
      assetKey: 'assets/pose-collection/blurred/001-street-walk-candid.jpg',
      source: require('../../../assets/pose-collection/blurred/001-street-walk-candid.jpg')
    },
    searchTerms: ['street', 'walk', 'candid', 'jacket'],
    isFeatured: false,
    sortOrder: 120,
    status: 'published'
  }
];
