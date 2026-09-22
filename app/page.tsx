'use client';

import React from 'react';
import Image from 'next/image';
import {
  Users,
  Navigation,
  BarChart3,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Send,
  UserCheck,
  ExternalLink,
  LogIn,
} from 'lucide-react';

export default function HomePage() {
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('yearly');

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans relative overflow-x-hidden pb-16 sm:pb-0">
      
      {/* ========================================================
          STICKY TOP NAVIGATION BAR (MOBILE & DESKTOP OPTIMIZED)
      ======================================================== */}
      <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-900/80 px-3.5 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="max-w-6xl mx-auto h-14 sm:h-18 flex items-center justify-between">
          
          {/* Logo Brand Link */}
          <a href="#" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.25)] group-hover:scale-105 transition-transform duration-300 shrink-0">
              <Image
                src="/apple-touch-icon.png"
                alt="RouteHunter Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-lg font-black tracking-widest text-white leading-tight uppercase">
                Route<span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">Hunter</span>
              </span>
              <span className="text-[8px] sm:text-[10px] text-amber-400/80 tracking-widest font-semibold uppercase">FACTORY RADAR</span>
            </div>
          </a>

          {/* Quick Action Navigation Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/radar"
              className="inline-flex items-center gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs sm:text-sm border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-md active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>เข้าสู่ระบบ</span>
            </a>
            <a
              href="/radar"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm hover:brightness-110 transition-all duration-300 shadow-lg shadow-amber-500/20"
            >
              <span>เปิดใช้งานระบบ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </header>

      {/* ========================================================
          SECTION 1: TOP BRAND RADAR SHOWCASE (HERO TOP)
      ======================================================== */}
      <section className="relative w-full pt-20 pb-10 sm:pt-36 sm:pb-16 flex flex-col items-center justify-center overflow-hidden select-none">
        
        {/* Radar Background & Scanning System */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[440px] md:w-[520px] aspect-square pointer-events-none flex items-center justify-center -z-10">
          
          {/* Radar Concentric Rings */}
          <div className="absolute inset-0 rounded-full border border-amber-500/10" />
          <div className="absolute inset-6 sm:inset-12 rounded-full border border-amber-500/15" />
          <div className="absolute inset-16 sm:inset-26 rounded-full border border-dashed border-amber-500/20" />
          <div className="absolute inset-24 sm:inset-40 rounded-full border border-amber-500/25" />

          {/* Radar Crosshairs (X & Y Axis) */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-gradient-to-b from-transparent via-amber-500/20 to-transparent" />
          
          {/* Diagonal Crosshairs */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-amber-500/10 to-transparent rotate-45" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -rotate-45" />

          {/* Continuous Expanding Radar Pulse Waves */}
          <div className="absolute w-32 sm:w-56 h-32 sm:h-56 rounded-full border border-amber-400/40 animate-ping opacity-20 duration-1000" />
          <div className="absolute w-20 sm:w-36 h-20 sm:h-36 rounded-full border border-yellow-400/50 animate-ping opacity-30 [animation-duration:3s]" />

          {/* 360 Degree Rotating Radar Beam Sweep */}
          <div className="absolute inset-0 rounded-full overflow-hidden animate-[spin_4s_linear_infinite]">
            <div className="w-1/2 h-1/2 origin-bottom-right bg-gradient-to-tl from-amber-400/25 via-yellow-500/5 to-transparent rounded-tl-full" />
          </div>

          {/* Blinking Radar Target Blips */}
          <div className="absolute top-[22%] left-[30%] w-2 h-2 bg-amber-400 rounded-full animate-ping opacity-75" />
          <div className="absolute top-[22%] left-[30%] w-1.5 h-1.5 bg-amber-300 rounded-full shadow-[0_0_8px_#f59e0b]" />

          <div className="absolute bottom-[28%] right-[25%] w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-75 [animation-delay:1.5s]" />
          <div className="absolute bottom-[28%] right-[25%] w-1.5 h-1.5 bg-emerald-300 rounded-full shadow-[0_0_8px_#10b981]" />

          <div className="absolute top-[65%] left-[22%] w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b] animate-pulse" />

          {/* Ambient Center Glow */}
          <div className="absolute w-44 sm:w-56 h-44 sm:h-56 bg-amber-500/15 rounded-full blur-[70px] sm:blur-[80px]" />
        </div>

        {/* Center Logo & Brand Name */}
        <div className="w-full flex flex-col items-center justify-center px-4 relative z-10 animate-in fade-in zoom-in-95 duration-700">
          
          {/* Logo Container */}
          <div className="relative w-[110px] sm:w-[160px] md:w-[180px] aspect-square flex items-center justify-center">
            <Image
              src="/apple-touch-icon.png"
              alt="RouteHunter Radar Brand"
              fill
              className="object-contain drop-shadow-[0_10px_30px_rgba(245,158,11,0.35)] hover:scale-105 transition-transform duration-500 ease-out"
              priority
            />
          </div>

          {/* Brand Name */}
          <div className="mt-4 sm:mt-5 text-center flex flex-col items-center">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-widest text-white uppercase drop-shadow-md">
              Route<span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">Hunter</span>
            </h1>

            {/* Quick Access Action Buttons in Hero */}
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs sm:max-w-md">
              <a
                href="/radar"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-sm hover:brightness-110 transition-all duration-300 shadow-xl shadow-amber-500/25 active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบสมาชิก</span>
              </a>
              <a
                href="#pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-lg active:scale-95"
              >
                <span>ดูแพ็กเกจราคา</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================
          SECTION 2: CLEAR VALUE PROPOSITION STATEMENT (RESPONSIVE)
      ======================================================== */}
      <section className="relative w-full py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 flex items-center justify-center text-center">
        
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] h-[180px] sm:h-[250px] bg-amber-500/5 rounded-full blur-[100px] sm:blur-[130px] pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto space-y-2 sm:space-y-3">
          <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-snug">
            ระบบเรดาร์ค้นหาโรงงาน และบริหารทีมขาย <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              สำหรับธุรกิจจัดจำหน่ายเม็ดพลาสติก
            </span>
          </h2>
        </div>

      </section>

      {/* ========================================================
          SECTION 3: 3D PLASTIC MANUFACTURING BANNER
      ======================================================== */}
      <section className="relative w-full py-0 overflow-hidden">
        
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[40vh] sm:min-h-[70vh] md:min-h-[80vh] flex items-center justify-center">
          <Image
            src="/plastic_molding_3d_banner.jpg"
            alt="3D Plastic Manufacturing & Injection Molding Visual"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Top & Bottom Seamless Blending Gradients */}
          <div className="absolute inset-x-0 top-0 h-24 sm:h-44 bg-gradient-to-b from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 sm:h-44 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />
        </div>

      </section>

      {/* ========================================================
          SECTION 4: 3 CORE VALUE PROPOSITIONS (MOBILE TOUCH CARDS)
      ======================================================== */}
      <section className="relative w-full py-12 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-950">
        
        {/* Ambient Luxury Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[850px] h-[300px] sm:h-[350px] bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 rounded-full blur-[120px] sm:blur-[160px] pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            
            {/* Card 1: หาลูกค้า */}
            <div className="relative group p-6 sm:p-9 rounded-3xl bg-gradient-to-b from-slate-900/80 via-slate-900/50 to-slate-950/80 border border-slate-800/70 hover:border-amber-500/50 transition-all duration-300 flex flex-col items-center text-center backdrop-blur-xl shadow-xl">
              
              <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black text-[10px] sm:text-xs tracking-wider shadow-md uppercase">
                01 • LEADS
              </div>

              <div className="w-14 h-14 sm:w-20 sm:h-20 mt-2 mb-4 sm:mb-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-all duration-300">
                <Users className="w-7 h-7 sm:w-9 sm:h-9 stroke-[2]" />
              </div>

              <h3 className="text-base sm:text-lg lg:text-xl font-extrabold text-white group-hover:text-amber-300 transition-colors duration-300 mb-2 tracking-tight leading-snug">
                ทีมขายไม่ต้องเสียเวลากับการหาลูกค้า
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                เข้าถึงฐานข้อมูลโรงงานพลาสติก <br className="hidden sm:inline" />
                พร้อมรายชื่อและพิกัดแม่นยำ เปิดดีลได้ทันที
              </p>
            </div>

            {/* Card 2: ประหยัดค่าน้ำมัน */}
            <div className="relative group p-6 sm:p-9 rounded-3xl bg-gradient-to-b from-slate-900/80 via-slate-900/50 to-slate-950/80 border border-slate-800/70 hover:border-amber-500/50 transition-all duration-300 flex flex-col items-center text-center backdrop-blur-xl shadow-xl">
              
              <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black text-[10px] sm:text-xs tracking-wider shadow-md uppercase">
                02 • ROUTE
              </div>

              <div className="w-14 h-14 sm:w-20 sm:h-20 mt-2 mb-4 sm:mb-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-all duration-300">
                <Navigation className="w-7 h-7 sm:w-9 sm:h-9 stroke-[2]" />
              </div>

              <h3 className="text-base sm:text-lg lg:text-xl font-extrabold text-white group-hover:text-amber-300 transition-colors duration-300 mb-2 tracking-tight leading-snug">
                วางแผนการเดินทางเพื่อลดค่าน้ำมันเชื้อเพลิง
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                จัดเส้นทางวิ่งพบลูกค้ารายทาง <br className="hidden sm:inline" />
                ในโซนเดียวกันได้อย่างมีประสิทธิภาพสูงสุด
              </p>
            </div>

            {/* Card 3: CRM & Analytics */}
            <div className="relative group p-6 sm:p-9 rounded-3xl bg-gradient-to-b from-slate-900/80 via-slate-900/50 to-slate-950/80 border border-slate-800/70 hover:border-amber-500/50 transition-all duration-300 flex flex-col items-center text-center backdrop-blur-xl shadow-xl">
              
              <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black text-[10px] sm:text-xs tracking-wider shadow-md uppercase">
                03 • ANALYTICS
              </div>

              <div className="w-14 h-14 sm:w-20 sm:h-20 mt-2 mb-4 sm:mb-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-all duration-300">
                <BarChart3 className="w-7 h-7 sm:w-9 sm:h-9 stroke-[2]" />
              </div>

              <h3 className="text-base sm:text-lg lg:text-xl font-extrabold text-white group-hover:text-amber-300 transition-colors duration-300 mb-2 tracking-tight leading-snug">
                มีระบบ CRM รองรับเพื่อวิเคราะห์ข้อมูล
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                ติดตามสถานะดีล สรุปผลงานทีมขาย <br className="hidden sm:inline" />
                และคาดการณ์ยอดสั่งซื้อได้อย่างแม่นยำ
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* ========================================================
          SECTION 5: 3D THAILAND MAP FACTORY PINS & DATABASE
      ======================================================== */}
      <section className="relative w-full py-0 overflow-hidden">
        
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[40vh] sm:min-h-[70vh] md:min-h-[80vh] flex items-center justify-center">
          <Image
            src="/thailand_factory_map_3d_banner.jpg"
            alt="3D Thailand Geographic Map with Industrial Factory Location Pins"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Top & Bottom Seamless Blending Gradients */}
          <div className="absolute inset-x-0 top-0 h-24 sm:h-44 bg-gradient-to-b from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 sm:h-44 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />
        </div>

      </section>

      {/* ========================================================
          SECTION 6: SERVICE PRICING & SUBSCRIPTION (MOBILE OPTIMIZED)
      ======================================================== */}
      <section id="pricing" className="relative w-full py-16 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-950 flex flex-col items-center">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] h-[250px] sm:h-[350px] bg-amber-500/10 rounded-full blur-[110px] sm:blur-[150px] pointer-events-none -z-10" />

        <div className="max-w-4xl w-full mx-auto flex flex-col items-center">
          
          {/* Section Heading */}
          <div className="text-center space-y-2 sm:space-y-3 mb-8 sm:mb-12">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-[11px] sm:text-xs uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Service & Pricing
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              อัตราค่าบริการแพลตฟอร์ม
            </h2>
            <p className="text-xs sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              ลงทุนเพื่อติดอาวุธให้ทีมขาย ปิดดีลไวขึ้น และควบคุมต้นทุนค่าเดินทางได้อย่างคุ้มค่า
            </p>
          </div>

          {/* Pricing Switcher Toggle */}
          <div className="flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl mb-8 sm:mb-12 relative w-full max-w-xs sm:max-w-none justify-center">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 text-center ${
                billingCycle === 'monthly'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              รายเดือน
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              รายปี
              <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase bg-slate-950/20 text-slate-950">
                ประหยัดกว่า
              </span>
            </button>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-3xl">
            
            {/* Monthly Card */}
            <div
              className={`relative p-6 sm:p-8 rounded-3xl border transition-all duration-500 flex flex-col justify-between ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950 border-amber-500/60 shadow-[0_20px_50px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
                  : 'bg-slate-900/40 border-slate-800/60 opacity-75 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-white">แพ็กเกจรายเดือน</h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                    Monthly
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-1.5">
                  <span className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    7,990
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-400">บาท / เดือน</span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 mb-5 sm:mb-6 font-medium">
                  (ชำระเป็นรายเดือน ยืดหยุ่น ยกเลิกได้ตลอดเวลา)
                </p>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 mb-6 sm:mb-8 border-t border-slate-800/80 pt-5 sm:pt-6">
                  <li className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span>สแกนเรดาร์ค้นหาโรงงานพลาสติกทั่วประเทศ</span>
                  </li>
                  <li className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span>ระบบวางแผนรูทและจัดทริปเพื่อลดค่าน้ำมัน</span>
                  </li>
                  <li className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span>ระบบ CRM บริหารดีลและบันทึกผลงานทีมขาย</span>
                  </li>
                  <li className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span>ระบบวิเคราะห์และสรุปยอดขาย (Analytics)</span>
                  </li>
                </ul>
              </div>
              
              <a
                href="/radar"
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-center text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
              >
                เลือกแพ็กเกจรายเดือน
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Yearly Card (Recommended) */}
            <div
              className={`relative p-6 sm:p-8 rounded-3xl border transition-all duration-500 flex flex-col justify-between ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950 border-amber-500 shadow-[0_20px_60px_rgba(245,158,11,0.22)] ring-1 sm:ring-2 ring-amber-500/50 sm:scale-[1.03]'
                  : 'bg-slate-900/40 border-slate-800/60 opacity-75 hover:opacity-100'
              }`}
            >
              {/* Recommended Badge */}
              <div className="absolute -top-3.5 right-4 sm:right-6 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] sm:text-[11px] tracking-wider uppercase shadow-md shadow-amber-500/30">
                ประหยัด 10,560 บาท / ปี
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-1.5">
                    แพ็กเกจรายปี
                    <ShieldCheck className="w-4 h-4" />
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Yearly
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-1.5">
                  <span className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent tracking-tight">
                    85,320
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-400">บาท / ปี</span>
                </div>
                <p className="text-[11px] sm:text-xs text-amber-400/90 mb-5 sm:mb-6 font-medium">
                  (เฉลี่ยเพียง <span className="font-bold text-amber-300">7,110 บาท / เดือน</span> — ประหยัด 11%)
                </p>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-200 mb-6 sm:mb-8 border-t border-slate-800/80 pt-5 sm:pt-6">
                  <li className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span>สแกนเรดาร์ค้นหาโรงงานพลาสติกทั่วประเทศ</span>
                  </li>
                  <li className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span>ระบบวางแผนรูทและจัดทริปเพื่อลดค่าน้ำมัน</span>
                  </li>
                  <li className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span>ระบบ CRM บริหารดีลและบันทึกผลงานทีมขาย</span>
                  </li>
                  <li className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span>ระบบวิเคราะห์และสรุปยอดขาย (Analytics)</span>
                  </li>
                </ul>
              </div>

              <a
                href="/radar"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-center text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95"
              >
                เลือกแพ็กเกจรายปี (ประหยัดสูงสุด)
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

          </div>

        </div>

      </section>

      {/* ========================================================
          SECTION 7: 3D SALES TEAM SUCCESS & VICTORY BANNER
      ======================================================== */}
      <section className="relative w-full py-0 overflow-hidden">
        
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[40vh] sm:min-h-[70vh] md:min-h-[85vh] flex items-center justify-center">
          <Image
            src="/sales_team_success.jpg"
            alt="3D Professional Sales Team Celebrating Quotas Exceeded & Record-Breaking Revenue"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Top & Bottom Seamless Blending Gradients */}
          <div className="absolute inset-x-0 top-0 h-24 sm:h-48 bg-gradient-to-b from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 sm:h-48 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

          {/* Inspiring Floating Overlay Quote */}
          <div className="absolute bottom-8 sm:bottom-16 inset-x-4 max-w-3xl mx-auto text-center pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 backdrop-blur-md text-amber-300 font-bold text-[10px] sm:text-sm mb-2 sm:mb-3 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Empowering High-Performance Sales Teams
            </div>
            <h3 className="text-lg sm:text-3xl md:text-4xl font-black text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] leading-snug">
              สร้างความสำเร็จและยอดขายที่เติบโตไปด้วยกัน <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                กับ RouteHunter
              </span>
            </h3>
          </div>
        </div>

      </section>

      {/* ========================================================
          SECTION 8: CONTACT & SALES CONSULTATION (MOBILE OPTIMIZED)
      ======================================================== */}
      <section className="relative w-full py-14 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-950 flex flex-col items-center">
        
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[700px] h-[250px] sm:h-[350px] bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 rounded-full blur-[110px] sm:blur-[160px] pointer-events-none -z-10" />

        <div className="max-w-5xl w-full mx-auto">
          
          {/* Section Heading */}
          <div className="text-center space-y-2 sm:space-y-3 mb-8 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-[11px] sm:text-xs uppercase tracking-widest">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              Contact & Support
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              ติดต่อสอบถาม & นัดหมายสาธิตระบบ
            </h2>
            <p className="text-xs sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
              พร้อมยกระดับยอดขายธุรกิจเม็ดพลาสติก ปรึกษาทีมงานผู้เชี่ยวชาญ RouteHunter ได้ทันที
            </p>
          </div>

          {/* Sales Manager Card (Featured Mobile Layout) */}
          <div className="mb-6 sm:mb-8 p-5 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border border-amber-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 shadow-xl">
            <div className="flex items-center gap-4 sm:gap-5 text-center sm:text-left flex-col sm:flex-row">
              {/* Profile Image */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.25)] shrink-0">
                <Image
                  src="/akachai_profile.jpg"
                  alt="เอกชัย หาบ้านแท่น (Max) - Sale Manager"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
                  Sale Manager
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-white">
                  เอกชัย หาบ้านแท่น <span className="text-amber-400 font-extrabold">(Max)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">ผู้จัดการฝ่ายขายและพัฒนาธุรกิจ RouteHunter</p>
              </div>
            </div>
            
            {/* Quick Action Touch Buttons on Mobile */}
            <div className="flex flex-row items-center gap-2.5 w-full sm:w-auto justify-center">
              <a
                href="tel:0924797666"
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 border border-slate-700/60 active:scale-95"
              >
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>092-479-7666</span>
              </a>
              <a
                href="mailto:akachaiha@gmail.com"
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 border border-slate-700/60 active:scale-95"
              >
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate">อีเมล</span>
              </a>
            </div>
          </div>

          {/* Contact Grid: 4 Direct Channels */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 mb-8 sm:mb-12">
            
            {/* LINE Official Card */}
            <a
              href="https://line.me/R/ti/p/@362mkitb?ts=02202032&oat_content=url"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/50 transition-all duration-300 flex flex-col items-center text-center space-y-2.5 sm:space-y-3 group backdrop-blur-xl shadow-xl active:scale-95"
            >
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <MessageSquare className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-base font-bold text-white mb-0.5">LINE Official</h3>
                <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-1">คุยด่วน ปรึกษาทันที</p>
              </div>
              <div className="w-full pt-0.5">
                <span className="w-full py-1.5 px-2 rounded-lg sm:rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1">
                  เพิ่มเพื่อน LINE
                </span>
              </div>
            </a>

            {/* Facebook Page Card */}
            <a
              href="https://www.facebook.com/profile.php?id=61586024618442"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-blue-500/50 transition-all duration-300 flex flex-col items-center text-center space-y-2.5 sm:space-y-3 group backdrop-blur-xl shadow-xl active:scale-95"
            >
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Send className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-base font-bold text-white mb-0.5">Facebook Page</h3>
                <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-1">ติดตามข่าวสาร</p>
              </div>
              <div className="w-full pt-0.5">
                <span className="w-full py-1.5 px-2 rounded-lg sm:rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1">
                  เยี่ยมชม Facebook
                </span>
              </div>
            </a>

            {/* Phone Hotline Card */}
            <a
              href="tel:0924797666"
              className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-amber-500/50 transition-all duration-300 flex flex-col items-center text-center space-y-2.5 sm:space-y-3 group backdrop-blur-xl shadow-xl active:scale-95"
            >
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Phone className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-base font-bold text-white mb-0.5">โทรฝ่ายขาย</h3>
                <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-1">09:00 - 18:00 น.</p>
              </div>
              <div className="w-full pt-0.5">
                <span className="w-full py-1.5 px-2 rounded-lg sm:rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1">
                  โทรออกทันที
                </span>
              </div>
            </a>

            {/* Email Consultation Card */}
            <a
              href="mailto:akachaiha@gmail.com"
              className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 flex flex-col items-center text-center space-y-2.5 sm:space-y-3 group backdrop-blur-xl shadow-xl active:scale-95"
            >
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Mail className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-base font-bold text-white mb-0.5">อีเมลติดต่อ</h3>
                <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-1">นัดหมายเดโม</p>
              </div>
              <div className="w-full pt-0.5">
                <span className="w-full py-1.5 px-1.5 rounded-lg sm:rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold text-[10px] sm:text-xs flex items-center justify-center">
                  ส่งอีเมล
                </span>
              </div>
            </a>

          </div>

          {/* Quick Demo Booking Banner */}
          <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 shadow-2xl text-center sm:text-left">
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-lg sm:text-2xl font-black text-white">
                ต้องการนัดหมายทดลองใช้ระบบเรดาร์จริง?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                ทีมงานพร้อมให้คำแนะนำการใช้งานและจัดรูทวิ่งตัวอย่างตามโซนโรงงานของคุณ
              </p>
            </div>
            <a
              href="/radar"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm hover:brightness-110 transition-all duration-300 shadow-lg shadow-amber-500/25 shrink-0 flex items-center justify-center gap-2 active:scale-95"
            >
              ทดลองใช้งานระบบ
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>

      </section>

      {/* ========================================================
          FLOATING QUICK CONTACT ACTION WIDGET (SMARTPHONE BOTTOM BAR)
      ======================================================== */}
      {/* Mobile Sticky Bottom Floating Action Bar */}
      <div className="fixed sm:hidden bottom-0 inset-x-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-2 shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
        <a
          href="https://line.me/R/ti/p/@362mkitb?ts=02202032&oat_content=url"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/30 active:scale-95"
        >
          <svg className="w-4 h-4 text-slate-950 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.089.497.241l2.458 3.332V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          <span>LINE ด่วน</span>
        </a>
        <a
          href="tel:0924797666"
          className="flex-1 py-2 px-3 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/30 active:scale-95"
        >
          <Phone className="w-4 h-4 text-slate-950 shrink-0" />
          <span>โทรหาคุณ Max</span>
        </a>
        <a
          href="/radar"
          className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
        >
          <LogIn className="w-3.5 h-3.5 text-amber-400" />
          <span>เข้าแอป</span>
        </a>
      </div>

      {/* Desktop / Tablet Floating Speed Dial */}
      <div className="hidden sm:flex fixed bottom-6 right-6 z-50 flex-col items-end gap-3 select-none">
        
        {/* LINE Direct Floating Button */}
        <a
          href="https://line.me/R/ti/p/@362mkitb?ts=02202032&oat_content=url"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-2xl shadow-emerald-500/40 hover:scale-105 transition-all duration-300 border border-emerald-300/40"
          title="คุยกับฝ่ายขายผ่าน LINE"
        >
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center p-1 shrink-0">
            <svg className="w-full h-full text-emerald-600 fill-current" viewBox="0 0 24 24">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.089.497.241l2.458 3.332V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
          </div>
          <span>คุยด่วน LINE</span>
        </a>

        {/* Facebook Direct Floating Button */}
        <a
          href="https://www.facebook.com/profile.php?id=61586024618442"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-2xl shadow-blue-600/40 hover:scale-105 transition-all duration-300 border border-blue-400/40"
          title="ติดตาม Facebook Page"
        >
          {/* Custom SVG Facebook Icon */}
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-blue-600 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <span>Facebook</span>
        </a>

        {/* Phone Hotline Floating Button */}
        <a
          href="tel:0924797666"
          className="group relative flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-full bg-slate-900/90 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold text-xs shadow-2xl shadow-black/80 hover:scale-105 transition-all duration-300 border border-amber-500/40 backdrop-blur-md"
          title="โทรด่วน 092-479-7666"
        >
          <div className="w-6 h-6 rounded-full bg-amber-500/20 group-hover:bg-slate-950/20 flex items-center justify-center shrink-0">
            <Phone className="w-3.5 h-3.5" />
          </div>
          <span>092-479-7666</span>
        </a>

      </div>

    </div>
  );
}
