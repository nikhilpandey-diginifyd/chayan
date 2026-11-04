import { z } from "zod";

/**
 * Exam taxonomy shared by web, API and (later) the mobile app.
 * The database is seeded from this list, so codes here are the source of truth.
 */
export const EXAM_BODIES = ["UPSC", "SSC"] as const;
export type ExamBody = (typeof EXAM_BODIES)[number];

export const EXAM_CODES = [
  "UPSC_CSE",
  "SSC_CGL",
  "SSC_CHSL",
  "SSC_MTS",
  "SSC_GD",
  "SSC_CPO",
] as const;
export const examCodeSchema = z.enum(EXAM_CODES);
export type ExamCode = z.infer<typeof examCodeSchema>;

export type ExamStageDefinition = {
  code: string;
  name: string;
  nameHi: string;
};

export type ExamDefinition = {
  code: ExamCode;
  body: ExamBody;
  name: string;
  shortName: string;
  nameHi: string;
  stages: ExamStageDefinition[];
};

export const EXAMS: readonly ExamDefinition[] = [
  {
    code: "UPSC_CSE",
    body: "UPSC",
    name: "UPSC Civil Services Examination",
    shortName: "UPSC CSE",
    nameHi: "यूपीएससी सिविल सेवा परीक्षा",
    stages: [
      { code: "PRELIMS", name: "Prelims", nameHi: "प्रारंभिक परीक्षा" },
      { code: "MAINS", name: "Mains", nameHi: "मुख्य परीक्षा" },
      { code: "INTERVIEW", name: "Interview", nameHi: "साक्षात्कार" },
    ],
  },
  {
    code: "SSC_CGL",
    body: "SSC",
    name: "SSC Combined Graduate Level",
    shortName: "SSC CGL",
    nameHi: "एसएससी संयुक्त स्नातक स्तरीय परीक्षा",
    stages: [
      { code: "TIER_1", name: "Tier 1", nameHi: "टियर 1" },
      { code: "TIER_2", name: "Tier 2", nameHi: "टियर 2" },
      { code: "DOCUMENT_VERIFICATION", name: "Document verification", nameHi: "दस्तावेज़ सत्यापन" },
    ],
  },
  {
    code: "SSC_CHSL",
    body: "SSC",
    name: "SSC Combined Higher Secondary Level",
    shortName: "SSC CHSL",
    nameHi: "एसएससी संयुक्त उच्चतर माध्यमिक स्तरीय परीक्षा",
    stages: [
      { code: "TIER_1", name: "Tier 1", nameHi: "टियर 1" },
      { code: "TIER_2", name: "Tier 2", nameHi: "टियर 2" },
      { code: "SKILL_TEST", name: "Skill / typing test", nameHi: "कौशल / टाइपिंग परीक्षा" },
    ],
  },
  {
    code: "SSC_MTS",
    body: "SSC",
    name: "SSC Multi-Tasking Staff",
    shortName: "SSC MTS",
    nameHi: "एसएससी मल्टी-टास्किंग स्टाफ",
    stages: [
      { code: "CBE", name: "Computer-based exam", nameHi: "कंप्यूटर आधारित परीक्षा" },
      { code: "PET_PST", name: "PET / PST (Havaldar)", nameHi: "पीईटी / पीएसटी (हवलदार)" },
    ],
  },
  {
    code: "SSC_GD",
    body: "SSC",
    name: "SSC GD Constable",
    shortName: "SSC GD",
    nameHi: "एसएससी जीडी कांस्टेबल",
    stages: [
      { code: "CBE", name: "Computer-based exam", nameHi: "कंप्यूटर आधारित परीक्षा" },
      { code: "PET_PST", name: "PET / PST", nameHi: "पीईटी / पीएसटी" },
      { code: "MEDICAL", name: "Medical examination", nameHi: "चिकित्सा परीक्षा" },
    ],
  },
  {
    code: "SSC_CPO",
    body: "SSC",
    name: "SSC CPO (Sub-Inspector in Delhi Police and CAPFs)",
    shortName: "SSC CPO",
    nameHi: "एसएससी सीपीओ (दिल्ली पुलिस और सीएपीएफ में उप-निरीक्षक)",
    stages: [
      { code: "PAPER_1", name: "Paper 1", nameHi: "पेपर 1" },
      { code: "PET_PST", name: "PET / PST", nameHi: "पीईटी / पीएसटी" },
      { code: "PAPER_2", name: "Paper 2", nameHi: "पेपर 2" },
    ],
  },
];

export function getExam(code: ExamCode): ExamDefinition {
  const exam = EXAMS.find((e) => e.code === code);
  if (!exam) throw new Error(`Unknown exam code: ${code}`);
  return exam;
}
