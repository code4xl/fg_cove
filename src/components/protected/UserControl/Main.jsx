import React, { useState } from "react";
import {
  User,
  Plus,
  Edit3,
  Shield,
  ShieldOff,
  Mail,
  Users,
  FileSpreadsheet,
  Save,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";

// Dummy data with 80+ sheets
const DUMMY_USERS = [
  {
    id: 1,
    email: "john.doe@company.com",
    name: "John Doe",
    designation: "Finance Manager",
    accessibleSheets: [
      "finance-001",
      "finance-002",
      "budget-001",
      "accounts-001",
    ],
    createdAt: "2025-01-15",
    status: "active",
  },
  {
    id: 2,
    email: "jane.smith@company.com",
    name: "Jane Smith",
    designation: "Operations Head",
    accessibleSheets: [
      "operations-001",
      "logistics-001",
      "warehouse-001",
      "inventory-001",
    ],
    createdAt: "2025-01-10",
    status: "active",
  },
  {
    id: 3,
    email: "mike.wilson@company.com",
    name: "Mike Wilson",
    designation: "Warehouse Supervisor",
    accessibleSheets: ["warehouse-001", "warehouse-002", "inventory-001"],
    createdAt: "2025-01-08",
    status: "inactive",
  },
];

// Generate 80+ sheets across different departments
const generateSheets = () => {
  const departments = [
    { name: "Finance", prefix: "finance", count: 15 },
    { name: "Operations", prefix: "operations", count: 12 },
    { name: "Warehouse", prefix: "warehouse", count: 10 },
    { name: "Inventory", prefix: "inventory", count: 8 },
    { name: "HR", prefix: "hr", count: 6 },
    { name: "Sales", prefix: "sales", count: 10 },
    { name: "Marketing", prefix: "marketing", count: 7 },
    { name: "Production", prefix: "production", count: 9 },
    { name: "Quality", prefix: "quality", count: 5 },
    { name: "Maintenance", prefix: "maintenance", count: 4 },
    { name: "Purchase", prefix: "purchase", count: 6 },
    { name: "Accounts", prefix: "accounts", count: 8 },
  ];

  const sheets = [];
  departments.forEach((dept) => {
    for (let i = 1; i <= dept.count; i++) {
      sheets.push({
        id: `${dept.prefix}-${String(i).padStart(3, "0")}`,
        name: `${dept.name} Sheet ${i}`,
        department: dept.name,
      });
    }
  });
  return sheets;
};

const AVAILABLE_SHEETS = generateSheets();

const DESIGNATIONS = [
  "Finance Manager",
  "Operations Head",
  "Warehouse Supervisor",
  "Production Manager",
  "Inventory Analyst",
  "Department Head",
  "HR Manager",
  "Sales Manager",
  "Marketing Manager",
  "Quality Manager",
  "Maintenance Head",
  "Purchase Manager",
];

const UserControl = () => {
  const [users, setUsers] = useState(DUMMY_USERS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Sheet management states
  const [sheetSearch, setSheetSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [showAllSheets, setShowAllSheets] = useState({});

  // Create user form state
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    designation: "",
    accessibleSheets: [],
  });

  // Edit user form state
  const [editUser, setEditUser] = useState({
    email: "",
    name: "",
    designation: "",
    accessibleSheets: [],
  });

  const departments = [
    ...new Set(AVAILABLE_SHEETS.map((sheet) => sheet.department)),
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredSheets = AVAILABLE_SHEETS.filter((sheet) => {
    const matchesSearch =
      sheet.name.toLowerCase().includes(sheetSearch.toLowerCase()) ||
      sheet.department.toLowerCase().includes(sheetSearch.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "all" || sheet.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleCreateUser = () => {
    console.log("Creating user:", newUser);
    console.log("Sheet IDs being sent to backend:", newUser.accessibleSheets);

    const user = {
      id: users.length + 1,
      ...newUser,
      createdAt: new Date().toISOString().split("T")[0],
      status: "active",
    };

    setUsers([...users, user]);
    setNewUser({ email: "", name: "", designation: "", accessibleSheets: [] });
    setShowCreateModal(false);
    setSheetSearch("");
    setSelectedDepartment("all");
  };

  const handleEditUser = () => {
    console.log("Updating user:", editUser);
    console.log(
      "Updated sheet IDs being sent to backend:",
      editUser.accessibleSheets
    );

    setUsers(
      users.map((user) =>
        user.id === selectedUser.id ? { ...user, ...editUser } : user
      )
    );
    setShowEditModal(false);
    setSelectedUser(null);
    setSheetSearch("");
    setSelectedDepartment("all");
  };

  const handleRevokeAccess = (userId, sheetId) => {
    console.log(`Revoking access for user ${userId} from sheet ${sheetId}`);
    setUsers(
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              accessibleSheets: user.accessibleSheets.filter(
                (id) => id !== sheetId
              ),
            }
          : user
      )
    );
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditUser({
      email: user.email,
      name: user.name,
      designation: user.designation,
      accessibleSheets: [...user.accessibleSheets],
    });
    setShowEditModal(true);
  };

  const getSheetName = (sheetId) => {
    const sheet = AVAILABLE_SHEETS.find((s) => s.id === sheetId);
    return sheet ? sheet.name : sheetId;
  };

  const toggleShowAllSheets = (userId) => {
    setShowAllSheets((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const SheetSelector = ({ selectedSheets, onSheetToggle, title }) => {
    const groupedSheets = departments.reduce((acc, dept) => {
      acc[dept] = filteredSheets.filter((sheet) => sheet.department === dept);
      return acc;
    }, {});

    return (
      <div className="space-y-4">
        <div className="sticky top-0 bg-white pb-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">{title}</h4>

          {/* Search and Filter */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search sheets..."
                value={sheetSearch}
                onChange={(e) => setSheetSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Selected count */}
          <div className="text-sm text-gray-600">
            {selectedSheets.length} sheet(s) selected
          </div>
        </div>

        {/* Sheets by Department */}
        <div className="max-h-80 overflow-y-auto space-y-4">
          {Object.entries(groupedSheets).map(
            ([dept, sheets]) =>
              sheets.length > 0 && (
                <div key={dept} className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h5 className="font-medium text-gray-900">
                      {dept} ({sheets.length})
                    </h5>
                  </div>
                  <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                    {sheets.map((sheet) => (
                      <label
                        key={sheet.id}
                        className="flex items-center hover:bg-gray-50 p-2 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSheets.includes(sheet.id)}
                          onChange={(e) =>
                            onSheetToggle(sheet.id, e.target.checked)
                          }
                          className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {sheet.name}
                          </span>
                          <p className="text-xs text-gray-500">
                            ID: {sheet.id}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                User Management
              </h1>
              <p className="text-gray-600">
                Manage user access and sheet permissions
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by name, email, or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {user.name}
                    </h3>
                    <p className="text-gray-600 text-sm">{user.designation}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FileSpreadsheet className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="text-sm">
                    {user.accessibleSheets.length} sheet(s) assigned
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    Sheet Access:
                  </h4>
                  {user.accessibleSheets.length > 3 && (
                    <button
                      onClick={() => toggleShowAllSheets(user.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      {showAllSheets[user.id] ? (
                        <>
                          Show Less <ChevronUp className="w-3 h-3 ml-1" />
                        </>
                      ) : (
                        <>
                          Show All <ChevronDown className="w-3 h-3 ml-1" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {user.accessibleSheets.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                      <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No sheets assigned</p>
                    </div>
                  ) : (
                    <div className="overflow-y-auto max-h-50 space-y-2 ">
                      {user.accessibleSheets
                        .slice(0, showAllSheets[user.id] ? undefined : 3)
                        .map((sheetId) => (
                          <div
                            key={sheetId}
                            className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                          >
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {getSheetName(sheetId)}
                              </span>
                              <p className="text-xs text-gray-500">{sheetId}</p>
                            </div>
                            <button
                              onClick={() =>
                                handleRevokeAccess(user.id, sheetId)
                              }
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Remove Access"
                            >
                              <ShieldOff className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => openEditModal(user)}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit User
              </button>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Add New User
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* User Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      User Details
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({ ...newUser, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="user@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={newUser.name}
                        onChange={(e) =>
                          setNewUser({ ...newUser, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Designation *
                      </label>
                      <select
                        value={newUser.designation}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            designation: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Designation</option>
                        {DESIGNATIONS.map((designation) => (
                          <option key={designation} value={designation}>
                            {designation}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sheet Access */}
                  <div>
                    <SheetSelector
                      selectedSheets={newUser.accessibleSheets}
                      onSheetToggle={(sheetId, checked) => {
                        if (checked) {
                          setNewUser({
                            ...newUser,
                            accessibleSheets: [
                              ...newUser.accessibleSheets,
                              sheetId,
                            ],
                          });
                        } else {
                          setNewUser({
                            ...newUser,
                            accessibleSheets: newUser.accessibleSheets.filter(
                              (id) => id !== sheetId
                            ),
                          });
                        }
                      }}
                      title="Assign Sheet Access"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={
                    !newUser.email || !newUser.name || !newUser.designation
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Edit User: {selectedUser.name}
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* User Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      User Details
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={editUser.email}
                        onChange={(e) =>
                          setEditUser({ ...editUser, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editUser.name}
                        onChange={(e) =>
                          setEditUser({ ...editUser, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Designation
                      </label>
                      <select
                        value={editUser.designation}
                        onChange={(e) =>
                          setEditUser({
                            ...editUser,
                            designation: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {DESIGNATIONS.map((designation) => (
                          <option key={designation} value={designation}>
                            {designation}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sheet Access */}
                  <div>
                    <SheetSelector
                      selectedSheets={editUser.accessibleSheets}
                      onSheetToggle={(sheetId, checked) => {
                        if (checked) {
                          setEditUser({
                            ...editUser,
                            accessibleSheets: [
                              ...editUser.accessibleSheets,
                              sheetId,
                            ],
                          });
                        } else {
                          setEditUser({
                            ...editUser,
                            accessibleSheets: editUser.accessibleSheets.filter(
                              (id) => id !== sheetId
                            ),
                          });
                        }
                      }}
                      title="Modify Sheet Access"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditUser}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserControl;
