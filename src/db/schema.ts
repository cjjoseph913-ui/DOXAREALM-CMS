import { pgTable, serial, text, integer, timestamp, jsonb, real, boolean } from "drizzle-orm/pg-core";

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  gender: text("gender"),
  ageRange: text("age_range"),
  maritalStatus: text("marital_status"),
  occupation: text("occupation"),
  address: text("address"),
  city: text("city"),
  // Baptism - Water
  waterBaptismStatus: text("water_baptism_status").default("Not Baptized"),
  waterBaptismDate: timestamp("water_baptism_date"),
  waterBaptismLocation: text("water_baptism_location"),
  waterBaptismBy: text("water_baptism_by"),
  waterBaptismCertificate: text("water_baptism_certificate"),
  // Baptism - Holy Spirit
  holySpiritBaptismStatus: text("holy_spirit_baptism_status").default("Not Baptized"),
  holySpiritBaptismDate: timestamp("holy_spirit_baptism_date"),
  holySpiritEvidence: text("holy_spirit_evidence"),
  holySpiritNotes: text("holy_spirit_notes"),
  // Affiliation
  churchId: integer("church_id"),
  zoneId: integer("zone_id"),
  cellGroupId: integer("cell_group_id"),
  departmentId: integer("department_id"),
  department: text("department").default("Member"),
  leadershipRole: text("leadership_role").default("Member"),
  status: text("status").default("Active"),
  conversionDate: timestamp("conversion_date"),
  membershipDate: timestamp("membership_date"),
  givingHistory: jsonb("giving_history"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  // Youth specific fields (13-45 yrs)
  isYouth: boolean("is_youth").default(false),
  youthAge: integer("youth_age"),
  youthMinistryRole: text("youth_ministry_role"),
  youthEducationStage: text("youth_education_stage"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  followUpStatus: text("follow_up_status").default("Pending"),
  progressHistory: jsonb("progress_history"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const converts = pgTable("converts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact"),
  step: text("step").default("Assigned"),
  notes: text("notes"),
  progress: jsonb("progress"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const churches = pgTable("churches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("Tanzania"),
  pastorName: text("pastor_name"),
  pastorPhone: text("pastor_phone"),
  pastorEmail: text("pastor_email"),
  phone: text("phone"),
  email: text("email"),
  serviceTimes: jsonb("service_times"),
  establishmentDate: timestamp("establishment_date"),
  capacity: integer("capacity"),
  description: text("description"),
  youthCount: integer("youth_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const zones = pgTable("zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  churchId: integer("church_id"),
  leaderName: text("leader_name"),
  leaderPhone: text("leader_phone"),
  leaderEmail: text("leader_email"),
  description: text("description"),
  meetingArea: text("meeting_area"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cellGroups = pgTable("cell_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  zoneId: integer("zone_id"),
  churchId: integer("church_id"),
  leaderName: text("leader_name"),
  leaderPhone: text("leader_phone"),
  leaderEmail: text("leader_email"),
  meetingDay: text("meeting_day"),
  meetingTime: text("meeting_time"),
  location: text("location"),
  address: text("address"),
  maxCapacity: integer("max_capacity").default(15),
  currentMembers: integer("current_members").default(0),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendanceLogs = pgTable("attendance_logs", {
  id: serial("id").primaryKey(),
  date: timestamp("date"),
  attendance: integer("attendance").default(0),
  visitorCount: integer("visitor_count").default(0),
  // Financial breakdown
  tithe: real("tithe").default(0),
  offering: real("offering").default(0),
  seed: real("seed").default(0),
  firstFruit: real("first_fruit").default(0),
  gospel: real("gospel").default(0),
  youth: real("youth").default(0),
  other: real("other").default(0),
  currency: text("currency").default("TZS"),
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const communicationLogs = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  type: text("type"),
  recipientId: text("recipient_id"),
  subject: text("subject"),
  message: text("message"),
  template: text("template"),
  date: timestamp("date").defaultNow(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action"),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const stewardshipSettings = pgTable("stewardship_settings", {
  id: serial("id").primaryKey(),
  baseCurrency: text("base_currency").default("TZS"),
  monthlyCellTarget: integer("monthly_cell_target").default(20),
  titheGoalPercentage: real("tithe_goal_percentage").default(10),
  customZones: jsonb("custom_zones"),
  contributionCategories: jsonb("contribution_categories").default(['tithe','offering','seed','first_fruit','gospel','youth','other']),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  size: integer("size"),
  type: text("type"),
  url: text("url"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});
