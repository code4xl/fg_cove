import React, { useState, useEffect, useRef } from "react";
import { Search, X, Plus, ChevronRight, Info } from "lucide-react";
import { ColumnCreationForm, ColumnUpdateForm } from "./utils/Helper";
import { useSelector } from "react-redux";
import {
  fetchMetadata,
  getSheetsData,
  insertTodaysData,
  updateMetas,
  updateRowData,
} from "../../../services/repository/sheetsRepo";
import { selectAccount } from "../../../app/DashboardSlice";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { DynamicSubRows } from "./utils/SubRows";

// Updated data processing utilities for new format
const processSheetData = (metadata, sheetsData) => {
  return metadata.map((sheet) => {
    const sheetData = sheetsData[sheet["_id"]] || [];

    // Ensure sheetData is an array
    const validSheetData = Array.isArray(sheetData) ? sheetData : [];

    const processedAttributes = sheet.attributes.map((attr, index) => {
      // Extract attribute data from the new format
      const attributeData = validSheetData.map((row) => {
        // Check if row has attributes array and get the value at index
        if (row && row.attributes && Array.isArray(row.attributes)) {
          return row.attributes[index] !== undefined
            ? row.attributes[index]
            : "";
        }
        return "";
      });

      // Create human-readable formula for derived columns
      let humanFormula = null;
      if (attr.derived && attr.formula) {
        const additionTerms = (attr.formula["additionIndices"] || []).map(
          (idx) => sheet.attributes[idx]?.name || `Column${idx}`
        );
        const subtractionTerms = (attr.formula["subtractionIndices"] || []).map(
          (idx) => sheet.attributes[idx]?.name || `Column${idx}`
        );

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
        objectId: validSheetData[0]?.["_id"] || null,
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
  if (formula["additionIndices"]) {
    formula["additionIndices"].forEach((idx) => {
      const value = allAttributes[idx]?.data[rowIndex];
      if (typeof value === "number") {
        result += value;
      }
    });
  }

  // Subtract values from subtraction indices
  if (formula["subtractionIndices"]) {
    formula["subtractionIndices"].forEach((idx) => {
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

const InfoTooltip = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setButtonPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom, // Changed from rect.top to rect.bottom
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
        type="button"
      >
        <Info size={16} />
      </button>

      {showTooltip &&
        createPortal(
          <div
            className="fixed bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 w-80"
            style={{
              left: buttonPosition.x - 160, // Center the tooltip (320px / 2)
              top: buttonPosition.y + 8, // Position below the button with 8px gap
              zIndex: 9999999,
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className="font-medium mb-2 text-center">
              Column Type Color Guide
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded border"></div>
                <span className="flex-1">Independent</span>
                <span className="text-gray-300">Normal columns</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-300 rounded border"></div>
                <span className="flex-1 text-yellow-300">Derived</span>
                <span className="text-gray-300">
                  Calculated from other columns
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-300 rounded border"></div>
                <span className="flex-1 text-blue-300">Referenced</span>
                <span className="text-gray-300">Linked from other sheets</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-300 rounded border"></div>
                <span className="flex-1 text-purple-300">Recurrent</span>
                <span className="text-gray-300">
                  Values from previous period
                </span>
              </div>
            </div>

            <div className="border-t border-gray-700 mt-2 pt-2">
              <div className="text-center text-gray-400 text-xs">
                Hover over derived/recurrent columns to see relationships
              </div>
            </div>

            {/* Tooltip arrow pointing up (since tooltip is below button) */}
            <div
              className="absolute border-4 border-transparent border-b-gray-900"
              style={{
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            ></div>
          </div>,
          document.body
        )}
    </>
  );
};

// Main Application Component
const SheetManagement = () => {
  const account = useSelector(selectAccount);
  const navigate = useNavigate();

  const [timestampsData, setTimestampsData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const initialFetchRef = useRef(false);
  const currentFetchRef = useRef(null);

  const [rawMetadata, setRawMetadata] = useState([]);
  const [rawSheetsData, setRawSheetsData] = useState({});
  const [processedData, setProcessedData] = useState([]);
  const [selectedSheetId, setSelectedSheetId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [modalData, setModalData] = useState({});
  const [isAdmin, setIsAdmin] = useState(
    account?.role === "admin" ? true : false
  );
  const [showColumnTypeDropdown, setShowColumnTypeDropdown] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [columnType, setColumnType] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [hoveredColumn, setHoveredColumn] = useState(null);

  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  //column metas update
  const [showUpdateColumnModal, setShowUpdateColumnModal] = useState(false);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [showContextMenu, setShowContextMenu] = useState(false);

  //edit sheetname
  const [isEditingSheetName, setIsEditingSheetName] = useState(false);
  const [editingSheetName, setEditingSheetName] = useState("");

  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [addOnFieldName, setAddOnFieldName] = useState("");
  const [addOnValue, setAddOnValue] = useState("");
  const [addOnPosition, setAddOnPosition] = useState({ x: 0, y: 0 });

  const [previousMonthRecord, setPreviousMonthRecord] = useState(null);

  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showSubrowsModal, setShowSubrowsModal] = useState(false);
  const [currentSubrowsColumn, setCurrentSubrowsColumn] = useState(null);
  const [subrowsData, setSubrowsData] = useState({});

  const shouldProcessLastRow = (sheetData) => {
    if (!sheetData || sheetData.length === 0) return false;

    const lastRow = sheetData[sheetData.length - 1];
    return lastRow.attributes && lastRow.attributes[0] === "0";
  };

  const handleSheetNameDoubleClick = () => {
    console.log("name edit..");
    setIsEditingSheetName(true);
    setEditingSheetName(currentSheet?.sheetName || "");
  };

  const handleSheetNameSave = async () => {
    if (!editingSheetName.trim()) {
      setIsEditingSheetName(false);
      return;
    }

    try {
      // Get current sheet metadata and update only the sheet name
      const currentSheetMeta = rawMetadata.find(
        (sheet) => sheet["_id"] === selectedSheetId
      );
      const updatedSheetMeta = {
        ...currentSheetMeta,
        sheetName: editingSheetName.trim(),
        nameChange: true,
        formulaChange: [],
      };

      console.log("Updated sheet metadata with new name:", updatedSheetMeta);

      // Call the API to update metadata
      const response = await updateMetas(
        selectedSheetId,
        updatedSheetMeta,
        "nameChange"
      );

      if (response) {
        setIsEditingSheetName(false);
        setEditingSheetName("");

        // Refresh the page/data
        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating sheet name:", error);
      setIsEditingSheetName(false);
    }
  };

  const handleSheetNameCancel = () => {
    setIsEditingSheetName(false);
    setEditingSheetName("");
  };

  const handleSheetNameKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSheetNameSave();
    } else if (e.key === "Escape") {
      handleSheetNameCancel();
    }
  };

  const extractTimestamps = (sheetData) => {
    console.log("extract ts: ", sheetData);
    if (!sheetData) return [];

    return sheetData.map((row) => ({
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  };

  // Initialize metadata on component mount
  useEffect(() => {
    const initializeMetadata = async () => {
      // Prevent double calls
      if (initialFetchRef.current) return;
      initialFetchRef.current = true;

      try {
        setMetadataLoading(true);
        const fetchedMetadata = await fetchMetadata(account?.role || "user");
        console.log("Fetched metadata:", fetchedMetadata);
        setRawMetadata(fetchedMetadata || []);

        // Set first sheet as selected if available
        if (fetchedMetadata && fetchedMetadata.length > 0) {
          const firstSheetId = fetchedMetadata[0]["_id"];
          console.log("Setting first sheet ID:", firstSheetId);
          setSelectedSheetId(firstSheetId);
        }
      } catch (error) {
        console.error("Error initializing metadata:", error);
        setRawMetadata([]);
      } finally {
        setMetadataLoading(false);
      }
    };

    if (account && !initialFetchRef.current) {
      initializeMetadata();
    }
  }, [account]);

  useEffect(() => {
    if (selectedSheetId && rawMetadata.length > 0) {
      // Cancel previous fetch if still running
      if (currentFetchRef.current) {
        currentFetchRef.current = true; // Mark as cancelled
      }

      // Clear previous month record when changing sheets
      setPreviousMonthRecord(null);

      const fetchId = Date.now(); // Unique ID for this fetch
      currentFetchRef.current = fetchId;

      console.log("Year/Month changed, refetching data for:", selectedSheetId);

      const timeoutId = setTimeout(() => {
        // Only proceed if this is still the current fetch
        if (currentFetchRef.current === fetchId) {
          fetchSheetData(selectedSheetId);
        }
      }, 100); // Small delay to debounce rapid changes

      return () => {
        clearTimeout(timeoutId);
        if (currentFetchRef.current === fetchId) {
          currentFetchRef.current = null;
        }
      };
    }
  }, [selectedYear, selectedMonth, selectedSheetId, rawMetadata.length]);

  const fetchSheetData = async (sheetId) => {
    if (!sheetId) return;

    const fetchId = currentFetchRef.current;
    setLoading(true);

    try {
      console.log(
        `Fetching data for sheet: ${sheetId}, year: ${selectedYear}, month: ${selectedMonth}`
      );

      const sheetData = await getSheetsData(
        account?.role,
        sheetId,
        selectedYear,
        selectedMonth
      );

      // Check if this fetch was cancelled
      if (currentFetchRef.current !== fetchId) {
        console.log("Fetch cancelled, ignoring response");
        return;
      }

      console.log("Raw API response:", sheetData);

      // Validate that sheetData is an array
      let validData = Array.isArray(sheetData) ? sheetData : [];
      

      // Check for and store previous
      let previousMonthRec = null;

      if (validData.length > 0) {
        const firstRecord = validData[0];
        if (firstRecord?.attributes?.[0]) {
          const isFromPreviousMonth = isPreviousMonthRecord(
            firstRecord.attributes[0],
            selectedMonth,
            selectedYear
          );
          if (isFromPreviousMonth) {
            console.log(
              "Found and storing previous month record:",
              firstRecord
            );
            previousMonthRec = firstRecord;
            // Remove it from the data that will be stored in rawSheetsData
            validData = validData.slice(1);
          }
        }
      }

      // Store the previous month record in state
      setPreviousMonthRecord(previousMonthRec);

      console.log("Valid data to store (excluding previous month):", validData);

      // Process last row if it has date = "0"
      const wasUpdated = await processLastRowWithZeroDate(validData, sheetId);

      if (wasUpdated) {
        // For refresh, we'll call fetchSheetData again, so no need to duplicate logic here
        const refreshedSheetData = await getSheetsData(
          account?.role,
          sheetId,
          selectedYear,
          selectedMonth
        );

        if (currentFetchRef.current !== fetchId) {
          return;
        }

        setRawSheetsData((prev) => ({
          ...prev,
          [sheetId]: refreshedValidData,
        }));
        setTimestampsData(extractTimestamps(refreshedValidData));
      } else {
        setRawSheetsData((prev) => ({
          ...prev,
          [sheetId]: validData,
        }));
        setTimestampsData(extractTimestamps(validData));
      }
    } catch (error) {
      if (currentFetchRef.current === fetchId) {
        console.error("Error fetching sheet data:", error);
        setRawSheetsData((prev) => ({
          ...prev,
          [sheetId]: [],
        }));
        setPreviousMonthRecord(null);
      }
    } finally {
      if (currentFetchRef.current === fetchId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (selectedSheetId && rawMetadata && rawMetadata.length > 0) {
      if (rawSheetsData[selectedSheetId]) {
        // Data exists, process it
        console.log("Processing data with existing sheet data");
        const processed = processSheetData(rawMetadata, rawSheetsData);
        console.log("Final processed data:", processed);
        setProcessedData(processed);
      }
      // Note: We don't fetch here anymore, the other useEffect handles fetching
    }
  }, [selectedSheetId, rawSheetsData, rawMetadata]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close column type dropdown when clicking outside
      if (
        showColumnTypeDropdown &&
        !event.target.closest(".column-dropdown-container")
      ) {
        setShowColumnTypeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColumnTypeDropdown]);

  // Refresh data function
  const refreshData = async () => {
    try {
      setLoading(true);

      // Reset fetch tracking
      initialFetchRef.current = false;
      currentFetchRef.current = null;

      // Clear previous month record
      setPreviousMonthRecord(null);
      setSubrowsData({});

      // Refresh metadata
      const freshMetadata = await fetchMetadata(account?.role || "user");
      setRawMetadata(freshMetadata || []);

      // Refresh current sheet data with selected year/month
      if (selectedSheetId) {
        await fetchSheetData(selectedSheetId);
      }

      console.log("Data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentSheet = processedData.find(
    (sheet) => sheet["_id"] === selectedSheetId
  );

  const filteredSheets = processedData.filter((sheet) =>
    sheet["sheetName"].toLowerCase().includes(searchTerm.toLowerCase())
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
      // console.log("Checking today's data in attribute:", dateAttribute);
      const hasToday = dateAttribute.data.some(
        (date) => date.includes(todayFormatted) || date.includes(today)
      );
      return hasToday;
    }
    return false;
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

  const convertDateFormat = (dateString, isInputToDisplay = true) => {
    if (isInputToDisplay) {
      // Convert yyyy-mm-dd to display format (dd MMM yyyy)
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } else {
      // Convert display format to yyyy-mm-dd
      try {
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      } catch (error) {
        console.error("Error converting date:", error);
        return new Date().toISOString().split("T")[0]; // Fallback to today
      }
    }
  };

  useEffect(() => {
    // Check if data is loaded and we have a current sheet
    if (currentSheet && processedData.length > 0) {
      const sheet = rawSheetsData[selectedSheetId];

      // Extract and store timestamps when sheet is selected
      if (sheet) {
        const timestamps = extractTimestamps(sheet);
        console.log("Extracted ts ue:", timestamps);
        setTimestampsData(timestamps);
      }
      // Check if it's current month sheet and today's data is missing
      if (
        currentSheet &&
        isCurrentMonthSheet(currentSheet) &&
        !checkTodaysData()
      ) {
        setModalType("insert");
        setShowModal(true);
      }
    }
  }, [currentSheet, processedData, selectedSheetId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showContextMenu]);

  useEffect(() => {
    if (currentSheet && currentSheet.attributes) {
      // Force a re-render when sheet data changes to recalculate derived values
      const derivedColumns = currentSheet.attributes.filter(
        (attr) => attr.derived
      );
      if (derivedColumns.length > 0) {
        console.log(
          "Recalculating derived columns:",
          derivedColumns.map((col) => col.name)
        );
      }
    }
  }, [currentSheet, rawSheetsData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAddOnModal && !event.target.closest(".fixed")) {
        setShowAddOnModal(false);
        setAddOnFieldName("");
        setAddOnValue("");
      }
    };

    if (showAddOnModal) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showAddOnModal]);

  const getColumnType = (attribute) => {
    if (attribute.derived) return "derived";
    if (
      attribute["linkedFrom"] &&
      attribute["linkedFrom"].sheetObjectId != null
    )
      return "referenced";
    if (attribute.recurrentCheck && attribute.recurrentCheck.isRecurrent)
      return "recurrent";
    return "normal";
  };

  const getColumnClass = (type) => {
    switch (type) {
      case "derived":
        return "bg-yellow-100 text-yellow-800";
      case "referenced":
        return "bg-blue-100 text-blue-800";
      case "recurrent":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-50";
    }
  };

  const handleRowClick = (rowIndex) => {
    // Only handle clicks on existing data rows (not the blank row)
    const numRows = currentSheet.attributes[0]?.data.length || 0;
    if (rowIndex >= numRows) return;

    setSelectedRowIndex(rowIndex);
    setModalType("update");

    console.log("Row clicked:", rowIndex);

    const rowData = {};

    currentSheet.attributes.forEach((attr, cellIndex) => {
      const columnType = getColumnType(attr);

      if (columnType === "recurrent") {
        if (attr.recurrentCheck?.recurrenceFeedStatus) {
          rowData[attr.name] = calculateRecurrentValue(
            attr,
            cellIndex,
            rowIndex
          );
        } else {
          const storedValue = attr.data[rowIndex] || "";
          if (!storedValue) {
            rowData[attr.name] = getRecurrentValueForDisplay(attr);
          } else {
            rowData[attr.name] = storedValue;
          }
        }
      } else {
        rowData[attr.name] = attr.data[rowIndex] || "";
      }
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

    // For the new format, we need to restructure the data
    const maxRows = Math.max(
      ...updatedSheet.attributes.map((attr) => attr.data.length)
    );

    const newSheetData = [];
    for (let i = 0; i < maxRows; i++) {
      const rowAttributes = updatedSheet.attributes.map(
        (attr) => attr.data[i] || ""
      );
      newSheetData.push({
        _id: newRawSheetsData[selectedSheetId][i]?._id || `temp-${i}`,
        attributes: rowAttributes,
      });
    }

    newRawSheetsData[selectedSheetId] = newSheetData;

    // Update raw metadata if needed
    const newRawMetadata = rawMetadata.map((sheet) => {
      if (sheet["_id"] === selectedSheetId) {
        return {
          ...sheet,
          attributes: updatedSheet.attributes.map((attr) => ({
            name: attr.name,
            derived: attr.derived,
            formula: attr.formula,
            linkedFrom: attr["linkedFrom"],
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
        (sheet) => sheet["_id"] === selectedSheetId
      ),
      updatedSheetData: newRawSheetsData[selectedSheetId],
      changedValues: modalData,
    };

    console.log("Data for API calls:", apiData);
  };

  // const handleModalSubmit = async () => {
  //   let updatedSheet = { ...currentSheet };
  //   let needsMetadataUpdate = false;
  //   let updatedAttributes = [];

  //   if (modalType === "insert") {
  //     // Create new insert array with same length as attributes, initially filled with 0
  //     const newInsertArray = new Array(currentSheet.attributes.length).fill(0);

  //     // Set today's date in the first position
  //     const selectedDate = modalData[currentSheet.attributes[0].name];
  //     newInsertArray[0] = selectedDate || getTodaysDate();

  //     // Get current sheet data for recurrent value calculations
  //     const currentSheetData = rawSheetsData[selectedSheetId] || [];

  //     // Place values from modalData into correct positions based on attribute names
  //     currentSheet.attributes.forEach((attribute, attributeIndex) => {
  //       const fieldName = attribute.name;

  //       // Skip date field (already set) and derived fields
  //       if (attributeIndex === 0 || attribute.derived) {
  //         return;
  //       }

  //       const isRecurrentColumn = attribute.recurrentCheck?.isRecurrent;
  //       const isRecurrentEditable =
  //         isRecurrentColumn && !attribute.recurrentCheck?.recurrenceFedStatus;
  //       const isRecurrentWithFeedStatus =
  //         isRecurrentColumn && attribute.recurrentCheck?.recurrenceFedStatus;

  //       if (isRecurrentWithFeedStatus) {
  //         // For recurrent columns with feedStatus true, use the value from modalData
  //         // (which was auto-populated from previous month or modified by add-on)
  //         const value = modalData[fieldName];
  //         if (value !== undefined && value !== "") {
  //           const processedValue =
  //             !isNaN(value) && value !== "" ? Number(value) : 0;
  //           newInsertArray[attributeIndex] = processedValue;
  //         } else {
  //           // Fallback to getting the value directly from previous month
  //           const autoValue = getRecurrentValueFromPreviousMonth(
  //             attribute,
  //             currentSheetData
  //           );
  //           newInsertArray[attributeIndex] =
  //             !isNaN(autoValue) && autoValue !== "" ? Number(autoValue) : 0;
  //         }
  //       } else if (isRecurrentEditable) {
  //         // For recurrent columns with feedStatus false, use user input
  //         const value = modalData[fieldName];
  //         if (value !== undefined && value !== "") {
  //           const processedValue =
  //             !isNaN(value) && value !== "" ? Number(value) : 0;
  //           newInsertArray[attributeIndex] = processedValue;
  //           needsMetadataUpdate = true; // Will update feedStatus to true
  //         }
  //       } else if (!attribute.linkedFrom?.sheetObjectId) {
  //         // For normal columns, use user input
  //         const value = modalData[fieldName];
  //         if (value !== undefined && value !== "") {
  //           const processedValue =
  //             !isNaN(value) && value !== "" ? Number(value) : value;
  //           newInsertArray[attributeIndex] = processedValue;
  //         }
  //       }
  //     });

  //     // Calculate derived columns for the new row
  //     currentSheet.attributes.forEach((attr, attrIndex) => {
  //       if (attr.derived && attr.formula) {
  //         let calculatedValue = 0;

  //         if (
  //           attr.formula.additionIndices &&
  //           attr.formula.additionIndices.length > 0
  //         ) {
  //           attr.formula.additionIndices.forEach((idx) => {
  //             const value = newInsertArray[idx];
  //             if (typeof value === "number") {
  //               calculatedValue += value;
  //             }
  //           });
  //         }

  //         if (
  //           attr.formula.subtractionIndices &&
  //           attr.formula.subtractionIndices.length > 0
  //         ) {
  //           attr.formula.subtractionIndices.forEach((idx) => {
  //             const value = newInsertArray[idx];
  //             if (typeof value === "number") {
  //               calculatedValue -= value;
  //             }
  //           });
  //         }

  //         newInsertArray[attrIndex] = calculatedValue;
  //       }
  //     });

  //     console.log("New insert array:", newInsertArray);

  //     // Add the new row to each attribute's data array
  //     updatedSheet.attributes.forEach((attr, attrIndex) => {
  //       updatedSheet.attributes[attrIndex].data.push(newInsertArray[attrIndex]);
  //     });

  //     // Update processed data locally
  //     const newProcessedData = processedData.map((sheet) =>
  //       sheet["_id"] === selectedSheetId ? updatedSheet : sheet
  //     );
  //     setProcessedData(newProcessedData);
  //     const displayDate = newInsertArray[0];
  //     const apiDate = convertDateFormat(displayDate, false);
  //     // Call API with the new insert array
  //     await insertTodaysData(
  //       selectedSheetId,
  //       newInsertArray,
  //       apiDate
  //     );
  //   } else if (modalType === "update" && selectedRowIndex !== null) {
  //     // Create updated row array with same length as attributes
  //     const updatedRowArray = [
  //       ...updatedSheet.attributes.map(
  //         (attr, attrIndex) => attr.data[selectedRowIndex]
  //       ),
  //     ];
  //     console.log("Updated row array:", updatedRowArray);

  //     // Place values from modalData into correct positions based on attribute names
  //     Object.keys(modalData).forEach((fieldName) => {
  //       const attributeIndex = currentSheet.attributes.findIndex(
  //         (attr) => attr.name === fieldName
  //       );

  //       if (attributeIndex !== -1) {
  //         const attribute = currentSheet.attributes[attributeIndex];

  //         // For recurrent columns, ALWAYS use the value from modalData (which includes add-on values)
  //         const isRecurrentColumn = attribute.recurrentCheck?.isRecurrent;
  //         const isRecurrentEditable =
  //           isRecurrentColumn && !attribute.recurrentCheck?.recurrenceFedStatus;

  //         if (
  //           !attribute.derived &&
  //           !attribute.linkedFrom?.sheetObjectId &&
  //           (isRecurrentEditable ||
  //             !isRecurrentColumn ||
  //             (isRecurrentColumn && modalData[fieldName] !== ""))
  //         ) {
  //           const value = modalData[fieldName];
  //           const processedValue =
  //             attributeIndex !== 0 && !isNaN(value) && value !== ""
  //               ? Number(value)
  //               : value;
  //           updatedRowArray[attributeIndex] = processedValue;

  //           // Check if we need to update recurrenceFedStatus
  //           if (isRecurrentEditable && value && value !== "") {
  //             needsMetadataUpdate = true;
  //           }
  //         }
  //         // For recurrent columns with feedStatus true, use modalData value if it exists (from add-on)
  //         else if (
  //           isRecurrentColumn &&
  //           attribute.recurrentCheck?.recurrenceFedStatus &&
  //           modalData[fieldName] !== undefined &&
  //           modalData[fieldName] !== ""
  //         ) {
  //           const value = modalData[fieldName];
  //           const processedValue =
  //             !isNaN(value) && value !== "" ? Number(value) : value;
  //           updatedRowArray[attributeIndex] = processedValue;
  //         }
  //         // Keep existing value if no modalData value for locked recurrent columns
  //         // (this handles the case where user didn't use add-on functionality)
  //       }
  //     });

  //     // Calculate derived columns for the updated row
  //     currentSheet.attributes.forEach((attr, attrIndex) => {
  //       if (attr.derived && attr.formula) {
  //         let calculatedValue = 0;

  //         if (
  //           attr.formula.additionIndices &&
  //           attr.formula.additionIndices.length > 0
  //         ) {
  //           attr.formula.additionIndices.forEach((idx) => {
  //             const value = updatedRowArray[idx];
  //             if (typeof value === "number") {
  //               calculatedValue += value;
  //             }
  //           });
  //         }

  //         if (
  //           attr.formula.subtractionIndices &&
  //           attr.formula.subtractionIndices.length > 0
  //         ) {
  //           attr.formula.subtractionIndices.forEach((idx) => {
  //             const value = updatedRowArray[idx];
  //             if (typeof value === "number") {
  //               calculatedValue -= value;
  //             }
  //           });
  //         }

  //         updatedRowArray[attrIndex] = calculatedValue;
  //       }
  //     });

  //     console.log("Updated row array:", updatedRowArray);

  //     // Update the specific row in the processed sheet
  //     updatedSheet.attributes.forEach((attr, attrIndex) => {
  //       updatedSheet.attributes[attrIndex].data[selectedRowIndex] =
  //         updatedRowArray[attrIndex];
  //     });

  //     // Update processed data locally
  //     const newProcessedData = processedData.map((sheet) =>
  //       sheet["_id"] === selectedSheetId ? updatedSheet : sheet
  //     );
  //     setProcessedData(newProcessedData);

  //     const targetDate = timestampsData[selectedRowIndex]?.createdAt;
  //     console.log(targetDate);

  //     // Call API with the updated row array and row index
  //     await updateRowData(selectedSheetId, {
  //       rowIndex: selectedRowIndex,
  //       attributes: updatedRowArray,
  //       targetDate: targetDate,
  //     });
  //   }

  //   // Update metadata if recurrenceFedStatus needs to be changed
  //   if (needsMetadataUpdate) {
  //     const currentSheetMeta = rawMetadata.find(
  //       (sheet) => sheet["_id"] === selectedSheetId
  //     );

  //     if (currentSheetMeta) {
  //       const updatedAttributes = currentSheetMeta.attributes.map((attr) => {
  //         // Update recurrenceFedStatus to true for recurrent columns that had input
  //         if (
  //           attr.recurrentCheck?.isRecurrent &&
  //           !attr.recurrentCheck?.recurrenceFedStatus
  //         ) {
  //           const fieldHasInput =
  //             modalData[attr.name] && modalData[attr.name] !== "";
  //           if (fieldHasInput) {
  //             return {
  //               ...attr,
  //               recurrentCheck: {
  //                 ...attr.recurrentCheck,
  //                 recurrenceFedStatus: true,
  //               },
  //             };
  //           }
  //         }
  //         return attr;
  //       });

  //       const updatedSheetMeta = {
  //         ...currentSheetMeta,
  //         attributes: updatedAttributes,
  //         formulaChange: [],
  //         nameChange: false,
  //       };

  //       try {
  //         console.log(
  //           "Updating metadata for recurrenceFedStatus:",
  //           updatedSheetMeta
  //         );
  //         await updateMetas(selectedSheetId, updatedSheetMeta, "formulaUpdate");
  //       } catch (error) {
  //         console.error("Error updating recurrenceFedStatus:", error);
  //       }
  //     }
  //   }

  //   setShowModal(false);
  //   setModalData({});
  //   setSelectedRowIndex(null);
  // };

  const handleModalSubmit = async () => {
    // Check if any column requires subrows input BEFORE processing
    const subrowsColumns = currentSheet.attributes.filter(attr => shouldOpenSubrowsModal(attr));
    
    if (subrowsColumns.length > 0) {
      // Check if we need to collect subrows data
      for (const attr of subrowsColumns) {
        const hasMainValue = modalData[attr.name] && parseFloat(modalData[attr.name]) > 0;
        const existingSubrows = getExistingSubrowsData(attr.name, selectedRowIndex);
        const hasSubrowsData = subrowsData[attr.name] && subrowsData[attr.name].length > 0;
        
        // If main value is provided but no subrows data exists, open modal
        if (hasMainValue && existingSubrows.length === 0 && !hasSubrowsData) {
          setCurrentSubrowsColumn(attr);
          setShowSubrowsModal(true);
          return; // Stop execution and wait for subrows input
        }
      }
    }

    let updatedSheet = { ...currentSheet };
    let needsMetadataUpdate = false;
    let updatedAttributes = [];

    if (modalType === "insert") {
      // Create new insert array with same length as attributes, initially filled with 0
      const newInsertArray = new Array(currentSheet.attributes.length).fill(0);

      // Set today's date in the first position
      const selectedDate = modalData[currentSheet.attributes[0].name];
      newInsertArray[0] = selectedDate || getTodaysDate();

      // Get current sheet data for recurrent value calculations
      const currentSheetData = rawSheetsData[selectedSheetId] || [];

      // Place values from modalData into correct positions based on attribute names
      currentSheet.attributes.forEach((attribute, attributeIndex) => {
        const fieldName = attribute.name;

        // Skip date field (already set) and derived fields
        if (attributeIndex === 0 || attribute.derived) {
          return;
        }

        const isRecurrentColumn = attribute.recurrentCheck?.isRecurrent;
        const isRecurrentEditable =
          isRecurrentColumn && !attribute.recurrentCheck?.recurrenceFedStatus;
        const isRecurrentWithFeedStatus =
          isRecurrentColumn && attribute.recurrentCheck?.recurrenceFedStatus;

        if (isRecurrentWithFeedStatus) {
          // For recurrent columns with feedStatus true, use the value from modalData
          // (which was auto-populated from previous month or modified by add-on)
          const value = modalData[fieldName];
          if (value !== undefined && value !== "") {
            const processedValue =
              !isNaN(value) && value !== "" ? Number(value) : 0;
            newInsertArray[attributeIndex] = processedValue;
          } else {
            // Fallback to getting the value directly from previous month
            const autoValue = getRecurrentValueFromPreviousMonth(
              attribute,
              currentSheetData
            );
            newInsertArray[attributeIndex] =
              !isNaN(autoValue) && autoValue !== "" ? Number(autoValue) : 0;
          }
        } else if (isRecurrentEditable) {
          // For recurrent columns with feedStatus false, use user input
          const value = modalData[fieldName];
          if (value !== undefined && value !== "") {
            const processedValue =
              !isNaN(value) && value !== "" ? Number(value) : 0;
            newInsertArray[attributeIndex] = processedValue;
            needsMetadataUpdate = true; // Will update feedStatus to true
          }
        } else if (!attribute.linkedFrom?.sheetObjectId) {
          // For normal columns, use user input
          const value = modalData[fieldName];
          if (value !== undefined && value !== "") {
            const processedValue =
              !isNaN(value) && value !== "" ? Number(value) : value;
            newInsertArray[attributeIndex] = processedValue;
          }
        }
      });

      // Calculate derived columns for the new row
      currentSheet.attributes.forEach((attr, attrIndex) => {
        if (attr.derived && attr.formula) {
          let calculatedValue = 0;

          if (
            attr.formula.additionIndices &&
            attr.formula.additionIndices.length > 0
          ) {
            attr.formula.additionIndices.forEach((idx) => {
              const value = newInsertArray[idx];
              if (typeof value === "number") {
                calculatedValue += value;
              }
            });
          }

          if (
            attr.formula.subtractionIndices &&
            attr.formula.subtractionIndices.length > 0
          ) {
            attr.formula.subtractionIndices.forEach((idx) => {
              const value = newInsertArray[idx];
              if (typeof value === "number") {
                calculatedValue -= value;
              }
            });
          }

          newInsertArray[attrIndex] = calculatedValue;
        }
      });

      console.log("New insert array:", newInsertArray);

      // Add the new row to each attribute's data array
      updatedSheet.attributes.forEach((attr, attrIndex) => {
        updatedSheet.attributes[attrIndex].data.push(newInsertArray[attrIndex]);
      });

      // Update processed data locally
      const newProcessedData = processedData.map((sheet) =>
        sheet["_id"] === selectedSheetId ? updatedSheet : sheet
      );
      setProcessedData(newProcessedData);
      
      const displayDate = newInsertArray[0];
      const apiDate = convertDateFormat(displayDate, false);

      // Prepare subrows data for API
      const subrowsForAPI = {};
      
      // Collect subrows data for columns that have it
      currentSheet.attributes.forEach((attr, attrIndex) => {
        if (shouldOpenSubrowsModal(attr) && subrowsData[attr.name]) {
          subrowsForAPI[attrIndex.toString()] = subrowsData[attr.name];
        }
      });

      // Call API with the new insert array and subrows
      await insertTodaysData(
        selectedSheetId,
        newInsertArray,
        apiDate,
        subrowsForAPI
      );

    } else if (modalType === "update" && selectedRowIndex !== null) {
      // Create updated row array with same length as attributes
      const updatedRowArray = [
        ...updatedSheet.attributes.map(
          (attr, attrIndex) => attr.data[selectedRowIndex]
        ),
      ];
      console.log("Updated row array:", updatedRowArray);

      // Place values from modalData into correct positions based on attribute names
      Object.keys(modalData).forEach((fieldName) => {
        const attributeIndex = currentSheet.attributes.findIndex(
          (attr) => attr.name === fieldName
        );

        if (attributeIndex !== -1) {
          const attribute = currentSheet.attributes[attributeIndex];

          // For recurrent columns, ALWAYS use the value from modalData (which includes add-on values)
          const isRecurrentColumn = attribute.recurrentCheck?.isRecurrent;
          const isRecurrentEditable =
            isRecurrentColumn && !attribute.recurrentCheck?.recurrenceFedStatus;

          if (
            !attribute.derived &&
            !attribute.linkedFrom?.sheetObjectId &&
            (isRecurrentEditable ||
              !isRecurrentColumn ||
              (isRecurrentColumn && modalData[fieldName] !== ""))
          ) {
            const value = modalData[fieldName];
            const processedValue =
              attributeIndex !== 0 && !isNaN(value) && value !== ""
                ? Number(value)
                : value;
            updatedRowArray[attributeIndex] = processedValue;

            // Check if we need to update recurrenceFedStatus
            if (isRecurrentEditable && value && value !== "") {
              needsMetadataUpdate = true;
            }
          }
          // For recurrent columns with feedStatus true, use modalData value if it exists (from add-on)
          else if (
            isRecurrentColumn &&
            attribute.recurrentCheck?.recurrenceFedStatus &&
            modalData[fieldName] !== undefined &&
            modalData[fieldName] !== ""
          ) {
            const value = modalData[fieldName];
            const processedValue =
              !isNaN(value) && value !== "" ? Number(value) : value;
            updatedRowArray[attributeIndex] = processedValue;
          }
          // Keep existing value if no modalData value for locked recurrent columns
          // (this handles the case where user didn't use add-on functionality)
        }
      });

      // Calculate derived columns for the updated row
      currentSheet.attributes.forEach((attr, attrIndex) => {
        if (attr.derived && attr.formula) {
          let calculatedValue = 0;

          if (
            attr.formula.additionIndices &&
            attr.formula.additionIndices.length > 0
          ) {
            attr.formula.additionIndices.forEach((idx) => {
              const value = updatedRowArray[idx];
              if (typeof value === "number") {
                calculatedValue += value;
              }
            });
          }

          if (
            attr.formula.subtractionIndices &&
            attr.formula.subtractionIndices.length > 0
          ) {
            attr.formula.subtractionIndices.forEach((idx) => {
              const value = updatedRowArray[idx];
              if (typeof value === "number") {
                calculatedValue -= value;
              }
            });
          }

          updatedRowArray[attrIndex] = calculatedValue;
        }
      });

      console.log("Updated row array:", updatedRowArray);

      // Update the specific row in the processed sheet
      updatedSheet.attributes.forEach((attr, attrIndex) => {
        updatedSheet.attributes[attrIndex].data[selectedRowIndex] =
          updatedRowArray[attrIndex];
      });

      // Update processed data locally
      const newProcessedData = processedData.map((sheet) =>
        sheet["_id"] === selectedSheetId ? updatedSheet : sheet
      );
      setProcessedData(newProcessedData);

      const targetDate = timestampsData[selectedRowIndex]?.createdAt;
      console.log(targetDate);

      // Prepare subrows data for update API
      const subrowsForAPI = {};
      
      // Collect subrows data - prioritize modified data, fallback to existing data
      currentSheet.attributes.forEach((attr, attrIndex) => {
        if (shouldOpenSubrowsModal(attr)) {
          // CRITICAL FIX: Always prioritize modified subrows data if it exists
          if (subrowsData[attr.name] && subrowsData[attr.name].length > 0) {
            // User has modified subrows - use the modified data
            subrowsForAPI[attrIndex.toString()] = subrowsData[attr.name];
          } else {
            // No modifications - use existing data from API
            const existingSubrows = getExistingSubrowsData(attr.name, selectedRowIndex);
            if (existingSubrows.length > 0) {
              subrowsForAPI[attrIndex.toString()] = existingSubrows;
            }
          }
        }
      });

      // Call API with the updated row array, row index, and subrows
      await updateRowData(selectedSheetId, {
        rowIndex: selectedRowIndex,
        attributes: updatedRowArray,
        targetDate: targetDate,
        subrows: subrowsForAPI // Pass subrows data to API
      });
    }

    // Update metadata if recurrenceFedStatus needs to be changed
    if (needsMetadataUpdate) {
      const currentSheetMeta = rawMetadata.find(
        (sheet) => sheet["_id"] === selectedSheetId
      );

      if (currentSheetMeta) {
        const updatedAttributes = currentSheetMeta.attributes.map((attr) => {
          // Update recurrenceFedStatus to true for recurrent columns that had input
          if (
            attr.recurrentCheck?.isRecurrent &&
            !attr.recurrentCheck?.recurrenceFedStatus
          ) {
            const fieldHasInput =
              modalData[attr.name] && modalData[attr.name] !== "";
            if (fieldHasInput) {
              return {
                ...attr,
                recurrentCheck: {
                  ...attr.recurrentCheck,
                  recurrenceFedStatus: true,
                },
              };
            }
          }
          return attr;
        });

        const updatedSheetMeta = {
          ...currentSheetMeta,
          attributes: updatedAttributes,
          formulaChange: [],
          nameChange: false,
        };

        try {
          console.log(
            "Updating metadata for recurrenceFedStatus:",
            updatedSheetMeta
          );
          await updateMetas(selectedSheetId, updatedSheetMeta, "formulaUpdate");
        } catch (error) {
          console.error("Error updating recurrenceFedStatus:", error);
        }
      }
    }

    // Clear subrows data after successful save
    setSubrowsData({});
    setShowModal(false);
    setModalData({});
    setSelectedRowIndex(null);
  };
  // const handleInputChange = (fieldName, value) => {
  //   // Find the attribute to check its type
  //   const attribute = currentSheet.attributes.find(
  //     (attr) => attr.name === fieldName
  //   );

  //   // Check if this is a date field or derived field
  //   const isDateField =
  //     fieldName.toLowerCase() === "date" ||
  //     (attribute && currentSheet.attributes.indexOf(attribute) === 0);
  //   const isDerivedField = attribute?.derived;
  //   const isReferencedField = attribute?.linkedFrom?.sheetObjectId;
  //   const isRecurrentField = attribute?.recurrentCheck?.isRecurrent;
  //   const isRecurrentEditable =
  //     isRecurrentField && !attribute?.recurrentCheck?.recurrenceFedStatus;

  //   // Always update modal data first
  //   setModalData((prev) => ({
  //     ...prev,
  //     [fieldName]: value,
  //   }));

  //   // Check if this field requires subrows and has a significant value
  //   if (shouldOpenSubrowsModal(attribute) && value && parseFloat(value) > 0) {
  //     // Check if we already have subrows data for this field
  //     const existingSubrows = getExistingSubrowsData(fieldName, selectedRowIndex);
  //     const hasModifiedSubrows = subrowsData[fieldName] && subrowsData[fieldName].length > 0;
      
  //     // Only auto-open if no existing data and user hasn't manually entered subrows
  //     if (existingSubrows.length === 0 && !hasModifiedSubrows) {
  //       // Small delay to let user finish typing before opening modal
  //       setTimeout(() => {
  //         if (modalData[fieldName] && parseFloat(modalData[fieldName]) > 0) {
  //           setCurrentSubrowsColumn(attribute);
  //           setShowSubrowsModal(true);
  //         }
  //       }, 1500); // 1.5 second delay
  //     }
  //   }

  //   // Skip further validation for special fields (they're already updated above)
  //   if (
  //     isDateField ||
  //     isDerivedField ||
  //     isReferencedField ||
  //     (isRecurrentField && !isRecurrentEditable)
  //   ) {
  //     return;
  //   }

  //   // For regular fields, validate numeric input
  //   // Only allow numbers (including decimals and negative numbers)
  //   const numberRegex = /^-?\d*\.?\d*$/;
  //   if (value !== "" && !numberRegex.test(value)) {
  //     // If invalid input, revert to previous value
  //     setModalData((prev) => ({
  //       ...prev,
  //       [fieldName]: prev[fieldName] || "",
  //     }));
  //   }
  // };

  const handleInputChange = (fieldName, value) => {
    // Find the attribute to check its type
    const attribute = currentSheet.attributes.find(
      (attr) => attr.name === fieldName
    );

    // Check if this is a date field or derived field
    const isDateField =
      fieldName.toLowerCase() === "date" ||
      (attribute && currentSheet.attributes.indexOf(attribute) === 0);
    const isDerivedField = attribute?.derived;
    const isReferencedField = attribute?.linkedFrom?.sheetObjectId;
    const isRecurrentField = attribute?.recurrentCheck?.isRecurrent;
    const isRecurrentEditable =
      isRecurrentField && !attribute?.recurrentCheck?.recurrenceFedStatus;

    // Always update modal data first
    setModalData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Check if this field requires subrows and has a significant value
    if (shouldOpenSubrowsModal(attribute) && value && parseFloat(value) > 0) {
      // Check if we already have subrows data for this field
      const existingSubrows = getExistingSubrowsData(fieldName, selectedRowIndex);
      const hasModifiedSubrows = subrowsData[fieldName] && subrowsData[fieldName].length > 0;
      
      // Only auto-open if no existing data and user hasn't manually entered subrows
      // AND the modal is not currently open (prevent multiple opens)
      if (existingSubrows.length === 0 && !hasModifiedSubrows && !showSubrowsModal) {
        // Small delay to let user finish typing before opening modal
        setTimeout(() => {
          // Double check conditions before opening
          if (modalData[fieldName] && parseFloat(modalData[fieldName]) > 0 && !showSubrowsModal) {
            setCurrentSubrowsColumn(attribute);
            setShowSubrowsModal(true);
          }
        }, 1500); // 1.5 second delay
      }
    }

    // Skip further validation for special fields (they're already updated above)
    if (
      isDateField ||
      isDerivedField ||
      isReferencedField ||
      (isRecurrentField && !isRecurrentEditable)
    ) {
      return;
    }

    // For regular fields, validate numeric input
    // Only allow numbers (including decimals and negative numbers)
    const numberRegex = /^-?\d*\.?\d*$/;
    if (value !== "" && !numberRegex.test(value)) {
      // If invalid input, revert to previous value
      setModalData((prev) => ({
        ...prev,
        [fieldName]: prev[fieldName] || "",
      }));
    }
  };

  const handleSaveColumnNew = async (columnData) => {
    console.log("Saving new column:", columnData);
    const hasExistingData =
      currentSheet &&
      currentSheet.attributes.length > 0 &&
      currentSheet.attributes[0].data &&
      currentSheet.attributes[0].data.length > 0;

    // Create new column metadata in the required format
    const newColumnMeta = {
      name: columnData.name,
      formula:
        columnData.additionIndices?.length > 0 ||
        columnData.subtractionIndices?.length > 0
          ? {
              additionIndices: columnData.additionIndices || [],
              subtractionIndices: columnData.subtractionIndices || [],
            }
          : null,
      linkedFrom: {
        sheetObjectId: columnData.reference?.sheetId || null,
        attributeIndice: columnData.reference?.columnIndex || null,
      },
      recurrentCheck: {
        isRecurrent: !!columnData.recurrent,
        recurrentReferenceIndice:
          columnData.recurrent?.recurrentColumnIndex || null,
        recurrenceFedStatus: columnData.recurrent ? hasExistingData : false,
      },
      derived:
        columnData.additionIndices?.length > 0 ||
        columnData.subtractionIndices?.length > 0,

      // NEW: Add subrows configuration
      hasSubrows: columnData.hasSubrows || false,
      subrowsConfig:
        columnData.hasSubrows && columnData.subrowsConfig
          ? {
              subrowsEnabled: columnData.subrowsConfig.subrowsEnabled,
              subrowColumns: columnData.subrowsConfig.subrowColumns.map(
                (col) => ({
                  name: col.name,
                  type: col.type,
                  required: col.required,
                  autoIncrement:
                    col.type === "number" &&
                    col.name.toLowerCase().includes("sr")
                      ? true
                      : false,
                  isAggregateField:
                    col.name === columnData.subrowsConfig.aggregateField,
                })
              ),
              aggregationType:
                columnData.subrowsConfig.aggregationType || "sum",
              aggregateField: columnData.subrowsConfig.aggregateField,
            }
          : {
              subrowsEnabled: false,
              subrowColumns: [],
              aggregationType: "sum",
              aggregateField: null,
            },
    };

    // Get current sheet metadata and add new column
    const currentSheetMeta = rawMetadata.find(
      (sheet) => sheet["_id"] === selectedSheetId
    );
    const updatedCurrentSheetMeta = {
      ...currentSheetMeta,
      attributes: [...currentSheetMeta.attributes, newColumnMeta],
      formulaChange: [],
      nameChange: false,
    };

    console.log("Updated current sheet metadata:", updatedCurrentSheetMeta);

    try {
      // Call the API to update metadata
      const response = await updateMetas(
        selectedSheetId,
        updatedCurrentSheetMeta,
        "newColumn"
      );

      if (response) {
        // Close modal first
        setShowColumnModal(false);
        setColumnType(null);
        setShowColumnTypeDropdown(false);

        // Refresh the page/data
        // window.location.reload();
        await refreshData();
      }
    } catch (error) {
      console.error("Error saving new column:", error);
    }

    setShowColumnModal(false);
    setColumnType(null);
    setShowColumnTypeDropdown(false);

    return updatedCurrentSheetMeta;
  };

  const handleUpdateColumn = async (columnData) => {
    console.log("Updating column:", columnData);

    if (selectedColumnIndex === null) return;

    // Get current sheet metadata
    const currentSheetMeta = rawMetadata.find(
      (sheet) => sheet["_id"] === selectedSheetId
    );

    // Determine if current sheet has data (to set recurrenceFedStatus)
    const hasExistingData =
      currentSheet &&
      currentSheet.attributes.length > 0 &&
      currentSheet.attributes[0].data &&
      currentSheet.attributes[0].data.length > 0;

    // Create updated attributes array
    const updatedAttributes = currentSheetMeta.attributes.map((attr, index) => {
      if (index === selectedColumnIndex) {
        return {
          ...attr,
          name: columnData.name,
          // Update formula for derived columns
          formula:
            columnData.additionIndices?.length > 0 ||
            columnData.subtractionIndices?.length > 0
              ? {
                  additionIndices: columnData.additionIndices || [],
                  subtractionIndices: columnData.subtractionIndices || [],
                }
              : attr.formula,
          // Update linkedFrom for reference
          linkedFrom: columnData.reference
            ? {
                sheetObjectId: columnData.reference.sheetId,
                attributeIndice: columnData.reference.columnIndex,
              }
            : {
                sheetObjectId: null,
                attributeIndice: null,
              },
          // Update recurrentCheck for recurrent
          recurrentCheck: columnData.recurrent
            ? {
                isRecurrent: true,
                recurrentReferenceIndice:
                  columnData.recurrent.referenceColumnIndex,
                recurrenceFedStatus: hasExistingData,
              }
            : {
                isRecurrent: false,
                recurrentReferenceIndice: null,
                recurrenceFedStatus: false,
              },
          // Update derived status
          derived:
            columnData.additionIndices?.length > 0 ||
            columnData.subtractionIndices?.length > 0 ||
            attr.derived,
          
          // NEW: Update subrows configuration
          hasSubrows: !!columnData.hasSubrows, // Force boolean conversion
      
          // FIX: Update subrowsConfig properly
          subrowsConfig: columnData.hasSubrows && columnData.subrowsConfig ? {
            subrowsEnabled: columnData.subrowsConfig.subrowsEnabled,
            subrowColumns: columnData.subrowsConfig.subrowColumns.map(col => ({
              name: col.name,
              type: col.type,
              required: col.required,
              autoIncrement: col.type === 'number' && col.name.toLowerCase().includes('sr') ? true : false,
              options: col.options || [],
              isAggregateField: col.name === columnData.subrowsConfig.aggregateField
            })),
            aggregationType: columnData.subrowsConfig.aggregationType || "sum",
            aggregateField: columnData.subrowsConfig.aggregateField
          } : columnData.hasSubrows ? {
            // If hasSubrows is true but no config provided, create default
            subrowsEnabled: false,
            subrowColumns: [],
            aggregationType: "sum",
            aggregateField: null
          } : attr.subrowsConfig || {
            // If hasSubrows is false, keep existing config or create default
            subrowsEnabled: false,
            subrowColumns: [],
            aggregationType: "sum",
            aggregateField: null
          }
        };
      }
      return attr;
    });

    // Determine if formula actually changed for derived columns
    const originalAttr = currentSheetMeta.attributes[selectedColumnIndex];
    let formulaChanged = false;

    if (originalAttr.derived || (columnData.additionIndices?.length > 0 || columnData.subtractionIndices?.length > 0)) {
      // Check if addition indices changed
      const originalAdditions = originalAttr.formula?.additionIndices || [];
      const newAdditions = columnData.additionIndices || [];
      
      // Check if subtraction indices changed
      const originalSubtractions = originalAttr.formula?.subtractionIndices || [];
      const newSubtractions = columnData.subtractionIndices || [];
      
      formulaChanged = 
        JSON.stringify(originalAdditions.sort()) !== JSON.stringify(newAdditions.sort()) ||
        JSON.stringify(originalSubtractions.sort()) !== JSON.stringify(newSubtractions.sort());
    }

    // Create updated sheet metadata
    const updatedCurrentSheetMeta = {
      ...currentSheetMeta,
      attributes: updatedAttributes,
      formulaChange: formulaChanged ? [selectedColumnIndex] : [],
      nameChange: false,
    };

    console.log("Updated current sheet metadata:", updatedCurrentSheetMeta);

    try {
      // Determine action type based on what changed
      const originalAttr = currentSheetMeta.attributes[selectedColumnIndex];
      let action = "formulaUpdate";

      if (originalAttr.name !== columnData.name) {
        action = "nameChange";
      } else if (
        // Check if reference changed
        originalAttr.linkedFrom?.sheetObjectId !==
          columnData.reference?.sheetId ||
        originalAttr.linkedFrom?.attributeIndice !==
          columnData.reference?.columnIndex ||
        // Check if recurrent changed
        originalAttr.recurrentCheck?.isRecurrent !== !!columnData.recurrent ||
        originalAttr.recurrentCheck?.recurrentReferenceIndice !==
          columnData.recurrent?.referenceColumnIndex ||
        // NEW: Check if subrows configuration changed
        originalAttr.hasSubrows !== columnData.hasSubrows ||
        (originalAttr.hasSubrows && columnData.hasSubrows && (
          originalAttr.subrowsConfig?.subrowsEnabled !== columnData.subrowsConfig?.subrowsEnabled ||
          originalAttr.subrowsConfig?.aggregateField !== columnData.subrowsConfig?.aggregateField ||
          originalAttr.subrowsConfig?.aggregationType !== columnData.subrowsConfig?.aggregationType ||
          JSON.stringify(originalAttr.subrowsConfig?.subrowColumns) !== 
          JSON.stringify(columnData.subrowsConfig?.subrowColumns?.map(col => ({
            name: col.name,
            type: col.type,
            required: col.required,
            autoIncrement: col.type === 'number' && col.name.toLowerCase().includes('sr'),
            options: col.options || [],
            isAggregateField: col.name === columnData.subrowsConfig.aggregateField
          })))
        ))
      ) {
        action = "formulaUpdate";
      }

      // Call the API to update metadata
      const response = await updateMetas(
        selectedSheetId,
        updatedCurrentSheetMeta,
        action
      );

      if (response) {
        // Close modal and reset states
        setShowUpdateColumnModal(false);
        setSelectedColumnIndex(null);

        await refreshData();
      }
    } catch (error) {
      console.error("Error updating column:", error);
    }
  };

  const handleBlankRowClick = () => {
    // Check if today's data already exists
    if (checkTodaysData()) {
      toast.error(
        "Today's data already exists. You cannot add duplicate entries for today."
      );
      return;
    }

    // If no today's data, open insert modal
    setModalType("insert");
    setSelectedRowIndex(null); // No specific row index for insert

    // Initialize modal data with today's date for date field
    const initialModalData = {};
    const currentSheetData = rawSheetsData[selectedSheetId] || [];

    currentSheet.attributes.forEach((attribute, index) => {
      if (attribute.name.toLowerCase() === "date" || index === 0) {
        initialModalData[attribute.name] = convertDateFormat(
          new Date().toISOString().split("T")[0],
          true
        ); // Default to today but allow change
      } else if (attribute.recurrentCheck?.isRecurrent) {
        if (attribute.recurrentCheck.recurrenceFedStatus) {
          // Auto-populate from previous month if feedStatus is true
          const recurrentValue = getRecurrentValueFromPreviousMonth(
            attribute,
            currentSheetData
          );
          console.log("heyyyy... handleblank click...", recurrentValue);
          initialModalData[attribute.name] = recurrentValue;
        } else {
          // Leave empty for user input if feedStatus is false
          initialModalData[attribute.name] = "";
        }
      } else if (!attribute.derived && !attribute.linkedFrom?.sheetObjectId) {
        initialModalData[attribute.name] = "";
      }
    });

    setModalData(initialModalData);
    setShowModal(true);
  };

  const getTodaysDate = () => {
    const today = new Date();
    return today.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderFormulaTooltip = (attribute, columnIndex) => {
    console.log("Rendering formula tooltip for attribute:", attribute);

    // Handle derived columns
    if (attribute.derived && attribute.formula) {
      const additionIndices = attribute.formula["additionIndices"] || [];
      const subtractionIndices = attribute.formula["subtractionIndices"] || [];

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
                {term
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
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
                {term
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            ))}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </div>
      );
    }

    // Handle recurrent columns
    if (attribute.recurrentCheck?.isRecurrent) {
      const refIndex = attribute.recurrentCheck.recurrentReferenceIndice;
      const refColumn = currentSheet.attributes[refIndex];

      return (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-purple-900 text-white text-xs rounded-lg shadow-lg z-50 whitespace-nowrap">
          <div className="font-semibold mb-1">Recurrent Reference:</div>
          <div className="flex items-center gap-1">
            <span className="bg-purple-600 px-2 py-1 rounded text-white font-medium">
              {refColumn?.name
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                `Column ${refIndex}`}
            </span>
            <span className="text-purple-300">→ Previous Period</span>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-purple-900"></div>
        </div>
      );
    }

    return null;
  };

  const calculateRecurrentValue = (attribute, columnIndex, rowIndex) => {
    // Check if this is a recurrent column
    if (!attribute.recurrentCheck?.isRecurrent) {
      return attribute.data[rowIndex] || "0";
    }

    const referenceColumnIndex =
      attribute.recurrentCheck.recurrentReferenceIndice;

    // Get the reference column
    const referenceColumn = currentSheet.attributes[referenceColumnIndex];
    if (!referenceColumn) {
      return "0"; // No reference column found
    }

    // For recurrent columns, we need to get the value from the previous period
    // If this is the first row (rowIndex = 0), there's no previous period
    if (rowIndex === 0) {
      return "0"; // No previous period for first row
    }

    // Get the value from the previous row (previous period) of the reference column
    const previousPeriodValue = referenceColumn.data[rowIndex - 1];

    return previousPeriodValue || "0";
  };

  const calculateDerivedValueForDisplay = (attribute, rowIndex) => {
    // Check if this is a derived column
    if (!attribute.derived || !attribute.formula) {
      return attribute.data[rowIndex] || "0";
    }

    const additionIndices = attribute.formula.additionIndices || [];
    const subtractionIndices = attribute.formula.subtractionIndices || [];

    let result = 0;

    // Add values from addition indices
    additionIndices.forEach((index) => {
      const refAttr = currentSheet.attributes[index];
      if (refAttr && refAttr.data[rowIndex] !== undefined) {
        const value = parseFloat(refAttr.data[rowIndex]) || 0;
        result += value;
      }
    });

    // Subtract values from subtraction indices
    subtractionIndices.forEach((index) => {
      const refAttr = currentSheet.attributes[index];
      if (refAttr && refAttr.data[rowIndex] !== undefined) {
        const value = parseFloat(refAttr.data[rowIndex]) || 0;
        result -= value;
      }
    });

    return result;
  };

  const processLastRowWithZeroDate = async (sheetData, sheetId) => {
    if (!sheetData || sheetData.length === 0) return false;

    const lastRow = sheetData[sheetData.length - 1];

    // Check if last row's first attribute (date column) is "0"
    if (lastRow.attributes && lastRow.attributes[0] === 0) {
      console.log("Found last row with date = 0, processing...");

      // Get today's date in the correct format
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      // Create updated row array
      const updatedRowArray = [...lastRow.attributes];
      updatedRowArray[0] = formattedDate; // Set today's date

      // Get current sheet metadata for calculations
      const currentSheetMeta = rawMetadata.find(
        (sheet) => sheet._id === sheetId
      );
      if (!currentSheetMeta) return false;

      // Calculate recurrent values
      currentSheetMeta.attributes.forEach((attr, attrIndex) => {
        if (attr.recurrentCheck?.isRecurrent) {
          const refIndex = attr.recurrentCheck.recurrentReferenceIndice;
          if (refIndex !== null && sheetData.length > 1) {
            // Get value from previous row (second last row)
            const previousRowValue =
              sheetData[sheetData.length - 2].attributes[refIndex];
            updatedRowArray[attrIndex] = previousRowValue || "0";
          }
        }
      });

      // Calculate derived values
      currentSheetMeta.attributes.forEach((attr, attrIndex) => {
        if (attr.derived && attr.formula) {
          let calculatedValue = 0;

          // Add values from addition indices
          if (attr.formula.additionIndices?.length > 0) {
            attr.formula.additionIndices.forEach((idx) => {
              const value = parseFloat(updatedRowArray[idx]) || 0;
              calculatedValue += value;
            });
          }

          // Subtract values from subtraction indices
          if (attr.formula.subtractionIndices?.length > 0) {
            attr.formula.subtractionIndices.forEach((idx) => {
              const value = parseFloat(updatedRowArray[idx]) || 0;
              calculatedValue -= value;
            });
          }

          updatedRowArray[attrIndex] = calculatedValue;
        }
      });

      console.log("Updated row array with calculations:", updatedRowArray);

      // Call update API
      try {
        const targetDate = lastRow.createdAt;
        const rowIndex = sheetData.length - 1;

        await updateRowData(sheetId, {
          rowIndex: rowIndex,
          attributes: updatedRowArray,
          targetDate: targetDate,
        });

        console.log("Successfully updated last row with date 0");
        return true; // Indicate that update was performed
      } catch (error) {
        console.error("Error updating last row with date 0:", error);
        return false;
      }
    }

    return false; // No update needed
  };

  const renderTable = () => {
    if (loading || !currentSheet || processedData.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">
            {loading ? "Loading sheet data..." : "Processing data..."}
          </p>
        </div>
      );
    }

    // Add safety check for attributes
    if (!currentSheet.attributes || currentSheet.attributes.length === 0) {
      return (
        <div className="p-8 text-center">
          <p className="text-gray-500">
            No data available for the selected period.
          </p>
        </div>
      );
    }

    // Get the number of rows from the first attribute
    const numRows = currentSheet.attributes[0]?.data.length || 0;
    const rows = [];

    // Create rows by getting data from each attribute at the same index
    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
      const row = currentSheet.attributes.map(
        (attr) => attr.data[rowIndex] || "0"
      );
      rows.push(row);
    }

    // Add blank row at end for new data entry
    const blankRow = currentSheet.attributes.map(() => "");
    rows.push(blankRow);

    const totalsRow = currentSheet.attributes.map((attr, cellIndex) => {
      const columnType = getColumnType(attr);
      if (attr.name.toLowerCase() === "date") return "Total";

      if (columnType === "derived") {
        // Calculate total for derived columns using calculated values
        let total = 0;
        for (let i = 0; i < numRows; i++) {
          const value = calculateDerivedValueForDisplay(attr, i);
          const numValue = parseFloat(value) || 0;
          if (!isNaN(numValue)) {
            total += numValue;
          }
        }
        return total;
      } else if (columnType === "normal" || columnType === "referenced") {
        let total = 0;
        for (let i = 0; i < numRows; i++) {
          const value = attr.data[i] || 0;
          if (typeof value === "number") {
            total += value;
          }
        }
        return total;
      } else if (columnType === "recurrent") {
        // Calculate total for recurrent columns using calculated values
        let total = 0;
        for (let i = 0; i <= numRows; i++) {
          const value = calculateRecurrentValue(attr, cellIndex, i);
          // console.log("heyyyy... recVal..", value, numRows, i);
          const numValue = parseFloat(value) || 0;
          if (!isNaN(numValue)) {
            total += numValue;
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
                    (currentSheet.attributes[hoveredColumn]?.derived ||
                      currentSheet.attributes[hoveredColumn]?.recurrentCheck
                        ?.isRecurrent);

                  let headerClass = getColumnClass(columnType);

                  if (isHighlighted) {
                    const hoveredAttr = currentSheet.attributes[hoveredColumn];
                    if (hoveredAttr?.formula) {
                      const additionIndices =
                        hoveredAttr.formula["additionIndices"] || [];
                      const subtractionIndices =
                        hoveredAttr.formula["subtractionIndices"] || [];

                      if (additionIndices.includes(index)) {
                        headerClass = "bg-green-200 text-green-900";
                      } else if (subtractionIndices.includes(index)) {
                        headerClass = "bg-red-200 text-red-900";
                      }
                    } else if (hoveredAttr?.recurrentCheck?.isRecurrent) {
                      const recurrentIndex =
                        hoveredAttr.recurrentCheck.recurrentReferenceIndice;
                      if (recurrentIndex === index) {
                        headerClass = "bg-purple-200 text-purple-900";
                      }
                    }
                  }

                  return (
                    <th
                      key={index}
                      className={`relative px-4 py-3 text-center text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${headerClass}`}
                      onMouseEnter={() => {
                        if (attr.derived || attr.recurrentCheck?.isRecurrent) {
                          setHoveredColumn(index);
                        }
                      }}
                      onMouseLeave={() => setHoveredColumn(null)}
                      onContextMenu={(e) => {
                        if (isAdmin) {
                          e.preventDefault();
                          setSelectedColumnIndex(index);
                          setContextMenuPosition({
                            x: e.clientX,
                            y: e.clientY,
                          });
                          setShowContextMenu(true);
                        }
                      }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {attr.name
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                        {(columnType === "derived" ||
                          columnType === "recurrent") && (
                          <Info className="w-3 h-3 text-gray-600" />
                        )}
                      </div>
                      {isHovered &&
                        (attr.derived || attr.recurrentCheck?.isRecurrent) &&
                        renderFormulaTooltip(attr, index)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, rowIndex) => {
                const isBlankRow = rowIndex === rows.length - 1;

                return (
                  <React.Fragment key={rowIndex}>
                    {/* Main row */}
                    <tr
                      className={`hover:bg-gray-50 cursor-pointer ${
                        isBlankRow
                          ? checkTodaysData()
                            ? "display-none bg-green-50 cursor-default"
                            : "bg-blue-50 cursor-pointer hover:bg-blue-100"
                          : "cursor-none"
                      }`}
                      onClick={() =>
                        isBlankRow
                          ? handleBlankRowClick()
                          : handleRowClick(rowIndex)
                      }
                    >
                      {row.map((cell, cellIndex) => {
                        const attr = currentSheet.attributes[cellIndex];
                        const columnType = getColumnType(attr);
                        const isDisabled =
                          (columnType === "derived" ||
                            columnType === "referenced") &&
                          !isBlankRow;
                        const hasSubrowsEnabled = hasSubrows(attr);
                        const isExpanded = hasSubrowsEnabled && isRowExpanded(rowIndex, cellIndex);

                        return (
                          <td
                            key={cellIndex}
                            className={`px-4 py-3 whitespace-nowrap text-sm ${
                              columnType === "derived"
                                ? "text-gray-950"
                                : columnType === "referenced"
                                ? "text-gray-950"
                                : columnType === "recurrent"
                                ? "text-gray-950"
                                : "text-gray-900 font-medium"
                            } ${isDisabled ? "opacity-75" : ""} text-center`}
                            onDoubleClick={(e) => {
                              if (isBlankRow) return;
                              if (hasSubrowsEnabled) {
                                e.stopPropagation();
                                handleRowDoubleClick(rowIndex, cellIndex);
                              }
                            }}
                          >
                            <div className="flex items-center justify-center relative">
                              <div
                                className={`${
                                  columnType === "derived" && !isBlankRow
                                    ? "bg-yellow-200 rounded-md px-3 py-1 w-full inline-block"
                                    : columnType === "referenced" && !isBlankRow
                                    ? "bg-gray-200 rounded-md w-full px-3 py-1 inline-block"
                                    : columnType === "recurrent" && !isBlankRow
                                    ? "bg-purple-200 rounded-md w-full px-3 py-1 inline-block"
                                    : ""
                                }`}
                              >
                                {/* Main cell content */}
                                {isBlankRow &&
                                (columnType === "derived" ||
                                  columnType === "referenced" ||
                                  columnType === "recurrent")
                                  ? "--"
                                  : (() => {
                                      let displayValue = cell;
                                      return (displayValue || (isBlankRow ? checkTodaysData() ? "Data complete" : "Click to enter today's data": "0"));
                                    })()}
                              </div>
                              {hasSubrowsEnabled && !isBlankRow && (
                                <span
                                  className={`ml-2 cursor-pointer text-xs font-bold transition-transform duration-200 ${
                                    isExpanded ? "text-blue-600 transform" : "text-gray-400 hover:text-blue-600"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowDoubleClick(rowIndex, cellIndex);
                                  }}
                                  title={isExpanded ? "Click to collapse" : "Click to expand subrows"}
                                >
                                  {isExpanded ? "▼" : "▶"}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    {/* Expanded subrows section */}
                    {currentSheet.attributes.map((attr, colIndex) => {
                      if (!hasSubrows(attr) || isBlankRow || !isRowExpanded(rowIndex, colIndex)) {
                        return null;
                      }

                      const subrows = getSubrowsForRowAndColumn(rowIndex, colIndex);
                      
                      return (
                        <tr key={`expanded-${rowIndex}-${colIndex}`} className="bg-blue-50">
                          <td colSpan={currentSheet.attributes.length} className="px-4 py-3">
                            <div className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-800">
                                  {attr.name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} - Subrows Details
                                </h4>
                                <button
                                  onClick={() => handleRowDoubleClick(rowIndex, colIndex)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                              
                              {renderSubrowsTable(subrows, attr)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Totals row remains the same */}
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
                  className="absolute top-20 right-0 mt-2 w-40 bg-white shadow-lg rounded-md border border-gray-200 z-50 column-dropdown-container"
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
                      setShowColumnTypeDropdown(false); // Close dropdown
                    }}
                  >
                    Independent
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => {
                      setColumnType("derived");
                      setShowColumnModal(true);
                      setShowColumnTypeDropdown(false); // Close dropdown
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

              const isRecurrentField = columnType === "recurrent";
              const isRecurrentDisabled =
                isRecurrentField && attr.recurrentCheck?.recurrenceFedStatus;

              const isDisabled =
                columnType === "derived" ||
                columnType === "referenced" ||
                isRecurrentDisabled;

              const isDateField = attr.name.toLowerCase() === "date" || index === 0;
              
              // CRUCIAL FIX: For insert mode, date field should be disabled and show today's date
              const shouldDisableDateInInsert = modalType === "insert" && isDateField;
              
              // Final disabled state
              const finalDisabled = isDisabled || shouldDisableDateInInsert;

              let displayValue = modalData[attr.name] || "";

              // CRUCIAL FIX: Handle date field properly
              if (isDateField) {
                if (modalType === "insert") {
                  // For insert mode, always show today's date in correct format
                  displayValue = getTodaysDate();
                } else {
                  // For update mode, show the existing date
                  displayValue = modalData[attr.name] || "";
                }
              } else if (isRecurrentField && !displayValue && modalType === "insert") {
                if (attr.recurrentCheck?.recurrenceFedStatus) {
                  displayValue = getRecurrentValueForDisplay(attr);
                }
              } else if (
                isRecurrentField &&
                !displayValue &&
                modalType === "update" &&
                selectedRowIndex !== null
              ) {
                displayValue = calculateRecurrentValue(
                  attr,
                  index,
                  selectedRowIndex
                );
              }

              // Handle subrows total calculation
              if (shouldOpenSubrowsModal(attr) && subrowsData[attr.name] && subrowsData[attr.name].length > 0) {
                const total = subrowsData[attr.name].reduce((sum, subrow) => {
                  const aggregateField = attr.subrowsConfig.aggregateField;
                  const value = parseFloat(subrow[aggregateField]) || 0;
                  return sum + value;
                }, 0);
                displayValue = total.toString();
              }
              
              // CRUCIAL FIX: Input type should be text for date field, number for others
              const inputType = isDateField ? "text" : "number";

              return (
                <div key={index} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {attr.name
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    {columnType === "derived" && " ⭐"}
                    {columnType === "referenced" && " 🔗"}
                    {columnType === "recurrent" && " 🔄"}
                    {shouldDisableDateInInsert && " 📅"}
                    {!isDateField && !isDisabled && " 🔢"}
                  </label>
                  <div className="relative">
                    <div className="flex items-center relative">
                      <input
                        type={inputType}
                        value={displayValue || ""}
                        onChange={(e) => {
                          if (!finalDisabled) {
                            handleInputChange(attr.name, e.target.value);
                          }
                        }}
                        disabled={finalDisabled}
                        placeholder={
                          isDateField
                            ? shouldDisableDateInInsert 
                              ? "Today's date (auto-filled)"
                              : "Select Date"
                            : isRecurrentField && isRecurrentDisabled
                            ? "Auto-calculated from previous period"
                            : isRecurrentField && !isRecurrentDisabled
                            ? "Enter value or auto-fill from previous period"
                            : columnType === "derived"
                            ? "Auto-calculated"
                            : columnType === "referenced"
                            ? "Referenced from another sheet"
                            : "Enter number"
                        }
                        {...(!isDateField && !finalDisabled && {
                          step: "any",
                          min: undefined,
                        })}
                        className={`flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm ${
                          columnType === "derived"
                            ? "bg-yellow-50 border-yellow-300"
                            : columnType === "referenced"
                            ? "bg-blue-50 border-blue-300 opacity-60"
                            : isRecurrentField && !isRecurrentDisabled
                            ? "bg-purple-50 border-purple-300 opacity-60"
                            : shouldDisableDateInInsert
                            ? "bg-gray-50 border-gray-300"
                            : "bg-blue-50 border-blue-300"
                        } ${
                          finalDisabled ? "cursor-not-allowed opacity-75" : ""
                        }`}
                      />
                      
                      {/* Add the subrows button here */}
                      {renderSubrowsButton(attr.name)}
                      
                      {/* Add-on button for recurrent fields */}
                      {isRecurrentField && (
                        <button
                          type="button"
                          onClick={(e) => handleAddOnClick(attr.name, e)}
                          className="ml-2 w-6 h-6 bg-purple-600 text-white rounded-full text-xs font-bold hover:bg-purple-700 transition-colors flex items-center justify-center"
                          title="Add value to recurrent amount"
                        >
                          +
                        </button>
                      )}
                    </div>
                    
                    {/* Help text */}
                    {columnType === "derived" && attr.humanFormula && (
                      <div className="text-xs text-gray-500 mt-1">
                        Formula: {attr.humanFormula}
                      </div>
                    )}
                    {columnType === "recurrent" && (
                      <div className="text-xs text-purple-600 mt-1">
                        Value from previous period of:{" "}
                        {currentSheet.attributes[
                          attr.recurrentCheck?.recurrentReferenceIndice
                        ]?.name
                          ?.replace(/-/g, " ")
                          ?.replace(/\b\w/g, (l) => l.toUpperCase()) ||
                          "Unknown"}
                      </div>
                    )}
                    {isDateField && shouldDisableDateInInsert && (
                      <div className="text-xs text-gray-600 mt-1">
                        Today's date - automatically filled for new entries
                      </div>
                    )}
                    {isDateField && !shouldDisableDateInInsert && (
                      <div className="text-xs text-blue-600 mt-1">
                        You can modify this date if needed
                      </div>
                    )}
                    {shouldOpenSubrowsModal(attr) && (
                      <div className="text-xs text-blue-600 mt-1">
                        {subrowsData[attr.name] && subrowsData[attr.name].length > 0
                          ? `Subrows: ${subrowsData[attr.name].length} entries, Total: ${displayValue}`
                          : "Click 'Details' button to add subrows"
                        }
                      </div>
                    )}
                    {!isDateField && !isDisabled && !shouldOpenSubrowsModal(attr) && (
                      <div className="text-xs text-blue-600 mt-1">
                        Number field - Only numeric values allowed
                      </div>
                    )}
                  </div>
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
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 capitalize"
            >
              {modalType}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getRecurrentValueForDisplay = (attribute) => {
    if (!attribute.recurrentCheck?.isRecurrent) {
      return "0";
    }

    const referenceColumnIndex =
      attribute.recurrentCheck.recurrentReferenceIndice;

    // First try to get from previous month record
    if (
      previousMonthRecord &&
      previousMonthRecord.attributes &&
      referenceColumnIndex !== null
    ) {
      const value = previousMonthRecord.attributes[referenceColumnIndex];
      if (value !== undefined && value !== "") {
        console.log(`Using previous month value for ${attribute.name}:`, value);
        return value.toString();
      }
    }

    // If no previous month record, try to get from current sheet's last record
    const currentSheetData = rawSheetsData[selectedSheetId] || [];
    if (currentSheetData.length > 0 && referenceColumnIndex !== null) {
      const lastRecord = currentSheetData[currentSheetData.length - 1];
      if (
        lastRecord &&
        lastRecord.attributes &&
        lastRecord.attributes[referenceColumnIndex] !== undefined
      ) {
        const value = lastRecord.attributes[referenceColumnIndex];
        console.log(`Using last record value for ${attribute.name}:`, value);
        return value.toString();
      }
    }

    // If no data available, try to get from processed sheet data
    if (currentSheet && currentSheet.attributes[referenceColumnIndex]) {
      const refColumn = currentSheet.attributes[referenceColumnIndex];
      if (refColumn.data && refColumn.data.length > 0) {
        const lastValue = refColumn.data[refColumn.data.length - 1];
        if (lastValue !== undefined && lastValue !== "") {
          console.log(
            `Using processed sheet last value for ${attribute.name}:`,
            lastValue
          );
          return lastValue.toString();
        }
      }
    }

    console.log(
      `No recurrent value found for ${attribute.name}, defaulting to 0`
    );
    return "0";
  };

  const renderAddOnModal = () => {
    if (!showAddOnModal) return null;

    return (
      <div
        className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-[60] min-w-[250px]"
        style={{
          left: `${addOnPosition.x}px`,
          top: `${addOnPosition.y}px`,
        }}
      >
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">
            Add to Recurrent Value
          </h3>
          <p className="text-xs text-gray-600">
            Current value: {modalData[addOnFieldName] || "0"}
          </p>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Amount to Add:
          </label>
          <input
            type="number"
            value={addOnValue}
            onChange={(e) => setAddOnValue(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            autoFocus
            step="any"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAddOnSave}
            className="flex-1 bg-purple-600 text-white text-xs py-1 px-2 rounded hover:bg-purple-700 transition-colors"
          >
            Add
          </button>
          <button
            onClick={handleAddOnCancel}
            className="flex-1 bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderContextMenu = () => {
    if (!showContextMenu) return null;

    return (
      <div
        className="fixed bg-white shadow-lg rounded-md border border-gray-200 z-50 py-2"
        style={{
          left: contextMenuPosition.x,
          top: contextMenuPosition.y,
        }}
      >
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
          onClick={() => {
            setShowUpdateColumnModal(true);
            setShowContextMenu(false);
          }}
        >
          Update Column
        </button>
      </div>
    );
  };

  const isPreviousMonthRecord = (dateValue, selectedMonth, selectedYear) => {
    if (!dateValue) return false;

    try {
      const recordDate = new Date(dateValue);
      const recordMonth = recordDate.getMonth() + 1; // getMonth() returns 0-11
      const recordYear = recordDate.getFullYear();

      // Check if this record is from previous month
      if (selectedMonth === 1) {
        // If current selection is January, previous month is December of previous year
        return recordMonth === 12 && recordYear === selectedYear - 1;
      } else {
        // Previous month is same year, month - 1
        return recordMonth === selectedMonth - 1 && recordYear === selectedYear;
      }
    } catch (error) {
      console.error("Error parsing date:", error);
      return false;
    }
  };

  const getRecurrentValueFromPreviousMonth = (attribute, sheetData) => {
    if (!attribute.recurrentCheck?.isRecurrent) {
      return "0";
    }

    // Use the stored previous month record
    if (previousMonthRecord && previousMonthRecord.attributes) {
      const referenceColumnIndex =
        attribute.recurrentCheck.recurrentReferenceIndice;
      if (
        referenceColumnIndex !== null &&
        previousMonthRecord.attributes[referenceColumnIndex] !== undefined
      ) {
        console.log(
          `Getting recurrent value for ${attribute.name} from previous month:`,
          previousMonthRecord.attributes[referenceColumnIndex]
        );
        return previousMonthRecord.attributes[referenceColumnIndex] || "0";
      }
    }

    console.log(
      `No previous month record found for recurrent column: ${attribute.name}`
    );
    return "0";
  };

  const handleAddOnClick = (fieldName, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setAddOnPosition({
      x: rect.right + 10,
      y: rect.top,
    });
    setAddOnFieldName(fieldName);
    setAddOnValue("");
    setShowAddOnModal(true);
  };

  const handleAddOnSave = () => {
    if (!addOnValue || isNaN(addOnValue)) {
      toast.error("Please enter a valid number");
      return;
    }

    const currentValue = parseFloat(modalData[addOnFieldName]) || 0;
    const addOnAmount = parseFloat(addOnValue);
    const newValue = currentValue + addOnAmount;

    setModalData((prev) => ({
      ...prev,
      [addOnFieldName]: newValue.toString(),
    }));

    setShowAddOnModal(false);
    setAddOnFieldName("");
    setAddOnValue("");
  };

  const handleAddOnCancel = () => {
    setShowAddOnModal(false);
    setAddOnFieldName("");
    setAddOnValue("");
  };

  const hasSubrows = (attr) => {
    return attr.hasSubrows && attr.subrowsConfig && attr.subrowsConfig.subrowsEnabled;
  };

  const getSubrowsForRowAndColumn = (rowIndex, columnIndex) => {
    // Get the sheet data for the current row
    const sheetData = rawSheetsData[selectedSheetId] || [];
    if (!sheetData[rowIndex] || !sheetData[rowIndex].subrows) {
      return [];
    }
    
    // Get subrows for the specific column index
    const columnSubrows = sheetData[rowIndex].subrows[columnIndex.toString()] || [];
    return columnSubrows;
  };

  const isRowExpanded = (rowIndex, columnIndex) => {
    return expandedRows.has(`${rowIndex}-${columnIndex}`);
  };

  const handleRowDoubleClick = (rowIndex, columnIndex) => {
    const attr = currentSheet.attributes[columnIndex];
    
    // Only handle clicks on columns that have subrows
    if (!hasSubrows(attr)) {
      return;
    }
    
    const rowKey = `${rowIndex}-${columnIndex}`;
    const newExpandedRows = new Set(expandedRows);
    
    if (newExpandedRows.has(rowKey)) {
      newExpandedRows.delete(rowKey);
    } else {
      newExpandedRows.add(rowKey);
    }
    
    setExpandedRows(newExpandedRows);
  };

  const renderSubrowsTable = (subrows, attr) => {
    if (!subrows || subrows.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No subrows data available for this entry
        </div>
      );
    }

    // Get column configuration from metadata
    const subrowColumns = attr.subrowsConfig.subrowColumns || [];
    
    return (
      <div className="overflow-x-auto overflow-y-auto max-h-64">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {subrowColumns.map((column, index) => (
                <th key={index} className={`text-left py-2 px-3 font-medium text-gray-700 ${
                  column.type === 'number' ? 'text-left' : 'text-left'
                }`}>
                  {column.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subrows.map((subrow, subIndex) => (
              <tr key={subrow._id || subIndex} className="border-b border-gray-100 hover:bg-gray-50">
                {subrowColumns.map((column, colIndex) => (
                  <td key={colIndex} className={`py-2 px-3 ${
                    column.type === 'number' 
                      ? 'text-left font-medium text-gray-900' 
                      : 'text-left text-gray-900'
                  }`}>
                    {column.type === 'number' && typeof subrow[column.name] === 'number'
                      ? subrow[column.name].toFixed(2)
                      : subrow[column.name] || '-'
                    }
                  </td>
                ))}
              </tr>
            ))}
            {/* Total row for aggregate fields */}
            {attr.subrowsConfig.aggregateField && (
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                <td colSpan={subrowColumns.length - 1} className="py-2 px-3 text-right">
                  Total:
                </td>
                <td className="py-2 px-3 text-left">
                  {subrows.reduce((total, subrow) => {
                    const value = parseFloat(subrow[attr.subrowsConfig.aggregateField]) || 0;
                    return total + value;
                  }, 0).toFixed(2)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const shouldOpenSubrowsModal = (attr) => {
    return attr.hasSubrows && 
          attr.subrowsConfig && 
          attr.subrowsConfig.subrowsEnabled && 
          attr.subrowsConfig.subrowColumns && 
          attr.subrowsConfig.subrowColumns.length > 0;
  };

  const getExistingSubrowsData = (columnName, rowIndex = null) => {
    // For insert mode
    if (modalType === "insert") {
      return subrowsData[columnName] || [];
    }
    
    // For update mode - get from API data
    if (modalType === "update" && rowIndex !== null) {
      const sheetData = rawSheetsData[selectedSheetId] || [];
      if (sheetData[rowIndex] && sheetData[rowIndex].subrows) {
        const columnIndex = currentSheet.attributes.findIndex(attr => attr.name === columnName);
        return sheetData[rowIndex].subrows[columnIndex.toString()] || [];
      }
    }
    
    return [];
  };

  const handleSubrowsSave = (data) => {
    const { subrows, total } = data;
    const columnName = currentSubrowsColumn.name;
    
    console.log("Saving subrows for column:", columnName, "Data:", subrows);
    
    // Store subrows data locally - this should contain ALL subrows (existing + new)
    setSubrowsData(prev => ({
      ...prev,
      [columnName]: subrows // This should be the complete array from the modal
    }));
    
    // Update modal data with the calculated total
    setModalData(prev => ({
      ...prev,
      [columnName]: total.toString()
    }));
    
    // Close modal and let user continue with other fields
    setShowSubrowsModal(false);
    setCurrentSubrowsColumn(null);
  };

  const handleSubrowsClose = () => {
    setShowSubrowsModal(false);
    setCurrentSubrowsColumn(null);
  };

  const renderSubrowsButton = (fieldName) => {
    const attr = currentSheet.attributes.find(a => a.name === fieldName);
    
    if (!shouldOpenSubrowsModal(attr)) {
      return null;
    }
    
    const hasExistingSubrows = getExistingSubrowsData(fieldName, selectedRowIndex).length > 0;
    const hasModifiedSubrows = subrowsData[fieldName] && subrowsData[fieldName].length > 0;
    const hasSubrowsData = hasExistingSubrows || hasModifiedSubrows;
    
    // Show different states based on data availability
    let buttonText = '+ Add';
    let buttonClass = 'text-blue-700 border border-blue-300 hover:bg-blue-200/30';
    
    if (hasModifiedSubrows) {
      buttonText = '✓ Modified';
      buttonClass = 'text-yellow-700 border border-yellow-300 hover:bg-yellow-200/30';
    } else if (hasExistingSubrows) {
      buttonText = '✓ Saved';
      buttonClass = 'text-green-700 border border-green-300 hover:bg-green-200/30';
    }
    
    return (
      <button
        type="button"
        onClick={() => {
          setCurrentSubrowsColumn(attr);
          setShowSubrowsModal(true);
        }}
        className={`absolute px-2 text-xs rounded transition-colors w-full h-full ${buttonClass}`}
        title={
          hasModifiedSubrows 
            ? 'Subrows modified - click to edit' 
            : hasExistingSubrows 
            ? 'Subrows exist - click to view/edit'
            : 'Click to add subrows details'
        }
      >
        <div className="flex items-end justify-end h-full">
          {buttonText}
        </div>
      </button>
    );
  };

  // Show loading state while metadata is being fetched
  if (metadataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-500">Loading metadata...</p>
        </div>
      </div>
    );
  }

  // Show message if no metadata found
  if (!metadataLoading && (!rawMetadata || rawMetadata.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">No sheets found.</p>
          <div className="flex items-center justify-center mt-4 gap-2">
            <button
              onClick={() => window.location.reload()}
              className=" bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  navigate("/create-sheet");
                }}
                className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all"
              >
                New Sheet
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-100 overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-64" : "w-0"
          } transition-all duration-300 h-full bg-white border-r border-gray-200 overflow-hidden flex-shrink-0`}
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
              {processedData.length > 0 ? (
                filteredSheets.map((sheet) => (
                  <button
                    key={sheet["_id"]}
                    onClick={() => {
                      setSelectedSheetId(sheet["_id"]);
                      // Fetch data if not already cached
                      // if (!rawSheetsData[sheet["_id"]]) {
                      //   fetchSheetData(sheet["_id"]);
                      // }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                      selectedSheetId === sheet["_id"]
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {sheet["sheetName"]
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                ))
              ) : (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-xs text-gray-500">
                    Loading sheets...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed left-4 top-20 z-10 bg-white shadow-md rounded-full p-2 border border-gray-200"
            >
              <ChevronRight size={20} />
            </button>
          )}

          <div className="p-2 h-full flex flex-col overflow-hidden">
            {processedData.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      {isEditingSheetName ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingSheetName}
                            onChange={(e) =>
                              setEditingSheetName(e.target.value)
                            }
                            onKeyDown={handleSheetNameKeyPress}
                            onBlur={handleSheetNameSave}
                            className="text-xl font-semibold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                          <button
                            onClick={handleSheetNameSave}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleSheetNameCancel}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <h1
                          className={`text-xl font-semibold text-gray-900  ${
                            isAdmin && "hover:text-blue-600 cursor-pointer"
                          } transition-colors`}
                          onDoubleClick={() => {
                            isAdmin && handleSheetNameDoubleClick();
                          }}
                          title={isAdmin ? "Double-click to edit" : null}
                        >
                          {currentSheet?.["sheetName"]
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </h1>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <InfoTooltip />
                      <select
                        value={selectedYear}
                        onChange={(e) =>
                          setSelectedYear(parseInt(e.target.value))
                        }
                        className="border border-gray-200 rounded-md px-3 py-1.5 text-sm"
                      >
                        {Array.from(
                          { length: 5 },
                          (_, i) => new Date().getFullYear() - i
                        ).map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedMonth}
                        onChange={(e) =>
                          setSelectedMonth(parseInt(e.target.value))
                        }
                        className="border border-gray-200 rounded-md px-3 py-1.5 text-sm"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (month) => (
                            <option key={month} value={month}>
                              {new Date(0, month - 1).toLocaleString(
                                "default",
                                { month: "long" }
                              )}
                            </option>
                          )
                        )}
                      </select>
                      {/* <select className="border border-gray-200 rounded-md px-3 py-1.5 text-sm">
                        <option>Status</option>
                      </select>
                      <select className="border border-gray-200 rounded-md px-3 py-1.5 text-sm">
                        <option>Columns</option>
                      </select> */}
                      <button
                        onClick={refreshData}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700"
                      >
                        Refresh
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            navigate("/create-sheet");
                          }}
                          className="bg-green-700 text-white px-4 py-1.5 rounded-md text-sm hover:bg-green-600 transition-all"
                        >
                          New Sheet
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">{renderTable()}</div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-500">Loading sheet data...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {renderModal()}

      {renderAddOnModal()}

      <ColumnCreationForm
        isOpen={showColumnModal}
        onClose={() => {
          setShowColumnModal(false);
          setColumnType(null);
          setShowColumnTypeDropdown(false);
        }}
        onSave={handleSaveColumnNew}
        type={columnType}
        sheets={processedData}
        currentSheetId={selectedSheetId}
      />

      {showUpdateColumnModal && selectedColumnIndex !== null && (
        <ColumnUpdateForm
          isOpen={showUpdateColumnModal}
          onClose={() => {
            setShowUpdateColumnModal(false);
            setSelectedColumnIndex(null);
          }}
          onSave={handleUpdateColumn}
          existingColumns={currentSheet?.attributes || []}
          availableSheets={processedData.filter(
            (sheet) => sheet._id !== selectedSheetId
          )}
          currentSheetId={selectedSheetId} // Make sure this is included
          existingData={{
            hasSubrows: currentSheet?.attributes[selectedColumnIndex],
            subrowsConfig: currentSheet?.attributes[selectedColumnIndex]?.hasSubrows ? currentSheet?.attributes[selectedColumnIndex]?.subrowsConfig : null,

            name: currentSheet?.attributes[selectedColumnIndex]?.name || "",
            additionIndices:
              currentSheet?.attributes[selectedColumnIndex]?.formula
                ?.additionIndices || [],
            subtractionIndices:
              currentSheet?.attributes[selectedColumnIndex]?.formula
                ?.subtractionIndices || [],
            reference: currentSheet?.attributes[selectedColumnIndex]?.linkedFrom
              ?.sheetObjectId
              ? {
                  sheetId:
                    currentSheet?.attributes[selectedColumnIndex]?.linkedFrom
                      ?.sheetObjectId,
                  columnIndex:
                    currentSheet?.attributes[selectedColumnIndex]?.linkedFrom
                      ?.attributeIndice,
                }
              : null,
            recurrent: currentSheet?.attributes[selectedColumnIndex]
              ?.recurrentCheck?.isRecurrent
              ? {
                  referenceColumnIndex:
                    currentSheet?.attributes[selectedColumnIndex]
                      ?.recurrentCheck?.recurrentReferenceIndice,
                }
              : null,

            
            isDerived:
              currentSheet?.attributes[selectedColumnIndex]?.derived || false,
            currentColumnIndex: selectedColumnIndex,

            
          }}
        />
      )}

      {showSubrowsModal && currentSubrowsColumn && (
        <DynamicSubRows
          isOpen={showSubrowsModal}
          onClose={handleSubrowsClose}
          onSave={handleSubrowsSave}
          columnConfig={currentSubrowsColumn}
          initialSubrows={getExistingSubrowsData(currentSubrowsColumn.name, selectedRowIndex)}
          currentTotal={parseFloat(modalData[currentSubrowsColumn.name]) || 0}
        />
      )}

      {renderContextMenu()}
    </div>
  );
};

export default SheetManagement;
