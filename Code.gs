/***********************************************************
 * TOMBSTONE GRAND HOTEL - HK MASTER (v5.3)
 ***********************************************************/

const CFG = {
  SPREADSHEET_ID: "1l-Yxc9uFrj4qza9F77evooz_dJqbDp9Wp-It_we3G-Y",
  ROOMS_SHEET: "Rooms",
  SETUP_SHEET: "Setup",
  HISTORY_SHEET: "Room_History"
};

function ss_() { 
  try {
    return SpreadsheetApp.openById(CFG.SPREADSHEET_ID); 
  } catch (e) {
    throw new Error("Master Spreadsheet Access Denied. Check ID and Permissions.");
  }
}

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle("Tombstone Grand Master")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * API: HK Staff Registration
 */
function apiHkRegisterName(name) {
  const ss = ss_();
  const sh = ss.getSheetByName(CFG.SETUP_SHEET);
  if (!sh) return { ok: false, error: "Setup sheet missing" };
  const vals = sh.getRange(2, 4, Math.max(1, sh.getLastRow() - 1), 2).getValues(); 
  const searchName = name.trim().toLowerCase();
  
  for (let i = 0; i < vals.length; i++) {
    const board = String(vals[i][0]).trim();
    const staffName = String(vals[i][1]).trim();
    if (staffName.toLowerCase() === searchName) {
      return { ok: true, board: board, name: staffName };
    }
  }
  return { ok: false, error: "Staff name '" + name + "' not found in Setup (Col E)." };
}

/**
 * API: Get All Rooms
 */
function apiGetAllRooms() {
  const ss = ss_();
  const rooms = ss.getSheetByName(CFG.ROOMS_SHEET);
  if (!rooms) return [];
  const data = rooms.getDataRange().getValues();
  if (data.length < 2) return [];
  const hm = headerMap_(data[0]);

  return data.slice(1).map(row => ({
    room: (row[hm.room] || "").toString(),
    roomType: row[hm.roomtype] || "",
    housekeepingStatus: row[hm.housekeepingstatus] || "Dirty",
    guestStatus: row[hm.gueststatus] || "Vacant",
    occupancyStatus: row[hm.occupancystatus] || "Vacant",
    arrivalsRoom: row[hm.arrivalsroom] || "",
    checkIn: row[hm.checkin] || "",
    checkOut: row[hm.checkout] || "",
    assignedHk: (row[hm.assignedhk] || "").toString(),
    minutes: parseInt(row[hm.minutes]) || 0,
    notes: row[hm.notes] || "",
    done: row[hm.done] === true || String(row[hm.done]).toUpperCase() === "TRUE",
    serviceType: row[hm.servicetype] || ""
  }));
}

function apiStartRoom(room, staffName) {
  logRoomHistory_(room, "CLEAN_STARTED", "Dirty", "In Progress", staffName);
  return { ok: true };
}

function apiUpdateRoom(hkNumber, room, notes, done) {
  const ss = ss_();
  const sh = ss.getSheetByName(CFG.ROOMS_SHEET);
  const data = sh.getDataRange().getValues();
  const hm = headerMap_(data[0]);
  const rStr = String(room).trim();

  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][hm.room]).trim() === rStr) {
      rowIdx = i + 1;
      break;
    }
  }
  
  if (rowIdx === -1) return { ok: false, error: "Room not found" };

  if (hm.notes !== undefined) sh.getRange(rowIdx, hm.notes + 1).setValue(notes || "");
  if (hm.done !== undefined) {
    sh.getRange(rowIdx, hm.done + 1).setValue(done === true);
    if (done === true) {
      if (hm.housekeepingstatus !== undefined) sh.getRange(rowIdx, hm.housekeepingstatus + 1).setValue("Clean");
      if (hm.donetime !== undefined) sh.getRange(rowIdx, hm.donetime + 1).setValue(new Date());
      if (hm.doneby !== undefined) sh.getRange(rowIdx, hm.doneby + 1).setValue(hkNumber === "FD" ? "FD" : "HK " + hkNumber);
    } else {
      // If manually marking as NOT done, set status back to Dirty
      if (hm.housekeepingstatus !== undefined) sh.getRange(rowIdx, hm.housekeepingstatus + 1).setValue("Dirty");
    }
  }

  SpreadsheetApp.flush();
  return { ok: true };
}

function apiAssignRoomsBulk(roomsArray, hkNumber) {
  const ss = ss_();
  const sh = ss.getSheetByName(CFG.ROOMS_SHEET);
  const data = sh.getDataRange().getValues();
  const hm = headerMap_(data[0]);
  const hk = String(hkNumber || "").trim();

  roomsArray.forEach(roomNo => {
    for (let i = 1; i < data.length; i++) {
      if (data[i][hm.room].toString() === roomNo.toString()) {
        sh.getRange(i + 1, hm.assignedhk + 1).setValue(hk);
        break;
      }
    }
  });

  SpreadsheetApp.flush();
  return { ok: true };
}

function headerMap_(headerRow) {
  const m = {};
  for (let i = 0; i < headerRow.length; i++) {
    const key = String(headerRow[i] || "").toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
    if (key) m[key] = i;
  }
  return m;
}

function mustGetOrCreateSheet_(ss, name) { return ss.getSheetByName(name) || ss.insertSheet(name); }

function logRoomHistory_(room, action, oldVal, newVal, byWho) {
  try {
    const ss = ss_();
    const sh = mustGetOrCreateSheet_(ss, CFG.HISTORY_SHEET);
    if (sh.getLastRow() === 0) sh.appendRow(["Time", "Room", "Action", "Old", "New", "By"]);
    sh.appendRow([new Date(), String(room), String(action), String(oldVal), String(newVal), String(byWho)]);
  } catch (e) {}
}