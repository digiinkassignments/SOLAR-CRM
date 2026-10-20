const https = require("https");

/**
 * Gemini AI Service for Solar CRM SaaS
 * Uses models/gemini-3.5-flash-lite via direct HTTPS REST endpoint
 */

function cleanJsonText(rawText) {
  if (!rawText) return "";
  let cleaned = rawText.trim();
  // Remove markdown code fences ```json ... ``` or ``` ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return cleaned.trim();
}

/**
 * Deterministic Solar Sales Rule Engine fallback
 * Used when Gemini API is throttled, quota-limited, or network fails.
 */
function generateFallbackInsights(lead, followups = []) {
  const kw = Number(lead.required_kw) || 3;
  const bill = Number(lead.monthly_bill || lead.electricity_bill) || (kw * 1200);
  const roof = lead.roof_type || "RCC Flat Roof";
  const name = lead.customer_name || "Valued Customer";
  const city = lead.city ? `${lead.city}, ` : "";
  const state = lead.state || "India";

  // Subsidy calculations based on PM Surya Ghar Muft Bijli Yojana
  let subsidy = "₹78,000 (Maximum direct DBT subsidy)";
  if (kw <= 1) subsidy = "₹33,000 direct DBT subsidy";
  else if (kw <= 2) subsidy = "₹66,000 direct DBT subsidy";

  // Calculate Win Probability
  let winScore = 65;
  if (bill >= 4000) winScore += 15;
  if (lead.quotation_amount && Number(lead.quotation_amount) > 0) winScore += 10;
  if (lead.status === "Site Visit Scheduled" || lead.status === "Quotation Sent") winScore += 10;
  if (lead.priority === "High") winScore += 5;
  if (winScore > 95) winScore = 95;

  const dealHealth = winScore >= 80 ? "High Priority Deal" : winScore >= 60 ? "Moderate Interest" : "Nurturing Required";

  return {
    win_probability: winScore,
    deal_health: dealHealth,
    executive_summary: `${name} has an estimated monthly electricity bill of ₹${bill.toLocaleString("en-IN")} and requires a ${kw}kW system on ${roof}. Eligible for direct DBT subsidy under PM Surya Ghar Muft Bijli Yojana with an estimated payback period of 3.2 years.`,
    recommended_system: `${kw}kW On-Grid Rooftop Solar System (Generates ~${kw * 4}-${kw * 4.5} units/day)`,
    estimated_subsidy: subsidy,
    estimated_savings: `Save approx ₹${Math.round(bill * 0.9).toLocaleString("en-IN")}/month (₹${Math.round(bill * 10.8).toLocaleString("en-IN")}/year)`,
    calling_script: [
      `Namaste ${name} ji, Main Solar Advisor baat kar raha hoon aapki ${city}${state} solar rooftop inquiry ke sandarbh mein.`,
      `Aapka bijli bill lagbhag ₹${bill.toLocaleString("en-IN")}/month aata hai, jise on-grid solar system install karke 90% tak kam kiya ja sakta hai.`,
      `PM Surya Ghar Muft Bijli Yojana ke tehat ${subsidy} direct aapke account mein transfer hoti hai.`,
      `Kripya batayein, hamare technical engineer kal site inspection aur roof measurement ke liye kab visit kar sakte hain?`
    ],
    key_objection_tips: "Customer upfront cost ya budget ka puche toh zero-downpayment / low-cost 5 year solar EMI (₹2,500 - ₹3,500/month) pitch karein.",
    whatsapp_pitches: {
      formal: `Dear ${name} ji,\n\nGreetings from Solar Advisory Team.\n\nRegarding your solar rooftop requirement of ${kw}kW at ${city}${state}:\n\n- Reduce monthly bill of ~₹${bill.toLocaleString("en-IN")} by up to 90%\n- Central Government Subsidy: ${subsidy} via DBT\n- 25 Years Panel Performance Warranty with Tier-1 components\n\nMay we schedule a complimentary 15-minute site visit this week?\n\nWarm regards,\nSolar Advisory Team`,
      subsidy_focus: `Namaste ${name} ji,\n\nPM Surya Ghar Muft Bijli Yojana ke tehat aapke ghar par ${kw}kW Rooftop Solar lagwane par sarkar ki taraf se direct ${subsidy} uplabdh hai.\n\nCurrent Monthly Bill: ~₹${bill.toLocaleString("en-IN")}\nExpected Bill After Solar: ₹0 to ₹300 per month\n\nKya hum kal aapka complimentary technical site survey schedule karein?\n\nRegards,\nSolar Advisory Team`,
      urgent_followup: `Hello ${name} ji, Quick follow-up regarding your solar rooftop proposal.\n\nHamne aapki roof requirement ke anusaar customized quotation aur net-metering subsidy report prepare kar li hai. Kripya batayein call par kab connect kar sakte hain.`
    }
  };
}

async function analyzeLeadWithGemini(leadData, followups = []) {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  if (!apiKey) {
    return generateFallbackInsights(leadData, followups);
  }

  const prompt = `You are an elite Solar Energy Sales Copilot and Deal Closure Advisor for an Indian Solar EPC CRM SaaS.
Analyze the following lead and follow-up interaction history, then provide an intelligent deal analysis, win probability score, calling script, and personalized WhatsApp pitch templates.

### Lead Information:
- Customer Name: ${leadData.customer_name || "N/A"}
- Phone: ${leadData.mobile_number || "N/A"}
- City / State: ${leadData.city || ""}, ${leadData.state || ""}
- Required Capacity: ${leadData.required_kw ? leadData.required_kw + " kW" : "Not specified"}
- Monthly Electricity Bill: ₹${leadData.monthly_bill || leadData.electricity_bill || "Not specified"}
- Sanctioned Load: ${leadData.sanctioned_load ? leadData.sanctioned_load + " kW" : "Not specified"}
- Roof Type: ${leadData.roof_type || "Not specified"}
- Current Pipeline Stage / Status: ${leadData.status || "New"}
- Priority: ${leadData.priority || "Medium"}
- Lead Source: ${leadData.lead_source || "Direct"}
- Quotation Amount: ${leadData.quotation_amount ? "₹" + leadData.quotation_amount : "Not generated yet"}
- Latest Followup / Remarks: ${leadData.latest_followup_note || leadData.remark || "No recent notes"}
- Followup Interaction History (Past 3):
${followups.slice(0, 3).map((f, i) => `${i + 1}. [${f.followup_type || "Note"}] ${f.note || ""}`).join("\n") || "No prior history"}

### Guidelines:
1. "win_probability": Integer between 10 and 99 reflecting how likely this deal will close based on status, bill, roof, and remarks.
2. "deal_health": One of "High Priority Deal", "Moderate Interest", "Needs Immediate Action", "Nurturing Required" (Do NOT include any emojis).
3. "executive_summary": 2-3 lines concise executive evaluation of this opportunity. Do NOT include any emojis.
4. "recommended_system": Specific solar capacity, on-grid vs hybrid suggestion, and daily unit generation estimate.
5. "estimated_subsidy": Real Indian PM Surya Ghar Muft Bijli Yojana calculation (up to ₹78,000 for 3kW+).
6. "estimated_savings": Estimated monthly and annual financial savings.
7. "calling_script": Array of 3-4 strategic bullet points for the sales rep to speak naturally on call (Mix of polite professional Hinglish/English with confidence. Do NOT include emojis).
8. "key_objection_tips": 1-2 pro sales tips to overcome likely objections (cost, net metering delay, roof space, brand). Do NOT include emojis.
9. "whatsapp_pitches": Object containing 3 tailored ready-to-send messages (Do NOT include emojis, use neat bullet dashes '-' if needed):
   - "formal": Crisp, professional English proposal intro.
   - "subsidy_focus": Engaging Hindi/Hinglish copy focusing on PM Surya Ghar ₹78,000 DBT benefit.
   - "urgent_followup": Short, polite re-engagement nudge for WhatsApp.

### CRITICAL OUTPUT FORMAT:
You MUST return ONLY a valid JSON object without any additional preamble or markdown commentary outside JSON:
{
  "win_probability": 85,
  "deal_health": "High Priority Deal",
  "executive_summary": "...",
  "recommended_system": "...",
  "estimated_subsidy": "...",
  "estimated_savings": "...",
  "calling_script": ["...", "..."],
  "key_objection_tips": "...",
  "whatsapp_pitches": {
    "formal": "...",
    "subsidy_focus": "...",
    "urgent_followup": "..."
  }
}`;

  const postData = JSON.stringify({
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2500,
      responseMimeType: "application/json"
    }
  });

  return new Promise((resolve) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        },
        timeout: 25000
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            const textResponse = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              const cleaned = cleanJsonText(textResponse);
              const jsonResult = JSON.parse(cleaned);
              return resolve(jsonResult);
            }
            console.warn("[GeminiService] API returned non-candidate response, using fallback:", data.substring(0, 200));
            return resolve(generateFallbackInsights(leadData, followups));
          } catch (err) {
            console.warn("[GeminiService] JSON parse error from Gemini output, using fallback:", err.message);
            return resolve(generateFallbackInsights(leadData, followups));
          }
        });
      }
    );

    req.on("error", (err) => {
      console.warn("[GeminiService] HTTPS request error, using fallback:", err.message);
      resolve(generateFallbackInsights(leadData, followups));
    });

    req.on("timeout", () => {
      req.destroy();
      console.warn("[GeminiService] Request timed out, using fallback");
      resolve(generateFallbackInsights(leadData, followups));
    });

    req.write(postData);
    req.end();
  });
}

function generateFallbackProposalSavings(specs = {}) {
  const kw = Number(specs.system_capacity_kw || specs.capacity || 3);
  const name = specs.customer_name || "Valued Customer";
  const city = specs.city ? `${specs.city}, ` : "";
  const netPayable = Number(specs.net_payable || specs.total_amount || kw * 55000);
  const annualUnits = Math.round(kw * 1450);
  const annualSavings = Math.round(annualUnits * 8.2);
  const lifetimeSavings = Math.round(annualSavings * 25);
  const paybackYears = (netPayable / (annualSavings || 1)).toFixed(1);
  const co2SavedTonnes = (kw * 1.25 * 25).toFixed(1);
  const treesEquivalent = Math.round(kw * 45);

  return {
    executive_proposal_summary: `This high-performance ${kw}kW solar power system is engineered specifically for ${name} at ${city}India to dramatically cut grid electricity bills by up to 90%. Utilizing Tier-1 high-efficiency modules and smart inverter technology, the installation delivers immediate energy autonomy with government subsidy support.`,
    financial_highlights: {
      annual_units_generated: `${annualUnits.toLocaleString("en-IN")} kWh / Year`,
      annual_savings: `₹${annualSavings.toLocaleString("en-IN")} per year`,
      lifetime_savings_25yr: `₹${lifetimeSavings.toLocaleString("en-IN")}`,
      estimated_payback_years: `${paybackYears} Years`,
      roi_percentage: "28.5% Annualized ROI"
    },
    environmental_impact: {
      co2_offset_tonnes: `${co2SavedTonnes} Tonnes of CO2`,
      trees_equivalent: `${treesEquivalent} Mature Trees planted equivalent`
    },
    warranty_highlights: [
      "25 Years Linear Solar Module Performance Warranty (>80% output at 25th year)",
      "5 to 10 Years Comprehensive Inverter Replacement Warranty",
      "5 Years Heavy-Duty Structure & Workmanship Guarantee against 150+ km/h wind speeds"
    ],
    customer_pitch_tagline: `Invest ₹${netPayable.toLocaleString("en-IN")} once, recover full investment in approx ${paybackYears} years, and enjoy over 21 years of virtually free, reliable solar power.`
  };
}

async function generateProposalSavingsWithGemini(specs = {}) {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  if (!apiKey) {
    return generateFallbackProposalSavings(specs);
  }

  const prompt = `You are a Senior Solar System Design Engineer and Proposal Specialist for an Indian Solar EPC Company.
Generate an executive proposal summary, 25-year return on investment (ROI) projection, and green carbon offset impact for a client quotation.

### Project Specifications:
- Customer Name: ${specs.customer_name || "Valued Customer"}
- Location: ${specs.city || ""}, ${specs.state || "India"}
- Proposed Solar System: ${specs.system_capacity_kw || 3} kW ${specs.system_type || "On-Grid"}
- Module Specifications: ${specs.panel_brand || "Tier-1 Mono PERC 550W"}
- Inverter: ${specs.inverter_brand || "Smart Grid-Tied Inverter"}
- Total System Cost: ₹${specs.base_price || (specs.system_capacity_kw || 3) * 60000}
- Government Subsidy: ₹${specs.subsidy_amount || 78000}
- Net Customer Investment: ₹${specs.net_payable || (specs.system_capacity_kw || 3) * 45000}

### Guidelines:
1. "executive_proposal_summary": A professional, high-impact 2-3 sentence summary addressed to the client, explaining why this ${specs.system_capacity_kw || 3}kW system is optimal.
2. "financial_highlights":
   - "annual_units_generated": string format (e.g. "4,350 kWh / Year")
   - "annual_savings": string format (e.g. "₹35,600 / Year")
   - "lifetime_savings_25yr": string format (e.g. "₹12,45,000")
   - "estimated_payback_years": string format (e.g. "3.2 Years")
   - "roi_percentage": string format (e.g. "29% Annualized")
3. "environmental_impact":
   - "co2_offset_tonnes": string format
   - "trees_equivalent": string format
4. "warranty_highlights": Array of 3 key warranty bullets (Tier-1 modules 25-year warranty, Inverter 5-10 year, structure 5 year).
5. "customer_pitch_tagline": 1 compelling sentence summarizing payback and 20+ years of free power.
6. STRICT: Do NOT use any emojis. Use clean corporate terminology.

### Output JSON Format:
{
  "executive_proposal_summary": "...",
  "financial_highlights": {
    "annual_units_generated": "...",
    "annual_savings": "...",
    "lifetime_savings_25yr": "...",
    "estimated_payback_years": "...",
    "roi_percentage": "..."
  },
  "environmental_impact": {
    "co2_offset_tonnes": "...",
    "trees_equivalent": "..."
  },
  "warranty_highlights": ["...", "...", "..."],
  "customer_pitch_tagline": "..."
}`;

  const postData = JSON.stringify({
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2500,
      responseMimeType: "application/json"
    }
  });

  return new Promise((resolve) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        },
        timeout: 25000
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            const textResponse = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              const cleaned = cleanJsonText(textResponse);
              const jsonResult = JSON.parse(cleaned);
              return resolve(jsonResult);
            }
            return resolve(generateFallbackProposalSavings(specs));
          } catch (err) {
            return resolve(generateFallbackProposalSavings(specs));
          }
        });
      }
    );

    req.on("error", () => resolve(generateFallbackProposalSavings(specs)));
    req.on("timeout", () => {
      req.destroy();
      resolve(generateFallbackProposalSavings(specs));
    });

    req.write(postData);
    req.end();
  });
}

module.exports = {
  analyzeLeadWithGemini,
  generateFallbackInsights,
  generateProposalSavingsWithGemini,
  generateFallbackProposalSavings
};
