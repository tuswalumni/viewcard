/**
 * ============================================================
 * TUSW Alumni — Shared API Client
 * ============================================================
 * ใช้ร่วมกันทุกเว็บไซต์ (GitHub Pages) เพื่อเรียก Google Apps Script
 * Web App ที่ทำหน้าที่เป็น JSON API (ContentService)
 *
 * วิธีใช้งาน:
 *   1. แก้ค่า API_URL ด้านล่างให้เป็น URL ของ Apps Script Web App
 *      ที่ Deploy แล้ว (ลงท้ายด้วย /exec)
 *   2. เรียกใช้ผ่าน: TUSW_API.call('actionName', { ...payload })
 *      คืนค่าเป็น Promise ที่ resolve เป็น object ผลลัพธ์ (เหมือนเดิมทุกประการ
 *      กับตอนที่เคยได้จาก google.script.run.withSuccessHandler(...))
 *
 * หมายเหตุสำคัญเรื่อง CORS:
 *   - ส่งเป็น POST + Content-Type: text/plain เพื่อให้เบราว์เซอร์มองเป็น
 *     "simple request" ไม่ต้องทำ CORS preflight (OPTIONS) เพราะ Apps Script
 *     Web App ไม่รองรับการตอบ preflight request
 *   - ต้อง Deploy Web App เป็น "Execute as: Me" + "Who has access: Anyone"
 * ============================================================
 */

const TUSW_API = (function () {
  // ⚠️ แก้ URL นี้ให้ตรงกับ Web App ที่ Deploy จริงของสมาคมฯ
  const API_URL = "https://script.google.com/macros/s/AKfycbwBqeqG9yu5y-PCKjr5hbgevTuKVjS9oDNbDFCbhxwvj4GX4jDSNEk9tKyOh3qw-J2h/exec?page=viewcard";

  async function call(action, payload) {
    payload = payload || {};
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: action, payload: payload }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      // ✅ ใหม่: ถ้าฝั่ง Apps Script "throw" error ออกมา (เช่น getMemberDataForCard, searchOldMember,
      // processMemberMigration, getDashboardData) doPost จะห่อเป็น { status:"error", success:false, message }
      // แล้วตอบกลับ HTTP 200 — เดิมหน้าเว็บมองว่าสำเร็จและนำ object นี้ไปใช้ต่อ (เช่น วาดบัตรว่าง/โชว์ฟอร์มเปล่า)
      // จึงโยนเป็น Error ให้เข้า .catch() เหมือนพฤติกรรมเดิมของ google.script.run.withFailureHandler
      if (data && typeof data === "object" && !Array.isArray(data) && data.status === "error" && data.success === false) {
        throw new Error(data.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
      }
      return data;
    } catch (err) {
      // โยน error ต่อให้โค้ดที่เรียกใช้ไปจัดการเหมือนเดิมกับ withFailureHandler
      throw new Error(err && err.message ? err.message : String(err));
    }
  }

  return { call: call, API_URL: API_URL };
})();
