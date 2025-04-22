import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const sendMessage = async (message) => {
  try {
    const response = await axios.post(`${API_URL}/api/chat`, { message });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};