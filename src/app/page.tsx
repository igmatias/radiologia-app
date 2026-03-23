import Link from "next/link"
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  FileText, 
  Camera, 
  Activity, 
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  Scan
} from "lucide-react"

export default function Home() {
  return (
    <div 
      className="min-h-screen bg-neutral-50 flex flex-col" 
      style={{ fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif' }}
    >
      
      {/* BARRA SUPERIOR DE CONTACTO */}
      <div className="bg-black text-neutral-300 py-2 text-sm hidden md:block">
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
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* LOGO DE LA EMPRESA */}
            <Link href="/">
              <img 
                src="/logo.png" 
                alt="I-R Dental Logo" 
                className="h-14 w-auto object-contain"
              />
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#servicios" className="text-sm font-semibold text-neutral-700 hover:text-red-600 transition-colors uppercase">Servicios</a>
            <a href="#sedes" className="text-sm font-semibold text-neutral-700 hover:text-red-600 transition-colors uppercase">Sedes</a>
            <Link href="/portal-medico" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded text-sm font-bold transition-all shadow-md">
              ONLINE REPORTING
            </Link>
          </div>
        </div>
      </header>

      {/* SECCIÓN HERO (PORTADA PRINCIPAL) */}
      <main className="flex-grow">
        <section className="relative bg-neutral-900 overflow-hidden border-b-[8px] border-red-600">
          <div className="absolute inset-0 bg-[url('https://placehold.co/1920x1080/1a1a1a/000000?text=+')] opacity-50 bg-cover bg-center mix-blend-multiply"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Tecnología de Vanguardia al Servicio del Profesional
              </h1>
              <p className="text-lg text-neutral-300 mb-12 font-light border-l-4 border-red-600 pl-4">
                El resultado completa el análisis de su odontólogo para brindarle una mejor salud dental.
              </p>
            </div>

            {/* ACCESOS DIRECTOS AL SISTEMA */}
            <div className="mt-8 max-w-md">
              
              {/* Portal Profesionales */}
              <div className="bg-white rounded-lg p-8 shadow-xl border-t-4 border-red-600 hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-red-50 p-3 rounded-full text-red-600">
                    <Stethoscope size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-800">Profesionales</h3>
                </div>
                <p className="text-neutral-600 text-sm mb-8 h-10">
                  Acceso exclusivo a estudios derivados, tomografías 3D e informes detallados.
                </p>
                <Link href="/portal-medico" className="flex items-center justify-between w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded font-bold text-sm transition-colors shadow-sm">
                  PORTAL MÉDICO <ChevronRight size={20} />
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* SECCIÓN INFORMACIÓN GENERAL */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-neutral-800 uppercase mb-8 pb-2 border-b-2 border-neutral-100">
              Información Importante
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <h4 className="font-bold text-neutral-800 mb-2 flex items-center gap-2">
                  <Clock className="text-red-600" size={20} /> Sin Turno Previo
                </h4>
                <p className="text-sm text-neutral-600">
                  No es necesario solicitar turno. Los estudios se realizan en cualquiera de nuestras sedes por orden de llegada.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-neutral-800 mb-2 flex items-center gap-2">
                  <Activity className="text-red-600" size={20} /> Preparación
                </h4>
                <p className="text-sm text-neutral-600">
                  Los estudios que realizamos no requieren ninguna consideración o preparación especial previa.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-neutral-800 mb-2 flex items-center gap-2">
                  <FileText className="text-red-600" size={20} /> Entrega de Resultados
                </h4>
                <p className="text-sm text-neutral-600">
                  Se entregan en el momento, salvo las Tomografías en 3D y los trazados Cefalométricos que demoran 48 horas.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-neutral-800 mb-2 flex items-center gap-2">
                  <ShieldCheck className="text-red-600" size={20} /> Obras Sociales
                </h4>
                <p className="text-sm text-neutral-600">
                  Ofrecemos una amplia cobertura. Tenemos descuentos para todas las obras sociales, aún aquellas que no estén en la lista.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN SERVICIOS */}
        <section id="servicios" className="py-16 bg-neutral-50 border-t border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-neutral-800 uppercase mb-8 pb-2 border-b-2 border-neutral-200">
              Nuestros Servicios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white p-6 border border-neutral-200 rounded hover:shadow-md transition-shadow">
                <div className="text-red-600 mb-4"><Activity size={32} /></div>
                <h3 className="font-bold text-neutral-800 text-lg mb-2">Tomografías en 3D</h3>
                <p className="text-sm text-neutral-600">Estudios de alta precisión (Cone Beam). Evaluación pre implantológica e imágenes detalladas en 3D.</p>
              </div>

              <div className="bg-white p-6 border border-neutral-200 rounded hover:shadow-md transition-shadow">
                <div className="text-red-600 mb-4"><Scan size={32} /></div>
                <h3 className="font-bold text-neutral-800 text-lg mb-2">Placas Intraorales</h3>
                <p className="text-sm text-neutral-600">Estudios Oclusales, Palatales y Seriadas de 14 películas para un diagnóstico dental minucioso.</p>
              </div>

              <div className="bg-white p-6 border border-neutral-200 rounded hover:shadow-md transition-shadow">
                <div className="text-red-600 mb-4"><FileText size={32} /></div>
                <h3 className="font-bold text-neutral-800 text-lg mb-2">Placas Extraorales</h3>
                <p className="text-sm text-neutral-600">Radiografías Panorámicas, Telerradiografías y estudios de ATM (Articulación Temporomandibular).</p>
              </div>

              <div className="bg-white p-6 border border-neutral-200 rounded hover:shadow-md transition-shadow">
                <div className="text-red-600 mb-4"><Camera size={32} /></div>
                <h3 className="font-bold text-neutral-800 text-lg mb-2">Fotografías Clínicas</h3>
                <p className="text-sm text-neutral-600">Registro fotográfico profesional especializado para tratamientos de ortodoncia.</p>
              </div>

              <div className="bg-white p-6 border border-neutral-200 rounded hover:shadow-md transition-shadow">
                <div className="text-red-600 mb-4"><Stethoscope size={32} /></div>
                <h3 className="font-bold text-neutral-800 text-lg mb-2">Análisis Cefalométricos</h3>
                <p className="text-sm text-neutral-600">Trazados computados precisos para planificación y seguimiento de tratamientos ortodóncicos.</p>
              </div>

            </div>
          </div>
        </section>

        {/* SECCIÓN SEDES */}
        <section id="sedes" className="py-16 bg-white border-t border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-neutral-800 uppercase mb-8 pb-2 border-b-2 border-neutral-100">
              Nuestras Sedes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Sede Quilmes */}
              <div className="bg-neutral-50 rounded-xl overflow-hidden border border-neutral-200 hover:border-red-300 transition-colors shadow-sm flex flex-col">
                <iframe 
                  src="https://maps.google.com/maps?q=Olavarr%C3%ADa%2088,%20Quilmes&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="250" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="bg-neutral-200"
                ></iframe>
                <div className="p-6 flex-grow">
                  <h3 className="text-xl font-bold text-red-600 uppercase mb-4">Quilmes</h3>
                  <ul className="space-y-3 text-sm text-neutral-700">
                    <li className="flex items-start gap-3"><MapPin className="text-neutral-400 mt-0.5 shrink-0" size={16} /> Olavarría 88 – Quilmes</li>
                    <li className="flex items-start gap-3"><Phone className="text-neutral-400 mt-0.5 shrink-0" size={16} /> 011.4257.1222</li>
                    <li className="flex items-start gap-3"><Mail className="text-neutral-400 mt-0.5 shrink-0" size={16} /> quilmes@irdental.com.ar</li>
                  </ul>
                </div>
              </div>

              {/* Sede Avellaneda */}
              <div className="bg-neutral-50 rounded-xl overflow-hidden border border-neutral-200 hover:border-red-300 transition-colors shadow-sm flex flex-col">
                <iframe 
                  src="https://maps.google.com/maps?q=9%20de%20Julio%2064,%20Avellaneda&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="250" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="bg-neutral-200"
                ></iframe>
                <div className="p-6 flex-grow">
                  <h3 className="text-xl font-bold text-red-600 uppercase mb-4">Avellaneda</h3>
                  <ul className="space-y-3 text-sm text-neutral-700">
                    <li className="flex items-start gap-3"><MapPin className="text-neutral-400 mt-0.5 shrink-0" size={16} /> 9 de Julio 64 P.2 º A – Avellaneda</li>
                    <li className="flex items-start gap-3"><Phone className="text-neutral-400 mt-0.5 shrink-0" size={16} /> 011.4222.5553</li>
                    <li className="flex items-start gap-3"><Mail className="text-neutral-400 mt-0.5 shrink-0" size={16} /> avellaneda@irdental.com.ar</li>
                  </ul>
                </div>
              </div>

              {/* Sede Lomas de Zamora */}
              <div className="bg-neutral-50 rounded-xl overflow-hidden border border-neutral-200 hover:border-red-300 transition-colors shadow-sm flex flex-col">
                <iframe 
                  src="https://maps.google.com/maps?q=Lomas%20de%20Zamora,%20Buenos%20Aires&t=&z=14&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="250" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="bg-neutral-200"
                ></iframe>
                <div className="p-6 flex-grow">
                  <h3 className="text-xl font-bold text-red-600 uppercase mb-4">Lomas de Zamora</h3>
                  <ul className="space-y-3 text-sm text-neutral-700">
                    <li className="flex items-start gap-3"><MapPin className="text-neutral-400 mt-0.5 shrink-0" size={16} /> Sede Lomas de Zamora</li>
                    <li className="flex items-start gap-3"><Mail className="text-neutral-400 mt-0.5 shrink-0" size={16} /> lomas@irdental.com.ar</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-black py-8 text-neutral-400 text-sm border-t-4 border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <img src="/logo.png" alt="I-R Dental" className="h-8 w-auto brightness-0 invert opacity-80" />
          </div>
          <p>
            © {new Date().getFullYear()} Instituto Radiodiagnóstico Dentomaxilofacial S.A. | Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}