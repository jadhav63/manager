
import React, { useState, useMemo } from 'react';
import { Room, RoomStatus, GuestStatus } from '../types';

interface FrontDeskViewProps {
  rooms: Room[];
  onBulkAssign: (roomNumbers: string[], hkNum: string) => void;
  onUpdateRoom: (room: Room) => void;
}

const FrontDeskView: React.FC<FrontDeskViewProps> = ({ rooms, onBulkAssign, onUpdateRoom }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [filterGuest, setFilterGuest] = useState<string>('ALL');
  const [filterHk, setFilterHk] = useState<string>('ALL');
  const [bulkHk, setBulkHk] = useState('');

  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const matchesSearch = r.room.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGuest = filterGuest === 'ALL' || r.guestStatus === filterGuest;
      const matchesHk = filterHk === 'ALL' || (filterHk === 'UNASSIGNED' ? !r.assignedHk : r.assignedHk === filterHk);
      return matchesSearch && matchesGuest && matchesHk;
    });
  }, [rooms, searchTerm, filterGuest, filterHk]);

  const stats = useMemo(() => {
    return {
      total: rooms.length,
      dirty: rooms.filter(r => r.housekeepingStatus === RoomStatus.DIRTY).length,
      clean: rooms.filter(r => r.housekeepingStatus === RoomStatus.CLEAN).length,
      arrivals: rooms.filter(r => r.guestStatus === GuestStatus.ARRIVAL).length,
      checkouts: rooms.filter(r => r.guestStatus === GuestStatus.CHECKOUT).length,
    };
  }, [rooms]);

  const toggleSelect = (roomNo: string) => {
    const newSet = new Set(selectedRooms);
    if (newSet.has(roomNo)) newSet.delete(roomNo);
    else newSet.add(roomNo);
    setSelectedRooms(newSet);
  };

  const handleBulkAssign = () => {
    if (selectedRooms.size === 0) return;
    onBulkAssign(Array.from(selectedRooms), bulkHk);
    setSelectedRooms(new Set());
    setBulkHk('');
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden">
      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total Rooms', value: stats.total, color: 'bg-slate-100 border-slate-200 text-slate-700', icon: 'fa-building' },
          { label: 'Dirty', value: stats.dirty, color: 'bg-red-50 border-red-200 text-red-700', icon: 'fa-broom' },
          { label: 'Clean', value: stats.clean, color: 'bg-green-50 border-green-200 text-green-700', icon: 'fa-circle-check' },
          { label: 'Arrivals', value: stats.arrivals, color: 'bg-blue-50 border-blue-200 text-blue-700', icon: 'fa-plane-arrival' },
          { label: 'Checkouts', value: stats.checkouts, color: 'bg-purple-50 border-purple-200 text-purple-700', icon: 'fa-door-open' },
        ].map((stat, i) => (
          <div key={i} className={`border rounded-xl p-4 flex items-center justify-between ${stat.color} shadow-sm transition-transform hover:scale-[1.02]`}>
            <div>
              <p className="text-[10px] uppercase font-black opacity-60 mb-1">{stat.label}</p>
              <p className="text-2xl font-black">{stat.value}</p>
            </div>
            <i className={`fa-solid ${stat.icon} text-2xl opacity-20`}></i>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Search room #..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
          value={filterGuest}
          onChange={(e) => setFilterGuest(e.target.value)}
        >
          <option value="ALL">All Guest Status</option>
          {Object.values(GuestStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select 
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
          value={filterHk}
          onChange={(e) => setFilterHk(e.target.value)}
        >
          <option value="ALL">All Assignments</option>
          <option value="UNASSIGNED">Unassigned</option>
          {[1,2,3,4,5].map(n => <option key={n} value={n.toString()}>HK {n}</option>)}
        </select>

        {selectedRooms.size > 0 && (
          <div className="flex items-center gap-2 pl-4 border-l border-slate-200 animate-in fade-in slide-in-from-left-4 duration-300">
            <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
              {selectedRooms.size} Selected
            </span>
            <select 
              className="bg-slate-900 text-white border-none rounded-lg px-3 py-2 text-sm font-bold outline-none"
              value={bulkHk}
              onChange={(e) => setBulkHk(e.target.value)}
            >
              <option value="">Assign To...</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n.toString()}>HK {n}</option>)}
            </select>
            <button 
              onClick={handleBulkAssign}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-md active:scale-95"
            >
              Apply
            </button>
            <button 
              onClick={() => setSelectedRooms(new Set())}
              className="text-slate-400 hover:text-red-500 p-2 transition-colors"
            >
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          </div>
        )}
      </div>

      {/* Room Grid */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredRooms.map((room) => (
            <div 
              key={room.room}
              onClick={() => toggleSelect(room.room)}
              className={`
                group relative bg-white border rounded-2xl p-4 cursor-pointer transition-all duration-300
                ${selectedRooms.has(room.room) ? 'ring-2 ring-blue-600 border-blue-600 shadow-lg scale-[1.02]' : 'hover:shadow-md border-slate-200'}
              `}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter">#{room.room}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase">{room.roomType}</p>
                </div>
                <div className={`
                  px-3 py-1 rounded-full text-[10px] font-black uppercase
                  ${room.housekeepingStatus === RoomStatus.CLEAN ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                `}>
                  {room.housekeepingStatus}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  room.guestStatus === GuestStatus.CHECKOUT ? 'border-red-200 bg-red-50 text-red-600' :
                  room.guestStatus === GuestStatus.ARRIVAL ? 'border-amber-200 bg-amber-50 text-amber-600' :
                  'border-blue-200 bg-blue-50 text-blue-600'
                }`}>
                  {room.guestStatus}
                </span>
                {room.notes && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-red-200 bg-red-50 text-red-600 flex items-center gap-1">
                    <i className="fa-solid fa-triangle-exclamation"></i> ALERT
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${room.assignedHk ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                  <span className="text-xs font-bold text-slate-500">
                    {room.assignedHk ? `HK ${room.assignedHk}` : 'Unassigned'}
                  </span>
                </div>
                {room.done && <i className="fa-solid fa-circle-check text-green-500"></i>}
              </div>

              {/* Selection Checkmark */}
              {selectedRooms.has(room.room) && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white h-6 w-6 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  <i className="fa-solid fa-check text-[10px]"></i>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FrontDeskView;
