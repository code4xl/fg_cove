import React, { useState } from 'react';
import { X, Plus, Minus, Calculator, Database } from 'lucide-react';

const NodeCreationModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  attributes, 
  availableSheets = [] 
}) => {
  const [nodeName, setNodeName] = useState('');
  const [nodeType, setNodeType] = useState('independent');
  const [additionIndices, setAdditionIndices] = useState([]);
  const [subtractionIndices, setSubtractionIndices] = useState([]);
  const [showReference, setShowReference] = useState(false);
  const [selectedReferenceSheet, setSelectedReferenceSheet] = useState(null);
  const [selectedReferenceColumn, setSelectedReferenceColumn] = useState(null);

  const resetForm = () => {
    setNodeName('');
    setNodeType('independent');
    setAdditionIndices([]);
    setSubtractionIndices([]);
    setShowReference(false);
    setSelectedReferenceSheet(null);
    setSelectedReferenceColumn(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    if (!nodeName.trim()) return;

    const nodeData = {
      name: nodeName.trim(),
      type: nodeType,
      additionIndices: nodeType === 'derived' ? additionIndices : [],
      subtractionIndices: nodeType === 'derived' ? subtractionIndices : [],
      reference: showReference ? {
        sheetId: selectedReferenceSheet?.["object-id"],
        columnIndex: selectedReferenceColumn?.index,
        columnName: selectedReferenceColumn?.name,
      } : null,
    };

    onSave(nodeData);
    handleClose();
  };

  const toggleOperation = (index, operation) => {
    if (operation === 'addition') {
      setAdditionIndices(prev => 
        prev.includes(index) 
          ? prev.filter(i => i !== index)
          : [...prev.filter(i => i !== index), index]
      );
      // Remove from subtraction if adding to addition
      setSubtractionIndices(prev => prev.filter(i => i !== index));
    } else {
      setSubtractionIndices(prev => 
        prev.includes(index) 
          ? prev.filter(i => i !== index)
          : [...prev.filter(i => i !== index), index]
      );
      // Remove from addition if adding to subtraction
      setAdditionIndices(prev => prev.filter(i => i !== index));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Create New Node</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Node Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Node Name
          </label>
          <input
            type="text"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter node name"
          />
        </div>

        {/* Node Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3 text-gray-700">
            Node Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setNodeType('independent')}
              className={`p-4 border rounded-lg flex items-center gap-3 transition-colors ${
                nodeType === 'independent'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Database className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Independent</div>
                <div className="text-xs text-gray-500">Manual input values</div>
              </div>
            </button>
            <button
              onClick={() => setNodeType('derived')}
              className={`p-4 border rounded-lg flex items-center gap-3 transition-colors ${
                nodeType === 'derived'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Calculator className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Derived</div>
                <div className="text-xs text-gray-500">Calculated from other nodes</div>
              </div>
            </button>
          </div>
        </div>

        {/* Independent Node Reference Option */}
        {nodeType === 'independent' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Reference External Sheet (Optional)
              </label>
              <button
                onClick={() => setShowReference(!showReference)}
                className={`text-sm px-3 py-1 rounded-md transition-colors ${
                  showReference 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {showReference ? 'Remove Reference' : 'Add Reference'}
              </button>
            </div>

            {showReference && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                {/* Sheet Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Reference Sheet
                  </label>
                  <select
                    value={selectedReferenceSheet?.["object-id"] || ''}
                    onChange={(e) => {
                      const sheet = availableSheets.find(s => s["object-id"] === e.target.value);
                      setSelectedReferenceSheet(sheet);
                      setSelectedReferenceColumn(null);
                    }}
                    className="w-full px-3 py-2 border rounded-md border-gray-300"
                  >
                    <option value="">Select a sheet</option>
                    {availableSheets.map(sheet => (
                      <option key={sheet["object-id"]} value={sheet["object-id"]}>
                        {sheet["sheet-name"].replace(/-/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Column Selection */}
                {selectedReferenceSheet && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Reference Column
                    </label>
                    <div className="max-h-32 overflow-y-auto border rounded-md bg-white">
                      {selectedReferenceSheet.attributes.map((col, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedReferenceColumn({ ...col, index })}
                          className={`w-full px-3 py-2 text-left transition-colors ${
                            selectedReferenceColumn?.index === index
                              ? "bg-blue-100 text-blue-800"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="capitalize">{col.name.replace(/-/g, ' ')}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              col.derived ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                            }`}>
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

        {/* Derived Node Formula Builder */}
        {nodeType === 'derived' && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-gray-700">
              Formula Builder
            </label>
            <div className="space-y-3">
              {attributes.map((attr, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium capitalize">
                    {attr.name.replace(/-/g, ' ')}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleOperation(index, 'addition')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
                        additionIndices.includes(index)
                          ? 'bg-green-500 text-white'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                    <button
                      onClick={() => toggleOperation(index, 'subtraction')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
                        subtractionIndices.includes(index)
                          ? 'bg-red-500 text-white'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                      Subtract
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Formula Preview */}
            {(additionIndices.length > 0 || subtractionIndices.length > 0) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-2">Formula Preview:</div>
                <div className="text-sm text-blue-700">
                  {additionIndices.map((idx, i) => (
                    <span key={`add-${idx}`}>
                      {i > 0 && ' + '}
                      {attributes[idx]?.name}
                    </span>
                  ))}
                  {subtractionIndices.map((idx, i) => (
                    <span key={`sub-${idx}`}>
                      {' - '}
                      {attributes[idx]?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border rounded-md text-gray-600 border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!nodeName.trim()}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Node
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeCreationModal;