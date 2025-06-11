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
      const validData = Array.isArray(sheetData) ? sheetData : [];
      console.log("Valid data to store:", validData);

      setRawSheetsData((prev) => {
        const newData = {
          ...prev,
          [sheetId]: validData,
        };
        console.log("Updated rawSheetsData:", newData);
        return newData;
      });
    } catch (error) {
      // Only handle error if fetch wasn't cancelled
      if (currentFetchRef.current === fetchId) {
        console.error("Error fetching sheet data:", error);
        setRawSheetsData((prev) => ({
          ...prev,
          [sheetId]: [],
        }));
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

    const rowData = {};
    currentSheet.attributes.forEach((attr, cellIndex) => {
      const columnType = getColumnType(attr);

      if (columnType === "recurrent") {
        // For recurrent columns, use the calculated value
        rowData[attr.name] = calculateRecurrentValue(attr, cellIndex, rowIndex);
      } else {
        // For other column types, use the stored data
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

  //   if (modalType === "insert") {
  //     // Create new insert array with same length as attributes, initially filled with 0
  //     const newInsertArray = new Array(currentSheet.attributes.length).fill(0);

  //     // Set today's date in the first position
  //     const today = new Date();
  //     const formattedDate = today.toLocaleDateString("en-GB", {
  //       day: "numeric",
  //       month: "short",
  //       year: "numeric",
  //     });
  //     newInsertArray[0] = formattedDate;

  //     // Place values from modalData into correct positions based on attribute names
  //     Object.keys(modalData).forEach((fieldName) => {
  //       const attributeIndex = currentSheet.attributes.findIndex(
  //         (attr) => attr.name === fieldName
  //       );
  //       if (
  //         attributeIndex !== -1 &&
  //         !currentSheet.attributes[attributeIndex].derived
  //       ) {
  //         const value = modalData[fieldName];
  //         const processedValue =
  //           attributeIndex !== 0 && !isNaN(value) && value !== ""
  //             ? Number(value)
  //             : value;
  //         newInsertArray[attributeIndex] = processedValue;
  //       }
  //     });

  //     // Calculate derived columns
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

  //     console.log("Insert data array:", newInsertArray);

  //     // Add new data to processed sheet for local state update
  //     updatedSheet.attributes.forEach((attr, attrIndex) => {
  //       updatedSheet.attributes[attrIndex].data.push(newInsertArray[attrIndex]);
  //     });

  //     // Update processed data locally
  //     const newProcessedData = processedData.map((sheet) =>
  //       sheet["_id"] === selectedSheetId ? updatedSheet : sheet
  //     );
  //     setProcessedData(newProcessedData);

  //     // Call API with the new insert array
  //     await insertTodaysData(selectedSheetId, newInsertArray);
  //   } else if (modalType === "update" && selectedRowIndex !== null) {
  //     // Handle update logic
  //     updatedSheet.attributes.forEach((attr, attrIndex) => {
  //       const value = modalData[attr.name];
  //       if (value !== undefined && !attr.derived) {
  //         const processedValue =
  //           !isNaN(value) && value !== "" && attr.name.toLowerCase() !== "date"
  //             ? Number(value)
  //             : value;
  //         updatedSheet.attributes[attrIndex].data[selectedRowIndex] =
  //           processedValue;
  //       }
  //     });

  //     // Recalculate derived columns for update
  //     updatedSheet = calculateAllDerivedColumns(updatedSheet);

  //     // Update processed data
  //     const newProcessedData = processedData.map((sheet) =>
  //       sheet["_id"] === selectedSheetId ? updatedSheet : sheet
  //     );
  //     setProcessedData(newProcessedData);

  //     // Update raw data for API calls
  //     updateRawData(updatedSheet, modalType, selectedRowIndex);
  //   }

  //   setShowModal(false);
  //   setModalData({});
  //   setSelectedRowIndex(null);
  // };

  const handleModalSubmit = async () => {
    let updatedSheet = { ...currentSheet };

    const validationErrors = [];

    Object.keys(modalData).forEach((fieldName) => {
      const value = modalData[fieldName];
      const attribute = currentSheet.attributes.find(
        (attr) => attr.name === fieldName
      );

      if (!attribute) return;

      const columnType = getColumnType(attribute);
      const isDateField =
        fieldName.toLowerCase() === "date" ||
        currentSheet.attributes.indexOf(attribute) === 0;
      const isDepartmentField = fieldName.toLowerCase().includes("department");

      // Skip validation for special fields
      if (
        columnType === "derived" ||
        columnType === "referenced" ||
        columnType === "recurrent" ||
        isDateField
      ) {
        return;
      }

      // Validate department fields
      if (isDepartmentField) {
        const stringRegex = /^[a-zA-Z\s\-\.,']+$/;
        if (value && !stringRegex.test(value)) {
          validationErrors.push(
            `${fieldName}: Only letters and basic punctuation allowed`
          );
        }
      } else {
        // Validate number fields
        const numberRegex = /^-?\d*\.?\d*$/;
        if (value && !numberRegex.test(value)) {
          validationErrors.push(`${fieldName}: Only numeric values allowed`);
        }
      }
    });

    // Show validation errors if any
    if (validationErrors.length > 0) {
      toast.error(`Validation errors:\n${validationErrors.join("\n")}`);
      return;
    }

    if (modalType === "insert") {
      // Create new insert array with same length as attributes, initially filled with 0
      const newInsertArray = new Array(currentSheet.attributes.length).fill(0);

      // Set today's date in the first position
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      newInsertArray[0] = formattedDate;

      // Place values from modalData into correct positions based on attribute names
      Object.keys(modalData).forEach((fieldName) => {
        const attributeIndex = currentSheet.attributes.findIndex(
          (attr) => attr.name === fieldName
        );
        if (
          attributeIndex !== -1 &&
          !currentSheet.attributes[attributeIndex].derived
        ) {
          const value = modalData[fieldName];
          const processedValue =
            attributeIndex !== 0 && !isNaN(value) && value !== ""
              ? Number(value)
              : value;
          newInsertArray[attributeIndex] = processedValue;
        }
      });

      // Calculate derived columns
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

      console.log("Insert data array:", newInsertArray);

      // Add new data to processed sheet for local state update
      updatedSheet.attributes.forEach((attr, attrIndex) => {
        updatedSheet.attributes[attrIndex].data.push(newInsertArray[attrIndex]);
      });

      // Update processed data locally
      const newProcessedData = processedData.map((sheet) =>
        sheet["_id"] === selectedSheetId ? updatedSheet : sheet
      );
      setProcessedData(newProcessedData);

      // Call API with the new insert array
      await insertTodaysData(selectedSheetId, newInsertArray);
    } else if (modalType === "update" && selectedRowIndex !== null) {
      // Create updated row array with same length as attributes
      const updatedRowArray = [
        ...updatedSheet.attributes.map(
          (attr, attrIndex) => attr.data[selectedRowIndex]
        ),
      ];

      // Place values from modalData into correct positions based on attribute names
      Object.keys(modalData).forEach((fieldName) => {
        const attributeIndex = currentSheet.attributes.findIndex(
          (attr) => attr.name === fieldName
        );
        if (
          attributeIndex !== -1 &&
          !currentSheet.attributes[attributeIndex].derived &&
          !currentSheet.attributes[attributeIndex].recurrentCheck
            ?.isRecurrent && // Skip recurrent columns
          !currentSheet.attributes[attributeIndex].linkedFrom?.sheetObjectId
        ) {
          const value = modalData[fieldName];
          const processedValue =
            attributeIndex !== 0 && !isNaN(value) && value !== ""
              ? Number(value)
              : value;
          updatedRowArray[attributeIndex] = processedValue;
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

      // Call API with the updated row array and row index
      await updateRowData(selectedSheetId, {
        rowIndex: selectedRowIndex,
        attributes: updatedRowArray,
        targetDate: targetDate,
      });
    }

    setShowModal(false);
    setModalData({});
    setSelectedRowIndex(null);
  };

  const handleInputChange = (fieldName, value) => {
    // Find the attribute to check its type
    const attribute = currentSheet.attributes.find(
      (attr) => attr.name === fieldName
    );

    // Check if this is a department field (should only allow strings)
    const isDepartmentField = fieldName.toLowerCase().includes("department");

    // Check if this is a date field or derived field
    const isDateField =
      fieldName.toLowerCase() === "date" ||
      (attribute && currentSheet.attributes.indexOf(attribute) === 0);
    const isDerivedField = attribute?.derived;
    const isReferencedField = attribute?.linkedFrom?.sheetObjectId;
    const isRecurrentField = attribute?.recurrentCheck?.isRecurrent;

    // Skip validation for special fields
    if (
      isDateField ||
      isDerivedField ||
      isReferencedField ||
      isRecurrentField
    ) {
      setModalData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
      return;
    }

    // Validate input based on field type
    if (isDepartmentField) {
      // For department fields, only allow letters, spaces, and common punctuation
      const stringRegex = /^[a-zA-Z\s\-\.,']*$/;
      if (value === "" || stringRegex.test(value)) {
        setModalData((prev) => ({
          ...prev,
          [fieldName]: value,
        }));
      }
      // If invalid, don't update the value (ignore the input)
    } else {
      // For non-department fields, only allow numbers (including decimals)
      const numberRegex = /^-?\d*\.?\d*$/;
      if (value === "" || numberRegex.test(value)) {
        setModalData((prev) => ({
          ...prev,
          [fieldName]: value,
        }));
      }
      // If invalid, don't update the value (ignore the input)
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
        };
      }
      return attr;
    });

    // Create updated sheet metadata
    const updatedCurrentSheetMeta = {
      ...currentSheetMeta,
      attributes: updatedAttributes,
      formulaChange: [],
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
          columnData.recurrent?.referenceColumnIndex
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
    currentSheet.attributes.forEach((attr, index) => {
      if (attr.name.toLowerCase() === "date" || index === 0) {
        initialModalData[attr.name] = getTodaysDate();
      } else if (!attr.derived && !attr.linkedFrom?.sheetObjectId) {
        initialModalData[attr.name] = "";
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

  // const handleSaveColumnNew = (columnData) => {
  //   console.log("Saving new column:", columnData);
  //   const newAttribute = {
  //     name: columnData.name,
  //     derived: columnType === "derived",
  //     formula:
  //       columnType === "derived"
  //         ? {
  //             additionIndices: columnData.additionIndices || [],
  //             subtractionIndices: columnData.subtractionIndices || [],
  //           }
  //         : null,
  //     linkedFrom: columnData.reference
  //       ? {
  //           sheetObjectId: columnData.reference.sheetId,
  //           attributeIndice: columnData.reference.columnIndex,
  //         }
  //       : null,
  //     "recurrent-check": {
  //       isRecurrent: false,
  //       recurrentReferenceIndice: null,
  //       recurrenceFedStatus: false,
  //     },
  //     data: [],
  //     objectId: "647f191e810c19729de860ea",
  //     humanFormula: null,
  //   };

  //   console.log("New attribute to be added:", newAttribute);

  //   // Add human formula for derived columns
  //   if (columnType === "derived" && newAttribute.formula) {
  //     const additionTerms = (newAttribute.formula["additionIndices"] || []).map(
  //       (idx) => currentSheet.attributes[idx]?.name || `Column${idx}`
  //     );
  //     const subtractionTerms = (
  //       newAttribute.formula["subtractionIndices"] || []
  //     ).map((idx) => currentSheet.attributes[idx]?.name || `Column${idx}`);

  //     const parts = [];
  //     if (additionTerms.length > 0) {
  //       parts.push(additionTerms.join(" + "));
  //     }
  //     if (subtractionTerms.length > 0) {
  //       parts.push(" - " + subtractionTerms.join(" - "));
  //     }
  //     newAttribute.humanFormula = parts.join("");
  //   }

  //   // Calculate data for the new column
  //   const numRows = currentSheet.attributes[0]?.data.length || 0;
  //   if (columnType === "derived") {
  //     // Calculate derived values
  //     for (let i = 0; i < numRows; i++) {
  //       const calculatedValue = calculateDerivedValue(
  //         newAttribute.formula,
  //         currentSheet.attributes,
  //         i
  //       );
  //       newAttribute.data.push(calculatedValue);
  //     }
  //   } else {
  //     // Fill with empty values for independent columns
  //     newAttribute.data = new Array(numRows).fill("");
  //   }
  //   console.log("Calculated data for new attribute:", newAttribute.data);

  //   // Update processed data
  //   const updatedSheet = {
  //     ...currentSheet,
  //     attributes: [...currentSheet.attributes, newAttribute],
  //   };

  //   const newProcessedData = processedData.map((sheet) =>
  //     sheet["_id"] === selectedSheetId ? updatedSheet : sheet
  //   );
  //   setProcessedData(newProcessedData);

  //   // Update raw data
  //   updateRawData(updatedSheet, "addColumn", null);
  //   console.log("Updated processed data:", newProcessedData);
  //   setShowColumnModal(false);
  //   setColumnType(null);
  // };

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

    // Calculate totals row
    const totalsRow = currentSheet.attributes.map((attr, cellIndex) => {
      const columnType = getColumnType(attr);
      if (attr.name.toLowerCase() === "date") return "Total";

      if (
        columnType === "derived" ||
        columnType === "normal" ||
        columnType === "referenced"
      ) {
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
        for (let i = 0; i < numRows; i++) {
          const value = calculateRecurrentValue(attr, cellIndex, i);
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

                  // Apply highlighting when hovering over a derived or recurrent column
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
                  <tr
                    key={rowIndex}
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
                        >
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
                            {isBlankRow &&
                            (columnType === "derived" ||
                              columnType === "referenced" ||
                              columnType === "recurrent")
                              ? "--"
                              : (() => {
                                  // Calculate the display value based on column type
                                  const attr =
                                    currentSheet.attributes[cellIndex];
                                  let displayValue;

                                  if (columnType === "recurrent") {
                                    displayValue = calculateRecurrentValue(
                                      attr,
                                      cellIndex,
                                      rowIndex
                                    );
                                  } else {
                                    displayValue = cell;
                                  }

                                  return (
                                    displayValue ||
                                    (isBlankRow
                                      ? checkTodaysData()
                                        ? "Data complete"
                                        : "Click to enter today's data"
                                      : "")
                                  );
                                })()}
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
              const isDisabled =
                columnType === "derived" ||
                columnType === "referenced" ||
                columnType === "recurrent";
              const isDateField =
                attr.name.toLowerCase() === "date" || index === 0;
              const shouldDisableDateInInsert =
                modalType === "insert" && isDateField;
              const finalDisabled = isDisabled || shouldDisableDateInInsert;

              // Determine input type based on field name
              const isDepartmentField = attr.name
                .toLowerCase()
                .includes("department");
              const inputType = isDepartmentField ? "text" : "number";

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
                    {isDepartmentField && " 📝"} {/* Add text indicator */}
                    {!isDepartmentField &&
                      !isDateField &&
                      !isDisabled &&
                      " 🔢"}{" "}
                    {/* Add number indicator */}
                  </label>
                  <input
                    type={finalDisabled || isDateField ? "text" : inputType}
                    value={modalData[attr.name] || ""}
                    onChange={(e) => {
                      if (!finalDisabled) {
                        handleInputChange(attr.name, e.target.value);
                      }
                    }}
                    disabled={finalDisabled}
                    placeholder={
                      isDateField
                        ? modalType === "insert"
                          ? "Today's date (auto-filled)"
                          : `${attr.name}`
                        : columnType === "recurrent"
                        ? "Auto-calculated from previous period"
                        : columnType === "derived"
                        ? "Auto-calculated"
                        : columnType === "referenced"
                        ? "Referenced from another sheet"
                        : isDepartmentField
                        ? "Enter text (letters only)"
                        : "Enter number"
                    }
                    // Add step and min attributes for number inputs
                    {...(!isDepartmentField &&
                      !isDateField &&
                      !finalDisabled && {
                        step: "any",
                        min: undefined, // Allow negative numbers
                      })}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${
                      columnType === "derived"
                        ? "bg-yellow-50 border-yellow-300"
                        : columnType === "referenced"
                        ? "bg-blue-50 border-blue-300 opacity-60"
                        : columnType === "recurrent"
                        ? "bg-purple-50 border-purple-300 opacity-60"
                        : shouldDisableDateInInsert
                        ? "bg-gray-50 border-gray-300"
                        : isDepartmentField
                        ? "bg-green-50 border-green-300"
                        : "bg-blue-50 border-blue-300"
                    } ${finalDisabled ? "cursor-not-allowed opacity-75" : ""}`}
                  />
                  {columnType === "derived" && attr.humanFormula && (
                    <div className="text-xs text-gray-500">
                      Formula: {attr.humanFormula}
                    </div>
                  )}
                  {columnType === "recurrent" && (
                    <div className="text-xs text-purple-600">
                      Value from previous period of:{" "}
                      {currentSheet.attributes[
                        attr.recurrentCheck?.recurrentReferenceIndice
                      ]?.name
                        ?.replace(/-/g, " ")
                        ?.replace(/\b\w/g, (l) => l.toUpperCase()) || "Unknown"}
                    </div>
                  )}
                  {isDepartmentField && (
                    <div className="text-xs text-green-600">
                      Text field - Only letters, spaces, and basic punctuation
                      allowed
                    </div>
                  )}
                  {!isDepartmentField && !isDateField && !isDisabled && (
                    <div className="text-xs text-blue-600">
                      Number field - Only numeric values allowed
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
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 capitalize"
            >
              {modalType}
            </button>
          </div>
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
          <p className="text-gray-500">
            No sheets found. Please check your permissions.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
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

      {renderContextMenu()}
    </div>
  );
};

export default SheetManagement;
