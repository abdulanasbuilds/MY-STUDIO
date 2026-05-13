# MY STUDIO — viral_scorer.py
import os
import google.generativeai as genai

def score_viral_moment(
    transcript_segment: list[dict],
    audio_features: dict,
    visual_features: dict,
    job_id: str
) -> dict:
    """
    Score a potential clip on 12 viral signals.
    """
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    text = " ".join([w["word"] for w in transcript_segment])
    duration = transcript_segment[-1]["end"] - transcript_segment[0]["start"] if transcript_segment else 0
    wpm = len(transcript_segment) / (duration / 60) if duration > 0 else 0
    
    prompt = f"""
You are a viral content expert. Score this video segment on 12 dimensions.
Return ONLY valid JSON, no markdown, no explanation.

TRANSCRIPT: {text}
DURATION: {duration:.1f} seconds
WPM: {wpm:.0f}
ENERGY_CURVE: {audio_features.get('energy_curve', 'unknown')}
SCENE_CHANGES_PER_MIN: {visual_features.get('scene_changes_per_min', 0)}

Score each dimension 0.0 to 1.0:
1. hook_strength: How compelling are the first 5 words?
2. emotional_peak: Is there genuine emotion in delivery?
3. information_density: Value per second (high = more rewatches)
4. controversy_score: Would this trigger debate in comments?
5. relatability_score: Can any viewer see themselves in this?
6. quotability: Is there one memorable shareable line?
7. visual_change_rate: Scene variety keeping viewer engaged?
8. face_engagement: Animated expression vs static delivery?
9. pattern_interrupt: Does anything break expectations?
10. audio_quality: Clear and pleasant to listen to?
11. caption_readability: Words easy to follow as captions?
12. trend_alignment: Does topic match current platform trends?

Return this exact JSON structure:
{{
  "scores": {{
    "hook_strength": 0.0,
    "emotional_peak": 0.0,
    "information_density": 0.0,
    "controversy_score": 0.0,
    "relatability_score": 0.0,
    "quotability": 0.0,
    "visual_change_rate": 0.0,
    "face_engagement": 0.0,
    "pattern_interrupt": 0.0,
    "audio_quality": 0.0,
    "caption_readability": 0.0,
    "trend_alignment": 0.0
  }},
  "composite_score": 0.0,
  "one_line_reason": "Why this moment will perform",
  "hook_type": "question|shock|story|demonstration|stat|relatable",
  "viral_triggers": ["curiosity_gap", "social_proof"],
  "suggested_hook_text": "5-7 word text overlay for first 1.5 seconds"
}}
"""
    try:
        response = model.generate_content(prompt)
        import json
        text_resp = response.text.strip()
        if text_resp.startswith("```json"):
            text_resp = text_resp[7:-3].strip()
        result = json.loads(text_resp)
        
        weights = {
            "hook_strength": 0.20,
            "emotional_peak": 0.18,
            "information_density": 0.15,
            "controversy_score": 0.10,
            "relatability_score": 0.10,
            "quotability": 0.08,
            "visual_change_rate": 0.07,
            "face_engagement": 0.05,
            "pattern_interrupt": 0.03,
            "audio_quality": 0.02,
            "caption_readability": 0.01,
            "trend_alignment": 0.01,
        }
        
        composite = sum(
            result["scores"].get(k, 0.5) * w 
            for k, w in weights.items()
        )
        result["composite_score"] = round(composite, 3)
        print(f"[JOB {job_id[:8]}] Scored moment: {composite:.2f}")
        return result
        
    except Exception as e:
        print(f"[JOB {job_id[:8]}] Scoring failed: {e}")
        return {
            "scores": {k: 0.5 for k in [
                "hook_strength","emotional_peak","information_density",
                "controversy_score","relatability_score","quotability",
                "visual_change_rate","face_engagement","pattern_interrupt",
                "audio_quality","caption_readability","trend_alignment"
            ]},
            "composite_score": 0.5,
            "one_line_reason": "Score unavailable",
            "hook_type": "unknown",
            "viral_triggers": [],
            "suggested_hook_text": ""
        }

def find_viral_moments(
    transcript: list[dict],
    scenes: list[dict],
    face_data: list[dict],
    max_clips: int,
    min_duration: float,
    max_duration: float,
    custom_instructions: str | None,
    job_id: str
) -> list[dict]:
    """
    Find best viral moments in video.
    """
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-1.5-pro")
    
    full_text = " ".join([w["word"] for w in transcript])
    total_duration = transcript[-1]["end"] if transcript else 0
    
    instructions_text = f"\nAdditional focus: {custom_instructions}" if custom_instructions else ""
    
    prompt = f"""
Analyze this video transcript and identify the {max_clips} best 
moments that would make viral short-form clips ({min_duration}-{max_duration} seconds).
{instructions_text}

FULL TRANSCRIPT WITH TIMESTAMPS:
{json.dumps([{"word": w["word"], "t": f"{w['start']:.1f}"} for w in transcript[:200]])}

Total video duration: {total_duration:.0f} seconds

For each viral moment return the START and END timestamps.
Choose moments with strong hooks, emotional peaks, or 
surprising/valuable information.

Return ONLY valid JSON:
{{
  "moments": [
    {{
      "start": 12.5,
      "end": 67.3,
      "score_estimate": 0.87,
      "hook_text": "Nobody talks about this",
      "hook_type": "shock",
      "viral_triggers": ["curiosity_gap", "information"],
      "reason": "Opens with surprising claim, delivers clear value"
    }}
  ]
}}
"""
    try:
        response = model.generate_content(prompt)
        import json
        text_resp = response.text.strip()
        if text_resp.startswith("```json"):
            text_resp = text_resp[7:-3].strip()
        result = json.loads(text_resp)
        moments = result.get("moments", [])
        
        for moment in moments:
            start, end = moment["start"], moment["end"]
            segment_words = [w for w in transcript if w["start"] >= start and w["end"] <= end]
            moment["transcript_text"] = " ".join([w["word"] for w in segment_words])
        
        moments.sort(key=lambda x: x.get("score_estimate", 0), reverse=True)
        return moments[:max_clips]
        
    except Exception as e:
        print(f"[JOB {job_id[:8]}] Moment finding failed: {e}")
        return []
