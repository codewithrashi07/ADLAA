const CATEGORIES = [
  {
    id: 'documents',
    name: 'Documents & Certificates',
    icon: 'DOC',
    baseComplexity: 2,
    averageDays: 7,
    description: 'Identity proofs, certificates and record corrections.',
    services: [
      { name: 'Income Certificate', days: 10, documents: ['Aadhaar card', 'Salary slip or self-declaration', 'Ration card', 'Residence proof'] },
      { name: 'Caste Certificate', days: 15, documents: ['Aadhaar card', 'Parent caste certificate', 'Residence proof', 'School leaving certificate'] },
      { name: 'Domicile Certificate', days: 12, documents: ['Aadhaar card', 'Residence proof', 'Birth certificate'] },
      { name: 'Birth Certificate', days: 7, documents: ['Hospital record', 'Parent ID proof', 'Address proof'] },
      { name: 'Death Certificate', days: 7, documents: ['Medical certificate of cause of death', 'Applicant ID proof'] },
      { name: 'Marriage Registration', days: 21, documents: ['Age proof of both parties', 'Address proof', 'Marriage photograph', 'Witness ID proofs'] },
      { name: 'Ration Card', days: 20, documents: ['Aadhaar card of all members', 'Residence proof', 'Income declaration'] }
    ]
  },
  {
    id: 'education',
    name: 'Education',
    icon: 'EDU',
    baseComplexity: 2,
    averageDays: 20,
    description: 'Scholarships, admissions and academic verification.',
    services: [
      { name: 'Post-Matric Scholarship', days: 30, documents: ['Income certificate', 'Caste certificate', 'Previous marksheet', 'Bank passbook', 'Institute bonafide'] },
      { name: 'Pre-Matric Scholarship', days: 25, documents: ['Income certificate', 'School bonafide', 'Bank passbook'] },
      { name: 'Merit Scholarship', days: 30, documents: ['Marksheet', 'Institute bonafide', 'Bank passbook'] },
      { name: 'Education Loan Subsidy', days: 45, documents: ['Loan sanction letter', 'Income certificate', 'Admission letter'] },
      { name: 'Migration Certificate', days: 15, documents: ['Final marksheet', 'Fee receipt', 'ID proof'] },
      { name: 'Degree Verification', days: 20, documents: ['Degree certificate copy', 'ID proof'] }
    ]
  },
  {
    id: 'employment',
    name: 'Employment',
    icon: 'JOB',
    baseComplexity: 3,
    averageDays: 25,
    description: 'Job registration, skill schemes and labour benefits.',
    services: [
      { name: 'Employment Exchange Registration', days: 7, documents: ['Aadhaar card', 'Educational certificates', 'Residence proof'] },
      { name: 'Skill Development Enrolment', days: 15, documents: ['Aadhaar card', 'Educational certificate', 'Passport photo'] },
      { name: 'Labour Card', days: 21, documents: ['Aadhaar card', 'Employment proof', 'Bank passbook', 'Passport photo'] },
      { name: 'Unemployment Allowance', days: 30, documents: ['Employment exchange registration', 'Income certificate', 'Bank passbook'] },
      { name: 'MGNREGA Job Card', days: 15, documents: ['Aadhaar card of all adult members', 'Residence proof', 'Passport photos'] }
    ]
  },
  {
    id: 'health',
    name: 'Health Services',
    icon: 'MED',
    baseComplexity: 3,
    averageDays: 18,
    description: 'Health insurance, disability support and medical aid.',
    services: [
      { name: 'Ayushman Bharat Card', days: 10, documents: ['Aadhaar card', 'Ration card', 'Mobile number'] },
      { name: 'Disability Certificate', days: 30, documents: ['Aadhaar card', 'Medical reports', 'Passport photos', 'Residence proof'] },
      { name: 'Medical Reimbursement', days: 40, documents: ['Hospital bills', 'Discharge summary', 'Prescription copies', 'Bank passbook'] },
      { name: 'Maternity Benefit Scheme', days: 25, documents: ['Aadhaar card', 'MCP card', 'Bank passbook'] },
      { name: 'Health Insurance Enrolment', days: 15, documents: ['Aadhaar card', 'Income certificate', 'Family details'] }
    ]
  },
  {
    id: 'financial',
    name: 'Financial Assistance',
    icon: 'FIN',
    baseComplexity: 4,
    averageDays: 35,
    description: 'Pensions, subsidies and direct benefit transfers.',
    services: [
      { name: 'Old Age Pension', days: 45, documents: ['Age proof', 'Income certificate', 'Bank passbook', 'Aadhaar card'] },
      { name: 'Widow Pension', days: 45, documents: ['Death certificate of spouse', 'Income certificate', 'Bank passbook', 'Aadhaar card'] },
      { name: 'Disability Pension', days: 45, documents: ['Disability certificate', 'Income certificate', 'Bank passbook'] },
      { name: 'Housing Subsidy (PMAY)', days: 60, documents: ['Income certificate', 'Land documents', 'Aadhaar card', 'Bank passbook'] },
      { name: 'Farmer Support Scheme', days: 30, documents: ['Land records', 'Aadhaar card', 'Bank passbook'] },
      { name: 'Business Loan Subsidy', days: 50, documents: ['Project report', 'Business registration', 'Bank statement', 'ID proof'] }
    ]
  },
  {
    id: 'government',
    name: 'Government Services',
    icon: 'GOV',
    baseComplexity: 3,
    averageDays: 22,
    description: 'Utilities, licences, taxes and civic requests.',
    services: [
      { name: 'Property Tax Payment', days: 3, documents: ['Property ID', 'Previous receipt', 'Owner ID proof'] },
      { name: 'Water Connection', days: 20, documents: ['Property documents', 'ID proof', 'Site plan'] },
      { name: 'Electricity Connection', days: 15, documents: ['Property documents', 'ID proof', 'Load requirement details'] },
      { name: 'Trade Licence', days: 30, documents: ['Business registration', 'Property documents', 'NOC from owner', 'ID proof'] },
      { name: 'Driving Licence', days: 25, documents: ['Age proof', 'Address proof', 'Learner licence', 'Medical certificate'] },
      { name: 'Grievance Redressal', days: 15, documents: ['ID proof', 'Supporting evidence of complaint'] }
    ]
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'GEN',
    baseComplexity: 2,
    averageDays: 15,
    description: 'Anything that does not fit the categories above.',
    services: [
      { name: 'General Assistance Request', days: 15, documents: ['ID proof', 'Description of requirement'] }
    ]
  }
];

const CATEGORY_MAP = new Map(CATEGORIES.map((category) => [category.id, category]));

function getCategory(id) {
  return CATEGORY_MAP.get(String(id || '').toLowerCase()) || null;
}

function categoryName(id) {
  const category = getCategory(id);
  return category ? category.name : 'Other';
}

module.exports = { CATEGORIES, getCategory, categoryName };
