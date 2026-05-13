# MY STUDIO — movie_pipeline.py
import os, json, subprocess, tempfile
import google.generativeai as genai
from db import update_job_status, save_to_library
from storage import upload_video, upload_image

def run_movie_pipeline(data: dict) -> str:
    job_id = data["job_id"]
    user_id = data["user_id"]
    prompt = data.get("prompt", "")
    screenplay_url = data.get("screenplay_url")
    style = data.get("style", "drama")
    duration_minutes = data.get("duration", 3)
    
    # Map durations from preset to minutes if passing 'short' 'medium' etc
    if isinstance(duration_minutes, str):
        d_map = {"short": 1, "medium": 3, "long": 5}
        duration_minutes = d_map.get(duration_minutes, 3)

    generate_score = data.get("generate_score", True)
    color_grade = data.get("color_grade", style)
    
    temp_dir = tempfile.mkdtemp(prefix=f"nexus_movie_{job_id}_")
    
    try:
        update_job_status(job_id, "processing", "writing_screenplay", 5)
        screenplay = generate_screenplay(prompt, screenplay_url, style, duration_minutes, job_id)
        
        update_job_status(job_id, "processing", "generating_storyboards", 15)
        storyboard_paths = generate_storyboards(screenplay, style, temp_dir)
        storyboard_urls = [upload_image(p, f"storyboard_{job_id}_{i}") for i, p in enumerate(storyboard_paths[:5])]
        
        update_job_status(job_id, "processing", "filming_scenes", 25)
        scene_videos = generate_all_scenes(screenplay, style, temp_dir, job_id)
        
        update_job_status(job_id, "processing", "composing_audio", 55)
        score_path = generate_film_score(style, duration_minutes * 60, f"{temp_dir}/score.wav") if generate_score else None
        narration_path = generate_narration(screenplay, user_id, f"{temp_dir}/narration.wav")
        
        update_job_status(job_id, "processing", "editing_film", 70)
        from models.filmaster import apply_cinematic_rhythm, analyze_cinematic_reference
        profile = analyze_cinematic_reference("movie", style)
        assembled = apply_cinematic_rhythm(scene_videos, screenplay, f"{temp_dir}/assembled.mp4")
        mixed = mix_film_audio(assembled, narration_path, score_path, f"{temp_dir}/mixed.mp4")
        
        update_job_status(job_id, "processing", "polishing_film", 85)
        from postproduction.human_feel import process_video
        with_titles = add_film_titles(mixed, screenplay, temp_dir)
        
        # Color grading and final polish
        polished = process_video(with_titles, f"{temp_dir}/polished.mp4", {
            "style": style, "content_type": "film", "add_grain": True, "color_grade": True
        })
        
        update_job_status(job_id, "processing", "uploading_film", 95)
        final_url = upload_video(polished, job_id, "nexus/movies")
        
        from postproduction.ffmpeg_utils import get_duration
        try: duration = int(get_duration(polished))
        except: duration = duration_minutes * 60
        
        save_to_library(user_id, job_id, screenplay.get("title", "My Film"), "movie", final_url, duration_seconds=duration)
        
        update_job_status(job_id, "complete", "done", 100, final_url, output_metadata={
            "storyboard_urls": storyboard_urls, "scene_count": len(scene_videos),
            "duration_seconds": duration, "style": style, "title": screenplay.get("title", "")
        })
        return final_url
        
    except Exception as e:
        update_job_status(job_id, "failed", str(e)[:500])
        raise
    finally:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)

def generate_screenplay(prompt, screenplay_url, style, duration_minutes, job_id) -> dict:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-1.5-pro")
    
    if screenplay_url:
        import requests
        source_text = requests.get(screenplay_url).text[:10000]
        instruction = f"Parse this screenplay and extract its structure:\n{source_text}"
    else:
        instruction = f"Write a complete {style} screenplay from this idea: {prompt}"
    
    target_words = duration_minutes * 150
    scene_count = max(3, duration_minutes * 2)
    
    screenplay_prompt = f"""
{instruction}
Requirements:
- Genre/style: {style}
- Total duration: {duration_minutes} minutes
- Number of scenes: {scene_count}
- Total words: approx {target_words}
Return ONLY valid JSON (no markdown block):
{{
  "title": "Film title", "logline": "One sentence", "style": "{style}", "total_duration_seconds": {duration_minutes * 60},
  "scenes": [{{ "scene_number": 1, "heading": "INT. LOC - DAY", "description": "Visual desc.", "dialogue": [], "duration_seconds": 30, "emotional_tone": "tense", "camera_suggestion": "close_up", "lighting": "natural" }}]
}}
"""
    try:
        res = model.generate_content(screenplay_prompt).text.strip()
        return json.loads(res[7:-3] if res.startswith("```json") else res)
    except:
        return {
            "title": "Nexus Film", "logline": prompt[:100], "style": style, "total_duration_seconds": duration_minutes * 60,
            "scenes": [{"scene_number": 1, "heading": "EXT. LOC - DAY", "description": prompt, "dialogue": [], "duration_seconds": duration_minutes * 60, "emotional_tone": "dramatic", "camera_suggestion": "wide", "lighting": "golden_hour"}]
        }

def generate_storyboards(screenplay: dict, style: str, temp_dir: str) -> list[str]:
    from models.flux import load_flux, generate_image
    flux = load_flux()
    paths = []
    for i, scene in enumerate(screenplay.get("scenes", [])[:8]):
        prompt = f"Cinematic storyboard frame, {style} film style. Scene: {scene['description'][:200]} Camera: {scene.get('camera_suggestion', 'medium shot')} Lighting: {scene.get('lighting', 'natural')} Mood: {scene.get('emotional_tone', 'dramatic')} Professional cinematography."
        output = f"{temp_dir}/storyboard_{i:02d}.jpg"
        generate_image(prompt, output, width=1280, height=720, model=flux)
        paths.append(output)
    return paths

def generate_all_scenes(screenplay, style, temp_dir, job_id) -> list[str]:
    from models.skyreels import generate_multiple_takes
    from models.filmaster import analyze_cinematic_reference
    
    profile = analyze_cinematic_reference("movie", style)
    scene_videos = []
    scenes = screenplay.get("scenes", [])
    total = len(scenes)
    
    for i, scene in enumerate(scenes):
        progress = 25 + int((i / total) * 25)
        update_job_status(job_id, "processing", f"filming_scene_{i+1}_of_{total}", progress)
        
        camera = scene.get("camera_suggestion", "medium")
        movement = profile.get("camera_movement", "steadicam")
        scene_prompt = f"{camera}, {movement}. {scene['description']}. {scene.get('lighting', 'natural')} lighting. Cinematic {style} film, {profile['color_temperature']} color."
        duration = min(60, max(10, scene.get("duration_seconds", 20)))
        
        output_dir = f"{temp_dir}/scene_{i:02d}"
        os.makedirs(output_dir, exist_ok=True)
        
        takes = generate_multiple_takes(scene_prompt, duration, style, output_dir, 2)
        best_take = takes[0] if len(takes) == 1 else max(takes, key=lambda p: os.path.getsize(p) if os.path.exists(p) else 0)
        scene_videos.append(best_take)
    return scene_videos

def generate_film_score(style, duration_seconds, output_path) -> str:
    from models.musicgen import generate_music
    genre_prompts = {
        "action": "cinematic action film score, intense orchestral, brass",
        "drama": "emotional cinematic drama, strings, piano, slow build",
        "comedy": "light playful film score, pizzicato strings, woodwinds",
        "horror": "dark horror film music, dissonant strings, low drones",
        "documentary": "inspiring documentary score, ambient, gentle piano",
        "scifi": "sci-fi film score, electronic ambient, deep bass"
    }
    prompt = genre_prompts.get(style, genre_prompts["drama"])
    return generate_music(prompt, output_path, min(30, duration_seconds))

def generate_narration(screenplay, user_id, output_path) -> str:
    narration_text = " ".join([" ".join(scene.get("dialogue", [])) for scene in screenplay.get("scenes", [])])
    if not narration_text.strip(): narration_text = screenplay.get("logline", "")
    if not narration_text:
        subprocess.run(["ffmpeg", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "1", "-y", output_path], capture_output=True)
        return output_path
    from models.sovits import generate_speech
    return generate_speech(narration_text, user_id, output_path)

def mix_film_audio(video, narration, score, output_path) -> str:
    inputs = ["-i", video, "-i", narration]
    filter_parts = ["[1:a]volume=1.0[narr]"]
    mix_inputs = "[narr]"
    
    if score and os.path.exists(score):
        inputs.extend(["-i", score])
        filter_parts.append("[2:a]volume=0.25[music]")
        mix_inputs += "[music]"
        filter_parts.append(f"{mix_inputs}amix=inputs=2:normalize=0[audio]")
    else:
        filter_parts.append("[narr]acopy[audio]")
    
    subprocess.run([
        "ffmpeg", *inputs, "-filter_complex", ";".join(filter_parts),
        "-map", "0:v", "-map", "[audio]", "-c:v", "copy", "-c:a", "aac",
        "-shortest", "-y", output_path
    ], check=True)
    return output_path

def add_film_titles(video, screenplay, temp_dir) -> str:
    title = screenplay.get("title", "NEXUS FILM").replace("'", "")
    output = f"{temp_dir}/with_titles.mp4"
    subprocess.run([
        "ffmpeg", "-i", video, "-vf",
        f"drawtext=text='{title}':fontsize=80:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,0,3)':alpha='if(lt(t,1),t,if(lt(t,2),1,3-t))'",
        "-c:a", "copy", "-y", output
    ], check=True)
    return output
