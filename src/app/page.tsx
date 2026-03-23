import Link from "next/link"
import { ArrowRight, Activity, Users, Laptop, Building2, ChevronRight, Stethoscope } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* NAVEGACIÓN (HEADER) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">
              IRD<span className="text-blue-600">Sistema</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#servicios" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase">Servicios</a>
            <a href="#sedes" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase">Sedes</a>
            <Link href="/login" className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-full text-sm font-bold uppercase transition-all shadow-md hover:shadow-lg">
              Portal Personal
            </Link>
          </div>
        </div>
      </header>

      {/* SECCIÓN HERO (PORTADA PRINCIPAL) */}
      <main className="flex-grow">
        <section className="relative bg-blue-600 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://placehold.co/1920x1080/1d4ed8/1e40af?text=+')] opacity-20 bg-cover bg-center mix-blend-multiply"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                Radiodiagnóstico Dental de <span className="text-blue-200">Alta Precisión</span>
              </h1>
              <p className="text-xl text-blue-100 mb-12 font-medium">
                Accedé a tus estudios y gestioná derivaciones clínicas en nuestro nuevo portal digital integrado. Rápido, seguro y desde cualquier dispositivo.
              </p>
            </div>

            {/* LAS 3 PUERTAS DE ACCESO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-8">
              
              {/* Acceso Pacientes */}
              <div className="bg-white rounded-3xl p-8 shadow-2xl transform transition-all hover:-translate-y-2 hover:shadow-blue-900/50 border-t-8 border-teal-400">
                <div className="bg-teal-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="h-8 w-8 text-teal-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase">Pacientes</h3>
                <p className="text-slate-600 mb-8 h-12">Visualizá y descargá los resultados de tus estudios usando tu código de acceso.</p>
                <Link href="/resultados" className="flex items-center justify-center gap-2 w-full bg-teal-500 hover:bg-teal-600 text-white py-4 rounded-xl font-bold uppercase transition-colors">
                  Ver mis Resultados <ArrowRight size={18} />
                </Link>
              </div>

              {/* Acceso Odontólogos */}
              <div className="bg-white rounded-3xl p-8 shadow-2xl transform transition-all hover:-translate-y-2 hover:shadow-blue-900/50 border-t-8 border-blue-600">
                <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase">Profesionales</h3>
                <p className="text-slate-600 mb-8 h-12">Portal exclusivo para odontólogos derivantes. Casos clínicos y métricas.</p>
                <Link href="/login" className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold uppercase transition-colors">
                  Acceso Médico <ArrowRight size={18} />
                </Link>
              </div>

              {/* Acceso Staff */}
              <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl transform transition-all hover:-translate-y-2 hover:shadow-blue-900/50 border-t-8 border-slate-400">
                <div className="bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <Laptop className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3 uppercase">Personal IRD</h3>
                <p className="text-slate-400 mb-8 h-12">Acceso al sistema de gestión para Recepción, Técnicos y Administración.</p>
                <Link href="/login" className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-xl font-bold uppercase transition-colors">
                  Ingresar al Sistema <ArrowRight size={18} />
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* SECCIÓN SERVICIOS */}
        <section id="servicios" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 uppercase">Nuestros Servicios</h2>
              <div className="w-24 h-2 bg-blue-600 mx-auto mt-6 rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {['Tomografía 3D (Cone Beam)', 'Radiografías Panorámicas', 'Estudios Intraorales', 'Análisis Cefalométrico'].map((servicio, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600 font-black">{idx + 1}</div>
                  <h4 className="text-lg font-bold text-slate-800">{servicio}</h4>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECCIÓN SEDES */}
        <section id="sedes" className="py-24 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-black text-slate-900 uppercase">Nuestras Sedes</h2>
                <p className="text-slate-500 mt-2 font-medium">Tecnología de punta cerca tuyo.</p>
              </div>
              <Building2 className="h-16 w-16 text-slate-200 hidden md:block" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {['Quilmes', 'Avellaneda', 'Lomas de Zamora'].map((sede) => (
                <div key={sede} className="bg-slate-50 rounded-3xl p-8 border-2 border-slate-100">
                  <h3 className="text-2xl font-black text-blue-900 uppercase mb-2">{sede}</h3>
                  <p className="text-slate-600 mb-4 text-sm font-medium">Centro de diagnóstico por imágenes dentomaxilofacial.</p>
                  <a href="#" className="text-blue-600 font-bold text-sm flex items-center hover:text-blue-800">Ver ubicación <ChevronRight size={16} /></a>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 py-12 border-t-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-black tracking-tighter text-white">
              IRD<span className="text-blue-500">Sistema</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            © {new Date().getFullYear()} Instituto Radiodiagnóstico Dentomaxilofacial S.A. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

