from __future__ import annotations

import logging
from statistics import mean

from app.models.schemas import (
    GapAnalysisItem,
    GapAnalysisReport,
    LLMGapReasoningPayload,
    QuizResultResponse,
)
from app.services.llm.structured_client import StructuredLLMClient
from app.utils.prompt_loader import load_prompt

logger = logging.getLogger(__name__)


class KnowledgeGapAnalyzer:
    def __init__(
        self,
        llm_client: StructuredLLMClient,
        target_time_seconds: int = 45,
        llm_enrichment_enabled: bool = False,
    ) -> None:
        self._llm_client = llm_client
        self._target_time_seconds = max(15, int(target_time_seconds))
        self._llm_enrichment_enabled = bool(llm_enrichment_enabled)

    @staticmethod
    def _clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
        return max(minimum, min(maximum, value))

    def _compute_weakness_score(
        self,
        *,
        accuracy: float,
        avg_time: float,
        confidence: float,
        conceptual_errors: int,
        guessing_signals: int,
        confidence_mismatches: int,
        attempts: int,
    ) -> float:
        safe_attempts = max(1, int(attempts or 1))
        safe_accuracy = self._clamp(float(accuracy or 0.0))
        safe_confidence = self._clamp(float(confidence or 0.0))
        safe_avg_time = max(0.0, float(avg_time or 0.0))

        accuracy_gap = 1.0 - safe_accuracy
        time_penalty = max(0.0, (safe_avg_time - self._target_time_seconds) / self._target_time_seconds)
        calibration_gap = abs(safe_confidence - safe_accuracy)
        conceptual_ratio = max(0.0, float(conceptual_errors or 0) / safe_attempts)
        guessing_ratio = max(0.0, float(guessing_signals or 0) / safe_attempts)
        mismatch_ratio = max(0.0, float(confidence_mismatches or 0) / safe_attempts)

        score = (
            0.44 * accuracy_gap
            + 0.16 * self._clamp(time_penalty, 0.0, 1.2)
            + 0.14 * calibration_gap
            + 0.14 * self._clamp(conceptual_ratio, 0.0, 1.0)
            + 0.07 * self._clamp(guessing_ratio, 0.0, 1.0)
            + 0.05 * self._clamp(mismatch_ratio, 0.0, 1.0)
        )
        return round(self._clamp(score), 4)

    @staticmethod
    def _derive_misconceptions(
        *,
        accuracy: float,
        confidence: float,
        avg_time: float,
        conceptual_errors: int,
        guessing_signals: int,
        confidence_mismatches: int,
        target_time_seconds: int,
    ) -> list[str]:
        tags: list[str] = []
        if conceptual_errors > 0:
            tags.append("conceptual_error_pattern")
        if guessing_signals > 0:
            tags.append("low-deliberation_guessing")
        if confidence_mismatches > 0 or abs(confidence - accuracy) >= 0.2:
            tags.append("confidence_calibration_gap")
        if avg_time > target_time_seconds * 1.25:
            tags.append("slow_problem_decomposition")
        if accuracy < 0.45:
            tags.append("foundational_reinforcement_needed")
        return tags or ["needs_reinforcement"]

    @staticmethod
    def _build_recommendation(
        *,
        concept: str,
        accuracy: float,
        avg_time: float,
        confidence: float,
        conceptual_errors: int,
        guessing_signals: int,
        confidence_mismatches: int,
        target_time_seconds: int,
    ) -> str:
        parts: list[str] = []
        if conceptual_errors > 0:
            parts.append("review the core idea with worked examples")
        if guessing_signals > 0:
            parts.append("slow down and justify each option before answering")
        if confidence_mismatches > 0 or abs(confidence - accuracy) >= 0.2:
            parts.append("calibrate confidence by writing a quick certainty check")
        if avg_time > target_time_seconds * 1.25:
            parts.append("practice timed drills to improve decision speed")
        if accuracy < 0.5:
            parts.append("restart with beginner-to-intermediate progression")

        if not parts:
            return f"Keep polishing `{concept}` with mixed-difficulty practice and one reflection note after each session."

        concise = "; ".join(parts[:2])
        return f"For `{concept}`, {concise}."

    def _build_rule_candidates(self, result: QuizResultResponse) -> list[GapAnalysisItem]:
        candidates: list[GapAnalysisItem] = []
        concept_performance = list(result.concept_performance or [])

        for idx, perf in enumerate(concept_performance, start=1):
            concept = str(getattr(perf, "concept", "") or f"concept_{idx}").strip() or f"concept_{idx}"
            attempts = max(1, int(getattr(perf, "attempts", 1) or 1))
            accuracy = float(getattr(perf, "accuracy", 0.0) or 0.0)
            avg_time = float(getattr(perf, "avg_time", 0.0) or 0.0)
            confidence = float(getattr(perf, "confidence", 0.0) or 0.0)
            conceptual_errors = int(getattr(perf, "conceptual_errors", 0) or 0)
            guessing_signals = int(getattr(perf, "guessing_signals", 0) or 0)
            confidence_mismatches = int(getattr(perf, "confidence_mismatches", 0) or 0)

            weakness = self._compute_weakness_score(
                accuracy=accuracy,
                avg_time=avg_time,
                confidence=confidence,
                conceptual_errors=conceptual_errors,
                guessing_signals=guessing_signals,
                confidence_mismatches=confidence_mismatches,
                attempts=attempts,
            )

            misconceptions = self._derive_misconceptions(
                accuracy=accuracy,
                confidence=confidence,
                avg_time=avg_time,
                conceptual_errors=conceptual_errors,
                guessing_signals=guessing_signals,
                confidence_mismatches=confidence_mismatches,
                target_time_seconds=self._target_time_seconds,
            )

            recommendation = self._build_recommendation(
                concept=concept,
                accuracy=accuracy,
                avg_time=avg_time,
                confidence=confidence,
                conceptual_errors=conceptual_errors,
                guessing_signals=guessing_signals,
                confidence_mismatches=confidence_mismatches,
                target_time_seconds=self._target_time_seconds,
            )

            candidates.append(
                GapAnalysisItem(
                    concept=concept,
                    weakness_score=weakness,
                    misconceptions=misconceptions,
                    recommendation=recommendation,
                    priority_rank=idx,
                )
            )

        if candidates:
            return candidates

        # Fallback when concept-level diagnostics are missing.
        if result.user_performance:
            for idx, perf in enumerate(result.user_performance, start=1):
                concept = str(getattr(perf, "concept", "") or f"concept_{idx}").strip() or f"concept_{idx}"
                accuracy = float(getattr(perf, "accuracy", 0.0) or 0.0)
                avg_time = float(getattr(perf, "avg_time", 0.0) or 0.0)
                confidence = float(getattr(perf, "confidence", 0.0) or 0.0)
                candidates.append(
                    GapAnalysisItem(
                        concept=concept,
                        weakness_score=self._compute_weakness_score(
                            accuracy=accuracy,
                            avg_time=avg_time,
                            confidence=confidence,
                            conceptual_errors=0,
                            guessing_signals=0,
                            confidence_mismatches=0,
                            attempts=1,
                        ),
                        misconceptions=["needs_reinforcement"],
                        recommendation=f"For `{concept}`, build confidence with 10-15 targeted practice questions.",
                        priority_rank=idx,
                    )
                )
        return candidates

    def _build_dynamic_summary(
        self,
        result: QuizResultResponse,
        weak_concepts: list[GapAnalysisItem],
        candidates: list[GapAnalysisItem],
    ) -> str:
        accuracy_pct = round(float(result.overall_accuracy or 0.0) * 100)
        answered = int(result.answered_questions or 0)
        correct = int(result.correct_answers or 0)
        avg_time = mean([float(getattr(item, "avg_time", 0.0) or 0.0) for item in result.concept_performance]) if result.concept_performance else 0.0
        confidence_gap = (
            mean(
                [
                    abs(float(getattr(item, "confidence", 0.0) or 0.0) - float(getattr(item, "accuracy", 0.0) or 0.0))
                    for item in result.concept_performance
                ]
            )
            if result.concept_performance
            else 0.0
        )

        pace_label = "balanced"
        if avg_time > self._target_time_seconds * 1.2:
            pace_label = "deliberate but slow"
        elif 0 < avg_time < self._target_time_seconds * 0.7:
            pace_label = "fast"

        strongest = sorted(candidates, key=lambda item: item.weakness_score)[:3]
        priorities = weak_concepts[:3]
        confidence_gap_pct = round(confidence_gap * 100)

        strength_lines = (
            [f"- {item.concept} ({round((1 - item.weakness_score) * 100)}% mastery proxy)" for item in strongest]
            if strongest
            else ["- Strength signal is still forming. Run one more check-in for confidence."]
        )

        weakness_lines = (
            [
                f"- {item.concept} ({round(item.weakness_score * 100)}% weakness): {item.recommendation}"
                for item in priorities
            ]
            if priorities
            else ["- No severe weak clusters identified. Maintain current momentum."]
        )

        weekly_action_lines: list[str] = []
        if priorities:
            for idx, item in enumerate(priorities, start=1):
                weekly_action_lines.append(
                    f"- Day {idx * 2 - 1}-{idx * 2}: Focus on {item.concept} with one learn block + one practice block."
                )
            weekly_action_lines.append("- Day 7: Run a short adaptive reassessment and compare confidence vs accuracy.")
        else:
            weekly_action_lines = [
                "- Day 1-5: Keep mixed practice with medium and hard questions.",
                "- Day 6-7: Run a reassessment and document what improved.",
            ]

        summary = "\n".join(
            [
                "Performance Snapshot",
                f"- Topic: {result.topic}",
                f"- Accuracy: {correct}/{answered} ({accuracy_pct}%)",
                f"- Pace: {pace_label} ({round(avg_time, 1)}s average per concept check)",
                f"- Confidence Calibration Gap: {confidence_gap_pct} points",
                "",
                "Strengths",
                *strength_lines,
                "",
                "Weakness Priorities",
                *weakness_lines,
                "",
                "Weekly Learning Path",
                *weekly_action_lines,
            ]
        )

        if len(summary) > 1000:
            return summary[:997].rstrip() + "..."
        return summary

    async def analyze(self, result: QuizResultResponse) -> GapAnalysisReport:
        rule_candidates = self._build_rule_candidates(result)
        rule_candidates.sort(key=lambda item: item.weakness_score, reverse=True)
        for rank, item in enumerate(rule_candidates, start=1):
            item.priority_rank = rank

        weak_concepts = [item for item in rule_candidates if item.weakness_score >= 0.28]
        if not weak_concepts:
            weak_concepts = rule_candidates[: max(1, min(3, len(rule_candidates)))]

        dynamic_summary = self._build_dynamic_summary(result, weak_concepts, rule_candidates)

        if self._llm_enrichment_enabled:
            def fallback_reasoning() -> LLMGapReasoningPayload:
                return LLMGapReasoningPayload(weak_concepts=[], summary=dynamic_summary)

            llm_reasoning = await self._llm_client.invoke_structured(
                system_prompt=load_prompt("diagnoser"),
                user_prompt=(
                    f"User: {result.user_id}\n"
                    f"Topic: {result.topic}\n"
                    f"Overall Accuracy: {result.overall_accuracy}\n"
                    f"Concept performance: {result.concept_performance}\n"
                    "Return weak concepts with practical misconceptions and concise recommendations."
                ),
                output_model=LLMGapReasoningPayload,
                fallback_factory=fallback_reasoning,
                max_retries=0,
            )
        else:
            llm_reasoning = LLMGapReasoningPayload(weak_concepts=[], summary=dynamic_summary)

        reasoning_map = {
            item.concept.lower(): item
            for item in (llm_reasoning.weak_concepts or [])
            if getattr(item, "concept", None)
        }

        enriched: list[GapAnalysisItem] = []
        for item in rule_candidates:
            llm_item = reasoning_map.get(item.concept.lower())
            if llm_item:
                misconceptions = [llm_item.misconception] if llm_item.misconception else item.misconceptions
                recommendation = llm_item.recommendation or item.recommendation
            else:
                misconceptions = item.misconceptions or ["needs_reinforcement"]
                recommendation = item.recommendation

            enriched.append(
                GapAnalysisItem(
                    concept=item.concept,
                    weakness_score=item.weakness_score,
                    misconceptions=misconceptions,
                    recommendation=recommendation,
                    priority_rank=item.priority_rank,
                )
            )

        final_weak = [item for item in enriched if item.weakness_score >= 0.28]
        if not final_weak:
            final_weak = enriched[: max(1, min(3, len(enriched)))]

        for rank, item in enumerate(final_weak, start=1):
            item.priority_rank = rank

        summary = (llm_reasoning.summary or "").strip() or dynamic_summary
        if "deterministic diagnostics" in summary.lower() or "rule-based analyzer" in summary.lower():
            summary = dynamic_summary
        if len(summary) > 1000:
            summary = summary[:997].rstrip() + "..."

        logger.info(
            "Gap analysis completed | user_id=%s | weak_concepts=%s",
            result.user_id,
            len(final_weak),
        )

        return GapAnalysisReport(
            user_id=result.user_id,
            topic=result.topic,
            weak_concepts=final_weak,
            summary=summary,
        )
