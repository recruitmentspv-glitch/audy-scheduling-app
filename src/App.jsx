import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, Video, AlertCircle, Bell, ShieldAlert, ChevronRight, ChevronLeft, Users, X, List, CalendarDays, Filter, Lock, LogOut, User, Loader2, RefreshCw } from 'lucide-react';

// --- MASUKKAN URL GOOGLE SCRIPT ANDA DI SINI ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzYyAil_l11Rg-pdjF2QuerBViBL8BJ5eg4Q1DUVfc7vxQfvkLuePOCi725aCa88lsl/exec";

// --- DATA CONSTANTS ---
const RECRUITERS = [
  { id: 'R1', name: 'Zike' },
  { id: 'R2', name: 'Dyah' },
  { id: 'R3', name: 'Wanda' },
  { id: 'R4', name: 'Bunga' },
  { id: 'R5', name: 'Mona' },
];

const getWeekDates = (weekOffset = 0) => {
  const dates = [];
  const today = new Date();
  const dayOfWeek = today.getDay(); 
  const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  
  const monday = new Date(today);
  monday.setDate(diffToMonday + (weekOffset * 7));
  
  for (let i = 0; i < 5; i++) { // Senin - Jumat
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const label = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
    
    dates.push({ id: dateStr, label, weekOffset });
  }
  return dates;
};

const ALL_DATES = [
  ...getWeekDates(0),
  ...getWeekDates(1),
  ...getWeekDates(2),
  ...getWeekDates(3)
];

const generateSlots = () => {
  const startTimes = [
    '09:30', '09:50', '10:10', '10:30', '10:50', '11:10', '11:30', '11:50', // Pagi
    '13:30', '13:50', '14:10', '14:30', '14:50', '15:10', '15:30', '15:50'  // Siang
  ];
  
  let allSlots = [];
  ALL_DATES.forEach(dateObj => {
    startTimes.forEach((time) => {
      allSlots.push({
        id: `${dateObj.id}-${time}`,
        dateId: dateObj.id,
        dateLabel: dateObj.label,
        time: time, 
        recruitersState: {} 
      });
    });
  });
  return allSlots;
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

export default function App() {
  const [appMode, setAppMode] = useState('home');
  const [slots, setSlots] = useState(generateSlots());
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL);
      const data = await res.json();
      
      if (data && data.bookings) {
        setSlots(prevSlots => prevSlots.map(slot => {
          let updatedState = { ...slot.recruitersState };
          
          if (data.activeSlots && data.activeSlots[slot.id]) {
            data.activeSlots[slot.id].forEach(recId => {
               if(!updatedState[recId]) updatedState[recId] = { isBooked: false };
            });
          }

          const bookedInThisSlot = data.bookings.filter(b => b.dateId === slot.dateId && b.timeStr === slot.time);
          bookedInThisSlot.forEach(b => {
             updatedState[b.recruiterId] = {
               isBooked: true,
               candidateName: b.candidateName,
               candidateEmail: b.candidateEmail,
               position: b.position,
               fileName: b.fileName,
               meetLink: b.meetLink
             };
          });

          return { ...slot, recruitersState: updatedState };
        }));
      }
    } catch (error) {
      console.error("Gagal memuat data jadwal:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleRecruiterLogin = (e) => {
    e.preventDefault();
    if (pin === 'Audy1524*') {
      setAppMode('rekruter');
      setShowPinModal(false);
      setPin('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleToggleActive = async (slotId, recruiterId, isActiveNow) => {
    setSlots(slots.map(slot => {
      if (slot.id === slotId) {
        const newState = { ...slot.recruitersState };
        if (isActiveNow) delete newState[recruiterId]; 
        else newState[recruiterId] = { isBooked: false }; 
        return { ...slot, recruitersState: newState };
      }
      return slot;
    }));

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'toggleSlot', slotId, recruiterId, isOpen: !isActiveNow })
      });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        body, input, button, select, textarea {
          font-family: 'Poppins', sans-serif !important;
        }
      `}} />

      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-800">Audy Dental</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={fetchData} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Segarkan Data">
                <RefreshCw className={`w-5 h-5 ${isLoadingData ? 'animate-spin' : ''}`} />
              </button>
              {appMode !== 'home' && (
                <button
                  onClick={() => { setAppMode('home'); setPin(''); setPinError(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {isLoadingData && appMode === 'home' && (
          <div className="text-center py-20 animate-pulse text-slate-400 font-medium">Sinkronisasi Server...</div>
        )}

        {!isLoadingData && appMode === 'home' && (
          <div className="max-w-2xl mx-auto text-center mt-8 md:mt-12 animate-in fade-in zoom-in-95 duration-300">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Portal Jadwal Wawancara</h1>
            <p className="text-slate-600 mb-10 md:mb-12">Silakan pilih akses portal Anda di bawah ini.</p>
            
            <div className="grid sm:grid-cols-2 gap-6 px-4 sm:px-0">
              <button 
                onClick={() => setAppMode('kandidat')}
                className="flex flex-col items-center p-8 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition-all group"
              >
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                  <User className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Portal Kandidat</h2>
                <p className="text-sm text-slate-500">Pilih dan konfirmasi jadwal interview Anda yang tersedia.</p>
              </button>

              <button 
                onClick={() => setShowPinModal(true)}
                className="flex flex-col items-center p-8 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all group"
              >
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                  <Users className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Tim Rekrutmen</h2>
                <p className="text-sm text-slate-500">Kelola jadwal luang dan pantau rekap peserta wawancara.</p>
              </button>
            </div>
          </div>
        )}

        {appMode === 'rekruter' && <RecruiterView slots={slots} onToggleActive={handleToggleActive} />}
        {appMode === 'kandidat' && <CandidateView slots={slots} fetchData={fetchData} setSlots={setSlots} />}
      </main>

      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Lock className="w-5 h-5 text-slate-500" /> Akses Terbatas
              </h3>
              <button onClick={() => {setShowPinModal(false); setPinError(false);}} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRecruiterLogin}>
              <input 
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Masukkan PIN"
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none mb-2 ${pinError ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-emerald-500'}`}
                autoFocus
              />
              {pinError && <p className="text-xs text-red-500 mb-4">PIN tidak valid.</p>}
              <button type="submit" className="w-full mt-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold">Buka Dasbor</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RecruiterView({ slots, onToggleActive }) {
  const [activeRecruiterId, setActiveRecruiterId] = useState(RECRUITERS[0].id);
  const [activeTab, setActiveTab] = useState('atur');
  const [filterRecap, setFilterRecap] = useState('saya');
  const [weekOffset, setWeekOffset] = useState(0);
  
  const visibleDates = ALL_DATES.filter(d => d.weekOffset === weekOffset);
  const [selectedDateId, setSelectedDateId] = useState(visibleDates[0].id);

  const changeWeek = (dir) => {
    const newOffset = weekOffset + dir;
    if (newOffset >= 0 && newOffset <= 3) {
      setWeekOffset(newOffset);
      setSelectedDateId(ALL_DATES.find(d => d.weekOffset === newOffset).id);
    }
  };

  const daySlots = slots.filter(s => s.dateId === selectedDateId);
  const allBookings = [];
  slots.forEach(slot => {
    Object.entries(slot.recruitersState).forEach(([recId, data]) => {
      if (data.isBooked) {
        allBookings.push({
          day: slot.dateLabel,
          time: slot.time,
          recruiterId: recId,
          recruiterName: RECRUITERS.find(r => r.id === recId)?.name,
          ...data
        });
      }
    });
  });

  const filteredBookings = filterRecap === 'saya' ? allBookings.filter(b => b.recruiterId === activeRecruiterId) : allBookings;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div><h1 className="text-2xl font-bold text-slate-800">Panel Rekrutmen</h1></div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-600">Profil:</label>
            <select value={activeRecruiterId} onChange={(e) => setActiveRecruiterId(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 outline-none font-semibold">
              {RECRUITERS.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
            </select>
          </div>
        </div>

        <div className="flex gap-6 mb-6 border-b border-slate-200">
          <button onClick={() => setActiveTab('atur')} className={`pb-3 text-sm font-medium border-b-2 ${activeTab === 'atur' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}><CalendarDays className="inline w-4 h-4 mr-1" /> Atur Jadwal</button>
          <button onClick={() => setActiveTab('rekap')} className={`pb-3 text-sm font-medium border-b-2 ${activeTab === 'rekap' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}><List className="inline w-4 h-4 mr-1" /> Rekap Jadwal</button>
        </div>

        {activeTab === 'atur' ? (
          <>
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2 mb-4">
              <button onClick={() => changeWeek(-1)} disabled={weekOffset === 0} className="px-3 py-1.5 text-sm bg-white border rounded-lg disabled:opacity-50 font-medium"><ChevronLeft className="inline w-4 h-4" /> Minggu Seb.</button>
              <div className="font-semibold text-slate-700 text-sm">{weekOffset === 0 ? 'Minggu Ini' : `Minggu +${weekOffset}`}</div>
              <button onClick={() => changeWeek(1)} disabled={weekOffset === 3} className="px-3 py-1.5 text-sm bg-white border rounded-lg disabled:opacity-50 font-medium">Minggu Depan <ChevronRight className="inline w-4 h-4" /></button>
            </div>
            <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide border-b border-slate-100">
              {visibleDates.map(dateObj => (
                <button key={dateObj.id} onClick={() => setSelectedDateId(dateObj.id)} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${selectedDateId === dateObj.id ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-500'}`}>{dateObj.label}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {daySlots.map(slot => {
                const myState = slot.recruitersState[activeRecruiterId];
                const isActive = !!myState;
                const isBooked = myState?.isBooked;

                return (
                  <div key={slot.id} className={`border rounded-xl p-4 transition-all ${isBooked ? 'bg-emerald-50 border-emerald-200' : isActive ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center font-bold text-slate-700"><Clock className="w-4 h-4 mr-1.5 text-slate-400" />{slot.time}</div>
                      {!isBooked && (
                        <button onClick={() => onToggleActive(slot.id, activeRecruiterId, isActive)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                      )}
                      {isBooked && <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">TERISI</span>}
                    </div>
                    {isBooked ? (
                      <div className="bg-white p-3 rounded-lg border border-emerald-100">
                        <div className="text-xs font-semibold text-emerald-600 truncate">{myState.position}</div>
                        <div className="font-medium text-slate-900 truncate">{myState.candidateName}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">{isActive ? <span className="text-indigo-600 font-medium">Buka</span> : 'Tutup'}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
              <div className="text-sm font-medium flex items-center gap-2"><List className="w-4 h-4 text-indigo-500" /> Jadwal Terkonfirmasi</div>
              <select value={filterRecap} onChange={(e) => setFilterRecap(e.target.value)} className="bg-white border text-sm rounded-md p-1.5 outline-none font-medium">
                <option value="saya">Jadwal Saya</option>
                <option value="semua">Semua Jadwal Tim</option>
              </select>
            </div>
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left bg-white text-sm">
                <thead className="bg-slate-50 border-b text-slate-600">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Waktu</th>
                    <th className="py-3 px-4 font-semibold">Kandidat</th>
                    <th className="py-3 px-4 font-semibold">Posisi</th>
                    <th className="py-3 px-4 font-semibold">Rekruter</th>
                    <th className="py-3 px-4 font-semibold">GMeet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length === 0 ? (
                    <tr><td colSpan="5" className="py-12 text-center text-slate-500">Belum ada jadwal.</td></tr>
                  ) : filteredBookings.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4"><div className="font-semibold">{b.day}</div><div className="text-slate-500">{b.time}</div></td>
                      <td className="py-3 px-4"><div className="font-medium">{b.candidateName}</div></td>
                      <td className="py-3 px-4"><div className="text-slate-700">{b.position}</div></td>
                      <td className="py-3 px-4"><span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100">{b.recruiterName}</span></td>
                      <td className="py-3 px-4">
                        <a href={b.meetLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium px-3 py-1.5 bg-indigo-50 rounded-lg flex items-center gap-1 w-fit"><Video className="w-4 h-4" /> Buka</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CandidateView({ slots, fetchData, setSlots }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const visibleDates = ALL_DATES.filter(d => d.weekOffset === weekOffset);
  const [selectedDateId, setSelectedDateId] = useState(visibleDates[0].id);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [candidateForm, setCandidateForm] = useState({ name: '', email: '', position: '', file: null, recruiterId: '' });
  const [successData, setSuccessData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const daySlots = slots.filter(s => s.dateId === selectedDateId);

  const changeWeek = (offset) => {
    setWeekOffset(offset);
    const newDates = ALL_DATES.filter(d => d.weekOffset === offset);
    setSelectedDateId(newDates[0].id);
    setSelectedSlot(null);
    setErrorMessage("");
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (candidateForm.name && candidateForm.email && candidateForm.position && candidateForm.recruiterId && selectedSlot) {
      setIsSubmitting(true);
      try {
        let fileBase64 = "";
        let fileName = "";
        if (candidateForm.file) {
          fileBase64 = await fileToBase64(candidateForm.file);
          fileName = candidateForm.file.name;
        }

        const assignedRecruiter = RECRUITERS.find(r => r.id === candidateForm.recruiterId);

        const payload = {
          action: 'bookSlot',
          candidateName: candidateForm.name,
          candidateEmail: candidateForm.email,
          position: candidateForm.position,
          dateId: selectedSlot.dateId, 
          timeStr: selectedSlot.time, 
          fileBase64: fileBase64,
          fileName: fileName,
          recruiterId: assignedRecruiter.id,
          recruiterName: assignedRecruiter.name
        };

        const res = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        
        const resData = await res.json();
        
        if(resData.status !== "success") throw new Error(resData.message || "Server error");

        setSuccessData({
          ...selectedSlot,
          candidateName: candidateForm.name,
          position: candidateForm.position,
          assignedRecruiter,
          meetLink: resData.meetLink 
        });

        fetchData(); 
        
      } catch (error) {
        setErrorMessage(error.message || "Mohon maaf, koneksi ke database gagal.");
      } finally {
        setIsSubmitting(false);
        if(!errorMessage) {
          setSelectedSlot(null);
          setCandidateForm({ name: '', email: '', position: '', file: null, recruiterId: '' });
        }
      }
    } else {
      setErrorMessage("Harap lengkapi semua data, termasuk memilih Posisi dan Rekruter.");
    }
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-emerald-500 p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"><CheckCircle className="w-10 h-10" /></div>
            <h2 className="text-2xl font-bold mb-2">Jadwal Berhasil Dikonfirmasi!</h2>
            <p className="text-emerald-50">Posisi: {successData.position} | Rekruter: {successData.assignedRecruiter.name}</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="p-5 border-2 border-indigo-100 bg-indigo-50/50 rounded-xl">
              <div className="flex items-center gap-2 font-bold text-indigo-800 mb-3 text-lg"><Video className="w-5 h-5" /> Link Google Meet</div>
              <a href={successData.meetLink} target="_blank" rel="noopener noreferrer" className="block w-full p-3 bg-white border border-indigo-200 rounded-lg text-indigo-600 font-medium text-center hover:bg-indigo-50 transition-colors break-all mb-4">
                {successData.meetLink}
              </a>
              <div className="flex gap-3 items-start bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-900">
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="text-sm leading-relaxed font-medium">
                  <strong>Penting:</strong> Anda wajib masuk sesuai jam. Anda akan ditempatkan di <strong>Ruang Tunggu (Waiting Room)</strong> terlebih dahulu dan harus menunggu persetujuan rekruter untuk masuk.
                </div>
              </div>
            </div>
            <button onClick={() => setSuccessData(null)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold mt-4">Selesai & Kembali</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Pilih Jadwal Wawancara</h1>
      </div>
      
      <div className="flex justify-center gap-3 mb-6">
        <button onClick={() => changeWeek(0)} className={`px-6 py-2 text-sm font-bold rounded-full transition-colors ${weekOffset === 0 ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}>Minggu Ini</button>
        <button onClick={() => changeWeek(1)} className={`px-6 py-2 text-sm font-bold rounded-full transition-colors ${weekOffset === 1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}>Minggu Depan</button>
      </div>

      <div className="flex overflow-x-auto gap-3 mb-8 pb-2">
        {visibleDates.map(dateObj => (
          <button key={dateObj.id} onClick={() => {setSelectedDateId(dateObj.id); setSelectedSlot(null); setCandidateForm({...candidateForm, recruiterId: ''});}} className={`px-5 py-3 rounded-2xl text-sm font-semibold transition-all border whitespace-nowrap ${selectedDateId === dateObj.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>{dateObj.label}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {daySlots.map(slot => {
          // Hanya ambil rekruter yang statusnya BUKA dan BELUM DIBOOKING di jam tersebut
          const availableRecruiters = Object.entries(slot.recruitersState)
            .filter(([id, data]) => !data.isBooked)
            .map(([id]) => RECRUITERS.find(r => r.id === id));
            
          const availableCount = availableRecruiters.length;
          const isDisabled = availableCount === 0;
          const isSelected = selectedSlot?.id === slot.id;

          return (
            <div key={slot.id} onClick={() => {if (!isDisabled && !isSelected) setSelectedSlot(slot);}} className={`bg-white border rounded-xl overflow-hidden transition-all ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : isDisabled ? 'bg-slate-50 opacity-60' : 'cursor-pointer hover:border-indigo-300'}`}>
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className={`flex items-center font-bold text-lg ${isDisabled ? 'text-slate-500' : 'text-slate-900'}`}><Clock className="w-5 h-5 mr-2" />{slot.time}</div>
                  {availableCount > 0 ? <span className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md">Tersedia {availableCount} Rekruter</span> : <span className="text-xs font-semibold px-2 py-1 bg-slate-200 text-slate-600 rounded-md">Penuh</span>}
                </div>
                {isSelected ? (
                  <form onSubmit={handleBook} className="space-y-3 mt-3 animate-in fade-in">
                    {errorMessage && <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md font-semibold">{errorMessage}</div>}
                    
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Pilih Rekruter</label>
                      <select 
                        required 
                        disabled={isSubmitting} 
                        value={candidateForm.recruiterId}
                        onChange={(e) => setCandidateForm({...candidateForm, recruiterId: e.target.value})} 
                        className="w-full text-sm rounded-md border px-3 py-2 bg-white font-medium"
                      >
                        <option value="" disabled>-- Klik untuk memilih rekruter --</option>
                        {availableRecruiters.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Posisi yang Dilamar</label>
                      <select 
                        required 
                        disabled={isSubmitting} 
                        value={candidateForm.position}
                        onChange={(e) => setCandidateForm({...candidateForm, position: e.target.value})} 
                        className="w-full text-sm rounded-md border px-3 py-2 bg-white font-medium"
                      >
                        <option value="" disabled>-- Pilih Posisi --</option>
                        <option value="Perawat Gigi">Perawat Gigi</option>
                        <option value="Resepsionis">Resepsionis</option>
                        <option value="Branch Spv">Branch Spv</option>
                        <option value="Head Office">Head Office</option>
                      </select>
                    </div>

                    <input type="text" required disabled={isSubmitting} placeholder="Nama Lengkap" value={candidateForm.name} onChange={(e) => setCandidateForm({...candidateForm, name: e.target.value})} className="w-full text-sm rounded-md border px-3 py-2 font-medium" />
                    <input type="email" required disabled={isSubmitting} placeholder="Email" value={candidateForm.email} onChange={(e) => setCandidateForm({...candidateForm, email: e.target.value})} className="w-full text-sm rounded-md border px-3 py-2 font-medium" />
                    
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Upload form lamaran Audy Dental (Format PDF)</label>
                      <input type="file" accept=".pdf" required disabled={isSubmitting} onChange={(e) => setCandidateForm({...candidateForm, file: e.target.files[0]})} className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={(e) => {e.stopPropagation(); setSelectedSlot(null); setCandidateForm({...candidateForm, recruiterId: '', position: ''});}} className="flex-1 py-2 text-sm bg-slate-100 rounded-lg font-bold">Batal</button>
                      <button type="submit" disabled={isSubmitting} className="flex-1 py-2 text-sm text-white bg-indigo-600 rounded-lg flex justify-center items-center font-bold">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konfirmasi'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button disabled={isDisabled} className={`w-full py-2 px-4 text-sm font-bold rounded-lg ${isDisabled ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-700'}`}>Pilih Jadwal</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
