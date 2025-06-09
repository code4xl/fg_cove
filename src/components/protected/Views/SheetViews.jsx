import React, { useState, useEffect } from "react";
import { Search, X, Plus, ChevronRight, Info } from "lucide-react";
import { ColumnCreationForm } from "./utils/Helper";

// Data processing utilities
const processSheetData = (metadata, sheetsData) => {
  return metadata.map((sheet) => {
    const sheetData = sheetsData[sheet["object-id"]] || [];

    const processedAttributes = sheet.attributes.map((attr, index) => {
      const attributeData = sheetData[index]?.attributes || [];

      // Create human-readable formula for derived columns
      let humanFormula = null;
      if (attr.derived && attr.formula) {
        const additionTerms = (attr.formula["addition-indices"] || []).map(
          (idx) => sheet.attributes[idx]?.name || `Column${idx}`
        );
        const subtractionTerms = (
          attr.formula["subtraction-indices"] || []
        ).map((idx) => sheet.attributes[idx]?.name || `Column${idx}`);

        const parts = [];
        if (additionTerms.length > 0) {
          parts.push(additionTerms.join(" + "));
        }
        if (subtractionTerms.length > 0) {
          parts.push(" - " + subtractionTerms.join(" - "));
        }
        humanFormula = parts.join("");
      }

      return {
        ...attr,
        data: attributeData,
        objectId: sheetData[index]?.["object-id"] || null,
        humanFormula,
      };
    });

    return {
      ...sheet,
      attributes: processedAttributes,
    };
  });
};

const calculateDerivedValue = (formula, allAttributes, rowIndex) => {
  if (!formula) return 0;

  let result = 0;

  // Add values from addition indices
  if (formula["addition-indices"]) {
    formula["addition-indices"].forEach((idx) => {
      const value = allAttributes[idx]?.data[rowIndex];
      if (typeof value === "number") {
        result += value;
      }
    });
  }

  // Subtract values from subtraction indices
  if (formula["subtraction-indices"]) {
    formula["subtraction-indices"].forEach((idx) => {
      const value = allAttributes[idx]?.data[rowIndex];
      if (typeof value === "number") {
        result -= value;
      }
    });
  }

  return result;
};

const calculateAllDerivedColumns = (processedSheet) => {
  const updatedSheet = { ...processedSheet };
  const maxRows = Math.max(
    ...updatedSheet.attributes.map((attr) => attr.data.length)
  );

  // Calculate derived columns
  updatedSheet.attributes.forEach((attr, attrIndex) => {
    if (attr.derived && attr.formula) {
      const newData = [];
      for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        const calculatedValue = calculateDerivedValue(
          attr.formula,
          updatedSheet.attributes,
          rowIndex
        );
        newData.push(calculatedValue);
      }
      updatedSheet.attributes[attrIndex].data = newData;
    }
  });

  return updatedSheet;
};

// Main Application Component
const SheetManagement = () => {
  // Sample data - you'll replace this with your actual data
  const sampleMetadata = [
    {
      "object-id": "507f1f77bcf86cd799439011",
      "sheet-name": "raw-material-warehouse",
      department: "Operations",
      "last-modified": "2025-05-29T10:30:00Z",
      "modified-by": "John Doe",
      attributes: [
        {
          name: "date",
          derived: false,
          formula: null,
          "linked-from": null,
          "recurrent-check": {
            "is-recurrent": false,
            "recurrent-reference-indice": null,
            "recurrence-fed-status": false,
          },
        },
        {
          name: "purchase",
          derived: false,
          formula: null,
          "linked-from": null,
          "recurrent-check": {
            "is-recurrent": false,
            "recurrent-reference-indice": null,
            "recurrence-fed-status": false,
          },
        },
        {
          name: "opening-stock",
          derived: false,
          formula: null,
          "linked-from": null,
          "recurrent-check": {
            "is-recurrent": true,
            "recurrent-reference-indice": 4,
            "recurrence-fed-status": true,
          },
        },
        {
          name: "inward",
          derived: false,
          formula: null,
          "linked-from": null,
          "recurrent-check": {
            "is-recurrent": false,
            "recurrent-reference-indice": null,
            "recurrence-fed-status": false,
          },
        },
        {
          name: "outward",
          derived: false,
          formula: null,
          "linked-from": null,
          "recurrent-check": {
            "is-recurrent": false,
            "recurrent-reference-indice": null,
            "recurrence-fed-status": false,
          },
        },
        {
          name: "closing-stock",
          derived: true,
          formula: {
            "addition-indices": [1, 2],
            "subtraction-indices": [3],
          },
          "linked-from": null,
          "recurrent-check": {
            "is-recurrent": false,
            "recurrent-reference-indice": null,
            "recurrence-fed-status": false,
          },
        },
      ],
    },
    {
      "object-id": "507f1f77bcf86cd799439012",
      "sheet-name": "finished-goods",
      department: "Production",
      "last-modified": "2025-05-29T14:45:00Z",
      "modified-by": "Sarah Wilson",
      attributes: [
        {
          name: "date",
          derived: false,
          formula: null,
          "linked-from": null,
          "recurrent-check": {
            "is-recurrent": false,
            "recurrent-reference-indice": null,
            "recurrence-fed-status": false,
          },
        },
        {
          name: "raw-material-used",
          derived: false,
          formula: null,
          "linked-from": {
            "sheet-object-id": "sheet-meta-1",
            "attribute-indice": 3,
          },
          "recurrent-check": {
            "is-recurrent": false,
            "recurrent-reference-indice": null,
            "recurrence-fed-status": false,
          },
        },
        {
          name: "production",
          derived: false,
          formula: null,
          "linked-from": null,
          "recurrent-check": {
            "is-recurrent": false,
            "recurrent-reference-indice": null,
            "recurrence-fed-status": false,
          },
        },
        {
          name: "damaged",
          derived: false,
          formula: null,
          "linked-from": null,
          "recurrent-check": {
            "is-recurrent": false,
            "recurrent-reference-indice": null,
            "recurrence-fed-status": false,
          },
        },
        {
          name: "available-stock",
          derived: true,
          formula: {
            "addition-indices": [1],
            "subtraction-indices": [0, 2],
          },
          "linked-from": null,
          "recurrent-check": {
            "is-recurrent": false,
            "recurrent-reference-indice": null,
            "recurrence-fed-status": false,
          },
        },
      ],
    },
    {
      "object-id": "507f1f77bcf86cd799439013",
      "sheet-name": "unfinished-goods",
      department: "Production",
      "last-modified": "2025-05-29T14:45:00Z",
      "modified-by": "Sarah Wilson",
      attributes: [
        {
          name: "date",
          derived: false,
          formula: null,
          "linked-from": null,
          "recurrent-check": {
            "is-recurrent": false,
            "recurrent-reference-indice": null,
            "recurrence-fed-status": false,
          },
        },
        {
          name: "raw-material-used",
          derived: false,
          formula: null,
          "linked-from": {
            "sheet-object-id": "sheet-meta-1",
            "attribute-indice": 3,
          },
          "recurrent-check": {
            "is-recurrent": false,
            "recurrent-reference-indice": null,
            "recurrence-fed-status": false,
          },
        },
        {
          name: "production",
          derived: false,
          formula: null,
          "linked-from": null,
          "recurrent-check": {
            "is-recurrent": false,
            "recurrent-reference-indice": null,
            "recurrence-fed-status": false,
          },
        },
        {
          name: "damaged",
          derived: false,
          formula: null,
          "linked-from": null,
          "recurrent-check": {
            "is-recurrent": false,
            "recurrent-reference-indice": null,
            "recurrence-fed-status": false,
          },
        },
        {
          name: "available-stock",
          derived: true,
          formula: {
            "addition-indices": [1],
            "subtraction-indices": [0, 2],
          },
          "linked-from": null,
          "recurrent-check": {
            "is-recurrent": false,
            "recurrent-reference-indice": null,
            "recurrence-fed-status": false,
          },
        },
      ],
    },
  ];

  const sheetsData = {
    "507f1f77bcf86cd799439011": [
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [
          "1 May 2025",
          "2 May 2025",
          "3 May 2025",
          "4 May 2025",
          "5 May 2025",
          "6 May 2025",
          "7 May 2025",
          "8 May 2025",
          "9 May 2025",
          "10 May 2025",
          "11 May 2025",
          "12 May 2025",
          "13 May 2025",
          "14 May 2025",
          "15 May 2025",
          "16 May 2025",
          "17 May 2025",
          "18 May 2025",
          "19 May 2025",
          "20 May 2025",
          "21 May 2025",
          "22 May 2025",
          "23 May 2025",
          "24 May 2025",
          "25 May 2025",
          "26 May 2025",
          "27 May 2025",
          "28 May 2025",
          "29 May 2025",
          "30 May 2025",
          "31 May 2025",
        ],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [
          100, 200, 150, 120, 180, 110, 190, 160, 140, 170, 130, 210, 145, 125,
          185, 115, 195, 165, 135, 175, 155, 205, 175, 145, 165, 135, 155, 125,
          195, 123, 124,
        ],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [
          50, 70, 60, 45, 85, 55, 75, 65, 40, 80, 60, 90, 70, 50, 85, 45, 95,
          75, 55, 80, 65, 100, 80, 60, 75, 50, 70, 45, 90, 80, 85,
        ],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [
          20, 10, 15, 25, 30, 18, 12, 22, 28, 35, 25, 8, 20, 30, 15, 22, 10, 18,
          32, 12, 28, 5, 25, 35, 20, 30, 15, 25, 10, 18, 22, 30,
        ],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [
          30, 20, 25, 15, 35, 28, 22, 32, 18, 40, 30, 15, 25, 20, 30, 18, 25,
          35, 22, 28, 32, 12, 30, 40, 25, 35, 20, 30, 15, 25, 10, 18,
        ],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [
          30, 20, 25, 15, 35, 28, 22, 32, 18, 40, 30, 15, 25, 20, 30, 18, 25,
          35, 22, 28, 32, 12, 30, 40, 25, 35, 20, 30, 15, 25, 10, 18,
        ],
      },
    ],
    "507f1f77bcf86cd799439012": [
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [
          "1 May 2025",
          "2 May 2025",
          "3 May 2025",
          "4 May 2025",
          "5 May 2025",
        ],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [100, 200, 150, 120, 180],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [50, 70, 60, 45, 85],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [20, 10, 15, 25, 30],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [30, 60, 45, 20, 55], // calculated: production - raw-material-used - damaged
      },
    ],
    "507f1f77bcf86cd799439013": [
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: ["1 Jun 2025", "2 Jun 2025"],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [100, 100],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [20, 20],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [30, 30],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [10, 10], // calculated: production - raw-material-used - damaged
      },
    ],
  };

  const [rawMetadata, setRawMetadata] = useState(sampleMetadata);
  const [rawSheetsData, setRawSheetsData] = useState(sheetsData);
  const [processedData, setProcessedData] = useState([]);
  const [selectedSheetId, setSelectedSheetId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [modalData, setModalData] = useState({});
  const [isAdmin, setIsAdmin] = useState(true);
  const [showColumnTypeDropdown, setShowColumnTypeDropdown] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [columnType, setColumnType] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [hoveredColumn, setHoveredColumn] = useState(null);

  // Initialize processed data
  useEffect(() => {
    const processed = processSheetData(rawMetadata, rawSheetsData);
    setProcessedData(processed);
    if (processed.length > 0 && !selectedSheetId) {
      setSelectedSheetId(processed[0]["object-id"]);
    }
  }, [rawMetadata, rawSheetsData]);

  // Refresh data function - call this when you need to fetch fresh data
  const refreshData = async () => {
    try {
      // Replace these with your actual API calls
      // const metadataResponse = await fetch('/api/metadata');
      // const sheetsResponse = await fetch('/api/sheets');
      // const newMetadata = await metadataResponse.json();
      // const newSheetsData = await sheetsResponse.json();

      // For now, using existing data
      const processed = processSheetData(rawMetadata, rawSheetsData);
      setProcessedData(processed);

      console.log("Data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const currentSheet = processedData.find(
    (sheet) => sheet["object-id"] === selectedSheetId
  );

  const filteredSheets = processedData.filter((sheet) =>
    sheet["sheet-name"].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDropdownClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    setShowColumnTypeDropdown((prev) => !prev);
  };

  const checkTodaysData = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayFormatted = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (currentSheet && currentSheet.attributes.length > 0) {
      const dateAttribute = currentSheet.attributes[0];
      const hasToday = dateAttribute.data.some(
        (date) => date.includes(todayFormatted) || date.includes(today)
      );
      return hasToday;
    }
    return false;
  };

  const convertDateFormat = (dateString, isInputToDisplay = true) => {
    if (isInputToDisplay) {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } else {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    }
  };

  const isCurrentMonthSheet = (sheet) => {
    if (!sheet || !sheet.attributes || sheet.attributes.length === 0)
      return false;

    const dateAttribute = sheet.attributes[0];
    if (!dateAttribute.data || dateAttribute.data.length === 0) return false;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const latestDateStr = dateAttribute.data[dateAttribute.data.length - 1];
    const latestDate = new Date(latestDateStr);

    return (
      latestDate.getMonth() === currentMonth &&
      latestDate.getFullYear() === currentYear
    );
  };

  useEffect(() => {
    if (
      currentSheet &&
      isCurrentMonthSheet(currentSheet) &&
      !checkTodaysData()
    ) {
      setModalType("insert");
      setShowModal(true);
    }
  }, [selectedSheetId]);

  const getColumnType = (attribute) => {
    if (attribute.derived) return "derived";
    if (attribute["linked-from"]) return "referenced";
    return "normal";
  };

  const getColumnClass = (type) => {
    switch (type) {
      case "derived":
        return "bg-yellow-100 text-yellow-800";
      case "referenced":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-50";
    }
  };

  const handleRowClick = (rowIndex) => {
    setSelectedRowIndex(rowIndex);
    setModalType("update");

    const rowData = {};
    currentSheet.attributes.forEach((attr) => {
      rowData[attr.name] = attr.data[rowIndex] || "";
    });
    setModalData(rowData);
    setShowModal(true);
  };

  const updateRawData = (updatedSheet, modalType, rowIndex) => {
    // Convert processed data back to raw format for API calls
    const newRawSheetsData = { ...rawSheetsData };

    if (!newRawSheetsData[selectedSheetId]) {
      newRawSheetsData[selectedSheetId] = [];
    }

    // Update raw sheets data
    updatedSheet.attributes.forEach((attr, attrIndex) => {
      if (!newRawSheetsData[selectedSheetId][attrIndex]) {
        newRawSheetsData[selectedSheetId][attrIndex] = {
          "object-id": attr.objectId || "647f191e810c19729de860ea",
          "user-id": "07f1f77bcf86cd799439011",
          date: "2025-05-01T00:00:00Z",
          attributes: [],
        };
      }
      newRawSheetsData[selectedSheetId][attrIndex].attributes = [...attr.data];
    });

    // Update raw metadata if needed
    const newRawMetadata = rawMetadata.map((sheet) => {
      if (sheet["object-id"] === selectedSheetId) {
        return {
          ...sheet,
          attributes: updatedSheet.attributes.map((attr) => ({
            name: attr.name,
            derived: attr.derived,
            formula: attr.formula,
            "linked-from": attr["linked-from"],
            "recurrent-check": attr["recurrent-check"],
          })),
        };
      }
      return sheet;
    });

    setRawSheetsData(newRawSheetsData);
    setRawMetadata(newRawMetadata);

    // Prepare data for API calls
    const apiData = {
      modalType,
      rowIndex,
      sheetId: selectedSheetId,
      updatedMetadata: newRawMetadata.find(
        (sheet) => sheet["object-id"] === selectedSheetId
      ),
      updatedSheetData: newRawSheetsData[selectedSheetId],
      changedValues: modalData,
    };

    console.log("Data for API calls:", apiData);

    // Here you would make your API calls
    // await updateMetadataAPI(apiData.updatedMetadata);
    // await updateSheetDataAPI(apiData.updatedSheetData);
  };

  const handleModalSubmit = () => {
    let updatedSheet = { ...currentSheet };

    if (modalType === "insert") {
      // Add new data to each attribute
      updatedSheet.attributes.forEach((attr, attrIndex) => {
        const value = modalData[attr.name] || "";
        updatedSheet.attributes[attrIndex].data.push(value);
      });

      // Recalculate derived columns
      updatedSheet = calculateAllDerivedColumns(updatedSheet);
    } else if (modalType === "update" && selectedRowIndex !== null) {
      // Update existing values
      updatedSheet.attributes.forEach((attr, attrIndex) => {
        const value = modalData[attr.name];
        if (value !== undefined && !attr.derived) {
          updatedSheet.attributes[attrIndex].data[selectedRowIndex] = value;
        }
      });

      // Recalculate derived columns
      updatedSheet = calculateAllDerivedColumns(updatedSheet);
    }

    // Update processed data
    const newProcessedData = processedData.map((sheet) =>
      sheet["object-id"] === selectedSheetId ? updatedSheet : sheet
    );
    setProcessedData(newProcessedData);

    // Update raw data for API calls
    updateRawData(updatedSheet, modalType, selectedRowIndex);

    setShowModal(false);
    setModalData({});
    setSelectedRowIndex(null);
  };

  const handleInputChange = (fieldName, value) => {
    setModalData((prev) => {
      const isDateField = fieldName.toLowerCase() === "date";
      const processedValue =
        isDateField && modalType === "update"
          ? convertDateFormat(value, true)
          : value;

      return {
        ...prev,
        [fieldName]: processedValue,
      };
    });
  };

  const handleSaveColumnNew = (columnData) => {
    console.log("Saving new column:", columnData);
    const newAttribute = {
      name: columnData.name,
      derived: columnType === "derived",
      formula:
        columnType === "derived"
          ? {
              "addition-indices": columnData.additionIndices || [],
              "subtraction-indices": columnData.subtractionIndices || [],
            }
          : null,
      "linked-from": columnData.reference
        ? {
            "sheet-object-id": columnData.reference.sheetId,
            "attribute-indice": columnData.reference.columnIndex,
          }
        : null,
      "recurrent-check": {
        "is-recurrent": false,
        "recurrent-reference-indice": null,
        "recurrence-fed-status": false,
      },
      data: [],
      objectId: "647f191e810c19729de860ea",
      humanFormula: null,
    };

    console.log("New attribute to be added:", newAttribute);

    // Add human formula for derived columns
    if (columnType === "derived" && newAttribute.formula) {
      const additionTerms = (
        newAttribute.formula["addition-indices"] || []
      ).map((idx) => currentSheet.attributes[idx]?.name || `Column${idx}`);
      const subtractionTerms = (
        newAttribute.formula["subtraction-indices"] || []
      ).map((idx) => currentSheet.attributes[idx]?.name || `Column${idx}`);

      const parts = [];
      if (additionTerms.length > 0) {
        parts.push(additionTerms.join(" + "));
      }
      if (subtractionTerms.length > 0) {
        parts.push(" - " + subtractionTerms.join(" - "));
      }
      newAttribute.humanFormula = parts.join("");
    }

    // Calculate data for the new column
    const numRows = currentSheet.attributes[0]?.data.length || 0;
    if (columnType === "derived") {
      // Calculate derived values
      for (let i = 0; i < numRows; i++) {
        const calculatedValue = calculateDerivedValue(
          newAttribute.formula,
          currentSheet.attributes,
          i
        );
        newAttribute.data.push(calculatedValue);
      }
    } else {
      // Fill with empty values for independent columns
      newAttribute.data = new Array(numRows).fill("");
    }
    console.log("Calculated data for new attribute:", newAttribute.data);

    // Update processed data
    const updatedSheet = {
      ...currentSheet,
      attributes: [...currentSheet.attributes, newAttribute],
    };

    const newProcessedData = processedData.map((sheet) =>
      sheet["object-id"] === selectedSheetId ? updatedSheet : sheet
    );
    setProcessedData(newProcessedData);

    // Update raw data
    updateRawData(updatedSheet, "addColumn", null);
    console.log("Updated processed data:", newProcessedData);
    setShowColumnModal(false);
    setColumnType(null);
  };

  const renderFormulaTooltip = (attribute, columnIndex) => {
    console.log("Rendering formula tooltip for attribute:", attribute);
    if (!attribute.derived || !attribute.formula) return null;

    const additionIndices = attribute.formula["addition-indices"] || [];
    const subtractionIndices = attribute.formula["subtraction-indices"] || [];

    const additionTerms = additionIndices.map(
      (idx) => currentSheet.attributes[idx]?.name || `Column${idx}`
    );
    const subtractionTerms = subtractionIndices.map(
      (idx) => currentSheet.attributes[idx]?.name || `Column${idx}`
    );

    return (
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-black text-white text-xs rounded-lg shadow-lg z-50 whitespace-nowrap">
        <div className="font-semibold mb-1">Formula:</div>
        <div className="flex items-center gap-1 flex-wrap">
          {additionTerms.map((term, idx) => (
            <span
              key={`add-${idx}`}
              className="bg-green-600 px-2 py-1 rounded text-white font-medium"
            >
              {term.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          ))}
          {additionTerms.length > 0 && subtractionTerms.length > 0 && (
            <span className="text-gray-300 mx-1 font-bold">-</span>
          )}
          {subtractionTerms.map((term, idx) => (
            <span
              key={`sub-${idx}`}
              className="bg-red-600 px-2 py-1 rounded text-white font-medium"
            >
              {term.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          ))}
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
      </div>
    );
  };

  const renderTable = () => {
    if (!currentSheet) {
      return (
        <div className="p-8 text-center text-gray-500">No data available</div>
      );
    }

    let numRows = currentSheet.attributes[0]?.data.length || 0;
    let rows = [];

    if (numRows === 0) {
      numRows = 1;
      rows.push(currentSheet.attributes.map(() => ""));
    } else {
      for (let i = 0; i < numRows; i++) {
        const row = currentSheet.attributes.map((attr) => attr.data[i] || "");
        rows.push(row);
      }
    }

    // Add blank row at end
    const blankRow = currentSheet.attributes.map(() => "");
    rows.push(blankRow);
    numRows += 1;

    // Calculate totals row
    const totalsRow = currentSheet.attributes.map((attr) => {
      const columnType = getColumnType(attr);
      if (attr.name.toLowerCase() === "date") return "Total";

      if (columnType === "derived" || columnType === "normal") {
        let total = 0;
        for (let i = 0; i < numRows - 1; i++) {
          const value = attr.data[i] || 0;
          if (typeof value === "number") {
            total += value;
          }
        }
        return total;
      }
      return "";
    });

    return (
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex flex-row overflow-y-auto gap-2">
          <table className="table-auto w-max min-w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200 transition-all duration-200">
                {currentSheet.attributes.map((attr, index) => {
                  const columnType = getColumnType(attr);
                  const isHovered = hoveredColumn === index;
                  const isHighlighted =
                    hoveredColumn !== null &&
                    hoveredColumn !== index &&
                    currentSheet.attributes[hoveredColumn]?.derived;

                  let headerClass = getColumnClass(columnType);

                  // Apply highlighting when hovering over a derived column
                  if (isHighlighted) {
                    const hoveredAttr = currentSheet.attributes[hoveredColumn];
                    if (hoveredAttr?.formula) {
                      const additionIndices =
                        hoveredAttr.formula["addition-indices"] || [];
                      const subtractionIndices =
                        hoveredAttr.formula["subtraction-indices"] || [];

                      if (additionIndices.includes(index)) {
                        headerClass =
                          "bg-green-200 text-green-900";
                      } else if (subtractionIndices.includes(index)) {
                        headerClass =
                          "bg-red-200 text-red-900";
                      }
                    }
                  }

                  return (
                    <th
                      key={index}
                      className={`relative px-4 py-3 text-center text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${headerClass}`}
                      onMouseEnter={() => {
                        if (attr.derived) {
                          setHoveredColumn(index);
                        }
                      }}
                      onMouseLeave={() => setHoveredColumn(null)}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {attr.name
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                        {columnType === "derived" && (
                          <Info className="w-3 h-3 text-yellow-600" />
                        )}
                      </div>
                      {isHovered && renderFormulaTooltip(attr, index)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, rowIndex) => {
                const isBlankRow = rowIndex === rows.length - 1;
                return (
                  <tr
                    key={rowIndex}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      isBlankRow ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleRowClick(rowIndex)}
                  >
                    {row.map((cell, cellIndex) => {
                      const attr = currentSheet.attributes[cellIndex];
                      const columnType = getColumnType(attr);
                      const isDisabled =
                        (columnType === "derived" ||
                          columnType === "referenced") &&
                        !isBlankRow;

                      return (
                        <td
                          key={cellIndex}
                          className={`px-4 py-3 whitespace-nowrap text-sm ${
                            columnType === "derived"
                              ? "text-gray-950 flex items-center justify-center"
                              : columnType === "referenced"
                              ? "text-gray-950 flex items-center justify-center"
                              : "text-gray-900 font-medium text-center"
                          } ${isDisabled ? "opacity-75" : ""}`}
                        >
                          <div
                            className={`${
                              columnType === "derived" && !isBlankRow
                                ? "flex items-center justify-center w-30 flex-wrap bg-yellow-200 rounded-full px-3 py-2"
                                : columnType === "referenced" && !isBlankRow
                                ? "flex items-center justify-center w-30 flex-wrap bg-gray-200 rounded-full px-3 py-2"
                                : ""
                            }`}
                          >
                            {isBlankRow &&
                            (columnType === "derived" ||
                              columnType === "referenced")
                              ? "--"
                              : cell || (isBlankRow ? "Enter data..." : "")}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                {totalsRow.map((total, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 text-center"
                  >
                    {total}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          {isAdmin && (
            <div
              onClick={handleDropdownClick}
              className="flex rounded-[1rem] items-center justify-center cursor-pointer bg-gray-200 border-l border-gray-200 px-4 relative flex-shrink-0"
              style={{ minWidth: "150px" }}
            >
              <div className="absolute top-2 left-2">
                <div className="relative">
                  <button className="flex flex-row items-center justify-center text-sm text-gray-700 hover:text-blue-600">
                    <Plus className="w-5 h-5 mb-1" /> Add Attribute
                  </button>
                </div>
              </div>
              {showColumnTypeDropdown && (
                <div
                  className="absolute top-20 right-0 mt-2 w-40 bg-white shadow-lg rounded-md border border-gray-200 z-50"
                  style={{
                    left: dropdownPosition.x - 100,
                    top: dropdownPosition.y + 10,
                  }}
                >
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => {
                      setColumnType("independent");
                      setShowColumnModal(true);
                      setShowColumnTypeDropdown(false);
                    }}
                  >
                    Independent
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => {
                      setColumnType("derived");
                      setShowColumnModal(true);
                      setShowColumnTypeDropdown(false);
                    }}
                  >
                    Derived
                  </button>
                </div>
              )}
              <button className="flex flex-col items-center text-sm text-gray-700 hover:text-blue-600">
                <Plus className="w-5 h-5 mb-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal) return null;

    const getTodaysDate = () => {
      const today = new Date();
      return today.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    return (
      <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4">
          <h2 className="text-lg font-semibold mb-4">
            {modalType === "insert"
              ? "Values to be fed today"
              : "Update Row Values"}
          </h2>

          <div className="grid grid-cols-4 gap-4">
            {currentSheet.attributes.map((attr, index) => {
              const columnType = getColumnType(attr);
              const isDisabled =
                columnType === "derived" || columnType === "referenced";
              const isDateField = attr.name.toLowerCase() === "date";
              const shouldDisableDateInInsert =
                modalType === "insert" && isDateField;
              const finalDisabled = isDisabled || shouldDisableDateInInsert;

              let value = modalData[attr.name] || "";
              if (modalType === "insert" && isDateField && !value) {
                value = getTodaysDate();
              }

              return (
                <div key={index} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {attr.name
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    {columnType === "derived" && " ⭐"}
                    {columnType === "referenced" && " 🔗"}
                    {shouldDisableDateInInsert && " 📅"}
                  </label>
                  <input
                    type={
                      isDateField && modalType === "update" ? "date" : "text"
                    }
                    value={
                      isDateField && modalType === "update" && value
                        ? convertDateFormat(value, false)
                        : value
                    }
                    onChange={(e) =>
                      handleInputChange(attr.name, e.target.value)
                    }
                    disabled={finalDisabled}
                    placeholder={
                      shouldDisableDateInInsert
                        ? "Today's date (auto-filled)"
                        : "Enter..."
                    }
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${
                      columnType === "derived"
                        ? "bg-yellow-50 border-yellow-300"
                        : columnType === "referenced"
                        ? "bg-blue-50 border-blue-300 opacity-60"
                        : shouldDisableDateInInsert
                        ? "bg-gray-50 border-gray-300"
                        : "bg-white"
                    } ${finalDisabled ? "cursor-not-allowed opacity-75" : ""}`}
                  />
                  {columnType === "derived" && attr.humanFormula && (
                    <div className="text-xs text-gray-500">
                      Formula: {attr.humanFormula}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleModalSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-64" : "w-0"
          } transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Sheets</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshData}
                  className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                  title="Refresh Data"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Find..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm"
              />
            </div>

            <div className="space-y-1">
              {filteredSheets.map((sheet) => (
                <button
                  key={sheet["object-id"]}
                  onClick={() => setSelectedSheetId(sheet["object-id"])}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    selectedSheetId === sheet["object-id"]
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {sheet["sheet-name"]
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed left-4 top-20 z-10 bg-white shadow-md rounded-full p-2 border border-gray-200"
            >
              <ChevronRight size={20} />
            </button>
          )}

          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      {currentSheet?.["sheet-name"]
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      {currentSheet?.department} • Last modified:{" "}
                      {currentSheet?.["modified-by"]}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select className="border border-gray-200 rounded-md px-3 py-1.5 text-sm">
                      <option>Last 30 days</option>
                    </select>
                    <select className="border border-gray-200 rounded-md px-3 py-1.5 text-sm">
                      <option>Status</option>
                    </select>
                    <select className="border border-gray-200 rounded-md px-3 py-1.5 text-sm">
                      <option>Columns</option>
                    </select>
                    <button
                      onClick={refreshData}
                      className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden">{renderTable()}</div>
            </div>
          </div>
        </div>
      </div>

      {renderModal()}

      <ColumnCreationForm
        isOpen={showColumnModal}
        onClose={() => setShowColumnModal(false)}
        onSave={handleSaveColumnNew}
        type={columnType}
        sheets={processedData}
        currentSheetId={selectedSheetId}
      />
    </div>
  );
};

export default SheetManagement;
