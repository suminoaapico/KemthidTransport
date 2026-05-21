import React, { useState } from 'react';
import { 
  BookOpen, HelpCircle, ArrowRight, CheckCircle, Database, 
  FileText, DollarSign, Truck, Users, Award, ShieldAlert, 
  Layers, MapPin, ClipboardList, TrendingUp, Settings2, CloudLightning, Landmark, CheckSquare, ChevronRight
} from 'lucide-react';

export function ManualView() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedTopic, setSelectedTopic] = useState<string>('overall');

  const steps = [
    {
      id: 1,
      title: 'สร้างฐานข้อมูลเริ่มต้น (ทะเบียนตารางหลัก)',
      desc: 'ลงทะเบียนลูกค้า คนขับ รถยนต์ และพนักงานสำนักงานเพื่อเป็นข้อมูลอ้างอิงยึดเหนี่ยวในขั้นตอนถัดไป',
      icon: Users,
    },
    {
      id: 2,
      title: 'วางแผนและออกใบจราจรขนส่ง (Job)',
      desc: 'ป้อนข้อมูลจราจรขนส่ง กำหนดตู้คอนเทนเนอร์ ค่าระวาง เลือกทะเบียนคนขับและป้ายทะเบียนรถที่ว่างงาน',
      icon: Truck,
    },
    {
      id: 3,
      title: 'บันทึกค่าใช้จ่ายรายวัน (Expenses)',
      desc: 'ป้อนค่าใช้จ่ายน้ำมัน สารเหลว ค่าทางด่วน หรือค่าซ่อมแซม โดยลิ้งค์กับทะเบียนรถยนต์และระบุประเภทบิลคู่ขนาน',
      icon: DollarSign,
    },
    {
      id: 4,
      title: 'ออกใบแจ้งหนี้ & เรียกเก็บเงิน (Invoices)',
      desc: 'ดึงหัวงานขนส่งมาจัดส่งใบแจ้งหนี้ ระบบจะแยกประเภทใบจราจรขนส่ง หรือใบเบิกเงินล่วงหน้า (Advance) และคิดภาษี ณ ที่จ่าย 1% หรือค่าบริการ 3% เสมอ',
      icon: FileText,
    },
    {
      id: 5,
      title: 'รับเงินจริง & ออกใบเสร็จ (Receipts)',
      desc: 'บันทึกรับเงินเมื่อได้รับการรับรองเงินโอน ปรับเครื่องหมายสถานะให้เรียบร้อยเพื่อปิดยอดและส่งงบขึ้นแผงควบคุมหลัก',
      icon: CheckCircle,
    },
    {
      id: 6,
      title: 'เคลียร์ยอดรถร่วม & บัญชีประจำเดือน',
      desc: 'คำนวณหักจ่ายพาร์ทเนอร์รถร่วม บันทึกเงินวิกสวัสดิการพนักงานคนขับ และดึงเป็นรายงานงบกำไรขาดทุน P&L ทันที',
      icon: Landmark,
    }
  ];

  const topics = [
    { id: 'overall', title: '🚀 ภาพรวมและสถาปัตยกรรมระบบ' },
    { id: 'registry', title: '👥 ทะเบียนตารางหลัก (ฐานข้อมูลทั้ง 4)' },
    { id: 'jobs', title: '🚛 แผนจราจรและงานขนส่งสินค้า' },
    { id: 'expenses', title: '⛽ บันทึกเติมน้ำมัน & ค่าทางด่วนประจำวัน' },
    { id: 'invoices', title: '📄 การออกใบแจ้งหนี้ (ภาษีหัก ณ ที่จ่าย 1%)' },
    { id: 'receipts', title: '🧾 การออกใบเสร็จรับเงิน (ปิดใบงาน)' },
    { id: 'finance', title: '💼 รถร่วม, เงินเดือนพนักงาน & งบกำไรขาดทุน P&L' },
    { id: 'supabase', title: '⚡ การจัดการ Supabase SQL & การสำรอง Google Sheets' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans">
      {/* Hero Banner Section */}
      <div className="p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white relative">
        <div className="absolute right-6 top-6 opacity-10 pointer-events-none">
          <BookOpen className="w-48 h-48" />
        </div>
        <div className="max-w-3xl space-y-3 relative z-10">
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            User Manual Guide
          </span>
          <h1 className="text-2xl md:text-3xl font-black font-sans tracking-tight">
            คู่มือการเรียนรู้และคู่มือการใช้งานระบบขนส่ง เข็มทิศ โลจิสติกส์
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
            ยินดีต้อนรับสู่คู่มืออย่างเป็นทางการของ <strong className="text-white">KHEMTHIT TRANSPORT CO.,LTD.</strong> ระบบนี้ได้รวบรวมฟังก์ชันการทำงานด้านการจัดเส้นทางขนส่งรถพ่วงตู้คอนเทนเนอร์ การจัดสรรค่าใช้จ่ายใบเที่ยว การควบคุมบัญชีลูกหนี้ เจ้าหนี้ และสรุปงบประมาณอย่างเป็นระบบ เชื่อมโยงฐานข้อมูลเรียลไทม์ 100% สู่คลาวด์
          </p>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 border-t border-slate-100">
        
        {/* Left Sidebar Topics */}
        <div className="bg-slate-50 p-6 border-r border-slate-100 space-y-4">
          <h3 className="font-extrabold text-[11px] text-slate-400 tracking-wider uppercase font-sans">หัวข้อการใช้งานหลัก</h3>
          <div className="space-y-1">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTopic(t.id)}
                className={`w-full text-left text-xs font-bold p-3 rounded-lg transition-all flex items-center justify-between ${
                  selectedTopic === t.id 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-950'
                }`}
              >
                <span>{t.title}</span>
                <ChevronRightIcon className={`w-3.5 h-3.5 ${selectedTopic === t.id ? 'opacity-100' : 'opacity-40'}`} />
              </button>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-200 mt-6 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
            <h4 className="text-[11px] font-black text-indigo-950 uppercase flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              ข้อกำหนดและสิทธิ์ RLS
            </h4>
            <p className="text-[10px] text-indigo-900 leading-relaxed mt-1.5 font-medium">
              สถาปัตยกรรมข้อมูลของระบบจะอิงตามสิทธิ์ความปลอดภัยแบบ Row Level Security ของ Supabase ซึ่งอนุญาตให้เครื่องลูกข่ายลงบันทึก .upsert() ข้อมูลได้อย่างเสรีและไม่มีดีเลย์
            </p>
          </div>
        </div>

        {/* Right Content Panels */}
        <div className="lg:col-span-3 p-6 md:p-8 space-y-8 bg-white">
          
          {/* Quick Flowchart stepping bar */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <span className="font-extrabold text-xs text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-slate-500" /> 
                ลำดับขั้นตอนกระบวนการขนส่งและจัดพิมพ์เอกสารทางการเงิน (Workflow)
              </span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-black">
                ขั้นตอนที่ {activeStep} / 6
              </span>
            </div>
            
            {/* Steps Row badge */}
            <div className="grid grid-cols-6 gap-2">
              {steps.map((st) => {
                const IconComp = st.icon;
                const isSelected = activeStep === st.id;
                const isPassed = activeStep > st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => setActiveStep(st.id)}
                    className="flex flex-col items-center text-center p-2 rounded-xl transition-all outline-none"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
                      isSelected 
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' 
                        : isPassed 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-400'
                    }`}>
                      <IconComp className="w-4.5 h-4.5" />
                    </div>
                    <span className="hidden md:inline-block font-sans text-[8px] font-bold text-slate-500 mt-2 line-clamp-1">
                      {st.title.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Step Explanation Detail */}
            <div className="mt-4 p-4 bg-white border border-slate-100 rounded-xl flex items-start gap-3 shadow-xs">
              <div className="bg-slate-100 p-2 rounded-lg text-slate-700">
                {React.createElement(steps[activeStep - 1].icon, { className: 'w-5 h-5 text-indigo-600' })}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-900">
                  ขั้นตอนที่ {activeStep}: {steps[activeStep - 1].title}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  {steps[activeStep - 1].desc}
                </p>
              </div>
            </div>
          </div>

          {/* Topics Detail content Switch renderer based on SelectedTopic state */}
          <div className="space-y-6">
            
            {selectedTopic === 'overall' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 p-1.5 rounded text-indigo-600">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    สถาปัตยกรรมโลจิสติกส์การไหลข้อมูล (Data Flow Architecture)
                  </h2>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  ระบบ <strong>KHEMTHIT TRANSPORT</strong> ควบรวมขั้นตอนการจราจรทางรถบรรทุกและการเงินให้ไหลเป็นเนื้อเดียวกัน โดยใช้โครงร่างสัมพันธ์แบบเชื่อมโยง (Relational Design) โดยแบ่งการทำงานในเครื่องลูกข่ายออกเป็น 3 ระดับ:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <span className="text-[10px] bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded">1. ฐานข้อมูลวิกพารามิเตอร์</span>
                    <h4 className="font-extrabold text-slate-800 text-xs">ตารางหลัก (Registries)</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      ข้อมูลลูกค้า ทะเบียนรถยนต์ขบวน พนักงานขับรถ และพนักงานส่วนบัญชี สำคัญอย่างยิ่งเพราะเป็นคีย์อ้างอิงในการลงทะเบียนงานขนส่ง
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <span className="text-[10px] bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded">2. ปฏิบัติการหน้างานจริง</span>
                    <h4 className="font-extrabold text-slate-800 text-xs">งานจราจรขนส่ง (Plan Jobs)</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      การจองเรือ การรับลานคอนเทนเนอร์ ค่าเบี้ยเลี้ยงคนขับ การบันทึกเติมน้ำมัน ดีเซล ค่าทางด่วน ด่านสะพาน และการเคลียร์หน้าตู้สินค้าจริง
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <span className="text-[10px] bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded">3. ปลายน้ำทางการเงิน</span>
                    <h4 className="font-extrabold text-slate-800 text-xs">การเงิน & บัญชี (Invoicing)</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      ดึงข้อมูลเที่ยววิ่งมาวางบิลใบแจ้งหนี้ ออกใบประเมินค่าใช้จ่ายสำรองจ่ายล่วงหน้า (Advance) จัดพิมพ์ใบเสร็จ สรุปหัก ณ ที่จ่าย ภาษี และคำนวณงบ P&L
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-150 flex gap-3 text-xs">
                  <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="space-y-1">
                    <span className="font-black text-emerald-950 block">ระนาบเรียลไทม์ 100% ด้วยคลาวด์พอร์ท</span>
                    <span className="text-emerald-800 block text-[11px] leading-relaxed font-medium">
                      ทุกๆ คำสั่งบันทึก แก้ไข หรือสั่งลบบนโปรแกรมเบราว์เซอร์ จะทำการยิงคำสั่ง API ตรงผ่าน PostgreSQL ของ <strong className="text-emerald-900">Supabase</strong> ทันที ไม่สูญหายแม้เครื่องดับหรือตัดอินเทอร์เน็ต!
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedTopic === 'registry' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 p-1.5 rounded text-indigo-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    ฐานข้อมูลทะเบียนตารางหลัก (Master Register Data)
                  </h2>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  แท็บ <strong>"ทะเบียนตารางหลัก (4 ฐาน)"</strong> เป็นหน้าควบคุมหลักในการดูแลพารามิเตอร์เบื้องต้น ขั้นตอนการจัดการสารบบประกอบด้วย:
                </p>

                <div className="space-y-3.5">
                  <div className="flex gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      1
                    </div>
                    <div className="space-y-1">
                      <span className="font-black text-slate-800 block">ทะเบียนข้อมูลลูกค้า (Customers)</span>
                      <span className="text-[11px] text-slate-500 block leading-relaxed">
                        กดปุ่ม <strong>"+ เพิ่มทะเบียนลูกค้าใหม่"</strong> เพื่อกรอกชื่อบริษัท, ทะเบียนผู้เสียภาษี, เครดิตเทอม (เช่น 30 วัน, 45 วัน, 60 วัน) และแผนแที่อยู่ เพื่อนำเครดิตเทอมไปคำนวณวันครบกำหนดชำระเงินโดยอัตโนมัติบนระบบใบเรียกเก็บเงิน
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      2
                    </div>
                    <div className="space-y-1">
                      <span className="font-black text-slate-800 block">ทะเบียนข้อมูลคนขับ (Drivers)</span>
                      <span className="text-[11px] text-slate-500 block leading-relaxed">
                        ป้อนชื่อสกุล หมายเลขใบขับขี่ชนิดพิเศษ (ท.3 หรือ ท.4) ข้อมูลวันหมดอายุ พร้อมระบุป้ายทะเบียนรถคันหลักที่รับผิดชอบ เพื่อให้ระบบตรวจสอบแจ้งเตือนกรณีใบอนุญาตกำลังจะหมดอเมริกาโน่
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      3
                    </div>
                    <div className="space-y-1">
                      <span className="font-black text-slate-800 block">ทะเบียนยานพาหนะ (Vehicles / Trailers)</span>
                      <span className="text-[11px] text-slate-500 block leading-relaxed">
                        ระบุป้ายทะเบียนรถ ประเภทรถ (เช่น หัวลาก 10 ล้อ, หางพ่วงก้างปลา Skeletal, หางพ่วงพรมแบล็ตเบด Flatbed) ข้อมูล พ.ร.บ. วันหมดอายุประกันภัยชั้น 1 และกำหนดสถานะว่า <strong>"Available (ใช้งานได้)"</strong> หรือ <strong>"Maintenance (ซ่อมบำรุง)"</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      4
                    </div>
                    <div className="space-y-1">
                      <span className="font-black text-slate-800 block">พนักงานสำนักงาน (Employees)</span>
                      <span className="text-[11px] text-slate-500 block leading-relaxed">
                        ป้อนรายล้อมตารางข้อมูลออฟฟิศ แผนกบัญชีธุรการ พัสดุจัดสายรถ เพื่อเก็บเกรดอัตราจ้าง อัตรารายเดือน เงินเดือนพื้นฐาน และใช้อ้างอิงการจัดพิมพ์สลิปวิกเงินเดือนสิ้นรอบ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTopic === 'jobs' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 p-1.5 rounded text-indigo-600">
                    <Truck className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    แผนจราจรและงานขนส่งสินค้า (Jobs Operations)
                  </h2>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  นี่คือหัวใจการวิ่งรถเพื่อป้อนเข้าระหว่างคลังสินค้าและลานตู้คอนเทนเนอร์สถานี ท่าเรือแหลมฉบัง และลานวางตู้:
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 font-medium text-xs">
                  <h4 className="font-black text-indigo-950 flex items-center gap-1.5">
                    <ChevronRightIcon className="w-4 h-4 text-indigo-600" />
                    วิธีการลงทะเบียนงานวิ่งขนส่ง (Job Creation Step)
                  </h4>
                  <ul className="list-decimal list-inside space-y-2 text-[11px] text-slate-600 pl-2">
                    <li>ไปที่เมนู <strong>"แผนจราจรวิ่งงานขนส่ง"</strong> แล้วคลิก <strong>"+ สร้างใบงานจราจรขนส่งใหม่"</strong></li>
                    <li>ระบบจะให้เลือกข้อมูลความสัมพันธ์ โดยเลือก <strong>"ลูกค้าอ้างอิง"</strong>, <strong>"ป้ายทะเบียนรถ"</strong> และ <strong>"คนขับรถ"</strong> จากทะเบียนระบบ</li>
                    <li>กรอกท่าเรือต้นทาง (Origin) และ ปลายทางส่งสินค้า (Destination) รวมถึงระบุหมายเลข Booking สายเรือ และสายผู้ให้บริการตู้</li>
                    <li>
                      <strong>จุดเด่นพิเศษ (Multi-Container Fields):</strong> ท่านสามารถกดเพิ่มแถวตู้คอนเทนเนอร์ ได้ไม่จำกัดในใบเที่ยวเดียวกัน โดยแต่ละแถวสามารถป้อน:
                      <div className="bg-white p-2 border border-slate-200 rounded mt-1 font-mono text-[10px] text-indigo-700/80">
                        * หมายเลขตู้สินค้า (Container No.) / ค่าระวางวิ่ง (Transportation) / ค่าผ่านท่าเรือ (Port Charge) / ค่าขนตู้ (Container Handling) / ค่ายกสไลด์ (Lift On/Off)
                      </div>
                    </li>
                    <li>ป้อนค่าตอบแทนค่าเที่ยวคนขับรถ เพื่อนำไปใช้ออกส้มเงินเดือนในระบบไฟแนนซ์</li>
                    <li>เมื่อกรอกเสร็จสิ้น คลิก <strong>"บันทึกใบงานขนส่ง"</strong> เพื่อจัดบันทึกข้อมูลเข้าสู่ฐานข้อมูล</li>
                  </ul>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/60 flex items-center gap-2 text-xs text-amber-800">
                  <ShieldAlert className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                  <span className="font-medium text-[11px]">
                    <strong>การกำหนดสถานะสถานภาพงาน:</strong> รอดำเนินการ ➡️ กำลังขนส่ง ➡️ ส่งแล้ว (เมื่อคนขับส่งของแล้วจะนำมาวางบิล) ➡️ วางบิลแล้ว (เมื่อจัดพิมพ์ Invoice แล้ว) และ รับเงินแล้ว (เมื่อได้รับชำระจริงครบสมบูรณ์)
                  </span>
                </div>
              </div>
            )}

            {selectedTopic === 'expenses' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 p-1.5 rounded text-indigo-600">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    การคุมรายจ่ายน้ำมันดีเซล & ค่าทางด่วนรายวัน (Fuel & Expressway Expenses)
                  </h2>
                </div>

                <p className="text-xs text-slate-605 text-slate-600 leading-relaxed font-medium">
                  ฟังก์ชันควบคุมค่าใช้จ่ายมีไว้เพื่อประเมินประวัติการกินน้ำมันและวิเคราะห์หา กำไรเบื้องต้นต่อคันรถบรรทุก:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                    <h4 className="font-black text-xs text-slate-800">ขั้นตอนการลงบันทึก</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      กดปุ่ม <strong>"+ เพิ่มบันทึกรายจ่ายจราจร"</strong> เลือกประเภทภาระค่าผ่านทางด่วน หรือ น้ำมันเชื้อเพลิงดีเซล ระบุจุดพิกัดเติมน้ำมัน และระบุทะเบียนรถคู่สายที่ดึงน้ำมันไปใช้ปั๊ม และกรอกชื่อคนขับรถผู้ขอเบิกจ่ายจริง
                    </p>
                  </div>

                  <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl space-y-2">
                    <h4 className="font-black text-xs text-indigo-900">ความสำคัญของการกรอกป้ายทะเบียน</h4>
                    <p className="text-[11px] text-indigo-700 leading-relaxed font-semibold">
                      กรณีเลือกป้ายทะเบียนรถที่ตรงกับในระบบ โปรแกรมจะนำยอดค่าใช้จ่ายที่ระบุไปหักคำนวนต้นทุนหน้าแดชบอร์ดสรุปแบบ Realtime ช่วยตรวจดูคันรถที่มีปัญหาการสิ้นเปลืองอัตราสิ้นเปลืองน้ำมันผิดปกติทันที
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                  <span className="font-black text-slate-800 flex items-center gap-1">
                    <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                    การเลือกประเภทบิลบีกเกอร์ (Bill Type Parameter)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div className="p-2.5 bg-white border border-slate-150 rounded-lg">
                      <strong className="text-slate-900 block font-bold mb-0.5">1. แบบทั่วไป (Normal Bill):</strong>
                      <span className="text-slate-500">สำหรับค่าใช่จ่ายหน้างานที่ตัดเป็นต้นทุนบริษัทโดยตรงไม่มีการสำรองเรียกร้องคืนลูกค้า</span>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-150 rounded-lg">
                      <strong className="text-indigo-900 block font-bold mb-0.5">2. แบบลูกค้าจ่ายคืน (Advance Bill):</strong>
                      <span className="text-slate-500">สำหรับค่าเช่าจราจรตู้เปล่า ค่ามัดจำยกตู้สินค้า ที่บริษัทเป็นผู้วางจ่ายไปก่อน แล้วจะดึงไปจัดพิมพ์วางคู่กับใบวางบิลในลักษณะของ Advance Invoice แลกคืน</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTopic === 'invoices' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 p-1.5 rounded text-indigo-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    การจัดการและจัดพิมพ์ใบแจ้งหนี้ (Invoice System Generator)
                  </h2>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  ระบบวางบิลรองรับโครงสร้างการขนส่งไทยอย่างสมบูรณ์แบบ ทั้งงานขนส่ง และ งานเรียกร้องค่าใช้จ่ายสิทธิล่วงหน้า (Advance Claim):
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 text-xs">
                  <h4 className="font-extrabold text-slate-900">ขั้นตอนการออกใบแจ้งหนี้แบบขั้นตอนละขั้นตอน</h4>
                  <ol className="list-decimal list-inside space-y-2 text-[11px] text-slate-600 font-medium">
                    <li>
                      คลิกไปที่เมนู <strong>"ออกใบแจ้งหนี้ (หัก 1%)"</strong> และคลิกปุ่ม <strong>"+ สร้างเอกสารใบแจ้งหนี้ใหม่"</strong>
                    </li>
                    <li>
                      <strong>ดึงอัตโนมัติ (Auto-Fetch):</strong> ให้เลือก <strong>"ดึงข้อมูลอัตโนมัติจากใบงานจราจร"</strong> ระบบจะค้นหารายการใบงานขนส่งของลูกค้ารายนั้นที่พร้อมรอวางบิลขึ้นมาให้เอง ไม่ต้องจดบันทึกให้สลับซับซ้อน
                    </li>
                    <li>
                      เลือกประเภทใบแจ้งหนี้:
                      <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-[11px] text-slate-500">
                        <li><strong>ใบขนส่ง (Transport Invoice)</strong>: คิดหักภาษี ณ ที่จ่าย 1% ทันที</li>
                        <li><strong>ใบสำรองจ่ายคืน (Advance Invoice)</strong>: สำหรับการเบิกคืนค่าขนตู้ ตู้สินค้า โดยค่าสำรองจ่าย Advance จะไม่ถูกหัก 1% แต่สามารถคิดคำนวณเบวก VAT 7% ของบริการเพิ่มเติมได้ตามข้อตกลงเอกสาร</li>
                      </ul>
                    </li>
                    <li>
                      <strong>โครงสร้างหักภาษี ณ ที่จ่ายและฐานคำนวณ:</strong> ระบบจะใช้คณิตศาสตร์คิดแยกตามประเภทให้อย่างแม่นยำ พร้อมแปลตัวเลของบยอดเงินรวมสุทธิออกมาเป็นหนังสืออักษรไทย (ตัวอกษรไทยสะกดคำประเมิน) ให้อัตโนมัติ สะดวกสบายพร้อมเซ็นต์ชื่อตรวจงานทันที
                    </li>
                    <li>
                      <strong>การบันทึกภาพถ่าย/จัดพิมพ์:</strong> หลังทำการกดบันทึกแล้ว ท่านสามารถกดปุ่ม <strong>"พิมพ์เอกสารใบแจ้งหนี้"</strong> เพื่อนำมาขึ้นจอสำหรับบันทึกภาพหน้าจอ สั่งพิมพ์หน้าเครื่องพิมพ์ หรือ สั่งบันทึกเป็นไฟล์ PDF ในขนาดกระดาษมาตรฐาน A4 ได้โดยตรง
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {selectedTopic === 'receipts' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 p-1.5 rounded text-indigo-600">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    การจัดการและจัดพิมพ์ใบเสร็จรับเงิน (Receipt System generator)
                  </h2>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  เมื่อระบบวางบิลได้รับการชำระเงินโอนสมบูรณ์ หรือได้รับเช็คธนาคารลงตราแล้ว ให้จัดเอกสารยืนยันการรับเงิน:
                </p>

                <div className="p-4 bg-slate-50 rounded-xl space-y-3.5 text-xs">
                  <div className="flex gap-3 text-[11px] text-slate-600 leading-relaxed">
                    <div className="bg-white px-2 py-1 border border-slate-200 rounded font-bold h-fit">Step 1</div>
                    <div>
                      คลิกปุ่ม <strong>"+ สร้างบันทึกใบเสร็จรับเงิน"</strong> ในเมนูแท็บ <strong>"ออกใบเสร็จรับเงิน"</strong>
                    </div>
                  </div>

                  <div className="flex gap-3 text-[11px] text-slate-600 leading-relaxed">
                    <div className="bg-white px-2 py-1 border border-slate-200 rounded font-bold h-fit">Step 2</div>
                    <div>
                      เลือก <strong>"เลขอ้างอิงใบแจ้งหนี้"</strong> ที่มีอยู่ในระบบ โปรแกรมจะดึงข้อมูลลูกค้า ยอดเงินรวมหลังหัก ณ ที่จ่าย และสายเรืออ้างอิงมาแสดงโดยอัตโนมัติเพื่อป้องกันและลดความผิดพลาดของการบันทึกยอดเงินคลาดเคลื่อน
                    </div>
                  </div>

                  <div className="flex gap-3 text-[11px] text-slate-600 leading-relaxed">
                    <div className="bg-white px-2 py-1 border border-slate-200 rounded font-bold h-fit">Step 3</div>
                    <div>
                      เลือกช่องทางชำระเงิน (เช่น เงินสด, เช็คส่วนบุคคล, หรือ โอนเงินผ่านระบบธนาคาร) และบันทึกวันที่รับโอนจริง
                    </div>
                  </div>

                  <div className="flex gap-3 text-[11px] text-slate-600 leading-relaxed">
                    <div className="bg-white px-2 py-1 border border-slate-200 rounded font-bold h-fit">Step 4</div>
                    <div>
                      เมื่อคลิกบันทึก <strong>สถานะใบแจ้งหนี้และใบจราจรขนส่งจะเปลี่ยนเป็น "จ่ายแล้ว / รับเงินแล้ว" ทันที</strong> พร้อมสอดรับไปคำนวณสถิติรายรับจริงบน แดชบอร์ดแผงควบคุมหลักอย่างแม่นยำ
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl text-indigo-950 font-medium text-xs leading-relaxed">
                  💡 <strong>ข้อแนะนำสำหรับการจัดพิมพ์เอกสาร:</strong> ท่านสามารถใช้เครื่องมือพิมพ์ใบเสร็จเพื่อประกอบเข้าคู่แนบส่งให้แผนกบัญชีสำหรับปิดงบลูกหนี้ พิมพ์สวยงาม จัดวางโลโก้อย่างเป็นระเบียบเรียบร้อย
                </div>
              </div>
            )}

            {selectedTopic === 'finance' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 p-1.5 rounded text-indigo-600">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    รายจ่ายรถร่วมคันจ้างงาน, ภาษีหัก ณ ที่จ่าย และ งบประมาณสรุปรายงานประจำเดือน (P&L Financial Reports)
                  </h2>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  ฟังก์ชันเชิงลึกด้านการเงินขั้นสูง ช่วยให้ท่านเคลียร์ส้มหล่น บัญชีรายวัน และวิเคราะห์ค่าเที่ยวการวิ่งงาน:
                </p>

                <div className="space-y-4 font-medium text-xs">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                    <h4 className="font-extrabold text-slate-900">1. การจ่ายชำระพาร์ทเนอร์รถร่วม (Partner Payments Outbound)</h4>
                    <span className="text-[11px] text-slate-600 block leading-relaxed">
                      ใช้ในกรณีที่มีการจ้างรถภายนอก (Sub-contractor) วิ่งงานร่วม โดยสามารถกำหนดประเภทเป็น <strong>"PAY_PARTNER (รถร่วมพันธมิตร)"</strong> หรือ <strong>"RENT_CAR (เช่าเหมาคันวิ่งรายเที่ยว)"</strong> ป้อนยอดราคาจ้างวิ่ง หักตัดรายการเบี้ยจ่ายรายวัน และสรุปยอดที่ต้องสั่งจ่ายจริงแก่ผู้ประกอบการเจ้าอื่น พร้อมบันทึกสถานะเคลียร์เงินได้อย่างชัดเจน
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                    <h4 className="font-extrabold text-slate-900">2. รายการสรุปยื่นภาษีหัก ณ ที่จ่าย (Withholding Taxes Ledger)</h4>
                    <span className="text-[11px] text-slate-600 block leading-relaxed">
                      ควบคุมรายการที่เราหักตอนผู้รับจ้างบริการ ได้แก่ ค่าขนส่ง (1%) และ ค่าบริการค่าแรงช่าง (3%) เพื่อบันทึกเลขผู้จ่ายเงินประจำตัวประชาชน ทะเบียนจดจัดตั้ง บรฺิษัท พร้อมฐานยอดเงินประเมินและอัตราหัก ช่วยให้จัดเอกสารนำส่งกรมสรรพากรสิ้นรอบได้อย่างรวดเร็วในรูปแบบตารางบัญชีสรุปผล
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                    <h4 className="font-extrabold text-slate-900">3. บริหารงบสลิปและเงินเดือน (Payroll System Ledger)</h4>
                    <span className="text-[11px] text-slate-600 block leading-relaxed">
                      บริหารการจ้างค่าใช้จ่ายเที่ยวรถพนักงานขับรถขนส่ง และ อัตราจ้างพนักงานบัญชีออฟฟิศ สามารถป้อนอัตราเงินเดือน ฐานโบนัส เบี้ยขยันพิเศษ ยอดโอที (Overtime) ค่าจ๊อบวิ่งงาน และหักตัดเงินล่วงหน้าที่เบิกไปก่อน ระบบจะทำการคำนวณเบ็ดเสร็จเพื่อให้ได้ตัวเลข <strong>"เงินสลิปจ่ายสุทธิ (Net salary)"</strong> ในทันที
                    </span>
                  </div>

                  <div className="p-4 bg-indigo-50 border border-indigo-150 rounded-xl space-y-2">
                    <h4 className="font-bold text-indigo-950">4. แถบทดสอบงบกำไรขาดทุนประสานงาน (P&L Budget Sheet Dashboard)</h4>
                    <span className="text-[11px] text-indigo-900 block leading-relaxed">
                      ที่บริเวณด้านล่างของหน้าการเงิน ระบบจะรวบรวมข้อมูลรายจ่าย รายรับ บิลเติมดีลัดดีเซลสิริ และค่าซ่อมแซมรอบรถ มาเฉลี่ยประมวลผลเป็น <strong>"กราฟเปรียบเทียบวิเคราะห์กำไรขั้นต้น (Profit & Loss Dashboard Chart)"</strong> ตีเป็นเปอร์เซ็นต์ส่วนต่างให้ผู้บริหารนำมาใช้อ้างอิงการปรับตัวธุรกิจในวินาทีที่ดีที่สุด
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedTopic === 'supabase' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 p-1.5 rounded text-indigo-600">
                    <Database className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    สถาปัตยกรรมคลาวด์ ซิงก์ข้อมูลข้ามระบบ (Cloud Integration & Sync Controls)
                  </h2>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  ระบบมาพร้อมกับการเชื่อมสัมพันธมิตรสองส่วนหลัก ได้แก่ ฐานข้อมูล Live API แบ็คเอนด์ และ ระบบก๊อปปี้สํารองข้อมูลลง Google ชีท:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="p-4 border border-slate-200 rounded-xl space-y-2 bg-gradient-to-br from-emerald-50/50 to-emerald-100/10">
                    <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 uppercase">
                      <Database className="w-4 h-4 text-emerald-600" />
                      1. ตารางหลังระบบ Supabase Live
                    </h4>
                    <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                      ระบบจะส่งคำสั่งบันทึกการทำงานตรงไปที่ Supabase Postgres แบบอรรถประโยชน์ ท่านสามารถกดดูชุดโค้ด SQL ตารางแถว 11 ตารางด้านบนและ RLS นโยบายปลอดภัยของ Supabase เพื่อคัดลอกรหัสเข้าป้อนใน SQL Terminal ของตู้เก็บดาต้าของเซิร์ฟเวอร์เพื่อให้พร้อมใช้ 100%
                    </p>
                  </div>

                  <div className="p-4 border border-slate-200 rounded-xl space-y-2 bg-gradient-to-br from-indigo-50/50 to-indigo-100/10">
                    <h4 className="font-bold text-indigo-950 flex items-center gap-1.5 uppercase">
                      <CloudLightning className="w-4 h-4 text-indigo-600" />
                      2. สารบรรณ Google Sheets Sync
                    </h4>
                    <p className="text-[11px] text-indigo-800 leading-relaxed font-medium">
                      ท่านสามารถสำรองไฟล์หลักฐานออกตารางชีทชีท ได้ตลอดเวลา โดยกดปุ่ม <strong>"เชื่อม Google Sheets"</strong> บนหัวบานควบคุม และระบุ Spreadsheet ID พร้อมวาง Access Token สิทธิ์เบราว์เซอร์ จากนั้นก็สามารถสั่งโยนพิมพ์ชุดตารางสารบรรณได้ในคลิกเดียวทันที
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Decorative corporate bottom help link */}
      <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600 shrink-0" />
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            มีปัญหาระบบติดขัดกรณีสิทธิ์การเข้าถึง? ให้ดูสัญลักษณ์จุดสีสัญญาณเชื่อมต่อ <strong className="text-slate-900 font-sans">Supabase Live</strong> ด้านบน หรือ สั่งสแกนเติมข้อมูลดัมมี่เพื่อจำลองหน้างานวิ่งเที่ยวจริง
          </p>
        </div>
        <div className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-100 px-3 py-1 rounded font-black font-mono">
          KHEMTHIT TECH PROTOCOL v2.06
        </div>
      </div>
    </div>
  );
}

// Simple icons mapped safely
function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
