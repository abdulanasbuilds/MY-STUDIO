# MY STUDIO — intelligence/edit_interpreter.py
import google.generativeai as genai
import os
import json

def interpret_edit_command(command: str, video_path: str, current_state: dict) -> dict:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    prompt = f"""
Translate natural language to edit operation.
Command: {command}

Available operations: trim_start, trim_end, speed, zoom, color, audio, caption, cut, stabilize, remove_background, slow_motion, fade.
Return ONLY valid JSON:
{{
  "operation": "operation_name",
  "params": {{"param1": "value"}},
  "description": "What this does in plain English",
  "reversible": true
}}
"""
    try:
        res = model.generate_content(prompt).text.strip()
        return json.loads(res[7:-3] if res.startswith("```json") else res)
    except Exception:
        return {"operation": "noop", "params": {}, "description": "Failed to parse", "reversible": True}

def execute_edit_operation(video_path: str, operation: dict, output_path: str) -> str:
    import subprocess
    op = operation.get("operation")
    params = operation.get("params", {})
    
    if op == "trim_start":
        subprocess.run(["ffmpeg", "-y", "-ss", str(params.get("start", 0)), "-i", video_path, "-c", "copy", output_path], check=True)
    elif op == "trim_end":
        subprocess.run(["ffmpeg", "-y", "-i", video_path, "-to", str(params.get("end", 10)), "-c", "copy", output_path], check=True)
    elif op == "speed":
        factor = params.get("factor", 1.5)
        subprocess.run(["ffmpeg", "-y", "-i", video_path, "-filter_complex", f"[0:v]setpts={1/factor}*PTS[v];[0:a]atempo={factor}[a]", "-map", "[v]", "-map", "[a]", output_path], check=True)
    elif op == "color":
        subprocess.run(["ffmpeg", "-y", "-i", video_path, "-vf", "eq=contrast=1.1:saturation=1.2", "-c:a", "copy", output_path], check=True)
    else:
        # Pass through
        subprocess.run(["cp", video_path, output_path])
    
    return output_path

def apply_edit_sequence(video_path: str, operations: list[dict], output_path: str) -> str:
    import shutil
    current = video_path
    for i, op in enumerate(operations):
        out = f"/tmp/edit_step_{i}.mp4"
        execute_edit_operation(current, op, out)
        current = out
    shutil.copy(current, output_path)
    return output_path
