from __future__ import annotations

import logging
import os
import re
from dataclasses import dataclass
from threading import Lock

logger = logging.getLogger("resume_extractor.ner")

os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")


@dataclass
class NerEntity:
    text: str
    label: str
    score: float


class NERService:
    def __init__(
        self,
        model_name: str,
        max_chars: int,
        *,
        enable_transformers: bool,
        enable_spacy: bool,
    ) -> None:
        self.model_name = model_name
        self.max_chars = max_chars
        self.enable_transformers = enable_transformers
        self.enable_spacy = enable_spacy
        self._pipeline = None
        self._pipeline_error: str | None = None
        self._nlp = None
        self._nlp_error: str | None = None
        self._lock = Lock()

    @property
    def is_ready(self) -> bool:
        return self._pipeline is not None

    def warmup(self) -> None:
        self._ensure_pipeline()

    def extract_entities(self, text: str) -> tuple[list[NerEntity], list[str]]:
        self._ensure_pipeline()
        warnings: list[str] = []

        if self._pipeline is None:
            warnings.append(
                f"Transformer model '{self.model_name}' was unavailable. Regex and heuristics were used."
            )
            return [], warnings

        if self._nlp_error:
            warnings.append("spaCy sentence chunking was unavailable; regex chunking was used.")

        entities: list[NerEntity] = []
        seen: set[tuple[str, str]] = set()

        for chunk in self._chunk_text(text):
            try:
                predictions = self._pipeline(chunk)
            except Exception as exc:  # pragma: no cover
                logger.exception("ner_chunk_failed", exc_info=exc)
                warnings.append("NER failed on part of the document. Heuristic fallback was used.")
                continue

            for item in predictions:
                entity_text = str(item.get("word", "")).strip()
                label = str(item.get("entity_group", "")).upper()
                score = float(item.get("score", 0.0))
                key = (entity_text.lower(), label)

                if not entity_text or key in seen:
                    continue

                seen.add(key)
                entities.append(NerEntity(text=entity_text, label=label, score=score))

        return entities, warnings

    def _ensure_pipeline(self) -> None:
        if self._pipeline is not None or self._pipeline_error is not None:
            return

        if not self.enable_transformers:
            self._pipeline_error = "Transformer NER disabled."
            return

        with self._lock:
            if self._pipeline is not None or self._pipeline_error is not None:
                return

            try:
                import torch
                from transformers import AutoModelForTokenClassification, AutoTokenizer, pipeline

                torch.set_grad_enabled(False)
                tokenizer = AutoTokenizer.from_pretrained(self.model_name)
                model = AutoModelForTokenClassification.from_pretrained(self.model_name)
                self._pipeline = pipeline(
                    "ner",
                    model=model,
                    tokenizer=tokenizer,
                    aggregation_strategy="simple",
                    device=-1,
                )
            except Exception as exc:  # pragma: no cover
                logger.exception("ner_model_load_failed", exc_info=exc)
                self._pipeline_error = str(exc)

    def _ensure_nlp(self) -> None:
        if self._nlp is not None or self._nlp_error is not None:
            return

        if not self.enable_spacy:
            self._nlp_error = "spaCy disabled."
            return

        try:
            import spacy

            self._nlp = spacy.blank("en")
            if "sentencizer" not in self._nlp.pipe_names:
                self._nlp.add_pipe("sentencizer")
        except Exception as exc:  # pragma: no cover
            logger.exception("spacy_init_failed", exc_info=exc)
            self._nlp_error = str(exc)

    def _chunk_text(self, text: str) -> list[str]:
        clipped = text[: self.max_chars]
        self._ensure_nlp()

        if self._nlp is None:
            return self._fallback_chunks(clipped)

        chunks: list[str] = []
        current: list[str] = []
        current_length = 0
        max_chunk_chars = 900

        for sentence in self._nlp(clipped).sents:
            value = sentence.text.strip()
            if not value:
                continue

            if current and current_length + len(value) > max_chunk_chars:
                chunks.append(" ".join(current))
                current = [value]
                current_length = len(value)
            else:
                current.append(value)
                current_length += len(value) + 1

        if current:
            chunks.append(" ".join(current))

        return chunks or [clipped]

    @staticmethod
    def _fallback_chunks(text: str) -> list[str]:
        sentences = [segment.strip() for segment in re.split(r"(?<=[.!?])\s+|\n+", text) if segment.strip()]
        chunks: list[str] = []
        current: list[str] = []
        current_length = 0
        max_chunk_chars = 900

        for sentence in sentences:
            if current and current_length + len(sentence) > max_chunk_chars:
                chunks.append(" ".join(current))
                current = [sentence]
                current_length = len(sentence)
            else:
                current.append(sentence)
                current_length += len(sentence) + 1

        if current:
            chunks.append(" ".join(current))

        return chunks or [text]
