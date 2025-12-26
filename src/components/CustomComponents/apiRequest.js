// utils/api.js
import { config } from '@/components/CustomComponents/config';

// Function to force logout
function handleLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('userRole')
//   localStorage.clear(); // clear stored user data
  window.location.href = "/login"; // redirect to login
}

export async function apiRequest(endpoint, options = {}) {
  const userId = localStorage.getItem("userId"); // stored when user logs in
// const storedUser = JSON.parse(localStorage.getItem('hrms_user'));
  const finalOptions = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    //   "x-user-id": storedUser["_id"] || "", // attach userId on every request
    },
  };
  try {
    const response = await fetch(config.Api +"/api/"+ endpoint, finalOptions);
    if (response.status === 401) {
      // backend says user not logged in
      handleLogout();
      return;
    }
          if (!response.ok) {
            const errorText=await response.text();
            console.error("API Error Response:", errorText);
        throw new Error('Failed to get datas');
      }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}
