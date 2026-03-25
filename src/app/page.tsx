import Link from "next/link"
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  FileText, 
  Camera, 
  Activity, 
  ChevronRight,
  ShieldCheck,
  Scan,
  MessageCircle,
  CheckCircle2,
  HelpCircle,
  Download,
  Instagram,
  Facebook,
  Award,
  Users,
  Zap
} from "lucide-react"

// Forzamos el título de la pestaña y optimizamos el SEO para Google
export const metadata = {
  title: 'I-R Dental | Radiodiagnóstico Dentomaxilofacial',
  description: 'Instituto Radiodiagnóstico Dentomaxilofacial S.A. Tecnología de vanguardia al servicio del profesional. Sedes en Quilmes, Avellaneda y Lomas de Zamora.',
}

// Ícono personalizado de Diente para la interfaz
const ToothIcon = ({ size = 24, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M10 21c-2.43 0-4.14-1.93-4.57-4.19L4.2 8.7A3.2 3.2 0 0 1 7.27 5h9.46a3.2 3.2 0 0 1 3.07 3.7l-1.23 8.11C18.14 19.07 16.43 21 14 21a3.64 3.64 0 0 1-2-.6 3.64 3.64 0 0 1-2 .6Z" />
    <path d="M12 11v10" />
  </svg>
)

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col relative">
      
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 md:h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* LOGO DE LA EMPRESA */}
            <Link href="/">
              <img 
                src="/logo.png?v=1" 
                alt="I-R Dental" 
                className="h-10 md:h-14 w-auto object-contain"
              />
            </Link>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            {/* Menú visible solo en PC */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#tecnologia" className="text-sm font-semibold text-neutral-700 hover:text-red-600 transition-colors uppercase">Tecnología</a>
              <a href="#servicios" className="text-sm font-semibold text-neutral-700 hover:text-red-600 transition-colors uppercase">Servicios</a>
              <a href="#sedes" className="text-sm font-semibold text-neutral-700 hover:text-red-600 transition-colors uppercase">Sedes</a>
            </div>
            {/* Botón CTA (Visible siempre, se achica en móvil) */}
            <Link href="/portal-medico" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 md:px-6 md:py-2.5 rounded text-xs md:text-sm font-bold transition-all shadow-md flex items-center gap-2">
              <span className="hidden md:inline">PORTAL PROFESIONAL</span>
              <span className="md:hidden">PORTAL</span> {/* Texto más corto para que entre en celular */}
            </Link>
          </div>
        </div>
      </header>

      {/* SECCIÓN HERO (PORTADA PRINCIPAL) */}
      <main className="flex-grow">
        <section className="relative bg-neutral-900 overflow-hidden border-b-[8px] border-red-600 min-h-[500px] md:min-h-[600px] flex items-center">
          {/* Fondo Premium Fotográfico */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed z-0 opacity-30 mix-blend-luminosity" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=1920')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-transparent z-0"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10 w-full">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Tecnología de Vanguardia al Servicio del Profesional
              </h1>
              <p className="text-lg md:text-xl text-neutral-300 mb-12 font-light border-l-4 border-red-600 pl-4 max-w-2xl">
                El resultado completa el análisis de su odontólogo para brindarle una mejor salud dental, respaldado por la mejor tecnología alemana.
              </p>
            </div>

            {/* ACCESOS DIRECTOS AL SISTEMA */}
            <div className="mt-8 max-w-md">
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-2xl border-t-4 border-red-600 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-red-50 p-3 rounded-full text-red-600">
                    <ToothIcon size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-800">Profesionales</h3>
                </div>
                <p className="text-neutral-600 text-sm mb-8 h-auto md:h-10">
                  Acceso exclusivo a estudios derivados, tomografías 3D e informes detallados.
                </p>
                <Link href="/portal-medico" className="flex items-center justify-between w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded font-bold text-sm transition-colors shadow-md">
                  INGRESAR AL PORTAL <ChevronRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* NUEVA SECCIÓN: TRAYECTORIA Y CONFIANZA (ESTADÍSTICAS) */}
        <section className="bg-neutral-800 py-12 border-b border-neutral-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x-0 md:divide-x md:divide-neutral-700">
              <div className="flex flex-col items-center justify-center p-4">
                <Award className="text-red-500 mb-3" size={36} />
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-1">+40</h3>
                <p className="text-neutral-400 text-sm font-semibold uppercase tracking-wider">Años de Trayectoria</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4">
                <Scan className="text-red-500 mb-3" size={36} />
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-1">HD / 3D</h3>
                <p className="text-neutral-400 text-sm font-semibold uppercase tracking-wider">Alta Resolución</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4">
                <MapPin className="text-red-500 mb-3" size={36} />
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-1">3</h3>
                <p className="text-neutral-400 text-sm font-semibold uppercase tracking-wider">Sedes Estratégicas</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4">
                <Zap className="text-red-500 mb-3" size={36} />
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-1">100%</h3>
                <p className="text-neutral-400 text-sm font-semibold uppercase tracking-wider">Flujo Digital</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN: 40 ANIVERSARIO */}
        <section className="relative bg-neutral-950 py-16 md:py-24 overflow-hidden border-b-4 border-amber-500">
          {/* Cubos decorativos */}
          <img src="/cubito.png" className="absolute right-8 top-8 w-20 h-20 opacity-[0.07] rotate-12 select-none pointer-events-none" alt="" />
          <img src="/cubito.png" className="absolute right-40 bottom-8 w-10 h-10 opacity-[0.07] -rotate-6 select-none pointer-events-none" alt="" />
          <img src="/cubito.png" className="absolute left-4 bottom-16 w-14 h-14 opacity-[0.05] rotate-45 select-none pointer-events-none" alt="" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-16">

              {/* Logo 40 años */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_0_60px_rgba(245,158,11,0.55),0_0_120px_rgba(245,158,11,0.25),0_20px_40px_rgba(0,0,0,0.6)] ring-2 ring-amber-400/60">
                  <img
                    src="/40anoshq.png"
                    alt="40 Años I-R Dental"
                    className="w-36 md:w-56 h-auto"
                  />
                </div>
              </div>

              {/* Texto del aniversario */}
              <div className="text-center lg:text-left">
                <div className="inline-block bg-amber-500/20 border border-amber-400/40 px-4 py-1.5 rounded-full mb-5">
                  <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">✦ Hito Institucional</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                  Más de Cuatro Décadas al<br className="hidden md:block" /> Servicio del Diagnóstico Dental
                </h2>
                <p className="text-neutral-300 text-base md:text-lg leading-relaxed mb-6 max-w-2xl">
                  Con <strong className="text-amber-400">más de 40 años</strong> en el rubro, somos una institución de referencia en radiodiagnóstico dentomaxilofacial en el Gran Buenos Aires. Nuestra trayectoria es el resultado de la confianza de miles de profesionales odontológicos que nos eligen día a día, y de un equipo humano comprometido con la precisión diagnóstica y el trato al paciente.
                </p>
                <p className="text-neutral-400 text-sm md:text-base leading-relaxed max-w-2xl">
                  A lo largo de estos años hemos incorporado tecnología de última generación, ampliado nuestras sedes y consolidado un modelo de atención ágil, sin turno previo y con entrega inmediata — porque el tiempo del profesional y del paciente siempre fue nuestra prioridad.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* SECCIÓN: OBRAS SOCIALES (COBERTURAS) */}
        <section className="py-10 md:py-12 bg-white border-b border-neutral-200 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-bold text-neutral-400 uppercase tracking-widest mb-8">Trabajamos con las principales coberturas médicas</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="text-xl md:text-2xl font-black text-neutral-800">OSDE</span>
              <span className="text-xl md:text-2xl font-black text-neutral-800">SWISS MEDICAL</span>
              <span className="text-xl md:text-2xl font-black text-neutral-800">GALENO</span>
              <span className="text-xl md:text-2xl font-black text-neutral-800">IOMA</span>
              <span className="text-xl md:text-2xl font-black text-neutral-800">MEDICUS</span>
              <span className="text-xl md:text-2xl font-black text-neutral-800">SANCOR SALUD</span>
            </div>
          </div>
        </section>

        {/* SECCIÓN INFORMACIÓN GENERAL */}
        <section className="py-16 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-neutral-800 uppercase mb-8 pb-2 border-b-2 border-neutral-200">
              Información Importante
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-bold text-neutral-800 mb-3 flex items-center gap-2">
                  <Clock className="text-red-600" size={24} /> Sin Turno Previo
                </h4>
                <p className="text-sm text-neutral-600">
                  No es necesario solicitar turno. Los estudios se realizan en cualquiera de nuestras sedes por orden de llegada.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-bold text-neutral-800 mb-3 flex items-center gap-2">
                  <Activity className="text-red-600" size={24} /> Preparación
                </h4>
                <p className="text-sm text-neutral-600">
                  Los estudios que realizamos no requieren ninguna consideración o preparación especial previa.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-bold text-neutral-800 mb-3 flex items-center gap-2">
                  <FileText className="text-red-600" size={24} /> Entrega
                </h4>
                <p className="text-sm text-neutral-600">
                  Se entregan en el momento, salvo las Tomografías en 3D y los trazados Cefalométricos que demoran 48 horas.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-bold text-neutral-800 mb-3 flex items-center gap-2">
                  <ShieldCheck className="text-red-600" size={24} /> Obras Sociales
                </h4>
                <p className="text-sm text-neutral-600">
                  Ofrecemos una amplia cobertura. Tenemos descuentos para todas las obras sociales, aún aquellas que no estén en la lista.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN TECNOLOGÍA SIRONA AXEOS */}
        <section id="tecnologia" className="py-20 md:py-24 bg-neutral-900 text-white relative overflow-hidden">
          {/* Imagen de RX Panorámica */}
          <div className="absolute inset-0 opacity-20">
            <img src="https://images.unsplash.com/photo-1570625686884-3c8115663ec4?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover mix-blend-luminosity" alt="RX Panorámica Dental" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-12 md:gap-16">
            <div className="lg:w-1/2">
              <div className="inline-block bg-red-600/20 border border-red-500/50 px-4 py-1.5 rounded-full mb-6">
                <span className="text-xs md:text-sm font-bold tracking-widest text-red-500 uppercase">Calidad y Precisión Alemana</span>
              </div>
              <h3 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Equipamiento <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">Dentsply Sirona AXEOS</span></h3>
              <p className="text-neutral-300 text-base md:text-lg mb-8 font-light leading-relaxed">
                El <strong>AXEOS</strong> es uno de los sistemas de radiodiagnóstico dental más avanzados del mundo. Desarrollado por <strong>Dentsply Sirona</strong> — líder mundial en tecnología odontológica — combina radiografía panorámica 2D, cefalometría y tomografía cone beam 3D en un único equipo de altísima precisión, con la dosis de radiación más baja posible para el paciente.
              </p>
              <ul className="space-y-4 mb-8">
                 <li className="flex items-center gap-3 font-medium text-sm md:text-base"><CheckCircle2 className="text-red-500 shrink-0"/> Imágenes panorámicas y 3D de resolución excepcional en un solo equipo.</li>
                 <li className="flex items-center gap-3 font-medium text-sm md:text-base"><CheckCircle2 className="text-red-500 shrink-0"/> Dosis de radiación optimizada: máxima imagen, mínima exposición.</li>
                 <li className="flex items-center gap-3 font-medium text-sm md:text-base"><CheckCircle2 className="text-red-500 shrink-0"/> FOV flexible: desde periapicales hasta reconstrucciones craneofaciales completas.</li>
                 <li className="flex items-center gap-3 font-medium text-sm md:text-base"><CheckCircle2 className="text-red-500 shrink-0"/> Posicionamiento inteligente y ergonómico para pacientes de cualquier edad.</li>
                 <li className="flex items-center gap-3 font-medium text-sm md:text-base"><CheckCircle2 className="text-red-500 shrink-0"/> Compatible con los principales softwares de planificación implantológica.</li>
              </ul>
            </div>
            <div className="lg:w-1/2 relative w-full">
               <div className="absolute -inset-4 bg-red-600/20 blur-3xl rounded-full"></div>
               {/* Imagen representativa de un escáner/tecnología médica */}
               <img
                 src="/salarx.jpg"
                 className="relative rounded-2xl shadow-2xl border border-neutral-700/50 w-full object-cover h-[350px] md:h-[500px]"
                 alt="Sala de Rayos I-R Dental"
               />
            </div>
          </div>
        </section>

        {/* SECCIÓN SERVICIOS */}
        <section id="servicios" className="py-20 bg-neutral-50 border-t border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-neutral-800 uppercase mb-12 pb-2 border-b-2 border-neutral-200 inline-block">
              Nuestros Servicios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Servicio 1 */}
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-2xl hover:border-red-200 transition-all duration-300 group flex flex-col">
                <div className="h-48 overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1606282845347-75e11409da7d?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 mix-blend-luminosity opacity-90 group-hover:mix-blend-normal group-hover:opacity-100" alt="Tomografías en 3D" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <Activity size={32} />
                  </div>
                </div>
                <div className="p-6 flex-grow">
                  <h3 className="font-bold text-neutral-800 text-xl mb-2">Tomografías en 3D</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">Estudios de alta precisión (Cone Beam). Evaluación pre implantológica e imágenes detalladas en 3D para diagnósticos exactos.</p>
                </div>
              </div>

              {/* Servicio 2 */}
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-2xl hover:border-red-200 transition-all duration-300 group flex flex-col">
                <div className="h-48 overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 mix-blend-luminosity opacity-90 group-hover:mix-blend-normal group-hover:opacity-100" alt="Placas Intraorales" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <Scan size={32} />
                  </div>
                </div>
                <div className="p-6 flex-grow">
                  <h3 className="font-bold text-neutral-800 text-xl mb-2">Placas Intraorales</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">Estudios Oclusales, Palatales y Seriadas de 14 películas. Resolución superior para un diagnóstico dental minucioso.</p>
                </div>
              </div>

              {/* Servicio 3 */}
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-2xl hover:border-red-200 transition-all duration-300 group flex flex-col">
                <div className="h-48 overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1599304609802-bd921bf3a5ec?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 mix-blend-luminosity opacity-90 group-hover:mix-blend-normal group-hover:opacity-100" alt="Placas Extraorales" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <FileText size={32} />
                  </div>
                </div>
                <div className="p-6 flex-grow">
                  <h3 className="font-bold text-neutral-800 text-xl mb-2">Placas Extraorales</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">Radiografías Panorámicas de campo completo, Telerradiografías y estudios específicos de ATM (Articulación Temporomandibular).</p>
                </div>
              </div>

              {/* Servicio 4 */}
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-2xl hover:border-red-200 transition-all duration-300 group flex flex-col">
                <div className="h-48 overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1588776813677-77ade49edab2?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 mix-blend-luminosity opacity-90 group-hover:mix-blend-normal group-hover:opacity-100" alt="Fotografías Clínicas" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <Camera size={32} />
                  </div>
                </div>
                <div className="p-6 flex-grow">
                  <h3 className="font-bold text-neutral-800 text-xl mb-2">Fotografías Clínicas</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">Registro fotográfico profesional y especializado, ideal para planificar y documentar tratamientos de ortodoncia e implantes.</p>
                </div>
              </div>

              {/* Servicio 5 */}
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-2xl hover:border-red-200 transition-all duration-300 group flex flex-col lg:col-span-2">
                <div className="h-48 overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1598331668826-20cefac91e06?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 mix-blend-luminosity opacity-90 group-hover:mix-blend-normal group-hover:opacity-100 object-center" alt="Análisis Cefalométricos" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <ToothIcon size={32} />
                  </div>
                </div>
                <div className="p-6 flex-grow">
                  <h3 className="font-bold text-neutral-800 text-xl mb-2">Análisis Cefalométricos</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">Trazados computados precisos mediante software especializado para la planificación y seguimiento efectivo de tratamientos ortodóncicos y maxilofaciales.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* NUEVA SECCIÓN: PREGUNTAS FRECUENTES (FAQ) */}
        <section className="py-20 bg-white border-t border-neutral-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-neutral-800 uppercase mb-12 pb-2 text-center flex items-center justify-center gap-3">
              <HelpCircle className="text-red-600" size={32} /> Preguntas Frecuentes
            </h2>
            <div className="space-y-6">
              <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
                <h4 className="font-bold text-neutral-800 text-lg mb-2">¿Necesito llevar la orden médica impresa?</h4>
                <p className="text-sm text-neutral-600">Aceptamos tanto órdenes impresas como órdenes médicas digitales (en formato PDF o foto clara) enviadas por WhatsApp al momento de presentarse en la recepción.</p>
              </div>
              <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
                <h4 className="font-bold text-neutral-800 text-lg mb-2">¿Atienden urgencias?</h4>
                <p className="text-sm text-neutral-600">Sí, todos nuestros estudios radiográficos convencionales se realizan sin turno previo por orden de llegada, facilitando la atención de urgencias dentales.</p>
              </div>
              <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
                <h4 className="font-bold text-neutral-800 text-lg mb-2">¿Cómo recibe mi odontólogo los resultados?</h4>
                <p className="text-sm text-neutral-600">Su odontólogo puede acceder a todos sus estudios (imágenes 2D, tomografías 3D e informes) en alta resolución a través de nuestro <strong>Portal Profesional</strong> exclusivo de forma inmediata.</p>
              </div>
            </div>
          </div>
        </section>

        {/* BANNER: DESCARGA DE ORDEN MÉDICA */}
        <section className="bg-red-600 py-12 md:py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://placehold.co/1920x400/cc0000/990000?text=+')] opacity-20 bg-cover mix-blend-multiply"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">¿Odontólogo Derivante?</h2>
              <p className="text-red-100 text-sm md:text-base max-w-xl">
                Si se quedó sin talonarios físicos, puede descargar nuestra orden de derivación oficial en formato PDF, lista para imprimir y entregar a sus pacientes.
              </p>
            </div>
            <a 
              href="/orden.pdf" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-white hover:bg-neutral-100 text-red-600 px-8 py-4 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-3 whitespace-nowrap"
            >
              <Download size={24} /> 
              DESCARGAR ORDEN
            </a>
          </div>
        </section>

        {/* SECCIÓN SEDES */}
        <section id="sedes" className="py-20 bg-neutral-100 border-t border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-neutral-800 uppercase mb-12 pb-2 border-b-2 border-neutral-200 inline-block">
              Nuestras Sedes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Sede Quilmes */}
              <div className="bg-white rounded-xl overflow-hidden border border-neutral-200 hover:border-red-300 transition-colors shadow-lg flex flex-col">
                <iframe 
                  src="https://maps.google.com/maps?q=Olavarria%2088,%20Quilmes&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="250" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="bg-neutral-200 grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                ></iframe>
                <div className="p-8 flex-grow">
                  <h3 className="text-2xl font-bold text-red-600 uppercase mb-6">Quilmes</h3>
                  <ul className="space-y-4 text-sm text-neutral-700">
                    <li className="flex items-start gap-4"><MapPin className="text-neutral-400 mt-0.5 shrink-0" size={18} /> <span className="font-medium text-base">OLAVARRIA 88</span></li>
                    <li className="flex items-start gap-4"><Phone className="text-neutral-400 mt-0.5 shrink-0" size={18} /> <span className="font-medium text-base">Tel. 4253-5947</span></li>
                    <li className="flex items-start gap-4"><MessageCircle className="text-green-600 mt-0.5 shrink-0" size={18} /> <span className="font-medium text-base text-green-700">Whatsapp. 11-3333-3333</span></li>
                  </ul>
                </div>
              </div>

              {/* Sede Avellaneda */}
              <div className="bg-white rounded-xl overflow-hidden border border-neutral-200 hover:border-red-300 transition-colors shadow-lg flex flex-col">
                <iframe 
                  src="https://maps.google.com/maps?q=9%20de%20Julio%2064,%20Avellaneda&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="250" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="bg-neutral-200 grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                ></iframe>
                <div className="p-8 flex-grow">
                  <h3 className="text-2xl font-bold text-red-600 uppercase mb-6">Avellaneda</h3>
                  <ul className="space-y-4 text-sm text-neutral-700">
                    <li className="flex items-start gap-4"><MapPin className="text-neutral-400 mt-0.5 shrink-0" size={18} /> <span className="font-medium text-base">9 de Julio 64 - 2do. "A"</span></li>
                    <li className="flex items-start gap-4"><Phone className="text-neutral-400 mt-0.5 shrink-0" size={18} /> <span className="font-medium text-base">Tel. 4210-0148</span></li>
                    <li className="flex items-start gap-4"><MessageCircle className="text-green-600 mt-0.5 shrink-0" size={18} /> <span className="font-medium text-base text-green-700">Whatsapp. 11-5555-9999</span></li>
                  </ul>
                </div>
              </div>

              {/* Sede Lomas de Zamora */}
              <div className="bg-white rounded-xl overflow-hidden border border-neutral-200 hover:border-red-300 transition-colors shadow-lg flex flex-col">
                <iframe 
                  src="https://maps.google.com/maps?q=Espa%C3%B1a%20156,%20Lomas%20de%20Zamora&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="250" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="bg-neutral-200 grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                ></iframe>
                <div className="p-8 flex-grow">
                  <h3 className="text-2xl font-bold text-red-600 uppercase mb-6">Lomas de Zamora</h3>
                  <ul className="space-y-4 text-sm text-neutral-700">
                    <li className="flex items-start gap-4"><MapPin className="text-neutral-400 mt-0.5 shrink-0" size={18} /> <span className="font-medium text-base">ESPAÑA 156 - Planta Baja</span></li>
                    <li className="flex items-start gap-4"><Phone className="text-neutral-400 mt-0.5 shrink-0" size={18} /> <span className="font-medium text-base">Tel. 4222-1111</span></li>
                    <li className="flex items-start gap-4"><MessageCircle className="text-green-600 mt-0.5 shrink-0" size={18} /> <span className="font-medium text-base text-green-700">Whatsapp. 11-6666-9999</span></li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-black py-10 text-neutral-400 text-sm border-t-4 border-red-600 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-neutral-800 pb-8 mb-8">
            <div>
              <img src="/logo.png?v=1" alt="I-R Dental" className="h-10 w-auto brightness-0 invert opacity-80 hover:opacity-100 transition-opacity" />
            </div>
            {/* REDES SOCIALES (NUEVO) */}
            <div className="flex gap-4">
              <a href="#" className="bg-neutral-800 p-3 rounded-full hover:bg-red-600 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="bg-neutral-800 p-3 rounded-full hover:bg-red-600 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
            </div>
          </div>
          <p className="text-center md:text-left text-neutral-500">
            © {new Date().getFullYear()} Instituto Radiodiagnóstico Dentomaxilofacial S.A. <br className="md:hidden" /> Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* MENÚ FLOTANTE DE WHATSAPP MULTI-SUCURSAL */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end group">
        
        {/* Opciones (Se muestran al pasar el mouse por encima) */}
        <div className="flex-col gap-3 mb-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 translate-y-4 group-hover:translate-y-0 flex">
          
          <a href="https://wa.me/5491133333333" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-lg hover:bg-neutral-50 hover:scale-105 transition-all border border-neutral-100">
            <span className="font-bold text-neutral-700 text-sm">Quilmes</span>
            <div className="bg-green-500 text-white p-2 rounded-full"><MessageCircle size={20} /></div>
          </a>

          <a href="https://wa.me/5491155559999" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-lg hover:bg-neutral-50 hover:scale-105 transition-all border border-neutral-100">
            <span className="font-bold text-neutral-700 text-sm">Avellaneda</span>
            <div className="bg-green-500 text-white p-2 rounded-full"><MessageCircle size={20} /></div>
          </a>

          <a href="https://wa.me/5491166669999" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-lg hover:bg-neutral-50 hover:scale-105 transition-all border border-neutral-100">
            <span className="font-bold text-neutral-700 text-sm">Lomas de Zamora</span>
            <div className="bg-green-500 text-white p-2 rounded-full"><MessageCircle size={20} /></div>
          </a>

        </div>

        {/* Botón Principal Flotante */}
        <button 
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-transform duration-300 flex items-center justify-center group-hover:shadow-green-500/50"
          title="Contactanos por WhatsApp"
        >
          <MessageCircle size={32} />
        </button>

      </div>
      
    </div>
  )
}