export const getServerUrl = () => {
  return 'https://ambulancebackend.onrender.com';
};

export const makeRequest = async (url: string, options: RequestInit) => {
  const controller = new AbortController();
let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    timeoutId = setTimeout(() => controller.abort(), 15000);
    console.log('Making request to:', url);
    console.log('Request options:', JSON.stringify(options, null, 2));

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    console.log('Response status:', response.status);
    const headersObj: Record<string, string> = {};
    response.headers.forEach((value: string, key: string) => {
      headersObj[key] = value;
    });
    console.log('Response headers:', headersObj);

    const contentType = response.headers.get('content-type');

    if (response.status >= 400) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      throw new Error(`Server error ${response.status}: ${errorText.substring(0, 200)}...`);
    }

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { response, data };
    } else {
      const textResponse = await response.text();
      console.log('Non-JSON response received:', textResponse.substring(0, 500));
      throw new Error(`Server returned non-JSON response. Status: ${response.status}. Response: ${textResponse.substring(0, 200)}...`);
    }
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);

    if (error?.name === 'AbortError') {
      throw new Error('Request timed out (15 seconds)');
    }
    if (typeof error?.message === 'string') {
      if (error.message.includes('Network request failed')) {
        throw new Error('Network request failed. Please check your connection and server.');
      }
      if (error.message.includes('fetch')) {
        throw new Error('Failed to connect to server. Check if server is running and accessible.');
      }
    }
    throw error;
  }
};
