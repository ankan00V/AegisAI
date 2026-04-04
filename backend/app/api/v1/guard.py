"""
LLM Guard API — exposes prompt injection scanning as a REST endpoint.
Copyright (C) 2024 Sarthak Doshi (github.com/SdSarthak)
SPDX-License-Identifier: AGPL-3.0-only

TODO for contributors (medium difficulty):
  - Add per-user rate limiting on POST /guard/scan
  - Persist scan results to the database for audit logs
  - Add a GET /guard/stats endpoint returning block/allow/sanitize counts
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


class ScanRequest(BaseModel):
    prompt: str


class ScanResponse(BaseModel):
    decision: str          # "allow" | "sanitize" | "block"
    confidence: float
    reasoning: str
    sanitized_prompt: str | None = None
    matched_patterns: list[str] = []


@router.post("/scan", response_model=ScanResponse)
def scan_prompt(
    request: ScanRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Scan a prompt for injection risks.
    Returns a decision: allow, sanitize, or block.
    """
    try:
        from app.modules.guard.llm_guard import LLMGuard
        from app.modules.guard.sanitizer import SanitizationLevel
        from app.core.config import settings

        level_map = {
            "low": SanitizationLevel.LOW,
            "medium": SanitizationLevel.MEDIUM,
            "high": SanitizationLevel.HIGH,
        }
        san_level = level_map.get(settings.GUARD_SANITIZATION_LEVEL, SanitizationLevel.MEDIUM)
        guard = LLMGuard(sanitization_level=san_level)
        result = guard.guard(request.prompt)

        return ScanResponse(
            decision=result["decision"],
            confidence=result["metadata"]["decision_reasoning"]["confidence"],
            reasoning=result["metadata"]["decision_reasoning"]["reasoning"],
            sanitized_prompt=None,
            matched_patterns=result["metadata"]["regex_analysis"].get("matched_patterns", []),
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/health", tags=["LLM Guard"])
def guard_health():
    """Check if the Guard module is available."""
    return {"module": "llm_guard", "status": "available"}
