import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT


def generate_clinical_pdf(prediction_record):
    """
    Generates a high-quality clinical decision support PDF report using ReportLab,
    supporting the Data Dictionary schema (Prediction, MedicalAssessment, Patient, User).
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

    styles = getSampleStyleSheet()

    # Brand Colors
    PRIMARY = colors.HexColor('#1e40af')
    MUTED = colors.HexColor('#475569')
    DARK_TEXT = colors.HexColor('#0f172a')
    LIGHT_BG = colors.HexColor('#f8fafc')
    BORDER_COLOR = colors.HexColor('#cbd5e1')

    # Extract schema attributes whether Prediction or PredictionRecord
    if hasattr(prediction_record, 'assessment_id'):
        # Data Dictionary Schema
        assessment = prediction_record.assessment_id
        patient_obj = assessment.patient_id
        patient_user = patient_obj.user_id
        report_id_num = prediction_record.prediction_id
        created_at_dt = prediction_record.prediction_date
        patient_name = patient_user.full_name or patient_user.get_full_name() or patient_user.username
        patient_id_str = f"PID-{patient_obj.patient_id:05d}"
        patient_age = patient_obj.age
        patient_gender = patient_obj.gender
        patient_contact = patient_user.phone or patient_user.email
        model_name = prediction_record.model_name
        prob_pct = round(prediction_record.risk_score, 1)
        risk_level = prediction_record.risk_level
        doctor_notes = prediction_record.doctor_notes or "Physician review completed. Decision support criteria applied."

        trestbps_val = assessment.resting_bp
        chol_val = assessment.cholesterol
        fbs_val = "Elevated (>120)" if assessment.fasting_bs else "Normal (<=120)"
        restecg_val = str(assessment.resting_ecg)
        thalach_val = assessment.max_heart_rate
        exang_val = "Positive (Yes)" if assessment.exercise_angina else "Negative (No)"
        oldpeak_val = assessment.oldpeak
        slope_val = str(assessment.st_slope)
        ca_val = assessment.vessels
        thal_val = str(assessment.thalassemia)

        factors = [
            {
                'name': e.feature_name,
                'value': e.feature_value,
                'shap_value': e.contribution,
                'impact': 'increases_risk' if e.contribution > 0 else 'decreases_risk'
            }
            for e in prediction_record.explanations.all()
        ]

        rec_obj = prediction_record.recommendations_set.first()
        recommendations = [
            {'category': 'Dietary Guidance', 'text': rec_obj.diet_advice if rec_obj else 'Adhere to DASH dietary patterns and maintain sodium restriction.'},
            {'category': 'Physical Activity', 'text': rec_obj.exercise_advice if rec_obj else 'Perform 150 minutes of moderate aerobic activity weekly.'},
            {'category': 'Lifestyle Modifications', 'text': rec_obj.lifestyle_advice if rec_obj else 'Maintain 7-8 hours sleep, stress reduction, and smoke-free lifestyle.'},
            {'category': 'Clinical Care', 'text': rec_obj.medical_advice if rec_obj else 'Routine ambulatory review and cardiology consultation as advised.'},
        ]
    else:
        # Legacy/Fallback
        patient_user = prediction_record.patient
        report_id_num = prediction_record.id
        created_at_dt = prediction_record.created_at
        patient_name = patient_user.get_full_name() or patient_user.username
        patient_id_str = f"PID-{patient_user.id:05d}"
        patient_age = prediction_record.age
        patient_gender = 'Male' if prediction_record.sex == 1 else 'Female'
        patient_contact = patient_user.phone_number or patient_user.email
        model_name = prediction_record.model_used.name if prediction_record.model_used else "Ensemble Model"
        prob_pct = round(prediction_record.probability * 100, 1)
        risk_level = prediction_record.risk_level
        doctor_notes = prediction_record.doctor_notes or "Baseline automated decision support criteria applied."

        trestbps_val = prediction_record.trestbps
        chol_val = prediction_record.chol
        fbs_val = "Elevated (>120)" if prediction_record.fbs == 1 else "Normal (<=120)"
        restecg_val = str(prediction_record.restecg)
        thalach_val = prediction_record.thalach
        exang_val = "Positive (Yes)" if prediction_record.exang == 1 else "Negative (No)"
        oldpeak_val = prediction_record.oldpeak
        slope_val = str(prediction_record.slope)
        ca_val = prediction_record.ca
        thal_val = str(prediction_record.thal)
        factors = prediction_record.top_factors or []
        recommendations = prediction_record.recommendations or []

    # Risk Styling
    if risk_level == 'Low':
        RISK_COLOR = colors.HexColor('#16a34a')
        RISK_BG = colors.HexColor('#f0fdf4')
    elif risk_level == 'Moderate':
        RISK_COLOR = colors.HexColor('#d97706')
        RISK_BG = colors.HexColor('#fffbeb')
    else:
        RISK_COLOR = colors.HexColor('#dc2626')
        RISK_BG = colors.HexColor('#fef2f2')

    # Typography
    title_style = ParagraphStyle('DocTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=PRIMARY)
    section_heading = ParagraphStyle('SectionHeading', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, leading=15, textColor=PRIMARY, spaceAfter=5)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=12, textColor=DARK_TEXT)
    table_cell = ParagraphStyle('TableCell', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=10, textColor=DARK_TEXT)
    table_cell_bold = ParagraphStyle('TableCellBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=DARK_TEXT)
    disclaimer_style = ParagraphStyle('Disclaimer', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=7.5, leading=10, textColor=MUTED, alignment=TA_CENTER)

    story = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>HEARTSENSE AI</b><br/><font size=8 color='#0284c7'>CLINICAL DECISION SUPPORT SYSTEM</font>", title_style),
            Paragraph(f"<b>Report ID:</b> HS-{report_id_num:06d}<br/><b>Generated:</b> {created_at_dt.strftime('%b %d, %Y %H:%M')}<br/><b>Status:</b> Verified Analysis", ParagraphStyle('HRight', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=11, alignment=TA_RIGHT, textColor=MUTED))
        ]
    ]
    header_table = Table(header_data, colWidths=[3.8*inch, 3.7*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=10))

    # 2. Patient Demographics & Clinical Context
    pat_info = f"""
    <b>Patient Name:</b> {patient_name}<br/>
    <b>Patient ID:</b> {patient_id_str}<br/>
    <b>Age / Gender:</b> {patient_age} yrs / {patient_gender}<br/>
    <b>Contact:</b> {patient_contact}
    """

    doc_info = f"""
    <b>Reviewing System:</b> HeartSense Digital CDSS<br/>
    <b>Active ML Model:</b> {model_name}<br/>
    <b>Verification Protocol:</b> Calibrated on UCI Cleveland Cardiac Dataset<br/>
    <b>Decision Class:</b> Multi-Factor Risk Assessment
    """

    meta_table_data = [
        [Paragraph("<b>PATIENT DEMOGRAPHICS</b>", section_heading), Paragraph("<b>CLINICAL EVALUATION CONTEXT</b>", section_heading)],
        [Paragraph(pat_info, body_style), Paragraph(doc_info, body_style)]
    ]
    meta_table = Table(meta_table_data, colWidths=[3.75*inch, 3.75*inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # 3. Stratified Risk Banner
    risk_summary_text = f"""
    <font size=13 color='{RISK_COLOR.hexval()}'><b>STRATIFIED CARDIAC RISK: {risk_level.upper()} ({prob_pct}%)</b></font><br/>
    <font size=8.5 color='#334155'>Multi-parameter statistical evaluation of coronary artery disease indicators.</font>
    """
    risk_box = Table([[Paragraph(risk_summary_text, body_style)]], colWidths=[7.5*inch])
    risk_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), RISK_BG),
        ('BOX', (0, 0), (-1, -1), 1.5, RISK_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(risk_box)
    story.append(Spacer(1, 12))

    # 4. Biomarkers Table
    story.append(Paragraph("<b>RECORDED CLINICAL BIOMARKERS</b>", section_heading))
    biomarkers = [
        ["Parameter", "Observed Value", "Reference Range", "Evaluation"],
        ["Resting Blood Pressure", f"{int(trestbps_val)} mmHg", "< 120 mmHg", "Stage 1/2 HTN" if trestbps_val >= 130 else "Normal"],
        ["Serum Cholesterol", f"{int(chol_val)} mg/dL", "< 200 mg/dL", "Elevated" if chol_val >= 240 else ("Borderline" if chol_val >= 200 else "Optimal")],
        ["Fasting Blood Sugar", str(fbs_val), "<= 120 mg/dL", "Diabetic Risk" if "Elevated" in str(fbs_val) else "Normal"],
        ["Resting ECG", str(restecg_val), "Normal (0)", "Abnormal" if str(restecg_val) not in ['0', 'Normal'] else "Normal"],
        ["Peak Heart Rate (thalach)", f"{int(thalach_val)} bpm", "130 - 180 bpm", "Sub-optimal" if thalach_val < 125 else "Adequate"],
        ["Exercise Angina", str(exang_val), "Negative", "Ischemia Marker" if "Yes" in str(exang_val) else "Normal"],
        ["ST Depression (oldpeak)", f"{oldpeak_val:.1f} mm", "< 1.0 mm", "Significant" if oldpeak_val >= 1.5 else "Normal"],
        ["ST Slope", str(slope_val), "Upsloping (0)", "Abnormal" if str(slope_val) not in ['0', 'Upsloping'] else "Normal"],
        ["Fluoroscopy Vessels", f"{ca_val} vessel(s)", "0 vessels", "Vessel Calcification" if ca_val > 0 else "Clear"],
        ["Thalassemia Scan", str(thal_val), "Normal", "Perfusion Defect" if str(thal_val) not in ['1', 'Normal'] else "Normal"],
    ]

    bio_rows = []
    for i, row in enumerate(biomarkers):
        if i == 0:
            bio_rows.append([Paragraph(f"<b>{c}</b>", table_cell_bold) for c in row])
        else:
            bio_rows.append([Paragraph(str(c), table_cell) for c in row])

    bio_table = Table(bio_rows, colWidths=[2.2*inch, 1.8*inch, 1.7*inch, 1.8*inch])
    bio_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(bio_table)
    story.append(Spacer(1, 10))

    # 5. Explainable AI Factors
    if factors:
        story.append(Paragraph("<b>EXPLAINABLE AI: TOP CONTRIBUTING FACTORS (SHAP)</b>", section_heading))
        factor_items = []
        for f in factors[:4]:
            impact_text = "[+ Increases Risk]" if f.get('impact') == 'increases_risk' or f.get('shap_value', 0) > 0 else "[- Decreases Risk]"
            color_tag = "color='#dc2626'" if "[+ Increases" in impact_text else "color='#16a34a'"
            factor_items.append(f"• <b>{f.get('name')}:</b> Value = {f.get('value')} | <font {color_tag}><b>{impact_text} (Score: {abs(f.get('shap_value', 0)):.3f})</b></font>")
        story.append(Paragraph("<br/>".join(factor_items), body_style))
        story.append(Spacer(1, 8))

    # 6. Clinical Recommendations & Doctor Notes
    story.append(Paragraph("<b>CLINICAL IMPRESSION & RECOMMENDATIONS</b>", section_heading))
    rec_texts = [f"• <b>[{r.get('category')}]:</b> {r.get('text')}" for r in recommendations]
    doc_block_text = f"<b>Attending Physician Impressions:</b><br/>{doctor_notes}<br/><br/><b>Standard Clinical Guidelines:</b><br/>" + "<br/>".join(rec_texts)

    notes_box = Table([[Paragraph(doc_block_text, body_style)]], colWidths=[7.5*inch])
    notes_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(notes_box)
    story.append(Spacer(1, 10))

    # 7. Mandatory Disclaimer Footer
    story.append(HRFlowable(width="100%", thickness=0.8, color=BORDER_COLOR, spaceAfter=6))
    disclaimer_text = """
    <b>MANDATORY CLINICAL WARNING:</b> HeartSense AI provides educational decision-support estimates and is not a substitute for professional medical diagnosis or treatment.
    All therapeutic interventions, diagnostic procedures, and prescriptions must be independently validated by a qualified medical professional according to established clinical practice guidelines.
    Feature attributions (SHAP) represent statistical model weights and do not constitute biological proof of medical causation.
    """
    story.append(Paragraph(disclaimer_text, disclaimer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer
