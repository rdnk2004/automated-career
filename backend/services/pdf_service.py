import io
from typing import Dict, List, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    ListFlowable,
    ListItem
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY


class PDFExportService:
    def __init__(self):
        self.styles = getSampleStyleSheet()

    def _create_styles(self) -> Dict[str, ParagraphStyle]:
        """Build ATS-friendly typography styles using standard Helvetica fonts."""
        styles = {
            "Name": ParagraphStyle(
                "ATS_Name",
                parent=self.styles["Normal"],
                fontName="Helvetica-Bold",
                fontSize=20,
                leading=24,
                textColor=colors.HexColor("#1A202C"),
                alignment=TA_CENTER,
                spaceAfter=4,
            ),
            "ContactInfo": ParagraphStyle(
                "ATS_ContactInfo",
                parent=self.styles["Normal"],
                fontName="Helvetica",
                fontSize=9,
                leading=12,
                textColor=colors.HexColor("#4A5568"),
                alignment=TA_CENTER,
                spaceAfter=10,
            ),
            "SectionHeader": ParagraphStyle(
                "ATS_SectionHeader",
                parent=self.styles["Normal"],
                fontName="Helvetica-Bold",
                fontSize=12,
                leading=15,
                textColor=colors.HexColor("#1A202C"),
                spaceBefore=10,
                spaceAfter=4,
                keepWithNext=True,
            ),
            "JobTitle": ParagraphStyle(
                "ATS_JobTitle",
                parent=self.styles["Normal"],
                fontName="Helvetica-Bold",
                fontSize=10,
                leading=13,
                textColor=colors.HexColor("#2D3748"),
                spaceAfter=2,
                keepWithNext=True,
            ),
            "SubHeader": ParagraphStyle(
                "ATS_SubHeader",
                parent=self.styles["Normal"],
                fontName="Helvetica-Oblique",
                fontSize=9,
                leading=12,
                textColor=colors.HexColor("#4A5568"),
                spaceAfter=4,
                keepWithNext=True,
            ),
            "Body": ParagraphStyle(
                "ATS_Body",
                parent=self.styles["Normal"],
                fontName="Helvetica",
                fontSize=9.5,
                leading=13.5,
                textColor=colors.HexColor("#2D3748"),
                alignment=TA_JUSTIFY,
                spaceAfter=4,
            ),
            "Bullet": ParagraphStyle(
                "ATS_Bullet",
                parent=self.styles["Normal"],
                fontName="Helvetica",
                fontSize=9.5,
                leading=13.5,
                textColor=colors.HexColor("#2D3748"),
                leftIndent=12,
                spaceAfter=3,
            ),
        }
        return styles

    def generate_resume_pdf(self, resume_data: Dict[str, Any]) -> bytes:
        """
        Generates a clean, single-page ATS-compliant PDF binary stream.
        
        Expected resume_data structure:
        {
            "name": str,
            "target_role": str,
            "contact": {"email": str, "phone": str, "location": str, "linkedin": str, "github": str},
            "summary": str,
            "experience": [{"title": str, "company": str, "dates": str, "bullets": [str]}],
            "skills": [str],
            "education": [{"degree": str, "school": str, "dates": str}],
            "certifications": [str]
        }
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = self._create_styles()
        story = []

        # 1. Header (Name & Contact Details)
        name = resume_data.get("name") or "Candidate Resume"
        story.append(Paragraph(name, styles["Name"]))

        contact_parts = []
        c_data = resume_data.get("contact", {})
        if c_data.get("email"):
            contact_parts.append(c_data["email"])
        if c_data.get("phone"):
            contact_parts.append(c_data["phone"])
        if c_data.get("location"):
            contact_parts.append(c_data["location"])
        if c_data.get("linkedin"):
            contact_parts.append(c_data["linkedin"])
        if c_data.get("github"):
            contact_parts.append(c_data["github"])

        contact_str = "  •  ".join(contact_parts) if contact_parts else resume_data.get("target_role", "")
        if contact_str:
            story.append(Paragraph(contact_str, styles["ContactInfo"]))

        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E0"), spaceAfter=8))

        # 2. Professional Summary
        summary = resume_data.get("summary")
        if summary:
            story.append(Paragraph("PROFESSIONAL SUMMARY", styles["SectionHeader"]))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"), spaceAfter=4))
            story.append(Paragraph(summary, styles["Body"]))
            story.append(Spacer(1, 6))

        # 3. Core Technical Skills
        skills = resume_data.get("skills", [])
        if skills:
            story.append(Paragraph("CORE SKILLS & TECHNOLOGIES", styles["SectionHeader"]))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"), spaceAfter=4))
            skills_str = " • ".join(skills) if isinstance(skills, list) else str(skills)
            story.append(Paragraph(skills_str, styles["Body"]))
            story.append(Spacer(1, 6))

        # 4. Professional Experience
        experience = resume_data.get("experience", [])
        if experience:
            story.append(Paragraph("PROFESSIONAL EXPERIENCE", styles["SectionHeader"]))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"), spaceAfter=4))
            
            for item in experience:
                title = item.get("title", "")
                company = item.get("company", "")
                dates = item.get("dates", "")
                
                header_line = f"<b>{title}</b> — {company}"
                if dates:
                    header_line = f"<font color='#1A202C'><b>{title}</b></font> | {company} <font color='#718096'>({dates})</font>"
                
                story.append(Paragraph(header_line, styles["JobTitle"]))
                
                bullets = item.get("bullets", [])
                if isinstance(bullets, str):
                    bullets = [b.strip() for b in bullets.split("\n") if b.strip()]
                    
                for b in bullets:
                    cleaned_b = b.lstrip("-•* ").strip()
                    if cleaned_b:
                        story.append(Paragraph(f"• {cleaned_b}", styles["Bullet"]))
                story.append(Spacer(1, 4))

        # 5. Education
        education = resume_data.get("education", [])
        if education:
            story.append(Spacer(1, 4))
            story.append(Paragraph("EDUCATION", styles["SectionHeader"]))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"), spaceAfter=4))
            for edu in education:
                degree = edu.get("degree", "")
                school = edu.get("school", "")
                dates = edu.get("dates", "")
                edu_str = f"<b>{degree}</b> — {school}" + (f" ({dates})" if dates else "")
                story.append(Paragraph(edu_str, styles["Body"]))

        # 6. Certifications
        certs = resume_data.get("certifications", [])
        if certs:
            story.append(Spacer(1, 4))
            story.append(Paragraph("CERTIFICATIONS", styles["SectionHeader"]))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"), spaceAfter=4))
            certs_str = " • ".join(certs) if isinstance(certs, list) else str(certs)
            story.append(Paragraph(certs_str, styles["Body"]))

        # Build Document
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes


pdf_export_service = PDFExportService()
