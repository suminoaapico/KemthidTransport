import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, Users, Truck, UserCheck, 
  UserPlus, Briefcase, Mail, Phone, Calendar, Tag, ShieldAlert, Check
} from 'lucide-react';
import { Customer, Driver, Vehicle, Employee } from '../types';
import { getStatusStyle } from '../utils';

interface RegistryViewProps {
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  employees: Employee[];
  onSaveCustomer: (cust: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onSaveDriver: (drv: Driver) => void;
  onDeleteDriver: (id: string) => void;
  onSaveVehicle: (veh: Vehicle) => void;
  onDeleteVehicle: (license: string) => void;
  onSaveEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

export function RegistryView({
  customers, drivers, vehicles, employees,
  onSaveCustomer, onDeleteCustomer,
  onSaveDriver, onDeleteDriver,
  onSaveVehicle, onDeleteVehicle,
  onSaveEmployee, onDeleteEmployee
}: RegistryViewProps) {
  const [activeRegTab, setActiveRegTab] = useState<'customers' | 'drivers' | 'vehicles' | 'employees'>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // General Form States to map across types
  const [editId, setEditId] = useState(''); // Tracking if editing
  const [isEdit, setIsEdit] = useState(false);

  // Customer Field states
  const [custName, setCustName] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custLine, setCustLine] = useState('');
  const [custCredit, setCustCredit] = useState(30);
  const [custAddress, setCustAddress] = useState('');
  const [custTaxId, setCustTaxId] = useState('');

  // Driver Field states
  const [drvName, setDrvName] = useState('');
  const [drvPhone, setDrvPhone] = useState('');
  const [drvLicense, setDrvLicense] = useState('');
  const [drvExpiry, setDrvExpiry] = useState('');
  const [drvVehicle, setDrvVehicle] = useState('');
  const [drvStatus, setDrvStatus] = useState<'Available' | 'On Duty'>('Available');

  // Vehicle Field states
  const [vehPlate, setVehPlate] = useState('');
  const [vehType, setVehType] = useState('หัวลาก 10 ล้อ');
  const [vehBrand, setVehBrand] = useState('ISUZU');
  const [vehYear, setVehYear] = useState('2022');
  const [vehAct, setVehAct] = useState('');
  const [vehIns, setVehIns] = useState('');
  const [vehStatus, setVehStatus] = useState<'Available' | 'Maintenance'>('Available');

  // Employee Field states
  const [empName, setEmpName] = useState('');
  const [empPosition, setEmpPosition] = useState('');
  const [empDept, setEmpDept] = useState('บัญชีและการเงิน');
  const [empPhone, setEmpPhone] = useState('');
  const [empSalary, setEmpSalary] = useState(18000);
  const [empStart, setEmpStart] = useState('');

  const resetForms = () => {
    setIsEdit(false);
    setEditId('');
    
    // reset customer
    setCustName('');
    setCustCompany('');
    setCustPhone('');
    setCustLine('');
    setCustCredit(30);
    setCustAddress('');
    setCustTaxId('');

    // reset driver
    setDrvName('');
    setDrvPhone('');
    setDrvLicense('');
    setDrvExpiry('');
    setDrvVehicle('');
    setDrvStatus('Available');

    // reset vehicle
    setVehPlate('');
    setVehType('หัวลาก 10 ล้อ');
    setVehBrand('ISUZU');
    setVehYear('2022');
    setVehAct('');
    setVehIns('');
    setVehStatus('Available');

    // reset employee
    setEmpName('');
    setEmpPosition('');
    setEmpDept('บัญชีและการเงิน');
    setEmpPhone('');
    setEmpSalary(18000);
    setEmpStart(new Date().toISOString().split('T')[0]);
  };

  const handleOpenAdd = () => {
    resetForms();
    setIsModalOpen(true);
  };

  const handleEditCustomer = (c: Customer) => {
    resetForms();
    setEditId(c.id);
    setIsEdit(true);
    setCustName(c.name);
    setCustCompany(c.company);
    setCustPhone(c.phone);
    setCustLine(c.line);
    setCustCredit(c.creditTerm);
    setCustAddress(c.address);
    setCustTaxId(c.taxId || '');
    setIsModalOpen(true);
  };

  const handleEditDriver = (d: Driver) => {
    resetForms();
    setEditId(d.id);
    setIsEdit(true);
    setDrvName(d.name);
    setDrvPhone(d.phone);
    setDrvLicense(d.licenseNo);
    setDrvExpiry(d.expiryDate);
    setDrvVehicle(d.vehicleLicense);
    setDrvStatus(d.status);
    setIsModalOpen(true);
  };

  const handleEditVehicle = (v: Vehicle) => {
    resetForms();
    setEditId(v.licensePlate); // License plate serves as ID
    setIsEdit(true);
    setVehPlate(v.licensePlate);
    setVehType(v.type);
    setVehBrand(v.brand);
    setVehYear(v.year);
    setVehAct(v.actExpiry);
    setVehIns(v.insExpiry);
    setVehStatus(v.status);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (e: Employee) => {
    resetForms();
    setEditId(e.id);
    setIsEdit(true);
    setEmpName(e.name);
    setEmpPosition(e.position);
    setEmpDept(e.department);
    setEmpPhone(e.phone);
    setEmpSalary(e.salary);
    setEmpStart(e.startDate);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRegTab === 'customers') {
      const id = isEdit ? editId : `CUST-${String(customers.length + 1).padStart(3, '0')}`;
      onSaveCustomer({
        id, name: custName, company: custCompany, phone: custPhone,
        line: custLine, creditTerm: custCredit, address: custAddress, taxId: custTaxId
      });
    } else if (activeRegTab === 'drivers') {
      const id = isEdit ? editId : `DRV-${String(drivers.length + 1).padStart(3, '0')}`;
      onSaveDriver({
        id, name: drvName, phone: drvPhone, licenseNo: drvLicense,
        expiryDate: drvExpiry, vehicleLicense: drvVehicle, status: drvStatus
      });
    } else if (activeRegTab === 'vehicles') {
      onSaveVehicle({
        licensePlate: vehPlate, type: vehType, brand: vehBrand,
        year: vehYear, actExpiry: vehAct, insExpiry: vehIns, status: vehStatus
      });
    } else if (activeRegTab === 'employees') {
      const id = isEdit ? editId : `EMP-${String(employees.length + 1).padStart(3, '0')}`;
      onSaveEmployee({
        id, name: empName, position: empPosition, department: empDept,
        phone: empPhone, salary: empSalary, startDate: empStart
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Upper Navigation Tabs and Controls */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Registry Selection Button list */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-max text-xs font-semibold">
          <button 
            onClick={() => { setActiveRegTab('customers'); setSearchTerm(''); }}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${activeRegTab === 'customers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Users className="w-4 h-4 text-slate-500" />
            ข้อมูลลูกค้า ({customers.length})
          </button>
          <button 
            onClick={() => { setActiveRegTab('drivers'); setSearchTerm(''); }}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${activeRegTab === 'drivers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <UserCheck className="w-4 h-4 text-slate-500" />
            ข้อมูลคนขับ ({drivers.length})
          </button>
          <button 
            onClick={() => { setActiveRegTab('vehicles'); setSearchTerm(''); }}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${activeRegTab === 'vehicles' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Truck className="w-4 h-4 text-slate-500" />
            ฐานข้อมูลรถ ({vehicles.length})
          </button>
          <button 
            onClick={() => { setActiveRegTab('employees'); setSearchTerm(''); }}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${activeRegTab === 'employees' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Briefcase className="w-4 h-4 text-slate-500" />
            พนักงานออฟฟิศ ({employees.length})
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="ค้นหาข้อมูลตารางหลัก..."
              className="bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 pl-9 pr-4 py-2 rounded-lg border border-slate-200 outline-none w-full sm:w-44 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-1 bg-slate-950 text-white font-bold text-xs py-2 px-3.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> 
            {activeRegTab === 'customers' ? 'เพิ่มลูกค้า' : activeRegTab === 'drivers' ? 'เพิ่มคนขับ' : activeRegTab === 'vehicles' ? 'ทะเบียนรถใหม่' : 'จัดจ้างพนักงาน'}
          </button>
        </div>
      </div>

      {/* Grid Worksheet Tables depends on Selected Tab */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {activeRegTab === 'customers' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-600">
                  <th className="p-3 border-r border-slate-150 font-semibold">CustomerID</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">ชื่อลูกค้าเรียกเก็บบัญชี</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">บริษัทจดทะเบียน</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">เลขผู้เสียภาษี</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">เบอร์โทรศัพท์</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">LINE ID</th>
                  <th className="p-3 border-r border-slate-150 font-semibold text-center">เครดิตระยะ (วัน)</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">ที่อยู่ออกใบแจ้งหนี้</th>
                  <th className="p-3 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700">
                {customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.company.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                  <tr><td colSpan={9} className="p-6 text-center text-slate-400 font-mono">ไม่พบข้อมูลลูกค้า</td></tr>
                ) : (
                  customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.company.toLowerCase().includes(searchTerm.toLowerCase())).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors odd:bg-white even:bg-slate-50/45">
                      <td className="p-3 border-r border-slate-150 font-mono font-bold">{c.id}</td>
                      <td className="p-3 border-r border-slate-150 font-bold text-slate-900">{c.name}</td>
                      <td className="p-3 border-r border-slate-150">{c.company}</td>
                      <td className="p-3 border-r border-slate-150 font-mono font-semibold text-slate-600">{c.taxId || '-'}</td>
                      <td className="p-3 border-r border-slate-150 font-mono">{c.phone}</td>
                      <td className="p-3 border-r border-slate-150 font-mono text-indigo-600">@{c.line}</td>
                      <td className="p-3 border-r border-slate-150 text-center font-bold font-mono">{c.creditTerm} วัน</td>
                      <td className="p-3 border-r border-slate-150 truncate max-w-[180px]" title={c.address}>{c.address}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleEditCustomer(c)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg border border-slate-200"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if (confirm(`คุณต้องการลบข้อมูลลูกค้า ${c.name} หรือไม่?`)) onDeleteCustomer(c.id); }} className="bg-red-50 hover:bg-red-100 text-red-500 p-1.5 rounded-lg border border-red-200"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeRegTab === 'drivers' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-600">
                  <th className="p-3 border-r border-slate-150 font-semibold">Driver ID</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">ชื่อพนักงานขับรถ</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">เบอร์ติดต่อ</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">หมายเลขใบขับขี่ประเภท 4</th>
                  <th className="p-3 border-r border-slate-150 font-semibold text-center">วันใบขับขี่หมดอายุ</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">ทะเบียนรถควบคุมหลัก</th>
                  <th className="p-3 border-r border-slate-150 font-semibold text-center">สถานะ</th>
                  <th className="p-3 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700">
                {drivers.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-slate-400 font-mono">ไม่พบข้อมูลคนขับรถ</td></tr>
                ) : (
                  drivers.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors odd:bg-white even:bg-slate-50/45">
                      <td className="p-3 border-r border-slate-150 font-mono font-bold">{d.id}</td>
                      <td className="p-3 border-r border-slate-150 font-bold text-slate-900">{d.name}</td>
                      <td className="p-3 border-r border-slate-150 font-mono">{d.phone}</td>
                      <td className="p-3 border-r border-slate-150 font-mono">{d.licenseNo}</td>
                      <td className="p-3 border-r border-slate-150 text-center font-mono">{d.expiryDate}</td>
                      <td className="p-3 border-r border-slate-150 font-mono font-semibold text-indigo-700">{d.vehicleLicense}</td>
                      <td className="p-3 border-r border-slate-150 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(d.status)}`}>
                          {d.status === 'Available' ? 'พร้อมปฏิบัติงาน' : 'กำลังวิ่งงานกระดาน'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleEditDriver(d)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg border border-slate-200"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if (confirm(`ลบช้อมูลพนักงานขับรถ ${d.name}?`)) onDeleteDriver(d.id); }} className="bg-red-50 hover:bg-red-100 text-red-500 p-1.5 rounded-lg border border-red-200"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeRegTab === 'vehicles' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-600">
                  <th className="p-3 border-r border-slate-150 font-semibold">แผ่นเลขทะเบียน</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">ประเภทขบวนรถ</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">ยี่ห้อแบรนด์</th>
                  <th className="p-3 border-r border-slate-150 font-semibold text-center">ปีผลิตจดทะเบียน</th>
                  <th className="p-3 border-r border-slate-150 font-semibold text-center">วัน พรบ. หมดอายุ</th>
                  <th className="p-3 border-r border-slate-150 font-semibold text-center">วันประกันภัยหมดอายุ</th>
                  <th className="p-3 border-r border-slate-150 font-semibold text-center">สถานะซ่อมบำรุง</th>
                  <th className="p-3 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700">
                {vehicles.filter(v => v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-slate-400 font-mono">ไม่พบทะเบียนหัวลาก ยานพาหนะ</td></tr>
                ) : (
                  vehicles.filter(v => v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())).map((v) => (
                    <tr key={v.licensePlate} className="hover:bg-slate-50/70 transition-colors odd:bg-white even:bg-slate-50/45">
                      <td className="p-3 border-r border-slate-150 font-mono font-extrabold text-indigo-900 bg-indigo-50/20">{v.licensePlate}</td>
                      <td className="p-3 border-r border-slate-150 font-bold">{v.type}</td>
                      <td className="p-3 border-r border-slate-150">{v.brand}</td>
                      <td className="p-3 border-r border-slate-150 text-center font-mono">{v.year}</td>
                      <td className="p-3 border-r border-slate-150 text-center font-mono text-slate-500">{v.actExpiry}</td>
                      <td className="p-3 border-r border-slate-150 text-center font-mono text-slate-500">{v.insExpiry}</td>
                      <td className="p-3 border-r border-slate-150 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(v.status)}`}>
                          {v.status === 'Available' ? 'พร้อมวิ่งทางด่วน' : 'งดวิ่ง / ตรวจอู่ซ่อมบำรุง'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleEditVehicle(v)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg border border-slate-200"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if (confirm(`คุณต้องการลบทะเบียนรถ ${v.licensePlate}?`)) onDeleteVehicle(v.licensePlate); }} className="bg-red-50 hover:bg-red-100 text-red-500 p-1.5 rounded-lg border border-red-200"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeRegTab === 'employees' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-600">
                  <th className="p-3 border-r border-slate-150 font-semibold">EmployeeID</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">ชื่อพนักงานในสำนักงาน</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">ตำแหน่งงาน</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">แผนกประสานสัญจร</th>
                  <th className="p-3 border-r border-slate-150 font-semibold">เบอร์โทรติดต่อ</th>
                  <th className="p-3 border-r border-slate-150 font-semibold text-right">เงินเดือนสัญญาจ้าง</th>
                  <th className="p-3 border-r border-slate-150 font-semibold text-center">วันที่เริ่มต้นสัญญาจ้าง</th>
                  <th className="p-3 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700">
                {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-slate-400 font-mono">ไม่พบข้อมูลพนักงานพ้นออฟฟิศ</td></tr>
                ) : (
                  employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition-colors odd:bg-white even:bg-slate-50/45">
                      <td className="p-3 border-r border-slate-150 font-mono font-bold">{e.id}</td>
                      <td className="p-3 border-r border-slate-150 font-bold text-slate-900">{e.name}</td>
                      <td className="p-3 border-r border-slate-150">{e.position}</td>
                      <td className="p-3 border-r border-slate-150 font-medium text-indigo-700">{e.department}</td>
                      <td className="p-3 border-r border-slate-150 font-mono">{e.phone}</td>
                      <td className="p-3 border-r border-slate-150 text-right font-mono font-bold text-slate-900">
                        {new Intl.NumberFormat('th-TH').format(e.salary)} บาท
                      </td>
                      <td className="p-3 border-r border-slate-150 text-center font-mono text-slate-500">{e.startDate}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleEditEmployee(e)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg border border-slate-200"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if (confirm(`คุณต้องการเลิกจ้างพนักงานคนนี้ ${e.name}?`)) onDeleteEmployee(e.id); }} className="bg-red-50 hover:bg-red-100 text-red-500 p-1.5 rounded-lg border border-red-200"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Shared Registry Form Dialog Modal based on Active Tab */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-slate-950 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider font-sans">
                  {isEdit ? 'แก้ไขข้อมูลความปลอดภัยทะเบียน' : 'บันทึกจัดส่งขึ้นทะเบียนตารางรายชื่อพนักงานและทรัพย์สิน'}
                </h3>
                <p className="text-slate-400 text-xs">ระบุเนื้อหาสำคัญให้ครบทุกช่องเพื่อสอดคล้องกับงบบัญชีชีทอย่างสมบูรณ์</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white bg-slate-850 p-1.5 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Layout for Customer */}
              {activeRegTab === 'customers' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">ชื่อคู่ค้า/กลุ่มจัดซื้อ (Customer Name)</label>
                    <input type="text" value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="เช่น บจก. ลาดกระบังแหลมฉบังคาร์เตอร์" className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">ชื่อบริษัทจดทะเบียน</label>
                      <input type="text" value={custCompany} onChange={(e) => setCustCompany(e.target.value)} placeholder="บจก. แหลมฉบัง ทรานสปอร์ตคลับ" className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">เบอร์โทรศัพท์ติดต่อ</label>
                      <input type="text" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="081-xxxxxxx" className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-mono" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">LINE ID ออฟฟิศ</label>
                      <input type="text" value={custLine} onChange={(e) => setCustLine(e.target.value)} placeholder="line_office" className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-mono" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">เครดิตระยะการชำระเงิน (วัน)</label>
                      <input type="number" min="0" value={custCredit || ''} onChange={(e) => setCustCredit(parseInt(e.target.value) || 0)} className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-mono" required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                    <input type="text" value={custTaxId} onChange={(e) => setCustTaxId(e.target.value)} placeholder="ระบุเลขประจำตัวผู้เสียภาษี 13 หลัก (เช่น 01055xxxxxxxx)" className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">ที่อยู่จดทะเบียนออกใบแจ้งหนี้ (Address)</label>
                    <textarea rows={3} value={custAddress} onChange={(e) => setCustAddress(e.target.value)} placeholder="ที่อยู่เลขประจำตัวผู้สมัคร..." className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none" required />
                  </div>
                </div>
              )}

              {/* Layout for Driver */}
              {activeRegTab === 'drivers' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">ชื่อพนักงานขับขี่ (Driver Name)</label>
                    <input type="text" value={drvName} onChange={(e) => setDrvName(e.target.value)} placeholder="ระบุ คำนำหน้าชื่อ นาย..." className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">เบอร์มือถือคนขับ</label>
                      <input type="text" value={drvPhone} onChange={(e) => setDrvPhone(e.target.value)} placeholder="08x-xxxxxxx" className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-mono" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">หมายเลขใบอนุญาตขับรถยนต์ (ประเภท ท.4)</label>
                      <input type="text" value={drvLicense} onChange={(e) => setDrvLicense(e.target.value)} placeholder="DL-xxxxxx" className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-mono" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">วันใบขับขี่หมดอายุ</label>
                      <input type="date" value={drvExpiry} onChange={(e) => setDrvExpiry(e.target.value)} className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-mono" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">มอบหมายรถ ทะเบียนควบคุมประจำเป็นมัด</label>
                      <input type="text" value={drvVehicle} onChange={(e) => setDrvVehicle(e.target.value)} placeholder="เช่น 70-1234 ชลบุรี" className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-mono" required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">สถานะความพร้อมคนขับ</label>
                    <select value={drvStatus} onChange={(e) => setDrvStatus(e.target.value as any)} className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none">
                      <option value="Available">Available (พร้อมวิ่งงาน)</option>
                      <option value="On Duty">On Duty (กำลังวิ่งงานทางด่วน)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Layout for Vehicle */}
              {activeRegTab === 'vehicles' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">ป้ายเลขทะเบียนรถ (License Plate)</label>
                    <input type="text" value={vehPlate} onChange={(e) => setVehPlate(e.target.value)} placeholder="เช่น 70-1234 ชลบุรี" className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-mono font-bold" required disabled={isEdit} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">ประเภทขบวนขบวนรถบรรทุก</label>
                      <select value={vehType} onChange={(e) => setVehType(e.target.value)} className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none">
                        <option value="หัวลาก 10 ล้อ">หัวลาก 10 ล้อ</option>
                        <option value="หางรถพ่วง FLATBED">หางรถพ่วง FLATBED</option>
                        <option value="ตู้สิบล้อควบคุมความเย็น">ตู้สิบล้อควบคุมความเย็น</option>
                        <option value="รถร่วมบริการเที่ยวทางหลวง">รถร่วมบริการเที่ยวทางหลวง</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">ยี่ห้อ (Brand)</label>
                      <input type="text" value={vehBrand} onChange={(e) => setVehBrand(e.target.value)} className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-sans" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">พรบ.ยวดหมดอายุ</label>
                      <input type="date" value={vehAct} onChange={(e) => setVehAct(e.target.value)} className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-mono" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">ประกันหมดอายุกำหนด</label>
                      <input type="date" value={vehIns} onChange={(e) => setVehIns(e.target.value)} className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-mono" required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">สถานะสภาพยานยนต์</label>
                    <select value={vehStatus} onChange={(e) => setVehStatus(e.target.value as any)} className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none">
                      <option value="Available">Available (พร้อมออกวิ่งงานทางหลวง)</option>
                      <option value="Maintenance">Maintenance (ตรวจซ่อมบำรุงที่อู่พานทอง)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Layout for Office Employee */}
              {activeRegTab === 'employees' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">ชื่อพนักงานในสำนักงาน (Employee Name)</label>
                    <input type="text" value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder="เช่น น.ส. อังคณา ทำบัญชี" className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">ตำแหน่งปฏิบัติหน้าที่</label>
                      <input type="text" value={empPosition} onChange={(e) => setEmpPosition(e.target.value)} placeholder="เสมียนคลัง, ผู้แทนจัดซื้อตั๋วใบเสร็จ" className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">แผนกสังกัด</label>
                      <select value={empDept} onChange={(e) => setEmpDept(e.target.value)} className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-semibold">
                        <option value="บัญชีและการเงิน">ฝ่าย บัญชีและการเงิน</option>
                        <option value="ธุรการคลัง">ฝ่าย ธุรการออฟฟิศ</option>
                        <option value="ควบคุมรถขนส่ง">ฝ่าย แผนควบคุุมการประสานและเดินรถ</option>
                        <option value="การตลาด">ฝ่าย จัดซื้อการประสานลูกค้า</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">เบอร์มือถือพนักงาน</label>
                      <input type="text" value={empPhone} onChange={(e) => setEmpPhone(e.target.value)} placeholder="08x-xxxxxxx" className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-mono" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">ฐานเงินเดือนหลักสัญญาจ้าง (บาท/เดือน)</label>
                      <input type="number" min="0" value={empSalary || ''} onChange={(e) => setEmpSalary(parseFloat(e.target.value) || 0)} className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-mono font-bold" required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">วันที่เริ่มงานจ้างงวดแรก</label>
                    <input type="date" value={empStart} onChange={(e) => setEmpStart(e.target.value)} className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none font-mono" required />
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-lg border border-slate-200">ยกเลิกปิดรับ</button>
                <button type="submit" className="bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs py-2 px-5 rounded-lg">บันทึกความปลอดภัยหลัก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
