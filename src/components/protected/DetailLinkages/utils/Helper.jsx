// New utility functions for handling sheet data operations

export const checkTodaysData = (sheetData) => {
  const today = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (sheetData.length > 0) {
    const dateRow = sheetData[0];
    const hasToday = dateRow.attributes.some(
      (date) => date.includes(todayFormatted) || date.includes(today)
    );
    return hasToday;
  }
  return false;
};

export const convertDateFormat = (dateString, isInputToDisplay = true) => {
  if (isInputToDisplay) {
    // Convert from "2025-06-01" to "1 Jun 2025"
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } else {
    // Convert from "1 Jun 2025" to "2025-06-01"
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  }
};

export const getTodaysDate = () => {
  const today = new Date();
  return today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const getTodaysColumnIndex = (sheetData) => {
  if (!sheetData || sheetData.length === 0) return -1;
  
  const todayFormatted = getTodaysDate();
  const dateRow = sheetData[0];
  
  return dateRow.attributes.findIndex(date => 
    date.includes(todayFormatted)
  );
};

export const calculateColumnTotal = (sheetData, columnIndex, attributeIndex) => {
  if (!sheetData || sheetData.length === 0) return 0;
  
  let total = 0;
  const columnData = sheetData[attributeIndex];
  
  if (columnData && columnData.attributes) {
    columnData.attributes.forEach(value => {
      if (typeof value === 'number') {
        total += value;
      } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
        total += parseFloat(value);
      }
    });
  }
  
  return total;
};

export const calculateDerivedValue = (formula, sheetData, columnIndex) => {
  if (!formula || !sheetData) return 0;
  
  let result = 0;
  
  // Add values from addition indices
  if (formula["addition-indices"]) {
    formula["addition-indices"].forEach(index => {
      if (sheetData[index] && sheetData[index].attributes[columnIndex] !== undefined) {
        const value = parseFloat(sheetData[index].attributes[columnIndex]) || 0;
        result += value;
      }
    });
  }
  
  // Subtract values from subtraction indices
  if (formula["subtraction-indices"]) {
    formula["subtraction-indices"].forEach(index => {
      if (sheetData[index] && sheetData[index].attributes[columnIndex] !== undefined) {
        const value = parseFloat(sheetData[index].attributes[columnIndex]) || 0;
        result -= value;
      }
    });
  }
  
  return result;
};

export const getColumnType = (attribute) => {
  if (attribute.derived) return "derived";
  if (attribute["linked-from"]) return "referenced";
  return "normal";
};