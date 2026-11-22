import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Service } from "../models/Service.js";

const services = [
  ["Signature Haircut", "Haircut & Styling", 35, 45, "A consultation-led cut, finished with a polished blow-dry."],
  ["Luminous Color", "Hair Coloring", 95, 120, "Rich, dimensional colour tailored to your complexion and style."],
  ["Silk Repair Ritual", "Hair Treatment", 48, 50, "Deep nourishment that leaves stressed hair smooth and luminous."],
  ["Radiance Facial", "Facial & Skincare", 62, 60, "A glow-restoring treatment with gentle exfoliation and hydration."],
  ["Event Makeup", "Makeup", 75, 70, "Camera-ready makeup that feels like the most confident version of you."],
  ["Classic Manicure", "Manicure & Pedicure", 32, 45, "Detailed nail care, shaping, and your choice of timeless colour."],
  ["Calm Body Massage", "Spa & Massage", 80, 75, "A restorative full-body massage designed around your needs."],
];
const image = "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=85";

try {
  await connectDatabase();
  for (const [serviceName, category, price, duration, description] of services) {
    await Service.updateOne({ serviceName }, { $setOnInsert: { serviceName, category, price, duration, description, image, status: "active" } }, { upsert: true });
  }
  console.log(`Seeded ${services.length} salon services.`);
} finally { await disconnectDatabase(); }
