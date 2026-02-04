import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import Marquee from 'react-fast-marquee';
import { TrendingUp, Users, Shield, Zap, Wallet, ArrowRight, Award, Globe, Lock, Smartphone, RefreshCw, ChevronDown, ChevronUp, Star, ChevronLeft, ChevronRight, Quote, HelpCircle } from 'lucide-react';
import { membershipAPI, cryptoAPI } from '@/api';
import { formatCurrency } from '@/utils';

const LandingPage = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [cryptoData, setCryptoData] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [activePackageIndex, setActivePackageIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  // FAQ Data
  const faqData = [
    {
      question: "How do I start investing with MINEX GLOBAL?",
      answer: "Simply register using a referral link, verify your email, make a deposit, and choose an investment package that suits your budget. Your daily ROI will start accumulating automatically."
    },
    {
      question: "What is the minimum investment amount?",
      answer: "The minimum investment starts at $50 for Level 1. Higher levels have higher minimums but also offer better daily ROI rates, reaching up to 4.1% daily at Level 6."
    },
    {
      question: "How does the referral commission system work?",
      answer: "You earn direct commission (up to 18%) when your direct referrals make deposits. Additionally, you receive profit sharing from the daily ROI earnings of your team members across multiple levels."
    },
    {
      question: "When can I withdraw my earnings?",
      answer: "Withdrawals are processed on designated days (typically 1st and 15th of each month). You can withdraw your ROI and commission earnings anytime during these windows."
    },
    {
      question: "Is my investment secure?",
      answer: "We use bank-grade security protocols, encrypted transactions, and secure wallet infrastructure. All deposits are held in cold storage with multi-signature protection."
    },
    {
      question: "What happens after my investment duration ends?",
      answer: "After your investment package duration completes (typically 365 days), your original capital is returned to your wallet balance, plus all the ROI you've earned throughout the period."
    }
  ];

  // Testimonials Data
  const testimonials = [
    {
      name: "Michael R.",
      location: "United States",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      text: "Started with just $500 and now earning consistently every day. The automated ROI system is incredible!",
      earnings: "$12,450",
      rating: 5
    },
    {
      name: "Sarah K.",
      location: "United Kingdom",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      text: "The referral program helped me build a passive income stream. Best crypto platform I've used.",
      earnings: "$28,320",
      rating: 5
    },
    {
      name: "James L.",
      location: "Australia",
      image: "https://randomuser.me/api/portraits/men/52.jpg",
      text: "Transparent, reliable, and consistent returns. MINEX has changed my financial future.",
      earnings: "$45,890",
      rating: 5
    },
    {
      name: "Emma W.",
      location: "Canada",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      text: "Customer support is amazing and withdrawals are always processed on time. Highly recommend!",
      earnings: "$18,670",
      rating: 5
    }
  ];

  useEffect(() => {
    loadPackages();
    loadCryptoPrices();
    // Refresh prices every 60 seconds
    const interval = setInterval(loadCryptoPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate active packages
  useEffect(() => {
    if (packages.length > 0) {
      const timer = setInterval(() => {
        setActivePackageIndex((prev) => (prev + 1) % packages.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [packages.length]);

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
        // Fallback to default data
        setCryptoData(getDefaultCryptoData());
      }
    } catch (error) {
      console.error('Failed to load crypto prices');
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

  return (
    <div className="min-h-screen bg-[#02040A] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-2xl border-b border-white/5" data-testid="landing-navbar">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <img src="https://customer-assets.emergentagent.com/job_a9d66ba7-0c44-4716-b6dc-8595a53033f1/artifacts/pwb3ur38_minxlogo.png" alt="MINEX" className="h-8 md:h-10" />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2 md:space-x-4"
            >
              <Link to="/login" data-testid="nav-login-btn">
                <button className="text-sm md:text-base px-3 md:px-6 py-2 text-white border border-white/20 hover:border-white/40 rounded-lg transition-all">Login</button>
              </Link>
              <Link to="/register" data-testid="nav-register-btn">
                <button className="btn-primary text-sm md:text-base px-3 md:px-6 py-2">Get Started</button>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 min-h-[90vh] flex items-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-purple-950/30 to-[#02040A]"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-64 md:w-96 h-64 md:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-10 w-64 md:w-96 h-64 md:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 w-full">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-4 md:mb-6"
            >
              <span className="inline-block px-3 md:px-6 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-blue-300 text-xs md:text-sm font-bold tracking-wider backdrop-blur-sm">
                🚀 NEXT-GENERATION CRYPTO INVESTMENT
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 md:mb-6 leading-tight"
              data-testid="hero-title"
            >
              <span className="block mb-2">Unlock Your</span>
              <span className="text-gradient block">
                <TypeAnimation
                  sequence={[
                    'Crypto Fortune',
                    2000,
                    'Financial Freedom',
                    2000,
                    'Passive Income',
                    2000,
                    'Investment Power',
                    2000,
                  ]}
                  wrapper="span"
                  speed={50}
                  repeat={Infinity}
                />
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-sm sm:text-base md:text-lg text-gray-300 mb-6 md:mb-10 max-w-3xl mx-auto leading-relaxed px-4"
              data-testid="hero-subtitle"
            >
              Join the elite crypto trading community with <span className="text-blue-400 font-bold">up to 4.1% daily ROI</span>, multi-level commissions up to <span className="text-purple-400 font-bold">18%</span>, and exclusive investment packages.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4"
            >
              <Link to="/register" data-testid="hero-start-btn">
                <button className="btn-primary flex items-center gap-2 text-sm md:text-base px-6 md:px-10 py-3 md:py-4 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all w-full sm:w-auto justify-center">
                  Start Earning Now <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </Link>
              <button 
                onClick={() => document.getElementById('packages').scrollIntoView({ behavior: 'smooth' })} 
                data-testid="hero-packages-btn"
                className="text-sm md:text-base px-6 md:px-10 py-3 md:py-4 w-full sm:w-auto border border-white/20 hover:border-white/40 text-white rounded-lg transition-all"
              >
                Explore Plans
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-12 md:mt-20 max-w-4xl mx-auto"
            >
              {[
                { icon: TrendingUp, value: '4.1%', label: 'Daily ROI', color: 'blue' },
                { icon: Shield, value: '6', label: 'Levels', color: 'purple' },
                { icon: Users, value: '18%', label: 'Commission', color: 'green' },
                { icon: Zap, value: '2.5%', label: 'Staking', color: 'yellow' },
              ].map((item, idx) => (
                <div key={idx} className="glass rounded-xl p-4 md:p-5 text-center group hover:scale-105 transition-transform">
                  <div className={`p-2 bg-${item.color}-500/10 rounded-lg inline-block mb-2`}>
                    <item.icon className={`w-5 h-5 md:w-6 md:h-6 text-${item.color}-400`} />
                  </div>
                  <div className="text-xl md:text-2xl font-black text-white">{item.value}</div>
                  <div className="text-xs text-gray-400">{item.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Crypto Ticker */}
      <section className="py-4 bg-gradient-to-r from-gray-950/50 to-gray-900/50 border-y border-white/5" data-testid="crypto-ticker">
        <div className="flex items-center justify-center gap-2 mb-2 px-4">
          <span className="text-xs text-gray-500">Live Prices</span>
          <RefreshCw className={`w-3 h-3 text-gray-500 ${loadingPrices ? 'animate-spin' : ''}`} />
        </div>
        <Marquee gradient={false} speed={40} className="overflow-hidden">
          {cryptoData.map((crypto, idx) => (
            <div key={idx} className="flex items-center gap-2 mx-4 md:mx-6 px-4 py-2 bg-white/5 rounded-lg backdrop-blur-sm">
              <span className="text-white font-bold text-sm">{crypto.name}</span>
              <span className="text-gray-300 font-mono text-sm">{crypto.price}</span>
              <span className={`text-xs font-bold ${crypto.positive ? 'text-green-400' : 'text-red-400'}`}>
                {crypto.change}
              </span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">Why Choose <span className="text-gradient">MINEX GLOBAL</span></h2>
            <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">Experience the most advanced crypto trading platform</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              { icon: Award, title: 'Premium Returns', desc: 'Earn up to 1496.5% annualized returns', color: 'blue' },
              { icon: Globe, title: 'Global Network', desc: 'Build your worldwide team', color: 'purple' },
              { icon: Lock, title: 'Secure Platform', desc: 'Bank-grade security protection', color: 'green' },
              { icon: Smartphone, title: 'Mobile First', desc: 'Trade anytime, anywhere', color: 'yellow' },
              { icon: Wallet, title: 'Instant Payouts', desc: 'Real-time commission distribution', color: 'pink' },
              { icon: TrendingUp, title: 'Automated ROI', desc: 'Earn passive income daily', color: 'indigo' }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass rounded-xl p-5 md:p-6 group cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div className={`p-3 bg-${feature.color}-500/10 rounded-xl inline-block mb-3`}>
                  <feature.icon className={`w-6 h-6 md:w-8 md:h-8 text-${feature.color}-400`} />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section id="packages" className="py-16 md:py-20 relative" data-testid="packages-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4" data-testid="packages-title">
              Investment <span className="text-gradient">Packages</span>
            </h2>
            <p className="text-gray-400 text-sm md:text-base">Choose your path to financial freedom</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {packages.map((pkg, idx) => (
              <motion.div
                key={pkg.package_id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass rounded-xl p-5 md:p-6 relative group overflow-hidden hover:scale-[1.02] transition-transform"
                data-testid={`package-level-${pkg.level}`}
              >
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-violet-600 text-white px-3 md:px-4 py-1.5 rounded-bl-xl text-xs font-bold">
                  Level {pkg.level}
                </div>
                <div className="mt-6 md:mt-8">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">{pkg.name || `Tier ${pkg.level}`}</h3>
                  <div className="text-2xl md:text-3xl font-black text-gradient mb-4 md:mb-6">{formatCurrency(pkg.min_investment)}</div>
                  
                  <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                    <div className="flex justify-between items-center p-2.5 bg-white/5 rounded-lg">
                      <span className="text-gray-400 text-sm">Daily ROI</span>
                      <span className="text-green-400 font-black text-base md:text-lg">{pkg.daily_roi}%</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-white/5 rounded-lg">
                      <span className="text-gray-400 text-sm">Annual ROI</span>
                      <span className="text-blue-400 font-black text-base md:text-lg">{pkg.annual_roi}%</span>
                    </div>
                    {(pkg.direct_required > 0 || pkg.indirect_required > 0) && (
                      <div className="flex justify-between items-center p-2.5 bg-white/5 rounded-lg">
                        <span className="text-gray-400 text-sm">Requirements</span>
                        <span className="text-white font-bold text-sm">{pkg.direct_required}D / {pkg.indirect_required}I</span>
                      </div>
                    )}
                  </div>

                  {pkg.level >= 2 && (
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Commission Rates</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                          <div className="text-base md:text-lg font-black text-blue-400">{pkg.commission_lv_a || pkg.commission_direct || 0}%</div>
                          <div className="text-xs text-gray-500">Direct</div>
                        </div>
                        <div className="text-center p-2 bg-purple-500/10 rounded-lg">
                          <div className="text-base md:text-lg font-black text-purple-400">{pkg.commission_lv_b || pkg.commission_level_2 || 0}%</div>
                          <div className="text-xs text-gray-500">Lv.2</div>
                        </div>
                        <div className="text-center p-2 bg-violet-500/10 rounded-lg">
                          <div className="text-base md:text-lg font-black text-violet-400">{pkg.commission_lv_c || pkg.commission_level_3 || 0}%</div>
                          <div className="text-xs text-gray-500">Lv.3</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Packages Slider Section */}
      <section className="py-16 md:py-20 relative bg-gradient-to-b from-transparent via-blue-950/10 to-transparent" data-testid="active-packages-slider">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              <span className="text-gradient">Active</span> Investment Packages
            </h2>
            <p className="text-gray-400 text-sm md:text-base">Real-time overview of our investment tiers</p>
          </motion.div>

          {packages.length > 0 && (
            <div className="relative">
              <div className="flex justify-center items-center gap-4 mb-6">
                <button
                  onClick={() => setActivePackageIndex((prev) => (prev - 1 + packages.length) % packages.length)}
                  className="p-3 glass rounded-full hover:bg-white/10 transition"
                  data-testid="slider-prev"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <div className="flex gap-2">
                  {packages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePackageIndex(idx)}
                      className={`w-3 h-3 rounded-full transition-all ${idx === activePackageIndex ? 'bg-blue-500 w-8' : 'bg-gray-600 hover:bg-gray-500'}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setActivePackageIndex((prev) => (prev + 1) % packages.length)}
                  className="p-3 glass rounded-full hover:bg-white/10 transition"
                  data-testid="slider-next"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activePackageIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-lg mx-auto"
                >
                  {packages[activePackageIndex] && (
                    <div className="glass rounded-2xl p-8 relative overflow-hidden border border-blue-500/30">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-violet-500"></div>
                      <div className="absolute top-4 right-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold rounded-full">
                        Level {packages[activePackageIndex].level}
                      </div>
                      <div className="mt-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{packages[activePackageIndex].name || `Tier ${packages[activePackageIndex].level}`}</h3>
                        <div className="text-4xl font-black text-gradient mb-6">{formatCurrency(packages[activePackageIndex].min_investment)}</div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-4 bg-green-500/10 rounded-xl text-center">
                            <div className="text-3xl font-black text-green-400">{packages[activePackageIndex].daily_roi}%</div>
                            <div className="text-sm text-gray-400">Daily ROI</div>
                          </div>
                          <div className="p-4 bg-blue-500/10 rounded-xl text-center">
                            <div className="text-3xl font-black text-blue-400">{packages[activePackageIndex].annual_roi}%</div>
                            <div className="text-sm text-gray-400">Annual ROI</div>
                          </div>
                        </div>

                        <Link to="/register">
                          <button className="w-full btn-primary py-4 font-bold text-lg">
                            Start Investing Now
                          </button>
                        </Link>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20 relative" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              What Our <span className="text-gradient">Investors</span> Say
            </h2>
            <p className="text-gray-400 text-sm md:text-base">Real success stories from our community</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass rounded-xl p-6 relative group hover:border-blue-500/30 transition-all"
                data-testid={`testimonial-${idx}`}
              >
                <Quote className="absolute top-4 right-4 w-8 h-8 text-blue-500/20" />
                <div className="flex items-center gap-3 mb-4">
                  <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/30" />
                  <div>
                    <div className="text-white font-bold">{testimonial.name}</div>
                    <div className="text-gray-500 text-sm">{testimonial.location}</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">"{testimonial.text}"</p>
                <div className="pt-3 border-t border-white/10">
                  <div className="text-xs text-gray-500">Total Earnings</div>
                  <div className="text-xl font-bold text-green-400">{testimonial.earnings}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 relative bg-gradient-to-b from-transparent via-purple-950/10 to-transparent" data-testid="faq-section">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-4">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300 text-sm font-bold">Got Questions?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
            <p className="text-gray-400 text-sm md:text-base">Everything you need to know about MINEX GLOBAL</p>
          </motion.div>

          <div className="space-y-3">
            {faqData.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="glass rounded-xl overflow-hidden"
                data-testid={`faq-item-${idx}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-white/5 transition"
                >
                  <span className="text-white font-bold pr-4">{faq.question}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 relative">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4 md:mb-6">
              Ready to Start <span className="text-gradient">Earning?</span>
            </h2>
            <p className="text-gray-400 text-sm md:text-base mb-6 md:mb-8">Join thousands of investors already growing their wealth with MINEX GLOBAL</p>
            <Link to="/register">
              <button className="btn-primary text-base md:text-lg px-8 md:px-12 py-3 md:py-4 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all">
                Get Started Now <ArrowRight className="w-5 h-5 inline ml-2" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-white/5 py-6 md:py-10" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <img src="https://customer-assets.emergentagent.com/job_a9d66ba7-0c44-4716-b6dc-8595a53033f1/artifacts/pwb3ur38_minxlogo.png" alt="MINEX" className="h-8 mx-auto md:mx-0" />
              <p className="text-gray-500 text-xs md:text-sm mt-2">© 2026 MINEX GLOBAL. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <Link to="/login" className="text-gray-400 hover:text-white transition text-sm">Login</Link>
              <Link to="/register" className="text-gray-400 hover:text-white transition text-sm">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
