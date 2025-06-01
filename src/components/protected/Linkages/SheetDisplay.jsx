import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X } from "lucide-react";
import { ReactFlowProvider } from '@xyflow/react';
import {
    clearSheetData,
  detailSheetAttributes,
  detailSheetBarToggle,
  isDeatailSheetBar,
  sheetForDetail,
  sheetNameForDetail,
} from "../../../app/LinkagesSlice.js";
import {AttributeFlowChart} from "./utils/Helper.jsx";

const SheetDisplay = ({ isOpen }) => {
  const dispatch = useDispatch();
  const isDetailSheet = useSelector(isDeatailSheetBar);
  const sheetName = useSelector(sheetNameForDetail);
  const sheetId = useSelector(sheetForDetail);
  const sheetAttributes = useSelector(detailSheetAttributes);

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
      <div className="flex items-center justify-between px-6 py-[.5rem] border-b border-gray-200 bg-gray-50">
        <div>
          <h2 className="text-md font-bold text-gray-900 capitalize">
            {sheetName?.replace(/-/g, " ") || "Sheet Details"}
          </h2>
          <p className="text-sm text-gray-600 font-medium">
            Formula relationships and attribute dependencies
          </p>
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
          <ReactFlowProvider>
            <AttributeFlowChart 
              attributes={sheetAttributes}
              sheetName={sheetName}
            />
          </ReactFlowProvider>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sheet Selected</h3>
              <p className="text-gray-500">Select a sheet from the main view to see its attribute relationships</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetDisplay;