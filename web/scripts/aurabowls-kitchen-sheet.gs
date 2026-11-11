/**
 * Aura Bowls — Subscription Order Tracker webhook.
 * Fills Subscription Orders from row 11, then inserts above Total Summary.
 */

const SHEET_ID = "1uG40XeadQAXW_QAsTob4zbsBuKUYajjLyJLYW0V_i-A";
const SHEET_NAME_ORDERS = "Subscription Orders";
const SHEET_NAME_PRICING = "Pricing Matrix";
const START_ROW = 11;

function doPost(e) {
  return handleRequest(e);
}

function doGet() {
  try {
    const ss = openWorkbook({});
    const ordersSheet = ss.getSheetByName(SHEET_NAME_ORDERS);
    return createJsonResponse({
      status: "ok",
      sheet: ordersSheet ? SHEET_NAME_ORDERS : "missing",
      spreadsheet: ss.getName(),
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
    const paymentStatus = data.paymentStatus || "Unpaid";
    const orderStatus = data.orderStatus || "Pending";
    const deliveryNotes = data.deliveryNotes || data.notes || "";

    let totalAmount = data.totalAmount === undefined || data.totalAmount === null || data.totalAmount === ""
      ? null
      : Number(data.totalAmount);
    if (totalAmount === null || isNaN(totalAmount)) {
      totalAmount = lookupPricing(ss, planDuration, mealType);
    }

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
      deliveryNotes,
    ];

    const targetRow = getNextAvailableOrderRow(ordersSheet);
    ordersSheet.getRange(targetRow, 2, 1, rowValues.length).setValues([rowValues]);

    return createJsonResponse({
      status: "success",
      message: "Order logged successfully",
      orderId: orderId,
      assignedRow: targetRow,
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
  const num = String(dur).replace(/[^0-9]/g, "");
  return num ? num + " days" : String(dur);
}

function sanitizeMealType(meal) {
  if (!meal) return "Pure Veg";
  const m = String(meal).toLowerCase();
  if (m.indexOf("non") !== -1) return "Pure Non-Veg";
  if (m.indexOf("mix") !== -1) return "Mixed";
  return "Pure Veg";
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
