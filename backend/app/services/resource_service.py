from __future__ import annotations

import logging

from app.models import FreeResource, GapAnalysisReport, LLMResourceSelectionPayload
from app.services.llm import StructuredLLMClient
from app.services.resource_catalog import list_resources
from app.utils.prompt_loader import load_prompt

logger = logging.getLogger(__name__)


class ResourceService:
    def __init__(self, llm_client: StructuredLLMClient, llm_enrichment_enabled: bool = False) -> None:
        self._llm_client = llm_client
        self._llm_enrichment_enabled = llm_enrichment_enabled
        self._catalog = list_resources()
        self._resource_map = {resource.resource_id: resource for resource in self._catalog}

    def _rule_select(self, concept: str, limit: int = 3) -> list[FreeResource]:
        matched = [
            resource
            for resource in self._catalog
            if resource.is_free and any(tag.lower() == concept.lower() for tag in resource.concept_tags)
        ]
        if len(matched) < limit:
            broad = [
                resource
                for resource in self._catalog
                if resource.is_free
                and any(concept.lower() in tag.lower() or tag.lower() in concept.lower() for tag in resource.concept_tags)
            ]
            for item in broad:
                if item.resource_id not in {resource.resource_id for resource in matched}:
                    matched.append(item)

        if len(matched) < limit:
            for item in self._catalog:
                if item.is_free and item.resource_id not in {resource.resource_id for resource in matched}:
                    matched.append(item)
                if len(matched) >= limit:
                    break
        return [resource.model_copy(deep=True) for resource in matched[:limit]]

    async def recommend_resources(self, gap_report: GapAnalysisReport) -> dict[str, list[FreeResource]]:
        concepts = [item.concept for item in gap_report.weak_concepts]
        baseline = {concept: self._rule_select(concept) for concept in concepts}

        if self._llm_enrichment_enabled:
            def fallback_payload() -> LLMResourceSelectionPayload:
                return LLMResourceSelectionPayload(
                    selections=[
                        {
                            "concept": concept,
                            "resource_ids": [resource.resource_id for resource in resources],
                            "rationale": "rule-based",
                        }
                        for concept, resources in baseline.items()
                    ]
                )

            llm_selection = await self._llm_client.invoke_structured(
                system_prompt=load_prompt("resource_agent"),
                user_prompt=(
                    f"Weak concepts: {concepts}\n"
                    f"Resource catalog IDs: {[item.resource_id for item in self._catalog]}\n"
                    "Select up to 3 resources per concept and prioritize pedagogical order."
                ),
                output_model=LLMResourceSelectionPayload,
                fallback_factory=fallback_payload,
                max_retries=0,
            )
        else:
            llm_selection = LLMResourceSelectionPayload(
                selections=[
                    {
                        "concept": concept,
                        "resource_ids": [resource.resource_id for resource in resources],
                        "rationale": "rule-based",
                    }
                    for concept, resources in baseline.items()
                ]
            )

        recommended: dict[str, list[FreeResource]] = {}
        for concept in concepts:
            recommended[concept] = baseline.get(concept, [])

        for selection in llm_selection.selections:
            concept = selection.concept
            if concept not in recommended:
                continue
            chosen: list[FreeResource] = []
            for resource_id in selection.resource_ids:
                resource = self._resource_map.get(resource_id)
                if resource and resource.is_free:
                    chosen.append(resource.model_copy(deep=True))
                if len(chosen) >= 3:
                    break
            if chosen:
                recommended[concept] = chosen

        logger.info("Resource recommendations completed | concepts=%s", len(recommended))
        return recommended
