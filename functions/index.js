const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();

// ── CORS helper ───────────────────────────────────────────────

function cors(req, res) {
  res.set("Access-Control-Allow-Origin", "https://bestcheesecakeintheworld.com");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).send(""); return true; }
  return false;
}

// ── Notification helper ───────────────────────────────────────

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
// Posted fields always include `form_type`:
//   "cheesecake_submission" → saved to Firestore collection "cheesecake_submissions"
//   "assessment_request"    → saved to "assessment_requests"
//   "contact"               → saved to "contact_messages"

exports.handleForm = onRequest({ region: "europe-west1" }, async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }

  const body = req.body;
  if (!body || typeof body !== "object") { res.status(400).json({ error: "Invalid body" }); return; }

  const formType = body.form_type;
  const receivedAt = FieldValue.serverTimestamp();

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
      await notifyAdmins(
        "New Message",
        `${body.name}: ${body.subject || body.message.slice(0, 60)}`
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
      await notifyAdmins(
        "Assessment Request",
        `${body.venue} in ${body.address} wants an assessment`
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
});
