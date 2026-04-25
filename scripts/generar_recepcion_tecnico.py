"""
Instructivos visuales para Recepción y Técnico — I-R Dental
Estilo más gráfico y compacto que el portal médico
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, Image, KeepTogether
)
from reportlab.lib.colors import HexColor
import os

# ── Paleta ────────────────────────────────────────────────────
BRAND      = HexColor('#BA2C66')
BRAND_DARK = HexColor('#8b1d4a')
BRAND_L    = HexColor('#fdf0f5')
SLATE_900  = HexColor('#0f172a')
SLATE_700  = HexColor('#334155')
SLATE_500  = HexColor('#64748b')
SLATE_200  = HexColor('#e2e8f0')
SLATE_50   = HexColor('#f8fafc')
WHITE      = colors.white
EMERALD    = HexColor('#059669')
EMERALD_L  = HexColor('#f0fdf4')
AMBER      = HexColor('#d97706')
AMBER_L    = HexColor('#fffbeb')
BLUE       = HexColor('#2563eb')
BLUE_L     = HexColor('#eff6ff')
PURPLE     = HexColor('#7c3aed')
PURPLE_L   = HexColor('#f5f3ff')

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public'))
LOGO = os.path.join(BASE, 'logo.png')

# ── Estilos ───────────────────────────────────────────────────
def s(name, **kw):
    return ParagraphStyle(name, **kw)

BODY = s('b', fontName='Helvetica', fontSize=9.5, textColor=SLATE_700, leading=14, spaceAfter=2*mm)
BOLD = s('bb', fontName='Helvetica-Bold', fontSize=9.5, textColor=SLATE_900, leading=14)

def sp(h=3): return Spacer(1, h*mm)
def hr(c=SLATE_200, t=0.5): return HRFlowable(width='100%', thickness=t, color=c, spaceAfter=2*mm, spaceBefore=1*mm)

# ── Componentes gráficos ─────────────────────────────────────

def cover_band(title, subtitle, accent):
    """Banda de portada de color"""
    data = [[
        Paragraph(title, s('ct', fontName='Helvetica-Bold', fontSize=26,
                            textColor=WHITE, alignment=TA_CENTER)),
        Paragraph(subtitle, s('cs', fontName='Helvetica', fontSize=11,
                               textColor=HexColor('#fbd5e8'), alignment=TA_CENTER)),
    ]]
    t = Table(data, colWidths=[170*mm], rowHeights=[18*mm, 10*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), accent),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('ROUNDEDCORNERS', [10,10,10,10]),
    ]))
    return t

def big_step(num, emoji, title, lines, accent=BRAND):
    """Paso grande con número circulado y emoji"""
    num_para = Paragraph(f"<b>{num}</b>", s(f'sn{num}', fontName='Helvetica-Bold',
                          fontSize=13, textColor=WHITE, alignment=TA_CENTER))
    num_cell = Table([[num_para]], colWidths=[9*mm], rowHeights=[9*mm])
    num_cell.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), accent),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('ROUNDEDCORNERS', [20,20,20,20]),
    ]))
    title_para = Paragraph(
        f"<b>{emoji}  {title}</b>",
        s(f'st{num}', fontName='Helvetica-Bold', fontSize=11, textColor=SLATE_900, spaceAfter=2*mm))
    body_paras = [title_para] + [
        Paragraph(f"<font color='#64748b'>◦</font>  {l}",
                  s(f'sb{num}{i}', fontName='Helvetica', fontSize=9.5,
                    textColor=SLATE_700, leading=14, leftIndent=6))
        for i, l in enumerate(lines)
    ]
    t = Table([[num_cell, body_paras]], colWidths=[13*mm, 157*mm], spaceAfter=3*mm)
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (1,0), (1,0), 8),
    ]))
    return t

def section_title(emoji, text, accent=BRAND):
    """Título de sección con fondo de color"""
    para = Paragraph(
        f"  {emoji}  <b>{text.upper()}</b>",
        s('stit', fontName='Helvetica-Bold', fontSize=11, textColor=WHITE))
    t = Table([[para]], colWidths=[170*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), accent),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('ROUNDEDCORNERS', [6,6,6,6]),
        ('SPACER', (0,0), (-1,-1), 4),
    ]))
    return KeepTogether([t, sp(2)])

def status_chip(label, bg, fg=WHITE):
    para = Paragraph(f"<b>{label}</b>",
                     s('chip', fontName='Helvetica-Bold', fontSize=8.5,
                       textColor=fg, alignment=TA_CENTER))
    t = Table([[para]], colWidths=[38*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('ROUNDEDCORNERS', [12,12,12,12]),
    ]))
    return t

def two_col_table(rows, col1=55, col2=115, header=None, hbg=SLATE_900):
    """Tabla de dos columnas con filas alternadas"""
    data = []
    if header:
        data.append([
            Paragraph(f"<b>{header[0]}</b>",
                      s('th0', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
            Paragraph(f"<b>{header[1]}</b>",
                      s('th1', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
        ])
    for left, right in rows:
        data.append([
            Paragraph(left, s('td0', fontName='Helvetica-Bold', fontSize=9.5, textColor=SLATE_900, leading=13)),
            Paragraph(right, s('td1', fontName='Helvetica', fontSize=9.5, textColor=SLATE_700, leading=13)),
        ])
    t = Table(data, colWidths=[col1*mm, col2*mm], spaceAfter=4*mm)
    style = [
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1 if header else 0), (-1,-1), [WHITE, SLATE_50]),
        ('INNERGRID', (0,0), (-1,-1), 0.3, SLATE_200),
        ('BOX', (0,0), (-1,-1), 0.5, SLATE_200),
    ]
    if header:
        style.append(('BACKGROUND', (0,0), (-1,0), hbg))
    t.setStyle(TableStyle(style))
    return t

def info_box(text, bg=BLUE_L, border=BLUE, icon='ℹ'):
    para = Paragraph(f"<b>{icon}</b>  {text}",
                     s('ib', fontName='Helvetica', fontSize=9.5, textColor=SLATE_700, leading=14))
    t = Table([[para]], colWidths=[170*mm], spaceAfter=3*mm)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('BOX', (0,0), (-1,-1), 1, border),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('ROUNDEDCORNERS', [6,6,6,6]),
    ]))
    return t

def flow_arrow(steps, accent=BRAND):
    """Diagrama de flujo horizontal con flechas"""
    cells = []
    for i, (emoji, label) in enumerate(steps):
        cell_para = [
            Paragraph(emoji, s(f'fa{i}e', fontName='Helvetica', fontSize=16,
                                alignment=TA_CENTER)),
            Paragraph(f"<b>{label}</b>", s(f'fa{i}l', fontName='Helvetica-Bold',
                                            fontSize=8, textColor=WHITE,
                                            alignment=TA_CENTER, leading=11)),
        ]
        cells.append(cell_para)
        if i < len(steps) - 1:
            cells.append(Paragraph("→", s(f'arr{i}', fontName='Helvetica-Bold',
                                           fontSize=14, textColor=accent,
                                           alignment=TA_CENTER)))

    n = len(steps)
    total_cols = n + (n - 1)
    step_w = 28*mm
    arr_w = 8*mm
    widths = []
    for i in range(total_cols):
        widths.append(step_w if i % 2 == 0 else arr_w)

    data = [cells]
    t = Table(data, colWidths=widths, spaceAfter=4*mm)
    style = [
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]
    for i in range(0, total_cols, 2):
        style.append(('BACKGROUND', (i,0), (i,0), accent))
        style.append(('ROUNDEDCORNERS', [6,6,6,6]))
    t.setStyle(TableStyle(style))
    return t

def header_footer(canvas, doc, role_label, accent):
    canvas.saveState()
    w, h = A4
    canvas.setStrokeColor(accent)
    canvas.setLineWidth(1.5)
    canvas.line(15*mm, h - 12*mm, w - 15*mm, h - 12*mm)
    canvas.setFont('Helvetica-Bold', 8)
    canvas.setFillColor(accent)
    canvas.drawString(15*mm, h - 10*mm, "I-R DENTAL")
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(SLATE_500)
    canvas.drawRightString(w - 15*mm, h - 10*mm, f"{role_label} — Instructivo de Uso")
    canvas.setStrokeColor(SLATE_200)
    canvas.setLineWidth(0.5)
    canvas.line(15*mm, 12*mm, w - 15*mm, 12*mm)
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(SLATE_500)
    canvas.drawString(15*mm, 9*mm, "I-R Dental · Uso interno")
    canvas.drawRightString(w - 15*mm, 9*mm, f"Pág. {doc.page}")
    canvas.restoreState()


# ════════════════════════════════════════════════════════════
#  PDF 1 — RECEPCIÓN
# ════════════════════════════════════════════════════════════

def build_recepcion(output_path):

    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=18*mm, bottomMargin=18*mm,
        title="Recepción — Instructivo I-R Dental",
        author="I-R Dental",
    )
    story = []

    # ── Portada ───────────────────────────────────────────────
    story.append(sp(4))
    if os.path.exists(LOGO):
        img = Image(LOGO, width=24*mm, height=24*mm)
        img.hAlign = 'CENTER'
        story.append(img)
        story.append(sp(2))

    story.append(Paragraph("RECEPCIÓN", s('cov', fontName='Helvetica-Bold', fontSize=30,
                             textColor=BRAND, alignment=TA_CENTER)))
    story.append(Paragraph("Guía rápida de uso · I-R Dental",
                            s('covs', fontName='Helvetica', fontSize=12,
                              textColor=SLATE_500, alignment=TA_CENTER, spaceAfter=6*mm)))

    # Flujo principal en portada
    story.append(flow_arrow([
        ("🏠","Elegir\nSede"), ("🔍","Buscar\nDerivación"),
        ("📋","Cargar\nOrden"), ("💰","Cobrar"),
        ("🖨","Imprimir\nEtiqueta")
    ]))

    story.append(hr(BRAND, 1.5))
    story.append(sp(2))

    # Tabs rápido
    tabs_data = [
        [Paragraph("<b>PESTAÑA</b>", s('th', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
         Paragraph("<b>FUNCIÓN</b>", s('th2', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE))],
        [Paragraph("Nueva Orden", s('td', fontName='Helvetica-Bold', fontSize=10, textColor=BRAND, alignment=TA_CENTER)),
         Paragraph("Crear, editar y finalizar órdenes de atención.", BODY)],
        [Paragraph("Órdenes del Día", s('td2', fontName='Helvetica-Bold', fontSize=10, textColor=SLATE_700, alignment=TA_CENTER)),
         Paragraph("Ver, editar, reimprimir y anular las órdenes del turno.", BODY)],
        [Paragraph("Caja", s('td3', fontName='Helvetica-Bold', fontSize=10, textColor=HexColor('#2563eb'), alignment=TA_CENTER)),
         Paragraph("Abrir turno, registrar gastos, hacer arqueo parcial y cerrar caja.", BODY)],
        [Paragraph("Saldos", s('td4', fontName='Helvetica-Bold', fontSize=10, textColor=HexColor('#7c3aed'), alignment=TA_CENTER)),
         Paragraph("Ver y cobrar deudas pendientes de turnos anteriores.", BODY)],
        [Paragraph("Mensajes", s('td5', fontName='Helvetica-Bold', fontSize=10, textColor=HexColor('#d97706'), alignment=TA_CENTER)),
         Paragraph("Responder solicitudes de los médicos derivantes.", BODY)],
    ]
    t = Table(tabs_data, colWidths=[38*mm, 132*mm], spaceAfter=4*mm)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SLATE_900),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, SLATE_50]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('INNERGRID', (0,0), (-1,-1), 0.3, SLATE_200),
        ('BOX', (0,0), (-1,-1), 0.5, SLATE_200),
        ('ROUNDEDCORNERS', [6,6,6,6]),
    ]))
    story.append(t)
    story.append(PageBreak())

    # ── Configuración inicial ─────────────────────────────────
    story.append(section_title("⚙", "Configuración al iniciar el turno"))
    story.append(big_step(1, "🏠", "Elegir sede de trabajo",
        ["Al entrar por primera vez aparece un modal para seleccionar la sede.",
         "La selección queda guardada en el navegador.",
         "Para cambiarla: en la barra superior tocá el nombre de la sede."]))
    story.append(big_step(2, "💰", "Abrir la caja",
        ["Ir a la pestaña CAJA.",
         "Tocar el botón verde ABRIR CAJA.",
         "Sin caja abierta no se pueden registrar cobros del día."]))
    story.append(info_box(
        "Si la caja ya fue abierta por otra recepcionista del turno anterior, aparecerá el resumen activo directamente.",
        bg=EMERALD_L, border=EMERALD, icon='✓'))

    story.append(sp(3))
    story.append(section_title("📋", "Cargar una orden nueva"))
    story.append(Paragraph("<b>Opción A — Con código de derivación del médico</b>",
                            s('oa', fontName='Helvetica-Bold', fontSize=10, textColor=BRAND, spaceAfter=2*mm)))
    story.append(big_step(1, "🔍", "Ingresar el código de 6 dígitos",
        ["En la barra superior de la pestaña Nueva Orden hay un campo de búsqueda de derivación.",
         "Escribir el código y tocar BUSCAR."]))
    story.append(big_step(2, "👁", "Verificar los datos del médico y del paciente",
        ["Se muestra la tarjeta con todos los datos de la derivación: médico, paciente, estudios indicados.",
         "Verificar que coincidan con la persona presente."]))
    story.append(big_step(3, "✅", "Tocar USAR DATOS",
        ["Los datos del paciente se cargan automáticamente en el formulario.",
         "Los estudios indicados por el médico aparecen como chips en el Paso 2.",
         "El número de orden se genera automáticamente."]))

    story.append(sp(2))
    story.append(Paragraph("<b>Opción B — Sin derivación (particular / directo)</b>",
                            s('ob', fontName='Helvetica-Bold', fontSize=10, textColor=SLATE_700, spaceAfter=2*mm)))
    story.append(big_step(1, "🪪", "Ingresar el DNI del paciente",
        ["Al escribir el DNI el sistema busca automáticamente en la base de datos.",
         "Si el paciente ya estuvo antes, se cargan nombre, apellido y fecha de nacimiento solos.",
         "Si es nuevo, completar todos los campos manualmente."]))

    story.append(PageBreak())

    story.append(section_title("📝", "Los 3 pasos de la orden"))
    story.append(big_step(1, "👤", "Paso 1 — Datos del paciente",
        ["DNI (autocompletado si ya existe), Apellido, Nombre, Fecha de nacimiento.",
         "Teléfono, Email (opcionales pero importantes para el envío de resultados).",
         "Obra Social + N° Afiliado + Plan (si corresponde).",
         "Observaciones/Notas para el técnico."]))
    story.append(big_step(2, "🦷", "Paso 2 — Estudios",
        ["Seleccionar el odontólogo solicitante escribiendo apellido o matrícula.",
         "Si no hay médico derivante, tocar el botón SIN ODONTÓLOGO.",
         "Marcar las prácticas que se van a realizar. Los chips del médico aparecen arriba para seleccionar con un clic.",
         "Si la práctica requiere piezas dentarias o posición, se abre el configurador automáticamente."]))
    story.append(big_step(3, "💳", "Paso 3 — Cobro",
        ["El sistema calcula el total dividido en OS y paciente según la obra social configurada.",
         "Los montos son editables fila por fila.",
         "Seleccionar el medio de pago. Se pueden agregar múltiples métodos (efectivo + transferencia, etc.).",
         "El indicador verde confirma cuando los pagos cuadran con el total.",
         "Tocar FINALIZAR → se imprime la etiqueta automáticamente."]))

    story.append(info_box(
        "Si el total del paciente es $0 (100% OS) la sección de pagos no aparece y se puede finalizar directamente.",
        bg=BRAND_L, border=BRAND, icon='ℹ'))

    story.append(sp(3))
    story.append(section_title("📦", "Órdenes del día"))
    story.append(two_col_table([
        ("Etiqueta",    "Reimprimir la etiqueta térmica 90×50mm de una orden ya guardada."),
        ("Comprobante", "Imprimir el recibo A4 o rollo 80mm con todos los detalles de pago."),
        ("Editar",      "Modificar estudios, cobro o datos del paciente. El sistema calcula la diferencia con lo ya cobrado."),
        ("Anular",      "Desactiva la orden. El monto sale del cierre de caja. Se puede reactivar si fue un error."),
    ], col1=32, col2=138))

    story.append(PageBreak())

    story.append(section_title("💰", "Caja"))
    story.append(flow_arrow([
        ("🔓","Abrir\nCaja"), ("💵","Registrar\nMovimientos"),
        ("🧾","Arqueo\nParcial"), ("🔒","Cerrar\nCaja")
    ]))
    story.append(two_col_table([
        ("Abrir Caja",       "Iniciar el turno. Registra hora y operador."),
        ("+ Movimiento",     "Ingresar gastos o ingresos extra (reparto, caja chica, etc.) con descripción obligatoria."),
        ("Arqueo Parcial",   "Contar el efectivo físico en cualquier momento del turno y registrar la diferencia."),
        ("Cerrar Caja",      "Finaliza el turno. Requiere ingresar el efectivo físico contado. Genera el resumen del día."),
    ], col1=36, col2=134))
    story.append(info_box(
        "La caja se auto-actualiza cada 30 segundos. Los totales incluyen solo las órdenes ACTIVAS (las anuladas se restan automáticamente).",
        bg=AMBER_L, border=AMBER, icon='⚠'))

    story.append(sp(3))
    story.append(section_title("📬", "Mensajes (Solicitudes de médicos)"))
    story.append(Paragraph(
        "Los médicos derivantes pueden enviar consultas directamente desde su portal. "
        "El número en la pestaña indica cuántas están sin responder.",
        s('mb', fontName='Helvetica', fontSize=10, textColor=SLATE_700, leading=15, spaceAfter=3*mm)))
    story.append(two_col_table([
        ("Pendiente",   "Nueva solicitud sin responder. Requiere atención."),
        ("Respondido",  "Ya fue respondida. El médico puede leer la respuesta."),
        ("Cerrado",     "Asunto resuelto y archivado."),
    ], col1=32, col2=138, header=["Estado", "Significado"]))
    story.append(info_box(
        "Los motivos más comunes son: estudio faltante, error en datos del paciente, consulta técnica. Responder con el nombre del paciente y número de orden cuando sea posible.",
        bg=AMBER_L, border=AMBER, icon='💬'))

    doc.build(story, onFirstPage=lambda c,d: header_footer(c,d,"Recepción",BRAND),
                     onLaterPages=lambda c,d: header_footer(c,d,"Recepción",BRAND))
    print(f"✓ Recepción: {output_path}")


# ════════════════════════════════════════════════════════════
#  PDF 2 — TÉCNICO
# ════════════════════════════════════════════════════════════

def build_tecnico(output_path):

    TEAL = HexColor('#0d9488')
    TEAL_L = HexColor('#f0fdfa')

    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=18*mm, bottomMargin=18*mm,
        title="Técnico — Instructivo I-R Dental",
        author="I-R Dental",
    )
    story = []

    # ── Portada ───────────────────────────────────────────────
    story.append(sp(4))
    if os.path.exists(LOGO):
        img = Image(LOGO, width=24*mm, height=24*mm)
        img.hAlign = 'CENTER'
        story.append(img)
        story.append(sp(2))

    story.append(Paragraph("TÉCNICO", s('cov', fontName='Helvetica-Bold', fontSize=30,
                             textColor=TEAL, alignment=TA_CENTER)))
    story.append(Paragraph("Guía rápida de uso · I-R Dental",
                            s('covs', fontName='Helvetica', fontSize=12,
                              textColor=SLATE_500, alignment=TA_CENTER, spaceAfter=6*mm)))

    story.append(flow_arrow([
        ("⏳","En\nEspera"), ("▶","En\nAtención"),
        ("⚙","Procesando"), ("✅","Listo para\nEntrega")
    ], accent=TEAL))

    story.append(hr(TEAL, 1.5))
    story.append(sp(2))

    # Resumen de funciones
    funcs = [
        ["🔔 Alerta sonora",   "Al entrar una nueva orden aparece un aviso y suena la campana."],
        ["🏠 Filtro de sede",  "Solo se ven las órdenes de la sede configurada."],
        ["🔍 Filtros rápidos", "Mostrar TODOS / EN ESPERA / ATENDIENDO / PARA REPETIR."],
        ["📎 Adjuntar archivos","Subir JPG, PDF o imágenes directamente a cada orden."],
        ["🔗 Link externo",    "Pegar un link de visor 3D (EasyDent, etc.) en la orden."],
        ["💬 Mensajes",        "Responder solicitudes de los médicos derivantes."],
        ["👷 Técnicos",        "Asignar un técnico responsable a cada orden."],
    ]
    data = [[Paragraph("<b>Función</b>", s('th', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
             Paragraph("<b>Descripción</b>", s('th2', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE))]]
    for f, d in funcs:
        data.append([
            Paragraph(f, s('fd', fontName='Helvetica-Bold', fontSize=9.5, textColor=SLATE_900, leading=13)),
            Paragraph(d, s('dd', fontName='Helvetica', fontSize=9.5, textColor=SLATE_700, leading=13)),
        ])
    t = Table(data, colWidths=[44*mm, 126*mm], spaceAfter=4*mm)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SLATE_900),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, SLATE_50]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('INNERGRID', (0,0), (-1,-1), 0.3, SLATE_200),
        ('BOX', (0,0), (-1,-1), 0.5, SLATE_200),
        ('ROUNDEDCORNERS', [6,6,6,6]),
    ]))
    story.append(t)
    story.append(PageBreak())

    # ── Configuración inicial ─────────────────────────────────
    story.append(section_title("⚙", "Configuración al iniciar el turno", TEAL))
    story.append(big_step(1, "🏠", "Seleccionar la sede",
        ["Al entrar por primera vez aparece el selector de sede.",
         "Elegir la sede donde estás trabajando y confirmar.",
         "Solo verás las órdenes de esa sede."], TEAL))
    story.append(big_step(2, "👷", "Verificar los técnicos disponibles",
        ["En la barra superior tocá el ícono de técnicos.",
         "Podés agregar o eliminar técnicos del equipo del día.",
         "Antes de atender un paciente, asignar el técnico responsable a la orden."], TEAL))

    story.append(sp(3))
    story.append(section_title("📋", "Flujo de atención de una orden", TEAL))

    story.append(big_step(1, "⏳", "Paciente en sala de espera",
        ["La orden aparece con estado EN ESPERA cuando recepción la registra.",
         "Suena la campana y aparece un aviso en pantalla.",
         "Ver los datos del paciente: nombre, DNI, fecha de nacimiento.",
         "Ver los estudios a realizar y si hay indicaciones clínicas del médico."], TEAL))

    story.append(big_step(2, "▶", "Iniciar la atención",
        ["Tocar el botón ATENDER en la orden correspondiente.",
         "El estado cambia a EN ATENCIÓN y empieza a contar el tiempo.",
         "Si hay odontograma de piezas, verificar con el paciente antes de comenzar."], TEAL))

    story.append(big_step(3, "👷", "Asignar técnico (opcional)",
        ["Tocar el selector de técnico en la tarjeta de la orden.",
         "Elegir el técnico que va a realizar el estudio.",
         "Queda registrado para las estadísticas del personal."], TEAL))

    story.append(big_step(4, "📎", "Adjuntar el estudio (si corresponde)",
        ["Tocar el ícono de subir archivo en la orden.",
         "Seleccionar el archivo JPG, PNG o PDF del estudio.",
         "El archivo queda vinculado a la orden y visible para el médico en su portal.",
         "Alternativa: pegar un link externo de visor 3D con el ícono de cadena."], TEAL))

    story.append(big_step(5, "✅", "Marcar como listo",
        ["Tocar el botón LISTO → ENTREGA.",
         "La orden desaparece de la lista activa.",
         "El médico derivante recibe la notificación automáticamente.",
         "Recepción puede ver el estado actualizado en su panel."], TEAL))

    story.append(info_box(
        "Si el estudio necesita repetirse (mala calidad, paciente se movió, etc.) tocar REPETIR. La orden vuelve al estado EN ESPERA y queda marcada con un indicador visual.",
        bg=HexColor('#fff7ed'), border=AMBER, icon='🔁'))

    story.append(PageBreak())

    story.append(section_title("🗂", "Los estados de una orden", TEAL))

    states = [
        (HexColor('#fef9c3'), AMBER,                "⏳ EN ESPERA",          "Orden creada por recepción. Paciente aguardando ser llamado."),
        (BLUE_L,              BLUE,                  "▶ EN ATENCIÓN",         "El técnico inició el estudio. Cronómetro activo."),
        (PURPLE_L,            PURPLE,                "⚙ PROCESANDO",          "Estudio en revelado o procesamiento digital."),
        (EMERALD_L,           EMERALD,               "✅ LISTO PARA ENTREGA",  "Estudio terminado. Visible en el portal del médico."),
        (SLATE_50,            SLATE_500,             "📦 ENTREGADO",           "El resultado fue entregado al paciente o al médico."),
        (HexColor('#fff0f0'), HexColor('#dc2626'),   "🔁 PARA REPETIR",        "El estudio debe rehacerse. Vuelve a la cola de espera."),
    ]

    for bg, fg, label, desc in states:
        data = [[
            Paragraph(f"<b>{label}</b>", s(f'sl{label}', fontName='Helvetica-Bold', fontSize=9,
                                           textColor=fg, alignment=TA_CENTER)),
            Paragraph(desc, s(f'sd{label}', fontName='Helvetica', fontSize=9.5,
                               textColor=SLATE_700, leading=13))
        ]]
        t = Table(data, colWidths=[48*mm, 122*mm], spaceAfter=2*mm)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,0), bg),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('BOX', (0,0), (-1,-1), 0.5, SLATE_200),
            ('ROUNDEDCORNERS', [6,6,6,6]),
        ]))
        story.append(t)

    story.append(sp(3))
    story.append(section_title("💬", "Mensajes de médicos", TEAL))
    story.append(Paragraph(
        "El ícono de mensajes en la barra superior muestra solicitudes de los médicos. "
        "Respondé desde la pantalla de mensajes.",
        s('mmb', fontName='Helvetica', fontSize=10, textColor=SLATE_700, leading=14, spaceAfter=2*mm)))
    story.append(two_col_table([
        ("Falta subir estudio",   "El médico no ve el resultado en su portal. Verificar que el archivo esté adjunto."),
        ("Error en datos",        "Coordinar con recepción para corregir los datos del paciente."),
        ("Consulta técnica",      "Responder con el detalle técnico solicitado."),
        ("Otra consulta",         "Responder o derivar a recepción según corresponda."),
    ], col1=42, col2=128))

    story.append(info_box(
        "Al responder un mensaje el médico recibe la notificación en su portal y el contador de campana se actualiza.",
        bg=TEAL_L, border=TEAL, icon='📱'))

    doc.build(story, onFirstPage=lambda c,d: header_footer(c,d,"Técnico",TEAL),
                     onLaterPages=lambda c,d: header_footer(c,d,"Técnico",TEAL))
    print(f"✓ Técnico: {output_path}")


# ── Main ──────────────────────────────────────────────────────
if __name__ == '__main__':
    pub = BASE
    build_recepcion(os.path.join(pub, 'instructivo-recepcion.pdf'))
    build_tecnico(os.path.join(pub, 'instructivo-tecnico.pdf'))
    print("✓ Ambos PDFs generados en /public")
