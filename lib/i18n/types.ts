export type Locale = "id" | "en";

export const LOCALES: Locale[] = ["id", "en"];
export const DEFAULT_LOCALE: Locale = "id";

export const LOCALE_LABELS: Record<Locale, { native: string; english: string; flag: string }> = {
  id: { native: "Indonesia", english: "Indonesian", flag: "🇮🇩" },
  en: { native: "English", english: "English", flag: "🇬🇧" },
};

export interface NavbarCopy {
  home: string;
  products: string;
  trackOrder: string;
  cart: string;
  login: string;
  logout: string;
  helloLabel: (name: string) => string;
  myOrders: string;
  account: string;
  openMenu: string;
  closeMenu: string;
  cartAria: (count: number) => string;
}

export interface FooterCopy {
  tagline: string;
  navigation: string;
  product: string;
  support: string;
  contact: string;
  rights: string;
  poweredBy: string;
}

export interface SectionNavCopy {
  prev: string;
  next: string;
  jump: string;
  labels: {
    hero: string;
    marquee: string;
    products: string;
    why: string;
    how: string;
    cta: string;
    faq: string;
    top: string;
    bottom: string;
  };
}

export interface HomeHeroCopy {
  badge: string;
  headlineLine1: string;
  headlineHighlight: string;
  headlineLine2: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  scroll: string;
  move: string;
}

export interface HomeMarqueeCopy {
  items: string[];
}

export interface WhyWaliCopy {
  badge: string;
  title: string;
  subtitle: string;
  features: { title: string; desc: string }[];
  quote: string;
  quoteAuthor: string;
}

export interface HowToOrderCopy {
  badge: string;
  title: string;
  subtitle: string;
  steps: { title: string; desc: string; time: string }[];
}

export interface ProductShowcaseCopy {
  badge: string;
  title: string;
  subtitle: string;
  addToCart: string;
  viewDetail: string;
  seeAll: string;
  pause: string;
  play: string;
  prev: string;
  next: string;
  outOfStock: string;
  from: string;
  startingFrom: string;
  empty: string;
}

export interface CtaSectionCopy {
  title: string;
  subtitle: string;
  primary: string;
  secondary: string;
}

export interface FaqCopy {
  badge: string;
  title: string;
  subtitle: string;
  items: { q: string; a: string }[];
}

export interface HomeCopy {
  seo: { title: string; description: string };
  hero: HomeHeroCopy;
  marquee: HomeMarqueeCopy;
  why: WhyWaliCopy;
  howToOrder: HowToOrderCopy;
  showcase: ProductShowcaseCopy;
  cta: CtaSectionCopy;
  faq: FaqCopy;
}

export interface CommonCopy {
  loading: string;
  error: string;
  tryAgain: string;
  close: string;
  search: string;
  filter: string;
  all: string;
  free: string;
}

export interface ProductsCopy {
  title: string;
  subtitle: string;
  filter: string;
  allProducts: string;
  sort: string;
  sortNewest: string;
  sortPriceLow: string;
  sortPriceHigh: string;
  sortName: string;
  empty: string;
  emptyDesc: string;
  inStock: string;
  outOfStock: string;
  addToCart: string;
  viewDetail: string;
  from: string;
  color: string;
  size: string;
  quantity: string;
  description: string;
  relatedProducts: string;
}

export interface ProductDetailCopy {
  addToCart: string;
  buyNow: string;
  description: string;
  specifications: string;
  reviews: string;
  noReviews: string;
  inStock: string;
  outOfStock: string;
  stockLeft: (n: number) => string;
  size: string;
  color: string;
  selectSize: string;
  selectColor: string;
  quantity: string;
  shareProduct: string;
  shippingNote: string;
  relatedProducts: string;
  categoryLabel: string;
  loading: string;
  notFound: string;
  notFoundDesc: string;
  backToProducts: string;
}

export interface CartCopy {
  title: string;
  empty: string;
  emptyDesc: string;
  startShopping: string;
  items: string;
  subtotal: string;
  shipping: string;
  shippingCalculated: string;
  total: string;
  checkout: string;
  continueShopping: string;
  remove: string;
  qty: string;
  removeItem: string;
}

export interface CheckoutCopy {
  title: string;
  shippingInfo: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  notes: string;
  notesPlaceholder: string;
  paymentMethod: string;
  orderSummary: string;
  subtotal: string;
  shipping: string;
  total: string;
  placeOrder: string;
  processing: string;
  backToCart: string;
  fillShipping: string;
  fillPayment: string;
  qty: string;
  size: string;
  color: string;
  remove: string;
  pleaseLogin: string;
  pleaseLoginDesc: string;
  login: string;
  continueAsGuest: string;
}

export interface TrackOrderCopy {
  title: string;
  subtitle: string;
  orderIdLabel: string;
  orderIdPlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  search: string;
  notFound: string;
  notFoundDesc: string;
  status: string;
  orderDetails: string;
  items: string;
  shipping: string;
  payment: string;
  total: string;
  pending: string;
  paid: string;
  processing: string;
  shipped: string;
  delivered: string;
  cancelled: string;
}

export interface AccountCopy {
  title: string;
  profile: string;
  orders: string;
  fullName: string;
  email: string;
  phone: string;
  save: string;
  saved: string;
  saveProfile: string;
  noOrders: string;
  viewOrder: string;
  orderDate: string;
  orderStatus: string;
  orderTotal: string;
  loginRequired: string;
  loginRequiredDesc: string;
  login: string;
}

export interface AuthCopy {
  loginTitle: string;
  loginSubtitle: string;
  registerTitle: string;
  registerSubtitle: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  confirmPassword: string;
  login: string;
  register: string;
  noAccount: string;
  haveAccount: string;
  forgotPassword: string;
  orContinueWith: string;
  terms: string;
  and: string;
  privacy: string;
  invalidCredentials: string;
  emailExists: string;
  passwordMismatch: string;
  success: string;
  welcomeBack: (name: string) => string;
  accountCreated: string;
}

export interface ToastCopy {
  addedToCart: string;
  removedFromCart: string;
  loginRequired: string;
  somethingWrong: string;
  orderPlaced: string;
  profileSaved: string;
  copied: string;
}

export interface Messages {
  locale: Locale;
  common: CommonCopy;
  nav: NavbarCopy;
  footer: FooterCopy;
  sectionNav: SectionNavCopy;
  home: HomeCopy;
  products: ProductsCopy;
  productDetail: ProductDetailCopy;
  cart: CartCopy;
  checkout: CheckoutCopy;
  trackOrder: TrackOrderCopy;
  account: AccountCopy;
  auth: AuthCopy;
  toast: ToastCopy;
}
