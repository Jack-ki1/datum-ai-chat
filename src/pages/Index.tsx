import { Link } from 'react-router-dom';
import { ArrowRight, Target, BarChart3, Brain, Database, ShieldCheck, CreditCard, Wifi, ShoppingCart, HeartPulse, GraduationCap, MapPin, Phone, Mail } from 'lucide-react';
import logoAsset from '@/assets/finese-logo.png.asset.json';
import { useAuth } from '@/hooks/useAuth';

const logo = logoAsset.url;

const solutions = [
  { icon: Target, title: 'Data Strategy', desc: 'We design data strategies that align with your business goals and drive results.' },
  { icon: BarChart3, title: 'Data Analytics', desc: 'Transform raw data into meaningful insights with advanced analytics.' },
  { icon: Brain, title: 'AI & Machine Learning', desc: 'Build intelligent models and machine learning solutions that scale.' },
  { icon: Database, title: 'Data Engineering', desc: 'We build robust data pipelines and platforms for modern businesses.' },
  { icon: ShieldCheck, title: 'Data Governance', desc: 'Ensure data quality, security and compliance across your organization.' },
];

const stats = [
  { value: '150+', label: 'Projects\nDelivered' },
  { value: '98%', label: 'Client\nSatisfaction' },
  { value: '50+', label: 'Data\nExperts' },
  { value: '30%', label: 'Average ROI\nIncrease' },
];

const industries = [
  { icon: CreditCard, title: 'Financial Services', desc: 'Risk modeling, fraud detection and regulatory reporting.' },
  { icon: Wifi, title: 'Telecommunications', desc: 'Customer analytics, churn prediction and network insights.' },
  { icon: ShoppingCart, title: 'Retail & E-commerce', desc: 'Demand forecasting, customer segmentation and more.' },
  { icon: HeartPulse, title: 'Healthcare', desc: 'Patient analytics, operational insights and better outcomes.' },
  { icon: GraduationCap, title: 'Education', desc: 'Performance analytics, student insights and data-driven decisions.' },
];

const cases = [
  { brand: 'Artel', sub: 'Artel Kenya', color: 'text-datum-red', desc: 'Improved customer retention by 25% using advanced churn prediction models.' },
  { brand: 'KDB', sub: 'KDB Bank', color: 'text-datum-green', desc: 'Streamlined risk assessment processes and reduced default rates by 18%.' },
  { brand: 'UNDA GROUP', sub: 'UNDA Group', color: 'text-foreground', desc: 'Optimized supply chain operations and improved efficiency by 22%.' },
];

const navLinks = ['Home', 'About Us', 'Services', 'Solutions', 'Industries', 'Resources'];

export default function Index() {
  const { session } = useAuth();
  const ctaHref = session ? '/chat' : '/auth';

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-brand-dark border-b border-white/10">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Finese Data" className="h-11 w-auto object-contain" />
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((l, i) => (
              <a key={l} href="#"
                className={`text-sm font-medium transition-colors ${i === 0
                  ? 'text-white border-b-2 border-primary pb-1'
                  : 'text-slate-300 hover:text-white'}`}>
                {l}
              </a>
            ))}
          </div>
          <Link to={ctaHref}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold hover:brightness-110 transition-all text-sm">
            {session ? 'Open App' : 'Contact Us'}
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section
          className="relative overflow-hidden py-24 md:py-32"
          style={{
            background:
              'radial-gradient(circle at 85% 50%, hsl(24 95% 53% / 0.18) 0%, transparent 55%), hsl(var(--brand-dark))',
          }}
        >
          <img src={logo} alt="" aria-hidden
            className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[55%] max-w-3xl opacity-[0.06] rotate-12 pointer-events-none select-none" />
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.05] mb-6 tracking-tight">
                INSIGHT.<br />INTELLIGENCE.<br />
                <span className="text-primary">IMPACT.</span>
              </h1>
              <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-lg leading-relaxed">
                We turn your data into actionable insights, intelligent solutions and measurable impact for your business.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to={ctaHref}
                  className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all">
                  Explore Solutions <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#contact"
                  className="border border-white/20 text-white px-8 py-4 rounded-lg font-bold inline-flex items-center gap-2 hover:bg-white/5 transition-all">
                  Talk to an Expert <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="hidden md:flex justify-end">
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl" />
                <img src={logo} alt="Finese Data mark"
                  className="relative w-full h-full object-contain drop-shadow-[0_20px_60px_rgba(249,115,22,0.35)]" />
              </div>
            </div>
          </div>
        </section>

        {/* Solutions */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16 max-w-2xl">
              <p className="text-primary font-bold text-sm uppercase tracking-wider mb-2">What We Do</p>
              <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Data Solutions That Drive Growth</h2>
              <p className="text-slate-600">
                We help organizations collect, analyze and leverage data to unlock new opportunities and stay ahead of the competition.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {solutions.map(s => (
                <div key={s.title} className="border border-slate-100 p-7 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                    <s.icon className="w-6 h-6 text-primary" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-slate-900">{s.title}</h3>
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed">{s.desc}</p>
                  <a href="#" className="text-primary font-bold text-sm inline-flex items-center gap-2 group">
                    Learn More <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-brand-dark py-20">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-primary font-bold text-sm uppercase tracking-widest mb-12">Impact That Matters</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map(s => (
                <div key={s.value} className="flex items-center gap-6 border-l-2 border-primary/30 pl-6">
                  <div className="text-4xl md:text-5xl font-extrabold text-white">{s.value}</div>
                  <div className="text-slate-400 text-sm leading-tight whitespace-pre-line">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industries */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <p className="text-primary font-bold text-sm uppercase tracking-wider mb-2">Industries We Serve</p>
                <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Solutions Tailored To Your Industry</h2>
              </div>
              <a href="#" className="border border-slate-300 text-slate-700 px-6 py-2.5 rounded-lg font-bold hover:bg-white transition-all text-sm">
                View All Industries
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {industries.map(i => (
                <div key={i.title} className="group cursor-pointer">
                  <div className="rounded-xl overflow-hidden mb-4 h-48 relative bg-gradient-to-br from-brand-dark via-slate-800 to-brand-dark flex items-center justify-center">
                    <i.icon className="w-16 h-16 text-white/40 group-hover:scale-110 group-hover:text-primary transition-all duration-500" strokeWidth={1.5} />
                    <div className="absolute bottom-4 left-4 bg-primary p-2 rounded-lg text-primary-foreground">
                      <i.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-slate-900">{i.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{i.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <p className="text-primary font-bold text-sm uppercase tracking-wider mb-2">Success Stories</p>
                <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Real Results From Real Partners</h2>
              </div>
              <a href="#" className="border border-slate-300 text-slate-700 px-6 py-2.5 rounded-lg font-bold hover:bg-slate-50 transition-all text-sm">
                View All Cases
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {cases.map(c => (
                <div key={c.brand} className="border border-slate-100 p-8 rounded-2xl bg-slate-50/50 hover:bg-white transition-all border-b-4 border-b-transparent hover:border-b-primary hover:shadow-lg">
                  <div className="flex items-center gap-3 mb-8">
                    <span className={`${c.color} font-extrabold text-2xl`}>{c.brand}</span>
                    <span className="text-slate-800 font-bold">{c.sub}</span>
                  </div>
                  <p className="text-slate-600 mb-8 leading-relaxed">{c.desc}</p>
                  <a href="#" className="text-primary font-bold text-sm inline-flex items-center gap-2 group">
                    Read Case Study <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-7xl mx-auto px-6 mb-24" id="contact">
          <div className="bg-brand-dark rounded-3xl p-12 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12">
            <img src={logo} alt="" aria-hidden
              className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[40%] opacity-[0.08] rotate-12 pointer-events-none" />
            <div className="relative z-10 max-w-xl">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                Ready to unlock the power of your data?
              </h2>
              <p className="text-slate-400 text-lg">Let's build intelligent solutions that drive real impact.</p>
            </div>
            <div className="relative z-10">
              <Link to={ctaHref}
                className="bg-primary text-primary-foreground px-10 py-5 rounded-xl font-bold text-lg hover:brightness-110 transition-all inline-flex items-center gap-3 whitespace-nowrap">
                Get Started Today <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brand-dark pt-20 pb-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div>
              <img src={logo} alt="Finese Data" className="h-14 mb-6 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs">
                We help businesses harness the power of data to create intelligent solutions that drive growth and impact.
              </p>
              <div className="flex gap-3">
                {['in', 't', 'f', 'i'].map(s => (
                  <a key={s} href="#" className="w-9 h-9 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-colors text-xs font-bold">
                    {s}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Quick Links</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                {navLinks.slice(0, 5).map(l => (
                  <li key={l}><a href="#" className="hover:text-primary transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Resources</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                {['Blog', 'Case Studies', 'Whitepapers', 'Careers', 'FAQs'].map(l => (
                  <li key={l}><a href="#" className="hover:text-primary transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Contact Us</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li className="flex items-start gap-3"><MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" /><span>Nairobi, Kenya</span></li>
                <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-primary shrink-0" /><span>+254 700 123 456</span></li>
                <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-primary shrink-0" /><span>hello@finesedata.com</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
            <p>© {new Date().getFullYear()} Finese Data. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
