const { drizzle } = require("drizzle-orm/mysql2");
const { fireStandards } = require("./drizzle/schema");

const db = drizzle(process.env.DATABASE_URL);

const standards = [
  {
    standardCode: "RRFSO 2005",
    title: "Regulatory Reform (Fire Safety) Order 2005",
    description: "UK fire safety legislation for non-domestic premises",
    category: "general",
    keyRequirements: JSON.stringify([
      "Conduct fire risk assessment",
      "Identify fire hazards and risks",
      "Implement fire safety measures",
      "Maintain fire safety systems",
      "Provide staff training",
      "Establish emergency procedures"
    ]),
    applicableBuildingTypes: "commercial,industrial,residential"
  },
  {
    standardCode: "NFPA 101",
    title: "Life Safety Code",
    description: "Provides guidance on fire prevention, detection, and life safety",
    category: "exits",
    keyRequirements: JSON.stringify([
      "Minimum 2 exits for occupancy >50",
      "Exit width: 0.2 inches per person",
      "Maximum travel distance to exit: 250 feet",
      "Illuminated exit signs required",
      "Emergency lighting required"
    ]),
    applicableBuildingTypes: "commercial,industrial,residential"
  },
  {
    standardCode: "NFPA 13",
    title: "Standard for the Installation of Sprinkler Systems",
    description: "Requirements for automatic sprinkler system design and installation",
    category: "sprinklers",
    keyRequirements: JSON.stringify([
      "Sprinkler spacing based on hazard classification",
      "Water supply minimum 500 GPM",
      "Pressure requirements: 7-100 PSI",
      "Annual inspection and testing required",
      "Maintenance records must be kept"
    ]),
    applicableBuildingTypes: "commercial,industrial"
  },
  {
    standardCode: "NFPA 72",
    title: "National Fire Alarm and Signaling Code",
    description: "Fire alarm system design, installation, and maintenance",
    category: "alarms",
    keyRequirements: JSON.stringify([
      "Fire alarm system required for buildings >5000 sq ft",
      "Manual pull stations within 5 feet of exits",
      "Audible alarm minimum 70 dB",
      "Annual inspection and testing required",
      "24-hour monitoring recommended"
    ]),
    applicableBuildingTypes: "commercial,industrial,residential"
  },
  {
    standardCode: "BS 5306-1",
    title: "Fire Extinguishers - Portable",
    description: "Specification and maintenance of portable fire extinguishers",
    category: "fire_extinguishers",
    keyRequirements: JSON.stringify([
      "One extinguisher per 200 sq meters",
      "Type A for ordinary combustibles",
      "Type B for flammable liquids",
      "Type C for electrical fires",
      "Annual professional inspection required",
      "Accessible and clearly marked"
    ]),
    applicableBuildingTypes: "commercial,industrial,residential"
  },
  {
    standardCode: "IEC 60364",
    title: "Low-voltage electrical installations",
    description: "Electrical safety standards and requirements",
    category: "electrical",
    keyRequirements: JSON.stringify([
      "RCD protection for circuits",
      "Circuit breakers and fuses properly rated",
      "Periodic inspection every 5 years",
      "Portable appliance testing (PAT)",
      "Fixed installation testing annually",
      "No overloaded sockets or extension cords"
    ]),
    applicableBuildingTypes: "commercial,industrial,residential"
  },
  {
    standardCode: "BS 5839-1",
    title: "Fire Detection and Fire Alarm Systems",
    description: "Code of practice for design, installation and maintenance",
    category: "detection",
    keyRequirements: JSON.stringify([
      "Smoke detectors in all areas",
      "Heat detectors in kitchens",
      "Detectors tested monthly",
      "Battery backup required",
      "Maintenance plan required",
      "Professional servicing annually"
    ]),
    applicableBuildingTypes: "commercial,industrial,residential"
  },
  {
    standardCode: "BS 9999",
    title: "Code of practice for fire safety in the design of buildings",
    description: "Fire safety design principles and requirements",
    category: "general",
    keyRequirements: JSON.stringify([
      "Fire-resistant construction materials",
      "Compartmentation to limit fire spread",
      "Adequate ventilation systems",
      "Accessible escape routes",
      "Emergency lighting and signage",
      "Regular maintenance and testing"
    ]),
    applicableBuildingTypes: "commercial,industrial,residential"
  },
  {
    standardCode: "NFPA 54",
    title: "National Fuel Gas Code",
    description: "Gas appliance installation and safety",
    category: "gas_safety",
    keyRequirements: JSON.stringify([
      "Gas appliances professionally installed",
      "Annual gas safety inspection required",
      "CO detectors required",
      "Proper ventilation for combustion appliances",
      "Gas supply shut-off valve accessible",
      "Leak detection and repair procedures"
    ]),
    applicableBuildingTypes: "commercial,residential"
  },
  {
    standardCode: "BS 6266",
    title: "Code of practice for fire protection of buildings",
    description: "General fire protection guidance",
    category: "general",
    keyRequirements: JSON.stringify([
      "Fire risk assessment required",
      "Housekeeping standards maintained",
      "Combustible materials properly stored",
      "No smoking policies enforced",
      "Staff training and drills conducted",
      "Emergency procedures documented"
    ]),
    applicableBuildingTypes: "commercial,industrial,residential"
  },
  {
    standardCode: "NFPA 30",
    title: "Flammable and Combustible Liquids Code",
    description: "Storage and handling of flammable liquids",
    category: "hazardous_materials",
    keyRequirements: JSON.stringify([
      "Flammable liquids in approved cabinets",
      "Maximum 25 gallons in work areas",
      "Proper labeling and signage",
      "Grounding and bonding required",
      "Spill containment and cleanup procedures",
      "Ventilation requirements"
    ]),
    applicableBuildingTypes: "industrial"
  },
  {
    standardCode: "BS 5266-1",
    title: "Emergency lighting - Code of practice",
    description: "Emergency lighting design and maintenance",
    category: "emergency_lighting",
    keyRequirements: JSON.stringify([
      "Emergency lighting in all escape routes",
      "Minimum 0.5 lux on escape routes",
      "Exit signs illuminated",
      "Battery backup for 3 hours minimum",
      "Monthly testing required",
      "Annual professional inspection"
    ]),
    applicableBuildingTypes: "commercial,industrial,residential"
  }
];

async function seed() {
  try {
    console.log("Seeding fire safety standards...");
    
    for (const standard of standards) {
      await db.insert(fireStandards).values(standard);
      console.log(`✓ Inserted ${standard.standardCode}`);
    }
    
    console.log("\n✅ Successfully seeded all fire safety standards!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding standards:", error);
    process.exit(1);
  }
}

seed();
