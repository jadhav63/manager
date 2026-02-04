import React, { useState, useEffect, useMemo } from 'react';
import { Room, RoomStatus, HKStaff, GuestStatus } from './types';

interface HousekeepingViewProps {
  rooms: Room[];
  activeHk: HKStaff | null;
  setActiveHk: (staff: HKStaff | null) => void;
  onUpdateRoom: (roomNo: string, updates: Partial<Room>) => void;
}

const HousekeepingView: React.FC<HousekeepingViewProps> = ({ rooms, activeHk, setActiveHk, onUpdateRoom }) => {
  const [roomStartTimes, setRoomStartTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    const saved = localStorage.getItem('tg_hk_timers');
    if (saved) setRoomStartTimes(JSON.parse(saved));
  }, []);

  if (!activeHk) {
    const handleLogin = () => {
      const name = prompt("Staff Name (Must match Setup Sheet Col E):");
      if (!name) return;
      
      // @ts-ignore
      if (typeof google !== 'undefined' && google.script) {
        // @ts-ignore
        google.script.run
          .withSuccessHandler((res: any) => {
            if(res.ok) setActiveHk({ num: res.board, name: res.name }); else alert(res.error);
          })
          .apiHkRegisterName(name);
      } else {
        // Mock Login for GitHub
        setActiveHk({ num: "1", name: name });
      }
    };

    return (
      <div className="h-full flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center w-full max-w-sm border border-slate-100">
          <div className="h-24 w-24 bg-blue-100 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-4xl shadow-inner">
            <i className="fa-solid fa-fingerprint"></i>
          </div>
          <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter text-slate-900">Staff Portal</h2>
          <p className="text-slate-400 text-[10px] font-black mb-12 uppercase tracking-widest opacity-60">Synchronized Board v5.4</p>
          <button 
            onClick={handleLogin} 
            className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all hover:bg-blue-600"
          >
            Authenticate
          </button>
        </div>
      </div>
    );
  }

  const myRooms = rooms.filter(r => r.assignedHk === activeHk.num);

  const startRoom = (roomNo: string) => {
    const now = Date.now();
    const nextTimes = { ...roomStartTimes, [roomNo]: now };
    setRoomStartTimes(nextTimes);
    localStorage.setItem('tg_hk_timers', JSON.stringify(nextTimes));
    
    // @ts-ignore
    if (typeof google !== 'undefined' && google.script) {
      // @ts-ignore
      google.script.run.apiStartRoom(roomNo, activeHk.name);
    }
  };

  const finishRoom = (room: Room) => {
    const startTime = roomStartTimes[room.room];
    const duration = startTime ? Math.round((Date.now() - startTime) / 60000) : 0;
    const notes = duration > 0 ? (room.notes ? `${room.notes} | ${duration}m clean` : `${duration}m clean`) : room.notes;
    
    onUpdateRoom(room.room, { done: true, housekeepingStatus: RoomStatus.CLEAN, notes });
    
    const newTimes = { ...roomStartTimes };
    delete newTimes[room.room];
    setRoomStartTimes(newTimes);
    localStorage.setItem('tg_hk_timers', JSON.stringify(newTimes));
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-4 bg-slate-50 overflow-hidden max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] border shadow-sm border-slate-200">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-slate-100">
            {activeHk.num}
          </div>
          <div>
            <h2 className="font-black text-lg leading-none uppercase text-slate-800">{activeHk.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live Connection</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setActiveHk(null)} 
          className="p-4 bg-slate-50 text-slate-300 hover:text-red-500 rounded-2xl transition-all active:scale-90"
        >
          <i className="fa-solid fa-right-from-bracket"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pb-32">
        {myRooms.length === 0 ? (
          <div className="text-center py-32 text-slate-300 uppercase font-black text-sm tracking-[0.3em] opacity-30">
            <i className="fa-solid fa-list-check text-6xl mb-8"></i><br/>Empty Queue
          </div>
        ) : (
          myRooms.map(r => {
            const isInProgress = !!roomStartTimes[r.room];
            const isFullSvc = r.serviceType && (r.serviceType.toLowerCase().includes("full") || r.serviceType.toLowerCase().includes("stayover"));
            
            return (
              <div 
                key={r.room} 
                className={`p-8 rounded-[3rem] border-l-[12px] bg-white transition-all duration-500 shadow-xl ${
                  r.done ? 'opacity-40 grayscale border-slate-300' : 
                  isInProgress ? 'border-blue-600 ring-8 ring-blue-50' : 
                  isFullSvc ? 'border-purple-600' : 'border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-5xl font-black tracking-tighter text-slate-900">#{r.room}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{r.roomType}</span>
                      {isFullSvc && (
                        <span className="text-[9px] font-black uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">Stayover</span>
                      )}
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    r.guestStatus === GuestStatus.CHECKOUT ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {r.guestStatus}
                  </div>
                </div>

                {r.notes && (
                  <div className="bg-amber-50 text-amber-900 text-[11px] font-bold p-5 rounded-3xl mb-8 border border-amber-100 flex items-start gap-3">
                    <i className="fa-solid fa-circle-exclamation mt-1 text-amber-500"></i>
                    <p>{r.notes}</p>
                  </div>
                )}

                {!r.done ? (
                  <div className="flex gap-4">
                    {!isInProgress ? (
                      <button 
                        onClick={() => startRoom(r.room)} 
                        className="flex-1 bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-xl active:scale-95 transition-all"
                      >
                        Start Cleaning
                      </button>
                    ) : (
                      <button 
                        onClick={() => finishRoom(r)} 
                        className="flex-1 bg-green-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-xl active:scale-95 animate-pulse flex items-center justify-center gap-3"
                      >
                        <i className="fa-solid fa-hourglass-start"></i>
                        Complete
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-green-600 font-black uppercase text-[10px] tracking-[0.4em] bg-green-50 rounded-2xl border border-green-100">
                    <i className="fa-solid fa-check-double mr-3"></i> Room Verified
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HousekeepingView;