import { useState } from "react";
import {
  Search,
  X,
  Plus,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

//ColumnFormCreation COmponent...
// export const ColumnCreationForm = ({
//   isOpen,
//   onClose,
//   onSave,
//   type,
//   sheets,
//   currentSheetId,
// }) => {
//   const [columnName, setColumnName] = useState("");
//   const [showReference, setShowReference] = useState(false);
//   const [selectedReferenceSheet, setSelectedReferenceSheet] = useState(null);
//   const [selectedReferenceColumn, setSelectedReferenceColumn] = useState(null);
//   const [isReferenceDropdownOpen, setIsReferenceDropdownOpen] = useState(false);

//   const [derivedAdditions, setDerivedAdditions] = useState([]);
//   const [derivedSubtractions, setDerivedSubtractions] = useState([]);

//   const availableSheets = sheets.filter(
//     (sheet) => sheet["object-id"] !== currentSheetId
//   );
//   const currentAttributes =
//     sheets.find((s) => s["object-id"] === currentSheetId)?.attributes || [];

//   const handleSave = () => {
//     console.log("Saving column data...");
//     if (columnName.trim()) {
//       const columnData = {
//         name: columnName.trim(),
//         reference: showReference
//           ? {
//               sheetId: selectedReferenceSheet?.["object-id"],
//               columnIndex: selectedReferenceColumn?.index,
//               columnName: selectedReferenceColumn?.name,
//             }
//           : null,
//         additionIndices: derivedAdditions,
//         subtractionIndices: derivedSubtractions,
//       };

//       onSave(columnData);
//       resetForm();
//       onClose();
//     }
//   };

//   const resetForm = () => {
//     setColumnName("");
//     setShowReference(false);
//     setSelectedReferenceSheet(null);
//     setSelectedReferenceColumn(null);
//     setIsReferenceDropdownOpen(false);
//     setDerivedAdditions([]);
//     setDerivedSubtractions([]);
//   };

//   const handleClose = () => {
//     resetForm();
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
//       <div className="p-6 rounded-lg w-96 bg-white shadow-xl">
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-semibold text-gray-800">
//             Create {type} Column
//           </h3>
//           <button
//             onClick={handleClose}
//             className="text-gray-500 hover:text-gray-900"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Column Name Input */}
//         <div className="mb-4">
//           <label className="block text-sm font-medium mb-2 text-gray-700">
//             Column Name
//           </label>
//           <input
//             type="text"
//             value={columnName}
//             onChange={(e) => setColumnName(e.target.value)}
//             className="w-full px-3 py-2 border rounded-md text-gray-800 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="Enter column name"
//           />
//         </div>

//         {/* Independent Column with Reference */}
//         {type === "independent" && (
//           <div className="mb-4">
//             {!showReference ? (
//               <button
//                 onClick={() => setShowReference(true)}
//                 className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md text-gray-600 border-gray-300 hover:bg-gray-100"
//               >
//                 <Plus className="w-4 h-4" />
//                 Reference Column
//               </button>
//             ) : (
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <label className="text-sm font-medium text-gray-700">
//                     Reference from another sheet
//                   </label>
//                   <button
//                     onClick={() => setShowReference(false)}
//                     className="text-gray-500 hover:text-gray-900"
//                   >
//                     <X className="w-4 h-4" />
//                   </button>
//                 </div>

//                 {/* Sheet Dropdown */}
//                 <div className="relative">
//                   <button
//                     onClick={() =>
//                       setIsReferenceDropdownOpen(!isReferenceDropdownOpen)
//                     }
//                     className="flex items-center justify-between w-full px-3 py-2 border rounded-md bg-white border-gray-300 text-gray-700"
//                   >
//                     <span className="capitalize">
//                       {selectedReferenceSheet
//                         ? selectedReferenceSheet["sheet-name"].replace("-", " ")
//                         : "Select Reference Sheet"}
//                     </span>
//                     <ChevronDown className="w-4 h-4" />
//                   </button>

//                   {isReferenceDropdownOpen && (
//                     <div className="absolute top-full left-0 mt-1 w-full border rounded-md shadow-md bg-white z-10">
//                       {availableSheets.map((sheet) => (
//                         <button
//                           key={sheet["object-id"]}
//                           onClick={() => {
//                             setSelectedReferenceSheet(sheet);
//                             setSelectedReferenceColumn(null);
//                             setIsReferenceDropdownOpen(false);
//                           }}
//                           className="w-full px-3 py-2 text-left hover:bg-gray-100"
//                         >
//                           {sheet["sheet-name"].replace("-", " ")}
//                         </button>
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 {/* Column Selection */}
//                 {selectedReferenceSheet && (
//                   <div className="space-y-2">
//                     <label className="text-sm font-medium text-gray-700">
//                       Select Column
//                     </label>
//                     <div className="max-h-32 overflow-y-auto border rounded-md">
//                       {selectedReferenceSheet.attributes.map((col, index) => (
//                         <button
//                           key={index}
//                           onClick={() =>
//                             setSelectedReferenceColumn({ ...col, index })
//                           }
//                           className={`w-full px-3 py-2 text-left transition-colors ${
//                             selectedReferenceColumn?.index === index
//                               ? "bg-blue-100 text-blue-800"
//                               : "hover:bg-gray-100 text-gray-800"
//                           }`}
//                         >
//                           <div className="flex justify-between items-center">
//                             <span className="capitalize">
//                               {col.name.replace("-", " ")}
//                             </span>
//                             <span
//                               className={`text-xs px-2 py-1 rounded ${
//                                 col.derived
//                                   ? "bg-purple-100 text-purple-700"
//                                   : "bg-blue-100 text-blue-700"
//                               }`}
//                             >
//                               {col.derived ? "Derived" : "Independent"}
//                             </span>
//                           </div>
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Derived Column Selection */}
//         {type === "derived" && (
//           <div className="mb-4 space-y-3">
//             <label className="text-sm font-medium text-gray-700">
//               Select columns to Aggregate
//             </label>

//             <div className="flex items-center gap-4">
//               <button
//                 onClick={() =>
//                   setDerivedAdditions(currentAttributes.map((_, i) => i))
//                 }
//                 className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-700"
//               >
//                 add all
//               </button>
//               <button
//                 onClick={() =>
//                   setDerivedSubtractions(currentAttributes.map((_, i) => i))
//                 }
//                 className="text-xs px-3 py-1 rounded bg-red-100 text-red-700"
//               >
//                 subtract all
//               </button>
//             </div>

//             <div className="space-y-2 max-h-40 overflow-y-auto">
//               {currentAttributes.map((attr, index) => (
//                 <div
//                   key={index}
//                   className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded"
//                 >
//                   <span>{attr.name.replace("-", " ")}</span>
//                   <div className="flex items-center gap-4">
//                     <label className="flex items-center gap-1">
//                       <input
//                         type="checkbox"
//                         checked={derivedAdditions.includes(index)}
//                         onChange={(e) => {
//                           const updated = e.target.checked
//                             ? [...derivedAdditions, index]
//                             : derivedAdditions.filter((i) => i !== index);
//                           setDerivedAdditions(updated);
//                         }}
//                       />
//                       add
//                     </label>
//                     <label className="flex items-center gap-1">
//                       <input
//                         type="checkbox"
//                         checked={derivedSubtractions.includes(index)}
//                         onChange={(e) => {
//                           const updated = e.target.checked
//                             ? [...derivedSubtractions, index]
//                             : derivedSubtractions.filter((i) => i !== index);
//                           setDerivedSubtractions(updated);
//                         }}
//                       />
//                       subtract
//                     </label>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Buttons */}
//         <div className="flex justify-end gap-3 mt-6">
//           <button
//             onClick={handleClose}
//             className="px-4 py-2 border rounded-md text-gray-600 border-gray-300 hover:bg-gray-100"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSave}
//             className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
//           >
//             Save
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };


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
    (sheet) => sheet["object-id"] !== currentSheetId
  );

  // Get current sheet attributes from processed data
  const currentSheet = sheets.find((s) => s["object-id"] === currentSheetId);
  const currentAttributes = currentSheet?.attributes || [];

  const handleSave = () => {
    console.log("Saving column data...");
    if (columnName.trim()) {
      const columnData = {
        name: columnName.trim().toLowerCase().replace(/\s+/g, '-'), // Convert to kebab-case like existing columns
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
      setDerivedAdditions(prev => [...prev.filter(i => i !== index), index]);
      setDerivedSubtractions(prev => prev.filter(i => i !== index));
    } else {
      // Remove from additions
      setDerivedAdditions(prev => prev.filter(i => i !== index));
    }
  };

  const handleSubtractionChange = (index, isChecked) => {
    if (isChecked) {
      // Add to subtractions and remove from additions if present
      setDerivedSubtractions(prev => [...prev.filter(i => i !== index), index]);
      setDerivedAdditions(prev => prev.filter(i => i !== index));
    } else {
      // Remove from subtractions
      setDerivedSubtractions(prev => prev.filter(i => i !== index));
    }
  };

  const handleAddAll = () => {
    // Add all non-derived columns to additions
    const allIndices = currentAttributes
      .map((attr, index) => ({ attr, index }))
      .filter(({ attr }) => !attr.derived && attr.name.toLowerCase() !== 'date')
      .map(({ index }) => index);
    
    setDerivedAdditions(allIndices);
    setDerivedSubtractions([]);
  };

  const handleSubtractAll = () => {
    // Add all non-derived columns to subtractions
    const allIndices = currentAttributes
      .map((attr, index) => ({ attr, index }))
      .filter(({ attr }) => !attr.derived && attr.name.toLowerCase() !== 'date')
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
                        ? selectedReferenceSheet["sheet-name"]
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
                          key={sheet["object-id"]}
                          onClick={() => {
                            setSelectedReferenceSheet(sheet);
                            setSelectedReferenceColumn(null);
                            setIsReferenceDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100"
                        >
                          {sheet["sheet-name"]
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
                                  : col["linked-from"]
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {col.derived ? "Derived" : col["linked-from"] ? "Referenced" : "Independent"}
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
                if (attr.name.toLowerCase() === 'date' || attr.derived) {
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
                      {attr["linked-from"] && (
                        <span className="text-xs text-blue-600">Referenced</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={isInAddition}
                          onChange={(e) => handleAdditionChange(index, e.target.checked)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="text-green-700">add</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={isInSubtraction}
                          onChange={(e) => handleSubtractionChange(index, e.target.checked)}
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
            {(derivedAdditions.length > 0 || derivedSubtractions.length > 0) && (
              <div className="mt-3 p-3 bg-gray-100 rounded-md">
                <div className="text-xs font-medium text-gray-700 mb-1">Formula Preview:</div>
                <div className="flex items-center gap-1 flex-wrap">
                  {derivedAdditions.map((idx, i) => (
                    <span key={`add-${idx}`} className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                      {currentAttributes[idx]?.name
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  ))}
                  {derivedAdditions.length > 0 && derivedSubtractions.length > 0 && (
                    <span className="text-gray-600 mx-1">-</span>
                  )}
                  {derivedSubtractions.map((idx, i) => (
                    <span key={`sub-${idx}`} className="bg-red-600 text-white px-2 py-1 rounded text-xs">
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
            disabled={!columnName.trim() || (type === "derived" && derivedAdditions.length === 0 && derivedSubtractions.length === 0)}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
