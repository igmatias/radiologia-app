import Link from "next/link"
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  FileText, 
  Camera, 
  Activity, 
  User, 
  Stethoscope,
  ChevronRight,
  ShieldCheck
} from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* BARRA SUPERIOR DE CONTACTO */}
      <div className="bg-slate-900 text-slate-300 py-2 text-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex gap-6">
            <span className="flex items-center gap-2"><Mail size={14} /> info@irdental.com.ar</span>
            <span className="flex items-center gap-2"><Clock size={14} /> Lunes a Viernes: 9 a 17:30 hs | Sábados: 9 a 12:30 hs</span>
          </div>
          <div>
            <span>Instituto Radiodiagnóstico Dentomaxilofacial S.A.</span>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN (HEADER) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* LOGO PLACEHOLDER (Acá después ponemos la imagen real) */}
            <div className="flex flex-col">
              <span className="text-3xl font-black text-[#004481] tracking-tight">I-R DENTAL</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Servicio de Imágenes Odontológicas</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#servicios" className="text-sm font-semibold text-slate-700 hover:text-[#004481] transition-colors uppercase">Servicios</a>
            <a href="#pacientes" className="text-sm font-semibold text-slate-700 hover:text-[#004481] transition-colors uppercase">Pacientes</a>
            <a href="#sedes" className="text-sm font-semibold text-slate-700 hover:text-[#004481] transition-colors uppercase">Sedes</a>
            <Link href="/login" className="bg-[#004481] hover:bg-[#003366] text-white px-6 py-2.5 rounded text-sm font-bold transition-all shadow-md">
              ONLINE REPORTING
            </Link>
          </div>
        </div>
      </header>

      {/* SECCIÓN HERO (PORTADA PRINCIPAL) */}
      <main className="flex-grow">
        <section className="relative bg-[#004481] overflow-hidden border-b-[12px] border-[#002b52]">
          <div className="absolute inset-0 bg-[url('https://placehold.co/1920x1080/003366/002244?text=+')] opacity-40 bg-cover bg-center mix-blend-multiply"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Tecnología de Vanguardia al Servicio del Profesional
              </h1>
              <p className="text-lg text-slate-200 mb-10 font-light border-l-4 border-slate-400 pl-4">
                El resultado completa el análisis de su odontólogo para brindarle una mejor salud dental.
              </p>
            </div>

            {/* ACCESOS DIRECTOS AL SISTEMA */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              
              {/* Portal Pacientes */}
              <div className="bg-white rounded-lg p-6 shadow-xl border-t-4 border-[#004481] hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-slate-100 p-3 rounded-full text-[#004481]">
                    <User size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Pacientes</h3>
                </div>
                <p className="text-slate-600 text-sm mb-6 h-10">
                  Visualice y descargue sus resultados ingresando el código de su comprobante.
                </p>
                <Link href="/resultados" className="flex items-center justify-between w-full bg-slate-100 hover:bg-slate-200 text-[#004481] px-4 py-3 rounded font-bold text-sm transition-colors border border-slate-200">
                  VER MIS RESULTADOS <ChevronRight size={18} />
                </Link>
              </div>

              {/* Portal Profesionales */}
              <div className="bg-white rounded-lg p-6 shadow-xl border-t-4 border-[#004481] hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-slate-100 p-3 rounded-full text-[#004481]">
                    <Stethoscope size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Profesionales</h3>
                </div>
                <p className="text-slate-600 text-sm mb-6 h-10">
                  Acceso exclusivo a estudios derivados, tomografías 3D e informes detallados.
                </p>
                <Link href="/login" className="flex items-center justify-between w-full bg-[#004481] hover:bg-[#003366] text-white px-4 py-3 rounded font-bold text-sm transition-colors">
                  PORTAL MÉDICO <ChevronRight size={18} />
                </Link>
              </div>

              {/* Acceso Personal */}
              <div className="bg-slate-800 rounded-lg p-6 shadow-xl border-t-4 border-slate-600 hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-slate-700 p-3 rounded-full text-slate-300">
                    <ShieldCheck size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Personal IRD</h3>
                </div>
                <p className="text-slate-400 text-sm mb-6 h-10">
                  Acceso seguro al sistema de gestión para Recepción y Técnicos.
                </p>
                <Link href="/login" className="flex items-center justify-between w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded font-bold text-sm transition-colors">
                  INGRESAR AL SISTEMA <ChevronRight size={18} />
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* SECCIÓN INFORMACIÓN PARA PACIENTES */}
        <section id="pacientes" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[#004481] uppercase mb-8 pb-2 border-b-2 border-slate-100">
              Información para el Paciente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Clock className="text-[#004481]" size={20} /> Sin Turno Previo
                </h4>
                <p className="text-sm text-slate-600">
                  No es necesario solicitar turno. Los estudios se realizan en cualquiera de nuestras sedes por orden de llegada.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Activity className="text-[#004481]" size={20} /> Preparación
                </h4>
                <p className="text-sm text-slate-600">
                  Los estudios que realizamos no requieren ninguna consideración o preparación especial previa.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <FileText className="text-[#004481]" size={20} /> Entrega de Resultados
                </h4>
                <p className="text-sm text-slate-600">
                  Se entregan en el momento, salvo las Tomografías en 3D y los trazados Cefalométricos que demoran 48 horas.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <ShieldCheck className="text-[#004481]" size={20} /> Obras Sociales
                </h4>
                <p className="text-sm text-slate-600">
                  Ofrecemos una amplia cobertura. Tenemos descuentos para todas las obras sociales, aún aquellas que no estén en la lista.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN SERVICIOS */}
        <section id="servicios" className="py-16 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[#004481] uppercase mb-8 pb-2 border-b-2 border-slate-200">
              Nuestros Servicios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white p-6 border border-slate-200 rounded">
                <div className="text-[#004481] mb-4"><Activity size={32} /></div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">Tomografías en 3D</h3>
                <p className="text-sm text-slate-600">Estudios de alta precisión (Cone Beam). Evaluación pre implantológica e imágenes detalladas en 3D.</p>
              </div>

              <div className="bg-white p-6 border border-slate-200 rounded">
                <div className="text-[#004481] mb-4"><Scan size={32} /></div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">Placas Intraorales</h3>
                <p className="text-sm text-slate-600">Estudios Oclusales, Palatales y Seriadas de 14 películas para un diagnóstico dental minucioso.</p>
              </div>

              <div className="bg-white p-6 border border-slate-200 rounded">
                <div className="text-[#004481] mb-4"><FileText size={32} /></div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">Placas Extraorales</h3>
                <p className="text-sm text-slate-600">Radiografías Panorámicas, Telerradiografías y estudios de ATM (Articulación Temporomandibular).</p>
              </div>

              <div className="bg-white p-6 border border-slate-200 rounded">
                <div className="text-[#004481] mb-4"><Camera size={32} /></div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">Fotografías Clínicas</h3>
                <p className="text-sm text-slate-600">Registro fotográfico profesional especializado para tratamientos de ortodoncia.</p>
              </div>

              <div className="bg-white p-6 border border-slate-200 rounded">
                <div className="text-[#004481] mb-4"><Stethoscope size={32} /></div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">Análisis Cefalométricos</h3>
                <p className="text-sm text-slate-600">Trazados computados precisos para planificación y seguimiento de tratamientos ortodóncicos.</p>
              </div>

            </div>
          </div>
        </section>

        {/* SECCIÓN SEDES */}
        <section id="sedes" className="py-16 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[#004481] uppercase mb-8 pb-2 border-b-2 border-slate-100">
              Nuestras Sedes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="bg-slate-50 p-6 rounded border border-slate-200">
                <h3 className="text-xl font-bold text-[#004481] uppercase mb-4">Quilmes</h3>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3"><MapPin className="text-slate-400 mt-0.5 shrink-0" size={16} /> Olavarría 88 – Quilmes</li>
                  <li className="flex items-start gap-3"><Phone className="text-slate-400 mt-0.5 shrink-0" size={16} /> 011.4257.1222</li>
                  <li className="flex items-start gap-3"><Mail className="text-slate-400 mt-0.5 shrink-0" size={16} /> quilmes@irdental.com.ar</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-6 rounded border border-slate-200">
                <h3 className="text-xl font-bold text-[#004481] uppercase mb-4">Avellaneda</h3>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3"><MapPin className="text-slate-400 mt-0.5 shrink-0" size={16} /> 9 de Julio 64 P.2 º A – Avellaneda</li>
                  <li className="flex items-start gap-3"><Phone className="text-slate-400 mt-0.5 shrink-0" size={16} /> 011.4222.5553</li>
                  <li className="flex items-start gap-3"><Mail className="text-slate-400 mt-0.5 shrink-0" size={16} /> avellaneda@irdental.com.ar</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-6 rounded border border-slate-200">
                <h3 className="text-xl font-bold text-[#004481] uppercase mb-4">Lomas de Zamora</h3>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3"><MapPin className="text-slate-400 mt-0.5 shrink-0" size={16} /> Sede Lomas de Zamora</li>
                  <li className="flex items-start gap-3"><Mail className="text-slate-400 mt-0.5 shrink-0" size={16} /> lomas@irdental.com.ar</li>
                </ul>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 py-8 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-lg font-black text-white tracking-tight">I-R DENTAL</span>
          </div>
          <p>
            © {new Date().getFullYear()} Instituto Radiodiagnóstico Dentomaxilofacial S.A. | Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}