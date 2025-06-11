//All the API endpoints will be declared here and then this will be used in entire frontend to access the endpoints...
const BaseURL = import.meta.env.VITE_API_BASE_URL;

export const authEndpoints = {
  LOGIN_API: BaseURL + "/v1/user/login",
  LOGOUT_API: BaseURL + "/v1/user/logout",

  ADMIN_LOGIN_API: BaseURL + "/v1/admin/login",
  ADMIN_LOGOUT_API: BaseURL + "/v1/admin/logout",
};

export const userEndpoints = {
  SELF_INFO_API: BaseURL + "/v1/user/information",
  INSERT_TODAY_API: BaseURL + "/v1/playbook/enter-value",
  GET_SHEET_API: BaseURL + "/v1/playbook/sheet",
  UPDATE_ROW_API: BaseURL + "/v1/playbook/update-value",
};

export const adminEndpoints = {
  FETCH_ALL_METAS_API: BaseURL + "/v1/playbook/all-meta",
  UPDATE_METAS_API: BaseURL + "/v1/playbook/update-sheet",
};

export const userManagementAPIs = {
  USER_SIGNUP_API: BaseURL + "/v1/user/signup",
  UPLOAD_USER_INFO_API: BaseURL + "/v1/user/upload-information",
  UPDATE_USER_INFO_API: BaseURL + "/v1/user/update-information",
  REVOKE_ACCESS_API: BaseURL + "/v1/user/revoke-access",
  ALL_USERS_API: BaseURL + "/v1/user/all-users",
};

export const sheetEndpoints = {
  REFERENCE_LINK_CHECK_API: BaseURL + "/v1/nodes/available-links",
}