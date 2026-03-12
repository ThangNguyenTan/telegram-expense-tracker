export function formatVND(amount: number): string {
  // Format as VND: 100,000 ₫
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}
