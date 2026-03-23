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
  MessageCircle
} from "lucide-react"

// Forzamos el título de la pestaña del navegador
export const metadata = {
  title: 'I-R Dental',
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
                src="/logo.png?v=1" 
                alt="I-R Dental" 
                className="h-14 w-auto object-contain"
              />
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#tecnologia" className="text-sm font-semibold text-neutral-700 hover:text-red-600 transition-colors uppercase">Tecnología</a>
            <a href="#servicios" className="text-sm font-semibold text-neutral-700 hover:text-red-600 transition-colors uppercase">Servicios</a>
            <a href="#sedes" className="text-sm font-semibold text-neutral-700 hover:text-red-600 transition-colors uppercase">Sedes</a>
            <Link href="/portal-medico" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded text-sm font-bold transition-all shadow-md">
              PORTAL PROFESIONAL
            </Link>
          </div>
        </div>
      </header>

      {/* SECCIÓN HERO (PORTADA PRINCIPAL) */}
      <main className="flex-grow">
        <section className="relative bg-neutral-900 overflow-hidden border-b-[8px] border-red-600 min-h-[600px] flex items-center">
          {/* Fondo Premium Fotográfico */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed z-0 opacity-40 mix-blend-luminosity" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=1920')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-transparent z-0"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 w-full">
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
              {/* Portal Profesionales */}
              <div className="bg-white rounded-xl p-8 shadow-2xl border-t-4 border-red-600 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-red-50 p-3 rounded-full text-red-600">
                    <ToothIcon size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-800">Profesionales</h3>
                </div>
                <p className="text-neutral-600 text-sm mb-8 h-10">
                  Acceso exclusivo a estudios derivados, tomografías 3D e informes detallados.
                </p>
                <Link href="/portal-medico" className="flex items-center justify-between w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded font-bold text-sm transition-colors shadow-md">
                  PORTAL PROFESIONAL <ChevronRight size={20} />
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

        {/* SECCIÓN TECNOLOGÍA SIRONA AXEOS (NUEVA - CHETA) */}
        <section id="tecnologia" className="py-24 bg-neutral-900 text-white relative overflow-hidden">
          {/* Imagen de fondo desvanecida */}
          <div className="absolute inset-0 opacity-20">
            <img src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover mix-blend-luminosity" alt="RX Panorámica y Tecnología" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="inline-block bg-red-600/20 border border-red-500/50 px-4 py-1.5 rounded-full mb-6">
                <span className="text-sm font-bold tracking-widest text-red-500 uppercase">Calidad y Precisión Alemana</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Equipamiento <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">Dentsply Sirona AXEOS</span></h3>
              <p className="text-neutral-300 text-lg mb-8 font-light leading-relaxed">
                Elevamos el estándar del diagnóstico por imágenes. El sistema <strong>AXEOS</strong> ofrece volúmenes de campo de visión (FOV) flexibles y una calidad de imagen 2D panorámica y 3D excepcional. Todo esto logrando una dosis de radiación significativamente menor para la máxima tranquilidad y seguridad de sus pacientes.
              </p>
              <ul className="space-y-4 mb-8">
                 <li className="flex items-center gap-3 font-medium"><ChevronRight className="text-red-500 shrink-0"/> Alta nitidez y enfoque automático de precisión.</li>
                 <li className="flex items-center gap-3 font-medium"><ChevronRight className="text-red-500 shrink-0"/> Programas panorámicos extraorales y cefalométricos avanzados.</li>
                 <li className="flex items-center gap-3 font-medium"><ChevronRight className="text-red-500 shrink-0"/> Posicionamiento firme, seguro y sumamente cómodo.</li>
              </ul>
            </div>
            <div className="lg:w-1/2 relative">
               {/* Resplandor rojo detrás de la imagen para darle el look moderno */}
               <div className="absolute -inset-4 bg-red-600/20 blur-3xl rounded-full"></div>
               <img 
                 src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800" 
                 className="relative rounded-2xl shadow-2xl border border-neutral-700/50 w-full object-cover h-[500px]" 
                 alt="Sirona Axeos Scanner" 
               />
            </div>
          </div>
        </section>

        {/* SECCIÓN SERVICIOS (AHORA CON FOTOS PREMIUM) */}
        <section id="servicios" className="py-20 bg-neutral-50 border-t border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-neutral-800 uppercase mb-12 pb-2 border-b-2 border-neutral-200 inline-block">
              Nuestros Servicios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Servicio 1 */}
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-2xl hover:border-red-200 transition-all duration-300 group flex flex-col">
                <div className="h-48 overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 mix-blend-luminosity opacity-90 group-hover:mix-blend-normal group-hover:opacity-100" alt="Tomografías en 3D" />
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
                  <img src="https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 mix-blend-luminosity opacity-90 group-hover:mix-blend-normal group-hover:opacity-100" alt="Placas Intraorales" />
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
                  <img src="https://images.unsplash.com/photo-1582560475093-ba66accbc424?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 mix-blend-luminosity opacity-90 group-hover:mix-blend-normal group-hover:opacity-100" alt="Placas Extraorales" />
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
                  <img src="https://images.unsplash.com/photo-1598331668826-20cefac91e06?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 mix-blend-luminosity opacity-90 group-hover:mix-blend-normal group-hover:opacity-100" alt="Fotografías Clínicas" />
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
                  <img src="https://images.unsplash.com/photo-1576091160550-2173ff9e5ee5?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 mix-blend-luminosity opacity-90 group-hover:mix-blend-normal group-hover:opacity-100 object-top" alt="Análisis Cefalométricos" />
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

        {/* SECCIÓN SEDES */}
        <section id="sedes" className="py-20 bg-white border-t border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-neutral-800 uppercase mb-12 pb-2 border-b-2 border-neutral-100 inline-block">
              Nuestras Sedes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Sede Quilmes */}
              <div className="bg-neutral-50 rounded-xl overflow-hidden border border-neutral-200 hover:border-red-300 transition-colors shadow-lg flex flex-col">
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
              <div className="bg-neutral-50 rounded-xl overflow-hidden border border-neutral-200 hover:border-red-300 transition-colors shadow-lg flex flex-col">
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
              <div className="bg-neutral-50 rounded-xl overflow-hidden border border-neutral-200 hover:border-red-300 transition-colors shadow-lg flex flex-col">
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
      <footer className="bg-black py-10 text-neutral-400 text-sm border-t-4 border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <img src="/logo.png?v=1" alt="I-R Dental" className="h-10 w-auto brightness-0 invert opacity-80 hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-center md:text-right">
            © {new Date().getFullYear()} Instituto Radiodiagnóstico Dentomaxilofacial S.A. <br className="md:hidden" /> Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}