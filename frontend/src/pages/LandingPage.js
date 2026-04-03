import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import Marquee from 'react-fast-marquee';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import useEmblaCarousel from 'embla-carousel-react';
import { 
  TrendingUp, Users, Shield, Zap, Wallet, ArrowRight, Award, Globe, Lock, 
  Smartphone, RefreshCw, ChevronDown, ChevronUp, Star, ChevronLeft, 
  ChevronRight, Quote, HelpCircle, Sparkles, Check, Clock
} from 'lucide-react';
import { membershipAPI, cryptoAPI } from '@/api';
import { formatCurrency } from '@/utils';

const LandingPage = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [cryptoData, setCryptoData] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [selectedTestimonial, setSelectedTestimonial] = useState(0);

  // Particle init
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesOptions = useMemo(() => ({
    fullScreen: false,
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    particles: {
      color: { value: ['#D4AF37', '#E5C158', '#B8962E'] },
      links: { enable: false },
      move: { enable: true, speed: 0.5, direction: 'none', random: true, straight: false, outModes: { default: 'out' } },
      number: { value: 50, density: { enable: true, area: 800 } },
      opacity: { value: { min: 0.1, max: 0.4 }, animation: { enable: true, speed: 0.5, minimumValue: 0.1 } },
      shape: { type: 'circle' },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  }), []);

  // FAQ Data
  const faqData = [
    { question: "How do I start investing with MINEX GLOBAL?", answer: "Simply register using a referral link, verify your email, make a deposit, and choose an investment package that suits your budget. Your daily ROI will start accumulating automatically." },
    { question: "What is the minimum investment amount?", answer: "The minimum investment starts at $50 for Level 1. Higher levels have higher minimums but also offer better daily ROI rates, reaching up to 4.1% daily at Level 6." },
    { question: "How does the referral commission system work?", answer: "You earn direct commission (up to 18%) when your direct referrals make deposits. Additionally, you receive profit sharing from the daily ROI earnings of your team members across multiple levels." },
    { question: "When can I withdraw my earnings?", answer: "Withdrawals are processed on designated days (typically 1st and 15th of each month). You can withdraw your ROI and commission earnings anytime during these windows." },
    { question: "Is my investment secure?", answer: "We use bank-grade security protocols, encrypted transactions, and secure wallet infrastructure. All deposits are held in cold storage with multi-signature protection." },
    { question: "What happens after my investment duration ends?", answer: "After your investment package duration completes (typically 365 days), your original capital is returned to your wallet balance, plus all the ROI you've earned throughout the period." }
  ];

  // Testimonials Data
  const testimonials = [
    { name: "Michael R.", location: "United States", image: "https://randomuser.me/api/portraits/men/32.jpg", text: "Started with just $500 and now earning consistently every day. The automated ROI system is incredible!", earnings: "$12,450", rating: 5 },
    { name: "Sarah K.", location: "United Kingdom", image: "https://randomuser.me/api/portraits/women/44.jpg", text: "The referral program helped me build a passive income stream. Best crypto platform I've used.", earnings: "$28,320", rating: 5 },
    { name: "James L.", location: "Australia", image: "https://randomuser.me/api/portraits/men/52.jpg", text: "Transparent, reliable, and consistent returns. MINEX has changed my financial future.", earnings: "$45,890", rating: 5 },
    { name: "Emma W.", location: "Canada", image: "https://randomuser.me/api/portraits/women/68.jpg", text: "Customer support is amazing and withdrawals are always processed on time. Highly recommend!", earnings: "$18,670", rating: 5 }
  ];

  useEffect(() => {
    loadPackages();
    loadCryptoPrices();
    const interval = setInterval(loadCryptoPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedTestimonial(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi]);

  const loadPackages = async () => {
    try {
      const response = await membershipAPI.getPackages();
      setPackages(response.data);
    } catch (error) {
      console.error('Failed to load packages');
    }
  };

  const loadCryptoPrices = async () => {
    try {
      const response = await cryptoAPI.getPrices();
      if (response.data && response.data.length > 0) {
        setCryptoData(response.data);
      } else {
        setCryptoData(getDefaultCryptoData());
      }
    } catch (error) {
      setCryptoData(getDefaultCryptoData());
    } finally {
      setLoadingPrices(false);
    }
  };

  const getDefaultCryptoData = () => [
    { name: 'BTC', price: '$67,500.00', change: '+2.34%', positive: true },
    { name: 'ETH', price: '$3,450.00', change: '+1.89%', positive: true },
    { name: 'USDT', price: '$1.00', change: '+0.01%', positive: true },
    { name: 'BNB', price: '$580.00', change: '-0.52%', positive: false },
    { name: 'SOL', price: '$145.00', change: '+5.67%', positive: true },
    { name: 'XRP', price: '$0.52', change: '+3.21%', positive: true },
    { name: 'ADA', price: '$0.45', change: '+1.45%', positive: true },
    { name: 'DOGE', price: '$0.12', change: '-1.23%', positive: false },
  ];

  const features = [
    { icon: Award, title: 'Premium Returns', desc: 'Earn up to 1496.5% annualized returns with our advanced trading algorithms', gradient: 'from-[#D4AF37] to-[#B8962E]', size: 'lg' },
    { icon: Globe, title: 'Global Network', desc: 'Build your worldwide team and earn commissions', gradient: 'from-[#D4AF37] to-[#E5C158]', size: 'md' },
    { icon: Lock, title: 'Bank-Grade Security', desc: 'Your assets are protected 24/7', gradient: 'from-[#B8962E] to-[#D4AF37]', size: 'md' },
    { icon: Smartphone, title: 'Mobile First', desc: 'Trade anytime, anywhere', gradient: 'from-[#D4AF37] to-[#B8962E]', size: 'sm' },
    { icon: Wallet, title: 'Instant Payouts', desc: 'Real-time commission distribution', gradient: 'from-[#E5C158] to-[#D4AF37]', size: 'sm' },
    { icon: TrendingUp, title: 'Automated ROI', desc: 'Earn passive income daily', gradient: 'from-[#D4AF37] to-[#E5C158]', size: 'sm' }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0A0A0A]/90 backdrop-blur-2xl border-b border-[#D4AF37]/10" data-testid="landing-navbar">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center space-x-2">
              <img src="https://customer-assets.emergentagent.com/job_a9d66ba7-0c44-4716-b6dc-8595a53033f1/artifacts/pwb3ur38_minxlogo.png" alt="MINEX" className="h-8 md:h-10" />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center space-x-2 md:space-x-4">
              <Link to="/login" data-testid="nav-login-btn">
                <button className="text-sm md:text-base px-4 md:px-6 py-2.5 text-[#E0E0E0] border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:text-[#D4AF37] rounded-lg transition-all duration-300">Login</button>
              </Link>
              <Link to="/register" data-testid="nav-register-btn">
                <button className="btn-primary text-sm md:text-base px-4 md:px-6 py-2.5">Get Started</button>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Particles */}
      <section className="relative pt-24 md:pt-32 pb-20 md:pb-32 min-h-screen flex items-center overflow-hidden" data-testid="hero-section">
        <Particles className="absolute inset-0 z-0" init={particlesInit} options={particlesOptions} />
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-[#0A0A0A] to-[#D4AF37]/5"></div>
          <div className="absolute top-20 left-10 w-72 md:w-[500px] h-72 md:h-[500px] bg-[#D4AF37]/15 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-10 w-72 md:w-[400px] h-72 md:h-[400px] bg-[#D4AF37]/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 md:w-[600px] h-96 md:h-[600px] bg-[#D4AF37]/5 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 w-full">
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 md:px-6 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full text-[#D4AF37] text-xs md:text-sm font-semibold tracking-wide backdrop-blur-sm">
                <Sparkles className="w-4 h-4" /> PREMIUM CRYPTO STAKING PLATFORM
              </span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#E0E0E0] mb-6 leading-tight font-display" data-testid="hero-title">
              <span className="block mb-2">Build Your</span>
              <span className="text-[#D4AF37] block">
                <TypeAnimation sequence={['Wealth Empire', 2000, 'Passive Income', 2000, 'Financial Future', 2000, 'Crypto Portfolio', 2000]} wrapper="span" speed={50} repeat={Infinity} />
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-base md:text-lg lg:text-xl text-[#A0A0A0] mb-10 max-w-3xl mx-auto leading-relaxed px-4" data-testid="hero-subtitle">
              Maximize your crypto holdings with <span className="text-[#D4AF37] font-semibold">daily ROI up to 4.1%</span>, earn referral commissions up to <span className="text-[#D4AF37] font-semibold">18%</span>, and unlock premium investment tiers.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link to="/register" data-testid="hero-start-btn">
                <button className="btn-primary flex items-center justify-center gap-2 text-base md:text-lg px-8 md:px-10 py-4 w-full sm:w-auto">
                  Start Earning Now <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <button onClick={() => document.getElementById('packages').scrollIntoView({ behavior: 'smooth' })} data-testid="hero-packages-btn" className="btn-secondary text-base md:text-lg px-8 md:px-10 py-4 w-full sm:w-auto">
                Explore Plans
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 md:mt-24 max-w-4xl mx-auto">
              {[
                { icon: TrendingUp, value: '4.1%', label: 'Daily ROI', color: '#D4AF37' },
                { icon: Shield, value: '6', label: 'Levels', color: '#D4AF37' },
                { icon: Users, value: '18%', label: 'Commission', color: '#D4AF37' },
                { icon: Zap, value: '365', label: 'Days Lock', color: '#D4AF37' },
              ].map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <motion.div key={idx} whileHover={{ scale: 1.05, y: -5 }} className="glass-card p-4 md:p-6 text-center group cursor-pointer">
                    <div className="p-3 rounded-xl inline-block mb-3" style={{ backgroundColor: `${item.color}20` }}>
                      <ItemIcon className="w-6 h-6" style={{ color: item.color }} />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-[#E0E0E0]">{item.value}</div>
                    <div className="text-xs md:text-sm text-[#A0A0A0]">{item.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Crypto Ticker */}
      <section className="py-4 bg-[#020617] border-y border-white/5" data-testid="crypto-ticker">
        <div className="flex items-center justify-center gap-2 mb-3 px-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-[#A0A0A0] uppercase tracking-wider">Live Prices</span>
          <RefreshCw className={`w-3 h-3 text-[#A0A0A0] ${loadingPrices ? 'animate-spin' : ''}`} />
        </div>
        <Marquee gradient={false} speed={40} className="overflow-hidden">
          {cryptoData.map((crypto, idx) => (
            <div key={idx} className="flex items-center gap-3 mx-4 md:mx-6 px-4 py-2 bg-white/5 rounded-lg border border-white/5">
              <span className="text-[#E0E0E0] font-semibold text-sm">{crypto.name}</span>
              <span className="text-[#E0E0E0] font-mono text-sm">{crypto.price}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${crypto.positive ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                {crypto.change}
              </span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="py-20 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12 md:mb-20">
            <span className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold mb-4 block">Why Choose Us</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#E0E0E0] mb-4 font-display">Why Choose <span className="text-[#D4AF37]">MINEX GLOBAL</span></h2>
            <p className="text-[#A0A0A0] text-base md:text-lg max-w-2xl mx-auto">Experience the most advanced crypto staking platform</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            {/* Large Card */}
            {(() => {
              const Feature0Icon = features[0].icon;
              return (
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ scale: 1.02 }} className="md:col-span-8 glass-card p-6 md:p-8 group relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${features[0].gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  <div className={`p-4 rounded-2xl inline-block mb-4 bg-gradient-to-br ${features[0].gradient}`}>
                    <Feature0Icon className="w-8 h-8 text-[#E0E0E0]" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-[#E0E0E0] mb-3">{features[0].title}</h3>
                  <p className="text-[#A0A0A0] text-base md:text-lg leading-relaxed">{features[0].desc}</p>
                </motion.div>
              );
            })()}
            
            {/* Medium Cards */}
            {features.slice(1, 3).map((feature, idx) => {
              const FeatureIcon = feature.icon;
              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} whileHover={{ scale: 1.02 }} className="md:col-span-4 glass-card p-6 group relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  <div className={`p-3 rounded-xl inline-block mb-3 bg-gradient-to-br ${feature.gradient}`}>
                    <FeatureIcon className="w-6 h-6 text-[#E0E0E0]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#E0E0E0] mb-2">{feature.title}</h3>
                  <p className="text-[#A0A0A0] text-sm">{feature.desc}</p>
                </motion.div>
              );
            })}
            
            {/* Small Cards */}
            {features.slice(3).map((feature, idx) => {
              const FeatureIcon = feature.icon;
              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} whileHover={{ scale: 1.02 }} className="md:col-span-4 glass-card p-5 group relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg bg-gradient-to-br ${feature.gradient}`}>
                      <FeatureIcon className="w-5 h-5 text-[#E0E0E0]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#E0E0E0]">{feature.title}</h3>
                      <p className="text-[#A0A0A0] text-xs">{feature.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Investment Packages - Pricing Cards */}
      <section id="packages" className="py-20 md:py-32 relative" data-testid="packages-section">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D4AF37]/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12 md:mb-20">
            <span className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold mb-4 block">Investment Plans</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#E0E0E0] mb-4 font-display" data-testid="packages-title">Investment <span className="text-[#D4AF37]">Packages</span></h2>
            <p className="text-[#A0A0A0] text-base md:text-lg">Choose your path to financial freedom</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
            {packages.slice(0, 6).map((pkg, idx) => {
              const isHighlighted = idx === 2 || pkg.level === 3;
              return (
                <motion.div
                  key={pkg.package_id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className={`relative rounded-2xl p-6 md:p-8 ${isHighlighted ? 'bg-[#141414] backdrop-blur-xl border-2 border-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.3)] lg:scale-105 z-10' : 'glass-card'}`}
                  data-testid={`package-level-${pkg.level}`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] rounded-full text-[#0A0A0A] text-xs font-bold uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold rounded-full">
                    Level {pkg.level}
                  </div>
                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-[#E0E0E0] mb-2">{pkg.name || `Tier ${pkg.level}`}</h3>
                    <div className="text-3xl md:text-4xl font-bold text-[#D4AF37] mb-6">{formatCurrency(pkg.min_investment)}</div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <span className="text-[#A0A0A0] text-sm">Daily ROI</span>
                        <span className="text-emerald-400 font-bold text-lg">{pkg.daily_roi}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl">
                        <span className="text-[#A0A0A0] text-sm">Annual ROI</span>
                        <span className="text-[#D4AF37] font-bold text-lg">{pkg.annual_roi}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                        <span className="text-[#A0A0A0] text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> Duration</span>
                        <span className="text-[#E0E0E0] font-semibold">365 Days</span>
                      </div>
                    </div>

                    {pkg.level >= 2 && (
                      <div className="border-t border-white/10 pt-4 mb-6">
                        <p className="text-xs text-[#A0A0A0] uppercase tracking-wider mb-3">Commission Rates</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20">
                            <div className="text-lg font-bold text-[#D4AF37]">{pkg.commission_lv_a || pkg.commission_direct || 0}%</div>
                            <div className="text-[10px] text-[#A0A0A0]">Direct</div>
                          </div>
                          <div className="text-center p-2 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20">
                            <div className="text-lg font-bold text-[#D4AF37]">{pkg.commission_lv_b || pkg.commission_level_2 || 0}%</div>
                            <div className="text-[10px] text-[#A0A0A0]">Lv.2</div>
                          </div>
                          <div className="text-center p-2 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20">
                            <div className="text-lg font-bold text-[#D4AF37]">{pkg.commission_lv_c || pkg.commission_level_3 || 0}%</div>
                            <div className="text-[10px] text-[#A0A0A0]">Lv.3</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <Link to="/register">
                      <button className={`w-full py-3.5 rounded-lg font-semibold transition-all duration-300 ${isHighlighted ? 'bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-[#E0E0E0] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]' : 'btn-secondary'}`}>
                        Select Plan <ArrowRight className="w-4 h-4 inline ml-2" />
                      </button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-20 md:py-32 relative" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12 md:mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold mb-4 block">Testimonials</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#E0E0E0] mb-4 font-display">What Our <span className="text-[#D4AF37]">Investors</span> Say</h2>
            <p className="text-[#A0A0A0] text-base md:text-lg">Real success stories from our community</p>
          </motion.div>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {testimonials.map((testimonial, idx) => (
                <div key={idx} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0 pl-4" data-testid={`testimonial-${idx}`}>
                  <div className="glass-card p-6 h-full relative">
                    <Quote className="absolute top-4 right-4 w-8 h-8 text-[#D4AF37]/20" />
                    <div className="flex items-center gap-4 mb-4">
                      <img src={testimonial.image} alt={testimonial.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#D4AF37]/30" />
                      <div>
                        <div className="text-[#E0E0E0] font-semibold">{testimonial.name}</div>
                        <div className="text-[#A0A0A0] text-sm">{testimonial.location}</div>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-[#E0E0E0] text-sm mb-6 leading-relaxed">"{testimonial.text}"</p>
                    <div className="pt-4 border-t border-white/10">
                      <div className="text-xs text-[#A0A0A0] uppercase tracking-wider">Total Earnings</div>
                      <div className="text-2xl font-bold text-emerald-400">{testimonial.earnings}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center gap-2 mt-8">
            <button onClick={() => emblaApi?.scrollPrev()} className="p-3 glass rounded-full hover:bg-white/10 transition" data-testid="testimonial-prev">
              <ChevronLeft className="w-5 h-5 text-[#E0E0E0]" />
            </button>
            {testimonials.map((_, idx) => (
              <button key={idx} onClick={() => emblaApi?.scrollTo(idx)} className={`w-2.5 h-2.5 rounded-full transition-all ${idx === selectedTestimonial ? 'bg-[#D4AF37] w-8' : 'bg-slate-600 hover:bg-slate-500'}`} />
            ))}
            <button onClick={() => emblaApi?.scrollNext()} className="p-3 glass rounded-full hover:bg-white/10 transition" data-testid="testimonial-next">
              <ChevronRight className="w-5 h-5 text-[#E0E0E0]" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section - Accordion */}
      <section className="py-20 md:py-32 relative" data-testid="faq-section">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D4AF37]/5 to-transparent"></div>
        <div className="max-w-3xl mx-auto px-4 md:px-8 relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full mb-4">
              <HelpCircle className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-sm font-semibold">Got Questions?</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#E0E0E0] mb-4 font-display">Frequently Asked <span className="text-[#D4AF37]">Questions</span></h2>
            <p className="text-[#A0A0A0] text-base md:text-lg">Everything you need to know about MINEX GLOBAL</p>
          </motion.div>

          <div className="space-y-3">
            {faqData.map((faq, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }} className="glass-card overflow-hidden" data-testid={`faq-item-${idx}`}>
                <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-white/5 transition-colors duration-300">
                  <span className="text-[#E0E0E0] font-semibold pr-4">{faq.question}</span>
                  <div className={`p-1.5 rounded-lg ${openFaq === idx ? 'bg-[#D4AF37]/20' : 'bg-white/5'} transition-colors duration-300`}>
                    {openFaq === idx ? <ChevronUp className="w-5 h-5 text-[#D4AF37]" /> : <ChevronDown className="w-5 h-5 text-[#A0A0A0]" />}
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <div className="px-6 pb-5 text-[#A0A0A0] text-sm leading-relaxed border-t border-white/5 pt-4">{faq.answer}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-8 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 via-transparent to-[#D4AF37]/20"></div>
            <div className="relative z-10">
              <Sparkles className="w-12 h-12 text-[#D4AF37] mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#E0E0E0] mb-6 font-display">Ready to Start <span className="text-[#D4AF37]">Earning?</span></h2>
              <p className="text-[#A0A0A0] text-base md:text-lg mb-8 max-w-xl mx-auto">Join thousands of investors already growing their wealth with MINEX GLOBAL</p>
              <Link to="/register">
                <button className="btn-primary text-base md:text-lg px-10 py-4">
                  Get Started Now <ArrowRight className="w-5 h-5 inline ml-2" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#020617] border-t border-white/5 py-8 md:py-12" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <img src="https://customer-assets.emergentagent.com/job_a9d66ba7-0c44-4716-b6dc-8595a53033f1/artifacts/pwb3ur38_minxlogo.png" alt="MINEX" className="h-8 mx-auto md:mx-0 mb-3" />
              <p className="text-[#A0A0A0] text-sm">© 2026 MINEX GLOBAL. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-8">
              <Link to="/login" className="text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors duration-300 text-sm">Login</Link>
              <Link to="/register" className="text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors duration-300 text-sm">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
