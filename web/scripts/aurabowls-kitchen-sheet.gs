/**
 * Aura Bowls — Subscription Order Tracker webhook.
 * Fills Subscription Orders from row 11, then inserts a personal tracker tab.
 *
 * After paste: Save, then Deploy → Manage deployments → pencil → Version: New version → Deploy.
 * A GET of the /exec URL must return "version":"day-tabs-5" or the site is still on the old script.
 */

const SCRIPT_VERSION = "day-tabs-5";
const SHEET_ID = "1uG40XeadQAXW_QAsTob4zbsBuKUYajjLyJLYW0V_i-A";
const SHEET_NAME_ORDERS = "Subscription Orders";
const SHEET_NAME_PRICING = "Pricing Matrix";
const START_ROW = 11;

function ping() {
  const ss = openWorkbook({});
  writeDaySheet(ss, {
    orderId: "AB-PING",
    customerName: "Ping",
    phoneNumber: "",
    deliveryArea: "",
    planDuration: "3 days",
    startDate: Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd"),
    slot: "12:00-1:30",
    style: "Balanced",
    defaultBowl: "Test bowl",
    paymentStatus: "Pending",
    mealType: "Pure Veg",
    daysSchedule: [
      { date: "2026-11-12", weekday: "Wed", bowl: "Paneer Meal Bowl" },
      { date: "2026-11-13", weekday: "Thu", bowl: "Mushroom Meal Bowl" },
      { date: "2026-11-14", weekday: "Fri", bowl: "Rajma Meal Bowl" },
    ],
    deliveryNotes: "",
  });
}

function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  try {
    const phone = e && e.parameter && (e.parameter.phone || e.parameter.track);
    if (phone) return lookupByPhone(phone);
    const ss = openWorkbook({});
    const ordersSheet = ss.getSheetByName(SHEET_NAME_ORDERS);
    return createJsonResponse({
      status: "ok",
      version: SCRIPT_VERSION,
      sheet: ordersSheet ? SHEET_NAME_ORDERS : "missing",
      spreadsheet: ss.getName(),
      tabs: ss.getSheets().length,
    });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.message });
  }
}

function openWorkbook(data) {
  const id = data.spreadsheetId || SHEET_ID;
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  return SpreadsheetApp.openById(id);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return createJsonResponse({ status: "error", message: "Server busy, please try again." });
  }

  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    const ss = openWorkbook(data);
    const ordersSheet = ss.getSheetByName(SHEET_NAME_ORDERS);
    if (!ordersSheet) {
      throw new Error('Sheet "' + SHEET_NAME_ORDERS + '" not found.');
    }

    const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Kolkata", "yyyy-MM-dd");
    const orderId = data.orderId || "AB-" + Math.floor(100000 + Math.random() * 900000);
    const orderDate = data.orderDate || todayStr;
    const customerName = data.customerName || data.name || "";
    const phoneNumber = data.phoneNumber || data.phone || "";
    const deliveryArea = data.deliveryArea || data.area || "";
    const mealType = sanitizeMealType(data.mealType);
    const planDuration = sanitizePlanDuration(data.planDuration);
    const startDate = data.startDate || todayStr;
    const paymentStatus = sanitizePayment(data.paymentStatus);
    const orderStatus = sanitizeOrderStatus(data.orderStatus);
    const deliveryNotes = data.deliveryNotes || data.notes || "";

    let totalAmount = data.totalAmount === undefined || data.totalAmount === null || data.totalAmount === ""
      ? null
      : Number(data.totalAmount);
    if (totalAmount === null || isNaN(totalAmount)) {
      totalAmount = lookupPricing(ss, planDuration, mealType);
    }

    const trackerData = {
      orderId: orderId,
      customerName: customerName,
      phoneNumber: phoneNumber,
      deliveryArea: deliveryArea,
      planDuration: planDuration,
      startDate: startDate,
      slot: data.slot || "",
      style: data.style || "",
      defaultBowl: data.defaultBowl || "",
      paymentStatus: paymentStatus,
      mealType: mealType,
      daysSchedule: data.daysSchedule,
      deliveryNotes: deliveryNotes,
    };

    let dayTab = "";
    let tabError = "";
    try {
      dayTab = writeDaySheet(ss, trackerData);
    } catch (tabErr) {
      tabError = tabErr && tabErr.message ? tabErr.message : String(tabErr);
    }

    const notes = [
      dayTab ? "Tracker tab: " + dayTab : "",
      tabError ? "Tab error: " + tabError : "",
      deliveryNotes,
    ].filter(Boolean).join(" | ");
    const rowValues = [
      orderId,
      orderDate,
      customerName,
      phoneNumber,
      deliveryArea,
      mealType,
      planDuration,
      startDate,
      totalAmount,
      paymentStatus,
      orderStatus,
      notes,
    ];

    const existingRow = findOrderRow(ordersSheet, orderId);
    const targetRow = existingRow !== -1 ? existingRow : getNextAvailableOrderRow(ordersSheet);
    try {
      ordersSheet.getRange(targetRow, 2, 1, rowValues.length).setValues([rowValues]);
    } catch (rowErr) {
      try {
        ordersSheet.getRange(targetRow, 2).setValue(orderId);
        ordersSheet.getRange(targetRow, 3).setValue(orderDate);
        ordersSheet.getRange(targetRow, 4).setValue(customerName);
        ordersSheet.getRange(targetRow, 5).setValue(phoneNumber);
        ordersSheet.getRange(targetRow, 6).setValue(deliveryArea);
        ordersSheet.getRange(targetRow, 7).setValue(mealType);
        ordersSheet.getRange(targetRow, 8).setValue(planDuration);
        ordersSheet.getRange(targetRow, 9).setValue(startDate);
        ordersSheet.getRange(targetRow, 10).setValue(totalAmount);
        ordersSheet.getRange(targetRow, 11).setValue(paymentStatus);
        ordersSheet.getRange(targetRow, 12).setValue(orderStatus);
        ordersSheet.getRange(targetRow, 13).setValue(notes);
      } catch (retryErr) {}
    }
    try {
      linkOrderToTracker(ss, ordersSheet, targetRow, orderId, dayTab);
    } catch (linkErr) {}

    return createJsonResponse({
      status: "success",
      message: "Order logged successfully",
      orderId: orderId,
      assignedRow: targetRow,
      dayTab: dayTab,
      tabError: tabError,
      version: SCRIPT_VERSION,
      totalAmount: totalAmount,
    });
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.message,
    });
  } finally {
    lock.releaseLock();
  }
}

function findOrderRow(sheet, orderId) {
  const id = String(orderId || "").trim();
  if (!id) return -1;
  const height = sheet.getMaxRows() - START_ROW + 1;
  if (height < 1) return -1;
  const shown = sheet.getRange(START_ROW, 2, height, 1).getDisplayValues();
  for (let i = 0; i < shown.length; i++) {
    const cell = String(shown[i][0]).trim();
    if (cell.toLowerCase().indexOf("total summary") !== -1) break;
    if (cell === id || cell.indexOf(id) === 0) return START_ROW + i;
  }
  return -1;
}

function getNextAvailableOrderRow(sheet) {
  const maxRows = sheet.getMaxRows();
  const colBValues = sheet.getRange(1, 2, maxRows, 1).getValues();
  let summaryRowIndex = -1;

  for (let i = START_ROW - 1; i < colBValues.length; i++) {
    const cellVal = String(colBValues[i][0]).trim();
    if (cellVal.toLowerCase().indexOf("total summary") !== -1) {
      summaryRowIndex = i + 1;
      break;
    }
    if (cellVal === "") {
      return i + 1;
    }
  }

  if (summaryRowIndex !== -1) {
    sheet.insertRowBefore(summaryRowIndex);
    return summaryRowIndex;
  }

  return sheet.getLastRow() + 1;
}

function lookupPricing(ss, planDuration, mealType) {
  const pricingSheet = ss.getSheetByName(SHEET_NAME_PRICING);
  if (!pricingSheet) return 0;

  const matrixData = pricingSheet.getRange("B4:E9").getValues();
  const headerRow = matrixData[0];
  const cleanMeal = String(mealType).toLowerCase().replace(/[^a-z]/g, "");
  let colIndex = -1;

  for (let c = 1; c < headerRow.length; c++) {
    const colName = String(headerRow[c]).toLowerCase().replace(/[^a-z]/g, "");
    if (colName === cleanMeal) {
      colIndex = c;
      break;
    }
  }
  if (colIndex === -1) {
    for (let c = 1; c < headerRow.length; c++) {
      const colName = String(headerRow[c]).toLowerCase().replace(/[^a-z]/g, "");
      if (cleanMeal.indexOf("non") !== -1 && colName.indexOf("non") !== -1) {
        colIndex = c;
        break;
      }
      if (cleanMeal.indexOf("mix") !== -1 && colName.indexOf("mix") !== -1) {
        colIndex = c;
        break;
      }
    }
  }
  if (colIndex === -1) {
    for (let c = 1; c < headerRow.length; c++) {
      const colName = String(headerRow[c]).toLowerCase().replace(/[^a-z]/g, "");
      if (colName.indexOf("veg") !== -1 && colName.indexOf("non") === -1) {
        colIndex = c;
        break;
      }
    }
  }
  if (colIndex === -1) colIndex = 1;

  const cleanDuration = String(planDuration).replace(/[^0-9]/g, "");
  for (let r = 1; r < matrixData.length; r++) {
    const durationInSheet = String(matrixData[r][0]).replace(/[^0-9]/g, "");
    if (durationInSheet === cleanDuration) {
      const rawPrice = matrixData[r][colIndex];
      const parsedPrice = typeof rawPrice === "number" ? rawPrice : Number(String(rawPrice).replace(/[^0-9.]/g, ""));
      return isNaN(parsedPrice) ? 0 : parsedPrice;
    }
  }
  return 0;
}

function sanitizePlanDuration(dur) {
  if (!dur) return "5 days";
  const text = String(dur);
  if (text.toLowerCase().indexOf("single") !== -1) return "Single";
  const num = text.replace(/[^0-9]/g, "");
  if (num === "1") return "Single";
  return num ? num + " days" : text;
}

function writeDaySheet(ss, data) {
  const days = buildDays(data);
  if (!days.length) return "";
  const tabName = dayTabName(data.orderId, data.planDuration, data.customerName);
  let sheet = ss.getSheetByName(tabName);
  if (!sheet) sheet = ss.insertSheet(tabName);
  try {
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(ss.getNumSheets());
  } catch (moveErr) {}
  sheet.clear();

  const startDate = data.startDate || days[0].date || "";
  const endDate = days[days.length - 1].date || startDate;
  const lastRow = 11 + days.length;

  sheet.getRange("A1:F1").merge();
  sheet.getRange("A1").setValue("Personal order tracker — " + (data.customerName || data.orderId || "AuraBowls"));
  sheet.getRange("A1").setFontWeight("bold").setFontSize(14);

  sheet.getRange("A3:B9").setValues([
    ["Order ID", data.orderId || ""],
    ["Customer", data.customerName || ""],
    ["Phone", data.phoneNumber || ""],
    ["Address", data.deliveryArea || ""],
    ["Plan", data.planDuration || ""],
    ["Start date", startDate],
    ["End date", endDate],
  ]);
  sheet.getRange("D3:E8").setValues([
    ["Mix", data.mealType || ""],
    ["Style", data.style || ""],
    ["Lunch slot", data.slot || ""],
    ["Default bowl", data.defaultBowl || ""],
    ["Payment", data.paymentStatus || "Pending"],
    ["Delivered", "=COUNTIF(E12:E" + lastRow + ',"Yes") & " of " & ' + days.length],
  ]);
  sheet.getRange("A3:A9").setFontWeight("bold");
  sheet.getRange("D3:D8").setFontWeight("bold");

  sheet.getRange("A11:F11").setValues([["#", "Date", "Day", "Bowl choice", "Delivered?", "Notes"]]);
  sheet.getRange("A11:F11").setFontWeight("bold");

  const rows = days.map(function (day, index) {
    return [index + 1, day.date, day.weekday, day.bowl, "No", ""];
  });
  sheet.getRange(12, 1, rows.length, 6).setValues(rows);

  const deliveredRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["No", "Yes"], true)
    .setAllowInvalid(false)
    .setHelpText("Mark Yes only after this day's bowl is delivered.")
    .build();
  sheet.getRange(12, 5, rows.length, 1).setDataValidation(deliveredRule);

  sheet.setFrozenRows(11);
  sheet.setColumnWidth(1, 40);
  sheet.setColumnWidth(2, 110);
  sheet.setColumnWidth(3, 80);
  sheet.setColumnWidth(4, 240);
  sheet.setColumnWidth(5, 110);
  sheet.setColumnWidth(6, 220);
  return tabName;
}

function dayTabName(orderId, planDuration, customerName) {
  const id = String(orderId || "AB").replace(/[^\w\-]/g, "").slice(0, 24);
  const raw = String(planDuration || "").toLowerCase();
  const days = raw.indexOf("single") !== -1 ? "1" : (String(planDuration || "").replace(/[^0-9]/g, "") || "plan");
  const first = String(customerName || "").trim().split(/\s+/)[0].replace(/[^\w]/g, "").slice(0, 16);
  return (id + (first ? " " + first : "") + " " + days + "d").slice(0, 90);
}

function linkOrderToTracker(ss, ordersSheet, row, orderId, dayTab) {
  const safeId = String(orderId || "").replace(/"/g, "");
  const daySheet = dayTab ? ss.getSheetByName(dayTab) : null;
  if (!daySheet || !safeId) return;
  const url = ss.getUrl() + "#gid=" + daySheet.getSheetId();
  ordersSheet.getRange(row, 2).setFormula('=HYPERLINK("' + url + '","' + safeId + '")');
}

function buildDays(data) {
  const parsed = parseDaySchedule(data);
  if (parsed.length) return parsed;
  const count = parseInt(String(data.planDuration || "").replace(/[^0-9]/g, ""), 10) || 5;
  const bowl = data.defaultBowl || "Scheduled bowl";
  let cursor = String(data.startDate || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cursor)) return [];
  const days = [];
  for (let step = 0; step < 90 && days.length < count; step += 1) {
    const date = new Date(cursor + "T00:00:00Z");
    if (date.getUTCDay() !== 0) {
      days.push({
        date: cursor,
        weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getUTCDay()],
        bowl: bowl,
      });
    }
    cursor = Utilities.formatDate(new Date(date.getTime() + 86400000), "UTC", "yyyy-MM-dd");
  }
  return days;
}

function parseDaySchedule(data) {
  let schedule = data.daysSchedule;
  if (typeof schedule === "string" && schedule) {
    try { schedule = JSON.parse(schedule); } catch (err) { schedule = null; }
  }
  if (schedule && schedule.length) {
    const rows = schedule.map(function (item) {
      if (typeof item === "string") return { date: "", weekday: "", bowl: item };
      return {
        date: item.date || "",
        weekday: item.weekday || "",
        bowl: item.bowl || "",
      };
    }).filter(function (item) { return item.date || item.bowl; });
    if (rows.length) return rows;
  }
  const notes = String(data.deliveryNotes || "");
  return notes.split(" | ").map(function (part) {
    const bits = part.split(":");
    if (bits.length < 2) return null;
    const label = bits[0].trim();
    const bowl = bits.slice(1).join(":").trim();
    if (!bowl || label.indexOf("Map") === 0 || label.indexOf("Lunch") === 0 || label.indexOf("Style") === 0 || label.indexOf("Default") === 0 || label.indexOf("Tracker") === 0) return null;
    return { date: "", weekday: label, bowl: bowl };
  }).filter(Boolean);
}

function sanitizePayment(status) {
  const value = String(status || "").toLowerCase();
  if (value.indexOf("unpaid") !== -1 || value.indexOf("pending") !== -1 || !value) return "Pending";
  if (value.indexOf("fail") !== -1) return "Failed";
  if (value.indexOf("paid") !== -1) return "Paid";
  return "Pending";
}

function sanitizeOrderStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value.indexOf("active") !== -1) return "Active";
  if (value.indexOf("cancel") !== -1) return "Cancelled";
  if (value.indexOf("complete") !== -1) return "Completed";
  return "Pending";
}

function sanitizeMealType(meal) {
  if (!meal) return "Pure Veg";
  const m = String(meal).toLowerCase();
  if (m.indexOf("non") !== -1) return "Pure Non-Veg";
  if (m.indexOf("mix") !== -1) return "Mixed";
  return "Pure Veg";
}

function phoneDigits(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.indexOf("91") === 0) digits = digits.slice(2);
  if (digits.length === 11 && digits.charAt(0) === "0") digits = digits.slice(1);
  return digits.slice(-10);
}

function lookupByPhone(raw) {
  const want = phoneDigits(raw);
  if (want.length !== 10) return createJsonResponse({ status: "error", message: "Enter a 10-digit mobile." });
  const ss = openWorkbook({});
  const ordersSheet = ss.getSheetByName(SHEET_NAME_ORDERS);
  if (!ordersSheet) return createJsonResponse({ status: "ok", orders: [] });
  const last = ordersSheet.getLastRow();
  if (last < START_ROW) return createJsonResponse({ status: "ok", orders: [] });
  const values = ordersSheet.getRange(START_ROW, 2, last - START_ROW + 1, 12).getDisplayValues();
  const orders = [];
  const seen = {};
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const orderId = String(row[0] || "").trim();
    if (orderId.toLowerCase().indexOf("total summary") !== -1) break;
    if (!orderId || seen[orderId]) continue;
    if (phoneDigits(row[3]) !== want) continue;
    seen[orderId] = true;
    const notes = String(row[11] || "");
    orders.push({
      orderId: orderId,
      name: String(row[2] || ""),
      plan: String(row[6] || ""),
      startDate: String(row[7] || ""),
      payment: String(row[9] || "Pending"),
      status: String(row[10] || "Pending"),
      days: daysFromTab(ss, notes, orderId, row[6], row[2]),
    });
  }
  return createJsonResponse({ status: "ok", orders: orders.reverse() });
}

function daysFromTab(ss, notes, orderId, plan, name) {
  let tab = "";
  const match = String(notes).match(/Tracker tab:\s*([^|]+)/);
  if (match) tab = match[1].trim();
  let sheet = tab ? ss.getSheetByName(tab) : null;
  if (!sheet) sheet = ss.getSheetByName(dayTabName(orderId, plan, name));
  if (!sheet) return [];
  const last = sheet.getLastRow();
  if (last < 12) return [];
  return sheet.getRange(12, 1, last - 11, 5).getDisplayValues()
    .filter(function (row) { return row[1] || row[3]; })
    .map(function (row) {
      const delivered = String(row[4] || "").toLowerCase() === "yes";
      return {
        date: String(row[1] || ""),
        weekday: String(row[2] || ""),
        bowl: String(row[3] || ""),
        delivered: delivered,
        status: delivered ? "Delivered" : "Scheduled",
      };
    });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
