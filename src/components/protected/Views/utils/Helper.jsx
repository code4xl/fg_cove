import { useState, useEffect } from "react";
import { X, Plus, ChevronDown, Minus, Info } from "lucide-react";

export const ColumnCreationForm = ({
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

  // Get available sheets (excluding current sheet) from processed data
  const availableSheets = sheets.filter(
    (sheet) => sheet["_id"] !== currentSheetId
  );

  // Get current sheet attributes from processed data
  const currentSheet = sheets.find((s) => s["_id"] === currentSheetId);
  const currentAttributes = currentSheet?.attributes || [];

  const handleSave = () => {
    console.log("Saving column data...");
    if (columnName.trim()) {
      const columnData = {
        name: columnName.trim().toLowerCase().replace(/\s+/g, "-"), // Convert to kebab-case like existing columns
        reference: showReference
          ? {
              sheetId: selectedReferenceSheet?.["_id"],
              columnIndex: selectedReferenceColumn?.index,
              columnName: selectedReferenceColumn?.name,
            }
          : null,
        additionIndices: derivedAdditions,
        subtractionIndices: derivedSubtractions,
      };

      console.log("Column data being saved:", columnData);
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

  // Handle checkbox changes to prevent conflicts between addition and subtraction
  const handleAdditionChange = (index, isChecked) => {
    if (isChecked) {
      // Add to additions and remove from subtractions if present
      setDerivedAdditions((prev) => [
        ...prev.filter((i) => i !== index),
        index,
      ]);
      setDerivedSubtractions((prev) => prev.filter((i) => i !== index));
    } else {
      // Remove from additions
      setDerivedAdditions((prev) => prev.filter((i) => i !== index));
    }
  };

  const handleSubtractionChange = (index, isChecked) => {
    if (isChecked) {
      // Add to subtractions and remove from additions if present
      setDerivedSubtractions((prev) => [
        ...prev.filter((i) => i !== index),
        index,
      ]);
      setDerivedAdditions((prev) => prev.filter((i) => i !== index));
    } else {
      // Remove from subtractions
      setDerivedSubtractions((prev) => prev.filter((i) => i !== index));
    }
  };

  const handleAddAll = () => {
    // Add all non-derived columns to additions
    const allIndices = currentAttributes
      .map((attr, index) => ({ attr, index }))
      .filter(({ attr }) => attr.name.toLowerCase() !== "date")
      .map(({ index }) => index);

    setDerivedAdditions(allIndices);
    setDerivedSubtractions([]);
  };

  const handleSubtractAll = () => {
    // Add all non-derived columns to subtractions
    const allIndices = currentAttributes
      .map((attr, index) => ({ attr, index }))
      .filter(({ attr }) => attr.name.toLowerCase() !== "date")
      .map(({ index }) => index);

    setDerivedSubtractions(allIndices);
    setDerivedAdditions([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
      <div className="p-6 rounded-lg w-96 bg-white shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Create {type === "derived" ? "Derived" : "Independent"} Column
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
                        ? selectedReferenceSheet["sheetName"]
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())
                        : "Select Reference Sheet"}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {isReferenceDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full border rounded-md shadow-md bg-white z-10">
                      {availableSheets.map((sheet) => (
                        <button
                          key={sheet["_id"]}
                          onClick={() => {
                            setSelectedReferenceSheet(sheet);
                            setSelectedReferenceColumn(null);
                            setIsReferenceDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100"
                        >
                          {sheet["sheetName"]
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
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
                              {col.name
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                col.derived
                                  ? "bg-yellow-100 text-yellow-700"
                                  : col["linkedFrom"] &&
                                    col["linkedFrom"].sheetObjectId
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {col.derived
                                ? "Derived"
                                : col["linkedFrom"] &&
                                  col["linkedFrom"].sheetObjectId
                                ? "Referenced"
                                : "Independent"}
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
                onClick={handleAddAll}
                className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
              >
                add all
              </button>
              <button
                onClick={handleSubtractAll}
                className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
              >
                subtract all
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {currentAttributes.map((attr, index) => {
                // Skip date columns and other derived columns
                if (attr.name.toLowerCase() === "date") {
                  return null;
                }

                const isInAddition = derivedAdditions.includes(index);
                const isInSubtraction = derivedSubtractions.includes(index);

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {attr.name
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      {attr["linkedFrom"] &&
                        attr["linkedFrom"].sheetObjectId && (
                          <span className="text-xs text-blue-600">
                            Referenced
                          </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={isInAddition}
                          onChange={(e) =>
                            handleAdditionChange(index, e.target.checked)
                          }
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="text-green-700">add</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={isInSubtraction}
                          onChange={(e) =>
                            handleSubtractionChange(index, e.target.checked)
                          }
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="text-red-700">subtract</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formula Preview */}
            {(derivedAdditions.length > 0 ||
              derivedSubtractions.length > 0) && (
              <div className="mt-3 p-3 bg-gray-100 rounded-md">
                <div className="text-xs font-medium text-gray-700 mb-1">
                  Formula Preview:
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {derivedAdditions.map((idx, i) => (
                    <span
                      key={`add-${idx}`}
                      className="bg-green-600 text-white px-2 py-1 rounded text-xs"
                    >
                      {currentAttributes[idx]?.name
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  ))}
                  {derivedAdditions.length > 0 &&
                    derivedSubtractions.length > 0 && (
                      <span className="text-gray-600 mx-1">-</span>
                    )}
                  {derivedSubtractions.map((idx, i) => (
                    <span
                      key={`sub-${idx}`}
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      {currentAttributes[idx]?.name
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
            disabled={
              !columnName.trim() ||
              (type === "derived" &&
                derivedAdditions.length === 0 &&
                derivedSubtractions.length === 0)
            }
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export const ColumnUpdateForm = ({
  isOpen,
  onClose,
  onSave,
  existingColumns = [],
  existingData = {},
}) => {
  const [columnName, setColumnName] = useState("");
  const [additionIndices, setAdditionIndices] = useState([]);
  const [subtractionIndices, setSubtractionIndices] = useState([]);
  const [reference, setReference] = useState(null);
  const [errors, setErrors] = useState({});
  const [isDerived, setIsDerived] = useState(false);

  // Initialize form with existing data
  useEffect(() => {
    if (existingData && isOpen) {
      setColumnName(existingData.name || "");
      setAdditionIndices(existingData.additionIndices || []);
      setSubtractionIndices(existingData.subtractionIndices || []);
      setReference(existingData.reference || null);
      setIsDerived(existingData.isDerived || false);
    }
  }, [existingData, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!columnName.trim()) {
      newErrors.columnName = "Column name is required";
    }

    if (isDerived) {
      if (additionIndices.length === 0 && subtractionIndices.length === 0) {
        newErrors.formula = "At least one column must be selected for formula";
      }

      // Check for overlapping indices
      const overlap = additionIndices.some((idx) =>
        subtractionIndices.includes(idx)
      );
      if (overlap) {
        newErrors.formula = "A column cannot be both added and subtracted";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const formData = {
      name: columnName.trim(),
      additionIndices: isDerived ? additionIndices : [],
      subtractionIndices: isDerived ? subtractionIndices : [],
      reference: reference,
    };

    onSave(formData);
  };

  const handleClose = () => {
    setColumnName("");
    setAdditionIndices([]);
    setSubtractionIndices([]);
    setReference(null);
    setErrors({});
    setIsDerived(false);
    onClose();
  };

  const toggleColumnInFormula = (columnIndex, type) => {
    if (type === "addition") {
      setAdditionIndices((prev) =>
        prev.includes(columnIndex)
          ? prev.filter((idx) => idx !== columnIndex)
          : [...prev, columnIndex]
      );
    } else {
      setSubtractionIndices((prev) =>
        prev.includes(columnIndex)
          ? prev.filter((idx) => idx !== columnIndex)
          : [...prev, columnIndex]
      );
    }
  };

  const generateFormulaPreview = () => {
    if (
      !isDerived ||
      (additionIndices.length === 0 && subtractionIndices.length === 0)
    ) {
      return "No formula";
    }

    const additionTerms = additionIndices.map(
      (idx) => existingColumns[idx]?.name || `Column${idx}`
    );
    const subtractionTerms = subtractionIndices.map(
      (idx) => existingColumns[idx]?.name || `Column${idx}`
    );

    const parts = [];
    if (additionTerms.length > 0) {
      parts.push(additionTerms.join(" + "));
    }
    if (subtractionTerms.length > 0) {
      parts.push(" - " + subtractionTerms.join(" - "));
    }
    return parts.join("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Update Column</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Column Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Column Name *
            </label>
            <input
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.columnName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter column name"
            />
            {errors.columnName && (
              <p className="mt-1 text-sm text-red-600">{errors.columnName}</p>
            )}
          </div>

          {/* Column Type Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Column Type
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setIsDerived(false)}
                className={`px-4 py-2 rounded-md border transition-all ${
                  !isDerived
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Independent
              </button>
              <button
                onClick={() => setIsDerived(true)}
                className={`px-4 py-2 rounded-md border transition-all ${
                  isDerived
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Derived (Formula)
              </button>
            </div>
          </div>

          {/* Formula Section - Only show if derived */}
          {isDerived && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Formula Configuration
                </label>
                <Info className="w-4 h-4 text-gray-400" />
              </div>

              {/* Formula Preview */}
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600 mb-1">Formula Preview:</p>
                <p className="font-mono text-sm text-gray-800">
                  {generateFormulaPreview()}
                </p>
              </div>

              {/* Column Selection */}
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Select columns to include in formula:
                </p>
                {existingColumns.map((column, index) => {
                  if (index === existingData.currentColumnIndex) {
                    return null;
                  }
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {column.name}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            toggleColumnInFormula(index, "addition")
                          }
                          className={`flex items-center px-3 py-1 rounded text-xs font-medium transition-all ${
                            additionIndices.includes(index)
                              ? "bg-green-100 text-green-800 border border-green-300"
                              : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-green-50"
                          }`}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </button>
                        <button
                          onClick={() =>
                            toggleColumnInFormula(index, "subtraction")
                          }
                          className={`flex items-center px-3 py-1 rounded text-xs font-medium transition-all ${
                            subtractionIndices.includes(index)
                              ? "bg-red-100 text-red-800 border border-red-300"
                              : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-red-50"
                          }`}
                        >
                          <Minus className="w-3 h-3 mr-1" />
                          Subtract
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {errors.formula && (
                <p className="mt-2 text-sm text-red-600">{errors.formula}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={Object.keys(errors).length > 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Update Column
          </button>
        </div>
      </div>
    </div>
  );
};
