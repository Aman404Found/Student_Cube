export const COLLEGES = [
  "IIT Delhi (Indian Institute of Technology Delhi)",
  "IIIT Delhi (Indraprastha Institute of Information Technology Delhi)",
  "NIT Delhi (National Institute of Technology Delhi)",
  "DTU (Delhi Technological University)",
  "NSUT (Netaji Subhas University of Technology)",
  "IGDTUW (Indira Gandhi Delhi Technical University for Women)",
  "USICT (University School of Information, Communication and Technology, Dwarka)",
  "USAR (University School of Automation and Robotics, Delhi)",
  "MAIT (Maharaja Agrasen Institute of Technology, Rohini)",
  "MSIT (Maharaja Surajmal Institute of Technology, Janakpuri)",
  "MSI (Maharaja Surajmal Institute, Janakpuri)",
  "BPIT (Bhagwan Parshuram Institute of Technology, Rohini)",
  "BVCOE (Bharati Vidyapeeth's College of Engineering, Paschim Vihar)",
  "ADGITM (Dr. Akhilesh Das Gupta Institute of Technology & Management)",
  "GTBIT (Guru Tegh Bahadur Institute of Technology, Rajouri Garden)",
  "GTB4CEC (Guru Tegh Bahadur 4th Centenary Engineering College)",
  "HMRITM (HMR Institute of Technology & Management)",
  "JMI (Jamia Millia Islamia)",
  "DTC (Delhi Technical Campus, Greater Noida)",
  "TIPS (Trinity Institute of Professional Studies, Dwarka)",
  "VIPS (Vivekananda Institute of Professional Studies, Pitampura)",
  "JEMTEC (JIMS Engineering Management Technical Campus, Greater Noida)",
  "Others",
];

export const OTHER_COLLEGE = "Others";
export const NAMED_COLLEGES = COLLEGES.filter((college) => college !== OTHER_COLLEGE);
export const LEGACY_COLLEGE_ALIASES = NAMED_COLLEGES
  .map((college) => college.split("(")[0].trim())
  .filter((alias, index, aliases) => alias && alias !== NAMED_COLLEGES[index] && aliases.indexOf(alias) === index);
export const NAMED_COLLEGE_STORAGE_OPTIONS = [...NAMED_COLLEGES, ...LEGACY_COLLEGE_ALIASES];
export const COLLEGE_STORAGE_OPTIONS = [...COLLEGES, ...LEGACY_COLLEGE_ALIASES];
export const COLLEGE_FILTER_OPTIONS = COLLEGES;
export const VALID_COLLEGE_FILTERS = new Set(COLLEGE_FILTER_OPTIONS);

const collegeByLegacyAlias = new Map(
  NAMED_COLLEGES.map((college) => [college.split("(")[0].trim(), college]),
);

export const getCollegeFilterValues = (selectedCollege) => {
  if (!NAMED_COLLEGES.includes(selectedCollege)) return [];

  const alias = selectedCollege.split("(")[0].trim();
  return alias && alias !== selectedCollege
    ? [selectedCollege, alias]
    : [selectedCollege];
};

export const normalizeCollegeForStorage = (college) => {
  const selectedCollege = String(college || "").trim();

  if (COLLEGES.includes(selectedCollege)) return selectedCollege;

  return collegeByLegacyAlias.get(selectedCollege) || "";
};
