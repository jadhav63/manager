import React, { useState, useEffect, useCallback } from 'react';
import { ViewType, Room, HKStaff, RoomStatus, GuestStatus } from './types.ts';
import Navbar from './Navbar.tsx';
import FrontDeskView from './FrontDeskView.tsx';
import HousekeepingView from './HousekeepingView.tsx';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('FRONT_DESK');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHk, setActiveHk] = useState<HKStaff | null>(null);

  const initData = useCallback(() => {
    setLoading(true);
    
    // @ts-ignore
    if (typeof google !== 'undefined' && google.script) {
      // @ts-ignore
      google.script.run
        .withSuccessHandler((data: Room[]) => {
          setRooms(data || []);
          setLoading(false);
        })
        .apiGetAllRooms();
    } else {
      const saved = localStorage.getItem('tg_master_rooms');
      if (saved) {
        setRooms(JSON.parse(saved));
        setLoading(false);
      } else {
        const mockRooms: Room[] = Array.from({ length: 40 }, (_, i) => ({
          room: (101 + i).toString(),
          roomType: i % 2 === 0 ? 'King' : 'Double Queen',
          housekeepingStatus: RoomStatus.DIRTY,
          guestStatus: i % 4 === 0 ? GuestStatus.CHECKOUT : i % 3 === 0 ? GuestStatus.ARRIVAL : GuestStatus.STAYOVER,
          occupancyStatus: 'Occupied',
          arrivalsRoom: '',
          checkIn: '',
          checkOut: '',
          assignedHk: '',
          minutes: 30,
          notes: i % 10 === 0 ? 'Guest requested extra towels' : '',
          done: false,
          serviceType: i % 3 === 0 ? 'Departure Clean' : 'Full Stayover Svc'
        }));
        setRooms(mockRooms);
        localStorage.setItem('tg_master_rooms', JSON.stringify(mockRooms));
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    initData();
  }, [initData]);

  const syncUpdate = (updatedRooms: Room[]) => {
    setRooms(updatedRooms);
    // @ts-ignore
    if (typeof google === 'undefined') {
      localStorage.setItem('tg_master_rooms', JSON.stringify(updatedRooms));
    }
  };

  const handleUpdateRoom = (roomNo: string, updates: Partial<Room>) => {
    const newRooms = rooms.map(r => r.room === roomNo ? { ...r, ...updates } : r);
    syncUpdate(newRooms);

    // @ts-ignore
    if (typeof google !== 'undefined' && google.script) {
      const room = newRooms.find(r => r.room === roomNo);
      if (room) {
        // @ts-ignore
        google.script.run.apiUpdateRoom(
          activeHk?.num || "FD",
          room.room,
          room.notes,
          room.done
        );
      }
    }
  };

  const handleBulkAssign = (roomNos: string[], hkNum: string) => {
    const newRooms = rooms.map(r => roomNos.includes(r.room) ? { ...r, assignedHk: hkNum } : r);
    syncUpdate(newRooms);

    // @ts-ignore
    if (typeof google !== 'undefined' && google.script) {
      // @ts-ignore
      google.script.run.withSuccessHandler(() => initData()).apiAssignRoomsBulk(roomNos, hkNum);
    }
  };

  return (
    <div className="h-full flex flex-col font-sans select-none">
      <Navbar view={view} setView={setView} onRefresh={initData} loading={loading} />
      
      <main className="flex-1 relative overflow-hidden bg-slate-50">
        {view === 'FRONT_DESK' ? (
          <FrontDeskView 
            rooms={rooms} 
            onBulkAssign={handleBulkAssign} 
            onUpdateRoom={(roomNo, updates) => handleUpdateRoom(roomNo, updates)} 
          />
        ) : (
          <HousekeepingView 
            rooms={rooms} 
            activeHk={activeHk} 
            setActiveHk={setActiveHk} 
            onUpdateRoom={handleUpdateRoom} 
          />
        )}

        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-slate-900 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-[10px] font-black uppercase text-slate-900 tracking-[0.3em]">Synchronizing</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;