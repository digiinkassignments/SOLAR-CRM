const round = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
function solarTax({ mode = "itemised", subtotal = 0, discount = 0, rate = 0, items = [] }) {
  if (!["itemised", "solar_composite"].includes(mode)) throw new Error("Invalid GST mode");
  const base = round(Math.max(0, Number(subtotal) || 0));
  const reduction = round(Math.min(base, Math.max(0, Number(discount) || 0)));
  const taxable = round(base - reduction);
  if (mode === "solar_composite") {
    const goodsValue = round(taxable * 0.7);
    const serviceValue = round(taxable - goodsValue);
    const goodsTax = round(goodsValue * 0.05);
    const serviceTax = round(serviceValue * 0.18);
    const gst = round(goodsTax + serviceTax);
    return { mode, taxable, goodsValue, serviceValue, goodsTax, serviceTax, gst, total: round(taxable + gst), effectiveRate: 8.9 };
  }
  let allocated = 0;
  const gst = items.length ? round(items.reduce((sum, item, index) => {
    const value = round(Number(item.quantity) * Number(item.unit_price));
    const cut = index === items.length - 1 ? round(reduction - allocated) : round(base ? reduction * value / base : 0);
    allocated = round(allocated + cut);
    return sum + round(Math.max(0, round(value - cut)) * Number(item.gst_rate || 0) / 100);
  }, 0)) : round(taxable * Number(rate || 0) / 100);
  return { mode, taxable, gst, total: round(taxable + gst), effectiveRate: taxable ? round(gst / taxable * 100) : Number(rate || 0) };
}
module.exports = { solarTax };
