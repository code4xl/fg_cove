import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  Plus,
  Star,
  Settings,
  Users,
  BarChart3,
  Menu,
  ChevronDown,
  Filter,
  Calendar,
  Download,
  Sparkles,
} from "lucide-react";

// Data Input Modal Component
const DataInputModal = ({
  isOpen,
  onClose,
  onUpdate,
  sheet,
  metadata,
  currentDate,
}) => {
  const [inputValues, setInputValues] = useState({});

  useEffect(() => {
    if (isOpen && sheet && metadata) {
      const initialValues = {};
      metadata.attributes.forEach((attr, index) => {
        if (!attr.derived && !attr["linked-from"]) {
          initialValues[attr.name] = "";
        }
      });
      setInputValues(initialValues);
    }
  }, [isOpen, sheet, metadata]);

  if (!isOpen) return null;

  const handleInputChange = (name, value) => {
    setInputValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = () => {
    onUpdate(inputValues);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-5xl mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Values to be fed today
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {metadata.attributes.map((attr, index) => {
            const isLinked = attr["linked-from"];
            const isDerived = attr.derived;
            const isEditable = !isLinked && !isDerived;

            return (
              <div key={attr.name} className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  {attr.name
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={isEditable ? inputValues[attr.name] || "" : "255.43"}
                    onChange={(e) =>
                      isEditable && handleInputChange(attr.name, e.target.value)
                    }
                    className={`w-full px-4 py-2.5 rounded-lg text-sm transition-all ${
                      isEditable
                        ? "bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        : isDerived
                        ? "bg-yellow-50 border border-yellow-200 text-gray-700"
                        : "bg-gray-50 border border-gray-200 text-gray-700"
                    }`}
                    disabled={!isEditable}
                    placeholder={isEditable ? "Enter value..." : ""}
                  />
                  {!isEditable && (
                    <Sparkles className="absolute right-3 top-3 w-4 h-4 text-blue-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

// Update Row Modal Component
const UpdateRowModal = ({
  isOpen,
  onClose,
  onUpdate,
  selectedRow,
  sheet,
  metadata,
  rowDate,
}) => {
  const [inputValues, setInputValues] = useState({});

  useEffect(() => {
    if (isOpen && selectedRow !== null && sheet && metadata) {
      const initialValues = {};
      metadata.attributes.forEach((attr, index) => {
        initialValues[attr.name] = sheet.attributes[index]?.[selectedRow] || "";
      });
      setInputValues(initialValues);
    }
  }, [isOpen, selectedRow, sheet, metadata]);

  if (!isOpen) return null;

  const handleInputChange = (name, value) => {
    setInputValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = () => {
    onUpdate(inputValues, selectedRow);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-5xl mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Update Row Data
        </h2>
        <p className="text-sm text-gray-600 mb-6">Editing data for {rowDate}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {metadata.attributes.map((attr, index) => {
            const isLinked = attr["linked-from"];
            const isDerived = attr.derived;
            const isEditable = !isLinked && !isDerived;

            return (
              <div key={attr.name} className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  {attr.name
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputValues[attr.name] || ""}
                    onChange={(e) =>
                      isEditable && handleInputChange(attr.name, e.target.value)
                    }
                    className={`w-full px-4 py-2.5 rounded-lg text-sm transition-all ${
                      isEditable
                        ? "bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        : isDerived
                        ? "bg-yellow-50 border border-yellow-200 text-gray-700"
                        : "bg-gray-50 border border-gray-200 text-gray-700"
                    }`}
                    disabled={!isEditable}
                    placeholder={isEditable ? "Enter value..." : ""}
                  />
                  {!isEditable && (
                    <Sparkles className="absolute right-3 top-3 w-4 h-4 text-blue-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

//ColumnCreationForm Component
const ColumnCreationForm = ({
  isOpen,
  onClose,
  onSave,
  type,
  sheets,
  currentSheetId,
}) => {
  const [columnName, setColumnName] = useState("");
  const [showReference, setShowReference] = useState(false);
  const [selectedReferenceSheet, setSelectedReferenceSheet] = useState(null);
  const [selectedReferenceColumn, setSelectedReferenceColumn] = useState(null);
  const [isReferenceDropdownOpen, setIsReferenceDropdownOpen] = useState(false);

  const [derivedAdditions, setDerivedAdditions] = useState([]);
  const [derivedSubtractions, setDerivedSubtractions] = useState([]);

  const availableSheets = sheets.filter(
    (sheet) => sheet["object-id"] !== currentSheetId
  );
  const currentAttributes =
    sheets.find((s) => s["object-id"] === currentSheetId)?.attributes || [];

  const handleSave = () => {
    if (columnName.trim()) {
      const columnData = {
        name: columnName.trim(),
        reference: showReference
          ? {
              sheetId: selectedReferenceSheet?.["object-id"],
              columnIndex: selectedReferenceColumn?.index,
              columnName: selectedReferenceColumn?.name,
            }
          : null,
        additionIndices: derivedAdditions,
        subtractionIndices: derivedSubtractions,
      };

      onSave(columnData);
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setColumnName("");
    setShowReference(false);
    setSelectedReferenceSheet(null);
    setSelectedReferenceColumn(null);
    setIsReferenceDropdownOpen(false);
    setDerivedAdditions([]);
    setDerivedSubtractions([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="p-6 rounded-lg w-96 bg-white shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Create {type} Column
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Column Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Column Name
          </label>
          <input
            type="text"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-gray-800 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter column name"
          />
        </div>

        {/* Independent Column with Reference */}
        {type === "independent" && (
          <div className="mb-4">
            {!showReference ? (
              <button
                onClick={() => setShowReference(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md text-gray-600 border-gray-300 hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
                Reference Column
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Reference from another sheet
                  </label>
                  <button
                    onClick={() => setShowReference(false)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sheet Dropdown */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setIsReferenceDropdownOpen(!isReferenceDropdownOpen)
                    }
                    className="flex items-center justify-between w-full px-3 py-2 border rounded-md bg-white border-gray-300 text-gray-700"
                  >
                    <span className="capitalize">
                      {selectedReferenceSheet
                        ? selectedReferenceSheet["sheet-name"].replace("-", " ")
                        : "Select Reference Sheet"}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {isReferenceDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full border rounded-md shadow-md bg-white z-10">
                      {availableSheets.map((sheet) => (
                        <button
                          key={sheet["object-id"]}
                          onClick={() => {
                            setSelectedReferenceSheet(sheet);
                            setSelectedReferenceColumn(null);
                            setIsReferenceDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100"
                        >
                          {sheet["sheet-name"].replace("-", " ")}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column Selection */}
                {selectedReferenceSheet && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Select Column
                    </label>
                    <div className="max-h-32 overflow-y-auto border rounded-md">
                      {selectedReferenceSheet.attributes.map((col, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            setSelectedReferenceColumn({ ...col, index })
                          }
                          className={`w-full px-3 py-2 text-left transition-colors ${
                            selectedReferenceColumn?.index === index
                              ? "bg-blue-100 text-blue-800"
                              : "hover:bg-gray-100 text-gray-800"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="capitalize">
                              {col.name.replace("-", " ")}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                col.derived
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {col.derived ? "Derived" : "Independent"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Derived Column Selection */}
        {type === "derived" && (
          <div className="mb-4 space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Select columns to Aggregate
            </label>

            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  setDerivedAdditions(currentAttributes.map((_, i) => i))
                }
                className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-700"
              >
                add all
              </button>
              <button
                onClick={() =>
                  setDerivedSubtractions(currentAttributes.map((_, i) => i))
                }
                className="text-xs px-3 py-1 rounded bg-red-100 text-red-700"
              >
                subtract all
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {currentAttributes.map((attr, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded"
                >
                  <span>{attr.name.replace("-", " ")}</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={derivedAdditions.includes(index)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...derivedAdditions, index]
                            : derivedAdditions.filter((i) => i !== index);
                          setDerivedAdditions(updated);
                        }}
                      />
                      add
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={derivedSubtractions.includes(index)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...derivedSubtractions, index]
                            : derivedSubtractions.filter((i) => i !== index);
                          setDerivedSubtractions(updated);
                        }}
                      />
                      subtract
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 border rounded-md text-gray-600 border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const SheetsApp = () => {
  const [userRole] = useState("admin");
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRowDate, setSelectedRowDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sheets, setSheets] = useState([]);
  const [metadata, setMetadata] = useState([]);
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [pendingInserts, setPendingInserts] = useState([]);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [columnType, setColumnType] = useState(null);
  const [showColumnTypeDropdown, setShowColumnTypeDropdown] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getSheetData = (metaId) => {
    return sheets.find((s) => s["user-id"] === metaId);
  };

  const calculateDerivedColumn = (sheetData, formula) => {
    if (!formula || !sheetData || !sheetData.attributes) return [];

    const numRecords = sheetData.attributes[0]?.length || 0;
    const derivedValues = [];

    for (let recordIndex = 0; recordIndex < numRecords; recordIndex++) {
      let value = 0;

      if (formula["addition-indices"]) {
        formula["addition-indices"].forEach((index) => {
          if (
            sheetData.attributes[index] &&
            sheetData.attributes[index][recordIndex] !== undefined
          ) {
            value += sheetData.attributes[index][recordIndex];
          }
        });
      }

      if (formula["subtraction-indices"]) {
        formula["subtraction-indices"].forEach((index) => {
          if (
            sheetData.attributes[index] &&
            sheetData.attributes[index][recordIndex] !== undefined
          ) {
            value -= sheetData.attributes[index][recordIndex];
          }
        });
      }

      derivedValues.push(value);
    }

    return derivedValues;
  };

  const getCompleteSheetData = (metaSheet) => {
    const sheetData = getSheetData(metaSheet["object-id"]);
    if (!sheetData) return { attributes: [], numRecords: 0 };

    const completeAttributes = [...sheetData.attributes];

    metaSheet.attributes.forEach((attr, index) => {
      if (attr.derived && attr.formula) {
        const derivedValues = calculateDerivedColumn(sheetData, attr.formula);
        completeAttributes[index] = derivedValues;
      }
    });

    const numRecords = sheetData.attributes[0]?.length || 0;

    return {
      attributes: completeAttributes,
      numRecords: numRecords,
      date: sheetData.date,
    };
  };

  const getDisplayData = (metaSheet) => {
    const completeData = getCompleteSheetData(metaSheet);
    if (!completeData.attributes.length) return [];

    const displayData = [];

    for (let i = 0; i < completeData.numRecords; i++) {
      const record = {
        date: new Date(Date.parse(completeData.date) + i * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        values: completeData.attributes.map((attr) =>
          attr?.[i] !== undefined ? attr[i] : null
        ),
      };
      displayData.push(record);
    }

    return displayData;
  };

  const handleSaveColumn = (columnData) => {
    const updatedMetadata = [...metadata];
    const currentMeta = updatedMetadata[selectedSheet];

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
      "linked-from":
        columnType === "independent" && columnData.reference
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
    };

    currentMeta.attributes.push(newAttribute);
    setSheets((prevSheets) =>
      prevSheets.map((sheet, idx) => {
        if (sheet["user-id"] === currentMeta["object-id"]) {
          const attrLength = sheet.attributes[0]?.length || 0;
          return {
            ...sheet,
            attributes: [...sheet.attributes, Array(attrLength).fill(0)],
          };
        }
        return sheet;
      })
    );
    setMetadata(updatedMetadata);

    // Simulate backend update
    console.log("Sending updated metadata to backend:", updatedMetadata);
  };

  // Sample data
  useEffect(() => {
    const sampleMetadata = [
      {
        "object-id": "sheet-meta-1",
        "sheet-name": "raw-material-warehouse",
        department: "Operations",
        "last-modified": "2025-05-29T10:30:00Z",
        "modified-by": "John Doe",
        attributes: [
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
        "object-id": "sheet-meta-2",
        "sheet-name": "finished-goods",
        department: "Production",
        "last-modified": "2025-05-29T14:45:00Z",
        "modified-by": "Sarah Wilson",
        attributes: [
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

    const sampleSheets = [
      {
        "object-id": "sheet-data-1",
        "user-id": "sheet-meta-1",
        date: "2025-05-01T00:00:00Z",
        attributes: [
          [
            100, 200, 150, 120, 180, 110, 190, 160, 140, 170, 130, 210, 145,
            125, 185, 115, 195, 165, 135, 175, 155, 205, 175, 145, 165, 135,
            155, 125, 195,
          ],
          [
            50, 70, 60, 45, 85, 55, 75, 65, 40, 80, 60, 90, 70, 50, 85, 45, 95,
            75, 55, 80, 65, 100, 80, 60, 75, 50, 70, 45, 90,
          ],
          [
            20, 10, 15, 25, 30, 18, 12, 22, 28, 35, 25, 8, 20, 30, 15, 22, 10,
            18, 32, 12, 28, 5, 25, 35, 20, 30, 15, 25, 10,
          ],
          [
            30, 20, 25, 15, 35, 28, 22, 32, 18, 40, 30, 15, 25, 20, 30, 18, 25,
            35, 22, 28, 32, 12, 30, 40, 25, 35, 20, 30, 15,
          ],
        ],
      },
      {
        "object-id": "sheet-data-2",
        "user-id": "sheet-meta-2",
        date: "2025-01-01T00:00:00Z",
        attributes: [
          [30, 20, 25, 15, 35],
          [100, 120, 110, 95, 130],
          [5, 3, 4, 2, 6],
        ],
      },
    ];

    setMetadata(sampleMetadata);
    setSheets(sampleSheets);

    // Check if today's data exists
    const today = new Date().toISOString().split("T")[0];
    const currentSheet = sampleSheets[0];
    const lastRowIndex = currentSheet.attributes[0].length - 1;
    const lastDate = new Date(currentSheet.date);
    lastDate.setDate(lastDate.getDate() + lastRowIndex);

    if (lastDate.toISOString().split("T")[0] !== today) {
      setShowDataModal(true);
    }
  }, []);

  const filteredMetadata = metadata.filter(
    (sheet) =>
      sheet["sheet-name"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentSheet = sheets[selectedSheet];
  const currentMetadata = metadata[selectedSheet];

  const handleUpdateButtonClick = () => {
    setShowDataModal(true);
  };

  const handleRowClick = (rowIndex, rowDate) => {
    setSelectedRow(rowIndex);
    setSelectedRowDate(rowDate);
    setShowUpdateModal(true);
  };

  const handleDataUpdate = (inputValues) => {
    const currentDate = new Date().toISOString().split("T")[0];
    const currentSheetData = sheets.find(
      (s) => s["user-id"] === currentMetadata["object-id"]
    );

    // Create new record
    const newRecord = currentMetadata.attributes.map((attr, index) => {
      if (attr.derived && attr.formula) {
        return 0; // Will be calculated
      }
      if (attr["linked-from"]) {
        // Get linked value from source sheet
        const sourceSheet = sheets.find(
          (s) => s["user-id"] === attr["linked-from"]["sheet-object-id"]
        );
        return (
          sourceSheet?.attributes[
            attr["linked-from"]["attribute-indice"]
          ]?.slice(-1)[0] || 0
        );
      }
      return parseFloat(inputValues[attr.name]) || 0;
    });

    // Update local state
    const updatedSheets = sheets.map((sheet) => {
      if (sheet["user-id"] === currentMetadata["object-id"]) {
        const updatedAttributes = sheet.attributes.map((attrArray, index) => {
          const newArray = [...attrArray];
          newArray.push(newRecord[index]);
          return newArray;
        });

        // Calculate derived values
        currentMetadata.attributes.forEach((attr, index) => {
          if (attr.derived && attr.formula) {
            const value = calculateDerivedValue(
              updatedAttributes,
              attr.formula,
              updatedAttributes[0].length - 1
            );
            updatedAttributes[index][updatedAttributes[0].length - 1] = value;
          }
        });

        return { ...sheet, attributes: updatedAttributes };
      }
      return sheet;
    });

    setSheets(updatedSheets);
    setShowDataModal(false);

    // Track this insert
    setPendingInserts((prev) => [
      ...prev,
      {
        sheetId: currentMetadata["object-id"],
        date: currentDate,
        values: newRecord,
        timestamp: new Date().toISOString(),
      },
    ]);

    // Prepare data for backend
    sendToBackend(updatedSheets, pendingUpdates, [
      ...pendingInserts,
      {
        sheetId: currentMetadata["object-id"],
        date: currentDate,
        values: newRecord,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleRowUpdate = (inputValues, rowIndex) => {
    const currentSheetData = sheets.find(
      (s) => s["user-id"] === currentMetadata["object-id"]
    );
    const originalValues = {};

    // Store original values
    currentMetadata.attributes.forEach((attr, index) => {
      originalValues[attr.name] = currentSheetData.attributes[index][rowIndex];
    });

    // Update local state
    const updatedSheets = sheets.map((sheet) => {
      if (sheet["user-id"] === currentMetadata["object-id"]) {
        const updatedAttributes = sheet.attributes.map((attrArray, index) => {
          const attr = currentMetadata.attributes[index];
          const newArray = [...attrArray];

          if (!attr.derived && !attr["linked-from"]) {
            newArray[rowIndex] = parseFloat(inputValues[attr.name]) || 0;
          }
          return newArray;
        });

        // Recalculate derived values
        currentMetadata.attributes.forEach((attr, index) => {
          if (attr.derived && attr.formula) {
            const value = calculateDerivedValue(
              updatedAttributes,
              attr.formula,
              rowIndex
            );
            updatedAttributes[index][rowIndex] = value;
          }
        });

        return { ...sheet, attributes: updatedAttributes };
      }
      return sheet;
    });

    setSheets(updatedSheets);

    // Track this update
    const updateRecord = {
      sheetId: currentMetadata["object-id"],
      rowIndex: rowIndex,
      originalValues: originalValues,
      newValues: inputValues,
      timestamp: new Date().toISOString(),
    };

    setPendingUpdates((prev) => [...prev, updateRecord]);

    // Prepare data for backend
    sendToBackend(
      updatedSheets,
      [...pendingUpdates, updateRecord],
      pendingInserts
    );
  };

  const calculateDerivedValue = (attributes, formula, recordIndex) => {
    let value = 0;

    if (formula["addition-indices"]) {
      formula["addition-indices"].forEach((index) => {
        if (attributes[index] && attributes[index][recordIndex] !== undefined) {
          value += attributes[index][recordIndex];
        }
      });
    }

    if (formula["subtraction-indices"]) {
      formula["subtraction-indices"].forEach((index) => {
        if (attributes[index] && attributes[index][recordIndex] !== undefined) {
          value -= attributes[index][recordIndex];
        }
      });
    }

    return value;
  };

  // Add function to send data to backend
  const sendToBackend = (completeSheetData, updates, inserts) => {
    const payload = {
      timestamp: new Date().toISOString(),
      completeSheetData: completeSheetData,
      updates: updates,
      inserts: inserts,
      metadata: {
        sheetId: currentMetadata["object-id"],
        sheetName: currentMetadata["sheet-name"],
        lastModifiedBy: "Current User", // Replace with actual user
      },
    };

    console.log("Sending to backend:", payload);

    // TODO: Replace with actual API call
    // fetch('/api/sheets/update', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // }).then(response => {
    //   if (response.ok) {
    //     setPendingUpdates([]);
    //     setPendingInserts([]);
    //   }
    // });
  };

  const formatColumnName = (name) => {
    if (name === "pp-hkr-102-issued-to-tape-line") {
      return "PP-HKR 102 issued to Tape line";
    }
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const checkTodayData = (sheetIndex) => {
    const today = new Date().toISOString().split("T")[0];
    const targetSheet = sheets[sheetIndex];
    const targetMetadata = metadata[sheetIndex];

    if (!targetSheet || !targetMetadata) return;

    const lastRowIndex = targetSheet.attributes[0].length - 1;
    const lastDate = new Date(targetSheet.date);
    lastDate.setDate(lastDate.getDate() + lastRowIndex);

    if (lastDate.toISOString().split("T")[0] !== today) {
      setShowDataModal(true);
    }
  };

  if (!currentSheet || !currentMetadata) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation */}
      {/* <div className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-semibold text-gray-900">Sheets</h1>
            <nav className="flex items-center space-x-6">
              <a
                href="#"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Dashboard
              </a>
              <a href="#" className="text-blue-600 font-medium">
                Sheets
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Reports
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Users className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              JD
            </div>
          </div>
        </div>
      </div> */}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`bg-gray-100/30 shadow-sm transition-all duration-300 ${
            sidebarOpen ? "w-80" : "w-0"
          } overflow-hidden`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Sheets</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sheets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="px-3">
            {filteredMetadata.map((sheet, index) => (
              <button
                key={sheet["object-id"]}
                onClick={() => {
                  setSelectedSheet(index);
                  checkTodayData(index);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-all ${
                  selectedSheet === index
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="font-medium">
                  {formatColumnName(sheet["sheet-name"])}
                </div>
                {/* {sheet.department && (
                  <div className="text-xs text-gray-500 mt-1">
                    {sheet.department}
                  </div>
                )} */}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <Menu className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Last 30 days
                    </span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Filter className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Status
                    </span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <BarChart3 className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Columns
                    </span>
                  </button>
                </div>
              </div>

              {/* <button
                onClick={handleUpdateButtonClick}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-600/20"
              >
                Update
              </button> */}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto rounded-[2rem] scrollbar-hide">
            <div className="min-w-full flex flex-row rounded-full">
              <table className="w-full ">
                <thead className="">
                  <tr className="bg-gray-100">
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    {currentMetadata.attributes.map((attr, index) => (
                      <th
                        key={index}
                        className="px-6 py-4 text-center text-sm font-semibold text-gray-700 "
                      >
                        {formatColumnName(attr.name)}
                      </th>
                    ))}
                    {/* {userRole === "admin" && (
                      <th className="px-6 py-4 text-right">
                        <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-600 transition-colors ml-auto">
                          <Plus className="w-4 h-4" />
                          <span className="text-sm">Add Attribute</span>
                        </button>
                      </th>
                    )} */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(() => {
                    const displayData = getDisplayData(currentMetadata);
                    return displayData.map((record, rowIndex) => {
                      const rowDate = formatDate(record.date);
                      const isLastRow = rowIndex === displayData.length - 1;
                      const hasIncompleteData = false; // Can be implemented based on your logic

                      return (
                        <tr
                          key={rowIndex}
                          onClick={() => handleRowClick(rowIndex, rowDate)}
                          className="hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <td className="px-8 py-4 text-sm font-medium text-gray-900 text-left">
                            {rowDate}
                          </td>
                          {currentMetadata.attributes.map((attr, colIndex) => {
                            const value = record.values[colIndex];
                            const displayValue =
                              value !== null && value !== undefined
                                ? value
                                : "--";
                            const isLinked = attr["linked-from"];
                            const isDerived = attr.derived;

                            return (
                              <td
                                key={colIndex}
                                className={`px-6 py-4 text-sm ${
                                  isDerived
                                    ? "text-gray-950 flex items-center justify-center"
                                    : isLinked
                                    ? "text-gray-950 flex items-center justify-center"
                                    : "text-gray-900 font-medium"
                                } text-center`}
                              >
                                <div
                                  className={`${
                                    isDerived
                                      ? "flex items-center justify-center w-30 flex-wrap bg-yellow-200 rounded-full px-3 py-2"
                                      : isLinked
                                      ? "flex items-center justify-center w-30 flex-wrap bg-gray-200 rounded-full px-3 py-2"
                                      : ""
                                  }`}
                                >
                                  {displayValue}
                                </div>
                              </td>
                            );
                          })}
                          {/* {userRole === "admin" && (
                            <td className="px-6 py-4 text-sm text-gray-500">
                            </td>
                          )} */}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
              {userRole === "admin" && (
                <div
                  className="flex items-center justify-center bg-gray-50 border-l border-gray-200 px-4 relative"
                  style={{ minWidth: "150px" }}
                >
                  <div className="relative">
                    <button
                      onClick={() => setShowColumnTypeDropdown((prev) => !prev)}
                      className="flex flex-col items-center text-sm text-gray-700 hover:text-blue-600"
                    >
                      <Plus className="w-5 h-5 mb-1" />
                      Add Attribute
                    </button>

                    {showColumnTypeDropdown && (
                      <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md border border-gray-200 z-50">
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
                  </div>

                  <button className="flex flex-col items-center text-sm text-gray-700 hover:text-blue-600">
                    <Plus className="w-5 h-5 mb-1" />
                    Add Attribute
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DataInputModal
        isOpen={showDataModal}
        onClose={() => setShowDataModal(false)}
        onUpdate={handleDataUpdate}
        sheet={currentSheet}
        metadata={currentMetadata}
        currentDate={new Date().toISOString()}
      />

      <UpdateRowModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onUpdate={handleRowUpdate}
        selectedRow={selectedRow}
        sheet={currentSheet}
        metadata={currentMetadata}
        rowDate={selectedRowDate}
      />

      <ColumnCreationForm
        isOpen={showColumnModal}
        onClose={() => setShowColumnModal(false)}
        onSave={handleSaveColumn}
        type={columnType}
        sheets={metadata}
        currentSheetId={currentMetadata["object-id"]}
      />
    </div>
  );
};

export default SheetsApp;
