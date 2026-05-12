# MY STUDIO — ffmpeg_utils.py
# PURPOSE: FFmpeg wrapper utilities for video/audio processing
# CONNECTS TO: All pipelines and postproduction modules


def extract_segment(
    input_path: str,
    output_path: str,
    start_seconds: float,
    end_seconds: float,
) -> str:
    """Extract a time segment from a video or audio file.

    Args:
        input_path: Path to the input file.
        output_path: Where to save the extracted segment.
        start_seconds: Start time in seconds.
        end_seconds: End time in seconds.

    Returns:
        Path to the extracted segment file.
    """
    raise NotImplementedError("FFmpeg extract_segment — see PLAN.md Phase 4")


def merge_audio_video(
    video_path: str,
    audio_path: str,
    output_path: str,
) -> str:
    """Merge an audio track onto a video file.

    Args:
        video_path: Path to the video file.
        audio_path: Path to the audio file.
        output_path: Where to save the merged output.

    Returns:
        Path to the merged output file.
    """
    raise NotImplementedError("FFmpeg merge_audio_video — see PLAN.md Phase 4")


def add_subtitle_track(
    video_path: str,
    subtitle_path: str,
    output_path: str,
) -> str:
    """Burn subtitles into a video file.

    Args:
        video_path: Path to the video file.
        subtitle_path: Path to the subtitle file (SRT or ASS).
        output_path: Where to save the subtitled video.

    Returns:
        Path to the subtitled video file.
    """
    raise NotImplementedError("FFmpeg add_subtitle_track — see PLAN.md Phase 4")


def speed_change(
    input_path: str,
    output_path: str,
    factor: float,
) -> str:
    """Change the playback speed of a video.

    Args:
        input_path: Path to the input video file.
        output_path: Where to save the speed-changed video.
        factor: Speed multiplier (e.g. 2.0 = double speed, 0.5 = half speed).

    Returns:
        Path to the speed-changed video file.
    """
    raise NotImplementedError("FFmpeg speed_change — see PLAN.md Phase 4")


def add_zoom(
    input_path: str,
    output_path: str,
    start_time: float,
    zoom_factor: float,
) -> str:
    """Apply a zoom effect at a specific timestamp.

    Args:
        input_path: Path to the input video file.
        output_path: Where to save the zoomed video.
        start_time: Time in seconds where the zoom starts.
        zoom_factor: Zoom multiplier (e.g. 1.5 = 150% zoom).

    Returns:
        Path to the zoomed video file.
    """
    raise NotImplementedError("FFmpeg add_zoom — see PLAN.md Phase 4")


def concatenate_videos(
    video_paths: list[str],
    output_path: str,
) -> str:
    """Concatenate multiple video files into one.

    Args:
        video_paths: List of paths to video files in order.
        output_path: Where to save the concatenated video.

    Returns:
        Path to the concatenated video file.
    """
    raise NotImplementedError("FFmpeg concatenate_videos — see PLAN.md Phase 4")


def extract_audio(
    video_path: str,
    output_path: str,
) -> str:
    """Extract the audio track from a video file.

    Args:
        video_path: Path to the video file.
        output_path: Where to save the extracted audio.

    Returns:
        Path to the extracted audio file.
    """
    raise NotImplementedError("FFmpeg extract_audio — see PLAN.md Phase 4")


def get_duration(
    file_path: str,
) -> float:
    """Get the duration of a video or audio file in seconds.

    Args:
        file_path: Path to the media file.

    Returns:
        Duration in seconds.
    """
    raise NotImplementedError("FFmpeg get_duration — see PLAN.md Phase 4")


def get_resolution(
    file_path: str,
) -> tuple[int, int]:
    """Get the resolution of a video file.

    Args:
        file_path: Path to the video file.

    Returns:
        Tuple of (width, height) in pixels.
    """
    raise NotImplementedError("FFmpeg get_resolution — see PLAN.md Phase 4")


def crop_to_vertical(
    input_path: str,
    output_path: str,
) -> str:
    """Crop a video to 9:16 vertical format.

    Args:
        input_path: Path to the input video file.
        output_path: Where to save the cropped video.

    Returns:
        Path to the cropped vertical video.
    """
    raise NotImplementedError("FFmpeg crop_to_vertical — see PLAN.md Phase 4")


def crop_to_square(
    input_path: str,
    output_path: str,
) -> str:
    """Crop a video to 1:1 square format.

    Args:
        input_path: Path to the input video file.
        output_path: Where to save the cropped video.

    Returns:
        Path to the cropped square video.
    """
    raise NotImplementedError("FFmpeg crop_to_square — see PLAN.md Phase 4")


def add_film_grain(
    input_path: str,
    output_path: str,
    intensity: float,
) -> str:
    """Add film grain noise overlay to a video.

    Args:
        input_path: Path to the input video file.
        output_path: Where to save the grained video.
        intensity: Grain intensity (0.0 = none, 1.0 = heavy).

    Returns:
        Path to the video with film grain applied.
    """
    raise NotImplementedError("FFmpeg add_film_grain — see PLAN.md Phase 8")


def normalize_audio(
    input_path: str,
    output_path: str,
    target_lufs: float,
) -> str:
    """Normalize audio loudness to a target LUFS level.

    Args:
        input_path: Path to the input audio or video file.
        output_path: Where to save the normalized output.
        target_lufs: Target loudness in LUFS (e.g. -14.0 for broadcast).

    Returns:
        Path to the loudness-normalized file.
    """
    raise NotImplementedError("FFmpeg normalize_audio — see PLAN.md Phase 8")


def apply_lut(
    input_path: str,
    output_path: str,
    lut_path: str,
) -> str:
    """Apply a color LUT (Look-Up Table) to a video.

    Args:
        input_path: Path to the input video file.
        output_path: Where to save the color-graded video.
        lut_path: Path to the .cube or .3dl LUT file.

    Returns:
        Path to the color-graded video file.
    """
    raise NotImplementedError("FFmpeg apply_lut — see PLAN.md Phase 8")


def add_blur_background(
    input_path: str,
    output_path: str,
) -> str:
    """Add a blurred background behind vertical content in 16:9 frame.

    Useful for displaying vertical/portrait content on horizontal
    platforms without black bars.

    Args:
        input_path: Path to the input video file.
        output_path: Where to save the video with blurred background.

    Returns:
        Path to the video with blurred background.
    """
    raise NotImplementedError("FFmpeg add_blur_background — see PLAN.md Phase 4")


def export_all_formats(
    input_path: str,
    output_dir: str,
) -> dict[str, str]:
    """Export a video in all platform formats (16:9, 9:16, 1:1).

    Creates three versions of the input video optimized for
    different platforms: landscape, portrait, and square.

    Args:
        input_path: Path to the input video file.
        output_dir: Directory to save the exported formats.

    Returns:
        Dictionary mapping format names to file paths:
        {"landscape": "...", "portrait": "...", "square": "..."}.
    """
    raise NotImplementedError("FFmpeg export_all_formats — see PLAN.md Phase 8")
