const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");
const ADMIN_EMAIL = "j.de.haas@digitalcc.nl";
const FROM_EMAIL = "Best Cheesecake <noreply@bestcheesecakeintheworld.com>";

// ── CORS helper ───────────────────────────────────────────────

function cors(req, res) {
  res.set("Access-Control-Allow-Origin", "https://bestcheesecakeintheworld.com");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).send(""); return true; }
  return false;
}

// ── Email helper (Resend) ─────────────────────────────────────

async function sendEmail(apiKey, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [ADMIN_EMAIL], subject, html }),
  });
  if (!res.ok) console.warn("Resend error:", await res.text());
}

// ── FCM helper ────────────────────────────────────────────────

async function notifyAdmins(title, body) {
  try {
    await getMessaging().send({
      topic: "admins",
      notification: { title, body },
      apns: { payload: { aps: { sound: "default", badge: 1 } } },
    });
  } catch (e) {
    console.warn("FCM send failed:", e.message);
  }
}

// ── handleForm — single endpoint for all three website forms ──
//
// form_type "cheesecake_submission" → Firestore + FCM to admins
// form_type "assessment_request"    → Firestore + email to admin
// form_type "contact"               → Firestore + email to admin
//
// Bot protection: honeypot field _gotcha (must be empty) +
//                 timing field _ts (must be at least 2 seconds old)

exports.handleForm = onRequest(
  { region: "europe-west1", secrets: [RESEND_API_KEY] },
  async (req, res) => {
    if (cors(req, res)) return;
    if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }

    const body = req.body;
    if (!body || typeof body !== "object") { res.status(400).json({ error: "Invalid body" }); return; }

    // Honeypot — bots fill this, humans don't
    if (body._gotcha) { res.status(200).json({ ok: true }); return; }

    // Timing — reject submissions under 2 seconds (bots are instant)
    const elapsed = Date.now() - parseInt(body._ts || "0", 10);
    if (elapsed < 2000) { res.status(200).json({ ok: true }); return; }

    const formType = body.form_type;
    const receivedAt = FieldValue.serverTimestamp();
    const apiKey = RESEND_API_KEY.value();

    try {
      if (formType === "contact") {
        if (!body.name || !body.email || !body.message) {
          res.status(400).json({ error: "Missing required fields" }); return;
        }
        await db.collection("contact_messages").add({
          name: body.name,
          email: body.email,
          subject: body.subject || null,
          message: body.message,
          receivedAt,
          isRead: false,
        });
        await sendEmail(
          apiKey,
          `[BCW] Message from ${body.name}${body.subject ? `: ${body.subject}` : ""}`,
          `<p><strong>From:</strong> ${body.name} &lt;${body.email}&gt;</p>
           ${body.subject ? `<p><strong>Subject:</strong> ${body.subject}</p>` : ""}
           <p><strong>Message:</strong></p>
           <p style="white-space:pre-wrap">${body.message}</p>`
        );

      } else if (formType === "assessment_request") {
        if (!body.venue || !body.address || !body.websiteUrl || !body.contactPerson || !body.email) {
          res.status(400).json({ error: "Missing required fields" }); return;
        }
        await db.collection("assessment_requests").add({
          venue: body.venue,
          address: body.address,
          websiteUrl: body.websiteUrl || null,
          contactPerson: body.contactPerson,
          email: body.email,
          phone: body.phone || null,
          message: body.message || null,
          receivedAt,
          isRead: false,
        });
        await sendEmail(
          apiKey,
          `[BCW] Assessment request: ${body.venue}`,
          `<p><strong>Venue:</strong> ${body.venue}</p>
           <p><strong>Address:</strong> ${body.address}</p>
           <p><strong>Website:</strong> <a href="${body.websiteUrl}">${body.websiteUrl}</a></p>
           <p><strong>Contact:</strong> ${body.contactPerson} &lt;${body.email}&gt;${body.phone ? ` / ${body.phone}` : ""}</p>
           ${body.message ? `<p><strong>Message:</strong><br><span style="white-space:pre-wrap">${body.message}</span></p>` : ""}`
        );

      } else if (formType === "cheesecake_submission") {
        if (!body.venue || !body.city || !body.country || !body.submitterName || !body.submitterEmail) {
          res.status(400).json({ error: "Missing required fields" }); return;
        }
        await db.collection("cheesecake_submissions").add({
          venue: body.venue,
          city: body.city,
          country: body.country,
          address: body.address || null,
          websiteUrl: body.websiteUrl || null,
          rating: parseFloat(body.rating) || null,
          shortNote: body.shortNote || null,
          description: body.description || null,
          photoUrl: body.photoUrl || null,
          year: body.year ? parseInt(body.year) : null,
          submitterName: body.submitterName,
          submitterEmail: body.submitterEmail,
          receivedAt,
          isRead: false,
          status: "pending",
        });
        await notifyAdmins(
          "Cheesecake Submission",
          `${body.submitterName} submitted: ${body.venue}, ${body.city}`
        );

      } else {
        res.status(400).json({ error: "Unknown form_type" }); return;
      }

      res.status(200).json({ ok: true });

    } catch (err) {
      console.error("handleForm error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

// ── Notify assessors when a new assessment is submitted via iOS app ──
// The iOS app writes directly to Firestore; this trigger sends the FCM
// push so other assessors are alerted to open the app and review.

exports.onAssessmentCreated = onDocumentCreated(
  { document: "assessments/{assessmentId}", region: "europe-west1" },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    await notifyAdmins(
      "New Assessment to Review",
      `${data.submittedByName || "Someone"} submitted: ${data.venueName}, ${data.city}`
    );
  }
);
