import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ViewType, Room, HKStaff, RoomStatus } from './types';
import FrontDeskView from './components/FrontDeskView';
import HousekeepingView from './components/HousekeepingView';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('FRONT_DESK');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeHk, setActiveHk] = useState<HKStaff | null>(null);
  
  const loadingTimeoutRef = useRef<number | null>(null);

  const fetchRooms = useCallback(() => {
    setLoading(true);
    setError(null);
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) window.clearTimeout(loadingTimeoutRef.current);
    
    // Safety timeout: if loading takes > 15s, something might be wrong with GAS
    loadingTimeoutRef.current = window.setTimeout(() => {
      if (loading) {
        setError("Sync is taking longer than usual. Please refresh the page.");
        setLoading(false);
      }
    }, 15000);

    // @ts-ignore
    if (typeof google !== 'undefined' && google.script) {
      // @ts-ignore
      google.script.run
        .withSuccessHandler((data: Room[]) => {
          if (loadingTimeoutRef.current) window.clearTimeout(loadingTimeoutRef.current);
          setRooms(data || []);
          setLoading(false);
        })
        .withFailureHandler((err: any) => {
          if (loadingTimeoutRef.current) window.clearTimeout(loadingTimeoutRef.current);
          console.error("Fetch Error:", err);
          setError("Failed to fetch rooms from Master Spreadsheet.");
          setLoading(false);
        })
        .apiGetAllRooms();
    } else {
      // Mock data for local development
      setTimeout(() => {
        if (loadingTimeoutRef.current) window.clearTimeout(loadingTimeoutRef.current);
        setRooms(Array.from({ length: 40 }, (_, i) => ({
          room: (101 + i).toString(),
          roomType: i % 2 === 0 ? 'King' : 'Double Queen',
          housekeepingStatus: i % 5 === 0 ? RoomStatus.CLEAN : RoomStatus.DIRTY,
          guestStatus: i % 3 === 0 ? 'Arrivals' : 'Checked Out' as any,
          occupancyStatus: 'Vacant',
          arrivalsRoom: '',
          checkIn: '',
          checkOut: '',
          assignedHk: (i % 5 + 1).toString(),
          minutes: 30,
          notes: i % 10 === 0 ? 'Guest reported broken light' : '',
          done: i % 5 === 0,
          serviceType: i % 8 === 0 ? 'Full Stayover Svc' : 'Departure Clean'
        })));
        setLoading(false);
      }, 1000);
    }
  }, [loading]);

  useEffect(() => {
    fetchRooms();
    return () => {
      if (loadingTimeoutRef.current) window.clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  const handleUpdateRoom = (updatedRoom: Room) => {
    // Optimistic UI Update: change state locally first
    setRooms(prev => prev.map(r => r.room === updatedRoom.room ? updatedRoom : r));
    
    // @ts-ignore
    if (typeof google !== 'undefined' && google.script) {
      // @ts-ignore
      google.script.run
        .withSuccessHandler(() => console.log(`Room ${updatedRoom.room} synced.`))
        .withFailureHandler((err: any) => {
          console.error("Sync Error:", err);
          alert("Could not sync room update. Please refresh.");
        })
        .apiUpdateRoom(
          updatedRoom.assignedHk || "FD", 
          updatedRoom.room, 
          updatedRoom.notes, 
          updatedRoom.done
        );
    }
  };

  const handleBulkAssign = (roomNumbers: string[], hkNum: string) => {
    setLoading(true);
    // @ts-ignore
    if (typeof google !== 'undefined' && google.script) {
      // @ts-ignore
      google.script.run
        .withSuccessHandler(() => fetchRooms())
        .withFailureHandler(() => {
          setLoading(false);
          alert("Bulk assignment failed. Check your connection.");
        })
        .apiAssignRoomsBulk(roomNumbers, hkNum);
    } else {
      setRooms(prev => prev.map(r => roomNumbers.includes(r.room) ? { ...r, assignedHk: hkNum } : r));
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Navbar view={view} setView={setView} onRefresh={fetchRooms} loading={loading} />
      
      <main className="flex-1 overflow-hidden relative">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[110] bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3">
            <i className="fa-solid fa-circle-exclamation"></i>
            {error}
            <button onClick={fetchRooms} className="ml-4 bg-white/20 px-3 py-1 rounded-lg">Retry</button>
          </div>
        )}

        {view === 'FRONT_DESK' ? (
          <FrontDeskView rooms={rooms} onBulkAssign={handleBulkAssign} onUpdateRoom={handleUpdateRoom} />
        ) : (
          <HousekeepingView rooms={rooms} onUpdateRoom={handleUpdateRoom} activeHk={activeHk} setActiveHk={setActiveHk} />
        )}

        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-slate-900 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Synchronizing...</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;