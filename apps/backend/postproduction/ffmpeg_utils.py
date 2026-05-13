# MY STUDIO — postproduction/ffmpeg_utils.py
import subprocess
import json

def extract_segment(input_path, start, end, output) -> str:
    subprocess.run(["ffmpeg", "-y", "-ss", str(start), "-i", input_path, "-to", str(end-start), "-c:v", "libx264", "-c:a", "aac", output], check=True)
    return output

def merge_audio_video(video, audio, output) -> str:
    subprocess.run(["ffmpeg", "-y", "-i", video, "-i", audio, "-c:v", "copy", "-c:a", "aac", "-map", "0:v:0", "-map", "1:a:0", "-shortest", output], check=True)
    return output

def concatenate_videos(video_list, output) -> str:
    import tempfile, os
    concat_list = tempfile.mktemp(suffix=".txt")
    with open(concat_list, "w") as f:
        for v in video_list: f.write(f"file '{v}'\n")
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_list, "-c", "copy", output], check=True)
    os.remove(concat_list)
    return output

def extract_audio(video, output) -> str:
    subprocess.run(["ffmpeg", "-y", "-i", video, "-q:a", "0", "-map", "a", output], check=True)
    return output

def get_duration(video) -> float:
    res = subprocess.run(["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", video], capture_output=True, text=True)
    return float(res.stdout.strip())

def get_resolution(video) -> tuple[int, int]:
    res = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=s=x:p=0", video], capture_output=True, text=True)
    w, h = res.stdout.strip().split('x')
    return int(w), int(h)

def crop_to_vertical(video, output, face_x=None) -> str:
    crop_exp = f"ih*9/16:ih:{face_x}-((ih*9/16)/2):0" if face_x else "ih*9/16:ih"
    subprocess.run(["ffmpeg", "-y", "-i", video, "-vf", f"crop={crop_exp}", "-c:a", "copy", output], check=True)
    return output

def crop_to_square(video, output) -> str:
    subprocess.run(["ffmpeg", "-y", "-i", video, "-vf", "crop=ih:ih", "-c:a", "copy", output], check=True)
    return output

def add_blur_background(video, output) -> str:
    subprocess.run(["ffmpeg", "-y", "-i", video, "-filter_complex", "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,boxblur=20:20[bg];[0:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=y=(H-h)/2[v]", "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-c:a", "copy", output], check=True)
    return output

def speed_change(video, factor, output) -> str:
    subprocess.run(["ffmpeg", "-y", "-i", video, "-filter_complex", f"[0:v]setpts={1/factor}*PTS[v];[0:a]atempo={factor}[a]", "-map", "[v]", "-map", "[a]", output], check=True)
    return output

def add_zoom(video, start, end, zoom_to, output) -> str:
    subprocess.run(["ffmpeg", "-y", "-i", video, "-vf", f"zoompan=z='min(zoom+0.0015,{zoom_to})':d=1", output], check=True)
    return output

def add_text_overlay(video, text, position, duration, output) -> str:
    subprocess.run(["ffmpeg", "-y", "-i", video, "-vf", f"drawtext=text='{text}':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/4:enable='between(t,0,{duration})'", "-c:a", "copy", output], check=True)
    return output

def add_film_grain(video, intensity, output) -> str:
    subprocess.run(["ffmpeg", "-y", "-i", video, "-vf", f"noise=alls={intensity}:allf=t+u", "-c:a", "copy", output], check=True)
    return output

def normalize_audio(video, target_lufs, output) -> str:
    subprocess.run(["ffmpeg", "-y", "-i", video, "-af", f"loudnorm=I={target_lufs}:LRA=11:TP=-1.5", "-c:v", "copy", output], check=True)
    return output

def apply_lut(video, lut_path, output) -> str:
    subprocess.run(["ffmpeg", "-y", "-i", video, "-vf", f"lut3d={lut_path}", "-c:a", "copy", output], check=True)
    return output

def export_all_formats(video) -> dict[str, str]:
    import os
    base = os.path.splitext(video)[0]
    paths = {"horizontal": video, "vertical": f"{base}_9x16.mp4", "square": f"{base}_1x1.mp4"}
    crop_to_vertical(video, paths["vertical"])
    crop_to_square(video, paths["square"])
    return paths
