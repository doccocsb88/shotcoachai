#!/usr/bin/env bash
set -euo pipefail

IMAGE_PATH="${1:-/Users/mac/Desktop/e9a2d85c-0e4e-4c41-b0e4-9edbe581c1ea.png}"
OUT_DIR="${2:-/tmp/shotcoach-openai-flow}"
API_URL="https://api.openai.com/v1/responses"
IMAGE_MODEL_ARG="${3:-}"
REQUESTED_IMAGE_MODELS="$IMAGE_MODEL_ARG"

mkdir -p "$OUT_DIR"

if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

if [[ -z "${OPENAI_API_KEY:-${EXPO_PUBLIC_OPENAI_API_KEY:-}}" ]]; then
  echo "Missing OPENAI_API_KEY or EXPO_PUBLIC_OPENAI_API_KEY" >&2
  exit 1
fi

API_KEY="${OPENAI_API_KEY:-${EXPO_PUBLIC_OPENAI_API_KEY}}"
ANALYSIS_MODEL="${EXPO_PUBLIC_OPENAI_MODEL:-gpt-4.1-mini}"
IMAGE_MODEL="${IMAGE_MODEL_ARG:-${EXPO_PUBLIC_OPENAI_IMAGE_MODEL:-gpt-image-1.5}}"
IMAGE_SIZE="${EXPO_PUBLIC_OPENAI_IMAGE_SIZE:-1024x1536}"
ALL_EDIT_MODELS=("gpt-image-1.5" "gpt-image-1" "gpt-image-1-mini" "dall-e-2")

if [[ ! -f "$IMAGE_PATH" ]]; then
  echo "Image not found: $IMAGE_PATH" >&2
  exit 1
fi

case "${IMAGE_PATH##*.}" in
  png|PNG) MIME_TYPE="image/png" ;;
  jpg|JPG|jpeg|JPEG) MIME_TYPE="image/jpeg" ;;
  webp|WEBP) MIME_TYPE="image/webp" ;;
  *) MIME_TYPE="$(file --mime-type -b "$IMAGE_PATH")" ;;
esac

base64 < "$IMAGE_PATH" | tr -d '\n' > "$OUT_DIR/input_image.b64"

echo "== ShotCoach OpenAI flow test =="
echo "image=$IMAGE_PATH"
echo "mime=$MIME_TYPE"
echo "out_dir=$OUT_DIR"
echo "analysis_model=$ANALYSIS_MODEL"
echo "image_model=$IMAGE_MODEL"
echo "image_size=$IMAGE_SIZE"

ANALYSIS_PROMPT='You are an expert mobile photography coach for social/travel/fashion photos.

Analyze the user photo and return JSON only.

Requirements:
- Provide overall_score from 0.0 to 10.0
- Provide subscores relevant to the image
- Provide one concise English summary
- Provide up to 3 English strengths
- Provide up to 3 English issues
- Provide up to 3 English actionable suggestions
- Provide one coach_feedback_markdown in English with detailed shooting guidance
- Provide one English image_generation_prompt that can be used to generate an improved version of the photo

Rules:
- Write all user-facing feedback entirely in natural English
- Be specific to the actual visible scene and composition
- Analyze composition paths such as floor lines, leading lines, curves, columns, horizon, railing, background anchors, negative space, and subject placement when visible
- For people photos, include shooting angle, pose, body angle, hand placement, gaze, full-body/framing advice when relevant
- For non-person photos, adapt pose sections into subject placement / camera movement / framing guidance
- Do not mention sensitive attributes, including skin color, skin tone, age, race, ethnicity, religion, health, or body size
- Do not shame the subject
- Do not suggest changing outfit, shoes, accessories, body, face, makeup, or styling; focus on how to shoot better with the current scene and subject
- Never list clothing, shoes, accessories, skin, face, or body as an issue. If they are visible, treat them only as fixed visual context.
- Suggestions must be specific to the visible image
- The image_generation_prompt must focus on camera angle, pose, composition, framing, background, and lighting
- The image_generation_prompt must preserve the same subject identity and scene context
- Do not request face/body reshaping, beautification, sensitive-attribute changes, or unrealistic edits
- Do not invent objects that are not visible
- Output must be valid JSON

coach_feedback_markdown requirements:
- 350 to 900 English words
- Start with 1 short overall sentence like a real coach
- Include a section "Existing Leading Lines / Composition Paths"
- Include 3 to 5 numbered shooting directions
- Use this exact pattern for each direction: "1. [Shooting Angle Name]" followed by camera guidance, then a separate "Best-fitting pose" paragraph
- Each numbered direction should include:
  - camera angle / photographer position
  - composition target
  - a "Best-fitting pose" paragraph when a person is visible
- End with practical notes for retaking the photo
- Do not use generic filler; every point must connect to visible lines, shapes, background, subject, light, or framing
- Avoid sign-off phrases; keep it product-like and direct

JSON schema:
{
  "overall_score": number,
  "subscores": {
    "composition": number,
    "pose": number,
    "camera_angle": number,
    "background": number,
    "lighting": number,
    "framing": number,
    "scene_balance": number
  },
  "summary": string,
  "strengths": string[],
  "issues": string[],
  "suggestions": [
    { "title": string, "description": string }
  ],
  "coach_feedback_markdown": string,
  "image_generation_prompt": string
}'

echo
echo "== Step 1: analysis request =="
jq -n \
  --arg model "$ANALYSIS_MODEL" \
  --arg prompt "$ANALYSIS_PROMPT" \
  --arg mime_type "$MIME_TYPE" \
  --rawfile image_base64 "$OUT_DIR/input_image.b64" \
  '{
    model: $model,
    input: [
      {
        role: "system",
        content: [
          { type: "input_text", text: $prompt }
        ]
      },
      {
        role: "user",
        content: [
          { type: "input_text", text: "Analyze this photo and return JSON only." },
          { type: "input_image", image_url: ("data:" + $mime_type + ";base64," + $image_base64) }
        ]
      }
    ]
  }' > "$OUT_DIR/analysis_request.json"

START_SECONDS="$SECONDS"
ANALYSIS_CURL_META="$(
  curl -sS \
    --connect-timeout 20 \
    --max-time 90 \
    -o "$OUT_DIR/analysis_response.json" \
    -w "%{http_code} %{time_total}" \
    "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${API_KEY}" \
    -d @"$OUT_DIR/analysis_request.json"
)"
echo "analysis_curl=$ANALYSIS_CURL_META elapsed=$((SECONDS - START_SECONDS))s"

ANALYSIS_HTTP="${ANALYSIS_CURL_META%% *}"
if [[ "$ANALYSIS_HTTP" != "200" ]]; then
  echo "Analysis failed. Response:"
  jq . "$OUT_DIR/analysis_response.json" 2>/dev/null || cat "$OUT_DIR/analysis_response.json"
  exit 2
fi

jq -r '[.output[]?.content[]? | select(.type == "output_text") | .text] | first // empty' \
  "$OUT_DIR/analysis_response.json" > "$OUT_DIR/analysis_text.raw"

if [[ ! -s "$OUT_DIR/analysis_text.raw" ]]; then
  echo "Analysis response had no output_text. Output types:"
  jq -r '.output[]?.type // empty' "$OUT_DIR/analysis_response.json"
  exit 3
fi

sed -e '1s/^```json[[:space:]]*$//' -e '1s/^```[[:space:]]*$//' -e '$s/^```[[:space:]]*$//' \
  "$OUT_DIR/analysis_text.raw" > "$OUT_DIR/analysis_text.json"

jq . "$OUT_DIR/analysis_text.json" > "$OUT_DIR/analysis.json"
echo "analysis_json_ok=true"
jq '{overall_score, subscores, summary, strengths, issues, suggestions, coach_feedback_markdown, image_generation_prompt}' "$OUT_DIR/analysis.json"
jq -r '.coach_feedback_markdown // ""' "$OUT_DIR/analysis.json" | perl -0pe 's/\\n/\n/g' > "$OUT_DIR/coach_feedback.md"
echo "coach_feedback_file=$OUT_DIR/coach_feedback.md"

echo
echo "== Step 2: image generation request =="
SUGGESTIONS="$(jq -r '.suggestions[]? | "- \(.title): \(.description)"' "$OUT_DIR/analysis.json")"
ISSUES="$(jq -r '.issues[]? | "- \(.)"' "$OUT_DIR/analysis.json")"
SUMMARY="$(jq -r '.summary // ""' "$OUT_DIR/analysis.json")"
IMAGE_GENERATION_PROMPT="$(jq -r '.image_generation_prompt // ""' "$OUT_DIR/analysis.json")"
COACH_FEEDBACK_MARKDOWN="$(jq -r '.coach_feedback_markdown // ""' "$OUT_DIR/analysis.json")"

cat > "$OUT_DIR/image_prompt.txt" <<EOF_PROMPT
Edit the provided photo, using the original image as the base.

Keep the same person, same outfit, same location, same architectural setting, and same overall photo mood. Preserve the visible identity, facial features, hairstyle, clothing, accessories, background, architecture, floor, railing, landscape, and all important scene details from the original photo.

Style and lighting:
- photorealistic
- natural daylight
- soft, refined editorial travel style
- realistic skin texture
- detailed lace fabric
- clean luxury resort mood
- balanced contrast
- natural colors
- elegant and premium

Important:
- this is an edit of the original photo, not a completely different new image
- preserve the subject's identity and the original location faithfully
- do not replace the background with a different place
- do not change the outfit design significantly
- do not add extra accessories
- do not overly beautify or alter facial structure
- do not blur away the architecture or scenery

Negative constraints:
- no face distortion
- no hand distortion
- no extra fingers
- no warped columns
- no duplicated background elements
- no exaggerated body proportions
- no excessive blur
- no fake-looking skin
- no overly dramatic lighting

Analysis-based edit guidance:
Use the analysis below as the source of truth for composition, pose, camera perspective, framing, background, and lighting improvements. Do not apply a generic template if it conflicts with the analysis or the original image.

Coach summary:
$SUMMARY

Issues to fix:
$ISSUES

Suggestions to apply:
$SUGGESTIONS

Detailed coach feedback:
$COACH_FEEDBACK_MARKDOWN

Specific generation instruction:
$IMAGE_GENERATION_PROMPT
EOF_PROMPT

if [[ "${SKIP_IMAGE_GENERATION:-0}" == "1" ]]; then
  echo "image_prompt_file=$OUT_DIR/image_prompt.txt"
  echo
  echo "skip_image_generation=true"
  echo "done=true"
  exit 0
fi

prepare_dalle2_image() {
  local model_dir="$1"
  local source_image="$2"
  local rgb_image="$model_dir/input_dall_e_2_1024_rgb.png"
  local output_image="$model_dir/input_dall_e_2_1024.png"

  sips -s format png -z 1024 1024 "$source_image" --out "$rgb_image" >/dev/null
  python3 - "$rgb_image" "$output_image" <<'PY'
import struct
import sys
import zlib

src, dst = sys.argv[1], sys.argv[2]

def paeth(a, b, c):
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c

def read_chunks(data):
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise SystemExit('Input is not PNG')
    pos = 8
    while pos < len(data):
        length = struct.unpack('>I', data[pos:pos + 4])[0]
        ctype = data[pos + 4:pos + 8]
        payload = data[pos + 8:pos + 8 + length]
        yield ctype, payload
        pos += 12 + length

def write_chunk(ctype, payload):
    return (
        struct.pack('>I', len(payload)) +
        ctype +
        payload +
        struct.pack('>I', zlib.crc32(ctype + payload) & 0xffffffff)
    )

data = open(src, 'rb').read()
ihdr = None
idat = []
for ctype, payload in read_chunks(data):
    if ctype == b'IHDR':
        ihdr = payload
    elif ctype == b'IDAT':
        idat.append(payload)

if ihdr is None:
    raise SystemExit('Missing IHDR')

width, height, bit_depth, color_type, compression, png_filter, interlace = struct.unpack('>IIBBBBB', ihdr)
if bit_depth != 8 or interlace != 0:
    raise SystemExit(f'Unsupported PNG format bit_depth={bit_depth} interlace={interlace}')

channels_by_type = {0: 1, 2: 3, 4: 2, 6: 4}
if color_type not in channels_by_type:
    raise SystemExit(f'Unsupported PNG color_type={color_type}')

channels = channels_by_type[color_type]
stride = width * channels
raw = zlib.decompress(b''.join(idat))

rows = []
prev = bytearray(stride)
pos = 0
for _ in range(height):
    filter_type = raw[pos]
    pos += 1
    scan = bytearray(raw[pos:pos + stride])
    pos += stride
    recon = bytearray(stride)
    for i, value in enumerate(scan):
        left = recon[i - channels] if i >= channels else 0
        up = prev[i]
        upper_left = prev[i - channels] if i >= channels else 0
        if filter_type == 0:
            recon[i] = value
        elif filter_type == 1:
            recon[i] = (value + left) & 255
        elif filter_type == 2:
            recon[i] = (value + up) & 255
        elif filter_type == 3:
            recon[i] = (value + ((left + up) // 2)) & 255
        elif filter_type == 4:
            recon[i] = (value + paeth(left, up, upper_left)) & 255
        else:
            raise SystemExit(f'Unsupported PNG filter {filter_type}')
    rows.append(recon)
    prev = recon

out = bytearray()
for row in rows:
    out.append(0)
    if color_type == 6:
        out.extend(row)
    elif color_type == 2:
        for i in range(0, len(row), 3):
            out.extend(row[i:i + 3])
            out.append(255)
    elif color_type == 0:
        for value in row:
            out.extend([value, value, value, 255])
    elif color_type == 4:
        for i in range(0, len(row), 2):
            value, alpha = row[i], row[i + 1]
            out.extend([value, value, value, alpha])

new_ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, compression, png_filter, interlace)
png = (
    b'\x89PNG\r\n\x1a\n' +
    write_chunk(b'IHDR', new_ihdr) +
    write_chunk(b'IDAT', zlib.compress(bytes(out), 9)) +
    write_chunk(b'IEND', b'')
)
open(dst, 'wb').write(png)
PY
  echo "$output_image"
}

run_image_edit_model() {
  local model="$1"
  local model_dir="$OUT_DIR/models/$model"
  local model_image_path="$IMAGE_PATH"
  local model_size="$IMAGE_SIZE"
  local prompt_file="$OUT_DIR/image_prompt.txt"
  local started_seconds="$SECONDS"
  local curl_meta
  local http_status
  local generated_b64="$model_dir/generated.b64"
  local generated_png="$model_dir/generated.png"
  local status="failed"
  local error_message=""

  mkdir -p "$model_dir"

  if [[ "$model" == "dall-e-3" ]]; then
    cat > "$model_dir/skipped.txt" <<EOF_SKIP
dall-e-3 skipped: Image Edits endpoint is not available for DALL-E 3. Use GPT Image models for edits.
EOF_SKIP
    jq -n --arg model "$model" --arg status "skipped" --arg reason "Image Edits endpoint is not available for DALL-E 3." \
      '{model: $model, status: $status, reason: $reason}' > "$model_dir/result.json"
    cat "$model_dir/result.json"
    return 0
  fi

  if [[ "$model" == "dall-e-2" ]]; then
    model_image_path="$(prepare_dalle2_image "$model_dir" "$IMAGE_PATH")"
    model_size="1024x1024"
    prompt_file="$model_dir/image_prompt_dall_e_2.txt"
    cat > "$prompt_file" <<EOF_DALLE2_PROMPT
Edit the provided photo, using the original image as the base.

Keep the same person, same outfit, same location, same architectural setting, and same overall photo mood. Preserve the visible identity, facial features, hairstyle, clothing, accessories, background, architecture, floor, railing, landscape, and all important scene details from the original photo.

Apply the analysis-based edit guidance below. Do not use a generic template if it conflicts with the original image.

Coach summary: $SUMMARY

Specific edit instruction: $IMAGE_GENERATION_PROMPT

Suggestions: $SUGGESTIONS

Keep the result photorealistic with natural daylight, realistic fabric/detail, no face distortion, no hand distortion, no warped architecture, no extra accessories, no exaggerated body proportions, and no new background.
EOF_DALLE2_PROMPT
  fi

  cat > "$model_dir/image_request.txt" <<EOF_REQUEST
POST /v1/images/edits
model=$model
size=$model_size
image=$model_image_path
prompt_file=$prompt_file
EOF_REQUEST

  local curl_args=(
    -sS
    --connect-timeout 20
    --max-time 240
    -o "$model_dir/image_response.json"
    -w "%{http_code} %{time_total}"
    "https://api.openai.com/v1/images/edits"
    -H "Authorization: Bearer ${API_KEY}"
    -F "model=${model}"
    -F "image=@${model_image_path}"
    -F "prompt=<${prompt_file}"
    -F "size=${model_size}"
  )

  if [[ "$model" == gpt-image-* ]]; then
    curl_args+=(-F "quality=medium" -F "output_format=png")
  fi

  if [[ "$model" == "dall-e-2" ]]; then
    curl_args+=(-F "response_format=b64_json")
  fi

  set +e
  curl_meta="$(curl "${curl_args[@]}")"
  local curl_exit=$?
  set -e

  http_status="${curl_meta%% *}"

  if [[ "$curl_exit" -eq 0 && "$http_status" == "200" ]]; then
    jq -r '.data[0].b64_json // empty' "$model_dir/image_response.json" > "$generated_b64"

    if [[ -s "$generated_b64" ]]; then
      base64 -D -i "$generated_b64" -o "$generated_png"
      status="completed"
    else
      error_message="Image response had no data[0].b64_json."
    fi
  else
    error_message="$(jq -r '.error.message // empty' "$model_dir/image_response.json" 2>/dev/null || true)"
    if [[ -z "$error_message" ]]; then
      error_message="curl_exit=$curl_exit http_status=$http_status"
    fi
  fi

  jq -n \
    --arg model "$model" \
    --arg status "$status" \
    --arg http_status "$http_status" \
    --arg curl_meta "$curl_meta" \
    --arg elapsed_seconds "$((SECONDS - started_seconds))" \
    --arg image_path "$model_image_path" \
    --arg output_path "$generated_png" \
    --arg error_message "$error_message" \
    '{
      model: $model,
      status: $status,
      http_status: $http_status,
      curl_meta: $curl_meta,
      elapsed_seconds: ($elapsed_seconds | tonumber),
      input_image: $image_path,
      output_path: (if $status == "completed" then $output_path else null end),
      error_message: (if $error_message == "" then null else $error_message end)
    }' > "$model_dir/result.json"

  cat "$model_dir/result.json"
  return 0
}

if [[ "$REQUESTED_IMAGE_MODELS" == "all" || "$REQUESTED_IMAGE_MODELS" == "all-edits" ]]; then
  echo
  echo "== Step 2: image edits across models =="
  rm -rf "$OUT_DIR/models"
  mkdir -p "$OUT_DIR/models"

  for model in "${ALL_EDIT_MODELS[@]}"; do
    echo
    echo "-- model=$model --"
    run_image_edit_model "$model"
  done

  echo
  echo "-- model=dall-e-3 --"
  run_image_edit_model "dall-e-3"

  jq -s '.' "$OUT_DIR"/models/*/result.json > "$OUT_DIR/summary.json"
  echo "summary=$OUT_DIR/summary.json"
  echo "done=true"
else
  run_image_edit_model "$IMAGE_MODEL"
  cp "$OUT_DIR/models/$IMAGE_MODEL/generated.png" "$OUT_DIR/generated.png" 2>/dev/null || true
  echo "generated_image=$OUT_DIR/generated.png"
  echo "done=true"
fi
