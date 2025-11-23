// server/fetch_utils.js
import axios from "axios";

export const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const axiosClient = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
  },
  timeout: 15000,
});

// 安全GET（retry付き）
export async function safeGet(url, retry = 3) {
  try {
    return await axiosClient.get(url);
  } catch (err) {
    if (retry <= 0) throw err;
    console.log(`⚠ retry (${retry}) → ${url}`);
    await wait(3000 + Math.random() * 5000);
    return await safeGet(url, retry - 1);
  }
}