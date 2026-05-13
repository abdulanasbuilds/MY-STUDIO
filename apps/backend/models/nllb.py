# MY STUDIO — models/nllb.py
import logging
import os
from typing import Any

logger = logging.getLogger("my-studio")

NLLB_LANG_MAP: dict[str, str] = {
    "en": "eng_Latn", "fr": "fra_Latn", "es": "spa_Latn",
    "ar": "arb_Arab", "zh": "zho_Hans", "de": "deu_Latn",
    "pt": "por_Latn", "hi": "hin_Deva", "ha": "hau_Latn", "sw": "swh_Latn",
    "yo": "yor_Latn", "ig": "ibo_Latn", "ko": "kor_Hang", "ja": "jpn_Jpan",
    "ru": "rus_Cyrl", "tr": "tur_Latn", "vi": "vie_Latn", "th": "tha_Thai",
    "id": "ind_Latn",
}


def load_nllb() -> dict[str, Any]:
    logger.info("Loading NLLB-200 translation model...")
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
    model_name = "facebook/nllb-200-distilled-600M"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(
        model_name, device_map="auto"
    )
    logger.info("NLLB-200 translation model loaded successfully.")
    return {"model": model, "tokenizer": tokenizer}


def translate_text(text: str, source_lang: str, target_lang: str, model: dict[str, Any] | None = None) -> str:
    logger.info(f"Translating from {source_lang} to {target_lang}")
    if model is None:
        model = load_nllb()
    src_code = NLLB_LANG_MAP.get(source_lang, "eng_Latn")
    tgt_code = NLLB_LANG_MAP.get(target_lang, "fra_Latn")
    tokenizer = model["tokenizer"]
    translation_model = model["model"]
    tokenizer.src_lang = src_code
    import torch
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512).to("cuda")
    with torch.no_grad():
        outputs = translation_model.generate(
            **inputs,
            forced_bos_token_id=tokenizer.convert_tokens_to_ids(tgt_code),
            max_length=512,
        )
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)
    logger.info(f"Translation complete: '{text[:30]}...' -> '{result[:30]}...'")
    return result
