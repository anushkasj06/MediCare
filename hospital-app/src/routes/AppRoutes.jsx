import React, { Suspense, lazy } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ArrowRight, BadgeCheck, BellRing, CalendarDays, Clock3, FileHeart,
  HeartHandshake, Mail, MapPin, MessageSquareMore, PhoneCall, ShieldCheck,
  Sparkles, Stethoscope, UserRound, Users,
} from 'lucide-react'
import { AuthLayout, DashboardLayout, PublicLayout } from '../components/layout/index.jsx'

const SelectRolePage = lazy(() => import('../pages/auth/SelectRolePage.jsx'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage.jsx'))
const PatientRegister = lazy(() => import('../pages/auth/PatientRegister.jsx'))
const DoctorRegister = lazy(() => import('../pages/auth/DoctorRegister.jsx'))
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword.jsx'))
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword.jsx'))
const VerifyPages = lazy(() => import('../pages/auth/VerifyPages.jsx'))

const PatientDashboard = lazy(() => import('../pages/patient/PatientDashboard.jsx'))
const PatientAppointments = lazy(() => import('../pages/patient/PatientAppointments.jsx'))
const BookAppointment = lazy(() => import('../pages/patient/BookAppointment.jsx'))
const PatientPrescriptions = lazy(() => import('../pages/patient/PatientPrescriptions.jsx'))
const PatientMedicalHistory = lazy(() => import('../pages/patient/PatientMedicalHistory.jsx'))
const PatientReminders = lazy(() => import('../pages/patient/PatientReminders.jsx'))
const PatientProfile = lazy(() => import('../pages/patient/PatientProfile.jsx'))
const PatientNotifications = lazy(() => import('../pages/patient/PatientProfile.jsx').then(module => ({ default: module.PatientNotifications })))

const DoctorDashboard = lazy(() => import('../pages/doctor/DoctorDashboard.jsx').then(module => ({ default: module.DoctorDashboard })))
const DoctorProfile = lazy(() => import('../pages/doctor/DoctorDashboard.jsx').then(module => ({ default: module.DoctorProfile })))
const DoctorVerification = lazy(() => import('../pages/doctor/DoctorDashboard.jsx').then(module => ({ default: module.DoctorVerification })))
const DoctorAvailability = lazy(() => import('../pages/doctor/DoctorDashboard.jsx').then(module => ({ default: module.DoctorAvailability })))
const DoctorAppointments = lazy(() => import('../pages/doctor/DoctorDashboard.jsx').then(module => ({ default: module.DoctorAppointments })))
const UploadPrescription = lazy(() => import('../pages/doctor/DoctorDashboard.jsx').then(module => ({ default: module.UploadPrescription })))
const AddMedicalRecord = lazy(() => import('../pages/doctor/DoctorDashboard.jsx').then(module => ({ default: module.AddMedicalRecord })))
const DoctorPatientDetails = lazy(() => import('../pages/doctor/PatientDetails.jsx'))

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard.jsx').then(module => ({ default: module.AdminDashboard })))
const AdminDoctorVerification = lazy(() => import('../pages/admin/AdminDashboard.jsx').then(module => ({ default: module.AdminDoctorVerification })))
const AdminUsers = lazy(() => import('../pages/admin/AdminDashboard.jsx').then(module => ({ default: module.AdminUsers })))
const AdminLogs = lazy(() => import('../pages/admin/AdminDashboard.jsx').then(module => ({ default: module.AdminLogs })))
const AdminReports = lazy(() => import('../pages/admin/AdminReports.jsx').then(module => ({ default: module.AdminReports })))
const AdminSettings = lazy(() => import('../pages/admin/AdminReports.jsx').then(module => ({ default: module.AdminSettings })))

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

const featuredDoctors = [
  {
    name: 'Dr. Ananya Sharma',
    specialty: 'Cardiologist',
    experience: '12 years experience',
    availability: 'Mon, Wed, Fri',
    description: 'Heart care, ECG review, blood pressure management, and preventive consultations.',
  },
  {
    name: 'Dr. Rohan Mehta',
    specialty: 'Orthopedic Surgeon',
    experience: '10 years experience',
    availability: 'Tue, Thu, Sat',
    description: 'Joint pain, sports injury follow-up, bone health planning, and recovery guidance.',
  },
  {
    name: 'Dr. Priya Nair',
    specialty: 'Dermatologist',
    experience: '8 years experience',
    availability: 'Daily evening slots',
    description: 'Skin concerns, allergy review, long-term treatment tracking, and prescription support.',
  },
]

const faqItems = [
  {
    question: 'How do I book an appointment?',
    answer: 'Create a patient account, open the appointments section, choose a doctor, pick an available slot, and confirm your booking.',
  },
  {
    question: 'Can doctors join directly?',
    answer: 'Yes. Doctors can register, upload verification details, and start receiving appointments after admin approval.',
  },
  {
    question: 'Will I receive medicine reminders?',
    answer: 'Yes. The platform supports reminder scheduling so patients can track medicine and follow-up tasks more easily.',
  },
  {
    question: 'Can I use the system without Cloudinary or Twilio at first?',
    answer: 'Yes. Local development works without those services, and you can connect them later for production-ready uploads and SMS.',
  },
]

function SectionIntro({ badge, title, description }) {
  return (
    <div className="max-w-3xl">
      <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft text-primary px-4 py-2 text-xs font-semibold tracking-wide">
        <Sparkles size={14} />
        {badge}
      </div>
      <h2 className="font-display text-3xl sm:text-4xl font-bold text-text mt-4">{title}</h2>
      <p className="text-text-muted text-base sm:text-lg mt-3 leading-relaxed">{description}</p>
    </div>
  )
}

function HomePage() {
  const highlights = [
    { icon: <CalendarDays size={18} />, title: 'Instant Booking', text: 'Browse doctors, reserve slots, and stay updated from one dashboard.' },
    { icon: <FileHeart size={18} />, title: 'Prescriptions & History', text: 'Keep prescriptions, reminders, and medical records together for faster care.' },
    { icon: <ShieldCheck size={18} />, title: 'Verified System', text: 'Doctors go through approval flow so the platform stays trusted and organized.' },
  ]

  const trustPoints = [
    'Patient and doctor onboarding in one platform',
    'Prescription uploads and reminder tracking',
    'Admin monitoring with reports and logs',
    'Clean role-based experience for every user',
  ]

  return (
    <div className="overflow-hidden">
      <section className="relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 h-72 w-72 rounded-full blur-3xl opacity-40" style={{ background: 'var(--pri-soft)' }} />
          <div className="absolute right-0 top-24 h-80 w-80 rounded-full blur-3xl opacity-30" style={{ background: 'var(--acc-soft)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 py-10 lg:py-16">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 xl:gap-12 items-center">
            <section className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft text-primary px-4 py-2 text-xs font-semibold tracking-wide">
                <HeartHandshake size={14} />
                CareConnect Hospital Platform
              </div>

              <div className="space-y-4">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-text">
                  A better digital front door for patients, doctors, and hospital teams.
                </h1>
                <p className="text-base sm:text-lg text-text-muted max-w-2xl leading-relaxed">
                  From appointment booking to prescription follow-up, CareConnect keeps the full care journey organized in one calm, secure, and easy-to-use experience.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/register/patient" className="btn-primary inline-flex items-center gap-2">
                  Get Started as Patient
                  <ArrowRight size={16} />
                </Link>
                <Link to="/register/doctor" className="btn-secondary">Join as Doctor</Link>
                <Link to="/login" className="btn-secondary">Login</Link>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                <div className="card p-4">
                  <p className="font-display text-2xl font-bold text-primary">24/7</p>
                  <p className="text-sm text-text-muted mt-1">Book care, review prescriptions, and track reminders anytime.</p>
                </div>
                <div className="card p-4">
                  <p className="font-display text-2xl font-bold text-accent">3 Roles</p>
                  <p className="text-sm text-text-muted mt-1">Patient, doctor, and admin experiences designed for their real work.</p>
                </div>
                <div className="card p-4">
                  <p className="font-display text-2xl font-bold text-warning">Smart Flow</p>
                  <p className="text-sm text-text-muted mt-1">Appointments, uploads, verification, and follow-up all stay connected.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="card p-6 lg:p-7">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-text-light">Quick Access</p>
                    <h2 className="font-display text-2xl font-bold text-text mt-2">Choose your starting point</h2>
                  </div>
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--pri-soft)', color: 'var(--pri)' }}>
                    <Stethoscope size={20} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Link to="/register/patient" className="card p-4 flex items-center justify-between hover:border-primary transition-colors">
                    <div>
                      <p className="font-semibold text-text">Patient Portal</p>
                      <p className="text-sm text-text-muted">Register, book doctors, and manage prescriptions in one place.</p>
                    </div>
                    <span className="text-primary font-semibold">Open</span>
                  </Link>

                  <Link to="/register/doctor" className="card p-4 flex items-center justify-between hover:border-primary transition-colors">
                    <div>
                      <p className="font-semibold text-text">Doctor Portal</p>
                      <p className="text-sm text-text-muted">Create an account, submit verification, and manage appointments.</p>
                    </div>
                    <span className="text-primary font-semibold">Open</span>
                  </Link>

                  <Link to="/doctors" className="card p-4 flex items-center justify-between hover:border-primary transition-colors">
                    <div>
                      <p className="font-semibold text-text">Explore Doctors</p>
                      <p className="text-sm text-text-muted">See the available specialties and care areas supported by the app.</p>
                    </div>
                    <span className="text-primary font-semibold">View</span>
                  </Link>
                </div>
              </div>

              <div className="card p-5" style={{ background: 'linear-gradient(135deg, var(--acc-soft), var(--pri-soft))' }}>
                <p className="font-semibold text-text">What this platform helps you manage</p>
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  {trustPoints.map(point => (
                    <div key={point} className="flex items-start gap-2 text-sm text-text-muted">
                      <BadgeCheck size={16} className="text-primary mt-0.5 shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 py-6 lg:py-10">
        <div className="grid md:grid-cols-3 gap-4">
          {highlights.map(item => (
            <div key={item.title} className="card p-5">
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--pri-soft)', color: 'var(--pri)' }}>
                {item.icon}
              </div>
              <h3 className="font-display text-xl font-bold text-text">{item.title}</h3>
              <p className="text-sm text-text-muted mt-2 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 py-10 lg:py-14">
        <SectionIntro
          badge="Featured Doctors"
          title="A cleaner way to discover care"
          description="Patients should be able to quickly understand who is available, what they treat, and when they can book. This homepage now points clearly into that journey."
        />

        <div className="grid lg:grid-cols-3 gap-5 mt-8">
          {featuredDoctors.map(doctor => (
            <div key={doctor.name} className="card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-bold text-text">{doctor.name}</p>
                  <p className="text-primary font-medium mt-1">{doctor.specialty}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--acc-soft)', color: 'var(--acc)' }}>
                  <UserRound size={20} />
                </div>
              </div>
              <p className="text-sm text-text-muted mt-4 leading-relaxed">{doctor.description}</p>
              <div className="space-y-2 mt-5 text-sm text-text-muted">
                <div className="flex items-center gap-2">
                  <BadgeCheck size={15} className="text-primary" />
                  <span>{doctor.experience}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 size={15} className="text-primary" />
                  <span>{doctor.availability}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Link to="/register/patient" className="btn-primary text-sm">Book Now</Link>
                <Link to="/doctors" className="btn-secondary text-sm">See More</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 pb-12 lg:pb-16">
        <div className="card p-6 lg:p-8">
          <div className="grid lg:grid-cols-[1fr_0.8fr] gap-8 items-center">
            <div>
              <SectionIntro
                badge="Need Help Fast?"
                title="Move from homepage to action in one click"
                description="The public experience now includes clear paths to role selection, doctor discovery, FAQs, company information, and contact details so visitors do not get stuck at the first page."
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link to="/about" className="card p-5 hover:border-primary transition-colors">
                <p className="font-semibold text-text">About CareConnect</p>
                <p className="text-sm text-text-muted mt-2">Understand the purpose, values, and system goals behind the platform.</p>
              </Link>
              <Link to="/faq" className="card p-5 hover:border-primary transition-colors">
                <p className="font-semibold text-text">FAQ</p>
                <p className="text-sm text-text-muted mt-2">Quick answers for registration, appointments, reminders, and onboarding.</p>
              </Link>
              <Link to="/contact" className="card p-5 hover:border-primary transition-colors">
                <p className="font-semibold text-text">Contact</p>
                <p className="text-sm text-text-muted mt-2">Share support queries, onboarding questions, or partnership requests.</p>
              </Link>
              <Link to="/select-role" className="card p-5 hover:border-primary transition-colors">
                <p className="font-semibold text-text">Choose Role</p>
                <p className="text-sm text-text-muted mt-2">Start as patient, doctor, or continue to login with your existing account.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function DoctorsPage() {
  return (
    <div className="max-w-7xl mx-auto px-5 py-10 lg:py-14">
      <SectionIntro
        badge="Doctors"
        title="Specialists your patients can discover faster"
        description="This public page gives visitors a more complete first look at the kinds of doctors the platform supports before they move into registration and booking."
      />

      <div className="grid lg:grid-cols-3 gap-5 mt-8">
        {featuredDoctors.map(doctor => (
          <div key={doctor.name} className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-xl font-bold text-text">{doctor.name}</p>
                <p className="text-primary mt-1">{doctor.specialty}</p>
              </div>
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center" style={{ background: 'var(--pri-soft)', color: 'var(--pri)' }}>
                <Stethoscope size={18} />
              </div>
            </div>
            <p className="text-sm text-text-muted mt-4 leading-relaxed">{doctor.description}</p>
            <div className="mt-5 space-y-2 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-primary" />
                <span>{doctor.experience}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 size={15} className="text-primary" />
                <span>{doctor.availability}</span>
              </div>
            </div>
            <Link to="/register/patient" className="btn-primary inline-flex mt-6 text-sm">Continue to Booking</Link>
          </div>
        ))}
      </div>
    </div>
  )
}

function AboutPage() {
  const values = [
    {
      title: 'Simple care coordination',
      text: 'The platform is designed to reduce the friction between registration, booking, prescription sharing, and follow-up reminders.',
    },
    {
      title: 'Clear role separation',
      text: 'Patients, doctors, and admins each get workflows that reflect what they actually need instead of one generic interface.',
    },
    {
      title: 'Practical hospital operations',
      text: 'Doctor verification, reporting, and audit logs support real admin oversight while keeping the patient experience smooth.',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-5 py-10 lg:py-14 space-y-8">
      <SectionIntro
        badge="About"
        title="Built to make digital hospital workflows feel calmer"
        description="CareConnect is a fullstack hospital workflow platform for appointment booking, doctor onboarding, prescription handling, reminders, and administrative monitoring."
      />

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="card p-6 lg:p-8">
          <h3 className="font-display text-2xl font-bold text-text">What this system is solving</h3>
          <p className="text-text-muted leading-relaxed mt-4">
            Hospitals and clinics often end up using disconnected tools for appointments, prescriptions, approvals, and patient follow-up. CareConnect brings those flows together so users spend less time switching contexts and more time moving care forward.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            {values.map(value => (
              <div key={value.title} className="rounded-2xl p-4" style={{ background: 'var(--bg3)' }}>
                <p className="font-semibold text-text">{value.title}</p>
                <p className="text-sm text-text-muted mt-2">{value.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 lg:p-8">
          <h3 className="font-display text-2xl font-bold text-text">Platform modules</h3>
          <div className="space-y-4 mt-5">
            {[
              'Patient and doctor registration',
              'Admin doctor verification',
              'Appointment booking and schedule handling',
              'Prescription upload and medicine reminders',
              'Medical history storage and reporting',
            ].map(item => (
              <div key={item} className="flex items-start gap-3">
                <BadgeCheck size={18} className="text-primary mt-0.5 shrink-0" />
                <span className="text-text-muted">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FAQPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 py-10 lg:py-14">
      <SectionIntro
        badge="FAQ"
        title="Answers to the most common questions"
        description="These questions help new visitors understand how the hospital app works before they register or log in."
      />

      <div className="space-y-4 mt-8">
        {faqItems.map(item => (
          <div key={item.question} className="card p-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--pri-soft)', color: 'var(--pri)' }}>
                <MessageSquareMore size={18} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-text">{item.question}</h3>
                <p className="text-text-muted mt-2 leading-relaxed">{item.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ContactPage() {
  const cards = [
    { icon: <Mail size={18} />, title: 'Email Support', text: 'support@careconnect.local', note: 'For login help, onboarding questions, and technical issues.' },
    { icon: <PhoneCall size={18} />, title: 'Call', text: '+91 90000 00000', note: 'For hospital onboarding or urgent non-medical platform support.' },
    { icon: <MapPin size={18} />, title: 'Office', text: 'CareConnect Operations Desk', note: 'Available for product demos and implementation discussions.' },
    { icon: <BellRing size={18} />, title: 'Response Window', text: 'Mon to Sat, 9 AM to 7 PM', note: 'We reply as quickly as possible for active platform users.' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-5 py-10 lg:py-14">
      <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-6">
        <div className="card p-6 lg:p-8">
          <SectionIntro
            badge="Contact"
            title="Reach the team without searching around"
            description="This page gives your project a proper public contact section and makes the home experience feel complete for visitors and reviewers."
          />
          <div className="mt-6">
            <Link to="/select-role" className="btn-primary inline-flex">Open the App</Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map(card => (
            <div key={card.title} className="card p-5">
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--acc-soft)', color: 'var(--acc)' }}>
                {card.icon}
              </div>
              <p className="font-semibold text-text">{card.title}</p>
              <p className="text-primary mt-1">{card.text}</p>
              <p className="text-sm text-text-muted mt-2 leading-relaxed">{card.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useSelector(state => state.auth)
  const location = useLocation()

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={`/${role}/dashboard`} replace />
  }

  return children
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, role } = useSelector(state => state.auth)

  if (isAuthenticated && role) {
    return <Navigate to={`/${role}/dashboard`} replace />
  }

  return children
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        <Route element={<PublicOnlyRoute><AuthLayout /></PublicOnlyRoute>}>
          <Route path="/select-role" element={<SelectRolePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/patient" element={<PatientRegister />} />
          <Route path="/register/doctor" element={<DoctorRegister />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/verify-email" element={<VerifyPages />} />
          <Route path="/verify-email/:token" element={<VerifyPages />} />
          <Route path="/verify-phone" element={<VerifyPages />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['patient']}><DashboardLayout role="patient" /></ProtectedRoute>}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/appointments" element={<PatientAppointments />} />
          <Route path="/patient/appointments/book" element={<BookAppointment />} />
          <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />
          <Route path="/patient/medical-history" element={<PatientMedicalHistory />} />
          <Route path="/patient/reminders" element={<PatientReminders />} />
          <Route path="/patient/notifications" element={<PatientNotifications />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['doctor']}><DashboardLayout role="doctor" /></ProtectedRoute>}>
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/profile" element={<DoctorProfile />} />
          <Route path="/doctor/verification" element={<DoctorVerification />} />
          <Route path="/doctor/availability" element={<DoctorAvailability />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/patients/:patientId" element={<DoctorPatientDetails />} />
          <Route path="/doctor/prescriptions/new" element={<UploadPrescription />} />
          <Route path="/doctor/medical-records/new" element={<AddMedicalRecord />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout role="admin" /></ProtectedRoute>}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/doctors/pending" element={<AdminDoctorVerification />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
