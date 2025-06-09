import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X } from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import {
  clearSheetData,
  detailSheetAttributes,
  detailSheetBarToggle,
  isDeatailSheetBar,
  sheetForDetail,
  sheetNameForDetail,
} from "../../../app/LinkagesSlice.js";
import { AttributeFlowChart } from "./utils/FlowElements.jsx";
import {
  calculateDerivedValue,
  checkTodaysData,
  getTodaysDate,
} from "./utils/Helper.jsx";
import { selectAccount } from "../../../app/DashboardSlice.js";

import NodeCreationModal from "./utils/NodeCreationModal.jsx";

const SheetDisplayNew = ({ isOpen }) => {
  const dispatch = useDispatch();
  const isDetailSheet = useSelector(isDeatailSheetBar);
  const sheetName = useSelector(sheetNameForDetail);
  const sheetId = useSelector(sheetForDetail);
  const sheetAttributes = useSelector(detailSheetAttributes);

  const [showTotals, setShowTotals] = useState(false);
  const [sheetData, setSheetData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState({});

  const isAdmin = useSelector(selectAccount)?.role === "admin";
  const [showNodeCreationModal, setShowNodeCreationModal] = useState(false);
  const availableSheets = [
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
  const handleCreateNode = useCallback(() => {
    setShowNodeCreationModal(true);
  }, []);

  // Add this function to handle node save
  const handleSaveNode = useCallback(
    (nodeData) => {
      // Create new attribute based on nodeData
      const newAttribute = {
        name: nodeData.name,
        derived: nodeData.type === "derived",
        formula:
          nodeData.type === "derived"
            ? {
                "addition-indices": nodeData.additionIndices,
                "subtraction-indices": nodeData.subtractionIndices,
              }
            : null,
        "linked-from": nodeData.reference
          ? {
              "sheet-object-id": nodeData.reference.sheetId,
              "attribute-indice": nodeData.reference.columnIndex,
            }
          : null,
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      };

      // Update metadata (you'll need to implement this based on your state management)
      // This should update your metadata collection with the new attribute
      const updatedAttributes = [...sheetAttributes, newAttribute];

      // You'll need to dispatch this to your Redux store
      // dispatch(updateSheetAttributes({ sheetId, attributes: updatedAttributes }));

      // Add new empty data column to sheet data
      const updatedSheetData = [...sheetData];
      const numRows = updatedSheetData[0]?.attributes.length || 0;
      const newDataRow = {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: new Array(numRows).fill(
          nodeData.type === "derived" ? 0 : ""
        ),
      };

      updatedSheetData.push(newDataRow);
      setSheetData(updatedSheetData);

      console.log("Created new node:", {
        nodeData,
        newAttribute,
        updatedSheetData,
      });

      setShowNodeCreationModal(false);
    },
    [sheetAttributes, sheetData, sheetId]
  );

  const fetchSheetData = useCallback(async (sheetId) => {
    // Replace this with your actual API call or Redux selector
    // This should return data in the format you described
    const mockData = [
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: ["1 Jun 2025", "2 Jun 2025", "3 Jun 2025" ],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [100, 100, 100],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [50, 50, 50],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [20, 20, 20],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [30, 30, 30],
      },
      {
        "object-id": "647f191e810c19729de860ea",
        "user-id": "07f1f77bcf86cd799439011",
        date: "2025-05-01T00:00:00Z",
        attributes: [30, 30,  10],
      },
    ];
    return mockData;
  }, []);

  useEffect(() => {
    if (sheetId) {
      fetchSheetData(sheetId).then(setSheetData);
    }
  }, [sheetId, fetchSheetData]);

  const handleValueUpdate = useCallback((attributeIndex, newValue) => {
    setPendingUpdates((prev) => ({
      ...prev,
      [attributeIndex]: newValue,
    }));
  }, []);

  //Saves Todays data..
  const handleSaveData = useCallback(async () => {
    setIsSaving(true);
    try {
      const updatedSheetData = [...sheetData];
      const today = getTodaysDate();

      // Add today's date to date column if it doesn't exist
      if (updatedSheetData[0]) {
        updatedSheetData[0].attributes.push(today);
      }

      // Add values for each attribute
      Object.entries(pendingUpdates).forEach(([attributeIndex, value]) => {
        const index = parseInt(attributeIndex);
        if (updatedSheetData[index]) {
          updatedSheetData[index].attributes.push(value);
        }
      });

      // Calculate derived values
      sheetAttributes.forEach((attr, index) => {
        if (attr.derived && attr.formula) {
          const newColumnIndex = updatedSheetData[0].attributes.length - 1;
          const calculatedValue = calculateDerivedValue(
            attr.formula,
            updatedSheetData,
            newColumnIndex
          );
          if (updatedSheetData[index]) {
            updatedSheetData[index].attributes[newColumnIndex] =
              calculatedValue;
          }
        }
      });

      setSheetData(updatedSheetData);
      setPendingUpdates({});

      // Here you would typically make an API call to save the data
      console.log("Saving sheet data:", {
        sheetId,
        updatedData: updatedSheetData,
      });
    } catch (error) {
      console.error("Error saving data:", error);
    } finally {
      setIsSaving(false);
    }
  }, [sheetData, pendingUpdates, sheetAttributes, sheetId]);

  // Toggle totals view
  const handleToggleTotals = useCallback(() => {
    setShowTotals((prev) => !prev);
  }, []);

  // Refresh data
  const handleRefresh = useCallback(() => {
    if (sheetId) {
      fetchSheetData(sheetId).then(setSheetData);
      setPendingUpdates({});
    }
  }, [sheetId, fetchSheetData]);

  const hasToday = useMemo(() => {
    return checkTodaysData(sheetData);
  }, [sheetData]);

  const onCloseBar = () => {
    dispatch(clearSheetData({}));
    // dispatch(detailSheetBarToggle({ detailSheetBar: !isDetailSheet }));
  };

  return (
    <div
      className={`
        ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        fixed inset-y-0 right-0 h-full
        transition-all duration-300 ease-in-out
        w-[calc(100vw-20rem)] min-w-[800px]
        bg-white border-l border-gray-200
        flex flex-col
        shadow-2xl z-50
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex  gap-2 items-center justify-center">
          <h2 className="text-2xl font-bold text-gray-900 capitalize">
            {sheetName?.replace(/-/g, " ") || "Sheet Details"}
          </h2>
          <div className=" items-center justify-center flex gap-2 select-none">
            <p
              className={`${
                hasToday ? "bg-green-500 " : "bg-red-500"
              } text-white rounded-full text-sm font-bold px-2 py-1 mt-1`}
            >
              {hasToday ? "Today's data available" : "Enter today's data"}
            </p>
            <p> Sheet View</p>
          </div>
        </div>
        <button
          onClick={onCloseBar}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors duration-200"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {sheetAttributes && sheetAttributes.length > 0 ? (
          <>
            <ReactFlowProvider>
              <AttributeFlowChart
                attributes={sheetAttributes}
                sheetName={sheetName}
                sheetData={sheetData}
                showTotals={showTotals}
                hasToday={hasToday}
                onValueUpdate={handleValueUpdate}
                onToggleTotals={handleToggleTotals}
                onSaveData={handleSaveData}
                onRefresh={handleRefresh}
                isSaving={isSaving}
                onCreateNode={handleCreateNode}
              />
            </ReactFlowProvider>
            {showNodeCreationModal && (
              <NodeCreationModal
                isOpen={showNodeCreationModal}
                onClose={() => setShowNodeCreationModal(false)}
                onSave={handleSaveNode}
                attributes={sheetAttributes}
                availableSheets={availableSheets}
              />
            )}{" "}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Sheet Selected
              </h3>
              <p className="text-gray-500">
                Select a sheet from the main view to see its attribute
                relationships
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetDisplayNew;
