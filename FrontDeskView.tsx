import React, { useState, useMemo } from 'react';
import { Room, RoomStatus, GuestStatus } from './types.ts';

interface FrontDeskViewProps {
  rooms: Room[];
  onBulkAssign: (roomNumbers: string[], hkNum: string) => void;
  onUpdateRoom: (roomNo: string, updates: Partial<Room>) => void;
}

const FrontDeskView: React.FC<FrontDeskViewProps> = ({ rooms, onBulkAssign, onUpdateRoom }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [filterHk, setFilterHk] = useState('ALL');
  const [bulkHk, setBulkHk] = useState('');

  const filtered = useMemo(() => rooms.filter(r => 
    (r.room || "").toLowerCase().includes(searchTerm.toLowerCase()) && 
    (filterHk === 'ALL' || (filterHk === 'UNASSIGNED' ? !r.assignedHk : r.assignedHk === filterHk))
  ), [rooms, searchTerm, filterHk]);

  const toggleSelect = (no: string) => {
    const s = new Set(selectedRooms);
    if (s.has(no)) s.delete(no); else s.add(no);
    setSelectedRooms(s);
  };

  const handleStatusToggle = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    const nextStatus = room.housekeepingStatus === RoomStatus.CLEAN ? RoomStatus.DIRTY : RoomStatus.CLEAN;
    onUpdateRoom(room.room, { housekeepingStatus: nextStatus, done: nextStatus === RoomStatus.CLEAN });
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Quick search room #..." 
            className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <select 
          className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none" 
          value={filterHk} 
          onChange={e => setFilterHk(e.target.value)}
        >
          <option value="ALL">All Boards</option>
          <option value="UNASSIGNED">Unassigned Only</option>
          {[1,2,3,4,5].map(n => <option key={n} value={n.toString()}>Board {n}</option>)}
        </select>
        
        {selectedRooms.size > 0 && (
          <div className="flex items-center gap-3 ml-auto bg-blue-50 p-2 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-right-4">
            <span className="text-xs font-black text-blue-600 px-3">{selectedRooms.size} SELECTED</span>
            <select 
              className="bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-bold outline-none" 
              value={bulkHk} 
              onChange={e => setBulkHk(e.target.value)}
            >
              <option value="">Assign To Board...</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n.toString()}>Board {n}</option>)}
            </select>
            <button 
              className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase transition-all active:scale-95 shadow-md hover:bg-blue-700 disabled:opacity-50"
              disabled={!bulkHk}
              onClick={() => { 
                onBulkAssign(Array.from(selectedRooms), bulkHk); 
                setSelectedRooms(new Set()); 
                setBulkHk(''); 
              }}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 pb-12 custom-scrollbar">
        {filtered.map(r => (
          <div 
            key={r.room} 
            onClick={() => toggleSelect(r.room)} 
            className={`relative p-5 bg-white border-2 rounded-[2rem] cursor-pointer transition-all duration-300 group ${
              selectedRooms.has(r.room) ? 'border-blue-600 ring-8 ring-blue-50 bg-blue-50/20' : 'border-white hover:border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="text-3xl font-black tracking-tighter text-slate-900 group-hover:scale-105 transition-transform">#{r.room}</div>
              <button 
                onClick={(e) => handleStatusToggle(e, r)} 
                className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg transition-colors ${
                  r.housekeepingStatus === RoomStatus.CLEAN ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {r.housekeepingStatus}
              </button>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1">
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                  r.guestStatus === GuestStatus.CHECKOUT ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {r.guestStatus}
                </span>
                <span className="text-[8px] font-black uppercase text-slate-400 border border-slate-100 px-2 py-0.5 rounded">
                  {r.roomType}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-1.5">
                <i className={`fa-solid fa-clipboard-user ${r.assignedHk ? 'text-blue-500' : 'text-slate-200'}`}></i>
                {r.assignedHk ? `BOARD ${r.assignedHk}` : 'UNASSIGNED'}
              </p>
            </div>

            {r.notes && (
              <div className="mt-3 text-[9px] font-bold text-slate-500 bg-slate-50 p-2 rounded-xl truncate italic border border-slate-100">
                "{r.notes}"
              </div>
            )}

            {selectedRooms.has(r.room) && (
              <div className="absolute -top-3 -right-3 bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                <i className="fa-solid fa-check text-[10px]"></i>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FrontDeskView;