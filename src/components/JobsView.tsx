import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, Layers, Calendar, 
  MapPin, HelpCircle, Save, CheckCircle
} from 'lucide-react';
import { TransportJob, Customer, Driver, Vehicle, ContainerDetail } from '../types';
import { formatCurrency, getStatusStyle } from '../utils';

interface JobsViewProps {
  jobs: TransportJob[];
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onSaveJob: (job: TransportJob) => void;
  onDeleteJob: (jobNo: string) => void;
}

export function JobsView({ jobs, customers, drivers, vehicles, onSaveJob, onDeleteJob }: JobsViewProps) {
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
    setContainers([{ containerNo: '', transportation: 3500, portCharge: 0, containerHandling: 0, liftOnOff: 0 }]);
    setStatus('รอดำเนินการ');
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
    setContainers(job.containers.length > 0 ? [...job.containers] : [{ containerNo: '', transportation: 3500, portCharge: 0, containerHandling: 0, liftOnOff: 0 }]);
    setStatus(job.status);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Add/remove rows from containers sub-form
  const addContainerRow = () => {
    setContainers([
      ...containers,
      { containerNo: '', transportation: 3500, portCharge: 0, containerHandling: 0, liftOnOff: 0 }
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
    const calculatedTotal = containers.reduce((sum, c) => 
      sum + c.transportation + c.portCharge + c.containerHandling + c.liftOnOff + (c.otherExpenseAmount || 0), 0
    );

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
      status
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
                <th className="p-3 border-r border-slate-150 font-semibold text-right">ยอดรวมค่าขนส่ง</th>
                <th className="p-3 border-r border-slate-150 font-semibold text-center">สถานะ</th>
                <th className="p-3 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-slate-700">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400 font-mono">
                    ไม่พบตารางแผนการขนส่งในระบบ (ลองกด "+ วางแผนงานวิ่ง")
                  </td>
                </tr>
              ) : (
                filteredJobs.map((j) => (
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
                    </td>
                    <td className="p-3 border-r border-slate-150 text-center font-bold font-mono align-middle text-slate-900">
                      {j.containers.length} ตู้
                    </td>
                    <td className="p-3 border-r border-slate-150 text-right font-mono font-extrabold text-slate-900 align-middle whitespace-nowrap">
                      {formatCurrency(j.totalAmount)}
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
                ))
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
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">ต้นทางวิ่ง</label>
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
                      <label className="text-xs font-bold text-slate-700 block">ปลายทางวิ่ง</label>
                      <input 
                        type="text" 
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="คลังสินค้าลูกค้า"
                        className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-400"
                        required
                      />
                    </div>
                  </div>
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

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 max-w-[94%]">
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
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">ค่าภาระท่าเรือ (Port Charge)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={c.portCharge || ''}
                            onChange={(e) => updateContainerField(idx, 'portCharge', e.target.value)}
                            className="w-full text-xs font-mono bg-white text-slate-800 border border-slate-200 rounded-lg p-2 outline-none text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">ค่ายกจัดยกย้าย (Container Handling)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={c.containerHandling || ''}
                            onChange={(e) => updateContainerField(idx, 'containerHandling', e.target.value)}
                            className="w-full text-xs font-mono bg-white text-slate-800 border border-slate-200 rounded-lg p-2 outline-none text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">ค่ายกตู้ขึ้น/ลง (Lift on/off)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={c.liftOnOff || ''}
                            onChange={(e) => updateContainerField(idx, 'liftOnOff', e.target.value)}
                            className="w-full text-xs font-mono bg-white text-slate-800 border border-slate-200 rounded-lg p-2 outline-none text-right"
                          />
                        </div>
                      </div>

                      {/* รายการค่าใช้จ่ายอื่น ๆ และจำนวนเงิน */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[94%] border-t border-slate-200/60 pt-3 mt-1.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">รายการค่าใช้จ่ายอื่น ๆ (Other Expense Name)</label>
                          <input
                            type="text"
                            placeholder="เช่น ค่าล่วงเวลาตู้นอกเวลาทำงานปกติ หรืออื่น ๆ"
                            value={c.otherExpenseName || ''}
                            onChange={(e) => updateContainerField(idx, 'otherExpenseName', e.target.value)}
                            className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded-lg p-2 outline-none placeholder-slate-400"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">จำนวนยอดเงินเพิ่มเติม (Amount)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={c.otherExpenseAmount || ''}
                            onChange={(e) => updateContainerField(idx, 'otherExpenseAmount', e.target.value)}
                            className="w-full text-xs font-mono bg-white text-slate-800 border border-slate-200 rounded-lg p-2 outline-none text-right font-bold text-indigo-600"
                          />
                        </div>
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
                    containers.reduce((sum, c) => 
                      sum + c.transportation + c.portCharge + c.containerHandling + c.liftOnOff + (c.otherExpenseAmount || 0), 0
                    )
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
    </div>
  );
}
