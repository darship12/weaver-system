"""
payslip_generator.py
──────────────────────────────────────────────────────────────
Generates a professional PDF payslip for a Salary instance.
Returns raw bytes — caller writes to HttpResponse or file.

Usage:
    from .payslip_generator import generate_payslip_pdf
    pdf_bytes = generate_payslip_pdf(salary_obj)
"""
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.platypus import Table, TableStyle

# ── Palette ───────────────────────────────────────────────────
NAVY     = HexColor("#0A1628")
AMBER    = HexColor("#D97706")
GREEN    = HexColor("#15803D")
RED      = HexColor("#B91C1C")
SLATE    = HexColor("#475569")
SLATE_LT = HexColor("#94A3B8")
RULE     = HexColor("#CBD5E1")
WHITE    = colors.white
DARK     = HexColor("#1E293B")

W, H = A4
MAR  = 18 * mm


# ── Helpers ──────────────────────────────────────────────────
def _inr(amount):
    n = int(amount)
    if n >= 1000:
        last3 = n % 1000
        rest  = n // 1000
        parts = [f"{last3:03d}"]
        while rest > 0:
            parts.append(f"{rest % 100:02d}" if rest >= 100 else str(rest))
            rest //= 100
        return f"Rs.{','.join(reversed(parts))}.00"
    return f"Rs.{n}.00"


def _hl(c, x1, y, x2, col=RULE, w=0.4):
    c.saveState(); c.setStrokeColor(col); c.setLineWidth(w)
    c.line(x1, y, x2, y); c.restoreState()


def _border(c, x, y, w, h, col=RULE, lw=0.5):
    c.saveState(); c.setStrokeColor(col); c.setLineWidth(lw)
    c.rect(x, y, w, h, fill=0, stroke=1); c.restoreState()


def _inr_words(n):
    """Very simple number-to-words for Indian amounts (up to lakhs)."""
    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
            'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
            'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
            'Sixty', 'Seventy', 'Eighty', 'Ninety']

    def words(num):
        if num == 0:
            return ''
        if num < 20:
            return ones[num]
        if num < 100:
            return tens[num // 10] + (f' {ones[num % 10]}' if num % 10 else '')
        if num < 1000:
            return ones[num // 100] + ' Hundred' + (f' and {words(num % 100)}' if num % 100 else '')
        if num < 100000:
            return words(num // 1000) + ' Thousand' + (f' {words(num % 1000)}' if num % 1000 else '')
        return words(num // 100000) + ' Lakh' + (f' {words(num % 100000)}' if num % 100000 else '')

    result = words(int(n))
    return f'({result} Rupees Only)' if result else '(Zero Rupees)'


# ── Main generator ───────────────────────────────────────────
def generate_payslip_pdf(salary) -> bytes:
    """
    salary : apps.salary.models.Salary instance
             (with related employee, lines, payments prefetched)
    Returns: PDF as bytes
    """
    buf = BytesIO()
    emp = salary.employee
    lines = list(salary.lines.all().order_by('date'))
    payments = list(salary.payments.all().order_by('paid_on'))

    c = canvas.Canvas(buf, pagesize=A4)
    c.setTitle(f"Payslip - {emp.name} - {salary.period_start} to {salary.period_end}")

    # ── 1. HEADER BAND ────────────────────────────────────────
    band_h = 22 * mm
    c.setFillColor(NAVY)
    c.rect(0, H - band_h, W, band_h, fill=1, stroke=0)

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(MAR, H - band_h / 2 + 3, "Weaver ETS")
    c.setFillColor(HexColor("#94A3B8"))
    c.setFont("Helvetica", 8)
    c.drawString(MAR, H - band_h / 2 - 7, "Saree Production Tracking System")

    payslip_id = f"WETS-{emp.employee_id}-{salary.period_end.strftime('%Y%m%d')}"
    c.setFillColor(HexColor("#94A3B8"))
    c.setFont("Helvetica", 7.5)
    c.drawRightString(W - MAR, H - band_h / 2 + 5, f"Payslip ID: {payslip_id}")
    c.drawRightString(W - MAR, H - band_h / 2 - 6,
                      f"Generated: {salary.updated_at.strftime('%d %b %Y') if hasattr(salary.updated_at, 'strftime') else 'Today'}")

    y = H - band_h - 8 * mm

    # ── 2. PERIOD ROW ─────────────────────────────────────────
    period_str = f"{salary.period_start.strftime('%d %b %Y')} \u2013 {salary.period_end.strftime('%d %b %Y')}"
    c.setFillColor(AMBER); c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MAR, y, "PAYSLIP FOR THE PERIOD")
    c.setFillColor(DARK); c.setFont("Helvetica-Bold", 9)
    c.drawString(MAR + 50 * mm, y, period_str)
    c.setFillColor(SLATE); c.setFont("Helvetica", 8.5)
    c.drawRightString(W - MAR, y, f"Pay Date: {salary.period_end.strftime('%d %b %Y')}")
    _hl(c, MAR, y - 3 * mm, W - MAR)

    y -= 8 * mm

    # ── 3. EMPLOYEE DETAILS + NET PAY ────────────────────────
    col_w = (W - 2 * MAR - 5 * mm) / 2
    box_h = 38 * mm

    _border(c, MAR, y - box_h, col_w, box_h)
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 8)
    c.drawString(MAR + 4 * mm, y - 5 * mm, "EMPLOYEE DETAILS")
    _hl(c, MAR + 4 * mm, y - 7 * mm, MAR + col_w - 4 * mm)

    emp_rows = [
        ("Employee Name",   emp.name),
        ("Employee ID",     emp.employee_id),
        ("Designation",     getattr(emp, 'designation', 'Saree Weaver')),
        ("Loom Type",       getattr(emp, 'loom_type', '-')),
        ("Skill Level",     getattr(emp, 'skill_level', '-')),
        ("Date of Joining", emp.date_of_joining.strftime('%d %b %Y') if hasattr(emp, 'date_of_joining') and emp.date_of_joining else '-'),
    ]
    for i, (lbl, val) in enumerate(emp_rows):
        ry = y - 12 * mm - i * 4.2 * mm
        c.setFillColor(SLATE_LT); c.setFont("Helvetica", 8)
        c.drawString(MAR + 4 * mm, ry, lbl)
        c.setFillColor(DARK); c.setFont("Helvetica-Bold", 8)
        c.drawString(MAR + 32 * mm, ry, str(val) if val else '-')

    rx = MAR + col_w + 5 * mm
    _border(c, rx, y - box_h, col_w, box_h)
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(rx + col_w / 2, y - 5 * mm, "EMPLOYEE NET PAY")
    _hl(c, rx + 4 * mm, y - 7 * mm, rx + col_w - 4 * mm)

    c.setFillColor(GREEN); c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(rx + col_w / 2, y - 20 * mm, _inr(salary.total_wage))

    c.setFillColor(SLATE); c.setFont("Helvetica", 7.5)
    c.drawCentredString(rx + col_w / 2, y - 26.5 * mm,
                        f"Paid: {_inr(salary.paid_amount)}   |   Balance: {_inr(salary.remaining_amount)}")

    sc = GREEN if salary.status == 'paid' else (AMBER if salary.status == 'partial' else RED)
    c.setFillColor(sc); c.setFont("Helvetica-Bold", 8.5)
    c.drawCentredString(rx + col_w / 2, y - 31.5 * mm, salary.get_status_display().upper())

    c.setFillColor(SLATE_LT); c.setFont("Helvetica", 7)
    c.drawCentredString(rx + col_w / 2, y - 35.5 * mm,
                        f"Total Sarees: {salary.total_sarees}  |  Week: {salary.period_start.strftime('%d %b')} - {salary.period_end.strftime('%d %b %Y')}")

    y -= box_h + 8 * mm

    # ── 4. PRODUCTION DETAILS ────────────────────────────────
    _hl(c, MAR, y, W - MAR, w=0.5)
    y -= 5 * mm
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 9.5)
    c.drawString(MAR, y, "Production Details")
    _hl(c, MAR, y - 1.5 * mm, MAR + 40 * mm, col=AMBER, w=1.5)
    y -= 7 * mm

    pcw = [36 * mm, 30 * mm, 22 * mm, 24 * mm, 28 * mm, 28 * mm]
    pdata = [["Date", "Saree Type", "Length", "Quantity", "Rate / Saree", "Daily Wage"]]
    for ln in lines:
        pdata.append([
            ln.date.strftime('%d %b %Y') if ln.date else '-',
            ln.saree_type,
            ln.saree_length,
            str(ln.quantity),
            _inr(ln.rate),
            _inr(ln.subtotal),
        ])
    pdata.append(["", "TOTAL", "", str(salary.total_sarees), "", _inr(salary.total_wage)])

    ptbl = Table(pdata, colWidths=pcw)
    ptbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, 0), WHITE),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0), 8),
        ("TOPPADDING",    (0, 0), (-1, 0), 5),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 5),
        ("ALIGN",         (3, 0), (-1, 0), "RIGHT"),
        ("BACKGROUND",    (0, 1), (-1, -1), WHITE),
        ("FONTNAME",      (0, 1), (-1, -2), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -2), 8),
        ("TEXTCOLOR",     (0, 1), (-1, -2), DARK),
        ("ALIGN",         (3, 1), (-1, -2), "RIGHT"),
        ("TOPPADDING",    (0, 1), (-1, -2), 4),
        ("BOTTOMPADDING", (0, 1), (-1, -2), 4),
        ("FONTNAME",      (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE",      (0, -1), (-1, -1), 8.5),
        ("TEXTCOLOR",     (0, -1), (-1, -1), DARK),
        ("ALIGN",         (3, -1), (-1, -1), "RIGHT"),
        ("TOPPADDING",    (0, -1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 5),
        ("LINEBELOW",     (0, 0), (-1, -1), 0.35, RULE),
        ("LINEABOVE",     (0, -1), (-1, -1), 0.8, DARK),
        ("BOX",           (0, 0), (-1, -1), 0.5, RULE),
    ]))
    ptbl.wrapOn(c, sum(pcw), H)
    th = ptbl._height
    ptbl.drawOn(c, MAR, y - th)
    y -= th + 8 * mm

    # ── 5. PAYMENT HISTORY + SALARY SUMMARY ─────────────────
    _hl(c, MAR, y, W - MAR, w=0.4)
    y -= 5 * mm
    cw2 = (W - 2 * MAR - 6 * mm) / 2

    # Left: Payment History
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 9.5)
    c.drawString(MAR, y, "Payment History")
    _hl(c, MAR, y - 1.5 * mm, MAR + 36 * mm, col=AMBER, w=1.5)
    y -= 7 * mm

    paycw = [cw2 * 0.40, cw2 * 0.25, cw2 * 0.35]
    paydata = [["Date", "Method", "Amount"]]
    for p in payments:
        paydata.append([p.paid_on.strftime('%d %b %Y'), p.payment_method, _inr(p.amount)])
    if not payments:
        paydata.append(["No payments yet", "", ""])

    paytbl = Table(paydata, colWidths=paycw)
    paytbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, 0), WHITE),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0), 8),
        ("TOPPADDING",    (0, 0), (-1, 0), 5),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 5),
        ("ALIGN",         (2, 0), (2, -1), "RIGHT"),
        ("BACKGROUND",    (0, 1), (-1, -1), WHITE),
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -1), 8),
        ("TEXTCOLOR",     (0, 1), (-1, -1), DARK),
        ("TOPPADDING",    (0, 1), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
        ("LINEBELOW",     (0, 0), (-1, -1), 0.35, RULE),
        ("BOX",           (0, 0), (-1, -1), 0.5, RULE),
    ]))
    paytbl.wrapOn(c, sum(paycw), H)
    payh = paytbl._height
    paytbl.drawOn(c, MAR, y - payh)

    # Right: Salary Summary
    sx  = MAR + cw2 + 6 * mm
    sy  = y
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 9.5)
    c.drawString(sx, sy, "Salary Summary")
    _hl(c, sx, sy - 1.5 * mm, sx + 34 * mm, col=AMBER, w=1.5)
    sy -= 7 * mm

    sum_rows = [
        ("Gross Earnings",    _inr(salary.total_wage),      DARK,  "Helvetica-Bold", 9),
        ("Total Paid",        _inr(salary.paid_amount),     GREEN, "Helvetica",      8.5),
        ("Remaining Balance", _inr(salary.remaining_amount), RED,  "Helvetica-Bold", 9),
    ]
    rh  = 9 * mm
    bh  = len(sum_rows) * rh
    _border(c, sx, sy - bh, cw2, bh)

    for i, (lbl, val, vc, vf, vs) in enumerate(sum_rows):
        ry = sy - (i + 1) * rh
        if i > 0:
            _hl(c, sx, ry + rh, sx + cw2, w=0.35)
        lf = "Helvetica-Bold" if vf == "Helvetica-Bold" else "Helvetica"
        c.setFillColor(SLATE); c.setFont(lf, 8)
        c.drawString(sx + 4 * mm, ry + 3 * mm, lbl)
        c.setFillColor(vc); c.setFont(vf, vs)
        c.drawRightString(sx + cw2 - 4 * mm, ry + 2.5 * mm, val)

    sy -= bh + 5 * mm
    c.setFillColor(SLATE_LT); c.setFont("Helvetica-Oblique", 7.5)
    c.drawString(sx, sy, _inr_words(salary.total_wage))
    sy -= 5 * mm

    stat_col = GREEN if salary.status == 'paid' else (AMBER if salary.status == 'partial' else RED)
    c.setFillColor(stat_col); c.setFont("Helvetica-Bold", 8.5)
    c.drawString(sx, sy, f"Status: {salary.get_status_display().upper()}")

    y = min(y - payh, sy - 5 * mm) - 8 * mm

    # ── 6. NOTE ──────────────────────────────────────────────
    _hl(c, MAR, y, W - MAR, w=0.4)
    y -= 5 * mm
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 8)
    c.drawString(MAR, y, "Note:")
    c.setFillColor(SLATE); c.setFont("Helvetica", 8)
    c.drawString(MAR + 12 * mm, y,
                 "System-generated payslip from Weaver ETS. No signature required.")
    y -= 5 * mm
    c.setFillColor(SLATE_LT); c.setFont("Helvetica", 7.5)
    c.drawString(MAR, y,
                 "Gross Earnings = sum of all production entries for the period.  Contact admin for disputes.")

    # ── 7. FOOTER ────────────────────────────────────────────
    _hl(c, MAR, 12 * mm, W - MAR, w=0.3)
    c.setFillColor(SLATE_LT); c.setFont("Helvetica", 7)
    c.drawString(MAR, 8 * mm, "Weaver ETS  \u2022  Bengaluru, Karnataka, India")
    c.drawRightString(W - MAR, 8 * mm, f"Payslip ID: {payslip_id}  \u2022  Page 1 of 1")
    c.setFont("Helvetica-Oblique", 7)
    c.drawCentredString(W / 2, 8 * mm, "\u2014 This is a system-generated document \u2014")

    c.save()
    return buf.getvalue()
