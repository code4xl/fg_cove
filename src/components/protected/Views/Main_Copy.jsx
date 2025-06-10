import React, { useState, useEffect } from "react";
import { Search, X, Plus, ChevronRight, Info } from "lucide-react";
import { ColumnCreationForm } from "./utils/Helper";
import { useSelector } from "react-redux";
import { getMetadata } from "../../../app/MetadataSlice";
import {
  getSheetsData,
  insertTodaysData,
} from "../../../services/repository/sheetsRepo";
import { selectAccount } from "../../../app/DashboardSlice";

// Data processing utilities
const processSheetData = (metadata, sheetsData) => {
  return metadata.map((sheet) => {
    const sheetData = sheetsData[sheet["_id"]] || [];

    const processedAttributes = sheet.attributes.map((attr, index) => {
      const attributeData = sheetData[index]?.attributes || [];

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
        objectId: sheetData[index]?.["_id"] || null,
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

// Main Application Component
const SheetManagement = () => {
  const metadata = useSelector(getMetadata);
  const account = useSelector(selectAccount);

  const [rawMetadata, setRawMetadata] = useState(metadata);
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

  const fetchSheetData = async (sheetId) => {
    if (!sheetId) return;

    setLoading(true);
    try {
      const sheetData = await getSheetsData(sheetId);
      setRawSheetsData((prev) => ({
        ...prev,
        [sheetId]: sheetData,
      }));
    } catch (error) {
      console.error("Error fetching sheet data:", error);
      // You might want to show a toast/notification here
    } finally {
      setLoading(false);
      //new
      if (
        currentSheet &&
        isCurrentMonthSheet(currentSheet) &&
        !checkTodaysData()
      ) {
        setModalType("insert");
        setShowModal(true);
      }
    }
  };

  // Initialize processed data
  useEffect(() => {
    if (metadata && metadata.length > 0) {
      // Set first sheet as selected if no sheet is currently selected
      if (!selectedSheetId) {
        const firstSheetId = metadata[0]["_id"];
        setSelectedSheetId(firstSheetId);
        // Don't process data yet - wait for sheet data to be fetched
        return;
      }

      // Only process data if we have sheet data for the selected sheet
      if (rawSheetsData[selectedSheetId]) {
        const processed = processSheetData(metadata, rawSheetsData);
        console.log("Processed data:", processed);
        setProcessedData(processed);
      }
    }
  }, [metadata, rawSheetsData, selectedSheetId]);

  useEffect(() => {
    if (selectedSheetId && !rawSheetsData[selectedSheetId]) {
      fetchSheetData(selectedSheetId);
    } else if (selectedSheetId && rawSheetsData[selectedSheetId] && metadata) {
      // Process data only when we have both metadata and sheet data
      const processed = processSheetData(metadata, rawSheetsData);
      setProcessedData(processed);
    }
  }, [selectedSheetId, rawSheetsData, metadata]);

  // Refresh data function - call this when you need to fetch fresh data
  const refreshData = async () => {
    try {
      setLoading(true);

      // Refresh current sheet data
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
      console.log("Checking today's data in attribute:", dateAttribute);
      const hasToday = dateAttribute.data.some(
        (date) => date.includes(todayFormatted) || date.includes(today)
      );
      return hasToday;
    }
    return false;
  };

  const convertDateFormat = (dateString, isInputToDisplay = true) => {
    if (!dateString) return "";

    try {
      if (isInputToDisplay) {
        // Convert from YYYY-MM-DD to display format (e.g., "1 Jun 2025")
        const date = new Date(dateString + "T00:00:00"); // Add time to avoid timezone issues
        return date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      } else {
        // Convert from display format to YYYY-MM-DD for date input
        if (dateString.includes("-") && dateString.length === 10) {
          // Already in YYYY-MM-DD format
          return dateString;
        }
        // Parse display format and convert to YYYY-MM-DD
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return ""; // Invalid date
        }
        return date.toISOString().split("T")[0];
      }
    } catch (error) {
      console.error("Date conversion error:", error);
      return "";
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
      openModalWithData("insert");
    }
  }, [currentSheet, selectedSheetId]);

  const getColumnType = (attribute) => {
    if (attribute.derived) return "derived";
    if (attribute["linkedFrom"].sheetObjectId != null) return "referenced";
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

  // const handleRowClick = (rowIndex) => {
  //   setSelectedRowIndex(rowIndex);
  //   setModalType("update");

  //   const rowData = {};
  //   currentSheet.attributes.forEach((attr) => {
  //     rowData[attr.name] = attr.data[rowIndex] || "";
  //   });
  //   setModalData(rowData);
  //   setShowModal(true);
  // };

  const handleRowClick = (rowIndex) => {
    // Check if this is the blank row (last row with no actual data)
    const totalDataRows = currentSheet?.attributes[0]?.data.length || 0;
    const isBlankRow = rowIndex >= totalDataRows;

    if (isBlankRow) {
      openModalWithData("insert");
    } else {
      openModalWithData("update", rowIndex);
    }
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
          _id: attr.objectId || "647f191e810c19729de860ea",
          "user-id": "07f1f77bcf86cd799439011",
          date: "2025-05-01T00:00:00Z",
          attributes: [],
        };
      }
      newRawSheetsData[selectedSheetId][attrIndex].attributes = [...attr.data];
    });

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

    if (modalType === "insert") {
      const insertArray = [];

      updatedSheet.attributes.forEach((attr, attrIndex) => {
        if (attr.derived) {
          // Calculate derived value for the last row (newly inserted)
          const lastRowIndex = attr.data.length - 1;
          const calculatedValue = calculateDerivedValue(
            attr.formula,
            updatedSheet.attributes,
            lastRowIndex
          );
          insertArray.push(calculatedValue);
        } else {
          // For non-derived columns, get value from modalData or changedValues
          const value = modalData[attr.name] || "0";

          // Special handling for date field - ensure it's in proper format
          if (attr.name.toLowerCase() === "date" || attrIndex === 0) {
            // If it's a date field and we have a value, use it; otherwise use today's date
            if (value) {
              insertArray.push(value);
            } else {
              const today = new Date();
              const formattedDate = today.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              insertArray.push(formattedDate);
            }
          } else {
            // Convert string numbers to actual numbers for numeric fields
            const numericValue =
              !isNaN(value) && value !== "" ? Number(value) : value;
            insertArray.push(numericValue);
          }
        }
      });

      console.log("Insert data array:", insertArray);
    }

    console.log("Data for API calls:", apiData);

    // Here you would make your API calls
    // await updateMetadataAPI(apiData.updatedMetadata);
    // await updateSheetDataAPI(apiData.updatedSheetData);
  };

  const handleModalSubmit = async () => {
    let updatedSheet = { ...currentSheet };

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

      // Place values from changedValues into correct positions based on attribute names
      Object.keys(modalData).forEach((fieldName) => {
        const attributeIndex = currentSheet.attributes.findIndex(
          (attr) => attr.name === fieldName
        );
        if (
          attributeIndex !== -1 &&
          !currentSheet.attributes[attributeIndex].derived
        ) {
          const value = modalData[fieldName];
          // Convert to number if it's not the date field and it's a valid number
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

          // Add values from addition indices
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

          // Subtract values from subtraction indices
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
      // Handle update logic (existing code)
      updatedSheet.attributes.forEach((attr, attrIndex) => {
        const value = modalData[attr.name];
        if (value !== undefined && !attr.derived) {
          const processedValue =
            !isNaN(value) && value !== "" && attr.name.toLowerCase() !== "date"
              ? Number(value)
              : value;
          updatedSheet.attributes[attrIndex].data[selectedRowIndex] =
            processedValue;
        }
      });

      // Recalculate derived columns for update
      updatedSheet = calculateAllDerivedColumns(updatedSheet);

      // Update processed data
      const newProcessedData = processedData.map((sheet) =>
        sheet["_id"] === selectedSheetId ? updatedSheet : sheet
      );
      setProcessedData(newProcessedData);

      // Update raw data for API calls
      updateRawData(updatedSheet, modalType, selectedRowIndex);
    }

    setShowModal(false);
    setModalData({});
    setSelectedRowIndex(null);
  };

  // const handleModalSubmit = () => {
  //   let updatedSheet = { ...currentSheet };

  //   if (modalType === "insert") {
  //     // Add new data to each attribute
  //     updatedSheet.attributes.forEach((attr, attrIndex) => {
  //       const value = modalData[attr.name] || "";
  //       updatedSheet.attributes[attrIndex].data.push(value);
  //     });

  //     // Recalculate derived columns
  //     updatedSheet = calculateAllDerivedColumns(updatedSheet);
  //   } else if (modalType === "update" && selectedRowIndex !== null) {
  //     // Update existing values
  //     updatedSheet.attributes.forEach((attr, attrIndex) => {
  //       const value = modalData[attr.name];
  //       if (value !== undefined && !attr.derived) {
  //         updatedSheet.attributes[attrIndex].data[selectedRowIndex] = value;
  //       }
  //     });

  //     // Recalculate derived columns
  //     updatedSheet = calculateAllDerivedColumns(updatedSheet);
  //   }

  //   // Update processed data
  //   const newProcessedData = processedData.map((sheet) =>
  //     sheet["_id"] === selectedSheetId ? updatedSheet : sheet
  //   );
  //   setProcessedData(newProcessedData);

  //   // Update raw data for API calls
  //   updateRawData(updatedSheet, modalType, selectedRowIndex);

  //   setShowModal(false);
  //   setModalData({});
  //   setSelectedRowIndex(null);
  // };

  const openModalWithData = (type, rowIndex = null) => {
    setModalType(type);
    setSelectedRowIndex(rowIndex);

    let initialData = {};

    if (type === "insert") {
      // For insert, pre-fill today's date for the first attribute (date field)
      const dateFieldName = currentSheet?.attributes[0]?.name;
      if (dateFieldName) {
        initialData[dateFieldName] = getTodaysDate();
      }
    } else if (type === "update" && rowIndex !== null) {
      // For update, pre-fill ALL existing data including dates
      currentSheet?.attributes.forEach((attr, attrIndex) => {
        // Include all fields, not just non-derived ones
        const value = attr.data[rowIndex];
        if (value !== undefined && value !== null) {
          initialData[attr.name] = value;
        }
      });
    }

    setModalData(initialData);
    setShowModal(true);
  };

  // const handleInputChange = (fieldName, value) => {
  //   setModalData((prev) => {
  //     const isDateField = fieldName.toLowerCase() === "date";
  //     const processedValue =
  //       isDateField && modalType === "update"
  //         ? convertDateFormat(value, true)
  //         : value;

  //     return {
  //       ...prev,
  //       [fieldName]: processedValue,
  //     };
  //   });
  // };
  const handleInputChange = (fieldName, value) => {
    setModalData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };
  const handleSaveColumnNew = (columnData) => {
    console.log("Saving new column:", columnData);
    const newAttribute = {
      name: columnData.name,
      derived: columnType === "derived",
      formula:
        columnType === "derived"
          ? {
              additionIndices: columnData.additionIndices || [],
              subtractionIndices: columnData.subtractionIndices || [],
            }
          : null,
      linkedFrom: columnData.reference
        ? {
            sheetObjectId: columnData.reference.sheetId,
            attributeIndice: columnData.reference.columnIndex,
          }
        : null,
      "recurrent-check": {
        isRecurrent: false,
        recurrentReferenceIndice: null,
        recurrenceFedStatus: false,
      },
      data: [],
      objectId: "647f191e810c19729de860ea",
      humanFormula: null,
    };

    console.log("New attribute to be added:", newAttribute);

    // Add human formula for derived columns
    if (columnType === "derived" && newAttribute.formula) {
      const additionTerms = (newAttribute.formula["additionIndices"] || []).map(
        (idx) => currentSheet.attributes[idx]?.name || `Column${idx}`
      );
      const subtractionTerms = (
        newAttribute.formula["subtractionIndices"] || []
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
      sheet["_id"] === selectedSheetId ? updatedSheet : sheet
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
                        hoveredAttr.formula["additionIndices"] || [];
                      const subtractionIndices =
                        hoveredAttr.formula["subtractionIndices"] || [];

                      if (additionIndices.includes(index)) {
                        headerClass = "bg-green-200 text-green-900";
                      } else if (subtractionIndices.includes(index)) {
                        headerClass = "bg-red-200 text-red-900";
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
                              : { cell } || (isBlankRow ? "Enter data..." : "")}
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
              const isDateField =
                attr.name.toLowerCase() === "date" || index === 0;

              // Allow date field editing for insert mode, keep read-only for update mode
              const isDateFieldEditable = isDateField && modalType === "insert";
              const finalDisabled =
                isDisabled || (isDateField && modalType === "update");

              let value = modalData[attr.name] || "";

              // Pre-fill date based on modal type
              if (isDateField) {
                if (modalType === "insert") {
                  value = modalData[attr.name] || getTodaysDate();
                } else if (
                  modalType === "update" &&
                  selectedRowIndex !== null
                ) {
                  // Get the actual date from the data for update mode
                  value =
                    currentSheet.attributes[index].data[selectedRowIndex] || "";
                }
              }

              return (
                <div key={index} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {attr.name
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    {columnType === "derived" && " ⭐"}
                    {columnType === "referenced" && " 🔗"}
                    {isDateField &&
                      (modalType === "insert"
                        ? " 📅 (editable)"
                        : " 📅 (read-only)")}
                  </label>
                  <input
                    type={isDateFieldEditable ? "date" : "text"}
                    value={
                      isDateFieldEditable && value
                        ? convertDateFormat(value, false) // Convert to YYYY-MM-DD for date input
                        : value // Show as-is for update mode (display format)
                    }
                    onChange={(e) => {
                      if (!finalDisabled) {
                        const inputValue = isDateFieldEditable
                          ? convertDateFormat(e.target.value, true) // Convert back to display format
                          : e.target.value;
                        handleInputChange(attr.name, inputValue);
                      }
                    }}
                    disabled={finalDisabled}
                    placeholder={
                      isDateField
                        ? modalType === "insert"
                          ? "Select date"
                          : value || "No date set"
                        : "Enter..."
                    }
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm ${
                      columnType === "derived"
                        ? "bg-yellow-50 border-yellow-300"
                        : columnType === "referenced"
                        ? "bg-blue-50 border-blue-300"
                        : isDateField && modalType === "update"
                        ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                        : isDateFieldEditable
                        ? "bg-white border-blue-300 focus:ring-2 focus:ring-blue-500"
                        : "bg-white"
                    } ${finalDisabled ? "cursor-not-allowed opacity-75" : ""}`}
                  />
                  {columnType === "derived" && attr.humanFormula && (
                    <div className="text-xs text-gray-500">
                      Formula: {attr.humanFormula}
                    </div>
                  )}
                  {isDateFieldEditable && (
                    <div className="text-xs text-blue-600">
                      You can change this date or leave it as today's date
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
              {processedData.length > 0 ? (
                filteredSheets.map((sheet) => (
                  <button
                    key={sheet["_id"]}
                    onClick={() => {
                      setSelectedSheetId(sheet["_id"]);
                      // Fetch data if not already cached
                      if (!rawSheetsData[sheet["_id"]]) {
                        fetchSheetData(sheet["_id"]);
                      }
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
            {processedData.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">
                        {currentSheet?.["sheetName"]
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </h1>
                      {/* <p className="text-sm text-gray-500 mt-1">
                        {currentSheet?.department} • Last modified:{" "}
                        {currentSheet?.["modified-by"]}
                      </p> */}
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
