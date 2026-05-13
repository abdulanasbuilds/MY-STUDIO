# MY STUDIO — postproduction/audio_mixing.py
import subprocess
import os

def normalize_to_broadcast(audio, output) -> str:
    subprocess.run(["ffmpeg", "-y", "-i", audio, "-af", "loudnorm=I=-14:LRA=11:TP=-1.5", output], check=True)
    return output

def separate_stems(audio, output_dir) -> dict:
    from models.demucs import separate_audio
    return separate_audio(audio, output_dir)

def master_audio(audio, reference_audio, output) -> str:
    import matchering as mg
    mg.process(target=audio, reference=reference_audio, results=[mg.pcm24(output)])
    return output

def clean_audio(audio, output) -> str:
    from voicefixer import VoiceFixer
    vf = VoiceFixer()
    vf.restore(input=audio, output=output, cuda=True)
    return output

def generate_silence(duration_seconds, output) -> str:
    subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", str(duration_seconds), output], check=True)
    return output
