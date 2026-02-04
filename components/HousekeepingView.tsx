import React, { useState, useMemo, useEffect } from 'react';
import { Room, RoomStatus, HKStaff, GuestStatus } from '../types';

interface HousekeepingViewProps {
  rooms: Room[];
  activeHk: HKStaff | null;
  setActiveHk: (staff: HKStaff | null) => void;
  onUpdateRoom: (room: Room) => void;
}

const HousekeepingView: React.FC<HousekeepingViewProps> = ({ rooms, activeHk, setActiveHk, onUpdateRoom }) => {
  const [roomStartTimes, setRoomStartTimes] = useState<Record<string, number>>({});
  const [onBreak, setOnBreak] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hk_start_times');
    if (saved) setRoomStartTimes(JSON.parse(saved));
    const savedBreak = localStorage.getItem('hk_on_break');
    if (savedBreak) setOnBreak(savedBreak === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('hk_start_times', JSON.stringify(roomStartTimes));
  }, [roomStartTimes]);

  useEffect(() => {
    localStorage.setItem('hk_on_break', onBreak.toString());
  }, [onBreak]);

  const myRooms = useMemo(() => {
    if (!activeHk) return [];
    return rooms.filter(r => r.assignedHk === activeHk.num);
  }, [rooms, activeHk]);

  const stats = useMemo(() => {
    const doneCount = myRooms.filter(r => r.done).length;
    return {
      total: myRooms.length,
      done: doneCount,
      remaining: myRooms.length - doneCount,
      minutes: myRooms.reduce((acc, r) => acc + (r.done ? 0 : (r.minutes || 0)), 0)
    };
  }, [myRooms]);

  if (!activeHk) {
    const handleLogin = () => {
      const name = prompt("Enter your name as it appears in Setup sheet (Column E):");
      if (!name) return;
      
      // @ts-ignore
      if (typeof google !== 'undefined' && google.script) {
        // @ts-ignore
        google.script.run
          .withSuccessHandler((res: any) => {
            if(res.ok) {
              setActiveHk({ num: res.board, name: res.name });
            } else {
              alert(res.error);
            }
          })
          .apiHkRegisterName(name);
      } else {
        setActiveHk({ num: "1", name: name });
      }
    };

    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-200 w-full max-w-sm text-center">
          <div className="h-24 w-24 bg-blue-100 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner">
            <i className="fa-solid fa-id-card-clip"></i>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Staff Login</h2>
          <p className="text-slate-400 text-[10px] mb-10 font-black uppercase tracking-widest leading-relaxed">Access your assigned cleaning board</p>
          
          <button
            onClick={handleLogin}
            className="w-full bg-slate-900 hover:bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl active:scale-95 mb-4"
          >
            Start Shift
          </button>
        </div>
      </div>
    );
  }

  const handleStart = (roomNo: string) => {
    setRoomStartTimes(prev => ({ ...prev, [roomNo]: Date.now() }));
    // @ts-ignore
    if (typeof google !== 'undefined' && google.script) {
       // @ts-ignore
       google.script.run.apiStartRoom(roomNo, activeHk.name);
    }
  };

  const handleFinish = (room: Room) => {
    const startTime = roomStartTimes[room.room];
    const duration = startTime ? Math.round((Date.now() - startTime) / 60000) : 0;
    const durationNote = duration > 0 ? `Duration: ${duration}m` : '';
    
    onUpdateRoom({ 
      ...room, 
      done: true, 
      housekeepingStatus: RoomStatus.CLEAN,
      notes: room.notes ? `${room.notes} | ${durationNote}` : durationNote 
    });

    const newTimes = { ...roomStartTimes };
    delete newTimes[room.room];
    setRoomStartTimes(newTimes);
  };

  const toggleBreak = () => {
    const nextBreak = !onBreak;
    setOnBreak(nextBreak);
    // @ts-ignore
    if (typeof google !== 'undefined' && google.script) {
       // @ts-ignore
       google.script.run.apiLogBreak(activeHk.name, nextBreak ? "START" : "END");
    }
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 space-y-4 overflow-hidden max-w-xl mx-auto w-full">
      {/* HK Board Header */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md">
            {activeHk.num}
          </div>
          <div>
            <h2 className="font-black text-slate-800 uppercase tracking-tight text-sm leading-none">{activeHk.name}</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">Board Sync Active</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
           <button 
            onClick={toggleBreak}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              onBreak ? 'bg-amber-500 text-white ring-4 ring-amber-100 shadow-lg' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {onBreak ? 'On Break' : 'Break'}
          </button>
          <button 
            onClick={() => {
               if(confirm("Sign out of Board " + activeHk.num + "?")) setActiveHk(null);
            }}
            className="p-3 text-slate-300 hover:text-red-500 transition-colors"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Rooms</p>
          <p className="text-xl font-black text-slate-800 leading-none">{stats.total}</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 text-center shadow-sm">
          <p className="text-[8px] font-black text-blue-400 uppercase mb-0.5 tracking-tighter">Remaining</p>
          <p className="text-xl font-black text-blue-900 leading-none">{stats.remaining}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-2xl border border-green-100 text-center shadow-sm">
          <p className="text-[8px] font-black text-green-400 uppercase mb-0.5 tracking-tighter">Work (Min)</p>
          <p className="text-xl font-black text-green-900 leading-none">{stats.minutes}m</p>
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-24">
        {myRooms.length === 0 ? (
          <div className="text-center py-24 opacity-20">
            <i className="fa-solid fa-clipboard-list text-6xl mb-6"></i>
            <p className="font-black uppercase text-sm tracking-widest">No assigned rooms</p>
          </div>
        ) : (
          myRooms.map(room => {
            const isFullSvc = room.serviceType && (room.serviceType.toLowerCase().includes('full') || room.serviceType.toLowerCase().includes('stayover'));
            const isInProgress = !!roomStartTimes[room.room];

            return (
              <div 
                key={room.room}
                className={`
                  bg-white border-l-[8px] rounded-[2.5rem] p-6 transition-all shadow-md
                  ${room.done ? 'opacity-40 grayscale border-slate-300' : 
                    isInProgress ? 'border-blue-500 ring-4 ring-blue-50' : 
                    isFullSvc ? 'border-purple-600' : 'border-slate-200'}
                `}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">#{room.room}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[9px] font-black uppercase text-slate-400 border border-slate-100 px-2 py-0.5 rounded-md">{room.roomType}</span>
                      {isFullSvc && (
                        <span className="text-[9px] font-black uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">Full Stayover</span>
                      )}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                    room.guestStatus === GuestStatus.CHECKOUT ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {room.guestStatus}
                  </div>
                </div>

                {room.notes && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4 flex items-start gap-3">
                    <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-1"></i>
                    <p className="text-[11px] font-bold text-amber-900 leading-tight">{room.notes}</p>
                  </div>
                )}

                {!room.done ? (
                  <div className="flex gap-3 mt-6">
                    {!isInProgress ? (
                      <button 
                        disabled={onBreak}
                        onClick={() => handleStart(room.room)}
                        className="flex-1 bg-slate-900 hover:bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg active:scale-95 disabled:opacity-30 transition-all"
                      >
                        Start Cleaning
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleFinish(room)}
                        className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg active:scale-95 flex items-center justify-center gap-3 animate-pulse"
                      >
                        Mark Finished
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-center py-2 text-green-600 font-black uppercase text-[10px] flex items-center justify-center gap-2">
                    <i className="fa-solid fa-check-double"></i> Cleaned & Synced
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