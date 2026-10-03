// import React, { useState, useEffect } from "react";
// import {
//   LineChart,
//   Line,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   ResponsiveContainer,
//   Tooltip,
//   Legend,
//   PieChart,
//   Pie,
//   Cell,
//   AreaChart,
//   Area,
// } from "recharts";
// import {
//   BookOpenCheck,
//   Users,
//   Award,
//   TrendingUp,
//   TrendingDown,
//   Calendar,
//   Clock,
//   CheckCircle,
//   AlertCircle,
//   Download,
//   Filter,
//   Search,
// } from "lucide-react";

// // ============================================================
// // MOCK DATA - PHARMACY COURSES (Default)
// // ============================================================

// const PHARMACY_COURSES = [
//   { courseId: "BPHARM", courseName: "B.Pharm", studentCount: 420 },
//   { courseId: "DPHARM", courseName: "D.Pharm", studentCount: 180 },
//   { courseId: "PHARMD", courseName: "Pharm.D", studentCount: 120 },
//   {
//     courseId: "MPHARM-P",
//     courseName: "M.Pharm Pharmaceutics",
//     studentCount: 60,
//   },
//   {
//     courseId: "MPHARM-C",
//     courseName: "M.Pharm Pharmacology",
//     studentCount: 45,
//   },
//   {
//     courseId: "MPHARM-QA",
//     courseName: "M.Pharm Quality Assurance",
//     studentCount: 40,
//   },
// ];

// // ============================================================
// // MOCK DATA - ENGINEERING COURSES
// // ============================================================

// const ENGINEERING_COURSES = [
//   { courseId: "CSE101", courseName: "Computer Science", studentCount: 450 },
//   { courseId: "ECE201", courseName: "Electronics", studentCount: 320 },
//   { courseId: "MECH301", courseName: "Mechanical", studentCount: 280 },
//   { courseId: "CIVIL401", courseName: "Civil", studentCount: 200 },
//   { courseId: "MBA501", courseName: "MBA", studentCount: 180 },
//   { courseId: "BBA601", courseName: "BBA", studentCount: 150 },
// ];

// // ============================================================
// // MOCK DATA - PHARMACY SEMESTERS
// // ============================================================

// const PHARMACY_SEMESTERS: Record<
//   string,
//   { semesterId: string; studentCount: number }[]
// > = {
//   BPHARM: [
//     { semesterId: "Semester 1", studentCount: 120 },
//     { semesterId: "Semester 2", studentCount: 115 },
//     { semesterId: "Semester 3", studentCount: 110 },
//     { semesterId: "Semester 4", studentCount: 105 },
//     { semesterId: "Semester 5", studentCount: 98 },
//     { semesterId: "Semester 6", studentCount: 92 },
//   ],
//   DPHARM: [
//     { semesterId: "Semester 1", studentCount: 85 },
//     { semesterId: "Semester 2", studentCount: 82 },
//     { semesterId: "Semester 3", studentCount: 78 },
//     { semesterId: "Semester 4", studentCount: 75 },
//     { semesterId: "Semester 5", studentCount: 70 },
//     { semesterId: "Semester 6", studentCount: 65 },
//   ],
//   PHARMD: [
//     { semesterId: "Semester 1", studentCount: 75 },
//     { semesterId: "Semester 2", studentCount: 72 },
//     { semesterId: "Semester 3", studentCount: 68 },
//     { semesterId: "Semester 4", studentCount: 65 },
//     { semesterId: "Semester 5", studentCount: 60 },
//     { semesterId: "Semester 6", studentCount: 55 },
//   ],
//   "MPHARM-P": [
//     { semesterId: "Semester 1", studentCount: 55 },
//     { semesterId: "Semester 2", studentCount: 52 },
//     { semesterId: "Semester 3", studentCount: 48 },
//     { semesterId: "Semester 4", studentCount: 45 },
//     { semesterId: "Semester 5", studentCount: 40 },
//     { semesterId: "Semester 6", studentCount: 38 },
//   ],
//   "MPHARM-C": [
//     { semesterId: "Semester 1", studentCount: 50 },
//     { semesterId: "Semester 2", studentCount: 48 },
//     { semesterId: "Semester 3", studentCount: 45 },
//     { semesterId: "Semester 4", studentCount: 42 },
//     { semesterId: "Semester 5", studentCount: 38 },
//     { semesterId: "Semester 6", studentCount: 35 },
//   ],
//   "MPHARM-QA": [
//     { semesterId: "Semester 1", studentCount: 42 },
//     { semesterId: "Semester 2", studentCount: 40 },
//     { semesterId: "Semester 3", studentCount: 38 },
//     { semesterId: "Semester 4", studentCount: 35 },
//     { semesterId: "Semester 5", studentCount: 32 },
//     { semesterId: "Semester 6", studentCount: 30 },
//   ],
// };

// // ============================================================
// // MOCK DATA - ENGINEERING SEMESTERS
// // ============================================================

// const ENGINEERING_SEMESTERS: Record<
//   string,
//   { semesterId: string; studentCount: number }[]
// > = {
//   CSE101: [
//     { semesterId: "Semester 1", studentCount: 120 },
//     { semesterId: "Semester 2", studentCount: 115 },
//     { semesterId: "Semester 3", studentCount: 110 },
//     { semesterId: "Semester 4", studentCount: 105 },
//     { semesterId: "Semester 5", studentCount: 98 },
//     { semesterId: "Semester 6", studentCount: 92 },
//   ],
//   ECE201: [
//     { semesterId: "Semester 1", studentCount: 85 },
//     { semesterId: "Semester 2", studentCount: 82 },
//     { semesterId: "Semester 3", studentCount: 78 },
//     { semesterId: "Semester 4", studentCount: 75 },
//     { semesterId: "Semester 5", studentCount: 70 },
//     { semesterId: "Semester 6", studentCount: 65 },
//   ],
//   MECH301: [
//     { semesterId: "Semester 1", studentCount: 75 },
//     { semesterId: "Semester 2", studentCount: 72 },
//     { semesterId: "Semester 3", studentCount: 68 },
//     { semesterId: "Semester 4", studentCount: 65 },
//     { semesterId: "Semester 5", studentCount: 60 },
//     { semesterId: "Semester 6", studentCount: 55 },
//   ],
//   CIVIL401: [
//     { semesterId: "Semester 1", studentCount: 55 },
//     { semesterId: "Semester 2", studentCount: 52 },
//     { semesterId: "Semester 3", studentCount: 48 },
//     { semesterId: "Semester 4", studentCount: 45 },
//     { semesterId: "Semester 5", studentCount: 40 },
//     { semesterId: "Semester 6", studentCount: 38 },
//   ],
//   MBA501: [
//     { semesterId: "Semester 1", studentCount: 50 },
//     { semesterId: "Semester 2", studentCount: 48 },
//     { semesterId: "Semester 3", studentCount: 45 },
//     { semesterId: "Semester 4", studentCount: 42 },
//     { semesterId: "Semester 5", studentCount: 38 },
//     { semesterId: "Semester 6", studentCount: 35 },
//   ],
//   BBA601: [
//     { semesterId: "Semester 1", studentCount: 42 },
//     { semesterId: "Semester 2", studentCount: 40 },
//     { semesterId: "Semester 3", studentCount: 38 },
//     { semesterId: "Semester 4", studentCount: 35 },
//     { semesterId: "Semester 5", studentCount: 32 },
//     { semesterId: "Semester 6", studentCount: 30 },
//   ],
// };

// // ============================================================
// // MOCK DATA - PHARMACY PASS/FAIL
// // ============================================================

// const PHARMACY_PASS_FAIL: Record<
//   string,
//   { semesterId: string; passCount: number; failCount: number }[]
// > = {
//   BPHARM: [
//     { semesterId: "Semester 1", passCount: 108, failCount: 12 },
//     { semesterId: "Semester 2", passCount: 102, failCount: 13 },
//     { semesterId: "Semester 3", passCount: 95, failCount: 15 },
//     { semesterId: "Semester 4", passCount: 88, failCount: 17 },
//     { semesterId: "Semester 5", passCount: 80, failCount: 18 },
//     { semesterId: "Semester 6", passCount: 75, failCount: 17 },
//   ],
//   DPHARM: [
//     { semesterId: "Semester 1", passCount: 72, failCount: 13 },
//     { semesterId: "Semester 2", passCount: 68, failCount: 14 },
//     { semesterId: "Semester 3", passCount: 63, failCount: 15 },
//     { semesterId: "Semester 4", passCount: 58, failCount: 17 },
//     { semesterId: "Semester 5", passCount: 52, failCount: 18 },
//     { semesterId: "Semester 6", passCount: 47, failCount: 18 },
//   ],
//   PHARMD: [
//     { semesterId: "Semester 1", passCount: 62, failCount: 13 },
//     { semesterId: "Semester 2", passCount: 58, failCount: 14 },
//     { semesterId: "Semester 3", passCount: 53, failCount: 15 },
//     { semesterId: "Semester 4", passCount: 48, failCount: 17 },
//     { semesterId: "Semester 5", passCount: 42, failCount: 18 },
//     { semesterId: "Semester 6", passCount: 38, failCount: 17 },
//   ],
//   "MPHARM-P": [
//     { semesterId: "Semester 1", passCount: 45, failCount: 10 },
//     { semesterId: "Semester 2", passCount: 42, failCount: 10 },
//     { semesterId: "Semester 3", passCount: 38, failCount: 10 },
//     { semesterId: "Semester 4", passCount: 35, failCount: 10 },
//     { semesterId: "Semester 5", passCount: 30, failCount: 10 },
//     { semesterId: "Semester 6", passCount: 28, failCount: 10 },
//   ],
//   "MPHARM-C": [
//     { semesterId: "Semester 1", passCount: 42, failCount: 8 },
//     { semesterId: "Semester 2", passCount: 40, failCount: 8 },
//     { semesterId: "Semester 3", passCount: 37, failCount: 8 },
//     { semesterId: "Semester 4", passCount: 35, failCount: 7 },
//     { semesterId: "Semester 5", passCount: 30, failCount: 8 },
//     { semesterId: "Semester 6", passCount: 27, failCount: 8 },
//   ],
//   "MPHARM-QA": [
//     { semesterId: "Semester 1", passCount: 35, failCount: 7 },
//     { semesterId: "Semester 2", passCount: 33, failCount: 7 },
//     { semesterId: "Semester 3", passCount: 30, failCount: 8 },
//     { semesterId: "Semester 4", passCount: 28, failCount: 7 },
//     { semesterId: "Semester 5", passCount: 25, failCount: 7 },
//     { semesterId: "Semester 6", passCount: 23, failCount: 7 },
//   ],
// };

// // ============================================================
// // MOCK DATA - ENGINEERING PASS/FAIL
// // ============================================================

// const ENGINEERING_PASS_FAIL: Record<
//   string,
//   { semesterId: string; passCount: number; failCount: number }[]
// > = {
//   CSE101: [
//     { semesterId: "Semester 1", passCount: 108, failCount: 12 },
//     { semesterId: "Semester 2", passCount: 102, failCount: 13 },
//     { semesterId: "Semester 3", passCount: 95, failCount: 15 },
//     { semesterId: "Semester 4", passCount: 88, failCount: 17 },
//     { semesterId: "Semester 5", passCount: 80, failCount: 18 },
//     { semesterId: "Semester 6", passCount: 75, failCount: 17 },
//   ],
//   ECE201: [
//     { semesterId: "Semester 1", passCount: 72, failCount: 13 },
//     { semesterId: "Semester 2", passCount: 68, failCount: 14 },
//     { semesterId: "Semester 3", passCount: 63, failCount: 15 },
//     { semesterId: "Semester 4", passCount: 58, failCount: 17 },
//     { semesterId: "Semester 5", passCount: 52, failCount: 18 },
//     { semesterId: "Semester 6", passCount: 47, failCount: 18 },
//   ],
//   MECH301: [
//     { semesterId: "Semester 1", passCount: 62, failCount: 13 },
//     { semesterId: "Semester 2", passCount: 58, failCount: 14 },
//     { semesterId: "Semester 3", passCount: 53, failCount: 15 },
//     { semesterId: "Semester 4", passCount: 48, failCount: 17 },
//     { semesterId: "Semester 5", passCount: 42, failCount: 18 },
//     { semesterId: "Semester 6", passCount: 38, failCount: 17 },
//   ],
//   CIVIL401: [
//     { semesterId: "Semester 1", passCount: 45, failCount: 10 },
//     { semesterId: "Semester 2", passCount: 42, failCount: 10 },
//     { semesterId: "Semester 3", passCount: 38, failCount: 10 },
//     { semesterId: "Semester 4", passCount: 35, failCount: 10 },
//     { semesterId: "Semester 5", passCount: 30, failCount: 10 },
//     { semesterId: "Semester 6", passCount: 28, failCount: 10 },
//   ],
//   MBA501: [
//     { semesterId: "Semester 1", passCount: 42, failCount: 8 },
//     { semesterId: "Semester 2", passCount: 40, failCount: 8 },
//     { semesterId: "Semester 3", passCount: 37, failCount: 8 },
//     { semesterId: "Semester 4", passCount: 35, failCount: 7 },
//     { semesterId: "Semester 5", passCount: 30, failCount: 8 },
//     { semesterId: "Semester 6", passCount: 27, failCount: 8 },
//   ],
//   BBA601: [
//     { semesterId: "Semester 1", passCount: 35, failCount: 7 },
//     { semesterId: "Semester 2", passCount: 33, failCount: 7 },
//     { semesterId: "Semester 3", passCount: 30, failCount: 8 },
//     { semesterId: "Semester 4", passCount: 28, failCount: 7 },
//     { semesterId: "Semester 5", passCount: 25, failCount: 7 },
//     { semesterId: "Semester 6", passCount: 23, failCount: 7 },
//   ],
// };

// // ============================================================
// // MOCK DATA - PHARMACY EXAM TYPES
// // ============================================================

// const PHARMACY_EXAM_TYPES: Record<
//   string,
//   { semesterId: string; examType: string; studentCount: number }[]
// > = {
//   BPHARM: [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 95 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 15 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 10 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 88 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 14 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 13 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 80 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 12 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 18 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 75 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 10 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 20 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 68 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 8 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 22 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 62 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 24 },
//   ],
//   DPHARM: [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 60 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 12 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 13 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 55 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 13 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 14 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 50 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 12 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 16 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 45 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 10 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 20 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 38 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 8 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 24 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 32 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 27 },
//   ],
//   PHARMD: [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 52 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 10 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 13 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 48 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 10 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 14 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 42 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 8 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 18 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 38 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 7 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 20 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 32 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 22 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 28 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 5 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 22 },
//   ],
//   "MPHARM-P": [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 40 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 8 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 7 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 37 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 7 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 8 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 33 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 9 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 30 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 5 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 10 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 26 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 4 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 10 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 23 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 3 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 12 },
//   ],
//   "MPHARM-C": [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 35 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 8 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 7 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 33 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 7 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 8 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 30 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 9 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 28 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 5 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 9 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 24 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 4 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 10 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 22 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 3 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 10 },
//   ],
//   "MPHARM-QA": [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 30 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 6 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 28 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 6 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 25 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 5 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 8 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 22 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 4 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 9 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 20 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 3 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 9 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 18 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 3 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 9 },
//   ],
// };

// // ============================================================
// // MOCK DATA - ENGINEERING EXAM TYPES
// // ============================================================

// const ENGINEERING_EXAM_TYPES: Record<
//   string,
//   { semesterId: string; examType: string; studentCount: number }[]
// > = {
//   CSE101: [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 95 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 15 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 10 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 88 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 14 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 13 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 80 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 12 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 18 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 75 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 10 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 20 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 68 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 8 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 22 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 62 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 24 },
//   ],
//   ECE201: [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 60 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 12 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 13 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 55 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 13 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 14 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 50 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 12 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 16 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 45 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 10 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 20 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 38 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 8 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 24 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 32 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 27 },
//   ],
//   MECH301: [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 52 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 10 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 13 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 48 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 10 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 14 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 42 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 8 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 18 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 38 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 7 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 20 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 32 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 22 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 28 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 5 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 22 },
//   ],
//   CIVIL401: [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 40 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 8 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 7 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 37 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 7 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 8 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 33 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 9 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 30 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 5 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 10 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 26 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 4 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 10 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 23 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 3 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 12 },
//   ],
//   MBA501: [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 35 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 8 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 7 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 33 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 7 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 8 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 30 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 9 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 28 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 5 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 9 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 24 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 4 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 10 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 22 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 3 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 10 },
//   ],
//   BBA601: [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 30 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 6 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 28 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 6 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 25 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 5 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 8 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 22 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 4 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 9 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 20 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 3 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 9 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 18 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 3 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 9 },
//   ],
// };

// // Exam Lifecycle Data
// const LIFECYCLE_DATA = [
//   { stage: "Exam Created", students: 450 },
//   { stage: "Students Assigned", students: 435 },
//   { stage: "Seat No. Assigned", students: 425 },
//   { stage: "Hall Ticket Released", students: 410 },
//   { stage: "Marks Entry Done", students: 385 },
//   { stage: "Gazette Generated", students: 355 },
//   { stage: "Result Declared", students: 325 },
// ];

// // Stats Cards
// const STATS_CARDS = [
//   {
//     title: "Total Students",
//     value: "1,580",
//     icon: Users,
//     color: "blue",
//   },
//   {
//     title: "Passing Rate",
//     value: "82.4%",
//     icon: Award,
//     color: "green",
//   },
//   {
//     title: "Exams Conducted",
//     value: "48",
//     icon: Calendar,
//     color: "purple",
//   },
//   {
//     title: "ATKT Students",
//     value: "124",
//     icon: AlertCircle,
//     color: "orange",
//   },
// ];

// // Pie Chart Colors
// const PIE_COLORS = ["#435CFF", "#00AFC0", "#FF6B6B", "#FFD93D", "#6C5CE7"];

// // ============================================================
// // COMPONENT
// // ============================================================

// const DummyDashboard: React.FC = () => {
//   // Get college ID from localStorage - THIS IS WHERE IT CHECKS

//   const getCollegeId = () => {
//     try {
//       const authUserStr = localStorage.getItem("authUser");
//       if (authUserStr) {
//         const authUser = JSON.parse(authUserStr);
//         // Check for collegeId in the authUser object
//         if (authUser && authUser.collegeId) {
//           return authUser.collegeId;
//         }
//         // Also check for CollegeId (case sensitive)
//         if (authUser && authUser.CollegeId) {
//           return authUser.CollegeId;
//         }
//       }
//       return "";
//     } catch (error) {
//       console.error("Error parsing authUser:", error);
//       return "";
//     }
//   };

//   const collegeId = getCollegeId();

//   // Determine if this is an engineering college
//   const isEngineeringCollege =
//     collegeId === "103ebf99-feb0-43bc-a312-56fe85d3bcc6" ||
//     collegeId === "103EBF99-FEB0-43BC-A312-56FE85D3BCC6";

//   // const collegeId = localStorage.getItem("collegeId") || "";

//   // // Determine if this is an engineering college
//   // const isEngineeringCollege =
//   //   collegeId === "103EBF99-FEB0-43BC-A312-56FE85D3BCC6";

//   // Select appropriate data based on college type
//   const MOCK_COURSES = isEngineeringCollege
//     ? ENGINEERING_COURSES
//     : PHARMACY_COURSES;
//   const MOCK_SEMESTERS = isEngineeringCollege
//     ? ENGINEERING_SEMESTERS
//     : PHARMACY_SEMESTERS;
//   const MOCK_PASS_FAIL = isEngineeringCollege
//     ? ENGINEERING_PASS_FAIL
//     : PHARMACY_PASS_FAIL;
//   const MOCK_EXAM_TYPES = isEngineeringCollege
//     ? ENGINEERING_EXAM_TYPES
//     : PHARMACY_EXAM_TYPES;

//   // Set first course as default selected
//   const [selectedCourseId, setSelectedCourseId] = useState<string>(
//     MOCK_COURSES[0]?.courseId || "",
//   );
//   const [activeSemester, setActiveSemester] = useState<string>("Semester 1");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [notification, setNotification] = useState<{
//     type: string;
//     message: string;
//   } | null>(null);

//   // Get current course data
//   const currentCourse = MOCK_COURSES.find(
//     (c) => c.courseId === selectedCourseId,
//   );
//   const semesters = MOCK_SEMESTERS[selectedCourseId] || [];
//   const passFailData = MOCK_PASS_FAIL[selectedCourseId] || [];
//   const examTypeData = MOCK_EXAM_TYPES[selectedCourseId] || [];

//   // Get data for selected semester
//   const selectedSemesterData = examTypeData.filter(
//     (d) => d.semesterId === activeSemester,
//   );

//   // Pie chart data for selected semester
//   const pieData = selectedSemesterData.map((d) => ({
//     name: d.examType,
//     value: d.studentCount,
//   }));

//   // Pivot exam type data for bar chart
//   const pivotedExamTypeData = React.useMemo(() => {
//     const map = new Map<
//       string,
//       { semesterId: string; Regular: number; Reval: number; ATKT: number }
//     >();
//     examTypeData.forEach((row) => {
//       if (!map.has(row.semesterId)) {
//         map.set(row.semesterId, {
//           semesterId: row.semesterId,
//           Regular: 0,
//           Reval: 0,
//           ATKT: 0,
//         });
//       }
//       const entry = map.get(row.semesterId)!;
//       if (row.examType === "Regular") entry.Regular = row.studentCount;
//       else if (row.examType === "Reval") entry.Reval = row.studentCount;
//       else if (row.examType === "ATKT") entry.ATKT = row.studentCount;
//     });
//     return Array.from(map.values());
//   }, [examTypeData]);

//   // Notification helper
//   const showNotification = (type: string, message: string) => {
//     setNotification({ type, message });
//     setTimeout(() => setNotification(null), 3000);
//   };

//   // Handle course selection
//   const handleCourseSelect = (courseId: string) => {
//     setIsLoading(true);
//     setSelectedCourseId(courseId);
//     const semesters = MOCK_SEMESTERS[courseId] || [];
//     if (semesters.length > 0) {
//       setActiveSemester(semesters[0].semesterId);
//     }
//     setTimeout(() => {
//       setIsLoading(false);
//       const course = MOCK_COURSES.find((c) => c.courseId === courseId);
//     }, 300);
//   };

//   const handleSemesterSelect = (semesterId: string) => {
//     setActiveSemester(semesterId);
//   };

//   // Filter courses
//   const filteredCourses = MOCK_COURSES.filter(
//     (course) =>
//       course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       course.courseId.toLowerCase().includes(searchTerm.toLowerCase()),
//   );

//   const totalStudents = pieData.reduce((total, item) => total + item.value, 0);

//   return (
//     <div className="min-h-screen bg-gray-50 p-4 md:p-6">
//       {/* Notification Toast */}
//       {notification && (
//         <div
//           className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
//             notification.type === "info"
//               ? "bg-blue-500"
//               : notification.type === "success"
//                 ? "bg-green-500"
//                 : notification.type === "error"
//                   ? "bg-red-500"
//                   : "bg-yellow-500"
//           } text-white max-w-md`}
//         >
//           {notification.message}
//         </div>
//       )}

//       {/* Stats Cards */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//         {STATS_CARDS.map((stat, index) => {
//           const Icon = stat.icon;
//           return (
//             <div
//               key={index}
//               className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
//             >
//               <div className="flex items-start justify-between">
//                 <div>
//                   <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
//                   <p className="text-2xl font-bold text-gray-900 mt-1">
//                     {stat.value}
//                   </p>
//                 </div>
//                 <div
//                   className={`p-2 rounded-lg ${
//                     stat.color === "blue"
//                       ? "bg-blue-50 text-blue-500"
//                       : stat.color === "green"
//                         ? "bg-green-50 text-green-500"
//                         : stat.color === "purple"
//                           ? "bg-purple-50 text-purple-500"
//                           : "bg-orange-50 text-orange-500"
//                   }`}
//                 >
//                   <Icon className="w-5 h-5" />
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Course Cards */}
//       <div className="mb-6">
//         <div className="flex items-center justify-between mb-3">
//           <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Courses</h2>
//           <div className="relative">
//             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search courses..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 md:w-64"
//             />
//           </div>
//         </div>
//         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
//           {filteredCourses.map((course) => (
//             <div
//               key={course.courseId}
//               onClick={() => handleCourseSelect(course.courseId)}
//               className={`cursor-pointer transition-all ${
//                 selectedCourseId === course.courseId
//                   ? "ring-2 ring-blue-500 rounded-xl shadow-md scale-[1.02]"
//                   : "hover:scale-[1.02]"
//               }`}
//             >
//               <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-4 shadow-sm transition-all duration-200 hover:shadow-md">
//                 <div
//                   className={`flex h-14 w-14 items-center justify-center rounded-full ${
//                     selectedCourseId === course.courseId
//                       ? "bg-blue-500 text-white"
//                       : "bg-blue-50 text-blue-600"
//                   }`}
//                 >
//                   <span className="text-lg font-bold">
//                     {course.studentCount}
//                   </span>
//                 </div>
//                 <div className="text-center min-w-0 w-full">
//                   <h3 className="text-xs font-semibold uppercase leading-tight text-[#17213F] dark:text-white truncate">
//                     {course.courseName}
//                   </h3>
//                   <p className="text-xs text-gray-500 dark:text-gray-400">{course.courseId}</p>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Main Layout - Semester Wizard on left, Charts on right */}
//       <div className="flex flex-col lg:flex-row gap-6">
//         {/* Semester Wizard - Fixed on left */}
//         <div className="lg:w-[300px] xl:w-[340px] flex-shrink-0">
//           <div className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] shadow-sm sticky top-4">
//             <div className="border-b-2 border-blue-500 px-6 py-4">
//               <h2 className="text-xl font-medium text-gray-900">
//                 Semester Details
//               </h2>
//               <p className="text-sm text-gray-500">
//                 {currentCourse?.courseName} - {currentCourse?.courseId}
//               </p>
//             </div>
//             <div className="px-6 py-5 max-h-[600px] overflow-y-auto">
//               {isLoading ? (
//                 <div className="flex items-center justify-center py-8">
//                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//                 </div>
//               ) : semesters.length === 0 ? (
//                 <p className="text-sm text-gray-500 text-center py-8">
//                   No semester data available
//                 </p>
//               ) : (
//                 <div className="relative">
//                   <div className="absolute left-[23px] top-5 bottom-5 w-px bg-gray-300 dark:bg-gray-700" />
//                   {semesters.map((semester) => {
//                     const isActive = activeSemester === semester.semesterId;
//                     return (
//                       <div
//                         key={semester.semesterId}
//                         className="relative flex min-h-[79px] cursor-pointer items-center"
//                         onClick={() =>
//                           handleSemesterSelect(semester.semesterId)
//                         }
//                       >
//                         <div
//                           className={`absolute inset-y-0 left-0 right-0 rounded-lg transition-colors ${
//                             isActive
//                               ? "bg-[#E5F7F9]"
//                               : "bg-transparent hover:bg-gray-50"
//                           }`}
//                         />
//                         <div
//                           className={`relative z-10 ml-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] bg-white dark:bg-gray-800 transition-colors ${
//                             isActive
//                               ? "border-[#00AFC0] text-[#00AFC0]"
//                               : "border-blue-500 text-blue-500"
//                           }`}
//                         >
//                           <BookOpenCheck className="h-5 w-5" strokeWidth={2} />
//                         </div>
//                         <div className="relative z-10 ml-4 py-3">
//                           <p
//                             className={`text-base font-medium ${isActive ? "text-gray-900 dark:text-white" : "text-[#17213F] dark:text-gray-200"}`}
//                           >
//                             {semester.semesterId}
//                           </p>
//                           <p
//                             className={`mt-1 text-sm ${isActive ? "text-[#00AFC0]" : "text-gray-700 dark:text-gray-400"}`}
//                           >
//                             Students: {semester.studentCount}
//                           </p>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Right Side - Charts Grid */}
//         <div className="flex-1 min-w-0">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Pass/Fail Chart */}
//             <div className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
//               <div className="flex items-start justify-between mb-2">
//                 <div>
//                   <h2 className="text-sm font-semibold text-gray-900">
//                     Pass / Fail
//                   </h2>
//                   <p className="text-xs text-gray-500">{activeSemester}</p>
//                 </div>
//               </div>
//               <div className="h-[200px] w-full">
//                 {isLoading ? (
//                   <div className="flex items-center justify-center h-full">
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//                   </div>
//                 ) : passFailData.length === 0 ? (
//                   <p className="text-sm text-gray-500 text-center pt-16">
//                     No data available
//                   </p>
//                 ) : (
//                   <ResponsiveContainer width="100%" height="100%">
//                     <BarChart
//                       data={passFailData}
//                       margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
//                       barGap={3}
//                     >
//                       <CartesianGrid vertical={false} stroke="#EEF1F5" />
//                       <XAxis
//                         dataKey="semesterId"
//                         axisLine={false}
//                         tickLine={false}
//                         tick={{ fontSize: 9, fill: "#263238" }}
//                         dy={5}
//                         interval={0}
//                         angle={-15}
//                         textAnchor="end"
//                         height={40}
//                       />
//                       <YAxis
//                         axisLine={false}
//                         tickLine={false}
//                         tick={{ fontSize: 9, fill: "#263238" }}
//                         width={30}
//                       />
//                       <Tooltip
//                         cursor={{ fill: "rgba(67, 92, 255, 0.04)" }}
//                         contentStyle={{
//                           borderRadius: "8px",
//                           border: "1px solid #E5E7EB",
//                           boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
//                           fontSize: "11px",
//                         }}
//                       />
//                       <Bar
//                         dataKey="passCount"
//                         name="Pass"
//                         fill="#00AFC0"
//                         radius={[3, 3, 0, 0]}
//                         maxBarSize={20}
//                       />
//                       <Bar
//                         dataKey="failCount"
//                         name="Fail"
//                         fill="#FF6B6B"
//                         radius={[3, 3, 0, 0]}
//                         maxBarSize={20}
//                       />
//                     </BarChart>
//                   </ResponsiveContainer>
//                 )}
//               </div>
//             </div>

//             {/* Pie Chart - Semester Exam Type Distribution */}
//             <div className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
//               <div className="flex items-start justify-between mb-2">
//                 <div>
//                   <h2 className="text-sm font-semibold text-gray-900">
//                     Exam Type Distribution
//                   </h2>
//                   <p className="text-xs text-gray-500">{activeSemester}</p>
//                 </div>
//               </div>
//               <div className="h-[200px] w-full">
//                 {isLoading ? (
//                   <div className="flex items-center justify-center h-full">
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//                   </div>
//                 ) : pieData.length === 0 ? (
//                   <p className="text-sm text-gray-500 text-center pt-16">
//                     No data available
//                   </p>
//                 ) : (
//                   <ResponsiveContainer width="100%" height="100%">
//                     <PieChart>
//                       <Pie
//                         data={pieData}
//                         cx="50%"
//                         cy="50%"
//                         innerRadius={40}
//                         outerRadius={70}
//                         paddingAngle={3}
//                         dataKey="value"
//                         label={({ name, value }) => `${name} ${value}`}
//                         labelLine={{ stroke: isDark ? "#667085" : "#94A3B8", strokeWidth: 1 }}
//                       >
//                         {pieData.map((entry, index) => (
//                           <Cell
//                             key={`cell-${index}`}
//                             fill={PIE_COLORS[index % PIE_COLORS.length]}
//                           />
//                         ))}
//                       </Pie>

//                       {/* Total in center */}
//                       <text
//                         x="50%"
//                         y="48%"
//                         textAnchor="middle"
//                         dominantBaseline="middle"
//                         className="fill-gray-900 dark:fill-white text-xl font-bold"
//                       >
//                         {totalStudents}
//                       </text>

//                       <text
//                         x="50%"
//                         y="60%"
//                         textAnchor="middle"
//                         dominantBaseline="middle"
//                         className="fill-gray-500 dark:fill-gray-400 text-[10px]"
//                       >
//                         Students
//                       </text>

//                       <Tooltip
//                         contentStyle={{
//                           borderRadius: "8px",
//                           border: "1px solid #E5E7EB",
//                           boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
//                           fontSize: "11px",
//                         }}
//                       />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 )}
//               </div>
//               {/* Legend for Pie Chart */}
//               <div className="flex justify-center gap-4 mt-1">
//                 {pieData.map((item, index) => (
//                   <div key={index} className="flex items-center gap-1">
//                     <span
//                       className="w-2.5 h-2.5 rounded-full"
//                       style={{
//                         backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
//                       }}
//                     />
//                     <span className="text-xs text-gray-600">{item.name}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Exam Lifecycle Chart - Full Width below all charts */}
//           <div className="mt-6 w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
//             <div className="flex items-start justify-between mb-2">
//               <div>
//                 <h2 className="text-sm font-semibold text-gray-900">
//                   Exam Lifecycle Progress
//                 </h2>
//                 <p className="text-xs text-gray-500">
//                   Students moving through each exam stage
//                 </p>
//               </div>
//             </div>
//             <div className="h-[220px] w-full">
//               <ResponsiveContainer width="100%" height="100%">
//                 <AreaChart
//                   data={LIFECYCLE_DATA}
//                   margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
//                 >
//                   <CartesianGrid vertical={false} stroke="#EEF1F5" />
//                   <XAxis
//                     dataKey="stage"
//                     axisLine={false}
//                     tickLine={false}
//                     tick={{ fontSize: 10, fill: "#263238" }}
//                     interval={0}
//                     angle={-15}
//                     textAnchor="end"
//                     height={50}
//                     dy={5}
//                   />
//                   <YAxis
//                     axisLine={false}
//                     tickLine={false}
//                     tick={{ fontSize: 10, fill: "#263238" }}
//                     width={35}
//                     domain={[0, 500]}
//                   />
//                   <Tooltip
//                     cursor={{ stroke: "#435CFF", strokeDasharray: "4 4" }}
//                     contentStyle={{
//                       borderRadius: "8px",
//                       border: "1px solid #E5E7EB",
//                       boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
//                       fontSize: "11px",
//                     }}
//                   />
//                   <Legend wrapperStyle={{ fontSize: "11px" }} />
//                   <Area
//                     type="monotone"
//                     dataKey="students"
//                     name="Students"
//                     stroke="#435CFF"
//                     strokeWidth={2.5}
//                     fill="url(#colorGradient)"
//                   />
//                   <defs>
//                     <linearGradient
//                       id="colorGradient"
//                       x1="0"
//                       y1="0"
//                       x2="0"
//                       y2="1"
//                     >
//                       <stop offset="5%" stopColor="#435CFF" stopOpacity={0.3} />
//                       <stop offset="95%" stopColor="#435CFF" stopOpacity={0} />
//                     </linearGradient>
//                   </defs>
//                 </AreaChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="mt-6 text-center text-sm text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-4">
//         <p>
//           © {new Date().getFullYear()} Exam Dashboard • All data shown is for
//           demonstration purposes only
//         </p>
//       </div>
//     </div>
//   );
// };

// export default DummyDashboard;

import React, { useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BookOpenCheck,
  Users,
  Award,
  Calendar,
  AlertCircle,
  Search,
} from "lucide-react";
import {
  CheckCircle,
  Clock,
} from "lucide-react";

// ============================================================
// MOCK DATA - PHARMACY COURSES (Default)
// ============================================================

const PHARMACY_COURSES = [
  { courseId: "BPHARM", courseName: "B.Pharm", studentCount: 420 },
  { courseId: "DPHARM", courseName: "D.Pharm", studentCount: 180 },
  { courseId: "PHARMD", courseName: "Pharm.D", studentCount: 120 },
  {
    courseId: "MPHARM-P",
    courseName: "M.Pharm Pharmaceutics",
    studentCount: 60,
  },
  {
    courseId: "MPHARM-C",
    courseName: "M.Pharm Pharmacology",
    studentCount: 45,
  },
  {
    courseId: "MPHARM-QA",
    courseName: "M.Pharm Quality Assurance",
    studentCount: 40,
  },
];

// ============================================================
// MOCK DATA - ENGINEERING COURSES
// ============================================================

const ENGINEERING_COURSES = [
  { courseId: "CSE101", courseName: "Computer Science", studentCount: 450 },
  { courseId: "ECE201", courseName: "Electronics", studentCount: 320 },
  { courseId: "MECH301", courseName: "Mechanical", studentCount: 280 },
  { courseId: "CIVIL401", courseName: "Civil", studentCount: 200 },
  { courseId: "MBA501", courseName: "MBA", studentCount: 180 },
  { courseId: "BBA601", courseName: "BBA", studentCount: 150 },
];

// ============================================================
// MOCK DATA - PHARMACY SEMESTERS
// ============================================================

const PHARMACY_SEMESTERS: Record<
  string,
  { semesterId: string; studentCount: number }[]
> = {
  BPHARM: [
    { semesterId: "Semester 1", studentCount: 120 },
    { semesterId: "Semester 2", studentCount: 115 },
    { semesterId: "Semester 3", studentCount: 110 },
    { semesterId: "Semester 4", studentCount: 105 },
    { semesterId: "Semester 5", studentCount: 98 },
    { semesterId: "Semester 6", studentCount: 92 },
    { semesterId: "Semester 7", studentCount: 92 },
    { semesterId: "Semester 8", studentCount: 92 },
  ],
  DPHARM: [
    { semesterId: "Semester 1", studentCount: 85 },
    { semesterId: "Semester 2", studentCount: 82 },
    { semesterId: "Semester 3", studentCount: 78 },
    { semesterId: "Semester 4", studentCount: 75 },
    { semesterId: "Semester 5", studentCount: 70 },
    { semesterId: "Semester 6", studentCount: 65 },
  ],
  PHARMD: [
    { semesterId: "Semester 1", studentCount: 75 },
    { semesterId: "Semester 2", studentCount: 72 },
    { semesterId: "Semester 3", studentCount: 68 },
    { semesterId: "Semester 4", studentCount: 65 },
    { semesterId: "Semester 5", studentCount: 60 },
    { semesterId: "Semester 6", studentCount: 55 },
  ],
  "MPHARM-P": [
    { semesterId: "Semester 1", studentCount: 55 },
    { semesterId: "Semester 2", studentCount: 52 },
    { semesterId: "Semester 3", studentCount: 48 },
    { semesterId: "Semester 4", studentCount: 45 },
    { semesterId: "Semester 5", studentCount: 40 },
    { semesterId: "Semester 6", studentCount: 38 },
  ],
  "MPHARM-C": [
    { semesterId: "Semester 1", studentCount: 50 },
    { semesterId: "Semester 2", studentCount: 48 },
    { semesterId: "Semester 3", studentCount: 45 },
    { semesterId: "Semester 4", studentCount: 42 },
    { semesterId: "Semester 5", studentCount: 38 },
    { semesterId: "Semester 6", studentCount: 35 },
  ],
  "MPHARM-QA": [
    { semesterId: "Semester 1", studentCount: 42 },
    { semesterId: "Semester 2", studentCount: 40 },
    { semesterId: "Semester 3", studentCount: 38 },
    { semesterId: "Semester 4", studentCount: 35 },
    { semesterId: "Semester 5", studentCount: 32 },
    { semesterId: "Semester 6", studentCount: 30 },
  ],
};

// ============================================================
// MOCK DATA - ENGINEERING SEMESTERS
// ============================================================

const ENGINEERING_SEMESTERS: Record<
  string,
  { semesterId: string; studentCount: number }[]
> = {
  CSE101: [
    { semesterId: "Semester 1", studentCount: 120 },
    { semesterId: "Semester 2", studentCount: 115 },
    { semesterId: "Semester 3", studentCount: 110 },
    { semesterId: "Semester 4", studentCount: 105 },
    { semesterId: "Semester 5", studentCount: 98 },
    { semesterId: "Semester 6", studentCount: 92 },
    { semesterId: "Semester 7", studentCount: 92 },
    { semesterId: "Semester 8", studentCount: 92 },
  ],
  ECE201: [
    { semesterId: "Semester 1", studentCount: 85 },
    { semesterId: "Semester 2", studentCount: 82 },
    { semesterId: "Semester 3", studentCount: 78 },
    { semesterId: "Semester 4", studentCount: 75 },
    { semesterId: "Semester 5", studentCount: 70 },
    { semesterId: "Semester 6", studentCount: 65 },
  ],
  MECH301: [
    { semesterId: "Semester 1", studentCount: 75 },
    { semesterId: "Semester 2", studentCount: 72 },
    { semesterId: "Semester 3", studentCount: 68 },
    { semesterId: "Semester 4", studentCount: 65 },
    { semesterId: "Semester 5", studentCount: 60 },
    { semesterId: "Semester 6", studentCount: 55 },
  ],
  CIVIL401: [
    { semesterId: "Semester 1", studentCount: 55 },
    { semesterId: "Semester 2", studentCount: 52 },
    { semesterId: "Semester 3", studentCount: 48 },
    { semesterId: "Semester 4", studentCount: 45 },
    { semesterId: "Semester 5", studentCount: 40 },
    { semesterId: "Semester 6", studentCount: 38 },
  ],
  MBA501: [
    { semesterId: "Semester 1", studentCount: 50 },
    { semesterId: "Semester 2", studentCount: 48 },
    { semesterId: "Semester 3", studentCount: 45 },
    { semesterId: "Semester 4", studentCount: 42 },
    { semesterId: "Semester 5", studentCount: 38 },
    { semesterId: "Semester 6", studentCount: 35 },
  ],
  BBA601: [
    { semesterId: "Semester 1", studentCount: 42 },
    { semesterId: "Semester 2", studentCount: 40 },
    { semesterId: "Semester 3", studentCount: 38 },
    { semesterId: "Semester 4", studentCount: 35 },
    { semesterId: "Semester 5", studentCount: 32 },
    { semesterId: "Semester 6", studentCount: 30 },
  ],
};

// ============================================================
// MOCK DATA - PHARMACY PASS/FAIL
// ============================================================

const PHARMACY_PASS_FAIL: Record<
  string,
  { semesterId: string; passCount: number; failCount: number }[]
> = {
  BPHARM: [
    { semesterId: "Semester 1", passCount: 108, failCount: 12 },
    { semesterId: "Semester 2", passCount: 102, failCount: 13 },
    { semesterId: "Semester 3", passCount: 95, failCount: 15 },
    { semesterId: "Semester 4", passCount: 88, failCount: 17 },
    { semesterId: "Semester 5", passCount: 80, failCount: 18 },
    { semesterId: "Semester 6", passCount: 75, failCount: 17 },
  ],
  DPHARM: [
    { semesterId: "Semester 1", passCount: 72, failCount: 13 },
    { semesterId: "Semester 2", passCount: 68, failCount: 14 },
    { semesterId: "Semester 3", passCount: 63, failCount: 15 },
    { semesterId: "Semester 4", passCount: 58, failCount: 17 },
    { semesterId: "Semester 5", passCount: 52, failCount: 18 },
    { semesterId: "Semester 6", passCount: 47, failCount: 18 },
  ],
  PHARMD: [
    { semesterId: "Semester 1", passCount: 62, failCount: 13 },
    { semesterId: "Semester 2", passCount: 58, failCount: 14 },
    { semesterId: "Semester 3", passCount: 53, failCount: 15 },
    { semesterId: "Semester 4", passCount: 48, failCount: 17 },
    { semesterId: "Semester 5", passCount: 42, failCount: 18 },
    { semesterId: "Semester 6", passCount: 38, failCount: 17 },
  ],
  "MPHARM-P": [
    { semesterId: "Semester 1", passCount: 45, failCount: 10 },
    { semesterId: "Semester 2", passCount: 42, failCount: 10 },
    { semesterId: "Semester 3", passCount: 38, failCount: 10 },
    { semesterId: "Semester 4", passCount: 35, failCount: 10 },
    { semesterId: "Semester 5", passCount: 30, failCount: 10 },
    { semesterId: "Semester 6", passCount: 28, failCount: 10 },
  ],
  "MPHARM-C": [
    { semesterId: "Semester 1", passCount: 42, failCount: 8 },
    { semesterId: "Semester 2", passCount: 40, failCount: 8 },
    { semesterId: "Semester 3", passCount: 37, failCount: 8 },
    { semesterId: "Semester 4", passCount: 35, failCount: 7 },
    { semesterId: "Semester 5", passCount: 30, failCount: 8 },
    { semesterId: "Semester 6", passCount: 27, failCount: 8 },
  ],
  "MPHARM-QA": [
    { semesterId: "Semester 1", passCount: 35, failCount: 7 },
    { semesterId: "Semester 2", passCount: 33, failCount: 7 },
    { semesterId: "Semester 3", passCount: 30, failCount: 8 },
    { semesterId: "Semester 4", passCount: 28, failCount: 7 },
    { semesterId: "Semester 5", passCount: 25, failCount: 7 },
    { semesterId: "Semester 6", passCount: 23, failCount: 7 },
  ],
};

// ============================================================
// MOCK DATA - ENGINEERING PASS/FAIL
// ============================================================

const ENGINEERING_PASS_FAIL: Record<
  string,
  { semesterId: string; passCount: number; failCount: number }[]
> = {
  CSE101: [
    { semesterId: "Semester 1", passCount: 108, failCount: 12 },
    { semesterId: "Semester 2", passCount: 102, failCount: 13 },
    { semesterId: "Semester 3", passCount: 95, failCount: 15 },
    { semesterId: "Semester 4", passCount: 88, failCount: 17 },
    { semesterId: "Semester 5", passCount: 80, failCount: 18 },
    { semesterId: "Semester 6", passCount: 75, failCount: 17 },
  ],
  ECE201: [
    { semesterId: "Semester 1", passCount: 72, failCount: 13 },
    { semesterId: "Semester 2", passCount: 68, failCount: 14 },
    { semesterId: "Semester 3", passCount: 63, failCount: 15 },
    { semesterId: "Semester 4", passCount: 58, failCount: 17 },
    { semesterId: "Semester 5", passCount: 52, failCount: 18 },
    { semesterId: "Semester 6", passCount: 47, failCount: 18 },
  ],
  MECH301: [
    { semesterId: "Semester 1", passCount: 62, failCount: 13 },
    { semesterId: "Semester 2", passCount: 58, failCount: 14 },
    { semesterId: "Semester 3", passCount: 53, failCount: 15 },
    { semesterId: "Semester 4", passCount: 48, failCount: 17 },
    { semesterId: "Semester 5", passCount: 42, failCount: 18 },
    { semesterId: "Semester 6", passCount: 38, failCount: 17 },
  ],
  CIVIL401: [
    { semesterId: "Semester 1", passCount: 45, failCount: 10 },
    { semesterId: "Semester 2", passCount: 42, failCount: 10 },
    { semesterId: "Semester 3", passCount: 38, failCount: 10 },
    { semesterId: "Semester 4", passCount: 35, failCount: 10 },
    { semesterId: "Semester 5", passCount: 30, failCount: 10 },
    { semesterId: "Semester 6", passCount: 28, failCount: 10 },
  ],
  MBA501: [
    { semesterId: "Semester 1", passCount: 42, failCount: 8 },
    { semesterId: "Semester 2", passCount: 40, failCount: 8 },
    { semesterId: "Semester 3", passCount: 37, failCount: 8 },
    { semesterId: "Semester 4", passCount: 35, failCount: 7 },
    { semesterId: "Semester 5", passCount: 30, failCount: 8 },
    { semesterId: "Semester 6", passCount: 27, failCount: 8 },
  ],
  BBA601: [
    { semesterId: "Semester 1", passCount: 35, failCount: 7 },
    { semesterId: "Semester 2", passCount: 33, failCount: 7 },
    { semesterId: "Semester 3", passCount: 30, failCount: 8 },
    { semesterId: "Semester 4", passCount: 28, failCount: 7 },
    { semesterId: "Semester 5", passCount: 25, failCount: 7 },
    { semesterId: "Semester 6", passCount: 23, failCount: 7 },
  ],
};

// ============================================================
// MOCK DATA - PHARMACY EXAM TYPES (with appeared and passed)
// ============================================================

const PHARMACY_EXAM_TYPES: Record<
  string,
  { semesterId: string; examType: string; appeared: number; passed: number }[]
> = {
  BPHARM: [
    {
      semesterId: "Semester 1",
      examType: "Regular",
      appeared: 120,
      passed: 100,
    },
    { semesterId: "Semester 1", examType: "Reval", appeared: 10, passed: 5 },
    { semesterId: "Semester 1", examType: "ATKT", appeared: 15, passed: 10 },
    {
      semesterId: "Semester 2",
      examType: "Regular",
      appeared: 115,
      passed: 95,
    },
    { semesterId: "Semester 2", examType: "Reval", appeared: 12, passed: 6 },
    { semesterId: "Semester 2", examType: "ATKT", appeared: 14, passed: 9 },
    {
      semesterId: "Semester 3",
      examType: "Regular",
      appeared: 110,
      passed: 88,
    },
    { semesterId: "Semester 3", examType: "Reval", appeared: 14, passed: 7 },
    { semesterId: "Semester 3", examType: "ATKT", passed: 12, appeared: 18 },
    {
      semesterId: "Semester 4",
      examType: "Regular",
      appeared: 105,
      passed: 80,
    },
    { semesterId: "Semester 4", examType: "Reval", appeared: 12, passed: 6 },
    { semesterId: "Semester 4", examType: "ATKT", appeared: 20, passed: 14 },
    { semesterId: "Semester 5", examType: "Regular", appeared: 98, passed: 72 },
    { semesterId: "Semester 5", examType: "Reval", appeared: 10, passed: 5 },
    { semesterId: "Semester 5", examType: "ATKT", appeared: 22, passed: 15 },
    { semesterId: "Semester 6", examType: "Regular", appeared: 92, passed: 65 },
    { semesterId: "Semester 6", examType: "Reval", appeared: 8, passed: 4 },
    { semesterId: "Semester 6", examType: "ATKT", appeared: 24, passed: 16 },
  ],
  DPHARM: [
    { semesterId: "Semester 1", examType: "Regular", appeared: 85, passed: 72 },
    { semesterId: "Semester 1", examType: "Reval", appeared: 8, passed: 4 },
    { semesterId: "Semester 1", examType: "ATKT", appeared: 12, passed: 8 },
    { semesterId: "Semester 2", examType: "Regular", appeared: 82, passed: 68 },
    { semesterId: "Semester 2", examType: "Reval", appeared: 8, passed: 4 },
    { semesterId: "Semester 2", examType: "ATKT", appeared: 13, passed: 9 },
    { semesterId: "Semester 3", examType: "Regular", appeared: 78, passed: 63 },
    { semesterId: "Semester 3", examType: "Reval", appeared: 7, passed: 3 },
    { semesterId: "Semester 3", examType: "ATKT", appeared: 15, passed: 10 },
    { semesterId: "Semester 4", examType: "Regular", appeared: 75, passed: 58 },
    { semesterId: "Semester 4", examType: "Reval", appeared: 6, passed: 3 },
    { semesterId: "Semester 4", examType: "ATKT", appeared: 18, passed: 12 },
    { semesterId: "Semester 5", examType: "Regular", appeared: 70, passed: 52 },
    { semesterId: "Semester 5", examType: "Reval", appeared: 5, passed: 2 },
    { semesterId: "Semester 5", examType: "ATKT", appeared: 20, passed: 14 },
    { semesterId: "Semester 6", examType: "Regular", appeared: 65, passed: 47 },
    { semesterId: "Semester 6", examType: "Reval", appeared: 4, passed: 2 },
    { semesterId: "Semester 6", examType: "ATKT", appeared: 22, passed: 15 },
  ],
};

// ============================================================
// MOCK DATA - ENGINEERING EXAM TYPES (with appeared and passed)
// ============================================================

const ENGINEERING_EXAM_TYPES: Record<
  string,
  { semesterId: string; examType: string; appeared: number; passed: number }[]
> = {
  CSE101: [
    {
      semesterId: "Semester 1",
      examType: "Regular",
      appeared: 120,
      passed: 100,
    },
    { semesterId: "Semester 1", examType: "Reval", appeared: 10, passed: 5 },
    { semesterId: "Semester 1", examType: "ATKT", appeared: 15, passed: 10 },
    {
      semesterId: "Semester 2",
      examType: "Regular",
      appeared: 115,
      passed: 95,
    },
    { semesterId: "Semester 2", examType: "Reval", appeared: 12, passed: 6 },
    { semesterId: "Semester 2", examType: "ATKT", appeared: 14, passed: 9 },
    {
      semesterId: "Semester 3",
      examType: "Regular",
      appeared: 110,
      passed: 88,
    },
    { semesterId: "Semester 3", examType: "Reval", appeared: 14, passed: 7 },
    { semesterId: "Semester 3", examType: "ATKT", appeared: 18, passed: 12 },
    {
      semesterId: "Semester 4",
      examType: "Regular",
      appeared: 105,
      passed: 80,
    },
    { semesterId: "Semester 4", examType: "Reval", appeared: 12, passed: 6 },
    { semesterId: "Semester 4", examType: "ATKT", appeared: 20, passed: 14 },
    { semesterId: "Semester 5", examType: "Regular", appeared: 98, passed: 72 },
    { semesterId: "Semester 5", examType: "Reval", appeared: 10, passed: 5 },
    { semesterId: "Semester 5", examType: "ATKT", appeared: 22, passed: 15 },
    { semesterId: "Semester 6", examType: "Regular", appeared: 92, passed: 65 },
    { semesterId: "Semester 6", examType: "Reval", appeared: 8, passed: 4 },
    { semesterId: "Semester 6", examType: "ATKT", appeared: 24, passed: 16 },
  ],
  ECE201: [
    { semesterId: "Semester 1", examType: "Regular", appeared: 85, passed: 72 },
    { semesterId: "Semester 1", examType: "Reval", appeared: 8, passed: 4 },
    { semesterId: "Semester 1", examType: "ATKT", appeared: 12, passed: 8 },
    { semesterId: "Semester 2", examType: "Regular", appeared: 82, passed: 68 },
    { semesterId: "Semester 2", examType: "Reval", appeared: 8, passed: 4 },
    { semesterId: "Semester 2", examType: "ATKT", appeared: 13, passed: 9 },
    { semesterId: "Semester 3", examType: "Regular", appeared: 78, passed: 63 },
    { semesterId: "Semester 3", examType: "Reval", appeared: 7, passed: 3 },
    { semesterId: "Semester 3", examType: "ATKT", appeared: 15, passed: 10 },
    { semesterId: "Semester 4", examType: "Regular", appeared: 75, passed: 58 },
    { semesterId: "Semester 4", examType: "Reval", appeared: 6, passed: 3 },
    { semesterId: "Semester 4", examType: "ATKT", appeared: 18, passed: 12 },
    { semesterId: "Semester 5", examType: "Regular", appeared: 70, passed: 52 },
    { semesterId: "Semester 5", examType: "Reval", appeared: 5, passed: 2 },
    { semesterId: "Semester 5", examType: "ATKT", appeared: 20, passed: 14 },
    { semesterId: "Semester 6", examType: "Regular", appeared: 65, passed: 47 },
    { semesterId: "Semester 6", examType: "Reval", appeared: 4, passed: 2 },
    { semesterId: "Semester 6", examType: "ATKT", appeared: 22, passed: 15 },
  ],
};

// ============================================================
// MOCK DATA - EXAM LIFECYCLE (Based on your data structure)
// ============================================================

// This represents the data you'll get from API (an array of exams)
// Name, AssignedStudent, SeatNo, ReleaseHallTicket, MarksEntered, GazetteGnrt, IsDeclare
type ExamLifecycleRecord = {
  examId: string;
  examName: string;
  assignedStudent: number;
  seatNo: number;
  releaseHallTicket: number;
  marksEntered: number;
  gazetteGnrt: number;
  isDeclare: number;
};

const PHARMACY_EXAM_LIFECYCLES: ExamLifecycleRecord[] = [
  {
    examId: "EXAM-001",
    examName: "B.Pharm Sem-VI Regular Exam",
    assignedStudent: 30,
    seatNo: 30,
    releaseHallTicket: 1,
    marksEntered: 30,
    gazetteGnrt: 1,
    isDeclare: 0,
  },
  {
    examId: "EXAM-002",
    examName: "B.Pharm Sem-VI Reval Exam",
    assignedStudent: 12,
    seatNo: 12,
    releaseHallTicket: 12,
    marksEntered: 10,
    gazetteGnrt: 5,
    isDeclare: 0,
  },
  {
    examId: "EXAM-003",
    examName: "B.Pharm Sem-VI ATKT Exam",
    assignedStudent: 24,
    seatNo: 24,
    releaseHallTicket: 24,
    marksEntered: 20,
    gazetteGnrt: 18,
    isDeclare: 1,
  },
  {
    examId: "EXAM-004",
    examName: "D.Pharm Sem-IV Regular Exam",
    assignedStudent: 65,
    seatNo: 60,
    releaseHallTicket: 60,
    marksEntered: 55,
    gazetteGnrt: 0,
    isDeclare: 0,
  },
];

const ENGINEERING_EXAM_LIFECYCLES: ExamLifecycleRecord[] = [
  {
    examId: "ENG-001",
    examName: "CSE Sem-VI Regular Exam",
    assignedStudent: 120,
    seatNo: 120,
    releaseHallTicket: 0,
    marksEntered: 118,
    gazetteGnrt: 0,
    isDeclare: 1,
  },
  {
    examId: "ENG-002",
    examName: "CSE Sem-VI Reval Exam",
    assignedStudent: 18,
    seatNo: 18,
    releaseHallTicket: 18,
    marksEntered: 15,
    gazetteGnrt: 8,
    isDeclare: 0,
  },
  {
    examId: "ENG-003",
    examName: "ECE Sem-IV Regular Exam",
    assignedStudent: 75,
    seatNo: 72,
    releaseHallTicket: 72,
    marksEntered: 70,
    gazetteGnrt: 60,
    isDeclare: 1,
  },
  {
    examId: "ENG-004",
    examName: "Mechanical Sem-II ATKT Exam",
    assignedStudent: 40,
    seatNo: 40,
    releaseHallTicket: 40,
    marksEntered: 32,
    gazetteGnrt: 0,
    isDeclare: 0,
  },
];

// Transform a single exam record into pipeline stages
const getLifecycleChartData = (record: ExamLifecycleRecord) => {
  const stages = [
    {
      stage: "Students Assigned",
      count: record.assignedStudent,
      completed: record.assignedStudent > 0,
    },
    {
      stage: "Seat No. Assigned",
      count: record.seatNo,
      completed: record.seatNo > 0,
    },
    {
      stage: "Hall Ticket Released",
      count: record.releaseHallTicket,
      completed: record.releaseHallTicket > 0,
    },
    {
      stage: "Marks Entered",
      count: record.marksEntered,
      completed: record.marksEntered > 0,
    },
    {
      stage: "Gazette Generated",
      count: record.gazetteGnrt,
      completed: record.gazetteGnrt > 0,
    },
    {
      stage: "Result Declared",
      count: record.isDeclare === 1 ? record.assignedStudent : 0,
      completed: record.isDeclare === 1,
    },
  ];
  return stages;
};

// Helper: % of completed stages for a given exam
const getLifecycleProgress = (record: ExamLifecycleRecord) => {
  const stages = getLifecycleChartData(record);
  return Math.round(
    (stages.filter((s) => s.completed).length / stages.length) * 100,
  );
};

// Stats Cards
const STATS_CARDS = [
  {
    title: "Total Students",
    value: "1,580",
    icon: Users,
    color: "blue",
  },
  {
    title: "Passing Rate",
    value: "82.4%",
    icon: Award,
    color: "green",
  },
  {
    title: "Exams Conducted",
    value: "48",
    icon: Calendar,
    color: "purple",
  },
  {
    title: "ATKT Students",
    value: "124",
    icon: AlertCircle,
    color: "orange",
  },
];

// Pie Chart Colors
const PIE_COLORS = ["#435CFF", "#00AFC0", "#FF6B6B", "#FFD93D", "#6C5CE7"];

// ============================================================
// COMPONENT
// ============================================================

const DummyDashboard: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const chart = {
    grid: isDark ? "#1D2939" : "#EEF1F5",
    tick: isDark ? "#98A2B3" : "#263238",
    tooltipBg: isDark ? "#1D2939" : "#FFFFFF",
    tooltipBorder: isDark ? "#344054" : "#E5E7EB",
    tooltipColor: isDark ? "#E4E7EC" : "#101828",
  };
  // Get college ID from authUser in localStorage
  const getCollegeId = () => {
    try {
      const authUserStr = localStorage.getItem("authUser");
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        if (authUser && authUser.collegeId) {
          return authUser.collegeId;
        }
        if (authUser && authUser.CollegeId) {
          return authUser.CollegeId;
        }
      }
      return "";
    } catch (error) {
      console.error("Error parsing authUser:", error);
      return "";
    }
  };

  const collegeId = getCollegeId();

  // Determine if this is an engineering college
  const isEngineeringCollege =
    collegeId === "103ebf99-feb0-43bc-a312-56fe85d3bcc6" ||
    collegeId === "103EBF99-FEB0-43BC-A312-56FE85D3BCC6";

  // Select appropriate data based on college type
  const MOCK_COURSES = isEngineeringCollege
    ? ENGINEERING_COURSES
    : PHARMACY_COURSES;
  const MOCK_SEMESTERS = isEngineeringCollege
    ? ENGINEERING_SEMESTERS
    : PHARMACY_SEMESTERS;
  const MOCK_PASS_FAIL = isEngineeringCollege
    ? ENGINEERING_PASS_FAIL
    : PHARMACY_PASS_FAIL;
  const MOCK_EXAM_TYPES = isEngineeringCollege
    ? ENGINEERING_EXAM_TYPES
    : PHARMACY_EXAM_TYPES;
  const MOCK_EXAM_LIFECYCLES = isEngineeringCollege
    ? ENGINEERING_EXAM_LIFECYCLES
    : PHARMACY_EXAM_LIFECYCLES;

  // Set first course as default selected
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    MOCK_COURSES[0]?.courseId || "",
  );
  const [activeSemester, setActiveSemester] = useState<string>("Semester 1");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: string;
    message: string;
  } | null>(null);

  // Get current course data
  const currentCourse = MOCK_COURSES.find(
    (c) => c.courseId === selectedCourseId,
  );
  const semesters = MOCK_SEMESTERS[selectedCourseId] || [];
  const passFailData = MOCK_PASS_FAIL[selectedCourseId] || [];
  const examTypeData = MOCK_EXAM_TYPES[selectedCourseId] || [];

  // Get data for selected semester
  const selectedSemesterData = examTypeData.filter(
    (d) => d.semesterId === activeSemester,
  );

  // Pie chart data for selected semester - showing "passed/appeared"
  const pieData = selectedSemesterData.map((d) => ({
    name: d.examType,
    value: d.passed,
    total: d.appeared,
    label: `${d.passed}/${d.appeared}`,
  }));

  // Pivot exam type data for bar chart - using passed values
  const pivotedExamTypeData = React.useMemo(() => {
    const map = new Map<
      string,
      { semesterId: string; Regular: number; Reval: number; ATKT: number }
    >();
    examTypeData.forEach((row) => {
      if (!map.has(row.semesterId)) {
        map.set(row.semesterId, {
          semesterId: row.semesterId,
          Regular: 0,
          Reval: 0,
          ATKT: 0,
        });
      }
      const entry = map.get(row.semesterId)!;
      if (row.examType === "Regular") entry.Regular = row.passed;
      else if (row.examType === "Reval") entry.Reval = row.passed;
      else if (row.examType === "ATKT") entry.ATKT = row.passed;
    });
    return Array.from(map.values());
  }, [examTypeData]);

  // Get lifecycle data for the currently selected exam
  const [selectedExamId, setSelectedExamId] = useState<string>(
    MOCK_EXAM_LIFECYCLES[0]?.examId || "",
  );
  const selectedExam =
    MOCK_EXAM_LIFECYCLES.find((e) => e.examId === selectedExamId) ||
    MOCK_EXAM_LIFECYCLES[0];
  const lifecycleData = getLifecycleChartData(selectedExam);

  // Notification helper
  const showNotification = (type: string, message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle course selection
  const handleCourseSelect = (courseId: string) => {
    setIsLoading(true);
    setSelectedCourseId(courseId);
    const semesters = MOCK_SEMESTERS[courseId] || [];
    if (semesters.length > 0) {
      setActiveSemester(semesters[0].semesterId);
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const handleSemesterSelect = (semesterId: string) => {
    setActiveSemester(semesterId);
  };

  // Filter courses
  const filteredCourses = MOCK_COURSES.filter(
    (course) =>
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseId.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPassed = pieData.reduce((total, item) => total + item.value, 0);
  const totalAppeared = pieData.reduce((total, item) => total + item.total, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === "info"
              ? "bg-blue-500"
              : notification.type === "success"
                ? "bg-green-500"
                : notification.type === "error"
                  ? "bg-red-500"
                  : "bg-yellow-500"
          } text-white max-w-md`}
        >
          {notification.message}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {STATS_CARDS.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-lg ${
                    stat.color === "blue"
                      ? "bg-blue-50 text-blue-500"
                      : stat.color === "green"
                        ? "bg-green-50 text-green-500"
                        : stat.color === "purple"
                          ? "bg-purple-50 text-purple-500"
                          : "bg-orange-50 text-orange-500"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Cards */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Courses</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 md:w-64"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredCourses.map((course) => (
            <div
              key={course.courseId}
              onClick={() => handleCourseSelect(course.courseId)}
              className={`cursor-pointer transition-all ${
                selectedCourseId === course.courseId
                  ? "ring-2 ring-blue-500 rounded-xl shadow-md scale-[1.02]"
                  : "hover:scale-[1.02]"
              }`}
            >
              <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-4 shadow-sm transition-all duration-200 hover:shadow-md">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full ${
                    selectedCourseId === course.courseId
                      ? "bg-blue-500 text-white"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <span className="text-lg font-bold">
                    {course.studentCount}
                  </span>
                </div>
                <div className="text-center min-w-0 w-full">
                  <h3 className="text-xs font-semibold uppercase leading-tight text-[#17213F] dark:text-white truncate">
                    {course.courseName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {course.courseId}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Layout - Semester Wizard on left, Charts on right */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Semester Wizard - Fixed on left */}
        <div className="lg:w-[270px] xl:w-[270px] flex-shrink-0">
          <div className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] shadow-sm sticky top-4">
            <div className="border-b-2 border-blue-500 px-4 py-2">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Semester Details
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentCourse?.courseName} - {currentCourse?.courseId}
              </p>
            </div>
            <div className="px-4 py-2 max-h-[590px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : semesters.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No semester data available
                </p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[23px] top-5 bottom-5 w-px bg-gray-300 dark:bg-gray-700" />
                  {semesters.map((semester) => {
                    const isActive = activeSemester === semester.semesterId;
                    return (
                      <div
                        key={semester.semesterId}
                        className="relative flex min-h-[71px] cursor-pointer items-center"
                        onClick={() =>
                          handleSemesterSelect(semester.semesterId)
                        }
                      >
                        <div
                          className={`absolute inset-y-0 left-0 right-0 rounded-lg transition-colors ${
                            isActive
                              ? "bg-[#E5F7F9] dark:bg-white/[0.06]"
                              : "bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                          }`}
                        />
                        <div
                          className={`relative z-10 ml-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] bg-white dark:bg-gray-800 transition-colors ${
                            isActive
                              ? "border-[#00AFC0]"
                              : "border-blue-500 dark:border-brand-400"
                          }`}
                        >
                          <BookOpenCheck className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="relative z-10 ml-4 py-2">
                          <p
                            className={`text-base font-medium ${isActive ? "text-gray-900 dark:text-white" : "text-[#17213F] dark:text-gray-200"}`}
                          >
                            {semester.semesterId}
                          </p>
                          <p
                            className={`mt-1 text-sm ${isActive ? "text-[#00AFC0]" : "text-gray-700 dark:text-gray-400"}`}
                          >
                            Students: {semester.studentCount}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Charts Grid */}
        <div className="flex-1 min-w-0">
          {/* Exam Lifecycle - Visual Pipeline with selectable exam list */}

          <div className="mb-6 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Exam Lifecycle Pipeline
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select an exam to track its progress
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#00AFC0]" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Completed
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Pending</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-5">
              {/* Exam list (selectable) */}
              <div className="lg:w-[280px] xl:w-[320px] flex-shrink-0">
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 max-h-[420px] overflow-y-auto">
                  {MOCK_EXAM_LIFECYCLES.map((exam) => {
                    const isActive = selectedExamId === exam.examId;
                    const progress = getLifecycleProgress(exam);
                    return (
                      <div
                        key={exam.examId}
                        onClick={() => setSelectedExamId(exam.examId)}
                        className={`cursor-pointer px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors ${
                          isActive ? "bg-[#E5F7F9] dark:bg-white/[0.06]" : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-sm font-medium truncate ${
                              isActive ? "text-gray-900 dark:text-white" : "text-[#17213F] dark:text-gray-200"
                            }`}
                          >
                            {exam.examName}
                          </p>
                          <span
                            className={`shrink-0 text-[11px] font-semibold ${
                              progress === 100
                                ? "text-[#00AFC0]"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {progress}%
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              progress === 100
                                ? "bg-[#00AFC0]"
                                : "bg-gradient-to-r from-[#435CFF] to-[#00AFC0]"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pipeline detail for the selected exam */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {selectedExam.examName}
                </p>

                {/* Overall progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Overall Completion
                    </span>
                    <span className="text-xs font-semibold text-[#00AFC0]">
                      {Math.round(
                        (lifecycleData.filter((s) => s.completed).length /
                          lifecycleData.length) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#435CFF] to-[#00AFC0] transition-all duration-500"
                      style={{
                        width: `${
                          (lifecycleData.filter((s) => s.completed).length /
                            lifecycleData.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Stage pipeline */}
                <div className="overflow-x-auto pb-2">
                  <div className="flex min-w-[760px] items-start">
                    {lifecycleData.map((stage, idx) => {
                      const isLast = idx === lifecycleData.length - 1;
                      const nextCompleted =
                        !isLast && lifecycleData[idx + 1].completed;
                      return (
                        <div
                          key={stage.stage}
                          className="flex flex-1 items-start"
                        >
                          {/* Node + label */}
                          <div className="flex flex-col items-center text-center w-[110px] shrink-0">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full border-[3px] transition-colors ${
                                stage.completed
                                  ? "border-[#00AFC0] bg-[#00AFC0] text-white shadow-[0_4px_10px_rgba(0,175,192,0.35)]"
                                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              {stage.completed ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                <Clock className="h-5 w-5" />
                              )}
                            </div>
                            <p
                              className={`mt-2 text-xs font-semibold leading-tight ${
                                stage.completed
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {stage.stage}
                            </p>
                            <span
                              className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                stage.completed
                                  ? "bg-[#E5F7F9] dark:bg-white/10 text-[#00AFC0]"
                                  : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              {stage.count} students
                            </span>
                          </div>

                          {/* Connector */}
                          {!isLast && (
                            <div className="flex flex-1 items-center pt-5">
                              <div className="h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700 relative">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    stage.completed && nextCompleted
                                      ? "bg-gradient-to-r from-[#00AFC0] to-[#00AFC0]"
                                      : stage.completed
                                        ? "bg-gradient-to-r from-[#00AFC0] to-gray-200"
                                        : "bg-gray-200 dark:bg-gray-700"
                                  }`}
                                  style={{
                                    width:
                                      stage.completed && nextCompleted
                                        ? "100%"
                                        : stage.completed
                                          ? "50%"
                                          : "0%",
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pass/Fail Chart */}
            <div className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Pass / Fail
                  </h2>
                  <p className="text-xs text-gray-500">{activeSemester}</p>
                </div>
              </div>
              <div className="h-[200px] w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : passFailData.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center pt-16">
                    No data available
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={passFailData}
                      margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                      barGap={3}
                    >
                      <CartesianGrid vertical={false} stroke={chart.grid} />
                      <XAxis
                        dataKey="semesterId"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: chart.tick }}
                        dy={5}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: chart.tick }}
                        width={30}
                      />
                      {/* <Tooltip
                        cursor={{ fill: "rgba(67, 92, 255, 0.04)" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          fontSize: "11px",
                        }}
                      /> */}
                      <Tooltip
                        cursor={{
                          fill: isDark
                            ? "rgba(255,255,255,0.04)"
                            : "rgba(67, 92, 255, 0.04)",
                        }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: `1px solid ${chart.tooltipBorder}`,
                          background: chart.tooltipBg,
                          color: chart.tooltipColor,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          fontSize: "11px",
                        }}
                        labelStyle={{ color: chart.tooltipColor }}
                        itemStyle={{ color: chart.tooltipColor }}
                      />
                      <Bar
                        dataKey="passCount"
                        name="Pass"
                        fill="#00AFC0"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={20}
                      />
                      <Bar
                        dataKey="failCount"
                        name="Fail"
                        fill="#FF6B6B"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Pie Chart - Semester Exam Type Distribution */}
            <div className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Exam Type Distribution
                  </h2>
                  <p className="text-xs text-gray-500">{activeSemester}</p>
                </div>
              </div>
              <div className="h-[200px] w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : pieData.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-16">
                    No data available
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ index }) => {
                          const d = pieData[index as number];
                          return d ? `${d.name} ${d.label}` : "";
                        }}
                        labelLine={{ stroke: isDark ? "#667085" : "#94A3B8", strokeWidth: 1 }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: `1px solid ${chart.tooltipBorder}`,
                          background: chart.tooltipBg,
                          color: chart.tooltipColor,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          fontSize: "11px",
                        }}
                        labelStyle={{ color: chart.tooltipColor }}
                        itemStyle={{ color: chart.tooltipColor }}
                        formatter={(value, name, props) => {
                          const data = props.payload;
                          return [`${data.value}/${data.total}`, data.name];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              {/* Legend for Pie Chart */}
              <div className="flex justify-center gap-4 mt-1">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                      }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {item.name} {item.value}/{item.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-4">
        <p>
          © {new Date().getFullYear()} Exam Dashboard • All data shown is for
          demonstration purposes only
        </p>
      </div>
    </div>
  );
};

export default DummyDashboard;

// import React, { useState } from "react";
// import {
//   LineChart,
//   Line,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   ResponsiveContainer,
//   Tooltip,
//   Legend,
//   PieChart,
//   Pie,
//   Cell,
//   AreaChart,
//   Area,
// } from "recharts";
// import {
//   BookOpenCheck,
//   Users,
//   Award,
//   TrendingUp,
//   TrendingDown,
//   Calendar,
//   Clock,
//   CheckCircle,
//   AlertCircle,
//   Download,
//   Filter,
//   Search,
// } from "lucide-react";

// // ============================================================
// // MOCK DATA
// // ============================================================

// // Course Data - Updated to match keys in other data objects
// const MOCK_COURSES = [
//   { courseId: "BPHARM", courseName: "B.Pharm", studentCount: 420 },
//   { courseId: "DPHARM", courseName: "D.Pharm", studentCount: 180 },
//   { courseId: "PHARMD", courseName: "Pharm.D", studentCount: 120 },
//   {
//     courseId: "MPHARM-P",
//     courseName: "M.Pharm Pharmaceutics",
//     studentCount: 60,
//   },
//   {
//     courseId: "MPHARM-C",
//     courseName: "M.Pharm Pharmacology",
//     studentCount: 45,
//   },
//   {
//     courseId: "MPHARM-QA",
//     courseName: "M.Pharm Quality Assurance",
//     studentCount: 40,
//   },
// ];

// // Semester Data per course - Updated keys to match course IDs
// const MOCK_SEMESTERS: Record<
//   string,
//   { semesterId: string; studentCount: number }[]
// > = {
//   BPHARM: [
//     { semesterId: "Semester 1", studentCount: 120 },
//     { semesterId: "Semester 2", studentCount: 115 },
//     { semesterId: "Semester 3", studentCount: 110 },
//     { semesterId: "Semester 4", studentCount: 105 },
//     { semesterId: "Semester 5", studentCount: 98 },
//     { semesterId: "Semester 6", studentCount: 92 },
//   ],
//   DPHARM: [
//     { semesterId: "Semester 1", studentCount: 85 },
//     { semesterId: "Semester 2", studentCount: 82 },
//     { semesterId: "Semester 3", studentCount: 78 },
//     { semesterId: "Semester 4", studentCount: 75 },
//     { semesterId: "Semester 5", studentCount: 70 },
//     { semesterId: "Semester 6", studentCount: 65 },
//   ],
//   PHARMD: [
//     { semesterId: "Semester 1", studentCount: 75 },
//     { semesterId: "Semester 2", studentCount: 72 },
//     { semesterId: "Semester 3", studentCount: 68 },
//     { semesterId: "Semester 4", studentCount: 65 },
//     { semesterId: "Semester 5", studentCount: 60 },
//     { semesterId: "Semester 6", studentCount: 55 },
//   ],
//   "MPHARM-P": [
//     { semesterId: "Semester 1", studentCount: 55 },
//     { semesterId: "Semester 2", studentCount: 52 },
//     { semesterId: "Semester 3", studentCount: 48 },
//     { semesterId: "Semester 4", studentCount: 45 },
//     { semesterId: "Semester 5", studentCount: 40 },
//     { semesterId: "Semester 6", studentCount: 38 },
//   ],
//   "MPHARM-C": [
//     { semesterId: "Semester 1", studentCount: 50 },
//     { semesterId: "Semester 2", studentCount: 48 },
//     { semesterId: "Semester 3", studentCount: 45 },
//     { semesterId: "Semester 4", studentCount: 42 },
//     { semesterId: "Semester 5", studentCount: 38 },
//     { semesterId: "Semester 6", studentCount: 35 },
//   ],
//   "MPHARM-QA": [
//     { semesterId: "Semester 1", studentCount: 42 },
//     { semesterId: "Semester 2", studentCount: 40 },
//     { semesterId: "Semester 3", studentCount: 38 },
//     { semesterId: "Semester 4", studentCount: 35 },
//     { semesterId: "Semester 5", studentCount: 32 },
//     { semesterId: "Semester 6", studentCount: 30 },
//   ],
// };

// // Pass/Fail Data per semester - Updated keys to match course IDs
// const MOCK_PASS_FAIL: Record<
//   string,
//   { semesterId: string; passCount: number; failCount: number }[]
// > = {
//   BPHARM: [
//     { semesterId: "Semester 1", passCount: 108, failCount: 12 },
//     { semesterId: "Semester 2", passCount: 102, failCount: 13 },
//     { semesterId: "Semester 3", passCount: 95, failCount: 15 },
//     { semesterId: "Semester 4", passCount: 88, failCount: 17 },
//     { semesterId: "Semester 5", passCount: 80, failCount: 18 },
//     { semesterId: "Semester 6", passCount: 75, failCount: 17 },
//   ],
//   DPHARM: [
//     { semesterId: "Semester 1", passCount: 72, failCount: 13 },
//     { semesterId: "Semester 2", passCount: 68, failCount: 14 },
//     { semesterId: "Semester 3", passCount: 63, failCount: 15 },
//     { semesterId: "Semester 4", passCount: 58, failCount: 17 },
//     { semesterId: "Semester 5", passCount: 52, failCount: 18 },
//     { semesterId: "Semester 6", passCount: 47, failCount: 18 },
//   ],
//   PHARMD: [
//     { semesterId: "Semester 1", passCount: 62, failCount: 13 },
//     { semesterId: "Semester 2", passCount: 58, failCount: 14 },
//     { semesterId: "Semester 3", passCount: 53, failCount: 15 },
//     { semesterId: "Semester 4", passCount: 48, failCount: 17 },
//     { semesterId: "Semester 5", passCount: 42, failCount: 18 },
//     { semesterId: "Semester 6", passCount: 38, failCount: 17 },
//   ],
//   "MPHARM-P": [
//     { semesterId: "Semester 1", passCount: 45, failCount: 10 },
//     { semesterId: "Semester 2", passCount: 42, failCount: 10 },
//     { semesterId: "Semester 3", passCount: 38, failCount: 10 },
//     { semesterId: "Semester 4", passCount: 35, failCount: 10 },
//     { semesterId: "Semester 5", passCount: 30, failCount: 10 },
//     { semesterId: "Semester 6", passCount: 28, failCount: 10 },
//   ],
//   "MPHARM-C": [
//     { semesterId: "Semester 1", passCount: 42, failCount: 8 },
//     { semesterId: "Semester 2", passCount: 40, failCount: 8 },
//     { semesterId: "Semester 3", passCount: 37, failCount: 8 },
//     { semesterId: "Semester 4", passCount: 35, failCount: 7 },
//     { semesterId: "Semester 5", passCount: 30, failCount: 8 },
//     { semesterId: "Semester 6", passCount: 27, failCount: 8 },
//   ],
//   "MPHARM-QA": [
//     { semesterId: "Semester 1", passCount: 35, failCount: 7 },
//     { semesterId: "Semester 2", passCount: 33, failCount: 7 },
//     { semesterId: "Semester 3", passCount: 30, failCount: 8 },
//     { semesterId: "Semester 4", passCount: 28, failCount: 7 },
//     { semesterId: "Semester 5", passCount: 25, failCount: 7 },
//     { semesterId: "Semester 6", passCount: 23, failCount: 7 },
//   ],
// };

// // Exam Type Data per semester - Updated keys to match course IDs
// const MOCK_EXAM_TYPES: Record<
//   string,
//   { semesterId: string; examType: string; studentCount: number }[]
// > = {
//   BPHARM: [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 95 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 15 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 10 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 88 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 14 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 13 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 80 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 12 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 18 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 75 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 10 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 20 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 68 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 8 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 22 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 62 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 24 },
//   ],
//   DPHARM: [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 60 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 12 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 13 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 55 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 13 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 14 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 50 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 12 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 16 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 45 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 10 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 20 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 38 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 8 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 24 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 32 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 27 },
//   ],
//   PHARMD: [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 52 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 10 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 13 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 48 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 10 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 14 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 42 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 8 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 18 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 38 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 7 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 20 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 32 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 22 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 28 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 5 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 22 },
//   ],
//   "MPHARM-P": [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 40 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 8 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 7 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 37 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 7 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 8 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 33 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 9 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 30 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 5 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 10 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 26 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 4 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 10 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 23 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 3 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 12 },
//   ],
//   "MPHARM-C": [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 35 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 8 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 7 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 33 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 7 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 8 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 30 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 9 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 28 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 5 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 9 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 24 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 4 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 10 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 22 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 3 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 10 },
//   ],
//   "MPHARM-QA": [
//     { semesterId: "Semester 1", examType: "Regular", studentCount: 30 },
//     { semesterId: "Semester 1", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 1", examType: "ATKT", studentCount: 6 },
//     { semesterId: "Semester 2", examType: "Regular", studentCount: 28 },
//     { semesterId: "Semester 2", examType: "Reval", studentCount: 6 },
//     { semesterId: "Semester 2", examType: "ATKT", studentCount: 6 },
//     { semesterId: "Semester 3", examType: "Regular", studentCount: 25 },
//     { semesterId: "Semester 3", examType: "Reval", studentCount: 5 },
//     { semesterId: "Semester 3", examType: "ATKT", studentCount: 8 },
//     { semesterId: "Semester 4", examType: "Regular", studentCount: 22 },
//     { semesterId: "Semester 4", examType: "Reval", studentCount: 4 },
//     { semesterId: "Semester 4", examType: "ATKT", studentCount: 9 },
//     { semesterId: "Semester 5", examType: "Regular", studentCount: 20 },
//     { semesterId: "Semester 5", examType: "Reval", studentCount: 3 },
//     { semesterId: "Semester 5", examType: "ATKT", studentCount: 9 },
//     { semesterId: "Semester 6", examType: "Regular", studentCount: 18 },
//     { semesterId: "Semester 6", examType: "Reval", studentCount: 3 },
//     { semesterId: "Semester 6", examType: "ATKT", studentCount: 9 },
//   ],
// };

// // Exam Lifecycle Data
// const LIFECYCLE_DATA = [
//   { stage: "Exam Created", students: 450 },
//   { stage: "Students Assigned", students: 435 },
//   { stage: "Seat No. Assigned", students: 425 },
//   { stage: "Hall Ticket Released", students: 410 },
//   { stage: "Marks Entry Done", students: 385 },
//   { stage: "Gazette Generated", students: 355 },
//   { stage: "Result Declared", students: 325 },
// ];

// // Stats Cards
// const STATS_CARDS = [
//   {
//     title: "Total Students",
//     value: "1,580",
//     icon: Users,
//     color: "blue",
//   },
//   {
//     title: "Passing Rate",
//     value: "82.4%",
//     icon: Award,
//     color: "green",
//   },
//   {
//     title: "Exams Conducted",
//     value: "48",
//     icon: Calendar,
//     color: "purple",
//   },
//   {
//     title: "ATKT Students",
//     value: "124",
//     icon: AlertCircle,
//     color: "orange",
//   },
// ];

// // Pie Chart Colors
// const PIE_COLORS = ["#435CFF", "#00AFC0", "#FF6B6B", "#FFD93D", "#6C5CE7"];

// // ============================================================
// // COMPONENT
// // ============================================================

// const DummyDashboard: React.FC = () => {
//   // Set first course as default selected
//   const [selectedCourseId, setSelectedCourseId] = useState<string>(
//     MOCK_COURSES[0]?.courseId || "BPHARM",
//   );
//   const [activeSemester, setActiveSemester] = useState<string>("Semester 1");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [notification, setNotification] = useState<{
//     type: string;
//     message: string;
//   } | null>(null);

//   // Get current course data
//   const currentCourse = MOCK_COURSES.find(
//     (c) => c.courseId === selectedCourseId,
//   );
//   const semesters = MOCK_SEMESTERS[selectedCourseId] || [];
//   const passFailData = MOCK_PASS_FAIL[selectedCourseId] || [];
//   const examTypeData = MOCK_EXAM_TYPES[selectedCourseId] || [];

//   // Get data for selected semester
//   const selectedSemesterData = examTypeData.filter(
//     (d) => d.semesterId === activeSemester,
//   );

//   // Pie chart data for selected semester
//   const pieData = selectedSemesterData.map((d) => ({
//     name: d.examType,
//     value: d.studentCount,
//   }));

//   // Pivot exam type data for bar chart
//   const pivotedExamTypeData = React.useMemo(() => {
//     const map = new Map<
//       string,
//       { semesterId: string; Regular: number; Reval: number; ATKT: number }
//     >();
//     examTypeData.forEach((row) => {
//       if (!map.has(row.semesterId)) {
//         map.set(row.semesterId, {
//           semesterId: row.semesterId,
//           Regular: 0,
//           Reval: 0,
//           ATKT: 0,
//         });
//       }
//       const entry = map.get(row.semesterId)!;
//       if (row.examType === "Regular") entry.Regular = row.studentCount;
//       else if (row.examType === "Reval") entry.Reval = row.studentCount;
//       else if (row.examType === "ATKT") entry.ATKT = row.studentCount;
//     });
//     return Array.from(map.values());
//   }, [examTypeData]);

//   // Notification helper
//   const showNotification = (type: string, message: string) => {
//     setNotification({ type, message });
//     setTimeout(() => setNotification(null), 3000);
//   };

//   // Handle course selection
//   const handleCourseSelect = (courseId: string) => {
//     setIsLoading(true);
//     setSelectedCourseId(courseId);
//     const semesters = MOCK_SEMESTERS[courseId] || [];
//     if (semesters.length > 0) {
//       setActiveSemester(semesters[0].semesterId);
//     }
//     setTimeout(() => {
//       setIsLoading(false);
//       const course = MOCK_COURSES.find((c) => c.courseId === courseId);
//     }, 300);
//   };

//   const handleSemesterSelect = (semesterId: string) => {
//     setActiveSemester(semesterId);
//   };

//   // Filter courses
//   const filteredCourses = MOCK_COURSES.filter(
//     (course) =>
//       course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       course.courseId.toLowerCase().includes(searchTerm.toLowerCase()),
//   );

//   const totalStudents = pieData.reduce((total, item) => total + item.value, 0);

//   return (
//     <div className="min-h-screen bg-gray-50 p-4 md:p-6">
//       {/* Notification Toast */}
//       {notification && (
//         <div
//           className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
//             notification.type === "info"
//               ? "bg-blue-500"
//               : notification.type === "success"
//                 ? "bg-green-500"
//                 : notification.type === "error"
//                   ? "bg-red-500"
//                   : "bg-yellow-500"
//           } text-white max-w-md`}
//         >
//           {notification.message}
//         </div>
//       )}

//       {/* Stats Cards */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//         {STATS_CARDS.map((stat, index) => {
//           const Icon = stat.icon;
//           return (
//             <div
//               key={index}
//               className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
//             >
//               <div className="flex items-start justify-between">
//                 <div>
//                   <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
//                   <p className="text-2xl font-bold text-gray-900 mt-1">
//                     {stat.value}
//                   </p>
//                 </div>
//                 <div
//                   className={`p-2 rounded-lg ${
//                     stat.color === "blue"
//                       ? "bg-blue-50 text-blue-500"
//                       : stat.color === "green"
//                         ? "bg-green-50 text-green-500"
//                         : stat.color === "purple"
//                           ? "bg-purple-50 text-purple-500"
//                           : "bg-orange-50 text-orange-500"
//                   }`}
//                 >
//                   <Icon className="w-5 h-5" />
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Course Cards */}
//       <div className="mb-6">
//         <div className="flex items-center justify-between mb-3">
//           <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Courses</h2>
//           <div className="relative">
//             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search courses..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 md:w-64"
//             />
//           </div>
//         </div>
//         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
//           {filteredCourses.map((course) => (
//             <div
//               key={course.courseId}
//               onClick={() => handleCourseSelect(course.courseId)}
//               className={`cursor-pointer transition-all ${
//                 selectedCourseId === course.courseId
//                   ? "ring-2 ring-blue-500 rounded-xl shadow-md scale-[1.02]"
//                   : "hover:scale-[1.02]"
//               }`}
//             >
//               <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-4 shadow-sm transition-all duration-200 hover:shadow-md">
//                 <div
//                   className={`flex h-14 w-14 items-center justify-center rounded-full ${
//                     selectedCourseId === course.courseId
//                       ? "bg-blue-500 text-white"
//                       : "bg-blue-50 text-blue-600"
//                   }`}
//                 >
//                   <span className="text-lg font-bold">
//                     {course.studentCount}
//                   </span>
//                 </div>
//                 <div className="text-center min-w-0 w-full">
//                   <h3 className="text-xs font-semibold uppercase leading-tight text-[#17213F] dark:text-white truncate">
//                     {course.courseName}
//                   </h3>
//                   <p className="text-xs text-gray-500 dark:text-gray-400">{course.courseId}</p>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Main Layout - Semester Wizard on left, Charts on right */}
//       <div className="flex flex-col lg:flex-row gap-6">
//         {/* Semester Wizard - Fixed on left */}
//         <div className="lg:w-[300px] xl:w-[340px] flex-shrink-0">
//           <div className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] shadow-sm sticky top-4">
//             <div className="border-b-2 border-blue-500 px-6 py-4">
//               <h2 className="text-xl font-medium text-gray-900">
//                 Semester Details
//               </h2>
//               <p className="text-sm text-gray-500">
//                 {currentCourse?.courseName} - {currentCourse?.courseId}
//               </p>
//             </div>
//             <div className="px-6 py-5 max-h-[600px] overflow-y-auto">
//               {isLoading ? (
//                 <div className="flex items-center justify-center py-8">
//                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//                 </div>
//               ) : semesters.length === 0 ? (
//                 <p className="text-sm text-gray-500 text-center py-8">
//                   No semester data available
//                 </p>
//               ) : (
//                 <div className="relative">
//                   <div className="absolute left-[23px] top-5 bottom-5 w-px bg-gray-300 dark:bg-gray-700" />
//                   {semesters.map((semester) => {
//                     const isActive = activeSemester === semester.semesterId;
//                     return (
//                       <div
//                         key={semester.semesterId}
//                         className="relative flex min-h-[79px] cursor-pointer items-center"
//                         onClick={() =>
//                           handleSemesterSelect(semester.semesterId)
//                         }
//                       >
//                         <div
//                           className={`absolute inset-y-0 left-0 right-0 rounded-lg transition-colors ${
//                             isActive
//                               ? "bg-[#E5F7F9]"
//                               : "bg-transparent hover:bg-gray-50"
//                           }`}
//                         />
//                         <div
//                           className={`relative z-10 ml-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] bg-white dark:bg-gray-800 transition-colors ${
//                             isActive
//                               ? "border-[#00AFC0] text-[#00AFC0]"
//                               : "border-blue-500 text-blue-500"
//                           }`}
//                         >
//                           <BookOpenCheck className="h-5 w-5" strokeWidth={2} />
//                         </div>
//                         <div className="relative z-10 ml-4 py-3">
//                           <p
//                             className={`text-base font-medium ${isActive ? "text-gray-900 dark:text-white" : "text-[#17213F] dark:text-gray-200"}`}
//                           >
//                             {semester.semesterId}
//                           </p>
//                           <p
//                             className={`mt-1 text-sm ${isActive ? "text-[#00AFC0]" : "text-gray-700 dark:text-gray-400"}`}
//                           >
//                             Students: {semester.studentCount}
//                           </p>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Right Side - Charts Grid */}
//         <div className="flex-1 min-w-0">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Pass/Fail Chart */}
//             <div className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
//               <div className="flex items-start justify-between mb-2">
//                 <div>
//                   <h2 className="text-sm font-semibold text-gray-900">
//                     Pass / Fail
//                   </h2>
//                   <p className="text-xs text-gray-500">{activeSemester}</p>
//                 </div>
//               </div>
//               <div className="h-[200px] w-full">
//                 {isLoading ? (
//                   <div className="flex items-center justify-center h-full">
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//                   </div>
//                 ) : passFailData.length === 0 ? (
//                   <p className="text-sm text-gray-500 text-center pt-16">
//                     No data available
//                   </p>
//                 ) : (
//                   <ResponsiveContainer width="100%" height="100%">
//                     <BarChart
//                       data={passFailData}
//                       margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
//                       barGap={3}
//                     >
//                       <CartesianGrid vertical={false} stroke="#EEF1F5" />
//                       <XAxis
//                         dataKey="semesterId"
//                         axisLine={false}
//                         tickLine={false}
//                         tick={{ fontSize: 9, fill: "#263238" }}
//                         dy={5}
//                         interval={0}
//                         angle={-15}
//                         textAnchor="end"
//                         height={40}
//                       />
//                       <YAxis
//                         axisLine={false}
//                         tickLine={false}
//                         tick={{ fontSize: 9, fill: "#263238" }}
//                         width={30}
//                       />
//                       <Tooltip
//                         cursor={{ fill: "rgba(67, 92, 255, 0.04)" }}
//                         contentStyle={{
//                           borderRadius: "8px",
//                           border: "1px solid #E5E7EB",
//                           boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
//                           fontSize: "11px",
//                         }}
//                       />
//                       <Bar
//                         dataKey="passCount"
//                         name="Pass"
//                         fill="#00AFC0"
//                         radius={[3, 3, 0, 0]}
//                         maxBarSize={20}
//                       />
//                       <Bar
//                         dataKey="failCount"
//                         name="Fail"
//                         fill="#FF6B6B"
//                         radius={[3, 3, 0, 0]}
//                         maxBarSize={20}
//                       />
//                     </BarChart>
//                   </ResponsiveContainer>
//                 )}
//               </div>
//             </div>

//             {/* Pie Chart - Semester Exam Type Distribution */}
//             <div className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
//               <div className="flex items-start justify-between mb-2">
//                 <div>
//                   <h2 className="text-sm font-semibold text-gray-900">
//                     Exam Type Distribution
//                   </h2>
//                   <p className="text-xs text-gray-500">{activeSemester}</p>
//                 </div>
//               </div>
//               <div className="h-[200px] w-full">
//                 {isLoading ? (
//                   <div className="flex items-center justify-center h-full">
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//                   </div>
//                 ) : pieData.length === 0 ? (
//                   <p className="text-sm text-gray-500 text-center pt-16">
//                     No data available
//                   </p>
//                 ) : (
//                   <ResponsiveContainer width="100%" height="100%">
//                     <PieChart>
//                       <Pie
//                         data={pieData}
//                         cx="50%"
//                         cy="50%"
//                         innerRadius={40}
//                         outerRadius={70}
//                         paddingAngle={3}
//                         dataKey="value"
//                         label={({ name, value }) => `${name} ${value}`}
//                         labelLine={{ stroke: isDark ? "#667085" : "#94A3B8", strokeWidth: 1 }}
//                       >
//                         {pieData.map((entry, index) => (
//                           <Cell
//                             key={`cell-${index}`}
//                             fill={PIE_COLORS[index % PIE_COLORS.length]}
//                           />
//                         ))}
//                       </Pie>

//                       {/* Total in center */}
//                       <text
//                         x="50%"
//                         y="48%"
//                         textAnchor="middle"
//                         dominantBaseline="middle"
//                         className="fill-gray-900 dark:fill-white text-xl font-bold"
//                       >
//                         {totalStudents}
//                       </text>

//                       <text
//                         x="50%"
//                         y="60%"
//                         textAnchor="middle"
//                         dominantBaseline="middle"
//                         className="fill-gray-500 dark:fill-gray-400 text-[10px]"
//                       >
//                         Students
//                       </text>

//                       <Tooltip
//                         contentStyle={{
//                           borderRadius: "8px",
//                           border: "1px solid #E5E7EB",
//                           boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
//                           fontSize: "11px",
//                         }}
//                       />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 )}
//               </div>
//               {/* Legend for Pie Chart */}
//               <div className="flex justify-center gap-4 mt-1">
//                 {pieData.map((item, index) => (
//                   <div key={index} className="flex items-center gap-1">
//                     <span
//                       className="w-2.5 h-2.5 rounded-full"
//                       style={{
//                         backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
//                       }}
//                     />
//                     <span className="text-xs text-gray-600">{item.name}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Exam Lifecycle Chart - Full Width below all charts */}
//           <div className="mt-6 w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
//             <div className="flex items-start justify-between mb-2">
//               <div>
//                 <h2 className="text-sm font-semibold text-gray-900">
//                   Exam Lifecycle Progress
//                 </h2>
//                 <p className="text-xs text-gray-500">
//                   Students moving through each exam stage
//                 </p>
//               </div>
//             </div>
//             <div className="h-[220px] w-full">
//               <ResponsiveContainer width="100%" height="100%">
//                 <AreaChart
//                   data={LIFECYCLE_DATA}
//                   margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
//                 >
//                   <CartesianGrid vertical={false} stroke="#EEF1F5" />
//                   <XAxis
//                     dataKey="stage"
//                     axisLine={false}
//                     tickLine={false}
//                     tick={{ fontSize: 10, fill: "#263238" }}
//                     interval={0}
//                     angle={-15}
//                     textAnchor="end"
//                     height={50}
//                     dy={5}
//                   />
//                   <YAxis
//                     axisLine={false}
//                     tickLine={false}
//                     tick={{ fontSize: 10, fill: "#263238" }}
//                     width={35}
//                     domain={[0, 500]}
//                   />
//                   <Tooltip
//                     cursor={{ stroke: "#435CFF", strokeDasharray: "4 4" }}
//                     contentStyle={{
//                       borderRadius: "8px",
//                       border: "1px solid #E5E7EB",
//                       boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
//                       fontSize: "11px",
//                     }}
//                   />
//                   <Legend wrapperStyle={{ fontSize: "11px" }} />
//                   <Area
//                     type="monotone"
//                     dataKey="students"
//                     name="Students"
//                     stroke="#435CFF"
//                     strokeWidth={2.5}
//                     fill="url(#colorGradient)"
//                   />
//                   <defs>
//                     <linearGradient
//                       id="colorGradient"
//                       x1="0"
//                       y1="0"
//                       x2="0"
//                       y2="1"
//                     >
//                       <stop offset="5%" stopColor="#435CFF" stopOpacity={0.3} />
//                       <stop offset="95%" stopColor="#435CFF" stopOpacity={0} />
//                     </linearGradient>
//                   </defs>
//                 </AreaChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="mt-6 text-center text-sm text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-4">
//         <p>
//           © {new Date().getFullYear()} Exam Dashboard • All data shown is for
//           demonstration purposes only
//         </p>
//       </div>
//     </div>
//   );
// };

// export default DummyDashboard;
