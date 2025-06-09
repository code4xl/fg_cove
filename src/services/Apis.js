//All the API endpoints will be declared here and then this will be used in entire frontend to access the endpoints...
const BaseURL = import.meta.env.VITE_API_BASE_URL;

export const authEndpoints = {
  LOGIN_API: BaseURL + '/v1/user/login',
  LOGOUT_API: BaseURL + '/v1/user/logout',
  
  ADMIN_LOGIN_API: BaseURL + '/v1/admin/login',
  ADMIN_LOGOUT_API: BaseURL + '/v1/admin/logout',
  
};

export const userEndpoints = {
  SELF_INFO_API: BaseURL + '/v1/user/information', 
};

export const adminEndpoints = {
  FETCH_ALL_METAS_API: BaseURL + '/v1/playbook/all-meta', 
};

export const uploadEndPoints = {
  UPLOAD: BaseURL + 'upload/',
};
