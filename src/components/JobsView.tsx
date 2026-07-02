import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, Layers, Calendar, 
  MapPin, HelpCircle, Save, CheckCircle
} from 'lucide-react';
import { TransportJob, Customer, Driver, Vehicle, ContainerDetail, DailyExpense } from '../types';
import { formatCurrency, getStatusStyle } from '../utils';

interface JobsViewProps {
  jobs: TransportJob[];
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  expenses: DailyExpense[];
  onSaveJob: (job: TransportJob) => void;
  onDeleteJob: (jobNo: string) => void;
}

const EXPENSE_TYPES = [
  'Transportation',
  'Life on / Life off',
  'Port Charge',
  'Gate Charge',
  'Drop',
  'Overtime',
  'Container Handling',
  'ADMISSION FEE',
  'Shore',
  'Other'
];

export function JobsView({ jobs, customers, drivers, vehicles, expenses, onSaveJob, onDeleteJob }: JobsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [jobNo, setJobNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerId, setCustomerId] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleLicense, setVehicleLicense] = useState('');
  const [driverName, setDriverName] = useState('');
  const [bookingNo, setBookingNo] = useState('');
  const [shipper, setShipper] = useState('');
  const [status, setStatus] = useState<TransportJob['status']>('รอดำเนินการ');
  
  // New Operational Fields for Job Creation
  const [jobType, setJobType] = useState<'Import' | 'Export'>('Import');
  const [quantity, setQuantity] = useState<number>(1);
  const [containerSize, setContainerSize] = useState<string>('40HC');
  const [shipAgent, setShipAgent] = useState<string>('');
  const [pickupAt, setPickupAt] = useState<string>('');
  const [loadAt, setLoadAt] = useState<string>('');
  const [returnAt, setReturnAt] = useState<string>('');
  
  // Containers sub-list
  const [containers, setContainers] = useState<ContainerDetail[]>([]);

  // Editing tracker
  const [isEditMode, setIsEditMode] = useState(false);

  // Filtered jobs
  const filteredJobs = jobs.filter(j => 
    j.jobNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.bookingNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setJobNo(`JOB-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(jobs.length + 1).padStart(3, '0')}`);
    setDate(new Date().toISOString().split('T')[0]);
    setCustomerId(customers[0]?.id || '');
    setOrigin('');
    setDestination('');
    setVehicleLicense(vehicles[0]?.licensePlate || '');
    setDriverName(drivers[0]?.name || '');
    setBookingNo('');
    setShipper('');
    setContainers([{ containerNo: '', transportation: 3500, portCharge: 0, containerHandling: 0, liftOnOff: 0, expenses: [] }]);
    setStatus('รอดำเนินการ');
    setJobType('Import');
    setQuantity(1);
    setContainerSize('40HC');
    setShipAgent('');
    setPickupAt('');
    setLoadAt('');
    setReturnAt('');
    setIsEditMode(false);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (job: TransportJob) => {
    setJobNo(job.jobNo);
    setDate(job.date);
    setCustomerId(job.customerId);
    setOrigin(job.origin);
    setDestination(job.destination);
    setVehicleLicense(job.vehicleLicense);
    setDriverName(job.driverName);
    setBookingNo(job.bookingNo);
    setShipper(job.shipper);
    setContainers(
      job.containers.length > 0 
        ? job.containers.map(c => ({ ...c, expenses: c.expenses || [] }))
        : [{ containerNo: '', transportation: 3500, portCharge: 0, containerHandling: 0, liftOnOff: 0, expenses: [] }]
    );
    setStatus(job.status);
    setJobType(job.jobType || 'Import');
    setQuantity(job.quantity || 1);
    setContainerSize(job.containerSize || '40HC');
    setShipAgent(job.shipAgent || '');
    setPickupAt(job.pickupAt || '');
    setLoadAt(job.loadAt || '');
    setReturnAt(job.returnAt || '');
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Add/remove rows from containers sub-form
  const addContainerRow = () => {
    setContainers([
      ...containers,
      { containerNo: '', transportation: 3500, portCharge: 0, containerHandling: 0, liftOnOff: 0, expenses: [] }
    ]);
  };

  const removeContainerRow = (index: number) => {
    if (containers.length === 1) return;
    setContainers(containers.filter((_, i) => i !== index));
  };

  const updateContainerField = (index: number, field: keyof ContainerDetail, value: any) => {
    const updated = [...containers];
    if (field === 'containerNo' || field === 'otherExpenseName') {
      updated[index][field] = value;
    } else {
      updated[index][field] = parseFloat(value) || 0;
      
      if (field === 'overtimeQty' || field === 'overtimeRate') {
        const qty = updated[index].overtimeQty || 0;
        const rate = updated[index].overtimeRate || 0;
        updated[index].otherExpenseAmount = Math.round(qty * rate * 100) / 100;
        updated[index].otherExpenseName = 'Overtime';
      }
    }
    setContainers(updated);
  };

  const addContainerExpense = (containerIndex: number) => {
    const updated = [...containers];
    const container = updated[containerIndex];
    const expList = container.expenses ? [...container.expenses] : [];
    expList.push({ name: 'Overtime', amount: 0 });
    container.expenses = expList;
    setContainers(updated);
  };

  const removeContainerExpense = (containerIndex: number, expenseIndex: number) => {
    const updated = [...containers];
    const container = updated[containerIndex];
    if (container.expenses) {
      container.expenses = container.expenses.filter((_, i) => i !== expenseIndex);
    }
    setContainers(updated);
  };

  const updateContainerExpenseField = (containerIndex: number, expenseIndex: number, field: 'name' | 'amount', value: any) => {
    const updated = [...containers];
    const container = updated[containerIndex];
    if (container.expenses) {
      const expList = [...container.expenses];
      if (field === 'name') {
        expList[expenseIndex].name = value;
      } else {
        expList[expenseIndex].amount = parseFloat(value) || 0;
      }
      container.expenses = expList;
    }
    setContainers(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      alert("กรุณาเลือกชื่อคู่ค้า/ลูกค้า");
      return;
    }

    const selectedCust = customers.find(c => c.id === customerId);
    if (!selectedCust) return;

    const selectedVehicle = vehicles.find(v => v.licensePlate === vehicleLicense);

    // Calculate total job amount based on sum of all containers
    const calculatedTotal = containers.reduce((sum, c) => {
      const expensesSum = (c.expenses || []).reduce((esum, exp) => esum + (exp.amount || 0), 0);
      return sum + c.transportation + c.portCharge + c.containerHandling + c.liftOnOff + (c.otherExpenseAmount || 0) + expensesSum;
    }, 0);

    const updatedJob: TransportJob = {
      jobNo,
      date,
      customerId,
      customerName: selectedCust.name,
      origin,
      destination,
      vehicleLicense,
      driverName,
      vehicleType: selectedVehicle?.type || 'หัวลาก 10 ล้อ',
      bookingNo,
      shipper,
      containers,
      totalAmount: calculatedTotal,
      status,
      jobType,
      quantity,
      containerSize,
      shipAgent,
      pickupAt,
      loadAt,
      returnAt
    };

    onSaveJob(updatedJob);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header and Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800 font-sans flex items-center gap-1.5">
            <Layers className="text-slate-600 w-5 h-5" />
            จัดการแผนปฏิบัติการงานวิ่งขนส่ง
          </h2>
          <p className="text-slate-400 text-xs">ควบคุมกระดานวางแผนงาน จัดสรรรถ ข้อมูลจอง Booking และหมายเลข Container</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="ค้นหาแผนขนส่ง..."
              className="bg-slate-50 hover:bg-slate-100 focus:bg-white text-xs text-slate-700 pl-9 pr-4 py-2 rounded-lg border border-slate-200 outline-none w-full sm:w-60 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            disabled={customers.length === 0}
            onClick={handleOpenAddModal}
            className="flex items-center gap-1 bg-slate-900 text-white font-semibold text-xs py-2 px-3.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            title={customers.length === 0 ? "เพิ่มทะเบียนลูกค้าในระบบก่อน" : ""}
          >
            <Plus className="w-4 h-4" /> วางแผนงานวิ่ง
          </button>
        </div>
      </div>

      {/* Google Sheets styling tables with alternating row coloring */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-600">
                <th className="p-3 border-r border-slate-150 font-semibold">Job No</th>
                <th className="p-3 border-r border-slate-150 font-semibold text-center">วันที่</th>
                <th className="p-3 border-r border-slate-150 font-semibold">ลูกค้า / ผู้รับส่งสินค้า / Booking</th>
                <th className="p-3 border-r border-slate-150 font-semibold">หัวลาก & คนขับ</th>
                <th className="p-3 border-r border-slate-150 font-semibold">เส้นทางวิ่งสินค้า</th>
                <th className="p-3 border-r border-slate-150 font-semibold text-center text-slate-900">จำนวนตู้</th>
                <th className="p-3 border-r border-slate-150 font-semibold text-right">ยอดรับค่าขนส่ง</th>
                <th className="p-3 border-r border-slate-150 font-semibold text-right text-rose-800">เบิกรายวันสะสม</th>
                <th className="p-3 border-r border-slate-150 font-semibold text-right text-emerald-800">กำไรขั้นต้น (GP)</th>
                <th className="p-3 border-r border-slate-150 font-semibold text-center">สถานะ</th>
                <th className="p-3 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-slate-700">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-slate-400 font-mono">
                    ไม่พบตารางแผนการขนส่งในระบบ (ลองกด "+ วางแผนงานวิ่ง")
                  </td>
                </tr>
              ) : (
                filteredJobs.map((j) => {
                  const jobExpensesList = expenses.filter(e => e.jobNo === j.jobNo);
                  const totalJobExpenses = jobExpensesList.reduce((sum, e) => sum + e.amount, 0);
                  const grossProfit = j.totalAmount - totalJobExpenses;
                  const gpPercent = j.totalAmount > 0 ? (grossProfit / j.totalAmount) * 100 : 0;

                  return (
                    <tr key={j.jobNo} className="hover:bg-slate-50/70 transition-colors odd:bg-white even:bg-slate-50/45">
                      <td className="p-3 border-r border-slate-150 font-mono font-bold align-middle">{j.jobNo}</td>
                      <td className="p-3 border-r border-slate-150 font-mono text-center text-slate-500 whitespace-nowrap align-middle">
                        {j.date}
                      </td>
                      <td className="p-3 border-r border-slate-150 align-middle">
                        <div className="font-bold text-slate-900">{j.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono whitespace-normal leading-tight">
                          Shipper: {j.shipper || 'N/A'} | Booking: {j.bookingNo || 'N/A'}
                        </div>
                        {j.jobType && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            <span className={`px-1 rounded text-[9px] font-bold ${j.jobType === 'Import' ? 'bg-blue-50 text-blue-600 border border-blue-150' : 'bg-amber-50 text-amber-600 border border-amber-150'}`}>
                              {j.jobType}
                            </span>
                            {j.containerSize && (
                              <span className="px-1 rounded text-[9px] bg-slate-100 text-slate-600 font-mono border border-slate-200">
                                {j.containerSize}
                              </span>
                            )}
                            {j.quantity && (
                              <span className="px-1 rounded text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-150 font-mono">
                                Qty: {j.quantity}
                              </span>
                            )}
                            {j.shipAgent && (
                              <span className="px-1 rounded text-[9px] bg-purple-50 text-purple-600 border border-purple-150">
                                Agent: {j.shipAgent}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3 border-r border-slate-150 align-middle">
                        <div className="font-mono bg-slate-100 rounded px-1.5 py-0.5 inline-block text-slate-700 font-semibold text-[10px] mb-0.5">{j.vehicleLicense}</div>
                        <div className="text-[11px] text-slate-500">{j.driverName}</div>
                      </td>
                      <td className="p-3 border-r border-slate-150 align-middle">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-[11px]">{j.origin}</span>
                        </div>
                        <div className="text-slate-400 pl-4 text-[10px]">ไป: {j.destination}</div>
                        {(j.pickupAt || j.loadAt || j.returnAt) && (
                          <div className="mt-1 pl-4 text-[9px] text-slate-400 font-sans leading-tight space-y-0.5">
                            {j.pickupAt && <div className="truncate" title={j.pickupAt}>• รับตู้: {j.pickupAt}</div>}
                            {j.loadAt && <div className="truncate" title={j.loadAt}>• บรรจุ: {j.loadAt}</div>}
                            {j.returnAt && <div className="truncate" title={j.returnAt}>• คืนตู้: {j.returnAt}</div>}
                          </div>
                        )}
                      </td>
                      <td className="p-3 border-r border-slate-150 text-center font-bold font-mono align-middle text-slate-900">
                        {j.containers.length} ตู้
                      </td>
                      <td className="p-3 border-r border-slate-150 text-right font-mono font-extrabold text-slate-900 align-middle whitespace-nowrap">
                        {formatCurrency(j.totalAmount)}
                      </td>
                      <td className="p-3 border-r border-slate-150 text-right font-mono text-rose-600 font-bold align-middle whitespace-nowrap">
                        {totalJobExpenses > 0 ? `-${formatCurrency(totalJobExpenses)}` : '0.00'}
                        {jobExpensesList.length > 0 && (
                          <span className="block text-[9px] text-slate-400 font-normal font-sans">({jobExpensesList.length} แฟ้มเบิก)</span>
                        )}
                      </td>
                      <td className="p-3 border-r border-slate-150 text-right font-mono font-extrabold align-middle whitespace-nowrap">
                        <span className={grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                          {formatCurrency(grossProfit)}
                        </span>
                        <span className="block text-[9px] text-slate-400 font-normal font-sans">
                          ({gpPercent.toFixed(1)}% GP)
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-150 text-center align-middle whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(j.status)}`}>
                          {j.status}
                        </span>
                      </td>
                    <td className="p-3 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handleOpenEditModal(j)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg border border-slate-200 transition-colors"
                          title="แก้ไขรายละเอียดงาน"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`คุณต้องการลบรายงานแผนงานเลขที่ ${j.jobNo} หรือไม่?`)) {
                              onDeleteJob(j.jobNo);
                            }
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg border border-red-200 transition-colors"
                          title="ลบงานนี้ออก"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Job Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide uppercase font-sans">
                  {isEditMode ? 'แก้ไขรายละเอียดงานขนส่งคอนเทนเนอร์' : 'เพิ่มและวางตารางแผนการขนส่งใหม่'}
                </h3>
                <p className="text-slate-400 text-xs">ระบุผู้ขนส่ง, รหัส Booking, เส้นทาง และกรอกตู้คอนเทนเนอร์แยกคำนวณ</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white bg-slate-850 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {isEditMode && (() => {
                const modalJobExpenses = expenses.filter(e => e.jobNo === jobNo);
                const totalModalExpenses = modalJobExpenses.reduce((sum, e) => sum + e.amount, 0);
                const totalRevenueOfJob = containers.reduce((sum, c) => {
                  const customSum = (c.expenses || []).reduce((s, e) => s + e.amount, 0);
                  const otherAmt = c.otherExpenseAmount || 0;
                  return sum + (c.transportation || 0) + (c.portCharge || 0) + (c.containerHandling || 0) + (c.liftOnOff || 0) + otherAmt + customSum;
                }, 0);
                const modalGP = totalRevenueOfJob - totalModalExpenses;
                const modalGPPercent = totalRevenueOfJob > 0 ? (modalGP / totalRevenueOfJob) * 105 / 105 * 100 : 0;

                return (
                  <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Job Costing Ledgers & Profitability Report</h4>
                        <p className="text-[10px] text-slate-300">รายงานสรุปผลกำไร-ขาดทุนรายวันสะสม Real-Time สำหรับจ๊อบ {jobNo}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${modalGP >= 0 ? 'bg-emerald-950/45 text-emerald-400 border-emerald-800/60' : 'bg-red-950/45 text-red-400 border-red-800/60'}`}>
                        {modalGP >= 0 ? 'กำไร (PROFITABLE)' : 'ขาดทุน (LOSS)'}
                      </span>
                    </div>

                    {/* Costing Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">รายรับรวมทั้งหมด (Revenue)</span>
                        <span className="text-sm font-extrabold font-mono text-white">{formatCurrency(totalRevenueOfJob)}</span>
                      </div>
                      <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">ค่าใช้จ่ายเบิกรายวันสะสม (Expenses Claim)</span>
                        <span className="text-sm font-extrabold font-mono text-rose-400">{totalModalExpenses > 0 ? `-${formatCurrency(totalModalExpenses)}` : '0.00'}</span>
                      </div>
                      <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 col-span-1">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">ส่วนต่างสุทธิ GP (Margin)</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-base font-extrabold font-mono ${modalGP >= 0 ? 'text-emerald-450' : 'text-red-450'}`}>
                            {formatCurrency(modalGP)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">({modalGPPercent.toFixed(1)}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown List of Expenses */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold block">รายละเอียดแฟ้มเงินเบิกสะสมของงานวิ่งนี้:</span>
                      {modalJobExpenses.length === 0 ? (
                        <div className="text-slate-500 border border-dashed border-slate-800 text-center py-4 rounded-lg font-mono text-[11px]">
                          ยังไม่มีผู้ขับใดเบิกค่าใช้จ่ายรายวันนี้สำหรับจ๊อบ {jobNo}
                        </div>
                      ) : (
                        <div className="bg-slate-950/50 rounded-lg overflow-hidden border border-slate-805 divide-y divide-slate-850 max-h-40 overflow-y-auto">
                          {modalJobExpenses.map(exp => (
                            <div key={exp.id} className="p-2.5 flex items-center justify-between text-[11px] hover:bg-slate-855/30 transition-all">
                              <div className="flex items-center gap-3">
                                <span className="font-mono bg-slate-800 font-bold px-1.5 py-0.5 rounded text-slate-300 text-[10px]">
                                  {exp.id.includes('/') ? exp.id.split('/')[1] : exp.id}
                                </span>
                                <div className="space-y-0.5">
                                  <div className="font-bold flex items-center gap-2">
                                    <span className="text-white text-[11px]">{exp.type}</span>
                                    <span className={`text-[9px] font-bold px-1 rounded ${exp.billType === 'Adv' ? 'bg-orange-950/50 text-orange-400 border border-orange-900' : 'bg-sky-950/50 text-sky-400 border border-sky-950'}`}>
                                      {exp.billType === 'Adv' ? 'ADV' : 'NORMAL'}
                                    </span>
                                  </div>
                                  <div className="text-slate-450 leading-none text-[10px]">{exp.description} | พนักงาน: {exp.driverName} ({exp.vehicleLicense})</div>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-rose-400">-{formatCurrency(exp.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Core Information Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">งานวินเลขที่: Job No</label>
                  <input 
                    type="text" 
                    value={jobNo}
                    onChange={(e) => setJobNo(e.target.value)}
                    className="w-full text-xs bg-slate-150 text-slate-600 font-mono border border-slate-200 rounded-lg p-2.5 outline-none font-bold"
                    readOnly={isEditMode}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">วันที่ปฏิบัติงาน</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">เลือก บริษัท คู่ค้า / ลูกค้า</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400"
                    required
                  >
                    <option value="">-- กรุณาเลือกคู่ค้า/ลูกค้า --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">รถขนส่ง / ทะเบียน</label>
                  <select
                    value={vehicleLicense}
                    onChange={(e) => setVehicleLicense(e.target.value)}
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400"
                    required
                  >
                    {vehicles.map(v => (
                      <option key={v.licensePlate} value={v.licensePlate}>{v.licensePlate} - {v.type}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">พนักงานขับรถขนส่ง</label>
                  <select
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400"
                    required
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.name}>{d.name} (สถานะ: {d.status})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">สถานะงานขนส่ง</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400 font-bold"
                    required
                  >
                    <option value="รอดำเนินการ">รอดำเนินการ</option>
                    <option value="กำลังขนส่ง">กำลังขนส่ง</option>
                    <option value="ส่งแล้ว">ส่งแล้ว</option>
                    <option value="วางบิลแล้ว">วางบิลแล้ว</option>
                    <option value="รับเงินแล้ว">รับเงินแล้ว</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">ผู้ว่าจ้างเรือ Shipper (ระบุหัวเอกสาร)</label>
                  <input 
                    type="text" 
                    value={shipper}
                    onChange={(e) => setShipper(e.target.value)}
                    placeholder="เช่น MAERSK LINE CO., LTD"
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">หมายเลขการจอง Booking No</label>
                  <input 
                    type="text" 
                    value={bookingNo}
                    onChange={(e) => setBookingNo(e.target.value)}
                    placeholder="เช่น BK-LCB99008"
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">ต้นทางวิ่ง (Origin)</label>
                  <input 
                    type="text" 
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="ลานตู้, ท่าเรือ LCB"
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">ปลายทางวิ่ง (Destination)</label>
                  <input 
                    type="text" 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="คลังสินค้าลูกค้า"
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Type (ประเภทงาน)</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as 'Import' | 'Export')}
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400 font-bold"
                    required
                  >
                    <option value="Import">Import (นำเข้า)</option>
                    <option value="Export">Export (ส่งออก)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Quantity (จำนวน)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400 font-mono text-right"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Size Container (ขนาดตู้)</label>
                  <select
                    value={containerSize}
                    onChange={(e) => setContainerSize(e.target.value)}
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400"
                    required
                  >
                    <option value="20GP">20GP (ตู้สั้น 20 ฟุต)</option>
                    <option value="40GP">40GP (ตู้ยาว 40 ฟุตทั่วไป)</option>
                    <option value="40HC">40HC (ตู้ไฮคิว 40 ฟุตสูง)</option>
                    <option value="45HC">45HC (ตู้คอนเทนเนอร์ 45 ฟุต)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Ship Agent (เอเย่นต์เรือ)</label>
                  <input 
                    type="text" 
                    value={shipAgent}
                    onChange={(e) => setShipAgent(e.target.value)}
                    placeholder="เช่น ONE, MSK, COSCO, CO-LOAD"
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Pickup at (รับตู้ที่)</label>
                  <input 
                    type="text" 
                    value={pickupAt}
                    onChange={(e) => setPickupAt(e.target.value)}
                    placeholder="เช่น ลานตู้สยาม, ท่าเรือ LCB"
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Load at (บรรจุที่)</label>
                  <input 
                    type="text" 
                    value={loadAt}
                    onChange={(e) => setLoadAt(e.target.value)}
                    placeholder="เช่น โรงงานลูกค้า อมตะนคร"
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Return at (คืนตู้ที่)</label>
                  <input 
                    type="text" 
                    value={returnAt}
                    onChange={(e) => setReturnAt(e.target.value)}
                    placeholder="เช่น ท่าเรือแหลมฉบัง B5"
                    className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              {/* Dynamic Multiple Container Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 font-sans block">รายการตู้คอนเทนเนอร์ (Multi-Container per Job)</h4>
                    <p className="text-slate-400 text-xs text-slate-500">กรอกหมายเลขอ้างอิงตู้และค่าดำเนินการอื่น ๆ เพื่อให้ระบบคำนวณและออกใบแจ้งหนี้อย่างละเอียดสะสมแยกตู้</p>
                  </div>
                  <button
                    type="button"
                    onClick={addContainerRow}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs py-1.5 px-3 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> เพิ่มตู้คอนเทนเนอร์
                  </button>
                </div>

                <div className="space-y-3">
                  {containers.map((c, idx) => (
                    <div key={idx} className="bg-slate-50 hover:bg-slate-100/75 p-4 rounded-xl border border-slate-200 space-y-3 relative">
                      <button
                        type="button"
                        disabled={containers.length === 1}
                        onClick={() => removeContainerRow(idx)}
                        className="absolute right-3 top-3 text-red-500 hover:text-red-700 disabled:opacity-30 bg-white hover:bg-red-50 p-1.5 rounded-lg border border-slate-200 transition-colors"
                        title="นำตู้นี้ออก"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[94%]">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">หมายเลขตู้คอนเทนเนอร์</label>
                          <input
                            type="text"
                            placeholder="เช่น MSKU820129-9"
                            value={c.containerNo}
                            onChange={(e) => updateContainerField(idx, 'containerNo', e.target.value)}
                            className="w-full text-xs font-mono bg-white text-slate-800 border border-slate-200 rounded-lg p-2 outline-none font-bold placeholder-slate-400"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">ค่าขนส่ง (Transportation)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={c.transportation || ''}
                            onChange={(e) => updateContainerField(idx, 'transportation', e.target.value)}
                            className="w-full text-xs font-mono bg-white text-slate-800 border border-slate-200 rounded-lg p-2 outline-none text-right font-bold text-slate-900"
                            required
                          />
                        </div>
                      </div>

                      {/* Overtime (Locked Other Expense) - Orange Highlighted Area */}
                      <div className="border border-orange-300 bg-orange-50/40 p-3.5 rounded-xl space-y-2 max-w-[94%]">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-orange-850 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            ค่าบริการล่วงเวลา / อื่นๆ (Overtime - ล็อกหักภาษี ณ ที่จ่าย 1% อัตโนมัติ)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white/70 p-3 rounded-lg border border-orange-100/50">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600 block">1. จำนวน (QTY)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="เช่น 1"
                              value={c.overtimeQty || ''}
                              onChange={(e) => updateContainerField(idx, 'overtimeQty', e.target.value)}
                              className="w-full text-xs font-mono bg-white text-slate-800 border border-slate-200 rounded p-2 focus:border-orange-400 outline-none text-right font-bold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600 block">2. หน่วยละ (Rate)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="เช่น 200"
                              value={c.overtimeRate || ''}
                              onChange={(e) => updateContainerField(idx, 'overtimeRate', e.target.value)}
                              className="w-full text-xs font-mono bg-white text-slate-800 border border-slate-200 rounded p-2 focus:border-orange-400 outline-none text-right font-bold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-700 block">3. จำนวนสุทธิ</label>
                            <input
                              type="text"
                              readOnly
                              placeholder="0.00"
                              value={c.otherExpenseAmount ? (c.otherExpenseAmount).toFixed(2) : '0.00'}
                              className="w-full text-xs font-mono bg-slate-50 text-orange-950 border border-slate-200 rounded p-2 outline-none text-right font-black"
                            />
                          </div>
                          <div className="space-y-1 flex flex-col justify-end">
                            <div className="text-right p-1.5 px-3 bg-red-50 rounded border border-red-100/80 text-[10px] text-red-900 font-mono font-bold leading-tight flex flex-col justify-center h-9">
                              <div>หัก ณ ที่จ่าย 1%</div>
                              <div className="text-[11px] font-extrabold text-red-650">
                                -{c.otherExpenseAmount ? (c.otherExpenseAmount * 0.01).toFixed(2) : '0.00'} บ.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* รายการค่าใช้จ่ายและบริการอื่น ๆ เพิ่มเติม (Dynamic Expenses) */}
                      <div className="border-t border-slate-200/60 pt-3 mt-1.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 block">รายการค่าใช้จ่ายและบริการอื่น ๆ เพิ่มเติม (Dynamic Expenses)</span>
                          <button
                            type="button"
                            onClick={() => addContainerExpense(idx)}
                            className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-1 px-2.5 rounded-md border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> เพิ่มรายการค่าใช้จ่าย / บริการอื่น ๆ
                          </button>
                        </div>

                        {(!c.expenses || c.expenses.length === 0) ? (
                          <div className="text-[11px] text-slate-400 font-sans italic bg-slate-50 border border-dashed border-slate-200 p-2 text-center rounded-lg">
                            ไม่มีรายการค่าใช้จ่ายเพิ่มเติม (กดปุ่ม "+ เพิ่มรายการค่าใช้จ่าย" เพื่อระบุเพิ่มเติม)
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {c.expenses.map((exp, expIdx) => (
                              <div key={expIdx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200/80 shadow-xs">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    list="expense-preset-options"
                                    placeholder="ระบุชื่อประเภทบริการ/ค่าใช้จ่าย หรือเลือก..."
                                    value={exp.name}
                                    onChange={(e) => updateContainerExpenseField(idx, expIdx, 'name', e.target.value)}
                                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5 outline-none font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 placeholder-slate-400"
                                  />
                                </div>
                                <div className="w-32">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="จำนวนเงิน"
                                    value={exp.amount || ''}
                                    onChange={(e) => updateContainerExpenseField(idx, expIdx, 'amount', e.target.value)}
                                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded p-1.5 outline-none text-right font-extrabold text-slate-900"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeContainerExpense(idx, expIdx)}
                                  className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-colors"
                                  title="ลบรายการนี้"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Total Job Amount Summary Display */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-inner">
                <span className="text-xs font-semibold text-slate-400">สรุปยอดคำนวณค่าขนส่งรวมทุกตู้สะสม:</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {formatCurrency(
                    containers.reduce((sum, c) => {
                      const expensesSum = (c.expenses || []).reduce((esum, exp) => esum + (exp.amount || 0), 0);
                      return sum + c.transportation + c.portCharge + c.containerHandling + c.liftOnOff + (c.otherExpenseAmount || 0) + expensesSum;
                    }, 0)
                  )}
                </span>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 px-4 rounded-lg border border-slate-200 transition-colors"
                >
                  ยกเลิกค้างการทำงาน
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-slate-950 text-white font-semibold text-xs py-2 px-5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Save className="w-4 h-4" /> บันทึกแผนงานขนส่ง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <datalist id="expense-preset-options">
        {EXPENSE_TYPES.map((type) => (
          <option key={type} value={type} />
        ))}
      </datalist>
    </div>
  );
}
