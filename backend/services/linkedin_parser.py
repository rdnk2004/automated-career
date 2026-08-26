import zipfile
import csv
import io
from typing import Dict, List, Any
from datetime import datetime

def normalize_date(date_str: str) -> str:
    """
    Attempts to normalize common LinkedIn date formats to YYYY-MM-DD or YYYY-MM.
    If it fails or is empty, returns the original string.
    """
    if not date_str:
        return ""
    
    date_str = date_str.strip()
    
    formats = [
        "%b %Y",       # Jan 2020
        "%B %Y",       # January 2020
        "%Y",          # 2020
        "%Y-%m-%d",    # 2020-01-01
        "%m/%d/%Y",    # 01/01/2020
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
            
    return date_str

def parse_csv_content(csv_bytes: bytes) -> List[Dict[str, str]]:
    """Parse raw CSV bytes into a list of dictionaries with encoding fallbacks."""
    for encoding in ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252']:
        try:
            text = csv_bytes.decode(encoding)
            reader = csv.DictReader(io.StringIO(text))
            rows = [row for row in reader if row]
            if rows:
                return rows
        except Exception:
            continue
    return []

def parse_zip(zip_bytes: bytes) -> Dict[str, Any]:
    """
    Parse a LinkedIn export ZIP file and extract all key CSVs.
    """
    result = {
        "profile": {},
        "positions": [],
        "education": [],
        "skills": [],
        "certifications": [],
        "projects": [],
        "volunteer": [],
        "honors": [],
        "languages": [],
        "publications": []
    }
    
    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
            file_names = z.namelist()
            
            for file_name in file_names:
                lower_name = file_name.lower()
                
                if lower_name.endswith("profile.csv"):
                    rows = parse_csv_content(z.read(file_name))
                    if rows:
                        row = rows[0]
                        result["profile"] = {
                            "headline": row.get("Headline", ""),
                            "summary": row.get("Summary", ""),
                            "location": row.get("Location", ""),
                            "linkedin_url": row.get("Profile Link", "") or row.get("Websites", "")
                        }
                        
                elif lower_name.endswith("positions.csv"):
                    rows = parse_csv_content(z.read(file_name))
                    for row in rows:
                        result["positions"].append({
                            "title": row.get("Title", ""),
                            "company": row.get("Company Name", ""),
                            "description": row.get("Description", ""),
                            "location": row.get("Location", ""),
                            "start_date": normalize_date(row.get("Started On", "")),
                            "end_date": normalize_date(row.get("Finished On", ""))
                        })
                        
                elif lower_name.endswith("education.csv"):
                    rows = parse_csv_content(z.read(file_name))
                    for row in rows:
                        result["education"].append({
                            "school": row.get("School Name", ""),
                            "degree": row.get("Degree Name", ""),
                            "field": row.get("Notes", "") or row.get("Field of Study", ""),
                            "start_date": normalize_date(row.get("Start Date", "")),
                            "end_date": normalize_date(row.get("End Date", ""))
                        })
                        
                elif lower_name.endswith("skills.csv"):
                    rows = parse_csv_content(z.read(file_name))
                    for row in rows:
                        if row.get("Name"):
                            result["skills"].append({"name": row.get("Name")})
                            
                elif lower_name.endswith("certifications.csv"):
                    rows = parse_csv_content(z.read(file_name))
                    for row in rows:
                        result["certifications"].append({
                            "name": row.get("Name", ""),
                            "authority": row.get("Authority", ""),
                            "url": row.get("Url", ""),
                            "date": normalize_date(row.get("Started On", ""))
                        })

                elif lower_name.endswith("projects.csv"):
                    rows = parse_csv_content(z.read(file_name))
                    for row in rows:
                        result["projects"].append({
                            "title": row.get("Title", "") or row.get("Name", ""),
                            "description": row.get("Description", ""),
                            "url": row.get("Url", ""),
                            "start_date": normalize_date(row.get("Started On", "")),
                            "end_date": normalize_date(row.get("Finished On", ""))
                        })

                elif lower_name.endswith("volunteer.csv") or "volunteering" in lower_name:
                    rows = parse_csv_content(z.read(file_name))
                    for row in rows:
                        result["volunteer"].append({
                            "role": row.get("Role", "") or row.get("Title", ""),
                            "organization": row.get("Organization", "") or row.get("Company Name", ""),
                            "cause": row.get("Cause", ""),
                            "description": row.get("Description", ""),
                            "start_date": normalize_date(row.get("Started On", "")),
                            "end_date": normalize_date(row.get("Finished On", ""))
                        })

                elif lower_name.endswith("honors.csv") or "awards" in lower_name:
                    rows = parse_csv_content(z.read(file_name))
                    for row in rows:
                        result["honors"].append({
                            "title": row.get("Title", "") or row.get("Name", ""),
                            "issuer": row.get("Issuer", "") or row.get("Authority", ""),
                            "description": row.get("Description", ""),
                            "date": normalize_date(row.get("Issued On", ""))
                        })
                        
                elif lower_name.endswith("languages.csv"):
                    rows = parse_csv_content(z.read(file_name))
                    for row in rows:
                        if row.get("Name"):
                            result["languages"].append({
                                "name": row.get("Name", ""),
                                "proficiency": row.get("Proficiency", "")
                            })

                elif lower_name.endswith("publications.csv"):
                    rows = parse_csv_content(z.read(file_name))
                    for row in rows:
                        result["publications"].append({
                            "name": row.get("Name", "") or row.get("Title", ""),
                            "publisher": row.get("Publisher", ""),
                            "description": row.get("Description", ""),
                            "date": normalize_date(row.get("Published On", ""))
                        })
                            
    except zipfile.BadZipFile:
        pass
        
    return result

def to_profile_sections(parsed: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Convert the parsed dictionary into a list of section dicts ready for DB insert.
    Consolidates items by category (e.g. all certifications in one certifications section).
    """
    sections = []
    
    if parsed.get("profile"):
        prof = parsed["profile"]
        if prof.get("headline"):
            sections.append({
                "section_type": "headline",
                "title": "Headline",
                "content": {
                    "headline": prof["headline"],
                    "location": prof.get("location", ""),
                    "linkedin_url": prof.get("linkedin_url", "")
                }
            })
        if prof.get("summary"):
            sections.append({
                "section_type": "about",
                "title": "Summary",
                "content": {
                    "summary": prof["summary"],
                    "text": prof["summary"]
                }
            })
            
    if parsed.get("positions"):
        sections.append({
            "section_type": "experience",
            "title": "Work Experience",
            "content": {"positions": parsed["positions"]}
        })
        
    if parsed.get("education"):
        sections.append({
            "section_type": "education",
            "title": "Education",
            "content": {"education": parsed["education"]}
        })

    if parsed.get("certifications"):
        sections.append({
            "section_type": "certifications",
            "title": "Certifications & Licenses",
            "content": {"certifications": parsed["certifications"]}
        })

    if parsed.get("projects"):
        sections.append({
            "section_type": "projects",
            "title": "Projects",
            "content": {"projects": parsed["projects"]}
        })
        
    if parsed.get("skills"):
        sections.append({
            "section_type": "skills",
            "title": "Skills",
            "content": {"skills": parsed["skills"]}
        })

    if parsed.get("volunteer"):
        sections.append({
            "section_type": "volunteer",
            "title": "Volunteering Experience",
            "content": {"volunteer": parsed["volunteer"]}
        })

    if parsed.get("honors"):
        sections.append({
            "section_type": "awards",
            "title": "Honors & Awards",
            "content": {"awards": parsed["honors"]}
        })

    if parsed.get("languages"):
        sections.append({
            "section_type": "languages",
            "title": "Languages",
            "content": {"languages": parsed["languages"]}
        })
        
    return sections
