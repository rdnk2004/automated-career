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
    """Parse raw CSV bytes into a list of dictionaries."""
    try:
        text = csv_bytes.decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(text))
        return [row for row in reader]
    except Exception:
        return []

def parse_zip(zip_bytes: bytes) -> Dict[str, Any]:
    """
    Parse a LinkedIn export ZIP file and extract key CSVs.
    """
    result = {
        "profile": {},
        "positions": [],
        "education": [],
        "skills": [],
        "certifications": [],
        "languages": []
    }
    
    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
            # We look for files that end with these names to be defensive against folder structures in the ZIP
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
                            "linkedin_url": row.get("Profile Link", "")
                        }
                        
                elif lower_name.endswith("positions.csv"):
                    rows = parse_csv_content(z.read(file_name))
                    for row in rows:
                        result["positions"].append({
                            "title": row.get("Title", ""),
                            "company": row.get("Company Name", ""),
                            "description": row.get("Description", ""),
                            "start_date": normalize_date(row.get("Started On", "")),
                            "end_date": normalize_date(row.get("Finished On", ""))
                        })
                        
                elif lower_name.endswith("education.csv"):
                    rows = parse_csv_content(z.read(file_name))
                    for row in rows:
                        result["education"].append({
                            "school": row.get("School Name", ""),
                            "degree": row.get("Degree Name", ""),
                            "field": row.get("Notes", ""), # LinkedIn often puts field of study in Notes
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
                            "date": normalize_date(row.get("Started On", ""))
                        })
                        
                elif lower_name.endswith("languages.csv"):
                    rows = parse_csv_content(z.read(file_name))
                    for row in rows:
                        if row.get("Name"):
                            result["languages"].append({
                                "name": row.get("Name", ""),
                                "proficiency": row.get("Proficiency", "")
                            })
                            
    except zipfile.BadZipFile:
        # If it's not a valid zip, we just return empty structures
        pass
        
    return result

def to_profile_sections(parsed: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Convert the parsed dictionary into a list of section dicts ready for DB insert.
    """
    sections = []
    
    if parsed.get("profile"):
        prof = parsed["profile"]
        if prof.get("headline"):
            sections.append({
                "section_type": "headline",
                "title": "Headline",
                "content": {"text": prof["headline"]}
            })
        if prof.get("summary"):
            sections.append({
                "section_type": "about",
                "title": "About",
                "content": {"text": prof["summary"]}
            })
            
    for idx, pos in enumerate(parsed.get("positions", [])):
        sections.append({
            "section_type": "experience",
            "title": pos.get("title", f"Experience {idx+1}"),
            "content": pos
        })
        
    for idx, edu in enumerate(parsed.get("education", [])):
        sections.append({
            "section_type": "education",
            "title": edu.get("degree") or edu.get("school") or f"Education {idx+1}",
            "content": edu
        })
        
    if parsed.get("skills"):
        sections.append({
            "section_type": "skills",
            "title": "Skills",
            "content": {"skills": parsed["skills"]}
        })
        
    for idx, cert in enumerate(parsed.get("certifications", [])):
        sections.append({
            "section_type": "certifications",
            "title": cert.get("name", f"Certification {idx+1}"),
            "content": cert
        })
        
    return sections
