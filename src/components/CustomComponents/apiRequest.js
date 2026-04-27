import { config } from "@/components/CustomComponents/config";

function handleLogout() {
  localStorage.removeItem("user");
  localStorage.removeItem("userRole");
  window.location.href = "/login";
}

export async function apiRequest(
  endpoint,
  options = {},
  responseType = "json",
) {
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(`${config.Api}/api/${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      handleLogout();
      return;
    }

    // ✅ handle file downloads
    if (responseType === "blob") {
      return await response.blob();
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}
