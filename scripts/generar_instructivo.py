"""
Instructivo Portal Médico — I-R Dental
Genera un PDF profesional con todas las funciones del portal
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, Image
)
from reportlab.platypus import PageBreak
from reportlab.lib.colors import HexColor
import os

# ─── Colores brand ───────────────────────────────────────────
BRAND       = HexColor('#BA2C66')
BRAND_DARK  = HexColor('#8b1d4a')
BRAND_LIGHT = HexColor('#fdf0f5')
SLATE_900   = HexColor('#0f172a')
SLATE_700   = HexColor('#334155')
SLATE_500   = HexColor('#64748b')
SLATE_200   = HexColor('#e2e8f0')
SLATE_50    = HexColor('#f8fafc')
WHITE       = colors.white
EMERALD     = HexColor('#059669')
AMBER       = HexColor('#d97706')
BLUE        = HexColor('#2563eb')

# ─── Estilos ──────────────────────────────────────────────────
styles = getSampleStyleSheet()

def st(name, **kwargs):
    return ParagraphStyle(name, **kwargs)

TITLE_STYLE = st('titulo',
    fontName='Helvetica-Bold', fontSize=22, textColor=WHITE,
    alignment=TA_CENTER, spaceAfter=2*mm)

SUBTITLE_STYLE = st('subtitulo',
    fontName='Helvetica', fontSize=11, textColor=HexColor('#fbd5e8'),
    alignment=TA_CENTER, spaceAfter=0)

H1 = st('h1',
    fontName='Helvetica-Bold', fontSize=15, textColor=BRAND,
    spaceBefore=6*mm, spaceAfter=3*mm)

H2 = st('h2',
    fontName='Helvetica-Bold', fontSize=12, textColor=SLATE_900,
    spaceBefore=4*mm, spaceAfter=2*mm)

H3 = st('h3',
    fontName='Helvetica-Bold', fontSize=10, textColor=SLATE_700,
    spaceBefore=3*mm, spaceAfter=1.5*mm)

BODY = st('body',
    fontName='Helvetica', fontSize=10, textColor=SLATE_700,
    leading=15, spaceAfter=2*mm, alignment=TA_JUSTIFY)

BODY_BOLD = st('body_bold',
    fontName='Helvetica-Bold', fontSize=10, textColor=SLATE_900,
    leading=15, spaceAfter=1*mm)

SMALL = st('small',
    fontName='Helvetica', fontSize=8.5, textColor=SLATE_500,
    leading=13, spaceAfter=1.5*mm)

STEP_NUM = st('step_num',
    fontName='Helvetica-Bold', fontSize=11, textColor=WHITE,
    alignment=TA_CENTER)

STEP_TITLE = st('step_title',
    fontName='Helvetica-Bold', fontSize=11, textColor=SLATE_900,
    spaceAfter=1*mm)

STEP_BODY = st('step_body',
    fontName='Helvetica', fontSize=9.5, textColor=SLATE_700,
    leading=14, spaceAfter=0)

NOTE = st('note',
    fontName='Helvetica-Oblique', fontSize=9, textColor=HexColor('#92400e'),
    leading=13)

TIP = st('tip',
    fontName='Helvetica', fontSize=9.5, textColor=HexColor('#1e40af'),
    leading=13)

# ─── Helpers ─────────────────────────────────────────────────
def hr(color=SLATE_200, thickness=0.5):
    return HRFlowable(width='100%', thickness=thickness, color=color,
                      spaceAfter=3*mm, spaceBefore=1*mm)

def spacer(h=4):
    return Spacer(1, h*mm)

def section_header(text):
    """Bloque de título de sección con fondo brand"""
    data = [[Paragraph(text, st('sh', fontName='Helvetica-Bold', fontSize=12,
                                 textColor=WHITE, alignment=TA_LEFT))]]
    t = Table(data, colWidths=[170*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BRAND),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [BRAND]),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))
    return t

def step_block(num, title, body_lines):
    """Bloque de paso numerado"""
    num_cell = Table([[Paragraph(str(num), STEP_NUM)]],
                     colWidths=[8*mm], rowHeights=[8*mm])
    num_cell.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BRAND),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('ROUNDEDCORNERS', [4,4,4,4]),
    ]))

    content = [Paragraph(title, STEP_TITLE)]
    for line in body_lines:
        content.append(Paragraph(line, STEP_BODY))

    data = [[num_cell, content]]
    t = Table(data, colWidths=[12*mm, 158*mm], spaceBefore=1*mm, spaceAfter=2*mm)
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (0,0), 'CENTER'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (1,0), (1,0), 6),
    ]))
    return t

def info_box(text, color=BRAND_LIGHT, border=BRAND, icon='ℹ'):
    """Caja de información / nota"""
    full = f"<b>{icon}</b>  {text}"
    data = [[Paragraph(full, st('ib', fontName='Helvetica', fontSize=9.5,
                                 textColor=SLATE_700, leading=14))]]
    t = Table(data, colWidths=[170*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), color),
        ('BOX', (0,0), (-1,-1), 1, border),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('ROUNDEDCORNERS', [5,5,5,5]),
    ]))
    return t

def feature_row(icon, title, desc):
    """Fila de característica con ícono"""
    left = Paragraph(f"<b>{icon}  {title}</b>", st('ft', fontName='Helvetica-Bold',
                      fontSize=10, textColor=SLATE_900, leading=14))
    right = Paragraph(desc, st('fd', fontName='Helvetica', fontSize=9.5,
                                textColor=SLATE_700, leading=14))
    data = [[left, right]]
    t = Table(data, colWidths=[55*mm, 115*mm], spaceAfter=2*mm)
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, SLATE_200),
    ]))
    return t

def pill(text, bg=BRAND, fg=WHITE):
    data = [[Paragraph(text, st('pl', fontName='Helvetica-Bold', fontSize=8.5,
                                 textColor=fg, alignment=TA_CENTER))]]
    t = Table(data, colWidths=[None])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('ROUNDEDCORNERS', [10,10,10,10]),
    ]))
    return t

# ─── Cover page ──────────────────────────────────────────────
def build_cover(story, logo_path):
    # Fondo del encabezado
    cover_data = [['']]
    cover_table = Table(cover_data, colWidths=[170*mm], rowHeights=[55*mm])
    cover_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BRAND),
        ('ROUNDEDCORNERS', [10,10,10,10]),
    ]))

    story.append(spacer(4))
    story.append(cover_table)

    # Logo
    if os.path.exists(logo_path):
        story.append(spacer(-52))
        img = Image(logo_path, width=28*mm, height=28*mm)
        img.hAlign = 'CENTER'
        story.append(img)
        story.append(spacer(4))

    story.append(Paragraph("PORTAL MÉDICO", TITLE_STYLE))
    story.append(Paragraph("Guía completa de uso · I-R Dental", SUBTITLE_STYLE))
    story.append(spacer(8))

    # Descripción intro
    story.append(Paragraph(
        "Este instructivo explica paso a paso cómo acceder y utilizar todas las funciones "
        "del Portal Médico de I-R Dental: desde el primer ingreso hasta la creación de "
        "derivaciones, consulta de estudios y configuración del perfil.",
        BODY))

    story.append(spacer(3))
    story.append(hr(BRAND, 1))

    # Índice rápido
    story.append(Paragraph("Contenido", H1))
    index_items = [
        ("1.", "Acceso y Login"),
        ("2.", "Panel Principal — Resumen"),
        ("3.", "Nueva Derivación"),
        ("4.", "Mis Estudios"),
        ("5.", "Nueva Solicitud a Recepción"),
        ("6.", "Mis Solicitudes"),
        ("7.", "Ajustes de Perfil"),
        ("8.", "Instalar como App (PWA)"),
        ("9.", "Preguntas frecuentes"),
    ]
    for num, item in index_items:
        data = [[
            Paragraph(num, st('in', fontName='Helvetica-Bold', fontSize=10,
                               textColor=BRAND)),
            Paragraph(item, st('it', fontName='Helvetica', fontSize=10,
                                textColor=SLATE_700))
        ]]
        t = Table(data, colWidths=[10*mm, 160*mm], spaceAfter=1.5*mm)
        t.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 1),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ]))
        story.append(t)

    story.append(PageBreak())


# ─── SECCIÓN 1 — Login ───────────────────────────────────────
def build_login(story):
    story.append(section_header("1.  Acceso y Login"))
    story.append(spacer(3))

    story.append(Paragraph(
        "El Portal Médico es una aplicación web exclusiva para odontólogos derivantes. "
        "No requiere instalación y funciona desde cualquier navegador moderno (Chrome, Safari, Firefox).",
        BODY))

    story.append(Paragraph("¿Cómo ingresar?", H2))
    story.append(step_block(1, "Abrí el navegador e ingresá a la dirección del portal",
        ["Escribí la URL del portal en la barra de direcciones o usá el acceso directo "
         "que te enviamos por WhatsApp/email."]))
    story.append(step_block(2, "Ingresá tu usuario y contraseña",
        ["Tu usuario es el número de matrícula provincial.",
         "Si es tu primer ingreso, usá la contraseña provisoria que te entregó recepción."]))
    story.append(step_block(3, "Tocá el botón INGRESAR",
        ["El sistema te llevará directo al panel principal con todos tus estudios y opciones."]))

    story.append(spacer(2))
    story.append(info_box(
        "Si olvidaste tu contraseña, comunicarte con recepción por WhatsApp para que la restablezcan.",
        color=HexColor('#fffbeb'), border=AMBER, icon='⚠'))

    story.append(PageBreak())


# ─── SECCIÓN 2 — Panel principal ─────────────────────────────
def build_panel(story):
    story.append(section_header("2.  Panel Principal — Resumen"))
    story.append(spacer(3))

    story.append(Paragraph(
        "Al ingresar verás el panel principal. Es la pantalla central desde donde accedés "
        "a todas las funciones del portal.",
        BODY))

    story.append(Paragraph("Barra superior", H2))
    rows = [
        ("Tu nombre",       "Aparece en la esquina superior. Confirma que estás con tu sesión activa."),
        ("Instalar",        "Botón para instalar el portal como app en tu celular o computadora (ver sección 8)."),
        ("Ajustes ⚙",      "Acceso a tu perfil: datos personales, matrícula y preferencias de entrega."),
        ("Solicitudes 🔔",  "Muestra el número de respuestas pendientes de leer de recepción."),
        ("Salir",           "Cierra tu sesión de forma segura."),
    ]
    for title, desc in rows:
        story.append(feature_row("·", title, desc))

    story.append(spacer(3))
    story.append(Paragraph("Botones de acción principal", H2))
    story.append(Paragraph(
        "En el centro del panel hay dos botones grandes:",
        BODY))

    data = [
        [Paragraph("<b>Nueva Derivación</b>", st('nb', fontName='Helvetica-Bold',
          fontSize=11, textColor=WHITE, alignment=TA_CENTER)),
         Paragraph("<b>Nueva Solicitud</b>", st('nb2', fontName='Helvetica-Bold',
          fontSize=11, textColor=WHITE, alignment=TA_CENTER))],
        [Paragraph("Creá una orden de derivación para tu paciente con los estudios que necesita. "
                   "Genera un código de 6 dígitos y un PDF para imprimir.",
                   st('nb3', fontName='Helvetica', fontSize=9.5, textColor=HexColor('#fbd5e8'),
                      leading=13, alignment=TA_CENTER)),
         Paragraph("Enviá una consulta directa a recepción: estudio faltante, error en datos, "
                   "consulta técnica, etc.",
                   st('nb4', fontName='Helvetica', fontSize=9.5, textColor=HexColor('#cbd5e1'),
                      leading=13, alignment=TA_CENTER))],
    ]
    t = Table(data, colWidths=[83*mm, 83*mm], spaceBefore=2*mm, spaceAfter=4*mm)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), BRAND),
        ('BACKGROUND', (1,0), (1,-1), SLATE_900),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('ROUNDEDCORNERS', [8,8,8,8]),
        ('INNERGRID', (0,0), (-1,-1), 0, WHITE),
        ('BOX', (0,0), (-1,-1), 0, WHITE),
    ]))
    story.append(t)

    story.append(Paragraph("Lista de estudios", H2))
    story.append(Paragraph(
        "Debajo de los botones principales aparece el historial de todos los estudios "
        "realizados por tus pacientes. Podés buscar por nombre, DNI o número de orden "
        "usando la barra de búsqueda.",
        BODY))

    states = [
        (HexColor('#fef9c3'), HexColor('#a16207'), "EN ESPERA",           "El paciente ya fue registrado, el técnico aún no comenzó."),
        (HexColor('#dbeafe'), HexColor('#1d4ed8'), "EN ATENCIÓN",         "El técnico está tomando el estudio en este momento."),
        (HexColor('#f3e8ff'), HexColor('#7e22ce'), "PROCESANDO",          "El estudio está siendo procesado/revelado."),
        (HexColor('#dcfce7'), HexColor('#15803d'), "LISTO PARA ENTREGA",  "El estudio está disponible para retirar o descargar."),
        (HexColor('#f1f5f9'), HexColor('#475569'), "ENTREGADO",           "El estudio fue entregado al paciente o al médico."),
    ]
    story.append(Paragraph("Estados de un estudio:", H3))
    for bg, fg, label, desc in states:
        data = [
            [Paragraph(label, st('sl', fontName='Helvetica-Bold', fontSize=8,
                                  textColor=fg, alignment=TA_CENTER)),
             Paragraph(desc, st('sd', fontName='Helvetica', fontSize=9.5,
                                 textColor=SLATE_700, leading=13))]
        ]
        t = Table(data, colWidths=[40*mm, 130*mm], spaceAfter=1.5*mm)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,0), bg),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('ROUNDEDCORNERS', [5,5,5,5]),
        ]))
        story.append(t)

    story.append(PageBreak())


# ─── SECCIÓN 3 — Nueva Derivación ────────────────────────────
def build_derivacion(story):
    story.append(section_header("3.  Nueva Derivación"))
    story.append(spacer(3))

    story.append(Paragraph(
        "La derivación es el documento oficial que indica a recepción qué estudios necesita "
        "tu paciente. Al guardarla se genera un código único de 6 dígitos que el paciente "
        "presenta en la clínica. También podés imprimir o guardar el PDF para entregárselo.",
        BODY))

    story.append(Paragraph("Completar la derivación paso a paso", H2))

    story.append(step_block(1, "Tocá el botón NUEVA DERIVACIÓN",
        ["Se abre el formulario de derivación en pantalla completa."]))

    story.append(step_block(2, "Datos del Paciente",
        ["Apellido y Nombre: tal como figura en el DNI.",
         "DNI: solo números, sin puntos.",
         "Fecha de Nacimiento: formato DD-MM-AAAA (ejemplo: 15-03-1985).",
         "Cobertura: elegí 'Particular' o 'Obra Social'. Si es obra social, "
         "completá nombre y número de afiliado."]))

    story.append(step_block(3, "Seleccionar Estudios",
        ["Los estudios están organizados en 4 grupos:",
         "  🦷 Intraorales — radiografías dentro de la boca",
         "  📷 Extraorales — panorámicas, cefalometrías, senos maxilares, etc.",
         "  😁 Ortodoncia — estudios completos para tratamientos de ortodoncia",
         "  🔬 Tomografías 3D — CBCT de distintas zonas",
         "Tocá cada estudio para seleccionarlo. Aparecerá resaltado.",
         "Algunos estudios requieren indicar las piezas dentarias o "
         "elegir opciones adicionales (ej: TC3D Frente / Perfil)."]))

    story.append(step_block(4, "Indicación Clínica (opcional)",
        ["Podés escribir una nota para el técnico: diagnóstico presuntivo, "
         "zona de interés, nivel de apertura bucal del paciente, etc."]))

    story.append(step_block(5, "Estudio personalizado (opcional)",
        ["Si el estudio que necesitás no aparece en la lista, escribilo en el "
         "campo 'Otro estudio' y quedará registrado en la derivación."]))

    story.append(step_block(6, "Tocar IMPRIMIR / GUARDAR PDF",
        ["El sistema guarda la derivación en la base de datos y genera un código "
         "único de 6 dígitos.",
         "Se abre automáticamente el diálogo de impresión.",
         "Podés imprimir la hoja A4 para dársela al paciente, o guardarlo "
         "como PDF y enviárselo por WhatsApp."]))

    story.append(spacer(2))
    story.append(info_box(
        "El código de 6 dígitos es lo único que el paciente necesita presentar en recepción. "
        "Con ese número, la recepcionista carga todos los datos automáticamente sin que el "
        "paciente tenga que repetir nada.",
        color=HexColor('#f0fdf4'), border=EMERALD, icon='✓'))

    story.append(spacer(2))
    story.append(info_box(
        "El PDF generado incluye tu nombre, matrícula y sello automáticamente. "
        "No necesitás firmarlo a mano si es particular. Si es obra social, "
        "el espacio de firma queda en blanco para que lo completes.",
        color=BRAND_LIGHT, border=BRAND, icon='ℹ'))

    story.append(PageBreak())


# ─── SECCIÓN 4 — Mis Estudios ────────────────────────────────
def build_estudios(story):
    story.append(section_header("4.  Mis Estudios"))
    story.append(spacer(3))

    story.append(Paragraph(
        "En el panel principal, debajo de los botones de acción, encontrás el listado "
        "completo de todos los estudios realizados por tus pacientes.",
        BODY))

    story.append(Paragraph("Buscar un estudio", H2))
    story.append(Paragraph(
        "Usá la barra de búsqueda para filtrar por:",
        BODY))

    search_items = [
        "Nombre o apellido del paciente",
        "DNI del paciente",
        "Número de orden (código alfanumérico)",
    ]
    for item in search_items:
        story.append(Paragraph(f"  •  {item}", BODY))

    story.append(spacer(2))
    story.append(Paragraph("Información de cada estudio", H2))

    fields = [
        ("Número de orden", "Código único del estudio (ej: QUI-2025-000042)."),
        ("Nombre del paciente", "Apellido y nombre tal como fue registrado en recepción."),
        ("Fecha",              "Fecha y hora en que fue creada la orden."),
        ("Estado",             "El estado actual del estudio (ver sección 2)."),
        ("Estudios realizados","Lista de las prácticas incluidas en esa orden."),
    ]
    for f, d in fields:
        story.append(feature_row("·", f, d))

    story.append(spacer(2))
    story.append(info_box(
        "Cuando un estudio cambia al estado LISTO PARA ENTREGA te llegará una "
        "notificación por WhatsApp o email según tu configuración de perfil.",
        color=HexColor('#eff6ff'), border=BLUE, icon='📱'))

    story.append(PageBreak())


# ─── SECCIÓN 5 — Nueva Solicitud ─────────────────────────────
def build_solicitud(story):
    story.append(section_header("5.  Nueva Solicitud a Recepción"))
    story.append(spacer(3))

    story.append(Paragraph(
        "El Centro de Solicitudes te permite enviar mensajes directos al equipo de "
        "recepción de I-R Dental sin necesidad de llamar por teléfono.",
        BODY))

    story.append(Paragraph("¿Cuándo usarlo?", H2))

    motivos = [
        ("Falta subir un estudio",  "El paciente ya fue atendido pero el estudio no aparece en tu portal."),
        ("Error en datos",          "El nombre, DNI o fecha de nacimiento del paciente está mal cargado."),
        ("Consulta técnica",        "Dudas sobre el visor 3D/DICOM, calidad de imagen, reposición, etc."),
        ("Otra consulta / Reclamo", "Cualquier otro motivo que necesite comunicarse con el equipo."),
    ]
    for motivo, desc in motivos:
        story.append(feature_row("→", motivo, desc))

    story.append(Paragraph("Cómo enviar una solicitud", H2))
    story.append(step_block(1, "Tocá NUEVA SOLICITUD",
        ["Se abre el formulario de solicitud."]))
    story.append(step_block(2, "Elegí el motivo de la consulta",
        ["Seleccioná en el desplegable la opción que mejor describe tu caso."]))
    story.append(step_block(3, "Escribí el detalle",
        ["Cuanto más detalle incluyas, más rápido podemos resolverlo.",
         "Si es por un estudio específico, incluí el nombre del paciente y la fecha aproximada."]))
    story.append(step_block(4, "Tocá ENVIAR SOLICITUD",
        ["La solicitud llega instantáneamente al panel de recepción.",
         "Recibirás una respuesta a la brevedad."]))

    story.append(PageBreak())


# ─── SECCIÓN 6 — Mis Solicitudes ─────────────────────────────
def build_mis_solicitudes(story):
    story.append(section_header("6.  Mis Solicitudes"))
    story.append(spacer(3))

    story.append(Paragraph(
        "En el ícono de campana 🔔 de la barra superior podés ver todas las solicitudes "
        "que enviaste y leer las respuestas de recepción.",
        BODY))

    story.append(Paragraph("Estados de una solicitud", H2))
    estados = [
        (HexColor('#fffbeb'), AMBER,                "PENDIENTE",    "Recepción aún no la respondió."),
        (HexColor('#f0fdf4'), EMERALD,               "RESPONDIDO",   "Recepción respondió. El número en la campana indica cuántas respuestas nuevas tenés."),
        (HexColor('#f8fafc'), HexColor('#94a3b8'),   "CERRADO",      "La solicitud fue resuelta y archivada."),
    ]
    for bg, fg, label, desc in estados:
        data = [
            [Paragraph(label, st('sl2', fontName='Helvetica-Bold', fontSize=8,
                                  textColor=fg, alignment=TA_CENTER)),
             Paragraph(desc, st('sd2', fontName='Helvetica', fontSize=9.5,
                                 textColor=SLATE_700, leading=13))]
        ]
        t = Table(data, colWidths=[35*mm, 135*mm], spaceAfter=2*mm)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,0), bg),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('ROUNDEDCORNERS', [5,5,5,5]),
        ]))
        story.append(t)

    story.append(info_box(
        "Al abrir Mis Solicitudes, el contador de la campana se reinicia automáticamente "
        "y las respuestas quedan marcadas como leídas.",
        color=BRAND_LIGHT, border=BRAND, icon='ℹ'))

    story.append(PageBreak())


# ─── SECCIÓN 7 — Ajustes de Perfil ───────────────────────────
def build_perfil(story):
    story.append(section_header("7.  Ajustes de Perfil"))
    story.append(spacer(3))

    story.append(Paragraph(
        "Desde el ícono de ajustes ⚙ en la barra superior podés actualizar tus datos "
        "personales y configurar cómo querés recibir los resultados.",
        BODY))

    story.append(Paragraph("Datos personales", H2))
    campos = [
        ("Nombre y Apellido",        "Tu nombre tal como querés que aparezca en las derivaciones y en el sistema."),
        ("Matrícula Provincial",     "Número de matrícula provincial (MP). Aparece en el sello de las derivaciones."),
        ("Matrícula Nacional",       "Número de matrícula nacional (MN). Opcional."),
        ("Teléfono (WhatsApp)",      "Número donde querés recibir los avisos de estudios listos."),
        ("Correo Electrónico",       "Email de contacto para recibir notificaciones."),
    ]
    for campo, desc in campos:
        story.append(feature_row("·", campo, desc))

    story.append(Paragraph("Preferencias de entrega de resultados", H2))
    story.append(Paragraph(
        "Podés configurar cómo preferís recibir los estudios de tus pacientes:",
        BODY))

    prefs = [
        ("Digital",  "Los estudios se envían por WhatsApp o email. Sin papel."),
        ("Impreso",  "Los estudios se imprimen y quedan disponibles para retirar en la clínica."),
        ("Ambas",    "Recibís el estudio digital Y queda una copia impresa en la clínica."),
    ]
    data = [[
        Paragraph("<b>Formato</b>", st('th', fontName='Helvetica-Bold', fontSize=9,
                                        textColor=WHITE, alignment=TA_CENTER)),
        Paragraph("<b>Descripción</b>", st('th2', fontName='Helvetica-Bold', fontSize=9,
                                            textColor=WHITE, alignment=TA_LEFT)),
    ]]
    for fmt, desc in prefs:
        data.append([
            Paragraph(fmt, st('td', fontName='Helvetica-Bold', fontSize=9.5,
                               textColor=SLATE_900, alignment=TA_CENTER)),
            Paragraph(desc, st('td2', fontName='Helvetica', fontSize=9.5,
                                textColor=SLATE_700, leading=13)),
        ])
    t = Table(data, colWidths=[35*mm, 135*mm], spaceAfter=4*mm)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SLATE_900),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, SLATE_50]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('INNERGRID', (0,0), (-1,-1), 0.3, SLATE_200),
        ('BOX', (0,0), (-1,-1), 0.5, SLATE_200),
    ]))
    story.append(t)

    story.append(Paragraph("Vía principal de contacto", H2))
    story.append(Paragraph(
        "Elegí si preferís que los avisos lleguen por <b>WhatsApp</b> o por <b>E-Mail</b>. "
        "Asegurate de tener completado el dato correspondiente (teléfono o email).",
        st('b2', fontName='Helvetica', fontSize=10, textColor=SLATE_700,
            leading=15, spaceAfter=2*mm)))

    story.append(spacer(2))
    story.append(info_box(
        "Guardá siempre los cambios tocando el botón GUARDAR CAMBIOS al final del formulario. "
        "Los cambios en matrícula se reflejan en las próximas derivaciones que generes.",
        color=HexColor('#f0fdf4'), border=EMERALD, icon='✓'))

    story.append(PageBreak())


# ─── SECCIÓN 8 — PWA ─────────────────────────────────────────
def build_pwa(story):
    story.append(section_header("8.  Instalar como App (PWA)"))
    story.append(spacer(3))

    story.append(Paragraph(
        "El portal puede instalarse en tu celular o computadora como una aplicación, "
        "sin necesidad de la App Store ni Google Play. Funciona igual que una app nativa: "
        "tiene ícono en la pantalla de inicio, abre sin barras del navegador y carga más rápido.",
        BODY))

    story.append(Paragraph("En Android (Chrome)", H2))
    story.append(step_block(1, "Abrí el portal en Chrome",
        ["Ingresá a la URL del portal desde Google Chrome."]))
    story.append(step_block(2, "Tocá el botón INSTALAR de la barra superior",
        ["Chrome mostrará un diálogo de confirmación."]))
    story.append(step_block(3, "Tocá INSTALAR en el diálogo",
        ["El ícono de I-R Dental aparecerá en tu pantalla de inicio."]))

    story.append(Paragraph("En iPhone / iPad (Safari)", H2))
    story.append(step_block(1, "Abrí el portal en Safari",
        ["Chrome en iOS no admite instalación de PWA. Usá Safari."]))
    story.append(step_block(2, "Tocá el botón Compartir",
        ["Es el ícono de cuadrado con flecha hacia arriba, en la barra inferior."]))
    story.append(step_block(3, "Elegí 'Agregar a pantalla de inicio'",
        ["Desplazá la lista de opciones hacia abajo hasta encontrar esta opción."]))
    story.append(step_block(4, "Tocá Agregar",
        ["El ícono aparecerá en tu pantalla de inicio como cualquier otra app."]))

    story.append(spacer(2))
    story.append(info_box(
        "Una vez instalada, podés abrir el portal directamente desde el ícono sin abrir "
        "el navegador. La app se actualiza automáticamente cuando hay cambios.",
        color=HexColor('#eff6ff'), border=BLUE, icon='📱'))

    story.append(PageBreak())


# ─── SECCIÓN 9 — FAQ ─────────────────────────────────────────
def build_faq(story):
    story.append(section_header("9.  Preguntas Frecuentes"))
    story.append(spacer(3))

    faqs = [
        ("¿El paciente necesita llevar el PDF impreso?",
         "No es obligatorio. Con solo el código de 6 dígitos, recepción carga todos "
         "los datos automáticamente. El PDF es opcional y útil si el paciente quiere "
         "tener una copia física."),

        ("¿Puedo crear una derivación sin elegir estudios específicos?",
         "Sí. Podés escribir el estudio en el campo 'Otro estudio' con el nombre que "
         "vos uses habitualmente y el equipo lo identifica al recibirlo."),

        ("¿Qué pasa si me equivoqué en los datos del paciente?",
         "Enviá una solicitud desde 'Nueva Solicitud' eligiendo el motivo "
         "'Error en datos de paciente' e indicá el número de orden o el nombre. "
         "Recepción lo corregirá a la brevedad."),

        ("¿Puedo ver los estudios de todos mis pacientes?",
         "Sí, el panel muestra todos los estudios de pacientes que fueron derivados "
         "con tu matrícula o registrados bajo tu nombre."),

        ("¿Con qué frecuencia se actualiza el estado de los estudios?",
         "El estado se actualiza en tiempo real. Al recargar la página o al entrar "
         "al portal verás el estado más reciente."),

        ("¿Puedo usar el portal desde la computadora del consultorio?",
         "Sí. Funciona en cualquier navegador moderno (Chrome, Safari, Edge, Firefox) "
         "tanto en celular como en computadora o tablet."),

        ("¿Qué hago si no recibo el aviso de estudio listo?",
         "Verificá que tu teléfono o email estén correctamente cargados en Ajustes de Perfil. "
         "También podés revisar el estado directamente en el panel en cualquier momento."),

        ("¿El portal funciona sin conexión a internet?",
         "Necesita conexión para cargar datos en tiempo real. Sin embargo, "
         "si lo instalaste como app, la última versión visitada puede verse "
         "parcialmente sin conexión."),
    ]

    for i, (pregunta, respuesta) in enumerate(faqs):
        data = [[
            Paragraph(f"<b>P: {pregunta}</b>", st(f'q{i}',
                fontName='Helvetica-Bold', fontSize=10, textColor=BRAND,
                leading=14, spaceAfter=1*mm)),
        ]]
        data.append([
            Paragraph(f"R: {respuesta}", st(f'a{i}',
                fontName='Helvetica', fontSize=9.5, textColor=SLATE_700,
                leading=14)),
        ])
        t = Table(data, colWidths=[170*mm], spaceAfter=3*mm)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), HexColor('#fdf0f5')),
            ('BACKGROUND', (0,1), (-1,1), WHITE),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('BOX', (0,0), (-1,-1), 0.5, HexColor('#f5aacf')),
            ('INNERGRID', (0,0), (-1,-1), 0.3, HexColor('#fbd5e8')),
            ('ROUNDEDCORNERS', [6,6,6,6]),
        ]))
        story.append(t)

    # Contacto final
    story.append(spacer(4))
    story.append(hr(BRAND, 1.5))
    story.append(spacer(2))

    contact_data = [[
        Paragraph("<b>Contacto I-R Dental</b>", st('ctit', fontName='Helvetica-Bold',
                    fontSize=11, textColor=WHITE, alignment=TA_CENTER)),
    ],[
        Paragraph(
            "📍 Quilmes: Olavarría 88 · Tel: 4257-2950 · WA: 11-5820-9986\n"
            "📍 Avellaneda: 9 de Julio 64, 2do A · Tel: 4201-1061 · WA: 11-3865-7094\n"
            "📍 Lomas de Zamora: España 156, PB · Tel: 4244-0519 · WA: 11-7044-2131\n"
            "☎  0810.333.4507  ·  ✉  info@irdental.com.ar\n"
            "🕐  Lunes a Viernes 9:00-17:30hs  ·  Sábados 9:00-12:30hs",
            st('cdata', fontName='Helvetica', fontSize=9.5, textColor=WHITE,
               leading=16, alignment=TA_CENTER)),
    ]]
    t = Table(contact_data, colWidths=[170*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BRAND),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('ROUNDEDCORNERS', [10,10,10,10]),
    ]))
    story.append(t)


# ─── Header / Footer ─────────────────────────────────────────
def on_page(canvas, doc):
    canvas.saveState()
    w, h = A4

    # Header line
    canvas.setStrokeColor(BRAND)
    canvas.setLineWidth(1.5)
    canvas.line(15*mm, h - 12*mm, w - 15*mm, h - 12*mm)

    # Header text
    canvas.setFont('Helvetica-Bold', 8)
    canvas.setFillColor(BRAND)
    canvas.drawString(15*mm, h - 10*mm, "I-R DENTAL")
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(SLATE_500)
    canvas.drawRightString(w - 15*mm, h - 10*mm, "Portal Médico — Instructivo de Uso")

    # Footer
    canvas.setStrokeColor(SLATE_200)
    canvas.setLineWidth(0.5)
    canvas.line(15*mm, 12*mm, w - 15*mm, 12*mm)
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(SLATE_500)
    canvas.drawString(15*mm, 9*mm, "Confidencial — Solo para uso del profesional")
    canvas.drawRightString(w - 15*mm, 9*mm, f"Pág. {doc.page}")

    canvas.restoreState()


# ─── MAIN ────────────────────────────────────────────────────
def main():
    output_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'instructivo-portal-medico.pdf')
    output_path = os.path.abspath(output_path)

    logo_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'logo.png')
    logo_path = os.path.abspath(logo_path)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=18*mm, bottomMargin=18*mm,
        title="Portal Médico — Instructivo I-R Dental",
        author="I-R Dental",
        subject="Guía de uso del Portal Médico",
    )

    story = []
    build_cover(story, logo_path)
    build_login(story)
    build_panel(story)
    build_derivacion(story)
    build_estudios(story)
    build_solicitud(story)
    build_mis_solicitudes(story)
    build_perfil(story)
    build_pwa(story)
    build_faq(story)

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF generado: {output_path}")


if __name__ == '__main__':
    main()
