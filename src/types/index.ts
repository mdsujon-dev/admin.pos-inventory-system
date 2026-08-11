export interface TBanner {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  sub_title: string;
  description: string;
  background_image: string;
  buttons: {
    text: string;
    link: string;
  }[];
}

export interface TBanner2 {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle: string;
  description: string;
  feature_projects: string[];
  button_text: string;
  button_link: string;
}
export interface TTrustedTopBrands {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle?: string;
  description?: string;
  brands: {
    name: string;
    logo: string;
  }[];
}

export interface TFeatureBanner {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  button_text: string;
  button_link: string;
}

export interface TFeatures {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle?: string;
  description: string;
  button_text: string;
  button_link: string;
  options: {
    title: string;
    description: string;
  }[];
}

export interface TStats {
  serial_no: number;
  is_hidden: boolean;
  background_image: string;
  stats: {
    count: number;
    suffix: string;
    label: string;
  }[];
}

export interface TKeyBenefits {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle: string;
  description: string;
  options: {
    title: string;
    description: string;
    icon: string;
    metric?: string;
    keywords?: string[];
  }[];
}
export interface TPortfolioOverview {
  serial_no: number;
  is_hidden: boolean;
  image?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  button_text?: string;
  button_link?: string;
}
export interface TStartProjectCTA {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle?: string;
  description: string;
  background_image: string;
  button_text: string;
  button_link: string;
  phone_number: string;
}

export interface TBestFeatures {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle?: string;
  description: string;
  options: {
    title: string;
    description: string;
  }[];
  ourProjects: any
}

export interface TTechStack {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle?: string;
  description: string;
  techs: {
    name: string;
    url: string;
  }[];
}

export interface TPricingPlan {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle?: string;
  description: string;
  plans: {
    name: string;
    description: string;
    // Each plan (e.g. "Web Design") carries one or more variants — each variant
    // is a tier (Basic / Medium / etc.) with its OWN pricing and feature list.
    // `type` is required per variant and must be unique within a plan's variants.
    variants: {
      type: "Basic" | "Medium" | "Standard" | "VIP" | "Custom";
      original_price: string;
      discounted_price: string;
      save?: string | number;
      // Features can be either plain strings (legacy) or objects with a price
      // and an optional category grouping.
      features: (
        | string
        | { name: string; price?: string | number; category?: string }
      )[];
    }[];
  }[];
}

// Standalone Pricing Plan record (own collection). Same plans/variants shape
// as TPricingPlan but without the section-level serial_no / is_hidden fields,
// since those belong to the *service section* that references this record.
export interface IPricingPlan {
  _id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  plans: {
    name: string;
    description: string;
    variants: {
      type?: "Basic" | "Medium" | "Standard" | "VIP" | "Custom";
      original_price: string;
      discounted_price: string;
      save?: string | number;
      features: (
        | string
        | { name: string; price?: string | number; category?: string }
      )[];
    }[];
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TConversionFocusedCTA {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle?: string;
  description: string;
  background_image?: string;
  button_text: string;
  button_link: string;
  phone_number: string;
}

export interface TIndustries {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle?: string;
  description: string;
  industries: {
    name: string;
    icon: string;
  }[];
}

export interface TWorkflow {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle?: string;
  description: string;
  steps: {
    title: string;
    description: string;
    icon?: string;
    color?: string;
    keywords?: string[];
    metric?: string;
  }[];
}

export interface TProcessFlow {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle?: string;
  description: string;
  button_text: string;
  button_link: string;
  steps: {
    title: string;
    description: string;
    icon?: string;
  }[];
}

export interface TTabContent {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle?: string;
  description?: string;
  tabs: {
    tab_title: string;
    tab_content: string;
  }[];
}

export interface TFaqs {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle?: string;
  description: string;
  options: {
    question: string;
    answer: string;
  }[];
}

export interface TCustomerFocusedCTA {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  subtitle?: string;
  description?: string;
  key_points?: string[];
  image?: string;
  button_text?: string;
  button_link?: string;
}

export interface TStartProjectForm {
  serial_no: number;
  is_hidden: boolean;
  title: string;
  short_description: string;
  description: string;
  button_text: string;
  button_link: string;
}

export interface IService {
  slug: string;
  seo_content: {
    meta_title: string;
    meta_description: string;
    canonical_url?: string;
    keywords: string;
    og_image?: string;
  };
  banner: TBanner;
  banner2: TBanner2;
  trusted_top_brands: TTrustedTopBrands;
  feature_banner: TFeatureBanner;
  features: TFeatures;
  stats: TStats;
  key_benefits: TKeyBenefits;
  portfolio_overview: TPortfolioOverview;
  start_project_cta: TStartProjectCTA;
  best_features: TBestFeatures;
  tech_stack: TTechStack;
  pricing_plan: TPricingPlan;
  conversion_focused_cta: TConversionFocusedCTA;
  industries: TIndustries;
  workflow: TWorkflow;
  proccess_flow: TProcessFlow;
  tab_content: TTabContent;
  more_info: string;
  faqs: TFaqs;
  start_project_Form: TStartProjectForm;
  status: string;
  is_deleted: boolean;
}
export interface IReview {
  _id?: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  logo?: string;
  text: string;
  rating?: number;
  isPublished?: boolean;
  serial_no?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IBrands {
  _id?: string;
  name: string;
  description: string;
  logo: string;
  website?: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface IReview {
  _id?: string;
  quote: string;
  name: string;
  role: string;
  avatar?: string;
  type: "video" | "image";
  poster: string;
  videoUrl?: string;
  order?: number;
}


export interface ITechStack {
  name: string;
  description: string;
  logo: string;
}

export interface ITimeMemberSocialLink {
  name?: string;
  link?: string;
}

export type EmploymentType =
  | "Full-time"
  | "Internship"
  | "Freelance"
  | "Contract"
  | "Hybrid"
  | "Part-time"
  | "Remote";

export type JobStatus = "active" | "closed" | "draft";

export interface IJobExtraField {
  label: string;
  options: string[];
}

export interface IJob {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  employment_type: EmploymentType;
  extra_fields?: IJobExtraField[];
  // Per-job toggles for optional applicant fields.
  require_expected_salary?: boolean;
  require_years_of_experience?: boolean;
  expiration_date: string;
  posted_date?: string;
  status?: JobStatus;
  application_count?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type JobApplicationStatus =
  | "new"
  | "reviewed"
  | "shortlisted"
  | "rejected"
  | "hired";

export interface IJobApplicationExtraFieldAnswer {
  label: string;
  answer: string;
}

export interface IJobApplication {
  _id: string;
  career_job: string;
  job_title: string;
  job_slug: string;
  full_name: string;
  email: string;
  phone: string;
  location: { city: string; country: string };
  resume: string;
  cover_letter: string;
  expected_salary?: string;
  years_of_experience?: string;
  extra_field_answers?: IJobApplicationExtraFieldAnswer[];
  status: JobApplicationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITimeMember {
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  designation: string;
  department?: string;
  photoId?: string;
  bio?: string;
  serial_no?: number;
  socialLinks?: ITimeMemberSocialLink[];
  is_new?: boolean;
  isActive?: boolean;
  isTeamLead?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
