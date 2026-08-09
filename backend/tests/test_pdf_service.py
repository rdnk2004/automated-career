import pytest
from services.pdf_service import pdf_export_service

def test_generate_resume_pdf_valid_binary():
    """Verify that PDFExportService produces valid PDF bytes starting with %PDF- header."""
    resume_data = {
        "name": "Jane Doe",
        "target_role": "Senior AI Engineer",
        "contact": {
            "email": "jane.doe@example.com",
            "phone": "+1-555-0199",
            "location": "San Francisco, CA",
            "linkedin": "linkedin.com/in/janedoe",
            "github": "github.com/janedoe"
        },
        "summary": "Accomplished AI & Software Engineer with 6+ years of experience building scalable LLM pipelines.",
        "skills": ["Python", "FastAPI", "PyTorch", "Docker", "PostgreSQL", "React"],
        "experience": [
            {
                "title": "Lead AI Engineer",
                "company": "Tech Corp",
                "dates": "2022 - Present",
                "bullets": [
                    "Architected high-throughput RAG pipeline handling 10k requests/min with sub-200ms latency.",
                    "Optimized model inference using TensorRT, reducing cloud compute costs by 35%."
                ]
            }
        ],
        "education": [
            {
                "degree": "B.S. in Computer Science",
                "school": "University of California, Berkeley",
                "dates": "2016 - 2020"
            }
        ],
        "certifications": ["AWS Certified Machine Learning - Specialty"]
    }

    pdf_bytes = pdf_export_service.generate_resume_pdf(resume_data)
    
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000, "PDF output should contain content bytes"
    assert pdf_bytes.startswith(b"%PDF-"), "PDF header magic bytes should start with %PDF-"
