# ShotCoach AI Photo Coach Production Flow

Last updated: 2026-06-04

Current repo snapshot: working tree after `7ae5ca9` with AI Coach v2 implemented.

This document records the production-ready behavior of the current AI Photo Coach and AI Editing Tool flows, their prompt/schema contracts, and the AI Coach v2 implementation based on `/Users/mac/Desktop/ShotCoach_AI_Coach_Flow_README.md`.

## Product Principle

ShotCoach should generate realistic photography coaching references.

The output should look like the same person, in the same scene, under the same lighting, with better photographic choices. It should not look like a beauty edit, a new portrait session, a cinematic redesign, or a regenerated scene.

Core rule:

```text
Improve the photograph, not the person.
```

## Current Flow Summary

There are two active AI image-edit paths.

### 1. AI Coach v2

Entry point:

- User selects a photo.
- Selected tool is `ai_coach`.
- App runs analysis in `src/services/openai/analyzePhoto.ts`.
- User receives 3 directions/suggestions.
- User selects a suggestion.
- App generates one edited image in `src/features/result/GeneratedResultScreen.tsx`.

Current API stages:

```text
Photo
  -> AI Coach v2 Analysis LLM
  -> AI Coach v2 Directions LLM
  -> Deterministic app-side prompt builder
  -> User Selects Direction
  -> OpenAI Image Edit
  -> Result
```

Current implementation detail:

- `analyzeCoachPhotoV2WithOpenAI()` uses `buildCoachVisionAnalysisPromptV2()`.
- `createCoachDirectionsV2WithOpenAI()` uses `buildCoachDirectionPromptV2()`.
- `buildAICoachImageEditPrompt()` creates the final image edit prompt deterministically.
- Parsed data is normalized by `buildAnalysisResultFromCoachV2Flow()`.
- The selected suggestion passes `selected.image_prompt` into `generateEditedImage()`.
- `GeneratedResultScreen` now stops after image generation and history save.
- Vision QA / automatic retry is not part of the active generate result flow.
- Legacy v1 remains available by setting `EXPO_PUBLIC_AI_COACH_FLOW=v1`.

### 2. Direct AI Editing Tools

Entry point:

- User selects an AI editing tool from the photo preview screen.
- Optional quick suggestion or custom instruction is stored with the selected tool.
- `AppNavigator.createDirectToolResult()` creates a single suggestion directly.
- `buildDirectToolImagePrompt()` builds the final image prompt in app code.
- User lands directly on generation result.

Current direct flow:

```text
Photo
  -> Tool + optional user instruction
  -> Deterministic app-side prompt builder
  -> OpenAI Image Edit
  -> Result
```

Direct tools currently use deterministic prompt builders for:

- Enhance Photo
- Better Composition
- Light & Color
- Upscale 2K/4K
- Background Boost
- Expand Frame
- Replace Background
- Remove Object
- Smooth Skin

`Restore Color` currently falls back to the generic direct tool prompt builder.

## Current Model and Runtime Scheme

Analysis endpoint:

- URL: `https://api.openai.com/v1/responses`
- Env key: `EXPO_PUBLIC_OPENAI_API_KEY`
- Analysis model env: `EXPO_PUBLIC_OPENAI_MODEL`
- Default analysis model: `gpt-4.1-mini`

Image edit endpoint:

- URL: `https://api.openai.com/v1/images/edits`
- Image model env: `EXPO_PUBLIC_OPENAI_IMAGE_MODEL`
- Default image model: `gpt-image-1.5`
- Supported GPT image edit sizes: `1024x1024`, `1024x1536`, `1536x1024`
- Default size env: `EXPO_PUBLIC_OPENAI_IMAGE_SIZE`
- Default size: `1024x1536`
- DALL-E 2 fallback size: `1024x1024`
- Output format for GPT image models: `png`
- Quality env: `EXPO_PUBLIC_OPENAI_IMAGE_EDIT_QUALITY`
- Default quality:
  - `high` for `enhance_photo`
  - `high` for `upscale`
  - `medium` for other tools and AI Coach

Mock/testing mode:

- `EXPO_PUBLIC_ANALYSIS_PROVIDER=mock`
- `EXPO_PUBLIC_ANALYSIS_PROVIDER=testing_mockup`

## Legacy Classic AI Coach Schema

### Photo Analysis

Legacy `ProductionPhotoAnalysis` shape:

```json
{
  "schema_version": "1.0",
  "photo_id": "source_photo",
  "analysis_id": "id",
  "scene": {
    "photo_type": "portrait | couple | group | product | landscape | unknown",
    "environment": "visible environment or unknown",
    "visible_subjects": "short visible subject description"
  },
  "composition": {
    "quality_score": 0,
    "notes": "specific composition assessment"
  },
  "lighting": {
    "quality_score": 0,
    "notes": "specific lighting assessment"
  },
  "pose": {
    "quality_score": 0,
    "notes": "specific pose/expression assessment"
  },
  "aesthetic": {
    "overall_score": 0,
    "notes": "short expert review"
  },
  "scores": {
    "composition_score": 0,
    "lighting_score": 0,
    "pose_score": 0,
    "naturalness_score": 0,
    "social_media_score": 0,
    "overall_aesthetic_score": 0
  },
  "overall_assessment": "short expert review of the current photo"
}
```

### Creative Direction

Current `CreativeDirection` shape:

```json
{
  "title": "Clean Reference Portrait",
  "concept": "Realistic reshoot-style improvement with identity and lighting preserved",
  "composition": "specific crop/framing strategy",
  "camera_angle": "specific camera/lens feel",
  "changes": {
    "pose": ["pose refinement"],
    "lighting": ["minor lighting preservation/refinement"],
    "composition": ["composition refinement"],
    "style": ["natural color fidelity/depth refinement"]
  }
}
```

### Generation Recipe

Current `GenerationRecipe` shape:

```json
{
  "direction_title": "must match the creative direction title",
  "model": {
    "provider": "openai",
    "name": "gpt-image"
  },
  "image_prompt": {
    "positive_prompt": "production image-edit prompt",
    "negative_prompt": "negative constraints"
  },
  "evaluation_targets": {
    "identity_preservation": 9,
    "naturalness": 8,
    "anatomy_score": 8,
    "overall_score": 8
  }
}
```

The app converts each direction and recipe into a `Suggestion`:

```json
{
  "title": "direction title",
  "concept": "direction concept",
  "composition": "direction composition",
  "camera_angle": "direction camera angle",
  "changes": ["flattened change list"],
  "image_prompt": "positive prompt\n\nNegative prompt: negative prompt"
}
```

## Legacy Classic AI Coach Prompt Contracts

### Vision Analysis

Current role:

```text
You are a professional photography director and visual analysis engine.
```

The model is asked to analyze:

- composition
- camera angle
- lighting
- pose
- expression
- naturalness
- social media quality

Current anti-hallucination rules:

- Only describe visible elements.
- If uncertain, use `unknown`.
- Do not invent objects or people.
- Preserve identity.
- Keep realism.
- Follow the schema strictly.

### Creative Directions

Current role:

```text
You are a realistic photography reference director.
```

The model creates exactly 3 visually different improvement directions from `PhotoAnalysis`.

Current focus:

- composition
- pose
- camera angle
- existing lighting preservation
- realism

Current default mode:

```text
Reference Mode.
The goal is a realistic reshoot/reference that still looks like the same person, same location, same lighting, and same moment.
```

### Prompt Composer

Current role:

```text
You are an expert image generation prompt engineer.
```

This is the stage AI Coach v2 removes from the default production flow.

Current priority order:

```text
1. Preserve identity.
2. Preserve original environment, lighting, time of day, weather, color temperature, and scene mood.
3. Improve pose, framing, composition, camera angle, and subject separation.
4. Apply only subtle photographic cleanup that does not redesign the image.
```

Risk in legacy prompt composer:

- It still includes broad improvement language like `Improve pose` and `camera angle`.
- Those phrases are acceptable for a coaching reference in moderation, but they are more identity-risky than the proposed README flow because another LLM is allowed to rewrite the final image prompt.
- The app has already removed similar risky wording from direct editing tools, and AI Coach v2 no longer depends on the composer LLM by default.

## Current Direct Tool Prompt Scheme

All direct tools share these production principles:

- The uploaded image is the source of truth.
- Preserve identity unless the tool explicitly targets background/frame/object.
- Keep edits realistic.
- Include the user instruction if provided.
- Generate one result without Vision QA.

### Enhance Photo

Goal:

- Preserve the exact same photograph.
- Apply only minimal quality improvements.

Allowed:

- Very minor exposure correction.
- Very minor shadow/highlight recovery.
- Mild noise reduction.
- Mild cleanup.

Forbidden:

- Recompose.
- Change crop, pose, expression, facial features, lighting style, color grading, background, or depth of field.
- Beautify or retouch skin.

Default quality:

- `high`

### Better Composition

Goal:

- Improve crop, framing, subject placement, composition balance, negative space, and minor visual distraction reduction.

Allowed:

- Crop and reframe.
- Improve subject placement and visual balance.
- Slightly reduce minor visual distractions only if the original scene still reads as the same scene.

Forbidden:

- Change pose, expression, camera angle, outfit, hairstyle, background, lighting style, weather, or scene.
- Beautify, retouch, reshape, relight, recolor, or redesign the face/body.

Quick suggestions map to user request text. For example:

- `Centered Portrait` maps to `Place the subject centrally for a strong portrait look.`
- The label itself does not need to appear in the prompt; the mapped instruction is what matters.

### Light & Color

Goal:

- Improve exposure, tonal balance, white balance, and color accuracy while preserving the same photograph.

Allowed:

- Exposure correction.
- Shadow/highlight recovery.
- White balance correction.
- Natural color balance.
- Contrast optimization.
- Subtle vibrance.
- Skin tone accuracy.

Forbidden:

- Change pose, framing, crop, composition, camera angle, facial features, hairstyle, clothing, background, weather.
- Add cinematic lighting, dramatic relighting, bokeh, filters, or beauty retouching.

### Upscale 2K/4K

Goal:

- Increase perceived resolution and clean up compression/softness while preserving the exact same image.

Allowed:

- Conservative resolution enhancement.
- Mild deblurring.
- Mild compression artifact cleanup.
- Mild noise reduction.
- Mild edge refinement.
- Natural texture preservation.

Forbidden:

- Change crop, pose, framing, composition, face, lighting, color grading, background.
- Reconstruct the face.
- Invent missing facial details.
- Beautify or smooth skin.

Default quality:

- `high`

Naming note:

- If output size remains `1024x1536`, this is not true 2K/4K upscale for many input photos. Safer names are `Restore Detail` or `HD Enhance` unless larger output sizes are supported.

### Background Boost

Goal:

- Improve the existing background subtly.

Allowed:

- Mild background cleanup.
- Mild background clarity/noise improvement.
- Background shadow/highlight balance.
- Subtle background color harmony.
- Subtle subject-background separation.

Forbidden:

- Replace the background.
- Change location, background objects, architecture, landscape, street, sky, room, building, environment.
- Add artificial bokeh, cinematic lighting, dramatic grading.
- Make the subject look cut out.

Naming note:

- `Background Boost` can imply stronger background beautification. Safer names are `Background Clean Up` or `Background Balance`.

### Expand Frame

Goal:

- Outpaint/expand the frame while preserving the same captured moment.

Allowed:

- Fill missing outer areas realistically.
- Continue existing background elements beyond image boundaries.
- Minor edge blending only if needed.

Forbidden:

- Change the original subject, pose, face, outfit, position, original center content, lighting, recolor, recompose, crop, or camera angle.
- Invent a new location, new objects, extra people, text, logos, fantasy elements, or editorial styling.

Key output rule:

```text
Final result must look like the same photo with a wider frame, not a different photo.
```

### Replace Background

Goal:

- Replace only the background with a realistic new setting.

Subject preservation:

- Same identity, face, facial structure, expression, age appearance, skin tone identity, hairstyle, hair color, body shape, pose, clothing, accessories, and garment details.

Background rules:

- Create a realistic natural background matching subject perspective, lens feel, camera height, depth of field, lighting direction, shadow logic, white balance, color temperature, and grain.
- Integrate with believable edges, contact shadows, ambient light, and depth separation.

Forbidden:

- Change the subject.
- Add extra people, text, logos, UI, stickers, fantasy objects, distracting elements.
- Apply cinematic relighting, heavy grading, beauty filters, makeup, fashion styling, or AI influencer effects.

Key rule:

```text
Replace only the background. Do not change the subject.
```

### Remove Object

Goal:

- Remove only the unwanted object and reconstruct the affected area naturally.

Priority order:

```text
1. Preserve the person's identity.
2. Preserve original environment, lighting, time of day, weather, white balance, color temperature, and scene mood.
3. Remove only the unwanted object.
4. Reconstruct the affected area naturally.
```

Forbidden:

- Modify the person.
- Beautify or redesign the face.
- Alter pose, expression, hairstyle, body shape, clothing, accessories.
- Crop, recompose, relight, recolor, restyle, add objects, or reinterpret the photograph.

### Smooth Skin

Goal:

- Improve only temporary skin imperfections.

Allowed:

- Gently reduce temporary blemishes, acne, redness, small spots, and uneven skin texture.
- Slightly soften harsh skin texture while keeping pores and natural detail.
- Subtly refine under-eye shadows only if natural.

Forbidden:

- Beautify, reshape, slim, age, de-age, stylize.
- Apply makeup, glam retouching, porcelain/plastic/airbrushed skin, beauty filters, influencer styling.
- Change skin tone, lighting, camera angle, crop, hairstyle, outfit, background, or scene.

## Current Generate Result Behavior

`GeneratedResultScreen` now does only this:

```text
selected suggestion prompt
  -> generateEditedImage()
  -> save generated URI in result state
  -> save generated history entry
  -> show result
```

It does not call `evaluateEditedImageQuality()` in the active flow.

Unused QA code still exists:

- `buildQualityEvaluationPrompt()`
- `evaluateGeneratedImageWithOpenAI()`
- `evaluateEditedImageQuality()`
- `ImageQualityEvaluation`

This can be kept temporarily for future QA experiments, but it should not be described as part of the production user flow unless re-enabled.

## Assessment of the README Prompt Flow

The README flow is better than the legacy Classic AI Coach flow for production and has been implemented as AI Coach v2.

Why it is better:

- It removes `Prompt Composer LLM`, which reduces prompt drift.
- It keeps the final image edit prompt deterministic and app-controlled.
- It removes Vision QA and automatic retry, which already matches the latest result flow.
- It narrows the product from generic "make a better photo" to "realistic photography coaching reference".
- It explicitly blocks identity, face, outfit, background, lighting, time-of-day, weather, cinematic, beauty, and major pose changes.
- It gives directions a safer structure: framing, crop, camera distance, subject placement, composition, subject separation, and minimal pose refinement.
- It reduces latency and cost from 4-5 AI stages to 2-3 stages.

What is not better / needs care:

- Removing the prompt composer means direction quality must be consistently structured. If direction JSON is weak, the deterministic prompt builder has less room to repair it.
- The proposed schema is larger than the current app schema and needs model/type/parser migration.
- Existing stored analysis history uses the current `AnalysisResult`, `CreativeDirection`, and `GenerationRecipe` shapes. Backward compatibility must be preserved.
- The proposed prompt still allows minimal pose refinement. This is correct for AI Coach, but the builder must keep it low-risk and never turn it into a face/expression/body rewrite.

Implementation decision:

- Adopt the new README flow as AI Coach v2.
- Keep direct editing tools unchanged except for minor cleanup/refinement.
- Do not change direct tools to use the AI Coach prompt; they intentionally have stricter tool-specific prompts.

## Current AI Coach v2 Flow

Production flow:

```text
Photo
  -> Analysis + Directions
  -> User Select
  -> Deterministic Prompt Builder
  -> Image Edit
  -> Result
```

Legacy rollback flow:

```text
Photo
  -> Analysis LLM
  -> Directions LLM
  -> Prompt Composer LLM
  -> User Select
  -> Image Edit
  -> Result
```

Enable rollback with:

```text
EXPO_PUBLIC_AI_COACH_FLOW=v1
```

Optional later optimization:

```text
Photo
  -> Combined Analysis + Directions LLM
  -> Deterministic Prompt Builder
  -> User Select
  -> Image Edit
  -> Result
```

## Recommended AI Coach v2 Analysis Schema

Use a richer version than the current schema:

```json
{
  "schema_version": "2.0",
  "photo_id": "source_photo",
  "scene": {
    "photo_type": "portrait | couple | group | product | landscape | unknown",
    "environment": "visible environment or unknown",
    "background_description": "visible background only",
    "weather_or_time_of_day": "visible condition or unknown",
    "scene_mood": "natural mood or unknown"
  },
  "subject": {
    "subject_count": 1,
    "pose_description": "visible pose only",
    "expression_description": "visible expression only",
    "outfit_description": "visible outfit only",
    "identity_risk_level": "low | medium | high",
    "identity_risk_notes": "short notes"
  },
  "composition": {
    "quality_score": 0,
    "notes": "specific composition assessment",
    "safe_improvements": ["safe framing/crop/placement ideas"],
    "avoid_changes": ["unsafe composition changes"]
  },
  "lighting": {
    "quality_score": 0,
    "lighting_type": "visible light type or unknown",
    "notes": "specific lighting assessment",
    "preserve_rules": ["preserve existing light characteristics"]
  },
  "pose": {
    "quality_score": 0,
    "notes": "specific pose assessment",
    "safe_pose_refinements": ["minimal safe refinements"],
    "unsafe_pose_changes": ["changes that should not be attempted"]
  },
  "aesthetic": {
    "overall_score": 0,
    "notes": "short expert review",
    "style_preservation": ["style/mood rules to preserve"]
  },
  "scores": {
    "composition_score": 0,
    "lighting_score": 0,
    "pose_score": 0,
    "subject_separation_score": 0,
    "naturalness_score": 0,
    "social_media_score": 0,
    "overall_aesthetic_score": 0
  },
  "overall_assessment": "short expert review"
}
```

## Recommended AI Coach v2 Direction Schema

```json
{
  "directions": [
    {
      "id": "close_crop",
      "title": "Soft Close-Up",
      "summary": "A closer crop that strengthens facial connection while keeping the original mood.",
      "composition_change": "tighter vertical crop around face and upper torso",
      "camera_distance_change": "slightly closer camera distance",
      "subject_placement_change": "keep subject near center with balanced headroom",
      "pose_refinement": "preserve the original pose; only minimal refinement if safe",
      "lighting_preservation": "preserve the same light direction and color temperature",
      "edit_strength": "low",
      "identity_risk": "low",
      "prompt_builder_notes": ["avoid changing facial structure", "avoid changing expression"]
    }
  ]
}
```

Recommended default direction types:

- Close Crop
- Balanced Portrait
- Environmental Portrait

## Recommended Deterministic Image Edit Prompt Template

The app should build the final prompt with code, not another LLM call.

Required sections:

```text
Edit the uploaded photo as a realistic ShotCoach AI photography coaching reference.

The uploaded image is the source of truth.

Product goal:
Create a realistic reference image that shows a better way to photograph the same person in the same scene.
This is not a beauty edit, not a full redesign, and not a new photoshoot.

Priority order:
1. Preserve the person's identity.
2. Preserve the original environment, lighting, time of day, weather, white balance, color temperature, and scene mood.
3. Improve the photo mainly through framing, crop, camera distance, subject placement, composition, and subject separation.
4. Apply only minimal pose refinement when it is safe and consistent with the original pose.
5. Keep the result realistic and close to the original captured moment.

Strict subject preservation rules:
- Preserve the exact same person and identity.
- Do not change facial structure, face shape, eye shape, nose shape, lips, jawline, cheeks, forehead, chin, age appearance, skin tone identity, hairstyle, hair color, body shape, or gender presentation.
- Preserve the original expression identity. Do not create a new facial expression.
- Preserve the original clothing and accessories, including outfit shape, colors, patterns, jewelry, shoes, and visible garment details.
- Preserve realistic anatomy, hands, eyes, facial details, hair detail, and natural skin texture.

Scene and lighting preservation rules:
- Preserve the original location and background.
- Do not move the person to a new train, building, street, room, landscape, sky, studio, or fantasy/editorial set.
- Preserve the original lighting condition, time of day, weather, white balance, color temperature, contrast level, and scene mood.
- Do not relight, recolor, or apply cinematic grading.
- Preserve realistic depth, lens feel, perspective, grain, texture, and photographic realism.

Selected direction:
Title: {{direction.title}}
Summary: {{direction.summary}}

Composition change:
{{direction.composition_change}}

Camera distance change:
{{direction.camera_distance_change}}

Subject placement change:
{{direction.subject_placement_change}}

Pose refinement:
{{direction.pose_refinement}}

Lighting preservation:
{{direction.lighting_preservation}}

Allowed changes:
- Improve framing and crop while keeping the same scene.
- Improve subject placement and visual balance.
- Improve subject separation using natural depth and local clarity, without changing the background.
- Apply only very subtle pose refinement if it remains consistent with the original body position.
- Apply only minor exposure or shadow recovery if needed, while keeping the same lighting source and color temperature.
- Keep skin texture natural and realistic.

Not allowed:
- Do not create a different person.
- Do not beautify or redesign the face.
- Do not create an influencer-style AI face.
- Do not change facial structure, expression identity, body shape, hairstyle, outfit, accessories, or skin tone identity.
- Do not significantly change the pose, hand position, face angle, or eye direction.
- Do not replace the background.
- Do not change weather, time of day, lighting direction, white balance, or color temperature.
- Do not apply cinematic relighting, dramatic shadows, orange/teal grading, golden hour conversion, fantasy atmosphere, editorial fashion styling, makeup, perfect skin, or beauty filter effects.
- Do not add text, logos, watermarks, UI elements, stickers, extra people, or new distracting objects.

User instruction:
{{userInstructionOrDefault}}

Output requirement:
Produce a realistic high-quality photo edit from the provided source image.
The final output must look like a realistic photography coaching reference for retaking the same photo in the same location.
It should feel like the same captured moment with improved photographic choices, not a new generated scene or a new photoshoot.
```

Default user instruction:

```text
No extra instruction. Apply the selected coaching direction naturally and conservatively.
```

## Implementation Status for AI Coach v2

### Phase 1: Add v2 types and parser support

- Status: implemented.
- Added `CoachPhotoAnalysisV2` and `CoachDirectionV2` types.
- Preserved current `AnalysisResult` compatibility.
- Added parser/normalizer support for v2 fields.
- Kept legacy history readable.

### Phase 2: Replace prompt composer with deterministic builder

- Status: implemented.
- Added `buildAICoachImageEditPrompt(analysis, direction, userInstruction?)`.
- Stopped calling `composeGenerationRecipesWithOpenAI()` for default `ai_coach`.
- Converted selected direction into `Suggestion.image_prompt` using deterministic code.
- Kept direct tool prompt builders separate.

### Phase 3: Update analysis/direction prompts

- Status: implemented.
- Added safer README-style production analysis prompt.
- Added safer direction schema.
- Kept two LLM calls first: analysis and directions.
- Did not combine into one call yet.

### Phase 4: UI and copy alignment

- Status: implemented.
- Updated `AnalyzingScreen` statuses:
  - Preparing your photo
  - Running photo analysis
  - Scoring composition, lighting, and pose
  - Creating coaching directions
  - Saving analysis
- Removed `Composing image prompts` from UI.
- Keep direction card copy user-friendly and avoid exposing technical safety terms.

### Phase 5: Remove or quarantine unused QA code

- Status: not implemented yet.
- If Vision QA remains disabled, move evaluator code behind a clearly named experimental flag or remove it.
- Do not leave production comments implying QA is active.

### Phase 6: Validation

- Status: partially implemented.
- Run `npm run typecheck`.
- Add prompt snapshot tests if the repo introduces test tooling.
- Manually verify debug logs for:
  - AI Coach prompt includes selected direction details.
  - AI Coach prompt does not include `captured minutes later`.
  - AI Coach prompt does not include direct-tool-only wording.
  - Direct tool prompts still include quick suggestion/custom instruction text.
- A/B test identity preservation:
  - current AI Coach composer flow
  - v2 deterministic builder flow

### Phase 7: Rollout

Rollback flag:

```text
EXPO_PUBLIC_AI_COACH_FLOW=v2
```

Current rollout sequence:

```text
v2 default
  -> legacy v1 available through EXPO_PUBLIC_AI_COACH_FLOW=v1
  -> internal simulator/device testing
  -> debug-log prompt audit
  -> remove or quarantine unused QA helpers
```

## Final Recommendation

The README proposal is the right direction for the AI Coach flow and is now the default AI Coach v2 implementation.

Implement it as AI Coach v2, not as a direct replacement for all editing tools. Direct editing tools should keep their specialized prompt contracts because they are stricter and safer for single-purpose edits.

Highest-value change implemented:

```text
Remove Prompt Composer LLM from default AI Coach and replace it with a deterministic image edit prompt builder.
```

Expected benefit:

- Lower latency.
- Lower cost.
- Less prompt drift.
- Better identity preservation.
- More predictable generated references.

Main implementation risk:

- Direction JSON quality must be good enough for deterministic prompt building.

Mitigation:

- Keep two LLM calls first: analysis and directions.
- Add robust parser fallbacks.
- Roll out behind `EXPO_PUBLIC_AI_COACH_FLOW=v2`.
