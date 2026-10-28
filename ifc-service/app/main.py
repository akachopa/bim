from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .export_ifc import document_to_ifc
from .import_ifc import parse_ifc_summary
from .mapper import summarize_document
from .validate_ifc import validate_document

app = FastAPI(title="BIM IFC Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class DocumentPayload(BaseModel):
    job_id: str | None = None
    document: dict = Field(default_factory=dict)
    ifc_text: str | None = None


@app.get("/health")
def health() -> dict:
    return {"ok": True, "service": "ifc"}


@app.post("/export")
def export_ifc(payload: DocumentPayload) -> dict:
    ifc = document_to_ifc(payload.document)
    summary = summarize_document(payload.document)
    return {"job_id": payload.job_id, "status": "completed", "ifc": ifc, "summary": summary}


@app.post("/import")
def import_ifc(payload: DocumentPayload) -> dict:
    summary = parse_ifc_summary(payload.ifc_text or "")
    return {"job_id": payload.job_id, "status": "completed", "summary": summary}


@app.post("/validate")
def validate(payload: DocumentPayload) -> dict:
    return validate_document(payload.document)
